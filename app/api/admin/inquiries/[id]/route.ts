
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdmin, unauthorized } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

const schema = z.object({
  status: z.enum(['NEW', 'IN_PROGRESS', 'DONE']),
}).strict();

type Context = {
  params: Promise<{ id: string }>;
};

// 견적 문의 처리 상태 변경
export async function PATCH(
  req: NextRequest,
  { params }: Context
) {
  if (!(await isAdmin())) return unauthorized();

  const { id } = await params;

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 }
    );
  }

  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid status' },
      { status: 400 }
    );
  }

  try {
    const inquiry = await db.inquiry.update({
      where: { id },
      data: { status: parsed.data.status },
    });

    return NextResponse.json(inquiry);
  } catch {
    return NextResponse.json(
      { error: 'Unable to update inquiry' },
      { status: 404 }
    );
  }
}

// 견적 문의 삭제
export async function DELETE(
  req: NextRequest,
  { params }: Context
) {
  if (!(await isAdmin())) return unauthorized();

  const { id } = await params;

  try {
    await db.inquiry.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Unable to delete inquiry' },
      { status: 404 }
    );
  }
}
