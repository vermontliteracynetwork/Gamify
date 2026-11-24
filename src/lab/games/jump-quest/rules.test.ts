import { describe, expect, it } from 'vitest';
import { BASE, COYOTE, cpuInput, GROUND, grumbleTouch, makeLevel, step, type Body, type Solid } from './rules';

const body = (x: number, y: number): Body => ({ x, y, w: 30, h: 36, vx: 0, vy: 0, onGround: false, coyote: 0, buffer: 0, jumping: false });
const floor: Solid[] = [{ id: 0, x: 0, y: GROUND, w: 400, h: 200, kind: 'ground' }];
const idle = { dir: 0, jump: false, jumpPressed: false };

describe('jump quest', () => {
  it('makes a level with mystery boxes and a flag', () => {
    for (let i = 0; i < 20; i++) {
      const lv = makeLevel();
      expect(lv.solids.filter((s) => s.kind === 'q').length).toBeGreaterThanOrEqual(2);
      expect(lv.flagX).toBeLessThan(lv.width);
      expect(lv.coins.length).toBeGreaterThan(5);
    }
  });
  it('falls and lands on the ground', () => {
    const b = body(50, GROUND - 120);
    for (let i = 0; i < 60; i++) step(b, idle, floor, 1 / 60);
    expect(b.onGround).toBe(true);
    expect(b.y + b.h).toBe(GROUND);
  });
  it('jumps a moment after running off a ledge (coyote time), not long after', () => {
    const b = body(372, GROUND - 36);
    step(b, idle, floor, 1 / 60);
    expect(b.onGround).toBe(true);
    b.x = 402; // just past the edge
    step(b, idle, floor, 1 / 60);
    step(b, { dir: 0, jump: true, jumpPressed: true }, floor, 1 / 60);
    expect(b.vy).toBeLessThan(0);
    const late = body(372, GROUND - 36);
    step(late, idle, floor, 1 / 60);
    late.x = 402;
    for (let t = 0; t < COYOTE + 0.1; t += 1 / 60) step(late, idle, floor, 1 / 60);
    step(late, { dir: 0, jump: true, jumpPressed: true }, floor, 1 / 60);
    expect(late.vy).toBeGreaterThan(0);
  });
  it('bumps a block overhead', () => {
    const solids: Solid[] = [...floor, { id: 9, x: 40, y: GROUND - 160, w: 40, h: 40, kind: 'q' }];
    const b = body(45, GROUND - 36);
    step(b, idle, solids, 1 / 60);
    let head: Solid | null = null;
    for (let i = 0; i < 40 && !head; i++) head = step(b, { dir: 0, jump: true, jumpPressed: i === 0 }, solids, 1 / 60, BASE);
    expect(head?.id).toBe(9);
  });
  it('stomps from above, bumps from the side', () => {
    const g = { x: 100, y: GROUND - 30, vx: 0, min: 0, max: 200, alive: true, squash: 0 };
    const above = { ...body(90, GROUND - 30 - 30), vy: 300 };
    expect(grumbleTouch(above, g)).toBe('stomp');
    expect(grumbleTouch(body(80, GROUND - 36), g)).toBe('bump');
  });
  it('the computer jumps at a gap', () => {
    const b = body(372, GROUND - 36); b.onGround = true;
    expect(cpuInput(b, { solids: floor, coins: [], grumbles: [], flagX: 900, width: 1000, spawn: { x: 0, y: 0 } }).jumpPressed).toBe(true);
  });
});
