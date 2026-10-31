import { describe, expect, it } from 'vitest';
import { PIN_SPOTS, rollPoints, yAt } from './lane';

describe('bowling lane', () => {
  it('ten pins in a triangle', () => expect(PIN_SPOTS).toHaveLength(10));

  it('strikes and spares earn a bonus, and an empty roll earns nothing', () => {
    expect(rollPoints(10, 0, 0)).toEqual({ points: 20, kind: 'strike' });
    expect(rollPoints(3, 1, 0)).toEqual({ points: 8, kind: 'spare' });
    expect(rollPoints(4, 0, 6)).toEqual({ points: 4, kind: null });
    expect(rollPoints(0, 1, 0)).toEqual({ points: 0, kind: null });
  });

  it('the far end draws higher up', () => expect(yAt(1)).toBeLessThan(yAt(0)));
});

describe('pin action', () => {
  it('a pocket hit knocks most pins, a gutter ball none, and rolls vary', async () => {
    const { simulateRoll, fullRack } = await import('./lane');
    const strikes: number[] = [];
    for (let k = 0; k < 60; k++) strikes.push(simulateRoll(fullRack(), { aim: 0.12, hook: -0.2 }).down.length);
    const avg = strikes.reduce((a, b) => a + b, 0) / strikes.length;
    expect(avg).toBeGreaterThan(5.5);
    expect(new Set(strikes).size).toBeGreaterThan(2); // not the same every time
    // Aim at the edge and spin outward: mostly gutter balls, and a gutter ball knocks nothing.
    const gs = Array.from({ length: 30 }, () => simulateRoll(fullRack(), { aim: 1, hook: 1 }));
    expect(gs.filter((g) => g.gutter).length).toBeGreaterThan(15);
    for (const g of gs) if (g.gutter) expect(g.down.length).toBe(0);
    const edge: number[] = [];
    for (let k = 0; k < 60; k++) edge.push(simulateRoll(fullRack(), { aim: 0.92, hook: 0.6 }).down.length);
    expect(edge.reduce((a, b) => a + b, 0) / edge.length).toBeLessThan(avg);
  });
  it('pins already down stay down, and the run ends', async () => {
    const { simulateRoll, fullRack } = await import('./lane');
    const rack = fullRack(); rack[0] = false; rack[1] = false;
    const r = simulateRoll(rack, { aim: 0, hook: 0 });
    expect(r.down).not.toContain(0);
    expect(r.frames.length).toBeGreaterThan(20);
  });
});
