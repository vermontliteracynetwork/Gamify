import DashEmpty from './DashEmpty';
import { CloudSlash, HourglassMedium, Ticket } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { Eye, X } from '@phosphor-icons/react';
import { PRICES_USD_PER_YEAR, TIERS, type Tier } from '../config';
import { previewTier, setPreviewTier } from '../data';
import { supabase } from '../data/supabase';
import { t } from '../i18n';
import { Button, fieldClasses } from '../ui/kit';

// Developer dashboard cards (teacher, 2026-10-25: "subscriptions, growth
// chart, bookkeeping table and PDF, plan preview").

export interface OwnerStats {
  tiers: Partial<Record<Tier | 'school', number>>;
  teachers: number; classes: number; students: number; sets: number; answers: number; codes: number;
  signups: { week: string; n: number }[];
  answersByWeek: { week: string; n: number }[];
}

// Real counts from the cloud (0010_owner_dashboard.sql), owner account only.
export function useOwnerStats(): { stats: OwnerStats | null; problem: string } {
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [problem, setProblem] = useState('');
  useEffect(() => {
    if (!supabase) { setProblem(t('owner.statsNoCloud')); return; }
    void (async () => {
      if (!(await supabase.auth.getSession()).data.session) { setProblem(t('owner.statsSignIn')); return; }
      const { data: d, error } = await supabase.rpc('owner_stats');
      if (error) setProblem(t('owner.statsSetup'));
      else setStats(d as OwnerStats);
    })();
  }, []);
  return { stats, problem };
}

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
const PAID: Exclude<Tier, 'free'>[] = ['homeschool', 'plus', 'pro'];

export function SubsCard({ stats, problem }: { stats: OwnerStats | null; problem: string }) {
  if (!stats) return <DashEmpty text={problem || t('owner.loading')} icon={problem ? CloudSlash : HourglassMedium} />;
  const yearly = PAID.reduce((n, k) => n + (stats.tiers[k] ?? 0) * PRICES_USD_PER_YEAR[k], 0);
  const tiles: [string, number | string][] = [
    [t('owner.plan.free'), stats.tiers.free ?? 0], [t('owner.plan.homeschool'), stats.tiers.homeschool ?? 0],
    [t('owner.plan.plus'), stats.tiers.plus ?? 0], [t('owner.plan.pro'), stats.tiers.pro ?? 0],
    [t('owner.yearlyValue'), money(yearly)], [t('owner.monthlyValue'), money(yearly / 12)],
  ];
  const more: [string, number][] = [[t('owner.teacherCount'), stats.teachers], [t('owner.classes'), stats.classes], [t('owner.students'), stats.students], [t('owner.sets'), stats.sets], [t('owner.answers'), stats.answers], [t('owner.codes'), stats.codes]];
  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {tiles.map(([l, v]) => <Tile key={l} label={l} value={v} />)}
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {more.map(([l, v]) => <Tile key={l} label={l} value={v} small />)}
      </div>
      <p className="text-xs font-bold text-muted">{t('owner.subsNote')}</p>
    </div>
  );
}

function Tile({ label, value, small = false }: { label: string; value: number | string; small?: boolean }) {
  return <div className="rounded-input border-std border-border-soft p-2"><p className="text-xs font-bold uppercase text-muted">{label}</p><p className={`font-display tabular-nums ${small ? 'text-xl' : 'text-2xl'}`}>{typeof value === 'number' ? value.toLocaleString() : value}</p></div>;
}

