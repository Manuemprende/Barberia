// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE = 'admin_token';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Permitir la pantalla de login
  if (pathname.startsWith('/admin/login')) {
    return NextResponse.next();
  }

  // Proteger /admin/** excepto /admin/login
  if (pathname.startsWith('/admin/**')) {
    const token = req.cookies.get(COOKIE)?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    try {
      const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);
      await jwtVerify(token, secret); // lanza si no es válido
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
