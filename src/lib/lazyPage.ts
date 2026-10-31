import { lazy, type ComponentType } from 'react';

// A tab left open across a new release asks for the old build's files, which
// are gone. Load the new release once instead of a blank page (teacher,
// 2026-10-31: "so many errors").
const KEY = 'gamify:reloaded-for-update';

export function reloadForUpdate(): boolean {
  try {
    if (Date.now() - Number(sessionStorage.getItem(KEY) ?? 0) < 30000) return false;
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch { /* storage blocked: still reload */ }
  window.location.reload();
  return true;
}

export function lazyPage<T extends ComponentType<any>>(load: () => Promise<{ default: T }>) { // eslint-disable-line @typescript-eslint/no-explicit-any
  return lazy(() => load().catch((e: unknown) => {
    // Never resolves while the page reloads, so nothing flashes.
    if (reloadForUpdate()) return new Promise<{ default: T }>(() => {});
    throw e;
  }));
}
