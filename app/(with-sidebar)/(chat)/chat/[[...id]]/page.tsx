import { LoginForm } from '@/components/auth';
import { auth } from '@/lib/auth';
import { settingsChatDefaultModelInfo, settingsChatDefaultSystemPrompt, settingsChatModels } from '@/lib/settings';
import { type ChatModel, type ChatModelInfo } from '@/types/chat';
import { NewChat, SavedChat } from './chat';

export default async function Page({ params }: { params: { id?: string[] } }) {
  const id = params.id?.[0];

  // Check if the user is authenticated
  const session = await auth();
  if (!session || !session.user) {
    return <LoginForm />;
  }

  // Extract the user's roles
  const roles: string[] = session.user.roles || [];

  // Filter the models based on the user's roles and set the default model
  const models: ChatModelInfo[] = settingsChatModels
    .filter((model: ChatModel) => {
      const isRoleMatched =
        model.allowed_roles.length === 0 || model.allowed_roles.some((role) => roles.includes(role));
      return isRoleMatched;
    })
    .map((model) => {
      return {
        provider: model.provider,
        model: model.model,
        name: model.name,
        description: model.description,
        system_prompt: model.system_prompt || settingsChatDefaultSystemPrompt,
        variables: model.variables,
        default:
          settingsChatDefaultModelInfo?.provider === model.provider &&
          settingsChatDefaultModelInfo?.model === model.model,
      };
    });

  if (!id) {
    return <NewChat modelOptions={models} />;
  } else {
    return <SavedChat id={id} modelOptions={models} />;
  }
}
