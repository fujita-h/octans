import { User } from '@auth/core/types';
declare module '@auth/core/types' {
  interface User {
    uid: string;
    roles: string[];
    claims?: any;
  }
}
