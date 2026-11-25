# Pinterest plan (dev plan Part 5B)

Owner's request (2026-11-24): "add to our dev plan to have a strong pinterest
marketing effort". Campaign `c-pinterest` in `src/owner/marketing/plan.ts`;
every pin follows `docs/marketing-bible.md` and passes `marketing-bible-check`
before it goes to `needs-ok`. Nothing posts without the owner's OK, and nothing
posts until the Pinterest business account exists (Waiting on you:
`pinterest-account`).

Why Pinterest: it is a search engine teachers plan from (bible 6), so a pin
titled with what a teacher types keeps sending visits for months. We win on
**saves** and **outbound clicks**, then free teacher sign-ups.

## 1. Boards

| Board | What goes on it | Live pins | Status |
|---|---|---|---|
| Classroom game ideas | Whole-class review routines, physical design, ideas for any subject | p-0016, p-0018, p-0034 | Open |
| Every Question Becomes a Game | One pin per live game (8 of 8), linking to its how-to-play, theme guide or lesson | p-0032, p-0038, p-0042 (+ the game pins below, saved here too) | Open |
| Theme templates and printables | Blank theme templates, linked to each theme guide (`/blog/themes/:id`) | p-0033, p-0017 | Open. Named without "Free" until the owner decides (see 5) |
| Classroom decor in the Gamify style | Patterns and stickers | none | **Parked.** Patterns are a proposal on /brand, not live; stickers are Classic art, which is never handed out (CLAUDE.md). Needs an owner decision before any pin |
| Reading and grammar games | ELA, vocabulary, phonics and literacy centers | p-0036, p-0040 | Open |
| Math games | Math ideas for every grade, K-12 | p-0035, p-0039, p-0041 | Open |
| Teacher tips | Exit tickets, accessibility, planning | p-0037, p-0023 | Open |
| Winter classroom games (seasonal) | Winter and January-return sets | p-0032 | Open Dec 1 to Feb 28 |
| Test review games (seasonal) | Spring review | none yet | Opens mid-January (see 4) |

One game per pin is the kit; every live game now has one: Game Show (p-0033,
p-0035, p-0038), Board Game (p-0039), Match Three (p-0041), Four in a Row
(p-0036), Bubble Pop (p-0018), Bowling (p-0032), Question Tracker (p-0040),
Territory (p-0042, Dec 15; listed on the main site 2026-11-25). Territory's
how-to-play page still mentions a window and furniture the drawn room does not
have; fix the page before p-0042 posts. Territory has no power-ups; in games
that have one, the bonus power-up is "Prize Chest" in every pin.

## 2. The pin kit (per game and theme)

1. **Tall pin**, 1000 x 1500 (2:3), Canva template "Pin 2:3": the keyword title
   as the hook, one real Gamify screenshot (Classic shown on screen only,
   sample nicknames only), a short footer naming what is behind the link.
2. **Video pin**, 9:16, 15 seconds of real play or real hands making pieces.
   No student faces, hands, work or voices without a signed release (bible 7.2).
   Silent with burned-in captions, or the owner's own voice. Game audio muted
   until every ledger sound's credit line is sorted.
3. **Printable**: the game's blank theme template, linked through its theme
   guide (`/blog/themes/:id`). Blank only, never Classic art. Today a teacher
   must log in to print; Free gets the Game Show templates, and the other 6
   games come with Plus, Pro and Homeschool (`src/theme/builder/templateAccess.tsx`).
   So only Game Show pins may say "free template".

Copy in the teacher voice: what the class does and learns, and the time. Gamify
is K-12 in every title and description (owner, 2026-11-25; bible 4 K-12
positioning): "Whole Class Review Game for K-12", never "for K-5" or "for
Elementary". A pin promoting one blog idea may name that idea's best-fit band as
the idea's fit ("a K-3 idea"), never as who Gamify is for. Live means every
student on their own device, at every grade.
Every detail comes from a live page (blog post, theme guide, how-to-play); no
prices on idea pins.

## 3. Keywords

