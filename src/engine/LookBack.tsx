import { CheckCircle, SpeakerHigh } from '@phosphor-icons/react';
import type { MultipleChoiceQuestion } from '../data/types';
import { t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';
import { speak } from './feedback';

// "Let's look back": after a game, each missed question with its right
// answer, read aloud on request. Corrective feedback is what makes practice
// stick (docs/gamified-learning-research.md, gap 1).
export default function LookBack({ missed, onDone }: { missed: MultipleChoiceQuestion[]; onDone: () => void }) {
  const { settings } = useSettings();
  return (
    <section className="bg-surface border-[2.5px] border-border rounded-panel p-5 sm:p-6 grid gap-4" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
      <div>
        <h2 className="font-display text-3xl font-bold">{t('look.title')}</h2>
        <p className="font-bold">{missed.length ? t('look.subtitle') : t('look.none')}</p>
      </div>
      <ol className="grid gap-3 list-none p-0 m-0">
        {missed.map((q) => {
          const answer = q.choices[q.correctIndex];
          return (
            <li key={q.id} className="rounded-input border-[2px] border-border-soft p-3 grid gap-2">
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
            </li>
          );
        })}
      </ol>
      <button type="button" onClick={onDone} className="justify-self-start min-h-12 px-6 rounded-pill border-[2px] border-border bg-accent font-bold">{t('look.done')}</button>
    </section>
  );
}
