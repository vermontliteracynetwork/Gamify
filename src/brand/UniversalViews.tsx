import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  ArrowLeft, ArrowRight, Broadcast, Check, CornersOut, DeviceTabletSpeaker, GearSix, Lightbulb, MagnifyingGlass, Pause,
  PersonArmsSpread, Play, SpeakerHigh, Star, Television, Timer, Toolbox, User, UsersThree, X,
} from '@phosphor-icons/react';
import { PP } from './PaletteProposal';
import { PATTERNS } from './PatternProposal';
import { BlobPatch, CrayonDie, CrayonPowerUp, Doodle, type PowerId } from './CrayonKit';

// Universal views (PROPOSAL, teacher 2026-11-23: "i want to add all the
// universal views to the brand kit like the menu pages, power up cards, etc.").
// A static mockup of every shared screen in the proposed kit (Grape main, Blue
// crystal light blue, ink, cream, quiet doodle ground behind text only, doodle
// crayon power-ups). Content and layout follow the real screens, so this is a
// redesign of them, not a new product. Nothing here is wired to a live screen.

const I = PP.ink;
const quiet = PATTERNS.find((p) => p.id === 'quiet')!.make(false);
const confetti = PATTERNS.find((p) => p.id === 'confetti')!.make(false);
const panel: CSSProperties = { background: PP.paper, border: `3px solid ${I}`, borderRadius: 24, boxShadow: `0 5px 0 ${I}` };
// Selected = ink ring plus a Kelly check, never the go color (teacher, 2026-11-23).
const SEL = `0 0 0 3px ${PP.paper}, 0 0 0 6px ${I}`;
const PICK: CSSProperties = { background: PP.mint, color: I, boxShadow: `inset 0 0 0 2.5px ${I}` };
const soft: CSSProperties = { background: PP.paper, border: `2px solid ${I}`, borderRadius: 16 };

// ---------- frames ----------
// Each screen is drawn at a fixed design size and scaled to fit its frame, so
// the mockup reads the same at any window width and nothing reflows or overlaps.
function Scaled({ w, h, children }: { w: number; h: number; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0.6);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setK(el.clientWidth / w));
    ro.observe(el);
    setK(el.clientWidth / w);
    return () => ro.disconnect();
  }, [w]);
  return (
    <div ref={box} className="relative w-full overflow-hidden" style={{ aspectRatio: `${w} / ${h}` }}>
      <div className="absolute top-0 left-0 origin-top-left" style={{ width: w, height: h, transform: `scale(${k})`, color: I }}>{children}</div>
    </div>
  );
}
export function Laptop({ children }: { children: ReactNode }) {
  return (
    <div className="grid justify-items-center">
      <div className="w-full rounded-t-[1.1rem] p-[2.2%] pb-[2.6%]" style={{ background: '#2a2740', border: `2px solid ${I}` }}>
        <div className="rounded-[0.35rem] overflow-hidden"><Scaled w={1000} h={625}>{children}</Scaled></div>
      </div>
      <div className="w-[103%] h-3 rounded-b-[0.9rem]" style={{ background: '#c9c4d6', border: `2px solid ${I}`, borderTop: 'none' }} />
    </div>
  );
}
export function Tablet({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-[21rem] mx-auto rounded-[1.6rem] p-[4%]" style={{ background: '#2a2740', border: `2px solid ${I}` }}>
      <div className="rounded-[0.7rem] overflow-hidden"><Scaled w={820} h={1180}>{children}</Scaled></div>
    </div>
  );
}

