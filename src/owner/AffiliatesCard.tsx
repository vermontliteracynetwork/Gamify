import { useEffect, useMemo, useState } from 'react';
import { Copy, Plus, Trash } from '@phosphor-icons/react';
import { data, newId } from '../data';
import { supabase } from '../data/supabase';
import { PRICES_USD_PER_YEAR } from '../config';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { Button, fieldClasses } from '../ui/kit';
import { AFFILIATE, cleanCode, validCode } from '../affiliate/program';
import type { LedgerRow } from './books/model';

// The owner's Affiliates page (/owner?s=affiliates; owner, 2026-11-25).
// The roster and payouts are saved with her settings; sign-ups and paid
// plans per code come from the owner_referrals function (0015). Commission
// here is an estimate from plan prices until Stripe sends real payments.
export interface Affiliate {
  id: string; name: string; email: string; platform: string; handle: string; code: string;
  status: 'applied' | 'approved' | 'paused' | 'ended'; joined: string; w9: boolean; agreement: boolean; notes: string;
}
interface Payout { id: string; affiliate: string; date: string; amount: number; method: string }
interface CodeStats { code: string; signups: number; paid: number; tiers: Record<string, number> | null; first: string; last: string }

const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const today = () => new Date().toLocaleDateString('en-CA');
const blank = (): Omit<Affiliate, 'id'> => ({ name: '', email: '', platform: 'TikTok', handle: '', code: '', status: 'approved', joined: today(), w9: false, agreement: false, notes: '' });

// Yearly value of each paid plan a referred teacher is on, times the rate.
export function estimate(tiers: Record<string, number> | null): number {
  if (!tiers) return 0;
  const year = (k: 'plus' | 'pro' | 'homeschool') => (tiers[k] ?? 0) * PRICES_USD_PER_YEAR[k];
  return Math.round((year('plus') + year('pro') + year('homeschool')) * AFFILIATE.rate * 100) / 100;
}

function useSaved<T>(key: string, empty: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(empty);
  useEffect(() => { void data.getSetting<T>(key).then((x) => { if (x != null) setV(x); }); }, [key]);
  return [v, (next: T) => { setV(next); void data.setSetting(key, next); }];
}

