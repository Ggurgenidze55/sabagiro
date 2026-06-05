import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { cache } from 'react';
import type { Role, VerificationStatus } from '@/generated/prisma/client';
import { prisma } from '@/lib/db';

const SESSION_COOKIE = 'sabagiro_session';
const SESSION_DAYS = 14;

export type SessionUser = {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  personalId: string;
  facebookUrl: string;
  instagramUrl: string;
  verificationStatus: VerificationStatus;
  role: Role;
  ticketLimitPerEvent: number;
  freeTicketsEnabled: boolean;
  freeTicketsQuota: number;
  freeTicketsUsed: number;
};

function getSecret() {
  const secret =
    process.env.AUTH_SECRET ||
    (process.env.NODE_ENV === 'production' ? '' : 'dev-sabagiro-secret-key');
  if (!secret || secret.length < 16) {
    throw new Error('AUTH_SECRET must be set (min 16 chars)');
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());
}

export async function setSessionCookie(user: SessionUser) {
  const token = await createSessionToken(user);
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  cookies().set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

export type SessionNavUser = Pick<
  SessionUser,
  'id' | 'email' | 'role' | 'verificationStatus' | 'freeTicketsEnabled'
>;

export async function getSessionNavUser(): Promise<SessionNavUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const userId = payload.sub;
    if (!userId || typeof userId !== 'string') return null;
    if (payload.role !== 'ADMIN' && payload.role !== 'USER') return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, verificationStatus: true, freeTicketsEnabled: true },
    });
    if (!user) return null;

    return user;
  } catch {
    return null;
  }
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const userId = payload.sub;
    if (!userId || typeof userId !== 'string') return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        personalId: true,
        facebookUrl: true,
        instagramUrl: true,
        verificationStatus: true,
        role: true,
        ticketLimitPerEvent: true,
        freeTicketsEnabled: true,
        freeTicketsQuota: true,
        freeTicketsUsed: true,
      },
    });
    return user;
  } catch {
    return null;
  }
});

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new Error('UNAUTHORIZED');
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'ADMIN') throw new Error('FORBIDDEN');
  return user;
}

export function toSessionUser(user: {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  personalId: string;
  facebookUrl: string;
  instagramUrl: string;
  verificationStatus: VerificationStatus;
  role: Role;
  ticketLimitPerEvent: number;
  freeTicketsEnabled: boolean;
  freeTicketsQuota: number;
  freeTicketsUsed: number;
}): SessionUser {
  return user;
}
