import { describe, expect, it } from 'vitest';
import { LEAVE_MS, MAX_INVADERS, PEEK_MS, SPAWN_MS, SPOTS, add, balanceTeams, competeRight, count, lookFor, newRights, newRoom, spawnDue, swapTeam, tick, togetherDone, togetherRight, winner } from './logic';

const rand = () => 0.3;

describe('Territory: Together', () => {
  it('starts with cats and no mice', () => {
    const r = newRoom('together', 0, 4, rand);
    expect(count(r, 'defender')).toBe(4);
    expect(count(r, 'invader')).toBe(0);
  });
  it('a mouse comes in at the chosen pace, never before', () => {
    const r = newRoom('together', 0, 3, rand);
    expect(spawnDue(r, SPAWN_MS.slow - 1, 'slow')).toBe(false);
    expect(spawnDue(r, SPAWN_MS.slow, 'slow')).toBe(true);
    expect(count(tick(r, SPAWN_MS.fast, 'fast', rand), 'invader')).toBe(1);
    expect(count(tick(r, SPAWN_MS.fast, 'slow', rand), 'invader')).toBe(0);
  });
  it('stops adding mice at the cap (nothing bad happens)', () => {
    let r = newRoom('together', 0, 3, rand);
    for (let k = 1; k <= MAX_INVADERS + 5; k++) r = tick(r, k * SPAWN_MS.fast, 'fast', rand);
    expect(count(r, 'invader')).toBe(MAX_INVADERS);
    expect(spawnDue(r, 1e9, 'fast')).toBe(false);
  });
  it('a right answer sends a cat to catch one mouse', () => {
    let r = tick(newRoom('together', 0, 3, rand), SPAWN_MS.slow, 'slow', rand);
    r = togetherRight(r, SPAWN_MS.slow + 100);
    expect(count(r, 'invader')).toBe(0);
    expect(r.caught).toBe(1);
    const caught = r.pieces.find((p) => p.leaving)!;
    expect(caught.side).toBe('invader');
    expect(r.pieces.find((p) => p.id === caught.leaving!.by)?.side).toBe('defender');
    // The poof finishes, then the mouse is gone from the room.
    expect(tick(r, SPAWN_MS.slow + 100 + LEAVE_MS, 'slow', rand).pieces.some((p) => p.id === caught.id)).toBe(false);
  });
  it('a right answer with no mouse waits for the next one', () => {
    let r = togetherRight(newRoom('together', 0, 3, rand), 10);
    expect(r.waiting).toBe(1);
    expect(r.caught).toBe(0);
    r = tick(r, SPAWN_MS.normal, 'normal', rand);
    expect(count(r, 'invader')).toBe(1);
    r = tick(r, SPAWN_MS.normal + PEEK_MS, 'normal', rand);
    expect(r.caught).toBe(1);
    expect(r.waiting).toBe(0);
  });
  it('ends at the class goal', () => {
    expect(togetherDone({ ...newRoom('together', 0), caught: 9 }, 10)).toBe(false);
    expect(togetherDone({ ...newRoom('together', 0), caught: 10 }, 10)).toBe(true);
  });
});

describe('Territory: Compete', () => {
  it('starts with three of each', () => {
    const r = newRoom('compete', 0, 0, rand);
    expect([count(r, 'defender'), count(r, 'invader')]).toEqual([3, 3]);
  });
  it('default rule: a right answer adds yours and sends one of theirs away', () => {
    let r = newRoom('compete', 0, 0, rand);
    r = competeRight(r, 'defender', 'both', 5, rand);
    expect([count(r, 'defender'), count(r, 'invader')]).toEqual([4, 2]);
    r = competeRight(r, 'invader', 'both', 6, rand);
    expect([count(r, 'defender'), count(r, 'invader')]).toEqual([3, 3]);
    expect(r.caught).toBe(1);
    expect(r.scared).toBe(1);
  });
  it('the add-only and chase-only rules', () => {
    const r = newRoom('compete', 0, 0, rand);
    const a = competeRight(r, 'invader', 'add', 5, rand);
    expect([count(a, 'defender'), count(a, 'invader')]).toEqual([3, 4]);
    const c = competeRight(r, 'invader', 'chase', 5, rand);
    expect([count(c, 'defender'), count(c, 'invader')]).toEqual([2, 3]);
  });
  it('never goes below zero, and the side with more wins', () => {
    let r = newRoom('compete', 0, 0, rand);
    for (let k = 0; k < 8; k++) r = competeRight(r, 'defender', 'both', k, rand);
    expect(count(r, 'invader')).toBe(0);
    expect(count(r, 'defender')).toBe(11);
    expect(winner(r)).toBe('defender');
    expect(winner(newRoom('compete', 0, 0, rand))).toBe('tie');
  });
  it('a full floor still takes new pieces', () => {
    let r = newRoom('compete', 0, 0, rand);
    for (let k = 0; k < SPOTS.length + 4; k++) r = add(r, 'defender', k, rand);
    expect(count(r, 'defender')).toBe(SPOTS.length + 7);
  });
});

describe('Territory: teams and answers', () => {
  it('splits the class evenly and keeps sides', () => {
    const t = balanceTeams(['a', 'b', 'c', 'd', 'e']);
    expect(Object.values(t).filter((s) => s === 'defender').length).toBe(3);
    expect(Object.values(t).filter((s) => s === 'invader').length).toBe(2);
    const later = balanceTeams(['a', 'b', 'c', 'd', 'e', 'f'], t);
    expect(later.a).toBe(t.a);
    expect(later.f).toBe('invader');
    expect(balanceTeams(['a'], t)).toEqual({ a: t.a });
  });
  it('the teacher can swap a student', () => {
    expect(swapTeam({ a: 'defender' }, 'a')).toEqual({ a: 'invader' });
    expect(swapTeam({}, 'z')).toEqual({ z: 'defender' });
  });
  it('counts each new right answer once', () => {
    const one = newRights({}, [{ pid: 'a', right: 2 }, { pid: 'b', right: 0 }]);
    expect(one.gains).toEqual(['a', 'a']);
    expect(newRights(one.seen, [{ pid: 'a', right: 2 }, { pid: 'b', right: 1 }]).gains).toEqual(['b']);
  });
  it('a student keeps the same animal', () => {
    expect(lookFor('kid-1', 'defender')).toBe(lookFor('kid-1', 'defender'));
    expect(lookFor('kid-1', 'invader')).toBeLessThan(3);
  });
});
