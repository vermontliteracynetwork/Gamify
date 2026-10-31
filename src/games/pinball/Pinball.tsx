import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { CheckCircle, Crosshair, RocketLaunch, Star, Trophy } from '@phosphor-icons/react';
import { data, newId } from '../../data';
import { LIBRARY } from '../../data/library';
import { useMySets } from '../../data/hooks';
import type { MultipleChoiceQuestion } from '../../data/types';
import { buzz, playEffect } from '../../engine/feedback';
import { makeDeck } from '../../engine/picker';
import ResultsModal from '../../engine/ResultsModal';
import ShareQuestion from '../../engine/ShareQuestion';
import ScoreBoard from '../../engine/ScoreBoard';
import TeamSetup from '../../engine/TeamSetup';
import { addPoints, CHANCES, current, leaders, nextTurn, startTurns, type CpuLevel, type TurnPlayer, type TurnState } from '../../engine/turns';
import { usePlayClock } from '../../engine/playClock';
import { useAsk } from '../../engine/useAsk';
import { usePowerUps } from '../../engine/usePowerUps';
import { PowerUpTray, useHeldPowerUps } from '../../engine/HeldPowerUps';
import { t } from '../../i18n';
import { AccessButton, FullScreenButton, GameTopRow, GearButton, SettingsPanel } from '../../settings/SettingsPanel';
import { useSettings } from '../../settings/SettingsContext';
import { useGamePool } from '../../student/session';
import { pieceColor, pieceFill, pieceImage } from '../../theme/library';
import { ThemedPage, useGameTheme } from '../../theme/useGameTheme';
import { Slider, Toggle } from '../../ui/fields';
import { buttonClasses } from '../../ui/kit';
import Title from '../../ui/Title';
import { useSignedIn } from '../../auth/session';
import GameWelcome from '../GameWelcome';
import SetPicker from '../SetPicker';
import SetupWizard from '../SetupWizard';
import ThemeScreen from '../ThemeScreen';
import WayToPlay from '../WayToPlay';
import { useSavedSetup } from '../useSavedSetup';
import { pinballManifest } from './manifest';
import { H, LANE_H, LANE_Y, landing, LAUNCH, pathLength, pickValues, pocketCenter, pocketCount, POCKET_H, POCKET_TOP, pointAt, TOP_Y, W, WALL, ZONE_X, ZONES, type Pt } from './table';

type Phase = 'welcome' | 'theme' | 'setup' | 'play' | 'end';
type Step = 'question' | 'aim' | 'power' | 'shot' | 'result';
type Boost = 'double' | 'super' | 'magnet' | 'bounce';
// The lane band's colors, like a painted alley (teacher reference, 2026-10-31).
const LANE_COLORS = ['#f6c544', '#9b7be0', '#ef5d7a', '#4fb6d8', '#f39ac0'];
const POCKET_COLORS = ['#ff9b54', '#fbc94a', '#f2735f', '#8fe3a0', '#8ec5ff', '#c9a3f5'];
const BUMPERS: Pt[] = [{ x: 24, y: 44 }, { x: 50, y: 56 }, { x: 76, y: 44 }];
const LIGHTS = Array.from({ length: 11 }, (_, i) => WALL + 4 + i * ((W - 2 * WALL - 8) / 10));
const ease = (f: number) => 1 - (1 - f) ** 2.2;
const unease = (e: number) => 1 - (1 - e) ** (1 / 2.2);

