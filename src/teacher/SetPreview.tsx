import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, CopySimple, Play } from '@phosphor-icons/react';
import { data, newId } from '../data';
import type { QuestionSet } from '../data/types';
import { gradeLabel } from '../data/setDetails';
import { t } from '../i18n';
import { Button } from '../ui/kit';
import SetCover, { ART } from '../games/SetCover';
import TeacherNav from '../ui/TeacherNav';
import Title from '../ui/Title';
import HostDialog from './HostDialog';
import { newSet } from './QuestionSetsPage';

// A ready-made set's preview (owner, 2026-11-27, her card-wall screenshots):
// one panel at the left with the set's name, details and three big colored
// buttons (Play now, Use in an Activity, Make a copy), and every question as
// a picture card in a masonry wall beside it. Read-only; a copy is editable.
const TOPS = Object.values(ART).map((a) => a.bg);

export default function SetPreview({ set, atLimit, note }: { set: QuestionSet; atLimit: boolean; note: string }) {
  const navigate = useNavigate();
  const [hosting, setHosting] = useState(false);
  const meta = [set.subject, set.grades && t('filter.gradesShort', { grades: gradeLabel(set.grades) }), t('sets.questions', { count: set.questions.length })].filter(Boolean).join(' · ');
  const big = 'w-full justify-center min-h-12 text-base';
  async function copy() {
    const c = { ...newSet(set.name, set.questions.map((q) => ({ ...q, id: newId('q'), choices: [...q.choices] }))),
      subject: set.subject, grades: set.grades, tags: set.tags, standards: set.standards, noStandard: set.noStandard, cover: set.cover, teachCard: set.teachCard };
    await data.saveQuestionSet(c);
    navigate(`/teacher/sets/${c.id}`);
  }
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24">
      <TeacherNav startOpen={false} />
      <div className="grid gap-5 min-[860px]:grid-cols-[17rem_minmax(0,1fr)] items-start">
        <aside className="bg-surface border-bold border-border rounded-panel overflow-hidden min-[860px]:sticky min-[860px]:top-4" style={{ boxShadow: 'var(--shadow-sticker)' }}>
          <SetCover set={set} className="aspect-[16/8] border-b-[2.5px] border-border" />
          <div className="p-4 grid gap-3">
            <h1 className="font-heading font-bold text-2xl leading-tight text-center"><Title text={set.name} /></h1>
            <p className="text-sm font-bold text-muted text-center">{meta}</p>
            {(set.standards?.length ?? 0) > 0 && <p className="flex flex-wrap justify-center gap-1">{set.standards!.map((c) => <span key={c} className="min-h-7 px-2.5 rounded-pill bg-lavender text-xs font-bold inline-flex items-center">{c}</span>)}</p>}
            <div className="grid gap-2">
              <Button variant="go" className={big} onClick={() => setHosting(true)}><Play weight="fill" size={18} />{t('host.open')}</Button>
              <Button variant="main" className={big} onClick={() => navigate(`/teacher/activity?set=${encodeURIComponent(set.id)}`)}>{t('editor.use')}<ArrowRight weight="bold" size={18} /></Button>
              <Button className={big} disabled={atLimit} onClick={() => void copy()}><CopySimple weight="bold" size={18} />{t('sets.copy')}</Button>
            </div>
            <p className="text-xs font-semibold text-muted text-center">{note}</p>
            {(set.tags?.length ?? 0) > 0 && <p className="flex flex-wrap justify-center gap-x-2 gap-y-1 text-xs font-bold text-grape-deep">{set.tags!.map((tag) => <span key={tag}>#{tag}</span>)}</p>}
          </div>
        </aside>
        <section aria-label={t('sets.questions', { count: set.questions.length })} className="@container min-w-0">
          <ol className="list-none m-0 p-0 columns-1 @[30rem]:columns-2 @[50rem]:columns-3 gap-4">
            {set.questions.map((q, i) => (
              <li key={q.id} className="break-inside-avoid mb-4 bg-surface border-bold border-border rounded-panel overflow-hidden hover-lift" style={{ boxShadow: 'var(--shadow-sticker)' }}>
                {q.imageUrl
                  ? <img src={q.imageStill ?? q.imageUrl} alt={q.imageAlt ?? ''} className="block w-full max-h-64 object-cover border-b-[2.5px] border-border" />
                  : <span aria-hidden="true" className={`grid place-items-center font-display text-5xl border-b-[2.5px] border-border ${['h-20', 'h-28', 'h-24'][i % 3]}`} style={{ background: TOPS[i % TOPS.length] }}>{i + 1}</span>}
                <div className="p-4 grid gap-2">
                  <p className="font-heading font-bold text-base leading-snug text-center m-0"><span className="sr-only">{t('preview.q', { n: i + 1 })}: </span>{q.prompt}</p>
                  {q.choices[q.correctIndex] && <p className="text-sm font-bold text-success-ink inline-flex items-center justify-center gap-1.5 m-0"><Check weight="bold" size={14} aria-hidden="true" /><span className="sr-only">{t('preview.answer')}: </span>{q.choices[q.correctIndex]}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
      {hosting && <HostDialog set={set} onClose={() => setHosting(false)} />}
    </main>
  );
}
