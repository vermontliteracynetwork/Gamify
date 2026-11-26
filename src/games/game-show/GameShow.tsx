import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import HintButton from '../../engine/HintButton';
import { CPU_THINK_MS, pace, POP_IN } from '../../engine/pace';
import TapOk from '../../engine/TapOk';
import { playClip, useGameMusic } from '../../engine/music';

// Game Show's own sounds (teacher uploads, 2026-11-01; ledger: Pixabay).
const GS = '/sounds/game-show/';
import { AnimatePresence, motion } from 'motion/react';
import { useLocation } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle, Trophy, UsersThree, X } from '@phosphor-icons/react';
import { data, newId } from '../../data';
import { useMySets } from '../../data/hooks';
import { LIBRARY } from '../../data/library';
import type { MultipleChoiceQuestion, QuestionSet } from '../../data/types';
import { playEffect } from '../../engine/feedback';
import ResultsModal from '../../engine/ResultsModal';
import { drawQuestion } from '../../engine/picker';
import { isPlayable } from '../../engine/questions';
import ShareQuestion, { TurnCard } from '../../engine/ShareQuestion';
import { PowerUpCards } from '../../engine/PowerUpSwitches';
import ScoreBoard from '../../engine/ScoreBoard';
import { TeamBadge } from '../../engine/TeamBadge';
import TeamSetup from '../../engine/TeamSetup';
import { ChoiceRow, PictureChoice, Slider } from '../../ui/fields';
import { addPoints, current, leaders, nextTurn, setScores, startTurns, type CpuLevel, type TurnPlayer, type TurnState } from '../../engine/turns';
import { t } from '../../i18n';
import { FullScreenButton, GameTopRow, GearButton, SettingsPanel } from '../../settings/SettingsPanel';
import CloseGameButton from '../../engine/CloseGameButton';
import { useSettings } from '../../settings/SettingsContext';
import GameWelcome from '../GameWelcome';
import SetPicker from '../SetPicker';
import SetupWizard from '../SetupWizard';
import WayToPlay from '../WayToPlay';
import ShareHow from '../ShareHow';
import { gameShowManifest } from './manifest';
import { useHostTeams, useSavedSetup } from '../useSavedSetup';
import { pieceFill, pieceImage } from '../../theme/library';
import { ThemedPage, useGameTheme } from '../../theme/useGameTheme';
import ThemeScreen from '../ThemeScreen';

import { CARD_GRIDS, dealCards, gridFor, GRID_POINTS, linesFilled, type CardKind } from './cards';
import ItemArt from '../../theme/ItemArt';
import type { ThemeItem } from '../../theme/types';
import Title from '../../ui/Title';
import DialogFocus from '../../ui/DialogFocus';
import Meter, { METER_H } from '../../ui/Meter';
import { useStageColor } from '../../theme/stageColor';
import { Doodle, STUDIO, Marquee, PRIZE_CONFETTI, StudioBack, teamPastel, useBoxSize } from './studio';


type Board = 'cards' | 'grid';
type Phase = 'welcome' | 'theme' | 'setup' | 'play' | 'end';
interface Card { kind: CardKind; open: boolean; by?: number }
// Some squares hide a power-up, shown after a right answer (teacher, 2026-11-06).
interface Cell { col: number; points: number; used: boolean; power?: ThemeItem }

