# Gamify affiliate program

Owner, 2026-11-25: "as part of our marketing plan, i want to have Gamify
affiliates: teachers, homeschool parents, etc. that have an established
online platform and can receive a payment for promoting and getting
subscriptions. this will be largely useful on tiktok and instagram."

Owned by the Affiliate Program Advisor (`.claude/agents/affiliate-advisor.md`)
with the Marketing Director. The numbers live in `src/affiliate/program.ts`;
change them there and every page follows. **Every term below is a predicted
default waiting for the owner's OK** (Waiting on you: "Affiliates: approve
the terms"). The attorney writes the affiliate agreement before the first
affiliate is paid.

## 1. Terms (predicted)

| Term | Default | Why |
|---|---|---|
| Commission | 25% of what the customer pays in their first 12 months | Common range for subscription software programs is 20 to 30% (from memory; the advisor confirms with current program pages). At Gamify's prices a flat fee would be too small to motivate. |
| School or district plans | 10% of the first year's contract | Bigger deals, longer sales; the owner closes them. |
| Link and code window | 60 days, last link or code wins | Teachers watch in summer and buy in August. |
| Payout | Monthly, after a 30-day refund hold, $25 minimum | A refund in the hold window cancels its commission (clawback). |
| Follower offer | 10% off the first term with the code | Gives viewers a reason to type the code. Never stacked with the launch sale (10% off until Jan 1, 2027). |
| Affiliate perk | Pro free while active | They need it to make honest content; they must disclose it. |
| Who | Teachers, homeschool parents, school staff and education creators with about 1,000+ real followers, or a smaller community that is clearly engaged (a group, a newsletter) | Trust beats reach for teacher buyers. |

What one sale earns: Plus yearly $76.80 makes $19.20; Pro yearly $144 makes
$36; Plus monthly at $8 for a year makes $24.

## 2. How it works
1. The creator applies at `/affiliates` (arrives in Tell Gamify as
   "Affiliate applications").
2. Vetting (section 3), then the owner approves and adds them on
   `/owner?s=affiliates`: their code (their handle, for example MSRIVERA) and
   link (`/a/MSRIVERA`).
3. Viewers either tap the bio link or type the code at sign-up ("Referral
   code"). The code is saved on the new teacher's profile once, at sign-up
   (supabase 0015). First-party only: no cookies, pixels or trackers, and
   never on student pages.
4. Once Stripe is live, the code also becomes a Stripe promotion code (the
   follower offer), and payments carry the code, so commissions come from
   real money instead of the estimate on the Affiliates page.
5. Payouts are recorded on the Affiliates page and post to Books as
   "Affiliate commissions" (Schedule C line 10).

## 3. Vetting checklist (any red flag stops)
- Audience: comments come from teachers, homeschool parents or school staff.
- Engagement over size: saves, shares and real comments, not just likes.
- Safe for a school brand: no student faces or work without releases, no
  humor at children's expense, nothing a principal would wince at.
- Disclosure habits: past brand posts were clearly labeled.
- No fake-follower signs: sudden jumps, very low comments, mismatched countries.
- No history of misleading claims.
- Uses Gamify, or will, with real learners before posting.

## 4. Rules every affiliate agrees to (public page and agreement)
1. Say it in every post: "#ad" or "I'm a paid Gamify partner", spoken and
   on screen, plus the platform's paid partnership label (FTC Endorsement
   Guides). A bio line alone is not enough.
2. Only true claims: what Gamify really does; no test-score promises.
3. No student faces, names, voices or work without a signed release; never
   aim posts at children.
4. No paid ads on the Gamify name, no coupon or deal sites, no spam, no
   self-referrals or buying through your own link.
5. Gamify can end the partnership and unpaid commissions on fraud or a
   broken rule.

## 5. Onboarding kit
Link and code; approved claims and the core messages (marketing bible 4);
a disclosure script for TikTok and Instagram; three Canva templates (Reel
cover, story with code, carousel); a 30-second demo clip; the first post
reviewed by the team before it goes up; the monthly report.

## 6. Monthly review (advisor and performance analyst)
Sign-ups and paid plans per code, refunds, top posts, disclosure spot check,
payouts due. Lessons go in `docs/marketing-lessons.md`.

## 7. Open calls for the owner
- The terms in section 1.
- Payout method (PayPal, bank transfer, or a paid affiliate platform such
  as one built on Stripe; any paid tool is a money decision).
- The attorney: affiliate agreement, program terms, privacy policy line
  for referral codes.
- The accountant: W-9 before the first payout; 1099-NEC above the current
  threshold.
