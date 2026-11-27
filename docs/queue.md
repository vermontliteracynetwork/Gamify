# Build queue

The owner's open requests, in the order they get built. Her words are quoted
exactly; nothing here is dropped without her OK. Tick an item only when it is
built, checked in a browser at every device size, and pushed. The live site is
not rebuilt to the new direction until she asks for the push (preview branch
only, never main without her approval).

Always active (owner, 2026-11-27: "find and carry over any exisiting queue list items from other gamify chats here. always show an active queue"): every Gamify chat reads this file first, carries over open items from other chats, and every final report shows the open items.

## Active now

- 40 (audit against the design references) and K (below).

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
6. [x] **Territory: her assets, Classic look.** (owner 2026-11-26: "territory is good to go") "for terretory, i need you to
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

20. [x] **Browser tests green** after the card-choice change (setup tests must
    tap a card before Next); then a GitHub check run.
21. [x] **Card-choice steps start unpicked** (built 2026-11-24): verify in a
    browser on every device.
22. [x] **Slow-device check:** (owner 2026-11-26: okay) (simulated run passed 2026-11-25, docs/slow-device-check.md) a test round on a slow school Chromebook and a
    projector (suggested by the build session; needs her or a beta classroom).
23. [x] **Rebuild the live site** to the new direction: only when she asks for
    the push after approving /brand.

On hold until her explicit approval: Game Lab games, hidden games.
Dropped: OmniRoute (her call, 2026-11-24).

## F. Live-site rebuild to the approved /brand design (owner, 2026-11-24)

Her words: "make sure all the pages i approved push to main, replacing old
pages as relevaant. make sure the new design pushes to main with all new
components, unviersal pages, colors, etc." and "all of the new components in
the brand look amazing. lets push them to main". Each batch: build on the
preview branch, check every device size in a browser, run the tests, then push
to main (approved). The Game Lab and Territory stay off main.

24. [x] **Batch 1, colors and type:** the New direction palette (Grape and
    Lavender main purple, Sky and Blue crystal, the bright and pastel pairs,
    Nature tones, Ink #1d1a33, Paper, Cream) as the site tokens; Grow Year
    titles in capitals with the logo G; ink edges and press shades.
25. [x] **Batch 2, universal game components:** top strip and meter, tool
    buttons (Hint, Settings, Full screen, Close), scoreboard rows, power-up
    cards, results box with stickers, pause, hint card.
26. [x] **Batch 3, universal views:** welcome (with the portrait and phone
    order), how will you play, share a join code, question set picker,
    options, teams and players, power-up setup, how the class plays, question
    screen, settings panel, loading, page not found, something went wrong.
27. [x] **Batch 4, student screens:** join, name pick, lobby, choice board,
    eyes up here, share mirror, class check-in (smile faces).
28. [x] **Batch 5, approved public pages:** Home, Plans and Pricing, Help
    Center and articles, legal pages, forms, theme guide, device check,
    Themes; Features and Research once their fixes are approved.
29. [x] **Batch 6, teacher pages:** dashboard home with the first-day empty
    states, Pick a game, Import a spreadsheet, Account, Theme Builder.
30. [x] **Batch 7, game boards:** each live game's in-play screen matched to
    its approved mockup (Board Game, Match Three, Bubble Pop, Bowling, Game
    Show, Four in a Row, Question Tracker).
    - Bowling built (2026-11-24): cream confetti wall over a Lemon rail, Lavender
      floor, big Peach lane with clean white Pink-striped pins, flat brand balls,
      player list left with the turn player's frames (X, / or total), power-ups
      right, the frame meter alone on top; result pills in Grow Year (the neon
      alley signs retired from play). Checked at 1280x800, 1190x540, iPad both ways.

## G. From the competitor research (owner, 2026-11-24)

Her words: "based on the research in the table above, i dont want any power ups
with stealing. in any instance where there is a timer, i want the ability to
turn it off so its not a time based requirement. I love our preview of the new
teacher portals. in it, i want to make sure we have live view of the whole
class on one question. folders and editing question sets."

31. [x] **No stealing power-ups, anywhere:** remove every power-up that takes
    points, cards, pieces or places from another player or team (steal, swap,
    sneaky magnet style), in live games, the shared power-up set, mockups and
    theme kits.
32. [x] **Every timer can be turned off:** any game, question or round with a
    clock gets a setting to switch the clock off, so nothing depends on time.
33. [x] **Teacher portal mockups:** a live view of the whole class on one
    question (who answered what, right now); question set folders; editing
    question sets in the portal.

## H. The new look on every page (owner, 2026-11-25)

Her words: "apply the new mockups that are in the brand page to the main site"
and "the new theme should cover all pages like the mockups".

34. [x] **Classes, Class page, Student page** to Teacher portal mockups 3a, 3b, 7c.
35. [x] **Create an Activity and the teacher's live views** to mockups 4, 5, 5b (the whole class on one question).
36. [x] **Question sets (with folders) and the set editor** to mockups 6a, 6b.
37. [x] **Reports and the print report** to mockups 7a, 7b, 7d, 7e.
38. [x] **Achievements page** (mockup 8) and a sweep of every other page still in the old look.

## I. Design crew reference standards (owner, 2026-11-26)

Her words: "tell the design crew to follow this advice- For animations, copy
Apple. For onboarding, copy Duolingo. For UI design, copy Linear. For
typography, copy Pentagram. For minimalism, copy Muji. For search and filters,
copy Airbnb. For art direction, copy Aesop. For dashboards, copy Notion. For
landing page layouts, copy Stripe. For micro interactions, copy Framer."

39. [x] **Brief the design crew.** The list is in the Design Chair, Classic Art
    Director and accessibility agent files and in docs/design-system.md.
    "Copy" means study and match the quality and principles (pacing, layout,
    restraint, motion feel); we never copy their code, assets, art, wording or
    brand (legal rules in CLAUDE.md). Every review now names the reference used.
40. [ ] **Audit against the references:** onboarding and the new sign-up welcome
    screen against Duolingo (first win before account, one choice per screen);
    the Home, Features and Pricing layouts against Stripe; the owner and
    teacher dashboards against Notion; set and theme search/filters against
    Airbnb; motion against Apple and Framer. Findings go to the owner as a
    mockup on /brand before anything live changes.

## J. Owner requests, 2026-11-26 (evening)

41. [x] **Developer portal redesign.** "i need the design team to improve my
    developer portal. i need it spaced out simpler, card style dashboard. make
    the views more visual and make it simple, adhd friendly. do research and
    apply simple views. use figma where you can and other"
42. [x] **Make a join code does nothing.** "make a join code doesnt work on
    click" (Game Show, How Will You Play, Share a join code).
43. [x] **Picture cards: big title, subtext on tap.** "set as rule that when
    cards are like this that the title text shows larger and subtext only shows
    when the card is clicked. aslo, shorten category subtext." (Game Show
    Board step: Surprise cards, Category grid.) Universal rule.
