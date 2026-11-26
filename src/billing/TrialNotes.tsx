import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkle, X } from '@phosphor-icons/react';
import { TIERS } from '../config';
import { data } from '../data';
import { useAsync, usePlan } from '../data/hooks';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { Button, buttonClasses } from '../ui/kit';
import Dialog from '../ui/Dialog';
import { openUpgrade } from './Upgrade';
import { gameSince, trialReminder, TRIAL_SEEN, WELCOME_SEEN } from './trial';

// The 7-day Plus trial on her teacher pages (owner, 2026-11-26): a quiet
// banner with the days left and what she keeps and loses, a fuller reminder
// once at 3 days and once at 1 day left (in-app only), and on day 8 one card:
// what Free leaves out, Get Plus or Stay on Free. Never on a student page, a
// live game or a projected screen (TeacherNav is not on those).
export default function TrialNotes() {
  const plan = usePlan();
  const navigate = useNavigate();
  const { value: seen, reload } = useAsync(async () => {
    const keys = [WELCOME_SEEN, TRIAL_SEEN.remind3, TRIAL_SEEN.remind1, TRIAL_SEEN.ended];
    const vals = await Promise.all(keys.map((k) => data.getSetting<boolean>(k)));
    return Object.fromEntries(keys.map((k, i) => [k, !!vals[i]])) as Record<string, boolean>;
  });
  const trial = plan?.real === 'free' ? plan.trial : null;
  const sent = useRef(false);
  // Made the account but never saw the welcome (the confirm-your-email link
  // signs her in on another page): show it once.
  useEffect(() => {
    if (trial?.active && seen && !seen[WELCOME_SEEN] && !sent.current) { sent.current = true; navigate('/teacher/welcome'); }
  }, [trial, seen, navigate]);
  const [open, setOpen] = useState(false);
  if (!trial || !seen) return null;

  const mark = async (key: string) => { await data.setSetting(key, true); reload(); };
  const free = TIERS.free;
  const lose = t('trial.lose', { students: free.studentsPerClassroom, sets: free.savedQuestionSets, days: free.reportHistoryDays });

  if (!trial.active) {
    if (seen[TRIAL_SEEN.ended] || gameSince() != null) return null;
    const close = () => void mark(TRIAL_SEEN.ended);
    return (
      <Dialog title={t('trial.endTitle')} sub={t('trial.endSub')} onClose={close} closeLabel={t('upgrade.close')}>
        <div className="grid gap-3">
          <p className="font-heading font-bold m-0">{t('trial.endLose')}</p>
          <ul className="grid gap-1.5 list-none p-0 m-0">
            {[1, 2, 3, 4, 5].map((n) => (
              <li key={n} className="flex gap-2 font-semibold"><X weight="bold" size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
                {t(`trial.endLose.${n}` as StringKey, { students: free.studentsPerClassroom, sets: free.savedQuestionSets, days: free.reportHistoryDays })}</li>
            ))}
          </ul>
          <p className="font-semibold m-0 flex gap-2"><Check weight="bold" size={18} className="shrink-0 mt-0.5" aria-hidden="true" />{t('trial.keep')}</p>
          <div className="grid sm:grid-cols-2 gap-2">
            <Button variant="main" size="lg" onClick={() => { close(); openUpgrade('plus'); }}>{t('trial.endGet')}</Button>
            <Button size="lg" onClick={close}>{t('trial.endStay')}</Button>
          </div>
        </div>
      </Dialog>
    );
  }

  const due = trialReminder(trial);
  const dueKey = due === 1 ? TRIAL_SEEN.remind1 : due === 3 ? TRIAL_SEEN.remind3 : null;
  const reminding = !!dueKey && !seen[dueKey];
  const expanded = reminding || open;
  return (
    <section aria-label={t('trial.banner', { count: trial.daysLeft })} role={reminding ? 'status' : undefined}
      className={`no-print mb-3 rounded-card border-std border-border px-3 py-2 grid gap-2 ${reminding ? 'bg-butter' : 'bg-surface'} shadow-[inset_0.3rem_0_0_var(--color-grape)]`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="w-8 h-8 rounded-full bg-grape text-white grid place-items-center shrink-0"><Sparkle weight="fill" size={16} aria-hidden="true" /></span>
        <p className="m-0 font-bold">{reminding ? t(due === 1 ? 'trial.remind1' : 'trial.remind3') : t('trial.banner', { count: trial.daysLeft })}</p>
        <p className="m-0 font-semibold text-sm text-muted flex-1 min-w-48">{t('trial.keep')}</p>
        {!reminding && <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="min-h-9 px-2 rounded-input font-bold text-sm underline underline-offset-4 hover:bg-surface-2">{t('trial.details')}</button>}
        <button type="button" onClick={() => openUpgrade('plus')} className={buttonClasses('main', '', 'sm')}>{t('welcome.getPlus')}</button>
        {reminding && <button type="button" onClick={() => void mark(dueKey!)} className={buttonClasses('secondary', '', 'sm')}>{t('trial.gotIt')}</button>}
      </div>
      {expanded && <p className="m-0 font-semibold text-sm">{lose}</p>}
    </section>
  );
}
