import { useEffect, useMemo, useRef, useState } from 'react';
import ClassPlayOptions, { classPlayQuery, DEFAULT_CLASS_PLAY, type ClassPlay } from '../../live/ClassPlay';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Fish as FishIcon, HandGrabbing, Question, Timer } from '@phosphor-icons/react';
import { LIBRARY } from '../../data/library';
import { useMySets } from '../../data/hooks';
import { buzz, playEffect } from '../../engine/feedback';
import ResultsModal from '../../engine/ResultsModal';
import { getLive } from '../../live/session';
import { usePlayClock } from '../../engine/playClock';
import { useAsk } from '../../engine/useAsk';
import { t } from '../../i18n';
import { AccessButton, FullScreenButton, GameTopRow, GearButton, SettingsPanel } from '../../settings/SettingsPanel';
import { useSettings } from '../../settings/SettingsContext';
import { useGamePool } from '../../student/session';
import { pieceColor, pieceFill, pieceImage } from '../../theme/library';
import ItemArt from '../../theme/ItemArt';
import type { ThemeItem } from '../../theme/types';
import { ThemedPage, useGameTheme } from '../../theme/useGameTheme';
import { Slider } from '../../ui/fields';
import { powerUpSwitches } from '../../engine/PowerUpSwitches';
import GameWelcome from '../GameWelcome';
import SetPicker from '../SetPicker';
import WayToPlay from '../WayToPlay';
import { useSignedIn } from '../../auth/session';
import { makeGameCode } from '../../data/gameCodes';
import type { PlayMode } from '../../data/types';
import { useNavigate } from 'react-router-dom';
import SetupWizard from '../SetupWizard';
import ThemeScreen from '../ThemeScreen';
import { castCatchManifest } from './manifest';
import { useSavedSetup } from '../useSavedSetup';
import { castQuality, catchFish, catchItem, FISH, itemEffect, pointsFor, type FishKind } from './fish';


type Phase = 'welcome' | 'theme' | 'setup' | 'play' | 'end';
type Step = 'ready' | 'power' | 'casting' | 'ask' | 'wait' | 'bite' | 'reeling' | 'caught';
// A catch is a fish, or one of the theme's power-up items.
interface Catch { fish?: FishKind; item?: ThemeItem; cm: number; points: number; seconds?: number; double?: boolean }

