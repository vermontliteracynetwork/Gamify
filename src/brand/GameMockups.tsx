import type { CSSProperties, ReactNode } from 'react';
import { ArrowsClockwise, CornersOut, FlagCheckered, GearSix, HourglassHigh, Play, X } from '@phosphor-icons/react';
import { PP } from './PaletteProposal';
import { PATTERNS } from './PatternProposal';
import { BlobPatch, CrayonDie, CrayonPawn, CrayonPowerUp, Doodle, type DoodleKind, type PowerId } from './CrayonKit';
import { Badge, Laptop, MainBtn, TEAMS, Tablet } from './UniversalViews';
import { layout } from '../games/castle-quest/board';

// Game mockups (PROPOSAL, teacher 2026-11-23: "mockups of all the games with a
// new and improved universal classic design theme", only the seven games live
// on the home page). Batch 1: Game Show and Board Game. Each is the real game
// (same board, pieces, power-ups and theme template sizes) redrawn in the
// proposed kit: Gamify purple, pastel pairs, ink outline, flat fills, doodle
// confetti at the edges, the quiet ground behind text only. Static, wired to
// nothing; no live game changes until she approves. One component per game so
// later batches add Match Three, Four in a Row, Bubble Pop, Bowling and
// Question Tracker below.

const I = PP.ink;
const quiet = PATTERNS.find((p) => p.id === 'quiet')!.make(false);
const paper: CSSProperties = { background: PP.paper, border: `3px solid ${I}`, borderRadius: 20, boxShadow: `0 4px 0 ${I}` };
type Team = (typeof TEAMS)[number];
const PASTEL_OF: Record<string, string> = { [PP.periwinkle]: PP.gamify, [PP.sky]: PP.blueCrystal, [PP.pink]: PP.blush, [PP.lemon]: PP.butter };

// ---------- shared mockup parts ----------
function Corner({ dark }: { dark?: boolean }) {
  return (
    <div className="absolute top-4 right-5 flex gap-2 z-20">
      {[GearSix, CornersOut, X].map((Icon, i) => (
        <span key={i} className="w-11 h-11 rounded-full grid place-items-center" style={{ background: PP.paper, border: `2.5px solid ${I}`, boxShadow: dark ? `0 3px 0 ${I}` : undefined }}><Icon weight="bold" size={20} /></span>
      ))}
    </div>
  );
}
function TurnPill({ t, text }: { t: Team; text: string }) {
  return (
    <div className="inline-flex items-center gap-3 pl-2 pr-5 py-1.5 rounded-full font-display text-2xl font-bold" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 0 0 5px ${PP.lemon}, 0 4px 0 ${I}` }}>
      <Badge t={t} size={34} />{text}
    </div>
  );
}
function Score({ t, pts, now, held, compact }: { t: Team; pts: number; now?: boolean; held?: { id: PowerId; name: string }; compact?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${compact ? 'px-2.5 py-1.5' : 'px-3 py-2'} rounded-2xl`} style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: now ? `0 0 0 5px ${PP.lemon}, 0 4px 0 ${I}` : `0 3px 0 ${I}` }}>
      <Badge t={t} size={compact ? 28 : 32} />
      <b className={`flex-1 truncate ${compact ? 'text-base' : 'text-lg'}`}>{t.name}</b>
      {held && <span title={`Holds ${held.name}`} className="rounded-xl" style={{ background: PP.butter, border: `2px solid ${I}`, padding: 1 }}><CrayonPowerUp id={held.id} size={compact ? 30 : 34} sticker /></span>}
      <span className={`font-display ${compact ? 'text-2xl' : 'text-3xl'} tabular-nums`}>{pts}</span>
    </div>
  );
}
// Doodle confetti, placed by hand so it stays at the edges, never on text.
function Confetti({ marks }: { marks: [DoodleKind, string, number, number, number][] }) {
  return <>{marks.map(([k, c, x, y, s], i) => <Doodle key={i} kind={k} color={c} size={s} className="absolute pointer-events-none" style={{ left: x, top: y, transform: `rotate(${(i * 37) % 50 - 25}deg)` }} />)}</>;
}

