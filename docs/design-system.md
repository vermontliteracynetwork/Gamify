# Gamify design system

The look of every menu, setup page and teacher page: the light "sticker"
style (periwinkle ground, off-white panels, black outlines, pale yellow
accent). Game stages wear their own themes (`src/theme`); everything here is
the standard Gamify look around them. Audited and tidied 2026-11-18.

Rule of thumb: reach for a component first, then a token, and only then a
hand-typed value. Game art (Classic drawings, board colors, effects) may keep
its own colors in code; menus and teacher pages may not.

## Tokens (`src/index.css`)

### Colors
| Token (Tailwind) | Value | Use for |
|---|---|---|
| `bg` | #b4c4fb | the periwinkle ground |
| `surface` / `surface-2` / `surface-hover` | #fbfcf8 / #e9eefe / #f2f5ff | panels, wells, hover |
| `border` / `border-soft` | #000 / #cdd7fb | outlines, quiet outlines and empty dashes |
| `text` / `muted` / `faint` | #000 / #314677 / #7383ad | body text, hints, placeholders |
| `accent` / `accent-hover` / `accent-ink` | #fdfd94 / #ffffb8 / #000 | the pick, the main button, "this one" |
| `secondary` | #ed9d75 | salmon: secondary hover, survey |
| `success` / `success-ink` | #9fe7a0 / #1f7a45 | done, right, filled meters / green text and icons |
| `danger` / `error` | #e5635f / #9b2c3a | coral delete hover / error text |
| `ink-night` | #241c3d | dark badges and overlays |
| `gold` | #f6c544 | stars earned |
| `mint-soft` | #c8f0dc | power-up on, answerer chips |
| `quiz-yellow/green/blue/orange` | answer tile colors | answer tiles A to D |

### Type
- Fonts: `font-display` (Grow Year: h1, `.title-bubble`, big numbers and scores), `font-heading` / `font-body` (Inclusive Sans).
- The root size follows the screen (the screen-size rule, `src/index.css`): about 15px on a 1440 x 900 laptop, 11 to 13px on short or zoomed windows, 16px on big desktops; game screens 12 to 26px. Size everything in rem so it all scales together.
- Tailwind's scale (`text-xs` … `text-6xl`) for most text.
- Screen-fit sizes, which follow the window height: `text-fit-title`, `text-fit-body`, `text-fit-button` (welcome screens), `text-fit-turn`, `text-fit-question`, `text-fit-answer` (question screens).
- Hints are hover text on a small (i), never a line under a label (teacher, 2026-11-18).

### Shape
- Corners: `rounded-panel` (26px, panels and cards), `rounded-input` (16px, fields and tiles), `rounded-pill` (buttons and chips), `rounded-full` (round buttons, badges).
- Borders: `border-thin` 1.5px (chips, small details), `border-std` 2px (buttons, fields, cards), `border-bold` 2.5px (panels, boards), `border-heavy` 3px (big game frames). Side borders (`border-b-[2.5px]`) stay as they are.
- Shadows: `var(--shadow-sticker)` (0 4px 0 black) for cards and buttons that pop; `var(--shadow-sticker-lg)` for panels and pop-up boxes.
- Disabled: `disabled:opacity-40` everywhere (sliders too).
- Touch targets: 44px minimum on touch screens. Compact `sm` controls carry `.tap` (and round ones `.tap-round`), which grow them to 44px when the pointer is a finger.

### Motion
Motion (`motion/react`) for UI, anime.js (`useAnime`) for timelines, presets in `src/ui/motion`. Every animation respects the Motion setting (`still` turns movement off). See `docs/ui-libraries.md`.

## Components

### Button (`src/ui/kit.tsx`)
`<Button variant size>` and `buttonClasses(variant, className, size)` for links that look like buttons (never a button inside a link).

| Variant | Use when |
|---|---|
| `primary` | the one main action on a screen (yellow) |
| `secondary` | everything else |
| `ghost` | quiet actions (Delete this class, Back) |
| `danger` | destructive actions (coral on hover) |

| Size | Height | Use when |
|---|---|---|
| `sm` | 36px on a laptop, 44px on touch screens (`.tap`) | compact bars, the Theme Builder |
| `md` | 44px (default) | almost everything; the touch minimum |
| `lg` | 56px | a screen's one big action (Start free, Set up and play) |

States: hover (color), active (shrinks a little), keyboard focus (thick black ring with a white halo, global), disabled (40%, no clicks).

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
Special-purpose tab bars that stay hand-built: the Help Center's vertical topic list, the Features page's ways-to-play badges and the Settings panel's scrolling strip.

### Choices (`src/ui/fields.tsx`)
- `ChoiceRow`: the one choice control. A sliding yellow pick for words, or white cards when options have `art` (a small picture: board sizes, grid sizes). Each option can have `tip` hover text; on touch screens (no hover) the tip shows on the card, or under the row for the picked word.
- `PictureChoice`: big picture cards for choices that are mostly a picture (Game Show's board).
- `Toggle`: an on/off switch with an optional hover hint.
- `Slider`: a range with its value in a pill, a green fill up to the knob, an optional hover hint.
- `Stepper`: minus / number / plus for small counts.

### Game pieces (`src/engine`)
- `TopStrip`: the one strip across the top of a solo game (Bubble Pop, Match Three): player picture, score in Grow Year with no box (a steady live region, so screen readers hear each score), a dash for every turn of every round (used filled, this turn yellow with a ring, turns to come hollow), and an optional slot on the right.
- `ScoreBoard` and `RoundMeter`: the one score board for team games (no title, whole names) and the round box under it.
- `GameWelcome`, `SetupWizard`, `WayToPlay`, `SetPicker`, `PowerUpCards`: the same start menus in every game.

## Do and don't
| Do | Don't |
|---|---|
| Use a component, then a token | Hand-type a hex, a border width or a button height on a menu page |
| One `primary` button per screen | Two yellow buttons fighting for attention |
| Put hints in hover text | Add a line of small print under every setting |
| Size in rem; check a 1190 x 540 window | Fix sizes in px that do not scale with the screen |
| Use `Dialog` for any new pop-up on a menu or teacher page | Build a new fixed overlay by hand |
