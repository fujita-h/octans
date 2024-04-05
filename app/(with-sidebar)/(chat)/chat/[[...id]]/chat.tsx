'use client';

import { nanoid, nanoid_case_insensitive } from '@/lib/nanoid';
import type {
  ChatData,
  ChatMessages,
  ChatModel,
  ChatModelIdentifier,
  ChatModelInfo,
  ChatModelParam,
  ChatModelVariable,
} from '@/types/chat';
import { Menu, Popover, Transition } from '@headlessui/react';
import { useChat } from 'ai/react';
import clsx from 'clsx/lite';
import Link from 'next/link';
import { Dispatch, Fragment, SetStateAction, useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { unstable_serialize } from 'swr/infinite';
import { CheckCircleIcon, ChevronDownIcon, Cog8ToothIcon } from '@heroicons/react/20/solid';
import scrollbarStyles from '../../../scrollbar.module.css';

export function NewChat({
  modelOptions,
  provider,
  name,
}: {
  modelOptions: ChatModel[];
  provider?: string;
  name?: string;
}) {
  // Set the default model based on the `default` property in the modelOptions, or the first model in the array
  const model =
    modelOptions.find((model) => provider && name && provider === model.provider && name === model.name) ||
    modelOptions.find((model) => model.default) ||
    modelOptions[0];

  // Create a new chat data object based on the selected model
  const newChatData: ChatData = {
    id: undefined,
    provider: model.provider,
    name: model.name,
    params: model.variables.map((variable) => {
      return {
        name: variable.name,
        type: variable.type,
        value: variable.default, // Set the default value for the variable
      };
    }),
    // Add the system prompt message if it exists
    messages: model.system_prompt
      ? [{ id: nanoid_case_insensitive(10), role: 'system', content: model.system_prompt }]
      : [],
  };

  return <ChatFrame modelOptions={modelOptions} chatData={newChatData} />;
}

export function SavedChat({ id, modelOptions }: { id: string; modelOptions: ChatModel[] }) {
  const { data, isLoading, error } = useSWR(`/api/conversation/${id}`, {
    revalidateOnMount: true,
    revalidateOnFocus: false,
    dedupingInterval: 0,
  });

  if (isLoading) return <></>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>Not Found</div>;

  // `data` from API must be a ChatData object, but just to be safe, set it to a ChatData object.
  const savedChatData: ChatData = {
    id: data.id,
    provider: data.provider,
    name: data.name,
    params: data.params,
    messages: data.messages,
  };

  return <ChatFrame modelOptions={modelOptions} chatData={savedChatData} />;
}

// Separate ModelSelectMenu and Chat components.
// This is to avoid re-rendering the ModelSelectMenu component when the Chat component re-renders.
function ChatFrame({ modelOptions, chatData }: { modelOptions: ChatModel[]; chatData: ChatData }) {
  // Generate a key for the Chat component to control the re-mount the component.
  // If the key is changed, the Chat component will re-mount.
  // Note: Chat component have own state, so it will not be affected by the re-rendering.
  //       Need to re-mount the Chat component to reset its state.
  const [chatKey, setChatKey] = useState(nanoid());
  useEffect(() => {
    setChatKey(nanoid());
  }, [modelOptions, chatData]);

  // utility function to initialize the variables based on the ChatModelVariable
  // set value from the chatData.params if found, otherwise set it to the default value
  const initializeVariables = (variables: ChatModelVariable[]) => {
    return variables.map((variable) => {
      const param = chatData.params.find((param) => param.name === variable.name);
      return {
        ...variable,
        value: param?.value ?? variable.default,
      };
    });
  };

  // set the chat model based on the chatData
  const model = modelOptions.find((model) => model.provider === chatData.provider && model.name === chatData.name);

  // set the variables based on the chatData, if not found, set it to an empty array
  const [variables, setVariables] = useState<ChatModelVariable[]>(model ? initializeVariables(model.variables) : []);
  useEffect(() => {
    if (!model) {
      setVariables([]);
      return;
    }
    setVariables(initializeVariables(model.variables));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model]);

  // keep the messages in the state
  const [messages, setMessages] = useState<ChatMessages>(chatData.messages);
  useEffect(() => {
    setMessages(chatData.messages);
  }, [chatData]);

  // check if the conversation is started
  const isConversationStarted = messages.find((message) => message.role === 'user') ? true : false;

  if (!model) return <>_model_undefined_show_readonly_mode_</>;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none flex items-center justify-between lg:justify-between px-4 py-1 h-12 max-h-12 border-b border-gray-100">
        <div className="block lg:hidden">{/* dummy block */}</div>
        <div className="flex items-center">
          <ModelSelectMenu options={modelOptions} model={model} isConversationStarted={isConversationStarted} />
        </div>
        <div className="flex items-center">
          <ModelValiablesSetting variables={variables} setVariables={setVariables} />
        </div>
      </div>
      <Chat
        key={chatKey} // used for re-mount of the Chat component
        id={chatData.id}
        chatModel={model}
        chatParams={variables.map((variable) => {
          return {
            name: variable.name,
            type: variable.type,
            value: variable.value,
          };
        })}
        initialMessages={chatData.messages}
        onMessageUpdate={(messages) => {
          setMessages(messages);
        }}
      />
    </div>
  );
}

