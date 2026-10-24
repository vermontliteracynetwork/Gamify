import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowFatDown } from '@phosphor-icons/react';
import { useMySets } from '../../data/hooks';
import { LIBRARY } from '../../data/library';
import { playEffect } from '../../engine/feedback';
import ResultsModal from '../../engine/ResultsModal';
import { TEAM_ICONS } from '../../engine/TeamBadge';
import TeamSetup from '../../engine/TeamSetup';
import { TEAM_COLORS, type CpuLevel, type TurnPlayer } from '../../engine/turns';
import { useAsk } from '../../engine/useAsk';
import { t } from '../../i18n';
import { GameTopRow, SettingsPanel } from '../../settings/SettingsPanel';
import { useSettings } from '../../settings/SettingsContext';
import type { GameManifest } from '../types';
import { pieceColor } from '../../theme/library';
import { ThemedPage, ThemePicker, useGameTheme } from '../../theme/useGameTheme';

import { COLS, cpuMove, drop, emptyBoard, isFull, winningLine, type Board } from './board';

export const fourInARowManifest: GameManifest = {
  id: 'four-in-a-row',
  name: 'Four in a Row',
  description: 'Answer a question, then drop your piece. Get four in a row to win!',
  modes: ['versus'],
  questionKinds: ['mc'],
  themePieces: [
    { id: 'background', label: 'Background', width: 1600, height: 1200, hint: 'Behind the board' },
    { id: 'board', label: 'Board', width: 1000, height: 860, hint: 'The frame with holes' },
    { id: 'piece-1', label: 'Player 1 piece', width: 128, height: 128, hint: 'The first player\'s round piece' },
    { id: 'piece-2', label: 'Player 2 piece', width: 128, height: 128, hint: 'The second player\'s round piece' },
    { id: 'cover', label: 'Cover', width: 600, height: 600, hint: 'The picture on the game card' },
  ],
  hasCpu: true,
};

type Phase = 'setup' | 'play' | 'end';

