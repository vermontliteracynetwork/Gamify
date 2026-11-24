import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowClockwise, ArrowRight, Check, CornersOut, GearSix, Lightbulb, Play, SpeakerHigh, X } from '@phosphor-icons/react';
import { useSettings } from '../settings/SettingsContext';
import { playEffect, type Effect } from '../engine/feedback';
import { playClip, ANSWER_SOUNDS, POWER_SOUNDS } from '../engine/music';
import { PP } from './PaletteProposal';
import { CrayonDie, CrayonPowerUp, type PowerId } from './CrayonKit';
// Power-up art never sits on a circle or blob backing (teacher, 2026-11-24); BlobPatch stays only behind the tips lightbulb.
import { Badge, cpuName, DieWiggle, GO_YELLOW, IconBadge, Meter, PURPLE_GROUND, TEAMS, TurnGlow, GText } from './mockKit';

// Game components (PROPOSAL, teacher 2026-11-24: "add a section in brand for
// the universal game components", then "a full universal standard with
// animations, motion and sounds defined per component and live previews").
// Built from docs/game-components-standard.md (zones A top strip, B right rail,
// C feedback line, D one centered card). Pop-ups enter slowly (700 ms ease-out),
// stay until tapped, and the computer's turn pauses before and after its move
// (teacher, 2026-11-24). Preview only; no live game changes until she approves.

