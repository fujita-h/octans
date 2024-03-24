import { nanoid_case_insensitive } from '@/lib/nanoid';
import AzureAD from 'next-auth/providers/azure-ad';

const provider = AzureAD({
  clientId: process.env.AZURE_AD_CLIENT_ID,
  clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
  tenantId: process.env.AZURE_AD_TENANT_ID,
  checks: ['pkce', 'state', 'nonce'],
  profile: async (profile, tokens) => {
    // https://docs.microsoft.com/en-us/graph/api/profilephoto-get?view=graph-rest-1.0#examples
    const response = await fetch(`https://graph.microsoft.com/v1.0/me/photos/48x48/$value`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    // Confirm that profile photo was returned
    let image;
    // TODO: Do this without Buffer
    if (response.ok && typeof Buffer !== 'undefined') {
      try {
        const pictureBuffer = await response.arrayBuffer();
        const pictureBase64 = Buffer.from(pictureBuffer).toString('base64');
        image = `data:image/jpeg;base64, ${pictureBase64}`;
      } catch {}
    }

    return {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
      image: image ?? null,
      uid: nanoid_case_insensitive(16),
      roles: profile.roles,
      claims: profile,
    };
  },
});

export default provider;
