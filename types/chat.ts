import type { Message } from 'ai';

export type ChatModelDefinition = {
  name: string;
  provider: string;
  display_name: string;
  description: string;
  system_prompt?: string;
  token_limit: number;
  allowed_roles: string[];
  variables: ChatModelVariable[];
  [key: string]: any;
};

export type ChatModel = Pick<
  ChatModelDefinition,
  'provider' | 'name' | 'display_name' | 'description' | 'system_prompt' | 'variables'
> & {
  default?: boolean;
};
export type ChatModelIdentifier = Pick<ChatModelDefinition, 'provider' | 'name'>;
export type ChatModelInfo = Pick<ChatModelDefinition, 'provider' | 'name' | 'display_name' | 'description'>;
export type ChatModelData = ChatModelIdentifier & { params: ChatModelParams };

// ChatModelVariable types
export type ChatModelVariable = {
  name: string;
  type: string;
  default: any;
  value?: any;
  [key: string]: any;
};

// ChatModelParam types
export type ChatModelParam = {
  name: string;
  type: string;
  value: any;
};
export type ChatModelParams = ChatModelParam[];

// ChatMessage and ChatData types
export type ChatMessages = Message[];
export type ChatData = { id?: string } & ChatModelData & { messages: ChatMessages };
