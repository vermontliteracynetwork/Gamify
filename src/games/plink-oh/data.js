// Static game data for Plink-oh: sample question bank, team color palette,
// point pool for bucket generation, and power-up definitions.
//
// This module is intentionally self-contained (no imports from src/lib) so
// the whole src/games/plink-oh directory can be lifted into its own app
// later without untangling platform-specific dependencies.

export const TEAM_COLORS = [
  { id: 'pink', hex: '#EC6FB5' },
  { id: 'yellow', hex: '#F4C542' },
  { id: 'green', hex: '#5FBF7B' },
  { id: 'blue', hex: '#4D9FEC' },
  { id: 'purple', hex: '#9B6FE0' },
  { id: 'orange', hex: '#F0924A' },
];

export const MIN_TEAMS = 2;
export const MAX_TEAMS = 6;
export const MIN_ROUNDS = 1;
export const MAX_ROUNDS = 10;

// Point values a round's buckets are drawn from. Real Plink-oh appears to
// vary both the bucket count (3-7) and values round to round -- we mirror
// that by reshuffling a fresh subset every round instead of using one fixed
// board.
export const POINT_POOL = [10, 20, 30, 40, 50, 60, 70, 80];

export function generateBuckets({ count, powerUpsEnabled }) {
  const values = shuffle(POINT_POOL).slice(0, count);
  // A handful of buckets (never all of them) carry 1-3 power-up stars when
  // power-ups are on, matching "Buckets with 1-3 stars include power-ups."
  const starredCount = powerUpsEnabled ? Math.min(count - 1, 1 + Math.floor(Math.random() * 2)) : 0;
  const starredIndexes = new Set(shuffle([...Array(count).keys()]).slice(0, starredCount));
  return shuffle(values).map((value, i) => ({
    id: `bucket-${i}`,
    value,
    stars: starredIndexes.has(i) ? 1 + Math.floor(Math.random() * 3) : 0,
  }));
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Power-up landing biases are a documented guess -- the source page names
// three power-ups (Bowling Ball, Blue Turtle, Dynamite) and shows the pick
// UI, but never states what each one actually does to the drop. Until
// that's confirmed, each is implemented as a distinct, tunable bias on the
// peg-bounce random walk in PlinkoBoard.js. Swap `bias` freely once the
// real behavior is known.
export const POWER_UPS = [
  {
    id: 'bowling-ball',
    name: 'Bowling Ball',
    icon: '\u{1F3B3}',
    description: 'Heavy roll -- drops almost straight down from its zone with very little bounce.',
    bias: 'straight',
  },
  {
    id: 'blue-turtle',
    name: 'Blue Turtle',
    icon: '\u{1F422}',
    description: 'Shell steadies the roll -- bounces keep pulling back toward the center of the board.',
    bias: 'center',
  },
  {
    id: 'dynamite',
    name: 'Dynamite',
    icon: '\u{1F9E8}',
    description: 'Blasts a path outward -- bounces push toward the edges for a shot at the outer buckets.',
    bias: 'edge',
  },
];

// Demo literacy content so the module is playable out of the box. Real
// question sets are meant to be authored/imported per the platform spec
// (docs/gamification-platform-spec.md, section 3.1) -- this bank exists
// purely to prove the game loop end to end.
export const SAMPLE_QUESTIONS = [
  { id: 'q1', prompt: 'What is it?\n\nA spiny, round sea creature that puffs up when threatened.', answer: 'pufferfish' },
  { id: 'q2', prompt: 'What word means "a group of words that expresses a complete thought"?', answer: 'sentence' },
  { id: 'q3', prompt: 'What is the opposite of "ancient"?', answer: 'modern' },
  { id: 'q4', prompt: 'What punctuation mark ends a question?', answer: 'question mark' },
  { id: 'q5', prompt: 'What word means "to look at something very closely"?', answer: 'examine' },
  { id: 'q6', prompt: 'What do you call the main character in a story?', answer: 'protagonist' },
  { id: 'q7', prompt: 'What word means "happening every day"?', answer: 'daily' },
  { id: 'q8', prompt: 'What is a word that sounds the same as another but has a different meaning called?', answer: 'homophone' },
  { id: 'q9', prompt: 'What do you call the part of a story where the problem is solved?', answer: 'resolution' },
  { id: 'q10', prompt: 'What word means "very large"?', answer: 'enormous' },
  { id: 'q11', prompt: 'What do you call a word that describes a noun?', answer: 'adjective' },
  { id: 'q12', prompt: 'What word means "to make something clear"?', answer: 'explain' },
  { id: 'q13', prompt: 'What do you call the setting where and when a story takes place?', answer: 'setting' },
  { id: 'q14', prompt: 'What word means "not the same"?', answer: 'different' },
  { id: 'q15', prompt: 'What do you call three or more sentences about one topic?', answer: 'paragraph' },
];
