import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowArcLeft, ArrowArcRight, Crosshair, Drop, Flower, Heart, Lightning, Moon, Question, Star, type Icon } from '@phosphor-icons/react';
import { useMySets } from '../../data/hooks';
import { LIBRARY } from '../../data/library';
import { buzz, playEffect } from '../../engine/feedback';
import ResultsModal from '../../engine/ResultsModal';
import { useAsk } from '../../engine/useAsk';
import { t } from '../../i18n';
import { GameTopRow, SettingsPanel } from '../../settings/SettingsPanel';
import { useSettings } from '../../settings/SettingsContext';
import { useGamePool } from '../../student/session';
import { pieceColor, pieceFill, pieceImage } from '../../theme/library';
import { ThemedPage, useGameTheme } from '../../theme/useGameTheme';
import { Slider, Toggle } from '../../ui/fields';
import { buttonClasses } from '../../ui/kit';
import Title from '../../ui/Title';
import GameWelcome from '../GameWelcome';
import SetPicker from '../SetPicker';
import SetupWizard from '../SetupWizard';
import ThemeScreen from '../ThemeScreen';
import { useSavedSetup } from '../useSavedSetup';
import { usePowerUps } from '../../engine/usePowerUps';
import { BUBBLE_COLORS, bubblePopManifest } from './manifest';
import {
  center, clampAngle, DANGER_ROW, filled, H, lowestRow, makeBoard, MAX_ROWS, nextColor, place, pushRow, R, rescue,
  rowLen, SHOOTER, shotPoints, traceShot, W, type Board, type Hit,
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
  const [setup, change] = useSavedSetup('bubble-pop', { setId: LIBRARY[0].id, rounds: 4, shots: 5, perBreak: 1, powerUps: true });
  const setId = sets.some((s) => s.id === setup.setId) ? setup.setId : LIBRARY[0].id;
  const chosen = useMemo(() => sets.filter((s) => s.id === setId).map((set) => ({ set, starred: false })), [sets, setId]);
  const game = useGamePool(chosen);
  const { ask, element, missed } = useAsk({ gameId: 'bubble-pop', mode: 'solo', pool: game.pool, classroomId: game.classroomId, studentId: game.studentId });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('welcome');
  const [step, setStep] = useState<Step>('question');
  const [board, setBoard] = useState<Board>(() => makeBoard(0));
  const [level, setLevel] = useState(0);
  const [shooter, setShooter] = useState({ now: 0, next: 1 });
  const [angle, setAngle] = useState(-Math.PI / 2);
  const [shots, setShots] = useState(0);
  const [breaks, setBreaks] = useState(0);
  const [score, setScore] = useState(0);
  const [noPop, setNoPop] = useState(0);
  const [note, setNote] = useState('');
  const [fx, setFx] = useState<Fx[]>([]);
  const [gain, setGain] = useState<{ id: number; n: number; x: number; y: number } | null>(null);
  const plan = useRef({ rounds: 4, shots: 5, perBreak: 1 });
  // Power-ups after a question break: more bubbles, bonus points, or a doubled pop.
  const powers = usePowerUps(bubblePopManifest, theme, setup.powerUps);
  const doubleNext = useRef(false);
  const svg = useRef<SVGSVGElement>(null);
  const flyer = useRef<SVGGElement>(null);
  const shotCount = useRef(0);
  const pressed = useRef(false);

  const aim = useMemo(() => traceShot(board, angle), [board, angle]);

  function start() {
    plan.current = { rounds: setup.rounds, shots: setup.shots, perBreak: setup.perBreak };
    const b = makeBoard(0);
    setBoard(b); setLevel(0); setScore(0); setBreaks(0); setShots(0); setNoPop(0); setNote(''); setFx([]); setGain(null);
    doubleNext.current = false;
    setShooter({ now: nextColor(b), next: nextColor(b) });
    setAngle(-Math.PI / 2);
    setPhase('play');
    void load(0);
  }

  async function load(done: number) {
    setStep('question');
    setNote(done === 0 ? '' : t('bp.answer'));
    const ok = await ask({ count: plan.current.perBreak });
    if (!ok) { finish(); return; }
    const it = powers.grant();
    setShots(plan.current.shots + (it?.ability === 'shots' ? powers.amount(it) : 0));
    if (it?.ability === 'bonus') setScore((s) => s + powers.amount(it));
    if (it?.ability === 'double') doubleNext.current = true;
    setNote('');
    setStep('aim');
  }

  function finish() {
    setPhase('end');
    playEffect('win', settings);
    if (settings.celebrations !== 'off' && !still) void confetti({ particleCount: settings.celebrations === 'big' ? 140 : 60, spread: 80, origin: { y: 0.6 }, disableForReducedMotion: true });
  }

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
    const res = place(board, r, c, shooter.now);
    let b = res.board;
    let points = shotPoints(res);
    let message = '';
    let misses = noPop;
    if (res.popped.length) {
      playEffect('right', settings); buzz(25, settings);
      addFx(res.popped, 'pop', board); addFx(res.dropped, 'fall', board);
      misses = 0;
    } else {
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
    setShooter({ now: shooter.next, next: nextColor(b) });
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
  const fill = (k: number) => (patterns[k] ? `url(#bp-art-${k})` : pieceColor(theme, `bubble-${k}`, BUBBLE_COLORS[k]));
  const bubble = (k: number, x: number, y: number, key?: string, cls = '', style?: React.CSSProperties) => {
    const S = SHAPES[k];
    return (
      <g key={key} className={cls} style={style}>
        <circle cx={x} cy={y} r={R * 0.94} fill={fill(k)} stroke="#000" strokeWidth={0.13} />
        {!patterns[k] && <S x={x - 0.55} y={y - 0.55} size={1.1} weight="fill" color="#241c3d" />}
        <ellipse cx={x - 0.35} cy={y - 0.42} rx={0.26} ry={0.15} fill="#fff" opacity={0.7} />
      </g>
    );
  };
  const landing = aim.cell ? center(board, aim.cell[0], aim.cell[1]) : null;
  const dangerY = R + DANGER_ROW * Math.sqrt(3) - R;

  return (
    <ThemedPage theme={theme}>
    <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-4">
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context="bubble-pop" />
      <GameTopRow onSettings={() => setSettingsOpen(true)}>
        {(phase === 'play' || phase === 'end') && <h1 className="title-bubble text-3xl sm:text-4xl hidden lg:block"><Title text={bubblePopManifest.name} /></h1>}
      </GameTopRow>

      {phase === 'welcome' && (
        <GameWelcome game={bubblePopManifest} cover={pieceImage(theme, 'cover')} onStart={() => setPhase('theme')} steps={[
          { icon: <Question weight="bold" size={22} />, text: t('bp.how1') },
          { icon: <Crosshair weight="bold" size={22} />, text: t('bp.how2') },
          { icon: <Star weight="fill" size={22} />, text: t('bp.how3') },
        ]} />
      )}
      {phase === 'theme' && <ThemeScreen gameName={bubblePopManifest.name} current={theme} themes={themes} playable={playable} onChoose={choose} onBack={() => setPhase('welcome')} onNext={() => setPhase('setup')} />}
      {phase === 'setup' && (
        <SetupWizard onBack={() => setPhase('theme')} onPlay={start} pages={[
          ...(game.assigned ? [] : [{ id: 'questions', title: t('setup.questions'), content: <SetPicker sets={sets} value={[setId]} onChange={(ids) => change({ setId: ids[0] })} /> }]),
          { id: 'options', title: t('setup.options'), content: (
            <>
              <Slider label={t('bp.rounds')} min={1} max={10} value={setup.rounds} onChange={(v) => change({ rounds: v })} />
              <Slider label={t('bp.shotsEach')} min={3} max={10} value={setup.shots} onChange={(v) => change({ shots: v })} />
              <Toggle label={t('pu.toggle')} hint={t('pu.toggleHint')} value={setup.powerUps} onChange={(v) => change({ powerUps: v })} />
              <Slider label={t('bp.perBreak')} min={1} max={5} value={setup.perBreak} onChange={(v) => change({ perBreak: v })} />
            </>
          ) },
        ]} />
      )}

      {(phase === 'play' || phase === 'end') && (
        <div className="grid lg:grid-cols-[1fr_230px] gap-3 lg:gap-5 items-start">
          <section className="grid gap-2 min-w-0">
            <div className="relative mx-auto w-full rounded-panel border-[3px] border-border overflow-hidden select-none touch-none [--bp-extra:4.375rem] lg:[--bp-extra:0rem]"
              style={{ ...pieceFill(theme, 'board', '#314677'), aspectRatio: `${W} / ${H}`, maxWidth: `min(100%, calc((100dvh - 15.25rem + var(--chrome-save, 0rem) - var(--bp-extra)) * ${W / H}))`, boxShadow: 'var(--shadow-sticker-lg)' }}>
              <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" role="img" aria-label={t('bp.boardLabel')}
                style={{ cursor: canAim ? 'crosshair' : 'default' }}
                onPointerMove={(e) => { if (canAim && (e.pointerType === 'mouse' || pressed.current)) setAngle(toAngle(e)); }}
                onPointerDown={(e) => { if (!canAim) return; pressed.current = true; setAngle(toAngle(e)); }}
                onPointerUp={(e) => { if (!pressed.current) return; pressed.current = false; const a = toAngle(e); setAngle(a); shoot(a); }}
                onPointerLeave={() => { pressed.current = false; }}>
                <defs>
                  {patterns.map((src, i) => src && (
                    <pattern key={i} id={`bp-art-${i}`} patternContentUnits="objectBoundingBox" width="1" height="1"><image href={src} width="1" height="1" preserveAspectRatio="xMidYMid slice" /></pattern>
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
                <g ref={flyer}>{phase === 'play' && step !== 'question' && bubble(shooter.now, SHOOTER.x, SHOOTER.y)}</g>
                <g transform={`translate(${SHOOTER.x + 3.4} ${SHOOTER.y + 0.4}) scale(0.7) translate(${-SHOOTER.x - 3.4} ${-SHOOTER.y - 0.4})`} opacity={0.9}>{bubble(shooter.next, SHOOTER.x + 3.4, SHOOTER.y + 0.4)}</g>
                <AnimatePresence>
                  {gain && (
                    <motion.text key={gain.id} x={gain.x} textAnchor="middle" fontSize={1.6} fontWeight={800} fill="#fff" stroke="#000" strokeWidth={0.12} paintOrder="stroke"
                      initial={{ y: gain.y, opacity: 1 }} animate={{ y: gain.y - 3, opacity: 0 }} transition={{ duration: still ? 0.01 : 1 }}
                      onAnimationComplete={() => setGain(null)}>+{gain.n}</motion.text>
                  )}
                </AnimatePresence>
              </svg>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button type="button" className={buttonClasses('secondary', 'w-14 h-14 !px-0')} aria-label={t('bp.left')} disabled={!canAim} onClick={() => setAngle((a) => clampAngle(a - 0.08))}><ArrowArcLeft weight="bold" size={26} /></button>
              <button type="button" className={buttonClasses('primary', 'h-14 !px-6 !text-lg')} disabled={!canAim} onClick={() => shoot()}><Crosshair weight="bold" size={24} />{t('bp.shoot')}</button>
              <button type="button" className={buttonClasses('secondary', 'w-14 h-14 !px-0')} aria-label={t('bp.right')} disabled={!canAim} onClick={() => setAngle((a) => clampAngle(a + 0.08))}><ArrowArcRight weight="bold" size={26} /></button>
            </div>
          </section>
          <aside className="order-first lg:order-none grid gap-2 lg:gap-3">
            <div className="bg-surface border-[2.5px] border-border rounded-panel px-4 py-2 lg:p-4 flex lg:grid items-center gap-x-5 gap-y-2 flex-wrap" style={{ boxShadow: 'var(--shadow-sticker)' }}>
              <motion.p key={score} initial={still ? false : { scale: 1.3 }} animate={{ scale: 1 }} className="font-display text-3xl lg:text-4xl tabular-nums">{score}</motion.p>
              <p className="font-bold">{t('bp.board', { n: level + 1 })}</p>
              <div className="flex gap-1.5 flex-wrap" role="img" aria-label={t('bp.shots', { count: shots })}>
                {Array.from({ length: Math.max(plan.current.shots, shots) }, (_, i) => (
                  <span key={i} className={`w-5 h-5 rounded-full border-[2px] border-border ${i < shots ? 'bg-accent' : 'bg-surface-2'}`} />
                ))}
              </div>
              <p className="font-display text-lg lg:text-xl w-full lg:w-auto" aria-live="polite">{step === 'aim' ? t('bp.aim') : step === 'fly' ? t('bp.flying') : t('bp.answer')}</p>
            </div>
            <AnimatePresence>
              {note && (
                <motion.p key={note} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="font-bold bg-surface rounded-input border-[2px] border-border p-3" role="status">{note}</motion.p>
              )}
            </AnimatePresence>
          </aside>
        </div>
      )}

      {phase === 'end' && <ResultsModal title={t('bp.done', { count: score })} missed={missed} againLabel={t('share.again')} onAgain={() => setPhase('welcome')} />}
      {powers.element}
      {element}
    </main>
    </ThemedPage>
  );
}
