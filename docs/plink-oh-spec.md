# Plink-oh Game Module Spec

> Displayed on the site as **"Ohhh...Plink"** -- the module, file, and
> route are still internally named `plink-oh` / `ohhh-plink` for code
> stability; this doc uses the original working name throughout.

First game module built against the platform architecture in
`docs/platform-spec.md`. Rules were reconstructed from the Baamboozle
"Plink-oh!" Notion walkthrough (screenshots supplied directly, since
`bbzl.notion.site` is not reachable from this build environment).

## Confirmed rules (from the walkthrough)

- **Setup:** choose number of teams and number of rounds via sliders; name
  each team and pick its ball color.
- **Options:** Q. Options (question gate on/off, also opens the Question
  Options submenu), Power-ups on/off, Spikes on/off, Full Screen,
  Music, Sounds (off/low/med/high).
- **Question Options submenu:** how many questions per turn, Manual Deck
  (click a card deck vs. click the team's name to reveal a question),
  Timer (seconds per question) on/off, Random Order on/off.
- **Turn flow:** reveal a question (deck click or team-name click depending
  on Manual Deck) → the answer is shown to the room → the host judges it
  live with "Oops" (wrong) or "Okay" (correct) -- there is no automated
  grading.
- **Drop:** on a correct answer, the team picks one of several numbered
  drop zones at the top of the board and drops a ball. It bounces down
  through a peg field and lands in one of several point-value buckets at
  the bottom. Buckets carrying 1-3 stars also award a power-up.
- **Power-ups:** earned power-ups show as stars under a team's name. On a
  later turn, before dropping, the team can spend one earned power-up or
  decline ("X"). Unused power-ups are lost at the end of the turn -- they
  never carry forward.
- **Rounds:** all teams take a turn each round; buckets are re-rolled
  (different count and point values) between rounds.
- **End of game:** after the final round, the team with the highest total
  score wins. Restart (new game, same teams), Review (see every question
  asked), and Menu are offered.

## Assumptions made (not shown in the walkthrough -- open to correction)

These are implemented but clearly isolated so they're easy to change once
the real behavior is known:

1. **Power-up effects.** The walkthrough shows three named power-ups
   (Bowling Ball, Blue Turtle, Dynamite) and the pick UI, but never states
   what each one does to a drop. Implemented in
   `src/games/plink-oh/data.js` / `PlinkoBoard.js` as three different
   biases on the peg-bounce random walk:
   - *Bowling Ball* -- drops almost straight down (minimal bounce).
   - *Blue Turtle* -- bounces are pulled back toward board-center.
   - *Dynamite* -- bounces are pushed outward toward the edge buckets.
2. **Spikes.** Assumed to be extra hazard pegs that widen the bounce
   distance (higher-variance drops) -- not confirmed against the source.
3. **Wrong-answer consequence.** Assumed a missed question skips that
   drop entirely (no ball, turn/question count still advances). The
   walkthrough doesn't show what happens after "Oops."
4. **Questions-per-turn interaction with drops.** Assumed each correct
   answer within a turn earns exactly one drop, up to the configured
   "questions per turn" count.
5. **Bucket count/values per round.** Walkthrough screenshots show
   different bucket counts (3, 4, up to 7) and values across rounds, so
   buckets are randomly regenerated (4-7 buckets, values drawn from a
   fixed pool) at the start of every round rather than fixed for the whole
   game.
6. **Power-up award trigger.** Assumed landing in *any* starred bucket
   awards exactly one random power-up, regardless of its star count (1-3
   stars is treated as rarity/flavor, not a multiplier).

## What's built (`src/games/plink-oh/`)

- `data.js` -- team colors, bucket/point generation, power-up defs, and a
  15-question demo literacy question bank (placeholder content; real
  authoring/import is platform-level work per the main spec, not part of
  this module).
- `PlinkoBoard.js` -- canvas peg board, drop-zone buttons, animated ball
  drop (row-by-row random walk, not a full physics engine), bucket strip.
- `sound.js` -- tiny procedural beep effects gated by the Sounds level;
  Music is stored as a setting but not implemented (no track/asset).
- `PlinkOhGame.js` -- setup screen, options + question-options screens,
  turn/round state machine, scoreboard, winner screen with Restart /
  Review / Menu.

Wired at `/games/plink-oh` in this standalone app (see repo root `README.md`
for how it's structured) -- no auth, no dependency on the VLN literacy
data platform at all.

**Not built yet** (deferred to later platform phases, see roadmap in
`platform-spec.md`): teacher-authored/imported question sets
(currently a fixed demo bank), student accounts/profile/badges, live
join-code hosted sessions (this is local hot-seat play only), and
accessibility toggles beyond Sounds/timer (dyslexia font, screen reader,
reduced-motion "calm mode" are not wired in yet).

## Board size spec (px)

Reference for building matching Canva assets (backgrounds, ball skins,
bucket art). Pulled directly from `PlinkoBoard.jsx`'s constants -- if
those constants change, this table is stale and should be re-pulled from
source rather than hand-edited.

| Element | Size | Notes |
|---|---|---|
| Board canvas | 560 x 360 | Internal resolution; scales responsively up to 560px wide |
| Board border radius | 20px | Site "panel" shape token |
| Board border | 3px | Solid, site border color |
| Peg grid | 11 cols x 8 rows | Alternating rows offset by half a column |
| Column spacing | 46.67px | 560 / 12 |
| Row spacing | 32.89px | (360 - top margin - bottom margin) / 9 |
| Top margin (drop zone -> first peg row) | 34px | |
| Bottom margin (last peg row -> buckets) | 30px | |
| Peg dot | 3.5px radius | Regular pegs |
| Spike peg | ~10px wide x 10px tall triangle | Every 3rd row when Spikes is on |
| Ball | 9px radius base | Squashes +/-12% (~7.9-10.1px) on each bounce |
| Bounce arc | 5px vertical lift | Small hop between peg rows during the fall |
| Drop-zone buttons | 12px radius, 2px border, 4px gap | Row above the board |
| Bucket strip | 12px radius, 4px gap, equal-width flex | Row below the board |
| Full drop animation | ~1.84s | 190ms/row x 8 rows + 320ms landing settle |

## Open question for the user

The power-up effects and spike behavior (items 1-2 above) are the two
assumptions most likely to be wrong. If you have the real rules, tell me
what should change and I'll swap the bias values in `data.js` /
`PlinkoBoard.js` accordingly -- no architecture changes needed.
