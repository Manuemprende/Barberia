'use client';

export type AppToastDetail = { message: string };

const EVENT_NAME = 'app:toast';

export function toast(message: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<AppToastDetail>(EVENT_NAME, { detail: { message } }));
}

export function onToast(cb: (d: AppToastDetail) => void) {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => cb((e as CustomEvent<AppToastDetail>).detail);
  window.addEventListener(EVENT_NAME, handler as EventListener);
  return () => window.removeEventListener(EVENT_NAME, handler as EventListener);
}
