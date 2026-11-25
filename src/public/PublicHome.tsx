import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useReducedMotion } from '../ui/useReducedMotion';
import { ArrowRight, Buildings, Check, House, RocketLaunch, ChalkboardTeacher, Heart, PaintBrush, Play, ShieldCheck, Sliders, Stack, UsersThree } from '@phosphor-icons/react';
import { Doodle } from '../brand/CrayonKit';
import { CyclingCover } from '../games/covers';
import { ModeDot, shownModes } from '../games/ModeBadge';
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

// The look follows the approved /brand Home mockup (owner, 2026-11-25:
// "keep the extras on home and pricing"): its section order, How it works,
// cover cards with name tags, pastel icon badges and the Lavender closing
// card, with the live extras (themes, the games, features, beta) kept.
const H2 = 'title-bubble text-[2rem] sm:text-[2.75rem] leading-none';
const CARD = 'bg-surface border-bold border-border rounded-panel';
const SECTION = 'mt-12 sm:mt-16 grid gap-6';
const FEATURE_BG: Record<string, string> = { sets: 'bg-butter', themes: 'bg-blush', supports: 'bg-mint', classes: 'bg-blue-crystal', privacy: 'bg-aqua', access: 'bg-peach' };
const HOW: { icon: typeof Stack; bg: string }[] = [{ icon: Stack, bg: 'bg-butter' }, { icon: Play, bg: 'bg-mint' }, { icon: UsersThree, bg: 'bg-blue-crystal' }];
const TRUST = ['ads', 'trackers', 'emails', 'access'];
// The hero title in two halves, split before "becomes" (whole when it is not there).
function heroLines() {
  const text = t('public.hero'); const at = text.toLowerCase().indexOf(' becomes ');
  return at < 0 ? [text] : [text.slice(0, at), text.slice(at + 1)];
}