const I = PP.ink;
const GY: CSSProperties = { fontFamily: 'var(--font-display)', fontWeight: 400, lineHeight: 1, textTransform: 'uppercase' };
const PAPER: CSSProperties = { background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}` };
const EASE = [0.22, 1, 0.36, 1] as const;

type Calm = boolean;
// Slow, eased entrance; Calm/Still drops to a 150 ms fade.
const enter = (calm: Calm, delay = 0) => ({
  initial: calm ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: calm ? { opacity: 0, transition: { duration: 0.15 } } : { opacity: 0, scale: 0.96, transition: { duration: 0.35 } },
  transition: calm ? { duration: 0.15, delay: 0 } : { duration: 0.7, ease: EASE, delay },
});

function GoBtn({ children, onClick, big }: { children: ReactNode; onClick?: () => void; big?: boolean }) {
  return <button type="button" onClick={onClick} className={`${big ? 'min-h-[3.5rem] px-7 text-xl' : 'min-h-[3rem] px-5 text-lg'} rounded-full font-display font-bold inline-flex items-center justify-center gap-2 whitespace-nowrap`} style={{ background: GO_YELLOW, color: I, border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}` }}>{children}</button>;
}
function WhiteBtn({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return <button type="button" onClick={onClick} className="min-h-[3rem] px-5 rounded-full font-bold text-base inline-flex items-center gap-2 whitespace-nowrap" style={{ background: '#fff', color: I, border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}` }}>{children}</button>;
}
function Small({ children, onClick, label }: { children: ReactNode; onClick: () => void; label: string }) {
  return <button type="button" onClick={onClick} className="h-9 px-3 rounded-full text-sm font-bold inline-flex items-center gap-1.5 border-2 border-black bg-[#fffaf0] hover:bg-[#fdfd94]" aria-label={label}>{children}</button>;
}
// Top strip buttons (teacher, 2026-11-24: slightly smaller, more room): 44px,
// the smallest touch target we allow (Apple HIG 44pt, WCAG 2.5.5), 14px apart,
// in the one order used everywhere (mockKit GameTools).
function Round({ children, label, onClick }: { children: ReactNode; label: string; onClick?: () => void }) {
  return <button type="button" onClick={onClick} aria-label={label} className="w-11 h-11 rounded-full grid place-items-center shrink-0" style={{ background: '#fff', border: `2px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}>{children}</button>;
}

// One component on its own card: the live preview on the purple ground, then
// what it is for, sizes, states, motion and sound, with replay and sound buttons.
function Part({ n, name, use, sizes, states, motion: mo, sound, onReplay, onSound, children, wide }: { n: number; name: string; use: string; sizes: string; states: string; motion: string; sound: string; onReplay?: () => void; onSound?: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <article className={`rounded-[1.5rem] border-[3px] border-black bg-[#fffaf0] overflow-hidden grid ${wide ? 'lg:col-span-2' : ''}`} style={{ boxShadow: `0 5px 0 ${I}` }}>
      <div className="min-h-[15rem] p-6 grid place-items-center relative" style={PURPLE_GROUND}>{children}</div>
      <div className="p-4 grid gap-2 border-t-[3px] border-black">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <h3 className="font-heading text-lg">{n}. {name}</h3>
          <div className="flex gap-2">
            {onReplay && <Small onClick={onReplay} label={`Replay ${name}`}><ArrowClockwise weight="bold" size={16} />Replay</Small>}
            {onSound && <Small onClick={onSound} label={`Play the ${name} sound`}><SpeakerHigh weight="bold" size={16} />Sound</Small>}
          </div>
        </div>
        <p className="text-sm font-semibold">{use}</p>
        <dl className="grid grid-cols-[6.5rem_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="font-bold">Sizes</dt><dd className="m-0">{sizes}</dd>
          <dt className="font-bold">States</dt><dd className="m-0">{states}</dd>
          <dt className="font-bold">Motion</dt><dd className="m-0">{mo}</dd>
          <dt className="font-bold">Sound</dt><dd className="m-0">{sound}</dd>
        </dl>
      </div>
    </article>
  );
}

// ---------- the parts ----------
// Player icons have no circle or white backing (teacher, 2026-11-24): just the
// icon at the old circle's size. The player whose turn it is gets Butter
// shading; that shading is the only turn signal (no "pick a card" banner).
function TopStrip({ onHint }: { onHint?: () => void }) {
  return (
    <div className="w-full max-w-[48rem] grid grid-cols-[1fr_auto_1fr] items-center gap-4 pl-2 pr-3 rounded-full" style={{ ...PAPER, minHeight: '4rem' }}>
      <span className="justify-self-start flex items-center gap-2.5 pl-1.5"><Badge t={TEAMS[1]} size={36} /><b className="whitespace-nowrap">Team Sky</b></span>
      <Meter segments={3} done={1} part={0.5} width={180} label="Round 2 of 3" />
      <span className="justify-self-end flex gap-2"><Round label="Hint" onClick={onHint}><Lightbulb weight="bold" size={20} /></Round><Round label="Settings"><GearSix weight="bold" size={20} /></Round><Round label="Full screen"><CornersOut weight="bold" size={20} /></Round><Round label="Close"><X weight="bold" size={20} /></Round></span>
    </div>
  );
}
function MeterDemo({ calm, k }: { calm: Calm; k: number }) {
  const [part, setPart] = useState(0.1);
  useEffect(() => { setPart(0.1); const t = window.setTimeout(() => setPart(0.7), 300); return () => window.clearTimeout(t); }, [k]);
  return (
    <div className="grid gap-4 justify-items-center">
      <motion.div key={k} initial={false} animate={{ opacity: 1 }} className="grid gap-1 justify-items-center"><b className="text-sm">Rounds (no words in the top strip)</b>
        <span style={{ display: 'inline-block', transition: calm ? 'none' : 'all 0.5s ease-out' }}><Meter segments={4} done={1} part={part} width={320} label="Round 2 of 4" /></span></motion.div>
      <div className="grid gap-1 justify-items-center"><b className="text-sm">Step tracker (start menus)</b><Meter segments={6} done={2} part={1} width={300} label="Step 3 of 6" /></div>
      <div className="grid gap-1 justify-items-center"><b className="text-sm">Class goal: 18 of 30 stars</b><Meter segments={1} done={0} part={0.6} width={320} label="18 of 30 stars" /></div>
    </div>
  );
}
function Row({ t, name, score, now, cpu }: { t: (typeof TEAMS)[number]; name?: string; score: number; now?: boolean; cpu?: boolean }) {
  return (
    <div className="w-[20rem] flex items-center gap-3 px-3 rounded-full" style={{ ...PAPER, minHeight: '3.5rem', background: now ? PP.butter : PP.paper, transition: 'background-color 0.4s ease-out' }}>
      <Badge t={t} size={40} />
      <b className="flex-1 truncate">{name ?? t.name}</b>
      {cpu ? <span className="flex gap-1" aria-label="Thinking">{[0, 1, 2].map((d) => <span key={d} className="w-2 h-2 rounded-full bg-black/60" />)}</span> : <span className="text-[1.75rem] tabular-nums" style={GY}><GText>{score}</GText></span>}
    </div>
  );
}
const HELD: { id: PowerId; name: string; job: string }[] = [
  { id: 'double-points', name: 'Double Points', job: 'Your next points count twice.' },
  { id: 'shield', name: 'Shield', job: 'Stops the next bad thing.' },
  { id: 'swap', name: 'Swap Spinner', job: 'Trade your whole score with a team.' },
];
// Power-ups are single square cards (teacher, 2026-11-24): no tray panel, no
// label, no helper line. The art has no circle backing. Names always show.
function PowerCards({ calm, onUse }: { calm: Calm; onUse: (p: (typeof HELD)[number]) => void }) {
  return (
    <div className="flex gap-2.5">
      {HELD.map((h, i) => (
        <motion.button key={h.id} type="button" onClick={() => onUse(h)} {...enter(calm, i * 0.12)} whileTap={calm ? undefined : { scale: 0.95 }}
          className="w-[6.5rem] h-[6.5rem] flex flex-col items-center px-1 py-2 rounded-[1rem] overflow-hidden" style={{ background: PP.paper, border: `2.5px solid ${I}`, boxShadow: i === 1 ? 'none' : `0 3px 0 ${I}`, borderStyle: i === 1 ? 'dashed' : 'solid' }} aria-label={`${h.name}${i === 1 ? ', not now' : ''}`}>
          {/* 1.3x card (teacher, 2026-11-24): art in its own padded area, the name in a two-line area; nothing crosses the edge. */}
          <span className="flex-1 min-h-0 w-full grid place-items-center"><span className={calm || i === 1 ? '' : 'pu-bob'} style={{ opacity: i === 1 ? 0.45 : 1 }}><CrayonPowerUp id={h.id} size={40} /></span></span>
          <span className="w-full h-[2.1rem] grid place-items-center text-[0.8125rem] font-bold leading-[1.1] text-center" style={{ opacity: i === 1 ? 0.6 : 1 }}>{h.name}</span>
        </motion.button>
      ))}
    </div>
  );
}
function Card({ children, calm, w = '19rem' }: { children: ReactNode; calm: Calm; w?: string }) {
  return <motion.div {...enter(calm)} className="rounded-[1.75rem] p-6 grid justify-items-center gap-3 text-center" style={{ ...PAPER, width: w, maxWidth: '92%' }}>{children}</motion.div>;
}
function PopCard({ calm, onClose }: { calm: Calm; onClose: () => void }) {
  return (
    <Card calm={calm}>
      <span className="relative w-32 h-32 grid place-items-center"><span className={`relative ${calm ? '' : 'pu-bob'}`}><CrayonPowerUp id="treasure-chest" size={100} /></span></span>
      <b className="text-[2rem]" style={GY}><GText>Prize Chest!</GText></b>
      <span className="font-bold text-lg">+100</span>
      <GoBtn onClick={onClose} big>Continue<ArrowRight weight="bold" size={20} /></GoBtn>
    </Card>
  );
}
// The hint button's card: the game's tips, closed with a tap (teacher, 2026-11-24).
function HintCard({ calm, onClose }: { calm: Calm; onClose: () => void }) {
  return (
    <Card calm={calm} w="22rem">
      <IconBadge size={84} bg={PP.butter} shape="blob" optical="bulb"><Lightbulb weight="bold" size={44} /></IconBadge>
      <b className="text-[1.75rem]" style={GY}><GText>Tips</GText></b>
      <ul className="m-0 p-0 list-none grid gap-1.5 font-bold text-lg"><li>Fill a row for +10.</li><li>Cards can hide power-ups.</li></ul>
      <GoBtn onClick={onClose}>Got it</GoBtn>
    </Card>
  );
}
function ActionCard({ calm, onDone }: { calm: Calm; onDone: (team: string) => void }) {
  return (
    <Card calm={calm} w="26rem">
      <span className="relative w-28 h-28 grid place-items-center"><span className="relative"><CrayonPowerUp id="swap" size={88} /></span></span>
      <b className="text-[2rem]" style={GY}><GText>Swap Spinner</GText></b>
      <span className="font-bold text-lg">Trade your whole score with a team.</span>
      <div className="grid gap-2 w-full">
        {[TEAMS[0], TEAMS[2], TEAMS[3]].map((t, i) => (
          <motion.button key={t.name} type="button" onClick={() => onDone(t.name)} {...enter(calm, calm ? 0 : 0.7 + i * 0.12)}
            className="min-h-[3.5rem] rounded-full flex items-center gap-3 px-3 font-bold text-lg" style={{ background: t.soft, border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}` }}>
            <Badge t={t} size={40} />{t.name}
          </motion.button>
        ))}
      </div>
    </Card>
  );
}
// Just the die (teacher, 2026-11-24): no card, team name or Roll button. Tap it to roll; it wiggles on hover.
function RollDie({ calm, k, size = 112 }: { calm: Calm; k: number; size?: number }) {
  const [v, setV] = useState(4); const [tumble, setTumble] = useState(0);
  return (
    <button type="button" aria-label="Roll the die" onClick={() => { setTumble((x) => x + 1); setV(1 + Math.floor(Math.random() * 6)); }} className="grid place-items-center rounded-2xl">
      <DieWiggle still={calm}>
        <motion.span key={`${k}-${tumble}`} className="inline-grid" initial={calm ? false : { rotate: -200, scale: 0.7 }} animate={{ rotate: 0, scale: 1 }} transition={calm ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 12, mass: 1.2 }}><CrayonDie value={v} size={size} /></motion.span>
      </DieWiggle>
    </button>
  );
}
function ScorePop({ calm, k }: { calm: Calm; k: number }) {
  return (
    <div className="relative grid justify-items-center gap-2">
      <div className="relative h-24 w-40">
        <motion.span key={`f${k}`} className="absolute left-1/2 -translate-x-1/2 text-[2rem]" style={{ ...GY, color: I }} initial={calm ? { opacity: 1, bottom: 70 } : { opacity: 0, bottom: 0 }} animate={calm ? { opacity: 0 } : { opacity: [0, 1, 1, 0], bottom: [0, 50, 70, 80] }} transition={calm ? { duration: 0.15, delay: 0.6 } : { duration: 1.2, ease: 'easeOut' }}><GText>+30</GText></motion.span>
      </div>
      <motion.span key={`s${k}`} className="px-5 py-2 rounded-full text-[2.25rem] tabular-nums" style={{ ...PAPER, ...GY }} initial={calm ? false : { scale: 1 }} animate={calm ? undefined : { scale: [1, 1, 1.25, 1] }} transition={{ duration: 1.3, times: [0, 0.75, 0.85, 1] }}>140</motion.span>
    </div>
  );
}
function Tiles({ calm, k }: { calm: Calm; k: number }) {
  const [pick, setPick] = useState<number | null>(null);
  useEffect(() => setPick(null), [k]);
  const s = useSettings().settings;
  const ans = [['A', 'the dog ran.', PP.periwinkle, PP.gamify], ['B', 'The dog ran.', PP.sky, PP.blueCrystal], ['C', 'The dog ran', PP.pink, PP.blush], ['D', 'the dog ran', PP.lemon, PP.butter]] as const;
  return (
    <div className="grid grid-cols-2 gap-3 w-full max-w-[34rem]">
      {ans.map(([l, t, c, bg], i) => {
        const right = pick !== null && i === 1, faded = pick !== null && i === pick && i !== 1;
        return (
          <motion.button key={l} type="button" onClick={() => { setPick(i); playClip(i === 1 ? ANSWER_SOUNDS.right : ANSWER_SOUNDS.wrong, s); }}
            animate={calm ? { opacity: faded ? 0.4 : 1 } : right ? { scale: [1, 1.08, 1] } : faded ? { x: [0, -4, 4, -4, 0], opacity: 0.4 } : { scale: 1, opacity: 1 }}
            transition={{ duration: calm ? 0.15 : 0.35 }}
            className="min-h-[5rem] rounded-[1.25rem] flex items-center gap-3 px-3 font-bold text-xl text-left" style={{ background: right ? PP.mint : bg, border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}` }}>
            <span className="w-12 h-12 shrink-0 rounded-full grid place-items-center text-xl" style={{ ...GY, background: right ? PP.kelly : c, color: !right && c === PP.grape ? '#ffffff' : I, border: `3px solid ${I}` }}><GText>{right ? <Check weight="bold" size={22} /> : l}</GText></span>{t}
          </motion.button>
        );
      })}
    </div>
  );
}
function Feedback({ calm, text, good, waiting }: { calm: Calm; text: string; good?: boolean; waiting?: boolean }) {
  return (
    <motion.div key={text} initial={calm ? { opacity: 0 } : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: calm ? 0.15 : 0.6, ease: EASE }}
      className="inline-flex items-center gap-3 px-6 py-3 rounded-full text-[1.5rem]" style={{ ...PAPER, background: good ? PP.lemon : PP.paper, ...GY }} role="status">
      {text}
      {waiting && <span className="flex gap-1.5" aria-hidden="true">{[0, 1, 2].map((d) => <motion.span key={d} className="w-2.5 h-2.5 rounded-full" style={{ background: I }} animate={calm ? undefined : { opacity: [0.25, 1, 0.25] }} transition={{ duration: 1.2, repeat: Infinity, delay: d * 0.2 }} />)}</span>}
    </motion.div>
  );
}
// The computer's turn: think 2.5 s, move, show the result 1.5 s, then the
// shading moves to you. The computer gets a fun name that changes each game.
function CpuTurn({ calm, k }: { calm: Calm; k: number }) {
  const [step, setStep] = useState(0);
  const [die, setDie] = useState(3);
  const who = cpuName(k);
  useEffect(() => {
    setStep(0);
    const ts = [window.setTimeout(() => setStep(1), 400), window.setTimeout(() => { setStep(2); setDie(4); }, 2900), window.setTimeout(() => setStep(3), 4400)];
    return () => ts.forEach((t) => window.clearTimeout(t));
  }, [k]);
  return (
    <div className="grid justify-items-center gap-4">
      <div className="flex items-center gap-5">
        <div className="grid gap-2"><Row t={TEAMS[2]} name={who} score={60} cpu={step === 1} now={step < 3} /><Row t={TEAMS[1]} name="You" score={80} now={step === 3} /></div>
        <DieWiggle still={calm || step < 3}><motion.span className="inline-grid" key={`${k}-${step === 2}`} initial={step === 2 && !calm ? { rotate: -200, scale: 0.7 } : false} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 12 }}><CrayonDie value={die} size={72} /></motion.span></DieWiggle>
      </div>
      <div className="min-h-[3.75rem] grid place-items-center">
        <AnimatePresence mode="wait">
          {step === 1 && <Feedback key="t" calm={calm} text={`${who} is thinking`} waiting />}
          {step === 2 && <Feedback key="r" calm={calm} text={`${who} rolled a 4`} />}
        </AnimatePresence>
      </div>
      <span className="text-xs font-semibold" style={{ color: PP.quiet }}>0.4 s, then thinking 2.5 s, the move, the result 1.5 s, then the shading moves to you. Replay for the next name.</span>
    </div>
  );
}
function Winner({ calm, onClose }: { calm: Calm; onClose: () => void }) {
  return (
    <Card calm={calm} w="30rem">
      <b className="relative z-10 text-[2.5rem]" style={GY}><GText>Team Sky wins!</GText></b>
      <span className="my-4"><TurnGlow><Badge t={TEAMS[1]} size={112} /></TurnGlow></span>
      <b className="relative z-10 text-[2rem] tabular-nums" style={GY}><GText>160 points</GText></b>
      <div className="relative z-10 flex flex-wrap justify-center gap-2.5 mt-1"><GoBtn onClick={onClose} big><Play weight="fill" size={20} />Play again</GoBtn><WhiteBtn onClick={onClose}>New game</WhiteBtn><WhiteBtn onClick={onClose}>Review 3 missed</WhiteBtn></div>
    </Card>
  );
}

