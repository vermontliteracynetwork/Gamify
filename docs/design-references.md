# Design Chair: brainstorm protocol and reference log

Teacher rule (2026-11-23): "design chair should set a protocal and reference
log of places, skills, addons, etc. that they use to guide their design
choices. this should be a guideline they follow in the brainstorm mockup stage."

The Design Chair follows this protocol for every brainstorm and mockup, and adds
a line to the reference log each time a source shapes a choice. Learn the idea
from a reference; never copy its art, layout, words or code.

## The brainstorm and mockup protocol

1. **Start from her words.** Quote the request and any images, check
   `docs/teacher-preferences.md`, the Brand Kit doc and `/brand`. Write the one
   job the design must do and who it is for (K-3 student, gamer, teacher, buyer).
2. **Pick the references.** Choose at least three sources from the library below
   that fit the job (one site gallery, one of her own references, one skill).
   Open them (cite only pages actually opened; mark memory as memory).
3. **Run the skills.** `classic-art` for any Classic asset, `ui-ux-pro-max` and
   `design-system` for layout, type and tokens, `design:design-critique` and
   `design:accessibility-review` on the draft, `design:ux-copy` for words,
   `golden-rule` for anything in a game.
4. **Make two or three directions,** not one, each named by its idea, using the
   real Classic layout and the approved kit (the kit wins over any reference).
5. **Check every direction:** iPad portrait and landscape, laptop and a short
   1190 x 540 window; WCAG 2.1 AA contrast; reads at a glance for a K-3 student;
   clearly different from Blooket, Baamboozle, Kahoot, Wordwall and Gimkit.
6. **Challenge and recommend.** Name the strongest direction, its weak spot, the
   psychology or research behind it, and concrete UI advice (sizes, colors,
   motion), per the team rules.
7. **Log it.** Add a row to the reference log below; put the proposal on `/brand`
   or the Brand Kit doc marked Proposal. Nothing goes live until she approves.

## Reference library

### Design galleries (teacher's list, 2026-11-23)
Purposes below are from memory of what each gallery collects; confirm on first visit and correct here.

| # | Site | Use it for |
|---|------|-----------|
| 1 | land-book.com | Landing page and whole-site layouts (home, features pages) |
| 2 | supahero.io | Hero sections: headline, tagline, first-screen layout |
| 3 | pricingpages.design | Pricing page layouts (value first, plan tables) |
| 4 | socialproofexamples.com | Testimonials, reviews, logos, trust blocks |
| 5 | reallygoodemails.com | Emails: welcome, teacher onboarding, receipts, newsletters |
| 6 | deck.gallery | Slide decks: sales, school board and PD presentations |
| 7 | posts.design | Social media posts (theme kits, launch posts) |
| 8 | adfolio.design | Ads and ad creative |
| 9 | navbar.gallery | Navigation bars and menus |
| 10 | ogimage.gallery | Link preview (Open Graph) images for shared links |

### The teacher's own references (always first)
- Moodboards she sent (2026-11-23): playful flat shapes, scrapbook and mixed media,
  crayon and sticker art, a teacher scrapbook collage.
- Doodle illustration refs (2026-11-23): thick wobbly ink outline, solid grainy
  fills, crayon blob patches, doodle confetti (rules in `classic-art`).
- Crayon clipart she liked on Etsy (Playground Monster crayon clipart, Crayon
  Clipart Bundle 44): style reference only, no use without a bought license.
- Palette refs (2026-11-23): six-swatch bright palette with Blue Crystal light
  blue, a "bright crayons" palette moodboard, a kidcore 30-swatch palette.
- Her Classic board game die (one side at a time).

### Skills and add-ons
- Gamify: `classic-art`, `golden-rule`, `ui-libraries`, `asset-audit`, `brand`.
- Vendored (MIT): `ui-ux-pro-max`, `design-system`, `design`, `banner-design`,
  social research `social-*` (ScrapeCreators; needs a key, else web search).
- Design plugin: `design:design-critique`, `design:accessibility-review`,
  `design:ux-copy`, `design:design-system`, `design:user-research`,
  `design:research-synthesis`, `design:design-handoff`.
- Plugins and connectors: `frontend-design` (Anthropic directory), Canva
  (her brand kit, templates, social posts), Figma (read; her seat is View).

