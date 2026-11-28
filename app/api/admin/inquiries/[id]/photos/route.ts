import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { isAdmin, unauthorized } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return unauthorized();

  try {
    const { id } = await params;
    const inquiry = await db.inquiry.findUnique({
      where: { id },
      select: { attachmentKeys: true },
    });

    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    const keys = inquiry.attachmentKeys;
    if (keys.length === 0) {
      return NextResponse.json({ urls: [] }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (keys.length > 5 || keys.some(key => !/^inquiries\/[0-9a-f-]{36}\.webp$/i.test(key))) {
      return NextResponse.json({ error: 'Invalid attachment keys' }, { status: 400 });
    }

    const {
      INQUIRY_R2_BUCKET,
      INQUIRY_R2_ENDPOINT,
      INQUIRY_R2_ACCESS_KEY_ID,
      INQUIRY_R2_SECRET_ACCESS_KEY,
    } = process.env;

    if (!INQUIRY_R2_BUCKET || !INQUIRY_R2_ENDPOINT ||
        !INQUIRY_R2_ACCESS_KEY_ID || !INQUIRY_R2_SECRET_ACCESS_KEY) {
      return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });
    }

    const s3 = new S3Client({
      region: 'auto',
      endpoint: INQUIRY_R2_ENDPOINT,
      credentials: {
        accessKeyId: INQUIRY_R2_ACCESS_KEY_ID,
        secretAccessKey: INQUIRY_R2_SECRET_ACCESS_KEY,
      },
    });

    const urls = await Promise.all(keys.map(key => getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: INQUIRY_R2_BUCKET, Key: key }),
      { expiresIn: 300 }
    )));

    return NextResponse.json({ urls }, {
      headers: { 'Cache-Control': 'no-store, private' },
    });
  } catch (error) {
    console.error('Admin inquiry photos error:', error);
    return NextResponse.json({ error: 'Unable to load photos' }, { status: 500 });
  }
}
