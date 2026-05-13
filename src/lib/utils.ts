import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate sequential numbers for invoices, etc.
// Example: INV-000001
export function generateSequenceNumber(prefix: string, lastVal: number, padding = 6): string {
  const nextVal = lastVal + 1;
  return `${prefix}-${nextVal.toString().padStart(padding, '0')}`;
}
