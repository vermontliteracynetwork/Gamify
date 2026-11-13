import type { GameManifest } from '../types';

// Kept apart from the game so the game list loads without loading every game.
// Pinball replaced Peg Drop (teacher, 2026-10-31).
export const pinballManifest: GameManifest = {
  id: 'pinball',
  name: 'Pinball',
  description: 'Answer right, aim through a zone, fill the power bar and shoot the ball into a pocket of points.',
  modes: ['share', 'versus', 'solo'],
  questionKinds: ['mc'],
  themePieces: [
    { id: 'background', label: 'Background', width: 1600, height: 1200, hint: 'Behind the table' },
    { id: 'board', label: 'Table', width: 1000, height: 1300, hint: 'The pinball table', color: '#314677' },
    { id: 'ball', label: 'Ball', width: 128, height: 128, hint: 'The pinball', color: '#e7ecf5' },
    { id: 'pocket', label: 'Pocket', width: 128, height: 128, hint: 'A scoring pocket (its points show on top)', color: '#fdfd94' },
    { id: 'bumper', label: 'Bumper', width: 128, height: 128, hint: 'The round bumpers that light up', color: '#f2735f' },
    { id: 'flipper', label: 'Flipper', width: 256, height: 96, hint: 'The two flippers by the launcher', color: '#fdfd94' },
    ...Array.from({ length: 10 }, (_, i) => ({ id: `team-${i + 1}`, label: `Team ${i + 1} icon`, width: 256, height: 256, hint: `The round badge for team ${i + 1}` })),
    { id: 'cover', label: 'Cover', width: 600, height: 600, hint: 'The picture on the game card' },
    { id: 'title', label: 'Title', width: 1200, height: 360, hint: 'The theme name in your own lettering (shown on the theme card)' },
  ],
  rounds: { label: 'Rounds', min: 1, max: 10, default: 5 },
  items: {
    label: 'Power-ups', hint: 'Sometimes a right answer brings one. Give each one art and a power.', max: 6, width: 256, height: 256,
    // Classic roles (teacher, 2026-10-31): a theme can redraw and rename each
    // item, but its role stays. Held for the player's next turn.
    abilities: [
      { id: 'double', label: 'Double points', hint: 'The pocket your next ball lands in scores double.' },
      { id: 'super', label: 'Sure shot', hint: 'Your next ball always lands in a scoring pocket, never down the drain.' },
      { id: 'magnet', label: 'Jackpot magnet', hint: 'Your next ball rolls straight to the biggest pocket.' },
      { id: 'bounce', label: 'Bounce bonus', hint: 'Your next ball earns 10 extra points for every bumper or wall it bounces off.' },
      { id: 'mystery', label: 'Mystery points', hint: 'A surprise: you get from 10 to 100 points right away.' },
      { id: 'swipe', label: 'Sneaky swipe', hint: 'Takes points from the player in first place and gives them to you.', amount: { label: 'Points', min: 10, max: 100, step: 10, default: 30 } },
      { id: 'bonus', label: 'Bonus points', hint: 'Adds points to your score right away.', amount: { label: 'Points', min: 10, max: 200, step: 10, default: 50 } },
    ],
    classic: [
      { id: 'classic-golden-ball', name: 'Golden Ball', ability: 'double', motion: 'sparkle', often: 2, art: 'golden-ball' },
      { id: 'classic-super-shooter', name: 'Super Shooter', ability: 'super', motion: 'sparkle', often: 2, art: 'super-shooter' },
      { id: 'classic-jackpot-magnet', name: 'Jackpot Magnet', ability: 'magnet', motion: 'wiggle', often: 1, art: 'magnet' },
      { id: 'classic-bouncy-ball', name: 'Bouncy Ball', ability: 'bounce', motion: 'bob', often: 2, art: 'extra-ball' },
      { id: 'classic-mystery-bottle', name: 'Mystery Bottle', ability: 'mystery', motion: 'bob', often: 1, art: 'bottle' },
      { id: 'classic-sneaky-swipe', name: 'Sneaky Swipe', ability: 'swipe', amount: 30, motion: 'wiggle', often: 1, art: 'swap-arrows' },
    ],
  },
  hasCpu: true,
  borrowedFrom: 'New (teacher design, 2026-10-31); replaces Peg Drop',
};
