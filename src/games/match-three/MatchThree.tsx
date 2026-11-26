import { useMemo, useRef, useState } from 'react';
import HintButton from '../../engine/HintButton';
import { impact } from '../../engine/impact';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowsLeftRight, Cookie, Diamond, Question, Sparkle } from '@phosphor-icons/react';
import { PUZZLE_PACK_CLEARED } from '../../config';
import { useMySets } from '../../data/hooks';
import { LIBRARY } from '../../data/library';
import { buzz, playEffect } from '../../engine/feedback';
import ResultsModal from '../../engine/ResultsModal';
import { usePlayClock } from '../../engine/playClock';
import { useAsk } from '../../engine/useAsk';
import { t } from '../../i18n';
import type { StringKey } from '../../i18n/en';
import { FullScreenButton, GameTopRow, GearButton, SettingsPanel } from '../../settings/SettingsPanel';
import CloseGameButton from '../../engine/CloseGameButton';
import { useSettings } from '../../settings/SettingsContext';
import { ChoiceRow, Slider } from '../../ui/fields';
import GameWelcome from '../GameWelcome';
import SetPicker from '../SetPicker';
import SetupWizard from '../SetupWizard';
import { matchThreeManifest } from './manifest';
import { useSavedSetup } from '../useSavedSetup';
import { usePowerUps } from '../../engine/usePowerUps';
import { powerUpSwitches } from '../../engine/PowerUpSwitches';
import { PowerUpTray, useHeldPowerUps } from '../../engine/HeldPowerUps';
import SoloLayout, { SoloMeter, SoloScore } from '../../engine/SoloStrip';
import { Doodle, type DoodleKind } from '../../brand/CrayonKit';
import { PATTERNS } from '../../brand/PatternProposal';
import { useStageColor } from '../../theme/stageColor';
import type { GameTheme } from '../../theme/types';
import { ClassicPiece, PIECE_COLORS } from './pieces';
import { useGamePool } from '../../student/session';
import { pieceFill, pieceImage } from '../../theme/library';
import { ThemedPage, useGameTheme } from '../../theme/useGameTheme';
import ThemeScreen from '../ThemeScreen';

import { clearAndRefill, createGrid, findMatches, fire, hasAnyValidMove, isAdjacent, pointsFor, rainbowSwap, resolveMatches, swapTiles, wouldMatch, type Clear, type Grid, type Pos, type Special } from './matchThree';


// Classic look (approved mockup, teacher 2026-11-24): six bold shapes in six
// brights (pieces.tsx), each its own shape AND color, never color alone, on a
// Lavender and Blue crystal checker, on a pastel cut-paper desk. Library and
// class-made themes swap in artwork per piece, board and background.
const pattern = (id: string, calm: boolean) => PATTERNS.find((p) => p.id === id)!.make(calm);
// Lemon for a star won; Lavender for the ones still to win, so they read on
// the Paper meter pill and results box (Classic Art Director, 2026-11-26).
const STAR_WON = '#fabe37', STAR_EMPTY = '#ddd6ff';
const SPARK_KINDS: DoodleKind[] = ['sparkle', 'star', 'dot', 'sparkle'];
type Phase = 'welcome' | 'theme' | 'setup' | 'play' | 'end';
// Combo words grow with the chain (Golden Rule pass, 2026-10-31).
const CALLOUTS = ['m3.nice', 'm3.great', 'm3.amazing', 'm3.incredible'] as const;
// The star goal: points for 1, 2 and 3 stars, from the moves in the game
// and the board size (bigger boards chain more). Tuned so a careful player
// earns 3 and most players earn 1 or 2 (Claudia's simulation, 2026-10-31).
const starGoals = (totalMoves: number, size: number) => [40, 80, 125].map((k) => Math.round((totalMoves * k * (size / 7) ** 1.5) / 10) * 10);
const SPECIAL_KEY: Record<Special, StringKey> = { row: 'm3.special.row', col: 'm3.special.col', burst: 'm3.special.burst', rainbow: 'm3.special.rainbow' };

