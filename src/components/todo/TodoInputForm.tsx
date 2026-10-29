'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

/** Enter 로 바로 추가되는 인라인 입력. 공백만 입력하면 무시한다. */
export default function TodoInputForm({
  id,
  placeholder,
  onSubmit,
}: {
  id: string;
  placeholder: string;
  /** 실패하면 입력을 남겨 두기 위해 성공 여부를 돌려준다 */
  onSubmit: (text: string) => Promise<boolean>;
}) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || busy) return;
    setBusy(true);
    const ok = await onSubmit(value);
    setBusy(false);
    if (ok) setText('');
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <label htmlFor={id} className="sr-only">
        할일 추가
      </label>
      <input
        id={id}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        maxLength={200}
        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
      />
      <button
        type="submit"
        disabled={!text.trim() || busy}
        aria-label="할일 추가"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white transition-opacity hover:bg-slate-800 disabled:opacity-30"
      >
        <Plus className="h-4 w-4" />
      </button>
    </form>
  );
}
