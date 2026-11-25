import { Check, Hash, MagnifyingGlass, X } from '@phosphor-icons/react';
import { GRADES, SUBJECTS, type Grade, type SetFilter, type Subject } from '../data/setDetails';
import type { QuestionSet } from '../data/types';
import { suggestTags, tagCounts } from '../data/tags';
import { t } from '../i18n';

// Filters for question sets: search titles and tags, subject, grade, and a
// Common Core standard code. Typing in search offers matching tags from the
// sets on hand; a picked tag becomes a filter chip (teacher, 2026-10-25).
export default function SetFilterBar({ value, onChange, sets = [], compact = false, chips = false }: { value: SetFilter; onChange: (f: SetFilter) => void; sets?: Pick<QuestionSet, 'tags'>[]; compact?: boolean; chips?: boolean }) {
  // compact: small fields so the cards stay the main view (teacher, 2026-11-06).
  const field = compact ? 'min-h-8 tap px-2 rounded-input border-thin border-border bg-surface font-bold text-xs' : 'min-h-11 px-3 rounded-input border-std border-border bg-surface font-bold';
  const chosen = value.tags ?? [];
  const typed = value.search?.trim() ?? '';
  const offers = typed ? suggestTags(tagCounts(sets), typed, chosen, 6) : [];
  const chip = 'inline-flex items-center gap-1 min-h-9 px-3 rounded-pill border-std border-border font-bold text-sm';
  // The setup set picker (Universal views 4, approved 2026-11-25): search,
  // subject chips that toggle (All subjects first, then each subject), the
  // grade and the standard code, all on one row that wraps.
  if (chips) {
    const pill = (on: boolean) => `inline-flex items-center gap-1.5 min-h-10 tap px-3.5 rounded-pill border-std border-border font-bold text-sm whitespace-nowrap ${on ? 'bg-mint shadow-[inset_0_0_0_1px_var(--ink)]' : 'bg-white'}`;
    return (
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <label className="relative flex-1 min-w-[12rem] max-w-[18rem]">
            <MagnifyingGlass weight="bold" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input type="search" value={value.search ?? ''} onChange={(e) => onChange({ ...value, search: e.target.value })} placeholder={t('filter.search')} aria-label={t('filter.search')}
              className="w-full min-h-10 tap pl-10 pr-3 rounded-pill border-[2.5px] border-border bg-white font-semibold text-sm" />
          </label>
          <div role="group" aria-label={t('filter.subject')} className="flex flex-wrap justify-center gap-1.5">
            {[undefined, ...SUBJECTS].map((s) => {
              const on = value.subject === s;
              return <button key={s ?? 'all'} type="button" aria-pressed={on} onClick={() => onChange({ ...value, subject: s })} className={pill(on)}>{on && <Check weight="bold" size={14} aria-hidden="true" />}{s ?? t('filter.allSubjects')}</button>;
            })}
          </div>
          <select value={value.grade ?? ''} onChange={(e) => onChange({ ...value, grade: (e.target.value || undefined) as Grade | undefined })} aria-label={t('filter.grade')} className={`${pill(!!value.grade)} pr-2`}>
            <option value="">{t('filter.allGrades')}</option>
            {GRADES.map((g) => <option key={g} value={g}>{g === 'K' ? t('filter.kindergarten') : g === 'College' ? g : t('filter.gradeN', { n: g })}</option>)}
          </select>
          <input value={value.standard ?? ''} onChange={(e) => onChange({ ...value, standard: e.target.value })} placeholder={t('filter.standard')} aria-label={t('filter.standard')}
            className="w-[9.5rem] min-h-10 tap px-3 rounded-pill border-std border-border bg-white font-semibold text-sm" />
        </div>
        {chosen.length > 0 || offers.length > 0 ? (
          <div className="flex flex-wrap justify-center items-center gap-1.5" aria-label={t('filter.tags')} role="group">
            {chosen.map((tag) => <button key={tag} type="button" onClick={() => onChange({ ...value, tags: chosen.filter((x) => x !== tag) })} aria-label={t('filter.removeTag', { tag })} className={`${chip} bg-butter`}>#{tag}<X weight="bold" size={14} aria-hidden="true" /></button>)}
            {offers.map((tag) => <button key={tag} type="button" onClick={() => onChange({ ...value, search: '', tags: [...chosen, tag] })} aria-label={t('filter.useTag', { tag })} className={`${chip} bg-surface-2`}><Hash weight="bold" size={14} aria-hidden="true" />{tag}</button>)}
          </div>
        ) : null}
      </div>
    );
  }
  return (
    <div className="@container grid gap-2">
    {/* Narrow spaces put search on its own row, so no word is cut short. */}
    <div className="grid gap-2 grid-cols-3 @3xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <label className="relative col-span-3 @3xl:col-span-1">
        <MagnifyingGlass weight="bold" size={compact ? 16 : 20} className="absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
        <input type="search" value={value.search ?? ''} onChange={(e) => onChange({ ...value, search: e.target.value })} placeholder={t('filter.search')} aria-label={t('filter.search')}
          className={`w-full ${compact ? 'pl-8' : 'pl-10'} ${field}`} />
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
          <button key={tag} type="button" onClick={() => onChange({ ...value, tags: chosen.filter((x) => x !== tag) })} aria-label={t('filter.removeTag', { tag })} className={`${chip} bg-butter`}>#{tag}<X weight="bold" size={14} aria-hidden="true" /></button>
        ))}
        {offers.map((tag) => (
          <button key={tag} type="button" onClick={() => onChange({ ...value, search: '', tags: [...chosen, tag] })} aria-label={t('filter.useTag', { tag })} className={`${chip} bg-surface-2`}><Hash weight="bold" size={14} aria-hidden="true" />{tag}</button>
        ))}
      </div>
    )}
    </div>
  );
}