export default function AffiliatesCard() {
  const [list, saveList] = useSaved<Affiliate[]>('owner-affiliates', []);
  const [payouts, savePayouts] = useSaved<Payout[]>('owner-affiliate-payouts', []);
  const [ledger, saveLedger] = useSaved<LedgerRow[]>('owner-ledger', []);
  const [stats, setStats] = useState<CodeStats[] | null>(null);
  const [problem, setProblem] = useState('');
  const [draft, setDraft] = useState(blank());
  const [pay, setPay] = useState<{ affiliate: string; amount: number; method: string }>({ affiliate: '', amount: 0, method: 'PayPal' });
  const [copied, setCopied] = useState('');
  const field = fieldClasses('md');

  useEffect(() => {
    if (!supabase) { setProblem(t('aff.noCloud')); return; }
    void (async () => {
      if (!(await supabase.auth.getSession()).data.session) { setProblem(t('owner.statsSignIn')); return; }
      const { data: d, error } = await supabase.rpc('owner_referrals');
      if (error) setProblem(t('aff.setup')); else setStats(d as CodeStats[]);
    })();
  }, []);

  const byCode = useMemo(() => new Map((stats ?? []).map((s) => [s.code, s])), [stats]);
  const paidTo = (id: string) => payouts.filter((p) => p.affiliate === id).reduce((n, p) => n + p.amount, 0);
  const code = cleanCode(draft.code || draft.handle);
  const taken = list.some((a) => a.code === code);
  const ok = draft.name.trim() && validCode(code) && !taken;
  const link = (c: string) => `${window.location.origin}/a/${c}`;
  const unknown = (stats ?? []).filter((s) => !list.some((a) => a.code === s.code));

  function add() {
    if (!ok) return;
    saveList([...list, { ...draft, name: draft.name.trim(), handle: draft.handle.trim(), code, id: newId('aff') }]);
    setDraft(blank());
  }
  const update = (a: Affiliate, patch: Partial<Affiliate>) => saveList(list.map((x) => (x.id === a.id ? { ...x, ...patch } : x)));
  function recordPayout() {
    const a = list.find((x) => x.id === pay.affiliate);
    if (!a || !(pay.amount > 0)) return;
    const p = { id: newId('pay'), affiliate: a.id, date: today(), amount: Math.round(pay.amount * 100) / 100, method: pay.method };
    savePayouts([...payouts, p]);
    // The payout is a business cost: it goes straight into Books.
    saveLedger([...ledger, { id: `aff-${p.id}`, date: p.date, kind: 'out', category: 'Affiliate commissions', description: `Affiliate payout to ${a.name} (${a.code}) by ${p.method}`, amount: p.amount }]);
    setPay({ ...pay, amount: 0 });
  }
  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); setCopied(text); setTimeout(() => setCopied(''), 1500); } catch { /* no clipboard */ }
  }

  return (
    <div className="grid gap-6">
      <section className="dash-card" aria-labelledby="aff-terms">
        <h2 id="aff-terms" className="font-bold text-lg m-0">{t('aff.terms')}</h2>
        <p className="text-sm font-semibold m-0">{t('aff.termsLine', { rate: `${AFFILIATE.rate * 100}%`, months: AFFILIATE.months, school: `${AFFILIATE.schoolRate * 100}%`, days: AFFILIATE.windowDays, hold: AFFILIATE.holdDays, min: AFFILIATE.minimumPayout, offer: `${AFFILIATE.followerOffer * 100}%` })}</p>
        <p className="dash-sub m-0">{t('aff.termsNote')}</p>
        <a href="/affiliates" target="_blank" rel="noreferrer" className="dash-link justify-self-start">{t('aff.publicPage')}</a>
      </section>

      <section className="dash-card" aria-labelledby="aff-add">
        <h2 id="aff-add" className="font-bold text-lg m-0">{t('aff.add')}</h2>
        <div className="grid sm:grid-cols-3 gap-2 items-end">
          <label className="grid gap-1 text-sm font-bold">{t('beta.name')}<input value={draft.name} maxLength={80} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={field} /></label>
          <label className="grid gap-1 text-sm font-bold">{t('betaPage.email')}<input type="email" value={draft.email} maxLength={120} onChange={(e) => setDraft({ ...draft, email: e.target.value })} className={field} /></label>
          <label className="grid gap-1 text-sm font-bold">{t('affPage.platform')}
            <select value={draft.platform} onChange={(e) => setDraft({ ...draft, platform: e.target.value })} className={field}>{['TikTok', 'Instagram', 'YouTube', 'Facebook', 'Pinterest', 'Blog or newsletter'].map((p) => <option key={p}>{p}</option>)}</select>
          </label>
          <label className="grid gap-1 text-sm font-bold">{t('affPage.handle')}<input value={draft.handle} maxLength={80} onChange={(e) => setDraft({ ...draft, handle: e.target.value })} placeholder="@" className={field} /></label>
          <label className="grid gap-1 text-sm font-bold">{t('aff.code')}<input value={draft.code} maxLength={24} placeholder={cleanCode(draft.handle) || 'MSRIVERA'} onChange={(e) => setDraft({ ...draft, code: e.target.value })} className={field} /></label>
          <Button variant="primary" disabled={!ok} onClick={add}><Plus size={16} aria-hidden="true" />{t('aff.addButton')}</Button>
        </div>
        {taken && <p className="text-sm font-bold m-0" role="alert">{t('aff.taken', { code })}</p>}
        <p className="dash-sub m-0">{t('aff.addNote')}</p>
      </section>

      <section className="dash-card" aria-labelledby="aff-list">
        <div className="dash-card-head"><h2 id="aff-list" className="font-bold text-lg m-0">{t('aff.list', { n: list.length })}</h2></div>
        {problem && <p className="dash-sub m-0">{problem}</p>}
        {list.length === 0 ? <p className="dash-empty m-0">{t('aff.none')}</p> : (
          <ul className="grid gap-3 list-none p-0 m-0">
            {list.map((a) => {
              const s = byCode.get(a.code);
              const earned = estimate(s?.tiers ?? null);
              const owed = Math.max(0, earned - paidTo(a.id));
              return (
                <li key={a.id} className="rounded-input border-std border-border p-3 grid gap-2">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-bold">{a.name}</span>
                    <span className="text-sm font-semibold text-muted">{a.platform} {a.handle}</span>
                    <span className="dash-tag">{a.code}</span>
                    <select value={a.status} onChange={(e) => update(a, { status: e.target.value as Affiliate['status'] })} aria-label={t('aff.statusFor', { name: a.name })} className={fieldClasses('sm', 'ml-auto')}>
                      {(['applied', 'approved', 'paused', 'ended'] as const).map((x) => <option key={x} value={x}>{t(`aff.status.${x}` as StringKey)}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                    <p className="m-0"><span className="dash-tag block">{t('aff.signups')}</span><span className="font-bold tabular-nums">{s?.signups ?? 0}</span></p>
                    <p className="m-0"><span className="dash-tag block">{t('aff.paid')}</span><span className="font-bold tabular-nums">{s?.paid ?? 0}</span></p>
                    <p className="m-0"><span className="dash-tag block">{t('aff.earned')}</span><span className="font-bold tabular-nums">{money(earned)}</span></p>
                    <p className="m-0"><span className="dash-tag block">{t('aff.owed')}</span><span className="font-bold tabular-nums">{money(owed)}</span></p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" onClick={() => void copy(link(a.code))}><Copy size={16} aria-hidden="true" />{copied === link(a.code) ? t('aff.copied') : t('aff.copyLink')}</Button>
                    <span className="text-xs font-semibold text-muted break-all">{link(a.code)}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm font-bold">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={a.agreement} onChange={(e) => update(a, { agreement: e.target.checked })} className="w-5 h-5" />{t('aff.agreement')}</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={a.w9} onChange={(e) => update(a, { w9: e.target.checked })} className="w-5 h-5" />{t('aff.w9')}</label>
                  </div>
                  {a.status === 'approved' && (!a.agreement || !a.w9) && <p className="text-sm font-semibold m-0">{t('aff.beforePay')}</p>}
                  <div className="flex gap-2 items-end">
                    <label className="grid gap-1 text-sm font-bold flex-1">{t('aff.notes')}<input value={a.notes} maxLength={300} onChange={(e) => update(a, { notes: e.target.value })} className={fieldClasses('sm')} /></label>
                    <button type="button" onClick={() => { if (window.confirm(t('aff.removeConfirm', { name: a.name }))) saveList(list.filter((x) => x.id !== a.id)); }} aria-label={t('owner.ledger.removeOne', { what: a.name })} className="w-9 h-9 inline-flex items-center justify-center rounded-full border-std border-border-soft"><Trash size={14} aria-hidden="true" /></button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {unknown.length > 0 && <p className="dash-sub m-0">{t('aff.unknown', { codes: unknown.map((u) => `${u.code} (${u.signups})`).join(', ') })}</p>}
      </section>

      <section className="dash-card" aria-labelledby="aff-pay">
        <h2 id="aff-pay" className="font-bold text-lg m-0">{t('aff.payouts')}</h2>
        <div className="grid sm:grid-cols-[1fr_auto_auto_auto] gap-2 items-end">
          <label className="grid gap-1 text-sm font-bold">{t('aff.who')}
            <select value={pay.affiliate} onChange={(e) => setPay({ ...pay, affiliate: e.target.value })} className={field}>
              <option value="">{t('aff.pick')}</option>
              {list.filter((a) => a.agreement && a.w9).map((a) => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-bold">{t('owner.ledger.amount')}<input type="number" min={0} step={0.01} value={pay.amount || ''} onChange={(e) => setPay({ ...pay, amount: Number(e.target.value) })} className={`${field} w-28`} /></label>
          <label className="grid gap-1 text-sm font-bold">{t('aff.method')}
            <select value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })} className={field}>{['PayPal', 'Bank transfer', 'Check', 'Stripe'].map((m) => <option key={m}>{m}</option>)}</select>
          </label>
          <Button variant="primary" disabled={!pay.affiliate || !(pay.amount > 0) || pay.amount < AFFILIATE.minimumPayout} onClick={recordPayout}>{t('aff.record')}</Button>
        </div>
        <p className="dash-sub m-0">{t('aff.payNote', { min: AFFILIATE.minimumPayout })}</p>
        {payouts.length > 0 && (
          <ul className="grid gap-1 list-none p-0 m-0">
            {[...payouts].reverse().map((p) => <li key={p.id} className="flex justify-between text-sm font-semibold"><span>{p.date} · {list.find((a) => a.id === p.affiliate)?.name ?? '?'} · {p.method}</span><span className="tabular-nums">{money(p.amount)}</span></li>)}
          </ul>
        )}
      </section>
    </div>
  );
}
