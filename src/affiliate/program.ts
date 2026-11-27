import { PRICES_USD } from '../config';

// Gamify affiliates (owner, 2026-11-25: "teachers, homeschool parents, etc.
// that have an established online platform and can receive a payment for
// promoting and getting subscriptions ... largely useful on tiktok and
// instagram"). The terms below are predicted from her past decisions and
// common software affiliate practice; they wait for her OK in Waiting on you
// and the full plan is docs/affiliate-program.md. Change a number here and
// the public page, the owner page and the math all follow.
export const AFFILIATE = {
  rate: 0.25,            // share of what the customer pays...
  months: 12,            // ...for their first 12 months of payments
  schoolRate: 0.1,       // a school or district plan: 10% of the first year's contract
  windowDays: 60,        // a link or code counts for 60 days; the last one used wins
  holdDays: 30,          // paid after the 30-day refund window
  minimumPayout: 25,     // dollars; smaller balances roll to the next month
  followerOffer: 0.1,    // followers get 10% off their first term (never stacked with another sale)
  minFollowers: 1000,    // or a smaller community that is clearly engaged (a group, a newsletter)
  proWhileActive: true,  // affiliates get Pro free while they are active, and say so in posts
  referAFriend: true,    // owner 2026-11-27: every Gamify teacher also gets a refer-a-friend link
  friendMonths: 2,       // owner 2026-11-27: both the teacher who shares and the friend who joins get 2 free months
  // owner 2026-11-27: commissions only on multi-month plans (3, 6 or 12 months); monthly plans earn nothing.
  qualifying: ['quarter', 'half', 'year'] as const,
};

// What one paid customer earns an affiliate in their first 12 months, on what
// the customer actually pays (the follower offer comes off the first term).
// Monthly plans earn nothing (owner, 2026-11-27: multi-month plans only).
export function commission(plan: 'plus' | 'pro' | 'homeschool', billing: 'month' | 'quarter' | 'half' | 'year'): number {
  if (!(AFFILIATE.qualifying as readonly string[]).includes(billing)) return 0;
  const months = billing === 'quarter' ? 3 : billing === 'half' ? 6 : 12;
  const terms = Math.round(AFFILIATE.months / months);
  const term = PRICES_USD[plan][billing];
  const paid = term * (1 - AFFILIATE.followerOffer) + term * (terms - 1);
  return Math.round(paid * AFFILIATE.rate * 100) / 100;
}

// A code is 3 to 20 letters or numbers, saved in capitals (a creator's
// handle works: "MSRIVERA").
export function cleanCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
}
export const validCode = (code: string) => /^[A-Z0-9]{3,20}$/.test(code);

// The referral is remembered on this device only (first-party, no cookies
// or trackers), and only from the affiliate's own link or a code typed at
// sign-up. It never runs on student pages.
const KEY = 'gamify-ref';
export function saveRef(raw: string, now = Date.now()) {
  const code = cleanCode(raw);
  if (!validCode(code)) return;
  try { localStorage.setItem(KEY, JSON.stringify({ code, at: now })); } catch { /* private window */ }
}
export function currentRef(now = Date.now()): string {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null') as { code: string; at: number } | null;
    if (!v || !validCode(v.code) || now - v.at > AFFILIATE.windowDays * 86_400_000) return '';
    return v.code;
  } catch { return ''; }
}
