import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, CaretLeft, CaretRight, HandPointing, Palette, Pause, Play, Television, UsersThree, type Icon } from '@phosphor-icons/react';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { buttonClasses } from '../ui/kit';
import { useReducedMotion } from '../ui/useReducedMotion';
import Title from '../ui/Title';

// Made by your class (owner, 2026-11-27: "apply psychology to get people to
// upgrade and not state why people upgrade. this should be something visual
// maybe a gallary carosel where we can show people/students making themes
// and getting engagement from their students by participating in the game").
// Show, don't tell: the story of a class theme in four pictures (draw it,
// snap it in, play it, pick the next one). The psychology is the IKEA effect
// (people value what they helped make, Norton, Mochon and Ariely 2012) and
// student choice (autonomy raises engagement, Patall, Cooper and Robinson
// 2008). No plan names on it (owner, 2026-11-27: "remove plus and pro tag
// and put this on the features page, not pricing").
//
// Photos: real beta classrooms only, each with its signed release on file
// (docs/photo-brief.md). A slide with no photo yet shows its drawn stand-in.
// release: 'faces' needs a signed photo release for every child shown;
// 'hands' and 'work' show only hands, the back of a head or the work itself.
export type GallerySlide = { id: string; icon: Icon; bg: string; photo?: { src: string; alt: string; release: 'faces' | 'hands' | 'work' } };
export const GALLERY: GallerySlide[] = [
  { id: 'draw', icon: Palette, bg: 'var(--color-pink)' },
  { id: 'snap', icon: HandPointing, bg: 'var(--color-sky)' },
  { id: 'play', icon: Television, bg: 'var(--color-lemon)' },
  { id: 'vote', icon: UsersThree, bg: 'var(--color-teal)' },
];
const INK = '#1d1a33';
const SWATCH = ['var(--color-pink)', 'var(--color-lemon)', 'var(--color-sky)', 'var(--color-kelly)', 'var(--color-orange)', 'var(--color-grape)'];

