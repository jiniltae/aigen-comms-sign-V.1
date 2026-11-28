
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  S3Client,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';

export const runtime = 'nodejs';

const MAX_FILES = 5;
const MAX_FILE_SIZE = 2 * 1024 * 1024;

const schema = z.object({
  name: z.string().trim().min(1).max(80),
  phone: z.string().regex(/^[0-9+()\-\s]{7,30}$/),
  region: z.string().max(100).optional(),
  category: z.string().max(50).optional(),
  dimensions: z.string().max(100).optional(),
  message: z.string().trim().min(1).max(3000),

  attachmentKeys: z
    .array(
      z.string().regex(
        /^inquiries\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webp$/i
      )
    )
    .max(MAX_FILES)
    .default([]),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const keys = data.attachmentKeys;

    if (new Set(keys).size !== keys.length) {
      return NextResponse.json(
        { error: 'Duplicate attachments' },
        { status: 400 }
      );
    }

    if (keys.length > 0) {
      const {
        INQUIRY_R2_BUCKET,
        INQUIRY_R2_ENDPOINT,
        INQUIRY_R2_ACCESS_KEY_ID,
        INQUIRY_R2_SECRET_ACCESS_KEY,
      } = process.env;

      if (
        !INQUIRY_R2_BUCKET ||
        !INQUIRY_R2_ENDPOINT ||
        !INQUIRY_R2_ACCESS_KEY_ID ||
        !INQUIRY_R2_SECRET_ACCESS_KEY
      ) {
        return NextResponse.json(
          { error: 'Storage not configured' },
          { status: 503 }
        );
      }

      const s3 = new S3Client({
        region: 'auto',
        endpoint: INQUIRY_R2_ENDPOINT,
        credentials: {
          accessKeyId: INQUIRY_R2_ACCESS_KEY_ID,
          secretAccessKey: INQUIRY_R2_SECRET_ACCESS_KEY,
        },
      });

      for (const key of keys) {
        let object;

        try {
          object = await s3.send(
            new HeadObjectCommand({
              Bucket: INQUIRY_R2_BUCKET,
              Key: key,
            })
          );
        } catch {
          return NextResponse.json(
            { error: 'Attachment not found' },
            { status: 400 }
          );
        }

        if (
          !object.ContentLength ||
          object.ContentLength > MAX_FILE_SIZE ||
          object.ContentType !== 'image/webp'
        ) {
          return NextResponse.json(
            { error: 'Invalid attachment' },
            { status: 400 }
          );
        }
      }
    }

    await db.inquiry.create({
      data: {
        name: data.name,
        phone: data.phone,
        region: data.region,
        category: data.category,
        dimensions: data.dimensions,
        message: data.message,
        attachmentKeys: keys,
      },
    });

    return NextResponse.json(
      { ok: true },
      { status: 201 }
    );
  } catch (error) {
    console.error('Inquiry submission error:', error);

    return NextResponse.json(
      { error: 'Unable to submit' },
      { status: 503 }
    );
  }
}
