import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { makeGameCode } from '../../data/gameCodes';
import { openVersus, type VersusLink } from '../../live/versus';
import { getSession } from '../../student/session';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowFatDown, Question, Trophy } from '@phosphor-icons/react';
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
import { ChoiceRow, Slider } from '../../ui/fields';
import GameWelcome from '../GameWelcome';
import SetPicker from '../SetPicker';
import SetupWizard from '../SetupWizard';
import { fourInARowManifest } from './manifest';
import { useSavedSetup } from '../useSavedSetup';
import { useGamePool } from '../../student/session';
import { pieceFill, pieceImage } from '../../theme/library';
import { ThemedPage, useGameTheme } from '../../theme/useGameTheme';
import ThemeScreen from '../ThemeScreen';

import { COLS, cpuMove, drop, emptyBoard, isFull, winningLine, type Board } from './board';
import Title from '../../ui/Title';


type Phase = 'welcome' | 'theme' | 'setup' | 'waiting' | 'joining' | 'play' | 'end';
type First = 'p1' | 'p2' | 'random';

export default function FourInARow() {
  const { settings } = useSettings();
  const { theme, themes, playable, choose } = useGameTheme('four-in-a-row');
  const still = settings.motion === 'still';
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const [setup, change] = useSavedSetup('four-in-a-row', { setId: LIBRARY[0].id, first: 'p1' as First, perTurn: 1, where: 'here' as 'here' | 'other' });
  const setId = sets.some((s) => s.id === setup.setId) ? setup.setId : LIBRARY[0].id;
  const [team, setTeam] = useState<{ players: TurnPlayer[]; level: CpuLevel }>({ players: [], level: 'medium' });
  const pool = useMemo(() => sets.filter((s) => s.id === setId).map((set) => ({ set, starred: false })), [sets, setId]);
  const game = useGamePool(pool);
  const { ask, element, missed } = useAsk({ gameId: 'four-in-a-row', mode: 'versus', pool: game.pool, classroomId: game.classroomId, studentId: game.studentId });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('welcome');
  const [players, setPlayers] = useState<TurnPlayer[]>([]);
  const [level, setLevel] = useState<CpuLevel>('medium');
  const [board, setBoard] = useState<Board>(emptyBoard);
  const [turn, setTurn] = useState<0 | 1>(0);
  const [step, setStep] = useState<'answer' | 'pick' | 'dropping'>('answer');
  const [last, setLast] = useState<{ row: number; col: number } | null>(null);
  const [line, setLine] = useState<[number, number][] | null>(null);
  const [rights, setRights] = useState([0, 0]);
  // Two devices: which seat plays on the other device, and the shared code.
  const [search] = useSearchParams();
  // A pair from the live lobby: seat 1 joins the pair's code, seat 0 hosts it.
  const pair = search.get('pair');
  const guestCode = search.get('versus') ?? (pair && search.get('seat') === '1' ? pair : null);
  const [remoteSeat, setRemoteSeat] = useState<0 | 1 | null>(null);
  const [hostCode, setHostCode] = useState('');
  const link = useRef<VersusLink | null>(null);
  const placeRef = useRef<(col: number) => void>(() => undefined);

  const player = players[turn];
  const remoteTurn = remoteSeat !== null && turn === remoteSeat;
  const remotePlayer = (name: string, colorIndex: number): TurnPlayer => ({ id: `remote-${colorIndex}`, name, kind: 'student', colorIndex, score: 0 });

  // The friend's device: join the host's game straight from the code.
  useEffect(() => {
    if (!guestCode) return;
    setPhase('joining');
    const l = openVersus(guestCode);
    link.current = l;
    const me = getSession()?.name || t('fr.friend');
    const off = l.listen((m) => {
      if (m.t === 'vstart') { setRemoteSeat(0); begin([remotePlayer(m.names[0], 0), remotePlayer(m.names[1], 1)].map((p, i) => (i === 1 ? { ...p, id: 'me' } : p)), 'medium', m.first); }
      if (m.t === 'vmove' && m.seat === 0) placeRef.current(m.col);
    });
    l.send({ t: 'vjoin', name: me });
    const again = window.setInterval(() => l.send({ t: 'vjoin', name: me }), 2000);
    const stop = l.listen((m) => { if (m.t === 'vstart') window.clearInterval(again); });
    return () => { off(); stop(); window.clearInterval(again); l.close(); };
  }, [guestCode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (pair && search.get('seat') === '0') void hostTwoDevices(pair); }, [pair]); // eslint-disable-line react-hooks/exhaustive-deps

  async function hostTwoDevices(pairCode?: string) {
    const code = pairCode ?? (await makeGameCode('four-in-a-row', setId, 'versus')).code;
    setHostCode(code);
    setPhase('waiting');
    link.current?.close();
    const l = openVersus(code);
    link.current = l;
    let started = false;
    l.listen((m) => {
      if (m.t === 'vjoin' && !started) {
        started = true;
        const host = pairCode ? remotePlayer(getSession()?.name || t('fr.player1'), 0) : team.players[0] ?? remotePlayer(t('fr.player1'), 0);
        const first: 0 | 1 = setup.first === 'p2' ? 1 : setup.first === 'random' ? (Math.random() < 0.5 ? 0 : 1) : 0;
        l.send({ t: 'vstart', names: [host.name, m.name], first });
        setRemoteSeat(1);
        begin([host, remotePlayer(m.name, 1)], team.level, first);
      }
      if (m.t === 'vmove' && m.seat === 1) placeRef.current(m.col);
    });
  }
  useEffect(() => () => link.current?.close(), []);

  function begin(ps: TurnPlayer[], lvl: CpuLevel, forced?: 0 | 1) {
    const first: 0 | 1 = forced ?? (setup.first === 'p2' ? 1 : setup.first === 'random' ? (Math.random() < 0.5 ? 0 : 1) : 0);
    setPlayers(ps.slice(0, 2)); setLevel(lvl); setBoard(emptyBoard()); setTurn(first); setLast(null); setLine(null); setRights([0, 0]);
    setStep('answer'); setPhase('play');
  }

  // Each human turn starts with that player's question; the computer just moves.
  useEffect(() => {
    if (phase !== 'play' || step !== 'answer' || !player) return;
    if (remoteTurn) return; // the other device asks its own player
    let live = true;
    if (player.kind === 'cpu') {
      const timer = window.setTimeout(() => { if (live) place(cpuMove(board, (turn + 1) as 1 | 2, level)); }, 900);
      return () => { live = false; window.clearTimeout(timer); };
    }
    void ask({ player: player.name, count: setup.perTurn }).then((ok) => {
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
    if (remoteSeat !== null && !remoteTurn) link.current?.send({ t: 'vmove', seat: turn, col });
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

  placeRef.current = place;
  const winner = line ? players[board[line[0][0]][line[0][1]] - 1] : null;
  const Disc = ({ who, size = '82%' }: { who: 1 | 2; size?: string }) => {
    const p = players[who - 1];
    const Icon = TEAM_ICONS[(p?.colorIndex ?? who - 1) % TEAM_ICONS.length];
    return (
      <span className="rounded-full border-[2.5px] border-border flex items-center justify-center" style={{ width: size, height: size, ...pieceFill(theme, `piece-${who}`, TEAM_COLORS[p?.colorIndex ?? 0]) }}>
        {!pieceImage(theme, `piece-${who}`) && <Icon weight="fill" className="w-1/2 h-1/2" color="#241c3d" aria-hidden="true" />}
      </span>
    );
  };

  return (
    <ThemedPage theme={theme}>
    <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-6">
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context="four-in-a-row" />
      <GameTopRow onSettings={() => setSettingsOpen(true)}>
        {(phase === 'play' || phase === 'end') && <h1 className="title-bubble text-3xl sm:text-4xl"><Title text={t('fr.title')} /></h1>}
      </GameTopRow>

      {phase === 'welcome' && (
        <GameWelcome game={fourInARowManifest} cover={pieceImage(theme, 'cover')} onStart={() => setPhase('theme')} steps={[
          { icon: <Question weight="bold" size={22} />, text: t('fr.how1') },
          { icon: <ArrowFatDown weight="fill" size={22} />, text: t('fr.how2') },
          { icon: <Trophy weight="fill" size={22} />, text: t('fr.how3') },
        ]} />
      )}

      {phase === 'theme' && (
        <ThemeScreen gameName={fourInARowManifest.name} current={theme} themes={themes} playable={playable} onChoose={choose} onBack={() => setPhase('welcome')} onNext={() => setPhase('setup')} />
      )}

      {phase === 'setup' && (
        <SetupWizard onBack={() => setPhase('theme')} onPlay={() => (setup.where === 'other' ? void hostTwoDevices() : begin(team.players, team.level))} pages={[
          { id: 'players', title: t('setup.players'), ready: team.players.length === 2 && team.players.every((p) => p.name.trim()), content: (
            <TeamSetup mode="versus" min={2} max={2} embedded onChange={(players, level) => setTeam({ players, level })} />
          ) },
          ...(game.assigned ? [] : [{ id: 'questions', title: t('setup.questions'), content: <SetPicker sets={sets} value={[setId]} onChange={(ids) => change({ setId: ids[0] })} /> }]),
          { id: 'options', title: t('setup.options'), content: (
            <>
              <ChoiceRow label={t('fr.where')} value={setup.where} onChange={(v) => change({ where: v })}
                options={[{ value: 'here', label: t('fr.where.here') }, { value: 'other', label: t('fr.where.other') }]} />
              <ChoiceRow label={t('fr.first')} value={setup.first} onChange={(v) => change({ first: v })}
                options={[{ value: 'p1', label: t('fr.first.p1') }, { value: 'p2', label: t('fr.first.p2') }, { value: 'random', label: t('fr.first.random') }]} />
              <Slider label={t('fr.perTurn')} min={1} max={3} value={setup.perTurn} onChange={(v) => change({ perTurn: v })} />
            </>
          ) },
        ]} />
      )}

      {(phase === 'waiting' || phase === 'joining') && (
        <div className="grid gap-4 justify-items-center text-center bg-surface border-[2.5px] border-border rounded-panel p-6 max-w-lg mx-auto" style={{ boxShadow: 'var(--shadow-sticker-lg)' }} role="status" aria-live="polite">
          <motion.span animate={still ? undefined : { y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1.2 }}><Disc who={phase === 'waiting' ? 2 : 1} size="64px" /></motion.span>
          <h2 className="font-display text-3xl"><Title text={phase === 'waiting' ? t('fr.waitingTitle') : t('fr.joiningTitle')} /></h2>
          {phase === 'waiting' && (
            <>
              <p className="font-bold text-lg">{t('fr.waitingText', { host: window.location.host })}</p>
              <p className="font-display text-6xl tracking-[0.15em]" aria-label={t('host.codeIs', { code: hostCode })}>{hostCode}</p>
              <button type="button" onClick={() => { link.current?.close(); link.current = null; setPhase('setup'); }} className="min-h-12 px-5 rounded-pill border-[2px] border-border bg-surface-2 font-bold">{t('setup.back')}</button>
            </>
          )}
        </div>
      )}

      {(phase === 'play' || phase === 'end') && (
        <div className="grid gap-4 justify-items-center">
          <div className="flex items-center gap-3 bg-surface border-[2.5px] border-border rounded-panel px-4 py-3 w-full max-w-xl" style={{ boxShadow: 'var(--shadow-sticker)' }} aria-live="polite">
            {phase === 'play' && player && (
              <>
                <Disc who={(turn + 1) as 1 | 2} size="44px" />
                <span className="font-display text-xl sm:text-2xl font-bold">
                  {remoteTurn ? t('fr.waitingFor', { name: player.name }) : player.kind === 'cpu' ? t('fr.cpuThinking') : step === 'pick' ? t('fr.pick', { name: player.name }) : t('fr.answerFirst', { name: player.name })}
                </span>
              </>
            )}
            {phase === 'end' && (
              <span className="font-display text-2xl font-bold">{winner ? t('fr.wins', { name: winner.name }) : t('fr.draw')}</span>
            )}
          </div>

          <div className="border-[3px] border-border rounded-panel p-2 sm:p-3 w-full" style={{ ...pieceFill(theme, 'board', '#a8d8f0'), maxWidth: 'min(100%, calc((100dvh - 20.5rem + var(--chrome-save, 0rem)) * 7 / 6), 40rem)', boxShadow: 'var(--shadow-sticker-lg)' }}>
            <div className="grid gap-1.5 mb-1.5" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
              {Array.from({ length: COLS }, (_, c) => {
                const full = board[0][c] !== 0;
                const canPick = phase === 'play' && step === 'pick' && player?.kind !== 'cpu' && !remoteTurn && !full;
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
              {board.map((row, r) => <div key={r} role="row" className="contents">{row.map((cell, c) => {
                const inLine = line?.some(([lr, lc]) => lr === r && lc === c);
                const isLast = last?.row === r && last?.col === c;
                return (
                  <div key={`${r}-${c}`} role="gridcell"
                    aria-label={t('fr.cell', { row: r + 1, col: c + 1, who: cell ? players[cell - 1]?.name ?? '' : t('fr.empty') })}
                    onClick={() => phase === 'play' && step === 'pick' && player?.kind !== 'cpu' && !remoteTurn && board[0][c] === 0 && place(c)}
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
              })}</div>)}
            </div>
          </div>

          {phase === 'end' && (
            <ResultsModal title={winner ? t('fr.wins', { name: winner.name }) : t('fr.draw')} missed={missed} againLabel={t('share.again')} onAgain={() => setPhase('welcome')}>
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
