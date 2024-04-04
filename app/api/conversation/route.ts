'server-only';

import prisma, { Prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { nanoid_case_insensitive } from '@/lib/nanoid';
import { type NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;

  // Parse query parameters
  const searchParams = req.nextUrl.searchParams;
  let page = parseInt(searchParams.get('page') || '1');
  let limit = parseInt(searchParams.get('limit') || '20');

  // Validate page and limit
  if (isNaN(page) || page < 1) {
    page = 1;
  }
  if (isNaN(limit) || limit < 1) {
    limit = 20;
  }

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await prisma.conversation.findMany({
    where: { userId: userId },
    orderBy: { createdAt: 'desc' },
    include: { chat: { select: { id: true } } },
    skip: (page - 1) * limit,
    take: limit,
  });

  return Response.json(data);
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  const { title, provider, name, params, messages } = await req.json();

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await prisma.conversation.create({
    data: {
      id: nanoid_case_insensitive(),
      userId: userId,
      title: title,
      chat: { create: { jsonData: { provider, name, params, messages } } },
    },
    include: { chat: true },
  });

  return Response.json({ ...data });
}
