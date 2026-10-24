import { useState } from 'react';
import { CheckCircle, MagnifyingGlass, Stack } from '@phosphor-icons/react';
import { isPlayable } from '../engine/questions';
import type { QuestionSet } from '../data/types';
import { t } from '../i18n';

const BANDS = ['#fbdb6b', '#9fd8f0', '#a3e6b8', '#f6a5c0', '#f7ad78', '#c9b6f2'];

// Pick one question set (or up to `max` for games like the category grid),
// shown as a menu of cards.
export default function SetPicker({ sets, value, onChange, max = 1 }: {
  sets: QuestionSet[]; value: string[]; onChange: (ids: string[]) => void; max?: number;
}) {
  const [q, setQ] = useState('');
  const shown = sets.filter((s) => !q.trim() || s.name.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div className="grid gap-3">
      <p className="font-bold">{max > 1 ? t('setup.pickSets', { max }) : t('tb.setOne')}</p>
      <label className="relative">
        <MagnifyingGlass weight="bold" size={20} className="absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
        <input id="set-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('sets.search')} aria-label={t('sets.search')}
          className="w-full min-h-12 pl-10 pr-3 rounded-input border-[2px] border-border bg-surface font-bold" />
      </label>
      <div className="grid sm:grid-cols-2 gap-2">
        {shown.map((s, i) => {
          const on = value.includes(s.id);
          return (
            <button key={s.id} type="button" role={max > 1 ? 'checkbox' : 'radio'} aria-checked={on}
              onClick={() => onChange(max === 1 ? [s.id] : on ? value.filter((x) => x !== s.id) : value.length < max ? [...value, s.id] : value)}
              className={`rounded-input border-[2.5px] text-left font-bold flex items-stretch overflow-hidden min-h-16 ${on ? 'border-border ring-4 ring-accent bg-surface' : 'border-border-soft bg-surface'}`}>
              <span className="w-12 shrink-0 flex items-center justify-center border-r-[2px] border-border-soft" style={{ background: BANDS[i % BANDS.length] }} aria-hidden="true">
                {on ? (max > 1 ? <span className="font-display text-xl">{value.indexOf(s.id) + 1}</span> : <CheckCircle weight="fill" size={26} />) : <Stack weight="fill" size={24} />}
              </span>
              <span className="p-2.5 grid min-w-0">
                <span className="truncate">{s.name || t('sets.untitled')}</span>
                <span className="text-sm text-muted font-semibold">{t('setup.count', { count: s.questions.filter(isPlayable).length })}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
