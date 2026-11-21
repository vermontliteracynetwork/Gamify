import { getGame } from '../games/registry';

// Each page gets its own browser tab title, so a teacher with many tabs (and
// a screen reader user arriving on a page) knows where they are.
const PAGES: [RegExp, string][] = [
  [/^\/$/, 'Classroom games from your own questions'],
  [/^\/features/, 'Features'],
  [/^\/pricing\/purchase-order/, 'School purchase order request'],
  [/^\/pricing/, 'Plans and pricing'],
  [/^\/login/, 'Log in'],
  [/^\/it/, 'For school IT'],
  [/^\/help/, 'Help Center'],
  [/^\/faq/, 'FAQ'],
  [/^\/(blog|ways)/, 'Blog'],
  [/^\/research/, 'Research'],
  [/^\/challenge\/permission/, 'Challenge permission slip'],
  [/^\/challenge/, 'Theme Building Challenge'],
  [/^\/beta-kit/, 'Beta classroom kit'],
  [/^\/privacy/, 'Privacy'],
  [/^\/terms/, 'Terms of Service'],
  [/^\/subprocessors/, 'Sub-processors'],
  [/^\/dpa/, 'Student data privacy agreement'],
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
  [/^\/teacher\/classes\/.+\/students\//, 'Student'],
  [/^\/teacher\/classes\/./, 'Class'],
  [/^\/teacher\/classes/, 'Classes'],
  [/^\/teacher\/sets\/import/, 'Import questions'],
  [/^\/teacher\/(sets|library)\/./, 'Question set'],
  [/^\/teacher\/sets/, 'Question sets'],
  [/^\/teacher\/reports\/print/, 'Progress report'],
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
  [/^\/look-up/, 'Teacher time'],
  [/^\/check/, 'Device check'],
];

export function pageName(path: string): string | undefined {
  return PAGES.find(([re]) => re.test(path))?.[1];
}

export function pageTitle(path: string): string {
  // Blank template pages save as gamify_print_<game> (teacher, 2026-11-20):
  // the print window names the PDF after the page title.
  const tpl = path.match(/\/themes\/([a-z0-9-]+)\/template$/) ?? path.match(/^\/blog\/themes\/([a-z0-9-]+)\/(?:print|template)$/);
  if (tpl) return `gamify_print_${tpl[1]}`;
  const game = path.match(/^\/games\/([a-z0-9-]+)/);
  const name = game ? getGame(game[1])?.name : pageName(path);
  return name ? `${name} | Gamify` : 'Gamify';
}

// A short description for search results and link previews (site QA,
// 2026-11-20). Public pages get their own; everything else the site's.
const DEFAULT_DESC = 'Gamify turns your own questions into classroom games your students ask to play: Game Show, Bowling, Board Game and more, on iPads, laptops and the big screen.';
const DESCRIPTIONS: [RegExp, string][] = [
  [/^\/features/, 'Every Gamify game, the Theme Builder your class designs with, live lobbies and reports, all built from the questions you already teach.'],
  [/^\/pricing\/purchase-order/, 'Schools and districts: request a Gamify quote or send a purchase order, with a signed student data privacy agreement.'],
  [/^\/pricing/, 'Start free. Plus and Pro unlock every game, class designs and live play. School quotes by email, no sales call.'],
  [/^\/schools/, 'Gamify for schools and districts: every teacher on Pro, one invoice, a signed student data privacy agreement.'],
  [/^\/homeschool/, 'Gamify for homeschool families and co-ops: every game for up to 10 students, with co-op codes for 25% off.'],
  [/^\/research/, 'What studies of practice questions and game-based learning found, and how Gamify puts it to work.'],
  [/^\/(faq|help)/, 'Answers and how-to guides for teachers using Gamify.'],
  [/^\/(blog|ways)/, 'Ideas for using Gamify in your classroom, one game at a time.'],
  [/^\/privacy/, 'What Gamify collects, why, and what it never does: no ads, no trackers, no selling data and no AI training on your content.'],
  [/^\/terms/, 'The Gamify Terms of Service in plain words: your content, plans and renewal, cancelling online and our limit of liability.'],
  [/^\/subprocessors/, 'The providers that help run Gamify and exactly what data each one receives.'],
  [/^\/dpa/, 'Schools and districts can sign a student data privacy agreement with Gamify before students play.'],
  [/^\/student-data/, 'What Gamify keeps about students (first names and game results only) and what it never does.'],
  [/^\/join/, 'Students: type the code your teacher gives you to join the game.'],
  [/^\/themes/, 'Themes for every Gamify game, made by Gamify and by classes.'],
];
export function pageDescription(path: string): string {
  return DESCRIPTIONS.find(([re]) => re.test(path))?.[1] ?? DEFAULT_DESC;
}