// ================= Game Show =================
// The real game: a grid of surprise cards (4 x 3 here, 12 cards), teams take
// turns, a right answer picks a card; cards hold points or one of the four
// Classic power-ups (Double Star, Swap Spinner, Sneaky Magnet, Prize Bag).
// World: a TV studio stage (curtains, valance, spotlights, stage floor, a
// bulb marquee) with the board zone blocked out in the middle.
const GS_POWERS: Record<string, { id: PowerId; name: string }> = {
  double: { id: 'double-points', name: 'Double Star' }, swap: { id: 'swap', name: 'Swap Spinner' },
  steal: { id: 'magnet', name: 'Sneaky Magnet' }, bonus: { id: 'treasure-chest', name: 'Prize Bag' },
};
// Open cards: team index and points (or a used power-up). null = closed.
const GS_CARDS: ({ by: number; pts?: number; power?: string } | null)[] = [
  { by: 0, pts: 30 }, null, { by: 2, pts: 50 }, null,
  null, { by: 1, pts: 20 }, { by: 1, power: 'bonus' }, { by: 3, pts: 10 },
  { by: 2, power: 'double' }, null, null, { by: 0, pts: 40 },
];

function StudioBack({ w, h }: { w: number; h: number }) {
  const c = w * 0.085;
  const curtain = (flip: boolean) => {
    const x = (v: number) => (flip ? w - v : v);
    return (
      <g>
        <path d={`M${x(0)} 0 L${x(c)} 0 C${x(c - 14)} ${h * 0.28} ${x(c + 16)} ${h * 0.55} ${x(c - 4)} ${h * 0.84} L${x(c * 0.2)} ${h * 0.9} L${x(0)} ${h * 0.9} Z`} fill={PP.pink} stroke={I} strokeWidth="4" strokeLinejoin="round" />
        {[0.3, 0.62].map((f) => <path key={f} d={`M${x(c * f)} 8 C${x(c * f - 6)} ${h * 0.3} ${x(c * f + 8)} ${h * 0.6} ${x(c * f - 2)} ${h * 0.86}`} fill="none" stroke={I} strokeWidth="2.4" strokeLinecap="round" />)}
        <rect x={flip ? w - c - 4 : -6} y={h * 0.5} width={c + 10} height="14" rx="7" fill={PP.lemon} stroke={I} strokeWidth="3" />
      </g>
    );
  };
  const n = Math.round(w / 70);
  const scallops = Array.from({ length: n }, (_, i) => { const a = (i * w) / n, b = ((i + 1) * w) / n; return <path key={i} d={`M${a} 24 Q${(a + b) / 2} 62 ${b} 24 Z`} fill={PP.pink} stroke={I} strokeWidth="4" strokeLinejoin="round" />; });
  const floor = h * 0.86;
  return (
    <svg className="absolute inset-0" width={w} height={h} aria-hidden="true">
      <rect width={w} height={h} fill={PP.grape} />
      {/* spotlight beams, opaque lavender, behind everything else */}
      <path d={`M${w * 0.2} 0 L${w * 0.28} 0 L${w * 0.46} ${floor} L${w * 0.08} ${floor} Z`} fill={PP.lavender} opacity="1" />
      <path d={`M${w * 0.72} 0 L${w * 0.8} 0 L${w * 0.92} ${floor} L${w * 0.54} ${floor} Z`} fill={PP.lavender} />
      <path d={`M0 ${floor} C${w * 0.3} ${floor - 8} ${w * 0.7} ${floor + 6} ${w} ${floor - 4} L${w} ${h} L0 ${h} Z`} fill={PP.lemon} stroke={I} strokeWidth="4" strokeLinejoin="round" />
      {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${(w / 9) * i + 20} ${floor + 14} l14 ${h - floor - 22}`} stroke={PP.orange} strokeWidth="5" strokeLinecap="round" />)}
      {curtain(false)}{curtain(true)}
      {scallops}
      <rect x="-4" y="-4" width={w + 8} height="30" fill={PP.pink} stroke={I} strokeWidth="4" />
    </svg>
  );
}
function Marquee({ children, bulbs }: { children: ReactNode; bulbs: number }) {
  return (
    <div className="relative w-full rounded-[26px] p-[18px]" style={{ background: PP.periwinkle, border: `4px solid ${I}`, boxShadow: `0 6px 0 ${PP.grapeDeep}` }}>
      {(['top', 'bottom'] as const).map((s) => (
        <span key={s} className="absolute inset-x-6 flex justify-between" style={{ [s]: 4 }} aria-hidden="true">
          {Array.from({ length: bulbs }, (_, i) => <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: i % 2 ? PP.paper : PP.lemon, border: `1.5px solid ${I}` }} />)}
        </span>
      ))}
      <div className="rounded-[14px] p-3" style={{ ...quiet, border: `3px solid ${I}` }}>{children}</div>
    </div>
  );
}
function GSCard({ c }: { c: (typeof GS_CARDS)[number] }) {
  if (!c) {
    return (
      <span className="relative rounded-[14px] grid place-items-center overflow-hidden" style={{ aspectRatio: '300 / 220', background: PP.butter, border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}` }}>
        <span className="absolute inset-[7px] rounded-[9px]" style={{ border: `2px dashed ${PP.orange}` }} />
        <Doodle kind="sparkle" color={PP.lemon} size={46} />
      </span>
    );
  }
  const t = TEAMS[c.by];
  const pw = c.power ? GS_POWERS[c.power] : undefined;
  return (
    <span className="relative rounded-[14px] grid place-items-center" style={{ aspectRatio: '300 / 220', background: PASTEL_OF[t.color], border: `3px solid ${I}` }}>
      <span className="absolute top-1.5 left-1.5"><Badge t={t} size={22} /></span>
      {pw ? <CrayonPowerUp id={pw.id} size={58} /> : <b className="font-display text-4xl tabular-nums">+{c.pts}</b>}
    </span>
  );
}
// Celebration: the Prize Bag card pops off the board.
function GSPop({ scale = 1 }: { scale?: number }) {
  return (
    <div className="absolute inset-0 grid place-items-center z-10 pointer-events-none">
      <div className="relative" style={{ transform: `scale(${scale}) rotate(-3deg)` }}>
        <Confetti marks={[['sparkle', PP.lemon, -52, -30, 34], ['star', PP.pink, 250, -26, 28], ['dot', PP.sky, -40, 150, 16], ['heart', PP.pink, 262, 140, 24], ['sparkle', PP.paper, 120, -54, 26], ['star', PP.kelly, -64, 64, 22], ['dot', PP.lemon, 280, 60, 14]]} />
        <div className="w-[240px] p-4 grid justify-items-center gap-1 text-center" style={{ ...paper, borderRadius: 24, boxShadow: `0 0 0 8px ${PP.lemon}, 0 0 0 11px ${I}, 0 12px 0 ${I}` }}>
          <div className="relative w-28 h-28 grid place-items-center"><BlobPatch color={PP.peach} size={124} /><span className="relative"><CrayonPowerUp id="treasure-chest" size={100} /></span></div>
          <b className="font-display text-4xl leading-none">Prize Bag!</b>
          <span className="font-bold text-lg">+100 for Team Sky</span>
        </div>
      </div>
    </div>
  );
}
const GS_SCORES = [70, 160, 50, 10];
const GS_HELD = [undefined, undefined, GS_POWERS.double, undefined];

