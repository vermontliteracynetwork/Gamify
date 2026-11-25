import { useEffect, useMemo, useRef, useState } from 'react';
import HintButton from '../../engine/HintButton';
import { impact } from '../../engine/impact';
import { pace } from '../../engine/pace';
import { useSearchParams } from 'react-router-dom';
import { makeGameCode } from '../../data/gameCodes';
import { openVersus, type VersusLink } from '../../live/versus';
import { getSession } from '../../student/session';
import { AnimatePresence, motion } from 'motion/react';
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
import { BALL_PACK, BALL_PACK_CLEARED } from '../../config';
import type { StringKey } from '../../i18n/en';
import { FullScreenButton, GameTopRow, GearButton, SettingsPanel } from '../../settings/SettingsPanel';
import CloseGameButton from '../../engine/CloseGameButton';
import { useSettings } from '../../settings/SettingsContext';
import { ChoiceRow, Slider } from '../../ui/fields';
import GameWelcome from '../GameWelcome';
import SetPicker from '../SetPicker';
import SetupWizard from '../SetupWizard';
import WayToPlay from '../WayToPlay';
import { fourInARowManifest } from './manifest';
import { useHostTeams, useSavedSetup } from '../useSavedSetup';
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
// Classic colors from the approved mockup (Brand Kit palette): Sky rack, Sky deep
// press shade, Lemon drop win line.
const SKY = '#4ba3e8', SKY_DEEP = '#1f6fb8', GOLD = '#fabe37';
// Classic's own pair (approved mockup, 2026-11-24): Grape pieces with a dot and
// Lemon pieces with a star, so the sides differ by mark as well as color
// (WCAG 1.4.1). The Ball Collection stays on the picker after them.
const CLASSIC_PAIR = ['purple-dot', 'gold-star'];

