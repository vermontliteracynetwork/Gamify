import { useState } from 'react';
import { Plus, UploadSimple, X } from '@phosphor-icons/react';
import {
  ELA_DOMAINS, elaDomainsFor, elaGradeCode, GRADES, gradeIndex, HS_MATH, isStandardCode, MATH_DOMAINS, mathDomainsFor, missingDetails, SUBJECTS,
  type Grade, type Subject,
} from '../data/setDetails';
import type { QuestionSet } from '../data/types';
import SetCover from '../games/SetCover';
import { t } from '../i18n';
import { imageFileToDataUrl } from '../ui/imageFile';
import { Button, Panel } from '../ui/kit';

// The details every question set needs (all required): subject, grades,
// tags and Common Core standards, plus an optional cover picture.
export default function SetDetailsPanel({ set, onChange, readOnly }: { set: QuestionSet; onChange: (s: QuestionSet) => void; readOnly: boolean }) {
  const missing = missingDetails(set);
  const [tag, setTag] = useState('');
  const field = 'min-h-11 px-3 rounded-input border-[2px] border-border bg-surface font-bold';
  const req = (key: string) => missing.includes(key) && <span className="text-xs font-bold px-2 py-0.5 rounded-pill bg-danger border border-border ml-2">{t('details.required')}</span>;
  const grades = set.grades ?? [undefined, undefined];

  function addTag() {
    const v = tag.trim().toLowerCase().replace(/^#/, '');
    if (v && !(set.tags ?? []).includes(v)) onChange({ ...set, tags: [...(set.tags ?? []), v] });
    setTag('');
  }

  return (
    <Panel className="grid gap-4 mb-5">
      <div className="flex flex-wrap items-start gap-4">
        <div className="w-48 grid gap-2">
          <SetCover set={set} className="aspect-[16/9] rounded-input border-[2px] border-border" />
          {!readOnly && (
            <div className="flex gap-2">
              <label className="min-h-11 px-3 rounded-pill border-[2px] border-border bg-surface-2 font-bold text-sm inline-flex items-center gap-1.5 cursor-pointer">
                <UploadSimple weight="bold" size={16} />{t('details.cover')}
                <input type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onChange({ ...set, cover: await imageFileToDataUrl(f, 800) }); }} />
              </label>
              {set.cover && <Button variant="ghost" onClick={() => onChange({ ...set, cover: undefined })}>{t('details.removeCover')}</Button>}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-64 grid gap-3">
          <h2 className="font-display text-2xl font-bold">{t('details.title')}</h2>
          <p className="text-sm font-bold text-muted">{missing.length ? t('details.note') : t('details.done')}</p>
          <div className="flex flex-wrap gap-3">
            <label className="grid gap-1 font-bold">
              <span>{t('filter.subject')}{req('subject')}</span>
              <select disabled={readOnly} value={set.subject ?? ''} onChange={(e) => onChange({ ...set, subject: (e.target.value || undefined) as Subject | undefined })} className={field}>
                <option value="">{t('details.pick')}</option>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <fieldset className="grid gap-1 font-bold">
              <legend>{t('details.grades')}{req('grades')}</legend>
              <div className="flex items-center gap-2">
                {[0, 1].map((k) => (
                  <select key={k} disabled={readOnly} aria-label={k === 0 ? t('details.from') : t('details.to')} value={grades[k] ?? ''} className={field}
                    onChange={(e) => {
                      const v = e.target.value as Grade;
                      const from = (k === 0 ? v : grades[0] ?? v) as Grade, to = (k === 1 ? v : grades[1] ?? v) as Grade;
                      onChange({ ...set, grades: gradeIndex(from) <= gradeIndex(to) ? [from, to] : [to, from] });
                    }}>
                    <option value="">{k === 0 ? t('details.from') : t('details.to')}</option>
                    {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                ))}
              </div>
            </fieldset>
          </div>
        </div>
      </div>

      <div className="grid gap-1.5">
        <span className="font-bold">{t('details.tags')}{req('tags')}</span>
        <div className="flex flex-wrap items-center gap-2">
          {(set.tags ?? []).map((x) => (
            <span key={x} className="inline-flex items-center gap-1 min-h-9 pl-3 pr-1 rounded-pill bg-surface-2 border-[2px] border-border font-bold text-sm">#{x}
              {!readOnly && <button type="button" aria-label={t('details.removeTag', { tag: x })} onClick={() => onChange({ ...set, tags: set.tags!.filter((y) => y !== x) })} className="w-7 h-7 rounded-full flex items-center justify-center"><X weight="bold" size={14} /></button>}
            </span>
          ))}
          {!readOnly && (
            <>
              <input value={tag} onChange={(e) => setTag(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }} placeholder={t('details.tagPlaceholder')} aria-label={t('details.tags')} className={`${field} w-48`} />
              <Button onClick={addTag} disabled={!tag.trim()}><Plus weight="bold" size={16} />{t('details.addTag')}</Button>
            </>
          )}
        </div>
      </div>

      <StandardsField set={set} onChange={onChange} readOnly={readOnly} required={req('standards')} />
    </Panel>
  );
}

function StandardsField({ set, onChange, readOnly, required }: { set: QuestionSet; onChange: (s: QuestionSet) => void; readOnly: boolean; required: React.ReactNode }) {
  const field = 'min-h-11 px-3 rounded-input border-[2px] border-border bg-surface font-bold';
  const math = set.subject === 'Math';
  const startGrade = set.grades?.[0] ?? 'K';
  const [grade, setGrade] = useState<Grade>(startGrade);
  const hs = math && gradeIndex(grade) >= 9;
  const domains = math ? (hs ? Object.keys(HS_MATH) : mathDomainsFor(grade)) : elaDomainsFor(grade);
  const [domain, setDomain] = useState('');
  const [n, setN] = useState(1);
  const [typed, setTyped] = useState('');
  const d = domains.includes(domain) ? domain : domains[0];
  const built = hs ? '' : math ? `${grade}.${d}.${n}` : `${d}.${elaGradeCode(grade)}.${n}`;
  const add = (code: string) => { const c = code.trim(); if (c && !(set.standards ?? []).includes(c)) onChange({ ...set, standards: [...(set.standards ?? []), c], noStandard: false }); };
  const names: Record<string, string> = math ? (hs ? HS_MATH : MATH_DOMAINS) : ELA_DOMAINS;

  return (
    <div className="grid gap-2">
      <span className="font-bold">{t('details.standards')}{required}</span>
      <div className="flex flex-wrap gap-2">
        {(set.standards ?? []).map((c) => (
          <span key={c} className="inline-flex items-center gap-1 min-h-9 pl-3 pr-1 rounded-pill bg-surface border-[2px] border-border font-bold text-sm">{c}
            {!readOnly && <button type="button" aria-label={t('details.removeStandard', { code: c })} onClick={() => onChange({ ...set, standards: set.standards!.filter((y) => y !== c) })} className="w-7 h-7 rounded-full flex items-center justify-center"><X weight="bold" size={14} /></button>}
          </span>
        ))}
        {set.noStandard && <span className="min-h-9 px-3 rounded-pill bg-surface-2 border-[2px] border-border font-bold text-sm inline-flex items-center">{t('details.noStandard')}</span>}
      </div>
      {!readOnly && (
        <>
          {(math || ['Reading', 'Writing', 'Language'].includes(set.subject ?? '')) && (
            <div className="flex flex-wrap items-end gap-2">
              <label className="grid gap-1 text-sm font-bold">{t('filter.grade')}
                <select value={grade} onChange={(e) => setGrade(e.target.value as Grade)} className={field}>{GRADES.filter((g) => g !== 'College').map((g) => <option key={g} value={g}>{g}</option>)}</select>
              </label>
              {!hs && (
                <>
                  <label className="grid gap-1 text-sm font-bold">{t('details.domain')}
                    <select value={d} onChange={(e) => setDomain(e.target.value)} className={field}>{domains.map((x) => <option key={x} value={x}>{x}: {names[x]}</option>)}</select>
                  </label>
                  <label className="grid gap-1 text-sm font-bold">{t('details.number')}
                    <input type="number" min={1} max={12} value={n} onChange={(e) => setN(Math.max(1, Math.min(12, Number(e.target.value) || 1)))} className={`${field} w-20`} />
                  </label>
                  <Button onClick={() => add(built)}><Plus weight="bold" size={16} />{t('details.addStandard', { code: built })}</Button>
                </>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={t('details.typeStandard')} aria-label={t('details.typeStandard')} className={`${field} w-56`} />
            <Button disabled={!isStandardCode(typed)} onClick={() => { add(typed); setTyped(''); }}><Plus weight="bold" size={16} />{t('details.add')}</Button>
            <label className="inline-flex items-center gap-2 font-bold text-sm min-h-11">
              <input type="checkbox" checked={!!set.noStandard} onChange={(e) => onChange({ ...set, noStandard: e.target.checked })} className="w-5 h-5" />
              {t('details.noStandardBox')}
            </label>
          </div>
          {typed && !isStandardCode(typed) && <p className="text-sm font-bold">{t('details.badCode')}</p>}
        </>
      )}
    </div>
  );
}
