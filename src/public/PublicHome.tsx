import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Buildings, House, RocketLaunch, Brain, ChalkboardTeacher, Heart, PaintBrush, ShieldCheck, Sliders, Stack, UsersThree } from '@phosphor-icons/react';
import { GameCover } from '../games/covers';
import { ModeBadge } from '../games/ModeBadge';
import FourWays from '../games/FourWays';
import { GAMES } from '../games/registry';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { buttonClasses } from '../ui/kit';
import Title from '../ui/Title';
import PublicFooter from './PublicFooter';
import ThemePreview from '../theme/builder/ThemePreview';
import { STARTER_THEMES } from '../theme/starters';

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
              <Link to="/login?mode=signup" className={buttonClasses('primary', 'min-h-14 px-7 text-lg hover-pop')} style={{ boxShadow: 'var(--shadow-sticker)' }}><ChalkboardTeacher weight="bold" size={22} />{t('public.startFree')}</Link>
              <Link to="/join" className={buttonClasses('secondary', 'min-h-14 px-7 text-lg hover-pop')}>{t('public.joinCode')}<ArrowRight weight="bold" size={20} /></Link>
            </div>
            <p className="text-sm font-bold text-muted">{t('public.freeNote')}</p>
          </motion.div>
          <div className="grid grid-cols-2 gap-3" aria-hidden="true">
            {GAMES.slice(0, 6).map((g, i) => (
              <motion.div key={g.id} initial={reduce ? false : { opacity: 0, y: 20, rotate: i % 2 ? 2 : -2 }} animate={{ opacity: 1, y: 0, rotate: i % 2 ? 1.5 : -1.5 }} transition={{ delay: reduce ? 0 : 0.1 * i }}
                whileHover={reduce ? undefined : { y: -8, rotate: i % 2 ? -2 : 2, scale: 1.04, transition: { type: 'spring', stiffness: 400, damping: 14 } }}
                className="rounded-panel border-[2.5px] border-border overflow-hidden bg-surface" style={{ boxShadow: 'var(--shadow-sticker)' }}>
                <GameCover gameId={g.id} className="aspect-[4/3] cover-zoom" />
              </motion.div>
            ))}
          </div>
        </section>

        <WhoFor />

        <section className="mt-16 grid gap-4">
          <h2 className="title-bubble text-4xl"><Title text={t('public.modesTitle')} /></h2>
          <FourWays />
        </section>

        <ThemesShowcase />

        <section className="mt-16 grid gap-4">
          <h2 className="title-bubble text-4xl"><Title text={t('public.gamesTitle')} /></h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {GAMES.map((g) => (
              <Link key={g.id} to="/login?mode=signup" className="hover-lift group block bg-surface border-[2.5px] border-border rounded-panel overflow-hidden no-underline text-text" style={{ boxShadow: 'var(--shadow-sticker)' }}>
                <span className="block overflow-hidden border-b-[2.5px] border-border"><GameCover gameId={g.id} className="aspect-[16/9] cover-zoom" /></span>
                <div className="p-4 grid gap-2">
                  <h3 className="font-display text-2xl"><Title text={g.name} /></h3>
                  <div className="flex flex-wrap gap-2">{g.modes.map((m) => <ModeBadge key={m} mode={m} />)}</div>
                  <p className="text-sm font-bold text-muted">{g.description}</p>
                  <span className="text-sm font-bold inline-flex items-center gap-1.5">{t('public.tryIt')}<ArrowRight weight="bold" size={16} className="motion-safe:group-hover:translate-x-1 motion-safe:transition-transform" /></span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-4">
          <h2 className="title-bubble text-4xl"><Title text={t('public.featuresTitle')} /></h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, key }) => (
              <div key={key} className="hover-lift bg-surface border-[2.5px] border-border rounded-panel p-5 grid gap-2 content-start" style={{ boxShadow: 'var(--shadow-sticker)' }}>
                <span className="wiggle-on-hover w-12 h-12 rounded-full bg-accent border-[2.5px] border-border flex items-center justify-center"><Icon weight="bold" size={24} /></span>
                <h3 className="font-display text-2xl"><Title text={t(`public.feature.${key}` as StringKey)} /></h3>
                <p className="font-semibold">{t(`public.feature.${key}.text` as StringKey)}</p>
              </div>
            ))}
          </div>
          <Link to="/features" className={buttonClasses('secondary', 'justify-self-start hover-pop')}>{t('public.allFeatures')}<ArrowRight weight="bold" size={18} /></Link>
        </section>

        <section className="mt-16 grid gap-4">
          <h2 className="title-bubble text-4xl flex items-center gap-3"><Brain weight="bold" size={36} aria-hidden="true" /><Title text={t('public.whyTitle')} /></h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {WHY.map((k) => (
              <div key={k} className="hover-lift bg-surface border-[2.5px] border-border rounded-panel p-5 grid gap-2 content-start" style={{ boxShadow: 'var(--shadow-sticker)' }}>
                <h3 className="font-display text-2xl"><Title text={t(`public.why.${k}` as StringKey)} /></h3>
                <p className="font-semibold">{t(`public.why.${k}.text` as StringKey)}</p>
              </div>
            ))}
          </div>
          <p className="text-sm font-bold text-muted">{t('public.whyNote')}</p>
          <Link to="/research" className={buttonClasses('secondary', 'justify-self-start hover-pop')}>{t('research.seeAll')}<ArrowRight weight="bold" size={18} /></Link>
        </section>

        <Link to="/beta" className="mt-16 hover-lift grid sm:grid-cols-[auto_1fr_auto] gap-4 items-center bg-surface border-[2.5px] border-border rounded-panel p-5 no-underline text-text" style={{ boxShadow: 'var(--shadow-sticker)' }}>
          <span className="w-14 h-14 rounded-full bg-accent border-[2.5px] border-border flex items-center justify-center wiggle-on-hover"><RocketLaunch weight="fill" size={28} aria-hidden="true" /></span>
          <span className="grid gap-1"><span className="font-display text-2xl">{t('public.betaTitle')}</span><span className="font-semibold">{t('public.betaText')}</span></span>
          <span className={buttonClasses('primary', '!bg-text !text-white')}>{t('beta.join')}<ArrowRight weight="bold" size={18} /></span>
        </Link>

        <section className="mt-16 bg-accent border-[2.5px] border-border rounded-panel p-8 grid gap-4 justify-items-center text-center" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
          <h2 className="title-bubble text-4xl"><Title text={t('public.ctaTitle')} /></h2>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/login?mode=signup" className={buttonClasses('secondary', 'min-h-14 px-7 text-lg hover-pop')}>{t('public.startFree')}</Link>
            <Link to="/pricing" className={buttonClasses('ghost', 'min-h-14 px-7 text-lg hover-pop')}>{t('public.seePlans')}</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}

