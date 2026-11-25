import { describe, expect, it } from 'vitest';
import { monthlyRevenue, project } from './income';

describe('owner income projection', () => {
  it('turns yearly plans into monthly revenue', () => {
    expect(monthlyRevenue({ plus: 12, pro: 0, schoolSeats: 0 })).toBe(77);
    expect(monthlyRevenue({ plus: 0, pro: 0, schoolSeats: 10 })).toBe(96); // 10 seats at $115
  });
  it('projects with growth', () => {
    expect(project({ plus: 12, pro: 0, schoolSeats: 0 }, 0, 12)).toBe(924);
    expect(project({ plus: 12, pro: 0, schoolSeats: 0 }, 0.1, 3)).toBe(255);
  });
});
