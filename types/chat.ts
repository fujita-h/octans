import type { Message } from 'ai';

export type ChatModel = {
  provider: string;
  model: string;
  name?: string;
  description?: string;
  system_prompt?: string;
  token_limit: number;
  allowed_roles: string[];
  variables: any;
  [key: string]: any;
};

export type ChatModelInfo = Pick<
  ChatModel,
  'provider' | 'model' | 'name' | 'description' | 'system_prompt' | 'variables'
> & {
  default?: boolean;
};
export type ChatModelData = Pick<ChatModel, 'provider' | 'model' | 'variables'>;
export type ChatMessageData = { id?: string; messages: Message[] };
export type ChatData = ChatModelData & ChatMessageData;
