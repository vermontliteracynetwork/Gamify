import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Copy, Eye, FileArrowUp, PencilSimple, Plus, Trash, WarningCircle, Play } from '@phosphor-icons/react';
import { TIERS } from '../config';
import { data, newId } from '../data';
import { LOCAL_TEACHER_ID, useMySets, useTier } from '../data/hooks';
import { LIBRARY } from '../data/library';
import type { QuestionSet } from '../data/types';
import { blankQuestion, isPlayable } from '../engine/questions';
import { t } from '../i18n';
import { Button, buttonClasses, PageHeader, Panel, Tabs } from '../ui/kit';
import { gradeLabel, matchesFilter, missingDetails, type SetFilter } from '../data/setDetails';
import SetCover from '../games/SetCover';
import SetFilterBar from '../games/SetFilterBar';
import TeacherNav from '../ui/TeacherNav';
import HostDialog from './HostDialog';
import Title from '../ui/Title';

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
  const [hosting, setHosting] = useState<QuestionSet | null>(null);

  async function create() {
    const set = newSet('', [blankQuestion(newId('q'))]);
    await data.saveQuestionSet(set);
    navigate(`/teacher/sets/${set.id}`);
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-24">
      <TeacherNav />
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
                  <h2 className="font-display text-xl font-bold truncate"><Title text={s.name || t('sets.untitled')} /></h2>
                  <p className="text-muted text-sm font-bold">
                    {t('sets.questions', { count: s.questions.length })}
                    {notReady > 0 && <span className="text-text ml-2 inline-flex items-center gap-1"><WarningCircle weight="fill" size={16} />{t('sets.needsWork', { count: notReady })}</span>}
                    {missingDetails(s).length > 0 && <span className="text-text ml-2 inline-flex items-center gap-1"><WarningCircle weight="fill" size={16} />{t('sets.needsDetails')}</span>}
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
                    <Button variant="primary" onClick={() => setHosting(s)}><Play weight="fill" size={18} />{t('host.open')}</Button>
                    <Button onClick={() => navigate(`/teacher/sets/${s.id}`)}><PencilSimple weight="bold" size={18} />{t('sets.edit')}</Button>
                    <Button variant="ghost" aria-label={`${t('sets.delete')}: ${s.name || t('sets.untitled')}`} onClick={() => setConfirming(s.id)}><Trash weight="bold" size={18} /></Button>
                  </div>
                )}
              </Panel>
            );
          })}
        </div>
      ) : (
        <Library atLimit={atLimit} onCopied={(id) => navigate(`/teacher/sets/${id}`)} onHost={setHosting} />
      )}
      {hosting && <HostDialog set={hosting} onClose={() => setHosting(null)} />}
    </main>
  );
}

function Library({ atLimit, onCopied, onHost }: { atLimit: boolean; onCopied: (id: string) => void; onHost: (s: QuestionSet) => void }) {
  const [filter, setFilter] = useState<SetFilter>({});
  const shown = LIBRARY.filter((s) => matchesFilter(s, filter));

  return (
    <div className="grid gap-3">
      <p className="font-bold text-text">{t('sets.copyNote')}</p>
      <SetFilterBar value={filter} onChange={setFilter} />
      {shown.length === 0 && <Panel><p className="font-bold">{t('filter.none')}</p></Panel>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {shown.map((s) => (
          <div key={s.id} className="bg-surface border-[2.5px] border-border rounded-panel overflow-hidden flex flex-col" style={{ boxShadow: 'var(--shadow-sticker)' }}>
            <SetCover set={s} className="aspect-[16/7] border-b-[2.5px] border-border" />
            <div className="p-4 flex flex-col gap-2 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">{s.subject} · {t('filter.gradesShort', { grades: gradeLabel(s.grades!) })}</p>
              <h2 className="font-display text-xl font-bold"><Title text={s.name} /></h2>
              <p className="text-muted text-sm font-bold">{t('sets.questions', { count: s.questions.length })}</p>
              <p className="flex flex-wrap gap-1">
                {(s.standards ?? []).map((c) => <span key={c} className="text-xs font-bold px-2 py-0.5 rounded-pill border border-border bg-surface-2">{c}</span>)}
                {(s.tags ?? []).map((tag) => <span key={tag} className="text-xs font-bold px-2 py-0.5 rounded-pill bg-surface-2 text-muted">#{tag}</span>)}
              </p>
              <div className="flex flex-wrap gap-2 mt-auto pt-1">
                <Button variant="primary" onClick={() => onHost(s)}><Play weight="fill" size={18} />{t('host.open')}</Button>
                <Link to={`/teacher/library/${s.id}`} className={buttonClasses()}><Eye weight="bold" size={18} />{t('sets.preview')}</Link>
                <Button disabled={atLimit} onClick={async () => {
                  const copy = { ...newSet(s.name, s.questions.map((q) => ({ ...q, id: newId('q'), choices: [...q.choices] }))),
                    subject: s.subject, grades: s.grades, tags: s.tags, standards: s.standards, noStandard: s.noStandard, cover: s.cover };
                  await data.saveQuestionSet(copy);
                  onCopied(copy.id);
                }}><Copy weight="bold" size={18} />{t('sets.copy')}</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