export default function FourInARow() {
  const { settings } = useSettings();
  const { theme, themes, playable, choose } = useGameTheme('four-in-a-row');
  const still = settings.motion === 'still';
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const hostTeams = useHostTeams();
  const [setup, change] = useSavedSetup('four-in-a-row', { setId: LIBRARY[0].id, first: 'p1' as First, perTurn: 1, where: 'here' as 'here' | 'other', way: 'solo' as 'share' | 'solo', powerUps: true, powerOff: [] as string[] }, hostTeams ? { way: 'share' as const } : undefined);
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
  const discs = theme.discs?.length ? theme.discs : [
    ...CLASSIC_PAIR.map((id) => ({ id, name: t(`fr.ball.${id}` as StringKey), image: `/classic/four-in-a-row/${id}.svg` })),
    ...(BALL_PACK_CLEARED ? BALL_PACK.map((id) => ({ id, name: t(`fr.ball.${id}` as StringKey), image: `/classic/four-in-a-row/${id}.webp` })) : []),
  ];
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
      // About 8 to 12 seconds at the normal (slower, 2026-11-24) pace.
      const wait = (3500 + Math.random() * 2000) * pace(settings);
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
    if (win) { setLine(win); setPhase('end'); playEffect('win', settings); impact(settings, true); return; }
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
    // The clack when it lands (62% into its fall); the turn moves on once it has settled.
    window.setTimeout(() => { playEffect('tap', settings); if (!still) navigator.vibrate?.(15); }, still ? 0 : (0.75 + res.row * 0.12) * 620);
    window.setTimeout(() => {
      const win = winningLine(res.board);
      if (win || isFull(res.board)) {
        setLine(win);
        setPhase('end');
        playEffect('win', settings);
        if (win) impact(settings, true);
        if (win && settings.celebrations !== 'off' && !still) void confetti({ particleCount: settings.celebrations === 'big' ? 140 : 50, spread: 80, origin: { y: 0.5 }, disableForReducedMotion: true });
        return;
      }
      // Double drop: the same player drops again right away.
      if (extraDrop.current) { extraDrop.current = false; setStep('pick'); return; }
      held.endTurn();
      setTurn((t0) => (t0 === 0 ? 1 : 0));
      setStep('answer');
    }, still ? 150 : (0.75 + res.row * 0.12) * 1000 + 120);
  }

  placeRef.current = place;
  const winner = line ? players[board[line[0][0]][line[0][1]] - 1] : null;
  // The gold line draws and the burst pops before the results box opens.
  const [results, setResults] = useState(false);
  useEffect(() => {
    if (phase !== 'end') { setResults(false); return; }
    const id = window.setTimeout(() => setResults(true), line && !still ? 1700 : 200);
    return () => window.clearTimeout(id);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps
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
  // The rack fills the space it is given and never scrolls (teacher, 2026-10-24):
  // one cell size `s` from the room left beside (or under) the player cards.
  const playing = phase === 'play' || phase === 'end';
  // Wide screens measure the room between the cards; tall ones measure the
  // whole stage less the cards under the rack, so rack and cards sit centered together.
  const stage = useRef<HTMLDivElement>(null), area = useRef<HTMLDivElement>(null), cards = useRef<HTMLDivElement>(null);
  const [s, setS] = useState(48);
  useEffect(() => {
    const el = area.current, out = stage.current, under = cards.current;
    if (!playing || !el || !out || !under) return;
    const fit = () => {
      let w: number, h: number;
      if (window.matchMedia('(orientation: portrait)').matches) {
        const cs = getComputedStyle(out), o = out.getBoundingClientRect();
        w = o.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        h = o.height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - (parseFloat(cs.rowGap) || 0) - under.getBoundingClientRect().height;
      } else ({ width: w, height: h } = el.getBoundingClientRect());
      setS(Math.max(18, Math.floor(Math.min(w / 7.6, h / 8.15))));
    };
    fit();
    let frame = 0;
    const ro = new ResizeObserver(() => { window.cancelAnimationFrame(frame); frame = window.requestAnimationFrame(fit); });
    [el, out, under].forEach((x) => ro.observe(x));
    return () => { ro.disconnect(); window.cancelAnimationFrame(frame); };
  }, [playing]);
  const Disc = ({ who, size = '86%' }: { who: 1 | 2; size?: string }) => {
    const p = players[who - 1];
    const Icon = TEAM_ICONS[(p?.colorIndex ?? who - 1) % TEAM_ICONS.length];
    return (
      discs.length >= 2 ? (
        // The whole piece shows, never cropped to a circle (teacher, 2026-11-06).
        <span className="flex items-center justify-center" style={{ width: size, height: size }}>
          <img src={discs[picks[who - 1]]?.image} alt="" className="w-full h-full object-contain" draggable="false" />
        </span>
      ) :
      <span className="rounded-full border-bold border-border flex items-center justify-center" style={{ width: size, height: size, ...pieceFill(theme, `piece-${who}`, TEAM_COLORS[p?.colorIndex ?? 0]) }}>
        {!pieceImage(theme, `piece-${who}`) && <Icon weight="fill" className="w-1/2 h-1/2" color="#241c3d" aria-hidden="true" />}
      </span>
    );
  };
  // The rack (approved Classic mockup, 2026-11-24): a bright Sky frame with an
  // ink edge and a deeper blue press shade; a theme can recolor it or draw it.
  const rackBase = theme.pieces.board?.color ?? SKY;
  const rackShade = rackBase === SKY ? SKY_DEEP : `color-mix(in srgb, ${rackBase} 62%, #1d1a33)`;
  const pad = Math.round(s * 0.22), gap = Math.round(s * 0.12), edge = Math.max(3, Math.round(s * 0.06)), hole = Math.max(2, Math.round(s * 0.05));
  // From the waiting piece's spot over the rack down to a row.
  const fall = (r: number) => -((r + 1) * s + gap + edge + pad);
  return (
    <ThemedPage theme={theme} menu={phase !== 'play' && phase !== 'end'}>
    <main className={phase === 'play' || phase === 'end' ? '!p-0 [--fr-extra:8rem] lg:[--fr-extra:0rem]' : 'w-full px-4 sm:px-6 pt-6 pb-6'}>
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context="four-in-a-row" />
      {phase !== 'play' && phase !== 'end' && <GameTopRow hint="four-in-a-row" onSettings={() => setSettingsOpen(true)} />}

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
        <SetupWizard onBack={() => setPhase(themes.length > 1 ? 'theme' : 'welcome')} onPlay={() => (setup.way === 'share' && setup.where === 'other' && team.players[1]?.kind !== 'cpu' ? void hostTwoDevices() : begin(team.players, team.level))} pages={[
          // Share or Solo (teacher, 2026-11-23): Share is two players, on the
          // same device or with a join code; Solo is against the computer.
          { id: 'way', title: t('way.title'), content: (
            <div className="grid gap-6 justify-items-center">
              <WayToPlay modes={['share', 'solo']} value={setup.way} onChange={(m) => change({ way: m as 'share' | 'solo' })} />
              {setup.way === 'share' && <ChoiceRow label={t('fr.where')} value={setup.where} onChange={(v) => change({ where: v })}
                options={[{ value: 'here', label: t('fr.where.here') }, { value: 'other', label: t('fr.where.other') }]} />}
            </div>
          ) },
          { id: 'players', title: t('setup.players'), ready: team.players.length === 2 && team.players.every((p) => p.name.trim()), content: (
            // Each player's team picture is their piece (teacher, 2026-11-06):
            // one picture, picked on the player card, the same on the board.
            <TeamSetup key={`${theme.id}-${setup.way}`} mode="versus" vsComputer={setup.way === 'solo'} min={2} max={2} embedded characters={discs.length >= 2 ? discs : undefined} inOrder={!theme.discs?.length}
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
              <ChoiceRow label={t('fr.first')} value={setup.first} onChange={(v) => change({ first: v })}
                options={[{ value: 'p1', label: t('fr.first.p1') }, { value: 'p2', label: t('fr.first.p2') }, { value: 'random', label: t('fr.first.random') }]} />
              <Slider label={t('fr.perTurn')} hint={t('fr.perTurnHint')} min={1} max={3} value={setup.perTurn} onChange={(v) => change({ perTurn: v })} />
              {powerUpSwitches({ manifest: fourInARowManifest, theme, on: setup.powerUps, off: setup.powerOff ?? [], change })}
            </>
          ) },
        ]} />
      )}

      {(phase === 'waiting' || phase === 'joining') && (
        <div className="grid gap-4 justify-items-center text-center bg-surface border-bold border-border rounded-panel p-6 max-w-lg mx-auto" style={{ boxShadow: 'var(--shadow-sticker-lg)' }} role="status" aria-live="polite">
          <motion.span animate={still ? undefined : { y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1.2 }}><Disc who={phase === 'waiting' ? 2 : 1} size="64px" /></motion.span>
          <h2 className="font-display text-3xl"><Title text={phase === 'waiting' ? t('fr.waitingTitle') : t('fr.joiningTitle')} /></h2>
          {phase === 'waiting' && (
            <>
              <p className="font-bold text-lg">{t('fr.waitingText', { host: window.location.host })}</p>
              <p className="font-display text-6xl tracking-[0.15em]" aria-label={t('host.codeIs', { code: hostCode })}>{hostCode}</p>
              <button type="button" onClick={() => { link.current?.close(); link.current = null; setPhase('setup'); }} className="min-h-12 px-5 rounded-pill border-std border-border bg-surface-2 font-bold">{t('setup.back')}</button>
            </>
          )}
        </div>
      )}

      {/* Its own presence, so pieces, the waiting piece and the win line animate
          in when they appear (the page transition's initial={false} would
          otherwise skip every first animation inside the game). */}
      <AnimatePresence>
      {playing && (
        // The approved Classic mockup (/brand Game mockups, 2026-11-24): the rack on
        // legs in the middle of the squiggle stage, the next piece waiting over its
        // column, a player card on each side (whose turn it is shaded Butter) with
        // that player's held power-ups under it. iPad portrait and phones: the
        // two cards sit side by side under the rack. Never scrolls.
        <div key="play" ref={stage} className="relative play-fill overflow-hidden flex flex-col landscape:flex-row items-stretch landscape:items-center justify-center gap-4 landscape:gap-[clamp(0.75rem,2.4vw,2.5rem)] px-[clamp(0.75rem,4vw,2.5rem)] pt-14 pb-3 landscape:px-[clamp(0.75rem,3vw,3rem)] landscape:pt-3" style={{ ['--s' as string]: `${s}px` }}>
          <h1 className="sr-only"><Title text={t('fr.title')} /></h1>
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-30 [&_button]:!w-11 [&_button]:!h-11">
            {/* One order everywhere (Brand Kit, 2026-11-24): Hint, Settings, Full screen, Close. */}
            <HintButton gameId="four-in-a-row" />
            <GearButton small onClick={() => setSettingsOpen(true)} />
            <FullScreenButton small />
            <CloseGameButton />
          </div>

          <div ref={area} className="relative min-w-0 min-h-0 landscape:flex-1 landscape:self-stretch flex items-center justify-center">
            <div className="relative isolate" style={{ width: 7 * s + 2 * (pad + edge), paddingBottom: Math.round(s * 0.3) }}>
              {/* The next piece waits over its column and follows the pointer
                  (feedforward: a tap's result shows before it happens). */}
              <div className="relative" style={{ height: s, marginBottom: gap, marginLeft: pad + edge, width: 7 * s }} aria-hidden="true">
                {showHeld && player && (
                  <motion.div className="absolute left-0 top-0 flex items-center justify-center" style={{ width: s, height: s }}
                    initial={false} animate={{ x: heldCol * s }} transition={still ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 26 }}>
                    <motion.span className="flex items-center justify-center w-full h-full" animate={still ? undefined : { y: [0, -s * 0.08, 0], rotate: [0, -4, 0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}>
                      <Disc who={(turn + 1) as 1 | 2} size="92%" />
                    </motion.span>
                  </motion.div>
                )}
              </div>
              <div className="relative" style={{ padding: pad, border: `${edge}px solid var(--ink)`, borderRadius: s * 0.42, ...pieceFill(theme, 'board', SKY), boxShadow: `0 ${Math.round(s * 0.09)}px 0 ${rackShade}` }}>
                <div className="relative" style={{ width: 7 * s, height: 6 * s }}>
                  {/* Where a tap will drop: a soft light band down the waiting piece's column. */}
                  {anyPick && (
                    <motion.span aria-hidden="true" className="absolute top-0 pointer-events-none" style={{ left: 0, width: s, height: 6 * s, borderRadius: s / 2, background: 'rgba(255,250,240,0.32)' }}
                      initial={false} animate={{ x: heldCol * s }} transition={still ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 30 }} />
                  )}
                  <div role="grid" aria-label={t('fr.title')} className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${COLS}, ${s}px)`, gridTemplateRows: `repeat(${ROWS}, ${s}px)` }}>
                    {board.map((row, r) => <div key={r} role="row" className="contents">{row.map((cell, c) => (
                      <div key={`${r}-${c}`} role="gridcell"
                        aria-label={t('fr.cell', { row: r + 1, col: c + 1, who: cell ? players[cell - 1]?.name ?? '' : t('fr.empty') })}
                        className="flex items-center justify-center">
                        <span className="rounded-full" style={{ width: '78%', height: '78%', background: 'var(--paper)', border: `${hole}px solid var(--ink)` }} />
                      </div>
                    ))}</div>)}
                  </div>
                  {/* Pieces sit in front of the rack, so no piece is ever cropped
                      (teacher, 2026-11-06); a new one falls from the waiting spot
                      with gravity and two bounces, then clacks. */}
                  <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                    {board.flatMap((row, r) => row.map((cell, c) => {
                      if (!cell) return null;
                      const isLast = last?.row === r && last?.col === c;
                      const k = line ? line.findIndex(([lr, lc]) => lr === r && lc === c) : -1;
                      const pop = popped?.col === c;
                      return (
                        <motion.div key={`${r}-${c}-${cell}-${pop ? popped.id : 0}`} className="absolute flex items-center justify-center" style={{ left: c * s, top: r * s, width: s, height: s }}
                          initial={isLast && !still ? { y: fall(r) } : pop && !still ? { y: -s } : false}
                          animate={isLast && !still ? { y: [fall(r), 0, -s * 0.13, 0, -s * 0.04, 0] } : { y: 0 }}
                          transition={{ duration: 0.75 + r * 0.12, times: [0, 0.62, 0.75, 0.86, 0.94, 1], ease: 'easeIn' }}>
                          <span className={`flex items-center justify-center w-full h-full ${k >= 0 && !still ? 'fr-win' : ''}`} style={k >= 0 ? { animationDelay: `${k * 0.12}s` } : undefined}>
                            <Disc who={cell} />
                          </span>
                        </motion.div>
                      );
                    }))}
                  </div>
                  {/* The winning four: a gold band with an ink edge, drawn end to end. */}
                  {line && (
                    <svg viewBox={`0 0 ${COLS} ${ROWS}`} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
                      {[['var(--ink)', 0.3], [GOLD, 0.18]].map(([color, w]) => (
                        <motion.path key={color} d={`M${line[0][1] + 0.5} ${line[0][0] + 0.5} L${line[3][1] + 0.5} ${line[3][0] + 0.5}`} stroke={color as string} strokeWidth={w as number} strokeLinecap="round" fill="none"
                          initial={still ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }} />
                      ))}
                    </svg>
                  )}
                  {/* Tap anywhere on a column (no numbers, teacher 2026-10-31): each
                      column is one tall button from the waiting piece to the bottom. */}
                  {Array.from({ length: COLS }, (_, c) => {
                    const popping = step === 'pop';
                    const full = popping ? board[ROWS - 1][c] === 0 : board[0][c] !== 0;
                    const canPick = anyPick && !full;
                    return (
                      <button key={c} type="button" disabled={!canPick} onClick={() => place(c)}
                        onPointerEnter={() => anyPick && hoverCol(c)} onPointerMove={() => anyPick && heldCol !== c && hoverCol(c)} onFocus={() => anyPick && hoverCol(c)}
                        aria-label={popping ? t('fr.popColumn', { n: c + 1 }) : full ? t('fr.columnFull', { n: c + 1 }) : t('fr.column', { n: c + 1 })}
                        className={`absolute z-10 rounded-[999px] bg-transparent focus-visible:outline-[3px] focus-visible:outline-[var(--ink)] focus-visible:outline-offset-[-3px] ${canPick ? 'cursor-pointer' : 'cursor-default'}`}
                        style={{ left: c * s, width: s, top: -(s + gap + edge + pad), bottom: -pad }} />
                    );
                  })}
                </div>
              </div>
              {/* The rack's two little legs. */}
              {[0, 1].map((side) => (
                <span key={side} aria-hidden="true" className="absolute -z-10" style={{ [side ? 'right' : 'left']: s * 0.5, bottom: 0, width: s * 0.4, height: Math.round(s * 0.3) + 4, background: rackShade, border: `${Math.max(2, edge - 1)}px solid var(--ink)`, borderTop: 0, borderRadius: `0 0 ${s * 0.16}px ${s * 0.16}px` }} />
              ))}
              {phase === 'end' && winner && (
                <motion.p role="status" className="absolute left-1/2 z-20 whitespace-nowrap rounded-pill border-[3px] border-[var(--ink)] px-[0.9em] py-[0.2em] title-bubble leading-tight" style={{ top: s * 0.5, y: '-50%', x: '-50%', color: 'var(--ink)', background: GOLD, boxShadow: '0 4px 0 var(--ink)', fontSize: Math.max(12, Math.min(s * 0.4, (7.6 * s) / (t('fr.fourWins', { name: winner.name }).length * 0.66))) }}
                  initial={still ? false : { scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={still ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 16, delay: 0.5 }}>
                  <Title text={t('fr.fourWins', { name: winner.name })} />
                </motion.p>
              )}
            </div>
          </div>

          {/* The two player cards: left and right of the rack on wide screens,
              side by side under it on tall ones. */}
          <div ref={cards} className="grid grid-cols-2 gap-3 w-full self-center landscape:contents" style={{ maxWidth: 7.6 * s }} aria-label={t('share.scores')} role="list">
            {[0, 1].map((i) => {
              const p = players[i];
              if (!p) return null;
              const on = phase === 'play' && turn === i;
              return (
                <div key={p.id} role="listitem" className={`min-w-0 flex flex-col items-center gap-2.5 landscape:self-center landscape:h-[calc(var(--s)*8.05)] landscape:w-[clamp(7.5rem,16vw,13rem)] landscape:shrink-0 landscape:pt-[calc(var(--s)*1.5)] ${i === 0 ? 'landscape:order-first' : 'landscape:order-last'}`}>
                  <div aria-current={on ? 'true' : undefined} className="w-full grid justify-items-center gap-1 text-center rounded-[1.25rem] border-[3px] border-[var(--ink)] px-2 py-2.5 landscape:py-3"
                    style={{ background: on ? 'var(--butter)' : 'var(--paper)', boxShadow: '0 4px 0 var(--ink)' }}>
                    <motion.span className="flex items-center justify-center" style={{ width: 'clamp(2.5rem, calc(var(--s) * 0.95), 5.25rem)', height: 'clamp(2.5rem, calc(var(--s) * 0.95), 5.25rem)' }}
                      animate={on && !still ? { y: [0, -4, 0] } : { y: 0 }} transition={on && !still ? { repeat: Infinity, duration: 1.4, ease: 'easeInOut' } : { duration: 0.2 }}>
                      <Disc who={(i + 1) as 1 | 2} size="100%" />
                    </motion.span>
                    <b className="title-bubble leading-none max-w-full break-words" style={{ color: 'var(--ink)', fontSize: 'clamp(1.05rem, calc(var(--s) * 0.4), 2.2rem)' }}><Title text={p.name} /></b>
                  </div>
                  {/* This player's held power-ups, on the top layer (queue, 2026-11-24). */}
                  {on && <PowerUpTray manifest={fourInARowManifest} items={held.held} onUse={useItem} disabled={step !== 'pick' || player?.kind === 'cpu' || remoteTurn} />}
                  {on && step === 'pop' && <p className="bg-[var(--butter)] border-std border-border rounded-input px-3 py-1.5 font-bold text-center text-sm" role="status">{t('fr.popPick')}</p>}
                  {on && (remoteTurn || p.kind === 'cpu') && (
                    <p className="bg-[var(--paper)] border-std border-border rounded-input px-3 py-1.5 font-bold text-sm text-center" role="status">{remoteTurn ? t('fr.waitingFor', { name: p.name }) : t('fr.cpuThinking', { name: p.name })}</p>
                  )}
                </div>
              );
            })}
          </div>
          {phase === 'play' && player && <p className="sr-only" aria-live="polite">{t('share.whoseTurn', { name: player.name })}</p>}

          {phase === 'end' && results && (
            <ResultsModal winners={winner ? [winner] : undefined} title={winner ? t('fr.wins', { name: winner.name }) : t('fr.draw')} missed={missed} againLabel={t('share.again')} onAgain={() => setPhase('welcome')}>
              <p className="font-display text-xl font-bold">{t('fr.goodGame')}</p>
              <ul className="font-bold">{players.map((p, i) => p.kind !== 'cpu' && <li key={p.id}>{t('fr.rights', { name: p.name, count: rights[i] })}</li>)}</ul>
            </ResultsModal>
          )}
        </div>
      )}
      </AnimatePresence>
      {element}
      {powers.element}
    </main>
    </ThemedPage>
  );
}
