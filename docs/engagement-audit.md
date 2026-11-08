# Gamify Engagement Audit

Claudia, 2026-11-08 (teacher request: research base, rubric, grade every Classic game, improvement list, then build). Scope: Game Show, Pinball, Board Game, Cast and Catch, Match Three, Four in a Row, Bubble Pop, Bowling, Question Tracker (Star Quiz), plus the shared engine. Scores are code-read scores; each improvement is frame-checked in Playwright before it is called done. Market claims are Claudia's own knowledge, marked [own knowledge], not live-verified. Builds on `docs/gamified-learning-research.md` and `docs/sound-and-motion-audit.md`.

**Direction change (teacher, 2026-11-08):** regular mode must be visually engaging; no calm crutch. "Still" motion stays only as an accessibility opt-in (never paywalled). Default is Full.

## 1. Research base: engagement features [own knowledge]

Each: + positive, - risk for K-12 and neurodivergent kids, HOLE = market gap.

### UX
- One obvious next action per screen. + pre-readers follow shape and motion. - option-heavy setup loses kids. HOLE: Kahoot/Blooket setup is text-heavy and host-centric.
- Fast first play (code, name, play in seconds). + less dead time. - long lobbies. HOLE: lobbies are dead time; nobody gives a toy while waiting.
- Loading and wait states. + an animated cue turns waiting into anticipation. - a blank screen reads as broken to a 6-year-old. HOLE: bare spinners or nothing.
- Hover text and hover motion. + confirms "I can press this". - no hover on iPad: needs a press-down equivalent. HOLE: hover delight is almost absent in quiz sites.
- Forgiveness. + lowers anxiety. - too many retries removes stakes. HOLE: wrong answers get a red flash and silence elsewhere.

### Functionality and design
- Chunky sticker controls. + obviously pressable. - decoration without response feels fake. HOLE: Wordwall looks dated.
- Visible progress that builds. + competence signal. - a cap with no payoff. HOLE: most tools show a number only.
- Teacher-editable everything. + trust. - option overload. HOLE: competitors lock modes to presets.
- Per-student settings (motion, sound, read-aloud). + key for neurodivergent kids. HOLE: rare.

### Gameplay
- Skill plus chance. + every turn differs; losing can still be fun. - pure luck undercuts learning. HOLE: Baamboozle is pure luck, Kahoot pure speed.
- The question is the key to the play action (retrieval). + learning payload. - long gaps break flow. HOLE: Blooket does it, but scores speed.
- Comebacks. + trailing kids stay hopeful. - mean steals sour feelings. HOLE: funny, non-mean negatives are rare.
- Surprise rewards after a right answer. + variable reward is the strongest pull. - casino feel if overused. HOLE: fixed points elsewhere.
- Effort-based reward. + protects slow readers. HOLE: speed scoring punishes careful kids.

### Motion and animation
- Animated text (letters spring in, shimmer on gold points). + read at a glance, feels alive. - slow banners hold up play. HOLE: static fades elsewhere.
- Idle motion (bobbing pieces, breathing glows, drifting clouds). + alive when nothing happens. - too many movers compete. HOLE: rare.
- Hover and press feedback (lift, wiggle, squash). + physical feel. HOLE: absent in most quiz UIs.
- Weighty movement (squash, overshoot, settle). + reads as real. HOLE: sliding tokens are the norm.
- Shake, hit-stop, zoom punch on big moments. + impact. - keep small and brief for sensory-sensitive kids.
- Themed loading animation. + covers the wait. HOLE: rarely themed.

### Juice, sound, color
- Layered feedback on every action (visual + sound + motion). HOLE: one layer elsewhere.
- Bursts scaled to the size of the win; never over 3 flashes a second.
- Score count-up and pop.
- Rising chime for right, soft sound for wrong, never a buzzer. HOLE: Kahoot's music is a common teacher complaint.
- Pitch that rises across a streak; small random pitch variation to stop habituation. HOLE: nearly unused.
- Ambient loop per game, with volume and off.
- Saturated, harmonious palette with one "important thing" color; never color alone (pair with an icon).

### Reward loops and return hooks
- A goal that builds across sessions (collection, shelf). + ownership (autonomy, competence). - guilt streaks harm. HOLE: Blooket/Gimkit tie collections to public ranks; a private, non-competitive collection is open ground.
- Short, replayable rounds. Seasonal or rotating content (teacher can switch off). Personal bests ("beat your own") instead of ranking.

## 2. Grading rubric (1 to 5; 3 or below goes on the improvement list)

