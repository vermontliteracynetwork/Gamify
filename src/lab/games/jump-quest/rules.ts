// Jump Quest rules: the level maker and the run-and-jump physics, kept
// apart from the drawing so they can be tested. Units are world pixels.

export const VW = 800; // the view is 800 x 450 world pixels
export const VH = 450;
export const T = 40; // one tile
export const GROUND = VH - 2 * T; // the top of the ground

export type SolidKind = 'ground' | 'block' | 'q' | 'used' | 'cloud';
export interface Solid { id: number; x: number; y: number; w: number; h: number; kind: SolidKind; bump?: number }
export interface Coin { x: number; y: number; got: boolean }
export interface Grumble { x: number; y: number; vx: number; min: number; max: number; alive: boolean; squash: number }
export interface Level { solids: Solid[]; coins: Coin[]; grumbles: Grumble[]; flagX: number; width: number; spawn: { x: number; y: number } }

// A short level of random chunks: gaps, stairs, floating ledges, rows of
// mystery boxes and patrolling grumbles, always with two or more mystery
// boxes and a flag at the end.
export function makeLevel(rand: () => number = Math.random, chunks = 9): Level {
  const solids: Solid[] = [];
  const coins: Coin[] = [];
  const grumbles: Grumble[] = [];
  let id = 0, x = 0, qCount = 0;
  const ground = (from: number, tiles: number) => solids.push({ id: id++, x: from, y: GROUND, w: tiles * T, h: VH - GROUND + 200, kind: 'ground' });
  const block = (bx: number, by: number, kind: SolidKind = 'block', w = T) => solids.push({ id: id++, x: bx, y: by, w, h: T, kind });
  const coinRow = (cx: number, cy: number, n: number, arc = 0) => { for (let i = 0; i < n; i++) coins.push({ x: cx + i * 34, y: cy - Math.sin((i / Math.max(1, n - 1)) * Math.PI) * arc, got: false }); };

  ground(0, 8); coinRow(4 * T, GROUND - 30, 3); x = 8 * T;
  const kinds = ['gap', 'stairs', 'ledge', 'qrow', 'grumble', 'gap', 'qrow', 'cloud', 'grumble'];
  for (let c = 0; c < chunks; c++) {
    let kind = kinds[Math.floor(rand() * kinds.length)];
    if (c === 1 && qCount === 0) kind = 'qrow';
    if (c === chunks - 2 && qCount < 2) kind = 'qrow';
    if (kind === 'gap') {
      const gap = 2 + Math.floor(rand() * 2);
      coinRow(x + 6, GROUND - 60, gap + 1, 50);
      x += gap * T; ground(x, 4); x += 4 * T;
    } else if (kind === 'stairs') {
      ground(x, 9);
      for (let s = 0; s < 3; s++) for (let h = 0; h <= s; h++) block(x + (2 + s) * T, GROUND - (h + 1) * T);
      for (let s = 0; s < 2; s++) for (let h = 0; h <= 1 - s; h++) block(x + (5 + s) * T, GROUND - (h + 1) * T);
      coinRow(x + 4 * T + 3, GROUND - 4 * T - 20, 2);
      x += 9 * T;
    } else if (kind === 'ledge') {
      ground(x, 8);
      block(x + 2 * T, GROUND - 3 * T, 'block', 4 * T);
      coinRow(x + 2 * T + 12, GROUND - 3 * T - 28, 4);
      x += 8 * T;
    } else if (kind === 'qrow') {
      ground(x, 8);
      block(x + 2 * T, GROUND - 4 * T); block(x + 3 * T, GROUND - 4 * T, 'q'); block(x + 4 * T, GROUND - 4 * T);
      qCount++;
      if (rand() < 0.5) { block(x + 6 * T, GROUND - 4 * T, 'q'); qCount++; }
      coinRow(x + 2 * T + 6, GROUND - 5 * T - 20, 3);
      x += 8 * T;
    } else if (kind === 'cloud') {
      const gap = 4;
      block(x + T, GROUND - 2 * T, 'cloud', 2 * T);
      coinRow(x + T + 10, GROUND - 3 * T, 2);
      x += gap * T; ground(x, 4); x += 4 * T;
    } else {
      ground(x, 10);
      grumbles.push({ x: x + 6 * T, y: GROUND - 30, vx: rand() < 0.5 ? -60 : 60, min: x + 2 * T, max: x + 9 * T, alive: true, squash: 0 });
      coinRow(x + 3 * T, GROUND - 30, 4);
      x += 10 * T;
    }
  }
  ground(x, 10);
  const flagX = x + 6 * T;
  x += 10 * T;
  return { solids, coins, grumbles, flagX, width: x, spawn: { x: 2 * T, y: GROUND - 40 } };
}

