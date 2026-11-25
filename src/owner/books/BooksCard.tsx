import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowSquareOut, FileCsv, FilePdf, Plus, Printer, Trash } from '@phosphor-icons/react';
import { data, newId } from '../../data';
import { supabase } from '../../data/supabase';
import { t } from '../../i18n';
import type { StringKey } from '../../i18n/en';
import { Button, Tabs, fieldClasses } from '../../ui/kit';
import {
  CATEGORIES, TRANSFER, UNSORTED, accountantCsv, addDays, aging, categorize, customers, fromLedger, fromStripe, invoiceState, invoiceTotal,
  nextInvoiceNumber, profitAndLoss, quickbooksCsv, round2, scheduleC, type Entry, type Invoice, type InvoiceLine, type LedgerRow, type Rule, type StripeTxn,
} from './model';

// Gamify Books (/owner?s=books): bookkeeping built around Stripe, with the
// jobs QuickBooks Online does (see model.ts). Saved with the owner's settings;
// Stripe rows come live from api/books.ts.
type TabId = 'overview' | 'transactions' | 'invoices' | 'customers' | 'reports' | 'settings';
interface StripeData {
  configured: true; live: boolean; txns: StripeTxn[]; balance: { available: number; pending: number };
  payouts: { id: string; amount: number; arrival: number; status: string }[]; customers: { id: string; name: string; email: string }[];
  subscriptions: number; mrr: number; invoices: { id: string; number: string | null; status: string; total: number; customer: string; url: string | null }[];
}
type Conn = { k: 'loading' } | { k: 'offline' } | { k: 'owner' } | { k: 'none' } | { k: 'problem'; why: string } | { k: 'ready'; s: StripeData };
interface Biz { name: string; address: string; email: string }

const money = (n: number) => `${n < 0 ? '-' : ''}$${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const today = () => new Date().toLocaleDateString('en-CA');
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

async function token(): Promise<string | null> {
  if (!supabase) return null;
  return (await supabase.auth.getSession()).data.session?.access_token ?? null;
}

function download(name: string, text: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

function printPage(title: string, body: string) {
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>
    body{font-family:system-ui,sans-serif;margin:40px;color:#000}h1{margin:0 0 4px}p{margin:0 0 12px;color:#333}
    table{border-collapse:collapse;width:100%;margin:12px 0 24px;font-size:13px}th,td{border:1px solid #999;padding:6px 8px;text-align:left}
    th{background:#eef0f7}td.n,th.n{text-align:right}.head{display:flex;justify-content:space-between;gap:24px;margin-bottom:24px}
  </style></head><body>${body}<script>window.onload=()=>window.print()</script></body></html>`);
  w.document.close();
}

function useSaved<T>(key: string, empty: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(empty);
  useEffect(() => { void data.getSetting<T>(key).then((x) => { if (x != null) setV(x); }); }, [key]);
  return [v, (next: T) => { setV(next); void data.setSetting(key, next); }];
}

export default function BooksCard() {
  const [tab, setTab] = useState<TabId>('overview');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [conn, setConn] = useState<Conn>({ k: 'loading' });
  const [ledger, saveLedger] = useSaved<LedgerRow[]>('owner-ledger', []);
  const [rules, saveRules] = useSaved<Rule[]>('owner-book-rules', []);
  const [overrides, saveOverrides] = useSaved<Record<string, string>>('owner-book-cats', {});
  const [invoices, saveInvoices] = useSaved<Invoice[]>('owner-invoices', []);
  const [biz, saveBiz] = useSaved<Biz>('owner-book-biz', { name: 'Vermont Literacy Network LLC', address: '', email: '' });

  useEffect(() => {
    let live = true;
    setConn({ k: 'loading' });
    void (async () => {
      const tok = await token();
      if (!tok) { if (live) setConn({ k: supabase ? 'owner' : 'offline' }); return; }
      try {
        const res = await fetch(`/api/books?year=${year}`, { headers: { Authorization: `Bearer ${tok}` } });
        if (!res.headers.get('content-type')?.includes('json')) { if (live) setConn({ k: 'offline' }); return; }
        const body = await res.json();
        if (!live) return;
        if (res.status === 401) setConn({ k: 'owner' });
        else if (!body.configured) setConn({ k: 'none' });
        else if (body.problem) setConn({ k: 'problem', why: body.problem });
        else setConn({ k: 'ready', s: body as StripeData });
      } catch { if (live) setConn({ k: 'offline' }); }
    })();
    return () => { live = false; };
  }, [year]);

  const stripe = conn.k === 'ready' ? conn.s : null;
  const entries = useMemo(() => categorize([...(stripe?.txns ?? []).map(fromStripe), ...ledger.map(fromLedger)], rules, overrides)
    .sort((a, b) => b.date.localeCompare(a.date)), [stripe, ledger, rules, overrides]);
  const shown = useMemo(() => entries.filter((e) => e.date.startsWith(year)), [entries, year]);
  const pnl = useMemo(() => profitAndLoss(shown, year), [shown, year]);
  const years = [...new Set([String(new Date().getFullYear()), ...ledger.map((r) => r.date.slice(0, 4)), ...invoices.map((i) => i.issued.slice(0, 4))])].sort().reverse();

  const tabs: { id: TabId; label: string }[] = (['overview', 'transactions', 'invoices', 'customers', 'reports', 'settings'] as TabId[]).map((id) => ({ id, label: t(`books.tab.${id}` as StringKey) }));
  const shared = { year, shown, pnl, stripe, conn, invoices, saveInvoices, biz };
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={tab} options={tabs} onChange={setTab} label={t('books.sections')} size="sm" className="" />
        <label className="flex items-center gap-2 font-bold text-sm">{t('owner.ledger.year')}
          <select value={year} onChange={(e) => setYear(e.target.value)} className={fieldClasses('sm')}>{years.map((y) => <option key={y}>{y}</option>)}</select>
        </label>
        <StripeBadge conn={conn} />
      </div>
      {tab === 'overview' && <Overview {...shared} go={setTab} />}
      {tab === 'transactions' && <Transactions shown={shown} ledger={ledger} saveLedger={saveLedger} overrides={overrides} saveOverrides={saveOverrides} rules={rules} saveRules={saveRules} />}
      {tab === 'invoices' && <Invoices {...shared} ledger={ledger} saveLedger={saveLedger} />}
      {tab === 'customers' && <Customers invoices={invoices} stripe={stripe} />}
      {tab === 'reports' && <Reports {...shared} />}
      {tab === 'settings' && <Settings conn={conn} rules={rules} saveRules={saveRules} biz={biz} saveBiz={saveBiz} />}
    </div>
  );
}

