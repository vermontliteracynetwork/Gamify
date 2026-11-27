import { playClip, POWER_SOUNDS } from '../../engine/music';
import HintButton from '../../engine/HintButton';
import Title from '../../ui/Title';
import { CPU_THINK_MS, pace } from '../../engine/pace';
import TapOk from '../../engine/TapOk';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { CheckCircle, HandTap, Trophy } from '@phosphor-icons/react';
import { data, newId } from '../../data';
import { LIBRARY } from '../../data/library';
import { useMySets } from '../../data/hooks';
import type { MultipleChoiceQuestion } from '../../data/types';
import { buzz, playEffect } from '../../engine/feedback';
import { makeDeck } from '../../engine/picker';
import ResultsModal from '../../engine/ResultsModal';
import ShareQuestion from '../../engine/ShareQuestion';
import Meter from '../../ui/Meter';
import { CHANCES } from '../../engine/turns';
import TeamSetup from '../../engine/TeamSetup';
import { TeamArt } from '../../engine/TeamBadge';
import { addPoints, current, leaders, nextTurn, startTurns, type CpuLevel, type TurnPlayer, type TurnState } from '../../engine/turns';
import { usePlayClock } from '../../engine/playClock';
import { useAsk } from '../../engine/useAsk';
import { t } from '../../i18n';
import { FullScreenButton, GameTopRow, GearButton, SettingsPanel } from '../../settings/SettingsPanel';
import { CrayonPowerUp } from '../../brand/CrayonKit';
import CloseGameButton from '../../engine/CloseGameButton';
import { useSettings } from '../../settings/SettingsContext';
import { useGamePool } from '../../student/session';
import { pieceColor, pieceFill, pieceImage } from '../../theme/library';
import { ThemedPage, useGameTheme } from '../../theme/useGameTheme';
import { Slider } from '../../ui/fields';
import { useSignedIn } from '../../auth/session';
import GameWelcome from '../GameWelcome';
import SetPicker from '../SetPicker';
import WayToPlay from '../WayToPlay';
import ShareHow from '../ShareHow';
import SetupWizard from '../SetupWizard';
import ThemeScreen from '../ThemeScreen';
import { useHostTeams, useSavedSetup } from '../useSavedSetup';
import { usePowerUps } from '../../engine/usePowerUps';
import { powerUpSwitches } from '../../engine/PowerUpSwitches';
import { PowerUpTray, useHeldPowerUps } from '../../engine/HeldPowerUps';
import { bowlingManifest } from './manifest';
import { PIN_OUTLINE } from '../../theme/builder/shapes';
import { cpuPlan, fullRack, PIN_SPOTS, PIN_XY, rollPoints, shakePins, simulateRoll, toView, type SimResult } from './lane';
import { alley, BALL_COLORS, ballUrl, BowlCards, C, ClassicPin, FlatBall, GY, INK, WallConfetti, type FrameMark } from './alley';

type Phase = 'welcome' | 'theme' | 'setup' | 'play' | 'end';
type Step = 'question' | 'aim' | 'spin' | 'roll' | 'result';
// Classic: the approved alley (teacher, 2026-11-24 redesign), flat balls in
// the brand brights, one color per player. Each player's ball is their icon
// too (teacher, 2026-11-01): the ball they pick on the Teams page is the one
// they roll. A theme draws up to 10 balls (pieces ball-1 to ball-10); any it
// leaves out stay Classic.
const BALLS = 10;
// Boards down the lane (fractions of the half width), fixed so they never jump.
const BOARDS = [-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75];

