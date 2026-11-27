import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, CaretDown, ChalkboardTeacher, ChartBar, Check, FileText, Leaf, Lock, PaintBrush, SortAscending, SpeakerHigh, Star, TextAa, X, type Icon } from '@phosphor-icons/react';
import PlanFeatures from '../billing/PlanFeatures';
import type { PlayMode } from '../data/types';
import { speak } from '../engine/feedback';
import { GameCover } from '../games/covers';
import { MODE_BRIGHT, MODE_COLORS, MODE_ICONS, ModeBadge, SHOWN_MODES, shownModes } from '../games/ModeBadge';
import { GAMES } from '../games/registry';
import { GameScene, showcaseThemes, ThemeCycler } from '../games/scenes';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { useSettings } from '../settings/SettingsContext';
import { classicTheme } from '../theme/classic';
import { useMadeThemes } from '../theme/made';
import type { GameTheme } from '../theme/types';
import { buttonClasses } from '../ui/kit';
import Title from '../ui/Title';
import { useReducedMotion } from '../ui/useReducedMotion';
import PublicFooter from './PublicFooter';
import ThemeGallery from './ThemeGallery';
import { useScrapbookGround } from './scrapbook/Shell';

// The Features page, rebuilt as the main selling page (owner, 2026-11-26:
// "features=improve page entirely. this should be a main selling point page
// and real pictures of the games should be added. make sure the image mockups
// of the games can be replicated and cycled through with the other themes
// people create"). Scrapbook strength A (/brand?tab=scrapbook&sb=A): cream
// ground, clean white cards, no stickers or tape (those live only in the Home
// hero). The order sells: the outcome for teachers, the real games (live
// pictures that cycle every theme, src/games/scenes.tsx), the learning, class
// themes to try, the ways to play, the teacher's own view, fair play, the
// research, then plans and one clear Start free. Every line describes
// something built.
//
// The top bar and footer belong to the shared public shell; this page only
// brings its own cream ground so it sits cleanly on that shell.

const card = 'bg-white border-bold border-border rounded-panel';
// The caret on every fold, turning when it opens (owner, 2026-11-27).
const Caret = () => <span className="w-9 h-9 rounded-full border-std border-border bg-surface grid place-items-center shrink-0"><CaretDown weight="bold" size={18} className="motion-safe:transition-transform group-open:rotate-180" aria-hidden="true" /></span>;
const lift: CSSProperties = { boxShadow: '0 5px 0 var(--ink)' };
const JUMPS = ['games', 'learning', 'themes', 'play', 'view', 'fair'] as const;
const MORE: { key: string; items: number }[] = [
  { key: 'sets', items: 5 }, { key: 'classes', items: 7 }, { key: 'supports', items: 6 }, { key: 'safety', items: 5 },
];

