import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useReducedMotion } from '../ui/useReducedMotion';
import { lazy, Suspense } from 'react';
import { ArrowRight, Barbell, Brain, Buildings, Eraser, HandHeart, House, RocketLaunch, ChalkboardTeacher, Heart, PaintBrush, ShieldCheck, Sliders, Stack, UsersThree } from '@phosphor-icons/react';
import IconBadge, { type BadgeColor } from '../ui/IconBadge';
import { CyclingCover } from '../games/covers';
import { ModeDot, shownModes } from '../games/ModeBadge';
import FourWays from '../games/FourWays';
import { GAMES } from '../games/registry';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { buttonClasses } from '../ui/kit';
import Title from '../ui/Title';
import { ScrapbookPage } from './scrapbook/Shell';
import HomeCollage from './scrapbook/HomeCollage';
import CardTape from './scrapbook/CardTape';
import ThemePreview from '../theme/builder/ThemePreview';
import { STARTER_THEMES } from '../theme/starters';

// The public home page (development plan Part 3A): what Gamify is, the four
// ways to play, the games, why it works (honest research lines), and the
// two front doors: teachers start free, students join with a code.
// Why it works and Made for Every Learner scan at a glance (owner,
// 2026-11-25: "make more visual and nice/professional for easy scanning"):
// one icon on its pastel badge, a short headline beside it, one or two lines.
type Point = { icon: typeof Stack; key: string; bg: BadgeColor };
const FEATURES: Point[] = [
  { icon: Stack, key: 'sets', bg: 'butter' }, { icon: PaintBrush, key: 'themes', bg: 'blush' }, { icon: Sliders, key: 'supports', bg: 'mint' },
  { icon: UsersThree, key: 'classes', bg: 'blue-crystal' }, { icon: ShieldCheck, key: 'privacy', bg: 'aqua' }, { icon: Heart, key: 'access', bg: 'peach' },
];
const WHY: Point[] = [
  { icon: Brain, key: 'practice', bg: 'lavender' }, { icon: Barbell, key: 'support', bg: 'butter' }, { icon: Eraser, key: 'mistakes', bg: 'mint' },
  { icon: UsersThree, key: 'together', bg: 'blue-crystal' }, { icon: HandHeart, key: 'udl', bg: 'blush' },
];
// Five cards in a tidy grid: three across, then two wider ones (laptop);
// two across with the last one full width (tablet); one column (phone).
const WHY_SPAN = ['lg:col-span-2', 'lg:col-span-2', 'lg:col-span-2', 'lg:col-span-3', 'md:col-span-2 lg:col-span-3'];

// The look is the /brand Scrapbook Home mockup in strength B (owner,
// 2026-11-26: "home=b"): the Cream ground, the hero collage of real game
// covers with tape, small tilts, stickers and the one hand-lettered word
// (hero "keep entirely"). Every other section is plain scrapbook cards:
// "keep, no stickers ... remove tape boarder from bottom entirely", "remove
// random stickers from everywhere but the hero top part". In B the text cards
// stay flat and untaped (tape on cards is strength C only). The live extras
// (themes, the games, features, beta) stay (owner, 2026-11-25).
const H2 = 'title-bubble text-[2rem] sm:text-[2.75rem] leading-none';
const CARD = 'sb-card';
const FEATURE_TILT = [-1.2, 1.5, -0.6, 1, -1.6, 0.7];
const SECTION = 'mt-12 sm:mt-16 grid gap-6';
// How it works: a Step pill on Butter, Blush and Mint (the mockup).
const HOW = ['bg-butter', 'bg-blush', 'bg-mint'];
// The pencil and stars in the left margin of the hero, on wide screens.
const HeroMargin = lazy(() => import('./scrapbook/HomeHeroArt').then((m) => ({ default: m.HeroMargin })));
const TRUST = ['ads', 'trackers', 'emails', 'access'];
// The hero title in two halves, split before "becomes" (whole when it is not there).
function heroLines() {
  const text = t('public.hero'); const at = text.toLowerCase().indexOf(' becomes ');
  return at < 0 ? [text] : [text.slice(0, at), text.slice(at + 1)];
}

