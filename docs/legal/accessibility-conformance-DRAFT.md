# Gamify Accessibility Conformance Report (DRAFT)

Format: follows the WCAG edition of the industry-standard voluntary product
accessibility template (VPAT 2.5), which schools and districts ask for.
Product: Gamify (web app, teacher and student pages). Report date: 2026-10-25
(draft). Standard: WCAG 2.1 Level A and AA.

**Status: draft, not for customers yet.** Before it goes out:
1. Screen reader passes by hand: VoiceOver on iPad (Safari) and on a Mac,
   NVDA on Windows (Chrome), TalkBack on a Chromebook. Pilot classrooms
   cover the iPad pass.
2. Attorney review of the wording (it is a public statement about the
   product).

## How Gamify is evaluated

- **Automated checks** (axe-core, WCAG 2.1 A and AA rules) on every main
  page, a game start-up, the question screen and a game board, at iPad
  portrait, iPad landscape and laptop sizes, on every change
  (`e2e/a11y.spec.ts`).
- **Keyboard only** (`e2e/keyboard.spec.ts`): game setup, Game Show cards
  and answers, Match Three swaps with Enter, Bubble Pop aiming with arrows
  and shooting with Space, a teacher making a class, and pop-up boxes
  (focus moves in, Tab stays inside, Escape closes, focus returns).
- **Reflow at 400 percent zoom** (320 CSS px wide) on every menu, teacher
  and public page (`e2e/zoom.spec.ts`).
- **No scrolling on game screens** at iPad and laptop sizes, plus an older
  iPad, a Chromebook and a smart board (`e2e/no-scroll.spec.ts`,
  `e2e/devices.spec.ts`).
- **Readability checks** built into the Theme Builder: color pairs that fail
  AA contrast cannot be saved; every starter theme passes the same check
  (`src/theme/library.test.ts`).

## WCAG 2.1 Level A and AA

Terms: **Supports** (meets the criterion), **Partially supports** (some parts
do not yet), **Not applicable**, **Not evaluated** (needs the hand passes above).

