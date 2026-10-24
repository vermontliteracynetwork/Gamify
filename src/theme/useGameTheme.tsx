import { useEffect, useState, type ReactNode } from 'react';
import { LockSimple, X } from '@phosphor-icons/react';
import { TIERS } from '../config';
import { data } from '../data';
import { useTier } from '../data/hooks';
import { t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';
import { backdropStyle, themesFor } from './library';
import { useMadeThemes } from './made';
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
      {children}
    </div>
  );
}

function Swatch({ theme, big = false }: { theme: GameTheme; big?: boolean }) {
  const dots = Object.values(theme.pieces).map((p) => p.color).filter(Boolean).slice(0, big ? 8 : 4) as string[];
  const colors = dots.length ? dots : [theme.colors.accent, theme.colors.surface];
  return (
    <span className={`block rounded-input border-[2px] border-border ${big ? 'h-48' : 'h-16'} p-2`} style={backdropStyle(theme, false)} aria-hidden="true">
      <span className="flex flex-wrap gap-1.5">
        {colors.map((c, i) => <span key={i} className={`${big ? 'w-10 h-10' : 'w-5 h-5'} rounded-full border-[2px] border-border`} style={{ background: c }} />)}
      </span>
    </span>
  );
}

// Theme cards for a game's start screen. Locked themes show only a lock
// (no prices or buy words on student screens) and open a preview.
export function ThemePicker({ current, themes, playable, onChoose, onPanel = false }: {
  current: GameTheme; themes: GameTheme[]; playable: (th: GameTheme) => boolean; onChoose: (id: string) => void;
  // Inside a white setup page rather than on the game's stage.
  onPanel?: boolean;
}) {
  const [preview, setPreview] = useState<GameTheme | null>(null);
  return (
    <div className={onPanel ? 'grid gap-2 w-full' : 'grid gap-2 max-w-lg mx-auto w-full'}>
      <span className={onPanel ? 'font-bold' : 'font-bold stage-text'}>{t('theme.pick')}</span>
      <div role="radiogroup" aria-label={t('theme.pick')} className="grid grid-cols-3 gap-2">
        {themes.map((th) => {
          const open = playable(th);
          const on = current.id === th.id;
          return (
            <button key={th.id} type="button" role="radio" aria-checked={on}
              aria-label={open ? th.name : t('theme.locked', { name: th.name })}
              onClick={() => (open ? onChoose(th.id) : setPreview(th))}
              className={`rounded-input border-[2.5px] p-1.5 grid gap-1 text-left ${on ? 'border-border ring-4 ring-accent bg-surface' : 'border-border-soft bg-surface'}`}>
              <Swatch theme={th} />
              <span className="flex items-center gap-1 font-bold text-sm px-1">{!open && <LockSimple weight="fill" size={16} aria-hidden="true" />}{th.name}</span>
            </button>
          );
        })}
      </div>
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45" role="dialog" aria-modal="true" aria-label={t('theme.preview', { name: preview.name })}>
          <div className="bg-surface border-[2.5px] border-border rounded-panel p-4 grid gap-3 w-full max-w-md" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
            <div className="flex items-center justify-between">
              <span className="font-display text-2xl font-bold flex items-center gap-2"><LockSimple weight="fill" size={22} aria-hidden="true" />{preview.name}</span>
              <button type="button" onClick={() => setPreview(null)} aria-label={t('theme.close')} className="w-11 h-11 rounded-full border-[2px] border-border bg-surface-2 flex items-center justify-center"><X weight="bold" size={20} /></button>
            </div>
            <Swatch theme={preview} big />
          </div>
        </div>
      )}
    </div>
  );
}
