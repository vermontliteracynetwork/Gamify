import { useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowsLeftRight, Cake, Coffee, Cookie, Diamond, IceCream, Pizza, Popcorn, Question, type Icon } from '@phosphor-icons/react';
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
import { GameTopRow, SettingsPanel } from '../../settings/SettingsPanel';
import { useSettings } from '../../settings/SettingsContext';
import { ChoiceRow, Slider, Toggle } from '../../ui/fields';
import GameWelcome from '../GameWelcome';
import SetPicker from '../SetPicker';
import SetupWizard from '../SetupWizard';
import { matchThreeManifest } from './manifest';
import { useSavedSetup } from '../useSavedSetup';
import { usePowerUps } from '../../engine/usePowerUps';
import { useGamePool } from '../../student/session';
import { pieceFill, pieceImage } from '../../theme/library';
import { ThemedPage, useGameTheme } from '../../theme/useGameTheme';
import ThemeScreen from '../ThemeScreen';

import { clearAndRefill, createGrid, findMatches, hasAnyValidMove, isAdjacent, pointsFor, swapTiles, wouldMatch, type Grid, type Pos } from './matchThree';
import Title from '../../ui/Title';


// Simple house look: each gem has its own shape AND color (never color
// alone). Library and class-made themes swap in artwork per tile.
// Classic tiles are gems (teacher, 2026-10-31): each a different shape and
// color, on a soft tile of its own color, so shape alone tells them apart.
const TILE_COLORS = PUZZLE_PACK_CLEARED ? ['#d6e8ff', '#ffd9dc', '#d4f5dc', '#fff4c2', '#eadcff', '#ffe2c7'] : ['#f2c27b', '#f6a5c0', '#9fd8f0', '#f7b267', '#fbe38a', '#c9a27e'];
const TILE_ICONS: Icon[] = [Cookie, Cake, IceCream, Pizza, Popcorn, Coffee];
const CLASSIC_GEM = (k: number) => `/classic/match-three/gem-${k}.webp`;
type Phase = 'welcome' | 'theme' | 'setup' | 'play' | 'end';

