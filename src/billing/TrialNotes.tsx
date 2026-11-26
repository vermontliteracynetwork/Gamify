import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, Sparkle, X } from '@phosphor-icons/react';
import { isFreeGame, TIERS } from '../config';
import { data } from '../data';
import { useAsync, usePlan } from '../data/hooks';
import { GAMES } from '../games/registry';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { Button, buttonClasses } from '../ui/kit';
import Dialog from '../ui/Dialog';
import { openUpgrade } from './Upgrade';
import { gameSince, trialReminder, TRIAL_SEEN, WELCOME_SEEN, type TrialState } from './trial';

// The 7-day Plus trial on her teacher pages (owner, 2026-11-26): a quiet
// banner with the days left and what she keeps and loses, a fuller reminder
// once at 3 days and once at 1 day left (in-app only), and on day 8 one card:
// what Free leaves out, Get Plus or Stay on Free. Never on a student page, a
// live game or a screen the class can see (Design Chair, 2026-11-26: not on
// Create an Activity, a live host, a check-in or a print view), and the day-8
// card opens by itself only on Home and Account.

// Teacher pages the class can see: the code on Create an Activity, the live
// host, the class check-in, a printed report.
export const classCanSee = (path: string) =>
  path.startsWith('/teacher/activity') || path.startsWith('/teacher/live') || path.endsWith('/check-in') || path.startsWith('/teacher/reports/print');
const endCardHere = (path: string) => path === '/teacher' || path === '/teacher/' || path.startsWith('/teacher/account');
const onHome = (path: string) => path === '/teacher' || path === '/teacher/';

// The games Free leaves out (owner, 2026-11-26: Free plays every game but the
// few made for paid plans), named from PAID_ONLY_GAMES in config.
export function lockedOnFree(): string {
  const names = GAMES.filter((g) => !isFreeGame(g.id)).map((g) => g.name);
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names.join('');
}

// Phones fold the banner into a chip in the menu once she has seen it in
// full (Design Chair, 2026-11-26); Home and reminder days keep the banner.
const BANNER_SEEN = 'trial-banner-seen';
const OPEN_EVENT = 'gamify-trial-open';

function useTrialNotes() {
  const plan = usePlan();
  const { value: seen, reload } = useAsync(async () => {
    const keys = [WELCOME_SEEN, TRIAL_SEEN.remind3, TRIAL_SEEN.remind1, TRIAL_SEEN.ended, BANNER_SEEN];
    const vals = await Promise.all(keys.map((k) => data.getSetting<boolean>(k)));
    return Object.fromEntries(keys.map((k, i) => [k, !!vals[i]])) as Record<string, boolean>;
  });
  const trial: TrialState | null = plan?.real === 'free' ? plan.trial : null;
  const due = trialReminder(trial);
  const dueKey = due === 1 ? TRIAL_SEEN.remind1 : due === 3 ? TRIAL_SEEN.remind3 : null;
  const reminding = !!seen && !!dueKey && !seen[dueKey];
  return { trial, seen, reload, due, dueKey, reminding };
}

// The small "Plus: N days" chip in the phone menu, shown when the banner folds.
export function TrialChip() {
  const path = useLocation().pathname;
  const { trial, seen, reminding } = useTrialNotes();
  const [unfolded, setUnfolded] = useState(false);
  useEffect(() => { setUnfolded(false); }, [path]);
  if (!trial?.active || !seen || !seen[BANNER_SEEN] || reminding || onHome(path) || classCanSee(path) || unfolded) return null;
  return (
    <button type="button" data-trial-chip onClick={() => { setUnfolded(true); window.dispatchEvent(new Event(OPEN_EVENT)); }}
      className="sm:hidden min-h-8 px-3 rounded-pill font-bold text-xs inline-flex flex-1 justify-center whitespace-nowrap items-center gap-1.5 border-std border-border bg-grape text-white">
      <Sparkle weight="fill" size={14} aria-hidden="true" />{t('trial.chip', { count: trial.daysLeft })}
    </button>
  );
}

