import type { CSSProperties, ReactNode } from 'react';
import { ArrowRight, ArrowsClockwise, FlagCheckered, HourglassHigh, Play, UsersThree } from '@phosphor-icons/react';
import { PP } from './PaletteProposal';
import { PATTERNS } from './PatternProposal';
import { CrayonDie, CrayonPawn, CrayonPowerUp, Doodle, type DoodleKind, type PowerId } from './CrayonKit';
import { AutoFit, Badge, MainBtn, ParkBack, StudioBack, TEAMS, TurnGlow, Meter, DeviceSet, Fit, FitTitle, cpuName, DieWiggle, GameTools, PhoneTools, PowerCard, QuestionCard, TURN_SHADE, usePhone, GText } from './mockKit';
import { layout } from '../games/castle-quest/board';
// Territory's own Classic art, imported as is (read only; the live game owns it).
import { CatArt, MouseArt, PoofArt, RoomArt, SIDE_PASTEL } from '../games/territory/art';

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
// Solo against the computer (former Versus games): two sides, You and the computer's fun
// name, which changes each game (teacher, 2026-11-24: never "Computer").
const VS: Team[] = [{ ...TEAMS[0], name: 'You' } as unknown as Team, { ...TEAMS[3], name: cpuName(0) } as unknown as Team];
const PASTEL_OF: Record<string, string> = { [PP.periwinkle]: PP.gamify, [PP.sky]: PP.blueCrystal, [PP.pink]: PP.blush, [PP.lemon]: PP.butter };

