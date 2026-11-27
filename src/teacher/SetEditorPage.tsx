import { useEffect, useMemo, useRef, useState } from 'react';
import { useCrumbLabel } from '../ui/Breadcrumbs';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Check, CheckCircle, CheckSquare, CopySimple, DownloadSimple, FileArrowUp, Image as ImageIcon, Lightbulb, MagnifyingGlass, Table, Plus, Trash, Warning, X } from '@phosphor-icons/react';
import { data, newId } from '../data';
import { useAsync, useMySets, useTier } from '../data/hooks';
import { getLibrarySet } from '../data/library';
import type { MultipleChoiceQuestion, QuestionSet } from '../data/types';
import { blankQuestion, MAX_CHOICES, MIN_CHOICES, questionIssue } from '../engine/questions';
import { TIERS } from '../config';
import { readOnlyIds } from '../data/downgrade';
import { csvRowsToQuestions, parseCsv, questionsToCsv, questionsToTsv } from '../data/csv';
import { t } from '../i18n';
import { imageFileToDataUrl } from '../ui/imageFile';
import { Button, IconButton, Panel } from '../ui/kit';
import { Hint, newSet, skillColor } from './QuestionSetsPage';
import { questionPlayStats, type PlayStats } from './reports';
import TeacherNav from '../ui/TeacherNav';
import SetDetailsPanel from './SetDetailsPanel';
import Title from '../ui/Title';
import CaptionedImage from '../ui/CaptionedImage';
import MediaSearch from '../ui/MediaSearch';
import QuestionVoice from './QuestionVoice';
import SetPreview from './SetPreview';

