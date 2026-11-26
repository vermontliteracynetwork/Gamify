// One place for plan limits, prices and product settings (docs/product-plan.md
// section 5). Change numbers here, never inline in screens.

export const APP_NAME = 'Gamify';
// Placeholder until the domain is bought (development plan, defaults table).
export const APP_DOMAIN = 'learngamify.com'; // owner, 2026-11-26

// The Theme Builder is for teachers only for now (owner, 2026-11-26): no design
// code for students. Students may get it in mid-2027 if teachers ask for it.
export const STUDENT_THEME_BUILDER = false;

// Homeschool is its own plan (teacher, 2026-10-26), shown on the Homeschool
// page, not on the main Pricing table.
export type Tier = 'free' | 'plus' | 'pro' | 'homeschool';

export interface TierLimits {
  // Grouping students into classes (Plus and Pro). Without it the teacher
  // has one student list, "My students" (teacher, 2026-10-26).
  hasClasses: boolean;
  classrooms: number;
  studentsPerClassroom: number;
  savedQuestionSets: number;
  assignedSetsPerStudent: number;
  allGames: boolean;
  themesPlayable: boolean;
  // Free: try the builder on one game the developer picks. Plus: one
  // design per game. Pro: unlimited designs (teacher, 2026-10-24).
  // Homeschool: three designs per game.
  themeBuilder: 'trial' | 'one-per-game' | 'three-per-game' | 'unlimited';
  liveMonitorAndLock: boolean;
  reportHistoryDays: number;
  // How far ahead a homework deadline can be set (homework links, coming).
  homeworkDaysAhead: number;
}

const UNLIMITED = Number.POSITIVE_INFINITY;

export const TIERS: Record<Tier, TierLimits> = {
  free: {
    hasClasses: false, classrooms: 1, studentsPerClassroom: 30, savedQuestionSets: 3, assignedSetsPerStudent: 1,
    // Free plays every theme already made (owner, 2026-11-24: "free plan should
    // have access to use all themes created, just can only create a theme for
    // game show").
    allGames: false, themesPlayable: true, themeBuilder: 'trial', liveMonitorAndLock: false,
    reportHistoryDays: 30, homeworkDaysAhead: 14,
  },
  plus: {
    hasClasses: true, classrooms: 3, studentsPerClassroom: 60, savedQuestionSets: UNLIMITED, assignedSetsPerStudent: 5,
    allGames: true, themesPlayable: true, themeBuilder: 'one-per-game', liveMonitorAndLock: true,
    reportHistoryDays: UNLIMITED, homeworkDaysAhead: UNLIMITED,
  },
  pro: {
    hasClasses: true, classrooms: UNLIMITED, studentsPerClassroom: UNLIMITED, savedQuestionSets: UNLIMITED, assignedSetsPerStudent: UNLIMITED,
    allGames: true, themesPlayable: true, themeBuilder: 'unlimited', liveMonitorAndLock: true,
    reportHistoryDays: UNLIMITED, homeworkDaysAhead: UNLIMITED,
  },
  // Homeschool (teacher, 2026-10-26): every game (no early access), 3 theme
  // designs per game, library themes, up to 10 students, 5 sets assigned at
  // a time, homework up to 14 days ahead, all-time reports. Live monitor
  // and Lock predicted on (guess, noted in the development plan).
  homeschool: {
    hasClasses: false, classrooms: 1, studentsPerClassroom: 10, savedQuestionSets: UNLIMITED, assignedSetsPerStudent: 5,
    allGames: true, themesPlayable: true, themeBuilder: 'three-per-game', liveMonitorAndLock: true,
    reportHistoryDays: UNLIMITED, homeworkDaysAhead: 14,
  },
};

// Placeholders: nothing charges until Stage 7 is approved.
// Standard prices (owner, 2026-11-24): Plus $8 and Pro $15 a month; 3 months
// 5% off, 6 months 15% off, 1 year 20% off, compared with monthly. Homeschool
// is priced like Plus (teacher, 2026-10-26).
export const PRICES_USD_PER_YEAR: Record<Exclude<Tier, 'free'>, number> = { plus: 76.8, pro: 144, homeschool: 76.8 };
// A yearly price as a monthly figure for display: "6.40" or "12".
export const perMonthUSD = (yearly: number) => { const m = Math.round((yearly / 12) * 100) / 100; return m % 1 ? m.toFixed(2) : String(m); };

