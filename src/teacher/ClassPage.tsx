import { makeGameCode } from '../data/gameCodes';
import { useCrumbLabel } from '../ui/Breadcrumbs';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { DiceFive, GearSix, Heart, Plus, Printer, Star, Trash, UploadSimple } from '@phosphor-icons/react';
import { TIERS } from '../config';
import { data, newId } from '../data';
import { useAsync, useMySets, useTier } from '../data/hooks';
import { LIBRARY } from '../data/library';
import { ALL_MODES, type Classroom, type PlayMode, type SetAssignment, type Student } from '../data/types';
import { ModeBadge } from '../games/ModeBadge';
import SetPicker from '../games/SetPicker';
import { t } from '../i18n';
import { DEFAULT_SETTINGS } from '../settings/settings';
import { avatarOf, drawnExtras, isUploadedAvatar, newPicturePassword, newPin, PICTURES, PIN_RULE } from '../student/pictures';
import Avatar from '../student/Avatar';
import { imageFileToDataUrl } from '../ui/imageFile';
import { useFavoriteThemes, useMadeThemes } from '../theme/made';
import { themesFor } from '../theme/library';
import { ALL_GAMES, GAMES } from '../games/registry';
import { ChoiceRow, Slider, Toggle } from '../ui/fields';
import { Button, buttonClasses, PageHeader, Panel, Tabs } from '../ui/kit';
import TeacherNav from '../ui/TeacherNav';
import { readOnlyIds } from '../data/downgrade';
import { LimitNote, UpgradeButton } from '../billing/Upgrade';
import SharedDialog from '../ui/Dialog';
import ReportDoc, { supportsText } from './reportDoc';
import type { GameTheme } from '../theme/types';

type Tab = 'students' | 'report' | 'sets' | 'modes';

