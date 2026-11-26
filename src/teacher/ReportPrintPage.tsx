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
  // One page per game the student played: a game on a day is one session.
  const games = useMemo(() => {
    if (!student) return [];
    const by = new Map<string, { key: string; gameId: string; setId?: string; day: string; rows: typeof log; right: number; tried: number }>();
    for (const e of [...log].sort((a, b) => a.at.localeCompare(b.at))) {
      const day = e.at.slice(0, 10), key = `${e.gameId}|${e.setId ?? ''}|${day}`;
      const g = by.get(key) ?? { key, gameId: e.gameId, setId: e.setId, day, rows: [], right: 0, tried: 0 };
      g.rows.push(e);
      if (e.outcome !== 'left') { g.tried += 1; if (e.outcome === 'right') g.right += 1; }
      by.set(key, g);
    }
    return [...by.values()];
  }, [log, student]);

  return (
    <main className="report-page max-w-5xl mx-auto px-4 sm:px-8 pt-6 pb-24 print:p-0 print:max-w-none">
      <div className="no-print flex flex-wrap items-center gap-3 mb-5">
        <Link to={back} className={buttonClasses('secondary')}><ArrowLeft weight="bold" size={18} />{t('rp.back')}</Link>
        <button type="button" onClick={() => window.print()} disabled={loading} className={buttonClasses('main', 'min-h-12 px-6 text-lg')} style={{ boxShadow: 'var(--shadow-sticker)' }}>
          <Printer weight="bold" size={22} />{t('rp.print')}
        </button>
        <p className="text-sm font-bold text-muted">{t('rp.printHint')}</p>
      </div>
      {!loading && <ReportDoc log={log} students={student ? [student] : students} names={names} standardsOf={(id) => sets.find((s) => s.id === id)?.standards} className={className} student={student} teacher={example ? undefined : getTeacher()?.name} from={from} to={to} />}
      {/* Reports by student (owner, 2026-11-26: "John could be sorted for all
          the games he's played; each game on new page in pdf"). */}
      {!loading && student && games.map((g) => (
        <section key={g.key} className="report-game-page break-before-page print:break-before-page mt-10 grid gap-2">
          <h2 className="font-display text-2xl">{t('rp.gamePage', { game: names.game(g.gameId), date: g.day, name: student.name })}</h2>
          <p className="font-bold">{t('rp.gameScore', { right: g.right, tried: g.tried, pct: g.tried ? Math.round((g.right / g.tried) * 100) : 0, set: names.set(g.setId) })}</p>
          <table className="w-full text-left border-collapse text-sm">
            <thead><tr className="border-b-[2px] border-border"><th scope="col" className="py-1.5 pr-3">{t('rp.question')}</th><th scope="col" className="py-1.5 pr-3">{t('rp.answerCol')}</th><th scope="col" className="py-1.5 pr-3">{t('rp.result')}</th></tr></thead>
            <tbody>{g.rows.map((e) => <tr key={e.id} className="border-b border-border-soft break-inside-avoid"><th scope="row" className="py-1.5 pr-3 font-semibold align-top">{e.prompt}</th><td className="py-1.5 pr-3 align-top">{e.answer}</td><td className="py-1.5 pr-3 align-top font-bold">{t(`rp.outcome.${e.outcome}`)}</td></tr>)}</tbody>
          </table>
        </section>
      ))}
    </main>
  );
}