// ---------- shared parts ----------
function Ground({ children, pad = 28 }: { children: ReactNode; pad?: number }) {
  return <div className="w-full h-full relative" style={{ ...quiet, padding: pad }}>{children}</div>;
}
function Round({ children, label }: { children: ReactNode; label: string }) {
  return <span aria-label={label} className="w-11 h-11 rounded-full grid place-items-center" style={{ background: PP.paper, border: `2.5px solid ${I}` }}>{children}</span>;
}
function Corner() {
  return (
    <div className="absolute top-5 right-6 flex gap-2">
      <Round label="Accessibility"><PersonArmsSpread weight="bold" size={20} /></Round>
      <Round label="Full screen"><CornersOut weight="bold" size={20} /></Round>
      <Round label="Settings"><GearSix weight="bold" size={20} /></Round>
      <Round label="Close"><X weight="bold" size={20} /></Round>
    </div>
  );
}
export function MainBtn({ children, wide, big }: { children: ReactNode; wide?: boolean; big?: boolean }) {
  return (
    <span className={`${wide ? 'w-full' : ''} ${big ? 'min-h-16 text-3xl' : 'min-h-12 text-xl'} px-8 rounded-full font-display font-bold inline-flex items-center justify-center gap-2`}
      style={{ background: PP.periwinkle, color: I, border: `3px solid ${I}`, boxShadow: `0 5px 0 ${PP.grapeDeep}` }}>{children}</span>
  );
}
function SecondBtn({ children }: { children: ReactNode }) {
  return <span className="min-h-12 px-6 rounded-full font-bold text-lg inline-flex items-center gap-2" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}>{children}</span>;
}
function Wizard({ step, total, title, children, last }: { step: number; total: number; title: string; children: ReactNode; last?: boolean }) {
  return (
    <Ground>
      <Corner />
      <div className="absolute left-7 top-5 font-display text-2xl font-bold px-4 py-1.5 rounded-2xl" style={{ background: PP.periwinkle, color: I, border: `3px solid ${I}` }}>Gamify</div>
      <div className="absolute inset-x-10 top-24 bottom-8 flex flex-col p-7 gap-5" style={panel}>
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-3xl font-bold">Step {step} of {total}: {title}</h2>
          <ol className="flex gap-1.5 w-56" aria-label="Steps">
            {Array.from({ length: total }, (_, i) => <li key={i} className="flex-1 h-3 rounded-full" style={{ background: i < step - 1 ? PP.periwinkle : i === step - 1 ? PP.lemon : 'transparent', border: `2px solid ${I}` }} />)}
          </ol>
        </div>
        <div className="flex-1 min-h-0 relative">{children}</div>
        <div className="flex justify-between items-center">
          <SecondBtn><ArrowLeft weight="bold" size={18} />Back</SecondBtn>
          <MainBtn>{last ? <><Play weight="fill" size={20} />Play</> : <>Next<ArrowRight weight="bold" size={20} /></>}</MainBtn>
        </div>
      </div>
    </Ground>
  );
}
// Shape plus color for every team, so color is never the only cue (WCAG 1.4.1).
export const TEAMS = [
  { name: 'Team Purple', color: PP.periwinkle, shape: 'circle', text: I },
  { name: 'Team Sky', color: PP.sky, shape: 'star', text: I },
  { name: 'Team Pink', color: PP.pink, shape: 'triangle', text: I },
  { name: 'Team Lemon', color: PP.lemon, shape: 'square', text: I },
] as const;
export function Badge({ t, size = 40 }: { t: (typeof TEAMS)[number]; size?: number }) {
  const d = t.shape === 'circle' ? <circle cx="20" cy="20" r="16" /> : t.shape === 'star'
    ? <path d="M20 3 L25 15 L38 15 L27.5 23 L31.5 36 L20 28 L8.5 36 L12.5 23 L2 15 L15 15 Z" />
    : t.shape === 'triangle' ? <path d="M20 4 L37 35 L3 35 Z" /> : <rect x="5" y="5" width="30" height="30" rx="6" />;
  return <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true"><g fill={t.color} stroke={I} strokeWidth="3" strokeLinejoin="round">{d}</g></svg>;
}
function Board({ dim }: { dim?: boolean }) {
  // A stand-in game stage (a plain race board), so overlays sit on something real.
  return (
    <div className="w-full h-full relative" style={{ background: PP.blueCrystal }}>
      <div className="absolute inset-10 grid grid-cols-8 grid-rows-5 gap-1.5">
        {Array.from({ length: 40 }, (_, i) => <span key={i} className="rounded-lg" style={{ background: [PP.paper, PP.butter, PP.gamify, PP.aqua, PP.blush][i % 5], border: `2px solid ${I}` }} />)}
      </div>
      {dim && <div className="absolute inset-0" style={{ background: 'rgba(29,26,51,0.45)' }} />}
    </div>
  );
}

