import { NextRequest, NextResponse } from 'next/server';
import { createHash, createHmac, randomBytes } from 'node:crypto';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
const COOKIE = 'aigen_inquiry_upload';
const TTL_MS = 30 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const digest = (s: string) => createHash('sha256').update(s).digest('hex');

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get('origin');
    if (origin && origin !== req.nextUrl.origin) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
    // Vercel overwrites x-forwarded-for at its trusted edge. Do not accept a client-supplied IP header on an untrusted proxy.
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
    const secret = process.env.INQUIRY_R2_SECRET_ACCESS_KEY;
    if (!secret) return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });
    const ipHash = createHmac('sha256', secret).update(ip).digest('hex');
    const current = req.cookies.get(COOKIE)?.value;
    if (current && /^[a-f0-9]{64}$/.test(current)) {
      const existing = await db.inquiryUploadSession.findFirst({
        where: { tokenHash: `${ipHash}:${digest(current)}`, expiresAt: { gt: new Date() }, submittedAt: null },
      });
      if (existing) return NextResponse.json({ ok: true });
    }
    const recent = await db.inquiryUploadSession.count({
      where: { tokenHash: { startsWith: `${ipHash}:` }, createdAt: { gt: new Date(Date.now() - HOUR_MS) } },
    });
    if (recent >= 3) return NextResponse.json({ error: '잠시 후 다시 시도해 주세요.' }, { status: 429 });
    const token = randomBytes(32).toString('hex');
    await db.inquiryUploadSession.create({
      data: { tokenHash: `${ipHash}:${digest(token)}`, expiresAt: new Date(Date.now() + TTL_MS) },
    });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(COOKIE, token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 30 * 60,
    });
    return response;
  } catch (error) {
    console.error('Inquiry session error:', error);
    return NextResponse.json({ error: 'Unable to create session' }, { status: 503 });
  }
}
