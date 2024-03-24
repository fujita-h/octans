import { LoginForm } from '@/components/auth';
import ThemeSwitch from '@/components/theme-switch';
import { auth } from '@/lib/auth';

export default async function Page() {
  const session = await auth();

  if (!session || !session.user) {
    return <LoginForm />;
  }

  return (
    <div>
      <ThemeSwitch />
    </div>
  );
}
