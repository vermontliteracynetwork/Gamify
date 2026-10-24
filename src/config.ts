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
  themeBuilder: boolean;
  xp: boolean;
  liveMonitorAndLock: boolean;
  reportHistoryDays: number;
}

const UNLIMITED = Number.POSITIVE_INFINITY;

export const TIERS: Record<Tier, TierLimits> = {
  free: {
    classrooms: 1, studentsPerClassroom: 30, savedQuestionSets: 3, assignedSetsPerStudent: 1,
    allGames: false, themesPlayable: false, themeBuilder: false, xp: false, liveMonitorAndLock: false,
    reportHistoryDays: 30,
  },
  plus: {
    classrooms: 3, studentsPerClassroom: 40, savedQuestionSets: UNLIMITED, assignedSetsPerStudent: 5,
    allGames: true, themesPlayable: true, themeBuilder: false, xp: true, liveMonitorAndLock: true,
    reportHistoryDays: UNLIMITED,
  },
  pro: {
    classrooms: UNLIMITED, studentsPerClassroom: 60, savedQuestionSets: UNLIMITED, assignedSetsPerStudent: UNLIMITED,
    allGames: true, themesPlayable: true, themeBuilder: true, xp: true, liveMonitorAndLock: true,
    reportHistoryDays: UNLIMITED,
  },
};

// Placeholders: nothing charges until Stage 7 is approved.
export const PRICES_USD_PER_YEAR: Record<Exclude<Tier, 'free'>, number> = { plus: 60, pro: 108 };

// Games playable on the Free plan (game ids from the registry).
export const FREE_GAMES = ['team-board', 'match-up', 'peg-drop', 'four-in-a-row'];

export function canPlayGame(tier: Tier, gameId: string): boolean {
  return TIERS[tier].allGames || FREE_GAMES.includes(gameId);
}
