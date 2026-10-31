import { getGame } from '../games/registry';

// Each page gets its own browser tab title, so a teacher with many tabs (and
// a screen reader user arriving on a page) knows where they are.
const PAGES: [RegExp, string][] = [
  [/^\/$/, 'Classroom games from your own questions'],
  [/^\/features/, 'Features'],
  [/^\/pricing/, 'Plans and pricing'],
  [/^\/login/, 'Log in'],
  [/^\/it/, 'For school IT'],
  [/^\/help/, 'How-to guides'],
  [/^\/faq/, 'Help Center'],
  [/^\/(blog|ways)/, 'Blog'],
  [/^\/research/, 'Research'],
  [/^\/challenge\/permission/, 'Challenge permission slip'],
  [/^\/challenge/, 'Theme Building Challenge'],
  [/^\/beta-kit/, 'Beta classroom kit'],
  [/^\/privacy/, 'Privacy'],
  [/^\/terms/, 'Terms of Service'],
  [/^\/accessibility\/report/, 'Accessibility conformance report'],
  [/^\/accessibility/, 'Accessibility'],
  [/^\/status/, 'Status'],
  [/^\/credits/, 'Credits and attributions'],
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
  [/^\/teacher\/activity/, 'Create an Activity'],
  [/^\/schools/, 'For schools'],
  [/^\/homeschool/, 'For homeschool'],
  [/^\/student-data/, 'Student data promise'],
  [/^\/themes/, 'Themes'],
  [/^\/beta$/, 'Join the beta test'],
  [/^\/owner/, 'Owner'],
];

export function pageName(path: string): string | undefined {
  return PAGES.find(([re]) => re.test(path))?.[1];
}

export function pageTitle(path: string): string {
  const game = path.match(/^\/games\/([a-z0-9-]+)/);
  const name = game ? getGame(game[1])?.name : pageName(path);
  return name ? `${name} | Gamify` : 'Gamify';
}
