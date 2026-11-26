import { useEffect } from 'react';
import { useTier } from './hooks';

// Free saves nothing after today (owner, 2026-11-26: "delete free data
// nightly"). On this device, every answer logged before today is removed the
// first time the app opens on a new day; in the cloud a nightly job does the
// same (supabase/migrations/0017_free_history_cleanup.sql).
const KEY = 'gamify:log';
const DONE = 'gamify:free-cleanup-day';

export function purgeBeforeToday(now = new Date()): number {
  const today = now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return 0;
    const log = JSON.parse(raw) as { at: string }[];
    const kept = log.filter((e) => new Date(e.at).toLocaleDateString('en-CA', { timeZone: 'America/New_York' }) >= today);
    if (kept.length !== log.length) localStorage.setItem(KEY, JSON.stringify(kept));
    localStorage.setItem(DONE, today);
    return log.length - kept.length;
  } catch { return 0; }
}

export default function FreeCleanup() {
  const tier = useTier();
  useEffect(() => { if (tier === 'free') purgeBeforeToday(); }, [tier]);
  return null;
}
