import type { CSSProperties, ReactNode } from 'react';
import { ArrowRight, ArrowsClockwise, Check, CornersOut, DeviceTablet, FlagCheckered, GearSix, HourglassHigh, Lightning, Play, ProjectorScreen, SpeakerHigh, User, UsersThree, X } from '@phosphor-icons/react';
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
// Solo against the computer (former Versus games): two sides, named You and Computer.
const VS: Team[] = [{ ...TEAMS[0], name: 'You' } as unknown as Team, { ...TEAMS[3], name: 'Computer' } as unknown as Team];
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
function GSPop({ scale = 1, who = 'Team Sky' }: { scale?: number; who?: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center z-10 pointer-events-none">
      <div className="relative" style={{ transform: `scale(${scale}) rotate(-3deg)` }}>
        <Confetti marks={[['sparkle', PP.lemon, -52, -30, 34], ['star', PP.pink, 250, -26, 28], ['dot', PP.sky, -40, 150, 16], ['heart', PP.pink, 262, 140, 24], ['sparkle', PP.paper, 120, -54, 26], ['star', PP.kelly, -64, 64, 22], ['dot', PP.lemon, 280, 60, 14]]} />
        <div className="w-[240px] p-4 grid justify-items-center gap-1 text-center" style={{ ...paper, borderRadius: 24, boxShadow: `0 0 0 8px ${PP.lemon}, 0 0 0 11px ${I}, 0 12px 0 ${I}` }}>
          <div className="relative w-28 h-28 grid place-items-center"><BlobPatch color={PP.peach} size={124} /><span className="relative"><CrayonPowerUp id="treasure-chest" size={100} /></span></div>
          <b className="font-display text-4xl leading-none">Prize Bag!</b>
          <span className="font-bold text-lg">+100 for {who}</span>
        </div>
      </div>
    </div>
  );
}
const GS_SCORES = [70, 160, 50, 10];
const GS_HELD = [undefined, undefined, GS_POWERS.double, undefined];

