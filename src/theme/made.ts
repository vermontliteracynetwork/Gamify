import { useCallback, useEffect, useState } from 'react';
import { data } from '../data';
import type { GameTheme } from './types';

// Themes made in the Theme Builder: the teacher's own ('custom') and the
// owner's library themes ('library'). Kept on this device until cloud
// accounts (Stage 5).
const KEY = 'made-themes';

export async function loadMadeThemes(): Promise<GameTheme[]> {
  return (await data.getSetting<GameTheme[]>(KEY)) ?? [];
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
