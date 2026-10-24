import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Cake, Coffee, Cookie, IceCream, Pizza, Popcorn, type Icon } from '@phosphor-icons/react';
import { useMySets } from '../../data/hooks';
import { LIBRARY } from '../../data/library';
import { buzz, playEffect } from '../../engine/feedback';
import LookBack from '../../engine/LookBack';
import StartCard, { type RoundValues } from '../../engine/StartCard';
import { useAsk } from '../../engine/useAsk';
import { t } from '../../i18n';
import type { StringKey } from '../../i18n/en';
import { GameTopRow, SettingsPanel } from '../../settings/SettingsPanel';
import { useSettings } from '../../settings/SettingsContext';
import type { GameManifest } from '../types';
import { clearAndRefill, createGrid, findMatches, hasAnyValidMove, isAdjacent, pointsFor, swapTiles, wouldMatch, type Grid, type Pos } from './matchThree';

export const bakeryMatchManifest: GameManifest = {
  id: 'bakery-match',
  name: 'Bakery Match',
  description: 'Swap treats to make rows of 3. Answer questions to keep baking.',
  modes: ['solo'],
  questionKinds: ['mc'],
  themePieces: [
    { id: 'background', label: 'Background', width: 1600, height: 1200, hint: 'Behind the board' },
    ...[0, 1, 2, 3, 4, 5].map((i) => ({ id: `tile-${i}`, label: `Treat ${i + 1}`, width: 128, height: 128, hint: 'One of the six treats you match' })),
    { id: 'board', label: 'Board', width: 900, height: 900, hint: 'The tray the treats sit on' },
    { id: 'cover', label: 'Cover', width: 600, height: 600, hint: 'The picture on the game card' },
  ],
  rounds: { label: 'Rounds', min: 1, max: 10, default: 3 },
  questionsPerBreak: { label: 'Questions each time', min: 1, max: 10, default: 2 },
  hasCpu: false,
  borrowedFrom: 'Dashboard src/routes/student/BakeryMatch3.tsx and src/lib/matchThree.ts',
};

// Simple house look: each treat has its own icon AND color (never color
// alone). Library and class-made themes swap in artwork per tile.
const TILE_ICONS: Icon[] = [Cookie, Cake, IceCream, Pizza, Popcorn, Coffee];
const TILE_COLORS = ['#f2c27b', '#f6a5c0', '#9fd8f0', '#f7b267', '#fbe38a', '#c9a27e'];
const ROWS = 7;
const COLS = 7;
const MOVES_PER_ROUND = 3;
type Phase = 'start' | 'play' | 'end';

