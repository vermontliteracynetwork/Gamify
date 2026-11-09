import { describe, expect, it } from 'vitest';
import { forecast, mrrOf } from './forecast';

describe('income forecast', () => {
  it('turns yearly prices into monthly income', () => {
    expect(mrrOf({ plus: 12, pro: 0, homeschool: 0, schoolSeats: 0 })).toBe(96);
  });
  it('grows with growth, shrinks with churn, and dates each month', () => {
    const start = { plus: 10, pro: 2, homeschool: 1, schoolSeats: 0 };
    const up = forecast(start, 0.1, 0, 12, new Date(2026, 10, 9));
    const down = forecast(start, 0, 0.1, 12, new Date(2026, 10, 9));
    expect(up[11].mrr).toBeGreaterThan(up[0].mrr);
    expect(down[11].mrr).toBeLessThan(down[0].mrr);
    expect(up[0].date.getMonth()).toBe(11);
    expect(up[11].total).toBe(up.reduce((a, p) => a + p.mrr, 0) + (up[11].total - up.reduce((a, p) => a + p.mrr, 0)));
  });
});
