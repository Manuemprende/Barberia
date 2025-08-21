'use client';

import { useEffect, useState } from 'react';
import { onToast } from '@/lib/toast';

type T = { id: number; message: string };

export function ToastViewport() {
  const [toasts, setToasts] = useState<T[]>([]);

  useEffect(() => {
    return onToast(({ message }) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message }]);
      // auto-cierre a los 3.2s
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3200);
    });
  }, []);

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto rounded-lg border border-yellow-600/60 bg-[#121212]/95 px-3 py-2 text-sm text-yellow-50 shadow-lg"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
