import Title from '../../ui/Title';
import { pace } from '../../engine/pace';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowArcLeft, ArrowArcRight, CheckCircle, Crosshair, HandTap, Trophy } from '@phosphor-icons/react';
import { data, newId } from '../../data';
import { LIBRARY } from '../../data/library';
import { useMySets } from '../../data/hooks';
import type { MultipleChoiceQuestion } from '../../data/types';
import { buzz, playEffect } from '../../engine/feedback';
import { makeDeck } from '../../engine/picker';
import ResultsModal from '../../engine/ResultsModal';
import ShareQuestion from '../../engine/ShareQuestion';
import ScoreBoard from '../../engine/ScoreBoard';
import { CHANCES } from '../../engine/turns';
import TeamSetup from '../../engine/TeamSetup';
import { TeamArt } from '../../engine/TeamBadge';
import { addPoints, current, leaders, nextTurn, startTurns, type CpuLevel, type TurnPlayer, type TurnState } from '../../engine/turns';
import { usePlayClock } from '../../engine/playClock';
import { useAsk } from '../../engine/useAsk';
import { t } from '../../i18n';
import { AccessButton, FullScreenButton, GameTopRow, GearButton, SettingsPanel } from '../../settings/SettingsPanel';
import { useSettings } from '../../settings/SettingsContext';
import { useGamePool } from '../../student/session';
import { pieceColor, pieceFill, pieceImage } from '../../theme/library';
import { ThemedPage, useGameTheme } from '../../theme/useGameTheme';
import { Slider } from '../../ui/fields';
import { useSignedIn } from '../../auth/session';
import GameWelcome from '../GameWelcome';
import SetPicker from '../SetPicker';
import WayToPlay from '../WayToPlay';
import SetupWizard from '../SetupWizard';
import ThemeScreen from '../ThemeScreen';
import { useSavedSetup } from '../useSavedSetup';
import { usePowerUps } from '../../engine/usePowerUps';
import { powerUpSwitches } from '../../engine/PowerUpSwitches';
import { PowerUpTray, useHeldPowerUps } from '../../engine/HeldPowerUps';
import { bowlingManifest } from './manifest';
import { cpuPlan, fullRack, halfWidthAt, PIN_SPOTS, PIN_XY, rollPoints, scaleAt, shakePins, simulateRoll, toView, xAt, yAt, type SimResult } from './lane';

type Phase = 'welcome' | 'theme' | 'setup' | 'play' | 'end';
type Step = 'question' | 'aim' | 'spin' | 'roll' | 'result';
// Classic: a bowling alley, no space look (teacher, 2026-10-31), and real
// bowling balls from the Puzzle Games Graphics Pack, one color per player.
// Each player's ball is their icon too (teacher, 2026-11-01): the ball they
// pick on the Teams page is the one they roll. A theme draws up to 10 balls
// (pieces ball-1 to ball-10); any it leaves out stay Classic.
const BALLS = 10;
const classicBallArt = (k: number) => `/classic/bowling/ball-${k % BALLS}.webp`;
// Wood boards down the lane, fixed so they never jump between turns.
const BOARDS = Array.from({ length: 9 }, (_, i) => -1.2 + (i + 1) * 0.24);

