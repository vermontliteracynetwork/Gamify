import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowsDownUp, Eye, HandSwipeRight, Lightning, Question } from '@phosphor-icons/react';
import HintButton from '../../engine/HintButton';
import { impact } from '../../engine/impact';
import { useMySets } from '../../data/hooks';
import { LIBRARY } from '../../data/library';
import { buzz, playEffect } from '../../engine/feedback';
import { playClip } from '../../engine/music';
import ResultsModal from '../../engine/ResultsModal';
import { usePlayClock } from '../../engine/playClock';
import { useAsk } from '../../engine/useAsk';
import { t } from '../../i18n';
import { FullScreenButton, GameTopRow, GearButton, SettingsPanel } from '../../settings/SettingsPanel';
import CloseGameButton from '../../engine/CloseGameButton';
import { useSettings } from '../../settings/SettingsContext';
import { ChoiceRow, Slider } from '../../ui/fields';
import GameWelcome from '../GameWelcome';
import SetPicker from '../SetPicker';
import SetupWizard from '../SetupWizard';
import ThemeScreen from '../ThemeScreen';
import WayToPlay from '../WayToPlay';
import { useSavedSetup } from '../useSavedSetup';
import { usePowerUps } from '../../engine/usePowerUps';
import { powerUpSwitches } from '../../engine/PowerUpSwitches';
import { PowerUpTray, roleOf, useHeldPowerUps } from '../../engine/HeldPowerUps';
import { Doodle, type DoodleKind } from '../../brand/CrayonKit';
import { PATTERNS } from '../../brand/PatternProposal';
import { useStageColor } from '../../theme/stageColor';
import ItemArt from '../../theme/ItemArt';
import type { GameTheme, ThemeItem } from '../../theme/types';
import { allowedItem } from '../../engine/powerUps';
import { useGamePool } from '../../student/session';
import { pieceFill, pieceImage } from '../../theme/library';
import { ThemedPage, useGameTheme } from '../../theme/useGameTheme';
import { useSignedIn } from '../../auth/session';
import { makeGameCode } from '../../data/gameCodes';
import type { PlayMode } from '../../data/types';
import ClassPlayOptions, { classPlayQuery, DEFAULT_CLASS_PLAY, type ClassPlay } from '../../live/ClassPlay';
import { getLive, liveScore, useLiveRoom } from '../../live/session';
import { googlerManifest } from './manifest';
import { CrayonBlock, EYES, GooglyEye, INK } from './art';
import { chooseSpots, clearRows, COLS, createBoard, fullRows, newBlock, place, pushRow, risingRow, ROWS, SHAPES, squish, xpFor, type Block, type Board, type Spot } from './googler';

// Googler (teacher, 2026-11-26): "like tetris, however, it should start out
// with a halfway filled board and rows should appear after each turn from
// the bottom (pushing all other rows up). 1:1 googly eyes will be placed
// sporadically in the blocks. from the top, players will place a block ...
// by swiping or using arrows or w/a/s/d keys. unlike tetris, players cannot
// freely choose ... where they place the block, but instead have three
// choices. a power up will be extra choices, giving the player five placement
// options. when a row with a googly eye is cleared, it should have an
// animation motion which places into the once empty circle spot on a
// counter. a setting for when the game ends can be # of googly eyes
// collected, also time or xp. xp is gained both by collecting googly eyes and
// rows cleared." Then (same day): "i want the blocks to be tetris shapped,
// some power ups should be 1:1 placed with transparent background in the
// block stacks like the googly eyes and can be played when the row is cleared".

type Phase = 'welcome' | 'theme' | 'setup' | 'play' | 'end';
type EndBy = 'eyes' | 'time' | 'xp';
const pattern = (id: string, calm: boolean) => PATTERNS.find((p) => p.id === id)!.make(calm);
const CLEAR_WORDS = ['gg.clear1', 'gg.clear2', 'gg.clear3', 'gg.clear4'] as const;
const SPARK_KINDS: DoodleKind[] = ['sparkle', 'star', 'dot', 'heart'];
const SND = '/sounds/board/';
const clock = (ms: number) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

