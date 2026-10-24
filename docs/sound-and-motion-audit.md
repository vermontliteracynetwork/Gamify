# Sound and motion audit (development plan Stage 3)

Rule: every sound has a visual partner, and nothing flashes. Checked
2026-10-24 against every `playEffect` call.

| Sound | Where | Visual partner |
|---|---|---|
| right | Question screen, Share question, Bakery Match matches | Green answer with a check, "You got it!", treats pop |
| miss | Question screen, Share question, Bakery Match bad swap | Answer greys out with "Try again" or the right answer shown; the tile shakes and a note explains |
| tap | Four in a Row drop, Game Show square, Bakery Match select | The piece falls into place; the square opens a question; the treat gets a ring |
| whoosh | Game Show card, Bakery Match swap | The card flips over; the treats slide |
| win | Every game's end | The results box opens (with confetti unless celebrations are off) |

Motion that repeats: Four in a Row's column arrows pulse gently (a 2 second
fade, `motion-safe` only), and Question Tracker's items turn slowly (6 to 9
seconds a cycle). Nothing blinks faster than once a second, so there is no
flashing (WCAG 2.3.1). Calm mode and "Still" motion stop all of it, and the
system reduced-motion setting is honored.