export default function TrialNotes() {
  const navigate = useNavigate();
  const path = useLocation().pathname;
  const { trial, seen, reload, due, dueKey, reminding } = useTrialNotes();
  const sent = useRef(false);
  // Made the account but never saw the welcome (the confirm-your-email link
  // signs her in on another page): show it once.
  useEffect(() => {
    if (trial?.active && seen && !seen[WELCOME_SEEN] && !sent.current && !classCanSee(path)) { sent.current = true; navigate('/teacher/welcome'); }
  }, [trial, seen, navigate, path]);
  const [open, setOpen] = useState(false);
  const [unfolded, setUnfolded] = useState(false);
  useEffect(() => { setUnfolded(false); }, [path]);
  useEffect(() => {
    const on = () => { setUnfolded(true); setOpen(true); };
    window.addEventListener(OPEN_EVENT, on);
    return () => window.removeEventListener(OPEN_EVENT, on);
  }, []);
  const fold = !!seen?.[BANNER_SEEN] && !reminding && !onHome(path) && !unfolded;
  const showsFull = !!trial?.active && !!seen && !classCanSee(path) && !fold;
  // Seen in full once: later pages fold it on phones. No reload, so the
  // banner she is looking at stays put.
  useEffect(() => { if (showsFull && seen && !seen[BANNER_SEEN]) void data.setSetting(BANNER_SEEN, true); }, [showsFull, seen]);
  if (!trial || !seen || classCanSee(path)) return null;

  const mark = async (key: string) => { await data.setSetting(key, true); reload(); };
  const free = TIERS.free;
  const games = lockedOnFree();
  const lose = t('trial.lose', { games, students: free.studentsPerClassroom, sets: free.savedQuestionSets, days: free.reportHistoryDays });

  if (!trial.active) {
    if (seen[TRIAL_SEEN.ended] || gameSince() != null || !endCardHere(path)) return null;
    const close = () => void mark(TRIAL_SEEN.ended);
    return (
      <Dialog title={t('trial.endTitle')} sub={t('trial.endSub')} onClose={close} closeLabel={t('upgrade.close')}>
        <div className="grid gap-3">
          <p className="font-heading font-bold m-0">{t('trial.endLose')}</p>
          <ul className="grid gap-1.5 list-none p-0 m-0">
            {[1, 2, 3, 4, 5].map((n) => (
              <li key={n} className="flex gap-2 font-semibold"><X weight="bold" size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
                {t(`trial.endLose.${n}` as StringKey, { games, students: free.studentsPerClassroom, sets: free.savedQuestionSets, days: free.reportHistoryDays })}</li>
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

  const expanded = reminding || open;
  return (
    <section aria-label={t('trial.banner', { count: trial.daysLeft })} role={reminding ? 'status' : undefined} data-trial-banner
      className={`no-print mb-3 rounded-card border-std border-border px-3 py-2 gap-2 ${fold ? 'hidden sm:grid' : 'grid'} ${reminding ? 'bg-butter' : 'bg-surface'} shadow-[inset_0.3rem_0_0_var(--color-grape)]`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="w-8 h-8 rounded-full bg-grape text-white grid place-items-center shrink-0"><Sparkle weight="fill" size={16} aria-hidden="true" /></span>
        <p className="m-0 font-bold">{reminding ? t(due === 1 ? 'trial.remind1' : 'trial.remind3', { count: trial.daysLeft }) : t('trial.banner', { count: trial.daysLeft })}</p>
        <p className="m-0 font-semibold text-sm text-muted flex-1 min-w-48">{t('trial.keep')}</p>
        {!reminding && <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="min-h-9 px-2 rounded-input font-bold text-sm underline underline-offset-4 hover:bg-surface-2">{t('trial.details')}</button>}
        <span className="grid gap-0.5 justify-items-center">
          <button type="button" onClick={() => openUpgrade('plus')} className={buttonClasses('main', '', 'sm')}>{t('welcome.getPlus')}</button>
          <span className="text-xs font-semibold text-muted text-center">{t('welcome.billingNote')}</span>
        </span>
        {reminding && <button type="button" onClick={() => void mark(dueKey!)} className={buttonClasses('secondary', '', 'sm')}>{t('trial.gotIt')}</button>}
      </div>
      {expanded && <p className="m-0 font-semibold text-sm">{lose}</p>}
    </section>
  );
}
