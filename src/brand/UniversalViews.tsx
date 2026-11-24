import { useState, type CSSProperties, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useSettings } from '../settings/SettingsContext';
import {
  ArrowLeft, ArrowRight, CaretDown, Check, CornersOut, GearSix, MagnifyingGlass, Pause,
  PersonArmsSpread, Play, Plus, SpeakerHigh, Star, Toolbox, UsersThree, X,
} from '@phosphor-icons/react';
import { PP } from './PaletteProposal';
import { BlobPatch, CrayonPowerUp, Doodle, type PowerId } from './CrayonKit';
import { STARTER, StickerArt } from './Stickers';
import { AutoFit, Badge, DeviceSet, Laptop, MainBtn as BaseBtn, MenuStep, Meter, useFrame, MORE_TEAMS, type Team, WAYS_STYLE, WelcomeScreen, ParkBack, PURPLE_GROUND, SkyBack, StudioBack, Tablet, TEAMS, TurnGlow } from './mockKit';
import { GAME_COVERS } from './GameMockups';

export { Badge, Laptop, BaseBtn as MainBtn, Tablet, TEAMS };
// Every go button on a universal screen is yellow (teacher, 2026-11-24).
function MainBtn(p: { children: ReactNode; wide?: boolean; big?: boolean }) { return <BaseBtn {...p} yellow />; }

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
// The overlay box over the game; in portrait it fits the card to the screen.
function Over({ children }: { children: ReactNode }) {
  const f = useFrame();
  if (f.adaptive) return <div className="absolute inset-0" style={{ padding: f.w < 600 ? 16 : 36 }}><AutoFit>{children}</AutoFit></div>;
  return <div className="absolute inset-0 grid place-items-center">{children}</div>;
}
function Board({ dim, w: w0 = 1280, h: h0 = 800 }: { dim?: boolean; w?: number; h?: number }) {
  const f = useFrame(); const w = f.adaptive ? f.w : w0, h = f.adaptive ? f.h : h0;
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
  return <Meter segments={rounds} done={round - 1} part={part} width={w} label={`Round ${round} of ${rounds}`} />;
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
  // Her original live welcome layout, the right column a full-height column spread evenly (teacher, 2026-11-23).
  const g = GAME_COVERS[1];
  return <WelcomeScreen name={g.name} desc={g.desc} modes={g.modes} cover={g.cover}
    steps={[[<Check key="a" weight="bold" size={24} />, g.steps[0]], [<Star key="b" weight="bold" size={24} />, g.steps[1]], [<ArrowRight key="c" weight="bold" size={24} />, g.steps[2]]]} />;
}
// An option group as one card on the purple ground (no white panel behind the step).
function OptCard({ label, children }: { label: string; children: ReactNode }) {
  return <div className="px-8 py-5 grid justify-items-center gap-3 rounded-[24px]" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}` }}><b className="text-[22px]">{label}</b>{children}</div>;
}
const WAYS = (['Share', 'Live', 'Solo'] as const).map((id) => ({ id, ...WAYS_STYLE[id] }));
// Settings show only under the way they belong to (teacher, 2026-11-23).
function V2({ pick = 'Share' }: { pick?: 'Share' | 'Solo' }) {
  return (
    <Wizard step={1} total={5} title="How will you play?">
      <div className="flex flex-col items-center gap-9">
        <div className="flex gap-8">
          {WAYS.map((w) => { const on = w.id === pick; return (
            <div key={w.id} className="relative w-[268px] h-[262px] rounded-[24px] flex flex-col" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: on ? `${SEL}, 0 10px 0 ${I}` : `0 5px 0 ${I}`, transform: on ? 'translateY(-6px)' : undefined }}>
              <span className="flex-1 grid place-items-center rounded-t-[21px]" style={{ background: w.soft, borderBottom: `3px solid ${I}` }}><span className="w-[128px] h-[128px] rounded-full grid place-items-center" style={{ background: w.bright, border: `3px solid ${I}` }}><w.icon weight="bold" size={80} /></span></span>
              <span className="px-4 py-3 text-center"><b className="text-[32px] block" style={GY}>{w.id}</b><span className="text-[17px] font-semibold">{w.hint}</span></span>
              {on && <span className="absolute -top-4 -right-4"><Check40 /></span>}
            </div>); })}
        </div>
        {pick === 'Share'
          ? <OptCard label="How do you share?"><Seg opts={['Same device', 'Share a join code']} pick={0} /></OptCard>
          : <OptCard label="Who do you play against?"><Seg opts={['Just me', 'The computer']} pick={1} /></OptCard>}
      </div>
    </Wizard>
  );
}
function ShareCode() {
  return (
    <Wizard step={1} total={5} title="Share a join code">
      <div className="grid justify-items-center gap-6">
        <span className="px-10 py-4 rounded-[26px] tracking-[0.2em]" style={{ ...GY, fontSize: 120, background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 6px 0 ${I}` }}>472 915</span>
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
  return <div className="p-7 grid gap-8 content-start justify-items-center text-center" style={{ ...card, borderRadius: 24, boxShadow: `0 5px 0 ${I}` }}>{children}</div>;
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
// Teams (teacher, 2026-11-24): no "How many teams?" selector; an Add team
// button between Back and Next; cards centered both ways, wrapping onto new
// centered rows. A new card pops in (scale 0.6 to 1, small overshoot) while the
// others slide to their new places (layout). Still motion or Calm: no animation.
const TEAM_POOL: Team[] = [...TEAMS, ...MORE_TEAMS];
function V5() {
  const { settings } = useSettings();
  const reduce = useReducedMotion();
  const still = reduce || settings.motion === 'still' || !!settings.calm;
  const [teams, setTeams] = useState<Team[]>(TEAM_POOL.slice(0, 3));
  const add = () => setTeams((ts) => { const next = TEAM_POOL.find((t) => !ts.includes(t)); return next && ts.length < 8 ? [...ts, next] : ts; });
  const remove = (t: Team) => setTeams((ts) => (ts.length > 2 ? ts.filter((x) => x !== t) : ts));
  const full = teams.length >= 8;
  const addBtn = (
    <button type="button" onClick={add} disabled={full} data-testid="add-team" className="min-h-[56px] px-6 rounded-full font-bold text-[20px] inline-flex items-center gap-2 whitespace-nowrap disabled:opacity-50" style={{ background: '#fff', border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}` }}>
      <Plus weight="bold" size={20} />Add team
    </button>
  );
  const many = teams.length > 4;
  return (
    <MenuStep title="Teams" step={5} total={6} extra={addBtn}>
      <div className="w-full h-full flex flex-wrap justify-center content-center gap-5">
        <AnimatePresence initial={false}>
          {teams.map((t) => (
            <motion.div key={t.name} layout={!still}
              initial={still ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={still ? { opacity: 0, transition: { duration: 0 } } : { scale: 0.6, opacity: 0, transition: { duration: 0.18 } }}
              transition={still ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 17, layout: { type: 'spring', stiffness: 320, damping: 30 } }}
              className="relative w-[250px]" style={card}>
              <div className={`${many ? 'h-[58px]' : 'h-[72px]'} grid place-items-center rounded-t-[17px]`} style={{ background: t.soft, borderBottom: `3px solid ${I}` }}><span className={`${many ? 'w-12 h-12' : 'w-14 h-14'} rounded-full grid place-items-center`} style={{ background: PP.paper, border: `3px solid ${I}` }}><Badge t={t} size={many ? 32 : 38} /></span></div>
              <button type="button" aria-label={`Remove ${t.name}`} onClick={() => remove(t)} className="absolute -top-3 -right-3 w-9 h-9 rounded-full grid place-items-center" style={{ background: '#fff', border: `2.5px solid ${I}`, boxShadow: `0 2px 0 ${I}` }}><X weight="bold" size={16} /></button>
              <div className={`${many ? 'p-3 gap-2' : 'p-4 gap-3'} grid`}>
                <span className="h-11 px-4 rounded-xl flex items-center justify-center font-bold text-[19px]" style={{ background: PP.paper, border: `2.5px solid ${I}` }}>{t.name}</span>
                <div className="flex flex-wrap justify-center gap-1.5 text-[16px] font-bold">{['Ava', 'Leo'].map((n) => <span key={n} className="px-3 py-1 rounded-full" style={{ background: t.soft, border: `2px solid ${I}` }}>{n}</span>)}
                  <span className="px-3 py-1 rounded-full inline-flex items-center gap-1" style={{ border: `2px dashed ${PP.quiet}`, color: PP.quiet }}><Plus weight="bold" size={14} />Add</span></div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </MenuStep>
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
  // Straight on the purple ground, no white panel (teacher, 2026-11-23, newest).
  return (
    <Wizard step={5} total={5} title="Power-ups" last>
      <div className="grid grid-cols-3 gap-x-8 gap-y-7">
        {SETUP.map((c) => (
          <div key={c.id} className="relative w-[320px] h-[196px] grid justify-items-center content-center gap-2 text-center rounded-[24px]"
            style={c.on ? { background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}` } : { background: PP.cream, border: `3px dashed ${I}` }}>
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
      <Over>
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
      </Over>
    </div>
  );
}

