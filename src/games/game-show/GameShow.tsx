import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useLocation } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle, Crown, Sparkle, Trophy, UsersThree, X } from '@phosphor-icons/react';
import { data, newId } from '../../data';
import { useMySets } from '../../data/hooks';
import { LIBRARY } from '../../data/library';
import type { MultipleChoiceQuestion, QuestionSet } from '../../data/types';
import { playEffect } from '../../engine/feedback';
import ResultsModal from '../../engine/ResultsModal';
import { drawQuestion } from '../../engine/picker';
import { isPlayable } from '../../engine/questions';
import ShareQuestion from '../../engine/ShareQuestion';
import { TeamBadge } from '../../engine/TeamBadge';
import TeamSetup from '../../engine/TeamSetup';
import { ChoiceRow, PictureChoice, Toggle } from '../../ui/fields';
import { addPoints, current, leaders, nextTurn, setScores, startTurns, type CpuLevel, type TurnPlayer, type TurnState } from '../../engine/turns';
import { t } from '../../i18n';
import { GameTopRow, SettingsPanel } from '../../settings/SettingsPanel';
import { useSettings } from '../../settings/SettingsContext';
import GameWelcome from '../GameWelcome';
import SetPicker from '../SetPicker';
import SetupWizard from '../SetupWizard';
import { gameShowManifest } from './manifest';
import { useSavedSetup } from '../useSavedSetup';
import { pieceFill, pieceImage } from '../../theme/library';
import { ThemedPage, useGameTheme } from '../../theme/useGameTheme';
import ThemeScreen from '../ThemeScreen';

import { CARD_GRIDS, dealCards, gridFor, GRID_POINTS, type CardKind } from './cards';
import ItemArt from '../../theme/ItemArt';
import type { ThemeItem } from '../../theme/types';
import Title from '../../ui/Title';
import DialogFocus from '../../ui/DialogFocus';


type Board = 'cards' | 'grid';
// A team gets three questions to earn its pick (teacher, 2026-10-31): a miss
// brings a new question, and three misses pass the turn on.
const CHANCES = 3;
type Phase = 'welcome' | 'theme' | 'setup' | 'play' | 'end';
interface Card { kind: CardKind; open: boolean; by?: number }
interface Cell { col: number; points: number; used: boolean }

