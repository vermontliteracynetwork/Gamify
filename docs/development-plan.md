# Gamify Development Plan: Stages to Launch

Written 2026-10-24 by Claudia. **This is the build bible.** It turns
`docs/product-plan.md` (the *what*) into explicit stages (the *how* and *in
what order*), so building can continue independently while the teacher is
away. Goal: **get Gamify live and earning money**.

How to read it: stages run top to bottom. Each stage has a goal, a build
checklist, a "done when" test, what's needed from the teacher (with the
default Claudia uses if there's no answer yet), and any art to buy.
Status marks: `[ ]` not started, `[~]` in progress, `[x]` done (with date),
`[!]` waiting on the teacher.

---

## Part 1. Rules for building independently

### 1.1 The loop for every task
1. Take the next unchecked item in the current stage (top to bottom).
2. Build it.
3. Check it: type-check, unit tests, build, and for anything a student or
   teacher sees, the Three-Lens browser check on an iPad-sized screen
   (`CLAUDE.md`, `docs/testing-standards.md`), reading every console
   message.
4. Mark it `[x]` with the date in this file, add any new marketing idea to
   `docs/product-plan.md` section 10, add new assets to
   `docs/asset-ledger.md`.
5. Commit and push to the working branch (`claude/awesome-mccarthy-93hliu`).
6. Next item.

### 1.2 When to stop and wait (mark `[!]`, then skip to the next unblocked item)
- Anything that **costs money or needs an account** (domain, hosting
  plan, Supabase project, Stripe, voice service, paid art).
- Anything **legal or brand-final** (Terms, Privacy Policy wording, name,
  trademark, prices going live).
- **Merging to `main` / going live to the public**: the teacher approves
  each production release.
- A product question where a wrong guess would mean redoing real work and
  there is no default below.

### 1.3 Defaults for open decisions (used until the teacher says otherwise)
| Open decision (product plan section 9) | Default used for building |
|---|---|
| Product name / domain | "Gamify"; domain kept in one config value (`APP_DOMAIN`), placeholder `joingamify.com` |
| First three games | Peg Drop, Team Board, Match Up |
| Themes scope | Themes skin the game stage only; menus and teacher pages keep the Gamify brand |
| Free games list | Team Board, Match Up, Peg Drop, Four in a Row |
| Students per classroom | Free 30 (decided), Plus 40, Pro 60 (in one config file) |
| Prices | Plus $60/yr, Pro $108/yr, as config placeholders; nothing charges until Stage 7 is approved |
| Free report history | 30 days |
| Student sign-in | Tap your name, then tap your 2-picture password (K-1 friendly); optional printed QR badges |
| Read-aloud voice | Device voice first (free); human neural voice added later behind a cost switch |
| Tech stack | Section 1.4 |

### 1.4 Tech stack (decided for building)
- **App:** React + **TypeScript** + Vite + Tailwind (current setup,
  converted to TypeScript in Stage 0).
- **Data:** a single data layer with two backends: **local** (browser
  storage, Stages 0-4, no account needed) and **cloud** (Supabase: a new,
  separate project just for Gamify, Stage 5+). Every screen talks to the
  data layer, never to storage directly, so switching costs nothing.
- **Real-time** (Class Live, Share Mirror, live monitor, Lock): Supabase
  Realtime channels.
- **Hosting:** Vercel (`vercel.json` already set up).
- **Payments:** Stripe (Stage 7).
- **Tests:** Vitest (logic) + Playwright (browser, iPad viewport).
- **Words on screen:** every string goes through one translation file
  from day one (Spanish later).

---

## Part 2. Theme design direction (from the teacher, 2026-10-24)

**House themes stay simple on purpose.** The free/default look is clean
and plain: flat colors, one simple pattern, clear shapes, the Gamify brand.
That way:
- the **theme library** (Plus) feels like a real upgrade,
- teachers and students **want to design their own** (Pro Theme Builder),
- and **community themes** in the public gallery stand out.

Rules for house themes:
- Built from code (colors, shapes, simple patterns), no purchased
  illustration, so they're fast to make and license-clean.
- Every game piece is a simple, readable shape (circle ball, rounded
  cards, flat board) that a K-3 student understands instantly.
- Library themes add color, pattern and a few bought or made accent pieces
  (Space: stars and a rocket piece; Garden: leaves and a ladybug piece).
