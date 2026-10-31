import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Cards, HandTap, Trophy } from '@phosphor-icons/react';
import { data, newId } from '../../data';
import { LIBRARY } from '../../data/library';
import { useMySets } from '../../data/hooks';
import { playEffect } from '../../engine/feedback';
import ResultsModal from '../../engine/ResultsModal';
import { TeamBadge } from '../../engine/TeamBadge';
import TeamSetup from '../../engine/TeamSetup';
import type { CpuLevel, TurnPlayer } from '../../engine/turns';
import { t } from '../../i18n';
import { GameTopRow, SettingsPanel } from '../../settings/SettingsPanel';
import { useSettings } from '../../settings/SettingsContext';
import { useGamePool } from '../../student/session';
import { pieceFill, pieceImage } from '../../theme/library';
import { ThemedPage, useGameTheme } from '../../theme/useGameTheme';
import { ChoiceRow } from '../../ui/fields';
import GameWelcome from '../GameWelcome';
import SetPicker from '../SetPicker';
import SetupWizard from '../SetupWizard';
import ThemeScreen from '../ThemeScreen';
import { memoryMatchManifest } from './manifest';
import { useSavedSetup } from '../useSavedSetup';
import { buildDeck, type MemoryCard } from './deck';


type Phase = 'welcome' | 'theme' | 'setup' | 'play' | 'end';
const CPU_MEMORY: Record<CpuLevel, number> = { easy: 0.3, medium: 0.6, hard: 0.9 };