// ---------- the views ----------
function V1() {
  return (
    <Ground>
      <Corner />
      <div className="grid grid-cols-[1.25fr_1fr] gap-8 h-full pt-14">
        <div className="relative rounded-[24px] overflow-hidden" style={{ ...confetti, border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}` }}>
          <div className="absolute inset-0 grid place-items-center"><div className="relative w-56 h-56 grid place-items-center"><BlobPatch color={PP.gamify} size={230} /><span className="relative"><CrayonDie value={5} size={150} /></span></div></div>
        </div>
        <div className="flex flex-col justify-between gap-4">
          <div className="grid gap-2">
            <h1 className="font-display text-5xl font-bold leading-none">Board Game</h1>
            <p className="font-semibold text-lg leading-snug" style={{ color: PP.quiet }}>Answer, roll the die and race to the finish.</p>
            <div className="flex gap-2">{['Share', 'Live', 'Solo'].map((m) => <span key={m} className="px-3 py-1 rounded-full font-bold" style={{ background: PP.blueCrystal, border: `2px solid ${I}` }}>{m}</span>)}</div>
          </div>
          <div className="p-5 grid gap-3" style={soft}>
            <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: PP.quiet }}>How to play</h2>
            {[['Answer the question', <Check key="a" weight="bold" size={20} />], ['Roll the die', <Star key="b" weight="fill" size={20} />], ['Move to the finish', <ArrowRight key="c" weight="bold" size={20} />]].map(([s, ic], i) => (
              <div key={i} className="flex items-center gap-3 font-bold text-lg"><span className="w-10 h-10 rounded-full grid place-items-center" style={{ background: PP.butter, border: `2.5px solid ${I}` }}>{ic}</span>{s}</div>
            ))}
          </div>
          <MainBtn wide big><Play weight="fill" size={26} />Set up and play</MainBtn>
        </div>
      </div>
    </Ground>
  );
}
function V2() {
  const ways = [
    { id: 'Share', hint: 'Play together on one screen', icon: <Television weight="fill" size={84} />, bg: PP.gamify, on: true },
    { id: 'Live', hint: 'Play together on your own devices', icon: <Broadcast weight="fill" size={84} />, bg: PP.aqua },
    { id: 'Solo', hint: 'Play on your own', icon: <User weight="fill" size={84} />, bg: PP.butter },
  ];
  return (
    <Wizard step={1} total={5} title="How will you play?">
      <div className="h-full flex flex-col items-center justify-center gap-5">
        <div className="flex gap-5">
          {ways.map((w) => (
            <div key={w.id} className="relative w-52 h-52 rounded-[22px] overflow-hidden flex flex-col" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: w.on ? SEL : `0 4px 0 ${I}` }}>
              <span className="flex-1 grid place-items-center" style={{ background: w.bg, borderBottom: `2.5px solid ${I}` }}>{w.icon}</span>
              <span className="px-3 py-2"><b className="font-display text-xl block leading-tight">{w.id}</b><span className="text-sm font-semibold">{w.hint}</span></span>
              {w.on && <span className="absolute top-2 right-2 w-8 h-8 rounded-full grid place-items-center" style={{ background: PP.kelly, color: I, border: `2.5px solid ${I}` }}><Check weight="bold" size={18} /></span>}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 font-bold"><span>How do you share?</span>
          <span className="inline-flex p-1 rounded-full" style={{ background: PP.cream, border: `2.5px solid ${I}` }}>
            <span className="px-4 py-1.5 rounded-full" style={PICK}>Same device</span><span className="px-4 py-1.5">Share a join code</span>
          </span>
        </div>
      </div>
    </Wizard>
  );
}
function V3() {
  const sets = [
    ['Capital letters', 'ELA', 'K-2', 12, PP.blush], ['Short vowels', 'ELA', 'K-1', 16, PP.gamify], ['Add within 20', 'Math', '1-2', 20, PP.butter],
    ['Punctuation', 'ELA', '2-3', 10, PP.aqua], ['Plants and seeds', 'Science', '2-4', 14, PP.sage], ['Place value', 'Math', '2-3', 18, PP.butter],
  ] as const;
  return (
    <Wizard step={2} total={5} title="Question set">
      <div className="flex items-center gap-3 mb-4">
        <span className="inline-flex p-1 rounded-full font-bold" style={{ background: PP.cream, border: `2.5px solid ${I}` }}><span className="px-4 py-1 rounded-full" style={PICK}>My sets</span><span className="px-4 py-1">Public sets</span></span>
        <span className="flex-1 h-11 px-4 rounded-full flex items-center gap-2 font-semibold" style={{ background: PP.paper, border: `2.5px solid ${I}`, color: PP.quiet }}><MagnifyingGlass weight="bold" size={18} />Search sets</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {sets.map(([name, sub, gr, n, bg], i) => (
          <div key={name} className="relative p-3 grid gap-2" style={{ ...soft, boxShadow: i === 0 ? SEL : `0 3px 0 ${I}` }}>
            <div className="flex items-center gap-2"><span className="w-7 h-7 rounded-full" style={{ background: bg, border: `2px solid ${I}` }} /><b className="text-lg leading-tight">{name}</b></div>
            <div className="flex gap-1.5 text-xs font-bold whitespace-nowrap"><span className="px-2 py-0.5 rounded-full" style={{ border: `2px solid ${I}` }}>{sub}</span><span className="px-2 py-0.5 rounded-full" style={{ border: `2px solid ${I}` }}>Grades {gr}</span><span className="px-2 py-0.5 rounded-full" style={{ background: bg, border: `2px solid ${I}` }}>{n} questions</span></div>
            {i === 0 && <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full grid place-items-center" style={{ background: PP.kelly, color: I, border: `2.5px solid ${I}` }}><Check weight="bold" size={16} /></span>}
          </div>
        ))}
      </div>
    </Wizard>
  );
}
function Choice({ label, opts, pick }: { label: string; opts: string[]; pick: number }) {
  return (
    <div className="grid gap-1.5"><b className="text-lg">{label}</b>
      <span className="inline-flex p-1 rounded-full font-bold w-fit" style={{ background: PP.cream, border: `2.5px solid ${I}` }}>
        {opts.map((o, i) => <span key={o} className="px-5 py-1.5 rounded-full" style={i === pick ? PICK : undefined}>{o}</span>)}
      </span>
    </div>
  );
}
function V4() {
  return (
    <Wizard step={3} total={5} title="Options">
      <div className="grid grid-cols-2 gap-x-10 gap-y-6 content-center h-full">
        <div className="grid gap-1.5"><b className="text-lg">Rounds: 10</b>
          <div className="relative h-4 rounded-full" style={{ background: PP.blueCrystal, border: `2.5px solid ${I}` }}><span className="absolute inset-y-0 left-0 w-1/2 rounded-full" style={{ background: PP.periwinkle }} /><span className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full" style={{ background: PP.paper, border: `3px solid ${I}` }} /></div>
        </div>
        <Choice label="Timer" opts={['Off', '30 s', '60 s']} pick={0} />
        <Choice label="Read aloud" opts={['On', 'Off']} pick={0} />
        <div className="grid gap-1.5"><b className="text-lg">Board size</b>
          <div className="flex gap-3">{[3, 4, 5].map((n, i) => (
            <span key={n} className="w-20 h-20 p-2 grid gap-0.5 rounded-xl" style={{ gridTemplateColumns: `repeat(${n}, 1fr)`, background: PP.paper, border: `2.5px solid ${I}`, boxShadow: i === 1 ? SEL : undefined }}>
              {Array.from({ length: n * n }, (_, k) => <span key={k} className="rounded-sm" style={{ background: PP.gamify }} />)}
            </span>))}</div>
        </div>
      </div>
    </Wizard>
  );
}
function V5() {
  return (
    <Wizard step={4} total={5} title="Teams">
      <div className="grid gap-4">
        <Choice label="How many teams?" opts={['2', '3', '4']} pick={2} />
        <div className="grid grid-cols-4 gap-3">
          {TEAMS.map((t) => (
            <div key={t.name} className="overflow-hidden" style={{ ...soft, boxShadow: `0 3px 0 ${I}` }}>
              <div className="h-14 grid place-items-center" style={{ background: t.color, borderBottom: `2px solid ${I}` }}><Badge t={t} size={36} /></div>
              <div className="p-3 grid gap-2"><span className="h-10 px-3 rounded-xl flex items-center font-bold" style={{ background: PP.cream, border: `2px solid ${I}` }}>{t.name}</span>
                <div className="flex flex-wrap gap-1 text-sm font-bold">{['Ava', 'Leo', 'Mia'].map((n) => <span key={n} className="px-2 py-0.5 rounded-full" style={{ background: PP.paper, border: `2px solid ${I}` }}>{n}</span>)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Wizard>
  );
}
const SETUP: { id: PowerId; name: string; job: string; on: boolean }[] = [
  { id: 'double-points', name: 'Double Points', job: 'Your next points count twice.', on: true },
  { id: 'shield', name: 'Shield', job: 'Stops the next bad thing.', on: true },
  { id: 'freeze', name: 'Freeze', job: 'Stops the clock for a bit.', on: true },
  { id: 'hint', name: 'Hint', job: 'Shows a clue for this question.', on: true },
  { id: 'tornado', name: 'Tornado', job: 'Mixes up the board.', on: false },
  { id: 'mystery-box', name: 'Mystery Box', job: 'Opens a surprise power-up.', on: true },
];
function V6() {
  // Her 2026-11-23 rule: no white box, cards centered straight on the ground.
  return (
    <Ground>
      <Corner />
      <div className="absolute left-7 top-5 font-display text-2xl font-bold px-4 py-1.5 rounded-2xl" style={{ background: PP.periwinkle, color: I, border: `3px solid ${I}` }}>Gamify</div>
      <div className="h-full flex flex-col items-center pt-20 gap-6">
        <h2 className="font-display text-3xl font-bold px-5 py-1 rounded-2xl" style={{ background: PP.paper, border: `3px solid ${I}` }}>Step 5 of 5: Power-ups</h2>
        <div className="grid grid-cols-3 gap-4">
          {SETUP.map((c) => (
            <div key={c.id} className="relative w-60 p-3 pt-4 grid justify-items-center gap-1 text-center rounded-[20px]"
              style={c.on ? { background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}` } : { background: PP.cream, border: `3px dashed ${PP.quiet}` }}>
              <span style={c.on ? undefined : { filter: 'grayscale(1)', opacity: 0.5 }}><CrayonPowerUp id={c.id} size={72} /></span>
              <b className="text-lg leading-tight" style={c.on ? undefined : { color: PP.quiet }}>{c.name}</b>
              <span className="text-sm font-semibold leading-snug" style={{ color: PP.quiet }}>{c.job}</span>
              <span className="absolute -top-2.5 -right-2.5 w-8 h-8 rounded-full grid place-items-center" style={c.on ? { background: PP.kelly, border: `2.5px solid ${I}` } : { background: PP.paper, border: `2.5px solid ${PP.quiet}`, color: PP.quiet }}>
                {c.on ? <Check weight="bold" size={16} /> : <X weight="bold" size={14} />}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-4"><SecondBtn><ArrowLeft weight="bold" size={18} />Back</SecondBtn><MainBtn><Play weight="fill" size={20} />Play</MainBtn></div>
      </div>
    </Ground>
  );
}
function V7() {
  return (
    <div className="w-full h-full relative">
      <Board dim />
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative w-80 px-6 pt-10 pb-7 grid justify-items-center gap-2 text-center" style={{ ...panel, borderWidth: 4, boxShadow: `0 0 0 8px ${PP.butter}, 0 8px 0 ${I}` }}>
          <span className="absolute top-3 right-3"><Round label="Close"><X weight="bold" size={20} /></Round></span>
          <div className="relative w-40 h-40 grid place-items-center"><BlobPatch color={PP.butter} size={170} /><span className="relative"><CrayonPowerUp id="double-points" size={130} /></span></div>
          <b className="font-display text-4xl leading-tight">Double Points!</b>
          <span className="font-bold text-lg">Your next points count twice.</span>
          {(['sparkle', 'star', 'dot', 'sparkle'] as const).map((k, i) => <Doodle key={i} kind={k} color={[PP.lemon, PP.pink, PP.sky, PP.kelly][i]} size={26} className="absolute" style={{ left: ['-6%', '96%', '-4%', '94%'][i], top: ['18%', '30%', '78%', '84%'][i] }} />)}
        </div>
      </div>
    </div>
  );
}
const ANS = [['A', 'the dog ran.', PP.periwinkle, I, PP.gamify], ['B', 'The dog ran.', PP.sky, I, PP.aqua], ['C', 'The dog ran', PP.pink, I, PP.blush], ['D', 'the dog ran', PP.lemon, I, PP.butter]] as const;
function QTop() {
  return (
    <div className="flex items-center gap-2">
      <span className="min-h-11 px-4 rounded-full inline-flex items-center gap-2 font-bold" style={{ background: PP.paper, border: `2.5px solid ${I}` }}><SpeakerHigh weight="bold" size={20} />Listen</span>
      <span className="flex-1" />
      <Round label="Tools"><Toolbox weight="bold" size={20} /></Round><Round label="Full screen"><CornersOut weight="bold" size={20} /></Round>
      <Round label="Accessibility"><PersonArmsSpread weight="bold" size={20} /></Round><Round label="Settings"><GearSix weight="bold" size={20} /></Round><Round label="Close"><X weight="bold" size={20} /></Round>
    </div>
  );
}
function Answers({ cols, big }: { cols: number; big?: boolean }) {
  return (
    <div className="grid gap-4 flex-1" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {ANS.map(([l, txt, c, tc, bg]) => (
        <div key={l} className={`flex items-center gap-5 px-6 rounded-[22px] font-bold ${big ? 'text-6xl' : 'text-4xl'}`} style={{ background: bg, border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}` }}>
          <span className={`${big ? 'w-24 h-24 text-5xl' : 'w-14 h-14 text-3xl'} shrink-0 rounded-full grid place-items-center font-display`} style={{ background: c, color: tc, border: `3px solid ${I}` }}>{l}</span>{txt}
        </div>
      ))}
    </div>
  );
}
function V8() {
  return (
    <Ground pad={24}>
      <div className="h-full flex flex-col gap-5 p-6" style={panel}>
        <QTop />
        <h2 className="text-4xl font-bold leading-snug text-left">Which one starts with a capital letter and ends with punctuation?</h2>
        <Answers cols={2} />
      </div>
    </Ground>
  );
}
function V8iPad() {
  return (
    <Ground pad={28}>
      <div className="h-full flex flex-col gap-8 p-8" style={panel}>
        <div style={{ zoom: 1.6 }}><QTop /></div>
        <h2 className="text-7xl font-bold leading-tight text-left">Which one starts with a capital letter and ends with punctuation?</h2>
        <Answers cols={1} big />
      </div>
    </Ground>
  );
}
function V9() {
  return (
    <div className="w-full h-full relative" style={{ background: PP.blueCrystal }}>
      <div className="absolute left-6 right-6 top-5 flex items-center gap-4 px-5 py-3" style={{ ...soft, boxShadow: `0 3px 0 ${I}` }}>
        <span className="font-display text-5xl font-bold leading-none tabular-nums">120</span>
        <span className="flex-1 flex gap-2">{[0, 1, 2].map((r) => (
          <span key={r} className="flex-1 flex gap-1 p-1 rounded-full" style={{ background: PP.paper, border: `2px solid ${I}` }}>
            {[0, 1, 2, 3].map((m) => { const k = r * 4 + m; return <span key={m} className="flex-1 h-3 rounded-full" style={k < 5 ? { background: PP.kelly } : k === 5 ? { background: PP.lemon, boxShadow: `0 0 0 2px ${I}` } : { border: `1.5px solid ${PP.quiet}` }} />; })}
          </span>))}</span>
        <span className="font-bold text-sm" style={{ color: PP.quiet }}>Solo: no player icon</span>
      </div>
      <div className="absolute left-6 top-28 bottom-6 w-[60%] grid grid-cols-6 grid-rows-4 gap-1.5">
        {Array.from({ length: 24 }, (_, i) => <span key={i} className="rounded-lg" style={{ background: [PP.paper, PP.butter, PP.gamify, PP.aqua][i % 4], border: `2px solid ${I}` }} />)}
      </div>
      <div className="absolute right-6 top-28 w-[33%] grid gap-2.5">
        <b className="text-sm uppercase tracking-wider" style={{ color: PP.quiet }}>Share scoreboard</b>
        {TEAMS.map((t, i) => (
          <div key={t.name} className="flex items-center gap-3 px-3 py-2 rounded-2xl" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: i === 1 ? `0 0 0 5px ${PP.lemon}, 0 4px 0 ${I}` : `0 3px 0 ${I}` }}>
            <Badge t={t} size={32} /><b className="flex-1 text-lg truncate">{t.name}</b><span className="font-display text-3xl tabular-nums">{[80, 110, 60, 95][i]}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-bold" style={{ background: PP.butter, border: `2px solid ${I}` }}><CrayonPowerUp id="shield" size={34} />Team Sky holds Shield, next turn</div>
      </div>
    </div>
  );
}
function V10() {
  return (
    <div className="w-full h-full relative">
      <Board dim />
      <div className="absolute inset-0 grid place-items-center">
        <div className="w-[34rem] p-6 grid justify-items-center gap-4 text-center" style={{ ...panel, ...quiet, borderWidth: 4 }}>
          <h2 className="text-6xl leading-none" style={{ fontFamily: 'var(--font-display)', fontWeight: 400 }}>Great game!</h2>
          <div className="flex items-end gap-4">
            {[1, 0, 2].map((i) => { const t = TEAMS[i]; const hi = [150, 110, 80][i]; return (
              <div key={t.name} className="grid justify-items-center gap-1">
                {i === 0 && <span className="relative w-24 h-24 grid place-items-center"><span className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle, ${PP.butter} 55%, transparent 72%)` }} /><span className="relative"><Badge t={t} size={74} /></span></span>}
                {i !== 0 && <Badge t={t} size={46} />}
                <span className="w-28 rounded-t-2xl grid place-items-center font-display text-3xl" style={{ height: hi, background: i === 0 ? PP.periwinkle : PP.gamify, color: I, border: `3px solid ${I}` }}>{i + 1}</span>
              </div>); })}
          </div>
          <div className="flex flex-wrap gap-3 justify-center"><MainBtn>Play again</MainBtn><SecondBtn>New game</SecondBtn><SecondBtn>Review</SecondBtn><SecondBtn><Star weight="fill" size={18} />Rate</SecondBtn></div>
        </div>
      </div>
    </div>
  );
}
function Toggle({ on }: { on: boolean }) {
  return <span className="w-14 h-8 rounded-full relative" style={{ background: on ? PP.kelly : PP.cream, border: `2.5px solid ${I}` }}><span className="absolute top-0.5 w-6 h-6 rounded-full" style={{ left: on ? 26 : 2, background: PP.paper, border: `2px solid ${I}` }} /></span>;
}
function V11() {
  return (
    <div className="w-full h-full relative">
      <Board dim />
      <div className="absolute inset-0 grid place-items-center">
        <div className="w-[40rem] p-6 grid gap-4" style={panel}>
          <div className="flex items-center justify-between"><h2 className="font-display text-3xl font-bold">Settings</h2><Round label="Close"><X weight="bold" size={20} /></Round></div>
          <span className="inline-flex p-1 rounded-full font-bold w-fit" style={{ background: PP.cream, border: `2.5px solid ${I}` }}>{['Sound', 'Motion', 'Reading', 'Tools'].map((o, i) => <span key={o} className="px-4 py-1 rounded-full" style={i === 1 ? PICK : undefined}>{o}</span>)}</span>
          <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: PP.blueCrystal, border: `2.5px solid ${I}` }}>
            <div className="flex-1"><b className="text-xl block">Calm mode</b><span className="font-semibold" style={{ color: PP.quiet }}>Softer sounds, still pictures, quiet ground.</span></div><Toggle on />
          </div>
          {[['Motion', false], ['Sound effects', true], ['Music', false]].map(([l, on]) => <div key={l as string} className="flex items-center justify-between px-2 font-bold text-lg">{l}<Toggle on={on as boolean} /></div>)}
          <div style={{ ...PATTERNS.find((p) => p.id === 'quiet')!.make(true), border: `2px solid ${I}` }} className="h-16 rounded-2xl grid place-items-center font-bold" aria-label="Calm ground preview">Calm ground</div>
        </div>
      </div>
    </div>
  );
}
function V11b() {
  return (
    <div className="w-full h-full relative">
      <Board dim />
      <div className="absolute inset-0 grid place-items-center">
        <div className="w-[30rem] p-8 grid justify-items-center gap-3 text-center" style={panel}>
          <span className="w-20 h-20 rounded-full grid place-items-center" style={{ background: PP.blueCrystal, border: `3px solid ${I}` }}><Pause weight="fill" size={40} /></span>
          <h2 className="font-display text-4xl font-bold">Paused</h2>
          <p className="font-bold text-xl">Your teacher paused the game. It will be back soon.</p>
        </div>
      </div>
    </div>
  );
}
function V12() {
  return (
    <Ground>
      <div className="h-full grid place-items-center">
        <div className="w-[34rem] p-8 grid justify-items-center gap-4 text-center" style={panel}>
          <h1 className="font-display text-5xl font-bold">Join the game</h1>
          <p className="font-semibold text-lg" style={{ color: PP.quiet }}>Type the game code your teacher gave you.</p>
          <div className="flex gap-2">{['4', '7', '2', '9', '', ''].map((d, i) => <span key={i} className="w-14 h-16 rounded-xl grid place-items-center font-display text-4xl" style={{ background: i === 4 ? PP.blueCrystal : PP.paper, border: `${i === 4 ? 4 : 3}px solid ${I}` }}>{d}</span>)}</div>
          <div className="flex gap-3"><SecondBtn><SpeakerHigh weight="bold" size={18} />Hear my code</SecondBtn><MainBtn>Go<ArrowRight weight="bold" size={20} /></MainBtn></div>
        </div>
      </div>
    </Ground>
  );
}
function V12b() {
  const names = ['Ava', 'Leo', 'Mia', 'Noah', 'Zoe', 'Eli', 'Ivy', 'Max', 'Ruby', 'Sam', 'Lily', 'Owen'];
  return (
    <div className="w-full h-full relative" style={{ ...confetti, padding: 28 }}>
      <div className="h-full grid grid-cols-[1fr_1.3fr] gap-6">
        <div className="p-6 grid content-center justify-items-center gap-3 text-center" style={panel}>
          <b className="text-lg uppercase tracking-wider" style={{ color: PP.quiet }}>Go to the Join page and type</b>
          <span className="font-display text-7xl font-bold tracking-widest px-4 py-2 rounded-2xl" style={{ background: PP.blueCrystal, border: `3px solid ${I}` }}>472915</span>
          <span className="font-bold flex items-center gap-2"><DeviceTabletSpeaker weight="bold" size={22} />Every student on their own device</span>
        </div>
        <div className="p-6 flex flex-col gap-4" style={panel}>
          <div className="flex items-center justify-between"><h2 className="font-display text-3xl font-bold">Lobby</h2><span className="font-bold flex items-center gap-1.5"><UsersThree weight="bold" size={22} />12 here</span></div>
          <div className="flex flex-wrap gap-2 content-start flex-1">{names.map((n, i) => <span key={n} className="px-3 py-1.5 rounded-full font-bold text-lg" style={{ background: [PP.gamify, PP.aqua, PP.blush, PP.butter][i % 4], border: `2.5px solid ${I}` }}>{n}</span>)}</div>
          <div className="flex justify-between items-center"><span className="font-bold flex items-center gap-1.5" style={{ color: PP.quiet }}><Timer weight="bold" size={20} />Waiting for players</span><MainBtn><Play weight="fill" size={20} />Start</MainBtn></div>
        </div>
      </div>
    </div>
  );
}
function V13() {
  return (
    <div className="w-full h-full relative" style={{ background: 'rgba(29,26,51,0.5)' }}>
      <Board dim />
      <div className="absolute inset-0 grid place-items-center">
        <div className="w-[38rem] p-7 grid justify-items-center gap-4 text-center" style={panel}>
          <span className="inline-flex items-center gap-2 px-4 py-1 rounded-full font-bold" style={{ background: PP.butter, border: `2.5px solid ${I}` }}><Lightbulb weight="fill" size={20} />Before we play</span>
          <b style={{ color: PP.quiet }}>Capital letters</b>
          <div className="relative w-44 h-32 grid place-items-center"><BlobPatch color={PP.gamify} size={150} /><span className="relative font-display text-8xl font-bold leading-none">Aa</span></div>
          <p className="font-display text-3xl leading-snug">A sentence starts with a capital letter and ends with punctuation.</p>
          <div className="flex gap-3"><SecondBtn><SpeakerHigh weight="bold" size={20} />Listen</SecondBtn><MainBtn><Play weight="fill" size={20} />Let&apos;s play!</MainBtn></div>
        </div>
      </div>
    </div>
  );
}

