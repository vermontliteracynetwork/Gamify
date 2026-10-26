import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, DownloadSimple, Trash } from '@phosphor-icons/react';
import { PlanCards } from '../billing/Upgrade';
import { setTeacher, useTeacher } from '../auth/session';
import { TIERS } from '../config';
import { data } from '../data';
import { useAsync, useTier } from '../data/hooks';
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
  const [upgraded, setUpgraded] = useState<string | null>(null);
  // What the class already gets from Gamify, so the plan talk starts from
  // value (teacher rule: lead with value, never the price).
  const { value: used } = useAsync(async () => {
    const classes = await data.listClassrooms();
    const students = (await Promise.all(classes.map((c) => data.listStudents(c.id)))).flat();
    return { answers: (await data.listQuestionLog()).length, students: students.length, sets: (await data.listQuestionSets()).length };
  });

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
        <p className="font-semibold">{(!TIERS[tier].hasClasses ? t('account.limitsFree', { students: String(TIERS[tier].studentsPerClassroom), sets: String(TIERS[tier].savedQuestionSets) }) : t('account.limits', { classes: String(TIERS[tier].classrooms), sets: String(TIERS[tier].savedQuestionSets) })).replace(/Infinity/g, t('pricing.unlimited'))}</p>
        <p className="font-bold text-lg">{used && used.answers > 0 ? t('account.value', { answers: used.answers, students: used.students, sets: used.sets }) : t('account.valueNew')}</p>
        {upgraded ? <p className="font-bold text-lg" role="status">{t('upgrade.done', { plan: upgraded })} {t('upgrade.doneText')}</p> : tier === 'pro' ? (
          <p className="font-bold flex items-center gap-2"><Crown weight="fill" size={22} aria-hidden="true" />{t('account.topPlan')}</p>
        ) : (
          <>
            <p className="font-display text-xl">{tier === 'plus' ? t('account.moreFromPro') : t('account.moreFrom')}</p>
            <PlanCards suggest={tier === 'plus' ? 'pro' : 'plus'} onDone={(p) => setUpgraded(t(`pricing.${p}`))} />
          </>
        )}
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
