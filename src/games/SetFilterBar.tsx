import { Hash, MagnifyingGlass, X } from '@phosphor-icons/react';
import { GRADES, SUBJECTS, type Grade, type SetFilter, type Subject } from '../data/setDetails';
import type { QuestionSet } from '../data/types';
import { suggestTags, tagCounts } from '../data/tags';
import { t } from '../i18n';

// Filters for question sets: search titles and tags, subject, grade, and a
// Common Core standard code. Typing in search offers matching tags from the
// sets on hand; a picked tag becomes a filter chip (teacher, 2026-10-25).
export default function SetFilterBar({ value, onChange, sets = [] }: { value: SetFilter; onChange: (f: SetFilter) => void; sets?: Pick<QuestionSet, 'tags'>[] }) {
  const field = 'min-h-11 px-3 rounded-input border-[2px] border-border bg-surface font-bold';
  const chosen = value.tags ?? [];
  const typed = value.search?.trim() ?? '';
  const offers = typed ? suggestTags(tagCounts(sets), typed, chosen, 6) : [];
  const chip = 'inline-flex items-center gap-1 min-h-9 px-3 rounded-pill border-[2px] border-border font-bold text-sm';
  return (
    <div className="grid gap-2">
    <div className="grid gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <label className="relative">
        <MagnifyingGlass weight="bold" size={20} className="absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
        <input type="search" value={value.search ?? ''} onChange={(e) => onChange({ ...value, search: e.target.value })} placeholder={t('filter.search')} aria-label={t('filter.search')}
          className={`w-full pl-10 ${field}`} />
      </label>
      <select value={value.subject ?? ''} onChange={(e) => onChange({ ...value, subject: (e.target.value || undefined) as Subject | undefined })} aria-label={t('filter.subject')} className={field}>
        <option value="">{t('filter.allSubjects')}</option>
        {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <select value={value.grade ?? ''} onChange={(e) => onChange({ ...value, grade: (e.target.value || undefined) as Grade | undefined })} aria-label={t('filter.grade')} className={field}>
        <option value="">{t('filter.allGrades')}</option>
        {GRADES.map((g) => <option key={g} value={g}>{g === 'K' ? t('filter.kindergarten') : g === 'College' ? g : t('filter.gradeN', { n: g })}</option>)}
      </select>
      <input value={value.standard ?? ''} onChange={(e) => onChange({ ...value, standard: e.target.value })} placeholder={t('filter.standard')} aria-label={t('filter.standard')} className={field} />
    </div>
    {(offers.length > 0 || chosen.length > 0) && (
      <div className="flex flex-wrap items-center gap-1.5" aria-label={t('filter.tags')} role="group">
        {chosen.map((tag) => (
          <button key={tag} type="button" onClick={() => onChange({ ...value, tags: chosen.filter((x) => x !== tag) })} aria-label={t('filter.removeTag', { tag })} className={`${chip} bg-accent`}>#{tag}<X weight="bold" size={14} aria-hidden="true" /></button>
        ))}
        {offers.map((tag) => (
          <button key={tag} type="button" onClick={() => onChange({ ...value, search: '', tags: [...chosen, tag] })} aria-label={t('filter.useTag', { tag })} className={`${chip} bg-surface-2`}><Hash weight="bold" size={14} aria-hidden="true" />{tag}</button>
        ))}
      </div>
    )}
    </div>
  );
}
