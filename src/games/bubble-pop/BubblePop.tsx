import { useEffect, useMemo, useRef, useState } from 'react';
import HintButton from '../../engine/HintButton';
import { impact } from '../../engine/impact';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Crosshair, Question, Star } from '@phosphor-icons/react';
import { Doodle } from '../../brand/CrayonKit';
import { useMySets } from '../../data/hooks';
import { LIBRARY } from '../../data/library';
import { buzz, playEffect } from '../../engine/feedback';
import Meter from '../../ui/Meter';
import { PowerUpTray, useHeldPowerUps } from '../../engine/HeldPowerUps';
import ResultsModal from '../../engine/ResultsModal';
import { usePlayClock } from '../../engine/playClock';
import { useAsk } from '../../engine/useAsk';
import { t } from '../../i18n';
import { FullScreenButton, GameTopRow, GearButton, SettingsPanel } from '../../settings/SettingsPanel';
import CloseGameButton from '../../engine/CloseGameButton';
import { useSettings } from '../../settings/SettingsContext';
import { useGamePool } from '../../student/session';
import { pieceFill, pieceImage } from '../../theme/library';
import { ThemedPage, useGameTheme } from '../../theme/useGameTheme';
import { Slider } from '../../ui/fields';
import GameWelcome from '../GameWelcome';
import SetPicker from '../SetPicker';
import SetupWizard from '../SetupWizard';
import ThemeScreen from '../ThemeScreen';
import { useSavedSetup } from '../useSavedSetup';
import { usePowerUps } from '../../engine/usePowerUps';
import type { ThemeItem } from '../../theme/types';
import { powerUpSwitches } from '../../engine/PowerUpSwitches';
import { BOARD_COLOR, BUBBLE_COLORS, bubblePopManifest } from './manifest';
import { BubblePatternDefs, bubblePatterns, drawBubble, INK, PAPER } from './bubbleArt';
import {
  center, clampAngle, colorsLeft, DANGER_ROW, filled, H, lowestRow, makeBoard, MAX_ROWS, nextColor, nextShot, placeShot, pushRow, R, rescue,
  rowLen, SHOOTER, shotPoints, traceShot, W, type Board, type Hit, type Shot,
} from './board';

// A four-point doodle sparkle (the Classic doodle confetti) centered on x, y.
const sparkD = (x: number, y: number, s: number) => `M${x} ${y - s} C${x + s * 0.15} ${y - s * 0.2} ${x + s * 0.2} ${y - s * 0.15} ${x + s} ${y} C${x + s * 0.2} ${y + s * 0.15} ${x + s * 0.15} ${y + s * 0.2} ${x} ${y + s} C${x - s * 0.15} ${y + s * 0.2} ${x - s * 0.2} ${y + s * 0.15} ${x - s} ${y} C${x - s * 0.2} ${y - s * 0.15} ${x - s * 0.15} ${y - s * 0.2} ${x} ${y - s} Z`;
// The loaded bubble sits a little bigger on the launcher, so its color reads
// at a glance (mockup, 2026-11-24), and shrinks to size as it flies.
const LOADED = 1.4;
const flyT = (dx: number, dy: number, k: number) => `translate(${dx} ${dy}) translate(${SHOOTER.x} ${SHOOTER.y}) scale(${k}) translate(${-SHOOTER.x} ${-SHOOTER.y})`;
const NO_POP_PUSH = 5; // shots in a row without a pop before a new row slides in
type Phase = 'welcome' | 'theme' | 'setup' | 'play' | 'end';
type Step = 'question' | 'aim' | 'fly';
type Fx = { id: number; hits: Hit[]; kind: 'pop' | 'fall'; board: Board };

