import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SignJWT } from 'jose'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const COOKIE_NAME = 'cm_admin_token'

function getKey() {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('Falta AUTH_SECRET en .env')
  return new TextEncoder().encode(secret)
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Faltan credenciales' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 })
    }

    // Si tu password en DB está en texto plano, sustituye compare por comparación directa (solo para pruebas)
    let valid = false
    try {
      valid = await bcrypt.compare(password, user.password)
    } catch {
      valid = password === user.password
    }
    if (!valid) {
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 })
    }

    // Crear JWT
    const jwt = await new SignJWT({ sub: String(user.id), email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1d')
      .sign(getKey())

    // Set cookie (IMPORTANTE: await cookies())
    const ck = await cookies()
    ck.set(COOKIE_NAME, jwt, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 día
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('POST /api/auth/login error', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}