import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Drop, Moon, Plant, Question, Shovel } from '@phosphor-icons/react';
import { useMySets } from '../../data/hooks';
import { LIBRARY } from '../../data/library';
import { buzz, playEffect, speak } from '../../engine/feedback';
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
import Title from '../../ui/Title';
import GameWelcome from '../GameWelcome';
import SetPicker from '../SetPicker';
import SetupWizard from '../SetupWizard';
import ThemeScreen from '../ThemeScreen';
import { useSavedSetup } from '../useSavedSetup';
import { farmGrowManifest } from './manifest';
import { CROPS, doJob, emptyField, FACTS, jobFor, overnight, type Crop, type Plot } from './farm';

type Phase = 'welcome' | 'theme' | 'setup' | 'play' | 'end';
type Stage = 'gate' | 'work' | 'night';
const JOBS_PER_RIGHT = 2;
const POINTS_PER_CROP = 3;
const CROP_COLOR: Record<Crop, string> = { corn: '#f6c544', pumpkin: '#f39a6b', sunflower: '#ffd84d', tomato: '#e5635f' };

export default function FarmGrow() {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const { theme, themes, playable, choose } = useGameTheme('farm-grow');
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const [setup, change] = useSavedSetup('farm-grow', { setId: LIBRARY[0].id, days: 6, perBreak: 2, powerUps: true });
  const setId = sets.some((s) => s.id === setup.setId) ? setup.setId : LIBRARY[0].id;
  const chosen = useMemo(() => sets.filter((s) => s.id === setId).map((set) => ({ set, starred: false })), [sets, setId]);
  const game = useGamePool(chosen);
  const { ask, element, missed } = useAsk({ gameId: 'farm-grow', mode: 'solo', pool: game.pool, classroomId: game.classroomId, studentId: game.studentId });
  const powers = usePowerUps(farmGrowManifest, theme, setup.powerUps);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('welcome');
  const [stage, setStage] = useState<Stage>('gate');
  const [day, setDay] = useState(1);
  const [days, setDays] = useState(6);
  const [jobs, setJobs] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(0);
  const [field, setField] = useState<Plot[]>(emptyField);
  const [seed, setSeed] = useState<Crop>('corn');
  const [banner, setBanner] = useState<{ id: number; text: string; crop?: Crop } | null>(null);

  function show(text: string, crop?: Crop, ms = 1800) {
    const id = Date.now();
    setBanner({ id, text, crop });
    window.setTimeout(() => setBanner((b) => (b?.id === id ? null : b)), ms);
  }
  function start() {
    setDays(setup.days);
    setField(emptyField()); setScore(0); setPicked(0); setDay(1); setJobs(0);
    setPhase('play');
    void morning(1);
  }
  async function morning(n: number) {
    setDay(n);
    setStage('gate');
    const ok = await ask({ count: setup.perBreak });
    if (!ok) { finish(); return; }
    let earned = JOBS_PER_RIGHT * setup.perBreak;
    const it = powers.grant();
    if (it?.ability === 'jobs') earned += powers.amount(it);
    if (it?.ability === 'bonus') setScore((s) => s + powers.amount(it));
    if (it?.ability === 'rain') setField((f) => f.map((p) => (p.crop && p.stage < 3 ? { ...p, watered: true } : p)));
    setJobs(earned);
    show(t('fg.earned', { n: earned }));
    setStage('work');
  }
  function finish() {
    setPhase('end');
    playEffect('win', settings);
    if (settings.celebrations !== 'off' && !still) void confetti({ particleCount: 90, spread: 90, origin: { y: 0.5 }, disableForReducedMotion: true });
  }
  function tap(i: number) {
    if (stage !== 'work' || jobs <= 0) return;
    const r = doJob(field, i, seed);
    if (r.job === 'wait') { show(t('fg.waiting'), undefined, 1200); return; }
    setField(r.field);
    setJobs(jobs - 1);
    buzz(10, settings);
    if (r.harvested) {
      setScore((s) => s + POINTS_PER_CROP); setPicked((p) => p + 1);
      playEffect('right', settings);
      show(FACTS[r.harvested], r.harvested, 3200);
      speak(FACTS[r.harvested], settings);
      if (settings.celebrations !== 'off' && !still) void confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 }, disableForReducedMotion: true });
    } else playEffect('tap', settings);
  }
  function endDay() {
    setStage('night');
    playEffect('whoosh', settings);
    window.setTimeout(() => {
      setField((f) => overnight(f));
      if (day >= days) { finish(); return; }
      void morning(day + 1);
    }, still ? 700 : 1800);
  }

  const ripe = field.some((p) => p.stage === 3);
  const tip = stage === 'gate' ? t('fg.answer') : stage === 'night' ? t('fg.night') : jobs > 0 ? t('fg.work') : t('fg.noJobs');
  return (
    <ThemedPage theme={theme}>
    <main className="landscape:[--wide-save:1rem] max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-6">
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context="farm-grow" />
      <GameTopRow onSettings={() => setSettingsOpen(true)}>
        {(phase === 'play' || phase === 'end') && <h1 className="title-bubble text-3xl sm:text-4xl"><Title text={farmGrowManifest.name} /></h1>}
      </GameTopRow>

      {phase === 'welcome' && (
        <GameWelcome game={farmGrowManifest} cover={pieceImage(theme, 'cover')} onStart={() => setPhase(themes.length > 1 ? 'theme' : 'setup')} steps={[
          { icon: <Question weight="bold" size={22} />, text: t('fg.how1') },
          { icon: <Plant weight="fill" size={22} />, text: t('fg.how2') },
          { icon: <Moon weight="fill" size={22} />, text: t('fg.how3') },
        ]} />
      )}
      {phase === 'theme' && (
        <ThemeScreen gameName={farmGrowManifest.name} current={theme} themes={themes} playable={playable} onChoose={choose} onBack={() => setPhase('welcome')} onNext={() => setPhase('setup')} />
      )}
      {phase === 'setup' && (
        <SetupWizard onBack={() => setPhase(themes.length > 1 ? 'theme' : 'welcome')} onPlay={start} pages={[
          ...(game.assigned ? [] : [{ id: 'questions', title: t('setup.questions'), content: <SetPicker sets={sets} value={[setId]} onChange={(ids) => change({ setId: ids[0] })} /> }]),
          { id: 'options', title: t('setup.options'), content: (
            <>
              <Slider label={t('fg.days')} min={4} max={10} value={setup.days} onChange={(v) => change({ days: v })} />
              <Slider label={t('fg.perBreak')} min={1} max={4} value={setup.perBreak} onChange={(v) => change({ perBreak: v })} />
              <Toggle label={t('pu.toggle')} hint={t('pu.toggleHint')} value={setup.powerUps} onChange={(v) => change({ powerUps: v })} />
            </>
          ) },
        ]} />
      )}

      {(phase === 'play' || phase === 'end') && (
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center gap-2 bg-surface border-[2.5px] border-border rounded-panel px-4 py-2" style={{ boxShadow: 'var(--shadow-sticker)' }}>
            <span className="font-display text-xl flex-1 min-w-40" aria-live="polite">{tip}</span>
            <span className="inline-flex items-center gap-1.5 font-display text-2xl" aria-label={t('fg.jobs', { n: jobs })}><Shovel weight="fill" size={28} aria-hidden="true" />{jobs}</span>
            <span className="font-bold">{t('fg.dayOf', { n: day, total: days })}</span>
            <span className="font-bold">{t('fg.picked', { n: picked })}</span>
            {stage === 'work' && phase === 'play' && (
              <button type="button" onClick={endDay} className={`min-h-12 px-5 rounded-pill border-[2.5px] border-border font-display text-xl inline-flex items-center gap-2 ${jobs === 0 ? 'bg-accent motion-safe:animate-pulse' : 'bg-surface-2'}`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
                <Moon weight="fill" size={22} />{t('fg.endDay')}
              </button>
            )}
          </div>

          <div className="grid gap-3 landscape:grid-cols-[1fr_auto] items-start">
            <div className="relative mx-auto w-full rounded-panel border-[3px] border-border overflow-hidden select-none aspect-[4/3]"
              style={{ ...pieceFill(theme, 'background', '#bfe6a0'), maxWidth: 'min(100%, calc((100dvh - 17.625rem + var(--chrome-save, 0rem) + var(--wide-save, 0rem)) * 4 / 3))' }}>
              {!pieceImage(theme, 'background') && <div className="absolute inset-x-0 top-0 h-[16%] bg-[#bfe8ff] border-b-[3px] border-border" aria-hidden="true" />}
              <div className="absolute right-[3%] top-[2%] w-[16%] aspect-square" aria-hidden="true">
                {pieceImage(theme, 'barn') ? <img src={pieceImage(theme, 'barn')} alt="" className="w-full h-full object-contain" /> : <BarnArt />}
              </div>
              <div className="absolute left-[4%] right-[22%] top-[20%] bottom-[4%] grid grid-cols-3 grid-rows-3 gap-[3%]" role="group" aria-label={t('fg.field')}>
                {field.map((p, i) => {
                  const job = jobFor(p);
                  const can = stage === 'work' && phase === 'play' && jobs > 0 && job !== 'wait';
                  return (
                    <button key={i} type="button" onClick={() => tap(i)} disabled={stage !== 'work' || phase !== 'play'}
                      aria-label={plotLabel(i, p)}
                      className={`relative rounded-input border-[3px] border-border overflow-hidden ${can ? 'cursor-pointer' : ''}`}
                      style={{ background: pieceColor(theme, 'soil', '#b98a5e'), filter: p.watered ? 'brightness(0.78)' : undefined, boxShadow: can ? '0 0 0 3px #fdfd94' : undefined }}>
                      <span className="absolute inset-x-0 top-[30%] h-[6%] bg-black/15" aria-hidden="true" /><span className="absolute inset-x-0 top-[62%] h-[6%] bg-black/15" aria-hidden="true" />
                      <AnimatePresence>
                        {p.crop && (
                          <motion.span key={`${p.crop}-${p.stage}`} className="absolute inset-[6%] flex items-end justify-center" aria-hidden="true"
                            initial={still ? false : { scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 18 }}>
                            <CropArt theme={theme} crop={p.crop} stage={p.stage} />
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {p.watered && <Drop weight="fill" size={22} color="#6aa9e9" className="absolute top-1 right-1 drop-shadow-[0_0_1px_#000]" aria-hidden="true" />}
                      {can && <span className="absolute bottom-1 left-1 w-8 h-8 rounded-full bg-white border-[2px] border-border flex items-center justify-center" aria-hidden="true">{job === 'plant' ? <Plant weight="fill" size={18} /> : job === 'water' ? <Drop weight="fill" size={18} color="#3d7fd0" /> : <Shovel weight="fill" size={18} />}</span>}
                    </button>
                  );
                })}
              </div>
              <AnimatePresence>
                {stage === 'night' && (
                  <motion.div className="absolute inset-0 bg-[#241c3d]/70 flex items-center justify-center pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: still ? 0 : 0.5 }}>
                    <motion.span initial={still ? false : { y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}><Moon weight="fill" size={90} color="#fdfd94" aria-hidden="true" /></motion.span>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {banner && (
                  <motion.div key={banner.id} className="absolute inset-x-[6%] top-[34%] flex justify-center pointer-events-none" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} role="status">
                    {banner.crop ? (
                      <p className="bg-surface border-[3px] border-border rounded-panel px-4 py-3 font-display text-xl sm:text-2xl text-center max-w-md inline-flex items-center gap-3" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
                        <span className="w-14 h-14 shrink-0"><CropArt theme={theme} crop={banner.crop} stage={3} /></span>{banner.text}
                      </p>
                    ) : <p className="font-display text-3xl sm:text-5xl text-white text-center" style={{ WebkitTextStroke: '2px #000' }}>{banner.text}</p>}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="grid grid-cols-4 landscape:grid-cols-1 gap-2" role="radiogroup" aria-label={t('fg.seeds')}>
              {CROPS.map((c) => (
                <button key={c} type="button" role="radio" aria-checked={seed === c} onClick={() => { setSeed(c); playEffect('tap', settings); }}
                  className={`rounded-input border-[2.5px] border-border p-2 grid justify-items-center gap-0.5 font-display text-base landscape:w-24 ${seed === c ? 'bg-accent -translate-y-0.5' : 'bg-surface'}`}
                  style={{ boxShadow: seed === c ? 'var(--shadow-sticker)' : undefined }}>
                  <span className="w-12 h-12"><CropArt theme={theme} crop={c} stage={3} /></span>{t(`fg.crop.${c}`)}
                </button>
              ))}
              {ripe && stage === 'work' && <p className="col-span-4 landscape:col-span-1 text-sm font-bold text-center landscape:w-24">{t('fg.ripe')}</p>}
            </div>
          </div>
          {/* Tall portrait screens have room under the seeds: how a crop grows. */}
          <ol className="hidden [@media(orientation:portrait)_and_(min-height:1100px)]:grid grid-cols-4 gap-2 list-none p-0 m-0" aria-label={t('fg.guide')}>
            {([['plant', <Plant weight="fill" size={30} />], ['water', <Drop weight="fill" size={30} color="#3d7fd0" />], ['night', <Moon weight="fill" size={30} color="#241c3d" />], ['pick', <Shovel weight="fill" size={30} />]] as const).map(([k, icon], i) => (
              <li key={k} className="bg-surface border-[2.5px] border-border rounded-panel p-3 grid justify-items-center gap-1 text-center" style={{ boxShadow: 'var(--shadow-sticker)' }}>
                <span className="font-display text-lg">{i + 1}</span>{icon}
                <span className="text-sm font-semibold">{t(`fg.step.${k}`)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {phase === 'end' && <ResultsModal title={t('fg.done', { n: picked, points: score })} missed={missed} againLabel={t('share.again')} onAgain={() => setPhase('welcome')} />}
      {powers.element}
      {element}
    </main>
    </ThemedPage>
  );
}

function plotLabel(i: number, p: Plot): string {
  if (!p.crop) return t('fg.plotEmpty', { n: i + 1 });
  const crop = t(`fg.crop.${p.crop}`);
  if (p.stage === 3) return t('fg.plotRipe', { n: i + 1, crop });
  return t(p.watered ? 'fg.plotWatered' : 'fg.plotDry', { n: i + 1, crop, stage: p.stage + 1 });
}

function CropArt({ theme, crop, stage }: { theme: GameTheme; crop: Crop; stage: 0 | 1 | 2 | 3 }) {
  if (stage === 3) {
    const img = pieceImage(theme, `crop-${crop}`);
    if (img) return <img src={img} alt="" className="w-full h-full object-contain" />;
    return <RipeArt crop={crop} />;
  }
  if (stage === 0) {
    return <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true"><path d="M4 34 Q20 16 36 34 Z" fill="#8a6440" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />{[13, 20, 27].map((x, k) => <ellipse key={x} cx={x} cy={k === 1 ? 26 : 29} rx="2.4" ry="3.2" fill={CROP_COLOR[crop]} stroke="#000" strokeWidth="0.8" />)}</svg>;
  }
  const img = pieceImage(theme, 'sprout');
  if (img) return <img src={img} alt="" className="object-contain" style={{ width: stage === 1 ? '55%' : '85%', height: stage === 1 ? '55%' : '85%' }} />;
  const h = stage === 1 ? 14 : 24;
  return (
    <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
      <path d={`M20 36 V${36 - h}`} stroke="#2f7d32" strokeWidth="2.5" strokeLinecap="round" />
      <path d={`M20 ${36 - h * 0.5} Q10 ${30 - h * 0.6} 8 ${36 - h * 0.9} Q16 ${34 - h * 0.7} 20 ${36 - h * 0.5}`} fill="#7cc66a" stroke="#000" strokeWidth="1.2" />
      <path d={`M20 ${36 - h * 0.7} Q30 ${30 - h * 0.8} 32 ${36 - h * 1.05} Q24 ${34 - h * 0.9} 20 ${36 - h * 0.7}`} fill="#7cc66a" stroke="#000" strokeWidth="1.2" />
      {stage === 2 && <circle cx="20" cy={36 - h} r="3" fill={CROP_COLOR[crop]} stroke="#000" strokeWidth="1" />}
    </svg>
  );
}

function RipeArt({ crop }: { crop: Crop }) {
  return (
    <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
      {crop === 'corn' && <g><path d="M14 38 Q10 22 18 10 L20 38 Z M26 38 Q30 22 22 10 L20 38 Z" fill="#7cc66a" stroke="#000" strokeWidth="1.2" /><ellipse cx="20" cy="20" rx="5" ry="13" fill="#f6c544" stroke="#000" strokeWidth="1.5" />{[12, 17, 22, 27].map((y) => <path key={y} d={`M16 ${y} H24`} stroke="#c99a1f" strokeWidth="1" />)}</g>}
      {crop === 'pumpkin' && <g><path d="M20 12 Q22 6 26 6" fill="none" stroke="#2f7d32" strokeWidth="2.5" strokeLinecap="round" /><ellipse cx="20" cy="25" rx="15" ry="11" fill="#f39a6b" stroke="#000" strokeWidth="1.5" /><path d="M14 15 Q11 25 14 35 M26 15 Q29 25 26 35 M20 14 V36" fill="none" stroke="#c96a3b" strokeWidth="1.2" /></g>}
      {crop === 'sunflower' && <g><path d="M20 38 V22" stroke="#2f7d32" strokeWidth="2.5" />{Array.from({ length: 10 }, (_, k) => <ellipse key={k} cx="20" cy="8" rx="2.6" ry="5" fill="#ffd84d" stroke="#000" strokeWidth="0.8" transform={`rotate(${k * 36} 20 15)`} />)}<circle cx="20" cy="15" r="5.5" fill="#7a4a24" stroke="#000" strokeWidth="1.2" /></g>}
      {crop === 'tomato' && <g><path d="M20 38 V14" stroke="#2f7d32" strokeWidth="2.5" /><path d="M20 22 Q12 18 8 22 M20 18 Q28 14 32 18" fill="none" stroke="#2f7d32" strokeWidth="2" />{[[12, 28], [28, 26], [20, 13]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="6" fill="#e5635f" stroke="#000" strokeWidth="1.3" />)}</g>}
    </svg>
  );
}

function BarnArt() {
  return (
    <svg viewBox="0 0 60 60" className="w-full h-full" aria-hidden="true">
      <path d="M6 26 L30 8 L54 26 V56 H6 Z" fill="#e5635f" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <path d="M2 28 L30 6 L58 28" fill="none" stroke="#fbfcf8" strokeWidth="3" strokeLinecap="round" />
      <rect x="20" y="34" width="20" height="22" fill="#fbfcf8" stroke="#000" strokeWidth="2" />
      <path d="M20 34 L40 56 M40 34 L20 56" stroke="#e5635f" strokeWidth="2" />
    </svg>
  );
}
