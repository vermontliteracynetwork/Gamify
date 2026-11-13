import { useMemo, useRef, useState } from 'react';
import PopText from '../../ui/PopText';
import { impact } from '../../engine/impact';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowsDownUp, ArrowsLeftRight, Cake, Coffee, Cookie, Diamond, IceCream, Pizza, Popcorn, Question, Sparkle, Star, type Icon } from '@phosphor-icons/react';
import { PUZZLE_PACK_CLEARED } from '../../config';
import { useMySets } from '../../data/hooks';
import { LIBRARY } from '../../data/library';
import { buzz, playEffect } from '../../engine/feedback';
import SoloPanel from '../../engine/SoloPanel';
import ResultsModal from '../../engine/ResultsModal';
import { usePlayClock } from '../../engine/playClock';
import { useAsk } from '../../engine/useAsk';
import { t } from '../../i18n';
import type { StringKey } from '../../i18n/en';
import { AccessButton, FullScreenButton, GameTopRow, GearButton, SettingsPanel } from '../../settings/SettingsPanel';
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
import { useGamePool } from '../../student/session';
import { pieceFill, pieceImage } from '../../theme/library';
import { ThemedPage, useGameTheme } from '../../theme/useGameTheme';
import ThemeScreen from '../ThemeScreen';

import { clearAndRefill, createGrid, findMatches, fire, hasAnyValidMove, isAdjacent, pointsFor, rainbowSwap, resolveMatches, swapTiles, wouldMatch, type Clear, type Grid, type Pos, type Special } from './matchThree';


