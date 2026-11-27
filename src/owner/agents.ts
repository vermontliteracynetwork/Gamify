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
    id: 'chief-of-staff', name: 'Chief of Staff', role: 'Executive functioning support: makes sure every urgent item gets done', file: '.claude/agents/chief-of-staff.md', color: '#f055a5',
    status: 'working', reportsTo: CEO_ID, updated: '2026-11-27',
    workingOn: ['The urgent three: pop-up when the portal opens, first on Do first', 'Your checklists: final game checks, Classic approvals, extra themes, student training, help pages'],
    needsYou: [{ text: 'Open Do first and tick each urgent item when it is done' }],
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
    id: 'affiliate-advisor', name: 'Affiliate Program Chair', role: 'Runs the affiliate program (owner, 2026-11-27): research, terms, terms, language, FTC and platform rules, vetting, payouts, expectations', file: '.claude/agents/affiliate-advisor.md', color: '#f7c873',
    status: 'waiting', updated: '2026-11-25', reportsTo: CEO_ID,
    workingOn: ['Researched 20 affiliate programs (13 education or family): docs/affiliate-research.md', 'Affiliate program built: /affiliates apply page, referral links and codes, Affiliates page in the Developer Portal, payouts into Books', 'Plan and vetting checklist: docs/affiliate-program.md', 'In the CEO Agent chat: @affiliate_advisor'],
    needsYou: [{ text: 'Pick the commission after the research (recommended: 25% of the first 12 months, never lifetime)', link: '/owner?s=affiliates' }, { text: 'Turn on Stripe Connect for payouts once Stripe is live (you chose Stripe, 2026-11-27)' }],
  },
  {
    id: 'astrology-advisor', name: 'Astrology Advisor', role: 'Private: your natal chart and real planetary timing turned into career and money advice for Gamify', file: '.claude/agents/astrology-advisor.md', color: '#8c7ae6',
    status: 'working', updated: '2026-11-25', reportsTo: CEO_ID,
    workingOn: ['Astrology page in the Developer Portal: your chart, strengths, watch-outs and 2026 to 2028 timing', 'In the CEO Agent chat: @astrology_advisor'],
    needsYou: [{ text: 'Confirm your birth time (11:22 am) is from a birth certificate: the houses and rising sign depend on it', link: '/owner?s=astro' }],
  },
  {
    id: 'beta-lead', name: 'Beta Lead', role: 'Runs the beta test: invites, onboarding, weekly upkeep, review and the launch decision', file: '.claude/agents/beta-lead.md', color: '#f28c5b',
    status: 'working', updated: '2026-11-24', reportsTo: CEO_ID,
    workingOn: ['Beta Test Plan written from your answers (dev plan doc tab): Pro free, every game tested, a question set and a theme from every tester, short forms', 'Built: /beta updated, tester checklist, Beta form after each game, three-face rating with a comment, Beta test page on /owner', 'In the CEO Agent chat: @beta_lead'],
    needsYou: [{ text: 'Set the ready-to-launch bar and the open calls in the Beta Test Plan tab', link: 'https://claude.ai/artifact/P8kwMjDCq1E2yCa8VaMSpj' }],
    // Beta plan decisions: dev plan doc, Beta Test Plan tab; docs/teacher-preferences.md (2026-11-24).
  },
  {
    id: 'playtest-lead', name: 'Playtest Lead', role: 'Plays every game in a real browser as a K-3 student, a gamer and a teacher, at every size', file: '.claude/agents/playtest-lead.md', color: '#4f6bd8',
    status: 'idle', updated: '2026-11-24', reportsTo: CEO_ID, workingOn: ['Ready: plays games through the Playwright browser tool before beta waves and after game changes'], needsYou: [],
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
    id: 'theme-reviewer', name: 'Theme Reviewer', role: 'Reviews every community theme before it goes public; recommends strikes', file: '.claude/agents/theme-reviewer.md', color: '#a7e3c9',
    status: 'waiting', updated: '2026-11-26', reportsTo: 'design-chair', workingOn: ['Draft community theme guidelines and 3-strike rules (docs/community-theme-guidelines.md)'], needsYou: [{ text: 'Approve the theme guidelines and strike rules before they go public' }],
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