// Bubble Pop (launch roster, Stage 7): answer to load bubbles, then aim and
// shoot; 3 of a kind pop and anything left hanging falls. Never a loss: a
// bubble near the bottom sets off a rescue instead.
export default function BubblePop() {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const { theme, themes, playable, choose } = useGameTheme('bubble-pop');
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const [setup, change] = useSavedSetup('bubble-pop', { setId: LIBRARY[0].id, roundCount: 10, shotsPerRound: 3, perBreak: 1, powerUps: true , powerOff: [] as string[]});
  const setId = sets.some((s) => s.id === setup.setId) ? setup.setId : LIBRARY[0].id;
  const chosen = useMemo(() => sets.filter((s) => s.id === setId).map((set) => ({ set, starred: false })), [sets, setId]);
  const game = useGamePool(chosen);
  const { ask, cancel, asking, element, missed } = useAsk({ gameId: 'bubble-pop', mode: 'solo', pool: game.pool, classroomId: game.classroomId, studentId: game.studentId });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('welcome');
  const [step, setStep] = useState<Step>('question');
  const [board, setBoard] = useState<Board>(() => makeBoard(0));
  const [level, setLevel] = useState(0);
  const [shooter, setShooter] = useState<{ now: Shot; next: Shot }>({ now: 0, next: 1 });
  // Combo: shots in a row that pop; a callout over the board (Golden Rule pass, 2026-10-31).
  const combo = useRef(0);
  const [callout, setCallout] = useState<{ id: number; text: string } | null>(null);
  const [blast, setBlast] = useState<{ id: number; x: number; y: number; kind: 'rainbow' | 'burst' } | null>(null);
  const [angle, setAngle] = useState(-Math.PI / 2);
  const [shots, setShots] = useState(0);
  const [breaks, setBreaks] = useState(0);
  const [score, setScore] = useState(0);
  const [noPop, setNoPop] = useState(0);
  const [note, setNote] = useState('');
  const [fx, setFx] = useState<Fx[]>([]);
  const [gain, setGain] = useState<{ id: number; n: number; x: number; y: number } | null>(null);
  const plan = useRef({ rounds: 10, shots: 3, perBreak: 1 });
  // Power-ups after a question break: more bubbles, bonus points, or a doubled pop.
  const powers = usePowerUps(bubblePopManifest, theme, setup.powerUps, setup.powerOff ?? []);
  const doubleNext = useRef(false);
  // Held power-ups (teacher, 2026-11-24: "power ups should wait for tap"; the
  // solo board-game standard): one earned on a right answer waits as a square
  // card under the score, centered on it, for this round's shots; a tap uses
  // it, and an unused one is gone when the round ends.
  const held = useHeldPowerUps();
  function useHeld(i: number) {
    if (step !== 'aim') return;
    const it = held.use(i);
    if (it) applyNow(it);
  }
  function applyNow(it: ThemeItem) {
    playEffect('win', settings);
    setCallout({ id: Date.now(), text: `${it.name}!` });
    if (it.ability === 'shots') setShots((n) => n + powers.amount(it));
    if (it.ability === 'bonus') setScore((sc) => sc + powers.amount(it));
    if (it.ability === 'mystery') setScore((sc) => sc + 10 * (1 + Math.floor(Math.random() * 10)));
    if (it.ability === 'double') doubleNext.current = true;
    // Instant points need no "on for these shots" line; the score jumps instead.
    if (it.ability === 'shots' || it.ability === 'double') setNote(t('bp.powerOn', { name: it.name }));
  }
  const svg = useRef<SVGSVGElement>(null);
  const flyer = useRef<SVGGElement>(null);
  const shotCount = useRef(0);
  const pressed = useRef(false);

  const aim = useMemo(() => traceShot(board, angle), [board, angle]);

  function start() {
    plan.current = { rounds: setup.roundCount, shots: setup.shotsPerRound, perBreak: setup.perBreak };
    const b = makeBoard(0);
    setBoard(b); setLevel(0); setScore(0); setBreaks(0); setShots(0); setNoPop(0); setNote(''); setFx([]); setGain(null); combo.current = 0;
    doubleNext.current = false;
    held.reset();
    setShooter({ now: nextColor(b), next: nextShot(b) });
    setAngle(-Math.PI / 2);
    setPhase('play');
    void load(0);
  }

  async function load(done: number) {
    setStep('question');
    setNote(done === 0 ? '' : t('bp.answer'));
    held.endTurn(); // unused power-ups are gone after the round
    const ok = await ask({ count: plan.current.perBreak });
    if (!ok) { finish(); return; }
    const it = powers.grant();
    setShots(plan.current.shots);
    setNote('');
    setStep('aim');
    if (it) held.earn('solo', it);
    held.beginTurn('solo');
  }

  function finish() {
    setPhase('end');
    playEffect('win', settings);
    if (settings.celebrations !== 'off' && !still) void confetti({ particleCount: settings.celebrations === 'big' ? 140 : 60, spread: 80, origin: { y: 0.6 }, disableForReducedMotion: true });
  }  // The teacher's play clock or score goal ends the game the usual way (2026-10-31).
  const clock = usePlayClock({ playing: phase === 'play', score, onTimeUp: () => { if (asking) cancel(); else finish(); } });


  function addFx(hits: Hit[], kind: Fx['kind'], from: Board) {
    if (!hits.length || still) return;
    const id = ++shotCount.current;
    setFx((f) => [...f, { id, hits, kind, board: from }]);
    window.setTimeout(() => setFx((f) => f.filter((x) => x.id !== id)), 950);
  }

  function shoot(a = angle) {
    if (step !== 'aim' || shots <= 0 || phase !== 'play') return;
    const { path, cell } = traceShot(board, a);
    if (!cell) return;
    setStep('fly');
    playEffect('whoosh', settings);
    const land = () => settle(cell);
    // The bubble flies along the aim path at a steady speed (bouncing off walls).
    const lens = [0];
    for (let i = 1; i < path.length; i++) lens.push(lens[i - 1] + Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y));
    const total = lens[lens.length - 1];
    // A moderate pace along the aim line, so every shot can be followed (teacher, 2026-11-06).
    const ms = Math.max(500, (total / 34) * 1000); // the taller board (2026-11-24) keeps about the same flight time
    const t0 = performance.now();
    const frame = (now: number) => {
      const d = Math.min(1, (now - t0) / ms) * total;
      let i = 1;
      while (i < lens.length - 1 && lens[i] < d) i++;
      const k = (d - lens[i - 1]) / (lens[i] - lens[i - 1] || 1);
      const x = path[i - 1].x + (path[i].x - path[i - 1].x) * k;
      const y = path[i - 1].y + (path[i].y - path[i - 1].y) * k;
      flyer.current?.setAttribute('transform', flyT(x - SHOOTER.x, y - SHOOTER.y, LOADED - (LOADED - 1) * Math.min(1, (d / total) * 3)));
      if (d < total) requestAnimationFrame(frame); else land();
    };
    requestAnimationFrame(frame);
  }

  function settle([r, c]: [number, number]) {
    flyer.current?.setAttribute('transform', flyT(0, 0, LOADED));
    const res = placeShot(board, r, c, shooter.now);
    let b = res.board;
    let points = shotPoints(res);
    let message = '';
    let misses = noPop;
    const at = center(board, r, c);
    const special = typeof shooter.now !== 'number' ? shooter.now : null;
    // A star burst counts at most 8 pops, so one lucky shot can't run away with a race.
    if (special === 'burst') points = Math.min(8, res.popped.length) * 10 + res.dropped.length * 20;
    if (special) {
      // A special shot: a ring where it lands, its own sound, and its name (only when it popped something).
      if (!still) setBlast({ id: Date.now(), x: at.x, y: at.y, kind: special });
      playEffect('whoosh', settings);
      buzz(45, settings);
    }
    if (res.popped.length) {
      // Every bubble in the group pops with a rising note (engagement audit, 2026-11-08).
      const n = res.popped.length + res.dropped.length;
      for (let k = 0; k < Math.min(n, 8); k++) window.setTimeout(() => playEffect('tap', settings, undefined, 1 + k * 0.1), k * 55);
      playEffect(n >= 6 ? 'win' : 'right', settings); buzz(25, settings);
      if (n >= 6) impact(settings);
      addFx(res.popped, 'pop', board); addFx(res.dropped, 'fall', board);
      misses = 0;
      combo.current += 1;
      // Combo bonus, capped at x5.
      if (combo.current >= 2) points += Math.min(5, combo.current) * 10;
      const name = special ? t(special === 'burst' ? 'bp.burst' : 'bp.rainbow') : '';
      const comboText = combo.current >= 2 ? t('bp.combo', { n: combo.current }) : '';
      if (name || comboText) setCallout({ id: Date.now(), text: [name, comboText].filter(Boolean).join(' ') });
    } else {
      combo.current = 0;
      playEffect('tap', settings);
      misses += 1;
    }
    if (filled(b) === 0) {
      points += 100; message = t('bp.cleared');
      playEffect('win', settings);
      impact(settings);
      if (settings.celebrations !== 'off' && !still) void confetti({ particleCount: 60, spread: 70, origin: { y: 0.4 }, disableForReducedMotion: true });
      b = makeBoard(level + 1); setLevel((l) => l + 1); misses = 0;
    } else if (misses >= NO_POP_PUSH) {
      b = pushRow(b, [...new Set(b.rows.flat().filter((x): x is number => x !== null))]); misses = 0; message = t('bp.newRow');
    }
    if (lowestRow(b) >= DANGER_ROW) {
      const saved = rescue(b); addFx(saved.removed, 'pop', b); b = saved.board; message = t('bp.rescue');
    }
    if (points && doubleNext.current && res.popped.length) { points *= 2; doubleNext.current = false; }
    if (points) {
      const p = center(board, r, c);
      setGain({ id: shotCount.current + 1000, n: points, x: p.x, y: p.y });
      setScore((s) => s + points);
    }
    setBoard(b); setNoPop(misses); setNote(message);
    // The next shot stays one that can pop: a color still on the board, or a special.
    const left0 = colorsLeft(b);
    const now = typeof shooter.next === 'number' && !left0.includes(shooter.next) ? nextColor(b) : shooter.next;
    setShooter({ now, next: nextShot(b, Math.random, now) });
    const left = shots - 1;
    setShots(left);
    if (left > 0) { setStep('aim'); return; }
    const done = breaks + 1;
    setBreaks(done);
    if (done >= plan.current.rounds) { window.setTimeout(finish, still ? 200 : 800); return; }
    window.setTimeout(() => void load(done), still ? 200 : 700);
  }

  // Pointer: move (or drag) to aim, let go to shoot.
  function toAngle(e: React.PointerEvent) {
    const box = svg.current?.getBoundingClientRect();
    if (!box) return angle;
    const x = ((e.clientX - box.left) / box.width) * W;
    const y = ((e.clientY - box.top) / box.height) * H;
    return clampAngle(Math.atan2(y - SHOOTER.y, x - SHOOTER.x));
  }
  const canAim = phase === 'play' && step === 'aim';

  // Keys: arrows aim, Space or Enter shoots.
  useEffect(() => {
    if (!canAim) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.closest('input, textarea, select, [role=dialog]')) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); setAngle((a) => clampAngle(a - 0.06)); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); setAngle((a) => clampAngle(a + 0.06)); }
      else if (e.key === ' ' || e.key === 'Enter') { if ((e.target as HTMLElement | null)?.tagName === 'BUTTON') return; e.preventDefault(); shoot(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const patterns = bubblePatterns(theme);
  const bubble = (k: number, x: number, y: number, key?: string, cls = '', style?: React.CSSProperties) => drawBubble(patterns, k, x, y, key, cls, style);
  // Special shots, in the crayon kit's hand (owner, 2026-11-26): a rainbow
  // bubble (wedges of every bubble color, a paper sparkle doodle) and a star
  // burst (an Ink bubble with a Lemon ring and a Lemon sparkle doodle).
  const spark = (x: number, y: number, size: number, color: string) => <g transform={`translate(${x - size / 2} ${y - size / 2})`}><Doodle kind="sparkle" color={color} size={size} /></g>;
  const shotBubble = (shot: Shot, x: number, y: number) => {
    if (typeof shot === 'number') return bubble(shot, x, y);
    if (shot === 'rainbow') return (
      <g>
        {BUBBLE_COLORS.map((col, i) => { const a0 = (i / 6) * Math.PI * 2, a1 = ((i + 1) / 6) * Math.PI * 2, rr = R * 0.94; return <path key={i} d={`M${x} ${y} L${x + Math.cos(a0) * rr} ${y + Math.sin(a0) * rr} A${rr} ${rr} 0 0 1 ${x + Math.cos(a1) * rr} ${y + Math.sin(a1) * rr} Z`} fill={col} />; })}
        <circle cx={x} cy={y} r={R * 0.94} fill="none" stroke={INK} strokeWidth={0.15} />
        {spark(x, y, 1.15, PAPER)}
      </g>
    );
    return (
      <g>
        <circle cx={x} cy={y} r={R * 1.25} fill="none" stroke="#fabe37" strokeWidth={0.22} className={still ? '' : 'bp-ring'} style={{ transformOrigin: `${x}px ${y}px`, transformBox: 'view-box' }} />
        <circle cx={x} cy={y} r={R * 0.94} fill={INK} stroke="#fabe37" strokeWidth={0.16} />
        {spark(x, y, 1.25, '#fabe37')}
      </g>
    );
  };
  const landing = aim.cell ? center(board, aim.cell[0], aim.cell[1]) : null;
  const dangerY = R + DANGER_ROW * Math.sqrt(3) - R;
  const round = Math.min(breaks + 1, plan.current.rounds);

  return (
    <ThemedPage theme={theme} menu={phase !== 'play' && phase !== 'end'}>
    <main className={phase === 'play' || phase === 'end' ? '!p-0' : 'w-full px-4 sm:px-6 pt-6 pb-4'}>
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context="bubble-pop" />
      {clock.element}
      {phase === 'play' || phase === 'end' ? <h1 className="sr-only">{bubblePopManifest.name}</h1> : <GameTopRow hint="bubble-pop" onSettings={() => setSettingsOpen(true)} />}

      {phase === 'welcome' && (
        <GameWelcome game={bubblePopManifest} cover={pieceImage(theme, 'cover')} onStart={() => setPhase(themes.length > 1 ? 'theme' : 'setup')} steps={[
          { icon: <Question weight="bold" size={22} />, text: t('bp.how1') },
          { icon: <Crosshair weight="bold" size={22} />, text: t('bp.how2') },
          { icon: <Star weight="fill" size={22} />, text: t('bp.how3') },
        ]} />
      )}
      {phase === 'theme' && <ThemeScreen gameName={bubblePopManifest.name} current={theme} themes={themes} playable={playable} onChoose={choose} onBack={() => setPhase('welcome')} onNext={() => setPhase('setup')} />}
      {phase === 'setup' && (
        <SetupWizard onBack={() => setPhase(themes.length > 1 ? 'theme' : 'welcome')} onPlay={start} pages={[
          ...(game.assigned ? [] : [{ id: 'questions', title: t('setup.questions'), content: <SetPicker sets={sets} value={[setId]} onChange={(ids) => change({ setId: ids[0] })} /> }]),
          { id: 'options', title: t('setup.options'), content: (
            <>
              <Slider label={t('bp.rounds')} hint={t('bp.roundsHint')} min={3} max={20} value={setup.roundCount} onChange={(v) => change({ roundCount: v })} />
              <Slider label={t('bp.shotsEach')} hint={t('bp.shotsHint')} min={1} max={5} value={setup.shotsPerRound} onChange={(v) => change({ shotsPerRound: v })} />
              <Slider label={t('bp.perBreak')} hint={t('bp.perBreakHint')} min={1} max={5} value={setup.perBreak} onChange={(v) => change({ perBreak: v })} />
              {powerUpSwitches({ manifest: bubblePopManifest, theme, on: setup.powerUps, off: setup.powerOff ?? [], change })}
            </>
          ) },
        ]} />
      )}

      {(phase === 'play' || phase === 'end') && (
        // The approved mockup (owner, 2026-11-24; the solo board-game standard,
        // her words for Match Three: "put meter on top, adding in the moves ...
        // xp as a number on the top of the rigth followed by power ups that are
        // center aligned to the xp text"): the meter pill with the bubbles left
        // across the top, the tall Blue crystal board in the middle, the score
        // at the top right with the held power-ups under it. Tap or click the
        // board to shoot; no Shoot button (teacher, 2026-11-16).
        <div className="bp-play relative play-fill overflow-hidden">
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-30 [&_button]:!w-11 [&_button]:!h-11">
            {/* One order everywhere (Brand Kit, 2026-11-24): Hint, Settings, Full screen, Close. */}
            <HintButton gameId="bubble-pop" />
            <GearButton small onClick={() => setSettingsOpen(true)} />
            <FullScreenButton small />
            <CloseGameButton />
          </div>

          {/* THE meter with the bubbles left, in one paper pill (no "Round n of N" text). */}
          <div className="bp-meter absolute top-3 z-20 inline-flex items-center gap-3 h-[3.25rem] px-4 sm:px-5 rounded-pill bg-[var(--paper)]"
            style={{ border: `3px solid ${INK}`, boxShadow: `0 3px 0 ${INK}` }}
            role="group" aria-label={t('bp.roundOf', { n: round, total: plan.current.rounds })}>
            <b className="whitespace-nowrap text-base sm:text-lg">{t('bp.shots', { count: shots })}</b>
            <span className="bp-meter-bar flex">
              {plan.current.rounds * plan.current.shots <= 20
                ? <Meter segments={plan.current.rounds * plan.current.shots} done={(round - 1) * plan.current.shots + (plan.current.shots - Math.min(shots, plan.current.shots))} part={0.5} label={t('bp.shots', { count: shots })} />
                : <Meter segments={plan.current.rounds} done={round - 1} part={(plan.current.shots - Math.min(shots, plan.current.shots)) / plan.current.shots || 0.12} label={t('bp.shots', { count: shots })} />}
            </span>
          </div>

          {/* The score as a big number on a Paper pill (Classic Art Director,
              2026-11-26: never straight on a pattern blob), the held power-ups
              under it, centered on it. */}
          <div className="bp-side absolute z-20 grid justify-items-center content-start gap-3 pointer-events-none">
            <span className="bp-gy tabular-nums text-[3.5rem] sm:text-[4.25rem] text-[var(--ink)] rounded-pill bg-[var(--paper)] px-[0.4em] pt-[0.08em] pb-[0.02em] min-w-[1.4em] text-center" style={{ border: `3px solid ${INK}`, boxShadow: `0 3px 0 ${INK}` }} role="status" aria-label={t('share.points', { count: score })}>
              <motion.span key={score} className="inline-block" initial={still ? false : { scale: 1.3 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 16 }}>{score}</motion.span>
            </span>
            <div className="pointer-events-auto max-w-[7rem] portrait:max-w-none">
              <PowerUpTray manifest={bubblePopManifest} items={held.held} onUse={useHeld} disabled={phase !== 'play' || step !== 'aim'} />
            </div>
          </div>

          <section className="bp-board absolute left-1/2 -translate-x-1/2 min-w-0">
            <div className="relative w-full rounded-[1.5rem] overflow-hidden select-none touch-none p-[0.5rem]"
              style={{ ...pieceFill(theme, 'board', BOARD_COLOR), border: `0.25rem solid ${INK}`, boxShadow: `0 0.375rem 0 ${INK}` }}>
              <div className="relative w-full" style={{ aspectRatio: `${W} / ${H}` }}>
                <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full overflow-visible" role="img" aria-label={t('bp.boardLabel')}
                  style={{ cursor: canAim ? 'crosshair' : 'default' }}
                  onPointerMove={(e) => { if (canAim && (e.pointerType === 'mouse' || pressed.current)) setAngle(toAngle(e)); }}
                  onPointerDown={(e) => { if (!canAim) return; pressed.current = true; setAngle(toAngle(e)); }}
                  onPointerUp={(e) => { if (!pressed.current) return; pressed.current = false; const a = toAngle(e); setAngle(a); shoot(a); }}
                  onPointerLeave={() => { pressed.current = false; }}>
                  <defs><BubblePatternDefs patterns={patterns} /></defs>
                  {/* The danger line: dashed Pink punch. */}
                  <line x1={0.2} x2={W - 0.2} y1={dangerY} y2={dangerY} stroke="#f055a5" strokeWidth={0.2} strokeDasharray="0.55 0.45" strokeLinecap="round" />
                  {board.rows.slice(0, MAX_ROWS).map((row, r) => row.slice(0, rowLen(board, r)).map((k, c) => {
                    if (k === null) return null;
                    const p = center(board, r, c);
                    return bubble(k, p.x, p.y, `${level}-${r}-${c}-${board.parity}`, still ? '' : 'bp-fx', still ? undefined : { animation: 'bp-in 0.25s ease-out' });
                  }))}
                  {fx.map((f) => f.hits.map(([r, c, k]) => {
                    const p = center(f.board, r, c);
                    return bubble(k, p.x, p.y, `fx-${f.id}-${r}-${c}`, 'bp-fx', { animation: f.kind === 'pop' ? 'bp-pop 0.7s ease-in forwards' : 'bp-fall 0.8s ease-in forwards', pointerEvents: 'none' });
                  }))}
                  {/* Paper sparkles burst out where a group popped (the mockup's sparkle). */}
                  {fx.filter((f) => f.kind === 'pop').map((f) => f.hits.slice(0, 6).map(([r, c], i) => {
                    const p = center(f.board, r, c);
                    return <path key={`sp-${f.id}-${r}-${c}`} d={sparkD(p.x, p.y, 0.95)} fill="#fffaf0" stroke={INK} strokeWidth={0.1} strokeLinejoin="round" className="bp-fx" style={{ animation: `bp-spark 0.75s ease-out ${i * 40}ms both`, pointerEvents: 'none' }} />;
                  }))}
                  {/* The aim: a dotted ink line from the shooter and a ring where it lands. */}
                  {canAim && aim.path.length > 1 && (
                    <>
                      <polyline points={aim.path.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={INK} strokeWidth={0.24} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="0.01 0.75" />
                      {landing && <circle cx={landing.x} cy={landing.y} r={R * 0.9} fill="none" stroke={INK} strokeOpacity={0.55} strokeWidth={0.12} strokeDasharray="0.4 0.3" />}
                    </>
                  )}
                  {/* Launcher: the current bubble on a soft shadow and, beside it, the next one. */}
                  <ellipse cx={SHOOTER.x} cy={SHOOTER.y + 1.5} rx={R * 1.5} ry={R * 0.32} fill={INK} opacity={0.14} />
                  <g ref={flyer} transform={flyT(0, 0, LOADED)}>{phase === 'play' && step !== 'question' && shotBubble(shooter.now, SHOOTER.x, SHOOTER.y)}</g>
                  <text x={SHOOTER.x + 3.6} y={SHOOTER.y - 0.85} textAnchor="middle" fontSize={0.85} fontWeight={700} fill="#57506e" aria-hidden="true">{t('bp.next')}</text>
                  <g>{shotBubble(shooter.next, SHOOTER.x + 3.6, SHOOTER.y + 0.5)}</g>
                  {blast && (
                    <motion.circle key={blast.id} cx={blast.x} cy={blast.y} fill="none" stroke={blast.kind === 'burst' ? '#fabe37' : INK} strokeWidth={0.35}
                      initial={{ r: 0.5, opacity: 1 }} animate={{ r: blast.kind === 'burst' ? 5.5 : 3.5, opacity: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }} onAnimationComplete={() => setBlast(null)} />
                  )}
                </svg>
                {/* The points: a Lemon "POP! +40" pill that springs up where the shot landed. */}
                <AnimatePresence>
                  {gain && (
                    <motion.span key={gain.id} className="absolute z-10 pointer-events-none" style={{ left: `${(Math.min(Math.max(gain.x, 6), W - 6) / W) * 100}%`, top: `${((gain.y + 2.4) / H) * 100}%`, x: '-50%' }}
                      initial={still ? { opacity: 0 } : { opacity: 0, scale: 0.3, y: 0 }} animate={still ? { opacity: [0, 1, 1, 0] } : { opacity: [0, 1, 1, 0], scale: [0.3, 1.18, 1, 1], y: [0, -6, -14, -30] }}
                      transition={{ duration: still ? 0.9 : 1.5, times: [0, 0.22, 0.7, 1] }} onAnimationComplete={() => setGain(null)}>
                      <span className="bp-gy inline-flex items-center whitespace-nowrap px-4 py-1.5 rounded-pill text-2xl sm:text-3xl bg-[var(--lemon)] text-[var(--ink)]"
                        style={{ border: `3px solid ${INK}`, boxShadow: `0 4px 0 ${INK}, 0 0 1.25rem 0.25rem rgba(250,190,55,0.55)` }}>{t('bp.popGain', { n: gain.n })}</span>
                    </motion.span>
                  )}
                </AnimatePresence>
                {/* Special shots and combos call out over the board, in a Pink punch pill. */}
                <AnimatePresence>
                  {callout && (
                    <motion.p key={callout.id} className="absolute inset-x-0 top-[46%] flex justify-center pointer-events-none"
                      initial={still ? { opacity: 0 } : { scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0, y: -16 }} transition={still ? { duration: 0.01 } : { type: 'spring', stiffness: 320, damping: 14 }}
                      onAnimationComplete={() => { const id = callout.id; window.setTimeout(() => setCallout((c) => (c?.id === id ? null : c)), 700); }}>
                      <span className="bp-gy inline-flex px-5 py-2 rounded-pill text-3xl sm:text-4xl bg-[var(--pink-punch)] text-[var(--ink)]" style={{ border: `3px solid ${INK}`, boxShadow: `0 4px 0 ${INK}` }}>{callout.text}</span>
                    </motion.p>
                  )}
                </AnimatePresence>
                {/* Short messages sit low on the board, clear of the bubbles. */}
                {(() => { const msg = note || (step === 'aim' ? (shooter.now === 'rainbow' ? t('bp.rainbowReady') : shooter.now === 'burst' ? t('bp.burstReady') : undefined) : undefined); return msg ? <p className="absolute left-1/2 bottom-[13%] -translate-x-1/2 max-w-[90%] text-center rounded-pill bg-[var(--paper)] px-3 py-0.5 text-sm font-bold pointer-events-none" style={{ border: `2.5px solid ${INK}`, boxShadow: `0 2px 0 ${INK}` }} role="status">{msg}</p> : null; })()}
              </div>
            </div>
          </section>
        </div>
      )}

      {phase === 'end' && <ResultsModal winners={pieceImage(theme, 'player') ? [{ name: t('mm.you'), colorIndex: 0, art: pieceImage(theme, 'player') }] : undefined} title={t('bp.done', { count: score })} missed={missed} againLabel={t('share.again')} onAgain={() => setPhase('welcome')} />}
      {powers.element}
      {element}
    </main>
    </ThemedPage>
  );
}
