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
| 2026-11-26 | Plan lines can promise more than the code does. "New games before anyone else" (Pro) is on Pricing and the chart, but no early-access setting exists; Free is said to have 7 games but plays 4 of the 8 listed (FREE_GAMES still names 3 hidden games). An upgrade prompt that oversells a plan is bait and switch at the moment of paying. | grep of src for early access, src/config.ts FREE_GAMES vs src/games/registry.ts LATER_GAMES, 2026-11-26; c-upgrade | Every upgrade prompt and plan line is checked against TIERS and the registry the day it is written; early access stays out of prompts until it ships; count listed games only | high | Marketing Director |
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

### 2026-11-26 (round 2) 2027 theme brainstorm by month (TO CONFIRM by the owner)

Trend Researcher. Her ask, her words: "a brainstorm list going of lots of options, not
necessarily why", "title, a colon, and then a list form with commas", "Remember that
this is K-12", "silly national, daily, and monthly holidays", and Baamboozle, Blooket
(she said "Look It"; Blooket is a guess, she should correct it) and Wordwall themes.

**What opened.** Only wordwall.net/features opened. Blocked (did not resolve or 403):
trends.pinterest.com, create.pinterest.com, blooket.com (403), help.blooket.com,
baamboozle.com (403), blog.baamboozle.com, nationaltoday.com, daysoftheyear.com,
easternherald.com. pinterest.com search was not reachable either. So: NO Pinterest search
volumes were seen. Themes come from search-result summaries of preschool theme-by-month
guides and from memory. 2027 dates: fixed dates are from memory; floating dates are
computed from the 2027 calendar (Jan 1 2027 is a Friday); religious and lunar dates are
memory and must be checked. Check every silly-day date on a national day calendar before
it goes public. Legal: no brands, characters or trademarks in names (pixel blocks, summer
games, big game day, basketball brackets, reading week).

#### Q1

**January**
- **Snow day:** snowflakes, snowmen, mittens, sleds, snowballs, igloo, icicles, hot cocoa, blue and white
- **Polar and arctic animals:** penguins, polar bears, seals, walrus, arctic fox, snowy owl, orca, narwhal, icebergs
- **Penguin Awareness Day (Jan 20):** emperor penguin, chicks, ice floe, waddle, fish, tuxedo black and white
- **Winter science:** ice melt, thermometer, frost, snow crystals, hibernation, animal tracks
- **Hibernation:** bears, bats, dens, caves, sleeping animals, pine forest, moonlight
- **New year, new goals:** goal stars, calendars, clocks, confetti, fresh notebook, "I can" badges
- **Cozy cabin:** fireplace, quilts, socks, pinecones, lanterns, mugs, plaid
- **Hot cocoa cafe:** mugs, marshmallows, whipped cream, cookies, menu board, steam swirls
- **Mitten match (pre-K):** mittens, hats, scarves, boots, pairs, colors, clotheslines
- **Gingerbread and cookies (non-holiday):** cookie cutters, sprinkles, rolling pin, oven, recipe cards
- **National Popcorn Day (Jan 19):** popcorn kernels, buckets, movie tickets, butter yellow, red stripes
- **Hat Day (Jan 15, memory):** top hats, beanies, sun hats, crowns, hard hats, chef hats
- **Squirrel Appreciation Day (Jan 21):** squirrels, acorns, oak trees, nests, nuts, bushy tails
- **National Pie Day (Jan 23):** pies, slices, fractions, lattice crust, berries, bakery
- **Rubber Ducky Day (Jan 13):** ducks, bubbles, bathtub, rainbows of ducks, splash
- **Kindness and community (MLK Day, Jan 18):** hands, hearts, dream clouds, peace doves, community quilt
- **Dental health (Feb kickoff, pre-K):** teeth, toothbrush, floss, smiles, tooth fairy, sparkle
- **Space and night sky:** planets, stars, moon phases, rockets, astronauts, comets, constellations
- **Dinosaurs (pre-K):** T-rex, triceratops, fossils, eggs, volcanoes, footprints, dig site
- **Five senses (pre-K):** eyes, ears, nose, hands, tongue, texture, taste test
- **Pixel blocks (worksheet style):** square pixels, blocky trees, ores and gems, pickaxes, 8-bit hearts, grid
- **Ice and crystal glow (teen):** ice caves, aurora, frosted glass, blue neon, geodes
- **Winter sports:** skating, skiing, snowboard, hockey, curling stones, medals, scoreboard
- **Mystery case files (teen):** magnifying glass, fingerprints, case folder, clues, map pins, red string
- **Chalkboard (style):** chalk doodles, slate black, eraser smudges, hand lettering, frames
- **Lunar New Year (Feb 6, memory, check):** lanterns, paper dragons, fireworks, red and gold, zodiac animals. Flag: teach about it; no costume-style use

