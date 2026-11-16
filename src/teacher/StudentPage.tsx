import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, GearSix, Printer, UserCircle } from '@phosphor-icons/react';
import { data } from '../data';
import { useAsync, useMySets } from '../data/hooks';
import { LIBRARY } from '../data/library';
import { GAMES } from '../games/registry';
import { t } from '../i18n';
import PinGate from '../settings/PinGate';
import Avatar from '../student/Avatar';
import { avatarOf } from '../student/pictures';
import { useMadeThemes } from '../theme/made';
import { Button, buttonClasses, Panel } from '../ui/kit';
import TeacherNav from '../ui/TeacherNav';
import Title from '../ui/Title';
import { useCrumbLabel } from '../ui/Breadcrumbs';
import { AvatarDialog, Dialog, StudentStrip, SupportsDialog } from './ClassPage';
import ReportDoc from './reportDoc';

// One student inside a class (teacher, 2026-11-16: a student view apart from
// the class view): their picture and PIN, supports, the sets they play, and
// their own progress report, with every classmate one tap away at the top.
export default function StudentPage() {
  const { id = '', sid = '' } = useParams();
  const { value: classes = [] } = useAsync(() => data.listClassrooms());
  const { value: students = [], reload } = useAsync(() => data.listStudents(id), [id]);
  const { value: assignments = [] } = useAsync(() => data.listAssignments(id), [id]);
  const { value: log = [] } = useAsync(() => data.listQuestionLog({ classroomId: id }), [id]);
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const { themes } = useMadeThemes();
  const classroom = classes.find((c) => c.id === id);
  const student = students.find((s) => s.id === sid);
  const look = themes.find((th) => th.id === classroom?.signInThemeId);
  const [dialog, setDialog] = useState<'pin' | 'supports' | 'avatar' | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  useCrumbLabel(student?.name);
  if (!classroom || !student) return null;
  const mineLog = log.filter((e) => e.studentId === sid);
  const setName = (x?: string) => sets.find((s) => s.id === x)?.name ?? t('reports.noSet');
  const own = assignments.filter((a) => !a.studentId || a.studentId === sid);
  const names = { student: () => student.name, set: setName, game: (g: string) => GAMES.find((x) => x.id === g)?.name ?? g };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24">
      <TeacherNav />
      <Link to={`/teacher/classes/${id}`} className="inline-flex items-center gap-1.5 font-bold mb-3"><ArrowLeft weight="bold" size={18} />{classroom.name}</Link>
      <StudentStrip classId={id} students={students} current={sid} look={look} />
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Avatar avatar={avatarOf(student)} theme={look} size={72} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">{t('cv.studentView')}</p>
          <h1 className="title-bubble text-3xl"><Title text={student.name} /></h1>
          <p className="font-bold">{classroom.name} · {t('class.pinIs', { pin: student.pin ?? '' })}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/teacher/reports/print?class=${id}&student=${sid}`} className={buttonClasses('primary')}><Printer weight="bold" size={18} />{t('rp.print')}</Link>
          <Button onClick={() => setDialog(unlocked ? 'supports' : 'pin')}><GearSix weight="bold" size={18} />{t('cv.supports')}</Button>
          <Button onClick={() => setDialog('avatar')}><UserCircle weight="bold" size={18} />{t('cv.avatarPin')}</Button>
        </div>
      </div>
      <Panel className="grid gap-2 mb-5">
        <h2 className="font-display text-xl font-bold">{t('cv.assignedHere', { name: student.name })}</h2>
        {own.length === 0 ? <p className="font-semibold">{t('class.noAssigned')}</p> : (
          <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
            {own.map((a) => <li key={a.id} className="rounded-pill border-[2px] border-border-soft px-3 py-1 font-bold text-sm">{setName(a.setId)}<span className="text-muted font-semibold"> · {a.studentId ? student.name : t('class.wholeClass')}</span></li>)}
          </ul>
        )}
      </Panel>
      <ReportDoc log={mineLog} students={[student]} names={names} className={classroom.name} student={student} />
      {dialog === 'pin' && <Dialog title={t('class.supportsFor', { name: student.name })} onClose={() => setDialog(null)}><PinGate onUnlock={() => { setUnlocked(true); setDialog('supports'); }} /></Dialog>}
      {dialog === 'supports' && <SupportsDialog student={student} onClose={() => { setDialog(null); reload(); }} />}
      {dialog === 'avatar' && <AvatarDialog student={student} others={students.filter((x) => x.id !== sid)} look={look} onClose={() => { setDialog(null); reload(); }} />}
    </main>
  );
}
