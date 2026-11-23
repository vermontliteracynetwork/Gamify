import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Play, X } from '@phosphor-icons/react';
import { data, newId } from '../data';
import { LIBRARY } from '../data/library';
import { useMySets } from '../data/hooks';
import type { MultipleChoiceQuestion } from '../data/types';
import { makeDeck } from '../engine/picker';
import ResultsModal from '../engine/ResultsModal';
import ScoreBoard, { RoundMeter } from '../engine/ScoreBoard';
import ShareQuestion from '../engine/ShareQuestion';
import TeamSetup from '../engine/TeamSetup';
import { POP_IN } from '../engine/pace';
import { PowerUpCards } from '../engine/PowerUpSwitches';
import { addPoints, CPU_ACCURACY, current, leaders, nextTurn, setScores, startTurns, type CpuLevel, type TurnPlayer, type TurnState } from '../engine/turns';
import { useAsk } from '../engine/useAsk';
import { t } from '../i18n';
import { GameTopRow, SettingsPanel } from '../settings/SettingsPanel';
import { useSettings } from '../settings/SettingsContext';
import { useGamePool } from '../student/session';
import { Slider } from '../ui/fields';
import PopText from '../ui/PopText';
import Title from '../ui/Title';
import SetPicker from '../games/SetPicker';
import SetupWizard from '../games/SetupWizard';
import WayToPlay from '../games/WayToPlay';
import ShareHow from '../games/ShareHow';
import { useSavedSetup } from '../games/useSavedSetup';
import { makeSfx } from './sfx';
import { LAB_MODES } from './registry';
import { ModeBadge } from '../games/ModeBadge';
import type { LabCtx, LabDef, LabPower } from './types';
import { wordsFrom } from './words';

type Phase = 'welcome' | 'setup' | 'play' | 'end';
const POWER_CHANCE = 0.4;

