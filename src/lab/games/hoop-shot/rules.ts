// Hoop Shot rules and ball physics, kept apart so they can be tested.
// Units are the board's viewBox (160 x 100, y grows downward).

export const RIM = { x: 128, y: 36 };
export const BALL_R = 2.4;
export const FLOOR = 88;
export const SPOTS = { two: { x: 94, points: 2 }, three: { x: 52, points: 3 } } as const;
export type SpotId = keyof typeof SPOTS;
export const RELEASE_Y = 58;

export interface Shot {
  from: { x: number; y: number };
  angle: number; // degrees above level
  ideal: number; // the angle that drops it in the middle of the rim
  gravity: number;
  rimR: number;
}

// The speed that makes the ideal angle land in the middle of the rim.
export function launchSpeed(s: Pick<Shot, 'from' | 'ideal' | 'gravity'>): number {
  const dx = RIM.x - s.from.x, h = s.from.y - RIM.y, th = (s.ideal * Math.PI) / 180;
  return Math.sqrt((s.gravity * dx * dx) / (2 * Math.cos(th) ** 2 * (dx * Math.tan(th) - h)));
}

// Where the ball comes down at rim height, compared with the rim's middle.
export function landErr(s: Shot): number {
  const v = launchSpeed(s), th = (s.angle * Math.PI) / 180, g = s.gravity;
  const vy = v * Math.sin(th), h = s.from.y - RIM.y;
  const disc = vy * vy - 2 * g * h;
  if (disc < 0) return -99; // never gets up to the rim
  const t = (vy + Math.sqrt(disc)) / g;
  return s.from.x + v * Math.cos(th) * t - RIM.x;
}

export type ShotEvent = { t: number; kind: 'rim' | 'board' | 'floor' | 'in' };
export interface Flight { frames: { x: number; y: number }[]; events: ShotEvent[]; made: boolean; rimHits: number }

// The whole flight, simulated: the arc, rim bounces, the backboard, the net
// and the floor. A wobbly rim kicks bounces a little at random.
export function simulate(s: Shot, opts: { wobbly?: boolean; rand?: () => number } = {}): Flight {
  const rand = opts.rand ?? Math.random;
  const v = launchSpeed(s), th = (s.angle * Math.PI) / 180, g = s.gravity;
  let x = s.from.x, y = s.from.y, vx = v * Math.cos(th), vy = -v * Math.sin(th);
  const dt = 1 / 240, frames: { x: number; y: number }[] = [], events: ShotEvent[] = [];
  const edges = [RIM.x - s.rimR, RIM.x + s.rimR];
  const board = RIM.x + s.rimR + 2.2;
  let made = false, rimHits = 0, lastHit = -1, settled = 0;
  for (let i = 0; i < 240 * 4.2; i++) {
    const t = i * dt;
    const prevY = y;
    vy += g * dt; x += vx * dt; y += vy * dt;
    if (!made) {
      for (const ex of edges) {
        const dxp = x - ex, dyp = y - RIM.y, d = Math.hypot(dxp, dyp), min = BALL_R + 0.6;
        if (d < min && d > 0) {
          const nx = dxp / d, ny = dyp / d, dot = vx * nx + vy * ny;
          if (dot < 0) {
            const e = 0.55 + (opts.wobbly ? rand() * 0.35 : 0);
            vx -= (1 + e) * dot * nx; vy -= (1 + e) * dot * ny;
            if (opts.wobbly) { vx += (rand() - 0.5) * 6; vy -= rand() * 4; }
            if (t - lastHit > 0.08) { events.push({ t, kind: 'rim' }); rimHits++; lastHit = t; }
          }
          x = ex + nx * min; y = RIM.y + ny * min;
        }
      }
      if (x + BALL_R > board && x < board + 3 && y > RIM.y - 17 && y < RIM.y + 2 && vx > 0) {
        vx = -vx * 0.5; x = board - BALL_R; events.push({ t, kind: 'board' });
      }
      if (prevY < RIM.y && y >= RIM.y && vy > 0 && x > edges[0] + 0.4 && x < edges[1] - 0.4) {
        made = true; events.push({ t, kind: 'in' }); vx *= 0.25; vy *= 0.45;
      }
    }
    if (y + BALL_R > FLOOR && vy > 0) {
      vy = -vy * 0.55; vx *= 0.8; y = FLOOR - BALL_R;
      if (Math.abs(vy) > 6) events.push({ t, kind: 'floor' }); else settled++;
    }
    if (i % 4 === 0) frames.push({ x, y });
    if (x < -8 || x > 170 || settled > 3) break;
  }
  return { frames, events, made, rimHits };
}

// The computer's aim: close to ideal when sharp, else a few degrees off.
export function cpuAim(ideal: number, sharp: boolean, rand: () => number = Math.random): number {
  const off = sharp ? (rand() - 0.5) * 3 : (rand() < 0.5 ? -1 : 1) * (6 + rand() * 9);
  return ideal + off;
}

// The swinging aim arrow: from 30 to 80 degrees and back.
export const aimAt = (t: number, period: number) => 55 + 25 * Math.sin((t / period) * Math.PI * 2);

// Kind aiming for young players: the close spot forgives more than the far
// one, and its arrow swings slower.
export const AIM_TOL: Record<SpotId, number> = { two: 5, three: 3.5 };
export const AIM_PERIOD: Record<SpotId, number> = { two: 4, three: 3.2 };

// Inside the window the ball flies at (almost) the ideal angle: a sure
// basket, sometimes with a rim rattle. Just outside it is pulled halfway in,
// so near misses can still bounce in. Far off flies as aimed.
export function kindAngle(angle: number, ideal: number, tol: number, rand: () => number = Math.random): number {
  const d = angle - ideal;
  if (Math.abs(d) <= tol) return ideal - rand() * 0.6;
  if (Math.abs(d) <= tol * 2) return ideal + d * 0.5;
  return angle;
}