// One classroom: the class list with avatar + PIN sign-in and per-student
// accommodations (behind the teacher PIN), assigned sets, and which play
// modes students see. On Free there are no classes (teacher, 2026-10-26):
// this page is the teacher's one student list, "My students".
export default function ClassPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => (['students', 'report', 'sets', 'modes'] as Tab[]).find((x) => x === params.get('tab')) ?? 'students');
  const { value: classes = [], reload: reloadClass } = useAsync(() => data.listClassrooms());
  const [designCode, setDesignCode] = useState('');
  const { value: students = [], reload: reloadStudents } = useAsync(() => data.listStudents(id), [id]);
  const { value: assignments = [], reload: reloadAssignments } = useAsync(() => data.listAssignments(id), [id]);
  const classroom = classes.find((c) => c.id === id);
  const tier = useTier();
  // Downgrade rules: classes past the plan limit stay, read-only.
  const frozen = readOnlyIds(classes, TIERS[tier].classrooms).has(id);
  const free = !TIERS[tier].hasClasses;
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    // Classes made before join codes existed get one now.
  }, [classroom]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Students added before PIN sign-in get a PIN now.
    const missing = students.filter((s) => !s.pin);
    if (!missing.length) return;
    const taken = students.map((s) => s.pin ?? '');
    void Promise.all(missing.map((s) => { const pin = newPin(taken); taken.push(pin); return data.saveStudent({ ...s, pin }); })).then(reloadStudents);
  }, [students]); // eslint-disable-line react-hooks/exhaustive-deps
  useCrumbLabel(classroom?.name);
  if (!classroom) return null;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-24">
      <TeacherNav />
      {/* No class join codes (teacher, 2026-10-31): students get in with a game code or link. */}
      {/* Just the class name and New assignment (teacher, 2026-11-20: no counts
          line, no name chips, no header Class report button; the report is a tab). */}
      <PageHeader title={free ? t('roster.title') : classroom.name}
        actions={<Link to={`/teacher/classes/${id}/assign`} className={buttonClasses('primary', 'hover-pop')}><Plus weight="bold" size={18} />{t('class.newAssignment')}</Link>} />
      <Tabs label={t('class.tabs')} value={tab} onChange={setTab} options={[
        { id: 'students', label: t('class.tab.students') }, { id: 'report', label: t('rp.classReport') }, { id: 'sets', label: t('class.tab.sets') }, { id: 'modes', label: t('class.tab.modes') },
      ]} />
      {frozen && <LimitNote className="mb-4">{t('class.frozen')}</LimitNote>}
      <fieldset disabled={frozen} className="contents">
      {tab === 'students' && <StudentsTab classroomId={id} students={students} reload={reloadStudents} signInThemeId={classroom.signInThemeId} side={<SignInLook classroom={classroom} onChange={reloadClass} />} />}
      {tab === 'report' && <ClassReport classId={id} className={classroom.name} students={students} />}
      {tab === 'sets' && <SetsTab classroomId={id} students={students} assignments={assignments} reload={reloadAssignments} />}
      {tab === 'modes' && (
        <Panel className="grid gap-3">
          <p className="font-bold">{t('class.modesNote')}</p>
          {ALL_MODES.map((m) => {
            const on = (classroom.allowedModes ?? ALL_MODES).includes(m);
            return (
              <div key={m} className="flex flex-wrap items-center gap-3">
                <ModeBadge mode={m} withHint />
                <div className="ml-auto min-w-40">
                  <Toggle label={on ? t('class.modeOn') : t('class.modeOff')} value={on} onChange={async (v) => {
                    const cur = classroom.allowedModes ?? ALL_MODES;
                    await data.saveClassroom({ ...classroom, allowedModes: v ? ALL_MODES.filter((x) => x === m || cur.includes(x)) : cur.filter((x) => x !== m) });
                    reloadClass();
                  }} />
                </div>
              </div>
            );
          })}
          <div className="flex flex-wrap items-center gap-3 border-t-[2px] border-border-soft pt-3">
            <div className="grid"><span className="font-bold">{t('class.studentDesign')}</span><span className="text-sm font-semibold text-muted">{t('class.studentDesignHint')}</span></div>
            <div className="ml-auto min-w-40">
              <Toggle label={classroom.studentDesign ? t('class.modeOn') : t('class.modeOff')} value={!!classroom.studentDesign} onChange={async (v) => { await data.saveClassroom({ ...classroom, studentDesign: v }); reloadClass(); }} />
            </div>
            {/* Students reach the design studio with a code, like a game (teacher, 2026-10-31). */}
            {classroom.studentDesign && (
              <div className="basis-full flex flex-wrap items-center gap-2">
                <Button variant="primary" onClick={async () => setDesignCode((await makeGameCode('design', '', 'design')).code)}>{t('class.designCode')}</Button>
                {designCode && <>
                  <span className="font-display text-2xl tracking-[0.2em]" aria-label={t('class.designCodeIs', { code: designCode })}>{designCode}</span>
                  <Link to={`/show/${designCode}`} className={buttonClasses('secondary')}>{t('class.showCode')}</Link>
                </>}
              </div>
            )}
          </div>
        </Panel>
      )}
      </fieldset>
      {!free && <div className="mt-8">
        {confirmDelete ? (
          <Panel className="grid gap-2">
            <p className="font-bold">{t('class.deleteConfirm', { name: classroom.name })}</p>
            <div className="flex gap-2">
              <Button variant="danger" onClick={async () => { await data.deleteClassroom(id); navigate('/teacher/classes'); }}><Trash weight="bold" size={18} />{t('class.deleteYes')}</Button>
              <Button onClick={() => setConfirmDelete(false)}>{t('class.keep')}</Button>
            </div>
          </Panel>
        ) : <Button variant="ghost" onClick={() => setConfirmDelete(true)}><Trash weight="bold" size={18} />{t('class.delete')}</Button>}
      </div>}
    </main>
  );
}

