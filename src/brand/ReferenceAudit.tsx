import type { ReactNode } from 'react';
import { ArrowRight, Check, Lightbulb, MagnifyingGlass, Sparkle, SquaresFour, UserPlus } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';

// The design reference audit (queue 40, owner 2026-11-26): onboarding against
// Duolingo, the Home, Features and Pricing layouts against Stripe, the
// dashboards against Notion, set and theme search against Airbnb, motion
// against Apple and Framer. Findings come here as mockups first; nothing live
// changes until the owner says yes to each one. Patterns only, never copied
// (CLAUDE.md: no other company's look or assets ship).

interface Finding {
  id: string;
  icon: Icon;
  area: string;
  pattern: string;
  now: string;
  change: string[];
  why: string;
  before: ReactNode;
  after: ReactNode;
}

const box = 'rounded-[0.6rem] border-2 border-[#1d1a33] bg-white';
const line = (w: string, dark = false) => <span className="block h-2 rounded-full" style={{ width: w, background: dark ? '#1d1a33' : '#d4d4d8' }} />;
const field = <span className={`${box} block h-6`} />;
const btn = (label: string, yellow = true) => <span className={`${box} block text-center text-[0.65rem] font-bold py-1 ${yellow ? '!bg-[#fdfd94]' : ''}`}>{label}</span>;

const FINDINGS: Finding[] = [
  {
    id: 'onboarding', icon: UserPlus, area: 'Sign-up and the welcome screen',
    pattern: 'Duolingo: a first win before the account, then one question per screen.',
    now: 'Sign-up asks for 5 fields plus a referral code before a teacher sees anything. The welcome screen then shows two full plan cards, 10 lines and 3 buttons at once.',
    change: [
      'Sign-up: email and password only. The username comes from the email and can be changed in Account; one password box with a Show button instead of Confirm.',
      'The referral code hides behind "Have a code?" (a link from a friend fills it in anyway).',
      'Welcome: one big "Start my free week" button, then "See Plus and Pro" as a small link. The plan cards move to that link.',
      'Before sign-up, a "Try a game in 30 seconds" button plays a ready-made set on Game Show, then asks to save it.',
    ],
    why: 'Each extra form field lowers how many people finish (Baymard Institute form research); Hick\'s law: more choices on one screen, slower decisions. A first success early raises follow-through (goal-gradient effect).',
    before: <div className="grid gap-1.5">{field}{field}{field}{field}{field}{btn('Create my free account')}</div>,
    after: <div className="grid gap-1.5">{field}{field}<span className="text-[0.6rem] font-bold underline">Have a code?</span>{btn('Start free')}{btn('Try a game first', false)}</div>,
  },
  {
    id: 'pricing', icon: SquaresFour, area: 'Home, Features and Pricing',
    pattern: 'Stripe: one message per section, real product pictures, the same left edge all the way down.',
    now: 'Strong already. Two gaps: the welcome screen shows $6.40 without the Player One Sale stacked (Pricing shows $5.60), and on a first visit Home and Features showed a blank white screen for about a second while their page code loaded (timed on the test machine).',
    change: [
      'Welcome plan cards use the same stacked price as Pricing (struck price, the sale line, the total).',
      'While a page loads, show the menu bar and the periwinkle background with a soft placeholder, never plain white.',
      'Load the Home page code with the first visit, so the front door never waits.',
    ],
    why: 'The same price in two places is a trust signal (consistency, Nielsen heuristic 4). Google\'s Core Web Vitals call a page "good" when its biggest content paints within 2.5 seconds, and a blank screen reads as broken to a first-time visitor.',
    before: <div className="grid gap-1.5">{line('40%', true)}{line('70%')}<span className="flex gap-1.5"><span className={`${box} flex-1 h-10`} /><span className={`${box} flex-1 h-10`} /></span></div>,
    after: <div className="grid gap-1.5">{line('40%', true)}{line('70%')}<span className="flex gap-1.5"><span className={`${box} flex-1 h-10 grid content-center px-1 gap-1`}>{line('50%')}{line('70%', true)}</span><span className={`${box} flex-1 h-10`} /></span></div>,
  },
  {
    id: 'dashboards', icon: Sparkle, area: 'Teacher Home and the Developer Portal',
    pattern: 'Notion: a calm side menu in short groups, one clear next step, empty pages that say what to do.',
    now: 'The portal now has grouped menus, cards and icon empty states. Teacher Home shows the first-day steps, three dashed empty cards and the Get started chip at once, so the next step competes with five other things.',
    change: [
      'Teacher Home: the next step is the only filled button; the three empty cards turn into one short line each until the teacher has a class.',
      'The Get started chip in the side menu hides once the steps card is on screen.',
    ],
    why: 'One primary action per screen speeds the first task (Fitts and Hick together); progress shown in one place, not two, avoids split attention (Sweller, cognitive load).',
    before: <div className="grid grid-cols-[1fr_0.8fr] gap-1.5"><span className={`${box} h-16`} /><span className="grid gap-1"><span className={`${box} h-4 border-dashed`} /><span className={`${box} h-4 border-dashed`} /><span className={`${box} h-4 border-dashed`} /></span></div>,
    after: <div className="grid gap-1.5"><span className={`${box} h-12 grid content-center px-2 gap-1`}>{line('60%', true)}{btn('Do this next')}</span>{line('50%')}{line('45%')}</div>,
  },
  {
    id: 'search', icon: MagnifyingGlass, area: 'Question set and theme search',
    pattern: 'Airbnb: a row of picture chips for the main filter, a live result count, and one Filters button that opens a sheet on phones.',
    now: 'Themes: a search box and two dropdowns (game, sort). Question sets: a filter column on the left. Both work, but a teacher has to open a dropdown to see which games exist.',
    change: [
      'Themes: a scrolling row of game chips (each game\'s cover, tiny) above the cards; tap one to filter. Sort stays a dropdown.',
      'Both pages show "24 themes" or "12 sets" next to the search as you type.',
      'On phones, the question set filters fold into one Filters button with a sheet.',
    ],
    why: 'Recognition over recall (Nielsen heuristic 6): showing the choices beats making people remember them. Live counts give feedback on every change (heuristic 1).',
    before: <div className="grid gap-1.5"><span className="flex gap-1.5"><span className={`${box} flex-[2] h-5`} /><span className={`${box} flex-1 h-5`} /><span className={`${box} flex-1 h-5`} /></span><span className="grid grid-cols-3 gap-1.5"><span className={`${box} h-8`} /><span className={`${box} h-8`} /><span className={`${box} h-8`} /></span></div>,
    after: <div className="grid gap-1.5"><span className="flex gap-1">{['#f055a5', '#22b04a', '#4ba3e8', '#fabe37', '#6a45f0'].map((c) => <span key={c} className="w-5 h-5 rounded-full border-2 border-[#1d1a33]" style={{ background: c }} />)}<span className="ml-auto text-[0.6rem] font-bold">24 themes</span></span><span className="grid grid-cols-3 gap-1.5"><span className={`${box} h-8`} /><span className={`${box} h-8`} /><span className={`${box} h-8`} /></span></div>,
  },
  {
    id: 'motion', icon: Lightbulb, area: 'Motion',
    pattern: 'Apple and Framer: short, springy moves on menus (about 0.2 to 0.3 seconds), a small stagger when a list arrives, nothing that makes you wait.',
    now: 'Games have rich motion (that stays). Shared moves exist in src/ui/motion, but menu pages still write their own entrances (Features, Beta and Welcome each move differently), and some pages have none.',
    change: [
      'One shared menu entrance from src/ui/motion: 0.25 seconds, 40 ms stagger, used on every teacher and public page.',
      'Nothing on a menu waits for an animation before it can be read or tapped.',
      'Calm motion keeps fading only, as now.',
    ],
    why: 'Feedback under about 0.1 second feels instant and under 1 second keeps the flow (Nielsen, response time limits); one shared timing reads as one product.',
    before: <div className="grid gap-1.5">{line('80%')}{line('60%')}<span className="text-[0.6rem] font-bold">Each page its own</span></div>,
    after: <div className="grid gap-1.5">{line('80%', true)}{line('60%', true)}<span className="text-[0.6rem] font-bold">One shared move</span></div>,
  },
];

