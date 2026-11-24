import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, type TargetAndTransition, type Transition } from 'motion/react';
import { t } from '../../i18n';
import { useSettings } from '../../settings/SettingsContext';
import { playClip } from '../../engine/music';
import { useGameMusic } from '../../engine/music';
import type { GameTheme } from '../../theme/types';
import { pieceImage } from '../../theme/library';
import { pieceFor } from './looks';
import type { LivePlayer } from '../../live/protocol';
import Title from '../../ui/Title';
import { CatArt, INK, MouseArt, PoofArt, RoomArt, SIDE_COLOR, SIDE_PASTEL, SideBadge, useRoomFit, type RoomFit } from './art';
import { LEAVE_MS, SPOTS, add, competeRight, stagePieces, count, newRights, newRoom, sweep, tick, togetherDone, togetherRight, winner, type CompeteRule, type Pace, type Piece, type Room, type Side } from './logic';

// Territory's class screen (teacher, 2026-11-24): the living room on the
// projector. Together: the class's cats catch the mice that come out of the
// mouse hole, one for every right answer. Compete: the Cats team and the Mice
// team; every right answer adds one of yours and sends one of theirs away.
// Nobody is ever hurt: a caught mouse poofs away in a puff of stars, a
// scared cat leaps out the window.

export const SOUNDS = {
  scurry: '/sounds/library/transition/swipe-fx-1.mp3',
  pounce: '/sounds/board/jump.mp3',
  poof: '/sounds/library/pop-bubble/pop-fx-2.mp3',
  cheer: '/sounds/library/success-power-up/celebration-fx-1.mp3',
  music: '/sounds/game-show/music-cards.mp3',
};

// Dev builds and local test builds only (never a real site): localStorage 'dev:territory-seed' = N fills the room with up
// to N of each side, so the Art Director can review a full room on screenshots.
function devSeed(r: Room): Room {
  if (!import.meta.env.DEV && location.hostname !== 'localhost') return r;
  let n = 0; try { n = Number(localStorage.getItem('dev:territory-seed')) || 0; } catch { n = 0; }
  let out = r; const at = Date.now() - LEAVE_MS * 2;
  for (const side of ['defender', 'invader'] as Side[]) while (count(out, side) < n) { const next = add(out, side, at); if (next === out) break; out = next; }
  return out;
}

export interface RoomSummary { defenders: number; invaders: number; caught: number; scared: number }

type Note = { id: number; text: string; side: Side };

