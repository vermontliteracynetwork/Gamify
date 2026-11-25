import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Plus, Printer } from '@phosphor-icons/react';
import { TIERS } from '../config';
import { data, newId } from '../data';
import { LOCAL_TEACHER_ID, useAsync, useTier } from '../data/hooks';
import type { Classroom, QuestionLogEntry, Student } from '../data/types';
import { t } from '../i18n';
import { Button, buttonClasses, PageHeader, Panel } from '../ui/kit';
import TeacherNav from '../ui/TeacherNav';
import { LimitNote } from '../billing/Upgrade';
import { GAMES } from '../games/registry';
import { weekUsage } from './reports';
import { Chip, EDGE, FirstTryBar, firstTry, fmtDay, lastDay, SOFT } from './portalParts';

// The teacher's classrooms (development plan Stage 4), in the approved
// teacher portal look (/brand?tab=teacher, view 3a, 2026-11-25): one card per
// class with a color edge, its students' names right under the class name
// (teacher, 2026-11-16), one right-on-first-try meter, and Open class and
// Progress report one click away. Classes are a Plus and Pro feature
// (teacher, 2026-10-26); on Free this opens the teacher's one student list,
// "My students", made the first time.
const CHIPS = 14;

export default function ClassesPage() {
  const { value: classes = [], reload } = useAsync(() => data.listClassrooms());
  const { value: log = [] } = useAsync(() => data.listQuestionLog());
  const { value: roster = {} } = useAsync(async () => {
    const all = await data.listClassrooms();
    return Object.fromEntries(await Promise.all(all.map(async (c) => [c.id, await data.listStudents(c.id)] as const))) as Record<string, Student[]>;
  }, [classes.length]);
  const tier = useTier();
  const limit = TIERS[tier].classrooms;
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);
  const navigate = useNavigate();
  const { value: loaded } = useAsync(async () => (await data.listClassrooms()).length, []);
  useEffect(() => {
    if (TIERS[tier].hasClasses || loaded === undefined) return;
    void (async () => {
      const all = await data.listClassrooms();
      const first = [...all].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
      if (first) { navigate(`/teacher/classes/${first.id}`, { replace: true }); return; }
      const c = { id: newId('class'), name: t('roster.title'), ownerId: LOCAL_TEACHER_ID, createdAt: new Date().toISOString() };
      await data.saveClassroom(c);
      navigate(`/teacher/classes/${c.id}`, { replace: true });
    })();
  }, [tier, loaded, navigate]);
  if (!TIERS[tier].hasClasses) return null;

  async function create() {
    const c = { id: newId('class'), name: name.trim(), ownerId: LOCAL_TEACHER_ID, createdAt: new Date().toISOString() };
    await data.saveClassroom(c);
    reload();
    navigate(`/teacher/classes/${c.id}`);
  }
  const room = classes.length < limit;

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24">
      <TeacherNav />
      {/* Make class sits beside the title (teacher, 2026-10-31); its name box opens at the top. */}
      <PageHeader title={t('classes.title')} subtitle={t('classes.subtitle')}
        actions={room ? <Button variant="main" onClick={() => setAdding(true)}><Plus weight="bold" size={18} />{t('classes.create')}</Button> : undefined} />
      <div className="grid gap-4">
        {!room && <LimitNote>{t('classes.limit', { limit, count: limit })}</LimitNote>}
        {adding && room && (
          <Panel className="grid gap-2">
            <label htmlFor="class-name" className="font-bold">{t('classes.newName')}</label>
            <div className="flex flex-wrap gap-2">
              <input id="class-name" autoFocus value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder={t('classes.namePlaceholder')}
                onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) { void create(); setAdding(false); } if (e.key === 'Escape') setAdding(false); }}
                className="flex-1 min-w-48 min-h-12 px-3 rounded-input border-std border-border font-bold" />
              <Button variant="main" disabled={!name.trim()} onClick={() => { void create(); setAdding(false); }}><Plus weight="bold" size={18} />{t('classes.create')}</Button>
              <Button onClick={() => setAdding(false)}>{t('classes.cancel')}</Button>
            </div>
          </Panel>
        )}
        <ul className="list-none m-0 p-0 grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(100%,19rem),1fr))] items-stretch">
          {classes.map((c, ci) => <li key={c.id} className="grid"><ClassCard c={c} edge={EDGE[ci % EDGE.length]} students={roster[c.id]} log={log} /></li>)}
          {room && !adding && (
            <li className="grid">
              <button type="button" onClick={() => setAdding(true)} className="hover-pop min-h-[14rem] rounded-[1.125rem] grid place-content-center justify-items-center text-center gap-2 p-6 border-[2.5px] border-dashed border-muted bg-surface/50">
                <span className="w-12 h-12 rounded-full grid place-items-center bg-surface border-std border-border" aria-hidden="true"><Plus weight="bold" size={22} /></span>
                <b>{t('classes.addCard')}</b>
                <span className="text-sm font-semibold text-muted max-w-60">{t('classes.addCardHint')}</span>
              </button>
            </li>
          )}
        </ul>
      </div>
    </main>
  );
}

