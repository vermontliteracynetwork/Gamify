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
import { TeamBadge } from '../../engine/TeamBadge';
import TeamSetup from '../../engine/TeamSetup';
import { addPoints, current, leaders, nextTurn, startTurns, type CpuLevel, type TurnPlayer, type TurnState } from '../../engine/turns';
import { useAsk } from '../../engine/useAsk';
import { t } from '../../i18n';
import { GameTopRow, SettingsPanel } from '../../settings/SettingsPanel';
import { useSettings } from '../../settings/SettingsContext';
import { useGamePool } from '../../student/session';
import { pieceFill, pieceImage } from '../../theme/library';
import { ThemedPage, useGameTheme } from '../../theme/useGameTheme';
import { ChoiceRow, Slider } from '../../ui/fields';
import GameWelcome from '../GameWelcome';
import SetPicker from '../SetPicker';
import SetupWizard from '../SetupWizard';
import ThemeScreen from '../ThemeScreen';
import { pegDropManifest } from './manifest';
import { useSavedSetup } from '../useSavedSetup';
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
  const [setup, change] = useSavedSetup('peg-drop', { setId: LIBRARY[0].id, rounds: 3, who: 'teams' as 'teams' | 'solo' });
  const setId = sets.some((s) => s.id === setup.setId) ? setup.setId : LIBRARY[0].id;
  const picked = useMemo(() => sets.filter((s) => s.id === setId).map((set) => ({ set, starred: false })), [sets, setId]);
  const game = useGamePool(picked);
  const solo = setup.who === 'solo';
  const { ask, element, missed: soloMissed } = useAsk({ gameId: 'peg-drop', mode: 'solo', pool: game.pool, classroomId: game.classroomId, studentId: game.studentId });
  const deck = useMemo(() => makeDeck(game.pool), [game.pool]);
  const [team, setTeam] = useState<{ players: TurnPlayer[]; level: CpuLevel }>({ players: [], level: 'medium' });
  const [phase, setPhase] = useState<Phase>('welcome');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [turns, setTurns] = useState<TurnState | null>(null);
  const [step, setStep] = useState<Step>('question');
  const [question, setQuestion] = useState<{ q: MultipleChoiceQuestion; setId?: string } | null>(null);
  const [path, setPath] = useState<number[] | null>(null);
  const [landed, setLanded] = useState<number | null>(null);
  const [drops, setDrops] = useState(0);
  const [missed, setMissed] = useState<MultipleChoiceQuestion[]>([]);
  const timer = useRef<number[]>([]);
  const player = turns ? current(turns) : null;
  const totalTurns = (turns?.players.length ?? 1) * setup.rounds;

  useEffect(() => () => timer.current.forEach((id) => window.clearTimeout(id)), []);

  function begin() {
    const players = solo ? [{ id: 'solo', name: t('mm.you'), kind: 'student' as const, colorIndex: 0, score: 0 }] : team.players;
    const state = startTurns(players);
    setTurns(state); setDrops(0); setMissed([]); setLanded(null); setPath(null);
    setPhase('play');
    startTurn(state);
  }
  function startTurn(state: TurnState) {
    setStep('question'); setLanded(null); setPath(null);
    if (solo) {
      void ask().then((ok) => { if (!ok) { end(state); return; } setStep('aim'); });
    } else {
      const d = deck.next();
      setQuestion({ q: d.question, setId: d.setId });
    }
  }
  function onShareResult(right: boolean) {
    if (!turns || !question || !player) return;
    if (player.kind !== 'cpu' && player.kind !== 'teacher') {
      void data.logQuestion({ id: newId('log'), at: new Date().toISOString(), teamName: player.name, gameId: 'peg-drop', mode: 'share', setId: question.setId, prompt: question.q.prompt, answer: question.q.choices[question.q.correctIndex], tries: [], ms: 0, outcome: right ? 'right' : 'skipped' });
      if (!right) setMissed((m) => (m.some((x) => x.id === question.q.id) ? m : [...m, question.q]));
    }
    setQuestion(null);
    if (right) setStep('aim'); else afterTurn(turns);
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
      const scored = addPoints(turns, current(turns).id, BUCKETS[b]);
      setTurns(scored);
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
    <ThemedPage theme={theme}>
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-6">
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context="peg-drop" />
      <GameTopRow onSettings={() => setSettingsOpen(true)} />
      {phase === 'welcome' && (
        <GameWelcome game={pegDropManifest} cover={pieceImage(theme, 'cover')} onStart={() => setPhase('theme')} steps={[
          { icon: <CheckCircle weight="fill" size={22} />, text: t('pd.how1') },
          { icon: <ArrowFatDown weight="fill" size={22} />, text: t('pd.how2') },
          { icon: <Trophy weight="fill" size={22} />, text: t('pd.how3') },
        ]} />
      )}
      {phase === 'theme' && <ThemeScreen gameName={pegDropManifest.name} current={theme} themes={themes} playable={playable} onChoose={choose} onBack={() => setPhase('welcome')} onNext={() => setPhase('setup')} />}
      {phase === 'setup' && (
        <SetupWizard onBack={() => setPhase('theme')} onPlay={begin} pages={[
          ...(game.assigned ? [] : [{ id: 'questions', title: t('setup.questions'), content: <SetPicker sets={sets} value={[setId]} onChange={(ids) => change({ setId: ids[0] })} /> }]),
          { id: 'options', title: t('setup.options'), content: (
            <>
              <ChoiceRow label={t('mm.who')} value={setup.who} onChange={(v) => change({ who: v })} options={[{ value: 'teams', label: t('pd.teams') }, { value: 'solo', label: t('mm.solo') }]} />
              <Slider label={t('pd.rounds')} min={1} max={10} value={setup.rounds} onChange={(v) => change({ rounds: v })} />
            </>
          ) },
          ...(solo ? [] : [{ id: 'teams', title: t('setup.teams'), ready: team.players.length > 0, content: <TeamSetup mode="share" min={1} max={10} embedded onChange={(players, level) => setTeam({ players, level })} /> }]),
        ]} />
      )}
      {(phase === 'play' || phase === 'end') && turns && (
        <div className="grid lg:grid-cols-[1fr_260px] gap-4 items-start">
          <section className="grid gap-2 min-w-0">
            {phase === 'play' && player && (
              <div className="flex items-center gap-3 bg-surface border-[2.5px] border-border rounded-panel px-4 py-2" aria-live="polite">
                <TeamBadge colorIndex={player.colorIndex} size={36} />
                <span className="font-display text-xl sm:text-2xl">{step === 'aim' ? (player.kind === 'cpu' ? t('fr.cpuThinking') : t('pd.pick', { name: player.name })) : step === 'question' ? t('share.whoseTurn', { name: player.name }) : t('pd.dropping')}</span>
                <span className="ml-auto font-bold text-sm">{t('pd.drop', { n: Math.min(drops + 1, totalTurns), total: totalTurns })}</span>
              </div>
            )}
            <div className="relative mx-auto w-full rounded-panel border-[3px] border-border overflow-hidden" style={{ ...pieceFill(theme, 'board', '#314677'), aspectRatio: '7 / 8', maxWidth: 'min(100%, calc((100dvh - 340px) * 7 / 8))' }}>
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
                  <motion.span key={b} animate={landed === b && !still ? { scale: [1, 1.15, 1] } : {}} className={`border-t-[3px] border-x-[1.5px] border-border flex items-center justify-center font-display text-lg sm:text-2xl ${landed === b ? 'bg-accent' : v >= 100 ? 'bg-[#ed9d75]' : v >= 50 ? 'bg-[#ddfcc6]' : 'bg-surface'}`}>{v}</motion.span>
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
          <aside className="order-first lg:order-none bg-surface border-[2.5px] border-border rounded-panel p-2 lg:p-4" aria-label={t('share.scores')}>
            <ol className="flex flex-wrap lg:grid gap-1.5 list-none p-0 m-0">
              {turns.players.map((p) => (
                <li key={p.id} className={`flex items-center gap-2 rounded-input border-[2px] p-1.5 ${player?.id === p.id && phase === 'play' ? 'border-border bg-surface-2' : 'border-border-soft'}`}>
                  <TeamBadge colorIndex={p.colorIndex} size={28} /><span className="font-bold flex-1 truncate">{p.name}</span>
                  <motion.span key={p.score} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="font-display text-2xl tabular-nums">{p.score}</motion.span>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      )}
      {question && player && phase === 'play' && !solo && <ShareQuestion question={question.q} player={player} cpuLevel={team.level} onResult={onShareResult} />}
      {phase === 'end' && turns && (
        <ResultsModal title={turns.players.length > 1 ? (leaders(turns).length > 1 ? t('share.tie') : t('share.winner', { name: leaders(turns)[0].name })) : t('pd.done', { count: turns.players[0].score })} missed={solo ? soloMissed : missed} againLabel={t('share.again')} onAgain={() => setPhase('setup')} />
      )}
      {element}
    </main>
    </ThemedPage>
  );
}