export default function FeaturesPage() {
  useScrapbookGround(); // owner 2026-11-26: scrapbook A
  const reduce = useReducedMotion();
  const enter = { initial: reduce ? false : { opacity: 0, y: 18 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.15 } } as const;
  return (
    <div>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-4 grid gap-20 sm:gap-24">
        <section className="grid gap-5" aria-labelledby="features-title">
          <h1 id="features-title" className="title-bubble text-5xl sm:text-6xl"><Title text={t('features.title')} /></h1>
          <p className="text-xl font-bold">{t('features.sub')}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <Link to="/login?mode=signup" className={buttonClasses('primary', 'hover-pop', 'lg')}><ChalkboardTeacher weight="bold" size={22} />{t('public.startFree')}</Link>
            <Link to="/pricing" className={buttonClasses('secondary', 'hover-pop', 'lg')}>{t('public.seePlans')}<ArrowRight weight="bold" size={20} /></Link>
            <span className="font-semibold">{t('features.hero.free')}</span>
          </div>
          <nav aria-label={t('features.jump')} className="flex flex-wrap gap-2">
            {JUMPS.map((id) => (
              <a key={id} href={`#${id}`} className="min-h-11 px-4 rounded-pill border-std border-border bg-white font-bold no-underline text-text inline-flex items-center hover:bg-butter motion-safe:transition">{t(`features.jump.${id}` as StringKey)}</a>
            ))}
          </nav>
        </section>

        <GamesShowcase />

        <motion.section id="learning" {...enter} aria-labelledby="learning-title" className="grid lg:grid-cols-2 gap-8 items-center scroll-mt-24">
          <div className="grid gap-4">
            <h2 id="learning-title" className="title-bubble text-4xl sm:text-5xl leading-tight"><Title text={t('features.learn.title')} /></h2>
            <p className="text-lg font-semibold">{t('features.learn.text')}</p>
            <Points prefix="features.learn" n={4} />
          </div>
          <QuestionDemo />
        </motion.section>

        <motion.section id="themes" {...enter} aria-labelledby="themes-title" className="grid lg:grid-cols-2 gap-8 items-center scroll-mt-24">
          <LookDemo />
          <div className="grid gap-4 lg:order-first">
            <h2 id="themes-title" className="title-bubble text-4xl sm:text-5xl leading-tight"><Title text={t('features.theme.title')} /></h2>
            <p className="text-lg font-semibold">{t('features.theme.text')}</p>
            <Points prefix="features.theme" n={4} />
            <p className="font-semibold bg-butter border-std border-border rounded-input p-3">{t('features.theme.challenge')}</p>
            <Link to="/login?mode=signup" className={buttonClasses('primary', 'justify-self-start hover-pop', 'lg')}><PaintBrush weight="bold" size={20} />{t('features.theme.cta')}</Link>
          </div>
        </motion.section>

        {/* Made by your class: the theme story in pictures, right after the themes (owner, 2026-11-27). */}
        <ThemeGallery />

        <motion.section id="play" {...enter} aria-labelledby="play-title" className="grid gap-5 scroll-mt-24">
          <h2 id="play-title" className="title-bubble text-4xl sm:text-5xl leading-tight"><Title text={t('features.play.title')} /></h2>
          <p className="text-lg font-semibold">{t('features.play.text')}</p>
          <ul className="grid md:grid-cols-3 gap-4 list-none p-0 m-0">
            {SHOWN_MODES.map((m) => <ModeCard key={m} mode={m} />)}
          </ul>
        </motion.section>

        <motion.section id="view" {...enter} aria-labelledby="view-title" className="grid gap-5 scroll-mt-24">
          <h2 id="view-title" className="title-bubble text-4xl sm:text-5xl leading-tight"><Title text={t('features.view.title')} /></h2>
          <p className="text-lg font-semibold">{t('features.view.text')}</p>
          <ul className="grid sm:grid-cols-2 gap-4 list-none p-0 m-0">
            {([[SortAscending, 'var(--color-blue-crystal)'], [ChartBar, 'var(--color-butter)'], [Lock, 'var(--color-blush)'], [FileText, 'var(--color-mint)']] as [Icon, string][]).map(([I, bg], k) => (
              <li key={k} className={`${card} p-5 flex gap-4 items-start`} style={lift}>
                <Dot bg={bg}><I weight="bold" size={26} aria-hidden="true" /></Dot>
                <span className="grid gap-1"><b className="font-heading text-xl leading-snug">{t(`features.view.${k + 1}` as StringKey)}</b><span className="font-semibold">{t(`features.view.${k + 1}.text` as StringKey)}</span></span>
              </li>
            ))}
          </ul>
        </motion.section>

                {/* Fair play, built in (teacher, 2026-11-24: "add the no stealing as a selling
            point ... psychology first marketing"). Each line answers a weak spot the
            research found on other classroom game sites (docs/marketing-bible.md,
            the edge list); never names another site. */}
        <section id="fair" aria-labelledby="fair-title" className="grid gap-5 scroll-mt-24">
          <h2 id="fair-title" className="title-bubble text-4xl sm:text-5xl leading-tight"><Title text={t('features.fair.title')} /></h2>
          <p className="text-lg font-semibold">{t('features.fair.text')}</p>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0 m-0">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <li key={n} className={`${card} p-0`} style={lift}>
                {/* The title scans; the reason opens under the caret (owner, 2026-11-27). */}
                <details className="group p-5">
                  <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-center gap-3"><Dot bg="var(--color-mint)" size="2.5rem"><Check weight="bold" size={20} aria-hidden="true" /></Dot><b className="font-heading text-lg leading-snug flex-1">{t(`features.fair.${n}` as StringKey)}</b><Caret /></summary>
                  <p className="font-semibold mt-3 mb-0">{t(`features.fair.${n}.why` as StringKey)}</p>
                </details>
              </li>
            ))}
          </ul>
        </section>

        <Proof />

        <section aria-labelledby="more-title" className="grid gap-4">
          <h2 id="more-title" className="title-bubble text-4xl leading-tight"><Title text={t('features.moreTitle')} /></h2>
          {/* Each box opens on its own; its neighbor keeps its size (teacher, 2026-10-31). */}
          <div className="grid sm:grid-cols-2 gap-3 items-start">
            {MORE.map((g) => (
              <details key={g.key} className={`${card} group p-4 sm:p-5`}>
                <summary className="font-heading font-bold text-xl cursor-pointer min-h-10 list-none [&::-webkit-details-marker]:hidden flex items-center gap-3"><span className="flex-1">{t(`features.${g.key}` as StringKey)}</span><Caret /></summary>
                <ul className="grid gap-2 list-none p-0 mt-3 mb-0">
                  {Array.from({ length: g.items }, (_, i) => <li key={i} className="flex gap-2 font-semibold"><Check weight="bold" size={20} className="shrink-0 mt-0.5" aria-hidden="true" />{t(`features.${g.key}.${i + 1}` as StringKey)}</li>)}
                </ul>
              </details>
            ))}
          </div>
        </section>

        {/* Plus and Pro, described by what they open up (teacher, 2026-10-31). */}
        <section aria-labelledby="plans-title" className="grid gap-4">
          <h2 id="plans-title" className="title-bubble text-4xl leading-tight"><Title text={t('features.plans.title')} /></h2>
          <p className="text-lg font-semibold">{t('features.plans.text')}</p>
          <div className="grid md:grid-cols-2 gap-4">
            {(['plus', 'pro'] as const).map((plan) => (
              <div key={plan} className={`${card} p-5 grid gap-3 content-start`} style={lift}>
                <h3 className="font-heading font-bold text-2xl">{t(`features.plans.${plan}` as StringKey)}</h3>
                <p className="font-bold">{t(`pricing.${plan}.who` as StringKey)}</p>
                <PlanFeatures plan={plan} />
                <Link to="/pricing" className={buttonClasses('secondary', 'justify-self-start hover-pop')}>{t(`features.plans.see.${plan}` as StringKey)}<ArrowRight weight="bold" size={18} /></Link>
              </div>
            ))}
          </div>
          <p className="font-semibold text-sm">{t('features.plans.free')}</p>
        </section>

        <section aria-labelledby="end-title" className={`${card} p-6 sm:p-8 grid gap-4 justify-items-center text-center`} style={lift}>
          <h2 id="end-title" className="title-bubble text-4xl"><Title text={t('features.endTitle')} /></h2>
          <p className="text-lg font-semibold max-w-2xl">{t('features.endText')}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/login?mode=signup" className={buttonClasses('primary', 'hover-pop', 'lg')}><ChalkboardTeacher weight="bold" size={22} />{t('public.startFree')}</Link>
            <Link to="/pricing" className={buttonClasses('secondary', 'hover-pop', 'lg')}>{t('public.seePlans')}<ArrowRight weight="bold" size={20} /></Link>
          </div>
        </section>
      </main>
      <div className="h-12" />
      <PublicFooter />
    </div>
  );
}