export interface Body { x: number; y: number; w: number; h: number; vx: number; vy: number; onGround: boolean; coyote: number; buffer: number; jumping: boolean }
export interface Input { dir: number; jump: boolean; jumpPressed: boolean }
export interface Tuning { speed: number; jump: number; gravity: number; fly: boolean; bouncy: boolean }
export const BASE: Tuning = { speed: 270, jump: 760, gravity: 2200, fly: false, bouncy: false };
export const COYOTE = 0.1;
export const BUFFER = 0.13;

const overlap = (a: { x: number; y: number; w: number; h: number }, b: Solid) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// One physics step. Returns the solid bumped from below (a head hit), if any.
export function step(b: Body, input: Input, solids: Solid[], dt: number, tune: Tuning = BASE): Solid | null {
  // Run: quick to start, quick to stop on the ground, a bit floaty in the air.
  const accel = b.onGround ? 2600 : 1700;
  const target = input.dir * tune.speed;
  if (input.dir) b.vx += Math.sign(target - b.vx) * Math.min(Math.abs(target - b.vx), accel * dt);
  else b.vx -= Math.sign(b.vx) * Math.min(Math.abs(b.vx), (b.onGround ? 2400 : 600) * dt);

  // Jump with coyote time (a moment after leaving a ledge) and a buffer (a
  // press just before landing still counts).
  b.coyote = b.onGround ? COYOTE : Math.max(0, b.coyote - dt);
  b.buffer = input.jumpPressed ? BUFFER : Math.max(0, b.buffer - dt);
  if ((b.buffer > 0 || (tune.bouncy && b.onGround)) && b.coyote > 0) {
    b.vy = -tune.jump; b.coyote = 0; b.buffer = 0; b.jumping = true; b.onGround = false;
  }
  if (tune.fly && input.jump) b.vy = Math.max(b.vy - 3400 * dt, -420);
  // Let go early for a short hop.
  if (!input.jump && b.jumping && b.vy < -260 && !tune.bouncy) b.vy *= 0.55;
  if (b.vy >= 0) b.jumping = false;
  b.vy = Math.min(900, b.vy + tune.gravity * dt);

  // Move one axis at a time and push out of anything solid.
  const near = solids.filter((s) => s.x < b.x + b.w + 80 && s.x + s.w > b.x - 80);
  b.x += b.vx * dt;
  for (const s of near) if (s.kind !== 'cloud' && overlap(b, s)) { if (b.vx > 0) b.x = s.x - b.w; else if (b.vx < 0) b.x = s.x + s.w; b.vx = 0; }
  const prevBottom = b.y + b.h;
  b.y += b.vy * dt;
  b.onGround = false;
  let head: Solid | null = null;
  for (const s of near) {
    if (!overlap(b, s)) continue;
    // Clouds hold you up from above only.
    if (s.kind === 'cloud') { if (b.vy >= 0 && prevBottom <= s.y + 2) { b.y = s.y - b.h; b.vy = 0; b.onGround = true; } continue; }
    if (b.vy > 0) { b.y = s.y - b.h; b.vy = 0; b.onGround = true; }
    else if (b.vy < 0) { b.y = s.y + s.h; b.vy = 0; b.jumping = false; if (!head || Math.abs(s.x + s.w / 2 - (b.x + b.w / 2)) < Math.abs(head.x + head.w / 2 - (b.x + b.w / 2))) head = s; }
  }
  return head;
}

// Landing on a grumble from above stomps it; touching it from the side bumps you.
export function grumbleTouch(b: Body, g: Grumble): 'stomp' | 'bump' | null {
  if (!g.alive) return null;
  const gw = 34, gh = 30;
  if (b.x + b.w < g.x - gw / 2 || b.x > g.x + gw / 2 || b.y + b.h < g.y || b.y > g.y + gh) return null;
  return b.vy > 0 && b.y + b.h - g.y < 18 ? 'stomp' : 'bump';
}

// The computer runner: keep going right, jump at gaps, walls, grumbles and
// mystery boxes overhead.
export function cpuInput(b: Body, lv: Level): Input {
  const ahead = b.x + b.w + 26;
  const feet = b.y + b.h + 4;
  const groundAhead = lv.solids.some((s) => s.kind !== 'cloud' && ahead >= s.x && ahead <= s.x + s.w && feet >= s.y && feet <= s.y + 12);
  const wall = lv.solids.some((s) => s.kind !== 'cloud' && ahead + 4 >= s.x && ahead <= s.x + s.w && s.y < b.y + b.h - 4 && s.y + s.h > b.y + 4);
  const grumble = lv.grumbles.some((g) => g.alive && g.x - b.x > 0 && g.x - b.x < 90 && Math.abs(g.y - b.y) < 60);
  const box = lv.solids.some((s) => s.kind === 'q' && Math.abs(s.x + s.w / 2 - (b.x + b.w / 2)) < 12 && s.y < b.y);
  const jump = b.onGround && (!groundAhead || wall || grumble || box);
  return { dir: 1, jump: jump || b.jumping, jumpPressed: jump };
}
