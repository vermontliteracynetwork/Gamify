// The Gamify agent team, shown on the developer dashboard's Team view
// (teacher, 2026-11-23: see every agent, what it is working on and what it
// needs from her; everything will report to a CEO agent later). Claude updates
// this list in the same change whenever an agent is added or its work moves.
// Agent definitions live in `.claude/agents/`.

export type AgentStatus = 'working' | 'waiting' | 'idle' | 'planned';
export interface AgentAsk { text: string; link?: string }
export interface TeamAgent {
  id: string;
  name: string;
  role: string;
  file?: string;
  color: string;
  status: AgentStatus;
  workingOn: string[];
  needsYou: AgentAsk[];
  reportsTo: string;
  updated: string;
}

export const CEO_ID = 'ceo';
const BRAND_KIT = 'https://claude.ai/artifact/MA3y9yQRzEKC8PEpDeenPv';

export const TEAM: TeamAgent[] = [
  {
    id: CEO_ID, name: 'CEO', role: 'Runs the whole team; every agent reports here', color: '#fdfd94',
    status: 'planned', workingOn: ['Not built yet: you will create the CEO agent'], needsYou: [], reportsTo: '', updated: '2026-11-23',
  },
  {
    id: 'design-chair', name: 'Design Chair', role: 'Brand, voice, Brand Kit, sound, templates, social media', file: '.claude/agents/design-chair.md', color: '#c58ce8',
    status: 'working', updated: '2026-11-23', reportsTo: CEO_ID,
    workingOn: ['New direction: playful flat shapes for the site and Classic themes (from your moodboards)', 'Gamify Brand Kit doc and the live /brand page', 'Universal sound pack (sound board picks)', 'Piece templates and sizes for every game'],
    needsYou: [
      { text: 'Approve or change the Brand Kit: colors, fonts, icons, motion, template sizes', link: BRAND_KIT },
      { text: 'Pick sounds on the sound board and send your picks', link: '/brand' },
      { text: 'Optional: a ScrapeCreators key for social media research' },
    ],
  },
  {
    id: 'claudia', name: 'Claudia', role: 'Chief game designer; reviews every game and feature', file: '.claude/agents/claudia.md', color: '#ef7d96',
    status: 'waiting', updated: '2026-11-23', reportsTo: CEO_ID,
    workingOn: ['Game Lab: 34 games signed off on the preview (/lab)', 'Golden Rule checks on every change'],
    needsYou: [
      { text: 'Play the Game Lab games and say which go to main', link: '/lab' },
      { text: 'Confirm guesses: Snakes and Ladders without square numbers, Word Search clues only, A to Z keyboards' },
    ],
  },
  {
    id: 'qa-tester', name: 'QA Tester', role: 'Tests every screen on iPad and laptop sizes', file: '.claude/agents/qa-tester.md', color: '#6aa9e9',
    status: 'idle', updated: '2026-11-23', reportsTo: CEO_ID, workingOn: [], needsYou: [],
  },
  {
    id: 'accessibility-specialist', name: 'Accessibility Specialist', role: 'WCAG and K-12 access checks', file: '.claude/agents/accessibility-specialist.md', color: '#5cc3a0',
    status: 'idle', updated: '2026-11-23', reportsTo: CEO_ID, workingOn: [], needsYou: [],
  },
  {
    id: 'economy-designer', name: 'Economy Designer', role: 'Points, power-ups and reward balance', file: '.claude/agents/economy-designer.md', color: '#f6c544',
    status: 'idle', updated: '2026-11-23', reportsTo: CEO_ID, workingOn: [], needsYou: [],
  },
  {
    id: 'sound-designer', name: 'Sound Designer', role: 'Sound plans for each game and theme', file: '.claude/agents/sound-designer.md', color: '#f39a6b',
    status: 'idle', updated: '2026-11-23', reportsTo: 'design-chair', workingOn: [], needsYou: [],
  },
];
