import { nanoid } from 'nanoid';

const DEVICE_ID_KEY = 'pos.device_id';
const DEVICE_NAME_KEY = 'pos.device_name';
const DEFAULT_DEVICE_NAME = 'تابلت رقم 1';

let cachedDeviceId: string | null = null;

export function getDeviceId(): string {
  if (cachedDeviceId) return cachedDeviceId;
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = 'dev_' + nanoid(10);
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    cachedDeviceId = id;
    return id;
  } catch (e) {
    console.warn('localStorage not available, using in-memory device id:', e);
    if (!cachedDeviceId) cachedDeviceId = 'dev_' + nanoid(10);
    return cachedDeviceId;
  }
}

export function getDeviceName(): string {
  try {
    return localStorage.getItem(DEVICE_NAME_KEY) || DEFAULT_DEVICE_NAME;
  } catch (e) {
    console.warn('localStorage not available for device name:', e);
    return DEFAULT_DEVICE_NAME;
  }
}

export function setDeviceName(name: string): void {
  try {
    localStorage.setItem(DEVICE_NAME_KEY, name);
  } catch (e) {
    console.warn('localStorage not available, device name not persisted:', e);
  }
}