| # | Criterion | 5 | 3 | 1 |
|---|---|---|---|---|
| D | Clear directions (pre-reader) | Picture and motion alone; an animated pointer on the target | Icon plus short text | Text only |
| P | Power-up response | Art, name, what it does; its own animation, sound and visible board effect; a clear end | Pop plus effect, shared sound | Silent number change |
| L | Fun gameplay loop | Skill plus chance, every turn different, "one more go" | Skill only or chance only | Repetitive |
| A | Animation in play | Weight on every move plus idle life | Moves animate, no weight or idle | Teleports |
| U | UI and GUI polish | Sticker look, hover and press on every control, animated text, themed loading | Consistent but static | Mixed or unresponsive |
| V | Visual satisfaction | Particles, glow, impact scaled to the win | End-only confetti | Nothing |
| S | Sound | Layered, varied, per action, never harsh, ambient | The same few sounds | Silent |
| R | Surprise and randomness | Variable rewards, irregular motion, comebacks | Random pickups only | Deterministic |
| G | Goal that visibly builds | The world changes toward a visible end | A counter | Score only |
| C | Come-back pull | A collection or personal best across sessions | Replay only | Nothing |
| E | Learning at the center | The question gates the play; effort rewarded | Question as an interrupt | Bolted on |
| T | Teacher control | Power-ups, tries, pacing, theme editable | Some | Hard-coded |
| F | No scroll, fits | iPad both ways and laptop, no scroll | One size | Scrolls |

## 3. Current games

### Shared positives (engine)
- Question screen: big tiles with letter and check/X marks (never color alone), shake on wrong, pulse on right, read-aloud, magnet fly-in.
- Turn card: bobbing, swaying icon with a spinning ray glow.
- Power-up pop and the big centered "is on!" message; power-ups switch on by themselves.
- Scoreboard: current player glows; score pops on change.
- Results box: winner stage, bobbing winners, spring open.
- Welcome: staggered how-to-play lines. Recorded sounds with fallbacks, no harsh buzzers.

### Per-game positives
- Game Show: marquee bulb chase, lucky-star wobble, light rays, tile wiggle on hover, hidden power-ups, swap spinner, CPU.
- Pinball: flippers, bumper pop and spark, chase lights, aim plus power bar plus physics, six power-ups.
- Board Game (rebuilt 2026-11-08): tumbling 2D die, hops with squash and a random arc, shield bubble, glowing turn square, forward/back wheel, tornado swirl, pulsing roll button, spring banners, dice and jump sounds.
- Cast and Catch: water scroll, drifting fish, bobber bite shake, splash ring, cast/splash/bell sounds, rarer fish for better casts.
- Match Three: combo and cascade tracking, shake on a bad swap, hint glow, blast and shuffle, the most bursts.
- Four in a Row: wandering held piece, gravity drop, win sweep, CPU levels, Pop Out and Double Drop.
- Bubble Pop: shot flies the aim line, groups swell, pop and fall, gold points halo, combos, drag/tap/arrow aim.
- Bowling: pin wobble, topple, sweep, spin control, seven power-ups, score count-up.
- Question Tracker: a sky that fills with stars, combo stars at 3/5/10/15/20/25, gold glow.

### Grades

| Game | D | P | L | A | U | V | S | R | G | C | E | T | F |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Game Show | 4 | 3 | 3 | 4 | 4 | 4 | 3 | 4 | 3 | 2 | 4 | 5 | 4 |
| Pinball | 3 | 3 | 5 | 4 | 4 | 4 | 4 | 5 | 3 | 2 | 3 | 4 | 4 |
| Board Game | 4 | 4 | 4 | 5 | 4 | 4 | 4 | 4 | 4 | 2 | 4 | 5 | 4 |
| Cast and Catch | 3 | 3 | 4 | 4 | 3 | 3 | 4 | 4 | 3 | 2 | 3 | 3 | 4 |
| Match Three | 3 | 3 | 4 | 3 | 3 | 4 | 3 | 3 | 3 | 2 | 3 | 3 | 4 |
| Four in a Row | 4 | 3 | 3 | 4 | 3 | 3 | 3 | 3 | 3 | 2 | 4 | 4 | 4 |
| Bubble Pop | 3 | 3 | 4 | 4 | 3 | 4 | 3 | 3 | 3 | 2 | 3 | 3 | 4 |
| Bowling | 3 | 4 | 5 | 4 | 4 | 4 | 4 | 5 | 4 | 2 | 3 | 4 | 4 |
| Question Tracker | 4 | 2 | 3 | 3 | 3 | 4 | 3 | 3 | 5 | 2 | 4 | 3 | 4 |

