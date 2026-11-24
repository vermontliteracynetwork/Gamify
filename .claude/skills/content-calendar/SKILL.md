---
name: content-calendar
description: "Plan a week or month of Gamify social posts for Instagram, Facebook, Pinterest and TikTok into the owner's content planner (src/owner/marketing/plan.ts), including repurposing one idea into native versions per platform. Use for 'plan next week', 'fill December', or 'turn this blog post into posts'."
argument-hint: "[week of yyyy-mm-dd | month yyyy-mm | source to repurpose]"
---

# Content calendar

Read `docs/marketing-bible.md` (sections 3 to 6, 9, 10), the last 4 weeks of
`docs/marketing-lessons.md`, and the current planner.

## 1. Frame the period
- Season and buyer triggers (bible 3): what is a teacher thinking about that week?
- The active campaign(s) and their core message.
- The rhythm in bible 6, adjusted by lessons.

## 2. Mix (per week)
| Pillar | Share | Example |
|---|---|---|
| Value: an idea a teacher can use today | ~35% | "3 ways to review with one question set" carousel |
| Proof: a real class moment or teacher words (with permission) | ~20% | Whole class vs the teacher reaction Reel |
| Product: one feature in 15 seconds | ~25% | Theme reveal, read-aloud demo |
| Personality: founder, behind the scenes, teacher humor | ~10% | "Why I built this" talking head |
| Offer: one clear ask | ~10% | Free tier, founding beta, back-to-school plan |

## 3. Repurpose (one idea, native everywhere)
One strong idea becomes: a TikTok and an Instagram Reel (different first frames and
captions), a Facebook post with a longer practical caption, a Pinterest pin with a
keyword title linking to a blog post, and a carousel. Never the same caption twice.
Short video script shape: hook (0 to 2 s) → value (show, don't tell) → payoff at the
peak moment → one CTA.

## 4. Write each post into the planner
Every post: id (`p-0001` upward), date and time, platform, format, campaign, buyer,
funnel stage, pillar, principle, hook (best of 3), caption, on-screen text, Canva brief,
sound and source, hashtags or keywords, alt text, tracking link, status `drafting`, and
an activity line. Run `marketing-bible-check`, then set `needs-ok` on passing posts.
Run `npx vitest run src/owner/marketing`.
