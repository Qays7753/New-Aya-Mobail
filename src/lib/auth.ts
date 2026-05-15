import { get, set } from 'idb-keyval';

// Uses PBKDF2 with SHA-256, 200,000 iterations, 16-byte salt
async function deriveKey(pin: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const saltArray = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltArray,
      iterations: 200000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256 // 32 bytes
  );

  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashCode(code: string): Promise<{ hash: string, salt: string }> {
  const saltArray = new Uint8Array(16);
  crypto.getRandomValues(saltArray);
  const saltHex = Array.from(saltArray).map(b => b.toString(16).padStart(2, '0')).join('');
  
  const hash = await deriveKey(code, saltHex);
  return { hash, salt: saltHex };
}

export async function verifyCode(code: string, stored: { hash: string, salt: string }): Promise<boolean> {
  const hashToVerify = await deriveKey(code, stored.salt);
  return hashToVerify === stored.hash;
}

export async function ensureDefaults() {
  const daily = await get('daily_lock');
  if (!daily) {
    const code = await hashCode("1234");
    await set('daily_lock', code);
  }

  const admin = await get('admin_pin');
  if (!admin) {
    const code = await hashCode("0000");
    await set('admin_pin', code);
  }
}

// Temporary backdoor to reset pins to default
// Type window.resetPins() in browser console
(window as any).resetPins = async () => {
  await set('daily_lock', await hashCode("1234"));
  await set('admin_pin', await hashCode("0000"));
  await set('pin_lockout_daily', null);
  await set('pin_lockout_admin', null);
  alert("تم استعادة الارقام السرية للوضع الافتراضي (1234 لليومية و 0000 للمشرف)");
  window.location.reload();
};

export async function isDefaultDailyLock(): Promise<boolean> {
  const stored = await get('daily_lock');
  if (!stored) return true;
  return verifyCode("1234", stored);
}

export async function isDefaultAdminPin(): Promise<boolean> {
  const stored = await get('admin_pin');
  if (!stored) return true;
  return verifyCode("0000", stored);
}

export async function isDailyLockRequired(): Promise<boolean> {
  const lastUnlockAt = await get('lastUnlockAt');
  if (!lastUnlockAt) return true;

  const lastUnlockDate = new Date(lastUnlockAt);
  const now = new Date();

  // Condition 1: 8 hours passed
  const timeDiff = now.getTime() - lastUnlockDate.getTime();
  if (timeDiff >= 8 * 60 * 60 * 1000) return true;

  // Condition 2: Different calendar day (miladi)
  if (
    now.getFullYear() !== lastUnlockDate.getFullYear() ||
    now.getMonth() !== lastUnlockDate.getMonth() ||
    now.getDate() !== lastUnlockDate.getDate()
  ) {
    return true;
  }

  return false;
}

export async function markUnlocked() {
  await set('lastUnlockAt', new Date().toISOString());
  await set('pin_lockout_daily', null);
}

export async function changeDailyLock(newCode: string, currentAdminPin: string) {
  // First verify admin pin
  const storedAdmin = await get('admin_pin');
  if (!storedAdmin || !(await verifyCode(currentAdminPin, storedAdmin))) {
    throw new Error('Admin PIN incorrect');
  }

  const codeData = await hashCode(newCode);
  await set('daily_lock', codeData);
}

export async function changeAdminPin(currentPin: string, newPin: string) {
  const storedAdmin = await get('admin_pin');
  if (!storedAdmin || !(await verifyCode(currentPin, storedAdmin))) {
    throw new Error('Admin PIN incorrect');
  }

  const codeData = await hashCode(newPin);
  await set('admin_pin', codeData);
}

function lockoutKey(level: 'daily' | 'admin'): string {
  return level === 'daily' ? 'pin_lockout_daily' : 'pin_lockout_admin';
}

export async function recordFailedAttempt(level: 'daily' | 'admin') {
  const key = lockoutKey(level);
  const lockData = await get(key) || { attempts: 0, lockedUntil: 0 };

  if (Date.now() < lockData.lockedUntil) return; // already locked

  lockData.attempts += 1;
  if (lockData.attempts >= 5) {
    lockData.lockedUntil = Date.now() + 2 * 60 * 1000; // 2 mins lock
    lockData.attempts = 0;
  }

  await set(key, lockData);
}

export async function isLocked(level: 'daily' | 'admin'): Promise<boolean> {
  const lockData = await get(lockoutKey(level));
  if (!lockData) return false;
  return Date.now() < lockData.lockedUntil;
}

export async function getLockoutSecondsRemaining(level: 'daily' | 'admin'): Promise<number> {
  const lockData = await get(lockoutKey(level));
  if (!lockData) return 0;
  return Math.max(0, Math.ceil((lockData.lockedUntil - Date.now()) / 1000));
}
