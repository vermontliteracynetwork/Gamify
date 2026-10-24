import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowCounterClockwise, Crown, Sparkle, SquaresFour, Trophy } from '@phosphor-icons/react';
import { data, newId } from '../../data';
import { useMySets } from '../../data/hooks';
import { LIBRARY } from '../../data/library';
import type { MultipleChoiceQuestion, QuestionSet } from '../../data/types';
import { playEffect } from '../../engine/feedback';
import LookBack from '../../engine/LookBack';
import { drawQuestion } from '../../engine/picker';
import { isPlayable } from '../../engine/questions';
import ShareQuestion from '../../engine/ShareQuestion';
import { TeamBadge } from '../../engine/TeamBadge';
import TeamSetup from '../../engine/TeamSetup';
import { addPoints, current, leaders, nextTurn, setScores, startTurns, undo, type CpuLevel, type TurnPlayer, type TurnState } from '../../engine/turns';
import { t } from '../../i18n';
import { GameTopRow, SettingsPanel } from '../../settings/SettingsPanel';
import { useSettings } from '../../settings/SettingsContext';
import type { GameManifest } from '../types';
import { pieceColor } from '../../theme/library';
import { ThemedPage, ThemePicker, useGameTheme } from '../../theme/useGameTheme';

import { dealCards, GRID_POINTS, type CardKind } from './cards';

export const gameShowManifest: GameManifest = {
  id: 'game-show',
  name: 'Game Show',
  description: 'Teams take turns on the big screen. Answer right to pick a surprise card or a square.',
  modes: ['share'],
  questionKinds: ['mc'],
  themePieces: [
    { id: 'background', label: 'Background', width: 1920, height: 1080, hint: 'Behind the whole board' },
    { id: 'card-back', label: 'Card back', width: 300, height: 220, hint: 'The front of each surprise card before it flips' },
    { id: 'square', label: 'Grid square', width: 300, height: 180, hint: 'One square of the category grid' },
    { id: 'trophy', label: 'Winner trophy', width: 400, height: 400, hint: 'Shown on the winner screen' },
    { id: 'cover', label: 'Cover', width: 600, height: 600, hint: 'The picture on the game card' },
  ],
  hasCpu: true,
  borrowedFrom: 'Dashboard team games (Plinko turns) and Baamboozle-style rules, rebuilt',
};

type Board = 'cards' | 'grid';
type Phase = 'board' | 'teams' | 'play' | 'end';
interface Card { kind: CardKind; open: boolean; by?: number }
interface Cell { col: number; points: number; used: boolean }

