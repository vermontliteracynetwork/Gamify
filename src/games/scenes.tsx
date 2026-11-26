import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CaretLeft, CaretRight, Pause, Play } from '@phosphor-icons/react';
import { classicTheme } from '../theme/classic';
import { houseFor } from '../theme/house';
import { STARTER_THEMES } from '../theme/starters';
import ThemePreview from '../theme/builder/ThemePreview';
import GameShowPreview from '../theme/builder/previews/game-show';
import type { GameTheme } from '../theme/types';
import { useSettings } from '../settings/SettingsContext';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { GameCover, ThemeCover } from './covers';

// Real pictures of the games (owner, 2026-11-26, Features: "real pictures of
// the games should be added. make sure the image mockups of the games can be
// replicated and cycled through with the other themes people create").
// Every picture is drawn live from a theme definition (src/theme/types
// GameTheme), never a saved screenshot, so any theme re-renders it:
//   Classic          -> the approved Classic cover art (GameCover), the main design;
//   Game Show        -> the theme's own studio around the Classic cover's 3 x 2 board;
//   discs or a room  -> the theme's own cover scene (ThemeCover: its pieces or pets);
//   any other theme  -> the game's live preview from the Theme Builder
//                       (ThemePreview, bare: the game screen with no name lettering),
//                       which reads the theme's colors, backdrop and every piece,
//                       with Classic art in whatever the theme left empty.
// A theme made in the Theme Builder (saved on this device until cloud
// accounts) or added to Gamify's library joins the cycle on its own.

export type LookKind = 'classic' | 'gamify' | 'sample' | 'yours' | 'shared';
export interface ShowLook { theme: GameTheme; kind: LookKind }

// Every look a game can wear on a public picture: Classic first (owner rule,
// 2026-11-25: Classic first, the others only as the cover cycles), then the
// visitor's own and shared class themes, Gamify's library themes, and the
// labeled starter samples.
export function showcaseThemes(gameId: string, made: GameTheme[] = []): ShowLook[] {
  const out: ShowLook[] = [{ theme: classicTheme(gameId), kind: 'classic' }];
  for (const th of made.filter((x) => x.gameId === gameId)) {
    out.push({ theme: th, kind: th.source === 'custom' ? (th.gallery?.status === 'approved' ? 'shared' : 'yours') : 'gamify' });
  }
  for (const th of houseFor(gameId)) out.push({ theme: th, kind: 'gamify' });
  for (const s of STARTER_THEMES.filter((x) => x.gameId === gameId && x.id !== 'classic').sort((a, b) => a.order - b.order)) out.push({ theme: s.theme, kind: 'sample' });
  const seen = new Set<string>();
  return out.filter((l) => (seen.has(l.theme.id) ? false : (seen.add(l.theme.id), true)));
}

const isClassic = (th: GameTheme) => th.id === classicTheme(th.gameId).id;

// One game's picture wearing one theme, filling its box (4:3). Decorative:
// the caller names it.
export function GameScene({ theme, className = '' }: { theme: GameTheme; className?: string }) {
  const box = `relative overflow-hidden aspect-[4/3] ${className}`;
  if (isClassic(theme)) return <div className={box}><GameCover gameId={theme.gameId} className="w-full h-full" /></div>;
  // Game Show keeps the Classic cover's board (3 x 2, no meter) in every theme's studio, so the board never jumps as the picture cycles.
  if (theme.gameId === 'game-show') return <div className={`${box} [&>*]:!border-0 [&>*]:!rounded-none [&>*]:absolute [&>*]:inset-0`} aria-hidden="true"><GameShowPreview theme={theme} cover /></div>;
  if (theme.discs?.length || theme.itemImages?.length) return <div className={box}><ThemeCover theme={theme} className="w-full h-full" /></div>;
  return (
    <div className={`${box} [&>*]:!border-0 [&>*]:!rounded-none [&>*]:absolute [&>*]:inset-0`} aria-hidden="true">
      <ThemePreview theme={theme} gameName="" bare />
    </div>
  );
}

// Whether the pictures may turn on their own: never with the Motion setting
// on Still or when the device asks for reduced motion (WCAG 2.2.2 and the
// teacher's Motion setting); Gentle cross-fades, Full slides.
function useCycleMotion() {
  const { settings } = useSettings();
  const [deviceReduce, setDeviceReduce] = useState(() => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    if (typeof matchMedia === 'undefined') return;
    const q = matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setDeviceReduce(q.matches);
    q.addEventListener('change', on);
    return () => q.removeEventListener('change', on);
  }, []);
  const still = settings.motion === 'still';
  return { auto: !still && !deviceReduce, slide: settings.motion === 'full' && !deviceReduce, still };
}

