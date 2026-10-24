import { PRICES_USD_PER_YEAR, schoolQuote } from '../config';

// Income projection for the owner dashboard: yearly plans billed once a
// year, shown as monthly recurring revenue, then projected forward with a
// monthly growth rate in new subscribers.
export interface Subs { plus: number; pro: number; schoolSeats: number }

export function monthlyRevenue(s: Subs): number {
  const school = schoolQuote(s.schoolSeats)?.total ?? 0;
  return Math.round(((s.plus * PRICES_USD_PER_YEAR.plus) + (s.pro * PRICES_USD_PER_YEAR.pro) + school) / 12);
}

export function project(s: Subs, monthlyGrowth: number, months: number): number {
  let total = 0;
  let mrr = monthlyRevenue(s);
  for (let m = 0; m < months; m++) { total += mrr; mrr *= 1 + monthlyGrowth; }
  return Math.round(total);
}
