# Spot the Match: assets

Every picture (Classic scene, characters, pieces, power-up pictures, cover) is drawn in code as SVG in `Game.tsx`, made from scratch for Gamify. No image files are copied, so `public/lab/spot-match/` is not used.

| Asset | Source | License (docs/asset-ledger.md) |
|---|---|---|
| Classic art (SVG in `Game.tsx`) | Drawn in code for Gamify | Original, owned |
| UI icons (Check, CirclesFour, HandTap, MagnifyingGlass, Timer, X) | `@phosphor-icons/react` | MIT ("Phosphor Icons") |
| Motion | npm `motion` | MIT ("Motion") |
| Confetti (`ctx.burst`) | npm `canvas-confetti` | ISC ("canvas-confetti") |
| Grow Year, Inclusive Sans | Already in the app | Ledger lines "Grow Year", "Inclusive Sans" |
| Sound `sfx.chest` | `/sounds/board/chest.mp3` (Open treasure chest 8-bit, Freesound 519630 by mrthenoronha) | Supplied by the teacher, cleared for commercial use (ledger) |
| Sound `sfx.jump` | `/sounds/board/jump.mp3` (jump_c_04, Freesound 350906 by cabled_mess) | Supplied by the teacher, cleared for commercial use (ledger) |
| Sound `sfx.magnet` | `/sounds/board/magnet.mp3` (Jacob's ladder single zap, Freesound 19487 by halleck) | Supplied by the teacher, cleared for commercial use (ledger) |
| Sound `sfx.tap` | Classic tap (`public/sounds/tap.mp3`, Kenney Interface Sounds) | CC0 1.0 (ledger: Kenney Interface Sounds) |
| Sound `sfx.whoosh` | Classic whoosh (Casual SoundFX by Tim Beek) | CC BY 4.0, credited (ledger: Casual SoundFX) |
| Sounds made in code: `sfx.boing`, `sfx.cheer`, `sfx.coin`, `sfx.freeze`, `sfx.note`, `sfx.pop`, `sfx.tick`, `sfx.whistle` | Web Audio tones in `src/lab/sfx.ts` | Original, owned (ledger "Sound effects ... Generated in code") |

Nothing here copies or imitates another platform's art, sounds or names.