const VIEWS: { n: string; name: string; view: ReactNode; changed: string }[] = [
  { n: '1', name: 'Welcome', view: <V1 />, changed: 'Same two columns; the start button turns Gamify purple with ink text so one color always means go, and How to play sits on a paper card over the quiet ground.' },
  { n: '2', name: 'Ways to play', view: <V2 />, changed: 'Only Share, Live and Solo; the pick gets an ink ring and a green check, and Share asks same device or join code right under the cards.' },
  { n: '3', name: 'Question set picker', view: <V3 />, changed: 'Same tabs and set cards; subject color becomes a pastel dot and chip, and the picked set wears an ink ring and a green check.' },
  { n: '4', name: 'Options', view: <V4 />, changed: 'A sliding mint highlight with an ink edge on every choice and tiny grid pictures for sizes, on one paper panel.' },
  { n: '5', name: 'Teams and players', view: <V5 />, changed: 'Every team gets a shape as well as a color, so teams never rely on color alone.' },
  { n: '6', name: 'Power-up setup cards', view: <V6 />, changed: 'No white box: cards centered on the ground with doodle crayon art, name and caption; off is dashed and faded, never crossed out.' },
  { n: '7', name: 'Power-up pop card', view: <V7 />, changed: 'The same pop card with a butter halo, a pastel blob behind the art and doodle confetti on the edges only.' },
  { n: '8', name: 'Question screen (laptop)', view: <V8 />, changed: 'Question text left-aligned and A, B, C, D letter badges in four colors, so each answer has a letter, a color and a place.' },
  { n: '9', name: 'Top strip and scoreboard', view: <V9 />, changed: 'Solo strip has no player icon; the Share scoreboard sits beside the board, the current team glows lemon, held power-ups wait under it.' },
  { n: '10', name: 'Results box', view: <V10 />, changed: 'See-through over the game, Grow Year title, winner big on a stage with a halo and no name caption; Play again, New game, Review, Rate.' },
  { n: '11', name: 'Settings and Calm', view: <V11 />, changed: 'Calm mode becomes the first, biggest row on Blue crystal, with a preview of the calm ground.' },
  { n: '11b', name: 'Pause', view: <V11b />, changed: 'One calm card with a big pause picture; no buttons for students, the teacher resumes.' },
  { n: '12', name: 'Join code', view: <V12 />, changed: 'One box per digit with the next box lit, and Hear my code beside Go.' },
  { n: '12b', name: 'Lobby (big screen)', view: <V12b />, changed: 'The code huge on the left, names popping in on pastel chips on the right, confetti only at the edges.' },
  { n: '13', name: 'Teach card', view: <V13 />, changed: 'Same card; the picture sits on a pastel blob and the skill line stays big and bold, read aloud on its own.' },
];

