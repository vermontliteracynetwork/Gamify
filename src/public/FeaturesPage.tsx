import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Brain, Check, ChalkboardTeacher, GameController, PaintBrush, Sparkle, SpeakerHigh, Star, TextAa, Leaf, X } from '@phosphor-icons/react';
import { ALL_MODES, type PlayMode } from '../data/types';
import { speak } from '../engine/feedback';
import { GameCover } from '../games/covers';
import { ModeBadge } from '../games/ModeBadge';
import { GAMES } from '../games/registry';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { useSettings } from '../settings/SettingsContext';
import ThemePreview from '../theme/builder/ThemePreview';
import { STARTER_THEMES } from '../theme/starters';
import { buttonClasses } from '../ui/kit';
import Title from '../ui/Title';
import PublicFooter from './PublicFooter';

// The Features page (teacher, 2026-10-25): three pillars, each with
// something to try, because people value what they have touched. Gamified
// learning (try a question with supports on), theme creation (re-skin a game
// for different ages; the reason to subscribe) and game play (the four ways
// to play). Benefits lead, details follow, and every section ends with one
// clear next step. The full feature list sits folded at the bottom.
const PILLARS = [
  { id: 'learning', icon: Brain },
  { id: 'themes', icon: PaintBrush },
  { id: 'play', icon: GameController },
] as const;
const MORE: { key: string; items: number }[] = [
  { key: 'sets', items: 5 }, { key: 'classes', items: 7 }, { key: 'supports', items: 6 }, { key: 'safety', items: 5 },
];
const card = 'bg-surface border-[2.5px] border-border rounded-panel';