function GameShowLaptop({ vs }: { vs?: boolean }) {
  const teams = vs ? VS : TEAMS;
  return (
    <div className="w-full h-full relative overflow-hidden">
      <StudioBack w={1000} h={625} />
      <Corner dark />
      <div className="absolute left-[96px] top-[52px] w-[600px] grid justify-items-center gap-3">
        <TurnPill t={vs ? VS[0] : TEAMS[1]} text={vs ? 'Your turn: pick a card!' : 'Team Sky, pick a card!'} />
        <Marquee bulbs={18}>
          <div className="grid grid-cols-4 gap-2.5">{GS_CARDS.map((c, i) => <GSCard key={i} c={c} />)}</div>
        </Marquee>
      </div>
      <div className="absolute right-[96px] top-[118px] w-[196px] grid gap-2.5">
        {teams.map((t, i) => <Score key={t.name} t={t} pts={vs ? [150, 90][i] : GS_SCORES[i]} now={vs ? i === 0 : i === 1} held={vs ? (i === 1 ? GS_POWERS.double : undefined) : GS_HELD[i]} compact />)}
        <span className="mt-1 text-sm font-bold px-3 py-1.5 rounded-xl text-center" style={{ background: PP.butter, border: `2px solid ${I}` }}>Fill a row for +10</span>
      </div>
      <div className="absolute left-[96px] top-[118px] w-[600px] h-[420px]"><GSPop scale={0.82} who={vs ? 'you' : 'Team Sky'} /></div>
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
function BoardGrid({ w, h, celebrate, pawns = PAWNS }: { w: number; h: number; celebrate?: boolean; pawns?: typeof PAWNS }) {
  const L = layout(N, w, h);
  const s = L.size;
  const ox = (w - L.cols * s) / 2, oy = (h - L.rows * s) / 2;
  const pos = (k: number) => ({ left: ox + L.cells[k].x * s, top: oy + L.cells[k].y * s });
  return (
    <div className="relative" style={{ width: w, height: h }}>
      {L.cells.map((_, k) => <span key={k} className="absolute" style={{ ...pos(k), width: s, height: s }}><Square kind={KINDS[k]} i={k} s={s} /></span>)}
      {pawns.map((p, j) => {
        const same = pawns.filter((q) => q.at === p.at).indexOf(p);
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
function DieCard({ big, who }: { big?: boolean; who?: Team }) {
  return (
    <div className="p-4 grid justify-items-center gap-3 text-center" style={paper}>
      <span className="font-display text-2xl font-bold flex items-center gap-2"><Badge t={who ?? TEAMS[1]} size={30} />{who ? 'Your turn' : 'Team Sky'}</span>
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
function MiniRace({ compact, teams = TEAMS, now = 1 }: { compact?: boolean; teams?: readonly Team[]; now?: number }) {
  return <>{teams.map((t, i) => (
    <div key={t.name} className={`flex items-center gap-2 ${compact ? 'px-2 py-1' : 'px-2.5 py-1.5'} rounded-2xl`} style={{ background: PP.paper, border: `2.5px solid ${I}`, boxShadow: i === now ? `0 0 0 4px ${PP.lemon}, 0 3px 0 ${I}` : `0 2px 0 ${I}` }}>
      <CrayonPawn color={t.color} size={26} /><b className="flex-1 truncate text-sm">{t.name}</b><span className="text-sm font-bold" style={{ color: PP.quiet }}>{BG_SCORES[i]}</span>
    </div>
  ))}</>;
}
function BoardLaptop({ vs }: { vs?: boolean }) {
  return (
    <div className="w-full h-full relative overflow-hidden">
      <ParkBack w={1000} h={625} />
      <Corner dark />
      <div className="absolute left-6 top-[74px] w-[690px] h-[520px] grid place-items-center" style={{ ...quiet, border: `4px solid ${I}`, borderRadius: 28, boxShadow: `0 6px 0 ${I}` }}>
        <BoardGrid w={650} h={480} celebrate={!vs} pawns={vs ? [{ t: 0, at: 17 }, { t: 3, at: 11 }] : undefined} />
      </div>
      <div className="absolute right-6 top-[74px] w-[250px] grid gap-2.5">
        <DieCard who={vs ? VS[0] : undefined} />
        <Tray />
        <MiniRace compact teams={vs ? [{ ...VS[0], color: TEAMS[0].color }, { ...VS[1], color: TEAMS[3].color }] : TEAMS} now={vs ? 0 : 1} />
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
const M3 = Array.from({ length: 49 }, (_, i) => { const r = Math.floor(i / 7), c = i % 7; return (c + 2 * r) % 6; });
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
      <div className="absolute w-max left-1/2 -translate-x-1/2 top-[220px]"><M3Board s={102} /></div>
      <div className="absolute inset-x-8 top-[1010px]"><HeldTray items={M3_HELD} row /></div>
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
function F4Board({ s, win = true }: { s: number; win?: boolean }) {
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
        {win && <svg className="absolute pointer-events-none" style={{ left: 16, top: 16 }} width={s * 7} height={s * 6} aria-hidden="true">
          <path d={WIN.map(([r, c], i) => `${i ? 'L' : 'M'}${c * s + s / 2} ${r * s + s / 2}`).join(' ')} stroke={I} strokeWidth={s * 0.3} strokeLinecap="round" fill="none" />
          <path d={WIN.map(([r, c], i) => `${i ? 'L' : 'M'}${c * s + s / 2} ${r * s + s / 2}`).join(' ')} stroke={PP.lemon} strokeWidth={s * 0.18} strokeLinecap="round" fill="none" />
        </svg>}
      </div>
      <span className="absolute h-6 rounded-b-xl" style={{ left: 24, width: 26, bottom: -22, background: PP.skyDeep, border: `3px solid ${I}` }} />
      <span className="absolute h-6 rounded-b-xl" style={{ right: 24, width: 26, bottom: -22, background: PP.skyDeep, border: `3px solid ${I}` }} />
    </div>
  );
}
function F4Player({ i, now, held, name, note = 'Winner!' }: { i: number; now?: boolean; held?: { id: PowerId; name: string }; name?: string; note?: string }) {
  return (
    <div className="p-3 grid justify-items-center gap-2 text-center w-full" style={{ ...paper, boxShadow: now ? `0 0 0 5px ${PP.lemon}, 0 4px 0 ${I}` : paper.boxShadow }}>
      <Disc p={i + 1} s={54} />
      <b className="font-display text-2xl">{name ?? ['Ava', 'Leo'][i]}</b>
      {now && <span className="font-bold text-sm">{note}</span>}
      {held && <span title={held.name} className="rounded-xl" style={{ background: PP.butter, border: `2px solid ${I}`, padding: 2 }}><CrayonPowerUp id={held.id} size={40} sticker /></span>}
    </div>
  );
}
function FourLaptop({ vs }: { vs?: boolean }) {
  return (
    <PatternStage id="squiggle-pastel">
      <Corner />
      <div className="absolute left-[44px] top-[150px] w-[170px]"><F4Player i={0} name={vs ? 'You' : undefined} now={vs} note="Your turn: drop a piece" held={{ id: 'swap', name: 'Pop Out' }} /></div>
      <div className="absolute right-[44px] top-[150px] w-[170px]"><F4Player i={1} name={vs ? 'Computer' : undefined} now={!vs} /></div>
      <div className="absolute w-max left-1/2 -translate-x-1/2 top-[92px]"><F4Board s={64} win={!vs} /></div>
      {!vs && <div className="absolute w-max left-1/2 -translate-x-1/2 top-[546px] z-10"><Burst text="Four in a row! Leo wins!" size="text-3xl" /></div>}
      {!vs && <Confetti marks={[['sparkle', PP.lemon, 250, 560, 34], ['star', PP.pink, 730, 556, 28], ['dot', PP.sky, 220, 520, 16], ['heart', PP.pink, 760, 520, 24]]} />}
    </PatternStage>
  );
}
function FourTablet() {
  return (
    <PatternStage id="squiggle-pastel">
      <Corner />
      <div className="absolute w-max left-1/2 -translate-x-1/2 top-[90px] z-10"><Burst text="Four in a row! Leo wins!" size="text-4xl" /></div>
      <div className="absolute w-max left-1/2 -translate-x-1/2 top-[300px]"><F4Board s={98} /></div>
      <div className="absolute inset-x-10 top-[960px] grid grid-cols-2 gap-5"><F4Player i={0} held={{ id: 'swap', name: 'Pop Out' }} /><F4Player i={1} now /></div>
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
        <span className="absolute -translate-x-1/2" style={{ left: w * 0.5, top: rowH * 8.6 }}><Burst text="Pop! +40" color={PP.lemon} /></span>
      </div>
    </div>
  );
}
const BP_HELD: { id: PowerId; name: string }[] = [{ id: 'double-points', name: 'Double Star' }];
function BubbleLaptop() {
  return (
    <PatternStage id="doodle">
      <Corner />
      <div className="absolute w-max left-1/2 -translate-x-1/2 top-[22px]"><BubbleBoard w={430} /></div>
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
      <div className="absolute w-max left-1/2 -translate-x-1/2 top-[220px]"><BubbleBoard w={700} /></div>
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
function FrameBoard({ compact, solo }: { compact?: boolean; solo?: boolean }) {
  return (
    <div className="grid gap-1.5 p-2.5" style={{ ...paper, borderRadius: 18 }}>
      {(solo ? ['You'] : ['Ava', 'Mia', 'Leo']).map((n, i) => (
        <div key={n} className="grid items-center gap-1.5" style={{ gridTemplateColumns: `${compact ? 30 : 34}px 1fr repeat(3, ${compact ? 40 : 46}px) ${compact ? 40 : 48}px` }}>
          <Ball c={BALLS[i]} s={compact ? 28 : 32} />
          <b className={`truncate ${compact ? 'text-sm' : 'text-base'}`} style={i === 1 || solo ? { background: PP.lemon, borderRadius: 8, padding: '0 6px' } : undefined}>{n}</b>
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
function RollPill({ who = 'Mia rolls!' }: { who?: string }) {
  return <div className="inline-flex items-center gap-3 pl-2 pr-5 py-1.5 rounded-full font-display text-2xl font-bold justify-self-start" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 0 0 5px ${PP.lemon}, 0 4px 0 ${I}` }}><Ball c={BALLS[1]} s={36} />{who}</div>;
}
function BowlingLaptop({ solo }: { solo?: boolean }) {
  return (
    <AlleyWall>
      <Corner dark />
      <div className="absolute w-max left-1/2 -translate-x-1/2 top-[26px]"><Lane w={330} h={575} /></div>
      <div className="absolute left-[30px] top-[250px] w-[300px]"><FrameBoard compact solo={solo} /></div>
      <div className="absolute right-[30px] top-[250px] w-[300px] grid gap-3">
        {!solo && <RollPill />}
        <HeldTray items={BW_HELD} label={solo ? 'Power-ups' : "Mia's power-ups"} row />
      </div>
    </AlleyWall>
  );
}
function BowlingTablet() {
  return (
    <AlleyWall>
      <Corner dark />
      <div className="absolute w-max left-1/2 -translate-x-1/2 top-[76px]"><Lane w={520} h={800} /></div>
      <div className="absolute inset-x-8 top-[900px] grid gap-3"><div className="flex gap-3 items-center"><RollPill /><span className="flex-1" /><HeldTray items={BW_HELD} label="Mia's power-ups" row /></div><FrameBoard /></div>
    </AlleyWall>
  );
}

// ================= Question Tracker (Live, Solo) =================
// The real game: every right answer adds an item (a star) until the whole
// scene is full. Live: the class screen fills one sky together (or races in
// colors) while each student answers on their own device. It has no
// power-ups today; first-try streaks turn stars gold (the "combo").
const SKY_N = 30, SKY_GOT = 18;
const SKY_PTS = Array.from({ length: SKY_N }, (_, i) => { const r = Math.sin(i * 12.9898) * 43758.5453; const f2 = r - Math.floor(r); const col = i % 6, row = Math.floor(i / 6); return [Math.min(0.88, 0.07 + col * 0.155 + (f2 - 0.5) * 0.06), 0.12 + row * 0.17 + ((f2 * 7) % 1 - 0.5) * 0.08]; });
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
      <div className="absolute left-[200px] top-[520px]"><Burst text="Three gold stars in a row!" size="text-2xl" color={PP.butter} /></div>
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
function StudentDevice({ solo }: { solo?: boolean }) {
  return (
    <div className="w-full h-full relative" style={{ ...quiet, padding: 32 }}>
      <Corner />
      <div className="mt-16 flex items-center gap-3 px-5 py-3" style={{ ...paper, borderRadius: 18 }}>
        <Doodle kind="star" color={PP.lemon} size={52} /><b className="font-display text-4xl">{solo ? 'My sky: 4 stars' : 'You added 4 stars'}</b>
        <span className="flex-1" />{!solo && <span className="font-bold" style={{ color: PP.quiet }}>Class sky: 18 of 30</span>}
      </div>
      <div className="mt-8 p-8 grid gap-6" style={{ ...paper, borderRadius: 26 }}>
        <span className="font-bold text-xl" style={{ color: PP.quiet }}>Question 5 of 10</span>
        <p className="font-display text-5xl leading-snug text-left">Which word starts a sentence the right way?</p>
        <div className="grid gap-4">
          {ANS.map(([l, w, c], i) => (
            <span key={l} className="flex items-center gap-4 px-4 min-h-[116px] rounded-2xl text-left" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: i === 1 ? `0 0 0 3px ${PP.paper}, 0 0 0 6px ${I}, 0 4px 0 ${I}` : `0 4px 0 ${I}` }}>
              <span className="w-16 h-16 rounded-full grid place-items-center font-display text-4xl font-bold" style={{ background: c, border: `3px solid ${I}` }}>{l}</span>
              <b className="font-display text-5xl flex-1">{w}</b>{i === 1 && <span className="w-12 h-12 rounded-full grid place-items-center" style={{ background: PP.kelly, border: `3px solid ${I}` }}><Check weight="bold" size={28} color="#fff" /></span>}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-10 grid justify-items-center"><Burst text="Yes! A star for the sky!" size="text-4xl" color={PP.lemon} rot={-3} /></div>
    </div>
  );
}

// ================= every view (teacher, 2026-11-23: "show me every view:
// lobby, teacher screen, student, share, etc. for all games") =================
// Menus wear the universal views look: quiet ground with a busy band only at
// the top and bottom edge, taped paper panels, Grow Year titles, Gamify purple
// go buttons with ink text. Every menu is centered (teacher, 2026-11-23);
// question text stays left-aligned in its card.
const GY: CSSProperties = { fontFamily: 'var(--font-display)', fontWeight: 400, lineHeight: 1 };
function Tape({ color = PP.butter, rot = -4 }: { color?: string; rot?: number }) {
  return <span aria-hidden="true" className="absolute z-10 left-1/2 -top-3.5" style={{ width: 110, height: 30, background: color, opacity: 0.85, transform: `translateX(-50%) rotate(${rot}deg)`, borderLeft: '2px dashed rgba(29,26,51,0.25)', borderRight: '2px dashed rgba(29,26,51,0.25)' }} />;
}
function Sheet({ children, w, layer = PP.gamify, tape = PP.blush, pad = 28 }: { children: ReactNode; w: number; layer?: string; tape?: string; pad?: number }) {
  return (
    <div className="relative mx-auto" style={{ width: w }}>
      <span aria-hidden="true" className="absolute inset-0 rounded-[30px]" style={{ background: layer, border: `3px solid ${I}`, transform: 'translate(10px, 10px) rotate(1.6deg)' }} />
      <div className="relative rounded-[30px] grid justify-items-center text-center gap-4" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 6px 0 ${I}`, padding: pad }}>{children}</div>
      <Tape color={tape} />
    </div>
  );
}
function Menu({ children, band = 'cutpaper', tall }: { children: ReactNode; band?: string; tall?: boolean }) {
  const b = tall ? 90 : 56;
  return (
    <div className="w-full h-full relative" style={quiet}>
      <div aria-hidden="true" className="absolute inset-x-0 top-0" style={{ height: b, ...pat(band), borderBottom: `3px solid ${I}` }} />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0" style={{ height: b, ...pat(band), borderTop: `3px solid ${I}` }} />
      <div className="absolute inset-x-0 grid place-items-center" style={{ top: b, bottom: b }}>{children}</div>
    </div>
  );
}
function Title({ children, size = 52 }: { children: ReactNode; size?: number }) {
  return <h2 style={{ ...GY, fontSize: size }}>{children}</h2>;
}
function Second({ children }: { children: ReactNode }) {
  return <span className="min-h-12 px-6 rounded-full font-bold text-lg inline-flex items-center gap-2" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}>{children}</span>;
}
function Dim({ children, over }: { children: ReactNode; over: ReactNode }) {
  return (
    <div className="w-full h-full relative">
      {children}
      <div className="absolute inset-0 z-30" style={{ background: 'rgba(29,26,51,0.5)' }} />
      <div className="absolute inset-0 z-40 grid place-items-center">{over}</div>
    </div>
  );
}
const MODE = {
  share: { name: 'Share', line: 'Play together on one screen', color: PP.butter, Icon: ProjectorScreen },
  live: { name: 'Live', line: 'Play together on your own devices', color: PP.blueCrystal, Icon: DeviceTablet },
  solo: { name: 'Solo', line: 'Play on your own', color: PP.mint, Icon: User },
} as const;
type Way = keyof typeof MODE;
const Tick = () => <span className="absolute -top-3 -right-3 w-10 h-10 rounded-full grid place-items-center" style={{ background: PP.kelly, border: `3px solid ${I}` }}><Check weight="bold" size={22} color="#fff" /></span>;
function Pills({ opts, pick }: { opts: string[]; pick: number }) {
  return (
    <div className="inline-flex gap-1.5 p-1.5 rounded-full" style={{ background: PP.paper, border: `2.5px solid ${I}` }}>
      {opts.map((o, i) => <span key={o} className="px-5 py-2 rounded-full font-bold text-xl" style={i === pick ? { background: PP.mint, boxShadow: `inset 0 0 0 2.5px ${I}` } : undefined}>{o}</span>)}
    </div>
  );
}

// ---------- 1. Welcome ----------
function Welcome({ name, art, steps }: { name: string; art: ReactNode; steps: [string, string, string] }) {
  return (
    <Menu>
      <Sheet w={640} tape={PP.aqua}>
        <Title size={60}>{name}</Title>
        <div className="relative w-40 h-40 grid place-items-center"><BlobPatch color={PP.blush} size={170} /><span className="relative">{art}</span></div>
        <ol className="grid gap-2 w-full max-w-[440px]">
          {steps.map((st, i) => <li key={st} className="flex items-center justify-center gap-3 font-bold text-2xl"><span className="w-10 h-10 rounded-full grid place-items-center shrink-0" style={{ background: [PP.gamify, PP.butter, PP.mint][i], border: `2.5px solid ${I}` }}>{i + 1}</span>{st}</li>)}
        </ol>
        <MainBtn big><Play weight="fill" size={24} />Start</MainBtn>
      </Sheet>
    </Menu>
  );
}
// ---------- 2. How will you play? ----------
function Ways({ ways, pick, share }: { ways: Way[]; pick: Way; share?: 'code' | 'here' | 'none' }) {
  return (
    <Menu>
      <Sheet w={ways.length === 3 ? 820 : 640} tape={PP.butter}>
        <Title size={46}>How will you play?</Title>
        <div className="flex justify-center gap-5">
          {ways.map((w) => { const M = MODE[w]; const on = w === pick; return (
            <span key={w} className="relative w-[220px] p-4 rounded-[24px] grid justify-items-center gap-2" style={{ background: M.color, border: `3px solid ${I}`, boxShadow: on ? `0 0 0 3px ${PP.paper}, 0 0 0 6px ${I}` : `0 4px 0 ${I}` }}>
              <M.Icon weight="bold" size={54} /><b className="font-display text-4xl">{M.name}</b><span className="font-semibold text-lg">{M.line}</span>{on && <Tick />}
            </span>); })}
        </div>
        {share && share !== 'none' && <div className="grid gap-2 justify-items-center"><b className="text-2xl">How do you share?</b><Pills opts={['Same device', 'Share a join code']} pick={share === 'code' ? 1 : 0} /></div>}
        <MainBtn>Next<ArrowRight weight="bold" size={20} /></MainBtn>
      </Sheet>
    </Menu>
  );
}
// ---------- 3. Options (brief) ----------
function Options({ rows }: { rows: [string, string[], number][] }) {
  return (
    <Menu band="squiggle">
      <Sheet w={660} tape={PP.aqua}>
        <Title size={46}>Options</Title>
        {rows.map(([l, o, p]) => <div key={l} className="grid gap-2 justify-items-center"><b className="text-2xl">{l}</b><Pills opts={o} pick={p} /></div>)}
        <MainBtn><Play weight="fill" size={20} />Play</MainBtn>
      </Sheet>
    </Menu>
  );
}
// ---------- Share by join code: this screen shows the code, the other shared screen types it ----------
function ShareCode() {
  return (
    <Menu>
      <Sheet w={600} tape={PP.butter}>
        <Title size={44}>Share a join code</Title>
        <span className="font-semibold text-2xl" style={{ color: PP.quiet }}>Open the Join page on the screen you want to play on and type:</span>
        <span className="px-6 py-2 rounded-2xl tracking-[0.2em]" style={{ ...GY, fontSize: 84, background: PP.blueCrystal, border: `3px solid ${I}` }}>472915</span>
        <span className="font-bold text-xl flex items-center gap-2"><ProjectorScreen weight="bold" size={26} />Same game, same question set, one shared screen</span>
      </Sheet>
    </Menu>
  );
}
function JoinCode({ name = 'Join the game', sub = 'Type the game code your teacher gave you.' }: { name?: string; sub?: string }) {
  return (
    <Menu tall>
      <Sheet w={660} tape={PP.aqua} pad={40}>
        <Title size={64}>{name}</Title>
        <span className="font-semibold text-2xl" style={{ color: PP.quiet }}>{sub}</span>
        <div className="flex gap-3">{['4', '7', '2', '9', '', ''].map((d, i) => <span key={i} className="w-[76px] h-[92px] rounded-2xl grid place-items-center" style={{ ...GY, fontSize: 56, background: i === 4 ? PP.blueCrystal : PP.paper, border: `${i === 4 ? 4 : 3}px solid ${I}` }}>{d}</span>)}</div>
        <div className="flex gap-3"><Second><SpeakerHigh weight="bold" size={22} />Hear my code</Second><MainBtn big>Go<ArrowRight weight="bold" size={24} /></MainBtn></div>
      </Sheet>
    </Menu>
  );
}
// ---------- Live: teacher setup, lobby, student name and wait ----------
function ClassHow() {
  return (
    <Menu>
      <Sheet w={760} tape={PP.butter}>
        <Title size={46}>How the class plays</Title>
        <div className="flex justify-center gap-5">
          {[['Together', 'Fill one sky as a class', PP.blueCrystal, true], ['Compete', 'A leaderboard of names and points', PP.blush, false]].map(([n, l, c, on]) => (
            <span key={n as string} className="relative w-[250px] p-4 rounded-[24px] grid justify-items-center gap-1" style={{ background: c as string, border: `3px solid ${I}`, boxShadow: on ? `0 0 0 3px ${PP.paper}, 0 0 0 6px ${I}` : `0 4px 0 ${I}` }}>
              <b className="font-display text-4xl">{n as string}</b><span className="font-semibold text-lg">{l as string}</span>{on && <Tick />}
            </span>
          ))}
        </div>
        <div className="grid gap-2 justify-items-center"><b className="text-2xl">The game ends</b><Pills opts={['When I stop it', 'After a number right', 'After some minutes']} pick={0} /></div>
        <MainBtn>Open the live lobby<ArrowRight weight="bold" size={20} /></MainBtn>
      </Sheet>
    </Menu>
  );
}
const NAMES = ['Ava', 'Leo', 'Mia', 'Noah', 'Zoe', 'Eli', 'Ivy', 'Max', 'Ruby', 'Sam', 'Lily', 'Owen'];
function Lobby() {
  return (
    <div className="w-full h-full relative" style={{ ...pat('confetti'), padding: 28 }}>
      <div className="h-full grid grid-cols-[1fr_1.25fr] gap-6">
        <div className="relative p-6 grid content-center justify-items-center gap-3 text-center" style={{ ...paper, borderRadius: 28 }}>
          <Tape color={PP.aqua} />
          <b className="text-lg uppercase tracking-wider" style={{ color: PP.quiet }}>Go to the Join page and type</b>
          <span className="tracking-widest px-4 py-2 rounded-2xl" style={{ ...GY, fontSize: 76, background: PP.blueCrystal, border: `3px solid ${I}` }}>472915</span>
          <span className="font-bold flex items-center gap-2"><DeviceTablet weight="bold" size={22} />Every student on their own device</span>
        </div>
        <div className="relative p-6 flex flex-col items-center gap-4 text-center" style={{ ...paper, borderRadius: 28 }}>
          <Tape color={PP.blush} />
          <Title size={44}>Lobby</Title>
          <span className="font-bold flex items-center gap-1.5"><UsersThree weight="bold" size={22} />12 here</span>
          <div className="flex flex-wrap justify-center gap-2 content-start flex-1">{NAMES.map((n, i) => <span key={n} className="px-3 py-1.5 rounded-full font-bold text-lg h-fit" style={{ background: [PP.gamify, PP.aqua, PP.blush, PP.butter][i % 4], border: `2.5px solid ${I}` }}>{n}</span>)}</div>
          <MainBtn><Play weight="fill" size={20} />Start</MainBtn>
        </div>
      </div>
    </div>
  );
}
function NameAndWait() {
  return (
    <Menu tall>
      <Sheet w={660} tape={PP.butter} pad={40}>
        <Title size={60}>Pick your game name</Title>
        <span className="px-6 py-3 rounded-2xl" style={{ ...GY, fontSize: 56, background: PP.butter, border: `3px solid ${I}` }}>Zippy Comet</span>
        <div className="flex gap-3"><Second><CrayonDie value={4} size={34} />Roll a new name</Second><MainBtn big>Play</MainBtn></div>
        <div className="w-full pt-5 grid justify-items-center gap-2" style={{ borderTop: `3px dashed ${PP.gamify}` }}>
          <b className="font-display text-3xl">You are in!</b>
          <span className="font-semibold text-xl flex items-center gap-2" style={{ color: PP.quiet }}><HourglassHigh weight="fill" size={24} />Wait for your teacher to start.</span>
        </div>
      </Sheet>
    </Menu>
  );
}
// ---------- Power-up moment (over the dimmed game) ----------
function PowerMoment({ game, id, name, job, picks }: { game: ReactNode; id: PowerId; name: string; job: string; picks?: string[] }) {
  return (
    <Dim over={
      <div className="relative">
        <Confetti marks={[['sparkle', PP.lemon, -44, -24, 34], ['star', PP.pink, 400, -20, 30], ['dot', PP.sky, -30, 230, 16], ['heart', PP.pink, 410, 250, 24]]} />
        <div className="w-[400px] p-6 grid justify-items-center gap-3 text-center" style={{ ...paper, borderRadius: 28, boxShadow: `0 0 0 8px ${PP.butter}, 0 0 0 11px ${I}, 0 12px 0 ${I}` }}>
          <div className="relative w-36 h-36 grid place-items-center"><BlobPatch color={PP.lavender} size={160} /><span className="relative"><CrayonPowerUp id={id} size={120} /></span></div>
          <Title size={48}>{name}</Title>
          <span className="font-bold text-xl">{job}</span>
          {picks ? <div className="flex flex-wrap justify-center gap-2">{picks.map((p, i) => <span key={p} className="px-4 py-2 rounded-full font-bold flex items-center gap-2" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}><Badge t={TEAMS[[0, 2, 3][i] ?? 0]} size={24} />{p}</span>)}</div>
            : <MainBtn><Lightning weight="fill" size={20} />Use it</MainBtn>}
        </div>
      </div>
    }>{game}</Dim>
  );
}
// ---------- Results box (see-through over the game) ----------
function Results({ game, title, winner, stats, missed = 2 }: { game: ReactNode; title: string; winner: ReactNode; stats: string[]; missed?: number }) {
  return (
    <Dim over={
      <div className="relative w-[560px]">
        <Confetti marks={[['sparkle', PP.lemon, -40, 10, 36], ['star', PP.pink, 560, -10, 30], ['heart', PP.pink, -30, 300, 24], ['sparkle', PP.paper, 570, 280, 28], ['dot', PP.sky, 530, 150, 16]]} />
        <Sheet w={560} tape={PP.pink} layer={PP.butter}>
          <Title size={54}>{title}</Title>
          <div className="relative w-36 h-36 grid place-items-center"><BlobPatch color={PP.butter} size={170} /><span className="relative">{winner}</span></div>
          <div className="flex flex-wrap justify-center gap-2">{stats.map((s2) => <span key={s2} className="px-3 py-1 rounded-full font-bold" style={{ background: PP.blueCrystal, border: `2.5px solid ${I}` }}>{s2}</span>)}</div>
          <div className="flex flex-wrap justify-center gap-3"><MainBtn><ArrowsClockwise weight="bold" size={20} />Play again</MainBtn><Second>New game</Second><Second>Review {missed} missed</Second></div>
        </Sheet>
      </div>
    }>{game}</Dim>
  );
}

// ---------- the view list for each game ----------
type View = { name: string; device: 'laptop' | 'tablet'; node: ReactNode; note: string };
const ALL_VIEWS: Record<string, { ways: string; views: View[] }> = {
  'game-show': {
    ways: 'Share (same device, or a join code that opens it on another shared screen) and Solo against the computer.',
    views: [
      { name: 'Welcome', device: 'laptop', node: <Welcome name="Game Show" art={<CrayonPowerUp id="treasure-chest" size={120} />} steps={['Answer the question', 'Pick a surprise card', 'Most points wins']} />, note: 'Centered: title, picture, three steps, one purple Start.' },
      { name: 'How will you play?', device: 'laptop', node: <Ways ways={['share', 'solo']} pick="share" share="code" />, note: 'Only Share and Solo; Share asks same device or join code.' },
      { name: 'Options', device: 'laptop', node: <Options rows={[['Board', ['Surprise cards', 'Category grid'], 0], ['Cards', ['4 x 3', '4 x 4', '5 x 4', '5 x 5', '6 x 6'], 0], ['Tries', ['1', '3', 'Until right'], 0]]} />, note: 'One rule per row, picks in mint.' },
      { name: 'Share: join code', device: 'laptop', node: <ShareCode />, note: 'Teacher laptop shows the code.' },
      { name: 'Share: other screen joins', device: 'tablet', node: <JoinCode sub="Type the code to open the game on this screen." />, note: 'The shared screen types it and the game opens.' },
      { name: 'Share: in play (teams)', device: 'laptop', node: <GameShowLaptop />, note: 'The in-play mockup above.' },
      { name: 'Solo: you vs computer', device: 'laptop', node: <GameShowLaptop vs />, note: 'Two sides, You and Computer; same board.' },
      { name: 'Power-up: Swap Spinner', device: 'laptop', node: <PowerMoment game={<GameShowLaptop />} id="swap" name="Swap Spinner" job="Trade your whole score with a team." picks={['Team Purple', 'Team Pink', 'Team Lemon']} />, note: 'Picks a team with shape badges, never color alone.' },
      { name: 'Results', device: 'laptop', node: <Results game={<GameShowLaptop />} title="Team Sky wins!" winner={<Badge t={TEAMS[1]} size={110} />} stats={['160 points', '7 cards', '1 row filled']} />, note: 'See-through box over the board.' },
    ],
  },
  'castle-quest': {
    ways: 'Share (same device or a join code) and Solo against the computer.',
    views: [
      { name: 'Welcome', device: 'laptop', node: <Welcome name="Board Game" art={<CrayonDie value={5} size={120} />} steps={['Answer right to roll', 'Move that many squares', 'First to the finish wins']} />, note: 'Her one-side die is the picture.' },
      { name: 'How will you play?', device: 'laptop', node: <Ways ways={['share', 'solo']} pick="share" share="here" />, note: 'Share picked, same device.' },
      { name: 'Options', device: 'laptop', node: <Options rows={[['Trail', ['Short', 'Medium', 'Long', 'Extra long'], 1], ['Power-ups', ['On', 'Off'], 0]]} />, note: 'Trail length in words, not square counts.' },
      { name: 'Share: join code', device: 'laptop', node: <ShareCode />, note: 'Same as every Share game.' },
      { name: 'Share: other screen joins', device: 'tablet', node: <JoinCode sub="Type the code to open the game on this screen." />, note: 'Opens the board on the shared screen.' },
      { name: 'Share: in play', device: 'laptop', node: <BoardLaptop />, note: 'The in-play mockup above.' },
      { name: 'Solo: you vs computer', device: 'laptop', node: <BoardLaptop vs />, note: 'Two pawns; your turn card says Your turn.' },
      { name: 'Power-up: Tornado', device: 'laptop', node: <PowerMoment game={<BoardLaptop />} id="tornado" name="Tornado" job="Whoosh! Every player lands on a new square." />, note: 'Found on a hidden square.' },
      { name: 'Results', device: 'laptop', node: <Results game={<BoardLaptop />} title="Team Sky wins!" winner={<CrayonPawn color={PP.sky} size={110} />} stats={['First to the finish', '14 turns']} />, note: 'The winner\'s pawn on the stage.' },
    ],
  },
  'match-three': {
    ways: 'Solo only, so there is no How will you play? page.',
    views: [
      { name: 'Welcome', device: 'laptop', node: <Welcome name="Match Three" art={<span className="flex gap-1"><Gem k={2} s={52} /><Gem k={2} s={52} /><Gem k={2} s={52} /></span>} steps={['Swap two pieces', 'Make a row of 3', 'Answer to get more moves']} />, note: 'Three matching hearts show the goal.' },
      { name: 'Options', device: 'laptop', node: <Options rows={[['Rounds', ['1', '3', '5', '10'], 1], ['Moves each round', ['3', '5', '8'], 0], ['Board', ['6 x 6', '7 x 7', '8 x 8'], 1]]} />, note: 'Short words, big pills.' },
      { name: 'Solo: in play (laptop)', device: 'laptop', node: <MatchThreeLaptop />, note: 'No player icon.' },
      { name: 'Solo: in play (iPad)', device: 'tablet', node: <MatchThreeTablet />, note: 'Student device.' },
      { name: 'Power-up: Fireball', device: 'laptop', node: <PowerMoment game={<MatchThreeLaptop />} id="lightning" name="Fireball" job="Pops every piece of one kind." />, note: 'Kit has no fireball yet; lightning stands in.' },
      { name: 'Results', device: 'tablet', node: <Results game={<MatchThreeTablet />} title="You got 2 stars!" winner={<StarGoal got={2} />} stats={['260 points', '9 matches']} />, note: 'Stars, not a rank.' },
    ],
  },
  'four-in-a-row': {
    ways: 'Share (two players, one device) and Solo against the computer. No join code in this game today.',
    views: [
      { name: 'Welcome', device: 'laptop', node: <Welcome name="Four in a Row" art={<span className="flex"><Disc p={1} s={60} /><Disc p={2} s={60} /><Disc p={1} s={60} /></span>} steps={['Answer the question', 'Drop your piece', 'Four in a line wins']} />, note: 'Both pieces with their marks.' },
      { name: 'How will you play?', device: 'laptop', node: <Ways ways={['share', 'solo']} pick="solo" share="none" />, note: 'Solo means you vs the computer here.' },
      { name: 'Options', device: 'laptop', node: <Options rows={[['Computer', ['Easy', 'Medium', 'Hard'], 1], ['Power-ups', ['On', 'Off'], 0]]} />, note: 'Computer level only for Solo.' },
      { name: 'Share: in play', device: 'laptop', node: <FourLaptop />, note: 'The in-play mockup above.' },
      { name: 'Solo: you vs computer', device: 'laptop', node: <FourLaptop vs />, note: 'Your piece waits over its column.' },
      { name: 'Power-up: Pop Out', device: 'laptop', node: <PowerMoment game={<FourLaptop vs />} id="swap" name="Pop Out" job="Pull out a bottom piece; the rest fall down." />, note: 'Kit has no key art; swap stands in.' },
      { name: 'Results', device: 'laptop', node: <Results game={<FourLaptop />} title="Leo wins!" winner={<Disc p={2} s={110} />} stats={['Four in a row', '11 drops']} />, note: 'The winning piece on the stage.' },
    ],
  },
  'bubble-pop': {
    ways: 'Solo only, so there is no How will you play? page.',
    views: [
      { name: 'Welcome', device: 'laptop', node: <Welcome name="Bubble Pop" art={<span className="flex gap-1"><Bubble k={1} s={56} /><Bubble k={1} s={56} /><Bubble k={1} s={56} /></span>} steps={['Answer to load bubbles', 'Aim and shoot', 'Match 3 to pop']} />, note: 'Three matching bubbles show the goal.' },
      { name: 'Options', device: 'laptop', node: <Options rows={[['Question breaks', ['2', '4', '6', '10'], 1], ['Bubbles each break', ['3', '5'], 0]]} />, note: 'Same panel as every game.' },
      { name: 'Solo: in play (laptop)', device: 'laptop', node: <BubbleLaptop />, note: 'No player icon.' },
      { name: 'Solo: in play (iPad)', device: 'tablet', node: <BubbleTablet />, note: 'Student device.' },
      { name: 'Power-up: Mystery Box', device: 'laptop', node: <PowerMoment game={<BubbleLaptop />} id="mystery-box" name="Mystery Box" job="A surprise: 10 to 100 points!" />, note: 'Opens with a bob and a pop.' },
      { name: 'Results', device: 'tablet', node: <Results game={<BubbleTablet />} title="340 points!" winner={<Bubble k={4} s={110} />} stats={['31 bubbles popped', 'Best combo x4']} />, note: 'Your points, not a rank.' },
    ],
  },
  bowling: {
    ways: 'Share (same device or a join code) and Solo, alone or against the computer.',
    views: [
      { name: 'Welcome', device: 'laptop', node: <Welcome name="Bowling" art={<Ball c={PP.pink} s={120} />} steps={['Answer right to roll', 'Aim and add spin', 'Most pins wins']} />, note: 'Your ball is your icon.' },
      { name: 'How will you play?', device: 'laptop', node: <Ways ways={['share', 'solo']} pick="share" share="here" />, note: 'Share and Solo.' },
      { name: 'Options', device: 'laptop', node: <Options rows={[['Frames', ['1', '3', '5', '10'], 1], ['Players', ['Teams', 'Each player'], 1]]} />, note: 'Frames in plain numbers.' },
      { name: 'Share: join code', device: 'laptop', node: <ShareCode />, note: 'Opens the lane on the shared screen.' },
      { name: 'Share: in play', device: 'laptop', node: <BowlingLaptop />, note: 'The in-play mockup above.' },
      { name: 'Solo: in play', device: 'tablet', node: <BowlingTablet />, note: 'Same lane on a student iPad.' },
      { name: 'Solo: alone', device: 'laptop', node: <BowlingLaptop solo />, note: 'One row on the frame board, no turn pill.' },
      { name: 'Power-up: Bumper Rails', device: 'laptop', node: <PowerMoment game={<BowlingLaptop />} id="shield" name="Bumper Rails" job="No gutter ball on your next roll." />, note: 'Shield art carries the job.' },
      { name: 'Results', device: 'laptop', node: <Results game={<BowlingLaptop />} title="Ava wins!" winner={<Ball c={PP.periwinkle} s={110} />} stats={['46 pins', '1 strike', '1 spare']} />, note: 'The winning ball on the stage.' },
    ],
  },
  'star-quiz': {
    ways: 'Live (class screen plus each student\'s device) and Solo. No power-ups in this game.',
    views: [
      { name: 'Welcome', device: 'laptop', node: <Welcome name="Question Tracker" art={<Doodle kind="star" color={PP.lemon} size={120} />} steps={['Answer a question', 'Right adds a star', 'Fill the whole sky']} />, note: 'One star says it all.' },
      { name: 'How will you play?', device: 'laptop', node: <Ways ways={['live', 'solo']} pick="live" />, note: 'Live and Solo only.' },
      { name: 'Teacher: how the class plays', device: 'laptop', node: <ClassHow />, note: 'Together or Compete, and when it ends.' },
      { name: 'Class screen: lobby', device: 'laptop', node: <Lobby />, note: 'Code huge, names pop in, Start.' },
      { name: 'Student: join', device: 'tablet', node: <JoinCode />, note: 'One box per digit, Hear my code.' },
      { name: 'Student: name and wait', device: 'tablet', node: <NameAndWait />, note: 'Roll a name, then wait.' },
      { name: 'Class screen: in play', device: 'laptop', node: <ClassScreen />, note: 'The shared sky and class goal.' },
      { name: 'Student: in play', device: 'tablet', node: <StudentDevice />, note: 'Question left-aligned in its card.' },
      { name: 'Solo: in play', device: 'tablet', node: <StudentDevice solo />, note: 'My sky, no class count.' },
      { name: 'Class screen: results', device: 'laptop', node: <Results game={<ClassScreen />} title="We filled the sky!" winner={<Doodle kind="star" color={PP.lemon} size={110} />} stats={['30 stars', '12 players', '9 gold stars']} missed={4} />, note: 'One class win, no ranks in Together.' },
    ],
  },
};

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
      'New: a sky blue crayon frame on legs with paper holes, standing on the pastel squiggle ground; Gamify purple pieces with a dot and lemon pieces with a star; the next piece waits over its column; Leo\'s win line gets a lemon band and a burst.',
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
      'Why: one shared goal builds relatedness and lowers social comparison (self-determination theory); empty stars are dashed outlines so the goal is visible from the back row (goal-gradient effect); answers are about 116px tall for small fingers (WCAG 2.5.5).',
      'Pieces (theme template): Background 1600 x 1000 (the scene that fills), six Items 256 x 256 (a star, a fish...), Cover 600 x 600, Title 1200 x 360. No power-ups in this game today.',
    ],
  },
];

function ViewStrip({ id }: { id: string }) {
  const v = ALL_VIEWS[id];
  if (!v) return null;
  return (
    <div className="grid gap-3">
      <p className="text-sm font-semibold"><b>Every view.</b> Ways it plays: {v.ways}</p>
      <div className="flex flex-wrap gap-5 items-start">
        {v.views.map((x, n) => (
          <figure key={x.name} className={`m-0 grid gap-1.5 content-start ${x.device === 'laptop' ? 'flex-1 basis-[22rem] min-w-[18rem] max-w-[27rem]' : 'w-[12rem]'}`}>
            <figcaption className="font-heading text-sm">{n + 1}. {x.name} <span className="font-semibold text-muted">({x.device === 'laptop' ? 'laptop or big screen' : 'iPad'})</span></figcaption>
            {x.device === 'laptop' ? <Laptop>{x.node}</Laptop> : <Tablet>{x.node}</Tablet>}
            <span className="text-xs font-semibold text-muted">{x.note}</span>
          </figure>
        ))}
      </div>
    </div>
  );
}

export default function GameMockups() {
  return (
    <section className="grid gap-8">
      <div className="grid gap-1">
        <h2 className="font-heading text-2xl">Game mockups <span className="text-base align-middle px-2 py-0.5 rounded-full border-2 border-black bg-[#fdfd94]">Proposal</span></h2>
        <p className="text-sm font-semibold text-muted max-w-prose">The seven live games in the improved universal Classic theme, each with every view it really has: welcome, ways to play, options, join code or lobby, class screen, student device, Share and Solo play, a power-up and results. Menus are centered; question text stays left in its card. Preview only: no game changes until you approve.</p>
      </div>
      <nav aria-label="Jump to a game" className="flex flex-wrap gap-2">
        {GAMES.map((g) => <a key={g.id} href={`#gm-${g.id}`} className="px-3 py-1.5 rounded-full font-bold text-sm border-2 border-black bg-[#fffaf0] hover:bg-[#fdfd94]">{g.name.split(' (')[0]} <span className="text-muted">{(ALL_VIEWS[g.id]?.views.length ?? 0)} views</span></a>)}
      </nav>
      {GAMES.map((g) => (
        <article key={g.id} id={`gm-${g.id}`} className="grid gap-4 scroll-mt-24 pt-6 border-t-2 border-black/20">
          <h3 className="font-heading text-xl">{g.name}</h3>
          <div className="grid gap-6 lg:grid-cols-[1fr_17rem] items-start">
            <figure className="m-0 grid gap-2"><Laptop>{g.laptop}</Laptop><figcaption className="text-sm font-bold text-muted">Laptop 16:10, in play</figcaption></figure>
            <figure className="m-0 grid gap-2"><Tablet>{g.tablet}</Tablet><figcaption className="text-sm font-bold text-muted text-center">iPad portrait</figcaption></figure>
          </div>
          <ul className="grid gap-1.5 text-sm font-semibold max-w-[70rem] list-disc pl-5">
            {g.lines.map((l) => <li key={l}>{l}</li>)}
          </ul>
          <ViewStrip id={g.id} />
        </article>
      ))}
    </section>
  );
}
