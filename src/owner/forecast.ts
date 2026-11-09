import { PRICES_USD_PER_YEAR, schoolQuote } from '../config';

// Income forecast for the production line (2026-11-09): paid accounts grow
// by a monthly rate and lose a monthly churn; income is the yearly price
// spread over 12 months. Three lines: slower, expected, faster.
export interface PlanCounts { plus: number; pro: number; homeschool: number; schoolSeats: number }
export interface Point { date: Date; mrr: number; total: number }

export function mrrOf(c: PlanCounts): number {
  const school = schoolQuote(Math.round(c.schoolSeats))?.total ?? 0;
  return (c.plus * PRICES_USD_PER_YEAR.plus + c.pro * PRICES_USD_PER_YEAR.pro + c.homeschool * PRICES_USD_PER_YEAR.homeschool + school) / 12;
}

export function forecast(start: PlanCounts, growth: number, churn: number, months: number, from = new Date()): Point[] {
  const out: Point[] = [];
  let c = { ...start };
  let total = 0;
  const f = 1 + growth - churn;
  for (let m = 1; m <= months; m++) {
    const date = new Date(from.getFullYear(), from.getMonth() + m, 1);
    const mrr = mrrOf(c);
    total += mrr;
    out.push({ date, mrr: Math.round(mrr), total: Math.round(total) });
    c = { plus: c.plus * f, pro: c.pro * f, homeschool: c.homeschool * f, schoolSeats: c.schoolSeats * f };
  }
  return out;
}

export const SCENARIOS = [
  { id: 'slow', factor: 0.5 },
  { id: 'expected', factor: 1 },
  { id: 'fast', factor: 1.6 },
] as const;