export default function MatchThree() {
  const { settings } = useSettings();
  const { theme, themes, playable, choose } = useGameTheme('match-three');
  const still = settings.motion === 'still';
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const [setup, change] = useSavedSetup('match-three', { setId: LIBRARY[0].id, rounds: 3, perBreak: 2, moves: 3, size: 7, powerUps: true , powerOff: [] as string[]});
  const setId = sets.some((s) => s.id === setup.setId) ? setup.setId : LIBRARY[0].id;
  const chosen = useMemo(() => sets.filter((s) => s.id === setId).map((set) => ({ set, starred: false })), [sets, setId]);
  const game = useGamePool(chosen);
  const { ask, cancel, asking, element, missed } = useAsk({ gameId: 'match-three', mode: 'solo', pool: game.pool, classroomId: game.classroomId, studentId: game.studentId });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('welcome');
  const plan = useRef({ rounds: 3, perBreak: 2, moves: 3, size: 7 });
  const ROWS = plan.current.size;
  const COLS = plan.current.size;
  const MOVES_PER_ROUND = plan.current.moves;
  const [grid, setGrid] = useState<Grid>(() => createGrid(7, 7));
  const [selected, setSelected] = useState<Pos | null>(null);
  const [popping, setPopping] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [moves, setMoves] = useState(MOVES_PER_ROUND);
  const [note, setNote] = useState('');
  const [shake, setShake] = useState<string | null>(null);
  const drag = useRef<{ pos: Pos; x: number; y: number } | null>(null);
  // Effects: beams and bursts from special pieces, sparks from popped pieces,
  // and a combo word over the board.
  const [fx, setFx] = useState<{ id: number; special: Special; row: number; col: number }[]>([]);
  const [sparks, setSparks] = useState<{ id: number; seed: number; row: number; col: number; color: string }[]>([]);
  const [callout, setCallout] = useState<{ id: number; text: string; x: number; y: number } | null>(null);
  // Classic draws its own board (paper with the checker); a theme's board wins.
  const classicBoard = !theme.pieces.board;
  const goals = starGoals(plan.current.rounds * plan.current.moves, plan.current.size);
  const stars = goals.filter((g) => score >= g).length;
  // Points land as each clear pops; a star pops when a goal line is passed.
  const scoreNow = useRef(0);
  scoreNow.current = score;
  function addScore(n: number) {
    if (!n) return;
    const before = goals.filter((x) => scoreNow.current >= x).length;
    scoreNow.current += n;
    setScore(scoreNow.current);
    if (goals.filter((x) => scoreNow.current >= x).length > before) { playEffect('win', settings); if (settings.celebrations !== 'off' && !still) void confetti({ particleCount: 40, spread: 60, origin: { x: 0.85, y: 0.3 }, disableForReducedMotion: true }); }
  }
  // Calm motion: the special pieces stop their endless spin and glow.
  const loop = settings.motion === 'full';
  // Power-ups after a question break: more moves, bonus points, or a doubled match.
  // Held power-ups (teacher, 2026-10-31): one earned at a question break is
  // ready for the next round, listed under the score, and gone after it.
  const powers = usePowerUps(matchThreeManifest, theme, setup.powerUps, setup.powerOff ?? []);
  const held = useHeldPowerUps();
  const doubleNext = useRef(false);
  const wait = (ms: number) => new Promise((r) => window.setTimeout(r, still ? Math.min(ms, 80) : ms));

  function start() {
    plan.current = { rounds: setup.rounds, perBreak: setup.perBreak, moves: setup.moves, size: setup.size };
    const ROWS = setup.size, COLS = setup.size, MOVES_PER_ROUND = setup.moves;
    setGrid(createGrid(ROWS, COLS));
    setScore(0); setRound(1); setMoves(MOVES_PER_ROUND); setNote(''); setSelected(null);
    doubleNext.current = false;
    held.reset();
    setPhase('play');
  }

  // Use a held power-up: its Classic role happens now.
  async function applyItem(i: number) {
    if (busy) return;
    const it = held.use(i);
    if (!it) return;
    playEffect('win', settings);
    if (it.ability === 'moves') setMoves((m) => m + powers.amount(it));
    if (it.ability === 'bonus') addScore(powers.amount(it));
    if (it.ability === 'double') { doubleNext.current = true; setNote(t('bm.doubleReady')); }
    if (it.ability === 'shuffle') { setGrid(createGrid(ROWS, COLS)); setNote(t('bm.shuffled')); }
    if (it.ability === 'blast') {
      // Color blast: every piece of the most common kind pops at once.
      setBusy(true);
      const counts = new Map<number, number>();
      grid.forEach((row) => row.forEach((tl) => counts.set(tl.kind, (counts.get(tl.kind) ?? 0) + 1)));
      const kind = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
      const m = new Set<string>();
      grid.forEach((row, rr) => row.forEach((tl, cc) => { if (tl.kind === kind) m.add(`${rr},${cc}`); }));
      // Special pieces caught in the blast go off too.
      const fired = fire(grid, m, new Set());
      const run = await runClears(grid, { cleared: m, made: [], fired }, [], 1);
      await reshuffleIfStuck(run.g);
      setBusy(false);
    }
  }

  // Pop a clear, then keep going while new matches form (a cascade). Special
  // pieces fire beams and bursts; each link in the chain scores more.
  async function runClears(start: Grid, first: Clear | null, swapped: Pos[], mult: number): Promise<{ g: Grid; gained: number }> {
    let g = start;
    let gained = 0;
    for (let cascade = 1; cascade <= 12; cascade++) {
      const res = first ?? (findMatches(g).size ? resolveMatches(g, cascade === 1 ? swapped : []) : null);
      first = null;
      if (!res) break;
      const id = Date.now() + cascade;
      // The spot where a special piece is born does not pop: it turns into it.
      const born = new Set(res.made.map((m) => `${m.pos.row},${m.pos.col}`));
      setPopping(new Set([...res.cleared].filter((k) => !born.has(k))));
      if (!still) {
        setFx(res.fired.map((f, k) => ({ id: id + k / 100, special: f.special, row: f.pos.row, col: f.pos.col })));
        setSparks([...res.cleared].slice(0, 40).map((k, n) => { const [row, col] = k.split(',').map(Number); const kind = g[row][col].kind; return { id: id + n / 1000, seed: n * 1.7 + cascade, row, col, color: kind < 0 || kind > 5 ? '#fabe37' : PIECE_COLORS[kind] }; }));
      }
      const pts = (pointsFor(res.cleared.size, cascade) + res.fired.length * 20) * mult;
      // The points burst sits just above the middle of what popped (mockup:
      // "MATCH! +30"); its word grows with the chain or names the special.
      const cells = [...res.cleared].map((k) => k.split(',').map(Number));
      const cx = cells.reduce((n, [, c]) => n + c, 0) / cells.length, top = Math.min(...cells.map(([r]) => r)), low = Math.max(...cells.map(([r]) => r));
      // Above the match, or under it when the match is on the top row.
      const cy = top >= 1 ? top - 0.35 : low + 1.35;
      const word = res.fired.length ? t(SPECIAL_KEY[res.fired[0].special]) : cascade >= 2 ? t(CALLOUTS[Math.min(CALLOUTS.length, cascade - 1) - 1]) : t('m3.match');
      setCallout({ id, text: `${word} +${pts}`, x: Math.min(78, Math.max(22, ((cx + 0.5) / COLS) * 100)), y: Math.min(93, (cy / ROWS) * 100) });
      playEffect(res.fired.length || cascade >= 3 ? 'win' : 'right', settings, undefined, 1 + Math.min(cascade - 1, 6) * 0.09);
      if (cascade >= 3) impact(settings, cascade >= 4);
      buzz(res.fired.length ? 40 : 20, settings);
      await wait(res.fired.length ? 420 : 380);
      gained += pts;
      addScore(pts);
      g = clearAndRefill(g, res.cleared, Math.random, res.made);
      setPopping(new Set());
      setGrid(g);
      if (res.made.length) playEffect('tap', settings);
      await wait(340);
    }
    setFx([]); setSparks([]);
    return { g, gained };
  }

  async function reshuffleIfStuck(g: Grid) {
    if (hasAnyValidMove(g)) return;
    setNote(t('bm.shuffle'));
    await wait(700);
    setGrid(createGrid(ROWS, COLS));
  }

  async function trySwap(a: Pos, b: Pos) {
    if (busy || !isAdjacent(a, b)) return;
    setSelected(null);
    if (!wouldMatch(grid, a, b)) {
      setShake(`${b.row},${b.col}`);
      setNote(t('bm.noMove'));
      playEffect('miss', settings);
      window.setTimeout(() => setShake(null), 400);
      return;
    }
    setBusy(true);
    setNote('');
    let g = swapTiles(grid, a, b);
    setGrid(g);
    playEffect('whoosh', settings);
    await wait(220);
    const mult = doubleNext.current ? 2 : 1;
    doubleNext.current = false;
    const run = await runClears(g, rainbowSwap(g, a, b), [a, b], mult);
    g = run.g;
    await reshuffleIfStuck(g);
    const left = moves - 1;
    setMoves(left);
    if (left === 0) {
      setNote(t('bm.answerToGo'));
      held.endTurn(); // unused power-ups are gone after the round
      await wait(500);
      const done = await ask({ count: plan.current.perBreak });
      if (!done || round >= plan.current.rounds) { finish(); setBusy(false); return; }
      setRound((r) => r + 1);
      const it = powers.grant(true);
      setMoves(MOVES_PER_ROUND);
      if (it) held.earn('solo', it);
      held.beginTurn('solo');
      setNote('');
    }
    setBusy(false);
  }

  function finish() {
    setPhase('end');
    playEffect('win', settings);
    if (settings.celebrations !== 'off' && !still) void confetti({ particleCount: settings.celebrations === 'big' ? 140 : 50, spread: 80, origin: { y: 0.6 }, disableForReducedMotion: true });
  }  // The teacher's play clock or score goal ends the game the usual way (2026-10-31).
  const clock = usePlayClock({ playing: phase === 'play', score, onTimeUp: () => { if (asking) cancel(); else finish(); } });


  function tap(pos: Pos) {
    if (busy || phase !== 'play') return;
    playEffect('tap', settings);
    if (!selected) { setSelected(pos); return; }
    if (selected.row === pos.row && selected.col === pos.col) { setSelected(null); return; }
    if (isAdjacent(selected, pos)) void trySwap(selected, pos);
    else setSelected(pos);
  }

  // Swiping a gem also swaps it (unless the player chose tap only).
  function onPointerUp(e: React.PointerEvent, pos: Pos) {
    if (!e.nativeEvent.isTrusted) return;
    const d = drag.current;
    drag.current = null;
    if (!d || settings.tapOnly) { tap(pos); return; }
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) { tap(d.pos); return; }
    const to = Math.abs(dx) > Math.abs(dy) ? { row: d.pos.row, col: d.pos.col + Math.sign(dx) } : { row: d.pos.row + Math.sign(dy), col: d.pos.col };
    if (to.row >= 0 && to.row < ROWS && to.col >= 0 && to.col < COLS) void trySwap(d.pos, to);
  }

  return (
    <ThemedPage theme={theme} menu={phase !== 'play' && phase !== 'end'}>
    <main className={phase === 'play' || phase === 'end' ? '!p-0' : 'w-full px-4 sm:px-6 pt-6 pb-6'}>
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context="match-three" />
      {clock.element}
      {phase === 'play' || phase === 'end' ? <h1 className="sr-only">{t('bm.title')}</h1> : <GameTopRow hint="match-three" onSettings={() => setSettingsOpen(true)} />}

      {phase === 'welcome' && (
        <GameWelcome game={matchThreeManifest} cover={pieceImage(theme, 'cover')} onStart={() => setPhase(themes.length > 1 ? 'theme' : 'setup')} steps={[
          { icon: <ArrowsLeftRight weight="bold" size={22} />, text: t('bm.how1') },
          { icon: PUZZLE_PACK_CLEARED ? <Diamond weight="fill" size={22} /> : <Cookie weight="fill" size={22} />, text: t('bm.how2') },
          { icon: <Sparkle weight="fill" size={22} />, text: t('bm.how4') },
          { icon: <Question weight="bold" size={22} />, text: t('bm.how3') },
        ]} />
      )}

      {phase === 'theme' && (
        <ThemeScreen gameName={matchThreeManifest.name} current={theme} themes={themes} playable={playable} onChoose={choose} onBack={() => setPhase('welcome')} onNext={() => setPhase('setup')} />
      )}

      {phase === 'setup' && (
        <SetupWizard onBack={() => setPhase(themes.length > 1 ? 'theme' : 'welcome')} onPlay={start} pages={[
          ...(game.assigned ? [] : [{ id: 'questions', title: t('setup.questions'), content: <SetPicker sets={sets} value={[setId]} onChange={(ids) => change({ setId: ids[0] })} /> }]),
          { id: 'options', title: t('setup.options'), content: (
            <>
              <Slider label={t('bm.rounds')} hint={t('bm.roundsHint')} min={1} max={10} value={setup.rounds} onChange={(v) => change({ rounds: v })} />
              <Slider label={t('bm.movesEach')} hint={t('bm.movesHint')} min={2} max={6} value={setup.moves} onChange={(v) => change({ moves: v })} />
              {powerUpSwitches({ manifest: matchThreeManifest, theme, on: setup.powerUps, off: setup.powerOff ?? [], change })}
              <Slider label={t('bm.perBreak')} hint={t('bm.perBreakHint')} min={1} max={5} value={setup.perBreak} onChange={(v) => change({ perBreak: v })} />
              <ChoiceRow label={t('bm.size')} value={String(setup.size)} onChange={(v) => change({ size: Number(v) })}
                options={[6, 7, 8].map((n) => ({ value: String(n), label: t(n === 6 ? 'bm.size.small' : n === 7 ? 'bm.size.medium' : 'bm.size.big'), art: <SizeMock n={n} /> }))} />
            </>
          ) },
        ]} />
      )}

      {(phase === 'play' || phase === 'end') && (
        // THE solo board-game layout (approved mockup, teacher 2026-11-24): the
        // meter with the moves on top, the score (XP) at the top right with the
        // held power-ups under it, centered on it; the board in the middle.
        <SoloLayout
          ground={<Ground theme={theme} />}
          tools={<span className="flex items-center gap-2 [&_button]:!w-11 [&_button]:!h-11">
            {/* One order everywhere (Brand Kit, 2026-11-24): Hint, Settings, Full screen, Close. */}
            <HintButton gameId="match-three" />
            <GearButton small onClick={() => setSettingsOpen(true)} />
            <FullScreenButton small />
            <CloseGameButton />
          </span>}
          meter={<SoloMeter text={t('m3.movesLeft', { count: moves })} label={t('bm.round', { n: round, total: plan.current.rounds })} meterLabel={t('bm.moves', { count: moves })} round={round} rounds={plan.current.rounds} perRound={MOVES_PER_ROUND} left={moves}
            goal={<StarGoal score={score} stars={stars} goals={goals} still={still} />} />}
          score={<SoloScore score={score}><PowerUpTray manifest={matchThreeManifest} items={held.held} onUse={(i) => void applyItem(i)} disabled={busy || phase !== 'play'} /></SoloScore>}
          board={
          <div className="relative w-full h-full p-[2.2%] rounded-[1.5rem] border-[4px] border-border" style={{ ...(classicBoard ? { background: 'var(--paper)' } : pieceFill(theme, 'board', '#ffffff')), boxShadow: '0 6px 0 var(--color-border)' }}>
            {note && <p className="absolute left-1/2 -top-4 -translate-x-1/2 z-10 max-w-[90%] text-center rounded-pill border-std border-border bg-surface px-3 py-0.5 text-sm font-bold" role="status">{note}</p>}
            <div className="relative w-full h-full">
            {/* The checker under the pieces: one square per cell (pattern rule). */}
            <div role="grid" aria-label={t('bm.title')} className="grid w-full h-full select-none touch-none rounded-[1rem]" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`, ...(classicBoard ? { ...pattern('checker', settings.calm), backgroundSize: `${200 / COLS}% ${200 / ROWS}%` } : {}) }}>
              {grid.map((row, r) => <div key={r} role="row" className="contents">{row.map((tileItem, c) => {
                const key = `${r},${c}`;
                const isSel = selected?.row === r && selected?.col === c;
                const sp = tileItem.special;
                const pop = popping.has(key);
                const kindName = sp === 'rainbow' ? t('m3.rainbow') : `${theme.pieces[`tile-${tileItem.kind}`]?.alt ?? t(`bm.${PUZZLE_PACK_CLEARED ? "gem" : "kind"}.${tileItem.kind}` as StringKey)}${sp ? `, ${t(SPECIAL_KEY[sp])}` : ''}`;
                return (
                  <motion.button
                    key={tileItem.id}
                    layout={!still}
                    type="button"
                    role="gridcell"
                    aria-label={`${t('bm.tile', { kind: kindName, row: r + 1, col: c + 1 })}${isSel ? `, ${t('bm.selected')}` : ''}`}
                    aria-selected={isSel}
                    disabled={phase !== 'play'}
                    // Motion turns Enter into a made-up pointer press for whileTap;
                    // only real fingers and mice count, or Enter would pick and
                    // drop the same piece at once (keyboard players, 2026-11-19).
                    onPointerDown={(e) => { if (!e.nativeEvent.isTrusted) return; drag.current = { pos: { row: r, col: c }, x: e.clientX, y: e.clientY }; }}
                    onPointerUp={(e) => onPointerUp(e, { row: r, col: c })}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap({ row: r, col: c }); } }}
                    initial={still ? false : sp ? { scale: 1.8, opacity: 0 } : { y: -40, opacity: 0 }}
                    whileHover={still || phase !== 'play' ? undefined : { scale: 1.1, rotate: (r + c) % 2 ? 4 : -4 }}
                    whileTap={still ? undefined : { scale: 0.88 }}
                    // A match swells and wobbles, then pops; a wrong swap shakes.
                    animate={pop ? { scale: [1, 1.22, 1.22, 0], opacity: [1, 1, 1, 0], rotate: [0, -6, 6, 0] } : shake === key ? { x: [0, -5, 5, -3, 3, 0] } : isSel ? { scale: still ? 1 : 1.12, opacity: 1, y: 0, x: 0, rotate: 0 } : { scale: 1, opacity: 1, y: 0, x: 0, rotate: 0 }}
                    // Pieces fall with a little bounce, one column just after the
                    // next, so a refill ripples across the board.
                    transition={pop ? { duration: still ? 0.05 : 0.38, times: [0, 0.35, 0.7, 1] } : { type: 'spring', stiffness: 520, damping: 24, delay: still || isSel ? 0 : c * 0.025, opacity: { duration: 0.2 } }}
                    // No colored square behind a piece (teacher, 2026-11-18): just the piece.
                    className={`relative aspect-square rounded-full flex items-center justify-center ${isSel ? 'z-10' : ''}`}
                  >
                    {/* Picked: a Lemon ring around the piece. Popping: a Butter glow behind it. */}
                    {(isSel || pop) && <span aria-hidden="true" className="absolute inset-[4%] rounded-full border-[3px] pointer-events-none" style={{ background: pop ? 'var(--butter)' : 'transparent', borderColor: pop ? 'var(--lemon)' : 'var(--color-border)', boxShadow: '0 0 0 3px var(--lemon)' }} />}
                    {(() => {
                      // A piece made by a combo is its own design (teacher, 2026-11-18:
                      // like a wrapped candy): a theme's picture for it, else Classic's.
                      const made = sp ? pieceImage(theme, `special-${sp}`) : undefined;
                      if (made) return <img src={made} alt="" aria-hidden="true" draggable="false" className={`relative w-[92%] h-[92%] object-contain pointer-events-none ${loop ? 'm3-pulse' : ''}`} />;
                      const own = sp === 'rainbow' ? undefined : pieceImage(theme, `tile-${tileItem.kind}`);
                      if (own) return <img src={own} alt="" aria-hidden="true" draggable="false" className="relative w-[84%] h-[84%] object-contain pointer-events-none" />;
                      return <ClassicPiece kind={tileItem.kind} made={sp} className={`relative w-[78%] h-[78%] pointer-events-none ${sp === 'rainbow' && loop ? 'm3-spin' : sp && loop ? 'm3-pulse' : ''}`} />;
                    })()}
                  </motion.button>
                );
              })}</div>)}
            </div>
            {/* Beams, bursts, sparks and the points, over the board. */}
            <div className="absolute inset-0 pointer-events-none overflow-visible" aria-hidden="true">
              {fx.map((f) => {
                const cell = { left: `${(f.col / COLS) * 100}%`, top: `${(f.row / ROWS) * 100}%`, width: `${100 / COLS}%`, height: `${100 / ROWS}%` };
                if (f.special === 'row') return <motion.span key={f.id} className="absolute left-0 right-0 rounded-pill border-[3px] border-border" style={{ top: cell.top, height: cell.height, background: 'linear-gradient(90deg, #fff1b8, #fabe37 50%, #fff1b8)' }} initial={{ scaleX: 0, opacity: 1 }} animate={{ scaleX: 1, opacity: [1, 1, 0] }} transition={{ duration: 0.42 }} />;
                if (f.special === 'col') return <motion.span key={f.id} className="absolute top-0 bottom-0 rounded-pill border-[3px] border-border" style={{ left: cell.left, width: cell.width, background: 'linear-gradient(180deg, #fff1b8, #fabe37 50%, #fff1b8)' }} initial={{ scaleY: 0, opacity: 1 }} animate={{ scaleY: 1, opacity: [1, 1, 0] }} transition={{ duration: 0.42 }} />;
                return <motion.span key={f.id} className="absolute rounded-full" style={{ left: `calc(${cell.left} + ${50 / COLS}%)`, top: `calc(${cell.top} + ${50 / ROWS}%)`, width: f.special === 'rainbow' ? '160%' : `${300 / COLS}%`, aspectRatio: '1', x: '-50%', y: '-50%', border: '6px solid #fabe37', background: f.special === 'rainbow' ? 'radial-gradient(circle, transparent 55%, rgba(255,255,255,0.6) 60%, transparent 70%)' : 'radial-gradient(circle, #fffaf0, #fff1b8 60%, transparent 70%)', borderColor: f.special === 'rainbow' ? '#6a45f0' : '#fabe37' }} initial={{ scale: 0.1, opacity: 1 }} animate={{ scale: 1, opacity: 0 }} transition={{ duration: 0.45, ease: 'easeOut' }} />;
              })}
              {/* Doodle confetti from each popped piece: sparkles, stars and dots in its color. */}
              {sparks.flatMap((sp) => [0, 1, 2, 3].map((k) => {
                const a = (k / 4) * Math.PI * 2 + sp.seed;
                const dist = 28 + ((sp.seed * 97 + k * 13) % 20);
                return <motion.span key={`${sp.id}-${k}`} className="absolute" style={{ left: `${((sp.col + 0.5) / COLS) * 100}%`, top: `${((sp.row + 0.5) / ROWS) * 100}%`, marginLeft: -9, marginTop: -9 }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0.6, rotate: 0 }} animate={{ x: Math.cos(a) * dist, y: Math.sin(a) * dist + 12, opacity: 0, scale: 1.1, rotate: 90 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
                  <Doodle kind={SPARK_KINDS[k]} color={k === 3 ? '#fffaf0' : sp.color} size={18} />
                </motion.span>;
              }))}
              <AnimatePresence>
                {callout && (
                  // The points burst (mockup: "MATCH! +30"): a flat Lemon pill over the match.
                  <motion.p key={callout.id} className="absolute z-20 m-0" style={{ left: `${callout.x}%`, top: `${callout.y}%`, x: '-50%', y: '-50%' }}
                    initial={still ? { opacity: 0 } : { scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0, y: '-120%' }} transition={still ? { duration: 0.01 } : { type: 'spring', stiffness: 380, damping: 15 }}
                    onAnimationComplete={() => { const id = callout.id; window.setTimeout(() => setCallout((c) => (c?.id === id ? null : c)), 650); }}>
                    <span className="inline-flex items-center px-[0.9em] py-[0.25em] rounded-full whitespace-nowrap uppercase leading-none bg-[var(--lemon)] text-[var(--ink)] border-[3px] border-border" style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 'calc(var(--solo-board) * 0.05)', boxShadow: '0 4px 0 var(--color-border)' }}>{callout.text}</span>
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            </div>
          </div>
          } />
      )}

      {phase === 'end' && (
        <ResultsModal winners={pieceImage(theme, 'player') ? [{ name: t('mm.you'), colorIndex: 0, art: pieceImage(theme, 'player') }] : undefined} title={t('bm.done', { score })} missed={missed} againLabel={t('share.again')} onAgain={() => setPhase('welcome')}>
          <ResultStars stars={stars} />
        </ResultsModal>
      )}
      {powers.element}
      {element}
    </main>
    </ThemedPage>
  );
}

// A small picture of each board size, so the choice reads at a glance
// (teacher, 2026-11-18: "show board grid sizes"). Same box, more pieces.
// The palette's pastel pairs (owner, 2026-11-26: the new colors).
const MOCK = ['#bfdff3', '#ffd3e6', '#fff1b8', '#c8f0dc', '#ddd6ff', '#ffd9b3'];
function SizeMock({ n }: { n: number }) {
  return (
    <span className="grid gap-[2px] p-1 rounded-md border-thin border-border bg-white" style={{ gridTemplateColumns: `repeat(${n}, 1fr)`, width: 64, height: 64 }} aria-hidden="true">
      {Array.from({ length: n * n }, (_, i) => <span key={i} className="rounded-[2px]" style={{ background: MOCK[(i * 7 + Math.floor(i / n)) % MOCK.length] }} />)}
    </span>
  );
}

// The stars won, in the results box.
export function ResultStars({ stars }: { stars: number }) {
  return <p className="flex items-center justify-center gap-1" aria-label={t('m3.goal', { stars })}>{[0, 1, 2].map((i) => <Doodle key={i} kind="star" color={stars > i ? STAR_WON : STAR_EMPTY} size={40} />)}</p>;
}

// The three stars of the goal, at the right end of the meter pill: Lemon
// doodle stars when earned, Lavender ones still to win; each pops as it lands.
function StarGoal({ score, stars, goals, still }: { score: number; stars: number; goals: number[]; still: boolean }) {
  return (
    <span className="flex gap-1 shrink-0" role="meter" aria-label={t('m3.goal', { stars })} aria-valuenow={Math.min(score, goals[2])} aria-valuemin={0} aria-valuemax={goals[2]}>
      {goals.map((g, i) => (
        <motion.span key={g} className="grid" animate={stars > i && !still ? { scale: [1, 1.6, 1], rotate: [0, 25, 0] } : { scale: 1 }} transition={{ duration: 0.5 }}>
          <Doodle kind="star" color={stars > i ? STAR_WON : STAR_EMPTY} size={30} />
        </motion.span>
      ))}
    </span>
  );
}

// The stage ground. Classic: the pastel cut-paper desk (calm: the softer
// version; plain backgrounds: flat cream). A theme's background picture or
// the teacher's own stage color wins.
function Ground({ theme }: { theme: GameTheme }) {
  const { settings } = useSettings();
  const stage = useStageColor(theme.gameId);
  if (pieceImage(theme, 'background')) return <div className="absolute inset-0" style={pieceFill(theme, 'background', theme.colors.background)} aria-hidden="true" />;
  if (stage || theme.source !== 'house' || theme.name !== 'Classic') return null;
  const plain = settings.backgrounds === 'plain';
  return <div className="absolute inset-0" style={plain ? { background: '#f6f0e4' } : { backgroundColor: '#f6f0e4', ...pattern('cutpaper-pastel', settings.calm) }} aria-hidden="true" />;
}