export default function BakeryMatch() {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const { value: mine = [] } = useMySets();
  const pool = useMemo(() => [...mine, ...LIBRARY].slice(0, 1).map((set) => ({ set, starred: false })), [mine]);
  const [setId, setSetId] = useState(LIBRARY[0].id);
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const chosen = useMemo(() => sets.filter((s) => s.id === setId).map((set) => ({ set, starred: false })), [sets, setId]);
  const { ask, element, missed } = useAsk({ gameId: 'bakery-match', mode: 'solo', pool: chosen.length ? chosen : pool });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('start');
  const [grid, setGrid] = useState<Grid>(() => createGrid(ROWS, COLS));
  const [selected, setSelected] = useState<Pos | null>(null);
  const [popping, setPopping] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [moves, setMoves] = useState(MOVES_PER_ROUND);
  const [note, setNote] = useState('');
  const [shake, setShake] = useState<string | null>(null);
  const plan = useRef<RoundValues>({ rounds: 3, perBreak: 2 });
  const drag = useRef<{ pos: Pos; x: number; y: number } | null>(null);
  const wait = (ms: number) => new Promise((r) => window.setTimeout(r, still ? Math.min(ms, 80) : ms));

  function start(v: RoundValues) {
    plan.current = v;
    setGrid(createGrid(ROWS, COLS));
    setScore(0); setRound(1); setMoves(MOVES_PER_ROUND); setNote(''); setSelected(null);
    setPhase('play');
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
    let cascade = 1;
    let gained = 0;
    for (let m = findMatches(g); m.size > 0; m = findMatches(g)) {
      setPopping(m);
      playEffect('right', settings);
      buzz(20, settings);
      await wait(260);
      gained += pointsFor(m.size, cascade);
      g = clearAndRefill(g, m);
      setPopping(new Set());
      setGrid(g);
      await wait(320);
      cascade++;
    }
    setScore((s) => s + gained);
    if (!hasAnyValidMove(g)) {
      setNote(t('bm.shuffle'));
      await wait(700);
      g = createGrid(ROWS, COLS);
      setGrid(g);
    }
    const left = moves - 1;
    setMoves(left);
    if (left === 0) {
      setNote(t('bm.answerToGo'));
      await wait(500);
      const done = await ask({ count: plan.current.perBreak });
      if (!done || round >= plan.current.rounds) { finish(); setBusy(false); return; }
      setRound((r) => r + 1);
      setMoves(MOVES_PER_ROUND);
      setNote('');
    }
    setBusy(false);
  }

  function finish() {
    setPhase('end');
    playEffect('win', settings);
    if (settings.celebrations !== 'off' && !still) void confetti({ particleCount: settings.celebrations === 'big' ? 140 : 50, spread: 80, origin: { y: 0.6 }, disableForReducedMotion: true });
  }

  function tap(pos: Pos) {
    if (busy || phase !== 'play') return;
    playEffect('tap', settings);
    if (!selected) { setSelected(pos); return; }
    if (selected.row === pos.row && selected.col === pos.col) { setSelected(null); return; }
    if (isAdjacent(selected, pos)) void trySwap(selected, pos);
    else setSelected(pos);
  }

  // Swiping a treat also swaps it (unless the player chose tap only).
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
    <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-24">
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context="bakery-match" />
      <GameTopRow onSettings={() => setSettingsOpen(true)}>
        {phase !== 'start' && <h1 className="title-bubble text-3xl sm:text-4xl">{t('bm.title')}</h1>}
      </GameTopRow>

      {phase === 'start' && (
        <div className="grid gap-4">
          <label className="grid gap-1 font-bold max-w-lg mx-auto w-full">
            {t('practice.set')}
            <select id="bm-set" value={setId} onChange={(e) => setSetId(e.target.value)} className="min-h-12 px-3 rounded-input border-[2px] border-border bg-surface font-bold">
              {sets.map((s) => <option key={s.id} value={s.id}>{s.name || t('sets.untitled')}</option>)}
            </select>
          </label>
          <StartCard gameId="bakery-match" title={t('bm.title')} description={t('bm.description')}
            rounds={bakeryMatchManifest.rounds} perBreak={bakeryMatchManifest.questionsPerBreak} onPlay={start} />
        </div>
      )}

      {phase !== 'start' && (
        <div className="grid md:grid-cols-[1fr_220px] gap-5 items-start">
          <div className="bg-surface border-[2.5px] border-border rounded-panel p-3 sm:p-4 mx-auto w-full" style={{ boxShadow: 'var(--shadow-sticker-lg)', maxWidth: 'min(100%, 70dvh, 640px)' }}>
            <div role="grid" aria-label={t('bm.title')} className="grid gap-1.5 select-none touch-none" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
              {grid.map((row, r) => row.map((tileItem, c) => {
                const key = `${r},${c}`;
                const Icon = TILE_ICONS[tileItem.kind];
                const isSel = selected?.row === r && selected?.col === c;
                const kindName = t(`bm.kind.${tileItem.kind}` as StringKey);
                return (
                  <motion.button
                    key={tileItem.id}
                    layout={!still}
                    type="button"
                    role="gridcell"
                    aria-label={`${t('bm.tile', { kind: kindName, row: r + 1, col: c + 1 })}${isSel ? `, ${t('bm.selected')}` : ''}`}
                    aria-pressed={isSel}
                    disabled={phase !== 'play'}
                    onPointerDown={(e) => { drag.current = { pos: { row: r, col: c }, x: e.clientX, y: e.clientY }; }}
                    onPointerUp={(e) => onPointerUp(e, { row: r, col: c })}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap({ row: r, col: c }); } }}
                    initial={still ? false : { y: -40, opacity: 0 }}
                    animate={popping.has(key) ? { scale: [1, 1.25, 0], opacity: [1, 1, 0] } : shake === key ? { x: [0, -5, 5, -3, 3, 0] } : { scale: 1, opacity: 1, y: 0, x: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 32, opacity: { duration: 0.2 } }}
                    className={`aspect-square rounded-input border-[2px] flex items-center justify-center ${isSel ? 'border-border ring-4 ring-accent' : 'border-border-soft'}`}
                    style={{ background: TILE_COLORS[tileItem.kind] }}
                  >
                    <Icon weight="fill" className="w-3/5 h-3/5" color="#241c3d" aria-hidden="true" />
                  </motion.button>
                );
              }))}
            </div>
          </div>

          <aside className="grid gap-3">
            <div className="bg-surface border-[2.5px] border-border rounded-panel p-4 grid gap-2" style={{ boxShadow: 'var(--shadow-sticker)' }}>
              <p className="text-xs font-bold uppercase tracking-wider text-muted">{t('bm.score')}</p>
              <motion.p key={score} initial={still ? false : { scale: 1.3 }} animate={{ scale: 1 }} className="font-display text-4xl font-bold tabular-nums">{score}</motion.p>
              <p className="font-bold">{t('bm.round', { n: round, total: plan.current.rounds })}</p>
              <div className="flex gap-1.5" aria-label={t('bm.moves', { count: moves })} role="img">
                {Array.from({ length: MOVES_PER_ROUND }, (_, i) => (
                  <span key={i} className={`w-6 h-6 rounded-full border-[2px] border-border ${i < moves ? 'bg-accent' : 'bg-surface-2'}`} />
                ))}
              </div>
            </div>
            <AnimatePresence>
              {note && (
                <motion.p key={note} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="font-bold bg-surface rounded-input border-[2px] border-border p-3" role="status">{note}</motion.p>
              )}
            </AnimatePresence>
          </aside>
        </div>
      )}

      {phase === 'end' && (
        <div className="grid gap-4 mt-5">
          <p className="font-display text-3xl font-bold text-center">{t('bm.done', { score })}</p>
          <div className="flex justify-center">
            <button type="button" onClick={() => setPhase('start')} className="min-h-14 px-8 rounded-pill border-[2.5px] border-border bg-accent font-display text-xl font-bold">{t('share.again')}</button>
          </div>
          <LookBack missed={missed} onDone={() => setPhase('start')} />
        </div>
      )}
      {element}
    </main>
  );
}