function StudentsTab({ classroomId, students, reload, signInThemeId, side }: { classroomId: string; students: Student[]; reload: () => void; signInThemeId?: string; side?: React.ReactNode }) {
  const { themes } = useMadeThemes();
  const look = themes.find((th) => th.id === signInThemeId);
  const tier = useTier();
  const limit = TIERS[tier].studentsPerClassroom;
  const [names, setNames] = useState('');
  const [editing, setEditing] = useState<Student | null>(null);
  const [picking, setPicking] = useState<Student | null>(null);
  const toAdd = names.split('\n').map((n) => n.trim()).filter(Boolean);
  const room = Number.isFinite(limit) ? limit - students.length : Infinity;

  async function add() {
    const taken = students.map((s) => s.picturePassword);
    const pins = students.map((s) => s.pin ?? '');
    // Each new student gets the picture used least so far, counting the extra
    // pictures the class's sign-in design has drawn (one per student, 2026-11-20).
    const uses = new Map([...PICTURES.map((p) => p.id), ...drawnExtras(look)].map((id) => [id, students.filter((s) => avatarOf(s) === id).length]));
    for (const name of toAdd.slice(0, room)) {
      const pw = newPicturePassword(taken);
      taken.push(pw);
      const pin = newPin(pins);
      pins.push(pin);
      const avatar = [...uses.entries()].sort((a, b) => a[1] - b[1])[0][0];
      uses.set(avatar, (uses.get(avatar) ?? 0) + 1);
      await data.saveStudent({ id: newId('stu'), classroomId, name: name.slice(0, 30), picturePassword: pw, avatar, pin });
    }
    setNames('');
    reload();
  }
  // No teacher PIN on teacher pages (teacher, 2026-11-20): the signed-in
  // teacher is the only one here; students only come in through Join.
  function openSettings(s: Student) { setEditing(s); }

  // Laptop first (teacher, 2026-11-03 and 2026-11-20): the roster as one
  // compact table on the left, adding students and sign-in pictures beside it.
  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_20rem] gap-4 items-start">
      <Panel className="grid gap-2 !p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-bold">{t('class.tab.students')}</h2>
          <p className="font-bold text-sm text-muted tabular-nums">{Number.isFinite(limit) ? t('class.studentLimit', { count: students.length, limit }) : t('class.studentCount', { count: students.length })}</p>
        </div>
        {students.length === 0 ? <p className="font-bold">{t('class.noStudents')}</p> : (
          <table className="w-full text-sm border-collapse">
            <caption className="sr-only">{t('class.tab.students')}</caption>
            <thead><tr className="border-b-[2px] border-border text-left">
              <th scope="col" className="py-1.5 pr-2 font-bold">{t('rp.student')}</th>
              <th scope="col" className="py-1.5 pr-2 font-bold">{t('class.pinHead')}</th>
              <th scope="col" className="py-1.5 pr-2 font-bold">{t('rp.supports')}</th>
              <th scope="col" className="py-1.5 font-bold text-right"><span className="sr-only">{t('class.actions')}</span></th>
            </tr></thead>
            <tbody>
              {[...students].sort((a, b) => a.name.localeCompare(b.name)).map((s) => (
                <tr key={s.id} className="border-b border-border-soft last:border-0 hover:bg-surface-2/60">
                  <th scope="row" className="py-1.5 pr-2 text-left font-bold">
                    <span className="flex items-center gap-2.5">
                      <button type="button" onClick={() => setPicking(s)} aria-label={t('class.avatarFor', { name: s.name })} data-tip={t('class.avatarFor', { name: s.name })} className="rounded-full active:scale-95 shrink-0"><Avatar avatar={avatarOf(s)} theme={look} size={34} /></button>
                      <Link to={`/teacher/classes/${classroomId}/students/${s.id}`} className="[overflow-wrap:anywhere] underline-offset-2 hover:underline">{s.name}</Link>
                    </span>
                  </th>
                  <td className="py-1.5 pr-2 font-bold tabular-nums">{s.pin ?? ''}</td>
                  <td className="py-1.5 pr-2 font-semibold text-muted">{s.accommodations ? (supportsText(s) || t('class.hasSupports')) : '-'}</td>
                  <td className="py-1.5">
                    <span className="flex justify-end gap-1.5">
                      <button type="button" onClick={() => openSettings(s)} aria-label={t('class.supportsFor', { name: s.name })} data-tip={t('class.supportsFor', { name: s.name })} className="w-9 h-9 rounded-full border-std border-border bg-surface-2 flex items-center justify-center active:scale-95"><GearSix weight="bold" size={17} /></button>
                      <button type="button" onClick={async () => { await data.deleteStudent(s.id); reload(); }} aria-label={t('class.remove', { name: s.name })} data-tip={t('class.remove', { name: s.name })} className="w-9 h-9 rounded-full border-std border-border bg-surface flex items-center justify-center active:scale-95"><Trash weight="bold" size={17} /></button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
      <div className="grid gap-4">
        <Panel className="grid gap-2 !p-4">
          <label htmlFor="student-names" className="font-heading text-lg font-bold">{t('class.addStudentsShort')}</label>
          <textarea id="student-names" value={names} onChange={(e) => setNames(e.target.value)} rows={4} placeholder={t('class.namesPlaceholder')} aria-describedby="names-hint"
            className="px-3 py-2 rounded-input border-std border-border font-bold" />
          <p id="names-hint" className="text-xs font-semibold text-muted">{t('class.namesHint')}</p>
          <Button variant="primary" className="justify-self-start" disabled={toAdd.length === 0 || room <= 0} onClick={() => add()}><Plus weight="bold" size={18} />{t('class.add', { count: Math.min(toAdd.length, room) })}</Button>
          {toAdd.length > room && <div className="grid gap-2"><p className="font-bold text-sm">{t('class.overLimit', { limit })}</p><UpgradeButton className="min-h-10 px-3 text-sm justify-self-start" /></div>}
        </Panel>
        {side}
      </div>
      {editing && <SupportsDialog student={editing} onClose={() => { setEditing(null); reload(); }} />}
      {picking && <AvatarDialog student={picking} others={students.filter((x) => x.id !== picking.id)} look={look} onClose={() => { setPicking(null); reload(); }} />}
    </div>
  );
}

// A student's avatar and PIN (teacher, 2026-10-26): a built-in picture on
// every plan, or an uploaded picture on Plus and Pro; a PIN the teacher types
// or rolls, different from everyone else's on the list.
export function AvatarDialog({ student, others, look, onClose }: { student: Student; others: Student[]; look?: Parameters<typeof Avatar>[0]['theme']; onClose: () => void }) {
  const tier = useTier();
  const [avatar, setAvatar] = useState(avatarOf(student));
  const [pin, setPin] = useState(student.pin ?? '');
  const [problem, setProblem] = useState('');
  const taken = others.map((o) => o.pin ?? '');
  async function upload(file: File) {
    try { setAvatar(await imageFileToDataUrl(file, 256)); setProblem(''); } catch (e) { setProblem((e as Error).message); }
  }
  async function save() {
    if (!PIN_RULE.test(pin)) { setProblem(t('class.pinRule')); return; }
    if (taken.includes(pin)) { setProblem(t('class.pinTaken')); return; }
    await data.saveStudent({ ...student, avatar, pin });
    onClose();
  }
  return (
    <Dialog title={t('class.avatarFor', { name: student.name })} onClose={onClose}>
      <div className="flex items-center gap-3"><Avatar avatar={avatar} theme={look} size={80} /><p className="font-bold">{t('class.avatarHint')}</p></div>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2" role="radiogroup" aria-label={t('class.avatarPick')}>
        {[...PICTURES.map((p) => p.id), ...drawnExtras(look)].map((id) => (
          <button key={id} type="button" role="radio" aria-checked={avatar === id} aria-label={/^\d+$/.test(id) ? t('class.pictureN', { n: id }) : id} onClick={() => setAvatar(id)}
            className={`rounded-full p-1 ${avatar === id ? 'bg-accent ring-[3px] ring-border' : ''}`}><Avatar avatar={id} theme={look} size={52} /></button>
        ))}
      </div>
      {tier === 'free' ? (
        <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold">{t('class.avatarUploadPlus')}</p><UpgradeButton className="min-h-10 px-3 text-sm" /></div>
      ) : (
        <label className={buttonClasses('secondary', 'justify-self-start cursor-pointer')}>
          <UploadSimple weight="bold" size={18} />{isUploadedAvatar(avatar) ? t('class.avatarReplace') : t('class.avatarUpload')}
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
        </label>
      )}
      <label className="grid gap-1 font-bold">{t('class.pin')}
        <span className="flex gap-2">
          <input value={pin} inputMode="numeric" maxLength={4} onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setProblem(''); }}
            className="w-32 min-h-12 px-3 rounded-input border-std border-border font-display text-2xl tracking-[0.3em] tabular-nums" />
          <Button onClick={() => { setPin(newPin([...taken, pin])); setProblem(''); }}><DiceFive weight="bold" size={18} />{t('class.pinRoll')}</Button>
        </span>
      </label>
      <p className="min-h-6 font-bold text-error" role="alert">{problem}</p>
      <Button variant="primary" onClick={() => save()}>{t('class.avatarSave')}</Button>
    </Dialog>
  );
}

// Which sign-in picture design the class uses (built-in or one made in the
// Theme Builder).
function SignInLook({ classroom, onChange }: { classroom: Classroom; onChange: () => void }) {
  const { themes } = useMadeThemes();
  const looks = themes.filter((th) => th.gameId === 'sign-in');
  return (
    <Panel className="grid gap-2 !p-4">
      <ChoiceRow label={t('class.signInLook')} value={classroom.signInThemeId ?? 'built-in'}
        onChange={async (v) => { await data.saveClassroom({ ...classroom, signInThemeId: v === 'built-in' ? undefined : v }); onChange(); }}
        options={[{ value: 'built-in', label: t('class.signInBuiltIn') }, ...looks.map((th) => ({ value: th.id, label: th.name }))]} />
      <Link to="/teacher/themes/sign-in" className="font-bold text-sm underline justify-self-start">{t('class.signInDesign')}</Link>
    </Panel>
  );
}

// The shared pop-up box (src/ui/Dialog), with this page's close words.
export function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <SharedDialog title={title} onClose={onClose} closeLabel={t('class.close')}>{children}</SharedDialog>;
}

