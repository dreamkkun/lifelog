'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BellRing, Check, ChevronDown, Flame, Loader2, Pill, Plus } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useSupplements, SUPPLEMENT_WINDOW_DAYS } from '@/hooks/useSupplements';
import { useToast } from '@/components/ui/Toast';
import { SUPPLEMENT_CATALOG, SUPPLEMENT_DISCLAIMER, TIMINGS, findCatalog } from '@/lib/supplements/catalog';
import { supplementStats } from '@/lib/supplements/stats';
import { enablePush, isPushActive } from '@/lib/push/client';
import { cn } from '@/lib/utils';
import type { Supplement } from '@/types/routine.types';

const input =
  'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-500 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200';

function AddForm({ onAdd }: { onAdd: (v: { name: string; catalog_key: string | null; dose: string | null; remind: boolean; remind_time: string }) => Promise<boolean> }) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState<string | 'custom' | null>(null);
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [time, setTime] = useState('08:30');
  const [remind, setRemind] = useState(true);
  const [busy, setBusy] = useState(false);
  const picked = key && key !== 'custom' ? findCatalog(key) : undefined;

  const pick = (k: string | 'custom') => {
    setKey(k);
    if (k === 'custom') {
      setName('');
      return;
    }
    const item = findCatalog(k);
    if (item) {
      setName(item.name);
      setTime(TIMINGS[item.timing].time);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    const ok = await onAdd({ name: name.trim(), catalog_key: picked?.key ?? null, dose: dose.trim() || null, remind, remind_time: time });
    setBusy(false);
    if (ok) {
      setOpen(false);
      setKey(null);
      setName('');
      setDose('');
    }
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800">
        <Plus className="h-4 w-4" aria-hidden /> 영양제 추가
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-900">어떤 영양제를 드시나요?</p>
      <div role="group" aria-label="영양제 고르기" className="flex flex-wrap gap-1.5">
        {SUPPLEMENT_CATALOG.map((c) => (
          <button
            key={c.key}
            type="button"
            aria-pressed={key === c.key}
            onClick={() => pick(c.key)}
            className={cn('min-h-9 rounded-full border px-3 text-xs font-semibold transition-colors', key === c.key ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100')}
          >
            {c.name}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={key === 'custom'}
          onClick={() => pick('custom')}
          className={cn('min-h-9 rounded-full border px-3 text-xs font-semibold transition-colors', key === 'custom' ? 'border-slate-900 bg-slate-900 text-white' : 'border-dashed border-slate-300 bg-white text-slate-600 hover:bg-slate-100')}
        >
          직접 입력
        </button>
      </div>

      {key && (
        <>
          {picked && (
            <p className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
              <strong className="text-slate-900">{TIMINGS[picked.timing].label}</strong>을 권해요. {picked.why}
            </p>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="space-y-1 text-xs font-semibold text-slate-700">
              이름
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="예: 비타민 C 1000" className={input} />
            </label>
            <label className="space-y-1 text-xs font-semibold text-slate-700">
              복용량 (선택)
              <input value={dose} onChange={(e) => setDose(e.target.value)} maxLength={40} placeholder="예: 1정, 2알" className={input} />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="space-y-1 text-xs font-semibold text-slate-700">
              알림 시간
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={cn(input, 'w-auto')} />
            </label>
            <label className="mt-5 flex min-h-11 items-center gap-2 text-xs font-semibold text-slate-700">
              <input type="checkbox" checked={remind} onChange={(e) => setRemind(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
              이 시간에 알려 주기
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={!name.trim() || !time || busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-40">
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} 등록
            </button>
            <button type="button" onClick={() => setOpen(false)} className="min-h-11 rounded-xl px-4 text-sm font-semibold text-slate-500 hover:bg-slate-100">
              닫기
            </button>
          </div>
        </>
      )}
      {!key && (
        <button type="button" onClick={() => setOpen(false)} className="min-h-11 text-xs font-semibold text-slate-500 underline underline-offset-2">
          닫기
        </button>
      )}
    </form>
  );
}

function Card({
  s,
  taken,
  stats,
  onToggle,
  onUpdate,
  onStop,
}: {
  s: Supplement;
  taken: boolean;
  stats: ReturnType<typeof supplementStats>;
  onToggle: () => void;
  onUpdate: (patch: Partial<Pick<Supplement, 'remind' | 'remind_time'>>) => void;
  onStop: () => void;
}) {
  const [open, setOpen] = useState(false);
  const cat = findCatalog(s.catalog_key);

  return (
    <li className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-semibold text-slate-900">
            {s.name}
            {s.dose && <span className="ml-1.5 text-xs font-normal text-slate-500">{s.dose}</span>}
          </p>
          <p className="text-xs text-slate-500">
            {s.remind_time}
            {s.remind ? ' 알림' : ' (알림 꺼짐)'}
            {cat && ` · 권장 ${TIMINGS[cat.timing].label}`}
          </p>
        </div>
        <button
          type="button"
          role="checkbox"
          aria-checked={taken}
          aria-label={`${s.name} ${taken ? '먹음 취소' : '먹었어요'}`}
          onClick={onToggle}
          className={cn(
            'flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors',
            taken ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
          )}
        >
          <Check className="h-4 w-4" aria-hidden /> {taken ? '먹었어요' : '먹었나요?'}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
        <span className="flex items-center gap-1 font-semibold text-slate-900">
          <Flame className={cn('h-4 w-4', stats.streak > 0 ? 'text-orange-500' : 'text-slate-300')} aria-hidden />
          {stats.streak >= SUPPLEMENT_WINDOW_DAYS ? `${SUPPLEMENT_WINDOW_DAYS}일 이상` : `${stats.streak}일`} 연속
        </span>
        <span>
          최근 7일 {stats.weekTaken}/{stats.weekCounted}
        </span>
        <ol aria-label="최근 7일" className="ml-auto flex gap-1">
          {stats.last7.map((d) => (
            <li key={d.date} title={d.date} aria-label={`${d.date} ${d.taken ? '먹음' : d.counted ? '안 먹음' : '시작 전'}`} className={cn('h-3.5 w-3.5 rounded', d.taken ? 'bg-emerald-500' : d.counted ? 'bg-rose-200' : 'bg-slate-100')} />
          ))}
        </ol>
      </div>

      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="flex min-h-9 items-center gap-1 text-xs font-semibold text-slate-600">
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} aria-hidden /> 효능·섭취 팁·설정
      </button>
      {open && (
        <div className="space-y-3 border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-600">
          {cat ? (
            <>
              <p>
                <strong className="text-slate-900">언제 먹나요: </strong>
                {TIMINGS[cat.timing].label} · {cat.why}
              </p>
              <div>
                <strong className="text-slate-900">알려진 효능</strong>
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {cat.benefits.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
              {cat.caution && (
                <p className="rounded-lg bg-amber-50 p-2 text-amber-800">
                  <strong>주의: </strong>
                  {cat.caution}
                </p>
              )}
            </>
          ) : (
            <p>직접 입력한 영양제예요. 제품 라벨의 복용법과 효능을 확인해 주세요.</p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 font-semibold text-slate-700">
              알림 시간
              <input type="time" value={s.remind_time} onChange={(e) => e.target.value && onUpdate({ remind_time: e.target.value })} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm" />
            </label>
            <label className="flex min-h-11 items-center gap-2 font-semibold text-slate-700">
              <input type="checkbox" checked={s.remind} onChange={(e) => onUpdate({ remind: e.target.checked })} className="h-4 w-4 rounded border-slate-300" />
              알려 주기
            </label>
            <button type="button" onClick={onStop} className="ml-auto min-h-11 text-xs font-semibold text-rose-600 underline underline-offset-2">
              복용 그만두기
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function Supplements({ userId }: { userId: string }) {
  const toast = useToast();
  const { today, supplements, logs, takenToday, error, add, update, stop, toggleTaken } = useSupplements(userId);
  const [pushOn, setPushOn] = useState<boolean | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);

  useEffect(() => {
    isPushActive().then(setPushOn);
  }, []);

  const needPush = (supplements ?? []).some((s) => s.remind);

  const turnOnPush = useCallback(async () => {
    setPushBusy(true);
    setPushError(null);
    const r = await enablePush(userId);
    setPushBusy(false);
    if (r.ok) {
      setPushOn(true);
      toast('이 기기에서 영양제 알림을 받을 수 있어요.');
    } else setPushError(r.error);
  }, [userId, toast]);

  if (supplements === null) return <div className="h-40 animate-pulse rounded-2xl bg-slate-200/70" role="status" aria-label="불러오는 중" />;

  const done = supplements.filter((s) => takenToday.has(s.id)).length;

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="text-xs text-rose-600">
          {error}
        </p>
      )}

      {supplements.length > 0 && (
        <p className="text-sm font-semibold text-slate-900">
          오늘 {supplements.length}개 중 {done}개 먹었어요
          {done === supplements.length && ' 🎉'}
        </p>
      )}

      {needPush && pushOn === false && (
        <div className="space-y-2 rounded-xl border border-indigo-200 bg-indigo-50 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-indigo-900">
            <BellRing className="h-4 w-4" aria-hidden /> 이 기기에서 알림을 켜야 먹을 시간에 알려 드려요.
          </p>
          <button type="button" disabled={pushBusy} onClick={turnOnPush} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-700 px-4 text-xs font-semibold text-white disabled:opacity-50">
            {pushBusy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} 알림 켜기
          </button>
          {pushError && (
            <p role="alert" className="text-xs text-rose-600">
              {pushError}
            </p>
          )}
        </div>
      )}

      {supplements.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
          <Pill className="mx-auto h-6 w-6 text-slate-400" aria-hidden />
          <p className="mt-2 text-sm font-semibold text-slate-800">복용 중인 영양제를 등록해 보세요</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">영양제마다 먹기 좋은 시간에 알려 주고, 효능과 매일 먹었는지 체크할 수 있어요.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {supplements.map((s) => (
            <Card
              key={s.id}
              s={s}
              taken={takenToday.has(s.id)}
              stats={supplementStats(s, logs, today)}
              onToggle={async () => {
                const err = await toggleTaken(s.id);
                if (err) toast(`체크하지 못했어요: ${err}`, 'error');
              }}
              onUpdate={async (patch) => {
                const err = await update(s.id, patch);
                if (err) toast(`저장하지 못했어요: ${err}`, 'error');
                else if (patch.remind) isPushActive().then(setPushOn);
              }}
              onStop={async () => {
                if (!window.confirm(`"${s.name}" 복용을 그만둘까요?\n지금까지의 체크 기록은 남고, 알림만 멈춰요.`)) return;
                const err = await stop(s.id);
                if (err) toast(`처리하지 못했어요: ${err}`, 'error');
              }}
            />
          ))}
        </ul>
      )}

      <AddForm
        onAdd={async (v) => {
          const err = await add(v);
          if (err) {
            toast(`등록하지 못했어요: ${err}`, 'error');
            return false;
          }
          toast(`${v.name} 을(를) 등록했어요.`);
          if (v.remind) isPushActive().then(setPushOn);
          return true;
        }}
      />

      <p className="text-xs leading-relaxed text-slate-500">{SUPPLEMENT_DISCLAIMER}</p>
    </div>
  );
}

export default function SupplementsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      router.replace('/login');
      return;
    }
    let cancelled = false;
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (cancelled) return;
        if (!user) router.replace('/login');
        else setUserId(user.id);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" aria-hidden /> 메인으로 돌아가기
      </Link>
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-slate-900">영양제</h1>
        <p className="mt-1 text-sm text-slate-500">먹기 좋은 시간에 알려 드리고, 매일 먹었는지 체크해요.</p>
      </div>
      {userId ? <Supplements userId={userId} /> : <div className="h-40 animate-pulse rounded-2xl bg-slate-200/70" />}
    </div>
  );
}
