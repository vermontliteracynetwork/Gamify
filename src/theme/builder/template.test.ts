import { describe, expect, it } from 'vitest';
import { codeBits, outlineBox, PAGE } from './template';
import { homography, project } from './scan';

describe('theme template', () => {
  it('fits each piece outline inside the page at its own shape', () => {
    for (const p of [{ width: 1920, height: 1080 }, { width: 128, height: 128 }, { width: 300, height: 220 }]) {
      const b = outlineBox(p);
      expect(b.width / b.height).toBeCloseTo(p.width / p.height, 5);
      expect(b.x).toBeGreaterThan(0);
      expect(b.x + b.width).toBeLessThan(PAGE.width);
      expect(b.y + b.height).toBeLessThan(PAGE.height);
    }
  });

  it('writes page numbers as five bits', () => {
    expect(codeBits(1)).toEqual([0, 0, 0, 0, 1]);
    expect(codeBits(6)).toEqual([0, 0, 1, 1, 0]);
  });

  it('maps a tilted photo back onto the page', () => {
    const page: [number, number][] = [[0, 0], [100, 0], [100, 100], [0, 100]];
    const photo: [number, number][] = [[10, 20], [210, 30], [200, 240], [5, 220]];
    const h = homography(page, photo);
    page.forEach((p, i) => {
      const [u, v] = project(h, ...p);
      expect(u).toBeCloseTo(photo[i][0], 6);
      expect(v).toBeCloseTo(photo[i][1], 6);
    });
  });
});
