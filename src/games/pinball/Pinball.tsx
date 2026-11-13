import { playClip, POWER_SOUNDS } from '../../engine/music';
import { useEffect, useMemo, useRef, useState } from 'react';
import { pace } from '../../engine/pace';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { CheckCircle, Crosshair, Trophy } from '@phosphor-icons/react';
import { data, newId } from '../../data';
import { LIBRARY } from '../../data/library';
import { useMySets } from '../../data/hooks';
import type { MultipleChoiceQuestion } from '../../data/types';
import { buzz, playEffect, playNote, playPop } from '../../engine/feedback';
import { makeDeck } from '../../engine/picker';
import ResultsModal from '../../engine/ResultsModal';
import ShareQuestion from '../../engine/ShareQuestion';
import ScoreBoard from '../../engine/ScoreBoard';
import TeamSetup from '../../engine/TeamSetup';
import { addPoints, CHANCES, current, leaders, nextTurn, startTurns, type CpuLevel, type TurnPlayer, type TurnState } from '../../engine/turns';
import { usePlayClock } from '../../engine/playClock';
import { useAsk } from '../../engine/useAsk';
import { usePowerUps } from '../../engine/usePowerUps';
import { powerUpSwitches } from '../../engine/PowerUpSwitches';
import { PowerUpTray, useHeldPowerUps } from '../../engine/HeldPowerUps';
import { t } from '../../i18n';
import { AccessButton, FullScreenButton, GameTopRow, GearButton, SettingsPanel } from '../../settings/SettingsPanel';
import { useSettings } from '../../settings/SettingsContext';
import { useGamePool } from '../../student/session';
import { pieceColor, pieceFill, pieceImage } from '../../theme/library';
import { ThemedPage, useGameTheme } from '../../theme/useGameTheme';
import { Slider } from '../../ui/fields';
import Title from '../../ui/Title';
import { useSignedIn } from '../../auth/session';
import GameWelcome from '../GameWelcome';
import SetPicker from '../SetPicker';
import SetupWizard from '../SetupWizard';
import ThemeScreen from '../ThemeScreen';
import WayToPlay from '../WayToPlay';
import { useSavedSetup } from '../useSavedSetup';
import { pinballManifest } from './manifest';
import { frameAt, H, LANE_H, LANE_Y, LAUNCH, PEG_R, pegCount, pickValues, pocketCount, POCKET_H, POCKET_TOP, scatter, SHOT_POWER, simulateShot, W, WALL, ZONE_X, ZONES, type Pt, type Shot, type ShotEvent } from './table';

