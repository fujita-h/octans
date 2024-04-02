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

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  const userId = session?.user?.id;
  const data = await req.json();

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: params.id, userId: userId },
  });

  if (!conversation) {
    return Response.json({ error: 'Conversation not found' }, { status: 404 });
  }

  // apply type assertion to ChatData
  const chatData: ChatData = {
    id: params.id,
    provider: data.provider,
    name: data.name,
    params: data.params,
    messages: data.messages,
  };

  const result = await prisma.conversation.update({
    where: { id: params.id },
    data: {
      chat: {
        upsert: {
          create: { jsonData: chatData as any },
          update: { jsonData: chatData as any },
        },
      },
    },
    include: { chat: true },
  });

  return Response.json({ ...result, id: params.id });
}
