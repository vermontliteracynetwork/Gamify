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
import { ChoiceRow, Slider, Toggle } from '../../ui/fields';
import GameWelcome from '../GameWelcome';
import SetPicker from '../SetPicker';
import SetupWizard from '../SetupWizard';
import ThemeScreen from '../ThemeScreen';
import { useSavedSetup } from '../useSavedSetup';
import { usePowerUps } from '../../engine/usePowerUps';
import { bowlingManifest } from './manifest';
import { cpuLane, fullRack, halfWidthAt, knockPins, LANE_X, LANES, PIN_SPOTS, pinDepth, rollPoints, scaleAt, xAt, yAt } from './lane';

type Phase = 'welcome' | 'theme' | 'setup' | 'play' | 'end';
type Step = 'question' | 'aim' | 'roll' | 'result';
const LANE_COLORS = ['#c9a3f5', '#8ec5ff', '#8fe3a0', '#fdfd94', '#f6a5c0'];
const ROLL_MS = 1500;
// Fixed sky dots, so the stars don't jump between turns.
const DOTS = Array.from({ length: 40 }, (_, i) => ({ x: (i * 37.7) % 100, y: (i * 23.3) % 34, r: 0.25 + (i % 3) * 0.15 }));

// Bowling (launch roster, Stage 7): a right answer earns a roll. Tap a
// lane and the planet ball rolls into ten alien pins. Two rolls a frame;
// strikes and spares earn a bonus. Teams on one screen or one player.
export default function Bowling() {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const { theme, themes, playable, choose } = useGameTheme('bowling');
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const [setup, change] = useSavedSetup('bowling', { setId: LIBRARY[0].id, frames: 3, who: 'teams' as 'teams' | 'solo', powerUps: true });
  const setId = sets.some((s) => s.id === setup.setId) ? setup.setId : LIBRARY[0].id;
  const picked = useMemo(() => sets.filter((s) => s.id === setId).map((set) => ({ set, starred: false })), [sets, setId]);
  const game = useGamePool(picked);
  const solo = setup.who === 'solo';
  const { ask, element, missed: soloMissed } = useAsk({ gameId: 'bowling', mode: 'solo', pool: game.pool, classroomId: game.classroomId, studentId: game.studentId });
  const deck = useMemo(() => makeDeck(game.pool), [game.pool]);
  const [team, setTeam] = useState<{ players: TurnPlayer[]; level: CpuLevel }>({ players: [], level: 'medium' });
  const [phase, setPhase] = useState<Phase>('welcome');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [turns, setTurns] = useState<TurnState | null>(null);
  const [step, setStep] = useState<Step>('question');
  const [question, setQuestion] = useState<{ q: MultipleChoiceQuestion; setId?: string } | null>(null);
  const [standing, setStanding] = useState<boolean[]>(fullRack);
  const [falling, setFalling] = useState<number[]>([]);
  const [roll, setRoll] = useState<0 | 1>(0);
  const [frames, setFrames] = useState(0);
  const [lane, setLane] = useState<number | null>(null);
  const [banner, setBanner] = useState<{ id: number; text: string } | null>(null);
  const [missed, setMissed] = useState<MultipleChoiceQuestion[]>([]);
  const ballRef = useRef<SVGGElement>(null);
  const timers = useRef<number[]>([]);
  // Power-ups a right answer brought: a doubled roll, or one more pin.
  const powers = usePowerUps(bowlingManifest, theme, setup.powerUps);
  const boost = useRef({ double: false, magnet: false });
  function earned(state: TurnState) {
    const it = powers.grant();
    if (!it) return;
    if (it.ability === 'double') boost.current.double = true;
    if (it.ability === 'magnet') boost.current.magnet = true;
    if (it.ability === 'bonus') setTurns(addPoints(state, current(state).id, powers.amount(it)));
  }
  const player = turns ? current(turns) : null;
  const totalFrames = (turns?.players.length ?? 1) * setup.frames;

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, still ? Math.min(ms, 300) : ms)); };

  function begin() {
    const players = solo ? [{ id: 'solo', name: t('mm.you'), kind: 'student' as const, colorIndex: 0, score: 0 }] : team.players;
    const state = startTurns(players);
    setTurns(state); setFrames(0); setMissed([]); setBanner(null);
    boost.current = { double: false, magnet: false };
    setPhase('play');
    startFrame(state);
  }
  function startFrame(state: TurnState) {
    setStanding(fullRack()); setFalling([]); setRoll(0); setLane(null);
    askFor(state, 0);
  }
  function askFor(state: TurnState, r: 0 | 1) {
    setStep('question');
    if (solo) void ask().then((ok) => { if (!ok) { end(state); return; } earned(state); setStep('aim'); });
    else { const d = deck.next(); setQuestion({ q: d.question, setId: d.setId }); }
    void r;
  }
  function onShareResult(right: boolean) {
    if (!turns || !question || !player) return;
    if (player.kind !== 'cpu' && player.kind !== 'teacher') {
      void data.logQuestion({ id: newId('log'), at: new Date().toISOString(), teamName: player.name, gameId: 'bowling', mode: 'share', setId: question.setId, prompt: question.q.prompt, answer: question.q.choices[question.q.correctIndex], tries: [], ms: 0, outcome: right ? 'right' : 'skipped' });
      if (!right) setMissed((m) => (m.some((x) => x.id === question.q.id) ? m : [...m, question.q]));
    }
    setQuestion(null);
    if (right) { earned(turns); setStep('aim'); } else endFrame(turns);
  }

  function bowl(l: number) {
    if (step !== 'aim' || !turns) return;
    const res = knockPins(l, standing);
    // Pin Magnet: one more standing pin goes down too.
    if (boost.current.magnet) {
      boost.current.magnet = false;
      const extra = standing.findIndex((up, i) => up && !res.down.includes(i));
      if (extra >= 0) { res.down.push(extra); res.gutter = false; }
    }
    setLane(l); setStep('roll');
    playEffect('whoosh', settings);
    // The ball rolls down the lane (a gutter ball drifts off the side).
    const t0 = performance.now();
    const endD = pinDepth(3) + 0.08;
    const frame = (now: number) => {
      const k = still ? 1 : Math.min(1, (now - t0) / ROLL_MS);
      const d = endD * (1 - (1 - k) ** 1.6);
      const x = res.gutter ? LANE_X[l] * (1 + 0.5 * k) : LANE_X[l];
      const s = scaleAt(d);
      ballRef.current?.setAttribute('transform', `translate(${xAt(x, d)} ${yAt(d) - 6 * s}) scale(${s})`);
      ballRef.current?.setAttribute('opacity', k > 0.92 ? String(Math.max(0, (1 - k) / 0.08)) : '1');
      if (k < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    later(() => {
      setFalling(res.down);
      if (res.down.length) { playEffect('right', settings); buzz(30, settings); } else playEffect('miss', settings);
    }, ROLL_MS * 0.78);
    later(() => land(res.down, res.gutter), ROLL_MS + 500);
  }
  function land(down: number[], gutter: boolean) {
    if (!turns) return;
    const nextStanding = standing.map((up, i) => up && !down.includes(i));
    const left = nextStanding.filter(Boolean).length;
    const base = rollPoints(down.length, roll, left);
    const points = base.points * (boost.current.double ? 2 : 1);
    const kind = base.kind;
    boost.current.double = false;
    setStanding(nextStanding); setFalling([]); setStep('result');
    const scored = addPoints(turns, current(turns).id, points);
    setTurns(scored);
    const text = kind === 'strike' ? t('sb.strike') : kind === 'spare' ? t('sb.spare') : gutter ? t('sb.gutter') : t('sb.pins', { count: down.length });
    setBanner({ id: Date.now(), text: points ? `${text} +${points}` : text });
    if (kind) {
      playEffect('win', settings);
      if (settings.celebrations !== 'off' && !still) void confetti({ particleCount: kind === 'strike' ? 90 : 50, spread: 80, origin: { y: 0.5 }, disableForReducedMotion: true });
    }
    later(() => {
      setBanner(null);
      if (roll === 0 && left > 0) { setRoll(1); setLane(null); askFor(scored, 1); }
      else endFrame(scored);
    }, 1500);
  }
  function endFrame(state: TurnState) {
    const n = frames + 1;
    setFrames(n);
    if (n >= totalFrames) { end(state); return; }
    const next = nextTurn(state);
    setTurns(next);
    startFrame(next);
  }
  function end(state: TurnState) {
    setTurns(state); setPhase('end');
    playEffect('win', settings);
    if (settings.celebrations !== 'off' && !still) void confetti({ particleCount: 90, spread: 90, origin: { y: 0.5 }, disableForReducedMotion: true });
  }
  // The computer bowls on its own after a right answer.
  useEffect(() => {
    if (phase !== 'play' || step !== 'aim' || player?.kind !== 'cpu') return;
    const id = window.setTimeout(() => bowl(cpuLane()), 900);
    return () => window.clearTimeout(id);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const canAim = phase === 'play' && step === 'aim' && player?.kind !== 'cpu';
  const pinColor = pieceColor(theme, 'pin', '#fbfcf8');
  const pinArt = pieceImage(theme, 'pin');
  const ballColor = pieceColor(theme, 'ball', '#ed9d75');
  const ballArt = pieceImage(theme, 'ball');
  const laneColor = pieceColor(theme, 'lane', '#314677');
  // Pins draw far to near so near pins sit in front.
  const order = PIN_SPOTS.map((_, i) => i).sort((a, b) => PIN_SPOTS[b][1] - PIN_SPOTS[a][1]);
  const near = 0, far = 1;
  const lanePoly = `${50 - halfWidthAt(near)},${yAt(near)} ${50 + halfWidthAt(near)},${yAt(near)} ${50 + halfWidthAt(far)},${yAt(far)} ${50 - halfWidthAt(far)},${yAt(far)}`;

  return (
    <ThemedPage theme={theme}>
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-4">
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context="bowling" />
      <GameTopRow onSettings={() => setSettingsOpen(true)} />
      {phase === 'welcome' && (
        <GameWelcome game={bowlingManifest} cover={pieceImage(theme, 'cover')} onStart={() => setPhase('theme')} steps={[
          { icon: <CheckCircle weight="fill" size={22} />, text: t('sb.how1') },
          { icon: <HandTap weight="fill" size={22} />, text: t('sb.how2') },
          { icon: <Trophy weight="fill" size={22} />, text: t('sb.how3') },
        ]} />
      )}
      {phase === 'theme' && <ThemeScreen gameName={bowlingManifest.name} current={theme} themes={themes} playable={playable} onChoose={choose} onBack={() => setPhase('welcome')} onNext={() => setPhase('setup')} />}
      {phase === 'setup' && (
        <SetupWizard onBack={() => setPhase('theme')} onPlay={begin} pages={[
          ...(game.assigned ? [] : [{ id: 'questions', title: t('setup.questions'), content: <SetPicker sets={sets} value={[setId]} onChange={(ids) => change({ setId: ids[0] })} /> }]),
          { id: 'options', title: t('setup.options'), content: (
            <>
              <ChoiceRow label={t('mm.who')} value={setup.who} onChange={(v) => change({ who: v })} options={[{ value: 'teams', label: t('pd.teams') }, { value: 'solo', label: t('mm.solo') }]} />
              <Slider label={t('sb.frames')} min={1} max={10} value={setup.frames} onChange={(v) => change({ frames: v })} />
              <Toggle label={t('pu.toggle')} hint={t('pu.toggleHint')} value={setup.powerUps} onChange={(v) => change({ powerUps: v })} />
            </>
          ) },
          ...(solo ? [] : [{ id: 'teams', title: t('setup.teams'), ready: team.players.length > 0, content: <TeamSetup mode="share" min={1} max={10} embedded onChange={(players, level) => setTeam({ players, level })} /> }]),
        ]} />
      )}
      {(phase === 'play' || phase === 'end') && turns && (
        <div className="grid lg:grid-cols-[1fr_260px] gap-3 lg:gap-4 items-start">
          <section className="grid gap-2 min-w-0 [--sb-extra:70px] lg:[--sb-extra:0px]">
            {phase === 'play' && player && (
              <div className="flex items-center gap-3 bg-surface border-[2.5px] border-border rounded-panel px-4 py-2" aria-live="polite">
                <TeamBadge colorIndex={player.colorIndex} size={36} />
                <span className="font-display text-xl sm:text-2xl">{step === 'aim' ? (player.kind === 'cpu' ? t('fr.cpuThinking') : t('sb.pick', { name: player.name })) : step === 'question' ? t('share.whoseTurn', { name: player.name }) : t('sb.rolling')}</span>
                <span className="ml-auto font-bold text-sm text-right">{t('sb.frame', { n: Math.min(frames + 1, totalFrames), total: totalFrames })}<br />{t('sb.roll', { n: roll + 1 })}</span>
              </div>
            )}
            <div className="relative mx-auto w-full rounded-panel border-[3px] border-border overflow-hidden"
              style={{ ...pieceFill(theme, 'background', '#15143a'), aspectRatio: '100 / 130', maxWidth: 'min(100%, calc((100dvh - 330px - var(--sb-extra)) * 100 / 130))' }}>
              <svg viewBox="0 0 100 130" className="absolute inset-0 w-full h-full" role="img" aria-label={t('sb.board', { count: standing.filter(Boolean).length })}>
                <defs>
                  <radialGradient id="sb-planet" cx="35%" cy="35%" r="70%"><stop offset="0%" stopColor="#fff" stopOpacity="0.55" /><stop offset="45%" stopColor={ballColor} /><stop offset="100%" stopColor="#000" stopOpacity="0.35" /></radialGradient>
                  {ballArt && <pattern id="sb-ball-art" patternContentUnits="objectBoundingBox" width="1" height="1"><image href={ballArt} width="1" height="1" preserveAspectRatio="xMidYMid slice" /></pattern>}
                </defs>
                {!pieceImage(theme, 'background') && DOTS.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#fff" opacity={0.6} />)}
                <polygon points={lanePoly} fill={laneColor} stroke="#000" strokeWidth={0.6} />
                {LANE_X.slice(0, -1).map((x, i) => {
                  const mid = (x + LANE_X[i + 1]) / 2;
                  return <line key={i} x1={xAt(mid, near)} y1={yAt(near)} x2={xAt(mid, far)} y2={yAt(far)} stroke="#fff" strokeOpacity={0.18} strokeWidth={0.3} />;
                })}
                {lane !== null && <line x1={xAt(LANE_X[lane], near)} y1={yAt(near)} x2={xAt(LANE_X[lane], pinDepth(0))} y2={yAt(pinDepth(0))} stroke={LANE_COLORS[lane]} strokeWidth={1.2} strokeDasharray="1 2" strokeLinecap="round" />}
                {order.map((i) => {
                  if (!standing[i]) return null;
                  const [px, row] = PIN_SPOTS[i];
                  const d = pinDepth(row);
                  const s = scaleAt(d) * 2.6;
                  const fall = falling.includes(i);
                  return (
                    <g key={i} transform={`translate(${xAt(px * 1.7, d)} ${yAt(d)}) scale(${s})`}>
                      <g className="bp-fx" style={fall && !still ? { animation: `sb-fall-${i % 2 ? 'l' : 'r'} 0.6s ease-in forwards` } : fall ? { opacity: 0 } : undefined}>
                        {pinArt ? <image href={pinArt} x={-3.2} y={-11.2} width={6.4} height={11.6} preserveAspectRatio="xMidYMax meet" /> : <>
                        <path d="M0,-11 C1.6,-11 2,-9.6 1.6,-8.2 C1.3,-7.2 1,-6.6 1.7,-5.4 C2.9,-3.6 3.2,-1.8 2.6,-0.4 C2.3,0.2 1.6,0.3 0,0.3 C-1.6,0.3 -2.3,0.2 -2.6,-0.4 C-3.2,-1.8 -2.9,-3.6 -1.7,-5.4 C-1,-6.6 -1.3,-7.2 -1.6,-8.2 C-2,-9.6 -1.6,-11 0,-11 Z" fill={pinColor} stroke="#000" strokeWidth={0.5} />
                        <rect x={-1.25} y={-7.3} width={2.5} height={0.9} fill="#e5635f" />
                        <circle cx={-0.6} cy={-9.4} r={0.35} fill="#241c3d" /><circle cx={0.6} cy={-9.4} r={0.35} fill="#241c3d" />
                        </>}
                      </g>
                    </g>
                  );
                })}
                <g ref={ballRef} transform={`translate(${xAt(LANE_X[lane ?? 2], 0)} ${yAt(0) - 6}) scale(1)`} opacity={step === 'roll' || step === 'aim' || step === 'question' ? 1 : 0}>
                  <circle r={6} fill={ballArt ? 'url(#sb-ball-art)' : 'url(#sb-planet)'} stroke="#000" strokeWidth={0.6} />
                  <ellipse rx={9} ry={2.1} fill="none" stroke="#fdfd94" strokeWidth={0.9} transform="rotate(-14)" />
                </g>
              </svg>
              <AnimatePresence>
                {banner && (
                  <motion.p key={banner.id} className="absolute inset-x-0 top-[38%] text-center font-display text-4xl sm:text-5xl text-white" style={{ WebkitTextStroke: '2px #000' }}
                    initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }} role="status">{banner.text}</motion.p>
                )}
              </AnimatePresence>
            </div>
            <div className="grid grid-cols-5 gap-2 mx-auto w-full" style={{ maxWidth: 'min(100%, calc((100dvh - 330px - var(--sb-extra)) * 100 / 130))' }}>
              {Array.from({ length: LANES }, (_, l) => (
                <button key={l} type="button" onClick={() => bowl(l)} disabled={!canAim} aria-label={t('sb.lane', { n: l + 1 })}
                  className={`min-h-14 rounded-input border-[2.5px] border-border font-display text-2xl disabled:opacity-60 ${canAim ? 'motion-safe:animate-pulse' : ''}`}
                  style={{ background: LANE_COLORS[l], boxShadow: 'var(--shadow-sticker)' }}>{l + 1}</button>
              ))}
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
        <ResultsModal title={turns.players.length > 1 ? (leaders(turns).length > 1 ? t('share.tie') : t('share.winner', { name: leaders(turns)[0].name })) : t('pd.done', { count: turns.players[0].score })} missed={solo ? soloMissed : missed} againLabel={t('share.again')} onAgain={() => setPhase('welcome')} />
      )}
      {powers.element}
      {element}
    </main>
    </ThemedPage>
  );
}
