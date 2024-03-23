import { nanoid_case_insensitive } from '@/lib/nanoid';
import AzureAD from 'next-auth/providers/azure-ad';

const provider = AzureAD({
  clientId: process.env.AZURE_AD_CLIENT_ID,
  clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
  tenantId: process.env.AZURE_AD_TENANT_ID,
  checks: ['pkce', 'state', 'nonce'],
  profile: (profile) => ({
    id: profile.sub,
    name: profile.name,
    email: profile.email,
    image: undefined,
    uid: nanoid_case_insensitive(16),
    roles: profile.roles,
    claims: profile,
  }),
});

export default provider;
