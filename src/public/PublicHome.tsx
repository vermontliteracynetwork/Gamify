import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Brain, ChalkboardTeacher, Heart, PaintBrush, ShieldCheck, Sliders, Stack, UsersThree } from '@phosphor-icons/react';
import { ALL_MODES } from '../data/types';
import { GameCover } from '../games/covers';
import { ModeBadge } from '../games/ModeBadge';
import { GAMES } from '../games/registry';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { buttonClasses } from '../ui/kit';
import Title from '../ui/Title';
import PublicFooter from './PublicFooter';

// The public home page (development plan Part 3A): what Gamify is, the four
// ways to play, the games, why it works (honest research lines), and the
// two front doors: teachers start free, students join with a code.
const FEATURES: { icon: typeof Stack; key: string }[] = [
  { icon: Stack, key: 'sets' }, { icon: PaintBrush, key: 'themes' }, { icon: Sliders, key: 'supports' },
  { icon: UsersThree, key: 'classes' }, { icon: ShieldCheck, key: 'privacy' }, { icon: Heart, key: 'access' },
];
const WHY = ['practice', 'support', 'mistakes', 'together', 'udl'];

export default function PublicHome() {
  const reduce = useReducedMotion();
  return (
    <>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10">
        <section className="grid lg:grid-cols-[1.1fr_1fr] gap-8 items-center">
          <motion.div initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid gap-5">
            <h1 className="title-bubble text-5xl sm:text-6xl leading-tight"><Title text={t('public.hero')} /></h1>
            <p className="text-lg font-bold max-w-xl">{t('public.heroSub')}</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/login?mode=signup" className={buttonClasses('primary', 'min-h-14 px-7 text-lg')} style={{ boxShadow: 'var(--shadow-sticker)' }}><ChalkboardTeacher weight="bold" size={22} />{t('public.startFree')}</Link>
              <Link to="/join" className={buttonClasses('secondary', 'min-h-14 px-7 text-lg')}>{t('public.joinCode')}<ArrowRight weight="bold" size={20} /></Link>
            </div>
            <p className="text-sm font-bold text-muted">{t('public.freeNote')}</p>
          </motion.div>
          <div className="grid grid-cols-2 gap-3" aria-hidden="true">
            {GAMES.map((g, i) => (
              <motion.div key={g.id} initial={reduce ? false : { opacity: 0, y: 20, rotate: i % 2 ? 2 : -2 }} animate={{ opacity: 1, y: 0, rotate: i % 2 ? 1.5 : -1.5 }} transition={{ delay: reduce ? 0 : 0.1 * i }}
                className="rounded-panel border-[2.5px] border-border overflow-hidden bg-surface" style={{ boxShadow: 'var(--shadow-sticker)' }}>
                <GameCover gameId={g.id} className="aspect-[4/3]" />
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-4">
          <h2 className="font-display text-4xl"><Title text={t('public.modesTitle')} /></h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {ALL_MODES.map((m) => (
              <div key={m} className="bg-surface border-[2.5px] border-border rounded-panel p-4 grid gap-2" style={{ boxShadow: 'var(--shadow-sticker)' }}>
                <ModeBadge mode={m} />
                <p className="font-bold">{t(`public.mode.${m}` as StringKey)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-4">
          <h2 className="font-display text-4xl"><Title text={t('public.gamesTitle')} /></h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {GAMES.map((g) => (
              <div key={g.id} className="bg-surface border-[2.5px] border-border rounded-panel overflow-hidden" style={{ boxShadow: 'var(--shadow-sticker)' }}>
                <GameCover gameId={g.id} className="aspect-[16/9] border-b-[2.5px] border-border" />
                <div className="p-4 grid gap-2">
                  <h3 className="font-display text-2xl"><Title text={g.name} /></h3>
                  <div className="flex flex-wrap gap-2">{g.modes.map((m) => <ModeBadge key={m} mode={m} />)}</div>
                  <p className="text-sm font-bold text-muted">{g.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-4">
          <h2 className="font-display text-4xl"><Title text={t('public.featuresTitle')} /></h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, key }) => (
              <div key={key} className="bg-surface border-[2.5px] border-border rounded-panel p-5 grid gap-2 content-start" style={{ boxShadow: 'var(--shadow-sticker)' }}>
                <span className="w-12 h-12 rounded-full bg-accent border-[2.5px] border-border flex items-center justify-center"><Icon weight="bold" size={24} /></span>
                <h3 className="font-display text-2xl"><Title text={t(`public.feature.${key}` as StringKey)} /></h3>
                <p className="font-semibold">{t(`public.feature.${key}.text` as StringKey)}</p>
              </div>
            ))}
          </div>
          <Link to="/features" className={buttonClasses('secondary', 'justify-self-start')}>{t('public.allFeatures')}<ArrowRight weight="bold" size={18} /></Link>
        </section>

        <section className="mt-16 grid gap-4">
          <h2 className="font-display text-4xl flex items-center gap-3"><Brain weight="bold" size={36} aria-hidden="true" /><Title text={t('public.whyTitle')} /></h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {WHY.map((k) => (
              <div key={k} className="bg-surface border-[2.5px] border-border rounded-panel p-5 grid gap-2 content-start">
                <h3 className="font-display text-2xl"><Title text={t(`public.why.${k}` as StringKey)} /></h3>
                <p className="font-semibold">{t(`public.why.${k}.text` as StringKey)}</p>
              </div>
            ))}
          </div>
          <p className="text-sm font-bold text-muted">{t('public.whyNote')}</p>
        </section>

        <section className="mt-16 bg-accent border-[2.5px] border-border rounded-panel p-8 grid gap-4 justify-items-center text-center" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
          <h2 className="font-display text-4xl"><Title text={t('public.ctaTitle')} /></h2>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/login?mode=signup" className={buttonClasses('secondary', 'min-h-14 px-7 text-lg')}>{t('public.startFree')}</Link>
            <Link to="/pricing" className={buttonClasses('ghost', 'min-h-14 px-7 text-lg')}>{t('public.seePlans')}</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