44. [x] **Question set picker bar in one row.** "this bar needs to be even in
    one row. make a new button called filters that will include subjects,
    grades, tags, etc. and replace those on the current bar. it should just be
    the sets toggle, search, filters. search should be large and fill the space
    between the two"
45. [x] **Live link is not the approved menus.** Audited 2026-11-27 against
    /brand Universal views 1-7. Fixed on the preview branch: marbled ground,
    title row (title left, approved meter centered, Settings, Full screen,
    Report, Close right), "How do you share?" on a paper card with a checked
    Mint pick, Share a join code as its own step (code big on a paper card,
    after the questions), set picker in even rows of three with Made dates and
    a Mint tab, Options cards two side by side, Power-ups last before Play,
    step names Question set and Options, the site links on start menus. Open
    (to confirm): team names (silly name dice vs the mockup's Team Purple /
    Sky / Pink), the Game Show cover art. Live on main 2026-11-27 (owner:
    "push to main"). "what is currently live on the
    link is NOT the approved menus !!!!!!!!!!!!!!" Compare every live menu to
    its approved /brand mockup and fix each difference.
46. [x] **Tell Gamify flag at the far right** of the top bar.
47. [x] **Home hero cards larger and spaced out.**
48. [x] **Home How It Works:** no tape; Step chips in Grow Year.
49. [x] **Compare Every Feature** doc table updated to her plan rules.

## K. Owner requests, 2026-11-27

Her words: "1) improve this banner so its visual and more promotional. i dont
want it to be called founding subscriber. no subscriber, think more cute about
like first gamers sale or something. i want it to be larger, use more of
bright colors from our pallette. 2) remove "Nothing is ever deleted" label from
everywhere. 3) ... the goal is that we will apply psychology to get people to
upgrade and not state why people upgrade. this should be something visual
maybe a gallary carosel where we can show people/students making themes and
getting engagement from their students by participating in the game 4) ...
improve the layout of the question set section to be more like this. 5) ...
make the bowling game lanes like this. 6) ... these are the kind of photos i
want in the carosel and promotional otherwise."

50. [ ] **Player One Sale banner** (renamed from Founding Subscriber, code
    PLAYERONE10): big Lemon card, Grape 10% off sticker, Pink name chip,
    confetti, days-left chip, renewal line kept. Built; to check in a browser.
51. [x] **"Nothing is ever deleted" removed** from pricing chips, the compare
    chart, the upgrade box, the beta page and the /brand mockups.
