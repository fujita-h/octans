'server-only';

import prisma, { Prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { nanoid_case_insensitive } from '@/lib/nanoid';

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  const reqData = await req.json();

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await prisma.conversation.create({
    data: {
      id: nanoid_case_insensitive(),
      userId: userId,
      title: 'sample text',
      chat: { create: { jsonData: reqData } },
    },
    include: { chat: true },
  });

  return Response.json({ ...data });
}
