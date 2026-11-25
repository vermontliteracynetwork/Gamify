import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useReducedMotion } from '../ui/useReducedMotion';
import { Crown, Medal, PaintBrush, PencilSimpleLine } from '@phosphor-icons/react';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { buttonClasses } from '../ui/kit';
import Title from '../ui/Title';
import PublicFooter from './PublicFooter';

// The Theme Building Challenge (teacher, 2026-10-25): a launch campaign that
// fills the theme library. One winner and a set of runners up (no 1st, 2nd,
// 3rd). Dates and official rules come before entries open (attorney review).
export default function ChallengePage() {
  const reduce = useReducedMotion();
  const card = 'bg-surface border-bold border-border rounded-panel p-6 grid gap-3 content-start';
  return (
    <>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 grid gap-8">
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
          <div className="grid md:grid-cols-2 gap-5">
            {(['winner', 'runner'] as const).map((k, i) => (
              <motion.article key={k} initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduce ? 0 : i * 0.08 }}
                className={`${card} hover-lift ${k === 'winner' ? '!bg-butter' : ''}`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
                <h3 className="font-display text-3xl flex items-center gap-2">{k === 'winner' ? <Crown weight="fill" size={32} color="var(--lemon)" aria-hidden="true" /> : <Medal weight="fill" size={32} color="var(--sky)" aria-hidden="true" />}<Title text={t(`challenge.${k}` as StringKey)} /></h3>
                <ul className="grid gap-2 pl-6 m-0 list-disc text-lg font-semibold">{[1, 2, 3].map((n) => <li key={n}>{t(`challenge.${k}.${n}` as StringKey)}</li>)}</ul>
              </motion.article>
            ))}
          </div>
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
