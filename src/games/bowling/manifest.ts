import type { GameManifest } from '../types';

// Kept apart from the game so the game list loads without loading every game.
export const bowlingManifest: GameManifest = {
  id: 'bowling',
  name: 'Bowling',
  description: 'Answer right, aim, put some spin on it and send the ball crashing into the pins. Every roll is different!',
  modes: ['share', 'versus', 'solo'],
  questionKinds: ['mc'],
  themePieces: [
    { id: 'background', label: 'Background', width: 1000, height: 1300, hint: 'The alley wall behind the lane' },
    { id: 'lane', label: 'Lane', width: 800, height: 1000, hint: 'The color of the lane', color: '#e2b07a' },
    { id: 'pin', label: 'Pin', width: 64, height: 200, hint: 'One pin (a picture, or just its color)', color: '#fbfcf8' },
    // Up to 10 balls, each in a round frame; a player's ball is their icon
    // too (teacher, 2026-11-01). Balls left blank stay Classic.
    ...Array.from({ length: 10 }, (_, i) => ({ id: `ball-${i + 1}`, label: `Ball ${i + 1}`, width: 256, height: 256, hint: i === 0 ? 'A bowling ball. Each player picks a ball; it is the ball they roll and their icon' : `Bowling ball ${i + 1} (leave it blank to keep a Classic ball)` })),
    { id: 'cover', label: 'Cover', width: 600, height: 600, hint: 'The picture on the game card' },
    { id: 'title', label: 'Title', width: 1200, height: 360, hint: 'The theme name in your own lettering (shown on the theme card)' },
  ],
  rounds: { label: 'Frames', min: 1, max: 10, default: 3 },
  items: {
    label: 'Power-ups', hint: 'Sometimes a right answer brings one. Give each one art and a power.', max: 7, width: 256, height: 256,
    // Classic roles (teacher, 2026-10-31): held for the player's next turn,
    // shown under the scores, gone after that turn. Themes can redraw them.
    abilities: [
      { id: 'double', label: 'Double points', hint: 'The pins you knock down on your next roll count double.' },
      { id: 'magnet', label: 'Pin magnet', hint: 'Your next ball pulls nearby pins toward it, so more of them fall.' },
      { id: 'twister', label: 'Pin twister', hint: 'The pins shake and wobble right away; any that tip over count as your points.' },
      { id: 'bumpers', label: 'Bumper rails', hint: 'Rails pop up along both gutters, so your next roll cannot be a gutter ball.' },
      { id: 'mega', label: 'Mega ball', hint: 'Your next ball is twice as big, so it is much easier to hit lots of pins.' },
      { id: 'mystery', label: 'Mystery points', hint: 'A surprise: you get from 1 to 10 points right away.' },
      { id: 'swipe', label: 'Sneaky swipe', hint: 'Takes points from the team in first place and gives them to you.', amount: { label: 'Points', min: 1, max: 30, step: 1, default: 5 } },
      { id: 'bonus', label: 'Bonus points', hint: 'Adds points to your score right away.', amount: { label: 'Points', min: 1, max: 30, step: 1, default: 5 } },
    ],
    classic: [
      { id: 'classic-golden-pin', name: 'Golden Pin', ability: 'double', motion: 'sparkle', often: 2, art: 'golden-pin' },
      { id: 'classic-pin-magnet', name: 'Pin Magnet', ability: 'magnet', motion: 'wiggle', often: 2, image: '/classic/powerups/magnet.webp' },
      { id: 'classic-bumper-rails', name: 'Bumper Rails', ability: 'bumpers', motion: 'bob', often: 2, image: '/classic/powerups/shield.webp' },
      { id: 'classic-fireball', name: 'Fireball', ability: 'mega', motion: 'sparkle', often: 1, image: '/classic/powerups/fireball.webp' },
      { id: 'classic-pin-twister', name: 'Pin Twister', ability: 'twister', motion: 'spin', often: 2, image: '/classic/powerups/tornado.webp' },
      { id: 'classic-mystery-box', name: 'Mystery Box', ability: 'mystery', motion: 'bob', often: 2, image: '/classic/powerups/mystery.webp' },
      { id: 'classic-sneaky-swipe', name: 'Sneaky Swipe', ability: 'swipe', amount: 5, motion: 'wiggle', often: 1, image: '/classic/powerups/lightning.webp' },
    ],
  },
  hasCpu: true,
  borrowedFrom: 'Dashboard src/games/spaceBowling/logic.ts (Bowling), rebuilt flat',
};
