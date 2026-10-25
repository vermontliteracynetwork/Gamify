import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, DeviceTablet, GearSix, Heart, Plus, ProjectorScreen, Smiley, Star, Trash, X } from '@phosphor-icons/react';
import { TIERS } from '../config';
import { data, newId } from '../data';
import { useAsync, useMySets, useTier } from '../data/hooks';
import { LIBRARY } from '../data/library';
import { ALL_MODES, type Classroom, type PlayMode, type SetAssignment, type Student } from '../data/types';
import { ModeBadge } from '../games/ModeBadge';
import SetPicker from '../games/SetPicker';
import { t } from '../i18n';
import PinGate from '../settings/PinGate';
import { DEFAULT_SETTINGS } from '../settings/settings';
import { newPicturePassword } from '../student/pictures';
import PictureBadge from '../student/PictureBadge';
import { useFavoriteThemes, useMadeThemes } from '../theme/made';
import { themesFor } from '../theme/library';
import { GAMES } from '../games/registry';
import { ChoiceRow, Slider, Toggle } from '../ui/fields';
import { Button, buttonClasses, PageHeader, Panel, Tabs } from '../ui/kit';
import TeacherNav from '../ui/TeacherNav';
import { readOnlyIds } from '../data/downgrade';
import { newJoinCode } from '../auth/session';
import Title from '../ui/Title';
import { LimitNote, UpgradeButton } from '../billing/Upgrade';

type Tab = 'students' | 'sets' | 'modes';

// One classroom: the class list with picture sign-in and per-student
// accommodations (behind the teacher PIN), assigned sets, and which play
// modes students see.
export default function ClassPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('students');
  const { value: classes = [], reload: reloadClass } = useAsync(() => data.listClassrooms());
  const { value: students = [], reload: reloadStudents } = useAsync(() => data.listStudents(id), [id]);
  const { value: assignments = [], reload: reloadAssignments } = useAsync(() => data.listAssignments(id), [id]);
  const classroom = classes.find((c) => c.id === id);
  const tier = useTier();
  // Downgrade rules: classes past the plan limit stay, read-only.
  const frozen = readOnlyIds(classes, TIERS[tier].classrooms).has(id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    // Classes made before join codes existed get one now.
    if (classroom && !classroom.joinCode) void data.saveClassroom({ ...classroom, joinCode: newJoinCode(classes.map((c) => c.joinCode ?? '')) }).then(reloadClass);
  }, [classroom]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!classroom) return null;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-24">
      <TeacherNav />
      <Link to="/teacher/classes" className={buttonClasses('secondary', 'mb-4')}><ArrowLeft weight="bold" size={18} />{t('classes.all')}</Link>
      <PageHeader title={classroom.name} subtitle={`${t('class.counts', { students: students.length, sets: assignments.length })} · ${t('class.joinCode', { code: classroom.joinCode ?? '' })}`}
        actions={<>
          <Link to={`/teacher/classes/${classroom.id}/check-in`} className={buttonClasses('secondary')}><Smiley weight="bold" size={18} />{t('checkin.open')}</Link>
          <Link to={`/show/${classroom.joinCode ?? ''}`} className={buttonClasses('secondary')}><ProjectorScreen weight="bold" size={18} />{t('class.showCode')}</Link>
          <Link to={`/arcade/${classroom.id}`} className={buttonClasses('primary')}><DeviceTablet weight="bold" size={18} />{t('class.openSignIn')}</Link>
        </>} />
      <Tabs label={t('class.tabs')} value={tab} onChange={setTab} options={[
        { id: 'students', label: t('class.tab.students') }, { id: 'sets', label: t('class.tab.sets') }, { id: 'modes', label: t('class.tab.modes') },
      ]} />
      {frozen && <LimitNote className="mb-4">{t('class.frozen')}</LimitNote>}
      <fieldset disabled={frozen} className="contents">
      {tab === 'students' && <SignInLook classroom={classroom} onChange={reloadClass} />}
      {tab === 'students' && <StudentsTab classroomId={id} students={students} reload={reloadStudents} signInThemeId={classroom.signInThemeId} />}
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
          </div>
        </Panel>
      )}
      </fieldset>
      <div className="mt-8">
        {confirmDelete ? (
          <Panel className="grid gap-2">
            <p className="font-bold">{t('class.deleteConfirm', { name: classroom.name })}</p>
            <div className="flex gap-2">
              <Button variant="danger" onClick={async () => { await data.deleteClassroom(id); navigate('/teacher/classes'); }}><Trash weight="bold" size={18} />{t('class.deleteYes')}</Button>
              <Button onClick={() => setConfirmDelete(false)}>{t('class.keep')}</Button>
            </div>
          </Panel>
        ) : <Button variant="ghost" onClick={() => setConfirmDelete(true)}><Trash weight="bold" size={18} />{t('class.delete')}</Button>}
      </div>
    </main>
  );
}

