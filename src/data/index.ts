import { createLocalStore } from './localStore';
import type { DataStore } from './store';

// The app's one data store. Swapped for the cloud backend in Stage 5.
export const data: DataStore = createLocalStore();

export function newId(prefix: string): string {
  const rand = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  return `${prefix}_${rand}`;
}
