import type { GameManifest } from '../types';

// Kept apart from the game so the game list loads without loading every game.
export const farmGrowManifest: GameManifest = {
  id: 'farm-grow',
  name: 'Farm Grow',
  description: 'Answer questions to earn farm jobs, then plant, water and pick crops. Every night the watered ones grow.',
  modes: ['solo'],
  questionKinds: ['mc'],
  themePieces: [
    { id: 'background', label: 'Background', width: 1600, height: 1024, hint: 'The grass and sky around the field', color: '#bfe6a0' },
    { id: 'soil', label: 'Soil', width: 256, height: 256, hint: 'The color of a plot of dirt', color: '#b98a5e' },
    { id: 'sprout', label: 'Sprout', width: 256, height: 256, hint: 'A young plant, before it is ready' },
    { id: 'crop-corn', label: 'Corn', width: 256, height: 256, hint: 'Ripe corn, ready to pick' },
    { id: 'crop-pumpkin', label: 'Pumpkin', width: 256, height: 256, hint: 'A ripe pumpkin, ready to pick' },
    { id: 'crop-sunflower', label: 'Sunflower', width: 256, height: 256, hint: 'A sunflower in bloom' },
    { id: 'crop-tomato', label: 'Tomato', width: 256, height: 256, hint: 'Ripe tomatoes, ready to pick' },
    { id: 'barn', label: 'Barn', width: 400, height: 400, hint: 'The barn beside the field' },
    { id: 'cover', label: 'Cover', width: 600, height: 600, hint: 'The picture on the game card' },
  ],
  items: {
    label: 'Power-ups', hint: 'Sometimes a right answer brings one. Give each one art and a power.', max: 6, width: 256, height: 256,
    abilities: [
      { id: 'jobs', label: 'Extra jobs', hint: 'More farm jobs today', amount: { label: 'Jobs', min: 1, max: 6, step: 1, default: 2 } },
      { id: 'rain', label: 'Rain', hint: 'Waters every planted plot' },
      { id: 'bonus', label: 'Bonus points', hint: 'Points right away', amount: { label: 'Points', min: 1, max: 20, step: 1, default: 5 } },
    ],
    classic: [
      { id: 'classic-watering-can', name: 'Watering Can', ability: 'jobs', amount: 2, motion: 'bob', often: 2, art: 'watering-can' },
      { id: 'classic-rain-cloud', name: 'Rain Cloud', ability: 'rain', motion: 'bob', often: 1, art: 'rain-cloud' },
      { id: 'classic-prize-bag', name: 'Prize Bag', ability: 'bonus', amount: 5, motion: 'bob', often: 1, art: 'prize-bag' },
    ],
  },
  rounds: { label: 'Days', min: 4, max: 10, default: 6 },
  questionsPerBreak: { label: 'Questions each morning', min: 1, max: 4, default: 2 },
  hasCpu: false,
  borrowedFrom: 'Dashboard Farm Grow (logic only; art drawn in code)',
};
