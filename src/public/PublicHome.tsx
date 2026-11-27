import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useReducedMotion } from '../ui/useReducedMotion';
import { lazy, Suspense, useEffect, useState } from 'react';
import { ArrowRight, CaretLeft, CaretRight, Check, Barbell, Brain, Buildings, Eraser, HandHeart, House, RocketLaunch, ChalkboardTeacher, Heart, PaintBrush, ShieldCheck, Sliders, Stack, UsersThree } from '@phosphor-icons/react';
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
import { BETA } from '../beta/spec';
import { betaOpen } from '../billing/trial';

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

        <BetaSection />

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

// Trending themes, one at a time (owner, 2026-11-27: "if you are showing
// trending themes, make the layout show one at a time ... if you are
// highlighting, make it something people want to look at"). One big preview
// on a bright stage, its name large, the grade band and game as chips, and
// a row of picture thumbnails to jump between them; it turns on its own.
const STAGE = ['var(--color-sky)', 'var(--color-kelly)', 'var(--color-pink)', 'var(--color-lemon)', 'var(--color-grape)', 'var(--color-teal)'];
function ThemesShowcase() {
  const reduce = useReducedMotion();
  const top = [...STARTER_THEMES].sort((a, b) => a.order - b.order).slice(0, 6);
  const [at, setAt] = useState(0);
  const [hold, setHold] = useState(false);
  useEffect(() => {
    if (reduce || hold || top.length < 2) return;
    const id = window.setTimeout(() => setAt((i) => (i + 1) % top.length), 4500);
    return () => window.clearTimeout(id);
  });
  const x = top[at];
  if (!x) return null;
  const game = GAMES.find((g) => g.id === x.gameId)?.name ?? '';
  const go = (d: number) => setAt((i) => (i + d + top.length) % top.length);
  return (
    <section aria-labelledby="home-themes" className={SECTION} onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)} onFocus={() => setHold(true)} onBlur={() => setHold(false)}>
      <h2 id="home-themes" className={H2}><Title text={t('public.themesTrending')} /></h2>
      <div className="relative rounded-[1.9rem] border-[3.5px] border-border overflow-hidden grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]" style={{ boxShadow: '0 8px 0 var(--ink)', background: STAGE[at % STAGE.length], transition: reduce ? undefined : 'background 0.5s' }}>
        <div className="p-5 sm:p-8 grid place-items-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={x.id} className="w-full max-w-2xl" initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92, rotate: -2 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, rotate: 2 }} transition={reduce ? { duration: 0.15 } : { type: 'spring', stiffness: 260, damping: 22 }}>
              <Link to="/themes" aria-label={x.name} className={`block ${CARD} p-2 no-underline hover-lift`}><ThemePreview bare theme={x.theme} gameName={game} /></Link>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="bg-paper border-t-[3px] lg:border-t-0 lg:border-l-[3px] border-border p-6 sm:p-8 grid content-center gap-4">
          <p className="font-display text-[2.4rem] sm:text-[3rem] leading-[0.95] uppercase m-0">{x.name}</p>
          <p className="flex flex-wrap gap-2 m-0">
            <span className="rounded-pill bg-butter border-std border-border px-3 min-h-9 inline-flex items-center font-bold">{t(`features.band.${x.band}` as StringKey)}</span>
            <span className="rounded-pill bg-lavender border-std border-border px-3 min-h-9 inline-flex items-center font-bold">{game}</span>
          </p>
          <ul className="list-none m-0 p-0 grid grid-cols-6 gap-2" aria-label={t('public.themesPick')}>
            {top.map((y, i) => (
              <li key={y.id}><button type="button" onClick={() => setAt(i)} aria-label={y.name} aria-current={i === at ? 'true' : undefined}
                className={`tap w-full aspect-square rounded-[0.8rem] border-std border-border grid place-items-center motion-safe:transition-transform ${i === at ? 'scale-110' : 'opacity-70 hover:opacity-100'}`}
                style={{ background: STAGE[i % STAGE.length], boxShadow: i === at ? '0 3px 0 var(--ink)' : undefined }}><PaintBrush weight={i === at ? 'fill' : 'bold'} size={18} aria-hidden="true" /></button></li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => go(-1)} aria-label={t('gallery.prev')} className="tap w-12 h-12 rounded-full bg-surface border-std border-border grid place-items-center hover-pop"><CaretLeft weight="bold" size={20} /></button>
            <button type="button" onClick={() => go(1)} aria-label={t('gallery.next')} className="tap w-12 h-12 rounded-full bg-surface border-std border-border grid place-items-center hover-pop"><CaretRight weight="bold" size={20} /></button>
            <Link to="/themes" className={buttonClasses('main', 'hover-pop ml-auto')}>{t('themes.seeAll')}<ArrowRight weight="bold" size={18} /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// The beta test on Home (owner, 2026-11-27: "on the home page, add a section
// about joining our beta test"): a bold Grape card with the offer as a big
// sticker, what testers get and do as short lists, and one button. Shown
// only while the beta window is open and spots remain.
function BetaSection() {
  if (!betaOpen()) return null;
  const gets = [t('home.beta.get.1', { months: BETA.months }), t('home.beta.get.2'), t('home.beta.get.3')];
  const does = [t('home.beta.do.1'), t('home.beta.do.2', { n: BETA.themeGames }), t('home.beta.do.3')];
  return (
    <section aria-labelledby="home-beta" className={`${SECTION}`}>
      <div className="relative rounded-[1.9rem] border-[3.5px] border-border bg-grape text-white overflow-hidden p-6 sm:p-10 grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] items-center" style={{ boxShadow: '0 8px 0 var(--ink)' }}>
        <span className="justify-self-start w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-lemon text-text border-[3.5px] border-border grid place-items-center text-center -rotate-6" style={{ boxShadow: '0 6px 0 var(--ink)' }} aria-hidden="true">
          <span className="grid leading-none"><span className="font-display text-[3.2rem] leading-[0.9]">{BETA.months}</span><span className="font-display text-xl leading-none">{t('home.beta.sticker')}</span></span>
        </span>
        <div className="grid gap-4 min-w-0">
          <h2 id="home-beta" className="title-bubble text-[2rem] sm:text-[2.75rem] leading-none text-white"><Title text={t('home.beta.title')} /></h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[[t('home.beta.gets'), gets], [t('home.beta.does'), does]].map(([h, items]) => (
              <div key={h as string} className="grid gap-2">
                <b className="font-heading text-lg">{h as string}</b>
                <ul className="list-none m-0 p-0 grid gap-1.5">{(items as string[]).map((x) => <li key={x} className="flex items-center gap-2 font-semibold"><span className="w-6 h-6 rounded-full bg-mint text-text border-[2px] border-border grid place-items-center shrink-0" aria-hidden="true"><Check weight="bold" size={13} /></span>{x}</li>)}</ul>
              </div>
            ))}
          </div>
          <span className="justify-self-start rounded-pill bg-pink border-std border-border px-3 min-h-9 inline-flex items-center font-bold text-sm">{t('home.beta.spots', { n: BETA.spots })}</span>
        </div>
        <Link to="/beta" className={buttonClasses('go', 'hover-pop justify-self-start', 'lg')}><RocketLaunch weight="fill" size={22} />{t('beta.join')}</Link>
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
