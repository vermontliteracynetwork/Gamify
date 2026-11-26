import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Crown, DownloadSimple, Receipt, SignOut, Trash } from '@phosphor-icons/react';
import { supabase } from '../data/supabase';
import { PIN_KEY } from '../settings/pin';
import { PlanCards } from '../billing/Upgrade';
import { setTeacher, useTeacher } from '../auth/session';
import { TIERS } from '../config';
import { data } from '../data';
import { useAsync, usePlan, useTier } from '../data/hooks';
import { useBetaSteps, useBetaTester } from '../beta/tester';
import { t } from '../i18n';
import { Button, buttonClasses, PageHeader, Panel, Tabs } from '../ui/kit';
import { BetaTab } from './BetaChecklist';
import TeacherNav from '../ui/TeacherNav';
import AccessCode, { PlanUntil } from './AccessCode';

// The teacher's account: plan, downloading everything, deleting
// everything, and what happens on a smaller plan (nothing is deleted).
export default function AccountPage() {
  const teacher = useTeacher();
  const tier = useTier();
  // During the Plus trial the plan cards and access code follow the saved plan.
  const plan = usePlan();
  const real = plan?.real ?? tier;
  const inTrial = !!plan?.trial?.active && real === 'free';
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState('');
  const [upgraded, setUpgraded] = useState<string | null>(null);
  // Beta testers get a Beta tester tab with their full checklist (owner, 2026-11-24).
  const betaTester = useBetaTester();
  const { value: beta } = useBetaSteps(betaTester);
  const [tab, setTab] = useState<'account' | 'beta'>('account');
  // What the class already gets from Gamify, so the plan talk starts from
  // value (teacher rule: lead with value, never the price).
  const { value: used } = useAsync(async () => {
    const classes = await data.listClassrooms();
    const students = (await Promise.all(classes.map((c) => data.listStudents(c.id)))).flat();
    return { answers: (await data.listQuestionLog()).length, students: students.length, sets: (await data.listQuestionSets()).length };
  });

  // The You card (approved /brand Account): only what Gamify really holds.
  const { value: you } = useAsync(async () => {
    const pin = await data.getSetting<string>(PIN_KEY);
    let email: string | undefined;
    try { email = supabase ? (await supabase.auth.getUser()).data.user?.email ?? undefined : undefined; } catch { email = undefined; }
    return { pin: !!pin, email };
  });
  const [billing, setBilling] = useState(false);

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

  // Two columns (approved /brand Account, batch 6, 2026-11-24): value and the
  // plan first on the left; download, delete (typed DELETE, a deliberate speed
  // bump) and log out on the right.
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24">
      <TeacherNav />
      <PageHeader title={t('account.title')} subtitle={teacher?.name} />
      {beta && <Tabs label={t('account.title')} value={tab} onChange={setTab} options={[{ id: 'account', label: t('account.tab.account') }, { id: 'beta', label: t('account.tab.beta') }]} />}
      {beta && tab === 'beta' ? <BetaTab s={beta} /> : (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] items-start">
        <div className="grid gap-4 min-w-0">
          <Panel className="grid gap-3">
            <h2 className="font-heading font-bold text-xl">{t('account.you')}</h2>
            <dl className="m-0 grid gap-4 sm:grid-cols-2">
              <YouField label={t('account.you.name')} value={teacher?.name ?? ''} />
              {you?.email && <YouField label={t('account.you.email')} value={you.email} />}
              <YouField label={t('account.you.username')} value={teacher?.username ?? teacher?.name ?? ''} hint={t('account.you.usernameHint')} />
              <YouField label={t('account.you.pin')} value={you ? (you.pin ? '\u2022\u2022\u2022\u2022' : t('account.you.pinNone')) : ''} hint={t('account.you.pinHint')} />
            </dl>
          </Panel>
          <Panel className="grid gap-2">
            <h2 className="font-heading font-bold text-xl">{inTrial ? t('account.planTrial') : t('account.plan', { plan: t(`pricing.${tier}`) })}</h2>
            <p className="font-semibold">{(!TIERS[tier].hasClasses ? t('account.limitsFree', { students: String(TIERS[tier].studentsPerClassroom), sets: String(TIERS[tier].savedQuestionSets) }) : t('account.limits', { classes: String(TIERS[tier].classrooms), sets: String(TIERS[tier].savedQuestionSets) })).replace(/Infinity/g, t('pricing.unlimited'))}</p>
            <p className="font-bold text-lg">{used && used.answers > 0 ? t('account.value', { answers: used.answers, students: used.students, sets: used.sets }) : t('account.valueNew')}</p>
            <PlanUntil />
            <p className="text-sm font-bold text-muted">{t('account.downgrade')}</p>
            <div className="flex flex-wrap gap-2 mt-1">
              <Link to="/pricing" className={buttonClasses('main')}>{t('account.seePlans')}</Link>
              <Button aria-expanded={billing} onClick={() => setBilling(!billing)}><Receipt weight="bold" size={18} />{t('account.billing')}</Button>
            </div>
            {billing && <p className="font-semibold text-sm rounded-input bg-butter p-3" role="status">{t('account.billingSoon')}</p>}
            {upgraded ? <p className="font-bold text-lg" role="status">{t('upgrade.done', { plan: upgraded })} {t('upgrade.doneText')}</p> : real === 'pro' ? (
              <p className="font-bold flex items-center gap-2"><Crown weight="fill" size={22} aria-hidden="true" />{t('account.topPlan')}</p>
            ) : (
              <>
                <p className="font-heading font-bold text-lg mt-2">{real === 'plus' ? t('account.moreFromPro') : t('account.moreFrom')}</p>
                <PlanCards suggest={real === 'plus' ? 'pro' : 'plus'} onDone={(p) => setUpgraded(t(`pricing.${p}`))} />
              </>
            )}
          </Panel>
          {real === 'free' && <AccessCode />}
        </div>
        <div className="grid gap-4">
          <Panel className="grid gap-2">
            <h2 className="font-heading font-bold text-lg">{t('account.exportTitle')}</h2>
            <p className="font-semibold text-sm">{t('account.exportText')}</p>
            <Button className="justify-self-start" onClick={() => void exportAll()}><DownloadSimple weight="bold" size={18} />{t('account.export')}</Button>
          </Panel>
          <Panel className="grid gap-2 !bg-blush">
            <h2 className="font-heading font-bold text-lg">{t('account.deleteTitle')}</h2>
            <p className="font-semibold text-sm">{t('account.deleteText')}</p>
            <label className="grid gap-1 font-bold text-sm">{t('account.typeDelete')}
              <input value={confirm} onChange={(e) => setConfirm(e.target.value)} className="min-h-11 px-3 rounded-input border-std border-border bg-surface font-bold" />
            </label>
            <Button variant="danger" className="justify-self-start" disabled={confirm !== 'DELETE'} onClick={() => void deleteAll()}><Trash weight="bold" size={18} />{t('account.delete')}</Button>
          </Panel>
          <Panel className="grid gap-2">
            <h2 className="font-heading font-bold text-lg">{t('account.logoutTitle')}</h2>
            <Button onClick={() => { setTeacher(null); navigate('/'); }}><SignOut weight="bold" size={18} />{t('account.logout')}</Button>
          </Panel>
        </div>
      </div>
      )}
    </main>
  );
}

function YouField({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="grid gap-1 content-start">
      <dt className="text-sm font-bold text-muted">{label}</dt>
      <dd className="m-0 min-h-11 px-3 rounded-input border-std border-border-soft bg-surface-2 font-bold flex items-center break-all">{value}</dd>
      {hint && <dd className="m-0 text-xs font-semibold text-muted">{hint}</dd>}
    </div>
  );
}
