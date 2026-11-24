# Top Answers: assets

Every picture (Classic scene, characters, pieces, power-up pictures, cover) is drawn in code as SVG in `Game.tsx`, made from scratch for Gamify. No image files are copied, so `public/lab/survey-showdown/` is not used.

| Asset | Source | License (docs/asset-ledger.md) |
|---|---|---|
| Classic art (SVG in `Game.tsx`) | Drawn in code for Gamify | Original, owned |
| UI icons (Check, HandTap, Heart, Star, X) | `@phosphor-icons/react` | MIT ("Phosphor Icons") |
| Motion | npm `motion` | MIT ("Motion") |
| Confetti (`ctx.burst`) | npm `canvas-confetti` | ISC ("canvas-confetti") |
| Grow Year, Inclusive Sans | Already in the app | Ledger lines "Grow Year", "Inclusive Sans" |
| Sound `sfx.bell` | `/sounds/pinball/score-bell.mp3` (score bell, Freesound 171073 by relwin) | Supplied by the teacher, cleared for commercial use (ledger) |
| Sound `sfx.bump` | `/sounds/pinball/collision.mp3` (fast collision, Freesound 332056 by qubodup) | Supplied by the teacher, cleared for commercial use (ledger) |
| Sound `sfx.chest` | `/sounds/board/chest.mp3` (Open treasure chest 8-bit, Freesound 519630 by mrthenoronha) | Supplied by the teacher, cleared for commercial use (ledger) |
| Sound `sfx.magnet` | `/sounds/board/magnet.mp3` (Jacob's ladder single zap, Freesound 19487 by halleck) | Supplied by the teacher, cleared for commercial use (ledger) |
| Sound `sfx.tap` | Classic tap (`public/sounds/tap.mp3`, Kenney Interface Sounds) | CC0 1.0 (ledger: Kenney Interface Sounds) |
| Sound `sfx.whoosh` | Classic whoosh (Casual SoundFX by Tim Beek) | CC BY 4.0, credited (ledger: Casual SoundFX) |
| Sound `sfx.wrong` | `/sounds/answers/boing.mp3` ("boing", Freesound 140867 by juskiddink) | Supplied by the teacher, cleared for commercial use (ledger) |
| Sounds made in code: `sfx.boing`, `sfx.cheer`, `sfx.coin`, `sfx.slideUp`, `sfx.thud`, `sfx.zap` | Web Audio tones in `src/lab/sfx.ts` | Original, owned (ledger "Sound effects ... Generated in code") |

Nothing here copies or imitates another platform's art, sounds or names.