function GameShowLaptop() {
  return (
    <div className="w-full h-full relative overflow-hidden">
      <StudioBack w={1000} h={625} />
      <Corner dark />
      <div className="absolute left-[96px] top-[52px] w-[600px] grid justify-items-center gap-3">
        <TurnPill t={TEAMS[1]} text="Team Sky, pick a card!" />
        <Marquee bulbs={18}>
          <div className="grid grid-cols-4 gap-2.5">{GS_CARDS.map((c, i) => <GSCard key={i} c={c} />)}</div>
        </Marquee>
      </div>
      <div className="absolute right-[96px] top-[118px] w-[196px] grid gap-2.5">
        {TEAMS.map((t, i) => <Score key={t.name} t={t} pts={GS_SCORES[i]} now={i === 1} held={GS_HELD[i]} compact />)}
        <span className="mt-1 text-sm font-bold px-3 py-1.5 rounded-xl text-center" style={{ background: PP.butter, border: `2px solid ${I}` }}>Fill a row for +10</span>
      </div>
      <div className="absolute left-[96px] top-[118px] w-[600px] h-[420px]"><GSPop scale={0.82} /></div>
    </div>
  );
}
function GameShowTablet() {
  return (
    <div className="w-full h-full relative overflow-hidden">
      <StudioBack w={820} h={1180} />
      <Corner dark />
      <div className="absolute inset-x-[60px] top-[80px] grid justify-items-center gap-5">
        <TurnPill t={TEAMS[1]} text="Team Sky, pick a card!" />
        <div className="w-full"><Marquee bulbs={14}>
          <div className="grid grid-cols-3 gap-3">{GS_CARDS.map((c, i) => <GSCard key={i} c={c} />)}</div>
        </Marquee></div>
        <div className="w-full grid grid-cols-2 gap-3">{TEAMS.map((t, i) => <Score key={t.name} t={t} pts={GS_SCORES[i]} now={i === 1} held={GS_HELD[i]} />)}</div>
      </div>
      <div className="absolute inset-x-[60px] top-[150px] h-[740px]"><GSPop scale={1.2} /></div>
    </div>
  );
}

