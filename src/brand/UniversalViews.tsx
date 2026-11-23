import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  ArrowRight, Broadcast, CaretDown, Check, CornersOut, GearSix, Lightbulb, MagnifyingGlass, Pause,
  PersonArmsSpread, Play, Plus, SpeakerHigh, Star, Television, Toolbox, User, UsersThree, X,
} from '@phosphor-icons/react';
import { PP } from './PaletteProposal';
import { BlobPatch, CrayonDie, CrayonPowerUp, Doodle, type PowerId } from './CrayonKit';
import { STARTER, StickerArt } from './Stickers';
import { Badge, LakeBack, MenuStep, WelcomeScreen, ParkBack, PURPLE_GROUND, SkyBack, StudioBack, TEAMS, TurnGlow } from './mockKit';

export { Badge, TEAMS };

// Universal views (PROPOSAL, teacher 2026-11-23). Round 3 rules: no washi
// tape; every universal screen sits on the site's purple ground; the scoreboard
// has no panel and held power-ups are square cards under it; one turn glow,
// also on the winner; competitive and cooperative lobbies plus a themed
// waiting view for each Live game; the game's theme around the question card.
// Everything is centered except question text and the A to D letters.
// Static, wired to nothing; no live screen changes until she approves.

const I = PP.ink;
// Grow Year headings are ALL CAPS (teacher, 2026-11-23).
const GY: CSSProperties = { fontFamily: 'var(--font-display)', fontWeight: 400, lineHeight: 1, textTransform: 'uppercase' };
// Selected = ink ring plus a Kelly check, never the go color (teacher, 2026-11-23).
const SEL = `0 0 0 4px ${PP.paper}, 0 0 0 8px ${I}`;
const PICK: CSSProperties = { background: PP.mint, color: I, boxShadow: `inset 0 0 0 3px ${I}` };
const LIFT = `0 6px 0 ${I}`;
const card: CSSProperties = { background: PP.paper, border: `3px solid ${I}`, borderRadius: 20, boxShadow: `0 4px 0 ${I}` };

// ---------- frames ----------
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

// ---------- paper parts: one flat card, one ink outline, the sticker shadow (teacher, 2026-11-23: no tape, no stacked sheets) ----------
function Paper({ children, className = '', style, pad = 32 }: { children: ReactNode; className?: string; style?: CSSProperties; layer?: string; tilt?: number; pad?: number }) {
  return (
    <div className={`relative ${className}`} style={style}>
      <div className="relative h-full rounded-[30px]" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: LIFT, padding: pad }}>{children}</div>
    </div>
  );
}
// Every universal screen: the site's purple ground, content centered.
function Stage({ children, pad = 40 }: { children: ReactNode; pad?: number }) {
  return <div className="w-full h-full relative" style={PURPLE_GROUND}><div className="absolute inset-0 flex flex-col items-center" style={{ padding: pad }}>{children}</div></div>;
}
// Icon buttons from the Icons tab: bold, ink, round, 2px ink edge.
function Round({ children, label, size = 52 }: { children: ReactNode; label: string; size?: number }) {
  return <span aria-label={label} className="rounded-full grid place-items-center shrink-0" style={{ width: size, height: size, background: PP.paper, border: `2px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}>{children}</span>;
}
function Tools({ size = 52, access = true }: { size?: number; access?: boolean }) {
  const s = Math.round(size * 0.46);
  return (
    <div className="flex gap-3">
      {access && <Round size={size} label="Accessibility"><PersonArmsSpread weight="bold" size={s} /></Round>}
      <Round size={size} label="Settings"><GearSix weight="bold" size={s} /></Round>
      <Round size={size} label="Full screen"><CornersOut weight="bold" size={s} /></Round>
      <Round size={size} label="Close"><X weight="bold" size={s} /></Round>
    </div>
  );
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
      {opts.map((o, i) => <span key={o} className="px-6 rounded-full inline-flex items-center gap-2 whitespace-nowrap" style={{ minHeight: h - 12, ...(i === pick ? PICK : {}) }}>{i === pick && <Check weight="bold" size={size * 0.8} />}{o}</span>)}
    </span>
  );
}
function Wizard({ step, total, title, children, last }: { step: number; total: number; title: string; children: ReactNode; last?: boolean }) {
  return <MenuStep title={title} step={step + 1} total={total + 1} go={last ? <MainBtn><Play weight="fill" size={24} />Play</MainBtn> : undefined}>{children}</MenuStep>;
}
// A game stage stand-in (Board Game, Classic park) so overlays sit on a real theme.
function Board({ dim, w = 1280, h = 800 }: { dim?: boolean; w?: number; h?: number }) {
  return (
    <div className="w-full h-full relative">
      <ParkBack w={w} h={h} />
      <div className="absolute inset-[80px] grid grid-cols-8 grid-rows-5 gap-2 p-3 rounded-[24px]" style={{ background: PP.paper, border: `3px solid ${I}` }}>
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

// ---------- the universal top tracker ----------
// Left: who or what (score, whose turn, class goal). Middle: round X of Y over
// a chunky meter, one segment per round, no numbers on it. Right: icon buttons.
type Mode = 'solo' | 'share' | 'live';
function RoundMeter({ round, rounds, part, w = 360 }: { round: number; rounds: number; part: number; w?: number }) {
  return (
    <span className="flex gap-2" style={{ width: w }} role="img" aria-label={`Round ${round} of ${rounds}`}>
      {Array.from({ length: rounds }, (_, r) => (
        <span key={r} className="flex-1 h-[18px] rounded-full overflow-hidden relative" style={{ background: r < round - 1 ? PP.kelly : PP.paper, border: `2.5px solid ${I}` }}>
          {r === round - 1 && <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${part * 100}%`, background: PP.periwinkle, borderRight: `2.5px solid ${I}` }} />}
        </span>
      ))}
    </span>
  );
}
function Tracker({ mode, k = 1 }: { mode: Mode; k?: number }) {
  const left = mode === 'solo'
    ? <span className="flex items-baseline gap-2"><span style={{ ...GY, fontSize: 56 * k }} className="tabular-nums">120</span><b style={{ fontSize: 18 * k, color: PP.quiet }}>points</b></span>
    : mode === 'share'
      ? <span className="flex items-center gap-3"><TurnGlow round><span className="grid place-items-center rounded-full" style={{ width: 52 * k, height: 52 * k, background: PP.paper, border: `3px solid ${I}` }}><Badge t={TEAMS[1]} size={34 * k} /></span></TurnGlow><b className="whitespace-nowrap" style={{ fontSize: 24 * k }}>Team Sky&apos;s turn</b></span>
      : <span className="flex items-center gap-3"><Star weight="fill" size={40 * k} color={PP.lemon} /><span className="grid"><b className="whitespace-nowrap" style={{ fontSize: 24 * k }}>38 of 60 stars</b>{k >= 1 && <span className="font-bold" style={{ fontSize: 15 * k, color: PP.quiet }}>Class goal: fill the sky</span>}</span></span>;
  return (
    <div className="w-full grid grid-cols-[1fr_auto_1fr] items-center gap-6 px-6 rounded-full" style={{ minHeight: 84 * k, background: PP.paper, border: `3px solid ${I}`, boxShadow: LIFT }}>
      <div className="justify-self-start">{left}</div>
      <div className="grid justify-items-center gap-1.5">
        <b style={{ fontSize: 17 * k }}>Round 2 of 3</b>
        <RoundMeter round={2} rounds={3} part={0.5} w={k < 1 ? 190 : 360} />
      </div>
      <div className="justify-self-end"><Tools size={48 * k} access={false} /></div>
    </div>
  );
}

