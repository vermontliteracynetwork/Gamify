import { BETA_ENDS, BETA_SPOTS_OPEN, TRIAL, type Tier } from '../config';

// The 7-day Plus reverse trial (owner, 2026-11-26). Pure date math here so it
// can be tested; the data layer (src/data/index.ts) uses it to turn the saved
// plan into the plan the teacher plays on. Teacher pages only: students never
// see a trial, a banner or a price.

const DAY = 86_400_000;
// A game left open in a forgotten tab never keeps Plus forever.
export const GAME_HOLD_MAX_HOURS = 4;

const RANK: Record<Tier, number> = { free: 0, homeschool: 1, plus: 1, pro: 2 };
// The higher of two plans (a paid plan always beats the trial).
export const higherTier = (a: Tier, b: Tier): Tier => (RANK[b] > RANK[a] ? b : a);

export const trialEndsAt = (start: string) => Date.parse(start) + TRIAL.days * DAY;

export interface TrialState {
  start: string;
  endsAt: number;
  // Whole days left, counting today: 7 on sign-up day, 1 on the last day.
  daysLeft: number;
  active: boolean;
}

export function trialState(start: string | null | undefined, now = Date.now()): TrialState | null {
  if (!start || Number.isNaN(Date.parse(start))) return null;
  const endsAt = trialEndsAt(start);
  const left = endsAt - now;
  return { start, endsAt, daysLeft: Math.max(0, Math.ceil(left / DAY)), active: left > 0 };
}

// The plan she plays on. `real` is the saved plan (undefined: none saved, so
// Free); `gameSince` is when the game open in this tab started, if any.
// The trial lifts only a Free plan: a paid plan, an access code or a beta
// plan always wins. A game that started before the trial ended keeps Plus
// until it ends (never lock anything mid-live-game).
export function effectiveTier(real: Tier | undefined, start: string | null | undefined, now = Date.now(), gameSince?: number | null): Tier | undefined {
  const s = trialState(start, now);
  if (!s || (real && real !== 'free')) return real;
  const holding = gameSince != null && gameSince < s.endsAt && now - s.endsAt < GAME_HOLD_MAX_HOURS * 3_600_000;
  return s.active || holding ? TRIAL.tier : real;
}

// Which reminder is due on her teacher pages: 3 days left, then 1 day left.
export function trialReminder(s: TrialState | null): 3 | 1 | null {
  if (!s?.active) return null;
  return s.daysLeft <= 1 ? 1 : s.daysLeft <= 3 ? 3 : null;
}

// The beta strip shows until the end of BETA_ENDS in Eastern time (EST in
// February, UTC-5), and only while spots remain.
export const betaEndsAt = () => Date.parse(`${BETA_ENDS}T23:59:59.999-05:00`);
export const betaOpen = (now = Date.now(), spotsOpen: boolean = BETA_SPOTS_OPEN) => spotsOpen && now <= betaEndsAt();

// Saved settings for the one-time screens (teacher pages only).
export const WELCOME_SEEN = 'welcome-seen';
export const TRIAL_SEEN = { remind3: 'trial-remind-3', remind1: 'trial-remind-1', ended: 'trial-end-seen' } as const;

// The game open in this tab (live host or a teacher's game page). Kept per
// tab, so a forgotten tab cannot hold Plus for another one.
const GAME = 'gamify:game-since';
export const TIER_EVENT = 'gamify-tier';
export function gameSince(): number | null {
  try { const v = sessionStorage.getItem(GAME); return v ? Number(v) : null; } catch { return null; }
}
// Call when a hosted game opens; the returned function ends the hold when
// the game closes, and the plan is checked again.
export function holdPlanForGame(now = Date.now()): () => void {
  try { if (!sessionStorage.getItem(GAME)) sessionStorage.setItem(GAME, String(now)); } catch { /* private window */ }
  return () => {
    try { sessionStorage.removeItem(GAME); } catch { /* private window */ }
    window.dispatchEvent(new Event(TIER_EVENT));
  };
}