function Dot({ children, bg, size = '3.25rem' }: { children: ReactNode; bg: string; size?: string }) {
  return <span className="shrink-0 rounded-full border-std border-border grid place-items-center" style={{ width: size, height: size, background: bg }}>{children}</span>;
}

function Points({ prefix, n }: { prefix: string; n: number }) {
  return (
    <ul className="grid gap-3 list-none p-0 m-0">
      {Array.from({ length: n }, (_, i) => (
        <li key={i} className="flex gap-3">
          <Check weight="bold" size={22} className="shrink-0 mt-1" aria-hidden="true" />
          <span><span className="font-heading font-bold text-lg block">{t(`${prefix}.${i + 1}` as StringKey)}</span><span className="font-semibold">{t(`${prefix}.${i + 1}.text` as StringKey)}</span></span>
        </li>
      ))}
    </ul>
  );
}

// The real games: pick one, and its live picture cycles every theme it can
// wear, the visitor's own Theme Builder themes included.
function GamesShowcase() {
  const { themes: made } = useMadeThemes();
  const [id, setId] = useState(GAMES[0].id);
  const game = GAMES.find((g) => g.id === id) ?? GAMES[0];
  const looks = useMemo(() => showcaseThemes(game.id, made), [game.id, made]);
  return (
    <section id="games" aria-labelledby="games-title" className={`${card} p-4 sm:p-6 lg:p-8 grid gap-5 lg:gap-x-8 items-start scroll-mt-24 [grid-template-areas:'head'_'pic'_'list'_'info'] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-[auto_auto_1fr] lg:[grid-template-areas:'head_pic'_'list_pic'_'list_info']`} style={lift}>
      {/* Phones and iPads see the picture right under the title, before the game list. */}
      <div className="grid gap-4 content-start [grid-area:head]">
        <h2 id="games-title" className="title-bubble text-4xl sm:text-5xl leading-tight"><Title text={t('features.games.title')} /></h2>
        <p className="text-lg font-semibold">{t('features.games.text')}</p>
      </div>
      <div role="group" aria-label={t('features.games.pick')} className="grid grid-cols-4 gap-2 sm:gap-3 content-start [grid-area:list]">
          {GAMES.map((g) => {
            const on = g.id === game.id;
            return (
              <button key={g.id} type="button" aria-pressed={on} onClick={() => setId(g.id)}
                className={`group rounded-input border-std border-border p-1 grid gap-1 content-start text-center motion-safe:transition ${on ? 'bg-butter ring-[3px] ring-ink' : 'bg-white hover:bg-surface-hover'}`}>
                <span className="block overflow-hidden rounded-[0.6rem] border border-border motion-safe:transition-transform group-hover:scale-[1.03]" aria-hidden="true"><GameCover gameId={g.id} className="aspect-[4/3]" /></span>
                <span className="font-bold text-xs sm:text-sm leading-tight min-h-[2.5em] grid place-items-center">{g.name}</span>
              </button>
            );
          })}
      </div>
      <ThemeCycler gameId={game.id} gameName={game.name} looks={looks} className="min-w-0 [grid-area:pic]" />
      <div className="grid gap-3 min-w-0 [grid-area:info]">
          <p className="text-lg font-bold"><span className="font-heading">{game.name}:</span> {game.tagline}</p>
          <div className="flex flex-wrap gap-2">{shownModes(game.modes).map((m) => <ModeBadge key={m} mode={m} />)}</div>
          <p className="flex flex-wrap gap-x-5 gap-y-2 font-bold">
            <Link to={`/blog/how-to-play/${game.id}`} className="inline-flex items-center gap-1.5 text-text underline underline-offset-4">{t('features.games.howTo')}<ArrowRight weight="bold" size={16} /></Link>
            <Link to={`/blog/themes/${game.id}`} className="inline-flex items-center gap-1.5 text-text underline underline-offset-4">{t('features.games.guide')}<ArrowRight weight="bold" size={16} /></Link>
            <Link to="/themes" className="inline-flex items-center gap-1.5 text-text underline underline-offset-4">{t('themes.seeAll')}<ArrowRight weight="bold" size={16} /></Link>
          </p>
      </div>
    </section>
  );
}

