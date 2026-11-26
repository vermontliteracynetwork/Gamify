import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useReducedMotion } from '../ui/useReducedMotion';
import { CalendarStar, Crown, PaintBrush, PencilSimpleLine } from '@phosphor-icons/react';
import { SPECIAL_DAYS, winnerDate } from '../theme/tags';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { buttonClasses } from '../ui/kit';
import Title from '../ui/Title';
import PublicFooter from './PublicFooter';

// The Theme Building Challenge (teacher, 2026-10-25): a launch campaign that
// fills the theme library. Since 2026-11-26 (owner): one special day each
// month with one winner, no runner-up; entries close 11:59 pm on the day and
// the winner is emailed and posted 7 days later. Official rules come before
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
          <p className="text-xl font-bold max-w-3xl">{t('challenge.sub')}</p>
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
          <p className="text-lg font-semibold">{t('challenge.daysSub')}</p>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0 m-0">
            {SPECIAL_DAYS.map((d) => (
              <li key={d.tag} className={`${card} hover-lift !gap-2`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
                <p className="font-bold text-sm uppercase tracking-wide flex items-center gap-1.5"><CalendarStar weight="fill" size={18} aria-hidden="true" />{day(d.date, { month: 'long' })}</p>
                <h3 className="font-display text-2xl leading-tight">{d.name}</h3>
                <p className="font-semibold">{d.theme}</p>
                <p className="text-sm font-bold">{t('challenge.dayCloses', { date: day(d.date) })}</p>
                <p className="text-sm font-bold">{t('challenge.dayWinner', { date: day(winnerDate(d)) })}</p>
                <p className="text-xs font-bold text-muted">{t('challenge.dayTag', { tag: d.name })}</p>
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
          <p className="text-lg font-semibold">{t('challenge.tracksSub')}</p>
          <div className="grid md:grid-cols-2 gap-5">
            {([['hand', PencilSimpleLine, '/challenge/permission', 'challenge.track.hand.slip'], ['studio', PaintBrush, '/teacher/themes', 'challenge.track.studio.go']] as const).map(([k, Icon, to, cta]) => (
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
