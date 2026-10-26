import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, UsersThree } from '@phosphor-icons/react';
import { TIERS } from '../config';
import { data, newId } from '../data';
import { LOCAL_TEACHER_ID, useAsync, useTier } from '../data/hooks';
import { t } from '../i18n';
import { newJoinCode } from '../auth/session';
import { Button, PageHeader, Panel } from '../ui/kit';
import TeacherNav from '../ui/TeacherNav';
import { LimitNote } from '../billing/Upgrade';
import { GAMES } from '../games/registry';
import { weekUsage } from './reports';

// The teacher's classrooms (development plan Stage 4). Classes are a Plus
// and Pro feature (teacher, 2026-10-26); on Free this opens the teacher's one
// student list, "My students", made the first time.
export default function ClassesPage() {
  const { value: classes = [], reload } = useAsync(() => data.listClassrooms());
  const { value: log = [] } = useAsync(() => data.listQuestionLog());
  const tier = useTier();
  const limit = TIERS[tier].classrooms;
  const [name, setName] = useState('');
  const navigate = useNavigate();
  const { value: loaded } = useAsync(async () => (await data.listClassrooms()).length, []);
  useEffect(() => {
    if (TIERS[tier].hasClasses || loaded === undefined) return;
    void (async () => {
      const all = await data.listClassrooms();
      const first = [...all].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
      if (first) { navigate(`/teacher/classes/${first.id}`, { replace: true }); return; }
      const c = { id: newId('class'), name: t('roster.title'), ownerId: LOCAL_TEACHER_ID, createdAt: new Date().toISOString(), joinCode: newJoinCode([]) };
      await data.saveClassroom(c);
      navigate(`/teacher/classes/${c.id}`, { replace: true });
    })();
  }, [tier, loaded, navigate]);
  if (!TIERS[tier].hasClasses) return null;

  async function create() {
    const c = { id: newId('class'), name: name.trim(), ownerId: LOCAL_TEACHER_ID, createdAt: new Date().toISOString(), joinCode: newJoinCode(classes.map((x) => x.joinCode ?? '')) };
    await data.saveClassroom(c);
    reload();
    navigate(`/teacher/classes/${c.id}`);
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-24">
      <TeacherNav startOpen />
      <PageHeader title={t('classes.title')} subtitle={t('classes.subtitle')} />
      <div className="grid gap-3">
        {classes.map((c) => (
          <Link key={c.id} to={`/teacher/classes/${c.id}`} className="no-underline text-text">
            <Panel className="flex items-center gap-3 hover:bg-surface-hover">
              <UsersThree weight="fill" size={32} aria-hidden="true" />
              <span className="flex-1 min-w-0 grid">
                <span className="font-display text-2xl font-bold">{c.name}</span>
                <WeekLine usage={weekUsage(log, c.id)} />
              </span>
            </Panel>
          </Link>
        ))}
        {classes.length < limit ? (
          <Panel className="grid gap-2">
            <label htmlFor="class-name" className="font-bold">{t('classes.newName')}</label>
            <div className="flex flex-wrap gap-2">
              <input id="class-name" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder={t('classes.namePlaceholder')}
                onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) void create(); }}
                className="flex-1 min-w-48 min-h-12 px-3 rounded-input border-[2px] border-border font-bold" />
              <Button variant="primary" disabled={!name.trim()} onClick={() => void create()}><Plus weight="bold" size={18} />{t('classes.create')}</Button>
            </div>
          </Panel>
        ) : (
          <LimitNote>{t('classes.limit', { limit, count: limit })}</LimitNote>
        )}
      </div>
    </main>
  );
}

// This week at a glance, under each class name (teacher-side usage numbers).
function WeekLine({ usage }: { usage: ReturnType<typeof weekUsage> }) {
  if (!usage.answered) return <span className="text-sm font-semibold text-muted">{t('classes.weekNone')}</span>;
  const game = GAMES.find((g) => g.id === usage.topGame)?.name;
  return (
    <span className="text-sm font-semibold text-muted">
      {t('classes.week', { count: usage.answered, right: usage.rightPct, students: usage.students })}{game ? ` ${t('classes.weekTop', { game })}` : ''}
    </span>
  );
}
