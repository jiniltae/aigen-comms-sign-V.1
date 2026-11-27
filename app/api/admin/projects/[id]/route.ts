
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdmin, unauthorized } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

const imageSchema = z.object({
  url: z.string().url().max(2048),
  alt: z.string().max(200),
});

const schema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{3,80}$/),
  title: z.string().min(2).max(150),
  category: z.string().min(1).max(50),
  region: z.string().max(100).nullable().optional(),
  description: z.string().max(5000),
  published: z.boolean(),
  images: z.array(imageSchema).max(30),
}).strict();

type Context = {
  params: Promise<{ id: string }>;
};

// 시공 사례 수정 및 사진 관리
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

  const parsed = schema.partial().safeParse(body);

  if (
    !parsed.success ||
    Object.keys(parsed.data).length === 0
  ) {
    return NextResponse.json(
      { error: 'Invalid project data' },
      { status: 400 }
    );
  }

  const { images, ...fields } = parsed.data;

  try {
    const project = await db.$transaction(async tx => {
      // 사진 수정 요청이 없는 경우 기존 사진 유지
      if (images === undefined) {
        return tx.project.update({
          where: { id },
          data: fields,
          include: {
            images: { orderBy: { sort: 'asc' } },
          },
        });
      }

      // 사진 목록을 전달한 경우 해당 목록으로 교체
      // 트랜잭션으로 삭제와 생성을 함께 처리
      await tx.project.update({
        where: { id },
        data: fields,
      });

      await tx.projectImage.deleteMany({
        where: { projectId: id },
      });

      await tx.projectImage.createMany({
        data: images.map((image, index) => ({
          projectId: id,
          url: image.url,
          alt: image.alt,
          sort: index,
        })),
      });

      return tx.project.findUniqueOrThrow({
        where: { id },
        include: {
          images: { orderBy: { sort: 'asc' } },
        },
      });
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Project update failed', error);

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

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Project deletion failed', error);

    return NextResponse.json(
      { error: 'Unable to delete project' },
      { status: 400 }
    );
  }
}
