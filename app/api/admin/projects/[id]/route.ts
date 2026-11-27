
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdmin, unauthorized } from '@/lib/auth';
import { db } from '@/lib/db';

const schema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{3,80}$/),
  title: z.string().min(2).max(150),
  category: z.string().min(1).max(50),
  region: z.string().max(100).optional(),
  description: z.string().max(5000),
  published: z.boolean(),
});

type Context = {
  params: Promise<{ id: string }>;
};

// 시공 사례 수정
export async function PATCH(
  req: NextRequest,
  { params }: Context
) {
  if (!(await isAdmin())) return unauthorized();

  const { id } = await params;
  const parsed = schema.partial().safeParse(await req.json());

  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return NextResponse.json(
      { error: 'Invalid project data' },
      { status: 400 }
    );
  }

  try {
    const project = await db.project.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(project);
  } catch {
    return NextResponse.json(
      { error: 'Unable to update project' },
      { status: 400 }
    );
  }
}

// 시공 사례 삭제
export async function DELETE(
  req: NextRequest,
  { params }: Context
) {
  if (!(await isAdmin())) return unauthorized();

  const { id } = await params;

  try {
    await db.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Unable to delete project' },
      { status: 400 }
    );
  }
}
