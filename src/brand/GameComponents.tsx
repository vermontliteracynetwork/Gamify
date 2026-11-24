import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowClockwise, ArrowRight, Check, Crown, CornersOut, GearSix, PersonArmsSpread, Play, SpeakerHigh, Star } from '@phosphor-icons/react';
import { useSettings } from '../settings/SettingsContext';
import { playEffect, type Effect } from '../engine/feedback';
import { playClip, ANSWER_SOUNDS, POWER_SOUNDS } from '../engine/music';
import { PP } from './PaletteProposal';
import { BlobPatch, CrayonDie, CrayonPowerUp, type PowerId } from './CrayonKit';
import { Badge, GO_YELLOW, Meter, PURPLE_GROUND, TEAMS, TurnGlow } from './mockKit';

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
function Round({ children, label }: { children: ReactNode; label: string }) {
  return <span aria-label={label} className="w-11 h-11 rounded-full grid place-items-center shrink-0" style={{ background: '#fff', border: `2px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}>{children}</span>;
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
function TopStrip({ calm }: { calm: Calm }) {
  return (
    <div className="w-full max-w-[44rem] grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 rounded-full" style={{ ...PAPER, minHeight: '3.5rem' }}>
      <span className="flex items-center gap-3"><TurnGlow round><span className="w-10 h-10 rounded-full grid place-items-center bg-white" style={{ border: `2.5px solid ${I}` }}><Badge t={TEAMS[1]} size={26} /></span></TurnGlow><b className="whitespace-nowrap">Team Sky&apos;s turn</b></span>
      <span className="grid justify-items-center gap-1"><b className="text-sm">Round 2 of 3</b><Meter segments={3} done={1} part={calm ? 0.5 : 0.5} width={200} label="Round 2 of 3" /></span>
      <span className="justify-self-end flex gap-2"><Round label="Full screen"><CornersOut weight="bold" size={20} /></Round><Round label="Accessibility"><PersonArmsSpread weight="bold" size={20} /></Round><Round label="Settings"><GearSix weight="bold" size={20} /></Round></span>
    </div>
  );
}
function MeterDemo({ calm, k }: { calm: Calm; k: number }) {
  const [part, setPart] = useState(0.1);
  useEffect(() => { setPart(0.1); const t = window.setTimeout(() => setPart(0.7), 300); return () => window.clearTimeout(t); }, [k]);
  return (
    <div className="grid gap-4 justify-items-center">
      <motion.div key={k} initial={false} animate={{ opacity: 1 }} className="grid gap-1 justify-items-center"><b className="text-sm">Round 2 of 4</b>
        <span style={{ display: 'inline-block', transition: calm ? 'none' : 'all 0.5s ease-out' }}><Meter segments={4} done={1} part={part} width={320} label="Round 2 of 4" /></span></motion.div>
      <div className="grid gap-1 justify-items-center"><b className="text-sm">Step tracker (start menus)</b><Meter segments={6} done={2} part={1} width={300} label="Step 3 of 6" /></div>
      <div className="grid gap-1 justify-items-center"><b className="text-sm">Class goal: 18 of 30 stars</b><Meter segments={1} done={0} part={0.6} width={320} label="18 of 30 stars" /></div>
    </div>
  );
}
function Row({ t, score, now, lead, held, cpu }: { t: (typeof TEAMS)[number]; score: number; now?: boolean; lead?: boolean; held?: boolean; cpu?: boolean }) {
  const badge = <span className="w-11 h-11 rounded-full grid place-items-center bg-white" style={{ border: `2.5px solid ${I}` }}><Badge t={t} size={28} /></span>;
  return (
    <div className="w-[20rem] flex items-center gap-3 px-3 rounded-full" style={{ ...PAPER, minHeight: '3.5rem', background: now ? PP.butter : PP.paper }}>
      {now ? <TurnGlow round>{badge}</TurnGlow> : badge}
      <b className="flex-1 truncate">{t.name}</b>
      {lead && <Crown weight="fill" size={22} color={PP.lemon} aria-label="Leader" />}
      {held && <span aria-label="Holds Double Points" className="w-9 h-9 rounded-lg grid place-items-center" style={{ background: PP.butter, border: `2px solid ${I}` }}><CrayonPowerUp id="double-points" size={30} /></span>}
      {cpu ? <span className="flex gap-1" aria-label="Thinking">{[0, 1, 2].map((d) => <span key={d} className="w-2 h-2 rounded-full bg-black/60" />)}</span> : <span className="text-[1.75rem] tabular-nums" style={GY}>{score}</span>}
    </div>
  );
}
function TurnBanner({ calm }: { calm: Calm }) {
  return (
    <motion.div {...enter(calm)} className="inline-flex items-center gap-3 pl-2 pr-6 py-2 rounded-full font-bold text-xl" style={PAPER}>
      <TurnGlow round><span className="w-11 h-11 rounded-full grid place-items-center bg-white" style={{ border: `2.5px solid ${I}` }}><Badge t={TEAMS[1]} size={28} /></span></TurnGlow>
      Your turn: pick a card!
    </motion.div>
  );
}
const HELD: { id: PowerId; name: string; job: string }[] = [
  { id: 'double-points', name: 'Double Points', job: 'Your next points count twice.' },
  { id: 'shield', name: 'Shield', job: 'Stops the next bad thing.' },
  { id: 'swap', name: 'Swap Spinner', job: 'Trade your whole score with a team.' },
];
// Power-ups wait in the tray until tapped (teacher, 2026-11-24); names always show.
function Tray({ calm, onUse }: { calm: Calm; onUse: (p: (typeof HELD)[number]) => void }) {
  return (
    <div className="p-3 rounded-[1.25rem] grid gap-2 justify-items-center" style={{ ...PAPER, background: PP.butter }}>
      <b className="text-sm">Your power-ups</b>
      <div className="flex gap-2.5">
        {HELD.map((h, i) => (
          <motion.button key={h.id} type="button" onClick={() => onUse(h)} {...enter(calm, i * 0.12)} whileTap={calm ? undefined : { scale: 0.95 }}
            className="w-[5rem] grid justify-items-center content-center gap-1 rounded-[1rem] py-2" style={{ background: PP.paper, border: `2.5px solid ${I}`, boxShadow: i === 1 ? 'none' : `0 3px 0 ${I}`, borderStyle: i === 1 ? 'dashed' : 'solid' }} aria-label={`${h.name}${i === 1 ? ', not now' : ', tap to use'}`}>
            <span className={calm || i === 1 ? '' : 'pu-bob'} style={{ opacity: i === 1 ? 0.45 : 1 }}><CrayonPowerUp id={h.id} size={44} /></span>
            <span className="text-[0.75rem] font-bold leading-tight text-center px-1" style={{ opacity: i === 1 ? 0.6 : 1 }}>{h.name}</span>
          </motion.button>
        ))}
      </div>
      <span className="text-xs font-semibold" style={{ color: PP.quiet }}>Tap one to use it. Shield: not now.</span>
    </div>
  );
}
function Card({ children, calm, w = '19rem' }: { children: ReactNode; calm: Calm; w?: string }) {
  return <motion.div {...enter(calm)} className="rounded-[1.75rem] p-6 grid justify-items-center gap-3 text-center" style={{ ...PAPER, width: w, maxWidth: '92%' }}>{children}</motion.div>;
}
function PopCard({ calm, onClose }: { calm: Calm; onClose: () => void }) {
  return (
    <Card calm={calm}>
      <span className="relative w-32 h-32 grid place-items-center"><BlobPatch color={PP.butter} size={130} /><span className={`relative ${calm ? '' : 'pu-bob'}`}><CrayonPowerUp id="treasure-chest" size={100} /></span></span>
      <b className="text-[2rem]" style={GY}>Prize Bag!</b>
      <span className="font-bold text-lg">+100 for you</span>
      <GoBtn onClick={onClose} big>Tap to continue<ArrowRight weight="bold" size={20} /></GoBtn>
    </Card>
  );
}
function ActionCard({ calm, onDone }: { calm: Calm; onDone: (team: string) => void }) {
  return (
    <Card calm={calm} w="26rem">
      <span className="relative w-28 h-28 grid place-items-center"><BlobPatch color={PP.blueCrystal} size={116} /><span className="relative"><CrayonPowerUp id="swap" size={88} /></span></span>
      <b className="text-[2rem]" style={GY}>Swap Spinner</b>
      <span className="font-bold text-lg">Trade your whole score with a team.</span>
      <div className="grid gap-2 w-full">
        {[TEAMS[0], TEAMS[2], TEAMS[3]].map((t, i) => (
          <motion.button key={t.name} type="button" onClick={() => onDone(t.name)} {...enter(calm, calm ? 0 : 0.7 + i * 0.12)}
            className="min-h-[3.5rem] rounded-full flex items-center gap-3 px-3 font-bold text-lg" style={{ background: t.soft, border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}` }}>
            <span className="w-10 h-10 rounded-full grid place-items-center bg-white" style={{ border: `2.5px solid ${I}` }}><Badge t={t} size={26} /></span>{t.name}
          </motion.button>
        ))}
      </div>
    </Card>
  );
}
function RollCard({ calm, k }: { calm: Calm; k: number }) {
  const [v, setV] = useState(4); const [tumble, setTumble] = useState(0);
  return (
    <div className="p-4 rounded-[1.5rem] grid justify-items-center gap-3" style={PAPER}>
      <span className="flex items-center gap-2 font-bold"><Badge t={TEAMS[1]} size={26} />Team Sky</span>
      <button type="button" aria-label="Roll the die" onClick={() => { setTumble((x) => x + 1); setV(1 + Math.floor(Math.random() * 6)); }} className="relative w-32 h-32 grid place-items-center">
        <BlobPatch color={PP.butter} size={128} />
        <motion.span key={`${k}-${tumble}`} className="relative" initial={calm ? false : { rotate: -200, scale: 0.7 }} animate={{ rotate: 0, scale: 1 }} transition={calm ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 12, mass: 1.2 }}><CrayonDie value={v} size={96} /></motion.span>
      </button>
      <GoBtn onClick={() => { setTumble((x) => x + 1); setV(1 + Math.floor(Math.random() * 6)); }}>Roll</GoBtn>
    </div>
  );
}
function ScorePop({ calm, k }: { calm: Calm; k: number }) {
  return (
    <div className="relative grid justify-items-center gap-2">
      <div className="relative h-24 w-40">
        <motion.span key={`f${k}`} className="absolute left-1/2 -translate-x-1/2 text-[2rem]" style={{ ...GY, color: I }} initial={calm ? { opacity: 1, bottom: 70 } : { opacity: 0, bottom: 0 }} animate={calm ? { opacity: 0 } : { opacity: [0, 1, 1, 0], bottom: [0, 50, 70, 80] }} transition={calm ? { duration: 0.15, delay: 0.6 } : { duration: 1.2, ease: 'easeOut' }}>+30</motion.span>
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
            <span className="w-12 h-12 shrink-0 rounded-full grid place-items-center text-xl" style={{ ...GY, background: right ? PP.kelly : c, border: `3px solid ${I}` }}>{right ? <Check weight="bold" size={22} /> : l}</span>{t}
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
      {good ? <Star weight="fill" size={26} /> : null}{text}
      {waiting && <span className="flex gap-1.5" aria-hidden="true">{[0, 1, 2].map((d) => <motion.span key={d} className="w-2.5 h-2.5 rounded-full" style={{ background: I }} animate={calm ? undefined : { opacity: [0.25, 1, 0.25] }} transition={{ duration: 1.2, repeat: Infinity, delay: d * 0.2 }} />)}</span>}
    </motion.div>
  );
}
// The computer's turn: think 2.5 s, move, show the result 1.5 s, then hand back.
function CpuTurn({ calm, k }: { calm: Calm; k: number }) {
  const [step, setStep] = useState(0);
  const [die, setDie] = useState(3);
  useEffect(() => {
    setStep(0);
    const ts = [window.setTimeout(() => setStep(1), 400), window.setTimeout(() => { setStep(2); setDie(4); }, 2900), window.setTimeout(() => setStep(3), 4400)];
    return () => ts.forEach((t) => window.clearTimeout(t));
  }, [k]);
  return (
    <div className="grid justify-items-center gap-4">
      <div className="flex items-center gap-4">
        <Row t={TEAMS[2]} score={60} cpu={step === 1} now={step < 3} />
        <motion.span key={`${k}-${step === 2}`} initial={step === 2 && !calm ? { rotate: -200, scale: 0.7 } : false} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 12 }}><CrayonDie value={die} size={64} /></motion.span>
      </div>
      <AnimatePresence mode="wait">
        {step === 1 && <Feedback key="t" calm={calm} text="Computer is thinking" waiting />}
        {step === 2 && <Feedback key="r" calm={calm} text="Computer rolled a 4" />}
        {step === 3 && <motion.div key="y" {...enter(calm)}><GoBtn big>Your turn: tap to roll</GoBtn></motion.div>}
      </AnimatePresence>
      <span className="text-xs font-semibold" style={{ color: PP.quiet }}>0.4 s, then thinking 2.5 s, the move, the result 1.5 s, then your turn.</span>
    </div>
  );
}
function Winner({ calm, onClose }: { calm: Calm; onClose: () => void }) {
  return (
    <Card calm={calm} w="30rem">
      <b className="relative z-10 text-[2.5rem]" style={GY}>Team Sky wins!</b>
      <span className="my-3"><TurnGlow round><span className="w-28 h-28 rounded-full grid place-items-center bg-white" style={{ border: `3px solid ${I}` }}><Badge t={TEAMS[1]} size={72} /></span></TurnGlow></span>
      <div className="relative z-10 flex flex-wrap justify-center gap-2">{['160 points', '7 cards', '1 row filled'].map((c) => <span key={c} className="px-3 py-1 rounded-full font-bold" style={{ background: PP.blueCrystal, border: `2.5px solid ${I}` }}>{c}</span>)}</div>
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
  ['A top strip', ['turn chip + "Card 6 of 16"', 'turn chip + squares left', 'score + "Round 2 of 3" + stars', 'turn chip, no meter', 'score + "Round 2 of 4"', 'turn chip + "Frame 4 of 10"', 'class goal "18 of 30 stars"']],
  ['B rows', ['teams + held badge', 'race rows "12 to go"', 'none', '2 players', 'none', 'ten-frame sheet', 'Live: "12 playing"']],
  ['B tray', ['yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'no power-ups']],
  ['B action card', ['none (tap a card)', 'roll card + die', 'none', 'none (tap a column)', 'none (aim)', 'Throw button', 'none']],
  ['C feedback', ['prize line', 'Roll again, Lose a turn', 'combos, "No moves"', '"Pick a piece to pop"', '"New row!"', '"Strike!"', 'combo stars']],
  ['D cards', ['turn, prize, question, results', 'turn, power-up, action, question, results', 'power-up, question, results', 'turn, power-up, question, results', 'power-up, question, results', 'turn, power-up, question, results', 'question, results']],
  ['Computer turn', ['yes (Solo)', 'yes (Solo)', 'no', 'yes (Solo)', 'no', 'no', 'no']],
];
const GAMES = ['Game Show', 'Board Game', 'Match Three', 'Four in a Row', 'Bubble Pop', 'Bowling', 'Question Tracker'];

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
  return (
    <section className="grid gap-6">
      <div className="grid gap-2 justify-items-center text-center">
        <h2 className="font-heading text-2xl">Game components <span className="text-base align-middle px-2 py-0.5 rounded-full border-2 border-black bg-[#fdfd94]">Proposal</span></h2>
        <p className="text-sm font-semibold text-muted max-w-prose">Every shared in-game part on its own, the same in every game: what it is for, its sizes and states, its motion and its sound. Pop-ups enter slowly (0.7 s) and stay until tapped; the computer pauses before and after its turn. Source: docs/game-components-standard.md. Preview only.</p>
        <label className="inline-flex items-center gap-2 font-bold text-sm cursor-pointer">
          <input type="checkbox" checked={calmOn} onChange={(e) => setCalm(e.target.checked)} className="w-5 h-5" />Show the Calm / Still version (150 ms fades, no bob, no shake)
        </label>
      </div>

      <div className="rounded-[1.25rem] border-[3px] border-black bg-[#fffaf0] p-4 grid gap-2">
        <h3 className="font-heading text-lg">HUD zones</h3>
        <p className="text-sm font-semibold">A: the top strip (score or turn, the round meter, tools). B: the right rail (score rows, the power-up tray, the action card); on iPad portrait and phones it docks under the board in one row. C: one feedback line at the bottom of the board. D: one centered card at a time over a 40% ink dim. Nothing in A or B covers the board.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Part n={1} name="Top strip" wide use="Zone A on every game: who or what (score, whose turn, class goal), Round X of Y over the meter, and the tools (Full screen, Accessibility, Settings) in one order." sizes="3.5rem tall laptop and iPad, 4.5rem big screen, 3rem short laptop; badge 2.75rem." states="Solo score, Share turn chip, Live class goal; last round: the meter marker pulses once." motion="Fades up on game start (0.7 s ease-out); no idle motion except the turn glow." sound="None." onReplay={() => replay('top')}>
          <motion.div key={k('top')} {...enter(calm)} className="w-full grid place-items-center"><TopStrip calm={calm} /></motion.div>
        </Part>
        <Part n={2} name="Meter" use="The one progress meter: rounds, start-menu steps and class goals. One continuous track, gentle gaps between segments, Kelly for done, Lemon for now with a small glowing marker." sizes="22px tall everywhere; 22rem wide laptop, 12rem phone." states="Per round or step; one segment for a goal bar." motion="Fill grows 0.5 s ease-out per step; Calm: jumps." sound="None (the round card has the sound)." onReplay={() => replay('meter')}>
          <MeterDemo calm={calm} k={k('meter')} />
        </Part>
        <Part n={3} name="Scoreboard rows" use="Zone B: one row per team (badge, whole name, score). The current team wears THE glow behind its badge and a butter fill; the leader gets a crown; a held power-up shows as a small square." sizes="Row 3.5rem tall, badge 2.75rem, score Grow Year 1.75rem; phone dock: chips 3rem." states="Normal, current team, leader, holding a power-up, computer thinking (three dots)." motion="Rows fade in 0.12 s apart; order never reshuffles mid-game." sound="None (the score pop has it)." onReplay={() => replay('rows')}>
          <div key={k('rows')} className="grid gap-3">
            {[[TEAMS[0], 80, false, false, false], [TEAMS[1], 110, true, true, true], [TEAMS[2], 60, false, false, false]].map(([t, s2, now, lead, held], i) => (
              <motion.div key={i} {...enter(calm, i * 0.12)}><Row t={t as (typeof TEAMS)[number]} score={s2 as number} now={now as boolean} lead={lead as boolean} held={held as boolean} /></motion.div>
            ))}
          </div>
        </Part>
        <Part n={4} name="Turn banner" use="Says whose turn it is in words beside the glowing badge: in the top strip and as the turn card at the start of a turn." sizes="Pill 3.5rem tall, text 1.25rem bold; turn card badge 13.75rem." states="Per player; Your turn, Team Sky's turn, Computer's turn." motion="0.7 s ease-out fade and grow; stays for the whole turn." sound="open (ui/open) once when it appears." onReplay={() => replay('turn')} onSound={fx('open')}>
          <TurnBanner key={k('turn')} calm={calm} />
        </Part>
        <Part n={5} name="Turn glow" use="THE one glow for your turn, the current row and the winner: the live game's spinning sun rays (.turn-rays) and breathing halo (.turn-halo), always behind the badge, never a flat ring." sizes="Rays 240% and halo 170% of the badge." states="On or off." motion="Rays spin 10 s a turn (30 s Gentle and Still); halo breathes 2.4 s (5 s)." sound="None.">
          <div className="flex gap-10 items-center">
            <TurnGlow round><span className="w-20 h-20 rounded-full grid place-items-center bg-white" style={{ border: `3px solid ${I}` }}><Badge t={TEAMS[1]} size={52} /></span></TurnGlow>
            <TurnGlow round><span className="w-12 h-12 rounded-full grid place-items-center bg-white" style={{ border: `2.5px solid ${I}` }}><Badge t={TEAMS[3]} size={30} /></span></TurnGlow>
          </div>
        </Part>
        <Part n={6} name="Held power-ups tray" use="Zone B under the rows (phone: in the dock). Earned power-ups WAIT here until the player taps one; nothing fires by itself. Up to 3, each a square card with its name always showing (no hover-only labels on iPad)." sizes="Card 5rem square (over the 44px touch minimum), art 2.75rem, name 0.75rem bold." states="Hidden when empty; holding; usable now (gentle bob); not now (45% faded, no bob); pressed (scale 0.95)." motion="Cards land 0.7 s ease-out, 0.12 s apart; usable ones bob (1.8 s); Calm: no bob." sound="swipe when one lands; tap on press." onReplay={() => replay('tray')} onSound={fx('swipe')}>
          <div className="grid gap-4 justify-items-center w-full">
            <div key={k('tray')}><Tray calm={calm} onUse={(p) => { playEffect('tap', settings); setAction(p.name); }} /></div>
            {action && <span className="text-sm font-bold">Tapped {action}: its action card opens (part 9).</span>}
          </div>
        </Part>
        <Part n={7} name="Power-up pop card" use="Zone D when a power-up is earned: the picture on a blob patch, its name and one line. It stays until the player taps Tap to continue." sizes="19rem wide (86% on a phone), art 8rem, title Grow Year 2rem, button 3.5rem." states="Shown until tapped." motion="0.7 s ease-out fade and grow, the art bobs; exit 0.35 s; Calm: 150 ms fade." sound="The power's own clip (here the treasure chest), else power-up-fx-1." onReplay={() => replay('pop')} onSound={clip(POWER_SOUNDS.chest)}>
          <Tapped k={k('pop')} again="Show the card again">{(close) => <PopCard calm={calm} onClose={() => { playEffect('close', settings); close(); }} />}</Tapped>
        </Part>
        <Part n={8} name="Power-up action card" use="Zone D when a power-up needs a choice: the same card plus up to four big choice buttons (badge and name). One decision per card." sizes="26rem wide (92% on a phone); choice buttons 3.5rem tall." states="Waiting for a choice, chosen." motion="Card 0.7 s ease-out, then the choices arrive 0.12 s apart once it has landed." sound="open on show, tap on a choice, then the power's clip." onReplay={() => replay('act')} onSound={fx('open')}>
          <Tapped k={k('act')} again="Show the card again">{(close) => <ActionCard calm={calm} onDone={() => { playEffect('tap', settings); close(); }} />}</Tapped>
        </Part>
        <Part n={9} name="Roll card and die" use="Zone B bottom (phone: dock left). The die is the button; a yellow Roll button sits under it. Tap either to roll." sizes="Die 6rem here (9rem laptop, 5.25rem phone); Roll 3rem tall." states="Can roll, rolling, rolled, computer rolling." motion="Tumble and land with a bouncy spring (0.55 s); Calm: the number just changes." sound="board/dice on roll." onReplay={() => replay('die')} onSound={clip('/sounds/board/dice.mp3')}>
          <RollCard calm={calm} k={k('die')} />
        </Part>
        <Part n={10} name="Score pop" use="A +30 floats up from where it was earned, then the score pops. The reward size matches the moment." sizes="+30 in Grow Year 2rem; score chip 2.25rem." states="Small (under 20), medium, big (round goal)." motion="Float 1.2 s ease-out, then the number scales 1.25 to 1; Calm: no float, the number changes." sound="Small: none; medium: a match step; big: win." onReplay={() => replay('score')} onSound={clip('/sounds/library/success-power-up/notification-fx-1.mp3')}>
          <ScorePop calm={calm} k={k('score')} />
        </Part>
        <Part n={11} name="Answer tile" use="The question card's four answers: letter circle (color and letter), text left. A miss fades and shakes gently; never a red X. Tap one to try." sizes="5rem tall laptop, 5.75rem iPad portrait, one size for every question." states="Idle, pressed, right (mint fill, Kelly check), missed (40% faded)." motion="Right: a 1.08 pop; missed: a 4px shake 0.35 s; Calm: fade only." sound="Right: answers/level-up; missed: answers/boing." onReplay={() => replay('tiles')}>
          <Tiles calm={calm} k={k('tiles')} />
        </Part>
        <Part n={12} name="Feedback line" use="Zone C: one pill for every message (Roll again, Strike!, Three in a row, Computer is thinking). Lemon for good news, paper for neutral, never red." sizes="Grow Year 1.5rem, 3.5rem tall, up to 86% of the board width." states="Good, neutral, waiting (three dots)." motion="Rises 16px and fades in over 0.6 s; stays until the next action; Calm: 150 ms fade." sound="None of its own (it follows the event)." onReplay={() => replay('fb')}>
          <div key={k('fb')} className="grid gap-3 justify-items-center"><Feedback calm={calm} text="Three in a row!" good /><Feedback calm={calm} text="Roll again" /><Feedback calm={calm} text="Computer is thinking" waiting /></div>
        </Part>
        <Part n={13} name="The computer's turn" wide use="Gives students and the teacher time to follow the computer: a thinking step, a visible pause, the move, the result, another pause, then the turn comes back." sizes="Uses the row, die and feedback line." states="Thinking (2.5 s), moving, result (1.5 s), your turn." motion="The pauses stay in every motion setting (they are reading time); Calm: the dots stop pulsing." sound="board/dice on its roll; open when your turn card appears." onReplay={() => replay('cpu')}>
          <CpuTurn calm={calm} k={k('cpu')} />
        </Part>
        <Part n={14} name="Winner box" wide use="Zone D at the end: the winner in THE glow, up to three stat chips, Play again (yellow), New game and Review missed. One celebration only." sizes="30rem wide (92% on a phone); title Grow Year 2.5rem; buttons 3rem to 3.5rem." states="Win, tie, solo (your stars instead of a rank)." motion="0.7 s ease-out; confetti only at the edges (Celebrations setting); stays until a button is tapped." sound="win (the only place win plays)." onReplay={() => replay('win')} onSound={fx('win')}>
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
