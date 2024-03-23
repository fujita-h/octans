import { auth } from '@/lib/auth';
import { LoginForm } from '@/components/auth';

export default async function Page() {
  const session = await auth();

  if (!session) {
    return <LoginForm />;
  }

  return <p>Welcome to Octans!</p>;
}