// Question set editor (approved teacher portal 6b, 2026-11-25): three
// columns, one job each. The question list with how each question played on
// the first try (item analysis), the selected question with its most picked
// wrong answer (distractor analysis), and the set details beside them. Tap a
// letter to mark the right answer. Saves automatically. Ready-made sets open
// read-only.
export default function SetEditorPage({ library: isLibrary = false }: { library?: boolean }) {
  let library = isLibrary;
  const { id = '' } = useParams();
  const { value: loaded } = useAsync<QuestionSet | null>(
    async () => (isLibrary ? getLibrarySet(id) ?? null : (await data.getQuestionSet(id)) ?? null), [id, isLibrary]);
  const [set, setSet] = useState<QuestionSet | null>(null);
  const [status, setStatus] = useState<'saved' | 'saving'>('saved');
  const [selId, setSelId] = useState<string | null>(null);
  const timer = useRef<number>();
  const navigate = useNavigate();
  const { value: mine = [] } = useMySets();
  const tier = useTier();
  const atLimit = mine.length >= TIERS[tier].savedQuestionSets;
  // How each question played, from the question log; no log rows, no number.
  const { value: log } = useAsync(() => data.listQuestionLog(), []);
  const stats = useMemo(() => questionPlayStats(log ?? [], id), [log, id]);
  // Downgrade rules: sets past the plan limit stay, read-only.
  const overLimit = !library && readOnlyIds(mine, TIERS[tier].savedQuestionSets).has(id);
  library = library || overLimit;

  useEffect(() => { if (loaded) setSet(loaded); }, [loaded]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  useCrumbLabel(set?.name);
  if (loaded === undefined) return null;
  if (loaded === null || !set) {
    return <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-10"><Panel><p className="font-bold">{t('editor.notFound')}</p></Panel></main>;
  }
  // Ready-made sets open as a picture-card preview (owner, 2026-11-27).
  if (isLibrary) return <SetPreview set={set} atLimit={atLimit} note={t('editor.readOnly')} />;

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
  const selIndex = Math.max(0, set.questions.findIndex((q) => q.id === selId));
  const sel = set.questions[selIndex];

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24">
      <TeacherNav startOpen={false} />
      <div className="flex flex-wrap items-start gap-3 mb-4">
        <div className="flex-1 min-w-[16rem] grid gap-2">
          {library ? (
            <h1 className="title-bubble text-2xl sm:text-3xl min-w-0"><Title text={set.name} /></h1>
          ) : (
            <input
              id="set-name"
              value={set.name}
              onChange={(e) => update({ ...set, name: e.target.value })}
              placeholder={t('sets.untitled')}
              aria-label={t('editor.name')}
              className="w-full min-w-0 min-h-12 px-4 rounded-input border-bold border-border bg-surface font-heading text-2xl font-bold"
            />
          )}
          <div className="flex flex-wrap items-center gap-2">
            {!library && <span className="text-sm font-bold text-muted mr-auto" aria-live="polite">{status === 'saved' ? t('editor.saved') : t('editor.saving')}</span>}
            <SpreadsheetTools set={set} readOnly={library} onAdd={(qs) => {
              setQuestions([...set.questions.filter((q) => q.prompt.trim() || q.choices.some((c) => c.trim())), ...qs]);
              if (qs[0]) setSelId(qs[0].id);
            }} />
          </div>
        </div>
        <Button variant="main" onClick={() => navigate(`/teacher/activity?set=${encodeURIComponent(set.id)}`)}>{t('editor.use')}<ArrowRight weight="bold" size={18} /></Button>
      </div>

      {library && (
        <Panel className="mb-4 flex flex-wrap items-center gap-3 bg-surface-2">
          <p className="font-bold flex-1">{overLimit ? t('editor.overLimit') : t('editor.readOnly')}</p>
          <Button
            variant="main"
            disabled={atLimit}
            onClick={async () => {
              const copy = { ...newSet(set.name, set.questions.map((q) => ({ ...q, id: newId('q'), choices: [...q.choices] }))),
                subject: set.subject, grades: set.grades, tags: set.tags, standards: set.standards, noStandard: set.noStandard, cover: set.cover, teachCard: set.teachCard };
              await data.saveQuestionSet(copy);
              navigate(`/teacher/sets/${copy.id}`);
            }}
          >
            <CopySimple weight="bold" size={18} />{t('sets.copy')}
          </Button>
        </Panel>
      )}

      <div className="@container">
        <div className="grid gap-4 items-start @[40rem]:grid-cols-[13.5rem_minmax(0,1fr)] @[52rem]:grid-cols-[13rem_minmax(0,1fr)_16.5rem]">
          <Panel className="grid grid-cols-1 gap-2 content-start !p-3">
            <div className="flex items-center gap-1.5 px-1">
              <h2 className="font-heading text-base font-bold">{t('sets.questions', { count: set.questions.length })}</h2>
              <Hint text={t('editor.listTip')} />
            </div>
            <ol className="list-none m-0 p-0 grid gap-1" aria-label={t('editor.list')}>
              {set.questions.map((q, i) => {
                const st = stats.get(q.prompt);
                const on = i === selIndex;
                const started = q.prompt.trim() !== '' || q.choices.some((c) => c.trim());
                return (
                  <li key={q.id}>
                    <button type="button" aria-current={on ? 'true' : undefined} onClick={() => setSelId(q.id)}
                      className={`w-full min-h-11 rounded-input px-2 py-1.5 grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-2 text-left border-std ${on ? 'bg-gamify border-border shadow-[inset_0.25rem_0_0_var(--color-grape)]' : 'bg-surface-2 border-transparent hover:border-border-soft'}`}>
                      <b className="text-sm">{i + 1}</b>
                      <span className={`text-sm font-bold leading-snug break-words ${q.prompt.trim() ? '' : 'text-muted'}`}>{q.prompt.trim() || t('editor.newQuestion')}</span>
                      {st ? (
                        <span className="min-w-11 h-6 px-1.5 rounded-pill text-xs font-bold grid place-items-center" style={{ background: skillColor(st.pct) }}>
                          <span aria-hidden="true">{st.pct}%</span><span className="sr-only">{t('sets.firstTryPct', { pct: st.pct })}</span>
                        </span>
                      ) : questionIssue(q) && started ? (
                        <span className="text-error" data-tip={t('editor.needsWork')}><Warning weight="bold" size={16} aria-hidden="true" /><span className="sr-only">{t('editor.needsWork')}</span></span>
                      ) : <span />}
                    </button>
                  </li>
                );
              })}
            </ol>
            {!library && (
              <Button size="sm" className="justify-self-start mt-1" onClick={() => { const q = blankQuestion(newId('q')); setQuestions([...set.questions, q]); setSelId(q.id); }}>
                <Plus weight="bold" size={14} />{t('editor.add')}
              </Button>
            )}
          </Panel>

          {sel ? (
            <QuestionRow
              key={sel.id}
              q={sel}
              n={selIndex + 1}
              readOnly={library}
              stats={stats.get(sel.prompt)}
              onChange={(p) => patch(sel.id, p)}
              onDuplicate={() => { const copy = { ...sel, id: newId('q'), choices: [...sel.choices] }; setQuestions([...set.questions.slice(0, selIndex + 1), copy, ...set.questions.slice(selIndex + 1)]); setSelId(copy.id); }}
              onRemove={() => { const next = set.questions.filter((x) => x.id !== sel.id); setQuestions(next); setSelId(next[Math.min(selIndex, next.length - 1)]?.id ?? null); }}
            />
          ) : <Panel><p className="font-bold text-muted">{t('sets.noQuestions')}</p></Panel>}

          <div className="@[40rem]:col-span-2 @[52rem]:col-span-1 min-w-0">
            <SetDetailsPanel set={set} onChange={update} readOnly={library}
              footer={<p className={`text-sm font-bold inline-flex items-center gap-1.5 ${ready === set.questions.length ? 'text-success-ink' : 'text-text'}`}>
                {ready === set.questions.length ? <CheckCircle weight="bold" size={16} aria-hidden="true" /> : <Warning weight="bold" size={16} aria-hidden="true" />}
                {t('editor.ready', { ready, total: set.questions.length })}
              </p>} />
          </div>
        </div>
      </div>
    </main>
  );
}