export default function UniversalViews() {
  return (
    <section className="grid gap-6">
      <div className="grid gap-1">
        <h2 className="font-heading text-2xl">Universal views <span className="text-base align-middle px-2 py-0.5 rounded-full border-2 border-black bg-[#fdfd94]">Proposal</span></h2>
        <p className="text-sm font-semibold text-muted max-w-prose">Every shared screen in the proposed kit (Gamify purple, Blue crystal, ink, cream, quiet doodle ground, doodle crayon power-ups). Based on today&apos;s real screens. Preview only: no live screen changes until you approve.</p>
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        {VIEWS.map((v) => (
          <figure key={v.n} className="m-0 grid gap-3 content-start">
            <figcaption className="font-heading text-lg">{v.n}. {v.name}</figcaption>
            <Laptop>{v.view}</Laptop>
            <p className="text-sm font-semibold"><b>What changed:</b> {v.changed}</p>
          </figure>
        ))}
        <figure className="m-0 grid gap-3 content-start">
          <figcaption className="font-heading text-lg">8. Question screen (iPad portrait)</figcaption>
          <Tablet><V8iPad /></Tablet>
          <p className="text-sm font-semibold"><b>What changed:</b> Answers stack in one column so each target stays big for a finger; same letters and colors as the laptop.</p>
        </figure>
      </div>
    </section>
  );
}
