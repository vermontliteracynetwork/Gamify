# Gamify design system

The look of every menu, setup page and teacher page: the light "sticker"
style of the approved /brand New direction (teacher, 2026-11-25): Lavender
ground, Paper panels, Ink outlines, the yellow go button and Grape for every
other main action. Game stages wear their own themes (`src/theme`); everything here is
the standard Gamify look around them. Audited and tidied 2026-11-18.

Rule of thumb: reach for a component first, then a token, and only then a
hand-typed value. Game art (Classic drawings, board colors, effects) may keep
its own colors in code; menus and teacher pages may not.

## Tokens (`src/index.css`)

### Colors
The palette pairs from /brand New direction rule 1: every bright has its named
pastel; white text only on Grape and Ink, ink text everywhere else (WCAG AA).

| Token (Tailwind) | Value | Use for |
|---|---|---|
| `bg` / `lavender` | #ddd6ff | the Lavender page ground |
| `surface` / `paper` | #fffaf0 | panels and cards (Paper) |
| `surface-2` / `surface-hover` | #f1edff / #f7f4ff | wells, hover |
| `border` / `ink` / `text` | #1d1a33 | outlines and text (Ink) |
| `border-soft` / `muted` / `faint` | #d6cff0 / #57506e / #7d7696 | quiet outlines, hints, placeholders |
| `accent` | #fdfd94 | the yellow go button only (Start, Next, Play, Join, Play again) |
| `grape` / `grape-deep` | #6a45f0 / #4b2fc9 | every other main action, white text; its shadow and hover |
| `butter` | #fff1b8 | picked chips and tabs, the current page, callouts |
| `mint` / `kelly` | #c8f0dc / #22b04a | picked cards in game menus, done checks (ink check), Solo, Cooperative |
| `blue-crystal` / `sky` | #bfdff3 / #4ba3e8 | Live, info |
| `blush` / `pink` | #ffd3e6 / #f055a5 | Competitive, celebrations |
| `peach` / `orange` | #ffd9b3 / #ff9b28 | timers, warm accent |
| `lemon` | #fabe37 | stars, crowns, the current step |
| `aqua` / `teal` | #c9f1ee / #1fb5a8 | water, cool accent |
| `success` / `success-ink` | #22b04a / #1f7a45 | right / green text |
| `danger` / `error` | #f055a5 / #9b2c3a | delete hover / error text |
| `ink-night` | #1d1a33 | dim overlays (now Ink) |
| `gold` | #fabe37 | stars earned (now Lemon drop) |
| `quiz-yellow/green/blue/orange` | Butter, Mint, Blue crystal, Peach | older answer tiles (the question card now uses Lavender, Blue crystal, Blush, Butter; `src/engine/questionCard.ts`) |

Ways to play (rule 12): Share is Lemon and Butter (television), Live is Sky and
Blue crystal (broadcast), Solo is Kelly and Mint (one person); `MODE_COLORS` is
the pastel, `MODE_BRIGHT` the round icon badge (`src/games/ModeBadge.tsx`). Live
class modes (rule 11): Cooperative is Kelly and Mint with a heart, Competitive
Pink and Blush with a spark (`src/live/ClassModeIcon.tsx`).

### Type
- Two fonts only (rule 8): Grow Year in ALL CAPITALS for titles (h1, `.title-bubble`), scores and prices (`.font-score`) and the tagline; Inclusive Sans (`font-heading` bold for headings and buttons, `font-body` regular) in sentence case. The `.font-display` class is Inclusive Sans bold; Grow Year's "Th" ligature is off site-wide so caps stay caps.
- The root size follows the screen (the screen-size rule, `src/index.css`): about 16px on a 1440 x 900 laptop, 12 to 14px on short or zoomed windows, 16.5px on big desktops; the page column (`max-w-6xl`) is 84rem; game screens 12 to 26px. Size everything in rem so it all scales together.
- Tailwind's scale (`text-xs` … `text-6xl`) for most text.
- Screen-fit sizes, which follow the window height: `text-fit-title`, `text-fit-body`, `text-fit-button` (welcome screens), `text-fit-turn`, `text-fit-question`, `text-fit-answer` (question screens), and `text-fit-question-big` / `text-fit-answer-big` for short questions (48 letters or fewer) and short answers (22 or fewer), bigger again on portrait screens.
- Hints are hover text on a small (i), never a line under a label (teacher, 2026-11-18).

