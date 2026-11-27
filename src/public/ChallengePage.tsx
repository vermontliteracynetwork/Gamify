import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useReducedMotion } from '../ui/useReducedMotion';
import { ArrowRight, CalendarStar, Crown, PaintBrush, Scissors, Sparkle } from '@phosphor-icons/react';
import { SPECIAL_DAYS, closeDate } from '../theme/tags';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { buttonClasses } from '../ui/kit';
import Title from '../ui/Title';
import PublicFooter from './PublicFooter';
import ThemePreview from '../theme/builder/ThemePreview';
import { useMadeThemes } from '../theme/made';
import { GAMES } from '../games/registry';
import { challengeEntries, type SpecialDay } from '../theme/tags';
import { useEffect, useState } from 'react';

// The Theme Building Challenge (teacher, 2026-10-25): a launch campaign that
// fills the theme library. Since 2026-11-26 (owner): one special day each
// month with one winner, no runner-up, and an ongoing public vote; entries
// and votes close 48 hours before the day, and the winner is emailed and
// posted on the day. Official rules come before
// the first day (attorney review).
const day = (iso: string, opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' });

export default function ChallengePage() {
  const reduce = useReducedMotion();
  const card = 'bg-surface border-bold border-border rounded-panel p-6 grid gap-3 content-start';
  return (
    <>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 grid gap-8">
        <section className="grid gap-4 justify-items-start text-left">
          <h1 className="title-bubble text-4xl sm:text-6xl min-w-0"><Title text={t('challenge.title')} /></h1>
          <div className="flex flex-wrap gap-3">
            <Link to="/login?mode=signup" className={buttonClasses('primary', 'hover-pop', 'lg')}><PaintBrush weight="bold" size={20} />{t('challenge.start')}</Link>
            <Link to="/themes" className={buttonClasses('secondary', 'hover-pop', 'lg')}>{t('themes.seeAll')}</Link>
          </div>
        </section>

        <section aria-labelledby="prizes" className="grid gap-4">
          <h2 id="prizes" className="title-bubble text-4xl"><Title text={t('challenge.prizes')} /></h2>
          <motion.article initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            className={`${card} hover-lift !bg-butter max-w-2xl`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
            <h3 className="font-display text-3xl flex items-center gap-2"><Crown weight="fill" size={32} color="var(--lemon)" aria-hidden="true" /><Title text={t('challenge.winner')} /></h3>
            <ul className="grid gap-2 pl-6 m-0 list-disc text-lg font-semibold">{[1, 2, 3].map((n) => <li key={n}>{t(`challenge.winner.${n}` as StringKey)}</li>)}</ul>
          </motion.article>
        </section>

        <section aria-labelledby="days" className="grid gap-4">
          <h2 id="days" className="title-bubble text-4xl"><Title text={t('challenge.days')} /></h2>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0 m-0">
            {SPECIAL_DAYS.map((d, i) => (
              <li key={d.tag}>
                {/* Each month: a cover cycling that month's entries (no tag shown), and the
                    whole card opens the month's entries to vote (owner, 2026-11-27). */}
                <Link to={`/challenge/${d.tag}`} className="hover-lift block bg-surface border-bold border-border rounded-panel overflow-hidden no-underline text-text h-full" style={{ boxShadow: 'var(--shadow-sticker)' }}>
                  <MonthCover d={d} i={i} />
                  <span className="p-5 grid gap-2">
                    <span className="font-bold text-sm uppercase tracking-wide flex items-center gap-1.5"><CalendarStar weight="fill" size={18} aria-hidden="true" />{day(d.date, { month: 'long' })}</span>
                    <span className="font-display text-2xl leading-tight">{d.name}</span>
                    <span className="text-sm font-bold">{t('challenge.dayCloses', { date: day(closeDate(d)) })}</span>
                    <span className="mt-1 inline-flex items-center gap-1.5 font-bold text-grape-deep">{t('challenge.seeEntries')}<ArrowRight weight="bold" size={16} aria-hidden="true" /></span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="how" className="grid gap-4">
          <h2 id="how" className="title-bubble text-4xl"><Title text={t('challenge.how')} /></h2>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 list-none p-0 m-0">
            {[1, 2, 3, 4].map((n) => (
              <li key={n} className={`${card} hover-lift`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
                <span className="w-12 h-12 rounded-full bg-butter border-bold border-border flex items-center justify-center font-display text-2xl">{n}</span>
                <h3 className="font-display text-2xl">{t(`challenge.step.${n}` as StringKey)}</h3>
                <p className="font-semibold">{t(`challenge.step.${n}.text` as StringKey)}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="tracks" className="grid gap-4">
          <h2 id="tracks" className="title-bubble text-4xl"><Title text={t('challenge.tracks')} /></h2>
          <div className="grid md:grid-cols-2 gap-5">
            {([['hand', Scissors, '/challenge/permission', 'challenge.track.hand.slip'], ['studio', PaintBrush, '/teacher/themes', 'challenge.track.studio.go']] as const).map(([k, Icon, to, cta]) => (
              <article key={k} className={`${card} hover-lift`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
                <h3 className="font-display text-3xl flex items-center gap-2"><Icon weight="fill" size={32} aria-hidden="true" /><Title text={t(`challenge.track.${k}`)} /></h3>
                <ol className="grid gap-2 pl-6 m-0 list-decimal font-semibold">{[1, 2, 3, 4].map((n) => <li key={n}>{t(`challenge.track.${k}.${n}` as StringKey)}</li>)}</ol>
                <Link to={to} className={buttonClasses('main', 'justify-self-start min-h-12 px-5 hover-pop')}>{t(cta)}</Link>
              </article>
            ))}
          </div>
        </section>

        <section className={card} style={{ boxShadow: 'var(--shadow-sticker)' }}>
          <h2 className="font-display text-3xl"><Title text={t('challenge.fine')} /></h2>
          <ul className="grid gap-2 pl-6 m-0 list-disc font-semibold">{[1, 2, 3, 4].map((n) => <li key={n}>{t(`challenge.fine.${n}` as StringKey)}</li>)}</ul>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}

// A month's cover: its approved entries take turns (every 3.5 seconds, at a
// different moment per card); before any arrive, a bright stand-in in the
// month's color with sparkles.
const COVER = ['var(--color-sky)', 'var(--color-pink)', 'var(--color-lemon)', 'var(--color-kelly)', 'var(--color-orange)', 'var(--color-grape)', 'var(--color-teal)'];
function MonthCover({ d, i }: { d: SpecialDay; i: number }) {
  const reduce = useReducedMotion();
  const { themes } = useMadeThemes();
  const entries = challengeEntries(themes, d).filter((th) => th.gallery?.status === 'approved');
  const [at, setAt] = useState(0);
  useEffect(() => {
    if (reduce || entries.length < 2) return;
    const id = window.setInterval(() => setAt((x) => (x + 1) % entries.length), 3500 + i * 250);
    return () => window.clearInterval(id);
  }, [reduce, entries.length, i]);
  const th = entries[at % Math.max(1, entries.length)];
  return (
    <span className="relative block aspect-[16/9] border-b-[3px] border-border overflow-hidden" style={{ background: COVER[i % COVER.length] }} aria-hidden="true">
      {th ? (
        <motion.span key={th.id} className="absolute inset-0 grid place-items-center p-3" initial={reduce ? false : { opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          <ThemePreview bare theme={th} gameName={GAMES.find((g) => g.id === th.gameId)?.name ?? ''} />
        </motion.span>
      ) : (
        <span className="absolute inset-0 grid place-items-center">
          <span className="w-20 h-20 rounded-full bg-paper border-std border-border grid place-items-center" style={{ boxShadow: '0 4px 0 var(--ink)' }}><CalendarStar weight="fill" size={38} /></span>
          {[[14, 22], [80, 18], [70, 74], [22, 70]].map(([x, y], k) => <Sparkle key={k} weight="fill" size={22 + (k % 2) * 8} className="absolute text-paper" style={{ left: `${x}%`, top: `${y}%` }} />)}
        </span>
      )}
    </span>
  );
}
