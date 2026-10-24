import type { GameManifest } from '../types';

// Kept apart from the game so the game list loads without loading every game.
export const castCatchManifest: GameManifest = {
  id: 'cast-catch',
  name: 'Cast and Catch',
  description: 'Cast your line, answer while the bobber floats, then reel in a fish. Rarer fish for better casts!',
  modes: ['live', 'solo'],
  questionKinds: ['mc'],
  themePieces: [
    { id: 'background', label: 'Water', width: 1600, height: 1000, hint: 'The lake or sea you fish in' },
    { id: 'bobber', label: 'Bobber', width: 128, height: 128, hint: 'The float on the end of the line', color: '#e5635f' },
    { id: 'cover', label: 'Cover', width: 600, height: 600, hint: 'The picture on the game card' },
  ],
  rounds: { label: 'Minutes', min: 1, max: 10, default: 3 },
  hasCpu: false,
  borrowedFrom: 'Dashboard src/routes/student/FishingDock.tsx (Doc Fishing)',
};
