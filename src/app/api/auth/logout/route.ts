import { NextResponse } from 'next/server';
import { COOKIE_NAME } from '@/lib/adminAuth';

// 🔹 POST -> versión JSON (para fetch)
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

// 🔹 GET -> versión redirect (para navegación en browser)
export async function GET(req: Request) {
  const res = NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'));

  // invalidar cookie
  res.cookies.set({
    name: COOKIE_NAME,
    value: '',
    path: '/',
    maxAge: 0,
  });

  return res;
}
