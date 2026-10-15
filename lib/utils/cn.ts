// path: lib/utils/cn.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Compose a class name string from conditional fragments and resolve
 * conflicting Tailwind utilities deterministically.
 *
 * This is the single class name helper for the platform; no component may
 * build class strings by concatenation.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