- Premium richness comes from the Theme Builder and community themes,
  not from the house look.

Art the teacher buys (shopping list per stage below) goes to the things
simple shapes can't do well: **Pals, avatar items, a few game pieces and
library theme accents**. Every purchase gets a line in
`docs/asset-ledger.md` with its license.

---

## Part 3. The stages

### Stage 0: Foundation (no teacher input needed)
**Goal:** a clean, tested base every game and screen is built on.

- [ ] Convert the app to TypeScript (strict), keep it building.
- [ ] Folder structure: `src/engine` (question engine), `src/games/<id>`
      (one folder per game), `src/teacher`, `src/student`, `src/data`
      (data layer), `src/theme`, `src/settings`, `src/i18n`, `src/ui`
      (shared components).
- [ ] Data layer interface + local backend (question sets, classrooms,
      students, assignments, question log, settings).
- [ ] Translation setup: one English strings file, every screen uses it.
- [ ] Theme engine: tokens (palette, fonts, backdrop, celebration, sound
      pack) + **per-game pieces**: each game declares its own designable
      pieces (with sizes), and a theme belongs to one game (teacher rule,
      2026-10-24: themes are designed by game, not shared across games);
      contrast check built in; calm version generated automatically.
- [ ] House theme **Classic** (simple, Part 2).
- [ ] Game module contract (manifest: id, name, modes, question types,
      settings, designable theme pieces, tier, report format) + game
      registry.
- [ ] Config file: tiers, limits, prices, `APP_DOMAIN`, free games list.
- [ ] Tests: Vitest set up with first tests; Playwright smoke test at iPad
      size (portrait and landscape); one `npm run check` that runs
      type-check, tests and build.
- [ ] GitHub Actions: run `npm run check` on every push.

**Done when:** `npm run check` passes in CI, the home page renders in the
Classic theme with no console errors on iPad portrait and landscape.

### Stage 1: Question sets (content)
**Goal:** teachers can make and import question sets that feed every game.

- [ ] Question model supporting every game shape: multiple choice, typed
      answer, pairs (term/definition, picture/word), category lists, word +
      clue lists; images with alt text; audio clip optional. Conversions
      where they make sense (a multiple-choice question becomes a pair).
- [ ] Question set editor in a **table view** (modeled on the Dashboard's
      table editor): one row per question, add/remove/reorder, picture
      upload, mark the right answer, preview.
- [ ] CSV import (existing parser in `src/lib/questionSets.js` moved into
      the data layer) with row-level error messages and a sample file.
- [ ] Public question set library: Claudia writes 15-20 original starter
      sets (K-5 literacy and math, plus a few general ones) so a new
      teacher can play in under two minutes.
- [ ] Question picker (`docs/question-engine.md` section 1): pool from
      assigned sets, focus star, no immediate repeats, generated fallback.

**Done when:** a teacher can create a set by hand, import one by CSV, and
pick a public set; the picker passes unit tests for every rule.

### Stage 2: The shared question engine
**Goal:** the one question screen, settings and reporting every game uses.

- [ ] Question screen (`docs/question-engine.md` section 3): 3-second read
      first, shuffled answers, one try, right moment, new question after a
      miss, Listen (device voice), tools (calculator, scratchpad, text
      size, highlighter), card mode, close with "are you sure", guessing
      check.
- [ ] Typed answers with 3 support levels.
- [ ] **"Let's look back"** end-of-game review: each missed question with
      the right answer, read aloud (research gap from
      `docs/gamified-learning-research.md`).
- [ ] Start card with Rounds and Questions-per-break sliders, remembered
      per game, lockable by assignment.
- [ ] **Gear button + full settings panel** (product plan 4A): sound
      effects / music / voice levels, haptics (only where supported), calm
      mode, motion, celebrations, backgrounds, brightness, text size,
      reading comfort, contrast, color-safe palette, timers, game speed,
      tap-only controls, left-handed layout, presets; follows the student
      across games; teacher defaults and locks; starts calm when the iPad
      asks for reduced motion.
- [ ] Question log: every question shown, with all fields in product plan
      4C.
- [ ] `useAsk` hook: games call `ask(label, onRight)` and nothing else.

**Done when:** a test game page can ask questions through the hook with
every rule working, every setting changes what it says, and the log
records each question; Three-Lens check passed on iPad.

### Stage 3: First three games + simple themes
**Goal:** prove all four modes with three games.

