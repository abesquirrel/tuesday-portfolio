
import { scryptSync, randomBytes } from 'crypto';

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_DURATION = 15 * 60 * 1000;

interface Session {
  userId: string;
  createdAt: number;
  expiresAt: number;
  csrfToken: string;
}

const loginAttempts: Record<string, { count: number; lastAttempt: number }> = {};

export const hashPassword = (password: string, salt: string = randomBytes(16).toString('hex')): string => {
  const derivedKey = scryptSync(password, salt, 64);
  return salt + ':' + derivedKey.toString('hex');
};

export const verifyPassword = (password: string, hash: string): boolean => {
  const parts = hash.split(':');
  if (parts.length !== 2) return false;
  const [salt, key] = parts;
  const derivedKey = scryptSync(password, salt, 64);
  return derivedKey.toString('hex') === key;
};

export const createSession = (userId: string = 'admin'): Session => ({
  userId,
  createdAt: Date.now(),
  expiresAt: Date.now() + SESSION_DURATION,
  csrfToken: randomBytes(32).toString('hex')
});

export const encodeSession = (session: Session, secret: string): string => {
  const sessionData = JSON.stringify(session);
  const signature = hashPassword(sessionData, secret);
  return Buffer.from(sessionData).toString('base64') + '.' + signature;
};

export const decodeSession = (cookieValue: string, secret: string): Session | null => {
  try {
    const parts = cookieValue.split('.');
    if (parts.length !== 2) return null;
    const [encodedData, signature] = parts;
    const sessionData = Buffer.from(encodedData, 'base64').toString('utf8');
    const expectedSignature = hashPassword(sessionData, secret);
    if (signature !== expectedSignature) return null;
    const session: Session = JSON.parse(sessionData);
    if (session.expiresAt < Date.now()) return null;
    return session;
  } catch (e) {
    return null;
  }
};

export const recordLoginAttempt = (identifier: string): { isLocked: boolean; remainingAttempts: number } => {
  const now = Date.now();
  if (loginAttempts[identifier] && now - loginAttempts[identifier].lastAttempt > LOGIN_LOCKOUT_DURATION) {
    delete loginAttempts[identifier];
  }
  if (!loginAttempts[identifier]) {
    loginAttempts[identifier] = { count: 1, lastAttempt: now };
  } else {
    loginAttempts[identifier].count++;
    loginAttempts[identifier].lastAttempt = now;
  }
  const isLocked = loginAttempts[identifier].count >= MAX_LOGIN_ATTEMPTS;
  const remainingAttempts = MAX_LOGIN_ATTEMPTS - loginAttempts[identifier].count;
  return { isLocked, remainingAttempts };
};

export const resetLoginAttempts = (identifier: string): void => {
  delete loginAttempts[identifier];
};

export const generateCsrfToken = (): string => {
  return randomBytes(32).toString('hex');
};

export const validateCsrfToken = (storedToken: string, submittedToken: string): boolean => {
  return storedToken === submittedToken;
};
