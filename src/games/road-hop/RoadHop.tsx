import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowFatLeft, ArrowFatRight, ArrowFatUp, CheckCircle, HourglassMedium, Trophy } from '@phosphor-icons/react';
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
import { pieceColor, pieceFill, pieceImage } from '../../theme/library';
import { ThemedPage, useGameTheme } from '../../theme/useGameTheme';
import { ChoiceRow, Slider } from '../../ui/fields';
import GameWelcome from '../GameWelcome';
import SetPicker from '../SetPicker';
import SetupWizard from '../SetupWizard';
import ThemeScreen from '../ThemeScreen';
import { useSavedSetup } from '../useSavedSetup';
import { roadHopManifest } from './manifest';
import { COLS, cpuMove, HIDE, hop, hopPoints, makeMap, moveTo, ROWS, START, type Lane, type Move, type Pos } from './road';

type Phase = 'welcome' | 'theme' | 'setup' | 'play' | 'end';
type Step = 'question' | 'hop' | 'pause';
const HOPS = 3;
const HOP_MS = 230;
const CAR_COLORS = ['#e5635f', '#6aa9e9', '#f6c544', '#c58ce8', '#f39a6b', '#5cc3a0'];

// Road Hop (roster Stage 9): a right answer earns three hops. Traffic moves
// one step each hop, so a young player can look before they hop. A bonk
// just sends the hopper back to the grass (nobody gets hurt). Teams take
// turns on one screen, or one player answers on their own.
export default function RoadHop() {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const { theme, themes, playable, choose } = useGameTheme('road-hop');
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const [setup, change] = useSavedSetup('road-hop', { setId: LIBRARY[0].id, turns: 6, who: 'teams' as 'teams' | 'solo' });
  const setId = sets.some((s) => s.id === setup.setId) ? setup.setId : LIBRARY[0].id;
  const picked = useMemo(() => sets.filter((s) => s.id === setId).map((set) => ({ set, starred: false })), [sets, setId]);
  const game = useGamePool(picked);
  const solo = setup.who === 'solo';
  const { ask, element, missed: soloMissed } = useAsk({ gameId: 'road-hop', mode: 'solo', pool: game.pool, classroomId: game.classroomId, studentId: game.studentId });
  const deck = useMemo(() => makeDeck(game.pool), [game.pool]);
  const [team, setTeam] = useState<{ players: TurnPlayer[]; level: CpuLevel }>({ players: [], level: 'medium' });
  const [phase, setPhase] = useState<Phase>('welcome');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [turns, setTurns] = useState<TurnState | null>(null);
  const [step, setStep] = useState<Step>('question');
  const [question, setQuestion] = useState<{ q: MultipleChoiceQuestion; setId?: string } | null>(null);
  const [map, setMap] = useState<Lane[]>(() => makeMap(0));
  const [level, setLevel] = useState(0);
  // Each team keeps its own spot and its best row on this road.
  const [spots, setSpots] = useState<Record<string, { pos: Pos; best: number }>>({});
  const [hops, setHops] = useState(0);
  const [asked, setAsked] = useState(0);
  const [bonk, setBonk] = useState<{ id: number; pos: Pos } | null>(null);
  const [banner, setBanner] = useState<{ id: number; text: string } | null>(null);
  const [missed, setMissed] = useState<MultipleChoiceQuestion[]>([]);
  const busy = useRef(false);
  const timers = useRef<number[]>([]);
  const player = turns ? current(turns) : null;
  const total = (turns?.players.length ?? 1) * setup.turns;
  const spot = player ? spots[player.id] ?? { pos: START, best: 0 } : { pos: START, best: 0 };

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, still ? Math.min(ms, 250) : ms)); };

  function begin() {
    const players = solo ? [{ id: 'solo', name: t('mm.you'), kind: 'student' as const, colorIndex: 0, score: 0 }] : team.players;
    const state = startTurns(players);
    setTurns(state); setAsked(0); setMissed([]); setBanner(null); setBonk(null);
    setMap(makeMap(0)); setLevel(0); setSpots({}); setHops(0);
    setPhase('play');
    askNext(state, 0);
  }
  function askNext(state: TurnState, n: number) {
    if (n >= total) { end(state); return; }
    setAsked(n);
    setStep('question');
    if (solo) void ask().then((ok) => { if (!ok) { end(state); return; } setHops(HOPS); setStep('hop'); });
    else { const d = deck.next(); setQuestion({ q: d.question, setId: d.setId }); }
  }
  function onShareResult(right: boolean) {
    if (!turns || !question || !player) return;
    if (player.kind !== 'cpu' && player.kind !== 'teacher') {
      void data.logQuestion({ id: newId('log'), at: new Date().toISOString(), teamName: player.name, gameId: 'road-hop', mode: 'share', setId: question.setId, prompt: question.q.prompt, answer: question.q.choices[question.q.correctIndex], tries: [], ms: 0, outcome: right ? 'right' : 'skipped' });
      if (!right) setMissed((m) => (m.some((x) => x.id === question.q.id) ? m : [...m, question.q]));
    }
    setQuestion(null);
    if (right) { setHops(HOPS); setStep('hop'); } else endTurn(turns);
  }
  function endTurn(state: TurnState) {
    const n = asked + 1;
    if (n >= total) { end(state); return; }
    const next = solo ? state : nextTurn(state);
    setTurns(next);
    askNext(next, n);
  }

  function go(move: Move) {
    if (step !== 'hop' || !turns || !player || busy.current || hops <= 0) return;
    busy.current = true;
    later(() => { busy.current = false; }, HOP_MS);
    const res = hop(map, spot.pos, move);
    setMap(res.map);
    const left = hops - 1;
    if (res.bonked) {
      // Show the bump where it happened, then hop back to the grass.
      setBonk({ id: Date.now(), pos: moveTo(spot.pos, move) });
      setSpots((s) => ({ ...s, [player.id]: { pos: moveTo(spot.pos, move), best: spot.best } }));
      playEffect('miss', settings); buzz(40, settings);
      setBanner({ id: Date.now(), text: t('rh.bonk') });
      later(() => { setBonk(null); setSpots((s) => ({ ...s, [player.id]: { pos: res.pos, best: spot.best } })); }, 450);
      afterHop(left, turns, 900);
      return;
    }
    const points = hopPoints(spot.best, res.pos.row, res.across);
    const scored = points ? addPoints(turns, player.id, points) : turns;
    if (points) setTurns(scored);
    if (res.across) {
      setSpots((s) => ({ ...s, [player.id]: { pos: res.pos, best: 0 } }));
      playEffect('win', settings);
      setBanner({ id: Date.now(), text: t('rh.across') });
      if (settings.celebrations !== 'off' && !still) void confetti({ particleCount: 80, spread: 80, origin: { y: 0.35 }, disableForReducedMotion: true });
      // A new, busier road; the hopper starts at the bottom again.
      setStep('pause');
      later(() => {
        const nextLevel = level + 1;
        setLevel(nextLevel); setMap(makeMap(nextLevel)); setBanner(null);
        setSpots((s) => ({ ...s, [player.id]: { pos: START, best: 0 } }));
        endTurn(scored);
      }, 1500);
      return;
    }
    setSpots((s) => ({ ...s, [player.id]: { pos: res.pos, best: Math.max(spot.best, res.pos.row) } }));
    playEffect('tap', settings);
    afterHop(left, scored, HOP_MS);
  }
  function afterHop(left: number, state: TurnState, ms: number) {
    setHops(left);
    if (left > 0) { if (ms > HOP_MS) { setStep('pause'); later(() => { setBanner(null); setStep('hop'); }, ms); } return; }
    setStep('pause');
    later(() => { setBanner(null); endTurn(state); }, Math.max(ms, 600));
  }
  function end(state: TurnState) {
    setTurns(state); setPhase('end');
    playEffect('win', settings);
    if (settings.celebrations !== 'off' && !still) void confetti({ particleCount: 90, spread: 90, origin: { y: 0.5 }, disableForReducedMotion: true });
  }
  // The computer hops on its own.
  useEffect(() => {
    if (phase !== 'play' || step !== 'hop' || player?.kind !== 'cpu') return;
    const id = window.setTimeout(() => go(cpuMove(map, spot.pos)), 650);
    return () => window.clearTimeout(id);
  }); // eslint-disable-line react-hooks/exhaustive-deps
  // Arrow keys hop and Space waits.
  useEffect(() => {
    if (phase !== 'play') return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input, textarea, [role="dialog"]')) return;
      const m: Move | null = e.key === 'ArrowUp' ? 'up' : e.key === 'ArrowDown' ? 'down' : e.key === 'ArrowLeft' ? 'left' : e.key === 'ArrowRight' ? 'right' : e.key === ' ' ? 'wait' : null;
      if (!m) return;
      e.preventDefault(); go(m);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const canHop = phase === 'play' && step === 'hop' && player?.kind !== 'cpu';
  const grass = pieceColor(theme, 'background', '#8fe3a0');
  const roadColor = pieceColor(theme, 'road', '#4a4f6a');
  const hopperColor = pieceColor(theme, 'hopper', '#9bd35a');
  const hopperArt = pieceImage(theme, 'hopper');
  const carColors = [pieceColor(theme, 'car', CAR_COLORS[0]), ...CAR_COLORS.slice(1)];
  const cell = (r: number) => ({ top: `${((ROWS - 1 - r) / ROWS) * 100}%`, height: `${100 / ROWS}%` });
  const boardWidth = `min(100%, calc((100dvh - 330px - var(--rh-extra)) * ${COLS} / ${ROWS}))`;

  return (
    <ThemedPage theme={theme}>
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-4">
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context="road-hop" />
      <GameTopRow onSettings={() => setSettingsOpen(true)} />
      {phase === 'welcome' && (
        <GameWelcome game={roadHopManifest} cover={pieceImage(theme, 'cover')} onStart={() => setPhase('theme')} steps={[
          { icon: <CheckCircle weight="fill" size={22} />, text: t('rh.how1') },
          { icon: <ArrowFatUp weight="fill" size={22} />, text: t('rh.how2') },
          { icon: <Trophy weight="fill" size={22} />, text: t('rh.how3') },
        ]} />
      )}
      {phase === 'theme' && <ThemeScreen gameName={roadHopManifest.name} current={theme} themes={themes} playable={playable} onChoose={choose} onBack={() => setPhase('welcome')} onNext={() => setPhase('setup')} />}
      {phase === 'setup' && (
        <SetupWizard onBack={() => setPhase('theme')} onPlay={begin} pages={[
          ...(game.assigned ? [] : [{ id: 'questions', title: t('setup.questions'), content: <SetPicker sets={sets} value={[setId]} onChange={(ids) => change({ setId: ids[0] })} /> }]),
          { id: 'options', title: t('setup.options'), content: (
            <>
              <ChoiceRow label={t('mm.who')} value={setup.who} onChange={(v) => change({ who: v })} options={[{ value: 'teams', label: t('pd.teams') }, { value: 'solo', label: t('mm.solo') }]} />
              <Slider label={solo ? t('rh.turnsSolo') : t('rh.turns')} min={2} max={15} value={setup.turns} onChange={(v) => change({ turns: v })} />
            </>
          ) },
          ...(solo ? [] : [{ id: 'teams', title: t('setup.teams'), ready: team.players.length > 0, content: <TeamSetup mode="share" min={1} max={10} embedded onChange={(players, level) => setTeam({ players, level })} /> }]),
        ]} />
      )}
      {(phase === 'play' || phase === 'end') && turns && player && (
        <div className="grid lg:grid-cols-[1fr_260px] gap-3 lg:gap-4 items-start">
          <section className="grid gap-2 min-w-0 [--rh-extra:70px] lg:[--rh-extra:0px]">
            {phase === 'play' && (
              <div className="flex items-center gap-3 bg-surface border-[2.5px] border-border rounded-panel px-4 py-2" aria-live="polite">
                <TeamBadge colorIndex={player.colorIndex} size={36} />
                <span className="font-display text-xl sm:text-2xl">{step === 'question' ? t('share.whoseTurn', { name: player.name }) : player.kind === 'cpu' ? t('fr.cpuThinking') : t('rh.go', { name: player.name })}</span>
                <span className="ml-auto font-bold text-sm text-right">
                  {t('rh.turn', { n: Math.min(asked + 1, total), total })}<br />
                  <span className="inline-flex gap-1 align-middle" aria-label={t('rh.hops', { count: hops })}>
                    {Array.from({ length: HOPS }, (_, i) => <span key={i} className="w-3.5 h-3.5 rounded-full border-2 border-border" style={{ background: i < hops ? hopperColor : 'transparent' }} />)}
                  </span>
                </span>
              </div>
            )}
            <div className="relative mx-auto w-full rounded-panel border-[3px] border-border overflow-hidden" role="img" aria-label={t('rh.board', { row: spot.pos.row + 1, rows: ROWS })}
              style={{ ...pieceFill(theme, 'background', grass), aspectRatio: `${COLS} / ${ROWS}`, maxWidth: boardWidth }}>
              {map.map((lane, r) => lane.kind === 'road' ? (
                <div key={`${level}-${r}`} className="absolute inset-x-0" style={{ ...cell(r), background: roadColor }}>
                  {map[r + 1]?.kind === 'road' && <div className="absolute inset-x-0 top-0 border-t-[3px] border-dashed border-white/50" />}
                </div>
              ) : (
                <div key={`${level}-${r}`} className="absolute inset-x-0" style={{ ...cell(r), backgroundImage: 'radial-gradient(rgba(0,0,0,0.08) 1.5px, transparent 1.6px)', backgroundSize: '18px 18px' }}>
                  {r === ROWS - 1 && <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'repeating-conic-gradient(#000 0 25%, #fff 0 50%)', backgroundSize: '24px 24px' }} />}
                </div>
              ))}
              {map.flatMap((lane, r) => lane.cars.map((c) => {
                const leftCol = c.len === 2 && lane.dir === 1 ? c.x - HIDE - 1 : c.x - HIDE;
                return (
                  <div key={`${level}-${r}-${c.id}-${c.lap ?? 0}`} className="absolute p-[3%]" style={{ ...cell(r), left: `${(leftCol / COLS) * 100}%`, width: `${(c.len / COLS) * 100}%`, transition: still ? undefined : `left ${HOP_MS}ms linear` }}>
                    <Vehicle color={carColors[(r + c.id) % carColors.length]} long={c.len === 2} facing={lane.dir} />
                  </div>
                );
              }))}
              {turns.players.map((p) => {
                if (p.id !== player.id) return null;
                const pos = spot.pos;
                return (
                  <motion.div key={p.id} className="absolute p-[1.5%]" style={{ width: `${100 / COLS}%`, height: `${100 / ROWS}%` }}
                    initial={false} animate={{ left: `${(pos.col / COLS) * 100}%`, top: `${((ROWS - 1 - pos.row) / ROWS) * 100}%` }} transition={still ? { duration: 0 } : { duration: HOP_MS / 1000, ease: 'easeOut' }}>
                    <motion.div key={`${pos.row}-${pos.col}`} className="w-full h-full" initial={still ? false : { y: '-30%', scaleY: 1.1 }} animate={{ y: 0, scaleY: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
                      <Hopper color={hopperColor} art={hopperArt} dizzy={!!bonk} />
                    </motion.div>
                  </motion.div>
                );
              })}
              <AnimatePresence>
                {bonk && (
                  <motion.div key={bonk.id} className="absolute pointer-events-none flex items-center justify-center" style={{ left: `${(bonk.pos.col / COLS) * 100}%`, top: `${((ROWS - 1 - bonk.pos.row) / ROWS) * 100}%`, width: `${100 / COLS}%`, height: `${100 / ROWS}%` }}
                    initial={{ scale: 0.4, opacity: 1 }} animate={{ scale: 1.6, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                    <svg viewBox="-10 -10 20 20" className="w-full h-full"><path d="M0,-9 L2,-3 L8,-4 L4,1 L7,7 L1,4 L-3,9 L-3,3 L-9,2 L-4,-2 L-6,-8 L-1,-4 Z" fill="#fdfd94" stroke="#000" strokeWidth="0.8" /></svg>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {banner && (
                  <motion.p key={banner.id} className="absolute inset-x-0 top-[36%] text-center font-display text-4xl sm:text-5xl text-white pointer-events-none" style={{ WebkitTextStroke: '2px #000' }}
                    initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }} role="status">{banner.text}</motion.p>
                )}
              </AnimatePresence>
            </div>
            <div className="grid grid-cols-[1fr_1.4fr_1fr_1fr] gap-2 mx-auto w-full" style={{ maxWidth: boardWidth }}>
              {([['left', t('rh.left'), <ArrowFatLeft key="l" weight="fill" size={30} />], ['up', t('rh.up'), <ArrowFatUp key="u" weight="fill" size={34} />], ['right', t('rh.right'), <ArrowFatRight key="r" weight="fill" size={30} />], ['wait', t('rh.waitLabel'), <HourglassMedium key="w" weight="fill" size={28} />]] as [Move, string, ReactNode][]).map(([m, label, icon]) => (
                <button key={m} type="button" onClick={() => go(m)} disabled={!canHop} aria-label={label} title={label}
                  className={`min-h-14 rounded-input border-[2.5px] border-border flex items-center justify-center gap-1 font-bold disabled:opacity-50 ${m === 'up' ? 'bg-accent' : 'bg-surface'} ${canHop && m === 'up' ? 'motion-safe:animate-pulse' : ''}`}
                  style={{ boxShadow: 'var(--shadow-sticker)' }}>{icon}{m === 'wait' && <span className="hidden sm:inline">{t('rh.wait')}</span>}</button>
              ))}
            </div>
          </section>
          <aside className="order-first lg:order-none bg-surface border-[2.5px] border-border rounded-panel p-2 lg:p-4" aria-label={t('share.scores')}>
            <p className="hidden lg:block font-display text-lg mb-2">{t('rh.map', { n: level + 1 })}</p>
            <ol className="flex flex-wrap lg:grid gap-1.5 list-none p-0 m-0">
              {turns.players.map((p) => (
                <li key={p.id} className={`flex items-center gap-2 rounded-input border-[2px] p-1.5 ${player.id === p.id && phase === 'play' ? 'border-border bg-surface-2' : 'border-border-soft'}`}>
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
        <ResultsModal title={turns.players.length > 1 ? (leaders(turns).length > 1 ? t('share.tie') : t('share.winner', { name: leaders(turns)[0].name })) : t('pd.done', { count: turns.players[0].score })} missed={solo ? soloMissed : missed} againLabel={t('share.again')} onAgain={() => setPhase('welcome')} />
      )}
      {element}
    </main>
    </ThemedPage>
  );
}

// A round little hopper drawn in code, with big eyes a pre-reader spots.
function Hopper({ color, art, dizzy }: { color: string; art?: string; dizzy: boolean }) {
  if (art) return <img src={art} alt="" className="w-full h-full object-contain" />;
  return (
    <svg viewBox="-10 -10 20 20" className="w-full h-full drop-shadow" aria-hidden="true">
      <ellipse cx="0" cy="3" rx="8" ry="6" fill={color} stroke="#000" strokeWidth="0.9" />
      <circle cx="-4" cy="-3.5" r="3.3" fill={color} stroke="#000" strokeWidth="0.9" />
      <circle cx="4" cy="-3.5" r="3.3" fill={color} stroke="#000" strokeWidth="0.9" />
      {dizzy ? (
        <g stroke="#241c3d" strokeWidth="0.9" strokeLinecap="round"><path d="M-5.4,-4.9 L-2.6,-2.1 M-2.6,-4.9 L-5.4,-2.1" /><path d="M2.6,-4.9 L5.4,-2.1 M5.4,-4.9 L2.6,-2.1" /></g>
      ) : (
        <g><circle cx="-4" cy="-3.5" r="1.8" fill="#fff" /><circle cx="4" cy="-3.5" r="1.8" fill="#fff" /><circle cx="-3.6" cy="-3.9" r="0.9" fill="#241c3d" /><circle cx="4.4" cy="-3.9" r="0.9" fill="#241c3d" /></g>
      )}
      <path d="M-3,3.5 Q0,6 3,3.5" fill="none" stroke="#241c3d" strokeWidth="0.8" strokeLinecap="round" />
      <circle cx="-5.5" cy="3" r="1.1" fill="#f6a5c0" opacity="0.8" /><circle cx="5.5" cy="3" r="1.1" fill="#f6a5c0" opacity="0.8" />
    </svg>
  );
}

// A friendly car (or a long truck) facing the way its lane drives.
function Vehicle({ color, long, facing }: { color: string; long: boolean; facing: 1 | -1 }) {
  const w = long ? 40 : 20;
  return (
    <svg viewBox={`0 0 ${w} 14`} className="w-full h-full" preserveAspectRatio="none" aria-hidden="true" style={{ transform: facing === -1 ? 'scaleX(-1)' : undefined }}>
      <circle cx={4.5} cy={11.5} r={2.2} fill="#241c3d" /><circle cx={w - 4.5} cy={11.5} r={2.2} fill="#241c3d" />
      {long && <circle cx={w / 2} cy={11.5} r={2.2} fill="#241c3d" />}
      <rect x={1} y={long ? 2 : 4.5} width={w - 2} height={long ? 8.5 : 6} rx={2.5} fill={color} stroke="#000" strokeWidth={0.8} />
      {!long && <path d={`M5,4.8 L7.5,1.2 L13.5,1.2 L16,4.8 Z`} fill={color} stroke="#000" strokeWidth={0.8} />}
      <rect x={w - (long ? 9 : 7.5)} y={long ? 3.5 : 2.2} width={long ? 6 : 3} height={long ? 3.5 : 2.4} rx={0.8} fill="#cdeaff" stroke="#000" strokeWidth={0.5} />
      <circle cx={w - 1.5} cy={long ? 8.5 : 7.5} r={0.9} fill="#fdfd94" />
    </svg>
  );
}
