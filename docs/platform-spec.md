# Literacy Gamification Platform — Product Spec (Draft v0.1)

> **2026-10-24:** Gamify is now a commercial product and the Plink-oh
> prototype has been removed. `docs/product-plan.md` is the newer plan and
> wins wherever the two disagree (game roster, tiers, themes, accounts,
> roadmap). Mentions of Plink-oh below are historical.

## 1. Vision

A standalone, general-purpose educational game engine (K-12) combining:
- **Baamboozle**: fun board/reveal games, fast question-set authoring
- **Blooket**: arcade-style games with power-ups, live join-code sessions, homework/async mode
- **Wordwall**: game-format variety, quiz mode, theming (fonts, color)

Differentiators vs. all three:
- **Continuous student profile** — badges/achievements accrue across games and sessions, not reset per game.
- **Teacher classroom** — choice boards and assigned activities, not just one-off game links.
- **Neurodivergent-first accessibility** — calm-mode toggles (visual/auditory overstimulation off), dyslexia-friendly fonts, screen reader support, consistent font selector, mute — built into every game module, not bolted on.
- **Pluggable game-module architecture** — new game types can be added without touching the core platform.

## 2. Users

- **Teacher**: authors/imports question sets, configures games (difficulty, power-ups on/off, timers on/off, accessibility toggles), assigns activities to a classroom, hosts live join-code sessions, views student results.
- **Student**: authenticated account tied to the platform's existing user system. Plays assigned games independently (async) *or* joins a teacher's live session with a code. Accrues a persistent profile (badges, achievements, history) across all games.
- **Admin** (future-facing, not v1-blocking): manages teacher accounts, curated content library, platform-wide settings.

## 3. Core Platform Components

### 3.1 Question Sets
- CRUD authoring in-app (manual entry).
- Import from CSV / Google Sheets / Quizlet export.
- Question types: multiple choice, fill-in-blank, drag-to-order, audio-based, image-based.
- Each question set is reusable across any compatible game module.
- Ownership: teacher-authored (private or shared) or curated library (VLN-provided), tagged by subject/grade — standards/framework tagging (e.g. Science of Reading) deferred to a later phase but the data model should leave room for a `tags`/`standards` field now.

### 3.2 Game Modules (pluggable)
Each game module is a self-contained unit that:
- Declares what question types it supports.
- Declares configurable settings it exposes (difficulty, power-ups on/off, timer on/off, calm-mode variant).
- Implements both a **live** (host + join-code, real-time state sync) and **async** (single-player, self-paced) play mode where applicable.
- Reports results back to the platform's scoring/profile system in a common format.

v1 ships with **Plink-oh** (see companion spec) as the first module, proving the plugin contract end to end.

Planned future modules (not v1, ordered roughly by build complexity, cheapest first):
1. Hangman
2. Word search
3. Balloon popper (arcade/click)
4. Tic-tac-toe (2-player grid)
5. Connect 4 (2-player grid)
6. Bowling (arcade)
7. Board game / chutes & ladders (board traversal)
8. Clicker game (Scratch-style incremental)
9. Tower defense (most complex — real-time strategy loop)
10. Candy Crush–style match-3 (most complex — grid physics/matching engine)

### 3.3 Live Session Mode
- Teacher hosts a session, gets a join code, students join without needing to pre-navigate to the assignment.
- Real-time state sync (WebSockets or equivalent) drives shared game state (turn order, board state, live scoreboard).
- Deferred to fast-follow after async mode ships and the module contract is proven (see §6 Roadmap) — real-time infra is the single biggest technical lift, so it's sequenced deliberately rather than "whatever's easiest" on day one.

### 3.4 Async / Independent Play
- Teacher assigns a game + question set to a classroom or individual students.
- Students access assigned games directly from their own profile/dashboard — independent of whether the teacher is live or online.
- Results log automatically to the student's profile on completion.

### 3.5 Student Profile
- Authenticated account tied to the platform's existing user system (not anonymous play codes).
- Persistent across games: badges, achievements, streaks, play history.
- v1: simple milestone badges (e.g., "completed 5 games," "3-day streak," "first Plink-oh win"). Mastery/skill analytics and linking into the broader literacy-data platform are explicitly deferred — v1 is a standalone fun tool with the data model shaped so that link is possible later, not built now.

### 3.6 Teacher Classroom
- v1: single-teacher MVP. One teacher, one or more classes/rosters, one choice board of assigned activities.
- Admin/multi-teacher oversight: designed for, not required, in v1.

### 3.7 Accessibility & Theming
Required across every game module, not optional per-module work:
- Dyslexia-friendly font option + consistent font selector across the platform.
- Color contrast modes.
- Screen reader support.
- Mute / audio-off option.
- Visual overstimulation toggle (reduced motion/effects — "calm mode").
- Auditory overstimulation toggle (reduce/remove sound effects and music).
- Timer on/off (removes time pressure).
- Power-up/randomness on/off (removes luck-based scoring where the module supports it).
- Difficulty setting, module-dependent.

## 4. Data Model (high level, v1)

- `User` (teacher | student), tied to existing platform auth.
- `Classroom` (teacher_id, roster of student_ids).
- `QuestionSet` (owner_id, visibility [private/shared/curated], questions[]).
- `Question` (type, prompt, media refs, answer(s), distractors).
- `GameModule` (static registry: id, name, supported question types, config schema).
- `GameAssignment` (classroom_id or student_id, game_module_id, question_set_id, config overrides, mode [async/live]).
- `GameSession` (assignment_id, student_id, mode, state, score, completed_at).
- `Profile` (student_id, badges[], achievements[], history[]).

## 5. Platform & Device Targets

- New standalone app (not bolted into the existing literacy-data-platform stack), reusing auth/DB/deploy patterns where convenient.
- Primary devices: iPads and general web browser. Design touch-first, responsive.
- Age range K-12 → UI must scale from early-reader-friendly (icon/audio-led navigation, large tap targets) up to older-student appropriate density.

## 6. Roadmap

**Phase 1 (v1 — this build):**
- Core platform: auth (student/teacher), classroom + roster, question set authoring (manual + CSV import), all question types, accessibility/theming settings.
- Plink-oh game module, async mode only.
- Basic student profile with milestone badges.
- Basic teacher choice board (assign Plink-oh + a question set).

**Phase 2 (fast-follow):**
- Live join-code hosted sessions (real-time sync) — start with Plink-oh as the first live-enabled module.
- 1-2 additional game modules (likely Hangman, Word search — cheapest to build, prove out async pipeline reuse).
- Google Sheets / Quizlet import.

**Phase 3+:**
- Remaining game modules, roughly in the complexity order listed in §3.2.
- Curated content library + admin tooling.
- Standards/framework tagging.
- Linking student profile data into the broader literacy-data platform.
- AI-assisted content generation (explicitly deferred, not v1 or Phase 2).

## 7. Open Questions (carried forward, not yet decided)

- Exact real-time tech choice for live mode (deferred until Phase 2 planning).
- Whether curated content library is VLN-authored, community-submitted, or both.
- Standards/framework taxonomy to adopt when tagging is built (Phase 3+).
