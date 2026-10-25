# Device check (launch readiness, Stage 8)

## Checked automatically on every test run

`e2e/devices.spec.ts` opens every game, goes through setup and starts play
at four extra screen sizes, failing if anything scrolls up, down or sideways:

| Device stand-in | Size |
|---|---|
| Oldest supported iPads (iPad 6th gen, iPad mini 4), portrait | 768 x 1024 |
| Same, landscape | 1024 x 768 |
| Chromebook (most school models) | 1366 x 768 |
| Classroom smart board / projector | 1920 x 1080 |

The main suite also runs everything at iPad portrait (820 x 1180), iPad
landscape (1180 x 820) and a laptop (1440 x 900), with touch on the iPad
sizes.

Fixed while adding this check (2026-10-25): Question Tracker's sky was 4
pixels too tall on every screen, Game Show's cards were too tall for a
Chromebook screen, and Memory Match left empty space below the cards on tall
screens (cards now grow taller to fill it).

## Still needs real hardware (pilot classrooms)

The test browser is Chromium. Real devices add Safari quirks, slower
processors and smart board touch. Before launch, on each device:

1. **Oldest iPad still getting updates (iPadOS 17, Safari):** sign in with
   pictures, play Bubble Pop and Bowling for 2 minutes each (smooth
   motion, no stutter), Listen read-aloud works, the camera opens in Design
   a Theme.
2. **A school Chromebook (managed, on the school network):** join with a
   class code, play two games, check that nothing is blocked by the web
   filter (see the For school IT page).
3. **A classroom smart board browser:** run Game Show and Peg Drop as a
   whole class from the board, tapping on the board itself; check the
   projector code screen can be read from the back of the room.
4. **An Android tablet:** haptics buzz on right answers (iPads cannot
   vibrate), everything else as the iPad.

Record results (device, browser version, date, anything odd) in the dev
plan's Progress log.