function StripeBadge({ conn }: { conn: Conn }) {
  const label: Record<Conn['k'], StringKey> = { loading: 'books.stripe.loading', offline: 'books.stripe.offline', owner: 'books.stripe.owner', none: 'books.stripe.none', problem: 'books.stripe.problem', ready: 'books.stripe.ready' };
  const live = conn.k === 'ready' ? (conn.s.live ? t('books.stripe.live') : t('books.stripe.test')) : '';
  return <span className="dash-tag" role="status">{t(label[conn.k])}{live && ` · ${live}`}</span>;
}

function Card({ id, title, children, action }: { id: string; title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="dash-card" aria-labelledby={id}>
      <div className="dash-card-head"><h2 id={id} className="font-bold text-lg m-0">{title}</h2>{action}</div>
      {children}
    </section>
  );
}

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-input border-std border-border-soft p-3">
      <p className="dash-tag m-0">{label}</p>
      <p className="font-display text-2xl tabular-nums m-0">{value}</p>
      {note && <p className="text-xs font-semibold text-muted m-0">{note}</p>}
    </div>
  );
}

interface Shared { year: string; shown: Entry[]; pnl: ReturnType<typeof profitAndLoss>; stripe: StripeData | null; conn: Conn; invoices: Invoice[]; saveInvoices: (v: Invoice[]) => void; biz: Biz }

