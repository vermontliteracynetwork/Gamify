import { makeGameCode } from '../data/gameCodes';
import { useCrumbLabel } from '../ui/Breadcrumbs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { DiceFive, Eye, EyeSlash, GearSix, Heart, Lightbulb, Minus, PencilSimple, Plus, Printer, Star, Trash, TrendDown, TrendUp, UploadSimple, UsersThree } from '@phosphor-icons/react';
import { TIERS } from '../config';
import { data, newId } from '../data';
import { useAsync, useMySets, useTier } from '../data/hooks';
import { LIBRARY } from '../data/library';
import { ALL_MODES, type PlayMode, type QuestionLogEntry, type QuestionSet, type SetAssignment, type Student } from '../data/types';
import { ModeBadge, SHOWN_MODES } from '../games/ModeBadge';
import SetPicker from '../games/SetPicker';
import { t } from '../i18n';
import PinGate from '../settings/PinGate';
import { DEFAULT_SETTINGS } from '../settings/settings';
import { avatarOf, isUploadedAvatar, newPicturePassword, newPin, PICTURES, PIN_RULE } from '../student/pictures';
import Avatar from '../student/Avatar';
import { imageFileToDataUrl } from '../ui/imageFile';
import { useFavoriteThemes, useMadeThemes } from '../theme/made';
import { themesFor } from '../theme/library';
import { GAMES } from '../games/registry';
import { ChoiceRow, Slider, Toggle } from '../ui/fields';
import { Button, buttonClasses, fieldClasses, IconButton, PageHeader, Panel, Tabs } from '../ui/kit';
import TeacherNav from '../ui/TeacherNav';
import { readOnlyIds } from '../data/downgrade';
import Title from '../ui/Title';
import { LimitNote, UpgradeButton } from '../billing/Upgrade';
import SharedDialog from '../ui/Dialog';
import ReportDoc, { supportsText, trend } from './reportDoc';
import { Chip, FirstTryBar, firstTry, fmtDay, lastDay, PortalCard, skillsOf, SOFT } from './portalParts';
import type { GameTheme } from '../theme/types';

type Tab = 'students' | 'groups' | 'report' | 'sets' | 'modes';
const TABS: Tab[] = ['students', 'groups', 'report', 'sets', 'modes'];

