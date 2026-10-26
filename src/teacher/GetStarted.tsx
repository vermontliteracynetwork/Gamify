import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CaretDown, CheckCircle, Circle, Minus, X } from '@phosphor-icons/react';
import { data } from '../data';
import { useAsync } from '../data/hooks';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { TIERS, type Tier } from '../config';
import { Panel } from '../ui/kit';
import Title from '../ui/Title';

// First-run tour (development plan Stage 4): a checklist that ticks itself
// as the teacher plays a sample game, makes a class, adds students, assigns a
// set and opens student sign-in. It sits in the teacher menu on every page
// until all five are done (teacher, 2026-10-24); the X folds it to a menu pill.
// The minimize button beside it shrinks it to its title bar, and that
// choice is remembered on every tab (teacher, 2026-10-26).
export const FOLDED = 'get-started-folded';
const MINIMIZED = 'get-started-minimized';
type StepKey = 'play' | 'class' | 'students' | 'assign' | 'signin';
export interface StartSteps { steps: { key: StepKey; to: string; done: boolean }[]; count: number; folded: boolean; reload: () => void }

export function useStartSteps(): StartSteps | null {
  const { value, reload } = useAsync(async () => {
    const [classes, log, folded, tier] = await Promise.all([data.listClassrooms(), data.listQuestionLog(), data.getSetting<boolean>(FOLDED), data.getSetting<Tier>('tier')]);
    const students = (await Promise.all(classes.map((c) => data.listStudents(c.id)))).flat();
    const assignments = (await Promise.all(classes.map((c) => data.listAssignments(c.id)))).flat();
    const first = classes[0]?.id;
    const inClass = first ? `/teacher/classes/${first}` : '/teacher/classes';
    const steps = [
      { key: 'play' as const, to: '/teacher/sets', done: log.length > 0 },
      // Classes are Plus and Pro only; Free goes straight to its student list.
      ...(!TIERS[tier ?? 'free'].hasClasses ? [] : [{ key: 'class' as const, to: '/teacher/classes', done: classes.length > 0 }]),
      { key: 'students' as const, to: inClass, done: students.length > 0 },
      { key: 'assign' as const, to: inClass, done: assignments.length > 0 },
      { key: 'signin' as const, to: '/teacher/sets', done: log.some((e) => e.studentId && !e.studentId.startsWith('guest')) },
    ];
    return { steps, count: steps.filter((s) => s.done).length, folded: !!folded };
  });
  return value ? { ...value, reload } : null;
}

export default function GetStarted({ steps, count, onFold }: { steps: StartSteps['steps']; count: number; onFold: () => void }) {
  const [small, setSmall] = useState(false);
  useEffect(() => { void data.getSetting<boolean>(MINIMIZED).then((v) => setSmall(!!v)); }, []);
  const toggle = () => { setSmall(!small); void data.setSetting(MINIMIZED, !small); };
  return (
    <Panel className="mb-4 grid gap-2 bg-accent !p-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 flex flex-wrap items-baseline gap-x-3">
          <h2 className="font-display text-xl"><Title text={t('start.title')} /></h2>
          <p className="font-bold text-sm">{t('start.progress', { done: count, total: steps.length })}</p>
        </div>
        <button type="button" aria-label={small ? t('start.expand') : t('start.minimize')} aria-expanded={!small} onClick={toggle} className="w-11 h-11 rounded-full border-[2px] border-border bg-surface flex items-center justify-center">{small ? <CaretDown weight="bold" size={18} /> : <Minus weight="bold" size={18} />}</button>
        <button type="button" aria-label={t('start.hide')} onClick={onFold} className="w-11 h-11 rounded-full border-[2px] border-border bg-surface flex items-center justify-center"><X weight="bold" size={18} /></button>
      </div>
      {!small && <ol className="grid grid-cols-2 sm:grid-flow-col sm:auto-cols-fr gap-2 list-none p-0 m-0">
        {steps.map((s, i) => (
          <li key={s.key}>
            <Link to={s.to} className={`hover-pop h-full min-h-11 rounded-input border-[2px] border-border px-2.5 py-1.5 flex items-center gap-1.5 no-underline text-text ${s.done ? 'bg-surface-2' : 'bg-surface'}`}>
              <span className="flex items-center gap-1 font-bold shrink-0">{s.done ? <CheckCircle weight="fill" size={20} color="#1f7a45" aria-label={t('start.done')} /> : <Circle weight="bold" size={20} aria-hidden="true" />}{i + 1}</span>
              <span className="font-bold text-xs sm:text-sm leading-tight">{t(`start.step.${s.key}` as StringKey)}</span>
            </Link>
          </li>
        ))}
      </ol>}
    </Panel>
  );
}