// ================= Board Game =================
// The real game: a snake of square spaces from Start to Finish (medium trail,
// 40 squares, laid out by the game's own layout()), four regular colors in
// turn, lose-a-turn and roll-again squares, hidden power-ups, her one-side-
// at-a-time die. World: a paper-craft park (sky, clouds, rolling hills) with
// the board zone blocked out on a paper mat.
type Kind = 'regular' | 'lose' | 'again' | 'start' | 'finish';
const N = 40;
const KINDS: Kind[] = Array.from({ length: N }, (_, i) => (i === 0 ? 'start' : i === N - 1 ? 'finish' : [9, 26].includes(i) ? 'lose' : [15, 33].includes(i) ? 'again' : 'regular'));
const SQ = [PP.gamify, PP.blueCrystal, PP.blush, PP.butter];
const PAWNS = [{ t: 0, at: 12 }, { t: 1, at: 15 }, { t: 2, at: 20 }, { t: 3, at: 7 }];

function ParkBack({ w, h }: { w: number; h: number }) {
  const cloud = (x: number, y: number, s: number) => <path d={`M${x} ${y} c${-8 * s} 0 ${-12 * s} ${-10 * s} ${-4 * s} ${-14 * s} c${2 * s} ${-12 * s} ${18 * s} ${-14 * s} ${22 * s} ${-4 * s} c${8 * s} ${-8 * s} ${22 * s} ${-2 * s} ${20 * s} ${8 * s} c${8 * s} ${2 * s} ${8 * s} ${10 * s} 0 ${10 * s} Z`} fill={PP.paper} stroke={I} strokeWidth="3.5" strokeLinejoin="round" />;
  return (
    <svg className="absolute inset-0" width={w} height={h} aria-hidden="true">
      <rect width={w} height={h} fill={PP.sky} />
      <circle cx={w * 0.9} cy={h * 0.12} r={Math.min(w, h) * 0.07} fill={PP.lemon} stroke={I} strokeWidth="4" />
      <path d={`M${w * 0.9 - 18} ${h * 0.12 - 16} q6 -8 14 -8`} stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" />
      {cloud(w * 0.08, h * 0.12, 2.2)}{cloud(w * 0.55, h * 0.07, 1.6)}{cloud(w * 0.78, h * 0.3, 1.3)}
      <path d={`M0 ${h * 0.62} C${w * 0.25} ${h * 0.5} ${w * 0.45} ${h * 0.56} ${w * 0.6} ${h * 0.6} C${w * 0.78} ${h * 0.5} ${w * 0.92} ${h * 0.52} ${w} ${h * 0.58} L${w} ${h} L0 ${h} Z`} fill={PP.lime} stroke={I} strokeWidth="4" strokeLinejoin="round" />
      <path d={`M0 ${h * 0.78} C${w * 0.3} ${h * 0.7} ${w * 0.6} ${h * 0.82} ${w} ${h * 0.72} L${w} ${h} L0 ${h} Z`} fill={PP.kelly} stroke={I} strokeWidth="4" strokeLinejoin="round" />
      {Array.from({ length: 12 }, (_, i) => { const x = (w / 12) * i + 30, y = h * 0.86 + ((i * 29) % 50); return <g key={i}><path d={`M${x} ${y} v18`} stroke={I} strokeWidth="3" strokeLinecap="round" /><circle cx={x} cy={y} r="7" fill={[PP.pink, PP.paper, PP.lemon][i % 3]} stroke={I} strokeWidth="2.5" /></g>; })}
    </svg>
  );
}
function Square({ kind, i, s }: { kind: Kind; i: number; s: number }) {
  const fill = kind === 'start' ? PP.mint : kind === 'finish' ? PP.lemon : kind === 'lose' ? I : kind === 'again' ? PP.paper : SQ[i % 4];
  const icon = s * 0.5;
  return (
    <span className="absolute inset-[3px] rounded-[22%] grid place-items-center" style={{ background: fill, border: `3px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}>
      {kind === 'start' && <Play weight="fill" size={icon * 0.8} color={PP.kelly} />}
      {kind === 'finish' && <FlagCheckered weight="fill" size={icon} />}
      {kind === 'lose' && <HourglassHigh weight="fill" size={icon} color={PP.lemon} />}
      {kind === 'again' && <ArrowsClockwise weight="bold" size={icon} color={PP.pink} />}
    </span>
  );
}
function BoardGrid({ w, h, celebrate }: { w: number; h: number; celebrate?: boolean }) {
  const L = layout(N, w, h);
  const s = L.size;
  const ox = (w - L.cols * s) / 2, oy = (h - L.rows * s) / 2;
  const pos = (k: number) => ({ left: ox + L.cells[k].x * s, top: oy + L.cells[k].y * s });
  return (
    <div className="relative" style={{ width: w, height: h }}>
      {L.cells.map((_, k) => <span key={k} className="absolute" style={{ ...pos(k), width: s, height: s }}><Square kind={KINDS[k]} i={k} s={s} /></span>)}
      {PAWNS.map((p, j) => {
        const same = PAWNS.filter((q) => q.at === p.at).indexOf(p);
        return <span key={j} className="absolute z-[2]" style={{ left: pos(p.at).left + s * 0.14 + same * s * 0.2, top: pos(p.at).top - s * 0.28, filter: p.t === 1 && celebrate ? `drop-shadow(0 0 0 ${PP.lemon})` : undefined }}><CrayonPawn color={TEAMS[p.t].color} size={s * 0.72} /></span>;
      })}
      {celebrate && (() => { const p = pos(15); return (
        <span className="absolute z-[3] pointer-events-none" style={{ left: p.left + s / 2, top: p.top + s + 4 }}>
          <span className="absolute whitespace-nowrap inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-display text-2xl font-bold" style={{ background: PP.lemon, border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}`, transform: 'translate(-50%, 0) rotate(-4deg)' }}><ArrowsClockwise weight="bold" size={24} />Roll again!</span>
          <Confetti marks={[['sparkle', PP.lemon, -s * 1.7, s * 0.05, 26], ['star', PP.pink, s * 1.35, s * 0.1, 22], ['sparkle', PP.paper, s * 1.5, s * 0.65, 20], ['dot', PP.sky, -s * 1.5, s * 0.7, 14]]} />
        </span>
      ); })()}
    </div>
  );
}
function DieCard({ big }: { big?: boolean }) {
  return (
    <div className="p-4 grid justify-items-center gap-3 text-center" style={paper}>
      <span className="font-display text-2xl font-bold flex items-center gap-2"><Badge t={TEAMS[1]} size={30} />Team Sky</span>
      <div className="relative grid place-items-center" style={{ width: big ? 150 : 128, height: big ? 150 : 128 }}><BlobPatch color={PP.blueCrystal} size={big ? 150 : 128} /><span className="relative"><CrayonDie value={3} size={big ? 112 : 96} /></span></div>
      <MainBtn wide>Roll</MainBtn>
    </div>
  );
}
const BG_HELD: { id: PowerId; name: string }[] = [{ id: 'potion', name: 'Potion' }, { id: 'shield', name: 'Shield' }];
function Tray() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-2xl" style={{ background: PP.butter, border: `2.5px solid ${I}` }}>
      <b className="text-sm flex-1">Your power-ups</b>
      {BG_HELD.map((p) => <span key={p.id} title={p.name} className="rounded-xl" style={{ background: PP.paper, border: `2.5px solid ${I}`, boxShadow: `0 3px 0 ${I}`, padding: 2 }}><CrayonPowerUp id={p.id} size={44} sticker /></span>)}
    </div>
  );
}
const BG_SCORES = ['12 to go', '24 to go', '19 to go', '32 to go'];
function MiniRace({ compact }: { compact?: boolean }) {
  return <>{TEAMS.map((t, i) => (
    <div key={t.name} className={`flex items-center gap-2 ${compact ? 'px-2 py-1' : 'px-2.5 py-1.5'} rounded-2xl`} style={{ background: PP.paper, border: `2.5px solid ${I}`, boxShadow: i === 1 ? `0 0 0 4px ${PP.lemon}, 0 3px 0 ${I}` : `0 2px 0 ${I}` }}>
      <CrayonPawn color={t.color} size={26} /><b className="flex-1 truncate text-sm">{t.name}</b><span className="text-sm font-bold" style={{ color: PP.quiet }}>{BG_SCORES[i]}</span>
    </div>
  ))}</>;
}
function BoardLaptop() {
  return (
    <div className="w-full h-full relative overflow-hidden">
      <ParkBack w={1000} h={625} />
      <Corner dark />
      <div className="absolute left-6 top-[74px] w-[690px] h-[520px] grid place-items-center" style={{ ...quiet, border: `4px solid ${I}`, borderRadius: 28, boxShadow: `0 6px 0 ${I}` }}>
        <BoardGrid w={650} h={480} celebrate />
      </div>
      <div className="absolute right-6 top-[74px] w-[250px] grid gap-2.5">
        <DieCard />
        <Tray />
        <MiniRace compact />
      </div>
    </div>
  );
}
function BoardTablet() {
  return (
    <div className="w-full h-full relative overflow-hidden">
      <ParkBack w={820} h={1180} />
      <Corner dark />
      <div className="absolute inset-x-6 top-[80px] h-[700px] grid place-items-center" style={{ ...quiet, border: `4px solid ${I}`, borderRadius: 30, boxShadow: `0 6px 0 ${I}` }}>
        <BoardGrid w={730} h={660} celebrate />
      </div>
      <div className="absolute inset-x-6 top-[806px] grid grid-cols-[250px_1fr] gap-4">
        <DieCard />
        <div className="grid gap-2 content-start"><Tray /><MiniRace /></div>
      </div>
    </div>
  );
}

