---
name: campaign-brief
description: "Build a complete Gamify marketing campaign brief: goal, buyer, insight, core message, offer, psychology, channels (organic and Google/Meta ads), creative list, landing page, tracking, tests, budget proposal and success numbers, written into the owner's planner for her OK. Use for 'build a campaign for X' or before any paid push."
argument-hint: "[campaign idea or season]"
---

# Campaign brief

Read `docs/marketing-bible.md`, `docs/marketing-lessons.md`, `docs/product-plan.md`
section 10 and the Gamify Marketing and Sales doc (buyers, counter arguments) if the
docs connector is available.

```
## Campaign: [name]  id: c-[slug]   dates: [start → end]
Goal (funnel stage + number): e.g. 60 free sign-ups, 8 paid Plus, cost per paid ≤ $X
Buyer: [one, bible 3]     Pain: [their words]     Trigger: [season/event]
Insight: [the true, slightly surprising thing about this buyer we build on]
Core message: [one line, from bible 4 or product-plan 10]
Offer: [free tier / founding beta / plan], true and approved
Principles: [2 max, bible 5] + why they fit
Proof we can honestly show: [features, real quotes with permission, research lines]
Objections and answers: [value first]
Channels: organic (IG, FB, Pinterest, TikTok) + paid (Meta, Google) with roles
Creative list: [post ids, formats, hooks]
Landing page: [url] + message match notes (landing-page-audit)
Tracking: campaign name + tracking-link pattern
Tests: [one variable each, sample needed]
Budget proposal (owner decides): [$/day per platform, dates, stop rule]
Success and stop rules: [what we call a win, when we pull it]
Lessons applied: [from marketing-lessons]
Risks: [legal, brand, kids]
```

Write the campaign and its posts into `src/owner/marketing/plan.ts` (status
`needs-ok` once each passes `marketing-bible-check`). Any budget goes on the owner's
Waiting on you list.