export default function PublicHome() {
  const reduce = useReducedMotion();
  return (
    <>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10">
        <section className="grid lg:grid-cols-[46fr_54fr] gap-8 lg:gap-12 items-center lg:min-h-[calc(100svh-7rem)]">
          <motion.div initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 content-center">
            {/* Two lines on a laptop, as on the mockup: "Every question / becomes a game". */}
            <h1 className="hero-title title-bubble text-[2.6rem] sm:text-6xl lg:text-[3.3rem] xl:text-[3.7rem] leading-none">{heroLines().map((line, i) => <span key={i} className="sm:block sm:whitespace-nowrap">{i ? ' ' : ''}<Title text={line} /></span>)}</h1>
            <p className="text-lg sm:text-xl font-semibold leading-snug max-w-xl">{t('public.heroSub')}</p>
            <div className="flex flex-wrap gap-3 max-sm:grid max-sm:[&>a]:w-full">
              <Link to="/login?mode=signup" className={buttonClasses('go', 'hover-pop', 'lg')}><ChalkboardTeacher weight="bold" size={22} />{t('public.startFree')}</Link>
              <Link to="/join" className={buttonClasses('secondary', 'hover-pop', 'lg')}>{t('public.joinCode')}<ArrowRight weight="bold" size={20} /></Link>
            </div>
            <p className="font-bold text-muted">{t('public.freeNote')}</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-5" aria-hidden="true">
            {GAMES.slice(0, 6).map((g, i) => (
              <motion.div key={g.id} initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduce ? 0 : 0.1 * i }}
                whileHover={reduce ? undefined : { y: -8, scale: 1.04, transition: { type: 'spring', stiffness: 400, damping: 14 } }}
                className={`relative ${CARD} overflow-hidden`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
                <CyclingCover gameId={g.id} className="aspect-[4/3]" />{/* No name tags on the hero covers (owner, 2026-11-25). */}
              </motion.div>
            ))}
          </div>
        </section>

        <section className={SECTION}>
          <h2 className={H2}><Title text={t('public.modesTitle')} /></h2>
          <FourWays />
        </section>

        <section aria-labelledby="how-it-works" className={SECTION}>
          <h2 id="how-it-works" className={H2}><Title text={t('public.howTitle')} /></h2>
          <ol className="grid md:grid-cols-3 gap-5 list-none p-0 m-0">
            {HOW.map(({ icon: Icon, bg }, i) => (
              <li key={i} className={`hover-lift ${CARD} p-6 grid gap-3 content-start`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
                <span className="flex items-center gap-3" aria-hidden="true">
                  <span className={`wiggle-on-hover w-12 h-12 rounded-full ${bg} border-bold border-border flex items-center justify-center`}><Icon weight="bold" size={24} /></span>
                  <span className="font-score text-3xl leading-none">{i + 1}</span>
                </span>
                <h3 className="font-display text-2xl leading-tight">{t(`public.how.${i + 1}` as StringKey)}</h3>
                <p className="font-semibold">{t(`public.how.${i + 1}.text` as StringKey)}</p>
              </li>
            ))}
          </ol>
        </section>

        <ThemesShowcase />

        <section className={SECTION}>
          <h2 className={H2}><Title text={t('public.gamesTitle')} /></h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {GAMES.map((g) => (
              <Link key={g.id} to="/login?mode=signup" className={`hover-lift group block ${CARD} overflow-hidden no-underline text-text`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
                <span className="block overflow-hidden border-b-[2.5px] border-border"><CyclingCover gameId={g.id} className="aspect-[16/9]" /></span>
                <div className="p-4 grid gap-2">
                  <h3 className="font-display text-2xl"><Title text={g.name} /></h3>
                  {/* Just the icon in its color, small, in one row (teacher, 2026-11-16). */}
                  <div className="flex gap-1.5">{shownModes(g.modes).map((m) => <ModeDot key={m} mode={m} small />)}</div>
                  <p className="text-muted text-sm sm:text-xs leading-snug">{g.description}</p>
                  <span className="text-sm font-bold inline-flex items-center gap-1.5">{t('public.tryIt')}<ArrowRight weight="bold" size={16} className="motion-safe:group-hover:translate-x-1 motion-safe:transition-transform" /></span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className={SECTION}>
          <h2 className={H2}><Title text={t('public.whyTitle')} /></h2>
          <div className="grid md:grid-cols-2 gap-5">
            {WHY.map((k) => (
              <div key={k} className={`hover-lift ${CARD} p-6 flex gap-4 items-start md:last:odd:col-span-2`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
                <span className="shrink-0 w-12 h-12 rounded-full bg-lavender border-bold border-border flex items-center justify-center" aria-hidden="true"><Check weight="bold" size={24} /></span>
                <span className="grid gap-1.5">
                  <h3 className="font-display text-2xl leading-tight"><Title text={t(`public.why.${k}` as StringKey)} /></h3>
                  <p className="font-semibold">{t(`public.why.${k}.text` as StringKey)}</p>
                </span>
              </div>
            ))}
          </div>
          <ul className="flex flex-wrap gap-3 list-none p-0 m-0 max-sm:grid">
            {TRUST.map((k) => <li key={k} className="inline-flex items-center justify-center gap-2 rounded-pill bg-white border-bold border-border px-5 min-h-12 font-bold"><ShieldCheck weight="bold" size={20} aria-hidden="true" />{t(`public.trust.${k}` as StringKey)}</li>)}
          </ul>
          <p className="text-sm font-bold text-muted">{t('public.whyNote')}</p>
          <Link to="/research" className={buttonClasses('secondary', 'justify-self-start hover-pop')}>{t('research.seeAll')}<ArrowRight weight="bold" size={18} /></Link>
        </section>

        <section className={SECTION}>
          <h2 className={H2}><Title text={t('public.featuresTitle')} /></h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, key }) => (
              <div key={key} className={`hover-lift ${CARD} p-6 grid gap-3 content-start`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
                <span className={`wiggle-on-hover w-12 h-12 rounded-full ${FEATURE_BG[key]} border-bold border-border flex items-center justify-center`}><Icon weight="bold" size={24} /></span>
                <h3 className="font-display text-2xl leading-tight"><Title text={t(`public.feature.${key}` as StringKey)} /></h3>
                <p className="font-semibold">{t(`public.feature.${key}.text` as StringKey)}</p>
              </div>
            ))}
          </div>
          <Link to="/features" className={buttonClasses('secondary', 'justify-self-start hover-pop')}>{t('public.allFeatures')}<ArrowRight weight="bold" size={18} /></Link>
        </section>

        <WhoFor />

        <Link to="/beta" className={`mt-12 sm:mt-16 hover-lift grid sm:grid-cols-[auto_1fr_auto] gap-4 items-center ${CARD} p-6 no-underline text-text`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
          <span className="w-14 h-14 rounded-full bg-butter border-bold border-border flex items-center justify-center wiggle-on-hover"><RocketLaunch weight="fill" size={28} aria-hidden="true" /></span>
          <span className="grid gap-1"><span className="font-display text-2xl">{t('public.betaTitle')}</span><span className="font-semibold">{t('public.betaText')}</span></span>
          <span className={buttonClasses('main')}>{t('beta.join')}<ArrowRight weight="bold" size={18} /></span>
        </Link>

        <section className="relative overflow-hidden mt-12 sm:mt-16 bg-lavender border-bold border-border rounded-panel px-6 py-10 sm:p-12 grid gap-5 justify-items-center text-center" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
          <span className="absolute left-4 top-3 sm:left-6 sm:top-5" aria-hidden="true"><Doodle kind="sparkle" color="var(--color-lemon)" size={40} /></span>
          <span className="absolute right-5 bottom-3 sm:right-8 sm:bottom-6" aria-hidden="true"><Doodle kind="star" color="var(--color-pink)" size={34} /></span>
          <h2 className={H2}><Title text={t('public.ctaTitle')} /></h2>
          <div className="flex flex-wrap gap-3 justify-center max-sm:grid max-sm:w-full max-sm:[&>a]:w-full">
            <Link to="/login?mode=signup" className={buttonClasses('go', 'hover-pop', 'lg')}>{t('public.startFree')}</Link>
            <Link to="/pricing" className={buttonClasses('secondary', 'hover-pop', 'lg')}>{t('public.seePlans')}</Link>
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
    <section aria-labelledby="home-themes" className="mt-12 sm:mt-16 bg-butter border-bold border-border rounded-panel p-6 sm:p-10 grid gap-6" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
      <div className="grid gap-2 max-w-3xl">
        <h2 id="home-themes" className={H2}><Title text={t('public.themesTitle')} /></h2>
        <p className="text-lg sm:text-xl font-semibold leading-snug">{t('public.themesText')}</p>
      </div>
      <p className="font-display text-2xl">{t('public.themesTrending')}</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {top.map((x, i) => (
          <motion.div key={x.id} initial={reduce ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: reduce ? 0 : i * 0.07 }}>
            <Link to="/themes" className="hover-lift block bg-surface border-bold border-border rounded-panel p-2 no-underline text-text" style={{ boxShadow: 'var(--shadow-sticker)' }}>
              <ThemePreview theme={x.theme} gameName={GAMES.find((g) => g.id === x.gameId)?.name ?? ''} />
              <span className="block px-1 pt-2 font-display text-xl">{x.name}</span>
              <span className="block px-1 pb-1 text-sm font-semibold text-muted">{t(`features.band.${x.band}` as StringKey)} · {t('themes.starter')}</span>
            </Link>
          </motion.div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 max-sm:grid max-sm:[&>a]:w-full">
        <Link to="/themes" className={buttonClasses('main', 'hover-pop', 'lg')}>{t('themes.seeAll')}<ArrowRight weight="bold" size={20} /></Link>
        <Link to="/challenge" className={buttonClasses('secondary', 'hover-pop', 'lg')}>{t('public.themesChallenge')}</Link>
      </div>
    </section>
  );
}

// Three front doors, one per buyer (teacher, 2026-10-25).
function WhoFor() {
  const doors = [
    { key: 'teachers', icon: ChalkboardTeacher, to: '/features', bg: 'bg-blush' },
    { key: 'schools', icon: Buildings, to: '/schools', bg: 'bg-aqua' },
    { key: 'homeschool', icon: House, to: '/homeschool', bg: 'bg-peach' },
  ] as const;
  return (
    <section aria-labelledby="who-for" className={SECTION}>
      <h2 id="who-for" className={H2}><Title text={t('public.whoTitle')} /></h2>
      <div className="grid md:grid-cols-3 gap-5">
        {doors.map(({ key, icon: I, to, bg }) => (
          <Link key={key} to={to} className={`hover-lift group ${CARD} p-6 grid gap-3 content-start no-underline text-text`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
            <span className={`w-12 h-12 rounded-full ${bg} border-bold border-border flex items-center justify-center wiggle-on-hover`}><I weight="bold" size={24} aria-hidden="true" /></span>
            <span className="font-display text-2xl leading-tight">{t(`public.who.${key}` as StringKey)}</span>
            <span className="font-semibold">{t(`public.who.${key}.text` as StringKey)}</span>
            <span className="text-sm font-bold inline-flex items-center gap-1.5">{t(`public.who.${key}.go` as StringKey)}<ArrowRight weight="bold" size={16} className="motion-safe:group-hover:translate-x-1 motion-safe:transition-transform" /></span>
          </Link>
        ))}
      </div>
    </section>
  );
}