// Show a card until it is tapped, then offer to show it again.
function Tapped({ k, children, again }: { k: number; children: (close: () => void) => ReactNode; again: string }) {
  const [open, setOpen] = useState(true);
  useEffect(() => setOpen(true), [k]);
  return <AnimatePresence mode="wait">{open ? <motion.div key={`o${k}`} className="w-full grid place-items-center">{children(() => setOpen(false))}</motion.div> : <motion.div key="c" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><WhiteBtn onClick={() => setOpen(true)}>{again}</WhiteBtn></motion.div>}</AnimatePresence>;
}

const MAP: [string, string[]][] = [
  ['A top strip', ['name chip + meter', 'name chip + meter', 'score + meter + stars', 'name chip, no meter', 'score + meter', 'name chip + ten-frame meter', 'class goal + meter', 'join code + class goal or team counts']],
  ['B rows', ['teams (Butter = turn)', 'race rows (team names, no squares to go)', 'none', '2 players', 'none', 'ten-frame sheet', 'Live: "12 playing"', 'none']],
  ['B power-up cards', ['yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'no power-ups', 'no power-ups']],
  ['B action', ['none (tap a card)', 'the die', 'none', 'none (tap a column)', 'none (aim)', 'none (aim and roll)', 'none', 'none']],
  ['C feedback', ['prize line', 'Roll again, Lose a turn', 'combos, "No moves"', '"Pick a piece to pop"', '"New row!"', '"Strike!"', '"Three in a row!"', '"Caught one!"']],
  ['D cards', ['prize, tips, question, results', 'power-up, action, tips, question, results', 'power-up, tips, question, results', 'power-up, tips, question, results', 'power-up, tips, question, results', 'power-up, tips, question, results', 'tips, question, results', 'tips, question, results']],
  ['Computer turn', ['yes (Solo)', 'yes (Solo)', 'no', 'yes (Solo)', 'no', 'no', 'no', 'no']],
];
const GAMES = ['Game Show', 'Board Game', 'Match Three', 'Four in a Row', 'Bubble Pop', 'Bowling', 'Question Tracker', 'Territory'];

export default function GameComponents() {
  const { settings } = useSettings();
  const [calmOn, setCalm] = useState(false);
  const calm = calmOn || settings.motion === 'still' || !!settings.calm;
  const [keys, setKeys] = useState<Record<string, number>>({});
  const k = (id: string) => keys[id] ?? 0;
  const replay = (id: string) => setKeys((x) => ({ ...x, [id]: (x[id] ?? 0) + 1 }));
  const fx = (e: Effect) => () => playEffect(e, settings);
  const clip = (src: string) => () => playClip(src, settings);
  const [action, setAction] = useState<string | null>(null);
  const [hint, setHint] = useState(false);
  return (
    <section className="grid gap-6">
      <div className="grid gap-2 justify-items-center text-center">
        <h2 className="font-heading text-2xl">Game components <span className="text-base align-middle px-2 py-0.5 rounded-full border-2 border-black bg-[#fdfd94]">Proposal</span></h2>
        <p className="text-sm font-semibold text-muted max-w-prose">Every shared in-game part on its own, the same in every game: what it is for, its sizes and states, its motion and its sound. Pop-ups enter slowly (0.7 s) and stay until tapped; Butter shading shows whose turn it is (no turn banner); the computer pauses before and after its turn. Source: docs/game-components-standard.md. Preview only.</p>
        <label className="inline-flex items-center gap-2 font-bold text-sm cursor-pointer">
          <input type="checkbox" checked={calmOn} onChange={(e) => setCalm(e.target.checked)} className="w-5 h-5" />Show the Calm / Still version (150 ms fades, no bob, no shake)
        </label>
      </div>

      <div className="rounded-[1.25rem] border-[3px] border-black bg-[#fffaf0] p-4 grid gap-2">
        <h3 className="font-heading text-lg">HUD zones</h3>
        <p className="text-sm font-semibold">A: the top strip (score or the shaded team name, the meter, tools with the hint button). B: the right rail (score rows, power-up cards, the die); no tip lines; on iPad portrait and phones it docks under the board in one row. C: one feedback line at the bottom of the board. D: one centered card at a time over a 40% ink dim. Nothing in A or B covers the board.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Part n={1} name="Top strip" wide use="Zone A on every game: who or what (just the team or player name, no Butter chip: Butter is only the scoreboard row; never 'Team Sky's turn'; the score; or the class goal), the meter at the exact center (a 1fr | meter | 1fr grid) with no Round X of Y words, and the tools in one order. Try the lightbulb." sizes="4rem tall laptop and iPad, 4.5rem big screen, 3.5rem short laptop; team icon 2.25rem; buttons 44px (the touch minimum) with 8px between, in one order: Hint, Settings, Full screen, Close (the hint only on in-play strips; accessibility lives inside Settings)." states="Solo score, Share team name and badge, Live class goal; last round: the meter marker pulses once." motion="Fades up on game start (0.7 s ease-out); the chip shading moves to the next player over 0.4 s; no idle motion." sound="None." onReplay={() => replay('top')}>
          <div className="w-full grid gap-4 justify-items-center">
            <motion.div key={k('top')} {...enter(calm)} className="w-full grid place-items-center"><TopStrip onHint={() => { playEffect('open', settings); setHint(true); }} /></motion.div>
            <AnimatePresence>{hint && <motion.div key="hint" className="w-full grid place-items-center"><HintCard calm={calm} onClose={() => { playEffect('close', settings); setHint(false); }} /></motion.div>}</AnimatePresence>
          </div>
        </Part>
        <Part n={2} name="Meter" use="The one progress meter: rounds, start-menu steps and class goals. One continuous track, gentle gaps between segments, Kelly for done, Lemon for now with a small glowing marker. No Round X of Y text over it in the top strip." sizes="22px tall everywhere; 22rem wide laptop, 12rem phone." states="Per round or step; one segment for a goal bar." motion="Fill grows 0.5 s ease-out per step; Calm: jumps." sound="None (the round card has the sound)." onReplay={() => replay('meter')}>
          <MeterDemo calm={calm} k={k('meter')} />
        </Part>
        <Part n={3} name="Scoreboard rows" use="Zone B: one row per team (icon, whole name, score). The team whose turn it is gets Butter shading; that is the only turn signal. No glow on rows, no crown, no held power-up badge." sizes="Row 3.5rem tall, icon 2.5rem (no circle), score Grow Year 1.75rem; phone dock: chips 3rem." states="Normal, current team (Butter #FFF1B8), computer thinking (three dots)." motion="Rows fade in 0.12 s apart; the shading moves over 0.4 s; order never reshuffles mid-game." sound="None (the score pop has it)." onReplay={() => replay('rows')}>
          <div key={k('rows')} className="grid gap-3">
            {[[TEAMS[0], 80, false], [TEAMS[1], 110, true], [TEAMS[2], 60, false]].map(([t, s2, now], i) => (
              <motion.div key={i} {...enter(calm, i * 0.12)}><Row t={t as (typeof TEAMS)[number]} score={s2 as number} now={now as boolean} /></motion.div>
            ))}
          </div>
        </Part>
        <Part n={4} name="Turn glow (winner only)" use="THE one glow: the live game's spinning sun rays (.turn-rays) and breathing halo (.turn-halo), behind the winner's icon only. The icon has no circle or white backing. Turns use Butter shading instead, and there is no turn banner or 'pick a card' line (teacher, 2026-11-24: the shading tells them)." sizes="Rays 240% and halo 170% of the icon." states="On (winner) or off." motion="Rays spin 10 s a turn (30 s Gentle and Still); halo breathes 2.4 s (5 s)." sound="None.">
          <div className="flex gap-12 items-center">
            <TurnGlow><Badge t={TEAMS[1]} size={80} /></TurnGlow>
            <TurnGlow><Badge t={TEAMS[3]} size={48} /></TurnGlow>
          </div>
        </Part>
        <Part n={5} name="Power-up cards" use="Zone B under the rows (phone: in the dock). Each earned power-up is its own square card and WAITS until the player taps it; nothing fires by itself. No tray panel, no label, no helper line. Up to 3, names always showing (no hover-only labels on iPad); the art has no circle backing." sizes="Card 5rem square (over the 44px touch minimum), art 2.5rem, name 0.8125rem bold (13px; never smaller on a student screen)." states="Hidden when none; usable now (gentle bob); not now (dashed, 45% faded, no bob); pressed (scale 0.95)." motion="Cards land 0.7 s ease-out, 0.12 s apart; usable ones bob (1.8 s); Calm: no bob." sound="swipe when one lands; tap on press." onReplay={() => replay('tray')} onSound={fx('swipe')}>
          <div className="grid gap-4 justify-items-center w-full">
            <div key={k('tray')}><PowerCards calm={calm} onUse={(p) => { playEffect('tap', settings); setAction(p.name); }} /></div>
            {action && <span className="text-sm font-bold">Tapped {action}: its action card opens (part 7).</span>}
          </div>
        </Part>
        <Part n={6} name="Power-up pop card" use="Zone D when a power-up is earned: the picture (no circle or blob behind it), its name and the points only (+100). It stays until the player taps Continue." sizes="19rem wide (86% on a phone), art 8rem, title Grow Year 2rem, button 3.5rem." states="Shown until tapped." motion="0.7 s ease-out fade and grow, the art bobs; exit 0.35 s; Calm: 150 ms fade." sound="The power's own clip (here the prize chest), else power-up-fx-1." onReplay={() => replay('pop')} onSound={clip(POWER_SOUNDS.chest)}>
          <Tapped k={k('pop')} again="Show the card again">{(close) => <PopCard calm={calm} onClose={() => { playEffect('close', settings); close(); }} />}</Tapped>
        </Part>
        <Part n={7} name="Power-up action card" use="Zone D when a power-up needs a choice: the same card plus up to four big choice buttons (icon and name). One decision per card." sizes="26rem wide (92% on a phone); choice buttons 3.5rem tall; icons 2.5rem, no circle." states="Waiting for a choice, chosen." motion="Card 0.7 s ease-out, then the choices arrive 0.12 s apart once it has landed." sound="open on show, tap on a choice, then the power's clip." onReplay={() => replay('act')} onSound={fx('open')}>
          <Tapped k={k('act')} again="Show the card again">{(close) => <ActionCard calm={calm} onDone={() => { playEffect('tap', settings); close(); }} />}</Tapped>
        </Part>
        <Part n={8} name="The die" use="Zone B bottom (phone: dock left). Just the die: no card, no team name, no Roll button. Tap the die to roll. Every die wiggles gently on hover so kids see it can be rolled." sizes="Die 7rem here (9rem laptop, 5.25rem phone); the whole die is the tap target." states="Can roll (hover wiggle), rolling, rolled, computer rolling (no wiggle)." motion="Hover: a 0.9 s rotate and lift loop (7 degrees, 2px); roll: tumble and land with a bouncy spring (0.55 s); Calm and Still: no wiggle, the number just changes." sound="board/dice on roll." onReplay={() => replay('die')} onSound={clip('/sounds/board/dice.mp3')}>
          <RollDie calm={calm} k={k('die')} />
        </Part>
        <Part n={9} name="Hint button and tips card" use="A lightbulb round button beside Settings in every in-game button group. Rule and tip lines never sit under the scoreboard; the game's tips (for example Fill a row for +10) open in this small card, closed with a tap." sizes="Button 44px like its neighbors; card 22rem wide (92% on a phone), tips 1.125rem bold, two or three lines." states="Shown by itself once, at the first turn of a game; after that closed until the lightbulb is tapped; open until Got it." motion="Card 0.7 s ease-out; Calm: 150 ms fade." sound="open on show, close on Got it." onReplay={() => replay('hint')} onSound={fx('open')}>
          <Tapped k={k('hint')} again="Show the tips again">{(close) => <HintCard calm={calm} onClose={() => { playEffect('close', settings); close(); }} />}</Tapped>
        </Part>
<Part n={10} name="Score pop" use="A +30 floats up from where it was earned, then the score pops. The reward size matches the moment." sizes="+30 in Grow Year 2rem; score chip 2.25rem." states="Small (under 20), medium, big (round goal)." motion="Float 1.2 s ease-out, then the number scales 1.25 to 1; Calm: no float, the number changes." sound="Small: none; medium: a match step; big: win." onReplay={() => replay('score')} onSound={clip('/sounds/library/success-power-up/notification-fx-1.mp3')}>
          <ScorePop calm={calm} k={k('score')} />
        </Part>
        <Part n={11} name="Answer tile" use="The question card's four answers: letter circle (color and letter), text left. A miss fades and shakes gently; never a red X. Tap one to try." sizes="5rem tall laptop, 5.75rem iPad portrait, one size for every question." states="Idle, pressed, right (mint fill, Kelly check), missed (40% faded)." motion="Right: a 1.08 pop; missed: a 4px shake 0.35 s; Calm: fade only." sound="Right: answers/level-up; missed: answers/boing." onReplay={() => replay('tiles')}>
          <Tiles calm={calm} k={k('tiles')} />
        </Part>
        <Part n={12} name="Feedback line" use="Zone C: one pill for every message (Roll again, Strike!, Three in a row, Silly Fox is thinking). Lemon for good news, paper for neutral, never red; words only, no star icon." sizes="Grow Year 1.5rem, 3.5rem tall, up to 86% of the board width." states="Good, neutral, waiting (three dots)." motion="Rises 16px and fades in over 0.6 s; stays until the next action; Calm: 150 ms fade." sound="None of its own (it follows the event)." onReplay={() => replay('fb')}>
          <div key={k('fb')} className="grid gap-3 justify-items-center"><Feedback calm={calm} text="Three in a row!" good /><Feedback calm={calm} text="Roll again" /><Feedback calm={calm} text="Silly Fox is thinking" waiting /></div>
        </Part>
        <Part n={13} name="The computer's turn" wide use="Gives students and the teacher time to follow the computer: a thinking step, a visible pause, the move, the result, another pause, then the Butter shading moves to you. The computer gets a fun name that changes each game (Goofy Lamp, Silly Fox, Happy Rainbow...), never 'Computer'." sizes="Uses the rows, die and feedback line." states="Thinking (2.5 s), moving, result (1.5 s), your turn (shading moves)." motion="The pauses stay in every motion setting (they are reading time); Calm: the dots stop pulsing." sound="board/dice on its roll." onReplay={() => replay('cpu')}>
          <CpuTurn calm={calm} k={k('cpu')} />
        </Part>
        <Part n={14} name="Winner box" wide use="Zone D at the end: the winner's icon (no circle or backing) in THE glow, then only the score or XP centered under it in Grow Year, slightly smaller than the title; no stat chips. Play again (yellow), New game and Review missed. One celebration only." sizes="30rem wide (92% on a phone); title Grow Year 2.5rem; score Grow Year 2rem; icon 7rem; buttons 3rem to 3.5rem." states="Win, tie, solo (your stars or XP instead of a rank)." motion="0.7 s ease-out; confetti only at the edges (Celebrations setting); stays until a button is tapped." sound="win (the only place win plays)." onReplay={() => replay('win')} onSound={fx('win')}>
          <Tapped k={k('win')} again="Show the winner again">{(close) => <Winner calm={calm} onClose={close} />}</Tapped>
        </Part>
      </div>

      <div className="rounded-[1.25rem] border-[3px] border-black bg-[#fffaf0] p-4 grid gap-3 overflow-x-auto">
        <h3 className="font-heading text-lg">Which games use which parts</h3>
        <table className="text-sm border-collapse min-w-[56rem]">
          <thead><tr><th className="text-left p-2 border-b-2 border-black">Part</th>{GAMES.map((g) => <th key={g} className="text-left p-2 border-b-2 border-black">{g}</th>)}</tr></thead>
          <tbody>{MAP.map(([part, cells]) => <tr key={part}><td className="p-2 font-bold border-b border-black/20 align-top">{part}</td>{cells.map((c, i) => <td key={i} className="p-2 border-b border-black/20 align-top">{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