function ClassCard({ c, edge, students, log }: { c: Classroom; edge: string; students?: Student[]; log: QuestionLogEntry[] }) {
  const mine = log.filter((e) => e.classroomId === c.id);
  const ft = firstTry(mine);
  const last = lastDay(mine);
  const kids = [...(students ?? [])].sort((a, b) => a.name.localeCompare(b.name));
  const titleId = `class-${c.id}`;
  return (
    <article aria-labelledby={titleId} className="min-w-0 flex flex-col gap-1 bg-surface border-std border-border rounded-[1.125rem] p-5 shadow-[0_3px_0_var(--color-border)]" style={{ borderTop: `0.5rem solid ${edge}` }}>
      <h2 id={titleId} className="m-0 font-heading font-bold text-xl leading-tight break-words">
        <Link to={`/teacher/classes/${c.id}`} className="no-underline text-text hover:underline underline-offset-2">{c.name}</Link>
      </h2>
      <span className="text-sm font-semibold text-muted">
        {students ? t('classes.cardCount', { count: kids.length }) : ' '}{last ? `, ${t('classes.lastPlayed', { day: fmtDay(last) })}` : ''}
      </span>
      {kids.length > 0 && (
        <ul aria-label={t('classes.namesIn', { name: c.name })} className="list-none m-0 p-0 flex flex-wrap gap-1 mt-2">
          {kids.slice(0, CHIPS).map((s, i) => (
            <li key={s.id}><Link to={`/teacher/classes/${c.id}/students/${s.id}`} aria-label={t('cv.openStudent', { name: s.name })} className="no-underline text-text hover-pop inline-flex"><Chip bg={SOFT[i % SOFT.length]}>{s.name}</Chip></Link></li>
          ))}
          {kids.length > CHIPS && <li><Chip className="font-bold">{t('classes.more', { count: kids.length - CHIPS })}</Chip></li>}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-[0.8125rem] font-bold text-muted">{t('rp.firstTry')}</span>
        {ft.answered ? <FirstTryBar pct={ft.pct} width="7rem" label={t('classes.firstTryIs', { pct: ft.pct })} /> : <span className="text-sm font-bold text-muted">{t('classes.noPlays')}</span>}
      </div>
      <WeekLine usage={weekUsage(mine, c.id)} />
      <div className="mt-auto pt-3 flex flex-wrap gap-2">
        <Link to={`/teacher/classes/${c.id}`} className={buttonClasses('main', '', 'sm')}>{t('classes.open')}<ArrowRight weight="bold" size={14} /></Link>
        <Link to={`/teacher/reports/print?class=${c.id}`} className={buttonClasses('secondary', '', 'sm')}><Printer weight="bold" size={14} />{t('classes.progress')}</Link>
      </div>
    </article>
  );
}

// This week at a glance, under the meter (teacher-side usage numbers).
function WeekLine({ usage }: { usage: ReturnType<typeof weekUsage> }) {
  if (!usage.answered) return <span className="text-sm font-semibold text-muted">{t('classes.weekNone')}</span>;
  const game = GAMES.find((g) => g.id === usage.topGame)?.name;
  return (
    <span className="text-sm font-semibold text-muted">
      {t('classes.week', { count: usage.answered, right: usage.rightPct, students: usage.students })}{game ? ` ${t('classes.weekTop', { game })}` : ''}
    </span>
  );
}
