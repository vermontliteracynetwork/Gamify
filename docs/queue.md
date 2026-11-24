# Build queue

The owner's open requests, in the order they get built. Her words are quoted
exactly; nothing here is dropped without her OK. Tick an item only when it is
built, checked in a browser at every device size, and pushed. The live site is
not rebuilt to the new direction until she asks for the push (preview branch
only, never main without her approval).

Source messages: 2026-11-24 (owner, two messages in the marketing-team session,
plus the hand-off from the "Game recreations" session).

## A. Game mockups on /brand (Game mockups tab)

1. [x] **Power-ups always on top.** "power ups should always be top layer, never
   cut off by frame borders." Every power-up card and icon, in every mockup and
   view, sits above frames and borders and is never clipped (e.g. the Swap
   Spinner arrows over the card edge).
2. [x] **Board side panel order.** "stack in this order: leaderboard players,
   power up, die. remove how many squares to go." Board Game: players first,
   then the held power-ups, then the die; no "12 to go" text on the rows.
3. [x] **Match Three strip.** "for match three, put meter on top, adding in the
   moves following my designs. xp as a number on the top of the rigth followed
   by power ups that are center aligned to the xp text." The meter (with the
   moves in it, per her earlier tracker designs) across the top; the score
   (XP) as a number at the top right; the held power-ups under it, centered on
   the score text.
4. [x] **Same standard for every solo board game.** "follow same standard of
   design that i just explained for match three for the bubble shooter game and
   all other solo game board games like this in the future." Bubble Pop first;
   becomes a Brand Kit rule for all future solo board games.
5. [x] **Bowling redesign.** "massive improvements needed for bowling layout and
   design. refer to baamboozle bowling more." Rebuild the layout from a
   description of how that style of classroom bowling game plays and reads
   (big lane, clear turn, simple team scores); reimplemented from scratch, no
   copied art, code, names or look (standing legal rule).
6. [ ] **Territory: her assets, Classic look.** "for terretory, i need you to
   take the assets i uploaded and just apply the classic theme to those, not
   redesign new." Use her uploaded cats, mice and room pieces as they are; only
   apply the Classic treatment (outline, palette, flat fill) to them. No newly
   drawn animals. Classic Art Director PASS before showing her.
7. [x] **Question Tracker revert.** "star question tracker still needs to be
   reverted back to my old one." Find her favorite earlier version (git
   history; her note "this version of the question tracker is my favorite")
   and restore it.

## B. More screens tab: approvals and changes

Approved as shown (mark approved in the Approval tab): Settings, Student choice
board, Eyes up here, Share Mirror, Loading, Page not found, Something went
wrong, Import spreadsheet, Teacher account, New Theme Builder, Pick a game,
Help Center ("LOVE the new help center"), Legal pages, Form, Theme guide,
Device check (in Help).

8. [x] **Class check-in:** approved "but updated with smile emoji faces
   instead". Swap the check-in faces for smile emoji faces.
9. [x] **Empty states:** "merge the empties concept into the teacher
   dashboard/home".
10. [x] **Owner desktop:** "add owner desktop to my developer view". The
    owner-desktop mockup goes into the real developer dashboard (/owner).

## C. Public pages tab

Approved: Home.

11. [x] **Features page:** remove the text headers and pills above the title.
    Universal rule: "NEVER do that ... its an AI tell ... remove from
    everywhere and never have any unecessary, redundent text and headers like
    that."
12. [x] **Pricing:** approved except the title must say what the page is:
    "Plans and pricing".
13. [x] **Wording:** never "questions teachers ask" (or similar). A link to
    Help is fine, but not with that wording.
14. [x] **Research page (not approved):** "needs serious updates to make it look
    more professional research focus, whilke simply highlighting why it
    works. collapsable text. list views."
15. [x] **Left-align page titles** and the subtext that follows (public and
    teacher pages).
16. [x] **Left-align menu dropdowns** like on the Themes page.
17. [x] **Themes as a page:** "themes can otherwsie be added as page".

## D. Universal rules (apply everywhere, now and later)

18. [x] **Link generously.** "add lots of buttons and links to other pages
    within the gamify site. like when help pages are noted and such."
19. [x] **Never break a word across lines.** "never break up text within a word
    to drop part of the word to the next line." No hyphenation or mid-word
    wrapping anywhere (CSS rule plus a check).

## E. Carried over from the hand-off

20. [ ] **Browser tests green** after the card-choice change (setup tests must
    tap a card before Next); then a GitHub check run.
21. [ ] **Card-choice steps start unpicked** (built 2026-11-24): verify in a
    browser on every device.
22. [ ] **Slow-device check:** a test round on a slow school Chromebook and a
    projector (suggested by the build session; needs her or a beta classroom).
23. [ ] **Rebuild the live site** to the new direction: only when she asks for
    the push after approving /brand.

On hold until her explicit approval: Game Lab games, hidden games.
Dropped: OmniRoute (her call, 2026-11-24).
