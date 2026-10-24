import { useState } from 'react';
import { CaretLeft, CaretRight, CheckCircle, SpeakerHigh } from '@phosphor-icons/react';
import type { MultipleChoiceQuestion } from '../data/types';
import { t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';
import { speak } from './feedback';

// "Let's look back": after a game, each missed question with its right
// answer, one at a time so nothing ever needs scrolling. Corrective feedback
// is what makes practice stick (docs/gamified-learning-research.md, gap 1).
export default function LookBack({ missed }: { missed: MultipleChoiceQuestion[] }) {
  const { settings } = useSettings();
  const [i, setI] = useState(0);
  if (missed.length === 0) return <p className="font-bold text-center">{t('look.none')}</p>;
  const q = missed[Math.min(i, missed.length - 1)];
  const answer = q.choices[q.correctIndex];
  return (
    <section className="grid gap-3" aria-label={t('look.title')}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-2xl font-bold">{t('look.title')}</h3>
        {missed.length > 1 && <span className="font-bold tabular-nums">{t('q.progress', { n: i + 1, total: missed.length })}</span>}
      </div>
      <div className="rounded-input border-[2px] border-border-soft p-3 grid gap-2">
        <div className="flex items-start gap-2">
          <p className="font-bold text-lg flex-1">{q.prompt}</p>
          <button type="button" aria-label={`${t('q.listen')}: ${q.prompt}`}
            onClick={() => speak(`${q.prompt}. ${t('look.rightAnswer', { answer })}`, settings)}
            className="w-11 h-11 shrink-0 rounded-full border-[2px] border-border bg-surface-2 flex items-center justify-center">
            <SpeakerHigh weight="bold" size={20} />
          </button>
        </div>
        <p className="inline-flex items-center gap-2 font-bold px-3 py-2 rounded-input bg-success/40 border-[2px] border-border justify-self-start">
          <CheckCircle weight="fill" size={22} />{t('look.rightAnswer', { answer })}
        </p>
      </div>
      {missed.length > 1 && (
        <div className="flex justify-between">
          <button type="button" disabled={i === 0} onClick={() => setI(i - 1)} aria-label={t('look.prev')}
            className="w-12 h-12 rounded-full border-[2px] border-border bg-surface-2 flex items-center justify-center disabled:opacity-30"><CaretLeft weight="bold" size={22} /></button>
          <button type="button" disabled={i >= missed.length - 1} onClick={() => setI(i + 1)} aria-label={t('look.next')}
            className="w-12 h-12 rounded-full border-[2px] border-border bg-surface-2 flex items-center justify-center disabled:opacity-30"><CaretRight weight="bold" size={22} /></button>
        </div>
      )}
    </section>
  );
}
