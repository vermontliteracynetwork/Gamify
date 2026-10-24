import { describe, expect, it } from 'vitest';
import { monthlyRevenue, project } from './income';

describe('owner income projection', () => {
  it('turns yearly plans into monthly revenue', () => {
    expect(monthlyRevenue({ plus: 12, pro: 0, schoolSeats: 0 })).toBe(96);
    expect(monthlyRevenue({ plus: 0, pro: 0, schoolSeats: 10 })).toBe(120); // 10 seats at $144
  });
  it('projects with growth', () => {
    expect(project({ plus: 12, pro: 0, schoolSeats: 0 }, 0, 12)).toBe(1152);
    expect(project({ plus: 12, pro: 0, schoolSeats: 0 }, 0.1, 3)).toBe(Math.round(96 + 105.6 + 116.16));
  });
});
