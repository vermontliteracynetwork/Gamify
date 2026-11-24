import { useMemo, useState, type CSSProperties } from 'react';
import { ArrowRight, CheckCircle, Circle, PencilSimple, WarningCircle } from '@phosphor-icons/react';
import { LAB_GAMES } from '../lab/registry';
import { PP } from './PaletteProposal';

// Approval (teacher, 2026-11-24: "have the design team update the /brand page
// ... so when i request a push and have everything be redesigned, i would have
// seen and approved everything already"). One row per live screen: where it
// lives, which /brand tab and view shows its redesign, and its status. Status
// starts Proposed everywhere; tapping a status cycles it on screen only (no
// saving yet). Approving every row here = approving the live rebuild.

export type BrandTab = 'style' | 'sounds' | 'direction' | 'views' | 'components' | 'games' | 'stickers' | 'icons' | 'teacher' | 'public' | 'more' | 'approval';
type Where = { tab: BrandTab; view: string; anchor?: string };
// `added`: first shown on /brand in this round (More screens), for the before/after count.
type Row = { area: string; screen: string; route: string; where: Where[]; added?: boolean; note?: string };

const TAB_NAME: Record<BrandTab, string> = {
  style: 'Style sheet', sounds: 'Sound board', direction: 'New direction', views: 'Universal views', components: 'Game components', games: 'Game mockups',
  stickers: 'Stickers', icons: 'Icons', teacher: 'Teacher portal', public: 'Public pages', more: 'More screens', approval: 'Approval',
};
const uv = (view: string): Where => ({ tab: 'views', view });
const tp = (n: string, view: string): Where => ({ tab: 'teacher', view, anchor: `tp-${n}` });
const pp = (id: string, view: string): Where => ({ tab: 'public', view, anchor: `pp-${id}` });
const ms = (id: string, view: string): Where => ({ tab: 'more', view, anchor: `ms-${id}` });
const gm = (id: string, view: string): Where => ({ tab: 'games', view, anchor: `gm-${id}` });

