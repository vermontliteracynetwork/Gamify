import { useState } from 'react';
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

// The teacher's classrooms (development plan Stage 4). Free has one.
export default function ClassesPage() {
  const { value: classes = [], reload } = useAsync(() => data.listClassrooms());
  const tier = useTier();
  const limit = TIERS[tier].classrooms;
  const [name, setName] = useState('');
  const navigate = useNavigate();

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
              <span className="font-display text-2xl font-bold flex-1">{c.name}</span>
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