// ---------- shared mockup parts ----------
// The one in-game tool group, top right (mockKit GameTools: Accessibility, Hint,
// Settings, Full screen, Close; 44px, 14px apart).
function Corner(_: { dark?: boolean }) {
  return <div className="absolute top-4 right-5 z-20"><GameTools /></div>;
}
// Scoreboard row (teacher, 2026-11-24): icon with no circle, Butter shading for
// whose turn it is (the only turn signal), no glow, crown or held power-up.
function Score({ t, pts, now, compact }: { t: Team; pts: number; now?: boolean; compact?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${compact ? 'px-2.5 py-1.5' : 'px-3 py-2'} rounded-2xl`} style={{ background: now ? TURN_SHADE : PP.paper, border: `3px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}>
      <Badge t={t} size={compact ? 34 : 40} />
      <b className={`flex-1 truncate ${compact ? 'text-base' : 'text-lg'}`}>{t.name}</b>
      <span className={`font-display ${compact ? 'text-2xl' : 'text-3xl'} tabular-nums`}>{pts}</span>
    </div>
  );
}
// Doodle confetti, placed by hand so it stays at the edges, never on text.
function Confetti({ marks }: { marks: [DoodleKind, string, number, number, number][] }) {
  return <>{marks.map(([k, c, x, y, s], i) => <Doodle key={i} kind={k} color={c} size={s} className="absolute pointer-events-none" style={{ left: x, top: y, transform: `rotate(${(i * 37) % 50 - 25}deg)` }} />)}</>;
}
// ---------- phone parts (teacher, 2026-11-24, "phones need a layout") ----------
// Every game on a 390 x 844 phone: one top row (who or what left, the Hint and
// one Menu round right), the board as big as the width allows, then the
// scoreboard as one compact row of chips (the current one shaded Butter) and
// the power-up cards as a small row of squares. Nothing scrolls.
function PTop({ left, hint = true }: { left?: ReactNode; hint?: boolean }) {
  return <div className="absolute top-3 inset-x-3 z-20 flex items-center justify-between gap-2"><span className="min-w-0">{left}</span><PhoneTools hint={hint} /></div>;
}
function PStack({ children, top = 70, gap = 12 }: { children: ReactNode; top?: number; gap?: number }) {
  return <div className="absolute inset-x-3 bottom-4 flex flex-col items-center justify-evenly" style={{ top, gap }}>{children}</div>;
}
function PhoneChips({ teams, pts, now, names }: { teams: readonly Team[]; pts: (number | string)[]; now: number; names?: boolean }) {
  return (
    <div className="w-full grid gap-1.5" style={{ gridTemplateColumns: `repeat(${teams.length}, minmax(0, 1fr))` }}>
      {teams.map((t, i) => (
        <span key={t.name} aria-label={`${t.name} ${pts[i]}`} className="h-[48px] min-w-0 rounded-full flex items-center justify-center gap-1.5 px-1.5" style={{ background: i === now ? TURN_SHADE : PP.paper, border: `3px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}>
          <Badge t={t} size={28} />{names && <b className="truncate text-[15px]">{t.name}</b>}<span className="font-display text-[20px] tabular-nums whitespace-nowrap">{pts[i]}</span>
        </span>
      ))}
    </div>
  );
}
function PPill({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center gap-3 px-3.5 h-[52px] rounded-full" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}>{children}</span>;
}

// ================= Game Show =================
// The real game: a grid of surprise cards (4 x 3 here, 12 cards), teams take
// turns, a right answer picks a card; cards hold points or one of the four
// Classic power-ups (Double Star, Swap Spinner, Sneaky Magnet, Prize Chest).
// World: a TV studio stage (curtains, valance, spotlights, stage floor, a
// bulb marquee) with the board zone blocked out in the middle.
const GS_POWERS: Record<string, { id: PowerId; name: string }> = {
  double: { id: 'double-points', name: 'Double Star' }, swap: { id: 'swap', name: 'Swap Spinner' },
  steal: { id: 'magnet', name: 'Sneaky Magnet' }, bonus: { id: 'treasure-chest', name: 'Prize Chest' },
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
function GSCard({ c, art = 58 }: { c: (typeof GS_CARDS)[number]; art?: number }) {
  if (!c) {
    return (
      <span className="relative rounded-[14px] grid place-items-center overflow-hidden" style={{ aspectRatio: '300 / 220', background: PP.butter, border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}` }}>
        <span className="absolute inset-[7px] rounded-[9px]" style={{ border: `2px dashed ${PP.orange}` }} />
        <Doodle kind="sparkle" color={PP.lemon} size={Math.round(art * 0.8)} />
      </span>
    );
  }
  const t = TEAMS[c.by];
  const pw = c.power ? GS_POWERS[c.power] : undefined;
  return (
    <span className="relative rounded-[14px] grid place-items-center" style={{ aspectRatio: '300 / 220', background: PASTEL_OF[t.color], border: `3px solid ${I}` }}>
      <span className="absolute top-1 left-1"><Badge t={t} size={art < 50 ? 17 : 22} /></span>
      {pw ? <CrayonPowerUp id={pw.id} size={art} /> : <b className={`font-display tabular-nums ${art < 50 ? 'text-[26px] pl-2 pt-1' : 'text-4xl'}`}>+{c.pts}</b>}
    </span>
  );
}
// Celebration: the Prize Chest card pops off the board; it stays until Continue.
function GSPop({ scale = 1 }: { scale?: number }) {
  return (
    <div className="absolute inset-0 grid place-items-center z-10 pointer-events-none">
      <div className="relative" style={{ transform: `scale(${scale})` }}>
        <Confetti marks={[['sparkle', PP.lemon, -52, -30, 34], ['star', PP.pink, 250, -26, 28], ['dot', PP.sky, -40, 150, 16], ['heart', PP.pink, 262, 140, 24], ['sparkle', PP.paper, 120, -54, 26], ['star', PP.kelly, -64, 64, 22], ['dot', PP.lemon, 280, 60, 14]]} />
        <div className="w-[260px] p-4 grid justify-items-center gap-2 text-center" style={{ ...paper, borderRadius: 24, boxShadow: `0 6px 0 ${I}` }}>
          <div className="relative w-28 h-28 grid place-items-center"><span className="relative"><CrayonPowerUp id="treasure-chest" size={100} /></span></div>
          <b className="text-4xl" style={GY}><GText>Prize Chest!</GText></b>
          <span className="font-bold text-xl">+100</span>
          <MainBtn>Continue<ArrowRight weight="bold" size={22} /></MainBtn>
        </div>
      </div>
    </div>
  );
}
const GS_SCORES = [70, 160, 50, 10];

function GameShowLaptop({ vs, noPop }: { vs?: boolean; noPop?: boolean }) {
  const teams = vs ? VS : TEAMS;
  return (
    <div className="w-full h-full relative overflow-hidden">
      <StudioBack w={1000} h={625} />
      <Corner dark />
      <div className="absolute left-[96px] top-[52px] w-[600px] grid justify-items-center gap-3">
        <Meter segments={3} done={1} part={0.5} width={340} label="Round 2 of 3" />
        <Marquee bulbs={18}>
          <div className="grid grid-cols-4 gap-2.5">{GS_CARDS.map((c, i) => <GSCard key={i} c={c} />)}</div>
        </Marquee>
      </div>
      <div className="absolute right-[96px] top-[118px] w-[196px] grid gap-2.5">
        {teams.map((t, i) => <Score key={t.name} t={t} pts={vs ? [150, 90][i] : GS_SCORES[i]} now={vs ? i === 0 : i === 1} compact />)}
        <span className="mt-1 flex gap-2 justify-center"><PowerCard id="double-points" name="Double Star" size={80} /></span>
      </div>
      {!noPop && <div className="absolute left-[96px] top-[118px] w-[600px] h-[420px]"><GSPop scale={0.82} /></div>}
    </div>
  );
}
function GameShowTablet({ vs, noPop }: { vs?: boolean; noPop?: boolean }) {
  if (usePhone()) return <GameShowPhone vs={vs} noPop={noPop} />;
  const teams = vs ? VS : TEAMS;
  return (
    <div className="w-full h-full relative overflow-hidden">
      <StudioBack w={820} h={1180} />
      <Corner dark />
      <div className="absolute inset-x-[60px] top-[80px] grid justify-items-center gap-5">
        <Meter segments={3} done={1} part={0.5} width={420} label="Round 2 of 3" />
        <div className="w-full"><Marquee bulbs={14}>
          <div className="grid grid-cols-3 gap-3">{GS_CARDS.map((c, i) => <GSCard key={i} c={c} />)}</div>
        </Marquee></div>
        <div className="w-full grid grid-cols-2 gap-3">{teams.map((t, i) => <Score key={t.name} t={t} pts={vs ? [150, 90][i] : GS_SCORES[i]} now={vs ? i === 0 : i === 1} />)}</div>
        <span className="flex gap-3 justify-center"><PowerCard id="double-points" name="Double Star" size={96} /></span>
      </div>
      {!noPop && <div className="absolute inset-x-[60px] top-[150px] h-[740px]"><GSPop scale={1.2} /></div>}
    </div>
  );
}
function GameShowPhone({ vs, noPop }: { vs?: boolean; noPop?: boolean }) {
  const teams = vs ? VS : TEAMS;
  return (
    <div className="w-full h-full relative overflow-hidden">
      <StudioBack w={390} h={844} />
      <PTop left={<Meter segments={3} done={1} part={0.5} width={150} label="Round 2 of 3" />} />
      <PStack>
        <PhoneChips teams={teams} pts={vs ? [150, 90] : GS_SCORES} now={vs ? 0 : 1} names={vs} />
        <div className="w-full"><Marquee bulbs={9}><div className="grid grid-cols-3 gap-2">{GS_CARDS.map((c, i) => <GSCard key={i} c={c} art={44} />)}</div></Marquee></div>
        <PowerCard id="double-points" name="Double Star" size={64} />
      </PStack>
      {!noPop && <div className="absolute inset-0 z-30"><GSPop /></div>}
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
        // Kept inside the board: the burst's center never comes closer than 100px to an edge.
        <span className="absolute z-[3] pointer-events-none" style={{ left: Math.min(Math.max(p.left + s / 2, 100), w - 100), top: p.top + s + 4 }}>
          <span className="absolute whitespace-nowrap inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-2xl" style={{ ...GY, background: PP.lemon, border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}`, transform: 'translate(-50%, 0)' }}><GText><ArrowsClockwise weight="bold" size={24} />Roll again!</GText></span>
          <Confetti marks={[['sparkle', PP.lemon, -s * 1.7, s * 0.05, 26], ['star', PP.pink, s * 1.35, s * 0.1, 22], ['sparkle', PP.paper, s * 1.5, s * 0.65, 20], ['dot', PP.sky, -s * 1.5, s * 0.7, 14]]} />
        </span>
      ); })()}
    </div>
  );
}
// Just the die (teacher, 2026-11-24): no card, name or Roll button; it wiggles on hover.
function DieCard({ big }: { big?: boolean }) {
  return <div className="grid place-items-center py-1"><DieWiggle><CrayonDie value={3} size={big ? 150 : 120} /></DieWiggle></div>;
}
const BG_HELD: { id: PowerId; name: string }[] = [{ id: 'potion', name: 'Potion' }, { id: 'shield', name: 'Shield' }];
function Tray({ size = 80 }: { size?: number }) {
  return <div className="flex gap-2 justify-center">{BG_HELD.map((p) => <PowerCard key={p.id} id={p.id} name={p.name} size={size} />)}</div>;
}
// No "N to go" on the rows (teacher, 2026-11-24: "remove how many squares to go");
// the pawns on the board show who is ahead.
function MiniRace({ compact, teams = TEAMS, now = 1 }: { compact?: boolean; teams?: readonly Team[]; now?: number }) {
  return <>{teams.map((t, i) => (
    <div key={t.name} className={`flex items-center gap-2 ${compact ? 'px-2 py-1' : 'px-2.5 py-1.5'} rounded-2xl`} style={{ background: i === now ? TURN_SHADE : PP.paper, border: `2.5px solid ${I}`, boxShadow: `0 2px 0 ${I}` }}>
      <CrayonPawn color={t.color} size={30} /><b className="flex-1 truncate text-sm">{t.name}</b>
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
      {/* Side panel order (teacher, 2026-11-24): players, then power-ups, then the die. */}
      <div className="absolute right-6 top-[96px] w-[250px] grid gap-2">
        <MiniRace compact teams={vs ? [{ ...VS[0], color: TEAMS[0].color }, { ...VS[1], color: TEAMS[3].color }] : TEAMS} now={vs ? 0 : 1} />
        <Tray />
        <DieCard />
      </div>
    </div>
  );
}
function BoardTablet({ vs }: { vs?: boolean }) {
  if (usePhone()) return <BoardPhone vs={vs} />;
  return (
    <div className="w-full h-full relative overflow-hidden">
      <ParkBack w={820} h={1180} />
      <Corner dark />
      <div className="absolute inset-x-6 top-[80px] h-[700px] grid place-items-center" style={{ ...quiet, border: `4px solid ${I}`, borderRadius: 30, boxShadow: `0 6px 0 ${I}` }}>
        <BoardGrid w={730} h={660} celebrate={!vs} pawns={vs ? [{ t: 0, at: 17 }, { t: 3, at: 11 }] : undefined} />
      </div>
      <div className="absolute inset-x-6 top-[806px] grid grid-cols-[1fr_auto_250px] gap-4 items-start">
        <div className="grid gap-2 content-start"><MiniRace teams={vs ? [{ ...VS[0], color: TEAMS[0].color }, { ...VS[1], color: TEAMS[3].color }] : TEAMS} now={vs ? 0 : 1} /></div>
        <Tray size={88} />
        <DieCard />
      </div>
    </div>
  );
}
function BoardPhone({ vs }: { vs?: boolean }) {
  const teams = vs ? [{ ...VS[0], color: TEAMS[0].color }, { ...VS[1], color: TEAMS[3].color }] : TEAMS;
  return (
    <div className="w-full h-full relative overflow-hidden">
      <ParkBack w={390} h={844} />
      <PTop />
      <div className="absolute top-[68px] inset-x-2.5 bottom-3 flex flex-col justify-evenly gap-3">
        <div className="grid place-items-center py-3" style={{ ...quiet, border: `4px solid ${I}`, borderRadius: 24, boxShadow: `0 5px 0 ${I}` }}>
          <BoardGrid w={346} h={430} celebrate={!vs} pawns={vs ? [{ t: 0, at: 17 }, { t: 3, at: 11 }] : undefined} />
        </div>
        {/* Players first, then power-ups, then the die (teacher, 2026-11-24); Butter = whose turn. */}
        <div className="grid grid-cols-2 gap-2">{teams.map((t, i) => (
          <span key={t.name} aria-label={t.name} className="h-[44px] rounded-full flex items-center justify-center gap-2 px-2" style={{ background: i === (vs ? 0 : 1) ? TURN_SHADE : PP.paper, border: `2.5px solid ${I}`, boxShadow: `0 2px 0 ${I}` }}>
            <Badge t={t as Team} size={26} /><b className="truncate text-[14px]">{t.name}</b>
          </span>))}</div>
        <div className="flex items-center justify-center gap-5"><Tray size={62} /><DieWiggle><CrayonDie value={3} size={100} /></DieWiggle></div>
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
// THE solo board-game layout (teacher, 2026-11-24, Match Three first, then
// Bubble Pop and every future solo board game): the meter with the moves runs
// across the top; the score is a big number at the top right, with the held
// power-ups under it, centered on the score.
function SoloMeter({ label, segments, done, part = 0, width = 320, goal, compact }: { label: string; segments: number; done: number; part?: number; width?: number; goal?: ReactNode; compact?: boolean }) {
  return (
    <div className={`inline-flex items-center ${compact ? 'gap-2 px-3 h-[52px]' : 'gap-3 px-5 h-[60px]'} rounded-full`} style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}>
      <b className={`whitespace-nowrap ${compact ? 'text-[15px]' : 'text-[18px]'}`}>{label}</b>
      <Meter segments={segments} done={done} part={part} width={width} label={label} />
      {goal}
    </div>
  );
}
function SoloScore({ score, items, size = 80, row, big = 64 }: { score: number; items: { id: PowerId; name: string }[]; size?: number; row?: boolean; big?: number }) {
  return (
    <div className="grid justify-items-center gap-3">
      <span className="tabular-nums leading-none" style={{ ...GY, fontSize: big }}><GText>{score}</GText></span>
      <HeldTray items={items} row={row} size={size} />
    </div>
  );
}
function StarGoal({ got, size = 30 }: { got: number; size?: number }) {
  return <span className="flex gap-1" aria-label={`${got} of 3 stars`}>{[0, 1, 2].map((i) => <Doodle key={i} kind="star" color={i < got ? PP.lemon : PP.paper} size={size} />)}</span>;
}
// Power-ups as single square cards; the old label prop is ignored (teacher, 2026-11-24: no tray, no label).
function HeldTray({ items, row, size = 80 }: { items: { id: PowerId; name: string }[]; label?: string; row?: boolean; size?: number }) {
  return <span className={`flex ${row ? '' : 'flex-col items-center'} gap-2`}>{items.map((p) => <PowerCard key={p.id} id={p.id} name={p.name} size={size} />)}</span>;
}
// The feedback line (zone C): one flat pill, never tilted (teacher, 2026-11-23: nothing tilted).
function Burst({ text, color = PP.lemon, size = 'text-3xl' }: { text: string; color?: string; size?: string; rot?: number }) {
  return <span className={`inline-flex items-center px-5 py-1.5 rounded-full whitespace-nowrap ${size}`} style={{ ...GY, background: color, border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}` }}><GText>{text}</GText></span>;
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
function M3Board({ s, bare }: { s: number; bare?: boolean }) {
  return (
    <div className="relative p-3 rounded-[24px]" style={{ ...pat('checker'), border: `4px solid ${I}`, boxShadow: `0 6px 0 ${I}` }}>
      <div className="grid grid-cols-7 relative" style={{ width: s * 7, height: s * 7 }}>
        {M3.map((k, i) => {
          const pop = !bare && i >= 16 && i <= 18;
          return <span key={i} className="grid place-items-center" style={pop ? { transform: 'scale(1.18)', filter: `drop-shadow(0 0 0 ${PP.lemon})` } : undefined}><Gem k={k} s={s * 0.86} special={M3_SPECIAL[i]} /></span>;
        })}
        {/* celebration: three hearts popping, a ring of sparkles and the points */}
        {!bare && <>
        <span className="absolute rounded-full pointer-events-none" style={{ left: s * 1.9, top: s * 2.05, width: s * 3.2, height: s * 0.9, border: `4px solid ${I}`, boxShadow: `0 0 0 6px ${PP.lemon}` }} />
        <span className="absolute" style={{ left: s * 3.5, top: s * 1.1, transform: 'translateX(-50%)' }}><Burst text="Match! +30" /></span>
        <Confetti marks={[['sparkle', PP.lemon, s * 1.3, s * 1.9, s * 0.45], ['sparkle', PP.paper, s * 5.2, s * 2.6, s * 0.4], ['dot', PP.pink, s * 5.3, s * 1.8, s * 0.22], ['star', PP.kelly, s * 1.4, s * 2.9, s * 0.32]]} />
        </>}
      </div>
    </div>
  );
}
const M3_HELD: { id: PowerId; name: string }[] = [{ id: 'extra-time', name: 'Pocket Watch' }, { id: 'tornado', name: 'Tornado' }];
function MatchThreeLaptop() {
  return (
    <PatternStage id="cutpaper-pastel">
      <Corner />
      {/* The meter sits over the board, clear of the tool buttons. */}
      <div className="absolute left-[300px] -translate-x-1/2 top-4 z-10"><SoloMeter label="2 moves left" segments={10} done={8} width={240} goal={<StarGoal got={2} />} /></div>
      <div className="absolute left-[60px] top-[96px]"><M3Board s={64} /></div>
      <div className="absolute right-[60px] top-[110px] w-[300px]"><SoloScore score={260} items={M3_HELD} size={84} /></div>
    </PatternStage>
  );
}
function MatchThreeTablet() {
  if (usePhone()) return <MatchThreePhone />;
  return (
    <PatternStage id="cutpaper-pastel">
      <Corner />
      <div className="absolute inset-x-8 top-[84px] grid justify-items-center"><SoloMeter label="2 moves left" segments={10} done={8} width={420} goal={<StarGoal got={2} />} /></div>
      <div className="absolute right-10 top-[170px]"><SoloScore score={260} items={M3_HELD} row size={84} big={72} /></div>
      <div className="absolute w-max left-1/2 -translate-x-1/2 top-[380px]"><M3Board s={100} /></div>
    </PatternStage>
  );
}
function MatchThreePhone() {
  return (
    <PatternStage id="cutpaper-pastel">
      <PTop />
      <PStack top={68}>
        <SoloMeter compact label="2 moves" segments={10} done={8} width={150} goal={<StarGoal got={2} size={22} />} />
        <div className="self-end pr-2"><SoloScore score={260} items={M3_HELD} row size={60} big={46} /></div>
        <M3Board s={47} />
      </PStack>
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
      {P.mark === 'dot' ? <circle cx={s / 2} cy={s / 2} r={s * 0.1} fill={P.color === PP.grape ? '#ffffff' : I} /> : <path d={`M${s / 2} ${s * 0.32} l${s * 0.05} ${s * 0.11} l${s * 0.12} ${s * 0.01} l-${s * 0.09} ${s * 0.08} l${s * 0.03} ${s * 0.12} l-${s * 0.11} -${s * 0.07} l-${s * 0.11} ${s * 0.07} l${s * 0.03} -${s * 0.12} l-${s * 0.09} -${s * 0.08} l${s * 0.12} -${s * 0.01} Z`} fill={I} />}
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
function F4Player({ i, now, held, name }: { i: number; now?: boolean; held?: { id: PowerId; name: string }; name?: string }) {
  return (
    <div className="grid justify-items-center gap-3 w-full">
      <div className="p-3 grid justify-items-center gap-2 text-center w-full" style={{ ...paper, background: now ? TURN_SHADE : PP.paper }}>
        <Disc p={i + 1} s={60} />
        <b className="text-2xl" style={GY}><GText>{name ?? ['Ava', 'Leo'][i]}</GText></b>
      </div>
      {held && <PowerCard id={held.id} name={held.name} size={72} />}
    </div>
  );
}
function FourLaptop({ vs }: { vs?: boolean }) {
  return (
    <PatternStage id="squiggle-pastel">
      <Corner />
      <div className="absolute left-[44px] top-[150px] w-[170px]"><F4Player i={0} name={vs ? 'You' : undefined} now={vs} held={{ id: 'swap', name: 'Pop Out' }} /></div>
      <div className="absolute right-[44px] top-[150px] w-[170px]"><F4Player i={1} name={vs ? cpuName(1) : undefined} now={!vs} /></div>
      <div className="absolute w-max left-1/2 -translate-x-1/2 top-[92px]"><F4Board s={64} win={!vs} /></div>
      {!vs && <div className="absolute w-max left-1/2 -translate-x-1/2 top-[546px] z-10"><Burst text="Four in a row! Leo wins!" size="text-3xl" /></div>}
      {!vs && <Confetti marks={[['sparkle', PP.lemon, 250, 560, 34], ['star', PP.pink, 730, 556, 28], ['dot', PP.sky, 220, 520, 16], ['heart', PP.pink, 760, 520, 24]]} />}
    </PatternStage>
  );
}
function FourTablet({ vs }: { vs?: boolean }) {
  if (usePhone()) return <FourPhone vs={vs} />;
  return (
    <PatternStage id="squiggle-pastel">
      <Corner />
      {!vs && <div className="absolute w-max left-1/2 -translate-x-1/2 top-[90px] z-10"><Burst text="Four in a row! Leo wins!" size="text-4xl" /></div>}
      <div className="absolute w-max left-1/2 -translate-x-1/2 top-[300px]"><F4Board s={98} win={!vs} /></div>
      <div className="absolute inset-x-10 top-[960px] grid grid-cols-2 gap-5"><F4Player i={0} name={vs ? 'You' : undefined} now={vs} held={{ id: 'swap', name: 'Pop Out' }} /><F4Player i={1} name={vs ? cpuName(1) : undefined} now={!vs} /></div>
      {!vs && <Confetti marks={[['sparkle', PP.lemon, 80, 170, 40], ['star', PP.pink, 700, 180, 34], ['dot', PP.sky, 120, 240, 18]]} />}
    </PatternStage>
  );
}
function FourPhone({ vs }: { vs?: boolean }) {
  const card = (i: number, now: boolean, name: string) => (
    <div className="h-[64px] min-w-0 flex items-center gap-2 px-3" style={{ ...paper, borderRadius: 18, background: now ? TURN_SHADE : PP.paper }}><Disc p={i + 1} s={42} /><b className="truncate text-[20px]" style={GY}><GText>{name}</GText></b></div>
  );
  return (
    <PatternStage id="squiggle-pastel">
      <PTop />
      <PStack>
        {!vs && <Burst text="Four in a row! Leo wins!" size="text-xl" />}
        <div className="pt-12"><F4Board s={44} win={!vs} /></div>
        <div className="w-full grid grid-cols-2 gap-3 mt-3">{card(0, !!vs, vs ? 'You' : 'Ava')}{card(1, !vs, vs ? cpuName(1) : 'Leo')}</div>
        <PowerCard id="swap" name="Pop Out" size={60} />
      </PStack>
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
const bgrid = (cols: number) => Array.from({ length: BROWS }, (_, r) => Array.from({ length: r % 2 ? cols - 1 : cols }, (_, c) => (Math.floor(c / 2) + r * 2 + (c % 3 === 0 ? 1 : 0)) % 6));
const BGRID = bgrid(BCOLS);
// Phones (hand-off note, 2026-11-24): 19 across made 17px bubbles; 11 across keeps them about 30px, big enough to read and aim at.
const BGRID_PHONE = bgrid(11);
const BPOP = new Set(['6-8', '6-9', '5-9', '6-10']); // the cluster that just popped
function BubbleBoard({ w, bare, cols = BCOLS }: { w: number; bare?: boolean; cols?: number }) {
  const s = w / cols, rowH = s * 0.87, h = w * 1.3;
  const grid = cols === BCOLS ? BGRID : cols === 11 ? BGRID_PHONE : bgrid(cols);
  return (
    <div className="relative rounded-[24px] overflow-hidden" style={{ width: w + 24, height: h, padding: 12, background: PP.blueCrystal, border: `4px solid ${I}`, boxShadow: `0 6px 0 ${I}` }}>
      <div className="relative" style={{ width: w, height: h - 24 }}>
        {grid.flatMap((row, r) => row.map((k, c) => {
          const popped = !bare && BPOP.has(`${r}-${c}`);
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
        {!bare && <span className="absolute grid justify-items-center" style={{ left: w / 2 + s * 1.8, top: h - 24 - s * 1.8 }}><b className="text-[13px]" style={{ color: PP.quiet }}>Next</b><Bubble k={3} s={s} /></span>}
        {!bare && <span className="absolute -translate-x-1/2" style={{ left: w * 0.5, top: rowH * 8.6 }}><Burst text="Pop! +40" color={PP.lemon} /></span>}
      </div>
    </div>
  );
}
const BP_HELD: { id: PowerId; name: string }[] = [{ id: 'double-points', name: 'Double Star' }];
function BubbleLaptop() {
  return (
    <PatternStage id="doodle">
      <Corner />
      <div className="absolute left-1/2 -translate-x-1/2 top-4 z-10"><SoloMeter label="3 bubbles left" segments={5} done={2} width={260} /></div>
      <div className="absolute w-max left-1/2 -translate-x-1/2 top-[92px]"><BubbleBoard w={390} /></div>
      <div className="absolute right-[48px] top-[110px] w-[220px]"><SoloScore score={340} items={BP_HELD} size={80} /></div>
    </PatternStage>
  );
}
function BubbleTablet() {
  if (usePhone()) return <BubblePhone />;
  return (
    <PatternStage id="doodle">
      <Corner />
      <div className="absolute inset-x-8 top-[84px] grid justify-items-center"><SoloMeter label="3 bubbles left" segments={5} done={2} width={360} /></div>
      <div className="absolute right-10 top-[170px]"><SoloScore score={340} items={BP_HELD} row size={80} big={72} /></div>
      <div className="absolute w-max left-1/2 -translate-x-1/2 top-[370px]"><BubbleBoard w={600} /></div>
    </PatternStage>
  );
}
function BubblePhone() {
  return (
    <PatternStage id="doodle">
      <PTop />
      <PStack top={68}>
        <SoloMeter compact label="3 left" segments={5} done={2} width={170} />
        <div className="self-end pr-2"><SoloScore score={340} items={BP_HELD} row size={60} big={46} /></div>
        <BubbleBoard w={330} cols={11} />
      </PStack>
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
      <b className="grid place-items-center" style={{ fontSize: Math.max(13, cell * 0.24), borderLeft: edge, borderBottom: edge, background: PP.cream }}>Total</b>
      {rows.map((r, ri) => (
        <div key={r.name} className="contents">
          <span className="flex items-center gap-2 px-2 min-w-0" style={{ height: row, borderTop: ri ? edge : undefined, background: ri === now ? TURN_SHADE : undefined }}>
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
          <span className="grid place-items-center tabular-nums" style={{ ...GY, fontSize: cell * 0.42, borderLeft: edge, borderTop: ri ? edge : undefined }}><GText>{[...r.t].reverse().find((x) => x != null) ?? 0}</GText></span>
        </div>
      ))}
    </div>
  );
}
// The universal top tracker for bowling: whose roll left, Frame X of 10 middle, icon buttons right.
// The universal top strip for bowling (teacher, 2026-11-24): whose roll left
// (just the name on Butter), the ten-frame meter in the middle with no words
// (the sheet shades the frame too), the tool group right.
function FrameTracker({ frame, solo, k = 1 }: { frame: number; solo?: boolean; k?: number }) {
  return (
    <div className="absolute inset-x-0 flex items-center justify-between z-20" style={{ top: 14 * k, padding: `0 ${20 * k}px` }}>
      {solo
        ? <span className="inline-flex items-baseline gap-2 px-5 py-1 rounded-full" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}` }}><b style={{ ...GY, fontSize: 36 * k }} className="tabular-nums"><GText>54</GText></b><b style={{ fontSize: 16 * k, color: PP.quiet }}>pins</b></span>
        : <RollPill />}
      <span className="absolute left-1/2 -translate-x-1/2"><Meter segments={10} done={frame - 1} part={0.5} width={k > 1 ? 200 : 300} label={`Frame ${frame} of 10`} /></span>
      <GameTools />
    </div>
  );
}
const BW_HELD: { id: PowerId; name: string }[] = [{ id: 'magnet', name: 'Pin Magnet' }, { id: 'shield', name: 'Bumper Rails' }];
// Whose roll: the ball and the name on a plain paper chip (teacher, 2026-11-24:
// no Butter in the top strip; the sheet row carries the Butter turn shading).
function RollPill({ who = 'Mia', size = 24 }: { who?: string; size?: number }) {
  return <span className="inline-flex items-center gap-2.5 rounded-full font-bold whitespace-nowrap" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}`, padding: `${size * 0.2}px ${size * 0.9}px ${size * 0.2}px ${size * 0.35}px`, fontSize: size }}><Ball c={BALLS[1]} s={size * 1.6} />{who}</span>;
}
function BowlingLaptop({ solo }: { solo?: boolean }) {
  return (
    <AlleyStage w={1000} h={625} top={290}>
      <FrameTracker frame={solo ? 5 : 4} solo={solo} />
      <div className="absolute left-1/2 -translate-x-1/2" style={{ top: solo ? 104 : 76 }}><FrameSheet rows={solo ? BOWL_SOLO : BOWL} now={solo ? 0 : 1} frame={solo ? 5 : 4} cell={52} /></div>
      <div className="absolute right-[18px] top-[360px]"><HeldTray items={BW_HELD} size={84} /></div>
    </AlleyStage>
  );
}
function BowlingTablet({ solo }: { solo?: boolean }) {
  if (usePhone()) return <BowlingPhone solo={solo} />;
  return (
    <AlleyStage w={820} h={1180} top={420} wide>
      <FrameTracker frame={solo ? 5 : 4} solo={solo} k={1.15} />
      <div className="absolute left-1/2 -translate-x-1/2 top-[96px]"><FrameSheet rows={solo ? BOWL_SOLO : BOWL} now={solo ? 0 : 1} frame={solo ? 5 : 4} cell={53} /></div>
      <div className="absolute left-1/2 -translate-x-1/2 top-[316px]"><HeldTray items={BW_HELD} row size={80} /></div>
    </AlleyStage>
  );
}
// Phone sheet: five frames at a time (the half with the current frame) and the
// total, so every mark stays 14px or more; the ten-frame meter above shows the
// whole game.
function FrameSheetPhone({ rows, now, frame }: { rows: BowlRow[]; now: number; frame: number }) {
  const from = frame <= 5 ? 0 : 5, cell = 46, box = 21;
  const edge = `2.5px solid ${I}`;
  return (
    <div className="grid" style={{ gridTemplateColumns: `${cell * 1.6}px repeat(5, ${cell}px) ${cell * 1.3}px`, border: `3px solid ${I}`, borderRadius: 14, overflow: 'hidden', boxShadow: `0 4px 0 ${I}`, background: PP.paper }}>
      <span style={{ borderBottom: edge }} />
      {Array.from({ length: 5 }, (_, i) => <b key={i} className="grid place-items-center tabular-nums text-[14px]" style={{ height: 24, borderLeft: edge, borderBottom: edge, background: from + i === frame - 1 ? PP.butter : PP.cream }}>{from + i + 1}</b>)}
      <b className="grid place-items-center text-[14px]" style={{ borderLeft: edge, borderBottom: edge, background: PP.cream }}>Total</b>
      {rows.map((r, ri) => (
        <div key={r.name} className="contents">
          <span className="flex items-center gap-1.5 px-1.5 min-w-0" style={{ height: 42, borderTop: ri ? edge : undefined, background: ri === now ? TURN_SHADE : undefined }}><Ball c={r.ball} s={22} /><b className="truncate text-[16px]">{r.name}</b></span>
          {Array.from({ length: 5 }, (_, k) => { const fi = from + k; const rolls = r.f[fi] ?? (fi === 9 ? ['', '', ''] : ['', '']); return (
            <span key={fi} className="grid" style={{ gridTemplateRows: `${box}px 1fr`, height: 42, borderLeft: edge, borderTop: ri ? edge : undefined, background: fi === frame - 1 && ri === now ? PP.butter : undefined }}>
              <span className="flex justify-end">{rolls.map((m, mi) => <span key={mi} className="grid place-items-center font-display font-bold text-[14px]" style={{ width: box, height: box, borderLeft: edge, borderBottom: edge }}>{m}</span>)}</span>
              <span className="grid place-items-center font-display tabular-nums text-[15px] leading-none">{r.t[fi] ?? ''}</span>
            </span>); })}
          <span className="grid place-items-center tabular-nums" style={{ ...GY, fontSize: 20, borderLeft: edge, borderTop: ri ? edge : undefined }}><GText>{[...r.t].reverse().find((x) => x != null) ?? 0}</GText></span>
        </div>
      ))}
    </div>
  );
}
function BowlingPhone({ solo }: { solo?: boolean }) {
  const frame = solo ? 5 : 4;
  return (
    <AlleyStage w={390} h={844} top={solo ? 300 : 360} wide>
      <PTop left={solo ? <PPill><b style={{ ...GY, fontSize: 32 }} className="tabular-nums"><GText>54</GText></b><b className="text-[16px]" style={{ color: PP.quiet }}>pins</b></PPill> : <RollPill size={20} />} />
      <div className="absolute inset-x-3 top-[72px] z-10 grid justify-items-center gap-2.5">
        <Meter segments={10} done={frame - 1} part={0.5} width="100%" label={`Frame ${frame} of 10`} />
        <FrameSheetPhone rows={solo ? BOWL_SOLO : BOWL} now={solo ? 0 : 1} frame={frame} />
        <HeldTray items={BW_HELD} row size={58} />
      </div>
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
  const cols = Math.round(w / 92), rows = Math.round((h * 0.92) / 92);
  const cw = w / cols, ch = (h * 0.92) / rows;
  const out: { x: number; y: number; size: number; rot: number }[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const size = 34 + rnd() * 40, x = c * cw + cw / 2 + (rnd() - 0.5) * cw * 0.5, y = 20 + r * ch + ch / 2 + (rnd() - 0.5) * ch * 0.5, rot = (rnd() - 0.5) * 50;
    if (!holes.some(([l, t, rr, b]) => x + size / 2 > l && x - size / 2 < rr && y + size / 2 > t && y - size / 2 < b)) out.push({ x, y, size, rot });
  }
  return out.map((p) => [rnd(), p] as const).sort((a, b) => a[0] - b[0]).slice(0, count).map(([, p]) => p);
}
// Her favorite Question Tracker (teacher, 2026-11-24: "keep as orginal as
// possible, just updating the texture and colors"): the live Classic art in
// public/classic/star-quiz/ redrawn flat. The deep navy night with soft lighter
// cloud bands, tiny white twinkles and four-point glints, and her six star
// shapes (skinny spiky, tipped, bright five-point, four-point sparkle, fat
// rounded, shooting star with three trails). Smooth flat fills, no grain, no
// outlines (closest to hers), brand yellows: Lemon, Butter, a touch of Orange.
const NIGHT = '#1c3a66';
function starPts(outer: number[], inner: number, rot: number) {
  const n = outer.length; const pts: string[] = [];
  for (let k = 0; k < n * 2; k++) { const r = k % 2 ? inner : outer[k / 2]; const a = ((rot - 90 + (k * 180) / n) * Math.PI) / 180; pts.push(`${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`); }
  return pts.join(' ');
}
// Concave-sided star: each arm curves in through a point near the center.
function curvyStar(n: number, outer: number, pull: number, rot: number) {
  let d = '';
  for (let k = 0; k < n; k++) {
    const a = ((rot - 90 + (k * 360) / n) * Math.PI) / 180, m = ((rot - 90 + ((k + 0.5) * 360) / n) * Math.PI) / 180;
    const x = 50 + outer * Math.cos(a), y = 50 + outer * Math.sin(a), cx = 50 + pull * Math.cos(m), cy = 50 + pull * Math.sin(m);
    const a2 = ((rot - 90 + ((k + 1) * 360) / n) * Math.PI) / 180;
    d += `${k ? '' : `M${x.toFixed(1)} ${y.toFixed(1)}`} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${(50 + outer * Math.cos(a2)).toFixed(1)} ${(50 + outer * Math.sin(a2)).toFixed(1)} `;
  }
  return d + 'Z';
}
export function NightStar({ kind, size, color }: { kind: number; size: number; color: string }) {
  const k = kind % 6;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {k === 0 && <polygon points={starPts([49, 40, 47, 34, 45], 9, -12)} fill={color} stroke={color} strokeWidth="3" strokeLinejoin="round" />}
      {k === 1 && <polygon points={starPts([44, 42, 44, 40, 43], 19, 18)} fill={color} stroke={color} strokeWidth="9" strokeLinejoin="round" />}
      {k === 2 && <path d={curvyStar(5, 48, 16, 0)} fill={color} stroke={color} strokeWidth="4" strokeLinejoin="round" />}
      {k === 3 && <path d={curvyStar(4, 49, 9, 0)} fill={color} />}
      {k === 4 && <polygon points={starPts([40, 40, 40, 40, 40], 24, 0)} fill={color} stroke={color} strokeWidth="16" strokeLinejoin="round" />}
      {k === 5 && <g><path d="M44 52 L92 14 M50 60 L96 30 M38 46 L80 6" stroke={color} strokeWidth="5" strokeLinecap="round" /><g transform="translate(-14 14) scale(0.62)"><polygon points={starPts([44, 44, 44, 44, 44], 21, -14)} fill={color} stroke={color} strokeWidth="10" strokeLinejoin="round" /></g></g>}
    </svg>
  );
}
const NIGHT_COLORS = [PP.lemon, PP.butter, PP.lemon, PP.butter, PP.lemon, PP.orange];
export function NightSky({ w, h }: { w: number; h: number }) {
  let sd = 5; const rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
  const dots = Array.from({ length: Math.round((w * h) / 9000) }, () => [rnd() * w, rnd() * h, 1 + rnd() * 1.6, 0.45 + rnd() * 0.5]);
  const glints = Array.from({ length: Math.max(4, Math.round((w * h) / 120000)) }, () => [rnd() * w, rnd() * h * 0.9, 7 + rnd() * 9]);
  const bands = [[0.2, 0.12, 0.5], [0.75, 0.3, 0.55], [0.3, 0.55, 0.6], [0.8, 0.78, 0.5], [0.1, 0.9, 0.45]];
  return (
    <svg className="absolute inset-0" width={w} height={h} aria-hidden="true">
      <defs>
        <linearGradient id="ns-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#183460" /><stop offset="1" stopColor="#21436f" /></linearGradient>
        <filter id="ns-b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={Math.max(w, h) * 0.025} /></filter>
      </defs>
      <rect width={w} height={h} fill="url(#ns-g)" />
      <g filter="url(#ns-b)" opacity="0.55">{bands.map(([x, y, s], i) => <ellipse key={i} cx={x * w} cy={y * h} rx={w * s} ry={h * 0.045} fill="#2f5a92" transform={`rotate(-4 ${x * w} ${y * h})`} />)}</g>
      {dots.map(([x, y, r, o], i) => <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={o} />)}
      {glints.map(([x, y, r], i) => <path key={i} d={`M${x} ${y - r} Q${x + r * 0.12} ${y - r * 0.12} ${x + r} ${y} Q${x + r * 0.12} ${y + r * 0.12} ${x} ${y + r} Q${x - r * 0.12} ${y + r * 0.12} ${x - r} ${y} Q${x - r * 0.12} ${y - r * 0.12} ${x} ${y - r} Z`} fill="#fff" />)}
    </svg>
  );
}
// The whole stage is her night sky; earned stars fill the open sky around the HUD.
function SkyScene({ w, h, got = SKY_GOT, holes = [], children }: { w: number; h: number; got?: number; holes?: Box[]; children?: ReactNode }) {
  const items = skyItems(w, h, got, holes);
  return (
    <div className="w-full h-full relative overflow-hidden" style={{ background: NIGHT }}>
      <NightSky w={w} h={h} />
      {items.map((p, i) => { const streak = i >= got - 3; const kind = (i * 7 + 3) % 6; return (
        <span key={i} className="absolute" style={{ left: p.x - p.size * 0.65, top: p.y - p.size * 0.65, transform: `rotate(${p.rot}deg)`, filter: streak ? `drop-shadow(0 0 10px rgba(250,190,55,0.85))` : undefined }}>
          <NightStar kind={kind} size={p.size * 1.3 * (streak ? 1.1 : 1)} color={streak ? PP.orange : NIGHT_COLORS[(i * 5) % 6]} />
        </span>); })}
      {children}
    </div>
  );
}
function SkyGoal({ got = SKY_GOT }: { got?: number }) {
  return (
    <div className="p-4 grid gap-2.5 text-center" style={paper}>
      <span className="flex items-center justify-center gap-2"><NightStar kind={2} color={PP.lemon} size={40} /><span className="font-display text-5xl font-bold leading-none tabular-nums">{got}<span className="text-2xl"> of {SKY_N}</span></span></span>
      <Meter segments={1} done={0} part={got / SKY_N} width="100%" label={`${got} of ${SKY_N} stars`} />
    </div>
  );
}
function ClassScreen({ w: w0 = 1000, h: h0 = 625 }: { w?: number; h?: number }) {
  const phone = usePhone(); const w = phone ? 390 : w0, h = phone ? 844 : h0;
  return (
    phone ? (
    <SkyScene w={w} h={h} holes={[[0, 0, w, 330], [0, h - 300, w, h]]}>
      <PTop left={<span className="px-4 h-[48px] inline-flex items-center rounded-full" style={{ ...paper, borderRadius: 999 }}><b className="font-display text-2xl tracking-widest">472915</b></span>} />
      <div className="absolute inset-x-3 top-[76px]"><SkyGoal /></div>
      <div className="absolute inset-x-3 bottom-[84px] p-3 grid gap-2" style={paper}>
        <b className="text-base flex items-center gap-1.5"><UsersThree weight="bold" size={20} />12 playing</b>
        <div className="flex flex-wrap gap-1.5">{['Ava', 'Leo', 'Mia', 'Noah', 'Zoe', 'Eli', 'Ivy', 'Max', 'Ruby', 'Sam', 'Lily', 'Owen'].map((n, i) => <span key={n} className="px-2.5 py-0.5 rounded-full text-[15px] font-bold" style={{ background: [PP.gamify, PP.aqua, PP.blush, PP.butter][i % 4], border: `2px solid ${I}` }}>{n}</span>)}</div>
      </div>
      <div className="absolute left-3 bottom-5"><Burst text="Three in a row!" size="text-xl" color={PP.butter} /></div>
    </SkyScene>
    ) :
    <SkyScene w={w} h={h} holes={[[0, 0, 300, 84], [w - 330, 0, w, 90], [w - 270, 0, w, h], [20, h - 150, 470, h - 60]]}>
      <Corner dark />
      <div className="absolute left-[24px] top-[18px] flex items-center gap-3 px-5 py-2 rounded-full" style={{ ...paper, borderRadius: 999 }}>
        <b className="font-display text-3xl tracking-widest">472915</b>
      </div>
      <div className="absolute left-[40px]" style={{ top: h - 130 }}><Burst text="Three in a row!" size="text-2xl" color={PP.butter} /></div>
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
const SKY_ANS = [['A', 'cat', PP.periwinkle, PP.gamify], ['B', 'Cat', PP.sky, PP.blueCrystal], ['C', 'CAT', PP.pink, PP.blush], ['D', 'caT', PP.lemon, PP.butter]] as const;
// The student's device: the one universal question card (mockKit QuestionCard),
// the game's own sky around it, the student's name on Butter in the card.
function StudentDevice({ solo, w: w0 = 820, h: h0 = 1180 }: { solo?: boolean; w?: number; h?: number }) {
  const phone = usePhone(); const w = phone ? 390 : w0, h = phone ? 844 : h0;
  const port = h > w;
  const k = port ? 1 : Math.min((w - 80) / 1088, (h - 150) / 528);
  return (
    <SkyScene w={w} h={h} got={solo ? 4 : 9} holes={phone ? [[10, 16, w - 10, 640]] : port ? [[40, 80, w - 40, 1020]] : [[40, 20, w - 40, h - 70]]}>
      <div className="absolute left-1/2" style={{ top: phone ? 24 : port ? 90 : 24, transform: `translateX(-50%) scale(${k})`, transformOrigin: 'top center' }}>
        <QuestionCard tablet={port} q="Which word starts a sentence the right way?" who={{ icon: <NightStar kind={2} color={PP.lemon} size={phone ? 38 : port ? 54 : 46} />, name: solo ? 'My sky' : 'Ava' }} answers={SKY_ANS} right={1} />
      </div>
      <div className="absolute inset-x-0 grid justify-items-center" style={{ top: phone ? h - 92 : port ? 1040 : h - 80 }}><Burst text={solo ? 'Yes! A star for your sky!' : 'Yes! A star for the class sky!'} size={phone ? 'text-xl' : port ? 'text-4xl' : 'text-3xl'} color={PP.lemon} /></div>
    </SkyScene>
  );
}
// The Live student waiting screen, in the game's own sky.
function SkyWaiting({ w: w0 = 820, h: h0 = 1180 }: { w?: number; h?: number }) {
  const phone = usePhone(); const w = phone ? 390 : w0, h = phone ? 844 : h0;
  const port = h > w, cw = Math.min(w - (phone ? 48 : 80), 740), ch = phone ? 460 : port ? 560 : 440;
  const l = (w - cw) / 2, t = (h - ch) / 2;
  return (
    <SkyScene w={w} h={h} got={14} holes={[[l - 20, t - 20, l + cw + 20, t + ch + 20]]}>
      <div className={`absolute ${phone ? 'p-6' : 'p-10'} grid justify-items-center content-center gap-5 text-center`} style={{ left: l, top: t, width: cw, height: ch, ...paper, borderRadius: 30, boxShadow: `0 6px 0 ${I}` }}>
        <NightStar kind={2} color={PP.lemon} size={phone ? 110 : port ? 140 : 100} />
        <h2 style={{ ...GY, fontSize: phone ? 40 : port ? 64 : 54 }}><GText>You&apos;re in, Ava!</GText></h2>
        <p className="font-bold leading-snug" style={{ fontSize: phone ? 22 : port ? 28 : 24 }}>Your teacher will start soon. Your stars will light up the sky.</p>
        <span className="flex gap-3" aria-label="Waiting">{[0, 1, 2].map((d) => <span key={d} className="w-5 h-5 rounded-full" style={{ background: [PP.periwinkle, PP.lemon, PP.pink][d], border: `2.5px solid ${I}` }} />)}</span>
      </div>
    </SkyScene>
  );
}


// ================= Territory (Live: Cooperative, Competitive) =================
// The live game (src/games/territory, teacher 2026-11-24): a 2D living room in
// Classic style. Cooperative: the class are the cats; mice come out of the
// arched mouse hole in the baseboard at the teacher's pace; each right answer
// sends a cat to catch one, which poofs away in a puff of stars (nothing is
// ever hurt). Competitive: Cats against Mice; a right answer adds one of yours
// and sends one of theirs away (a scared cat leaps out the window). The art is
// the live game's own (art.tsx); this strip only arranges it.
type Spot = { l: number; t: number; w: number; rot?: number };
const at = ({ l, t, w, rot }: Spot): CSSProperties => ({ position: 'absolute', left: `${l}%`, top: `${t}%`, width: `${w}%`, transform: rot ? `rotate(${rot}deg)` : undefined });
const COOP_CATS: (Spot & { look: number })[] = [{ l: 28, t: 58, w: 8, look: 0 }, { l: 49, t: 62, w: 7.5, look: 2 }, { l: 10, t: 70, w: 9, look: 3 }, { l: 60, t: 74, w: 8.5, look: 5 }];
const COOP_MICE: (Spot & { look: number })[] = [{ l: 77.6, t: 54.5, w: 4.8, look: 1 }, { l: 67, t: 66, w: 5, look: 0 }, { l: 84, t: 80, w: 5, look: 2 }];
const COMP_CATS: (Spot & { look: number })[] = [{ l: 30, t: 60, w: 7.5, look: 0 }, { l: 44, t: 70, w: 8, look: 3 }, { l: 12, t: 72, w: 8, look: 1 }, { l: 58, t: 62, w: 7, look: 2 }, { l: 22, t: 80, w: 8, look: 5 }];
const COMP_MICE: (Spot & { look: number })[] = [{ l: 66, t: 70, w: 5, look: 0 }, { l: 74, t: 63, w: 4.6, look: 1 }, { l: 80, t: 76, w: 5, look: 2 }, { l: 52, t: 82, w: 5, look: 1 }, { l: 37, t: 84, w: 4.8, look: 0 }, { l: 88, t: 68, w: 4.6, look: 2 }, { l: 24, t: 41, w: 4.4, look: 0 }];
function Animals({ cats = [], mice = [] }: { cats?: (Spot & { look: number })[]; mice?: (Spot & { look: number })[] }) {
  return <>{cats.map((c, i) => <span key={`c${i}`} style={at(c)}><CatArt look={c.look} className="w-full h-auto block" /></span>)}{mice.map((m, i) => <span key={`m${i}`} style={at(m)}><MouseArt look={m.look} className="w-full h-auto block" /></span>)}</>;
}
// Live class screens have no turns: the top strip holds the join code (just the
// code in a white pill), the class goal or the two team counts, and the tools.
function RoomStrip({ w, center }: { w: number; center: ReactNode }) {
  const port = w < 900;
  if (w < 600) return (
    <div className="absolute inset-x-0 top-0 z-20 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="px-4 h-[48px] inline-flex items-center rounded-full" style={{ background: '#fff', border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}` }}><b className="font-display text-2xl tracking-widest">472915</b></span>
        <PhoneTools />
      </div>
      <div className="mt-4 grid justify-items-center">{center}</div>
    </div>
  );
  return (
    <div className="absolute inset-x-0 top-0 z-20" style={{ padding: port ? '14px 20px' : '16px 20px' }}>
      <div className="flex items-start justify-between">
        <span className="px-5 h-[52px] inline-flex items-center rounded-full" style={{ background: '#fff', border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}` }}><b className="font-display text-3xl tracking-widest">472915</b></span>
        <GameTools />
      </div>
      <div className={`${port ? 'mt-4 grid justify-items-center' : 'absolute left-1/2 -translate-x-1/2 top-[16px]'}`}>{center}</div>
    </div>
  );
}
function CoopGoal() {
  return (
    <div className="px-4 py-2 grid gap-1.5 justify-items-center" style={{ ...paper, borderRadius: 22, width: 300 }}>
      <span className="flex items-center gap-2"><CatArt look={0} className="w-[38px] h-[38px]" /><b className="font-display text-3xl tabular-nums leading-none">14<span className="text-xl"> of 20 caught</span></b></span>
      <Meter segments={1} done={0} part={14 / 20} width="100%" label="14 of 20 mice caught" />
    </div>
  );
}
function TeamCounts() {
  return (
    <div className="flex gap-3">
      {([['Cats', 9, 'defender'], ['Mice', 7, 'invader']] as const).map(([n, v, side]) => (
        <span key={n} className="h-[56px] pl-2 pr-5 inline-flex items-center gap-2 rounded-full" style={{ background: SIDE_PASTEL[side], border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}` }}>
          {side === 'defender' ? <CatArt look={0} className="w-[44px] h-[44px]" /> : <MouseArt look={0} className="w-[46px] h-auto" />}
          <b className="text-xl">{n}</b><b className="font-display text-3xl tabular-nums">{v}</b>
        </span>
      ))}
    </div>
  );
}
function TerritoryCoop({ w: w0 = 1000, h: h0 = 625 }: { w?: number; h?: number }) {
  const phone = usePhone(); const w = phone ? 390 : w0, h = phone ? 844 : h0;
  return (
    <div className="relative overflow-hidden" style={{ width: w, height: h }}>
      <RoomArt className="absolute inset-0">
        <Animals cats={COOP_CATS} mice={COOP_MICE} />
        {/* a catch: the cat pounces and the mouse poofs away in a puff of stars */}
        <span style={at({ l: 34, t: 70, w: 9 })}><CatArt look={1} className="w-full h-auto block" /></span>
        <span style={at({ l: 41, t: 64, w: 10 })}><PoofArt className="w-full h-auto block" /></span>
      </RoomArt>
      <RoomStrip w={w} center={<CoopGoal />} />
      <div className="absolute left-5 bottom-5 z-20"><Burst text="Caught one!" size={phone ? 'text-xl' : 'text-2xl'} /></div>
    </div>
  );
}
function TerritoryComp({ w: w0 = 1000, h: h0 = 625 }: { w?: number; h?: number }) {
  const phone = usePhone(); const w = phone ? 390 : w0, h = phone ? 844 : h0;
  return (
    <div className="relative overflow-hidden" style={{ width: w, height: h }}>
      <RoomArt className="absolute inset-0">
        <Animals cats={COMP_CATS} mice={COMP_MICE} />
        {/* a mouse scares a cat out of the window: it leaps out, unhurt */}
        <span style={at({ l: 11, t: 13, w: 7, rot: -28 })}><CatArt look={4} className="w-full h-auto block" /></span>
        <span className="absolute" style={{ left: '18.5%', top: '20%', width: '4%' }} aria-hidden="true"><Doodle kind="sparkle" color={PP.lemon} size={26} /></span>
      </RoomArt>
      <RoomStrip w={w} center={<TeamCounts />} />
      <div className={`absolute z-20 ${phone ? 'left-3 bottom-4' : 'left-5 bottom-5'}`}><Burst text="A mouse scared a cat away!" size={phone ? 'text-lg' : 'text-2xl'} color={PP.paper} /></div>
    </div>
  );
}
const ROOM_ANS = [['A', 'Their', PP.periwinkle, PP.gamify], ['B', 'There', PP.sky, PP.blueCrystal], ['C', "They're", PP.pink, PP.blush], ['D', 'Thier', PP.lemon, PP.butter]] as const;
// The student's own device: the one question card over the room, their team and animal in the card.
function TerritoryStudent({ w: w0 = 820, h: h0 = 1180 }: { w?: number; h?: number }) {
  const phone = usePhone(); const w = phone ? 390 : w0, h = phone ? 844 : h0;
  const port = h > w;
  const k = port ? 1 : Math.min((w - 80) / 1088, (h - 120) / 528);
  const top = phone ? 24 : port ? 90 : 30;
  return (
    <div className="relative overflow-hidden" style={{ width: w, height: h }}>
      <RoomArt className="absolute inset-0"><Animals cats={COOP_CATS.slice(0, 2)} mice={COOP_MICE.slice(0, 2)} /></RoomArt>
      <div className="absolute left-1/2" style={{ top, transform: `translateX(-50%) scale(${k})`, transformOrigin: 'top center' }}>
        <QuestionCard tablet={port} q="Which word fits? ___ dog is fast." who={{ icon: <CatArt look={2} className={phone ? 'w-[38px] h-[38px]' : port ? 'w-[54px] h-[54px]' : 'w-[46px] h-[46px]'} />, name: 'Ava, Team Cats' }} answers={ROOM_ANS} right={0} />
      </div>
      <div className="absolute inset-x-0 grid justify-items-center" style={{ top: phone ? h - 92 : port ? 1040 : h - 76 }}><Burst text="Yes! A cat is on the way!" size={phone ? 'text-xl' : port ? 'text-4xl' : 'text-3xl'} /></div>
    </div>
  );
}
// The end: the room filled with the winner's color, then the one winner box.
function TerritoryEnd({ w: w0 = 1000, h: h0 = 625 }: { w?: number; h?: number }) {
  const phone = usePhone(); const w = phone ? 390 : w0, h = phone ? 844 : h0;
  const many: (Spot & { look: number })[] = Array.from({ length: 14 }, (_, i) => ({ l: 6 + ((i * 37) % 86), t: 60 + ((i * 23) % 28), w: 5, look: i % 3 }));
  return (
    <Results wash={PP.gamify} title="Team Mice wins!" winner={<MouseArt look={0} className="w-[120px] h-auto" />} score="12 mice in the room" missed={3}
      game={<div className="relative overflow-hidden" style={{ width: w, height: h }}><RoomArt className="absolute inset-0"><Animals mice={many} /></RoomArt></div>} />
  );
}

// ================= every view (teacher, 2026-11-23: "show me every view:
// lobby, teacher screen, student, share, etc. for all games") =================
// Overlays wear the universal look: one flat paper card (no tape, no second
// sheet), Grow Year caps titles, yellow go buttons with ink text. Every menu is centered (teacher, 2026-11-23);
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
  return <h2 style={{ ...GY, fontSize: size }}><GText>{children}</GText></h2>;
}
function Second({ children }: { children: ReactNode }) {
  return <span className="min-h-12 px-6 rounded-full font-bold text-lg inline-flex items-center gap-2" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}>{children}</span>;
}
function Dim({ children, over, wash }: { children: ReactNode; over: ReactNode; wash?: string }) {
  return (
    <div className="w-full h-full relative">
      {children}
      <div className="absolute inset-0 z-30" style={wash ? { background: wash, opacity: 0.72 } : { background: 'rgba(29,26,51,0.5)' }} />
      <div className="absolute inset-0 z-40 grid place-items-center">{over}</div>
    </div>
  );
}
// ---------- Power-up moment (over the dimmed game) ----------
function PowerMoment({ game, id, name, job, picks }: { game: ReactNode; id: PowerId; name: string; job: string; picks?: string[] }) {
  if (usePhone()) return (
    <Dim over={
      <div className="w-[340px] p-5 grid justify-items-center gap-3 text-center" style={{ ...paper, borderRadius: 26, boxShadow: `0 6px 0 ${I}` }}>
        <div className="w-28 h-28 grid place-items-center"><CrayonPowerUp id={id} size={100} /></div>
        <FitTitle center max={42} min={28}>{name}</FitTitle>
        <span className="font-bold text-[19px] leading-snug">{job}</span>
        {picks ? <div className="grid gap-2 w-full">{picks.map((p, i) => <span key={p} className="min-h-[52px] px-4 rounded-full font-bold text-[18px] flex items-center gap-2" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}><Badge t={TEAMS[[0, 2, 3][i] ?? 0]} size={28} />{p}</span>)}</div>
          : <MainBtn>Continue<ArrowRight weight="bold" size={22} /></MainBtn>}
      </div>
    }>{game}</Dim>
  );
  return (
    <Dim over={
      <div className="relative">
        <Confetti marks={[['sparkle', PP.lemon, -44, -24, 34], ['star', PP.pink, 400, -20, 30], ['dot', PP.sky, -30, 230, 16], ['heart', PP.pink, 410, 250, 24]]} />
        <div className="w-[400px] p-6 grid justify-items-center gap-3 text-center" style={{ ...paper, borderRadius: 28, boxShadow: `0 6px 0 ${I}` }}>
          <div className="relative w-36 h-36 grid place-items-center"><span className="relative"><CrayonPowerUp id={id} size={120} /></span></div>
          <Title size={48}>{name}</Title>
          <span className="font-bold text-xl">{job}</span>
          {picks ? <div className="flex flex-wrap justify-center gap-2">{picks.map((p, i) => <span key={p} className="min-h-[52px] px-4 rounded-full font-bold flex items-center gap-2" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}><Badge t={TEAMS[[0, 2, 3][i] ?? 0]} size={24} />{p}</span>)}</div>
            : <MainBtn>Continue<ArrowRight weight="bold" size={22} /></MainBtn>}
        </div>
      </div>
    }>{game}</Dim>
  );
}
// ---------- Results box (see-through over the game) ----------
// The winner box (teacher, 2026-11-24): the winner's icon with no circle or
// backing in THE glow, then only the score or XP, centered, in Grow Year a
// little smaller than the title; no stat chips.
function Results({ game, title, winner, score, missed = 2, wash }: { game: ReactNode; title: string; winner: ReactNode; score: string; missed?: number; wash?: string }) {
  if (usePhone()) return (
    <Dim wash={wash} over={
      <Sheet w={350} pad={20}>
        <FitTitle center max={42} min={28}>{title}</FitTitle>
        <span className="my-2"><TurnGlow>{winner}</TurnGlow></span>
        <b className="text-[32px] tabular-nums" style={GY}><GText>{score}</GText></b>
        <div className="grid gap-2.5 w-full"><MainBtn wide><ArrowsClockwise weight="bold" size={20} />Play again</MainBtn>
          <div className="grid grid-cols-2 gap-2">{['New game', `Review ${missed} missed`].map((t) => <span key={t} className="min-h-[52px] px-2 rounded-full font-bold text-[17px] leading-tight grid place-items-center text-center" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}>{t}</span>)}</div></div>
      </Sheet>
    }>{game}</Dim>
  );
  return (
    <Dim wash={wash} over={
      <div className="relative w-[560px]">
        <Confetti marks={[['sparkle', PP.lemon, -40, 10, 36], ['star', PP.pink, 560, -10, 30], ['heart', PP.pink, -30, 300, 24], ['sparkle', PP.paper, 570, 280, 28], ['dot', PP.sky, 530, 150, 16]]} />
        <Sheet w={560} pad={28}>
          <span className="relative z-10"><Title size={48}>{title}</Title></span>
          <span className="my-3"><TurnGlow>{winner}</TurnGlow></span>
          <b className="relative z-10 text-[38px] tabular-nums" style={GY}><GText>{score}</GText></b>
          <div className="flex flex-wrap justify-center gap-3"><MainBtn><ArrowsClockwise weight="bold" size={20} />Play again</MainBtn><Second>New game</Second><Second>Review {missed} missed</Second></div>
        </Sheet>
      </div>
    }>{game}</Dim>
  );
}

// ---------- the view list for each game: ONLY its themable in-game views ----------
// (teacher, 2026-11-23: "game mockups should only be in-game specific; things
// that can be redone with new themes"). Every shared screen lives on Universal views.
// Every view has a landscape design (1000 x 625) and a portrait one (820 x
// 1180), so no device frame letterboxes a design into dead bands.
type View = { name: string; land: ReactNode; port: ReactNode; note: string };
const ALL_VIEWS: Record<string, { uses: string; views: View[] }> = {
  'game-show': {
    uses: 'Welcome, How will you play (Share, Solo), Share a join code, Question set, Options, Teams, Power-up setup, Question screen, Results, Settings, Pause.',
    views: [
      { name: 'Solo: you vs computer', land: <GameShowLaptop vs />, port: <GameShowTablet vs noPop />, note: 'Two sides, You and the computer with a fun name (Goofy Lamp here, a new one each game); Butter shading shows whose turn.' },
      { name: 'Power-up: Swap Spinner', land: <PowerMoment game={<GameShowLaptop noPop />} id="swap" name="Swap Spinner" job="Trade your whole score with a team." picks={['Team Purple', 'Team Pink', 'Team Lemon']} />, port: <PowerMoment game={<GameShowTablet noPop />} id="swap" name="Swap Spinner" job="Trade your whole score with a team." picks={['Team Purple', 'Team Pink', 'Team Lemon']} />, note: 'Picks a team with shape badges, never color alone.' },
      { name: 'Celebration', land: <Results game={<GameShowLaptop noPop />} title="Team Sky wins!" winner={<Badge t={TEAMS[1]} size={110} />} score="160 points" />, port: <Results game={<GameShowTablet noPop />} title="Team Sky wins!" winner={<Badge t={TEAMS[1]} size={110} />} score="160 points" />, note: 'The winner in the turn glow over the studio.' },
    ],
  },
  'castle-quest': {
    uses: 'Welcome, How will you play (Share, Solo), Share a join code, Question set, Options, Teams, Power-up setup, Question screen, Results, Settings, Pause.',
    views: [
      { name: 'Solo: you vs computer', land: <BoardLaptop vs />, port: <BoardTablet vs />, note: 'Two pawns; just the die (it wiggles on hover); your race row is shaded.' },
      { name: 'Power-up: Tornado', land: <PowerMoment game={<BoardLaptop />} id="tornado" name="Tornado" job="Whoosh! Every player lands on a new square." />, port: <PowerMoment game={<BoardTablet />} id="tornado" name="Tornado" job="Whoosh! Every player lands on a new square." />, note: 'Found on a hidden square.' },
      { name: 'Celebration', land: <Results game={<BoardLaptop />} title="Team Sky wins!" winner={<CrayonPawn color={PP.sky} size={110} />} score="120 XP" />, port: <Results game={<BoardTablet />} title="Team Sky wins!" winner={<CrayonPawn color={PP.sky} size={110} />} score="120 XP" />, note: 'The winner\'s pawn in the turn glow.' },
    ],
  },
  'match-three': {
    uses: 'Welcome, Question set, Options, Power-up setup, Question screen, Results, Settings, Pause. Solo only, so no How will you play.',
    views: [
      { name: 'Power-up: Fireball', land: <PowerMoment game={<MatchThreeLaptop />} id="lightning" name="Fireball" job="Pops every piece of one kind." />, port: <PowerMoment game={<MatchThreeTablet />} id="lightning" name="Fireball" job="Pops every piece of one kind." />, note: 'Kit has no fireball yet; lightning stands in.' },
      { name: 'Celebration', land: <Results game={<MatchThreeLaptop />} title="You got 2 stars!" winner={<StarGoal got={2} size={60} />} score="260 points" />, port: <Results game={<MatchThreeTablet />} title="You got 2 stars!" winner={<StarGoal got={2} size={60} />} score="260 points" />, note: 'Stars, not a rank.' },
    ],
  },
  'four-in-a-row': {
    uses: 'Welcome, How will you play (Share, Solo), Question set, Options, Power-up setup, Question screen, Results, Settings, Pause.',
    views: [
      { name: 'Solo: you vs computer', land: <FourLaptop vs />, port: <FourTablet vs />, note: 'Your piece waits over its column; the computer has a fun name.' },
      { name: 'Power-up: Pop Out', land: <PowerMoment game={<FourLaptop vs />} id="swap" name="Pop Out" job="Pull out a bottom piece; the rest fall down." />, port: <PowerMoment game={<FourTablet vs />} id="swap" name="Pop Out" job="Pull out a bottom piece; the rest fall down." />, note: 'Kit has no key art; swap stands in.' },
      { name: 'Celebration', land: <Results game={<FourLaptop />} title="Leo wins!" winner={<Disc p={2} s={110} />} score="90 XP" />, port: <Results game={<FourTablet />} title="Leo wins!" winner={<Disc p={2} s={110} />} score="90 XP" />, note: 'The winning piece in the turn glow.' },
    ],
  },
  'bubble-pop': {
    uses: 'Welcome, Question set, Options, Power-up setup, Question screen, Results, Settings, Pause. Solo only, so no How will you play.',
    views: [
      { name: 'Power-up: Mystery Box', land: <PowerMoment game={<BubbleLaptop />} id="mystery-box" name="Mystery Box" job="A surprise: 10 to 100 points!" />, port: <PowerMoment game={<BubbleTablet />} id="mystery-box" name="Mystery Box" job="A surprise: 10 to 100 points!" />, note: 'Opens with a bob and a pop.' },
      { name: 'Celebration', land: <Results game={<BubbleLaptop />} title="You did it!" winner={<Bubble k={4} s={110} />} score="340 points" />, port: <Results game={<BubbleTablet />} title="You did it!" winner={<Bubble k={4} s={110} />} score="340 points" />, note: 'Your points, not a rank.' },
    ],
  },
  bowling: {
    uses: 'Welcome, How will you play (Share, Solo), Share a join code, Question set, Options, Teams and players, Power-up setup, Question screen, Results, Settings, Pause.',
    views: [
      { name: 'Solo: alone', land: <BowlingLaptop solo />, port: <BowlingTablet solo />, note: 'One row on the ten-frame sheet, your pins on the left, no turn chip.' },
      { name: 'Power-up: Bumper Rails', land: <PowerMoment game={<BowlingLaptop />} id="shield" name="Bumper Rails" job="No gutter ball on your next roll." />, port: <PowerMoment game={<BowlingTablet />} id="shield" name="Bumper Rails" job="No gutter ball on your next roll." />, note: 'Shield art carries the job.' },
      { name: 'Celebration', land: <Results game={<BowlingLaptop />} title="Ava wins!" winner={<Ball c={PP.periwinkle} s={110} />} score="146 pins" />, port: <Results game={<BowlingTablet />} title="Ava wins!" winner={<Ball c={PP.periwinkle} s={110} />} score="146 pins" />, note: 'The winning ball in the turn glow.' },
    ],
  },
  territory: {
    uses: 'Welcome, How will you play (Live only), Question set, Teacher: how the class plays (Cooperative or Competitive, pace), Join code, Student join and name, Lobby, Question screen, Results, Settings, Pause. No power-ups.',
    views: [
      { name: 'Competitive class screen', land: <TerritoryComp />, port: <TerritoryComp w={820} h={1180} />, note: 'Cats vs Mice counts on each team\'s pastel with its animal (never color alone); a mouse scares a cat out of the window, unhurt.' },
      { name: 'Student device', land: <TerritoryStudent w={1000} h={625} />, port: <TerritoryStudent />, note: 'The one question card over the room; the student\'s name, team and animal in the card.' },
      { name: 'Results', land: <TerritoryEnd />, port: <TerritoryEnd w={820} h={1180} />, note: 'The room fills with the winner\'s color, then the one winner box.' },
    ],
  },
  'star-quiz': {
    uses: 'Welcome, How will you play (Live, Solo), Question set, Teacher: how the class plays (Cooperative or Competitive), Join code, Student join and name, Lobby, Question screen, Results, Settings, Pause. No power-ups in this game.',
    views: [
      { name: 'Live student: waiting', land: <SkyWaiting w={1000} h={625} />, port: <SkyWaiting />, note: 'The game\'s own sky, the student\'s star (the glow is for winners only).' },
      { name: 'Solo: in play', land: <StudentDevice solo w={1000} h={625} />, port: <StudentDevice solo />, note: 'The one universal question card in the game\'s sky.' },
      { name: 'Class screen: celebration', land: <Results game={<ClassScreen />} title="We filled the sky!" winner={<NightStar kind={2} color={PP.lemon} size={110} />} score="30 stars" missed={4} />, port: <Results game={<ClassScreen w={820} h={1180} />} title="We filled the sky!" winner={<NightStar kind={2} color={PP.lemon} size={110} />} score="30 stars" missed={4} />, note: 'One class win, no ranks in Cooperative.' },
    ],
  },
};

// Welcome covers (teacher, 2026-11-23: "welcome previews need to be improved and
// more reperesentative of the game"): a real miniature of each game in play,
// cut from its in-play art at the welcome cover size (720 x 648).
// The whole in-play screen, nothing cropped, as a framed screen on a pastel mat
// with doodle confetti in the bands above and below.
// Cover TEMPLATES (teacher, 2026-11-24: "cover images should just show the
// main game boards ... these need to be templates where the layout can be
// redone with the future themes"). One layout for every game at 720 x 648:
// the theme's background fills the whole cover; the theme's main board sits
// centered in the safe area (48px in from every edge), scaled to fit. No top
// strip, buttons, scoreboard, power-ups, banners or words. A future theme
// passes its own background and board pieces and its cover redraws itself.
type CoverPieces = { back: ReactNode; board: ReactNode };
function CoverTemplate({ back, board }: CoverPieces) {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ width: 720, height: 648 }}>
      <div className="absolute inset-0">{back}</div>
      <div className="absolute" style={{ inset: 48 }}><AutoFit>{board}</AutoFit></div>
    </div>
  );
}
const ground = (id: string) => <div className="w-full h-full" style={pat(id)} />;
function GameShowCover({ back = <StudioBack w={720} h={648} /> }: { back?: ReactNode }) {
  return <CoverTemplate back={back} board={<div className="w-[560px]"><Marquee bulbs={16}><div className="grid grid-cols-4 gap-2.5">{GS_CARDS.map((c, i) => <GSCard key={i} c={c} />)}</div></Marquee></div>} />;
}
function BoardCover({ back = <ParkBack w={720} h={648} /> }: { back?: ReactNode }) {
  return <CoverTemplate back={back} board={<div className="p-4" style={{ ...quiet, border: `4px solid ${I}`, borderRadius: 28, boxShadow: `0 6px 0 ${I}` }}><BoardGrid w={560} h={460} pawns={[{ t: 0, at: 12 }, { t: 1, at: 15 }, { t: 3, at: 7 }]} /></div>} />;
}
function MatchThreeCover({ back = ground('cutpaper-pastel') }: { back?: ReactNode }) {
  return <CoverTemplate back={back} board={<M3Board s={66} bare />} />;
}
function FourCover({ back = ground('squiggle-pastel') }: { back?: ReactNode }) {
  return <CoverTemplate back={back} board={<div className="pb-6"><F4Board s={66} win={false} /></div>} />;
}
function BubbleCover({ back = ground('doodle') }: { back?: ReactNode }) {
  return <CoverTemplate back={back} board={<BubbleBoard w={400} bare />} />;
}
function BowlingCover() {
  // The lane is the board and its own background: the alley wall, lane, pins and ball.
  return <div className="absolute inset-0" style={{ width: 720, height: 648 }}><AlleyStage w={720} h={648} top={200} wide /></div>;
}
function TerritoryCover() {
  return <div className="absolute inset-0" style={{ width: 720, height: 648 }}><RoomArt className="absolute inset-0"><Animals cats={COOP_CATS.slice(0, 3)} mice={COOP_MICE} /></RoomArt></div>;
}
function SkyCover() {
  return <div className="absolute inset-0" style={{ width: 720, height: 648 }}><SkyScene w={720} h={648} got={26} /></div>;
}
export const GAME_COVERS: { id: string; name: string; desc: string; modes: string[]; steps: [string, string, string]; cover: ReactNode }[] = [
  { id: 'game-show', name: 'Game Show', desc: 'Answer to pick a surprise card. Most points wins.', modes: ['Share', 'Solo'], steps: ['Answer the question', 'Pick a surprise card', 'Most points wins'], cover: <GameShowCover /> },
  { id: 'castle-quest', name: 'Board Game', desc: 'Answer, roll the die and race to the finish.', modes: ['Share', 'Solo'], steps: ['Answer right to roll', 'Move that many squares', 'First to the finish wins'], cover: <BoardCover /> },
  { id: 'match-three', name: 'Match Three', desc: 'Swap pieces to make rows of three. Answer for more moves.', modes: ['Solo'], steps: ['Swap two pieces', 'Make a row of 3', 'Answer for more moves'], cover: <MatchThreeCover /> },
  { id: 'four-in-a-row', name: 'Four in a Row', desc: 'Answer, then drop your piece. Four in a line wins.', modes: ['Share', 'Solo'], steps: ['Answer the question', 'Drop your piece', 'Four in a line wins'], cover: <FourCover /> },
  { id: 'bubble-pop', name: 'Bubble Pop', desc: 'Answer to load bubbles, then aim and pop.', modes: ['Solo'], steps: ['Answer to load bubbles', 'Aim and shoot', 'Match 3 to pop'], cover: <BubbleCover /> },
  { id: 'bowling', name: 'Bowling', desc: 'Answer right to roll. Knock down the most pins.', modes: ['Share', 'Solo'], steps: ['Answer right to roll', 'Aim and add spin', 'Most pins wins'], cover: <BowlingCover /> },
  { id: 'territory', name: 'Territory', desc: 'Mice sneak into the living room. Every right answer sends a cat to catch one.', modes: ['Live'], steps: ['Answer on your device', 'Right sends a cat', 'Catch them all, or win the room'], cover: <TerritoryCover /> },
  { id: 'star-quiz', name: 'Question Tracker', desc: 'Every right answer adds a star until the sky is full.', modes: ['Live', 'Solo'], steps: ['Answer a question', 'Right adds a star', 'Fill the whole sky'], cover: <SkyCover /> },
];

