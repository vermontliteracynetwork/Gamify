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
    { id: 'dock', label: 'Dock', width: 400, height: 380, hint: 'Where you stand to fish', color: '#b98552' },
    { id: 'rod', label: 'Fishing rod', width: 300, height: 300, hint: 'The rod, drawn from the handle (bottom left) to the tip (top right)', color: '#5b3a1e' },
    { id: 'sun', label: 'Sun', width: 160, height: 160, hint: 'The sun in the sky', color: '#fdfd94' },
    { id: 'cloud', label: 'Cloud', width: 320, height: 110, hint: 'A cloud that drifts across the sky', color: '#ffffff' },
    ...['Common', 'Uncommon', 'Rare', 'Legendary'].map((r) => ({ id: `fish-${r.toLowerCase()}`, label: `${r} fish`, width: 256, height: 160, hint: `Every ${r.toLowerCase()} fish you reel in, facing left` })),
    { id: 'cover', label: 'Cover', width: 600, height: 600, hint: 'The picture on the game card' },
  ],
  rounds: { label: 'Minutes', min: 1, max: 10, default: 3 },
  // Silly catches with power-ups (teacher, 2026-10-26): a boot, a rainbow fish...
  items: {
    label: 'Catches and power-ups', hint: 'Things you can reel in besides the fish. Give each one art and a power.', max: 8, width: 256, height: 256,
    abilities: [
      { id: 'points', label: 'Gives points', hint: 'Adds points to the score', amount: { label: 'Points', min: 10, max: 1000, step: 10, default: 100 } },
      { id: 'lose', label: 'Takes away points', hint: 'A silly catch that costs points', amount: { label: 'Points', min: 10, max: 500, step: 10, default: 100 } },
      { id: 'time', label: 'Adds time', hint: 'More seconds on the clock', amount: { label: 'Seconds', min: 5, max: 60, step: 5, default: 15 } },
      { id: 'double', label: 'Doubles the next catch', hint: 'The next catch is worth twice as much' },
      { id: 'mystery', label: 'Mystery', hint: 'A surprise: lose 50 or win up to 500 points' },
    ],
    classic: [
      { id: 'classic-rainbow-fish', name: 'Rainbow Fish', ability: 'points', amount: 500, motion: 'sparkle', often: 1, art: 'rainbow-fish' },
      { id: 'classic-boot', name: 'Old Boot', ability: 'lose', amount: 50, motion: 'bob', often: 2, art: 'boot' },
      { id: 'classic-watch', name: 'Pocket Watch', ability: 'time', amount: 15, motion: 'wiggle', often: 1, art: 'watch' },
      { id: 'classic-golden-hook', name: 'Golden Hook', ability: 'double', motion: 'sparkle', often: 1, art: 'golden-hook' },
      { id: 'classic-bottle', name: 'Message in a Bottle', ability: 'mystery', motion: 'bob', often: 1, art: 'bottle' },
    ],
  },
  hasCpu: false,
  borrowedFrom: 'Dashboard src/routes/student/FishingDock.tsx (Doc Fishing)',
};