Key evidence:
- C = 2 everywhere: nothing carries across sessions (no collection, no personal best).
- P: every power-up shares one pop and one chime (`PowerUpPop.tsx`); only Board Game, Bowling and Cast and Catch have their own power-up sounds.
- S: five generic effects (`feedback.ts`); `win` is reused for everything; no streak pitch rise.
- U: the loading fallback is blank (`App.tsx`); question feedback text does not animate; answer tiles have no hover motion.
- V: little impact outside Pinball, Match Three and Bowling; bursts mostly at the end.
- A: hover motion on boards is missing almost everywhere (her stated priority).
- D: no animated first-turn pointer; welcome steps are text lines.

## 4. Improvement list (best gain for effort first)

Every item respects her preferences: no scroll, power-ups auto-use next turn, Classic default, no numbers on spaces, round player icons. "Still" turns new motion off.

### Quick wins (cross-game)
1. Answer feedback burst: star and spark burst from the right tile, small shake on wrong, hover lift and wiggle on answer tiles (`ShareQuestion.tsx`, `index.css`).
2. Animated text: a shared `PopText` (letters spring in with a random tilt, gold shimmer on points) for question feedback, power-up messages and game banners.
3. Themed loading animation: replace the blank fallback with hopping game pieces and "Getting ready" (`App.tsx`, new `src/ui/Loading.tsx`).
4. Sound layering: the right-answer chime rises one step per answer in a row (resets quietly on a miss); small random pitch wobble on taps (`feedback.ts`).
5. Hover and press motion on every board element (squares, columns, treats, bubbles, balls), with a press-down squash for iPad.
6. Idle life on boards: slow bob with random delays for waiting pieces and items.

### Medium
7. Each power-up its own entrance, sound and visible board effect, and a visible end; a Question Tracker surprise at combo milestones.
8. First-turn pointing cue: a bouncing arrow at the thing to tap, once per game; welcome steps as three picture steps.
9. Screen shake and zoom punch on big moments (Board Game win and tornado, Game Show jackpot, Four in a Row win, rare fish, big pop). Under 3 flashes a second.
10. Persistent collection, "My shelf": each finished game earns a sticker (a fish, a pin, a star) in a private shelf opened from the results box; "your best" line; no ranks; teacher can switch off.
11. Rotating variety: a weekly featured power-up and background tint, teacher toggle.
12. Waiting-room toy: tappable bouncing pieces on the lobby screen.

### Game-specific
13. Match Three: rising cascade sounds, "Wow" PopText, screen punch at cascade 3+.
14. Four in a Row: bounce-settle on drop, column pulse on hover, confetti along the win line.
15. Bubble Pop: brief hit-stop on 6+ pops, rising pop pitch per bubble, bubble squash on hover.
16. Cast and Catch: catch-of-the-day card with a shimmer (links to the shelf).
17. Pinball: jackpot light show and big-score PopText.
18. Bowling: slow-motion zoom on the last pin standing, PopText strike banner, a funny gutter-ball goof.
19. Game Show: drumroll on card flips, host-style banner text, a rare golden card.
20. Question Tracker: pitch rise with the combo, shooting-star trail, a constellation reveal when the sky fills.
21. Board Game: hover wiggle on squares, dust puff on each landing, confetti on Roll again, a passing bird and clouds.

### Avoid
- No public leaderboard on the shelf; no streak guilt; nothing flashing faster than 3 times a second; no blood; no mean steal by default.
- Motion and sound settings and the quiet-room switch stay free and reachable; any ambient music gets volume and off on the same screen.

## Progress
- 2026-11-08: audit written.
- 2026-11-08: shipped quick wins 1 to 4: star burst from the right answer, hover lift and press squash on answer tiles, letter-by-letter PopText (gold shimmer for right answers, power-up names, Board Game banners), a hopping-pieces loading screen instead of a blank page, the right-answer chime rising with each answer in a row and a slight random pitch on every other clip. Next: 5 (hover and press on board elements) and 6 (idle life).
- 2026-11-08: shipped 5 and 6 (first pass): Match Three gems wiggle and grow on hover and squash on tap; Four in a Row columns wiggle, lift and press down; Board Game squares wiggle on hover and waiting pieces bob and sway. Next: medium list (7 per-power-up entrances and sounds, 8 first-turn pointer, 9 impact on big moments, 10 My shelf).
- 2026-11-08: shipped 9 (first pass): a short punch (and a shake when Screen shake is on) on Board Game wins, tornado landings, wheel results and Roll again, Four in a Row wins, a cleared Bubble Pop board and the end of Cast and Catch.
