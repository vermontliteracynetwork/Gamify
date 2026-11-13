// Pinball table math (teacher, 2026-10-31). The ball starts at the bottom
// center and is shot up the lane the player picked (lanes 1 to 5 are only a
// choice: the ball never touches them), as hard as the power bar says,
// bouncing off the side walls. Reaching the top, it drops into one of the
// scoring pockets in a line across the top; too little power and it rolls
// back down the drain. All sizes are in a 100 x 130 view.

export const W = 100, H = 130;
export const WALL = 5;
export const ZONES = 5;
export const LANE_Y = 72; // the numbered lane band across the middle
export const LANE_H = 14;
export const ZONE_X = Array.from({ length: ZONES }, (_, i) => WALL + ((W - 2 * WALL) / ZONES) * (i + 0.5));
export const LAUNCH = { x: 50, y: 116 };
export const POCKET_TOP = 6;
export const POCKET_H = 17;
export const TOP_Y = POCKET_TOP + POCKET_H; // the ball drops into a pocket here
export const VALUES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
export const MAX_POCKETS = 10;

export interface Pt { x: number; y: number }

// Three pockets in round 1, one more each round, up to ten (teacher, 2026-10-31).
export const pocketCount = (round: number) => Math.min(MAX_POCKETS, 2 + Math.max(1, round));