// Memory Match (launch roster, Stage 7): every question is a pair, the
// question card and its answer card. Solo, or two players taking turns (a
// match earns another turn), or against the computer.
export default function MemoryMatch() {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const { theme, themes, playable, choose } = useGameTheme('memory-match');
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const [setup, change] = useSavedSetup('memory-match', { setId: LIBRARY[0].id, pairs: 8, players: 'solo' as 'solo' | 'two' });
  const setId = sets.some((s) => s.id === setup.setId) ? setup.setId : LIBRARY[0].id;
  const picked = useMemo(() => sets.filter((s) => s.id === setId).map((set) => ({ set, starred: false })), [sets, setId]);
  const game = useGamePool(picked);
  const [team, setTeam] = useState<{ players: TurnPlayer[]; level: CpuLevel }>({ players: [], level: 'medium' });
  const [phase, setPhase] = useState<Phase>('welcome');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deck, setDeck] = useState<MemoryCard[]>([]);
  const [open, setOpen] = useState<number[]>([]);
  const [found, setFound] = useState<Record<string, number>>({});
  const [turn, setTurn] = useState(0);
  const [moves, setMoves] = useState(0);
  const [players, setPlayers] = useState<TurnPlayer[]>([]);
  const seen = useRef(new Map<number, string>());
  const misses = useRef(new Map<string, number>());
  const busy = useRef(false);

  const player = players[turn];
  const scores = players.map((_, i) => Object.values(found).filter((w) => w === i).length);

  function begin() {
    const all = game.pool.flatMap((p) => p.set.questions);
    setDeck(buildDeck(all, setup.pairs));
    setOpen([]); setFound({}); setTurn(0); setMoves(0);
    openRef.current = []; foundRef.current = {}; turnRef.current = 0;
    seen.current.clear(); misses.current.clear(); busy.current = false;
    setPlayers(setup.players === 'two' && team.players.length === 2 ? team.players : [{ id: 'solo', name: t('mm.you'), kind: 'student', colorIndex: 0, score: 0 }]);
    setPhase('play');
  }

  // Refs hold the live board so timed flips (and the computer) never read
  // a stale copy.
  const openRef = useRef<number[]>([]);
  const foundRef = useRef<Record<string, number>>({});
  const turnRef = useRef(0);

  function flip(i: number) {
    const cur = openRef.current;
    if (busy.current || cur.includes(i) || foundRef.current[deck[i].pair] !== undefined || cur.length >= 2) return;
    playEffect('tap', settings);
    const next = [...cur, i];
    openRef.current = next;
    seen.current.set(i, deck[i].pair);
    setOpen(next);
    if (next.length === 2) resolve(next[0], next[1]);
  }

  function resolve(ia: number, ib: number) {
    busy.current = true;
    setMoves((m) => m + 1);
    const a = deck[ia], b = deck[ib];
    const match = a.pair === b.pair;
    window.setTimeout(() => {
      openRef.current = [];
      setOpen([]);
      busy.current = false;
      if (match) {
        playEffect('right', settings);
        const q = game.pool.flatMap((p) => p.set.questions.map((x) => ({ x, setId: p.set.id }))).find((e) => e.x.id === a.pair);
        if (q) void data.logQuestion({ id: newId('log'), at: new Date().toISOString(), classroomId: game.classroomId, studentId: game.studentId, teamName: players.length > 1 ? players[turnRef.current]?.name : undefined, gameId: 'memory-match', mode: players.length > 1 ? 'versus' : 'solo', setId: q.setId, prompt: q.x.prompt, answer: q.x.choices[q.x.correctIndex], tries: [...Array.from({ length: misses.current.get(a.pair) ?? 0 }, () => '(miss)'), q.x.choices[q.x.correctIndex]], ms: 0, outcome: 'right' });
        foundRef.current = { ...foundRef.current, [a.pair]: turnRef.current };
        setFound(foundRef.current);
        if (Object.keys(foundRef.current).length * 2 === deck.length) finish();
      } else {
        playEffect('miss', settings);
        for (const c of [a, b]) misses.current.set(c.pair, (misses.current.get(c.pair) ?? 0) + 1);
        if (players.length > 1) { turnRef.current = (turnRef.current + 1) % players.length; setTurn(turnRef.current); }
      }
    }, match ? (still ? 300 : 650) : (still ? 900 : 1200));
  }

  function finish() {
    window.setTimeout(() => {
      setPhase('end');
      playEffect('win', settings);
      if (settings.celebrations !== 'off' && !still) void confetti({ particleCount: settings.celebrations === 'big' ? 140 : 50, spread: 80, origin: { y: 0.6 }, disableForReducedMotion: true });
    }, 500);
  }

  // The computer remembers some cards it has seen, by level.
  useEffect(() => {
    if (phase !== 'play' || player?.kind !== 'cpu' || busy.current || open.length > 0) return;
    const id = window.setTimeout(() => {
      const hidden = deck.map((_, i) => i).filter((i) => foundRef.current[deck[i].pair] === undefined);
      const memory = CPU_MEMORY[team.level];
      const known = [...seen.current].filter(([i]) => hidden.includes(i) && Math.random() < memory);
      const pairOf = known.find(([i, p]) => known.some(([j, q]) => j !== i && q === p));
      const first = pairOf ? pairOf[0] : hidden[Math.floor(Math.random() * hidden.length)];
      flip(first);
      window.setTimeout(() => {
        const mate = [...seen.current].find(([j, q]) => j !== first && q === deck[first].pair && hidden.includes(j) && Math.random() < memory);
        const rest = hidden.filter((i) => i !== first);
        flip(mate ? mate[0] : rest[Math.floor(Math.random() * rest.length)]);
      }, 800);
    }, 900);
    return () => window.clearTimeout(id);
  }, [phase, turn, open.length, found]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pick the column count that makes the biggest cards on this screen.
  const [view, setView] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => { const on = () => setView({ w: window.innerWidth, h: window.innerHeight }); window.addEventListener('resize', on); return () => window.removeEventListener('resize', on); }, []);
  const availW = Math.min(view.w - 32, 1024 - 48), availH = view.h - 290;
  const cols = [3, 4, 5, 6].reduce((best, c) => {
    const size = (cc: number) => { const r = Math.ceil(deck.length / cc); return Math.min(availW / cc, (availH / r) * 4 / 3); };
    return size(c) > size(best) ? c : best;
  }, 4);
  const rows = Math.ceil(deck.length / cols);
  // Cards stretch taller (down to nearly square) to fill a tall screen.
  const gap = view.w >= 640 ? 12 : 8;
  const cardW = (availW - (cols - 1) * gap) / cols, cellH = (availH - (rows - 1) * gap) / rows;
  const ratio = Math.min(4 / 3, Math.max(0.9, cardW / cellH));
  const winner = scores.length > 1 ? (scores[0] === scores[1] ? null : players[scores[0] > scores[1] ? 0 : 1]) : null;

  return (
    <ThemedPage theme={theme} menu={phase !== 'play' && phase !== 'end'}>
    <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-6">
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context="memory-match" />
      <GameTopRow onSettings={() => setSettingsOpen(true)} />

      {phase === 'welcome' && (
        <GameWelcome game={memoryMatchManifest} cover={pieceImage(theme, 'cover')} onStart={() => setPhase(themes.length > 1 ? 'theme' : 'setup')} steps={[
          { icon: <HandTap weight="fill" size={22} />, text: t('mm.how1') },
          { icon: <Cards weight="fill" size={22} />, text: t('mm.how2') },
          { icon: <Trophy weight="fill" size={22} />, text: t('mm.how3') },
        ]} />
      )}
      {phase === 'theme' && <ThemeScreen gameName={memoryMatchManifest.name} current={theme} themes={themes} playable={playable} onChoose={choose} onBack={() => setPhase('welcome')} onNext={() => setPhase('setup')} />}
      {phase === 'setup' && (
        <SetupWizard onBack={() => setPhase(themes.length > 1 ? 'theme' : 'welcome')} onPlay={begin} pages={[
          ...(game.assigned ? [] : [{ id: 'questions', title: t('setup.questions'), content: <SetPicker sets={sets} value={[setId]} onChange={(ids) => change({ setId: ids[0] })} /> }]),
          { id: 'options', title: t('setup.options'), content: (
            <>
              <ChoiceRow label={t('mm.pairs')} value={String(setup.pairs)} onChange={(v) => change({ pairs: Number(v) })} options={['6', '8', '10'].map((n) => ({ value: n, label: t('mm.pairsN', { n }) }))} />
              <ChoiceRow label={t('mm.who')} value={setup.players} onChange={(v) => change({ players: v })} options={[{ value: 'solo', label: t('mm.solo') }, { value: 'two', label: t('mm.two') }]} />
            </>
          ) },
          ...(setup.players === 'two' ? [{ id: 'players', title: t('setup.players'), ready: team.players.length === 2, content: <TeamSetup mode="versus" min={2} max={2} embedded onChange={(ps, level) => setTeam({ players: ps, level })} /> }] : []),
        ]} />
      )}

      {(phase === 'play' || phase === 'end') && (
        <section className="grid gap-3">
          <div className="flex flex-wrap items-center gap-2" aria-live="polite">
            {players.length > 1 ? players.map((p, i) => (
              <span key={p.id} className={`inline-flex items-center gap-2 rounded-pill border-[2.5px] px-3 min-h-11 font-bold bg-surface ${i === turn && phase === 'play' ? 'border-border ring-4 ring-accent' : 'border-border-soft'}`}>
                <TeamBadge colorIndex={p.colorIndex} size={28} />{p.name}<span className="font-display text-xl tabular-nums">{scores[i]}</span>
              </span>
            )) : <span className="inline-flex items-center gap-2 rounded-pill border-[2.5px] border-border px-4 min-h-11 font-display text-xl bg-surface">{t('mm.found', { found: Object.keys(found).length, total: deck.length / 2 })}</span>}
            <span className="inline-flex items-center rounded-pill border-[2.5px] border-border px-4 min-h-11 font-bold bg-surface">{t('mm.moves', { count: moves })}</span>
            {player?.kind === 'cpu' && phase === 'play' && <span className="font-bold stage-text">{t('mm.cpuTurn')}</span>}
          </div>
          <div className="grid gap-2 sm:gap-3 mx-auto w-full" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, maxWidth: `min(100%, calc((100dvh - 18.125rem + var(--chrome-save, 0rem)) / ${rows} * ${cols} * ${ratio.toFixed(3)}))` }}>
            {deck.map((c, i) => {
              const up = open.includes(i) || found[c.pair] !== undefined;
              const owner = found[c.pair];
              return (
                <motion.button type="button" onClick={() => player?.kind !== 'cpu' && flip(i)} disabled={phase !== 'play' || player?.kind === 'cpu'}
                  aria-label={up ? `${c.side === 'q' ? t('mm.question') : t('mm.answer')}: ${c.text}` : t('mm.card', { n: i + 1 })}
                  key={`${c.key}-${up ? 'up' : 'down'}`} initial={still ? false : { scaleX: 0.05 }} animate={{ scaleX: 1 }} transition={{ duration: 0.25 }}
                  className={`rounded-input border-[2.5px] border-border p-1.5 flex items-center justify-center text-center overflow-hidden ${owner !== undefined ? 'ring-4 ring-[#9fe7a0]' : ''}`}
                  style={{ aspectRatio: String(ratio), boxShadow: 'var(--shadow-sticker)', ...(up ? { background: c.side === 'q' ? '#fbfcf8' : '#fdfd94' } : pieceFill(theme, 'card-back', '#b4c4fb')) }}>
                  {up ? (
                    <span className="grid gap-1 justify-items-center">
                      {c.image && <img src={c.image} alt={c.alt ?? ''} className="max-h-12 object-contain" />}
                      <span className={`font-bold leading-tight line-clamp-4 ${c.side === 'a' ? 'text-lg sm:text-2xl' : 'text-xs sm:text-base lg:text-lg'}`}>{c.text}</span>
                    </span>
                  ) : !pieceImage(theme, 'card-back') && <Cards weight="fill" size={30} aria-hidden="true" />}
                </motion.button>
              );
            })}
          </div>
        </section>
      )}

      {phase === 'end' && (
        <ResultsModal title={players.length > 1 ? (winner ? t('mm.wins', { name: winner.name }) : t('mm.tie')) : t('mm.done', { count: moves })} missed={[]} againLabel={t('share.again')} onAgain={() => setPhase('welcome')}>
          <p className="font-bold">{t('mm.summary', { pairs: deck.length / 2, moves })}</p>
        </ResultsModal>
      )}
    </main>
    </ThemedPage>
  );
}
