# Gamify

A standalone educational gamification platform (Vermont Literacy Network),
combining ideas from Baamboozle, Blooket, and Wordwall. General-purpose
game engine, not literacy-only, though the first demo content is literacy
vocabulary.

## Project documentation (start here)

Everything about where this project is headed lives in this repo, not
scattered across chats or other repos:

| Doc | What's in it |
|---|---|
| [`CLAUDE.md`](./CLAUDE.md) | The binding development standard -- the Three-Lens testing bar every change is held to, plus standing product facts |
| [`docs/platform-spec.md`](./docs/platform-spec.md) | Full product spec: vision, differentiators, data model, accessibility requirements, phased roadmap |
| [`docs/plink-oh-spec.md`](./docs/plink-oh-spec.md) | First game module ("Ohhh...Plink"): confirmed rules, open assumptions, and the pixel-exact size spec for matching art/assets |
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

Then open the printed local URL and go to `/games/ohhh-plink`.

## Build

```bash
npm run build
```

Outputs a static `dist/` folder -- deployable anywhere that serves static
files (Vercel, Netlify, etc.), no server required.

## Structure

- `src/games/<game-id>/` -- each game is a self-contained module (own
  component, own data/logic files). `plink-oh` (displayed as
  "Ohhh...Plink") is the first one.
- `src/App.jsx` / `src/Home.jsx` -- top-level routing and the game picker
  landing page.

No auth, no database, no dependency on any other VLN system -- this is
intentionally decoupled so it can be built out independently.
