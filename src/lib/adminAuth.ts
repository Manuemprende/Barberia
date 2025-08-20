// src/lib/adminAuth.ts
import { SignJWT, jwtVerify } from 'jose';

export const COOKIE_NAME = 'admin_token';

// Generar un JWT válido por 7 días
export async function signAdminJWT(payload: { email: string }) {
  const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);
}

// Verificar el token y devolver el payload
export async function verifyAdminJWT(token: string) {
  const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);
  const { payload } = await jwtVerify(token, secret);
  return payload as { email: string; iat: number; exp: number };
}
