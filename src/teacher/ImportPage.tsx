import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowCounterClockwise, Check, CheckCircle, DownloadSimple, FileCsv, FileArrowUp, Info, WarningCircle } from '@phosphor-icons/react';
import { csvRowsToQuestions, generateSampleCsv, parseCsv, type CsvRowError } from '../data/csv';
import { data, newId } from '../data';
import type { MultipleChoiceQuestion } from '../data/types';
import { t } from '../i18n';
import { Button, buttonClasses, PageHeader, Panel } from '../ui/kit';
import TeacherNav from '../ui/TeacherNav';
import { newSet } from './QuestionSetsPage';

// Import a spreadsheet (approved /brand mockup, batch 6, 2026-11-24): choose,
// name, check, save in three visible steps. The bad rows show in place with the
// exact fix, and the good rows can still be saved (error prevention and
// recovery, NN/g heuristics 5 and 9).
export default function ImportPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [over, setOver] = useState(false);
  const [result, setResult] = useState<{ questions: MultipleChoiceQuestion[]; errors: CsvRowError[] } | null>(null);
  const sampleHref = `data:text/csv;charset=utf-8,${encodeURIComponent(generateSampleCsv())}`;

  async function onFile(file: File) {
    const text = await file.text();
    setResult(csvRowsToQuestions(parseCsv(text), () => newId('q')));
    if (!name) setName(file.name.replace(/\.csv$/i, ''));
  }
  const count = result?.questions.length ?? 0;
  const one = (k: string, n: number) => t((n === 1 ? `${k}.one` : k) as Parameters<typeof t>[0], { count: n });

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24">
      <TeacherNav startOpen={false} />
      <PageHeader title={t('import.title')} subtitle={t('import.subtitleShort')}
        actions={<a href={sampleHref} download="gamify-sample-questions.csv" className={buttonClasses()}><DownloadSimple weight="bold" size={18} />{t('import.sample')}</a>} />

      <div className="grid gap-4 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] items-start">
        <div className="grid gap-4">
          <Panel className="grid gap-3">
            <h2 className="font-heading font-bold text-lg">{t('import.step1')}</h2>
            <label
              onDragOver={(e) => { e.preventDefault(); setOver(true); }}
              onDragLeave={() => setOver(false)}
              onDrop={(e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files?.[0]; if (f) void onFile(f); }}
              className={`grid justify-items-center gap-2 rounded-card border-[2.5px] border-dashed border-border p-5 text-center cursor-pointer transition-colors ${over ? 'bg-butter' : 'bg-lavender'}`}>
              <span className="w-14 h-14 rounded-full grid place-items-center bg-surface border-std border-border"><FileCsv weight="bold" size={28} /></span>
              <b>{t('import.drop')}</b>
              <span className={buttonClasses('main', 'pointer-events-none')}><FileArrowUp weight="bold" size={18} />{t('import.pick')}</span>
              <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); }} />
            </label>
            <p className="text-sm font-bold text-muted">{t('import.columns')}</p>
          </Panel>
          <Panel className="grid gap-2">
            <h2 className="font-heading font-bold text-lg">{t('import.step2')}</h2>
            <label htmlFor="import-name" className="font-bold text-sm">{t('import.name')}</label>
            <input id="import-name" value={name} onChange={(e) => setName(e.target.value)}
              className="min-h-12 px-3 rounded-input border-std border-border bg-surface font-bold" />
          </Panel>
        </div>

        <Panel className="grid gap-3 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading font-bold text-lg">{t('import.step3')}</h2>
            {count > 0 && <span className="inline-flex items-center gap-1.5 min-h-8 px-3 rounded-pill bg-mint-soft font-bold text-sm"><CheckCircle weight="fill" size={16} />{one('import.found', count)}</span>}
          </div>
          {!result && <p className="font-bold text-muted py-8 text-center">{t('import.waiting')}</p>}
          {result && count === 0 && result.errors.length === 0 && <p className="font-bold">{t('import.none')}</p>}
          {result && (count > 0 || result.errors.length > 0) && (
            <div className="rounded-input border-std border-border overflow-auto max-h-[min(26rem,50vh)]">
              <table className="w-full text-sm font-bold border-collapse">
                <thead className="sticky top-0 bg-gamify">
                  <tr className="text-left"><th className="p-2.5 w-10">#</th><th className="p-2.5">{t('import.colQuestion')}</th><th className="p-2.5">{t('import.colAnswers')}</th><th className="p-2.5">{t('import.colRight')}</th></tr>
                </thead>
                <tbody>
                  {result.questions.map((q, i) => (
                    <tr key={q.id} className="border-t border-border/20 bg-surface">
                      <td className="p-2.5 align-top">{i + 1}</td>
                      <td className="p-2.5 align-top">{q.prompt}</td>
                      <td className="p-2.5 align-top text-muted">{q.choices.join(', ')}</td>
                      <td className="p-2.5 align-top"><span className="inline-flex items-center gap-1"><Check weight="bold" size={14} />{q.choices[q.correctIndex]}</span></td>
                    </tr>
                  ))}
                  {result.errors.map((e) => (
                    <tr key={`e${e.row}`} className="border-t border-border/20 bg-blush">
                      <td className="p-2.5 align-top">{e.row}</td>
                      <td className="p-2.5 align-top" colSpan={2}>{t('import.row', { row: e.row, message: e.message })}</td>
                      <td className="p-2.5 align-top"><span className="inline-flex items-center gap-1"><WarningCircle weight="bold" size={14} />{t('import.bad')}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {result && result.errors.length > 0 && (
            <p className="flex items-start gap-2 rounded-input bg-butter p-3 font-bold text-sm"><Info weight="bold" size={18} className="shrink-0 mt-0.5" />{one('import.errors', result.errors.length)}</p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link to="/help" className="font-bold text-sm">{t('import.help')}</Link>
            {result && (
              <span className="flex flex-wrap gap-2">
                <Button onClick={() => { setResult(null); setName(''); }}><ArrowCounterClockwise weight="bold" size={18} />{t('import.cancel')}</Button>
                {count > 0 && (
                  <Button variant="main" onClick={async () => {
                    const set = newSet(name.trim() || t('sets.untitled'), result.questions);
                    await data.saveQuestionSet(set);
                    navigate(`/teacher/sets/${set.id}`);
                  }}><Check weight="bold" size={18} />{one('import.save', count)}</Button>
                )}
              </span>
            )}
          </div>
        </Panel>
      </div>
    </main>
  );
}
