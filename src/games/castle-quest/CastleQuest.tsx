import '@fontsource/chicle/400.css';
import { impact } from '../../engine/impact';
import { playClip, POWER_SOUNDS } from '../../engine/music';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { pace } from '../../engine/pace';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowsClockwise, CheckCircle, DiceFive, FlagCheckered, HourglassHigh, ShieldCheck, Star, Trophy } from '@phosphor-icons/react';
import { data, newId } from '../../data';
import { LIBRARY } from '../../data/library';
import { useMySets } from '../../data/hooks';
import type { MultipleChoiceQuestion } from '../../data/types';
import { buzz, playEffect } from '../../engine/feedback';
import { makeDeck } from '../../engine/picker';
import ResultsModal from '../../engine/ResultsModal';
import ShareQuestion from '../../engine/ShareQuestion';
import TeamSetup from '../../engine/TeamSetup';
import { TeamBadge } from '../../engine/TeamBadge';
import { current, nextTurn, setScores, startTurns, TEAM_COLORS, type CpuLevel, type TurnPlayer, type TurnState } from '../../engine/turns';
import { PowerUpTray, roleOf, useHeldPowerUps } from '../../engine/HeldPowerUps';
import { powerUpSwitches } from '../../engine/PowerUpSwitches';
import PowerUpPop from '../../engine/PowerUpPop';
import { t } from '../../i18n';
import { AccessButton, FullScreenButton, GameTopRow, GearButton, SettingsPanel } from '../../settings/SettingsPanel';
import { useSettings } from '../../settings/SettingsContext';
import { useGamePool } from '../../student/session';
import { pieceImage } from '../../theme/library';
import { ThemedPage, useGameTheme } from '../../theme/useGameTheme';
import type { GameTheme, ThemeItem } from '../../theme/types';
import ItemArt from '../../theme/ItemArt';
import { ChoiceTiles } from '../../ui/fields';
import { buttonClasses } from '../../ui/kit';
import Title from '../../ui/Title';
import PopText from '../../ui/PopText';
import GameWelcome from '../GameWelcome';
import SetPicker from '../SetPicker';
import SetupWizard from '../SetupWizard';
import ThemeScreen from '../ThemeScreen';
import WayToPlay from '../WayToPlay';
import { useSavedSetup } from '../useSavedSetup';
import { castleQuestManifest } from './manifest';
import { layout, placePowers, POWERS, roll, spaceKinds, tornadoSpots, TRAIL_SPACES, trailOf, TRAILS, wheelStop, type Layout, type Power, type SpaceKind } from './board';

