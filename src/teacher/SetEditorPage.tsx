import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, CopySimple, Image as ImageIcon, Plus, Trash, X } from '@phosphor-icons/react';
import { data, newId } from '../data';
import { useAsync, useMySets, useTier } from '../data/hooks';
import { getLibrarySet } from '../data/library';
import type { MultipleChoiceQuestion, QuestionSet } from '../data/types';
import { blankQuestion, MAX_CHOICES, MIN_CHOICES, questionIssue } from '../engine/questions';
import { TIERS } from '../config';
import { readOnlyIds } from '../data/downgrade';
import { t } from '../i18n';
import { imageFileToDataUrl } from '../ui/imageFile';
import { Button, Panel } from '../ui/kit';
import { newSet } from './QuestionSetsPage';
import SetDetailsPanel from './SetDetailsPanel';
import Title from '../ui/Title';

const LETTERS = ['A', 'B', 'C', 'D'];

// Question set editor (borrowed from the Dashboard's McTableEditor): one row
// per question with its answers beside it; tap a letter to mark the right
// answer. Saves automatically. Ready-made sets open read-only.
export default function SetEditorPage({ library: isLibrary = false }: { library?: boolean }) {
  let library = isLibrary;
  const { id = '' } = useParams();
  const { value: loaded } = useAsync<QuestionSet | null>(
    async () => (isLibrary ? getLibrarySet(id) ?? null : (await data.getQuestionSet(id)) ?? null), [id, isLibrary]);
  const [set, setSet] = useState<QuestionSet | null>(null);
  const [status, setStatus] = useState<'saved' | 'saving'>('saved');
  const timer = useRef<number>();
  const navigate = useNavigate();
  const { value: mine = [] } = useMySets();
  const tier = useTier();
  const atLimit = mine.length >= TIERS[tier].savedQuestionSets;
  // Downgrade rules: sets past the plan limit stay, read-only.
  const overLimit = !library && readOnlyIds(mine, TIERS[tier].savedQuestionSets).has(id);
  library = library || overLimit;

  useEffect(() => { if (loaded) setSet(loaded); }, [loaded]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  if (loaded === undefined) return null;
  if (loaded === null || !set) {
    return <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-10"><Panel><p className="font-bold">{t('editor.notFound')}</p></Panel></main>;
  }

  function update(next: QuestionSet) {
    setSet(next);
    setStatus('saving');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      await data.saveQuestionSet({ ...next, updatedAt: new Date().toISOString() });
      setStatus('saved');
    }, 400);
  }
  const setQuestions = (questions: MultipleChoiceQuestion[]) => update({ ...set, questions });
  const patch = (qid: string, p: Partial<MultipleChoiceQuestion>) => setQuestions(set.questions.map((q) => (q.id === qid ? { ...q, ...p } : q)));
  const ready = set.questions.filter((q) => !questionIssue(q)).length;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-24">
      <Link to="/teacher/sets" className="inline-flex items-center gap-1.5 font-bold text-text no-underline mb-4 min-h-11">
        <ArrowLeft weight="bold" size={18} />{t('editor.back')}
      </Link>

      <div className="flex flex-wrap items-center gap-3 mb-2">
        {library ? (
          <h1 className="title-bubble text-3xl sm:text-4xl flex-1 min-w-0"><Title text={set.name} /></h1>
        ) : (
          <input
            id="set-name"
            value={set.name}
            onChange={(e) => update({ ...set, name: e.target.value })}
            placeholder={t('sets.untitled')}
            aria-label={t('editor.name')}
            className="flex-1 min-w-0 min-h-12 px-4 rounded-input border-[2.5px] border-border bg-surface font-display text-2xl font-bold"
          />
        )}
        {!library && <span className="text-sm font-bold text-text" aria-live="polite">{status === 'saved' ? t('editor.saved') : t('editor.saving')}</span>}
      </div>
      <p className="font-bold text-text mb-5">{t('editor.ready', { ready, total: set.questions.length })}</p>

      {library && (
        <Panel className="mb-5 flex flex-wrap items-center gap-3 bg-surface-2">
          <p className="font-bold flex-1">{overLimit ? t('editor.overLimit') : t('editor.readOnly')}</p>
          <Button
            variant="primary"
            disabled={atLimit}
            onClick={async () => {
              const copy = { ...newSet(set.name, set.questions.map((q) => ({ ...q, id: newId('q'), choices: [...q.choices] }))),
                subject: set.subject, grades: set.grades, tags: set.tags, standards: set.standards, noStandard: set.noStandard, cover: set.cover };
              await data.saveQuestionSet(copy);
              navigate(`/teacher/sets/${copy.id}`);
            }}
          >
            <CopySimple weight="bold" size={18} />{t('sets.copy')}
          </Button>
        </Panel>
      )}

      <SetDetailsPanel set={set} onChange={update} readOnly={library} />

      <ol className="grid gap-3 list-none p-0 m-0">
        {set.questions.map((q, i) => (
          <QuestionRow
            key={q.id}
            q={q}
            n={i + 1}
            readOnly={library}
            onChange={(p) => patch(q.id, p)}
            onDuplicate={() => setQuestions([...set.questions.slice(0, i + 1), { ...q, id: newId('q'), choices: [...q.choices] }, ...set.questions.slice(i + 1)])}
            onRemove={() => setQuestions(set.questions.filter((x) => x.id !== q.id))}
          />
        ))}
      </ol>

      {!library && (
        <Button variant="primary" className="mt-4" onClick={() => setQuestions([...set.questions, blankQuestion(newId('q'))])}>
          <Plus weight="bold" size={18} />{t('editor.add')}
        </Button>
      )}
    </main>
  );
}