export default function GameShow() {
  const { settings } = useSettings();
  const { theme, themes, playable, choose } = useGameTheme('game-show');
  const { value: mine = [] } = useMySets();
  const allSets = useMemo<QuestionSet[]>(() => [...mine, ...LIBRARY].filter((s) => s.questions.some(isPlayable)), [mine]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('board');
  const [board, setBoard] = useState<Board>('cards');
  const [setIds, setSetIds] = useState<string[]>([LIBRARY[0].id]);
  const [cardCount, setCardCount] = useState(12);
  const [turns, setTurns] = useState<TurnState | null>(null);
  const [cpuLevel, setCpuLevel] = useState<CpuLevel>('medium');
  const [cards, setCards] = useState<Card[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [question, setQuestion] = useState<{ q: MultipleChoiceQuestion; setId?: string; cell?: number } | null>(null);
  const [step, setStep] = useState<'answer' | 'pick'>('answer');
  const [reveal, setReveal] = useState<{ card: CardKind; choosing: boolean } | null>(null);
  const [missed, setMissed] = useState<MultipleChoiceQuestion[]>([]);
  const used = useRef(new Set<string>());

  const chosenSets = allSets.filter((s) => setIds.includes(s.id));
  const player = turns ? current(turns) : null;

  function draw(sets: QuestionSet[]): { q: MultipleChoiceQuestion; setId?: string } {
    // Prefer questions not asked yet this game.
    const fresh = sets.map((set) => ({ set: { ...set, questions: set.questions.filter((q) => !used.current.has(q.id)) }, starred: false }));
    const pool = fresh.some((p) => p.set.questions.some(isPlayable)) ? fresh : sets.map((set) => ({ set, starred: false }));
    const d = drawQuestion(pool);
    used.current.add(d.question.id);
    return { q: d.question, setId: d.setId };
  }

  function begin(players: TurnPlayer[], level: CpuLevel) {
    setCpuLevel(level);
    const state = startTurns(players);
    setTurns(state);
    used.current.clear();
    setMissed([]);
    if (board === 'cards') {
      setCards(dealCards(cardCount).map((kind) => ({ kind, open: false })));
      startTurn(state, 'cards');
    } else {
      setCells(chosenSets.slice(0, 5).flatMap((_, col) => GRID_POINTS.map((points) => ({ col, points, used: false }))));
      startTurn(state, 'grid');
    }
    setPhase('play');
  }

  function startTurn(_state: TurnState, b: Board = board) {
    if (b === 'cards') {
      setStep('answer');
      setQuestion(draw(chosenSets));
    } else {
      setStep('pick');
      setQuestion(null);
    }
  }

  function log(q: MultipleChoiceQuestion, setId: string | undefined, team: string, right: boolean) {
    void data.logQuestion({
      id: newId('log'), at: new Date().toISOString(), teamName: team, gameId: 'game-show', mode: 'share', setId,
      prompt: q.prompt, answer: q.choices[q.correctIndex], tries: [], ms: 0, outcome: right ? 'right' : 'skipped',
    });
  }

  function finishTurn(state: TurnState, cardsLeft: number) {
    if (cardsLeft === 0) { end(state); return; }
    const next = nextTurn(state);
    setTurns(next);
    startTurn(next);
  }

  function end(state: TurnState) {
    setTurns(state);
    setQuestion(null);
    setPhase('end');
    playEffect('win', settings);
    if (settings.celebrations !== 'off' && settings.motion !== 'still') void confetti({ particleCount: settings.celebrations === 'big' ? 160 : 60, spread: 90, origin: { y: 0.5 }, disableForReducedMotion: true });
  }

  function onResult(right: boolean) {
    if (!turns || !question || !player) return;
    if (player.kind !== 'cpu' && player.kind !== 'teacher') log(question.q, question.setId, player.name, right);
    if (!right && player.kind !== 'cpu' && player.kind !== 'teacher') setMissed((m) => (m.some((x) => x.id === question.q.id) ? m : [...m, question.q]));

    if (board === 'grid' && question.cell !== undefined) {
      const cell = cells[question.cell];
      const nextCells = cells.map((c, i) => (i === question.cell ? { ...c, used: true } : c));
      setCells(nextCells);
      setQuestion(null);
      const scored = right ? addPoints(turns, player.id, cell.points) : turns;
      finishTurn(scored, nextCells.filter((c) => !c.used).length);
      return;
    }
    setQuestion(null);
    if (right) {
      setStep('pick');
    } else {
      finishTurn(turns, cards.filter((c) => !c.open).length);
    }
  }

  function openCard(i: number) {
    if (!turns || step !== 'pick' || cards[i].open || reveal) return;
    playEffect('whoosh', settings);
    setCards((cs) => cs.map((c, j) => (j === i ? { ...c, open: true, by: current(turns).colorIndex } : c)));
    const kind = cards[i].kind;
    const others = turns.players.filter((p) => p.id !== current(turns).id && p.score > 0);
    const needsTarget = (kind.kind === 'swap' || kind.kind === 'steal') && others.length > 0;
    setReveal({ card: kind, choosing: needsTarget });
    if (kind.kind === 'points') applyCard(kind);
  }

  function applyCard(kind: CardKind, targetId?: string) {
    setTurns((state) => {
      if (!state) return state;
      const me = current(state);
      let next = state;
      if (kind.kind === 'points') next = addPoints(state, me.id, kind.points);
      else if (kind.kind === 'double') next = addPoints(state, me.id, me.score);
      else if (kind.kind === 'swap' && targetId) {
        const other = state.players.find((p) => p.id === targetId)!;
        next = setScores(state, { [me.id]: other.score, [other.id]: me.score });
      } else if (kind.kind === 'steal' && targetId) {
        const other = state.players.find((p) => p.id === targetId)!;
        const take = Math.min(kind.points, other.score);
        next = setScores(state, { [me.id]: me.score + take, [other.id]: other.score - take });
      }
      return next;
    });
    setReveal((r) => (r ? { ...r, choosing: false } : r));
  }

  function closeReveal() {
    setReveal(null);
    if (turns) finishTurn(turns, cards.filter((c) => !c.open).length);
  }

  function pickCell(i: number) {
    if (!turns || cells[i]?.used || question) return;
    const set = chosenSets[cells[i].col];
    playEffect('tap', settings);
    const d = draw([set]);
    setQuestion({ ...d, cell: i });
  }

  // The computer's game moves: pick a card or square, pick a team for swap
  // or steal (the leader), and close its own reveal.
  const cpuTurn = phase === 'play' && player?.kind === 'cpu';
  useEffect(() => {
    if (!cpuTurn || step !== 'pick' || question) return;
    if (reveal) {
      const timer = window.setTimeout(() => {
        if (reveal.choosing && turns) {
          const target = turns.players.filter((p) => p.id !== current(turns).id && p.score > 0).sort((a, b) => b.score - a.score)[0];
          applyCard(reveal.card, target?.id);
        } else closeReveal();
      }, 1600);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => {
      if (board === 'cards') {
        const closed = cards.map((c, i) => (c.open ? -1 : i)).filter((i) => i >= 0);
        if (closed.length) openCard(closed[Math.floor(Math.random() * closed.length)]);
      } else {
        const open = cells.map((c, i) => (c.used ? -1 : i)).filter((i) => i >= 0);
        if (open.length) pickCell(open[Math.floor(Math.random() * open.length)]);
      }
    }, 1200);
    return () => window.clearTimeout(timer);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const revealText = (k: CardKind) =>
    k.kind === 'points' ? t('tb.reveal.points', { points: k.points }) : k.kind === 'double' ? t('tb.reveal.double') : k.kind === 'swap' ? t('tb.reveal.swap') : t('tb.reveal.steal');

  return (
    <ThemedPage theme={theme}>
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24">
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context="game-show" />
      <GameTopRow onSettings={() => setSettingsOpen(true)}>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="title-bubble text-3xl sm:text-4xl">{t('tb.title')}</h1>
          {phase === 'play' && turns && turns.history.length > 0 && (
            <button type="button" onClick={() => setTurns(undo(turns))} className="min-h-11 px-4 rounded-pill border-[2px] border-border bg-surface font-bold inline-flex items-center gap-1.5">
              <ArrowCounterClockwise weight="bold" size={18} />{t('share.undo')}
            </button>
          )}
        </div>
      </GameTopRow>

      {phase === 'board' && (
        <section className="bg-surface border-[2.5px] border-border rounded-panel p-5 sm:p-6 grid gap-5 max-w-3xl mx-auto" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
          <p className="font-bold text-lg">{t('tb.description')}</p>
          <div className="grid gap-2">
            <span className="font-bold">{t('tb.board')}</span>
            <div role="radiogroup" aria-label={t('tb.board')} className="grid sm:grid-cols-2 gap-3">
              {([['cards', Sparkle, 'tb.cards', 'tb.cardsHint'], ['grid', SquaresFour, 'tb.grid', 'tb.gridHint']] as const).map(([id, Icon, title, hint]) => (
                <button key={id} type="button" role="radio" aria-checked={board === id}
                  onClick={() => { setBoard(id); if (id === 'cards') setSetIds((s) => s.slice(0, 1)); }}
                  className={`rounded-input border-[2.5px] p-4 text-left grid gap-1 ${board === id ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}>
                  <Icon weight="fill" size={36} aria-hidden="true" />
                  <span className="font-display text-xl font-bold">{t(title)}</span>
                  <span className="font-bold text-sm">{t(hint)}</span>
                </button>
              ))}
            </div>
          </div>

          {board === 'cards' && (
            <div className="grid gap-2">
              <span className="font-bold">{t('tb.cardCount')}</span>
              <div role="radiogroup" aria-label={t('tb.cardCount')} className="flex gap-2">
                {[12, 16, 20].map((n) => (
                  <button key={n} type="button" role="radio" aria-checked={cardCount === n} onClick={() => setCardCount(n)}
                    className={`min-h-12 w-16 rounded-pill border-[2px] font-display text-xl font-bold ${cardCount === n ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}>{n}</button>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <span className="font-bold">{board === 'grid' ? t('tb.setsGrid') : t('tb.setOne')}</span>
            <div className="grid sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto p-1">
              {allSets.map((s) => {
                const on = setIds.includes(s.id);
                return (
                  <button key={s.id} type="button" role={board === 'grid' ? 'checkbox' : 'radio'} aria-checked={on}
                    onClick={() => setSetIds((cur) => board === 'cards' ? [s.id] : on ? cur.filter((x) => x !== s.id) : cur.length < 5 ? [...cur, s.id] : cur)}
                    className={`min-h-12 px-3 rounded-input border-[2px] text-left font-bold ${on ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}>
                    {s.name || t('sets.untitled')}
                  </button>
                );
              })}
            </div>
          </div>

          <ThemePicker current={theme} themes={themes} playable={playable} onChoose={choose} />
          <button type="button" disabled={setIds.length === 0} onClick={() => setPhase('teams')}
            className="justify-self-start min-h-14 px-8 rounded-pill border-[2.5px] border-border bg-accent font-display text-xl font-bold disabled:opacity-50">
            {t('tb.next')}
          </button>
        </section>
      )}

      {phase === 'teams' && <TeamSetup mode="share" min={1} max={10} onStart={begin} />}

      {(phase === 'play' || phase === 'end') && turns && (
        <div className="grid lg:grid-cols-[1fr_280px] gap-5 items-start">
          <section className="grid gap-4 min-w-0">
            {phase === 'play' && player && (
              <div className="flex items-center gap-3 bg-surface border-[2.5px] border-border rounded-panel px-4 py-3" style={{ boxShadow: 'var(--shadow-sticker)' }} aria-live="polite">
                <TeamBadge colorIndex={player.colorIndex} size={44} />
                <span className="font-display text-2xl sm:text-3xl font-bold">
                  {step === 'pick' ? (board === 'cards' ? t('tb.pickCard', { name: player.name }) : t('tb.pickCell', { name: player.name })) : t('share.whoseTurn', { name: player.name })}
                </span>
              </div>
            )}

            {phase === 'play' && board === 'cards' && (
              <div className={`grid gap-3 ${cards.length > 12 ? 'grid-cols-4 sm:grid-cols-5' : 'grid-cols-3 sm:grid-cols-4'}`}>
                {cards.map((c, i) => (
                  <motion.button
                    key={i}
                    type="button"
                    onClick={() => openCard(i)}
                    disabled={c.open || step !== 'pick' || !!reveal || player?.kind === 'cpu'}
                    aria-label={c.open ? `${t('tb.card', { n: i + 1 })}: ${revealText(c.kind)}` : t('tb.card', { n: i + 1 })}
                    animate={c.open && settings.motion !== 'still' ? { rotateY: [90, 0] } : undefined}
                    transition={{ duration: 0.35 }}
                    className={`aspect-[4/3] rounded-input border-[2.5px] border-border font-display font-bold flex items-center justify-center text-center p-2
                      ${c.open ? 'bg-surface text-base sm:text-lg' : 'text-3xl sm:text-4xl'} ${step === 'pick' && !c.open ? 'motion-safe:hover:-translate-y-1' : ''}`}
                    style={{ boxShadow: 'var(--shadow-sticker)', ...(c.open ? {} : { background: pieceColor(theme, 'card-back', '#fbdb6b') }) }}
                  >
                    {c.open ? (
                      <span className="grid justify-items-center gap-1">
                        {c.by !== undefined && <TeamBadge colorIndex={c.by} size={26} />}
                        {revealText(c.kind)}
                      </span>
                    ) : i + 1}
                  </motion.button>
                ))}
              </div>
            )}

            {phase === 'play' && board === 'grid' && (
              <div className="overflow-x-auto">
                <div className="grid gap-2 min-w-[560px]" style={{ gridTemplateColumns: `repeat(${Math.min(5, chosenSets.length)}, minmax(0, 1fr))` }}>
                  {chosenSets.slice(0, 5).map((s) => (
                    <div key={s.id} className="min-h-16 rounded-input border-[2.5px] border-border bg-surface-2 font-display font-bold text-center flex items-center justify-center p-2 text-sm sm:text-base">{s.name}</div>
                  ))}
                  {GRID_POINTS.map((points) => chosenSets.slice(0, 5).map((s, col) => {
                    const i = cells.findIndex((c) => c.col === col && c.points === points);
                    const cell = cells[i];
                    return (
                      <button key={`${col}-${points}`} type="button" onClick={() => pickCell(i)}
                        disabled={!cell || cell.used || step !== 'pick' || !!question || player?.kind === 'cpu'}
                        aria-label={cell?.used ? t('tb.cellUsed', { set: s.name, points }) : t('tb.cell', { set: s.name, points })}
                        className={`min-h-16 rounded-input border-[2.5px] border-border font-display text-2xl sm:text-3xl font-bold ${cell?.used ? 'bg-surface-2 text-faint' : ''}`}
                        style={cell?.used ? undefined : { boxShadow: 'var(--shadow-sticker)', background: pieceColor(theme, 'square', '#fbdb6b') }}>
                        {cell?.used ? '' : points}
                      </button>
                    );
                  }))}
                </div>
              </div>
            )}

            {phase === 'end' && (
              <section className="bg-surface border-[2.5px] border-border rounded-panel p-6 grid gap-3 justify-items-center text-center" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
                <Trophy weight="fill" size={72} className="text-accent" aria-hidden="true" />
                <h2 className="font-display text-4xl font-bold">
                  {leaders(turns).length > 1 ? t('share.tie') : t('share.winner', { name: leaders(turns)[0].name })}
                </h2>
                <button type="button" onClick={() => setPhase('board')} className="min-h-14 px-8 rounded-pill border-[2.5px] border-border bg-accent font-display text-xl font-bold">{t('share.again')}</button>
              </section>
            )}
            {phase === 'end' && missed.length > 0 && <LookBack missed={missed} onDone={() => setMissed([])} />}
          </section>

          <aside className="bg-surface border-[2.5px] border-border rounded-panel p-4 grid gap-2" style={{ boxShadow: 'var(--shadow-sticker)' }} aria-label={t('share.scores')}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">{t('share.scores')}</h2>
            <ol className="grid grid-cols-2 lg:grid-cols-1 gap-2 list-none p-0 m-0">
              {turns.players.map((p) => {
                const lead = phase === 'end' && leaders(turns).some((l) => l.id === p.id);
                return (
                  <li key={p.id} className={`flex items-center gap-2 rounded-input border-[2px] p-2 ${player?.id === p.id && phase === 'play' ? 'border-border bg-surface-2' : 'border-border-soft'}`}>
                    <TeamBadge colorIndex={p.colorIndex} />
                    <span className="flex-1 min-w-0 font-bold truncate">{p.name}</span>
                    {lead && <Crown weight="fill" size={20} className="text-accent" aria-hidden="true" />}
                    <motion.span key={p.score} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="font-display text-2xl font-bold tabular-nums" aria-label={t('share.points', { count: p.score })}>{p.score}</motion.span>
                  </li>
                );
              })}
            </ol>
          </aside>
        </div>
      )}

      {question && player && phase === 'play' && <ShareQuestion question={question.q} player={player} cpuLevel={cpuLevel} onResult={onResult} />}

      {reveal && turns && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45" role="dialog" aria-modal="true" aria-label={revealText(reveal.card)}>
          <motion.div initial={settings.motion === 'still' ? false : { scale: 0.6, rotate: -6 }} animate={{ scale: 1, rotate: 0 }}
            className="bg-surface border-[3px] border-border rounded-panel p-8 grid gap-4 justify-items-center text-center max-w-lg w-full" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
            <Sparkle weight="fill" size={64} className="text-accent" aria-hidden="true" />
            <p className="font-display text-4xl font-bold">{revealText(reveal.card)}</p>
            {reveal.choosing && current(turns).kind !== 'cpu' && (
              <div className="grid gap-2 w-full">
                <p className="font-bold">{t('tb.chooseTeam', { action: reveal.card.kind === 'swap' ? t('tb.swapWith') : t('tb.stealFrom') })}</p>
                <div className="grid grid-cols-2 gap-2">
                  {turns.players.filter((p) => p.id !== current(turns).id && p.score > 0).map((p) => (
                    <button key={p.id} type="button" onClick={() => applyCard(reveal.card, p.id)}
                      className="min-h-14 px-3 rounded-input border-[2px] border-border bg-surface-2 font-bold flex items-center gap-2">
                      <TeamBadge colorIndex={p.colorIndex} size={30} />{p.name} ({p.score})
                    </button>
                  ))}
                </div>
              </div>
            )}
            {(reveal.card.kind === 'swap' || reveal.card.kind === 'steal') && !reveal.choosing && turns.players.filter((p) => p.id !== current(turns).id && p.score > 0).length === 0 && (
              <p className="font-bold">{t('tb.nobodyToPick')}</p>
            )}
            {!reveal.choosing && current(turns).kind !== 'cpu' && (
              <button type="button" onClick={closeReveal} className="min-h-14 px-10 rounded-pill border-[2.5px] border-border bg-accent font-display text-2xl font-bold">{t('tb.ok')}</button>
            )}
          </motion.div>
        </div>
      )}
    </main>
    </ThemedPage>
  );
}
