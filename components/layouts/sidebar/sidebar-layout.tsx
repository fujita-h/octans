'use client';

import SettingDialog from '@/components/dialogs/settings';
import type { ChatData } from '@/types/chat';
import type { User } from '@auth/core/types';
import { Dialog, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, PencilSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Avatar from 'boring-avatars';
import clsx from 'clsx/lite';
import Link from 'next/link';
import { Fragment, useEffect, useState } from 'react';
import { FiLogOut } from 'react-icons/fi';
import { IoSettingsOutline } from 'react-icons/io5';
import { MdOutlineApps } from 'react-icons/md';
import { useInView } from 'react-intersection-observer';
import useSWRInfinite from 'swr/infinite';
import styles from './styles.module.css';

export default function SidebarLayout({ user, children }: { user: User; children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div>
      {/* Sidebar for small desktop and mobile, overlay when opened */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[5] lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-neutral-900/50" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-64 flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                {/* Sidebar component, swap this element with another sidebar if you like */}
                <div className="flex grow flex-col gap-y-5 overflow-y-auto">
                  <SidebarContent user={user} />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Open sidebar button for small desktop and mobile */}
      <div className="absolute top-2 left-3 z-[5] lg:hidden">
        <button type="button" className="-m-2.5 p-2.5 lg:hidden" onClick={() => setSidebarOpen(true)}>
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      {/* Static sidebar for large desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        {/* Sidebar component, swap this element with another sidebar if you like */}
        <SidebarContent user={user} />
      </div>

      {/* Main content */}
      <main className="lg:pl-64 h-[100vh] bg-white dark:bg-neutral-800">{children}</main>
    </div>
  );
}

function SidebarContent({ user }: { user: User }) {
  const { ref, inView } = useInView();
  const getKey = (pageIndex: number, previousPageData: ChatData[][]) => {
    if (previousPageData && !previousPageData.length) return null; // reached the end
    return `/api/conversation?page=${pageIndex + 1}`; // SWR key
  };

  const { data, size, setSize, isValidating } = useSWRInfinite(getKey, (url) => fetch(url).then((res) => res.json()), {
    revalidateAll: true,
  });

  useEffect(() => {
    const isReachingEnd = data && data[data.length - 1]?.length === 0;
    if (inView && !isReachingEnd && !isValidating) {
      setSize(size + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, data, isValidating]);

  return (
    <div className="flex grow flex-col gap-y-2 overflow-y-auto p-3 pr-1 bg-gray-100 dark:bg-black">
      <div className="flex-none pr-2">
        <Link href="/c">
          <div className="w-full flex items-center justify-between rounded-md p-2 text-gray-500 dark:text-neutral-400 hover:bg-gray-200/85 dark:hover:bg-gray-200/15">
            <div className="text-base font-semibold">New Chat</div>
            <PencilSquareIcon className="w-5 h-5" />
          </div>
        </Link>
      </div>
      <div className={clsx('flex flex-col flex-1 overflow-y-auto pr-1', styles['scrollbar-thin'])}>
        {data?.flat().map((conversation: any) => {
          const type = conversation.chat?.id ? 'c' : undefined;
          if (!type) return null;
          return (
            <div
              key={conversation.id}
              className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-200/85 dark:hover:bg-gray-200/15 group"
            >
              <div className="flex-grow truncate">
                <Link href={`/${type}/${conversation.id}`}>
                  <div className="text-xs text-gray-500 dark:text-neutral-400 truncate">{conversation.title}</div>
                </Link>
              </div>
              <div className="flex-none text-xs hidden group-hover:block"> ic </div>
            </div>
          );
        })}
        <div ref={ref} aria-hidden="true" />
      </div>
      <div className="flex-none">
        <ProfileButtonMenu user={user} />
      </div>
    </div>
  );
}

function ProfileButtonMenu({ user }: { user: User }) {
  const [openSettingDialog, setOpenSettingDialog] = useState(false);
  return (
    <Menu as="div" className="relative inline-block text-left w-full">
      <div>
        <Menu.Button className="w-full">
          <div className="flex items-center gap-2 rounded-md p-2 mr-2 hover:bg-gray-200/85 dark:hover:bg-gray-200/15">
            <div className="flex-none">
              {user.image ? (
                <img className="w-8 h-8 rounded-full" src={user.image} alt="" width="32" height="32" loading="lazy" />
              ) : (
                <Avatar name={user.email || user.uid} size="32px" variant="beam" square={false} />
              )}
            </div>
            <div className="text-sm truncate">{user.name}</div>
          </div>
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
        <Menu.Items className="absolute bottom-14 z-[5] mt-2 px-1 w-[232px] origin-bottom-left divide-y divide-gray-100 dark:divide-neutral-700 rounded-md bg-white dark:bg-neutral-800 shadow-lg ring-1 ring-black dark:ring-neutral-700 ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <a
                  href="#"
                  className={clsx(
                    active
                      ? 'bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-neutral-100'
                      : 'text-gray-700 dark:text-white',
                    'group flex items-center px-4 py-2 text-sm rounded-md'
                  )}
                >
                  <MdOutlineApps
                    className="mr-3 h-5 w-5 text-gray-500 dark:text-white group-hover:text-gray-600 dark:group-hover:text-gray-100"
                    aria-hidden="true"
                  />
                  マイ アプリ
                </a>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  type="button"
                  className={clsx(
                    active
                      ? 'bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-neutral-100'
                      : 'text-gray-700 dark:text-white',
                    'group flex items-center w-full px-4 py-2 text-sm rounded-md'
                  )}
                  onClick={() => setOpenSettingDialog(true)}
                >
                  <IoSettingsOutline
                    className="mr-3 h-5 w-5 text-gray-500 dark:text-white group-hover:text-gray-600 dark:group-hover:text-gray-100"
                    aria-hidden="true"
                  />
                  設定
                </button>
              )}
            </Menu.Item>
          </div>
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  type="button"
                  className={clsx(
                    active
                      ? 'bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-neutral-100'
                      : 'text-gray-700 dark:text-white',
                    'group flex items-center w-full px-4 py-2 text-sm rounded-md'
                  )}
                >
                  <FiLogOut
                    className="mr-3 h-5 w-5 text-gray-500 dark:text-white group-hover:text-gray-600 dark:group-hover:text-gray-100"
                    aria-hidden="true"
                  />
                  ログアウト
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
      <SettingDialog open={openSettingDialog} setOpen={setOpenSettingDialog} />
    </Menu>
  );
}
