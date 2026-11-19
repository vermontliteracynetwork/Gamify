import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Play } from '@phosphor-icons/react';
import { t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';
import { GameCover } from './covers';
import { ModeBadge } from './ModeBadge';
import type { GameManifest } from './types';
import Title from '../ui/Title';

export interface HowStep { icon: ReactNode; text: string }

// The cover welcome screen every game opens on: the cover picture, the
// game's name, how it's played (mode), three picture steps, and one big
// button into the setup pages.
// `cover` is no longer shown (kept so callers need no change).
export default function GameWelcome({ game, steps, onStart }: { game: GameManifest; steps: HowStep[]; cover?: string; onStart: () => void }) {
  const { settings } = useSettings();
  // Centered top to bottom in the space under the menu bar; the corner
  // buttons move down with it so they stay level with the title.
  const box = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const el = box.current, main = el?.parentElement;
    if (!el || !main) return;
    const fit = () => {
      const pad = 24;
      const room = window.innerHeight - main.getBoundingClientRect().top - pad * 2;
      const off = Math.max(0, Math.floor((room - el.offsetHeight) / 2));
      main.style.setProperty('--menu-offset', `${off}px`);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    window.addEventListener('resize', fit);
    return () => { ro.disconnect(); window.removeEventListener('resize', fit); main.style.removeProperty('--menu-offset'); };
  }, []);
  return (
    // Fills the whole stage (teacher, 2026-11-06), and the cover is always
    // shown whole at its own shape, never cropped.
    // The cover on the left; on the right the title (top even with the
    // cover's top and the corner buttons), the ways to play and steps, and a
    // big start button whose bottom lines up with the cover's bottom
    // (teacher, 2026-11-06).
    // A clean two-column start screen (teacher, 2026-11-06: "space this out
    // better... professional"): the cover fills the left; the right column
    // has the title (top even with the cover and the corner buttons), a short
    // description and the ways to play, a framed "How to play" list, and a
    // big start button whose bottom lines up with the cover's bottom.
    <motion.section ref={box} style={{ marginTop: 'var(--menu-offset, 0px)' }} initial={settings.motion === 'still' ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="menu-panel w-full max-w-[112rem] mx-auto px-2 sm:px-6 grid gap-x-12 gap-y-6 items-stretch content-start wide:grid-cols-[minmax(0,calc((100dvh-6.5rem)*1.613))_minmax(28rem,1fr)]">
      {/* One standard start screen for every game (teacher, 2026-10-31): the
          Gamify cover, never a theme's, so menus need no custom design. */}
      <h1 className="wide:hidden title-bubble text-3xl sm:text-4xl pr-40 min-h-11 flex items-center" style={{ color: 'var(--text)' }}><Title text={game.name} /></h1>
      <div className="min-w-0 self-start">
        <GameCover gameId={game.id} className="w-full aspect-[100/62] max-h-[38vh] wide:max-h-[calc(100dvh-6.5rem)] mx-auto rounded-panel border-bold border-border motion-safe:hover:scale-[1.01] motion-safe:transition-transform" />
      </div>
      {/* Three even groups, title, How to play, start (teacher, 2026-11-16:
          "more professionally spaced"), sized up to fill the column. */}
      {/* The right column is exactly as tall as the cover on big screens
          (teacher, 2026-11-18: "the same size as the preview image"): it adds
          no height of its own, and its text scales with the screen. */}
      {/* Evenly spaced (teacher, 2026-11-19, asked many times): the title group,
          How to play and the start button sit one equal gap apart, and How to
          play grows to fill the rest, its steps spread evenly inside, so the
          column is full from the cover's top to its bottom with no empty bands. */}
      <div className="min-w-0 flex flex-col gap-6 wide:gap-[clamp(0.75rem,3vh,2rem)] wide:h-0 wide:min-h-full">
        <div className="grid gap-[clamp(0.4rem,1.6vh,1rem)]">
          <h1 className="hidden wide:flex title-bubble text-fit-title pr-44 min-h-11 items-center leading-none whitespace-nowrap" style={{ color: 'var(--text)' }}><Title text={game.name} /></h1>
          {game.description && <p className="text-fit-body font-semibold text-muted leading-snug max-w-prose">{game.description}</p>}
          <div className="flex flex-wrap gap-2">{game.modes.map((m) => <ModeBadge key={m} mode={m} />)}</div>
        </div>
        <section aria-label={t('welcome.how')} className="min-h-0 wide:flex-1 wide:flex wide:flex-col">
          {/* White with a little depth, on every game (teacher, 2026-11-16). */}
          <div className="rounded-panel border-std border-border-soft bg-white px-6 py-[clamp(0.6rem,2.4vh,1.5rem)] flex flex-col gap-[clamp(0.4rem,1.8vh,1rem)] wide:flex-1 wide:min-h-0" style={{ boxShadow: '0 3px 0 rgba(36,28,61,0.14), 0 12px 24px rgba(36,28,61,0.10)' }}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">{t('welcome.how')}</h2>
            <ol className="flex flex-col gap-[clamp(0.4rem,1.8vh,1rem)] wide:flex-1 wide:justify-evenly list-none p-0 m-0">
              {steps.map((s, i) => (
                <motion.li key={i} initial={settings.motion === 'still' ? false : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.08 }}
                  className="flex items-center gap-3.5 text-fit-body leading-snug">
                  <span className="w-[clamp(1.9rem,5.5vh,3rem)] h-[clamp(1.9rem,5.5vh,3rem)] shrink-0 rounded-full border-std [&>svg]:w-[45%] [&>svg]:h-[45%] border-border bg-accent flex items-center justify-center" aria-hidden="true">{s.icon}</span>
                  <span className="font-bold">{s.text}</span>
                </motion.li>
              ))}
            </ol>
          </div>
        </section>
        <button type="button" onClick={onStart}
          className="w-full min-h-[clamp(2.75rem,8vh,4rem)] shrink-0 px-8 rounded-pill border-bold border-border bg-accent font-display text-fit-button font-bold inline-flex items-center justify-center gap-2 active:scale-95 motion-safe:hover:scale-[1.02] motion-safe:transition-transform"
          style={{ boxShadow: '0 4px 0 #000' }}>
          <Play weight="fill" size={24} />{t('welcome.start')}
        </button>
      </div>
    </motion.section>
  );
}
