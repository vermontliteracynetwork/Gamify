import { describe, expect, it } from 'vitest';
import { aging, categorize, customers, fromStripe, nextInvoiceNumber, profitAndLoss, quickbooksCsv, scheduleC, type Entry, type Invoice } from './model';

const charge = fromStripe({ id: 'txn_1', created: Date.UTC(2027, 0, 5) / 1000, type: 'charge', reporting_category: 'charge', amount: 9600, fee: 308, net: 9292, description: 'Plus yearly', customer: 'a@school.org' });
const payout = fromStripe({ id: 'txn_2', created: Date.UTC(2027, 0, 8) / 1000, type: 'payout', reporting_category: 'payout', amount: -9292, fee: 0, net: -9292, description: 'STRIPE PAYOUT' });
const refund = fromStripe({ id: 'txn_3', created: Date.UTC(2027, 1, 2) / 1000, type: 'refund', reporting_category: 'refund', amount: -1500, fee: 0, net: -1500, description: 'Refund Pro' });
const hosting: Entry = { id: 'm1', date: '2027-02-10', kind: 'out', category: 'Other', description: 'Vercel Pro plan', amount: 20, fee: 0, source: 'manual' };

describe('Gamify Books', () => {
  it('turns Stripe rows into income, refunds and bank transfers', () => {
    expect(charge).toMatchObject({ kind: 'in', category: 'Subscriptions', amount: 96, fee: 3.08, date: '2027-01-05' });
    expect(payout).toMatchObject({ kind: 'transfer', amount: 92.92 });
    expect(refund).toMatchObject({ kind: 'out', category: 'Refunds', amount: 15 });
  });
  it('applies rules, and a hand-picked category wins', () => {
    const rules = [{ id: 'r', contains: 'vercel', category: 'Hosting' }];
    expect(categorize([hosting], rules, {})[0].category).toBe('Hosting');
    expect(categorize([hosting], rules, { m1: 'Software' })[0].category).toBe('Software');
  });
  it('builds Profit and Loss with fees as an expense and payouts left out', () => {
    const p = profitAndLoss(categorize([charge, payout, refund, hosting], [{ id: 'r', contains: 'vercel', category: 'Hosting' }], {}), '2027');
    expect(p.totalIncome).toBe(96);
    expect(p.totalExpenses).toBe(38.08);
    expect(p.net).toBe(57.92);
    expect(p.expenses.find((l) => l.category === 'Stripe fees')?.byMonth[0]).toBe(3.08);
    expect(scheduleC(p)[0]).toEqual({ line: '1 Gross receipts', total: 96 });
  });
  it('writes the QuickBooks three-column upload', () => {
    expect(quickbooksCsv([charge, payout]).split('\n')).toEqual([
      'Date,Description,Amount', '01/05/2027,"Plus yearly (Subscriptions)",96.00', '01/05/2027,"Stripe fee: Plus yearly (Stripe fees)",-3.08',
    ]);
  });
  it('numbers invoices, ages what is owed and totals customers', () => {
    const inv = (n: string, due: string, status: Invoice['status']): Invoice => ({ id: n, number: n, customer: 'Barre SU', email: 'ap@barre.org', po: 'PO1', issued: '2027-01-01', due, lines: [{ description: 'Seats', qty: 10, price: 115 }], status });
    const all = [inv('G2027-001', '2027-01-31', 'sent'), inv('G2027-002', '2027-03-31', 'sent'), inv('G2027-003', '2027-01-31', 'paid')];
    expect(nextInvoiceNumber(all, '2027')).toBe('G2027-004');
    expect(aging(all, '2027-03-01').map((a) => a.total)).toEqual([1150, 1150, 0, 0]);
    expect(customers(all, [])[0]).toMatchObject({ billed: 3450, paid: 1150, open: 2300, invoices: 3 });
  });
});
