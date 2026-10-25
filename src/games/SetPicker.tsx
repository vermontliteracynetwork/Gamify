import { useState } from 'react';
import { CheckCircle } from '@phosphor-icons/react';
import { gradeLabel, matchesFilter, missingDetails, type SetFilter } from '../data/setDetails';
import type { QuestionSet } from '../data/types';
import { isPlayable } from '../engine/questions';
import { t } from '../i18n';
import SetCover from './SetCover';
import SetFilterBar from './SetFilterBar';

// Pick one question set (or up to `max` for games like the category grid)
// from a menu of cover cards, with filters. Sets still missing their details
// (subject, grades, tags, standards) can't be picked until they're added.
export default function SetPicker({ sets, value, onChange, max = 1 }: {
  sets: QuestionSet[]; value: string[]; onChange: (ids: string[]) => void; max?: number;
}) {
  const [filter, setFilter] = useState<SetFilter>({});
  const ready = sets.filter((s) => missingDetails(s).length === 0);
  const shown = ready.filter((s) => matchesFilter(s, filter));
  const hidden = sets.length - ready.length;
  return (
    <div className="grid gap-3">
      <p className="font-bold">{max > 1 ? t('setup.pickSets', { max }) : t('tb.setOne')}</p>
      <SetFilterBar value={filter} onChange={setFilter} sets={ready} />
      {hidden > 0 && <p className="text-sm font-bold text-muted">{t('filter.needDetails', { count: hidden })}</p>}
      {shown.length === 0 && <p className="font-bold">{t('filter.none')}</p>}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {shown.map((s) => {
          const on = value.includes(s.id);
          return (
            <button key={s.id} type="button" role={max > 1 ? 'checkbox' : 'radio'} aria-checked={on}
              onClick={() => onChange(max === 1 ? [s.id] : on ? value.filter((x) => x !== s.id) : value.length < max ? [...value, s.id] : value)}
              className={`relative rounded-input border-[2.5px] text-left overflow-hidden flex flex-col bg-surface ${on ? 'border-border ring-4 ring-accent' : 'border-border-soft'}`}>
              <SetCover set={s} className="aspect-[16/7] border-b-[2px] border-border-soft" />
              {on && (
                <span className="absolute top-1.5 right-1.5 w-8 h-8 rounded-full bg-accent border-[2px] border-border flex items-center justify-center font-display font-bold">
                  {max > 1 ? value.indexOf(s.id) + 1 : <CheckCircle weight="fill" size={22} />}
                </span>
              )}
              <span className="p-2.5 grid gap-0.5 min-w-0">
                <span className="font-bold leading-tight line-clamp-2">{s.name || t('sets.untitled')}</span>
                <span className="text-xs text-muted font-bold">{s.subject} · {t('filter.gradesShort', { grades: gradeLabel(s.grades!) })} · {t('setup.count', { count: s.questions.filter(isPlayable).length })}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