### Shape
- Corners: `rounded-panel` (26px, panels and cards), `rounded-input` (16px, fields and tiles), `rounded-pill` (buttons and chips), `rounded-full` (round buttons, badges).
- Borders: `border-thin` 1.5px (chips, small details), `border-std` 2px (buttons, fields, cards), `border-bold` 2.5px (panels, boards), `border-heavy` 3px (big game frames). Side borders (`border-b-[2.5px]`) stay as they are.
- Shadows: `var(--shadow-sticker)` (0 4px 0 Ink) for cards and buttons that pop; `var(--shadow-sticker-lg)` for panels and pop-up boxes.
- Disabled: `disabled:opacity-40` everywhere (sliders too).
- Touch targets: 44px minimum on touch screens. Compact `sm` controls carry `.tap` (and round ones `.tap-round`), which grow them to 44px when the pointer is a finger.

### Motion
Motion (`motion/react`) for UI, anime.js (`useAnime`) for timelines, presets in `src/ui/motion`. Every animation respects the Motion setting (`still` turns movement off). See `docs/ui-libraries.md`.

## Components

### Button (`src/ui/kit.tsx`)
`<Button variant size>` and `buttonClasses(variant, className, size)` for links that look like buttons (never a button inside a link).

| Variant | Use when |
|---|---|
| `primary` (alias `go`) | yellow #FDFD94, ink text: only go actions (Start, Next, Play, Set up and play, Join, Keep playing, Play again, Start free, Log in) |
| `main` | Grape, white text: every other main action (Save, Create, Add, Make, Import, Print, Download, Assign, Use, Send, Get a quote, Upgrade) |
| `secondary` | white: Back, Cancel and every other button |
| `ghost` | quiet actions (Delete this class) |
| `danger` | destructive actions (pink on hover) |

Every kit button wears the sticker press shade (`0 3px 0` Ink, Grape deep under
`main`); disabled buttons lose it. Next on a card-choice step stays off (pale,
dashed, no shade) until a card is picked. Round tools are 44px (`IconButton`).
Selected cards and chips never use the go yellow: Butter on site and teacher
pages, Mint with an ink ring and a Kelly check in game menus.

| Size | Height | Use when |
|---|---|---|
| `sm` | 36px on a laptop, 44px on touch screens (`.tap`) | compact bars, the Theme Builder |
| `md` | 44px (default) | almost everything; the touch minimum |
| `lg` | 56px | a screen's one big action (Start free, Set up and play) |

States: hover (color), active (shrinks a little), keyboard focus (thick black ring with a white halo, global), disabled (40%, no clicks).

### Top bar (`src/ui/NavBar.tsx`, rule 10)
White, the real wordmark. Wide screens: the links (current page in Butter), Join
(Lavender) and Log in (yellow). Phones: Log in beside one 44px round menu that
holds every link and Report; signed-in teachers fold Teacher, All games, the
site links, Report and Log out into the same menu. Student pages show the logo
only.

### IconButton
A round 44px button that shows only its icon; `label` becomes its hover text and what screen readers say. Use it for every icon-only action.

### Field (`fieldClasses(size)`)
The one look for text boxes and dropdowns: `md` (44px) on teacher forms, `sm` (36px, 44px on touch screens) for compact filters. Always pair with a `<label>` (or `aria-label`).

### Dialog (`src/ui/Dialog.tsx`)
The one pop-up box for menus and teacher pages: dimmed screen, off-white sticker box that pops in, title in the heading font, optional `sub` line, round close button. Props: `title`, `sub`, `onClose` + `closeLabel` (shows the close button and lets Escape close), `size` sm / md / lg, `center`, `zIndex`. Keyboard: focus moves in, Tab stays inside, Escape closes, focus returns. In use: class supports, picture and PIN, teacher survey, upgrade, end live game. Older pop-ups still built on `DialogFocus` alone (Play or share host box, question set import, Create an Activity, Tell Gamify) keep working and move onto `Dialog` when next touched.
Game screens keep their own themed overlays (power-up pop, results box, question screen, draw studio, team pickers); they use `DialogFocus` for the same keyboard care.

