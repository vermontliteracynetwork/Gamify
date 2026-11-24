import { useState, type CSSProperties, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useSettings } from '../settings/SettingsContext';
import {
  ArrowLeft, ArrowRight, CaretDown, Check, MagnifyingGlass, Pause,
  GearSix, Play, Plus, SpeakerHigh, Star, X,
} from '@phosphor-icons/react';
import { PP } from './PaletteProposal';
import { CrayonPowerUp, Doodle, type PowerId } from './CrayonKit';
import { STARTER, StickerArt } from './Stickers';
import { AutoFit, FitTitle, GameTools, IconBadge, MenuGo, PhoneTools, usePhone, PowerCard, QuestionCard, SHORT_Q, LONG_Q, Badge, DeviceSet, Laptop, MainBtn as BaseBtn, MenuStep, Meter, useFrame, MORE_TEAMS, type Team, WAYS_STYLE, WelcomeScreen, ParkBack, PURPLE_GROUND, SkyBack, StudioBack, Tablet, TEAMS, TurnGlow, GText } from './mockKit';
import { GAME_COVERS } from './GameMockups';
import ClassModeIcon, { CLASS_MODE_COLORS } from '../live/ClassModeIcon';

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
// In-game groups add the lightbulb hint beside Settings (teacher, 2026-11-24); tips open in a card, never as lines on the board.
function Tools({ size = 52, access = false, hint }: { size?: number; access?: boolean; hint?: boolean }) {
  return <GameTools size={size} access={access} hint={!!hint} />;
}
function SecondBtn({ children, h = 56 }: { children: ReactNode; h?: number }) {
  return <span className="px-6 rounded-full font-bold text-[20px] inline-flex items-center gap-2 shrink-0 whitespace-nowrap" style={{ minHeight: h, background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}` }}>{children}</span>;
}
function Check40({ size = 40 }: { size?: number }) {
  return <span className="rounded-full grid place-items-center" style={{ width: size, height: size, background: PP.kelly, border: `3px solid ${I}` }}><Check weight="bold" size={size * 0.5} /></span>;
}
function Seg({ opts, pick, h = 56, size = 20, vertical }: { opts: string[]; pick: number; h?: number; size?: number; vertical?: boolean }) {
  return (
    <span className={`${vertical ? 'grid w-full rounded-[28px]' : 'inline-flex rounded-full'} p-1.5 font-bold gap-1`} style={{ background: PP.cream, border: `3px solid ${I}`, fontSize: size }}>
      {opts.map((o, i) => <span key={o} className={`px-6 rounded-full inline-flex items-center gap-2 whitespace-nowrap ${vertical ? 'justify-center' : ''}`} style={{ minHeight: h - 12, ...(i === pick ? PICK : {}) }}>{i === pick && <Check weight="bold" size={size * 0.8} />}{o}</span>)}
    </span>
  );
}
function Wizard({ step, total, title, children, last, go }: { step: number; total: number; title: string; children: ReactNode; last?: boolean; go?: ReactNode }) {
  return <MenuStep title={title} step={step + 1} total={total + 1} go={go ?? (last ? <MainBtn><Play weight="fill" size={24} />Play</MainBtn> : undefined)}>{children}</MenuStep>;
}
const NextOff = ({ off }: { off: boolean }) => <MenuGo disabled={off}>Next<ArrowRight weight="bold" size={24} /></MenuGo>;
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
      <div className={`absolute grid gap-2 p-3 rounded-[24px] ${f.kind === 'phone' ? 'grid-cols-5 grid-rows-8' : 'grid-cols-8 grid-rows-5'}`} style={{ inset: f.kind === 'phone' ? 20 : 80, background: PP.paper, border: `3px solid ${I}` }}>
        {Array.from({ length: 40 }, (_, i) => <span key={i} className="rounded-xl" style={{ background: [PP.paper, PP.butter, PP.gamify, PP.aqua, PP.blush][i % 5], border: `2.5px solid ${I}` }} />)}
      </div>
      {dim && <div className="absolute inset-0" style={{ background: 'rgba(29,26,51,0.5)' }} />}
    </div>
  );
}
const sticker = (id: string) => STARTER.find((s) => s.id === id) ?? STARTER[0];

// ---------- the universal top tracker ----------
// Left: who or what (score, whose turn, class goal). Middle: round X of Y over
// a chunky meter, one segment per round, no numbers on it. Right: icon buttons.
type Mode = 'solo' | 'share' | 'live';
function RoundMeter({ round, rounds, part, w = 360 }: { round: number; rounds: number; part: number; w?: number | string }) {
  return <Meter segments={rounds} done={round - 1} part={part} width={w} label={`Round ${round} of ${rounds}`} />;
}
function Tracker({ mode, k = 1, narrow }: { mode: Mode; k?: number; narrow?: boolean }) {
  const phone = usePhone();
  if (phone) {
    // Phone: the strip becomes a compact card, who or what left with the Hint
    // and Menu rounds right, the meter full width under them.
    const left = mode === 'solo'
      ? <span className="flex items-baseline gap-1.5"><span style={{ ...GY, fontSize: 40 }} className="tabular-nums"><GText>120</GText></span><b className="text-[16px]" style={{ color: PP.quiet }}>points</b></span>
      : mode === 'share'
        ? <span className="flex items-center gap-2"><Badge t={TEAMS[1]} size={36} /><b className="whitespace-nowrap text-[20px]">Team Sky</b></span>
        : <span className="flex items-center gap-2"><Star weight="fill" size={30} color={PP.lemon} /><b className="whitespace-nowrap text-[18px]">38 of 60 stars</b></span>;
    return (
      <div className="w-full grid gap-2.5 px-3 py-2.5 rounded-[26px]" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}` }}>
        <div className="flex items-center justify-between gap-2">{left}<PhoneTools /></div>
        <RoundMeter round={2} rounds={3} part={0.5} w="100%" />
      </div>
    );
  }
  const left = mode === 'solo'
    ? <span className="flex items-baseline gap-2"><span style={{ ...GY, fontSize: 56 * k }} className="tabular-nums"><GText>120</GText></span><b style={{ fontSize: 18 * k, color: PP.quiet }}>points</b></span>
    : mode === 'share'
      ? <span className="flex items-center gap-3"><Badge t={TEAMS[1]} size={48 * k} /><b className="whitespace-nowrap" style={{ fontSize: 24 * k }}>Team Sky</b></span>
      : <span className="flex items-center gap-3"><Star weight="fill" size={40 * k} color={PP.lemon} /><span className="grid"><b className="whitespace-nowrap" style={{ fontSize: 24 * k }}>38 of 60 stars</b></span></span>;
  return (
    <div className={`w-full grid grid-cols-[1fr_auto_1fr] items-center ${narrow ? "gap-3 px-4" : "gap-6 px-6"} rounded-full`} style={{ minHeight: 84 * k, background: PP.paper, border: `3px solid ${I}`, boxShadow: LIFT }}>
      <div className="justify-self-start">{left}</div>
      <RoundMeter round={2} rounds={3} part={0.5} w={narrow ? 150 : k < 1 ? 190 : 300} />
      <div className="justify-self-end"><Tools size={48} hint /></div>
    </div>
  );
}

