import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  ArrowLeft, ArrowRight, Broadcast, Check, CornersOut, GearSix, Lightbulb, MagnifyingGlass, Pause,
  PersonArmsSpread, Play, Plus, SpeakerHigh, Star, Television, Toolbox, User, UsersThree, X,
} from '@phosphor-icons/react';
import { PP } from './PaletteProposal';
import { PATTERNS } from './PatternProposal';
import { BlobPatch, CrayonDie, CrayonPowerUp, Doodle, type PowerId } from './CrayonKit';
import { STARTER, StickerArt } from './Stickers';

// Universal views (PROPOSAL, teacher 2026-11-23: "i want to add all the
// universal views to the brand kit like the menu pages, power up cards, etc."
// and "i also want to improve the design of virtually all of the Universal
// views"). Second pass: a modern, simple screen with a playful scrapbook feel
// (taped paper panels, a paper layer behind, sticker accents, Grow Year
// titles), one clear next step per screen, busy patterns only in edge bands
// (about 15% of the screen, never behind words). Content and wording follow
// the real screens; nothing here is wired to a live screen.

const I = PP.ink;
const pat = (id: string, calm = false) => PATTERNS.find((p) => p.id === id)!.make(calm);
const GY: CSSProperties = { fontFamily: 'var(--font-display)', fontWeight: 400, lineHeight: 1 };
// Selected = ink ring plus a Kelly check, never the go color (teacher, 2026-11-23).
const SEL = `0 0 0 4px ${PP.paper}, 0 0 0 8px ${I}`;
const PICK: CSSProperties = { background: PP.mint, color: I, boxShadow: `inset 0 0 0 3px ${I}` };
const LIFT = `0 6px 0 ${I}, 0 18px 32px rgba(29,26,51,0.14)`;
const card: CSSProperties = { background: PP.paper, border: `3px solid ${I}`, borderRadius: 20, boxShadow: `0 4px 0 ${I}` };

