import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { CastleTurret, CheckCircle, DiceFive, Lightning, Shield, Timer, Trophy } from '@phosphor-icons/react';
import { data, newId } from '../../data';
import { LIBRARY } from '../../data/library';
import { useMySets } from '../../data/hooks';
import type { MultipleChoiceQuestion } from '../../data/types';
import { buzz, playEffect } from '../../engine/feedback';
import { makeDeck } from '../../engine/picker';
import ResultsModal from '../../engine/ResultsModal';
import ShareQuestion from '../../engine/ShareQuestion';
import TeamSetup, { type Character } from '../../engine/TeamSetup';
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
import { ChoiceRow } from '../../ui/fields';
import { buttonClasses } from '../../ui/kit';
import Title from '../../ui/Title';
import GameWelcome from '../GameWelcome';
import SetPicker from '../SetPicker';
import SetupWizard from '../SetupWizard';
import ThemeScreen from '../ThemeScreen';
import WayToPlay from '../WayToPlay';
import { useSavedSetup } from '../useSavedSetup';
import { castleQuestManifest } from './manifest';
import {
  BRIDGES, bridgeFrom, buildWorld, castleBlocks, castleStage, centerOf, clampPos, FINISH, isBad, openChest, PATH, placePowers, POWERS, roll, SHORT_START, spotOf,
  tileXY, WORLD_H, WORLD_W, type Bridge, type ChestPrize, type Power,
} from './board';

type Phase = 'welcome' | 'theme' | 'setup' | 'play' | 'end';
type Step = 'question' | 'roll' | 'rolling' | 'moving' | 'target';
type Pt = { x: number; y: number };
const ART = '/classic/castle-quest';
// Classic players (teacher, 2026-10-31): 20 voxel animals from SonaSar's
// Voxel Animals pack, drawn from the 3D models; each player picks one.
const ANIMALS = ['Axolotl', 'Bear', 'Bunny', 'Cat', 'Chicken', 'Cow', 'Crocodile', 'Dog', 'Elephant', 'Fox', 'Frog', 'Mole', 'Monkey', 'Mouse', 'Panda', 'Parrot', 'Penguin', 'Piglet', 'Turtle', 'Unicorn'];
const CLASSIC_PLAYERS: Character[] = ANIMALS.map((name) => ({ id: name.toLowerCase(), name, image: `/classic/castle-quest/animals/${name.toLowerCase()}.webp` }));
const HEROES = ['blue_knight', 'red_mage', 'green_barbarian', 'yellow_rogue', 'red_knight', 'blue_mage', 'yellow_barbarian', 'green_rogue', 'green_knight', 'yellow_mage'];
const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));
const pct = (v: number, total: number) => `${(v / total) * 100}%`;

