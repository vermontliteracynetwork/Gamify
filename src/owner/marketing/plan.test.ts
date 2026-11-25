import { describe, expect, it } from 'vitest';
import { ACTIVITY, BANNED, CAMPAIGNS, LIMITS, NARROW_GRADE, POSTS, SAYS_K12, STATUSES, shownStatus, teamExport, withoutIdeaBands } from './plan';

// The parts of docs/marketing-bible.md a computer can check. The team runs
// these after every change to the planner.
const ready = POSTS.filter((p) => STATUSES.indexOf(p.status) >= STATUSES.indexOf('needs-ok'));

describe('marketing planner', () => {
  it('has unique post and campaign ids', () => {
    expect(new Set(POSTS.map((p) => p.id)).size).toBe(POSTS.length);
    expect(new Set(CAMPAIGNS.map((c) => c.id)).size).toBe(CAMPAIGNS.length);
  });

  it('ties every post to a real campaign and a dated history', () => {
    for (const p of POSTS) {
      expect(CAMPAIGNS.some((c) => c.id === p.campaign), p.id).toBe(true);
      expect(p.history.length, p.id).toBeGreaterThan(0);
      expect(p.date, p.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(ACTIVITY.length).toBeGreaterThan(0);
  });

  it('tracks every post with a lowercase link carrying its id', () => {
    for (const p of POSTS) {
      const query = p.link.split('?')[1] ?? '';
      expect(query, p.id).toBe(query.toLowerCase());
      for (const k of ['utm_source', 'utm_medium', 'utm_campaign']) expect(query, p.id).toContain(`${k}=`);
      expect(query, p.id).toContain(`utm_content=${p.id}`);
      expect(query, p.id).toMatch(/utm_campaign=(ig|fb|pin|tt|meta|google)_(aware|engage|traffic|conv)_(see|care|try|use|pay|tell)_[a-z0-9-]+_[a-z0-9-]+_\d{6}(&|$)/);
    }
  });

  it('never names another brand or uses banned words', () => {
    for (const p of POSTS) {
      const text = [p.hook, p.caption, ...(p.onScreen ?? []), ...(p.tags ?? []), p.alt ?? ''].join(' ').toLowerCase();
      for (const w of BANNED) expect(text.includes(w), `${p.id}: ${w}`).toBe(false);
    }
  });

  it('presents Gamify as K-12, never a narrower band (owner, 2026-11-25)', () => {
    for (const p of POSTS) {
      const fields = [p.hook, ...(p.hooksTried ?? []), p.caption, ...(p.onScreen ?? []), p.canva ?? '', p.alt ?? ''];
      for (const f of fields) expect(withoutIdeaBands(f).match(NARROW_GRADE)?.[0] ?? null, `${p.id}: ${f.slice(0, 60)}`).toBe(null);
      expect(fields.some((f) => SAYS_K12.test(f)), `${p.id} says K-12`).toBe(true);
      const tags = p.tags ?? [];
      if (tags.some((t) => NARROW_GRADE.test(t))) expect(tags.some((t) => SAYS_K12.test(t)), `${p.id}: a grade keyword needs a K-12 keyword beside it`).toBe(true);
    }
    for (const c of CAMPAIGNS) {
      expect(c.message.match(NARROW_GRADE)?.[0] ?? null, c.id).toBe(null);
      expect(SAYS_K12.test(c.message), `${c.id} says K-12`).toBe(true);
    }
  });

  it('keeps to platform lengths', () => {
    for (const p of POSTS) {
      const lim = LIMITS[p.platform];
      if (!lim) continue;
      expect(p.hook.length, `${p.id} hook`).toBeLessThanOrEqual(lim.hook);
      expect(p.caption.length, `${p.id} caption`).toBeLessThanOrEqual(lim.caption);
      if (lim.tags) expect((p.tags ?? []).length, `${p.id} tags`).toBeLessThanOrEqual(lim.tags);
    }
  });

  it('only sends the owner pieces that passed the bible check', () => {
    for (const p of ready) {
      expect(p.principle.length, p.id).toBeGreaterThan(10);
      expect(p.lesson.length, p.id).toBeGreaterThan(5);
      expect(p.alt?.length ?? 0, `${p.id} alt text`).toBeGreaterThan(10);
      if (['reel', 'tiktok', 'video-pin'].includes(p.format)) expect(p.sound?.length ?? 0, `${p.id} sound source`).toBeGreaterThan(5);
      expect(p.history.some((h) => /bible check: ready/i.test(h.note)), `${p.id} bible check`).toBe(true);
    }
  });

  it('leaves approving to the owner', () => {
    for (const p of POSTS) {
      if (['approved', 'scheduled', 'posted', 'reviewed'].includes(p.status)) expect(p.history.some((h) => h.by === 'Owner'), p.id).toBe(true);
    }
  });

  it('shows the owner decision over the team status, and exports it for the team', () => {
    const p = POSTS[0];
    expect(shownStatus(p, {})).toBe(p.status);
    expect(shownStatus(p, { [p.id]: { decision: 'changes', note: 'Shorter hook', at: '2026-11-24T10:00:00' } })).toBe('changes');
    expect(shownStatus(p, { [p.id]: { decision: 'approved', note: '', at: '2026-11-24T10:00:00' } })).toBe('approved');
    const text = teamExport({ [p.id]: { decision: 'no', note: 'Not our voice', at: '2026-11-24T10:00:00' } }, [{ id: 'i1', text: 'Snow day post', at: '2026-11-24T10:00:00' }]);
    expect(text).toContain(`${p.id}: NO`);
    expect(text).toContain('"Not our voice"');
    expect(text).toContain('Snow day post');
  });
});
