// src/middleware.ts
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const COOKIE_NAME = 'cm_admin_token'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get(COOKIE_NAME)?.value

  const isAdminPath = pathname.startsWith('/admin')
  const isLoginPage = pathname === '/admin/login'

  // Proteger /admin/* excepto /admin/login
  if (isAdminPath && !isLoginPage) {
    if (!token) {
      const url = req.nextUrl.clone()
      url.pathname = '/admin/login'
      url.searchParams.set('next', pathname) // opcional
      return NextResponse.redirect(url)
    }
  }

  // Si ya está logueado y entra a /admin/login, mandarlo al dashboard
  if (isLoginPage && token) {
    const url = req.nextUrl.clone()
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

// IMPORTANTÍSIMO: no incluir /admin/login en el matcher
export const config = {
  matcher: ['/admin/:path*'],
}