import { OpenAIClient, AzureKeyCredential } from '@azure/openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { auth } from '@/lib/auth';
import { settingsChatModels } from '@/lib/settings';

// create client per model, so use dictionary to store the client
const clients = settingsChatModels
  .filter((model) => model.provider === 'azure-openai')
  .reduce(
    (acc, model) => {
      const endpoint: string = model.endpoint.type === 'env' ? process.env[model.endpoint.value] : model.endpoint.value;
      const apiKey: string = model.api_key.type === 'env' ? process.env[model.api_key.value] : model.api_key.value;
      acc[model.name] = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey));
      return acc;
    },
    {} as Record<string, OpenAIClient>
  );

export async function POST(req: Request) {
  // Check if the user is authenticated
  const session = await auth();
  if (!session || !session.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Extract the `messages` from the body of the request
  const { messages, provider, name, params } = await req.json();

  // select model
  const client = clients[name];

  // Request the Azure OpenAI API for the response based on the prompt
  const response = await client.streamChatCompletions(name, messages, {
    maxTokens: params?.max_tokens?.value || 500,
    temperature: params?.temperature?.value || 1.0,
    topP: params?.top_p?.value || 1.0,
    frequencyPenalty: params?.frequency_penalty?.value || 0.0,
    presencePenalty: params?.presence_penalty?.value || 0.0,
  });

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response);

  // Respond with the stream
  return new StreamingTextResponse(stream);
}
