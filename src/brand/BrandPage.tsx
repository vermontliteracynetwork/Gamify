import { useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowLeft, ArrowRight, Check, CornersOut, GearSix, Lightning, PersonArmsSpread, Play, SpeakerHigh, Star, Timer, X } from '@phosphor-icons/react';
import ScoreBoard from '../engine/ScoreBoard';
import { TeamBadge } from '../engine/TeamBadge';
import { startTurns } from '../engine/turns';

import { ModeBadge, SHOWN_MODES } from '../games/ModeBadge';
import { LabPowerCard } from '../lab/LabGame';
import { makeSfx } from '../lab/sfx';
import { useSettings } from '../settings/SettingsContext';
import { playClip } from '../engine/music';
import { Button, Tabs } from '../ui/kit';
import PopText from '../ui/PopText';
import Title from '../ui/Title';
import NewDirection from './NewDirection';
import UniversalViews from './UniversalViews';
import GameComponents from './GameComponents';
import IconSet from './IconSet';
import GameMockups from './GameMockups';
import Stickers from './Stickers';
import TeacherPortal from './TeacherPortal';
import PublicPages from './PublicPages';
import MoreScreens from './MoreScreens';
import Coverage, { type BrandTab } from './Coverage';
import ScrapbookDirection from './ScrapbookDirection';

// The Brand page (preview, teacher 2026-11-23): the brand kit shown live, with
// the real colors, type, parts, motion and every sound, so it can be approved
// by looking and listening. Mirrors the "Gamify Brand Kit" doc.

const COLORS: [string, string, string][] = [
  ['Periwinkle', '#b4c4fb', 'Ground'], ['Off-white', '#fbfcf8', 'Panels'], ['Black', '#000000', 'Outlines and text'],
  ['Pale yellow', '#fdfd94', 'The pick, main button'], ['Salmon', '#ed9d75', 'Warm second'], ['Coral', '#e5635f', 'Alert, delete'],
  ['Navy', '#241c3d', 'Dark stage, overlays'], ['Mint', '#9fe7a0', 'Right, done'], ['Gold', '#f6c544', 'Rewards'], ['Ink blue', '#314677', 'Quiet text'],
];
const ICONS: [string, ReactNode][] = [
  ['Play, start', <Play key="p" weight="fill" />], ['Settings', <GearSix key="g" weight="bold" />], ['Full screen', <CornersOut key="c" weight="bold" />],
  ['Accessibility', <PersonArmsSpread key="a" weight="bold" />], ['Listen', <SpeakerHigh key="s" weight="bold" />], ['Close', <X key="x" weight="bold" />],
  ['Back', <ArrowLeft key="l" weight="bold" />], ['Next', <ArrowRight key="r" weight="bold" />], ['Points', <Star key="st" weight="fill" />],
  ['Power-up', <Lightning key="li" weight="fill" />], ['Timer', <Timer key="t" weight="bold" />], ['Right', <Check key="ch" weight="bold" />],
];
const PATTERNS: [string, string][] = [
  ['Confetti dots', 'radial-gradient(circle at 25% 25%, rgba(36,28,61,0.12) 2.5px, transparent 3px), radial-gradient(circle at 75% 70%, rgba(36,28,61,0.12) 2px, transparent 2.5px)'],
  ['Soft wave', 'repeating-radial-gradient(circle at 0 100%, transparent 0 14px, rgba(36,28,61,0.09) 14px 16px)'],
  ['Tiny stars', 'radial-gradient(circle, rgba(36,28,61,0.12) 1.5px, transparent 2px)'],
  ['Checker', 'conic-gradient(rgba(36,28,61,0.08) 25%, transparent 0 50%, rgba(36,28,61,0.08) 0 75%, transparent 0)'],
];

