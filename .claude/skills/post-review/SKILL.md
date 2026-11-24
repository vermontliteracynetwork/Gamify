---
name: post-review
description: "Weekly review of Gamify's posts and ads: results by funnel goal, creative fatigue, A/B test calls with significance, best times and formats, and lessons written to docs/marketing-lessons.md. Adapted from irinabuht12-oss/marketing-skills (MIT). Use every Monday, after a campaign, or for 'what worked?'."
argument-hint: "[week of yyyy-mm-dd | campaign id]"
---

# Post and ad review

Adapted from irinabuht12-oss/marketing-skills `creative-fatigue-detection`,
`ab-test-setup-and-analysis`, `weekly-account-summary` and `meta-ads-audit` (MIT, see
`.claude/THIRD_PARTY.md`).

Inputs: numbers the owner pasted or exported from each platform's insights, Google
Ads and Meta Ads Manager, and site sign-ups by utm_content. Never invent numbers; list
what is missing.

## 1. Score each piece by its goal
| Stage | Main metric | Also |
|---|---|---|
| See | 3-second views / impressions (thumb-stop) | reach |
| Care | saves + shares per 1,000 reach | watch time, comments |
| Try | link clicks → free sign-ups (by utm_content) | landing conversion |
| Pay | paid conversions, cost per paid subscriber | revenue |

## 2. Fatigue (ads, and organic formats repeated)
Urgent: frequency over 4 a week, or CTR down 20%+ over 7 days, or cost per result up
30%+ over 2 weeks. Warning: CTR falling 5 to 10% a day for 3+ days. Recommend a refresh
or a new audience.

## 3. Tests
Before: hypothesis, one variable, baseline rate, smallest lift worth finding, sample
needed (two-proportion test, 95% confidence, 80% power; show the numbers). During: no
winner before the sample is reached. After: winner, effect size, confidence, next test.

## 4. Write it down
- Each post in the planner: results, status `reviewed`.
- `docs/marketing-lessons.md`: lessons (with evidence and confidence), Tests table.
- Owner report: what worked, what didn't, why we think so, what we change next week,
  and what we need from her.
