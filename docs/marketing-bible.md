# The Gamify Marketing Bible

The one rulebook for the Gamify marketing team (owner's rule, 2026-11-24). Every
post, caption, ad, campaign, sound, hashtag, Canva brief and report runs through
this document. When something here conflicts with a team member's instinct, this
document wins. When this document conflicts with the owner, **the owner wins**:
Kayden makes the final call on everything, every time.

Companion files:
- `docs/marketing-lessons.md`: what we learned (wins, misses, trend watch). Read
  before you plan; write to it after every review.
- `src/owner/marketing/plan.ts`: the content planner the owner sees on `/owner`
  (Marketing). Every piece of work the team does is logged there.
- `docs/product-plan.md` section 10 (marketing ideas) and 10A (blog ideas).
- The **Gamify Marketing and Sales** Claude Doc (buyers, counter arguments, Beth's
  sales research).

---

## 0. The goal

**Paid subscriptions.** Every piece of work must move a teacher, parent or school
one step along the funnel below, and we must be able to say which step:

| Stage | Who | What they do | What we measure |
|---|---|---|---|
| See | Teachers, homeschool parents, coaches, admins | Stop scrolling on a post or ad | Reach, 3-second views, thumb-stop rate (3s views / impressions) |
| Care | Same | Watch, save, share, comment | Watch time, saves, shares, comments (saves and shares count most) |
| Try | Teacher | Visits the site, plays a demo, makes a free account | Link clicks, landing page conversion, free sign-ups |
| Use | Teacher | Runs a real game with a class | First activity run within 7 days |
| Pay | Teacher, family, school | Upgrades to Homeschool, Plus, Pro or a school plan | Paid conversions, cost per paid subscriber, revenue |
| Tell | Paying teacher | Shares, posts, refers a colleague | Referrals, user-generated posts, reviews |

Vanity numbers (likes, followers) are reported, never celebrated on their own.
A post with 200 likes and 0 sign-ups did worse than a post with 20 likes and 3.

---

## 1. Who the team is and who decides

| Role | Agent file | Owns |
|---|---|---|
| Marketing Director | `.claude/agents/marketing-director.md` | The plan, campaign strategy, running every piece through the bible check, handing work to the owner |
| Brand Copywriter | `.claude/agents/brand-copywriter.md` | Campaign language, captions, hooks, ad copy, on-screen text, brand voice |
| Social Content Planner | `.claude/agents/social-planner.md` | The calendar, formats per platform, Canva briefs, sounds, posting times |
| Paid Ads Strategist | `.claude/agents/ads-strategist.md` | Google Ads and Meta Ads: structure, audiences, budgets, tests, tracking links |
| Trend Researcher | `.claude/agents/trend-researcher.md` | Current trends, sounds, formats, and what other brands, creators and games do that works |
| Performance Analyst | `.claude/agents/performance-analyst.md` | Reading results, fatigue, A/B calls, and writing every lesson into `docs/marketing-lessons.md` |

Skills the team uses (`.claude/skills/`): `marketing-bible-check` (the gate),
`content-calendar`, `campaign-brief`, `ad-copy-variants`, `tracking-links`,
`landing-page-audit`, `competitor-teardown`, `post-review`, and the social media
pipeline `social-video-pipeline` (2026-11-25): `last30days` (what teachers talk about,
cookie-free), `social`, `copywriting`, `video` and the other vendored marketing skills
(scripts, hooks, captions, hashtags), `humanizer` (sounds like Gamify, not AI),
`hyperframes` (the video), then the planner for her OK and Buffer once connected.

### The approval rule (non-negotiable)

1. **Nothing goes public without the owner's OK.** No post, ad, boost, reply
   template, bio change, budget change or new account. The team drafts; Kayden
   approves.
2. **Everything is visible.** Every draft, change, research note and result goes
   into the planner (`src/owner/marketing/plan.ts`) with a line in its activity
   log: who did it, when, and why. No work happens off the books.
3. **Statuses** (in order): `idea` → `drafting` → `needs-ok` → `approved` →
   `scheduled` → `posted` → `reviewed`. Only the owner moves a piece from
   `needs-ok` to `approved` (or sends it back with `changes` / `no`).
4. **The owner's notes are law.** When Kayden sends something back, the note is
   copied word for word into the piece's history, applied, and, if it is a
   general preference, added to section 12 of this bible and to
   `docs/teacher-preferences.md` the same turn. She never says the same thing twice.
5. **Money is always the owner's.** Ad budgets, boosts, paid tools, creator deals
   and anything that spends money is a `Waiting on you` item
   (`src/owner/waiting.ts`), never a team decision.

---

## 2. The bible check (every piece, every time)

Run `.claude/skills/marketing-bible-check` before a piece goes to `needs-ok`.
One miss means it is not ready. Short form:

1. **Goal**: names its funnel stage and the one action we want.
2. **Audience**: names one buyer (section 3) and one real pain.
3. **Hook**: stops the scroll in under 2 seconds without words if muted.
4. **Truth**: every claim is true of what ships today. No research claim beyond
   `docs/gamified-learning-research.md`. No made-up numbers or reviews.
5. **Brand**: voice, words and look match section 4. Uses the Canva brand kit.
6. **Psychology**: names the principle it uses (section 5) and passes the ethics line.
7. **Platform**: built native to its platform (section 6): size, length, safe zones,
   captions on, sound choice licensed for business.
8. **Legal and kids**: section 7: no other brand, no student faces or names without
   a signed release, endorsements disclosed, licensed sound, nothing targeted at kids.
9. **Trend**: uses a current format or deliberately breaks one, with a note from
   `docs/marketing-lessons.md` trend watch dated within the last 30 days.
10. **Learned**: cites at least one past lesson it applies (or says "first test").
11. **Tracked**: has a tracking link (section 9) and a named test, if any.
12. **Accessible**: captions on video, alt text on images, contrast, no flashing.
13. **K-12**: Gamify is presented as K-12, never a narrower band; Live means every
   student on their own device (section 4, K-12 positioning).

---

## 3. Who we sell to

Never "teachers" in general. Pick one per piece. The segments below are
**targeting data** (who sees a piece, which pain it names); they never narrow the
product. Whatever the segment, the copy presents Gamify as K-12 (owner,
2026-11-25; section 4, K-12 positioning).

| Buyer | Pains we solve | What makes them act | Plan to sell |
|---|---|---|---|
| K-5 classroom teacher | Review is boring; kids lose focus; prep takes too long; mixed readers | Seeing kids cheer in a real room; "ready in 2 minutes" | Free → Plus |
| Grades 6-12 teacher | Students too cool for kiddie games; needs data | Competitive modes, whole class vs the teacher, reports | Plus → Pro |
| Special education teacher, SLP, OT, interventionist | Tools are not accessible; high support needs; IEP data | Read-aloud, calm mode, Share Mirror, settings in every game, free accessibility | Free → Plus, then word of mouth |
| Homeschool parent and co-op lead | Hard to make practice fun; one device; mixed ages | Solo and versus play, one screen, Homeschool plan price | Homeschool plan |
| Instructional coach, principal, district admin | Need proof, privacy, accessibility compliance | No student accounts, no ads, no trackers, reports, DPA | School plan quote |

Buying triggers to time posts around: back to school (late July to September),
the first snow days, testing season (March to May review), winter break planning,
the last weeks of school, Teacher Appreciation Week (May), and the new budget year
(spring purchasing for fall).

Objections, answered with value first (price talk always leads with value):
- "I already use another game site." → One question set becomes dozens of games
  and four ways to play; accessibility is free. Never name the other site.
- "No time to learn a new tool." → Show the 2-minute start on screen.
- "My students need more support." → Read-aloud, calm mode, Share Mirror, free.
- "Is it safe?" → No student accounts, no ads, no trackers, no email for kids.
- "Too expensive." → Lead with what it replaces and the time it saves; then the
  price; the free tier is real.

---

## 4. Brand language

### Voice
**Playful, warm, teacher-smart, honest.** We sound like the teacher down the hall
who always has the best ideas and never brags.

| We are | We are not |
|---|---|
| Playful and energetic | Childish, babyish, or loud for its own sake |
| Warm and on the teacher's side | Preachy, guilt-tripping, "you're failing your kids" |
| Clear, short, concrete | Jargon ("leverage synergies", "edtech solution") |
| Confident about what ships | Hype, superlatives we can't prove ("the best app ever") |
| Inclusive of every learner | Ableist, deficit language ("low kids", "suffers from") |

### Words
- **Use**: game, play, class, students, kids (casual posts), review, practice,
  question set, activity, theme, your class, ready in minutes, every learner,
  free, accessibility, read-aloud, calm mode, whole class vs the teacher.
- **Our nouns**: "Activity" (a game + question set + who plays). "Question set"
  (never "quiz bank"). "Theme". "Share mode", "Live", "Solo", "Versus".
- **Avoid**: any other company's or game's name, "addictive", "screen time"
  boasts, "hack", "cheap", "dumbed down", "low/high kids", "special needs" as a
  label for children (say "students with disabilities" or "every learner"),
  "guaranteed", "proven to raise scores", "AI-powered" unless it is true and the
  owner approves.
- **Spelling and style**: sentence case for headlines, the Oxford comma optional
  but consistent per piece, numbers as digits ("2 minutes"), US spelling, English
  only (owner rule, 2026-10-26).

### Theme language (owner, 2026-11-24)
Themes are Gamify's biggest difference; say it the same way everywhere.
- **The nouns**: a **theme** is the look of a game (backgrounds, pieces, team
  icons, power-ups, colors, sounds). Classes **design a theme** in the **Theme
  Builder**. Each part is a **piece**.
- **Two ways to design, always named together**: **Digital design** (any drawing
  or design app, or the Theme Builder's own drawing studio) and **Physical
  design** (made by hand with real materials).
- **Physical design is more than pencils and crayons.** Lead with the range:
  clay and modeling dough, textured paint, collage, recycled things (bottle caps,
  cardboard), and nature (leaves, sticks, stones). Pencils, crayons and markers
  are one option, not the headline.
- **The feature to promote**: **snap a photo or scan it, and Gamify fits it into
  the game.** Students' real, three-dimensional work becomes the game they play.
  Say "take a photo", "scan", "upload"; show hands and finished pieces, never
  faces.
- **Approved lines** (adapt, keep the meaning): "Your class designs the game."
  "Sculpt it, snap it, play it." "From clay to the big screen." "Leaves, bottle
  caps, crayons or a drawing app: if your class can make it, it can be in the
  game."
- **Never**: the word **Canva** or any other design app, toy or craft brand
  (say "a design app", "modeling dough", not a brand name); "skins"; promising
  automatic background removal or perfect cut-outs.
- **Beta**: theme concept ideas and material ideas go out in the regular theme
  emails and on the classroom kit (`src/beta/themeIdeas.ts`).

### K-12 positioning (owner, 2026-11-25)
Her words: "gamify is k-12 and should always be promoted as k-12 becuase we have
game difficulty and lots of theme options. live will alwyas be separete devices no
matter grade." Follow-up, same day: "its okay for the blogs to have different types
of reccomendations for different grade bands".
- **The product is always K-12.** Every post, pin, ad, caption, campaign message
  and landing line presents Gamify as K-12 ("Whole Class Review Game for K-12",
  "any grade, K-12"). Never a narrower audience for Gamify: no "K-5", "K-3",
  "grades 2-5", "for elementary", "an elementary game", "for high school".
- **The reason to give**: adjustable game difficulty and lots of theme options.
  When naming the difficulty, name a real control in that game: the computer on
  Easy, Medium or Hard, Territory's slow, normal or fast pace, Board Game's board
  length, Match Three's rounds, timers on or off, and the teacher's own questions.
  Themes: the theme library and the Theme Builder are paid features (Free is
  Classic plus one Game Show theme), so never pair "lots of themes" with "free".
- **One classroom idea may carry its best-fit grade band.** A blog post, or a pin
  or post that promotes one blog idea, may recommend that idea for a band, said as
  the idea's fit ("a K-3 idea", "an idea for grades 8-12"), never as who Gamify is
  for. The title still says K-12 or names no band.
- **Live is separate devices, at every grade.** Live always means every student
  answers on their own device, kindergarten to 12th grade. Never tie a mode to an
  age ("one screen for little kids", "start slow for younger students"). Share mode
  (one screen, no student devices) is also for every grade.
- **Search keywords and hashtags**: K-12 terms first (`k-12 review games`,
  `#k12teacher`). A grade-specific search term ("3rd grade math games") is allowed
  only beside a K-12 term in the same piece.
- **Internal ids stay**: buyer ids and the utm audience part (`k5-teachers`,
  `612-teachers`) are targeting data (section 9 allows only the section 3 ids). A
  campaign on a narrow segment says in the planner that its copy stays K-12.
- The planner test (`plan.test.ts`, "presents Gamify as K-12") checks hooks,
  captions, on-screen text, Canva briefs, alt text, campaign messages and keyword
  pairs.

### Core messages (rotate; one per piece)
1. **One question set. Dozens of games. Four ways to play.** (the core promise;
   until dozens are listed on the main site, say the real count, for example "7 games"
   on 2026-11-24, checked in `src/games/registry.ts` the day before posting)
2. **The whole class vs the teacher.** (the shareable moment)
3. **Accessibility is never a paid upgrade.** (values, and a district buying point)
4. **No student accounts, no ads, no trackers.** (trust)
5. **Wrong answers never cost a thing.** (low stress)
6. **Make any game your own.** (themes; the headline paid feature)
7. **Built by a teacher for students with high support needs, so it works for
   everyone.** (founder story)

The full running list of approved lines is `docs/product-plan.md` section 10.
New lines go there first, then into posts.

### Look
- The platform's sticker style and brand palette: periwinkle ground, off-white
  panels, black outlines, pale yellow accent, salmon, coral, navy and mint.
- Type: Grow Year for titles, Inclusive Sans for everything else (both in the
  Canva brand kit once the owner uploads them; see Waiting on you).
- Real screen recordings of Gamify beat mockups. Classic theme art may be shown
  on screen in posts; it is never handed out as a download (owner rule,
  2026-10-28).
- Every Canva template has a locked brand frame (logo spot, colors, fonts) and an
  open content area. The team never changes the locked parts.

---

## 5. Psychology: what we use and the ethics line

Every piece names its principle in the planner. Use the research honestly; if a
principle needs a fact we don't have (a real review, a real number), we don't use it.

| Principle (source) | How we use it | Never |
|---|---|---|
| Social proof (Cialdini) | Real teacher quotes with permission, real class reactions, real counts once we have them | Fake reviews, invented user counts, stock "teachers" |
| Reciprocity (Cialdini) | Give first: free printable, free blog guide, the free tier, a game idea teachers can use today | Gifts with hidden strings |
| Authority (Cialdini) | The founder is a teacher; retrieval practice research as cited in our brief | Fake experts, overstated research |
| Liking and unity (Cialdini) | Talk like a teacher; "teachers like us"; inside jokes of teaching | Pretending to be a teacher account that isn't us |
| Commitment and consistency (Cialdini) | Small first step: "try one game Friday"; challenges teachers can join | Pressure sequences |
| Scarcity and urgency (Cialdini) | Only when true: real founding-beta spots, a real price date | Fake countdowns, fake "only 3 left" |
| Behavior = Motivation × Ability × Prompt (Fogg) | Make the next step tiny and obvious; one CTA per piece | Three CTAs in one post |
| Curiosity gap (Loewenstein) | Hooks that open a question the video answers | Clickbait the content doesn't pay off |
| Pattern interrupt and the isolation effect (von Restorff) | First frame looks unlike the feed: motion, color, a kid's cheer, a surprising board | Startling flashes or loud jump scares |
| Processing fluency | Short words, big text, high contrast, one idea per frame | Dense text slides |
| Specificity | "Ready in 2 minutes", "up to 10 teams" (true numbers) | Vague "fast and easy" |
| Loss aversion and framing (Kahneman and Tversky) | Gentle "stop losing Friday review to boredom" | Fear about kids falling behind, shaming teachers |
| Anchoring and the default effect | Show yearly next to monthly; recommend one plan clearly | Hidden costs, pre-checked add-ons, trick toggles |
| Peak-end rule (Kahneman) | End every video on the best moment (the cheer, the win) | Ending on a logo hold |
| Mere exposure and frequency | Consistent look so 7+ touches add up; retargeting with variety | Showing one ad 10+ times a week (fatigue, section 8) |
| Identity and the IKEA effect | "Your class, your theme, your mascot"; teachers who built a theme | |
| Storytelling (narrative transport) | Before → moment → after, from a real classroom | Made-up stories presented as real |

**The ethics line**: we persuade with truth and remove friction; we never
manipulate. No dark patterns (fake urgency, confirmshaming, hidden costs, bait and
switch), no guilt, no fear about children, no content aimed at children. If Kayden
would be uncomfortable seeing the tactic explained in a news story, we don't use it.

---

## 6. Platforms (verify specs monthly; the trend researcher logs changes)

Specs move. The Trend Researcher checks each platform's current help pages on the
first of each month and records changes in `docs/marketing-lessons.md` (Trend
watch) with the date. If a spec below is older than the last trend-watch entry,
the trend-watch entry wins.

### Instagram (start: Reels first, carousels second)
- Reels 1080 × 1920 (9:16). Keep text and faces inside the center safe zone (top
  and bottom ~15% get covered by the app).
- Feed and carousels: 1080 × 1350 (4:5) or the current portrait grid size; up to
  20 slides; slide 1 is the hook, the last slide is the CTA.
- Caption: first line is the hook (only the start shows before "more"); 3 to 5
  specific hashtags (the platform now limits hashtag counts; check trend watch).
- Goal per post: saves and shares (carousels), watch time and shares (Reels).
- Link in bio with a tracking link per campaign; stories with link stickers.

### Facebook (teacher groups live here; older, more decision-maker audience)
- Same 9:16 Reels and 4:5 images as Instagram; repurpose, then tune the caption
  longer and more practical.
- Post to the Page; never spam teacher groups. Group participation is real help
  only, from the owner's own account, and only where group rules allow.

### Pinterest (search engine for lesson ideas; slow, long-lasting traffic)
- Standard pins 1000 × 1500 (2:3); video pins 9:16.
- Titles and descriptions are keywords teachers search ("whole class review game
  for K-12", "Friday review game ideas"), not hashtags. Gamify is K-12 in every
  title; a grade-specific keyword only beside a K-12 one (section 4). Every pin links to a real page (blog post, free
  printable, game demo) with a tracking link.
- Pins live for months: evergreen ideas, seasonal boards posted 45 to 60 days
  before the season.
- Boards, the pin kit per game, keywords, rhythm and measurement:
  `docs/pinterest-plan.md` (dev plan Part 5B, 2026-11-25). Only say "free
  template" where a Free teacher can download it (today: Game Show).

### TikTok (reach and personality)
- 1080 × 1920 (9:16), hook in the first 1 to 2 seconds, on-screen text, captions on.
- **Sounds**: a business account may only use the **Commercial Music Library**
  and original audio. Trending songs outside it are not licensed for brands.
  Original voice-over and "teacher talking to camera" are always safe.
- Native look: phone-shot, a real person, real classroom energy (no student faces
  without releases). Polished ads underperform here.
- Formats that fit us: "POV: it's Friday review", teacher reacts to the whole
  class beating them, before/after of a boring review sheet turned into a game,
  "3 ways to use one question set", theme reveals.

### Sounds on every platform
- Business accounts use only the platform's licensed business library
  (TikTok Commercial Music Library, Meta Sound Collection), original audio, or
  sounds we license and record in `docs/asset-ledger.md`.
- Gamify's own game sounds are fine (they are licensed; check the ledger).
- Every sound choice is written in the planner with its source.

### Posting rhythm (starting point; the analyst tunes it from our own data)
| Platform | Per week | Best first guess at times (Eastern) |
|---|---|---|
| Instagram | 3 Reels + 1 carousel + daily stories when there is news | Weekdays 6-8 am, 3:30-5 pm, Sunday evening |
| Facebook | 3 (repurposed) | Weekdays 7 am, 7-9 pm |
| Pinterest | 5-10 pins (batch weekly) | Evenings and weekends |
| TikTok | 3-5 | Weekdays 4-8 pm, weekend mornings |

Teachers scroll before school, after dismissal and on Sunday evenings while
planning. The analyst replaces these guesses with our own best times after 4
weeks of data.

---

## 7. Legal, kids and trust (must pass; no exceptions)

1. **No other company's brand** in any post, caption, hashtag, ad, keyword in ad
   text or sound title. No "like [other game site] but better". Use the rename
   list in `docs/product-plan.md` section 3. Bidding on other companies' names as
   keywords is the owner's decision; the default is no.
2. **Students**: no student faces, names, voices, handwriting or work samples
   without a signed release kept by the owner. Screens show sample nicknames only.
   Hands and backs of heads in a real room are fine with the school's permission.
3. **No ads to children.** Every paid audience is adults (18+) interested in
   teaching, homeschooling or education. Never target students or under-13s;
   never use kid-directed placements.
4. **Endorsements**: a teacher who got Gamify free (beta, founding teacher), was
   paid, or is a friend must disclose it ("I got Gamify free to test it").
   Paid partnerships use the platform's paid-partnership label.
5. **Claims**: only true claims about what ships. Research claims only as worded
   in `docs/gamified-learning-research.md`. No "guaranteed", no test-score promises.
6. **Licenses**: every font, image, sound, template and stock clip has a
   commercial license in `docs/asset-ledger.md` before it is used. Canva Pro
   content is fine inside Canva designs under Canva's license; note it.
7. **Privacy**: posts and ads never ask for student data; landing pages follow
   the site privacy policy; no new trackers on student pages, ever. Ad pixels go on
   teacher-facing marketing pages only, after the owner approves (Waiting on you).
8. **Comments and DMs**: reply templates are approved by the owner; never argue;
   anything about a child's safety or data goes straight to the owner.

---

## 8. Paid ads (Google and Meta)

Nothing spends without the owner's approval of the budget, the audience and every
creative. Start small, learn, then scale what works.

### Structure
- **Meta (Facebook and Instagram)**: 1 prospecting campaign (broad adult
  education audience, 3 to 5 creatives), 1 retargeting campaign (site visitors and
  video viewers, 30 days), later 1 lookalike of paying teachers once there are 100+.
  Placements: Reels and Stories first (9:16), feed (4:5).
- **Google**: 1 Search campaign on intent terms (classroom review games, review
  game for [subject], accessible classroom games, homeschool learning games), exact
  and phrase match, with a negative list (free download, jobs, kids' searches like
  "games to play at school"). Brand campaign on "Gamify" once the domain is live.
  Responsive Search Ads: up to 15 headlines (30 characters) and 4 descriptions
  (90 characters); every headline must stand alone.

### Rules
- One message per ad set; the landing page headline matches the ad's promise
  (`landing-page-audit`).
- Every ad has a tracking link (section 9) and a named test.
- Learning phase: don't edit an ad set for its first 7 days unless it breaks the
  bible or the owner says so.
- **Creative fatigue** (from the Meta audit method): frequency over 3 to 4 a week,
  CTR down 15 to 20% over 7 days, or cost per result up 30%+ over 2 weeks → refresh
  the creative.
- **Testing**: one variable at a time (hook, visual, CTA, audience). Work out the
  sample size before starting; no winner before it reaches significance
  (`post-review`).
- Report weekly to the owner: spend, results, cost per free sign-up, cost per
  paid subscriber, what changed and why, what we recommend.

---

## 9. Naming and tracking

- **Campaign names** (every platform, lowercase, hyphens inside a part,
  underscores between parts):
  `[platform]_[objective]_[funnel]_[audience]_[message]_[yyyymm]`
  e.g. `meta_conv_try_k5-teachers_class-vs-teacher_202608`.
  The audience part is targeting data, never copy: Gamify stays K-12 in every
  public line (section 4, K-12 positioning).
  Values: platform `ig fb pin tt meta google`; objective `aware engage traffic conv`;
  funnel `see care try use pay tell`; audience from section 3 (`k5-teachers`,
  `612-teachers`, `sped`, `homeschool`, `admins`).
- **Tracking links** (UTMs, always lowercase):
  `utm_source` (instagram, facebook, pinterest, tiktok, google, meta),
  `utm_medium` (social, paid-social, cpc, email),
  `utm_campaign` (the campaign name above), `utm_content` (the post id from the
  planner, e.g. `p-0007`). Build them with `.claude/skills/tracking-links`.
- The post id in the planner is the thread that ties a post to its results.

---

## 10. Canva workflow

1. The owner builds the master templates in Canva, inside the Gamify brand kit
   (logo, palette, Grow Year, Inclusive Sans).
2. Template set to start: Reel cover, Reel text overlays (hook, step, CTA), 4:5
   carousel (hook, body, CTA slides), quote card, feature spotlight, pin (2:3),
   story (9:16), ad set (1:1, 4:5, 9:16).
3. The team writes a **Canva brief** for every visual piece in the planner:
   template name, each text field word for word, the screen recording or image to
   drop in, and the alt text. The owner (or the team, with the Canva connector and
   the owner's OK) fills the template.
4. Use `canva:brand-check` on every finished design and `canva:resize-for-social-media`
   to make the other sizes. Fix any off-brand finding before `needs-ok`.
5. Approved designs go in the Canva folder `Gamify Marketing / [yyyy-mm]`, named
   with the post id (`p-0007 class-vs-teacher reel`).

---

## 11. How the team learns

- **Weekly** (Monday): the Performance Analyst runs `post-review` on last week's
  posts and ads, marks each `reviewed` with its numbers, and writes every lesson
  in `docs/marketing-lessons.md` (what happened, why we think so, what we will do
  differently, confidence).
- **Monthly** (1st): the Trend Researcher updates platform specs, trending
  formats and business-licensed sounds, and runs `competitor-teardown` on 3 accounts
  (other education brands, teacher creators, and games kids love) for what works.
  Findings go in Trend watch with dates and links; we learn the pattern, we never
  copy their content.
- **Before planning**: every planner reads the last 4 weeks of lessons and the
  latest trend watch, and cites what it applies.
- **Mistakes**: any miss (a rejected draft, a post that broke a rule, a flop) gets
  a lesson entry and, if it should never happen again, a new line in this bible
  (section 12) the same turn.
- **Our data beats general advice.** Once we have 4+ weeks of our own results, a
  lesson from our data outranks a best practice in this doc; update the doc.

---

## 12. Owner preferences (add every new one the same turn)

- Gamify has affiliates (2026-11-25): teachers, homeschool parents and education creators with an established audience, paid a share of the subscriptions they bring, mainly on TikTok and Instagram. Every affiliate post discloses the paid partnership in the video and caption plus the platform label, and follows section 7. Plan and terms: `docs/affiliate-program.md`; advisor: `.claude/agents/affiliate-advisor.md`.
- The owner makes the final call on everything; the team drafts and shows all its
  work in the developer dashboard (2026-11-24).
- Platforms to start: Instagram, Facebook, Pinterest, TikTok (2026-11-24).
- Templates are made in Canva (2026-11-24). Paid ads: Google and Meta (2026-11-24).
- Every decision applies the best psychological research, and posts use current,
  modern styles, captions and sounds (2026-11-24).
- The goal is always money and subscriptions: high-quality campaigns that convert
  (2026-11-24).
- Price talk always leads with value (standing sales rule, 2026-10-25).
- English only (2026-10-26). No other company's brand anywhere (standing legal rule).
- Offers (2026-11-24): paid plans bill monthly, every 3 months, every 6 months or yearly, and renew at that interval at the standard price; always say "renews every [interval] until you cancel" next to a price. Standard: Plus $8, Pro $15 a month, 5%, 15% and 20% off 3, 6 and 12 months. The launch sale (Founding Subscriber) is an extra 10% off the first term only, until Jan 1, 2027; never stacked with the beta tester offer, never on student pages.
- K-12 (2026-11-25): "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade." and "its okay for the blogs to have different types of reccomendations for different grade bands". Gamify is always K-12; one classroom idea may carry its best-fit band; Live is every student on their own device at every grade. See K-12 positioning in section 4.
- Themes (2026-11-24): never the word Canva anywhere a customer sees it ("we're going to get sued"); themes are digital design or physical design; promote photo and scan uploads and 3-D materials (clay, modeling dough, textured paint, recycled goods, leaves and sticks), not only pencils and crayons. See Theme language in section 4.

---

## 13. The edge list (psychology-first marketing)

Owner's rule (2026-11-24): "add the no stealing as a selling point. marketing
team should have a running list of these kind of features and it should be
noted on the site especially if the reserach shows that that is a weak spot
for our competators. this is the type of psycology first marketing i want
done."

Every time research finds a weak spot that classroom game sites share, and
Gamify does it better, it goes in this table the same turn, it is shown on the
site (the Features page section "Fair Play, Built In", Home or Pricing as fits),
and the copywriter builds posts on it. Never name the other sites in public;
describe the pain the teacher feels instead. Only list what ships today.

| Our edge | The pain it answers (research, docs/competitor-feedback-research.md) | Psychology | On the site | Status |
|---|---|---|---|---|
| No stealing power-ups, ever | With score-changing power-ups "a team can answer many questions correctly and still lose", and students "complain about the fairness" (verified 2026-11-24, competitor-feedback-research.md) | Loss aversion (a loss stings about twice a gain), self-determination theory (competence feels real when skill decides) | Features: Fair Play, Built In | Live 2026-11-24 |
| Every timer can be turned off | Speed and luck beat knowing the answer; quieter and slower students are left out | Cognitive load and test-anxiety research; UDL (multiple means of action) | Features: Fair Play, Built In | Live games 2026-11-24 |
| Right answers decide the game | "Luck based", kids race to be first instead of thinking | Retrieval practice (accuracy beats speed), competence | Features: Fair Play, Built In | Live |
| Names from the class list or friendly name dice | Student nicknames cause friction and delay learning | Psychological safety; reduces teacher policing load | Features: Fair Play, Built In | Live |
| No ads, no trackers, no student emails | Ads on the first screen; privacy worries; under-13 sign-ups | Trust as a buying trigger for schools (risk reduction) | Features: Fair Play, Built In; Pricing | Live |
| Accessibility free on every plan | Weak accessibility; features behind paywalls | Reciprocity; fairness; ADA Title II buying point | Features, Pricing | Live |
| Live view of the whole class on one question | Teachers cannot see whole-class answers to one question live; question reports are paid | Formative assessment (Black and Wiliam); immediate feedback | Planned (teacher portal) | Mockup 2026-11-24 |
| Keep editing after you cancel; clear billing reminders | No editing after cancelling; billing confusion and hard cancels | Endowment effect handled honestly; trust | Planned (billing) | Not built: needs Stripe |
