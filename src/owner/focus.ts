import { GAMES } from '../games/registry';

// The owner's saved checklists (owner, 2026-11-27: "I also want like more
// checklists that are saving and responsive. Like I want like final check for
// all of the games. I want before release. I want to approve all of the
// classic themes for each of the games, and I want to have 1 to 3 other
// themes of varying designs for each of the games. I will also need to make
// the training for the students. We will need to improve the help pages").
// The Chief of Staff agent keeps these lists current; ticks are hers only.
export interface FocusItem { id: string; label: string; to?: string }
export interface FocusList { id: string; title: string; why: string; items: FocusItem[] }

const perGame = (prefix: string, label: (name: string) => string, to: (id: string) => string): FocusItem[] => GAMES.map((g) => ({ id: `${prefix}:${g.id}`, label: label(g.name), to: to(g.id) }));

export const FOCUS_LISTS: FocusList[] = [
  { id: 'final', title: 'Final check before release', why: 'Play each game start to finish on iPad and laptop.', items: perGame('final', (n) => n, (id) => `/games/${id}`) },
  { id: 'classic', title: 'Approve each Classic theme', why: 'Look at the Classic look of each game and approve it.', items: perGame('classic', (n) => n, (id) => `/blog/themes/${id}`) },
  { id: 'extra', title: '1 to 3 more themes per game', why: 'Different styles and mediums: paint, collage, clay, found things, digital. Never for one grade.', items: GAMES.flatMap((g) => [1, 2, 3].map((k) => ({ id: `extra:${g.id}:${k}`, label: `${g.name}: theme ${k}${k > 1 ? ' (optional)' : ''}`, to: `/owner/themes/${g.id}` }))) },
  { id: 'training', title: 'Student training', why: 'What students learn on day one.', items: [
    { id: 'training:join', label: 'Joining with a code and tapping their name', to: '/beta-kit' },
    { id: 'training:play', label: 'Answering, power-ups and turns', to: '/blog' },
    { id: 'training:report', label: 'The Report button and the feedback faces', to: '/beta-kit' },
    { id: 'training:supports', label: 'Read-aloud, calm mode and bigger text', to: '/help' },
    { id: 'training:video', label: 'A short class video or slides', to: '/owner?s=marketing' },
  ] },
  { id: 'help', title: 'Help pages up to date', why: 'New design, buttons and words on every page.', items: [
    { id: 'help:start', label: 'Getting started', to: '/help' },
    { id: 'help:activity', label: 'Create an Activity', to: '/help' },
    { id: 'help:sets', label: 'Question sets and import', to: '/help' },
    { id: 'help:classes', label: 'Classes and sign-in', to: '/help' },
    { id: 'help:themes', label: 'Theme Builder (physical and digital)', to: '/help' },
    { id: 'help:live', label: 'Live view, Lock and reports', to: '/help' },
    { id: 'help:games', label: 'Each game\'s How to Play', to: '/help' },
    { id: 'help:plans', label: 'Plans and billing', to: '/help' },
  ] },
];
export const FOCUS_KEY = 'owner-focus-done';
