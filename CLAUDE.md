# Gamify -- Development Standards

Standalone K-12 educational gamification platform (Vermont Literacy
Network). See `docs/product-plan.md` for the commercial product plan
(newest), `docs/platform-spec.md` for the original spec, and
`docs/question-engine.md` for the shared game engine.

## The Three-Lens Standard (mandatory)

"It technically works" and "good enough" are never the bar here. Before any
feature, fix, or redesign is considered done, it must be evaluated through
all three lenses below -- not just read through, actually run in a browser
and checked against each one. See `docs/testing-standards.md` for the full
checklist, test methods, and worked examples.

1. **K-3 student navigating the site.** Clear, understandable, visually
   directive. A pre/early reader should know what to do from shape, color,
   icon, and motion alone -- not from reading dense instructions.
2. **The K-12 gamer.** These are kids who love video games and need
   high-interest, positive experiences to stay engaged. Every interaction
   should feel responsive and rewarding, held to the production-polish bar
   of Blooket/Kahoot/Wordwall, not "it animates, ship it."
3. **The teacher.** The platform must be educationally supportive,
   configurable, and trustworthy enough to run live in front of a class of
   25 kids without confusion or breakage.

A change that passes lens 2 but fails lens 1 (flashy but confusing for a
6-year-old) is not done. A change that passes lenses 1-2 but gives the
teacher no control or educational value is not done.

## Testing practice

- Never declare a UI change complete from reading the code. Run the dev
  server, drive it in a real browser (headless Chromium via Playwright is
  set up for this environment), and look at actual screenshots -- see
  `docs/testing-standards.md` for the harness pattern already in use.
- For animation/motion work specifically: capture multiple frames at short
  intervals during the animation and inspect them for continuity. A
  "smooth" claim that hasn't been frame-checked is not verified.
- Check every device: iPad / tablet (portrait and landscape) AND computers
  (laptop screens, mouse and keyboard). We don't know what students and
  teachers use (teacher, 2026-10-24); Playwright runs all three sizes. Check for dead/empty space on both short and tall screens.
- Read every console error/warning from the browser session before calling
  something done.

## Standing product facts (don't relitigate without asking)

- Standalone app, no auth, no dependency on the VLN literacy-data-plaform
  repo or its Supabase instance.
- Gamify is a commercial product (free tier + subscriptions). See
  `docs/product-plan.md`. The Ohhh...Plink prototype was removed
  2026-10-24; game modules are rebuilt from scratch on the shared engine
  in `docs/question-engine.md` (logic from the Independent Work Dashboard).
- Question sets are teacher-authored/imported, never a fixed bank.
- Game rules inspired by other platforms are reconstructed from
  screenshots/descriptions and reimplemented from scratch. Never scrape,
  decompile, or copy another platform's actual source code or assets,
  reachable or not.
- Platform look (menus, teacher pages): the light "sticker" style in
  `src/index.css` (lavender ground, white panels, dark outlines, gold
  accent, one shape scale). Use its tokens before adding colors or radii.
  Game stages wear per-game themes (`src/theme`), designed per game.

## Before every commit

Run `npm run check` (type-check, unit tests, build). For screens, also
`npm run e2e` (Playwright at iPad portrait and landscape).

## The development plan is the build bible (a live Claude Doc)

The live plan is the Claude Doc **"Gamify Development Plan"**:
https://claude.ai/artifact/P8kwMjDCq1E2yCa8VaMSpj (doc id
`b33e558c-1899-46b6-891a-c536fba51844`). It lays out the stages to launch,
the rules for building independently, the defaults for open decisions, and
the "Waiting on you" items only the teacher can do. The teacher can edit it
any time, and their edits win.

- Always keep it updated (direct teacher rule, 2026-10-24): at the start
  of a session read it for changes; after every item ships, tick it off,
  and add a row to its Progress log (date, what shipped, what's next).
  New ideas, decisions and blockers go in the same turn they come up.
- Work its stages top to bottom, and keep working (direct teacher rule,
  2026-10-24: "you should always be working on the dev plan. predict my
  answers based on previous"). Stop only for the doc's "Waiting on you"
  items (money, accounts, legal, going live); for any other open
  question, predict the teacher's answer from past decisions, note the
  guess in the doc's Progress log, and keep building.
- `docs/development-plan.md` is only a backup snapshot for sessions
  without the docs connector; the doc wins.

## Marketing ideas list (standing rule, 2026-10-24)

Whenever a feature, design choice or research finding could be used well
in marketing, add it to `docs/product-plan.md` section 10 in the same
change. The teacher adds their own too; never remove theirs. The same goes
for the blog post ideas list (section 10A): any new way to use Gamify in a
classroom becomes a post idea there.

## Legal readiness (mandatory, we sell this)

- No other company's brand or trademark in any customer-facing name or
  text: game names, theme names, UI copy, URLs, marketing. Use the rename
  list in `docs/product-plan.md` section 3.
- Every font, icon, image, sound and library needs a commercial-use
  license recorded in `docs/asset-ledger.md` before it ships. No "found
  online" assets, nothing resembling a famous character or game's look.
- Student pages: no ads, no trackers, no upgrade prompts, prices or "buy"
  words (locked game covers in the free Arcade are a lock icon only),
  minimum data
  (code + nickname or a class-list sign-in, no email student accounts). Accessibility features are never
  paywalled.
