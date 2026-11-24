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
    status: 'working', reportsTo: '', updated: '2026-11-24',
    workingOn: ['CEO Agent is live in the Developer Portal (CEO Agent): chat with it or ask a department with @marketing, @finance, @legal', 'Leads Finance, Operations, Technology, Marketing, People and Legal heads'],
    needsYou: [{ text: 'Add OPENROUTER_API_KEY in Vercel for stronger answers (free models work until then)' }],
  },
  {
    id: 'design-chair', name: 'Design Chair', role: 'Brand, voice, Brand Kit, sound, templates, social media', file: '.claude/agents/design-chair.md', color: '#c58ce8',
    status: 'working', updated: '2026-11-23', reportsTo: CEO_ID,
    workingOn: ['New direction: playful flat shapes for the site and Classic themes (from your moodboards)', 'Gamify Brand Kit doc and the live /brand page', 'Universal sound pack (sound board picks)', 'Piece templates and sizes for every game'],
    needsYou: [
      { text: 'Approve or change the Brand Kit: colors, fonts, icons, motion, template sizes', link: BRAND_KIT },
      { text: 'Pick sounds on the sound board and send your picks', link: '/brand' },
      { text: 'Add GIPHY_API_KEY and UNSPLASH_ACCESS_KEY in Vercel to switch on GIF and photo search' },
      { text: 'Decide the New direction: cream ground, outlines, cobalt button, fonts, buddies', link: '/brand' },
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
    id: 'vermont-business-advisor', name: 'Vermont Business Advisor', role: 'Vermont LLC law, filings, taxes, student data rules and school buying', file: '.claude/agents/vermont-business-advisor.md', color: '#2e8b57',
    status: 'working', updated: '2026-11-24', reportsTo: CEO_ID,
    workingOn: ['Vermont reminders on the CEO Agent page: forming the LLC, trade name, EIN, myVTax and sales tax, annual report, student privacy, breach plan, hiring, school buying', 'In the CEO Agent chat: @vermont_business_advisor'],
    needsYou: [{ text: 'Read the Vermont reminders and tell me which steps are already done', link: '/owner?s=ceo' }],
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
  {
    id: 'classic-art-director', name: 'Classic Art Director', role: 'Passes or fails every Classic theme asset on screenshots', file: '.claude/agents/classic-art-director.md', color: '#b4c4fb',
    status: 'waiting', updated: '2026-11-24', reportsTo: 'design-chair', workingOn: ['Territory: waiting for your uploaded cats and mice'], needsYou: [{ text: 'Upload the Territory cats and mice again (the pictures from your earlier chat are not in the project)' }],
  },
  {
    id: 'marketing-director', name: 'Marketing Director', role: 'Leads marketing; every post and ad waits for your OK in Marketing', file: '.claude/agents/marketing-director.md', color: '#f4a6a6',
    status: 'waiting', updated: '2026-11-24', reportsTo: CEO_ID, workingOn: ['December posts and two campaigns, drafted'], needsYou: [{ text: 'Review the posts waiting in Marketing', link: '/owner?s=marketing' }],
  },
  { id: 'brand-copywriter', name: 'Brand Copywriter', role: 'Captions, hooks, ad copy in one brand voice', file: '.claude/agents/brand-copywriter.md', color: '#fdfd94', status: 'idle', updated: '2026-11-24', reportsTo: 'marketing-director', workingOn: [], needsYou: [] },
  { id: 'social-planner', name: 'Social Planner', role: 'Content calendar for Instagram, Facebook, Pinterest, TikTok', file: '.claude/agents/social-planner.md', color: '#a7e3c9', status: 'idle', updated: '2026-11-24', reportsTo: 'marketing-director', workingOn: [], needsYou: [] },
  { id: 'ads-strategist', name: 'Ads Strategist', role: 'Google and Meta ads; proposes, you approve every dollar', file: '.claude/agents/ads-strategist.md', color: '#d6c8fb', status: 'idle', updated: '2026-11-24', reportsTo: 'marketing-director', workingOn: [], needsYou: [] },
  { id: 'trend-researcher', name: 'Trend Researcher', role: 'Trends, licensed sounds and what works for other brands', file: '.claude/agents/trend-researcher.md', color: '#f7b39a', status: 'idle', updated: '2026-11-24', reportsTo: 'marketing-director', workingOn: ['First monthly trend check due 2026-12-01'], needsYou: [] },
  { id: 'performance-analyst', name: 'Performance Analyst', role: 'Results, tests and every lesson learned', file: '.claude/agents/performance-analyst.md', color: '#b4c4fb', status: 'idle', updated: '2026-11-24', reportsTo: 'marketing-director', workingOn: [], needsYou: [] },
];
