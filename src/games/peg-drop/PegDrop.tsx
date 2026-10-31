import Title from '../../ui/Title';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowFatDown, CheckCircle, Trophy } from '@phosphor-icons/react';
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
import { addPoints, current, leaders, nextTurn, startTurns, type CpuLevel, type TurnPlayer, type TurnState } from '../../engine/turns';
import { useAsk } from '../../engine/useAsk';
import { t } from '../../i18n';
import { GameTopRow, SettingsPanel } from '../../settings/SettingsPanel';
import { useSettings } from '../../settings/SettingsContext';
import { useGamePool } from '../../student/session';
import { pieceColor, pieceFill, pieceImage } from '../../theme/library';
import { ThemedPage, useGameTheme } from '../../theme/useGameTheme';
import { Slider, Toggle } from '../../ui/fields';
import { useSignedIn } from '../../auth/session';
import GameWelcome from '../GameWelcome';
import SetPicker from '../SetPicker';
import WayToPlay from '../WayToPlay';
import SetupWizard from '../SetupWizard';
import ThemeScreen from '../ThemeScreen';
import { pegDropManifest } from './manifest';
import { useSavedSetup } from '../useSavedSetup';
import { usePowerUps } from '../../engine/usePowerUps';
import { BUCKETS, bucketOf, dropPath, ROWS, ZONES } from './board';


type Phase = 'welcome' | 'theme' | 'setup' | 'play' | 'end';
type Step = 'question' | 'aim' | 'drop' | 'landed';
const xPct = (x: number) => ((x + 0.5) / ZONES) * 100;
const yPct = (row: number) => 6 + (row / ROWS) * 74; // row 0 = drop line, ROWS = just above the buckets