**February**
- **Valentine's Day (Feb 14):** hearts, love notes, friendship, cards, mailboxes, cupids, pinks and reds, candy hearts. Flag: twin is Friendship
- **Friendship (inclusive twin):** friendship bracelets, high fives, buddy benches, kind notes, rainbow of hands
- **Random Acts of Kindness (Feb 17):** kindness cards, smiles, helping hands, flowers, shout-outs
- **Groundhog Day (Feb 2):** groundhog, shadow, burrow, sun and clouds, weather vote
- **100th day of school (varies, mid-Feb):** 100 stars, gumballs, glasses, 100 crowns, ten frames, "100 days smarter"
- **Pizza Day (Feb 9):** pizza slices, toppings, fractions, pizza box, chef hat, red checks
- **Dental health month:** teeth, toothbrush, floss, healthy snacks, smiles, dentist chair
- **Inventors Day (Feb 11):** light bulbs, gears, blueprints, robots, gadgets, lab notebooks
- **Presidents' Day (Feb 15):** coins, flags, ballot box, capitol, stars and stripes, "if I were president"
- **Black History Month:** Flag: teach real history with care; not a decor "theme". Pieces: portraits drawn by students, quotes, timelines, jazz, inventions
- **Big game day (football):** footballs, goal posts, jerseys, helmets, scoreboard, snack table
- **Polar Bear Day (Feb 27):** polar bears, cubs, sea ice, snow dens, northern lights
- **Love Your Pet Day (Feb 20):** dogs, cats, fish, hamsters, pet bowls, leashes, paw prints
- **Post office and mail (pre-K):** mailbox, stamps, envelopes, mail truck, letters, carrier bag
- **Fairy tales (pre-K):** castles, dragons, three bears, magic beans, glass slipper, giants. Flag: use public-domain tales only
- **Nursery rhymes (pre-K):** humpty egg, little star, spider spout, sheep, cow and moon
- **Candy shop:** gumdrops, lollipops, jars, swirls, wrappers, pastel stripes
- **Kawaii sweets (style):** smiling donuts, cute cupcakes, pastel blush, sparkles, round eyes
- **Lo-fi study room (teen):** headphones, desk lamp, rain window, plants, mugs, cassette
- **Music class:** notes, drums, guitars, keyboards, rhythm sticks, staff lines
- **Arctic expedition (upper grade):** research ship, ice core, sled dogs, compass, flags, base camp
- **Doodle hearts (style):** pen doodles, notebook margins, arrows, stars, scribbles

**March**
- **Saint Patrick's Day (Mar 17):** leprechauns, rainbows, pots of gold, shamrocks, gold coins, top hats, green and gold
- **Leprechaun trap (STEM):** ramps, boxes, ladders, bait coins, nets, blueprints, recycled parts
- **Lucky rainbow (inclusive twin):** rainbows, clouds, coins, clovers, color order, sunshine
- **Pi Day (Mar 14, also clocks spring forward):** pi symbol, circles, pies, digits, compass, protractors
- **Reading week (early March):** books, bookmarks, reading nook, library cards, flashlight reading, hats
- **Spring is coming (equinox ~Mar 20, check):** buds, sprouts, robins, first flowers, sunshine
- **Weather:** clouds, wind, kites, umbrellas, rain gauge, thermometer, lightning
- **Kites and wind:** kites, windsocks, pinwheels, clouds, string, breeze swirls
- **Lion and lamb (pre-K):** lion, lamb, wind, sun, "in like a lion" calendar
- **Plants and seeds:** seeds, pots, sprouts, watering can, roots, sun, garden gloves
- **World Wildlife Day (Mar 3):** tigers, elephants, pandas, rhinos, habitats, maps
- **Puppy Day (Mar 23):** puppies, bones, balls, collars, dog house, paw prints
- **Make Up Your Own Holiday Day (Mar 26):** invented holidays, party hats, calendars, banners
- **Women's History Month:** inventors, scientists, athletes, pilots, portraits drawn by students
- **Music in our schools month:** band instruments, choir, notes, stage lights, sheet music
- **Basketball brackets:** basketballs, hoops, brackets, jerseys, scoreboard, buzzer
- **Recycled robots:** boxes, bottle caps, foil, wires, gears, antenna, bolts
- **Upcycle workshop:** cardboard, tubes, lids, tape, scissors, "repair" patches
- **Neon arcade (style):** neon tubes, joystick, coins, high scores, glow grid
- **Space exploration (teen):** Mars rover, space station, launch pad, mission patches, nebula
- **Comic book (style):** speech bubbles, halftone dots, POW bursts, panels, capes (original heroes only)
- **Notebook paper (style):** blue lines, red margin, hole punches, doodles, sticky notes
- **Ramadan (begins ~Feb 8, ends ~Mar 9, memory):** Flag: teach about only; offer "moon and stars" instead