// A fish drawn in code: body, tail, fin, optional stripes, an eye.
// The waterline sits at 20% of the scene; the boat's deck rests on it.
const BOAT_TOP = 20;
const CLASSIC_FISH: Record<string, string> = {
  perch: 'orange', bluegill: 'blue', sunfish: 'orange', guppy: 'pink', trout: 'grey', brooktrout: 'green', bass: 'green',
  puffer: 'brown', clown: 'orange', tang: 'blue', swordfish: 'grey-long-a', goldfish: 'red',
};
// A theme can draw each rarity's fish (fish-common ... fish-legendary).
const RARITY_PIECE = ['fish-common', 'fish-uncommon', 'fish-rare', 'fish-legendary'];
export function FishArt({ fish, size, theme }: { fish: FishKind; size: number; theme?: Parameters<typeof pieceImage>[0] }) {
  const art = pieceImage(theme, RARITY_PIECE[fish.rarity]);
  if (art) return <img src={art} alt="" aria-hidden="true" style={{ width: size, height: size * 0.6, objectFit: 'contain' }} />;
  // Classic fish (teacher, 2026-10-31): Kenney's Fish Pack (CC0), turned to face left.
  const classic = CLASSIC_FISH[fish.id];
  if (classic) return <img src={`/classic/cast-catch/fish-${classic}.svg`} alt="" aria-hidden="true" style={{ width: size, height: size * 0.75, objectFit: 'contain', transform: 'scale(-1.15, 1.15)' }} />;
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 100 60" aria-hidden="true">
      <path d="M78 30 L98 12 L94 30 L98 48 Z" fill={fish.fin} stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <ellipse cx="44" cy="30" rx="38" ry="22" fill={fish.body} stroke="#000" strokeWidth="2.5" />
      {fish.stripe && <><path d="M36 9 Q32 30 36 51" stroke={fish.stripe} strokeWidth="5" fill="none" /><path d="M54 10 Q50 30 54 50" stroke={fish.stripe} strokeWidth="5" fill="none" /></>}
      <path d="M40 9 Q50 0 60 10" fill={fish.fin} stroke="#000" strokeWidth="2.5" />
      <circle cx="20" cy="25" r="5" fill="#fff" stroke="#000" strokeWidth="2" /><circle cx="19" cy="25" r="2.3" fill="#000" />
      <path d="M8 34 Q12 37 16 35" stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// Live's first game (development plan Stage 6), playable solo now:
// tap to start the cast meter, tap to stop it (the middle is best), answer
// while the bobber floats, then reel in. Better casts bring rarer fish.
export default function CastCatch() {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const { theme, themes, playable, choose } = useGameTheme('cast-catch');
  const { teacher } = useSignedIn();
  const navigate = useNavigate();
  const [way, setWay] = useState<PlayMode>('solo');
  const [classPlay, setClassPlay] = useState<ClassPlay>(DEFAULT_CLASS_PLAY);
  async function openLive() { navigate(`/teacher/live/${(await makeGameCode('cast-catch', setId, 'live')).code}?${classPlayQuery(classPlay)}`); }
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const [setup, change] = useSavedSetup('cast-catch', { setId: LIBRARY[0].id, minutes: 8, powerUps: true, powerOff: [] as string[] });
  const setId = sets.some((s) => s.id === setup.setId) ? setup.setId : LIBRARY[0].id;
  const picked = useMemo(() => sets.filter((s) => s.id === setId).map((set) => ({ set, starred: false })), [sets, setId]);
  const game = useGamePool(picked);
  const { ask, cancel, asking, element, missed } = useAsk({ gameId: 'cast-catch', mode: 'solo', pool: game.pool, classroomId: game.classroomId, studentId: game.studentId });
  const [phase, setPhase] = useState<Phase>('welcome');
  const [step, setStep] = useState<Step>('ready');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [power, setPower] = useState(0);
  const [cast, setCast] = useState(0.5);
  const [catches, setCatches] = useState<Catch[]>([]);
  const [last, setLast] = useState<Catch | null>(null);
  const [endsAt, setEndsAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const quality = useRef<0 | 1 | 2 | 3>(0);
  const doubleNext = useRef(false);
  const raf = useRef(0);
  const started = useRef(0);

  const left = Math.max(0, Math.ceil((endsAt - now) / 1000));
  const score = Math.max(0, catches.reduce((s, c) => s + c.points, 0));
  const timeUp = phase === 'play' && left === 0;

  useEffect(() => {
    if (phase !== 'play') return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [phase]);
  useEffect(() => { if (timeUp && step === 'ready') finish(); }, [timeUp, step]); // eslint-disable-line react-hooks/exhaustive-deps
  // Every pending timer, so none fire after the game ends (Claudia, 2026-11-01).
  const timers = useRef<number[]>([]);
  const phaseNow = useRef<Phase>('welcome');
  phaseNow.current = phase;
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(() => { if (phaseNow.current === 'play') fn(); }, ms)); };
  const pause = (ms: number) => new Promise<void>((r) => { timers.current.push(window.setTimeout(r, ms)); });
  useEffect(() => () => { cancelAnimationFrame(raf.current); timers.current.forEach((id) => window.clearTimeout(id)); }, []);
  // The fish book lasts from game to game on this device (per student).
  const bookKey = `gamify:fishbook:${game.studentId ?? 'me'}`;
  const [book, setBook] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem(bookKey) ?? '[]'); } catch { return []; } });

  // In a live game the teacher already chose everything: students go
  // straight into play, no welcome or setup (teacher check, 2026-10-31).
  const liveStart = useRef(false);
  useEffect(() => { if (getLive() && !liveStart.current && phase === 'welcome' && game.pool.length) { liveStart.current = true; begin(); } }); // eslint-disable-line react-hooks/exhaustive-deps
  function begin() {
    setCatches([]); setLast(null); setStep('ready'); doubleNext.current = false;
    setEndsAt(Date.now() + setup.minutes * 60000); setNow(Date.now());
    setPhase('play');
  }
  function finish() {
    cancelAnimationFrame(raf.current);
    timers.current.forEach((id) => window.clearTimeout(id)); timers.current = [];
    phaseNow.current = 'end';
    setPhase('end');
    playEffect('win', settings);
    if (settings.celebrations !== 'off' && !still) void confetti({ particleCount: settings.celebrations === 'big' ? 140 : 50, spread: 80, origin: { y: 0.6 }, disableForReducedMotion: true });
  }  // The teacher's play clock or score goal ends the game the usual way (2026-10-31).
  const clock = usePlayClock({ playing: phase === 'play', score, onTimeUp: () => { if (asking) cancel(); else finish(); } });

  // The cast meter swings back and forth until the player taps Stop.
  function startPower() {
    setStep('power');
    started.current = performance.now();
    const period = still ? 2600 : 1500;
    const tick = (ts: number) => {
      const x = ((ts - started.current) % period) / period;
      setPower(x < 0.5 ? x * 2 : 2 - x * 2);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }
  async function stopPower() {
    cancelAnimationFrame(raf.current);
    quality.current = castQuality(power);
    setCast(power);
    setFlying(true);
    setStep('casting');
    playEffect('whoosh', settings);
    await pause(still ? 150 : 750);
    if (phaseNow.current !== 'play') return;
    setStep('ask');
    const ok = await ask();
    if (!ok) { finish(); return; }
    // A fish shadow swims up to the bobber (bigger for a better cast), then bites.
    const swim = still ? 500 : 1300 + Math.random() * 1000;
    setApproach({ id: Date.now(), from: Math.random() < 0.5 ? -1 : 1, ms: swim });
    setStep('wait');
    await pause(swim);
    if (phaseNow.current !== 'play') return;
    setStep('bite');
    buzz(40, settings);
    playEffect('tap', settings);
  }
  // Reel in: the line pulls tight, the rod bends and the bobber is tugged
  // back in jerks with splashes, then the catch comes up (Golden Rule pass).
  function reel() {
    if (step !== 'bite') return;
    setStep('reeling');
    buzz(30, settings);
    if (still) { land(); return; }
    [0, 280, 560].forEach((ms) => later(() => playEffect(ms ? 'tap' : 'whoosh', settings), ms));
    later(land, 850);
  }
  function land() {
    const times = doubleNext.current ? 2 : 1;
    // Only the power-up catches the teacher left on (2026-11-01).
    const item = setup.powerUps ? catchItem((theme.items?.length ? theme.items : castCatchManifest.items!.classic).filter((it) => !(setup.powerOff ?? []).includes(it.id))) : null;
    let c: Catch;
    if (item) {
      const e = itemEffect(item);
      c = { item, cm: 0, points: e.points > 0 ? e.points * times : e.points, seconds: e.seconds || undefined, double: e.double || undefined };
      if (e.seconds) setEndsAt((at) => at + e.seconds * 1000);
      doubleNext.current = e.double ? true : e.points > 0 ? false : doubleNext.current;
    } else {
      const { fish, cm } = catchFish(quality.current);
      c = { fish, cm, points: pointsFor(fish, cm) * times };
      doubleNext.current = false;
    }
    setCatches((cs) => [...cs, c]);
    // A kind never caught before on this device goes in the fish book: New!
    newKind.current = c.fish && !book.includes(c.fish.id) ? c.fish.id : null;
    if (newKind.current) { const nb = [...book, newKind.current]; setBook(nb); try { localStorage.setItem(bookKey, JSON.stringify(nb)); } catch { /* private window */ } }
    setLast(c);
    setApproach(null);
    setStep('caught');
    playEffect(c.points < 0 ? 'miss' : 'right', settings);
    later(() => { setLast(null); setStep('ready'); }, still ? 2200 : 2600);
  }

  const qualityWord = [t('cc.cast.short'), t('cc.cast.good'), t('cc.cast.great'), t('cc.cast.perfect')];
  const bobberLeft = 36 + cast * 54;
  // The boat and rod are drawn in one picture sized to the scene's width
  // (viewBox 0 -60 320 180 at 26% wide, from -8%); the rod tip, in scene %,
  // is where the line and the flying bobber start.
  const scene = useRef<HTMLDivElement>(null);
  const [aspect, setAspect] = useState(1.6);
  useEffect(() => {
    const el = scene.current;
    if (!el) return;
    const ro = new ResizeObserver(() => { const r = el.getBoundingClientRect(); if (r.height) setAspect(r.width / r.height); });
    ro.observe(el);
    return () => ro.disconnect();
  }, [phase]);
  const tip = step === 'power' ? { x: 300 - power * 40, y: -50 + power * 6 } : { x: 316, y: -52 };
  const tipAt = { x: -8 + (tip.x * 26) / 320, y: BOAT_TOP - 9.1 * aspect + ((tip.y + 60) * 26 * aspect) / 320 };
  // The bobber starts at the rod tip, then (next frame) flies to where the cast lands.
  const [flying, setFlying] = useState(false);
  const newKind = useRef<string | null>(null);
  const [approach, setApproach] = useState<{ id: number; from: -1 | 1; ms: number } | null>(null);
  useEffect(() => {
    if (step !== 'casting') return;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setFlying(false)));
    return () => cancelAnimationFrame(id);
  }, [step]);
  const lineOut = step === 'ask' || step === 'wait' || step === 'bite' || step === 'reeling';
  const reeling = step === 'reeling';
  // Where the bobber sits: out on the water, or pulled back toward the rod while reeling.
  const bob = reeling ? { x: bobberLeft + (tipAt.x - bobberLeft) * 0.55, y: 30 } : { x: bobberLeft, y: step === 'bite' ? 40 : 34 };
  // The fish book: kinds caught this game; a first catch of a kind says New!
  const caughtKinds = new Set(book);
  const firstOfKind = !!last?.fish && newKind.current === last.fish.id;

  return (
    <ThemedPage theme={theme} menu={phase !== 'play' && phase !== 'end'}>
    <main className={(phase === 'play' || phase === 'end') ? '!p-0' : 'max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-6'}>
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context="cast-catch" />
      {clock.element}
      {(phase === 'play' || phase === 'end')
        ? <h1 className="sr-only">{castCatchManifest.name}</h1>
        : <GameTopRow onSettings={() => setSettingsOpen(true)} />}

      {phase === 'welcome' && (
        <GameWelcome game={castCatchManifest} cover={pieceImage(theme, 'cover')} onStart={() => setPhase(themes.length > 1 ? 'theme' : 'setup')} steps={[
          { icon: <HandGrabbing weight="fill" size={22} />, text: t('cc.how1') },
          { icon: <Question weight="bold" size={22} />, text: t('cc.how2') },
          { icon: <FishIcon weight="fill" size={22} />, text: t('cc.how3') },
        ]} />
      )}
      {phase === 'theme' && <ThemeScreen gameName={castCatchManifest.name} current={theme} themes={themes} playable={playable} onChoose={choose} onBack={() => setPhase('welcome')} onNext={() => setPhase('setup')} />}
      {phase === 'setup' && (
        <SetupWizard onBack={() => setPhase(themes.length > 1 ? 'theme' : 'welcome')} onPlay={way === 'live' ? () => void openLive() : begin} playLabel={way === 'live' ? t('way.openLobby') : undefined} pages={[
          // Pick the way to play first (teacher, 2026-10-31): Live opens a class lobby.
          ...(!teacher ? [] : [{ id: 'way', title: t('way.title'), content: <WayToPlay modes={['live', 'solo']} value={way} onChange={setWay} /> }]),
          ...(teacher && way === 'live' ? [{ id: 'class', title: t('live.howPlay'), content: <ClassPlayOptions value={classPlay} onChange={setClassPlay} /> }] : []),
          ...(game.assigned ? [] : [{ id: 'questions', title: t('setup.questions'), content: <SetPicker sets={sets} value={[setId]} onChange={(ids) => change({ setId: ids[0] })} /> }]),
          { id: 'options', title: t('setup.options'), content: (
            <>
              <Slider label={t('cc.minutes')} hint={t('cc.minutesHint')} min={1} max={20} value={setup.minutes} show={(v) => t('cc.minutesValue', { count: v })} onChange={(v) => change({ minutes: v })} />
              {powerUpSwitches({ manifest: castCatchManifest, theme, on: setup.powerUps, off: setup.powerOff ?? [], change })}
            </>
          ) },
        ]} />
      )}

      {(phase === 'play' || phase === 'end') && (
        // The game fills the whole space, the same in full screen and not;
        // small controls sit on top of the scene (teacher, 2026-10-31).
        <section className="relative play-fill">
          <div ref={scene} className="relative overflow-hidden select-none h-full" style={{ ...(theme.pieces.background?.image ? pieceFill(theme, 'background', '#5aa9d6') : { background: 'linear-gradient(180deg, #cfe9ff 0%, #cfe9ff 20%, #5aa9d6 20%, #2f6fb0 100%)' }) }}>
            {/* The water moves a little (teacher, 2026-10-31): soft ripples drift and the shimmer lines glide. */}
            {!theme.pieces.background?.image && <span className="absolute inset-x-0 bottom-0 top-[20%] pointer-events-none cc-water" aria-hidden="true" />}
            {!still && [0, 1, 2, 3].map((i) => (
              <span key={i} className="absolute h-1.5 rounded-pill bg-white/45" style={{ top: `${26 + i * 16}%`, width: `${14 + (i % 2) * 6}%`, animation: `cc-swim-right ${9 + i * 3}s linear ${-i * 4}s infinite` }} aria-hidden="true" />
            ))}
            <span className="absolute right-[16%] top-[3%] w-[5%] aspect-square rounded-full border-[2.5px] border-border" style={pieceFill(theme, 'sun', '#fdfd94')} aria-hidden="true" />
            {[[22, 10, 12], [62, 11, 9]].map(([x, y, w], i) => (
              <span key={`c${i}`} className={`absolute h-[5%] ${pieceImage(theme, 'cloud') ? '' : 'rounded-pill border-[2px] border-border'}`} style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, ...(pieceImage(theme, 'cloud') ? { background: `center / contain no-repeat url("${pieceImage(theme, 'cloud')}")` } : { background: pieceColor(theme, 'cloud', '#ffffff') }), animation: still ? undefined : `cc-drift ${18 + i * 6}s ease-in-out infinite` }} aria-hidden="true" />
            ))}
            {!still && [0, 1, 2].map((i) => (
              <span key={`f${i}`} className="absolute opacity-25" style={{ top: `${58 + i * 11}%`, animation: `${i % 2 ? 'cc-swim-left' : 'cc-swim-right'} ${14 + i * 4}s linear ${-i * 5}s infinite` }} aria-hidden="true">
                <svg width="70" height="34" viewBox="0 0 100 50" style={{ transform: i % 2 ? 'none' : 'scaleX(-1)' }}><path d="M78 25 L98 8 L94 25 L98 42 Z M44 5 a38 20 0 1 0 0.1 0 Z" fill="#0b2a4a" /></svg>
              </span>
            ))}
            {/* Classic lake floor (Kenney Fish Pack, CC0): seaweed sways, rocks sit still. */}
            {!pieceImage(theme, 'background') && ([['seaweed-green-a', 30, 9], ['rock-a', 38, 7], ['seaweed-pink-a', 47, 8], ['seaweed-green-b', 62, 10], ['rock-b', 71, 6], ['seaweed-orange-a', 80, 8], ['seaweed-green-a', 91, 9]] as const).map(([art, x, w], i) => (
              <img key={`sea${i}`} src={`/classic/cast-catch/${art}.svg`} alt="" aria-hidden="true" className="absolute bottom-0 pointer-events-none origin-bottom"
                style={{ left: `${x}%`, width: `${w}%`, aspectRatio: '1', objectFit: 'contain', objectPosition: 'bottom', animation: still || art.startsWith('rock') ? undefined : `cc-sway ${4 + (i % 3)}s ease-in-out ${-i}s infinite` }} />
            ))}
            {/* A wooden boat at the top left, half showing, with the rod off its bow
                (teacher, 2026-10-31). Boat and rod share one drawing, sized to the
                scene's width, so the rod always sits on the boat. A theme's "dock"
                and "rod" pictures stand in for them. */}
            <svg className="absolute pointer-events-none" style={{ left: '-8%', top: `${BOAT_TOP - 9.1 * aspect}%`, width: '26%', aspectRatio: '320 / 180', overflow: 'visible', animation: still ? undefined : 'cc-rock 4s ease-in-out infinite', transformOrigin: '70% 70%' }} viewBox="0 -60 320 180" aria-hidden="true">
              {pieceImage(theme, 'dock')
                ? <image href={pieceImage(theme, 'dock')} x="0" y="20" width="320" height="100" preserveAspectRatio="xMaxYMax meet" />
                : <>
                    <path d="M10 40 L300 40 Q290 90 240 112 L60 112 Q20 90 10 40 Z" fill={pieceColor(theme, 'dock', '#a0683a')} stroke="#000" strokeWidth="5" strokeLinejoin="round" />
                    <path d="M18 62 L292 62 M30 86 L278 86" stroke="#000" strokeOpacity="0.35" strokeWidth="4" />
                    <path d="M6 34 L304 34 L300 44 L10 44 Z" fill="#7a4a24" stroke="#000" strokeWidth="5" strokeLinejoin="round" />
                    <rect x="150" y="18" width="40" height="18" rx="3" fill="#7a4a24" stroke="#000" strokeWidth="4" />
                  </>}
              {pieceImage(theme, 'rod')
                ? <image href={pieceImage(theme, 'rod')} x="240" y="-60" width="90" height="100" preserveAspectRatio="xMinYMax meet" />
                : <line x1="250" y1="36" x2={tip.x} y2={tip.y} stroke={pieceColor(theme, 'rod', '#5b3a1e')} strokeWidth="7" strokeLinecap="round" />}
              <circle cx="262" cy="20" r="9" fill="#314677" stroke="#000" strokeWidth="4" />
            </svg>
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {lineOut && <motion.line x1={tipAt.x} y1={tipAt.y + (reeling ? 2 : 0)} initial={false} animate={{ x2: bob.x, y2: bob.y }} transition={{ duration: still || !reeling ? 0 : 0.8, ease: [0.5, 0, 0.3, 1] }} stroke={reeling ? '#3b2a1a' : '#000'} strokeWidth={reeling ? 2.6 : 1.5} vectorEffect="non-scaling-stroke" className={reeling && !still ? 'cc-tense' : ''} />}
            </svg>
            {/* The fish shadow swims in under the bobber, then tugs it. */}
            {approach && (step === 'wait' || step === 'bite' || reeling) && (
              <motion.span key={approach.id} aria-hidden="true" className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ width: `${7 + quality.current * 2.2}%`, opacity: 0.45 }}
                initial={{ left: `${bobberLeft + approach.from * 24}%`, top: '66%' }}
                animate={reeling ? { left: `${bob.x}%`, top: `${bob.y + 6}%` } : step === 'bite' ? { left: `${bobberLeft}%`, top: '45%', rotate: [0, -8, 8, 0] } : { left: `${bobberLeft}%`, top: '46%' }}
                transition={reeling ? { duration: 0.8, ease: 'easeIn' } : step === 'bite' ? { rotate: { duration: 0.4, repeat: Infinity } } : { duration: still ? 0 : approach.ms / 1000, ease: 'easeOut' }}>
                <svg viewBox="0 0 100 50" className="w-full" style={{ transform: approach.from > 0 ? 'none' : 'scaleX(-1)' }}><path d="M78 25 L98 8 L94 25 L98 42 Z M44 5 a38 20 0 1 0 0.1 0 Z" fill="#0b2a4a" /></svg>
              </motion.span>
            )}
            {(step === 'bite' || reeling) && !still && [0, 1].map((k) => (
              <span key={`sp${k}-${step}`} aria-hidden="true" className="absolute w-14 h-5 -ml-7 -mt-1 rounded-[50%] border-[2px] border-white/80 pointer-events-none cc-splash" style={{ left: `${bobberLeft}%`, top: '42%', animationDelay: `${k * 0.3}s` }} />
            ))}
            {(step === 'casting' || lineOut) && (
              <span className="absolute w-9 h-9 -ml-[18px] -mt-[18px]" aria-hidden="true"
                style={{ left: `${flying ? tipAt.x : bob.x}%`, top: `${flying ? tipAt.y : bob.y}%`, transition: still ? 'none' : reeling ? 'left 0.8s cubic-bezier(0.5, 0, 0.3, 1), top 0.8s cubic-bezier(0.5, 0, 0.3, 1)' : 'left 0.7s ease-out, top 0.7s cubic-bezier(0.3, -0.8, 0.7, 1)' }}>
                <span className="block w-full h-full rounded-full border-[2.5px] border-border" style={{ ...pieceFill(theme, 'bobber', '#e5635f'), animation: still || step === 'casting' ? undefined : step === 'bite' ? 'cc-bite 0.5s ease-in-out infinite' : 'cc-bob 2s ease-in-out infinite' }} />
              </span>
            )}
            <AnimatePresence>
              {last && (
                <motion.div key={catches.length} className="absolute inset-x-0 top-[14%] mx-auto w-[min(90%,420px)] bg-surface border-[3px] border-border rounded-panel p-4 grid gap-1 justify-items-center text-center"
                  style={{ boxShadow: 'var(--shadow-sticker-lg)' }} initial={still ? false : { y: 120, scale: 0.6, rotate: -8 }} animate={{ y: 0, scale: 1, rotate: 0 }} exit={{ opacity: 0 }} role="status">
                  {last.item ? (
                    <>
                      <ItemArt item={last.item} size={140} still={still} />
                      <p className="font-display text-2xl">{t('cc.youCaughtItem', { name: last.item.name })}</p>
                      <p className="font-bold">{last.double ? t('cc.effect.double') : last.seconds ? t('cc.effect.time', { s: last.seconds }) : last.points < 0 ? t('cc.effect.lose', { n: -last.points }) : `+${last.points} ${t('cc.pts')}`}</p>
                    </>
                  ) : last.fish && (
                    <>
                      {firstOfKind && <span className="absolute top-3 left-3 rotate-[-8deg] font-display text-lg bg-accent border-[2px] border-border rounded-pill px-3" style={{ boxShadow: 'var(--shadow-sticker)' }}>{t('cc.new')}</span>}
                      <FishArt fish={last.fish} size={140} theme={theme} />
                      <p className="font-display text-2xl">{t('cc.youCaught', { name: last.fish.name, cm: last.cm })}</p>
                      <p className="font-bold">+{last.points} {t('cc.pts')} · {t(`cc.rarity.${last.fish.rarity}` as 'cc.rarity.0')}</p>
                      <p className="text-sm font-semibold">{last.fish.fact}</p>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Top: score chips in the middle, full screen and settings on the right. */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
            <span className="inline-flex items-center gap-1.5 bg-surface border-[2px] border-border rounded-pill px-3 min-h-10 font-display text-lg tabular-nums" style={{ boxShadow: 'var(--shadow-sticker)' }} aria-label={t('cc.timeLeft', { s: left })}><Timer weight="bold" size={20} />{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</span>
            <span className="inline-flex items-center gap-1.5 bg-surface border-[2px] border-border rounded-pill px-3 min-h-10 font-display text-lg tabular-nums" style={{ boxShadow: 'var(--shadow-sticker)' }} aria-label={t('cc.points', { count: score })}>{score} {t('cc.pts')}</span>
            <span className="inline-flex items-center gap-1.5 bg-surface border-[2px] border-border rounded-pill px-3 min-h-10 font-display text-lg" style={{ boxShadow: 'var(--shadow-sticker)' }} aria-label={t('cc.caught', { count: catches.length })}><FishIcon weight="fill" size={20} />{catches.length}</span>
          </div>
          <div className="absolute top-3 right-3 flex items-center gap-2 z-10 [&_button]:!w-11 [&_button]:!h-11">
            <FullScreenButton small />
            <AccessButton small />
            <GearButton small onClick={() => setSettingsOpen(true)} />
          </div>
          {phase === 'play' && (
            <div className="absolute inset-x-0 bottom-5 grid gap-2 justify-items-center z-10 pointer-events-none [&>*]:pointer-events-auto">
              {step === 'ready' && !timeUp && <BigButton onClick={startPower} label={t('cc.cast')} />}
              {step === 'power' && (
                <>
                  <div className="relative w-full max-w-md h-6 rounded-pill border-[2.5px] border-border overflow-hidden" style={{ background: 'linear-gradient(90deg, #ed9d75 0%, #fdfd94 38%, #9fe7a0 50%, #9fe7a0 74%, #fdfd94 86%, #ed9d75 100%)' }} role="meter" aria-label={t('cc.meter')} aria-valuenow={Math.round(power * 100)} aria-valuemin={0} aria-valuemax={100}>
                    <span className="absolute top-0 bottom-0 w-1.5 bg-black" style={{ left: `calc(${power * 100}% - 3px)` }} />
                  </div>
                  <BigButton onClick={() => void stopPower()} label={t('cc.stop')} />
                </>
              )}
              {step === 'casting' && <p className="font-display text-2xl px-4 py-1 rounded-pill bg-surface/90 border-[2px] border-border" role="status">{qualityWord[quality.current]}</p>}
              {step === 'wait' && <p className="font-display text-2xl px-4 py-1 rounded-pill bg-surface/90 border-[2px] border-border" role="status">{t('cc.waiting')}</p>}
              {step === 'bite' && <BigButton onClick={reel} label={t('cc.reel')} pulse={!still} />}
              {timeUp && step === 'ready' && <p className="font-display text-2xl px-4 py-1 rounded-pill bg-surface/90 border-[2px] border-border">{t('cc.timeUp')}</p>}
            </div>
          )}
        </section>
      )}

      {phase === 'end' && (
        <ResultsModal title={t('cc.done', { count: score })} missed={missed} againLabel={t('share.again')} onAgain={() => setPhase('welcome')}>
          <p className="font-bold">{t('cc.summary', { count: catches.length })}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {catches.slice().sort((a, b) => b.points - a.points).slice(0, 6).map((c, i) => (
              <span key={i} className="grid justify-items-center text-xs font-bold">{c.item ? <ItemArt item={c.item} size={56} still /> : c.fish && <FishArt fish={c.fish} size={56} theme={theme} />}{c.item?.name ?? c.fish?.name}</span>
            ))}
          </div>
          {/* The fish book: every kind of fish, the ones caught in color. */}
          <p className="font-display text-xl">{t('cc.book', { n: caughtKinds.size, total: FISH.length })}</p>
          <div className="grid grid-cols-6 gap-1.5 justify-items-center" role="img" aria-label={t('cc.book', { n: caughtKinds.size, total: FISH.length })}>
            {FISH.map((f) => (
              <span key={f.id} title={caughtKinds.has(f.id) ? f.name : '?'} className={`w-11 h-9 rounded-input border-[2px] border-border flex items-center justify-center ${caughtKinds.has(f.id) ? 'bg-surface' : 'bg-surface-2'}`} aria-hidden="true">
                <span style={caughtKinds.has(f.id) ? undefined : { filter: 'brightness(0) opacity(0.3)' }}><FishArt fish={f} size={30} theme={theme} /></span>
              </span>
            ))}
          </div>
        </ResultsModal>
      )}
      {element}
    </main>
    </ThemedPage>
  );
}

function BigButton({ onClick, label, pulse = false }: { onClick: () => void; label: string; pulse?: boolean }) {
  return (
    <motion.button type="button" onClick={onClick} animate={pulse ? { scale: [1, 1.06, 1] } : undefined} transition={{ duration: 0.8, repeat: Infinity }}
      className="min-h-14 px-10 rounded-pill border-[2.5px] border-border bg-accent font-display text-2xl active:scale-95" style={{ boxShadow: 'var(--shadow-sticker)' }}>
      {label}
    </motion.button>
  );
}