const ROWS: Row[] = [
  // ---------- Public ----------
  { area: 'Public', screen: 'Home', route: '/', where: [pp('home', 'Home')] },
  { area: 'Public', screen: 'Features', route: '/features', where: [pp('features', 'Features')] },
  { area: 'Public', screen: 'Pricing', route: '/pricing', where: [pp('pricing', 'Pricing')] },
  { area: 'Public', screen: 'Purchase order', route: '/pricing/purchase-order', where: [ms('form', 'Form page template')], added: true },
  { area: 'Public', screen: 'Research', route: '/research', where: [pp('research', 'Research')] },
  { area: 'Public', screen: 'Blog index', route: '/blog, /ways', where: [pp('blog', 'Blog index')] },
  { area: 'Public', screen: 'Blog post and How to play post', route: '/blog/:slug, /blog/how-to-play/:gameId', where: [pp('post', 'Blog post')] },
  { area: 'Public', screen: 'Theme guide', route: '/blog/themes/:gameId', where: [ms('guide', 'Theme guide')], added: true },
  { area: 'Public', screen: 'Printable templates', route: '/blog/themes/:gameId/print, /teacher/themes/:gameId/template', where: [ms('template', 'Printable template sheet')], added: true },
  { area: 'Public', screen: 'Themes gallery', route: '/themes', where: [pp('themes', 'Themes gallery')] },
  { area: 'Public', screen: 'Teacher log in and sign up', route: '/login', where: [pp('login', 'Log in'), pp('signup', 'Sign up')] },
  { area: 'Public', screen: 'Help Center and articles', route: '/help, /help/:topic', where: [ms('help', 'Help Center'), ms('helparticle', 'Help article')], added: true },
  { area: 'Public', screen: 'Top bar and footer', route: 'every public page', where: [pp('nav', 'Top bar and footer'), { tab: 'direction', view: '10. White site top bar', anchor: 'nd-topbar' }] },
  { area: 'Public', screen: 'FAQ', route: '/faq', where: [ms('info', 'Info page template')], added: true },
  { area: 'Public', screen: 'Schools, Homeschool, IT', route: '/schools, /homeschool, /it', where: [ms('info', 'Info page template')], added: true, note: 'One template; each page keeps its own words.' },
  { area: 'Public', screen: 'Status, Beta, Beta kit', route: '/status, /beta, /beta-kit', where: [ms('info', 'Info page template')], added: true },
  { area: 'Public', screen: 'Theme Building Challenge', route: '/challenge', where: [ms('info', 'Info page template')], added: true },
  { area: 'Public', screen: 'Permission slip', route: '/challenge/permission', where: [ms('form', 'Form page template')], added: true },
  { area: 'Public', screen: 'Legal: Privacy, Terms, Accessibility, Student data, Credits', route: '/privacy, /terms, /accessibility, /student-data, /credits', where: [ms('legal', 'Legal page')], added: true },
  { area: 'Public', screen: 'Accessibility conformance report', route: '/accessibility/report', where: [ms('legal', 'Legal page')], added: true },
  { area: 'Public', screen: 'Device check', route: '/check', where: [ms('check', 'Device check')], added: true },
  // ---------- Student ----------
  { area: 'Student', screen: 'Join with a code', route: '/join, /join/:code', where: [pp('join', 'Join'), uv('17. Student join')] },
  { area: 'Student', screen: 'Name pick', route: '/join/:code (class list)', where: [uv('18. Student name pick')] },
  { area: 'Student', screen: 'Live lobby (student)', route: '/live/:code', where: [uv('9a. Lobby: competitive'), uv('9b. Lobby: cooperative')] },
  { area: 'Student', screen: 'Share mirror', route: '/mirror/:code', where: [ms('mirror', 'Share mirror')], added: true },
  { area: 'Student', screen: 'Choice board', route: '/choose', where: [ms('choose', 'Choice board')], added: true },
  { area: 'Student', screen: 'Eyes up here', route: '/look-up', where: [ms('lookup', 'Eyes up here')], added: true },
  { area: 'Student', screen: 'Draw studio (student theme)', route: '/arcade/design', where: [ms('draw', 'Draw studio')], added: true },
  // ---------- Every game ----------
  { area: 'Every game', screen: 'Welcome', route: '/games/:id', where: [uv('1. Welcome')] },
  { area: 'Every game', screen: 'How will you play?', route: 'setup step 1', where: [uv('2a, 2b. How will you play?')] },
  { area: 'Every game', screen: 'Share a join code', route: 'setup', where: [uv('3. Share a join code')] },
  { area: 'Every game', screen: 'Question set picker', route: 'setup', where: [uv('4. Question set')] },
  { area: 'Every game', screen: 'Options', route: 'setup', where: [uv('5. Options')] },
  { area: 'Every game', screen: 'Teams and players', route: 'setup', where: [uv('6. Teams and players')] },
  { area: 'Every game', screen: 'Power-up setup', route: 'setup', where: [uv('7. Power-up setup')] },
  { area: 'Every game', screen: 'How the class plays (Live)', route: 'setup', where: [uv('8. How the class plays')] },
  { area: 'Every game', screen: 'Question screen', route: 'in play', where: [uv('10. Question screen')] },
  { area: 'Every game', screen: 'Top tracker, scoreboard, power-up cards', route: 'in play', where: [uv('11a, 11b, 12'), { tab: 'components', view: 'All parts' }] },
  { area: 'Every game', screen: 'Results and stickers', route: 'end of game', where: [uv('13, 13b. Results')] },
  { area: 'Every game', screen: 'Settings panel (Accessibility inside)', route: 'every screen', where: [uv('14. Settings and Calm'), ms('settings', 'Every tab')], added: true },
  { area: 'Every game', screen: 'Pause (default and teacher message)', route: 'Live', where: [uv('15a, 15b. Pause')] },
  { area: 'Every screen', screen: 'Loading', route: 'every lazy page', where: [ms('loading', 'Loading')], added: true },
  { area: 'Every screen', screen: 'Page not found', route: 'unknown links', where: [ms('404', 'Page not found')], added: true, note: 'No catch-all route exists yet; the rebuild adds one.' },
  { area: 'Every screen', screen: 'Something went wrong', route: 'error boundary', where: [ms('error', 'Something went wrong')], added: true },
  // ---------- Games (live on the home page) ----------
  { area: 'Games', screen: 'Game Show', route: '/games/game-show', where: [gm('game-show', 'Game Show')] },
  { area: 'Games', screen: 'Board Game', route: '/games/castle-quest', where: [gm('castle-quest', 'Board Game')] },
  { area: 'Games', screen: 'Match Three', route: '/games/match-three', where: [gm('match-three', 'Match Three')] },
  { area: 'Games', screen: 'Four in a Row', route: '/games/four-in-a-row', where: [gm('four-in-a-row', 'Four in a Row')] },
  { area: 'Games', screen: 'Bubble Pop', route: '/games/bubble-pop', where: [gm('bubble-pop', 'Bubble Pop')] },
  { area: 'Games', screen: 'Bowling', route: '/games/bowling', where: [gm('bowling', 'Bowling')] },
  { area: 'Games', screen: 'Question Tracker (class screen and student)', route: '/games/star-quiz, /teacher/live/:code', where: [gm('star-quiz', 'Question Tracker')] },
  { area: 'Games', screen: 'Territory', route: '/games/territory', where: [gm('territory', 'Territory')], note: 'Classic art is with the Art Director.' },
  // ---------- Game Lab ----------
  { area: 'Game Lab', screen: 'Game Lab index', route: '/lab', where: [ms('lab', 'Game Lab index')], added: true },
  { area: 'Game Lab', screen: 'A Lab game in Classic (the pattern)', route: '/games/lab/:id', where: [ms('labgame', 'Tic Tac Toe sample')], added: true, note: 'Classic art waits for the Art Director PASS.' },
  // ---------- Teacher ----------
  { area: 'Teacher', screen: 'Home and Get started', route: '/teacher (first run)', where: [tp('1', 'Dashboard home'), tp('9', 'First run and empty states')] },
  { area: 'Teacher', screen: 'Navigation and footer', route: 'every teacher page', where: [tp('2', 'Left rail')] },
  { area: 'Teacher', screen: 'Classes', route: '/teacher/classes', where: [tp('3a', 'Classes')] },
  { area: 'Teacher', screen: 'Class page', route: '/teacher/classes/:id', where: [tp('3b', 'Class page')] },
  { area: 'Teacher', screen: 'Student page', route: '/teacher/classes/:id/students/:sid', where: [tp('7c', 'One student')] },
  { area: 'Teacher', screen: 'Class check-in', route: '/teacher/classes/:id/check-in', where: [ms('checkin', 'Class check-in')], added: true },
  { area: 'Teacher', screen: 'Create an Activity', route: '/teacher/activity', where: [tp('4', 'Create an Activity')] },
  { area: 'Teacher', screen: 'Pick a game', route: '/play', where: [ms('pick', 'Pick a game')], added: true },
  { area: 'Teacher', screen: 'Live host and Class View', route: '/teacher/live/:code', where: [tp('5', 'Live class view')] },
  { area: 'Teacher', screen: 'Join code on the big screen', route: '/show/:code', where: [uv('9a. Lobby (code in a white pill)')] },
  { area: 'Teacher', screen: 'Question sets', route: '/teacher/sets', where: [tp('6a', 'Question sets')] },
  { area: 'Teacher', screen: 'Set editor', route: '/teacher/sets/:id, /teacher/library/:id', where: [tp('6b', 'Set editor')] },
  { area: 'Teacher', screen: 'Import a spreadsheet', route: '/teacher/sets/import', where: [ms('import', 'Import')], added: true },
  { area: 'Teacher', screen: 'Reports', route: '/teacher/reports', where: [tp('7a', 'Class overview'), tp('7b', 'One Activity'), tp('7d', 'Small group')] },
  { area: 'Teacher', screen: 'Report print', route: '/teacher/reports/print', where: [tp('7e', 'Print or PDF report')] },
  { area: 'Teacher', screen: 'Achievements (new page)', route: 'new', where: [tp('8', 'Achievements'), { tab: 'stickers', view: 'Stickers' }] },
  { area: 'Teacher', screen: 'Theme Builder', route: '/teacher/themes, /teacher/themes/:gameId', where: [ms('themebuilder', 'Theme Builder')], added: true },
  { area: 'Teacher', screen: 'Account', route: '/teacher/account', where: [ms('account', 'Account')], added: true },
  { area: 'Teacher', screen: 'Empty states', route: 'every list', where: [tp('9', 'First run'), ms('empty', 'Empty states')], added: true },
  // ---------- Owner ----------
  { area: 'Owner', screen: 'Owner desktop (kept plain)', route: '/owner', where: [ms('owner', 'Developer view')], added: true },
  { area: 'Owner', screen: 'Owner Theme Builder', route: '/owner/themes', where: [ms('themebuilder', 'Theme Builder')], added: true },
];

