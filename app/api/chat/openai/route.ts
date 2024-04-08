import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { auth } from '@/lib/auth';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  // Check if the user is authenticated
  const session = await auth();
  if (!session || !session.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Extract the `messages` from the body of the request
  const { messages, provider, name, params } = await req.json();

  // Request the OpenAI API for the response based on the prompt
  const response = await openai.chat.completions.create({
    model: name,
    stream: true,
    messages: messages,
    max_tokens: params?.max_tokens?.value || 500,
    temperature: params?.temperature?.value || 1.0,
    top_p: params?.top_p?.value || 1.0,
    frequency_penalty: params?.frequency_penalty?.value || 0.0,
    presence_penalty: params?.presence_penalty?.value || 0.0,
  });

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response);

  // Respond with the stream
  return new StreamingTextResponse(stream);
}
