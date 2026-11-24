import { Link } from 'react-router-dom';
import { ArrowRight, ChartBar, Check, GameController, PaintBrush, Stack, UsersThree, Warning } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { data } from '../data';
import { useAsync } from '../data/hooks';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { buttonClasses, PageHeader, Panel } from '../ui/kit';
import Meter from '../ui/Meter';
import TeacherNav from '../ui/TeacherNav';
import { useStartSteps } from './GetStarted';

// The teacher's home (approved /brand teacher portal, batch 6, 2026-11-24).
// First day: the get-started steps big in the middle, the next one picked out
// with its button, and the empty states merged in beside them ("merge the
// empties concept into the teacher dashboard/home", teacher 2026-11-24): each
// says what will fill it, why it matters, and its one next step. After that,
// a quick start. Only real data: nothing here is made up.
export default function TeacherHome() {
  const start = useStartSteps();
  const { value: facts } = useAsync(async () => {
    const [classes, log] = await Promise.all([data.listClassrooms(), data.listQuestionLog()]);
    return { classes: classes.length, played: log.length > 0 };
  });
  const unfinished = !!start && start.count < start.steps.length;
  const nextIdx = start ? start.steps.findIndex((s) => !s.done) : -1;

  const quick: [Icon, StringKey, string][] = [
    [GameController, 'teacherHome.q.activity', '/teacher/activity'],
    [Stack, 'teacherHome.q.sets', '/teacher/sets'],
    [ChartBar, 'teacherHome.q.reports', '/teacher/reports'],
    [PaintBrush, 'teacherHome.q.themes', '/teacher/themes'],
  ];
  const empties: [Icon, StringKey, StringKey, StringKey, string, string][] = [];
  if (facts && facts.classes === 0) empties.push([UsersThree, 'teacherHome.empty.class', 'teacherHome.empty.classWhy', 'teacherHome.addClass', '/teacher/classes', 'bg-quiz-blue']);
  if (facts && !facts.played) empties.push([ChartBar, 'teacherHome.empty.reports', 'teacherHome.empty.reportsWhy', 'teacherNav.create', '/teacher/activity', 'bg-butter']);
  if (facts && !facts.played) empties.push([Warning, 'teacherHome.empty.attention', 'teacherHome.empty.attentionWhy', 'teacherHome.reports', '/teacher/reports', 'bg-blush']);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24">
      <TeacherNav startOpen={false} />
      <PageHeader title={t(unfinished ? 'teacherHome.title' : 'teacherHome.titleBack')} subtitle={t(unfinished ? 'teacherHome.sub' : 'teacherHome.subBack')} />
      <div className={`grid gap-4 items-start ${empties.length || unfinished ? 'lg:grid-cols-[minmax(0,1fr)_22rem]' : ''}`}>
        {start && unfinished ? (
          <Panel className="grid gap-4">
            <div className="grid gap-2">
              <h2 className="font-heading font-bold text-lg">{t('teacherHome.progress', { done: start.count, total: start.steps.length })}</h2>
              <Meter part={start.count / start.steps.length} width="min(100%, 22rem)" height={18} label={t('teacherHome.progress', { done: start.count, total: start.steps.length })} />
            </div>
            <ol className="list-none m-0 p-0 grid gap-2.5">
              {start.steps.map((s, i) => {
                const next = i === nextIdx;
                return (
                  <li key={s.key} className={`rounded-card p-3 flex flex-wrap items-center gap-3 border-std ${s.done ? 'bg-mint-soft border-transparent' : next ? 'bg-gamify border-border shadow-[0_0_0_0.2rem_var(--color-surface),0_0_0_0.4rem_var(--color-border)]' : 'bg-surface-2 border-transparent'}`}>
                    <span className={`w-11 h-11 rounded-full grid place-items-center font-bold text-lg shrink-0 border-std border-border ${s.done ? 'bg-success text-white' : 'bg-surface'}`}>{s.done ? <Check weight="bold" size={20} aria-label={t('start.done')} /> : i + 1}</span>
                    <b className="flex-1 min-w-40">{t(`start.step.${s.key}` as StringKey)}</b>
                    {next && <Link to={s.to} className={buttonClasses('primary')}>{t('teacherHome.next')}<ArrowRight weight="bold" size={16} /></Link>}
                  </li>
                );
              })}
            </ol>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-muted">{t('teacherHome.example')}</span>
              <Link to="/teacher/reports" className={buttonClasses()}><ChartBar weight="bold" size={18} />{t('teacherHome.exampleBtn')}</Link>
            </div>
          </Panel>
        ) : (
          <Panel className="grid gap-2">
            <h2 className="font-heading font-bold text-lg">{t('teacherHome.quick')}</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {quick.map(([Ic, k, to]) => (
                <Link key={k} to={to} className="hover-pop min-h-14 px-4 rounded-input border-std border-border bg-surface-2 flex items-center gap-3 font-bold no-underline text-text">
                  <Ic weight="bold" size={22} /><span className="flex-1">{t(k)}</span><ArrowRight weight="bold" size={18} />
                </Link>
              ))}
            </div>
          </Panel>
        )}
        {(empties.length > 0 || unfinished) && (
          <div className="grid gap-4 content-start">
            {empties.map(([Ic, title, why, btn, to, bg]) => (
              <div key={title} className="rounded-card p-5 grid justify-items-center text-center gap-2 border-[2.5px] border-dashed border-muted bg-surface/60">
                <span className={`w-12 h-12 rounded-full grid place-items-center border-std border-border ${bg}`}><Ic weight="bold" size={22} /></span>
                <h2 className="font-heading font-bold">{t(title)}</h2>
                <p className="text-sm font-bold text-muted leading-snug">{t(why)}</p>
                <Link to={to} className={buttonClasses()}>{t(btn)}<ArrowRight weight="bold" size={16} /></Link>
              </div>
            ))}
            {unfinished && empties.length === 0 && (
              <Panel className="grid gap-2">
                <h2 className="font-heading font-bold text-lg">{t('teacherHome.quick')}</h2>
                {quick.map(([Ic, k, to]) => (
                  <Link key={k} to={to} className="hover-pop min-h-12 px-3 rounded-input bg-surface-2 flex items-center gap-3 font-bold no-underline text-text">
                    <Ic weight="bold" size={20} /><span className="flex-1">{t(k)}</span><ArrowRight weight="bold" size={16} />
                  </Link>
                ))}
              </Panel>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
