import type { GameManifest } from '../games/types';

// The big-screen look for share modes (teacher, 2026-10-26: "make sure there
// is a custom theme for the share screens"): the live lobby, the leaderboard
// and podium, and the game code screen. Designed in the Theme Builder like a
// game; the teacher picks it in the live lobby.
export const bigScreenManifest: GameManifest = {
  id: 'big-screen',
  name: 'Big screen',
  description: 'The lobby, leaderboard and winners screen the class sees on the projector.',
  modes: [],
  questionKinds: [],
  hasCpu: false,
  themePieces: [
    { id: 'background', label: 'Background', width: 1920, height: 1080, hint: 'Behind the lobby, leaderboard and winners' },
    { id: 'mascot', label: 'Lobby picture', width: 400, height: 400, hint: 'Waves hello next to the game code while students join' },
    { id: 'trophy', label: 'Winner trophy', width: 400, height: 400, hint: 'Over the first place spot on the podium' },
    { id: 'cover', label: 'Cover', width: 600, height: 600, hint: 'The picture on this design\'s card' },
  ],
};
