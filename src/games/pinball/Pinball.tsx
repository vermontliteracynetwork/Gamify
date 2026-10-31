import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowArcLeft, ArrowArcRight, CheckCircle, Crosshair, RocketLaunch, Trophy } from '@phosphor-icons/react';
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
import { H, landing, LAUNCH, pathLength, pickValues, placePockets, pocketCount, pointAt, POCKET_R, shotPath, W, ZONE_X, ZONE_Y, ZONES, type Pocket, type Pt } from './table';

type Phase = 'welcome' | 'theme' | 'setup' | 'play' | 'end';
type Step = 'question' | 'aim' | 'power' | 'shot' | 'result';
const ZONE_COLORS = ['#c9a3f5', '#8ec5ff', '#8fe3a0', '#fdfd94', '#f6a5c0'];
const BUMPERS: Pt[] = [{ x: 13, y: 92 }, { x: 87, y: 92 }, { x: 50, y: 92 }];
const ease = (f: number) => 1 - (1 - f) ** 2.2;
const unease = (e: number) => 1 - (1 - e) ** (1 / 2.2);

// Pinball (teacher design, 2026-10-31; replaces Peg Drop): a right answer
// earns a shot. The ball waits at the bottom center; aim it through one of
// five labeled zones, stop the power bar, and it flies up the table,
// bouncing off the walls, into a pocket of points. Three pockets in round 1,
// one more each round (up to ten), placed and valued at random each round,
// with big values growing more common as the game goes on.
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
  const [zone, setZone] = useState(2);
  const [power, setPower] = useState(0);
  const [pockets, setPockets] = useState<Pocket[]>([]);
  const [hit, setHit] = useState<{ id: number; pocket: number | null; points: number } | null>(null);
  const [sparks, setSparks] = useState<{ id: number; pts: { x: number; y: number; delay: number }[] } | null>(null);
  const [banner, setBanner] = useState<{ id: number; text: string } | null>(null);
  const [flip, setFlip] = useState(0);
  const timers = useRef<number[]>([]);
  const raf = useRef(0);
  const powerAt = useRef(0);
  const ballRef = useRef<SVGGElement>(null);

  // Power-ups a right answer brought.
  const powers = usePowerUps(pinballManifest, theme, setup.powerUps);
  const boost = useRef({ super: false, double: false });
  function earned(state: TurnState): TurnState {
    const it = powers.grant();
    if (!it) return state;
    if (it.ability === 'super') boost.current.super = true;
    if (it.ability === 'double') boost.current.double = true;
    if (it.ability === 'bonus') { const next = addPoints(state, current(state).id, powers.amount(it)); setTurns(next); return next; }
    return state;
  }
  const player = turns ? current(turns) : null;
  const players = turns?.players.length ?? 1;
  const total = players * setup.rounds;
  const round = Math.min(setup.rounds, Math.floor(shots / players) + 1);
  const human = player?.kind !== 'cpu';

  useEffect(() => () => { timers.current.forEach((id) => window.clearTimeout(id)); cancelAnimationFrame(raf.current); }, []);

  function newTable(r: number) {
    const progress = setup.rounds > 1 ? (r - 1) / (setup.rounds - 1) : 0;
    const ps = placePockets(pickValues(pocketCount(r), progress));
    setPockets(ps);
    setBanner({ id: Date.now(), text: t('pb.newRound', { n: r, count: ps.length }) });
  }
  function begin() {
    const ps = solo ? [{ id: 'solo', name: t('mm.you'), kind: 'student' as const, colorIndex: 0, score: 0 }] : team.players;
    const state = startTurns(ps);
    setTurns(state); setShots(0); setMissed([]); setHit(null); setZone(2);
    boost.current = { super: false, double: false };
    newTable(1);
    setPhase('play');
    startTurn(state);
  }
  function restBall() { ballRef.current?.setAttribute('transform', `translate(${LAUNCH.x} ${LAUNCH.y})`); ballRef.current?.setAttribute('opacity', '1'); }
  function startTurn(state: TurnState) {
    setStep('question'); setHit(null); setPower(0); restBall();
    if (solo) {
      void ask().then((ok) => { if (!ok) { end(state); return; } earned(state); setStep('aim'); });
    } else {
      const d = deck.next();
      setQuestion({ q: d.question, setId: d.setId, chance: 1 });
    }
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

  // The power bar swings up and down until the player taps Shoot (like the
  // casting meter in Cast and Catch).
  function startPower() {
    if (step !== 'aim') return;
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
    if (step !== 'power' || !turns) return;
    cancelAnimationFrame(raf.current);
    const sure = boost.current.super;
    boost.current.super = false;
    const land = landing(shotPath(zone, powerAt.current), pockets, sure);
    setStep('shot'); setFlip((f) => f + 1);
    playEffect('whoosh', settings);
    const pts = land.path;
    const L = pathLength(pts);
    const ms = still ? 250 : Math.min(2600, 600 + L * 8);
    // Little sparks where the ball bounces off a wall.
    let run = 0;
    const marks = pts.slice(1, -1).map((p, i) => { run += Math.hypot(p.x - pts[i].x, p.y - pts[i].y); return { x: p.x, y: p.y, delay: (unease(run / L) * ms) / 1000 }; });
    setSparks({ id: Date.now(), pts: still ? [] : marks });
    const t0 = performance.now();
    const tick = (ts: number) => {
      const f = Math.min(1, (ts - t0) / ms);
      const p = still ? pts[pts.length - 1] : pointAt(pts, ease(f));
      ballRef.current?.setAttribute('transform', `translate(${p.x} ${p.y})`);
      if (f < 1) raf.current = requestAnimationFrame(tick); else settle(land.pocket);
    };
    raf.current = requestAnimationFrame(tick);
  }
  function settle(pocket: number | null) {
    const state = turnsNow.current;
    if (!state) return;
    let next = state;
    if (pocket !== null) {
      const points = pockets[pocket].value * (boost.current.double ? 2 : 1);
      boost.current.double = false;
      next = addPoints(state, current(state).id, points);
      setTurns(next);
      setHit({ id: Date.now(), pocket, points });
      playEffect(points >= 70 ? 'win' : 'right', settings);
      buzz(30, settings);
      ballRef.current?.setAttribute('opacity', '0');
    } else {
      setHit({ id: Date.now(), pocket: null, points: 0 });
      playEffect('miss', settings);
    }
    setStep('result');
    timers.current.push(window.setTimeout(() => afterTurn(next), still ? 1000 : 1700));
  }
  function afterTurn(state: TurnState) {
    const n = shots + 1;
    setShots(n);
    if (n >= total) { end(state); return; }
    const next = nextTurn(state);
    setTurns(next);
    // Everyone has had a turn: a new round, one more pocket, a fresh table.
    if (n % players === 0) newTable(Math.floor(n / players) + 1);
    startTurn(next);
  }
  function end(state: TurnState) {
    cancelAnimationFrame(raf.current);
    setTurns(state); setPhase('end');
    playEffect('win', settings);
    if (settings.celebrations !== 'off' && !still) void confetti({ particleCount: 90, spread: 90, origin: { y: 0.5 }, disableForReducedMotion: true });
  }
  // The computer aims at a zone, lets the bar run a moment, and shoots.
  useEffect(() => {
    if (phase !== 'play' || player?.kind !== 'cpu') return;
    if (step === 'aim') {
      const id = window.setTimeout(() => { setZone(Math.floor(Math.random() * ZONES)); startPower(); }, 800);
      return () => window.clearTimeout(id);
    }
    if (step === 'power') {
      const id = window.setTimeout(() => shoot(), 500 + Math.random() * 900);
      return () => window.clearTimeout(id);
    }
  }); // eslint-disable-line react-hooks/exhaustive-deps
  // Keyboard: arrows aim, Space or Enter launches and shoots.
  useEffect(() => {
    if (phase !== 'play' || !human) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.('input, textarea, [role="dialog"]')) return;
      if (step === 'aim' && e.key === 'ArrowLeft') { e.preventDefault(); setZone((z) => Math.max(0, z - 1)); }
      if (step === 'aim' && e.key === 'ArrowRight') { e.preventDefault(); setZone((z) => Math.min(ZONES - 1, z + 1)); }
      if ((e.key === ' ' || e.key === 'Enter') && (e.target as HTMLElement)?.tagName !== 'BUTTON') { e.preventDefault(); if (step === 'aim') startPower(); else if (step === 'power') shoot(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const canAim = phase === 'play' && step === 'aim' && human;
  const ballArt = pieceImage(theme, 'ball');
  const pocketColor = pieceColor(theme, 'pocket', '#fdfd94');
  const bumperColor = pieceColor(theme, 'bumper', '#f2735f');
  const flipperColor = pieceColor(theme, 'flipper', '#fdfd94');
  const aimTo = { x: ZONE_X[zone], y: ZONE_Y };
  const showAim = phase === 'play' && (step === 'aim' || step === 'power');
  const dir = { x: aimTo.x - LAUNCH.x, y: aimTo.y - LAUNCH.y };
  const dlen = Math.hypot(dir.x, dir.y);
  const tip = { x: LAUNCH.x + (dir.x / dlen) * (dlen - 7), y: LAUNCH.y + (dir.y / dlen) * (dlen - 7) };
  const ang = (Math.atan2(dir.y, dir.x) * 180) / Math.PI;

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
            <section className="grid gap-2 min-w-0 [--pb-extra:4.5rem] lg:[--pb-extra:0rem]">
              <div className="relative mx-auto rounded-[28px] border-[3px] border-border overflow-hidden select-none touch-none"
                style={{ ...pieceFill(theme, 'board', '#314677'), aspectRatio: `${W} / ${H}`, width: `calc((var(--play-h) - 6.25rem - var(--pb-extra)) * ${W / H})`, maxWidth: '100%', boxShadow: 'var(--shadow-sticker-lg)' }}>
                <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" role="img" aria-label={t('pb.board', { n: pockets.length })}>
                  <defs>
                    <radialGradient id="pb-ball" cx="35%" cy="30%" r="70%"><stop offset="0%" stopColor="#ffffff" /><stop offset="55%" stopColor={pieceColor(theme, 'ball', '#e7ecf5')} /><stop offset="100%" stopColor="#8a93a8" /></radialGradient>
                    {ballArt && <pattern id="pb-ball-art" patternContentUnits="objectBoundingBox" width="1" height="1"><image href={ballArt} width="1" height="1" preserveAspectRatio="xMidYMid slice" /></pattern>}
                  </defs>
                  {/* Rails, the top arch and the lane lights. */}
                  <rect x={3} y={3} width={W - 6} height={H - 6} rx={9} fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={0.7} />
                  <path d={`M 10 30 Q 50 -2 90 30`} fill="none" stroke="#fff" strokeOpacity={0.18} strokeWidth={0.6} strokeDasharray="1.5 2" />
                  {ZONE_X.map((x, i) => <line key={i} x1={LAUNCH.x} y1={LAUNCH.y} x2={x} y2={ZONE_Y} stroke="#fff" strokeOpacity={i === zone && showAim ? 0 : 0.07} strokeWidth={0.5} />)}
                  {/* Scoring pockets, new places and values each round. */}
                  {pockets.map((p, i) => {
                    const on = hit?.pocket === i;
                    return (
                      <g key={`${round}-${i}`} className={still ? '' : 'pb-pocket'} style={{ animationDelay: `${i * 0.06}s`, transformOrigin: `${p.x}px ${p.y}px`, transformBox: 'view-box' as const }}>
                        <circle cx={p.x} cy={p.y} r={POCKET_R + 1.6} fill={on ? '#fdfd94' : pocketColor} opacity={on ? 1 : 0.95} stroke="#000" strokeWidth={0.6} className={on && !still ? 'pb-glow' : ''} />
                        {pieceImage(theme, 'pocket') ? <image href={pieceImage(theme, 'pocket')} x={p.x - POCKET_R} y={p.y - POCKET_R} width={POCKET_R * 2} height={POCKET_R * 2} /> : <circle cx={p.x} cy={p.y} r={POCKET_R} fill="#1b2550" stroke="#000" strokeWidth={0.5} />}
                        <text x={p.x} y={p.y + 1.7} textAnchor="middle" fontSize={4.6} fontWeight={800} fill="#fff" stroke="#000" strokeWidth={0.35} paintOrder="stroke" aria-label={t('pb.pocket', { value: p.value })}>{p.value}</text>
                      </g>
                    );
                  })}
                  {/* Bumpers light up with every launch. */}
                  {BUMPERS.map((b, i) => (
                    <g key={`b-${i}-${flip}`}>
                      <circle cx={b.x} cy={b.y} r={4.6} fill={bumperColor} stroke="#000" strokeWidth={0.6} className={flip && !still ? 'pb-bump' : ''} style={{ animationDelay: `${i * 0.08}s`, transformOrigin: `${b.x}px ${b.y}px`, transformBox: 'view-box' as const }} />
                      <circle cx={b.x} cy={b.y} r={2.2} fill="#fff" opacity={0.85} />
                    </g>
                  ))}
                  {/* The aim arrow, like the bubble shooter's. */}
                  {showAim && (
                    <g>
                      <line x1={LAUNCH.x} y1={LAUNCH.y} x2={tip.x} y2={tip.y} stroke="#fff" strokeWidth={0.9} strokeLinecap="round" strokeDasharray="0.1 2.2" />
                      <path d="M0 -2.6 L4.6 0 L0 2.6 Z" fill="#fff" stroke="#000" strokeWidth={0.4} transform={`translate(${tip.x} ${tip.y}) rotate(${ang})`} />
                    </g>
                  )}
                  {/* Flippers flick on each launch. */}
                  <g key={`f-${flip}`}>
                    <path d="M0 -1.6 L15 -0.6 L15 0.6 L0 1.6 Z" fill={flipperColor} stroke="#000" strokeWidth={0.5} strokeLinejoin="round" transform={`translate(26 118) rotate(18)`} className={flip && !still ? 'pb-flip-l' : ''} style={{ transformOrigin: '0 0', transformBox: 'view-box' as const }} />
                    <path d="M0 -1.6 L-15 -0.6 L-15 0.6 L0 1.6 Z" fill={flipperColor} stroke="#000" strokeWidth={0.5} strokeLinejoin="round" transform={`translate(74 118) rotate(-18)`} className={flip && !still ? 'pb-flip-r' : ''} style={{ transformOrigin: '0 0', transformBox: 'view-box' as const }} />
                  </g>
                  <rect x={LAUNCH.x - 3} y={LAUNCH.y + 3.6} width={6} height={6} rx={1} fill="#9aa3b5" stroke="#000" strokeWidth={0.5} />
                  {sparks && sparks.pts.map((s, i) => (
                    <circle key={`${sparks.id}-${i}`} cx={s.x} cy={s.y} r={2.5} fill="none" stroke="#fdfd94" strokeWidth={0.8} className="pb-spark" style={{ animationDelay: `${s.delay}s`, transformOrigin: `${s.x}px ${s.y}px`, transformBox: 'view-box' as const }} />
                  ))}
                  <g ref={ballRef} transform={`translate(${LAUNCH.x} ${LAUNCH.y})`}>
                    <circle r={3.1} fill={ballArt ? 'url(#pb-ball-art)' : 'url(#pb-ball)'} stroke="#000" strokeWidth={0.5} />
                  </g>
                </svg>
                {/* The five zones, labeled across the middle; tap one to aim. */}
                {ZONE_X.map((x, i) => (
                  <button key={i} type="button" onClick={() => canAim && setZone(i)} disabled={!canAim} aria-pressed={zone === i} aria-label={t('pb.zone', { n: i + 1 })}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 w-[13%] h-[6.5%] rounded-pill border-[2.5px] border-border font-display text-xl sm:text-2xl flex items-center justify-center transition-transform ${zone === i && showAim ? 'scale-110 ring-4 ring-white' : 'opacity-90'} disabled:cursor-default`}
                    style={{ left: `${(x / W) * 100}%`, top: `${(ZONE_Y / H) * 100}%`, background: ZONE_COLORS[i] }}>{i + 1}</button>
                ))}
                <AnimatePresence>
                  {hit && hit.pocket !== null && pockets[hit.pocket] && (
                    <motion.span key={hit.id} className="absolute font-display text-4xl sm:text-5xl text-white -translate-x-1/2 pointer-events-none" style={{ left: `${(pockets[hit.pocket].x / W) * 100}%`, WebkitTextStroke: '2px #000' }}
                      initial={{ top: `${(pockets[hit.pocket].y / H) * 100 - 4}%`, opacity: 1, scale: 0.6 }} animate={{ top: `${(pockets[hit.pocket].y / H) * 100 - 14}%`, opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: still ? 0.01 : 0.7 }}>+{hit.points}</motion.span>
                  )}
                  {hit && hit.pocket === null && (
                    <motion.p key={hit.id} className="absolute inset-x-0 top-[42%] text-center font-display text-4xl text-white pointer-events-none" style={{ WebkitTextStroke: '2px #000' }}
                      initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} role="status">{t('pb.close')}</motion.p>
                  )}
                  {banner && (
                    <motion.p key={banner.id} className="absolute inset-x-0 top-[2.5%] mx-auto w-max max-w-[90%] text-center font-display text-xl sm:text-2xl bg-surface border-[2.5px] border-border rounded-pill px-4 py-1 pointer-events-none" style={{ boxShadow: 'var(--shadow-sticker)' }}
                      initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: still ? 0.01 : 0.35 }}
                      onAnimationComplete={() => { const id = banner.id; timers.current.push(window.setTimeout(() => setBanner((b) => (b?.id === id ? null : b)), 1600)); }}
                      role="status">{banner.text}</motion.p>
                  )}
                </AnimatePresence>
              </div>
              {/* Aim left and right, then Launch starts the power bar and Shoot fires. */}
              <div className="flex items-center justify-center gap-3 mx-auto w-full" style={{ maxWidth: `calc((var(--play-h) - 6.25rem - var(--pb-extra)) * ${W / H})` }}>
                {step === 'power' && human ? (
                  <>
                    <div className="relative flex-1 h-7 rounded-pill border-[2.5px] border-border overflow-hidden" style={{ background: 'linear-gradient(90deg, #9fe7a0 0%, #fdfd94 55%, #ed9d75 100%)' }} role="meter" aria-label={t('pb.meter')} aria-valuenow={Math.round(power * 100)} aria-valuemin={0} aria-valuemax={100}>
                      <span className="absolute inset-y-0 left-0 bg-black/15" style={{ width: `${power * 100}%` }} />
                      <span className="absolute top-0 bottom-0 w-1.5 bg-black" style={{ left: `calc(${power * 100}% - 3px)` }} />
                    </div>
                    <button type="button" className={buttonClasses('primary', 'h-14 !px-6 !text-lg')} onClick={shoot}><RocketLaunch weight="fill" size={24} />{t('pb.shoot')}</button>
                  </>
                ) : (
                  <>
                    <button type="button" className={buttonClasses('secondary', 'w-14 h-14 !px-0')} aria-label={t('pb.aimLeft')} disabled={!canAim || zone === 0} onClick={() => setZone((z) => Math.max(0, z - 1))}><ArrowArcLeft weight="bold" size={26} /></button>
                    <button type="button" className={buttonClasses('primary', `h-14 !px-6 !text-lg ${canAim && !still ? 'motion-safe:animate-pulse' : ''}`)} disabled={!canAim} onClick={startPower}><RocketLaunch weight="fill" size={24} />{t('pb.launch')}</button>
                    <button type="button" className={buttonClasses('secondary', 'w-14 h-14 !px-0')} aria-label={t('pb.aimRight')} disabled={!canAim || zone === ZONES - 1} onClick={() => setZone((z) => Math.min(ZONES - 1, z + 1))}><ArrowArcRight weight="bold" size={26} /></button>
                  </>
                )}
              </div>
            </section>
            <div className="order-first lg:order-none lg:w-[260px] min-w-0 grid">
              <ScoreBoard turns={turns} playing={phase === 'play'} round={t('pb.roundOf', { n: round, total: setup.rounds })} />
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