export default function FeaturesPage() {
  const reduce = useReducedMotion();
  const enter = { initial: reduce ? false : { opacity: 0, y: 18 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.2 } } as const;
  return (
    <>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 grid gap-14">
        <section className="grid gap-5">
          <h1 className="title-bubble text-5xl sm:text-6xl"><Title text={t('features.title')} /></h1>
          <p className="text-xl font-bold max-w-3xl">{t('features.sub')}</p>
          <nav aria-label={t('features.jump')} className="grid sm:grid-cols-3 gap-3">
            {PILLARS.map(({ id, icon: I }, i) => (
              <motion.a key={id} href={`#${id}`} initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduce ? 0 : i * 0.08 }}
                className={`${card} hover-lift p-5 grid gap-2 no-underline text-text ${id === 'themes' ? '!bg-accent' : ''}`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
                <span className="w-14 h-14 rounded-full bg-surface border-[2.5px] border-border flex items-center justify-center wiggle-on-hover"><I weight="fill" size={30} aria-hidden="true" /></span>
                <span className="font-display text-2xl">{t(`features.p.${id}` as StringKey)}</span>
                <span className="font-semibold">{t(`features.p.${id}.short` as StringKey)}</span>
              </motion.a>
            ))}
          </nav>
        </section>

        <motion.section id="learning" {...enter} aria-labelledby="learning-title" className="grid lg:grid-cols-2 gap-6 items-center scroll-mt-24">
          <div className="grid gap-4">
            <p className="font-bold uppercase tracking-wider text-sm">{t('features.p.learning')}</p>
            <h2 id="learning-title" className="title-bubble text-4xl sm:text-5xl leading-tight"><Title text={t('features.learn.title')} /></h2>
            <p className="text-lg font-semibold">{t('features.learn.text')}</p>
            <Points prefix="features.learn" n={4} />
          </div>
          <QuestionDemo />
        </motion.section>

        <motion.section id="themes" {...enter} aria-labelledby="themes-title" className={`${card} !bg-accent p-5 sm:p-8 grid lg:grid-cols-2 gap-6 items-center scroll-mt-24`} style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
          <ThemeDemo />
          <div className="grid gap-4">
            <p className="font-bold uppercase tracking-wider text-sm">{t('features.p.themes')}</p>
            <h2 id="themes-title" className="title-bubble text-4xl sm:text-5xl leading-tight"><Title text={t('features.theme.title')} /></h2>
            <p className="text-lg font-semibold">{t('features.theme.text')}</p>
            <Points prefix="features.theme" n={4} />
            <p className="font-bold bg-surface border-[2px] border-border rounded-input p-3 flex gap-2"><Sparkle weight="fill" size={22} className="shrink-0" aria-hidden="true" />{t('features.theme.challenge')}</p>
            <Link to="/login?mode=signup" className={buttonClasses('primary', 'justify-self-start min-h-14 px-7 text-lg hover-pop !bg-text !text-white')}><PaintBrush weight="bold" size={20} />{t('features.theme.cta')}</Link>
          </div>
        </motion.section>

        <motion.section id="play" {...enter} aria-labelledby="play-title" className="grid gap-5 scroll-mt-24">
          <p className="font-bold uppercase tracking-wider text-sm">{t('features.p.play')}</p>
          <h2 id="play-title" className="title-bubble text-4xl sm:text-5xl leading-tight"><Title text={t('features.play.title')} /></h2>
          <p className="text-lg font-semibold max-w-3xl">{t('features.play.text')}</p>
          <ModesDemo />
        </motion.section>

        <section aria-labelledby="more-title" className="grid gap-4">
          <h2 id="more-title" className="font-display text-3xl"><Title text={t('features.moreTitle')} /></h2>
          {/* Each box opens on its own; its neighbor keeps its size (teacher, 2026-10-31). */}
          <div className="grid sm:grid-cols-2 gap-3 items-start">
            {MORE.map((g) => (
              <details key={g.key} className={`${card} p-4`}>
                <summary className="font-display text-2xl cursor-pointer">{t(`features.${g.key}` as StringKey)}</summary>
                <ul className="grid gap-2 list-none p-0 mt-3 mb-0">
                  {Array.from({ length: g.items }, (_, i) => <li key={i} className="flex gap-2 font-semibold"><Check weight="bold" size={20} className="shrink-0 mt-0.5" aria-hidden="true" />{t(`features.${g.key}.${i + 1}` as StringKey)}</li>)}
                </ul>
              </details>
            ))}
          </div>
        </section>

        {/* Plus and Pro, described by what they open up (teacher, 2026-10-31). */}
        <section aria-labelledby="plans-title" className="grid gap-4">
          <h2 id="plans-title" className="title-bubble text-4xl"><Title text={t('features.plans.title')} /></h2>
          <p className="text-lg font-semibold max-w-3xl">{t('features.plans.text')}</p>
          <div className="grid md:grid-cols-2 gap-4">
            {(['plus', 'pro'] as const).map((plan) => (
              <div key={plan} className={`${card} p-5 grid gap-3 content-start`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
                <h3 className="font-display text-3xl">{t(`features.plans.${plan}` as StringKey)}</h3>
                <p className="font-bold">{t(`pricing.${plan}.who` as StringKey)}</p>
                <ul className="grid gap-2 list-none p-0 m-0">
                  {[1, 2, 3, 4].map((i) => <li key={i} className="flex gap-2 font-semibold"><Check weight="bold" size={20} className="shrink-0 mt-0.5" aria-hidden="true" />{t(`upgrade.${plan}.${i}` as StringKey)}</li>)}
                </ul>
                <Link to="/pricing" className={buttonClasses(plan === 'plus' ? 'primary' : 'secondary', 'justify-self-start hover-pop')}>{t(`features.plans.see.${plan}` as StringKey)}<ArrowRight weight="bold" size={18} /></Link>
              </div>
            ))}
          </div>
          <p className="font-semibold text-sm">{t('features.plans.free')}</p>
        </section>

        <section className={`${card} p-6 sm:p-8 grid gap-4 justify-items-center text-center`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
          <h2 className="title-bubble text-4xl"><Title text={t('features.endTitle')} /></h2>
          <p className="text-lg font-semibold max-w-2xl">{t('features.endText')}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/login?mode=signup" className={buttonClasses('primary', 'min-h-14 px-7 text-lg hover-pop')}><ChalkboardTeacher weight="bold" size={22} />{t('public.startFree')}</Link>
            <Link to="/pricing" className={buttonClasses('secondary', 'min-h-14 px-7 text-lg hover-pop')}>{t('public.seePlans')}<ArrowRight weight="bold" size={20} /></Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}

function Points({ prefix, n }: { prefix: string; n: number }) {
  return (
    <ul className="grid gap-3 list-none p-0 m-0">
      {Array.from({ length: n }, (_, i) => (
        <li key={i} className="flex gap-3">
          <Check weight="bold" size={22} className="shrink-0 mt-1" aria-hidden="true" />
          <span><span className="font-display text-xl block">{t(`${prefix}.${i + 1}` as StringKey)}</span><span className="font-semibold">{t(`${prefix}.${i + 1}.text` as StringKey)}</span></span>
        </li>
      ))}
    </ul>
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
  const tiles = calm ? ['bg-surface-2', 'bg-surface-2', 'bg-surface-2', 'bg-surface-2'] : ['bg-[#fdfd94]', 'bg-[#d9f5d0]', 'bg-[#d6e4ff]', 'bg-[#ffd9cf]'];
  const toggle = 'min-h-11 px-3 rounded-pill border-[2px] border-border font-bold text-sm inline-flex items-center gap-1.5';
  return (
    <div className={`${card} p-5 grid gap-4`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('features.demo.supports')}>
        <span className="font-bold text-sm">{t('features.demo.supports')}</span>
        <button type="button" className={`${toggle} bg-surface-2`} onClick={() => speak(`${prompt}. ${choices.map((c, i) => `${'ABCD'[i]}: ${c}`).join('. ')}`, settings)}><SpeakerHigh weight="bold" size={18} />{t('q.listen')}</button>
        <button type="button" aria-pressed={big} className={`${toggle} ${big ? 'bg-accent' : 'bg-surface-2'}`} onClick={() => setBig(!big)}><TextAa weight="bold" size={18} />{t('features.demo.big')}</button>
        <button type="button" aria-pressed={calm} className={`${toggle} ${calm ? 'bg-accent' : 'bg-surface-2'}`} onClick={() => setCalm(!calm)}><Leaf weight="bold" size={18} />{t('features.demo.calm')}</button>
      </div>
      <span className="justify-self-start text-xs font-bold px-2 py-1 rounded-pill border-[2px] border-border bg-surface-2">3.NF.1</span>
      <p className={`font-body font-bold leading-snug ${big ? 'text-3xl' : 'text-2xl'}`}>{prompt}</p>
      <div className="grid grid-cols-2 gap-3">
        {choices.map((c, i) => {
          const isPicked = picked === i, ok = isPicked && i === right, no = isPicked && i !== right;
          return (
            <motion.button key={c} type="button" onClick={() => setPicked(i)}
              animate={reduce || calm ? undefined : no ? { x: [0, -6, 6, -4, 4, 0] } : ok ? { scale: [1, 1.06, 1] } : undefined}
              className={`min-h-16 px-3 rounded-input border-[2.5px] border-border font-bold flex items-center gap-2 ${tiles[i]} ${big ? 'text-2xl' : 'text-lg'} ${ok ? 'ring-4 ring-success' : ''} ${no ? 'ring-4 ring-danger' : ''}`}
              style={{ boxShadow: 'var(--shadow-sticker)' }}>
              <span className="w-9 h-9 shrink-0 rounded-full bg-surface border-[2px] border-border flex items-center justify-center font-display">{ok ? <Check weight="bold" size={18} /> : no ? <X weight="bold" size={18} /> : 'ABCD'[i]}</span><span className="sr-only"> </span>{c}
            </motion.button>
          );
        })}
      </div>
      <p className="min-h-7 font-display text-xl text-center flex items-center justify-center gap-2" role="status" aria-live="polite">
        {picked === null ? t('features.demo.tryIt') : picked === right ? <><Star weight="fill" size={24} color="#f6c544" aria-hidden="true" />{t('features.demo.right')}</> : t('features.demo.again')}
      </p>
    </div>
  );
}

function ThemeDemo() {
  const samples = STARTER_THEMES.filter((x) => x.gameId === 'game-show').sort((a, b) => a.order - b.order);
  const [pick, setPick] = useState('ocean');
  const sample = samples.find((s) => s.id === pick)!;
  return (
    <div className="grid gap-3">
      <ThemePreview theme={sample.theme} gameName={t('features.demo.gameName')} />
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('features.demo.pickTheme')}>
        {samples.map((s) => (
          <button key={s.id} type="button" role="radio" aria-checked={pick === s.id} onClick={() => setPick(s.id)}
            className={`min-h-12 px-3 rounded-input border-[2px] border-border text-left ${pick === s.id ? 'bg-text text-white' : 'bg-surface'}`}>
            <span className="block font-bold text-sm leading-tight">{s.name}</span>
            <span className="block text-xs font-semibold opacity-80">{t(`features.band.${s.band}` as StringKey)}</span>
          </button>
        ))}
      </div>
      <p className="text-xs font-bold">{t('features.demo.samples')} <Link to="/themes">{t('themes.seeAll')}</Link></p>
    </div>
  );
}

// The four ways to play as tabs, with the games that play each way.
function ModesDemo() {
  const [mode, setMode] = useState<PlayMode>('share');
  const games = GAMES.filter((g) => g.modes.includes(mode));
  return (
    <div className={`${card} p-5 grid gap-4`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
      <div role="tablist" aria-label={t('features.play.modes')} className="flex flex-wrap gap-2">
        {ALL_MODES.map((m) => (
          <button key={m} type="button" role="tab" id={`mode-${m}`} aria-controls="mode-panel" aria-selected={mode === m} onClick={() => setMode(m)}
            className={`min-h-12 px-4 rounded-pill border-[2px] font-display text-lg ${mode === m ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}>{t(`mode.${m}` as StringKey)}</button>
        ))}
      </div>
      <div id="mode-panel" role="tabpanel" aria-labelledby={`mode-${mode}`} className="grid md:grid-cols-[1fr_1.4fr] gap-5 items-start">
        <div className="grid gap-3">
          <ModeBadge mode={mode} withHint />
          <p className="text-lg font-semibold">{t(`features.mode.${mode}` as StringKey)}</p>
          <p className="font-bold bg-surface-2 border-[2px] border-border-soft rounded-input p-3">{t(`features.mode.${mode}.best` as StringKey)}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {games.map((g) => (
            <Link key={g.id} to="/login?mode=signup" className="hover-lift rounded-input border-[2px] border-border overflow-hidden bg-surface no-underline text-text">
              <GameCover gameId={g.id} className="aspect-[4/3] cover-zoom" />
              <span className="block px-2 py-1 font-bold text-sm">{g.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
