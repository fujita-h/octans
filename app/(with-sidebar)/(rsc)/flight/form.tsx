'use client';

import { useActions, useUIState } from 'ai/rsc';
import clsx from 'clsx/lite';
import { useState } from 'react';
import type { AI } from './action';

import scrollbarStyles from '../../scrollbar.module.css';

export default function Form() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useUIState<typeof AI>();
  const { submitUserMessage } = useActions<typeof AI>();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none flex items-center justify-center lg:justify-normal px-4 py-1 h-12 max-h-12 border-b border-gray-100">
        <div className="text-xl font-bold">ChatGPT</div>
      </div>
      <div className={clsx('flex-1 ml-4 py-1 overflow-auto', scrollbarStyles['scrollbar-thin'])}>
        {
          // View messages in UI state
          messages.map((message) => (
            <div key={message.id}>{message.display}</div>
          ))
        }
      </div>
      <div className="flex-none p-4">
        <form
          onSubmit={async (e) => {
            e.preventDefault();

            // Add user message to UI state
            setMessages((currentMessages) => [
              ...currentMessages,
              {
                id: Date.now(),
                display: <div>{inputValue}</div>,
              },
            ]);

            // Submit and get response message
            const responseMessage = await submitUserMessage(inputValue);
            setMessages((currentMessages) => [...currentMessages, responseMessage]);

            setInputValue('');
          }}
        >
          <input
            className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-200 "
            placeholder="Send a message..."
            value={inputValue}
            onChange={(event) => {
              setInputValue(event.target.value);
            }}
          />
        </form>
      </div>
    </div>
  );
}