// ---------- views ----------
function V1() {
  // Her original live welcome layout, right column spaced evenly (teacher, 2026-11-23).
  return (
    <WelcomeScreen name="Board Game" desc="Answer, roll the die and race to the finish." modes={['Share', 'Live', 'Solo']}
      steps={[[<Check key="a" weight="bold" size={22} />, 'Answer the question'], [<Star key="b" weight="bold" size={22} />, 'Roll the die'], [<ArrowRight key="c" weight="bold" size={22} />, 'Move to the finish']]}
      cover={<div className="relative w-full h-full grid place-items-center"><ParkBack w={790} h={490} /><span className="relative"><CrayonDie value={5} size={200} /></span></div>} />
  );
}
function V2() {
  const ways = [
    { id: 'Share', hint: 'Play together on one screen', icon: <Television weight="bold" size={104} />, bg: PP.gamify, on: true },
    { id: 'Live', hint: 'Play together on your own devices', icon: <Broadcast weight="bold" size={104} />, bg: PP.aqua },
    { id: 'Solo', hint: 'Play on your own', icon: <User weight="bold" size={104} />, bg: PP.butter },
  ];
  return (
    <Wizard step={1} total={5} title="How will you play?">
      <div className="flex flex-col items-center gap-7">
        <div className="flex gap-8">
          {ways.map((w) => (
            <div key={w.id} className="relative w-[260px] h-[250px] rounded-[24px] flex flex-col" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: w.on ? `${SEL}, 0 10px 0 ${I}` : `0 5px 0 ${I}`, transform: w.on ? 'translateY(-6px)' : undefined }}>
              <span className="flex-1 grid place-items-center rounded-t-[21px]" style={{ background: w.bg, borderBottom: `3px solid ${I}` }}>{w.icon}</span>
              <span className="px-4 py-3 text-center"><b className="text-[32px] block" style={GY}>{w.id}</b><span className="text-[17px] font-semibold">{w.hint}</span></span>
              {w.on && <span className="absolute -top-4 -right-4"><Check40 /></span>}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 font-bold text-[20px]"><span>How do you share?</span><Seg opts={['Same device', 'Share a join code']} pick={0} /></div>
      </div>
    </Wizard>
  );
}
const SETS = [
  { name: 'Capital letters', sub: 'ELA', gr: 'K-2', n: 12, c: PP.pink, soft: PP.blush, q: 'Which word needs a capital letter?', used: 'Used today' },
  { name: 'Short vowels', sub: 'ELA', gr: 'K-1', n: 16, c: PP.periwinkle, soft: PP.gamify, q: 'Which word has a short a sound?', used: 'Used yesterday' },
  { name: 'Add within 20', sub: 'Math', gr: '1-2', n: 20, c: PP.lemon, soft: PP.butter, q: 'What is 8 + 5?', used: 'Used 3 days ago' },
  { name: 'Punctuation', sub: 'ELA', gr: '2-3', n: 10, c: PP.sky, soft: PP.blueCrystal, q: 'Which sentence ends with a question mark?', used: 'Used last week' },
  { name: 'Plants and seeds', sub: 'Science', gr: '2-4', n: 14, c: PP.kelly, soft: PP.mint, q: 'What does a seed need to grow?', used: 'Made Nov 2' },
  { name: 'Place value', sub: 'Math', gr: '2-3', n: 18, c: PP.orange, soft: PP.peach, q: 'What is the value of the 4 in 46?', used: 'Made Oct 28' },
];
function Chip({ children, on }: { children: ReactNode; on?: boolean }) {
  return <span className="px-3.5 h-10 rounded-full inline-flex items-center gap-1.5 font-bold text-[16px] whitespace-nowrap" style={on ? { ...PICK } : { background: '#fff', border: `2px solid ${I}` }}>{on && <Check weight="bold" size={14} />}{children}</span>;
}
function V3() {
  // Laptop dense but legible (13px floor): tabs, search, subject and grade filters, recent first,
  // cards with subject color, grade, count, the first question and when it was last used.
  return (
    <Wizard step={2} total={5} title="Question set">
      <div className="w-full grid gap-4">
        <div className="flex items-center justify-center gap-3">
          <Seg opts={['My sets', 'Public sets']} pick={0} h={52} size={18} />
          <span className="w-[240px] h-[52px] px-5 rounded-full flex items-center gap-3 font-semibold text-[18px]" style={{ background: '#fff', border: `2.5px solid ${I}`, color: PP.quiet }}><MagnifyingGlass weight="bold" size={22} />Search sets</span>
          <span className="flex gap-1.5"><Chip on>All subjects</Chip><Chip>ELA</Chip><Chip>Math</Chip><Chip>Science</Chip></span>
          <Chip>All grades<CaretDown weight="bold" size={14} /></Chip>
        </div>
        <div className="grid grid-cols-[repeat(3,minmax(0,1fr))] gap-4">
          {SETS.map((x, i) => (
            <div key={x.name} className="relative rounded-[20px] overflow-hidden flex flex-col" style={{ background: '#fff', border: `3px solid ${I}`, boxShadow: i === 0 ? `${SEL}, 0 4px 0 ${I}` : `0 4px 0 ${I}` }}>
              <div className="h-[40px] pl-4 pr-12 flex items-center justify-between gap-2 whitespace-nowrap" style={{ background: x.soft, borderBottom: `2.5px solid ${I}` }}>
                <span className="flex items-center gap-2 font-bold text-[16px]"><span className="w-4 h-4 rounded-full" style={{ background: x.c, border: `2px solid ${I}` }} />{x.sub}</span>
                <span className="font-bold text-[15px]">{x.used}</span>
              </div>
              <div className="px-4 pt-2.5 pb-3 grid gap-1.5 text-left min-w-0">
                <b className="text-[22px] leading-tight">{x.name}</b>
                <span className="text-[16px] font-semibold px-3 py-1.5 rounded-xl truncate" style={{ background: PP.cream, color: I }}>{x.q}</span>
                <span className="flex gap-2 text-[15px] font-bold"><span className="px-2.5 py-0.5 rounded-full" style={{ border: `2px solid ${I}` }}>Grades {x.gr}</span><span className="px-2.5 py-0.5 rounded-full" style={{ border: `2px solid ${I}` }}>{x.n} questions</span></span>
              </div>
              {i === 0 && <span className="absolute top-1.5 right-1.5"><Check40 size={34} /></span>}
            </div>
          ))}
        </div>
      </div>
    </Wizard>
  );
}
// No section kicker labels (teacher, 2026-11-23); only the real field labels.
function Group({ children }: { title?: string; children: ReactNode }) {
  return <div className="p-6 grid gap-8 content-start justify-items-center text-center" style={{ ...card, background: PP.cream }}>{children}</div>;
}
function Row({ label, children }: { label: string; children: ReactNode }) {
  return <div className="grid justify-items-center gap-3"><b className="text-[22px]">{label}</b>{children}</div>;
}
function V4() {
  return (
    <Wizard step={3} total={5} title="Options">
      <div className="w-full grid grid-cols-2 gap-6">
        <Group title="The game">
          <Row label="Rounds">
            <span className="relative w-[300px] h-5 rounded-full mt-3" style={{ background: PP.blueCrystal, border: `3px solid ${I}` }}>
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
      <div className="w-full grid gap-6 justify-items-center">
        <div className="flex items-center justify-center gap-4 font-bold text-[20px]"><span>How many teams?</span><Seg opts={['2', '3', '4']} pick={2} /></div>
        <div className="w-full grid grid-cols-4 gap-5">
          {TEAMS.map((t) => (
            <div key={t.name} className="relative" style={card}>
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
  // Back inside the white panel (teacher, 2026-11-23: every start menu the same; this replaces the 11-13 "no white box" rule).
  return (
    <Wizard step={5} total={5} title="Power-ups" last>
      <div className="grid grid-cols-3 gap-x-6 gap-y-5">
        {SETUP.map((c) => (
          <div key={c.id} className="relative w-[290px] h-[168px] grid justify-items-center content-center gap-1.5 text-center rounded-[22px]"
            style={c.on ? { background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}` } : { background: '#fff', border: `3px dashed ${I}` }}>
            <span className="relative w-[76px] h-[76px] grid place-items-center" style={c.on ? undefined : { filter: 'grayscale(1)', opacity: 0.5 }}><BlobPatch color={c.soft} size={84} /><span className="relative"><CrayonPowerUp id={c.id} size={66} /></span></span>
            <b className="text-[22px] leading-tight">{c.name}</b>
            <span className="text-[16px] font-semibold leading-snug" style={{ color: PP.quiet }}>{c.job}</span>
            <span className="absolute -top-3.5 -right-3.5">{c.on ? <Check40 /> : <span className="w-10 h-10 rounded-full grid place-items-center" style={{ background: PP.paper, border: `3px solid ${I}` }}><X weight="bold" size={18} /></span>}</span>
          </div>
        ))}
      </div>
    </Wizard>
  );
}
function V7() {
  return (
    <div className="w-full h-full relative">
      <Board dim />
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative">
          <span aria-hidden="true" className="absolute left-1/2 top-[36%] -translate-x-1/2 -translate-y-1/2 w-[620px] h-[620px] rounded-full" style={{ background: `repeating-conic-gradient(${PP.butter} 0 10deg, transparent 10deg 20deg)`, maskImage: 'radial-gradient(circle, #000 30%, transparent 70%)', WebkitMaskImage: 'radial-gradient(circle, #000 30%, transparent 70%)', opacity: 0.6 }} />
          <Paper layer={PP.butter} pad={0} className="w-[540px]">
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

// ---------- question screen: the game's theme around the standard card ----------
const ANS = [['A', 'the dog ran.', PP.periwinkle, PP.gamify], ['B', 'The dog ran.', PP.sky, PP.blueCrystal], ['C', 'The dog ran', PP.pink, PP.blush], ['D', 'the dog ran', PP.lemon, PP.butter]] as const;
function QCard({ tablet }: { tablet?: boolean }) {
  const big = !!tablet;
  const b = big ? 60 : 52, ic = big ? 26 : 22;
  return (
    <div className={`${big ? 'w-full flex-1 min-h-0' : 'w-[1120px] h-full'} rounded-[30px] flex flex-col gap-5`} style={{ background: '#fff', border: `3px solid ${I}`, boxShadow: `0 6px 0 ${I}`, padding: big ? 30 : 28 }}>
      {/* Her page 2 header: the current team left; tools, settings, full screen, close, then Listen on the right. */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-3 flex-1 min-w-0"><TurnGlow round><span className="grid place-items-center rounded-full" style={{ width: b, height: b, background: '#fff', border: `3px solid ${I}` }}><Badge t={TEAMS[1]} size={b * 0.62} /></span></TurnGlow><b className="truncate" style={{ fontSize: big ? 30 : 26 }}>Team Sky</b></span>
        <Round size={b} label="Tools"><Toolbox weight="bold" size={ic} /></Round>
        <Round size={b} label="Settings"><GearSix weight="bold" size={ic} /></Round>
        <Round size={b} label="Full screen"><CornersOut weight="bold" size={ic} /></Round>
        <Round size={b} label="Close"><X weight="bold" size={ic} /></Round>
        <span className="px-5 rounded-full inline-flex items-center gap-2 font-bold shrink-0" style={{ minHeight: b, fontSize: big ? 24 : 20, background: PP.blueCrystal, border: `2px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}><SpeakerHigh weight="bold" size={ic} />Listen</span>
      </div>
      <h2 className="font-bold text-left leading-snug" style={{ fontSize: big ? 54 : 42 }}>Which one starts with a capital letter and ends with punctuation?</h2>
      <div className="grid gap-4 flex-1" style={{ gridTemplateColumns: `repeat(${big ? 1 : 2}, 1fr)` }}>
        {ANS.map(([l, txt, c, bg]) => (
          <div key={l} className="flex items-center gap-5 px-5 rounded-[22px] font-bold" style={{ fontSize: big ? 46 : 40, background: bg, border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}` }}>
            <span className="shrink-0 rounded-full grid place-items-center" style={{ ...GY, width: big ? 84 : 76, height: big ? 84 : 76, fontSize: big ? 46 : 40, background: c, border: `3px solid ${I}` }}>{l}</span>{txt}
          </div>
        ))}
      </div>
    </div>
  );
}
type ThemeId = 'gameshow' | 'park' | 'sky';
function ThemeBack({ id, w, h }: { id: ThemeId; w: number; h: number }) {
  return id === 'gameshow' ? <StudioBack w={w} h={h} /> : id === 'park' ? <ParkBack w={w} h={h} /> : <SkyBack w={w} h={h} />;
}
function QLaptop({ theme }: { theme: ThemeId }) {
  return (
    <div className="w-full h-full relative">
      <ThemeBack id={theme} w={1280} h={800} />
      <div className="absolute inset-0 flex flex-col items-center px-10 py-10"><QCard /></div>
    </div>
  );
}
function QTablet({ theme }: { theme: ThemeId }) {
  return (
    <div className="w-full h-full relative">
      <ThemeBack id={theme} w={820} h={1180} />
      <div className="absolute inset-0 flex flex-col items-center px-7 pt-10 pb-12"><QCard tablet /></div>
    </div>
  );
}

// ---------- tracker variants and the scoreboard ----------
function V9a() {
  return (
    <Stage pad={48}>
      <div className="w-full flex-1 flex flex-col justify-center gap-9">
        {(['solo', 'share', 'live'] as const).map((m) => (
          <Tracker key={m} mode={m} />
        ))}
      </div>
    </Stage>
  );
}
const HELD: { id: PowerId; name: string; soft: string }[] = [{ id: 'shield', name: 'Shield', soft: PP.blueCrystal }, { id: 'double-points', name: 'Double Points', soft: PP.butter }];
function V9b() {
  return (
    <div className="w-full h-full relative">
      <ParkBack w={1280} h={800} />
      <div className="absolute inset-0 flex flex-col items-center gap-6 px-10 pt-9 pb-8">
        <Tracker mode="share" />
        <div className="w-full flex-1 min-h-0 grid grid-cols-[1fr_340px] gap-8">
          <div className="grid grid-cols-6 grid-rows-4 gap-2 p-3 rounded-[24px]" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 6px 0 ${I}` }}>
            {Array.from({ length: 24 }, (_, i) => <span key={i} className="rounded-xl" style={{ background: [PP.paper, PP.butter, PP.gamify, PP.aqua][i % 4], border: `2.5px solid ${I}` }} />)}
          </div>
          {/* No panel: rows sit right on the stage, held power-ups are square cards under them. */}
          <div className="grid gap-4 content-start justify-items-center">
            {TEAMS.map((t, i) => {
              const row = (
                <div className="w-[320px] flex items-center gap-3 px-4 h-[64px] rounded-full" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}` }}>
                  <Badge t={t} size={36} /><b className="flex-1 text-[20px] truncate">{t.name}</b><span className="text-[36px] tabular-nums" style={GY}>{[80, 110, 60, 95][i]}</span>
                </div>
              );
              return i === 1 ? <TurnGlow key={t.name} radius={9999}>{row}</TurnGlow> : <div key={t.name}>{row}</div>;
            })}
            <div className="flex gap-4 justify-center mt-2">
              {HELD.map((h) => (
                <div key={h.id} className="w-[132px] aspect-square grid justify-items-center content-center gap-1 text-center rounded-[20px]" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}` }}>
                  <span className="relative w-[70px] h-[70px] grid place-items-center"><BlobPatch color={h.soft} size={76} /><span className="relative"><CrayonPowerUp id={h.id} size={60} /></span></span>
                  <b className="text-[16px] leading-tight">{h.name}</b>
                </div>
              ))}
            </div>
          </div>
        </div>
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
            <div className="px-10 pt-9 pb-9 grid justify-items-center gap-6 text-center">
              <h2 className="text-[80px]" style={GY}>Great game!</h2>
              <div className="flex items-end gap-6">
                {[1, 0, 2].map((i) => { const t = TEAMS[i]; return (
                  <div key={t.name} className="grid justify-items-center gap-3">
                    {i === 0
                      ? <TurnGlow round><span className="w-[120px] h-[120px] rounded-full grid place-items-center" style={{ background: PP.paper, border: `3px solid ${I}` }}><Badge t={t} size={78} /></span></TurnGlow>
                      : <Badge t={t} size={60} />}
                    <span className="w-[150px] rounded-t-[20px] grid place-items-center text-[44px]" style={{ ...GY, height: [150, 110, 80][i], background: i === 0 ? PP.periwinkle : t.soft, border: `3px solid ${I}` }}>{i + 1}</span>
                  </div>); })}
              </div>
              <div className="flex gap-4 justify-center items-center"><MainBtn big><Play weight="fill" size={26} />Play again</MainBtn><SecondBtn>New game</SecondBtn><SecondBtn>Review</SecondBtn><SecondBtn><Star weight="bold" size={20} />Rate</SecondBtn></div>
            </div>
          </Paper>
          <Corner id="star" x="-56px" y="30px" rot={-14} />
          <Corner id="balloon" x="768px" y="140px" rot={12} />
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
        <Paper pad={28} className="w-[880px]" layer={PP.mint}>
          <div className="relative flex items-center justify-center mb-5"><h2 className="text-[52px]" style={GY}>Settings</h2><span className="absolute right-0"><Round label="Close"><X weight="bold" size={24} /></Round></span></div>
          <div className="grid grid-cols-[220px_1fr] gap-6">
            <div className="grid gap-2 content-start">{['Sound', 'Motion', 'Reading', 'Tools'].map((o, i) => <span key={o} className="h-14 px-5 rounded-2xl flex items-center justify-center font-bold text-[20px]" style={i === 1 ? PICK : { border: '2.5px solid transparent' }}>{o}</span>)}</div>
            <div className="grid gap-3">
              <div className="flex items-center gap-5 p-5 rounded-[22px]" style={{ background: PP.blueCrystal, border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}` }}>
                <span className="relative w-16 h-16 grid place-items-center shrink-0"><BlobPatch color={PP.paper} size={70} /><span className="relative"><Doodle kind="heart" color={PP.lavender} size={34} /></span></span>
                <div className="flex-1 text-center"><b className="text-[26px] block">Calm mode</b><span className="font-semibold text-[17px]" style={{ color: PP.quiet }}>Softer sounds, still pictures, quiet ground.</span></div><Toggle on />
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
        <Paper pad={44} className="w-[600px]" layer={PP.blueCrystal}>
          <div className="grid justify-items-center gap-4 text-center">
            <span className="relative w-36 h-36 grid place-items-center"><BlobPatch color={PP.blueCrystal} size={150} /><span className="relative w-24 h-24 rounded-full grid place-items-center" style={{ background: PP.paper, border: `3px solid ${I}` }}><Pause weight="bold" size={52} /></span></span>
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
    <Stage>
      <div className="flex-1 grid place-items-center">
        <Paper pad={44} className="w-[720px]" layer={PP.aqua} tilt={-1.5}>
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
// ---------- lobbies ----------
function CodeChip() {
  return <div className="flex items-center gap-4 px-6 h-[76px] rounded-full" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: LIFT }}><b className="text-[20px]">Join code</b><span className="text-[52px] whitespace-nowrap" style={GY}>472 915</span><span className="flex items-center gap-2 px-4 h-11 rounded-full font-bold text-[18px]" style={{ background: PP.mint, border: `2px solid ${I}` }}><UsersThree weight="bold" size={22} />12 here</span></div>;
}
const NAMES = ['Ava', 'Leo', 'Mia', 'Noah', 'Zoe', 'Eli', 'Ivy', 'Max', 'Ruby', 'Sam', 'Lily', 'Owen'];
function V12b() {
  return (
    <MenuStep title="Race lobby" step={6} total={6} go={<MainBtn big><Play weight="fill" size={28} />Start the race</MainBtn>}>
      <CodeChip />
      <div className="w-full grid grid-cols-4 gap-5 mt-6">
        {TEAMS.map((t, i) => (
          <div key={t.name} className="flex flex-col items-center gap-3 pt-5 rounded-[26px]" style={{ background: t.soft, border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}` }}>
            <span className="w-[76px] h-[76px] rounded-full grid place-items-center" style={{ background: PP.paper, border: `3px solid ${I}` }}><Badge t={t} size={50} /></span>
            <b className="text-[24px]">{t.name}</b>
            {NAMES.slice(i * 3, i * 3 + 3).map((n) => <span key={n} className="w-[200px] h-12 rounded-full grid place-items-center font-bold text-[21px]" style={{ background: PP.paper, border: `2.5px solid ${I}` }}>{n}</span>)}
          </div>
        ))}
      </div>
    </MenuStep>
  );
}
function V12c() {
  const soft = [PP.gamify, PP.aqua, PP.blush, PP.butter, PP.mint, PP.peach];
  return (
    <MenuStep title="Team lobby" step={6} total={6} go={<MainBtn big><Play weight="fill" size={28} />Start together</MainBtn>}>
      <CodeChip />
      <div className="w-[960px] mt-7 p-7 rounded-[26px]" style={{ background: PP.cream, border: `3px solid ${I}` }}>
        <div className="grid justify-items-center gap-5 text-center">
          <span className="flex items-center gap-3 text-[30px] font-bold"><Star weight="fill" size={40} color={PP.lemon} />Our goal: fill the sky with 60 stars</span>
          <span className="w-[640px] h-7 rounded-full" style={{ background: PP.cream, border: `3px solid ${I}` }} />
          <div className="flex flex-wrap justify-center gap-3 max-w-[820px]">{NAMES.map((n, i) => <span key={n} className="px-5 h-12 rounded-full font-bold text-[22px] flex items-center" style={{ background: soft[i % 6], border: `3px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}>{n}</span>)}</div>
        </div>
      </div>
    </MenuStep>
  );
}
// A Live game's own student waiting screen, in its theme.
function Waiting({ back, title, line, you }: { back: ReactNode; title: string; line: string; you: ReactNode }) {
  return (
    <div className="w-full h-full relative">
      {back}
      <div className="absolute inset-0 grid place-items-center px-10">
        <Paper pad={40} className="w-full" layer={PP.gamify}>
          <div className="grid justify-items-center gap-5 text-center">
            <TurnGlow round still><span className="w-[150px] h-[150px] rounded-full grid place-items-center" style={{ background: PP.paper, border: `3px solid ${I}` }}>{you}</span></TurnGlow>
            <h2 className="text-[72px]" style={GY}>{title}</h2>
            <p className="font-bold text-[30px] leading-snug">{line}</p>
            <span className="flex gap-3" aria-label="Waiting">{[0, 1, 2].map((d) => <span key={d} className="w-5 h-5 rounded-full" style={{ background: [PP.periwinkle, PP.lemon, PP.pink][d], border: `2.5px solid ${I}` }} />)}</span>
          </div>
        </Paper>
      </div>
    </div>
  );
}
function StarArt({ size = 96 }: { size?: number }) {
  return <Doodle kind="star" color={PP.lemon} size={size} />;
}

function V13() {
  return (
    <div className="w-full h-full relative">
      <Board dim />
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative">
          <Paper pad={40} className="w-[780px]">
            <div className="grid justify-items-center gap-4 text-center">
              <span className="inline-flex items-center gap-2 px-5 h-11 rounded-full font-bold text-[19px]" style={{ background: PP.butter, border: `3px solid ${I}` }}><Lightbulb weight="bold" size={22} />Before we play</span>
              <div className="relative w-[230px] h-[170px] grid place-items-center"><BlobPatch color={PP.gamify} size={200} /><span className="relative text-[130px]" style={{ ...GY, textTransform: 'none' }}>Aa</span></div>
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

const VIEWS: { n: string; name: string; view: ReactNode; problem: string; changed: string; tablet?: boolean }[] = [
  { n: '1', name: 'Welcome', view: <V1 />, problem: 'The welcome had become a step panel, not her original page.',
    changed: 'Back to her original welcome: cover big on the left, the right column exactly as tall as it and spaced evenly (title level with the cover top and the corner buttons, description and ways to play, the white How to play card, the start button level with the cover bottom).' },
  { n: '2', name: 'Ways to play', view: <V2 />, problem: 'Tape on the panel; icons were filled while the Icons tab says bold.',
    changed: 'Purple ground, bold icons, the picked card lifts with an ink ring and green check, the share question under the cards.' },
  { n: '3', name: 'Question set picker', view: <V3 />, problem: 'Small cards with little to choose by.', changed: 'Tabs, search, subject and grade filters; recently used first; each card shows the subject color, grades, question count, the first question and when it was last used; picked = ink ring and green check; nothing under 15px.' },
  { n: '4', name: 'Options', view: <V4 />, problem: 'Section kickers like \"The game\" and \"Help for players\".', changed: 'Kickers removed; two plain groups with only the real field labels (Rounds, Board size, Timer, Read aloud).' },
  { n: '5', name: 'Teams and players', view: <V5 />, problem: 'Tilted cards.', changed: 'Straight cards, no tilt anywhere in menus; a shape and color on each team and a dashed Add chip.' },
  { n: '6', name: 'Power-up setup cards', view: <V6 />, problem: 'The step title sat on a taped chip.', changed: 'Back inside the same white panel as every start menu (her 2026-11-23 rule replaces the earlier no-white-box rule); off cards dashed, never crossed out.' },
  { n: '7', name: 'Power-up pop card', view: <V7 />, problem: 'Tape on the card.', changed: 'One flat paper card with soft sun rays, over the game (Board Game park here).' },
  { n: '8', name: 'Question screen (laptop)', view: <QLaptop theme="park" />, problem: 'Several near-identical question screens, and the team, tools and Listen were spread around the screen.',
    changed: 'One question screen for every game; only the background changes (Board Game park here). Her page 2 header inside the card: the current team left; tools, settings, full screen, close and Listen right; question text left; A to D tiles.' },
  { n: '9a', name: 'Top tracker: solo, share, live', view: <V9a />, problem: 'One thin strip of dashes, a dash per turn, buttons of mixed sizes.',
    changed: 'Three variants top to bottom (solo with no player icon, share with the turn glow, live with the class goal), labels removed from the screen. Who or what on the left, Round X of Y over one chunky segment per round in the middle, three 48px icon buttons on the right.' },
  { n: '9b', name: 'Scoreboard and held power-ups', view: <V9b />, problem: 'The scoreboard sat on a panel and held power-ups were a line of text.',
    changed: 'No panel: team rows sit on the stage, the current team wears the turn glow, held power-ups are 1:1 square cards centered under it.' },
  { n: '10', name: 'Results box', view: <V10 />, problem: 'The winner had its own sun badge, different from the turn glow.',
    changed: 'The winner wears the exact turn glow (TURN_GLOW: 6px lemon ring, 24px soft halo, 1.6 s breathe); no tape; two sticker accents.' },
  { n: '11', name: 'Settings and Calm', view: <V11 />, problem: 'Tape; title off center.', changed: 'Centered title with the close button at the right, side tabs, Calm mode first and biggest.' },
  { n: '11b', name: 'Pause', view: <V11b />, problem: 'Tape on the card.', changed: 'A plain calm card with the bold pause icon on a pastel blob.' },
  { n: '12', name: 'Join code', view: <V12 />, problem: 'Pattern bands and tape.', changed: 'Purple ground, one centered card, 84px digit boxes in two groups of three.' },
  { n: '12b', name: 'Lobby: competitive', view: <V12b />, problem: 'One lobby for every game; nothing showed who you play against.',
    changed: 'Teams line up in their colors and shapes, names joining under each, the code and count on one chip, Start the race.' },
  { n: '12c', name: 'Lobby: cooperative', view: <V12c />, problem: 'A shared-goal game looked like a race.',
    changed: 'One class goal on top, an empty goal bar, every name joining one group, Start together.' },
  { n: '13', name: 'Teach card', view: <V13 />, problem: 'Tape and a stacked sheet.', changed: 'One flat card over the game: the picture on a pastel blob, the skill line at 38px, a 68px Let\u2019s play.' },
];
const TABLETS: { n: string; name: string; view: ReactNode; problem: string; changed: string }[] = [
  { n: '8', name: 'Question screen (iPad portrait)', view: <QTablet theme="park" />, problem: 'Words were small for a finger.', changed: 'The same card stacked in one column with the same header row; 84px letters and 46px answers.' },
  { n: '12d', name: 'Waiting: Question Tracker (Live student)', view: <Waiting back={<SkyBack w={820} h={1180} stars={18} />} title="You're in, Ava!" line="Your teacher will start soon. Your stars will light up the sky." you={<StarArt size={100} />} />, problem: 'Live students waited on a plain screen.', changed: 'The game’s own night sky, the student’s star in the turn glow, waiting dots.' },
  { n: '12e', name: 'Waiting: Cast and Catch (Live student)', view: <Waiting back={<LakeBack w={820} h={1180} />} title="You're in, Leo!" line="Your teacher will start soon. Get your line ready." you={<Doodle kind="dot" color={PP.pink} size={90} />} />, problem: 'Same plain waiting screen as every game.', changed: 'The lake and boat from the game, the bobber in the turn glow, waiting dots.' },
];

export default function UniversalViews() {
  return (
    <section className="grid gap-6">
      <div className="grid gap-1 justify-items-center text-center">
        <h2 className="font-heading text-2xl">Universal views <span className="text-base align-middle px-2 py-0.5 rounded-full border-2 border-black bg-[#fdfd94]">Proposal</span></h2>
        <p className="text-sm font-semibold text-muted max-w-prose">Round 3: the site&apos;s purple ground on every screen, no tape, one turn glow (also on the winner), a clearer top tracker, the scoreboard on the stage with square power-up cards, competitive and cooperative lobbies, and each game&apos;s theme around the question card. Everything centered except question text and the A to D letters. Preview only.</p>
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        {VIEWS.map((v) => (
          <figure key={v.n} className="m-0 grid gap-3 content-start">
            <figcaption className="font-heading text-lg text-center">{v.n}. {v.name}</figcaption>
            <Laptop w={1280}>{v.view}</Laptop>
            <p className="text-sm font-semibold text-muted text-center"><b>Before:</b> {v.problem}</p>
            <p className="text-sm font-semibold -mt-2 text-center"><b>What changed:</b> {v.changed}</p>
          </figure>
        ))}
        {TABLETS.map((v) => (
          <figure key={v.n} className="m-0 grid gap-3 content-start">
            <figcaption className="font-heading text-lg text-center">{v.n}. {v.name}</figcaption>
            <Tablet>{v.view}</Tablet>
            <p className="text-sm font-semibold text-muted text-center"><b>Before:</b> {v.problem}</p>
            <p className="text-sm font-semibold -mt-2 text-center"><b>What changed:</b> {v.changed}</p>
          </figure>
        ))}
      </div>
    </section>
  );
}
