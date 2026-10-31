import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { CastleTurret as Castle, Diamond, Play, Question, Trash, ArrowFatUp, X } from '@phosphor-icons/react';
import { useMySets } from '../../data/hooks';
import { LIBRARY } from '../../data/library';
import { buzz, playEffect } from '../../engine/feedback';
import ResultsModal from '../../engine/ResultsModal';
import { useAsk } from '../../engine/useAsk';
import { usePowerUps } from '../../engine/usePowerUps';
import { t } from '../../i18n';
import { GameTopRow, SettingsPanel } from '../../settings/SettingsPanel';
import { useSettings } from '../../settings/SettingsContext';
import { useGamePool } from '../../student/session';
import { pieceColor, pieceFill, pieceImage } from '../../theme/library';
import type { GameTheme } from '../../theme/types';
import { ThemedPage, useGameTheme } from '../../theme/useGameTheme';
import { Slider, Toggle } from '../../ui/fields';
import DialogFocus from '../../ui/DialogFocus';
import Title from '../../ui/Title';
import GameWelcome from '../GameWelcome';
import SetPicker from '../SetPicker';
import SetupWizard from '../SetupWizard';
import ThemeScreen from '../ThemeScreen';
import { useSavedSetup } from '../useSavedSetup';
import { castleGuardManifest } from './manifest';
import { CASTLE, GEMS_PER_RIGHT, H, makeWave, PATH, pointAt, SLOTS, step, TOWER_KINDS, TOWERS, W, waveDone, type Tower, type TowerKind, type Wave } from './castle';