// Billing intervals (owner, 2026-11-24): "allow also monthly subscriptions
// though discount at 3 month, 6 month, and 1 year. those are renewing at
// those intervals as well." Each plan renews at the interval chosen, at the
// standard price, until it is canceled. Prices approved by the owner
// 2026-11-24: monthly full price, 3 months 5%, 6 months 15%, 1 year 20% off.
export type Billing = 'month' | 'quarter' | 'half' | 'year';
export const BILLINGS: { id: Billing; months: number }[] = [
  { id: 'month', months: 1 }, { id: 'quarter', months: 3 }, { id: 'half', months: 6 }, { id: 'year', months: 12 },
];
export const PRICES_USD: Record<Exclude<Tier, 'free'>, Record<Billing, number>> = {
  plus: { month: 8, quarter: 22.8, half: 40.8, year: PRICES_USD_PER_YEAR.plus },
  pro: { month: 15, quarter: 42.75, half: 76.5, year: PRICES_USD_PER_YEAR.pro },
  homeschool: { month: 8, quarter: 22.8, half: 40.8, year: PRICES_USD_PER_YEAR.homeschool },
};
export const billingMonths = (b: Billing) => BILLINGS.find((x) => x.id === b)!.months;
// Percent saved against paying month to month for the same length of time.
export function billingSavings(tier: Exclude<Tier, 'free'>, b: Billing): number {
  const full = PRICES_USD[tier].month * billingMonths(b);
  return Math.round((1 - PRICES_USD[tier][b] / full) * 100);
}

// The launch sale (owner, 2026-11-24): for people who want a paid plan
// during the beta test but do not want to be beta testers. An extra 10% off
// the standard price of the FIRST term only (first month, 3, 6 or 12 months),
// any plan, for subscriptions started before Jan 1, 2027. It does not renew:
// the plan then renews at the standard price for the same length. Beta testers get their own offer instead (src/beta/spec.ts); the
// two never stack. Applied with a Stripe promotion code once Stripe is set up.
export const LAUNCH_OFFER = {
  name: 'Founding Subscriber',
  code: 'FOUNDING10',
  discount: 0.1,
  firstTermOnly: true,
  endsBefore: '2027-01-01',
  active: true,
} as const;

// School plans: per-teacher Pro seats with volume discounts; purchase
// orders yearly, prepaid, net 30, 5-seat minimum (teacher, 2026-10-24).
export const SCHOOL_MIN_SEATS = 5;
export const SCHOOL_SEAT_DISCOUNTS: { minSeats: number; discount: number }[] = [
  { minSeats: 25, discount: 0.3 },
  { minSeats: 10, discount: 0.2 },
  { minSeats: 5, discount: 0.1 },
];

export function schoolQuote(seats: number): { perSeat: number; total: number } | null {
  if (seats < SCHOOL_MIN_SEATS) return null;
  const { discount } = SCHOOL_SEAT_DISCOUNTS.find((d) => seats >= d.minSeats)!;
  const perSeat = Math.round(PRICES_USD_PER_YEAR.pro * (1 - discount));
  return { perSeat, total: perSeat * seats };
}

// Games playable on the Free plan (game ids from the registry). Not capped
// at four: new free games are added over time (teacher, 2026-10-24).
export const FREE_GAMES = ['game-show', 'pinball', 'cast-catch', 'match-three', 'four-in-a-row', 'star-quiz', 'flashcards'];

// The one game Free teachers can try the Theme Builder on. Developer's
// choice; Game Show predicted (the flagship group game).
export const THEME_TRIAL_GAME = 'game-show';

// The Theme Building Challenge takes entries only once this is on (launch,
// after the official rules are approved).
export const CHALLENGE_OPEN = false;

export function canPlayGame(tier: Tier, gameId: string): boolean {
  return TIERS[tier].allGames || FREE_GAMES.includes(gameId);
}

// The Puzzle Games Graphics Pack (Match Three gems, Bubble Pop balls): the
// teacher confirmed full commercial use (2026-10-31); files in public/classic/.
export const PUZZLE_PACK_CLEARED = true;

// The Ball Collection (Four in a Row pieces: gas tank, spike ball, 8 ball,
// beach ball, Earth, Mars, Moon, coin, baseball, basketball, soccer ball):
// from itch.io under a commercial license, confirmed by the teacher
// (2026-11-01). Files in public/classic/four-in-a-row/.
export const BALL_PACK_CLEARED = true;
// No Gas Tank (teacher, 2026-11-07).
export const BALL_PACK = ['spike-ball', '8-billiard-ball', 'beach-ball', 'earth-africa', 'mars', 'moon', 'coin', 'baseball-ball', 'basket-ball', 'white-soccer-ball'];
