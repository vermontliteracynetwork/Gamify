import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import type { ComponentType } from 'react';
import { ArrowLeft, Feather, Mountains, SpeakerHigh, Star, Target } from '@phosphor-icons/react';
import { FaceGreat, FaceNotGreat, FaceOkay } from '../ui/EmojiFace';
import { playEffect, speak } from '../engine/feedback';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { useSettings } from '../settings/SettingsContext';
import { Button, buttonClasses } from '../ui/kit';
import { FullScreenButton, GearButton, SettingsPanel } from '../settings/SettingsPanel';
import Title from '../ui/Title';
import { saveCheckIn } from './surveys';

type Tally = [number, number, number];
// The feel faces are smile emoji faces (teacher, 2026-11-24).
type Pic = ComponentType<{ size?: number | string; weight?: 'fill'; 'aria-hidden'?: 'true' | boolean }>;
const QUESTIONS: { key: 'feel' | 'level'; icons: Pic[]; colors: string[] }[] = [
  { key: 'feel', icons: [FaceGreat, FaceOkay, FaceNotGreat], colors: ['#fff1b8', '#bfdff3', '#ffd3e6'] },
  { key: 'level', icons: [Feather as Pic, Target as Pic, Mountains as Pic], colors: ['#ddd6ff', '#c8f0dc', '#ffd9b3'] },
];

// A class check-in the teacher runs on one screen (development plan, beta
// surveys): each student walks up and taps two pictures. No names, nothing
// about who tapped what; only the counts are kept.
export default function CheckInPage() {
  const { id = '' } = useParams();
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const [q, setQ] = useState(0);
  const [tallies, setTallies] = useState<{ feel: Tally; level: Tally }>({ feel: [0, 0, 0], level: [0, 0, 0] });
  const [thanks, setThanks] = useState(false);
  const [done, setDone] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const count = tallies.feel.reduce((a, b) => a + b, 0);
  const question = QUESTIONS[q];
  const prompt = t(`checkin.${question.key}` as StringKey);

  useEffect(() => { if (!done && !thanks) speak(prompt, settings); }, [q, thanks, done]); // eslint-disable-line react-hooks/exhaustive-deps

  function pick(i: number) {
    playEffect('tap', settings);
    setTallies((tl) => { const next = [...tl[question.key]] as Tally; next[i] += 1; return { ...tl, [question.key]: next }; });
    if (q === 0) { setQ(1); return; }
    setThanks(true);
    playEffect('right', settings);
    if (settings.celebrations !== 'off' && !still) void confetti({ particleCount: 40, spread: 70, origin: { y: 0.6 }, disableForReducedMotion: true });
    window.setTimeout(() => { setThanks(false); setQ(0); }, still ? 700 : 1600);
  }
  async function finish() {
    await saveCheckIn({ at: new Date().toISOString(), classroomId: id, feel: tallies.feel, level: tallies.level });
    setDone(true);
  }

  // One bar, the logo and the class tools only (approved /brand Class
  // check-in): students walk up to this screen, so nothing else to tap.
  const bar = (
    <div className="solo-bar no-print sticky top-0 z-50 h-14 flex items-center gap-2 px-4 sm:px-6 bg-white border-b-[2.5px] border-border">
      <Link to="/" aria-label={t('nav.home')} className="mr-auto flex items-center min-h-11"><img src="/brand/gamify-wordmark.png" alt="Gamify" className="h-7 sm:h-8 w-auto" draggable="false" /></Link>
      <GearButton small onClick={() => setSettingsOpen(true)} />
      <FullScreenButton small />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );

  if (done) {
    return (
      <>{bar}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-8 grid gap-4">
        <h1 className="title-bubble text-3xl sm:text-4xl"><Title text={t('checkin.results')} /></h1>
        <p className="font-bold">{t('checkin.count', { count })}</p>
        {QUESTIONS.map((qq) => {
          const tl = tallies[qq.key]; const max = Math.max(1, ...tl);
          return (
            <section key={qq.key} className="bg-surface border-bold border-border rounded-panel p-4 grid gap-2">
              <h2 className="font-bold">{t(`checkin.${qq.key}` as StringKey)}</h2>
              {qq.icons.map((I, i) => (
                <div key={i} className="grid grid-cols-[2.5rem_8rem_1fr_2.5rem] items-center gap-2 font-bold">
                  <I weight="fill" size={30} aria-hidden="true" /><span>{t(`checkin.${qq.key}.${i}` as StringKey)}</span>
                  <span className="h-4 rounded-pill bg-surface-2 border border-border overflow-hidden"><span className="block h-full" style={{ width: `${(tl[i] / max) * 100}%`, background: qq.colors[i] }} /></span>
                  <span className="tabular-nums text-right">{tl[i]}</span>
                </div>
              ))}
            </section>
          );
        })}
        <Link to={`/teacher/classes/${id}`} className={buttonClasses('secondary', 'justify-self-start')}><ArrowLeft weight="bold" size={18} />{t('checkin.back')}</Link>
      </main>
      </>
    );
  }

  return (
    <>{bar}
    <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-4 pb-6 grid gap-5 min-h-[calc(100dvh-3.5rem)] content-center">
      <div className="flex items-center gap-2 justify-between">
        <span className="font-bold text-sm bg-surface rounded-pill border-std border-border px-3 py-1">{t('checkin.count', { count })}</span>
        <Button onClick={() => void finish()}>{t('checkin.finish')}</Button>
      </div>
      <AnimatePresence mode="wait">
        {thanks ? (
          <motion.div key="thanks" initial={still ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="grid justify-items-center gap-3 py-10" role="status">
            <Star weight="fill" size={120} color="#ffd166" aria-hidden="true" />
            <p className="font-display text-4xl sm:text-5xl text-center">{t('checkin.thanks')}</p>
          </motion.div>
        ) : (
          <motion.section key={q} initial={still ? false : { x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} className="grid gap-5">
            <div className="flex items-center gap-3 justify-center flex-wrap">
              <h1 className="font-display text-4xl sm:text-5xl text-center"><Title text={prompt} /></h1>
              <button type="button" onClick={() => speak(prompt, settings)} aria-label={t('q.listen')} className="w-14 h-14 rounded-full border-bold border-border bg-surface flex items-center justify-center"><SpeakerHigh weight="bold" size={28} /></button>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:gap-5">
              {question.icons.map((I, i) => (
                <motion.button key={i} type="button" onClick={() => pick(i)} whileTap={still ? undefined : { scale: 0.92 }}
                  className="aspect-square rounded-panel border-heavy border-border flex flex-col items-center justify-center gap-2 p-3" style={{ background: question.colors[i], boxShadow: 'var(--shadow-sticker-lg)' }}>
                  <I weight="fill" size="45%" aria-hidden="true" />
                  <span className="font-display text-xl sm:text-3xl">{t(`checkin.${question.key}.${i}` as StringKey)}</span>
                </motion.button>
              ))}
            </div>
            <p className="m-0 text-center font-semibold text-lg text-muted">{t('checkin.private')}</p>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
    </>
  );
}
