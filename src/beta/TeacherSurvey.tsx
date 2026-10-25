import { useState } from 'react';
import { motion } from 'motion/react';
import { Smiley, SmileyMeh, SmileySad, SmileyWink, SmileyXEyes, X } from '@phosphor-icons/react';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { useSettings } from '../settings/SettingsContext';
import { Button } from '../ui/kit';
import Title from '../ui/Title';
import { saveSurvey, snoozeSurvey, type SurveyId } from './surveys';

const GOING = [SmileyXEyes, SmileySad, SmileyMeh, Smiley, SmileyWink];

// The short teacher survey: three questions, under a minute.
export default function TeacherSurvey({ id, onClose }: { id: SurveyId; onClose: () => void }) {
  const { settings } = useSettings();
  const [going, setGoing] = useState<number | null>(null);
  const [recommend, setRecommend] = useState<number | null>(null);
  const [better, setBetter] = useState('');
  const [sent, setSent] = useState(false);
  async function send() {
    if (going === null || recommend === null) return;
    await saveSurvey({ id, at: new Date().toISOString(), going, recommend, better: better.trim() });
    setSent(true);
    window.setTimeout(onClose, 1400);
  }
  async function later() { await snoozeSurvey(); onClose(); }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35" role="dialog" aria-modal="true" aria-labelledby="survey-title">
      <motion.div initial={settings.motion === 'still' ? false : { scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-xl bg-surface border-[2.5px] border-border rounded-panel p-5 grid gap-4 overflow-y-auto" style={{ boxShadow: 'var(--shadow-sticker-lg)', maxHeight: 'calc(100dvh - 32px)' }}>
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <h2 id="survey-title" className="font-display text-2xl"><Title text={t(`survey.title.${id}` as StringKey)} /></h2>
            <p className="font-semibold text-sm text-muted">{t('survey.sub')}</p>
          </div>
          <button type="button" aria-label={t('survey.later')} onClick={() => void later()} className="w-11 h-11 rounded-full border-[2px] border-border bg-surface-2 flex items-center justify-center"><X weight="bold" size={18} /></button>
        </div>
        {sent ? <p className="font-display text-2xl text-center py-6" role="status">{t('survey.thanks')}</p> : (
          <>
            <fieldset className="grid gap-2">
              <legend className="font-bold mb-2">{t('survey.going')}</legend>
              <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label={t('survey.going')}>
                {GOING.map((Icon, i) => (
                  <button key={i} type="button" role="radio" aria-checked={going === i + 1} aria-label={t(`survey.going.${i + 1}` as StringKey)} onClick={() => setGoing(i + 1)}
                    className={`min-h-14 rounded-input border-[2px] flex items-center justify-center ${going === i + 1 ? 'bg-accent border-border' : 'bg-surface-2 border-border-soft'}`}>
                    <Icon weight={going === i + 1 ? 'fill' : 'regular'} size={34} />
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="grid gap-2">
              <legend className="font-bold mb-2">{t('survey.recommend')}</legend>
              <div className="grid grid-cols-11 gap-1" role="radiogroup" aria-label={t('survey.recommend')}>
                {Array.from({ length: 11 }, (_, n) => (
                  <button key={n} type="button" role="radio" aria-checked={recommend === n} onClick={() => setRecommend(n)}
                    className={`min-h-11 rounded-input border-[2px] font-bold tabular-nums ${recommend === n ? 'bg-accent border-border' : 'bg-surface-2 border-border-soft'}`}>{n}</button>
                ))}
              </div>
              <div className="flex justify-between text-xs font-bold text-muted"><span>{t('survey.notLikely')}</span><span>{t('survey.veryLikely')}</span></div>
            </fieldset>
            <label className="grid gap-1 font-bold">{t('survey.better')}
              <textarea value={better} onChange={(e) => setBetter(e.target.value)} maxLength={600} rows={3} className="px-3 py-2 rounded-input border-[2px] border-border font-semibold" />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" disabled={going === null || recommend === null} onClick={() => void send()}>{t('survey.send')}</Button>
              <Button onClick={() => void later()}>{t('survey.later')}</Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
