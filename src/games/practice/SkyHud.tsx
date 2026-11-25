import { useEffect, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { motion } from 'motion/react';
import { Star, UsersThree } from '@phosphor-icons/react';
import Meter from '../../ui/Meter';
import Title from '../../ui/Title';
import { t } from '../../i18n';
import { pieceImage } from '../../theme/library';
import { classicTheme } from '../../theme/classic';
import type { GameTheme } from '../../theme/types';
import type { Hole } from './Sky';

// The paper cards, the feedback pill and the results box around Question
// Tracker's sky, as approved in the /brand game mockups (src/brand/
// GameMockups.tsx, 'star-quiz', 2026-11-24). The sky and stars stay her
// own reverted art (Sky.tsx); these only sit on top of it.

// One paper card: off-white, ink edge, the sticker shadow.
export const PAPER: CSSProperties = { background: 'var(--paper)', border: '3px solid var(--color-border)', borderRadius: '1.25rem', boxShadow: '0 4px 0 var(--color-border)' };
// Name chips take the pastel pairs in turn (never color alone: the name is on each).
const CHIP = ['var(--lavender)', 'var(--aqua)', 'var(--blush)', 'var(--butter)'];

// The game's own star (Classic: her bright five-point star, item 3).
export function skyStar(theme: GameTheme): string | undefined {
  return pieceImage(theme, 'item-3') ?? pieceImage(classicTheme(theme.gameId), 'item-3');
}

// The feedback line (zone C of the mockups): one flat pill in Grow Year,
// never tilted, no star (teacher, 2026-11-24).
export function SkyBurst({ text, gold = true, className = '', style }: { text: string; gold?: boolean; className?: string; style?: CSSProperties }) {
  return (
    <span className={`inline-flex items-center px-5 py-1.5 rounded-pill whitespace-nowrap title-bubble leading-none text-[clamp(1.4rem,3.2vw,2.25rem)] ${className}`}
      style={{ background: gold ? 'var(--lemon)' : 'var(--color-mint-soft)', border: '3px solid var(--color-border)', boxShadow: '0 4px 0 var(--color-border)', color: 'var(--ink)', ...style }}>
      <Title text={text} />
    </span>
  );
}

// The join code in a white pill, top left of the class screen.
export function SkyCode({ code }: { code: string }) {
  return (
    <span className="inline-flex items-center px-5 min-h-12 rounded-pill" style={{ ...PAPER, borderRadius: 999 }} aria-label={t('live.lateCode', { code })}>
      <b className="font-display text-[clamp(1.5rem,2.4vw,2rem)] tracking-widest leading-none tabular-nums">{code}</b>
    </span>
  );
}

// The class goal card: the star, "18 of 30" big, and THE meter.
export function SkyGoalCard({ theme, got, goal, label }: { theme: GameTheme; got: number; goal: number; label: string }) {
  const star = skyStar(theme);
  return (
    <div className="p-4 grid gap-2.5 text-center" style={PAPER}>
      <p className="sr-only">{label}</p>
      <span className="flex items-center justify-center gap-2" aria-hidden="true">
        {star ? <img src={star} alt="" className="w-10 h-10 object-contain" draggable={false} /> : <Star weight="fill" size={40} color="var(--lemon)" />}
        <motion.span key={got} initial={{ scale: 1.25 }} animate={{ scale: 1 }} className="font-display text-5xl leading-none tabular-nums">{got}<span className="text-2xl"> {t('sky.of', { goal })}</span></motion.span>
      </span>
      <Meter segments={1} done={0} part={goal ? Math.min(1, got / goal) : 0} width="100%" label={label} />
    </div>
  );
}

// Who is playing: a count and a chip for every name.
export function SkyPlaying({ names }: { names: string[] }) {
  return (
    <div className="p-3 grid gap-2 min-h-0" style={PAPER}>
      <b className="text-base flex items-center gap-1.5"><UsersThree weight="bold" size={20} aria-hidden="true" />{t('sky.playing', { count: names.length })}</b>
      <ul className="flex flex-wrap gap-1.5 list-none p-0 m-0 overflow-hidden" aria-label={t('sky.playingList')}>
        {names.map((n, i) => <li key={`${n}${i}`} className="px-2 py-0.5 rounded-pill text-sm font-bold max-w-full truncate" style={{ background: CHIP[i % CHIP.length], border: '2px solid var(--color-border)' }}>{n}</li>)}
      </ul>
    </div>
  );
}

// Where a box sits over the sky, in % of the sky (for the sky's hole and
// keep-out areas), following resizes.
export function useBoxPct(sky: RefObject<HTMLElement | null>, box: RefObject<HTMLElement | null>, pad = 8): Hole | null {
  const [pct, setPct] = useState<Hole | null>(null);
  useEffect(() => {
    const look = () => {
      const s = sky.current?.getBoundingClientRect(), b = box.current?.getBoundingClientRect();
      if (!s || !b || !s.width || !s.height || !b.width) { setPct((p) => (p ? null : p)); return; }
      const c = (v: number, size: number) => Math.round(Math.max(0, Math.min(100, (v / size) * 100)) * 10) / 10;
      const next = { l: c(b.left - pad - s.left, s.width), t: c(b.top - pad - s.top, s.height), r: c(b.right + pad - s.left, s.width), b: c(b.bottom + pad - s.top, s.height) };
      setPct((p) => (p && p.l === next.l && p.t === next.t && p.r === next.r && p.b === next.b ? p : next));
    };
    look();
    const ro = new ResizeObserver(look);
    if (sky.current) ro.observe(sky.current);
    if (box.current) ro.observe(box.current);
    window.addEventListener('resize', look);
    const id = window.setInterval(look, 1000);
    return () => { ro.disconnect(); window.removeEventListener('resize', look); window.clearInterval(id); };
  }, [sky, box, pad]);
  return pct;
}

// The results box over the class sky (the mockup's "We filled the sky!"):
// the standard Gamify look, the title, the star (or winners) in THE turn
// glow, the score under it, then the buttons.
export function SkyResults({ title, art, score, children, actions }: { title: string; art: ReactNode; score: string; children?: ReactNode; actions: ReactNode }) {
  return (
    <div className="results-box brand-menu fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35" role="dialog" aria-modal="true" aria-label={title}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-xl bg-surface border-heavy border-border rounded-panel grid gap-3 overflow-y-auto overflow-x-hidden px-5 pt-6 pb-5 justify-items-center text-center" style={{ boxShadow: '0 8px 0 var(--ink), 0 30px 60px rgba(36,28,61,0.35)', maxHeight: 'calc(100dvh - 2rem)' }}>
        <h2 className="title-bubble text-4xl text-balance" style={{ color: 'var(--text)' }}><Title text={title} /></h2>
        <div className="relative w-full h-[min(13rem,32dvh)] select-none overflow-hidden grid place-items-center" aria-hidden="true">
          <span className="turn-rays absolute left-1/2 top-1/2 w-[24rem] h-[24rem] -ml-[12rem] -mt-[12rem] rounded-full pointer-events-none" />
          <span className="turn-halo absolute left-1/2 top-1/2 w-[15rem] h-[15rem] -ml-[7.5rem] -mt-[7.5rem] rounded-full pointer-events-none" />
          <motion.span className="relative flex justify-center gap-4" animate={{ y: [0, -8, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>{art}</motion.span>
        </div>
        <p className="title-bubble text-3xl" style={{ color: 'var(--text)' }}><Title text={score} /></p>
        {children}
        <div className="flex flex-wrap justify-center gap-3 w-full">{actions}</div>
      </motion.div>
    </div>
  );
}
export const RESULT_BTN = 'min-h-14 px-5 rounded-input border-bold border-border font-display text-lg font-bold inline-flex items-center justify-center gap-1.5 no-underline text-text motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.03] motion-safe:transition-transform';
