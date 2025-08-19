// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { createSessionCookie, signAuthJWT } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Falta email o password' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.password) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const token = await signAuthJWT({ sub: user.id, email: user.email })
    const res = NextResponse.json({ ok: true })
    res.headers.set('Set-Cookie', createSessionCookie(token))
    return res
  } catch (e) {
    console.error('POST /api/auth/login error', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