export default function GameShow() {
  const { settings } = useSettings();
  const { theme, themes, playable, choose } = useGameTheme('game-show');
  const { value: mine = [] } = useMySets();
  const allSets = useMemo<QuestionSet[]>(() => [...mine, ...LIBRARY].filter((s) => s.questions.some(isPlayable)), [mine]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('welcome');
  const hostTeams = useHostTeams();
  const [setup, change] = useSavedSetup('game-show', { board: 'cards' as Board, setIds: [LIBRARY[0].id], cardCount: 12, powerOff: [] as string[], takeOn: [] as string[], tries: '1' as '1' | '3' | 'all', who: 'versus' as 'teams' | 'versus' }, hostTeams ? { who: 'teams' as const } : undefined);
  const versus = setup.who === 'versus';
  // Tries per turn (teacher, 2026-10-31): one, three or unlimited; one by default.
  const tries = setup.tries === 'all' ? Infinity : Number(setup.tries ?? '1');
  const { board, cardCount } = setup;
  const grid = gridFor(cardCount);
  const gap = grid.rows > 4 ? 8 : 12;
  // The theme's power-ups (Classic ones until a theme makes its own).
  const powers = theme.items?.length ? theme.items : gameShowManifest.items!.classic;
  // Category squares are worth 100 to 500, so power-up points count ten times.
  const scale = board === 'grid' ? 10 : 1;
  // Steal and Swap stay off unless the teacher turns them on (market research,
  // 2026-10-31: teachers say taking points brings out the worst).
  const takes = (p: { ability: string }) => p.ability === 'steal' || p.ability === 'swap';
  const powerOn = (p: { id: string; ability: string }) => (takes(p) ? (setup.takeOn ?? []).includes(p.id) : !setup.powerOff.includes(p.id));
  // A set picked with the teacher's Play now button or a game code (?set=).
  const presetSet = new URLSearchParams(useLocation().search).get('set');
  useEffect(() => { if (presetSet && allSets.some((s) => s.id === presetSet)) change({ setIds: [presetSet], board: 'cards' }); }, [presetSet, allSets.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const setIds = setup.setIds.filter((id) => allSets.some((s) => s.id === id));
  const [team, setTeam] = useState<{ players: TurnPlayer[]; level: CpuLevel }>({ players: [], level: 'medium' });
  const [turns, setTurns] = useState<TurnState | null>(null);
  const [cpuLevel, setCpuLevel] = useState<CpuLevel>('medium');
  const [cards, setCards] = useState<Card[]>([]);
  const cardsNow = useRef<Card[]>([]);
  cardsNow.current = cards;
  const [cells, setCells] = useState<Cell[]>([]);
  const [question, setQuestion] = useState<{ q: MultipleChoiceQuestion; setId?: string; cell?: number; chance: number } | null>(null);
  const [step, setStep] = useState<'turn' | 'answer' | 'pick'>('turn');
  const [chosen, setChosen] = useState<number | null>(null);
  const [reveal, setReveal] = useState<{ card: CardKind; choosing: boolean } | null>(null);
  // The card being turned over in 3D before its prize box opens.
  const [flipping, setFlipping] = useState<number | null>(null);
  // More to play for on the cards board (teacher, 2026-11-01): a lucky card
  // that changes every turn and doubles its points, +10 for a full row or
  // column of your own cards, and +10 for three right answers in a row.
  const [lucky, setLucky] = useState<number | null>(null);
  // A rare golden card (teacher, 2026-11-13): about one game in two hides one; it pays 100.
  const golden = useRef<number | null>(null);
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const streak = useRef<Record<string, number>>({});
  function toast(text: string) {
    const id = Date.now() + Math.random();
    // It stays until it is tapped (teacher, 2026-11-24).
    setToasts((x) => [...x, { id, text }]);
  }
  // Classic wears the approved studio and marquee; a theme's own world sets its own stage.
  const marquee = theme.id.endsWith(':classic');
  const stageColor = useStageColor('game-show');
  const [stageRef, box] = useBoxSize<HTMLDivElement>();
  const [gridRef, gridBox] = useBoxSize<HTMLDivElement>();
  // A tall screen stands the card grid on its side (4 x 3 shows 3 across, 4 down).
  const tall = box.h > box.w * 1.05 && grid.cols > grid.rows;
  const dCols = tall ? grid.rows : grid.cols, dRows = tall ? grid.cols : grid.rows;
  const cardW = gridBox.w > 0 ? (gridBox.w - (dCols - 1) * gap) / dCols : 120;
  const cardBack = pieceFill(theme, 'card-back', STUDIO.butter);
  const cardBackArt = !!pieceImage(theme, 'card-back');
  const bulbs = Math.max(8, Math.min(26, Math.round((gridBox.w || box.w * 0.6) / (box.rem * 2.3))));
  const progress = board === 'cards' ? { done: cards.filter((c) => c.open).length, total: cards.length } : { done: cells.filter((c) => c.used).length, total: cells.length };
  // The brass intro when play starts, then the music fades in: one track for
  // the cards board, another for the category grid (teacher, 2026-11-01).
  useGameMusic(phase === 'play', board === 'grid' ? `${GS}music-categories.mp3` : `${GS}music-cards.mp3`, settings, `${GS}intro.mp3`);
  const flipTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(flipTimer.current), []);
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
      const deck = dealCards(grid.cols * grid.rows, Math.random, powers.filter(powerOn)).map((kind) => ({ kind, open: false }));
      setCards(deck);
      streak.current = {};
      setLucky(Math.floor(Math.random() * deck.length));
      golden.current = Math.random() < 0.5 ? Math.floor(Math.random() * deck.length) : null;
      startTurn(state, 'cards');
    } else {
      const base = chosenSets.slice(0, 5).flatMap((_, col) => GRID_POINTS.map((points) => ({ col, points, used: false })));
      const hidden = dealCards(base.length, Math.random, (setup as { powerUps?: boolean }).powerUps === false ? [] : powers.filter(powerOn));
      setCells(base.map((c, i) => { const h = hidden[i]; return h.kind === 'power' ? { ...c, power: h.item } : c; }));
      startTurn(state, 'grid');
    }
    setPhase('play');
  }

  function startTurn(_state: TurnState, b: Board = board, deck: Card[] = cards) {
    // Every turn opens with the turn card, before the move (teacher,
    // 2026-11-01). Cards: answer first, then a right answer picks a card to
    // turn over. Category grid: pick a square, then answer its question.
    setStep('turn');
    setQuestion(null);
    setChosen(null);
    // A new lucky card each turn, among the cards still closed.
    const closed = deck.map((c, i) => (c.open ? -1 : i)).filter((i) => i >= 0);
    setLucky(b === 'cards' && closed.length > 1 ? closed[Math.floor(Math.random() * closed.length)] : null);
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
    startTurn(next, board, cardsNow.current);
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

    // A miss brings a new question while tries are left.
    if (!right && question.chance < tries) {
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
      // A hidden power-up: its box opens after the points (never one that
      // takes points when nobody else has any).
      if (right && cell.power) {
        const kind: CardKind = { kind: 'power', item: cell.power };
        const others = scored.players.filter((p) => p.id !== player.id && p.score > 0);
        if (!picksTeam(kind) || others.length > 0) {
          setTurns(scored);
          playEffect('win', settings);
          if (settings.celebrations !== 'off' && settings.motion !== 'still') void confetti({ particleCount: 60, spread: 90, origin: { y: 0.45 }, disableForReducedMotion: true });
          setStep('pick');
          setReveal({ card: kind, choosing: picksTeam(kind) });
          if (!picksTeam(kind)) applyCard(kind);
          return;
        }
      }
      finishTurn(scored, nextCells.filter((c) => !c.used).length);
      return;
    }
    setQuestion(null);
    // Three right answers in a row for a team: a hot streak bonus.
    streak.current[player.id] = right ? (streak.current[player.id] ?? 0) + 1 : 0;
    if (right && streak.current[player.id] >= 3) {
      streak.current[player.id] = 0;
      const me = player.id;
      setTurns((s0) => (s0 ? addPoints(s0, me, 10) : s0));
      toast(t('tb.hotStreak', { name: player.name }));
    }
    if (right) {
      setStep('pick'); // now pick a card to turn over
    } else {
      setChosen(null);
      finishTurn(turns, cards.filter((c) => !c.open).length);
    }
  }
  // The turn card was tapped (or the computer's went away).
  function turnStarted() {
    if (board === 'cards') { setStep('answer'); setQuestion({ ...draw(chosenSets), chance: 1 }); }
    else setStep('pick');
  }

  // A team picks a closed card; its question comes up, and a right answer
  // turns the card over.
  // After a right answer, the team picks a closed card and it turns over.
  function chooseCard(i: number) {
    if (!turns || step !== 'pick' || cards[i].open || reveal || question || flipping !== null) return;
    setChosen(i);
    setStep('answer');
    openCard(i);
  }

  // A right answer turns the card over in place (a real 3D flip showing the
  // prize), then the prize box opens, bigger and louder for bigger prizes.
  function openCard(i: number) {
    if (!turns) return;
    setChosen(null);
    playEffect('whoosh', settings);
    // A card that takes or trades points never comes up when no other team
    // has points yet (teacher, 2026-11-01): it turns over as points instead.
    let kind = cards[i].kind;
    if (picksTeam(kind) && !turns.players.some((p) => p.id !== current(turns).id && p.score > 0)) {
      kind = { kind: 'points', points: [10, 20, 30, 40, 50][Math.floor(Math.random() * 5)] };
      const swapped = kind;
      setCards((cs) => cs.map((c, j) => (j === i ? { ...c, kind: swapped } : c)));
    }
    // The golden card: 100 points, with a golden show.
    if (i === golden.current) {
      kind = { kind: 'points', points: 100, golden: true };
      const gold = kind;
      setCards((cs) => cs.map((c, j) => (j === i ? { ...c, kind: gold } : c)));
    } else
    // The lucky card doubles its points.
    if (i === lucky && kind.kind === 'points') {
      kind = { ...kind, points: kind.points * 2, lucky: true };
      const doubled = kind;
      setCards((cs) => cs.map((c, j) => (j === i ? { ...c, kind: doubled } : c)));
    }
    playClip(`${GS}page-turn.mp3`, settings);
    if (settings.motion === 'still') { showPrize(i, kind); return; }
    setFlipping(i);
    flipTimer.current = window.setTimeout(() => { setFlipping(null); showPrize(i, kind); }, 900 * pace(settings));
  }
  function showPrize(i: number, kind: CardKind) {
    if (!turns) return;
    const tier = prizeTier(kind);
    if (tier > 1) playEffect('win', settings); // the correct sound already played
    if (isGolden(kind) && settings.celebrations !== 'off' && settings.motion !== 'still') void confetti({ particleCount: 160, spread: 120, origin: { y: 0.45 }, colors: ['#fabe37', '#fff1b8', '#ff9b28', '#fffaf0'], disableForReducedMotion: true });
    // Every prize gets a burst of confetti; bigger prizes get more (teacher, 2026-11-01).
    if (settings.celebrations !== 'off' && settings.motion !== 'still') void confetti({ particleCount: (settings.celebrations === 'big' ? 40 : 25) * tier, spread: 60 + tier * 15, origin: { y: 0.45 }, disableForReducedMotion: true });
    const me = current(turns);
    const opened = cards.map((c, j) => (j === i ? { ...c, open: true, by: me.colorIndex } : c));
    setCards((cs) => cs.map((c, j) => (j === i ? { ...c, open: true, by: me.colorIndex } : c)));
    // A full row or column of your own cards: +10 each.
    const lines = linesFilled(opened, grid.cols, i);
    if (lines) {
      setTurns((s0) => (s0 ? addPoints(s0, me.id, 10 * lines) : s0));
      toast(t('tb.lineBonus', { name: me.name, n: 10 * lines }));
    }
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
      else if (ability === 'bonus') next = addPoints(state, me.id, powerAmount(kind.item) * scale);
      else if (ability === 'double') next = addPoints(state, me.id, me.score);
      else if (ability === 'swap' && targetId) {
        const other = state.players.find((p) => p.id === targetId)!;
        if (other.score !== me.score) playClip(`${GS}fail.mp3`, settings); // someone loses points
        next = setScores(state, { [me.id]: other.score, [other.id]: me.score });
      } else if (ability === 'steal' && targetId) {
        const other = state.players.find((p) => p.id === targetId)!;
        if (other.score > 0) playClip(`${GS}fail.mp3`, settings);
        const take = Math.min(powerAmount(kind.item) * scale, other.score);
        next = setScores(state, { [me.id]: me.score + take, [other.id]: other.score - take });
      }
      return next;
    });
    setReveal((r) => (r ? { ...r, choosing: false } : r));
  }

  function closeReveal() {
    setReveal(null);
    if (turns) finishTurn(turns, board === 'grid' ? cells.filter((c) => !c.used).length : cards.filter((c) => !c.open).length);
  }

  function pickCell(i: number) {
    if (!turns || step !== 'pick' || cells[i]?.used || question || reveal) return;
    setStep('answer');
    const set = chosenSets[cells[i].col];
    playClip(`${GS}page-turn.mp3`, settings);
    const d = draw([set]);
    setQuestion({ ...d, cell: i, chance: 1 });
  }

  // The computer's game moves: pick a card or square, pick a team for swap
  // or steal (the leader), and close its own reveal.
  const cpuTurn = phase === 'play' && player?.kind === 'cpu';
  useEffect(() => {
    if (!cpuTurn || step !== 'pick' || question || flipping !== null || toasts.length) return;
    if (reveal) {
      // Its reveal waits for a tap from the class (teacher, 2026-11-24); it only picks its team itself.
      if (!reveal.choosing || !turns) return;
      const timer = window.setTimeout(() => {
        const target = turns.players.filter((p) => p.id !== current(turns).id && p.score > 0).sort((a, b) => b.score - a.score)[0];
        applyCard(reveal.card, target?.id);
      }, CPU_THINK_MS * pace(settings));
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
    }, (settings.motion === 'still' ? 800 : CPU_THINK_MS) * pace(settings));
    return () => window.clearTimeout(timer);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const revealText = (k: CardKind) =>
    k.kind === 'points' ? t('tb.reveal.points', { points: k.points }) : `${k.item.name}: ${t(`tb.reveal.${k.item.ability}` as 'tb.reveal.steal', { points: powerAmount(k.item) * scale })}`;

  return (
    <ThemedPage theme={theme} menu={phase !== 'play' && phase !== 'end'}>
    <main className={phase === 'play' || phase === 'end' ? '!p-0' :'w-full px-4 sm:px-6 pt-6 pb-6'}>
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context="game-show" />
      {phase !== 'play' && phase !== 'end' && <GameTopRow hint="game-show" onSettings={() => setSettingsOpen(true)} />}

      {phase === 'welcome' && (
        <GameWelcome game={gameShowManifest} cover={pieceImage(theme, 'cover')} onStart={() => setPhase(themes.length > 1 ? 'theme' : 'setup')} steps={[
          { icon: <UsersThree weight="fill" size={22} />, text: t('tb.how1') },
          { icon: <CheckCircle weight="fill" size={22} />, text: t('tb.how2') },
          { icon: <Trophy weight="fill" size={22} />, text: t('tb.how3') },
        ]} />
      )}

      {phase === 'theme' && (
        <ThemeScreen gameName={gameShowManifest.name} current={theme} themes={themes} playable={playable} onChoose={choose} onBack={() => setPhase('welcome')} onNext={() => setPhase('setup')} />
      )}

      {phase === 'setup' && (
        <SetupWizard onBack={() => setPhase(themes.length > 1 ? 'theme' : 'welcome')} onPlay={() => begin(team.players, team.level)} pages={[
          // Teams on the big screen, or two players head to head (teacher, 2026-10-31).
          { id: 'way', title: t('way.title'), content: <div className="grid gap-6"><WayToPlay modes={['share', 'versus']} value={versus ? 'versus' : 'share'} onChange={(m) => change({ who: m === 'versus' ? 'versus' : 'teams' })} />{!versus && <ShareHow gameId="game-show" setId={setup.setIds[0]} />}</div> },
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
          { id: 'options', title: t('setup.options'), content: (
            <>
              <Slider label={t('tb.tries')} min={0} max={2} value={['1', '3', 'all'].indexOf(setup.tries ?? '1')}
                show={(v) => t((['tb.tries.1', 'tb.tries.3', 'tb.tries.all'] as const)[v])} onChange={(v) => change({ tries: (['1', '3', 'all'] as const)[v] })} />
              {board === 'cards' && <ChoiceRow label={t('tb.cardCount')} value={String(grid.cols * grid.rows)} onChange={(v) => change({ cardCount: Number(v) })}
                options={CARD_GRIDS.map((g) => ({ value: String(g.cols * g.rows), label: t('tb.gridSize', { cols: g.cols, rows: g.rows }), art: <GridPreview cols={g.cols} rows={g.rows} /> }))} />}
              <PowerUpCards hint={t('tb.powersHint')}
                cards={powers.map((p) => ({ id: p.id, name: p.name, hint: t(`tb.power.${p.ability}` as 'tb.power.steal', { points: powerAmount(p) * scale }), art: <ItemArt item={p} size={64} still />, on: powerOn(p) }))}
                onChange={(id, on) => { const p = powers.find((x) => x.id === id)!; if (takes(p)) change({ takeOn: on ? [...(setup.takeOn ?? []), p.id] : (setup.takeOn ?? []).filter((x) => x !== p.id) }); else change({ powerOff: on ? setup.powerOff.filter((x) => x !== p.id) : [...setup.powerOff, p.id] }); }} />
            </>
          ) },
          versus
            ? { id: 'players', title: t('setup.players'), ready: team.players.length === 2 && team.players.every((p) => p.name.trim()), content: (
              <TeamSetup key="versus" mode="versus" vsComputer min={2} max={2} embedded onChange={(players, level) => setTeam({ players, level })} />
            ) }
            : { id: 'teams', title: t('setup.teams'), ready: team.players.length > 0 && team.players.every((p) => p.name.trim()), content: (
              <TeamSetup key="share" mode="share" min={1} max={10} embedded onChange={(players, level) => setTeam({ players, level })} />
            ) },
        ]} />
      )}

      {(phase === 'play' || phase === 'end') && turns && (
        // The approved studio (mockup, teacher 2026-11-24): the board in its bulb
        // marquee with the meter on top, the scores in a column beside it (below
        // it on portrait screens), the tools top right on the valance. The board
        // fills the play space, the same in full screen (teacher, 2026-10-31).
        <div ref={stageRef} className="relative play-fill overflow-hidden" data-gs-stage={marquee ? 'studio' : 'theme'}>
          {marquee && <StudioBack w={box.w} h={box.h} rem={box.rem} back={stageColor} />}
          <div className={`relative h-full grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_clamp(12rem,19vw,17rem)] gap-3 lg:gap-[clamp(1rem,3vw,3rem)] content-center items-center max-w-[110rem] mx-auto
            [--gs-extra:6rem] lg:[--gs-extra:0rem] ${marquee ? '[--gs-rim:1.05rem] [--gs-inner:0.6rem] [--gs-top:3.1rem] [--gs-bottom:1.25rem]' : '[--gs-rim:0px] [--gs-inner:0px] [--gs-top:0.75rem] [--gs-bottom:0.75rem]'}`}
            style={{ padding: marquee ? 'var(--gs-top) max(9.5%, 3rem) var(--gs-bottom)' : 'var(--gs-top) clamp(0.75rem, 2.5vw, 2.5rem) var(--gs-bottom)' }}>
          <h1 className="sr-only"><Title text={t('tb.title')} /></h1>
          <div className={`absolute ${marquee ? 'top-[0.45rem] right-[max(1rem,2%)]' : 'top-3 right-3'} flex items-center gap-1.5 z-10 [&_button]:!w-11 [&_button]:!h-11`}>
            {/* One order everywhere (Brand Kit, 2026-11-24): Hint, Settings, Full screen, Close. */}
            <HintButton gameId="game-show" />
            <GearButton small onClick={() => setSettingsOpen(true)} />
            <FullScreenButton small />
            <CloseGameButton />
          </div>
          <section className="relative grid justify-items-center gap-[0.6rem] min-w-0 @container">
            {/* Bonus toasts: full row or column, hot streak. */}
            <div className={`fixed inset-0 z-[70] grid place-content-center justify-items-center gap-3 ${toasts.length ? 'bg-black/35' : 'pointer-events-none'}`} role="status">
              <AnimatePresence>
                {toasts.map((x) => (
                  <motion.p key={x.id} className="font-display text-2xl sm:text-3xl bg-surface border-heavy border-border rounded-pill px-6 py-2" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}
                    initial={settings.motion === 'still' ? false : { y: -40, opacity: 0, scale: 0.6 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20 }} transition={settings.motion === 'still' ? { duration: 0.01 } : POP_IN}>{x.text}</motion.p>
                ))}
              </AnimatePresence>
              {toasts.length > 0 && <TapOk onTap={() => setToasts([])} />}
            </div>
            {/* The computer thinks out loud before it picks (teacher, 2026-11-24). */}
            {cpuTurn && step === 'pick' && !question && !reveal && flipping === null && player && (
              <p className="fixed left-1/2 bottom-6 -translate-x-1/2 z-40 font-display text-2xl sm:text-3xl bg-surface border-heavy border-border rounded-pill px-6 py-2 pointer-events-none" style={{ boxShadow: 'var(--shadow-sticker)' }} role="status">{t('cpu.thinking', { name: player.name })}</p>
            )}
            {/* Whose turn shows as the Butter row in the scores (teacher, 2026-11-24); screen readers hear it. */}
            {phase === 'play' && player && (
              <p className="sr-only" aria-live="polite">{step === 'pick' && !question ? (board === 'cards' ? t('tb.pickCard', { name: player.name }) : t('tb.pickCell', { name: player.name })) : t('share.whoseTurn', { name: player.name })}</p>
            )}

            {/* THE meter on top of the board (approved mockup): it fills as cards are won.
                At 0 it shows the Lemon start knob and its count on a Paper tag beside it,
                so it never reads as an empty placeholder pill (Classic Art Director, 2026-11-26). */}
            <div className="flex items-center gap-2" style={{ width: 'min(25rem, 66%)' }}>
              <span className="flex-1 min-w-0 flex">
                <Meter width="100%" segments={1} done={0} part={progress.total ? Math.max(progress.done / progress.total, 0.001) : 0.001}
                  label={`${progress.done}/${progress.total} ${t(board === 'cards' ? 'tb.cardsWord' : 'tb.squaresWord')}`} />
              </span>
              <span className="shrink-0 grid place-items-center rounded-pill bg-[var(--paper)] px-2.5 text-sm font-bold leading-none tabular-nums text-[var(--ink)]"
                style={{ height: METER_H, border: '2.5px solid var(--color-border)', boxShadow: '0 2px 0 var(--color-border)' }} aria-hidden="true">
                {progress.done}/{progress.total}
              </span>
            </div>

            {board === 'cards' && (
              // The cards fill the space left on screen, all the same size
              // (teacher, 2026-10-31), and are always horizontal (300 x 220, never
              // taller than 0.75 times their width) at any grid size (teacher,
              // 2026-11-01). On a tall screen the grid stands on its side, so a
              // 4 x 3 board is 3 across and 4 down; rows and columns swap together,
              // so a full row or column is still a full line.
              <Frame marquee={marquee} bulbs={bulbs} chase={settings.motion === 'full'}>
              <div ref={gridRef} className="grid"
                style={{ gap, gridTemplateColumns: `repeat(${dCols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${dRows}, minmax(0, 1fr))`,
                  width: `calc(100cqw - 2 * ${FRAME})`,
                  height: `min(calc(var(--play-h) - var(--gs-top) - var(--gs-bottom) - var(--gs-extra) - ${METER_H}px - 0.6rem - 2 * ${FRAME} - 8px), calc(${dRows} * (100cqw - 2 * ${FRAME} - ${(dCols - 1) * gap}px) / ${dCols} * ${CARD_RATIO} + ${(dRows - 1) * gap}px))` }}>
                {cards.map((c, i) => {
                  const r = Math.floor(i / grid.cols), col = i % grid.cols;
                  const place = tall ? { gridRow: col + 1, gridColumn: r + 1 } : {};
                  const gold = c.open && isGolden(c.kind);
                  return (
                  <motion.button
                    key={i}
                    type="button"
                    onClick={() => chooseCard(i)}
                    disabled={c.open || step !== 'pick' || !!reveal || !!question || player?.kind === 'cpu'}
                    aria-label={c.open ? t('tb.cardTaken', { n: i + 1, team: turns.players.find((p) => p.colorIndex === c.by)?.name ?? '' }) : t('tb.card', { n: i + 1 })}
                    animate={c.open && settings.motion !== 'still' ? { rotateY: [90, 0] } : undefined}
                    transition={{ duration: 0.35 }}
                    className={`relative w-full h-full min-h-0 rounded-[0.9rem] ${flipping === i ? 'overflow-visible z-10' : 'overflow-hidden'} ${!c.open ? 'tile-wiggle' : ''} ${chosen === i ? 'ring-[6px] ring-accent -translate-y-1' : ''}`}
                    style={{ ...place, border: `3px solid ${flipping === i ? 'transparent' : STUDIO.ink}`, boxShadow: flipping === i ? 'none' : gold ? '0 0 0 4px #fabe37' : c.open ? 'none' : `0 4px 0 ${STUDIO.ink}` }}
                  >
                    {flipping === i ? (
                      // A right answer turns the card over in 3D, then the prize box opens.
                      <span className="absolute -inset-[3px]" style={{ perspective: 900 }} aria-hidden="true">
                        {/* A CSS keyframe turn (lift, turn, settle): Motion's rotateY jumped straight to the end here. */}
                        <span className="absolute inset-0 gs-flip" style={{ transformStyle: 'preserve-3d', animationDuration: `${0.65 * pace(settings)}s` }}>
                          <ClosedFace fill={cardBack} art={!cardBackArt} w={cardW} edge style={{ backfaceVisibility: 'hidden' }} />
                          <OpenFace kind={c.kind} by={player?.colorIndex ?? 0} w={cardW} edge style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', boxShadow: `0 0 24px 6px ${STUDIO.butter}` }} />
                        </span>
                      </span>
                    ) : c.open && c.by !== undefined ? <OpenFace kind={c.kind} by={c.by} w={cardW} /> : <ClosedFace fill={cardBack} art={!cardBackArt} w={cardW} />}
                    {/* The lucky card stays a secret until it is won (teacher, 2026-11-06). */}
                  </motion.button>
                  );
                })}
              </div>
              </Frame>
            )}

            {board === 'grid' && (
              // Category squares in the same marquee; room inside the scroll box for
              // the bottom row's outline and shadow (teacher, 2026-10-31: never cut off).
              <Frame marquee={marquee} bulbs={bulbs} chase={settings.motion === 'full'}>
              <div className="overflow-x-auto p-1.5 -m-1.5" style={{ width: `calc(100cqw - 2 * ${FRAME})` }}>
                <div className="grid gap-2 min-w-[min(560px,100%)]" style={{ gridTemplateColumns: `repeat(${Math.min(5, chosenSets.length)}, minmax(0, 1fr))` }}>
                  {chosenSets.slice(0, 5).map((s) => (
                    <div key={s.id} className="min-h-14 rounded-[0.8rem] font-display font-black text-center flex items-center justify-center p-2 text-base sm:text-lg [-webkit-text-stroke:0.4px_currentColor]" style={{ background: STUDIO.paper, border: `3px solid ${STUDIO.ink}` }}>{s.name}</div>
                  ))}
                  {GRID_POINTS.map((points) => chosenSets.slice(0, 5).map((s, col) => {
                    const i = cells.findIndex((c) => c.col === col && c.points === points);
                    const cell = cells[i];
                    return (
                      <button key={`${col}-${points}`} type="button" onClick={() => pickCell(i)}
                        disabled={!cell || cell.used || step !== 'pick' || !!question || player?.kind === 'cpu'}
                        aria-label={cell?.used ? t('tb.cellUsed', { set: s.name, points }) : t('tb.cell', { set: s.name, points })}
                        className={`rounded-[0.8rem] font-display text-2xl sm:text-3xl font-bold tabular-nums ${cell?.used ? 'text-faint' : 'tile-wiggle'}`}
                        style={{ minHeight: `max(2.6rem, calc((var(--play-h) - var(--gs-top) - var(--gs-bottom) - var(--gs-extra) - ${METER_H}px - 0.6rem - 2 * ${FRAME} - 7.75rem) / 5))`, border: `3px solid ${STUDIO.ink}`,
                          ...(cell?.used ? { background: 'rgba(255,250,240,0.55)', borderStyle: 'dashed' } : { boxShadow: `0 4px 0 ${STUDIO.ink}`, ...pieceFill(theme, 'square', STUDIO.butter) }) }}>
                        {cell?.used ? '' : points}
                      </button>
                    );
                  }))}
                </div>
              </div>
              </Frame>
            )}

            {phase === 'end' && (
              <ResultsModal winners={leaders(turns)} title={leaders(turns).length > 1 ? t('share.tie') : t('share.winner', { name: leaders(turns)[0].name })}
                missed={missed} againLabel={t('share.again')} onAgain={() => setPhase('welcome')}>
              </ResultsModal>
            )}
          </section>

          <div className="min-w-0 grid lg:self-center">
          <ScoreBoard turns={turns} playing={phase === 'play'} />
          </div>
          </div>
        </div>
      )}

      {question && player && phase === 'play' && <ShareQuestion key={`${question.q.id}-${question.chance}`} question={question.q} player={player} cpuLevel={cpuLevel} onResult={onResult} chance={{ n: question.chance, total: tries }} turnCard={false} />}
      {phase === 'play' && step === 'turn' && player && !reveal && <TurnCard key={player.id} player={player} onStart={turnStarted} />}

      {reveal && turns && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45" role="dialog" aria-modal="true" aria-label={revealText(reveal.card)}>
          <DialogFocus />
          {/* Bigger prizes, bigger show: sun rays behind the box for big ones. */}
          {(reveal.card.kind === 'points' || prizeTier(reveal.card) > 1) && (
            <motion.div aria-hidden="true" className="absolute w-[min(90vw,44rem)] aspect-square pointer-events-none"
              initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: prizeTier(reveal.card) === 3 ? 0.9 : 0.55, scale: 1 }} transition={{ duration: settings.motion === 'still' ? 0 : 0.5 }}>
              {/* The spin lives on an inner layer so the grow-in still shows. */}
              <div className={`w-full h-full rounded-full ${settings.motion === 'full' ? 'gs-rays' : ''}`}
                style={{ background: isGolden(reveal.card) ? 'repeating-conic-gradient(from 0deg, #fabe37 0deg 8deg, #fff1b8 8deg 12deg, transparent 12deg 20deg)' : 'repeating-conic-gradient(from 0deg, #fff1b8 0deg 10deg, transparent 10deg 20deg)', WebkitMaskImage: 'radial-gradient(circle, #000 30%, transparent 70%)', maskImage: 'radial-gradient(circle, #000 30%, transparent 70%)' }} />
            </motion.div>
          )}
          {/* The prize card pops off the board (approved mockup, 2026-11-24): a paper
              card with doodle confetti at its edges, the prize, its name and Continue. */}
          <motion.div initial={settings.motion === 'still' ? false : { scale: prizeTier(reveal.card) === 3 ? 0.3 : 0.6, rotate: -6 }} animate={{ scale: 1, rotate: 0 }}
            transition={prizeTier(reveal.card) === 3 ? { type: 'spring', stiffness: 150, damping: 11, mass: 1.1 } : POP_IN}
            className="relative px-8 pt-8 pb-7 grid gap-3 justify-items-center text-center w-full max-w-[26rem]"
            style={{ background: isGolden(reveal.card) ? STUDIO.lemon : STUDIO.paper, border: `3px solid ${STUDIO.ink}`, borderRadius: '1.5rem', boxShadow: `0 6px 0 ${STUDIO.ink}` }}>
            {PRIZE_CONFETTI.map(([k, c, x, y, sz], n) => (
              <motion.span key={n} aria-hidden="true" className="absolute pointer-events-none" style={{ left: x, top: y }}
                initial={settings.motion === 'still' ? false : { scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: (n * 37) % 50 - 25 }} transition={{ delay: 0.2 + n * 0.05, type: 'spring', stiffness: 260, damping: 12 }}>
                <Doodle kind={k} color={c} size={`${sz}rem`} />
              </motion.span>
            ))}
            {/* Always a way out (teacher, 2026-10-31): X closes it; a swap or steal not chosen yet is skipped. */}
            {(current(turns).kind !== 'cpu' || !reveal.choosing) && (
              <button type="button" onClick={closeReveal} aria-label={t('class.close')} className="absolute top-3 right-3 w-11 h-11 rounded-full flex items-center justify-center" style={{ background: STUDIO.paper, border: `2px solid ${STUDIO.ink}`, boxShadow: `0 3px 0 ${STUDIO.ink}` }}><X weight="bold" size={20} /></button>
            )}
            {reveal.card.kind === 'power' ? (
              <>
                <motion.span className="relative w-32 h-32 grid place-items-center" initial={settings.motion === 'still' ? false : { scale: 0.3, rotate: -12 }} animate={{ scale: [0.3, 1.2, 1], rotate: [-12, 8, 0] }} transition={{ duration: 0.8, ease: 'easeOut' }}>
                  <ItemArt item={reveal.card.item} size={120} still={settings.motion === 'still'} />
                </motion.span>
                <p className="relative font-display text-4xl sm:text-5xl leading-none"><Title text={`${reveal.card.item.name}!`} /></p>
                <p className="relative font-bold text-xl">{t(`tb.reveal.${reveal.card.item.ability}` as 'tb.reveal.steal', { points: powerAmount(reveal.card.item) * scale })}</p>
              </>
            ) : (
              // The points count up, bigger for bigger prizes: a big bouncing number
              // with streamers flying out of the card (teacher, 2026-11-01: no star,
              // more celebratory).
              <>
                {settings.motion !== 'still' && Array.from({ length: 14 }, (_, k) => (
                  <motion.span key={k} aria-hidden="true" className="absolute w-2.5 h-4 rounded-sm pointer-events-none" style={{ left: '50%', top: '34%', background: [STUDIO.pink, '#4ba3e8', STUDIO.grape, '#22b04a', STUDIO.lemon, STUDIO.orange][k % 6], border: `1.5px solid ${STUDIO.ink}` }}
                    initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }} animate={{ x: Math.cos((k / 14) * Math.PI * 2) * 210, y: Math.sin((k / 14) * Math.PI * 2) * 140 + 40, rotate: 360 + k * 40, opacity: 0 }} transition={{ duration: 1.4, ease: 'easeOut', delay: 0.15 }} />
                ))}
                <motion.p className="relative font-display font-bold leading-none" style={{ fontSize: `${4 + prizeTier(reveal.card)}rem`, color: STUDIO.lemon, WebkitTextStroke: `3px ${STUDIO.ink}`, paintOrder: 'stroke', textShadow: `0 5px 0 ${STUDIO.ink}` }} aria-hidden="true"
                  initial={settings.motion === 'still' ? false : { scale: 0.3, rotate: -10 }} animate={{ scale: [0.3, 1.25, 1], rotate: [-10, 6, 0] }} transition={{ duration: 0.8, ease: 'easeOut' }}>
                  +<CountUp to={reveal.card.points} still={settings.motion === 'still'} />
                </motion.p>
                <p className="relative font-display text-4xl leading-tight">{reveal.card.golden ? t('tb.pointsGolden') : reveal.card.lucky ? t('tb.pointsLucky') : t(prizeTier(reveal.card) === 3 ? 'tb.pointsBig' : 'tb.pointsWord')}</p>
              </>
            )}
            {reveal.choosing && current(turns).kind !== 'cpu' && (
              <div className="grid gap-2 w-full">
                <p className="font-bold">{t('tb.chooseTeam', { action: reveal.card.kind === 'power' && reveal.card.item.ability === 'swap' ? t('tb.swapWith') : t('tb.stealFrom') })}</p>
                <div className="grid grid-cols-2 gap-2">
                  {turns.players.filter((p) => p.id !== current(turns).id && p.score > 0).map((p) => (
                    <button key={p.id} type="button" onClick={() => applyCard(reveal.card, p.id)}
                      className="min-h-14 px-3 rounded-input border-std border-border bg-surface-2 font-bold flex items-center gap-2">
                      <TeamBadge colorIndex={p.colorIndex} size={30} />{p.name} ({p.score})
                    </button>
                  ))}
                </div>
              </div>
            )}
            {picksTeam(reveal.card) && !reveal.choosing && turns.players.filter((p) => p.id !== current(turns).id && p.score > 0).length === 0 && (
              <p className="font-bold">{t('tb.nobodyToPick')}</p>
            )}
            {!reveal.choosing && <TapOk onTap={closeReveal} label={t('tap.goOn')} className="relative mt-1" />}
          </motion.div>
        </div>
      )}
    </main>
    </ThemedPage>
  );
}