export default function ThemeGallery() {
  const reduce = useReducedMotion();
  const [at, setAt] = useState(0);
  const [dir, setDir] = useState(1);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const startX = useRef<number | null>(null);
  const n = GALLERY.length;
  const go = (to: number, d = to > at ? 1 : -1) => { setDir(d); setAt(((to % n) + n) % n); };
  // Turns on its own every 5 seconds; stops for reduced motion, a pause, hover or focus.
  useEffect(() => {
    if (reduce || paused || hover) return;
    const id = window.setTimeout(() => go(at + 1, 1), 5000);
    return () => window.clearTimeout(id);
  });
  const s = GALLERY[at];
  const I = s.icon;
  const key = (k: string) => t(`gallery.${s.id}.${k}` as StringKey);

  return (
    <section aria-labelledby="gallery-title" aria-roledescription="carousel" className="grid gap-4"
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setHover(true)} onBlur={() => setHover(false)}>
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1 flex-1 min-w-60">
          <h2 id="gallery-title" className="title-bubble text-[2rem] sm:text-[2.75rem] leading-none"><Title text={t('gallery.title')} /></h2>
        </div>
        <Link to="/themes" className={buttonClasses('secondary', 'hover-pop')}>{t('pricing.themesLink')}<ArrowRight weight="bold" size={18} aria-hidden="true" /></Link>
      </div>

      <div className="relative rounded-[1.75rem] border-[3.5px] border-border overflow-hidden bg-paper touch-pan-y" style={{ boxShadow: `0 8px 0 ${INK}` }}
        onPointerDown={(e) => { startX.current = e.clientX; }}
        onPointerUp={(e) => { if (startX.current === null) return; const dx = e.clientX - startX.current; startX.current = null; if (Math.abs(dx) > 50) go(at + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); }}>
        <div className="relative aspect-[4/5] sm:aspect-[16/8] lg:aspect-[16/7]">
          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            <motion.div key={s.id} role="group" aria-roledescription="slide" aria-label={t('gallery.slideOf', { n: at + 1, total: n })}
              custom={dir} className="absolute inset-0 grid sm:grid-cols-[1.25fr_1fr]"
              initial={reduce ? { opacity: 0 } : { x: `${dir * 100}%` }} animate={{ x: 0, opacity: 1 }} exit={reduce ? { opacity: 0 } : { x: `${-dir * 100}%` }}
              transition={reduce ? { duration: 0.2 } : { type: 'spring', stiffness: 220, damping: 28 }}>
              {/* The picture: a released beta photo, or the drawn stand-in. */}
              <div className="relative overflow-hidden border-b-[3px] sm:border-b-0 sm:border-r-[3px] border-border min-h-0" style={{ background: s.bg }}>
                {s.photo ? <img src={s.photo.src} alt={s.photo.alt} className="absolute inset-0 w-full h-full object-cover" /> : <StandIn slide={s} reduce={reduce} />}
              </div>
              <div className="grid content-center gap-3 p-5 sm:p-8">
                <span className="w-14 h-14 rounded-full grid place-items-center border-std border-border" style={{ background: s.bg, boxShadow: `0 3px 0 ${INK}` }} aria-hidden="true"><I weight="fill" size={28} color={INK} /></span>
                <h3 className="font-display text-[1.9rem] sm:text-[2.4rem] leading-[1.02] uppercase m-0">{key('title')}</h3>
                <p className="text-lg font-semibold leading-snug m-0">{key('text')}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button type="button" onClick={() => go(at - 1, -1)} aria-label={t('gallery.prev')} className="tap w-12 h-12 rounded-full bg-paper border-std border-border grid place-items-center hover-pop" style={{ boxShadow: `0 3px 0 ${INK}` }}><CaretLeft weight="bold" size={22} /></button>
        <div className="flex items-center gap-2 px-2" role="group" aria-label={t('gallery.pick')}>
          {GALLERY.map((g, i) => (
            <button key={g.id} type="button" aria-current={i === at ? 'true' : undefined} aria-label={t('gallery.goTo', { n: i + 1 })} onClick={() => go(i)}
              className="tap h-11 grid place-items-center"><span className="block h-4 rounded-full border-std border-border transition-all" style={{ width: i === at ? '2.75rem' : '1rem', background: i === at ? g.bg : 'var(--color-paper)' }} /></button>
          ))}
        </div>
        <button type="button" onClick={() => go(at + 1, 1)} aria-label={t('gallery.next')} className="tap w-12 h-12 rounded-full bg-paper border-std border-border grid place-items-center hover-pop" style={{ boxShadow: `0 3px 0 ${INK}` }}><CaretRight weight="bold" size={22} /></button>
        {!reduce && <button type="button" onClick={() => setPaused(!paused)} aria-label={paused ? t('gallery.play') : t('gallery.pause')} aria-pressed={paused} className="tap w-12 h-12 rounded-full bg-paper border-std border-border grid place-items-center ml-2">{paused ? <Play weight="fill" size={18} /> : <Pause weight="fill" size={18} />}</button>}
      </div>
    </section>
  );
}

// The drawn stand-in for a slide still waiting on its released photo: a
// paper sheet on the slide's color, crayon swatches, the big icon and a few
// bouncing scribbles, so the carousel never shows a gray box.
function StandIn({ slide, reduce }: { slide: GallerySlide; reduce: boolean }) {
  const I = slide.icon;
  return (
    <div className="absolute inset-0 grid place-items-center p-6" aria-hidden="true">
      <motion.div className="relative w-[78%] max-w-[26rem] aspect-[4/3] bg-paper rounded-[1.25rem] border-[3px] border-border grid place-items-center"
        style={{ boxShadow: `0 6px 0 ${INK}`, rotate: -3 }} initial={reduce ? false : { scale: 0.9, rotate: -8 }} animate={{ scale: 1, rotate: -3 }} transition={{ type: 'spring', stiffness: 200, damping: 14 }}>
        <I weight="duotone" size="46%" color={INK} />
        <span className="absolute left-4 right-4 bottom-4 flex justify-center gap-2">
          {SWATCH.map((c, i) => (
            <motion.span key={c} className="block w-[11%] max-w-9 aspect-square rounded-full border-std border-border" style={{ background: c }}
              initial={reduce ? false : { y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 + i * 0.06, type: 'spring', stiffness: 380, damping: 16 }} />
          ))}
        </span>
        <svg viewBox="0 0 100 40" className="absolute -top-6 -right-5 w-28" fill="none"><path d="M4 30 q10 -24 22 -4 t22 -4 t22 -4 t22 -4" stroke={INK} strokeWidth="4" strokeLinecap="round" /></svg>
      </motion.div>
    </div>
  );
}
