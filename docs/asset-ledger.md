# Asset Ledger

Every font, icon, image, sound and library that ships in Gamify, with its
source and license. Required by `CLAUDE.md` (Legal readiness): nothing
ships without a line here.

| Asset | Where it's used | Source | License / ownership | Added |
|---|---|---|---|---|
| Gamify logo: "G" joystick mark and "Gamify" wordmark (`public/brand/gamify-mark.png`, `public/brand/gamify-wordmark.png`, `public/favicon.png`, `public/apple-touch-icon.png`) | Header, browser tab icon, iPad home-screen icon | Designed by Kayden Hamlin in Canva (`Gamify_Logo.pdf`, 2026-10-24) | Owned by the designer. **To confirm:** that the Canva elements used (shapes, the wordmark font) allow use in a commercial logo and as a trademark (Canva's license limits trademarking some stock elements), and who owns the logo (ties to `docs/product-plan.md` 6.4). Include it in the trademark search. | 2026-10-24 |
| Fredoka (font) | Display text, standing in for Frankfurter Medium | @fontsource/fredoka (Google Fonts) | SIL Open Font License 1.1 | 2026-10-24 |
| Frankfurter Medium (font) | Display text (brand font, your choice 2026-10-24) | **Not shipped yet.** A commercial font: needs a web font license bought by you, then the .woff2 file added to `public/fonts/` with an `@font-face` in `src/index.css`. A Canva license does not cover web use. | **Waiting on you** | |
| Inclusive Sans (font, by Olivia King) | All body text, platform and game stages (your call, 2026-10-24) | @fontsource/inclusive-sans (Google Fonts) | SIL Open Font License 1.1 | 2026-10-24 |
| Common Core State Standards codes and domain names (no standard text) | Question set details and filters | corestandards.org | Public license from NGA Center and CCSSO: free use with the notice "© Copyright 2010. National Governors Association Center for Best Practices and Council of Chief State School Officers. All rights reserved." Show that notice on the public site footer and the set details help. | 2026-10-24 |
| Phosphor Icons | UI icons | @phosphor-icons/react | MIT | 2026-10 |
| React, React DOM, React Router | App framework | npm | MIT | 2026-10 |
| Motion | Animation | npm `motion` | MIT | 2026-10 |
| canvas-confetti | Celebrations | npm | ISC | 2026-10 |
| Tailwind CSS, Vite | Styling and build tools | npm | MIT | 2026-10 |
| Sound effects | None shipping yet (prototype's generated sounds removed with it) | n/a | n/a | n/a |
