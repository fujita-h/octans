'use client';

import { BuiltInProviderType } from 'next-auth/providers';
import { LiteralUnion, signIn } from 'next-auth/react';

/**
 * Renders a sign-in button component.
 *
 * @param {Object} props - The component props.
 * @param {LiteralUnion<BuiltInProviderType>} props.provider - The provider for sign-in.
 * @param {string} props.callbackUrl - The callback URL after sign-in.
 * @param {string} props.className - The CSS class name for the button.
 * @param {React.ReactNode} props.children - The content of the button.
 * @returns {React.ReactElement} The sign-in button component.
 */
export function LoginButton({
  provider,
  callbackUrl,
  className,
  children,
}: {
  provider?: LiteralUnion<BuiltInProviderType>;
  callbackUrl?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      className={className}
      type="button"
      onClick={() => {
        signIn(provider, { callbackUrl });
      }}
    >
      {children}
    </button>
  );
}
