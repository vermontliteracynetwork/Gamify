// Lunch Rush (roster Stage 9): hungry guests sit at the counter, each
// wanting one food. A right answer earns serves; tap the food and it goes to
// the guest who wants it most. Guests wait a few serves, not seconds, so
// nobody is rushed while reading. Pure logic, so it can be tested.

export const FOODS = ['pizza', 'burger', 'icecream', 'carrot'] as const;
export type Food = (typeof FOODS)[number];
export const SEATS = 3;
export const PATIENCE = 5;

export interface Guest { id: number; food: Food; patience: number; look: number }
export interface Counter { seats: (Guest | null)[]; nextId: number }

function newGuest(id: number, rand: () => number): Guest {
  return { id, food: FOODS[Math.floor(rand() * FOODS.length)], patience: PATIENCE, look: Math.floor(rand() * 6) };
}

export function openCounter(rand: () => number = Math.random): Counter {
  return { seats: Array.from({ length: SEATS }, (_, i) => newGuest(i, rand)), nextId: SEATS };
}

export interface ServeResult { counter: Counter; servedSeat: number | null; points: number; left: number[] }

// Serve one food. The guest who wants it and has waited longest gets it,
// with a tip for being quick. Then everyone else waits one more serve; a
// guest out of patience waves goodbye, and empty seats fill with new guests.
export function serve(c: Counter, food: Food, rand: () => number = Math.random): ServeResult {
  let servedSeat: number | null = null;
  c.seats.forEach((g, i) => {
    if (g && g.food === food && (servedSeat === null || g.patience < c.seats[servedSeat]!.patience)) servedSeat = i;
  });
  const points = servedSeat === null ? 0 : 5 + c.seats[servedSeat]!.patience;
  const left: number[] = [];
  let nextId = c.nextId;
  const seats = c.seats.map((g, i) => {
    if (i === servedSeat || !g) return newGuest(nextId++, rand);
    const waited = { ...g, patience: g.patience - 1 };
    if (waited.patience > 0) return waited;
    left.push(i);
    return newGuest(nextId++, rand);
  });
  return { counter: { seats, nextId }, servedSeat, points, left };
}

// The computer serves a food someone wants, most impatient guest first.
export function cpuFood(c: Counter): Food {
  const waiting = c.seats.filter((g): g is Guest => !!g).sort((a, b) => a.patience - b.patience);
  return waiting[0]?.food ?? FOODS[0];
}