export default function BrandPage() {
  // ?tab= opens a tab directly; the Approval list jumps to a tab and its view.
  const [tab, setTab] = useState<BrandTab>(() => (new URLSearchParams(window.location.search).get('tab') as BrandTab | null) ?? 'style');
  const go = (t: BrandTab, anchor?: string) => { setTab(t); window.setTimeout(() => { const el = anchor ? document.getElementById(anchor) : null; if (el) el.scrollIntoView({ block: 'start' }); else window.scrollTo(0, 0); }, 60); };
  return (
    <div className="brand-menu min-h-[calc(100dvh-4rem)]">
      <main className="max-w-[84rem] mx-auto px-4 sm:px-8 pt-6 pb-16 grid gap-6">
        <header className="grid gap-1">
          <h1 className="title-bubble text-4xl" style={{ color: 'var(--text)' }}><Title text="Brand Kit" /></h1>
          <p className="font-semibold text-muted">The Gamify look, motion and sound. Approved and live on the site.</p>
        </header>
        <div><Tabs label="Brand kit" value={tab} onChange={setTab} className="mb-0" options={[{ id: 'style', label: 'Style sheet' }, { id: 'sounds', label: 'Sound board' }, { id: 'direction', label: 'New direction' }, { id: 'scrapbook', label: 'Scrapbook' }, { id: 'views', label: 'Universal views' }, { id: 'components', label: 'Game components' }, { id: 'games', label: 'Game mockups' }, { id: 'stickers', label: 'Stickers' }, { id: 'icons', label: 'Icons' }, { id: 'teacher', label: 'Teacher portal' }, { id: 'public', label: 'Public pages' }, { id: 'more', label: 'More screens' }, { id: 'approval', label: 'Approval' }]} /></div>
        {tab === 'style' ? <StyleSheet /> : tab === 'sounds' ? <SoundBoard /> : tab === 'views' ? <UniversalViews /> : tab === 'components' ? <GameComponents /> : tab === 'games' ? <GameMockups /> : tab === 'stickers' ? <Stickers /> : tab === 'icons' ? <IconSet /> : tab === 'teacher' ? <TeacherPortal /> : tab === 'public' ? <PublicPages /> : tab === 'more' ? <MoreScreens /> : tab === 'approval' ? <Coverage onGo={go} /> : tab === 'scrapbook' ? <ScrapbookDirection /> : <NewDirection />}
      </main>
    </div>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="grid gap-3">
      <div><h2 className="font-heading text-xl">{title}</h2>{note && <p className="text-sm font-semibold text-muted">{note}</p>}</div>
      {children}
    </section>
  );
}