export default function ReferenceAudit() {
  return (
    <div className="grid gap-6">
      <section className="grid gap-2">
        <h2 className="font-heading text-2xl">Design Reference Audit</h2>
        <p className="font-semibold max-w-3xl">Five findings from comparing Gamify with the sites you named. Each one is a mockup only. Say yes or no to each and only the yeses get built. Fixed already during the audit: the welcome screen said "Free: one list of 0" and "the last 1 days", and the upgrade box said Plus unlocks every game (Free plays every game now).</p>
      </section>
      <ol className="grid gap-5 list-none m-0 p-0">
        {FINDINGS.map((f, i) => (
          <li key={f.id} id={`audit-${f.id}`} className="bg-surface border-bold border-border rounded-panel p-5 grid gap-4" style={{ boxShadow: 'var(--shadow-sticker)' }}>
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full grid place-items-center bg-butter border-std border-border font-bold" aria-hidden="true">{i + 1}</span>
              <f.icon size={24} weight="bold" aria-hidden="true" />
              <h3 className="font-heading text-xl m-0">{f.area}</h3>
            </div>
            <p className="m-0 font-semibold"><b>The pattern:</b> {f.pattern}</p>
            <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4">
              <div className="grid gap-3 content-start">
                <p className="m-0"><b>Gamify now:</b> {f.now}</p>
                <div className="grid gap-1.5"><b>The change</b>
                  <ul className="m-0 p-0 list-none grid gap-1.5">{f.change.map((c) => <li key={c} className="flex gap-2"><Check weight="bold" size={18} className="shrink-0 mt-0.5" aria-hidden="true" />{c}</li>)}</ul>
                </div>
                <p className="m-0 text-sm font-semibold text-muted"><b>Why:</b> {f.why}</p>
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3" aria-label={`${f.area}: now and the change, as a sketch`} role="img">
                <div className="grid gap-1.5"><span className="text-xs font-bold uppercase tracking-wide text-muted">Now</span><div className="rounded-[0.9rem] border-2 border-dashed border-[#1d1a33] p-3 bg-[#f4f4f5]">{f.before}</div></div>
                <ArrowRight weight="bold" size={22} aria-hidden="true" />
                <div className="grid gap-1.5"><span className="text-xs font-bold uppercase tracking-wide text-muted">Change</span><div className="rounded-[0.9rem] border-2 border-[#1d1a33] p-3 bg-[#fffbe0]">{f.after}</div></div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
