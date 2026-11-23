import type { CSSProperties, ReactNode } from 'react';
import { ArrowsClockwise, Check, CornersOut, FlagCheckered, GearSix, HourglassHigh, Lightning, Play, UsersThree, X } from '@phosphor-icons/react';
import { PP } from './PaletteProposal';
import { PATTERNS } from './PatternProposal';
import { BlobPatch, CrayonDie, CrayonPawn, CrayonPowerUp, Doodle, type DoodleKind, type PowerId } from './CrayonKit';
import { Badge, Laptop, MainBtn, ParkBack, StudioBack, Tablet, TEAMS, TURN_GLOW, TurnGlow } from './mockKit';
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
    <div className="inline-flex items-center gap-3 pl-2 pr-5 py-1.5 rounded-full font-display text-2xl font-bold" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: `${TURN_GLOW}, 0 4px 0 ${I}` }}>
      <Badge t={t} size={34} />{text}
    </div>
  );
}
function Score({ t, pts, now, held, compact }: { t: Team; pts: number; now?: boolean; held?: { id: PowerId; name: string }; compact?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${compact ? 'px-2.5 py-1.5' : 'px-3 py-2'} rounded-2xl`} style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: now ? `${TURN_GLOW}, 0 4px 0 ${I}` : `0 3px 0 ${I}` }}>
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

function GameShowLaptop({ vs, noPop }: { vs?: boolean; noPop?: boolean }) {
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
      {!noPop && <div className="absolute left-[96px] top-[118px] w-[600px] h-[420px]"><GSPop scale={0.82} who={vs ? 'you' : 'Team Sky'} /></div>}
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
        return <span key={j} className="absolute z-[2]" style={{ left: pos(p.at).left + s * 0.14 + same * s * 0.2, top: pos(p.at).top - s * 0.28, filter: p.t === 1 && celebrate ? 'drop-shadow(0 0 6px #fabe37) drop-shadow(0 0 14px rgba(250,190,55,0.55))' : undefined }}><CrayonPawn color={TEAMS[p.t].color} size={s * 0.72} /></span>;
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
    <div key={t.name} className={`flex items-center gap-2 ${compact ? 'px-2 py-1' : 'px-2.5 py-1.5'} rounded-2xl`} style={{ background: PP.paper, border: `2.5px solid ${I}`, boxShadow: i === now ? `${TURN_GLOW}, 0 3px 0 ${I}` : `0 2px 0 ${I}` }}>
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
      {icon}<span className="grid leading-none"><span className="text-[13px] font-bold" style={{ color: PP.quiet }}>{label}</span><b className="font-display text-2xl tabular-nums">{value}</b></span>
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
    <div className="p-3 grid justify-items-center gap-2 text-center w-full" style={{ ...paper, boxShadow: now ? `${TURN_GLOW}, 0 4px 0 ${I}` : paper.boxShadow }}>
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
        <span className="absolute grid justify-items-center" style={{ left: w / 2 + s * 1.8, top: h - 24 - s * 1.8 }}><b className="text-[13px]" style={{ color: PP.quiet }}>Next</b><Bubble k={3} s={s} /></span>
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
// The real game: answer right, aim, add spin and roll at ten pins; a standard
// ten-frame score sheet (teacher, 2026-11-23: "show bowling as regular format
// socreboard not rounds"); each player's ball is their icon. Original art: a
// one-point perspective lane seen from behind the ball, boards narrowing to a
// full ten-pin triangle, a gutter each side, the ball and a dotted aim arrow.
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
const PIN_PATH = 'M32 6 C44 6 46 24 42 40 C40 50 38 56 44 72 C56 104 60 140 54 172 C52 186 44 194 32 194 C20 194 12 186 10 172 C4 140 8 104 20 72 C26 56 24 50 22 40 C18 24 20 6 32 6 Z';
function PinG({ x, y, h }: { x: number; y: number; h: number }) {
  const k = h / 200, kx = k * 1.45; // chunky crayon pins
  return (
    <g transform={`translate(${x - 32 * kx} ${y - 196 * k}) scale(${kx} ${k})`}>
      <ellipse cx="32" cy="196" rx="30" ry="8" fill={I} opacity="0.25" />
      <path d={PIN_PATH} fill={PP.paper} stroke={I} strokeWidth={6 / Math.max(0.35, k)} strokeLinejoin="round" />
      <path d="M22 58 H42 M20 70 H44" stroke={PP.pink} strokeWidth="9" strokeLinecap="round" />
    </g>
  );
}
// Rows from the back (4) to the head pin (1); x in lane widths (12 inch spacing on a 41.5 inch lane).
const PIN_ROWS: [number, number[]][] = [[0.1, [-0.84, -0.28, 0.28, 0.84]], [0.145, [-0.56, 0, 0.56]], [0.19, [-0.28, 0.28]], [0.235, [0]]];
function AlleyStage({ w, h, top, wide, children }: { w: number; h: number; top: number; wide?: boolean; children?: ReactNode }) {
  const cx = w / 2, tH = w * (wide ? 0.15 : 0.1), bH = w * (wide ? 0.36 : 0.27), g0 = w * 0.026, g1 = w * 0.06;
  const at = (d: number) => ({ y: top + d * (h - top), hw: tH + d * (bH - tH) });
  const X = (u: number, d: number) => cx + u * at(d).hw;
  const poly = (u0: number, u1: number, e0 = 0, e1 = 0) => `M${X(u0, 0) - e0} ${top} L${X(u1, 0) + e0} ${top} L${X(u1, 1) + e1} ${h} L${X(u0, 1) - e1} ${h} Z`;
  const ball = at(0.8), ballS = ball.hw * 0.5, head = at(0.235);
  return (
    <div className="w-full h-full relative overflow-hidden" style={{ background: PP.grape }}>
      <div className="absolute inset-x-0 top-0" style={{ height: top, ...pat('cutpaper') }} />
      <svg className="absolute inset-0" width={w} height={h} aria-hidden="true">
        {/* approach floor each side of the lane */}
        <path d={`M0 ${top} L${w} ${top} L${w} ${h} L0 ${h} Z`} fill={PP.gamify} />
        {Array.from({ length: 6 }, (_, i) => <circle key={i} cx={i % 2 ? w * 0.92 : w * 0.08} cy={top + (h - top) * (0.2 + i * 0.13)} r={w * 0.012} fill={PP.lavender} />)}
        {/* gutters, then the lane */}
        <path d={`M${X(-1, 0) - g0} ${top} L${X(-1, 0)} ${top} L${X(-1, 1)} ${h} L${X(-1, 1) - g1} ${h} Z`} fill={PP.lavender} stroke={I} strokeWidth="4" strokeLinejoin="round" />
        <path d={`M${X(1, 0)} ${top} L${X(1, 0) + g0} ${top} L${X(1, 1) + g1} ${h} L${X(1, 1)} ${h} Z`} fill={PP.lavender} stroke={I} strokeWidth="4" strokeLinejoin="round" />
        <path d={poly(-1, 1)} fill={PP.peach} stroke={I} strokeWidth="4" strokeLinejoin="round" />
        {[-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75].map((u) => <path key={u} d={`M${X(u, 0)} ${top} L${X(u, 1)} ${h}`} stroke={PP.orange} strokeWidth="2" opacity="0.55" />)}
        {/* aim arrows in a V and a row of dots, like real lane marks, drawn our way */}
        {[-0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6].map((u) => { const d = 0.5 + Math.abs(u) * 0.14; const p = at(d); const x = cx + u * p.hw, s = p.hw * 0.06; return <path key={u} d={`M${x} ${p.y - s * 1.6} L${x + s} ${p.y + s} L${x - s} ${p.y + s} Z`} fill={PP.orange} stroke={I} strokeWidth="2" strokeLinejoin="round" />; })}
        {[-0.5, -0.25, 0, 0.25, 0.5].map((u) => { const p = at(0.9); return <circle key={u} cx={cx + u * p.hw} cy={p.y} r={p.hw * 0.025} fill={PP.orange} stroke={I} strokeWidth="1.5" />; })}
        <path d={`M${X(-1, 0.95)} ${at(0.95).y} L${X(1, 0.95)} ${at(0.95).y}`} stroke={I} strokeWidth="4" strokeLinecap="round" />
        {/* the lemon rail and the pin deck */}
        <rect x="-4" y={top - 10} width={w + 8} height="14" fill={PP.lemon} stroke={I} strokeWidth="3.5" />
        {PIN_ROWS.map(([d, us]) => { const p = at(d); return us.map((u) => <PinG key={`${d}${u}`} x={cx + u * p.hw} y={p.y} h={p.hw * 0.56} />); })}
        {/* the aim arrow, from the ball to the head pin */}
        <path d={`M${cx + ballS * 0.1} ${ball.y - ballS * 0.6} C${cx + ballS * 0.5} ${(ball.y + head.y) / 2 + 30} ${cx + ballS * 0.35} ${head.y + 60} ${cx + 4} ${head.y + 16}`} fill="none" stroke={I} strokeWidth="5" strokeDasharray="2 12" strokeLinecap="round" />
        <path d={`M${cx - 10} ${head.y + 30} L${cx + 4} ${head.y + 12} L${cx + 16} ${head.y + 32}`} fill="none" stroke={I} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="absolute" style={{ left: cx - ballS / 2, top: ball.y - ballS / 2 }}><Ball c={BALLS[1]} s={ballS} /></span>
      {children}
    </div>
  );
}
// The ten-frame sheet: two roll boxes in frames 1 to 9, three in the 10th,
// X for a strike, / for a spare, - for a miss, the running total under them.
type BowlRow = { name: string; ball: string; f: string[][]; t: (number | null)[] };
const BOWL: BowlRow[] = [
  { name: 'Ava', ball: BALLS[0], f: [['', 'X'], ['7', '/'], ['9', '-'], ['8', '1']], t: [20, 39, 48, 57] },
  { name: 'Mia', ball: BALLS[1], f: [['8', '1'], ['', 'X'], ['6', '2']], t: [9, 27, 35] },
  { name: 'Leo', ball: BALLS[2], f: [['6', '2'], ['5', '3'], ['', 'X']], t: [8, 16, null] },
];
const BOWL_SOLO: BowlRow[] = [{ name: 'You', ball: BALLS[0], f: [['', 'X'], ['9', '/'], ['7', '2'], ['8', '-']], t: [20, 37, 46, 54] }];
function FrameSheet({ rows, now, frame, cell }: { rows: BowlRow[]; now: number; frame: number; cell: number }) {
  const nameW = cell * 2.1, box = cell * 0.4, row = cell * 0.84;
  const edge = `2.5px solid ${I}`;
  const cols = `${nameW}px repeat(9, ${cell}px) ${cell * 1.4}px ${cell * 1.15}px`;
  return (
    <div className="grid" style={{ gridTemplateColumns: cols, border: `3px solid ${I}`, borderRadius: 16, overflow: 'hidden', boxShadow: `0 4px 0 ${I}`, background: PP.paper }}>
      <span style={{ borderBottom: edge }} />
      {Array.from({ length: 10 }, (_, i) => <b key={i} className="grid place-items-center tabular-nums" style={{ fontSize: cell * 0.27, height: cell * 0.42, borderLeft: edge, borderBottom: edge, background: i === frame - 1 ? PP.butter : PP.cream }}>{i + 1}</b>)}
      <b className="grid place-items-center" style={{ fontSize: cell * 0.24, borderLeft: edge, borderBottom: edge, background: PP.cream }}>Total</b>
      {rows.map((r, ri) => (
        <div key={r.name} className="contents">
          <span className="flex items-center gap-2 px-2 min-w-0" style={{ height: row, borderTop: ri ? edge : undefined, background: ri === now ? PP.butter : undefined, boxShadow: ri === now ? `inset 0 0 0 4px ${PP.lemon}` : undefined }}>
            <Ball c={r.ball} s={cell * 0.5} /><b className="truncate" style={{ fontSize: cell * 0.3 }}>{r.name}</b>
          </span>
          {Array.from({ length: 10 }, (_, fi) => {
            const rolls = r.f[fi] ?? (fi === 9 ? ['', '', ''] : ['', '']);
            const marks = fi === 9 && rolls.length < 3 ? [...rolls, ''] : rolls;
            return (
              <span key={fi} className="grid" style={{ gridTemplateRows: `${box}px 1fr`, height: row, borderLeft: edge, borderTop: ri ? edge : undefined, background: fi === frame - 1 && ri === now ? PP.butter : undefined }}>
                <span className="flex justify-end">{marks.map((m, mi) => <span key={mi} className="grid place-items-center font-display font-bold" style={{ width: box, height: box, fontSize: box * 0.72, borderLeft: mi || fi === 9 ? edge : undefined, borderBottom: edge, ...(mi === 0 && fi < 9 ? { borderLeft: edge } : {}) }}>{m}</span>)}</span>
                <span className="grid place-items-center font-display tabular-nums" style={{ fontSize: cell * 0.32 }}>{r.t[fi] ?? ''}</span>
              </span>
            );
          })}
          <span className="grid place-items-center tabular-nums" style={{ ...GY, fontSize: cell * 0.42, borderLeft: edge, borderTop: ri ? edge : undefined }}>{[...r.t].reverse().find((x) => x != null) ?? 0}</span>
        </div>
      ))}
    </div>
  );
}
// The universal top tracker for bowling: whose roll left, Frame X of 10 middle, icon buttons right.
function FrameTracker({ frame, solo, k = 1 }: { frame: number; solo?: boolean; k?: number }) {
  return (
    <div className="absolute inset-x-0 flex items-center justify-between z-20" style={{ top: 14 * k, padding: `0 ${20 * k}px` }}>
      {solo
        ? <span className="inline-flex items-baseline gap-2 px-5 py-1 rounded-full" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}` }}><b style={{ ...GY, fontSize: 36 * k }} className="tabular-nums">54</b><b style={{ fontSize: 16 * k, color: PP.quiet }}>pins</b></span>
        : <RollPill />}
      <span className="absolute left-1/2 -translate-x-1/2 px-6 rounded-full grid place-items-center font-bold whitespace-nowrap" style={{ height: 50 * k, fontSize: 22 * k, background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}` }}>Frame {frame} of 10</span>
      <span className="flex gap-2">{[GearSix, CornersOut, X].map((Icon, i) => <span key={i} className="rounded-full grid place-items-center" style={{ width: 44 * k, height: 44 * k, background: PP.paper, border: `2.5px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}><Icon weight="bold" size={20 * k} /></span>)}</span>
    </div>
  );
}
const BW_HELD: { id: PowerId; name: string }[] = [{ id: 'magnet', name: 'Pin Magnet' }, { id: 'shield', name: 'Bumper Rails' }];
function RollPill({ who = 'Mia rolls!' }: { who?: string }) {
  return <div className="inline-flex items-center gap-3 pl-2 pr-5 py-1.5 rounded-full font-display text-2xl font-bold justify-self-start" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: `${TURN_GLOW}, 0 4px 0 ${I}` }}><Ball c={BALLS[1]} s={36} />{who}</div>;
}
function BowlingLaptop({ solo }: { solo?: boolean }) {
  return (
    <AlleyStage w={1000} h={625} top={290}>
      <FrameTracker frame={solo ? 5 : 4} solo={solo} />
      <div className="absolute left-1/2 -translate-x-1/2" style={{ top: solo ? 104 : 76 }}><FrameSheet rows={solo ? BOWL_SOLO : BOWL} now={solo ? 0 : 1} frame={solo ? 5 : 4} cell={52} /></div>
      <div className="absolute right-[18px] top-[360px]"><HeldTray items={BW_HELD} label={solo ? 'Power-ups' : "Mia's"} /></div>
    </AlleyStage>
  );
}
function BowlingTablet() {
  return (
    <AlleyStage w={820} h={1180} top={420} wide>
      <FrameTracker frame={4} k={1.15} />
      <div className="absolute left-1/2 -translate-x-1/2 top-[96px]"><FrameSheet rows={BOWL} now={1} frame={4} cell={53} /></div>
      <div className="absolute left-1/2 -translate-x-1/2 top-[316px]"><HeldTray items={BW_HELD} label="Mia's power-ups" row /></div>
    </AlleyStage>
  );
}