// ================= the tab =================
const GAMES: { id: string; name: string; laptop: ReactNode; tablet: ReactNode; lines: [string, string, string] }[] = [
  {
    id: 'game-show', name: 'Game Show', laptop: <GameShowLaptop />, tablet: <GameShowTablet />,
    lines: [
      'New: a flat crayon TV studio (pink curtains, lavender spotlights, lemon stage) around a purple bulb marquee; card backs are butter with a sparkle, never a number; won cards turn the team\'s pastel with its shape badge; power-ups are the shared crayon set.',
      'Why: the busy art stays on the edges and the board is calm (figure-ground), so 25 kids find the cards at a glance; shape plus color names each team (WCAG 1.4.1); Butter shading on the score row means "your turn" everywhere, with no turn banner.',
      'Pieces (theme template): Background 1920 x 1080 (board zone blocked out, about the middle 60%), Card back 300 x 220, Grid square 300 x 180, Team icon 256 x 256 (up to 10), Power-up 256 x 256 (4 Classic, up to 6), Cover 600 x 600, Title 1200 x 360. Cover template 720 x 648: the studio background edge to edge, the card board (4 x 3 cards in the marquee) centered in the 48px safe area.',
    ],
  },
  {
    id: 'castle-quest', name: 'Board Game', laptop: <BoardLaptop />, tablet: <BoardTablet />,
    lines: [
      'New: a paper-craft park (sky, clouds, two hills, flowers) with the board on a quiet paper mat; four pastel regular squares in turn, ink Lose a turn and paper Roll again squares, no numbers; bright crayon pawns; her one-side die on its own, tapped to roll, with a hover wiggle.',
      'Why: pastel squares with bright pawns keep the pieces the figure and the trail the ground, so "where am I?" reads in one look; icons, not words, mark the special squares for pre-readers (dual coding).',
      'Pieces (theme template): Background 1600 x 1200 (board zone blocked out), 4 regular squares, Lose, Roll again, Start and Finish 256 x 256 each, Die 1536 x 256 (six sides in a row), Team piece 256 x 256 (up to 10), Power-up 256 x 256 (6 Classic), Cover 600 x 600, Title 1200 x 360. Cover template 720 x 648: the park background, the path of squares on its mat with three pawns, centered in the 48px safe area.',
    ],
  },
  {
    id: 'match-three', name: 'Match Three (Solo)', laptop: <MatchThreeLaptop />, tablet: <MatchThreeTablet />,
    lines: [
      'New: a pastel cut-paper desk around a checker board; the six pieces are six shapes (circle, star, heart, diamond, triangle, square) in six brights; line and rainbow pieces read by their stripes and rings; score, moves and the three-star goal on one paper strip, no player icon.',
      'Why: shape plus color lets color-blind players and pre-readers find matches (WCAG 1.4.1, dual coding); the star goal makes progress visible (goal-gradient effect); busy pattern only outside the board.',
      'Pieces (theme template): Background 1600 x 1200, Board 900 x 900, six Pieces 128 x 128, four special pieces 128 x 128 (sideways line, up and down line, bomb, rainbow), Power-up 256 x 256 (5 Classic, up to 6), Cover 600 x 600, Title 1200 x 360. Cover template 720 x 648: the stage pattern edge to edge, the 7 x 7 board of pieces centered in the 48px safe area.',
    ],
  },
  {
    id: 'four-in-a-row', name: 'Four in a Row (Share, Solo vs computer)', laptop: <FourLaptop />, tablet: <FourTablet />,
    lines: [
      'New: a sky blue crayon frame on legs with paper holes, standing on the pastel squiggle ground; Gamify purple pieces with a dot and lemon pieces with a star; the next piece waits over its column; Leo\'s win line gets a lemon band and a burst.',
      'Why: a mark inside each piece keeps the two sides apart without color (WCAG 1.4.1); the waiting piece shows what a tap will do before it happens (feedforward); the player whose turn it is is shaded Butter, the same cue as every game.',
      'Pieces (theme template): Background 1600 x 1200, Board 1000 x 860 (frame with holes), Player 1 and Player 2 pieces 128 x 128, Team icon 256 x 256 (up to 10), Power-up 256 x 256 (Double Drop, Pop Out; up to 4), Cover 600 x 600, Title 1200 x 360. Cover template 720 x 648: the stage pattern, the frame with a few pieces centered in the 48px safe area.',
    ],
  },
  {
    id: 'bubble-pop', name: 'Bubble Pop (Solo)', laptop: <BubbleLaptop />, tablet: <BubbleTablet />,
    lines: [
      'New: a doodle-scatter wall around a Blue crystal board (no more navy) with the real 19-bubble rows; ink-edged bright bubbles with a shine, every other color with a center dot; a dotted aim line, the next bubble beside the shooter, a dashed pink danger line.',
      'Why: the light board lifts contrast for every bubble on a projector (WCAG 1.4.11 non-text contrast); the aim line and next bubble cut planning load (cognitive load); score and bubbles left sit outside the play area, no player icon.',
      'Pieces (theme template): Background 1600 x 1200, Board 1000 x 1300, six Bubbles 128 x 128, Power-up 256 x 256 (4 Classic, up to 6), Cover 600 x 600, Title 1200 x 360. Cover template 720 x 648: the stage pattern, the bubble board (rows and the shooter, no labels) centered in the 48px safe area.',
    ],
  },
  {
    id: 'bowling', name: 'Bowling (Share, Solo)', laptop: <BowlingLaptop />, tablet: <BowlingTablet />,
    lines: [
      'New: a one-point perspective lane seen from behind the ball: peach boards narrowing to a full ten-pin triangle, lavender gutters each side, orange aim arrows and dots, the ball at the bottom with a dotted aim arrow to the head pin; a standard ten-frame sheet (two roll boxes a frame, three in the 10th, X, / and -, running totals) and a Frame X of 10 tracker.',
      'Why: the familiar bowler\'s view needs no teaching (recognition over recall); the lane is the brightest, simplest shape so eyes go to it first (visual hierarchy); a real score sheet teaches how bowling is scored, and frames, not rounds, match what kids see at a real alley.',
      'Pieces (theme template): Background 1000 x 1300 (alley wall), Lane 800 x 1000, Pin 64 x 200, Ball 256 x 256 (up to 10, each player\'s icon), Power-up 256 x 256 (7 Classic), Cover 600 x 600, Title 1200 x 360. Cover template 720 x 648: the alley wall on the top 31%, the lane, pins and ball filling the rest.',
    ],
  },
  {
    id: 'territory', name: 'Territory (Live: Cooperative and Competitive)', laptop: <TerritoryCoop />, tablet: <TerritoryCoop w={820} h={1180} />,
    lines: [
      'New: the live game\'s own Classic living room (butter striped wallpaper, a white baseboard with the arched mouse hole, peach planks, teal couch, pink rug) with its six cat looks and brown, gray and white mice; the Cooperative screen shows the class goal (a cat, 14 of 20 caught, the one meter), the Competitive screen the two team counts on Peach (Cats) and Gamify pastel (Mice); just the join code in a white pill; the one tool group with the hint.',
      'Why: one shared goal on the projector builds relatedness (self-determination theory) and the meter shows how close the class is (goal-gradient effect); a caught mouse poofs in stars and a scared cat leaps out the window, so the stakes feel playful and nothing is ever hurt; each team is an animal plus a color (WCAG 1.4.1).',
      'Pieces (theme template, from its manifest): Room 1600 x 1000 (bottom 40% is the floor), Entrance 200 x 180, six Defenders 256 x 256, three Invaders 256 x 180, Poof 256 x 256, Cover 600 x 600, Title 1200 x 360. Cover template 720 x 648: the room centered with its scenery around it, three cats and three mice, the mouse hole showing.',
    ],
  },
  {
    id: 'star-quiz', name: 'Question Tracker (Live: class screen and a student device)', laptop: <ClassScreen />, tablet: <StudentDevice />,
    lines: [
      'New (teacher, 2026-11-24: her favorite live version, kept as original as possible): the whole stage is her deep navy night sky with soft cloud bands, white twinkles and glints, filling with her six star shapes (skinny spiky, tipped, bright five-point, four-point sparkle, fat rounded, shooting star) in flat Lemon, Butter and a touch of Orange, no outlines, many sizes and turns (glowing orange for a first-try streak); the join code, the class goal card with its progress bar and who is playing sit on paper cards; the student device shows the same sky around the question card.',
      'Why: one shared goal builds relatedness and lowers social comparison (self-determination theory); the goal bar shows how close the class is without empty placeholder shapes (goal-gradient effect); answers are about 112px tall for small fingers (WCAG 2.5.5).',
      'Pieces (theme template): Background 1600 x 1000 (the scene that fills), six Items 256 x 256 (a star, a fish...), Cover 600 x 600, Title 1200 x 360. Cover template 720 x 648: the night sky edge to edge filled with 26 items. No power-ups in this game today.',
    ],
  },
];

