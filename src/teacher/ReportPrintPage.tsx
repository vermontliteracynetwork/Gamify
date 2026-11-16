import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Printer } from '@phosphor-icons/react';
import { data } from '../data';
import { useAsync, useMySets } from '../data/hooks';
import { LIBRARY } from '../data/library';
import type { Student } from '../data/types';
import { GAMES } from '../games/registry';
import { t } from '../i18n';
import { buttonClasses } from '../ui/kit';
import { getTeacher } from '../auth/session';
import { useCrumbLabel } from '../ui/Breadcrumbs';
import { filterLog } from './reports';
import ReportDoc from './reportDoc';
import { EXAMPLE_CLASS, EXAMPLE_STUDENTS, exampleLog } from './exampleReport';

// The printable report on its own page (teacher, 2026-11-16: "easy to go to
// the pdf viewer to download/print reports"). One big button opens the
// browser's print window, where Save as PDF downloads it. Links come from the
// class page, a student's page and Reports, with ?class, ?student, ?from, ?to.
export default function ReportPrintPage() {
  const [q] = useSearchParams();
  const classId = q.get('class') ?? '';
  const studentId = q.get('student') ?? undefined;
  const from = q.get('from') ?? undefined, to = q.get('to') ?? undefined;
  const example = classId === EXAMPLE_CLASS.id;
  const { value: classes = [] } = useAsync(() => data.listClassrooms());
  const { value: realLog } = useAsync(() => (example ? Promise.resolve([]) : data.listQuestionLog(classId ? { classroomId: classId } : undefined)), [classId]);
  const { value: realStudents = [] } = useAsync<Student[]>(async () => (example ? [] : classId ? data.listStudents(classId) : (await Promise.all((await data.listClassrooms()).map((c) => data.listStudents(c.id)))).flat()), [classId]);
  const sample = useMemo(() => (example ? exampleLog() : []), [example]);
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const students = example ? EXAMPLE_STUDENTS : realStudents;
  const all = example ? sample : realLog ?? [];
  const log = filterLog(all, { studentId, from, to });
  const className = example ? EXAMPLE_CLASS.name : classes.find((c) => c.id === classId)?.name ?? t('reports.allClasses');
  const student = studentId ? students.find((s) => s.id === studentId) : undefined;
  const names = {
    student: (id?: string) => students.find((s) => s.id === id)?.name ?? t('reports.noStudent'),
    set: (id?: string) => sets.find((s) => s.id === id)?.name ?? t('reports.noSet'),
    game: (id: string) => GAMES.find((g) => g.id === id)?.name ?? id,
  };
  useCrumbLabel(student ? t('rp.studentReport') : t('rp.classReport'));
  const back = studentId && classId ? `/teacher/classes/${classId}/students/${studentId}` : classId && !example ? `/teacher/classes/${classId}` : '/teacher/reports';
  const loading = realLog === undefined && !example;

  return (
    <main className="report-page max-w-5xl mx-auto px-4 sm:px-8 pt-6 pb-24 print:p-0 print:max-w-none">
      <div className="no-print flex flex-wrap items-center gap-3 mb-5">
        <Link to={back} className={buttonClasses('secondary')}><ArrowLeft weight="bold" size={18} />{t('rp.back')}</Link>
        <button type="button" onClick={() => window.print()} disabled={loading} className={buttonClasses('primary', 'min-h-12 px-6 text-lg')} style={{ boxShadow: 'var(--shadow-sticker)' }}>
          <Printer weight="bold" size={22} />{t('rp.print')}
        </button>
        <p className="text-sm font-bold text-muted">{t('rp.printHint')}</p>
      </div>
      {!loading && <ReportDoc log={log} students={student ? [student] : students} names={names} className={className} student={student} teacher={example ? undefined : getTeacher()?.name} from={from} to={to} />}
    </main>
  );
}