type Phase = 'welcome' | 'theme' | 'setup' | 'play' | 'end';
type Stage = 'gate' | 'build' | 'wave';
const TICK = 0.1;
const TOWER_COLOR: Record<TowerKind, string> = { bubble: '#8ec5ff', splash: '#9fe7a0', snow: '#ffffff' };
const CRITTER_COLOR = ['#c9a3f5', '#f6a5c0', '#f6c544'];
const pct = (x: number, y: number) => ({ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` });

export default function CastleGuard() {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const { theme, themes, playable, choose } = useGameTheme('castle-guard');
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const [setup, change] = useSavedSetup('castle-guard', { setId: LIBRARY[0].id, waves: 5, perBreak: 2, powerUps: true });
  const setId = sets.some((s) => s.id === setup.setId) ? setup.setId : LIBRARY[0].id;
  const chosen = useMemo(() => sets.filter((s) => s.id === setId).map((set) => ({ set, starred: false })), [sets, setId]);
  const game = useGamePool(chosen);
  const { ask, element, missed } = useAsk({ gameId: 'castle-guard', mode: 'solo', pool: game.pool, classroomId: game.classroomId, studentId: game.studentId });
  const powers = usePowerUps(castleGuardManifest, theme, setup.powerUps);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('welcome');
  const [stage, setStage] = useState<Stage>('gate');
  const [waveNo, setWaveNo] = useState(1);
  const [gems, setGems] = useState(0);
  const [score, setScore] = useState(0);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [wave, setWave] = useState<Wave | null>(null);
  const [pick, setPick] = useState<number | null>(null);
  const [banner, setBanner] = useState<{ id: number; text: string } | null>(null);
  const [wobble, setWobble] = useState(0);
  const slowNext = useRef(false);
  const plan = useRef({ waves: 5, perBreak: 2 });
  const spent = useRef<Record<number, number>>({});

  function start() {
    plan.current = { waves: setup.waves, perBreak: setup.perBreak };
    setTowers([]); spent.current = {}; setGems(0); setScore(0); setWaveNo(1); setWave(null); slowNext.current = false;
    setPhase('play');
    void gate(1);
  }
  async function gate(n: number) {
    setStage('gate');
    const ok = await ask({ count: plan.current.perBreak });
    if (!ok) { finish(); return; }
    let earned = GEMS_PER_RIGHT * plan.current.perBreak;
    const it = powers.grant();
    if (it?.ability === 'gems') earned += powers.amount(it);
    if (it?.ability === 'bonus') setScore((s) => s + powers.amount(it));
    if (it?.ability === 'slow') slowNext.current = true;
    setGems((g) => g + earned);
    setBanner({ id: Date.now(), text: t('cg.earned', { n: earned }) });
    window.setTimeout(() => setBanner(null), 1600);
    setWaveNo(n);
    setStage('build');
  }
  function finish() {
    setPhase('end');
    playEffect('win', settings);
    if (settings.celebrations !== 'off' && !still) void confetti({ particleCount: 90, spread: 90, origin: { y: 0.5 }, disableForReducedMotion: true });
  }
  function startWave() {
    setPick(null);
    setWave(makeWave(waveNo, slowNext.current));
    slowNext.current = false;
    setStage('wave');
    playEffect('whoosh', settings);
  }

  // The wave runs on its own; questions never happen while critters walk.
  const live = useRef({ wave, towers });
  live.current = { wave, towers };
  useEffect(() => {
    if (stage !== 'wave') return;
    const id = window.setInterval(() => {
      const cur = live.current;
      if (!cur.wave) return;
      const next = step(cur.wave, cur.towers, TICK);
      if (next.wave.home > cur.wave.home) { playEffect('right', settings); buzz(15, settings); }
      if (next.wave.snuck > cur.wave.snuck) setWobble((w) => w + 1);
      setWave(next.wave); setTowers(next.towers);
      if (waveDone(next.wave)) {
        window.clearInterval(id);
        setScore((s) => s + next.wave.home);
        setBanner({ id: Date.now(), text: t('cg.waveDone', { home: next.wave.home, snuck: next.wave.snuck }) });
        window.setTimeout(() => {
          setBanner(null); setWave(null);
          if (waveNo >= plan.current.waves) finish(); else void gate(waveNo + 1);
        }, still ? 900 : 1800);
      }
    }, TICK * 1000);
    return () => window.clearInterval(id);
  }, [stage, waveNo]); // eslint-disable-line react-hooks/exhaustive-deps

  const towerAt = (slot: number) => towers.find((tw) => tw.slot === slot);
  function build(slot: number, kind: TowerKind) {
    const cost = TOWERS[kind].cost[0];
    if (gems < cost) return;
    setGems(gems - cost); spent.current[slot] = cost;
    setTowers([...towers, { slot, kind, tier: 1, wait: 0 }]);
    playEffect('tap', settings); setPick(null);
  }
  function upgrade(slot: number) {
    const tw = towerAt(slot);
    if (!tw || tw.tier >= 3) return;
    const cost = TOWERS[tw.kind].cost[tw.tier as 1 | 2];
    if (gems < cost) return;
    setGems(gems - cost); spent.current[slot] = (spent.current[slot] ?? 0) + cost;
    setTowers(towers.map((x) => (x.slot === slot ? { ...x, tier: (x.tier + 1) as 2 | 3 } : x)));
    playEffect('right', settings); setPick(null);
  }
  function remove(slot: number) {
    setGems(gems + (spent.current[slot] ?? 0)); delete spent.current[slot];
    setTowers(towers.filter((x) => x.slot !== slot)); setPick(null);
  }

  const picked = pick === null ? null : towerAt(pick);
  return (
    <ThemedPage theme={theme} menu={phase !== 'play' && phase !== 'end'}>
    <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-6">
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context="castle-guard" />
      <GameTopRow onSettings={() => setSettingsOpen(true)}>
        {(phase === 'play' || phase === 'end') && <h1 className="title-bubble text-3xl sm:text-4xl"><Title text={castleGuardManifest.name} /></h1>}
      </GameTopRow>

      {phase === 'welcome' && (
        <GameWelcome game={castleGuardManifest} cover={pieceImage(theme, 'cover')} onStart={() => setPhase(themes.length > 1 ? 'theme' : 'setup')} steps={[
          { icon: <Question weight="bold" size={22} />, text: t('cg.how1') },
          { icon: <Castle weight="fill" size={22} />, text: t('cg.how2') },
          { icon: <Play weight="fill" size={22} />, text: t('cg.how3') },
        ]} />
      )}
      {phase === 'theme' && (
        <ThemeScreen gameName={castleGuardManifest.name} current={theme} themes={themes} playable={playable} onChoose={choose} onBack={() => setPhase('welcome')} onNext={() => setPhase('setup')} />
      )}
      {phase === 'setup' && (
        <SetupWizard onBack={() => setPhase(themes.length > 1 ? 'theme' : 'welcome')} onPlay={start} pages={[
          ...(game.assigned ? [] : [{ id: 'questions', title: t('setup.questions'), content: <SetPicker sets={sets} value={[setId]} onChange={(ids) => change({ setId: ids[0] })} /> }]),
          { id: 'options', title: t('setup.options'), content: (
            <>
              <Slider label={t('cg.waves')} min={3} max={8} value={setup.waves} onChange={(v) => change({ waves: v })} />
              <Slider label={t('cg.perBreak')} min={1} max={4} value={setup.perBreak} onChange={(v) => change({ perBreak: v })} />
              <Toggle label={t('pu.toggle')} hint={t('pu.toggleHint')} value={setup.powerUps} onChange={(v) => change({ powerUps: v })} />
            </>
          ) },
        ]} />
      )}

      {(phase === 'play' || phase === 'end') && (
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center gap-2 bg-surface border-[2.5px] border-border rounded-panel px-4 py-2" style={{ boxShadow: 'var(--shadow-sticker)' }}>
            <span className="font-display text-xl flex-1 min-w-40" aria-live="polite">{stage === 'build' ? t('cg.build') : stage === 'wave' ? t('cg.watch') : t('cg.answer')}</span>
            <span className="inline-flex items-center gap-1.5 font-display text-2xl" aria-label={t('cg.gems', { n: gems })}><GemArt theme={theme} size={30} />{gems}</span>
            <span className="font-bold">{t('cg.waveOf', { n: waveNo, total: plan.current.waves })}</span>
            <span className="font-bold">{t('cg.home', { n: score })}</span>
            {stage === 'build' && phase === 'play' && <button type="button" onClick={startWave} className="min-h-12 px-5 rounded-pill border-[2.5px] border-border bg-accent font-display text-xl inline-flex items-center gap-2" style={{ boxShadow: 'var(--shadow-sticker)' }}><Play weight="fill" size={22} />{t('cg.start')}</button>}
          </div>

          <div className="relative mx-auto w-full rounded-panel border-[3px] border-border overflow-hidden select-none"
            style={{ ...pieceFill(theme, 'background', '#9fd88a'), aspectRatio: `${W} / ${H}`, maxWidth: `min(100%, calc((100dvh - 16.875rem + var(--chrome-save, 0rem)) * ${W / H}))` }}>
            <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" role="img" aria-label={t('cg.board', { n: wave?.critters.filter((c) => c.delay <= 0).length ?? 0 })}>
              {!pieceImage(theme, 'background') && [[8, 50], [20, 4], [48, 8], [36, 58], [72, 58], [95, 10], [8, 34]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3.2} fill="#5fae5a" stroke="#000" strokeWidth={0.4} />)}
              <polyline points={PATH.map((p) => p.join(',')).join(' ')} fill="none" stroke="#000" strokeWidth={9.6} strokeLinejoin="round" />
              <polyline points={PATH.map((p) => p.join(',')).join(' ')} fill="none" stroke={pieceColor(theme, 'road', '#e8c48f')} strokeWidth={8} strokeLinejoin="round" />
              <AnimatePresence>
                {wave?.shots.map((s, i) => (
                  <motion.circle key={`${waveNo}-${i}-${s.to[0].toFixed(1)}`} cx={s.to[0]} cy={s.to[1]} r={2.2} fill={TOWER_COLOR[s.kind]} stroke="#000" strokeWidth={0.3}
                    initial={still ? false : { cx: s.from[0], cy: s.from[1], opacity: 1 }} animate={{ cx: s.to[0], cy: s.to[1], opacity: 0.2 }} transition={{ duration: 0.25 }} />
                ))}
              </AnimatePresence>
            </svg>
            {/* The castle wobbles when a critter sneaks in; nothing breaks. */}
            <motion.div key={wobble} className="absolute -translate-x-1/2 -translate-y-1/2 w-[16%] aspect-square" style={pct(CASTLE[0], CASTLE[1] - 2)}
              animate={still || !wobble ? {} : { rotate: [0, -5, 5, 0] }} transition={{ duration: 0.4 }}>
              {pieceImage(theme, 'castle') ? <img src={pieceImage(theme, 'castle')} alt={t('cg.castle')} className="w-full h-full object-contain" /> : <CastleArt />}
            </motion.div>
            {SLOTS.map(([x, y], i) => {
              const tw = towerAt(i);
              return (
                <button key={i} type="button" disabled={stage !== 'build' || phase !== 'play'} onClick={() => setPick(i)}
                  aria-label={tw ? t('cg.towerHere', { n: i + 1, kind: t(`cg.tower.${tw.kind}`), tier: tw.tier }) : t('cg.emptySpot', { n: i + 1 })}
                  className={`absolute -translate-x-1/2 -translate-y-[70%] w-[11%] aspect-[4/5] flex items-end justify-center ${stage === 'build' && !tw ? 'motion-safe:animate-pulse' : ''}`} style={pct(x, y)}>
                  {tw ? <TowerArt theme={theme} kind={tw.kind} tier={tw.tier} /> : <span className="w-[80%] aspect-square rounded-full border-[3px] border-dashed border-border bg-white/70 flex items-center justify-center font-display text-lg">+</span>}
                </button>
              );
            })}
            {wave?.critters.filter((c) => c.delay <= 0).map((c) => {
              const [x, y] = pointAt(c.t);
              return (
                <div key={c.id} className="absolute -translate-x-1/2 -translate-y-1/2 w-[7%] aspect-square pointer-events-none" style={{ ...pct(x, y), transition: still ? 'none' : `left ${TICK}s linear, top ${TICK}s linear` }} aria-hidden="true">
                  <CritterArt theme={theme} look={c.look} slow={c.slow > 0} />
                  <span className="absolute -top-[18%] left-[10%] right-[10%] h-[12%] rounded-pill bg-white border border-border overflow-hidden"><span className="block h-full bg-[#7dd3a8]" style={{ width: `${(c.hp / c.max) * 100}%` }} /></span>
                </div>
              );
            })}
            <AnimatePresence>
              {banner && (
                <motion.p key={banner.id} className="absolute inset-x-0 top-[38%] text-center font-display text-3xl sm:text-5xl text-white pointer-events-none" style={{ WebkitTextStroke: '2px #000' }}
                  initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} role="status">{banner.text}</motion.p>
              )}
            </AnimatePresence>
          </div>
          {/* Portrait screens have room under the board: what each tower does. */}
          <ul className="hidden portrait:grid grid-cols-3 gap-2 list-none p-0 m-0" aria-label={t('cg.guide')}>
            {TOWER_KINDS.map((k) => (
              <li key={k} className="bg-surface border-[2.5px] border-border rounded-panel p-3 grid justify-items-center gap-1 text-center" style={{ boxShadow: 'var(--shadow-sticker)' }}>
                <span className="w-14 h-16 flex items-end justify-center"><TowerArt theme={theme} kind={k} tier={1} /></span>
                <span className="font-display text-lg">{t(`cg.tower.${k}`)}</span>
                <span className="text-sm font-semibold">{t(`cg.towerHint.${k}`)}</span>
                <span className="inline-flex items-center gap-1 font-bold"><GemArt theme={theme} size={18} />{TOWERS[k].cost[0]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {pick !== null && stage === 'build' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45" role="dialog" aria-modal="true" aria-label={picked ? t('cg.changeTower') : t('cg.pickTower')}>
          <DialogFocus onClose={() => setPick(null)} />
          <div className="bg-surface border-[3px] border-border rounded-panel p-5 grid gap-3 w-full max-w-lg" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-2xl flex-1">{picked ? t('cg.changeTower') : t('cg.pickTower')}</h2>
              <button type="button" onClick={() => setPick(null)} aria-label={t('class.close')} className="w-11 h-11 rounded-full border-[2px] border-border bg-surface-2 flex items-center justify-center"><X weight="bold" size={20} /></button>
            </div>
            {!picked ? (
              <div className="grid sm:grid-cols-3 gap-2">
                {TOWER_KINDS.map((k) => {
                  const cost = TOWERS[k].cost[0];
                  return (
                    <button key={k} type="button" disabled={gems < cost} onClick={() => build(pick, k)}
                      className="rounded-input border-[2.5px] border-border bg-surface-2 p-2 grid justify-items-center gap-1 text-center disabled:opacity-45">
                      <span className="w-16 h-20 flex items-end justify-center"><TowerArt theme={theme} kind={k} tier={1} /></span>
                      <span className="font-display text-lg">{t(`cg.tower.${k}`)}</span>
                      <span className="text-sm font-semibold">{t(`cg.towerHint.${k}`)}</span>
                      <span className="inline-flex items-center gap-1 font-bold"><GemArt theme={theme} size={20} />{cost}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid gap-2">
                <p className="font-bold">{t('cg.towerHere', { n: pick + 1, kind: t(`cg.tower.${picked.kind}`), tier: picked.tier })}</p>
                {picked.tier < 3 && (
                  <button type="button" disabled={gems < TOWERS[picked.kind].cost[picked.tier as 1 | 2]} onClick={() => upgrade(pick)}
                    className="min-h-14 px-4 rounded-pill border-[2.5px] border-border bg-accent font-display text-xl inline-flex items-center justify-center gap-2 disabled:opacity-45">
                    <ArrowFatUp weight="fill" size={22} />{t('cg.upgrade')} <GemArt theme={theme} size={22} />{TOWERS[picked.kind].cost[picked.tier as 1 | 2]}
                  </button>
                )}
                <button type="button" onClick={() => remove(pick)} className="min-h-12 px-4 rounded-pill border-[2px] border-border bg-surface-2 font-bold inline-flex items-center justify-center gap-2">
                  <Trash weight="bold" size={18} />{t('cg.remove', { n: spent.current[pick] ?? 0 })}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {phase === 'end' && <ResultsModal title={t('cg.done', { n: score })} missed={missed} againLabel={t('share.again')} onAgain={() => setPhase('welcome')} />}
      {powers.element}
      {element}
    </main>
    </ThemedPage>
  );
}

function GemArt({ theme, size }: { theme: GameTheme; size: number }) {
  const img = pieceImage(theme, 'gem');
  return img ? <img src={img} alt="" style={{ width: size, height: size }} className="object-contain" /> : <Diamond weight="fill" size={size} color={pieceColor(theme, 'gem', '#8ec5ff')} className="drop-shadow-[0_0_1px_#000]" aria-hidden="true" />;
}

function TowerArt({ theme, kind, tier }: { theme: GameTheme; kind: TowerKind; tier: 1 | 2 | 3 }) {
  const img = pieceImage(theme, `tower-${kind}`);
  const h = 70 + tier * 10;
  if (img) return <img src={img} alt="" className="w-full object-contain" style={{ height: `${h}%` }} />;
  return (
    <svg viewBox="0 0 40 50" className="w-full" style={{ height: `${h}%` }} aria-hidden="true">
      <rect x="10" y="18" width="20" height="30" rx="2" fill="#d9d4c7" stroke="#000" strokeWidth="1.5" />
      {Array.from({ length: tier }, (_, i) => <rect key={i} x="12" y={22 + i * 7} width="16" height="3" fill="#b8b2a3" />)}
      <path d="M8 18 H32 V12 H28 V15 H24 V12 H16 V15 H12 V12 H8 Z" fill="#d9d4c7" stroke="#000" strokeWidth="1.5" />
      <circle cx="20" cy="8" r="6" fill={TOWER_COLOR[kind]} stroke="#000" strokeWidth="1.5" />
      {kind === 'snow' && <path d="M20 4 V12 M16 8 H24" stroke="#6aa9e9" strokeWidth="1.5" />}
      {kind === 'splash' && <path d="M15 8 Q20 3 25 8" fill="none" stroke="#1f7a45" strokeWidth="1.5" />}
    </svg>
  );
}

function CritterArt({ theme, look, slow }: { theme: GameTheme; look: number; slow: boolean }) {
  const img = pieceImage(theme, `critter-${look + 1}`);
  if (img) return <img src={img} alt="" className="w-full h-full object-contain" style={slow ? { filter: 'hue-rotate(160deg)' } : undefined} />;
  return (
    <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
      <path d="M6 30 Q4 10 20 8 Q36 10 34 30 Q34 36 20 36 Q6 36 6 30 Z" fill={CRITTER_COLOR[look]} stroke="#000" strokeWidth="2" />
      <circle cx="15" cy="20" r="3" fill="#fff" stroke="#000" strokeWidth="1" /><circle cx="25" cy="20" r="3" fill="#fff" stroke="#000" strokeWidth="1" />
      <circle cx="15.5" cy="20.5" r="1.4" fill="#000" /><circle cx="25.5" cy="20.5" r="1.4" fill="#000" />
      <path d="M16 27 Q20 30 24 27" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
      {slow && <path d="M8 12 L12 8 M32 12 L28 8" stroke="#6aa9e9" strokeWidth="2" />}
    </svg>
  );
}

function CastleArt() {
  return (
    <svg viewBox="0 0 60 60" className="w-full h-full" aria-hidden="true">
      <rect x="8" y="24" width="44" height="32" fill="#ece7da" stroke="#000" strokeWidth="2" />
      <path d="M8 24 V16 H14 V20 H20 V16 H26 V20 H34 V16 H40 V20 H46 V16 H52 V24" fill="#ece7da" stroke="#000" strokeWidth="2" />
      <path d="M24 56 V42 Q30 34 36 42 V56 Z" fill="#9c6b45" stroke="#000" strokeWidth="2" />
      <path d="M30 16 V4 L40 7 L30 10" fill="#f2735f" stroke="#000" strokeWidth="1.5" />
    </svg>
  );
}
