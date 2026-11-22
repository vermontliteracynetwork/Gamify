import type { LabDef } from './types';

// Every Game Lab game is a folder in ./games with a meta.ts (name and family,
// loaded with the list) and a Game.tsx (the game, loaded when opened). A new
// folder shows up in /lab on its own.
export type LabFamily = 'Quiz boards' | 'Word games' | 'Arcade answers' | 'Team shows' | 'Classic arcade' | 'Quest and build';
export interface LabMeta { id: string; name: string; family: LabFamily; blurb: string; order?: number }

const metas = import.meta.glob<{ meta: LabMeta }>('./games/*/meta.ts', { eager: true });
const games = import.meta.glob<{ default: LabDef }>('./games/*/Game.tsx');

export const FAMILIES: LabFamily[] = ['Quiz boards', 'Word games', 'Arcade answers', 'Team shows', 'Classic arcade', 'Quest and build'];
export const LAB_GAMES: LabMeta[] = Object.values(metas).map((m) => m.meta).sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.name.localeCompare(b.name));

export function loadLabGame(id: string): Promise<LabDef> | null {
  const load = games[`./games/${id}/Game.tsx`];
  return load ? load().then((m) => m.default) : null;
}