export default function MatchThree() {
  const { settings } = useSettings();
  const { theme, themes, playable, choose } = useGameTheme('match-three');
  const still = settings.motion === 'still';
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const [setup, change] = useSavedSetup('match-three', { setId: LIBRARY[0].id, rounds: 3, perBreak: 2, moves: 3, size: 7, powerUps: true });
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
  // Power-ups after a question break: more moves, bonus points, or a doubled match.
  const powers = usePowerUps(matchThreeManifest, theme, setup.powerUps);
  const doubleNext = useRef(false);
  const wait = (ms: number) => new Promise((r) => window.setTimeout(r, still ? Math.min(ms, 80) : ms));

  function start() {
    plan.current = { rounds: setup.rounds, perBreak: setup.perBreak, moves: setup.moves, size: setup.size };
    const ROWS = setup.size, COLS = setup.size, MOVES_PER_ROUND = setup.moves;
    setGrid(createGrid(ROWS, COLS));
    setScore(0); setRound(1); setMoves(MOVES_PER_ROUND); setNote(''); setSelected(null);
    doubleNext.current = false;
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
    if (doubleNext.current && gained) { gained *= 2; doubleNext.current = false; }
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
      const it = powers.grant();
      setMoves(MOVES_PER_ROUND + (it?.ability === 'moves' ? powers.amount(it) : 0));
      if (it?.ability === 'bonus') setScore((s) => s + powers.amount(it));
      if (it?.ability === 'double') doubleNext.current = true;
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
    <ThemedPage theme={theme}>
    <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-6">
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context="match-three" />
      {clock.element}
      <GameTopRow onSettings={() => setSettingsOpen(true)}>
        {(phase === 'play' || phase === 'end') && <h1 className="title-bubble text-3xl sm:text-4xl"><Title text={t('bm.title')} /></h1>}
      </GameTopRow>

      {phase === 'welcome' && (
        <GameWelcome game={matchThreeManifest} cover={pieceImage(theme, 'cover')} onStart={() => setPhase(themes.length > 1 ? 'theme' : 'setup')} steps={[
          { icon: <ArrowsLeftRight weight="bold" size={22} />, text: t('bm.how1') },
          { icon: PUZZLE_PACK_CLEARED ? <Diamond weight="fill" size={22} /> : <Cookie weight="fill" size={22} />, text: t('bm.how2') },
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
              <Slider label={t('bm.rounds')} min={1} max={10} value={setup.rounds} onChange={(v) => change({ rounds: v })} />
              <Slider label={t('bm.movesEach')} min={2} max={6} value={setup.moves} onChange={(v) => change({ moves: v })} />
              <Toggle label={t('pu.toggle')} hint={t('pu.toggleHint')} value={setup.powerUps} onChange={(v) => change({ powerUps: v })} />
              <Slider label={t('bm.perBreak')} min={1} max={5} value={setup.perBreak} onChange={(v) => change({ perBreak: v })} />
              <ChoiceRow label={t('bm.size')} value={String(setup.size)} onChange={(v) => change({ size: Number(v) })}
                options={[{ value: '6', label: t('bm.size.small') }, { value: '7', label: t('bm.size.medium') }, { value: '8', label: t('bm.size.big') }]} />
            </>
          ) },
        ]} />
      )}

      {(phase === 'play' || phase === 'end') && (
        <div className="grid md:grid-cols-[1fr_220px] gap-5 items-start">
          <div className="border-[2.5px] border-border rounded-panel p-3 sm:p-4 mx-auto w-full" style={{ ...pieceFill(theme, 'board', '#ffffff'), boxShadow: 'var(--shadow-sticker-lg)', maxWidth: 'min(100%, calc(100dvh - 11.75rem + var(--chrome-save, 0rem)), 40rem)' }}>
            <div role="grid" aria-label={t('bm.title')} className="grid gap-1.5 select-none touch-none" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
              {grid.map((row, r) => <div key={r} role="row" className="contents">{row.map((tileItem, c) => {
                const key = `${r},${c}`;
                const isSel = selected?.row === r && selected?.col === c;
                const kindName = t(`bm.${PUZZLE_PACK_CLEARED ? "gem" : "kind"}.${tileItem.kind}` as StringKey);
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
                    initial={still ? false : { y: -40, opacity: 0 }}
                    animate={popping.has(key) ? { scale: [1, 1.25, 0], opacity: [1, 1, 0] } : shake === key ? { x: [0, -5, 5, -3, 3, 0] } : { scale: 1, opacity: 1, y: 0, x: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 32, opacity: { duration: 0.2 } }}
                    className={`aspect-square rounded-input border-[2px] flex items-center justify-center ${isSel ? 'border-border ring-4 ring-accent' : 'border-border-soft'}`}
                    style={pieceFill(theme, `tile-${tileItem.kind}`, TILE_COLORS[tileItem.kind])}
                  >
                    {!pieceImage(theme, `tile-${tileItem.kind}`) && !PUZZLE_PACK_CLEARED && (() => { const Icon = TILE_ICONS[tileItem.kind]; return <Icon weight="fill" className="w-3/5 h-3/5" color="#241c3d" aria-hidden="true" />; })()}
                    {!pieceImage(theme, `tile-${tileItem.kind}`) && PUZZLE_PACK_CLEARED && <img src={CLASSIC_GEM(tileItem.kind)} alt="" aria-hidden="true" draggable="false" className="w-4/5 h-4/5 object-contain pointer-events-none drop-shadow-[0_2px_0_rgba(0,0,0,0.15)]" />}
                  </motion.button>
                );
              })}</div>)}
            </div>
          </div>

          <SoloPanel score={score} line={t('bm.round', { n: round, total: plan.current.rounds })}
            dots={{ left: moves, total: MOVES_PER_ROUND, label: t('bm.moves', { count: moves }) }} note={note} />
        </div>
      )}

      {phase === 'end' && <ResultsModal title={t('bm.done', { score })} missed={missed} againLabel={t('share.again')} onAgain={() => setPhase('welcome')} />}
      {powers.element}
      {element}
    </main>
    </ThemedPage>
  );
}
