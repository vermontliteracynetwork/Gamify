# Brand design audit, 2026-11-24 (Design Chair)

Her request (verbatim): "when my preferences and the new direction have been
applied to all the game mockups, run the design audit process on the new
branded things, especially looking at the sizes of the screens and being very
aligned with what i have said for the universal components".

Scope: every `/brand` tab (Universal views, Game components, Game mockups with
Territory, Stickers, Icons, Public pages, Teacher portal, New direction) at
every device frame (big screen 1600 x 900, laptop 1280 x 800, iPad landscape
1180 x 820, iPad portrait 820 x 1180, phone 430 x 932; public pages at 1280,
820 and 390 wide). Proposals only; no live game, engine or page changed.

## Method

1. Rules: every line of `docs/teacher-preferences.md` that applies to the brand
   mockups (list below), plus `docs/game-components-standard.md`.
2. Measured, not eyeballed: a Playwright script (headless Chromium, device
   scale 2) opened `/brand`, scrolled each tab so every frame rendered, and for
   every frame computed each text element's size at the device's real CSS size
   (font size x every scale between it and the frame / the frame's scale), and
   flagged any text under 13px and any text that ran outside its frame. Pictures
   marked `aria-hidden` (cover miniatures, decoration) were skipped. 303 frames
   measured; console errors read (none). Tabs with no device frames (Game components, Stickers, Icons, New direction) were captured full page at 1400 and 820 wide and checked by eye; no sideways overflow at either width.
3. Looked: screenshots of every strip, cropped and checked by eye for overlap,
   dead bands and rule breaks.

## Top findings (ranked)

1. **Three different tool groups** (Game components, Universal views, game
   mockups each had its own order and size, 36 to 52px). FIXED: one `GameTools`
   in `src/brand/mockKit.tsx`: Accessibility, Hint, Settings, Full screen,
   Close; 44px with 14px between, used by every game mockup, the top tracker,
   Bowling, Territory and the question card.
2. **Game mockup portrait frames were the landscape design letterboxed** (dead
   bands top and bottom, 0.64 scale on iPad portrait). FIXED: every one of the
   30 game views now has a landscape (1000 x 625) and a portrait (820 x 1180)
   design (`View.land` / `View.port`); tablet-only views got landscape designs.
3. **Power-up card names at 10px** (`PowerCard` font `size * 0.16`). FIXED: art
   at 50%, name at least 13px, cards 76 to 100px; Game components tile 13px.
4. **The universal Results box was a podium with ranks**, not the winner box
   standard. FIXED: title, winner icon in THE glow, only the score under it,
   Play again / New game / Review 3 missed; corner stickers moved off the text.
5. **Question set (iPad portrait) cut off** (three fixed columns at 740px).
   FIXED: filters wrap, two columns on iPad portrait, one on a phone. Power-up
   setup also reflows to two columns in portrait.
6. **Leftover rule breaks**: washi tape and tilted photo stickers on New
   direction, tilted feedback burst, double "frame ring" behind pop cards, blob
   backing behind power-up art, "Frame 4 of 10" words over the Bowling meter,
   "Join code" label and "Fill the sky together!" tip line on the Question
   Tracker class screen, "Class goal: fill the sky" helper line in the top
   tracker, "Three gold stars in a row!". ALL FIXED.
7. **Phones (OPEN).** On the phone frame, 27 of 30 game views and 12 of 22
   universal views still have text under 13px (7 to 12px), because they show the
   iPad portrait design scaled to 52%. Fixing it needs a phone layout per game
   (rail B as a one-row dock, a 2-column card grid). See "Left open".

## Results by rule

| # | Rule (her words, short) | Result | Where | Fix |
|---|---|---|---|---|
| 1 | Palette pairs only; New direction colors, no leftovers | Pass (2 approved exceptions) | all tabs | Question Tracker star yellows moved to Lemon/Butter/Orange. Exceptions: her favorite night navy (Question Tracker) and Territory's natural fur and floor colors (live game art she asked for) |
| 2 | No washi tape, no stacked/multilayer cards | Fixed | New direction (`Tape`), Game mockups (`GSPop`, `PowerMoment` double ring) | Tape draws nothing; one flat card, normal sticker shadow |
| 3 | Nothing tilted in menus and cards | Fixed | `Burst` rot, `Paper` tilt (buddies.tsx), `PhotoSticker`, results stickers | Rotations removed (doodle confetti and the leaping cat keep their angle: they are art in motion, not cards) |
| 4 | Smooth art, no grain | Open (minor) | New direction keeps a 10% grain overlay on its older blocks | Retire the superseded New direction blocks when she approves the kit |
| 5 | Grow Year headings in capitals | Pass | every tab | none |
| 6 | Real wordmark, never a pill | Pass | SiteBar, public nav and footer | none |
| 7 | White top menu bar on every start menu and welcome | Fixed | Welcome in portrait had a bare logo row | Portrait welcome and menus now use `SiteBarSmall` |
| 8 | Start menu header: title left, meter middle, buttons right, no "Step X of Y" | Pass | `MenuStep` | none |
| 9 | Yellow go buttons with ink text | Pass | menus, overlays, public pages | none |
| 10 | Only Live, Share, Solo; opens on Solo; line on hover, under the picked card on touch | Fixed | the touch case was missing | `@media (hover: none)` shows the picked card's line; Public pages say three ways (the live site still says four) |
| 11 | Universal screens centered; question text left | Pass | all | none |
| 12 | One question screen; A to D letter circles | Fixed | Question Tracker student device was a hand-built copy | One `QuestionCard` in mockKit, used by Universal views, Question Tracker and Territory |
| 13 | No turn banner or directive; Butter shading is the turn signal | Pass | all game views | none |
| 14 | Top strip shows only the team name; no round words over the meter | Fixed | Bowling "Frame 4 of 10" pill | Ten-segment meter with the words only in its aria-label |
| 15 | Smaller round buttons with more room; hint lightbulb beside Settings everywhere | Fixed | see finding 1 | 44px, 14px apart, one order |
| 16 | Player icons with no circle border or white backing | Pass in mockups | live Territory `SideBadge` still has a circle | Mockups use the bare cat and mouse art; recommend the live game drop the circle |
| 17 | Winner glow = the live turn glow, behind the icon | Pass | `TurnGlow` everywhere | none |
| 18 | No crown or power-up badge on the scoreboard | Pass | all | none |
| 19 | Power-ups: plain square cards, no tray, no labels or helper text, no circle backing | Fixed | blob patch behind art (Game components, Game mockups, Universal pop card); names at 10px | Blob removed from power-up art; names 13px+ |
| 20 | "Prize chest", "+100", "Continue" | Pass | all visible text (internal id `treasure-chest` only) | none |
| 21 | Roll card is just the die; rolls on click; hover wiggle; off in Calm | Pass | Game components, Board Game | none |
| 22 | No star on the three-in-a-row feedback | Fixed | Question Tracker | "Three in a row!" |
| 23 | Computer players have fun names | Pass | "Goofy Lamp", "Silly Fox" | none |
| 24 | Winner box: only score/XP under the icon, a bit smaller than the title | Fixed | Universal Results (finding 4) | none left |
| 25 | No tip lines under scoreboards; tips behind the lightbulb, tap to close, shown once | Fixed | QT goal card line, tracker helper line | Removed; tips card spec says it shows by itself once at the first turn |
| 26 | Lobbies show only the join code in a white pill | Fixed | QT and Territory class screens | Code only, white pill |
| 27 | Every mockup on big screen, laptop, iPad landscape AND portrait, phone | Pass | all DeviceSets | none |
| 28 | Text never below about 13px on student screens at real size | Pass on big screen, laptop, both iPads; OPEN on phones | 27 game views, 12 universal views on the phone frame | see Left open. Teacher portal: 11.5 to 12px at its 1000px design, which is 15px on a real 1280 laptop (pass for a teacher page) |
| 29 | Touch targets 44px+ | Fixed | Swap Spinner team chips were about 40px; tools were 36px | 52px chips, 44px tools; public pages: 44px+ pills, 46 to 60px buttons |
| 30 | Nothing cut off or running past its box | Pass (0 of 303 frames after fixes) | was: question set iPad portrait, home hero on phone | reflows above |
| 31 | No scrolling on game screens | Pass | fixed frames | none (public web pages scroll, as web pages do) |
| 32 | No overlap | Fixed | Bubble Pop board under the tools, Question Tracker stars under the tools, Bowling iPad meter against the tools, results stickers over the title | moved |
| 33 | No dead bands | Fixed for iPad portrait; minor open | phone frames of game views (ratio 0.46 vs 0.69) and Territory's 16:10 room in a 16:9 frame show bands filled with the matching ground color | phone layouts (open) |
| 34 | No characters, faces or mascots | Pass with one approved exception | Territory cats and mice have simple dot faces (the live game pieces she asked for) | none |
| 35 | No blood or harm | Pass | Territory: caught mice poof in stars, the scared cat leaps out unhurt | none |
| 36 | Student pages: no prices, buy words or upgrade prompts | Pass | Join page shows only the logo and "Teachers: Log in" (no Pricing link); Live student screens | none |
| 37 | No other company names in customer text | Pass | grep of all brand strings | none |
| 38 | No em dashes; no emojis on teacher views | Pass | grep | none |
| 39 | No teach cards | Pass | none in /brand | none |
| 40 | Two pause screens | Pass | Universal 15a, 15b | none |
| 41 | Slower pop-ups, tap to close, computer pauses | Pass | Game components 0.7 s enters, Tapped cards, CPU 2.5 s / 1.5 s | none |
| 42 | Question Tracker keeps its night sky look | Pass | Game mockups | none |
| 43 | Bowling: lane view and a ten-frame sheet | Pass | Game mockups | none |

## Universal components across the eight games

| Component | GS | BG | M3 | 4R | BP | BW | QT | TR | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Tool group (one order, 44px) | yes | yes | yes | yes | yes | yes | yes | yes | was 3 versions |
| Top strip / meter, no words | meter | race rows | score strip | players | score strip | name chip + 10 meter | goal card + meter | goal or counts | Board Game has no top strip by her 2026-11-16 rule; race rows are its standing |
| Butter turn shading | rows | race rows | n/a | player cards | n/a | sheet row + chip | n/a (Live) | n/a (Live) | |
| Square power-up cards | yes | yes | yes | yes | yes | yes | none | none | |
| Feedback pill (flat) | yes | yes | yes | yes | yes | n/a | yes | yes | |
| Question card (one design) | universal | universal | universal | universal | universal | universal | yes | yes | |
| Winner box | yes | yes | yes (stars) | yes | yes | yes | yes (class) | yes (room wash) | Universal Results now matches |

## Left open (needs her decision or a later round)

1. **Phone game layouts.** Do phones matter for games? Today's research rule
   (WCAG 1.4.4, Apple's 11pt floor, from memory) says text this small fails. If
   yes: each game needs a phone layout (board full width, rail B as one-row
   dock under it, power cards 64px). If phones are only for homework Solo,
   do Solo games first (Match Three, Bubble Pop, Question Tracker Solo).
2. **New direction tab** still shows superseded proposals (grain overlay, older
   cobalt palette blocks). Recommend archiving them once she approves the kit,
   so nobody copies an old rule.
3. **Live Territory** (`src/games/territory/art.tsx` `SideBadge`) puts the
   animal on a circle; her icon rule says no circle backing. Live code belongs
   to the game builder; flagged, not changed.
4. **Galleries blocked**: pricingpages.design failed to resolve this session
   (land-book.com, navbar.gallery, socialproofexamples.com failed earlier this
   week). Public pages used memory-cited research only; allow these hosts to
   compare against real galleries.
5. **Live site copy** still says "Four ways to play" and lists Versus
   (`src/i18n/en.ts` public.modesTitle, features.p.play.short): the proposal
   uses three; changing live copy waits for her approval.
