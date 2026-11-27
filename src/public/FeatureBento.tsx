import { motion } from 'motion/react';
import { CheckCircle, ChartBar, Lightbulb, Prohibit, ShieldCheck, Timer, Trophy, UserCircle, UsersThree, Wheelchair, type Icon } from '@phosphor-icons/react';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import Title from '../ui/Title';
import { CrayonPowerUp, type PowerId } from '../brand/CrayonKit';
import { useReducedMotion } from '../ui/useReducedMotion';

// Every game comes loaded (owner, 2026-11-27: "change concept of fair play
// built in to combine with other great features and have something more
// visual (maybe show the universal game elements or power ups or place holder
// pictures where well have real photos) in a better format"). A bento of
// pictures: her Classic crayon power-ups bobbing, a photo slot for a released beta classroom photo (drawn stand-in
// until then, docs/photo-brief.md), the pieces every game shares, and the
// fair-play promises as icon badges with short titles (no paragraphs).
const INK = '#1d1a33';
// Her Classic crayon power-ups (owner, 2026-11-27: "show my power up icons for these, the classic crayon style should be applied everywhere").
const POWERS: PowerId[] = ['shield', 'magnet', 'mystery-box', 'lightning', 'double-points', 'extra-time', 'treasure-chest', 'spin-wheel'];
const PIECES: [Icon, StringKey, string][] = [
  [Lightbulb, 'features.loaded.piece.hint', 'var(--color-butter)'],
  [ChartBar, 'features.loaded.piece.meter', 'var(--color-mint)'],
  [Trophy, 'features.loaded.piece.board', 'var(--color-blush)'],
  [UserCircle, 'features.loaded.piece.results', 'var(--color-blue-crystal)'],
];
const FAIR: [Icon, string][] = [
  [ShieldCheck, 'var(--color-mint)'], [Timer, 'var(--color-butter)'], [CheckCircle, 'var(--color-lavender)'],
  [UsersThree, 'var(--color-blue-crystal)'], [Prohibit, 'var(--color-blush)'], [Wheelchair, 'var(--color-peach)'],
];
// When a released beta photo arrives, set it here (release tag per docs/photo-brief.md).
const PHOTO: { src: string; alt: string } | null = null;

const tile = 'rounded-[1.6rem] border-[3px] border-border overflow-hidden';
const lift = { boxShadow: `0 6px 0 ${INK}` };

export default function FeatureBento() {
  const reduce = useReducedMotion();
  return (
    <section id="fair" aria-labelledby="loaded-title" className="grid gap-6 scroll-mt-24">
      <h2 id="loaded-title" className="title-bubble text-4xl sm:text-5xl leading-tight"><Title text={t('features.loaded.title')} /></h2>
      <div className="grid gap-5 md:grid-cols-3 md:auto-rows-[minmax(15rem,auto)]">
        {/* Power-ups: the big Orange tile (owner, 2026-11-27: "maybe an orange box instead of the purple"), pictures bobbing at their own pace. */}
        <div className={`${tile} md:col-span-2 bg-orange text-text p-6 sm:p-8 grid gap-5 content-between`} style={lift}>
          <div className="grid gap-2 max-w-md">
            <h3 className="font-display text-3xl sm:text-4xl leading-none uppercase m-0">{t('features.loaded.powers')}</h3>
            <p className="text-lg font-semibold m-0">{t('features.loaded.powersText')}</p>
          </div>
          <ul className="list-none m-0 p-0 grid grid-cols-4 sm:grid-cols-8 gap-3 items-end" aria-hidden="true">
            {POWERS.map((p, i) => (
              <motion.li key={p} className="aspect-square rounded-[1rem] bg-paper border-std border-border grid place-items-center p-1" style={{ boxShadow: `0 4px 0 ${INK}`, rotate: (i % 2 ? 4 : -4) }}
                animate={reduce ? undefined : { y: [0, -8, 0] }} transition={{ duration: 2.2 + (i % 3) * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.18 }}>
                <CrayonPowerUp id={p} size={72} />
              </motion.li>
            ))}
          </ul>
        </div>

        {/* A classroom photo slot: the drawn stand-in until a released beta photo arrives. */}
        <figure className={`${tile} md:row-span-2 m-0 bg-sky relative min-h-72`} style={lift}>
          {PHOTO ? <img src={PHOTO.src} alt={PHOTO.alt} className="absolute inset-0 w-full h-full object-cover" /> : (
            <div className="absolute inset-0 grid place-items-center p-6" aria-hidden="true">
              <div className="w-[80%] aspect-[3/4] max-h-[85%] bg-paper border-[3px] border-border rounded-[1.25rem] grid place-items-center rotate-[3deg]" style={{ boxShadow: `0 6px 0 ${INK}` }}>
                <UsersThree weight="duotone" size="50%" color={INK} />
              </div>
            </div>
          )}
          <figcaption className="absolute left-4 right-4 bottom-4 bg-paper border-std border-border rounded-pill px-4 min-h-11 grid place-items-center font-bold text-center" style={{ boxShadow: `0 3px 0 ${INK}` }}>{t('features.loaded.photo')}</figcaption>
        </figure>

        {/* The pieces every game shares, as four chunky icons. */}
        <div className={`${tile} md:col-span-2 bg-paper p-6 sm:p-8 grid gap-5 content-start`} style={lift}>
          <h3 className="font-display text-3xl leading-none uppercase m-0">{t('features.loaded.pieces')}</h3>
          <ul className="list-none m-0 p-0 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {PIECES.map(([I, k, bg]) => (
              <li key={k} className="grid justify-items-center gap-2 text-center">
                <span className="w-16 h-16 rounded-[1.1rem] border-std border-border grid place-items-center" style={{ background: bg, boxShadow: `0 4px 0 ${INK}` }} aria-hidden="true"><I weight="bold" size={30} /></span>
                <b className="font-heading leading-tight">{t(k)}</b>
              </li>
            ))}
          </ul>
        </div>

        {/* Fair play: six promises, icon and title only. */}
        <div className={`${tile} md:col-span-3 bg-surface p-6 sm:p-8 grid gap-5`} style={lift}>
          <h3 className="font-display text-3xl leading-none uppercase m-0">{t('features.fair.title')}</h3>
          <ul className="list-none m-0 p-0 grid grid-cols-2 lg:grid-cols-3 gap-3">
            {FAIR.map(([I, bg], n) => (
              <li key={n} className="flex items-center gap-3 rounded-pill border-std border-border bg-paper pl-2 pr-4 min-h-14">
                <span className="w-10 h-10 rounded-full border-std border-border grid place-items-center shrink-0" style={{ background: bg }} aria-hidden="true"><I weight="bold" size={20} /></span>
                <b className="font-heading leading-tight text-sm sm:text-base">{t(`features.fair.${n + 1}` as StringKey)}</b>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