function Overview({ year, shown, pnl, stripe, invoices, go }: Shared & { go: (t: TabId) => void }) {
  const owed = invoices.filter((i) => i.status === 'sent').reduce((n, i) => n + invoiceTotal(i), 0);
  const unsorted = shown.filter((e) => e.category === UNSORTED).length;
  const fees = pnl.expenses.find((l) => l.category === 'Stripe fees')?.total ?? 0;
  const max = Math.max(1, ...pnl.months.map((_, m) => Math.max(pnl.income.reduce((n, l) => n + l.byMonth[m], 0), pnl.expenses.reduce((n, l) => n + l.byMonth[m], 0))));
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <Tile label={t('books.in', { year })} value={money(pnl.totalIncome)} />
        <Tile label={t('books.out', { year })} value={money(pnl.totalExpenses)} note={fees ? t('books.feesNote', { fees: money(fees) }) : undefined} />
        <Tile label={t('books.net')} value={money(pnl.net)} />
        <Tile label={t('books.owed')} value={money(owed)} note={t('books.owedNote', { n: invoices.filter((i) => i.status === 'sent').length })} />
        {stripe ? <>
          <Tile label={t('books.balance')} value={money(stripe.balance.available / 100)} note={t('books.pending', { amount: money(stripe.balance.pending / 100) })} />
          <Tile label={t('books.mrr')} value={money(stripe.mrr / 100)} note={t('books.subs', { n: stripe.subscriptions })} />
        </> : <div className="col-span-2 rounded-input border-std border-border-soft p-3 grid gap-1"><p className="dash-tag m-0">{t('books.balance')}</p><p className="text-sm font-semibold m-0">{t('books.connectFirst')}</p></div>}
      </div>
      <Card id="books-months" title={t('books.byMonth')}>
        <div className="grid grid-cols-12 gap-1 items-end h-36" role="img" aria-label={t('books.byMonthAlt', { year })}>
          {pnl.months.map((m, i) => {
            const inc = pnl.income.reduce((n, l) => n + l.byMonth[i], 0);
            const out = pnl.expenses.reduce((n, l) => n + l.byMonth[i], 0);
            return (
              <div key={m} className="grid grid-rows-[1fr_auto] h-full gap-1" title={`${m}: ${money(inc)} in, ${money(out)} out`}>
                <div className="flex items-end justify-center gap-0.5">
                  <span className="w-2.5 rounded-t bg-[var(--dash-purple)]" style={{ height: `${(inc / max) * 100}%` }} />
                  <span className="w-2.5 rounded-t bg-[var(--text-faint)]" style={{ height: `${(out / max) * 100}%` }} />
                </div>
                <span className="text-[0.65rem] font-bold text-center text-muted">{new Date(`${m}-15`).toLocaleDateString(undefined, { month: 'short' })}</span>
              </div>
            );
          })}
        </div>
        <p className="dash-sub m-0">{t('books.legend')}</p>
      </Card>
      {(unsorted > 0 || !stripe) && (
        <Card id="books-todo" title={t('books.todo')}>
          <ul className="grid gap-2 list-none p-0 m-0">
            {unsorted > 0 && <li className="flex flex-wrap items-center gap-2"><span className="font-semibold text-sm">{t('books.todoSort', { n: unsorted })}</span><Button size="sm" onClick={() => go('transactions')}>{t('books.tab.transactions')}</Button></li>}
            {!stripe && <li className="flex flex-wrap items-center gap-2"><span className="font-semibold text-sm">{t('books.todoStripe')}</span><Button size="sm" onClick={() => go('settings')}>{t('books.tab.settings')}</Button></li>}
          </ul>
        </Card>
      )}
      {stripe && stripe.payouts.length > 0 && (
        <Card id="books-payouts" title={t('books.payouts')}>
          <ul className="grid gap-1 list-none p-0 m-0">
            {stripe.payouts.map((p) => <li key={p.id} className="flex justify-between text-sm font-semibold"><span>{new Date(p.arrival * 1000).toLocaleDateString()} · {p.status}</span><span className="tabular-nums">{money(p.amount / 100)}</span></li>)}
          </ul>
        </Card>
      )}
    </div>
  );
}

const ALL_CATS = [...CATEGORIES.map((c) => c.name), UNSORTED];
type Filter = 'all' | 'in' | 'out' | 'unsorted' | 'stripe' | 'manual';