export default function TerritoryStage({ theme, players, mode, teams, pace, rule, goal, phase, onSummary, onGoal }: {
  theme: GameTheme; players: LivePlayer[]; mode: 'together' | 'compete'; teams: Record<string, Side>;
  pace: Pace; rule: CompeteRule; goal: number; phase: 'play' | 'paused' | 'ended';
  onSummary: (s: RoomSummary) => void; onGoal: () => void;
}) {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const inRoom = players.filter((p) => p.status === 'in');
  const [room, setRoomState] = useState<Room>(() => devSeed(newRoom(mode, Date.now(), inRoom.length)));
  // The room lives in a ref too, so sounds and notes run once per change.
  const roomRef = useRef(room);
  const setRoom = (r: Room) => { roomRef.current = r; setRoomState(r); };
  const [now, setNow] = useState(Date.now());
  const [note, setNote] = useState<Note | null>(null);
  useGameMusic(phase === 'play', SOUNDS.music, settings);

  // The Together clock: new mice at the teacher's pace, waiting catches, and
  // tidy-up. Paused stops the clock (the next mouse waits its full time).
  const pausedAt = useRef<number | null>(null);
  useEffect(() => {
    if (phase === 'paused') { pausedAt.current = Date.now(); return; }
    if (pausedAt.current !== null) { const gap = Date.now() - pausedAt.current; pausedAt.current = null; setRoom({ ...roomRef.current, lastSpawn: roomRef.current.lastSpawn + gap }); }
    if (phase !== 'play') return;
    const id = window.setInterval(() => {
      const at = Date.now();
      const r = roomRef.current;
      setNow(at);
      if (mode !== 'together') { const n = sweep(r, at); if (n !== r) setRoom(n); return; }
      const next = tick(r, at, pace);
      if (next === r) return;
      if (count(next, 'invader') > count(r, 'invader')) { playClip(SOUNDS.scurry, settings, 0.5); setNote({ id: at, text: t('territory.peek'), side: 'invader' }); }
      if (next.caught > r.caught) catchFx('defender', null);
      setRoom(next);
    }, 400);
    return () => window.clearInterval(id);
  }, [phase, mode, pace]); // eslint-disable-line react-hooks/exhaustive-deps

  // Every new right answer from a student is a move in the room.
  const seen = useRef<Record<string, number>>(Object.fromEntries(players.map((p) => [p.pid, p.right])));
  useEffect(() => {
    if (phase === 'ended') return;
    const { gains, seen: next } = newRights(seen.current, inRoom);
    seen.current = next;
    if (!gains.length) return;
    const at = Date.now();
    setNow(at);
    let out = roomRef.current;
    for (const pid of gains) {
      const name = players.find((p) => p.pid === pid)?.name ?? '';
      if (mode === 'together') {
        const before = out.caught;
        out = togetherRight(out, at);
        catchFx('defender', out.caught > before ? name : null, name);
      } else {
        const side = teams[pid] ?? 'defender';
        out = competeRight(out, side, rule, at);
        catchFx(side, name);
      }
    }
    setRoom(out);
  }, [players]); // eslint-disable-line react-hooks/exhaustive-deps

  function catchFx(side: Side, name: string | null, waitingName?: string) {
    playClip(SOUNDS.pounce, settings, 0.55);
    window.setTimeout(() => playClip(SOUNDS.poof, settings, 0.7), 1300);
    if (mode === 'together') {
      setNote(name ? { id: Date.now(), text: t('territory.caught', { name }), side: 'defender' } : waitingName ? { id: Date.now(), text: t('territory.ready', { name: waitingName }), side: 'defender' } : { id: Date.now(), text: t('territory.caughtNext'), side: 'defender' });
    } else if (name) {
      setNote({ id: Date.now(), text: t(side === 'defender' ? (rule === 'add' ? 'territory.addCat' : 'territory.catMove') : (rule === 'add' ? 'territory.addMouse' : 'territory.mouseMove'), { name }), side });
    }
  }

  // The class screen tells every device how the room stands.
  const summary: RoomSummary = { defenders: count(room, 'defender'), invaders: count(room, 'invader'), caught: room.caught, scared: room.scared };
  const key = `${summary.defenders}|${summary.invaders}|${summary.caught}|${summary.scared}`;
  useEffect(() => { onSummary(summary); }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  // Together ends at the class goal, with a cheer.
  useEffect(() => { if (mode === 'together' && phase === 'play' && togetherDone(room, goal)) onGoal(); }, [room.caught]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (phase === 'ended') playClip(SOUNDS.cheer, settings, 0.8); }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const won = phase === 'ended' && mode === 'compete' ? winner(room) : null;
  // At most STAGE_CAP animals per side on show (logic.ts); the counts stay true.
  const shown = useMemo(() => stagePieces(room.pieces, now).sort((a, b) => SPOTS[a.spot][1] - SPOTS[b.spot][1]), [room.pieces, now]);
  const crowd = Math.max(0.8, 1 - 0.025 * Math.max(0, shown.filter((p) => !p.leaving).length - 16));
  const byId = useMemo(() => new Map(room.pieces.map((p) => [p.id, p])), [room.pieces]);
  const chases = useMemo(() => {
    const m = new Map<number, Piece>();
    for (const p of room.pieces) if (p.leaving?.by != null && now - p.leaving.at < LEAVE_MS) m.set(p.leaving.by, p);
    return m;
  }, [room.pieces, now]);
  const teamSize = (s: Side) => inRoom.filter((p) => (teams[p.pid] ?? 'defender') === s).length;

  return (
    <div className="absolute inset-0 grid grid-rows-[auto_minmax(0,1fr)_auto] portrait:grid-cols-1 landscape:grid-cols-[minmax(0,1fr)_15rem] gap-2 p-2 bg-[#b4c4fb]">
      {/* A: top strip, the goal that builds */}
      <div className="landscape:col-span-2 justify-self-center w-[min(44rem,calc(100%-24rem))] min-h-[3.25rem] flex items-center gap-3 px-4 py-2 rounded-pill bg-[#fffaf0] border-[3px] border-[#1d1a33]" style={{ boxShadow: `0 4px 0 ${INK}` }}>
        {mode === 'together' ? (
          <>
            <SideBadge side="invader" size="2.5rem" />
            <span className="font-display text-xl uppercase whitespace-nowrap"><Title text={t('territory.goal', { n: Math.min(room.caught, goal), goal })} /></span>
            <span className="flex-1 h-[22px] rounded-pill bg-[#bfdff3] border-[2.5px] border-[#1d1a33] overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.min(room.caught, goal)} aria-label={t('territory.goalBar')}>
              <motion.span className="block h-full bg-[#22b04a]" initial={false} animate={{ width: `${Math.min(100, (room.caught / goal) * 100)}%` }} transition={{ duration: still ? 0 : 0.6, ease: 'easeOut' }} />
            </span>
          </>
        ) : (
          <>
            <SideBadge side="defender" size="2.5rem" />
            <span className="font-display text-2xl tabular-nums" aria-label={t('territory.catsIn', { n: summary.defenders })}>{summary.defenders}</span>
            {/* Tug of war: each side's share of the room. */}
            <span className="flex-1 h-[22px] rounded-pill border-[2.5px] border-[#1d1a33] overflow-hidden flex" aria-hidden="true">
              <motion.span className="block h-full" style={{ background: SIDE_COLOR.defender }} initial={false} animate={{ width: `${summary.defenders + summary.invaders ? (summary.defenders / (summary.defenders + summary.invaders)) * 100 : 50}%` }} transition={{ duration: still ? 0 : 0.6 }} />
              <span className="block h-full flex-1" style={{ background: SIDE_COLOR.invader }} />
            </span>
            <span className="font-display text-2xl tabular-nums" aria-label={t('territory.miceIn', { n: summary.invaders })}>{summary.invaders}</span>
            <SideBadge side="invader" size="2.5rem" />
          </>
        )}
      </div>

      {/* The board: the living room */}
      <RoomArt background={pieceImage(theme, 'background')} entrance={pieceImage(theme, 'entrance')} className="min-h-0 rounded-panel border-[3px] border-[#1d1a33]">
        <div className="absolute inset-0" role="img" aria-label={mode === 'together' ? t('territory.roomTogether', { cats: summary.defenders, mice: summary.invaders }) : t('territory.roomCompete', { cats: summary.defenders, mice: summary.invaders })}>
          {shown.map((p) => <Animal key={p.id} piece={p} crowd={crowd} theme={theme} still={still} gentle={settings.motion !== 'full'} chase={chases.get(p.id)} chased={p.leaving?.by != null && byId.has(p.leaving.by)} />)}
          {!still && shown.filter((p) => p.leaving && p.side === 'invader').map((p) => <Poof key={`poof-${p.id}`} piece={p} crowd={crowd} theme={theme} chased={p.leaving!.by != null} />)}
        </div>
        {/* The winner's color fills the room at the end. */}
        <AnimatePresence>
          {won && (
            <motion.div key="fill" className="absolute inset-0" style={{ background: won === 'tie' ? `linear-gradient(90deg, ${SIDE_PASTEL.defender} 50%, ${SIDE_PASTEL.invader} 50%)` : SIDE_PASTEL[won] }}
              initial={{ opacity: 0, clipPath: still ? 'circle(150% at 50% 50%)' : 'circle(0% at 50% 60%)' }} animate={{ opacity: 0.6, clipPath: 'circle(150% at 50% 60%)' }} transition={{ duration: still ? 0.15 : 1.6, ease: 'easeOut' }} />
          )}
        </AnimatePresence>
        {/* C: the feedback line, until the next thing happens */}
        <div className="absolute inset-x-0 top-[4%] z-[3000] flex justify-center pointer-events-none px-4">
          <AnimatePresence mode="wait">
            {note && phase !== 'ended' && (
              <motion.p key={note.id} role="status" className="max-w-[86%] text-center font-display uppercase text-[clamp(1rem,min(2.2vw,3.4vh),1.9rem)] leading-tight px-5 py-1.5 rounded-pill border-[3px] border-[#1d1a33] flex items-center gap-2"
                style={{ background: note.side === 'defender' ? '#fff1b8' : '#fffaf0', boxShadow: `0 4px 0 ${INK}` }}
                initial={still ? { opacity: 0 } : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: still ? 0.15 : 0.6, ease: 'easeOut' }}>
                <Title text={note.text} />
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </RoomArt>

      {/* B: the right rail (a row under the room on a tall screen) */}
      <aside className="grid portrait:grid-flow-col portrait:auto-cols-fr landscape:content-start gap-2 min-h-0" aria-label={t('territory.rail')}>
        {(['defender', 'invader'] as const).map((s) => (
          <div key={s} className="rounded-panel border-[3px] border-[#1d1a33] p-2.5 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-0.5" style={{ background: SIDE_PASTEL[s], boxShadow: `0 4px 0 ${INK}` }}>
            <SideBadge side={s} look={s === 'defender' ? 0 : 1} size="3.25rem" />
            <span className="font-display uppercase text-lg leading-tight"><Title text={t(s === 'defender' ? 'territory.cats' : 'territory.mice')} /></span>
            <span className="col-start-2 font-display text-4xl tabular-nums leading-none">{s === 'defender' ? summary.defenders : summary.invaders}</span>
            <span className="col-span-2 font-bold text-sm">{mode === 'compete' ? t('territory.players', { count: teamSize(s) }) : t(s === 'defender' ? 'territory.classCats' : 'territory.inRoom')}</span>
          </div>
        ))}
        {mode === 'together' && (
          <div className="rounded-panel border-[3px] border-[#1d1a33] p-2.5 bg-[#c8f0dc] text-center" style={{ boxShadow: `0 4px 0 ${INK}` }}>
            <span className="block font-display text-4xl tabular-nums leading-none">{room.caught}</span>
            <span className="font-bold text-sm">{t('territory.caughtCount')}</span>
          </div>
        )}
      </aside>
    </div>
  );
}

// One animal. Positions are % of the room; motion moves it step by step.
function Animal({ piece, crowd, theme, still, gentle, chase, chased }: { piece: Piece; crowd: number; theme: GameTheme; still: boolean; gentle: boolean; chase?: Piece; chased: boolean }) {
  // The room fit (art.tsx) maps the logic rows onto this box's floor.
  const fit = useRoomFit();
  const [lx, ly] = SPOTS[piece.spot];
  const cat = piece.side === 'defender';
  const h = size(piece, fit, crowd);
  const x = clampX(fit.x(lx), h, fit); const y = fit.y(ly);
  const ENTRANCE = fit.entrance; const EXIT = fit.exit;
  const { img } = pieceFor(theme, piece.side, piece.look);
  const art = img ? <img src={img} alt="" className="w-full h-full object-contain" draggable="false" />
    : cat ? <CatArt look={piece.look} className="w-full h-full" /> : <MouseArt look={piece.look} className="w-full h-full" />;
  const [ex, ey] = cat ? [-6, y] : ENTRANCE;
  // New pieces come in: a mouse peeks out of the hole first, a cat walks in.
  const [fresh] = useState(() => Date.now() - piece.born < 1500 && !piece.leaving);
  const leave = piece.leaving;
  const { anim, trans, face } = useMemo((): { anim: TargetAndTransition; trans: Transition; face: number } => {
    if (still) return { anim: { left: pct(x), top: pct(y), opacity: leave ? 0 : 1, scale: 1 }, trans: { duration: leave ? 0.6 : 0.3, delay: leave ? 0.9 : 0 }, face: cat ? 1 : -1 };
    if (leave && cat) {
      // Scared away: a hop to the window, then out (no harm).
      return {
        anim: { left: [pct(x), pct(x), pct((x + EXIT[0]) / 2), pct(EXIT[0])], top: [pct(y), pct(y), pct(EXIT[1] - 8), pct(EXIT[1])], opacity: [1, 1, 1, 0], scale: [1, 1, 0.9, 0.6] },
        trans: { duration: 2.6, times: [0, chased ? 0.45 : 0.1, 0.75, 1], ease: 'easeInOut' }, face: EXIT[0] < x ? -1 : 1,
      };
    }
    if (leave) {
      // Caught: a little squash, then gone in a puff of stars.
      return { anim: { left: pct(x), top: pct(y), scale: [1, 1, 1.15, 0], opacity: [1, 1, 1, 0] }, trans: { duration: 2.2, times: [0, chased ? 0.55 : 0.2, 0.68, 0.85], ease: 'easeOut' }, face: -1 };
    }
    if (chase) {
      // Trot over to the one it is after, then home again.
      const [ltx, lty] = SPOTS[chase.spot];
      const tx = clampX(fit.x(ltx), h, fit); const ty = fit.y(lty);
      const nx = tx + (tx < x ? 3 : -3);
      return { anim: { left: [pct(x), pct(nx), pct(nx), pct(x)], top: [pct(y), pct(ty), pct(ty), pct(y)], scaleY: [1, 1, 0.86, 1], opacity: 1, scale: 1 }, trans: { duration: 3, times: [0, 0.42, 0.55, 1], ease: 'easeInOut' }, face: tx < x ? -1 : 1 };
    }
    return {
      anim: { left: pct(x), top: pct(y), opacity: 1, scale: 1 },
      trans: fresh ? { left: { delay: cat ? 0 : 1, duration: cat ? 2 : 1.6, ease: 'easeInOut' }, top: { delay: cat ? 0 : 1, duration: cat ? 2 : 1.6, ease: 'easeInOut' }, opacity: { duration: 0.5 }, scale: { duration: 0.8 } } : { duration: 0.4 },
      face: cat ? (x > 50 ? -1 : 1) : -1,
    };
  }, [still, leave?.at, chase?.id, fresh, fit.floor]); // eslint-disable-line react-hooks/exhaustive-deps
  const moving = !still && !gentle && (chase || fresh || (leave && cat));
  return (
    <motion.div className="absolute" style={{ height: `${h}%`, transition: 'height 0.4s ease', aspectRatio: '1', x: '-50%', y: '-100%', zIndex: cat ? Math.round(y * 2) : 1000 + Math.round(y * 2) }}
      initial={fresh && !still ? { left: pct(ex), top: pct(ey), opacity: 0, scale: cat ? 1 : 0.6 } : fresh ? { left: pct(x), top: pct(y), opacity: 0 } : false} animate={anim} transition={trans}>
      <motion.div className="w-full h-full" style={{ scaleX: face }} animate={moving ? { y: [0, -6, 0] } : { y: 0 }} transition={moving ? { duration: 0.42, repeat: 5, ease: 'easeInOut', delay: fresh && !cat ? 1 : 0 } : { duration: 0.2 }}>
        {art}
      </motion.div>
    </motion.div>
  );
}

const pct = (n: number) => `${n}%`;
// Farther back is a little smaller (2D depth); cats are bigger than mice.
// Big enough to read from the back of a room (Art Director, 2026-11-24): a
// front cat is about 23% of the room height, the smallest mouse 13.5%. On a
// tall (portrait) room the pieces cap at 15% (cats) and 11% (mice) of the
// room width, and mice start a little bigger so they still read.
// A crowded room shrinks everyone a little (never below 80%, cats 14% and
// mice 12% of the room height) so bodies overlap less.
function size(p: Piece, fit: RoomFit, crowd = 1) {
  const y = SPOTS[p.spot][1];
  const cat = p.side === 'defender';
  const h = (cat ? 20 : fit.aspect < 1 ? 17 : 15) * (0.9 + ((y - 64) / 23) * 0.25);
  return Math.min(Math.max(cat ? 14 : 12, h * crowd), (cat ? 15 : 11) / fit.ratio);
}
// Keep a piece's whole width inside the room, never touching an edge.
function clampX(x: number, h: number, fit: RoomFit) {
  const hw = (h * fit.ratio) / 2 + 1;
  return Math.max(hw, Math.min(100 - hw, x));
}

// The universal cue when a piece is caught: a small poof, then it is gone
// (teacher, 2026-11-24: "no poof [upload], it should have a small poof
// animation and then disappear as a universal cue"). Not a theme piece.
function Poof({ piece, crowd, chased }: { piece: Piece; crowd: number; theme?: GameTheme; chased: boolean }) {
  const fit = useRoomFit();
  const [lx, ly] = SPOTS[piece.spot];
  const x = clampX(fit.x(lx), size(piece, fit, crowd), fit); const y = fit.y(ly);
  const h = size(piece, fit, crowd) * 1.3;
  return (
    <motion.div className="absolute pointer-events-none" style={{ left: pct(x), top: pct(y - size(piece, fit, crowd) / 2), height: `${h}%`, aspectRatio: '1', x: '-50%', y: '-50%', zIndex: 2500 }}
      initial={{ opacity: 0, scale: 0.3, rotate: -20 }} animate={{ opacity: [0, 1, 1, 0], scale: [0.3, 1, 1.1, 1.2], rotate: [-20, 0, 10, 16] }} transition={{ duration: 0.9, delay: chased ? 1.2 : 0.4, times: [0, 0.25, 0.7, 1] }}>
      <PoofArt className="w-full h-full" />
    </motion.div>
  );
}
