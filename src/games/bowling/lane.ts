// Bowling lane (rules borrowed from the Dashboard's Bowling,
// rebuilt flat for every device). Pure logic, so it can be tested.

const PIN_GAP = 0.48;

// Ten pins in the classic triangle, head pin nearest the player: [x, row].
export const PIN_SPOTS: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let r = 0; r < 4; r++) for (let i = 0; i <= r; i++) out.push([(i - r / 2) * PIN_GAP, r]);
  return out;
})();
export const fullRack = () => PIN_SPOTS.map(() => true);

// Points for a roll: a pin each, plus 10 for a strike (all ten on the first
// roll) or 5 for a spare (the rest on the second).
export function rollPoints(down: number, roll: 0 | 1, left: number): { points: number; kind: 'strike' | 'spare' | null } {
  if (down === 0) return { points: 0, kind: null }; // an empty rack is never a free strike
  if (left === 0 && roll === 0) return { points: down + 10, kind: 'strike' };
  if (left === 0 && roll === 1) return { points: down + 5, kind: 'spare' };
  return { points: down, kind: null };
}

// A flat drawing of a lane seen from behind the ball: depth 0 is the near
// end, 1 the far end. Things shrink with depth.
export const scaleAt = (d: number) => 1 / (1 + 1.5 * d);
const FAR = scaleAt(1);
export const yAt = (d: number) => 120 - (88 * (1 - scaleAt(d))) / (1 - FAR); // in a 100 x 130 view
export const halfWidthAt = (d: number) => 42 * scaleAt(d);
export const xAt = (laneX: number, d: number) => 50 + (laneX / 1.25) * halfWidthAt(d);
export const pinDepth = (row: number) => 0.62 + row * 0.08;

// ---- Real pin action (teacher, 2026-10-31: "unpredictability and
// irregularity in movement") ------------------------------------------------
// A small top-down physics run in inches: the ball rolls from the foul line
// with a hook, hits pins, and pins scatter into each other. Every collision
// gets a little random spin, nudged pins teeter and may or may not fall, so no
// two rolls play out the same. The whole run is worked out first, then drawn.

export const LANE_HALF = 20.75; // a lane is 41.5 inches wide
const HEAD_Y = 720; // the head pin is 60 feet from the foul line
const ROW_GAP = 10.39;
const PIN_R = 2.4, BALL_R = 4.3;
const PIN_M = 1, BALL_M = 4.5;
export const DECK_END = HEAD_Y + 3 * ROW_GAP + 26;
export const PIN_XY: [number, number][] = PIN_SPOTS.map(([, row], i) => {
  const inRow = i - (row * (row + 1)) / 2;
  return [(inRow - row / 2) * 12, HEAD_Y + row * ROW_GAP];
});

export interface SimFrame { t: number; ball: [number, number]; pins: [number, number, number][] } // pin: x, y, tilt 0..1
export interface SimResult { frames: SimFrame[]; down: number[]; wobbled: number[]; gutter: boolean; hitAt: number }

export interface RollPlan { aim: number; hook: number; speed?: number; magnet?: boolean; big?: boolean; bumpers?: boolean } // aim and hook: -1..1

