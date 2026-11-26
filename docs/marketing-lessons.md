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
| 2026-11-25 | Owner rule, her words: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade." Follow-up: "its okay for the blogs to have different types of reccomendations for different grade bands". We had narrowed the product in copy: pin titles "for K-5", "K-2", "Grades 3-5", "for Elementary", "for High School"; #elementaryteacher on 12 posts; and p-0042 tied the slow pace to younger students. A buyer segment (k5-teachers) leaked into the words. | p-0001 to p-0042 and 5 campaigns rewritten on 2026-11-25; planner test "presents Gamify as K-12" | The segment is who sees a piece, never who the product is for. Every public line says K-12; give the reason (difficulty you set, lots of themes). One classroom idea may say its best-fit band ("a K-3 idea"). Live is every student on their own device at every grade. Grade keywords only beside a K-12 keyword. Bible section 4, K-12 positioning; check 15 | high | Marketing Director |
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
| 2026-11-25 | all (p-0001 to p-0042), c-* | "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade." / "its okay for the blogs to have different types of reccomendations for different grade bands" | Every post and campaign presents Gamify as K-12; p-0042's grade line removed; K-12 keywords first; buyer and utm ids kept as targeting data | Yes: section 4 K-12 positioning, sections 2, 3, 6, 9 and 12 |

## Trend watch

Monthly, dated, with links to the pages actually opened. Specs here override the
bible's platform section when newer.

| Date | Platform | What changed or is trending | Source opened | Use it? |
|---|---|---|---|---|
| 2026-11-26 | All | 2027 forecasts for the Theme Building Challenge. OUT: WGSN and Coloro Colour of the Year 2027 "Luminous Blue" (announced 2025-04-29; theme "interconnectedness", nature and tech, online and offline; S/S 27 key colours Energy Orange, Pop Pink, Meadowland Green, Clay). Pinterest "Creators to Watch 2027" list is out. Third-party 2027 graphic design lists (human craft, collage, mixed media, whimsical, low fidelity, Y2K retro, tactile textures). PENDING: Pinterest Predicts 2027 (past: 2024-12-05, 2025-12-09, so expect early to mid December 2026); Pantone Color of the Year 2027 (Pantone lists a "2027 Experience" event on 2026-12-03, reveal expected early December); Adobe, Canva, Etsy 2027 reports not found (only 2026 versions). Pinterest 2026 signals still useful: "FunHaus" circus decor, Throwback Kid, Pen Pals; Pinterest 2026 Hobbies report: tactile crafts, analog practices, "repair aesthetic" +167%. UNVERIFIED: every page fetch failed (pantone.com, homepagenews.com, kittl.com did not resolve); all of this is from search-result summaries only. | none opened. Search results only: wgsn.com/en/wgsn/press/press-releases/wgsn-and-coloro-reveal-colour-year-2027-luminous-blue-and-s/s-27-key ; newsroom.pinterest.com/news/pinterest-predicts-nonconformity-self-preservation-and-escapism-drive-21-trends-for-2026/ ; community.pinterest.biz/t/pinterest-predict-2025/21903.md ; socialmediatoday.com/news/pinterest-shares-its-first-creators-to-watch-list/874969 ; pantone.com/na/en-us/color-of-the-year ; kittl.com/blogs/?p=27933 ; jukeboxprint.com/blog/the-biggest-graphic-design-trends-for-2027 ; newsroom.pinterest.com/en-ca/news/2026-pinterest-hobbies-trend-report/ | Yes, as low-confidence direction: hand-made, collage, tactile and recycled fit the 2027 challenge. Re-check on 2026-12-15 after Pinterest Predicts and Pantone release, before themes are locked |
| 2026-11-26 | Pinterest, Google | Seasonal teacher keywords for 2027 challenge themes. No volumes verified: no Pinterest Trends or keyword tool was opened. Old Tailwind summaries (2017 era) name January education terms winter, snow, snowman, snowflake, sensory; Valentine's peaks January to February, St. Patrick's January to March. Phrases such as "valentines classroom activities", "spring bulletin board", "back to school theme", "fall crafts for kids", "leprechaun trap", "100th day of school", "earth day crafts", "pumpkin math" are FROM MEMORY. | none opened. Search results only: tailwindapp.com/blog/what-to-pin-in-february ; tailwindapp.com/blog/?p=2343 ; create.pinterest.com/en-ca/teachers/ | Yes, as guesses: verify each in the Pinterest search bar and Pinterest Trends before titles are written |
| 2026-11-26 | All | School realities for seasonal themes. Some districts have moved Halloween to "fall" or "harvest" events (one New Jersey district banned costumes in 2023, later left it to principals). December guidance from advocacy groups: teach about religious holidays, do not celebrate them; keep decorations to the winter season. UNVERIFIED: news and advocacy summaries, not opened; district rules vary. | none opened. Search results only: edweek.org/leadership/spooked-by-halloween-some-schools-ban-costumes-but-not-without-pushback/2024/10 ; route-fifty.com/management/2023/10/why-some-schools-are-halting-halloween-celebrations/391630/ ; adl.org/resources/tools-and-strategies/december-dilemma-december-holiday-guidelines-public-school ; action.ajc.org/hubfs/NATIONAL/CEA/CEA-AJC-CEA-Guidance-for-K-12-on-Inclusive-December-Activities.pdf | Yes: every holiday theme gets an inclusive twin ("spooky-cute", "harvest", "winter lights"); no religious-holiday theme names |
| 2026-11-25 | All | Swapped #elementaryteacher for #k12teacher and grade keywords for K-12 ones (owner rule). How many people search or follow these K-12 terms is UNVERIFIED (from memory; nothing opened). | none opened | Yes, by rule; the analyst compares saves and reach on K-12 terms after 4 weeks |
| 2026-11-25 | Pinterest | Keyword research for Part 5B. Search results (snippets only) suggest teachers search curriculum-specific phrases (grade + subject + activity), sellers mine the search-bar suggestions and related searches, and the first ~40 title characters matter most. Third-party size guides agree on 1000 x 1500 (2:3) for standard pins; Pinterest's own spec page was not opened. UNVERIFIED: every page fetch was blocked this session. | none opened (help.pinterest.com and create.pinterest.com did not resolve) | Yes, as a guess: grade + subject + "game" titles; verify in the search bar and Trends (mkt-pinterest) |
| 2026-11-24 | Instagram | Several sources report Instagram limiting hashtags to 5 per post and Reel, rolling out from December 2025; one source says the help page still says 30. Treat 5 as the cap (our planner already limits to 5). | socialmediatoday.com/news/instagrams-implementing-new-limits-on-hashtag-use/808309/ ; later.com/blog/instagram-hashtags ; circleboom.com/blog/how-many-hashtags-should-you-use-on-instagram-in-2026/ (search results, pages not opened in full) | Yes: 3 to 5 specific tags |
| 2026-11-24 | All | Baseline: specs in bible section 6 written from general knowledge; not yet checked against each platform's help pages. First monthly check due 2026-12-01. | none yet | Check before first post |

