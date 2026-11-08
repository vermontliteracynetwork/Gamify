import { inkFor, useStageColor } from './stageColor';
import { useEffect, useState, type ReactNode } from 'react';
import { TIERS } from '../config';
import { data } from '../data';
import { useTier } from '../data/hooks';
import { useSettings } from '../settings/SettingsContext';
import { backdropStyle, themesFor } from './library';
import { useMadeThemes } from './made';
import { TeamArt } from '../engine/TeamBadge';
import { setSoundPack } from '../engine/feedback';
import { THEME_FONTS, type GameTheme } from './types';
import { calmVersion } from './validate';
import { useArcade, useSession } from '../student/session';
import { useSignedIn } from '../auth/session';

// The theme a game is wearing, remembered per game. A teacher's own designs
// always play; library and starter themes need a paid plan, and Free only
// previews them (plans table, Part 2A).
export function useGameTheme(gameId: string) {
  const tier = useTier();
  const { themes: made } = useMadeThemes();
  const all = themesFor(gameId, made);
  // A signed-in student sees Classic plus the themes their teacher offered
  // with the assigned sets, when the teacher picked some for this game.
  const { themeIds } = useArcade(useSession());
  const offered = all.filter((th, i) => i === 0 || themeIds.includes(th.id));
  const playable = (th: GameTheme) => th.source !== 'library' || TIERS[tier].themesPlayable;
  // Students never see a locked theme (no upgrade prompts on student pages);
  // a teacher sees them, locked, on Free.
  const { teacher } = useSignedIn();
  const listed = offered.length > 1 ? offered : all;
  const themes = teacher ? listed : listed.filter(playable);
  const [id, setId] = useState(themes[0].id);
  // Every game opens in Classic (teacher, 2026-11-08); a pick lasts for this visit.
  useEffect(() => { setId(themes[0].id); }, [gameId]); // eslint-disable-line react-hooks/exhaustive-deps
  const chosen = themes.find((th) => th.id === id && playable(th)) ?? themes[0];
  const { settings } = useSettings();
  const theme = settings.calm ? calmVersion(chosen) : chosen;
  function choose(next: string) { setId(next); void data.setSetting(`theme:${gameId}`, next); }
  return { theme, themes, playable, choose };
}

// Full-width page wearing the game's theme backdrop.
// `menu`: the start screens (welcome, theme, setup) wear the one standard
// Gamify look on every game, not the game's theme (teacher, 2026-10-31).
export function ThemedPage({ theme, children, menu = false }: { theme: GameTheme; children: ReactNode; menu?: boolean }) {
  const { settings } = useSettings();
  const stageColor = useStageColor(theme.gameId);
  useEffect(() => { setSoundPack(menu ? 'classic' : theme.sounds); return () => setSoundPack('classic'); }, [theme.sounds, menu]);
  if (menu) return <div className="game-stage brand-menu min-h-[calc(100dvh-4rem)]">{children}</div>;
  // The teacher's own background color for this game, if picked (2026-11-01).
  const stage = stageColor;
  return (
    <div className="game-stage min-h-[calc(100dvh-4rem)]" data-plain-g={theme.fonts.display !== 'Grow Year' ? '' : undefined} style={{
      ['--font-display' as string]: THEME_FONTS[theme.fonts.display] ?? THEME_FONTS['Grow Year'],
      // A theme that picks its own display font wears it on every heading.
      ...(theme.fonts.display !== 'Grow Year' && THEME_FONTS[theme.fonts.display] ? { ['--font-heading' as string]: THEME_FONTS[theme.fonts.display] } : {}),
      ...(stage ? { background: stage } : backdropStyle(theme, settings.backgrounds === 'plain')),
      ['--stage-bg-text' as string]: stage ? inkFor(stage) : theme.colors.backgroundText,
      ['--color-accent' as string]: theme.colors.accent,
      ['--color-accent-ink' as string]: theme.colors.accentText,
    }}>
      <TeamArt.Provider value={Array.from({ length: 10 }, (_, k) => theme.pieces[`team-${k + 1}`]?.image)}>{children}</TeamArt.Provider>
    </div>
  );
}