// Cards are the template's 300 x 220 (Brand Kit pieces), always wider than tall.
const CARD_RATIO = 220 / 300;
// The marquee's thickness on each side: its ink edge, rim, inner edge and inner pad.
const FRAME = '(7px + var(--gs-rim) + var(--gs-inner))';

// The bulb marquee round the board on Classic; a theme's own stage gets the board alone.
function Frame({ marquee, bulbs, chase, children }: { marquee: boolean; bulbs: number; chase: boolean; children: ReactNode }) {
  return marquee ? <Marquee bulbs={bulbs} chase={chase}>{children}</Marquee> : <div>{children}</div>;
}

// A closed card (approved mockup): butter with a dashed orange inset and a
// crayon sparkle, never a number (golden rule: no numbers on spaces). A theme's
// own card-back art shows instead when it has one.
function ClosedFace({ fill, art, w, edge, style }: { fill: CSSProperties; art: boolean; w: number; edge?: boolean; style?: CSSProperties }) {
  return (
    <span className="absolute inset-0 grid place-items-center overflow-hidden" style={{ ...fill, borderRadius: '0.9rem', ...(edge ? { border: `3px solid ${STUDIO.ink}` } : {}), ...style }}>
      {art && (
        <>
          <span className="absolute" style={{ inset: Math.max(4, w * 0.04), borderRadius: '0.6rem', border: `2px dashed ${STUDIO.orange}` }} />
          <Doodle kind="sparkle" color={STUDIO.lemon} size={Math.round(Math.max(18, w * 0.3))} />
        </>
      )}
    </span>
  );
}