// ---------- views ----------
function V1({ id = 'castle-quest' }: { id?: string }) {
  // Her original live welcome layout, the right column a full-height column spread evenly (teacher, 2026-11-23).
  const g = GAME_COVERS.find((x) => x.id === id) ?? GAME_COVERS[1];
  return <WelcomeScreen name={g.name} desc={g.desc} modes={g.modes} cover={g.cover}
    steps={[[<Check key="a" weight="bold" size={24} />, g.steps[0]], [<Star key="b" weight="bold" size={24} />, g.steps[1]], [<ArrowRight key="c" weight="bold" size={24} />, g.steps[2]]]} />;
}
// An option group as one card on the purple ground (no white panel behind the step).
function OptCard({ label, children }: { label: string; children: ReactNode }) {
  return <div className="px-8 py-5 grid justify-items-center gap-3 rounded-[24px]" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}` }}><b className="text-[22px]">{label}</b>{children}</div>;
}
const WAYS = (['Share', 'Live', 'Solo'] as const).map((id) => ({ id, ...WAYS_STYLE[id] }));
// Settings show only under the way they belong to (teacher, 2026-11-23).
// Solo is picked first so no extra setting shows; the line under each name
// appears on hover (on touch: under the picked card); names read bigger
// (teacher, 2026-11-24).
function V2({ pick: first }: { pick?: 'Share' | 'Solo' }) {
  // No card is picked at first (teacher, 2026-11-24, replaces "opens on Solo"):
  // no follow-up setting shows and Next stays off until a card is tapped.
  const [pick, setPick] = useState<string | undefined>(first);
  const phone = useFrame().kind === 'phone';
  const follow = pick === 'Share' ? <OptCard label="How do you share?"><Seg opts={['Same device', 'Share a join code']} pick={0} vertical={phone} /></OptCard>
    : pick === 'Live' ? <OptCard label="How the class plays"><Seg opts={['Cooperative', 'Competitive']} pick={0} vertical={phone} /></OptCard> : null;
  return (
    <Wizard step={1} total={5} title="How will you play?" go={<NextOff off={!pick} />}>
      <div className={`flex flex-col items-center ${phone ? 'gap-5 w-full' : 'gap-9'}`}>
        {/* On touch (no hover) the picked card shows its line; hover devices show it on hover (teacher, 2026-11-24). */}
        <style>{'@media (hover: none) { .way-on .way-hint { display: block } .way-on b { font-size: 30px } }'}</style>
        <div className={phone ? 'grid gap-4 w-full' : 'flex gap-8'}>
          {WAYS.map((w) => { const on = w.id === pick; return phone ? (
            // Phone: one column of row cards, the icon on its pastel left, the name right; the line shows under the picked one.
            <button type="button" key={w.id} onClick={() => setPick(w.id)} className="relative w-full h-[100px] rounded-[22px] flex items-stretch text-left" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: on ? `${SEL}, 0 6px 0 ${I}` : `0 5px 0 ${I}` }}>
              <span className="w-[100px] grid place-items-center rounded-l-[19px] shrink-0" style={{ background: w.soft, borderRight: `3px solid ${I}` }}><IconBadge size={68} bg={w.bright} ring><w.icon weight="bold" size={40} /></IconBadge></span>
              <span className="flex-1 min-w-0 px-4 grid content-center gap-1"><b className="block text-[30px] leading-none" style={GY}><GText>{w.id}</GText></b>{on && <span className="text-[16px] font-semibold leading-snug">{w.hint}</span>}</span>
              {on && <span className="absolute -top-3 -right-3"><Check40 size={36} /></span>}
            </button>
          ) : (
            <button type="button" key={w.id} onClick={() => setPick(w.id)} className={`group relative ${on ? 'way-on' : ''} w-[268px] h-[262px] rounded-[24px] flex flex-col text-left`} style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: on ? `${SEL}, 0 10px 0 ${I}` : `0 5px 0 ${I}`, transform: on ? 'translateY(-6px)' : undefined }}>
              <span className="flex-1 w-full grid place-items-center rounded-t-[21px]" style={{ background: w.soft, borderBottom: `3px solid ${I}` }}><IconBadge size={128} bg={w.bright} ring><w.icon weight="bold" size={80} /></IconBadge></span>
              <span className="w-full h-[78px] px-4 grid place-content-center text-center">
                <b className="block text-[40px] leading-none group-hover:text-[30px] transition-[font-size] duration-200" style={GY}><GText>{w.id}</GText></b>
                <span className="way-hint text-[17px] font-semibold hidden group-hover:block">{w.hint}</span>
              </span>
              {on && <span className="absolute -top-4 -right-4"><Check40 /></span>}
            </button>); })}
        </div>
        {follow}
      </div>
    </Wizard>
  );
}
function ShareCode() {
  const phone = useFrame().kind === 'phone';
  return (
    <Wizard step={1} total={5} title="Share a join code">
      <div className="grid justify-items-center gap-6">
        {/* The code stays on ONE line; on a phone its font shrinks to fit the card (teacher, 2026-11-24). */}
        {phone
          ? <span className="w-[330px] px-5 py-4 rounded-[26px] grid" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 6px 0 ${I}` }}><FitTitle center max={84} min={40} style={{ letterSpacing: '0.12em' }}>472 915</FitTitle></span>
          : <span className="px-10 py-4 rounded-[26px] tracking-[0.2em] whitespace-nowrap" style={{ ...GY, fontSize: 120, background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 6px 0 ${I}` }}><GText>472 915</GText></span>}
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
  // Portrait reflows: filters wrap, two columns on an iPad, one on a phone (no cut-off cards).
  const f = useFrame(); const port = f.adaptive && f.portrait, phone = port && f.w < 600;
  const sets = phone ? SETS.slice(0, 2) : SETS;
  return (
    <Wizard step={2} total={5} title="Question set">
      <div className="w-full grid gap-4">
        <div className={`flex items-center justify-center gap-3 ${port ? 'flex-wrap' : ''}`}>
          <Seg opts={['My sets', 'Public sets']} pick={0} h={52} size={18} />
          <span className="h-[52px] px-5 rounded-full flex items-center gap-3 font-semibold text-[18px]" style={{ width: phone ? '100%' : 240, background: '#fff', border: `2.5px solid ${I}`, color: PP.quiet }}><MagnifyingGlass weight="bold" size={22} />Search sets</span>
          <span className="flex flex-wrap justify-center gap-1.5"><Chip on>All subjects</Chip><Chip>ELA</Chip><Chip>Math</Chip>{!phone && <Chip>Science</Chip>}</span>
          <Chip>All grades<CaretDown weight="bold" size={14} /></Chip>
        </div>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${phone ? 1 : port ? 2 : 3}, minmax(0, 1fr))` }}>
          {sets.map((x, i) => (
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
  const f = useFrame(); const one = f.kind === 'phone';
  return (
    <Wizard step={3} total={5} title="Options">
      <div className={`w-full grid ${one ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-6'}`}>
        <Group title="The game">
          <Row label="Rounds">
            <span className="relative w-[260px] h-5 rounded-full mt-3" style={{ background: PP.blueCrystal, border: `3px solid ${I}` }}>
              <span className="absolute inset-y-0 left-0 w-1/2 rounded-full" style={{ background: PP.periwinkle }} />
              <span className="absolute -top-[18px] left-1/2 -translate-x-1/2 w-12 h-12 rounded-full grid place-items-center text-[22px]" style={{ ...GY, background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}><GText>10</GText></span>
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
  const phone = usePhone();
  return (
    <MenuStep title="Teams" step={5} total={6} extra={addBtn}>
      <div className={`w-full h-full flex flex-wrap justify-center content-center ${phone ? 'gap-3' : 'gap-5'}`}>
        <AnimatePresence initial={false}>
          {teams.map((t) => (
            <motion.div key={t.name} layout={!still}
              initial={still ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={still ? { opacity: 0, transition: { duration: 0 } } : { scale: 0.6, opacity: 0, transition: { duration: 0.18 } }}
              transition={still ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 17, layout: { type: 'spring', stiffness: 320, damping: 30 } }}
              className={`relative ${phone ? 'w-[164px]' : 'w-[250px]'}`} style={card}>
              <div className={`${many ? 'h-[58px]' : 'h-[72px]'} grid place-items-center rounded-t-[17px]`} style={{ background: t.soft, borderBottom: `3px solid ${I}` }}><Badge t={t} size={many ? 46 : 54} /></div>
              <button type="button" aria-label={`Remove ${t.name}`} onClick={() => remove(t)} className="absolute -top-3 -right-3 w-12 h-12 rounded-full grid place-items-center" style={{ background: '#fff', border: `2.5px solid ${I}`, boxShadow: `0 2px 0 ${I}` }}><X weight="bold" size={16} /></button>
              <div className={`${many || phone ? 'p-3 gap-2' : 'p-4 gap-3'} grid`}>
                <span className={`h-11 ${phone ? 'px-1 text-[17px]' : 'px-4 text-[19px]'} rounded-xl flex items-center justify-center font-bold whitespace-nowrap`} style={{ background: PP.paper, border: `2.5px solid ${I}` }}>{t.name}</span>
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
  // Portrait reflows to two columns at real size (iPad first), smaller cards on a phone.
  const f = useFrame(); const port = f.adaptive && f.portrait, phone = port && f.w < 600;
  return (
    <Wizard step={5} total={5} title="Power-ups" last>
      <div className={`grid ${port ? 'grid-cols-2' : 'grid-cols-3'} ${phone ? 'gap-x-4 gap-y-4' : 'gap-x-8 gap-y-7'}`}>
        {SETUP.map((c) => (
          <div key={c.id} className={`relative ${phone ? 'w-[160px] h-[156px] px-2 gap-1' : 'w-[320px] h-[196px] gap-2'} grid justify-items-center content-center text-center rounded-[24px]`}
            style={c.on ? { background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}` } : { background: PP.cream, border: `3px dashed ${I}` }}>
            <span className={`${phone ? 'w-[56px] h-[56px]' : 'w-[76px] h-[76px]'} grid place-items-center`} style={c.on ? undefined : { filter: 'grayscale(1)', opacity: 0.5 }}><CrayonPowerUp id={c.id} size={phone ? 50 : 72} /></span>
            <b className={`${phone ? 'text-[18px]' : 'text-[22px]'} leading-tight`}>{c.name}</b>
            <span className={`${phone ? 'text-[14px]' : 'text-[16px]'} font-semibold leading-snug`} style={{ color: PP.quiet }}>{c.job}</span>
            <span className="absolute -top-3.5 -right-3.5">{c.on ? <Check40 /> : <span className="w-10 h-10 rounded-full grid place-items-center" style={{ background: PP.paper, border: `3px solid ${I}` }}><X weight="bold" size={18} /></span>}</span>
          </div>
        ))}
      </div>
    </Wizard>
  );
}
function V7() {
  const phone = useFrame().kind === 'phone';
  return (
    <div className="w-full h-full relative">
      <Board dim />
      <Over>
        <div className="relative">
          <span aria-hidden="true" className="absolute left-1/2 top-[36%] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ width: phone ? 420 : 620, height: phone ? 420 : 620, background: `repeating-conic-gradient(${PP.butter} 0 10deg, transparent 10deg 20deg)`, maskImage: 'radial-gradient(circle, #000 30%, transparent 70%)', WebkitMaskImage: 'radial-gradient(circle, #000 30%, transparent 70%)', opacity: 0.6 }} />
          <Paper layer={PP.butter} pad={0} className={phone ? 'w-[330px]' : 'w-[540px]'}>
            <div className={`relative grid justify-items-center text-center ${phone ? 'px-6 pt-12 pb-7 gap-2.5' : 'px-10 pt-12 pb-10 gap-3'}`}>
              <span className="absolute top-4 right-4"><Round label="Close" size={phone ? 44 : 52}><X weight="bold" size={phone ? 20 : 24} /></Round></span>
              <div className={`relative grid place-items-center ${phone ? 'w-[140px] h-[140px]' : 'w-[210px] h-[210px]'}`}><CrayonPowerUp id="double-points" size={phone ? 120 : 176} /></div>
              {phone ? <FitTitle center max={44} min={30}>Double Points!</FitTitle> : <b className="text-[56px] whitespace-nowrap" style={GY}><GText>Double Points!</GText></b>}
              <span className={`font-bold leading-snug ${phone ? 'text-[21px]' : 'text-[24px]'}`}>Your next points count twice.</span>
            </div>
          </Paper>
          {(['sparkle', 'star', 'dot', 'sparkle', 'heart'] as const).map((k, i) => <Doodle key={i} kind={k} color={[PP.lemon, PP.pink, PP.sky, PP.kelly, PP.pink][i]} size={phone ? 26 : 36} className="absolute" style={{ left: ['-6%', '100%', '-5%', '99%', '46%'][i], top: ['12%', '22%', '74%', '82%', '104%'][i] }} />)}
        </div>
      </Over>
    </div>
  );
}

// ---------- question screen: the game's theme around the standard card ----------
// The one question card now lives in mockKit (QuestionCard), shared with the game mockups.
const QCard = QuestionCard;
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
function V9a({ narrow }: { narrow?: boolean }) {
  const phone = usePhone();
  return (
    <Stage pad={phone ? 16 : narrow ? 40 : 48}>
      <div className={`w-full flex-1 flex flex-col justify-center ${phone ? 'gap-6' : 'gap-9'}`}>
        {(['solo', 'share', 'live'] as const).map((m) => (
          <Tracker key={m} mode={m} narrow={narrow} />
        ))}
      </div>
    </Stage>
  );
}
const HELD: { id: PowerId; name: string; soft: string }[] = [{ id: 'shield', name: 'Shield', soft: PP.blueCrystal }, { id: 'double-points', name: 'Double Points', soft: PP.butter }];
function V9b() {
  const f = useFrame();
  if (f.kind === 'phone') {
    // Phone (teacher, 2026-11-24): the strip on top, the board fills the
    // middle, the scoreboard collapses to one compact row of team chips (the
    // current team shaded Butter), then a small row of square power-up cards.
    return (
      <div className="w-full h-full relative">
        <ParkBack w={f.w} h={f.h} />
        <div className="absolute inset-0 flex flex-col gap-3 p-4">
          <Tracker mode="share" />
          <div className="w-full flex-1 min-h-0 grid grid-cols-5 grid-rows-6 gap-1.5 p-2.5 rounded-[22px]" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}` }}>
            {Array.from({ length: 30 }, (_, i) => <span key={i} className="rounded-lg" style={{ background: [PP.paper, PP.butter, PP.gamify, PP.aqua][i % 4], border: `2.5px solid ${I}` }} />)}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {TEAMS.map((t, i) => (
              <div key={t.name} aria-label={`${t.name} ${[80, 110, 60, 95][i]}`} className="flex items-center justify-center gap-1.5 h-[52px] rounded-full" style={{ background: i === 1 ? PP.butter : PP.paper, border: `3px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}>
                <Badge t={t} size={28} /><span className="text-[22px] tabular-nums" style={GY}><GText>{[80, 110, 60, 95][i]}</GText></span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 justify-center">{HELD.map((h) => <PowerCard key={h.id} id={h.id} name={h.name} size={62} />)}</div>
        </div>
      </div>
    );
  }
  if (f.adaptive && f.portrait) {
    // Portrait (teacher, 2026-11-24: iPad first): the rail docks under the board;
    // rows two by two, then the square power-up cards, all at real size.
    return (
      <div className="w-full h-full relative">
        <ParkBack w={f.w} h={f.h} />
        <div className="absolute inset-0"><AutoFit><div className="relative w-[820px] h-[1180px] flex flex-col items-center gap-6 px-10 pt-8 pb-8">
          <Tracker mode="share" narrow />
          <div className="w-full flex-1 min-h-0 grid grid-cols-6 grid-rows-5 gap-2 p-3 rounded-[24px]" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 6px 0 ${I}` }}>
            {Array.from({ length: 30 }, (_, i) => <span key={i} className="rounded-xl" style={{ background: [PP.paper, PP.butter, PP.gamify, PP.aqua][i % 4], border: `2.5px solid ${I}` }} />)}
          </div>
          <div className="w-full grid grid-cols-2 gap-3">
            {TEAMS.map((t, i) => (
              <div key={t.name} className="flex items-center gap-3 px-4 h-[64px] rounded-full" style={{ background: i === 1 ? PP.butter : PP.paper, border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}` }}>
                <Badge t={t} size={44} /><b className="flex-1 text-[20px] truncate">{t.name}</b><span className="text-[34px] tabular-nums" style={GY}><GText>{[80, 110, 60, 95][i]}</GText></span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 justify-center">{HELD.map((h) => <PowerCard key={h.id} id={h.id} name={h.name} size={92} />)}</div>
        </div></AutoFit></div>
      </div>
    );
  }
  return (
    <div className="w-full h-full relative">
      <ParkBack w={f.adaptive ? f.w : 1280} h={f.adaptive ? f.h : 800} />
      <div className="absolute inset-0"><AutoFit><div className="relative w-[1280px] h-[800px] flex flex-col items-center gap-6 px-10 pt-9 pb-8">
        <Tracker mode="share" />
        <div className="w-full flex-1 min-h-0 grid grid-cols-[1fr_340px] gap-8">
          <div className="grid grid-cols-6 grid-rows-4 gap-2 p-3 rounded-[24px]" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 6px 0 ${I}` }}>
            {Array.from({ length: 24 }, (_, i) => <span key={i} className="rounded-xl" style={{ background: [PP.paper, PP.butter, PP.gamify, PP.aqua][i % 4], border: `2.5px solid ${I}` }} />)}
          </div>
          {/* No panel: rows sit right on the stage; Butter shading = whose turn; power-ups are single square cards, no tray or label. */}
          <div className="grid gap-4 content-start justify-items-center">
            {TEAMS.map((t, i) => (
              <div key={t.name} className="w-[320px] flex items-center gap-3 px-4 h-[64px] rounded-full" style={{ background: i === 1 ? PP.butter : PP.paper, border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}` }}>
                <Badge t={t} size={44} /><b className="flex-1 text-[20px] truncate">{t.name}</b><span className="text-[36px] tabular-nums" style={GY}><GText>{[80, 110, 60, 95][i]}</GText></span>
              </div>
            ))}
            <div className="flex gap-4 justify-center mt-2">{HELD.map((h) => <PowerCard key={h.id} id={h.id} name={h.name} size={100} />)}</div>
          </div>
        </div>
      </div></AutoFit></div>
    </div>
  );
}
// The results box is THE winner box from Game components (teacher, 2026-11-24):
// title, the winner's icon (no circle) in THE glow, then only the score centered
// under it in Grow Year a little smaller than the title; no podium, no stat chips.
// Stickers show ONLY when this game just earned a new one (teacher, 2026-11-24):
// each sticker once (never two the same), at varied natural spots on the box's
// border (a little over the edge, different sides and corners, a small tilt),
// never over the title, icon, score or buttons, popping in gently.
// Spots on the box edge: a sticker sits on the top or bottom edge, only about
// a quarter of it over the box (inside the box's padding, so never on the
// title, icon, score or buttons), at different places along the edge.
const EARN_SPOTS: { edge: 'top' | 'bottom'; x: number; rot: number }[] = [{ edge: 'top', x: 7, rot: -12 }, { edge: 'bottom', x: 90, rot: 9 }, { edge: 'top', x: 90, rot: 7 }, { edge: 'bottom', x: 10, rot: -6 }];
function EarnedSticker({ id, i, size }: { id: string; i: number; size: number }) {
  const { settings } = useSettings(); const reduce = useReducedMotion(); const still = reduce || settings.motion === 'still' || !!settings.calm;
  const spot = EARN_SPOTS[i % EARN_SPOTS.length];
  return (
    // Always the top layer, and never in the way (teacher, 2026-11-24: "make sure stickers are always
    // top layer and never obstruct the view or ability to use a button"): z-50 over everything, taps pass
    // straight through (pointer-events none), and only about 15% of a sticker sits over the box, inside its
    // padding, so no title, icon, score or button is ever covered.
    <motion.span aria-label="New sticker" className="absolute z-50 pointer-events-none" style={{ left: `calc(${spot.x}% - ${size / 2}px)`, top: spot.edge === 'top' ? -size * 0.85 : `calc(100% - ${size * 0.15}px)` }}
      initial={still ? false : { scale: 0.4, opacity: 0, rotate: 0 }} animate={{ scale: 1, opacity: 1, rotate: spot.rot }} transition={still ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 14, delay: 0.6 + i * 0.35 }}>
      <StickerArt s={sticker(id)} size={size} />
    </motion.span>
  );
}
function V10({ earned = [] }: { earned?: string[] }) {
  const phone = useFrame().kind === 'phone';
  const ids = [...new Set(earned)];
  return (
    <div className="w-full h-full relative">
      <Board dim />
      <Over>
        <div className="relative" style={{ padding: ids.length ? (phone ? '56px 0' : '92px 0') : 0 }}>
          <div className="relative">
            <Paper pad={0} className={phone ? 'w-[340px]' : 'w-[760px]'}>
              <div className={`grid justify-items-center text-center ${phone ? 'px-5 pt-7 pb-6 gap-3' : 'px-10 pt-10 pb-10 gap-5'}`}>
                {phone ? <FitTitle center max={42} min={30}>Team Purple wins!</FitTitle> : <h2 className="relative z-10 text-[64px]" style={GY}><GText>Team Purple wins!</GText></h2>}
                <span className={phone ? 'my-3' : 'my-4'}><TurnGlow><Badge t={TEAMS[0]} size={phone ? 104 : 150} /></TurnGlow></span>
                <b className={`relative z-10 tabular-nums ${phone ? 'text-[36px]' : 'text-[52px]'}`} style={GY}><GText>160 points</GText></b>
                {phone
                  ? <div className="relative z-10 grid gap-3 w-full"><MainBtn big wide><Play weight="fill" size={26} />Play again</MainBtn><div className="grid grid-cols-2 gap-2.5"><span className="min-h-[52px] rounded-full font-bold text-[17px] grid place-items-center text-center leading-tight px-2" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}` }}>New game</span><span className="min-h-[52px] rounded-full font-bold text-[17px] grid place-items-center text-center leading-tight px-2" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}` }}>Review 3 missed</span></div></div>
                  : <div className="relative z-10 flex gap-4 justify-center items-center"><MainBtn big><Play weight="fill" size={26} />Play again</MainBtn><SecondBtn>New game</SecondBtn><SecondBtn>Review 3 missed</SecondBtn></div>}
              </div>
            </Paper>
            {ids.map((id, i) => <EarnedSticker key={id} id={id} i={i} size={phone ? 72 : 118} />)}
          </div>
        </div>
      </Over>
    </div>
  );
}
function Toggle({ on }: { on: boolean }) {
  return <span className="w-[68px] h-10 rounded-full relative shrink-0" style={{ background: on ? PP.kelly : PP.cream, border: `3px solid ${I}` }}><span className="absolute top-[3px] w-7 h-7 rounded-full grid place-items-center" style={{ left: on ? 32 : 3, background: PP.paper, border: `2.5px solid ${I}` }}>{on && <Check weight="bold" size={14} />}</span></span>;
}
function V11() {
  const phone = useFrame().kind === 'phone';
  if (phone) return (
    <div className="w-full h-full relative">
      <Board dim />
      <Over>
        <Paper pad={18} className="w-[350px]" layer={PP.mint}>
          <div className="relative flex items-center justify-center mb-4 min-h-[44px]"><h2 className="text-[40px]" style={GY}><GText>Settings</GText></h2><span className="absolute right-0"><Round label="Close" size={44}><X weight="bold" size={20} /></Round></span></div>
          <div className="grid grid-cols-2 gap-2 mb-4">{['Accessibility', 'Sound', 'Motion', 'Reading'].map((o, i) => <span key={o} className="h-12 rounded-2xl flex items-center justify-center font-bold text-[18px]" style={i === 1 ? PICK : { border: `2.5px solid ${I}`, background: PP.paper }}>{o}</span>)}</div>
          <div className="grid gap-2.5">
            <div className="grid justify-items-center gap-2 p-4 rounded-[22px] text-center" style={{ background: PP.blueCrystal, border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}` }}>
              <span className="flex items-center gap-3"><IconBadge size={52} bg={PP.paper} shape="blob" optical="heart"><Doodle kind="heart" color={PP.lavender} size={28} /></IconBadge><b className="text-[24px]">Calm mode</b><Toggle on /></span>
              <span className="font-semibold text-[16px] leading-snug" style={{ color: PP.quiet }}>Softer sounds, still pictures, quiet ground.</span>
            </div>
            {([['Motion', false], ['Sound effects', true], ['Music', false]] as const).map(([l, on]) => <div key={l} className="flex items-center justify-between px-4 h-[56px] rounded-2xl font-bold text-[19px]" style={{ background: PP.cream, border: `2.5px solid ${I}` }}>{l}<Toggle on={on} /></div>)}
          </div>
        </Paper>
      </Over>
    </div>
  );
  return (
    <div className="w-full h-full relative">
      <Board dim />
      <Over>
        <Paper pad={28} className="w-[880px]" layer={PP.mint}>
          <div className="relative flex items-center justify-center mb-5"><h2 className="text-[52px]" style={GY}><GText>Settings</GText></h2><span className="absolute right-0"><Round label="Close"><X weight="bold" size={24} /></Round></span></div>
          <div className="grid grid-cols-[220px_1fr] gap-6">
            <div className="grid gap-2 content-start">{['Accessibility', 'Sound', 'Motion', 'Reading'].map((o, i) => <span key={o} className="h-14 px-5 rounded-2xl flex items-center justify-center font-bold text-[20px]" style={i === 1 ? PICK : { border: '2.5px solid transparent' }}>{o}</span>)}</div>
            <div className="grid gap-3">
              <div className="flex items-center gap-5 p-5 rounded-[22px]" style={{ background: PP.blueCrystal, border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}` }}>
                <IconBadge size={64} bg={PP.paper} shape="blob" optical="heart"><Doodle kind="heart" color={PP.lavender} size={34} /></IconBadge>
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
  const phone = useFrame().kind === 'phone';
  return (
    <div className="w-full h-full relative">
      <Board dim />
      <Over>
        <Paper pad={phone ? 28 : 44} className={phone ? 'w-[340px]' : 'w-[600px]'} layer={PP.blueCrystal}>
          <div className="grid justify-items-center gap-4 text-center">
            <IconBadge size={phone ? 112 : 144} bg={PP.blueCrystal} shape="blob"><IconBadge size={phone ? 76 : 96} bg={PP.paper} ring><Pause weight="bold" size={phone ? 40 : 52} /></IconBadge></IconBadge>
            <h2 style={{ ...GY, fontSize: phone ? 54 : 68 }}><GText>Paused</GText></h2>
            <p className={`font-bold leading-snug ${phone ? 'text-[22px]' : 'text-[26px]'}`}>Your teacher paused the game. It will be back soon.</p>
          </div>
        </Paper>
      </Over>
    </div>
  );
}
// The teacher's own pause message (teacher, 2026-11-24).
function V11c({ msg = 'Eyes on me! We will finish after lunch.' }: { msg?: string }) {
  const phone = useFrame().kind === 'phone';
  return (
    <div className="w-full h-full relative">
      <Board dim />
      <Over>
        <Paper pad={phone ? 28 : 44} className={phone ? 'w-[340px]' : 'w-[760px]'} layer={PP.blueCrystal}>
          <div className="grid justify-items-center gap-4 text-center">
            <IconBadge size={phone ? 96 : 112} bg={PP.blueCrystal} shape="blob"><IconBadge size={phone ? 68 : 80} bg={PP.paper} ring><Pause weight="bold" size={phone ? 36 : 44} /></IconBadge></IconBadge>
            <p className={`font-bold leading-tight ${phone ? 'text-[32px]' : 'text-[54px]'}`}>{msg}</p>
            <span className={`font-bold ${phone ? 'text-[18px]' : 'text-[20px]'}`} style={{ color: PP.quiet }}>from your teacher</span>
          </div>
        </Paper>
      </Over>
    </div>
  );
}
// ---------- student join and name pick, iPad first (820 x 1180) ----------
function JoinStage({ children, keyboard }: { children: ReactNode; keyboard?: boolean }) {
  // Adaptive: the logo and Settings (accessibility inside) on top, the content centered in what
  // is left; on touch devices the device's own number keyboard covers the
  // bottom (teacher, 2026-11-24: no on-screen keypad of ours).
  const f = useFrame(); const phone = f.kind === 'phone';
  const touch = keyboard && f.kind !== 'laptop' && f.kind !== 'board';
  const kbH = touch ? Math.round(f.h * (phone ? 0.34 : f.portrait ? 0.27 : 0.36)) : 0;
  return (
    <div className="w-full h-full relative overflow-hidden" style={PURPLE_GROUND}>
      <img src="/brand/gamify-wordmark.png" alt="Gamify" className={`absolute w-auto ${phone ? 'left-5 top-6 h-7' : 'left-9 top-9 h-11'}`} draggable={false} />
      <span className={`absolute ${phone ? 'right-4 top-4' : 'right-9 top-8'}`}><Round size={phone ? 48 : 60} label="Settings (accessibility inside)"><GearSix weight="bold" size={phone ? 24 : 28} /></Round></span>
      <div className="absolute inset-x-0" style={{ top: phone ? 80 : 120, bottom: kbH + (phone ? 16 : 36), padding: `0 ${phone ? 16 : 40}px` }}><AutoFit width={f.w - (phone ? 32 : 80)}><div className={`w-full flex flex-col items-center text-center ${phone ? 'gap-5' : 'gap-8'}`}>{children}</div></AutoFit></div>
      {touch && <DeviceKeyboard h={kbH} />}
    </div>
  );
}
// A plain stand-in for the tablet or phone's own number keyboard (not ours):
// neutral gray keys, a small "device keyboard" tag, sliding up from the bottom.
const KB_CSS = '@keyframes kb-up{from{transform:translateY(100%)}to{transform:translateY(0)}}.kb-up{animation:kb-up .45s cubic-bezier(.2,.8,.2,1) both}html[data-motion="still"] .kb-up{animation:none}@keyframes caret{0%,49%{opacity:1}50%,100%{opacity:0}}.code-caret{animation:caret 1s steps(1) infinite}html[data-motion="still"] .code-caret{animation:none}';
function DeviceKeyboard({ h }: { h: number }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];
  return (
    <div aria-label="Device keyboard" className="kb-up absolute inset-x-0 bottom-0 grid content-start gap-2 px-2 pt-7 pb-3" style={{ height: h, background: '#d1d3d9', borderTop: '1px solid #a9acb3' }}>
      <style>{KB_CSS}</style>
      <span className="absolute left-3 top-1.5 text-[13px] font-semibold" style={{ color: '#4a4d55' }}>device keyboard</span>
      <div className="grid grid-cols-3 gap-2 h-full">{keys.map((k, i) => <span key={i} className={`rounded-[8px] grid place-items-center text-[24px] font-semibold ${k ? '' : 'opacity-0'}`} style={{ background: k === 'del' ? '#b4b7bf' : '#fff', color: '#1d1d1f', boxShadow: '0 1px 0 #8e9199' }}>{k === 'del' ? <ArrowLeft weight="bold" size={22} /> : k}</span>)}</div>
    </div>
  );
}
function V12() {
  const f = useFrame(); const phone = f.kind === 'phone';
  const bw = phone ? 46 : 96, bh = phone ? 62 : 120;
  return (
    <JoinStage keyboard>
      <style>{KB_CSS}</style>
      <h1 style={{ ...GY, fontSize: phone ? 44 : 80 }}><GText>Join the game</GText></h1>
      <p className="font-bold leading-snug" style={{ fontSize: phone ? 20 : 28 }}>Type the game code your teacher gave you.</p>
      {/* Six code boxes; the caret blinks in the next empty one (no keypad of ours, teacher 2026-11-24). */}
      <div className="flex" style={{ gap: phone ? 6 : 12 }}>{['4', '7', '2', '9', '', ''].map((d, i) => <span key={i} className="relative rounded-[18px] grid place-items-center" style={{ ...GY, width: bw, height: bh, fontSize: phone ? 38 : 70, background: i === 4 ? PP.butter : PP.paper, border: `3px solid ${I}`, boxShadow: i === 4 ? `0 0 0 ${phone ? 4 : 6}px ${PP.lemon}` : `0 5px 0 ${I}`, marginLeft: i === 3 ? (phone ? 12 : 22) : 0 }}>{d}{i === 4 && <span aria-hidden="true" className="code-caret absolute rounded-full" style={{ width: phone ? 3 : 4, height: bh * 0.55, background: I }} />}</span>)}</div>
      <div className="flex gap-3 items-center"><SecondBtn h={phone ? 56 : 72}><SpeakerHigh weight="bold" size={phone ? 22 : 28} />Hear my code</SecondBtn><MainBtn big>Go<ArrowRight weight="bold" size={30} /></MainBtn></div>
    </JoinStage>
  );
}
function V12n() {
  // Up to 4 columns (teacher, 2026-11-24): big screen, laptop and iPad
  // landscape 4, iPad portrait 3, phone 2; cards fill the width evenly and
  // shrink (never scroll) for a class of up to 30.
  const f = useFrame(); const phone = f.kind === 'phone';
  const names = ['Ava', 'Leo', 'Mia', 'Noah', 'Zoe', 'Eli', 'Ivy', 'Max', 'Ruby', 'Sam', 'Lily', 'Owen', 'June', 'Kai', 'Nora', 'Theo', 'Ella', 'Finn', 'Rosa', 'Jack'];
  const cols = phone ? 2 : f.portrait ? 3 : 4;
  return (
    <JoinStage>
      <h1 style={{ ...GY, fontSize: phone ? 44 : 76 }}><GText>Tap your name</GText></h1>
      <div className="grid w-full" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: phone ? 10 : 14 }}>
        {names.map((n, i) => (
          <span key={n} className="relative rounded-[20px] flex items-center justify-center font-bold" style={{ height: phone ? 56 : 76, fontSize: phone ? 22 : 32, background: PP.paper, border: `3px solid ${I}`, boxShadow: i === 2 ? `${SEL}, 0 5px 0 ${I}` : `0 5px 0 ${I}` }}>
            {n}{i === 2 && <span className="absolute -top-3 -right-3"><Check40 size={phone ? 36 : 44} /></span>}
          </span>
        ))}
      </div>
      <MainBtn big><Play weight="fill" size={30} />That&apos;s me!</MainBtn>
    </JoinStage>
  );
}
// ---------- Live setup (teacher): only under Live ----------
function ClassHow() {
  // Nothing picked at first (teacher, 2026-11-24): "The game ends" shows only
  // after Cooperative or Competitive is tapped; Next stays off until then.
  const [pick, setPick] = useState<'together' | 'compete' | undefined>();
  const phone = useFrame().kind === 'phone';
  const ways = [['together', 'Cooperative', 'Everyone adds to one class goal; no one is ranked'], ['compete', 'Competitive', 'A leaderboard of names and points']] as const;
  return (
    <Wizard step={4} total={5} title="How the class plays" go={<NextOff off={!pick} />}>
      <div className={`grid justify-items-center ${phone ? 'gap-5 w-full' : 'gap-9'}`}>
        <div className={phone ? 'grid gap-4 w-full' : 'flex justify-center gap-8'}>
          {ways.map(([id, n, l]) => { const on = pick === id; return phone ? (
            <button type="button" key={id} onClick={() => setPick(id)} className="relative w-full min-h-[104px] rounded-[22px] flex items-stretch text-left" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: on ? `${SEL}, 0 6px 0 ${I}` : `0 5px 0 ${I}` }}>
              <span className="w-[104px] grid place-items-center rounded-l-[19px] shrink-0" style={{ background: CLASS_MODE_COLORS[id], borderRight: `3px solid ${I}` }}><ClassModeIcon mode={id} size={36} /></span>
              <span className="flex-1 min-w-0 px-4 py-2 grid content-center gap-1"><b className="block text-[26px] leading-none" style={GY}><GText>{n}</GText></b><span className="text-[15px] font-semibold leading-snug">{l}</span></span>
              {on && <span className="absolute -top-3 -right-3"><Check40 size={36} /></span>}
            </button>
          ) : (
            <button type="button" key={id} onClick={() => setPick(id)} className="relative w-[340px] h-[240px] rounded-[24px] flex flex-col" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: on ? `${SEL}, 0 10px 0 ${I}` : `0 5px 0 ${I}`, transform: on ? 'translateY(-6px)' : undefined }}>
              <span className="flex-1 w-full grid place-items-center rounded-t-[21px]" style={{ background: CLASS_MODE_COLORS[id], borderBottom: `3px solid ${I}` }}><ClassModeIcon mode={id} size={56} /></span>
              <span className="px-4 py-3 text-center"><b className="text-[32px] block" style={GY}><GText>{n}</GText></b><span className="text-[17px] font-semibold">{l}</span></span>
              {on && <span className="absolute -top-4 -right-4"><Check40 /></span>}
            </button>); })}
        </div>
        {pick && <OptCard label="The game ends"><Seg opts={['When I stop it', 'After a number right', 'At time']} pick={0} vertical={phone} /></OptCard>}
      </div>
    </Wizard>
  );
}
// ---------- lobbies ----------
function CodeChip() {
  const phone = usePhone() || useFrame().w < 600;
  return <div className={`flex items-center rounded-full ${phone ? 'px-7 h-[68px]' : 'px-10 h-[84px]'}`} style={{ background: '#fff', border: `3px solid ${I}`, boxShadow: LIFT }}><span className="whitespace-nowrap tracking-[0.12em]" style={{ ...GY, fontSize: phone ? 40 : 52 }}><GText>472 915</GText></span></div>;
}
const NAMES = ['Ava', 'Leo', 'Mia', 'Noah', 'Zoe', 'Eli', 'Ivy', 'Max', 'Ruby', 'Sam', 'Lily', 'Owen'];
function V12b() {
  const phone = useFrame().kind === 'phone';
  return (
    <MenuStep title="Race lobby" step={6} total={6} go={<MainBtn big><Play weight="fill" size={28} />Start the race</MainBtn>}>
      <CodeChip />
      <div className={`w-full grid ${phone ? 'grid-cols-2 gap-3 mt-5' : 'grid-cols-4 gap-5 mt-7'}`}>
        {TEAMS.map((t, i) => (
          <div key={t.name} className={`flex flex-col items-center ${phone ? 'gap-2 py-3 px-2' : 'gap-3 pt-5 pb-5'} rounded-[26px]`} style={{ background: t.soft, border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}` }}>
            <Badge t={t} size={phone ? 48 : 72} />
            <b className={phone ? 'text-[19px]' : 'text-[24px]'}>{t.name}</b>
            {NAMES.slice(i * 3, i * 3 + 3).map((n) => <span key={n} className={`${phone ? 'w-full h-10 text-[18px]' : 'w-[200px] h-12 text-[21px]'} rounded-full grid place-items-center font-bold`} style={{ background: PP.paper, border: `2.5px solid ${I}` }}>{n}</span>)}
          </div>
        ))}
      </div>
    </MenuStep>
  );
}
function V12c() {
  const soft = [PP.gamify, PP.aqua, PP.blush, PP.butter, PP.mint, PP.peach];
  const phone = useFrame().kind === 'phone';
  return (
    <MenuStep title="Team lobby" step={6} total={6} go={<MainBtn big><Play weight="fill" size={28} />Start together</MainBtn>}>
      <CodeChip />
      <div className={`${phone ? 'mt-5 px-5 py-4 gap-3 w-full' : 'mt-7 px-9 py-6 gap-4'} grid justify-items-center rounded-[26px]`} style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}` }}>
        <span className={`flex items-center gap-3 font-bold text-center ${phone ? 'text-[20px] leading-snug' : 'text-[30px]'}`}><Star weight="fill" size={phone ? 30 : 40} color={PP.lemon} className="shrink-0" />Our goal: fill the sky with 60 stars</span>
        <span className="flex items-center gap-4 w-full justify-center"><Meter segments={1} done={0} part={0.04} width={phone ? 200 : 560} label="0 of 60 stars" /><b className={`${phone ? 'text-[18px]' : 'text-[22px]'} tabular-nums whitespace-nowrap`}>0 of 60</b></span>
      </div>
      <div className={`flex flex-wrap justify-center ${phone ? 'gap-2.5 mt-5' : 'gap-3 max-w-[900px] mt-7'}`}>{NAMES.map((n, i) => <span key={n} className={`${phone ? 'px-4 h-11 text-[19px]' : 'px-5 h-12 text-[22px]'} rounded-full font-bold flex items-center`} style={{ background: soft[i % 6], border: `3px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}>{n}</span>)}</div>
    </MenuStep>
  );
}


type V = { n: string; name: string; view: ReactNode; note: string; port?: ReactNode; fit?: boolean; tall?: boolean };
// Every shared screen, in the order a class meets them (teacher, 2026-11-23:
// "all these screens would be considered universal and should be moved to universal page").
const VIEWS: V[] = [
  { n: '1', fit: true, name: 'Welcome', view: <V1 />, note: 'Her original layout: the cover (a real miniature of the game in play) big on the left; the right column exactly as tall, spread evenly: the title row with the corner buttons, the description and ways to play, the How to play card, a 72px start button level with the cover bottom.' },
  { n: '2a', fit: true, name: 'How will you play? (nothing picked yet)', view: <V2 />, note: 'No card is picked at first, so no extra setting shows and Next is off. Tap a card to pick it; its setting appears under it. Hover shows each line (on touch, under the picked card). Phone: one column of row cards.' },
  { n: '2b', fit: true, name: 'How will you play? (Share picked)', view: <V2 pick="Share" />, note: '"How do you share?" appears only after Share is picked.' },
  { n: '3', fit: true, name: 'Share a join code', view: <ShareCode />, note: 'Only after Share and "Share a join code": the code big on one paper card.' },
  { n: '4', fit: true, name: 'Question set', view: <V3 />, note: 'Tabs, search, subject and grade filters, recent first; each card shows subject, grades, count, the first question and when it was used.' },
  { n: '5', fit: true, name: 'Options', view: <V4 />, note: 'Each option group is its own card on the ground; only real field labels.' },
  { n: '6', fit: true, name: 'Teams and players', view: <V5 />, note: 'No count selector: Add team (between Back and Next) pops a new card in while the others slide over; x removes one. Two to eight teams, centered, wrapping onto centered rows.' },
  { n: '7', fit: true, name: 'Power-up setup', view: <V6 />, note: 'The cards on the purple ground, centered; off cards dashed.' },
  { n: '8', fit: true, name: 'Teacher: how the class plays (Live only)', view: <ClassHow />, note: 'Shows only when Live is picked. Cooperative or Competitive, nothing picked at first; "The game ends" appears only after a card is tapped, and Next stays off until then.' },
  { n: '9a', fit: true, name: 'Lobby: competitive', view: <V12b />, note: 'Teams in their colors and shapes, names joining under each.' },
  { n: '9b', fit: true, name: 'Lobby: cooperative', view: <V12c />, note: 'One class goal with its bar, every name joining one group.' },
  { n: '11a', name: 'Top tracker: solo, share, live', view: <V9a />, port: <V9a narrow />, note: 'Who or what left (the team name only, shaded), the meter in the middle with no words, icon buttons right with the hint beside Settings.' },
  { n: '11b', fit: true, name: 'Scoreboard and held power-ups', view: <V9b />, note: 'No panel; the current team is shaded Butter (no glow, no banner); power-ups are single square cards; tips live behind the lightbulb.' },
  { n: '12', fit: true, name: 'Power-up pop card', view: <V7 />, note: 'One flat card with soft rays over the game.' },
  { n: '13', fit: true, name: 'Results', view: <V10 />, note: 'The winner wears the same turn glow. No stickers unless this game just earned one.' },
  { n: '13b', fit: true, name: 'Results: new sticker earned', view: <V10 earned={['first', 'plays']} />, note: 'Only a sticker this game just earned, each one once, popping in at varied spots on the box edge, never over the title, icon, score or buttons.' },
  { n: '14', fit: true, name: 'Settings and Calm', view: <V11 />, note: 'The one Settings button holds accessibility too (teacher, 2026-11-24: no separate accessibility button anywhere). Calm mode first and biggest.' },
  { n: '15a', fit: true, name: 'Pause: default', view: <V11b />, note: 'A plain calm card.' },
  { n: '15b', fit: true, name: 'Pause: teacher message', view: <V11c />, note: 'Her own words big; a small "from your teacher" line under them.' },
];
const TABLETS: V[] = [
  { n: '17', fit: true, name: 'Student join', view: <V12 />, note: 'Six code boxes, the caret blinking in the next one; no keypad of ours: on iPads and phones the device\'s own number keyboard slides up and Go stays above it. Hear my code.' },
  { n: '18', fit: true, name: 'Student name pick', view: <V12n />, note: 'Class list names as tap cards: 4 columns on big screens, laptops and iPad landscape, 3 on iPad portrait, 2 on a phone; picked = ink ring and green check.' },
];

export default function UniversalViews() {
  const [wid, setWid] = useState('castle-quest');
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
            {v.n === '1' && <div role="group" aria-label="Welcome for which game" className="flex flex-wrap justify-center gap-1.5">{GAME_COVERS.map((g) => <button key={g.id} type="button" aria-pressed={wid === g.id} onClick={() => setWid(g.id)} className="px-3 min-h-9 rounded-full font-bold text-sm border-2 border-black" style={{ background: wid === g.id ? PP.mint : PP.paper }}>{g.name}</button>)}</div>}
            {v.n === '1' ? <DeviceSet key={wid} land={<V1 id={wid} />} adaptive /> : v.tall ? <DeviceSet land={v.view} port={v.view} landSize={[820, 1180]} /> : <DeviceSet land={v.view} port={v.port} adaptive={v.fit} />}
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