function Transactions({ shown, ledger, saveLedger, overrides, saveOverrides, rules, saveRules }: {
  shown: Entry[]; ledger: LedgerRow[]; saveLedger: (v: LedgerRow[]) => void; overrides: Record<string, string>; saveOverrides: (v: Record<string, string>) => void; rules: Rule[]; saveRules: (v: Rule[]) => void;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [draft, setDraft] = useState<Omit<LedgerRow, 'id'>>({ date: today(), kind: 'out', category: 'Hosting', description: '', amount: 0 });
  const field = fieldClasses('md');
  const list = shown.filter((e) => (filter === 'all' || (filter === 'unsorted' ? e.category === UNSORTED : filter === 'in' || filter === 'out' ? e.kind === filter : e.source === filter))
    && (!q.trim() || `${e.description} ${e.category} ${e.customer ?? ''}`.toLowerCase().includes(q.trim().toLowerCase())));
  const ok = draft.description.trim() && draft.amount > 0;
  function add() {
    if (!ok) return;
    saveLedger([...ledger, { ...draft, description: draft.description.trim(), amount: round2(draft.amount), id: newId('led') }]);
    setDraft({ ...draft, description: '', amount: 0 });
  }
  function recategorize(e: Entry, category: string) {
    saveOverrides({ ...overrides, [e.id]: category });
    if (e.source === 'manual') saveLedger(ledger.map((r) => (r.id === e.id ? { ...r, category } : r)));
  }
  const filters: { id: Filter; label: string }[] = (['all', 'in', 'out', 'unsorted', 'stripe', 'manual'] as Filter[]).map((id) => ({ id, label: t(`books.filter.${id}` as StringKey) }));
  return (
    <div className="grid gap-4">
      <Card id="books-add" title={t('books.addEntry')}>
        <div className="grid sm:grid-cols-[auto_auto_auto_1fr_auto_auto] gap-2 items-end">
          <label className="grid gap-1 text-sm font-bold">{t('owner.ledger.date')}<input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className={field} /></label>
          <label className="grid gap-1 text-sm font-bold">{t('owner.ledger.kind')}
            <select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as 'in' | 'out', category: e.target.value === 'in' ? 'School invoices' : 'Hosting' })} className={field}><option value="in">{t('owner.ledger.in')}</option><option value="out">{t('owner.ledger.out')}</option></select>
          </label>
          <label className="grid gap-1 text-sm font-bold">{t('owner.ledger.category')}
            <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className={field}>{CATEGORIES.filter((c) => c.kind === draft.kind).map((c) => <option key={c.name}>{c.name}</option>)}</select>
          </label>
          <label className="grid gap-1 text-sm font-bold">{t('owner.ledger.description')}<input value={draft.description} maxLength={120} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className={field} /></label>
          <label className="grid gap-1 text-sm font-bold">{t('owner.ledger.amount')}<input type="number" min={0} step={0.01} value={draft.amount || ''} onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })} className={`${field} w-28`} /></label>
          <Button variant="primary" onClick={add} disabled={!ok}><Plus weight="bold" size={18} aria-hidden="true" />{t('owner.ledger.add')}</Button>
        </div>
        <p className="dash-sub m-0">{t('books.addNote')}</p>
      </Card>
      <Card id="books-list" title={t('books.tab.transactions')}>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={filter} options={filters} onChange={setFilter} label={t('books.filterLabel')} size="sm" className="" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('books.search')} aria-label={t('books.search')} className={fieldClasses('sm', 'flex-1 min-w-40')} />
        </div>
        {list.length === 0 ? <p className="dash-empty m-0">{t('books.none')}</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead><tr className="text-left">
                {(['date', 'description', 'category', 'fee', 'amount'] as const).map((k) => <th key={k} className={`p-1.5 border-b-[2px] border-border ${k === 'amount' || k === 'fee' ? 'text-right' : ''}`}>{t(`books.col.${k}` as StringKey)}</th>)}
                <th className="p-1.5 border-b-[2px] border-border"><span className="sr-only">{t('owner.ledger.remove')}</span></th>
              </tr></thead>
              <tbody>
                {list.map((e) => (
                  <tr key={e.id} className="border-b border-border-soft">
                    <td className="p-1.5 tabular-nums whitespace-nowrap">{e.date}</td>
                    <td className="p-1.5"><span className="font-semibold">{e.description}</span>{e.customer && <span className="text-muted"> · {e.customer}</span>} <span className="dash-tag">{e.source === 'stripe' ? 'Stripe' : t('books.manual')}</span></td>
                    <td className="p-1.5">
                      {e.kind === 'transfer' ? <span className="font-semibold text-muted">{TRANSFER}</span> : (
                        <select value={e.category} onChange={(ev) => recategorize(e, ev.target.value)} aria-label={t('books.categoryFor', { what: e.description })} className={fieldClasses('sm', e.category === UNSORTED ? 'border-[var(--dash-purple)]' : '')}>
                          {ALL_CATS.map((c) => <option key={c}>{c}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="p-1.5 tabular-nums text-right text-muted">{e.fee ? money(-e.fee) : ''}</td>
                    <td className={`p-1.5 tabular-nums text-right font-bold ${e.kind === 'in' ? 'text-success-ink' : ''}`}>{money(e.kind === 'out' ? -e.amount : e.amount)}</td>
                    <td className="p-1.5 whitespace-nowrap">
                      {e.kind !== 'transfer' && e.category !== UNSORTED && !rules.some((r) => r.contains.toLowerCase() === e.description.toLowerCase()) && (
                        <button type="button" className="dash-link text-xs" onClick={() => saveRules([...rules, { id: newId('rule'), contains: e.description, category: e.category }])}>{t('books.makeRule')}</button>
                      )}
                      {e.source === 'manual' && <button type="button" onClick={() => saveLedger(ledger.filter((r) => r.id !== e.id))} aria-label={t('owner.ledger.removeOne', { what: e.description })} className="ml-1 w-8 h-8 inline-flex items-center justify-center rounded-full border-std border-border-soft"><Trash size={14} aria-hidden="true" /></button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

const blankLine = (): InvoiceLine => ({ description: 'Gamify School seats (1 year)', qty: 1, price: 0 });

function Invoices({ invoices, saveInvoices, stripe, biz, ledger, saveLedger }: Shared & { ledger: LedgerRow[]; saveLedger: (v: LedgerRow[]) => void }) {
  const now = today();
  const fresh = (): Invoice => ({ id: newId('inv'), number: nextInvoiceNumber(invoices, now.slice(0, 4)), customer: '', email: '', po: '', issued: now, due: addDays(now, 30), lines: [blankLine()], status: 'draft' });
  const [draft, setDraft] = useState<Invoice | null>(null);
  const [busy, setBusy] = useState('');
  const [problem, setProblem] = useState('');
  const field = fieldClasses('md');
  const update = (i: Invoice) => saveInvoices(invoices.some((x) => x.id === i.id) ? invoices.map((x) => (x.id === i.id ? i : x)) : [...invoices, i]);

  async function toStripe(i: Invoice, action: 'invoice' | 'send') {
    setBusy(i.id); setProblem('');
    try {
      const res = await fetch('/api/books', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${(await token()) ?? ''}` }, body: JSON.stringify(action === 'send' ? { action, id: i.stripeId } : { action, invoice: i }) });
      const out = (await res.json().catch(() => ({}))) as { ok?: boolean; id?: string; url?: string; status?: string; problem?: string };
      if (!out.ok) { setProblem(out.problem ?? t('books.inv.stripeFailed')); return; }
      update({ ...i, stripeId: out.id, stripeUrl: out.url, status: out.status === 'sent' ? 'sent' : i.status });
    } catch { setProblem(t('books.inv.stripeFailed')); } finally { setBusy(''); }
  }
  function markPaid(i: Invoice) {
    update({ ...i, status: 'paid', paidOn: now });
    // Paid through Stripe arrives with the Stripe rows; a check or bank transfer is recorded here.
    if (!i.stripeId) saveLedger([...ledger, { id: `inv-${i.id}`, date: now, kind: 'in', category: 'School invoices', description: `Invoice ${i.number}, ${i.customer}`, amount: invoiceTotal(i) }]);
  }
  function print(i: Invoice) {
    const rows = i.lines.map((l) => `<tr><td>${esc(l.description)}</td><td class="n">${l.qty}</td><td class="n">${money(l.price)}</td><td class="n">${money(l.qty * l.price)}</td></tr>`).join('');
    printPage(`Invoice ${i.number}`, `<div class="head"><div><h1>Invoice ${esc(i.number)}</h1><p>${esc(biz.name)}<br>${esc(biz.address).replace(/\n/g, '<br>')}<br>${esc(biz.email)}</p></div>
      <div><p><b>Bill to</b><br>${esc(i.customer)}<br>${esc(i.email)}</p><p>Issued ${i.issued}<br>Due ${i.due}${i.po ? `<br>PO ${esc(i.po)}` : ''}</p></div></div>
      <table><tr><th>Item</th><th class="n">Qty</th><th class="n">Price</th><th class="n">Amount</th></tr>${rows}<tr><th colspan="3" class="n">Total due</th><th class="n">${money(invoiceTotal(i))}</th></tr></table>
      ${i.note ? `<p>${esc(i.note)}</p>` : ''}<p>W-9 and a data privacy agreement available on request.</p>`);
  }

  if (draft) {
    const ok = draft.customer.trim() && draft.email.includes('@') && draft.lines.some((l) => l.description.trim() && l.qty > 0 && l.price > 0);
    const setLine = (n: number, l: Partial<InvoiceLine>) => setDraft({ ...draft, lines: draft.lines.map((x, i) => (i === n ? { ...x, ...l } : x)) });
    return (
      <Card id="books-inv-new" title={t('books.inv.new', { number: draft.number })}>
        <div className="grid sm:grid-cols-2 gap-2">
          <label className="grid gap-1 text-sm font-bold">{t('books.inv.customer')}<input value={draft.customer} maxLength={120} onChange={(e) => setDraft({ ...draft, customer: e.target.value })} className={field} /></label>
          <label className="grid gap-1 text-sm font-bold">{t('books.inv.email')}<input type="email" value={draft.email} maxLength={200} onChange={(e) => setDraft({ ...draft, email: e.target.value })} className={field} /></label>
          <label className="grid gap-1 text-sm font-bold">{t('books.inv.po')}<input value={draft.po} maxLength={30} onChange={(e) => setDraft({ ...draft, po: e.target.value })} className={field} /></label>
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1 text-sm font-bold">{t('books.inv.issued')}<input type="date" value={draft.issued} onChange={(e) => setDraft({ ...draft, issued: e.target.value, due: addDays(e.target.value, 30) })} className={field} /></label>
            <label className="grid gap-1 text-sm font-bold">{t('books.inv.due')}<input type="date" value={draft.due} onChange={(e) => setDraft({ ...draft, due: e.target.value })} className={field} /></label>
          </div>
        </div>
        <div className="grid gap-2">
          {draft.lines.map((l, n) => (
            <div key={n} className="grid grid-cols-[1fr_5rem_7rem_auto] gap-2 items-end">
              <label className="grid gap-1 text-sm font-bold">{t('books.inv.item')}<input value={l.description} maxLength={160} onChange={(e) => setLine(n, { description: e.target.value })} className={field} /></label>
              <label className="grid gap-1 text-sm font-bold">{t('books.inv.qty')}<input type="number" min={1} value={l.qty || ''} onChange={(e) => setLine(n, { qty: Number(e.target.value) })} className={field} /></label>
              <label className="grid gap-1 text-sm font-bold">{t('books.inv.price')}<input type="number" min={0} step={0.01} value={l.price || ''} onChange={(e) => setLine(n, { price: Number(e.target.value) })} className={field} /></label>
              <button type="button" disabled={draft.lines.length === 1} onClick={() => setDraft({ ...draft, lines: draft.lines.filter((_, i) => i !== n) })} aria-label={t('books.inv.removeLine')} className="w-11 h-11 inline-flex items-center justify-center rounded-full border-std border-border-soft disabled:opacity-40"><Trash size={16} aria-hidden="true" /></button>
            </div>
          ))}
          <Button size="sm" className="justify-self-start" onClick={() => setDraft({ ...draft, lines: [...draft.lines, { ...blankLine(), description: '' }] })}><Plus size={16} aria-hidden="true" />{t('books.inv.addLine')}</Button>
        </div>
        <label className="grid gap-1 text-sm font-bold">{t('books.inv.note')}<textarea value={draft.note ?? ''} rows={2} maxLength={500} onChange={(e) => setDraft({ ...draft, note: e.target.value })} className={fieldClasses('md', 'resize-none')} /></label>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold flex-1">{t('books.inv.total', { total: money(invoiceTotal(draft)) })}</span>
          <Button onClick={() => setDraft(null)}>{t('books.cancel')}</Button>
          <Button variant="primary" disabled={!ok} onClick={() => { update({ ...draft, customer: draft.customer.trim(), email: draft.email.trim(), lines: draft.lines.filter((l) => l.description.trim() && l.qty > 0) }); setDraft(null); }}>{t('books.inv.save')}</Button>
        </div>
      </Card>
    );
  }

  const label: Record<ReturnType<typeof invoiceState>, StringKey> = { draft: 'books.inv.state.draft', open: 'books.inv.state.open', overdue: 'books.inv.state.overdue', paid: 'books.inv.state.paid', void: 'books.inv.state.void' };
  const sorted = [...invoices].sort((a, b) => b.issued.localeCompare(a.issued));
  return (
    <Card id="books-invoices" title={t('books.tab.invoices')} action={<Button variant="primary" size="sm" onClick={() => setDraft(fresh())}><Plus size={16} aria-hidden="true" />{t('books.inv.create')}</Button>}>
      <p className="dash-sub m-0">{stripe ? t('books.inv.noteStripe') : t('books.inv.noteNoStripe')}</p>
      {problem && <p className="font-bold text-sm m-0" role="alert">{problem}</p>}
      {sorted.length === 0 ? <p className="dash-empty m-0">{t('books.inv.none')}</p> : (
        <ul className="grid gap-2 list-none p-0 m-0">
          {sorted.map((i) => {
            const state = invoiceState(i, now);
            return (
              <li key={i.id} className="rounded-input border-std border-border p-3 grid gap-2">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-bold">{i.number}</span><span className="font-semibold">{i.customer}</span>
                  <span className={`dash-tag ${state === 'overdue' ? 'text-[var(--color-danger,#c0392b)]' : ''}`}>{t(label[state])}</span>
                  <span className="text-sm text-muted font-semibold flex-1">{t('books.inv.dates', { issued: i.issued, due: i.due })}{i.po ? ` · PO ${i.po}` : ''}</span>
                  <span className="font-bold tabular-nums">{money(invoiceTotal(i))}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => print(i)}><Printer size={16} aria-hidden="true" />{t('books.inv.print')}</Button>
                  {stripe && !i.stripeId && i.status === 'draft' && <Button size="sm" disabled={busy === i.id} onClick={() => void toStripe(i, 'invoice')}>{t('books.inv.toStripe')}</Button>}
                  {stripe && i.stripeId && i.status === 'draft' && <Button size="sm" variant="primary" disabled={busy === i.id} onClick={() => { if (window.confirm(t('books.inv.sendConfirm', { email: i.email }))) void toStripe(i, 'send'); }}>{t('books.inv.sendStripe')}</Button>}
                  {!i.stripeId && i.status === 'draft' && <Button size="sm" onClick={() => update({ ...i, status: 'sent' })}>{t('books.inv.markSent')}</Button>}
                  {i.status === 'sent' && <Button size="sm" variant="primary" onClick={() => markPaid(i)}>{t('books.inv.markPaid')}</Button>}
                  {i.status !== 'paid' && i.status !== 'void' && <Button size="sm" onClick={() => update({ ...i, status: 'void' })}>{t('books.inv.void')}</Button>}
                  {i.status === 'draft' && <Button size="sm" onClick={() => setDraft(i)}>{t('books.inv.edit')}</Button>}
                  {i.stripeUrl && <a href={i.stripeUrl} target="_blank" rel="noreferrer" className="dash-link self-center">{t('books.inv.openStripe')}<ArrowSquareOut size={14} aria-hidden="true" /></a>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function Customers({ invoices, stripe }: { invoices: Invoice[]; stripe: StripeData | null }) {
  const list = customers(invoices, stripe?.customers ?? []);
  return (
    <Card id="books-customers" title={t('books.tab.customers')}>
      <p className="dash-sub m-0">{t('books.cust.note')}</p>
      {list.length === 0 ? <p className="dash-empty m-0">{t('books.cust.none')}</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead><tr className="text-left">{(['name', 'email', 'invoices', 'billed', 'paid', 'open'] as const).map((k) => <th key={k} className={`p-1.5 border-b-[2px] border-border ${k === 'name' || k === 'email' ? '' : 'text-right'}`}>{t(`books.cust.${k}` as StringKey)}</th>)}</tr></thead>
            <tbody>{list.map((c) => (
              <tr key={`${c.email}-${c.name}`} className="border-b border-border-soft">
                <td className="p-1.5 font-semibold">{c.name}</td><td className="p-1.5">{c.email}</td>
                <td className="p-1.5 text-right tabular-nums">{c.invoices}</td><td className="p-1.5 text-right tabular-nums">{money(c.billed)}</td>
                <td className="p-1.5 text-right tabular-nums">{money(c.paid)}</td><td className="p-1.5 text-right tabular-nums font-bold">{money(c.open)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function Reports({ year, shown, pnl, invoices, biz }: Shared) {
  const sc = scheduleC(pnl);
  const ar = aging(invoices, today());
  const month = (m: string) => new Date(`${m}-15`).toLocaleDateString(undefined, { month: 'short' });
  const table = (title: string, lines: typeof pnl.income) => lines.length === 0 ? '' : `<h2>${title}</h2><table><tr><th>Category</th>${pnl.months.map((m) => `<th class="n">${month(m)}</th>`).join('')}<th class="n">Total</th></tr>${lines.map((l) => `<tr><td>${esc(l.category)}</td>${l.byMonth.map((n) => `<td class="n">${n ? money(n) : ''}</td>`).join('')}<td class="n"><b>${money(l.total)}</b></td></tr>`).join('')}</table>`;
  function pdf() {
    printPage(`Profit and Loss ${year}`, `<h1>Profit and Loss, ${year}</h1><p>${esc(biz.name)}. Income ${money(pnl.totalIncome)}, expenses ${money(pnl.totalExpenses)}, net ${money(pnl.net)}. Cash basis, from Gamify Books.</p>
      ${table('Income', pnl.income)}${table('Expenses', pnl.expenses)}<h2>Schedule C summary</h2><table><tr><th>Line</th><th class="n">Total</th></tr>${sc.map((s) => `<tr><td>${esc(s.line)}</td><td class="n">${money(s.total)}</td></tr>`).join('')}</table>`);
  }
  const Lines = ({ title, lines }: { title: string; lines: typeof pnl.income }) => (
    <>
      <tr><th colSpan={14} className="p-1.5 text-left bg-[var(--surface-2,#f4f4f6)]">{title}</th></tr>
      {lines.map((l) => (
        <tr key={l.category} className="border-b border-border-soft">
          <td className="p-1.5 font-semibold whitespace-nowrap">{l.category}</td>
          {l.byMonth.map((n, i) => <td key={i} className="p-1.5 text-right tabular-nums text-muted">{n ? Math.round(n).toLocaleString() : ''}</td>)}
          <td className="p-1.5 text-right tabular-nums font-bold">{money(l.total)}</td>
        </tr>
      ))}
    </>
  );
  return (
    <div className="grid gap-4">
      <Card id="books-pnl" title={t('books.rep.pnl', { year })} action={<Button size="sm" onClick={pdf}><FilePdf size={16} aria-hidden="true" />{t('owner.ledger.pdf')}</Button>}>
        {pnl.income.length + pnl.expenses.length === 0 ? <p className="dash-empty m-0">{t('owner.ledger.none')}</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead><tr><th className="p-1.5 text-left border-b-[2px] border-border">{t('books.col.category')}</th>{pnl.months.map((m) => <th key={m} className="p-1.5 text-right border-b-[2px] border-border">{month(m)}</th>)}<th className="p-1.5 text-right border-b-[2px] border-border">{t('books.rep.total')}</th></tr></thead>
              <tbody>
                <Lines title={t('books.rep.income')} lines={pnl.income} />
                <Lines title={t('books.rep.expenses')} lines={pnl.expenses} />
                <tr><td className="p-1.5 font-bold" colSpan={13}>{t('books.net')}</td><td className="p-1.5 text-right tabular-nums font-bold">{money(pnl.net)}</td></tr>
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card id="books-sc" title={t('books.rep.scheduleC')}>
          <ul className="grid gap-1 list-none p-0 m-0">{sc.map((s) => <li key={s.line} className="flex justify-between text-sm font-semibold"><span>{s.line}</span><span className="tabular-nums">{money(s.total)}</span></li>)}</ul>
          <p className="dash-sub m-0">{t('books.rep.scNote')}</p>
        </Card>
        <Card id="books-ar" title={t('books.rep.aging')}>
          <ul className="grid gap-1 list-none p-0 m-0">{ar.map((a) => <li key={a.bucket} className="flex justify-between text-sm font-semibold"><span>{a.bucket}</span><span className="tabular-nums">{money(a.total)}</span></li>)}</ul>
        </Card>
      </div>
      <Card id="books-export" title={t('books.rep.export')}>
        <div className="flex flex-wrap gap-2">
          <Button disabled={!shown.length} onClick={() => download(`gamify-quickbooks-${year}.csv`, quickbooksCsv(shown))}><FileCsv size={18} aria-hidden="true" />{t('books.rep.qbCsv')}</Button>
          <Button disabled={!shown.length} onClick={() => download(`gamify-books-${year}.csv`, accountantCsv(shown))}><FileCsv size={18} aria-hidden="true" />{t('books.rep.fullCsv')}</Button>
        </div>
        <p className="dash-sub m-0">{t('books.rep.exportNote')}</p>
      </Card>
    </div>
  );
}

function Settings({ conn, rules, saveRules, biz, saveBiz }: { conn: Conn; rules: Rule[]; saveRules: (v: Rule[]) => void; biz: Biz; saveBiz: (v: Biz) => void }) {
  const [rule, setRule] = useState<Omit<Rule, 'id'>>({ contains: '', category: 'Hosting' });
  const field = fieldClasses('md');
  const stripeText: Record<Conn['k'], StringKey> = { loading: 'books.stripe.loading', offline: 'books.set.offline', owner: 'books.stripe.owner', none: 'books.set.none', problem: 'books.stripe.problem', ready: 'books.set.ready' };
  return (
    <div className="grid gap-4">
      <Card id="books-conn" title={t('books.set.connections')}>
        <div className="rounded-input border-std border-border p-3 grid gap-1">
          <p className="font-bold m-0">Stripe · <StripeBadge conn={conn} /></p>
          <p className="text-sm font-medium m-0">{t(stripeText[conn.k])}{conn.k === 'problem' && ` (${conn.why})`}</p>
        </div>
        <div className="rounded-input border-std border-border p-3 grid gap-1">
          <p className="font-bold m-0">QuickBooks Online · <span className="dash-tag">{t('books.set.qbLater')}</span></p>
          <p className="text-sm font-medium m-0">{t('books.set.qbNote')}</p>
        </div>
      </Card>
      <Card id="books-rules" title={t('books.set.rules')}>
        <p className="dash-sub m-0">{t('books.set.rulesNote')}</p>
        <div className="grid sm:grid-cols-[1fr_auto_auto] gap-2 items-end">
          <label className="grid gap-1 text-sm font-bold">{t('books.set.contains')}<input value={rule.contains} maxLength={80} onChange={(e) => setRule({ ...rule, contains: e.target.value })} className={field} /></label>
          <label className="grid gap-1 text-sm font-bold">{t('owner.ledger.category')}<select value={rule.category} onChange={(e) => setRule({ ...rule, category: e.target.value })} className={field}>{CATEGORIES.map((c) => <option key={c.name}>{c.name}</option>)}</select></label>
          <Button variant="primary" disabled={!rule.contains.trim()} onClick={() => { saveRules([...rules, { ...rule, contains: rule.contains.trim(), id: newId('rule') }]); setRule({ ...rule, contains: '' }); }}><Plus size={16} aria-hidden="true" />{t('owner.ledger.add')}</Button>
        </div>
        {rules.length === 0 ? <p className="dash-empty m-0">{t('books.set.noRules')}</p> : (
          <ul className="grid gap-1 list-none p-0 m-0">
            {rules.map((r) => (
              <li key={r.id} className="flex items-center gap-2 text-sm font-semibold">
                <span className="flex-1">{t('books.set.ruleLine', { contains: r.contains, category: r.category })}</span>
                <button type="button" onClick={() => saveRules(rules.filter((x) => x.id !== r.id))} aria-label={t('owner.ledger.removeOne', { what: r.contains })} className="w-8 h-8 inline-flex items-center justify-center rounded-full border-std border-border-soft"><Trash size={14} aria-hidden="true" /></button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card id="books-biz" title={t('books.set.biz')}>
        <div className="grid sm:grid-cols-2 gap-2">
          <label className="grid gap-1 text-sm font-bold">{t('books.set.bizName')}<input value={biz.name} maxLength={120} onChange={(e) => saveBiz({ ...biz, name: e.target.value })} className={field} /></label>
          <label className="grid gap-1 text-sm font-bold">{t('books.set.bizEmail')}<input type="email" value={biz.email} maxLength={200} onChange={(e) => saveBiz({ ...biz, email: e.target.value })} className={field} /></label>
          <label className="grid gap-1 text-sm font-bold sm:col-span-2">{t('books.set.bizAddress')}<textarea value={biz.address} rows={2} maxLength={300} onChange={(e) => saveBiz({ ...biz, address: e.target.value })} className={fieldClasses('md', 'resize-none')} /></label>
        </div>
        <p className="dash-sub m-0">{t('books.set.bizNote')}</p>
      </Card>
    </div>
  );
}
