import { MagnifyingGlass } from '@phosphor-icons/react';
import { GRADES, SUBJECTS, type Grade, type SetFilter, type Subject } from '../data/setDetails';
import { t } from '../i18n';

// Filters for question sets: search titles and tags, subject, grade, and a
// Common Core standard code.
export default function SetFilterBar({ value, onChange }: { value: SetFilter; onChange: (f: SetFilter) => void }) {
  const field = 'min-h-11 px-3 rounded-input border-[2px] border-border bg-surface font-bold';
  return (
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
  );
}
