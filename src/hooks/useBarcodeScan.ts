'use client';

import { useCallback, useState } from 'react';
import { isIsbn } from '@/lib/bookLookup';

interface DetectorLike {
  detect(source: ImageBitmap): Promise<{ rawValue: string }[]>;
}
type DetectorCtor = new (opts: { formats: string[] }) => DetectorLike;

/** 기기 내장 바코드 인식(안드로이드 크롬 등)이 있으면 쓴다. 없으면 null. */
async function nativeDecode(file: File): Promise<string | null> {
  const Ctor = (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
  if (!Ctor) return null;
  const bitmap = await createImageBitmap(file);
  try {
    const found = await new Ctor({ formats: ['ean_13', 'ean_8', 'upc_a'] }).detect(bitmap);
    return found.map((f) => f.rawValue).find(isIsbn) ?? null;
  } finally {
    bitmap.close();
  }
}

/** 내장 인식이 없는 브라우저(아이폰 사파리 등)용. 필요할 때만 라이브러리를 내려받는다. */
async function libraryDecode(file: File): Promise<string | null> {
  const { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } = await import('@zxing/library');
  const hints = new Map<number, unknown>();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A]);
  hints.set(DecodeHintType.TRY_HARDER, true);
  const reader = new BrowserMultiFormatReader(hints as Map<never, never>);
  const url = URL.createObjectURL(file);
  try {
    const result = await reader.decodeFromImageUrl(url);
    const text = result.getText();
    return isIsbn(text) ? text : null;
  } catch {
    return null; // 바코드를 찾지 못함
  } finally {
    URL.revokeObjectURL(url);
    reader.reset();
  }
}

/** 책 뒷면 바코드를 찍은 사진에서 ISBN 을 읽는다. 사진은 저장하지 않는다. */
export function useBarcodeScan() {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scan = useCallback(async (file: File): Promise<string | null> => {
    setIsScanning(true);
    setError(null);
    try {
      let isbn: string | null = null;
      try {
        isbn = await nativeDecode(file);
      } catch {
        isbn = null; // 내장 인식이 실패하면 라이브러리로 다시 시도
      }
      if (!isbn) isbn = await libraryDecode(file);
      if (!isbn) setError('바코드를 읽지 못했어요. 책 뒷면의 ISBN 바코드가 또렷하게 나오게 다시 찍어 주세요.');
      return isbn;
    } catch {
      setError('바코드를 읽는 중 문제가 생겼어요. 다시 시도해 주세요.');
      return null;
    } finally {
      setIsScanning(false);
    }
  }, []);

  return { scan, isScanning, error };
}
