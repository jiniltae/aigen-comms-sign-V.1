
import { NextRequest, NextResponse } from 'next/server';
import {
  S3Client,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPE = 'image/webp';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const size = body?.size;
    const type = body?.type;

    if (
      !Number.isInteger(size) ||
      size <= 0 ||
      size > MAX_FILE_SIZE ||
      type !== ALLOWED_TYPE
    ) {
      return NextResponse.json(
        { error: 'Invalid image type or size' },
        { status: 400 }
      );
    }

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

    const key = `inquiries/${randomUUID()}.webp`;

    const command = new PutObjectCommand({
      Bucket: INQUIRY_R2_BUCKET,
      Key: key,
      ContentType: ALLOWED_TYPE,
    });

    const uploadUrl = await getSignedUrl(s3, command, {
      expiresIn: 120,
    });

    return NextResponse.json({
      uploadUrl,
      key,
      expiresIn: 120,
    });
  } catch (error) {
    console.error('Inquiry upload error:', error);

    return NextResponse.json(
      { error: 'Unable to prepare upload' },
      { status: 500 }
    );
  }
}