**Status: unverified.** On 2026-11-25 web search returned results, but every
page fetch was blocked in this session (help.pinterest.com, create.pinterest.com
and others did not resolve), so no source was opened and none is cited as
evidence. What the search-result snippets suggested, unverified: teachers search
curriculum-specific phrases (grade + subject + activity) rather than broad
words; Pinterest's search-bar suggestions and related searches are the usual
way sellers find terms; the first ~40 characters of a title matter most. The
list below is the team's best guess built on that pattern (subject + "game",
with K-12 in the title); check each one before relying on it. Owner rule
(2026-11-25): K-12 keywords first; a grade-specific term is used only beside a
K-12 term on the same pin.

| Theme | Keywords to test (title first, then description) |
|---|---|
| Review, any subject | review game ideas, whole class review game, friday review game, unit review game, test review activity, no prep review activity |
| K-12 (use first) | k-12 review games, k-12 math games, k-12 vocabulary games, k-12 literacy games, k-12 formative assessment, k-12 special education, #k12teacher |
| By grade (only beside a K-12 term) | kindergarten math games, first grade math game, 2nd grade math games, 3rd grade math games, 4th grade math review, middle school ela games, high school review game |
| Math | fractions review game, counting practice game, independent math practice, math early finishers, math centers game |
| Reading and grammar | vocabulary review game, phonics review game, literacy centers games, kindergarten literacy centers, ela station ideas |
| Themes and art | free printable classroom game, review game template, classroom art project, clay classroom project, art integration lesson, student design project |
| Teacher tips | exit ticket ideas, k-12 formative assessment, exit tickets kindergarten, teacher tips |
| Inclusive | accessible classroom games, special education games, read aloud games, calm classroom activity |
| Seasonal | winter review game, winter classroom games, snowman classroom activity; later: test prep games, state test review game, spring review activities |

How to verify (owner or team, once the account exists, about 20 minutes):
type each phrase in the Pinterest search bar and note the suggested endings;
open Pinterest Trends, filter to Education and the United States, and note
whether each term rises in December to January and February to April. Keep
terms that appear; swap the rest for the suggested phrasing. Log the check in
`docs/marketing-lessons.md` Trend watch with the date.

Never: another company's or game's name as a keyword, "free" on a pin whose
download needs a paid plan, or kid-directed phrases ("games for kids to play").

## 4. Rhythm

- About **5 fresh pins a week**, batched on Mondays, posted evenings (8 pm
  Eastern) plus one weekend morning (bible 6 best guess until our own data).
- Two weeks drafted: p-0032 to p-0041, Dec 1 to Dec 14, alongside p-0003 and
  p-0023 already in the planner.
- **Seasonal sets early.** Winter now (January return, snow days). Testing
  season: the bible says post 45 to 60 days before a season (6), and the brief
  says a month; with state testing from March, the team drafts the test review
  set in the first week of January and posts it from mid-January. The bible
  wins unless the owner says otherwise.
- Re-pin the best performers to a second board after 2 weeks rather than
  writing near-duplicates.

## 5. Measure

| What | Where | Note |
|---|---|---|
| Saves, outbound clicks, impressions per pin | Pinterest Analytics (business account) | Analyst reviews every Monday (`post-review`) |
| Visits by pin | utm_content = post id, utm_source = pinterest | Naming per bible 9: `pin_traffic_try_[audience]_[message]_yyyymm` (`pin_engage_care_...` for video pins) |
| Free teacher sign-ups from Pinterest | **Not countable today.** The site does not keep a visit's utm_source through sign-up | Needs a small build: keep the first utm_source on teacher-facing pages and save it with the new teacher account; never on student pages, no third-party tracker. Owner decision (Waiting on you: `mkt-pinterest`), and a privacy-policy line |

First-test targets (guesses, replaced after 4 weeks): by Jan 31, 2027, 150
saves, 60 outbound clicks, 5 free sign-ups. Outbound clicks per 1,000
impressions is the number to compare pins by, since the account starts at zero.

## 6. Rules (from the bible, Pinterest-specific)

- Gamify's own art and real screenshots only; sample nicknames; no student
  faces, names, hands, voices or work without a signed release; no other brand.
- Printables are blank templates, never Classic art, and licensed for teacher
  classroom use. **Gap (2026-11-25):** the template pages and PDF carry no
  license line today (`TemplatePage.tsx`, `templatePdf.ts`). Proposed line, for
  the owner and attorney: "Free to print and copy for your own classroom. Not
  for resale." Template pins wait on it (Waiting on you: `mkt-pinterest`).
- No prices on classroom-idea pins. Plan names only where truth needs them.
- Every pin links to a real page with a tracking link.
