import HintButton from '../../engine/HintButton';
import { NO_STEAL_ABILITIES } from '../../engine/powerUps';
import { impact } from '../../engine/impact';
import { playClip, POWER_SOUNDS } from '../../engine/music';
import { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CPU_THINK_MS, pace, POP_IN } from '../../engine/pace';
import TapOk from '../../engine/TapOk';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowsClockwise, CheckCircle, DiceFive, FlagCheckered, HourglassHigh, ShieldCheck, Trophy } from '@phosphor-icons/react';
import { data, newId } from '../../data';
import { LIBRARY } from '../../data/library';
import { useMySets } from '../../data/hooks';
import type { MultipleChoiceQuestion } from '../../data/types';
import { buzz, playEffect } from '../../engine/feedback';
import { makeDeck } from '../../engine/picker';
import ResultsModal from '../../engine/ResultsModal';
import ShareQuestion from '../../engine/ShareQuestion';
import TeamSetup from '../../engine/TeamSetup';
import { TeamArt, TeamBadge } from '../../engine/TeamBadge';
import { current, nextTurn, setScores, startTurns, TEAM_COLORS, type CpuLevel, type TurnPlayer, type TurnState } from '../../engine/turns';
import { PowerUpTray, roleOf, useHeldPowerUps } from '../../engine/HeldPowerUps';
import { powerUpSwitches } from '../../engine/PowerUpSwitches';
import PowerUpPop from '../../engine/PowerUpPop';
import { t } from '../../i18n';
import { FullScreenButton, GameTopRow, GearButton, SettingsPanel } from '../../settings/SettingsPanel';
import CloseGameButton from '../../engine/CloseGameButton';
import { useSettings } from '../../settings/SettingsContext';
import { useGamePool } from '../../student/session';
import { pieceImage } from '../../theme/library';
import { ThemedPage, useGameTheme } from '../../theme/useGameTheme';
import type { GameTheme, ThemeItem } from '../../theme/types';
import ItemArt from '../../theme/ItemArt';
import { ChoiceRow, Toggle } from '../../ui/fields';
import Title from '../../ui/Title';
import PopText from '../../ui/PopText';
import GameWelcome from '../GameWelcome';
import SetPicker from '../SetPicker';
import SetupWizard from '../SetupWizard';
import ThemeScreen from '../ThemeScreen';
import WayToPlay from '../WayToPlay';
import ShareHow from '../ShareHow';
import { useHostTeams, useSavedSetup } from '../useSavedSetup';
import { castleQuestManifest } from './manifest';
import { BoardArt, boardGround, C, CHICLE, Die2D, matPad, PARTY_COLORS, SQUARE_COLORS, WOBBLE } from './boardArt';
import { CrayonPawn, ParkScene, PK } from './park';
import { layout, placePowers, POWERS, roll, spaceKinds, tornadoSpots, TRAIL_SPACES, trailOf, TRAILS, wheelStop, type Layout, type Power, type SpaceKind } from './board';

type Phase = 'welcome' | 'theme' | 'setup' | 'play' | 'end';
type Step = 'question' | 'roll' | 'busy' | 'pick';
const JUMP = '/sounds/board/jump.mp3';
const DICE = '/sounds/board/dice.mp3';
// Classic look (approved mockup, teacher 2026-11-24): the park, pastel squares,
// crayon pawns and the side panel stack; Grow Year for the board's words.
const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

