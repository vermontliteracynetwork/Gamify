import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Copy, Eye, FileArrowUp, PencilSimple, Plus, Trash, WarningCircle } from '@phosphor-icons/react';
import { TIERS } from '../config';
import { data, newId } from '../data';
import { LOCAL_TEACHER_ID, useMySets, useTier } from '../data/hooks';
import { LIBRARY } from '../data/library';
import type { QuestionSet } from '../data/types';
import { blankQuestion, isPlayable } from '../engine/questions';
import { t } from '../i18n';
import { Button, buttonClasses, PageHeader, Panel, Tabs } from '../ui/kit';

type Tab = 'mine' | 'library';

export function newSet(name: string, questions: QuestionSet['questions']): QuestionSet {
  const now = new Date().toISOString();
  return { id: newId('set'), name, questions, ownerId: LOCAL_TEACHER_ID, visibility: 'private', createdAt: now, updatedAt: now };
}

export default function QuestionSetsPage() {
  const [tab, setTab] = useState<Tab>('mine');
  const { value: sets = [], reload } = useMySets();
  const tier = useTier();
  const limit = TIERS[tier].savedQuestionSets;
  const atLimit = sets.length >= limit;
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState<string | null>(null);

  async function create() {
    const set = newSet('', [blankQuestion(newId('q'))]);
    await data.saveQuestionSet(set);
    navigate(`/teacher/sets/${set.id}`);
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-24">
      <PageHeader
        title={t('sets.title')}
        subtitle={t('sets.subtitle')}
        actions={tab === 'mine' && (
          <>
            <Button variant="primary" onClick={create} disabled={atLimit}><Plus weight="bold" size={18} />{t('sets.new')}</Button>
            <Button onClick={() => navigate('/teacher/sets/import')} disabled={atLimit}><FileArrowUp weight="bold" size={18} />{t('sets.import')}</Button>
          </>
        )}
      />
      <Tabs label={t('sets.tabs')} value={tab} onChange={setTab} options={[{ id: 'mine', label: t('sets.mine') }, { id: 'library', label: t('sets.library') }]} />

      {tab === 'mine' ? (
        <div className="grid gap-3">
          <p className="font-bold text-text">
            {Number.isFinite(limit) ? t('sets.count', { count: sets.length, limit }) : t('sets.countUnlimited', { count: sets.length })}
          </p>
          {atLimit && <Panel className="bg-surface-2"><p className="font-bold">{t('sets.limitReached', { limit })}</p></Panel>}
          {sets.length === 0 && <Panel><p className="font-bold text-text">{t('sets.emptyMine')}</p></Panel>}
          {sets.map((s) => {
            const notReady = s.questions.filter((q) => !isPlayable(q)).length;
            return (
              <Panel key={s.id} className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-xl font-bold truncate">{s.name || t('sets.untitled')}</h2>
                  <p className="text-muted text-sm font-bold">
                    {t('sets.questions', { count: s.questions.length })}
                    {notReady > 0 && <span className="text-text ml-2 inline-flex items-center gap-1"><WarningCircle weight="fill" size={16} />{t('sets.needsWork', { count: notReady })}</span>}
                  </p>
                </div>
                {confirming === s.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">{t('sets.deleteConfirm', { name: s.name || t('sets.untitled') })}</span>
                    <Button variant="danger" onClick={async () => { await data.deleteQuestionSet(s.id); setConfirming(null); reload(); }}>{t('sets.deleteYes')}</Button>
                    <Button variant="ghost" onClick={() => setConfirming(null)}>{t('sets.cancel')}</Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={() => navigate(`/teacher/sets/${s.id}`)}><PencilSimple weight="bold" size={18} />{t('sets.edit')}</Button>
                    <Button variant="ghost" aria-label={`${t('sets.delete')}: ${s.name || t('sets.untitled')}`} onClick={() => setConfirming(s.id)}><Trash weight="bold" size={18} /></Button>
                  </div>
                )}
              </Panel>
            );
          })}
        </div>
      ) : (
        <Library atLimit={atLimit} onCopied={(id) => navigate(`/teacher/sets/${id}`)} />
      )}
    </main>
  );
}

function Library({ atLimit, onCopied }: { atLimit: boolean; onCopied: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('');
  const subjects = useMemo(() => [...new Set(LIBRARY.map((s) => s.subject))].sort(), []);
  const shown = LIBRARY.filter((s) =>
    (!subject || s.subject === subject) &&
    (!query.trim() || `${s.name} ${s.subject} ${s.grade}`.toLowerCase().includes(query.trim().toLowerCase())));

  return (
    <div className="grid gap-3">
      <p className="font-bold text-text">{t('sets.copyNote')}</p>
      <div className="flex flex-wrap gap-2">
        <input
          id="library-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('sets.search')}
          aria-label={t('sets.search')}
          className="min-h-11 flex-1 min-w-48 px-4 rounded-input border-[2px] border-border bg-surface font-bold"
        />
        <select
          id="library-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          aria-label={t('sets.allSubjects')}
          className="min-h-11 px-3 rounded-input border-[2px] border-border bg-surface font-bold"
        >
          <option value="">{t('sets.allSubjects')}</option>
          {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {shown.map((s) => (
          <Panel key={s.id} className="flex flex-col gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted">{s.subject} · Grades {s.grade}</p>
              <h2 className="font-display text-xl font-bold">{s.name}</h2>
              <p className="text-muted text-sm font-bold">{t('sets.questions', { count: s.questions.length })}</p>
            </div>
            <div className="flex flex-wrap gap-2 mt-auto">
              <Link to={`/teacher/library/${s.id}`} className={buttonClasses()}><Eye weight="bold" size={18} />{t('sets.preview')}</Link>
              <Button
                disabled={atLimit}
                onClick={async () => {
                  const copy = newSet(s.name, s.questions.map((q) => ({ ...q, id: newId('q'), choices: [...q.choices] })));
                  await data.saveQuestionSet(copy);
                  onCopied(copy.id);
                }}
              >
                <Copy weight="bold" size={18} />{t('sets.copy')}
              </Button>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