export default function Googler() {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const { theme, themes, playable, choose } = useGameTheme('googler');
  const { teacher } = useSignedIn();
  const navigate = useNavigate();
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const [setup, change] = useSavedSetup('googler', { setId: LIBRARY[0].id, drops: 4, perBreak: 1, endBy: 'eyes' as EndBy, eyeGoal: 12, minutes: 5, xpGoal: 500, powerUps: true, powerOff: [] as string[] });
  const setId = sets.some((s) => s.id === setup.setId) ? setup.setId : LIBRARY[0].id;
  const chosen = useMemo(() => sets.filter((s) => s.id === setId).map((set) => ({ set, starred: false })), [sets, setId]);
  const game = useGamePool(chosen);
  const { ask, cancel, asking, element, missed } = useAsk({ gameId: 'googler', mode: 'solo', pool: game.pool, classroomId: game.classroomId, studentId: game.studentId });
  const [way, setWay] = useState<PlayMode>('solo');
  const [classPlay, setClassPlay] = useState<ClassPlay>({ ...DEFAULT_CLASS_PLAY, goal: 40 });
  // The teacher's game settings ride along to every student (Claudia, 2026-11-26).
  async function openLive() { const q = new URLSearchParams({ drops: String(setup.drops), per: String(setup.perBreak), pu: setup.powerUps ? '1' : '0', off: (setup.powerOff ?? []).join(',') }); navigate(`/teacher/live/${(await makeGameCode('googler', setId, 'live')).code}?${classPlayQuery(classPlay)}&${q}`); }
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('welcome');
  const live = !!getLive();
  // In Live, the teacher's drops, questions and power-up switches come from the room.
  const room = useLiveRoom();
  const opt = live ? room.state?.options : undefined;
  const puOn = opt ? opt.pu !== '0' : setup.powerUps;
  const puOff = opt ? (opt.off ? opt.off.split(',') : []) : setup.powerOff ?? [];
  const plan = useRef({ drops: 4, perBreak: 1, endBy: 'eyes' as EndBy | 'live', eyeGoal: 12, minutes: 5, xpGoal: 500 });

  const [board, setBoardState] = useState<Board>(() => createBoard(Math.random));
  const boardNow = useRef(board);
  const setBoard = (b: Board) => { boardNow.current = b; setBoardState(b); };
  const [block, setBlock] = useState<Block>(() => newBlock(Math.random));
  const [spots, setSpots] = useState<Spot[]>([]);
  const [sel, setSel] = useState(0);
  const [busy, setBusyState] = useState(false);
  const busyNow = useRef(false);
  const setBusy = (b: boolean) => { busyNow.current = b; setBusyState(b); };
  const [xp, setXp] = useState(0);
  const xpNow = useRef(0);
  const [eyes, setEyes] = useState(0);
  const eyesNow = useRef(0);
  // Eyes already on their way to the counter (they count when they land).
  const eyesFlying = useRef(0);
  const [dropsLeft, setDropsLeft] = useState(4);
  const [falling, setFalling] = useState<{ id: number; block: Block; spot: Spot } | null>(null);
  const [popping, setPopping] = useState<Set<number>>(new Set());
  const [flash, setFlash] = useState<number[]>([]);
  const [sparks, setSparks] = useState<{ id: number; row: number; col: number; color: string }[]>([]);
  const [callout, setCallout] = useState<{ id: number; text: string; y: number } | null>(null);
  type Pt = { x: number; y: number };
  const [flights, setFlights] = useState<{ id: number; eye: number; from: Pt; mid: Pt; to: Pt; size: number }[]>([]);
  const [announce, setAnnounce] = useState<{ id: number; item: ThemeItem } | null>(null);
  const [note, setNote] = useState('');
  const [shake, setShake] = useState(0);
  const boosts = useRef({ choices: 0, freeze: 0, double: false });
  const [boostView, setBoostView] = useState({ choices: 0, freeze: 0, double: false });
  const syncBoosts = () => setBoostView({ ...boosts.current });
  const [endsAt, setEndsAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const phaseNow = useRef<Phase>('welcome');
  phaseNow.current = phase;
  const timers = useRef<number[]>([]);
  const wait = (ms: number) => new Promise<void>((r) => { timers.current.push(window.setTimeout(r, still ? Math.min(ms, 60) : ms)); });
  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);

  // Power-ups: held ones come from right answers (the tray, as in every solo
  // game); stack ones sit in the blocks and go off when their row clears.
  const powers = usePowerUps(googlerManifest, theme, puOn, puOff);
  const held = useHeldPowerUps();
  const stackItems = useMemo(() => (puOn ? (theme.items?.length ? theme.items : googlerManifest.items!.classic).filter((it) => !puOff.includes(it.id) && allowedItem(it)) : []), [theme, puOn, puOff.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  const itemFor = (roll: number) => (stackItems.length ? stackItems[roll % stackItems.length] : undefined);
  const amount = (it: ThemeItem) => powers.amount(it);

  // The board's size in pixels: cells, flights and stack power-ups use it.
  const gridRef = useRef<HTMLDivElement>(null);
  const [cellPx, setCellPx] = useState(40);
  useLayoutEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setCellPx(el.clientWidth / COLS));
    ro.observe(el);
    return () => ro.disconnect();
  }, [phase]);
  const slotRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const end = plan.current.endBy;
  const slots = end === 'eyes' ? plan.current.eyeGoal : 10;
  const filledSlots = end === 'eyes' ? Math.min(eyes, slots) : eyes % 10;
  const sheets = end === 'eyes' ? 0 : Math.floor(eyes / 10);

  function nextTurn(b: Board) {
    const nb = newBlock(Math.random);
    const n = boosts.current.choices > 0 ? 5 : 3;
    let s = chooseSpots(b, nb, n, Math.random);
    if (!s.length) {
      // No room for the block: squish the top away (funny, never game over).
      b = squish(b);
      setBoard(b);
      say(t('gg.squish'), 0.3);
      setShake((k) => k + 1);
      playClip(`${SND}wind.mp3`, settings, 0.5);
      s = chooseSpots(b, nb, n, Math.random);
    }
    setBlock(nb);
    setSpots(s);
    // Start on the best spot's neighbor half the time, so the pick is the player's.
    setSel(Math.floor(Math.random() * s.length));
  }

  function start() {
    plan.current = live
      ? { drops: Math.min(10, Math.max(2, Number(opt?.drops) || googlerManifest.rounds!.default)), perBreak: Math.min(5, Math.max(1, Number(opt?.per) || 1)), endBy: 'live', eyeGoal: 10, minutes: 0, xpGoal: 0 }
      : { drops: setup.drops, perBreak: setup.perBreak, endBy: setup.endBy, eyeGoal: setup.eyeGoal, minutes: setup.minutes, xpGoal: setup.xpGoal };
    // No flight or pause from an earlier game may land in this one.
    timers.current.forEach((id) => window.clearTimeout(id)); timers.current = [];
    const b = createBoard(Math.random);
    setBoard(b);
    xpNow.current = 0; eyesNow.current = 0; eyesFlying.current = 0;
    setXp(0); setEyes(0); setDropsLeft(plan.current.drops); setNote(''); setFlights([]); setPopping(new Set()); setFalling(null);
    boosts.current = { choices: 0, freeze: 0, double: false }; syncBoosts();
    held.reset();
    setEndsAt(Date.now() + plan.current.minutes * 60000); setNow(Date.now());
    setBusy(false);
    nextTurn(b);
    setPhase('play');
    if (live) liveScore(0);
  }
  // In a live game the teacher already chose everything: students go straight in.
  const liveStart = useRef(false);
  useEffect(() => { if (live && !liveStart.current && phase === 'welcome' && game.pool.length && room.state) { liveStart.current = true; start(); } }); // eslint-disable-line react-hooks/exhaustive-deps

  function finish() {
    if (phaseNow.current !== 'play') return;
    phaseNow.current = 'end';
    setPhase('end');
    playEffect('win', settings);
    impact(settings, true);
    if (settings.celebrations !== 'off' && !still) void confetti({ particleCount: settings.celebrations === 'big' ? 140 : 60, spread: 80, origin: { y: 0.6 }, disableForReducedMotion: true });
  }
  const goalMet = () => (end === 'eyes' && eyesNow.current >= plan.current.eyeGoal) || (end === 'xp' && xpNow.current >= plan.current.xpGoal);
  const timeLeft = end === 'time' ? Math.max(0, endsAt - now) : null;
  useEffect(() => {
    if (phase !== 'play' || end !== 'time') return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [phase, end]);
  useEffect(() => { if (timeLeft === 0 && phase === 'play') { if (asking) cancel(); finish(); } }); // eslint-disable-line react-hooks/exhaustive-deps
  const playClockEl = usePlayClock({ playing: phase === 'play', score: xp, onTimeUp: () => { if (asking) cancel(); finish(); } });
  // Every await in a turn checks this: the game may have ended meanwhile.
  const over = () => phaseNow.current !== 'play';

  function addXp(n: number) {
    if (!n) return;
    xpNow.current += n;
    setXp(xpNow.current);
    if (end === 'xp' && xpNow.current >= plan.current.xpGoal) finish();
  }
  function say(text: string, y = 0.4) { setCallout({ id: Date.now() + Math.random(), text, y }); }

  // An eye leaves its block and flies in an arc into the next empty circle
  // on the counter; it counts (and the circle pops) when it lands.
  function flyEyes(list: { row: number; col: number; eye: number }[]) {
    const grid = gridRef.current?.getBoundingClientRect();
    if (!grid || !list.length) return;
    const base = eyesNow.current + eyesFlying.current;
    eyesFlying.current += list.length;
    // The whole arc is worked out once here, so a re-render never restarts a flight (Claudia, 2026-11-26).
    const made = list.map((e, i) => {
      const slot = base + i;
      const idx = end === 'eyes' ? Math.min(slot, slots - 1) : slot % 10;
      const r = slotRefs.current[idx]?.getBoundingClientRect();
      const from = { x: grid.left + ((e.col + 0.5) / COLS) * grid.width, y: grid.top + ((e.row + 0.5) / ROWS) * grid.height };
      const to = r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: window.innerWidth / 2, y: 40 };
      const mid = { x: (from.x + to.x) / 2 + (Math.random() - 0.5) * 80, y: Math.min(from.y, to.y) - 90 - Math.random() * 60 };
      return { id: Date.now() + Math.random() + i, eye: e.eye, from, mid, to, size: Math.max(28, cellPx * 0.8) };
    });
    setFlights((f) => [...f, ...made]);
    // Each eye counts when its flight ends, on a timer of the flight's own
    // length (the animation's end callback can be skipped by a re-render).
    made.forEach((f, i) => timers.current.push(window.setTimeout(() => landEye(f.id), (still ? 150 : 950) + i * 90)));
  }
  function landEye(id: number) {
    if (phaseNow.current !== 'play' && phaseNow.current !== 'end') return;
    setFlights((f) => f.filter((x) => x.id !== id));
    eyesFlying.current = Math.max(0, eyesFlying.current - 1);
    eyesNow.current += 1;
    setEyes(eyesNow.current);
    playEffect('blip', settings, undefined, 1 + (eyesNow.current % 6) * 0.06);
    buzz(15, settings);
    if (live) liveScore(eyesNow.current);
    if (goalMet()) finish();
  }
  const flightsDone = async () => { for (let k = 0; k < 40 && eyesFlying.current > 0; k++) await wait(60); };

  // Pop full rows, again and again while more fill (a row zapped by a power
  // can bring down more). Eyes fly, stack power-ups go off after.
  async function resolve(b: Board, forced: number[] = []): Promise<Board> {
    let first = true;
    for (let loop = 0; loop < 8 && !over(); loop++) {
      const rows = first && forced.length ? [...new Set([...forced, ...fullRows(b)])] : fullRows(b);
      first = false;
      if (!rows.length) break;
      const res = clearRows(b, rows);
      const ids = new Set(rows.flatMap((r) => b[r].filter(Boolean).map((x) => x!.id)));
      setFlash(rows);
      setPopping(ids);
      if (!still) setSparks(rows.flatMap((r) => b[r].map((x, c) => ({ id: Date.now() + r * 100 + c + Math.random(), row: r, col: c, color: x ? SHAPES[x.shape].color : '#fabe37' }))));
      const mult = boosts.current.double ? 2 : 1;
      if (boosts.current.double) { boosts.current.double = false; syncBoosts(); }
      const gained = xpFor(rows.length, res.eyes.length) * mult;
      const word = res.eyes.length ? t('gg.eyeWord') : t(CLEAR_WORDS[Math.min(rows.length, 4) - 1]);
      say(`${word} +${gained} XP`, Math.min(...rows) / ROWS);
      playEffect(rows.length >= 2 || res.eyes.length ? 'win' : 'right', settings, undefined, 1 + Math.min(rows.length - 1, 3) * 0.1);
      if (rows.length >= 2) impact(settings, rows.length >= 3);
      buzz(rows.length >= 2 ? 45 : 25, settings);
      await wait(260);
      flyEyes(res.eyes);
      await wait(260);
      addXp(gained);
      b = res.board;
      setPopping(new Set()); setFlash([]);
      setBoard(b);
      await wait(380);
      setSparks([]);
      // Power-ups caught in the cleared rows go off now, one after another.
      for (const p of res.powers) {
        const it = itemFor(p.power);
        if (it) b = await firePower(it, b, true);
      }
    }
    return b;
  }

  // What each power-up does (its Classic role; themes dress it up).
  async function firePower(it: ThemeItem, b: Board, fromStack: boolean): Promise<Board> {
    setAnnounce({ id: Date.now(), item: it });
    playEffect('win', settings);
    if (it.ability === 'magnet') playClip(`${SND}magnet.mp3`, settings, 0.6);
    if (it.ability === 'shuffle') playClip(`${SND}wind.mp3`, settings, 0.6);
    if (it.ability === 'blast') impact(settings, true);
    await wait(1300);
    setAnnounce(null);
    switch (it.ability) {
      case 'choices': {
        boosts.current.choices += amount(it); syncBoosts();
        if (!fromStack) setSpots(chooseSpots(b, block, 5, Math.random));
        break;
      }
      case 'freeze': boosts.current.freeze += amount(it); syncBoosts(); break;
      case 'double': boosts.current.double = true; syncBoosts(); break;
      case 'shuffle': if (!fromStack) nextTurn(b); else boosts.current.choices += 1; syncBoosts(); break;
      case 'magnet': {
        // The highest eyes in the stack wiggle loose and fly to the counter.
        const found: { row: number; col: number; eye: number }[] = [];
        b.forEach((row, r) => row.forEach((x, c) => { if (x?.eye !== undefined) found.push({ row: r, col: c, eye: x.eye }); }));
        const take = found.slice(0, amount(it));
        if (take.length) {
          flyEyes(take);
          b = b.map((row, r) => row.map((x, c) => (x && take.some((e) => e.row === r && e.col === c) ? { id: x.id, shape: x.shape, ...(x.power !== undefined ? { power: x.power } : {}) } : x)));
          setBoard(b);
          addXp(take.length * 15);
          await wait(500);
        } else say(t('gg.noEyes'));
        break;
      }
      case 'blast': {
        setShake((k) => k + 1);
        b = await resolve(b, [ROWS - 1].filter((r) => b[r].some(Boolean)));
        break;
      }
    }
    return b;
  }

  async function spendHeld(i: number) {
    if (busyNow.current || phase !== 'play') return;
    const it = held.use(i);
    if (!it) return;
    setBusy(true);
    const b = await firePower(it, boardNow.current, false);
    if (over()) { setBusy(false); return; }
    if (it.ability === 'blast' || it.ability === 'magnet') { setSpots(chooseSpots(b, block, boosts.current.choices > 0 ? 5 : 3, Math.random)); setSel(0); }
    await flightsDone();
    setBusy(false);
    if (goalMet()) finish();
  }

  // Drop the block on the picked spot: it falls with weight, lands with a
  // squash, full rows pop, then a new row pushes up from the bottom.
  async function drop(index = sel) {
    if (busyNow.current || phase !== 'play' || !spots[index]) return;
    const spot = spots[index];
    setBusy(true);
    setNote('');
    playEffect('whoosh', settings);
    setFalling({ id: Date.now(), block, spot });
    await wait(260 + spot.row * 38);
    let b = place(boardNow.current, block, spot);
    setFalling(null);
    setBoard(b);
    playClip(`${SND}jump.mp3`, settings, 0.45);
    buzz(12, settings);
    await wait(170);
    if (over()) { setBusy(false); return; }
    // Only a boost that was on for THIS drop is used up (one won in this drop's rows waits for the next).
    const hadChoices = boosts.current.choices > 0;
    b = await resolve(b);
    if (over()) { setBusy(false); return; }
    if (hadChoices && boosts.current.choices > 0) { boosts.current.choices -= 1; syncBoosts(); }
    // A new row rises from the bottom, unless Freeze holds it back.
    if (boosts.current.freeze > 0) {
      boosts.current.freeze -= 1; syncBoosts();
      say(t('gg.frozen'), 0.85);
      await wait(400);
    } else {
      const pushed = pushRow(b, risingRow(COLS, Math.random));
      b = pushed.board;
      setBoard(b);
      playEffect('swipe', settings);
      await wait(420);
      if (pushed.spilled) {
        b = squish(b);
        setShake((k) => k + 1);
        say(t('gg.squish'), 0.3);
        playClip(`${SND}wind.mp3`, settings, 0.5);
        setBoard(b);
        await wait(500);
      }
    }
    await flightsDone();
    if (over()) { setBusy(false); return; }
    if (goalMet() || (end === 'time' && Date.now() >= endsAt)) { setBusy(false); finish(); return; }
    const left = dropsLeft - 1;
    if (left <= 0) {
      // A question break: right answers can bring a power-up for the tray.
      setNote(t('gg.answerToGo'));
      held.endTurn();
      await wait(450);
      if (over()) { setBusy(false); return; }
      const done = await ask({ count: plan.current.perBreak });
      setNote('');
      if (over()) { setBusy(false); return; }
      if (!done && end === 'time' && Date.now() >= endsAt) { setBusy(false); finish(); return; }
      const it = powers.grant(true);
      if (it) held.earn('solo', it);
      held.beginTurn('solo');
      setDropsLeft(plan.current.drops);
    } else setDropsLeft(left);
    nextTurn(b);
    setBusy(false);
  }

  function step(d: number) {
    if (busyNow.current || !spots.length) return;
    setSel((s) => (s + d + spots.length) % spots.length);
    playEffect('tap', settings);
  }
  // Arrows or W A S D: left and right (or up) pick the spot, down drops.
  useEffect(() => {
    if (phase !== 'play') return;
    const on = (e: KeyboardEvent) => {
      if (asking || settingsOpen || e.target instanceof HTMLInputElement) return;
      const k = e.key.toLowerCase();
      if (k === 'arrowleft' || k === 'a') { e.preventDefault(); step(-1); }
      else if (k === 'arrowright' || k === 'd' || k === 'arrowup' || k === 'w') { e.preventDefault(); step(1); }
      else if (k === 'arrowdown' || k === 's' || k === ' ' || k === 'enter') { if (k === 'enter' && (e.target as HTMLElement)?.tagName === 'BUTTON') return; e.preventDefault(); void drop(); }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  });
  // Swipe on the board: sideways picks the spot, down drops; a tap on a spot picks it, a tap on the picked one drops.
  const swipe = useRef<{ x: number; y: number } | null>(null);
  function onPointerUp(e: React.PointerEvent) {
    const s = swipe.current;
    swipe.current = null;
    if (!s || !gridRef.current) return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 28) {
      if (Math.abs(dx) > Math.abs(dy)) step(dx > 0 ? 1 : -1);
      else if (dy > 0) void drop();
      return;
    }
    const r = gridRef.current.getBoundingClientRect();
    const col = Math.floor(((e.clientX - r.left) / r.width) * COLS), row = Math.floor(((e.clientY - r.top) / r.height) * ROWS);
    const inSpot = (sp: Spot) => sp.cells.some(([rr, cc]) => sp.row + rr === row && sp.col + cc === col);
    // The picked spot is drawn on top, so a tap on it always drops it (Claudia, 2026-11-26).
    const hit = spots[sel] && inSpot(spots[sel]) ? sel : spots.findIndex(inSpot);
    const byCol = hit >= 0 ? hit : spots.findIndex((sp) => sp.cells.some(([, cc]) => sp.col + cc === col));
    if (byCol < 0) return;
    if (byCol === sel) void drop(byCol); else { setSel(byCol); playEffect('tap', settings); }
  }

  const spot = spots[sel];
  const blockArt = (shape: number) => pieceImage(theme, `block-${SHAPES[shape].id}`);
  const loop = settings.motion === 'full';

  return (
    <ThemedPage theme={theme} menu={phase !== 'play' && phase !== 'end'}>
    <main className={phase === 'play' || phase === 'end' ? '!p-0' : 'w-full px-4 sm:px-6 pt-6 pb-6'}>
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context="googler" />
      {playClockEl.element}
      {phase === 'play' || phase === 'end' ? <h1 className="sr-only">{t('gg.title')}</h1> : <GameTopRow hint="googler" onSettings={() => setSettingsOpen(true)} />}

      {phase === 'welcome' && (
        <GameWelcome game={googlerManifest} onStart={() => setPhase(themes.length > 1 ? 'theme' : 'setup')} steps={[
          { icon: <HandSwipeRight weight="bold" size={22} />, text: t('gg.how1') },
          { icon: <ArrowsDownUp weight="bold" size={22} />, text: t('gg.how2') },
          { icon: <Eye weight="fill" size={22} />, text: t('gg.how3') },
          { icon: <Lightning weight="fill" size={22} />, text: t('gg.how4') },
          { icon: <Question weight="bold" size={22} />, text: t('gg.how5') },
        ]} />
      )}

      {phase === 'theme' && (
        <ThemeScreen gameName={googlerManifest.name} current={theme} themes={themes} playable={playable} onChoose={choose} onBack={() => setPhase('welcome')} onNext={() => setPhase('setup')} />
      )}

      {phase === 'setup' && (
        <SetupWizard onBack={() => setPhase(themes.length > 1 ? 'theme' : 'welcome')} onPlay={way === 'live' ? () => void openLive() : start} playLabel={way === 'live' ? t('way.openLobby') : undefined} pages={[
          // Ways to play first (teacher, 2026-10-31): Solo, or Live for the class.
          ...(!teacher ? [] : [{ id: 'way', title: t('way.title'), content: <WayToPlay modes={['solo', 'live']} value={way} onChange={setWay} /> }]),
          ...(teacher && way === 'live' ? [{ id: 'class', title: t('live.howPlay'), content: <ClassPlayOptions value={classPlay} onChange={setClassPlay} unit="eyes" /> }] : []),
          ...(game.assigned ? [] : [{ id: 'questions', title: t('setup.questions'), content: <SetPicker sets={sets} value={[setId]} onChange={(ids) => change({ setId: ids[0] })} /> }]),
          { id: 'options', title: t('setup.options'), content: (
            <>
              {way !== 'live' && <>
                <ChoiceRow label={t('gg.endBy')} value={setup.endBy} onChange={(v) => change({ endBy: v })}
                  options={(['eyes', 'time', 'xp'] as const).map((v) => ({ value: v, label: t(`gg.end.${v}`), art: <EndArt kind={v} /> }))} />
                {setup.endBy === 'eyes' && <Slider label={t('gg.eyeGoal')} min={5} max={30} value={setup.eyeGoal} onChange={(v) => change({ eyeGoal: v })} />}
                {setup.endBy === 'time' && <Slider label={t('gg.minutes')} min={1} max={15} value={setup.minutes} onChange={(v) => change({ minutes: v })} />}
                {setup.endBy === 'xp' && <Slider label={t('gg.xpGoal')} min={100} max={2000} value={setup.xpGoal} show={(v) => `${Math.round(v / 50) * 50}`} onChange={(v) => change({ xpGoal: Math.round(v / 50) * 50 })} />}
              </>}
              <Slider label={t('gg.drops')} hint={t('gg.dropsHint')} min={2} max={10} value={setup.drops} onChange={(v) => change({ drops: v })} />
              <Slider label={t('gg.perBreak')} hint={t('gg.perBreakHint')} min={1} max={5} value={setup.perBreak} onChange={(v) => change({ perBreak: v })} />
              {powerUpSwitches({ manifest: googlerManifest, theme, on: setup.powerUps, off: setup.powerOff ?? [], change })}
            </>
          ) },
        ]} />
      )}

      {(phase === 'play' || phase === 'end') && (
        // Centered stage (teacher, 2026-11-26: "move everything to be more
        // center. remove '4 drops' and the eye counter and instead just have
        // the xp to the right of the bar"): the eye bar with the XP on top,
        // the board in the middle, power-ups in a column at its right with an
        // equal spacer at its left so the board stays centered.
        <div className="relative play-fill overflow-hidden">
          <Ground theme={theme} />
          <div className="absolute top-3 right-3 flex items-center gap-2 z-30 [&_button]:!w-11 [&_button]:!h-11">
            {/* One order everywhere (Brand Kit, 2026-11-24): Hint, Settings, Full screen, Close. */}
            <HintButton gameId="googler" />
            <GearButton small onClick={() => setSettingsOpen(true)} />
            <FullScreenButton small />
            <CloseGameButton />
          </div>
          <p className="sr-only" role="status">{t('gg.meterLabel', { count: dropsLeft })}</p>
          {/* Live keeps room under the board for the class pill at the bottom. */}
          <div className={`gg-stage absolute inset-0 flex flex-col items-center gap-3 px-3 ${live ? 'pb-[4.5rem]' : 'pb-[max(1.25rem,3vh)]'}`}>
            <EyeBar slots={slots} filled={filledSlots} sheets={sheets} eyes={eyes} xp={xp} end={end} plan={plan.current} timeLeft={timeLeft} still={still} slotRefs={slotRefs} />
            <div className="flex-1 min-h-0 w-full flex justify-center items-start gap-3">
              <div className="w-[7rem] shrink-0" aria-hidden="true" />
            <motion.div className="relative shrink-0 gg-board" animate={shake && !still ? { x: [0, -9, 8, -5, 3, 0] } : { x: 0 }} key={`shake-${shake}`} transition={{ duration: 0.45 }}>
              {/* The game board space: paper with a faint unit grid (Classic), or the theme's art. */}
              <div className="relative h-full rounded-[1.25rem] border-[4px] border-border p-[0.5rem]" style={{ ...(pieceImage(theme, 'board') ? pieceFill(theme, 'board', '#fffaf0') : { background: 'var(--paper, #fffaf0)' }), boxShadow: '0 6px 0 var(--color-border)' }}>
                {note && <p className="absolute left-1/2 -top-4 -translate-x-1/2 z-30 max-w-[95%] text-center rounded-pill border-std border-border bg-surface px-3 py-0.5 text-sm font-bold whitespace-nowrap" role="status">{note}</p>}
                <div ref={gridRef} className="relative h-full overflow-hidden rounded-[0.75rem] select-none touch-none" role="application" aria-label={t('gg.boardLabel', { n: sel + 1, total: spots.length })}
                  onPointerDown={(e) => { swipe.current = { x: e.clientX, y: e.clientY }; }} onPointerUp={onPointerUp}
                  style={pieceImage(theme, 'board') ? { aspectRatio: `${COLS} / ${ROWS}` } : { aspectRatio: `${COLS} / ${ROWS}`, backgroundImage: 'linear-gradient(#ddd6ff 1.5px, transparent 1.5px), linear-gradient(90deg, #ddd6ff 1.5px, transparent 1.5px)', backgroundSize: `${100 / COLS}% ${100 / ROWS}%` }}>
                  {/* Rows just filled glow Butter before they pop. */}
                  {flash.map((r) => <motion.span key={`f${r}`} aria-hidden="true" className="absolute left-0 right-0 z-[5]" style={{ top: `${(r / ROWS) * 100}%`, height: `${100 / ROWS}%`, background: 'var(--butter, #fff1b8)' }} initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.6, 1] }} transition={{ duration: 0.45 }} />)}
                  {/* The other spots: soft dotted outlines; the picked one: a bold dashed outline with a pastel fill. */}
                  {phase === 'play' && !busy && spot && [...new Set(spot.cells.map(([, c]) => c))].map((c) => {
                    // A soft Butter lane from the top down to where the block lands.
                    const top = Math.min(...spot.cells.filter(([, cc]) => cc === c).map(([r]) => r)) + spot.row;
                    return <motion.span key={`lane${sel}-${c}`} aria-hidden="true" className="absolute z-[3] rounded-b-md" style={{ left: `${((spot.col + c) / COLS) * 100}%`, top: 0, width: `${100 / COLS}%`, height: `${(top / ROWS) * 100}%`, background: SPOT_COLORS[sel % SPOT_COLORS.length].fill }} initial={still ? false : { opacity: 0 }} animate={{ opacity: 1 }} />;
                  })}
                  {phase === 'play' && !busy && spots.map((sp, i) => ({ sp, i })).sort((a, b) => Number(a.i === sel) - Number(b.i === sel)).map(({ sp, i }) => sp.cells.map(([r, c]) => (
                    <span key={`s${i}-${r}-${c}`} aria-hidden="true" className={`absolute rounded-[18%] ${i === sel ? 'z-[5]' : 'z-[4]'}`}
                      style={{ left: `${((sp.col + c) / COLS) * 100}%`, top: `${((sp.row + r) / ROWS) * 100}%`, width: `${100 / COLS}%`, height: `${100 / ROWS}%`, padding: '3%',
                        // Each spot its own color pair (teacher, 2026-11-26: "make sure the options are shown in different colors").
                        border: i === sel ? `3px dashed ${INK}` : `3px dotted ${SPOT_COLORS[i % SPOT_COLORS.length].edge}`, background: SPOT_COLORS[i % SPOT_COLORS.length].fill, boxShadow: i === sel ? `0 0 0 3px ${SPOT_COLORS[i % SPOT_COLORS.length].edge}` : undefined }} />
                  )))}
                  {/* The stack: every unit keeps its id, so a rising row or a fall glides. */}
                  {board.map((row, r) => row.map((x, c) => {
                    if (!x) return null;
                    const pop = popping.has(x.id);
                    const art = blockArt(x.shape);
                    const item = x.power !== undefined ? itemFor(x.power) : undefined;
                    return (
                      <motion.div key={x.id} aria-hidden="true" className="absolute z-[6]"
                        style={{ width: `${100 / COLS}%`, height: `${100 / ROWS}%` }}
                        initial={still ? false : { top: `${((r + 1) / ROWS) * 100}%`, left: `${(c / COLS) * 100}%`, opacity: 1 }}
                        animate={pop ? { top: `${(r / ROWS) * 100}%`, left: `${(c / COLS) * 100}%`, scale: [1, 1.25, 0], rotate: [0, (c % 2 ? 1 : -1) * 12, 0], opacity: [1, 1, 0] } : { top: `${(r / ROWS) * 100}%`, left: `${(c / COLS) * 100}%`, scale: 1, rotate: 0, opacity: 1 }}
                        transition={pop ? { duration: still ? 0.05 : 0.45 } : { type: 'spring', stiffness: 360, damping: 22, delay: still ? 0 : c * 0.012 }}>
                        {/* Eyes and power-ups sit alone in their unit, centered, with no block behind
                            (teacher, 2026-11-26); a power-up wiggles gently inside its square. */}
                        {x.eye !== undefined ? <span className="absolute inset-0 grid place-items-center"><GooglyEye eye={x.eye} still={still} className="w-[84%]" /></span>
                          : item ? <PowerCell item={item} size={cellPx * 0.8} still={still || !loop} seed={x.id} />
                          : art ? <img src={art} alt="" draggable={false} className="w-full h-full object-cover rounded-[12%]" /> : <CrayonBlock shape={x.shape} seed={x.id} className="w-full h-full" />}
                      </motion.div>
                    );
                  }))}
                  {/* The block waiting at the top, over the picked spot; it slides between spots and bobs. */}
                  {phase === 'play' && !busy && spot && (() => {
                    const h = Math.max(...spot.cells.map(([r]) => r)) + 1;
                    return (
                      <motion.div aria-hidden="true" className="absolute z-[8] pointer-events-none" style={{ top: 0, width: '100%', height: `${(h / ROWS) * 100}%` }}
                        animate={{ left: `${(spot.col / COLS) * 100}%` }} transition={still ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 24 }}>
                        <motion.div className="relative w-full h-full" animate={still ? undefined : { y: [0, -4, 0] }} transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}>
                          {spot.cells.map(([r, c], i) => (
                            <motion.span key={`${sel}-${i}`} className="absolute" style={{ left: `${(c / COLS) * 100}%`, top: `${(r / h) * 100}%`, width: `${100 / COLS}%`, height: `${100 / h}%` }}
                              initial={still ? false : { scale: 0.6, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 16 }}>
                              {block.eyeAt === i && block.eye !== undefined ? <span className="absolute inset-0 grid place-items-center"><GooglyEye eye={block.eye} still={still} className="w-[84%]" /></span>
                                : blockArt(block.shape) ? <img src={blockArt(block.shape)} alt="" className="w-full h-full object-cover rounded-[12%]" draggable={false} /> : <CrayonBlock shape={block.shape} seed={i} className="w-full h-full" />}
                            </motion.span>
                          ))}
                        </motion.div>
                      </motion.div>
                    );
                  })()}
                  {/* The drop: the block falls with gravity and lands with a squash. */}
                  {falling && (() => {
                    const sp = falling.spot;
                    const h = Math.max(...sp.cells.map(([r]) => r)) + 1;
                    return (
                      <motion.div key={falling.id} aria-hidden="true" className="absolute z-[9] pointer-events-none" style={{ left: `${(sp.col / COLS) * 100}%`, width: '100%', height: `${(h / ROWS) * 100}%`, transformOrigin: 'bottom' }}
                        initial={{ top: '0%' }} animate={{ top: `${(sp.row / ROWS) * 100}%`, scaleY: still ? 1 : [1, 1.08, 1] }} transition={{ duration: still ? 0.05 : (0.26 + sp.row * 0.038), ease: [0.55, 0, 1, 0.45] }}>
                        {sp.cells.map(([r, c], i) => (
                          <span key={i} className="absolute" style={{ left: `${(c / COLS) * 100}%`, top: `${(r / h) * 100}%`, width: `${100 / COLS}%`, height: `${100 / h}%` }}>
                            {falling.block.eyeAt === i && falling.block.eye !== undefined ? <span className="absolute inset-0 grid place-items-center"><GooglyEye eye={falling.block.eye} still={still} className="w-[84%]" /></span>
                              : blockArt(falling.block.shape) ? <img src={blockArt(falling.block.shape)} alt="" className="w-full h-full object-cover rounded-[12%]" draggable={false} /> : <CrayonBlock shape={falling.block.shape} seed={i} className="w-full h-full" />}
                          </span>
                        ))}
                      </motion.div>
                    );
                  })()}
                  {/* Doodle confetti from each popped unit, in its color. */}
                  {sparks.map((s, k) => {
                    const a = (k * 2.39) % (Math.PI * 2);
                    return <motion.span key={s.id} aria-hidden="true" className="absolute z-[12] pointer-events-none" style={{ left: `${((s.col + 0.5) / COLS) * 100}%`, top: `${((s.row + 0.5) / ROWS) * 100}%`, marginLeft: -9, marginTop: -9 }}
                      initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }} animate={{ x: Math.cos(a) * cellPx * 0.9, y: Math.sin(a) * cellPx * 0.9 - cellPx * 0.3, opacity: 0, scale: 1.2, rotate: 120 }} transition={{ duration: 0.65, ease: 'easeOut' }}>
                      <Doodle kind={SPARK_KINDS[k % 4]} color={s.color} size={18} />
                    </motion.span>;
                  })}
                  <AnimatePresence>
                    {callout && (
                      <motion.p key={callout.id} className="absolute left-1/2 z-20 m-0 pointer-events-none" style={{ top: `${Math.min(85, Math.max(12, callout.y * 100))}%`, x: '-50%', y: '-50%' }}
                        initial={still ? { opacity: 0 } : { scale: 0.3, opacity: 0, rotate: -6 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ opacity: 0, y: '-140%' }} transition={still ? { duration: 0.01 } : { type: 'spring', stiffness: 380, damping: 14 }}
                        onAnimationComplete={() => { const id = callout.id; window.setTimeout(() => setCallout((c) => (c?.id === id ? null : c)), 700); }}>
                        <span className="inline-flex items-center px-[0.8em] py-[0.25em] rounded-full whitespace-nowrap uppercase leading-none bg-[var(--lemon)] text-[var(--ink)] border-[3px] border-border" style={{ fontFamily: 'var(--font-display)', fontSize: `${cellPx * 0.55}px`, boxShadow: '0 4px 0 var(--color-border)' }}>{callout.text}</span>
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
              <div className="w-[7rem] shrink-0 grid gap-3 content-start justify-items-center pt-1">
                <Boosts view={boostView} items={stackItems} still={still} />
                <PowerUpTray manifest={googlerManifest} items={held.held} onUse={(i) => void spendHeld(i)} disabled={busy || phase !== 'play'} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Eyes on their way: an arc from the cleared row into the next empty circle. */}
      {createPortal(
        <div className="fixed inset-0 z-[60] pointer-events-none" aria-hidden="true" data-gg-flights="">
          {flights.map((f) => {
            const { from, mid, to, size } = f;
            return (
              <motion.span key={f.id} className="absolute grid" style={{ width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }}
                initial={{ left: from.x, top: from.y, scale: 1, rotate: 0 }}
                animate={{ left: [from.x, mid.x, to.x], top: [from.y, mid.y, to.y], scale: [1, 1.6, 0.9], rotate: [0, 360, 720] }}
                transition={{ duration: still ? 0.15 : 0.95, ease: 'easeInOut', times: [0, 0.45, 1] }}><GooglyEye eye={f.eye} still={still} className="w-full" /></motion.span>
            );
          })}
        </div>, document.body)}

      {/* A power-up going off: big and centered on the top layer, then it does its job. */}
      <AnimatePresence>
        {announce && (
          <motion.div key={announce.id} className="fixed inset-0 z-[70] grid place-items-center pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="grid justify-items-center gap-2 rounded-[1.5rem] border-[3px] border-border bg-[var(--paper,#fffaf0)] px-8 py-5 text-center max-w-[22rem]" style={{ boxShadow: '0 8px 0 var(--color-border)' }}
              initial={still ? false : { scale: 0.4, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.8 }} transition={{ type: 'spring', stiffness: 360, damping: 14 }} role="status">
              <ItemArt item={announce.item} size={110} still={still} />
              <p className="m-0 font-display text-3xl leading-tight">{t('pu.on', { name: announce.item.name })}</p>
              <p className="m-0 font-semibold">{roleOf(googlerManifest, announce.item)}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {phase === 'end' && (
        <ResultsModal title={t('gg.done', { eyes, xp })} missed={missed} againLabel={t('share.again')} onAgain={() => setPhase('welcome')}>
          <p className="flex flex-wrap items-center justify-center gap-1 max-w-[20rem]" aria-label={t('gg.counter', { n: eyes })}>
            {Array.from({ length: Math.min(eyes, 20) }, (_, i) => <GooglyEye key={i} eye={i} still={still} className="w-9" />)}
          </p>
        </ResultsModal>
      )}
      {powers.element}
      {element}
    </main>
    </ThemedPage>
  );
}

// Spot colors: one pastel and its bright per choice (New direction pairs).
const SPOT_COLORS = [
  { fill: '#fff1b8', edge: '#fabe37' }, { fill: '#c8f0dc', edge: '#22b04a' }, { fill: '#ffd3e6', edge: '#f055a5' },
  { fill: '#bfdff3', edge: '#4ba3e8' }, { fill: '#ffd9b3', edge: '#ff9b28' },
];

// A stack power-up: alone in its unit, no block behind, a little wiggle that
// never leaves its square (teacher, 2026-11-26).
function PowerCell({ item, size, still, seed }: { item: ThemeItem; size: number; still: boolean; seed: number }) {
  return (
    <motion.span className="absolute inset-0 grid place-items-center"
      animate={still ? undefined : { rotate: [0, -7, 6, -4, 0], scale: [1, 1.04, 0.97, 1.02, 1] }}
      transition={{ duration: 1.4 + (seed % 5) * 0.2, repeat: Infinity, repeatDelay: 0.3 + (seed % 3) * 0.4, ease: 'easeInOut' }}>
      <ItemArt item={item} size={size} still />
    </motion.span>
  );
}

// The eye bar on top: an empty circle for each googly eye still to collect
// (they fill as eyes fly in, and look at the pointer like every eye), then
// the XP right of the bar (and the time left in a timed game).
function EyeBar({ slots, filled, sheets, eyes, xp, end, plan, timeLeft, still, slotRefs }: {
  slots: number; filled: number; sheets: number; eyes: number; xp: number; end: EndBy | 'live'; plan: { eyeGoal: number; xpGoal: number }; timeLeft: number | null; still: boolean;
  slotRefs: React.MutableRefObject<(HTMLSpanElement | null)[]>;
}) {
  return (
    <div className="gg-bar mt-3 inline-flex items-center gap-4 px-5 h-[3.75rem] max-w-full min-w-0 rounded-full bg-[var(--paper)] border-[3px] border-border" style={{ boxShadow: '0 3px 0 var(--color-border)' }}
      role="group" aria-label={end === 'eyes' ? t('gg.goal.eyes', { n: eyes, goal: plan.eyeGoal }) : t('gg.counter', { n: eyes })}>
      <span className="flex items-center gap-[0.3rem] min-w-0" style={{ width: `min(${slots * 2.5}rem, 40vw)` }}>
        {Array.from({ length: slots }, (_, i) => {
          const got = i < filled;
          return (
            <span key={i} ref={(el) => { slotRefs.current[i] = el; }} className="relative flex-1 max-w-[2.4rem] aspect-square rounded-full grid place-items-center"
              style={{ border: `2.5px ${got ? 'solid' : 'dashed'} ${got ? INK : 'rgba(29,26,51,0.4)'}`, background: got ? 'var(--butter,#fff1b8)' : 'transparent' }}>
              <AnimatePresence>{got && <motion.span key={`${i}-${sheets}`} className="grid w-[94%]" initial={still ? false : { scale: 1.8, rotate: -60 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 12 }}><GooglyEye eye={i} still={still} className="w-full" /></motion.span>}</AnimatePresence>
            </span>
          );
        })}
      </span>
      {end !== 'eyes' && sheets > 0 && <motion.span key={sheets} className="font-display text-lg tabular-nums shrink-0" initial={still ? false : { scale: 1.8 }} animate={{ scale: 1 }}>{eyes}</motion.span>}
      {end === 'time' && <span className="font-display text-xl tabular-nums shrink-0" role="timer" aria-label={t('gg.goal.time', { time: clock(timeLeft ?? 0) })}>{clock(timeLeft ?? 0)}</span>}
      <span className="flex items-baseline gap-1 shrink-0 tabular-nums leading-none" role="status" aria-label={end === 'xp' ? t('gg.goal.xp', { n: xp, goal: plan.xpGoal }) : t('share.points', { count: xp })}>
        <motion.span key={xp} className="inline-block text-[2.4rem]" style={{ fontFamily: 'var(--font-display)' }} initial={still ? false : { scale: 1.35, rotate: -4 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 14 }}>{xp}</motion.span>
        <span className="text-sm font-bold">{end === 'xp' ? `/ ${plan.xpGoal} XP` : 'XP'}</span>
      </span>
    </div>
  );
}

// Boosts that are on right now, under the score: small pictures with a count.
function Boosts({ view, items, still }: { view: { choices: number; freeze: number; double: boolean }; items: ThemeItem[]; still: boolean }) {
  const all = googlerManifest.items!.classic;
  const look = (ability: string) => items.find((i) => i.ability === ability) ?? all.find((i) => i.ability === ability)!;
  const on = [view.choices > 0 && { it: look('choices'), n: view.choices, tip: t('gg.boost.choices', { count: view.choices }) }, view.freeze > 0 && { it: look('freeze'), n: view.freeze, tip: t('gg.boost.freeze', { count: view.freeze }) }, view.double && { it: look('double'), n: 0, tip: t('gg.boost.double') }].filter(Boolean) as { it: ThemeItem; n: number; tip: string }[];
  if (!on.length) return null;
  return (
    <div className="flex flex-wrap justify-center gap-2" role="group" aria-label={t('gg.boosts')}>
      {on.map((b) => (
        <motion.span key={b.it.id} className="relative grid place-items-center w-14 h-14 rounded-[14px] border-[2.5px] border-border bg-[var(--mint,#c8f0dc)]" data-tip={b.tip} aria-label={b.tip} initial={still ? false : { scale: 0.3 }} animate={{ scale: 1 }}>
          <ItemArt item={b.it} size={36} still={still} />
          {b.n > 0 && <span className="absolute -top-2 -right-2 min-w-6 h-6 px-1 rounded-full bg-white border-[2px] border-border text-xs font-bold grid place-items-center">{b.n}</span>}
        </motion.span>
      ))}
    </div>
  );
}

// The pictured end choices: an eye, a clock face, an XP bolt.
function EndArt({ kind }: { kind: EndBy }) {
  return (
    <span className="grid place-items-center w-16 h-16 rounded-xl border-thin border-border bg-white" aria-hidden="true">
      {kind === 'eyes' ? <img src={EYES[2]} alt="" className="w-11 h-11" /> : kind === 'time'
        ? <svg viewBox="0 0 100 100" className="w-11 h-11"><circle cx="50" cy="52" r="38" fill="#bfdff3" stroke={INK} strokeWidth="6" /><path d="M50 52 V30 M50 52 L66 60" stroke={INK} strokeWidth="6" strokeLinecap="round" /></svg>
        : <Lightning weight="fill" size={44} color="#fabe37" />}
    </span>
  );
}

// The stage ground. Classic: the pastel cut-paper desk. A theme's background or the teacher's stage color wins.
function Ground({ theme }: { theme: GameTheme }) {
  const { settings } = useSettings();
  const stage = useStageColor(theme.gameId);
  if (pieceImage(theme, 'background')) return <div className="absolute inset-0" style={pieceFill(theme, 'background', theme.colors.background)} aria-hidden="true" />;
  if (stage || theme.source !== 'house' || theme.name !== 'Classic') return null;
  const plain = settings.backgrounds === 'plain';
  return <div className="absolute inset-0" style={plain ? { background: '#f6f0e4' } : { backgroundColor: '#f6f0e4', ...pattern('cutpaper-pastel', settings.calm) }} aria-hidden="true" />;
}