- [ ] **Peg Drop**: Solo, Versus (pass-and-play + CPU Easy/Medium/Hard),
      Share (1-10 teams, class vs CPU, class vs teacher). Smooth physics,
      frame-checked.
- [ ] **Team Board** (Share): pick a surprise card, answer, reveal
      (points, swap, steal, double); 1-10 teams; teacher taps right / not
      yet; undo.
- [ ] **Match Up** (Solo): match pairs from the set, timer optional.
- [ ] "Take turns" engine (teams, students, CPU, teacher as turn players)
      shared by Share and Versus.
- [ ] Silly-name dice (safe word lists) and team setup (random, balanced,
      hand-picked, saved team sets) for Share.
- [ ] A simple house theme for each of the three games, plus two simple
      library themes per game (Space, Garden), each designed on that
      game's template.
- [ ] Theme template for each game: a printable PDF showing every piece
      to design at the right size (also usable for digital design).
- [ ] Every sound has a visual partner; no flashing anywhere.

**Done when:** each game plays start to finish in every mode it supports
at iPad size, frame checks show smooth motion, and each game's themes look
right in that game.

**Art to buy (optional at this stage):** none required. Nice to have: a
small sound-effect pack with a commercial license.

### Stage 4: Classroom, Arcade and reports (still local, one device)
**Goal:** a teacher can run Gamify for a real class on one device: a
usable free beta for pilot classrooms.

- [ ] Teacher home: classrooms (tier limits from config), class list
      (type or paste names), the student sign-in pictures.
- [ ] Assign question sets to the whole class and/or chosen students (grid
      view), with start/end dates and tier limits (1 / 5 / unlimited).
- [ ] Student sign-in (name + 2-picture password) and the **student
      Arcade**: games, free games playable, paid games with a lock on the
      cover (lock icon only), questions from the student's assigned sets.
- [ ] Reports (product plan 4C): session, by student, by question, by set,
      by day, by game, by team; filters, sort, search, totals bar, CSV,
      print.
- [ ] Teacher settings defaults per student (IEP-style).
- [ ] Onboarding: first-run tour, "play a sample game in 2 minutes."

**Done when:** a teacher can set up a class, assign sets, students take
turns on one iPad through the Arcade, and the teacher pulls a filtered
report and downloads CSV.

**[!] Teacher: line up 2-4 pilot classrooms** to try the Stage 4 beta.

### Stage 5: Cloud accounts and the join page
**Goal:** work saved in the cloud, students on their own devices.

- [!] **Teacher needed:** create the Supabase project (separate from all
      VLN projects) and add its keys to Vercel; buy the domain once the
      trademark search clears.
- [ ] Cloud backend for the data layer (same interface as local), with
      row-level security so teachers only ever see their own data.
- [ ] Teacher sign-up / sign-in (email + Google sign-in).
- [ ] `<domain>/join` page: player codes (letters + numbers) and viewer
      codes (letters only), no look-alike characters, no vowels, big
      tiles, QR codes, read-aloud.
- [ ] Assignments: code, direct link (`/join/CODE`), **Share to Google
      Classroom** button, projector code screen.
- [ ] Student sign-in on their own device via class code + picture
      password.
- [ ] Downgrade rules (nothing deleted; extras read-only).
- [ ] Data export and delete (teacher deletes a class and everything in
      it).
- [ ] Rate limits on code guessing; codes expire.

**Done when:** a teacher signs up, assigns a set, students join from their
own iPads by link and by code, answers land in the teacher's reports.

### Stage 6: Live features (real-time)
**Goal:** the headline classroom features.

- [ ] **Class Live**: lobby, name approval / rename / remove, room lock,
      every student plays their own game, teacher host screen with live
      leaderboard (or class goal bar), pause all, timer, end + podium.
- [ ] **Share Mirror**: view-only copy of Share on another device via
      viewer code, with the viewer's own zoom, contrast, read-aloud and
      screen-reader text.
- [ ] **Live monitor**: student tiles, time on question, alerts, live
      question feed; never shown on the projector.
- [ ] **Lock button**: lock one / several / all, custom private message,
      templates, unlock; survives refresh, rejoin and lost connection;
      logged in reports.
- [ ] Versus on two devices.
- [ ] Load test: 30 students in one live game on a slow network.

**Done when:** a 30-device live game runs with no lag or lost answers,
lock works through refresh and rejoin, mirror stays in sync.

