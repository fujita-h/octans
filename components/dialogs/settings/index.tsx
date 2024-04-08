'use client';

import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx/lite';
import { Fragment, useState } from 'react';
import { IoSettingsOutline } from 'react-icons/io5';
import SettingGeneral from './setting-general';

type Category = {
  id: string;
  name: string;
  icon: React.ElementType;
  node: React.ElementType;
};

const categories: Category[] = [{ id: 'general', name: '一般', icon: IoSettingsOutline, node: SettingGeneral }];

export default function SettingDialog({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  const [currentCategory, setCurrentCategory] = useState<Category>(categories[0]);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[10]" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-[10] w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-neutral-900 pt-5 sm:pt-5 pb-4 sm:pb-6 text-left shadow-xl transition-all sm:my-8 w-full sm:max-w-lg md:max-w-2xl lg:max-w-3xl">
                <div className="absolute right-0 top-0 pr-4 pt-4 sm:pt-4 block">
                  <button
                    type="button"
                    className="rounded-md text-gray-400 dark:text-white hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2"
                    onClick={() => setOpen(false)}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="border-b pb-2 pl-4 sm:pl-6">
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6">
                    設定
                  </Dialog.Title>
                </div>

                <div className="mx-auto lg:flex lg:gap-x-8 lg:px-8">
                  <aside className="flex overflow-x-auto border-b border-gray-900/5 py-4 lg:block lg:w-48 lg:flex-none lg:border-0">
                    <nav className="flex-none px-4 sm:px-6 lg:px-0">
                      <ul role="list" className="flex gap-x-3 gap-y-1 whitespace-nowrap lg:flex-col">
                        {categories.map((item) => (
                          <li key={item.id}>
                            <span
                              className={clsx(
                                item.id === currentCategory.id
                                  ? 'bg-gray-200/90 dark:bg-neutral-700/90'
                                  : 'hover:cursor-pointer',
                                'group flex gap-x-3 rounded-md py-2 pl-2 pr-3 text-sm leading-6 font-semibold'
                              )}
                              onClick={() => setCurrentCategory(item)}
                            >
                              <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                              {item.name}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </nav>
                  </aside>

                  <main className="px-4 py-4 sm:px-6 lg:flex-auto lg:px-0">
                    <currentCategory.node />
                  </main>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
