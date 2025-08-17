import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

export const COOKIE_NAME = 'cm_admin_token'

function getSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET no está definido en .env')
  return new TextEncoder().encode(secret)
}

export async function createToken(payload: object) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret())
  return payload
}

export async function setSessionCookie(token: string) {
  // 👇 importante: await cookies() en Next 15
  const jar = await cookies()
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 días
  })
}

export async function clearSessionCookie() {
  const jar = await cookies()
  jar.delete(COOKIE_NAME)
}