### 2026-11-26 2027 Theme Building Challenge: suggestions (TO CONFIRM by the owner)

Trend Researcher. Options only; nothing here is decided. Her words are kept in quotes.
Evidence is low confidence (search summaries, no page opened; keywords from memory).

- **Q1 Jan-Mar, "like recycled goods"**. Materials: clean cardboard and cereal boxes;
  bottle caps and plastic lids; paper tubes and scrap paper. Themes: winter (snow day);
  Valentine's Day (hearts, love, friendship, pinks and reds); Saint Patrick's Day (luck,
  rainbow, leprechauns, green and gold); leprechaun trap build; kindness club (friendship
  without the holiday); polar animals; cozy cocoa cafe; junkyard robots; 100th day of
  school; night sky and stars.
- **Q2 Apr-Jun, spring, "nature materials and crayons/pastels"**. Materials: fallen
  leaves and flower petals; sticks, stones and pebbles; crayons and oil pastels (leaf
  rubbings join the two). Themes: flowers; baby animals; April Fools (mischief, silly,
  clowns) as a silly circus; April showers; bugs and butterflies; pond and frogs; rock
  creatures; Earth Day tiny planet; picnic; summer countdown.
- **Q3 Jul-Sep, "digital designs and scrapbook style"**. Materials: digital drawing
  (any design app or the Theme Builder studio); torn-paper collage; stickers, stamps
  and hand lettering. Themes: back to school; all about me; travel postcards; summer
  camp; ocean and beach; retro pixel arcade (our own art only); comic zine; sticker
  collection; summer games (never the trademarked games name); apple orchard.
- **Q4 Oct-Dec, "fall and winter holidays, spooky season, etc."** Materials (she has
  not named them; suggestion): modeling dough or clay; textured paint; felt, fabric and
  yarn scraps. Themes: spooky-cute; friendly monsters; harvest and pumpkin patch; fall
  leaves; night owls and forest animals; haunted library (book characters); gratitude
  harvest (Thanksgiving twin); winter lights; gingerbread town (flag: some read it as
  Christmas); first snow.
- **Flags**: Halloween and December religious holidays are restricted in some districts;
  offer the twin theme. Easter eggs and bunnies may read as Easter in Q2; keep baby
  animals farm-based. Clowns scare some young children (from memory); keep them friendly.
  Mother's Day and Father's Day themes leave out some families; use "people I love".
  Day of the Dead and Lunar New Year are cultural and religious; teach about, never a
  costume-style theme. Nature items: fallen only, no unknown plants (allergy, poison ivy).
- **Open questions for her**: Q3 timing (July has few classes); Halloween name; December
  names; Q4 materials; lock themes after Pinterest Predicts and Pantone drop in December.

## Competitor and reference teardowns

What other education brands, teacher creators and popular games do that works.
We learn the pattern; we never copy their words, art, sounds or look, and we never
name them in public content.

| Date | Account type (not name in public) | What works | Pattern we can use | Pattern we avoid |
|---|---|---|---|---|

## Tests

| Test id | Hypothesis | Variable | Sample needed | Result | Winner | Lesson link |
|---|---|---|---|---|---|---|

- 2026-11-25, owner answer to "should a pin promoting one blog idea name its best-fit grade?": "both can be possible". Rule: a pin for a single blog idea may name that idea's grade band ("a K-3 idea") to win grade searches, or stay band-free; Gamify itself is always K-12 in every title. Test both styles and let saves and outbound clicks decide.
