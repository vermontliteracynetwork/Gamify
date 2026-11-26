import { PRICES_USD_PER_YEAR, type Tier } from '../config';

// The beta test rules in one place (owner decisions, 2026-11-24). The public
// /beta page, the tester checklist, the forms and the owner's Beta test page
// all read from here. Change a rule here, never inline in a screen.
export const BETA = {
  // Enrollment closes after this many approved testers.
  spots: 10,
  // The mix to aim for inside those spots.
  mix: ['Classroom teachers from K to 12 (an even spread of grades)', 'A homeschool co-op (free)', 'Homeschool families', 'Teachers from Facebook teacher groups (strangers, on purpose)'],
  // Every approved tester: this plan, free, for this long. Pro means
  // unlimited themes during the beta.
  tier: 'pro' as Tier,
  months: 3,
  // After the free months: this plan, yearly only, at this discount, for this long.
  offer: { tier: 'plus' as Exclude<Tier, 'free'>, discount: 0.2, years: 1 },
  // Owner 2026-11-26: "play one game a week, create a theme for a minimum of 5
  // games and create 5 question sets". One game a week over the 3 free months.
  hostGames: 13,
  gamesPerWeek: 1,
  themeGames: 5,
  questionSets: 5,
  teacherFormMinutes: '1 to 3',
  studentFormMinutes: '3 to 5',
} as const;

export const offerPrice = () => Math.round(PRICES_USD_PER_YEAR[BETA.offer.tier] * (1 - BETA.offer.discount) * 100) / 100;
export const fullPrice = () => PRICES_USD_PER_YEAR[BETA.offer.tier];
export const dollars = (n: number) => `$${n % 1 ? n.toFixed(2) : n}`;

// What every tester must do (owner, 2026-11-24).
export const REQUIREMENTS = [
  'Play at least one game a week with their class',
  'Build at least 5 question sets of their own',
  'Play every listed game at least once (not every version or setting)',
  'Design a theme for at least 5 different games in the Theme Builder (digital or physical design) and give Theme Builder feedback',
  'Send the short after-game form (1 to 3 minutes, taps and short answers) after each game',
  'Have students rate each game with three faces, with an optional comment',
  'Teach the Tell Gamify and rating lesson from the classroom kit',
  'Report anything that breaks or is blocked by the school network or IT, as it happens',
];

// What the beta is for (owner, 2026-11-24).
export const GOALS = [
  'Play test the games, gameplay, design, function and the Theme Builder',
  'Gather many themes, including ones for older and high school students',
  'Find where games break and where school admin or IT blocks Gamify',
  'Learn whether students like it. No test-score claims: Gamify is a good reinforcement tool',
];

// Student comment guidance taught in the lesson (owner, 2026-11-24).
export const STUDENT_COMMENT_GUIDE = [
  'Grades K-2: use speech to text, or type one sentence',
  'Grades 3 and up: a few sentences or a short paragraph if they have more to say',
  'Never type a name',
];

export const MEDIA_RULES = [
  'Quotes: asked for, with written permission',
  'Photos and videos: recommended, not required; no faces (hands on a screen, students\' backs at the whiteboard); a signed release for every one',
];