// Pinball (teacher design, 2026-10-31; replaces Peg Drop). A right answer
// earns a shot. Pick a lane (the numbered band across the middle, which
// then fades away and never touches the ball), stop the power bar, and the
// ball flies up from the bottom center, bouncing off the walls, into one of
// the scoring pockets in a line across the top. Too little power and it
// rolls back down. Three pockets in round 1 and one more each round (up to
// ten), worth 10 to 100 in no set order; big values grow common later.
// Power-ups wait for the player's next turn under the scoreboard.
export default function Pinball() {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const { theme, themes, playable, choose } = useGameTheme('pinball');
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const [setup, change] = useSavedSetup('pinball', { setId: LIBRARY[0].id, rounds: 5, who: 'teams' as 'teams' | 'solo' | 'versus', powerUps: true });
  const setId = sets.some((s) => s.id === setup.setId) ? setup.setId : LIBRARY[0].id;
  const picked = useMemo(() => sets.filter((s) => s.id === setId).map((set) => ({ set, starred: false })), [sets, setId]);
  const game = useGamePool(picked);
  // Students who join with a code play on their own device; teachers pick the way.
  const { teacher } = useSignedIn();
  const solo = setup.who === 'solo' || !teacher;
  const { ask, cancel, asking, element, missed: soloMissed } = useAsk({ gameId: 'pinball', mode: 'solo', pool: game.pool, classroomId: game.classroomId, studentId: game.studentId });
  const deck = useMemo(() => makeDeck(game.pool), [game.pool]);
  const [team, setTeam] = useState<{ players: TurnPlayer[]; level: CpuLevel }>({ players: [], level: 'medium' });
  const [phase, setPhase] = useState<Phase>('welcome');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [turns, setTurns] = useState<TurnState | null>(null);
  const turnsNow = useRef<TurnState | null>(null);
  turnsNow.current = turns;
  const clock = usePlayClock({ playing: phase === 'play' && solo, score: turns?.players[0]?.score ?? 0, onTimeUp: () => { if (asking) cancel(); else if (turnsNow.current) end(turnsNow.current); } });
  const [step, setStep] = useState<Step>('question');
  const [question, setQuestion] = useState<{ q: MultipleChoiceQuestion; setId?: string; chance: number } | null>(null);
  const [missed, setMissed] = useState<MultipleChoiceQuestion[]>([]);
  const [shots, setShots] = useState(0);
  const [zone, setZone] = useState<number | null>(null);
  const [power, setPower] = useState(0);
  const [values, setValues] = useState<number[]>([]);
  const [hit, setHit] = useState<{ id: number; pocket: number | null; points: number; jackpot: boolean } | null>(null);
  const [sparks, setSparks] = useState<{ id: number; pts: { x: number; y: number; delay: number }[] } | null>(null);
  const [banner, setBanner] = useState<{ id: number; text: string } | null>(null);
  const [flip, setFlip] = useState(0);
  const [armed, setArmed] = useState<Boost[]>([]);
  const timers = useRef<number[]>([]);
  const raf = useRef(0);
  const powerAt = useRef(0);
  const ballRef = useRef<SVGGElement>(null);
  const trailRefs = useRef<(SVGCircleElement | null)[]>([]);
  const bumperRefs = useRef<(SVGCircleElement | null)[]>([]);

  // Power-ups: a right answer may bring one; it waits for this player's next
  // turn, under the scoreboard, and is gone after that turn (teacher, 2026-10-31).
  const powers = usePowerUps(pinballManifest, theme, setup.powerUps);
  const held = useHeldPowerUps();
  const boost = useRef<Set<Boost>>(new Set());
  const player = turns ? current(turns) : null;
  const players = turns?.players.length ?? 1;
  const total = players * setup.rounds;
  const round = Math.min(setup.rounds, Math.floor(shots / players) + 1);
  const human = player?.kind !== 'cpu';
  const best = values.length ? Math.max(...values) : 0;

  useEffect(() => () => { timers.current.forEach((id) => window.clearTimeout(id)); cancelAnimationFrame(raf.current); }, []);

  function newTable(r: number) {
    const progress = setup.rounds > 1 ? (r - 1) / (setup.rounds - 1) : 0;
    const vs = pickValues(pocketCount(r), progress);
    setValues(vs);
    setBanner({ id: Date.now(), text: t('pb.newRound', { n: r, count: vs.length }) });
  }
  function begin() {
    const ps = solo ? [{ id: 'solo', name: t('mm.you'), kind: 'student' as const, colorIndex: 0, score: 0 }] : team.players;
    const state = startTurns(ps);
    setTurns(state); setShots(0); setMissed([]); setHit(null);
    held.reset();
    newTable(1);
    setPhase('play');
    startTurn(state);
  }
  function restBall() {
    ballRef.current?.setAttribute('transform', `translate(${LAUNCH.x} ${LAUNCH.y})`); ballRef.current?.setAttribute('opacity', '1');
    trailRefs.current.forEach((c) => c?.setAttribute('opacity', '0'));
  }
  function startTurn(state: TurnState) {
    setStep('question'); setHit(null); setPower(0); setZone(null); setArmed([]); restBall();
    boost.current = new Set();
    held.beginTurn(current(state).id);
    if (solo) {
      void ask().then((ok) => { if (!ok) { end(state); return; } earned(state); setStep('aim'); });
    } else {
      const d = deck.next();
      setQuestion({ q: d.question, setId: d.setId, chance: 1 });
    }
  }
  function earned(state: TurnState) {
    const it = powers.grant(true);
    if (it) held.earn(current(state).id, it);
  }
  function onShareResult(right: boolean) {
    if (!turns || !question || !player) return;
    if (player.kind !== 'cpu' && player.kind !== 'teacher') {
      void data.logQuestion({ id: newId('log'), at: new Date().toISOString(), teamName: player.name, gameId: 'pinball', mode: 'share', setId: question.setId, prompt: question.q.prompt, answer: question.q.choices[question.q.correctIndex], tries: [], ms: 0, outcome: right ? 'right' : 'skipped' });
      if (!right) setMissed((m) => (m.some((x) => x.id === question.q.id) ? m : [...m, question.q]));
    }
    // Three tries, a new question each time (teacher, 2026-10-31, as in Game Show).
    if (!right && question.chance < CHANCES) { const d = deck.next(); setQuestion({ q: d.question, setId: d.setId, chance: question.chance + 1 }); return; }
    setQuestion(null);
    if (right) { earned(turns); setStep('aim'); } else afterTurn(turns);
  }

  // Use a held power-up: its Classic role happens now or on this shot.
  function applyItem(i: number) {
    const state = turnsNow.current;
    const it = held.use(i);
    if (!it || !state) return;
    playEffect('win', settings);
    const me = current(state).id;
    const ab = it.ability;
    if (ab === 'double' || ab === 'super' || ab === 'magnet' || ab === 'bounce') { boost.current.add(ab); setArmed((a) => [...a, ab]); return; }
    let next = state;
    if (ab === 'mystery') next = addPoints(state, me, 10 * (1 + Math.floor(Math.random() * 10)));
    if (ab === 'bonus') next = addPoints(state, me, powers.amount(it));
    if (ab === 'swipe') {
      const n = powers.amount(it);
      const rivals = state.players.filter((p) => p.id !== me);
      const top = rivals.sort((a, b) => b.score - a.score)[0];
      next = top ? addPoints(addPoints(state, top.id, -Math.min(n, top.score)), me, Math.min(n, top.score)) : addPoints(state, me, n);
    }
    setTurns(next);
  }

  // Pick a lane: the band fades away and the power bar starts swinging (like
  // the casting meter in Cast and Catch). Tap Shoot to stop it.
  function pickLane(z: number) {
    if (step !== 'aim') return;
    setZone(z);
    setStep('power');
    playEffect('tap', settings);
    const t0 = performance.now();
    const period = still ? 2600 : 1600;
    const tick = (ts: number) => {
      const x = ((ts - t0) % period) / period;
      const p = x < 0.5 ? x * 2 : 2 - x * 2;
      powerAt.current = p; setPower(p);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }
  function shoot() {
    if (step !== 'power' || zone === null || !turns) return;
    cancelAnimationFrame(raf.current);
    const b = boost.current;
    const land = landing(zone, powerAt.current, values.length, b.has('super') || b.has('magnet'));
    let path = land.path;
    let pocket = land.pocket;
    // Jackpot magnet: once the ball reaches the top it rolls to the biggest pocket.
    if (b.has('magnet') && pocket !== null) {
      pocket = values.indexOf(best);
      path = [...path.slice(0, -1), { x: pocketCenter(pocket, values.length), y: TOP_Y - 1 }, { x: pocketCenter(pocket, values.length), y: POCKET_TOP + POCKET_H * 0.45 }];
    }
    const bounces = path.filter((p) => p.x <= WALL + 0.01 || p.x >= W - WALL - 0.01).length;
    setStep('shot'); setFlip((f) => f + 1);
    playEffect('whoosh', settings);
    const L = pathLength(path);
    const ms = still ? 250 : Math.min(2600, 600 + L * 8);
    // Sparks where the ball bounces off a wall.
    let run = 0;
    const marks = path.slice(1, -1).map((p, i) => { run += Math.hypot(p.x - path[i].x, p.y - path[i].y); return { x: p.x, y: p.y, delay: (unease(run / L) * ms) / 1000 }; });
    setSparks({ id: Date.now(), pts: still ? [] : marks });
    const t0 = performance.now();
    const trail: Pt[] = [];
    const tick = (ts: number) => {
      const f = Math.min(1, (ts - t0) / ms);
      const p = still ? path[path.length - 1] : pointAt(path, ease(f));
      ballRef.current?.setAttribute('transform', `translate(${p.x} ${p.y})`);
      // A short glowing trail, and bumpers light as the ball goes by.
      trail.unshift(p); trail.length = Math.min(trail.length, 9);
      trailRefs.current.forEach((c, k) => { const q = trail[(k + 1) * 2]; if (c && q && !still) { c.setAttribute('cx', String(q.x)); c.setAttribute('cy', String(q.y)); c.setAttribute('opacity', String(0.45 - k * 0.12)); } });
      bumperRefs.current.forEach((c, k) => c?.setAttribute('fill', Math.hypot(BUMPERS[k].x - p.x, BUMPERS[k].y - p.y) < 13 ? '#fdfd94' : pieceColor(theme, 'bumper', '#f2735f')));
      if (f < 1) raf.current = requestAnimationFrame(tick); else settle(pocket, bounces);
    };
    raf.current = requestAnimationFrame(tick);
  }
  function settle(pocket: number | null, bounces: number) {
    const state = turnsNow.current;
    if (!state) return;
    trailRefs.current.forEach((c) => c?.setAttribute('opacity', '0'));
    let next = state;
    const b = boost.current;
    if (pocket !== null) {
      const points = values[pocket] * (b.has('double') ? 2 : 1) + (b.has('bounce') ? bounces * 10 : 0);
      const jackpot = values[pocket] === best;
      next = addPoints(state, current(state).id, points);
      setTurns(next);
      setHit({ id: Date.now(), pocket, points, jackpot });
      playEffect(jackpot ? 'win' : 'right', settings);
      buzz(30, settings);
      if (jackpot && settings.celebrations !== 'off' && !still) void confetti({ particleCount: 60, spread: 70, origin: { y: 0.25 }, disableForReducedMotion: true });
      ballRef.current?.setAttribute('opacity', '0');
    } else {
      setHit({ id: Date.now(), pocket: null, points: 0, jackpot: false });
      playEffect('miss', settings);
    }
    setStep('result');
    timers.current.push(window.setTimeout(() => afterTurn(next), still ? 1000 : 1800));
  }
  function afterTurn(state: TurnState) {
    held.endTurn(); // unused power-ups are gone after the turn
    const n = shots + 1;
    setShots(n);
    if (n >= total) { end(state); return; }
    const next = nextTurn(state);
    setTurns(next);
    // Everyone has had a turn: a new round, one more pocket, new values.
    if (n % players === 0) newTable(Math.floor(n / players) + 1);
    startTurn(next);
  }
  function end(state: TurnState) {
    cancelAnimationFrame(raf.current);
    held.endTurn();
    setTurns(state); setPhase('end');
    playEffect('win', settings);
    if (settings.celebrations !== 'off' && !still) void confetti({ particleCount: 90, spread: 90, origin: { y: 0.5 }, disableForReducedMotion: true });
  }
  // The computer uses what it holds, picks a lane, lets the bar run and shoots.
  useEffect(() => {
    if (phase !== 'play' || player?.kind !== 'cpu') return;
    if (step === 'aim') {
      const id = window.setTimeout(() => { for (let k = held.held.length - 1; k >= 0; k--) applyItem(k); pickLane(Math.floor(Math.random() * ZONES)); }, 900);
      return () => window.clearTimeout(id);
    }
    if (step === 'power') {
      const id = window.setTimeout(() => shoot(), 500 + Math.random() * 900);
      return () => window.clearTimeout(id);
    }
  }); // eslint-disable-line react-hooks/exhaustive-deps
  // Keyboard: 1 to 5 pick a lane, Space or Enter shoots.
  useEffect(() => {
    if (phase !== 'play' || !human) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.('input, textarea, [role="dialog"], dialog')) return;
      const n = Number(e.key);
      if (step === 'aim' && n >= 1 && n <= ZONES) { e.preventDefault(); pickLane(n - 1); }
      if (step === 'power' && (e.key === ' ' || e.key === 'Enter') && (e.target as HTMLElement)?.tagName !== 'BUTTON') { e.preventDefault(); shoot(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const canAim = phase === 'play' && step === 'aim' && human;
  const ballArt = pieceImage(theme, 'ball');
  const bumperColor = pieceColor(theme, 'bumper', '#f2735f');
  const flipperColor = pieceColor(theme, 'flipper', '#fdfd94');
  const aiming = phase === 'play' && step === 'power' && zone !== null;
  const dir = zone === null ? { x: 0, y: -1 } : { x: ZONE_X[zone] - LAUNCH.x, y: LANE_Y - LAUNCH.y };
  const dlen = Math.hypot(dir.x, dir.y);
  const tip = { x: LAUNCH.x + (dir.x / dlen) * 26, y: LAUNCH.y + (dir.y / dlen) * 26 };
  const ang = (Math.atan2(dir.y, dir.x) * 180) / Math.PI;
  const pw = 100 / Math.max(1, values.length);
  const boardW = `calc((var(--play-h) - 6.25rem - var(--pb-extra)) * ${W / H})`;
  const tray = <PowerUpTray manifest={pinballManifest} items={held.held} onUse={applyItem} disabled={!(step === 'aim' || step === 'power') || !human} />;

  return (
    <ThemedPage theme={theme} menu={phase !== 'play' && phase !== 'end'}>
    <main className={phase === 'play' || phase === 'end' ? '!p-0' : 'max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-6'}>
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context="pinball" />
      {clock.element}
      {phase !== 'play' && phase !== 'end' && <GameTopRow onSettings={() => setSettingsOpen(true)} />}
      {phase === 'welcome' && (
        <GameWelcome game={pinballManifest} cover={pieceImage(theme, 'cover')} onStart={() => setPhase(themes.length > 1 ? 'theme' : 'setup')} steps={[
          { icon: <CheckCircle weight="fill" size={22} />, text: t('pb.how1') },
          { icon: <Crosshair weight="bold" size={22} />, text: t('pb.how2') },
          { icon: <Trophy weight="fill" size={22} />, text: t('pb.how3') },
        ]} />
      )}
      {phase === 'theme' && <ThemeScreen gameName={pinballManifest.name} current={theme} themes={themes} playable={playable} onChoose={choose} onBack={() => setPhase('welcome')} onNext={() => setPhase('setup')} />}
      {phase === 'setup' && (
        <SetupWizard onBack={() => setPhase(themes.length > 1 ? 'theme' : 'welcome')} onPlay={begin} pages={[
          ...(!teacher ? [] : [{ id: 'way', title: t('way.title'), content: <WayToPlay modes={['share', 'versus', 'solo']} value={solo ? 'solo' : setup.who === 'versus' ? 'versus' : 'share'} onChange={(m) => change({ who: m === 'solo' ? 'solo' : m === 'versus' ? 'versus' : 'teams' })} /> }]),
          ...(game.assigned ? [] : [{ id: 'questions', title: t('setup.questions'), content: <SetPicker sets={sets} value={[setId]} onChange={(ids) => change({ setId: ids[0] })} /> }]),
          { id: 'options', title: t('setup.options'), content: (
            <>
              <Slider label={t('pb.rounds')} hint={solo ? t('pb.roundsHintSolo') : t('pb.roundsHint')} min={1} max={10} value={setup.rounds} onChange={(v) => change({ rounds: v })} />
              <Toggle label={t('pu.toggle')} hint={t('pu.toggleHint')} value={setup.powerUps} onChange={(v) => change({ powerUps: v })} />
            </>
          ) },
          ...(solo ? [] : [setup.who === 'versus'
            // Every Share game can also be played Versus: two players head to head, or one against the computer (teacher, 2026-10-31).
            ? { id: 'players', title: t('setup.players'), ready: team.players.length === 2, content: <TeamSetup key="versus" mode="versus" min={2} max={2} embedded onChange={(ps, level) => setTeam({ players: ps, level })} /> }
            : { id: 'teams', title: t('setup.teams'), ready: team.players.length > 0, content: <TeamSetup key="share" mode="share" min={1} max={10} embedded onChange={(ps, level) => setTeam({ players: ps, level })} /> }]),
        ]} />
      )}
      {(phase === 'play' || phase === 'end') && turns && (
        // The table fills the play space, the same in full screen; small
        // controls sit on top and the scores sit right beside it, top aligned.
        <div className="relative play-fill grid grid-cols-[minmax(0,1fr)] content-center gap-3 px-3 py-3 lg:flex lg:justify-center lg:items-center">
          <h1 className="sr-only"><Title text={pinballManifest.name} /></h1>
          <div className="absolute top-3 right-3 flex items-center gap-2 z-10 [&_button]:!w-11 [&_button]:!h-11">
            <FullScreenButton small />
            <AccessButton small />
            <GearButton small onClick={() => setSettingsOpen(true)} />
          </div>
          <div className="contents lg:flex lg:items-start lg:gap-4">
            <section className="relative grid gap-2 min-w-0 [--pb-extra:4.5rem] lg:[--pb-extra:0rem]">
              <div className="relative mx-auto rounded-[28px] border-[3px] border-border overflow-hidden select-none touch-none"
                style={{ ...pieceFill(theme, 'board', '#314677'), aspectRatio: `${W} / ${H}`, width: boardW, maxWidth: '100%', boxShadow: 'var(--shadow-sticker-lg)' }}>
                <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" role="img" aria-label={t('pb.board', { n: values.length })}>
                  <defs>
                    <radialGradient id="pb-ball" cx="35%" cy="30%" r="70%"><stop offset="0%" stopColor="#ffffff" /><stop offset="55%" stopColor={pieceColor(theme, 'ball', '#e7ecf5')} /><stop offset="100%" stopColor="#8a93a8" /></radialGradient>
                    {ballArt && <pattern id="pb-ball-art" patternContentUnits="objectBoundingBox" width="1" height="1"><image href={ballArt} width="1" height="1" preserveAspectRatio="xMidYMid slice" /></pattern>}
                  </defs>
                  <rect x={3} y={3} width={W - 6} height={H - 6} rx={9} fill="none" stroke="#fff" strokeOpacity={0.3} strokeWidth={0.7} />
                  {/* A row of lights under the pockets chases while the ball flies. */}
                  {LIGHTS.map((x, i) => (
                    <circle key={`l-${i}-${flip}`} cx={x} cy={TOP_Y + 3.2} r={1.1} fill="#fdfd94" stroke="#000" strokeWidth={0.3} opacity={0.55} className={flip && !still ? 'pb-chase' : ''} style={{ animationDelay: `${i * 0.06}s` }} />
                  ))}
                  {/* Bumpers light up as the ball goes by. */}
                  {BUMPERS.map((b, i) => (
                    <g key={`b-${i}`}>
                      <circle cx={b.x} cy={b.y} r={6.4} fill="#000" opacity={0.18} />
                      <circle ref={(el) => { bumperRefs.current[i] = el; }} cx={b.x} cy={b.y} r={5.2} fill={bumperColor} stroke="#000" strokeWidth={0.6} />
                      <circle cx={b.x} cy={b.y} r={2.4} fill="#fff" opacity={0.85} />
                      <Star x={b.x - 1.5} y={b.y - 1.5} size={3} weight="fill" color="#241c3d" />
                    </g>
                  ))}
                  {aiming && (
                    <g>
                      <line x1={LAUNCH.x} y1={LAUNCH.y} x2={tip.x} y2={tip.y} stroke="#fff" strokeWidth={0.9} strokeLinecap="round" strokeDasharray="0.1 2.2" />
                      <path d="M0 -2.6 L4.6 0 L0 2.6 Z" fill="#fff" stroke="#000" strokeWidth={0.4} transform={`translate(${tip.x} ${tip.y}) rotate(${ang})`} />
                    </g>
                  )}
                  <g key={`f-${flip}`}>
                    <path d="M0 -1.6 L15 -0.6 L15 0.6 L0 1.6 Z" fill={flipperColor} stroke="#000" strokeWidth={0.5} strokeLinejoin="round" transform="translate(26 118) rotate(18)" className={flip && !still ? 'pb-flip-l' : ''} style={{ transformOrigin: '0 0', transformBox: 'view-box' as const }} />
                    <path d="M0 -1.6 L-15 -0.6 L-15 0.6 L0 1.6 Z" fill={flipperColor} stroke="#000" strokeWidth={0.5} strokeLinejoin="round" transform="translate(74 118) rotate(-18)" className={flip && !still ? 'pb-flip-r' : ''} style={{ transformOrigin: '0 0', transformBox: 'view-box' as const }} />
                  </g>
                  <rect x={LAUNCH.x - 3} y={LAUNCH.y + 3.6} width={6} height={6} rx={1} fill="#9aa3b5" stroke="#000" strokeWidth={0.5} />
                  {sparks && sparks.pts.map((s, i) => (
                    <circle key={`${sparks.id}-${i}`} cx={s.x} cy={s.y} r={2.5} fill="none" stroke="#fdfd94" strokeWidth={0.8} className="pb-spark" style={{ animationDelay: `${s.delay}s`, transformOrigin: `${s.x}px ${s.y}px`, transformBox: 'view-box' as const }} />
                  ))}
                  {[0, 1, 2, 3].map((k) => <circle key={k} ref={(el) => { trailRefs.current[k] = el; }} r={3.1 - k * 0.45} fill="#fdfd94" opacity={0} />)}
                  <g ref={ballRef} transform={`translate(${LAUNCH.x} ${LAUNCH.y})`}>
                    {armed.length > 0 && !still && <circle r={4.8} fill="none" stroke="#fdfd94" strokeWidth={0.9} className="pb-aura" />}
                    <circle r={3.1} fill={ballArt ? 'url(#pb-ball-art)' : 'url(#pb-ball)'} stroke="#000" strokeWidth={0.5} />
                  </g>
                </svg>
                {/* Scoring pockets in a line across the top (teacher, 2026-10-31),
                    worth 10 to 100 in no set order; the biggest sparkles. */}
                <div className="absolute flex" style={{ left: `${(WALL / W) * 100}%`, right: `${(WALL / W) * 100}%`, top: `${(POCKET_TOP / H) * 100}%`, height: `${(POCKET_H / H) * 100}%` }}>
                  {values.map((v, i) => {
                    const on = hit?.pocket === i;
                    return (
                      <motion.div key={`${round}-${i}`} initial={still ? false : { y: -30, opacity: 0 }} animate={on && !still ? { y: 0, opacity: 1, scale: [1, 1.12, 1] } : { y: 0, opacity: 1 }} transition={{ delay: still ? 0 : i * 0.05 }}
                        aria-label={t('pb.pocket', { value: v })}
                        className={`relative flex-1 min-w-0 border-[2px] border-border flex items-end justify-center pb-[6%] font-display ${values.length > 7 ? 'text-base sm:text-lg' : 'text-xl sm:text-3xl'} ${on ? 'ring-4 ring-white z-10' : ''}`}
                        style={{ ...(pieceImage(theme, 'pocket') ? pieceFill(theme, 'pocket', POCKET_COLORS[i % POCKET_COLORS.length]) : { background: on ? '#fdfd94' : POCKET_COLORS[i % POCKET_COLORS.length] }), width: `${pw}%`, color: '#fff', WebkitTextStroke: '1.5px #000', paintOrder: 'stroke' }}>
                        {v === best && <Star weight="fill" size={18} color="#fff" className={`absolute top-1 left-1/2 -translate-x-1/2 drop-shadow-[0_0_1px_#000] ${still ? '' : 'pb-twinkle'}`} aria-hidden="true" />}
                        {v}
                      </motion.div>
                    );
                  })}
                </div>
                {/* Lanes 1 to 5 (like the reference alley): pick one, then it
                    fades away; the ball never touches it. */}
                <AnimatePresence>
                  {phase === 'play' && step === 'aim' && (
                    <motion.div key="lanes" className="absolute flex" style={{ left: `${(WALL / W) * 100}%`, right: `${(WALL / W) * 100}%`, top: `${((LANE_Y - LANE_H / 2) / H) * 100}%`, height: `${(LANE_H / H) * 100}%` }}
                      initial={still ? false : { opacity: 0, scaleY: 0.4 }} animate={{ opacity: 1, scaleY: 1 }} exit={still ? { opacity: 0 } : { opacity: 0, scaleY: 0.2 }} transition={{ duration: 0.25 }}>
                      {ZONE_X.map((_, i) => (
                        <button key={i} type="button" onClick={() => canAim && pickLane(i)} disabled={!canAim} aria-label={t('pb.zone', { n: i + 1 })}
                          className={`flex-1 border-y-[2.5px] border-border first:border-l-[2.5px] last:border-r-[2.5px] first:rounded-l-input last:rounded-r-input font-display text-3xl sm:text-5xl text-white flex items-center justify-center disabled:cursor-default ${canAim && !still ? 'hover:brightness-110 active:scale-95' : ''}`}
                          style={{ background: LANE_COLORS[i], WebkitTextStroke: '2px #000', paintOrder: 'stroke' }}>{i + 1}</button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* What this shot carries, from the power-ups used. */}
                {armed.length > 0 && (
                  <div className="absolute inset-x-0 flex justify-center gap-1.5 flex-wrap pointer-events-none" style={{ top: `${((LANE_Y + 10) / H) * 100}%` }}>
                    {armed.map((a, i) => <span key={i} className="rounded-pill border-[2px] border-border bg-accent px-2.5 py-0.5 text-sm font-bold">{pinballManifest.items?.abilities.find((x) => x.id === a)?.label}</span>)}
                  </div>
                )}
                <AnimatePresence>
                  {hit && hit.pocket !== null && (
                    <motion.span key={hit.id} className="absolute font-display text-4xl sm:text-5xl text-white -translate-x-1/2 pointer-events-none whitespace-nowrap" style={{ left: `${((WALL + (W - 2 * WALL) * ((hit.pocket + 0.5) / values.length)) / W) * 100}%`, WebkitTextStroke: '2px #000' }}
                      initial={{ top: '18%', opacity: 1, scale: 0.6 }} animate={{ top: '26%', opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: still ? 0.01 : 0.6 }}>+{hit.points}</motion.span>
                  )}
                  {hit && hit.jackpot && (
                    <motion.p key={`j-${hit.id}`} className="absolute inset-x-0 top-[34%] text-center font-display text-5xl text-[#fdfd94] pointer-events-none" style={{ WebkitTextStroke: '2px #000' }}
                      initial={{ scale: 0.4, opacity: 0, rotate: -8 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 14 }} role="status">{t('pb.jackpot')}</motion.p>
                  )}
                  {hit && hit.pocket === null && (
                    <motion.p key={hit.id} className="absolute inset-x-0 top-[42%] text-center font-display text-4xl text-white pointer-events-none" style={{ WebkitTextStroke: '2px #000' }}
                      initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} role="status">{t('pb.close')}</motion.p>
                  )}
                  {banner && (
                    <motion.p key={banner.id} className="absolute inset-x-0 top-[24%] mx-auto w-max max-w-[90%] text-center font-display text-xl sm:text-2xl bg-surface border-[2.5px] border-border rounded-pill px-4 py-1 pointer-events-none" style={{ boxShadow: 'var(--shadow-sticker)' }}
                      initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: still ? 0.01 : 0.35 }}
                      onAnimationComplete={() => { const id = banner.id; timers.current.push(window.setTimeout(() => setBanner((b) => (b?.id === id ? null : b)), 1600)); }}
                      role="status">{banner.text}</motion.p>
                  )}
                </AnimatePresence>
              </div>
              {/* Under the table: what to do now, then the power bar and Shoot. */}
              <div className="flex items-center justify-center gap-3 mx-auto w-full min-h-14" style={{ maxWidth: boardW }}>
                {step === 'power' && human ? (
                  <>
                    <div className="relative flex-1 h-7 rounded-pill border-[2.5px] border-border overflow-hidden" style={{ background: 'linear-gradient(90deg, #9fe7a0 0%, #fdfd94 55%, #ed9d75 100%)' }} role="meter" aria-label={t('pb.meter')} aria-valuenow={Math.round(power * 100)} aria-valuemin={0} aria-valuemax={100}>
                      <span className="absolute inset-y-0 left-0 bg-black/15" style={{ width: `${power * 100}%` }} />
                      <span className="absolute top-0 bottom-0 w-1.5 bg-black" style={{ left: `calc(${power * 100}% - 3px)` }} />
                    </div>
                    <button type="button" className={buttonClasses('primary', 'h-14 !px-6 !text-lg')} onClick={shoot}><RocketLaunch weight="fill" size={24} />{t('pb.shoot')}</button>
                  </>
                ) : canAim ? (
                  <p className="font-display text-xl bg-surface border-[2.5px] border-border rounded-pill px-5 py-2" style={{ boxShadow: 'var(--shadow-sticker)' }}>{t('pb.pickLane')}</p>
                ) : null}
              </div>
              {/* Small screens: held power-ups float over the table's lower left. */}
              <div className="lg:hidden absolute left-2 w-[min(15rem,45%)] z-10" style={{ bottom: '5.5rem' }}>{tray}</div>
            </section>
            <div className="order-first lg:order-none lg:w-[260px] min-w-0 grid gap-3">
              <ScoreBoard turns={turns} playing={phase === 'play'} round={t('pb.roundOf', { n: round, total: setup.rounds })} />
              {/* Held power-ups, right under the scores (teacher, 2026-10-31). */}
              <div className="hidden lg:block">{tray}</div>
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
    </ThemedPage>
  );
}
