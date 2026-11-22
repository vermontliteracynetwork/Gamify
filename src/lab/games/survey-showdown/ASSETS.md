# Survey Showdown: assets

Every picture in this game (the Classic scene, characters, board pieces, power-up pictures and the cover) is drawn in code as SVG in `Game.tsx`, made from scratch for Gamify. No image files are copied into `public/lab/survey-showdown/`.

| Asset | Where it comes from | License (docs/asset-ledger.md) |
|---|---|---|
| All Classic art (SVG in `Game.tsx`) | Drawn in code for Gamify | Original, owned |
| UI icons (Phosphor: CheckCircle, HandTap, XasXIcon) | `@phosphor-icons/react` | MIT (ledger line "Phosphor Icons") |
| Motion (animation) | npm `motion` | MIT (ledger line "Motion") |
| Confetti (`ctx.burst`) | npm `canvas-confetti` | ISC (ledger line "canvas-confetti") |
| Grow Year and Inclusive Sans fonts | Already in the app | Ledger lines "Grow Year", "Inclusive Sans" (OFL 1.1) |
| Sound `sfx.bell` | `/sounds/pinball/score-bell.mp3` (Pinball sounds, score bell, Freesound 171073 by relwin; ledger: supplied by the teacher, cleared) | see source column |
| Sound `sfx.bump` | `/sounds/pinball/collision.mp3` (Pinball sounds, fast collision, Freesound 332056 by qubodup; ledger: supplied by the teacher, cleared) | see source column |
| Sound `sfx.whoosh` | Classic whoosh (`src/engine/feedback.ts`; Casual SoundFX by Tim Beek, CC BY 4.0, credited in the ledger) | see source column |
| Sound `sfx.wrong` | `/sounds/answers/boing.mp3` (Answer sounds, "boing", Freesound 140867 by juskiddink; ledger: supplied by the teacher, cleared for commercial use) | see source column |
| Sounds made in code: `sfx.boing`, `sfx.cheer`, `sfx.coin`, `sfx.crash`, `sfx.oops`, `sfx.slideUp`, `sfx.swish`, `sfx.thud`, `sfx.zap` | Web Audio tones in `src/lab/sfx.ts` | Original, owned (ledger line "Sound effects ... Generated in code") |

Nothing here imitates another platform's art, sounds or names.
