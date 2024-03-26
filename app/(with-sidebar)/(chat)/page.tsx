import { LoginForm } from '@/components/auth';
import { auth } from '@/lib/auth';
import Chat from './form';
export default async function Page() {
  const session = await auth();

  if (!session || !session.user) {
    return <LoginForm />;
  }

  return <Chat />;
}