const LETTERS = ['A', 'B', 'C', 'D'];

// The selected question (6b, middle column): the question, its answers one
// per row with the right one marked, its tools, and how it played.
function QuestionRow({ q, n, readOnly, stats, onChange, onDuplicate, onRemove }: {
  q: MultipleChoiceQuestion; n: number; readOnly: boolean; stats?: PlayStats;
  onChange: (p: Partial<MultipleChoiceQuestion>) => void; onDuplicate: () => void; onRemove: () => void;
}) {
  const issue = questionIssue(q);
  const started = q.prompt.trim() !== '' || q.choices.some((c) => c.trim());
  const fileRef = useRef<HTMLInputElement>(null);
  const [pictureError, setPictureError] = useState('');
  const [searching, setSearching] = useState(false);

  function setChoice(k: number, value: string) {
    const choices = [...q.choices];
    choices[k] = value;
    onChange({ choices });
  }
  function removeChoice(k: number) {
    const choices = q.choices.filter((_, j) => j !== k);
    const correctIndex = q.correctIndex === k ? 0 : q.correctIndex > k ? q.correctIndex - 1 : q.correctIndex;
    onChange({ choices, correctIndex, choiceImages: q.choiceImages?.filter((_, j) => j !== k), choiceAlts: q.choiceAlts?.filter((_, j) => j !== k) });
  }
  function setChoiceImage(k: number, image: string | null, alt: string | null = null) {
    const at = (list: (string | null)[] | undefined, v: string | null) => { const next = Array.from({ length: q.choices.length }, (_, j): string | null => list?.[j] ?? null); next[k] = v; return next; };
    onChange({ choiceImages: at(q.choiceImages, image), choiceAlts: at(q.choiceAlts, image ? alt : null) });
  }
  const choiceFileRef = useRef<HTMLInputElement>(null);
  const [choiceForFile, setChoiceForFile] = useState(0);
  // The most picked wrong answer, by its letter when it is still an answer.
  const wrongAt = stats?.topWrong !== undefined ? q.choices.indexOf(stats.topWrong) : -1;
  const wrongName = stats?.topWrong === undefined ? '' : wrongAt >= 0 ? `${LETTERS[wrongAt]}, "${stats.topWrong}"` : `"${stats.topWrong}"`;

  return (
    <section
      className={`@container bg-surface border-bold rounded-panel p-4 sm:p-5 grid grid-cols-1 gap-3 content-start min-w-0 ${issue && started && !readOnly ? 'border-danger' : 'border-border'}`}
      style={{ boxShadow: 'var(--shadow-sticker)' }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted flex-1 min-w-max">{t('editor.questionN', { n })}</h2>
        {!readOnly && (
          <>
            <Button size="sm" aria-label={t('editor.duplicate', { n })} onClick={onDuplicate}><CopySimple weight="bold" size={14} />{t('editor.copyShort')}</Button>
            <IconButton variant="ghost" label={t('editor.remove', { n })} onClick={onRemove}><Trash weight="bold" size={18} /></IconButton>
            <span className="basis-full flex flex-wrap gap-1 empty:hidden"><QuestionVoice n={n} audioUrl={q.audioUrl} onChange={(audioUrl) => onChange({ audioUrl })} /></span>
          </>
        )}
      </div>
      {q.imageUrl && (
        <div className="flex flex-wrap items-start gap-3">
          <CaptionedImage src={q.imageUrl} alt={q.imageAlt ?? ''} onAlt={(imageAlt) => onChange({ imageAlt })} readOnly={readOnly} required className="h-28 w-auto" />
          {!readOnly && <Button variant="ghost" onClick={() => onChange({ imageUrl: undefined, imageAlt: undefined })}>{t('editor.removePicture')}</Button>}
        </div>
      )}
      <textarea
        id={`q-${q.id}-prompt`}
        value={q.prompt}
        readOnly={readOnly}
        onChange={(e) => onChange({ prompt: e.target.value })}
        placeholder={t('editor.question')}
        aria-label={`${t('editor.question')} ${n}`}
        rows={2}
        className="w-full min-w-0 min-h-14 px-4 py-3 rounded-input border-std border-border bg-[var(--cream)] text-xl font-bold resize-y"
      />

      <div className="grid grid-cols-1 gap-2">
        {q.choices.map((c, k) => {
          const right = q.correctIndex === k;
          return (
            <div key={k} className={`min-h-14 flex items-center gap-2 rounded-input border-std px-2 py-1 ${right ? 'border-border bg-mint-soft' : 'border-border-soft bg-surface'}`}>
              <button
                type="button"
                disabled={readOnly}
                onClick={() => onChange({ correctIndex: k })}
                aria-label={t('editor.markRight', { letter: LETTERS[k] })}
                aria-pressed={right}
                className={`w-11 h-11 shrink-0 rounded-full border-std border-border font-heading font-bold text-lg flex items-center justify-center
                            ${right ? 'bg-success text-text' : 'bg-surface text-text hover:bg-surface-2'}`}
              >
                {right ? <Check weight="bold" size={20} /> : LETTERS[k]}
              </button>
              {q.choiceImages?.[k] && (
                <div className="relative shrink-0">
                  <CaptionedImage src={q.choiceImages[k]!} alt={q.choiceAlts?.[k] ?? ''} onAlt={(a) => setChoiceImage(k, q.choiceImages![k]!, a)} readOnly={readOnly} className="h-14 w-14 object-cover" />
                </div>
              )}
              <input
                id={`q-${q.id}-c${k}`}
                value={c}
                readOnly={readOnly}
                onChange={(e) => setChoice(k, e.target.value)}
                placeholder={k < MIN_CHOICES ? t('editor.answer', { letter: LETTERS[k] }) : t('editor.optional')}
                aria-label={`${t('editor.question')} ${n}, ${t('editor.answer', { letter: LETTERS[k] })}`}
                className="flex-1 min-w-0 min-h-11 px-2 bg-transparent font-semibold text-base"
              />
              {right
                ? <span className="shrink-0 min-h-7 px-2.5 rounded-pill bg-success text-xs font-bold inline-flex items-center gap-1"><Check weight="bold" size={12} aria-hidden="true" />{t('editor.rightAnswer')}</span>
                : !readOnly && <span aria-hidden="true" onClick={() => onChange({ correctIndex: k })} className="shrink-0 text-xs font-bold text-muted cursor-pointer hidden @[34rem]:inline">{t('editor.markRightShort')}</span>}
              {!readOnly && (q.choiceImages?.[k]
                ? <button type="button" onClick={() => setChoiceImage(k, null)} aria-label={t('editor.removeAnswerPicture', { letter: LETTERS[k] })} className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-muted hover:bg-surface-2"><ImageIcon weight="bold" size={16} /><X weight="bold" size={10} /></button>
                : <button type="button" onClick={() => { setChoiceForFile(k); choiceFileRef.current?.click(); }} aria-label={t('editor.addAnswerPicture', { letter: LETTERS[k] })} className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-muted hover:bg-surface-2"><ImageIcon weight="bold" size={18} /></button>)}
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

      {issue && started && !readOnly && <p className="font-bold text-sm text-error" role="status">{issue}</p>}

      {/* How it played (item and distractor analysis): only from real games. */}
      {stats ? (
        <div className="rounded-input bg-butter p-3 grid gap-1">
          <b className="text-sm flex items-center gap-2"><Lightbulb weight="bold" size={16} aria-hidden="true" />{t('editor.played', { pct: stats.pct, count: stats.answered })}</b>
          {stats.topWrong !== undefined
            ? <><span className="text-sm font-semibold">{t('editor.topWrong', { answer: wrongName, count: stats.topWrongCount })}</span><span className="text-sm font-semibold text-muted">{t('editor.topWrongTip')}</span></>
            : <span className="text-sm font-semibold">{t('editor.noWrong')}</span>}
        </div>
      ) : <p className="text-sm font-semibold text-muted flex items-center gap-2"><Lightbulb weight="bold" size={16} aria-hidden="true" />{t('editor.notPlayed')}</p>}

      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {q.choices.length < MAX_CHOICES && (
            <Button size="sm" onClick={() => onChange({ choices: [...q.choices, ''] })}><Plus weight="bold" size={14} />{t('editor.addAnswer')}</Button>
          )}
          {!q.imageUrl && (<>
            <Button size="sm" onClick={() => fileRef.current?.click()}><ImageIcon weight="bold" size={14} />{t('editor.addPicture')}</Button>
            <Button size="sm" onClick={() => setSearching(true)}><MagnifyingGlass weight="bold" size={14} />Find a GIF or photo</Button>
            {searching && <MediaSearch onClose={() => setSearching(false)} onPick={(m) => { setSearching(false); onChange({ imageUrl: m.url, imageAlt: m.alt, imageCredit: m.credit, imageStill: m.still }); }} />}
          </>)}
          {/* True or false in one tap (market gaps, 2026-11-01). */}
          {!(q.choices.length === 2 && q.choices[0] === t('editor.true') && q.choices[1] === t('editor.false')) && (
            <Button size="sm" aria-label={t('editor.trueFalseN', { n })} onClick={() => onChange({ choices: [t('editor.true'), t('editor.false')], correctIndex: q.correctIndex === 1 ? 1 : 0, choiceImages: undefined, choiceAlts: undefined })}>
              <CheckSquare weight="bold" size={14} />{t('editor.trueFalse')}
            </Button>
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
          <input
            ref={choiceFileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              try { setPictureError(''); setChoiceImage(choiceForFile, await imageFileToDataUrl(file, 400)); } catch (err) { setPictureError((err as Error).message); }
            }}
          />
          {pictureError && <span className="font-bold text-sm">{pictureError}</span>}
        </div>
      )}
    </section>
  );
}

// Spreadsheet tools, always on hand (teacher, 2026-10-25): add questions from
// a CSV, download the set as a CSV, or copy it into a new Google Sheet.
function SpreadsheetTools({ set, readOnly, onAdd }: { set: QuestionSet; readOnly: boolean; onAdd: (qs: MultipleChoiceQuestion[]) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState('');
  const slug = (set.name || 'question-set').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const pill = 'min-h-9 tap px-3 rounded-pill border-std border-border bg-white font-bold text-sm inline-flex items-center gap-1.5 hover-pop';
  async function upload(file: File) {
    const { questions, errors } = csvRowsToQuestions(parseCsv(await file.text()), () => newId('q'));
    if (questions.length) onAdd(questions);
    setNote([t('editor.csvAdded', { count: questions.length }), errors.length ? t('editor.csvSkipped', { count: errors.length, rows: errors.slice(0, 5).map((e) => e.row).join(', ') }) : ''].filter(Boolean).join(' '));
  }
  function download() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([questionsToCsv(set.questions)], { type: 'text/csv' }));
    a.download = `${slug}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  async function copyToSheets() {
    try {
      await navigator.clipboard.writeText(questionsToTsv(set.questions));
      setNote(t('editor.sheetsCopied'));
      window.open('https://sheets.new', '_blank', 'noopener');
    } catch { setNote(t('editor.sheetsFailed')); }
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      {!readOnly && (
        <>
          <button type="button" className={pill} onClick={() => fileRef.current?.click()}><FileArrowUp weight="bold" size={18} />{t('editor.uploadCsv')}</button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" hidden aria-label={t('editor.uploadCsv')} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void upload(f); }} />
        </>
      )}
      <button type="button" className={pill} onClick={download} disabled={!set.questions.length}><DownloadSimple weight="bold" size={18} />{t('editor.downloadCsv')}</button>
      <button type="button" className={pill} onClick={() => void copyToSheets()} disabled={!set.questions.length}><Table weight="bold" size={18} />{t('editor.copySheets')}</button>
      {note && <p className="basis-full text-sm font-bold" role="status">{note}</p>}
    </div>
  );
}
