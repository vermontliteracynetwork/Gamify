import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { HandTap, LinkSimple, Timer } from '@phosphor-icons/react';
import { data, newId } from '../../data';
import { LIBRARY } from '../../data/library';
import { useMySets } from '../../data/hooks';
import type { MultipleChoiceQuestion } from '../../data/types';
import { playEffect } from '../../engine/feedback';
import ResultsModal from '../../engine/ResultsModal';
import { t } from '../../i18n';
import { GameTopRow, SettingsPanel } from '../../settings/SettingsPanel';
import { useSettings } from '../../settings/SettingsContext';
import { useGamePool } from '../../student/session';
import { pieceFill, pieceImage } from '../../theme/library';
import { ThemedPage, useGameTheme } from '../../theme/useGameTheme';
import { ChoiceRow } from '../../ui/fields';
import GameWelcome from '../GameWelcome';
import { buildDeck } from '../memory-match/deck';
import SetPicker from '../SetPicker';
import SetupWizard from '../SetupWizard';
import ThemeScreen from '../ThemeScreen';
import { matchUpManifest } from './manifest';
import { useSavedSetup } from '../useSavedSetup';


type Phase = 'welcome' | 'theme' | 'setup' | 'play' | 'end';
interface Tile { pair: string; text: string }

// Match Up (launch roster): every question on the left, every answer on
// the right, shuffled. Tap one of each to link them; right pairs lock in,
// wrong ones wobble. Rounds go until the chosen number is done.
export default function MatchUp() {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const { theme, themes, playable, choose } = useGameTheme('match-up');
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const [setup, change] = useSavedSetup('match-up', { setId: LIBRARY[0].id, pairs: 5, rounds: 2 });
  const setId = sets.some((s) => s.id === setup.setId) ? setup.setId : LIBRARY[0].id;
  const picked = useMemo(() => sets.filter((s) => s.id === setId).map((set) => ({ set, starred: false })), [sets, setId]);
  const game = useGamePool(picked);
  const [phase, setPhase] = useState<Phase>('welcome');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [left, setLeft] = useState<Tile[]>([]);
  const [right, setRight] = useState<Tile[]>([]);
  const [pick, setPick] = useState<{ side: 'l' | 'r'; pair: string } | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [wobble, setWobble] = useState<string | null>(null);
  const [round, setRound] = useState(1);
  const [start, setStart] = useState(0);
  const [now, setNow] = useState(0);
  const [misses, setMisses] = useState(0);
  const [missed, setMissed] = useState<MultipleChoiceQuestion[]>([]);
  const used = useRef(new Set<string>());
  const wrongs = useRef(new Map<string, string[]>());

  const questions = useMemo(() => game.pool.flatMap((p) => p.set.questions.map((q) => ({ q, setId: p.set.id }))), [game.pool]);
  useEffect(() => { if (phase !== 'play') return; const id = window.setInterval(() => setNow(Date.now()), 250); return () => window.clearInterval(id); }, [phase]);
  const seconds = Math.floor(((phase === 'play' ? now : now) - start) / 1000);

  function deal() {
    const fresh = questions.filter((e) => !used.current.has(e.q.id)).map((e) => e.q);
    const deck = buildDeck(fresh.length >= setup.pairs ? fresh : questions.map((e) => e.q), setup.pairs);
    deck.forEach((c) => used.current.add(c.pair));
    const ls = deck.filter((c) => c.side === 'q').map((c) => ({ pair: c.pair, text: c.text }));
    const rs = deck.filter((c) => c.side === 'a').map((c) => ({ pair: c.pair, text: c.text }));
    setLeft(ls); setRight(rs.sort(() => Math.random() - 0.5)); setDone([]); setPick(null);
  }
  function begin() {
    used.current.clear(); wrongs.current.clear();
    setRound(1); setMisses(0); setMissed([]); setStart(Date.now()); setNow(Date.now());
    deal();
    setPhase('play');
  }
  function tap(side: 'l' | 'r', tile: Tile) {
    if (done.includes(tile.pair)) return;
    playEffect('tap', settings);
    if (!pick || pick.side === side) { setPick({ side, pair: tile.pair }); return; }
    const match = pick.pair === tile.pair;
    const entry = questions.find((e) => e.q.id === (side === 'r' ? pick.pair : tile.pair));
    if (match) {
      playEffect('right', settings);
      const next = [...done, tile.pair];
      setDone(next); setPick(null);
      if (entry) void data.logQuestion({ id: newId('log'), at: new Date().toISOString(), classroomId: game.classroomId, studentId: game.studentId, gameId: 'match-up', mode: 'solo', setId: entry.setId, prompt: entry.q.prompt, answer: entry.q.choices[entry.q.correctIndex], tries: [...(wrongs.current.get(entry.q.id) ?? []), entry.q.choices[entry.q.correctIndex]], ms: 0, outcome: 'right' });
      if (next.length === left.length) {
        window.setTimeout(() => {
          if (round >= setup.rounds) finish();
          else { setRound((r) => r + 1); deal(); }
        }, still ? 200 : 700);
      }
    } else {
      playEffect('miss', settings);
      setMisses((m) => m + 1);
      const qId = side === 'r' ? pick.pair : tile.pair;
      const wrongText = (side === 'r' ? tile : right.find((x) => x.pair === pick.pair))?.text ?? '';
      wrongs.current.set(qId, [...(wrongs.current.get(qId) ?? []), wrongText]);
      const q = questions.find((e) => e.q.id === qId)?.q;
      if (q) setMissed((ms) => (ms.some((x) => x.id === q.id) ? ms : [...ms, q]));
      setWobble(tile.pair + side);
      window.setTimeout(() => setWobble(null), 450);
      setPick(null);
    }
  }
  function finish() {
    setNow(Date.now());
    setPhase('end');
    playEffect('win', settings);
    if (settings.celebrations !== 'off' && !still) void confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 }, disableForReducedMotion: true });
  }

  const tileClass = (on: boolean, isDone: boolean) => `w-full min-h-14 rounded-input border-[2.5px] px-3 py-2 text-left font-bold leading-tight flex items-center ${isDone ? 'border-[#1f7a45] opacity-70' : on ? 'border-border ring-4 ring-accent' : 'border-border'}`;
  const rows = Math.max(left.length, 1);

  return (
    <ThemedPage theme={theme}>
    <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-6">
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context="match-up" />
      <GameTopRow onSettings={() => setSettingsOpen(true)} />
      {phase === 'welcome' && (
        <GameWelcome game={matchUpManifest} cover={pieceImage(theme, 'cover')} onStart={() => setPhase('theme')} steps={[
          { icon: <HandTap weight="fill" size={22} />, text: t('mu.how1') },
          { icon: <LinkSimple weight="bold" size={22} />, text: t('mu.how2') },
          { icon: <Timer weight="bold" size={22} />, text: t('mu.how3') },
        ]} />
      )}
      {phase === 'theme' && <ThemeScreen gameName={matchUpManifest.name} current={theme} themes={themes} playable={playable} onChoose={choose} onBack={() => setPhase('welcome')} onNext={() => setPhase('setup')} />}
      {phase === 'setup' && (
        <SetupWizard onBack={() => setPhase('theme')} onPlay={begin} pages={[
          ...(game.assigned ? [] : [{ id: 'questions', title: t('setup.questions'), content: <SetPicker sets={sets} value={[setId]} onChange={(ids) => change({ setId: ids[0] })} /> }]),
          { id: 'options', title: t('setup.options'), content: (
            <>
              <ChoiceRow label={t('mu.pairs')} value={String(setup.pairs)} onChange={(v) => change({ pairs: Number(v) })} options={['4', '5', '6'].map((n) => ({ value: n, label: n }))} />
              <ChoiceRow label={t('mu.rounds')} value={String(setup.rounds)} onChange={(v) => change({ rounds: Number(v) })} options={['1', '2', '3'].map((n) => ({ value: n, label: n }))} />
            </>
          ) },
        ]} />
      )}
      {phase === 'play' && (
        <section className="grid gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-surface border-[2.5px] border-border rounded-pill px-4 min-h-11 font-display text-xl tabular-nums"><Timer weight="bold" size={22} />{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</span>
            <span className="inline-flex items-center bg-surface border-[2.5px] border-border rounded-pill px-4 min-h-11 font-bold">{t('mu.round', { n: round, total: setup.rounds })}</span>
            <span className="inline-flex items-center bg-surface border-[2.5px] border-border rounded-pill px-4 min-h-11 font-bold" aria-live="polite">{t('mu.matched', { done: done.length, total: left.length })}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-6" style={{ gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`, gridAutoFlow: 'column', height: `min(calc(100dvh - 270px), ${rows * 165}px)` }}>
            {left.map((tile) => (
              <motion.button key={`l${tile.pair}`} type="button" onClick={() => tap('l', tile)} aria-pressed={pick?.side === 'l' && pick.pair === tile.pair} disabled={done.includes(tile.pair)}
                animate={wobble === tile.pair + 'l' && !still ? { x: [0, -8, 8, -5, 5, 0] } : done.includes(tile.pair) && !still ? { scale: [1, 1.05, 1] } : {}}
                className={tileClass(pick?.side === 'l' && pick.pair === tile.pair, done.includes(tile.pair))} style={{ boxShadow: 'var(--shadow-sticker)', ...pieceFill(theme, 'question-tile', '#fbfcf8'), ...(done.includes(tile.pair) ? { background: '#ddfcc6' } : {}) }}>
                <span className="text-sm sm:text-lg line-clamp-3">{tile.text}</span>
              </motion.button>
            ))}
            {right.map((tile) => (
              <motion.button key={`r${tile.pair}`} type="button" onClick={() => tap('r', tile)} aria-pressed={pick?.side === 'r' && pick.pair === tile.pair} disabled={done.includes(tile.pair)}
                animate={wobble === tile.pair + 'r' && !still ? { x: [0, -8, 8, -5, 5, 0] } : done.includes(tile.pair) && !still ? { scale: [1, 1.05, 1] } : {}}
                className={`${tileClass(pick?.side === 'r' && pick.pair === tile.pair, done.includes(tile.pair))} justify-center text-center font-display text-lg sm:text-2xl`} style={{ boxShadow: 'var(--shadow-sticker)', ...pieceFill(theme, 'answer-tile', '#fdfd94'), ...(done.includes(tile.pair) ? { background: '#ddfcc6' } : {}) }}>
                {tile.text}
              </motion.button>
            ))}
          </div>
        </section>
      )}
      {phase === 'end' && (
        <ResultsModal title={t('mu.done', { time: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` })} missed={missed} againLabel={t('share.again')} onAgain={() => setPhase('setup')}>
          <p className="font-bold">{misses ? t('mu.misses', { count: misses }) : t('mu.perfect')}</p>
        </ResultsModal>
      )}
    </main>
    </ThemedPage>
  );
}
