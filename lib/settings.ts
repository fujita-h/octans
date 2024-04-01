'server-only';

import fs from 'fs';
import yaml from 'yaml';
import { type ChatModel } from '@/types/chat';

// Load the settings.yml file
const file = fs.readFileSync(process.cwd() + '/settings.yml', 'utf8');
const settingsRaw = yaml.parse(file);

// Chat settings
function chatDefaultSystemPrompt() {
  const defaultPrompt = settingsRaw.chat.default.system_prompt;
  if (!defaultPrompt || typeof defaultPrompt !== 'string') {
    return undefined;
  }
  return defaultPrompt;
}
function chatDefaultChatModelInfo() {
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
    model,
  };
}
function chatModelsArray(): ChatModel[] {
  return Object.entries(settingsRaw.chat.llms)
    .map(([key, value]) => {
      const providerName = key;
      const v = value as any;
      return Object.entries(v.models).map(([key, value]) => {
        const modelName = key;
        const v = value as any;
        return {
          provider: providerName,
          model: modelName,
          ...v,
        };
      });
    })
    .flat();
}
export const settingsChatRaw = settingsRaw.chat;
export const settingsChatDefaultSystemPrompt = chatDefaultSystemPrompt();
export const settingsChatDefaultModelInfo = chatDefaultChatModelInfo();
export const settingsChatModels = chatModelsArray();

// default export
export default settingsRaw;
