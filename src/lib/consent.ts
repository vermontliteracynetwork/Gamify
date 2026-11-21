// Consent for anything optional (legal pass, 2026-11-21: "put a reject
// button on the cookie banner, stop loading trackers before consent").
// Gamify loads no trackers, analytics or ads, and stores only what it needs
// to work, so OPTIONAL is empty and no banner shows. Anything optional added
// later goes in OPTIONAL and loads only through loadIfAllowed: it stays off
// until the visitor accepts, and Reject is one tap, as easy as Accept.
export const OPTIONAL: { id: string; label: string }[] = [];
const KEY = 'gamify:consent';
export type Consent = 'accepted' | 'rejected' | null;

export function getConsent(): Consent {
  try { const v = localStorage.getItem(KEY); return v === 'accepted' || v === 'rejected' ? v : null; } catch { return null; }
}
export function setConsent(v: 'accepted' | 'rejected') {
  try { localStorage.setItem(KEY, v); } catch { /* private mode: ask again next time */ }
}
// The only door for an optional script: nothing loads without "accepted".
export function loadIfAllowed(src: string): boolean {
  if (getConsent() !== 'accepted') return false;
  const s = document.createElement('script'); s.src = src; s.async = true; document.head.appendChild(s);
  return true;
}
export const needsBanner = () => OPTIONAL.length > 0 && getConsent() === null;
