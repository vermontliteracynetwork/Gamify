import { describe, expect, it } from 'vitest';
import { cpuLane, fullRack, knockPins, LANES, PIN_SPOTS, rollPoints, yAt } from './lane';

describe('space bowling lane', () => {
  it('ten pins in a triangle', () => expect(PIN_SPOTS).toHaveLength(10));

  it('a roll only knocks standing pins, and the middle lane knocks the most', () => {
    let middle = 0, edge = 0;
    for (let n = 0; n < 300; n++) {
      middle += knockPins(2, fullRack()).down.length;
      edge += knockPins(0, fullRack()).down.length;
    }
    expect(middle).toBeGreaterThan(edge);
    const standing = fullRack().map((_, i) => i > 5);
    for (let n = 0; n < 50; n++) for (const i of knockPins(2, standing).down) expect(standing[i]).toBe(true);
  });

  it('strikes and spares earn a bonus', () => {
    expect(rollPoints(10, 0, 0)).toEqual({ points: 20, kind: 'strike' });
    expect(rollPoints(3, 1, 0)).toEqual({ points: 8, kind: 'spare' });
    expect(rollPoints(4, 0, 6)).toEqual({ points: 4, kind: null });
  });

  it('the computer picks a real lane; the far end draws higher up', () => {
    for (let n = 0; n < 50; n++) expect(cpuLane()).toBeLessThan(LANES);
    expect(yAt(1)).toBeLessThan(yAt(0));
  });
});
