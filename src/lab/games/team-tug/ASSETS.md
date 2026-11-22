# Team Tug: assets

Every picture in this game (the Classic scene, characters, board pieces, power-up pictures and the cover) is drawn in code as SVG in `Game.tsx`, made from scratch for Gamify. No image files are copied into `public/lab/team-tug/`.

| Asset | Where it comes from | License (docs/asset-ledger.md) |
|---|---|---|
| All Classic art (SVG in `Game.tsx`) | Drawn in code for Gamify | Original, owned |
| UI icons (Phosphor: CheckCircle, Flag, HandGrabbing) | `@phosphor-icons/react` | MIT (ledger line "Phosphor Icons") |
| Motion (animation) | npm `motion` | MIT (ledger line "Motion") |
| Confetti (`ctx.burst`) | npm `canvas-confetti` | ISC (ledger line "canvas-confetti") |
| Grow Year and Inclusive Sans fonts | Already in the app | Ledger lines "Grow Year", "Inclusive Sans" (OFL 1.1) |
| Sound `sfx.jump` | `/sounds/board/jump.mp3` (jump_c_04, Freesound 350906 by cabled_mess; ledger: supplied by the teacher, cleared) | see source column |
| Sound `sfx.magnet` | `/sounds/board/magnet.mp3` (Jacob's ladder single zap, Freesound 19487 by halleck; ledger: teacher checked, cleared for commercial use) | see source column |
| Sound `sfx.splash` | `/sounds/cast-catch/splash.mp3` (Cast and Catch sounds; ledger: supplied by the teacher, cleared) | see source column |
| Sound `sfx.whoosh` | Classic whoosh (`src/engine/feedback.ts`; Casual SoundFX by Tim Beek, CC BY 4.0, credited in the ledger) | see source column |
| Sound `sfx.wind` | `/sounds/board/wind.mp3` (Wind pattern loop, Freesound 749370 by selectdetail57; ledger: teacher checked, cleared for commercial use) | see source column |
| Sound `sfx.wrong` | `/sounds/answers/boing.mp3` (Answer sounds, "boing", Freesound 140867 by juskiddink; ledger: supplied by the teacher, cleared for commercial use) | see source column |
| Sounds made in code: `sfx.boing`, `sfx.cheer`, `sfx.kick`, `sfx.slideDown`, `sfx.slideUp`, `sfx.swish`, `sfx.thud` | Web Audio tones in `src/lab/sfx.ts` | Original, owned (ledger line "Sound effects ... Generated in code") |

Nothing here imitates another platform's art, sounds or names.
