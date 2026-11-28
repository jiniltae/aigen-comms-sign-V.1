import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { db } from '@/lib/db';
import { S3Client, HeadObjectCommand, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export const runtime = 'nodejs';
const MAX_SIZE = 2 * 1024 * 1024;
const digest = (s: string) => createHash('sha256').update(s).digest('hex');
const schema = z.object({
  name: z.string().trim().min(1).max(80),
  phone: z.string().regex(/^[0-9+()\-\s]{7,30}$/),
  region: z.string().max(100).optional(),
  category: z.string().max(50).optional(),
  dimensions: z.string().max(100).optional(),
  message: z.string().trim().min(1).max(3000),
  attachmentKeys: z.array(z.string().regex(/^inquiries\/temp\/[0-9a-f-]{36}\.webp$/i)).max(5).default([]),
});

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get('origin');
    if (origin && origin !== req.nextUrl.origin) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    const data = parsed.data;
    const keys = data.attachmentKeys;
    if (new Set(keys).size !== keys.length) return NextResponse.json({ error: 'Duplicate attachments' }, { status: 400 });
    const token = req.cookies.get('aigen_inquiry_upload')?.value;
    let sessionId: string | null = null;
    if (keys.length) {
      if (!token || !/^[a-f0-9]{64}$/.test(token)) return NextResponse.json({ error: 'Upload session required' }, { status: 401 });
      const session = await db.inquiryUploadSession.findFirst({
        where: { tokenHash: { endsWith: `:${digest(token)}` }, expiresAt: { gt: new Date() }, submittedAt: null },
        include: { uploads: true },
      });
      if (!session) return NextResponse.json({ error: 'Upload session expired' }, { status: 401 });
      if (keys.some(key => !session.uploads.some(upload => upload.objectKey === key && upload.status === 'PENDING')))
        return NextResponse.json({ error: 'Attachment not owned by session' }, { status: 403 });
      sessionId = session.id;
    }
    const { INQUIRY_R2_BUCKET: bucket, INQUIRY_R2_ENDPOINT: endpoint, INQUIRY_R2_ACCESS_KEY_ID: accessKeyId, INQUIRY_R2_SECRET_ACCESS_KEY: secretAccessKey } = process.env;
    if (keys.length && (!bucket || !endpoint || !accessKeyId || !secretAccessKey))
      return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });
    const s3 = keys.length ? new S3Client({ region: 'auto', endpoint, credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! } }) : null;
    const confirmed: string[] = [];
    for (const key of keys) {
      const object = await s3!.send(new HeadObjectCommand({ Bucket: bucket!, Key: key }));
      const declared = await db.inquiryUpload.findUnique({ where: { objectKey: key } });
      if (!object.ContentLength || object.ContentLength > MAX_SIZE || object.ContentLength !== declared?.fileSize || object.ContentType !== 'image/webp')
        return NextResponse.json({ error: 'Invalid attachment' }, { status: 400 });
      const target = key.replace('inquiries/temp/', 'inquiries/confirmed/');
      await s3!.send(new CopyObjectCommand({ Bucket: bucket!, Key: target, CopySource: `${bucket}/${key}`, ContentType: 'image/webp', MetadataDirective: 'REPLACE' }));
      confirmed.push(target);
    }
    // Atomic claim prevents replaying a session to create multiple inquiries.
    const saved = await db.$transaction(async tx => {
      if (sessionId) {
        const claim = await tx.inquiryUploadSession.updateMany({ where: { id: sessionId, submittedAt: null, expiresAt: { gt: new Date() } }, data: { submittedAt: new Date() } });
        if (claim.count !== 1) return false;
      }
      await tx.inquiry.create({ data: {
        name: data.name, phone: data.phone, region: data.region, category: data.category,
        dimensions: data.dimensions, message: data.message, attachmentKeys: confirmed,
      } });
      if (sessionId) await tx.inquiryUpload.updateMany({ where: { sessionId, objectKey: { in: keys } }, data: { status: 'CONFIRMED' } });
      return true;
    });
    if (!saved) return NextResponse.json({ error: 'Session already submitted' }, { status: 409 });
    // Deleting temporary objects is best effort. Lifecycle rule also cleans up leftovers.
    await Promise.allSettled(keys.map(key => s3!.send(new DeleteObjectCommand({ Bucket: bucket!, Key: key }))));
    const response = NextResponse.json({ ok: true }, { status: 201 });
    response.cookies.delete('aigen_inquiry_upload');
    return response;
  } catch (error) {
    console.error('Inquiry submission error:', error);
    return NextResponse.json({ error: 'Unable to submit' }, { status: 503 });
  }
}
