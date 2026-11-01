import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowArcLeft, ArrowArcRight, Crosshair, Drop, Flower, Heart, Lightning, Moon, Question, Sparkle, Star, type Icon } from '@phosphor-icons/react';
import { useMySets } from '../../data/hooks';
import { LIBRARY } from '../../data/library';
import { buzz, playEffect } from '../../engine/feedback';
import SoloPanel from '../../engine/SoloPanel';
import ResultsModal from '../../engine/ResultsModal';
import { usePlayClock } from '../../engine/playClock';
import { useAsk } from '../../engine/useAsk';
import { t } from '../../i18n';
import { AccessButton, FullScreenButton, GameTopRow, GearButton, SettingsPanel } from '../../settings/SettingsPanel';
import { useSettings } from '../../settings/SettingsContext';
import { useGamePool } from '../../student/session';
import { PUZZLE_PACK_CLEARED } from '../../config';
import { pieceFill, pieceImage } from '../../theme/library';
import { ThemedPage, useGameTheme } from '../../theme/useGameTheme';
import { Slider } from '../../ui/fields';
import { buttonClasses } from '../../ui/kit';
import GameWelcome from '../GameWelcome';
import SetPicker from '../SetPicker';
import SetupWizard from '../SetupWizard';
import ThemeScreen from '../ThemeScreen';
import { useSavedSetup } from '../useSavedSetup';
import { usePowerUps } from '../../engine/usePowerUps';
import { powerUpSwitches } from '../../engine/PowerUpSwitches';
import { PowerUpTray, useHeldPowerUps } from '../../engine/HeldPowerUps';
import { BUBBLE_COLORS, bubblePopManifest } from './manifest';
import {
  center, clampAngle, colorsLeft, DANGER_ROW, filled, H, lowestRow, makeBoard, MAX_ROWS, nextColor, nextShot, placeShot, pushRow, R, rescue,
  rowLen, SHOOTER, shotPoints, traceShot, W, type Board, type Hit, type Shot,
} from './board';

