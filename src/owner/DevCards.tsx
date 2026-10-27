import { useEffect, useMemo, useState } from 'react';
import { Eye, FilePdf, FileCsv, Plus as PlusIcon, Trash, X } from '@phosphor-icons/react';
import { PRICES_USD_PER_YEAR, TIERS, type Tier } from '../config';
import { data, newId, previewTier, setPreviewTier } from '../data';
import { supabase } from '../data/supabase';
import { t } from '../i18n';
import { Button } from '../ui/kit';

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
  if (!stats) return <p className="font-semibold">{problem || t('owner.loading')}</p>;
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
  return <div className="rounded-input border-[2px] border-border-soft p-2"><p className="text-xs font-bold uppercase text-muted">{label}</p><p className={`font-display tabular-nums ${small ? 'text-xl' : 'text-2xl'}`}>{typeof value === 'number' ? value.toLocaleString() : value}</p></div>;
}

// Two weekly bar charts: new teachers and answers, last 26 weeks.
export function GrowthChartCard({ stats, problem }: { stats: OwnerStats | null; problem: string }) {
  if (!stats) return <p className="font-semibold">{problem || t('owner.loading')}</p>;
  return (
    <div className="grid gap-4">
      <WeekBars title={t('owner.chartSignups')} rows={stats.signups} color="#7f8fe0" />
      <WeekBars title={t('owner.chartAnswers')} rows={stats.answersByWeek} color="#3f9e6a" />
    </div>
  );
}

function weeksBack(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); // Monday, like date_trunc('week')
  for (let i = n - 1; i >= 0; i--) out.push(new Date(d.getTime() - i * 7 * 86400000).toISOString().slice(0, 10));
  return out;
}

function WeekBars({ title, rows, color }: { title: string; rows: { week: string; n: number }[]; color: string }) {
  const weeks = weeksBack(26);
  const byWeek = new Map(rows.map((r) => [r.week.slice(0, 10), r.n]));
  const values = weeks.map((w) => byWeek.get(w) ?? 0);
  const max = Math.max(1, ...values);
  const total = values.reduce((a, b) => a + b, 0);
  const W = 520, H = 120, bw = W / weeks.length;
  return (
    <figure className="grid gap-1 m-0">
      <figcaption className="flex items-baseline gap-2"><span className="font-bold">{title}</span><span className="text-sm font-semibold text-muted">{t('owner.chartTotal', { n: total })}</span></figcaption>
      <svg viewBox={`0 0 ${W} ${H + 18}`} className="w-full h-auto" role="img" aria-label={t('owner.chartLabel', { title, n: total, last: values.at(-1) ?? 0 })}>
        <line x1={0} x2={W} y1={H} y2={H} stroke="#000" strokeWidth={1.5} />
        {values.map((v, i) => (
          <g key={weeks[i]}>
            <rect x={i * bw + 2} y={H - (v / max) * (H - 14)} width={bw - 4} height={(v / max) * (H - 14)} fill={color} rx={2}>
              <title>{`${weeks[i]}: ${v}`}</title>
            </rect>
            {v > 0 && v === max && <text x={i * bw + bw / 2} y={H - (v / max) * (H - 14) - 3} textAnchor="middle" fontSize="11" fontWeight="bold">{v}</text>}
          </g>
        ))}
        {[0, 13, 25].map((i) => <text key={i} x={i * bw + bw / 2} y={H + 14} textAnchor="middle" fontSize="10" fill="#4a4f6a">{weeks[i].slice(5)}</text>)}
      </svg>
    </figure>
  );
}

// Bookkeeping: money in and out, saved with the owner's settings (the cloud
// when signed in). Download as CSV for an accountant, or a PDF (print).
export interface LedgerRow { id: string; date: string; kind: 'in' | 'out'; category: string; description: string; amount: number }
const CATEGORIES = ['Subscriptions', 'School invoices', 'Hosting', 'Domain and email', 'Software', 'Legal', 'Insurance', 'Marketing', 'Equipment', 'Other'];