type Phase = 'welcome' | 'theme' | 'setup' | 'play' | 'end';
type Step = 'question' | 'roll' | 'busy' | 'pick';
const JUMP = '/sounds/board/jump.mp3';
const DICE = '/sounds/board/dice.mp3';
// The vision board palette (teacher, 2026-11-08): light blue, yellow, red,
// sage, cream, blush and charcoal, with Chicle for the board's words.
const C = { blue: '#BCD9E2', yellow: '#F9CC14', red: '#D35252', sage: '#9AB582', cream: '#F1DFBB', blush: '#FAE9DF', ink: '#474241' };
const SQUARE_COLORS = [C.blue, C.yellow, C.red, C.sage];
const CHICLE: CSSProperties = { fontFamily: "'Chicle', 'Grow Year', system-ui, sans-serif" };
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
  const [setup, change] = useSavedSetup('castle-quest', { setId: LIBRARY[0].id, who: 'teams' as 'teams' | 'versus', powerUps: true, trail: 'medium' as string, powerOff: [] as string[] });
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
  const [toss, setToss] = useState<{ id: number; rolls: number[]; mult: number } | null>(null);
  const [wheel, setWheel] = useState<{ id: number; stop: number; forward: boolean; n: number; name: string; done: boolean } | null>(null);
  const [shield, setShield] = useState<boolean[]>([]);
  const [skip, setSkip] = useState<boolean[]>([]);
  const [potion, setPotion] = useState<number[]>([]); // doubled rolls left
  const [boost, setBoost] = useState<{ double: boolean; x2: boolean }>({ double: false, x2: false });
  const [banner, setBanner] = useState<{ id: number; text: string; icon?: 'lose' | 'again' | 'shield'; bad?: boolean } | null>(null);
  const [pop, setPop] = useState<{ id: number; item: ThemeItem; text: string } | null>(null);
  const [winner, setWinner] = useState<TurnPlayer | null>(null);
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
  const pad = 22;
  const L: Layout = useMemo(() => layout(n, Math.max(100, box.w - pad * 2), Math.max(100, box.h - pad * 2)), [n, box.w, box.h]);
  const ox = (box.w - L.cols * L.size) / 2, oy = (box.h - L.rows * L.size) / 2;
  const at = (i: number) => { const c = L.cells[Math.max(0, Math.min(n - 1, i))]; return { x: ox + (c.x + 0.5) * L.size, y: oy + (c.y + 0.5) * L.size }; };
  // A little wobble per square, the same all game (surprise and irregularity).
  const wobble = useMemo(() => Array.from({ length: 80 }, (_, i) => ({ r: ((i * 37) % 7) - 3, dx: ((i * 53) % 5) - 2, dy: ((i * 29) % 5) - 2 })), []);

  useEffect(() => { if (toss) playClip(DICE, settings, 0.8); }, [toss?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function say(text: string, icon?: 'lose' | 'again' | 'shield', bad = false) { setBanner({ id: Date.now() + Math.random(), text, icon, bad }); }
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
    const allowed = POWERS.filter((p) => !(setup.powerOff ?? []).includes(itemFor(p).id));
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
      say(t('cq.skipped', { name: p.name }), 'lose', true);
      await sleep(ms(1800));
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
    else { say(t('cq.nextTime')); void endTurn(); }
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
  }
  async function throwDie(count: number, mult: number) {
    const rolls = Array.from({ length: count }, () => roll());
    setToss({ id: Date.now(), rolls, mult });
    await sleep(still ? 500 : 1700 + (count - 1) * 500);
    setDie(rolls[rolls.length - 1]);
    playEffect('right', settings);
    await sleep(ms(900));
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
    await walk(me, Math.min(finish, posRef.current[me] + by));
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
    if (kind === 'lose') { setSkip((s) => s.map((v, k) => (k === who ? true : v))); playEffect('miss', settings); say(t('cq.loseTurn'), 'lose', true); await sleep(ms(1600)); return endTurn(); }
    if (kind === 'again') { playEffect('win', settings); impact(settings); say(t('cq.rollAgain'), 'again'); await sleep(ms(1300)); setStep('roll'); return; }
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
      await sleep(ms(1800));
      return;
    }
    held.earn(s.players[who].id, it);
    setPop({ id: Date.now(), item: it, text: t('pu.later', { role: roleOf(castleQuestManifest, it) }) });
    await sleep(ms(1800));
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
    say(t('cq.tornadoDone'));
    await sleep(ms(1300));
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
        say(t('cq.wheelPicks', { name: s.players[target].name }));
        await sleep(ms(1300));
      } else {
        setStep('pick');
        target = await new Promise<number>((res) => { pickRef.current = res; });
        pickRef.current = null;
        setStep('busy');
      }
    }
    const [n1] = await throwDie(1, 1);
    const forward = Math.random() < 0.5;
    setWheel({ id: Date.now(), stop: wheelStop(forward), forward, n: n1, name: s.players[target].name, done: false });
    playEffect('whoosh', settings);
    await sleep(still ? 500 : 4200);
    setWheel((w) => (w ? { ...w, done: true } : w));
    playEffect(forward ? 'win' : 'miss', settings);
    impact(settings);
    await sleep(ms(1500));
    setWheel(null);
    if (target !== me && shieldRef.current[target]) { say(t('cq.shieldBlocks'), 'shield'); await sleep(ms(1400)); setStep('roll'); return; }
    await walk(target, Math.max(0, Math.min(finish, posRef.current[target] + (forward ? n1 : -n1))));
    if (posRef.current.some((p) => p >= finish)) return endTurn();
    setStep('roll');
  }

  async function endTurn() {
    const s = turnsRef.current;
    if (!s) return;
    await sleep(ms(500));
    held.endTurn();
    const done = posRef.current.findIndex((p) => p >= finish);
    if (done >= 0) {
      setWinner(s.players[done]);
      playEffect('win', settings);
      impact(settings, true);
      if (settings.celebrations !== 'off' && !still) {
        void confetti({ particleCount: 160, spread: 110, origin: { x: 0.5, y: 0.3 }, colors: SQUARE_COLORS, disableForReducedMotion: true });
        window.setTimeout(() => void confetti({ particleCount: 120, spread: 80, origin: { x: 0.3, y: 0.4 }, colors: SQUARE_COLORS, disableForReducedMotion: true }), 500);
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

  // The computer rolls by itself.
  useEffect(() => {
    if (phase !== 'play' || player?.kind !== 'cpu' || step !== 'roll' || held.held.length) return;
    const id = window.setTimeout(() => void rollDie(), 1400 * pace(settings));
    return () => window.clearTimeout(id);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const tray = <PowerUpTray manifest={castleQuestManifest} items={held.held} onUse={(i) => void applyItem(i)} disabled={step !== 'roll'} />;
  const boosted = boost.double || boost.x2 || (potion[me] ?? 0) > 0;
  const rollLabel = boost.double ? t('cq.rollTwice') : boosted ? t('cq.rollDouble') : t('cq.roll');
  const rollButton = step === 'roll' && human && phase === 'play' && held.held.length === 0 && (
    <motion.button type="button" onClick={() => void rollDie()} className={buttonClasses('primary', 'h-14 !px-5 !text-xl w-full')}
      animate={still ? undefined : { scale: [1, 1.06, 1], rotate: [0, -1.5, 1.5, 0] }} transition={{ duration: 1.1, repeat: Infinity }} whileHover={still ? undefined : { scale: 1.1 }}>
      <DiceFive weight="fill" size={26} />{rollLabel}
    </motion.button>
  );
  const picker = step === 'pick' && turns && (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-[#241c3d]/35 p-4" role="dialog" aria-label={t('cq.wheelPick')}>
      <motion.div className="bg-surface border-[3px] border-border rounded-panel p-5 grid gap-4 justify-items-center max-w-[min(40rem,94vw)]" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}
        initial={still ? false : { scale: 0.6, rotate: -4 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 16 }}>
        <ItemArt item={itemFor('wheel')} size={72} still={still} />
        <p className="font-display text-2xl font-bold text-center">{t('cq.wheelPick')}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          {turns.players.map((p, i) => (
            <motion.button key={p.id} type="button" onClick={() => pickRef.current?.(i)} whileHover={still ? undefined : { y: -4, rotate: [0, -3, 3, 0] }}
              className="grid justify-items-center gap-1 rounded-panel border-[2.5px] border-border bg-surface-2 px-4 py-3 min-w-28 hover:bg-accent" aria-label={p.name}>
              <TeamBadge colorIndex={p.colorIndex} size={56} />
              <span className="font-bold">{p.name}</span>
              {shield[i] && i !== me && <ShieldCheck weight="fill" size={20} className="text-[#3d7fb8]" aria-label={t('cq.shielded')} />}
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
      {phase !== 'play' && phase !== 'end' && <GameTopRow onSettings={() => setSettingsOpen(true)} />}
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
          { id: 'way', title: t('way.title'), content: <WayToPlay modes={['share', 'versus']} value={versus ? 'versus' : 'share'} onChange={(m) => change({ who: m === 'versus' ? 'versus' : 'teams' })} /> },
          ...(game.assigned ? [] : [{ id: 'questions', title: t('setup.questions'), content: <SetPicker sets={sets} value={[setId]} onChange={(ids) => change({ setId: ids[0] })} /> }]),
          { id: 'options', title: t('setup.options'), content: (
            <>
              <ChoiceTiles label={t('cq.trail')} value={trailOf(setup.trail)} onChange={(v) => change({ trail: v })}
                options={TRAILS.map((tr) => ({ value: tr, label: t(`cq.trail.${tr}` as 'cq.trail.short'), tip: t(`cq.trailTip.${tr}` as 'cq.trailTip.short') }))} />
              {powerUpSwitches({ manifest: castleQuestManifest, theme, on: setup.powerUps, off: setup.powerOff ?? [], change })}
            </>
          ) },
          versus
            ? { id: 'players', title: t('setup.players'), ready: team.players.length === 2, content: <TeamSetup key="versus" mode="versus" min={2} max={2} embedded onChange={(ps, level) => setTeam({ players: ps, level })} /> }
            : { id: 'teams', title: t('setup.teams'), ready: team.players.length > 0, content: <TeamSetup key="share" mode="share" min={1} max={6} embedded onChange={(ps, level) => setTeam({ players: ps, level })} /> },
        ]} />
      )}
      {(phase === 'play' || phase === 'end') && turns && (
        <div className="relative play-fill overflow-hidden grid grid-rows-[auto_1fr_auto] lg:grid-rows-1 lg:grid-cols-[1fr_290px]" style={boardGround(theme)}>
          <h1 className="sr-only"><Title text={castleQuestManifest.name} /></h1>
          {/* Players: a round badge each, like every other game (teacher, 2026-11-08). */}
          <div className="lg:col-start-2 lg:row-start-1 p-2 lg:pt-16 lg:pr-3 pr-40 lg:pl-0 grid gap-3 content-start min-w-0 z-10">
            <Race turns={turns} pos={pos} finish={finish} playing={phase === 'play'} shield={shield} skip={skip} still={still} />
            <div className="hidden lg:grid bg-surface border-[2.5px] border-border rounded-panel p-3 gap-3 justify-items-center" style={{ boxShadow: 'var(--shadow-sticker)' }}>
              <Die2D value={die} size={84} rolling={false} theme={theme} />
              {boosted && <BoostTag boost={boost} potion={potion[me] ?? 0} still={still} />}
              {rollButton}
            </div>
          </div>
          <div ref={boardRef} className="relative lg:col-start-1 lg:row-start-1 min-h-0 min-w-0 select-none">
            <BoardArt L={L} ox={ox} oy={oy} n={n} kinds={kinds} theme={theme} wobble={wobble} still={still} here={phase === 'play' && player ? pos[me] : null} color={player ? TEAM_COLORS[player.colorIndex % TEAM_COLORS.length] : '#fff'} />
            {turns.players.map((p, i) => {
              const here = pos[i] ?? 0;
              const same = turns.players.map((_, k) => k).filter((k) => (pos[k] ?? 0) === here);
              const slot = same.indexOf(i);
              const tok = L.size * (same.length > 1 ? 0.44 : 0.6);
              const off = same.length > 1 ? { x: ((slot % 2) - 0.5) * L.size * 0.42, y: (Math.floor(slot / 2) - (same.length > 2 ? 0.5 : 0)) * L.size * 0.42 } : { x: 0, y: 0 };
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
                    : { left: sp.x + off.x, top: sp.y + off.y, rotate: 0, scale: 1 }}
                  transition={sw && !still ? { duration: 2.9, ease: 'easeInOut' } : { duration: still ? 0.01 : (hop.who === i ? hop.ms : 450) / 1000, ease: 'easeOut' }}>
                  <Token player={p} on={on} shield={shield[i]} still={still} hopKey={hop.who === i ? hop.k : 0} hopMs={hop.ms} />
                </motion.div>
              );
            })}
            <AnimatePresence>
              {swirl && !still && <Twister key={swirl.id} item={itemFor('tornado')} w={box.w} h={box.h} />}
              {banner && (
                <motion.p key={banner.id} className={`absolute left-1/2 bottom-[6%] -translate-x-1/2 w-max max-w-[86%] flex items-center gap-2 text-2xl sm:text-3xl border-[3px] border-border rounded-pill px-5 py-1.5 pointer-events-none z-40 ${banner.bad ? 'bg-[#ffd6cc]' : 'bg-surface'}`} style={{ ...CHICLE, boxShadow: 'var(--shadow-sticker)' }}
                  initial={{ y: 30, opacity: 0, scale: 0.7, rotate: -4 }} animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ type: 'spring', stiffness: 380, damping: 18, duration: still ? 0.01 : undefined }}
                  onAnimationComplete={() => { const id = banner.id; window.setTimeout(() => setBanner((b) => (b?.id === id ? null : b)), 1600); }} role="status">
                  {banner.icon === 'lose' && <HourglassHigh weight="fill" size={30} />}{banner.icon === 'again' && <ArrowsClockwise weight="bold" size={30} />}{banner.icon === 'shield' && <ShieldCheck weight="fill" size={30} />}<PopText text={banner.text} />
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          {/* Small screens: the die and the roll button along the bottom. */}
          <div className="lg:hidden p-2 flex items-center justify-center gap-3 z-10">
            <div className="bg-surface/95 border-[2.5px] border-border rounded-panel px-3 py-2 flex items-center gap-3" style={{ boxShadow: 'var(--shadow-sticker)' }}>
              <Die2D value={die} size={52} rolling={false} theme={theme} />
              {boosted && <BoostTag boost={boost} potion={potion[me] ?? 0} still={still} />}
              {rollButton && <div className="w-56">{rollButton}</div>}
            </div>
          </div>
          <div className="absolute top-3 right-3 flex items-center gap-2 z-30 [&_button]:!w-11 [&_button]:!h-11">
            <FullScreenButton small />
            <AccessButton small />
            <GearButton small onClick={() => setSettingsOpen(true)} />
          </div>
          <AnimatePresence>
            {toss && <DieToss key={toss.id} rolls={toss.rolls} mult={toss.mult} still={still} theme={theme} />}
            {wheel && <Wheel key={wheel.id} spin={wheel} still={still} />}
          </AnimatePresence>
        </div>
      )}
      {tray}
      {picker}
      {question && player && phase === 'play' && <ShareQuestion key={question.q.id} question={question.q} player={player} cpuLevel={team.level} onResult={onResult} />}
      {phase === 'end' && turns && (
        <ResultsModal winners={winner ? [winner] : undefined} title={winner ? t('cq.won', { name: winner.name }) : t('share.tie')} missed={missed} againLabel={t('share.again')} onAgain={() => setPhase('welcome')}>
          <p className="font-display text-xl font-bold flex items-center gap-2 justify-center"><Trophy weight="fill" size={24} />{t('cq.built')}</p>
        </ResultsModal>
      )}
      <PowerUpPop pop={pop} onDone={() => setPop(null)} />
    </main>
    </ThemedPage>
  );
}

// The ground behind the board: the theme's background, or Classic's cream
// with a soft dotted pattern like an old board-game box.
function boardGround(theme: GameTheme): CSSProperties {
  const bg = pieceImage(theme, 'background');
  if (bg) return { background: `center / cover no-repeat url("${bg}")` };
  return { backgroundColor: C.cream, backgroundImage: `radial-gradient(${C.blush} 18%, transparent 19%), radial-gradient(${C.blush} 18%, transparent 19%)`, backgroundSize: '28px 28px', backgroundPosition: '0 0, 14px 14px' };
}

// ---- The board --------------------------------------------------------------

function BoardArt({ L, ox, oy, n, kinds, theme, wobble, still, here, color }: { L: Layout; ox: number; oy: number; n: number; kinds: SpaceKind[]; theme: GameTheme; wobble: { r: number; dx: number; dy: number }[]; still: boolean; here: number | null; color: string }) {
  const s = L.size;
  const used = new Set(L.cells.map((c) => `${c.x},${c.y}`));
  const art = { regular: pieceImage(theme, 'space'), lose: pieceImage(theme, 'space-lose'), again: pieceImage(theme, 'space-again'), start: pieceImage(theme, 'start'), finish: pieceImage(theme, 'finish') };
  // The empty spots between the lanes get little doodles that bob.
  const blanks: { x: number; y: number; k: number }[] = [];
  for (let y = 1; y < L.rows; y += 2) for (let x = 0; x < L.cols; x++) if (!used.has(`${x},${y}`) && (x * 7 + y * 3) % 3 === 0) blanks.push({ x, y, k: x * 11 + y });
  return (
    <div className="absolute inset-0" role="img" aria-label={t('cq.board', { n })}>
      {/* The board: one rounded panel with a charcoal edge, like a printed board. */}
      <div className="absolute rounded-[22px] border-[4px]" style={{ left: ox - 10, top: oy - 10, width: L.cols * s + 20, height: L.rows * s + 20, borderColor: C.ink, background: pieceImage(theme, 'background') ? 'rgba(255,253,246,0.55)' : C.blush, boxShadow: `0 6px 0 ${C.ink}` }} />
      {blanks.map((b) => (
        <span key={`d${b.k}`} className={`absolute grid place-items-center ${still ? '' : 'cq-bob'}`} style={{ left: ox + b.x * s, top: oy + b.y * s, width: s, height: s, animationDelay: `${-(b.k % 7) * 0.4}s` }} aria-hidden="true">
          {b.k % 3 === 0 ? <Star weight="fill" size={s * 0.38} color={C.yellow} /> : b.k % 3 === 1 ? <svg width={s * 0.5} height={s * 0.3} viewBox="0 0 50 30"><path d="M10 26 Q0 26 2 18 Q4 10 12 12 Q16 2 27 4 Q37 4 39 13 Q49 12 48 20 Q48 26 40 26 Z" fill="#fff" stroke={C.ink} strokeWidth="2" /></svg> : <svg width={s * 0.34} height={s * 0.34} viewBox="0 0 30 30"><circle cx="15" cy="15" r="5" fill={C.yellow} stroke={C.ink} strokeWidth="1.6" />{[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={15 + Math.cos((a * Math.PI) / 180) * 9} cy={15 + Math.sin((a * Math.PI) / 180) * 9} r="5" fill={C.red} stroke={C.ink} strokeWidth="1.6" />)}</svg>}
        </span>
      ))}
      {L.cells.map((c, i) => {
        const w = wobble[i % wobble.length];
        const kind: SpaceKind | 'start' | 'finish' = i === 0 ? 'start' : i === n - 1 ? 'finish' : kinds[i] ?? 'regular';
        const img = art[kind];
        const fill = kind === 'start' ? C.sage : kind === 'finish' ? C.yellow : kind === 'lose' ? C.ink : kind === 'again' ? C.cream : SQUARE_COLORS[i % SQUARE_COLORS.length];
        const lit = here === i;
        return (
          <div key={i} className="absolute tile-wiggle" style={{ left: ox + c.x * s + s * 0.05 + w.dx, top: oy + c.y * s + s * 0.05 + w.dy, width: s * 0.9, height: s * 0.9, transform: `rotate(${w.r}deg)` }}>
            <div className={`w-full h-full rounded-[16%] border-[3px] grid place-items-center overflow-hidden ${lit && !still ? 'cq-glow' : ''}`}
              style={{ borderColor: C.ink, background: img ? `center / cover url("${img}")` : fill, boxShadow: lit ? `0 0 0 4px ${color}, 0 0 16px 4px ${color}` : `0 3px 0 ${C.ink}` }}>
              {!img && kind === 'start' && <span className="text-[#fffdf6] leading-none" style={{ ...CHICLE, fontSize: s * 0.26, WebkitTextStroke: `1px ${C.ink}` }}>{t('cq.startWord')}</span>}
              {!img && kind === 'finish' && <span className="grid justify-items-center leading-none" style={{ ...CHICLE, fontSize: s * 0.22, color: C.ink }}><FlagCheckered weight="fill" size={s * 0.4} />{t('cq.finishWord')}</span>}
              {!img && kind === 'lose' && <span className="grid justify-items-center leading-none text-center" style={{ ...CHICLE, fontSize: s * 0.15, color: C.cream }}><HourglassHigh weight="fill" size={s * 0.42} color={C.yellow} />{t('cq.loseWord')}</span>}
              {!img && kind === 'again' && <span className="grid justify-items-center leading-none text-center" style={{ ...CHICLE, fontSize: s * 0.15, color: C.ink }}><ArrowsClockwise weight="bold" size={s * 0.42} color={C.red} className={still ? '' : 'cq-spin-slow'} />{t('cq.againWord')}</span>}
              {!img && kind === 'regular' && <span className="w-[30%] h-[30%] rounded-full opacity-35" style={{ background: '#fffdf6' }} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// A player's piece: their round team badge on a little shadow, hopping.
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
        <motion.span className="rounded-full" animate={on && !still ? { boxShadow: ['0 0 0 3px #fdfd94, 0 0 10px 3px #fdfd94', '0 0 0 5px #fdfd94, 0 0 20px 8px #fdfd94', '0 0 0 3px #fdfd94, 0 0 10px 3px #fdfd94'] } : { boxShadow: on ? '0 0 0 4px #fdfd94' : '0 2px 0 rgba(0,0,0,0.35)' }}
          transition={on && !still ? { duration: 1.4, repeat: Infinity } : { duration: 0.2 }}>
          <TeamBadge colorIndex={player.colorIndex} size={size} />
        </motion.span>
        {shield && <span className={`absolute -inset-[18%] rounded-full border-[3px] border-[#7fc4ff] bg-[radial-gradient(circle,transparent_55%,rgba(127,196,255,0.5))] ${still ? '' : 'cq-glow'}`} aria-label={t('cq.shielded')} />}
      </motion.div>
    </div>
  );
}

// ---- The die: a flat classic die; a theme draws all six sides on one strip --

const PIPS: Record<number, [number, number][]> = { 1: [[50, 50]], 2: [[28, 28], [72, 72]], 3: [[26, 26], [50, 50], [74, 74]], 4: [[28, 28], [72, 28], [28, 72], [72, 72]], 5: [[26, 26], [74, 26], [50, 50], [26, 74], [74, 74]], 6: [[28, 24], [72, 24], [28, 50], [72, 50], [28, 76], [72, 76]] };
function Die2D({ value, size, rolling, theme }: { value: number; size: number; rolling: boolean; theme: GameTheme }) {
  const [face, setFace] = useState(value);
  useEffect(() => {
    if (!rolling) { setFace(value); return; }
    const id = window.setInterval(() => setFace((f) => 1 + ((f + 1 + Math.floor(Math.random() * 4)) % 6)), 85);
    return () => window.clearInterval(id);
  }, [rolling, value]);
  const strip = pieceImage(theme, 'dice');
  return (
    <span role="img" aria-label={rolling ? t('cq.dieRolling') : t('cq.dieShows', { n: value })} className="inline-block shrink-0" style={{ width: size, height: size }}>
      {strip
        ? <span className="block w-full h-full rounded-[18%]" style={{ backgroundImage: `url("${strip}")`, backgroundSize: '600% 100%', backgroundPosition: `${(face - 1) * 20}% 0` }} />
        : <svg viewBox="0 0 100 100" width={size} height={size}>
            <rect x="5" y="9" width="90" height="88" rx="18" fill={C.ink} />
            <rect x="5" y="4" width="90" height="88" rx="18" fill="#fffdf6" stroke={C.ink} strokeWidth="4" />
            {PIPS[face].map(([x, y], k) => <circle key={k} cx={x} cy={y - 2} r={face === 1 ? 12 : 9} fill={face === 1 ? C.red : C.ink} />)}
          </svg>}
    </span>
  );
}
// The throw: the die (or two) tumbles in over the board, bounces, lands.
function DieToss({ rolls, mult, still, theme }: { rolls: number[]; mult: number; still: boolean; theme: GameTheme }) {
  const [landed, setLanded] = useState(still);
  useEffect(() => { if (still) return; const id = window.setTimeout(() => setLanded(true), 1150 + (rolls.length - 1) * 500); return () => window.clearTimeout(id); }, [still, rolls.length]);
  const sum = rolls.reduce((a, r) => a + r, 0);
  const label = rolls.length > 1 ? `${rolls.join(' + ')}${mult > 1 ? ` x ${mult}` : ''} = ${sum * mult}` : mult > 1 ? `${sum} x ${mult} = ${sum * mult}` : String(sum);
  return (
    <motion.div className="absolute inset-0 z-40 grid place-items-center pointer-events-none" initial={{ backgroundColor: 'rgba(36,28,61,0)' }} animate={{ backgroundColor: 'rgba(36,28,61,0.3)' }} exit={{ opacity: 0 }}>
      <div className="grid justify-items-center gap-3">
        <div className="flex gap-6">
          {rolls.map((r, k) => (
            <motion.div key={k} initial={still ? false : { x: k ? 260 : -260, y: -220, rotate: k ? 60 : -60 }}
              animate={still ? undefined : { x: [k ? 260 : -260, k ? 40 : -60, 0], y: [-220, 30, -40, 0], rotate: [k ? 60 : -60, 250, 340, 360 + (k ? 6 : -6)] }}
              transition={{ duration: 1.1, delay: k * 0.5, times: [0, 0.45, 0.75, 1], ease: 'easeOut' }}>
              <Die2D value={r} size={128} rolling={!landed} theme={theme} />
            </motion.div>
          ))}
        </div>
        <AnimatePresence>
          {landed && (
            <motion.p className="text-5xl bg-surface border-[3px] border-border rounded-pill px-6 py-1" style={{ ...CHICLE, boxShadow: 'var(--shadow-sticker)' }}
              initial={{ scale: 0.3, opacity: 0, rotate: -8 }} animate={{ scale: [0.3, 1.2, 1], opacity: 1, rotate: 0 }} transition={{ duration: 0.45 }}>
              {label}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ---- The wheel: half forward, half back; a pointer at the top --------------
function Wheel({ spin, still }: { spin: { stop: number; forward: boolean; n: number; name: string; done: boolean }; still: boolean }) {
  const size = 'min(62vmin, 440px)';
  return (
    <motion.div className="absolute inset-0 z-40 grid place-items-center bg-[#241c3d]/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="status" aria-live="polite"
      aria-label={spin.done ? t(spin.forward ? 'cq.wheelForward' : 'cq.wheelBack', { name: spin.name, n: spin.n }) : t('cq.wheelSpinning')}>
      <div className="grid justify-items-center gap-3">
        <p className="text-3xl bg-surface border-[3px] border-border rounded-pill px-5 py-1" style={{ ...CHICLE, boxShadow: 'var(--shadow-sticker)' }}>{spin.name}: {spin.n}</p>
        <div className="relative" style={{ width: size, height: size }}>
          <motion.svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full drop-shadow-[0_6px_0_rgba(0,0,0,0.35)]" initial={{ rotate: 0 }} animate={{ rotate: still ? spin.stop % 360 : spin.stop }}
            transition={{ duration: still ? 0.01 : 4, ease: [0.15, 0.85, 0.25, 1] }}>
            <circle cx="100" cy="100" r="96" fill={C.ink} />
            <path d="M100 100 L100 8 A92 92 0 0 1 100 192 Z" fill={C.sage} opacity={spin.done && !spin.forward ? 0.35 : 1} />
            <path d="M100 100 L100 192 A92 92 0 0 1 100 8 Z" fill={C.red} opacity={spin.done && spin.forward ? 0.35 : 1} />
            {Array.from({ length: 12 }, (_, k) => <line key={k} x1="100" y1="100" x2={100 + 92 * Math.sin((k * Math.PI) / 6)} y2={100 - 92 * Math.cos((k * Math.PI) / 6)} stroke="#fffdf6" strokeWidth="1" opacity="0.35" />)}
            <text x="148" y="106" textAnchor="middle" fontSize="20" fill="#fffdf6" stroke={C.ink} strokeWidth="0.8" style={CHICLE} transform="rotate(90 148 100)">{t('cq.forward')}</text>
            <text x="52" y="106" textAnchor="middle" fontSize="20" fill="#fffdf6" stroke={C.ink} strokeWidth="0.8" style={CHICLE} transform="rotate(-90 52 100)">{t('cq.back')}</text>
            <circle cx="100" cy="100" r="16" fill={C.yellow} stroke={C.ink} strokeWidth="4" />
            {Array.from({ length: 16 }, (_, k) => <circle key={`b${k}`} cx={100 + 88 * Math.sin((k * Math.PI) / 8)} cy={100 - 88 * Math.cos((k * Math.PI) / 8)} r="3" fill="#fffdf6" className={still ? '' : 'cq-blink'} style={{ animationDelay: `${k * 0.08}s` }} />)}
          </motion.svg>
          {/* The pointer at the top. */}
          <svg viewBox="0 0 40 44" className="absolute left-1/2 -top-[6%] -translate-x-1/2 w-[14%]" aria-hidden="true"><path d="M4 4 H36 L20 40 Z" fill={C.yellow} stroke={C.ink} strokeWidth="4" strokeLinejoin="round" /></svg>
        </div>
        <AnimatePresence>
          {spin.done && (
            <motion.p className="text-4xl bg-surface border-[3px] border-border rounded-pill px-6 py-1" style={{ ...CHICLE, boxShadow: 'var(--shadow-sticker)', color: spin.forward ? '#3f6b2a' : C.red }}
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
  return <motion.span className="text-xl px-3 py-0.5 rounded-pill border-[2.5px] border-border bg-accent" style={CHICLE} animate={still ? undefined : { scale: [1, 1.12, 1], rotate: [0, -3, 3, 0] }} transition={{ duration: 0.9, repeat: Infinity }}>{text}</motion.span>;
}

// Who is closest to the finish: a round badge and a progress line each.
function Race({ turns, pos, finish, playing, shield, skip, still }: { turns: TurnState; pos: number[]; finish: number; playing: boolean; shield: boolean[]; skip: boolean[]; still: boolean }) {
  return (
    <aside className="bg-surface border-[2.5px] border-border rounded-panel p-2 lg:p-3 grid gap-2 min-w-0" style={{ boxShadow: 'var(--shadow-sticker)' }} aria-label={t('cq.race')}>
      <h2 className="hidden lg:flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted"><FlagCheckered weight="fill" size={16} />{t('cq.firstToFinish')}</h2>
      <ol className="flex flex-nowrap overflow-x-auto lg:overflow-visible lg:grid gap-1.5 list-none m-0 p-1 lg:p-0">
        {turns.players.map((p, i) => {
          const on = playing && i === turns.turn;
          const f = Math.max(0, Math.min(1, (pos[i] ?? 0) / finish));
          const color = TEAM_COLORS[p.colorIndex % TEAM_COLORS.length];
          return (
            <motion.li key={p.id} aria-current={on ? 'true' : undefined} aria-label={t('cq.raceRow', { name: p.name, n: Math.round(f * 100) })}
              animate={on && !still ? { boxShadow: ['0 0 0 3px #fdfd94, 0 0 12px 3px #fdfd94', '0 0 0 4px #fdfd94, 0 0 22px 8px #fdfd94', '0 0 0 3px #fdfd94, 0 0 12px 3px #fdfd94'] } : { boxShadow: on ? '0 0 0 4px #fdfd94' : '0 0 0 0 transparent' }}
              transition={on && !still ? { duration: 1.6, repeat: Infinity } : { duration: 0.2 }}
              className={`shrink-0 lg:shrink min-w-[11rem] lg:min-w-0 grid grid-cols-[auto_1fr] items-center gap-x-2 rounded-input border-[2px] p-1.5 ${on ? 'border-border bg-accent' : 'border-border-soft'}`}>
              <span className="row-span-2 relative"><TeamBadge colorIndex={p.colorIndex} size={40} />
                {shield[i] && <ShieldCheck weight="fill" size={18} className="absolute -right-1 -bottom-1 text-[#3d7fb8] bg-surface rounded-full" aria-label={t('cq.shielded')} />}
                {skip[i] && <HourglassHigh weight="fill" size={18} className="absolute -left-1 -bottom-1 bg-surface rounded-full" aria-label={t('cq.losesNext')} />}
              </span>
              <span className="font-bold truncate leading-tight">{p.name}</span>
              <span className="relative h-3 rounded-pill bg-surface-2 border-[1.5px] border-border overflow-visible">
                <motion.span className="absolute inset-y-0 left-0 rounded-pill" style={{ background: color }} animate={{ width: `${f * 100}%` }} transition={{ duration: still ? 0 : 0.5 }} />
                <FlagCheckered weight="fill" className="absolute -right-1 top-1/2 -translate-y-1/2 w-4 h-4 text-[#474241]" aria-hidden="true" />
              </span>
            </motion.li>
          );
        })}
      </ol>
    </aside>
  );
}
