'server-only';

import fs from 'fs';
import yaml from 'yaml';
import { ChatModelIdentifier, type ChatModelDefinition } from '@/types/chat';

// Load the settings.yml file
const file = fs.readFileSync(process.cwd() + '/settings.yml', 'utf8');
const settingsRaw = yaml.parse(file);

// Chat settings
function chatDefaultSystemPrompt() {
  const defaultSystemPrompt = settingsRaw.chat.default.system_prompt;
  if (!defaultSystemPrompt || typeof defaultSystemPrompt !== 'string') {
    return undefined;
  }
  return defaultSystemPrompt;
}
function chatDefaultChatModelInfo(): ChatModelIdentifier | undefined {
  const defaultModel = settingsRaw.chat.default.model;
  if (!defaultModel) {
    return undefined;
  }
  const { provider, model } = defaultModel;
  if (!provider || !model) {
    return undefined;
  }
  return {
    provider,
    name: model,
  };
}
function chatModelsArray(): ChatModelDefinition[] {
  return Object.entries(settingsRaw.chat.llms)
    .map(([key, value]) => {
      const providerName = key;
      // Convert models object to array
      return Object.entries((value as any).models).map(([key, value]) => {
        const modelName = key;
        const v = value as any;
        return {
          ...v,
          name: modelName,
          provider: providerName,
          display_name: v.display_name,
          description: v.description,
          system_prompt: v.system_prompt,
          token_limit: v.token_limit,
          allowed_roles: v.allowed_roles,
          variables: Object.entries(v.variables).map(([key, value]) => {
            return {
              ...(value as any),
              name: key,
            };
          }),
        };
      });
    })
    .flat(1);
}
export const settingsChatRaw: any = settingsRaw.chat;
export const settingsChatDefaultSystemPrompt = chatDefaultSystemPrompt();
export const settingsChatDefaultModelInfo = chatDefaultChatModelInfo();
export const settingsChatModels = chatModelsArray();

// default export
export default settingsRaw;
