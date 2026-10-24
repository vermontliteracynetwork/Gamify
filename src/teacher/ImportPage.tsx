import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, DownloadSimple, FileArrowUp } from '@phosphor-icons/react';
import { csvRowsToQuestions, generateSampleCsv, parseCsv, type CsvRowError } from '../data/csv';
import { data, newId } from '../data';
import type { MultipleChoiceQuestion } from '../data/types';
import { t } from '../i18n';
import { Button, buttonClasses, PageHeader, Panel } from '../ui/kit';
import { newSet } from './QuestionSetsPage';

export default function ImportPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [result, setResult] = useState<{ questions: MultipleChoiceQuestion[]; errors: CsvRowError[] } | null>(null);
  const sampleHref = `data:text/csv;charset=utf-8,${encodeURIComponent(generateSampleCsv())}`;

  async function onFile(file: File) {
    const text = await file.text();
    setResult(csvRowsToQuestions(parseCsv(text), () => newId('q')));
    if (!name) setName(file.name.replace(/\.csv$/i, ''));
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-24">
      <Link to="/teacher/sets" className="inline-flex items-center gap-1.5 font-bold text-text no-underline mb-4 min-h-11">
        <ArrowLeft weight="bold" size={18} />{t('editor.back')}
      </Link>
      <PageHeader title={t('import.title')} subtitle={t('import.subtitle')} />

      <Panel className="grid gap-4">
        <div className="flex flex-wrap gap-2">
          <label className={buttonClasses('primary', 'cursor-pointer')}>
            <FileArrowUp weight="bold" size={18} />{t('import.pick')}
            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
          </label>
          <a href={sampleHref} download="gamify-sample-questions.csv" className={buttonClasses()}>
            <DownloadSimple weight="bold" size={18} />{t('import.sample')}
          </a>
        </div>

        {result && (
          <>
            {result.questions.length === 0 && result.errors.length === 0 && <p className="font-bold">{t('import.none')}</p>}
            {result.questions.length > 0 && <p className="font-bold">{t('import.found', { count: result.questions.length })}</p>}
            {result.errors.length > 0 && (
              <div className="grid gap-1">
                <p className="font-bold">{t('import.errors', { count: result.errors.length })}</p>
                <ul className="list-disc pl-6 font-bold text-sm">
                  {result.errors.map((e) => <li key={e.row}>{t('import.row', { row: e.row, message: e.message })}</li>)}
                </ul>
              </div>
            )}
            {result.questions.length > 0 && (
              <>
                <label className="grid gap-1 font-bold">
                  {t('import.name')}
                  <input
                    id="import-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="min-h-11 px-3 rounded-input border-[2px] border-border bg-surface font-bold"
                  />
                </label>
                <ol className="list-decimal pl-6 text-sm font-bold grid gap-1 max-h-72 overflow-y-auto">
                  {result.questions.map((q) => <li key={q.id}>{q.prompt} <span className="text-muted">({q.choices[q.correctIndex]})</span></li>)}
                </ol>
                <Button
                  variant="primary"
                  className="justify-self-start"
                  onClick={async () => {
                    const set = newSet(name.trim() || t('sets.untitled'), result.questions);
                    await data.saveQuestionSet(set);
                    navigate(`/teacher/sets/${set.id}`);
                  }}
                >
                  {t('import.save', { count: result.questions.length })}
                </Button>
              </>
            )}
          </>
        )}
      </Panel>
    </main>
  );
}
