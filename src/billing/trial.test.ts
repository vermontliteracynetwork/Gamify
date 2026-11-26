import { afterEach, describe, expect, it } from 'vitest';
import { TRIAL } from '../config';
import { betaClosed, betaEndsAt, betaOpen, effectiveTier, gameSince, higherTier, holdPlanForGame, trialEndsAt, trialReminder, trialState } from './trial';

const H = 3_600_000;
const D = 24 * H;
const start = '2026-12-01T15:00:00.000Z';
const t0 = Date.parse(start);

describe('Plus reverse trial', () => {
  it('is Plus for 7 days', () => {
    expect(TRIAL).toEqual({ tier: 'plus', days: 7 });
    expect(trialEndsAt(start)).toBe(t0 + 7 * D);
  });

  it('counts days left, today included', () => {
    expect(trialState(start, t0)?.daysLeft).toBe(7);
    expect(trialState(start, t0 + 4 * D + H)?.daysLeft).toBe(3);
    expect(trialState(start, t0 + 7 * D - 1)?.daysLeft).toBe(1);
    expect(trialState(start, t0 + 7 * D)).toMatchObject({ daysLeft: 0, active: false });
    expect(trialState(null, t0)).toBeNull();
    expect(trialState('not a date', t0)).toBeNull();
  });

  it('lifts Free to Plus during the trial, then back to Free on day 8', () => {
    expect(effectiveTier('free', start, t0 + D)).toBe('plus');
    expect(effectiveTier(undefined, start, t0 + D)).toBe('plus');
    expect(effectiveTier('free', start, t0 + 7 * D - 1)).toBe('plus');
    expect(effectiveTier('free', start, t0 + 7 * D)).toBe('free');
    expect(effectiveTier(undefined, start, t0 + 8 * D)).toBeUndefined();
  });

  it('never touches a paid plan or an account without a trial', () => {
    expect(effectiveTier('pro', start, t0 + D)).toBe('pro');
    expect(effectiveTier('homeschool', start, t0 + D)).toBe('homeschool');
    expect(effectiveTier('plus', start, t0 + 9 * D)).toBe('plus');
    expect(effectiveTier('free', undefined, t0)).toBe('free');
    expect(effectiveTier(undefined, null, t0)).toBeUndefined();
  });

  it('a game hosted before the trial ends keeps Plus until that game ends', () => {
    const end = t0 + 7 * D;
    // Started 20 minutes before the end, still playing 30 minutes after it.
    expect(effectiveTier('free', start, end + 30 * 60_000, end - 20 * 60_000)).toBe('plus');
    // A game started after the end gets no hold.
    expect(effectiveTier('free', start, end + 30 * 60_000, end + 60_000)).toBe('free');
    // A tab forgotten open for hours lets go after the cap.
    expect(effectiveTier('free', start, end + 5 * H, end - 60_000)).toBe('free');
  });

  it('reminds at 3 days and at 1 day left', () => {
    expect(trialReminder(trialState(start, t0 + D))).toBeNull();
    expect(trialReminder(trialState(start, t0 + 4 * D + 1))).toBe(3);
    expect(trialReminder(trialState(start, t0 + 6 * D + 1))).toBe(1);
    expect(trialReminder(trialState(start, t0 + 8 * D))).toBeNull();
  });

  it('a paid plan always beats the trial', () => {
    expect(higherTier('free', 'plus')).toBe('plus');
    expect(higherTier('pro', 'plus')).toBe('pro');
  });
});

describe('game hold', () => {
  afterEach(() => sessionStorage.clear());
  it('records when the game opened and lets go when it closes', () => {
    const release = holdPlanForGame(1000);
    expect(gameSince()).toBe(1000);
    holdPlanForGame(5000);
    expect(gameSince()).toBe(1000);
    release();
    expect(gameSince()).toBeNull();
  });
});

describe('beta window', () => {
  it('stays open through Feb 28, 2027 Eastern, only while spots remain', () => {
    expect(betaOpen(Date.parse('2027-02-28T23:00:00-05:00'))).toBe(true);
    expect(betaOpen(Date.parse('2027-03-01T00:00:01-05:00'))).toBe(false);
    expect(betaEndsAt()).toBe(Date.parse('2027-03-01T04:59:59.999Z'));
    expect(betaOpen(Date.parse('2026-12-01T12:00:00Z'), false)).toBe(false);
    expect(betaClosed(Date.parse('2026-12-01T12:00:00Z'), true)).toBeNull();
    expect(betaClosed(Date.parse('2026-12-01T12:00:00Z'), false)).toBe('full');
    expect(betaClosed(Date.parse('2027-03-01T00:00:01-05:00'), true)).toBe('ended');
  });
});