// ================= Question Tracker (Live, Solo) =================
// The real game (src/games/practice/Sky.tsx): every right answer adds an item
// to the open sky around the question box, in many sizes, each slowly turned,
// until the scene is full; first-try streaks make glowing combo stars. Classic
// items are stars; themes swap in their own six items (pets, fish...). The
// goal shows on a progress bar, never as empty placeholder shapes.
const SKY_N = 30, SKY_GOT = 18;
type Box = [number, number, number, number]; // l, t, r, b in px
function skyItems(w: number, h: number, count: number, holes: Box[], seed = 11) {
  let s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const cols = Math.round(w / 92), rows = Math.round((h * 0.7) / 92);
  const cw = w / cols, ch = (h * 0.7) / rows;
  const out: { x: number; y: number; size: number; rot: number }[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const size = 34 + rnd() * 40, x = c * cw + cw / 2 + (rnd() - 0.5) * cw * 0.5, y = 20 + r * ch + ch / 2 + (rnd() - 0.5) * ch * 0.5, rot = (rnd() - 0.5) * 50;
    if (!holes.some(([l, t, rr, b]) => x + size / 2 > l && x - size / 2 < rr && y + size / 2 > t && y - size / 2 < b)) out.push({ x, y, size, rot });
  }
  return out.map((p) => [rnd(), p] as const).sort((a, b) => a[0] - b[0]).slice(0, count).map(([, p]) => p);
}
function Cloud({ x, y, s }: { x: number; y: number; s: number }) {
  return <path d={`M${x} ${y} c${-8 * s} 0 ${-12 * s} ${-10 * s} ${-4 * s} ${-14 * s} c${2 * s} ${-12 * s} ${18 * s} ${-14 * s} ${22 * s} ${-4 * s} c${8 * s} ${-8 * s} ${22 * s} ${-2 * s} ${20 * s} ${8 * s} c${8 * s} ${2 * s} ${8 * s} ${10 * s} 0 ${10 * s} Z`} fill={PP.paper} stroke={I} strokeWidth="3.5" strokeLinejoin="round" />;
}
// The whole stage is the scene: a big sky over a mint hill, flowers and trees, the stars it has earned.
function SkyScene({ w, h, got = SKY_GOT, holes = [], children }: { w: number; h: number; got?: number; holes?: Box[]; children?: ReactNode }) {
  const hill = h * 0.78;
  const items = skyItems(w, h, got, holes);
  return (
    <div className="w-full h-full relative overflow-hidden">
      <svg className="absolute inset-0" width={w} height={h} aria-hidden="true">
        <rect width={w} height={h} fill={PP.blueCrystal} />
        <path d={`M${w * 0.06} ${hill} A${w * 0.44} ${w * 0.44} 0 0 1 ${w * 0.94} ${hill}`} fill="none" stroke={PP.paper} strokeWidth={w * 0.03} opacity="0.9" />
        <path d={`M${w * 0.1} ${hill} A${w * 0.4} ${w * 0.4} 0 0 1 ${w * 0.9} ${hill}`} fill="none" stroke={PP.lavender} strokeWidth={w * 0.022} opacity="0.85" />
        <Cloud x={w * 0.5} y={h * 0.3} s={w / 620} /><Cloud x={w * 0.62} y={h * 0.1} s={w / 700} /><Cloud x={w * 0.4} y={h * 0.5} s={w / 820} />
        <path d={`M0 ${hill} C${w * 0.25} ${hill - h * 0.08} ${w * 0.5} ${hill - h * 0.02} ${w * 0.7} ${hill - h * 0.06} C${w * 0.85} ${hill - h * 0.1} ${w * 0.95} ${hill - h * 0.04} ${w} ${hill - h * 0.05} L${w} ${h} L0 ${h} Z`} fill={PP.mint} stroke={I} strokeWidth="4" strokeLinejoin="round" />
        <path d={`M0 ${h * 0.9} C${w * 0.3} ${h * 0.84} ${w * 0.65} ${h * 0.95} ${w} ${h * 0.87} L${w} ${h} L0 ${h} Z`} fill={PP.kelly} stroke={I} strokeWidth="4" strokeLinejoin="round" />
        {[0.08, 0.86].map((f, i) => { const x = w * f, y = hill - h * (i ? 0.05 : 0.07), r = Math.min(w, h) * 0.05; return <g key={f}><rect x={x - 6} y={y - 6} width="12" height={r * 1.4} rx="5" fill="#a0683a" stroke={I} strokeWidth="3" /><circle cx={x} cy={y - r * 0.6} r={r} fill={PP.kelly} stroke={I} strokeWidth="3.5" /><circle cx={x - r * 0.35} cy={y - r * 0.9} r={r * 0.16} fill={PP.pink} /></g>; })}
        {Array.from({ length: 16 }, (_, i) => { const x = (w / 16) * i + 24, y = h * 0.93 + ((i * 37) % 40); return <g key={i}><path d={`M${x} ${y} v16`} stroke={I} strokeWidth="3" strokeLinecap="round" /><circle cx={x} cy={y} r="7" fill={[PP.pink, PP.paper, PP.lemon, PP.sky][i % 4]} stroke={I} strokeWidth="2.5" /></g>; })}
      </svg>
      {items.map((p, i) => (
        <span key={i} className="absolute" style={{ left: p.x - p.size / 2, top: p.y - p.size / 2, transform: `rotate(${p.rot}deg)`, filter: i >= got - 3 ? `drop-shadow(0 0 8px ${PP.lemon})` : undefined }}>
          <Doodle kind="star" color={i >= got - 3 ? PP.orange : PP.lemon} size={i >= got - 3 ? p.size * 1.15 : p.size} />
        </span>
      ))}
      {children}
    </div>
  );
}
function SkyGoal({ got = SKY_GOT, line = 'Fill the sky together!' }: { got?: number; line?: string }) {
  return (
    <div className="p-4 grid gap-2.5 text-center" style={paper}>
      <span className="flex items-center justify-center gap-2"><Doodle kind="star" color={PP.lemon} size={40} /><span className="font-display text-5xl font-bold leading-none tabular-nums">{got}<span className="text-2xl"> of {SKY_N}</span></span></span>
      <span className="h-6 rounded-full overflow-hidden" style={{ background: PP.cream, border: `2.5px solid ${I}` }}><span className="block h-full" style={{ width: `${(got / SKY_N) * 100}%`, background: PP.lemon, borderRight: `2.5px solid ${I}` }} /></span>
      <span className="font-bold text-lg">{line}</span>
    </div>
  );
}
function ClassScreen() {
  return (
    <SkyScene w={1000} h={625} holes={[[0, 0, 300, 84], [730, 0, 1000, 625], [150, 470, 600, 560]]}>
      <Corner dark />
      <div className="absolute left-[24px] top-[18px] flex items-center gap-3 px-4 py-2" style={{ ...paper, borderRadius: 18 }}>
        <span className="font-bold" style={{ color: PP.quiet }}>Join code</span><b className="font-display text-3xl tracking-widest">472915</b>
      </div>
      <div className="absolute left-[180px] top-[492px]"><Burst text="Three gold stars in a row!" size="text-2xl" color={PP.butter} /></div>
      <div className="absolute right-[24px] top-[84px] w-[230px] grid gap-3">
        <SkyGoal />
        <div className="p-3 grid gap-2" style={paper}>
          <b className="text-base flex items-center gap-1.5"><UsersThree weight="bold" size={20} />12 playing</b>
          <div className="flex flex-wrap gap-1.5">{['Ava', 'Leo', 'Mia', 'Noah', 'Zoe', 'Eli', 'Ivy', 'Max', 'Ruby', 'Sam', 'Lily', 'Owen'].map((n, i) => <span key={n} className="px-2 py-0.5 rounded-full text-sm font-bold" style={{ background: [PP.gamify, PP.aqua, PP.blush, PP.butter][i % 4], border: `2px solid ${I}` }}>{n}</span>)}</div>
        </div>
      </div>
    </SkyScene>
  );
}
const ANS = [['A', 'cat', PP.periwinkle], ['B', 'Cat', PP.sky], ['C', 'CAT', PP.pink], ['D', 'caT', PP.lemon]] as const;
function StudentDevice({ solo }: { solo?: boolean }) {
  return (
    <SkyScene w={820} h={1180} got={solo ? 4 : 9} holes={[[0, 80, 820, 1000], [560, 0, 820, 90]]}>
      <Corner dark />
      <div className="absolute inset-x-8 top-[96px] flex items-center gap-3 px-5 py-3" style={{ ...paper, borderRadius: 18 }}>
        <Doodle kind="star" color={PP.lemon} size={52} /><b className="font-display text-4xl">{solo ? 'My sky: 4 stars' : 'You added 4 stars'}</b>
        <span className="flex-1" />{!solo && <span className="font-bold text-lg" style={{ color: PP.quiet }}>Class sky: 18 of 30</span>}
      </div>
      <div className="absolute inset-x-8 top-[210px] p-8 grid gap-6" style={{ ...paper, borderRadius: 26 }}>
        <span className="font-bold text-xl" style={{ color: PP.quiet }}>Question 5 of 10</span>
        <p className="font-bold text-[44px] leading-snug text-left">Which word starts a sentence the right way?</p>
        <div className="grid gap-4">
          {ANS.map(([l, w, c], i) => (
            <span key={l} className="flex items-center gap-4 px-4 min-h-[112px] rounded-2xl text-left" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: i === 1 ? `0 0 0 3px ${PP.paper}, 0 0 0 6px ${I}, 0 4px 0 ${I}` : `0 4px 0 ${I}` }}>
              <span className="w-16 h-16 rounded-full grid place-items-center font-display text-4xl font-bold" style={{ background: c, border: `3px solid ${I}` }}>{l}</span>
              <b className="font-display text-5xl flex-1">{w}</b>{i === 1 && <span className="w-12 h-12 rounded-full grid place-items-center" style={{ background: PP.kelly, border: `3px solid ${I}` }}><Check weight="bold" size={28} /></span>}
            </span>
          ))}
        </div>
      </div>
      <div className="absolute inset-x-0 top-[1040px] grid justify-items-center"><Burst text="Yes! A star for the sky!" size="text-4xl" color={PP.lemon} rot={-3} /></div>
    </SkyScene>
  );
}
// The Live student waiting screen, in the game's own sky.
function SkyWaiting() {
  return (
    <SkyScene w={820} h={1180} got={14} holes={[[40, 300, 780, 860], [560, 0, 820, 90]]}>
      <div className="absolute inset-x-10 top-[320px] p-10 grid justify-items-center gap-5 text-center" style={{ ...paper, borderRadius: 30, boxShadow: `0 6px 0 ${I}` }}>
        <TurnGlow round><span className="w-[150px] h-[150px] rounded-full grid place-items-center" style={{ background: PP.paper, border: `3px solid ${I}` }}><Doodle kind="star" color={PP.lemon} size={100} /></span></TurnGlow>
        <h2 className="text-[64px]" style={GY}>You&apos;re in, Ava!</h2>
        <p className="font-bold text-[28px] leading-snug">Your teacher will start soon. Your stars will light up the sky.</p>
        <span className="flex gap-3" aria-label="Waiting">{[0, 1, 2].map((d) => <span key={d} className="w-5 h-5 rounded-full" style={{ background: [PP.periwinkle, PP.lemon, PP.pink][d], border: `2.5px solid ${I}` }} />)}</span>
      </div>
    </SkyScene>
  );
}

