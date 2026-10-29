'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, Loader2, X } from 'lucide-react';
import { useStorageUpload } from '@/hooks/useStorageUpload';
import { useToast } from '@/components/ui/Toast';
import { validateImage } from '@/lib/utils';

interface Item {
  path: string;
  preview: string;
}

interface Props {
  targetDate: string;
  /** 업로드된 Storage 경로 목록이 바뀔 때마다 호출 */
  onChange: (paths: string[]) => void;
  /** 검증을 통과한 원본 파일이 선택될 때마다 호출 (OCR 연동용) */
  onFileSelected?: (file: File) => void;
}

export function ImageUploader({ targetDate, onChange, onFileSelected }: Props) {
  const { upload, remove, uploading } = useStorageUpload();
  const toast = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [pending, setPending] = useState(0);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(
    () => () => itemsRef.current.forEach((i) => URL.revokeObjectURL(i.preview)),
    [],
  );

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      const invalid = validateImage(file);
      if (invalid) {
        toast(invalid, 'error');
        continue;
      }
      onFileSelected?.(file);
      const preview = URL.createObjectURL(file);
      setPending((n) => n + 1);
      try {
        const path = await upload(file, targetDate);
        const next = [...itemsRef.current, { path, preview }];
        setItems(next);
        onChange(next.map((i) => i.path));
      } catch (e) {
        URL.revokeObjectURL(preview);
        toast(e instanceof Error ? e.message : '업로드에 실패했어요.', 'error');
      } finally {
        setPending((n) => n - 1);
      }
    }
  };

  const removeItem = async (item: Item) => {
    const next = items.filter((i) => i.path !== item.path);
    setItems(next);
    onChange(next.map((i) => i.path));
    URL.revokeObjectURL(item.preview);
    await remove(item.path);
  };

  const btn =
    'inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50';

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <label className={btn + ' cursor-pointer md:hidden'}>
          <Camera className="h-4 w-4" aria-hidden /> 사진 촬영
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </label>
        <label className={btn + ' cursor-pointer'}>
          <ImagePlus className="h-4 w-4" aria-hidden /> 이미지 선택
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </label>
        {uploading && (
          <span className="inline-flex items-center gap-1.5 text-sm text-slate-500" role="status">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> 업로드 중… ({pending})
          </span>
        )}
      </div>
      {items.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {items.map((item) => (
            <li key={item.path} className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.preview} alt="첨부 이미지 미리보기" className="h-full w-full object-cover" />
              <button
                type="button"
                aria-label="이미지 삭제"
                onClick={() => removeItem(item)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
