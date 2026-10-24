import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Fish as FishIcon, HandGrabbing, Question, Timer } from '@phosphor-icons/react';
import { LIBRARY } from '../../data/library';
import { useMySets } from '../../data/hooks';
import { buzz, playEffect } from '../../engine/feedback';
import ResultsModal from '../../engine/ResultsModal';
import { useAsk } from '../../engine/useAsk';
import { t } from '../../i18n';
import { GameTopRow, SettingsPanel } from '../../settings/SettingsPanel';
import { useSettings } from '../../settings/SettingsContext';
import { useGamePool } from '../../student/session';
import { pieceFill, pieceImage } from '../../theme/library';
import { ThemedPage, useGameTheme } from '../../theme/useGameTheme';
import { Slider } from '../../ui/fields';
import GameWelcome from '../GameWelcome';
import SetPicker from '../SetPicker';
import SetupWizard from '../SetupWizard';
import ThemeScreen from '../ThemeScreen';
import { castCatchManifest } from './manifest';
import { useSavedSetup } from '../useSavedSetup';
import { castQuality, catchFish, pointsFor, type FishKind } from './fish';


type Phase = 'welcome' | 'theme' | 'setup' | 'play' | 'end';
type Step = 'ready' | 'power' | 'casting' | 'ask' | 'wait' | 'bite' | 'caught';
interface Catch { fish: FishKind; cm: number; points: number }

