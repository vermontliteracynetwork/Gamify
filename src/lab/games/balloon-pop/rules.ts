// Pure rules for Balloon Pop (and the other arcade-answer games): which
// answer the next target carries. A shuffled bag of every answer, refilled
// when empty, so the right answer always comes up within one bag and two
// targets in a row never feel the same.

export function makeBag(n: number, random: () => number = Math.random) {
  let bag: number[] = [];
  let last = -1;
  return () => {
    if (!bag.length) {
      bag = [...Array(n).keys()];
      for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
      // Never the same answer twice in a row across bags.
      if (bag.length > 1 && bag[bag.length - 1] === last) [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]];
    }
    last = bag.pop()!;
    return last;
  };
}

// A balloon's size (radius in world units) and how fast it rises: bigger
// balloons are slower, so every size is fair to catch.
export function balloonKind(random: () => number = Math.random) {
  const r = 8.5 + random() * 4.5;
  const speed = 15 - (r - 8.5) * 1.1 + random() * 3;
  return { r, speed };
}

// Where a new balloon may start: away from the jar on the left and the edge.
export function spawnX(W: number, r: number, random: () => number = Math.random) {
  const lo = 20 + r, hi = W - r - 3;
  return lo + random() * Math.max(1, hi - lo);
}