// A won card: the team's pastel, its badge small in the corner and the prize
// (+points or the power-up), so the board shows who won what at a glance.
function OpenFace({ kind, by, w, edge, style }: { kind: CardKind; by: number; w: number; edge?: boolean; style?: CSSProperties }) {
  const gold = isGolden(kind);
  return (
    <span className="absolute inset-0 grid place-items-center overflow-hidden" style={{ background: gold ? STUDIO.lemon : teamPastel(by), borderRadius: '0.9rem', ...(edge ? { border: `3px solid ${STUDIO.ink}` } : {}), ...style }}>
      <span className="absolute" style={{ top: Math.max(3, w * 0.035), left: Math.max(3, w * 0.035) }}><TeamBadge colorIndex={by} size={Math.round(Math.max(16, Math.min(40, w * 0.17)))} /></span>
      {kind.kind === 'power'
        ? <ItemArt item={kind.item} size={Math.round(Math.max(24, w * 0.4))} still />
        : <b className="font-display tabular-nums leading-none" style={{ fontSize: Math.max(16, w * 0.26), color: STUDIO.ink }}>+{kind.points}</b>}
    </span>
  );
}

// How big a prize is: 1 small, 2 medium, 3 big (40 or more, or a power-up).
const prizeTier = (k: CardKind) => (k.kind === 'power' ? 3 : k.points >= 40 ? 3 : k.points >= 30 ? 2 : 1);
const isGolden = (k: CardKind) => k.kind === 'points' && !!k.golden;