export default function GameShow() {
  const { settings } = useSettings();
  const { theme, themes, playable, choose } = useGameTheme('game-show');
  const { value: mine = [] } = useMySets();
  const allSets = useMemo<QuestionSet[]>(() => [...mine, ...LIBRARY].filter((s) => s.questions.some(isPlayable)), [mine]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('welcome');
  const [setup, change] = useSavedSetup('game-show', { board: 'cards' as Board, setIds: [LIBRARY[0].id], cardCount: 12, powerOff: [] as string[] });
  const { board, cardCount } = setup;
  const grid = gridFor(cardCount);
  const gap = grid.rows > 4 ? 8 : 12;
  // The theme's power-ups (Classic ones until a theme makes its own).
  const powers = theme.items?.length ? theme.items : gameShowManifest.items!.classic;
  // A set picked with the teacher's Play now button or a game code (?set=).
  const presetSet = new URLSearchParams(useLocation().search).get('set');
  useEffect(() => { if (presetSet && allSets.some((s) => s.id === presetSet)) change({ setIds: [presetSet], board: 'cards' }); }, [presetSet, allSets.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const setIds = setup.setIds.filter((id) => allSets.some((s) => s.id === id));
  const [team, setTeam] = useState<{ players: TurnPlayer[]; level: CpuLevel }>({ players: [], level: 'medium' });
  const [turns, setTurns] = useState<TurnState | null>(null);
  const [cpuLevel, setCpuLevel] = useState<CpuLevel>('medium');
  const [cards, setCards] = useState<Card[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [question, setQuestion] = useState<{ q: MultipleChoiceQuestion; setId?: string; cell?: number; chance: number } | null>(null);
  const [step, setStep] = useState<'answer' | 'pick'>('pick');
  const [chosen, setChosen] = useState<number | null>(null);
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
      setCards(dealCards(grid.cols * grid.rows, Math.random, powers.filter((p) => !setup.powerOff.includes(p.id))).map((kind) => ({ kind, open: false })));
      startTurn(state, 'cards');
    } else {
      setCells(chosenSets.slice(0, 5).flatMap((_, col) => GRID_POINTS.map((points) => ({ col, points, used: false }))));
      startTurn(state, 'grid');
    }
    setPhase('play');
  }

  function startTurn(_state: TurnState, b: Board = board) {
    // Pick a card or square first, then answer its question (teacher, 2026-10-24).
    void b;
    setStep('pick');
    setQuestion(null);
    setChosen(null);
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

    // A miss brings a new question until the third one.
    if (!right && question.chance < CHANCES) {
      const sets = board === 'grid' && question.cell !== undefined ? [chosenSets[cells[question.cell].col]] : chosenSets;
      setQuestion({ ...draw(sets), cell: question.cell, chance: question.chance + 1 });
      return;
    }
    if (board === 'grid' && question.cell !== undefined) {
      const cell = cells[question.cell];
      // A square is used up only when it is won; three misses leave it open.
      const nextCells = right ? cells.map((c, i) => (i === question.cell ? { ...c, used: true } : c)) : cells;
      setCells(nextCells);
      setQuestion(null);
      const scored = right ? addPoints(turns, player.id, cell.points) : turns;
      finishTurn(scored, nextCells.filter((c) => !c.used).length);
      return;
    }
    setQuestion(null);
    if (right && chosen !== null) {
      openCard(chosen);
    } else {
      setChosen(null);
      finishTurn(turns, cards.filter((c) => !c.open).length);
    }
  }

  // A team picks a closed card; its question comes up, and a right answer
  // turns the card over.
  function chooseCard(i: number) {
    if (!turns || step !== 'pick' || cards[i].open || reveal || question) return;
    playEffect('tap', settings);
    setChosen(i);
    setQuestion({ ...draw(chosenSets), chance: 1 });
  }

  function openCard(i: number) {
    if (!turns) return;
    setChosen(null);
    playEffect('whoosh', settings);
    setCards((cs) => cs.map((c, j) => (j === i ? { ...c, open: true, by: current(turns).colorIndex } : c)));
    const kind = cards[i].kind;
    const others = turns.players.filter((p) => p.id !== current(turns).id && p.score > 0);
    const needsTarget = picksTeam(kind) && others.length > 0;
    setReveal({ card: kind, choosing: needsTarget });
    if (!needsTarget && !picksTeam(kind)) applyCard(kind);
  }

  function applyCard(kind: CardKind, targetId?: string) {
    setTurns((state) => {
      if (!state) return state;
      const me = current(state);
      let next = state;
      const ability = kind.kind === 'power' ? kind.item.ability : 'points';
      if (kind.kind === 'points') next = addPoints(state, me.id, kind.points);
      else if (ability === 'bonus') next = addPoints(state, me.id, powerAmount(kind.item));
      else if (ability === 'double') next = addPoints(state, me.id, me.score);
      else if (ability === 'swap' && targetId) {
        const other = state.players.find((p) => p.id === targetId)!;
        next = setScores(state, { [me.id]: other.score, [other.id]: me.score });
      } else if (ability === 'steal' && targetId) {
        const other = state.players.find((p) => p.id === targetId)!;
        const take = Math.min(powerAmount(kind.item), other.score);
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
    setQuestion({ ...d, cell: i, chance: 1 });
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
        if (closed.length) chooseCard(closed[Math.floor(Math.random() * closed.length)]);
      } else {
        const open = cells.map((c, i) => (c.used ? -1 : i)).filter((i) => i >= 0);
        if (open.length) pickCell(open[Math.floor(Math.random() * open.length)]);
      }
    }, 1200);
    return () => window.clearTimeout(timer);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const revealText = (k: CardKind) =>
    k.kind === 'points' ? t('tb.reveal.points', { points: k.points }) : `${k.item.name}: ${t(`tb.reveal.${k.item.ability}` as 'tb.reveal.steal', { points: powerAmount(k.item) })}`;

  return (
    <ThemedPage theme={theme}>
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-6 [--gs-extra:6rem] lg:[--gs-extra:0rem] portrait:[--gs-tall:1.5]">
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context="game-show" />
      <GameTopRow onSettings={() => setSettingsOpen(true)}>
        {(phase === 'play' || phase === 'end') && <h1 className="title-bubble text-3xl sm:text-4xl"><Title text={t('tb.title')} /></h1>}
      </GameTopRow>

      {phase === 'welcome' && (
        <GameWelcome game={gameShowManifest} cover={pieceImage(theme, 'cover')} onStart={() => setPhase('theme')} steps={[
          { icon: <UsersThree weight="fill" size={22} />, text: t('tb.how1') },
          { icon: <CheckCircle weight="fill" size={22} />, text: t('tb.how2') },
          { icon: <Trophy weight="fill" size={22} />, text: t('tb.how3') },
        ]} />
      )}

      {phase === 'theme' && (
        <ThemeScreen gameName={gameShowManifest.name} current={theme} themes={themes} playable={playable} onChoose={choose} onBack={() => setPhase('welcome')} onNext={() => setPhase('setup')} />
      )}

      {phase === 'setup' && (
        <SetupWizard onBack={() => setPhase('theme')} onPlay={() => begin(team.players, team.level)} pages={[
          { id: 'board', title: t('setup.board'), content: (
            <PictureChoice label={t('tb.board')} value={board}
              onChange={(v) => change({ board: v, setIds: v === 'cards' ? setIds.slice(0, 1) : setIds })}
              options={[
                { value: 'cards', title: t('tb.cards'), hint: t('tb.cardsHint'), art: <BoardArt kind="cards" /> },
                { value: 'grid', title: t('tb.grid'), hint: t('tb.gridHint'), art: <BoardArt kind="grid" /> },
              ]} />
          ) },
          { id: 'questions', title: t('setup.questions'), ready: setIds.length > 0, content: (
            <SetPicker sets={allSets} value={setIds} max={board === 'grid' ? 5 : 1} onChange={(ids) => change({ setIds: ids })} />
          ) },
          ...(board === 'cards' ? [{ id: 'options', title: t('setup.options'), content: (
            <>
              <ChoiceRow label={t('tb.cardCount')} value={String(grid.cols * grid.rows)} onChange={(v) => change({ cardCount: Number(v) })}
                options={CARD_GRIDS.map((g) => ({ value: String(g.cols * g.rows), label: t('tb.gridSize', { cols: g.cols, rows: g.rows }) }))} />
              <div className="grid gap-2">
                <span className="font-bold">{t('tb.powers')}</span>
                <span className="text-sm font-semibold text-muted -mt-1.5">{t('tb.powersHint')}</span>
                {powers.map((p) => (
                  <Toggle key={p.id} label={p.name} hint={t(`tb.power.${p.ability}` as 'tb.power.steal', { points: powerAmount(p) })} art={<ItemArt item={p} size={44} still />}
                    value={!setup.powerOff.includes(p.id)}
                    onChange={(on) => change({ powerOff: on ? setup.powerOff.filter((x) => x !== p.id) : [...setup.powerOff, p.id] })} />
                ))}
              </div>
            </>
          ) }] : []),
          { id: 'teams', title: t('setup.teams'), ready: team.players.length > 0 && team.players.every((p) => p.name.trim()), content: (
            <TeamSetup mode="share" min={1} max={10} embedded onChange={(players, level) => setTeam({ players, level })} />
          ) },
        ]} />
      )}

      {(phase === 'play' || phase === 'end') && turns && (
        <div className="grid lg:grid-cols-[1fr_280px] gap-5 items-start">
          <section className="grid gap-4 min-w-0 @container">
            {/* Whose turn shows as a glow in the scores (teacher, 2026-10-31); screen readers hear it. */}
            {phase === 'play' && player && (
              <p className="sr-only" aria-live="polite">{step === 'pick' && !question ? (board === 'cards' ? t('tb.pickCard', { name: player.name }) : t('tb.pickCell', { name: player.name })) : t('share.whoseTurn', { name: player.name })}</p>
            )}

            {phase === 'play' && board === 'cards' && (
              // The cards fill the space left on screen, all the same size
              // (teacher, 2026-10-31): as tall as the screen allows, but never
              // taller than 1.2 times their width (1.5 on tall screens).
              <div className="grid w-full"
                style={{ gap, gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${grid.rows}, minmax(0, 1fr))`,
                  height: `min(calc(100dvh - 12.5rem + var(--chrome-save, 0rem) - var(--gs-extra, 0rem)), calc(${grid.rows} * (100cqw - ${(grid.cols - 1) * gap}px) / ${grid.cols} * var(--gs-tall, 1.2) + ${(grid.rows - 1) * gap}px))` }}>
                {cards.map((c, i) => (
                  <motion.button
                    key={i}
                    type="button"
                    onClick={() => chooseCard(i)}
                    disabled={c.open || step !== 'pick' || !!reveal || !!question || player?.kind === 'cpu'}
                    aria-label={c.open ? t('tb.cardTaken', { n: i + 1, team: turns.players.find((p) => p.colorIndex === c.by)?.name ?? '' }) : t('tb.card', { n: i + 1 })}
                    animate={c.open && settings.motion !== 'still' ? { rotateY: [90, 0] } : undefined}
                    transition={{ duration: 0.35 }}
                    className={`w-full h-full min-h-0 overflow-hidden rounded-input border-[2.5px] border-border font-display font-bold flex items-center justify-center text-center p-2
                      ${c.open ? 'bg-surface' : grid.rows > 4 ? 'text-2xl' : 'text-3xl sm:text-4xl'} ${step === 'pick' && !c.open && !question ? 'motion-safe:hover:-translate-y-1' : ''} ${chosen === i ? 'ring-[6px] ring-accent -translate-y-1' : ''}`}
                    style={{ boxShadow: 'var(--shadow-sticker)', ...(c.open ? {} : pieceFill(theme, 'card-back', '#fdfd94')) }}
                  >
                    {c.open ? (c.by !== undefined && <span className="h-[62%] aspect-square flex items-center justify-center [&>*]:!w-full [&>*]:!h-full"><TeamBadge colorIndex={c.by} /></span>) : i + 1}
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
                        className={`rounded-input border-[2.5px] border-border font-display text-2xl sm:text-3xl font-bold ${cell?.used ? 'bg-surface-2 text-faint' : ''}`}
                        style={{ minHeight: 'max(4rem, calc((100dvh - 30rem + var(--chrome-save, 0rem)) / 6))', ...(cell?.used ? {} : { boxShadow: 'var(--shadow-sticker)', ...pieceFill(theme, 'square', '#fdfd94') }) }}>
                        {cell?.used ? '' : points}
                      </button>
                    );
                  }))}
                </div>
              </div>
            )}

            {phase === 'end' && (
              <ResultsModal winners={leaders(turns)} title={leaders(turns).length > 1 ? t('share.tie') : t('share.winner', { name: leaders(turns)[0].name })}
                missed={missed} againLabel={t('share.again')} onAgain={() => setPhase('welcome')}>
              </ResultsModal>
            )}
          </section>

          <aside className="order-first lg:order-none bg-surface border-[2.5px] border-border rounded-panel p-2 lg:p-4 grid gap-2" style={{ boxShadow: 'var(--shadow-sticker)' }} aria-label={t('share.scores')}>
            <h2 className="hidden lg:block text-xs font-bold uppercase tracking-wider text-muted">{t('share.scores')}</h2>
            <ol className="flex flex-nowrap overflow-x-auto lg:overflow-visible lg:grid lg:grid-cols-1 gap-1.5 lg:gap-2 list-none m-0 p-1 lg:p-0">
              {turns.players.map((p) => {
                const lead = phase === 'end' && leaders(turns).some((l) => l.id === p.id);
                return (
                  <motion.li key={p.id} aria-current={player?.id === p.id && phase === 'play' ? 'true' : undefined}
                    animate={player?.id === p.id && phase === 'play' && settings.motion !== 'still' ? { boxShadow: ['0 0 0 3px #fdfd94, 0 0 14px 4px #fdfd94', '0 0 0 4px #fdfd94, 0 0 26px 10px #fdfd94', '0 0 0 3px #fdfd94, 0 0 14px 4px #fdfd94'] } : { boxShadow: player?.id === p.id && phase === 'play' ? '0 0 0 4px #fdfd94, 0 0 20px 6px #fdfd94' : '0 0 0 0 transparent' }}
                    transition={player?.id === p.id && settings.motion !== 'still' ? { duration: 1.6, repeat: Infinity } : { duration: 0.2 }}
                    className={`shrink-0 lg:shrink flex items-center gap-2 rounded-input border-[2px] p-1.5 lg:p-2 ${player?.id === p.id && phase === 'play' ? 'border-border bg-accent' : 'border-border-soft'}`}>
                    <TeamBadge colorIndex={p.colorIndex} />
                    <span className="flex-1 min-w-0 grid"><span className="font-bold truncate">{p.name}</span>{p.members && <span className="hidden lg:block text-xs font-semibold text-muted truncate" title={p.members.join(', ')}>{p.members.join(', ')}</span>}</span>
                    {lead && <Crown weight="fill" size={20} className="text-accent" aria-hidden="true" />}
                    <motion.span key={p.score} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="font-display text-2xl font-bold tabular-nums" aria-label={t('share.points', { count: p.score })}>{p.score}</motion.span>
                  </motion.li>
                );
              })}
            </ol>
          </aside>
        </div>
      )}

      {question && player && phase === 'play' && <ShareQuestion key={`${question.q.id}-${question.chance}`} question={question.q} player={player} cpuLevel={cpuLevel} onResult={onResult} chance={{ n: question.chance, total: CHANCES }} />}

      {reveal && turns && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45" role="dialog" aria-modal="true" aria-label={revealText(reveal.card)}>
          <DialogFocus />
          <motion.div initial={settings.motion === 'still' ? false : { scale: 0.6, rotate: -6 }} animate={{ scale: 1, rotate: 0 }}
            className="relative bg-surface border-[3px] border-border rounded-panel p-8 grid gap-4 justify-items-center text-center max-w-lg w-full" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
            {/* Always a way out (teacher, 2026-10-31): X closes it; a swap or steal not chosen yet is skipped. */}
            {current(turns).kind !== 'cpu' && (
              <button type="button" onClick={closeReveal} aria-label={t('class.close')} className="absolute top-3 right-3 w-12 h-12 rounded-full border-[2.5px] border-border bg-surface-2 flex items-center justify-center"><X weight="bold" size={24} /></button>
            )}
            {reveal.card.kind === 'power' ? <ItemArt item={reveal.card.item} size={120} still={settings.motion === 'still'} /> : <Sparkle weight="fill" size={64} className="text-accent" aria-hidden="true" />}
            <p className="font-display text-4xl font-bold">{revealText(reveal.card)}</p>
            {reveal.choosing && current(turns).kind !== 'cpu' && (
              <div className="grid gap-2 w-full">
                <p className="font-bold">{t('tb.chooseTeam', { action: reveal.card.kind === 'power' && reveal.card.item.ability === 'swap' ? t('tb.swapWith') : t('tb.stealFrom') })}</p>
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
            {picksTeam(reveal.card) && !reveal.choosing && turns.players.filter((p) => p.id !== current(turns).id && p.score > 0).length === 0 && (
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

const picksTeam = (k: CardKind) => k.kind === 'power' && (k.item.ability === 'swap' || k.item.ability === 'steal');
const powerAmount = (it: ThemeItem) => it.amount ?? (it.ability === 'bonus' ? 100 : 20);

// Small drawings of the two boards for the board choice.
function BoardArt({ kind }: { kind: Board }) {
  if (kind === 'cards') {
    return (
      <span className="h-full grid grid-cols-4 gap-1.5 p-3" style={{ background: '#ffe9a8' }}>
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} className="rounded-md border-[2px] border-border flex items-center justify-center font-display font-bold" style={{ background: i === 2 ? '#ffffff' : '#fdfd94', transform: `rotate(${(i % 3) - 1}deg)` }}>
            {i === 2 ? <Sparkle weight="fill" size={16} /> : i + 1}
          </span>
        ))}
      </span>
    );
  }
  return (
    <span className="h-full grid grid-cols-4 gap-1 p-3" style={{ background: '#cdd7fb' }}>
      {Array.from({ length: 4 }, (_, i) => <span key={`h${i}`} className="rounded-sm border-[2px] border-border bg-surface" />)}
      {Array.from({ length: 12 }, (_, i) => (
        <span key={i} className="rounded-sm border-[2px] border-border font-display font-bold text-xs flex items-center justify-center" style={{ background: '#fdfd94' }}>{(Math.floor(i / 4) + 1) * 100}</span>
      ))}
    </span>
  );
}