52. [ ] **"Made by your class" carousel** on the Features page (owner: "remove
    plus and pro tag and put this on the features page, not pricing"); the
    "Themes are why teachers upgrade" line is gone from Pricing: draw it, snap it in, play it, pick the next one.
    Drawn stand-ins until released beta photos arrive. Built; to check.
53. [ ] **Question sets as a card wall** (her screenshots): My sets and the
    library as masonry picture cards, a headed search panel at the left of the
    library, and the ready-made set preview as a left panel with big buttons
    plus every question as a picture card. Built; to check.
54. [ ] **Bowling lane like her reference**: honey wood lane, thick Orange
    gutter rails, an Orange pin-deck arch, a Grape squiggle carpet, five
    colored aim zones near the foul line (no numbers on them, Golden Rule:
    to confirm). Built; to check on every device and with the Classic Art
    Director.
55. [ ] **Beta photos**: shot list and release rules in docs/photo-brief.md;
    the release form is drafted in docs/photo-release.md (owner: "draft me a
    photo release"); the attorney reviews it, then it becomes a beta step.
56. [ ] **Compare Every Feature edits** (owner, 2026-11-27, marked-up
    screenshots): crossed-out rows removed (new games early, on the big
    screen, in pairs, sign-in pictures, theme guide templates, a code to play
    on their own, every guide); circled rows combined (live class lobby;
    groups and a set for each student; choice boards with themes; question
    and student reports); "All games"; Free reworded to show value (quick
    play, no setup, no list to keep, roll a fun name); Plus 30 students per
    class, Pro 60, Pro 5 sets per student; Lock message default (Plus) or
    your own (Pro); report history 24 hours; new Privacy and data section
    (fresh lobby code every plan, Account data, No ads, ever); no pricing rows.
    Built; to check.
57. [ ] **Pricing and Features scan at a glance** (owner: "easy to visually
    scan so dont be too heavy on text and use expand/collapse carrots, lots of
    professional spacing, and easy visuals"): compare chart topics fold with
    carets and an Open all button, row meanings moved into (i) tips, the
    always-free list folds, fair-play reasons fold, More boxes get carets,
    wider section spacing, shorter intro lines. Built; to check.
58. [ ] **No subtext under teacher page titles** (owner: remove "All 8 games.
    Pick one to start an activity, or see how it plays" "and all other subtext
    in that format from the teacher section. including the username on the
    account page"). Built: PageHeader no longer takes a subtitle.
59. [ ] **No upgrade banners on upgraded plans** ("for plans that are already
    upgraded, dont show upgrade banenrs"). Built: Upgrade buttons show on Free
    only; limit notes on paid plans are a plain line; nothing shows while the
    plan loads.
60. [ ] **Fair play becomes "Every Game Comes Loaded"** ("combine with other
    great features and have something more visual ... in a better format"):
    a bento of the Classic power-ups, a classroom photo slot (drawn stand-in
    until a released beta photo), the shared game pieces, and the six
    fair-play promises as icon badges. Built; to check.
61. [x] **Pricing promise chips removed** (No card needed, Cancel any time,
    Accessibility free): "remove."
62. [ ] **Compare chart tidy** (owner, 2026-11-27): title "Compare Features";
    no Open all button, no "Open a topic" line, no "X features" on the bars;
    a plain caret (no circle or white background); "Students" with Free "No
    class list"; Free sign-in "Type a name or use a random one". Built; to check.
63. [ ] **Features page top trimmed** (owner: "remove the highlighted text and
    most default subtext in that manner. remove the tabs like 'the games' and
    shift the next section menu higher"): title and the two buttons only, no
    jump tabs, no intro lines under the section titles, the games start
    higher. Built; to check.
64. [ ] **Features page scannable** (owner: "I don't want unnecessary subtext
    underneath the title ... Lists are always great. Shorten the words ...
    more details, small text with an open caret"; "remove plays this way
    entirely"; "swap the sides of the visual for the second section"):
    plain section titles, short list items with the detail under a caret,
    Ways to Play cards as three-item lists with a Best for chip and More,
    the Class Themes demo moved to the left. Built; to check.
65. [ ] **Home Trending Themes one at a time** ("if you are showing trending
    themes, make the layout show one at a time ... make it something people
    want to look at"): one big preview on a color stage, name large, band and
    game chips, picture buttons and arrows, turns on its own; no subtext.
66. [ ] **Beta test off Research, onto Home** ("remove the beta test from the
    research. on the home page, add a section about joining our beta test"):
    Research keeps Why it works and Sources; Home has a Grape beta card with a
    3 months free sticker, You get / You do lists, the spots chip and Join.
67. [ ] **Themes page challenge spotlight** ("remove the subtext. make the
    display for the challenge larger and more visually nice ... intreguing to
    click on"): subtext gone; a big Grape card with sparkles, an empty gold
    frame with a bobbing trophy, the Win lifetime Pro chip and See the
    challenge. Built; to check. (Her "change this setting" is read as this
    section; to confirm.)
