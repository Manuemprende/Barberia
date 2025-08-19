// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { AUTH_COOKIE, verifyAuthJWT } from '@/lib/auth'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Permitir el login sin token
  if (pathname.startsWith('/admin/login')) {
    return NextResponse.next()
  }

  // Proteger todo /admin
  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get(AUTH_COOKIE)?.value
    if (!token) {
      const url = new URL('/admin/login', req.url)
      return NextResponse.redirect(url)
    }
    try {
      await verifyAuthJWT(token)
      return NextResponse.next()
    } catch {
      const url = new URL('/admin/login', req.url)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