// Bowling (launch roster, Stage 7): a right answer earns a roll. Tap a
// lane and the ball rolls into ten pins. Two rolls a frame;
// strikes and spares earn a bonus. Teams on one screen or one player.
export default function Bowling() {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const { theme, themes, playable, choose } = useGameTheme('bowling');
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const hostTeams = useHostTeams();
  const [setup, change] = useSavedSetup('bowling', { setId: LIBRARY[0].id, frames: 3, who: 'solo' as 'teams' | 'solo' | 'versus', powerUps: true , powerOff: [] as string[]}, hostTeams ? { who: 'teams' as const } : undefined);
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
  const [banner, setBanner] = useState<{ id: number; text: string; kind?: 'strike' | 'spare' | 'miss' | 'split' | null } | null>(null);
  // Every result banner stays until it is tapped (teacher, 2026-11-24); then the game goes on.
  const afterBanner = useRef<(() => void) | null>(null);
  const closeBanner = () => { setBanner(null); const go = afterBanner.current; afterBanner.current = null; go?.(); };
  // Strikes in a row for each player: two is a Double, three a Turkey.
  const streak = useRef<Record<string, number>>({});
  const [missed, setMissed] = useState<MultipleChoiceQuestion[]>([]);
  // The ten-frame sheet (teacher, 2026-11-23): each player's finished frames,
  // X for a strike, / for a spare, else the running total.
  const [sheet, setSheet] = useState<Record<string, FrameMark[]>>({});
  const frameKind = useRef<'X' | '/' | null>(null);
  // The stage's size, so the lane is drawn to fill it (and, on tall screens,
  // the height of the player row above it).
  const stageRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 1000, h: 625, block: 0 });
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
    if (ab === 'magnet') playClip(POWER_SOUNDS.magnet, settings);
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
      if (fall.length) { setT(addPoints(state, current(state).id, fall.length)); afterBanner.current = null; setBanner({ id: Date.now(), text: `${t('sb.twister', { count: fall.length })} +${fall.length}`, kind: null }); }
    }, 1100);
  }
  const player = turns ? current(turns) : null;
  const totalFrames = (turns?.players.length ?? 1) * setup.frames;

  useEffect(() => () => { alive.current = false; timers.current.forEach((id) => window.clearTimeout(id)); }, []);
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, still ? Math.min(ms, 300) : ms)); };

  function begin() {
    const players = solo ? [{ id: 'solo', name: t('mm.you'), kind: 'student' as const, colorIndex: 0, score: 0 }] : team.players;
    const state = startTurns(players);
    setT(state); setFrames(0); setMissed([]); setSheet({}); setBanner(null); alive.current = true;
    boost.current = { double: false, magnet: false, bumpers: false, mega: false };
    held.reset();
    setPhase('play');
    startFrame(state);
  }
  function startFrame(state: TurnState) {
    setStanding(fullRack()); setRoll(0); setArmed([]); setAim(0); setHook(0); frameKind.current = null;
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
  // A quick double tap never skips the spin meter (a K-3 habit).
  const lockedAt = useRef(0);
  function tapLane() {
    if (player?.kind === 'cpu' || twisting) return;
    if (performance.now() - lockedAt.current < 400) return;
    lockedAt.current = performance.now();
    // One tap throws (teacher, 2026-11-13: no meters in any game); the spin
    // is a little different every time, so no two throws are the same.
    const h = (Math.random() - 0.5) * 0.7;
    setHook(h);
    throwBall({ aim, hook: h });
  }
  useEffect(() => {
    if (phase !== 'play' || (step !== 'aim' && step !== 'spin') || player?.kind === 'cpu') return;
    const key = (e: KeyboardEvent) => {
      if (e.repeat || (e.target as HTMLElement | null)?.closest?.('button, input, select, textarea, [role="slider"], [role="dialog"]')) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); tapLane(); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); setAim((a) => Math.max(-0.92, Math.min(0.92, a + (e.key === 'ArrowLeft' ? -0.1 : 0.1)))); }
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
    if (kind) frameKind.current = kind === 'strike' ? 'X' : '/';
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
    const label = kind === 'strike' && run >= 3 ? t('sb.turkey') : kind === 'strike' && run === 2 ? t('sb.double') : text;
    setBanner({ id: Date.now(), text: points ? `${label} +${points}` : label, kind: kind ?? (res.gutter || down.length === 0 ? 'miss' : split ? 'split' : null) });
    if (kind) {
      playEffect('win', settings);
      if (settings.celebrations !== 'off' && !still) {
        void confetti({ particleCount: kind === 'strike' ? 140 : 70, spread: 100, origin: { y: 0.35 }, disableForReducedMotion: true });
        if (kind === 'strike') later(() => void confetti({ particleCount: 80, angle: 60, spread: 70, origin: { x: 0, y: 0.6 }, disableForReducedMotion: true }), 250);
        if (kind === 'strike') later(() => void confetti({ particleCount: 80, angle: 120, spread: 70, origin: { x: 1, y: 0.6 }, disableForReducedMotion: true }), 400);
      }
    } else if (!down.length) playEffect('miss', settings);
    afterBanner.current = () => {
      if (!alive.current) return;
      const now = turnsNow.current ?? scored;
      if (roll === 0 && left > 0) { setRoll(1); askFor(now, 1); }
      else endFrame(now);
    };
  }
  function endFrame(state: TurnState) {
    held.endTurn(); // unused power-ups are gone after the turn
    const me = current(state);
    const mark = frameKind.current ?? String(me.score);
    setSheet((s) => ({ ...s, [me.id]: [...(s[me.id] ?? []), { mark }] }));
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
  // It uses its power-ups first through the tray (each on a card the class
  // taps), thinks a moment (teacher, 2026-11-24), then throws.
  const cpuAim = phase === 'play' && step === 'aim' && player?.kind === 'cpu' && !held.held.length && !twisting && !banner;
  useEffect(() => {
    if (!cpuAim) return;
    const id = window.setTimeout(() => throwBall(cpuPlan()), (still ? 600 : CPU_THINK_MS) * pace(settings));
    return () => window.clearTimeout(id);
  }, [cpuAim, player?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => { const r = el.getBoundingClientRect(); const b = blockRef.current?.getBoundingClientRect(); setBox({ w: Math.max(320, r.width), h: Math.max(320, r.height), block: b ? b.bottom - r.top : 0 }); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (blockRef.current) ro.observe(blockRef.current);
    return () => ro.disconnect();
  }, [phase, !!turns]); // eslint-disable-line react-hooks/exhaustive-deps
  // Whose frame it is on their own sheet (0-based).
  const myFrame = player ? (sheet[player.id]?.length ?? 0) : 0;

  // A theme's own ball for player icon k (an older design's team icon or its
  // one Ball piece stand in). Classic balls are flat brand-color balls.
  const drawnBall = (k: number) => pieceImage(theme, `ball-${k + 1}`) ?? pieceImage(theme, `team-${k + 1}`) ?? pieceImage(theme, 'ball');
  const themedBallColor = pieceColor(theme, 'ball', '');
  const ballIcons = Array.from({ length: BALLS }, (_, k) => drawnBall(k) ?? (themedBallColor ? undefined : ballUrl(k)));
  const tray = <PowerUpTray manifest={bowlingManifest} items={held.held} onUse={applyItem} disabled={(step !== 'aim' && step !== 'spin') || twisting || !!banner} auto={player?.kind === 'cpu'} who={player?.name} />;
  const canAim = phase === 'play' && (step === 'aim' || step === 'spin') && player?.kind !== 'cpu' && !twisting;
  const pinColor = pieceColor(theme, 'pin', C.paper);
  const pinArt = pieceImage(theme, 'pin');
  const laneColor = pieceColor(theme, 'lane', C.peach);
  const bgArt = pieceImage(theme, 'background');
  const classic = theme.id.endsWith(':classic');
  const ballK = (player?.colorIndex ?? 0) % BALLS;
  const ballArt = drawnBall(ballK);
  const ballFill = themedBallColor || BALL_COLORS[ballK];
  // The stage: the alley fills the whole play space; the lane is measured to it.
  const portrait = box.w / box.h < 1.05;
  const many = (turns?.players.length ?? 1) > (portrait ? 6 : 5);
  const hN = portrait ? Math.min(box.w * 0.34, box.h * 0.3) : Math.min(box.w * 0.235, box.h * 0.42);
  const railY = portrait ? Math.min(box.h * 0.55, Math.max(box.h * 0.36, box.block + hN * 0.3 + 10)) : Math.round(box.h * 0.25);
  const A = alley(box.w, box.h, railY, portrait);
  const hwTop = A.edgeAt(A.top), hwBot = A.edgeAt(box.h);
  const gut = (hw: number) => hw * 0.24;
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
  // The dotted aim line from the ball toward the pins, with an arrowhead.
  const aimPts = Array.from({ length: 12 }, (_, k) => { const d = 0.07 + (k / 11) * 0.5; return [A.X(aim * 1.12, d), A.Y(d) - A.ballR * A.S(d) * 0.4] as const; });
  const [ax, ay] = aimPts[aimPts.length - 1], [bx, by] = aimPts[aimPts.length - 2];
  const ang = Math.atan2(ay - by, ax - bx), ah = hN * 0.07;
  const head = `M${ax + Math.cos(ang + 2.5) * ah} ${ay + Math.sin(ang + 2.5) * ah} L${ax} ${ay} L${ax + Math.cos(ang - 2.5) * ah} ${ay + Math.sin(ang - 2.5) * ah}`;
  const headY = A.Y(0.74);
  const pinH = (d: number) => A.HW(d) * 0.7;
  const drawPin = (k: number) => pinArt
    // A drawn pin always shows inside the pin's outline (teacher, 2026-11-02).
    ? <g transform={`scale(${(k * 200) / 11.3})`}><image href={pinArt} x={-1.8} y={-11} width={3.6} height={11.3} preserveAspectRatio="none" clipPath="url(#sb-pin-shape)" /></g>
    : <g transform={`scale(${k * 1.45} ${k})`}><ClassicPin fill={pinColor} k={k} /></g>;
  const meterLabel = t('sb.frame', { n: Math.min(myFrame + 1, setup.frames), total: setup.frames });
  const foulY = A.near + (box.h - A.near) * 0.5;
  const bannerTop = portrait ? A.top + (A.near - A.top) * 0.32 : box.h * 0.4;

  return (
    <ThemedPage theme={theme} menu={phase !== 'play' && phase !== 'end'}>
    <TeamArt.Provider value={ballIcons}>
    <main className={phase === 'play' || phase === 'end' ? '!p-0' : 'w-full px-4 sm:px-6 pt-6 pb-6'}>
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context="bowling" />
      {clock.element}
      {phase !== 'play' && phase !== 'end' && <GameTopRow hint="bowling" onSettings={() => setSettingsOpen(true)} />}
      {phase === 'welcome' && (
        <GameWelcome game={bowlingManifest} cover={pieceImage(theme, 'cover')} onStart={() => setPhase(themes.length > 1 ? 'theme' : 'setup')} steps={[
          { icon: <CheckCircle weight="fill" size={22} />, text: t('sb.how1') },
          { icon: <HandTap weight="fill" size={22} />, text: t('sb.how2') },
          { icon: <Trophy weight="fill" size={22} />, text: t('sb.how3') },
        ]} />
      )}
      {phase === 'theme' && <ThemeScreen gameName={bowlingManifest.name} current={theme} themes={themes} playable={playable} onChoose={choose} onBack={() => setPhase('welcome')} onNext={() => setPhase('setup')} />}
      {phase === 'setup' && (
        <SetupWizard onBack={() => setPhase(themes.length > 1 ? 'theme' : 'welcome')} onPlay={begin} share={teacher && !solo && setup.who !== 'versus' ? { gameId: 'bowling', setId } : undefined} pages={[
          // Pick the way to play first (teacher, 2026-10-31); students arrive with theirs set.
          ...(!teacher ? [] : [{ id: 'way', title: t('way.title'), content: <div className="grid gap-6"><WayToPlay modes={['share', 'versus', 'solo']} value={solo ? 'solo' : setup.who === 'versus' ? 'versus' : 'share'} onChange={(m) => change({ who: m === 'solo' ? 'solo' : m === 'versus' ? 'versus' : 'teams' })} />{!solo && setup.who !== 'versus' && <ShareHow />}</div> }]),
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
        // The approved alley (teacher, 2026-11-24): the lane is the hero, big and
        // centered; the player list at the left (in a row on top when the screen
        // is tall); held power-ups at the right; the frame meter alone on top.
        <div ref={stageRef} className={`relative play-fill overflow-hidden select-none ${shake ? 'cq-shake' : ''}`} style={bgArt ? pieceFill(theme, 'background', C.lavender) : undefined}>
          <h1 className="sr-only"><Title text={bowlingManifest.name} /></h1>
          <svg viewBox={`0 0 ${box.w} ${box.h}`} className="absolute inset-0 w-full h-full" role="img" aria-label={t('sb.board', { count: standing.filter(Boolean).length })}>
            <defs>
              <clipPath id="sb-pin-shape"><path d={PIN_OUTLINE} /></clipPath>
              {ballArt && <pattern id="sb-ball-art" patternContentUnits="objectBoundingBox" width="1" height="1"><image href={ballArt} width="1" height="1" preserveAspectRatio="xMidYMid slice" /></pattern>}
            </defs>
            <g style={{ transformOrigin: `${A.cx}px ${headY}px`, transform: sim?.zoom ? 'scale(1.14)' : 'scale(1)', transition: still ? 'none' : 'transform 0.45s ease-out' }}>
              {/* The alley wall: cream with cut-paper confetti (Classic); the floor is the stage color. */}
              {!bgArt && <rect x={-40} y={-40} width={box.w + 80} height={A.top + 40} fill={classic ? C.paper : theme.colors.surface} />}
              {!bgArt && classic && settings.backgrounds !== 'plain' && <WallConfetti w={box.w} h={A.top} calm={!!settings.calm} />}
              {/* Gutters, then the warm lane with its boards. */}
              {[-1, 1].map((sd) => <path key={sd} d={`M${A.cx + sd * hwTop} ${A.top} L${A.cx + sd * (hwTop + gut(hwTop))} ${A.top} L${A.cx + sd * (hwBot + gut(hwBot))} ${box.h + 4} L${A.cx + sd * hwBot} ${box.h + 4} Z`} fill={C.lavender} stroke={INK} strokeWidth={4} strokeLinejoin="round" />)}
              <path d={`M${A.cx - hwTop} ${A.top} L${A.cx + hwTop} ${A.top} L${A.cx + hwBot} ${box.h + 4} L${A.cx - hwBot} ${box.h + 4} Z`} fill={laneColor} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
              {BOARDS.map((u) => <path key={u} d={`M${A.cx + u * hwTop} ${A.top} L${A.cx + u * hwBot} ${box.h}`} stroke={C.orange} strokeWidth={2} opacity={0.55} />)}
              {/* Aim arrows in a V and a row of dots, like real lane marks, drawn our way. */}
              {[-0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6].map((u) => { const d = 0.3 - Math.abs(u) * 0.12; const x = A.cx + u * A.HW(d), y = A.Y(d), s = A.HW(d) * 0.06; return <path key={u} d={`M${x} ${y - s * 1.6} L${x + s} ${y + s} L${x - s} ${y + s} Z`} fill={C.orange} stroke={INK} strokeWidth={2} strokeLinejoin="round" />; })}
              {[-0.5, -0.25, 0, 0.25, 0.5].map((u) => <circle key={u} cx={A.cx + u * A.HW(0.1)} cy={A.Y(0.1)} r={A.HW(0.1) * 0.025} fill={C.orange} stroke={INK} strokeWidth={1.5} />)}
              <path d={`M${A.cx - A.edgeAt(foulY)} ${foulY} H${A.cx + A.edgeAt(foulY)}`} stroke={INK} strokeWidth={4} strokeLinecap="round" />
              {/* The Lemon rail across the back wall (Classic). */}
              {!bgArt && <rect x={-40} y={A.top - Math.max(7, box.h * 0.016)} width={box.w + 80} height={Math.max(10, box.h * 0.022)} fill={classic ? C.lemon : theme.colors.accent} stroke={INK} strokeWidth={3.5} />}
              {/* Bumper rails pop up when the power-up is on. */}
              {armed.includes('bumpers') && [-1, 1].map((sd) => <path key={sd} d={`M${A.cx + sd * (hwTop + gut(hwTop) * 0.5)} ${A.top} L${A.cx + sd * (hwBot + gut(hwBot) * 0.5)} ${box.h}`} stroke={C.teal} strokeWidth={Math.max(6, hN * 0.05)} strokeLinecap="round" className={still ? '' : 'sb-pop'} />)}
              {canAim && <>
                <polyline points={aimPts.map(([x, y]) => `${x},${y}`).join(' ')} fill="none" stroke={INK} strokeWidth={Math.max(4, hN * 0.02)} strokeDasharray={`1 ${Math.max(10, hN * 0.05)}`} strokeLinecap="round" />
                <path d={head} fill="none" stroke={INK} strokeWidth={Math.max(4, hN * 0.02)} strokeLinecap="round" strokeLinejoin="round" className={still ? '' : 'cq-glow'} />
              </>}
              {swept && !still && (
                <g key={swept.id}>
                  {swept.pins.map((p) => (
                    <g key={p.i} transform={`translate(${A.X(p.laneX, p.d)} ${A.Y(p.d)})`}>
                      <g className="sb-swept"><g transform="rotate(85)">{drawPin(pinH(p.d) / 200)}</g></g>
                    </g>
                  ))}
                  {/* The sweep bar drops in front of the pins and pulls them back into the pit. */}
                  <rect className="sb-bar" x={A.cx - A.HW(0.6) - 8} y={A.Y(0.6) - hN * 0.05} width={(A.HW(0.6) + 8) * 2} height={hN * 0.05} rx={4} fill={C.grape} stroke={INK} strokeWidth={3} />
                </g>
              )}
              {pinsNow.map((p) => {
                const k = pinH(p.d) / 200;
                const fallen = p.tilt >= 1;
                const lean = p.tilt * 85 * p.dir;
                const wob = sim?.wobble && sim.res.wobbled.includes(p.i);
                const toppling = wob && sim!.res.down.includes(p.i);
                return (
                  <g key={p.i} transform={`translate(${A.X(p.laneX, p.d)} ${A.Y(p.d)})`} opacity={fallen ? 0.9 : 1}>
                    <ellipse cx={0} cy={0} rx={30 * k * 1.45} ry={8 * k * 1.45} fill={INK} opacity={0.22} />
                    <g transform={`rotate(${lean})`}><g className={wob && !still ? (toppling ? 'sb-topple' : 'sb-wobble') : ''}>{drawPin(k)}</g></g>
                  </g>
                );
              })}
              {/* The ball: it spins as it rolls, shrinks into the distance, glows when powered up. */}
              {!ballGone && (step !== 'result' || !!sim) && (() => {
                const r = A.ballR * A.S(ballNow.d) * (big ? 2.1 : 1);
                const rot = frame ? frame.t * 900 : 0;
                return (
                  <g transform={`translate(${A.X(ballNow.laneX, ballNow.d)} ${A.Y(ballNow.d) - r})`}>
                    <ellipse cx={0} cy={r * 0.92} rx={r * 0.9} ry={r * 0.22} fill={INK} opacity={0.25} />
                    <g className={canAim && !still ? 'sb-ready' : ''}><g transform={`scale(${r / 50})`}>
                      {(armed.includes('double') || armed.includes('magnet') || big) && <circle r={70} fill="none" stroke={armed.includes('magnet') ? C.pink : C.lemon} strokeWidth={12} opacity={0.9} className={still ? '' : 'cq-glow'} />}
                      {ballArt ? <g transform={`rotate(${rot})`}><circle r={47} fill="url(#sb-ball-art)" stroke={INK} strokeWidth={6} /></g> : <FlatBall color={ballFill} spin={rot} />}
                    </g></g>
                  </g>
                );
              })()}
            </g>
          </svg>
          {/* Tap the lane to throw; the aim line follows the finger or mouse (no caption, teacher 2026-11-13). */}
          {canAim && !still && (
            <div className="absolute z-[5] cursor-pointer" role="button" aria-label={t('sb.tapThrow')} onClick={tapLane}
              style={{ left: A.cx - hwBot - gut(hwBot), width: (hwBot + gut(hwBot)) * 2, top: A.top - hN * 0.3, bottom: 0 }}
              onPointerMove={(e) => { const r = e.currentTarget.parentElement!.getBoundingClientRect(); const x = e.clientX - r.left, y = e.clientY - r.top; setAim(Math.max(-0.92, Math.min(0.92, ((x - A.cx) / A.edgeAt(Math.max(A.top, y))) * (1.25 / 1.12)))); }} />
          )}
          {/* The frame meter alone in the top strip; the tools at the right, in one order: Hint, Settings, Full screen, Close. */}
          <div className={`absolute z-10 pointer-events-none flex justify-center ${box.w < 640 ? 'inset-x-3 top-[3.75rem]' : 'left-1/2 -translate-x-1/2 top-[0.95rem]'}`}>
            <Meter segments={setup.frames} done={Math.min(myFrame, setup.frames)} part={roll === 1 ? 0.6 : 0.3} width={box.w < 640 ? '100%' : portrait ? '16rem' : '20rem'} label={meterLabel} />
          </div>
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-30 [&_button]:!w-11 [&_button]:!h-11">
            <HintButton gameId="bowling" />
            <GearButton small onClick={() => setSettingsOpen(true)} />
            <FullScreenButton small />
            <CloseGameButton />
          </div>
          {/* Players (left, or a row on top on tall screens) with held power-ups at the right or under them. */}
          <div ref={blockRef} className={portrait ? `absolute inset-x-3 z-20 grid justify-items-center gap-2.5 ${box.w < 640 ? 'top-[5.6rem]' : 'top-[4.4rem]'}` : `absolute left-4 top-[4.4rem] z-20 ${many ? 'w-[13rem]' : 'w-[15rem]'}`}>
            <BowlCards players={turns.players} now={player?.id ?? null} sheet={sheet} frames={setup.frames} frame={myFrame} compact={many || (portrait && box.w < 640)} row={portrait} playing={phase === 'play'} still={still} />
            {portrait && <div className={setup.powerUps ? 'min-h-[6.5rem]' : ''}>{tray}</div>}
          </div>
          {!portrait && <div className="absolute right-4 top-[4.6rem] z-20 w-[6.5rem]">{tray}</div>}
          {armed.length > 0 && (
            <div className="absolute inset-x-0 flex justify-center gap-1.5 flex-wrap pointer-events-none z-10" style={{ top: A.near - A.ballR * (big ? 4.6 : 2.6) - 40 }}>
              {armed.map((a, i) => <span key={i} className="rounded-pill border-std border-border bg-[var(--butter)] px-3 py-0.5 text-sm font-bold" style={{ boxShadow: `0 3px 0 ${INK}` }}>{bowlingManifest.items?.abilities.find((x) => x.id === a)?.label}</span>)}
            </div>
          )}
          {/* With Motion off, sliders set the aim and spin, then Throw. */}
          {still && canAim && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-[min(34rem,92%)] grid grid-cols-[1fr_1fr_auto] gap-2 items-end rounded-[1.25rem] p-3" style={{ background: 'var(--paper)', border: `3px solid ${INK}`, boxShadow: `0 4px 0 ${INK}` }}>
              <Slider label={t('sb.aim')} min={-9} max={9} value={Math.round(aim * 10)} onChange={(v) => setAim(v / 10)} show={(v) => (v === 0 ? t('sb.middle') : v < 0 ? t('sb.leftN', { n: -v }) : t('sb.rightN', { n: v }))} />
              <Slider label={t('sb.spin')} min={-10} max={10} value={Math.round(hook * 10)} onChange={(v) => setHook(v / 10)} show={(v) => (v === 0 ? t('sb.straight') : v < 0 ? t('sb.leftN', { n: -v }) : t('sb.rightN', { n: v }))} />
              <button type="button" onClick={() => throwBall({ aim, hook })} className="min-h-14 px-5 rounded-pill border-bold border-border bg-accent font-display text-xl">{t('sb.throw')}</button>
            </div>
          )}
          <AnimatePresence>
            {twisting && <motion.span key="tw" aria-hidden="true" className="absolute left-1/2 pointer-events-none z-20" style={{ top: A.top - hN * 0.5, width: hN * 0.9, marginLeft: -hN * 0.45 }} initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1, rotate: still ? 0 : [0, -15, 15, -10, 0] }} exit={{ opacity: 0, scale: 0.4 }} transition={{ duration: 0.9 }} ><CrayonPowerUp id="tornado" size={Math.round(hN * 0.9)} /></motion.span>}
            {banner && (
              // Every result pops up in the center on the top layer (teacher, 2026-11-06): a flat Grow Year pill.
              <motion.p key={banner.id} className="absolute inset-x-0 z-30 flex justify-center pointer-events-none px-4" style={{ top: bannerTop }}
                initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0, scale: 1.15 }} transition={still ? { duration: 0.01 } : { type: 'spring', stiffness: 320, damping: 14 }} role="status">
                <span className={`inline-flex items-center text-center px-6 py-2.5 rounded-full leading-none ${banner.kind === 'strike' ? 'text-5xl sm:text-6xl' : 'text-4xl sm:text-5xl'}`}
                  style={{ ...GY, background: banner.kind === 'strike' ? C.lemon : banner.kind === 'spare' ? 'var(--blue-crystal)' : banner.kind === 'miss' ? C.paper : 'var(--butter)', border: `3px solid ${INK}`, boxShadow: `0 5px 0 ${INK}` }}>{banner.text}</span>
              </motion.p>
            )}
            {banner && <motion.div key={`ok-${banner.id}`} className="absolute inset-x-0 z-30 flex justify-center" style={{ top: `calc(${bannerTop}px + 6.5rem)` }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: still ? 0.01 : 0.4, delay: still ? 0 : 0.4 }}><TapOk onTap={closeBanner} label={t('tap.goOn')} /></motion.div>}
            {cpuAim && player && <motion.p key="think" className="absolute inset-x-0 z-30 text-center pointer-events-none" style={{ top: box.h * 0.42 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="status"><span className="font-display text-2xl sm:text-3xl bg-surface border-heavy border-border rounded-pill px-5 py-1.5">{t('cpu.thinking', { name: player.name })}</span></motion.p>}
          </AnimatePresence>
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
