import { useMemo, useState, type DragEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Copy, Eye, FileArrowUp, FolderSimple, FolderSimplePlus, Info, MagnifyingGlass, PencilSimple, Play, Plus, RocketLaunch, Trash, Warning } from '@phosphor-icons/react';
import { TIERS } from '../config';
import { data, newId } from '../data';
import { LOCAL_TEACHER_ID, useAsync, useMySets, useTier } from '../data/hooks';
import { LIBRARY } from '../data/library';
import type { QuestionSet } from '../data/types';
import { blankQuestion, isPlayable } from '../engine/questions';
import { t } from '../i18n';
import { Button, buttonClasses, fieldClasses, IconButton, PageHeader, Panel, Tabs } from '../ui/kit';
import { gradeLabel, matchesFilter, missingDetails, type SetFilter } from '../data/setDetails';
import { cleanFolder, facetOptions, folderNames, FOLDERS_KEY, hasFolder, inFolder, matchesFacets, type Facets } from '../data/folders';
import SetCover, { ART } from '../games/SetCover';
import SetFilterBar from '../games/SetFilterBar';
import TeacherNav from '../ui/TeacherNav';
import Dialog from '../ui/Dialog';
import HostDialog from './HostDialog';
import Title from '../ui/Title';
import { LimitNote } from '../billing/Upgrade';
import { setPlayStats, type PlayStats } from './reports';

type Tab = 'mine' | 'library';

export function newSet(name: string, questions: QuestionSet['questions']): QuestionSet {
  const now = new Date().toISOString();
  return { id: newId('set'), name, questions, ownerId: LOCAL_TEACHER_ID, visibility: 'private', createdAt: now, updatedAt: now };
}

// How the class did, as a color (approved teacher portal): 80% and up is
// Kelly, 60% and up Lemon, below that Pink Punch. The number always shows too,
// so color is never the only cue (WCAG 1.4.1).
export const skillColor = (pct: number) => (pct >= 80 ? 'var(--kelly)' : pct >= 60 ? 'var(--lemon)' : 'var(--pink-punch)');

// A short hint on a small (i): hover text with a mouse, read aloud for screen
// readers (design system: hints are hover text, never a line under a label).
export function Hint({ text }: { text: string }) {
  return <span className="inline-flex text-muted cursor-help align-middle"><span data-tip={text} aria-hidden="true" className="inline-flex"><Info weight="bold" size={15} /></span><span className="sr-only">{text}</span></span>;
}

// Question sets (approved teacher portal 6a, "Question sets (with folders)",
// 2026-11-25): folders and a faceted filter on the left (subject, grade,
// standard beat one long list), and one row per set with its standards, a
// need-work badge, how the class did on the first try (information scent,
// NN/g) and Use, which starts Create an Activity with the set filled in.
export default function QuestionSetsPage() {
  const [tab, setTab] = useState<Tab>('mine');
  const { value: sets = [], reload } = useMySets();
  const tier = useTier();
  const limit = TIERS[tier].savedQuestionSets;
  const atLimit = sets.length >= limit;
  const navigate = useNavigate();
  const [hosting, setHosting] = useState<QuestionSet | null>(null);

  async function create() {
    const set = newSet('', [blankQuestion(newId('q'))]);
    await data.saveQuestionSet(set);
    navigate(`/teacher/sets/${set.id}`);
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24">
      <TeacherNav />
      <PageHeader
        title={t('sets.title')}
        actions={tab === 'mine' && (
          <>
            <Button onClick={() => navigate('/teacher/activity')}><RocketLaunch weight="bold" size={18} />{t('activity.title')}</Button>
            <Button onClick={() => navigate('/teacher/sets/import')} disabled={atLimit}><FileArrowUp weight="bold" size={18} />{t('sets.import')}</Button>
            <Button variant="primary" onClick={create} disabled={atLimit}><Plus weight="bold" size={18} />{t('sets.new')}</Button>
          </>
        )}
      />
      <Tabs label={t('sets.tabs')} value={tab} onChange={setTab} className="mb-4"
        options={[{ id: 'mine', label: sets.length ? `${t('sets.mine')} (${sets.length})` : t('sets.mine') }, { id: 'library', label: t('sets.library') }]} />

      {tab === 'mine'
        ? <MySets sets={sets} reload={reload} limit={limit} atLimit={atLimit} onHost={setHosting} />
        : <Library atLimit={atLimit} onCopied={(id) => navigate(`/teacher/sets/${id}`)} onHost={setHosting} />}
      {hosting && <HostDialog set={hosting} onClose={() => setHosting(null)} />}
    </main>
  );
}