function StudentsTab({ classroomId, students, reload, signInThemeId }: { classroomId: string; students: Student[]; reload: () => void; signInThemeId?: string }) {
  const { themes } = useMadeThemes();
  const look = themes.find((th) => th.id === signInThemeId);
  const tier = useTier();
  const limit = TIERS[tier].studentsPerClassroom;
  const [names, setNames] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [asking, setAsking] = useState<Student | null>(null);
  const toAdd = names.split('\n').map((n) => n.trim()).filter(Boolean);
  const room = Number.isFinite(limit) ? limit - students.length : Infinity;

  async function add() {
    const taken = students.map((s) => s.picturePassword);
    for (const name of toAdd.slice(0, room)) {
      const pw = newPicturePassword(taken);
      taken.push(pw);
      await data.saveStudent({ id: newId('stu'), classroomId, name: name.slice(0, 30), picturePassword: pw });
    }
    setNames('');
    reload();
  }
  function openSettings(s: Student) { if (unlocked) setEditing(s); else setAsking(s); }

  return (
    <div className="grid gap-4">
      <Panel className="grid gap-2">
        <label htmlFor="student-names" className="font-bold">{t('class.addStudents')}</label>
        <textarea id="student-names" value={names} onChange={(e) => setNames(e.target.value)} rows={3} placeholder={t('class.namesPlaceholder')}
          className="px-3 py-2 rounded-input border-[2px] border-border font-bold" />
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" disabled={toAdd.length === 0 || room <= 0} onClick={() => void add()}><Plus weight="bold" size={18} />{t('class.add', { count: Math.min(toAdd.length, room) })}</Button>
          <p className="font-bold text-sm">{Number.isFinite(limit) ? t('class.studentLimit', { count: students.length, limit }) : t('class.studentCount', { count: students.length })}</p>
        </div>
        {toAdd.length > room && <div className="flex flex-wrap items-center gap-2"><p className="font-bold text-sm">{t('class.overLimit', { limit })}</p><UpgradeButton className="min-h-10 px-3 text-sm" /></div>}
      </Panel>
      {students.length === 0 && <Panel><p className="font-bold">{t('class.noStudents')}</p></Panel>}
      <div className="grid sm:grid-cols-2 gap-3">
        {students.map((s) => (
          <Panel key={s.id} className="flex items-center gap-3 !p-3">
            <span className="flex gap-1" aria-label={t('class.pictures', { a: s.picturePassword[0], b: s.picturePassword[1] })} role="img">
              {s.picturePassword.map((p, i) => <PictureBadge key={i} id={p} theme={look} size={40} />)}
            </span>
            <span className="font-bold flex-1 min-w-0 truncate">{s.name}</span>
            {s.accommodations && <span className="text-xs font-bold px-2 py-0.5 rounded-pill bg-surface-2 border border-border">{t('class.hasSupports')}</span>}
            <button type="button" onClick={() => openSettings(s)} aria-label={t('class.supportsFor', { name: s.name })} className="w-11 h-11 rounded-full border-[2px] border-border bg-surface-2 flex items-center justify-center"><GearSix weight="bold" size={20} /></button>
            <button type="button" onClick={async () => { await data.deleteStudent(s.id); reload(); }} aria-label={t('class.remove', { name: s.name })} className="w-11 h-11 rounded-full border-[2px] border-border bg-surface flex items-center justify-center"><Trash weight="bold" size={20} /></button>
          </Panel>
        ))}
      </div>
      {asking && (
        <Dialog title={t('class.supportsFor', { name: asking.name })} onClose={() => setAsking(null)}>
          <PinGate onUnlock={() => { setUnlocked(true); setEditing(asking); setAsking(null); }} />
        </Dialog>
      )}
      {editing && <SupportsDialog student={editing} onClose={() => { setEditing(null); reload(); }} />}
    </div>
  );
}

// Which sign-in picture design the class uses (built-in or one made in the
// Theme Builder).
function SignInLook({ classroom, onChange }: { classroom: Classroom; onChange: () => void }) {
  const { themes } = useMadeThemes();
  const looks = themes.filter((th) => th.gameId === 'sign-in');
  return (
    <Panel className="grid gap-2 mb-4">
      <ChoiceRow label={t('class.signInLook')} value={classroom.signInThemeId ?? 'built-in'}
        onChange={async (v) => { await data.saveClassroom({ ...classroom, signInThemeId: v === 'built-in' ? undefined : v }); onChange(); }}
        options={[{ value: 'built-in', label: t('class.signInBuiltIn') }, ...looks.map((th) => ({ value: th.id, label: th.name }))]} />
      <Link to="/teacher/themes/sign-in" className="font-bold text-sm underline justify-self-start">{t('class.signInDesign')}</Link>
    </Panel>
  );
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45" role="dialog" aria-modal="true" aria-label={title}>
      <div className="bg-surface border-[2.5px] border-border rounded-panel p-5 grid gap-4 w-full max-w-lg max-h-[calc(100dvh-32px)] overflow-y-auto" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-2xl font-bold"><Title text={title} /></h2>
          <button type="button" onClick={onClose} aria-label={t('class.close')} className="w-11 h-11 rounded-full border-[2px] border-border bg-surface-2 flex items-center justify-center"><X weight="bold" size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Per-student accommodations (IEP-style), applied when they sign in.
function SupportsDialog({ student, onClose }: { student: Student; onClose: () => void }) {
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
      <Button variant="primary" onClick={() => void save()}>{t('class.saveSupports')}</Button>
    </Dialog>
  );
}

