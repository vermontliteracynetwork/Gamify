# Marketing lessons and trend watch

The marketing team's memory (see `docs/marketing-bible.md` section 11). Read the
last 4 weeks before planning anything; add to it after every review, every
rejected draft and every monthly trend check. Newest first. Never delete an entry;
if a lesson turns out wrong, add a new entry that says so and why.

Confidence: **high** (our data, enough volume, or repeated), **medium** (our data,
small sample), **low** (one post, or outside research only).

## Lessons

| Date | Lesson | Evidence (post ids, numbers) | What we do now | Confidence | By |
|---|---|---|---|---|---|
| 2026-11-25 | Check who can actually get a printable before a pin calls it free. Theme templates need a teacher login, and on Free only the Game Show templates download; the other 6 games need Plus, Pro or Homeschool. Templates also carry no license line yet. | src/theme/builder/templateAccess.tsx; p-0033 is the only pin that says free | Only Game Show pins say "free template"; board named "Theme templates and printables"; license line asked of the owner (mkt-pinterest) | high | Marketing Director |
| 2026-11-25 | UTM links measure visits, not sign-ups: the site does not keep utm_source through sign-up, so "sign-ups from Pinterest" cannot be counted today. | grep of src for utm_ (only the planner uses it) | Judge Pinterest on saves and outbound clicks until the owner OKs first-party sign-up attribution (mkt-pinterest) | high | Marketing Director |
| 2026-11-24 | Check every number against the code the day before it posts. The bible's "dozens of games" is not true on the main site today: 7 games are listed (the rest are hidden or on the preview branch). | src/games/registry.ts GAMES list, 2026-11-24; launch posts p-0010, p-0011, p-0015 | Say the real count ("7 games"); bible core message 1 now carries this note | high | Marketing Director |
| 2026-11-24 | "The room" as a sound source carries student voices, which need a signed release (bible 7.2). Screen-only clips use the teacher's voice or a licensed bed; game audio muted because some ledger sounds need a credit line. | p-0001 sound line fixed; p-0025 written this way | Every video names whose voice is heard | high | Marketing Director |
| 2026-11-24 | A brand-new page starts at zero followers, so launch-day reach comes from pinned posts, the owner's own network and Pinterest search, not the algorithm. Judge launch week on beta applications and saves, not reach. | Launch plan c-launch (no data yet) | Pin 3 posts on Instagram, 1 on Facebook and TikTok; analyst reviews Dec 7 | low | Marketing Director |
| 2026-11-24 | Start-up lessons from the owner's standing rules: nothing posts without her OK; no other brand names; accessibility and privacy are selling points, not footnotes. | Owner rules in CLAUDE.md and the bible | Bible check before every `needs-ok` | high | Marketing Director |

## Rejected or changed by the owner

Every time Kayden sends a piece back, copy her note word for word here, then say
what changed. If it is a general preference, it also goes in the bible section 12.

| Date | Post id | Her note (exact words) | What we changed | Bible updated? |
|---|---|---|---|---|

## Trend watch

Monthly, dated, with links to the pages actually opened. Specs here override the
bible's platform section when newer.

| Date | Platform | What changed or is trending | Source opened | Use it? |
|---|---|---|---|---|
| 2026-11-25 | Pinterest | Keyword research for Part 5B. Search results (snippets only) suggest teachers search curriculum-specific phrases (grade + subject + activity), sellers mine the search-bar suggestions and related searches, and the first ~40 title characters matter most. Third-party size guides agree on 1000 x 1500 (2:3) for standard pins; Pinterest's own spec page was not opened. UNVERIFIED: every page fetch was blocked this session. | none opened (help.pinterest.com and create.pinterest.com did not resolve) | Yes, as a guess: grade + subject + "game" titles; verify in the search bar and Trends (mkt-pinterest) |
| 2026-11-24 | Instagram | Several sources report Instagram limiting hashtags to 5 per post and Reel, rolling out from December 2025; one source says the help page still says 30. Treat 5 as the cap (our planner already limits to 5). | socialmediatoday.com/news/instagrams-implementing-new-limits-on-hashtag-use/808309/ ; later.com/blog/instagram-hashtags ; circleboom.com/blog/how-many-hashtags-should-you-use-on-instagram-in-2026/ (search results, pages not opened in full) | Yes: 3 to 5 specific tags |
| 2026-11-24 | All | Baseline: specs in bible section 6 written from general knowledge; not yet checked against each platform's help pages. First monthly check due 2026-12-01. | none yet | Check before first post |

## Competitor and reference teardowns

What other education brands, teacher creators and popular games do that works.
We learn the pattern; we never copy their words, art, sounds or look, and we never
name them in public content.

| Date | Account type (not name in public) | What works | Pattern we can use | Pattern we avoid |
|---|---|---|---|---|

## Tests

| Test id | Hypothesis | Variable | Sample needed | Result | Winner | Lesson link |
|---|---|---|---|---|---|---|