// Try a question: a real-looking question card with supports to switch on.
function QuestionDemo() {
  const { settings } = useSettings();
  const reduce = useReducedMotion();
  const [picked, setPicked] = useState<number | null>(null);
  const [big, setBig] = useState(false);
  const [calm, setCalm] = useState(false);
  const prompt = t('features.demo.q');
  const choices = ['1/4', '4/1', '1/2', '3/4'];
  const right = 0;
  const tiles = calm ? ['bg-surface-2', 'bg-surface-2', 'bg-surface-2', 'bg-surface-2'] : ['bg-butter', 'bg-mint-soft', 'bg-quiz-blue', 'bg-blush'];
  const toggle = 'min-h-11 px-3 rounded-pill border-std border-border font-bold text-sm inline-flex items-center gap-1.5';
  return (
    <div className={`${card} p-5 grid gap-4`} style={lift}>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('features.demo.supports')}>
        <span className="font-bold text-sm">{t('features.demo.supports')}</span>
        <button type="button" className={`${toggle} bg-white`} onClick={() => speak(`${prompt}. ${choices.map((c, i) => `${'ABCD'[i]}: ${c}`).join('. ')}`, settings)}><SpeakerHigh weight="bold" size={18} />{t('q.listen')}</button>
        <button type="button" aria-pressed={big} className={`${toggle} ${big ? 'bg-butter' : 'bg-white'}`} onClick={() => setBig(!big)}><TextAa weight="bold" size={18} />{t('features.demo.big')}</button>
        <button type="button" aria-pressed={calm} className={`${toggle} ${calm ? 'bg-butter' : 'bg-white'}`} onClick={() => setCalm(!calm)}><Leaf weight="bold" size={18} />{t('features.demo.calm')}</button>
      </div>
      <span className="justify-self-start text-xs font-bold px-2 py-1 rounded-pill border-std border-border bg-white">3.NF.1</span>
      <p className={`font-body font-bold leading-snug ${big ? 'text-3xl' : 'text-2xl'}`}>{prompt}</p>
      <div className="grid grid-cols-2 gap-3">
        {choices.map((c, i) => {
          const isPicked = picked === i, ok = isPicked && i === right, no = isPicked && i !== right;
          return (
            <motion.button key={c} type="button" onClick={() => setPicked(i)}
              animate={reduce || calm ? undefined : no ? { x: [0, -6, 6, -4, 4, 0] } : ok ? { scale: [1, 1.06, 1] } : undefined}
              className={`min-h-16 px-3 rounded-input border-bold border-border font-bold flex items-center gap-2 ${tiles[i]} ${big ? 'text-2xl' : 'text-lg'} ${ok ? 'ring-4 ring-success' : ''} ${no ? 'ring-4 ring-danger' : ''}`}
              style={{ boxShadow: 'var(--shadow-sticker)' }}>
              <span className="w-9 h-9 shrink-0 rounded-full bg-surface border-std border-border flex items-center justify-center font-display">{ok ? <Check weight="bold" size={18} /> : no ? <X weight="bold" size={18} /> : 'ABCD'[i]}</span><span className="sr-only"> </span>{c}
            </motion.button>
          );
        })}
      </div>
      <p className="min-h-7 font-heading font-bold text-xl text-center flex items-center justify-center gap-2" role="status" aria-live="polite">
        {picked === null ? t('features.demo.tryIt') : picked === right ? <><Star weight="fill" size={24} color="#fabe37" aria-hidden="true" />{t('features.demo.right')}</> : t('features.demo.again')}
      </p>
    </div>
  );
}

