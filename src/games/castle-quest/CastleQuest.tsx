import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { CastleTurret, CheckCircle, DiceFive, Shield, Trophy } from '@phosphor-icons/react';
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
import { current, nextTurn, setScores, startTurns, TEAM_COLORS, type CpuLevel, type TurnPlayer, type TurnState } from '../../engine/turns';
import { PowerUpTray, roleOf, useHeldPowerUps } from '../../engine/HeldPowerUps';
import PowerUpPop from '../../engine/PowerUpPop';
import { t } from '../../i18n';
import { AccessButton, FullScreenButton, GameTopRow, GearButton, SettingsPanel } from '../../settings/SettingsPanel';
import { useSettings } from '../../settings/SettingsContext';
import { useGamePool } from '../../student/session';
import { pieceImage } from '../../theme/library';
import { ThemedPage, useGameTheme } from '../../theme/useGameTheme';
import type { ThemeItem } from '../../theme/types';
import { Toggle } from '../../ui/fields';
import { buttonClasses } from '../../ui/kit';
import Title from '../../ui/Title';
import GameWelcome from '../GameWelcome';
import SetPicker from '../SetPicker';
import SetupWizard from '../SetupWizard';
import ThemeScreen from '../ThemeScreen';
import WayToPlay from '../WayToPlay';
import { useSavedSetup } from '../useSavedSetup';
import { castleQuestManifest } from './manifest';
import { BOARD_H, BOARD_W, bridgeFrom, BRIDGES, CASTLE, CASTLE_STAGES, castleStage, clampPos, FINISH, HEX_H, HEX_W, isBad, openChest, PAD_TOP, placePowers, roll, ROWS, spotOf, TILES, type ChestPrize, type Power } from './board';

type Phase = 'welcome' | 'theme' | 'setup' | 'play' | 'end';
type Step = 'question' | 'roll' | 'rolling' | 'moving' | 'target';
const ART = '/classic/castle-quest';
const HEROES = ['blue_knight', 'red_mage', 'green_barbarian', 'yellow_rogue', 'red_knight', 'blue_mage', 'yellow_barbarian', 'green_rogue', 'green_knight', 'yellow_mage'];
// Wilderness, forest and a little magic near the castle (teacher, 2026-10-31).
const ROW_TILES = [['tileGrass', 'tileDirt'], ['tileGrass', 'tileAutumn'], ['tileAutumn', 'tileGrass'], ['tileGrass', 'tileStone'], ['tileMagic', 'tileGrass'], ['tileMagic', 'tileStone']];
const TOP_TREES = [[230, 70, 'pineGreen_high'], [262, 84, 'treeGreen_high'], [300, 72, 'pineGreen_mid'], [338, 86, 'treeGreen_mid'], [372, 70, 'pineAutumn_mid'], [410, 84, 'pineGreen_high'], [446, 72, 'treeAutumn_mid'], [484, 86, 'pineGreen_mid'], [520, 70, 'treeGreen_high'], [556, 84, 'pineGreen_high'], [596, 72, 'pineGreen_mid'], [160, 84, 'bushGrass'], [190, 92, 'flowerRed'], [628, 92, 'bushMagic']] as const;
const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