// Per-student accommodations (IEP-style), applied when they sign in.
export function SupportsDialog({ student, onClose }: { student: Student; onClose: () => void }) {
  const base = { readFirstSeconds: DEFAULT_SETTINGS.readFirstSeconds, triesPerQuestion: DEFAULT_SETTINGS.triesPerQuestion, shuffleAnswers: DEFAULT_SETTINGS.shuffleAnswers, tools: DEFAULT_SETTINGS.tools };
  const [a, setA] = useState({ ...base, ...student.accommodations, tools: { ...base.tools, ...student.accommodations?.tools } });
  const [modes, setModes] = useState<PlayMode[]>(student.allowedModes ?? ALL_MODES);
  async function save() {
    await data.saveStudent({ ...student, accommodations: a, allowedModes: modes.length === ALL_MODES.length ? undefined : modes });
    onClose();
  }
  return (
    <Dialog title={t('class.supportsFor', { name: student.name })} onClose={onClose}>
      <Slider label={t('settings.readFirst')} min={0} max={10} value={a.readFirstSeconds} show={(v) => (v === 0 ? t('settings.off') : `${v}s`)} onChange={(v) => setA({ ...a, readFirstSeconds: v })} />
      <Slider label={t('settings.tries')} min={1} max={4} value={a.triesPerQuestion} onChange={(v) => setA({ ...a, triesPerQuestion: v as 1 | 2 | 3 | 4 })} />
      <Toggle label={t('settings.shuffle')} value={a.shuffleAnswers} onChange={(v) => setA({ ...a, shuffleAnswers: v })} />
      <p className="font-bold">{t('class.tools')}</p>
      {(Object.keys(a.tools) as (keyof typeof a.tools)[]).map((k) => (
        <Toggle key={k} label={t(`tool.${k}`)} value={a.tools[k]} onChange={(v) => setA({ ...a, tools: { ...a.tools, [k]: v } })} />
      ))}
      <p className="font-bold">{t('class.studentModes')}</p>
      <div className="flex flex-wrap gap-2">
        {ALL_MODES.map((m) => (
          <button key={m} type="button" role="checkbox" aria-checked={modes.includes(m)} onClick={() => setModes(modes.includes(m) ? modes.filter((x) => x !== m) : [...modes, m])}
            className={`rounded-pill ${modes.includes(m) ? '' : 'opacity-40'}`}><ModeBadge mode={m} /></button>
        ))}
      </div>
      <Button variant="primary" onClick={() => save()}>{t('class.saveSupports')}</Button>
    </Dialog>
  );
}