// Try a theme: pick a game, a background and a board color, and the game's
// real picture redraws from that theme, the same way the Theme Builder's
// colors do (people value what they have touched; teacher, 2026-10-25).
const TRY_GAMES: { id: string; pieces: string[] }[] = [
  { id: 'game-show', pieces: ['card-back', 'square'] },
  { id: 'match-three', pieces: ['board'] },
  { id: 'four-in-a-row', pieces: ['board'] },
  { id: 'bubble-pop', pieces: ['board'] },
  { id: 'bowling', pieces: ['lane'] },
];
// Palette colors only (Classic Art Director, 2026-11-26).
export const GROUNDS: [string, string][] = [['mint', '#c8f0dc'], ['sky', '#bfdff3'], ['blush', '#ffd3e6'], ['butter', '#fff1b8'], ['night', '#1d1a33'], ['kelly', '#22b04a']];
export const PIECES: [string, string][] = [['pink', '#f055a5'], ['yellow', '#fabe37'], ['blue', '#4ba3e8'], ['orange', '#ff9b28'], ['grape', '#6a45f0'], ['white', '#fffaf0']];

function LookDemo() {
  const [gameId, setGameId] = useState(TRY_GAMES[0].id);
  const [ground, setGround] = useState(0);
  const [piece, setPiece] = useState(0);
  const spec = TRY_GAMES.find((g) => g.id === gameId)!;
  const theme = useMemo<GameTheme>(() => {
    const base = classicTheme(gameId);
    const [, bg] = GROUNDS[ground], [, pc] = PIECES[piece];
    const dark = bg === '#2b2462' || bg === '#22b04a';
    return { ...base, id: `try:${gameId}`, name: t('features.try.name'), source: 'custom', backdrop: { kind: 'color' }, colors: { ...base.colors, background: bg, backgroundText: dark ? '#ffffff' : '#1d1a33' }, pieces: { ...base.pieces, ...Object.fromEntries(spec.pieces.map((p) => [p, { color: pc }])) } };
  }, [gameId, ground, piece, spec]);
  const name = (id: string) => GAMES.find((g) => g.id === id)?.name ?? id;
  const chip = (on: boolean) => `min-h-11 px-3 rounded-pill border-std border-border font-bold text-sm ${on ? 'bg-butter ring-[3px] ring-ink' : 'bg-white hover:bg-surface-hover'}`;
  return (
    <div className={`${card} p-4 sm:p-5 grid gap-4`} style={lift}>
      <h3 className="font-heading font-bold text-2xl leading-tight">{t('features.try.title')}</h3>
      <div className="overflow-hidden rounded-[1.25rem] border-bold border-border" role="img" aria-label={t('features.cycle.picture', { game: name(gameId), theme: t('features.try.name') })}>
        <GameScene theme={theme} />
      </div>
      <div role="group" aria-label={t('features.try.game')} className="flex flex-wrap gap-2">
        {TRY_GAMES.map((g) => <button key={g.id} type="button" aria-pressed={g.id === gameId} onClick={() => setGameId(g.id)} className={chip(g.id === gameId)}>{name(g.id)}</button>)}
      </div>
      <Swatches label={t('features.try.ground')} list={GROUNDS} at={ground} set={setGround} />
      <Swatches label={t('features.try.pieces')} list={PIECES} at={piece} set={setPiece} />
      <p className="font-semibold text-sm">{t('features.try.more')}</p>
    </div>
  );
}

