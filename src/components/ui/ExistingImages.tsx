'use client';

import { X } from 'lucide-react';
import { useSignedUrls } from '@/hooks/useStorageUpload';

/** 수정 화면에서 이미 첨부된 이미지를 보여주고, 빼고 싶은 것은 제거할 수 있게 한다. */
export function ExistingImages({ paths, onRemove }: { paths: string[]; onRemove: (path: string) => void }) {
  const urls = useSignedUrls(paths);
  if (paths.length === 0) return null;
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {paths.map((p) => (
        <li key={p} className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
          {urls[p] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={urls[p]} alt="첨부된 이미지" className="h-full w-full object-cover" />
          )}
          <button
            type="button"
            aria-label="이미지 빼기"
            onClick={() => onRemove(p)}
            className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </li>
      ))}
    </ul>
  );
}
