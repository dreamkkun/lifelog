// 저녁 미입력 알림의 발송 시점 계산(순수 함수). 서버 발송 라우트가 쓴다.

export const DEFAULT_EVENING_TIME = '21:00';
/** 정해진 시각 이후 이 시간(분) 안에 스케줄러가 깨어나면 보낸다. 스케줄러가 조금 늦어도 놓치지 않기 위한 여유. */
export const SEND_WINDOW_MIN = 90;
/** 보내도 기록이 없는 날이 이만큼 이어지면 매일이 아니라 3일 간격 복귀 알림으로 줄인다. */
export const IGNORED_LIMIT = 3;
export const RETURN_GAP_DAYS = 3;

export function isValidTime(v: string | null | undefined): v is string {
  return !!v && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
}

/** 해당 시간대의 지금 날짜(YYYY-MM-DD)와 자정 이후 경과 분. */
export function localNow(timeZone: string, now = new Date()): { date: string; minutes: number } {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-CA', { timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(now);
  } catch {
    return localNow('Asia/Seoul', now); // 알 수 없는 시간대면 한국 시간으로
  }
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  return { date: `${get('year')}-${get('month')}-${get('day')}`, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function daysBetween(fromDate: string, toDate: string): number {
  return Math.round((Date.parse(`${toDate}T00:00:00Z`) - Date.parse(`${fromDate}T00:00:00Z`)) / 86_400_000);
}

/** 영양제 알림은 제때 와야 의미가 있어서 구간을 더 좁게 잡는다. */
export const SUPPLEMENT_WINDOW_MIN = 45;

/** 지금이 발송 구간(정해진 시각 ~ +width분)인지. */
export function inSendWindow(minutes: number, target: string, width: number = SEND_WINDOW_MIN): boolean {
  const start = toMinutes(target);
  return minutes >= start && minutes < start + width;
}