// Hidden games: their routes still exist, but they are off the site (her rules
// 2026-10-26, 10-31, 11-16), so no redesign is due before launch.
const HIDDEN = ['Memory Match', 'Match Up', 'Road Hop', 'Flashcards', 'Lunch Rush', 'Farm Grow', 'Pinball', 'Cast and Catch'];

type Status = 'Proposed' | 'Approved' | 'Changes asked';
const NEXT: Record<Status, Status> = { Proposed: 'Approved', Approved: 'Changes asked', 'Changes asked': 'Proposed' };
const LOOK: Record<Status, { bg: string; icon: typeof Circle }> = { Proposed: { bg: PP.butter, icon: Circle }, Approved: { bg: PP.mint, icon: CheckCircle }, 'Changes asked': { bg: PP.blush, icon: PencilSimple } };

const I = PP.ink;
const GY: CSSProperties = { fontFamily: 'var(--font-display)', fontWeight: 400, lineHeight: 1, textTransform: 'uppercase' };
const CARD: CSSProperties = { background: PP.paper, border: `2px solid ${I}`, borderRadius: 18, boxShadow: `0 3px 0 ${I}` };

export default function Coverage({ onGo }: { onGo: (tab: BrandTab, anchor?: string) => void }) {
  const [status, setStatus] = useState<Record<string, Status>>({});
  const shown = ROWS.filter((r) => r.where.length > 0).length;
  const before = ROWS.filter((r) => r.where.some((w) => w.tab !== 'more')).length;
  const counts = useMemo(() => ROWS.reduce((a, r) => { const s = status[r.screen] ?? 'Proposed'; a[s] += 1; return a; }, { Proposed: 0, Approved: 0, 'Changes asked': 0 } as Record<Status, number>), [status]);
  const areas = [...new Set(ROWS.map((r) => r.area))];
  return (
    <section className="grid gap-6" style={{ color: I }}>
      <header className="grid gap-3 justify-items-center text-center">
        <h2 className="m-0 text-[2.4rem]" style={GY}>Approval</h2>
        <p className="m-0 max-w-[48rem] font-semibold">Every live screen, where its redesign is on /brand, and its status. When every row is Approved, the push rebuilds the site to match exactly what you saw. Tap a status to try it (it is not saved yet).</p>
        <div className="flex flex-wrap justify-center gap-3">
          <span className="px-5 py-3 font-bold text-[1.15rem]" style={{ ...CARD, background: PP.lavender }}>{shown} of {ROWS.length} screens shown</span>
          <span className="px-5 py-3 font-bold" style={CARD}>Before this round: {before} of {ROWS.length}</span>
          {(Object.keys(counts) as Status[]).map((s) => <span key={s} className="px-4 py-3 font-bold" style={{ ...CARD, background: LOOK[s].bg }}>{s}: {counts[s]}</span>)}
        </div>
      </header>

      {areas.map((a) => (
        <section key={a} className="grid gap-2" aria-label={a}>
          <h3 className="m-0 font-heading font-bold text-[1.3rem]">{a}</h3>
          <div className="overflow-hidden" style={CARD}>
            <div className="hidden md:grid grid-cols-[1.3fr_1.3fr_1.6fr_10rem] gap-3 px-4 py-2 text-sm font-bold" style={{ background: PP.lavender, borderBottom: `2px solid ${I}` }}><span>Screen</span><span>Live route</span><span>Where on /brand</span><span>Status</span></div>
            {ROWS.filter((r) => r.area === a).map((r, i) => {
              const s = status[r.screen] ?? 'Proposed'; const L = LOOK[s]; const Ic = L.icon;
              return (
                <div key={r.screen} className="grid md:grid-cols-[1.3fr_1.3fr_1.6fr_10rem] gap-x-3 gap-y-1.5 px-4 py-3 items-center" style={{ borderTop: i ? '1px solid rgba(29,26,51,0.15)' : undefined }}>
                  <span className="font-bold leading-snug">{r.screen}{r.added && <span className="ml-2 text-xs px-2 py-0.5 rounded-full align-middle" style={{ background: PP.blueCrystal, border: `1.5px solid ${I}` }}>New this round</span>}</span>
                  <code className="text-[0.85rem] font-semibold break-words" style={{ color: PP.quiet }}>{r.route}</code>
                  <span className="flex flex-wrap gap-1.5 items-center">
                    {r.where.length ? r.where.map((w) => (
                      <button key={w.view + w.tab} type="button" onClick={() => onGo(w.tab, w.anchor)} className="min-h-9 px-3 rounded-full text-[0.85rem] font-bold inline-flex items-center gap-1 text-left" style={{ background: '#ffffff', border: `2px solid ${I}` }}>
                        {TAB_NAME[w.tab]}: {w.view}<ArrowRight weight="bold" size={13} />
                      </button>
                    )) : <span className="inline-flex items-center gap-1 font-bold" style={{ color: '#9b2c2c' }}><WarningCircle weight="bold" size={16} />Missing</span>}
                    {r.note && <span className="text-[0.8rem] font-semibold" style={{ color: PP.quiet }}>{r.note}</span>}
                  </span>
                  <button type="button" onClick={() => setStatus((m) => ({ ...m, [r.screen]: NEXT[s] }))} aria-label={`${r.screen}: ${s}. Tap to change`} className="min-h-11 px-3 rounded-full font-bold inline-flex items-center gap-1.5 justify-self-start" style={{ background: L.bg, border: `2px solid ${I}` }}><Ic weight="bold" size={16} />{s}</button>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <section className="grid gap-2">
        <h3 className="m-0 font-heading font-bold text-[1.3rem]">Game Lab games ({LAB_GAMES.length})</h3>
        <p className="m-0 font-semibold">Each follows the one Lab pattern on More screens (the Tic Tac Toe sample). Their own Classic boards wait, per your rule of 2026-11-23 (mockups cover the live games first). <button type="button" onClick={() => onGo('more', 'ms-labgame')} className="underline font-bold">See the pattern</button></p>
        <div className="flex flex-wrap gap-1.5">{LAB_GAMES.map((g) => <span key={g.id} className="px-3 py-1 rounded-full text-sm font-bold" style={{ background: PP.paper, border: `1.5px solid ${I}` }}>{g.name}</span>)}</div>
      </section>
      <section className="grid gap-2">
        <h3 className="m-0 font-heading font-bold text-[1.3rem]">Hidden games (off the site, no redesign due)</h3>
        <div className="flex flex-wrap gap-1.5">{HIDDEN.map((g) => <span key={g} className="px-3 py-1 rounded-full text-sm font-bold" style={{ background: '#e3e2ea', border: `1.5px solid ${I}` }}>{g}</span>)}</div>
      </section>
    </section>
  );
}
