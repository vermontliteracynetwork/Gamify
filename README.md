# Gamify

A standalone educational gamification platform (Vermont Literacy Network),
combining ideas from Baamboozle, Blooket, Wordwall and Flippity, built to be sold
(free tier + subscriptions). General-purpose
game engine, not literacy-only, though the first demo content is literacy
vocabulary.

## Project documentation (start here)

Everything about where this project is headed lives in this repo, not
scattered across chats or other repos:

| Doc | What's in it |
|---|---|
| [`CLAUDE.md`](./CLAUDE.md) | The binding development standard -- the Three-Lens testing bar every change is held to, plus standing product facts |
| [`docs/platform-spec.md`](./docs/platform-spec.md) | Full product spec: vision, differentiators, data model, accessibility requirements, phased roadmap |
| [`docs/development-plan.md`](./docs/development-plan.md) | **The build bible:** explicit stages from foundation to launch, rules for building independently, defaults for open decisions, and the list of things only the teacher can do |
| [`docs/product-plan.md`](./docs/product-plan.md) | Commercial plan (brainstorm): play shapes, game roster and renames, themes across all games, free vs paid tiers, legal/copyright readiness checklist, roadmap, open decisions |
| [`docs/gamified-learning-research.md`](./docs/gamified-learning-research.md) | Research brief: the case for and against gamified learning (retrieval practice, spacing, dopamine/curiosity, variety), how Gamify answers each counter-argument, and how Gamify will prove its success |
| [`docs/settings-equity-research.md`](./docs/settings-equity-research.md) | Research behind the in-game settings (sound levels, haptics, calm mode, gear button) and culturally responsive, equitable design |
| [`docs/competitor-plans-research.md`](./docs/competitor-plans-research.md) | Cross-comparison of free vs paid plans on similar platforms (prices, limits, collectibles), the lesson from the 2021 FTC complaint about paid-only rewards shown to kids, and how Gamify's tiers compare |
| [`docs/asset-ledger.md`](./docs/asset-ledger.md) | Every font, icon, image, sound and library that ships, with source and license (the logo included) |
| [`docs/question-engine.md`](./docs/question-engine.md) | The shared question engine carried over from the Independent Work Dashboard: question picker, question screen rules, rounds/settings, rewards, assignments |
| [`docs/testing-standards.md`](./docs/testing-standards.md) | The Three Lenses in full -- checklists, test methods, the browser-driven testing harness, real case studies, and current known gaps |
| [`docs/accessibility-research.md`](./docs/accessibility-research.md) | Research findings on gamification effectiveness, UDL 3.0, neurodivergent-friendly design, and assistive tech guidelines, each tied to a specific Gamify implication |
| [`docs/junior-designers-plan.md`](./docs/junior-designers-plan.md) | Classroom co-design plan: how 5th graders (including neurodivergent students with high support needs) help design Gamify's features, teacher-driven, built around three named skills -- descriptive language, game design thinking, and following steps in order |

Bookmark this README (or the repo root) and every planning doc is one
click away.

## Development

```bash
npm install
npm run dev
```

Then open the printed local URL. (No game modules yet: the prototype was removed 2026-10-24 to start the commercial build from scratch.)

## Build

```bash
npm run build
```

Outputs a static `dist/` folder -- deployable anywhere that serves static
files (Vercel, Netlify, etc.), no server required.

## Structure

- `src/games/<game-id>/` -- each game is a self-contained module (own
  component, own data/logic files), plugged into the shared engine in
  `docs/question-engine.md`.
- `src/App.jsx` / `src/Home.jsx` -- top-level routing and the game picker
  landing page.

No auth, no database, no dependency on any other VLN system -- this is
intentionally decoupled so it can be built out independently.
