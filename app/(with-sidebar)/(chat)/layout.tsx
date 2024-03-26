import { AI } from './action';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AI>{children}</AI>;
}