// Two weekly bar charts: new teachers and answers, last 26 weeks.
// See Gamify as a teacher on another plan, in this tab only.
export function PlanPreviewCard() {
  const [now, setNow] = useState(previewTier());
  const pick = (tier: Tier | null) => { setPreviewTier(tier); setNow(tier); };
  return (
    <div className="grid gap-2">
      <p className="font-semibold">{t('owner.previewHint')}</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('owner.preview')}>
        {(Object.keys(TIERS) as Tier[]).map((k) => (
          <button key={k} type="button" role="radio" aria-checked={now === k} onClick={() => pick(k)}
            className={`min-h-11 px-4 rounded-pill border-std font-bold ${now === k ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}>{t(`owner.plan.${k}` as 'owner.plan.free')}</button>
        ))}
        {now && <Button onClick={() => pick(null)}><X weight="bold" size={18} />{t('owner.previewStop')}</Button>}
      </div>
    </div>
  );
}

// A strip at the top of every page while a plan preview is on.
export function PreviewBanner() {
  const [now, setNow] = useState(previewTier());
  useEffect(() => { const f = () => setNow(previewTier()); window.addEventListener('gamify-tier', f); return () => window.removeEventListener('gamify-tier', f); }, []);
  if (!now) return null;
  return (
    <div className="no-print sticky top-0 z-[70] flex flex-wrap items-center justify-center gap-3 bg-accent border-b-[2.5px] border-border px-4 py-1.5 font-bold text-sm" role="status">
      <Eye weight="bold" size={18} aria-hidden="true" />{t('owner.previewing', { plan: t(`owner.plan.${now}` as 'owner.plan.free') })}
      <button type="button" onClick={() => setPreviewTier(null)} className="min-h-9 px-3 rounded-pill border-std border-border bg-surface font-bold">{t('owner.previewStop')}</button>
    </div>
  );
}

// Access codes and beta plans (0011_access_codes.sql): make a code like the
// Vermont Literacy Network one, and give any teacher a plan by username.
interface AccessCodeRow { code: string; tier: string; months: number; max_uses: number; uses: number; beta: boolean; note: string | null }
interface GrantRow { username: string | null; tier: string; plan_until: string | null; plan_note: string | null }
export function AccessCard() {
  const [codes, setCodes] = useState<AccessCodeRow[]>([]);
  const [grants, setGrants] = useState<GrantRow[]>([]);
  const [problem, setProblem] = useState('');
  const [msg, setMsg] = useState('');
  const [code, setCode] = useState({ code: 'VLNPLUS', tier: 'plus', months: 3, max_uses: 200, beta: true, note: 'Vermont Literacy Network list' });
  const [grant, setGrant] = useState({ username: '', tier: 'plus', months: 0, note: 'beta' });
  async function load() {
    if (!supabase) { setProblem(t('owner.statsNoCloud')); return; }
    if (!(await supabase.auth.getSession()).data.session) { setProblem(t('owner.statsSignIn')); return; }
    const a = await supabase.from('access_codes').select('*').order('created_at', { ascending: false });
    const b = await supabase.rpc('owner_grants');
    if (a.error || b.error) { setProblem(t('owner.access.setup')); return; }
    setProblem(''); setCodes(a.data as AccessCodeRow[]); setGrants(b.data as GrantRow[]);
  }
  useEffect(() => { void load(); }, []);
  async function makeCode() {
    const { error } = await supabase!.from('access_codes').upsert({ ...code, code: code.code.toUpperCase() });
    setMsg(error ? t('owner.access.codeBad') : t('owner.access.codeMade', { code: code.code.toUpperCase() }));
    void load();
  }
  async function give() {
    const { data: r, error } = await supabase!.rpc('owner_grant', { u: grant.username, t: grant.tier, months: grant.months, note: grant.note || 'beta' });
    setMsg(error ? t('owner.access.codeBad') : (r as { found: boolean }).found ? t('owner.access.given', { name: grant.username }) : t('owner.access.noUser', { name: grant.username }));
    void load();
  }
  const field = fieldClasses('md');
  const plans = ['plus', 'pro', 'homeschool'] as const;
  if (problem) return <DashEmpty text={problem} icon={Ticket} />;
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <p className="font-bold">{t('owner.access.makeTitle')}</p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1 text-sm font-bold">{t('code.label')}<input value={code.code} maxLength={20} onChange={(e) => setCode({ ...code, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })} className={`${field} w-36 tracking-wider`} /></label>
          <label className="grid gap-1 text-sm font-bold">{t('owner.access.plan')}<select value={code.tier} onChange={(e) => setCode({ ...code, tier: e.target.value })} className={field}>{plans.map((p) => <option key={p} value={p}>{t(`owner.plan.${p}`)}</option>)}</select></label>
          <label className="grid gap-1 text-sm font-bold">{t('owner.access.months')}<input type="number" min={1} max={24} value={code.months} onChange={(e) => setCode({ ...code, months: Number(e.target.value) })} className={`${field} w-20`} /></label>
          <label className="grid gap-1 text-sm font-bold">{t('owner.access.uses')}<input type="number" min={1} max={100000} value={code.max_uses} onChange={(e) => setCode({ ...code, max_uses: Number(e.target.value) })} className={`${field} w-24`} /></label>
          <label className="inline-flex items-center gap-2 text-sm font-bold min-h-11"><input type="checkbox" className="w-5 h-5" checked={code.beta} onChange={(e) => setCode({ ...code, beta: e.target.checked })} />{t('owner.access.beta')}</label>
          <Button variant="primary" disabled={code.code.length < 4} onClick={() => void makeCode()}>{t('owner.access.make')}</Button>
        </div>
        {codes.length > 0 && (
          <ul className="grid gap-1 list-none p-0 m-0">{codes.map((c) => <li key={c.code} className="text-sm font-semibold rounded-input bg-surface-2 p-2"><span className="font-bold tracking-wider">{c.code}</span> · {t(`owner.plan.${c.tier}` as 'owner.plan.plus')} · {t('owner.access.row', { months: c.months, uses: c.uses, max: c.max_uses })}{c.beta ? ` · ${t('owner.access.beta')}` : ''}</li>)}</ul>
        )}
      </div>
      <div className="grid gap-2">
        <p className="font-bold">{t('owner.access.giveTitle')}</p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1 text-sm font-bold">{t('owner.access.username')}<input value={grant.username} onChange={(e) => setGrant({ ...grant, username: e.target.value.toLowerCase() })} className={`${field} w-44`} /></label>
          <label className="grid gap-1 text-sm font-bold">{t('owner.access.plan')}<select value={grant.tier} onChange={(e) => setGrant({ ...grant, tier: e.target.value })} className={field}>{[...plans, 'free' as const].map((p) => <option key={p} value={p}>{t(`owner.plan.${p}`)}</option>)}</select></label>
          <label className="grid gap-1 text-sm font-bold">{t('owner.access.monthsOrForever')}<input type="number" min={0} max={60} value={grant.months} onChange={(e) => setGrant({ ...grant, months: Number(e.target.value) })} className={`${field} w-24`} /></label>
          <Button variant="primary" disabled={!grant.username.trim()} onClick={() => void give()}>{t('owner.access.give')}</Button>
        </div>
        {grants.length > 0 && (
          <ul className="grid gap-1 list-none p-0 m-0">{grants.map((g, i) => <li key={`${g.username}-${i}`} className="text-sm font-semibold rounded-input bg-surface-2 p-2"><span className="font-bold">{g.username ?? '?'}</span> · {t(`owner.plan.${g.tier}` as 'owner.plan.plus')} · {g.plan_until ? t('owner.access.until', { date: new Date(g.plan_until).toLocaleDateString() }) : t('owner.access.forever')} · {g.plan_note}</li>)}</ul>
        )}
      </div>
      {msg && <p className="font-bold" role="status">{msg}</p>}
      <p className="text-xs font-bold text-muted">{t('owner.access.note')}</p>
    </div>
  );
}