#### Q2

**April**
- **Spring flowers:** tulips, daisies, sunflowers, bees, watering cans, flower pots, garden rows
- **April Fools (Apr 1):** mischief, silly, clowns, whoopee jokes, upside-down, mismatched socks, jack-in-the-box. Flag: friendly clowns only
- **Silly circus:** big top, juggling, unicycle, stripes, balloons, popcorn, tightrope
- **April showers:** raindrops, umbrellas, rain boots, puddles, clouds, rainbows, ducks
- **Earth Day (Apr 22):** globe, recycling bins, trees, reuse, planet hearts, compost, blue and green
- **Baby animals:** chicks, lambs, calves, piglets, foals, ducklings, bunnies, nests
- **Farm (pre-K):** barn, tractor, cows, pigs, hay bales, rooster, fences
- **Life cycles:** butterfly, frog, plant, chicken, egg to adult, arrows
- **Bugs and insects:** ladybugs, ants, bees, beetles, caterpillars, magnifying glass, leaves
- **Ponds and frogs:** frogs, lily pads, tadpoles, dragonflies, cattails, ducks
- **Birds and nests:** robins, nests, eggs, feathers, birdhouses, worms, binoculars
- **Poetry month:** quills, word clouds, haiku, rhymes, typewriters, poetry stage
- **Math month:** shapes, tangrams, number lines, dice, patterns, graphs
- **Kindergarten Day (Apr 21):** crayons, name tags, cubbies, backpacks, "I'm in K"
- **Pet Day (Apr 11):** dogs, cats, birds, rabbits, fish tank, vet kit
- **Kids and Pets Day (Apr 26):** kids walking dogs, pet beds, treats, toys
- **World Penguin Day (Apr 25):** penguins, waddles, ice, fish, colonies
- **Talk Like Shakespeare Day (Apr 23):** quills, globe stage, crowns, scrolls, masks (teen)
- **Plant a seed:** seed packets, soil, sprouts, sun, labels, measuring growth
- **Rock creatures:** pebbles, painted stones, googly eyes, moss, rock gardens
- **Garden gnome village (non-brand):** gnome hats, mushrooms, toadstools, tiny doors, fairy lights
- **Cottage garden (aesthetic, teen):** wildflowers, pressed flowers, linen, botanical labels, watercolor
- **Sticker sheet (style):** glossy stickers, outlines, shine, peel corners
- **Easter (Mar 28, memory) and spring eggs:** Flag: some schools avoid; twin is Baby animals or Spring garden

