
import { NextResponse } from 'next/server';
import { isAdmin, unauthorized } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 관리자 견적 문의 전체 조회
export async function GET() {
  if (!(await isAdmin())) {
    return unauthorized();
  }

  try {
    const inquiries = await db.inquiry.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(inquiries);
  } catch (error) {
    console.error('Inquiry list error:', error);

    return NextResponse.json(
      { error: 'Unable to load inquiries' },
      { status: 500 }
    );
  }
}
