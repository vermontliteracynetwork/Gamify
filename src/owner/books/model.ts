// Gamify Books: the owner's bookkeeping, built around Stripe (owner,
// 2026-11-25: "the full function of quickbooks online embedded into the
// developer portal and use stripe function (build around it before i add
// it)"). QuickBooks Online cannot be shown inside another site, so these are
// Gamify's own screens with the same jobs: transactions with categories and
// rules, invoices, customers, Profit and Loss, sales and tax reports, and
// exports QuickBooks and an accountant can import. Stripe rows arrive through
// api/books.ts once STRIPE_SECRET_KEY is set; until then everything works on
// entries she types in. Pure functions here; screens in BooksCard.tsx.

export type Kind = 'in' | 'out' | 'transfer';
export interface Entry {
  id: string; date: string; kind: Kind; category: string; description: string;
  amount: number; fee: number; source: 'stripe' | 'manual'; customer?: string; ref?: string;
}
// The manual rows saved before Books (the old Bookkeeping card's shape).
export interface LedgerRow { id: string; date: string; kind: 'in' | 'out'; category: string; description: string; amount: number }

// Income and expense categories, each with the IRS Schedule C line an
// accountant files it under (single-member LLC; the accountant confirms).
export const CATEGORIES: { name: string; kind: 'in' | 'out'; scheduleC: string }[] = [
  { name: 'Subscriptions', kind: 'in', scheduleC: '1 Gross receipts' },
  { name: 'School invoices', kind: 'in', scheduleC: '1 Gross receipts' },
  { name: 'Other income', kind: 'in', scheduleC: '6 Other income' },
  { name: 'Refunds', kind: 'out', scheduleC: '2 Returns and allowances' },
  { name: 'Stripe fees', kind: 'out', scheduleC: '10 Commissions and fees' },
  { name: 'Hosting', kind: 'out', scheduleC: '18 Office expense' },
  { name: 'Domain and email', kind: 'out', scheduleC: '18 Office expense' },
  { name: 'Software', kind: 'out', scheduleC: '18 Office expense' },
  { name: 'Marketing', kind: 'out', scheduleC: '8 Advertising' },
  { name: 'Legal', kind: 'out', scheduleC: '17 Legal and professional services' },
  { name: 'Accounting', kind: 'out', scheduleC: '17 Legal and professional services' },
  { name: 'Insurance', kind: 'out', scheduleC: '15 Insurance' },
  { name: 'Affiliate commissions', kind: 'out', scheduleC: '10 Commissions and fees' },
  { name: 'Contractors', kind: 'out', scheduleC: '11 Contract labor' },
  { name: 'Equipment', kind: 'out', scheduleC: '13 Depreciation (ask the accountant)' },
  { name: 'Taxes and licenses', kind: 'out', scheduleC: '23 Taxes and licenses' },
  { name: 'Other', kind: 'out', scheduleC: '27a Other expenses' },
];
export const TRANSFER = 'Transfer to bank';
export const UNSORTED = 'Needs a category';

// The shape api/books.ts sends for each Stripe balance transaction.
export interface StripeTxn {
  id: string; created: number; type: string; reporting_category?: string; amount: number; fee: number; net: number;
  description: string | null; customer?: string | null; invoice?: boolean;
}

const day = (unix: number) => new Date(unix * 1000).toISOString().slice(0, 10);

// Stripe amounts are cents. A charge is gross income with its fee kept
// beside it (fees post as their own expense in reports); a refund is money
// out; a payout is a transfer to the bank, never income.
export function fromStripe(t: StripeTxn): Entry {
  const cat = t.reporting_category ?? t.type;
  const base = { id: `stripe-${t.id}`, date: day(t.created), description: t.description || t.type, fee: t.fee / 100, source: 'stripe' as const, customer: t.customer ?? undefined, ref: t.id };
  if (cat === 'payout' || t.type === 'payout') return { ...base, kind: 'transfer', category: TRANSFER, amount: Math.abs(t.amount) / 100 };
  if (cat === 'refund' || t.type === 'refund') return { ...base, kind: 'out', category: 'Refunds', amount: Math.abs(t.amount) / 100 };
  if (cat === 'fee' || t.type === 'stripe_fee') return { ...base, kind: 'out', category: 'Stripe fees', amount: Math.abs(t.amount) / 100, fee: 0 };
  if (t.amount >= 0) return { ...base, kind: 'in', category: t.invoice ? 'School invoices' : 'Subscriptions', amount: t.amount / 100 };
  return { ...base, kind: 'out', category: UNSORTED, amount: Math.abs(t.amount) / 100 };
}