**May**
- **Butterflies:** monarchs, caterpillars, chrysalis, milkweed, wings, symmetry
- **Bees and honey:** bees, hives, honeycomb, flowers, pollen, yellow and black. World Bee Day May 20
- **Garden and veggies:** carrots, peas, lettuce, wheelbarrow, scarecrow, seeds
- **Space Day (first Friday, May 7):** rockets, planets, astronauts, moon base, aliens (friendly)
- **Bird Day (May 4):** birds, feeders, nests, feathers, songs, binoculars
- **People I love (Mother's Day twin; May 9):** hearts, flowers, family hands, portraits, cards. Flag: avoid "mom-only"
- **Teacher appreciation week (early May):** apples, pencils, thank-you notes, gold stars, chalk
- **Community helpers (pre-K):** firefighters, doctors, mail carriers, farmers, police, teachers, trucks
- **Transportation (pre-K):** cars, trains, buses, boats, planes, traffic lights, roads
- **Fitness and field day:** relay races, ribbons, cones, jump ropes, stopwatch, sports drinks
- **Healthy bodies:** fruits, veggies, water, sleep, exercise, food plate
- **Dinosaur dig:** bones, brushes, fossils, volcanoes, eggs, jungle
- **Camping out:** tents, campfire, marshmallows, lanterns, stars, owls
- **Mexican culture (Cinco de Mayo, May 5):** Flag: teach about only; no costumes, sombreros or stereotypes
- **Asian American, Native Hawaiian and Pacific Islander Heritage Month:** Flag: teach real stories; student-made art
- **Testing week pep rally (upper grade):** brains, power bars, pencils, "you got this", trophies
- **Robots and coding:** robots, circuits, code blocks, arrows, gears, binary
- **Pixel garden (style):** pixel flowers, block bees, 8-bit sun, grid soil
- **Watercolor (style):** washes, blooms, soft edges, paint drips, brushes
- **Festival summer (teen):** stage lights, wristbands, guitars, banners, food trucks
- **Family Fun Day (May 30):** board games, picnic, kites, bikes, playground
- **Memorial Day (May 31):** Flag: solemn; no game theme. Skip

**June**
- **Summer countdown:** calendars, suns, sunglasses, beach balls, countdown chains
- **Ocean animals:** whales, dolphins, octopus, sea turtles, jellyfish, coral, starfish, crabs
- **World Oceans Day (Jun 8):** reefs, waves, recycling, sea life, blue gradients
- **Beach day:** sand castles, buckets, shells, umbrellas, surfboards, flip flops
- **Under the sea:** submarines, treasure chests, mermaids (original), seaweed, bubbles
- **Pirates and treasure:** ships, maps, X marks, parrots, gold coins, spyglass
- **Picnic:** baskets, checkered blankets, ants, sandwiches, lemonade, watermelon
- **Ice cream shop:** cones, scoops, sprinkles, sundaes, cherries, menu board
- **Bugs at night:** fireflies, jars, moon, crickets, moths, glow
- **Camp and outdoors (Great Outdoors Month):** tents, hiking boots, trail maps, compass, canoes
- **End of year awards:** trophies, medals, ribbons, certificates, confetti, caps
- **Graduation:** caps, diplomas, tassels, balloons, school colors
- **Father's Day twin, "people I love" (Jun 20):** ties, tools, family hands, trophies. Flag: avoid "dad-only"
- **Juneteenth (Jun 19):** Flag: teach real history; not a party theme
- **Pride Month:** Flag: restricted or contested in some districts; owner to decide
- **Lemonade stand:** lemons, pitchers, signs, coins, ice, stripes
- **Fruit faces (pre-K):** strawberries, watermelons, pineapples, bananas, smiles
- **Sports summer games (not the trademarked name):** medals, rings of color, torches, podiums, flags
- **Tropical paradise:** palm trees, flamingos, parrots, hibiscus, coconuts, sunsets
- **Retro surf (teen):** surf vans, sunset stripes, wave curls, 70s type
- **Summer solstice (Jun 21):** sun rays, longest day, sundials, shadows
- **Postcard travel (style):** stamps, postmarks, maps, suitcases, landmark doodles

#### Q3

**July**
- **Summer camp:** cabins, canoes, campfire, marshmallows, flags, friendship bracelets, lanyards
- **Fireworks and stars (Independence Day, Jul 4):** fireworks, flags, stars, red white and blue, parades
- **Ice Cream Day (Jul 18):** cones, scoops, drips, trucks, sprinkles, sundae bar
- **World Emoji Day (Jul 17):** smileys, hearts, thumbs up, stars (original drawn faces, not a platform's set)
- **Moon Day (Jul 20):** moon, footprints, lunar lander, craters, flag, astronauts
- **Chocolate Day (Jul 7):** chocolate bars, drips, cocoa beans, truffles, wrappers
- **Shark days (not the TV brand):** sharks, teeth, fins, reefs, divers, cages
- **Road trip:** car, maps, gas station, license plates, snacks, motels, mile markers
- **Travel journal (scrapbook):** tickets, stamps, polaroids, tape, maps, labels
- **Scrapbook collage:** torn paper, tape strips, stamps, doodles, photo corners, handwriting
- **Summer reading:** books, reading tent, flashlight, library card, bookmarks
- **Zoo safari:** lions, giraffes, zebras, elephants, jeeps, binoculars
- **Water park:** slides, pools, floaties, splash, goggles, towels
- **Garden harvest:** tomatoes, zucchini, baskets, sunflowers, watering cans
- **Construction zone (pre-K):** dump trucks, cranes, cones, hard hats, bricks
- **Y2K retro (teen):** gel pens, flip phones, butterflies, chrome, glitter, star stickers
- **Vaporwave sunset (teen):** palm trees, grid horizon, pink and teal, chrome type
- **Kawaii (style):** cute food, clouds, stars, pastel blush, happy faces
- **Digital pixel (style):** pixel hearts, 8-bit coins, blocky trees, pixel fonts
- **Glitch art (teen):** RGB split, scan lines, static, error windows
- **Music festival:** stages, guitars, light rigs, wristbands, crowds of doodles
- **Dino island:** volcanoes, jungle, eggs, footprints, fossils, ferns

**August**
- **Back to school:** backpacks, pencils, crayons, buses, lunchboxes, apples, rulers, notebooks
- **All about me:** self portraits, favorites, hand prints, name art, family, birthday
- **School supplies:** glue, scissors, markers, erasers, sharpeners, pencil cases
- **Classroom community:** class rules, puzzle pieces, hands, team flags, high fives
- **Getting to know you:** speech bubbles, question marks, name tags, interviews
- **School bus (pre-K):** yellow bus, stop sign, wheels, driver, seat rows
- **Colors and shapes (pre-K):** circles, squares, triangles, rainbow, crayons, color mixing
- **Cat Day (Aug 8):** cats, yarn, whiskers, fish bowls, cat naps
- **Dog Day (Aug 26):** dogs, bones, leashes, frisbees, dog park
- **Left-Handers Day (Aug 13):** left hands, mirror writing, scissors, "lefty" badges
- **Lazy Day (Aug 10):** hammocks, sloths, pillows, naps, slow snails
- **Solar eclipse (Aug 2, 2027, memory; not visible in the US):** sun, moon, corona, glasses, shadow
- **Sports season (teen):** football, soccer, volleyball, cross country, jerseys, playbooks
- **Retro notebook (style):** composition book marble, doodles, lined paper, binder clips
- **Graffiti wall (teen, legal art only):** spray bubbles, tags of students' own names, bricks, drips
- **Aesthetic school (teen):** iced coffee, planners, highlighters, plants, cozy desk
- **Superhero academy (original heroes):** capes, masks, emblems, power stars, city skyline
- **Under construction:** cones, cranes, blueprints, hard hats, tool belts
- **Jungle:** monkeys, vines, parrots, tigers, leaves, waterfalls
- **Rainbow classroom:** rainbow pencils, rainbow bunting, color order
- **Camping classroom:** tents, lanterns, logs, stars, trail signs

**September**
- **Apples:** apples, orchards, baskets, worms, pies, apple trees, red green yellow
- **Johnny Appleseed Day (Sep 26):** seeds, apple trees, pots, maps, sacks
- **Talk Like a Pirate Day (Sep 19):** pirate ships, eye patches, parrots, treasure, maps, "arr". Flag: check whether the name is trademarked before public use (unknown)
- **Fall begins (equinox ~Sep 23, check):** first leaves, acorns, scarecrows, cozy sweaters
- **Scarecrows:** straw, hats, crows, cornfields, patches, plaid
- **Grandparents Day (Sep 12):** family trees, photos, rocking chairs, stories. Flag: some children lack grandparents; "special grown-ups"
- **International Literacy Day (Sep 8):** books, letters, alphabet, reading buddies, library
- **Library card month:** library cards, shelves, stamps, book carts, reading nook
- **Hispanic Heritage Month (Sep 15 to Oct 15):** Flag: teach real stories; student art; no costumes
- **Labor Day / community workers (Sep 6):** tools, uniforms, trucks, hard hats, helpers
- **Constitution Day (Sep 17):** quills, scrolls, stars, flags, "we the people"
- **Fall harvest:** corn, wheat, baskets, tractors, pumpkins, sunflowers
- **Spiders and webs:** webs, spiders, dew drops, patterns (not spooky)
- **Owls:** owls, moons, branches, feathers, eyes, nests
- **Nocturnal animals:** bats, owls, raccoons, foxes, moon, stars
- **Pixel blocks (style):** blocky trees, ores, gems, pickaxes, square suns, grid
- **Board game night (style):** dice, spinners, cards, game pieces (original), boards
- **Football and tailgate (teen):** helmets, scoreboards, banners, pennants
- **Mindfulness corner:** breathing stars, calm clouds, plants, lavender, meditation mats
- **Chalkboard (style):** slate, chalk doodles, apples, erasers
- **Mystery and detective (teen):** magnifying glass, footprints, codes, case files
- **Fire safety (prep for October):** fire trucks, hoses, ladders, smoke alarms, dalmatians

#### Q4

**October**
- **Spooky-cute (Halloween twin):** friendly ghosts, smiling pumpkins, bats, moons, candy, purple and orange
- **Halloween (Oct 31):** pumpkins, costumes, candy, jack-o-lanterns, haunted house, witches. Flag: some districts restrict; offer the twin
- **Pumpkin patch:** pumpkins, vines, hay rides, scarecrows, wagons, pumpkin math
- **Fall leaves:** maple, oak, acorns, leaf piles, rakes, red orange yellow
- **Harvest festival:** corn stalks, apples, hay bales, baskets, gourds, cider
- **Fire Prevention Week (Oct 3 to 9):** fire trucks, hoses, stop drop roll, smoke alarms, helmets
- **Bats:** bats, caves, echolocation, moon, fruit, night sky
- **Spiders (science):** webs, eight legs, egg sacs, spinnerets
- **Friendly monsters:** one-eyed monsters, fuzzy fur, horns, polka dots, silly teeth
- **Monster dance party (not the song title):** disco ball, monsters dancing, music notes
- **Candy corn colors:** yellow, orange, white stripes, triangles
- **Haunted library (book week twin):** floating books, candles, owls, cobwebs, story characters (public domain)
- **World Animal Day (Oct 4):** pets, wildlife, paw prints, globe
- **World Food Day (Oct 16):** fruits, veggies, grains, farms, plates
- **Pizza month:** pizza, toppings, fractions, chefs
- **Bullying prevention month:** kindness, buddy bench, hands, unity colors
- **Indigenous Peoples' Day (Oct 11):** Flag: teach real history; no costumes or "tribal" decor
- **Diwali (~Oct 29, memory, check):** Flag: teach about; twin is "festival of lights" or "winter lights"
- **Day of the Dead (Nov 1 to 2):** Flag: cultural and religious; teach about; no costume-style theme
- **Mad scientist lab:** beakers, bubbles, goggles, potions (science), lab coats
- **Dark academia (teen):** old books, candles, ink, plaid, libraries, brown and burgundy
- **Gothic spooky (teen style):** moons, ravens, castles, purple black
- **Neon glow night (style):** glow sticks, black light, neon skeleton (science), glow pumpkins
- **Mystery mansion:** keys, doors, candelabras, clues, secret passages

**November**
- **Gratitude:** thankful leaves, hearts, journals, notes, gratitude trees
- **Thanksgiving (Nov 25):** turkeys, pies, cornucopia, feast table, family. Flag: no costumes or caricatures of Native peoples
- **Turkey trouble (silly, pre-K):** disguised turkeys, feathers, hats, hiding spots
- **Harvest feast:** corn, squash, pies, bread, apples, baskets
- **Native American Heritage Month:** Flag: teach real stories; student-made art; no "tribal" decor
- **World Kindness Day (Nov 13):** kindness hearts, smiles, notes, helping hands
- **Sandwich Day (Nov 3):** sandwiches, bread, lunchbox, fillings, toothpicks
- **Picture book month:** picture books, bookmarks, illustrators' desks, crayons
- **Veterans Day (Nov 11):** Flag: solemn; thank-you cards only; no game theme
- **Forest animals:** foxes, deer, owls, raccoons, hedgehogs, squirrels, mushrooms
- **Hedgehog cozy:** hedgehogs, leaves, mushrooms, acorns, mossy logs
- **Fall foods:** apples, pumpkins, cider, pies, cinnamon, caramel
- **Cozy sweater (style):** knit patterns, cable stitch, scarves, mugs, plaid
- **STEM and STEAM (Nov 8):** gears, beakers, paintbrushes, robots, circuits
- **Native plants and seeds:** seeds, corn, beans, squash, garden rows
- **Football and tailgate:** footballs, goal posts, banners, scoreboards
- **Leaf peeping road trip:** maps, cars, red trees, hills, cameras
- **Pilgrims and ships (history, upper grade):** Flag: teach multiple perspectives
- **Weather and first frost:** frost, clouds, thermometers, wind
- **Pixel fall (style):** pixel leaves, 8-bit pumpkins, block trees
- **Lo-fi autumn (teen):** rain, lamp, books, tea, headphones

**December**
- **Winter lights (inclusive December):** string lights, candles, lanterns, stars, glow, snow
- **Gingerbread town:** gingerbread houses, candy, frosting, gumdrops, cookie people. Flag: some read as Christmas
- **Holiday cookies:** cookie cutters, sprinkles, ovens, milk, recipe cards. Cookie Day Dec 4
- **Snowflakes and first snow:** snowflakes, snowmen, sleds, scarves, mittens, icicles
- **Winter solstice (Dec 21):** sun, longest night, moon, stars, candles
- **Winter night train (avoid the famous book and film title):** trains, tracks, snow, tickets, lanterns
- **Hot cocoa bar:** mugs, marshmallows, peppermint, whipped cream, steam
- **Reindeer and forest:** reindeer, antlers, pine trees, snowy hills (not Santa)
- **Cozy pajama day:** pajamas, blankets, books, slippers, pillows
- **Holidays around the world:** Flag: teach about several traditions equally; no single religion; menorahs, kinara, trees and diya lamps only as taught content
- **Christmas (Dec 25):** Flag: many public schools avoid; twin is Winter lights or Gingerbread town
- **Hanukkah (~late Dec, check), Kwanzaa (Dec 26 to Jan 1):** Flag: teach about only
- **Wrapping paper (style):** stripes, polka dots, bows, ribbon, tape
- **Crossword Puzzle Day (Dec 21):** crossword grids, letters, pencils, puzzle boxes
- **Day of the Horse (Dec 13):** horses, barns, saddles, horseshoes, hay
- **Brownie Day (Dec 8):** brownies, pans, squares, fractions
- **Winter animals:** foxes, rabbits, owls, deer, cardinals, tracks in snow
- **New Year's countdown:** clocks, confetti, party hats, noise makers, 2028 balloons
- **Toy workshop (non-Santa):** wooden toys, blocks, tools, robots, wrapping
- **Arctic research station (teen):** snow cats, sled dogs, labs, aurora
- **Frosted glass (style):** frosty panels, ice crystals, soft blue blur
- **Sticker advent calendar (style):** 24 sticker squares, numbers, peel corners

#### Competitor themes (patterns only; never copy names, characters or art)

- **Wordwall** (page opened): activities come in "different visual styles" that change
  "graphics, fonts, and sounds"; one named style, **Primary**, uses a font made for
  early readers. Full style list not seen (from memory it includes chalkboard, neon,
  space and others; unverified).
- **Blooket** (search summaries only; site 403): over 15 game modes, each with its own
  setting; limited-time seasonal modes (a spring egg hunt, summer and winter modes, an
  October candy mode, a December workshop mode); collectible character packs with
  seasonal and holiday sets; a seasonal shop during events.
- **Baamboozle** (search summaries only; site 403): "various themes, versions, and
  power-ups"; a board-game style mode with characters, a board and power-ups; free
  accounts reportedly get one game style.
- **Table stakes (all have some form):** a seasonal look for Halloween, winter or
  December, Valentine's and spring; a style for young readers; cute collectible
  characters. Gamify needs these on day one.
- **What none of them appear to do (as far as summaries show; not checked in their
  apps):** let a class make the theme by hand and photograph it into the game; themes
  matched to preschool and kindergarten weekly units with matching pieces; inclusive
  twins for restricted holidays; teen aesthetic styles (lo-fi, dark academia, Y2K);
  a silly-days calendar. Proposed edge list item for the bible section 13 (not edited
  here; owner or director to approve): "Your class designs the theme, by hand or on a
  screen; theirs is a menu."

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