// Every bubble has its own shape AND color (never color alone).
const SHAPES: Icon[] = [Star, Heart, Lightning, Drop, Flower, Moon];
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
  // Held power-ups (teacher, 2026-10-31): ready for the next turn of shots,
  // listed under the score, gone after that turn.
  const held = useHeldPowerUps();
  function applyItem(i: number) {
    const it = held.use(i);
    if (!it) return;
    playEffect('win', settings);
    if (it.ability === 'shots') setShots((n) => n + powers.amount(it));
    if (it.ability === 'bonus') setScore((sc) => sc + powers.amount(it));
    if (it.ability === 'mystery') setScore((sc) => sc + 10 * (1 + Math.floor(Math.random() * 10)));
    if (it.ability === 'double') { doubleNext.current = true; setNote(t('bm.doubleReady')); }
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
    setShooter({ now: nextColor(b), next: nextShot(b) });
    setAngle(-Math.PI / 2);
    setPhase('play');
    void load(0);
  }

  async function load(done: number) {
    setStep('question');
    setNote(done === 0 ? '' : t('bp.answer'));
    held.endTurn(); // unused power-ups are gone after the turn
    const ok = await ask({ count: plan.current.perBreak });
    if (!ok) { finish(); return; }
    const it = powers.grant(true);
    setShots(plan.current.shots);
    if (it) held.earn('solo', it);
    held.beginTurn('solo');
    setNote('');
    setStep('aim');
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
    window.setTimeout(() => setFx((f) => f.filter((x) => x.id !== id)), 700);
  }

  function shoot(a = angle) {
    if (step !== 'aim' || shots <= 0 || phase !== 'play') return;
    const { path, cell } = traceShot(board, a);
    if (!cell) return;
    setStep('fly');
    playEffect('whoosh', settings);
    const land = () => settle(cell);
    if (still) { land(); return; }
    // The bubble flies along the aim path at a steady speed (bouncing off walls).
    const lens = [0];
    for (let i = 1; i < path.length; i++) lens.push(lens[i - 1] + Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y));
    const total = lens[lens.length - 1];
    const ms = Math.max(220, (total / 45) * 1000);
    const t0 = performance.now();
    const frame = (now: number) => {
      const d = Math.min(1, (now - t0) / ms) * total;
      let i = 1;
      while (i < lens.length - 1 && lens[i] < d) i++;
      const k = (d - lens[i - 1]) / (lens[i] - lens[i - 1] || 1);
      const x = path[i - 1].x + (path[i].x - path[i - 1].x) * k;
      const y = path[i - 1].y + (path[i].y - path[i - 1].y) * k;
      flyer.current?.setAttribute('transform', `translate(${x - SHOOTER.x} ${y - SHOOTER.y})`);
      if (d < total) requestAnimationFrame(frame); else land();
    };
    requestAnimationFrame(frame);
  }

  function settle([r, c]: [number, number]) {
    flyer.current?.setAttribute('transform', '');
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
      playEffect(res.popped.length + res.dropped.length >= 6 ? 'win' : 'right', settings); buzz(25, settings);
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

  const patterns = BUBBLE_COLORS.map((_, i) => pieceImage(theme, `bubble-${i}`));
  // Classic bubbles are shiny balls (teacher, 2026-10-31) with their shape
  // icon kept on top, so color is never the only clue.
  const fill = (k: number) => (patterns[k] || PUZZLE_PACK_CLEARED ? `url(#bp-art-${k})` : BUBBLE_COLORS[k]);
  const bubble = (k: number, x: number, y: number, key?: string, cls = '', style?: React.CSSProperties) => {
    const S = SHAPES[k];
    return (
      <g key={key} className={cls} style={style}>
        <circle cx={x} cy={y} r={R * 0.94} fill={fill(k)} stroke={PUZZLE_PACK_CLEARED && !patterns[k] ? 'none' : '#000'} strokeWidth={0.13} />
        {!patterns[k] && (PUZZLE_PACK_CLEARED ? <S x={x - 0.42} y={y - 0.36} size={0.84} weight="fill" color="#241c3d" opacity={0.8} /> : <S x={x - 0.55} y={y - 0.55} size={1.1} weight="fill" color="#241c3d" />)}
        {(patterns[k] || !PUZZLE_PACK_CLEARED) && <ellipse cx={x - 0.35} cy={y - 0.42} rx={0.26} ry={0.15} fill="#fff" opacity={0.7} />}
      </g>
    );
  };
  // Special shots: a rainbow bubble (wedges of every color, a white star) and
  // a star burst (dark with a glowing ring and a sparkle).
  const shotBubble = (shot: Shot, x: number, y: number) => {
    if (typeof shot === 'number') return bubble(shot, x, y);
    if (shot === 'rainbow') return (
      <g>
        {BUBBLE_COLORS.map((col, i) => { const a0 = (i / 6) * Math.PI * 2, a1 = ((i + 1) / 6) * Math.PI * 2, rr = R * 0.94; return <path key={i} d={`M${x} ${y} L${x + Math.cos(a0) * rr} ${y + Math.sin(a0) * rr} A${rr} ${rr} 0 0 1 ${x + Math.cos(a1) * rr} ${y + Math.sin(a1) * rr} Z`} fill={col} />; })}
        <circle cx={x} cy={y} r={R * 0.94} fill="none" stroke="#000" strokeWidth={0.13} />
        <Star x={x - 0.5} y={y - 0.5} size={1} weight="fill" color="#fff" />
      </g>
    );
    return (
      <g>
        <circle cx={x} cy={y} r={R * 1.25} fill="none" stroke="#fdfd94" strokeWidth={0.18} opacity={0.8} className={still ? '' : 'bp-ring'} style={{ transformOrigin: `${x}px ${y}px`, transformBox: 'view-box' }} />
        <circle cx={x} cy={y} r={R * 0.94} fill="#241c3d" stroke="#fdfd94" strokeWidth={0.16} />
        <Sparkle x={x - 0.55} y={y - 0.55} size={1.1} weight="fill" color="#fdfd94" />
      </g>
    );
  };
  const landing = aim.cell ? center(board, aim.cell[0], aim.cell[1]) : null;
  const dangerY = R + DANGER_ROW * Math.sqrt(3) - R;

  return (
    <ThemedPage theme={theme} menu={phase !== 'play' && phase !== 'end'}>
    <main className={phase === 'play' || phase === 'end' ? '!p-0' : 'max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-4'}>
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context="bubble-pop" />
      {clock.element}
      {phase === 'play' || phase === 'end' ? <h1 className="sr-only">{bubblePopManifest.name}</h1> : <GameTopRow onSettings={() => setSettingsOpen(true)} />}

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
              {powerUpSwitches({ manifest: bubblePopManifest, theme, on: setup.powerUps, off: setup.powerOff ?? [], change })}
              <Slider label={t('bp.perBreak')} hint={t('bp.perBreakHint')} min={1} max={5} value={setup.perBreak} onChange={(v) => change({ perBreak: v })} />
            </>
          ) },
        ]} />
      )}

      {(phase === 'play' || phase === 'end') && (
        // The board fills the play space like the reference games, the same in
        // full screen; small controls sit on top (teacher, 2026-10-31).
        <div className="relative play-fill grid content-center gap-3 px-3 py-3 lg:flex lg:justify-center lg:items-center lg:gap-4">
          <div className="absolute top-3 right-3 flex items-center gap-2 z-10 [&_button]:!w-11 [&_button]:!h-11">
            <FullScreenButton small />
            <AccessButton small />
            <GearButton small onClick={() => setSettingsOpen(true)} />
          </div>

          {/* The board is the star: as big as the screen allows, with the score
              panel right beside it, not across the page (teacher, 2026-10-31). */}
          <div className="contents lg:flex lg:items-start lg:gap-4">
          <section className="grid gap-2 min-w-0">
            <div className="relative mx-auto rounded-panel border-[3px] border-border overflow-hidden select-none touch-none [--bp-extra:4.375rem] lg:[--bp-extra:0rem]"
              style={{ ...pieceFill(theme, 'board', '#314677'), aspectRatio: `${W} / ${H}`, width: `calc((var(--play-h) - 6.5rem - var(--bp-extra)) * ${W / H})`, maxWidth: '100%', boxShadow: 'var(--shadow-sticker-lg)' }}>
              <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" role="img" aria-label={t('bp.boardLabel')}
                style={{ cursor: canAim ? 'crosshair' : 'default' }}
                onPointerMove={(e) => { if (canAim && (e.pointerType === 'mouse' || pressed.current)) setAngle(toAngle(e)); }}
                onPointerDown={(e) => { if (!canAim) return; pressed.current = true; setAngle(toAngle(e)); }}
                onPointerUp={(e) => { if (!pressed.current) return; pressed.current = false; const a = toAngle(e); setAngle(a); shoot(a); }}
                onPointerLeave={() => { pressed.current = false; }}>
                <defs>
                  {patterns.map((src, i) => (src || PUZZLE_PACK_CLEARED) && (
                    <pattern key={i} id={`bp-art-${i}`} patternContentUnits="objectBoundingBox" width="1" height="1"><image href={src ?? `/classic/bubble-pop/ball-${i}.webp`} width="1" height="1" preserveAspectRatio={src ? 'xMidYMid slice' : 'xMidYMid meet'} /></pattern>
                  ))}
                </defs>
                <line x1={0} x2={W} y1={dangerY} y2={dangerY} stroke="#fff" strokeOpacity={0.35} strokeWidth={0.12} strokeDasharray="0.5 0.4" />
                {board.rows.slice(0, MAX_ROWS).map((row, r) => row.slice(0, rowLen(board, r)).map((k, c) => {
                  if (k === null) return null;
                  const p = center(board, r, c);
                  return bubble(k, p.x, p.y, `${level}-${r}-${c}-${board.parity}`, still ? '' : 'bp-fx', still ? undefined : { animation: 'bp-in 0.25s ease-out' });
                }))}
                {fx.map((f) => f.hits.map(([r, c, k]) => {
                  const p = center(f.board, r, c);
                  return bubble(k, p.x, p.y, `fx-${f.id}-${r}-${c}`, 'bp-fx', { animation: f.kind === 'pop' ? 'bp-pop 0.3s ease-out forwards' : 'bp-fall 0.6s ease-in forwards', pointerEvents: 'none' });
                }))}
                {canAim && aim.path.length > 1 && (
                  <>
                    <polyline points={aim.path.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#fff" strokeWidth={0.22} strokeLinecap="round" strokeDasharray="0.05 0.7" />
                    {landing && <circle cx={landing.x} cy={landing.y} r={R * 0.9} fill="none" stroke="#fff" strokeWidth={0.12} strokeDasharray="0.4 0.3" />}
                  </>
                )}
                {/* Launcher: the current bubble and, beside it, the next one. */}
                <circle cx={SHOOTER.x} cy={SHOOTER.y} r={R * 1.5} fill="#000" opacity={0.25} />
                <g ref={flyer}>{phase === 'play' && step !== 'question' && shotBubble(shooter.now, SHOOTER.x, SHOOTER.y)}</g>
                <g transform={`translate(${SHOOTER.x + 3.4} ${SHOOTER.y + 0.4}) scale(0.7) translate(${-SHOOTER.x - 3.4} ${-SHOOTER.y - 0.4})`} opacity={0.9}>{shotBubble(shooter.next, SHOOTER.x + 3.4, SHOOTER.y + 0.4)}</g>
                {blast && (
                  <motion.circle key={blast.id} cx={blast.x} cy={blast.y} fill="none" stroke={blast.kind === 'burst' ? '#fdfd94' : '#ffffff'} strokeWidth={0.35}
                    initial={{ r: 0.5, opacity: 1 }} animate={{ r: blast.kind === 'burst' ? 5.5 : 3.5, opacity: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }} onAnimationComplete={() => setBlast(null)} />
                )}
                <AnimatePresence>
                  {gain && (
                    <motion.text key={gain.id} x={gain.x} textAnchor="middle" fontSize={1.6} fontWeight={800} fill="#fff" stroke="#000" strokeWidth={0.12} paintOrder="stroke"
                      initial={{ y: gain.y, opacity: 1 }} animate={{ y: gain.y - 3, opacity: 0 }} transition={{ duration: still ? 0.01 : 1 }}
                      onAnimationComplete={() => setGain(null)}>+{gain.n}</motion.text>
                  )}
                </AnimatePresence>
              </svg>
              {/* Special shots and combos call out over the board. */}
              <AnimatePresence>
                {callout && (
                  <motion.p key={callout.id} className="absolute inset-x-0 top-[38%] text-center font-display text-4xl sm:text-5xl text-[#fdfd94] pointer-events-none" style={{ WebkitTextStroke: '2.5px #000', paintOrder: 'stroke' }}
                    initial={still ? { opacity: 0 } : { scale: 0.3, opacity: 0, rotate: -8 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ opacity: 0, y: -16 }} transition={still ? { duration: 0.01 } : { type: 'spring', stiffness: 320, damping: 14 }}
                    onAnimationComplete={() => { const id = callout.id; window.setTimeout(() => setCallout((c) => (c?.id === id ? null : c)), 700); }}>{callout.text}</motion.p>
                )}
              </AnimatePresence>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button type="button" className={buttonClasses('secondary', 'w-14 h-14 !px-0')} aria-label={t('bp.left')} disabled={!canAim} onClick={() => setAngle((a) => clampAngle(a - 0.08))}><ArrowArcLeft weight="bold" size={26} /></button>
              <button type="button" className={buttonClasses('primary', 'h-14 !px-6 !text-lg')} disabled={!canAim} onClick={() => shoot()}><Crosshair weight="bold" size={24} />{t('bp.shoot')}</button>
              <button type="button" className={buttonClasses('secondary', 'w-14 h-14 !px-0')} aria-label={t('bp.right')} disabled={!canAim} onClick={() => setAngle((a) => clampAngle(a + 0.08))}><ArrowArcRight weight="bold" size={26} /></button>
            </div>
          </section>
          <div className="order-first lg:order-none lg:w-[230px] grid gap-3 content-start">
            <SoloPanel score={score} line={t('bp.board', { n: level + 1 })}
              dots={{ left: shots, total: plan.current.shots, label: t('bp.shots', { count: shots }) }}
              status={step === 'aim' ? (shooter.now === 'rainbow' ? t('bp.rainbowReady') : shooter.now === 'burst' ? t('bp.burstReady') : t('bp.aim')) : step === 'fly' ? t('bp.flying') : t('bp.answer')} note={note} />
            {/* Held power-ups, right under the score (teacher, 2026-10-31). */}
            <div className="hidden lg:block"><PowerUpTray manifest={bubblePopManifest} items={held.held} onUse={applyItem} disabled={step !== 'aim'} /></div>
          </div>
          <div className="lg:hidden fixed left-3 bottom-3 w-[min(15rem,60vw)] z-20"><PowerUpTray manifest={bubblePopManifest} items={held.held} onUse={applyItem} disabled={step !== 'aim'} /></div>
          </div>
        </div>
      )}

      {phase === 'end' && <ResultsModal title={t('bp.done', { count: score })} missed={missed} againLabel={t('share.again')} onAgain={() => setPhase('welcome')} />}
      {powers.element}
      {element}
    </main>
    </ThemedPage>
  );
}
