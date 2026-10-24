import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DownloadSimple, Trash } from '@phosphor-icons/react';
import { setTeacher, useTeacher } from '../auth/session';
import { TIERS } from '../config';
import { data } from '../data';
import { useTier } from '../data/hooks';
import { t } from '../i18n';
import { Button, PageHeader, Panel } from '../ui/kit';
import TeacherNav from '../ui/TeacherNav';

// The teacher's account: plan, downloading everything, deleting
// everything, and what happens on a smaller plan (nothing is deleted).
export default function AccountPage() {
  const teacher = useTeacher();
  const tier = useTier();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState('');

  async function exportAll() {
    const classes = await data.listClassrooms();
    const dump = {
      exportedAt: new Date().toISOString(), teacher, plan: tier,
      questionSets: await data.listQuestionSets(),
      classes,
      students: (await Promise.all(classes.map((c) => data.listStudents(c.id)))).flat(),
      assignments: (await Promise.all(classes.map((c) => data.listAssignments(c.id)))).flat(),
      questionLog: await data.listQuestionLog(),
    };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' }));
    a.download = `gamify-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  async function deleteAll() {
    for (const c of await data.listClassrooms()) await data.deleteClassroom(c.id);
    for (const s of await data.listQuestionSets()) await data.deleteQuestionSet(s.id);
    try { for (const k of Object.keys(localStorage)) if (k.startsWith('gamify:')) localStorage.removeItem(k); } catch { /* nothing stored */ }
    setTeacher(null);
    navigate('/');
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-24 grid gap-4">
      <TeacherNav />
      <PageHeader title={t('account.title')} subtitle={teacher?.name} />
      <Panel className="grid gap-2">
        <h2 className="font-display text-2xl">{t('account.plan', { plan: t(`pricing.${tier}`) })}</h2>
        <p className="font-semibold">{t('account.limits', { classes: String(TIERS[tier].classrooms), sets: String(TIERS[tier].savedQuestionSets) }).replace(/Infinity/g, t('pricing.unlimited'))}</p>
        <p className="text-sm font-bold text-muted">{t('account.downgrade')}</p>
      </Panel>
      <Panel className="grid gap-2">
        <h2 className="font-display text-2xl">{t('account.exportTitle')}</h2>
        <p className="font-semibold">{t('account.exportText')}</p>
        <Button className="justify-self-start" onClick={() => void exportAll()}><DownloadSimple weight="bold" size={18} />{t('account.export')}</Button>
      </Panel>
      <Panel className="grid gap-2">
        <h2 className="font-display text-2xl">{t('account.deleteTitle')}</h2>
        <p className="font-semibold">{t('account.deleteText')}</p>
        <label className="grid gap-1 font-bold">{t('account.typeDelete')}
          <input value={confirm} onChange={(e) => setConfirm(e.target.value)} className="min-h-11 px-3 rounded-input border-[2px] border-border font-bold max-w-xs" />
        </label>
        <Button variant="danger" className="justify-self-start" disabled={confirm !== 'DELETE'} onClick={() => void deleteAll()}><Trash weight="bold" size={18} />{t('account.delete')}</Button>
      </Panel>
    </main>
  );
}