function ModelSelectMenu({
  options,
  model,
  isConversationStarted,
}: {
  options: ChatModelInfo[];
  model: ChatModelInfo;
  isConversationStarted: boolean;
}) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
          {model.display_name}
          <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute left-0 z-10 mt-2 w-64 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {options.map((option, index) => {
            const isActive = model.provider === option.provider && model.name === option.name;
            return (
              <div key={index} className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href={`/chat?provider=${option.provider}&name=${option.name}`}
                      className={clsx(
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                        'relative block px-4 py-2'
                      )}
                    >
                      {isConversationStarted && active && (
                        <span className="absolute top-1 right-2 text-sm text-gray-800 ">New Chat</span>
                      )}
                      <div className="text-sm font-semibold flex">
                        <span>{option.display_name}</span>
                        {isActive && <CheckCircleIcon className="ml-2 h-5 w-5 text-green-500" />}
                      </div>
                      <div className="mt-2 ml-2 text-xs text-gray-600">{option.description}</div>
                    </Link>
                  )}
                </Menu.Item>
              </div>
            );
          })}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

function ModelValiablesSetting({
  variables,
  setVariables,
}: {
  variables: ChatModelVariable[];
  setVariables: Dispatch<SetStateAction<ChatModelVariable[]>>;
}) {
  return (
    <Popover className="relative">
      <Popover.Button className="flex items-center border rounded-md p-1 text-gray-600 hover:text-gray-700 hover:bg-neutral-100">
        <Cog8ToothIcon className="h-6 w-6" />
      </Popover.Button>
      <Popover.Panel className="absolute right-0 mt-1 z-10">
        <div className="border rounded-md shadow-sm p-4 bg-white w-60 flex flex-col gap-4">
          {variables.map((variable, index) => (
            <div key={index} className="flex flex-col gap-y-1">
              <div className="flex justify-between">
                <label htmlFor={variable.name} className="text-sm font-semibold">
                  {variable.name}
                </label>
                {variable.type === 'boolean' ? (
                  <label htmlFor={variable.name} className="text-sm font-normal">
                    {variable.value.toString()}
                  </label>
                ) : (
                  <label htmlFor={variable.name} className="text-sm font-normal">
                    {variable.value}
                  </label>
                )}
              </div>
              {variable.type === 'range' ? (
                <input
                  type="range"
                  min={variable.min}
                  max={variable.max}
                  step={variable.step}
                  value={variable.value}
                  onChange={(e) => {
                    setVariables((prev) => {
                      return prev.map((v: ChatModelVariable) => {
                        if (v.name === variable.name) {
                          return { ...v, value: e.target.value };
                        }
                        return v;
                      });
                    });
                  }}
                />
              ) : variable.type === 'string' ? (
                <input
                  type="text"
                  value={variable.value}
                  onChange={(e) => {
                    setVariables((prev) => {
                      return prev.map((v) => {
                        if (v.name === variable.name) {
                          return { ...v, value: e.target.value };
                        }
                        return v;
                      });
                    });
                  }}
                />
              ) : variable.type === 'boolean' ? (
                <input
                  type="checkbox"
                  checked={Boolean(variable.value)}
                  onChange={(e) => {
                    setVariables((prev) => {
                      return prev.map((v) => {
                        if (v.name === variable.name) {
                          return { ...v, value: e.target.checked };
                        }
                        return v;
                      });
                    });
                  }}
                />
              ) : (
                <div>Unsupported type</div>
              )}
            </div>
          ))}
        </div>
      </Popover.Panel>
    </Popover>
  );
}

function Chat({
  id,
  chatModel,
  chatParams,
  initialMessages,
  onMessageUpdate,
}: {
  id?: string;
  chatModel: ChatModelIdentifier;
  chatParams: ChatModelParam[];
  initialMessages: ChatMessages;
  onMessageUpdate?: (messages: ChatMessages) => void;
}) {
  const { mutate } = useSWRConfig();
  const [lastRecievedMessage, setLastRecievedMessage] = useState({ role: '', content: '' });

  // `messages` is stored state in useChat function with the `initialMessages` value.
  // `input` is also stored state in useChat function with the `initialMessages` value.
  // Thus, the `messages` and `input` will not affected by the re-rendering of the component.
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: `/api/chat/${chatModel.provider}`,
    initialMessages: initialMessages || [],
    body: { id: id, provider: chatModel.provider, name: chatModel.name, params: chatParams },
    onFinish: (data) => {
      setLastRecievedMessage(data);
    },
  });

  useEffect(() => {
    if (messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== lastRecievedMessage.role) return;
    if (lastMessage.content === lastRecievedMessage.content) {
      (async () => {
        if (!id) {
          const title =
            messages.find((message) => message.role === 'user')?.content ||
            messages.find((message) => message.role === 'assistant')?.content ||
            'Untitled';
          const response = await fetch(`/api/conversation`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: title.slice(0, 50),
              provider: chatModel.provider,
              name: chatModel.name,
              params: chatParams,
              messages: messages,
            }),
          });
          const data = await response.json();
          mutate(unstable_serialize((index) => `/api/conversation?page=${index + 1}`));
          window?.history?.pushState(null, '', `/chat/${data.id}`);
        } else {
          const response = await fetch(`/api/conversation/${id}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              provider: chatModel.provider,
              name: chatModel.name,
              params: chatParams,
              messages: messages,
            }),
          });
          const data = await response.json();
        }
      })();
      onMessageUpdate?.(messages);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, lastRecievedMessage]);

  return (
    <>
      <div className={clsx('flex-1 ml-4 py-1 overflow-auto', scrollbarStyles['scrollbar-thin'])}>
        {
          // View messages in UI state
          messages
            .filter((message) => message.role !== 'system')
            .map((message, index) => (
              <div key={index}>{message.content}</div>
            ))
        }
      </div>
      <div className="flex-none p-4">
        <form onSubmit={handleSubmit}>
          <input
            className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-200 "
            value={input}
            onChange={handleInputChange}
          />
        </form>
      </div>
    </>
  );
}