// Point values: 10 to 100, higher ones rarer, and more common the further
// into the game (progress 0 = first round, 1 = last). Each value once a
// round, in no set order.
export function pickValues(n: number, progress: number, rand = Math.random): number[] {
  const left = [...VALUES];
  const out: number[] = [];
  const power = 2 - 1.6 * Math.min(1, Math.max(0, progress));
  while (out.length < n && left.length) {
    const weights = left.map((v) => (11 - v / 10) ** power);
    let r = rand() * weights.reduce((a, b) => a + b, 0);
    let i = 0;
    while (i < left.length - 1 && r >= weights[i]) { r -= weights[i]; i++; }
    out.push(left.splice(i, 1)[0]);
  }
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

// The pocket under a spot across the top.
export function pocketAt(x: number, count: number): number {
  const w = (W - 2 * WALL) / count;
  return Math.min(count - 1, Math.max(0, Math.floor((x - WALL) / w)));
}
export const pocketCenter = (i: number, count: number) => WALL + ((W - 2 * WALL) / count) * (i + 0.5);

// The ball (Golden Rule pass, 2026-10-31): a real little physics run, so no
// two shots are the same. The table tilts, so the ball slows as it climbs
// and falls back if the power was low. It bounces off the side walls, the
// pop bumpers kick it up and sideways, a ball that lands on the line between
// two pockets rattles before it drops, and a falling ball sometimes gets a
// lucky flip from the flippers. Every shot has a little wobble in its aim
// and power. Sizes are in the 100 x 130 view; times are in seconds.
export const BALL_R = 3.1;
export const BUMPERS: Pt[] = [{ x: 24, y: 44 }, { x: 50, y: 56 }, { x: 76, y: 44 }];
export const BUMPER_R = 5.2;
// Pegs (teacher, 2026-11-13): 2 to 6 in new random spots every turn, more as
// the game goes on. Stars float between them; the ball collects any it touches.
export const PEG_R = 3.4;
export const STAR_R = 3.6;
export const SHOT_POWER = 0.82; // every shot has the same power (no power bar)
export const pegCount = (progress: number) => Math.min(6, 2 + Math.round(Math.min(1, Math.max(0, progress)) * 4));
// Random spots in the open middle of the table, never touching each other.
export function scatter(n: number, avoid: Pt[] = [], gap = 13, rand = Math.random): Pt[] {
  const out: Pt[] = [];
  for (let tries = 0; out.length < n && tries < 400; tries++) {
    // Above or below the lane band (so nothing hides under it), clear of the side kickers.
    const low = rand() < 0.3;
    const p = low ? { x: 24 + rand() * 52, y: 82 + rand() * 8 } : { x: 14 + rand() * 72, y: TOP_Y + 12 + rand() * 28 };
    if ([...out, ...avoid].every((q) => Math.hypot(q.x - p.x, q.y - p.y) >= gap)) out.push(p);
  }
  return out;
}
export const FLIP_Y = 110;
const GRAVITY = 24;
const STEP = 1 / 240;
// The rails that guide a falling ball to the flippers, and the kickers on them.
export const RAILS: [Pt, Pt][] = [[{ x: 5.5, y: 88 }, { x: 22, y: 109 }], [{ x: 94.5, y: 88 }, { x: 78, y: 109 }]];
export const KICKERS: [Pt, Pt][] = [[{ x: 12, y: 84 }, { x: 19.5, y: 99.5 }], [{ x: 88, y: 84 }, { x: 80.5, y: 99.5 }]];
export const FLIPPER_SPAN = { from: 24, to: 76 };

export type ShotEvent = { t: number; kind: 'wall' | 'bumper' | 'rattle' | 'flip' | 'top' | 'star'; x: number; y: number; i?: number };
export interface Frame { t: number; x: number; y: number }
export interface Shot { frames: Frame[]; pocket: number | null; events: ShotEvent[]; bounces: number; bumps: number; flipped: boolean; rattled: boolean; dur: number }
export interface ShotOptions {
  count: number; // pockets on the table
  sure?: boolean; // a super shot always reaches a pocket
  magnetTo?: number; // a jackpot magnet pulls the ball to this pocket at the top
  luck?: number; // chance of a lucky flip when the ball falls back (default 0.12)
  rails?: boolean; // the rails and kickers down to the flippers (default on)
  pegs?: Pt[]; // the bumpers this turn (default: the three fixed bumpers)
  pegR?: number;
  stars?: Pt[]; // stars the ball can collect (event 'star', i = which)
  rand?: () => number;
}

export function simulateShot(zone: number, power: number, o: ShotOptions): Shot {
  const rand = o.rand ?? Math.random;
  const p = Math.min(1, Math.max(0, power)) * (0.95 + rand() * 0.1);
  let vy = -(40 + p * 66);
  if (o.sure) vy = Math.min(vy, -80);
  const aim = ZONE_X[zone] - LAUNCH.x + (rand() - 0.5) * 6; // a little wobble in the aim
  let vx = (vy * aim) / (LANE_Y - LAUNCH.y);
  let x = LAUNCH.x, y = LAUNCH.y, t = 0, play = 0;
  const frames: Frame[] = [{ t: 0, x, y }];
  const events: ShotEvent[] = [];
  const pegs = o.pegs ?? BUMPERS;
  const pegR = o.pegR ?? (o.pegs ? PEG_R : BUMPER_R);
  const cool = pegs.map(() => -1);
  const got = new Set<number>();
  let bounces = 0, bumps = 0, flips = 0, steps = 0;
  const lo = WALL + BALL_R, hi = W - WALL - BALL_R;
  const add = (kind: ShotEvent['kind'], i?: number) => events.push({ t: play, kind, x, y, ...(i === undefined ? {} : { i }) });
  while (t < 8) {
    vy += GRAVITY * STEP;
    x += vx * STEP; y += vy * STEP; t += STEP;
    // Slow at the top of a climb that falls just short (a near miss to watch),
    // quicker on the way back down.
    play += STEP * (y < TOP_Y + 14 && Math.abs(vy) < 14 ? 1.6 : vy > 0 ? 0.7 : 1);
    if (x < lo || x > hi) {
      x = x < lo ? 2 * lo - x : 2 * hi - x;
      vx = -vx * (0.86 + rand() * 0.1);
      bounces++; add('wall');
    }
    o.stars?.forEach((s, i) => { if (!got.has(i) && Math.hypot(x - s.x, y - s.y) < STAR_R + BALL_R) { got.add(i); add('star', i); } });
    pegs.forEach((b, i) => {
      const dx = x - b.x, dy = y - b.y, d = Math.hypot(dx, dy);
      if (d >= pegR + BALL_R || t < cool[i]) return;
      const nx = dx / d, ny = dy / d;
      x = b.x + nx * (pegR + BALL_R); y = b.y + ny * (pegR + BALL_R);
      const vn = vx * nx + vy * ny;
      if (vn < 0) { vx -= 2 * vn * nx; vy -= 2 * vn * ny; }
      // A pop bumper kicks the ball away, up and to the side, a bit differently each time.
      // From below it usually pops back up: almost always when it comes in
      // fast, a coin flip when it barely gets there (that is the gamble).
      const pop = ny > 0 && rand() < 0.45 + 0.5 * Math.min(1, Math.max(0, (Math.hypot(vx, vy) - 40) / 50));
      if (pop) vy = -Math.abs(vy);
      const speed = Math.hypot(vx, vy) * (0.95 + rand() * 0.1);
      let a = Math.atan2(vy, vx) + (rand() - 0.5) * 0.5;
      if (pop && Math.sin(a) > -0.35) a = Math.atan2(-0.6, Math.cos(a) >= 0 ? 1 : -1);
      vx = Math.cos(a) * speed + nx * 8; vy = Math.sin(a) * speed;
      cool[i] = t + 0.1; bumps++; add('bumper', i);
    });
    // The rails slide a falling ball toward the flippers; the kickers push it off.
    // (Only a falling ball meets them: the launch passes over, like a ramp.)
    if (o.rails !== false && vy > 0) {
      for (const [seg, kick] of [...RAILS.map((r) => [r, 0] as const), ...KICKERS.map((k) => [k, 10] as const)]) {
        const [a, b] = seg;
        const ex = b.x - a.x, ey = b.y - a.y, len2 = ex * ex + ey * ey;
        const k = Math.max(0, Math.min(1, ((x - a.x) * ex + (y - a.y) * ey) / len2));
        const cx = a.x + ex * k, cy = a.y + ey * k;
        const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
        if (d >= BALL_R || d === 0) continue;
        const nx = dx / d, ny = dy / d;
        x = cx + nx * BALL_R; y = cy + ny * BALL_R;
        const vn = vx * nx + vy * ny;
        if (vn < 0) { vx -= (kick ? 1.7 : 1.3) * vn * nx; vy -= (kick ? 1.7 : 1.3) * vn * ny; }
        if (kick && vn < -5) { vx += nx * kick; vy += ny * kick; bounces++; add('wall'); }
      }
    }
    if (++steps % 2 === 0) frames.push({ t: play, x, y });
    if (y <= TOP_Y) {
      add('top');
      return finishTop({ frames, events, x, play, count: o.count, magnetTo: o.magnetTo, rand, bounces, bumps, flipped: flips > 0 });
    }
    if (vy > 0 && y >= FLIP_Y) {
      // A lucky flip sends it back up; a sure shot always gets one.
      const onFlipper = x >= FLIPPER_SPAN.from && x <= FLIPPER_SPAN.to;
      if ((o.sure && flips < 6) || (onFlipper && flips === 0 && rand() < (o.luck ?? 0.12))) {
        flips++; add('flip');
        vy = -(o.sure ? 85 + rand() * 15 : 62 + rand() * 40);
        vx = (LAUNCH.x - x) * 0.4 + (rand() - 0.5) * 50;
        continue;
      }
      // Down the drain between the flippers.
      // Down the drain: it rolls to the gap between the flippers and drops.
      const roll = Math.abs(x - LAUNCH.x) * 0.012;
      frames.push({ t: play, x, y }, { t: play + roll, x: LAUNCH.x + Math.sign(x - LAUNCH.x) * Math.min(Math.abs(x - LAUNCH.x), 4), y: 114 }, { t: play + roll + 0.25, x: LAUNCH.x, y: H - 4 });
      return { frames, pocket: null, events, bounces, bumps, flipped: flips > 0, rattled: false, dur: play + roll + 0.25 };
    }
  }
  // A ball that never settles (very rare) goes straight up to the nearest pocket.
  add('top');
  return finishTop({ frames, events, x, play, count: o.count, magnetTo: o.magnetTo, rand, bounces, bumps, flipped: flips > 0 });
}

function finishTop(a: { frames: Frame[]; events: ShotEvent[]; x: number; play: number; count: number; magnetTo?: number; rand: () => number; bounces: number; bumps: number; flipped: boolean }): Shot {
  const { frames, events, count, rand } = a;
  let { x, play } = a;
  const into = POCKET_TOP + POCKET_H * 0.45;
  let rattled = false;
  frames.push({ t: play, x, y: TOP_Y });
  if (a.magnetTo !== undefined) {
    // The magnet rolls the ball along the top to the big pocket.
    const to = pocketCenter(a.magnetTo, count);
    play += 0.15 + Math.abs(to - x) * 0.012;
    x = to;
    frames.push({ t: play, x, y: TOP_Y - 1 });
  } else {
    // On the line between two pockets: it rattles, then drops into one.
    const w = (W - 2 * WALL) / count;
    const k = Math.round((x - WALL) / w);
    const line = WALL + k * w;
    if (k > 0 && k < count && Math.abs(x - line) < 1.5) {
      rattled = true;
      const side = rand() < 0.5 ? -1 : 1;
      for (const [dx, dy] of [[-1.8, 2.2], [1.6, 1.2], [-1.1, 1.6], [0.7, 0.8]] as const) {
        play += 0.1; frames.push({ t: play, x: line + dx, y: TOP_Y + dy });
        events.push({ t: play, kind: 'rattle', x: line + dx, y: TOP_Y + dy });
      }
      x = line + side * Math.min(w / 2 - 1, 3);
    }
  }
  play += 0.18;
  frames.push({ t: play, x, y: into });
  return { frames, pocket: pocketAt(x, count), events, bounces: a.bounces, bumps: a.bumps, flipped: a.flipped, rattled, dur: play };
}

// Where the ball is at a moment of the shot.
export function frameAt(frames: Frame[], t: number): Pt {
  if (t <= 0) return frames[0];
  let lo = 0, hi = frames.length - 1;
  if (t >= frames[hi].t) return frames[hi];
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (frames[mid].t <= t) lo = mid; else hi = mid; }
  const a = frames[lo], b = frames[hi];
  const k = b.t > a.t ? (t - a.t) / (b.t - a.t) : 1;
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
}

// A small seeded random, so tests (and replays) can repeat a shot exactly.
export function seeded(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
}
