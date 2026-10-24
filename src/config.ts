// One place for plan limits, prices and product settings (docs/product-plan.md
// section 5). Change numbers here, never inline in screens.

export const APP_NAME = 'Gamify';
// Placeholder until the domain is bought (development plan, defaults table).
export const APP_DOMAIN = 'joingamify.com';

export type Tier = 'free' | 'plus' | 'pro';

export interface TierLimits {
  classrooms: number;
  studentsPerClassroom: number;
  savedQuestionSets: number;
  assignedSetsPerStudent: number;
  allGames: boolean;
  themesPlayable: boolean;
  // Free: try the builder on one game the developer picks. Plus: one
  // design per game. Pro: unlimited designs (teacher, 2026-10-24).
  themeBuilder: 'trial' | 'one-per-game' | 'unlimited';
  liveMonitorAndLock: boolean;
  reportHistoryDays: number;
}

const UNLIMITED = Number.POSITIVE_INFINITY;

export const TIERS: Record<Tier, TierLimits> = {
  free: {
    classrooms: 1, studentsPerClassroom: 30, savedQuestionSets: 3, assignedSetsPerStudent: 1,
    allGames: false, themesPlayable: false, themeBuilder: 'trial', liveMonitorAndLock: false,
    reportHistoryDays: 30,
  },
  plus: {
    classrooms: 3, studentsPerClassroom: 60, savedQuestionSets: UNLIMITED, assignedSetsPerStudent: 5,
    allGames: true, themesPlayable: true, themeBuilder: 'one-per-game', liveMonitorAndLock: true,
    reportHistoryDays: UNLIMITED,
  },
  pro: {
    classrooms: UNLIMITED, studentsPerClassroom: UNLIMITED, savedQuestionSets: UNLIMITED, assignedSetsPerStudent: UNLIMITED,
    allGames: true, themesPlayable: true, themeBuilder: 'unlimited', liveMonitorAndLock: true,
    reportHistoryDays: UNLIMITED,
  },
};

// Placeholders: nothing charges until Stage 7 is approved.
export const PRICES_USD_PER_YEAR: Record<Exclude<Tier, 'free'>, number> = { plus: 96, pro: 180 };

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
export const FREE_GAMES = ['game-show', 'peg-drop', 'cast-catch', 'bakery-match', 'four-in-a-row', 'star-quiz', 'flashcards'];

// The one game Free teachers can try the Theme Builder on. Developer's
// choice; Game Show predicted (the flagship group game).
export const THEME_TRIAL_GAME = 'game-show';

export function canPlayGame(tier: Tier, gameId: string): boolean {
  return TIERS[tier].allGames || FREE_GAMES.includes(gameId);
}
