// Touchdown Drive rules, kept apart so they can be tested.
// Yards run from 0 (your own goal line) to 100 (the end zone).

export type PlayId = 'run' | 'short' | 'bomb';
export const START_YARD = 20;
export const PLAYS_PER_DRIVE = 6;
export const TD_POINTS = 7;
export const FG_POINTS = 3;

export interface PlayResult { yards: number; complete: boolean; picked: boolean }
export interface PlayMods { juke?: boolean; turbo?: boolean; sprinkler?: boolean; rand?: () => number }

// Run: short and safe. Short pass: a good gain, sometimes dropped. Long
// throw: a huge gain, often incomplete, now and then caught by the other team.
export function runPlay(id: PlayId, m: PlayMods = {}): PlayResult {
  const rand = m.rand ?? Math.random;
  const between = (a: number, b: number) => Math.round(a + rand() * (b - a));
  let r: PlayResult;
  if (id === 'run') r = { yards: rand() < 0.1 ? between(0, 1) : between(3, 9), complete: true, picked: false };
  else if (id === 'short') r = rand() < 0.25 ? { yards: 0, complete: false, picked: false } : { yards: between(6, 16), complete: true, picked: false };
  else {
    const roll = rand();
    // About as many yards on average as a short pass, but all or nothing.
    r = roll < 0.06 ? { yards: 0, complete: false, picked: true } : roll < 0.7 ? { yards: 0, complete: false, picked: false } : { yards: between(22, 40), complete: true, picked: false };
  }
  // A juke never fails and slips past for extra yards.
  if (m.juke) r = { yards: Math.max(r.yards, id === 'run' ? 6 : id === 'short' ? 10 : 25) + 8, complete: true, picked: false };
  if (m.turbo && r.complete) r = { ...r, yards: r.yards * 2 };
  if (m.sprinkler && r.complete) r = { ...r, yards: Math.floor(r.yards / 2) };
  return r;
}

export function advanceBall(yard: number, gain: number): { yard: number; td: boolean } {
  const y = Math.max(1, Math.min(100, yard + gain));
  return { yard: y, td: y >= 100 };
}

// A field goal try when the drive stalls close enough (inside the 35).
export function fieldGoalChance(yard: number): number {
  if (yard < 65) return 0;
  return yard >= 80 ? 0.85 : 0.65;
}

// The computer: run near the end zone, throw deep when it is running out of plays.
export function cpuPlay(yard: number, left: number, sharp: boolean, rand: () => number = Math.random): PlayId {
  const toGo = 100 - yard;
  if (!sharp) return (['run', 'short', 'bomb'] as PlayId[])[Math.floor(rand() * 3)];
  if (toGo <= 9) return 'run';
  if (toGo > left * 12) return 'bomb';
  return rand() < 0.5 ? 'short' : 'run';
}

// Average yards a play gains, for checking balance.
export function expectedGain(id: PlayId, n = 6000): number {
  let sum = 0;
  for (let i = 0; i < n; i++) sum += runPlay(id).yards;
  return sum / n;
}
