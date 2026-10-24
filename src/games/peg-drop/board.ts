// Peg Drop board (logic borrowed from the Dashboard's Plinko, rebuilt; the
// name avoids the trademarked one). The ball starts above a drop zone and,
// at each row of pegs, bounces half a space left or right; after an even
// number of rows it lands in a bucket. Buckets pay more toward the edges
// and the middle jackpot, so aiming is a choice.

export const ZONES = 7;          // drop zones and buckets, positions 0..6
export const ROWS = 8;           // even, so the ball ends on a whole position
export const BUCKETS = [50, 20, 10, 100, 10, 20, 50];

export function dropPath(zone: number, rand: () => number = Math.random): number[] {
  const path = [zone];
  let x = zone;
  for (let r = 0; r < ROWS; r++) {
    let step = rand() < 0.5 ? -0.5 : 0.5;
    if (x + step < 0 || x + step > ZONES - 1) step = -step;
    x += step;
    path.push(x);
  }
  return path;
}

export const bucketOf = (path: number[]) => Math.round(path[path.length - 1]);