| Criterion | Level | Status | Notes |
|---|---|---|---|
| 1.1.1 Non-text content | A | Supports | Question and answer pictures carry teacher descriptions (double-click to add); a question picture without one is flagged and cannot be played; decorative art is hidden from screen readers; icons have labels. |
| 1.2.1 Audio-only and video-only | A | Not applicable | No prerecorded audio or video in the product. Sounds are effects paired with something visible. |
| 1.2.2 Captions (prerecorded) | A | Not applicable | No video in the product. Marketing videos will be captioned (`docs/demo-video-plan.md`). |
| 1.2.3 Audio description or media alternative | A | Not applicable | No video. |
| 1.2.4 Captions (live) | AA | Not applicable | No live audio. |
| 1.2.5 Audio description (prerecorded) | AA | Not applicable | No video. |
| 1.3.1 Info and relationships | A | Supports | Headings, lists, tables with headers, labeled form fields, grouped radio and checkbox sets; game boards use grid roles. Automated checks pass. |
| 1.3.2 Meaningful sequence | A | Supports | Reading order follows the visual order; boxes over the game are announced as dialogs. |
| 1.3.3 Sensory characteristics | A | Supports | Instructions never rely on shape, color, size or sound alone; every color cue also has a letter, icon or word. |
| 1.3.4 Orientation | AA | Supports | Every screen works in portrait and landscape. |
| 1.3.5 Identify input purpose | AA | Supports | Teacher name and email fields use the standard input types; students type no personal data (pictures and a nickname). |
| 1.4.1 Use of color | A | Supports | Teams, answers and game pieces always have an icon, letter or shape as well as a color. |
| 1.4.2 Audio control | A | Supports | No sound plays longer than 3 seconds on its own; sound and voice volume are in every player's settings. |
| 1.4.3 Contrast (minimum) | AA | Supports | Automated checks pass on house pages; themes that fail AA cannot be saved; a high-contrast setting is available. |
| 1.4.4 Resize text | AA | Supports | Browser zoom to 200 percent keeps everything usable; a text size setting is also built in. |
| 1.4.5 Images of text | AA | Supports | Text is real text. The logo is the only image of text. |
| 1.4.10 Reflow | AA | Supports | No sideways scrolling at 320 CSS px on menus, teacher and public pages. Game boards are two-dimensional content (allowed) and still size to the screen. |
| 1.4.11 Non-text contrast | AA | Supports | Controls have 2.5 px black outlines; the focus ring is black with a white halo on every background. |
| 1.4.12 Text spacing | AA | Not evaluated | Needs a check with the text-spacing bookmarklet; the layout uses flexible boxes, so overflow is unlikely. |
| 1.4.13 Content on hover or focus | AA | Supports | Hover text (standard descriptions) also appears on focus and tap, stays while hovered and closes when focus leaves. |
| 2.1.1 Keyboard | A | Supports | Every control is a real button, link or field; game boards play with arrows, Enter and Space (keyboard tests). |
| 2.1.2 No keyboard trap | A | Supports | Pop-up boxes keep Tab inside while open by design and close with Escape or their close button; focus returns where it was. |
| 2.1.4 Character key shortcuts | A | Not applicable | No single-letter shortcuts. |
| 2.2.1 Timing adjustable | A | Supports | Game timers can be turned off or lengthened by the teacher; read-first time is set per student. |
| 2.2.2 Pause, stop, hide | A | Supports | Moving decorations stop in calm mode and Still motion, set per player. |
| 2.3.1 Three flashes or below | A | Supports | Nothing flashes. |
| 2.4.1 Bypass blocks | A | Supports | A "Skip to main content" link appears on the first Tab press; pages also use landmarks (header, nav, main, footer) and headings. |
| 2.4.2 Page titled | A | Supports | Every page and game has its own title. |
| 2.4.3 Focus order | A | Supports | Focus follows reading order; pop-up boxes take focus when they open and give it back when they close. |
| 2.4.4 Link purpose (in context) | A | Supports | Link text says where it goes. |
| 2.4.5 Multiple ways | AA | Supports | Top menu, footer links and the teacher menu reach every page. |
| 2.4.6 Headings and labels | AA | Supports | Headings and labels describe their purpose. |
| 2.4.7 Focus visible | AA | Supports | Thick black focus ring with a white halo on every focusable element. |
| 2.5.1 Pointer gestures | A | Supports | Every drag (aiming, swapping, moving the menu) also works with single taps or keys. |
| 2.5.2 Pointer cancellation | A | Supports | Actions happen on release, not on press. |
| 2.5.3 Label in name | A | Supports | Visible labels are part of each control's accessible name (automated check). |
| 2.5.4 Motion actuation | A | Not applicable | Nothing is controlled by shaking or tilting. |
| 3.1.1 Language of page | A | Supports | The page language is set (English). |
| 3.1.2 Language of parts | AA | Not applicable | No mixed-language passages yet; teacher-written questions in other languages are the teacher's content. |
| 3.2.1 On focus | A | Supports | Focus never changes the page by itself. |
| 3.2.2 On input | A | Supports | Changing a setting never jumps to a new page without a button press. |
| 3.2.3 Consistent navigation | AA | Supports | The same menus appear in the same place on every page. |
| 3.2.4 Consistent identification | AA | Supports | The same icons and words mean the same thing everywhere. |
| 3.3.1 Error identification | A | Supports | Errors are described in words beside the field (for example, a question missing its right answer). |
| 3.3.2 Labels or instructions | A | Supports | Every field has a label; instructions are short and plain. |
| 3.3.3 Error suggestion | AA | Supports | Messages say how to fix it ("Add at least 2 answers"). |
| 3.3.4 Error prevention (legal, financial, data) | AA | Supports | Deleting a class or set asks first; plan changes say nothing is deleted. |
| 4.1.1 Parsing | A | Supports | Pages are built by React; automated checks pass. (This criterion is retired in WCAG 2.2.) |
| 4.1.2 Name, role, value | A | Supports | Buttons, toggles, tabs, radios and checkboxes expose their name and state (automated checks; screen reader pass pending). |
| 4.1.3 Status messages | AA | Supports | Right and try-again messages, saving notes and quote results use live regions. |

## Known gaps and plans

- Text spacing check (1.4.12) and the screen reader passes listed above.
