# Asset Ledger

Every font, icon, image, sound and library that ships in Gamify, with its
source and license. Required by `CLAUDE.md` (Legal readiness): nothing
ships without a line here.

| Asset | Where it's used | Source | License / ownership | Added |
|---|---|---|---|---|
| Gamify logo: "G" joystick mark and "Gamify" wordmark (`public/brand/gamify-mark.png`, `public/brand/gamify-wordmark.png`, `public/favicon.png`, `public/apple-touch-icon.png`) | Header, browser tab icon, iPad home-screen icon | Designed by Kayden Hamlin (`Gamify_Logo_1.zip`, new version 2026-10-24, lettering in Grow Year) | Owned by the designer. **To confirm:** that the Canva elements used (shapes, the wordmark font) allow use in a commercial logo and as a trademark (Canva's license limits trademarking some stock elements), and who owns the logo (ties to `docs/product-plan.md` 6.4). Include it in the trademark search. | 2026-10-24 |
| Frankfurter Medium (font) | Not used: replaced by Grow Year with the new logo (2026-10-24) | | | |
| Inclusive Sans (font, by Olivia King) | All body text, platform and game stages (your call, 2026-10-24) | @fontsource/inclusive-sans (Google Fonts) | SIL Open Font License 1.1 | 2026-10-24 |
| Grow Year (font, by Khurasan Studio) | Headings and the logo lettering | Sent by the owner (`grow-year.zip`); served from `public/fonts/grow-year.woff2` | The download's More Info file: "This product 100% free for personal use & commercial use." The font's own license link (khurasanstudio.com/license) could not be opened from the build environment: **confirm it allows web embedding before launch.** Keep the original zip on file. | 2026-10-24 |
| axe-core and @axe-core/playwright | Automated accessibility checks in the test suite only (never shipped to users) | npm | MPL-2.0 (dev tool, unmodified) | 2026-10-24 |
| qrcode | QR codes on the projector code screen | npm (qrcode 1.5) | MIT | 2026-10-24 |
| Common Core State Standards codes and domain names (no standard text) | Question set details and filters | corestandards.org | Public license from NGA Center and CCSSO: free use with the notice "© Copyright 2010. National Governors Association Center for Best Practices and Council of Chief State School Officers. All rights reserved." Show that notice on the public site footer and the set details help. | 2026-10-24 |
| Phosphor Icons | UI icons | @phosphor-icons/react | MIT | 2026-10 |
| React, React DOM, React Router | App framework | npm | MIT | 2026-10 |
| Motion | Animation | npm `motion` | MIT | 2026-10 |
| canvas-confetti | Celebrations | npm | ISC | 2026-10 |
| Tailwind CSS, Vite | Styling and build tools | npm | MIT | 2026-10 |
| Sound effects | None shipping yet (prototype's generated sounds removed with it) | n/a | n/a | n/a |

## Device fonts for theme titles (2026-10-25)

The Theme Builder's Rounded, Storybook and Typewriter title fonts use fonts
already installed on the student's device (CSS generic families such as
`ui-rounded`, `Georgia`, `serif`, `ui-monospace`). Gamify ships no font
files for them, so no license is needed. Font names never appear as brand
names in the product; the choices are labeled Rounded, Storybook and
Typewriter.

## Theme sound packs (2026-10-25)

Classic, Soft, Chimes, Bloops and Zaps are synthesized in code with the Web
Audio API (`src/engine/feedback.ts`). No sound files, nothing to license.