export function fromLedger(r: LedgerRow): Entry {
  return { ...r, fee: 0, source: 'manual' };
}

// Bank rules: the first rule whose words appear in the description sets the
// category, unless she picked one by hand (overrides win).
export interface Rule { id: string; contains: string; category: string }
export function categorize(entries: Entry[], rules: Rule[], overrides: Record<string, string>): Entry[] {
  return entries.map((e) => {
    if (overrides[e.id]) return { ...e, category: overrides[e.id] };
    if (e.kind === 'transfer') return e;
    const rule = rules.find((r) => r.contains.trim() && e.description.toLowerCase().includes(r.contains.trim().toLowerCase()));
    return rule ? { ...e, category: rule.category } : e;
  });
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

// Profit and Loss for one year: income and expenses by category and month,
// with Stripe fees taken from the charges they came with.
export interface PnL { months: string[]; income: Line[]; expenses: Line[]; totalIncome: number; totalExpenses: number; net: number }
export interface Line { category: string; byMonth: number[]; total: number }
export function profitAndLoss(entries: Entry[], year: string): PnL {
  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
  const inYear = entries.filter((e) => e.date.startsWith(year));
  const lines = (kind: 'in' | 'out') => {
    const map = new Map<string, number[]>();
    const add = (cat: string, date: string, n: number) => {
      if (!n) return;
      const row = map.get(cat) ?? Array(12).fill(0);
      row[Number(date.slice(5, 7)) - 1] += n;
      map.set(cat, row);
    };
    for (const e of inYear) {
      if (e.kind === kind) add(e.category, e.date, e.amount);
      if (kind === 'out' && e.kind === 'in' && e.fee) add('Stripe fees', e.date, e.fee);
    }
    return [...map].map(([category, byMonth]) => ({ category, byMonth: byMonth.map(round2), total: round2(byMonth.reduce((a, b) => a + b, 0)) }))
      .sort((a, b) => b.total - a.total);
  };
  const income = lines('in');
  const expenses = lines('out');
  const totalIncome = round2(income.reduce((n, l) => n + l.total, 0));
  const totalExpenses = round2(expenses.reduce((n, l) => n + l.total, 0));
  return { months, income, expenses, totalIncome, totalExpenses, net: round2(totalIncome - totalExpenses) };
}

// Schedule C summary: the P&L folded onto the lines the accountant files.
export function scheduleC(p: PnL): { line: string; total: number }[] {
  const out = new Map<string, number>();
  for (const l of [...p.income, ...p.expenses]) {
    const line = CATEGORIES.find((c) => c.name === l.category)?.scheduleC ?? '27a Other expenses';
    out.set(line, round2((out.get(line) ?? 0) + l.total));
  }
  return [...out].map(([line, total]) => ({ line, total })).sort((a, b) => parseFloat(a.line) - parseFloat(b.line));
}

const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
const usDate = (iso: string) => `${iso.slice(5, 7)}/${iso.slice(8, 10)}/${iso.slice(0, 4)}`;

// QuickBooks Online "Upload transactions" three-column CSV (Date,
// Description, Amount; money out negative). Payouts are left out: they are
// the bank side of money already counted.
export function quickbooksCsv(entries: Entry[]): string {
  const rows = entries.filter((e) => e.kind !== 'transfer').sort((a, b) => a.date.localeCompare(b.date));
  const lines = ['Date,Description,Amount'];
  for (const e of rows) {
    lines.push([usDate(e.date), esc(`${e.description} (${e.category})`), (e.kind === 'out' ? -e.amount : e.amount).toFixed(2)].join(','));
    if (e.kind === 'in' && e.fee) lines.push([usDate(e.date), esc(`Stripe fee: ${e.description} (Stripe fees)`), (-e.fee).toFixed(2)].join(','));
  }
  return lines.join('\n');
}

// The full ledger for an accountant.
export function accountantCsv(entries: Entry[]): string {
  const lines = ['Date,Type,Category,Schedule C line,Description,Customer,Gross,Fee,Net,Source,Reference'];
  for (const e of [...entries].sort((a, b) => a.date.localeCompare(b.date))) {
    const sign = e.kind === 'out' ? -1 : 1;
    const line = CATEGORIES.find((c) => c.name === e.category)?.scheduleC ?? '';
    lines.push([e.date, e.kind, esc(e.category), esc(line), esc(e.description), esc(e.customer ?? ''), (sign * e.amount).toFixed(2), (-e.fee).toFixed(2), (sign * e.amount - e.fee).toFixed(2), e.source, e.ref ?? ''].join(','));
  }
  return lines.join('\n');
}

// Invoices for schools (purchase orders, net 30). Kept in Books until Stripe
// is connected; then "Create in Stripe" makes the real invoice.
export interface InvoiceLine { description: string; qty: number; price: number }
export interface Invoice {
  id: string; number: string; customer: string; email: string; po: string; issued: string; due: string;
  lines: InvoiceLine[]; status: 'draft' | 'sent' | 'paid' | 'void'; paidOn?: string; stripeId?: string; stripeUrl?: string; note?: string;
}
export const invoiceTotal = (i: Pick<Invoice, 'lines'>) => round2(i.lines.reduce((n, l) => n + l.qty * l.price, 0));
export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function nextInvoiceNumber(all: Invoice[], year: string): string {
  const n = all.filter((i) => i.number.startsWith(`G${year}-`)).map((i) => Number(i.number.split('-')[1]) || 0);
  return `G${year}-${String((n.length ? Math.max(...n) : 0) + 1).padStart(3, '0')}`;
}
export function invoiceState(i: Invoice, today: string): 'draft' | 'open' | 'overdue' | 'paid' | 'void' {
  if (i.status === 'paid' || i.status === 'void' || i.status === 'draft') return i.status;
  return i.due < today ? 'overdue' : 'open';
}
// Accounts receivable aging: unpaid sent invoices by days past due.
export function aging(all: Invoice[], today: string): { bucket: string; total: number }[] {
  const buckets = [['Not due yet', -Infinity, 0], ['1 to 30 days late', 1, 30], ['31 to 60 days late', 31, 60], ['Over 60 days late', 61, Infinity]] as const;
  const late = (i: Invoice) => Math.round((Date.parse(today) - Date.parse(i.due)) / 86_400_000);
  return buckets.map(([bucket, lo, hi]) => ({ bucket, total: round2(all.filter((i) => i.status === 'sent' && late(i) >= lo && late(i) <= hi).reduce((n, i) => n + invoiceTotal(i), 0)) }));
}

// Customers: schools and families from invoices, Stripe and entries.
export interface Customer { name: string; email: string; billed: number; paid: number; open: number; invoices: number }
export function customers(invoices: Invoice[], stripe: { name: string; email: string }[]): Customer[] {
  const map = new Map<string, Customer>();
  const key = (email: string, name: string) => (email || name).trim().toLowerCase();
  for (const s of stripe) map.set(key(s.email, s.name), { name: s.name || s.email, email: s.email, billed: 0, paid: 0, open: 0, invoices: 0 });
  for (const i of invoices) {
    if (i.status === 'void') continue;
    const k = key(i.email, i.customer);
    const c = map.get(k) ?? { name: i.customer, email: i.email, billed: 0, paid: 0, open: 0, invoices: 0 };
    const total = invoiceTotal(i);
    c.invoices += 1; c.billed = round2(c.billed + total);
    if (i.status === 'paid') c.paid = round2(c.paid + total); else if (i.status === 'sent') c.open = round2(c.open + total);
    map.set(k, c);
  }
  return [...map.values()].sort((a, b) => b.billed - a.billed || a.name.localeCompare(b.name));
}