// Peg Drop (launch roster, Stage 7): teams (or one player) answer, then
// pick a drop zone; the ball bounces down the pegs into a bucket of points.
export default function PegDrop() {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const { theme, themes, playable, choose } = useGameTheme('peg-drop');
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const [setup, change] = useSavedSetup('peg-drop', { setId: LIBRARY[0].id, rounds: 3, who: 'teams' as 'teams' | 'solo', powerUps: true });
  const setId = sets.some((s) => s.id === setup.setId) ? setup.setId : LIBRARY[0].id;
  const picked = useMemo(() => sets.filter((s) => s.id === setId).map((set) => ({ set, starred: false })), [sets, setId]);
  const game = useGamePool(picked);
  // Students who join with a code play on their own device; teachers pick the way.
  const { teacher } = useSignedIn();
  const solo = setup.who === 'solo' || !teacher;
  const { ask, element, missed: soloMissed } = useAsk({ gameId: 'peg-drop', mode: 'solo', pool: game.pool, classroomId: game.classroomId, studentId: game.studentId });
  const deck = useMemo(() => makeDeck(game.pool), [game.pool]);
  const [team, setTeam] = useState<{ players: TurnPlayer[]; level: CpuLevel }>({ players: [], level: 'medium' });
  const [phase, setPhase] = useState<Phase>('welcome');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [turns, setTurns] = useState<TurnState | null>(null);
  const [step, setStep] = useState<Step>('question');
  const [question, setQuestion] = useState<{ q: MultipleChoiceQuestion; setId?: string; chance: number } | null>(null);
  const [path, setPath] = useState<number[] | null>(null);
  const [landed, setLanded] = useState<number | null>(null);
  const [drops, setDrops] = useState(0);
  const [missed, setMissed] = useState<MultipleChoiceQuestion[]>([]);
  const timer = useRef<number[]>([]);
  // Power-ups a right answer brought: a doubled drop, or one more drop.
  const powers = usePowerUps(pegDropManifest, theme, setup.powerUps);
  const boost = useRef({ double: false, extra: false });
  function earned(state: TurnState): TurnState {
    const it = powers.grant();
    if (!it) return state;
    if (it.ability === 'double') boost.current.double = true;
    if (it.ability === 'extra') boost.current.extra = true;
    if (it.ability === 'bonus') { const next = addPoints(state, current(state).id, powers.amount(it)); setTurns(next); return next; }
    return state;
  }
  const player = turns ? current(turns) : null;
  const totalTurns = (turns?.players.length ?? 1) * setup.rounds;

  useEffect(() => () => timer.current.forEach((id) => window.clearTimeout(id)), []);

  function begin() {
    const players = solo ? [{ id: 'solo', name: t('mm.you'), kind: 'student' as const, colorIndex: 0, score: 0 }] : team.players;
    const state = startTurns(players);
    setTurns(state); setDrops(0); setMissed([]); setLanded(null); setPath(null);
    boost.current = { double: false, extra: false };
    setPhase('play');
    startTurn(state);
  }
  function startTurn(state: TurnState) {
    setStep('question'); setLanded(null); setPath(null);
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
      void data.logQuestion({ id: newId('log'), at: new Date().toISOString(), teamName: player.name, gameId: 'peg-drop', mode: 'share', setId: question.setId, prompt: question.q.prompt, answer: question.q.choices[question.q.correctIndex], tries: [], ms: 0, outcome: right ? 'right' : 'skipped' });
      if (!right) setMissed((m) => (m.some((x) => x.id === question.q.id) ? m : [...m, question.q]));
    }
    // Three tries, a new question each time (teacher, 2026-10-31, as in Game Show).
    if (!right && question.chance < CHANCES) { const d = deck.next(); setQuestion({ q: d.question, setId: d.setId, chance: question.chance + 1 }); return; }
    setQuestion(null);
    if (right) { earned(turns); setStep('aim'); } else afterTurn(turns);
  }
  function drop(zone: number) {
    if (step !== 'aim' || !turns) return;
    const p = dropPath(zone);
    setPath(p); setStep('drop');
    playEffect('whoosh', settings);
    const ms = still ? 300 : 2000;
    timer.current.push(window.setTimeout(() => {
      const b = bucketOf(p);
      setLanded(b); setStep('landed');
      playEffect(BUCKETS[b] >= 100 ? 'win' : 'right', settings);
      buzz(30, settings);
      const scored = addPoints(turns, current(turns).id, BUCKETS[b] * (boost.current.double ? 2 : 1));
      boost.current.double = false;
      setTurns(scored);
      // One more drop: the same player aims again, no question.
      if (boost.current.extra) { boost.current.extra = false; timer.current.push(window.setTimeout(() => { setLanded(null); setPath(null); setStep('aim'); }, still ? 900 : 1500)); return; }
      timer.current.push(window.setTimeout(() => afterTurn(scored), still ? 900 : 1500));
    }, ms));
  }
  function afterTurn(state: TurnState) {
    const n = drops + 1;
    setDrops(n);
    if (n >= totalTurns) { end(state); return; }
    const next = nextTurn(state);
    setTurns(next);
    startTurn(next);
  }
  function end(state: TurnState) {
    setTurns(state); setPhase('end');
    playEffect('win', settings);
    if (settings.celebrations !== 'off' && !still) void confetti({ particleCount: 90, spread: 90, origin: { y: 0.5 }, disableForReducedMotion: true });
  }
  // The computer aims at a random zone after a right answer.
  useEffect(() => {
    if (phase !== 'play' || step !== 'aim' || player?.kind !== 'cpu') return;
    const id = window.setTimeout(() => drop(Math.floor(Math.random() * ZONES)), 900);
    return () => window.clearTimeout(id);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  // The ball steps down one row at a time (a short slide between pegs).
  const [ballAt, setBallAt] = useState(0);
  useEffect(() => {
    if (!path || step !== 'drop') return;
    setBallAt(0);
    if (still) { setBallAt(path.length); return; }
    let i = 0;
    const id = window.setInterval(() => { i += 1; setBallAt(i); if (i >= path.length) window.clearInterval(id); }, 2000 / (path.length + 1));
    return () => window.clearInterval(id);
  }, [path, step, still]);
  const ballX = path ? xPct(path[Math.min(ballAt, path.length - 1)]) : 50;
  const ballY = path ? (ballAt >= path.length ? 88 : yPct(ballAt)) : 0;
  const ball = path && (
    <span className="absolute w-[7%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] border-border z-10"
      style={{ ...pieceFill(theme, 'ball', '#fdfd94'), left: `${ballX}%`, top: `${ballY}%`, transition: still ? 'none' : 'left 0.2s ease-out, top 0.2s cubic-bezier(0.5, 0, 1, 1)' }} aria-hidden="true" />
  );

  return (
    <ThemedPage theme={theme} menu={phase !== 'play' && phase !== 'end'}>
    <main className="landscape:[--wide-save:5.75rem] max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-6">
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context="peg-drop" />
      <GameTopRow onSettings={() => setSettingsOpen(true)}>
        {(phase === 'play' || phase === 'end') && <h1 className="title-bubble text-3xl sm:text-4xl"><Title text={pegDropManifest.name} /></h1>}
      </GameTopRow>
      {phase === 'welcome' && (
        <GameWelcome game={pegDropManifest} cover={pieceImage(theme, 'cover')} onStart={() => setPhase(themes.length > 1 ? 'theme' : 'setup')} steps={[
          { icon: <CheckCircle weight="fill" size={22} />, text: t('pd.how1') },
          { icon: <ArrowFatDown weight="fill" size={22} />, text: t('pd.how2') },
          { icon: <Trophy weight="fill" size={22} />, text: t('pd.how3') },
        ]} />
      )}
      {phase === 'theme' && <ThemeScreen gameName={pegDropManifest.name} current={theme} themes={themes} playable={playable} onChoose={choose} onBack={() => setPhase('welcome')} onNext={() => setPhase('setup')} />}
      {phase === 'setup' && (
        <SetupWizard onBack={() => setPhase(themes.length > 1 ? 'theme' : 'welcome')} onPlay={begin} pages={[
          // Pick the way to play first (teacher, 2026-10-31); students arrive with theirs set.
          ...(!teacher ? [] : [{ id: 'way', title: t('way.title'), content: <WayToPlay modes={['share', 'solo']} value={solo ? 'solo' : 'share'} onChange={(m) => change({ who: m === 'solo' ? 'solo' : 'teams' })} /> }]),
          ...(game.assigned ? [] : [{ id: 'questions', title: t('setup.questions'), content: <SetPicker sets={sets} value={[setId]} onChange={(ids) => change({ setId: ids[0] })} /> }]),
          { id: 'options', title: t('setup.options'), content: (
            <>
              <Slider label={t('pd.rounds')} min={1} max={10} value={setup.rounds} onChange={(v) => change({ rounds: v })} />
              <Toggle label={t('pu.toggle')} hint={t('pu.toggleHint')} value={setup.powerUps} onChange={(v) => change({ powerUps: v })} />
            </>
          ) },
          ...(solo ? [] : [{ id: 'teams', title: t('setup.teams'), ready: team.players.length > 0, content: <TeamSetup mode="share" min={1} max={10} embedded onChange={(players, level) => setTeam({ players, level })} /> }]),
        ]} />
      )}
      {(phase === 'play' || phase === 'end') && turns && (
        <div className="grid lg:grid-cols-[1fr_260px] gap-4 items-start">
          <section className="grid gap-2 min-w-0">
            <div className="relative mx-auto w-full rounded-panel border-[3px] border-border overflow-hidden" style={{ ...pieceFill(theme, 'board', '#314677'), aspectRatio: '7 / 8', maxWidth: 'min(100%, calc((100dvh - 17.75rem + var(--chrome-save, 0rem) + var(--wide-save, 0rem)) * 7 / 8))' }}>
              {Array.from({ length: ZONES }, (_, z) => (
                <button key={z} type="button" onClick={() => player?.kind !== 'cpu' && drop(z)} disabled={step !== 'aim' || player?.kind === 'cpu'} aria-label={t('pd.zone', { n: z + 1 })}
                  className={`absolute -translate-x-1/2 top-[1%] w-[11%] aspect-square rounded-full flex items-center justify-center ${step === 'aim' && player?.kind !== 'cpu' ? 'bg-accent border-[2.5px] border-border motion-safe:animate-pulse' : 'opacity-0'}`}
                  style={{ left: `${xPct(z)}%` }}><ArrowFatDown weight="fill" size={20} /></button>
              ))}
              {Array.from({ length: ROWS }, (_, r) => Array.from({ length: r % 2 === 0 ? ZONES - 1 : ZONES }, (_, k) => {
                const x = r % 2 === 0 ? k + 0.5 : k;
                return <span key={`${r}-${k}`} className="absolute w-[3.2%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border-[2px] border-border" style={{ left: `${xPct(x)}%`, top: `${yPct(r + 0.5)}%`, ...pieceFill(theme, 'peg', '#fbfcf8') }} aria-hidden="true" />;
              }))}
              <div className="absolute inset-x-0 bottom-0 h-[16%] grid" style={{ gridTemplateColumns: `repeat(${ZONES}, minmax(0, 1fr))` }}>
                {BUCKETS.map((v, b) => (
                  <motion.span key={b} animate={landed === b && !still ? { scale: [1, 1.15, 1] } : {}} className={`border-t-[3px] border-x-[1.5px] border-border flex items-center justify-center font-display text-lg sm:text-2xl ${landed === b ? '!bg-accent' : ''}`}
                    style={v >= 100 ? pieceFill(theme, 'bucket-big', '#ed9d75') : pieceImage(theme, 'bucket') ? pieceFill(theme, 'bucket', '#fbfcf8') : { background: v >= 50 ? '#ddfcc6' : pieceColor(theme, 'bucket', '#fbfcf8') }}>{v}</motion.span>
                ))}
              </div>
              {ball}
              <AnimatePresence>
                {landed !== null && (
                  <motion.span key={drops} className="absolute font-display text-4xl text-white -translate-x-1/2" style={{ left: `${xPct(landed)}%`, WebkitTextStroke: '2px #000' }}
                    initial={{ top: '78%', opacity: 1 }} animate={{ top: '55%', opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>+{BUCKETS[landed]}</motion.span>
                )}
              </AnimatePresence>
            </div>
          </section>
          <ScoreBoard turns={turns} playing={phase === 'play'} round={t('pd.drop', { n: Math.min(drops + 1, totalTurns), total: totalTurns })} />
        </div>
      )}
      {question && player && phase === 'play' && !solo && <ShareQuestion key={`${question.q.id}-${question.chance}`} question={question.q} player={player} cpuLevel={team.level} onResult={onShareResult} chance={{ n: question.chance, total: CHANCES }} />}
      {phase === 'end' && turns && (
        <ResultsModal winners={turns.players.length > 1 ? leaders(turns) : undefined} title={turns.players.length > 1 ? (leaders(turns).length > 1 ? t('share.tie') : t('share.winner', { name: leaders(turns)[0].name })) : t('pd.done', { count: turns.players[0].score })} missed={solo ? soloMissed : missed} againLabel={t('share.again')} onAgain={() => setPhase('welcome')} />
      )}
      {powers.element}
      {element}
    </main>
    </ThemedPage>
  );
}