### Research and trend sources
- Pinterest public pins ("aesthetic brand kit", "classroom brand kit", "kids game
  UI"): patterns only, never reuse pinned images.
- Competitors to study, never copy: Blooket, Baamboozle, Wordwall, Flippity,
  Kahoot, Gimkit, Quizizz/Wayground, Classcraft.
- Research named in recommendations: WCAG 2.1, cognitive load, dual coding,
  seductive details, self-determination theory, Gestalt grouping, UDL.

## Reference log

Add one row per brainstorm or mockup: what was designed, the sources opened,
what each taught, and where the result lives.

| Date | Design | Sources used | What they taught | Result |
|------|--------|--------------|------------------|--------|
| 2026-11-23 | Doodle restyle of the crayon power-ups and dice | Her five doodle refs; `classic-art` | Ink outline, blob patch, doodle confetti | `/brand` New direction, CrayonKit |
| 2026-11-23 | Palette update (purple main, light blue added) | Her three palette refs (six-swatch with Violet Syrup and Blue Crystal, bright crayons, kidcore 30); `ui-ux-pro-max`/`design-system` token rules; WCAG 2.1 contrast computed for every swatch. Tried land-book.com and supahero.io: both blocked by this session's network (not opened, nothing cited) | One solid purple carries the brand (Grape, white text 5.6:1); light blue works as a pastel surface (Blue Crystal) plus one solid accent (Sky, ink text only); kidcore pastel rows become crayon blob patches; brights stay accents | `/brand` New direction, top block "Palette update (proposal)" (`src/brand/PaletteProposal.tsx`); Brand Kit doc Direction tab |
| 2026-11-23 | Universal patterns (quiet ground, confetti, cut paper, stripes, polka, board checker, blob wash) | Her doodle refs and palette refs; `classic-art` (ink outline, blob patch, doodle confetti); WCAG 2.1 contrast computed for the quiet ground; galleries not reachable this session | Busy pattern stays at the edges; only a near-invisible ground (1.13:1) behind text; each tile has a Calm version | `/brand` New direction "Universal patterns (proposal)" (`src/brand/PatternProposal.tsx`); Brand Kit doc Direction tab |
| 2026-11-23 | Universal views (13 shared screens: welcome, ways to play, set picker, options, teams, power-up setup, pop card, question screen, top strip and scoreboard, results, settings/calm/pause, join and lobby, teach card) | Today's real screens (GameWelcome, WayToPlay, ShareHow, SetPicker, SetupWizard, TeamSetup, PowerUpSwitches, LabPowerCard, QuestionScreen, TopStrip, TeachCard, en.ts strings); `docs/teacher-preferences.md`; the palette, pattern and crayon kit proposals; WCAG 2.1 (1.4.1 use of color, 2.5.5 target size, from memory); galleries not opened this session | Redesign, not a new product: same layouts and words; one Grape main button everywhere; shape plus color on teams; letters plus color on answers; quiet ground behind text, confetti at edges only | `/brand` Universal views tab (`src/brand/UniversalViews.tsx`); Brand Kit doc Direction tab |
| 2026-11-23 | Universal patterns redo | Her three pattern refs; Etsy 20 playful doodles listing (style only) | Dense tossed cut-paper shapes, offset-outline doodles, thick squiggle lines | /brand New direction, patterns |
| 2026-11-23 | Game mockups batch 1 of 4: Game Show and Board Game in the improved universal Classic theme (laptop 16:10 and iPad portrait, in play) | Each game's real code (game-show manifest, cards.ts, GameShow.tsx; castle-quest manifest, board.ts `layout()`, boardArt.tsx); `docs/teacher-preferences.md`; `classic-art` and `golden-rule`; the palette, pattern, crayon kit and universal views proposals; Gestalt figure-ground, dual coding, WCAG 2.1 1.4.1 (from memory); galleries not opened this session | Same game redrawn, not a new one: busy world at the edges with the board zone blocked out (studio stage; paper-craft park); calm pastel board, bright pieces; shape plus color for teams; no numbers on spaces; one lemon glow means your turn. Gap: the kit has no Prize Bag, so the mockup borrows Treasure Chest | `/brand` Game mockups tab (`src/brand/GameMockups.tsx`); next batch Match Three and Four in a Row |
| 2026-11-23 | Sticker collections and Achievement page (Starter collection of 12 die-cut stickers, earned and locked states, Achievement page mockup, Winter teaser) | Her die-cut "good job" sticker sheet (11 stickers); `classic-art` (flat fills, wobbly ink outline, no faces); palette proposal (PP); `ui-ux-pro-max` and `design-system` token rules; self-determination theory, overjustification effect, endowed progress, loss aversion, WCAG 2.1 1.4.1 and 2.5.5 (all from memory); galleries not opened this session | Thick white edge plus soft shadow reads as a sticker at 84 px; caption on an arc in Grow Year with a white halo stays legible; locked = 35% gray art but full-strength words; faces dropped per the no-faces rule (open question) | `/brand` Stickers tab (`src/brand/Stickers.tsx`); `docs/stickers.md` |
| 2026-11-23 | Game mockups batch 2: Match Three, Four in a Row, Bubble Pop, Bowling, Question Tracker (Live: class screen on the laptop, a student device on the iPad) | Each game's manifest and engine (match-three, four-in-a-row board.ts 7 x 6, bubble-pop board.ts 19 columns, bowling lane.ts, practice StarQuiz/Sky); the redone universal patterns (cut-paper toss, doodle scatter, squiggles, confetti, checker, quiet ground); `classic-art`, `golden-rule`, `docs/teacher-preferences.md`; WCAG 2.1 1.4.1, 1.4.11, 2.5.5, goal-gradient effect, self-determination theory, cognitive load (from memory); galleries not opened | Patterns only as stage grounds and edges, words always on paper; a shape or mark on every piece as well as a color; solo games show no player icon; Live splits the shared goal (class sky) from the personal task (question card). Gaps: the kit has no fireball, prize bag, gem, key or bubble bundle art, so the mockups borrow lightning, treasure chest, swap and one-more | `/brand` Game mockups tab (`src/brand/GameMockups.tsx`), all seven games |
