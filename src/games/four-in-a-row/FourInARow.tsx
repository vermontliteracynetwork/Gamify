import { useEffect, useMemo, useRef, useState } from 'react';
import { pace } from '../../engine/pace';
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
import ScoreBoard from '../../engine/ScoreBoard';
import ResultsModal from '../../engine/ResultsModal';
import { TEAM_ICONS } from '../../engine/TeamBadge';
import TeamSetup from '../../engine/TeamSetup';
import { TEAM_COLORS, type CpuLevel, type TurnPlayer } from '../../engine/turns';
import { useAsk } from '../../engine/useAsk';
import { t } from '../../i18n';
import { BALL_PACK, BALL_PACK_CLEARED } from '../../config';
import type { StringKey } from '../../i18n/en';
import { AccessButton, FullScreenButton, GameTopRow, GearButton, SettingsPanel } from '../../settings/SettingsPanel';
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

import { COLS, cpuMove, drop, emptyBoard, isFull, popBottom, ROWS, winningLine, type Board } from './board';
import { usePowerUps } from '../../engine/usePowerUps';
import { powerUpSwitches } from '../../engine/PowerUpSwitches';
import { PowerUpTray, useHeldPowerUps } from '../../engine/HeldPowerUps';
import Title from '../../ui/Title';


type Phase = 'welcome' | 'theme' | 'setup' | 'waiting' | 'joining' | 'play' | 'end';
type First = 'p1' | 'p2' | 'random';