export function simulateRoll(standing: boolean[], plan: RollPlan, rand: () => number = Math.random): SimResult {
  const ballR = plan.big ? BALL_R * 2.3 : BALL_R;
  const ballM = plan.big ? BALL_M * 3 : BALL_M;
  // Every throw is a little different: a wobble in the aim, speed and hook.
  let bx = plan.aim * 13 + (rand() - 0.5) * 3;
  let by = 0;
  const speed = (plan.speed ?? 1) * (290 + rand() * 40);
  let vx = 0, vy = speed;
  const hook = plan.hook * (7 + rand() * 3); // about a foot of curve at full spin
  let gutter = false;
  const pins = PIN_XY.map(([x, y], i) => ({ x, y, vx: 0, vy: 0, up: standing[i], moved: 0, peak: 0, tilt: standing[i] ? 0 : 1, gone: !standing[i] }));
  const frames: SimFrame[] = [];
  let t = 0, hitAt = -1;
  const dt = 1 / 240;
  const snap = () => frames.push({ t, ball: [bx, by], pins: pins.map((p) => [p.x, p.y, p.gone ? 1 : p.tilt]) });
  for (let step = 0; step < 240 * 6; step++) {
    // The ball: straight at first, then it breaks toward the pocket.
    if (!gutter) {
      if (by > 380) vx += hook * dt * 2.2;
      // Bumper rails bounce the ball back; without them it drops in the gutter.
      if (plan.bumpers && Math.abs(bx) > LANE_HALF - ballR) { bx = Math.sign(bx) * (LANE_HALF - ballR); vx = -vx * 0.55; }
      else if (Math.abs(bx) > LANE_HALF + 1) { gutter = by < HEAD_Y - 10; vx = 0; bx = Math.sign(bx) * (LANE_HALF + 3); }
    }
    bx += vx * dt; by += vy * dt;
    // Pins: slide, slow down, and bump each other.
    for (const p of pins) {
      if (p.gone) continue;
      p.x += p.vx * dt; p.y += p.vy * dt;
      const sp = Math.hypot(p.vx, p.vy);
      p.peak = Math.max(p.peak, sp);
      const f = Math.max(0, 1 - 1.7 * dt);
      p.vx *= f; p.vy *= f;
      if (plan.magnet && !gutter && by < HEAD_Y + 40) { const dx = bx - p.x, dy = by - p.y, d = Math.hypot(dx, dy); if (d < 30) { p.vx += (dx / d) * 260 * dt; p.vy += (dy / d) * 120 * dt; } }
      if (Math.abs(p.x) > LANE_HALF + 4 || p.y > DECK_END || p.y < HEAD_Y - 60) p.gone = true;
    }
    const hit = (ax: number, ay: number, ar: number, b: typeof pins[number], am: number, setA: (vx: number, vy: number) => void, avx: number, avy: number) => {
      const dx = b.x - ax, dy = b.y - ay, d = Math.hypot(dx, dy), min = ar + PIN_R;
      if (d >= min || d === 0) return;
      const nx = dx / d, ny = dy / d;
      const rel = (avx - b.vx) * nx + (avy - b.vy) * ny;
      if (rel <= 0) return;
      const e = 0.78;
      const j = ((1 + e) * rel) / (1 / am + 1 / PIN_M);
      // A random kick on every bump makes the scatter irregular.
      const kick = (rand() - 0.5) * 0.6;
      const kx = nx * Math.cos(kick) - ny * Math.sin(kick), ky = nx * Math.sin(kick) + ny * Math.cos(kick);
      b.vx += (j / PIN_M) * kx; b.vy += (j / PIN_M) * ky;
      setA(avx - (j / am) * nx, avy - (j / am) * ny);
      b.x = ax + nx * min; b.y = ay + ny * min;
    };
    if (!gutter) for (const p of pins) if (!p.gone) { const before = hitAt; hit(bx, by, ballR, p, ballM, (nvx, nvy) => { vx = nvx; vy = Math.max(nvy, speed * 0.55); }, vx, vy); if (before < 0 && Math.hypot(p.vx, p.vy) > 1) hitAt = t; }
    for (let a = 0; a < pins.length; a++) for (let b = a + 1; b < pins.length; b++) {
      const A = pins[a], B = pins[b];
      if (A.gone || B.gone) continue;
      hit(A.x, A.y, PIN_R, B, PIN_M, (nvx, nvy) => { A.vx = nvx; A.vy = nvy; }, A.vx, A.vy);
    }
    for (let k = 0; k < pins.length; k++) {
      const p = pins[k];
      p.moved = Math.hypot(p.x - PIN_XY[k][0], p.y - PIN_XY[k][1]);
      if (p.up && (p.peak > 45 || p.moved > 3.2)) p.tilt = Math.min(1, p.tilt + dt * 3.5);
    }
    if (step % 4 === 0) snap();
    t += dt;
    const still = pins.every((p) => p.gone || Math.hypot(p.vx, p.vy) < 2);
    if (by > DECK_END + 30 && still) break;
  }
  // Pins that were only nudged teeter; some fall over late, some stay up.
  const down: number[] = [];
  const wobbled: number[] = [];
  pins.forEach((p, i) => { if (standing[i] && (p.gone || p.tilt >= 1 || p.peak > 30 || p.moved > 3)) down.push(i); });
  // A pin brushed by a falling neighbor (or nudged) teeters: will it fall?
  pins.forEach((p, i) => {
    if (!standing[i] || down.includes(i)) return;
    const brushed = down.some((k) => !pins[k].gone && Math.hypot(pins[k].x - p.x, pins[k].y - p.y) < 9) || p.peak > 4 || p.moved > 0.4;
    if (brushed) { wobbled.push(i); if (rand() < 0.4) down.push(i); }
  });
  snap();
  return { frames, down, wobbled, gutter, hitAt };
}

// Pin Twister: the deck shakes; each standing pin may topple.
export function shakePins(standing: boolean[], rand: () => number = Math.random): number[] {
  return standing.map((up, i) => (up && rand() < 0.4 ? i : -1)).filter((i) => i >= 0);
}

// Deck inches to the drawing: x across the lane (-1.25..1.25) and depth (0..1).
export function toView(x: number, y: number): { laneX: number; d: number } {
  const laneX = (x / LANE_HALF) * 1.25;
  const d = y < HEAD_Y ? 0.62 * (y / HEAD_Y) : 0.62 + ((y - HEAD_Y) / ROW_GAP) * 0.08;
  return { laneX, d: Math.min(d, 0.97) };
}

// The computer aims at the pocket, a little off each time.
export function cpuPlan(rand: () => number = Math.random): RollPlan {
  return { aim: 0.3 + (rand() - 0.5) * 0.5, hook: -0.35 + (rand() - 0.5) * 0.6 };
}
