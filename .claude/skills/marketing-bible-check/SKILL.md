---
name: marketing-bible-check
description: "Gamify's marketing quality gate. MUST run on every post, caption, ad, campaign, Canva brief and reply template before it goes to the owner for her OK (status needs-ok). Checks goal, buyer, hook, truth, brand, psychology and ethics, platform fit, legal and kids, trend, lessons applied, tracking and accessibility. One miss means not ready."
argument-hint: "[post id | campaign id]"
---

# Marketing bible check

Source: `docs/marketing-bible.md` section 2. Read the bible and the last 4 weeks of
`docs/marketing-lessons.md` first. Check the piece in `src/owner/marketing/plan.ts`.

| # | Check | Pass means |
|---|---|---|
| 1 | Goal | Names its funnel stage (see, care, try, use, pay, tell) and one action |
| 2 | Buyer | One buyer from bible section 3, and one real pain |
| 3 | Hook | Stops the scroll in under 2 seconds; makes sense muted |
| 4 | Truth | Every claim true of what ships today; research worded as in `docs/gamified-learning-research.md`; no invented numbers, quotes or reviews |
| 5 | Brand | Voice and words (bible 4); our nouns; Canva brand kit template |
| 6 | Psychology | Principle named (bible 5) and inside the ethics line: no fake urgency, guilt, fear about kids, dark patterns |
| 7 | Platform | Native size, length, safe zones; captions on; first line is the hook |
| 8 | Legal and kids | No other brand; no student face, name, voice or work without a signed release; endorsements disclosed; adults-only targeting; licensed fonts, images and sounds |
| 9 | Sound | Business-licensed library, original audio, or in `docs/asset-ledger.md`; source written down |
| 10 | Trend | Uses or deliberately breaks a format from trend watch dated within 30 days |
| 11 | Learned | Cites a past lesson it applies, or says "first test" |
| 12 | Tracked | Tracking link with the post id as utm_content; test named if it is one |
| 13 | Accessible | Alt text on images; captions on video; good contrast; no flashing |
| 14 | Owner notes | Every past owner note that fits (bible 12, lessons Rejected) is applied |

Output:

```
## Bible check: [post id] [title]  (date)
| # | Check | PASS / FAIL | Note |
Verdict: READY FOR OWNER / NOT READY (list fixes)
```

Only a READY piece may move to `needs-ok`. Add the verdict to the piece's history in
the planner.
