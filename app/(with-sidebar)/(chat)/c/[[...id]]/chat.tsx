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
import type { User } from '@auth/core/types';
import { Menu, Popover, Transition } from '@headlessui/react';
import { ChevronDownIcon, Cog8ToothIcon } from '@heroicons/react/20/solid';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { useChat } from 'ai/react';
import Avatar from 'boring-avatars';
import clsx from 'clsx/lite';
import Link from 'next/link';
import React, { Dispatch, Fragment, SetStateAction, useEffect, useState } from 'react';
import { BsArrowUpSquareFill } from 'react-icons/bs';
import { MdCheckCircle, MdOutlineRadioButtonUnchecked } from 'react-icons/md';
import { SiOpenai } from 'react-icons/si';
import { useInView } from 'react-intersection-observer';
import ReactMarkdown from 'react-markdown';
import TextareaAutosize from 'react-textarea-autosize';
import rehypeHighlight from 'rehype-highlight';
import useSWR, { useSWRConfig } from 'swr';
import { unstable_serialize } from 'swr/infinite';

import 'highlight.js/styles/a11y-dark.min.css';
import scrollbarStyles from '../../../scrollbar.module.css';

export function NewChat({
  user,
  modelOptions,
  provider,
  name,
}: {
  user: User;
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

  return <ChatFrame user={user} modelOptions={modelOptions} chatData={newChatData} />;
}

export function SavedChat({ user, id, modelOptions }: { user: User; id: string; modelOptions: ChatModel[] }) {
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

  return <ChatFrame user={user} modelOptions={modelOptions} chatData={savedChatData} />;
}

// Separate ModelSelectMenu and Chat components.
// This is to avoid re-rendering the ModelSelectMenu component when the Chat component re-renders.
function ChatFrame({ user, modelOptions, chatData }: { user: User; modelOptions: ChatModel[]; chatData: ChatData }) {
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
        user={user}
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
            const isSelected = model.provider === option.provider && model.name === option.name;
            return (
              <div key={index} className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href={`/c?provider=${option.provider}&name=${option.name}`}
                      className={clsx(
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                        'relative block px-4 py-3'
                      )}
                    >
                      {isConversationStarted && active && (
                        <div className="absolute top-1 right-2 text-gray-800">
                          <span className="text-sm text-gray-800 ">New Chat</span>
                          <PencilSquareIcon className="ml-2 h-4 w-4 inline-block" />
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-semibold flex">
                            <span>{option.display_name}</span>
                          </div>
                          <div className="mt-2 ml-2 text-xs text-gray-600">{option.description}</div>
                        </div>
                        <div className="flex-none">
                          {isSelected && !(isConversationStarted && active) && (
                            <MdCheckCircle className="h-5 w-5 text-gray-600" />
                          )}
                          {!isSelected && !(isConversationStarted && active) && (
                            <MdOutlineRadioButtonUnchecked className="h-5 w-5 text-gray-600" />
                          )}
                        </div>
                      </div>
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
  user,
  id,
  chatModel,
  chatParams,
  initialMessages,
  onMessageUpdate,
}: {
  user: User;
  id?: string;
  chatModel: ChatModelIdentifier;
  chatParams: ChatModelParam[];
  initialMessages: ChatMessages;
  onMessageUpdate?: (messages: ChatMessages) => void;
}) {
  const [idState, setIdState] = useState(id);
  const { mutate } = useSWRConfig();

  // useInView for checking the end of messages
  // This is used to scroll to the end of messages when new messages are added.
  const { ref: endOfMessagesRef, inView: isEndOfMessagesInView, entry: endOfMessagesEntry } = useInView();

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

  // This effect will be triggered when messages are updated.
  useEffect(() => {
    if (messages.length === 0) return;

    // scroll to the end of messages when new messages are added.
    if (isEndOfMessagesInView) {
      endOfMessagesEntry?.target.scrollIntoView({ behavior: 'instant', block: 'end' });
    }

    // check the last message and the last received message,
    // if the last message is the same as the last received message,
    // this means the conversation is ended.
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== lastRecievedMessage.role) return;
    if (lastMessage.content === lastRecievedMessage.content) {
      (async () => {
        if (!idState) {
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
          setIdState(data.id);
          window?.history?.pushState(null, '', `/c/${data.id}`);
        } else {
          const response = await fetch(`/api/conversation/${idState}`, {
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
      <div className={clsx('flex-1 ml-4 overflow-auto', scrollbarStyles['scrollbar-thin'])}>
        <div className={clsx('flex flex-col text-sm mt-4 gap-4')}>
          {messages
            .filter((message) => message.role !== 'system')
            .map((message, index) => (
              <div key={index} className="w-full">
                <div className="px-4 justify-center text-base md:gap-6 m-auto">
                  <div className="flex flex-1 text-base mx-auto gap-3 md:max-w-3xl lg:max-w-[40rem] xl:max-w-[48rem]">
                    <div>
                      {message.role === 'user' &&
                        (user.image ? (
                          <img
                            className="w-6 h-6 rounded-full"
                            src={user.image}
                            alt=""
                            width="24px"
                            height="24px"
                            loading="lazy"
                          />
                        ) : (
                          <Avatar name={user.email || user.uid} size="24px" variant="beam" square={false} />
                        ))}
                      {message.role === 'assistant' && <SiOpenai className="w-6 h-6 text-gray-500" />}
                    </div>
                    <div>
                      <div className="font-semibold select-none">{message.role === 'user' ? 'You' : 'Assistant'}</div>
                      {message.role === 'user' && <div className="whitespace-pre-wrap">{message.content}</div>}
                      {message.role === 'assistant' && (
                        <div>
                          <ReactMarkdown
                            rehypePlugins={[rehypeHighlight]}
                            components={{
                              pre: ({ node, children, ...props }) => {
                                let codeId: string | undefined = undefined;
                                let codeLanguage: string | undefined = undefined;
                                React.Children.forEach(children, (child) => {
                                  if (codeId) return;
                                  if (React.isValidElement(child) && child.type === 'code') {
                                    codeId = nanoid_case_insensitive(10);
                                    const className = child.props.className;
                                    const match = className?.match(/language-(\w+)/);
                                    if (match) {
                                      codeLanguage = match[1];
                                    }
                                  }
                                });
                                if (codeId) {
                                  return (
                                    <div className="my-4 hljs rounded-md p-0.5">
                                      <div
                                        className="flex justify-between bg-neutral-900 text-white text-xs px-3 py-2 rounded-t-md"
                                        data-language={codeLanguage}
                                      >
                                        <div>{codeLanguage}</div>
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            const content = document.getElementById(`pre-code-${codeId}`)?.textContent;
                                            if (!content) return;
                                            await global.navigator.clipboard.writeText(content);
                                          }}
                                        >
                                          Copy code
                                        </button>
                                      </div>
                                      <pre id={`pre-code-${codeId}`} {...props}>
                                        {children}
                                      </pre>
                                    </div>
                                  );
                                } else {
                                  return <pre {...props}>{children}</pre>;
                                }
                              },
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
        <div ref={endOfMessagesRef} className="h-4" aria-hidden="true" />
      </div>
      <div className="flex-none p-4">
        <form className="relative mx-auto md:max-w-3xl lg:max-w-[40rem] xl:max-w-[48rem]" onSubmit={handleSubmit}>
          <TextareaAutosize
            minRows={1}
            maxRows={8}
            value={input}
            onChange={handleInputChange}
            className={clsx(
              'w-full resize-none pl-4 pr-12 py-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-200',
              scrollbarStyles['scrollbar-thin'],
              scrollbarStyles['scrollbar-thin-xs']
            )}
            onKeyDown={(e) => {
              if (e.keyCode === 13 && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.closest('form')?.dispatchEvent(new Event('submit', { bubbles: true }));
              }
            }}
          />
          <button type="submit" className="absolute bottom-4 right-3">
            <BsArrowUpSquareFill className={clsx('w-7 h-7', input ? 'text-gray-500' : 'text-gray-300')} />
          </button>
        </form>
      </div>
    </>
  );
}