// Castle Quest (teacher design, 2026-10-31): teams on one screen, or two
// players head to head (or against the computer). A right answer earns a
// roll of the die; hop along the forest path, cross bridges that carry you
// ahead, and land on power-up tiles. First to the castle builds it and wins.
export default function CastleQuest() {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const { theme, themes, playable, choose } = useGameTheme('castle-quest');
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const [setup, change] = useSavedSetup('castle-quest', { setId: LIBRARY[0].id, who: 'teams' as 'teams' | 'versus', powerUps: true });
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
  const [hops, setHops] = useState(0);
  const [powers, setPowers] = useState<Map<number, Power>>(new Map());
  const [die, setDie] = useState(1);
  const [shield, setShield] = useState<number[]>([]);
  const [fast, setFast] = useState<number[]>([]);
  const [potion, setPotion] = useState(false);
  const [magnetOn, setMagnetOn] = useState(false);
  const [tornado, setTornado] = useState(false);
  const [banner, setBanner] = useState<{ id: number; text: string; image?: string } | null>(null);
  const [pop, setPop] = useState<{ id: number; item: ThemeItem; text: string } | null>(null);
  const [winner, setWinner] = useState<TurnPlayer | null>(null);
  const live = useRef(true);
  const posRef = useRef<number[]>([]);
  posRef.current = pos;
  const turnsRef = useRef<TurnState | null>(null);
  turnsRef.current = turns;
  const held = useHeldPowerUps();

  useEffect(() => () => { live.current = false; }, []);
  const items = theme.items?.length ? theme.items : castleQuestManifest.items?.classic ?? [];
  const itemFor = (p: Power) => items.find((it) => it.ability === p) ?? castleQuestManifest.items!.classic!.find((it) => it.ability === p)!;
  const player = turns ? current(turns) : null;
  const me = turns ? turns.turn : 0;
  const human = player?.kind !== 'cpu';

  function say(text: string, image?: string) { setBanner({ id: Date.now() + Math.random(), text, image }); }
  function showScores(next: number[]) {
    const s = turnsRef.current;
    if (!s) return;
    const st = setScores(s, Object.fromEntries(s.players.map((p, i) => [p.id, next[i] ?? 0])));
    turnsRef.current = st; setTurns(st);
  }
  function place(next: number[]) { posRef.current = next; setPos(next); showScores(next); }

  function begin(ps: TurnPlayer[]) {
    const state = startTurns(ps);
    turnsRef.current = state;
    setTurns(state); setMissed([]); setWinner(null);
    place(ps.map(() => 0));
    setShield(ps.map(() => 0)); setFast(ps.map(() => 0)); setPotion(false);
    setPowers(setup.powerUps ? placePowers() : new Map());
    held.reset();
    setPhase('play');
    startTurn(state);
  }
  function startTurn(state: TurnState) {
    const p = current(state);
    setPotion(false);
    setShield((s) => s.map((n, i) => (i === state.turn ? Math.max(0, n - 1) : n)));
    setFast((s) => s.map((n, i) => (i === state.turn ? Math.max(0, n - 1) : n)));
    // Held power-ups show now; a magnet goes straight onto this question.
    held.beginTurn(p.id);
    setMagnetOn(false);
    setStep('question');
    const d = deck.next();
    setQuestion({ q: d.question, setId: d.setId });
  }
  // The magnet is used the moment its turn comes (teacher, 2026-10-31).
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
    if (right) setStep('roll');
    else { say(t('cq.nextTime')); void endTurn(); }
  }

  const hopMs = (who: number) => (still ? 40 : fast[who] > 0 ? 70 : 340);
  // Hop one tile at a time (a simple hop from hexagon to hexagon).
  async function walk(who: number, to: number) {
    const from = posRef.current[who];
    const dir = to > from ? 1 : -1;
    for (let n = from; n !== to; n += dir) {
      if (!live.current) return;
      const next = [...posRef.current]; next[who] = n + dir; place(next);
      setHops((h) => h + 1);
      playEffect('tap', settings);
      await sleep(hopMs(who));
    }
  }
  async function slide(who: number, to: number) { const next = [...posRef.current]; next[who] = to; place(next); await sleep(still ? 100 : 900); }

  async function rollDie() {
    if (step !== 'roll') return;
    setStep('rolling');
    playEffect('whoosh', settings);
    if (!still) for (let k = 0; k < 8; k++) { setDie(roll()); await sleep(80); }
    const n = roll();
    setDie(n);
    const mult = potion ? 3 : 1;
    if (potion) say(t('cq.potionRoll', { n, total: n * mult }), itemFor('potion').image);
    setPotion(false);
    await sleep(still ? 100 : 450);
    setStep('moving');
    await move(me, n * mult);
    await endTurn();
  }
  // Move, then whatever the tile does: the castle, a bridge, a power-up.
  async function move(who: number, by: number, powersOn = true) {
    await walk(who, clampPos(posRef.current[who] + by));
    await land(who, powersOn);
  }
  async function land(who: number, powersOn = true) {
    const at = posRef.current[who];
    if (at >= FINISH) return;
    const up = bridgeFrom(at);
    if (up !== null) { say(t('cq.bridge')); playEffect('right', settings); await slide(who, up); }
    const power = powersOn ? powers.get(posRef.current[who]) : undefined;
    if (power) await gotPower(who, power);
  }
  async function gotPower(who: number, power: Power) {
    const s = turnsRef.current!;
    const it = itemFor(power);
    if (power === 'tornado') { setPop({ id: Date.now(), item: it, text: roleOf(castleQuestManifest, it) }); await blowAway(); return; }
    if (power === 'chest') { setPop({ id: Date.now(), item: it, text: t('cq.chestOpen') }); await sleep(still ? 300 : 1200); await openTheChest(who); return; }
    held.earn(s.players[who].id, it);
    setPop({ id: Date.now(), item: it, text: t('pu.later', { role: roleOf(castleQuestManifest, it) }) });
    playEffect('win', settings);
    await sleep(still ? 300 : 900);
  }
  // Tornado: everyone is lifted and dropped on random tiles (a shield keeps you put).
  async function blowAway() {
    playEffect('whoosh', settings);
    setTornado(true);
    await sleep(still ? 300 : 1400);
    const next = posRef.current.map((p, i) => (shield[i] > 0 || p >= FINISH ? p : 1 + Math.floor(Math.random() * (TILES - 6))));
    place(next);
    await sleep(still ? 100 : 700);
    setTornado(false);
    say(t('cq.tornadoDone'), itemFor('tornado').image);
    await sleep(still ? 200 : 900);
  }
  async function openTheChest(who: number) {
    const prize: ChestPrize = openChest();
    if (isBad(prize) && shield[who] > 0) { say(t('cq.shieldBlocks'), itemFor('shield').image); await sleep(1100); return; }
    if (prize.kind === 'move') { say(t(prize.n > 0 ? 'cq.chestAhead' : 'cq.chestBack', { n: Math.abs(prize.n) })); await sleep(still ? 200 : 900); await move(who, prize.n, false); return; }
    if (prize.kind === 'start') { say(t('cq.chestStart')); await sleep(still ? 200 : 900); await slide(who, 0); return; }
    if (prize.kind === 'swap') {
      const others = posRef.current.map((p, i) => [p, i]).filter(([, i]) => i !== who).sort((a, b) => a[0] - b[0]);
      const back = others[0];
      if (!back || back[0] >= posRef.current[who]) { say(t('cq.chestSwapNone')); await sleep(900); return; }
      say(t('cq.chestSwap', { name: turnsRef.current!.players[back[1]].name })); await sleep(still ? 200 : 900);
      const next = [...posRef.current]; [next[who], next[back[1]]] = [next[back[1]], next[who]]; place(next); await sleep(still ? 100 : 900); return;
    }
    if (prize.kind === 'potion') { const n = roll(); say(t('cq.potionRoll', { n, total: n * 3 }), itemFor('potion').image); await sleep(still ? 200 : 1000); await move(who, n * 3, false); return; }
    if (prize.kind === 'reroll') { const n = roll(); setDie(n); say(t('cq.chestReroll', { n })); await sleep(still ? 200 : 1000); await move(who, n, false); return; }
    const n = roll();
    say(t('cq.chestMystery', { n }), `${ART}/powerups/mystery.webp`);
    await sleep(still ? 200 : 1100);
    await move(who, n, false);
  }

  // Use a held power-up before rolling.
  async function applyItem(i: number) {
    const it = held.use(i);
    if (!it) return;
    playEffect('win', settings);
    if (it.ability === 'potion') { setPotion(true); say(t('cq.potionReady'), it.image); }
    if (it.ability === 'time') { setFast((f) => f.map((n, k) => (k === me ? 3 : n))); say(t('cq.timeOn'), it.image); }
    if (it.ability === 'shield') { setShield((s) => s.map((n, k) => (k === me ? 4 : n))); say(t('cq.shieldOn'), it.image); }
    if (it.ability === 'lightning') setStep('target');
  }
  async function strike(target: number) {
    setStep('moving');
    const it = itemFor('lightning');
    if (shield[target] > 0) { say(t('cq.shieldBlocks'), itemFor('shield').image); await sleep(1100); setStep('roll'); return; }
    const n = roll();
    setDie(n);
    say(t('cq.lightning', { name: turnsRef.current!.players[target].name, n }), it.image);
    playEffect('miss', settings); buzz(60, settings);
    await sleep(still ? 200 : 900);
    await walk(target, clampPos(posRef.current[target] - n));
    setStep('roll');
  }

  async function endTurn() {
    const s = turnsRef.current;
    if (!s) return;
    await sleep(still ? 200 : 500);
    held.endTurn();
    const done = posRef.current.findIndex((p) => p >= FINISH);
    if (done >= 0) {
      setWinner(s.players[done]);
      playEffect('win', settings);
      if (settings.celebrations !== 'off' && !still) void confetti({ particleCount: 140, spread: 100, origin: { y: 0.3 }, disableForReducedMotion: true });
      await sleep(still ? 300 : 1800);
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

  const best = Math.max(0, ...pos);
  const stage = castleStage(best);
  const boardW = `calc((var(--play-h) - 1.5rem - var(--cq-extra)) * ${BOARD_W / BOARD_H})`;
  const pct = (x: number, total: number) => `${(x / total) * 100}%`;
  const heroOf = (p: TurnPlayer, i: number) => pieceImage(theme, `team-${(p.colorIndex % 10) + 1}`) ?? `${ART}/heroes/${HEROES[p.colorIndex % HEROES.length] ?? HEROES[i % HEROES.length]}.webp`;
  const tileOrder = useMemo(() => Array.from({ length: TILES }, (_, i) => i).sort((a, b) => spotOf(a).y - spotOf(b).y), []);
  const tray = <PowerUpTray manifest={castleQuestManifest} items={held.held.filter((it) => it.ability !== 'magnet')} onUse={(i) => void applyItem(held.held.indexOf(held.held.filter((it) => it.ability !== 'magnet')[i]))} disabled={step !== 'roll' || !human} />;
  const dieBox = (
    <div className="flex items-center justify-center gap-3">
      <motion.div key={`${die}-${step}`} animate={step === 'rolling' && !still ? { rotate: [0, 90, 180, 270, 360] } : { rotate: 0 }} transition={{ duration: 0.6 }}
        className="w-16 h-16 lg:w-20 lg:h-20 rounded-[18px] border-[3px] border-border bg-surface grid grid-cols-3 grid-rows-3 p-2 gap-0.5" style={{ boxShadow: 'var(--shadow-sticker)' }} role="img" aria-label={t('cq.dieShows', { n: die })}>
        {Array.from({ length: 9 }, (_, k) => <span key={k} className={`rounded-full ${PIPS[die].includes(k) ? 'bg-[#241c3d]' : ''}`} />)}
      </motion.div>
      {step === 'roll' && human && (
        <button type="button" onClick={() => void rollDie()} className={buttonClasses('primary', `h-14 !px-5 !text-lg ${still ? '' : 'motion-safe:animate-pulse'}`)}><DiceFive weight="fill" size={24} />{potion ? t('cq.rollPotion') : t('cq.roll')}</button>
      )}
    </div>
  );

  return (
    <ThemedPage theme={theme} menu={phase !== 'play' && phase !== 'end'}>
    <main className={phase === 'play' || phase === 'end' ? '!p-0 [--cq-extra:10.5rem] lg:[--cq-extra:0rem]' : 'max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-6'}>
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
          { id: 'options', title: t('setup.options'), content: <Toggle label={t('pu.toggle')} hint={t('cq.powerHint')} value={setup.powerUps} onChange={(v) => change({ powerUps: v })} /> },
          versus
            ? { id: 'players', title: t('setup.players'), ready: team.players.length === 2, content: <TeamSetup key="versus" mode="versus" min={2} max={2} embedded onChange={(ps, level) => setTeam({ players: ps, level })} /> }
            : { id: 'teams', title: t('setup.teams'), ready: team.players.length > 0, content: <TeamSetup key="share" mode="share" min={1} max={6} embedded onChange={(ps, level) => setTeam({ players: ps, level })} /> },
        ]} />
      )}
      {(phase === 'play' || phase === 'end') && turns && (
        <div className="relative play-fill grid grid-cols-[minmax(0,1fr)] content-center gap-2 px-3 py-3 lg:flex lg:justify-center lg:items-center">
          <h1 className="sr-only"><Title text={castleQuestManifest.name} /></h1>
          <div className="absolute top-3 right-3 flex items-center gap-2 z-20 [&_button]:!w-11 [&_button]:!h-11">
            <FullScreenButton small />
            <AccessButton small />
            <GearButton small onClick={() => setSettingsOpen(true)} />
          </div>
          <div className="contents lg:flex lg:items-start lg:gap-4">
            <section className="relative grid grid-cols-[minmax(0,1fr)] gap-2 min-w-0">
              <div className="relative mx-auto rounded-panel border-[3px] border-border overflow-hidden select-none"
                style={{ aspectRatio: `${BOARD_W} / ${BOARD_H}`, width: boardW, maxWidth: 'min(100%, calc(100vw - 1.5rem))', background: pieceImage(theme, 'background') ? `center / cover url("${pieceImage(theme, 'background')}")` : 'radial-gradient(circle at 30% 20%, #6fbf73, #2f7d4b 70%)', boxShadow: 'var(--shadow-sticker-lg)' }}>
                <svg viewBox={`0 0 ${BOARD_W} ${BOARD_H}`} className="absolute inset-0 w-full h-full" role="img" aria-label={t('cq.board', { n: TILES })}>
                  {/* Forest along the top, and the castle at the end of the path. */}
                  {TOP_TREES.map(([x, y, n], i) => <image key={i} href={`${ART}/${n}.png`} x={x - 10} y={y - 40} width={n.startsWith('flower') ? 10 : n.startsWith('bush') ? 24 : 20} height={n.startsWith('flower') ? 9 : n.startsWith('bush') ? 16 : 64} preserveAspectRatio="xMidYMax meet" />)}
                  {tileOrder.map((i) => {
                    const s = spotOf(i);
                    const kind = pieceImage(theme, 'tile') ?? `${ART}/${ROW_TILES[s.row][i % 2]}.png`;
                    return (
                      <g key={i}>
                        <image href={kind} x={s.x - HEX_W / 2} y={s.y - 37} width={HEX_W} height={HEX_H} />
                        <text x={s.x} y={s.y + 16} textAnchor="middle" fontSize={11} fontWeight={800} fill="#fff" stroke="#000" strokeWidth={2.5} paintOrder="stroke" opacity={0.9}>{i === 0 ? t('cq.start') : i}</text>
                      </g>
                    );
                  })}
                  {/* Bridges carry you ahead, like ladders. */}
                  {BRIDGES.map(([a, b]) => {
                    const p = spotOf(a), q = spotOf(b);
                    return (
                      <g key={a}>
                        <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="#5b3a1e" strokeWidth={20} strokeLinecap="round" opacity={0.95} />
                        <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="#c58a4f" strokeWidth={15} strokeDasharray="5 3" />
                        <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="#3c2410" strokeWidth={1.6} strokeLinecap="round" transform="translate(-8 0)" opacity={0.7} />
                        <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="#3c2410" strokeWidth={1.6} strokeLinecap="round" transform="translate(8 0)" opacity={0.7} />
                      </g>
                    );
                  })}
                  {[...powers.entries()].map(([i, p]) => {
                    const s = spotOf(i);
                    const it = itemFor(p);
                    return <image key={`p${i}`} href={it.image} x={s.x - 17} y={s.y - 26} width={34} height={34} className={still ? '' : 'cq-bob'} style={{ animationDelay: `${(i % 7) * 0.2}s` }} />;
                  })}
                  <image href={pieceImage(theme, 'castle') ?? `${ART}/${CASTLE_STAGES[stage]}.png`} x={CASTLE.x - 62} y={PAD_TOP - 128} width={124} height={145} className={!still && stage === 4 ? 'cq-castle' : ''} />
                </svg>
                {/* Player pieces hop from hexagon to hexagon. */}
                {turns.players.map((p, i) => {
                  const here = pos[i] ?? 0;
                  const s = here >= FINISH ? { x: CASTLE.x, y: PAD_TOP - 40 } : spotOf(here);
                  const same = turns.players.map((_, k) => k).filter((k) => (pos[k] ?? 0) === here);
                  const off = same.length > 1 ? (same.indexOf(i) - (same.length - 1) / 2) * 2.6 : 0;
                  const on = i === turns.turn && phase === 'play';
                  return (
                    <motion.div key={p.id} className="absolute -translate-x-1/2 -translate-y-[85%] w-[7.5%] aspect-square z-10" aria-label={t('cq.pieceAt', { name: p.name, n: here })}
                      animate={tornado && shield[i] <= 0 ? { left: pct(BOARD_W / 2, BOARD_W), top: '-20%', rotate: 720, scale: 0.4 } : { left: `calc(${pct(s.x, BOARD_W)} + ${off}%)`, top: pct(s.y, BOARD_H), rotate: 0, scale: 1 }}
                      transition={tornado ? { duration: still ? 0.01 : 1.2, ease: 'easeIn' } : { duration: still ? 0.01 : Math.min(0.6, hopMs(i) / 1000), ease: 'easeOut' }}>
                      <motion.span key={on ? hops : 0} className="block w-full h-full" initial={false} animate={on && !still ? { y: ['0%', '-45%', '0%'] } : { y: '0%' }} transition={{ duration: Math.max(0.06, hopMs(i) / 1000 * 0.9) }}>
                        <img src={heroOf(p, i)} alt="" className={`w-full h-full rounded-full border-[3px] object-cover ${on ? 'ring-4 ring-accent' : ''}`} style={{ borderColor: TEAM_COLORS[p.colorIndex % TEAM_COLORS.length], boxShadow: '0 3px 0 rgba(0,0,0,0.35)' }} draggable="false" />
                        {shield[i] > 0 && <Shield weight="fill" className="absolute -right-1 -top-1 w-[42%] h-[42%] text-[#6aa9e9] drop-shadow-[0_1px_0_#000]" aria-label={t('cq.shielded')} />}
                      </motion.span>
                    </motion.div>
                  );
                })}
                <AnimatePresence>
                  {tornado && (
                    <motion.img key="tornado" src={itemFor('tornado').image} alt="" className="absolute left-1/2 top-1/2 w-[34%] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
                      initial={{ opacity: 0, scale: 0.3 }} animate={still ? { opacity: 1 } : { opacity: 1, scale: [0.6, 1.1, 1], rotate: [0, -12, 12, -8, 0], x: ['-60%', '-40%', '-50%'] }} exit={{ opacity: 0, scale: 0.4 }} transition={{ duration: 1.2 }} />
                  )}
                  {banner && (
                    <motion.p key={banner.id} className="absolute inset-x-0 top-[44%] mx-auto w-max max-w-[92%] flex items-center gap-2 font-display text-xl sm:text-2xl bg-surface border-[2.5px] border-border rounded-pill pl-2 pr-5 py-1 pointer-events-none z-20" style={{ boxShadow: 'var(--shadow-sticker)' }}
                      initial={{ y: 20, opacity: 0, scale: 0.8 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: still ? 0.01 : 0.3 }}
                      onAnimationComplete={() => { const id = banner.id; window.setTimeout(() => setBanner((b) => (b?.id === id ? null : b)), 1500); }} role="status">
                      {banner.image && <img src={banner.image} alt="" className="w-9 h-9 object-contain" />}{banner.text}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              {/* Small screens: the die and its button under the board; held power-ups float over the board. */}
              <div className="lg:hidden min-h-16">{dieBox}</div>
              <div className="lg:hidden absolute left-2 top-2 w-[min(15rem,45%)] z-20">{tray}</div>
            </section>
            <div className="order-first lg:order-none lg:w-[260px] min-w-0 grid gap-3 pr-[10.5rem] lg:pr-0 lg:pt-14">
              <ScoreBoard turns={turns} playing={phase === 'play'} round={t('cq.firstToCastle')} />
              <div className="hidden lg:block">{tray}</div>
              <div className="hidden lg:block bg-surface border-[2.5px] border-border rounded-panel p-3" style={{ boxShadow: 'var(--shadow-sticker)' }}>{dieBox}</div>
              {step === 'target' && human && (
                <div className="bg-surface border-[2.5px] border-border rounded-panel p-3 grid gap-2" style={{ boxShadow: 'var(--shadow-sticker)' }} role="group" aria-label={t('cq.pickTarget')}>
                  <p className="font-bold">{t('cq.pickTarget')}</p>
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

// Which of the nine spots on a die face hold a pip.
const PIPS: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
// Rows are drawn top first so nearer tiles overlap farther ones.
void ROWS;
