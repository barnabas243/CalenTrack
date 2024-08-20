import * as Crypto from 'expo-crypto';

export function generateUUID() {
  return Crypto.randomUUID();
}
