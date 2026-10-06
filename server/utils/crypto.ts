import crypto from 'crypto';

/**
 * Generates a secure SHA-256 HMAC hash of the password using a system-level pepper salt.
 */
export function hashPassword(password: string): string {
  if (!password) return '';
  const pepper = process.env.PASSWORD_PEPPER || 'passguard_secure_system_pepper_salt_99';
  return crypto.createHmac('sha256', pepper).update(password).digest('hex');
}

/**
 * Verifies if the plaintext password matches the stored hash (with legacy plaintext fallback).
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;
  
  // Safe fallback for unhashed/legacy seed passwords during migration
  if (password === storedHash) {
    return true;
  }
  
  return hashPassword(password) === storedHash;
}