type Phase = 'welcome' | 'theme' | 'setup' | 'play' | 'end';
type Step = 'question' | 'aim' | 'shot' | 'result';
type Boost = 'double' | 'super' | 'magnet' | 'bounce';
// The lane band's colors, like a painted alley (teacher reference, 2026-10-31).
const LANE_COLORS = ['#f6c544', '#9b7be0', '#ef5d7a', '#4fb6d8', '#f39ac0'];
const POCKET_COLORS = ['#ff9b54', '#fbc94a', '#f2735f', '#8fe3a0', '#8ec5ff', '#c9a3f5'];
// Each colored bumper is worth points and has its own sound (teacher,
// 2026-11-01, with her uploaded sounds): left red, middle blue, right green.
const SND = '/sounds/pinball/';
// Pegs (teacher, 2026-11-13): 2 to 6 in new random spots each turn, each
// worth 10 and singing the next note of a tune when the ball bounces off.
const PEG_COLORS = ['#f2735f', '#6aa9e9', '#5cc3a0', '#f6c544', '#c9a3f5', '#f39ac0'];
const PEG_POINTS = 10;
const MAX_SHOT = 4.5; // seconds: longer runs play a little faster

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
  const [setup, change] = useSavedSetup('pinball', { setId: LIBRARY[0].id, rounds: 10, questions: 2, who: 'teams' as 'teams' | 'solo' | 'versus', powerUps: true , powerOff: [] as string[]});
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
  const [question, setQuestion] = useState<{ q: MultipleChoiceQuestion; setId?: string; chance: number; got: number } | null>(null);
  const [missed, setMissed] = useState<MultipleChoiceQuestion[]>([]);
  const [shots, setShots] = useState(0);
  const [, setZone] = useState<number | null>(null);
  // This turn's pegs and floating stars; a collected star pops away.
  const [pegs, setPegs] = useState<Pt[]>([]);
  const [stars, setStars] = useState<Pt[]>([]);
  const [gotStars, setGotStars] = useState<number[]>([]);
  const noteNo = useRef(0);
  const [layout, setLayout] = useState(0);
  const [values, setValues] = useState<number[]>([]);
  const [hit, setHit] = useState<{ id: number; pocket: number | null; points: number; jackpot: boolean; bonus: number } | null>(null);
  const [sparks, setSparks] = useState<{ id: number; x: number; y: number; big: boolean }[]>([]);
  // Points from bumpers this shot, shown floating up from each bumper hit.
  const bumpPoints = useRef(0);
  const [floats, setFloats] = useState<{ id: number; x: number; y: number; n: number; color: string }[]>([]);
  const phaseNow = useRef<Phase>('welcome');
  const boardRef = useRef<HTMLDivElement>(null);
  const [banner, setBanner] = useState<{ id: number; text: string } | null>(null);
  const [flip, setFlip] = useState(0);
  const [armed, setArmed] = useState<Boost[]>([]);
  const timers = useRef<number[]>([]);
  const shotsNow = useRef(0);
  const raf = useRef(0);
  const ballRef = useRef<SVGGElement>(null);
  const trailRefs = useRef<(SVGCircleElement | null)[]>([]);
  const bumperRefs = useRef<(SVGCircleElement | null)[]>([]);
  const bumperGroups = useRef<(SVGGElement | null)[]>([]);

  // Power-ups: a right answer may bring one; it waits for this player's next
  // turn, under the scoreboard, and is gone after that turn (teacher, 2026-10-31).
  const powers = usePowerUps(pinballManifest, theme, setup.powerUps, setup.powerOff ?? []);
  const held = useHeldPowerUps();
  const boost = useRef<Set<Boost>>(new Set());
  const player = turns ? current(turns) : null;
  const players = turns?.players.length ?? 1;
  const total = players * setup.rounds;
  const need = Math.max(1, Math.min(5, setup.questions ?? 2));
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
    shotsNow.current = 0;
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
    setStep('question'); setHit(null); setZone(null); setArmed([]); restBall();
    // New pegs (more as the game goes on) and 1 to 3 stars, every turn.
    const progress = total > 1 ? shotsNow.current / (total - 1) : 0;
    const ps = scatter(pegCount(progress));
    setPegs(ps); setStars(scatter(1 + Math.floor(Math.random() * 3), ps, 11)); setGotStars([]); setLayout((n) => n + 1);
    boost.current = new Set();
    held.beginTurn(current(state).id);
    if (solo) {
      void ask({ count: need }).then((ok) => { if (!ok) { end(state); return; } setStep('aim'); });
    } else {
      const d = deck.next();
      setQuestion({ q: d.question, setId: d.setId, chance: 1, got: 0 });
    }
  }
  // A collected star earns a power-up for the player's next turn (teacher, 2026-11-13).
  function starPower(state: TurnState) {
    const me = current(state).id;
    const it = powers.grant(true, (x) => x.ability !== 'swipe' || state.players.some((p) => p.id !== me && p.score > 0));
    if (it) held.earn(me, it);
    return it;
  }
  function onShareResult(right: boolean) {
    if (!turns || !question || !player) return;
    if (player.kind !== 'cpu' && player.kind !== 'teacher') {
      void data.logQuestion({ id: newId('log'), at: new Date().toISOString(), teamName: player.name, gameId: 'pinball', mode: 'share', setId: question.setId, prompt: question.q.prompt, answer: question.q.choices[question.q.correctIndex], tries: [], ms: 0, outcome: right ? 'right' : 'skipped' });
      if (!right) setMissed((m) => (m.some((x) => x.id === question.q.id) ? m : [...m, question.q]));
    }
    // Three tries, a new question each time (teacher, 2026-10-31, as in Game Show).
    if (!right && question.chance < CHANCES) { const d = deck.next(); setQuestion({ q: d.question, setId: d.setId, chance: question.chance + 1, got: question.got }); return; }
    // Questions between shots (teacher, 2026-11-13): that many right answers pull the plunger back.
    if (right && question.got + 1 < need) { const d = deck.next(); setQuestion({ q: d.question, setId: d.setId, chance: 1, got: question.got + 1 }); return; }
    setQuestion(null);
    if (right) setStep('aim'); else afterTurn(turns);
  }

  // Use a held power-up: its Classic role happens now or on this shot.
  function applyItem(i: number) {
    const state = turnsNow.current;
    const it = held.use(i);
    if (!it || !state) return;
    playEffect('win', settings);
    const me = current(state).id;
    const ab = it.ability;
    if (ab === 'magnet') playClip(POWER_SOUNDS.magnet, settings);
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

  // Pick a lane: the band fades away and the ball shoots up that lane at
  // the same power every time (teacher, 2026-11-13: no power bar).
  function pickLane(z: number) {
    if (step !== 'aim') return;
    setZone(z);
    playEffect('tap', settings);
    shoot(z);
  }
  // Restart a CSS animation on an element.
  function replay(el: Element | null | undefined, cls: string) {
    if (!el) return;
    el.classList.remove(cls);
    void (el as HTMLElement).getBoundingClientRect();
    el.classList.add(cls);
  }
  // What happens at each moment of the shot: bumpers flash and kick, walls
  // spark, the ball rattles on a pocket line, a lucky flip sends it back up.
  function onEvent(e: ShotEvent) {
    if (e.kind === 'star' && e.i !== undefined) {
      const i = e.i;
      setGotStars((g) => [...g, i]);
      playPop(settings);
      buzz(15, settings);
      const state = turnsNow.current;
      if (state && starPower(state)) setBanner({ id: Date.now(), text: t('pb.starPower') });
      setSparks((sp) => [...sp, { id: Date.now() + Math.random(), x: e.x, y: e.y, big: true }]);
    }
    if (e.kind === 'bumper' && e.i !== undefined) {
      const c = bumperRefs.current[e.i];
      c?.setAttribute('fill', '#fdfd94');
      timers.current.push(window.setTimeout(() => c?.setAttribute('fill', bumperFill(e.i!)), 170));
      bumpPoints.current += PEG_POINTS;
      setFloats((f) => [...f.slice(-8), { id: Date.now() + Math.random(), x: e.x, y: e.y - 6, n: PEG_POINTS, color: bumperFill(e.i!) }]);
      playNote(noteNo.current++, settings);
      replay(bumperGroups.current[e.i], 'pb-hit');
      if (settings.screenShake && !still) replay(boardRef.current, 'pb-shake');
      buzz(12, settings);
      setSparks((sp) => [...sp, { id: Date.now() + Math.random(), x: e.x, y: e.y, big: true }]);
    }
    if (e.kind === 'wall') { playEffect('tap', settings); setSparks((sp) => [...sp, { id: Date.now() + Math.random(), x: e.x, y: e.y, big: false }]); }
    if (e.kind === 'rattle') playEffect('tap', settings);
    if (e.kind === 'flip') { setFlip((f) => f + 1); playClip(`${SND}flippers.mp3`, settings); setBanner({ id: Date.now(), text: t('pb.luckyFlip') }); }
  }
  function shoot(lane: number) {
    if (!turns) return;
    cancelAnimationFrame(raf.current);
    const b = boost.current;
    const shot = simulateShot(lane, SHOT_POWER, { count: values.length, rails: plainTable, pegs, stars, sure: b.has('super') || b.has('magnet'), magnetTo: b.has('magnet') ? values.indexOf(best) : undefined });
    setStep('shot'); setSparks([]); setFloats([]); bumpPoints.current = 0; noteNo.current = 0;
    playEffect('whoosh', settings);
    if (still) {
      shot.events.forEach((e) => { if (e.kind === 'bumper') bumpPoints.current += PEG_POINTS; if (e.kind === 'star') onEvent(e); });
      if (shot.flipped) { playEffect('whoosh', settings); setBanner({ id: Date.now(), text: t('pb.luckyFlip') }); }
      const end = shot.frames[shot.frames.length - 1];
      ballRef.current?.setAttribute('transform', `translate(${end.x} ${end.y})`);
      timers.current.push(window.setTimeout(() => settle(shot), 250));
      return;
    }
    const speed = Math.max(1, shot.dur / MAX_SHOT);
    const t0 = performance.now();
    const trail: Pt[] = [];
    let ev = 0;
    const tick = (ts: number) => {
      const at = ((ts - t0) / 1000) * speed;
      const p = frameAt(shot.frames, at);
      ballRef.current?.setAttribute('transform', `translate(${p.x} ${p.y})`);
      while (ev < shot.events.length && shot.events[ev].t <= at) onEvent(shot.events[ev++]);
      // A short glowing trail behind the ball.
      trail.unshift(p); trail.length = Math.min(trail.length, 9);
      trailRefs.current.forEach((c, k) => { const q = trail[(k + 1) * 2]; if (c && q) { c.setAttribute('cx', String(q.x)); c.setAttribute('cy', String(q.y)); c.setAttribute('opacity', String(0.45 - k * 0.12)); } });
      if (at < shot.dur) raf.current = requestAnimationFrame(tick); else settle(shot);
    };
    raf.current = requestAnimationFrame(tick);
  }
  function settle(shot: Shot) {
    const state = turnsNow.current;
    if (!state || phaseNow.current !== 'play') return;
    setBanner(null); // the result has the stage now
    const pocket = shot.pocket;
    trailRefs.current.forEach((c) => c?.setAttribute('opacity', '0'));
    let next = state;
    const b = boost.current;
    if (pocket !== null) {
      const bonus = 0;
      // Bounce bonus: 10 a hit, up to 8 hits.
      const points = values[pocket] * (b.has('double') ? 2 : 1) + (b.has('bounce') ? Math.min(8, shot.bounces + shot.bumps) * 10 : 0) + bonus + bumpPoints.current;
      const jackpot = values[pocket] === best;
      next = addPoints(state, current(state).id, points);
      setTurns(next);
      setHit({ id: Date.now(), pocket, points, jackpot, bonus });
      if (jackpot || bonus) playEffect('win', settings);
      playClip(`${SND}score-bell.mp3`, settings); // the score bell rings for every pocket
      buzz(30, settings);
      if ((jackpot || bonus) && settings.celebrations !== 'off' && !still) void confetti({ particleCount: bonus ? 90 : 60, spread: 70, origin: { y: 0.25 }, disableForReducedMotion: true });
      ballRef.current?.setAttribute('opacity', '0');
    } else {
      // A drained ball still keeps what the bumpers earned.
      if (bumpPoints.current) { next = addPoints(state, current(state).id, bumpPoints.current); setTurns(next); }
      setHit({ id: Date.now(), pocket: null, points: bumpPoints.current, jackpot: false, bonus: 0 });
      playEffect('miss', settings);
    }
    setStep('result');
    timers.current.push(window.setTimeout(() => afterTurn(next), (still ? 1000 : 1800) * pace(settings)));
  }
  function afterTurn(state: TurnState) {
    if (phaseNow.current !== 'play') return;
    held.endTurn(); // unused power-ups are gone after the turn
    const n = shots + 1;
    shotsNow.current = n;
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
    timers.current.forEach((id) => window.clearTimeout(id)); timers.current = [];
    phaseNow.current = 'end';
    held.endTurn();
    setTurns(state); setPhase('end');
    playEffect('win', settings);
    if (settings.celebrations !== 'off' && !still) void confetti({ particleCount: 90, spread: 90, origin: { y: 0.5 }, disableForReducedMotion: true });
  }
  phaseNow.current = phase;
  // The computer uses what it holds, then picks a lane.
  useEffect(() => {
    if (phase !== 'play' || player?.kind !== 'cpu' || step !== 'aim') return;
    const id = window.setTimeout(() => { for (let k = held.held.length - 1; k >= 0; k--) applyItem(k); pickLane(Math.floor(Math.random() * ZONES)); }, 900 * pace(settings));
    return () => window.clearTimeout(id);
  }, [phase, step, player?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  // Keyboard: 1 to 5 pick a lane, Space or Enter shoots.
  useEffect(() => {
    if (phase !== 'play' || !human) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.('input, textarea, [role="dialog"], dialog')) return;
      const n = Number(e.key);
      if (step === 'aim' && n >= 1 && n <= ZONES) { e.preventDefault(); pickLane(n - 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const canAim = phase === 'play' && step === 'aim' && human;
  const ballArt = pieceImage(theme, 'ball');
  // A theme's own bumper color paints all three; Classic gives each its color.
  const themedBumper = pieceColor(theme, 'bumper', '') && pieceColor(theme, 'bumper', '').toLowerCase() !== '#f2735f';
  const bumperFill = (i: number) => (themedBumper ? pieceColor(theme, 'bumper', '#f2735f') : PEG_COLORS[i % PEG_COLORS.length]);
  const flipperColor = pieceColor(theme, 'flipper', '#fdfd94');
  const plainTable = !pieceImage(theme, 'board');
  const pw = 100 / Math.max(1, values.length);
  const boardW = `calc((var(--play-h) - 1.5rem - var(--pb-extra)) * ${W / H})`;
  const tray = <PowerUpTray manifest={pinballManifest} items={held.held} onUse={applyItem} disabled={step !== 'aim' || !human} />;

  return (
    <ThemedPage theme={theme} menu={phase !== 'play' && phase !== 'end'}>
    <main className={phase === 'play' || phase === 'end' ? '!p-0' : 'w-full px-4 sm:px-6 pt-6 pb-6'}>
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
              <Slider label={t('pb.rounds')} hint={solo ? t('pb.roundsHintSolo') : t('pb.roundsHint')} min={1} max={20} value={setup.rounds} onChange={(v) => change({ rounds: v })} />
              <Slider label={t('pb.questions')} hint={t('pb.questionsHint')} min={1} max={5} value={need} onChange={(v) => change({ questions: v })} />
              {powerUpSwitches({ manifest: pinballManifest, theme, on: setup.powerUps, off: setup.powerOff ?? [], change })}
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
              <div ref={boardRef} className="relative mx-auto rounded-[28px] border-[3px] border-border overflow-hidden select-none touch-none"
                style={{ ...pieceFill(theme, 'board', '#314677'), aspectRatio: `${W} / ${H}`, width: boardW, maxWidth: '100%', boxShadow: 'var(--shadow-sticker-lg)' }}>
                <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" role="img" aria-label={t('pb.board', { n: values.length })}>
                  <defs>
                    <radialGradient id="pb-ball" cx="35%" cy="30%" r="70%"><stop offset="0%" stopColor="#ffffff" /><stop offset="55%" stopColor={pieceColor(theme, 'ball', '#e7ecf5')} /><stop offset="100%" stopColor="#8a93a8" /></radialGradient>
                    <radialGradient id="pb-spot" cx="50%" cy="55%" r="60%"><stop offset="0%" stopColor="#fff" stopOpacity={0.2} /><stop offset="100%" stopColor="#fff" stopOpacity={0} /></radialGradient>
                    {ballArt && <pattern id="pb-ball-art" patternContentUnits="objectBoundingBox" width="1" height="1"><image href={ballArt} width="1" height="1" preserveAspectRatio="xMidYMid slice" /></pattern>}
                  </defs>
                  {/* Table art (Golden Rule pass, 2026-10-31), drawn over the table
                      color so a theme's color still shows: a glow, arrow lights,
                      a big star, rails down to the flippers and two kickers. */}
                  {plainTable && (
                    <g aria-hidden="true">
                      <rect x={0} y={0} width={W} height={H} fill="url(#pb-spot)" />
                      {[[38, 36], [62, 36], [50, 40]].map(([x, y], i) => (
                        <path key={`ar-${i}`} d={`M${x - 3} ${y + 2.4} L${x} ${y - 1.2} L${x + 3} ${y + 2.4}`} fill="none" stroke="#fdfd94" strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round" opacity={0.75} className={still || step !== 'shot' ? '' : 'pb-blink'} style={{ animationDelay: `${i * 0.25}s` }} />
                      ))}
                      {/* Only collectible stars on the table now (teacher, 2026-11-13). */}
                      {[-1, 1].map((sd) => (
                        <g key={`side-${sd}`}>
                          <path d={sd < 0 ? 'M5.5 88 L22 109' : 'M94.5 88 L78 109'} stroke="#000" strokeWidth={2.4} strokeLinecap="round" />
                          <path d={sd < 0 ? 'M5.5 88 L22 109' : 'M94.5 88 L78 109'} stroke="#c9d3ea" strokeWidth={1.2} strokeLinecap="round" />
                          <path d={sd < 0 ? 'M12 84 L12 96 L19.5 99.5 Z' : 'M88 84 L88 96 L80.5 99.5 Z'} fill="#f2735f" stroke="#000" strokeWidth={0.6} strokeLinejoin="round" />
                          <path d={sd < 0 ? 'M13.4 87.5 L13.4 94.6 L17.6 96.6' : 'M86.6 87.5 L86.6 94.6 L82.4 96.6'} fill="none" stroke="#fff" strokeWidth={0.7} strokeLinecap="round" />
                        </g>
                      ))}
                    </g>
                  )}
                  <rect x={3} y={3} width={W - 6} height={H - 6} rx={9} fill="none" stroke="#fff" strokeOpacity={0.3} strokeWidth={0.7} />
                  {/* Pegs in new spots every turn: they pop in, bob a little, and
                      flash and swell when the ball bounces off. */}
                  {pegs.map((b, i) => (
                    <g key={`p-${layout}-${i}`} className={still ? '' : 'pb-peg-in'} style={{ transformBox: 'fill-box', transformOrigin: 'center', animationDelay: `${i * 0.06}s` }}>
                      <g ref={(el) => { bumperGroups.current[i] = el; }} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
                        <circle cx={b.x} cy={b.y + 0.8} r={PEG_R + 0.9} fill="#000" opacity={0.25} />
                        <circle cx={b.x} cy={b.y} r={PEG_R + 0.7} fill="#fff" stroke="#000" strokeWidth={0.45} />
                        <circle ref={(el) => { bumperRefs.current[i] = el; }} cx={b.x} cy={b.y} r={PEG_R} fill={bumperFill(i)} stroke="#000" strokeWidth={0.5} />
                        {pieceImage(theme, 'bumper') ? <image href={pieceImage(theme, 'bumper')} x={b.x - 4} y={b.y - 4} width={8} height={8} /> : <circle cx={b.x - 1} cy={b.y - 1} r={1.1} fill="#fff" opacity={0.85} />}
                      </g>
                    </g>
                  ))}
                  {/* Stars float between the pegs: the ball pops any it touches
                      and earns a power-up for the next turn. */}
                  {stars.map((st, i) => !gotStars.includes(i) && (
                    <g key={`s-${layout}-${i}`} transform={`translate(${st.x} ${st.y})`}>
                      <g className={still ? '' : 'pb-star-float'} style={{ animationDelay: `${i * 0.4}s` }}>
                        <circle r={4.4} fill="#fdfd94" opacity={0.25} className={still ? '' : 'pb-blink'} />
                        <path d="M0 -3.8 L1.1 -1.3 L3.8 -1.2 L1.7 0.6 L2.4 3.2 L0 1.7 L-2.4 3.2 L-1.7 0.6 L-3.8 -1.2 L-1.1 -1.3 Z" fill="#fdfd94" stroke="#000" strokeWidth={0.45} strokeLinejoin="round" />
                      </g>
                    </g>
                  ))}
                  <g key={`f-${flip}`}>
                    <path d="M0 -1.6 L15 -0.6 L15 0.6 L0 1.6 Z" fill={flipperColor} stroke="#000" strokeWidth={0.5} strokeLinejoin="round" transform="translate(26 118) rotate(18)" className={flip && !still ? 'pb-flip-l' : ''} style={{ transformOrigin: '0 0', transformBox: 'view-box' as const }} />
                    <path d="M0 -1.6 L-15 -0.6 L-15 0.6 L0 1.6 Z" fill={flipperColor} stroke="#000" strokeWidth={0.5} strokeLinejoin="round" transform="translate(74 118) rotate(-18)" className={flip && !still ? 'pb-flip-r' : ''} style={{ transformOrigin: '0 0', transformBox: 'view-box' as const }} />
                  </g>
                  {/* The plunger pulls back as the power bar fills. */}
                  <rect x={LAUNCH.x - 3} y={LAUNCH.y + 3.6} width={6} height={6} rx={1} fill="#9aa3b5" stroke="#000" strokeWidth={0.5} />
                  {floats.map((f) => (
                    <text key={f.id} x={f.x} y={f.y} textAnchor="middle" fontSize={5.5} fontWeight={800} fill={f.color} stroke="#000" strokeWidth={0.7} paintOrder="stroke" fontFamily="var(--font-display, sans-serif)" className={still ? '' : 'pb-float'}>+{f.n}</text>
                  ))}
                  {sparks.map((sp) => (
                    <circle key={sp.id} cx={sp.x} cy={sp.y} r={sp.big ? 4 : 2.5} fill="none" stroke="#fdfd94" strokeWidth={sp.big ? 1.1 : 0.8} className="pb-spark" style={{ transformOrigin: `${sp.x}px ${sp.y}px`, transformBox: 'view-box' as const }} />
                  ))}
                  {[0, 1, 2, 3].map((k) => <circle key={k} ref={(el) => { trailRefs.current[k] = el; }} r={3.1 - k * 0.45} fill="#fdfd94" opacity={0} />)}
                  <g ref={ballRef} transform={`translate(${LAUNCH.x} ${LAUNCH.y})`}>
                    <circle cx={0.7} cy={1.1} r={3.1} fill="#000" opacity={0.3} />
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
                        className={`relative flex-1 min-w-0 mx-[1.5px] border-[2.5px] border-border rounded-b-[14px] rounded-t-[4px] flex items-center justify-center ${values.length > 7 ? 'text-lg sm:text-xl' : 'text-2xl sm:text-4xl'} ${on ? 'ring-4 ring-white z-10' : ''}`}
                        style={{ ...(pieceImage(theme, 'pocket') ? pieceFill(theme, 'pocket', POCKET_COLORS[i % POCKET_COLORS.length]) : { background: on ? '#fdfd94' : `linear-gradient(180deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 32%), linear-gradient(180deg, ${POCKET_COLORS[i % POCKET_COLORS.length]} 0%, ${POCKET_COLORS[i % POCKET_COLORS.length]} 70%, rgba(255,255,255,0.35) 100%)` }), boxShadow: 'inset 0 -5px 0 rgba(0,0,0,0.18), inset 0 3px 6px rgba(0,0,0,0.25)', width: `${pw}%`, color: '#fff', fontFamily: "'Grow Year', var(--font-display)", WebkitTextStroke: '1.5px #000', paintOrder: 'stroke' }}>
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
                          className={`flex-1 border-y-[2.5px] border-border first:border-l-[2.5px] last:border-r-[2.5px] first:rounded-l-input last:rounded-r-input font-display text-3xl sm:text-5xl text-white flex items-center justify-center disabled:cursor-default ${canAim && !still ? 'hover:brightness-110 hover:scale-y-110 hover:z-10 active:scale-95 motion-safe:transition-transform' : ''}`}
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
                  {hit && hit.bonus > 0 && (
                    <motion.p key={`lb-${hit.id}`} className="absolute inset-x-0 top-[46%] text-center font-display text-3xl sm:text-4xl text-[#fdfd94] pointer-events-none" style={{ WebkitTextStroke: '2px #000' }}
                      initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={still ? { duration: 0.01 } : { type: 'spring', stiffness: 280, damping: 13, delay: 0.25 }} role="status">{t('pb.lightsBonus', { n: hit.bonus })}</motion.p>
                  )}
                  {hit && hit.jackpot && (
                    <motion.p key={`j-${hit.id}`} className="absolute inset-x-0 top-[34%] text-center font-display text-5xl text-[#fdfd94] pointer-events-none" style={{ WebkitTextStroke: '2px #000' }}
                      initial={{ scale: 0.4, opacity: 0, rotate: -8 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 14 }} role="status">{t('pb.jackpot')}</motion.p>
                  )}
                  {hit && hit.pocket === null && (
                    <motion.p key={hit.id} className="absolute inset-x-0 top-[62%] text-center font-display text-4xl text-white pointer-events-none" style={{ WebkitTextStroke: '2px #000' }}
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
              {/* Small screens: held power-ups float over the table's lower left. */}
              <div className="lg:hidden absolute left-2 w-[min(15rem,45%)] z-10" style={{ bottom: '1rem' }}>{tray}</div>
            </section>
            <div className="order-first lg:order-none lg:w-[260px] min-w-0 grid gap-3">
              <ScoreBoard turns={turns} playing={phase === 'play'} round={`${round}/${setup.rounds}`} roundLabel={t('pb.roundWord')} />
              {/* Held power-ups, right under the scores (teacher, 2026-10-31). */}
              <div className="hidden lg:block">{tray}</div>
            </div>
          </div>
        </div>
      )}
      {question && player && phase === 'play' && !solo && <ShareQuestion key={`${question.q.id}-${question.chance}-${question.got}`} question={question.q} player={player} cpuLevel={team.level} onResult={onShareResult} chance={{ n: question.chance, total: CHANCES }} />}
      {phase === 'end' && turns && (
        <ResultsModal winners={turns.players.length > 1 ? leaders(turns) : undefined} title={turns.players.length > 1 ? (leaders(turns).length > 1 ? t('share.tie') : t('share.winner', { name: leaders(turns)[0].name })) : t('pb.done', { count: turns.players[0].score })} missed={solo ? soloMissed : missed} againLabel={t('share.again')} onAgain={() => setPhase('welcome')} />
      )}
      {powers.element}
      {element}
    </main>
    </ThemedPage>
  );
}