// ---------- frames ----------
// Each screen is drawn at a fixed design size and scaled to fit its frame. The
// universal views use 1280 x 800 so a px here is a px on a real laptop.
function Scaled({ w, h, children }: { w: number; h: number; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0.5);
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
export function Laptop({ children, w = 1000 }: { children: ReactNode; w?: number }) {
  return (
    <div className="grid justify-items-center">
      <div className="w-full rounded-t-[1.1rem] p-[2.2%] pb-[2.6%]" style={{ background: '#2a2740', border: `2px solid ${I}` }}>
        <div className="rounded-[0.35rem] overflow-hidden"><Scaled w={w} h={w * 0.625}>{children}</Scaled></div>
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

// ---------- scrapbook parts ----------
function Tape({ x, y, rot = -4, color = PP.butter, w = 110 }: { x: number | string; y: number; rot?: number; color?: string; w?: number }) {
  return <span aria-hidden="true" className="absolute z-10" style={{ left: x, top: y, width: w, height: 30, background: color, opacity: 0.85, transform: `translateX(-50%) rotate(${rot}deg)`, borderLeft: `2px dashed rgba(29,26,51,0.25)`, borderRight: `2px dashed rgba(29,26,51,0.25)` }} />;
}
// A paper panel with a second sheet peeking out behind it.
function Paper({ children, className = '', style, layer = PP.gamify, tilt = 1.6, tape, pad = 32 }: { children: ReactNode; className?: string; style?: CSSProperties; layer?: string; tilt?: number; tape?: string; pad?: number }) {
  return (
    <div className={`relative ${className}`} style={style}>
      <span aria-hidden="true" className="absolute inset-0 rounded-[30px]" style={{ background: layer, border: `3px solid ${I}`, transform: `translate(10px, 10px) rotate(${tilt}deg)` }} />
      <div className="relative h-full rounded-[30px]" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: LIFT, padding: pad }}>{children}</div>
      {tape && <Tape x="50%" y={-14} color={tape} />}
    </div>
  );
}
// Quiet ground behind everything; busy pattern only in a top and bottom band (60px each, 15% of 800).
function Stage({ children, band, pad = 40 }: { children: ReactNode; band?: string; pad?: number }) {
  return (
    <div className="w-full h-full relative" style={pat('quiet')}>
      {band && <><div aria-hidden="true" className="absolute inset-x-0 top-0 h-[60px]" style={{ ...pat(band), borderBottom: `3px solid ${I}` }} />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[60px]" style={{ ...pat(band), borderTop: `3px solid ${I}` }} /></>}
      <div className="absolute inset-0" style={{ padding: band ? `${60 + 24}px ${pad}px` : pad }}>{children}</div>
    </div>
  );
}
function Round({ children, label, size = 52 }: { children: ReactNode; label: string; size?: number }) {
  return <span aria-label={label} className="rounded-full grid place-items-center shrink-0" style={{ width: size, height: size, background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}>{children}</span>;
}
function Tools({ size = 52 }: { size?: number }) {
  const s = Math.round(size * 0.42);
  return (
    <div className="flex gap-3">
      <Round size={size} label="Accessibility"><PersonArmsSpread weight="bold" size={s} /></Round>
      <Round size={size} label="Full screen"><CornersOut weight="bold" size={s} /></Round>
      <Round size={size} label="Settings"><GearSix weight="bold" size={s} /></Round>
      <Round size={size} label="Close"><X weight="bold" size={s} /></Round>
    </div>
  );
}
function Logo() {
  return <span className="text-[34px] px-5 py-2 rounded-2xl inline-block" style={{ ...GY, background: PP.periwinkle, border: `3px solid ${I}`, boxShadow: `0 4px 0 ${PP.grapeDeep}`, transform: 'rotate(-2deg)' }}>Gamify</span>;
}
function MenuTop() {
  return <div className="flex items-center justify-between"><Logo /><Tools /></div>;
}
export function MainBtn({ children, wide, big }: { children: ReactNode; wide?: boolean; big?: boolean }) {
  return (
    <span className={`${wide ? 'w-full' : ''} ${big ? 'min-h-[68px] text-[30px] px-10' : 'min-h-[60px] text-[24px] px-8'} rounded-full font-display font-bold inline-flex items-center justify-center gap-3 whitespace-nowrap shrink-0`}
      style={{ background: PP.periwinkle, color: I, border: `3px solid ${I}`, boxShadow: `0 6px 0 ${PP.grapeDeep}` }}>{children}</span>
  );
}
function SecondBtn({ children, h = 56 }: { children: ReactNode; h?: number }) {
  return <span className="px-6 rounded-full font-bold text-[20px] inline-flex items-center gap-2 shrink-0 whitespace-nowrap" style={{ minHeight: h, background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}` }}>{children}</span>;
}
function Check40({ size = 40 }: { size?: number }) {
  return <span className="rounded-full grid place-items-center" style={{ width: size, height: size, background: PP.kelly, border: `3px solid ${I}` }}><Check weight="bold" size={size * 0.5} /></span>;
}
function Seg({ opts, pick, h = 56, size = 20 }: { opts: string[]; pick: number; h?: number; size?: number }) {
  return (
    <span className="inline-flex p-1.5 rounded-full font-bold gap-1" style={{ background: PP.cream, border: `3px solid ${I}`, fontSize: size }}>
      {opts.map((o, i) => <span key={o} className="px-6 rounded-full inline-flex items-center gap-2" style={{ minHeight: h - 12, ...(i === pick ? PICK : {}) }}>{i === pick && <Check weight="bold" size={size * 0.8} />}{o}</span>)}
    </span>
  );
}
function Wizard({ step, total, title, children, last }: { step: number; total: number; title: string; children: ReactNode; last?: boolean }) {
  return (
    <Stage pad={40}>
      <div className="h-full flex flex-col gap-6">
        <MenuTop />
        <Paper className="flex-1 min-h-0" tape={PP.blush} pad={28}>
          <div className="h-full flex flex-col gap-5">
            <div className="grid justify-items-center gap-3 text-center">
              <span className="text-[15px] font-bold uppercase tracking-widest" style={{ color: PP.quiet }}>Step {step} of {total}</span>
              <h2 className="text-[46px]" style={GY}>{title}</h2>
              <ol className="flex gap-2 list-none p-0 m-0" aria-label="Steps">
                {Array.from({ length: total }, (_, i) => <li key={i} className="w-14 h-4 rounded-full" style={{ background: i < step - 1 ? PP.periwinkle : i === step - 1 ? PP.lemon : PP.paper, border: `2.5px solid ${I}`, boxShadow: i === step - 1 ? `0 0 0 4px ${PP.butter}` : undefined }} />)}
              </ol>
            </div>
            <div className="flex-1 min-h-0 relative flex flex-col items-center justify-center">{children}</div>
            <div className="flex justify-center gap-5 items-center">
              <SecondBtn><ArrowLeft weight="bold" size={20} />Back</SecondBtn>
              <MainBtn>{last ? <><Play weight="fill" size={24} />Play</> : <>Next<ArrowRight weight="bold" size={24} /></>}</MainBtn>
            </div>
          </div>
        </Paper>
      </div>
    </Stage>
  );
}
// Shape plus color for every team, so color is never the only cue (WCAG 1.4.1).
export const TEAMS = [
  { name: 'Team Purple', color: PP.periwinkle, shape: 'circle', text: I, soft: PP.gamify },
  { name: 'Team Sky', color: PP.sky, shape: 'star', text: I, soft: PP.blueCrystal },
  { name: 'Team Pink', color: PP.pink, shape: 'triangle', text: I, soft: PP.blush },
  { name: 'Team Lemon', color: PP.lemon, shape: 'square', text: I, soft: PP.butter },
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
    <div className="w-full h-full relative" style={pat('cutpaper-pastel')}>
      <div className="absolute inset-[56px] grid grid-cols-8 grid-rows-5 gap-2 p-3 rounded-[24px]" style={{ background: PP.paper, border: `3px solid ${I}` }}>
        {Array.from({ length: 40 }, (_, i) => <span key={i} className="rounded-xl" style={{ background: [PP.paper, PP.butter, PP.gamify, PP.aqua, PP.blush][i % 5], border: `2.5px solid ${I}` }} />)}
      </div>
      {dim && <div className="absolute inset-0" style={{ background: 'rgba(29,26,51,0.5)' }} />}
    </div>
  );
}
const sticker = (id: string) => STARTER.find((s) => s.id === id) ?? STARTER[0];
function Corner({ id, x, y, rot, size = 110 }: { id: string; x: string; y: string; rot: number; size?: number }) {
  return <span aria-hidden="true" className="absolute z-20" style={{ left: x, top: y, transform: `rotate(${rot}deg)` }}><StickerArt s={sticker(id)} size={size} /></span>;
}

// ---------- the views ----------
function V1() {
  const steps: [string, ReactNode][] = [['Answer the question', <Check key="a" weight="bold" size={26} />], ['Roll the die', <Star key="b" weight="fill" size={26} />], ['Move to the finish', <ArrowRight key="c" weight="bold" size={26} />]];
  return (
    <Stage band="cutpaper" pad={48}>
      <div className="absolute right-12 top-[84px]"><Tools /></div>
      <div className="h-full grid grid-cols-[1.15fr_1fr] gap-12 items-center">
        <Paper layer={PP.butter} tilt={-2} tape={PP.aqua} pad={0} className="h-[560px]">
          <div className="relative h-full rounded-[27px] overflow-hidden grid place-items-center" style={pat('cutpaper-pastel')}>
            <div className="relative w-[300px] h-[300px] grid place-items-center"><BlobPatch color={PP.gamify} size={320} /><span className="relative"><CrayonDie value={5} size={210} /></span></div>
          </div>
        </Paper>
        <div className="flex flex-col items-center text-center gap-7 pt-10">
          <div className="grid gap-4 justify-items-center">
            <h1 className="text-[84px]" style={GY}>Board Game</h1>
            <p className="font-semibold text-[24px] leading-snug" style={{ color: PP.quiet }}>Answer, roll the die and race to the finish.</p>
            <div className="flex gap-2">{([['Share', PP.gamify], ['Live', PP.aqua], ['Solo', PP.butter]] as const).map(([m, c]) => <span key={m} className="px-4 py-1.5 rounded-full font-bold text-[18px]" style={{ background: c, border: `2.5px solid ${I}` }}>{m}</span>)}</div>
          </div>
          <div className="grid gap-3 w-[420px]">
            {steps.map(([s, ic], i) => (
              <div key={s} className="flex items-center gap-4 font-bold text-[24px]">
                <span className="w-14 h-14 rounded-full grid place-items-center text-[28px] shrink-0" style={{ ...GY, background: [PP.butter, PP.blush, PP.aqua][i], border: `3px solid ${I}` }}>{i + 1}</span>
                <span className="flex-1">{s}</span><span style={{ color: PP.quiet }}>{ic}</span>
              </div>
            ))}
          </div>
          <MainBtn wide big><Play weight="fill" size={30} />Set up and play</MainBtn>
        </div>
      </div>
    </Stage>
  );
}
function V2() {
  const ways = [
    { id: 'Share', hint: 'Play together on one screen', icon: <Television weight="fill" size={110} />, bg: PP.gamify, on: true },
    { id: 'Live', hint: 'Play together on your own devices', icon: <Broadcast weight="fill" size={110} />, bg: PP.aqua },
    { id: 'Solo', hint: 'Play on your own', icon: <User weight="fill" size={110} />, bg: PP.butter },
  ];
  return (
    <Wizard step={1} total={5} title="How will you play?">
      <div className="h-full flex flex-col items-center justify-center gap-7">
        <div className="flex gap-8">
          {ways.map((w) => (
            <div key={w.id} className="relative w-[260px] h-[250px] rounded-[24px] flex flex-col" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: w.on ? `${SEL}, 0 10px 0 ${I}` : `0 5px 0 ${I}`, transform: w.on ? 'translateY(-6px)' : undefined }}>
              <span className="flex-1 grid place-items-center rounded-t-[21px]" style={{ background: w.bg, borderBottom: `3px solid ${I}` }}>{w.icon}</span>
              <span className="px-4 py-3"><b className="text-[32px] block" style={GY}>{w.id}</b><span className="text-[17px] font-semibold">{w.hint}</span></span>
              {w.on && <span className="absolute -top-4 -right-4"><Check40 /></span>}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 font-bold text-[20px]"><span>How do you share?</span><Seg opts={['Same device', 'Share a join code']} pick={0} /></div>
      </div>
    </Wizard>
  );
}
function V3() {
  const sets = [
    ['Capital letters', 'ELA', 'K-2', 12, PP.pink, 'Which word needs a capital letter?'], ['Short vowels', 'ELA', 'K-1', 16, PP.periwinkle, 'Which word has a short a?'],
    ['Add within 20', 'Math', '1-2', 20, PP.lemon, 'What is 8 + 5?'], ['Punctuation', 'ELA', '2-3', 10, PP.sky, 'Which sentence ends with a question mark?'],
    ['Plants and seeds', 'Science', '2-4', 14, PP.kelly, 'What does a seed need to grow?'], ['Place value', 'Math', '2-3', 18, PP.orange, 'What is the value of the 4 in 46?'],
  ] as const;
  return (
    <Wizard step={2} total={5} title="Question set">
      <div className="w-full flex items-center justify-center gap-4 mb-5">
        <Seg opts={['My sets', 'Public sets']} pick={0} h={52} size={18} />
        <span className="w-[440px] h-[52px] px-5 rounded-full flex items-center gap-3 font-semibold text-[18px]" style={{ background: PP.paper, border: `3px solid ${I}`, color: PP.quiet }}><MagnifyingGlass weight="bold" size={22} />Search sets</span>
      </div>
      <div className="w-full grid grid-cols-3 gap-5">
        {sets.map(([name, sub, gr, n, c, q], i) => (
          <div key={name} className="relative flex overflow-hidden" style={{ ...card, boxShadow: i === 0 ? `${SEL}, 0 4px 0 ${I}` : card.boxShadow }}>
            <span className="w-3 shrink-0" style={{ background: c, borderRight: `2.5px solid ${I}` }} />
            <div className="flex-1 p-4 grid gap-2 min-w-0 justify-items-center text-center">
              <b className="text-[21px] leading-tight">{name}</b>
              <span className="text-[15px] font-semibold truncate" style={{ color: PP.quiet }}>{q}</span>
              <div className="flex gap-1.5 text-[14px] font-bold whitespace-nowrap">{[sub, `Grades ${gr}`, `${n} questions`].map((x) => <span key={x} className="px-2.5 py-0.5 rounded-full" style={{ border: `2px solid ${I}` }}>{x}</span>)}</div>
            </div>
            {i === 0 && <span className="absolute top-2 right-2"><Check40 size={34} /></span>}
          </div>
        ))}
      </div>
    </Wizard>
  );
}
function Group({ title, children }: { title: string; children: ReactNode }) {
  return <div className="p-6 grid gap-5 content-start justify-items-center text-center" style={{ ...card, background: PP.cream }}><h3 className="text-[15px] font-bold uppercase tracking-widest" style={{ color: PP.quiet }}>{title}</h3>{children}</div>;
}
function Row({ label, children }: { label: string; children: ReactNode }) {
  return <div className="grid justify-items-center gap-3"><b className="text-[22px]">{label}</b>{children}</div>;
}
function V4() {
  return (
    <Wizard step={3} total={5} title="Options">
      <div className="w-full grid grid-cols-2 gap-6 content-center">
        <Group title="The game">
          <Row label="Rounds">
            <span className="relative w-[300px] h-5 rounded-full" style={{ background: PP.blueCrystal, border: `3px solid ${I}` }}>
              <span className="absolute inset-y-0 left-0 w-1/2 rounded-full" style={{ background: PP.periwinkle }} />
              <span className="absolute -top-[18px] left-1/2 -translate-x-1/2 w-12 h-12 rounded-full grid place-items-center text-[22px]" style={{ ...GY, background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}>10</span>
            </span>
          </Row>
          <Row label="Board size">
            <div className="flex gap-3">{[3, 4, 5].map((n, i) => (
              <span key={n} className="relative w-[76px] h-[76px] p-2 grid gap-0.5 rounded-xl" style={{ gridTemplateColumns: `repeat(${n}, 1fr)`, background: PP.paper, border: `3px solid ${I}`, boxShadow: i === 1 ? SEL : undefined }}>
                {Array.from({ length: n * n }, (_, k) => <span key={k} className="rounded-sm" style={{ background: PP.gamify }} />)}
                {i === 1 && <span className="absolute -top-3 -right-3"><Check40 size={28} /></span>}
              </span>))}</div>
          </Row>
        </Group>
        <Group title="Help for players">
          <Row label="Timer"><Seg opts={['Off', '30 s', '60 s']} pick={0} h={52} size={18} /></Row>
          <Row label="Read aloud"><Seg opts={['On', 'Off']} pick={0} h={52} size={18} /></Row>
        </Group>
      </div>
    </Wizard>
  );
}
function V5() {
  return (
    <Wizard step={4} total={5} title="Teams">
      <div className="w-full grid gap-6 content-center">
        <div className="flex items-center justify-center gap-4 font-bold text-[20px]"><span>How many teams?</span><Seg opts={['2', '3', '4']} pick={2} /></div>
        <div className="grid grid-cols-4 gap-5">
          {TEAMS.map((t, i) => (
            <div key={t.name} className="relative" style={{ ...card, transform: `rotate(${[-1, 0.8, -0.6, 1][i]}deg)` }}>
              <div className="h-[72px] grid place-items-center rounded-t-[17px]" style={{ background: t.soft, borderBottom: `3px solid ${I}` }}><span className="w-14 h-14 rounded-full grid place-items-center" style={{ background: PP.paper, border: `3px solid ${I}` }}><Badge t={t} size={38} /></span></div>
              <div className="p-4 grid gap-3">
                <span className="h-12 px-4 rounded-xl flex items-center justify-center font-bold text-[19px]" style={{ background: PP.paper, border: `2.5px solid ${I}` }}>{t.name}</span>
                <div className="flex flex-wrap justify-center gap-1.5 text-[16px] font-bold">{['Ava', 'Leo', 'Mia'].map((n) => <span key={n} className="px-3 py-1 rounded-full" style={{ background: t.soft, border: `2px solid ${I}` }}>{n}</span>)}
                  <span className="px-3 py-1 rounded-full inline-flex items-center gap-1" style={{ border: `2px dashed ${PP.quiet}`, color: PP.quiet }}><Plus weight="bold" size={14} />Add</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Wizard>
  );
}
const SETUP: { id: PowerId; name: string; job: string; on: boolean; soft: string }[] = [
  { id: 'double-points', name: 'Double Points', job: 'Your next points count twice.', on: true, soft: PP.butter },
  { id: 'shield', name: 'Shield', job: 'Stops the next bad thing.', on: true, soft: PP.blueCrystal },
  { id: 'freeze', name: 'Freeze', job: 'Stops the clock for a bit.', on: true, soft: PP.aqua },
  { id: 'hint', name: 'Hint', job: 'Shows a clue for this question.', on: true, soft: PP.gamify },
  { id: 'tornado', name: 'Tornado', job: 'Mixes up the board.', on: false, soft: PP.lavender },
  { id: 'mystery-box', name: 'Mystery Box', job: 'Opens a surprise power-up.', on: true, soft: PP.blush },
];
function V6() {
  // Her rules: no white box, cards centered straight on the ground (2026-11-13, 11-23).
  return (
    <Stage pad={40}>
      <div className="h-full flex flex-col items-center gap-5">
        <div className="w-full"><MenuTop /></div>
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="relative px-8 py-2 rounded-2xl" style={{ background: PP.paper, border: `3px solid ${I}`, transform: 'rotate(-1deg)' }}>
          <Tape x="50%" y={-14} color={PP.blush} w={90} />
          <span className="text-[15px] font-bold uppercase tracking-widest mr-3" style={{ color: PP.quiet }}>Step 5 of 5</span><span className="text-[42px] align-middle" style={GY}>Power-ups</span>
        </div>
        <div className="grid grid-cols-3 gap-x-6 gap-y-5">
          {SETUP.map((c, i) => (
            <div key={c.id} className="relative w-[300px] h-[176px] grid justify-items-center content-center gap-1.5 text-center rounded-[22px]"
              style={c.on ? { background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 6px 0 ${I}`, transform: `rotate(${[-1, 0.6, -0.4, 0.8, 0, -0.8][i]}deg)` } : { background: PP.cream, border: `3px dashed ${PP.quiet}` }}>
              <span className="relative w-[80px] h-[80px] grid place-items-center" style={c.on ? undefined : { filter: 'grayscale(1)', opacity: 0.5 }}><BlobPatch color={c.soft} size={88} /><span className="relative"><CrayonPowerUp id={c.id} size={70} /></span></span>
              <b className="text-[23px] leading-tight" style={c.on ? undefined : { color: PP.quiet }}>{c.name}</b>
              <span className="text-[16px] font-semibold leading-snug" style={{ color: PP.quiet }}>{c.job}</span>
              <span className="absolute -top-3.5 -right-3.5">{c.on ? <Check40 /> : <span className="w-10 h-10 rounded-full grid place-items-center" style={{ background: PP.paper, border: `3px solid ${PP.quiet}`, color: PP.quiet }}><X weight="bold" size={18} /></span>}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-5 items-center"><SecondBtn><ArrowLeft weight="bold" size={20} />Back</SecondBtn><MainBtn big><Play weight="fill" size={28} />Play</MainBtn></div>
        </div>
      </div>
    </Stage>
  );
}
function V7() {
  return (
    <div className="w-full h-full relative">
      <Board dim />
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative">
          <span aria-hidden="true" className="absolute left-1/2 top-[36%] -translate-x-1/2 -translate-y-1/2 w-[620px] h-[620px] rounded-full" style={{ background: `repeating-conic-gradient(${PP.butter} 0 10deg, transparent 10deg 20deg)`, maskImage: 'radial-gradient(circle, #000 30%, transparent 70%)', WebkitMaskImage: 'radial-gradient(circle, #000 30%, transparent 70%)', opacity: 0.6 }} />
          <Paper layer={PP.butter} tape={PP.pink} pad={0} className="w-[540px]">
            <div className="relative px-10 pt-12 pb-10 grid justify-items-center gap-3 text-center">
              <span className="absolute top-4 right-4"><Round label="Close"><X weight="bold" size={24} /></Round></span>
              <div className="relative w-[210px] h-[210px] grid place-items-center"><BlobPatch color={PP.butter} size={220} /><span className="relative"><CrayonPowerUp id="double-points" size={176} /></span></div>
              <b className="text-[56px] whitespace-nowrap" style={GY}>Double Points!</b>
              <span className="font-bold text-[24px] leading-snug">Your next points count twice.</span>
            </div>
          </Paper>
          {(['sparkle', 'star', 'dot', 'sparkle', 'heart'] as const).map((k, i) => <Doodle key={i} kind={k} color={[PP.lemon, PP.pink, PP.sky, PP.kelly, PP.pink][i]} size={36} className="absolute" style={{ left: ['-12%', '104%', '-9%', '102%', '46%'][i], top: ['12%', '22%', '74%', '82%', '106%'][i] }} />)}
        </div>
      </div>
    </div>
  );
}
const ANS = [['A', 'the dog ran.', PP.periwinkle, PP.gamify], ['B', 'The dog ran.', PP.sky, PP.blueCrystal], ['C', 'The dog ran', PP.pink, PP.blush], ['D', 'the dog ran', PP.lemon, PP.butter]] as const;
function QTop({ k = 1 }: { k?: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="px-6 rounded-full inline-flex items-center gap-2.5 font-bold" style={{ minHeight: 60 * k, fontSize: 22 * k, background: PP.blueCrystal, border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}` }}><SpeakerHigh weight="bold" size={26 * k} />Listen</span>
      <span className="flex-1 flex justify-center"><span className="px-4 py-1.5 rounded-full font-bold" style={{ fontSize: 17 * k, background: PP.paper, border: `2.5px solid ${I}` }}>Question 3 of 10</span></span>
      <Round size={48 * k} label="Tools"><Toolbox weight="bold" size={20 * k} /></Round>
      <Round size={48 * k} label="Settings"><GearSix weight="bold" size={20 * k} /></Round>
      <Round size={48 * k} label="Close"><X weight="bold" size={20 * k} /></Round>
    </div>
  );
}
function Answers({ cols, big }: { cols: number; big?: boolean }) {
  return (
    <div className="grid gap-5 flex-1" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {ANS.map(([l, txt, c, bg]) => (
        <div key={l} className="flex items-center gap-5 px-6 rounded-[24px] font-bold" style={{ fontSize: big ? 52 : 42, background: bg, border: `3px solid ${I}`, boxShadow: `0 6px 0 ${I}` }}>
          <span className="shrink-0 rounded-full grid place-items-center" style={{ ...GY, width: big ? 96 : 76, height: big ? 96 : 76, fontSize: big ? 52 : 42, background: c, border: `3px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}>{l}</span>{txt}
        </div>
      ))}
    </div>
  );
}
function V8() {
  return (
    <div className="w-full h-full p-8 flex flex-col gap-6" style={pat('wash')}>
      <QTop />
      <Paper tape={PP.aqua} pad={28} layer={PP.blueCrystal}><h2 className="text-[46px] font-bold leading-snug text-left">Which one starts with a capital letter and ends with punctuation?</h2></Paper>
      <Answers cols={2} />
    </div>
  );
}
function V8iPad() {
  return (
    <div className="w-full h-full p-8 flex flex-col gap-8" style={pat('wash')}>
      <QTop k={1.15} />
      <Paper tape={PP.aqua} pad={32} layer={PP.blueCrystal}><h2 className="text-[60px] font-bold leading-tight text-left">Which one starts with a capital letter and ends with punctuation?</h2></Paper>
      <Answers cols={1} big />
    </div>
  );
}
function V9() {
  return (
    <div className="w-full h-full relative p-8 flex flex-col gap-6" style={pat('cutpaper-pastel')}>
      <div className="flex items-center gap-5 px-6 py-3" style={{ ...card, boxShadow: LIFT }}>
        <span className="text-[60px] tabular-nums" style={GY}>120</span>
        <span className="flex-1 flex gap-3">{[0, 1, 2].map((r) => (
          <span key={r} className="flex-1 flex gap-1.5 p-1.5 rounded-full" style={{ background: PP.cream, border: `2.5px solid ${I}` }}>
            {[0, 1, 2, 3].map((m) => { const k = r * 4 + m; return <span key={m} className="flex-1 h-4 rounded-full" style={k < 5 ? { background: PP.kelly } : k === 5 ? { background: PP.lemon, boxShadow: `0 0 0 2.5px ${I}, 0 0 0 6px ${PP.butter}` } : { border: `2px solid ${PP.quiet}` }} />; })}
          </span>))}</span>
        <Tools size={48} />
      </div>
      <div className="flex-1 min-h-0 grid grid-cols-[1fr_340px] gap-6">
        <div className="grid grid-cols-6 grid-rows-4 gap-2 p-3 rounded-[24px]" style={{ background: PP.paper, border: `3px solid ${I}` }}>
          {Array.from({ length: 24 }, (_, i) => <span key={i} className="rounded-xl" style={{ background: [PP.paper, PP.butter, PP.gamify, PP.aqua][i % 4], border: `2.5px solid ${I}` }} />)}
        </div>
        <Paper pad={18} tape={PP.butter} tilt={1}>
          <div className="grid gap-3">
            <b className="text-[30px] text-center" style={GY}>Scores</b>
            {TEAMS.map((t, i) => (
              <div key={t.name} className="flex items-center gap-3 px-3 h-[60px] rounded-2xl" style={{ background: i === 1 ? PP.butter : t.soft, border: `3px solid ${I}`, boxShadow: i === 1 ? `0 0 0 6px ${PP.lemon}, 0 4px 0 ${I}` : `0 3px 0 ${I}` }}>
                <Badge t={t} size={34} /><b className="flex-1 text-[19px] truncate">{t.name}</b><span className="text-[34px] tabular-nums" style={GY}>{[80, 110, 60, 95][i]}</span>
              </div>
            ))}
            <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-2xl text-[15px] font-bold text-center" style={{ background: PP.paper, border: `2.5px dashed ${I}` }}><CrayonPowerUp id="shield" size={40} />Shield waits for Team Sky's next turn</div>
          </div>
        </Paper>
      </div>
    </div>
  );
}
function V10() {
  return (
    <div className="w-full h-full relative">
      <Board dim />
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative">
          <Paper layer={PP.blush} tilt={-1.5} pad={0} className="w-[820px]">
            <div className="h-[64px] rounded-t-[27px]" aria-hidden="true" style={{ ...pat('doodle'), borderBottom: `3px solid ${I}` }} />
            <div className="px-10 pt-6 pb-8 grid justify-items-center gap-6 text-center">
              <h2 className="text-[80px]" style={GY}>Great game!</h2>
              <div className="flex items-end gap-6">
                {[1, 0, 2].map((i) => { const t = TEAMS[i]; return (
                  <div key={t.name} className="grid justify-items-center gap-2">
                    {i === 0
                      ? <span className="relative w-[150px] h-[150px] grid place-items-center"><span className="absolute inset-0 rounded-full" style={{ background: `repeating-conic-gradient(${PP.butter} 0 12deg, ${PP.lemon} 12deg 24deg)`, border: `3px solid ${I}` }} /><span className="relative w-[104px] h-[104px] rounded-full grid place-items-center" style={{ background: PP.paper, border: `3px solid ${I}` }}><Badge t={t} size={74} /></span></span>
                      : <Badge t={t} size={60} />}
                    <span className="w-[150px] rounded-t-[20px] grid place-items-center text-[44px]" style={{ ...GY, height: [150, 110, 80][i], background: i === 0 ? PP.periwinkle : t.soft, border: `3px solid ${I}` }}>{i + 1}</span>
                  </div>); })}
              </div>
              <div className="flex gap-4 justify-center items-center"><MainBtn big><Play weight="fill" size={26} />Play again</MainBtn><SecondBtn>New game</SecondBtn><SecondBtn>Review</SecondBtn><SecondBtn><Star weight="fill" size={20} />Rate</SecondBtn></div>
            </div>
          </Paper>
          <Corner id="star" x="-56px" y="40px" rot={-14} />
          <Corner id="balloon" x="768px" y="150px" rot={12} />
        </div>
      </div>
    </div>
  );
}
function Toggle({ on }: { on: boolean }) {
  return <span className="w-[68px] h-10 rounded-full relative shrink-0" style={{ background: on ? PP.kelly : PP.cream, border: `3px solid ${I}` }}><span className="absolute top-[3px] w-7 h-7 rounded-full grid place-items-center" style={{ left: on ? 32 : 3, background: PP.paper, border: `2.5px solid ${I}` }}>{on && <Check weight="bold" size={14} />}</span></span>;
}
function V11() {
  return (
    <div className="w-full h-full relative">
      <Board dim />
      <div className="absolute inset-0 grid place-items-center">
        <Paper pad={28} className="w-[880px]" tape={PP.mint}>
          <div className="relative flex items-center justify-center mb-5"><h2 className="text-[52px]" style={GY}>Settings</h2><span className="absolute right-0"><Round label="Close"><X weight="bold" size={24} /></Round></span></div>
          <div className="grid grid-cols-[220px_1fr] gap-6">
            <div className="grid gap-2 content-start">{['Sound', 'Motion', 'Reading', 'Tools'].map((o, i) => <span key={o} className="h-14 px-5 rounded-2xl flex items-center justify-center font-bold text-[20px]" style={i === 1 ? PICK : { border: `2.5px solid transparent` }}>{o}</span>)}</div>
            <div className="grid gap-3">
              <div className="flex items-center gap-5 p-5 rounded-[22px]" style={{ background: PP.blueCrystal, border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}` }}>
                <span className="relative w-16 h-16 grid place-items-center shrink-0"><BlobPatch color={PP.paper} size={70} /><span className="relative"><Doodle kind="heart" color={PP.lavender} size={34} /></span></span>
                <div className="flex-1"><b className="text-[26px] block">Calm mode</b><span className="font-semibold text-[17px]" style={{ color: PP.quiet }}>Softer sounds, still pictures, quiet ground.</span></div><Toggle on />
              </div>
              {([['Motion', false], ['Sound effects', true], ['Music', false]] as const).map(([l, on]) => <div key={l} className="flex items-center justify-between px-5 h-[60px] rounded-2xl font-bold text-[21px]" style={{ background: PP.cream, border: `2.5px solid ${I}` }}>{l}<Toggle on={on} /></div>)}
            </div>
          </div>
        </Paper>
      </div>
    </div>
  );
}
function V11b() {
  return (
    <div className="w-full h-full relative">
      <Board dim />
      <div className="absolute inset-0 grid place-items-center">
        <Paper pad={44} className="w-[600px]" tape={PP.blueCrystal} layer={PP.blueCrystal}>
          <div className="grid justify-items-center gap-4 text-center">
            <span className="relative w-36 h-36 grid place-items-center"><BlobPatch color={PP.blueCrystal} size={150} /><span className="relative w-24 h-24 rounded-full grid place-items-center" style={{ background: PP.paper, border: `3px solid ${I}` }}><Pause weight="fill" size={52} /></span></span>
            <h2 className="text-[68px]" style={GY}>Paused</h2>
            <p className="font-bold text-[26px] leading-snug">Your teacher paused the game. It will be back soon.</p>
          </div>
        </Paper>
      </div>
    </div>
  );
}
function V12() {
  return (
    <Stage band="cutpaper" pad={40}>
      <div className="h-full grid place-items-center">
        <Paper pad={44} className="w-[720px]" tape={PP.butter} layer={PP.aqua} tilt={-1.5}>
          <div className="grid justify-items-center gap-5 text-center">
            <h1 className="text-[72px]" style={GY}>Join the game</h1>
            <p className="font-semibold text-[22px]" style={{ color: PP.quiet }}>Type the game code your teacher gave you.</p>
            <div className="flex gap-3">{['4', '7', '2', '9', '', ''].map((d, i) => <span key={i} className="w-[84px] h-[100px] rounded-2xl grid place-items-center text-[60px]" style={{ ...GY, background: i === 4 ? PP.butter : PP.paper, border: `3px solid ${I}`, boxShadow: i === 4 ? `0 0 0 5px ${PP.lemon}` : `0 4px 0 ${I}`, marginLeft: i === 3 ? 18 : 0 }}>{d}</span>)}</div>
            <div className="flex gap-4 items-center"><SecondBtn h={60}><SpeakerHigh weight="bold" size={22} />Hear my code</SecondBtn><MainBtn big>Go<ArrowRight weight="bold" size={28} /></MainBtn></div>
          </div>
        </Paper>
      </div>
    </Stage>
  );
}
function V12b() {
  const names = ['Ava', 'Leo', 'Mia', 'Noah', 'Zoe', 'Eli', 'Ivy', 'Max', 'Ruby', 'Sam', 'Lily', 'Owen'];
  const soft = [PP.gamify, PP.aqua, PP.blush, PP.butter, PP.mint, PP.peach];
  return (
    <Stage band="confetti" pad={40}>
      <div className="h-full grid grid-cols-[1fr_1.25fr] gap-10">
        <Paper pad={32} tape={PP.pink} tilt={-1.5} layer={PP.butter}>
          <div className="h-full grid content-center justify-items-center gap-5 text-center">
            <b className="text-[22px]">Go to the Join page and type</b>
            <span className="text-[88px] whitespace-nowrap px-6 py-3 rounded-[24px]" style={{ ...GY, background: PP.blueCrystal, border: `3px solid ${I}` }}>472 915</span>
            <span className="font-bold text-[19px]" style={{ color: PP.quiet }}>Every student on their own device</span>
          </div>
        </Paper>
        <Paper pad={28} tape={PP.aqua}>
          <div className="h-full flex flex-col gap-5">
            <div className="grid justify-items-center gap-3"><h2 className="text-[52px]" style={GY}>Lobby</h2><span className="flex items-center gap-2 px-4 h-12 rounded-full font-bold text-[22px]" style={{ background: PP.mint, border: `3px solid ${I}` }}><UsersThree weight="bold" size={26} />12 here</span></div>
            <div className="flex flex-wrap justify-center gap-3 content-center flex-1">{names.map((n, i) => <span key={n} className="px-5 h-12 rounded-full font-bold text-[22px] flex items-center" style={{ background: soft[i % 6], border: `3px solid ${I}`, boxShadow: `0 3px 0 ${I}`, transform: `rotate(${[-2, 1, -1, 2, 0, -1.5][i % 6]}deg)` }}>{n}</span>)}</div>
            <div className="flex justify-center"><MainBtn big><Play weight="fill" size={28} />Start</MainBtn></div>
          </div>
        </Paper>
      </div>
    </Stage>
  );
}
function V13() {
  return (
    <div className="w-full h-full relative">
      <Board dim />
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative">
          <Paper pad={40} className="w-[780px]" tape={PP.butter} layer={PP.gamify}>
            <div className="grid justify-items-center gap-4 text-center">
              <span className="inline-flex items-center gap-2 px-5 h-11 rounded-full font-bold text-[19px]" style={{ background: PP.butter, border: `3px solid ${I}` }}><Lightbulb weight="fill" size={22} />Before we play</span>
              <div className="relative w-[230px] h-[170px] grid place-items-center"><BlobPatch color={PP.gamify} size={200} /><span className="relative text-[130px]" style={GY}>Aa</span></div>
              <p className="font-bold text-[38px] leading-snug">A sentence starts with a capital letter and ends with punctuation.</p>
              <div className="flex gap-4 items-center"><SecondBtn h={60}><SpeakerHigh weight="bold" size={22} />Listen</SecondBtn><MainBtn big><Play weight="fill" size={26} />Let&apos;s play!</MainBtn></div>
            </div>
          </Paper>
          <Corner id="bulb" x="700px" y="-40px" rot={14} size={100} />
        </div>
      </div>
    </div>
  );
}

const VIEWS: { n: string; name: string; view: ReactNode; problem: string; changed: string }[] = [
  { n: '1', name: 'Welcome', view: <V1 />, problem: 'Title, steps and button were all the same weight; the cover was busy confetti right beside the words.',
    changed: 'Grow Year title at 84px, three numbered steps with no box, a 68px start button; the busy pattern moves to two edge bands and the cover is a taped paper print.' },
  { n: '2', name: 'Ways to play', view: <V2 />, problem: 'Cards were small for the space and the share question was a tiny pill.',
    changed: 'Cards grow to 260px and the picked one lifts with an ink ring and green check; the share question is a 56px choice.' },
  { n: '3', name: 'Question set picker', view: <V3 />, problem: 'Chips were 12px and nothing showed what was inside a set.',
    changed: 'Laptop-dense teacher cards: a subject color edge, the first question as a preview line, 14px chips that never wrap.' },
  { n: '4', name: 'Options', view: <V4 />, problem: 'Four loose controls floated in empty space.',
    changed: 'Two labeled groups (the game, help for players) with 56px rows and the slider value shown on its knob.' },
  { n: '5', name: 'Teams and players', view: <V5 />, problem: 'Name fields and player chips were too small to tap; no way to add a player.',
    changed: 'Taped team cards, a 48px name field, pastel player chips and a dashed Add chip; shape plus color stays.' },
  { n: '6', name: 'Power-up setup cards', view: <V6 />, problem: 'Captions were tiny and the Play button was the same size as Back.',
    changed: 'Still no white box: 300px cards on the ground, art on a pastel blob, 16px captions, two rows that fit with no scroll, a 68px Play.' },
  { n: '7', name: 'Power-up pop card', view: <V7 />, problem: 'The card was small against a whole screen and the moment felt flat.',
    changed: 'A 540px taped card with soft sun rays behind, the art at 176px, a 58px Grow Year name.' },
  { n: '8', name: 'Question screen (laptop)', view: <V8 />, problem: 'Listen looked like every other icon and the question sat on the same panel as the answers.',
    changed: 'Listen is a 60px pill, the question has its own taped card, answers are tall tiles with 76px letter badges and a progress chip.' },
  { n: '9', name: 'Top strip and scoreboard', view: <V9 />, problem: 'A note was printed inside the mockup and the scoreboard rows were thin.',
    changed: 'Solo strip with no player icon and a lemon glow on this turn; a taped Scores card with 60px rows and the held power-up under it.' },
  { n: '10', name: 'Results box', view: <V10 />, problem: 'Box and buttons were small and Rate wrapped to a second row.',
    changed: '820px box with a doodle band on top, an 80px title, the winner on a sun badge, one button row led by a 68px Play again, two sticker accents.' },
  { n: '11', name: 'Settings and Calm', view: <V11 />, problem: 'Tabs were tiny and the calm preview strip said nothing.',
    changed: 'Side tabs, Calm mode as the first and biggest row, 60px rows and 68px toggles with a check when on.' },
  { n: '11b', name: 'Pause', view: <V11b />, problem: 'Fine, but small for a projector.',
    changed: 'A bigger calm card with the pause picture on a pastel blob and 26px words; no buttons for students.' },
  { n: '12', name: 'Join code', view: <V12 />, problem: 'A small box in a big empty ground.',
    changed: 'A taped 720px card, 84px digit boxes in two groups of three, the next box lit lemon, a 68px Go.' },
  { n: '12b', name: 'Lobby (big screen)', view: <V12b />, problem: 'The code panel was mostly empty and names were small from the back of a room.',
    changed: 'The code at 88px in two chunks of three (easier to copy), names on tilted 48px pastel chips, a count badge and a 68px Start.' },
  { n: '13', name: 'Teach card', view: <V13 />, problem: 'The picture and the words competed at the same size.',
    changed: 'A taped card, the picture on a pastel blob, the skill line at 38px, a 68px Let’s play and one sticker accent.' },
];

export default function UniversalViews() {
  return (
    <section className="grid gap-6">
      <div className="grid gap-1">
        <h2 className="font-heading text-2xl">Universal views <span className="text-base align-middle px-2 py-0.5 rounded-full border-2 border-black bg-[#fdfd94]">Proposal</span></h2>
        <p className="text-sm font-semibold text-muted max-w-prose">Every shared screen, second pass: taped paper panels, sticker accents and Grow Year titles; Gamify purple means go, an ink ring and green check mean picked, a lemon glow means your turn. Busy patterns stay in edge bands. Based on today&apos;s real screens. Preview only: no live screen changes until you approve.</p>
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        {VIEWS.map((v) => (
          <figure key={v.n} className="m-0 grid gap-3 content-start">
            <figcaption className="font-heading text-lg">{v.n}. {v.name}</figcaption>
            <Laptop w={1280}>{v.view}</Laptop>
            <p className="text-sm font-semibold text-muted"><b>First pass problem:</b> {v.problem}</p>
            <p className="text-sm font-semibold -mt-2"><b>What changed:</b> {v.changed}</p>
          </figure>
        ))}
        <figure className="m-0 grid gap-3 content-start">
          <figcaption className="font-heading text-lg">8. Question screen (iPad portrait)</figcaption>
          <Tablet><V8iPad /></Tablet>
          <p className="text-sm font-semibold text-muted"><b>First pass problem:</b> Words were small for a finger and an arm&apos;s length away.</p>
          <p className="text-sm font-semibold -mt-2"><b>What changed:</b> Answers stack in one column, 96px letter badges and 52px words; same letters and colors as the laptop.</p>
        </figure>
      </div>
    </section>
  );
}