export function LedgerCard() {
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [draft, setDraft] = useState<Omit<LedgerRow, 'id'>>({ date: new Date().toLocaleDateString('en-CA'), kind: 'out', category: 'Hosting', description: '', amount: 0 });
  useEffect(() => { void data.getSetting<LedgerRow[]>('owner-ledger').then((r) => setRows(r ?? [])); }, []);
  const save = (next: LedgerRow[]) => { setRows(next); void data.setSetting('owner-ledger', next); };
  const years = [...new Set([String(new Date().getFullYear()), ...rows.map((r) => r.date.slice(0, 4))])].sort().reverse();
  const shown = useMemo(() => rows.filter((r) => r.date.startsWith(year)).sort((a, b) => b.date.localeCompare(a.date)), [rows, year]);
  const sum = (k: 'in' | 'out') => shown.filter((r) => r.kind === k).reduce((n, r) => n + r.amount, 0);
  const byCat = CATEGORIES.map((c) => ({ c, in: shown.filter((r) => r.category === c && r.kind === 'in').reduce((n, r) => n + r.amount, 0), out: shown.filter((r) => r.category === c && r.kind === 'out').reduce((n, r) => n + r.amount, 0) })).filter((x) => x.in || x.out);
  const field = 'min-h-11 px-2 rounded-input border-[2px] border-border font-bold bg-surface';
  const cents = (n: number) => `$${n.toFixed(2)}`;

  function add() {
    if (!draft.description.trim() || !(draft.amount > 0)) return;
    save([...rows, { ...draft, description: draft.description.trim(), id: newId('led') }]);
    setDraft({ ...draft, description: '', amount: 0 });
  }
  function csv() {
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const lines = [['Date', 'In or out', 'Category', 'Description', 'Amount'].join(','), ...shown.map((r) => [r.date, r.kind === 'in' ? 'In' : 'Out', esc(r.category), esc(r.description), r.amount.toFixed(2)].join(','))];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
    a.download = `gamify-books-${year}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function pdf() {
    const w = window.open('', '_blank');
    if (!w) return;
    const rowsHtml = shown.map((r) => `<tr><td>${r.date}</td><td>${r.kind === 'in' ? 'In' : 'Out'}</td><td>${escapeHtml(r.category)}</td><td>${escapeHtml(r.description)}</td><td style="text-align:right">${r.kind === 'out' ? '-' : ''}${cents(r.amount)}</td></tr>`).join('');
    const catHtml = byCat.map((x) => `<tr><td>${escapeHtml(x.c)}</td><td style="text-align:right">${cents(x.in)}</td><td style="text-align:right">${cents(x.out)}</td></tr>`).join('');
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Gamify books ${year}</title><style>
      body{font-family:system-ui,sans-serif;margin:32px;color:#000}h1{margin:0 0 4px}p{margin:0 0 16px;color:#444}
      table{border-collapse:collapse;width:100%;margin-bottom:24px;font-size:13px}th,td{border:1px solid #999;padding:6px 8px;text-align:left}th{background:#eef0f7}
    </style></head><body><h1>Gamify books, ${year}</h1><p>Vermont Literacy Network LLC. Money in ${cents(sum('in'))}, money out ${cents(sum('out'))}, net ${cents(sum('in') - sum('out'))}.</p>
    <h2>By category</h2><table><tr><th>Category</th><th>In</th><th>Out</th></tr>${catHtml}</table>
    <h2>Every entry</h2><table><tr><th>Date</th><th>In or out</th><th>Category</th><th>Description</th><th>Amount</th></tr>${rowsHtml}</table>
    <script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  }

  return (
    <div className="grid gap-3">
      <div className="grid sm:grid-cols-[auto_auto_1fr] gap-2 items-end">
        <label className="grid gap-1 text-sm font-bold">{t('owner.ledger.date')}<input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className={field} /></label>
        <label className="grid gap-1 text-sm font-bold">{t('owner.ledger.kind')}
          <select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as 'in' | 'out' })} className={field}><option value="in">{t('owner.ledger.in')}</option><option value="out">{t('owner.ledger.out')}</option></select>
        </label>
        <label className="grid gap-1 text-sm font-bold">{t('owner.ledger.category')}
          <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className={field}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        </label>
        <label className="grid gap-1 text-sm font-bold sm:col-span-2">{t('owner.ledger.description')}<input value={draft.description} maxLength={120} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className={field} /></label>
        <div className="flex items-end gap-2">
          <label className="grid gap-1 text-sm font-bold flex-1">{t('owner.ledger.amount')}<input type="number" min={0} step={0.01} value={draft.amount || ''} onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })} className={field} /></label>
          <Button variant="primary" onClick={add} disabled={!draft.description.trim() || !(draft.amount > 0)}><PlusIcon weight="bold" size={18} />{t('owner.ledger.add')}</Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 font-bold text-sm">{t('owner.ledger.year')}
          <select value={year} onChange={(e) => setYear(e.target.value)} className={field}>{years.map((y) => <option key={y}>{y}</option>)}</select>
        </label>
        <span className="font-bold text-sm flex-1">{t('owner.ledger.totals', { in: cents(sum('in')), out: cents(sum('out')), net: cents(sum('in') - sum('out')) })}</span>
        <Button onClick={csv} disabled={!shown.length}><FileCsv weight="bold" size={18} />{t('owner.ledger.csv')}</Button>
        <Button onClick={pdf} disabled={!shown.length}><FilePdf weight="bold" size={18} />{t('owner.ledger.pdf')}</Button>
      </div>
      {shown.length === 0 ? <p className="font-semibold text-muted">{t('owner.ledger.none')}</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead><tr className="text-left">{['date', 'kind', 'category', 'description', 'amount'].map((k) => <th key={k} className="p-1.5 border-b-[2px] border-border">{t(`owner.ledger.${k}` as 'owner.ledger.date')}</th>)}<th className="p-1.5 border-b-[2px] border-border"><span className="sr-only">{t('owner.ledger.remove')}</span></th></tr></thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} className="border-b border-border-soft">
                  <td className="p-1.5 tabular-nums">{r.date}</td><td className="p-1.5">{r.kind === 'in' ? t('owner.ledger.in') : t('owner.ledger.out')}</td><td className="p-1.5">{r.category}</td><td className="p-1.5">{r.description}</td>
                  <td className={`p-1.5 tabular-nums text-right font-bold ${r.kind === 'in' ? 'text-[#1f7a45]' : ''}`}>{r.kind === 'out' ? '-' : ''}{cents(r.amount)}</td>
                  <td className="p-1.5"><button type="button" onClick={() => save(rows.filter((x) => x.id !== r.id))} aria-label={t('owner.ledger.removeOne', { what: r.description })} className="w-9 h-9 rounded-full border-[2px] border-border-soft flex items-center justify-center"><Trash size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs font-bold text-muted">{t('owner.ledger.note')}</p>
    </div>
  );
}

function escapeHtml(s: string) { return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!); }

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
            className={`min-h-11 px-4 rounded-pill border-[2px] font-bold ${now === k ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}>{t(`owner.plan.${k}` as 'owner.plan.free')}</button>
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
      <button type="button" onClick={() => setPreviewTier(null)} className="min-h-9 px-3 rounded-pill border-[2px] border-border bg-surface font-bold">{t('owner.previewStop')}</button>
    </div>
  );
}
