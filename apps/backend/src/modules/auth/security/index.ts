import { scryptSync, randomBytes } from 'node:crypto';

export const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString('hex');
  const hashed = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hashed}`;
};

export const comparePasswords = (password: string, storedValue: string) => {
  const [salt, hash] = storedValue.split(':');
  const hashedInput = scryptSync(password, salt, 64).toString('hex');
  return hash === hashedInput;
};