// Board Game (teacher redesign, 2026-11-08): "solve the question, roll the
// dice, move the corresponding places, first to the end wins". A flat classic
// board of squares winds from Start to Finish; lose-a-turn and roll-again
// squares, and power-ups hidden under ordinary squares.
export default function CastleQuest() {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const { theme, themes, playable, choose } = useGameTheme('castle-quest');
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const hostTeams = useHostTeams();
  const [setup, change] = useSavedSetup('castle-quest', { setId: LIBRARY[0].id, who: 'versus' as 'teams' | 'versus', powerUps: true, trail: 'medium' as string, powerOff: [] as string[], exact: false }, hostTeams ? { who: 'teams' as const } : undefined);
  const setId = sets.some((s) => s.id === setup.setId) ? setup.setId : LIBRARY[0].id;
  const picked = useMemo(() => sets.filter((s) => s.id === setId).map((set) => ({ set, starred: false })), [sets, setId]);
  const game = useGamePool(picked);
  const deck = useMemo(() => makeDeck(game.pool), [game.pool]);
  const versus = setup.who === 'versus';
  const [team, setTeam] = useState<{ players: TurnPlayer[]; level: CpuLevel }>({ players: [], level: 'medium' });
  const [phase, setPhase] = useState<Phase>('welcome');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [turns, setTurns] = useState<TurnState | null>(null);
  const [step, setStep] = useState<Step>('question');
  const [question, setQuestion] = useState<{ q: MultipleChoiceQuestion; setId?: string } | null>(null);
  const [missed, setMissed] = useState<MultipleChoiceQuestion[]>([]);
  const [n, setN] = useState(TRAIL_SPACES.medium);
  const [kinds, setKinds] = useState<SpaceKind[]>([]);
  const [powers, setPowers] = useState<Map<number, Power>>(new Map());
  const [pos, setPos] = useState<number[]>([]);
  const [hop, setHop] = useState<{ who: number; k: number; ms: number }>({ who: -1, k: 0, ms: 300 });
  const [swirl, setSwirl] = useState<{ id: number; to: number[]; lifted: boolean[] } | null>(null);
  const [die, setDie] = useState(1);
  const [toss, setToss] = useState<{ id: number; rolls: number[]; mult: number; wait: boolean } | null>(null);
  // Click to go on (teacher, 2026-11-13): the die, the wheel and power-up cards wait for a tap.
  const goRef = useRef<(() => void) | null>(null);
  // Every pop-up waits for a tap, the computer's too (teacher, 2026-11-24): one tap from the class goes on.
  const tapToGo = () => new Promise<void>((res) => { goRef.current = () => { goRef.current = null; res(); }; });
  const [wheel, setWheel] = useState<{ id: number; stop: number; forward: boolean; n: number; name: string; done: boolean; spinning: boolean } | null>(null);
  const [shield, setShield] = useState<boolean[]>([]);
  const [skip, setSkip] = useState<boolean[]>([]);
  const [potion, setPotion] = useState<number[]>([]); // doubled rolls left
  const [boost, setBoost] = useState<{ double: boolean; x2: boolean }>({ double: false, x2: false });
  const [banner, setBanner] = useState<{ id: number; text: string; icon?: 'lose' | 'again' | 'shield'; bad?: boolean } | null>(null);
  const [pop, setPop] = useState<{ id: number; item: ThemeItem; text: string } | null>(null);
  const [winner, setWinner] = useState<TurnPlayer | null>(null);
  const [puff, setPuff] = useState<{ id: number; at: number } | null>(null);
  const live = useRef(true);
  const posRef = useRef<number[]>([]); posRef.current = pos;
  const turnsRef = useRef<TurnState | null>(null); turnsRef.current = turns;
  const shieldRef = useRef<boolean[]>([]); shieldRef.current = shield;
  const potionRef = useRef<number[]>([]); potionRef.current = potion;
  const boostRef = useRef(boost); boostRef.current = boost;
  const skipRef = useRef<boolean[]>([]); skipRef.current = skip;
  const pickRef = useRef<((who: number) => void) | null>(null);
  const held = useHeldPowerUps();
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);

  const items = theme.items?.length ? theme.items : castleQuestManifest.items?.classic ?? [];
  const itemFor = (p: Power) => items.find((it) => it.ability === p) ?? castleQuestManifest.items!.classic!.find((it) => it.ability === p)!;
  const player = turns ? current(turns) : null;
  const me = turns ? turns.turn : 0;
  const human = player?.kind !== 'cpu';
  const finish = n - 1;
  const ms = (x: number) => (still ? Math.min(x, 150) : x * pace(settings));

  // The board fills the space it is given; squares stay 1 to 1.
  const boardRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 800, h: 500 });
  useLayoutEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const fit = () => { const r = el.getBoundingClientRect(); if (r.width && r.height) setBox((b) => (Math.abs(b.w - r.width) + Math.abs(b.h - r.height) < 1 ? b : { w: r.width, h: r.height })); };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(el);
    return () => ro.disconnect();
  }, [phase]);
  // The whole stage, so the park is drawn to its real size (the sun stays round).
  const stageRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState({ w: 1280, h: 760 });
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const fit = () => { const r = el.getBoundingClientRect(); if (r.width && r.height) setStage((b) => (Math.abs(b.w - r.width) + Math.abs(b.h - r.height) < 1 ? b : { w: Math.round(r.width), h: Math.round(r.height) })); };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(el);
    return () => ro.disconnect();
  }, [phase]);
  const narrow = stage.w < 1024;
  // Room around the squares for the paper mat, its edge and shadow, and the
  // pawns that stand up over the top row.
  const L: Layout = useMemo(() => {
    // Under the side-panel width (iPad portrait), the board stays a wide
    // rectangle like the mockup, so the last lane never leaves a tall empty mat.
    const h = narrow ? Math.max(200, Math.min(box.w * 0.85, stage.h - 330)) : box.h;
    const fitIn = (pad: number) => layout(n, Math.max(100, box.w - pad * 2), Math.max(100, h - pad * 2 - 6));
    const first = fitIn(22);
    return fitIn(matPad(first.size) + 10);
  }, [n, box.w, box.h, narrow, stage.h]);
  // iPad portrait: the board is as tall as its squares need, and the board and
  // the panel sit together in the middle of the park (no empty band).
  const boardH = L.rows * L.size + (matPad(L.size) + 10) * 2 + 6;
  const ox = (box.w - L.cols * L.size) / 2, oy = (box.h - L.rows * L.size) / 2;
  const at = (i: number) => { const c = L.cells[Math.max(0, Math.min(n - 1, i))]; return { x: ox + (c.x + 0.5) * L.size, y: oy + (c.y + 0.5) * L.size }; };
  // A little wobble per square, the same all game (surprise and irregularity).
  const wobble = WOBBLE;

  useEffect(() => { if (toss) playClip(DICE, settings, 0.8); }, [toss?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // A message card that stays until it is tapped (teacher, 2026-11-24).
  async function say(text: string, icon?: 'lose' | 'again' | 'shield', bad = false) {
    setBanner({ id: Date.now() + Math.random(), text, icon, bad });
    await tapToGo();
    setBanner(null);
  }
  function place(next: number[]) {
    posRef.current = next; setPos(next);
    const s = turnsRef.current;
    if (!s) return;
    const st = setScores(s, Object.fromEntries(s.players.map((p, i) => [p.id, next[i] ?? 0])));
    turnsRef.current = st; setTurns(st);
  }

  function begin(ps: TurnPlayer[]) {
    const size = TRAIL_SPACES[trailOf(setup.trail)];
    const k = spaceKinds(size);
    // No power-up that moves another player back (no stealing, teacher 2026-11-24).
    const allowed = POWERS.filter((p) => !NO_STEAL_ABILITIES.has(p) && !(setup.powerOff ?? []).includes(itemFor(p).id));
    setN(size); setKinds(k);
    setPowers(setup.powerUps ? placePowers(k, ps.length < 2 ? allowed.filter((p) => p !== 'wheel' && p !== 'shield') : allowed) : new Map());
    const state = startTurns(ps);
    turnsRef.current = state;
    setTurns(state); setMissed([]); setWinner(null); setSwirl(null); setWheel(null);
    place(ps.map(() => 0));
    setShield(ps.map(() => false)); setSkip(ps.map(() => false)); setPotion(ps.map(() => 0));
    held.reset();
    setPhase('play');
    void startTurn(state);
  }
  async function startTurn(state: TurnState) {
    const i = state.turn;
    const p = current(state);
    // A shield lasts until the start of its owner's next turn (teacher, 2026-11-08).
    if (shieldRef.current[i]) setShield((s) => s.map((v, k) => (k === i ? false : v)));
    setBoost({ double: false, x2: false });
    if (skipRef.current[i]) {
      setSkip((s) => s.map((v, k) => (k === i ? false : v)));
      setStep('busy');
      await say(t('cq.skipped', { name: p.name }), 'lose', true);
      return advance();
    }
    held.beginTurn(p.id);
    setStep('question');
    const d = deck.next();
    setQuestion({ q: d.question, setId: d.setId });
  }
  function onResult(right: boolean) {
    const s = turnsRef.current;
    if (!s || !question) return;
    const p = current(s);
    if (p.kind !== 'cpu' && p.kind !== 'teacher') {
      void data.logQuestion({ id: newId('log'), at: new Date().toISOString(), teamName: p.name, gameId: 'castle-quest', mode: versus ? 'versus' : 'share', setId: question.setId, prompt: question.q.prompt, answer: question.q.choices[question.q.correctIndex], tries: [], ms: 0, outcome: right ? 'right' : 'skipped' });
      if (!right) setMissed((m) => (m.some((x) => x.id === question.q.id) ? m : [...m, question.q]));
    }
    setQuestion(null);
    if (right) setStep('roll');
    else void endTurn();
  }

  async function walk(who: number, to: number) {
    const from = posRef.current[who];
    if (to === from) return;
    const dir = to > from ? 1 : -1;
    const speed = still ? 80 : Math.max(170, Math.min(360, Math.round(3200 / Math.abs(to - from))));
    for (let k = from; k !== to; k += dir) {
      if (!live.current) return;
      const next = [...posRef.current]; next[who] = k + dir; place(next);
      setHop((h) => ({ who, k: h.k + 1, ms: speed }));
      playClip(JUMP, settings, 0.7); // the teacher's jump sound on every hop
      await sleep(speed);
    }
    // A little dust puff where the piece lands (engagement audit, 2026-11-08).
    setPuff({ id: Date.now(), at: to });
  }
  async function throwDie(count: number, mult: number) {
    const rolls = Array.from({ length: count }, () => roll());
    setToss({ id: Date.now(), rolls, mult, wait: false });
    await sleep(still ? 500 : 1700 + (count - 1) * 500);
    setDie(rolls[rolls.length - 1]);
    playEffect('right', settings);
    // The die waits big on the screen until it is tapped, so the student can
    // count the dots before the piece moves (teacher, 2026-11-13).
    setToss((x) => (x ? { ...x, wait: true } : x));
    await tapToGo();
    setToss(null);
    return rolls;
  }
  async function rollDie() {
    if (step !== 'roll') return;
    try { await rollAndMove(); } catch { await endTurn(); }
  }
  async function rollAndMove() {
    setStep('busy');
    const b = boostRef.current;
    const pot = (potionRef.current[me] ?? 0) > 0;
    if (pot) setPotion((v) => v.map((x, k) => (k === me ? x - 1 : x)));
    const mult = b.x2 || pot ? 2 : 1;
    const rolls = await throwDie(b.double ? 2 : 1, mult);
    setBoost({ double: false, x2: false });
    const by = rolls.reduce((a, r) => a + r, 0) * mult;
    const to = posRef.current[me] + by;
    // Exact roll to win (teacher, 2026-11-13): too many and the piece bounces back from the finish.
    if (setup.exact && to > finish) { await walk(me, finish - 1); await sleep(ms(200)); await walk(me, Math.max(0, finish - (to - finish))); }
    else await walk(me, Math.min(finish, to));
    await land(me);
  }
  async function land(who: number) {
    const here = posRef.current[who];
    if (here >= finish) return endTurn();
    const power = powers.get(here);
    if (power) {
      setPowers((m) => { const x = new Map(m); x.delete(here); return x; });
      await found(who, power);
      if (posRef.current.some((p) => p >= finish)) return endTurn();
    }
    const kind = kinds[posRef.current[who]];
    if (kind === 'lose') { setSkip((s) => s.map((v, k) => (k === who ? true : v))); playEffect('miss', settings); await say(t('cq.loseTurn'), 'lose', true); return endTurn(); }
    if (kind === 'again') { playEffect('win', settings); impact(settings); if (!still && settings.celebrations !== 'off' && boardRef.current) { const r = boardRef.current.getBoundingClientRect(); const p = at(posRef.current[who]); void confetti({ particleCount: 45, spread: 70, startVelocity: 28, origin: { x: (r.left + p.x) / window.innerWidth, y: (r.top + p.y) / window.innerHeight }, colors: PARTY_COLORS, disableForReducedMotion: true }); } await say(t('cq.rollAgain'), 'again'); setStep('roll'); return; }
    return endTurn();
  }
  // A hidden power-up: the shield goes up at once (it starts at the reveal);
  // tornado and every other power wait for the finder's next turn.
  async function found(who: number, power: Power) {
    const s = turnsRef.current!;
    const it = itemFor(power);
    if (power === 'shield') {
      setShield((v) => v.map((x, k) => (k === who ? true : x)));
      setPop({ id: Date.now(), item: it, text: roleOf(castleQuestManifest, it) });
      await tapToGo();
      setPop(null);
      return;
    }
    held.earn(s.players[who].id, it);
    setPop({ id: Date.now(), item: it, text: t('pu.later', { role: roleOf(castleQuestManifest, it) }) });
    await tapToGo();
    setPop(null);
  }
  // Held power-ups switch on by themselves at the start of the roll.
  async function applyItem(i: number) {
    const it = held.use(i);
    if (!it) return;
    const a = it.ability as Power;
    if (a === 'double') setBoost((b) => ({ ...b, double: true }));
    if (a === 'x2') setBoost((b) => ({ ...b, x2: true }));
    if (a === 'potion') setPotion((v) => v.map((x, k) => (k === me ? 2 : x)));
    if (a === 'tornado') { setStep('busy'); await sleep(ms(1400)); await blowAway(); }
    if (a === 'wheel') { setStep('busy'); await sleep(ms(1400)); await spinWheel(); }
  }
  // Tornado (teacher, 2026-11-08): every piece is lifted, swirled round and
  // dropped evenly spaced, never back on its own square. A shield holds you down.
  async function blowAway() {
    playClip(POWER_SOUNDS.tornado, settings);
    const lifted = posRef.current.map((_, i) => i === me || !shieldRef.current[i]);
    const to = tornadoSpots(posRef.current, lifted, finish);
    setSwirl({ id: Date.now(), to, lifted });
    await sleep(still ? 400 : 3000);
    place(to);
    buzz(80, settings);
    impact(settings, true);
    await sleep(ms(500));
    setSwirl(null);
    await say(t('cq.tornadoDone'));
    setStep('roll');
  }
  // Wheel (teacher, 2026-11-08): pick a player, roll, then a spinning wheel
  // split in half decides: forward or back that many squares.
  async function spinWheel() {
    const s = turnsRef.current!;
    let target = me;
    if (s.players.length > 1) {
      if (current(s).kind === 'cpu') {
        // The computer picks whoever is furthest ahead (not itself).
        target = posRef.current.map((p, i) => [p, i]).filter(([, i]) => i !== me).sort((a, b) => b[0] - a[0])[0][1];
        await say(t('cq.wheelPicks', { name: s.players[target].name }));
      } else {
        setStep('pick');
        target = await new Promise<number>((res) => { pickRef.current = res; });
        pickRef.current = null;
        setStep('busy');
      }
    }
    const [n1] = await throwDie(1, 1);
    const forward = Math.random() < 0.5;
        // Tap the wheel to spin it, and tap again to go on (teacher, 2026-11-13).
    setWheel({ id: Date.now(), stop: wheelStop(forward), forward, n: n1, name: s.players[target].name, done: false, spinning: false });
    await tapToGo();
    setWheel((w) => (w ? { ...w, spinning: true } : w));
    playEffect('whoosh', settings);
    await sleep(still ? 500 : 4200);
    setWheel((w) => (w ? { ...w, done: true } : w));
    playEffect(forward ? 'win' : 'miss', settings);
    impact(settings);
    await tapToGo();
    setWheel(null);
    if (target !== me && shieldRef.current[target]) { await say(t('cq.shieldBlocks'), 'shield'); setStep('roll'); return; }
    await walk(target, Math.max(0, Math.min(finish, posRef.current[target] + (forward ? n1 : -n1))));
    if (posRef.current.some((p) => p >= finish)) return endTurn();
    setStep('roll');
  }

  async function endTurn() {
    const s = turnsRef.current;
    if (!s) return;
    // After the computer's move, a pause so the class can see what happened.
    await sleep(ms(current(s).kind === 'cpu' ? 1200 : 500));
    held.endTurn();
    const done = posRef.current.findIndex((p) => p >= finish);
    if (done >= 0) {
      setWinner(s.players[done]);
      playEffect('win', settings);
      impact(settings, true);
      if (settings.celebrations !== 'off' && !still) {
        void confetti({ particleCount: 160, spread: 110, origin: { x: 0.5, y: 0.3 }, colors: PARTY_COLORS, disableForReducedMotion: true });
        window.setTimeout(() => void confetti({ particleCount: 120, spread: 80, origin: { x: 0.3, y: 0.4 }, colors: PARTY_COLORS, disableForReducedMotion: true }), 500);
      }
      await sleep(ms(2600));
      setPhase('end');
      return;
    }
    return advance();
  }
  function advance() {
    const s = turnsRef.current;
    if (!s) return;
    const next = nextTurn(s);
    turnsRef.current = next; setTurns(next);
    void startTurn(next);
  }

  // The computer thinks for a moment, then rolls by itself (teacher, 2026-11-24).
  const [thinking, setThinking] = useState(false);
  const cpuRoll = phase === 'play' && player?.kind === 'cpu' && step === 'roll' && !held.held.length && !banner && !pop;
  useEffect(() => {
    if (!cpuRoll) { setThinking(false); return; }
    setThinking(true);
    const id = window.setTimeout(() => { setThinking(false); void rollDie(); }, (still ? 600 : CPU_THINK_MS) * pace(settings));
    return () => window.clearTimeout(id);
  }, [cpuRoll]); // eslint-disable-line react-hooks/exhaustive-deps

  const tray = <PowerUpTray manifest={castleQuestManifest} items={held.held} onUse={(i) => void applyItem(i)} disabled={step !== 'roll' || !!banner || !!pop} auto={!human} who={player?.name} />;
  const boosted = boost.double || boost.x2 || (potion[me] ?? 0) > 0;
  const rollLabel = boost.double ? t('cq.rollTwice') : boosted ? t('cq.rollDouble') : t('cq.roll');
  const canRoll = step === 'roll' && human && phase === 'play' && !banner;
  // Just the die, big, under the power-ups: tap it to roll (teacher, 2026-11-13: no text, no box).
  const dieButton = (size: string) => (
    <motion.button type="button" onClick={() => void rollDie()} disabled={!canRoll} aria-label={rollLabel} className="rounded-[18%] disabled:cursor-default shrink-0"
      style={{ width: size, height: size, filter: canRoll ? `drop-shadow(0 0 12px ${PK.lemon}) drop-shadow(0 0 4px ${PK.butter})` : undefined }}
      animate={canRoll && !still ? { y: [0, -10, 0], rotate: [0, -6, 6, 0] } : { y: 0, rotate: 0 }} transition={canRoll ? { duration: 1.2, repeat: Infinity } : { duration: 0.2 }}
      whileHover={canRoll && !still ? { scale: 1.1 } : undefined} whileTap={canRoll && !still ? { scale: 0.9 } : undefined}>
      <Die2D value={die} size={size} rolling={false} theme={theme} />
    </motion.button>
  );
  const picker = step === 'pick' && turns && (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-ink-night/35 p-4" role="dialog" aria-label={t('cq.wheelPick')}>
      <motion.div className="bg-surface border-heavy border-border rounded-panel p-5 grid gap-4 justify-items-center max-w-[min(40rem,94vw)]" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}
        initial={still ? false : { scale: 0.6, rotate: -4 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 16 }}>
        <ItemArt item={itemFor('wheel')} size={72} still={still} />
        <p className="font-display text-2xl font-bold text-center">{t('cq.wheelPick')}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          {turns.players.map((p, i) => (
            <motion.button key={p.id} type="button" onClick={() => pickRef.current?.(i)} whileHover={still ? undefined : { scale: 1.05 }}
              className="grid justify-items-center gap-1 rounded-panel border-bold border-border bg-surface-2 px-4 py-3 min-w-28 hover:bg-butter" aria-label={p.name}>
              <TeamBadge colorIndex={p.colorIndex} size={56} />
              <span className="font-bold">{p.name}</span>
              {shield[i] && i !== me && <ShieldCheck weight="fill" size={20} className="text-[#4ba3e8]" aria-label={t('cq.shielded')} />}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );

  return (
    <ThemedPage theme={theme} menu={phase !== 'play' && phase !== 'end'}>
    <main className={phase === 'play' || phase === 'end' ? '!p-0' : 'w-full px-4 sm:px-6 pt-6 pb-6'}>
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context="castle-quest" />
      {phase !== 'play' && phase !== 'end' && <GameTopRow hint="castle-quest" onSettings={() => setSettingsOpen(true)} />}
      {phase === 'welcome' && (
        <GameWelcome game={castleQuestManifest} cover={pieceImage(theme, 'cover')} onStart={() => setPhase(themes.length > 1 ? 'theme' : 'setup')} steps={[
          { icon: <CheckCircle weight="fill" size={22} />, text: t('cq.how1') },
          { icon: <DiceFive weight="fill" size={22} />, text: t('cq.how2') },
          { icon: <FlagCheckered weight="fill" size={22} />, text: t('cq.how3') },
        ]} />
      )}
      {phase === 'theme' && <ThemeScreen gameName={castleQuestManifest.name} current={theme} themes={themes} playable={playable} onChoose={choose} onBack={() => setPhase('welcome')} onNext={() => setPhase('setup')} />}
      {phase === 'setup' && (
        <SetupWizard onBack={() => setPhase(themes.length > 1 ? 'theme' : 'welcome')} onPlay={() => begin(team.players)} pages={[
          { id: 'way', title: t('way.title'), content: <div className="grid gap-6"><WayToPlay modes={['share', 'versus']} value={versus ? 'versus' : 'share'} onChange={(m) => change({ who: m === 'versus' ? 'versus' : 'teams' })} />{!versus && <ShareHow gameId="castle-quest" setId={setId} />}</div> },
          ...(game.assigned ? [] : [{ id: 'questions', title: t('setup.questions'), content: <SetPicker sets={sets} value={[setId]} onChange={(ids) => change({ setId: ids[0] })} /> }]),
          { id: 'options', title: t('setup.options'), content: (
            <>
              <ChoiceRow label={t('cq.trail')} value={trailOf(setup.trail)} onChange={(v) => change({ trail: v as typeof TRAILS[number] })}
                options={TRAILS.map((tr) => ({ value: tr, label: t(`cq.trail.${tr}` as 'cq.trail.short'), art: <TrailMock n={TRAIL_SPACES[tr]} /> }))} />
              <Toggle label={t('cq.exact')} hint={t('cq.exactHint')} value={!!setup.exact} onChange={(v) => change({ exact: v })} />
              {powerUpSwitches({ manifest: castleQuestManifest, theme, on: setup.powerUps, off: setup.powerOff ?? [], change })}
            </>
          ) },
          versus
            ? { id: 'players', title: t('setup.players'), ready: team.players.length === 2, content: <TeamSetup key="versus" mode="versus" vsComputer min={2} max={2} embedded onChange={(ps, level) => setTeam({ players: ps, level })} /> }
            : { id: 'teams', title: t('setup.teams'), ready: team.players.length > 0, content: <TeamSetup key="share" mode="share" min={1} max={10} embedded onChange={(ps, level) => setTeam({ players: ps, level })} /> },
        ]} />
      )}
      {(phase === 'play' || phase === 'end') && turns && (
        <div ref={stageRef} className="relative play-fill overflow-hidden grid grid-rows-[auto_auto] content-evenly lg:content-stretch lg:grid-rows-1 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,19rem)]" style={pieceImage(theme, 'background') ? boardGround(theme) : { background: PK.sky }}>
          {/* Classic's world: the paper-craft park (approved mockup, 2026-11-24). */}
          {!pieceImage(theme, 'background') && <ParkScene w={stage.w} h={stage.h} still={still} />}
          <h1 className="sr-only"><Title text={castleQuestManifest.name} /></h1>
          {/* The side panel (teacher, 2026-11-24: "stack in this order: leaderboard
              players, power up, die. remove how many squares to go"): the player
              rows with Butter on whose turn it is, the held power-up cards, then
              the die. Big screens: a column on the right. iPad portrait and
              small screens: one row under the board. */}
          <div className="relative z-20 row-start-2 lg:col-start-2 lg:row-start-1 min-w-0 min-h-0 flex items-center justify-center gap-3 px-3 pb-3 lg:flex-col lg:items-stretch lg:justify-start lg:gap-3 lg:pt-16 lg:pb-3 lg:pl-0 lg:pr-4">
            <Racers players={turns.players} now={phase === 'play' ? turns.turn : -1} shield={shield} wide={turns.players.length > 6} />
            {/* Held power-ups wait here until they are tapped (teacher, 2026-11-24); always the top layer. */}
            {tray}
            <div className="relative grid justify-items-center content-center gap-2 shrink-0 lg:pt-1">
              {dieButton(turns.players.length > 6 ? 'clamp(4rem, 13vh, 7rem)' : 'clamp(4.5rem, 17vh, 9rem)')}
              {boosted && <BoostTag boost={boost} potion={potion[me] ?? 0} still={still} />}
            </div>
          </div>
          <div ref={boardRef} className="relative z-10 lg:col-start-1 lg:row-start-1 row-start-1 min-h-0 min-w-0 select-none mt-12 mx-1 lg:mt-5 lg:mb-3 lg:ml-3 lg:mr-1" style={narrow ? { height: boardH } : undefined}>
            <BoardArt L={L} ox={ox} oy={oy} n={n} kinds={kinds} theme={theme} wobble={wobble} still={still} here={null} color={player ? TEAM_COLORS[player.colorIndex % TEAM_COLORS.length] : '#fff'} />
            {turns.players.map((p, i) => {
              const here = pos[i] ?? 0;
              const same = turns.players.map((_, k) => k).filter((k) => (pos[k] ?? 0) === here);
              const slot = same.indexOf(i);
              // Up to 10 pieces share a square in a small grid (teacher, 2026-11-16).
              // Up to 4 fan out side by side near full size (Art Director, 2026-11-25:
              // never shrunk to a dot); more share the square in a small grid.
              const fan = same.length > 1 && same.length <= 4;
              const per = fan ? same.length : Math.ceil(Math.sqrt(same.length)), lines = fan ? 1 : Math.ceil(same.length / per);
              const step = fan ? L.size * 0.3 : (L.size * 0.84) / Math.max(per, lines);
              const tok = fan ? L.size * 0.6 : same.length > 1 ? step * 1.02 : L.size * 0.72;
              // A pawn stands on its square, its foot a little above the middle (mockup).
              const lift = fan ? L.size * 0.2 : same.length > 1 ? L.size * 0.1 : L.size * 0.24;
              const off = same.length > 1 ? { x: ((slot % per) - (per - 1) / 2) * step, y: (Math.floor(slot / per) - (lines - 1) / 2) * step + (fan ? (slot % 2 ? -L.size * 0.06 : L.size * 0.06) : 0) } : { x: 0, y: 0 };
              const sp = at(here);
              const sw = swirl && swirl.lifted[i] ? swirl : null;
              const on = i === turns.turn && phase === 'play';
              const cx = box.w / 2, cy = box.h / 2, R = Math.min(box.w, box.h) * 0.22;
              const a0 = (i / turns.players.length) * Math.PI * 2;
              const dest = sw ? at(sw.to[i]) : sp;
              const ring = sw ? Array.from({ length: 9 }, (_, k) => ({ x: cx + Math.cos(a0 + k * 0.9) * R * (0.6 + k * 0.06), y: cy + Math.sin(a0 + k * 0.9) * R * 0.55 - R * 0.35 })) : [];
              return (
                <motion.div key={p.id} className="absolute pointer-events-none" aria-label={t('cq.pieceAt', { name: p.name })} style={{ width: tok, height: tok, zIndex: sw ? 30 : on ? 15 : 10, translateX: '-50%', translateY: '-50%' }}
                  animate={sw && !still
                    ? { left: [sp.x, ...ring.map((q) => q.x), dest.x], top: [sp.y, ...ring.map((q) => q.y), dest.y], rotate: [0, 720], scale: [1, 1.3, 1.3, 1] }
                    : { left: sp.x + off.x, top: sp.y + off.y - lift, rotate: 0, scale: 1 }}
                  transition={sw && !still ? { duration: 2.9, ease: 'easeInOut' } : { duration: still ? 0.01 : (hop.who === i ? hop.ms : 450) / 1000, ease: 'easeOut' }}>
                  <Token player={p} on={on} shield={shield[i]} still={still} hopKey={hop.who === i ? hop.k : 0} hopMs={hop.ms} />
                </motion.div>
              );
            })}
            <AnimatePresence>
              {puff && !still && (
                <motion.span key={puff.id} className="absolute pointer-events-none z-[9]" style={{ left: at(puff.at).x, top: at(puff.at).y + L.size * 0.1, translateX: '-50%', translateY: '-50%' }} initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.7 }} aria-hidden="true">
                  {[-1, 0, 1].map((d) => <motion.span key={d} className="absolute rounded-full bg-white/80 border border-[#1d1a33]/30" style={{ width: L.size * 0.22, height: L.size * 0.16 }} initial={{ x: -L.size * 0.11, y: 0, scale: 0.4 }} animate={{ x: -L.size * 0.11 + d * L.size * 0.35, y: -L.size * 0.08 - Math.abs(d) * 4, scale: 1.3 }} transition={{ duration: 0.6, ease: 'easeOut' }} />)}
                </motion.span>
              )}
              {swirl && !still && <Twister key={swirl.id} item={itemFor('tornado')} w={box.w} h={box.h} />}
              {banner && (
                <motion.div key={banner.id} className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-max max-w-[90%] grid justify-items-center gap-4 text-3xl sm:text-4xl text-center border-heavy border-border rounded-panel px-7 py-5 z-40 ${banner.bad ? 'bg-[var(--blush)]' : 'bg-surface'}`} style={{ ...CHICLE, boxShadow: 'var(--shadow-sticker-lg)' }}
                  initial={still ? { opacity: 0 } : { y: 30, opacity: 0, scale: 0.7 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ opacity: 0, y: 10 }} transition={still ? { duration: 0.01 } : POP_IN} role="dialog" aria-label={banner.text}>
                  <span className="flex items-center gap-2">{banner.icon === 'lose' && <HourglassHigh weight="fill" size={34} />}{banner.icon === 'again' && <ArrowsClockwise weight="bold" size={34} />}{banner.icon === 'shield' && <ShieldCheck weight="fill" size={34} />}<PopText text={banner.text} /></span>
                  <TapOk onTap={() => goRef.current?.()} />
                </motion.div>
              )}
              {thinking && player && !banner && (
                <motion.p key="thinking" className="absolute left-1/2 bottom-[6%] -translate-x-1/2 w-max max-w-[86%] text-2xl sm:text-3xl border-heavy border-border rounded-pill bg-surface px-5 py-1.5 pointer-events-none z-40" style={{ ...CHICLE, boxShadow: 'var(--shadow-sticker)' }}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: still ? 0.01 : 0.5 }} role="status">
                  {t('cpu.thinking', { name: player.name })}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-30 [&_button]:!w-11 [&_button]:!h-11">
            {/* One order everywhere (Brand Kit, 2026-11-24): Hint, Settings, Full screen, Close. */}
            <HintButton gameId="castle-quest" />
            <GearButton small onClick={() => setSettingsOpen(true)} />
            <FullScreenButton small />
            <CloseGameButton />
          </div>
          <AnimatePresence>
            {toss && <DieToss key={toss.id} rolls={toss.rolls} wait={toss.wait} still={still} theme={theme} onGo={() => goRef.current?.()} />}
            {wheel && <Wheel key={wheel.id} spin={wheel} still={still} onTap={() => goRef.current?.()} />}
          </AnimatePresence>
        </div>
      )}
      {picker}
      {question && player && phase === 'play' && <ShareQuestion key={question.q.id} question={question.q} player={player} cpuLevel={team.level} onResult={onResult} />}
      {phase === 'end' && turns && (
        <ResultsModal winners={winner ? [winner] : undefined} title={winner ? t('cq.won', { name: winner.name }) : t('share.tie')} missed={missed} againLabel={t('share.again')} onAgain={() => setPhase('welcome')}>
          <p className="font-display text-xl font-bold flex items-center gap-2 justify-center"><Trophy weight="fill" size={24} />{t('cq.built')}</p>
        </ResultsModal>
      )}
      <PowerUpPop pop={pop} onDone={() => { if (goRef.current) goRef.current(); else setPop(null); }} />
    </main>
    </ThemedPage>
  );
}

// A player's piece: a bright crayon pawn in their team color (approved
// mockup, 2026-11-24) on a little shadow, hopping; a theme's team piece or the
// player's own picture wins (one picture, the same on the board and the rows).
function Token({ player, on, shield, still, hopKey, hopMs }: { player: TurnPlayer; on: boolean; shield: boolean; still: boolean; hopKey: number; hopMs: number }) {
  const [size, setSize] = useState(40);
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => { const el = ref.current; if (el && Math.abs(el.offsetWidth - size) > 0.5) setSize(el.offsetWidth); });
  return (
    <div ref={ref} className={`relative w-full h-full ${!on && !still ? 'cq-idle' : ''}`} style={{ animationDelay: `${-(player.colorIndex * 0.37) % 2}s` }}>
      <span className="absolute left-1/2 bottom-[-8%] w-[80%] h-[22%] -translate-x-1/2 rounded-[50%] bg-black/25" />
      <motion.div key={hopKey} className="absolute inset-0 grid place-items-center" initial={false}
        animate={!still && hopKey ? { y: ['0%', `-${45 + ((hopKey * 37) % 20)}%`, '0%', '0%'], rotate: [0, ((hopKey * 53) % 15) - 7, 0, 0], scaleY: [1, 1.08, 0.82, 1], scaleX: [1, 0.94, 1.12, 1] } : { y: '0%' }}
        transition={{ duration: Math.max(0.08, hopMs / 1000), times: [0, 0.45, 0.8, 1], ease: 'easeOut' }} style={{ transformOrigin: '50% 100%' }}>
        {/* Whose turn: the pawn glows Lemon (mockup), the row beside the board is Butter. */}
        <motion.span className="grid place-items-center" animate={on && !still ? { filter: [`drop-shadow(0 0 4px ${PK.lemon}) drop-shadow(0 0 8px ${PK.lemon})`, `drop-shadow(0 0 7px ${PK.lemon}) drop-shadow(0 0 16px ${PK.lemon})`, `drop-shadow(0 0 4px ${PK.lemon}) drop-shadow(0 0 8px ${PK.lemon})`] } : { filter: on ? `drop-shadow(0 0 6px ${PK.lemon})` : 'drop-shadow(0 0 0 rgba(0,0,0,0))' }}
          transition={on && !still ? { duration: 1.4, repeat: Infinity } : { duration: 0.2 }}>
          <Piece player={player} size={size} />
        </motion.span>
        {shield && <span className={`absolute -inset-[18%] rounded-full border-[4px] border-[#4ba3e8] ${still ? '' : 'cq-glow'}`} aria-label={t('cq.shielded')} />}
      </motion.div>
    </div>
  );
}

// The player's picture: their own art, a theme's team piece, or Classic's crayon pawn.
function Piece({ player, size }: { player: TurnPlayer; size: number }) {
  const themed = useContext(TeamArt)[player.colorIndex % 10];
  if (player.art) return <img src={player.art} alt="" aria-hidden="true" className="object-contain shrink-0" style={{ width: size, height: size }} />;
  if (themed) return <TeamBadge colorIndex={player.colorIndex} size={size} />;
  return <CrayonPawn color={TEAM_COLORS[player.colorIndex % TEAM_COLORS.length]} size={size} />;
}

// The player rows beside the board (Brand Kit scoreboard row, teacher
// 2026-11-24): the pawn and the whole name, Butter for whose turn it is (the
// only turn signal), no points and no "squares to go" (the pawns show the race).
function Racers({ players, now, shield, wide }: { players: TurnPlayer[]; now: number; shield: boolean[]; wide: boolean }) {
  const cur = players[now];
  return (
    <div className="min-w-0 shrink lg:shrink-0 max-lg:flex-1 max-lg:max-w-[26rem]">
      <ol className={`list-none m-0 p-0 grid gap-1.5 lg:gap-2 ${players.length > 4 ? 'grid-cols-2' : 'grid-cols-1'} ${wide ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`} aria-label={t('share.scores')}>
        {players.map((p, i) => (
          <li key={p.id} aria-current={i === now ? 'true' : undefined} className={`min-w-0 flex items-center gap-2 rounded-input border-std border-border px-2 ${wide ? 'py-1' : 'py-1 lg:py-1.5'}`}
            style={{ background: i === now ? 'var(--butter)' : 'var(--paper)', boxShadow: '0 3px 0 var(--color-border)' }}>
            <span className="shrink-0 grid place-items-center" style={{ width: wide ? '1.6rem' : '2.25rem', height: wide ? '1.6rem' : '2.25rem' }}><Piece player={p} size={wide ? 26 : 36} /></span>
            <span className={`flex-1 min-w-0 font-bold leading-tight ${wide ? 'text-xs' : 'text-sm lg:text-base'}`}>{p.name}</span>
            {shield[i] && <ShieldCheck weight="fill" size={18} className="shrink-0 text-[#4ba3e8]" aria-label={t('cq.shielded')} />}
          </li>
        ))}
      </ol>
      {cur && <p className="sr-only" aria-live="polite">{t('share.whoseTurn', { name: cur.name })}</p>}
    </div>
  );
}

// The throw: the die (or two) tumbles in over the board, big, bounces and
// lands, then waits there until it is tapped (no number under it: the
// student counts the dots, teacher 2026-11-13).
function DieToss({ rolls, wait, still, theme, onGo }: { rolls: number[]; wait: boolean; still: boolean; theme: GameTheme; onGo: () => void }) {
  const [landed, setLanded] = useState(still);
  useEffect(() => { if (still) return; const id = window.setTimeout(() => setLanded(true), 1150 + (rolls.length - 1) * 500); return () => window.clearTimeout(id); }, [still, rolls.length]);
  const size = rolls.length > 1 ? 'min(30vmin, 220px)' : 'min(40vmin, 300px)';
  return (
    <motion.div className={`absolute inset-0 z-40 grid place-items-center ${wait ? 'cursor-pointer' : 'pointer-events-none'}`} onClick={wait ? onGo : undefined}
      initial={{ backgroundColor: 'rgba(36,28,61,0)' }} animate={{ backgroundColor: 'rgba(36,28,61,0.35)' }} exit={{ opacity: 0 }}>
      <div className="flex gap-8">
        {rolls.map((r, k) => (
          <motion.button key={k} type="button" disabled={!wait} onClick={onGo} aria-label={t('cq.dieShows', { n: r })} className="rounded-[18%]"
            initial={still ? false : { x: k ? 300 : -300, y: -260, rotate: k ? 60 : -60, scale: 0.6 }}
            animate={still ? undefined : wait ? { x: 0, y: [0, -8, 0], rotate: 360 + (k ? 6 : -6), scale: [1, 1.04, 1] } : { x: [k ? 300 : -300, k ? 40 : -60, 0], y: [-260, 30, -40, 0], rotate: [k ? 60 : -60, 250, 340, 360 + (k ? 6 : -6)], scale: [0.6, 1.15, 1] }}
            transition={wait ? { duration: 1.2, repeat: Infinity } : { duration: 1.1, delay: k * 0.5, times: [0, 0.45, 0.75, 1], ease: 'easeOut' }}
            whileHover={wait && !still ? { scale: 1.08 } : undefined}
            style={{ width: size, height: size, filter: wait ? 'drop-shadow(0 0 18px #fff1b8)' : undefined }}>
            <span className="block w-full h-full [&>span]:!w-full [&>span]:!h-full [&_svg]:w-full [&_svg]:h-full"><Die2D value={r} size={300} rolling={!landed} theme={theme} /></span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ---- The wheel: half forward, half back; a pointer at the top --------------
function Wheel({ spin, still, onTap }: { spin: { stop: number; forward: boolean; n: number; name: string; done: boolean; spinning: boolean }; still: boolean; onTap: () => void }) {
  const size = 'min(62vmin, 440px)';
  return (
    <motion.div className={`absolute inset-0 z-40 grid place-items-center bg-ink-night/40 ${!spin.spinning || spin.done ? 'cursor-pointer' : ''}`} onClick={!spin.spinning || spin.done ? onTap : undefined} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="status" aria-live="polite"
      aria-label={spin.done ? t(spin.forward ? 'cq.wheelForward' : 'cq.wheelBack', { name: spin.name, n: spin.n }) : t('cq.wheelSpinning')}>
      <div className="grid justify-items-center gap-3">
        <p className="text-3xl bg-surface border-heavy border-border rounded-pill px-5 py-1" style={{ ...CHICLE, boxShadow: 'var(--shadow-sticker)' }}>{spin.name}: {spin.n}</p>
        <motion.div className="relative" style={{ width: size, height: size }} whileHover={!spin.spinning && !still ? { scale: 1.04 } : undefined}
          animate={!spin.spinning && !still ? { rotate: [0, -4, 4, 0] } : { rotate: 0 }} transition={!spin.spinning ? { duration: 1.4, repeat: Infinity } : { duration: 0.2 }}>
          <motion.svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full drop-shadow-[0_6px_0_rgba(0,0,0,0.35)]" initial={{ rotate: 0 }} animate={{ rotate: !spin.spinning ? 0 : still ? spin.stop % 360 : spin.stop }}
            transition={{ duration: still || !spin.spinning ? 0.01 : 4, ease: [0.15, 0.85, 0.25, 1] }}>
            <circle cx="100" cy="100" r="96" fill={C.ink} />
            <path d="M100 100 L100 8 A92 92 0 0 1 100 192 Z" fill={C.sage} opacity={spin.done && !spin.forward ? 0.35 : 1} />
            <path d="M100 100 L100 192 A92 92 0 0 1 100 8 Z" fill={C.red} opacity={spin.done && spin.forward ? 0.35 : 1} />
            {Array.from({ length: 12 }, (_, k) => <line key={k} x1="100" y1="100" x2={100 + 92 * Math.sin((k * Math.PI) / 6)} y2={100 - 92 * Math.cos((k * Math.PI) / 6)} stroke="#fffaf0" strokeWidth="1" opacity="0.35" />)}
            <text x="148" y="106" textAnchor="middle" fontSize="20" fill="#fffaf0" stroke={C.ink} strokeWidth="0.8" style={CHICLE} transform="rotate(90 148 100)">{t('cq.forward')}</text>
            <text x="52" y="106" textAnchor="middle" fontSize="20" fill="#fffaf0" stroke={C.ink} strokeWidth="0.8" style={CHICLE} transform="rotate(-90 52 100)">{t('cq.back')}</text>
            <circle cx="100" cy="100" r="16" fill={C.yellow} stroke={C.ink} strokeWidth="4" />
            {Array.from({ length: 16 }, (_, k) => <circle key={`b${k}`} cx={100 + 88 * Math.sin((k * Math.PI) / 8)} cy={100 - 88 * Math.cos((k * Math.PI) / 8)} r="3" fill="#fffaf0" className={still ? '' : 'cq-blink'} style={{ animationDelay: `${k * 0.08}s` }} />)}
          </motion.svg>
          {/* The pointer at the top. */}
          <svg viewBox="0 0 40 44" className="absolute left-1/2 -top-[6%] -translate-x-1/2 w-[14%]" aria-hidden="true"><path d="M4 4 H36 L20 40 Z" fill={C.yellow} stroke={C.ink} strokeWidth="4" strokeLinejoin="round" /></svg>
          {!spin.spinning && <button type="button" onClick={(e) => { e.stopPropagation(); onTap(); }} aria-label={t('cq.wheelSpin')} className="absolute inset-0 rounded-full" />}
        </motion.div>
        <AnimatePresence>
          {spin.done && (
            <motion.p className="text-4xl bg-surface border-heavy border-border rounded-pill px-6 py-1" style={{ ...CHICLE, boxShadow: 'var(--shadow-sticker)', color: spin.forward ? '#22b04a' : C.red }}
              initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: [0.3, 1.2, 1], opacity: 1 }} transition={{ duration: 0.4 }}>
              {t(spin.forward ? 'cq.wheelForward' : 'cq.wheelBack', { name: spin.name, n: spin.n })}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// The tornado itself, sweeping across the board while the pieces swirl.
function Twister({ item, w, h }: { item: ThemeItem; w: number; h: number }) {
  const s = Math.min(w, h) * 0.55;
  return (
    <motion.div className="absolute z-20 pointer-events-none" style={{ width: s, height: s, top: h / 2 - s * 0.6 }}
      initial={{ left: -s, opacity: 0 }} animate={{ left: [-s, w * 0.2, w / 2 - s / 2, w * 0.6, w + s], opacity: [0, 1, 1, 1, 0], rotate: [0, -8, 8, -6, 0], scale: [0.7, 1.1, 1.25, 1.1, 0.8] }}
      exit={{ opacity: 0 }} transition={{ duration: 3, ease: 'easeInOut' }}>
      <motion.span className="block w-full h-full" animate={{ scaleX: [1, -1, 1] }} transition={{ duration: 0.5, repeat: Infinity }}><ItemArt item={item} size={s} still /></motion.span>
    </motion.div>
  );
}

function BoostTag({ boost, potion, still }: { boost: { double: boolean; x2: boolean }; potion: number; still: boolean }) {
  const text = boost.double ? t('cq.boostTwice') : boost.x2 || potion > 0 ? t('cq.boostDouble') : '';
  return <motion.span className="text-xl px-3 py-0.5 rounded-pill border-bold border-border bg-accent" style={CHICLE} animate={still ? undefined : { scale: [1, 1.12, 1], rotate: [0, -3, 3, 0] }} transition={{ duration: 0.9, repeat: Infinity }}>{text}</motion.span>;
}

// A small picture of each board length: the same box, more squares
// (teacher, 2026-11-18: "show board grid sizes").
function TrailMock({ n }: { n: number }) {
  const W = 96, H = 64, L = layout(n, W - 6, H - 6);
  const s = L.size, ox = (W - L.cols * s) / 2, oy = (H - L.rows * s) / 2;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className="rounded-md border-thin border-border" style={{ background: C.cream }}>
      {L.cells.map((c, i) => <rect key={i} x={ox + c.x * s + 0.6} y={oy + c.y * s + 0.6} width={s - 1.2} height={s - 1.2} rx={1} fill={i === 0 ? C.mint : i === n - 1 ? C.yellow : SQUARE_COLORS[i % 4]} stroke={C.ink} strokeWidth={0.5} />)}
    </svg>
  );
}
