// src/lib/auth.ts
import { SignJWT, jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret')
export const AUTH_COOKIE = 'cm_token'

// Firma un JWT por 7 días
export async function signAuthJWT(payload: object) {
  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET)
}

export async function verifyAuthJWT(token: string) {
  const { payload } = await jwtVerify(token, SECRET)
  return payload
}

// Crea cabecera Set-Cookie
export function createSessionCookie(token: string) {
  const isProd = process.env.NODE_ENV === 'production'
  const cookie = [
    `${AUTH_COOKIE}=${token}`,
    'HttpOnly',
    'Path=/' ,
    'SameSite=Lax',
    isProd ? 'Secure' : '',
    // 7 días
    `Max-Age=${60 * 60 * 24 * 7}`
  ].filter(Boolean).join('; ')
  return cookie
}

// Cookie para borrar sesión
export function clearSessionCookie() {
  const cookie = [
    `${AUTH_COOKIE}=`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    'Max-Age=0'
  ].join('; ')
  return cookie
}
