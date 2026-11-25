import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Play } from '@phosphor-icons/react';
import { t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';
import { GameCover } from './covers';
import { ModeBadge, shownModes } from './ModeBadge';
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
  const coverBox = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = box.current, main = el?.parentElement;
    if (!el || !main) return;
    const fit = () => {
      const pad = 24;
      const room = window.innerHeight - main.getBoundingClientRect().top - pad * 2;
      // iPad portrait and phones never scroll (Universal views 1, 2026-11-25):
      // the cover gives up height (keeping its shape) until the How to play
      // card and the start button fit under it.
      const cov = coverBox.current;
      if (cov && !window.matchMedia('(min-width: 1024px), (min-width: 768px) and (orientation: landscape)').matches) {
        const max = Math.max(90, Math.min(window.innerHeight * 0.38, cov.offsetHeight + room - el.offsetHeight));
        el.style.setProperty('--cover-max', `${Math.floor(max)}px`);
      } else el.style.removeProperty('--cover-max');
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
      {/* iPad portrait and phones (teacher, 2026-11-24): the title and description
          first, then the cover, then How to play, then a narrower, taller start pill. */}
      <div className="wide:hidden grid gap-2">
        <h1 className="title-bubble text-3xl sm:text-4xl pr-40 min-h-11 flex items-center" style={{ color: 'var(--text)' }}><Title text={game.name} /></h1>
        {game.description && <p className="text-fit-body font-semibold text-muted leading-snug max-w-prose">{game.tagline ?? game.description}</p>}
        <div className="flex flex-wrap gap-2">{shownModes(game.modes).map((m) => <ModeBadge key={m} mode={m} />)}</div>
      </div>
      <div ref={coverBox} className="min-w-0 self-start wide:self-center">
        <GameCover gameId={game.id} className="w-[min(100%,calc(var(--cover-max,38vh)*1.613))] wide:w-full aspect-[100/62] wide:max-h-[calc(100dvh-6.5rem)] mx-auto rounded-panel border-bold border-border motion-safe:hover:scale-[1.01] motion-safe:transition-transform" />
      </div>
      {/* Three even groups, title, How to play, start (teacher, 2026-11-16:
          "more professionally spaced"), sized up to fill the column. */}
      {/* The right column is exactly as tall as the cover on big screens
          (teacher, 2026-11-18: "the same size as the preview image"): it adds
          no height of its own, and its text scales with the screen. */}
      <div className="min-w-0 flex flex-col gap-6 wide:gap-[clamp(0.5rem,2.2vh,1.5rem)] wide:justify-between">
        {/* The round buttons have their own row at the top right; the title
            gets one whole line under them (teacher, 2026-11-24). */}
        <div className="hidden wide:grid min-w-0 gap-[clamp(0.4rem,1.6vh,1rem)] pt-[3rem]">
          <h1 className="hidden wide:flex title-bubble text-fit-title min-h-11 items-center leading-none whitespace-nowrap" style={{ color: 'var(--text)' }}><Title text={game.name} /></h1>
          {game.description && <p className="hidden wide:block text-fit-body font-semibold text-muted leading-snug max-w-prose">{game.tagline ?? game.description}</p>}
          <div className="hidden wide:flex flex-wrap gap-2">{shownModes(game.modes).map((m) => <ModeBadge key={m} mode={m} />)}</div>
        </div>
        <section aria-label={t('welcome.how')} className="min-h-0">
          {/* White with a little depth, on every game (teacher, 2026-11-16). */}
          {/* THE How to play card (Brand Kit welcome, 2026-11-24): white, an ink edge
              and press shade, a Grow Year heading (no small label above), each step
              with its own pastel badge. */}
          <div className="rounded-panel border-[3px] border-border bg-white px-6 py-[clamp(0.6rem,2.4vh,1.5rem)] grid gap-[clamp(0.4rem,1.8vh,1rem)]" style={{ boxShadow: '0 5px 0 var(--color-border)' }}>
            <h2 className="title-bubble text-fit-turn leading-none" style={{ color: 'var(--text)' }}><Title text={t('welcome.how')} /></h2>
            <ol className="grid gap-[clamp(0.4rem,1.8vh,1rem)] list-none p-0 m-0">
              {steps.map((s, i) => (
                <motion.li key={i} initial={settings.motion === 'still' ? false : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.08 }}
                  className="flex items-center gap-3.5 text-fit-body leading-snug">
                  <span className="w-[clamp(1.9rem,5.5vh,3rem)] h-[clamp(1.9rem,5.5vh,3rem)] shrink-0 rounded-full border-[3px] [&>svg]:w-[45%] [&>svg]:h-[45%] border-border flex items-center justify-center" style={{ background: ['var(--butter)', 'var(--blush)', 'var(--aqua)'][i % 3] }} aria-hidden="true">{s.icon}</span>
                  <span className="font-bold">{s.text}</span>
                </motion.li>
              ))}
            </ol>
          </div>
        </section>
        <button type="button" onClick={onStart}
          className="self-center wide:self-stretch wide:w-full min-h-[4.5rem] wide:min-h-[clamp(2.75rem,8vh,4rem)] shrink-0 px-12 wide:px-8 rounded-pill border-bold border-border bg-accent font-display text-fit-button font-bold inline-flex items-center justify-center gap-2 active:scale-95 motion-safe:hover:scale-[1.02] motion-safe:transition-transform"
          style={{ boxShadow: '0 5px 0 var(--color-border)' }}>
          <Play weight="fill" size={24} />{t('welcome.start')}
        </button>
      </div>
    </motion.section>
  );
}