// ================= the tab =================
const GAMES: { id: string; name: string; laptop: ReactNode; tablet: ReactNode; lines: [string, string, string] }[] = [
  {
    id: 'game-show', name: 'Game Show', laptop: <GameShowLaptop />, tablet: <GameShowTablet />,
    lines: [
      'New: a flat crayon TV studio (pink curtains, lavender spotlights, lemon stage) around a purple bulb marquee; card backs are butter with a sparkle, never a number; won cards turn the team\'s pastel with its shape badge; power-ups are the shared crayon set.',
      'Why: the busy art stays on the edges and the board is calm (figure-ground), so 25 kids find the cards at a glance; shape plus color names each team (WCAG 1.4.1); one lemon glow means "your turn" everywhere.',
      'Pieces (theme template): Background 1920 x 1080 (board zone blocked out, about the middle 60%), Card back 300 x 220, Grid square 300 x 180, Team icon 256 x 256 (up to 10), Power-up 256 x 256 (4 Classic, up to 6), Cover 600 x 600, Title 1200 x 360.',
    ],
  },
  {
    id: 'castle-quest', name: 'Board Game', laptop: <BoardLaptop />, tablet: <BoardTablet />,
    lines: [
      'New: a paper-craft park (sky, clouds, two hills, flowers) with the board on a quiet paper mat; four pastel regular squares in turn, ink Lose a turn and paper Roll again squares, no numbers; bright crayon pawns; her one-side die on a blob patch beside Roll.',
      'Why: pastel squares with bright pawns keep the pieces the figure and the trail the ground, so "where am I?" reads in one look; icons, not words, mark the special squares for pre-readers (dual coding).',
      'Pieces (theme template): Background 1600 x 1200 (board zone blocked out), 4 regular squares, Lose, Roll again, Start and Finish 256 x 256 each, Die 1536 x 256 (six sides in a row), Team piece 256 x 256 (up to 10), Power-up 256 x 256 (6 Classic), Cover 600 x 600, Title 1200 x 360.',
    ],
  },
];

