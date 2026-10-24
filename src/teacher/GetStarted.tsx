import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Circle, X } from '@phosphor-icons/react';
import { data } from '../data';
import { useAsync } from '../data/hooks';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { Panel } from '../ui/kit';
import Title from '../ui/Title';

// First-run tour (development plan Stage 4): a checklist that ticks itself
// as the teacher plays a sample game, makes a class, adds students, assigns a
// set and opens student sign-in. Hidden for good once dismissed or done.
const DISMISSED = 'get-started-dismissed';

export default function GetStarted() {
  const { value } = useAsync(async () => {
    const [classes, log, dismissed] = await Promise.all([data.listClassrooms(), data.listQuestionLog(), data.getSetting<boolean>(DISMISSED)]);
    const students = (await Promise.all(classes.map((c) => data.listStudents(c.id)))).flat();
    const assignments = (await Promise.all(classes.map((c) => data.listAssignments(c.id)))).flat();
    const signedIn = log.some((e) => e.studentId && !e.studentId.startsWith('guest'));
    return { dismissed: !!dismissed, done: { play: log.length > 0, class: classes.length > 0, students: students.length > 0, assign: assignments.length > 0, signin: signedIn }, firstClass: classes[0]?.id };
  });
  const [hidden, setHidden] = useState(false);
  if (!value || value.dismissed || hidden) return null;
  const steps: { key: keyof typeof value.done; to: string }[] = [
    { key: 'play', to: '/teacher/sets' },
    { key: 'class', to: '/teacher/classes' },
    { key: 'students', to: value.firstClass ? `/teacher/classes/${value.firstClass}` : '/teacher/classes' },
    { key: 'assign', to: value.firstClass ? `/teacher/classes/${value.firstClass}` : '/teacher/classes' },
    { key: 'signin', to: value.firstClass ? `/arcade/${value.firstClass}` : '/teacher/classes' },
  ];
  const count = steps.filter((s) => value.done[s.key]).length;
  if (count === steps.length) return null;
  return (
    <Panel className="mb-6 grid gap-3 bg-accent">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <h2 className="font-display text-2xl"><Title text={t('start.title')} /></h2>
          <p className="font-bold text-sm">{t('start.progress', { done: count, total: steps.length })}</p>
        </div>
        <button type="button" aria-label={t('start.hide')} onClick={() => { setHidden(true); void data.setSetting(DISMISSED, true); }} className="w-11 h-11 rounded-full border-[2px] border-border bg-surface flex items-center justify-center"><X weight="bold" size={18} /></button>
      </div>
      <ol className="grid sm:grid-cols-5 gap-2 list-none p-0 m-0">
        {steps.map((s, i) => {
          const done = value.done[s.key];
          return (
            <li key={s.key}>
              <Link to={s.to} className={`h-full rounded-input border-[2px] border-border p-3 grid gap-1 no-underline text-text ${done ? 'bg-surface-2' : 'bg-surface'}`}>
                <span className="flex items-center gap-1.5 font-bold">{done ? <CheckCircle weight="fill" size={22} color="#1f7a45" aria-label={t('start.done')} /> : <Circle weight="bold" size={22} aria-hidden="true" />}{i + 1}</span>
                <span className="font-bold text-sm">{t(`start.step.${s.key}` as StringKey)}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}