function CountUp({ to, still }: { to: number; still: boolean }) {
  const [n, setN] = useState(still ? to : 0);
  useEffect(() => {
    if (still) { setN(to); return; }
    const t0 = performance.now();
    let raf = 0;
    const tick = (ts: number) => { const f = Math.min(1, (ts - t0) / 650); setN(Math.round(to * (1 - (1 - f) ** 3))); if (f < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, still]);
  return <span className="tabular-nums">{n}</span>;
}

const picksTeam = (k: CardKind) => k.kind === 'power' && (k.item.ability === 'swap' || k.item.ability === 'steal');
const powerAmount = (it: ThemeItem) => it.amount ?? (it.ability === 'bonus' ? 100 : 20);

// Small drawings of the two boards for the board choice.
// A tiny picture of a card grid's shape (teacher, 2026-11-06).
function GridPreview({ cols, rows }: { cols: number; rows: number }) {
  return (
    <span className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${cols}, 9px)`, gridAutoRows: '6px' }} aria-hidden="true">
      {Array.from({ length: cols * rows }, (_, i) => <span key={i} className="rounded-[1.5px] border border-border" style={{ background: STUDIO.butter }} />)}
    </span>
  );
}

function BoardArt({ kind }: { kind: Board }) {
  if (kind === 'cards') {
    return (
      // The Classic cards in small (owner, 2026-11-26: the /brand look): Butter
      // cards with the crayon sparkle on Lavender, one won card in a team pastel.
      <span className="h-full grid grid-cols-4 gap-1.5 p-3" style={{ background: STUDIO.lavender }}>
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} className="rounded-md border-std border-border flex items-center justify-center font-display font-bold" style={{ background: i === 2 ? '#bfdff3' : STUDIO.butter }}>
            {i === 2 ? '+30' : <Doodle kind="sparkle" color={STUDIO.lemon} size={16} />}
          </span>
        ))}
      </span>
    );
  }
  return (
    <span className="h-full grid grid-cols-4 gap-1 p-3" style={{ background: STUDIO.lavender }}>
      {/* Example category names on the headers (teacher, 2026-11-06). */}
      {['Animals', 'Spelling', 'Math', 'Science'].map((c) => <span key={c} className="rounded-sm border-std border-border bg-surface font-bold text-[0.7rem] leading-tight flex items-center justify-center px-0.5">{c}</span>)}
      {Array.from({ length: 12 }, (_, i) => (
        <span key={i} className="rounded-sm border-std border-border font-display font-bold text-xs flex items-center justify-center" style={{ background: STUDIO.butter }}>{(Math.floor(i / 4) + 1) * 100}</span>
      ))}
    </span>
  );
}
