import { User } from '@auth/core';
declare module '@auth/core/types' {
  interface User {
    uid: string;
    roles: string[];
    claims?: any;
  }
}
