---
name: landing-page-audit
description: "Check a Gamify landing page against the post or ad that sends people to it: message match, above-the-fold clarity on phone and laptop, one clear CTA, friction in sign-up, proof, and speed. Adapted from irinabuht12-oss/marketing-skills (MIT). Use before any campaign launches or when clicks don't become sign-ups."
argument-hint: "[url] [post or ad id]"
---

# Landing page audit

Adapted from irinabuht12-oss/marketing-skills `landing-page-audit` (MIT, see
`.claude/THIRD_PARTY.md`). Read bible sections 0, 4, 5 and 8.

Put the ad or post copy and the page side by side (run the site locally or open the
live page; take phone and laptop screenshots).

| Check | Pass means |
|---|---|
| Message match | Page headline repeats the ad's promise in the same words |
| Offer match | The offer in the ad (free, founding beta, plan) is visible above the fold |
| One CTA | One primary button, says what happens ("Make a free game") |
| Above the fold | Phone (390 × 844) and laptop (1280 × 720): headline, proof, CTA visible without scrolling |
| Friction | Fewest fields; no card for free; no surprise steps |
| Proof | A real screen or video of a game; honest trust lines (no student accounts, no ads) |
| Speed | Loads fast on a phone |
| Truth and legal | Same rules as the bible; no other brand |

Output: message match score (0 to 10), each disconnect with a fix, and a hypothesis
for the next test. Code changes to pages go through the normal Gamify build rules
(CLAUDE.md, three lenses); the owner approves.