// A game's picture that cycles through every theme it can wear, with prev,
// next and pause, a dot per theme and the theme's name. It turns on its own
// only while it is on screen and nobody is pointing at or focused inside it.
export function ThemeCycler({ gameId, gameName, looks, every = 3800, className = '' }: { gameId: string; gameName: string; looks: ShowLook[]; every?: number; className?: string }) {
  const { auto, slide, still } = useCycleMotion();
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [playing, setPlaying] = useState(auto);
  const [held, setHeld] = useState(false);
  const [seen, setSeen] = useState(true);
  const box = useRef<HTMLDivElement>(null);
  const n = looks.length;
  const at = Math.min(i, n - 1);
  useEffect(() => { setI(0); }, [gameId]);
  useEffect(() => { if (!auto) setPlaying(false); }, [auto]);
  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const go = useCallback((step: number) => { setDir(step); setI((k) => (Math.min(k, n - 1) + step + n) % n); }, [n]);
  useEffect(() => {
    if (!playing || held || !seen || n < 2) return;
    const id = window.setTimeout(() => go(1), every);
    return () => window.clearTimeout(id);
  }, [playing, held, seen, n, at, every, go]);
  const look = looks[at];
  const name = look.theme.name || t('features.look.untitled');
  // No teacher or student names on a public page (owner 2026-10-25: credit is the class, never a student).
  const credit = '';
  const round = 'shrink-0 w-11 h-11 rounded-full border-std border-border bg-white hover:bg-surface-hover shadow-[0_3px_0_var(--ink)] grid place-items-center active:scale-95 motion-safe:transition';
  return (
    <div ref={box} role="group" aria-roledescription="carousel" aria-label={t('features.cycle.label', { game: gameName })} className={`grid gap-3 ${className}`}
      onPointerEnter={() => setHeld(true)} onPointerLeave={() => setHeld(false)} onFocus={() => setHeld(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setHeld(false); }}>
      <div className="relative overflow-hidden rounded-[1.25rem] border-bold border-border bg-white" style={{ boxShadow: '0 5px 0 var(--ink)' }}>
        <div className="relative aspect-[4/3]" role="img" aria-label={t('features.cycle.picture', { game: gameName, theme: name })}>
          <AnimatePresence initial={false} custom={dir}>
            <motion.div key={`${gameId}:${look.theme.id}`} className="absolute inset-0" custom={dir}
              initial={still ? false : slide ? { opacity: 0, x: `${dir * 10}%`, scale: 0.98 } : { opacity: 0 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={still ? { opacity: 0, transition: { duration: 0 } } : slide ? { opacity: 0, x: `${dir * -10}%`, scale: 0.98 } : { opacity: 0 }}
              transition={{ duration: still ? 0 : slide ? 0.55 : 0.4, ease: [0.16, 1, 0.3, 1] }}>
              <GameScene theme={look.theme} className="w-full h-full" />
            </motion.div>
          </AnimatePresence>
        </div>
        {n > 1 && auto && (
          <button type="button" className={`${round} absolute top-2.5 right-2.5`} onClick={() => setPlaying(!playing)} aria-label={playing ? t('features.cycle.pause') : t('features.cycle.play')} data-tip={playing ? t('features.cycle.pause') : t('features.cycle.play')}>
            {playing ? <Pause weight="fill" size={18} aria-hidden="true" /> : <Play weight="fill" size={18} aria-hidden="true" />}
          </button>
        )}
      </div>
      <div className={`grid items-center gap-2 sm:gap-3 ${n > 1 ? 'grid-cols-[auto_1fr_auto]' : ''}`}>
        {n > 1 && <button type="button" className={round} onClick={() => go(-1)} aria-label={t('features.cycle.prev')} data-tip={t('features.cycle.prev')}><CaretLeft weight="bold" size={20} aria-hidden="true" /></button>}
        <div className="min-w-0 grid justify-items-center gap-1 text-center">
          <p className="min-w-0 max-w-full flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 leading-tight" aria-live={playing && !held ? 'off' : 'polite'}>
            <b className="font-heading text-lg">{name}</b>
            <span className="text-xs font-bold px-2 py-0.5 rounded-pill border-std border-border" style={{ background: KIND_BG[look.kind] }}>{t(`features.look.${look.kind}` as StringKey)}</span>
            {credit && <span className="text-xs font-semibold text-muted">{credit}</span>}
          </p>
          {n > 1 ? (
            <span className="flex flex-wrap justify-center gap-1.5" aria-hidden="true">
              {looks.map((l, k) => <span key={l.theme.id} className={`h-2.5 rounded-full border border-border motion-safe:transition-all ${k === at ? 'w-6 bg-ink' : 'w-2.5 bg-white'}`} />)}
            </span>
          ) : <span className="text-sm font-semibold text-muted">{t('features.cycle.only')}</span>}
          {n > 1 && <span className="sr-only">{t('features.cycle.count', { n: at + 1, total: n })}</span>}
        </div>
        {n > 1 && <button type="button" className={round} onClick={() => go(1)} aria-label={t('features.cycle.next')} data-tip={t('features.cycle.next')}><CaretRight weight="bold" size={20} aria-hidden="true" /></button>}
      </div>
    </div>
  );
}

const KIND_BG: Record<LookKind, string> = { classic: 'var(--color-butter)', gamify: 'var(--color-lavender)', sample: 'var(--color-blue-crystal)', yours: 'var(--color-mint)', shared: 'var(--color-blush)' };
