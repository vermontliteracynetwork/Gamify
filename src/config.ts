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
  xp: boolean;
  liveMonitorAndLock: boolean;
  reportHistoryDays: number;
}

const UNLIMITED = Number.POSITIVE_INFINITY;

export const TIERS: Record<Tier, TierLimits> = {
  free: {
    classrooms: 1, studentsPerClassroom: 30, savedQuestionSets: 3, assignedSetsPerStudent: 1,
    allGames: false, themesPlayable: false, themeBuilder: 'trial', xp: false, liveMonitorAndLock: false,
    reportHistoryDays: 30,
  },
  plus: {
    classrooms: 3, studentsPerClassroom: 60, savedQuestionSets: UNLIMITED, assignedSetsPerStudent: 5,
    allGames: true, themesPlayable: true, themeBuilder: 'one-per-game', xp: true, liveMonitorAndLock: true,
    reportHistoryDays: UNLIMITED,
  },
  pro: {
    classrooms: UNLIMITED, studentsPerClassroom: UNLIMITED, savedQuestionSets: UNLIMITED, assignedSetsPerStudent: UNLIMITED,
    allGames: true, themesPlayable: true, themeBuilder: 'unlimited', xp: true, liveMonitorAndLock: true,
    reportHistoryDays: UNLIMITED,
  },
};

// Placeholders: nothing charges until Stage 7 is approved.
export const PRICES_USD_PER_YEAR: Record<Exclude<Tier, 'free'>, number> = { plus: 96, pro: 180 };

// Games playable on the Free plan (game ids from the registry). Not capped
// at four: new free games are added over time (teacher, 2026-10-24).
export const FREE_GAMES = ['star-quiz', 'team-board', 'match-up', 'peg-drop', 'four-in-a-row'];

// The one game Free teachers can try the Theme Builder on. Developer's
// choice; Peg Drop predicted (its builder is the Dashboard's Plinko one).
export const THEME_TRIAL_GAME = 'peg-drop';

export function canPlayGame(tier: Tier, gameId: string): boolean {
  return TIERS[tier].allGames || FREE_GAMES.includes(gameId);
}
