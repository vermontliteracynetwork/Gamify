---
name: ad-copy-variants
description: "Generate testable Google and Meta ad copy variants for Gamify from what has worked: hooks, angles, CTAs, with character limits respected and a test plan. Adapted from irinabuht12-oss/marketing-skills (MIT). Use when ads fatigue, before a launch, or for Responsive Search Ad headlines."
argument-hint: "[campaign id | ad set]"
---

# Ad copy variants

Adapted from irinabuht12-oss/marketing-skills `ad-copy-variant-generator` (MIT, see
`.claude/THIRD_PARTY.md`). Read bible sections 4, 5, 7, 8 and the Tests section of
`docs/marketing-lessons.md`.

1. **Find the winning pattern.** From our past results (pasted or in the planner),
   correlate CTR, sign-up rate and cost per sign-up with: hook type (question, number,
   POV, result, contrarian, story), pain vs benefit framing, proof used, CTA, length.
   With no data yet, say "first test" and start from bible core messages.
2. **Write variants grouped by the one thing tested** (hook, body, CTA, visual). Each
   variant keeps the winning elements and changes one. Annotate what it keeps.
3. **Respect limits.** Google RSA: up to 15 headlines × 30 characters, 4 descriptions ×
   90, each headline stands alone, no repeats. Meta: primary text front-loads 125
   characters, headline ~40, description ~30. Show character counts.
4. **Rules.** No other brand names, no superlatives we can't prove, adults-only angle,
   principle named per variant, one CTA.
5. **Test plan.** Which pairs run against each other, the metric, sample size needed
   (see post-review), and the stop rule.

Output a table: id, element tested, text, characters, principle, keeps-from-winner,
paired-with.