// Letterbox ground per game, matched to its stage edge, so a frame of another
// shape shows more of the same world, not a band.
const GROUND: Record<string, CSSProperties> = {
  'game-show': { background: PP.grape }, 'castle-quest': { background: PP.kelly }, 'match-three': { background: PP.butter },
  'four-in-a-row': { background: PP.blueCrystal }, 'bubble-pop': { background: PP.aqua }, bowling: { background: PP.lavender }, territory: { background: PP.peach }, 'star-quiz': { background: NIGHT },
};
function ViewStrip({ id }: { id: string }) {
  const v = ALL_VIEWS[id];
  if (!v) return null;
  const g = GROUND[id];
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {v.views.map((x, n) => (
        <figure key={x.name} className="m-0 grid gap-1.5 content-start">
          <figcaption className="font-heading text-sm">{n + 1}. {x.name}</figcaption>
          <DeviceSet land={x.land} port={x.port} landSize={[1000, 625]} ground={g} />
          <span className="text-xs font-semibold text-muted">{x.note}</span>
        </figure>
      ))}
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
          <div className="grid gap-8 lg:grid-cols-[18rem_1fr] items-start">
            {/* Welcome cover (teacher, 2026-11-24: covers live here, not on Universal views). */}
            <figure className="m-0 grid gap-2 content-start">
              <figcaption className="font-heading text-sm">Welcome cover (template)</figcaption>
              {(() => { const c = GAME_COVERS.find((x) => x.id === g.id); return c ? <div className="rounded-[1rem] overflow-hidden border-2 border-black"><Fit w={720} h={648}><div className="relative w-full h-full">{c.cover}</div></Fit></div> : null; })()}
              <span className="text-xs font-semibold text-muted">Cover template, 720 x 648: the theme background edge to edge, the main board centered in the 48px safe area; no strip, buttons or words.</span>
            </figure>
            <figure className="m-0 grid gap-2 content-start">
              <figcaption className="font-heading text-sm">In play</figcaption>
              <DeviceSet land={g.laptop} port={g.tablet} landSize={[1000, 625]} ground={GROUND[g.id]} />
            </figure>
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
