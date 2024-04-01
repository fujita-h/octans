'use client';

import { Fragment, useEffect, useState, useMemo, useRef } from 'react';
import { useChat } from 'ai/react';
import clsx from 'clsx/lite';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import { type ChatModelData, type ChatData, type ChatModelInfo, ChatMessageData } from '@/types/chat';
import useSWR from 'swr';

import scrollbarStyles from '../../../scrollbar.module.css';
import Link from 'next/link';

export function NewChat({ modelOptions }: { modelOptions: ChatModelInfo[] }) {
  const model = modelOptions.find((model) => model.default) || modelOptions[0];
  let data: ChatData | undefined = {
    provider: model.provider,
    model: model.model,
    variables: model.variables,
    id: undefined,
    messages: model.system_prompt ? [{ id: '', role: 'system', content: model.system_prompt }] : [],
  };
  return <ChatFrame modelOptions={modelOptions} chatData={data} />;
}

export function SavedChat({ id, modelOptions }: { id: string; modelOptions: ChatModelInfo[] }) {
  const { data, isLoading, error } = useSWR(`/api/conversation/${id}`, {
    revalidateOnMount: true,
    revalidateOnFocus: false,
    dedupingInterval: 0,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  // Map the data to the ChatData type
  const chatData: ChatData = {
    provider: data.provider,
    model: data.model,
    variables: data.variables,
    id: data.id,
    messages: data.messages,
  };

  return <ChatFrame modelOptions={modelOptions} chatData={chatData} />;
}

// Separate ModelSelectMenu and Chat components.
// This is to avoid re-rendering the ModelSelectMenu component when the Chat component re-renders.
function ChatFrame({ modelOptions, chatData }: { modelOptions: ChatModelInfo[]; chatData: ChatData }) {
  const defaultModel =
    modelOptions.find((model) => model.provider === chatData.provider && model.model === chatData.model) ||
    modelOptions.find((model) => model.default) ||
    modelOptions[0];
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  return (
    <div className="flex flex-col h-full">
      <Link href="/chat2/test">Chat2</Link>
      <div className="flex-none flex items-center justify-center lg:justify-normal px-4 py-1 h-12 max-h-12 border-b border-gray-100">
        <ModelSelectMenu options={modelOptions || []} selected={selectedModel} setSelected={setSelectedModel} />
      </div>
      <Chat chatMessageData={chatData} chatModel={selectedModel} />
    </div>
  );
}

function ModelSelectMenu({
  id,
  options,
  selected,
  setSelected,
}: {
  id?: string;
  options: any[];
  selected: any;
  setSelected: (value: any) => void;
}) {
  return (
    <Listbox value={selected} onChange={setSelected}>
      {({ open }) => (
        <>
          <Listbox.Label className="sr-only">Change model</Listbox.Label>
          <div className="relative">
            <Listbox.Button className="border border-neutral-200 rounded-md">
              <div className="flex items-center gap-x-1.5 px-3 py-2">
                <p className="text-sm font-semibold">{selected.name}</p>
                <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
              </div>
            </Listbox.Button>

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute right-0 z-10 mt-2 w-72 origin-top-right divide-y divide-gray-200 overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                {options.map((option, index) => (
                  <Listbox.Option
                    key={index}
                    className={({ active }) =>
                      clsx(
                        active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                        'cursor-default select-none p-4 text-sm'
                      )
                    }
                    value={option}
                  >
                    {({ selected, active }) => (
                      <div className="flex flex-col">
                        <div className="flex justify-between">
                          <p className={selected ? 'font-semibold' : 'font-normal'}>{option.model}</p>
                          {selected ? (
                            <span className={active ? 'text-white' : 'text-indigo-600'}>
                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                          ) : null}
                        </div>
                        <p className={clsx(active ? 'text-indigo-200' : 'text-gray-500', 'mt-2')}>
                          {option.description}
                        </p>
                      </div>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </>
      )}
    </Listbox>
  );
}

function Chat({ chatModel, chatMessageData }: { chatModel: ChatModelData; chatMessageData: ChatMessageData }) {
  const [lastRecievedMessage, setLastRecievedMessage] = useState({ role: '', content: '' });

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: `/api/chat/${chatModel.provider}`,
    initialMessages: chatMessageData.messages || [],
    body: { id: chatMessageData.id, provider: chatModel.provider, model: chatModel.model },
    onFinish: (data) => {
      setLastRecievedMessage(data);
    },
  });

  useEffect(() => {
    if (messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== lastRecievedMessage.role) return;
    if (lastMessage.content === lastRecievedMessage.content) {
      console.log('lastMessage Fire', lastMessage, chatModel.provider, chatModel.model, chatMessageData.id);
      (async () => {
        if (!chatMessageData.id) {
          const response = await fetch(`/api/conversation`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              provider: chatModel.provider,
              model: chatModel.model,
              variables: chatModel.variables,
              messages: messages,
            }),
          });
          const data = await response.json();
          console.log('Create Fired', data);
        } else {
          const response = await fetch(`/api/conversation/${chatMessageData.id}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              provider: chatModel.provider,
              model: chatModel.model,
              variables: chatModel.variables,
              messages: messages,
            }),
          });
          const data = await response.json();
          console.log('Update Fired', data);
        }
      })();
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
