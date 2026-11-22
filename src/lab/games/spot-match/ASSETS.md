# Spot the Match: assets

Every picture in this game (the Classic scene, characters, board pieces, power-up pictures and the cover) is drawn in code as SVG in `Game.tsx`, made from scratch for Gamify. No image files are copied into `public/lab/spot-match/`.

| Asset | Where it comes from | License (docs/asset-ledger.md) |
|---|---|---|
| All Classic art (SVG in `Game.tsx`) | Drawn in code for Gamify | Original, owned |
| UI icons (Phosphor: CirclesFour, HandTap, MagnifyingGlass, Timer) | `@phosphor-icons/react` | MIT (ledger line "Phosphor Icons") |
| Motion (animation) | npm `motion` | MIT (ledger line "Motion") |
| Confetti (`ctx.burst`) | npm `canvas-confetti` | ISC (ledger line "canvas-confetti") |
| Grow Year and Inclusive Sans fonts | Already in the app | Ledger lines "Grow Year", "Inclusive Sans" (OFL 1.1) |
| Sound `sfx.chest` | `/sounds/board/chest.mp3` (Open treasure chest 8-bit, Freesound 519630 by mrthenoronha; ledger: teacher checked, cleared for commercial use) | see source column |
| Sound `sfx.jump` | `/sounds/board/jump.mp3` (jump_c_04, Freesound 350906 by cabled_mess; ledger: supplied by the teacher, cleared) | see source column |
| Sound `sfx.magnet` | `/sounds/board/magnet.mp3` (Jacob's ladder single zap, Freesound 19487 by halleck; ledger: teacher checked, cleared for commercial use) | see source column |
| Sound `sfx.tap` | Classic tap (`src/engine/feedback.ts` / `public/sounds/tap.mp3`, Kenney Interface Sounds, CC0 1.0) | see source column |
| Sound `sfx.whoosh` | Classic whoosh (`src/engine/feedback.ts`; Casual SoundFX by Tim Beek, CC BY 4.0, credited in the ledger) | see source column |
| Sounds made in code: `sfx.boing`, `sfx.cheer`, `sfx.coin`, `sfx.freeze`, `sfx.note`, `sfx.oops`, `sfx.pop`, `sfx.tick`, `sfx.whistle` | Web Audio tones in `src/lab/sfx.ts` | Original, owned (ledger line "Sound effects ... Generated in code") |

Nothing here imitates another platform's art, sounds or names.
