# Testing Standards -- The Three Lenses

Every feature, fix, and redesign in Gamify gets evaluated through three
perspectives before it's called done. This is not a formality -- each lens
has caught real bugs and design gaps that "does it technically work" missed
(see Case Studies below).

## Lens 1: The K-3 student, navigating

**Question:** Would a 6-8 year old, who may not read fluently, know what to
do on this screen without help?

Checklist:
- [ ] There is one visually obvious next action per screen (biggest, most
      colorful, or only moving element).
- [ ] Meaning is carried by icon/color/shape, not text alone. Any icon used
      for a primary action has an unambiguous, kid-tested meaning (a deck
      of cards to "reveal," a house to "go home," a big friendly circle to
      "tap here").
- [ ] Touch targets are large (44px+ minimum; bigger for primary actions).
- [ ] No screen leaves the student with no visible way forward or back.
- [ ] Any required reading is short, plain-language, and ideally paired
      with a non-text cue (color, icon, position).
- [ ] Errors/dead ends don't happen silently -- if something can't be
      tapped yet, it looks visually inactive, not just unresponsive.

**Test method:** Walk through the flow narrating out loud what a 6-8 year
old would look at first and tap first. If that action isn't the correct
one, the screen fails this lens regardless of how it reads to an adult.

## Lens 2: The K-12 gamer

**Question:** Does this feel like a game these kids actually want to keep
playing, on par with Blooket/Kahoot/Wordwall -- or does it feel like a form
with a game skin on it?

Checklist:
- [ ] Every action gets immediate, satisfying feedback (motion, sound,
      color change) -- not just a state update with no visual response.
- [ ] There's a sense of momentum and reward: points landing, streaks,
      celebration on milestones/wins.
- [ ] Losing/missing a question feels like part of the game, not a scold --
      tone and color on "wrong" states should stay encouraging.
- [ ] No dead waiting. If something takes more than ~300ms, it should be
      animating, not frozen.
- [ ] Play it through multiple rounds like a kid would, not just one lap.
      Does it hold up by round 3-5, or does it get repetitive/boring?

**Test method:** Play a full game end-to-end, more than once, paying
attention to whether *you* want to keep playing -- not whether the code
path executes without errors.

## Lens 3: The teacher

**Question:** Would a teacher trust this enough to run live in front of 25
kids, and does it actually support what they're teaching?

Checklist:
- [ ] The educational content (questions, standards alignment where
      applicable) is front and center, not an afterthought bolted onto a
      game shell.
- [ ] The teacher has real configuration control (difficulty, pacing,
      content, accessibility toggles) without needing to dig for it.
- [ ] Nothing about the experience would embarrass a teacher mid-class --
      no visibly broken states, no confusing dead ends, no jank.
- [ ] Accessibility settings (calm mode, fonts, sound, timers) are easy to
      find and actually do what they claim.
- [ ] There's a way to review what happened (a session recap), not just a
      final score.

**Test method:** Imagine running this live, cold, in front of a class.
Would you feel confident, or would you be bracing for something to go
wrong?

## Testing harness in use

Every UI pass in this repo is verified by actually running the app, not by
reading the diff:

```bash
npm run build          # catch compile errors first
npx vite preview --port 5173 --host &
```

Then drive it with a headless Chromium session (Playwright, via
`playwright-core` pointed at the pre-installed browser at
`/opt/pw-browsers/chromium`) -- navigate the real flow, screenshot at
meaningful points, and read back the console for errors. For animation
work specifically, screenshot at short fixed intervals (80-170ms) through
the whole animation and inspect the sequence for continuity -- a "smooth"
claim that hasn't been frame-checked this way is not verified.

Primary device target is iPad/tablet, so at least one pass should run at a
tablet viewport (roughly 820x1180), not just desktop.

## Case studies (why this matters)

- **The reveal-card click bug.** A shared `Panel` component didn't forward
  `onClick` to its underlying `<div>`, so the question-reveal card was
  completely unclickable -- gameplay was silently stuck on turn one. Found
  only because the browser-driven test tried to click it and the game
  state never advanced. Reading the code, it looked fine.
- **The choppy ball drop.** The Plinko ball animation "worked" (it landed
  in the right bucket, scores updated correctly) but moved via discrete
  170ms teleports with no interpolation. Found by screenshotting every
  frame and seeing it snap sideways rather than fall. Fixed with a
  continuous `requestAnimationFrame` interpolation loop instead of a
  `setTimeout` chain.
- **The empty-void layout.** Short content (a setup form) on a tall
  viewport left a large flat black area below it that read as broken or
  unfinished, even though every element on the page was individually well
  designed. Only visible by screenshotting the full tablet viewport, not a
  cropped component view.

## Known gaps flagged under this standard (not yet fixed)

Honest accounting from applying the three lenses to Plink-oh as it stands:

- **Lens 1:** No audio narration for question text -- a pre/early reader
  (especially K-1) can't access a text-only question. The drop-zone number
  buttons (1-6) have no visual metaphor explaining what they do beyond the
  number itself.
- **Lens 2:** The "Oops" wrong-answer state uses a hard red X, which reads
  more like a scold than an encouraging miss. Worth softening. The demo
  question bank is small enough to repeat within a single game, hurting
  replay interest -- resolved once teacher-authored content ships.
- **Lens 3:** Teacher question authoring doesn't exist yet (platform-level
  work per `platform-spec.md`, not a Plink-oh-specific gap).
- **Lens 1 & 3 (accessibility toggles):** dyslexia font, screen reader
  support, and reduced-motion "calm mode" from the original brainstorm are
  not wired in yet. Research pass in `docs/accessibility-research.md`
  found the Plinko `<canvas>` is currently invisible to screen readers
  (needs `aria-label` + live-region announcements for turns/results), and
  that "dyslexia font" should be redesigned as a spacing/line-height
  control first, font-swap second -- the evidence for font shape alone is
  weak.