export default function FourInARow() {
  const { settings } = useSettings();
  const { theme, themes, playable, choose } = useGameTheme('four-in-a-row');
  const still = settings.motion === 'still';
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const [setId, setSetId] = useState(LIBRARY[0].id);
  const pool = useMemo(() => sets.filter((s) => s.id === setId).map((set) => ({ set, starred: false })), [sets, setId]);
  const { ask, element, missed } = useAsk({ gameId: 'four-in-a-row', mode: 'versus', pool });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('setup');
  const [players, setPlayers] = useState<TurnPlayer[]>([]);
  const [level, setLevel] = useState<CpuLevel>('medium');
  const [board, setBoard] = useState<Board>(emptyBoard);
  const [turn, setTurn] = useState<0 | 1>(0);
  const [step, setStep] = useState<'answer' | 'pick' | 'dropping'>('answer');
  const [last, setLast] = useState<{ row: number; col: number } | null>(null);
  const [line, setLine] = useState<[number, number][] | null>(null);
  const [rights, setRights] = useState([0, 0]);

  const player = players[turn];

  function begin(ps: TurnPlayer[], lvl: CpuLevel) {
    setPlayers(ps.slice(0, 2)); setLevel(lvl); setBoard(emptyBoard()); setTurn(0); setLast(null); setLine(null); setRights([0, 0]);
    setStep('answer'); setPhase('play');
  }

  // Each human turn starts with that player's question; the computer just moves.
  useEffect(() => {
    if (phase !== 'play' || step !== 'answer' || !player) return;
    let live = true;
    if (player.kind === 'cpu') {
      const timer = window.setTimeout(() => { if (live) place(cpuMove(board, (turn + 1) as 1 | 2, level)); }, 900);
      return () => { live = false; window.clearTimeout(timer); };
    }
    void ask({ player: player.name }).then((ok) => {
      if (!live) return;
      if (!ok) { setPhase('setup'); return; }
      setRights((r) => r.map((n, i) => (i === turn ? n + 1 : n)));
      setStep('pick');
    });
    return () => { live = false; };
  }, [phase, step, turn]); // eslint-disable-line react-hooks/exhaustive-deps

  function place(col: number) {
    const res = drop(board, col, (turn + 1) as 1 | 2);
    if (!res) return;
    setStep('dropping');
    setBoard(res.board);
    setLast({ row: res.row, col });
    playEffect('tap', settings);
    window.setTimeout(() => {
      const win = winningLine(res.board);
      if (win || isFull(res.board)) {
        setLine(win);
        setPhase('end');
        playEffect('win', settings);
        if (win && settings.celebrations !== 'off' && !still) void confetti({ particleCount: settings.celebrations === 'big' ? 140 : 50, spread: 80, origin: { y: 0.5 }, disableForReducedMotion: true });
        return;
      }
      setTurn((t0) => (t0 === 0 ? 1 : 0));
      setStep('answer');
    }, still ? 150 : 650);
  }

  const winner = line ? players[board[line[0][0]][line[0][1]] - 1] : null;
  const Disc = ({ who, size = '82%' }: { who: 1 | 2; size?: string }) => {
    const p = players[who - 1];
    const Icon = TEAM_ICONS[(p?.colorIndex ?? who - 1) % TEAM_ICONS.length];
    return (
      <span className="rounded-full border-[2.5px] border-border flex items-center justify-center" style={{ width: size, height: size, background: pieceColor(theme, `piece-${who}`, TEAM_COLORS[p?.colorIndex ?? 0]) }}>
        <Icon weight="fill" className="w-1/2 h-1/2" color="#241c3d" aria-hidden="true" />
      </span>
    );
  };

  return (
    <ThemedPage theme={theme}>
    <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-6">
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context="four-in-a-row" />
      <GameTopRow onSettings={() => setSettingsOpen(true)}>
        <h1 className="title-bubble text-3xl sm:text-4xl">{t('fr.title')}</h1>
      </GameTopRow>

      {phase === 'setup' && (
        <div className="grid gap-4">
          <p className="font-bold text-center stage-text">{t('fr.description')}</p>
          <label className="grid gap-1 font-bold max-w-lg mx-auto w-full stage-text">
            {t('practice.set')}
            <select id="fr-set" value={setId} onChange={(e) => setSetId(e.target.value)} className="min-h-12 px-3 rounded-input border-[2px] border-border bg-surface font-bold">
              {sets.map((s) => <option key={s.id} value={s.id}>{s.name || t('sets.untitled')}</option>)}
            </select>
          </label>
          <ThemePicker current={theme} themes={themes} playable={playable} onChoose={choose} />
          <TeamSetup mode="versus" min={2} max={2} onStart={begin} />
        </div>
      )}

      {phase !== 'setup' && (
        <div className="grid gap-4 justify-items-center">
          <div className="flex items-center gap-3 bg-surface border-[2.5px] border-border rounded-panel px-4 py-3 w-full max-w-xl" style={{ boxShadow: 'var(--shadow-sticker)' }} aria-live="polite">
            {phase === 'play' && player && (
              <>
                <Disc who={(turn + 1) as 1 | 2} size="44px" />
                <span className="font-display text-xl sm:text-2xl font-bold">
                  {player.kind === 'cpu' ? t('fr.cpuThinking') : step === 'pick' ? t('fr.pick', { name: player.name }) : t('fr.answerFirst', { name: player.name })}
                </span>
              </>
            )}
            {phase === 'end' && (
              <span className="font-display text-2xl font-bold">{winner ? t('fr.wins', { name: winner.name }) : t('fr.draw')}</span>
            )}
          </div>

          <div className="border-[3px] border-border rounded-panel p-2 sm:p-3 w-full" style={{ background: pieceColor(theme, 'board', '#a8d8f0'), maxWidth: 'min(100%, calc((100dvh - 340px) * 7 / 6), 640px)', boxShadow: 'var(--shadow-sticker-lg)' }}>
            <div className="grid gap-1.5 mb-1.5" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
              {Array.from({ length: COLS }, (_, c) => {
                const full = board[0][c] !== 0;
                const canPick = phase === 'play' && step === 'pick' && player?.kind !== 'cpu' && !full;
                return (
                  <button key={c} type="button" disabled={!canPick} onClick={() => place(c)}
                    aria-label={full ? t('fr.columnFull', { n: c + 1 }) : t('fr.column', { n: c + 1 })}
                    className={`min-h-11 rounded-input flex items-center justify-center ${canPick ? 'bg-accent border-[2px] border-border motion-safe:animate-pulse' : 'opacity-0'}`}>
                    <ArrowFatDown weight="fill" size={22} aria-hidden="true" />
                  </button>
                );
              })}
            </div>
            <div role="grid" aria-label={t('fr.title')} className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
              {board.map((row, r) => row.map((cell, c) => {
                const inLine = line?.some(([lr, lc]) => lr === r && lc === c);
                const isLast = last?.row === r && last?.col === c;
                return (
                  <div key={`${r}-${c}`} role="gridcell"
                    aria-label={t('fr.cell', { row: r + 1, col: c + 1, who: cell ? players[cell - 1]?.name ?? '' : t('fr.empty') })}
                    onClick={() => phase === 'play' && step === 'pick' && player?.kind !== 'cpu' && board[0][c] === 0 && place(c)}
                    className={`aspect-square rounded-full bg-surface border-[2.5px] border-border flex items-center justify-center overflow-hidden ${inLine ? 'ring-4 ring-accent' : ''}`}>
                    {cell !== 0 && (
                      <motion.span key={`${r}-${c}-${cell}`} className="w-full h-full flex items-center justify-center"
                        initial={isLast && !still ? { y: `-${(r + 1) * 115}%` } : false} animate={{ y: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
                        <Disc who={cell} />
                      </motion.span>
                    )}
                  </div>
                );
              }))}
            </div>
          </div>

          {phase === 'end' && (
            <ResultsModal title={winner ? t('fr.wins', { name: winner.name }) : t('fr.draw')} missed={missed} againLabel={t('fr.rematch')} onAgain={() => begin(players, level)}>
              <p className="font-display text-xl font-bold">{t('fr.goodGame')}</p>
              <ul className="font-bold">{players.map((p, i) => p.kind !== 'cpu' && <li key={p.id}>{t('fr.rights', { name: p.name, count: rights[i] })}</li>)}</ul>
            </ResultsModal>
          )}
        </div>
      )}
      {element}
    </main>
    </ThemedPage>
  );
}
