import { get, set } from 'idb-keyval';

const PIN_STORE_KEY = 'admin_pin';

export interface StoredPin {
  hash: string;
  salt: string;
}

// Convert ArrayBuffer to Hex String
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert Hex String to Uint8Array
function hexToBuffer(hex: string): Uint8Array {
  const match = hex.match(/.{1,2}/g);
  if (!match) return new Uint8Array();
  return new Uint8Array(match.map((byte) => parseInt(byte, 16)));
}

async function deriveKey(pin: string, salt: Uint8Array): Promise<ArrayBuffer> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  return crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 200000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256 // length in bits
  );
}

export async function hashPin(pin: string): Promise<StoredPin> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derivedBits = await deriveKey(pin, salt);
  
  return {
    hash: bufferToHex(derivedBits),
    salt: bufferToHex(salt.buffer),
  };
}

export async function verifyPin(pin: string, stored: StoredPin): Promise<boolean> {
  const salt = hexToBuffer(stored.salt);
  const derivedBits = await deriveKey(pin, salt);
  const hash = bufferToHex(derivedBits);
  
  return hash === stored.hash;
}

export async function savePin(pin: string): Promise<void> {
  const hashed = await hashPin(pin);
  await set(PIN_STORE_KEY, hashed);
}

export async function checkPin(pin: string): Promise<boolean> {
  const stored = await get<StoredPin>(PIN_STORE_KEY);
  if (!stored) {
    // If no PIN exists, default is 1234
    const defaultHash = await hashPin('1234');
    return verifyPin(pin, defaultHash);
  }
  return verifyPin(pin, stored);
}

export async function isPinSet(): Promise<boolean> {
  const stored = await get<StoredPin>(PIN_STORE_KEY);
  return !!stored;
}
