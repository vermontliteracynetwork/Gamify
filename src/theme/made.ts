import { useCallback, useEffect, useState } from 'react';
import { data } from '../data';
import type { GameTheme } from './types';

// Themes made in the Theme Builder: the teacher's own ('custom') and the
// owner's library themes ('library'). Kept on this device until cloud
// accounts (Stage 5).
const KEY = 'made-themes';

export async function loadMadeThemes(): Promise<GameTheme[]> {
  return ((await data.getSetting<GameTheme[]>(KEY)) ?? []).map(upgradeTheme);
}

// Older designs carried forward. Bowling (teacher, 2026-11-01): each player's
// icon is now their ball, so team icons drawn on the older template become
// balls 1 to 10.
export function upgradeTheme(theme: GameTheme): GameTheme {
  if (theme.gameId !== 'bowling' || !Object.keys(theme.pieces).some((k) => k.startsWith('team-'))) return theme;
  const pieces = { ...theme.pieces };
  for (let k = 1; k <= 10; k++) {
    if (pieces[`team-${k}`] && !pieces[`ball-${k}`]) pieces[`ball-${k}`] = pieces[`team-${k}`];
    delete pieces[`team-${k}`];
  }
  return { ...theme, pieces };
}

export async function saveMadeTheme(theme: GameTheme): Promise<void> {
  const all = await loadMadeThemes();
  await data.setSetting(KEY, [...all.filter((th) => th.id !== theme.id), theme]);
}

export async function deleteMadeTheme(id: string): Promise<void> {
  await data.setSetting(KEY, (await loadMadeThemes()).filter((th) => th.id !== id));
}

export function useMadeThemes() {
  const [themes, setThemes] = useState<GameTheme[]>([]);
  const reload = useCallback(() => { void loadMadeThemes().then(setThemes); }, []);
  useEffect(reload, [reload]);
  return { themes, reload };
}

// Themes a teacher has hearted on the Themes page, offered first when they
// pick themes for students (teacher, 2026-10-25).
const FAVORITES = 'favorite-themes';
export function useFavoriteThemes() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => { void data.getSetting<string[]>(FAVORITES).then((v) => setIds(v ?? [])); }, []);
  const toggle = useCallback((id: string) => {
    setIds((cur) => {
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      void data.setSetting(FAVORITES, next);
      return next;
    });
  }, []);
  return { favorites: ids, toggle };
}
