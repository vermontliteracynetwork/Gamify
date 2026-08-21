# Gamify

A standalone educational gamification platform (Vermont Literacy Network),
combining ideas from Baamboozle, Blooket, and Wordwall. General-purpose
game engine, not literacy-only, though the first demo content is literacy
vocabulary.

See `docs/platform-spec.md` for the full product spec and roadmap, and
`docs/plink-oh-spec.md` for the first game module's rules and open
questions.

## Development

```bash
npm install
npm run dev
```

Then open the printed local URL and go to `/games/plink-oh`.

## Build

```bash
npm run build
```

Outputs a static `dist/` folder -- deployable anywhere that serves static
files (Vercel, Netlify, etc.), no server required.

## Structure

- `src/games/<game-id>/` -- each game is a self-contained module (own
  component, own data/logic files). `plink-oh` is the first one.
- `src/App.jsx` / `src/Home.jsx` -- top-level routing and the game picker
  landing page.

No auth, no database, no dependency on any other VLN system -- this is
intentionally decoupled so it can be built out independently.
