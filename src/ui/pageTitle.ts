import { getGame } from '../games/registry';

// Each page gets its own browser tab title, so a teacher with many tabs (and
// a screen reader user arriving on a page) knows where they are.
const PAGES: [RegExp, string][] = [
  [/^\/$/, 'Classroom games from your own questions'],
  [/^\/features/, 'Features'],
  [/^\/pricing/, 'Plans and pricing'],
  [/^\/login/, 'Log in'],
  [/^\/it/, 'For school IT'],
  [/^\/help/, 'Help'],
  [/^\/ways/, 'Ways to use Gamify'],
  [/^\/research/, 'Research'],
  [/^\/beta-kit/, 'Beta classroom kit'],
  [/^\/join/, 'Join a game'],
  [/^\/show\//, 'Join code'],
  [/^\/play/, 'All games'],
  [/^\/arcade\/design/, 'Design a theme'],
  [/^\/arcade/, 'Arcade'],
  [/^\/teacher\/classes\/.+\/check-in/, 'Class check-in'],
  [/^\/teacher\/classes\/./, 'Class'],
  [/^\/teacher\/classes/, 'Classes'],
  [/^\/teacher\/sets\/import/, 'Import questions'],
  [/^\/teacher\/(sets|library)\/./, 'Question set'],
  [/^\/teacher\/sets/, 'Question sets'],
  [/^\/teacher\/reports/, 'Reports'],
  [/^\/teacher\/themes/, 'Theme Builder'],
  [/^\/teacher\/account/, 'Account'],
  [/^\/owner/, 'Owner'],
];

export function pageTitle(path: string): string {
  const game = path.match(/^\/games\/([a-z0-9-]+)/);
  const name = game ? getGame(game[1])?.name : PAGES.find(([re]) => re.test(path))?.[1];
  return name ? `${name} | Gamify` : 'Gamify';
}
