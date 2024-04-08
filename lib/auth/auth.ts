import { AdapterUser } from '@auth/core/adapters';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { nanoid } from 'nanoid';
import NextAuth, { Session } from 'next-auth';
import AzureAD from './providers/azure-ad';

import prisma from '@/lib/prisma';

export const {
  auth,
  signIn,
  signOut,
  handlers: { GET, POST },
} = NextAuth({
  secret: process.env.AUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'database',
    generateSessionToken: () => nanoid(160),
  },
  providers: [AzureAD],
  callbacks: {
    redirect: ({ url, baseUrl }) => {
      // Allows relative callback URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) {
        return url;
      }
      return baseUrl;
    },
    session: async ({ session, user: adapterUser }: { session: Session; user?: AdapterUser }) => {
      const user = getAdapterUser(adapterUser);
      return { ...session, user };
    },
  },
});

function getAdapterUser(u: any): AdapterUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image,
    emailVerified: u.emailVerified,
    uid: u.uid,
    roles: u.roles,
    //claims: u.claims,
  };
}
