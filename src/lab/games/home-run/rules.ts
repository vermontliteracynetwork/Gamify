// Home Run Derby rules, kept apart so they can be tested.

// 0 is a miss (a strike, so an out); 1 to 4 bases is a single to a home run.
export type Hit = 0 | 1 | 2 | 3 | 4;
export const HIT_NAMES: Record<Hit, string> = { 0: 'Strike!', 1: 'Single!', 2: 'Double!', 3: 'Triple!', 4: 'HOME RUN!' };

// Each inning ends at three outs or after this many pitches, so a team
// never bats forever.
export const MAX_PITCHES = 5;
// Where the ball crosses the plate along the pitch (0 at the mound, 1 at the mitt).
export const CROSS = 0.8;
// How far off (ms) a swing can be and still hit, kind for young players.
export const SWING_WINDOW = 360;

// How a swing lands, from how far off the timing was (ms from the moment the
// ball crosses the plate). Close swings hit harder; a little luck moves the
// result one step up or down, and some fly balls get caught.
export function swingResult(errMs: number | null, opts: { giant?: boolean; rally?: boolean; rand?: () => number } = {}): { hit: Hit; caught: boolean } {
  const rand = opts.rand ?? Math.random;
  if (errMs === null) return { hit: 0, caught: false };
  const e = errMs / (opts.giant ? 1.6 : 1);
  let hit: Hit;
  if (e <= 95) hit = 4;
  else if (e <= 170) hit = rand() < 0.3 ? 4 : 3;
  else if (e <= 260) hit = 2;
  else if (e <= SWING_WINDOW) hit = 1;
  else return { hit: 0, caught: false };
  // A lucky bounce or a so-so hop.
  const luck = rand();
  if (luck < 0.12 && hit < 4) hit = (hit + 1) as Hit;
  else if (luck > 0.88 && hit > 1 && hit < 4) hit = (hit - 1) as Hit;
  // A silly outfielder sometimes makes the catch (never on a home run).
  const caught = hit < 4 && !opts.rally && rand() < 0.12;
  if (opts.rally && hit < 4) hit = (hit + 1) as Hit;
  return { hit, caught };
}

// Every runner moves `n` bases (0 is home plate, 4 is scored). The batter
// joins at home first. Returns who is still on base and how many scored.
export function advance(runners: number[], n: number, withBatter = true): { runners: number[]; runs: number } {
  const all = [...runners, ...(withBatter ? [0] : [])].map((at) => at + n);
  return { runners: all.filter((at) => at < 4), runs: all.filter((at) => at >= 4).length };
}

// The first open base from second up, for a pinch runner (null when full).
export function openBase(runners: number[]): number | null {
  for (const b of [2, 1, 3]) if (!runners.includes(b)) return b;
  return null;
}

export const inningOver = (outs: number, maxOuts: number, pitches: number) => outs >= maxOuts || pitches >= MAX_PITCHES;

// The computer's swing: off by a little when it is sharp, else a weak swing
// or no swing at all.
export function cpuSwing(sharp: boolean, rand: () => number = Math.random): number | null {
  if (sharp) return rand() * 170;
  return rand() < 0.5 ? 270 + rand() * 120 : null;
}
