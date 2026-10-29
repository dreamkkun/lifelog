import { clsx, type ClassValue } from 'clsx';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Cloud, CloudRain, Snowflake, Sun, type LucideIcon } from 'lucide-react';
import type { RecordType } from '@/types/database.types';

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

export const toISODate = (d: Date) => format(d, 'yyyy-MM-dd');
export const todayISO = () => toISODate(new Date());
export const formatShort = (iso: string) => format(parseISO(iso), 'M월 d일 (EEE)', { locale: ko });
export const formatFull = (iso: string) => format(parseISO(iso), 'yyyy년 M월 d일 (EEE)', { locale: ko });

export const WEATHER_META: Record<string, { label: string; Icon: LucideIcon }> = {
  SUNNY: { label: '맑음', Icon: Sun },
  CLOUDY: { label: '흐림', Icon: Cloud },
  RAINY: { label: '비', Icon: CloudRain },
  SNOWY: { label: '눈', Icon: Snowflake },
};

// 기록 유형별 "잉크 색". dot: 달력 점, rule: 항목 왼쪽 선, text: 유형 글자
export const TYPE_META: Record<
  RecordType,
  { label: string; short: string; dot: string; rule: string; text: string; badge: string }
> = {
  DIARY: { label: '일기', short: '일', dot: 'bg-emerald-500', rule: 'border-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700' },
  BOOK: { label: '독서노트', short: '독', dot: 'bg-indigo-500', rule: 'border-indigo-500', text: 'text-indigo-700', badge: 'bg-indigo-50 text-indigo-700' },
  LECTURE: { label: '강의메모', short: '강', dot: 'bg-amber-500', rule: 'border-amber-500', text: 'text-amber-700', badge: 'bg-amber-50 text-amber-700' },
};

export const ALLOWED_IMAGE_EXT = ['jpg', 'jpeg', 'png', 'webp'];
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** 문제가 있으면 사용자에게 보여줄 메시지를, 없으면 null 을 반환한다. */
export function validateImage(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const okType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
  if (!okType || !ALLOWED_IMAGE_EXT.includes(ext)) return 'JPG, PNG, WEBP 이미지만 첨부할 수 있어요.';
  if (file.size > MAX_IMAGE_BYTES) return '이미지는 10MB 이하만 첨부할 수 있어요.';
  return null;
}
