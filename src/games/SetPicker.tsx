import { useEffect, useState } from 'react';
import { CaretLeft, CaretRight, CheckCircle } from '@phosphor-icons/react';
import { gradeLabel, matchesFilter, missingDetails, type SetFilter } from '../data/setDetails';
import type { QuestionSet } from '../data/types';
import { isPlayable } from '../engine/questions';
import { t } from '../i18n';
import { ART } from './SetCover';
import SetFilterBar from './SetFilterBar';

// Pick one question set (or up to `max` for games like the category grid)
// from square cards in rows of 4, the same menu in every game (teacher,
// 2026-11-01: no cover pictures, no "Pick a question set" line), with filters. Sets still missing their details
// (subject, grades, tags, standards) can't be picked until they're added.
export default function SetPicker({ sets, value, onChange, max = 1 }: {
  sets: QuestionSet[]; value: string[]; onChange: (ids: string[]) => void; max?: number;
}) {
  const [filter, setFilter] = useState<SetFilter>({});
  const ready = sets.filter((s) => missingDetails(s).length === 0);
  const shown = ready.filter((s) => matchesFilter(s, filter));
  const hidden = sets.length - ready.length;
  // Sets come in pages (teacher, 2026-10-31), opening on the page with the pick.
  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const [page, setPage] = useState(() => Math.max(0, Math.floor(shown.findIndex((s) => value.includes(s.id)) / PAGE)));
  useEffect(() => { if (page >= pages) setPage(pages - 1); }, [page, pages]);
  const onPage = shown.slice(page * PAGE, page * PAGE + PAGE);
  return (
    <div className="grid gap-3">
      {max > 1 && <p className="font-bold">{t('setup.pickSets', { max })}</p>}
      <SetFilterBar value={filter} onChange={(f) => { setFilter(f); setPage(0); }} sets={ready} />
      {hidden > 0 && <p className="text-sm font-bold text-muted">{t('filter.needDetails', { count: hidden })}</p>}
      {shown.length === 0 && <p className="font-bold">{t('filter.none')}</p>}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full max-w-[35rem] mx-auto">
        {onPage.map((s) => {
          const on = value.includes(s.id);
          const art = ART[s.subject ?? 'Other'];
          const I = art.icon;
          return (
            <button key={s.id} type="button" role={max > 1 ? 'checkbox' : 'radio'} aria-checked={on}
              onClick={() => onChange(max === 1 ? [s.id] : on ? value.filter((x) => x !== s.id) : value.length < max ? [...value, s.id] : value)}
              className={`relative aspect-square rounded-input border-[2.5px] text-left overflow-hidden flex flex-col justify-between p-2.5 ${on ? 'border-border ring-4 ring-accent' : 'border-border-soft'}`}
              style={{ background: `color-mix(in srgb, ${art.bg} 45%, var(--color-surface, #fbfcf8))` }}>
              <I weight="fill" size={22} color={art.ink} aria-hidden="true" />
              {on && (
                <span className="absolute top-1.5 right-1.5 w-8 h-8 rounded-full bg-accent border-[2px] border-border flex items-center justify-center font-display font-bold">
                  {max > 1 ? value.indexOf(s.id) + 1 : <CheckCircle weight="fill" size={22} />}
                </span>
              )}
              <span className="grid gap-0.5 min-w-0">
                <span className="font-bold text-sm leading-tight line-clamp-3">{s.name || t('sets.untitled')}</span>
                <span className="text-[11px] leading-tight text-muted font-bold line-clamp-2">{s.subject} · {t('filter.gradesShort', { grades: gradeLabel(s.grades!) })} · {t('setup.count', { count: s.questions.filter(isPlayable).length })}</span>
              </span>
            </button>
          );
        })}
      </div>
      {pages > 1 && (
        <nav className="flex items-center justify-center gap-3" aria-label={t('sets.pages')}>
          <button type="button" data-tip={t('sets.prevPage')} aria-label={t('sets.prevPage')} disabled={page === 0} onClick={() => setPage(page - 1)}
            className="w-11 h-11 rounded-full border-[2px] border-border bg-surface flex items-center justify-center disabled:opacity-40"><CaretLeft weight="bold" size={20} /></button>
          <span className="font-bold tabular-nums" aria-live="polite">{t('sets.pageOf', { n: page + 1, total: pages })}</span>
          <button type="button" data-tip={t('sets.nextPage')} aria-label={t('sets.nextPage')} disabled={page >= pages - 1} onClick={() => setPage(page + 1)}
            className="w-11 h-11 rounded-full border-[2px] border-border bg-surface flex items-center justify-center disabled:opacity-40"><CaretRight weight="bold" size={20} /></button>
        </nav>
      )}
    </div>
  );
}

const PAGE = 8; // two rows of 4
