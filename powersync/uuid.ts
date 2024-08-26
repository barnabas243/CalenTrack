import * as Crypto from 'expo-crypto';

/**
 * simple UUID generator for unique keys
 * @returns {string} UUID
 */
export function generateUUID() {
  return Crypto.randomUUID();
}
