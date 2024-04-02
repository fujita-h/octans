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
  const { messages, provider, name } = await req.json();
  console.log('model=>', provider, name);
  // Request the OpenAI API for the response based on the prompt
  const response = await openai.chat.completions.create({
    model: name,
    stream: true,
    messages: messages,
    max_tokens: 500,
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 1,
    presence_penalty: 1,
  });

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response);

  // Respond with the stream
  return new StreamingTextResponse(stream);
}