// ================= every view (teacher, 2026-11-23: "show me every view:
// lobby, teacher screen, student, share, etc. for all games") =================
// Menus wear the universal views look: quiet ground with a busy band only at
// the top and bottom edge, taped paper panels, Grow Year titles, Gamify purple
// go buttons with ink text. Every menu is centered (teacher, 2026-11-23);
// question text stays left-aligned in its card.
// Grow Year headings are ALL CAPS (teacher, 2026-11-23).
const GY: CSSProperties = { fontFamily: 'var(--font-display)', fontWeight: 400, lineHeight: 1, textTransform: 'uppercase' };
function Sheet({ children, w, pad = 28 }: { children: ReactNode; w: number; layer?: string; pad?: number }) {
  return (
    <div className="relative mx-auto" style={{ width: w }}>
      <div className="relative rounded-[30px] grid justify-items-center text-center gap-4" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 6px 0 ${I}`, padding: pad }}>{children}</div>
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
        <Sheet w={560} layer={PP.butter} pad={24}>
          <Title size={48}>{title}</Title>
          <TurnGlow round className="w-28 h-28 place-items-center rounded-full" style={{ background: PP.paper, border: `3px solid ${I}`, borderRadius: 9999 }}><span className="w-28 h-28 grid place-items-center"><span className="scale-[0.7]">{winner}</span></span></TurnGlow>
          <div className="flex flex-wrap justify-center gap-2">{stats.map((s2) => <span key={s2} className="px-3 py-1 rounded-full font-bold text-lg" style={{ background: PP.blueCrystal, border: `2.5px solid ${I}` }}>{s2}</span>)}</div>
          <div className="flex flex-wrap justify-center gap-3"><MainBtn><ArrowsClockwise weight="bold" size={20} />Play again</MainBtn><Second>New game</Second><Second>Review {missed} missed</Second></div>
        </Sheet>
      </div>
    }>{game}</Dim>
  );
}

// ---------- the view list for each game: ONLY its themable in-game views ----------
// (teacher, 2026-11-23: "game mockups should only be in-game specific; things
// that can be redone with new themes"). Every shared screen lives on Universal views.
type View = { name: string; device: 'laptop' | 'tablet'; node: ReactNode; note: string };
const ALL_VIEWS: Record<string, { uses: string; views: View[] }> = {
  'game-show': {
    uses: 'Welcome, How will you play (Share, Solo), Share a join code, Question set, Options, Teams, Power-up setup, Question screen, Results, Settings, Pause, Teach card.',
    views: [
      { name: 'Solo: you vs computer', device: 'laptop', node: <GameShowLaptop vs />, note: 'Two sides, You and Computer; same board.' },
      { name: 'Power-up: Swap Spinner', device: 'laptop', node: <PowerMoment game={<GameShowLaptop noPop />} id="swap" name="Swap Spinner" job="Trade your whole score with a team." picks={['Team Purple', 'Team Pink', 'Team Lemon']} />, note: 'Picks a team with shape badges, never color alone.' },
      { name: 'Celebration', device: 'laptop', node: <Results game={<GameShowLaptop noPop />} title="Team Sky wins!" winner={<Badge t={TEAMS[1]} size={110} />} stats={['160 points', '7 cards', '1 row filled']} />, note: 'The winner in the turn glow over the studio.' },
    ],
  },
  'castle-quest': {
    uses: 'Welcome, How will you play (Share, Solo), Share a join code, Question set, Options, Teams, Power-up setup, Question screen, Results, Settings, Pause, Teach card.',
    views: [
      { name: 'Solo: you vs computer', device: 'laptop', node: <BoardLaptop vs />, note: 'Two pawns; the die card says Your turn.' },
      { name: 'Power-up: Tornado', device: 'laptop', node: <PowerMoment game={<BoardLaptop />} id="tornado" name="Tornado" job="Whoosh! Every player lands on a new square." />, note: 'Found on a hidden square.' },
      { name: 'Celebration', device: 'laptop', node: <Results game={<BoardLaptop />} title="Team Sky wins!" winner={<CrayonPawn color={PP.sky} size={110} />} stats={['First to the finish', '14 turns']} />, note: 'The winner\'s pawn in the turn glow.' },
    ],
  },
  'match-three': {
    uses: 'Welcome, Question set, Options, Power-up setup, Question screen, Results, Settings, Pause, Teach card. Solo only, so no How will you play.',
    views: [
      { name: 'Power-up: Fireball', device: 'laptop', node: <PowerMoment game={<MatchThreeLaptop />} id="lightning" name="Fireball" job="Pops every piece of one kind." />, note: 'Kit has no fireball yet; lightning stands in.' },
      { name: 'Celebration', device: 'tablet', node: <Results game={<MatchThreeTablet />} title="You got 2 stars!" winner={<StarGoal got={2} />} stats={['260 points', '9 matches']} />, note: 'Stars, not a rank.' },
    ],
  },
  'four-in-a-row': {
    uses: 'Welcome, How will you play (Share, Solo), Question set, Options, Power-up setup, Question screen, Results, Settings, Pause, Teach card.',
    views: [
      { name: 'Solo: you vs computer', device: 'laptop', node: <FourLaptop vs />, note: 'Your piece waits over its column.' },
      { name: 'Power-up: Pop Out', device: 'laptop', node: <PowerMoment game={<FourLaptop vs />} id="swap" name="Pop Out" job="Pull out a bottom piece; the rest fall down." />, note: 'Kit has no key art; swap stands in.' },
      { name: 'Celebration', device: 'laptop', node: <Results game={<FourLaptop />} title="Leo wins!" winner={<Disc p={2} s={110} />} stats={['Four in a row', '11 drops']} />, note: 'The winning piece in the turn glow.' },
    ],
  },
  'bubble-pop': {
    uses: 'Welcome, Question set, Options, Power-up setup, Question screen, Results, Settings, Pause, Teach card. Solo only, so no How will you play.',
    views: [
      { name: 'Power-up: Mystery Box', device: 'laptop', node: <PowerMoment game={<BubbleLaptop />} id="mystery-box" name="Mystery Box" job="A surprise: 10 to 100 points!" />, note: 'Opens with a bob and a pop.' },
      { name: 'Celebration', device: 'tablet', node: <Results game={<BubbleTablet />} title="340 points!" winner={<Bubble k={4} s={110} />} stats={['31 bubbles popped', 'Best combo x4']} />, note: 'Your points, not a rank.' },
    ],
  },
  bowling: {
    uses: 'Welcome, How will you play (Share, Solo), Share a join code, Question set, Options, Teams and players, Power-up setup, Question screen, Results, Settings, Pause, Teach card.',
    views: [
      { name: 'Solo: alone', device: 'laptop', node: <BowlingLaptop solo />, note: 'One row on the ten-frame sheet, your pins on the left, no turn pill.' },
      { name: 'Power-up: Bumper Rails', device: 'laptop', node: <PowerMoment game={<BowlingLaptop />} id="shield" name="Bumper Rails" job="No gutter ball on your next roll." />, note: 'Shield art carries the job.' },
      { name: 'Celebration', device: 'laptop', node: <Results game={<BowlingLaptop />} title="Ava wins!" winner={<Ball c={PP.periwinkle} s={110} />} stats={['146 pins', '3 strikes', '4 spares']} />, note: 'The winning ball in the turn glow.' },
    ],
  },
  'star-quiz': {
    uses: 'Welcome, How will you play (Live, Solo), Question set, Teacher: how the class plays, Join code, Student join and name, Lobby (cooperative or competitive), Question screen, Results, Settings, Pause. No power-ups in this game.',
    views: [
      { name: 'Live student: waiting', device: 'tablet', node: <SkyWaiting />, note: 'The game\'s own sky, the student\'s star in the turn glow.' },
      { name: 'Solo: in play', device: 'tablet', node: <StudentDevice solo />, note: 'My sky, no class count.' },
      { name: 'Class screen: celebration', device: 'laptop', node: <Results game={<ClassScreen />} title="We filled the sky!" winner={<Doodle kind="star" color={PP.lemon} size={110} />} stats={['30 stars', '12 players', '9 gold stars']} missed={4} />, note: 'One class win, no ranks in Together.' },
    ],
  },
};

// Welcome covers (teacher, 2026-11-23: "welcome previews need to be improved and
// more reperesentative of the game"): a real miniature of each game in play,
// cut from its in-play art at the welcome cover size (720 x 648).
// The whole in-play screen, nothing cropped, as a framed screen on a pastel mat
// with doodle confetti in the bands above and below.
const MAT_MARKS: [DoodleKind, string, number, number, number][] = [['sparkle', PP.lemon, 40, 30, 44], ['star', PP.pink, 170, 54, 30], ['dot', PP.sky, 300, 26, 18], ['heart', PP.pink, 430, 44, 30], ['sparkle', PP.paper, 560, 22, 36], ['star', PP.lemon, 650, 50, 34], ['dot', PP.kelly, 90, 572, 18], ['sparkle', PP.lemon, 220, 580, 40], ['star', PP.sky, 380, 566, 32], ['heart', PP.pink, 520, 584, 28], ['sparkle', PP.paper, 640, 570, 38]];
function Cover({ children, mat }: { children: ReactNode; mat: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ width: 720, height: 648, background: mat }}>
      {MAT_MARKS.map(([k, c, x, y, sz], i) => <span key={i} className="absolute" style={{ left: x, top: y }}><Doodle kind={k} color={c} size={sz} /></span>)}
      <div className="absolute left-[24px] top-[110px] w-[672px] h-[420px] rounded-[20px] overflow-hidden" style={{ border: `3px solid ${I}`, boxShadow: `0 6px 0 ${I}` }}>
        <div className="absolute top-0 left-0 origin-top-left" style={{ width: 1000, height: 625, transform: 'scale(0.672)' }}>{children}</div>
      </div>
    </div>
  );
}
export const GAME_COVERS: { id: string; name: string; desc: string; modes: string[]; steps: [string, string, string]; cover: ReactNode }[] = [
  { id: 'game-show', name: 'Game Show', desc: 'Answer to pick a surprise card. Most points wins.', modes: ['Share', 'Solo'], steps: ['Answer the question', 'Pick a surprise card', 'Most points wins'], cover: <Cover mat={PP.blush}><GameShowLaptop noPop /></Cover> },
  { id: 'castle-quest', name: 'Board Game', desc: 'Answer, roll the die and race to the finish.', modes: ['Share', 'Solo'], steps: ['Answer right to roll', 'Move that many squares', 'First to the finish wins'], cover: <Cover mat={PP.mint}><BoardLaptop /></Cover> },
  { id: 'match-three', name: 'Match Three', desc: 'Swap pieces to make rows of three. Answer for more moves.', modes: ['Solo'], steps: ['Swap two pieces', 'Make a row of 3', 'Answer for more moves'], cover: <Cover mat={PP.butter}><MatchThreeLaptop /></Cover> },
  { id: 'four-in-a-row', name: 'Four in a Row', desc: 'Answer, then drop your piece. Four in a line wins.', modes: ['Share', 'Solo'], steps: ['Answer the question', 'Drop your piece', 'Four in a line wins'], cover: <Cover mat={PP.blueCrystal}><FourLaptop /></Cover> },
  { id: 'bubble-pop', name: 'Bubble Pop', desc: 'Answer to load bubbles, then aim and pop.', modes: ['Solo'], steps: ['Answer to load bubbles', 'Aim and shoot', 'Match 3 to pop'], cover: <Cover mat={PP.aqua}><BubbleLaptop /></Cover> },
  { id: 'bowling', name: 'Bowling', desc: 'Answer right to roll. Knock down the most pins.', modes: ['Share', 'Solo'], steps: ['Answer right to roll', 'Aim and add spin', 'Most pins wins'], cover: <Cover mat={PP.lavender}><BowlingLaptop /></Cover> },
  { id: 'star-quiz', name: 'Question Tracker', desc: 'Every right answer adds a star until the sky is full.', modes: ['Live', 'Solo'], steps: ['Answer a question', 'Right adds a star', 'Fill the whole sky'], cover: <Cover mat={PP.gamify}><ClassScreen /></Cover> },
];

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
      'New: a one-point perspective lane seen from behind the ball: peach boards narrowing to a full ten-pin triangle, lavender gutters each side, orange aim arrows and dots, the ball at the bottom with a dotted aim arrow to the head pin; a standard ten-frame sheet (two roll boxes a frame, three in the 10th, X, / and -, running totals) and a Frame X of 10 tracker.',
      'Why: the familiar bowler\'s view needs no teaching (recognition over recall); the lane is the brightest, simplest shape so eyes go to it first (visual hierarchy); a real score sheet teaches how bowling is scored, and frames, not rounds, match what kids see at a real alley.',
      'Pieces (theme template): Background 1000 x 1300 (alley wall), Lane 800 x 1000, Pin 64 x 200, Ball 256 x 256 (up to 10, each player\'s icon), Power-up 256 x 256 (7 Classic), Cover 600 x 600, Title 1200 x 360.',
    ],
  },
  {
    id: 'star-quiz', name: 'Question Tracker (Live: class screen and a student device)', laptop: <ClassScreen />, tablet: <StudentDevice />,
    lines: [
      'New: the whole stage is the scene, a big Blue crystal sky over a mint hill with trees and flowers, filling with lemon stars in many sizes and turns (glowing orange for a first-try streak); the join code, the class goal card with its progress bar and who is playing sit on paper cards; the student device shows the same sky around the question card.',
      'Why: one shared goal builds relatedness and lowers social comparison (self-determination theory); the goal bar shows how close the class is without empty placeholder shapes (goal-gradient effect); answers are about 112px tall for small fingers (WCAG 2.5.5).',
      'Pieces (theme template): Background 1600 x 1000 (the scene that fills), six Items 256 x 256 (a star, a fish...), Cover 600 x 600, Title 1200 x 360. No power-ups in this game today.',
    ],
  },
];

function ViewStrip({ id }: { id: string }) {
  const v = ALL_VIEWS[id];
  if (!v) return null;
  return (
    <div className="grid gap-3">
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
        <p className="text-sm font-semibold text-muted max-w-prose">The seven live games in the improved universal Classic theme, showing only what a theme can redo: the stage and background, the board and pieces, its power-up moment, its celebration and its themed Live class, student and waiting screens. Every shared screen (welcome, menus, join, lobby, question screen, results, settings) is on Universal views. Preview only: no game changes until you approve.</p>
      </div>
      <nav aria-label="Jump to a game" className="flex flex-wrap gap-2">
        {GAMES.map((g) => <a key={g.id} href={`#gm-${g.id}`} className="px-3 py-1.5 rounded-full font-bold text-sm border-2 border-black bg-[#fffaf0] hover:bg-[#fdfd94]">{g.name.split(' (')[0]} <span className="text-muted">{(ALL_VIEWS[g.id]?.views.length ?? 0) + 2} views</span></a>)}
      </nav>
      {GAMES.map((g) => (
        <article key={g.id} id={`gm-${g.id}`} className="grid gap-4 scroll-mt-24 pt-6 border-t-2 border-black/20">
          <h3 className="font-heading text-xl">{g.name}</h3>
          <p className="text-sm font-semibold -mt-2"><b>Uses these universal screens:</b> {ALL_VIEWS[g.id]?.uses}</p>
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