// Themes are what make Gamify stand out and what Plus and Pro are built on
// (teacher, 2026-10-25): a showcase of trending looks (samples until launch)
// that opens into the full Themes page.
function ThemesShowcase() {
  const reduce = useReducedMotion();
  const top = [...STARTER_THEMES].sort((a, b) => a.order - b.order).slice(0, 4);
  return (
    <section aria-labelledby="home-themes" className="mt-16 bg-accent border-[2.5px] border-border rounded-panel p-5 sm:p-8 grid gap-5" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
      <div className="grid gap-2 max-w-3xl">
        <h2 id="home-themes" className="title-bubble text-4xl flex items-center gap-3"><PaintBrush weight="fill" size={38} aria-hidden="true" className="wiggle-on-hover" /><Title text={t('public.themesTitle')} /></h2>
        <p className="text-lg font-semibold">{t('public.themesText')}</p>
      </div>
      <p className="font-display text-2xl">{t('public.themesTrending')}</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {top.map((x, i) => (
          <motion.div key={x.id} initial={reduce ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: reduce ? 0 : i * 0.07 }}>
            <Link to="/themes" className="hover-lift block bg-surface border-[2.5px] border-border rounded-panel p-2 no-underline text-text" style={{ boxShadow: 'var(--shadow-sticker)' }}>
              <ThemePreview theme={x.theme} gameName={GAMES.find((g) => g.id === x.gameId)?.name ?? ''} />
              <span className="block px-1 pt-2 font-display text-xl">{x.name}</span>
              <span className="block px-1 pb-1 text-sm font-semibold text-muted">{t(`features.band.${x.band}` as StringKey)} · {t('themes.starter')}</span>
            </Link>
          </motion.div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/themes" className={buttonClasses('primary', 'min-h-14 px-7 text-lg hover-pop !bg-text !text-white')}>{t('themes.seeAll')}<ArrowRight weight="bold" size={20} /></Link>
        <Link to="/challenge" className={buttonClasses('secondary', 'min-h-14 px-7 text-lg hover-pop')}>{t('public.themesChallenge')}</Link>
      </div>
    </section>
  );
}

// Three front doors, one per buyer (teacher, 2026-10-25).
function WhoFor() {
  const doors = [
    { key: 'teachers', icon: ChalkboardTeacher, to: '/features' },
    { key: 'schools', icon: Buildings, to: '/schools' },
    { key: 'homeschool', icon: House, to: '/homeschool' },
  ] as const;
  return (
    <section aria-labelledby="who-for" className="mt-16 grid gap-4">
      <h2 id="who-for" className="title-bubble text-4xl"><Title text={t('public.whoTitle')} /></h2>
      <div className="grid md:grid-cols-3 gap-4">
        {doors.map(({ key, icon: I, to }) => (
          <Link key={key} to={to} className="hover-lift group bg-surface border-[2.5px] border-border rounded-panel p-5 grid gap-2 content-start no-underline text-text" style={{ boxShadow: 'var(--shadow-sticker)' }}>
            <span className="w-12 h-12 rounded-full bg-accent border-[2.5px] border-border flex items-center justify-center wiggle-on-hover"><I weight="fill" size={24} aria-hidden="true" /></span>
            <span className="font-display text-2xl">{t(`public.who.${key}` as StringKey)}</span>
            <span className="font-semibold">{t(`public.who.${key}.text` as StringKey)}</span>
            <span className="text-sm font-bold inline-flex items-center gap-1.5">{t(`public.who.${key}.go` as StringKey)}<ArrowRight weight="bold" size={16} className="motion-safe:group-hover:translate-x-1 motion-safe:transition-transform" /></span>
          </Link>
        ))}
      </div>
    </section>
  );
}
