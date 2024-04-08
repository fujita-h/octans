import { LoginForm } from '@/components/auth';
import z from 'zod';

export default async function Page({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // validate the searchParams
  const parsedSearchParams = z
    .object({
      callbackUrl: z.string().optional(),
    })
    .safeParse(searchParams);
  // if the searchParams are invalid, return undefined
  const callbackUrl = parsedSearchParams.success ? parsedSearchParams.data.callbackUrl : undefined;

  // After the user signs in successfully, they will be redirected to the callbackUrl if it was provided
  // if the callbackUrl is not provided, the user will be redirected to the root URL.
  return <LoginForm callbackUrl={callbackUrl || '/'} />;
}
