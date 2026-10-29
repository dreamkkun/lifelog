'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { validateImage } from '@/lib/utils';

const BUCKET = 'record-images';
const MAX_EDGE = 2000;

/** 긴 변을 2000px 이하로 줄여 webp 로 변환한다. */
async function compressToWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('이미지 변환 실패'))), 'image/webp', 0.85),
  );
}

export function useStorageUpload() {
  const [uploading, setUploading] = useState(false);

  /** 업로드한 Storage 경로를 반환한다. 실패 시 Error 를 throw. */
  const upload = useCallback(
    async (file: File, targetDate: string): Promise<string> => {
      const invalid = validateImage(file);
      if (invalid) throw new Error(invalid);

      setUploading(true);
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error('로그인이 필요합니다.');

        const blob = await compressToWebp(file);
        const rand = Math.random().toString(36).slice(2, 6);
        const path = `${user.id}/${targetDate}_${Date.now()}${rand}.webp`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
          contentType: 'image/webp',
          upsert: false,
        });
        if (error) throw new Error(error.message);
        return path;
      } finally {
        setUploading(false);
      }
    },
    [],
  );

  const remove = useCallback(async (path: string) => {
    await createClient().storage.from(BUCKET).remove([path]);
  }, []);

  return { upload, remove, uploading };
}

const urlCache = new Map<string, { url: string; exp: number }>();

/** 비공개 버킷의 경로들을 서명 URL 로 변환한다 (1시간 유효, 캐시). */
export function useSignedUrls(paths: string[] | null | undefined): Record<string, string> {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = (paths ?? []).join('|');

  useEffect(() => {
    const list = key ? key.split('|') : [];
    if (!list.length) return;
    let cancelled = false;
    const now = Date.now();
    const result: Record<string, string> = {};
    const missing: string[] = [];
    for (const p of list) {
      const hit = urlCache.get(p);
      if (hit && hit.exp > now) result[p] = hit.url;
      else missing.push(p);
    }
    setUrls(result);
    if (!missing.length) return;

    createClient()
      .storage.from(BUCKET)
      .createSignedUrls(missing, 3600)
      .then(({ data }) => {
        if (cancelled || !data) return;
        const next = { ...result };
        data.forEach((d, i) => {
          if (d.signedUrl) {
            next[missing[i]] = d.signedUrl;
            urlCache.set(missing[i], { url: d.signedUrl, exp: now + 3500 * 1000 });
          }
        });
        setUrls(next);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return urls;
}
