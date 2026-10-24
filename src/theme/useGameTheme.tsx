import { useEffect, useState, type ReactNode } from 'react';
import { TIERS } from '../config';
import { data } from '../data';
import { useTier } from '../data/hooks';
import { useSettings } from '../settings/SettingsContext';
import { backdropStyle, themesFor } from './library';
import { useMadeThemes } from './made';
import { TeamArt } from '../engine/TeamBadge';
import type { GameTheme } from './types';
import { calmVersion } from './validate';

// The theme a game is wearing, remembered per game. A teacher's own designs
// always play; library themes need a paid plan, and Free only previews them
// (plans table, Part 2A).
export function useGameTheme(gameId: string) {
  const tier = useTier();
  const { themes: made } = useMadeThemes();
  const themes = themesFor(gameId, made);
  const [id, setId] = useState(themes[0].id);
  useEffect(() => { data.getSetting<string>(`theme:${gameId}`).then((v) => { if (v) setId(v); }); }, [gameId]);
  const playable = (th: GameTheme) => th.source !== 'library' || TIERS[tier].themesPlayable;
  const chosen = themes.find((th) => th.id === id && playable(th)) ?? themes[0];
  const { settings } = useSettings();
  const theme = settings.calm ? calmVersion(chosen) : chosen;
  function choose(next: string) { setId(next); void data.setSetting(`theme:${gameId}`, next); }
  return { theme, themes, playable, choose };
}

// Full-width page wearing the game's theme backdrop.
export function ThemedPage({ theme, children }: { theme: GameTheme; children: ReactNode }) {
  const { settings } = useSettings();
  return (
    <div className="min-h-[calc(100dvh-4rem)]" style={{
      ...backdropStyle(theme, settings.backgrounds === 'plain'),
      ['--stage-bg-text' as string]: theme.colors.backgroundText,
      ['--color-accent' as string]: theme.colors.accent,
      ['--color-accent-ink' as string]: theme.colors.accentText,
    }}>
      <TeamArt.Provider value={Array.from({ length: 10 }, (_, k) => theme.pieces[`team-${k + 1}`]?.image)}>{children}</TeamArt.Provider>
    </div>
  );
}
