// 브라우저 쪽 푸시 구독 도우미: 권한을 묻고, 이 기기를 구독해서 서버(push_subscriptions)에 저장한다.
import { createClient } from '@/lib/supabase/client';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

export function pushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function pushConfigured(): boolean {
  return !!VAPID_PUBLIC_KEY;
}

function keyBytes(base64Url: string): Uint8Array<ArrayBuffer> {
  const pad = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const raw = atob((base64Url + pad).replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** 이 기기가 알림을 받을 수 있는 상태인지(권한 허용 + 구독 존재). */
export async function isPushActive(): Promise<boolean> {
  if (!pushSupported() || Notification.permission !== 'granted') return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    return !!(await reg.pushManager.getSubscription());
  } catch {
    return false;
  }
}

/** 권한을 묻고 구독을 저장한다. 실패하면 사용자에게 보여 줄 문구를 error 로 돌려준다. */
export async function enablePush(userId: string): Promise<{ ok: true } | { ok: false; error: string; permission: NotificationPermission }> {
  if (!pushSupported()) {
    return { ok: false, error: '이 브라우저에서는 알림을 받을 수 없어요. 아이폰은 홈 화면에 추가한 앱으로 열어야 해요(iOS 16.4 이상).', permission: 'default' };
  }
  if (!VAPID_PUBLIC_KEY) return { ok: false, error: '알림 서버 설정이 아직 끝나지 않았어요.', permission: Notification.permission };
  const permission = await Notification.requestPermission();
  if (permission === 'denied') return { ok: false, error: '알림이 차단돼 있어요. 설정 → 알림에서 차단을 푸는 방법을 확인해 주세요.', permission };
  if (permission !== 'granted') {
    return { ok: false, error: '알림 허용 창에서 선택하지 않았어요. 다시 켜고 뜨는 창에서 ‘허용’을 눌러 주세요.', permission };
  }
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC_KEY) }));
    const json = sub.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) throw new Error('이 기기의 알림 정보를 만들지 못했어요.');
    const { error } = await createClient()
      .from('push_subscriptions')
      .upsert({ user_id: userId, endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth }, { onConflict: 'endpoint' });
    if (error) throw new Error(error.message);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '알림을 켜지 못했어요.', permission };
  }
}