// One classroom, in the approved teacher portal look (/brand?tab=teacher,
// view 3b, 2026-11-25): the roster as a scannable table (picture, hidden
// PIN, supports as chips, last played, right on first try, trend), small
// groups beside it, then the report, assigned sets and ways to play.
// Avatar + PIN sign-in and per-student accommodations sit behind the teacher
// PIN. On Free there are no classes (teacher, 2026-10-26): this page is the
// teacher's one student list, "My students".
export default function ClassPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => (TABS as string[]).includes(params.get('tab') ?? '') ? params.get('tab') as Tab : 'students');
  const [preset, setPreset] = useState<string[]>([]);
  const { value: classes = [], reload: reloadClass } = useAsync(() => data.listClassrooms());
  const [designCode, setDesignCode] = useState('');
  const { value: students = [], reload: reloadStudents } = useAsync(() => data.listStudents(id), [id]);
  const { value: assignments = [], reload: reloadAssignments } = useAsync(() => data.listAssignments(id), [id]);
  const { value: log = [] } = useAsync(() => data.listQuestionLog({ classroomId: id }), [id]);
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const classroom = classes.find((c) => c.id === id);
  const tier = useTier();
  // Downgrade rules: classes past the plan limit stay, read-only.
  const frozen = readOnlyIds(classes, TIERS[tier].classrooms).has(id);
  const free = !TIERS[tier].hasClasses;
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    // Students added before PIN sign-in get a PIN now.
    const missing = students.filter((s) => !s.pin);
    if (!missing.length) return;
    const taken = students.map((s) => s.pin ?? '');
    void Promise.all(missing.map((s) => { const pin = newPin(taken); taken.push(pin); return data.saveStudent({ ...s, pin }); })).then(reloadStudents);
  }, [students]); // eslint-disable-line react-hooks/exhaustive-deps
  useCrumbLabel(classroom?.name);
  const look: GameTheme | undefined = undefined; // sign-in picture designs removed (owner, 2026-11-25)
  if (!classroom) return null;
  const assignTo = (ids: string[]) => { setPreset(ids); setTab('sets'); };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24">
      <TeacherNav />
      {/* No class join codes (teacher, 2026-10-31): students get in with a game code or link. */}
      <PageHeader title={free ? t('roster.title') : classroom.name} subtitle={t('class.counts', { students: students.length, sets: assignments.length })}
        actions={<>
          <Link to={`/teacher/reports/print?class=${id}`} className={buttonClasses('secondary')}><Printer weight="bold" size={18} />{t('classes.progress')}</Link>
          <Link to="/teacher/activity" className={buttonClasses('main')}><Plus weight="bold" size={18} />{t('teacherNav.create')}</Link>
        </>} />
      <Tabs label={t('class.tabs')} value={tab} onChange={(v) => { setTab(v); if (v !== 'sets') setPreset([]); }} options={[
        { id: 'students', label: t('class.tab.students') }, { id: 'groups', label: t('class.tab.groups') }, { id: 'report', label: t('class.tab.report') }, { id: 'sets', label: t('class.tab.sets') }, { id: 'modes', label: t('class.tab.modes') },
      ]} />
      {frozen && <LimitNote className="mb-4">{t('class.frozen')}</LimitNote>}
      <fieldset disabled={frozen} className="contents">
      {tab === 'students' && <StudentsTab classroomId={id} students={students} reload={reloadStudents} log={log}
        groups={<GroupsSide students={students} log={log} sets={sets} look={look} reload={reloadStudents} onNew={() => setTab('groups')} onAssign={assignTo} />} />}
      {tab === 'groups' && <GroupsTab students={students} log={log} sets={sets} look={look} reload={reloadStudents} onAssign={assignTo} />}
      {tab === 'report' && <ClassReport classId={id} className={classroom.name} students={students} />}
      {tab === 'sets' && <SetsTab key={preset.join()} classroomId={id} students={students} assignments={assignments} reload={reloadAssignments} preset={preset} />}
      {tab === 'modes' && (
        <Panel className="grid gap-3">
          <p className="font-bold">{t('class.modesNote')}</p>
          {/* No Versus category (teacher, 2026-11-23): Solo also switches the games played against the computer. */}
          {SHOWN_MODES.map((m) => {
            const on = (classroom.allowedModes ?? ALL_MODES).includes(m);
            return (
              <div key={m} className="flex flex-wrap items-center gap-3">
                <ModeBadge mode={m} withHint />
                <div className="ml-auto min-w-40">
                  <Toggle label={on ? t('class.modeOn') : t('class.modeOff')} value={on} onChange={async (v) => {
                    const cur = classroom.allowedModes ?? ALL_MODES;
                    const ms: PlayMode[] = m === 'solo' ? ['solo', 'versus'] : [m];
                    await data.saveClassroom({ ...classroom, allowedModes: v ? ALL_MODES.filter((x) => ms.includes(x) || cur.includes(x)) : cur.filter((x) => !ms.includes(x)) });
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
                <Button variant="main" onClick={async () => setDesignCode((await makeGameCode('design', '', 'design')).code)}>{t('class.designCode')}</Button>
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

// The supports a student has, one chip each ("3 tries", "Listen").
export function supportChips(s: Student): string[] {
  return supportsText(s).split('; ').filter(Boolean);
}

function TrendMark({ entries }: { entries: QuestionLogEntry[] }) {
  const tr = trend(entries);
  const label = t(`rp.trend.${tr}`);
  if (tr === 'up') return <TrendUp weight="bold" size={18} color="var(--color-success-ink)" role="img" aria-label={label} />;
  if (tr === 'down') return <TrendDown weight="bold" size={18} color="var(--color-error)" role="img" aria-label={label} />;
  if (tr === 'steady') return <Minus weight="bold" size={18} className="text-muted" role="img" aria-label={label} />;
  return <span role="img" aria-label={label} className="font-bold text-muted">-</span>;
}

function StudentsTab({ classroomId, students, reload, log, groups }: { classroomId: string; students: Student[]; reload: () => void; signInThemeId?: string; log: QuestionLogEntry[]; groups: React.ReactNode }) {
  const look: GameTheme | undefined = undefined;
  const tier = useTier();
  const limit = TIERS[tier].studentsPerClassroom;
  const [names, setNames] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [asking, setAsking] = useState<Student | null>(null);
  const [picking, setPicking] = useState<Student | null>(null);
  // PINs stay hidden until the teacher asks (portal 3b): the page may be on the projector.
  const [showPins, setShowPins] = useState(false);
  const addRef = useRef<HTMLTextAreaElement>(null);
  const toAdd = names.split('\n').map((n) => n.trim()).filter(Boolean);
  const room = Number.isFinite(limit) ? limit - students.length : Infinity;
  const sorted = [...students].sort((a, b) => a.name.localeCompare(b.name));

  async function add() {
    const taken = students.map((s) => s.picturePassword);
    const pins = students.map((s) => s.pin ?? '');
    // Each new student gets the built-in picture used least so far.
    const uses = new Map(PICTURES.map((p) => [p.id, students.filter((s) => avatarOf(s) === p.id).length]));
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
  function openSettings(s: Student) { if (unlocked) setEditing(s); else setAsking(s); }

  return (
    <div className="grid gap-4 mb-4">
      <div className="grid gap-4 items-start min-[1340px]:grid-cols-[minmax(0,1fr)_20rem]">
        <PortalCard labelledBy="roster-title" title={t('class.studentCount', { count: students.length })} tip={t('class.rosterTip')}
          right={<>
            {students.length > 0 && <Button size="sm" aria-pressed={showPins} onClick={() => setShowPins(!showPins)}>{showPins ? <EyeSlash weight="bold" size={16} /> : <Eye weight="bold" size={16} />}{showPins ? t('class.hidePins') : t('class.showPins')}</Button>}
            <Button size="sm" onClick={() => { addRef.current?.focus(); addRef.current?.scrollIntoView({ block: 'center' }); }}><Plus weight="bold" size={16} />{t('class.addStudentsShort')}</Button>
          </>}>
          {students.length === 0 ? <p className="font-bold">{t('class.noStudents')}</p> : (
            <div className="overflow-x-auto -mx-1 px-1">
              <table className="w-full text-sm border-collapse">
                <caption className="sr-only">{t('class.rosterCaption')}</caption>
                <thead>
                  <tr className="text-left text-[0.8125rem] text-muted">
                    <th scope="col" className="font-bold pb-1.5 pr-2">{t('rp.student')}</th>
                    <th scope="col" className="font-bold pb-1.5 pr-2">{t('class.pinCol')}</th>
                    <th scope="col" className="font-bold pb-1.5 pr-2">{t('reports.supports')}</th>
                    <th scope="col" className="font-bold pb-1.5 pr-2 hidden md:table-cell">{t('rp.last')}</th>
                    <th scope="col" className="font-bold pb-1.5 pr-2">{t('rp.firstTry')}</th>
                    <th scope="col" className="font-bold pb-1.5 pr-2 hidden sm:table-cell">{t('rp.trend')}</th>
                    <th scope="col" className="pb-1.5"><span className="sr-only">{t('class.actions')}</span></th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((s) => {
                    const mine = log.filter((e) => e.studentId === s.id);
                    const ft = firstTry(mine);
                    const chips = supportChips(s);
                    return (
                      <tr key={s.id} className="border-t border-border-soft">
                        <th scope="row" className="py-1.5 pr-2 text-left font-bold">
                          <span className="inline-flex items-center gap-2.5 min-w-0">
                            <button type="button" onClick={() => setPicking(s)} aria-label={t('class.avatarFor', { name: s.name })} className="rounded-full active:scale-95 shrink-0"><Avatar avatar={avatarOf(s)} theme={look} size={36} /></button>
                            <Link to={`/teacher/classes/${classroomId}/students/${s.id}`} className="text-text underline-offset-2 hover:underline break-words">{s.name}</Link>
                          </span>
                        </th>
                        <td className="pr-2 font-bold tabular-nums tracking-widest text-muted whitespace-nowrap">
                          {showPins ? <><span className="sr-only">{t('class.pinIs', { pin: '' })}</span>{s.pin}</> : <span role="img" aria-label={t('class.pinHidden')}>••••</span>}
                        </td>
                        <td className="pr-2 py-1"><span className="flex flex-wrap gap-1">{chips.map((c) => <Chip key={c} bg="var(--blue-crystal)">{c}</Chip>)}</span></td>
                        <td className="pr-2 font-semibold whitespace-nowrap hidden md:table-cell">{fmtDay(lastDay(mine)) || <span className="text-muted">{t('class.notYet')}</span>}</td>
                        <td className="pr-2">{ft.answered ? <FirstTryBar pct={ft.pct} label={t('classes.firstTryIs', { pct: ft.pct })} /> : <span className="text-muted font-semibold">-</span>}</td>
                        <td className="pr-2 hidden sm:table-cell"><TrendMark entries={mine} /></td>
                        <td className="py-1">
                          <span className="flex items-center justify-end gap-1">
                            <Link to={`/teacher/classes/${classroomId}/students/${s.id}`} aria-label={t('cv.openStudent', { name: s.name })} className="font-bold text-sm text-[var(--grape-deep)] px-1.5 min-h-9 inline-flex items-center hover:underline">{t('class.open')}</Link>
                            <IconButton label={t('class.supportsFor', { name: s.name })} onClick={() => openSettings(s)} className="!w-9 !h-9"><GearSix weight="bold" size={18} /></IconButton>
                            <IconButton label={t('class.remove', { name: s.name })} onClick={async () => { await data.deleteStudent(s.id); reload(); }} className="!w-9 !h-9 bg-surface"><Trash weight="bold" size={18} /></IconButton>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {students.length > 0 && <p className="mt-2 text-[0.8125rem] font-bold text-muted">{t('class.sortedByName')}</p>}
        </PortalCard>
        {groups}
      </div>
      <Panel className="grid gap-2">
        <label htmlFor="student-names" className="font-bold">{t('class.addStudents')}</label>
        <textarea ref={addRef} id="student-names" value={names} onChange={(e) => setNames(e.target.value)} rows={3} placeholder={t('class.namesPlaceholder')}
          className="px-3 py-2 rounded-input border-std border-border font-bold" />
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="main" disabled={toAdd.length === 0 || room <= 0} onClick={() => void add()}><Plus weight="bold" size={18} />{t('class.add', { count: Math.min(toAdd.length, room) })}</Button>
          <p className="font-bold text-sm">{Number.isFinite(limit) ? t('class.studentLimit', { count: students.length, limit }) : t('class.studentCount', { count: students.length })}</p>
        </div>
        {toAdd.length > room && <div className="flex flex-wrap items-center gap-2"><p className="font-bold text-sm">{t('class.overLimit', { limit })}</p><UpgradeButton className="min-h-10 px-3 text-sm" /></div>}
      </Panel>
      {asking && (
        <Dialog title={t('class.supportsFor', { name: asking.name })} onClose={() => setAsking(null)}>
          <PinGate onUnlock={() => { setUnlocked(true); setEditing(asking); setAsking(null); }} />
        </Dialog>
      )}
      {editing && <SupportsDialog student={editing} onClose={() => { setEditing(null); reload(); }} />}
      {picking && <AvatarDialog student={picking} others={students.filter((x) => x.id !== picking.id)} look={look} onClose={() => { setPicking(null); reload(); }} />}
    </div>
  );
}

// ---------- small groups (portal 3b, 2026-11-25) ----------
// A group is a name the teacher gives a few students (Student.groups).
// Students never see group names. "Assign a set" opens Assigned sets with the
// group's students picked.

interface Group { name: string; members: Student[] }
function groupsOf(students: Student[]): Group[] {
  const by = new Map<string, Student[]>();
  for (const s of students) for (const g of s.groups ?? []) by.set(g, [...(by.get(g) ?? []), s]);
  return [...by].map(([name, members]) => ({ name, members: members.sort((a, b) => a.name.localeCompare(b.name)) })).sort((a, b) => a.name.localeCompare(b.name));
}
async function saveGroup(students: Student[], name: string, memberIds: string[], oldName?: string) {
  await Promise.all(students.map((s) => {
    const had = s.groups ?? [];
    const rest = had.filter((g) => g !== name && g !== oldName);
    const next = memberIds.includes(s.id) && name ? [...rest, name] : rest;
    if (next.length === had.length && next.every((g) => had.includes(g))) return undefined;
    return data.saveStudent({ ...s, groups: next.length ? next : undefined });
  }));
}

// A group to suggest from the reports: a Common Core standard where two or
// more students who are not yet grouped for it are under 50% on first try.
function useSuggestion(students: Student[], log: QuestionLogEntry[], sets: QuestionSet[]) {
  return useMemo(() => {
    const low = new Map<string, Student[]>();
    for (const s of students) {
      for (const sk of skillsOf(log.filter((e) => e.studentId === s.id), sets)) if (sk.band === 'notYet') low.set(sk.standard, [...(low.get(sk.standard) ?? []), s]);
    }
    const [standard, who] = [...low].filter(([, w]) => w.length >= 2).sort((a, b) => b[1].length - a[1].length)[0] ?? [];
    if (!standard || !who) return undefined;
    const name = t('groups.practiceName', { standard });
    if (groupsOf(students).some((g) => g.name === name)) return undefined;
    return { standard, who, name };
  }, [students, log, sets]);
}

function Suggestion({ students, log, sets, reload }: { students: Student[]; log: QuestionLogEntry[]; sets: QuestionSet[]; reload: () => void }) {
  const sug = useSuggestion(students, log, sets);
  const [hidden, setHidden] = useState('');
  if (!sug || hidden === sug.name) return null;
  const list = sug.who.map((s) => s.name);
  const names = list.length > 1 ? `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}` : list[0];
  return (
    <div className="rounded-[1.125rem] p-4 grid gap-2 border-[2.5px] border-dashed border-muted bg-surface/50">
      <b className="text-[0.9375rem] flex items-center gap-2"><Lightbulb weight="bold" size={18} aria-hidden="true" />{t('groups.suggested')}</b>
      <span className="text-sm font-semibold leading-snug">{t('groups.suggestLine', { names, standard: sug.standard })}</span>
      <span className="flex flex-wrap gap-2">
        <Button size="sm" variant="main" onClick={async () => { await saveGroup(students, sug.name, sug.who.map((s) => s.id)); reload(); }}><UsersThree weight="bold" size={16} />{t('groups.make')}</Button>
        <Button size="sm" onClick={() => setHidden(sug.name)}>{t('groups.notNow')}</Button>
      </span>
    </div>
  );
}

function GroupCard({ g, i, look, onAssign, extra }: { g: Group; i: number; look?: GameTheme; onAssign: (ids: string[]) => void; extra?: React.ReactNode }) {
  return (
    <li className="rounded-input p-3 grid gap-2" style={{ background: [SOFT[2], SOFT[1], SOFT[4], SOFT[3], SOFT[5]][i % 5] }}>
      <div className="flex flex-wrap items-center gap-2"><b className="text-[0.9375rem] break-words min-w-0">{g.name}</b><span className="ml-auto text-[0.8125rem] font-bold">{t('groups.count', { count: g.members.length })}</span></div>
      <ul aria-label={t('groups.membersOf', { name: g.name })} className="list-none m-0 p-0 flex flex-wrap gap-1">
        {g.members.map((s) => <li key={s.id} data-tip={s.name} aria-label={s.name} className="rounded-full"><Avatar avatar={avatarOf(s)} theme={look} size={30} /></li>)}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => onAssign(g.members.map((s) => s.id))}>{t('groups.assign')}</Button>
        {extra}
      </div>
    </li>
  );
}

// Beside the roster: the suggestion and the class's groups.
function GroupsSide({ students, log, sets, look, reload, onNew, onAssign }: { students: Student[]; log: QuestionLogEntry[]; sets: QuestionSet[]; look?: GameTheme; reload: () => void; onNew: () => void; onAssign: (ids: string[]) => void }) {
  if (!students.length) return null;
  const groups = groupsOf(students);
  return (
    <div className="grid gap-3 content-start min-w-0">
      <Suggestion students={students} log={log} sets={sets} reload={reload} />
      <PortalCard labelledBy="groups-side" title={t('class.tab.groups')} tip={t('groups.tip')} right={<Button size="sm" onClick={onNew}><Plus weight="bold" size={16} />{t('groups.new')}</Button>}>
        {groups.length === 0 ? <p className="text-sm font-semibold text-muted">{t('groups.none')}</p> : (
          <ul className="list-none m-0 p-0 grid gap-2 sm:grid-cols-2 min-[1340px]:grid-cols-1">{groups.map((g, i) => <GroupCard key={g.name} g={g} i={i} look={look} onAssign={onAssign} />)}</ul>
        )}
      </PortalCard>
    </div>
  );
}

// The Groups tab: make, change and remove groups.
function GroupsTab({ students, log, sets, look, reload, onAssign }: { students: Student[]; log: QuestionLogEntry[]; sets: QuestionSet[]; look?: GameTheme; reload: () => void; onAssign: (ids: string[]) => void }) {
  const groups = groupsOf(students);
  const [name, setName] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [editing, setEditing] = useState<string | undefined>();
  const taken = groups.some((g) => g.name === name.trim() && g.name !== editing);
  const sorted = [...students].sort((a, b) => a.name.localeCompare(b.name));
  async function save() {
    await saveGroup(students, name.trim(), picked, editing);
    setName(''); setPicked([]); setEditing(undefined);
    reload();
  }
  if (!students.length) return <Panel><p className="font-bold">{t('class.noStudents')}</p></Panel>;
  return (
    <div className="grid gap-4 items-start lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <PortalCard labelledBy="group-make" title={editing ? t('groups.editTitle', { name: editing }) : t('groups.new')} tip={t('groups.tip')}>
        <div className="grid gap-3">
          <label className="grid gap-1 font-bold">{t('groups.name')}
            <input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder={t('groups.namePlaceholder')} className={fieldClasses()} />
          </label>
          {taken && <p className="text-sm font-bold text-error" role="alert">{t('groups.taken')}</p>}
          <fieldset className="grid gap-2">
            <legend className="font-bold mb-1">{t('groups.who')}</legend>
            <div className="flex flex-wrap gap-2">
              {sorted.map((s) => {
                const on = picked.includes(s.id);
                return (
                  <button key={s.id} type="button" role="checkbox" aria-checked={on} onClick={() => setPicked(on ? picked.filter((x) => x !== s.id) : [...picked, s.id])}
                    className={`min-h-11 pl-1 pr-3 rounded-pill border-std font-bold text-sm inline-flex items-center gap-1.5 ${on ? 'bg-butter border-border' : 'bg-surface border-border-soft'}`}>
                    <Avatar avatar={avatarOf(s)} theme={look} size={30} />{s.name}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className="flex flex-wrap gap-2">
            <Button variant="main" disabled={!name.trim() || !picked.length || taken} onClick={() => void save()}><UsersThree weight="bold" size={18} />{editing ? t('groups.saveChanges') : t('groups.save')}</Button>
            {editing && <Button onClick={() => { setEditing(undefined); setName(''); setPicked([]); }}>{t('classes.cancel')}</Button>}
          </div>
        </div>
      </PortalCard>
      <div className="grid gap-3 content-start min-w-0">
        <Suggestion students={students} log={log} sets={sets} reload={reload} />
        <PortalCard labelledBy="group-list" title={t('groups.yours')}>
          {groups.length === 0 ? <p className="text-sm font-semibold text-muted">{t('groups.none')}</p> : (
            <ul className="list-none m-0 p-0 grid gap-2">
              {groups.map((g, i) => (
                <GroupCard key={g.name} g={g} i={i} look={look} onAssign={onAssign} extra={<>
                  <Button size="sm" onClick={() => { setEditing(g.name); setName(g.name); setPicked(g.members.map((s) => s.id)); }}><PencilSimple weight="bold" size={16} />{t('groups.edit')}</Button>
                  <IconButton label={t('groups.remove', { name: g.name })} onClick={async () => { await saveGroup(students, '', [], g.name); reload(); }} className="!w-9 !h-9 bg-surface"><Trash weight="bold" size={18} /></IconButton>
                </>} />
              ))}
            </ul>
          )}
        </PortalCard>
      </div>
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
        {PICTURES.map((p) => (
          <button key={p.id} type="button" role="radio" aria-checked={avatar === p.id} aria-label={p.id} onClick={() => setAvatar(p.id)}
            className={`rounded-full p-1 ${avatar === p.id ? 'bg-butter ring-[3px] ring-border' : ''}`}><Avatar avatar={p.id} theme={look} size={52} /></button>
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
      <Button variant="main" onClick={() => void save()}>{t('class.avatarSave')}</Button>
    </Dialog>
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
        {SHOWN_MODES.map((m) => (
          <button key={m} type="button" role="checkbox" aria-checked={modes.includes(m)} onClick={() => { const ms: PlayMode[] = m === 'solo' ? ['solo', 'versus'] : [m]; setModes(modes.includes(m) ? modes.filter((x) => !ms.includes(x)) : [...new Set([...modes, ...ms])]); }}
            className={`rounded-pill ${modes.includes(m) ? '' : 'opacity-40'}`}><ModeBadge mode={m} /></button>
        ))}
      </div>
      <Button variant="main" onClick={() => void save()}>{t('class.saveSupports')}</Button>
    </Dialog>
  );
}

function SetsTab({ classroomId, students, assignments, reload, preset = [] }: { classroomId: string; students: Student[]; assignments: SetAssignment[]; reload: () => void; preset?: string[] }) {
  const tier = useTier();
  const limit = TIERS[tier].assignedSetsPerStudent;
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const [setId, setSetId] = useState<string[]>([]);
  const [who, setWho] = useState<'class' | 'some'>(preset.length ? 'some' : 'class');
  const [chosen, setChosen] = useState<string[]>(preset);
  const [startsOn, setStartsOn] = useState('');
  const [endsOn, setEndsOn] = useState('');
  const [themeIds, setThemeIds] = useState<string[]>([]);
  const name = (sid: string) => sets.find((s) => s.id === sid)?.name ?? t('sets.untitled');
  const countFor = (studentId?: string) => assignments.filter((a) => !a.studentId || !studentId || a.studentId === studentId).length;
  const targets = who === 'class' ? [undefined] : chosen;
  const full = who === 'class' ? Math.max(countFor(), ...students.map((s) => countFor(s.id))) >= limit : chosen.some((sid) => countFor(sid) >= limit);

  async function assign() {
    for (const studentId of targets) {
      await data.saveAssignment({ id: newId('asg'), classroomId, setId: setId[0], studentId, starred: false, startsOn: startsOn || undefined, endsOn: endsOn || undefined, themeIds: themeIds.length ? themeIds : undefined });
    }
    setSetId([]); setChosen([]); setThemeIds([]);
    reload();
  }

  return (
    <div className="grid gap-4">
      <Panel className="grid gap-2">
        <h2 className="font-display text-2xl font-bold"><Title text={t('class.assigned')} /></h2>
        {assignments.length === 0 && <p className="font-bold">{t('class.noAssigned')}</p>}
        {assignments.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center gap-2 rounded-input border-std border-border-soft p-2">
            <span className="font-bold flex-1 min-w-40">{name(a.setId)}</span>
            <span className="text-sm font-bold text-muted">{a.studentId ? students.find((s) => s.id === a.studentId)?.name : t('class.wholeClass')}{a.startsOn || a.endsOn ? ` · ${a.startsOn ?? ''} to ${a.endsOn ?? ''}` : ''}{a.themeIds?.length ? ` · ${t('class.themeCount', { count: a.themeIds.length })}` : ''}</span>
            <button type="button" aria-pressed={a.starred} onClick={async () => { await data.saveAssignment({ ...a, starred: !a.starred }); reload(); }} aria-label={t('class.focus', { name: name(a.setId) })}
              className={`w-11 h-11 rounded-full border-std border-border flex items-center justify-center ${a.starred ? 'bg-butter' : 'bg-surface'}`}><Star weight={a.starred ? 'fill' : 'bold'} size={20} /></button>
            <button type="button" onClick={async () => { await data.deleteAssignment(a.id); reload(); }} aria-label={t('class.unassign', { name: name(a.setId) })}
              className="w-11 h-11 rounded-full border-std border-border bg-surface flex items-center justify-center"><Trash weight="bold" size={20} /></button>
          </div>
        ))}
        <p className="text-sm font-bold text-muted">{t('class.focusNote')}</p>
      </Panel>
      {/* Everything to choose and save sits at the top, by the title; the
          sets come below in pages (teacher, 2026-10-31). */}
      <Panel className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold"><Title text={t('class.assignNew')} /></h2>
          <Button variant="main" disabled={setId.length === 0 || targets.length === 0 || full} onClick={() => void assign()}><Plus weight="bold" size={18} />{t('class.assign')}</Button>
        </div>
        <p className="font-bold -mt-2" aria-live="polite">{setId.length ? t('class.picked', { name: name(setId[0]) }) : t('class.pickBelow')}</p>
        {full && Number.isFinite(limit) && <div className="flex flex-wrap items-center gap-2"><p className="font-bold">{t('class.setLimit', { limit })}</p><UpgradeButton className="min-h-10 px-3 text-sm" /></div>}
        <div className="grid md:grid-cols-[auto_1fr] gap-x-8 gap-y-4 items-start">
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
                className={`min-h-11 px-4 rounded-pill border-std font-bold ${chosen.includes(s.id) ? 'bg-butter border-border' : 'bg-surface border-border-soft'}`}>{s.name}</button>
            ))}
          </div>
        )}
        <div className="border-t-[2px] border-border-soft pt-4">
          <SetPicker sets={sets} value={setId} onChange={setSetId} />
        </div>
      </Panel>
    </div>
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
                className={`min-h-11 pl-1.5 pr-3 rounded-pill border-std font-bold text-sm inline-flex items-center gap-2 disabled:opacity-40 ${on ? 'bg-butter border-border' : 'bg-surface border-border-soft'}`}>
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
          className={`inline-flex items-center gap-1.5 min-h-10 pl-1 pr-3 rounded-pill border-std font-bold text-sm no-underline text-text hover-pop ${s.id === current ? 'bg-butter border-border' : 'bg-surface border-border-soft'}`}>
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
    game: (g: string) => GAMES.find((x) => x.id === g)?.name ?? g,
  };
  return (
    <div className="grid gap-3">
      <Link to={`/teacher/reports/print?class=${classId}`} className={buttonClasses('main', 'justify-self-start')}><Printer weight="bold" size={18} />{t('rp.print')}</Link>
      <ReportDoc log={log} students={students} names={names} standardsOf={(x) => sets.find((s) => s.id === x)?.standards} className={className} />
    </div>
  );
}