// Bowling (launch roster, Stage 7): a right answer earns a roll. Tap a
// lane and the ball rolls into ten pins. Two rolls a frame;
// strikes and spares earn a bonus. Teams on one screen or one player.
export default function Bowling() {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const { theme, themes, playable, choose } = useGameTheme('bowling');
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const [setup, change] = useSavedSetup('bowling', { setId: LIBRARY[0].id, frames: 3, who: 'teams' as 'teams' | 'solo' | 'versus', powerUps: true , powerOff: [] as string[]});
  const setId = sets.some((s) => s.id === setup.setId) ? setup.setId : LIBRARY[0].id;
  const picked = useMemo(() => sets.filter((s) => s.id === setId).map((set) => ({ set, starred: false })), [sets, setId]);
  const game = useGamePool(picked);
  // Students who join with a code play on their own device; teachers pick the way.
  const { teacher } = useSignedIn();
  const solo = setup.who === 'solo' || !teacher;
  const { ask, cancel, asking, element, missed: soloMissed } = useAsk({ gameId: 'bowling', mode: 'solo', pool: game.pool, classroomId: game.classroomId, studentId: game.studentId });
  const deck = useMemo(() => makeDeck(game.pool), [game.pool]);
  const [team, setTeam] = useState<{ players: TurnPlayer[]; level: CpuLevel }>({ players: [], level: 'medium' });
  const [phase, setPhase] = useState<Phase>('welcome');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [turns, setTurns] = useState<TurnState | null>(null);
  // The teacher's play clock or score goal (2026-10-31) ends a solo game the usual way.
  const turnsNow = useRef<TurnState | null>(null);
  turnsNow.current = turns;
  const clock = usePlayClock({ playing: phase === 'play' && solo, score: turns?.players[0]?.score ?? 0, onTimeUp: () => { if (asking) cancel(); else if (turnsNow.current) end(turnsNow.current); } });
  const [step, setStep] = useState<Step>('question');
  const [question, setQuestion] = useState<{ q: MultipleChoiceQuestion; setId?: string; chance: number } | null>(null);
  const [standing, setStandingState] = useState<boolean[]>(fullRack);
  // Refs so delayed steps (the roll, Pin Twister, the computer) always use
  // the latest rack and scores (Claudia review, 2026-10-31).
  const standingRef = useRef<boolean[]>(fullRack());
  const setStanding = (v: boolean[] | ((s: boolean[]) => boolean[])) => { const next = typeof v === 'function' ? v(standingRef.current) : v; standingRef.current = next; setStandingState(next); };
  const setT = (st: TurnState) => { turnsNow.current = st; setTurns(st); };
  // Off once the game ends, so a roll in flight stops cleanly.
  const alive = useRef(false);
  const [roll, setRoll] = useState<0 | 1>(0);
  const [frames, setFrames] = useState(0);
  const [banner, setBanner] = useState<{ id: number; text: string; kind?: 'strike' | 'spare' | 'miss' | 'split' | null; sign?: string } | null>(null);
  // Strikes in a row for each player: two is a Double, three a Turkey.
  const streak = useRef<Record<string, number>>({});
  const [missed, setMissed] = useState<MultipleChoiceQuestion[]>([]);
  const timers = useRef<number[]>([]);
  // Power-ups (teacher, 2026-10-31): a right answer may bring one; it waits
  // for this player's next turn under the scores and is gone after that turn.
  const powers = usePowerUps(bowlingManifest, theme, setup.powerUps, setup.powerOff ?? []);
  const held = useHeldPowerUps();
  const boost = useRef({ double: false, magnet: false, bumpers: false, mega: false });
  const [armed, setArmed] = useState<string[]>([]);
  function earned(state: TurnState) {
    // Sneaky Swipe only comes up when another player has points to take.
    const me = current(state).id;
    const it = powers.grant(true, (x) => x.ability !== 'swipe' || state.players.some((p) => p.id !== me && p.score > 0));
    if (it) held.earn(current(state).id, it);
  }
  function applyItem(i: number) {
    const state = turnsNow.current;
    const it = held.use(i);
    if (!it || !state) return;
    playEffect('win', settings);
    const me = current(state).id;
    const ab = it.ability as keyof typeof boost.current | 'mystery' | 'swipe' | 'bonus' | 'twister';
    if (ab === 'double' || ab === 'magnet' || ab === 'bumpers' || ab === 'mega') { boost.current[ab] = true; setArmed((a) => [...a, ab]); return; }
    if ((ab as string) === 'twister') { twist(); return; }
    if (ab === 'mystery') setT(addPoints(state, me, 1 + Math.floor(Math.random() * 10)));
    if (ab === 'bonus') setT(addPoints(state, me, powers.amount(it)));
    if (ab === 'swipe') {
      const n = powers.amount(it);
      const top = state.players.filter((p) => p.id !== me).sort((a, b) => b.score - a.score)[0];
      const take = top ? Math.min(n, top.score) : n;
      setT(top ? addPoints(addPoints(state, top.id, -take), me, take) : addPoints(state, me, n));
    }
  }
  // Pin Twister: the deck shakes, every pin wobbles, some topple (worth points).
  const [twisting, setTwisting] = useState(false);
  function twist() {
    if (!turnsNow.current || twisting) return;
    const fall = shakePins(standingRef.current);
    setTwisting(true);
    if (!still && settings.screenShake) setShake(true);
    playEffect('whoosh', settings);
    later(() => {
      setTwisting(false); setShake(false);
      if (!alive.current) return;
      setStanding((st) => st.map((up, i) => up && !fall.includes(i)));
      const state = turnsNow.current;
      if (!alive.current || !state) return;
      if (fall.length) { setT(addPoints(state, current(state).id, fall.length)); setBanner({ id: Date.now(), text: `${t('sb.twister', { count: fall.length })} +${fall.length}`, kind: null }); later(() => setBanner(null), 1300); }
    }, 1100);
  }
  const player = turns ? current(turns) : null;
  const totalFrames = (turns?.players.length ?? 1) * setup.frames;

  useEffect(() => () => { alive.current = false; timers.current.forEach((id) => window.clearTimeout(id)); }, []);
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, still ? Math.min(ms, 300) : ms)); };

  function begin() {
    const players = solo ? [{ id: 'solo', name: t('mm.you'), kind: 'student' as const, colorIndex: 0, score: 0 }] : team.players;
    const state = startTurns(players);
    setT(state); setFrames(0); setMissed([]); setBanner(null); alive.current = true;
    boost.current = { double: false, magnet: false, bumpers: false, mega: false };
    held.reset();
    setPhase('play');
    startFrame(state);
  }
  function startFrame(state: TurnState) {
    setStanding(fullRack()); setRoll(0); setArmed([]); setAim(0); setHook(0);
    boost.current = { double: false, magnet: false, bumpers: false, mega: false };
    held.beginTurn(current(state).id);
    askFor(state, 0);
  }
  function askFor(state: TurnState, r: 0 | 1) {
    setStep('question');
    if (solo) void ask().then((ok) => { if (!ok) { end(state); return; } earned(state); setStep('aim'); });
    else { const d = deck.next(); setQuestion({ q: d.question, setId: d.setId, chance: 1 }); }
    void r;
  }
  function onShareResult(right: boolean) {
    if (!turns || !question || !player) return;
    if (player.kind !== 'cpu' && player.kind !== 'teacher') {
      void data.logQuestion({ id: newId('log'), at: new Date().toISOString(), teamName: player.name, gameId: 'bowling', mode: 'share', setId: question.setId, prompt: question.q.prompt, answer: question.q.choices[question.q.correctIndex], tries: [], ms: 0, outcome: right ? 'right' : 'skipped' });
      if (!right) setMissed((m) => (m.some((x) => x.id === question.q.id) ? m : [...m, question.q]));
    }
    // Three tries, a new question each time (teacher, 2026-10-31, as in Game Show).
    if (!right && question.chance < CHANCES) { const d = deck.next(); setQuestion({ q: d.question, setId: d.setId, chance: question.chance + 1 }); return; }
    setQuestion(null);
    if (right) { earned(turns); setStep('aim'); } else endFrame(turns);
  }

  // Aim, then spin (teacher, 2026-10-31): an arrow sweeps across the lane;
  // tap to set the aim. Then a spin meter sweeps; tap to throw. Every throw
  // runs real pin physics, so pins scatter, bump and teeter differently each time.
  const [aim, setAim] = useState(0);
  const [hook, setHook] = useState(0);
  const sweep = useRef({ t0: 0, raf: 0 });
  useEffect(() => {
    if (still || (step !== 'aim' && step !== 'spin') || player?.kind === 'cpu') return;
    sweep.current.t0 = performance.now();
    const tick = (now: number) => {
      const k = (now - sweep.current.t0) / 1000;
      if (step === 'aim') setAim(Math.sin(k * 2.6) * 0.92);
      else setHook(Math.sin(k * 3.4));
      sweep.current.raf = requestAnimationFrame(tick);
    };
    sweep.current.raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(sweep.current.raf);
  }, [step, still, player?.kind]);
  // A quick double tap never skips the spin meter (a K-3 habit).
  const lockedAt = useRef(0);
  function tapLane() {
    if (player?.kind === 'cpu' || twisting) return;
    if (performance.now() - lockedAt.current < 400) return;
    lockedAt.current = performance.now();
    if (step === 'aim') { playEffect('tap', settings); setStep('spin'); return; }
    if (step === 'spin') throwBall({ aim, hook });
  }
  useEffect(() => {
    if (phase !== 'play' || (step !== 'aim' && step !== 'spin') || player?.kind === 'cpu') return;
    const key = (e: KeyboardEvent) => {
      if (e.repeat || (e.target as HTMLElement | null)?.closest?.('button, input, select, textarea, [role="slider"], [role="dialog"]')) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); tapLane(); }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  // The roll as it plays out: ball and pins frame by frame.
  const [sim, setSim] = useState<{ res: SimResult; at: number; zoom: boolean; wobble: boolean } | null>(null);
  const [shake, setShake] = useState(false);
  const [swept, setSwept] = useState<{ id: number; pins: { i: number; laneX: number; d: number }[] } | null>(null);
  function throwBall(plan: { aim: number; hook: number }) {
    if ((step !== 'aim' && step !== 'spin') || !turnsNow.current || twisting) return;
    const res = simulateRoll(standingRef.current, { ...plan, big: boost.current.mega, magnet: boost.current.magnet, bumpers: boost.current.bumpers });
    boost.current.mega = false; boost.current.magnet = false; boost.current.bumpers = false;
    setStep('roll');
    playEffect('whoosh', settings);
    const last = res.frames[res.frames.length - 1].t;
    const allDown = res.down.length === standingRef.current.filter(Boolean).length && res.down.length > 0;
    const t0 = performance.now();
    let clock = 0, prev = t0, hitShown = false;
    const tick = (now: number) => {
      const real = (now - prev) / 1000; prev = now;
      // Fast down the lane, real time at the pins, slow motion on a strike.
      const atPins = res.hitAt >= 0 && clock >= res.hitAt - 0.05;
      const rate = still ? 6 : !atPins ? 1.9 : allDown && clock < res.hitAt + 0.45 ? 0.45 : 1.15;
      clock = Math.min(last, clock + real * rate);
      if (!hitShown && res.hitAt >= 0 && clock >= res.hitAt) {
        hitShown = true;
        playEffect('right', settings); buzz(40, settings);
        if (!still && settings.screenShake) { setShake(true); later(() => setShake(false), 350); }
        // Pin clatter: a few quick knocks.
        res.down.slice(0, 5).forEach((_, k) => later(() => playEffect('tap', settings), 90 + k * 70));
      }
      setSim({ res, at: clock, zoom: atPins && !still, wobble: false });
      if (!alive.current) return;
      if (clock < last) requestAnimationFrame(tick);
      else {
        // Teetering pins: will they fall?
        if (res.wobbled.length) { setSim({ res, at: clock, zoom: !still, wobble: true }); later(() => land(res), still ? 200 : 1100); }
        else later(() => land(res), 250);
      }
    };
    requestAnimationFrame(tick);
  }
  function land(res: SimResult) {
    const turns = turnsNow.current;
    if (!turns || !alive.current) return;
    const down = res.down;
    const nextStanding = standingRef.current.map((up, i) => up && !down.includes(i));
    const left = nextStanding.filter(Boolean).length;
    const base = rollPoints(down.length, roll, left);
    const points = base.points * (boost.current.double ? 2 : 1);
    const kind = base.kind;
    boost.current.double = false;
    setArmed([]);
    // The pinsetter sweeps the fallen pins away instead of making them vanish.
    const last = res.frames[res.frames.length - 1];
    setSwept({ id: Date.now(), pins: down.map((i) => { const v = toView(last.pins[i][0], last.pins[i][1]); return { i, ...v }; }) });
    later(() => setSwept(null), 900);
    setStanding(nextStanding); setSim(null); setStep('result');
    const scored = addPoints(turns, current(turns).id, points);
    setT(scored);
    const split = !kind && roll === 0 && isSplit(nextStanding);
    const text = kind === 'strike' ? t('sb.strike') : kind === 'spare' ? t('sb.spare') : res.gutter ? t('sb.gutter') : split ? t('sb.split') : down.length === 0 ? t('sb.miss') : t('sb.pins', { count: down.length });
    const me = current(turns).id;
    if (roll === 0) streak.current[me] = kind === 'strike' ? (streak.current[me] ?? 0) + 1 : 0;
    const run = streak.current[me] ?? 0;
    // Classic shows the alley's glowing signs (BowlingGUI, cleared 2026-11-01).
    const sign = !theme.id.endsWith(':classic') ? undefined : kind === 'strike' ? (run >= 3 ? 'turkey' : run === 2 ? 'double' : 'strike') : kind === 'spare' ? 'spare' : undefined;
    const label = kind === 'strike' && run >= 3 ? t('sb.turkey') : kind === 'strike' && run === 2 ? t('sb.double') : text;
    setBanner({ id: Date.now(), text: points ? `${label} +${points}` : label, kind: kind ?? (res.gutter || down.length === 0 ? 'miss' : split ? 'split' : null), sign });
    if (kind) {
      playEffect('win', settings);
      if (settings.celebrations !== 'off' && !still) {
        void confetti({ particleCount: kind === 'strike' ? 140 : 70, spread: 100, origin: { y: 0.35 }, disableForReducedMotion: true });
        if (kind === 'strike') later(() => void confetti({ particleCount: 80, angle: 60, spread: 70, origin: { x: 0, y: 0.6 }, disableForReducedMotion: true }), 250);
        if (kind === 'strike') later(() => void confetti({ particleCount: 80, angle: 120, spread: 70, origin: { x: 1, y: 0.6 }, disableForReducedMotion: true }), 400);
      }
    } else if (!down.length) playEffect('miss', settings);
    later(() => {
      setBanner(null);
      if (!alive.current) return;
      const now = turnsNow.current ?? scored;
      if (roll === 0 && left > 0) { setRoll(1); askFor(now, 1); }
      else endFrame(now);
    }, kind === 'strike' ? 2000 : 1500);
  }
  function endFrame(state: TurnState) {
    held.endTurn(); // unused power-ups are gone after the turn
    const n = frames + 1;
    setFrames(n);
    if (n >= totalFrames) { end(state); return; }
    const next = nextTurn(state);
    setT(next);
    startFrame(next);
  }
  function end(state: TurnState) {
    if (!alive.current && phase === 'end') return;
    alive.current = false;
    timers.current.forEach((id) => window.clearTimeout(id)); timers.current = [];
    setSim(null);
    setT(state); setPhase('end');
    playEffect('win', settings);
    if (settings.celebrations !== 'off' && !still) void confetti({ particleCount: 90, spread: 90, origin: { y: 0.5 }, disableForReducedMotion: true });
  }
  // The computer bowls on its own after a right answer.
  useEffect(() => {
    if (phase !== 'play' || step !== 'aim' || player?.kind !== 'cpu') return;
    const id = window.setTimeout(() => {
      // Twister goes first, then the throw waits for the pins to settle.
      const tw = held.held.findIndex((it) => it.ability === 'twister');
      for (let k = held.held.length - 1; k >= 0; k--) if (k !== tw) applyItem(k);
      if (tw >= 0) { applyItem(tw); later(() => throwBall(cpuPlan()), 1400); } else throwBall(cpuPlan());
    }, 1200 * pace(settings));
    return () => window.clearTimeout(id);
  }, [phase, step, player?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // A theme's own ball for player icon k (an older design's team icon or its
  // one Ball piece stand in).
  const drawnBall = (k: number) => pieceImage(theme, `ball-${k + 1}`) ?? pieceImage(theme, `team-${k + 1}`) ?? pieceImage(theme, 'ball');
  const ballIcons = Array.from({ length: BALLS }, (_, k) => drawnBall(k) ?? (pieceColor(theme, 'ball', '') ? undefined : classicBallArt(k)));
  const tray = <PowerUpTray manifest={bowlingManifest} items={held.held} onUse={applyItem} disabled={(step !== 'aim' && step !== 'spin') || player?.kind === 'cpu' || twisting} />;
  const canAim = phase === 'play' && (step === 'aim' || step === 'spin') && player?.kind !== 'cpu' && !twisting;
  const pinColor = pieceColor(theme, 'pin', '#fbfcf8');
  const pinArt = pieceImage(theme, 'pin');
  const ballColor = pieceColor(theme, 'ball', '#ed9d75');
  const laneColor = pieceColor(theme, 'lane', '#e2b07a');
  const ballK = (player?.colorIndex ?? 0) % BALLS;
  const ballArt = drawnBall(ballK);
  const near = 0, far = 1;
  const lanePoly = `${50 - halfWidthAt(near)},${yAt(near)} ${50 + halfWidthAt(near)},${yAt(near)} ${50 + halfWidthAt(far)},${yAt(far)} ${50 - halfWidthAt(far)},${yAt(far)}`;
  // Where each pin is drawn: from the roll in progress, or its spot.
  const frame = sim ? sim.res.frames[Math.min(sim.res.frames.length - 1, Math.max(0, sim.res.frames.findIndex((f) => f.t >= sim.at)))] : null;
  const prevFrame = sim && frame ? sim.res.frames[Math.max(0, sim.res.frames.indexOf(frame) - 3)] : null;
  const pinsNow = PIN_XY.map(([x, y], i) => {
    const f = frame?.pins[i];
    const px = f ? f[0] : x, py = f ? f[1] : y;
    const v = toView(px, py);
    const dir = f && prevFrame ? Math.sign(f[0] - prevFrame.pins[i][0]) || (i % 2 ? 1 : -1) : 1;
    return { i, ...v, tilt: f ? f[2] : 0, dir, up: standing[i] };
  }).filter((p) => p.up).sort((a, b) => b.d - a.d);
  const ballNow = frame ? toView(frame.ball[0], frame.ball[1]) : { laneX: aim * 1.12, d: 0.02 };
  const ballGone = !!frame && ballNow.d > 0.95;
  const big = armed.includes('mega');
  // The aim line and the curve the spin will put on it.
  const preview = Array.from({ length: 14 }, (_, k) => { const d = (k / 13) * 0.62; const bend = step === 'spin' ? hook * 0.72 * Math.max(0, (d - 0.33) / 0.29) ** 2 : 0; return `${xAt(aim * 1.12 + bend, d)},${yAt(d)}`; }).join(' ');
  const laneW = 'calc((var(--play-h) - 6rem - var(--sb-extra)) * 100 / 130)';

  return (
    <ThemedPage theme={theme} menu={phase !== 'play' && phase !== 'end'}>
    <TeamArt.Provider value={ballIcons}>
    <main className={phase === 'play' || phase === 'end' ? '!p-0' : 'max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-6'}>
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context="bowling" />
      {clock.element}
      {phase !== 'play' && phase !== 'end' && <GameTopRow onSettings={() => setSettingsOpen(true)} />}
      {phase === 'welcome' && (
        <GameWelcome game={bowlingManifest} cover={pieceImage(theme, 'cover')} onStart={() => setPhase(themes.length > 1 ? 'theme' : 'setup')} steps={[
          { icon: <CheckCircle weight="fill" size={22} />, text: t('sb.how1') },
          { icon: <HandTap weight="fill" size={22} />, text: t('sb.how2') },
          { icon: <Trophy weight="fill" size={22} />, text: t('sb.how3') },
        ]} />
      )}
      {phase === 'theme' && <ThemeScreen gameName={bowlingManifest.name} current={theme} themes={themes} playable={playable} onChoose={choose} onBack={() => setPhase('welcome')} onNext={() => setPhase('setup')} />}
      {phase === 'setup' && (
        <SetupWizard onBack={() => setPhase(themes.length > 1 ? 'theme' : 'welcome')} onPlay={begin} pages={[
          // Pick the way to play first (teacher, 2026-10-31); students arrive with theirs set.
          ...(!teacher ? [] : [{ id: 'way', title: t('way.title'), content: <WayToPlay modes={['share', 'versus', 'solo']} value={solo ? 'solo' : setup.who === 'versus' ? 'versus' : 'share'} onChange={(m) => change({ who: m === 'solo' ? 'solo' : m === 'versus' ? 'versus' : 'teams' })} /> }]),
          ...(game.assigned ? [] : [{ id: 'questions', title: t('setup.questions'), content: <SetPicker sets={sets} value={[setId]} onChange={(ids) => change({ setId: ids[0] })} /> }]),
          { id: 'options', title: t('setup.options'), content: (
            <>
              <Slider label={t('sb.frames')} hint={t('sb.framesHint')} min={1} max={10} value={setup.frames} onChange={(v) => change({ frames: v })} />
              {powerUpSwitches({ manifest: bowlingManifest, theme, on: setup.powerUps, off: setup.powerOff ?? [], change })}
            </>
          ) },
          ...(solo ? [] : [setup.who === 'versus'
            // Every Share game can also be played Versus: two players head to head, or one against the computer (teacher, 2026-10-31).
            ? { id: 'players', title: t('setup.players'), ready: team.players.length === 2, content: <TeamSetup key="versus" mode="versus" min={2} max={2} embedded onChange={(players, level) => setTeam({ players: players, level })} /> }
            : { id: 'teams', title: t('setup.teams'), ready: team.players.length > 0, content: <TeamSetup key="share" mode="share" min={1} max={10} embedded onChange={(players, level) => setTeam({ players: players, level })} /> }]),
        ]} />
      )}
      {(phase === 'play' || phase === 'end') && turns && (
        // The lane fills the play space, the same in full screen; small controls
        // on top, the scores right beside it, top aligned (teacher, 2026-10-31).
        <div className="relative play-fill grid grid-cols-[minmax(0,1fr)] content-center gap-3 px-3 py-3 lg:flex lg:justify-center lg:items-center">
          <h1 className="sr-only"><Title text={bowlingManifest.name} /></h1>
          <div className="absolute top-3 right-3 flex items-center gap-2 z-10 [&_button]:!w-11 [&_button]:!h-11">
            <FullScreenButton small />
            <AccessButton small />
            <GearButton small onClick={() => setSettingsOpen(true)} />
          </div>
          <div className="contents lg:flex lg:items-start lg:gap-4">
          <section className="relative grid gap-2 min-w-0 [--sb-extra:4.5rem] lg:[--sb-extra:0rem]">
            <div className={`relative mx-auto rounded-panel border-[3px] border-border overflow-hidden select-none ${shake ? 'cq-shake' : ''} ${canAim ? 'cursor-pointer' : ''}`} onClick={canAim ? tapLane : undefined}
              style={{ ...(pieceImage(theme, 'background') ? pieceFill(theme, 'background', '#07070f') : { background: '#07070f 0 0 / 160px repeat url("/classic/bowling/carpet.svg")' }), aspectRatio: '100 / 130', width: laneW, maxWidth: '100%' }}>
              <svg viewBox="0 0 100 130" className="absolute inset-0 w-full h-full" role="img" aria-label={t('sb.board', { count: standing.filter(Boolean).length })}>
                <defs>
                  <radialGradient id="sb-shine" cx="35%" cy="35%" r="70%"><stop offset="0%" stopColor="#fff" stopOpacity="0.55" /><stop offset="45%" stopColor={ballColor} /><stop offset="100%" stopColor="#000" stopOpacity="0.35" /></radialGradient>
                  <linearGradient id="sb-wood" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor={laneColor} /><stop offset="70%" stopColor={laneColor} /><stop offset="100%" stopColor="#8a5a2b" stopOpacity="0.9" /></linearGradient>
                  <linearGradient id="sb-gloss" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#fff" stopOpacity="0" /><stop offset="45%" stopColor="#fff" stopOpacity="0.28" /><stop offset="55%" stopColor="#fff" stopOpacity="0.28" /><stop offset="100%" stopColor="#fff" stopOpacity="0" /></linearGradient>
                  <radialGradient id="sb-spot" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#fffbe0" stopOpacity="0.55" /><stop offset="100%" stopColor="#fffbe0" stopOpacity="0" /></radialGradient>
                  {ballArt && <pattern id="sb-ball-art" patternContentUnits="objectBoundingBox" width="1" height="1"><image href={ballArt} width="1" height="1" preserveAspectRatio="xMidYMid slice" /></pattern>}
                </defs>
                <g style={{ transformOrigin: '50% 30%', transform: sim?.zoom ? 'scale(1.18)' : 'scale(1)', transition: still ? 'none' : 'transform 0.45s ease-out' }}>
                {!pieceImage(theme, 'background') && <>
                  {/* The masking unit over the pins: an 80s neon sign with chasing lights. */}
                  <rect x={50 - halfWidthAt(far) - 9} y={yAt(far) - 22} width={(halfWidthAt(far) + 9) * 2} height={16} rx={2} fill="#241c3d" stroke="#000" strokeWidth={0.6} />
                  <rect x={50 - halfWidthAt(far) - 7} y={yAt(far) - 20} width={(halfWidthAt(far) + 7) * 2} height={12} rx={1.5} fill="none" stroke="#ff4fa3" strokeWidth={0.9} />
                  {Array.from({ length: 9 }, (_, i) => <circle key={i} cx={50 - halfWidthAt(far) - 4 + i * ((halfWidthAt(far) + 4) * 2) / 8} cy={yAt(far) - 14} r={1.1} fill={['#fdfd94', '#8ec5ff', '#ff4fa3'][i % 3]} className={still ? '' : 'sb-chase'} style={{ animationDelay: `${i * 0.12}s` }} />)}
                  <rect x={0} y={yAt(far) - 5} width={100} height={1.6} fill="#ff4fa3" opacity={0.75} />
                </>}
                {/* Gutters, then the glossy wooden lane with its boards. */}
                <polygon points={`${50 - halfWidthAt(near) - 5},${yAt(near)} ${50 + halfWidthAt(near) + 5},${yAt(near)} ${50 + halfWidthAt(far) + 5 * scaleAt(far)},${yAt(far)} ${50 - halfWidthAt(far) - 5 * scaleAt(far)},${yAt(far)}`} fill="#7d8597" stroke="#000" strokeWidth={0.6} />
                <polygon points={lanePoly} fill="url(#sb-wood)" stroke="#000" strokeWidth={0.6} />
                {BOARDS.map((x, i) => <line key={i} x1={xAt(x, near)} y1={yAt(near)} x2={xAt(x, far)} y2={yAt(far)} stroke="#8a5a2b" strokeOpacity={0.25} strokeWidth={0.25} />)}
                <polygon points={lanePoly} fill="url(#sb-gloss)" />
                {/* Bumper rails pop up when the power-up is on. */}
                {armed.includes('bumpers') && [-1, 1].map((sd) => <line key={sd} x1={50 + sd * (halfWidthAt(near) + 1.5)} y1={yAt(near)} x2={50 + sd * (halfWidthAt(far) + 1.5 * scaleAt(far))} y2={yAt(far)} stroke="#fdfd94" strokeWidth={2.2} strokeLinecap="round" className={still ? '' : 'sb-pop'} />)}
                <ellipse cx={50} cy={(yAt(0.62) + yAt(0.86)) / 2} rx={halfWidthAt(0.7) * 1.2} ry={9} fill="url(#sb-spot)" />
                {/* Foul line, approach dots and aiming arrows, like a real alley. */}
                <line x1={50 - halfWidthAt(0.005)} y1={yAt(0.005)} x2={50 + halfWidthAt(0.005)} y2={yAt(0.005)} stroke="#241c3d" strokeWidth={0.5} />
                {[-0.9, -0.6, -0.3, 0, 0.3, 0.6, 0.9].map((x, i) => { const d = 0.26; const cx = xAt(x, d), cy = yAt(d), w = 1.5 * scaleAt(d); return <path key={i} d={`M${cx} ${cy - 2.4 * w} L${cx + w} ${cy} L${cx - w} ${cy} Z`} fill="#8a5a2b" opacity={0.5} />; })}
                {canAim && <polyline points={preview} fill="none" stroke={step === 'spin' ? '#ff4fa3' : '#241c3d'} strokeWidth={0.9} strokeDasharray="0.2 2.2" strokeLinecap="round" />}
                {swept && !still && (
                  <g key={swept.id}>
                    {swept.pins.map((p) => (
                      <g key={p.i} transform={`translate(${xAt(p.laneX, p.d)} ${yAt(p.d)}) scale(${scaleAt(p.d) * 2.6})`}>
                        <g className="sb-swept"><g transform="rotate(85)"><path d="M0,-11 C1.6,-11 2,-9.6 1.6,-8.2 C1.3,-7.2 1,-6.6 1.7,-5.4 C2.9,-3.6 3.2,-1.8 2.6,-0.4 C2.3,0.2 1.6,0.3 0,0.3 C-1.6,0.3 -2.3,0.2 -2.6,-0.4 C-3.2,-1.8 -2.9,-3.6 -1.7,-5.4 C-1,-6.6 -1.3,-7.2 -1.6,-8.2 C-2,-9.6 -1.6,-11 0,-11 Z" fill={pinColor} stroke="#000" strokeWidth={0.5} /></g></g>
                      </g>
                    ))}
                    {/* The sweep bar drops in front of the pins and pulls them back into the pit. */}
                    <rect className="sb-bar" x={50 - halfWidthAt(0.6) - 2} y={yAt(0.6) - 3} width={(halfWidthAt(0.6) + 2) * 2} height={3.2} rx={1} fill="#241c3d" stroke="#ff4fa3" strokeWidth={0.6} />
                  </g>
                )}
                {pinsNow.map((p) => {
                  const s = scaleAt(p.d) * 2.6;
                  const fallen = p.tilt >= 1;
                  const lean = p.tilt * 85 * p.dir;
                  const wob = sim?.wobble && sim.res.wobbled.includes(p.i);
                  const toppling = wob && sim!.res.down.includes(p.i);
                  return (
                    <g key={p.i} transform={`translate(${xAt(p.laneX, p.d)} ${yAt(p.d)}) scale(${s})`} opacity={fallen ? 0.9 : 1}>
                      <g transform={`rotate(${lean})`}><g className={wob && !still ? (toppling ? 'sb-topple' : 'sb-wobble') : ''}>
                        <ellipse cx={0} cy={0.1} rx={2.4} ry={0.7} fill="rgba(0,0,0,0.25)" />
                        {pinArt ? <image href={pinArt} x={-3.2} y={-11.2} width={6.4} height={11.6} preserveAspectRatio="xMidYMax meet" /> : <>
                        <path d="M0,-11 C1.6,-11 2,-9.6 1.6,-8.2 C1.3,-7.2 1,-6.6 1.7,-5.4 C2.9,-3.6 3.2,-1.8 2.6,-0.4 C2.3,0.2 1.6,0.3 0,0.3 C-1.6,0.3 -2.3,0.2 -2.6,-0.4 C-3.2,-1.8 -2.9,-3.6 -1.7,-5.4 C-1,-6.6 -1.3,-7.2 -1.6,-8.2 C-2,-9.6 -1.6,-11 0,-11 Z" fill={pinColor} stroke="#000" strokeWidth={0.5} />
                        <rect x={-1.25} y={-7.6} width={2.5} height={0.7} fill="#e5635f" /><rect x={-1.4} y={-6.5} width={2.8} height={0.7} fill="#e5635f" />
                        <path d="M-0.9,-10.4 C-1.2,-9.4 -1,-8.6 -0.8,-8" stroke="#fff" strokeWidth={0.45} fill="none" opacity={0.8} />
                        </>}
                      </g></g>
                    </g>
                  );
                })}
                {/* The ball: it spins as it rolls, shrinks into the distance, glows when powered up. */}
                {!ballGone && (step !== 'result' || !!sim) && (() => {
                  const sc = scaleAt(ballNow.d) * (big ? 2.1 : 1);
                  const rot = frame ? frame.t * 900 : 0;
                  return (
                    <g transform={`translate(${xAt(ballNow.laneX, ballNow.d)} ${yAt(ballNow.d) - 6 * sc}) scale(${sc})`}>
                      <ellipse cx={0} cy={6} rx={5.4} ry={1.4} fill="rgba(0,0,0,0.3)" />
                      {(armed.includes('double') || armed.includes('magnet') || big) && <circle r={8.5} fill="none" stroke={armed.includes('magnet') ? '#ef6f6c' : '#fdfd94'} strokeWidth={1.4} opacity={0.85} className={still ? '' : 'cq-glow'} />}
                      <g transform={`rotate(${rot})`}>
                        {ballArt ? <circle r={6} fill="url(#sb-ball-art)" stroke="#000" strokeWidth={0.6} /> : pieceColor(theme, 'ball', '') ? <circle r={6} fill="url(#sb-shine)" stroke="#000" strokeWidth={0.6} /> : <image href={classicBallArt(ballK)} x={-6.3} y={-6.3} width={12.6} height={12.6} />}
                        {/* Finger holes, except on a ball a theme drew itself. */}
                        {!ballArt && [[-1.6, -2.4, 0.9], [0.6, -3, 0.9], [-0.2, -0.4, 1.1]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#241c3d" opacity={0.85} />)}
                      </g>
                    </g>
                  );
                })()}
                </g>
              </svg>
              {/* What to do now, in big friendly words and a pointing hand. */}
              {canAim && (
                <motion.div key={step} className="absolute inset-x-0 top-[50%] flex justify-center pointer-events-none" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                  <span className="flex items-center gap-2 font-display text-2xl sm:text-3xl bg-surface border-[2.5px] border-border rounded-pill px-5 py-1.5" style={{ boxShadow: 'var(--shadow-sticker)' }}>
                    {step === 'aim' ? <Crosshair weight="bold" size={28} /> : <><ArrowArcLeft weight="bold" size={26} /><ArrowArcRight weight="bold" size={26} /></>}
                    {step === 'aim' ? t('sb.tapAim') : t('sb.tapSpin')}
                  </span>
                </motion.div>
              )}
              <AnimatePresence>
                {twisting && <motion.img key="tw" src="/classic/powerups/tornado.webp" alt="" className="absolute left-1/2 top-[22%] w-[34%] -translate-x-1/2 pointer-events-none" initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1, rotate: still ? 0 : [0, -15, 15, -10, 0] }} exit={{ opacity: 0, scale: 0.4 }} transition={{ duration: 0.9 }} />}
                {banner && (
                  <motion.p key={banner.id} className={`absolute inset-x-0 top-[34%] text-center font-display ${banner.kind === 'strike' ? 'text-6xl sm:text-7xl' : 'text-4xl sm:text-5xl'} text-white`} style={{ WebkitTextStroke: '2px #000', textShadow: banner.kind === 'strike' ? '0 0 18px #ff4fa3, 0 0 30px #fdfd94' : undefined }}
                    initial={{ scale: 0.4, opacity: 0, rotate: banner.kind === 'strike' ? -8 : 0 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ opacity: 0, scale: 1.2 }} transition={{ type: 'spring', stiffness: 320, damping: 14 }} role="status">
                    {banner.sign ? (
                      <span className="grid justify-items-center gap-1">
                        <span className="sr-only">{banner.text}</span>
                        <img src={`/classic/bowling/signs/${banner.sign}.webp`} alt="" aria-hidden="true" className={`w-[78%] max-w-[560px] drop-shadow-[0_0_14px_rgba(255,200,80,0.8)] ${still ? '' : 'sb-sign'}`} />
                        <span className="text-3xl sm:text-4xl" aria-hidden="true">{banner.text.replace(/^[^+]*/, '').trim()}</span>
                      </span>
                    ) : banner.text}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            {/* The meters under the lane: tap anywhere on the lane, or here. */}
            <div className="mx-auto w-full grid gap-2" style={{ width: laneW, maxWidth: '100%' }}>
              {still && canAim ? (
                <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                  <Slider label={t('sb.aim')} min={-9} max={9} value={Math.round(aim * 10)} onChange={(v) => setAim(v / 10)} show={(v) => (v === 0 ? t('sb.middle') : v < 0 ? t('sb.leftN', { n: -v }) : t('sb.rightN', { n: v }))} />
                  <Slider label={t('sb.spin')} min={-10} max={10} value={Math.round(hook * 10)} onChange={(v) => setHook(v / 10)} show={(v) => (v === 0 ? t('sb.straight') : v < 0 ? t('sb.leftN', { n: -v }) : t('sb.rightN', { n: v }))} />
                  <button type="button" onClick={() => throwBall({ aim, hook })} className="min-h-14 px-5 rounded-pill border-[2.5px] border-border bg-accent font-display text-xl">{t('sb.throw')}</button>
                </div>
              ) : (
                <button type="button" onClick={tapLane} disabled={!canAim} aria-label={step === 'spin' ? t('sb.tapSpin') : t('sb.tapAim')}
                  className="relative h-14 rounded-pill border-[2.5px] border-border bg-surface overflow-hidden disabled:opacity-60" style={{ boxShadow: 'var(--shadow-sticker)' }}>
                  <span className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 font-bold text-muted">
                    {step === 'spin' ? <><ArrowArcLeft weight="bold" size={22} /><span>{t('sb.spin')}</span><ArrowArcRight weight="bold" size={22} /></> : <><span>{t('sb.left')}</span><span>{t('sb.aim')}</span><span>{t('sb.right')}</span></>}
                  </span>
                  {canAim && <span className="absolute top-1 bottom-1 w-3 rounded-pill border-[2px] border-border" style={{ left: `calc(${((step === 'spin' ? hook : aim / 0.92) + 1) * 50}% - 6px)`, background: step === 'spin' ? '#ff4fa3' : '#fdfd94' }} />}
                </button>
              )}
            </div>
            {armed.length > 0 && (
              <div className="absolute inset-x-0 top-3 flex justify-center gap-1.5 flex-wrap pointer-events-none z-10">
                {armed.map((a, i) => <span key={i} className="rounded-pill border-[2px] border-border bg-accent px-2.5 py-0.5 text-sm font-bold">{bowlingManifest.items?.abilities.find((x) => x.id === a)?.label}</span>)}
              </div>
            )}
          </section>
          <div className="order-first lg:order-none lg:w-[260px] min-w-0 grid gap-3 content-start">
            <ScoreBoard turns={turns} playing={phase === 'play'} round={`${t('sb.frame', { n: Math.min(frames + 1, totalFrames), total: totalFrames })} · ${t('sb.roll', { n: roll + 1 })}`} />
            {/* Held power-ups, right under the scores (teacher, 2026-10-31), never over the lane. */}
            {tray}
          </div>
          </div>
        </div>
      )}
      {question && player && phase === 'play' && !solo && <ShareQuestion key={`${question.q.id}-${question.chance}`} question={question.q} player={player} cpuLevel={team.level} onResult={onShareResult} chance={{ n: question.chance, total: CHANCES }} />}
      {phase === 'end' && turns && (
        <ResultsModal winners={turns.players.length > 1 ? leaders(turns) : undefined} title={turns.players.length > 1 ? (leaders(turns).length > 1 ? t('share.tie') : t('share.winner', { name: leaders(turns)[0].name })) : t('pb.done', { count: turns.players[0].score })} missed={solo ? soloMissed : missed} againLabel={t('share.again')} onAgain={() => setPhase('welcome')} />
      )}
      {powers.element}
      {element}
    </main>
    </TeamArt.Provider>
    </ThemedPage>
  );
}

// A split: standing pins with an empty gap between them on the same rows.
function isSplit(standing: boolean[]): boolean {
  if (standing[0]) return false;
  const xs = PIN_SPOTS.map(([x], i) => (standing[i] ? x : null)).filter((x): x is number => x !== null).sort((a, b) => a - b);
  for (let k = 1; k < xs.length; k++) if (xs[k] - xs[k - 1] > 0.9) return true;
  return false;
}
