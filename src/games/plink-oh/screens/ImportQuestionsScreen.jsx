import React, { useRef, useState } from 'react';
import { ArrowLeft, UploadSimple, DownloadSimple, Trash, CheckCircle, WarningCircle } from '@phosphor-icons/react';
import { Panel, Button } from '../components/ui';
import {
  parseCsv, csvRowsToQuestions, generateSampleCsv,
  loadCustomQuestionSets, addQuestionSet, deleteQuestionSet,
} from '../../../lib/questionSets';

function downloadTemplate() {
  const blob = new Blob([generateSampleCsv()], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gamify-question-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function ImportQuestionsScreen({ onBack, onSetsChanged }) {
  const [csvText, setCsvText] = useState('');
  const [setName, setSetName] = useState('');
  const [preview, setPreview] = useState(null); // { questions, errors }
  const [sets, setSets] = useState(loadCustomQuestionSets());
  const fileInputRef = useRef(null);

  function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => setCsvText(String(e.target.result));
    reader.readAsText(file);
  }

  function runPreview(text) {
    setCsvText(text);
    if (!text.trim()) { setPreview(null); return; }
    const rows = parseCsv(text);
    setPreview(csvRowsToQuestions(rows));
  }

  function handleSave() {
    if (!preview || preview.questions.length === 0 || !setName.trim()) return;
    addQuestionSet(setName.trim(), preview.questions);
    setSets(loadCustomQuestionSets());
    onSetsChanged?.();
    setCsvText(''); setSetName(''); setPreview(null);
  }

  function handleDelete(id) {
    deleteQuestionSet(id);
    setSets(loadCustomQuestionSets());
    onSetsChanged?.();
  }

  return (
    <Panel>
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          aria-label="Back"
          className="w-10 h-10 rounded-pill flex items-center justify-center bg-surface-2 border-[2.5px] border-border active:scale-90 motion-safe:transition-transform"
          style={{ boxShadow: 'var(--shadow-sticker)' }}
        >
          <ArrowLeft weight="bold" size={17} />
        </button>
        <h2 className="title-bubble text-2xl">Question sets</h2>
      </div>

      <p className="text-text text-sm font-bold mb-1">
        Upload a spreadsheet of questions, same format as Blooket's import template: Question Text, up to 4 answers, and which
        answer number is correct.
      </p>
      <p className="text-muted text-xs mb-4">
        Saved sets live in this browser only for now (no teacher accounts yet) -- they won't follow you to a different device.
      </p>

      <div className="flex gap-2 mb-4">
        <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
          <UploadSimple weight="bold" size={16} /> Upload CSV
        </Button>
        <Button variant="ghost" onClick={downloadTemplate}>
          <DownloadSimple weight="bold" size={16} /> Download template
        </Button>
        <input
          ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden"
          onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
        />
      </div>

      <textarea
        value={csvText}
        onChange={(e) => runPreview(e.target.value)}
        placeholder="Or paste CSV rows here..."
        rows={5}
        className="w-full px-3.5 py-2.5 rounded-input bg-surface-2 border-[2px] border-border text-text text-sm font-mono
                   focus:outline-none focus:border-accent-ink transition-colors mb-3"
      />

      {preview && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 text-sm font-bold mb-2">
            {preview.questions.length > 0 && (
              <span className="flex items-center gap-1 text-success"><CheckCircle weight="fill" size={16} /> {preview.questions.length} question{preview.questions.length === 1 ? '' : 's'} ready</span>
            )}
            {preview.errors.length > 0 && (
              <span className="flex items-center gap-1 text-danger ml-2"><WarningCircle weight="fill" size={16} /> {preview.errors.length} row{preview.errors.length === 1 ? '' : 's'} skipped</span>
            )}
          </div>
          {preview.errors.length > 0 && (
            <ul className="text-xs text-danger mb-2 pl-4 list-disc">
              {preview.errors.map((e, i) => <li key={i}>Row {e.row}: {e.message}</li>)}
            </ul>
          )}
          {preview.questions.length > 0 && (
            <div className="flex gap-2 items-center">
              <input
                value={setName}
                onChange={(e) => setSetName(e.target.value)}
                placeholder="Name this question set"
                className="flex-1 px-3.5 py-2 rounded-input bg-surface-2 border-[2px] border-border text-text text-sm font-bold
                           focus:outline-none focus:border-accent-ink transition-colors"
              />
              <Button variant="primary" onClick={handleSave} disabled={!setName.trim()}>Save set</Button>
            </div>
          )}
        </div>
      )}

      {sets.length > 0 && (
        <div className="mt-5 pt-4 border-t-[2.5px] border-border">
          <div className="font-display font-bold text-sm mb-2">Your saved sets</div>
          <div className="flex flex-col gap-2">
            {sets.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-input bg-surface-2 border-[2px] border-border">
                <div>
                  <div className="font-bold text-sm text-text">{s.name}</div>
                  <div className="text-xs text-muted">{s.questions.length} questions</div>
                </div>
                <button
                  onClick={() => handleDelete(s.id)}
                  aria-label={`Delete ${s.name}`}
                  className="w-8 h-8 rounded-pill flex items-center justify-center bg-danger text-white active:scale-90 motion-safe:transition-transform"
                >
                  <Trash weight="bold" size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}
