import { LoginForm } from '@/components/auth';
import { auth } from '@/lib/auth';
import { settingsChatDefaultModelInfo, settingsChatDefaultSystemPrompt, settingsChatModels } from '@/lib/settings';
import { type ChatModelDefinition, type ChatModel } from '@/types/chat';
import { NewChat, SavedChat } from './chat';

export default async function Page({
  params,
  searchParams,
}: {
  params: { id?: string[] };
  searchParams: { provider?: string; name?: string };
}) {
  const id = params.id?.[0];

  // Check if the user is authenticated
  const session = await auth();
  if (!session || !session.user) {
    return <LoginForm />;
  }

  // Extract the user's roles
  const roles: string[] = session.user.roles || [];

  // Filter the models based on the user's roles and set the default model
  const models: ChatModel[] = settingsChatModels
    .filter((model: ChatModelDefinition) => {
      const isRoleMatched =
        model.allowed_roles.length === 0 || model.allowed_roles.some((role) => roles.includes(role));
      return isRoleMatched;
    })
    .map((model) => {
      return {
        name: model.name,
        provider: model.provider,
        display_name: model.display_name,
        description: model.description,
        system_prompt: model.system_prompt || settingsChatDefaultSystemPrompt,
        variables: model.variables,
        default:
          settingsChatDefaultModelInfo?.provider === model.provider &&
          settingsChatDefaultModelInfo?.name === model.name,
      };
    });

  // Render the NewChat or SavedChat component based on the id
  if (!id) {
    return <NewChat modelOptions={models} provider={searchParams.provider} name={searchParams.name} />;
  } else {
    return <SavedChat id={id} modelOptions={models} />;
  }
}
