import { describe, expect, it } from 'vitest';
import { POSTS } from './plan';
import { aspectFor, publishState, withMoves } from './autopost';

const base = { ...POSTS[0], platform: 'instagram' as const, status: 'needs-ok' as const, date: '2026-12-02', time: '16:00' };
const all = { canva: true, instagram: true };
const ok = { [base.id]: { decision: 'approved' as const, note: '', at: '2026-11-24T00:00:00Z' } };

describe('auto-post rule: nothing posts without her OK', () => {
  it('waits for her OK first', () => { expect(publishState(base, {}, all)).toBe('needs-ok'); });
  it('never posts a no or a changes', () => {
    expect(publishState(base, { [base.id]: { decision: 'no', note: 'x', at: '' } }, all)).toBe('not-approved');
    expect(publishState(base, { [base.id]: { decision: 'changes', note: 'x', at: '' } }, all)).toBe('not-approved');
  });
  it('needs a finished design, then connected accounts', () => {
    expect(publishState({ ...base, design: undefined }, ok, all)).toBe('needs-design');
    expect(publishState({ ...base, design: { canva: 'DAF1' } }, ok, { canva: true })).toBe('needs-connection');
  });
  it('queues until the time comes, then is due', () => {
    const p = { ...base, design: { canva: 'DAF1' } };
    expect(publishState(p, ok, all, new Date('2026-12-01T12:00:00'))).toBe('queued');
    expect(publishState(p, ok, all, new Date('2026-12-02T16:01:00'))).toBe('due');
  });
  it('ads never auto-post', () => { expect(publishState({ ...base, platform: 'meta-ads', design: { canva: 'D' } }, ok, all)).toBe('ads-manual'); });
  it('moves change only the date she picked', () => {
    const [m] = withMoves([base], { [base.id]: { date: '2026-12-09' } });
    expect(m.date).toBe('2026-12-09'); expect(m.time).toBe('16:00');
  });
  it('shapes match the platform', () => {
    expect(aspectFor({ ...base, format: 'reel' })).toBe('9 / 16');
    expect(aspectFor({ ...base, format: 'pin' })).toBe('2 / 3');
    expect(aspectFor({ ...base, format: 'carousel' })).toBe('4 / 5');
  });
});