// Simple house look: each gem has its own shape AND color (never color
// alone). Library and class-made themes swap in artwork per tile.
// Classic tiles are gems (teacher, 2026-10-31): each a different shape and
// color, on a soft tile of its own color, so shape alone tells them apart.
const TILE_COLORS = PUZZLE_PACK_CLEARED ? ['#d6e8ff', '#ffd9dc', '#d4f5dc', '#fff4c2', '#eadcff', '#ffe2c7'] : ['#f2c27b', '#f6a5c0', '#9fd8f0', '#f7b267', '#fbe38a', '#c9a27e'];
const TILE_ICONS: Icon[] = [Cookie, Cake, IceCream, Pizza, Popcorn, Coffee];
const CLASSIC_GEM = (k: number) => `/classic/match-three/gem-${k}.webp`;
type Phase = 'welcome' | 'theme' | 'setup' | 'play' | 'end';
// Combo words grow with the chain (Golden Rule pass, 2026-10-31).
const CALLOUTS = ['m3.nice', 'm3.great', 'm3.amazing', 'm3.incredible'] as const;
const RAINBOW_BG = 'conic-gradient(from 0deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #b06bff, #ff6b6b)';
// The star goal: points for 1, 2 and 3 stars, from the moves in the game
// and the board size (bigger boards chain more). Tuned so a careful player
// earns 3 and most players earn 1 or 2 (Claudia's simulation, 2026-10-31).
const starGoals = (totalMoves: number, size: number) => [40, 80, 125].map((k) => Math.round((totalMoves * k * (size / 7) ** 1.5) / 10) * 10);
const METER = 1.08; // the bar runs a little past the third star
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
  const [sparks, setSparks] = useState<{ id: number; row: number; col: number; color: string }[]>([]);
  const [callout, setCallout] = useState<{ id: number; text: string } | null>(null);
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
        setSparks([...res.cleared].slice(0, 40).map((k, n) => { const [row, col] = k.split(',').map(Number); const kind = g[row][col].kind; return { id: id + n / 1000, row, col, color: kind < 0 ? '#fdfd94' : TILE_COLORS[kind] }; }));
      }
      const word = res.fired.length ? t(SPECIAL_KEY[res.fired[0].special]) : cascade >= 2 ? t(CALLOUTS[Math.min(CALLOUTS.length, cascade - 1) - 1]) : '';
      if (word) setCallout({ id, text: word });
      playEffect(res.fired.length || cascade >= 3 ? 'win' : 'right', settings, undefined, 1 + Math.min(cascade - 1, 6) * 0.09);
      if (cascade >= 3) impact(settings, cascade >= 4);
      buzz(res.fired.length ? 40 : 20, settings);
      await wait(res.fired.length ? 420 : 260);
      const pts = (pointsFor(res.cleared.size, cascade) + res.fired.length * 20) * mult;
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
      {phase === 'play' || phase === 'end' ? <h1 className="sr-only">{t('bm.title')}</h1> : <GameTopRow onSettings={() => setSettingsOpen(true)} />}

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
                options={[{ value: '6', label: t('bm.size.small') }, { value: '7', label: t('bm.size.medium') }, { value: '8', label: t('bm.size.big') }]} />
            </>
          ) },
        ]} />
      )}

      {(phase === 'play' || phase === 'end') && (
        // The board fills the play space like the reference games (teacher, 2026-10-31).
        <div className={`relative play-fill grid content-center gap-3 px-3 py-3 lg:flex lg:justify-center lg:items-center ${held.held.length ? '[--m3-extra:15rem]' : '[--m3-extra:7rem]'} lg:[--m3-extra:0rem]`}>
          {/* Board and score panel share one row, the panel top aligned with the
              board (teacher, 2026-10-31). */}
          <div className="contents lg:flex lg:items-start lg:gap-4">
          <div className="absolute top-3 right-3 flex items-center gap-2 z-10 [&_button]:!w-11 [&_button]:!h-11">
            <FullScreenButton small />
            <AccessButton small />
            <GearButton small onClick={() => setSettingsOpen(true)} />
          </div>

          {/* The board is the star, the score panel right beside it (teacher, 2026-10-31). */}
          <div className="border-[2.5px] border-border rounded-panel p-3 sm:p-4 mx-auto lg:mx-0 w-full lg:w-[min(calc(var(--play-h)-2rem),calc(100vw-19rem),64rem)]" style={{ ...pieceFill(theme, 'board', '#ffffff'), boxShadow: 'var(--shadow-sticker-lg)', maxWidth: 'min(100%, calc(var(--play-h) - 2rem - var(--m3-extra)), 64rem)' }}>
            <div className="relative">
            <div role="grid" aria-label={t('bm.title')} className="grid gap-1.5 select-none touch-none" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
              {grid.map((row, r) => <div key={r} role="row" className="contents">{row.map((tileItem, c) => {
                const key = `${r},${c}`;
                const isSel = selected?.row === r && selected?.col === c;
                const sp = tileItem.special;
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
                    onPointerDown={(e) => { drag.current = { pos: { row: r, col: c }, x: e.clientX, y: e.clientY }; }}
                    onPointerUp={(e) => onPointerUp(e, { row: r, col: c })}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap({ row: r, col: c }); } }}
                    initial={still ? false : sp ? { scale: 1.8, opacity: 0 } : { y: -40, opacity: 0 }}
                    whileHover={still || phase !== 'play' ? undefined : { scale: 1.1, rotate: [0, -6, 6, -3, 0], transition: { duration: 0.45 } }}
                    whileTap={still ? undefined : { scale: 0.88 }}
                    animate={popping.has(key) ? { scale: [1, 1.25, 0], opacity: [1, 1, 0] } : shake === key ? { x: [0, -5, 5, -3, 3, 0] } : { scale: 1, opacity: 1, y: 0, x: 0 }}
                    // Pieces fall with a little bounce, one column just after the
                    // next, so a refill ripples across the board.
                    transition={{ type: 'spring', stiffness: 520, damping: 24, delay: still ? 0 : c * 0.025, opacity: { duration: 0.2 } }}
                    className={`relative aspect-square rounded-input border-[2px] flex items-center justify-center ${isSel ? 'border-border ring-4 ring-accent' : sp ? 'border-border' : 'border-border-soft'}`}
                    style={{ ...(sp === 'rainbow' ? { background: RAINBOW_BG } : pieceFill(theme, `tile-${tileItem.kind}`, TILE_COLORS[tileItem.kind])), ...(sp ? { boxShadow: '0 0 0 2.5px #241c3d, 0 0 0 5px #fdfd94, 0 0 16px 4px #fdfd94' } : {}) }}
                  >
                    {sp === 'rainbow' && <Star weight="fill" className={`w-3/5 h-3/5 drop-shadow-[0_0_2px_#000] ${loop ? 'm3-spin' : ''}`} color="#fff" aria-hidden="true" />}
                    {(sp === 'row' || sp === 'col') && <span aria-hidden="true" className={`absolute inset-[6%] rounded-[inherit] pointer-events-none ${loop ? 'm3-glow' : ''}`} style={{ background: `repeating-linear-gradient(${sp === 'row' ? '0deg' : '90deg'}, rgba(255,255,255,0.85) 0 10%, transparent 10% 24%)` }} />}
                    {sp === 'burst' && <span aria-hidden="true" className={`absolute inset-[4%] rounded-full border-[3px] border-[#fdfd94] pointer-events-none ${loop ? 'm3-pulse' : ''}`} style={{ boxShadow: '0 0 10px #fdfd94, inset 0 0 8px #fdfd94' }} />}
                    {/* A badge says what the special piece does, by picture. */}
                    {(sp === 'row' || sp === 'col' || sp === 'burst') && (
                      <span aria-hidden="true" className="absolute -top-1.5 -right-1.5 w-[42%] aspect-square rounded-full bg-[#241c3d] border-[2px] border-white flex items-center justify-center z-[1]">
                        {sp === 'row' ? <ArrowsLeftRight weight="bold" className="w-3/4 h-3/4" color="#fdfd94" /> : sp === 'col' ? <ArrowsDownUp weight="bold" className="w-3/4 h-3/4" color="#fdfd94" /> : <Sparkle weight="fill" className="w-3/4 h-3/4" color="#fdfd94" />}
                      </span>
                    )}
                    {sp !== 'rainbow' && !pieceImage(theme, `tile-${tileItem.kind}`) && !PUZZLE_PACK_CLEARED && (() => { const Icon = TILE_ICONS[tileItem.kind]; return <Icon weight="fill" className="relative w-3/5 h-3/5" color="#241c3d" aria-hidden="true" />; })()}
                    {sp !== 'rainbow' && !pieceImage(theme, `tile-${tileItem.kind}`) && PUZZLE_PACK_CLEARED && <img src={CLASSIC_GEM(tileItem.kind)} alt="" aria-hidden="true" draggable="false" className="relative w-4/5 h-4/5 object-contain pointer-events-none drop-shadow-[0_2px_0_rgba(0,0,0,0.15)]" />}
                  </motion.button>
                );
              })}</div>)}
            </div>
            {/* Beams, bursts, sparks and the combo word, over the board. */}
            <div className="absolute inset-0 pointer-events-none overflow-visible" aria-hidden="true">
              {fx.map((f) => {
                const cell = { left: `${(f.col / COLS) * 100}%`, top: `${(f.row / ROWS) * 100}%`, width: `${100 / COLS}%`, height: `${100 / ROWS}%` };
                if (f.special === 'row') return <motion.span key={f.id} className="absolute left-0 right-0 rounded-pill" style={{ top: cell.top, height: cell.height, background: 'linear-gradient(90deg, transparent, #fff 20%, #fdfd94 50%, #fff 80%, transparent)' }} initial={{ scaleX: 0, opacity: 1 }} animate={{ scaleX: 1, opacity: [1, 1, 0] }} transition={{ duration: 0.42 }} />;
                if (f.special === 'col') return <motion.span key={f.id} className="absolute top-0 bottom-0 rounded-pill" style={{ left: cell.left, width: cell.width, background: 'linear-gradient(180deg, transparent, #fff 20%, #fdfd94 50%, #fff 80%, transparent)' }} initial={{ scaleY: 0, opacity: 1 }} animate={{ scaleY: 1, opacity: [1, 1, 0] }} transition={{ duration: 0.42 }} />;
                return <motion.span key={f.id} className="absolute rounded-full" style={{ left: `calc(${cell.left} + ${50 / COLS}%)`, top: `calc(${cell.top} + ${50 / ROWS}%)`, width: f.special === 'rainbow' ? '160%' : `${300 / COLS}%`, aspectRatio: '1', x: '-50%', y: '-50%', border: '6px solid #fdfd94', background: f.special === 'rainbow' ? 'radial-gradient(circle, transparent 55%, rgba(255,255,255,0.6) 60%, transparent 70%)' : 'radial-gradient(circle, rgba(255,255,255,0.9), rgba(253,253,148,0.4) 60%, transparent 70%)', borderColor: f.special === 'rainbow' ? '#b06bff' : '#fdfd94' }} initial={{ scale: 0.1, opacity: 1 }} animate={{ scale: 1, opacity: 0 }} transition={{ duration: 0.45, ease: 'easeOut' }} />;
              })}
              {sparks.flatMap((sp) => [0, 1, 2, 3, 4].map((k) => {
                const a = (k / 5) * Math.PI * 2 + sp.id;
                return <motion.span key={`${sp.id}-${k}`} className="absolute w-2 h-2 rounded-full border border-black/40" style={{ left: `${((sp.col + 0.5) / COLS) * 100}%`, top: `${((sp.row + 0.5) / ROWS) * 100}%`, background: sp.color }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1.2 }} animate={{ x: Math.cos(a) * 34, y: Math.sin(a) * 34 + 10, opacity: 0, scale: 0.4 }} transition={{ duration: 0.55, ease: 'easeOut' }} />;
              }))}
              <AnimatePresence>
                {callout && (
                  <motion.p key={callout.id} className="absolute inset-x-0 top-[40%] text-center font-display text-5xl sm:text-6xl text-[#fdfd94]" style={{ WebkitTextStroke: '2.5px #000', paintOrder: 'stroke' }}
                    initial={still ? { opacity: 0 } : { scale: 0.3, opacity: 0, rotate: -10 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ opacity: 0, y: -20 }} transition={still ? { duration: 0.01 } : { type: 'spring', stiffness: 320, damping: 14 }}
                    onAnimationComplete={() => { const id = callout.id; window.setTimeout(() => setCallout((c) => (c?.id === id ? null : c)), 650); }}><PopText text={callout.text} /></motion.p>
                )}
              </AnimatePresence>
            </div>
            </div>
          </div>

          <div className="grid gap-3 content-start sm:grid-cols-2 lg:grid-cols-1 lg:w-[220px] w-full mx-auto" style={{ maxWidth: 'min(100%, calc(var(--play-h) - 2rem - var(--m3-extra)), 64rem)' }}>
            <SoloPanel score={score} line={t('bm.round', { n: round, total: plan.current.rounds })} round={{ now: `${round}/${plan.current.rounds}`, label: t('pb.roundWord') }}
              dots={{ left: moves, total: MOVES_PER_ROUND, label: t('bm.moves', { count: moves }) }} note={note} />
            {/* The star goal fills as points come in (a goal that visibly builds). */}
            <div className="bg-surface border-[2.5px] border-border rounded-panel px-4 py-3 grid gap-2" style={{ boxShadow: 'var(--shadow-sticker)' }} role="meter" aria-label={t('m3.goal', { stars })} aria-valuenow={Math.min(score, goals[2])} aria-valuemin={0} aria-valuemax={goals[2]}>
              <div className="relative h-5 rounded-pill border-[2px] border-border bg-surface-2 overflow-visible">
                <motion.span className="absolute inset-y-0 left-0 rounded-pill" style={{ background: 'linear-gradient(90deg, #fdfd94, #f7b267)' }} initial={false} animate={{ width: `${Math.min(100, (score / (goals[2] * METER)) * 100)}%` }} transition={{ duration: still ? 0 : 0.5 }} />
                {goals.map((g, i) => (
                  <motion.span key={g} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2" style={{ left: `${(g / (goals[2] * METER)) * 100}%` }} animate={stars > i && !still ? { scale: [1, 1.6, 1], rotate: [0, 20, 0] } : { scale: 1 }} transition={{ duration: 0.5 }}>
                    <Star weight={stars > i ? 'fill' : 'bold'} size={26} color={stars > i ? '#f6c544' : '#6b7290'} className={stars > i ? 'drop-shadow-[0_0_1px_#000]' : ''} />
                  </motion.span>
                ))}
              </div>
            </div>
            {/* Held power-ups, right under the score (teacher, 2026-10-31). */}
            <div className="hidden sm:block sm:col-span-2 lg:col-span-1"><PowerUpTray manifest={matchThreeManifest} items={held.held} onUse={(i) => void applyItem(i)} disabled={busy || phase !== 'play'} /></div>
          </div>
          <div className="sm:hidden fixed left-3 bottom-3 w-[min(15rem,60vw)] z-20"><PowerUpTray manifest={matchThreeManifest} items={held.held} onUse={(i) => void applyItem(i)} disabled={busy || phase !== 'play'} /></div>
          </div>
        </div>
      )}

      {phase === 'end' && (
        <ResultsModal title={t('bm.done', { score })} missed={missed} againLabel={t('share.again')} onAgain={() => setPhase('welcome')}>
          <p className="flex items-center justify-center gap-1" aria-label={t('m3.goal', { stars })}>{[0, 1, 2].map((i) => <Star key={i} weight={stars > i ? 'fill' : 'bold'} size={40} color={stars > i ? '#f6c544' : '#6b7290'} className={stars > i ? 'drop-shadow-[0_0_1px_#000]' : ''} aria-hidden="true" />)}</p>
        </ResultsModal>
      )}
      {powers.element}
      {element}
    </main>
    </ThemedPage>
  );
}