// A fish drawn in code: body, tail, fin, optional stripes, an eye.
export function FishArt({ fish, size }: { fish: FishKind; size: number }) {
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

// Class Live's first game (development plan Stage 6), playable solo now:
// tap to start the cast meter, tap to stop it (the middle is best), answer
// while the bobber floats, then reel in. Better casts bring rarer fish.
export default function CastCatch() {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const { theme, themes, playable, choose } = useGameTheme('cast-catch');
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const [setup, change] = useSavedSetup('cast-catch', { setId: LIBRARY[0].id, minutes: 3 });
  const setId = sets.some((s) => s.id === setup.setId) ? setup.setId : LIBRARY[0].id;
  const picked = useMemo(() => sets.filter((s) => s.id === setId).map((set) => ({ set, starred: false })), [sets, setId]);
  const game = useGamePool(picked);
  const { ask, element, missed } = useAsk({ gameId: 'cast-catch', mode: 'solo', pool: game.pool, classroomId: game.classroomId, studentId: game.studentId });
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
  const raf = useRef(0);
  const started = useRef(0);

  const left = Math.max(0, Math.ceil((endsAt - now) / 1000));
  const score = catches.reduce((s, c) => s + c.points, 0);
  const timeUp = phase === 'play' && left === 0;

  useEffect(() => {
    if (phase !== 'play') return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [phase]);
  useEffect(() => { if (timeUp && step === 'ready') finish(); }, [timeUp, step]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  function begin() {
    setCatches([]); setLast(null); setStep('ready');
    setEndsAt(Date.now() + setup.minutes * 60000); setNow(Date.now());
    setPhase('play');
  }
  function finish() {
    cancelAnimationFrame(raf.current);
    setPhase('end');
    playEffect('win', settings);
    if (settings.celebrations !== 'off' && !still) void confetti({ particleCount: settings.celebrations === 'big' ? 140 : 50, spread: 80, origin: { y: 0.6 }, disableForReducedMotion: true });
  }
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
    await new Promise((r) => window.setTimeout(r, still ? 150 : 750));
    setStep('ask');
    const ok = await ask();
    if (!ok) { finish(); return; }
    setStep('wait');
    await new Promise((r) => window.setTimeout(r, 500 + Math.random() * 900));
    setStep('bite');
    buzz(40, settings);
    playEffect('tap', settings);
  }
  function reel() {
    const { fish, cm } = catchFish(quality.current);
    const c = { fish, cm, points: pointsFor(fish, cm) };
    setCatches((cs) => [...cs, c]);
    setLast(c);
    setStep('caught');
    playEffect('right', settings);
    window.setTimeout(() => { setLast(null); setStep('ready'); }, still ? 2200 : 2600);
  }

  const qualityWord = [t('cc.cast.short'), t('cc.cast.good'), t('cc.cast.great'), t('cc.cast.perfect')];
  const bobberLeft = 30 + cast * 58;
  // The bobber starts at the rod tip, then (next frame) flies to where the cast lands.
  const [flying, setFlying] = useState(false);
  useEffect(() => {
    if (step !== 'casting') return;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setFlying(false)));
    return () => cancelAnimationFrame(id);
  }, [step]);
  const lineOut = step === 'ask' || step === 'wait' || step === 'bite';

  return (
    <ThemedPage theme={theme}>
    <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-6">
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context="cast-catch" />
      <GameTopRow onSettings={() => setSettingsOpen(true)} />

      {phase === 'welcome' && (
        <GameWelcome game={castCatchManifest} cover={pieceImage(theme, 'cover')} onStart={() => setPhase('theme')} steps={[
          { icon: <HandGrabbing weight="fill" size={22} />, text: t('cc.how1') },
          { icon: <Question weight="bold" size={22} />, text: t('cc.how2') },
          { icon: <FishIcon weight="fill" size={22} />, text: t('cc.how3') },
        ]} />
      )}
      {phase === 'theme' && <ThemeScreen gameName={castCatchManifest.name} current={theme} themes={themes} playable={playable} onChoose={choose} onBack={() => setPhase('welcome')} onNext={() => setPhase('setup')} />}
      {phase === 'setup' && (
        <SetupWizard onBack={() => setPhase('theme')} onPlay={begin} pages={[
          ...(game.assigned ? [] : [{ id: 'questions', title: t('setup.questions'), content: <SetPicker sets={sets} value={[setId]} onChange={(ids) => change({ setId: ids[0] })} /> }]),
          { id: 'options', title: t('setup.options'), content: <Slider label={t('cc.minutes')} min={1} max={10} value={setup.minutes} show={(v) => t('cc.minutesValue', { count: v })} onChange={(v) => change({ minutes: v })} /> },
        ]} />
      )}

      {(phase === 'play' || phase === 'end') && (
        <section className="grid gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 bg-surface border-[2.5px] border-border rounded-pill px-4 min-h-11 font-display text-xl tabular-nums" aria-label={t('cc.timeLeft', { s: left })}><Timer weight="bold" size={22} />{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</span>
            <span className="inline-flex items-center gap-1.5 bg-surface border-[2.5px] border-border rounded-pill px-4 min-h-11 font-display text-xl tabular-nums" aria-label={t('cc.points', { count: score })}>{score} {t('cc.pts')}</span>
            <span className="inline-flex items-center gap-1.5 bg-surface border-[2.5px] border-border rounded-pill px-4 min-h-11 font-display text-xl" aria-label={t('cc.caught', { count: catches.length })}><FishIcon weight="fill" size={22} />{catches.length}</span>
          </div>

          <div className="relative overflow-hidden rounded-panel border-[2.5px] border-border select-none" style={{ height: 'calc(100dvh - 350px)', minHeight: 220, ...(theme.pieces.background?.image ? pieceFill(theme, 'background', '#5aa9d6') : { background: 'linear-gradient(180deg, #cfe9ff 0%, #cfe9ff 28%, #5aa9d6 28%, #2f6fb0 100%)' }) }}>
            {!still && [0, 1, 2].map((i) => (
              <span key={i} className="absolute h-1.5 rounded-pill bg-white/50" style={{ top: `${40 + i * 18}%`, width: '18%', animation: `cc-swim-right ${9 + i * 3}s linear ${-i * 4}s infinite` }} aria-hidden="true" />
            ))}
            <span className="absolute right-[8%] top-[4%] w-[9%] aspect-square rounded-full border-[2.5px] border-border" style={{ background: '#fdfd94' }} aria-hidden="true" />
            {[[12, 6, 16], [52, 10, 12]].map(([x, y, w], i) => (
              <span key={`c${i}`} className="absolute h-[7%] rounded-pill bg-white border-[2px] border-border" style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, animation: still ? undefined : `cc-drift ${18 + i * 6}s ease-in-out infinite` }} aria-hidden="true" />
            ))}
            {!still && [0, 1, 2].map((i) => (
              <span key={`f${i}`} className="absolute opacity-25" style={{ top: `${58 + i * 11}%`, animation: `${i % 2 ? 'cc-swim-left' : 'cc-swim-right'} ${14 + i * 4}s linear ${-i * 5}s infinite` }} aria-hidden="true">
                <svg width="70" height="34" viewBox="0 0 100 50" style={{ transform: i % 2 ? 'none' : 'scaleX(-1)' }}><path d="M78 25 L98 8 L94 25 L98 42 Z M44 5 a38 20 0 1 0 0.1 0 Z" fill="#0b2a4a" /></svg>
              </span>
            ))}
            {/* dock and rod */}
            <span className="absolute left-0 bottom-0 w-[22%] h-[38%] border-t-[3px] border-r-[3px] border-border rounded-tr-xl" style={{ background: '#b98552' }} aria-hidden="true" />
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <line x1="12" y1="62" x2="24" y2={step === 'power' ? 28 + power * 6 : 30} stroke="#5b3a1e" strokeWidth="6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              <circle cx="14" cy="57" r="1.6" fill="#314677" stroke="#000" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              {lineOut && <line x1="24" y1="30" x2={bobberLeft} y2={step === 'bite' ? 52 : 46} stroke="#000" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />}
            </svg>
            {(step === 'casting' || lineOut) && (
              <span className="absolute w-9 h-9 -ml-[18px] -mt-[18px]" aria-hidden="true"
                style={{ left: `${flying ? 24 : bobberLeft}%`, top: `${flying ? 30 : 46}%`, transition: still ? 'none' : 'left 0.7s ease-out, top 0.7s cubic-bezier(0.3, -0.8, 0.7, 1)' }}>
                <span className="block w-full h-full rounded-full border-[2.5px] border-border" style={{ ...pieceFill(theme, 'bobber', '#e5635f'), animation: still || step === 'casting' ? undefined : step === 'bite' ? 'cc-bite 0.5s ease-in-out infinite' : 'cc-bob 2s ease-in-out infinite' }} />
              </span>
            )}
            <AnimatePresence>
              {last && (
                <motion.div key={catches.length} className="absolute inset-x-0 top-[8%] mx-auto w-[min(90%,420px)] bg-surface border-[3px] border-border rounded-panel p-4 grid gap-1 justify-items-center text-center"
                  style={{ boxShadow: 'var(--shadow-sticker-lg)' }} initial={still ? false : { y: 120, scale: 0.6, rotate: -8 }} animate={{ y: 0, scale: 1, rotate: 0 }} exit={{ opacity: 0 }} role="status">
                  <FishArt fish={last.fish} size={140} />
                  <p className="font-display text-2xl">{t('cc.youCaught', { name: last.fish.name, cm: last.cm })}</p>
                  <p className="font-bold">+{last.points} {t('cc.pts')} · {t(`cc.rarity.${last.fish.rarity}` as 'cc.rarity.0')}</p>
                  <p className="text-sm font-semibold">{last.fish.fact}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {phase === 'play' && (
            <div className="grid gap-2 justify-items-center min-h-24">
              {step === 'ready' && !timeUp && <BigButton onClick={startPower} label={t('cc.cast')} />}
              {step === 'power' && (
                <>
                  <div className="relative w-full max-w-md h-6 rounded-pill border-[2.5px] border-border overflow-hidden" style={{ background: 'linear-gradient(90deg, #ed9d75 0%, #fdfd94 38%, #9fe7a0 50%, #9fe7a0 74%, #fdfd94 86%, #ed9d75 100%)' }} role="meter" aria-label={t('cc.meter')} aria-valuenow={Math.round(power * 100)} aria-valuemin={0} aria-valuemax={100}>
                    <span className="absolute top-0 bottom-0 w-1.5 bg-black" style={{ left: `calc(${power * 100}% - 3px)` }} />
                  </div>
                  <BigButton onClick={() => void stopPower()} label={t('cc.stop')} />
                </>
              )}
              {step === 'casting' && <p className="font-display text-2xl stage-text" role="status">{qualityWord[quality.current]}</p>}
              {step === 'wait' && <p className="font-display text-2xl stage-text" role="status">{t('cc.waiting')}</p>}
              {step === 'bite' && <BigButton onClick={reel} label={t('cc.reel')} pulse={!still} />}
              {timeUp && step === 'ready' && <p className="font-display text-2xl stage-text">{t('cc.timeUp')}</p>}
            </div>
          )}
        </section>
      )}

      {phase === 'end' && (
        <ResultsModal title={t('cc.done', { count: score })} missed={missed} againLabel={t('share.again')} onAgain={() => setPhase('welcome')}>
          <p className="font-bold">{t('cc.summary', { count: catches.length })}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {catches.slice().sort((a, b) => b.points - a.points).slice(0, 6).map((c, i) => (
              <span key={i} className="grid justify-items-center text-xs font-bold"><FishArt fish={c.fish} size={56} />{c.fish.name}</span>
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
      className="min-h-16 px-12 rounded-pill border-[2.5px] border-border bg-accent font-display text-3xl active:scale-95" style={{ boxShadow: 'var(--shadow-sticker)' }}>
      {label}
    </motion.button>
  );
}