export default function PublicHome() {
  const reduce = useReducedMotion();
  return (
    <ScrapbookPage strength="B">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10">
        <section className="relative grid lg:grid-cols-[46fr_54fr] gap-8 lg:gap-12 items-center lg:min-h-[calc(100svh-7rem)]">
          <Suspense fallback={null}><HeroMargin /></Suspense>
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
          <HomeCollage />
        </section>

        <section className={SECTION}>
          <h2 className={H2}><Title text={t('public.modesTitle')} /></h2>
          <FourWays />
        </section>

        <section aria-labelledby="how-it-works" className={SECTION}>
          <h2 id="how-it-works" className={H2}><Title text={t('public.howTitle')} /></h2>
          <ol className="grid md:grid-cols-3 gap-5 list-none p-0 m-0">
            {HOW.map((bg, i) => (
              <li key={i} className={`relative hover-lift ${CARD} p-6 grid gap-3 content-start`}>
                {/* No tape here; the Step chip wears Grow Year (owner, 2026-11-26). */}
                <span className={`justify-self-start px-3 py-1 rounded-pill ${bg} border-std border-border font-score text-lg leading-none tracking-wide`}>{t('public.howStep', { n: i + 1 })}</span>
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
              <Link key={g.id} to="/login?mode=signup" className={`hover-lift group block ${CARD} overflow-hidden no-underline text-text`}>
                <span className="block overflow-hidden border-b-[3px] border-border"><CyclingCover gameId={g.id} className="aspect-[16/9]" /></span>
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
          <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-5">
            {WHY.map((p, i) => <PointCard key={p.key} point={p} group="why" className={WHY_SPAN[i]} tape={i === 2 ? 2 : undefined} />)}
          </div>
          <ul className="flex flex-wrap gap-3 list-none p-0 m-0 max-sm:grid">
            {TRUST.map((k) => <li key={k} className="inline-flex items-center justify-center gap-2 rounded-pill bg-white border-bold border-border px-5 min-h-12 font-bold"><ShieldCheck weight="bold" size={20} aria-hidden="true" />{t(`public.trust.${k}` as StringKey)}</li>)}
          </ul>
          <p className="text-sm font-bold text-muted">{t('public.whyNote')}</p>
          <Link to="/research" className={buttonClasses('secondary', 'justify-self-start hover-pop')}>{t('research.seeAll')}<ArrowRight weight="bold" size={18} /></Link>
        </section>

        <section className={SECTION}>
          <h2 className={H2}><Title text={t('public.featuresTitle')} /></h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 sm:auto-rows-fr gap-5">
            {/* Tilt and tape scattered by hand (owner 2026-11-26: "tilt and tape randomly for these two sections"). */}
            {FEATURES.map((p, i) => <PointCard key={p.key} point={p} group="feature" tilt={FEATURE_TILT[i % FEATURE_TILT.length]} tape={i === 1 ? 5 : i === 3 ? 3 : undefined} />)}
          </div>
          <Link to="/features" className={buttonClasses('secondary', 'justify-self-start hover-pop')}>{t('public.allFeatures')}<ArrowRight weight="bold" size={18} /></Link>
        </section>

        <WhoFor />

        <Link to="/beta" className={`mt-12 sm:mt-16 hover-lift grid sm:grid-cols-[auto_1fr_auto] gap-4 items-center ${CARD} p-6 no-underline text-text`}>
          <span className="w-14 h-14 rounded-full bg-butter border-bold border-border flex items-center justify-center wiggle-on-hover"><RocketLaunch weight="fill" size={28} aria-hidden="true" /></span>
          <span className="grid gap-1"><span className="font-display text-2xl">{t('public.betaTitle')}</span><span className="font-semibold">{t('public.betaText')}</span></span>
          <span className={buttonClasses('main')}>{t('beta.join')}<ArrowRight weight="bold" size={18} /></span>
        </Link>

        {/* The closing card: a plain white scrapbook card, left aligned, no stickers (the mockup). */}
        <section className={`mt-12 sm:mt-16 ${CARD} p-6 sm:p-10 grid gap-5 justify-items-start`}>
          <h2 className={H2}><Title text={t('public.ctaTitle')} /></h2>
          <div className="flex flex-wrap gap-3 max-sm:grid max-sm:w-full max-sm:[&>a]:w-full">
            <Link to="/login?mode=signup" className={buttonClasses('go', 'hover-pop', 'lg')}>{t('public.startFree')}</Link>
            <Link to="/pricing" className={buttonClasses('secondary', 'hover-pop', 'lg')}>{t('public.seePlans')}</Link>
          </div>
        </section>
      </main>
    </ScrapbookPage>
  );
}

// One scannable card: the icon badge and short headline on one row, the
// line under them, and the research number big where the page has one.
function PointCard({ point: { icon: Icon, key, bg }, group, className = '', tape, tilt }: { point: Point; group: 'why' | 'feature'; className?: string; tape?: number; tilt?: number }) {
  const stat = group === 'why' && key === 'practice';
  return (
    <div className={`relative hover-lift ${CARD} p-6 grid gap-3 content-start ${className}`} style={tilt ? { rotate: `${tilt}deg` } : undefined}>
      {tape !== undefined && <CardTape tone={tape} rot={tilt && tilt < 0 ? -4 : 4} />}
      <div className="flex items-center gap-4">
        <span className="wiggle-on-hover"><IconBadge color={bg} size="lg"><Icon weight="bold" size={28} /></IconBadge></span>
        <h3 className="font-display text-2xl leading-tight"><Title text={t(`public.${group}.${key}` as StringKey)} /></h3>
      </div>
      {stat && (
        <p className="m-0 flex items-baseline gap-2">
          <span className="font-score text-5xl leading-none">{t('public.why.practice.stat')}</span>
          <span className="font-bold text-lg">{t('public.why.practice.statLabel')}</span>
        </p>
      )}
      <p className="m-0 font-semibold leading-snug">{t(`public.${group}.${key}.text` as StringKey)}</p>
    </div>
  );
}

// Themes are what make Gamify stand out and what Plus and Pro are built on
// (teacher, 2026-10-25): a showcase of trending looks (samples until launch)
// that opens into the full Themes page.
function ThemesShowcase() {
  const reduce = useReducedMotion();
  const top = [...STARTER_THEMES].sort((a, b) => a.order - b.order).slice(0, 4);
  return (
    <section aria-labelledby="home-themes" className={SECTION}>
      <div className="grid gap-2 max-w-3xl">
        <h2 id="home-themes" className={H2}><Title text={t('public.themesTitle')} /></h2>
        <p className="text-lg sm:text-xl font-semibold leading-snug">{t('public.themesText')}</p>
      </div>
      <p className="font-display text-2xl">{t('public.themesTrending')}</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {top.map((x, i) => (
          <motion.div key={x.id} initial={reduce ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: reduce ? 0 : i * 0.07 }}>
            <Link to="/themes" className={`hover-lift block ${CARD} p-2 no-underline text-text`}>
              <ThemePreview bare theme={x.theme} gameName={GAMES.find((g) => g.id === x.gameId)?.name ?? ''} />
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
        {doors.map(({ key, icon: I, to, bg }, i) => (
          <Link key={key} to={to} style={{ rotate: `${[1.1, -1.4, 0.8][i % 3]}deg` }} className={`relative hover-lift group ${CARD} p-6 grid gap-3 content-start no-underline text-text`}>
            {i === 2 && <CardTape tone={4} rot={3} />}
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
