import { useEffect, useRef, useState } from 'react';
import { Check, Hash, MagnifyingGlass, SlidersHorizontal, X } from '@phosphor-icons/react';
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
  // The setup set picker (owner, 2026-11-26: "it should just be the sets
  // toggle, search, filters. search should be large and fill the space between
  // the two"): one even row. Subjects, grades, the standard code and tags live
  // behind one Filters button.
  if (chips) return <ChipFilters value={value} onChange={onChange} sets={sets} offers={offers} chosen={chosen} chip={chip} />;
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

function ChipFilters({ value, onChange, sets, offers, chosen, chip }: { value: SetFilter; onChange: (f: SetFilter) => void; sets: Pick<QuestionSet, 'tags'>[]; offers: string[]; chosen: string[]; chip: string }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', away); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', esc); };
  }, [open]);
  const pill = (on: boolean) => `inline-flex items-center gap-1.5 min-h-10 tap px-3.5 rounded-pill border-std border-border font-bold text-sm whitespace-nowrap ${on ? 'bg-mint shadow-[inset_0_0_0_1px_var(--ink)]' : 'bg-white'}`;
  const count = (value.subject ? 1 : 0) + (value.grade ? 1 : 0) + (value.standard?.trim() ? 1 : 0) + chosen.length;
  const topTags = tagCounts(sets).filter((tag) => !chosen.includes(tag)).slice(0, 12);
  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <label className="relative flex-1 min-w-0">
          <MagnifyingGlass weight="bold" size={20} className="absolute left-4 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input type="search" value={value.search ?? ''} onChange={(e) => onChange({ ...value, search: e.target.value })} placeholder={t('filter.search')} aria-label={t('filter.search')}
            className="w-full min-h-11 pl-11 pr-4 rounded-pill border-[2.5px] border-border bg-white font-semibold text-base" />
        </label>
        <div ref={box} className="relative shrink-0">
          <button type="button" aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen(!open)} className={`${pill(count > 0)} min-h-11`}>
            <SlidersHorizontal weight="bold" size={18} aria-hidden="true" />{t('filter.filters')}
            {count > 0 && <span className="min-w-6 h-6 px-1.5 rounded-pill bg-[var(--ink)] text-white text-xs grid place-items-center" aria-label={t('filter.on', { count })}>{count}</span>}
          </button>
          {open && (
            <div role="dialog" aria-label={t('filter.filters')} className="absolute right-0 top-full mt-2 z-30 w-[min(26rem,calc(100vw-2rem))] grid gap-4 p-4 rounded-panel border-bold border-border bg-surface text-left" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
              <div role="group" aria-label={t('filter.subject')} className="grid gap-2">
                <p className="m-0 font-bold">{t('filter.subject')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {[undefined, ...SUBJECTS].map((sub) => {
                    const on = value.subject === sub;
                    return <button key={sub ?? 'all'} type="button" aria-pressed={on} onClick={() => onChange({ ...value, subject: sub })} className={pill(on)}>{on && <Check weight="bold" size={14} aria-hidden="true" />}{sub ?? t('filter.allSubjects')}</button>;
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-1 min-w-0 font-bold text-sm">{t('filter.grade')}
                  <select value={value.grade ?? ''} onChange={(e) => onChange({ ...value, grade: (e.target.value || undefined) as Grade | undefined })} className="w-full min-w-0 min-h-11 px-3 rounded-input border-std border-border bg-white font-bold">
                    <option value="">{t('filter.allGrades')}</option>
                    {GRADES.map((g) => <option key={g} value={g}>{g === 'K' ? t('filter.kindergarten') : g === 'College' ? g : t('filter.gradeN', { n: g })}</option>)}
                  </select>
                </label>
                <label className="grid gap-1 min-w-0 font-bold text-sm">{t('filter.standard')}
                  <input value={value.standard ?? ''} onChange={(e) => onChange({ ...value, standard: e.target.value })} placeholder="L.1.2c" className="w-full min-w-0 min-h-11 px-3 rounded-input border-std border-border bg-white font-semibold" />
                </label>
              </div>
              {(chosen.length > 0 || topTags.length > 0) && (
                <div role="group" aria-label={t('filter.tags')} className="grid gap-2">
                  <p className="m-0 font-bold">{t('filter.tags')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {chosen.map((tag) => <button key={tag} type="button" onClick={() => onChange({ ...value, tags: chosen.filter((x) => x !== tag) })} aria-label={t('filter.removeTag', { tag })} className={`${chip} bg-butter`}>#{tag}<X weight="bold" size={14} aria-hidden="true" /></button>)}
                    {topTags.map((tag) => <button key={tag} type="button" onClick={() => onChange({ ...value, tags: [...chosen, tag] })} aria-label={t('filter.useTag', { tag })} className={`${chip} bg-surface-2`}><Hash weight="bold" size={14} aria-hidden="true" />{tag}</button>)}
                  </div>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <button type="button" disabled={count === 0} onClick={() => onChange({ search: value.search })} className="min-h-11 px-4 rounded-pill border-std border-border bg-white font-bold disabled:opacity-40">{t('filter.clear')}</button>
                <button type="button" onClick={() => setOpen(false)} className="min-h-11 px-5 rounded-pill border-std border-border bg-butter font-bold">{t('filter.done')}</button>
              </div>
            </div>
          )}
        </div>
      </div>
      {(chosen.length > 0 || offers.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5" aria-label={t('filter.tags')} role="group">
          {chosen.map((tag) => <button key={tag} type="button" onClick={() => onChange({ ...value, tags: chosen.filter((x) => x !== tag) })} aria-label={t('filter.removeTag', { tag })} className={`${chip} bg-butter`}>#{tag}<X weight="bold" size={14} aria-hidden="true" /></button>)}
          {offers.map((tag) => <button key={tag} type="button" onClick={() => onChange({ ...value, search: '', tags: [...chosen, tag] })} aria-label={t('filter.useTag', { tag })} className={`${chip} bg-surface-2`}><Hash weight="bold" size={14} aria-hidden="true" />{tag}</button>)}
        </div>
      )}
    </div>
  );
}
