import { describe, expect, it } from 'vitest';
import { cpuFood, openCounter, PATIENCE, SEATS, serve, type Counter } from './lunch';

const counter = (foods: ('pizza' | 'burger' | 'icecream' | 'carrot')[], patience = [5, 5, 5]): Counter => ({
  seats: foods.map((food, i) => ({ id: i, food, patience: patience[i], look: 0 })), nextId: foods.length,
});

describe('Lunch Rush', () => {
  it('opens with a full counter of patient guests', () => {
    const c = openCounter();
    expect(c.seats).toHaveLength(SEATS);
    expect(c.seats.every((g) => g?.patience === PATIENCE)).toBe(true);
  });
  it('serves the guest who wants the food, longest wait first, with a tip', () => {
    const res = serve(counter(['pizza', 'burger', 'pizza'], [5, 5, 2]), 'pizza');
    expect(res.servedSeat).toBe(2);
    expect(res.points).toBe(7);
    expect(res.counter.seats[2]!.id).toBe(3); // a new guest sits down
    expect(res.counter.seats[0]!.patience).toBe(4);
  });
  it('a food nobody wants scores nothing but time still passes', () => {
    const res = serve(counter(['pizza', 'burger', 'pizza']), 'carrot');
    expect(res).toMatchObject({ servedSeat: null, points: 0 });
    expect(res.counter.seats.map((g) => g!.patience)).toEqual([4, 4, 4]);
  });
  it('a guest out of patience waves goodbye and a new one sits', () => {
    const res = serve(counter(['pizza', 'burger', 'carrot'], [1, 5, 5]), 'burger');
    expect(res.left).toEqual([0]);
    expect(res.counter.seats[0]!.patience).toBe(PATIENCE);
  });
  it('the computer serves the most impatient guest', () => {
    expect(cpuFood(counter(['pizza', 'burger', 'carrot'], [4, 2, 3]))).toBe('burger');
  });
});