function QuestionRow({ q, n, readOnly, onChange, onDuplicate, onRemove }: {
  q: MultipleChoiceQuestion; n: number; readOnly: boolean;
  onChange: (p: Partial<MultipleChoiceQuestion>) => void; onDuplicate: () => void; onRemove: () => void;
}) {
  const issue = questionIssue(q);
  const started = q.prompt.trim() !== '' || q.choices.some((c) => c.trim());
  const fileRef = useRef<HTMLInputElement>(null);
  const [pictureError, setPictureError] = useState('');

  function setChoice(k: number, value: string) {
    const choices = [...q.choices];
    choices[k] = value;
    onChange({ choices });
  }
  function removeChoice(k: number) {
    const choices = q.choices.filter((_, j) => j !== k);
    const correctIndex = q.correctIndex === k ? 0 : q.correctIndex > k ? q.correctIndex - 1 : q.correctIndex;
    onChange({ choices, correctIndex });
  }

  return (
    <li
      className={`bg-surface border-[2.5px] rounded-panel p-4 grid gap-3 ${issue && started ? 'border-danger' : 'border-border'}`}
      style={{ boxShadow: 'var(--shadow-sticker)' }}
    >
      <div className="flex items-start gap-3">
        <span className="font-display text-xl font-bold w-8 shrink-0 pt-2 text-center" aria-hidden="true">{n}</span>
        <textarea
          id={`q-${q.id}-prompt`}
          value={q.prompt}
          readOnly={readOnly}
          onChange={(e) => onChange({ prompt: e.target.value })}
          placeholder={t('editor.question')}
          aria-label={`${t('editor.question')} ${n}`}
          rows={1}
          className="flex-1 min-w-0 min-h-11 px-3 py-2 rounded-input border-[2px] border-border-soft bg-surface font-bold resize-y"
        />
        {!readOnly && (
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" className="px-3" aria-label={t('editor.duplicate', { n })} onClick={onDuplicate}><CopySimple weight="bold" size={18} /></Button>
            <Button variant="ghost" className="px-3" aria-label={t('editor.remove', { n })} onClick={onRemove}><Trash weight="bold" size={18} /></Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:pl-11">
        {q.choices.map((c, k) => {
          const right = q.correctIndex === k;
          return (
            <div key={k} className={`flex items-center gap-2 rounded-input border-[2px] p-1 ${right ? 'border-border bg-success/40' : 'border-border-soft'}`}>
              <button
                type="button"
                disabled={readOnly}
                onClick={() => onChange({ correctIndex: k })}
                aria-label={t('editor.markRight', { letter: LETTERS[k] })}
                aria-pressed={right}
                className={`w-11 h-11 shrink-0 rounded-full border-[2px] border-border font-display font-bold text-lg flex items-center justify-center
                            ${right ? 'bg-success text-text' : 'bg-surface text-text'}`}
              >
                {right ? <Check weight="bold" size={20} /> : LETTERS[k]}
              </button>
              <input
                id={`q-${q.id}-c${k}`}
                value={c}
                readOnly={readOnly}
                onChange={(e) => setChoice(k, e.target.value)}
                placeholder={k < MIN_CHOICES ? t('editor.answer', { letter: LETTERS[k] }) : t('editor.optional')}
                aria-label={`${t('editor.question')} ${n}, ${t('editor.answer', { letter: LETTERS[k] })}`}
                className="flex-1 min-w-0 min-h-11 px-2 bg-transparent font-bold"
              />
              {!readOnly && q.choices.length > MIN_CHOICES && (
                <button type="button" onClick={() => removeChoice(k)} aria-label={t('editor.removeAnswer', { letter: LETTERS[k] })}
                  className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-muted hover:bg-surface-2">
                  <X weight="bold" size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2 sm:pl-11">
          {q.choices.length < MAX_CHOICES && (
            <Button variant="ghost" onClick={() => onChange({ choices: [...q.choices, ''] })}><Plus weight="bold" size={16} />{t('editor.addAnswer')}</Button>
          )}
          {!q.imageUrl && (
            <Button variant="ghost" onClick={() => fileRef.current?.click()}><ImageIcon weight="bold" size={16} />{t('editor.addPicture')}</Button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              try { setPictureError(''); onChange({ imageUrl: await imageFileToDataUrl(file) }); } catch (err) { setPictureError((err as Error).message); }
            }}
          />
          {pictureError && <span className="font-bold text-sm">{pictureError}</span>}
        </div>
      )}

      {q.imageUrl && (
        <div className="flex flex-wrap items-center gap-3 sm:pl-11">
          <img src={q.imageUrl} alt={q.imageAlt ?? ''} className="h-24 w-auto rounded-input border-[2px] border-border-soft" />
          {!readOnly && (
            <>
              <input
                id={`q-${q.id}-alt`}
                value={q.imageAlt ?? ''}
                onChange={(e) => onChange({ imageAlt: e.target.value })}
                placeholder={t('editor.pictureAlt')}
                aria-label={t('editor.pictureAlt')}
                className="flex-1 min-w-48 min-h-11 px-3 rounded-input border-[2px] border-border-soft font-bold"
              />
              <Button variant="ghost" onClick={() => onChange({ imageUrl: undefined, imageAlt: undefined })}>{t('editor.removePicture')}</Button>
            </>
          )}
        </div>
      )}

      {issue && started && !readOnly && <p className="font-bold text-sm sm:pl-11" role="status">{issue}</p>}
    </li>
  );
}

