---
name: social-video-pipeline
description: Gamify's social media pipeline (owner, 2026-11-25, from the "free Claude plugins to automate social media" video). Runs the five steps in order for Instagram, TikTok, Facebook and Pinterest - find what teachers are talking about (last30days), turn the best ideas into scripts, hooks, captions and hashtags (social, copywriting, video), make it sound like Gamify and not like AI (humanizer plus the brand voice), build the video (hyperframes), then queue it in the owner's planner for her OK before anything is scheduled (Buffer, once she connects it). Use for 'make this week's posts', 'turn this trend into a Reel', 'make a TikTok about X'.
---

# Gamify social video pipeline

The marketing bible (`docs/marketing-bible.md`) overrules every step and every
vendored skill. Nothing posts, boosts or spends without the owner's OK.

## 1. Find the topic (`last30days`)
- Run it on teacher and homeschool topics: "teachers TikTok review games",
  "classroom game ideas", "homeschool math practice", "end of year review".
- **Cookie-free only**: decline every browser-cookie or logged-in X step, and
  never read browser data. Use the free sources; a ScrapeCreators key is the
  owner's choice (Waiting on you).
- Rank by saves, shares and comments from educators, not views. Write the top
  findings to the trend watch in `docs/marketing-lessons.md` with dates.

## 2. Write it (`social`, `copywriting`, `video`, `marketing-psychology`)
- Context first: `.claude/product-marketing.md` (Gamify's product context),
  then the bible's buyers (3), voice and words (4), psychology and ethics line
  (5), platform specs (6).
- Each piece: one funnel stage (bible 0), one core message, a hook in the
  first 2 seconds, on-screen text, caption, 3 to 5 hashtags, the tracking
  link (`tracking-links` skill).
- Affiliates: a creator's post uses `docs/affiliate-program.md` rules and the
  paid-partnership disclosure.

## 3. Make it sound like Gamify (`humanizer`)
- Run the humanizer on every caption, script and on-screen line, then match
  the bible's voice (section 4) and `docs/marketing-lessons.md` (her
  rejections word for word). The brand voice wins over the humanizer's taste.

## 4. Build the video (`hyperframes`, `hyperframes-cli`, `media-use`)
- 9:16 at 1080 x 1920 for Reels and TikTok. Real Gamify screens (sample
  nicknames only), the Brand Kit colors and fonts, licensed sounds from
  `docs/asset-ledger.md` only, captions burned in.
- **Skip the HyperFrames usage note**: answer no to its usage message and
  never run `hyperframes events`. No cloud render or paid plan without the
  owner's OK.
- Check frames (lint, check, snapshot) and look at them before calling it done.

## 5. Queue it for her OK, then schedule
- Add the piece to the planner (`src/owner/marketing/plan.ts`) at status
  `needs-ok` with an activity log line; run `marketing-bible-check` first.
- After she approves: schedule through Buffer once she has connected it
  (Waiting on you); until then the planner's own auto-post queue
  (`docs/marketing-autopost.md`) or she posts by hand.
