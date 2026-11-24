import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import * as webpush from 'web-push';
import { createAdminClient } from '@/lib/supabase/admin';
import { TAROT_CARDS } from '@/lib/tarot/cards';
import {
  DEFAULT_EVENING_TIME,
  IGNORED_LIMIT,
  RETURN_GAP_DAYS,
  SUPPLEMENT_WINDOW_MIN,
  daysBetween,
  inSendWindow,
  isValidTime,
  localNow,
} from '@/lib/push/schedule';

// 저녁 미입력 알림 발송. 15분마다 외부 스케줄러(GitHub Actions)가 호출한다.
// 로그인 세션이 없으므로 미들웨어에서 제외하고, 대신 CRON_SECRET 으로 호출자를 확인한다.
export const dynamic = 'force-dynamic';

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = request.headers.get('authorization') ?? '';
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

interface Message {
  title: string;
  body: string;
}

function pickMessage(opts: { returning: boolean; cardName: string | null; firstNotice: boolean }): Message {
  let body: string;
  if (opts.returning) body = '바쁜 며칠을 보내셨나요? 괜찮아요, 오늘부터 다시 천천히 한 줄씩 채워가 봐요.';
  else if (opts.cardName) body = `아침에 뽑은 ‘${opts.cardName}’ 기억나시나요? 오늘 하루의 짧은 답을 남겨보세요.`;
  else body = '오늘 하루, 아직 기록이 비어 있어요. 한 줄 메모나 기분만 남겨도 충분해요.';
  // 시간을 정하지 않은 사용자에게 처음 한 번만 변경 방법을 알려 준다
  if (opts.firstNotice) body += ' 매일 밤 9시에 알려드렸어요. 원하는 시간은 설정에서 바꿀 수 있어요.';
  return { title: 'LifeLog', body };
}

type Admin = NonNullable<ReturnType<typeof createAdminClient>>;

/** 사용자의 모든 기기로 보낸다. 만료된 구독은 지우고, 한 곳이라도 성공하면 true. */
async function deliver(admin: Admin, userId: string, payload: string, result: { removed: number }): Promise<boolean> {
  const { data: subs } = await admin.from('push_subscriptions').select('*').eq('user_id', userId);
  let delivered = 0;
  for (const sub of subs ?? []) {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload, { TTL: 60 * 30 });
      delivered++;
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await admin.from('push_subscriptions').delete().eq('id', sub.id);
        result.removed++;
      }
    }
  }
  return delivered > 0;
}

/** 영양제: 정해 둔 시각에 아직 안 먹었으면, 사용자별로 한 번에 묶어 알린다. 영양제마다 하루 1회. */
async function sendSupplementReminders(admin: Admin, result: { sent: number; skipped: number; removed: number }) {
  const { data: supps, error } = await admin.from('supplements').select('*').eq('is_active', true).eq('remind', true);
  if (error || !supps) return; // 테이블이 아직 없으면 조용히 건너뛴다
  const due = new Map<string, { id: string; name: string; date: string }[]>();
  for (const s of supps) {
    const now = localNow(s.time_zone);
    if (!inSendWindow(now.minutes, s.remind_time, SUPPLEMENT_WINDOW_MIN) || s.last_notified_date === now.date) continue;
    const { count } = await admin
      .from('supplement_logs')
      .select('id', { count: 'exact', head: true })
      .eq('supplement_id', s.id)
      .eq('target_date', now.date);
    if ((count ?? 0) > 0) {
      result.skipped++; // 이미 먹었으면 알리지 않는다
      continue;
    }
    const list = due.get(s.user_id) ?? [];
    list.push({ id: s.id, name: s.name, date: now.date });
    due.set(s.user_id, list);
  }
  for (const [userId, items] of Array.from(due.entries())) {
    const names = items.length > 3 ? `${items.slice(0, 3).map((i) => i.name).join(', ')} 외 ${items.length - 3}개` : items.map((i) => i.name).join(', ');
    const payload = JSON.stringify({ title: '영양제 먹을 시간', body: `${names} 챙겨 드세요.`, url: '/supplements', tag: `supplement-${items[0].date}` });
    if (await deliver(admin, userId, payload, result)) {
      for (const i of items) await admin.from('supplements').update({ last_notified_date: i.date }).eq('id', i.id);
      result.sent++;
    }
  }
}

async function run(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!admin || !pub || !priv) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:noreply@example.com', pub, priv);

  const { data: rows, error } = await admin.from('notification_settings').select('*').eq('evening_enabled', true);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result = { checked: rows?.length ?? 0, sent: 0, skipped: 0, removed: 0 };

  for (const s of rows ?? []) {
    const time = isValidTime(s.evening_time) ? s.evening_time : DEFAULT_EVENING_TIME;
    const now = localNow(s.time_zone);
    if (!inSendWindow(now.minutes, time) || s.last_sent_date === now.date) continue; // 하루 최대 1회

    // 오늘 기록이 한 건이라도 있으면 보내지 않는다
    const { count: todayCount } = await admin
      .from('records')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', s.user_id)
      .eq('target_date', now.date);
    if ((todayCount ?? 0) > 0) {
      result.skipped++;
      continue;
    }

    // 지난 알림 뒤에 기록을 남겼는지로 "무시 누적"을 센다. 계속 무시되면 3일 간격 복귀 알림으로 줄인다.
    let streak = s.ignored_streak;
    if (s.last_sent_date) {
      const { count: afterCount } = await admin
        .from('records')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', s.user_id)
        .eq('target_date', s.last_sent_date);
      streak = (afterCount ?? 0) > 0 ? 0 : streak + 1;
    }
    const returning = streak >= IGNORED_LIMIT;
    if (returning && s.last_sent_date && daysBetween(s.last_sent_date, now.date) < RETURN_GAP_DAYS) {
      result.skipped++;
      continue;
    }

    const { data: subs } = await admin.from('push_subscriptions').select('*').eq('user_id', s.user_id);
    if (!subs || subs.length === 0) continue;

    const { data: tarot } = await admin
      .from('tarot_days')
      .select('card_id, mood')
      .eq('user_id', s.user_id)
      .eq('target_date', now.date)
      .maybeSingle();
    const cardName = tarot && !tarot.mood ? (TAROT_CARDS.find((c) => c.id === tarot.card_id)?.ko ?? null) : null;

    const firstNotice = !s.evening_time && !s.first_notice_sent;
    const message = pickMessage({ returning, cardName, firstNotice });
    const payload = JSON.stringify({ ...message, url: '/new?type=diary', tag: `evening-${now.date}` });

    let delivered = 0;
    for (const sub of subs) {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload, { TTL: 60 * 60 * 3 });
        delivered++;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await admin.from('push_subscriptions').delete().eq('id', sub.id); // 만료된 구독 정리
          result.removed++;
        }
      }
    }
    if (delivered > 0) {
      await admin
        .from('notification_settings')
        .update({ last_sent_date: now.date, ignored_streak: streak, first_notice_sent: s.first_notice_sent || firstNotice, updated_at: new Date().toISOString() })
        .eq('user_id', s.user_id);
      result.sent++;
    }
  }

  await sendSupplementReminders(admin, result);

  return NextResponse.json(result);
}

export const POST = run;
export const GET = run;
