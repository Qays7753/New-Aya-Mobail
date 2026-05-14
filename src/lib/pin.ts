import { get, set } from 'idb-keyval';

const PIN_STORE_KEY = 'admin_pin';
const LOCKOUT_KEY = 'pin_lockout';

export interface StoredPin {
  hash: string;
  salt: string;
  isDefault: boolean;
}

export interface LockoutState {
  failedAttempts: number;
  lockoutUntil: number; // timestamp ms
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

export async function hashPin(pin: string, isDefault = false): Promise<StoredPin> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derivedBits = await deriveKey(pin, salt);
  
  return {
    hash: bufferToHex(derivedBits),
    salt: bufferToHex(salt.buffer),
    isDefault
  };
}

export async function verifyPin(pin: string, stored: StoredPin): Promise<boolean> {
  const salt = hexToBuffer(stored.salt);
  const derivedBits = await deriveKey(pin, salt);
  const hash = bufferToHex(derivedBits);
  
  return hash === stored.hash;
}

export async function savePin(pin: string, isDefault = false): Promise<void> {
  const hashed = await hashPin(pin, isDefault);
  await set(PIN_STORE_KEY, hashed);
}

export async function checkPin(pin: string): Promise<{ success: boolean; lockoutUntil?: number; isDefault?: boolean }> {
  // Check lockout
  const lockoutState = await get<LockoutState>(LOCKOUT_KEY) || { failedAttempts: 0, lockoutUntil: 0 };
  const now = Date.now();
  
  if (lockoutState.lockoutUntil > now) {
    return { success: false, lockoutUntil: lockoutState.lockoutUntil };
  }

  // Bootstrap if needed
  let stored = await get<StoredPin>(PIN_STORE_KEY);
  if (!stored) {
    await savePin('1234', true);
    stored = await get<StoredPin>(PIN_STORE_KEY);
  }

  const isValid = await verifyPin(pin, stored!);
  
  if (isValid) {
    // Reset lockout
    if (lockoutState.failedAttempts > 0) {
      await set(LOCKOUT_KEY, { failedAttempts: 0, lockoutUntil: 0 });
    }
    return { success: true, isDefault: stored!.isDefault };
  } else {
    // Increment attempts
    lockoutState.failedAttempts++;
    if (lockoutState.failedAttempts >= 5) {
      // 5 minutes lockout
      lockoutState.lockoutUntil = now + (5 * 60 * 1000);
      lockoutState.failedAttempts = 0; // reset for after lockout
    }
    await set(LOCKOUT_KEY, lockoutState);
    return { success: false, lockoutUntil: lockoutState.lockoutUntil > now ? lockoutState.lockoutUntil : undefined };
  }
}

export async function isPinSet(): Promise<boolean> {
  const stored = await get<StoredPin>(PIN_STORE_KEY);
  return !!stored && !stored.isDefault;
}

export async function requiresDefaultChange(): Promise<boolean> {
  const stored = await get<StoredPin>(PIN_STORE_KEY);
  // If not stored, we will bootstrap it on first check. But we return true because it needs change.
  if (!stored) return true;
  return !!stored.isDefault;
}

export async function getLockoutState(): Promise<LockoutState> {
  return await get<LockoutState>(LOCKOUT_KEY) || { failedAttempts: 0, lockoutUntil: 0 };
}