// ---------- question screen: the game's theme around the standard card ----------
const ANS = [['A', 'the dog ran.', PP.periwinkle, PP.gamify], ['B', 'The dog ran.', PP.sky, PP.blueCrystal], ['C', 'The dog ran', PP.pink, PP.blush], ['D', 'the dog ran', PP.lemon, PP.butter]] as const;
// Teacher, 2026-11-24: thinner answer tiles at ONE fixed size; the question
// gets a fixed generous block and its font steps down for long questions; the
// card is about 85% of the frame so more of the theme shows around it.
const SHORT_Q = 'Which one starts with a capital letter?';
const LONG_Q = 'Read the sentence: "my dog likes to run in the park." Which one fixes it with a capital letter at the start and punctuation at the end?';
function qSize(q: string, big: boolean) { const n = q.length; return big ? (n <= 60 ? 54 : n <= 110 ? 44 : 36) : (n <= 60 ? 46 : n <= 110 ? 36 : 30); }
function QCard({ tablet, q = SHORT_Q }: { tablet?: boolean; q?: string }) {
  const big = !!tablet;
  const b = big ? 60 : 52, ic = big ? 26 : 22;
  return (
    <div className={`${big ? 'w-[697px]' : 'w-[1088px]'} rounded-[30px] flex flex-col gap-5`} style={{ background: '#fff', border: `3px solid ${I}`, boxShadow: `0 6px 0 ${I}`, padding: big ? 28 : 26 }}>
      {/* Her page 2 header: the current team left; tools, settings, full screen, close, then Listen on the right. */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-3 flex-1 min-w-0"><TurnGlow round><span className="grid place-items-center rounded-full" style={{ width: b, height: b, background: '#fff', border: `3px solid ${I}` }}><Badge t={TEAMS[1]} size={b * 0.62} /></span></TurnGlow><b className="truncate" style={{ fontSize: big ? 30 : 26 }}>Team Sky</b></span>
        <Round size={b} label="Tools"><Toolbox weight="bold" size={ic} /></Round>
        <Round size={b} label="Settings"><GearSix weight="bold" size={ic} /></Round>
        <Round size={b} label="Full screen"><CornersOut weight="bold" size={ic} /></Round>
        <Round size={b} label="Close"><X weight="bold" size={ic} /></Round>
        <span className="px-5 rounded-full inline-flex items-center gap-2 font-bold shrink-0" style={{ minHeight: b, fontSize: big ? 24 : 20, background: PP.blueCrystal, border: `2px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}><SpeakerHigh weight="bold" size={ic} />Listen</span>
      </div>
      <div className="flex items-center" style={{ height: big ? 330 : 200 }}>
        <h2 className="font-bold text-left leading-snug" style={{ fontSize: qSize(q, big) }}>{q}</h2>
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${big ? 1 : 2}, 1fr)` }}>
        {ANS.map(([l, txt, c, bg]) => (
          <div key={l} className="flex items-center gap-4 px-4 rounded-[20px] font-bold" style={{ height: big ? 92 : 84, fontSize: big ? 38 : 32, background: bg, border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}` }}>
            <span className="shrink-0 rounded-full grid place-items-center" style={{ ...GY, width: big ? 64 : 58, height: big ? 64 : 58, fontSize: big ? 36 : 32, background: c, border: `3px solid ${I}` }}>{l}</span>{txt}
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
function QLaptop({ theme, q }: { theme: ThemeId; q?: string }) {
  const f = useFrame(); const w = f.adaptive ? f.w : 1280, h = f.adaptive ? f.h : 800;
  return (
    <div className="w-full h-full relative">
      <ThemeBack id={theme} w={w} h={h} />
      <div className="absolute inset-0 p-8"><AutoFit><QCard q={q} /></AutoFit></div>
    </div>
  );
}
function QTablet({ theme, q }: { theme: ThemeId; q?: string }) {
  const f = useFrame(); const w = f.adaptive ? f.w : 820, h = f.adaptive ? f.h : 1180;
  return (
    <div className="w-full h-full relative">
      <ThemeBack id={theme} w={w} h={h} />
      <div className="absolute inset-0" style={{ padding: w < 600 ? 14 : 40 }}><AutoFit><QCard tablet q={q} /></AutoFit></div>
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
  const f = useFrame();
  return (
    <div className="w-full h-full relative">
      <ParkBack w={f.adaptive ? f.w : 1280} h={f.adaptive ? f.h : 800} />
      <div className="absolute inset-0"><AutoFit><div className="relative w-[1280px] h-[800px] flex flex-col items-center gap-6 px-10 pt-9 pb-8">
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
                  {i === 1 ? <TurnGlow round><Badge t={t} size={36} /></TurnGlow> : <Badge t={t} size={36} />}<b className="flex-1 text-[20px] truncate">{t.name}</b><span className="text-[36px] tabular-nums" style={GY}>{[80, 110, 60, 95][i]}</span>
                </div>
              );
              return <div key={t.name}>{row}</div>;
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
      </div></AutoFit></div>
    </div>
  );
}
function V10() {
  return (
    <div className="w-full h-full relative">
      <Board dim />
      <Over>
        <div className="relative">
          <Paper layer={PP.blush} tilt={-1.5} pad={0} className="w-[820px]">
            <div className="px-10 pt-9 pb-9 grid justify-items-center gap-6 text-center">
              <h2 className="relative z-10 text-[80px]" style={GY}>Great game!</h2>
              <div className="flex items-end gap-6">
                {[1, 0, 2].map((i) => { const t = TEAMS[i]; return (
                  <div key={t.name} className="grid justify-items-center gap-3">
                    {i === 0
                      ? <TurnGlow round><span className="w-[120px] h-[120px] rounded-full grid place-items-center" style={{ background: PP.paper, border: `3px solid ${I}` }}><Badge t={t} size={78} /></span></TurnGlow>
                      : <Badge t={t} size={60} />}
                    <span className="relative w-[150px] rounded-t-[20px] grid place-items-center text-[44px]" style={{ ...GY, height: [150, 110, 80][i], background: i === 0 ? PP.periwinkle : t.soft, border: `3px solid ${I}` }}>{i + 1}</span>
                  </div>); })}
              </div>
              <div className="relative z-10 flex gap-4 justify-center items-center"><MainBtn big><Play weight="fill" size={26} />Play again</MainBtn><SecondBtn>New game</SecondBtn><SecondBtn>Review</SecondBtn><SecondBtn><Star weight="bold" size={20} />Rate</SecondBtn></div>
            </div>
          </Paper>
          <Corner id="star" x="-56px" y="30px" rot={-14} />
          <Corner id="balloon" x="768px" y="140px" rot={12} />
        </div>
      </Over>
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
      <Over>
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
      </Over>
    </div>
  );
}
function V11b() {
  return (
    <div className="w-full h-full relative">
      <Board dim />
      <Over>
        <Paper pad={44} className="w-[600px]" layer={PP.blueCrystal}>
          <div className="grid justify-items-center gap-4 text-center">
            <span className="relative w-36 h-36 grid place-items-center"><BlobPatch color={PP.blueCrystal} size={150} /><span className="relative w-24 h-24 rounded-full grid place-items-center" style={{ background: PP.paper, border: `3px solid ${I}` }}><Pause weight="bold" size={52} /></span></span>
            <h2 className="text-[68px]" style={GY}>Paused</h2>
            <p className="font-bold text-[26px] leading-snug">Your teacher paused the game. It will be back soon.</p>
          </div>
        </Paper>
      </Over>
    </div>
  );
}
// The teacher's own pause message (teacher, 2026-11-24).
function V11c({ msg = 'Eyes on me! We will finish after lunch.' }: { msg?: string }) {
  return (
    <div className="w-full h-full relative">
      <Board dim />
      <Over>
        <Paper pad={44} className="w-[760px]" layer={PP.blueCrystal}>
          <div className="grid justify-items-center gap-4 text-center">
            <span className="relative w-28 h-28 grid place-items-center"><BlobPatch color={PP.blueCrystal} size={120} /><span className="relative w-20 h-20 rounded-full grid place-items-center" style={{ background: PP.paper, border: `3px solid ${I}` }}><Pause weight="bold" size={44} /></span></span>
            <p className="font-bold text-[54px] leading-tight">{msg}</p>
            <span className="font-bold text-[20px]" style={{ color: PP.quiet }}>from your teacher</span>
          </div>
        </Paper>
      </Over>
    </div>
  );
}
// ---------- student join and name pick, iPad first (820 x 1180) ----------
function TabletStage({ children }: { children: ReactNode }) {
  return (
    <div className="w-full h-full relative" style={PURPLE_GROUND}>
      <img src="/brand/gamify-wordmark.png" alt="Gamify" className="absolute left-9 top-9 h-11 w-auto" draggable={false} />
      <span className="absolute right-9 top-8"><Round size={60} label="Accessibility"><PersonArmsSpread weight="bold" size={28} /></Round></span>
      <div className="absolute inset-x-10 top-[130px] bottom-[60px] flex flex-col items-center justify-center gap-9 text-center">{children}</div>
    </div>
  );
}
function V12() {
  return (
    <TabletStage>
      <h1 className="text-[88px]" style={GY}>Join the game</h1>
      <p className="font-bold text-[30px] leading-snug">Type the game code your teacher gave you.</p>
      <div className="flex gap-3">{['4', '7', '2', '9', '', ''].map((d, i) => <span key={i} className="w-[104px] h-[128px] rounded-[22px] grid place-items-center text-[76px]" style={{ ...GY, background: i === 4 ? PP.butter : PP.paper, border: `3px solid ${I}`, boxShadow: i === 4 ? `0 0 0 6px ${PP.lemon}` : `0 5px 0 ${I}`, marginLeft: i === 3 ? 22 : 0 }}>{d}</span>)}</div>
      <div className="grid grid-cols-3 gap-4">{['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'x'].map((k, i) => k === '' ? <span key={i} /> : <span key={i} className="w-[150px] h-[96px] rounded-[22px] grid place-items-center text-[48px]" style={{ ...GY, background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}` }}>{k === 'x' ? <ArrowLeft weight="bold" size={44} /> : k}</span>)}</div>
      <div className="flex gap-4 items-center"><SecondBtn h={72}><SpeakerHigh weight="bold" size={28} />Hear my code</SecondBtn><MainBtn big>Go<ArrowRight weight="bold" size={30} /></MainBtn></div>
    </TabletStage>
  );
}
function V12n() {
  const names = ['Ava', 'Leo', 'Mia', 'Noah', 'Zoe', 'Eli', 'Ivy', 'Max', 'Ruby', 'Sam', 'Lily', 'Owen', 'June', 'Kai'];
  return (
    <TabletStage>
      <h1 className="text-[80px]" style={GY}>Tap your name</h1>
      <div className="grid grid-cols-2 gap-4 w-full">
        {names.map((n, i) => (
          <span key={n} className="relative h-[92px] rounded-[24px] flex items-center justify-center font-bold text-[36px]" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: i === 2 ? `${SEL}, 0 5px 0 ${I}` : `0 5px 0 ${I}` }}>
            {n}{i === 2 && <span className="absolute -top-3 -right-3"><Check40 size={44} /></span>}
          </span>
        ))}
      </div>
      <MainBtn big><Play weight="fill" size={30} />That&apos;s me!</MainBtn>
    </TabletStage>
  );
}
// ---------- Live setup (teacher): only under Live ----------
function ClassHow() {
  const ways = [['Together', 'Fill one goal as a class', PP.blueCrystal, true], ['Compete', 'A leaderboard of names and points', PP.blush, false]] as const;
  return (
    <Wizard step={4} total={5} title="How the class plays">
      <div className="grid justify-items-center gap-9">
        <div className="flex justify-center gap-8">
          {ways.map(([n, l, c, on]) => (
            <div key={n} className="relative w-[340px] h-[230px] rounded-[24px] flex flex-col" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: on ? `${SEL}, 0 10px 0 ${I}` : `0 5px 0 ${I}`, transform: on ? 'translateY(-6px)' : undefined }}>
              <span className="flex-1 grid place-items-center rounded-t-[21px]" style={{ background: c, borderBottom: `3px solid ${I}` }}>{on ? <UsersThree weight="bold" size={84} /> : <Star weight="bold" size={84} />}</span>
              <span className="px-4 py-3 text-center"><b className="text-[34px] block" style={GY}>{n}</b><span className="text-[18px] font-semibold">{l}</span></span>
              {on && <span className="absolute -top-4 -right-4"><Check40 /></span>}
            </div>
          ))}
        </div>
        <OptCard label="The game ends"><Seg opts={['When I stop it', 'After a number right', 'At time']} pick={0} /></OptCard>
      </div>
    </Wizard>
  );
}
// ---------- lobbies ----------
function CodeChip() {
  return <div className="flex items-center px-10 h-[84px] rounded-full" style={{ background: '#fff', border: `3px solid ${I}`, boxShadow: LIFT }}><span className="text-[52px] whitespace-nowrap tracking-[0.12em]" style={GY}>472 915</span></div>;
}
const NAMES = ['Ava', 'Leo', 'Mia', 'Noah', 'Zoe', 'Eli', 'Ivy', 'Max', 'Ruby', 'Sam', 'Lily', 'Owen'];
function V12b() {
  return (
    <MenuStep title="Race lobby" step={6} total={6} go={<MainBtn big><Play weight="fill" size={28} />Start the race</MainBtn>}>
      <CodeChip />
      <div className="w-full grid grid-cols-4 gap-5 mt-7">
        {TEAMS.map((t, i) => (
          <div key={t.name} className="flex flex-col items-center gap-3 pt-5 pb-5 rounded-[26px]" style={{ background: t.soft, border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}` }}>
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
      <div className="mt-7 px-9 py-6 grid justify-items-center gap-4 rounded-[26px]" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}` }}>
        <span className="flex items-center gap-3 text-[30px] font-bold"><Star weight="fill" size={40} color={PP.lemon} />Our goal: fill the sky with 60 stars</span>
        <span className="flex items-center gap-4"><Meter segments={1} done={0} part={0.04} width={560} label="0 of 60 stars" /><b className="text-[22px] tabular-nums">0 of 60</b></span>
      </div>
      <div className="flex flex-wrap justify-center gap-3 max-w-[900px] mt-7">{NAMES.map((n, i) => <span key={n} className="px-5 h-12 rounded-full font-bold text-[22px] flex items-center" style={{ background: soft[i % 6], border: `3px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}>{n}</span>)}</div>
    </MenuStep>
  );
}


type V = { n: string; name: string; view: ReactNode; note: string; port?: ReactNode; fit?: boolean; tall?: boolean };
// Every shared screen, in the order a class meets them (teacher, 2026-11-23:
// "all these screens would be considered universal and should be moved to universal page").
const VIEWS: V[] = [
  { n: '1', fit: true, name: 'Welcome', view: <V1 />, note: 'Her original layout: the cover (a real miniature of the game in play) big on the left; the right column exactly as tall, spread evenly: the title row with the corner buttons, the description and ways to play, the How to play card, a 72px start button level with the cover bottom.' },
  { n: '2a', fit: true, name: 'How will you play? (Share picked)', view: <V2 pick="Share" />, note: 'No white panel: the cards sit on the purple ground. "How do you share?" shows only because Share is picked.' },
  { n: '2b', fit: true, name: 'How will you play? (Solo picked)', view: <V2 pick="Solo" />, note: 'Solo shows only its own setting: who you play against.' },
  { n: '3', fit: true, name: 'Share a join code', view: <ShareCode />, note: 'Only after Share and "Share a join code": the code big on one paper card.' },
  { n: '4', fit: true, name: 'Question set', view: <V3 />, note: 'Tabs, search, subject and grade filters, recent first; each card shows subject, grades, count, the first question and when it was used.' },
  { n: '5', fit: true, name: 'Options', view: <V4 />, note: 'Each option group is its own card on the ground; only real field labels.' },
  { n: '6', fit: true, name: 'Teams and players', view: <V5 />, note: 'No count selector: Add team (between Back and Next) pops a new card in while the others slide over; x removes one. Two to eight teams, centered, wrapping onto centered rows.' },
  { n: '7', fit: true, name: 'Power-up setup', view: <V6 />, note: 'The cards on the purple ground, centered; off cards dashed.' },
  { n: '8', fit: true, name: 'Teacher: how the class plays (Live only)', view: <ClassHow />, note: 'Shows only when Live is picked: Together or Compete, and when the game ends.' },
  { n: '9a', fit: true, name: 'Lobby: competitive', view: <V12b />, note: 'Teams in their colors and shapes, names joining under each.' },
  { n: '9b', fit: true, name: 'Lobby: cooperative', view: <V12c />, note: 'One class goal with its bar, every name joining one group.' },
  { n: '11a', name: 'Top tracker: solo, share, live', view: <V9a />, note: 'Who or what left, Round X of Y in the middle, icon buttons right.' },
  { n: '11b', fit: true, name: 'Scoreboard and held power-ups', view: <V9b />, note: 'No panel; the current team wears the turn glow; held power-ups are square cards.' },
  { n: '12', fit: true, name: 'Power-up pop card', view: <V7 />, note: 'One flat card with soft rays over the game.' },
  { n: '13', fit: true, name: 'Results', view: <V10 />, note: 'The winner wears the same turn glow.' },
  { n: '14', fit: true, name: 'Settings and Calm', view: <V11 />, note: 'Calm mode first and biggest.' },
  { n: '15a', fit: true, name: 'Pause: default', view: <V11b />, note: 'A plain calm card.' },
  { n: '15b', fit: true, name: 'Pause: teacher message', view: <V11c />, note: 'Her own words big; a small "from your teacher" line under them.' },
];
const TABLETS: V[] = [
  { n: '17', tall: true, name: 'Student join (iPad)', view: <V12 />, note: '104px digit boxes and a 150 x 96 keypad for small fingers; Hear my code.' },
  { n: '18', tall: true, name: 'Student name pick (iPad)', view: <V12n />, note: 'Class list names as big tap cards; picked = ink ring and green check.' },
];

export default function UniversalViews() {
  return (
    <section className="grid gap-6">
      <div className="grid gap-1 justify-items-center text-center">
        <h2 className="font-heading text-2xl">Universal views <span className="text-base align-middle px-2 py-0.5 rounded-full border-2 border-black bg-[#fdfd94]">Proposal</span></h2>
        <p className="text-sm font-semibold text-muted max-w-prose">Every shared screen, the same in every game: the welcome, the start menus (no white panel, cards on the purple ground, settings only under the way they belong to), join, lobbies, the one question screen, trackers, results, settings and pause. Each game&apos;s themable views are on Game mockups. Preview only.</p>
      </div>
      <div className="grid gap-10 lg:grid-cols-2">
        {[...VIEWS.slice(0, 11), ...TABLETS, ...VIEWS.slice(11)].map((v) => (
          <figure key={v.n} className="m-0 grid gap-3 content-start">
            <figcaption className="font-heading text-lg text-center">{v.n}. {v.name}</figcaption>
            {v.tall ? <DeviceSet land={v.view} port={v.view} landSize={[820, 1180]} /> : <DeviceSet land={v.view} port={v.port} adaptive={v.fit} />}
            <p className="text-sm font-semibold text-center">{v.note}</p>
          </figure>
        ))}
      </div>
      {/* Teacher, 2026-11-24: one fixed tile size; the question block is fixed and its type steps down for long questions. */}
      <div className="grid gap-3">
        <h3 className="font-heading text-lg text-center">10. Question screen: a short and a long question</h3>
        <div className="grid gap-10 lg:grid-cols-2">
          {([['Short question', SHORT_Q], ['Long question', LONG_Q]] as const).map(([t, q]) => (
            <figure key={t} className="m-0 grid gap-3 content-start">
              <figcaption className="font-heading text-base text-center">{t}</figcaption>
              <DeviceSet adaptive land={<QLaptop theme="park" q={q} />} port={<QTablet theme="park" q={q} />} />
            </figure>
          ))}
        </div>
        <p className="text-sm font-semibold text-center">The ONE question screen; games only swap the background (Board Game park here). Answer tiles stay one size (84px laptop, 92px iPad portrait); the question block is fixed (200px, 330px portrait) and the question steps down from 46 to 36 to 30px (54, 44, 36 on iPad) as it gets longer. The card is 85% of the screen width.</p>
      </div>
    </section>
  );
}
