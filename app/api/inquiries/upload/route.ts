import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createHash, randomUUID } from 'node:crypto';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const digest = (s: string) => createHash('sha256').update(s).digest('hex');

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get('origin');
    if (origin && origin !== req.nextUrl.origin) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
    const token = req.cookies.get('aigen_inquiry_upload')?.value;
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return NextResponse.json({ error: 'Upload session required' }, { status: 401 });
    const session = await db.inquiryUploadSession.findFirst({
      where: { tokenHash: { endsWith: `:${digest(token)}` }, expiresAt: { gt: new Date() }, submittedAt: null },
    });
    if (!session) return NextResponse.json({ error: 'Upload session expired' }, { status: 401 });
    const { size, type } = await req.json();
    if (!Number.isInteger(size) || size < 1 || size > MAX_FILE_SIZE || type !== 'image/webp')
      return NextResponse.json({ error: 'Invalid image type or size' }, { status: 400 });
    const { INQUIRY_R2_BUCKET: bucket, INQUIRY_R2_ENDPOINT: endpoint, INQUIRY_R2_ACCESS_KEY_ID: accessKeyId, INQUIRY_R2_SECRET_ACCESS_KEY: secretAccessKey } = process.env;
    if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });
    // Atomic reservation prevents concurrent requests from exceeding five slots.
    const reservation = await db.$transaction(async tx => {
      const locked = await tx.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "InquiryUploadSession" WHERE "id" = ${session.id} AND "submittedAt" IS NULL AND "expiresAt" > NOW() FOR UPDATE`;
      if (!locked.length) return null;
      if (await tx.inquiryUpload.count({ where: { sessionId: session.id } }) >= 5) return null;
      const key = `inquiries/temp/${randomUUID()}.webp`;
      await tx.inquiryUpload.create({ data: { sessionId: session.id, objectKey: key, fileSize: size } });
      return key;
    });
    if (!reservation) return NextResponse.json({ error: 'Maximum five images per session' }, { status: 429 });
    const s3 = new S3Client({ region: 'auto', endpoint, credentials: { accessKeyId, secretAccessKey } });
    const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({ Bucket: bucket, Key: reservation, ContentType: 'image/webp', ContentLength: size }), { expiresIn: 120 });
    return NextResponse.json({ uploadUrl, key: reservation, expiresIn: 120 });
  } catch (error) {
    console.error('Inquiry upload error:', error);
    return NextResponse.json({ error: 'Unable to prepare upload' }, { status: 503 });
  }
}
