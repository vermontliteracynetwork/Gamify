// Goal Kick rules, kept apart so they can be tested.
// The goal has six zones: 0 1 2 across the top, 3 4 5 along the bottom.

export type Zone = 0 | 1 | 2 | 3 | 4 | 5;
export const ZONES: Zone[] = [0, 1, 2, 3, 4, 5];
export const col = (z: Zone) => z % 3;
export const row = (z: Zone) => Math.floor(z / 3);
// The top corners are hardest to reach: 3 points. Everything else is 2.
export const zonePoints = (z: Zone) => (z === 0 || z === 2 ? 3 : 2);

export type GoalieLevel = 'easy' | 'medium' | 'hard' | 'none';
// How often the goalie guesses the right zone.
export const GUESS: Record<GoalieLevel, number> = { easy: 0.22, medium: 0.3, hard: 0.38, none: 0.3 };
// Top corners score more but are riskier: the post, and a long goalie reach.
export const POST_CHANCE = 0.22;
export const CORNER_REACH = 0.4;

export type Outcome = 'goal' | 'save' | 'post';

// Where the goalie dives: the kick's zone as often as its level says, else
// another zone at random.
export function goalieDive(kick: Zone, level: GoalieLevel, rand: () => number = Math.random): Zone {
  if (rand() < GUESS[level]) return kick;
  const others = ZONES.filter((z) => z !== kick);
  return others[Math.floor(rand() * others.length)];
}

// The goalie saves a ball in its zone, and a fingertip save sometimes reaches
// a neighbor in the same row. Top corners ping off the post more often, and
// a goalie diving low on that side can still stretch up to them.
export function kickOutcome(kick: Zone, dive: Zone | null, opts: { tiny?: boolean; rand?: () => number } = {}): Outcome {
  const rand = opts.rand ?? Math.random;
  const corner = kick === 0 || kick === 2;
  if (corner && rand() < POST_CHANCE) return 'post';
  if (dive === null) return 'goal';
  if (dive === kick) return opts.tiny && rand() < 0.5 ? 'goal' : 'save';
  if (!opts.tiny && row(dive) === row(kick) && Math.abs(col(dive) - col(kick)) === 1 && rand() < 0.15) return 'save';
  if (!opts.tiny && corner && col(dive) === col(kick) && rand() < CORNER_REACH) return 'save';
  return 'goal';
}

// The wind pushes the ball one zone sideways (it never leaves the goal).
export function windPush(z: Zone, rand: () => number = Math.random): Zone {
  const c = col(z), dir = c === 0 ? 1 : c === 2 ? -1 : rand() < 0.5 ? -1 : 1;
  return (z + dir) as Zone;
}

// The computer's pick: sharper players aim for the corners more.
export function cpuKick(level: 'easy' | 'medium' | 'hard', rand: () => number = Math.random): Zone {
  const corner = { easy: 0.15, medium: 0.35, hard: 0.55 }[level];
  if (rand() < corner) return rand() < 0.5 ? 0 : 2;
  const rest: Zone[] = [1, 3, 4, 5];
  return rest[Math.floor(rand() * rest.length)];
}

// The share of kicks that end up saved or off the post, for checking balance.
export function saveRate(kick: Zone, level: GoalieLevel, n = 4000, rand: () => number = Math.random): number {
  let miss = 0;
  for (let i = 0; i < n; i++) if (kickOutcome(kick, goalieDive(kick, level, rand), { rand }) !== 'goal') miss++;
  return miss / n;
}
