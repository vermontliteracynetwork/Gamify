import type { CSSProperties, ReactNode } from 'react';
import { ArrowsClockwise, Check, CornersOut, FlagCheckered, GearSix, HourglassHigh, Play, X } from '@phosphor-icons/react';
import { PP } from './PaletteProposal';
import { PATTERNS } from './PatternProposal';
import { BlobPatch, CrayonDie, CrayonPawn, CrayonPowerUp, Doodle, type DoodleKind, type PowerId } from './CrayonKit';
import { Badge, Laptop, MainBtn, TEAMS, Tablet } from './UniversalViews';
import { layout } from '../games/castle-quest/board';

// Game mockups (PROPOSAL, teacher 2026-11-23: "mockups of all the games with a
// new and improved universal classic design theme", only the seven games live
// on the home page). Batch 1: Game Show and Board Game; batch 2: the other five. Each is the real game
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

// ================= batch 2: shared parts =================
const pat = (id: string) => PATTERNS.find((p) => p.id === id)!.make(false);
// A busy pattern ground for the stage edges; words never sit on it, only on paper.
function PatternStage({ id, children }: { id: string; children: ReactNode }) {
  return <div className="w-full h-full relative overflow-hidden" style={pat(id)}>{children}</div>;
}
function Stat({ label, value, icon }: { label: string; value: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl" style={{ background: PP.paper, border: `2.5px solid ${I}` }}>
      {icon}<span className="grid leading-none"><span className="text-xs font-bold uppercase tracking-wider" style={{ color: PP.quiet }}>{label}</span><b className="font-display text-2xl tabular-nums">{value}</b></span>
    </div>
  );
}
// Solo top strip: score first and biggest, no player icon (teacher, 2026-11-23).
function SoloStrip({ score, children }: { score: number; children?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2" style={{ ...paper, borderRadius: 22 }}>
      <span className="font-display text-5xl font-bold leading-none tabular-nums">{score}</span>
      <span className="flex-1" />
      {children}
    </div>
  );
}
function StarGoal({ got }: { got: number }) {
  return <span className="flex gap-1" aria-label={`${got} of 3 stars`}>{[0, 1, 2].map((i) => <Doodle key={i} kind="star" color={i < got ? PP.lemon : PP.paper} size={30} />)}</span>;
}
function HeldTray({ items, label = 'Power-ups', row }: { items: { id: PowerId; name: string }[]; label?: string; row?: boolean }) {
  return (
    <div className={`flex ${row ? 'items-center' : 'flex-col'} gap-2 px-3 py-2 rounded-2xl`} style={{ background: PP.butter, border: `2.5px solid ${I}` }}>
      <b className="text-sm">{label}</b>
      <span className="flex gap-2">{items.map((p) => <span key={p.id} title={p.name} className="rounded-xl" style={{ background: PP.paper, border: `2.5px solid ${I}`, boxShadow: `0 3px 0 ${I}`, padding: 2 }}><CrayonPowerUp id={p.id} size={44} sticker /></span>)}</span>
    </div>
  );
}
function Burst({ text, color = PP.lemon, size = 'text-3xl', rot = -4 }: { text: string; color?: string; size?: string; rot?: number }) {
  return <span className={`inline-flex items-center px-5 py-1.5 rounded-full font-display font-bold whitespace-nowrap ${size}`} style={{ background: color, border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}`, transform: `rotate(${rot}deg)` }}>{text}</span>;
}
const shine = (s: number) => <path d={`M${s * 0.28} ${s * 0.36} q${s * 0.04} ${-s * 0.1} ${s * 0.14} ${-s * 0.12}`} stroke="#fff" strokeWidth={s * 0.07} fill="none" strokeLinecap="round" />;

// ================= Match Three (Solo) =================
// The real game: a 7 x 7 board of six pieces, swap to make rows of 3; 4 in a
// line makes a line piece, an L or T a bomb, 5 a rainbow; moves per round and
// a three-star goal. Each piece is a shape as well as a color (WCAG 1.4.1).
const GEM = [
  { c: PP.periwinkle, d: (s: number) => `M${s / 2} ${s * 0.1} a${s * 0.4} ${s * 0.4} 0 1 0 0.01 0 Z` },
  { c: PP.lemon, d: (s: number) => `M${s * 0.5} ${s * 0.08} L${s * 0.62} ${s * 0.36} L${s * 0.92} ${s * 0.38} L${s * 0.69} ${s * 0.58} L${s * 0.77} ${s * 0.9} L${s * 0.5} ${s * 0.73} L${s * 0.23} ${s * 0.9} L${s * 0.31} ${s * 0.58} L${s * 0.08} ${s * 0.38} L${s * 0.38} ${s * 0.36} Z` },
  { c: PP.pink, d: (s: number) => `M${s * 0.5} ${s * 0.88} C${s * 0.22} ${s * 0.7} ${s * 0.06} ${s * 0.52} ${s * 0.08} ${s * 0.34} C${s * 0.1} ${s * 0.14} ${s * 0.38} ${s * 0.1} ${s * 0.5} ${s * 0.3} C${s * 0.62} ${s * 0.1} ${s * 0.9} ${s * 0.14} ${s * 0.92} ${s * 0.34} C${s * 0.94} ${s * 0.52} ${s * 0.78} ${s * 0.7} ${s * 0.5} ${s * 0.88} Z` },
  { c: PP.sky, d: (s: number) => `M${s * 0.5} ${s * 0.07} L${s * 0.9} ${s * 0.5} L${s * 0.5} ${s * 0.93} L${s * 0.1} ${s * 0.5} Z` },
  { c: PP.orange, d: (s: number) => `M${s * 0.5} ${s * 0.1} L${s * 0.92} ${s * 0.86} L${s * 0.08} ${s * 0.86} Z` },
  { c: PP.kelly, d: (s: number) => `M${s * 0.14} ${s * 0.2} Q${s * 0.14} ${s * 0.14} ${s * 0.2} ${s * 0.14} L${s * 0.8} ${s * 0.14} Q${s * 0.86} ${s * 0.14} ${s * 0.86} ${s * 0.2} L${s * 0.86} ${s * 0.8} Q${s * 0.86} ${s * 0.86} ${s * 0.8} ${s * 0.86} L${s * 0.2} ${s * 0.86} Q${s * 0.14} ${s * 0.86} ${s * 0.14} ${s * 0.8} Z` },
];
function Gem({ k, s, special }: { k: number; s: number; special?: 'row' | 'rainbow' }) {
  if (special === 'rainbow') {
    return <svg width={s} height={s} aria-hidden="true">{[PP.pink, PP.orange, PP.lemon, PP.kelly, PP.sky].map((c, i) => <circle key={c} cx={s / 2} cy={s / 2} r={s * (0.42 - i * 0.075)} fill={c} stroke={I} strokeWidth={i === 0 ? 3.5 : 1.5} />)}{shine(s)}</svg>;
  }
  const g = GEM[k];
  return (
    <svg width={s} height={s} aria-hidden="true">
      <path d={g.d(s)} fill={g.c} stroke={I} strokeWidth={3.5} strokeLinejoin="round" />
      {special === 'row' && [0.42, 0.58].map((y) => <path key={y} d={`M${s * 0.22} ${s * y} H${s * 0.78}`} stroke="#fff" strokeWidth={s * 0.06} strokeLinecap="round" />)}
      {shine(s)}
    </svg>
  );
}
const M3 = Array.from({ length: 49 }, (_, i) => { const r = Math.floor(i / 7), c = i % 7; return (r * 4 + c * 5 + ((r * c) % 4)) % 6; });
[16, 17, 18].forEach((i) => { M3[i] = 2; }); // the match that is popping
const M3_SPECIAL: Record<number, 'row' | 'rainbow'> = { 31: 'row', 40: 'rainbow' };
function M3Board({ s }: { s: number }) {
  return (
    <div className="relative p-3 rounded-[24px]" style={{ ...pat('checker'), border: `4px solid ${I}`, boxShadow: `0 6px 0 ${I}` }}>
      <div className="grid grid-cols-7 relative" style={{ width: s * 7, height: s * 7 }}>
        {M3.map((k, i) => {
          const pop = i >= 16 && i <= 18;
          return <span key={i} className="grid place-items-center" style={pop ? { transform: 'scale(1.18)', filter: `drop-shadow(0 0 0 ${PP.lemon})` } : undefined}><Gem k={k} s={s * 0.86} special={M3_SPECIAL[i]} /></span>;
        })}
        {/* celebration: three hearts popping, a ring of sparkles and the points */}
        <span className="absolute rounded-full pointer-events-none" style={{ left: s * 1.9, top: s * 2.05, width: s * 3.2, height: s * 0.9, border: `4px solid ${I}`, boxShadow: `0 0 0 6px ${PP.lemon}` }} />
        <span className="absolute" style={{ left: s * 3.5, top: s * 1.1, transform: 'translateX(-50%)' }}><Burst text="Match! +30" /></span>
        <Confetti marks={[['sparkle', PP.lemon, s * 1.3, s * 1.9, s * 0.45], ['sparkle', PP.paper, s * 5.2, s * 2.6, s * 0.4], ['dot', PP.pink, s * 5.3, s * 1.8, s * 0.22], ['star', PP.kelly, s * 1.4, s * 2.9, s * 0.32]]} />
      </div>
    </div>
  );
}
const M3_HELD: { id: PowerId; name: string }[] = [{ id: 'extra-time', name: 'Pocket Watch' }, { id: 'tornado', name: 'Tornado' }];
function MatchThreeLaptop() {
  return (
    <PatternStage id="cutpaper-pastel">
      <Corner />
      <div className="absolute left-[60px] top-[58px]"><M3Board s={66} /></div>
      <div className="absolute right-[56px] top-[110px] w-[330px] grid gap-3">
        <SoloStrip score={260}><StarGoal got={2} /></SoloStrip>
        <div className="grid grid-cols-2 gap-2"><Stat label="Moves left" value={2} /><Stat label="Round" value="2 of 3" /></div>
        <HeldTray items={M3_HELD} row />
      </div>
    </PatternStage>
  );
}
function MatchThreeTablet() {
  return (
    <PatternStage id="cutpaper-pastel">
      <Corner />
      <div className="absolute inset-x-8 top-[84px] grid gap-3"><SoloStrip score={260}><Stat label="Moves" value={2} /><StarGoal got={2} /></SoloStrip></div>
      <div className="absolute left-1/2 -translate-x-1/2 top-[230px]"><M3Board s={100} /></div>
      <div className="absolute inset-x-8 top-[980px]"><HeldTray items={M3_HELD} row /></div>
    </PatternStage>
  );
}

// ================= Four in a Row (Share, or Solo against the computer) =================
// The real game: a 7 x 6 frame, answer then drop a piece, four in a line wins;
// power-ups Double Drop and Pop Out. Pieces carry a mark as well as a color.
const P1 = { color: PP.periwinkle, mark: 'dot' as const }, P2 = { color: PP.lemon, mark: 'star' as const };
// 0 empty, 1 player one, 2 player two; row 0 is the top.
const F4: number[][] = [
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 2, 0, 0, 0],
  [0, 0, 2, 1, 1, 0, 0],
  [0, 2, 1, 2, 1, 0, 0],
  [2, 1, 1, 2, 2, 1, 0],
];
const WIN = [[5, 0], [4, 1], [3, 2], [2, 3]];
function Disc({ p, s }: { p: number; s: number }) {
  const P = p === 1 ? P1 : P2;
  return (
    <svg width={s} height={s} aria-hidden="true">
      <circle cx={s / 2} cy={s / 2} r={s * 0.44} fill={P.color} stroke={I} strokeWidth={3.5} />
      <circle cx={s / 2} cy={s / 2} r={s * 0.3} fill="none" stroke={I} strokeWidth={2} opacity="0.35" />
      {P.mark === 'dot' ? <circle cx={s / 2} cy={s / 2} r={s * 0.1} fill={I} /> : <path d={`M${s / 2} ${s * 0.32} l${s * 0.05} ${s * 0.11} l${s * 0.12} ${s * 0.01} l-${s * 0.09} ${s * 0.08} l${s * 0.03} ${s * 0.12} l-${s * 0.11} -${s * 0.07} l-${s * 0.11} ${s * 0.07} l${s * 0.03} -${s * 0.12} l-${s * 0.09} -${s * 0.08} l${s * 0.12} -${s * 0.01} Z`} fill={I} />}
      {shine(s)}
    </svg>
  );
}
function F4Board({ s }: { s: number }) {
  return (
    <div className="relative">
      {/* the next piece waits over its column */}
      <span className="absolute" style={{ left: 16 + s * 4, top: -s * 1.05 }}><Disc p={1} s={s} /></span>
      <div className="relative p-4 rounded-[26px] grid grid-cols-7" style={{ background: PP.sky, border: `4px solid ${I}`, boxShadow: `0 6px 0 ${PP.skyDeep}` }}>
        {F4.flatMap((row, r) => row.map((v, c) => (
          <span key={`${r}-${c}`} className="grid place-items-center" style={{ width: s, height: s }}>
            {v ? <Disc p={v} s={s * 0.86} /> : <span className="rounded-full" style={{ width: s * 0.78, height: s * 0.78, background: PP.paper, border: `3px solid ${I}` }} />}
          </span>
        )))}
        {/* celebration: the winning line gets a lemon band and a burst */}
        <svg className="absolute pointer-events-none" style={{ left: 16, top: 16 }} width={s * 7} height={s * 6} aria-hidden="true">
          <path d={WIN.map(([r, c], i) => `${i ? 'L' : 'M'}${c * s + s / 2} ${r * s + s / 2}`).join(' ')} stroke={I} strokeWidth={s * 0.3} strokeLinecap="round" fill="none" />
          <path d={WIN.map(([r, c], i) => `${i ? 'L' : 'M'}${c * s + s / 2} ${r * s + s / 2}`).join(' ')} stroke={PP.lemon} strokeWidth={s * 0.18} strokeLinecap="round" fill="none" />
        </svg>
      </div>
      <span className="absolute h-6 rounded-b-xl" style={{ left: 24, width: 26, bottom: -22, background: PP.skyDeep, border: `3px solid ${I}` }} />
      <span className="absolute h-6 rounded-b-xl" style={{ right: 24, width: 26, bottom: -22, background: PP.skyDeep, border: `3px solid ${I}` }} />
    </div>
  );
}
function F4Player({ i, now, held }: { i: number; now?: boolean; held?: { id: PowerId; name: string } }) {
  return (
    <div className="p-3 grid justify-items-center gap-2 text-center w-full" style={{ ...paper, boxShadow: now ? `0 0 0 5px ${PP.lemon}, 0 4px 0 ${I}` : paper.boxShadow }}>
      <Disc p={i + 1} s={54} />
      <b className="font-display text-2xl">{['Ava', 'Leo'][i]}</b>
      {now && <span className="font-bold text-sm">Your turn: drop a piece</span>}
      {held && <span title={held.name} className="rounded-xl" style={{ background: PP.butter, border: `2px solid ${I}`, padding: 2 }}><CrayonPowerUp id={held.id} size={40} sticker /></span>}
    </div>
  );
}
function FourLaptop() {
  return (
    <PatternStage id="squiggle-pastel">
      <Corner />
      <div className="absolute left-[44px] top-[150px] w-[170px]"><F4Player i={0} now held={{ id: 'swap', name: 'Pop Out' }} /></div>
      <div className="absolute right-[44px] top-[150px] w-[170px]"><F4Player i={1} /></div>
      <div className="absolute left-1/2 -translate-x-1/2 top-[118px]"><F4Board s={64} /></div>
      <div className="absolute left-1/2 -translate-x-1/2 top-[28px] z-10"><Burst text="Four in a row! Ava wins!" size="text-3xl" /></div>
      <Confetti marks={[['sparkle', PP.lemon, 250, 70, 34], ['star', PP.pink, 720, 60, 28], ['dot', PP.sky, 230, 130, 16], ['heart', PP.pink, 760, 120, 24]]} />
    </PatternStage>
  );
}
function FourTablet() {
  return (
    <PatternStage id="squiggle-pastel">
      <Corner />
      <div className="absolute left-1/2 -translate-x-1/2 top-[90px] z-10"><Burst text="Four in a row! Ava wins!" size="text-4xl" /></div>
      <div className="absolute left-1/2 -translate-x-1/2 top-[300px]"><F4Board s={98} /></div>
      <div className="absolute inset-x-10 top-[960px] grid grid-cols-2 gap-5"><F4Player i={0} now held={{ id: 'swap', name: 'Pop Out' }} /><F4Player i={1} /></div>
      <Confetti marks={[['sparkle', PP.lemon, 80, 170, 40], ['star', PP.pink, 700, 180, 34], ['dot', PP.sky, 120, 240, 18]]} />
    </PatternStage>
  );
}

// ================= Bubble Pop (Solo) =================
// The real game: rows of 19 bubbles (odd rows 18) in six colors, a shooter at
// the bottom with the next bubble, match 3 to pop, a new row slides in after
// five shots with no pop. Each bubble carries a small mark as well as a color.
const BUB = [PP.lemon, PP.pink, PP.kelly, PP.sky, PP.periwinkle, PP.orange];
function Bubble({ k, s }: { k: number; s: number }) {
  return (
    <svg width={s} height={s} aria-hidden="true" overflow="visible">
      <circle cx={s / 2} cy={s / 2} r={s * 0.46} fill={BUB[k]} stroke={I} strokeWidth={Math.max(2, s * 0.08)} />
      <circle cx={s * 0.36} cy={s * 0.34} r={s * 0.09} fill="#fff" />
      {k % 2 === 1 && <circle cx={s * 0.6} cy={s * 0.6} r={s * 0.1} fill={I} opacity="0.55" />}
    </svg>
  );
}
const BCOLS = 19, BROWS = 7;
const BGRID = Array.from({ length: BROWS }, (_, r) => Array.from({ length: r % 2 ? BCOLS - 1 : BCOLS }, (_, c) => (Math.floor(c / 2) + r * 2 + (c % 3 === 0 ? 1 : 0)) % 6));
const BPOP = new Set(['6-8', '6-9', '5-9', '6-10']); // the cluster that just popped
function BubbleBoard({ w }: { w: number }) {
  const s = w / BCOLS, rowH = s * 0.87, h = w * 1.3;
  return (
    <div className="relative rounded-[24px] overflow-hidden" style={{ width: w + 24, height: h, padding: 12, background: PP.blueCrystal, border: `4px solid ${I}`, boxShadow: `0 6px 0 ${I}` }}>
      <div className="relative" style={{ width: w, height: h - 24 }}>
        {BGRID.flatMap((row, r) => row.map((k, c) => {
          const popped = BPOP.has(`${r}-${c}`);
          return (
            <span key={`${r}-${c}`} className="absolute" style={{ left: c * s + (r % 2 ? s / 2 : 0), top: r * rowH }}>
              {popped ? <Doodle kind="sparkle" color={PP.paper} size={s * 0.9} /> : <Bubble k={k} s={s} />}
            </span>
          );
        }))}
        {/* danger line */}
        <span className="absolute inset-x-0" style={{ top: rowH * 11.4, borderTop: `3px dashed ${PP.pink}` }} />
        {/* aim: dotted path from the shooter */}
        <svg className="absolute inset-0 pointer-events-none" width={w} height={h - 24} aria-hidden="true">
          <path d={`M${w / 2} ${h - 24 - s * 1.6} L${w * 0.3} ${rowH * 7.4}`} stroke={I} strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" />
        </svg>
        <span className="absolute -translate-x-1/2" style={{ left: w / 2, top: h - 24 - s * 2.3 }}><Bubble k={1} s={s * 1.5} /></span>
        <span className="absolute grid justify-items-center" style={{ left: w / 2 + s * 1.8, top: h - 24 - s * 1.8 }}><b className="text-xs uppercase" style={{ color: PP.quiet }}>Next</b><Bubble k={3} s={s} /></span>
        <span className="absolute -translate-x-1/2" style={{ left: w * 0.5, top: rowH * 3.4 }}><Burst text="Pop! +40" color={PP.lemon} /></span>
      </div>
    </div>
  );
}
const BP_HELD: { id: PowerId; name: string }[] = [{ id: 'double-points', name: 'Double Star' }];
function BubbleLaptop() {
  return (
    <PatternStage id="doodle">
      <Corner />
      <div className="absolute left-1/2 -translate-x-1/2 top-[22px]"><BubbleBoard w={430} /></div>
      <div className="absolute left-[40px] top-[120px] w-[200px] grid gap-3">
        <SoloStrip score={340} />
        <Stat label="Bubbles left" value={3} />
        <Stat label="Break" value="2 of 4" />
      </div>
      <div className="absolute right-[40px] top-[120px] w-[200px]"><HeldTray items={BP_HELD} label="Power-up ready" /></div>
    </PatternStage>
  );
}
function BubbleTablet() {
  return (
    <PatternStage id="doodle">
      <Corner />
      <div className="absolute inset-x-8 top-[84px]"><SoloStrip score={340}><Stat label="Bubbles" value={3} /><HeldTray items={BP_HELD} label="Ready" row /></SoloStrip></div>
      <div className="absolute left-1/2 -translate-x-1/2 top-[220px]"><BubbleBoard w={700} /></div>
    </PatternStage>
  );
}

// ================= Bowling (Share, Solo) =================
// The real game: answer right, aim, add spin and roll at ten pins; frames on
// the scoreboard; each player's ball is their icon. Power-ups include Golden
// Pin, Pin Magnet, Bumper Rails, Fireball, Pin Twister, Mystery Box, Sneaky Swipe.
const BALLS = [PP.periwinkle, PP.pink, PP.kelly];
function Ball({ c, s }: { c: string; s: number }) {
  return (
    <svg width={s} height={s} aria-hidden="true">
      <circle cx={s / 2} cy={s / 2} r={s * 0.45} fill={c} stroke={I} strokeWidth={Math.max(2.5, s * 0.06)} />
      {[[0.42, 0.34], [0.58, 0.32], [0.52, 0.48]].map(([x, y], i) => <circle key={i} cx={s * x} cy={s * y} r={s * 0.06} fill={I} />)}
      {shine(s)}
    </svg>
  );
}
function Pin({ h, down, rot = 0 }: { h: number; down?: boolean; rot?: number }) {
  const w = h * 0.32;
  return (
    <svg width={w} height={h} viewBox="0 0 64 200" aria-hidden="true" style={{ transform: `rotate(${rot}deg)`, opacity: down ? 1 : 1 }} overflow="visible">
      <path d="M32 6 C44 6 46 24 42 40 C40 50 38 56 44 72 C56 104 60 140 54 172 C52 186 44 194 32 194 C20 194 12 186 10 172 C4 140 8 104 20 72 C26 56 24 50 22 40 C18 24 20 6 32 6 Z" fill={PP.paper} stroke={I} strokeWidth="7" strokeLinejoin="round" />
      <path d="M22 58 H42 M20 70 H44" stroke={PP.pink} strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}
const PIN_ROWS = [4, 3, 2, 1];
// Strike! every pin flies, each at its own tilt (irregular, never in step).
const TILT = [-48, 22, -70, 64, -30, 52, -12, 80, -60, 38];
function Lane({ w, h }: { w: number; h: number }) {
  const ph = h * 0.15;
  let k = 0;
  return (
    <div className="relative" style={{ width: w, height: h }}>
      {/* gutters and lane */}
      <div className="absolute inset-0 rounded-[22px]" style={{ background: PP.lavender, border: `4px solid ${I}` }} />
      <div className="absolute rounded-[14px]" style={{ left: w * 0.12, right: w * 0.12, top: 10, bottom: 10, background: PP.peach, border: `3px solid ${I}` }}>
        {[0.2, 0.4, 0.6, 0.8].map((x) => <span key={x} className="absolute top-0 bottom-0" style={{ left: `${x * 100}%`, borderLeft: `3px solid ${PP.orange}` }} />)}
        {[0.3, 0.42, 0.5, 0.58, 0.7].map((x, i) => <span key={x} className="absolute" style={{ left: `${x * 100}%`, top: `${i === 2 ? 66 : 70}%`, transform: 'translateX(-50%)' }}><Doodle kind="star" color={PP.orange} size={w * 0.045} /></span>)}
      </div>
      {/* pins, flying apart */}
      <div className="absolute inset-x-0 grid justify-items-center gap-0" style={{ top: h * 0.06 }}>
        {PIN_ROWS.map((n, r) => (
          <div key={r} className="flex justify-center" style={{ gap: w * 0.06, marginTop: r ? -ph * 0.55 : 0 }}>
            {Array.from({ length: n }, () => { const t = TILT[k++]; return <span key={k} style={{ transform: `translate(${t * 0.5}px, ${-Math.abs(t) * 0.4}px)` }}><Pin h={ph} rot={t} /></span>; })}
          </div>
        ))}
      </div>
      <span className="absolute -translate-x-1/2" style={{ left: '52%', top: h * 0.33 }}><Ball c={BALLS[1]} s={w * 0.2} /></span>
      <span className="absolute -translate-x-1/2 z-10" style={{ left: '50%', top: h * 0.5 }}><Burst text="Strike!" size="text-5xl" color={PP.lemon} rot={-6} /></span>
      <Confetti marks={[['sparkle', PP.lemon, w * 0.08, h * 0.04, w * 0.1], ['star', PP.pink, w * 0.82, h * 0.06, w * 0.08], ['dot', PP.sky, w * 0.86, h * 0.3, w * 0.04], ['sparkle', PP.paper, w * 0.04, h * 0.32, w * 0.07]]} />
      {/* aim arrow at the foul line */}
      <svg className="absolute" style={{ left: 0, top: h * 0.78 }} width={w} height={h * 0.2} aria-hidden="true">
        <path d={`M${w / 2} ${h * 0.17} L${w * 0.56} ${h * 0.03}`} stroke={I} strokeWidth="5" strokeDasharray="3 10" strokeLinecap="round" />
      </svg>
    </div>
  );
}
const FRAMES = [['X', '7 /', '9'], ['8 1', 'X', ''], ['6 2', '5 3', '']];
function FrameBoard({ compact }: { compact?: boolean }) {
  return (
    <div className="grid gap-1.5 p-2.5" style={{ ...paper, borderRadius: 18 }}>
      {['Ava', 'Mia', 'Leo'].map((n, i) => (
        <div key={n} className="grid items-center gap-1.5" style={{ gridTemplateColumns: `${compact ? 30 : 34}px 1fr repeat(3, ${compact ? 40 : 46}px) ${compact ? 40 : 48}px` }}>
          <Ball c={BALLS[i]} s={compact ? 28 : 32} />
          <b className={`truncate ${compact ? 'text-sm' : 'text-base'}`} style={i === 1 ? { background: PP.lemon, borderRadius: 8, padding: '0 6px' } : undefined}>{n}</b>
          {FRAMES[i].map((f, j) => <span key={j} className="h-9 rounded-lg grid place-items-center font-display text-lg" style={{ background: PP.paper, border: `2px solid ${I}` }}>{f}</span>)}
          <span className="font-display text-2xl text-right tabular-nums">{[46, 38, 16][i]}</span>
        </div>
      ))}
    </div>
  );
}
const BW_HELD: { id: PowerId; name: string }[] = [{ id: 'magnet', name: 'Pin Magnet' }, { id: 'shield', name: 'Bumper Rails' }];
function AlleyWall({ children }: { children: ReactNode }) {
  return (
    <div className="w-full h-full relative overflow-hidden" style={{ background: PP.grape }}>
      <div className="absolute inset-x-0 top-0 h-[34%]" style={pat('cutpaper')} />
      <div className="absolute inset-x-0 top-[34%] h-4" style={{ background: PP.lemon, borderTop: `4px solid ${I}`, borderBottom: `4px solid ${I}` }} />
      {children}
    </div>
  );
}
function BowlingLaptop() {
  return (
    <AlleyWall>
      <Corner dark />
      <div className="absolute left-1/2 -translate-x-1/2 top-[26px]"><Lane w={330} h={575} /></div>
      <div className="absolute left-[30px] top-[250px] w-[300px]"><FrameBoard compact /></div>
      <div className="absolute right-[30px] top-[250px] w-[300px] grid gap-3">
        <TurnPill t={{ ...TEAMS[2], name: 'Team Pink' } as Team} text="Mia rolls!" />
        <HeldTray items={BW_HELD} label="Mia's power-ups" row />
      </div>
    </AlleyWall>
  );
}
function BowlingTablet() {
  return (
    <AlleyWall>
      <Corner dark />
      <div className="absolute left-1/2 -translate-x-1/2 top-[76px]"><Lane w={470} h={770} /></div>
      <div className="absolute inset-x-6 top-[870px] grid grid-cols-[1fr_230px] gap-3 items-start"><FrameBoard /><HeldTray items={BW_HELD} label="Mia's power-ups" /></div>
    </AlleyWall>
  );
}

// ================= Question Tracker (Live, Solo) =================
// The real game: every right answer adds an item (a star) until the whole
// scene is full. Live: the class screen fills one sky together (or races in
// colors) while each student answers on their own device. It has no
// power-ups today; first-try streaks turn stars gold (the "combo").
const SKY_N = 30, SKY_GOT = 18;
const SKY_PTS = Array.from({ length: SKY_N }, (_, i) => { const r = Math.sin(i * 12.9898) * 43758.5453; const f2 = r - Math.floor(r); const col = i % 6, row = Math.floor(i / 6); return [0.07 + col * 0.17 + (f2 - 0.5) * 0.08, 0.12 + row * 0.17 + ((f2 * 7) % 1 - 0.5) * 0.08]; });
function ClassSky({ w, h, small }: { w: number; h: number; small?: boolean }) {
  const s = small ? 26 : Math.min(w, h) * 0.085;
  return (
    <div className="relative rounded-[24px] overflow-hidden" style={{ width: w, height: h, background: PP.blueCrystal, border: `4px solid ${I}` }}>
      <svg className="absolute inset-0" width={w} height={h} aria-hidden="true">
        <path d={`M0 ${h * 0.86} C${w * 0.3} ${h * 0.78} ${w * 0.6} ${h * 0.9} ${w} ${h * 0.8} L${w} ${h} L0 ${h} Z`} fill={PP.mint} stroke={I} strokeWidth="4" />
      </svg>
      {SKY_PTS.map(([x, y], i) => (
        <span key={i} className="absolute" style={{ left: x * w, top: y * h * 0.82 }}>
          {i < SKY_GOT
            ? <Doodle kind="star" color={i >= SKY_GOT - 3 ? PP.orange : PP.lemon} size={i >= SKY_GOT - 3 ? s * 1.15 : s} />
            : <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 L14.6 8.6 L21.5 9 L16.2 13.4 L18 20.3 L12 16.5 L6 20.3 L7.8 13.4 L2.5 9 L9.4 8.6 Z" fill="none" stroke={PP.quiet} strokeWidth="1.6" strokeDasharray="2.5 2.5" strokeLinejoin="round" /></svg>}
        </span>
      ))}
    </div>
  );
}
function ClassScreen() {
  return (
    <PatternStage id="confetti">
      <Corner />
      <div className="absolute left-[28px] top-[22px] flex items-center gap-3 px-4 py-2" style={{ ...paper, borderRadius: 18 }}>
        <span className="font-bold" style={{ color: PP.quiet }}>Join code</span><b className="font-display text-3xl tracking-widest">472915</b>
      </div>
      <div className="absolute left-[28px] top-[92px]"><ClassSky w={700} h={505} /></div>
      <div className="absolute left-[262px] top-[300px]"><Burst text="Three gold stars in a row!" size="text-2xl" color={PP.butter} /></div>
      <div className="absolute right-[24px] top-[92px] w-[224px] grid gap-3">
        <div className="p-4 grid gap-2 text-center" style={paper}>
          <b className="text-sm uppercase tracking-wider" style={{ color: PP.quiet }}>Class goal</b>
          <span className="font-display text-5xl font-bold leading-none tabular-nums">18<span className="text-2xl"> of 30</span></span>
          <span className="h-5 rounded-full overflow-hidden" style={{ background: PP.paper, border: `2.5px solid ${I}` }}><span className="block h-full" style={{ width: '60%', background: PP.lemon, borderRight: `2.5px solid ${I}` }} /></span>
          <span className="font-bold">Fill the sky together!</span>
        </div>
        <div className="p-3 grid gap-1.5" style={paper}>
          <b className="text-sm">12 playing</b>
          <div className="flex flex-wrap gap-1.5">{['Ava', 'Leo', 'Mia', 'Noah', 'Zoe', 'Eli', 'Ivy', 'Max'].map((n, i) => <span key={n} className="px-2 py-0.5 rounded-full text-sm font-bold" style={{ background: [PP.gamify, PP.aqua, PP.blush, PP.butter][i % 4], border: `2px solid ${I}` }}>{n}</span>)}</div>
        </div>
      </div>
    </PatternStage>
  );
}
const ANS = [['A', 'cat', PP.periwinkle], ['B', 'Cat', PP.sky], ['C', 'CAT', PP.pink], ['D', 'caT', PP.lemon]] as const;
function StudentDevice() {
  return (
    <div className="w-full h-full relative" style={{ ...quiet, padding: 32 }}>
      <Corner />
      <div className="mt-16 flex items-center gap-3 px-4 py-2" style={{ ...paper, borderRadius: 18 }}>
        <Doodle kind="star" color={PP.lemon} size={40} /><b className="font-display text-3xl">You added 4 stars</b>
        <span className="flex-1" /><span className="font-bold" style={{ color: PP.quiet }}>Class sky: 18 of 30</span>
      </div>
      <div className="mt-6 p-7 grid gap-5" style={{ ...paper, borderRadius: 26 }}>
        <span className="font-bold" style={{ color: PP.quiet }}>Question 5 of 10</span>
        <p className="font-display text-4xl leading-snug text-left">Which word starts a sentence the right way?</p>
        <div className="grid gap-3">
          {ANS.map(([l, w, c], i) => (
            <span key={l} className="flex items-center gap-4 px-4 min-h-[88px] rounded-2xl text-left" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: i === 1 ? `0 0 0 3px ${PP.paper}, 0 0 0 6px ${I}, 0 4px 0 ${I}` : `0 4px 0 ${I}` }}>
              <span className="w-14 h-14 rounded-full grid place-items-center font-display text-3xl font-bold" style={{ background: c, border: `3px solid ${I}` }}>{l}</span>
              <b className="font-display text-4xl flex-1">{w}</b>{i === 1 && <span className="w-12 h-12 rounded-full grid place-items-center" style={{ background: PP.kelly, border: `3px solid ${I}` }}><Check weight="bold" size={28} color="#fff" /></span>}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-6 grid justify-items-center"><Burst text="Yes! A star for the sky!" size="text-3xl" color={PP.lemon} rot={-3} /></div>
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
  {
    id: 'match-three', name: 'Match Three (Solo)', laptop: <MatchThreeLaptop />, tablet: <MatchThreeTablet />,
    lines: [
      'New: a pastel cut-paper desk around a checker board; the six pieces are six shapes (circle, star, heart, diamond, triangle, square) in six brights; line and rainbow pieces read by their stripes and rings; score, moves and the three-star goal on one paper strip, no player icon.',
      'Why: shape plus color lets color-blind players and pre-readers find matches (WCAG 1.4.1, dual coding); the star goal makes progress visible (goal-gradient effect); busy pattern only outside the board.',
      'Pieces (theme template): Background 1600 x 1200, Board 900 x 900, six Pieces 128 x 128, four special pieces 128 x 128 (sideways line, up and down line, bomb, rainbow), Power-up 256 x 256 (5 Classic, up to 6), Cover 600 x 600, Title 1200 x 360.',
    ],
  },
  {
    id: 'four-in-a-row', name: 'Four in a Row (Share, Solo vs computer)', laptop: <FourLaptop />, tablet: <FourTablet />,
    lines: [
      'New: a sky blue crayon frame on legs with paper holes, standing on the pastel squiggle ground; Gamify purple pieces with a dot and lemon pieces with a star; the next piece waits over its column; the win line gets a lemon band and a burst.',
      'Why: a mark inside each piece keeps the two sides apart without color (WCAG 1.4.1); the waiting piece shows what a tap will do before it happens (feedforward); the player whose turn it is glows lemon, the same cue as every game.',
      'Pieces (theme template): Background 1600 x 1200, Board 1000 x 860 (frame with holes), Player 1 and Player 2 pieces 128 x 128, Team icon 256 x 256 (up to 10), Power-up 256 x 256 (Double Drop, Pop Out; up to 4), Cover 600 x 600, Title 1200 x 360.',
    ],
  },
  {
    id: 'bubble-pop', name: 'Bubble Pop (Solo)', laptop: <BubbleLaptop />, tablet: <BubbleTablet />,
    lines: [
      'New: a doodle-scatter wall around a Blue crystal board (no more navy) with the real 19-bubble rows; ink-edged bright bubbles with a shine, every other color with a center dot; a dotted aim line, the next bubble beside the shooter, a dashed pink danger line.',
      'Why: the light board lifts contrast for every bubble on a projector (WCAG 1.4.11 non-text contrast); the aim line and next bubble cut planning load (cognitive load); score and bubbles left sit outside the play area, no player icon.',
      'Pieces (theme template): Background 1600 x 1200, Board 1000 x 1300, six Bubbles 128 x 128, Power-up 256 x 256 (4 Classic, up to 6), Cover 600 x 600, Title 1200 x 360.',
    ],
  },
  {
    id: 'bowling', name: 'Bowling (Share, Solo)', laptop: <BowlingLaptop />, tablet: <BowlingTablet />,
    lines: [
      'New: a Grape alley wall with a cut-paper band and a lemon rail; a peach lane with orange boards and aim stars, lavender gutters; paper pins with a pink stripe; each player\'s ball is their icon on the frame scoreboard; a Strike sends the pins flying, each at its own tilt.',
      'Why: the lane is the brightest, simplest shape so eyes go to it first (visual hierarchy); irregular pin flights keep every roll a surprise (variable reward kept honest: points always come from the roll); frames stay readable as a table.',
      'Pieces (theme template): Background 1000 x 1300 (alley wall), Lane 800 x 1000, Pin 64 x 200, Ball 256 x 256 (up to 10, each player\'s icon), Power-up 256 x 256 (7 Classic), Cover 600 x 600, Title 1200 x 360.',
    ],
  },
  {
    id: 'star-quiz', name: 'Question Tracker (Live: class screen and a student device)', laptop: <ClassScreen />, tablet: <StudentDevice />,
    lines: [
      'New: the class screen is one big Blue crystal sky over a mint hill that fills with lemon stars (gold for a first-try streak), with the join code, the class goal bar and who is playing; the student device shows the question card, left-aligned, with A to D letter tiles and a running count of the stars they gave the sky.',
      'Why: one shared goal builds relatedness and lowers social comparison (self-determination theory); empty stars are dashed outlines so the goal is visible from the back row (goal-gradient effect); answers are 88px tall for small fingers (WCAG 2.5.5).',
      'Pieces (theme template): Background 1600 x 1000 (the scene that fills), six Items 256 x 256 (a star, a fish...), Cover 600 x 600, Title 1200 x 360. No power-ups in this game today.',
    ],
  },
];

export default function GameMockups() {
  return (
    <section className="grid gap-8">
      <div className="grid gap-1">
        <h2 className="font-heading text-2xl">Game mockups <span className="text-base align-middle px-2 py-0.5 rounded-full border-2 border-black bg-[#fdfd94]">Proposal</span></h2>
        <p className="text-sm font-semibold text-muted max-w-prose">The seven live games in the improved universal Classic theme. All seven: Game Show, Board Game, Match Three, Four in a Row, Bubble Pop, Bowling and Question Tracker. Same boards, pieces and power-ups as today, redrawn in the kit. Preview only: no game changes until you approve.</p>
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