// Assigned sets (teacher, 2026-11-20): the list on its own, a clear table;
// new assignments open their own page from a button.
function SetsTab({ classroomId, students, assignments, reload }: { classroomId: string; students: Student[]; assignments: SetAssignment[]; reload: () => void }) {
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const name = (sid: string) => sets.find((s) => s.id === sid)?.name ?? t('sets.untitled');
  const fmt = (d?: string) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '');
  return (
    <Panel className="grid gap-3 !p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-bold">{t('class.assigned')}</h2>
        <Link to={`/teacher/classes/${classroomId}/assign`} className={buttonClasses('primary', 'hover-pop')}><Plus weight="bold" size={18} />{t('class.newAssignment')}</Link>
      </div>
      {assignments.length === 0 ? <p className="font-bold">{t('class.noAssigned')}</p> : (
        <table className="w-full text-sm border-collapse">
          <caption className="sr-only">{t('class.assigned')}</caption>
          <thead><tr className="border-b-[2px] border-border text-left">
            <th scope="col" className="py-1.5 pr-2 font-bold">{t('rp.set')}</th>
            <th scope="col" className="py-1.5 pr-2 font-bold">{t('class.who')}</th>
            <th scope="col" className="py-1.5 pr-2 font-bold">{t('class.dates')}</th>
            <th scope="col" className="py-1.5 pr-2 font-bold">{t('class.themesShort')}</th>
            <th scope="col" className="py-1.5 font-bold text-right"><span className="sr-only">{t('class.actions')}</span></th>
          </tr></thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={a.id} className="border-b border-border-soft last:border-0">
                <th scope="row" className="py-2 pr-2 text-left font-bold">{name(a.setId)}</th>
                <td className="py-2 pr-2 font-semibold">{a.studentId ? students.find((s) => s.id === a.studentId)?.name : t('class.wholeClass')}</td>
                <td className="py-2 pr-2 font-semibold tabular-nums">{a.startsOn || a.endsOn ? `${fmt(a.startsOn) || t('class.now')} to ${fmt(a.endsOn) || t('class.noEnd')}` : t('class.anyTime')}</td>
                <td className="py-2 pr-2 font-semibold">{a.themeIds?.length ? t('class.themeCount', { count: a.themeIds.length }) : t('class.anyTheme')}</td>
                <td className="py-2">
                  <span className="flex justify-end gap-1.5">
                    <button type="button" aria-pressed={a.starred} onClick={async () => { await data.saveAssignment({ ...a, starred: !a.starred }); reload(); }} aria-label={t('class.focus', { name: name(a.setId) })} data-tip={t('class.focus', { name: name(a.setId) })}
                      className={`w-9 h-9 rounded-full border-std border-border flex items-center justify-center active:scale-95 ${a.starred ? 'bg-accent' : 'bg-surface'}`}><Star weight={a.starred ? 'fill' : 'bold'} size={17} /></button>
                    <button type="button" onClick={async () => { await data.deleteAssignment(a.id); reload(); }} aria-label={t('class.unassign', { name: name(a.setId) })} data-tip={t('class.unassign', { name: name(a.setId) })}
                      className="w-9 h-9 rounded-full border-std border-border bg-surface flex items-center justify-center active:scale-95"><Trash weight="bold" size={17} /></button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="text-xs font-semibold text-muted">{t('class.focusNote')}</p>
    </Panel>
  );
}

// A new assignment on its own page (teacher, 2026-11-20): who and when on
// the left, the themes beside them, the set picker below; Assign returns to
// the class's Assigned sets.
export function AssignPage() {
  const { id: classroomId = '' } = useParams();
  const navigate = useNavigate();
  const { value: classes = [] } = useAsync(() => data.listClassrooms());
  const classroom = classes.find((c) => c.id === classroomId);
  const { value: students = [] } = useAsync(() => data.listStudents(classroomId), [classroomId]);
  const { value: assignments = [] } = useAsync(() => data.listAssignments(classroomId), [classroomId]);
  useCrumbLabel(classroom?.name);
  const tier = useTier();
  const limit = TIERS[tier].assignedSetsPerStudent;
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const [setId, setSetId] = useState<string[]>([]);
  const [who, setWho] = useState<'class' | 'some'>('class');
  const [chosen, setChosen] = useState<string[]>([]);
  const [startsOn, setStartsOn] = useState('');
  const [endsOn, setEndsOn] = useState('');
  const [themeIds, setThemeIds] = useState<string[]>([]);
  const name = (sid: string) => sets.find((s) => s.id === sid)?.name ?? t('sets.untitled');
  const countFor = (studentId?: string) => assignments.filter((a) => !a.studentId || !studentId || a.studentId === studentId).length;
  const targets = who === 'class' ? [undefined] : chosen;
  const full = who === 'class' ? Math.max(countFor(), ...students.map((s) => countFor(s.id))) >= limit : chosen.some((sid) => countFor(sid) >= limit);
  const back = `/teacher/classes/${classroomId}?tab=sets`;

  async function assign() {
    for (const studentId of targets) {
      await data.saveAssignment({ id: newId('asg'), classroomId, setId: setId[0], studentId, starred: false, startsOn: startsOn || undefined, endsOn: endsOn || undefined, themeIds: themeIds.length ? themeIds : undefined });
    }
    navigate(back);
  }
  if (!classroom) return null;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-24">
      <TeacherNav />
      <PageHeader title={t('class.newAssignment')} subtitle={classroom.name}
        actions={<div className="flex flex-wrap gap-2">
          <Link to={back} className={buttonClasses('secondary')}>{t('class.cancel')}</Link>
          <Button variant="primary" disabled={setId.length === 0 || targets.length === 0 || full} onClick={() => assign()}><Plus weight="bold" size={18} />{t('class.assign')}</Button>
        </div>} />
      <div className="grid gap-4">
        <Panel className="grid gap-4 !p-4">
          <p className="font-bold" aria-live="polite">{setId.length ? t('class.picked', { name: name(setId[0]) }) : t('class.pickBelow')}</p>
          {full && Number.isFinite(limit) && <div className="flex flex-wrap items-center gap-2"><p className="font-bold">{t('class.setLimit', { limit })}</p><UpgradeButton className="min-h-10 px-3 text-sm" /></div>}
          <div className="grid lg:grid-cols-[auto_1fr] gap-x-8 gap-y-4 items-start">
            <div className="grid gap-3">
              <ChoiceRow label={t('class.who')} value={who} onChange={setWho} options={[{ value: 'class', label: t('class.wholeClass') }, { value: 'some', label: t('class.someStudents') }]} />
              <div className="flex flex-wrap gap-3">
                <label className="grid gap-1 font-bold">{t('class.starts')}<input type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} className="min-h-11 px-2 rounded-input border-std border-border" /></label>
                <label className="grid gap-1 font-bold">{t('class.ends')}<input type="date" value={endsOn} onChange={(e) => setEndsOn(e.target.value)} className="min-h-11 px-2 rounded-input border-std border-border" /></label>
              </div>
            </div>
            <ThemeChoices value={themeIds} onChange={setThemeIds} />
          </div>
          {who === 'some' && (
            <div className="flex flex-wrap gap-2">
              {students.map((s) => (
                <button key={s.id} type="button" role="checkbox" aria-checked={chosen.includes(s.id)} onClick={() => setChosen(chosen.includes(s.id) ? chosen.filter((x) => x !== s.id) : [...chosen, s.id])}
                  className={`min-h-11 px-4 rounded-pill border-std font-bold ${chosen.includes(s.id) ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}>{s.name}</button>
              ))}
            </div>
          )}
        </Panel>
        <Panel className="!p-4">
          <SetPicker sets={sets} value={setId} onChange={setSetId} />
        </Panel>
      </div>
    </main>
  );
}

// Up to 10 themes students choose from when they play the set (teacher,
// 2026-10-25). Favorites from the Themes page come first. Leave it empty and
// students see every theme as usual.
const MAX_THEME_CHOICES = 10;
function ThemeChoices({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const tier = useTier();
  const { themes: made } = useMadeThemes();
  const { favorites } = useFavoriteThemes();
  const options = GAMES.flatMap((g) => themesFor(g.id, made).slice(1).map((th) => ({ th, game: g.name })))
    .filter(({ th }) => th.source !== 'library' || TIERS[tier].themesPlayable)
    .sort((a, b) => Number(favorites.includes(b.th.id)) - Number(favorites.includes(a.th.id)));
  return (
    <fieldset className="grid gap-2">
      <legend className="font-bold">{t('class.themes')}</legend>
      <p className="text-sm font-semibold text-muted">{t('class.themesHint', { max: MAX_THEME_CHOICES })}</p>
      {options.length === 0 ? (
        <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold">{t('class.themesNone')}</p>{!TIERS[tier].themesPlayable && <UpgradeButton className="min-h-10 px-3 text-sm" />}</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map(({ th, game }) => {
            const on = value.includes(th.id);
            return (
              <button key={th.id} type="button" role="checkbox" aria-checked={on} disabled={!on && value.length >= MAX_THEME_CHOICES}
                onClick={() => onChange(on ? value.filter((x) => x !== th.id) : [...value, th.id])}
                className={`min-h-11 pl-1.5 pr-3 rounded-pill border-std font-bold text-sm inline-flex items-center gap-2 disabled:opacity-40 ${on ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}>
                <span className="w-7 h-7 rounded-full border-std border-border" style={{ background: th.colors.background }} aria-hidden="true" />
                {favorites.includes(th.id) && <Heart weight="fill" size={14} color="#d6336c" aria-label={t('class.favorite')} />}
                {th.name}<span className="font-semibold text-muted">· {game}</span>
              </button>
            );
          })}
        </div>
      )}
      {value.length > 0 && <p className="text-sm font-bold" aria-live="polite">{t('class.themesPicked', { count: value.length, max: MAX_THEME_CHOICES })}</p>}
    </fieldset>
  );
}