export default function GameMockups() {
  return (
    <section className="grid gap-8">
      <div className="grid gap-1">
        <h2 className="font-heading text-2xl">Game mockups <span className="text-base align-middle px-2 py-0.5 rounded-full border-2 border-black bg-[#fdfd94]">Proposal</span></h2>
        <p className="text-sm font-semibold text-muted max-w-prose">The seven live games in the improved universal Classic theme. Batch 1 of 4: Game Show and Board Game. Same boards, pieces and power-ups as today, redrawn in the kit. Preview only: no game changes until you approve.</p>
      </div>
      {GAMES.map((g) => (
        <article key={g.id} className="grid gap-4">
          <h3 className="font-heading text-xl">{g.name}</h3>
          <div className="grid gap-6 lg:grid-cols-[1fr_17rem] items-start">
            <figure className="m-0 grid gap-2"><Laptop>{g.laptop}</Laptop><figcaption className="text-sm font-bold text-muted">Laptop 16:10, in play</figcaption></figure>
            <figure className="m-0 grid gap-2"><Tablet>{g.tablet}</Tablet><figcaption className="text-sm font-bold text-muted text-center">iPad portrait</figcaption></figure>
          </div>
          <ul className="grid gap-1.5 text-sm font-semibold max-w-[70rem] list-disc pl-5">
            {g.lines.map((l) => <li key={l}>{l}</li>)}
          </ul>
        </article>
      ))}
    </section>
  );
}