function StyleSheet() {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const sfx = useMemo(() => makeSfx(settings), [settings]);
  const [demo, setDemo] = useState(0);
  const [hop, setHop] = useState(0);
  const [flip, setFlip] = useState(false);
  const [count, setCount] = useState(0);
  const [msg, setMsg] = useState<number | null>(null);
  const [card, setCard] = useState(false);
  const turns = useMemo(() => startTurns([
    { id: 'a', name: 'Cosmic Waffle', kind: 'team', colorIndex: 0, score: 12 },
    { id: 'b', name: 'Wiggly Penguin', kind: 'team', colorIndex: 1, score: 9 },
    { id: 'c', name: 'Turbo Unicorn', kind: 'team', colorIndex: 2, score: 15 },
  ]), []);
  return (
    <div className="grid gap-10">
      <Section title="Colors" note="Every menu and every Classic theme uses only these, plus a light tint and a dark shade of each.">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-3">
          {COLORS.map(([name, hex, role]) => (
            <div key={hex} className="rounded-panel border-bold border-border bg-surface overflow-hidden" style={{ boxShadow: 'var(--shadow-sticker)' }}>
              <div className="h-20 border-b-[2.5px] border-border" style={{ background: hex }} />
              <div className="p-3 grid"><span className="font-bold">{name}</span><span className="text-sm font-mono">{hex}</span><span className="text-xs font-semibold text-muted">{role}</span></div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Type" note="Three fonts only, on the site and in every Classic theme.">
        <div className="rounded-panel border-bold border-border bg-surface p-6 grid gap-4" style={{ boxShadow: 'var(--shadow-sticker)' }}>
          <div><p className="text-xs font-bold uppercase tracking-wider text-muted">Grow Year: titles, scores, big messages</p><p className="font-display text-5xl">Three in a row!</p></div>
          <div><p className="text-xs font-bold uppercase tracking-wider text-muted">Inclusive Sans bold: headings and buttons</p><p className="font-heading font-bold text-2xl">Pick your question set</p></div>
          <div><p className="text-xs font-bold uppercase tracking-wider text-muted">Inclusive Sans: body text</p><p className="text-lg max-w-prose">Answer the question, then tap the board to make your move. Right answers can bring a surprise power-up.</p></div>
        </div>
      </Section>

      <Section title="Buttons" note="Hover lifts a little; press squashes. Tap the gray one: it can't be used yet, so it blips.">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" size="lg"><Play weight="fill" size={20} />Set up and play</Button>
          <Button variant="primary">Next</Button>
          <Button>Back</Button>
          <Button variant="danger">Delete</Button>
          <Button disabled>Not yet</Button>
          {[<GearSix key="1" weight="bold" size={22} />, <CornersOut key="2" weight="bold" size={22} />, <PersonArmsSpread key="3" weight="bold" size={22} />].map((ic, i) => (
            <button key={i} type="button" className="w-12 h-12 rounded-full border-bold border-border bg-surface flex items-center justify-center motion-safe:hover:scale-105 motion-safe:transition-transform active:scale-95" style={{ boxShadow: 'var(--shadow-sticker)' }} aria-label="Corner button">{ic}</button>
          ))}
        </div>
      </Section>

      <Section title="Outlines and shading" note="Black outlines in three weights; a flat sticker shadow on things you tap; a soft shadow only under floating panels.">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-4">
          {[['2px', 'border-std', 'Buttons, chips'], ['2.5px', 'border-bold', 'Cards, boards'], ['3px', 'border-heavy', 'Game frames']].map(([w, cls, use]) => (
            <div key={w} className={`rounded-panel ${cls} border-border bg-surface p-4 motion-safe:hover:-translate-y-0.5 motion-safe:transition-transform`} style={{ boxShadow: 'var(--shadow-sticker)' }}><span className="font-display text-3xl">{w}</span><p className="text-sm font-semibold text-muted">{use}</p></div>
          ))}
          <div className="rounded-panel border-std border-border-soft bg-white p-4" style={{ boxShadow: '0 3px 0 rgba(36,28,61,0.14), 0 12px 24px rgba(36,28,61,0.10)' }}><span className="font-display text-3xl">Soft</span><p className="text-sm font-semibold text-muted">Floating panels</p></div>
          <div className="rounded-panel border-bold border-border p-4 grid place-items-center" style={{ background: '#fbfcf8' }}>
            <svg viewBox="0 0 60 60" className="w-16 h-16" aria-hidden="true"><circle cx="30" cy="30" r="26" fill="#f6c544" stroke="#000" strokeWidth="3" /><path d="M17 21 q6 -8 14 -9" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" /></svg>
            <p className="text-sm font-semibold text-muted">One white shine on round pieces</p>
          </div>
        </div>
      </Section>

      <Section title="Patterns" note="Drawn once, used on menus, theme frames and social posts at 8 to 12% strength.">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-4">
          {PATTERNS.map(([name, bg]) => (
            <div key={name} className="rounded-panel border-bold border-border h-32 grid items-end p-3" style={{ background: `${bg}, #b4c4fb`, backgroundSize: name === 'Checker' ? '32px 32px' : name === 'Tiny stars' ? '18px 18px' : name === 'Confetti dots' ? '28px 28px' : 'auto' }}>
              <span className="font-bold bg-surface rounded-pill border-std border-border px-3 py-1 justify-self-start">{name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Icons" note="Phosphor only: Bold for buttons, Fill inside colored circles. The same meaning always uses the same icon.">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-3">
          {ICONS.map(([name, ic]) => (
            <div key={name} className="rounded-input border-std border-border bg-surface p-3 grid justify-items-center gap-1 text-center">
              <span className="w-12 h-12 rounded-full border-std border-border bg-accent flex items-center justify-center [&>svg]:w-6 [&>svg]:h-6">{ic}</span>
              <span className="text-sm font-bold">{name}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">{SHOWN_MODES.map((m) => <ModeBadge key={m} mode={m} />)}</div>
        <div className="flex flex-wrap gap-2">{Array.from({ length: 10 }, (_, i) => <TeamBadge key={i} colorIndex={i} size={44} />)}</div>
      </Section>

      <Section title="Motion" note="Tap each to see it. Every move travels; nothing blinks faster than twice a second.">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-4">
          <Demo label="Pop in" onPlay={() => { setDemo((d) => d + 1); sfx.pop(); }}>
            <motion.span key={demo} className="block" initial={still ? false : { scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 18 }}><TeamBadge colorIndex={3} size={64} /></motion.span>
          </Demo>
          <Demo label="Hop" onPlay={() => { setHop((h) => (h + 1) % 4); sfx.jump(); }}>
            <div className="relative w-48 h-16">
              {[0, 1, 2, 3].map((k) => <span key={k} className="absolute bottom-0 w-10 h-3 rounded-full bg-surface-2 border-thin border-border" style={{ left: k * 46 }} />)}
              <motion.span className="absolute bottom-3" animate={{ left: hop * 46 }} transition={still ? { duration: 0 } : { duration: 0.23, ease: 'easeOut' }}>
                <motion.span key={hop} className="block" initial={still ? false : { y: -18, scaleY: 1.15 }} animate={{ y: 0, scaleY: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 16 }}><TeamBadge colorIndex={1} size={40} /></motion.span>
              </motion.span>
            </div>
          </Demo>
          <Demo label="Flip reveal" onPlay={() => { setFlip((f) => !f); sfx.whoosh(); }}>
            <motion.div className="w-28 h-20 rounded-input border-bold border-border grid place-items-center font-display text-3xl" style={{ background: flip ? '#fbfcf8' : '#fdfd94' }} animate={{ rotateY: still ? 0 : flip ? 360 : 0 }} transition={{ duration: 0.45 }}>{flip ? '+30' : '?'}</motion.div>
          </Demo>
          <Demo label="Count up" onPlay={() => { setCount((c) => c + 10); sfx.coin(); }}>
            <motion.span key={count} className="font-display text-5xl tabular-nums" initial={still ? false : { scale: 1.35 }} animate={{ scale: 1 }}>{count}</motion.span>
          </Demo>
          <Demo label="Big message" onPlay={() => { setMsg(Date.now()); sfx.right(); }}>
            <span className="text-sm font-semibold text-muted">Shows in the middle of the screen</span>
          </Demo>
          <Demo label="Celebration: small, medium, big" onPlay={() => { sfx.cheer(); if (!still) void confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 }, disableForReducedMotion: true }); }}>
            <span className="text-sm font-semibold text-muted">Confetti sized to the moment</span>
          </Demo>
          <Demo label="Power-up card" onPlay={() => setCard(true)}>
            <span className="text-sm font-semibold text-muted">Spins in with rays; waits for the X</span>
          </Demo>
          <div className="rounded-panel border-bold border-border bg-surface p-4 grid gap-2 content-start">
            <span className="font-bold">Hover lift</span>
            <div className="flex gap-2">{[0, 1, 2].map((k) => <span key={k} className="w-14 h-14 rounded-input border-std border-border bg-accent motion-safe:hover:scale-[1.06] motion-safe:transition-transform" style={{ boxShadow: 'var(--shadow-sticker)' }} />)}</div>
            <span className="text-sm font-semibold text-muted">Point at a tile: it grows a little; the border stays</span>
          </div>
        </div>
      </Section>

      <Section title="Universal parts" note="The same score board, answer tiles and cards in every game.">
        <div className="grid lg:grid-cols-[18rem_1fr] gap-6 items-start">
          <ScoreBoard turns={turns} playing round="3/8" roundLabel="Rounds" />
          <div className="grid grid-cols-2 gap-3">
            {[['A', '#fdfd94', 'Apple'], ['B', '#ddfcc6', 'Banana'], ['C', '#b4c4fb', 'Cherry'], ['D', '#ed9d75', 'Grape']].map(([l, bg, w]) => (
              <button key={l} type="button" className="min-h-20 rounded-input border-heavy border-border flex items-center gap-3 px-4 font-bold text-2xl motion-safe:hover:scale-[1.02] motion-safe:transition-transform" style={{ background: bg, boxShadow: '0 4px 0 #000' }}>
                <span className="w-11 h-11 rounded-full border-std border-border bg-surface flex items-center justify-center text-base">{l}</span>{w}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <AnimatePresence>
        {msg && (
          <motion.div key={msg} className="fixed inset-0 z-[65] grid place-items-center pointer-events-none" onAnimationComplete={() => window.setTimeout(() => setMsg(null), 1100)}>
            <motion.p className="font-display text-[clamp(2.5rem,7vw,5rem)]" style={{ color: '#fff', WebkitTextStroke: '0.12em #000', paintOrder: 'stroke fill' }}
              initial={still ? { opacity: 0 } : { scale: 0.3, opacity: 0, rotate: -6 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ type: 'spring', stiffness: 320, damping: 14 }}>
              <PopText text="Three in a row!" />
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {card && <LabPowerCard p={{ id: 'gold', name: 'Gold Star', desc: 'Two bonus points right now.', art: <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="#fff6b0" stroke="#000" strokeWidth="5" /><path d="M50 18l9 20 22 2-17 15 5 22-19-12-19 12 5-22-17-15 22-2z" fill="#f6c544" stroke="#000" strokeWidth="4" strokeLinejoin="round" /></svg> }} text="Two bonus points right now." still={still} onClose={() => setCard(false)} />}
      </AnimatePresence>
    </div>
  );
}

function Demo({ label, onPlay, children }: { label: string; onPlay: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onPlay} className="rounded-panel border-bold border-border bg-surface p-4 grid gap-3 justify-items-center content-start text-center motion-safe:hover:-translate-y-0.5 motion-safe:transition-transform min-h-40" style={{ boxShadow: 'var(--shadow-sticker)' }}>
      <span className="font-bold">{label}</span>
      <span className="min-h-16 grid place-items-center">{children}</span>
      <span className="text-xs font-bold uppercase tracking-wider text-muted">Tap to play</span>
    </button>
  );
}

// The sound board: every sound Gamify has, to approve by ear. Stars are
// picks, kept on this device (copy the list to send them).
const FILES: [string, [string, string][]][] = [
  ['Your picks: UI and answers', [['UI click (every tap)', '/sounds/ui/select.mp3'], ['Blip (can\'t tap yet)', '/sounds/ui/error.mp3'], ['Pop-up opens', '/sounds/ui/open.mp3'], ['Pop-up closes', '/sounds/ui/close.mp3'], ['Cancel or Back', '/sounds/ui/cancel.mp3'], ['Tab swipe', '/sounds/ui/swipe.mp3'], ['Level up (right answer)', '/sounds/answers/level-up.mp3'], ['Boing (not this one)', '/sounds/answers/boing.mp3']]],
  ['Recorded Classic sounds', [['Old up chime', '/sounds/answers/chime.mp3'], ['Win', '/sounds/win.mp3'], ['Whoosh', '/sounds/whoosh.mp3'], ['Miss', '/sounds/miss.mp3'], ['Dice', '/sounds/board/dice.mp3'], ['Jump', '/sounds/board/jump.mp3'], ['Magnet zap', '/sounds/board/magnet.mp3'], ['Wind', '/sounds/board/wind.mp3'], ['Prize chest', '/sounds/board/chest.mp3'], ['Score bell', '/sounds/pinball/score-bell.mp3'], ['Bumper', '/sounds/pinball/collision.mp3'], ['Bell', '/sounds/pinball/bell.mp3'], ['Splash', '/sounds/cast-catch/splash.mp3'], ['Cast', '/sounds/cast-catch/cast.mp3'], ['Page turn', '/sounds/game-show/page-turn.mp3'], ['Brass fail', '/sounds/game-show/fail.mp3']]],
  ['Music', [['Game show intro', '/sounds/game-show/intro.mp3'], ['Game music (cards)', '/sounds/game-show/music-cards.mp3'], ['Game music (categories)', '/sounds/game-show/music-categories.mp3']]],
];
const LIBRARY: Record<string, string[]> = {
  'success-power-up': ['celebration-fx-1', 'celebration-fx-2', 'celebration-fx-3', 'celebration-fx-4', 'new-level-fx-1', 'notification-fx-1', 'notification-fx-2', 'power-up-fx-1', 'power-up-fx-2', 'simple-celebration-fx1', 'simple-celebration-fx-2', 'simple-celebration-fx-3'],
  'pop-bubble': ['bloop-fx', 'bubble-flam-fx-1', 'bubble-flam-fx-2', 'bubble-flam-fx-3', 'bubble-loop-fx', 'pop-fx-1', 'pop-fx-2', 'pop-fx-3', 'pop-fx-4', 'pop-fx-5'],
  match: ['match-fx-1', 'match-fx-2', 'match-fx-3', 'match-fx-4', 'match-fx-5', 'match-fx-6', 'match-fx-7', 'match-fx-8', 'match-fx-9'],
  percussion: ['clap-fx-1', 'high-percussion-fx', 'lazer-fx', 'percussion-fx-1', 'percussion-fx-2', 'percussion-fx-3', 'percussion-fx-4', 'percussion-fx-5', 'percussion-fx-6', 'percussion-fx-7', 'percussion-fx-10', 'percussion-fx-11'],
  transition: ['slide-up-fx', 'swipe-fx-1', 'swipe-fx-2', 'swipe-fx-3', 'swipe-fx-3-1', 'transition-fx'],
  fail: ['fail-fx-1', 'fail-fx-2', 'fail-fx-3'],
  mysterious: ['mysterious-fx-1', 'mysterious-fx-3'],
};
const SYNTH = ['pop', 'boing', 'coin', 'zap', 'power', 'oops', 'whistle', 'kick', 'thud', 'swish', 'crash', 'cheer', 'tick', 'slideUp', 'slideDown', 'chomp', 'build', 'freeze'] as const;
const PICKS = 'gamify:brand-sound-picks';

function SoundBoard() {
  const { settings } = useSettings();
  const sfx = useMemo(() => makeSfx(settings), [settings]);
  const [picks, setPicks] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem(PICKS) ?? '[]') as string[]; } catch { return []; } });
  function toggle(name: string) {
    setPicks((cur) => { const next = cur.includes(name) ? cur.filter((x) => x !== name) : [...cur, name]; try { localStorage.setItem(PICKS, JSON.stringify(next)); } catch { /* memory only */ } return next; });
  }
  const groups: [string, { name: string; play: () => void }[]][] = [
    ...FILES.map(([g, list]) => [g, list.map(([name, src]) => ({ name, play: () => playClip(src, settings) }))] as [string, { name: string; play: () => void }[]]),
    ['Made-in-code game sounds (Game Lab)', SYNTH.map((k) => ({ name: k.replace(/([A-Z])/g, ' $1').toLowerCase(), play: () => (sfx[k] as () => void)() }))],
    ...Object.entries(LIBRARY).map(([folder, files]) => [`Triple Treat library: ${folder.replace(/-/g, ' ')}`, files.map((f) => ({ name: f.replace(/-fx-?/, ' ').replace(/-/g, ' '), play: () => playClip(`/sounds/library/${folder}/${f}.mp3`, settings) }))] as [string, { name: string; play: () => void }[]]),
  ];
  return (
    <div className="grid gap-8">
      <p className="font-semibold text-muted max-w-prose">Tap a sound to hear it. Tap its star to pick it for the universal Gamify sound pack. Your picks stay on this device; copy them below to send.</p>
      {groups.map(([g, list]) => (
        <Section key={g} title={g}>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-2.5">
            {list.map((s) => {
              const key = `${g}: ${s.name}`;
              const on = picks.includes(key);
              return (
                <div key={key} className={`rounded-input border-std border-border flex items-center gap-1 pl-1 pr-2 ${on ? 'bg-accent' : 'bg-surface'}`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
                  <button type="button" onClick={s.play} className="flex-1 min-h-12 flex items-center gap-2 px-2 font-bold text-left motion-safe:active:scale-95"><SpeakerHigh weight="fill" size={20} aria-hidden="true" />{s.name}</button>
                  <button type="button" onClick={() => toggle(key)} aria-pressed={on} aria-label={`Pick ${s.name}`} className="w-10 h-10 rounded-full flex items-center justify-center motion-safe:hover:scale-110 motion-safe:transition-transform"><Star weight={on ? 'fill' : 'bold'} size={22} /></button>
                </div>
              );
            })}
          </div>
        </Section>
      ))}
      <Section title={`Your picks (${picks.length})`}>
        <textarea readOnly value={picks.join('\n')} className="min-h-32 rounded-input border-std border-border bg-surface p-3 font-mono text-sm" aria-label="Your picked sounds" />
        <div><Button onClick={() => { void navigator.clipboard?.writeText(picks.join('\n')); }}>Copy my picks</Button></div>
      </Section>
    </div>
  );
}