### Stage 7: Paid plans, themes and XP (start earning)
**Goal:** Plus and Pro can be bought and are worth buying.

- [!] **Teacher needed:** Stripe account, final prices, the business
      owner of record (product plan decision 1), Terms and Privacy Policy
      approved by the attorney.
- [ ] Stripe checkout, monthly and yearly, customer portal, receipts;
      school purchase-order request form.
- [ ] Tier enforcement everywhere from config (classrooms, students, saved
      sets, assigned sets, games, themes, XP, monitor/Lock, report
      history).
- [ ] Theme library (Plus): the simple library themes playable; previews
      for Free.
- [ ] **Theme Builder (Pro)**, one per game (themes are per game): live
      preview of that game's screens, downloadable theme template, upload
      cards with checks, printable template pages + scan-and-cut, colors,
      fonts, sounds, cover, teacher approval, student design mode,
      "Designed by Room 12" credit, share to class / school / public
      gallery (reviewed).
- [ ] **XP and shop (paid classrooms)**: earning rules and daily cap,
      shop with fixed prices, optional mystery eggs (XP only, odds shown,
      teacher switch), teacher controls; invisible in free classrooms.
- [ ] Remaining games to reach launch roster (Part 4).

**Art to buy:** first set of **Pals** (about 20-30 characters), **avatar
items** (skin tones, hair, head coverings, glasses, hearing aids,
wheelchairs, outfits), **library theme accent pieces**. Specs (sizes,
file types) will be written per item before purchase.

**Done when:** a test card buys Plus and Pro in Stripe test mode, every
limit switches correctly, a class designs and plays its own theme.

### Stage 8: Launch readiness
**Goal:** safe, legal and findable.

- [!] **Teacher needed:** attorney review (product plan 6, questions
      list), trademark search, business setup, DMCA agent registration.
- [ ] Privacy Policy and Terms drafts for the attorney (Claudia drafts,
      attorney finalizes), cookie-free student pages verified.
- [ ] Accessibility audit against WCAG 2.1 AA + accessibility conformance
      report (VPAT).
- [ ] Security review: data access rules, backups, breach response plan.
- [ ] **IT whitelist page** (domains, real-time connections) and a test on
      a filtered school network; request education categorization from
      major school web filters.
- [ ] Device check: iPad (oldest supported iOS), Chromebook, smart-board
      browser.
- [ ] Public website: landing page (using the marketing list), pricing
      page, demo video plan, help center, contact/support, status page.
- [ ] Blog ("Ways to use Gamify"): publish the first 5-8 posts from
      `docs/product-plan.md` section 10A at launch, starting with the
      class-designed theme + fractions post.
- [ ] Teacher-side usage analytics (no tracking on student pages).

**Done when:** every `[!]` above is cleared and the teacher approves the
production release.

### Stage 9: Live and growing
- [ ] Launch (merge to `main`, production domain live).
- [ ] Pilot results write-up (research brief section 5) for marketing and
      district sales.
- [ ] More games in roster order, Spanish menus and read-aloud, Google
      Classroom roster import, Clever / ClassLink, school and district
      plans, human neural read-aloud voice.

---

## Part 4. Launch game roster (by stage)

| Stage | Games |
|---|---|
| 3 | Peg Drop, Team Board, Match Up |
| 7 (before launch) | Four in a Row, Memory Match, Quiz, Category Board, Flashcards, Bubble Pop, Space Bowling |
| 9 (after launch, rolling) | Road Hop, Lunch Rush, Bakery Match, Castle Guard, Slime Chess, Shape Runner, Farm Grow, Word Search, Crossword, Group Sort, Spinner Wheel, Climb and Slide, Tic-Tac-Toe, and the rest of the product plan roster |

## Part 5. What the teacher owns (the full `[!]` list in one place)
1. Business owner of record and seller (VLN, personal, or new company).
2. Trademark search for "Gamify" and the logo, then buy the domain.
3. Supabase project + keys in Vercel (Stage 5).
4. Pilot classrooms (Stage 4).
5. Stripe account, final prices (Stage 7).
6. Art purchases (Stage 7 list).
7. Attorney review, Terms, Privacy Policy, DMCA agent (Stage 8).
8. Approval of each production release.

## Progress log
- 2026-10-24: Plan written. Prototype removed; product plan, research
  briefs, logo and asset ledger in place. Next: Stage 0.