function Swatches({ label, list, at, set }: { label: string; list: [string, string][]; at: number; set: (n: number) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap items-center gap-2">
      <span className="font-bold text-sm w-full sm:w-auto sm:min-w-[8.5rem]">{label}</span>
      {list.map(([id, hex], k) => (
        <button key={id} type="button" role="radio" aria-checked={k === at} aria-label={t(`features.color.${id}` as StringKey)} onClick={() => set(k)}
          className={`w-11 h-11 rounded-full border-std border-border grid place-items-center motion-safe:transition-transform hover:scale-105 ${k === at ? 'ring-[3px] ring-offset-2 ring-ink' : ''}`} style={{ background: hex }}>
          {k === at && <Check weight="bold" size={18} color={hex === '#1d1a33' || hex === '#6a45f0' || hex === '#22b04a' ? '#ffffff' : '#1d1a33'} aria-hidden="true" />}
        </button>
      ))}
    </div>
  );
}

// A way to play: its own pastel and icon (New direction rule 12), what it is,
// when it fits, and the games that play that way.
function ModeCard({ mode }: { mode: PlayMode }) {
  const I = MODE_ICONS[mode];
  const games = GAMES.filter((g) => shownModes(g.modes).includes(mode)).map((g) => g.name).join(', ');
  return (
    <li className={`${card} overflow-hidden grid content-start`} style={lift}>
      <span className="flex items-center gap-3 px-5 py-4 border-b-2 border-border" style={{ background: MODE_COLORS[mode] }}>
        <Dot bg={MODE_BRIGHT[mode]}><I weight="bold" size={26} aria-hidden="true" /></Dot>
        <h3 className="title-bubble text-3xl">{t(`mode.${mode}` as StringKey)}</h3>
      </span>
      <span className="p-5 grid gap-3">
        <span className="font-semibold">{t(`features.mode.${mode}` as StringKey)}</span>
        <span className="font-bold">{t(`features.mode.${mode}.best` as StringKey)}</span>
        <span className="text-sm font-semibold text-muted">{t('features.play.games', { games })}</span>
      </span>
    </li>
  );
}

// Proof: the research behind the design, in the Home page's own approved words.
function Proof() {
  return (
    <section aria-labelledby="proof-title" className="grid gap-5">
      <h2 id="proof-title" className="title-bubble text-4xl sm:text-5xl leading-tight"><Title text={t('features.proof.title')} /></h2>
      <div className="grid lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] gap-4">
        <div className="bg-butter border-bold border-border rounded-panel p-6 grid gap-2 content-center" style={lift}>
          <span className="title-bubble text-7xl leading-none">{t('public.why.practice.stat')}</span>
          <b className="font-heading text-xl">{t('public.why.practice.statLabel')}</b>
          <span className="font-semibold">{t('public.why.practice.text')}</span>
        </div>
        <ul className="grid sm:grid-cols-2 gap-4 list-none p-0 m-0">
          {(['mistakes', 'together', 'support', 'udl'] as const).map((k) => (
            <li key={k} className={`${card} p-5 grid gap-1 content-start`} style={lift}>
              <b className="font-heading text-lg leading-snug">{t(`public.why.${k}` as StringKey)}</b>
              <span className="font-semibold">{t(`public.why.${k}.text` as StringKey)}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="flex flex-wrap items-center gap-x-5 gap-y-2 font-semibold text-sm">
        <span>{t('public.whyNote')}</span>
        <Link to="/research" className="inline-flex items-center gap-1.5 font-bold text-base text-text underline underline-offset-4">{t('features.proof.link')}<ArrowRight weight="bold" size={16} /></Link>
      </p>
    </section>
  );
}
