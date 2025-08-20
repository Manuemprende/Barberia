import { NextResponse } from 'next/server';
import { COOKIE_NAME } from '@/lib/adminAuth';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  // invalidar cookie
  res.cookies.set({
    name: COOKIE_NAME,
    value: '',
    path: '/',
    maxAge: 0,
  });
  return res;
}