export default function FourInARow() {
  const { settings } = useSettings();
  const { theme, themes, playable, choose } = useGameTheme('four-in-a-row');
  const still = settings.motion === 'still';
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const [setup, change] = useSavedSetup('four-in-a-row', { setId: LIBRARY[0].id, first: 'p1' as First, perTurn: 1, where: 'here' as 'here' | 'other', powerUps: true, powerOff: [] as string[] });
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
  const [step, setStep] = useState<'answer' | 'pick' | 'dropping' | 'pop'>('answer');
  // Power-ups on one device (two devices keep the plain game, so moves stay in step).
  const powers = usePowerUps(fourInARowManifest, theme, setup.powerUps, setup.powerOff ?? []);
  const held = useHeldPowerUps();
  const extraDrop = useRef(false);
  const [popped, setPopped] = useState<{ col: number; id: number } | null>(null);
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
  // Pieces players choose before play (teacher, 2026-10-31): a theme's set
  // (Animal Friends: ten animals), or the Ball Collection in Classic.
  const discs = theme.discs?.length ? theme.discs : BALL_PACK_CLEARED ? BALL_PACK.map((id) => ({ id, name: t(`fr.ball.${id}` as StringKey), image: `/classic/four-in-a-row/${id}.webp` })) : [];
  const [picks, setPicks] = useState<[number, number]>([0, 1]);
  useEffect(() => setPicks([0, 1]), [theme.id]);

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
    held.reset(); extraDrop.current = false; setPlayers(ps.slice(0, 2)); setLevel(lvl); setBoard(emptyBoard()); setTurn(first); setLast(null); setLine(null); setRights([0, 0]);
    setStep('answer'); setPhase('play');
  }

  // Each human turn starts with that player's question; the computer just moves.
  useEffect(() => {
    if (phase !== 'play' || step !== 'answer' || !player) return;
    held.beginTurn(player.id);
    if (remoteTurn) return; // the other device asks its own player
    let live = true;
    if (player.kind === 'cpu') {
      // The computer takes its time (5 to 8 seconds, teacher 2026-11-07): its
      // piece wanders over the columns, settles on its pick, then drops.
      const target = cpuMove(board, (turn + 1) as 1 | 2, level);
      const wait = (5000 + Math.random() * 3000) * pace(settings);
      const settle = window.setTimeout(() => { if (live) { pointedAt.current = Date.now(); setHeldCol(target); } }, wait - 1200);
      const timer = window.setTimeout(() => { if (live) place(target); }, wait);
      return () => { live = false; window.clearTimeout(timer); window.clearTimeout(settle); };
    }
    void ask({ player: player.name, count: setup.perTurn, turn: { player, avatar: discs.length >= 2 ? discs[picks[turn]]?.image : pieceImage(theme, `piece-${turn + 1}`) } }).then((ok) => {
      if (!live) return;
      if (!ok) { setPhase('setup'); return; }
      setRights((r) => r.map((n, i) => (i === turn ? n + 1 : n)));
      if (remoteSeat === null) { const it = powers.grant(true); if (it) held.earn(player.id, it); }
      setStep('pick');
    });
    return () => { live = false; };
  }, [phase, step, turn]); // eslint-disable-line react-hooks/exhaustive-deps

  function useItem(i: number) {
    const it = held.use(i);
    if (!it) return;
    playEffect('win', settings);
    if (it.ability === 'double') extraDrop.current = true;
    if (it.ability === 'pop') setStep('pop');
  }
  function popOut(col: number) {
    const next = popBottom(board, col);
    if (!next) return;
    setBoard(next); setLast(null); setPopped({ col, id: Date.now() });
    playEffect('whoosh', settings);
    const win = winningLine(next);
    if (win) { setLine(win); setPhase('end'); playEffect('win', settings); return; }
    setStep('pick');
  }

  function place(col: number) {
    if (step === 'pop') { popOut(col); return; }
    const res = drop(board, col, (turn + 1) as 1 | 2);
    if (!res) return;
    if (remoteSeat !== null && !remoteTurn) link.current?.send({ t: 'vmove', seat: turn, col });
    setStep('dropping');
    setBoard(res.board);
    setLast({ row: res.row, col });
    // The clack when it lands at the bottom of its drop.
    window.setTimeout(() => { playEffect('tap', settings); if (!still) navigator.vibrate?.(15); }, still ? 0 : (0.32 + res.row * 0.06) * 580);
    window.setTimeout(() => {
      const win = winningLine(res.board);
      if (win || isFull(res.board)) {
        setLine(win);
        setPhase('end');
        playEffect('win', settings);
        if (win && settings.celebrations !== 'off' && !still) void confetti({ particleCount: settings.celebrations === 'big' ? 140 : 50, spread: 80, origin: { y: 0.5 }, disableForReducedMotion: true });
        return;
      }
      // Double drop: the same player drops again right away.
      if (extraDrop.current) { extraDrop.current = false; setStep('pick'); return; }
      held.endTurn();
      setTurn((t0) => (t0 === 0 ? 1 : 0));
      setStep('answer');
    }, still ? 150 : 650);
  }

  placeRef.current = place;
  // The front plate's color (a theme can change it).
  const plate = pieceImage(theme, 'board') ? 'rgba(255,255,255,0.12)' : (pieceFill(theme, 'board', '#4f8fe0').background as string) ?? '#4f8fe0';
  const winner = line ? players[board[line[0][0]][line[0][1]] - 1] : null;
  // The held piece wanders across the columns until the player points at
  // one, as if moving it along before choosing (teacher, 2026-11-06).
  const anyPick = phase === 'play' && (step === 'pick' || step === 'pop') && player?.kind !== 'cpu' && !remoteTurn;
  const showHeld = phase === 'play' && !remoteTurn && (anyPick || (player?.kind === 'cpu' && step === 'answer'));
  const [heldCol, setHeldCol] = useState(3);
  const pointedAt = useRef(0);
  const hoverCol = (c: number) => { pointedAt.current = Date.now(); setHeldCol(c); };
  useEffect(() => {
    if (!showHeld || settings.motion === 'still') return;
    const id = window.setInterval(() => {
      if (Date.now() - pointedAt.current < 2500) return;
      setHeldCol((c) => Math.max(0, Math.min(COLS - 1, c + (Math.random() < 0.5 ? -1 : 1) * (c === 0 ? -1 : c === COLS - 1 ? -1 : 1))));
    }, 650);
    return () => window.clearInterval(id);
  }, [showHeld, settings.motion]);
  const Disc = ({ who, size = '82%' }: { who: 1 | 2; size?: string }) => {
    const p = players[who - 1];
    const Icon = TEAM_ICONS[(p?.colorIndex ?? who - 1) % TEAM_ICONS.length];
    return (
      discs.length >= 2 ? (
        // The whole piece shows, never cropped to a circle (teacher, 2026-11-06).
        <span className="flex items-center justify-center" style={{ width: size, height: size }}>
          <img src={discs[picks[who - 1]]?.image} alt="" className="w-full h-full object-contain" draggable="false" />
        </span>
      ) :
      <span className="rounded-full border-[2.5px] border-border flex items-center justify-center" style={{ width: size, height: size, ...pieceFill(theme, `piece-${who}`, TEAM_COLORS[p?.colorIndex ?? 0]) }}>
        {!pieceImage(theme, `piece-${who}`) && <Icon weight="fill" className="w-1/2 h-1/2" color="#241c3d" aria-hidden="true" />}
      </span>
    );
  };

  return (
    <ThemedPage theme={theme} menu={phase !== 'play' && phase !== 'end'}>
    <main className={phase === 'play' || phase === 'end' ? '!p-0 [--fr-extra:8rem] lg:[--fr-extra:0rem]' : 'w-full px-4 sm:px-6 pt-6 pb-6'}>
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context="four-in-a-row" />
      {phase !== 'play' && phase !== 'end' && <GameTopRow onSettings={() => setSettingsOpen(true)} />}

      {phase === 'welcome' && (
        <GameWelcome game={fourInARowManifest} cover={pieceImage(theme, 'cover')} onStart={() => setPhase(themes.length > 1 ? 'theme' : 'setup')} steps={[
          { icon: <Question weight="bold" size={22} />, text: t('fr.how1') },
          { icon: <ArrowFatDown weight="fill" size={22} />, text: t('fr.how2') },
          { icon: <Trophy weight="fill" size={22} />, text: t('fr.how3') },
        ]} />
      )}

      {phase === 'theme' && (
        <ThemeScreen gameName={fourInARowManifest.name} current={theme} themes={themes} playable={playable} onChoose={choose} onBack={() => setPhase('welcome')} onNext={() => setPhase('setup')} />
      )}

      {phase === 'setup' && (
        <SetupWizard onBack={() => setPhase(themes.length > 1 ? 'theme' : 'welcome')} onPlay={() => (setup.where === 'other' && team.players[1]?.kind !== 'cpu' ? void hostTwoDevices() : begin(team.players, team.level))} pages={[
          { id: 'players', title: t('setup.players'), ready: team.players.length === 2 && team.players.every((p) => p.name.trim()), content: (
            // Each player's team picture is their piece (teacher, 2026-11-06):
            // one picture, picked on the player card, the same on the board.
            <TeamSetup key={theme.id} mode="versus" min={2} max={2} embedded characters={discs.length >= 2 ? discs : undefined}
              onChange={(players, level) => {
                setTeam({ players, level });
                if (discs.length >= 2) {
                  const idx = players.slice(0, 2).map((p) => Math.max(0, discs.findIndex((d) => d.image === p.art)));
                  if (idx.length === 2 && idx[0] !== idx[1]) setPicks([idx[0], idx[1]]);
                }
              }} />
          ) },
          ...(game.assigned ? [] : [{ id: 'questions', title: t('setup.questions'), content: <SetPicker sets={sets} value={[setId]} onChange={(ids) => change({ setId: ids[0] })} /> }]),
          { id: 'options', title: t('setup.options'), content: (
            <>
              {team.players[1]?.kind !== 'cpu' && <ChoiceRow label={t('fr.where')} value={setup.where} onChange={(v) => change({ where: v })}
                options={[{ value: 'here', label: t('fr.where.here') }, { value: 'other', label: t('fr.where.other') }]} />}
              <ChoiceRow label={t('fr.first')} value={setup.first} onChange={(v) => change({ first: v })}
                options={[{ value: 'p1', label: t('fr.first.p1') }, { value: 'p2', label: t('fr.first.p2') }, { value: 'random', label: t('fr.first.random') }]} />
              <Slider label={t('fr.perTurn')} hint={t('fr.perTurnHint')} min={1} max={3} value={setup.perTurn} onChange={(v) => change({ perTurn: v })} />
              {powerUpSwitches({ manifest: fourInARowManifest, theme, on: setup.powerUps, off: setup.powerOff ?? [], change })}
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
        // Same layout as every team game (teacher, 2026-10-31): the board, and
        // the players beside it with a glow on whose turn it is.
        // The board fills the play space and never scrolls (teacher, 2026-10-31);
        // small controls on top, the players right beside it, top aligned.
        <div className="relative play-fill grid grid-cols-[minmax(0,1fr)] content-center gap-3 px-3 py-3 lg:flex lg:justify-center lg:items-center">
          <h1 className="sr-only"><Title text={t('fr.title')} /></h1>
          <div className="absolute top-3 right-3 flex items-center gap-2 z-10 [&_button]:!w-11 [&_button]:!h-11">
            <FullScreenButton small />
            <AccessButton small />
            <GearButton small onClick={() => setSettingsOpen(true)} />
          </div>
          <div className="contents lg:flex lg:items-start lg:gap-4">
          <div className="grid grid-cols-[minmax(0,1fr)] gap-2 min-w-0 justify-items-center">
          <div className="border-[3px] border-border rounded-panel p-2 sm:p-3 w-full" style={{ ...pieceFill(theme, 'board', '#4f8fe0'), maxWidth: 'min(100%, calc(100vw - 1.5rem), calc((var(--play-h) - 2.5rem - var(--fr-extra)) * 7 / 7.3))', width: 'calc((var(--play-h) - 2.5rem - var(--fr-extra)) * 7 / 7.3)', boxShadow: 'var(--shadow-sticker-lg)' }}>
            <div className="grid gap-1.5 mb-1.5 mt-[min(2.4vw,1.4rem)]" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
              {Array.from({ length: COLS }, (_, c) => {
                const popping = step === 'pop';
                const full = popping ? board[ROWS - 1][c] === 0 : board[0][c] !== 0;
                const canPick = phase === 'play' && (step === 'pick' || popping) && player?.kind !== 'cpu' && !remoteTurn && !full;
                const holding = showHeld && heldCol === c;
                return (
                  <button key={c} type="button" disabled={!canPick} onClick={() => place(c)}
                    onMouseEnter={() => anyPick && hoverCol(c)} onFocus={() => anyPick && hoverCol(c)}
                    aria-label={popping ? t('fr.popColumn', { n: c + 1 }) : full ? t('fr.columnFull', { n: c + 1 }) : t('fr.column', { n: c + 1 })}
                    className={`relative isolate h-[min(7vw,4.6rem)] min-h-14 rounded-input flex items-end justify-center pb-1.5 font-display text-xl border-[2px] border-border ${canPick ? 'bg-accent tile-wiggle motion-safe:hover:-translate-y-1 motion-safe:active:scale-95 motion-safe:transition-transform' : 'bg-surface/60 opacity-70'}`}>
                    {/* The player's piece peeks out above the numbers and slides
                        across the columns, then drops (teacher, 2026-11-06). */}
                    {holding && player && (
                      <motion.span layoutId="fr-held" transition={{ type: 'spring', stiffness: 420, damping: 30 }} aria-hidden="true"
                        className="absolute left-1/2 -translate-x-1/2 bottom-[58%] w-[78%] aspect-square -z-10 flex items-end justify-center pointer-events-none">
                        <Disc who={(turn + 1) as 1 | 2} size="100%" />
                      </motion.span>
                    )}
                    <span className="relative">{c + 1}</span>
                  </button>
                );
              })}
            </div>
            {/* The board (Golden Rule pass, 2026-10-31): discs sit behind a front
                plate with round holes, drop with gravity and a bounce, and land
                with a clack. The winning four glow and a light sweeps across them. */}
            <div className="relative w-full" style={{ aspectRatio: `${COLS} / ${ROWS}` }}>
              <div role="grid" aria-label={t('fr.title')} className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))` }}>
                {board.map((row, r) => <div key={r} role="row" className="contents">{row.map((cell, c) => (
                  <div key={`${r}-${c}`} role="gridcell"
                    aria-label={t('fr.cell', { row: r + 1, col: c + 1, who: cell ? players[cell - 1]?.name ?? '' : t('fr.empty') })}
                    onClick={() => phase === 'play' && step === 'pick' && player?.kind !== 'cpu' && !remoteTurn && board[0][c] === 0 && place(c)}
                    className="flex items-center justify-center">
                    <span className="w-[84%] h-[84%] rounded-full" style={{ background: 'radial-gradient(circle at 50% 35%, #f4f7ff, #dfe6f7 70%, #c3cde6)' }} />
                  </div>
                ))}</div>)}
              </div>
              {/* The plate: color with a hole cut for every slot, and a rim. Placed
                  pieces sit in front of it so no piece is ever cropped (teacher, 2026-11-06). */}
              <div className="absolute inset-0 grid pointer-events-none" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))` }} aria-hidden="true">
                {Array.from({ length: COLS * ROWS }, (_, k) => (
                  <span key={k} className="relative" style={{ background: plate, WebkitMaskImage: 'radial-gradient(circle, transparent 41.5%, #000 42.5%)', maskImage: 'radial-gradient(circle, transparent 41.5%, #000 42.5%)' }}>
                    <span className="absolute inset-0" style={{ background: 'radial-gradient(circle, transparent 41.5%, rgba(36,28,61,0.55) 42.5%, rgba(36,28,61,0.15) 46%, transparent 49%)' }} />
                  </span>
                ))}
              </div>
              <div className="absolute inset-0 grid overflow-hidden pointer-events-none" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))` }} aria-hidden="true">
                {board.flatMap((row, r) => row.map((cell, c) => {
                  const isLast = last?.row === r && last?.col === c;
                  const k = line ? line.findIndex(([lr, lc]) => lr === r && lc === c) : -1;
                  return (
                    <div key={`${r}-${c}`} className="flex items-center justify-center" style={{ gridRow: r + 1, gridColumn: c + 1 }}>
                      {cell !== 0 && (
                        <motion.span key={`${r}-${c}-${cell}-${popped?.col === c ? popped.id : 0}`} className={`w-[84%] h-[84%] flex items-center justify-center ${k >= 0 && !still ? 'fr-win' : ''}`} style={k >= 0 ? { animationDelay: `${k * 0.12}s` } : undefined}
                          initial={isLast && !still ? { y: `-${(r + 1) * 119}%` } : popped?.col === c && !still ? { y: '-119%' } : false}
                          animate={isLast && !still ? { y: ['-' + (r + 1) * 119 + '%', '0%', '-13%', '0%', '-4%', '0%'] } : { y: '0%' }}
                          transition={{ duration: 0.75 + r * 0.12, times: [0, 0.62, 0.75, 0.86, 0.94, 1], ease: 'easeIn' }}>
                          <Disc who={cell} size="100%" />
                        </motion.span>
                      )}
                    </div>
                  );
                }))}
              </div>
              {line && (
                <svg viewBox={`0 0 ${COLS} ${ROWS}`} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
                  <line x1={line[0][1] + 0.5} y1={line[0][0] + 0.5} x2={line[3][1] + 0.5} y2={line[3][0] + 0.5} stroke="#fdfd94" strokeWidth={0.22} strokeLinecap="round" opacity={0.9} className={still ? '' : 'fr-sweep'} />
                </svg>
              )}
            </div>
          </div>
          </div>
          <div className="order-first lg:order-none lg:w-[260px] grid gap-2 min-w-0">
            <ScoreBoard turns={{ players: players.map((p, i) => ({ ...p, score: rights[i] })), turn, round: 1, history: [] }} playing={phase === 'play'} />
            <PowerUpTray manifest={fourInARowManifest} items={held.held} onUse={useItem} disabled={step !== 'pick' || player?.kind === 'cpu' || remoteTurn} />
            {step === 'pop' && <p className="bg-accent border-[2px] border-border rounded-input px-3 py-1.5 font-bold text-center" role="status">{t('fr.popPick')}</p>}
            {phase === 'play' && (remoteTurn || player?.kind === 'cpu') && (
              <p className="bg-surface border-[2px] border-border rounded-input px-3 py-1.5 lg:py-2 font-bold text-sm text-center" role="status">{remoteTurn ? t('fr.waitingFor', { name: player!.name }) : t('fr.cpuThinking')}</p>
            )}
          </div>
          </div>

          {phase === 'end' && (
            <ResultsModal winners={winner ? [winner] : undefined} title={winner ? t('fr.wins', { name: winner.name }) : t('fr.draw')} missed={missed} againLabel={t('share.again')} onAgain={() => setPhase('welcome')}>
              <p className="font-display text-xl font-bold">{t('fr.goodGame')}</p>
              <ul className="font-bold">{players.map((p, i) => p.kind !== 'cpu' && <li key={p.id}>{t('fr.rights', { name: p.name, count: rights[i] })}</li>)}</ul>
            </ResultsModal>
          )}
        </div>
      )}
      {element}
      {powers.element}
    </main>
    </ThemedPage>
  );
}
