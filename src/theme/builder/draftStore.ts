import type { GameTheme } from '../types';

// The Theme Builder's work in progress, kept on this device as it changes
// (teacher, 2026-11-01: "make sure you save drafts as I toggle between
// tabs"), so moving between tabs, pages or games never loses a picture.
// IndexedDB, because pictures are too big for localStorage.
const DB = 'gamify-drafts', STORE = 'themes';

function open(): Promise<IDBDatabase | null> {
  return new Promise((ok) => {
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => ok(req.result);
      req.onerror = () => ok(null);
    } catch { ok(null); }
  });
}

export async function loadDraft(gameId: string): Promise<GameTheme | null> {
  const db = await open();
  if (!db) return null;
  return new Promise((ok) => {
    try {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(gameId);
      req.onsuccess = () => ok((req.result as GameTheme | undefined) ?? null);
      req.onerror = () => ok(null);
    } catch { ok(null); }
  });
}

export async function saveDraft(gameId: string, theme: GameTheme | null): Promise<void> {
  const db = await open();
  if (!db) return;
  try {
    const store = db.transaction(STORE, 'readwrite').objectStore(STORE);
    if (theme) store.put(theme, gameId); else store.delete(gameId);
  } catch { /* a full or blocked store keeps the page working */ }
}

// Each piece's last upload, before any drawing on it, so the Draw studio can
// restore it (teacher, 2026-11-02: "add a restore for eraser").
const originalKey = (themeId: string, pieceId: string) => `original:${themeId}:${pieceId}`;

export async function loadOriginal(themeId: string, pieceId: string): Promise<string | undefined> {
  const db = await open();
  if (!db) return undefined;
  return new Promise((ok) => {
    try {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(originalKey(themeId, pieceId));
      req.onsuccess = () => ok(typeof req.result === 'string' ? req.result : undefined);
      req.onerror = () => ok(undefined);
    } catch { ok(undefined); }
  });
}

export async function saveOriginal(themeId: string, pieceId: string, image: string | undefined): Promise<void> {
  const db = await open();
  if (!db) return;
  try {
    const store = db.transaction(STORE, 'readwrite').objectStore(STORE);
    if (image) store.put(image, originalKey(themeId, pieceId)); else store.delete(originalKey(themeId, pieceId));
  } catch { /* fine without: Restore then uses the picture the studio opened with */ }
}
