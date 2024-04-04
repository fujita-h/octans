'server-only';

import prisma, { Prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { ChatData } from '@/types/chat';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: params.id, userId: userId },
    include: { chat: true },
  });

  const data = (conversation?.chat?.jsonData as Prisma.JsonObject) || {};

  return Response.json({ ...data, id: params.id });
}

export async function POST(req: Request, { params: pathParams }: { params: { id: string } }) {
  const session = await auth();
  const userId = session?.user?.id;
  const { provider, name, params, messages } = await req.json();

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: pathParams.id, userId: userId },
  });

  if (!conversation) {
    return Response.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const result = await prisma.conversation.update({
    where: { id: pathParams.id },
    data: {
      chat: {
        upsert: {
          create: { jsonData: { provider, name, params, messages } },
          update: { jsonData: { provider, name, params, messages } },
        },
      },
    },
    include: { chat: true },
  });

  return Response.json({ ...result, id: pathParams.id });
}
