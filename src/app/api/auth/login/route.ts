import { NextResponse } from 'next/server';
import { COOKIE_NAME, signAdminJWT } from '@/lib/adminAuth';

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({} as any));

  const okEmail = email === process.env.ADMIN_EMAIL;
  const okPass  = password === process.env.ADMIN_PASSWORD;

  if (!okEmail || !okPass) {
    return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
  }

  // 👇 IMPORTANTE: esperar la firma del token
  const token = await signAdminJWT({ email });

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });

  return res;
}
