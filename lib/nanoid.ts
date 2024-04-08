import { customAlphabet } from 'nanoid/non-secure';
export { nanoid } from 'nanoid';

export const nanoid_case_insensitive = (size?: number) => customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz')(size);