// The class's students in a row of name chips under the class name; each one
// opens that student's page (teacher, 2026-11-16). The current one is lit.
export function StudentStrip({ classId, students, current, look }: { classId: string; students: Student[]; current?: string; look?: GameTheme }) {
  if (!students.length) return null;
  return (
    <nav aria-label={t('cv.allStudents')} className="flex flex-wrap gap-2 mb-5">
      {[...students].sort((a, b) => a.name.localeCompare(b.name)).map((s) => (
        <Link key={s.id} to={`/teacher/classes/${classId}/students/${s.id}`} aria-current={s.id === current ? 'page' : undefined} aria-label={t('cv.openStudent', { name: s.name })}
          className={`inline-flex items-center gap-1.5 min-h-10 pl-1 pr-3 rounded-pill border-std font-bold text-sm no-underline text-text hover-pop ${s.id === current ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}>
          <Avatar avatar={avatarOf(s)} theme={look} size={30} />{s.name}
        </Link>
      ))}
    </nav>
  );
}

// The class view of the progress report, the same one that prints.
function ClassReport({ classId, className, students }: { classId: string; className: string; students: Student[] }) {
  const { value: log = [] } = useAsync(() => data.listQuestionLog({ classroomId: classId }), [classId]);
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const names = {
    student: (sid?: string) => students.find((s) => s.id === sid)?.name ?? t('reports.noStudent'),
    set: (x?: string) => sets.find((s) => s.id === x)?.name ?? t('reports.noSet'),
    game: (g: string) => ALL_GAMES.find((x) => x.id === g)?.name ?? g,
  };
  return (
    <div className="grid gap-3">
      <div className="flex justify-end"><Link to={`/teacher/reports/print?class=${classId}`} className={buttonClasses('primary', 'hover-pop')}><Printer weight="bold" size={18} />{t('rp.print')}</Link></div>
      <div className="report-desk"><ReportDoc log={log} students={students} names={names} className={className} /></div>
    </div>
  );
}