### Panel and PageHeader
`Panel`: an off-white sticker card (bold border, sticker shadow) for a group of settings. `PageHeader`: the page title (Grow Year), an optional line, and actions on the right.

### Tabs
The one tab bar: `size` sm (36px, 44px on touch screens: question set tabs, Theme Builder) or md (44px page tabs); `fill` stretches the tabs (labels may wrap, never cut); `panelIds` links the selected tab to its panel.
Special-purpose tab bars that stay hand-built: the Help Center's vertical topic list, the Features page's ways-to-play badges and the Settings panel's vertical tab list (two-across chips on phones).

### Choices (`src/ui/fields.tsx`)
- `ChoiceRow`: the one choice control. A sliding yellow pick for words, or white cards when options have `art` (a small picture: board sizes, grid sizes). Each option can have `tip` hover text; on touch screens (no hover) the tip shows on the card, or under the row for the picked word.
- `PictureChoice`: big picture cards for choices that are mostly a picture (Game Show's board).
- `Toggle`: an on/off switch with an optional hover hint.
- `Slider`: a range with its value in a pill, a green fill up to the knob, an optional hover hint.
- `Stepper`: minus / number / plus for small counts.

### Game pieces (`src/engine`)
- `TopStrip`: the one strip across the top of a solo game (Bubble Pop, Match Three): player picture, score in Grow Year with no box (a steady live region, so screen readers hear each score), a dash for every turn of every round (used filled, this turn yellow with a ring, turns to come hollow), and an optional slot on the right.
- `SoloStrip` (`SoloLayout`, `SoloMeter`, `SoloScore`): THE solo board-game layout (teacher, 2026-11-24, Match Three first; Bubble Pop and every future solo board game follow it). The paper meter pill ("2 moves left", the meter, the game's goal) over the board; the score as a big Grow Year number at the top right with the held power-up cards under it, centered on it (always the top layer). Wide screens: score column beside the board; tall screens: meter, score row at the right, then the board. The board is the square left over (`--solo-board`), so nothing scrolls.
- `ScoreBoard` and `RoundMeter`: the one score board for team games (no title, whole names) and the round box under it.
- `GameWelcome`, `SetupWizard`, `WayToPlay`, `SetPicker`, `PowerUpCards`: the same start menus in every game (Universal views, approved /brand 2026-11-25). The welcome shows the game's short `tagline`; on iPad portrait and phones the cover gives up height so nothing scrolls. Way cards: the pastel band with the icon on its round bright badge and the name in Grow Year. Back and Next sit side by side in the middle under the step; a step's own button (Teams: Add team) goes between them through `FooterSlot`. Set cards: a subject band, the title, the first question, grades and count. Power-up cards: white with a Kelly check when on, dashed cream with an x when off, sized to the room so the page never scrolls. Teams: no count stepper; Add team in the footer, an x on each card.
- The question card (`QuestionScreen`, `ShareQuestion`; sizes in `.q-card`, `src/index.css`): one white card over the game, the mockup's 1280 x 800, 820 x 1180 and 390 x 844 drawings scaled to the screen; a fixed question block, A to D tiles of one size with filled letter badges (Grape with white text, Sky, Pink, Lemon).
- `CodeBoxes` (`src/ui/CodeBoxes.tsx`): PINs (numbers) and, with `letters size="xl"`, the join page's five letter boxes (the next box Butter with a Lemon ring and a blinking caret).

## Do and don't
| Do | Don't |
|---|---|
| Use a component, then a token | Hand-type a hex, a border width or a button height on a menu page |
| One go (yellow) or `main` (Grape) button per screen | Yellow on a Save or Create, or two yellow buttons fighting for attention |
| Put hints in hover text | Add a line of small print under every setting |
| Size in rem; check a 1190 x 540 window | Fix sizes in px that do not scale with the screen |
| Use `Dialog` for any new pop-up on a menu or teacher page | Build a new fixed overlay by hand |
