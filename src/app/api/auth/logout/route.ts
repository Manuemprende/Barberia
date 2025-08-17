import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'cm_admin_token'

export async function POST() {
  const ck = await cookies()
  ck.set(COOKIE_NAME, '', { path: '/', maxAge: 0 })
  return NextResponse.json({ ok: true })
}