type FolderDialog = { kind: 'new'; moving?: QuestionSet } | { kind: 'rename'; name: string } | { kind: 'move'; set: QuestionSet } | null;

function MySets({ sets, reload, limit, atLimit, onHost }: { sets: QuestionSet[]; reload: () => void; limit: number; atLimit: boolean; onHost: (s: QuestionSet) => void }) {
  const navigate = useNavigate();
  const { value: log } = useAsync(() => data.listQuestionLog());
  const stats = useMemo(() => setPlayStats(log ?? []), [log]);
  const { value: saved = [], reload: reloadSaved } = useAsync(async () => (await data.getSetting<string[]>(FOLDERS_KEY)) ?? []);
  const folders = folderNames(sets, saved);
  const [folder, setFolder] = useState<string | null>(null);
  const open = folder && folders.some((f) => f === folder) ? folder : null;
  const [facets, setFacets] = useState<Facets>({});
  const [dialog, setDialog] = useState<FolderDialog>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [dropOn, setDropOn] = useState<string | null>(null);

  const inView = open ? sets.filter((s) => inFolder(s, open)) : sets;
  const options = facetOptions(inView);
  const shown = inView.filter((s) => matchesFacets(s, facets));
  const filtering = !!(facets.subject || facets.grade || facets.standard || facets.search?.trim());

  async function saveFolders(list: string[]) { await data.setSetting(FOLDERS_KEY, folderNames([], list)); reloadSaved(); }
  async function move(set: QuestionSet, to: string | undefined) {
    await data.saveQuestionSet({ ...set, folder: to ? cleanFolder(to) : undefined });
    reload();
  }
  async function makeFolder(name: string, moving?: QuestionSet) {
    const n = cleanFolder(name);
    await saveFolders([...saved, n]);
    if (moving) await move(moving, n); else setFolder(n);
  }
  async function renameFolder(from: string, to: string) {
    const n = cleanFolder(to);
    for (const s of sets.filter((x) => inFolder(x, from))) await data.saveQuestionSet({ ...s, folder: n });
    await saveFolders([...saved.filter((f) => !inFolder({ folder: f }, from)), n]);
    reload();
    setFolder(n);
  }
  async function removeFolder(name: string) {
    for (const s of sets.filter((x) => inFolder(x, name))) await data.saveQuestionSet({ ...s, folder: undefined });
    await saveFolders(saved.filter((f) => !inFolder({ folder: f }, name)));
    reload();
    setFolder(null);
  }
  // Drag a set onto a folder (mouse); Move does the same on every device.
  const dropProps = (name: string) => ({
    onDragOver: (e: DragEvent) => { if (e.dataTransfer.types.includes('text/gamify-set')) { e.preventDefault(); setDropOn(name); } },
    onDragLeave: () => setDropOn(null),
    onDrop: (e: DragEvent) => { e.preventDefault(); setDropOn(null); const s = sets.find((x) => x.id === e.dataTransfer.getData('text/gamify-set')); if (s) void move(s, name); },
  });

  const folderBtn = (on: boolean, drop: boolean) => `w-full min-h-10 px-3 rounded-input flex items-center gap-2 text-sm font-bold text-left border-std ${
    on ? 'bg-lavender border-border' : drop ? 'bg-accent border-border' : 'bg-surface-2 border-transparent hover:border-border-soft'}`;

  return (
    <div className="grid gap-4 min-[1000px]:grid-cols-[15rem_minmax(0,1fr)] items-start">
      <div className="grid gap-4 min-[640px]:max-[999px]:grid-cols-2 items-start">
        <Panel className="grid gap-2">
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-bold text-base flex-1">{t('sets.folders')}</h2>
            <Button size="sm" aria-label={t('sets.newFolder')} onClick={() => setDialog({ kind: 'new' })}><Plus weight="bold" size={14} />{t('sets.newShort')}</Button>
          </div>
          <ul className="list-none m-0 p-0 grid gap-1" aria-label={t('sets.folders')}>
            <li><button type="button" aria-pressed={!open} onClick={() => setFolder(null)} className={folderBtn(!open, false)}>
              <FolderSimple weight={!open ? 'fill' : 'bold'} size={18} aria-hidden="true" /><span className="flex-1 min-w-0">{t('sets.allSets')}</span><span className="text-muted text-xs">{sets.length}</span>
            </button></li>
            {folders.map((f) => {
              const n = sets.filter((s) => inFolder(s, f)).length;
              return (
                <li key={f} {...dropProps(f)}><button type="button" aria-pressed={open === f} onClick={() => setFolder(f)} className={folderBtn(open === f, dropOn === f)}>
                  <FolderSimple weight={open === f ? 'fill' : 'bold'} size={18} aria-hidden="true" /><span className="flex-1 min-w-0 break-words">{f}</span><span className="text-muted text-xs">{n}</span>
                </button></li>
              );
            })}
          </ul>
          {open && (
            <div className="flex flex-wrap gap-1">
              <Button size="sm" variant="ghost" aria-label={t('sets.renameFolder', { name: open })} onClick={() => setDialog({ kind: 'rename', name: open })}><PencilSimple weight="bold" size={14} />{t('sets.renameShort')}</Button>
              <Button size="sm" variant="ghost" aria-label={t('sets.removeFolder', { name: open })} data-tip={t('sets.removeFolderNote')} onClick={() => void removeFolder(open)}><Trash weight="bold" size={14} />{t('sets.removeFolderShort')}</Button>
            </div>
          )}
          {folders.length > 0 && <p className="text-xs font-semibold text-muted hidden [@media(pointer:fine)]:block">{t('sets.dropHint')}</p>}
        </Panel>

        <Panel className="grid gap-3">
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-bold text-base flex-1">{t('sets.filter')}</h2>
            {filtering && <Button size="sm" variant="ghost" onClick={() => setFacets({})}>{t('sets.clearFilters')}</Button>}
          </div>
          <label className="relative">
            <MagnifyingGlass weight="bold" size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input type="search" value={facets.search ?? ''} onChange={(e) => setFacets({ ...facets, search: e.target.value })} placeholder={t('sets.searchMine')} aria-label={t('sets.searchMine')} className={fieldClasses('sm', 'w-full pl-8')} />
          </label>
          <Facet label={t('filter.subject')} options={options.subjects} value={facets.subject} onPick={(v) => setFacets({ ...facets, subject: v })} />
          <Facet label={t('filter.grade')} options={options.grades} value={facets.grade} onPick={(v) => setFacets({ ...facets, grade: v })} />
          <Facet label={t('sets.standard')} options={options.standards} value={facets.standard} onPick={(v) => setFacets({ ...facets, standard: v })} />
        </Panel>
      </div>

      <div className="grid gap-3 min-w-0">
        <p className="font-bold text-text text-sm">
          {Number.isFinite(limit) ? t('sets.count', { count: sets.length, limit }) : t('sets.countUnlimited', { count: sets.length })}
        </p>
        {atLimit && <LimitNote>{t('sets.limitReached', { limit })}</LimitNote>}
        {sets.length === 0 && <Panel><p className="font-bold text-text">{t('sets.emptyMine')}</p></Panel>}
        {sets.length > 0 && shown.length === 0 && <Panel><p className="font-bold text-text">{open && !inView.length ? t('sets.emptyFolder') : t('sets.noneMatch')}</p></Panel>}
        {shown.length > 0 && (
          <section className="@container bg-surface border-bold border-border rounded-panel p-2" style={{ boxShadow: 'var(--shadow-sticker)' }}>
            <ul className="list-none m-0 p-0">
              {shown.map((s, i) => (
                <SetRow key={s.id} set={s} first={i === 0} stats={stats.get(s.id)} confirming={confirming === s.id}
                  onEdit={() => navigate(`/teacher/sets/${s.id}`)}
                  onMove={() => setDialog({ kind: 'move', set: s })}
                  onUse={() => navigate(`/teacher/activity?set=${encodeURIComponent(s.id)}`)}
                  onHost={() => onHost(s)}
                  onDelete={() => setConfirming(s.id)}
                  onConfirm={async () => { await data.deleteQuestionSet(s.id); setConfirming(null); reload(); }}
                  onCancel={() => setConfirming(null)} />
              ))}
            </ul>
          </section>
        )}
      </div>

      {dialog?.kind === 'move' && (
        <Dialog title={t('sets.moveTitle')} sub={dialog.set.name || t('sets.untitled')} size="sm" onClose={() => setDialog(null)} closeLabel={t('sets.cancel')}>
          <div className="grid gap-1.5">
            {[undefined, ...folders].map((f) => {
              const here = f ? inFolder(dialog.set, f) : !cleanFolder(dialog.set.folder ?? '');
              return (
                <button key={f ?? ''} type="button" aria-pressed={here} onClick={async () => { setDialog(null); await move(dialog.set, f); }} className={folderBtn(here, false)}>
                  <FolderSimple weight={here ? 'fill' : 'bold'} size={18} aria-hidden="true" /><span className="flex-1">{f ?? t('sets.noFolder')}</span>{here && <Check weight="bold" size={16} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
          <Button onClick={() => setDialog({ kind: 'new', moving: dialog.set })}><FolderSimplePlus weight="bold" size={18} />{t('sets.moveNew')}</Button>
        </Dialog>
      )}
      {(dialog?.kind === 'new' || dialog?.kind === 'rename') && (
        <FolderNameDialog
          title={dialog.kind === 'new' ? t('sets.newFolder') : t('sets.renameFolder', { name: dialog.name })}
          start={dialog.kind === 'rename' ? dialog.name : ''}
          taken={(n) => hasFolder(folders, n, dialog.kind === 'rename' ? dialog.name : undefined)}
          onClose={() => setDialog(null)}
          onSave={async (n) => { const d = dialog; setDialog(null); if (d.kind === 'new') await makeFolder(n, d.moving); else await renameFolder(d.name, n); }} />
      )}
    </div>
  );
}

function Facet<T extends string>({ label, options, value, onPick }: { label: string; options: T[]; value?: T; onPick: (v: T | undefined) => void }) {
  if (!options.length) return null;
  return (
    <div className="grid gap-1.5" role="group" aria-label={label}>
      <b className="text-xs text-muted">{label}</b>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = value === o;
          return (
            <button key={o} type="button" aria-pressed={on} aria-label={t('sets.filterBy', { value: `${label} ${o}` })} onClick={() => onPick(on ? undefined : o)}
              className={`tap min-h-8 px-3 rounded-pill text-sm font-bold inline-flex items-center gap-1 border-std ${on ? 'bg-mint-soft border-border' : 'bg-surface-2 border-transparent hover:border-border-soft'}`}>
              {on && <Check weight="bold" size={12} aria-hidden="true" />}{o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FolderNameDialog({ title, start, taken, onClose, onSave }: { title: string; start: string; taken: (n: string) => boolean; onClose: () => void; onSave: (n: string) => void }) {
  const [name, setName] = useState(start);
  const n = cleanFolder(name);
  const clash = !!n && taken(n);
  return (
    <Dialog title={title} size="sm" onClose={onClose} closeLabel={t('sets.cancel')}>
      <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); if (n && !clash) onSave(n); }}>
        <label className="grid gap-1 font-bold text-sm">{t('sets.folderName')}
          <input autoFocus value={name} maxLength={40} onChange={(e) => setName(e.target.value)} className={fieldClasses('md')} aria-invalid={clash} />
        </label>
        {clash && <p className="text-sm font-bold text-error" role="status">{t('sets.folderExists')}</p>}
        <Button type="submit" variant="primary" disabled={!n || clash || n === start}><FolderSimplePlus weight="bold" size={18} />{start ? t('sets.save') : t('sets.folderMake')}</Button>
      </form>
    </Dialog>
  );
}

function SetRow({ set: s, first, stats, confirming, onEdit, onMove, onUse, onHost, onDelete, onConfirm, onCancel }: {
  set: QuestionSet; first: boolean; stats?: PlayStats; confirming: boolean;
  onEdit: () => void; onMove: () => void; onUse: () => void; onHost: () => void; onDelete: () => void; onConfirm: () => void; onCancel: () => void;
}) {
  const name = s.name || t('sets.untitled');
  const notReady = s.questions.filter((q) => !isPlayable(q)).length;
  const art = ART[s.subject ?? 'Other'];
  const chips: ReactNode = (s.standards?.length || s.noStandard) ? (
    <span className="flex flex-wrap gap-1">
      {(s.standards ?? []).map((c) => <span key={c} className="min-h-7 px-2.5 rounded-pill bg-lavender text-xs font-bold inline-flex items-center">{c}</span>)}
      {s.noStandard && <span className="min-h-7 px-2.5 rounded-pill bg-lavender text-xs font-bold inline-flex items-center">{t('sets.noStandardChip')}</span>}
    </span>
  ) : null;
  const meta = [s.subject, s.grades && t('filter.gradesShort', { grades: gradeLabel(s.grades) }), t('sets.questions', { count: s.questions.length })].filter(Boolean).join(', ');
  return (
    <li draggable onDragStart={(e) => { e.dataTransfer.setData('text/gamify-set', s.id); e.dataTransfer.effectAllowed = 'move'; }}
      className={`grid items-center gap-x-4 gap-y-2 px-3 py-3 grid-cols-[3.5rem_minmax(0,1fr)_auto] @[64rem]:grid-cols-[3.5rem_minmax(0,1fr)_12rem_9rem_auto] ${first ? '' : 'border-t border-border/10'}`}>
      <span aria-hidden="true" className="row-span-2 @[64rem]:row-span-1 self-start @[64rem]:self-center w-14 h-14 rounded-input grid place-items-center font-display text-2xl uppercase" style={{ background: art.bg, color: art.ink }}>{name.trim()[0]}</span>
      <div className="min-w-0 grid gap-1">
        <h2 className="font-heading text-base font-bold leading-snug"><Title text={name} /></h2>
        <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-muted">
          {meta}
          {notReady > 0 && <span className="min-h-7 px-2.5 rounded-pill bg-secondary text-text text-xs font-bold inline-flex items-center gap-1"><Warning weight="bold" size={12} aria-hidden="true" />{t('sets.needsWork', { count: notReady })}</span>}
          {missingDetails(s).length > 0 && <span className="min-h-7 px-2.5 rounded-pill bg-butter text-text text-xs font-bold inline-flex items-center gap-1"><Warning weight="bold" size={12} aria-hidden="true" />{t('sets.needsDetails')}</span>}
        </p>
      </div>
      {chips && <span className="hidden @[64rem]:flex">{chips}</span>}
      <span className="w-[9rem] grid gap-1 text-sm font-bold self-start @[64rem]:self-center">
        {stats ? (
          <>
            <span className="text-xs text-muted">{t('sets.firstTry')}</span>
            <span className="inline-flex items-center gap-2">
              <span role="img" aria-label={t('sets.firstTryPct', { pct: stats.pct })} className="inline-block h-2.5 w-[4.5rem] rounded-full overflow-hidden bg-[var(--cream)]"><span className="block h-full rounded-full" style={{ width: `${stats.pct}%`, background: skillColor(stats.pct) }} /></span>
              <span aria-hidden="true">{stats.pct}%</span>
            </span>
          </>
        ) : <span className="text-xs text-muted">{t('sets.notPlayed')}</span>}
      </span>
      {confirming ? (
        <div className="col-span-2 @[64rem]:col-span-1 flex flex-wrap items-center gap-2">
          <span className="font-bold text-sm">{t('sets.deleteConfirm', { name })}</span>
          <Button variant="danger" size="sm" onClick={onConfirm}>{t('sets.deleteYes')}</Button>
          <Button variant="ghost" size="sm" onClick={onCancel}>{t('sets.cancel')}</Button>
        </div>
      ) : (
        <div className="col-span-2 @[64rem]:col-span-1 flex flex-wrap items-center gap-1.5">
          {chips && <span className="@[64rem]:hidden mr-auto">{chips}</span>}
          <Button size="sm" onClick={onEdit} aria-label={t('sets.editN', { name })}><PencilSimple weight="bold" size={14} />{t('sets.edit')}</Button>
          <Button size="sm" onClick={onMove} aria-label={t('sets.moveN', { name })}><FolderSimple weight="bold" size={14} />{t('sets.move')}</Button>
          <Button size="sm" variant="primary" onClick={onUse} aria-label={t('sets.useN', { name })}>{t('sets.use')}<ArrowRight weight="bold" size={14} /></Button>
          <IconButton label={t('sets.playN', { name })} onClick={onHost}><Play weight="fill" size={16} /></IconButton>
          <IconButton variant="ghost" label={`${t('sets.delete')}: ${name}`} onClick={onDelete}><Trash weight="bold" size={16} /></IconButton>
        </div>
      )}
    </li>
  );
}

function Library({ atLimit, onCopied, onHost }: { atLimit: boolean; onCopied: (id: string) => void; onHost: (s: QuestionSet) => void }) {
  const [filter, setFilter] = useState<SetFilter>({});
  const shown = LIBRARY.filter((s) => matchesFilter(s, filter));

  return (
    <div className="grid gap-3">
      <p className="font-bold text-text">{t('sets.copyNote')}</p>
      <SetFilterBar value={filter} onChange={setFilter} sets={LIBRARY} />
      {shown.length === 0 && <Panel><p className="font-bold">{t('filter.none')}</p></Panel>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {shown.map((s) => (
          <div key={s.id} className="bg-surface border-bold border-border rounded-panel overflow-hidden flex flex-col" style={{ boxShadow: 'var(--shadow-sticker)' }}>
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
