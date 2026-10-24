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
- Check the primary device target: iPad / tablet viewport, not just
  desktop. Check for dead/empty space on both short and tall screens.
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
- Dark theme, locked (no light mode). One accent color (gold), one shape
  scale (pill buttons / 20px panels / 12px inputs). See `src/index.css`
  for the token system before introducing new colors or radii. (Proposed:
  this governs platform chrome; themed game stages are an open decision in
  `docs/product-plan.md` section 4.)

## Marketing ideas list (standing rule, 2026-10-24)

Whenever a feature, design choice or research finding could be used well
in marketing, add it to `docs/product-plan.md` section 10 in the same
change. The teacher adds their own too; never remove theirs.

## Legal readiness (mandatory, we sell this)

- No other company's brand or trademark in any customer-facing name or
  text: game names, theme names, UI copy, URLs, marketing. Use the rename
  list in `docs/product-plan.md` section 3.
- Every font, icon, image, sound and library needs a commercial-use
  license recorded in `docs/asset-ledger.md` before it ships. No "found
  online" assets, nothing resembling a famous character or game's look.
- Student pages: no ads, no trackers, no upgrade prompts, minimum data
  (code + nickname or a class-list sign-in, no email student accounts). Accessibility features are never
  paywalled.
