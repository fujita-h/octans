import SidebarLayout from '@/components/layouts/sidebar';
import { auth } from '@/lib/auth';

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (!session || !session.user) {
    return <>{children}</>;
  }

  return <SidebarLayout user={session.user}>{children}</SidebarLayout>;
}
