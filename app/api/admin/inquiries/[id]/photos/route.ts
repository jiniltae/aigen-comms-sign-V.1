import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { isAdmin, unauthorized } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return unauthorized();
  try {
    const { id } = await params;
    const inquiry = await db.inquiry.findUnique({ where: { id }, select: { attachmentKeys: true } });
    if (!inquiry) return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    const keys = inquiry.attachmentKeys;
    if (keys.length > 5 || keys.some(key => !/^inquiries\/(?:confirmed\/)?[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webp$/i.test(key)))
      return NextResponse.json({ error: 'Invalid attachment keys' }, { status: 400 });
    if (!keys.length) return NextResponse.json({ urls: [] }, { headers: { 'Cache-Control': 'no-store' } });
    const { INQUIRY_R2_BUCKET: bucket, INQUIRY_R2_ENDPOINT: endpoint, INQUIRY_R2_ACCESS_KEY_ID: accessKeyId, INQUIRY_R2_SECRET_ACCESS_KEY: secretAccessKey } = process.env;
    if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });
    const s3 = new S3Client({ region: 'auto', endpoint, credentials: { accessKeyId, secretAccessKey } });
    const urls = await Promise.all(keys.map(key => getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 300 })));
    return NextResponse.json({ urls }, { headers: { 'Cache-Control': 'no-store, private' } });
  } catch (error) {
    console.error('Admin inquiry photos error:', error);
    return NextResponse.json({ error: 'Unable to load photos' }, { status: 500 });
  }
}