function SetsTab({ classroomId, students, assignments, reload }: { classroomId: string; students: Student[]; assignments: SetAssignment[]; reload: () => void }) {
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
          <div key={a.id} className="flex flex-wrap items-center gap-2 rounded-input border-[2px] border-border-soft p-2">
            <span className="font-bold flex-1 min-w-40">{name(a.setId)}</span>
            <span className="text-sm font-bold text-muted">{a.studentId ? students.find((s) => s.id === a.studentId)?.name : t('class.wholeClass')}{a.startsOn || a.endsOn ? ` · ${a.startsOn ?? ''} to ${a.endsOn ?? ''}` : ''}{a.themeIds?.length ? ` · ${t('class.themeCount', { count: a.themeIds.length })}` : ''}</span>
            <button type="button" aria-pressed={a.starred} onClick={async () => { await data.saveAssignment({ ...a, starred: !a.starred }); reload(); }} aria-label={t('class.focus', { name: name(a.setId) })}
              className={`w-11 h-11 rounded-full border-[2px] border-border flex items-center justify-center ${a.starred ? 'bg-accent' : 'bg-surface'}`}><Star weight={a.starred ? 'fill' : 'bold'} size={20} /></button>
            <button type="button" onClick={async () => { await data.deleteAssignment(a.id); reload(); }} aria-label={t('class.unassign', { name: name(a.setId) })}
              className="w-11 h-11 rounded-full border-[2px] border-border bg-surface flex items-center justify-center"><Trash weight="bold" size={20} /></button>
          </div>
        ))}
        <p className="text-sm font-bold text-muted">{t('class.focusNote')}</p>
      </Panel>
      <Panel className="grid gap-4">
        <h2 className="font-display text-2xl font-bold"><Title text={t('class.assignNew')} /></h2>
        <SetPicker sets={sets} value={setId} onChange={setSetId} />
        <ThemeChoices value={themeIds} onChange={setThemeIds} />
        <ChoiceRow label={t('class.who')} value={who} onChange={setWho} options={[{ value: 'class', label: t('class.wholeClass') }, { value: 'some', label: t('class.someStudents') }]} />
        {who === 'some' && (
          <div className="flex flex-wrap gap-2">
            {students.map((s) => (
              <button key={s.id} type="button" role="checkbox" aria-checked={chosen.includes(s.id)} onClick={() => setChosen(chosen.includes(s.id) ? chosen.filter((x) => x !== s.id) : [...chosen, s.id])}
                className={`min-h-11 px-4 rounded-pill border-[2px] font-bold ${chosen.includes(s.id) ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}>{s.name}</button>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          <label className="grid gap-1 font-bold">{t('class.starts')}<input type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} className="min-h-11 px-2 rounded-input border-[2px] border-border" /></label>
          <label className="grid gap-1 font-bold">{t('class.ends')}<input type="date" value={endsOn} onChange={(e) => setEndsOn(e.target.value)} className="min-h-11 px-2 rounded-input border-[2px] border-border" /></label>
        </div>
        {full && Number.isFinite(limit) && <div className="flex flex-wrap items-center gap-2"><p className="font-bold">{t('class.setLimit', { limit })}</p><UpgradeButton className="min-h-10 px-3 text-sm" /></div>}
        <Button variant="primary" disabled={setId.length === 0 || targets.length === 0 || full} onClick={() => void assign()}><Plus weight="bold" size={18} />{t('class.assign')}</Button>
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
        <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold">{t('class.themesNone')}</p><UpgradeButton className="min-h-10 px-3 text-sm" /></div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map(({ th, game }) => {
            const on = value.includes(th.id);
            return (
              <button key={th.id} type="button" role="checkbox" aria-checked={on} disabled={!on && value.length >= MAX_THEME_CHOICES}
                onClick={() => onChange(on ? value.filter((x) => x !== th.id) : [...value, th.id])}
                className={`min-h-11 pl-1.5 pr-3 rounded-pill border-[2px] font-bold text-sm inline-flex items-center gap-2 disabled:opacity-50 ${on ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}>
                <span className="w-7 h-7 rounded-full border-[2px] border-border" style={{ background: th.colors.background }} aria-hidden="true" />
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
