import { useState } from 'react';
import { Smiley, SmileyMeh, SmileySad, SmileyWink, SmileyXEyes } from '@phosphor-icons/react';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { Button } from '../ui/kit';
import { saveSurvey, snoozeSurvey, type SurveyId } from './surveys';
import Dialog from '../ui/Dialog';

const GOING = [SmileyXEyes, SmileySad, SmileyMeh, Smiley, SmileyWink];

// The short teacher survey: three questions, under a minute.
export default function TeacherSurvey({ id, onClose }: { id: SurveyId; onClose: () => void }) {
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
    <Dialog size="md" title={t(`survey.title.${id}` as StringKey)} sub={t('survey.sub')} onClose={() => void later()} closeLabel={t('survey.later')}>
        {sent ? <p className="font-display text-2xl text-center py-6" role="status">{t('survey.thanks')}</p> : (
          <>
            <fieldset className="grid gap-2">
              <legend className="font-bold mb-2">{t('survey.going')}</legend>
              <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label={t('survey.going')}>
                {GOING.map((Icon, i) => (
                  <button key={i} type="button" role="radio" aria-checked={going === i + 1} aria-label={t(`survey.going.${i + 1}` as StringKey)} onClick={() => setGoing(i + 1)}
                    className={`min-h-14 rounded-input border-std flex items-center justify-center ${going === i + 1 ? 'bg-butter border-border' : 'bg-surface-2 border-border-soft'}`}>
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
                    className={`min-h-11 rounded-input border-std font-bold tabular-nums ${recommend === n ? 'bg-butter border-border' : 'bg-surface-2 border-border-soft'}`}>{n}</button>
                ))}
              </div>
              <div className="flex justify-between text-xs font-bold text-muted"><span>{t('survey.notLikely')}</span><span>{t('survey.veryLikely')}</span></div>
            </fieldset>
            <label className="grid gap-1 font-bold">{t('survey.better')}
              <textarea value={better} onChange={(e) => setBetter(e.target.value)} maxLength={600} rows={3} className="px-3 py-2 rounded-input border-std border-border font-semibold" />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button variant="main" disabled={going === null || recommend === null} onClick={() => void send()}>{t('survey.send')}</Button>
              <Button onClick={() => void later()}>{t('survey.later')}</Button>
            </div>
          </>
        )}
    </Dialog>
  );
}