// Board Game (teacher design, 2026-10-31; rebuilt after her review the same
// day): one winding trail through a hexagon wilderness to a castle that rises
// as the race goes on. Teams on one screen, or two players head to head (or
// against the computer). A right answer earns a roll of the die; pieces hop
// space by space, bridges cut across the bends, and power-up spaces bring
// magnets, tornadoes, potions, treasure chests, shields, lightning and speed.
export default function CastleQuest() {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const { theme, themes, playable, choose } = useGameTheme('castle-quest');
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const [setup, change] = useSavedSetup('castle-quest', { setId: LIBRARY[0].id, who: 'teams' as 'teams' | 'versus', powerUps: true, trail: 'full' as 'full' | 'short', powerOff: [] as string[] });
  // Where pieces start: the full trail, or the short one from the second bend.
  const [start, setStart] = useState(0);
  const startRef = useRef(0);
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
  const [pos, setPos] = useState<number[]>([]);
  const [hop, setHop] = useState<{ who: number; n: number; ms: number }>({ who: -1, n: 0, ms: 300 });
  const [override, setOverride] = useState<Record<number, Pt & { lift?: boolean }>>({});
  const [powers, setPowers] = useState<Map<number, Power>>(new Map());
  const [die, setDie] = useState(1);
  const [toss, setToss] = useState<{ id: number; n: number; mult: number } | null>(null);
  const [ahead, setAhead] = useState<number[]>([]);
  const [shield, setShield] = useState<number[]>([]);
  const [fast, setFast] = useState<number[]>([]);
  const [potion, setPotion] = useState(false);
  const [magnetOn, setMagnetOn] = useState(false);
  const [tornado, setTornado] = useState(false);
  const [bolt, setBolt] = useState<{ id: number; at: Pt } | null>(null);
  const [sip, setSip] = useState<{ id: number; at: Pt; img: string } | null>(null);
  const [puffs, setPuffs] = useState<{ id: number; at: Pt }[]>([]);
  const [banner, setBanner] = useState<{ id: number; text: string; image?: string; bad?: boolean } | null>(null);
  const [pop, setPop] = useState<{ id: number; item: ThemeItem; text: string } | null>(null);
  const [winner, setWinner] = useState<TurnPlayer | null>(null);
  const live = useRef(true);
  const posRef = useRef<number[]>([]);
  posRef.current = pos;
  const turnsRef = useRef<TurnState | null>(null);
  turnsRef.current = turns;
  const shieldRef = useRef<number[]>([]);
  shieldRef.current = shield;
  const held = useHeldPowerUps();

  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  const items = theme.items?.length ? theme.items : castleQuestManifest.items?.classic ?? [];
  const itemFor = (p: Power) => items.find((it) => it.ability === p) ?? castleQuestManifest.items!.classic!.find((it) => it.ability === p)!;
  const player = turns ? current(turns) : null;
  const me = turns ? turns.turn : 0;
  const human = player?.kind !== 'cpu';
  // A theme's own team pieces win; otherwise each player's picked animal.
  const themePieces = !!pieceImage(theme, 'team-1');
  const heroOf = (p: TurnPlayer, i: number) => pieceImage(theme, `team-${(p.colorIndex % 10) + 1}`) ?? p.art ?? `${ART}/heroes/${HEROES[p.colorIndex % HEROES.length] ?? HEROES[i % HEROES.length]}.webp`;
  const figureOf = (p: TurnPlayer) => !pieceImage(theme, `team-${(p.colorIndex % 10) + 1}`) && !!p.art;
  const ms = (n: number) => (still ? Math.min(n, 120) : n);

  function say(text: string, image?: string, bad = false) { setBanner({ id: Date.now() + Math.random(), text, image, bad }); }
  function puff(at: Pt) { if (still) return; const id = Date.now() + Math.random(); setPuffs((p) => [...p.slice(-6), { id, at }]); window.setTimeout(() => setPuffs((p) => p.filter((x) => x.id !== id)), 700); }
  function place(next: number[]) {
    posRef.current = next; setPos(next);
    const s = turnsRef.current;
    if (!s) return;
    const st = setScores(s, Object.fromEntries(s.players.map((p, i) => [p.id, next[i] ?? 0])));
    turnsRef.current = st; setTurns(st);
  }

  function begin(ps: TurnPlayer[]) {
    const state = startTurns(ps);
    turnsRef.current = state;
    setTurns(state); setMissed([]); setWinner(null); setOverride({}); setAhead([]);
    const from = setup.trail === 'short' ? SHORT_START : 0;
    startRef.current = from; setStart(from);
    place(ps.map(() => from));
    setShield(ps.map(() => 0)); setFast(ps.map(() => 0)); setPotion(false);
    // Lightning needs someone to send it to (Claudia review, 2026-10-31).
    // Only the power-ups the teacher left on land on the trail.
    const allowed = POWERS.filter((p) => !(setup.powerOff ?? []).includes(itemFor(p).id));
    const placed = setup.powerUps ? placePowers(Math.random, from, allowed) : new Map<number, Power>();
    if (ps.length < 2) for (const [k, v] of placed) if (v === 'lightning') placed.set(k, 'chest');
    setPowers(placed);
    held.reset();
    setPhase('play');
    startTurn(state);
  }
  function startTurn(state: TurnState) {
    const p = current(state);
    setPotion(false); setAhead([]);
    setShield((s) => s.map((n, i) => (i === state.turn ? Math.max(0, n - 1) : n)));
    setFast((s) => s.map((n, i) => (i === state.turn ? Math.max(0, n - 1) : n)));
    held.beginTurn(p.id);
    setMagnetOn(false);
    setStep('question');
    const d = deck.next();
    setQuestion({ q: d.question, setId: d.setId });
  }
  // A held magnet goes straight onto this question (teacher, 2026-10-31).
  useEffect(() => {
    if (step !== 'question' || !question) return;
    const i = held.held.findIndex((it) => it.ability === 'magnet');
    if (i >= 0) { held.use(i); setMagnetOn(true); }
  }, [question, held.held]); // eslint-disable-line react-hooks/exhaustive-deps

  function onResult(right: boolean) {
    const s = turnsRef.current;
    if (!s || !question) return;
    const p = current(s);
    if (p.kind !== 'cpu' && p.kind !== 'teacher') {
      void data.logQuestion({ id: newId('log'), at: new Date().toISOString(), teamName: p.name, gameId: 'castle-quest', mode: versus ? 'versus' : 'share', setId: question.setId, prompt: question.q.prompt, answer: question.q.choices[question.q.correctIndex], tries: [], ms: 0, outcome: right ? 'right' : 'skipped' });
      if (!right) setMissed((m) => (m.some((x) => x.id === question.q.id) ? m : [...m, question.q]));
    }
    setQuestion(null); setMagnetOn(false);
    if (right) { setStep('roll'); playEffect('right', settings); }
    else { say(t('cq.nextTime'), `${ART}/world/bushGrass.png`); void endTurn(); }
  }

  // Hops: one space at a time with a little arc; Time makes it 5 times faster.
  const hopMs = (who: number) => (still ? 60 : fast[who] > 0 ? 75 : 380);
  async function walk(who: number, to: number) {
    const from = posRef.current[who];
    const dir = to > from ? 1 : -1;
    // Long trips hop faster so nobody waits (a trip back to Start takes a few seconds, not twenty).
    const speed = still ? 60 : Math.min(hopMs(who), Math.max(90, Math.round(2600 / Math.max(1, Math.abs(to - from)))));
    for (let n = from; n !== to; n += dir) {
      if (!live.current) return;
      const next = [...posRef.current]; next[who] = n + dir; place(next);
      setHop((h) => ({ who, n: h.n + 1, ms: speed }));
      playEffect('tap', settings);
      await sleep(speed);
      puff(spotOf(n + dir));
    }
  }
  // Across a bridge, plank by plank, then onto the far bend.
  async function cross(who: number, b: Bridge) {
    say(t('cq.bridge'), undefined);
    playEffect('right', settings);
    const speed = Math.max(hopMs(who), still ? 60 : 420);
    for (const [r, c] of b.over) {
      const at = centerOf(r, c);
      setOverride((o) => ({ ...o, [who]: { x: at.x, y: at.y - 6 } }));
      setHop((h) => ({ who, n: h.n + 1, ms: speed }));
      playEffect('tap', settings);
      await sleep(speed);
    }
    setOverride((o) => { const { [who]: _, ...rest } = o; return rest; });
    const next = [...posRef.current]; next[who] = b.to; place(next);
    setHop((h) => ({ who, n: h.n + 1, ms: speed }));
    await sleep(speed);
    puff(spotOf(b.to));
  }

  async function rollDie() {
    if (step !== 'roll') return;
    try { await rollAndMove(); } catch { await endTurn(); }
  }
  async function rollAndMove() {
    setStep('rolling');
    const n = roll();
    const mult = potion ? 3 : 1;
    setPotion(false);
    playEffect('whoosh', settings);
    setToss({ id: Date.now(), n, mult });
    await sleep(still ? 350 : 1500);
    setDie(n);
    playEffect('right', settings);
    if (mult > 1) say(t('cq.potionRoll', { n, total: n * mult }), itemFor('potion').image);
    // Show the spaces ahead, then go.
    const from = posRef.current[me];
    const to = clampPos(from + n * mult);
    setAhead(Array.from({ length: to - from }, (_, k) => from + k + 1));
    await sleep(still ? 200 : 700);
    setToss(null);
    setStep('moving');
    await walk(me, to);
    setAhead([]);
    await land(me);
    await endTurn();
  }
  async function move(who: number, by: number, powersOn = true) {
    await walk(who, clampPos(posRef.current[who] + by));
    await land(who, powersOn);
  }
  async function land(who: number, powersOn = true) {
    const at = posRef.current[who];
    if (at >= FINISH) return;
    const b = bridgeFrom(at);
    if (b) await cross(who, b);
    const power = powersOn ? powers.get(posRef.current[who]) : undefined;
    if (power) await gotPower(who, power);
  }
  async function gotPower(who: number, power: Power) {
    const s = turnsRef.current!;
    const it = itemFor(power);
    if (power === 'tornado') { setPop({ id: Date.now(), item: it, text: roleOf(castleQuestManifest, it) }); await sleep(ms(1300)); await blowAway(); return; }
    if (power === 'chest') { setPop({ id: Date.now(), item: it, text: t('cq.chestOpen') }); await sleep(ms(1500)); await openTheChest(who); return; }
    held.earn(s.players[who].id, it);
    setPop({ id: Date.now(), item: it, text: t('pu.later', { role: roleOf(castleQuestManifest, it) }) });
    playEffect('win', settings);
    await sleep(ms(1100));
  }
  // Tornado (teacher, 2026-10-31): no way to say no. Every piece is lifted in
  // the wind and dropped on a random space; a shield holds you down.
  async function blowAway() {
    playEffect('whoosh', settings);
    setTornado(true);
    const lift: Record<number, Pt & { lift: boolean }> = {};
    posRef.current.forEach((p, i) => { if (shieldRef.current[i] <= 0 && p < FINISH) lift[i] = { x: WORLD_W * (0.3 + 0.4 * Math.random()), y: WORLD_H * (0.15 + 0.2 * Math.random()), lift: true }; });
    setOverride(lift);
    await sleep(ms(1500));
    const next = posRef.current.map((p, i) => (lift[i] ? startRef.current + 1 + Math.floor(Math.random() * (FINISH - startRef.current - 6)) : p));
    setOverride({});
    place(next);
    buzz(80, settings);
    await sleep(ms(700));
    setTornado(false);
    next.forEach((p, i) => { if (lift[i]) puff(spotOf(p)); });
    say(t('cq.tornadoDone'), itemFor('tornado').image);
    await sleep(ms(1000));
  }
  async function openTheChest(who: number) {
    const prize: ChestPrize = openChest();
    if (isBad(prize) && shieldRef.current[who] > 0) { say(t('cq.shieldBlocks'), itemFor('shield').image); await sleep(ms(1200)); return; }
    if (prize.kind === 'move') { say(t(prize.n > 0 ? 'cq.chestAhead' : 'cq.chestBack', { n: Math.abs(prize.n) }), undefined, prize.n < 0); await sleep(ms(1000)); await move(who, prize.n, false); return; }
    if (prize.kind === 'start') { say(t('cq.chestStart'), undefined, true); await sleep(ms(1000)); await walk(who, startRef.current); return; }
    if (prize.kind === 'swap') {
      const others = posRef.current.map((p, i) => [p, i]).filter(([, i]) => i !== who).sort((a, b) => a[0] - b[0]);
      const back = others[0];
      if (!back || back[0] >= posRef.current[who]) { say(t('cq.chestSwapNone')); await sleep(ms(1000)); return; }
      say(t('cq.chestSwap', { name: turnsRef.current!.players[back[1]].name }), undefined, true); await sleep(ms(1000));
      const a = spotOf(posRef.current[who]), z = spotOf(back[0]);
      setOverride({ [who]: { ...z, lift: true }, [back[1]]: { ...a, lift: true } });
      await sleep(ms(900));
      setOverride({});
      const next = [...posRef.current]; [next[who], next[back[1]]] = [next[back[1]], next[who]]; place(next); await sleep(ms(500)); return;
    }
    if (prize.kind === 'potion') { const n = roll(); await drink(who); say(t('cq.potionRoll', { n, total: n * 3 }), itemFor('potion').image); await sleep(ms(1000)); await move(who, n * 3, false); return; }
    if (prize.kind === 'reroll') { const n = roll(); setToss({ id: Date.now(), n, mult: 1 }); await sleep(ms(1500)); setToss(null); setDie(n); say(t('cq.chestReroll', { n })); await sleep(ms(800)); await move(who, n, false); return; }
    // Mystery box: a roll that could double, go backward, or bring a power-up.
    const n = roll();
    setToss({ id: Date.now(), n, mult: 1 }); await sleep(ms(1500)); setToss(null);
    const twist = Math.random();
    if (twist < 0.2 && shieldRef.current[who] <= 0) { say(t('cq.mysteryBack', { n }), `${ART}/powerups/mystery.webp`, true); await sleep(ms(900)); await move(who, -n, false); return; }
    if (twist < 0.4) { say(t('cq.mysteryDouble', { n, total: n * 2 }), `${ART}/powerups/mystery.webp`); await sleep(ms(900)); await move(who, n * 2, false); return; }
    if (twist < 0.55) { const it = itemFor(['shield', 'potion', 'time', 'magnet'][Math.floor(Math.random() * 4)] as Power); held.earn(turnsRef.current!.players[who].id, it); setPop({ id: Date.now(), item: it, text: t('pu.later', { role: roleOf(castleQuestManifest, it) }) }); await sleep(ms(1100)); return; }
    say(t('cq.chestMystery', { n }), `${ART}/powerups/mystery.webp`);
    await sleep(ms(900));
    await move(who, n, false);
  }
  async function drink(who: number) {
    const at = spotOf(posRef.current[who]);
    setSip({ id: Date.now(), at, img: itemFor('potion').image ?? '' });
    playEffect('win', settings);
    await sleep(ms(1100));
    setSip(null);
  }

  // Use a held power-up before rolling.
  async function applyItem(i: number) {
    const it = held.use(i);
    if (!it) return;
    playEffect('win', settings);
    if (it.ability === 'potion') { setPotion(true); setStep('rolling'); await drink(me); setStep('roll'); say(t('cq.potionReady'), it.image); }
    if (it.ability === 'time') { setFast((f) => f.map((n, k) => (k === me ? 3 : n))); say(t('cq.timeOn'), it.image); }
    if (it.ability === 'shield') { setShield((s) => s.map((n, k) => (k === me ? 4 : n))); say(t('cq.shieldOn'), it.image); }
    if (it.ability === 'lightning') {
      const others = (turnsRef.current?.players ?? []).map((_, k) => k).filter((k) => k !== me);
      if (others.length === 1) { void strike(others[0]); return; }
      if (others.length === 0) return;
      setStep('target');
    }
  }
  async function strike(target: number) {
    try { await strikeNow(target); } catch { setStep('roll'); }
  }
  async function strikeNow(target: number) {
    setStep('moving');
    const it = itemFor('lightning');
    const at = spotOf(posRef.current[target]);
    setBolt({ id: Date.now(), at });
    playEffect('whoosh', settings); buzz(90, settings);
    await sleep(ms(900));
    setBolt(null);
    if (shieldRef.current[target] > 0) { say(t('cq.shieldBlocks'), itemFor('shield').image); await sleep(ms(1100)); setStep('roll'); return; }
    const n = roll();
    setDie(n);
    say(t('cq.lightning', { name: turnsRef.current!.players[target].name, n }), it.image, true);
    await sleep(ms(800));
    await walk(target, clampPos(posRef.current[target] - n));
    setStep('roll');
  }

  async function endTurn() {
    const s = turnsRef.current;
    if (!s) return;
    await sleep(ms(500));
    held.endTurn();
    const done = posRef.current.findIndex((p) => p >= FINISH);
    if (done >= 0) {
      setWinner(s.players[done]);
      playEffect('win', settings);
      if (settings.celebrations !== 'off' && !still) {
        void confetti({ particleCount: 160, spread: 110, origin: { x: 0.75, y: 0.25 }, disableForReducedMotion: true });
        window.setTimeout(() => void confetti({ particleCount: 120, spread: 80, origin: { x: 0.5, y: 0.35 }, disableForReducedMotion: true }), 500);
      }
      await sleep(ms(2600));
      setPhase('end');
      return;
    }
    const next = nextTurn(s);
    turnsRef.current = next; setTurns(next);
    startTurn(next);
  }

  // The computer uses what it holds, then rolls.
  useEffect(() => {
    if (phase !== 'play' || player?.kind !== 'cpu') return;
    if (step === 'roll') {
      const id = window.setTimeout(() => {
        const k = held.held.findIndex((it) => it.ability !== 'lightning');
        if (k >= 0) { void applyItem(k); return; }
        const l = held.held.findIndex((it) => it.ability === 'lightning');
        if (l >= 0) { void applyItem(l); return; }
        void rollDie();
      }, 900);
      return () => window.clearTimeout(id);
    }
    if (step === 'target') {
      const id = window.setTimeout(() => {
        const lead = posRef.current.map((p, i) => [p, i]).filter(([, i]) => i !== me).sort((a, b) => b[0] - a[0])[0];
        if (lead) void strike(lead[1]);
      }, 800);
      return () => window.clearTimeout(id);
    }
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const best = Math.max(start, ...pos);
  // The castle rises with the share of the trail covered, short or full.
  const stage = castleStage(Math.round(((best - start) / (FINISH - start)) * FINISH));
  const boardW = `calc((var(--play-h) - 1.5rem - var(--cq-extra)) * ${WORLD_W / WORLD_H})`;
  // A held magnet shows too; it goes on by itself at the next question.
  const tray = <PowerUpTray manifest={castleQuestManifest} items={held.held} onUse={(i) => { if (held.held[i]?.ability !== 'magnet') void applyItem(i); }} disabled={step !== 'roll' || !human} />;
  const rollButton = step === 'roll' && human && phase === 'play' && (
    <motion.button type="button" onClick={() => void rollDie()} className={buttonClasses('primary', 'h-16 !px-6 !text-xl w-full')}
      animate={still ? undefined : { scale: [1, 1.05, 1] }} transition={{ duration: 1.1, repeat: Infinity }}>
      <DiceFive weight="fill" size={28} />{potion ? t('cq.rollPotion') : t('cq.roll')}
    </motion.button>
  );
  const dieCard = (
    <div className="bg-surface border-[2.5px] border-border rounded-panel p-3 grid gap-3 justify-items-center" style={{ boxShadow: 'var(--shadow-sticker)' }}>
      <Die3D value={die} size={64} spinning={step === 'rolling' && !still} theme={theme} />
      {rollButton}
    </div>
  );

  return (
    <ThemedPage theme={theme} menu={phase !== 'play' && phase !== 'end'}>
    <main className={phase === 'play' || phase === 'end' ? '!p-0 [--cq-extra:9rem] lg:[--cq-extra:0rem]' : 'max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-6'}>
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context="castle-quest" />
      {phase !== 'play' && phase !== 'end' && <GameTopRow onSettings={() => setSettingsOpen(true)} />}
      {phase === 'welcome' && (
        <GameWelcome game={castleQuestManifest} cover={pieceImage(theme, 'cover')} onStart={() => setPhase(themes.length > 1 ? 'theme' : 'setup')} steps={[
          { icon: <CheckCircle weight="fill" size={22} />, text: t('cq.how1') },
          { icon: <DiceFive weight="fill" size={22} />, text: t('cq.how2') },
          { icon: <CastleTurret weight="fill" size={22} />, text: t('cq.how3') },
        ]} />
      )}
      {phase === 'theme' && <ThemeScreen gameName={castleQuestManifest.name} current={theme} themes={themes} playable={playable} onChoose={choose} onBack={() => setPhase('welcome')} onNext={() => setPhase('setup')} />}
      {phase === 'setup' && (
        <SetupWizard onBack={() => setPhase(themes.length > 1 ? 'theme' : 'welcome')} onPlay={() => begin(team.players)} pages={[
          { id: 'way', title: t('way.title'), content: <WayToPlay modes={['share', 'versus']} value={versus ? 'versus' : 'share'} onChange={(m) => change({ who: m === 'versus' ? 'versus' : 'teams' })} /> },
          ...(game.assigned ? [] : [{ id: 'questions', title: t('setup.questions'), content: <SetPicker sets={sets} value={[setId]} onChange={(ids) => change({ setId: ids[0] })} /> }]),
          { id: 'options', title: t('setup.options'), content: (
            <>
              <ChoiceRow label={t('cq.trail')} value={setup.trail ?? 'full'} onChange={(v) => change({ trail: v })}
                options={[{ value: 'full', label: t('cq.trailFull') }, { value: 'short', label: t('cq.trailShort') }]} />
              {powerUpSwitches({ manifest: castleQuestManifest, theme, on: setup.powerUps, off: setup.powerOff ?? [], change })}
            </>
          ) },
          versus
            ? { id: 'players', title: t('setup.players'), ready: team.players.length === 2, content: <TeamSetup key="versus" mode="versus" min={2} max={2} embedded characters={themePieces ? undefined : CLASSIC_PLAYERS} onChange={(ps, level) => setTeam({ players: ps, level })} /> }
            : { id: 'teams', title: t('setup.teams'), ready: team.players.length > 0, content: <TeamSetup key="share" mode="share" min={1} max={6} embedded characters={themePieces ? undefined : CLASSIC_PLAYERS} onChange={(ps, level) => setTeam({ players: ps, level })} /> },
        ]} />
      )}
      {(phase === 'play' || phase === 'end') && turns && (
        <div className="relative play-fill grid grid-cols-[minmax(0,1fr)] content-center gap-2 px-3 py-3 lg:flex lg:justify-center lg:items-center">
          <h1 className="sr-only"><Title text={castleQuestManifest.name} /></h1>
          <div className="absolute top-3 right-3 flex items-center gap-2 z-30 [&_button]:!w-11 [&_button]:!h-11">
            <FullScreenButton small />
            <AccessButton small />
            <GearButton small onClick={() => setSettingsOpen(true)} />
          </div>
          <div className="contents lg:flex lg:items-start lg:gap-4">
            <section className="relative grid grid-cols-[minmax(0,1fr)] gap-2 min-w-0">
              <div className={`relative mx-auto rounded-panel border-[3px] border-border overflow-hidden select-none ${tornado && !still && settings.screenShake ? 'cq-shake' : ''}`}
                style={{ aspectRatio: `${WORLD_W} / ${WORLD_H}`, width: boardW, maxWidth: 'min(100%, calc(100vw - 1.5rem))', background: pieceImage(theme, 'background') ? `center / cover url("${pieceImage(theme, 'background')}")` : 'linear-gradient(#bfe6ff, #8fd0f3 45%, #6fbfe8)', boxShadow: 'var(--shadow-sticker-lg)' }}>
                <svg viewBox={`0 0 ${WORLD_W} ${WORLD_H}`} className="absolute inset-0 w-full h-full" role="img" aria-label={t('cq.board', { n: FINISH })}>
                  <WorldArt theme={theme} still={still} start={start} />
                  <TrailMarks powers={powers} itemFor={itemFor} ahead={ahead} here={phase === 'play' && turns ? (override[me] ? null : pos[me] ?? 0) : null} color={player ? TEAM_COLORS[player.colorIndex % TEAM_COLORS.length] : '#fff'} still={still} />
                  <Castle stage={stage} theme={theme} still={still} flag={winner ? TEAM_COLORS[winner.colorIndex % TEAM_COLORS.length] : '#ef6f6c'} />
                </svg>
                {/* Pieces: little pawns that hop space to space. */}
                {turns.players.map((p, i) => {
                  const here = pos[i] ?? 0;
                  const o = override[i];
                  const s = o ?? spotOf(here);
                  const same = turns.players.map((_, k) => k).filter((k) => !override[k] && (pos[k] ?? 0) === here);
                  const off = !o && same.length > 1 ? (same.indexOf(i) - (same.length - 1) / 2) * 2.4 : 0;
                  const on = i === turns.turn && phase === 'play';
                  const flying = !!o?.lift;
                  return (
                    <motion.div key={p.id} className="absolute w-[6.4%] aspect-[4/5] pointer-events-none" style={{ zIndex: on ? 15 : 10, translateX: '-50%', translateY: '-92%' }}
                      aria-label={t('cq.pieceAt', { name: p.name })}
                      animate={{ left: `calc(${pct(s.x, WORLD_W)} + ${off}%)`, top: pct(s.y, WORLD_H), rotate: flying && !still ? 720 : 0, scale: flying ? 0.7 : 1 }}
                      transition={flying ? { duration: still ? 0.01 : 1.3, ease: 'easeInOut' } : { duration: still ? 0.01 : (hop.who === i ? hop.ms : 500) / 1000, ease: 'easeOut' }}>
                      <Pawn img={heroOf(p, i)} figure={figureOf(p)} color={TEAM_COLORS[p.colorIndex % TEAM_COLORS.length]} on={on} shield={shield[i] > 0} fast={fast[i] > 0} still={still} hopKey={hop.who === i ? hop.n : 0} hopMs={hop.ms} />
                    </motion.div>
                  );
                })}
                <AnimatePresence>
                  {puffs.map((pf) => (
                    <motion.span key={pf.id} className="absolute w-[5%] aspect-[2/1] rounded-[50%] bg-white/70 pointer-events-none z-[9]" style={{ left: pct(pf.at.x, WORLD_W), top: pct(pf.at.y, WORLD_H), translateX: '-50%', translateY: '-30%' }}
                      initial={{ scale: 0.3, opacity: 0.9 }} animate={{ scale: 1.6, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} />
                  ))}
                  {tornado && (
                    <motion.img key="tornado" src={itemFor('tornado').image} alt="" className="absolute top-[10%] w-[30%] pointer-events-none z-20 drop-shadow-[0_8px_10px_rgba(0,0,0,0.35)]"
                      initial={{ left: '-30%', opacity: 0 }} animate={still ? { left: '35%', opacity: 1 } : { left: ['-30%', '20%', '45%', '75%', '110%'], opacity: [0, 1, 1, 1, 0], rotate: [0, -10, 10, -8, 0], scale: [0.7, 1.1, 1.2, 1.05, 0.8] }}
                      exit={{ opacity: 0 }} transition={{ duration: still ? 0.01 : 2.2, ease: 'easeInOut' }} />
                  )}
                  {bolt && (
                    <motion.div key={bolt.id} className="absolute inset-0 pointer-events-none z-20" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {!still && settings.screenShake && <motion.div className="absolute inset-0 bg-white" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.85, 0, 0.6, 0] }} transition={{ duration: 0.6 }} />}
                      <motion.img src={itemFor('lightning').image} alt="" className="absolute w-[13%] drop-shadow-[0_0_16px_#fff7a1]" style={{ left: pct(bolt.at.x, WORLD_W), translateX: '-50%', translateY: '-100%' }}
                        initial={{ top: '-15%', scale: 0.6 }} animate={{ top: pct(bolt.at.y, WORLD_H), scale: [0.6, 1.3, 1] }} transition={{ duration: still ? 0.01 : 0.35, ease: 'easeIn' }} />
                    </motion.div>
                  )}
                  {sip && (
                    <motion.img key={sip.id} src={sip.img} alt="" className="absolute w-[7%] pointer-events-none z-20" style={{ left: pct(sip.at.x, WORLD_W), top: pct(sip.at.y, WORLD_H), translateX: '-20%', translateY: '-210%' }}
                      initial={{ scale: 0, rotate: 0 }} animate={still ? { scale: 1 } : { scale: [0, 1.2, 1, 1], rotate: [0, 0, -70, -70], y: [0, -6, 0, 0] }} exit={{ opacity: 0, scale: 0.4 }} transition={{ duration: 1 }} />
                  )}
                  {toss && <DieToss key={toss.id} n={toss.n} mult={toss.mult} still={still} theme={theme} />}
                  {banner && (
                    <motion.p key={banner.id} className={`absolute inset-x-0 bottom-[6%] mx-auto w-max max-w-[92%] flex items-center gap-2 font-display text-xl sm:text-2xl border-[2.5px] border-border rounded-pill pl-2 pr-5 py-1 pointer-events-none z-20 ${banner.bad ? 'bg-[#ffd6cc]' : 'bg-surface'}`} style={{ boxShadow: 'var(--shadow-sticker)' }}
                      initial={{ y: 30, opacity: 0, scale: 0.8 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ opacity: 0, y: 10 }} transition={{ type: 'spring', stiffness: 380, damping: 22, duration: still ? 0.01 : undefined }}
                      onAnimationComplete={() => { const id = banner.id; window.setTimeout(() => setBanner((b) => (b?.id === id ? null : b)), 1600); }} role="status">
                      {banner.image && <img src={banner.image} alt="" className="w-9 h-9 object-contain" />}{banner.text}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              {/* Small screens: the die and roll button under the board; held power-ups over the board's corner. */}
              <div className="lg:hidden flex items-center justify-center gap-3 min-h-16">
                <Die3D value={die} size={52} spinning={step === 'rolling' && !still} theme={theme} />
                {rollButton && <div className="w-64">{rollButton}</div>}
              </div>
              <div className="lg:hidden absolute left-2 top-2 w-[min(15rem,45%)] z-20">{tray}</div>
            </section>
            <div className="order-first lg:order-none lg:w-[270px] min-w-0 grid gap-3 pr-[10.5rem] lg:pr-0 lg:pt-14">
              <Race turns={turns} pos={pos} playing={phase === 'play'} heroOf={heroOf} start={start} />
              <div className="hidden lg:block">{tray}</div>
              <div className="hidden lg:block">{dieCard}</div>
              {step === 'target' && human && (
                <div className="bg-surface border-[2.5px] border-border rounded-panel p-3 grid gap-2" style={{ boxShadow: 'var(--shadow-sticker)' }} role="group" aria-label={t('cq.pickTarget')}>
                  <p className="font-bold flex items-center gap-2"><Lightning weight="fill" size={20} className="text-[#e8b400]" />{t('cq.pickTarget')}</p>
                  <button type="button" onClick={() => setStep('roll')} className={buttonClasses('ghost', 'justify-start !min-h-10')}>{t('cq.keepIt')}</button>
                  {turns.players.map((p, i) => i !== me && (
                    <button key={p.id} type="button" onClick={() => void strike(i)} className={buttonClasses('secondary', 'justify-start')}>
                      <img src={heroOf(p, i)} alt="" className="w-8 h-8 rounded-full" />{p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {question && player && phase === 'play' && <ShareQuestion key={question.q.id} question={question.q} player={player} cpuLevel={team.level} onResult={onResult} magnet={magnetOn ? itemFor('magnet').image : undefined} avatar={heroOf(player, turns?.turn ?? 0)} />}
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

// ---- The world: ground, water, trees, bridges (drawn once) -----------------

const WORLD = buildWorld();
const TILE: Record<string, string> = { grass: 'tileGrass', grassFull: 'tileGrass_full', water: 'tileWater', stone: 'tileStone' };

const WorldArt = memo(function WorldArt({ theme, still, start }: { theme: GameTheme; still: boolean; start: number }) {
  const custom = pieceImage(theme, 'tile');
  const rows = useMemo(() => Array.from({ length: 13 }, (_, r) => r), []);
  return (
    <g>
      {/* Soft clouds drifting over the sky. */}
      {[[120, 40, 1], [520, 24, 0.8], [860, 60, 0.9]].map(([x, y, s], k) => (
        <g key={k} className={still ? '' : 'cq-cloud'} style={{ animationDelay: `${-k * 9}s` }} opacity={0.85}>
          <ellipse cx={x} cy={y} rx={46 * s} ry={14 * s} fill="#fff" /><ellipse cx={x - 22 * s} cy={y + 4} rx={24 * s} ry={11 * s} fill="#fff" /><ellipse cx={x + 24 * s} cy={y + 3} rx={28 * s} ry={12 * s} fill="#fff" />
        </g>
      ))}
      {rows.map((r) => (
        <g key={r}>
          {WORLD.cells.filter((c) => c.r === r).map((c) => {
            const { x, y } = tileXY(c.r, c.c);
            const i = c.i ?? -1;
            const img = c.ground === 'path' ? (custom ?? `${ART}/world/${i === start ? 'tileStone' : i % 2 ? 'tileSand_full' : 'tileSand'}.png`) : `${ART}/world/${TILE[c.ground]}.png`;
            return (
              <g key={`${c.r},${c.c}`}>
                <image href={img} x={x} y={y} width={65} height={89} />
                {c.ground === 'path' && i < start && <polygon points={hexPoints(x, y, 1)} fill="#3d6b2f" opacity={0.45} />}
                {c.ground === 'path' && <polygon points={hexPoints(x, y, 0.82)} fill="none" stroke={i % 2 ? '#c9a46a' : '#e9d6ad'} strokeWidth={2} opacity={0.9} />}
                {c.ground === 'water' && <image href={`${ART}/world/waveWater.png`} x={x + 18 + (c.c % 3) * 4} y={y + 22 + (c.r % 2) * 6} width={26} height={9} className={still ? '' : 'cq-wave'} style={{ animationDelay: `${-((c.r * 7 + c.c * 3) % 10) * 0.3}s` }} />}
              </g>
            );
          })}
        </g>
      ))}
      {/* A dotted guide along the trail, so the way through every bend is clear. */}
      <polyline points={[...PATH.map(([r, c]) => centerOf(r, c)), centerOf(1, 13)].map((p) => `${p.x},${p.y + 2}`).join(' ')} fill="none" stroke="#fffdf2" strokeWidth={3.2} strokeDasharray="0.1 11" strokeLinecap="round" strokeLinejoin="round" opacity={0.95} />
      {/* Start: a flag on the first space. */}
      <StartFlag still={still} at={start} />
      {/* Bridges: wooden planks across the water, from one bend to the next. */}
      {BRIDGES.map((b) => <BridgeArt key={b.from} b={b} />)}
      {rows.map((r) => (
        <g key={`p${r}`}>
          {WORLD.props.filter((p) => p.row === r).map((p, k) => (
            <image key={k} href={`${ART}/world/${p.img}.png`} x={p.x} y={p.y} width={p.w} height={p.h} className={p.sway && !still ? 'cq-sway' : ''} style={p.sway ? { animationDelay: `${-((p.x * 13) % 40) / 10}s` } : undefined} />
          ))}
        </g>
      ))}
    </g>
  );
});

function hexPoints(x: number, y: number, s: number) {
  const cx = x + 32.5, cy = y + 33, hw = 32.5 * s, hh = 33 * s;
  return [[cx, cy - hh], [cx + hw, cy - hh * 0.45], [cx + hw, cy + hh * 0.45], [cx, cy + hh], [cx - hw, cy + hh * 0.45], [cx - hw, cy - hh * 0.45]].map((p) => p.join(',')).join(' ');
}

function StartFlag({ still, at }: { still: boolean; at: number }) {
  const { x, y } = spotOf(at);
  return (
    <g transform={`translate(${x - 24} ${y - 40})`}>
      <rect x={0} y={0} width={3} height={40} rx={1.5} fill="#5b3a1e" />
      <path d="M3 1 L26 7 L3 14 Z" fill="#ef6f6c" stroke="#241c3d" strokeWidth={1.2} className={still ? '' : 'cq-flag'} />
    </g>
  );
}

function BridgeArt({ b }: { b: Bridge }) {
  const a = spotOf(b.from), z = spotOf(b.to);
  const ang = (Math.atan2(z.y - a.y, z.x - a.x) * 180) / Math.PI;
  const len = Math.hypot(z.x - a.x, z.y - a.y);
  const planks = Math.round(len / 9);
  return (
    <g transform={`translate(${a.x} ${a.y}) rotate(${ang})`}>
      <rect x={6} y={-15} width={len - 12} height={30} rx={4} fill="rgba(0,0,0,0.18)" transform="translate(0 6)" />
      <rect x={6} y={-13} width={len - 12} height={26} rx={3} fill="#8a5a2b" />
      {Array.from({ length: planks }, (_, k) => <rect key={k} x={10 + k * ((len - 20) / planks)} y={-12} width={(len - 20) / planks - 2} height={24} rx={1.5} fill={k % 2 ? '#c88a4e' : '#d59a5c'} stroke="#6b4320" strokeWidth={0.8} />)}
      <line x1={6} y1={-14} x2={len - 6} y2={-14} stroke="#5b3a1e" strokeWidth={2.6} strokeLinecap="round" />
      <line x1={6} y1={14} x2={len - 6} y2={14} stroke="#5b3a1e" strokeWidth={2.6} strokeLinecap="round" />
      {[8, len / 2, len - 8].map((px, k) => <g key={k}><circle cx={px} cy={-14} r={3} fill="#5b3a1e" /><circle cx={px} cy={14} r={3} fill="#5b3a1e" /></g>)}
    </g>
  );
}

// Power-up spaces glow; the spaces you will hop on light up after a roll; the
// space of the player whose turn it is pulses in their color.
function TrailMarks({ powers, itemFor, ahead, here, color, still }: { powers: Map<number, Power>; itemFor: (p: Power) => ThemeItem; ahead: number[]; here: number | null; color: string; still: boolean }) {
  return (
    <g>
      {ahead.map((i, k) => {
        if (i >= FINISH) return null;
        const [r, c] = PATH[i]; const { x, y } = tileXY(r, c);
        const last = k === ahead.length - 1;
        return <polygon key={`a${i}`} points={hexPoints(x, y, 0.9)} fill={last ? color : '#fffbe0'} opacity={last ? 0.75 : 0.55} stroke={last ? '#241c3d' : 'none'} strokeWidth={2.5} className={still ? '' : 'cq-blink'} style={{ animationDelay: `${k * 0.08}s` }} />;
      })}
      {here !== null && here < FINISH && (() => { const [r, c] = PATH[here]; const { x, y } = tileXY(r, c); return <polygon points={hexPoints(x, y, 0.92)} fill="none" stroke={color} strokeWidth={5} className={still ? '' : 'cq-glow'} />; })()}
      {[...powers.entries()].map(([i, p]) => {
        const [r, c] = PATH[i]; const { x, y } = tileXY(r, c);
        const it = itemFor(p);
        return (
          <g key={`p${i}`}>
            <polygon points={hexPoints(x, y, 0.78)} fill="#b98be0" opacity={0.55} />
            <ellipse cx={x + 32.5} cy={y + 38} rx={13} ry={5} fill="rgba(0,0,0,0.22)" />
            <image href={it.image} x={x + 15} y={y + 4} width={35} height={35} className={still ? '' : 'cq-bob'} style={{ animationDelay: `${(i % 7) * 0.2}s` }} />
          </g>
        );
      })}
    </g>
  );
}

// The castle rises layer by layer; new blocks drop in with a bounce.
function Castle({ stage, theme, still, flag }: { stage: number; theme: GameTheme; still: boolean; flag: string }) {
  const blocks = useMemo(() => castleBlocks(), []);
  const custom = pieceImage(theme, 'castle');
  if (custom) {
    const { x, y } = tileXY(0, 12);
    return <image href={custom} x={x - 10} y={y - 130} width={230} height={260} opacity={0.35 + stage * 0.13} className={!still && stage === 5 ? 'cq-castle' : ''} />;
  }
  const shown = blocks.filter((b) => b.stage <= stage).sort((a, b) => a.r - b.r || a.order - b.order);
  return (
    <g className={!still && stage === 5 ? 'cq-castle' : ''}>
      {shown.map((b) => b.img === 'banner'
        // Flags in the winner's color fly from the towers when the castle is built.
        ? <g key={b.order} className={still ? '' : 'cq-drop'} style={{ animationDelay: `${(b.order % 6) * 0.07}s` }}>
            <rect x={b.x + 8} y={b.y - 4} width={2.4} height={b.h + 6} rx={1.2} fill="#5b3a1e" />
            <path d={`M${b.x + 10.4} ${b.y - 3} L${b.x + 30} ${b.y + 3} L${b.x + 10.4} ${b.y + 10} Z`} fill={flag} stroke="#241c3d" strokeWidth={1} className={still ? '' : 'cq-flag'} />
          </g>
        : <image key={b.order} href={`${ART}/castle/${b.img}.png`} x={b.x} y={b.y} width={b.w} height={b.h} className={still ? '' : 'cq-drop'} style={{ animationDelay: `${(b.order % 6) * 0.07}s` }} />)}
      {stage < 1 && Object.keys(blocks.reduce((m, b) => ({ ...m, [`${b.r},${b.c}`]: 1 }), {} as Record<string, number>)).map((k) => {
        const [r, c] = k.split(',').map(Number); const { x, y } = tileXY(r, c);
        return <polygon key={k} points={hexPoints(x, y, 0.8)} fill="none" stroke="#7d8a8f" strokeWidth={2} strokeDasharray="5 4" />;
      })}
    </g>
  );
}

// ---- Pieces, the die, and the race panel -----------------------------------

function Pawn({ img, figure, color, on, shield, fast, still, hopKey, hopMs }: { img: string; figure: boolean; color: string; on: boolean; shield: boolean; fast: boolean; still: boolean; hopKey: number; hopMs: number }) {
  return (
    <div className="relative w-full h-full">
      <span className="absolute left-1/2 bottom-[2%] w-[70%] h-[14%] -translate-x-1/2 rounded-[50%] bg-black/30" />
      <motion.div key={hopKey} className="absolute inset-0" initial={false}
        animate={!still && hopKey ? { y: ['0%', `-${30 + ((hopKey * 37) % 17)}%`, '0%', '0%'], rotate: [0, ((hopKey * 53) % 11) - 5, 0, 0], scaleY: [1, 1.06, 0.86, 1], scaleX: [1, 0.96, 1.1, 1] } : { y: '0%' }}
        transition={{ duration: Math.max(0.07, hopMs / 1000), times: [0, 0.45, 0.8, 1], ease: 'easeOut' }} style={{ transformOrigin: '50% 100%' }}>
        {on && !still && <motion.span className="absolute left-1/2 -top-[34%] -translate-x-1/2 text-[0]" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.8, repeat: Infinity }}>
          <svg viewBox="0 0 20 14" className="w-[clamp(12px,1.6vw,22px)]"><path d="M2 2 L18 2 L10 12 Z" fill={color} stroke="#241c3d" strokeWidth={2} strokeLinejoin="round" /></svg>
        </motion.span>}
        {figure ? <>
          {/* The animal stands on a little disc in its team color. */}
          <span className="absolute left-1/2 bottom-[2%] w-[92%] h-[24%] -translate-x-1/2 rounded-[50%] border-[2px] border-[#241c3d]" style={{ background: color, boxShadow: on ? '0 0 0 3px #fdfd94, 0 0 14px 5px #fdfd94' : undefined }} />
          <img src={img} alt="" draggable="false" className="absolute left-1/2 bottom-[10%] w-[112%] max-w-none aspect-square -translate-x-1/2 object-contain drop-shadow-[0_2px_0_rgba(0,0,0,0.3)]" />
        </> : <>
          {/* The stand. */}
          <span className="absolute left-1/2 bottom-[6%] w-[64%] h-[26%] -translate-x-1/2 rounded-[45%_45%_40%_40%] border-[2px] border-[#241c3d]" style={{ background: `linear-gradient(${color}, color-mix(in srgb, ${color} 70%, #241c3d))` }} />
          {/* The hero on top. */}
          <img src={img} alt="" draggable="false" className="absolute left-1/2 top-0 w-[86%] aspect-square -translate-x-1/2 rounded-full object-cover border-[3px]" style={{ borderColor: color, boxShadow: on ? `0 0 0 3px #fdfd94, 0 0 14px 4px #fdfd94` : '0 2px 0 rgba(0,0,0,0.35)' }} />
        </>}
        {shield && <span className={`absolute -inset-[16%] rounded-full border-[3px] border-[#7fc4ff] bg-[radial-gradient(circle,transparent_55%,rgba(127,196,255,0.45))] ${still ? '' : 'cq-glow'}`} aria-label={t('cq.shielded')}><Shield weight="fill" className="absolute -right-[6%] -top-[6%] w-[34%] h-[34%] text-[#4a90d9] drop-shadow-[0_1px_0_#000]" /></span>}
        {fast && <Timer weight="fill" className="absolute -left-[12%] top-[8%] w-[34%] h-[34%] text-[#ef6f6c] drop-shadow-[0_1px_0_#000]" aria-label={t('cq.fast')} />}
      </motion.div>
    </div>
  );
}

// A real cube with pips that tumbles; it settles on the number rolled.
const FACE_TURN: Record<number, [number, number]> = { 1: [0, 0], 6: [0, 180], 3: [0, -90], 4: [0, 90], 2: [-90, 0], 5: [90, 0] };
function Die3D({ value, size, spinning, theme, spins = 0 }: { value: number; size: number; spinning: boolean; theme: GameTheme; spins?: number }) {
  const [rx, ry] = FACE_TURN[value];
  const face = pieceImage(theme, 'die');
  const extra = spinning ? 2 : spins;
  return (
    <div style={{ width: size, height: size, perspective: size * 5 }} role="img" aria-label={t('cq.dieShows', { n: value })}>
      <div className={spinning ? 'cq-tumble' : ''} style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d', transform: `rotateX(${rx - 18 + extra * 360}deg) rotateY(${ry + 24 + extra * 360}deg)`, transition: spinning ? 'none' : 'transform 0.9s cubic-bezier(.2,1.4,.4,1)' }}>
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="absolute inset-0 rounded-[18%] border-[2px] border-[#241c3d] grid grid-cols-3 grid-rows-3 p-[14%] gap-[4%]"
            style={{ transform: `${FACE_POS[n]} translateZ(${size / 2}px)`, backfaceVisibility: 'hidden', background: face ? `center / cover url("${face}")` : 'radial-gradient(circle at 30% 25%, #ffffff, #f1efe6)' }}>
            {Array.from({ length: 9 }, (_, k) => <span key={k} className={`rounded-full ${PIPS[n].includes(k) ? (n === 1 ? 'bg-[#ef6f6c]' : 'bg-[#241c3d]') : ''}`} />)}
          </div>
        ))}
      </div>
    </div>
  );
}
const FACE_POS: Record<number, string> = { 1: 'rotateY(0deg)', 6: 'rotateY(180deg)', 3: 'rotateY(90deg)', 4: 'rotateY(-90deg)', 2: 'rotateX(90deg)', 5: 'rotateX(-90deg)' };

// The big throw over the board: the die flies in, bounces and lands.
function DieToss({ n, mult, still, theme }: { n: number; mult: number; still: boolean; theme: GameTheme }) {
  const [landed, setLanded] = useState(still);
  useEffect(() => { if (still) return; const id = window.setTimeout(() => setLanded(true), 950); return () => window.clearTimeout(id); }, [still]);
  return (
    <motion.div className="absolute inset-0 z-20 grid place-items-center pointer-events-none" initial={{ backgroundColor: 'rgba(36,28,61,0)' }} animate={{ backgroundColor: 'rgba(36,28,61,0.28)' }} exit={{ opacity: 0 }}>
      <motion.div className="grid justify-items-center gap-2"
        initial={still ? false : { x: '-140%', y: '-60%', rotate: -40 }}
        animate={still ? undefined : { x: ['-140%', '-40%', '10%', '0%'], y: ['-60%', '10%', '-25%', '0%'], rotate: [-40, 200, 330, 360] }}
        transition={{ duration: 0.95, times: [0, 0.45, 0.75, 1], ease: 'easeOut' }}>
        <Die3D value={n} size={120} spinning={!landed} theme={theme} />
        <AnimatePresence>
          {landed && (
            <motion.p className="font-display text-4xl bg-surface border-[3px] border-border rounded-pill px-5 py-1" style={{ boxShadow: 'var(--shadow-sticker)' }}
              initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 16 }}>
              {mult > 1 ? `${n} x ${mult} = ${n * mult}` : n}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// Who is closest to the castle: a little trail per player, no numbers.
function Race({ turns, pos, playing, heroOf, start }: { turns: TurnState; pos: number[]; playing: boolean; heroOf: (p: TurnPlayer, i: number) => string; start: number }) {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  return (
    <aside className="bg-surface border-[2.5px] border-border rounded-panel p-2 lg:p-3 grid gap-2 min-w-0" style={{ boxShadow: 'var(--shadow-sticker)' }} aria-label={t('cq.race')}>
      <h2 className="hidden lg:flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted"><CastleTurret weight="fill" size={16} />{t('cq.firstToCastle')}</h2>
      <ol className="flex flex-nowrap overflow-x-auto lg:overflow-visible lg:grid gap-1.5 list-none m-0 p-1 lg:p-0">
        {turns.players.map((p, i) => {
          const on = playing && i === turns.turn;
          const f = Math.max(0, Math.min(1, ((pos[i] ?? start) - start) / (FINISH - start)));
          const color = TEAM_COLORS[p.colorIndex % TEAM_COLORS.length];
          return (
            <motion.li key={p.id} aria-current={on ? 'true' : undefined} aria-label={t('cq.raceRow', { name: p.name, n: Math.round(f * 100) })}
              animate={on && !still ? { boxShadow: ['0 0 0 3px #fdfd94, 0 0 12px 3px #fdfd94', '0 0 0 4px #fdfd94, 0 0 22px 8px #fdfd94', '0 0 0 3px #fdfd94, 0 0 12px 3px #fdfd94'] } : { boxShadow: on ? '0 0 0 4px #fdfd94' : '0 0 0 0 transparent' }}
              transition={on && !still ? { duration: 1.6, repeat: Infinity } : { duration: 0.2 }}
              className={`shrink-0 lg:shrink min-w-[11rem] lg:min-w-0 grid grid-cols-[auto_1fr] items-center gap-x-2 rounded-input border-[2px] p-1.5 ${on ? 'border-border bg-accent' : 'border-border-soft'}`}>
              <img src={heroOf(p, i)} alt="" className="row-span-2 w-10 h-10 rounded-full border-[3px] object-contain bg-surface-2" style={{ borderColor: color }} />
              <span className="font-bold truncate leading-tight">{p.name}</span>
              <span className="relative h-3 rounded-pill bg-surface-2 border-[1.5px] border-border overflow-visible">
                <motion.span className="absolute inset-y-0 left-0 rounded-pill" style={{ background: color }} animate={{ width: `${f * 100}%` }} transition={{ duration: still ? 0 : 0.5 }} />
                <CastleTurret weight="fill" className="absolute -right-1 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7d8a8f]" aria-hidden="true" />
              </span>
            </motion.li>
          );
        })}
      </ol>
    </aside>
  );
}

// Which of the nine spots on a die face hold a pip.
const PIPS: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