// The one shell every Game Lab game plays in: the standard Gamify welcome
// and setup pages, then the game's own board beside the shared score board,
// the shared question screens, power-up cards, big center messages and the
// results box. The game only draws its board and decides what a right
// answer does.
export default function LabGame({ def }: { def: LabDef }) {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const sfx = useMemo(() => makeSfx(settings), [settings]);
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  // Steal and swap style power-ups start switched off (teacher, 2026-11-01).
  const [setup, change] = useSavedSetup(`lab:${def.id}`, { setId: LIBRARY[0].id, rounds: def.rounds.default, who: '' as string, off: def.powers.filter((p) => p.takes).map((p) => p.id) as string[] });
  const setId = sets.some((s) => s.id === setup.setId) ? setup.setId : LIBRARY[0].id;
  const picked = useMemo(() => sets.filter((s) => s.id === setId).map((set) => ({ set, starred: false })), [sets, setId]);
  const game = useGamePool(picked);
  // The ways this game plays (teacher, 2026-11-23: specific per game, picked
  // on the first setup page). Live is planned and not offered here yet.
  // No Versus category (teacher, 2026-11-23): Share is teams or two players on
  // one screen; Solo is one player, or one player against the computer when
  // the game is a turn game with no solo of its own.
  const ways = (LAB_MODES[def.id] ?? ['share']).filter((m): m is 'share' | 'solo' => (m === 'share' && def.ways.includes('teams')) || (m === 'solo' && (def.ways.includes('solo') || def.ways.includes('teams'))));
  const way: 'share' | 'solo' = ways.includes(setup.who as 'share') ? (setup.who as 'share' | 'solo') : ways[0] ?? 'solo';
  const versus = way === 'solo' && !def.ways.includes('solo');
  const solo = way === 'solo' && !versus;
  const { ask: soloAsk, element: soloElement, missed: soloMissed } = useAsk({ gameId: def.id, mode: 'solo', pool: game.pool, classroomId: game.classroomId, studentId: game.studentId });
  const deck = useMemo(() => makeDeck(game.pool), [game.pool]);
  const [team, setTeam] = useState<{ players: TurnPlayer[]; level: CpuLevel }>({ players: [], level: 'medium' });
  const [phase, setPhase] = useState<Phase>('welcome');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [turns, setTurnsState] = useState<TurnState | null>(null);
  const turnsRef = useRef<TurnState | null>(null);
  const setTurns = useCallback((s: TurnState) => { turnsRef.current = s; setTurnsState(s); }, []);
  const [taken, setTaken] = useState(0);
  const takenRef = useRef(0);
  const [question, setQuestion] = useState<{ q: MultipleChoiceQuestion; setId?: string; resolve: (ok: boolean) => void } | null>(null);
  const [missed, setMissed] = useState<MultipleChoiceQuestion[]>([]);
  const [card, setCard] = useState<{ id: number; p: LabPower; text: string; resolve: () => void } | null>(null);
  const [message, setMessage] = useState<{ id: number; text: string; tone: 'good' | 'oops' | 'big' } | null>(null);
  const [held, setHeldState] = useState<Record<string, LabPower[]>>({});
  const [status, setStatus] = useState<ReactNode>(null);
  const [endTitle, setEndTitle] = useState<string | null>(null);
  const [runId, setRunId] = useState(0);
  const powers = def.powers.filter((p) => !setup.off.includes(p.id));
  const player = turns ? current(turns) : null;
  const perRound = turns?.players.length ?? 1;
  const round = Math.min(setup.rounds, Math.floor(taken / perRound) + 1);

  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(() => setMessage(null), message.tone === 'big' ? 1800 : 1300);
    return () => window.clearTimeout(id);
  }, [message]);

  function begin() {
    const players = solo ? [{ id: 'solo', name: t('mm.you'), kind: 'student' as const, colorIndex: 0, score: 0 }] : team.players;
    setTurns(startTurns(players));
    takenRef.current = 0; setTaken(0);
    setMissed([]); setHeldState({}); setStatus(null); setEndTitle(null); setMessage(null); setCard(null); setQuestion(null);
    setRunId((n) => n + 1);
    setPhase('play');
  }

  const finish = useCallback((title?: string) => {
    setEndTitle(title ?? null);
    setPhase('end');
    sfx.cheer();
    if (settings.celebrations !== 'off' && !still) void confetti({ particleCount: 110, spread: 100, origin: { y: 0.5 }, disableForReducedMotion: true });
  }, [sfx, settings.celebrations, still]);

  const log = useCallback((q: MultipleChoiceQuestion, right: boolean) => {
    const p = turnsRef.current ? current(turnsRef.current) : null;
    if (p && (p.kind === 'cpu' || p.kind === 'teacher')) return;
    void data.logQuestion({ id: newId('log'), at: new Date().toISOString(), teamName: p?.name ?? 'You', gameId: def.id, mode: solo ? 'solo' : 'share', setId: undefined, prompt: q.prompt, answer: q.choices[q.correctIndex], tries: [], ms: 0, outcome: right ? 'right' : 'skipped' });
    if (!right) setMissed((m) => (m.some((x) => x.id === q.id) ? m : [...m, q]));
  }, [def.id, solo]);

  const ctx: LabCtx | null = turns && player ? {
    def, solo, still, settings, turns, player,
    timeScale: settings.timers === 'off' ? 0 : settings.timers === 'relaxed' ? 1.5 : 1,
    shake: !still && settings.screenShake !== false,
    cpu: player.kind === 'cpu',
    cpuLevel: team.level,
    cpuRight: () => Math.random() < CPU_ACCURACY[team.level],
    round, rounds: setup.rounds, taken,
    ask: () => {
      const p = turnsRef.current ? current(turnsRef.current) : player;
      if (solo) return soloAsk();
      return new Promise<boolean>((resolve) => {
        const d = deck.next();
        setQuestion({ q: d.question, setId: d.setId, resolve: (ok) => {
          if (p.kind !== 'cpu' && p.kind !== 'teacher') {
            void data.logQuestion({ id: newId('log'), at: new Date().toISOString(), teamName: p.name, gameId: def.id, mode: 'share', setId: d.setId, prompt: d.question.prompt, answer: d.question.choices[d.question.correctIndex], tries: [], ms: 0, outcome: ok ? 'right' : 'skipped' });
            if (!ok) setMissed((m) => (m.some((x) => x.id === d.question.id) ? m : [...m, d.question]));
          }
          resolve(ok);
        } });
      });
    },
    draw: () => deck.next().question,
    log,
    points: (n, playerId) => {
      const s = turnsRef.current; if (!s) return;
      setTurns(addPoints(s, playerId ?? current(s).id, n));
    },
    setScores: (scores) => { const s = turnsRef.current; if (s) setTurns(setScores(s, scores)); },
    next: () => {
      const s = turnsRef.current; if (!s) return false;
      const n = takenRef.current + 1;
      takenRef.current = n; setTaken(n);
      if (n >= setup.rounds * s.players.length) { finish(); return false; }
      if (!solo) setTurns(nextTurn(s));
      return true;
    },
    finish,
    power: (chance = POWER_CHANCE, allow) => new Promise<LabPower | null>((resolve) => {
      const s = turnsRef.current;
      const anyPoints = !!s && s.players.some((p) => p.id !== current(s).id && p.score > 0);
      const list = powers.filter((p) => (!p.takes || anyPoints) && (!allow || allow(p)));
      if (!list.length || Math.random() >= chance) { resolve(null); return; }
      const p = list[Math.floor(Math.random() * list.length)];
      if (p.silly) sfx.oops(); else sfx.power();
      setCard({ id: Date.now(), p, text: p.desc, resolve: () => resolve(p) });
    }),
    showPower: (p, text) => new Promise<void>((resolve) => {
      if (p.silly) sfx.oops(); else sfx.power();
      setCard({ id: Date.now(), p, text: text ?? p.desc, resolve });
    }),
    say: (text, tone = 'good') => setMessage({ id: Date.now() + Math.random(), text, tone }),
    burst: (x = 0.5, y = 0.45, size = 'small') => {
      if (settings.celebrations === 'off' || still) return;
      void confetti({ particleCount: size === 'big' ? 120 : 40, spread: size === 'big' ? 100 : 60, startVelocity: size === 'big' ? 45 : 28, origin: { x, y }, disableForReducedMotion: true });
    },
    sfx,
    words: (opts) => wordsFrom(game.pool, opts),
    setHeld: (id, list) => setHeldState((h) => ({ ...h, [id]: list })),
    held,
    setStatus,
  } : null;

  // The computer's power-up cards close on their own (its turns go on by themselves).
  useEffect(() => {
    if (!card || player?.kind !== 'cpu') return;
    const id = window.setTimeout(() => { card.resolve(); setCard(null); }, 2400);
    return () => window.clearTimeout(id);
  }, [card, player?.kind]);

  const Play = def.Play;
  const playing = phase === 'play' || phase === 'end';
  const top = turns ? leaders(turns) : [];
  const myHeld = player ? held[player.id] ?? [] : [];

  return (
    <div className={`game-stage relative ${playing ? "" : "brand-menu"} min-h-[calc(100dvh-4rem)]`} style={playing ? { background: def.background } : undefined}>
      <main className={`${playing ? 'max-w-[110rem]' : 'max-w-6xl'} mx-auto px-3 sm:px-5 pt-3 pb-2`}>
        <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context={def.id} />
        {/* In play the small round controls overlap the top right (teacher, 2026-10-24). */}
        <div className={playing ? 'absolute right-3 sm:right-5 top-2 z-20 [&_.game-top]:mb-0' : ''}><GameTopRow onSettings={() => setSettingsOpen(true)} /></div>
        {phase === 'welcome' && <LabWelcome def={def} still={still} onStart={() => setPhase('setup')} />}
        {phase === 'setup' && (
          <SetupWizard onBack={() => setPhase('welcome')} onPlay={begin} pages={[
            ...(ways.length > 1 ? [{ id: 'way', title: t('way.title'), content: <div className="grid gap-6"><WayToPlay modes={ways} value={way} onChange={(m) => change({ who: m })} />{way === 'share' && <ShareHow gameId={`lab/${def.id}`} setId={setId} />}</div> }] : []),
            ...(game.assigned ? [] : [{ id: 'questions', title: t('setup.questions'), content: <SetPicker sets={sets} value={[setId]} onChange={(ids) => change({ setId: ids[0] })} /> }]),
            
            { id: 'options', title: t('setup.options'), content: <Slider label={def.rounds.label} min={def.rounds.min} max={def.rounds.max} value={setup.rounds} onChange={(v) => change({ rounds: v })} /> },
            ...(solo ? [] : [{ id: 'teams', title: t('setup.teams'), ready: team.players.length > 0, content: <TeamSetup key={versus ? 'versus' : 'share'} vsComputer={versus} mode={versus ? 'versus' : 'share'} min={versus ? 2 : def.minTeams ?? 1} max={versus ? 2 : def.maxTeams ?? 8} embedded onChange={(players, level) => setTeam({ players, level })} /> }]),
            ...(def.powers.length ? [{ id: 'powers', title: t('tb.powers'), content: (
              <PowerUpCards hint={t('pu.switchHint')} onChange={(id, on) => change({ off: on ? setup.off.filter((x) => x !== id) : [...new Set([...setup.off, id])] })}
                cards={def.powers.map((p) => ({ id: p.id, name: p.name, hint: p.desc, art: <span className="w-12 h-12 inline-flex [&>svg]:w-full [&>svg]:h-full">{p.art}</span>, on: !setup.off.includes(p.id) }))} />
            ) }] : []),
          ]} />
        )}
        {playing && ctx && (
          <div className="grid lg:grid-cols-[minmax(0,1fr)_16rem] gap-3 items-stretch">
            <section className="lab-board relative min-w-0 h-[calc(100dvh-11.25rem)] lg:h-[calc(100dvh-5.5rem)]" aria-label={def.name}>
              <Play key={runId} ctx={ctx} />
              {/* Small screens: held power-ups and the status float over the board's bottom corner. */}
              {(status || myHeld.length > 0) && (
                <div className="lg:hidden absolute left-2 bottom-2 z-10 flex items-center gap-2 pointer-events-none">
                  {status && <div className="score-card px-3 py-1.5 font-bold text-sm">{status}</div>}
                  {myHeld.map((p, i) => <span key={`${p.id}-${i}`} title={p.name} className="score-card w-11 h-11 p-1 inline-flex [&>svg]:w-full [&>svg]:h-full">{p.art}</span>)}
                </div>
              )}
            </section>
            <div className="order-first lg:order-none pr-44 lg:pr-0 min-w-0 grid content-start gap-3 lg:h-[calc(100dvh-5.5rem)] lg:pt-14 lg:grid-rows-[auto_auto_1fr]">
              {/* Solo games need no player icon (teacher, 2026-11-23): just the score and the rounds. */}
              {solo ? (
                <div className="grid gap-3 lg:contents">
                  <div className="score-card px-4 py-3 flex lg:grid items-center lg:justify-items-center gap-3" aria-label={t('share.points', { count: turns!.players[0].score })}>
                    <span className="text-xs font-bold uppercase tracking-wider text-muted">Score</span>
                    <motion.span key={turns!.players[0].score} className="font-display text-4xl lg:text-6xl tabular-nums leading-none" initial={still ? false : { scale: 1.3 }} animate={{ scale: 1 }}>{turns!.players[0].score}</motion.span>
                    <span className="lg:hidden ml-auto text-sm font-bold tabular-nums">{round}/{setup.rounds}</span>
                  </div>
                  <div className="hidden lg:block"><RoundMeter round={`${round}/${setup.rounds}`} label={def.rounds.label} /></div>
                </div>
              ) : <ScoreBoard turns={turns!} playing={phase === 'play'} round={`${round}/${setup.rounds}`} roundLabel={def.rounds.label} />}
              {status && <div className="hidden lg:block score-card p-3 text-center font-bold">{status}</div>}
              {myHeld.length > 0 && (
                <ul className="hidden lg:grid gap-2 list-none m-0 p-0 content-start" aria-label="Power-ups held">
                  {myHeld.map((p, i) => (
                    <motion.li key={`${p.id}-${i}`} initial={still ? false : { x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="score-card flex items-center gap-2 p-2" title={p.desc}>
                      <span className={`w-10 h-10 inline-flex [&>svg]:w-full [&>svg]:h-full ${still ? '' : 'pu-bob'}`}>{p.art}</span>
                      <span className="font-bold leading-tight">{p.name}</span>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
        {question && player && phase === 'play' && !solo && (
          <ShareQuestion question={question.q} player={player} cpuLevel={team.level} onResult={(ok) => { const r = question.resolve; setQuestion(null); r(ok); }} />
        )}
        <AnimatePresence>
          {card && <LabPowerCard key={card.id} p={card.p} text={card.text} still={still} onClose={() => { const r = card.resolve; setCard(null); r(); }} />}
        </AnimatePresence>
        <AnimatePresence>
          {message && phase === 'play' && (
            <motion.div key={message.id} className="fixed inset-0 z-[65] grid place-items-center pointer-events-none" role="status">
              <motion.p className={`font-display text-center px-6 leading-none ${message.tone === 'big' ? 'text-[clamp(3rem,9vw,7rem)]' : 'text-[clamp(2.2rem,6vw,4.5rem)]'}`}
                style={{ color: message.tone === 'oops' ? '#ffd2c2' : '#fff', WebkitTextStroke: '0.12em #000', paintOrder: 'stroke fill', textShadow: '0 0.08em 0 #000, 0 0 0.6em rgba(253,253,148,0.7)' }}
                initial={still ? { opacity: 0 } : { scale: 0.3, opacity: 0, rotate: message.tone === 'oops' ? 8 : -6 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ opacity: 0, scale: still ? 1 : 1.2, y: still ? 0 : -30 }}
                transition={{ type: 'spring', stiffness: 320, damping: 14 }}>
                <PopText text={message.text} />
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
        {phase === 'end' && turns && (
          <ResultsModal winners={turns.players.length > 1 ? top : undefined}
            title={endTitle ?? (turns.players.length > 1 ? (top.length > 1 ? t('share.tie') : t('share.winner', { name: top[0].name })) : t('pb.done', { count: turns.players[0].score }))}
            missed={solo ? soloMissed : missed} againLabel={t('share.again')} onAgain={() => setPhase('welcome')} />
        )}
        {soloElement}
      </main>
    </div>
  );
}

// A power-up card (teacher, 2026-11-13): tall, the picture on top, the name,
// a short line on what it does and an X that must be tapped.
const ENTER = {
  spin: { scale: 0.2, opacity: 0, rotate: -540 },
  drop: { scale: 0.8, opacity: 0, y: -300 },
  zoom: { scale: 2, opacity: 0 },
  wiggle: { scale: 0.5, opacity: 0, rotate: 25, x: -80 },
};
export function LabPowerCard({ p, text, still, onClose }: { p: LabPower; text: string; still: boolean; onClose: () => void }) {
  return (
    <motion.div className="fixed inset-0 z-[70] grid place-items-center bg-ink-night/40 p-4" role="dialog" aria-label={p.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="relative w-[min(20rem,86vw)] bg-surface border-heavy border-border rounded-panel px-6 pt-10 pb-7 grid justify-items-center gap-3 text-center cursor-pointer"
        style={{ boxShadow: p.silly ? '0 0 0 6px rgba(245,160,140,0.6), 0 8px 0 #000, 0 24px 40px rgba(0,0,0,0.25)' : '0 0 0 6px rgba(253,253,148,0.6), 0 8px 0 #000, 0 24px 40px rgba(0,0,0,0.25)' }}
        initial={still ? { opacity: 0 } : ENTER[p.enter ?? (p.silly ? 'wiggle' : 'spin')]} animate={{ scale: 1, opacity: 1, y: 0, x: 0, rotate: 0 }} exit={{ opacity: 0, scale: still ? 1 : 0.85 }}
        transition={POP_IN} whileHover={still ? undefined : { scale: 1.03 }}>
        <button type="button" onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label={t('class.close')}
          className="absolute top-3 right-3 w-11 h-11 rounded-full border-bold border-border bg-surface-2 flex items-center justify-center motion-safe:hover:scale-110 motion-safe:transition-transform"><X weight="bold" size={20} /></button>
        {!still && <span aria-hidden="true" className="absolute top-6 w-44 h-44 rounded-full pu-rays opacity-70" />}
        <span className={`relative w-32 h-32 inline-flex [&>svg]:w-full [&>svg]:h-full ${still ? '' : 'pu-bob'}`}>{p.art}</span>
        <span className="relative font-display text-3xl leading-tight"><PopText text={p.name} /></span>
        <span className="relative font-bold text-base leading-snug text-balance">{text}</span>
      </motion.div>
    </motion.div>
  );
}

// The standard Gamify welcome for a Lab game: the cover big on the left, the
// title, a short description, a white How to play box and one big start.
function LabWelcome({ def, still, onStart }: { def: LabDef; still: boolean; onStart: () => void }) {
  return (
    <motion.section initial={still ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="menu-panel w-full mx-auto px-2 sm:px-6 grid gap-x-10 gap-y-5 items-stretch lg:grid-cols-[minmax(0,1.25fr)_minmax(22rem,1fr)]">
      <div className="min-w-0 rounded-panel border-bold border-border overflow-hidden aspect-[100/62] max-h-[38vh] lg:max-h-[calc(100dvh-9rem)] w-full [&>svg]:w-full [&>svg]:h-full motion-safe:hover:scale-[1.01] motion-safe:transition-transform" aria-hidden="true">{def.cover}</div>
      <div className="min-w-0 flex flex-col gap-5 justify-between">
        <div className="grid gap-2">
          <h1 className="title-bubble text-fit-title leading-none pr-40 min-h-11 flex items-center" style={{ color: 'var(--text)' }}><Title text={def.name} /></h1>
          <p className="text-fit-body font-semibold text-muted leading-snug max-w-prose">{def.description}</p>
          <div className="flex flex-wrap gap-2">{(LAB_MODES[def.id] ?? []).filter((m) => m !== 'live').map((m) => <ModeBadge key={m} mode={m} />)}</div>
        </div>
        <div className="rounded-panel border-std border-border-soft bg-white px-6 py-4 grid gap-3" style={{ boxShadow: '0 3px 0 rgba(36,28,61,0.14), 0 12px 24px rgba(36,28,61,0.10)' }}>
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted">{t('welcome.how')}</h2>
          <ol className="grid gap-3 list-none p-0 m-0">
            {def.how.map((s, i) => (
              <motion.li key={i} initial={still ? false : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.08 }} className="flex items-center gap-3.5 text-fit-body leading-snug">
                <span className="w-11 h-11 shrink-0 rounded-full border-std border-border bg-accent flex items-center justify-center [&>svg]:w-[50%] [&>svg]:h-[50%]" aria-hidden="true">{s.icon}</span>
                <span className="font-bold">{s.text}</span>
              </motion.li>
            ))}
          </ol>
        </div>
        <button type="button" onClick={onStart} className="w-full min-h-16 rounded-panel border-heavy border-border bg-accent font-display text-3xl inline-flex items-center justify-center gap-3 motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.01] motion-safe:transition-transform" style={{ boxShadow: 'var(--shadow-sticker)' }}>
          <Play weight="fill" size={30} aria-hidden="true" />{t('welcome.start')}
        </button>
      </div>
    </motion.section>
  );
}
