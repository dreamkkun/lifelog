'use client';

import { useCallback, useEffect, useState } from 'react';
import { BellRing, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { DEFAULT_EVENING_TIME, isValidTime } from '@/lib/push/schedule';
import type { NotificationSettings as Settings } from '@/types/routine.types';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
const MISSING_TABLE_HINT = '알림 설정 테이블이 아직 없어요. Supabase 에서 supabase/schema.sql 을 다시 실행해 주세요.';
const isMissingTable = (message: string) => /notification_settings|push_subscriptions|schema cache|does not exist/i.test(message);

function keyBytes(base64Url: string): Uint8Array<ArrayBuffer> {
  const pad = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const raw = atob((base64Url + pad).replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

type Support = 'checking' | 'ok' | 'unsupported' | 'unconfigured';

/**
 * 설정의 알림: 저녁 기록 리마인드를 켜고 끄고, 시간을 정한다.
 * 시간을 정하지 않으면 기본(밤 9시)으로 오고, 명시적으로 끄면 아무 알림도 가지 않는다.
 */
export default function NotificationSettings({ userId }: { userId: string }) {
  const toast = useToast();
  const [support, setSupport] = useState<Support>('checking');
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [time, setTime] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setSupport('unsupported');
      return;
    }
    if (!VAPID_PUBLIC_KEY) {
      setSupport('unconfigured');
      return;
    }
    setSupport('ok');
    setPermission(Notification.permission);
    try {
      const reg = await navigator.serviceWorker.ready;
      setSubscribed(!!(await reg.pushManager.getSubscription()));
    } catch {
      setSubscribed(false);
    }
    const { data, error: err } = await createClient().from('notification_settings').select('*').eq('user_id', userId).maybeSingle();
    if (err) setError(isMissingTable(err.message) ? MISSING_TABLE_HINT : err.message);
    const row = (data as Settings | null) ?? null;
    setSettings(row);
    setTime(row?.evening_time ?? '');
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const explicitlyOff = settings?.evening_enabled === false;
  const on = support === 'ok' && subscribed && permission === 'granted' && !explicitlyOff;

  const saveSettings = async (patch: Partial<Settings>) => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul';
    const { data, error: err } = await createClient()
      .from('notification_settings')
      .upsert({ user_id: userId, time_zone: tz, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      .select()
      .single();
    if (err) throw new Error(isMissingTable(err.message) ? MISSING_TABLE_HINT : err.message);
    setSettings(data as Settings);
    setTime((data as Settings).evening_time ?? '');
  };

  const turnOn = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      // 닫힌 경우(default)와 차단된 경우(denied)는 해결 방법이 달라서 따로 안내한다
      if (result === 'denied') throw new Error('알림이 차단돼 있어요. 아래 방법으로 허용한 뒤 다시 켜 주세요.');
      if (result !== 'granted') throw new Error('알림 허용 창에서 선택하지 않았어요. 스위치를 다시 켜고 뜨는 창에서 ‘허용’을 눌러 주세요. 창이 안 뜨면 주소창 오른쪽의 종 모양 아이콘이나 왼쪽 자물쇠에서 알림을 허용해 주세요.');
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC_KEY) }));
      const json = sub.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) throw new Error('이 기기의 알림 정보를 만들지 못했어요.');
      const { error: err } = await createClient()
        .from('push_subscriptions')
        .upsert({ user_id: userId, endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth }, { onConflict: 'endpoint' });
      if (err) throw new Error(isMissingTable(err.message) ? MISSING_TABLE_HINT : err.message);
      await saveSettings({ evening_enabled: true });
      setSubscribed(true);
      toast('저녁 기록 알림을 켰어요.');
    } catch (e) {
      setError(e instanceof Error ? e.message : '알림을 켜지 못했어요.');
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async () => {
    setBusy(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      // 영양제 알림을 쓰고 있으면 이 기기의 구독은 남겨 둔다(저녁 리마인드만 끈다)
      const { count: supplementReminders } = await createClient().from('supplements').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('remind', true).eq('is_active', true);
      if (sub && !(supplementReminders && supplementReminders > 0)) {
        await createClient().from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        await sub.unsubscribe();
      }
      await saveSettings({ evening_enabled: false }); // 명시적으로 끈 상태: 기본 시간으로도 보내지 않는다
      setSubscribed(false);
      toast('저녁 기록 알림을 껐어요.');
    } catch (e) {
      setError(e instanceof Error ? e.message : '알림을 끄지 못했어요.');
    } finally {
      setBusy(false);
    }
  };

  const changeTime = async (value: string) => {
    setTime(value);
    if (value && !isValidTime(value)) return;
    setBusy(true);
    setError(null);
    try {
      await saveSettings({ evening_time: value || null });
      toast(value ? `${value} 에 알려 드릴게요.` : '기본 시간(밤 9시)으로 되돌렸어요.');
    } catch (e) {
      setError(e instanceof Error ? e.message : '시간을 저장하지 못했어요.');
    } finally {
      setBusy(false);
    }
  };

  const testHere = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification('LifeLog', { body: '알림이 잘 와요. 이 기기에서 확인한 테스트예요.', icon: '/apple-touch-icon.png', tag: 'lifelog-test' });
    } catch {
      setError('테스트 알림을 띄우지 못했어요. 알림 권한을 확인해 주세요.');
    }
  };

  if (support === 'checking') return <div className="h-16 animate-pulse rounded-xl bg-slate-200/70" role="status" aria-label="불러오는 중" />;

  if (support === 'unsupported') {
    return (
      <p className="text-xs leading-relaxed text-slate-500">
        이 브라우저에서는 알림을 받을 수 없어요. 아이폰은 사파리에서 &lsquo;홈 화면에 추가&rsquo;한 앱으로 열어야 알림을 켤 수 있어요(iOS 16.4 이상).
      </p>
    );
  }
  if (support === 'unconfigured') {
    return <p className="text-xs leading-relaxed text-slate-500">알림 기능을 준비하고 있어요. 서버 설정이 끝나면 여기서 켤 수 있어요.</p>;
  }

  const effective = time && isValidTime(time) ? time : DEFAULT_EVENING_TIME;

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-slate-500">
        오늘 일기·독서·강의·메모를 한 건도 남기지 않았을 때만, 하루 한 번 가볍게 알려 드려요. 이미 기록했다면 오지 않아요.
      </p>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <BellRing className="h-4 w-4 shrink-0" aria-hidden /> 저녁 기록 리마인드
          </p>
          <p className="text-xs text-slate-500">
            {on ? `매일 ${effective}${time ? '' : '(기본)'}에 알려요` : explicitlyOff ? '꺼져 있어요' : '아직 켜지 않았어요'}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="저녁 기록 리마인드 알림"
          disabled={busy}
          onClick={on ? turnOff : turnOn}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${on ? 'bg-slate-900' : 'bg-slate-300'}`}
        >
          <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
          {busy && <Loader2 className="absolute -left-6 h-4 w-4 animate-spin text-slate-500" aria-hidden />}
        </button>
      </div>

      {on && (
        <div className="space-y-2">
          <label htmlFor="evening-time" className="block text-xs font-semibold text-slate-700">
            알림 시간
          </label>
          <div className="flex items-center gap-2">
            <input
              id="evening-time"
              type="time"
              value={time}
              disabled={busy}
              onChange={(e) => changeTime(e.target.value)}
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
            />
            {time && (
              <button type="button" onClick={() => changeTime('')} disabled={busy} className="min-h-11 text-xs font-semibold text-slate-500 underline underline-offset-2">
                기본(밤 9시)으로
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500">시간을 정하지 않으면 밤 9시에 알려 드려요. 계속 기록이 없으면 3일 간격으로 줄여요.</p>
          <button type="button" onClick={testHere} className="min-h-11 text-xs font-semibold text-slate-600 underline underline-offset-2">
            이 기기에서 알림 확인하기
          </button>
        </div>
      )}

      {permission === 'denied' && (
        <div role="alert" className="space-y-1 rounded-xl bg-rose-50 p-3 text-xs leading-relaxed text-rose-700">
          <p className="font-semibold">알림이 차단돼 있어요.</p>
          <p>컴퓨터: 주소창 왼쪽 자물쇠(설정) 아이콘 → 알림 → 허용으로 바꾼 뒤 새로고침해 주세요.</p>
          <p>안드로이드: 설치한 앱 아이콘을 길게 눌러 앱 정보 → 알림을 켜 주세요. 크롬에서는 사이트 설정의 알림을 허용해 주세요.</p>
          <p>아이폰: 설정 → 알림 → LifeLog에서 알림 허용을 켜 주세요. 홈 화면에 추가한 앱으로 열어야 해요.</p>
        </div>
      )}
      {error && permission !== 'denied' && (
        <p role="alert" className="text-xs text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
