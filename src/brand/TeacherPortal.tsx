import type { CSSProperties, ReactNode } from 'react';
import {
  ArrowCounterClockwise, ArrowRight, Broadcast, CalendarBlank, ChartBar, ChatCircleText, Check, CheckCircle, Clock, Copy, DownloadSimple,
  EyeSlash, GameController, House, Info, Lightbulb, LinkSimple, LockSimple, MagnifyingGlass, Microphone, Palette, Pause, PencilSimple, Plus,
  Printer, Snowflake, Stack, Sticker as StickerIcon, Stop, Student, Target, TrendDown, TrendUp, UserCircle, UsersThree, Warning,
} from '@phosphor-icons/react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts';
import { AXIS, ChartContainer } from '../ui/chart';
import { PP } from './PaletteProposal';
import { Laptop } from './UniversalViews';
import { STARTER, StickerArt } from './Stickers';

// Teacher portal (PROPOSAL, teacher 2026-11-23: "i also want mockups for the
// teacher portal. we need to make sure that the teacher portal elements are
// high quality, easy to direct, clear dashboard, thrurough and detailed
// reports so the gameplay is informative"). A redesign of the real teacher
// pages (src/teacher/*, TeacherNav, LiveHost monitor, reports.ts fields):
// laptop first, 1440 x 900, one clear thing per card, every chart with a
// plain takeaway and a next step. Example data only; nothing here is wired to
// a live page.

const I = PP.ink;
const Q = PP.quiet;
const GY: CSSProperties = { fontFamily: 'var(--font-display)', fontWeight: 400, lineHeight: 1 };
// One flat card: a single 2px ink outline and the normal sticker shadow. No washi tape and no
// stacked or offset paper layers (teacher, 2026-11-23: "the attatched tape, multilayer card is an
// example of something i do not like and need immediately removed").
const CARD: CSSProperties = { background: PP.paper, borderRadius: 18, border: `2px solid ${I}`, boxShadow: `0 3px 0 ${I}` };
const NAMES = ['Ava', 'Ben', 'Carmen', 'Dev', 'Elle', 'Finn', 'Grace', 'Hugo', 'Isla', 'Jamal', 'Kai', 'Lena', 'Milo', 'Nora', 'Omar', 'Priya', 'Quinn', 'Rosa', 'Sam', 'Theo', 'Uma', 'Vic', 'Wren', 'Zoe'];
const SKIN = [PP.gamify, PP.blueCrystal, PP.blush, PP.butter, PP.mint, PP.peach, PP.aqua, PP.lavender, PP.sage];

// ---------- parts ----------
function Btn({ children, main, small }: { children: ReactNode; main?: boolean; small?: boolean }) {
  return (
    <span className={`${small ? 'h-9 px-3.5 text-[14px]' : 'h-11 px-5 text-[15px]'} rounded-full font-bold inline-flex items-center gap-2 whitespace-nowrap shrink-0`}
      style={{ background: main ? PP.periwinkle : PP.paper, color: I, border: `2px solid ${I}`, boxShadow: `0 3px 0 ${main ? PP.grapeDeep : I}` }}>{children}</span>
  );
}
function Tip({ text }: { text: string }) {
  return <span title={text} aria-label={text} className="inline-grid place-items-center align-middle" style={{ color: Q }}><Info weight="bold" size={15} /></span>;
}
function Chip({ children, bg = PP.cream, strong }: { children: ReactNode; bg?: string; strong?: boolean }) {
  return <span className={`h-7 px-2.5 rounded-full text-[13px] ${strong ? 'font-bold' : 'font-semibold'} inline-flex items-center gap-1.5 whitespace-nowrap`} style={{ background: bg }}>{children}</span>;
}
function Card({ title, tip, right, children, className = '', style, pad = 18 }: { title?: ReactNode; tip?: string; right?: ReactNode; children: ReactNode; className?: string; style?: CSSProperties; pad?: number }) {
  return (
    <section className={`flex flex-col min-h-0 ${className}`} style={{ ...CARD, padding: pad, ...style }}>
      {title && <header className="flex items-center gap-2 mb-2.5"><h3 className="font-heading font-bold text-[16px] m-0">{title}</h3>{tip && <Tip text={tip} />}<span className="flex-1" />{right}</header>}
      {children}
    </section>
  );
}
// The plain-language takeaway plus one next step, under every chart.
function Takeaway({ text, action, icon, stack }: { text: string; action: string; icon?: ReactNode; stack?: boolean }) {
  return (
    <div className={`mt-auto flex ${stack ? 'flex-wrap' : ''} items-center gap-3 rounded-[12px] px-3 py-2`} style={{ background: PP.butter }}>
      <Lightbulb weight="bold" size={18} className="shrink-0" />
      <p className="m-0 flex-1 min-w-0 text-[14px] font-bold leading-snug">{text}</p>
      <Btn small main>{icon ?? <ArrowRight weight="bold" size={16} />}{action}</Btn>
    </div>
  );
}
function Avatar({ name, size = 30, i = 0 }: { name: string; size?: number; i?: number }) {
  return <span className="rounded-full grid place-items-center font-bold shrink-0" style={{ width: size, height: size, background: SKIN[i % SKIN.length], fontSize: size * 0.42 }}>{name[0]}</span>;
}
function Stat({ label, value, delta, tip, bg = PP.paper }: { label: string; value: string; delta?: string; tip?: string; bg?: string }) {
  const up = delta?.startsWith('+');
  return (
    <div className="rounded-[14px] px-4 py-3 grid gap-0.5" style={{ background: bg }}>
      <span className="text-[13px] font-bold flex items-center gap-1" style={{ color: Q }}>{label}{tip && <Tip text={tip} />}</span>
      <span className="flex items-baseline gap-2"><b className="text-[28px] leading-none font-heading">{value}</b>
        {delta && <span className="text-[13px] font-bold inline-flex items-center gap-0.5" style={{ color: up ? '#15703a' : '#9b2c2c' }}>{up ? <TrendUp weight="bold" size={14} /> : <TrendDown weight="bold" size={14} />}{delta}</span>}</span>
    </div>
  );
}
function Meter({ pct, color = PP.periwinkle, w = 120 }: { pct: number; color?: string; w?: number }) {
  return <span className="inline-block h-2.5 rounded-full overflow-hidden align-middle" style={{ width: w, background: PP.cream }}><span className="block h-full rounded-full" style={{ width: `${pct}%`, background: color }} /></span>;
}
function Proposal() {
  return <span className="text-[12px] font-bold px-2 py-0.5 rounded-full" style={{ background: PP.butter, border: `2px solid ${I}` }}>Proposal</span>;
}

// ---------- the shell: a left rail (chosen over top tabs, see view 2) ----------
type NavId = 'home' | 'classes' | 'activities' | 'sets' | 'reports' | 'achievements' | 'themes' | 'account';
const NAV: { id: NavId; label: string; icon: typeof House }[] = [
  { id: 'home', label: 'Home', icon: House }, { id: 'classes', label: 'Classes', icon: UsersThree }, { id: 'activities', label: 'Activities', icon: GameController },
  { id: 'sets', label: 'Question sets', icon: Stack }, { id: 'reports', label: 'Reports', icon: ChartBar }, { id: 'achievements', label: 'Achievements', icon: StickerIcon },
  { id: 'themes', label: 'Themes', icon: Palette }, { id: 'account', label: 'Account', icon: UserCircle },
];
function Rail({ active, live }: { active: NavId; live?: boolean }) {
  return (
    <nav aria-label="Teacher pages" className="w-[232px] shrink-0 h-full flex flex-col gap-1.5 px-4 py-5" style={{ background: PP.paper, borderRight: '1px solid rgba(29,26,51,0.1)' }}>
      <img src="/brand/gamify-wordmark.png" alt="Gamify" className="h-10 w-auto self-start mb-3" draggable="false" />
      <span className="h-12 rounded-full font-bold inline-flex items-center justify-center gap-2 text-[15px] mb-3" style={{ background: PP.periwinkle, border: `2px solid ${I}`, boxShadow: `0 3px 0 ${PP.grapeDeep}` }}><Plus weight="bold" size={18} />Create an Activity</span>
      {NAV.map((n) => {
        const on = n.id === active;
        const Ic = n.icon;
        return (
          <span key={n.id} aria-current={on ? 'page' : undefined} className="h-11 px-3 rounded-[12px] inline-flex items-center gap-3 text-[15px] font-bold" style={on ? { background: PP.gamify, boxShadow: `inset 4px 0 0 ${PP.grape}` } : { color: I }}>
            <Ic weight="bold" size={20} />{n.label}
            {n.id === 'activities' && live && <span className="ml-auto h-6 px-2 rounded-full text-[12px] inline-flex items-center gap-1" style={{ background: PP.mint }}><Broadcast weight="bold" size={12} />Live</span>}
          </span>
        );
      })}
      <span className="flex-1" />
      <div className="rounded-[14px] p-3 grid gap-1 text-[13px] font-semibold" style={{ background: PP.cream }}>
        <b>Room 12, Grade 2</b><span style={{ color: Q }}>24 students</span><span className="font-bold inline-flex items-center gap-1" style={{ color: PP.grapeDeep }}>Switch class<ArrowRight weight="bold" size={13} /></span>
      </div>
    </nav>
  );
}
function Shell({ active, title, sub, actions, children, live, crumb }: { active: NavId; title: string; sub?: string; actions?: ReactNode; children: ReactNode; live?: boolean; crumb?: string }) {
  return (
    <div className="w-full h-full flex text-[15px]" style={{ background: PP.cream, color: I, fontFamily: 'var(--font-heading)' }}>
      <Rail active={active} live={live} />
      <main className="flex-1 min-w-0 h-full flex flex-col gap-4 px-8 py-5">
        <header className="flex items-center gap-4 min-h-[60px] shrink-0">
          <div className="grid gap-1 min-w-0 flex-1">
            {crumb && <span className="text-[13px] font-bold" style={{ color: Q }}>{crumb}</span>}
            <h1 className="m-0 text-[32px] whitespace-nowrap overflow-hidden text-ellipsis" style={GY}>{title}</h1>
            {sub && <span className="text-[14px] font-semibold truncate" style={{ color: Q }}>{sub}</span>}
          </div>
          {actions}
          <span className="h-10 w-[150px] shrink-0 rounded-full px-3 inline-flex items-center gap-2 text-[14px] font-semibold" style={{ background: PP.paper, border: '2px solid rgba(29,26,51,0.18)', color: Q }}><MagnifyingGlass weight="bold" size={16} />Search</span>
        </header>
        <div className="flex-1 min-h-0">{children}</div>
      </main>
    </div>
  );
}

// ---------- example data (made up, like exampleReport.ts) ----------
const WEEKS = [{ w: 'Oct 26', right: 61, first: 48 }, { w: 'Nov 2', right: 66, first: 53 }, { w: 'Nov 9', right: 70, first: 58 }, { w: 'Nov 16', right: 74, first: 64 }, { w: 'Nov 23', right: 79, first: 72 }];
const SKILLS = [
  { code: 'L.1.2a', name: 'Capital letters for names', pct: 91 }, { code: 'L.1.2b', name: 'End punctuation', pct: 84 },
  { code: 'L.2.1d', name: 'Past tense verbs', pct: 73 }, { code: 'L.2.2c', name: 'Apostrophes', pct: 62 }, { code: 'L.1.2c', name: 'Commas in a list', pct: 44 },
];
const QS = [88, 82, 79, 41, 85, 70, 64, 90, 58, 76].map((pct, i) => ({ q: `Q${i + 1}`, pct }));
const DAYS = [{ d: 'Mon', m: 32 }, { d: 'Tue', m: 18 }, { d: 'Wed', m: 41 }, { d: 'Thu', m: 0 }, { d: 'Fri', m: 57 }];
const skillColor = (p: number) => (p >= 80 ? PP.kelly : p >= 60 ? PP.lemon : PP.pink);

// ---------- 1. Dashboard home ----------
function Home() {
  return (
    <Shell active="home" title="Good morning" sub="Monday, November 23">
      <div className="h-full grid gap-4" style={{ gridTemplateColumns: '1fr 1fr 340px', gridTemplateRows: '212px 250px 1fr' }}>
        <Card className="col-span-2" style={{ background: PP.gamify }} pad={22}>
          <span className="text-[13px] font-bold uppercase tracking-wider" style={{ color: PP.grapeDeep }}>Today&apos;s next step</span>
          <p className="m-0 mt-2 text-[24px] font-bold leading-snug max-w-[620px]">12 students missed commas in a list on Friday. A 5 minute reteach game is ready.</p>
          <div className="mt-auto flex gap-3 items-center"><Btn main><ArrowCounterClockwise weight="bold" size={18} />Start the reteach Activity</Btn><Btn><ChartBar weight="bold" size={18} />See Friday&apos;s report</Btn><span className="text-[13px] font-semibold" style={{ color: Q }}>Same game, the 6 comma questions, only the 12 students</span></div>
        </Card>
        <Card title="Quick start" pad={16}>
          <div className="grid gap-1.5">
            {[[Broadcast, 'Play live on the big screen'], [LinkSimple, 'Share a code'], [CalendarBlank, 'Send as homework'], [ArrowCounterClockwise, 'Play Friday\'s Activity again']].map(([Ic, l]) => {
              const C = Ic as typeof House;
              return <span key={l as string} className="h-[29px] rounded-[10px] px-2 inline-flex items-center gap-2.5 text-[14px] font-bold" style={{ background: PP.cream }}><C weight="bold" size={17} />{l as string}<ArrowRight weight="bold" size={14} className="ml-auto" /></span>;
            })}
          </div>
        </Card>
        <Card title="Class snapshot" tip="This week, Room 12. Right on first try counts a question right only when the first answer was right." className="col-span-2">
          <div className="grid grid-cols-4 gap-3">
            <Stat label="Right on first try" value="72%" delta="+8" bg={PP.cream} />
            <Stat label="Played this week" value="22 of 24" bg={PP.cream} />
            <Stat label="Minutes playing" value="148" delta="+21" bg={PP.cream} />
            <Stat label="Remembered a week later" value="81%" tip="Questions answered right, then right again 7 or more days later." bg={PP.cream} />
          </div>
          <div className="mt-2 flex-1 min-h-0 grid grid-cols-[1fr_260px] gap-4 items-center">
            <ChartContainer label="Right on first try rose from 48 percent to 72 percent over five weeks" height={92} config={{ first: { label: 'Right on first try', color: PP.grape } }}>
              <LineChart data={WEEKS} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <XAxis dataKey="w" {...AXIS} /><YAxis domain={[40, 80]} {...AXIS} ticks={[40, 60, 80]} />
                <Line dataKey="first" stroke="var(--color-first)" strokeWidth={3} dot={{ r: 4, fill: PP.paper, strokeWidth: 2.5 }} isAnimationActive={false} />
              </LineChart>
            </ChartContainer>
            <p className="m-0 text-[14px] font-bold leading-snug flex gap-2"><Lightbulb weight="bold" size={18} className="shrink-0" />First-try answers are up 24 points in five weeks. Commas in a list is the one skill still under 50%.</p>
          </div>
        </Card>
        <Card title="Needs attention" tip="Only you see this list. It never shows on a student screen or the big screen." className="row-span-2">
          <ul className="list-none m-0 p-0 grid gap-2">
            {[
              [Warning, PP.blush, 'Q4 commas in a list', '12 of 22 missed it', 'Reteach'],
              [Target, PP.peach, 'Omar, Hugo, Rosa, Theo', 'Under 50% on apostrophes', 'Make a group'],
              [Clock, PP.blueCrystal, 'Quinn', 'Has not played in 9 days', 'Send a code'],
              [CalendarBlank, PP.butter, 'Homework due Wednesday', '6 not started yet', 'Remind'],
              [CheckCircle, PP.mint, 'Ava, Ben, Carmen, Dev, Elle', 'Mastered end punctuation', 'Challenge set'],
            ].map(([Ic, bg, a, b, act]) => {
              const C = Ic as typeof House;
              return (
                <li key={a as string} className="rounded-[12px] p-2.5 grid grid-cols-[32px_1fr] gap-x-2.5 gap-y-1.5 items-center" style={{ background: bg as string }}>
                  <span className="w-8 h-8 rounded-full grid place-items-center" style={{ background: PP.paper }}><C weight="bold" size={17} /></span>
                  <span className="grid leading-tight"><b className="text-[14px]">{a as string}</b><span className="text-[13px] font-semibold" style={{ color: Q }}>{b as string}</span></span>
                  <span /><span className="justify-self-start"><Btn small>{act as string}<ArrowRight weight="bold" size={14} /></Btn></span>
                </li>
              );
            })}
          </ul>
        </Card>
        <Card title="Recent Activities" right={<span className="text-[14px] font-bold" style={{ color: PP.grapeDeep }}>All Activities</span>} className="col-span-2" pad={16}>
          <table className="w-full text-[14px] border-collapse">
            <thead><tr className="text-left text-[13px]" style={{ color: Q }}>{['Activity', 'How', 'When', 'Players', 'Right on first try', ''].map((h) => <th key={h} className="font-bold pb-1.5">{h}</th>)}</tr></thead>
            <tbody>
              {[['Commas and capitals, Game Show', 'Live', 'Fri Nov 20', '22', 58], ['Past tense verbs, Bowling', 'Homework', 'Thu Nov 19', '19 of 24', 74], ['Apostrophes, Board Game', 'Share', 'Wed Nov 18', '4 teams', 63]].map(([a, h, w, p, pct]) => (
                <tr key={a as string} style={{ borderTop: '1px solid rgba(29,26,51,0.08)' }}>
                  <td className="py-2 font-bold">{a}</td><td><Chip>{h}</Chip></td><td className="font-semibold">{w}</td><td className="font-semibold">{p}</td>
                  <td><span className="inline-flex items-center gap-2"><Meter pct={pct as number} color={skillColor(pct as number)} w={90} /><b>{pct}%</b></span></td>
                  <td className="text-right"><Btn small>Report</Btn></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </Shell>
  );
}

// ---------- 2. Navigation ----------
function Navigation() {
  const MAP: [NavId, string[]][] = [
    ['home', ['Today\'s next step', 'Needs attention', 'Recent Activities']], ['classes', ['Each class', 'Roster and groups', 'Each student page']],
    ['activities', ['Create an Activity', 'Live class view', 'Codes and homework']], ['sets', ['My sets', 'Public sets', 'Set editor', 'Import a spreadsheet']],
    ['reports', ['Class overview', 'One Activity', 'One student', 'Small group', 'Print or PDF']], ['achievements', ['Sticker collections', 'Show on the big screen']],
    ['themes', ['Theme studio', 'Class gallery']], ['account', ['Plan', 'Teacher PIN', 'Privacy']],
  ];
  return (
    <Shell active="home" title="Every page, one click" sub="The left rail is the whole map">
      <div className="h-full grid grid-cols-[1fr_360px] gap-4">
        <div className="grid grid-cols-2 gap-3 content-start">
          {MAP.map(([id, pages]) => {
            const n = NAV.find((x) => x.id === id)!;
            const Ic = n.icon;
            return (
              <Card key={id} pad={14}>
                <div className="flex items-center gap-2.5"><span className="w-10 h-10 rounded-full grid place-items-center" style={{ background: PP.gamify }}><Ic weight="bold" size={20} /></span><b className="text-[17px]">{n.label}</b></div>
                <div className="flex flex-wrap gap-1.5 mt-2.5">{pages.map((p) => <Chip key={p}>{p}</Chip>)}</div>
              </Card>
            );
          })}
        </div>
        <div className="grid gap-4 content-start">
          <Card title="Why a left rail" style={{ background: PP.gamify }}>
            <ul className="m-0 pl-5 grid gap-1.5 text-[14px] font-semibold leading-snug">
              <li>8 places fit as one column with words always showing; today&apos;s 5 top tabs are already full.</li>
              <li>Laptops have spare width, not spare height: the rail costs no vertical room, so reports fit above the fold.</li>
              <li>Create an Activity sits at the top on every page: the most-used task is never more than one click away.</li>
              <li>The class switcher lives at the bottom of the rail, so every page answers &quot;which class am I looking at?&quot;</li>
            </ul>
          </Card>
          <Card title="Keyboard">
            <div className="grid gap-1.5 text-[14px] font-semibold">
              {[['Tab', 'Moves down the rail, then into the page'], ['/', 'Jumps to search'], ['N', 'Create an Activity']].map(([k, v]) => <span key={k} className="flex items-center gap-3"><kbd className="min-w-9 h-8 px-2 rounded-[8px] grid place-items-center font-bold" style={{ background: PP.cream, border: `2px solid ${I}` }}>{k}</kbd>{v}</span>)}
            </div>
          </Card>
          <Card title="On a short window">
            <p className="m-0 text-[14px] font-semibold leading-snug">Under 1100 px wide the rail folds to 72 px icons with hover names; the page keeps its full width.</p>
          </Card>
        </div>
      </div>
    </Shell>
  );
}

// ---------- 3. Classes and a Class page ----------
function Classes() {
  const CLASSES = [
    { name: 'Room 12, Grade 2', n: 24, last: 'Today', pct: 72, kids: NAMES.slice(0, 24) },
    { name: 'Reading group, Grades 1 to 3', n: 6, last: 'Fri Nov 20', pct: 64, kids: ['Hugo', 'Omar', 'Rosa', 'Theo', 'Lena', 'Vic'] },
    { name: 'Room 14, Grade 3', n: 22, last: 'Thu Nov 19', pct: 81, kids: ['Abby', 'Bo', 'Cruz', 'Dina', 'Eli', 'Faye', 'Gus', 'Hana', 'Ivy', 'Jo'] },
  ];
  return (
    <Shell active="classes" title="Classes" actions={<Btn main><Plus weight="bold" size={18} />Add a class</Btn>}>
      <div className="grid grid-cols-3 gap-4 content-start">
        {CLASSES.map((c, ci) => (
          <Card key={c.name} pad={20} style={{ borderTop: `8px solid ${[PP.periwinkle, PP.sky, PP.pink][ci]}` }}>
            <b className="text-[20px]">{c.name}</b>
            <span className="text-[14px] font-semibold" style={{ color: Q }}>{c.n} students, last played {c.last}</span>
            <div className="flex flex-wrap gap-1 mt-3">{c.kids.slice(0, 14).map((k, i) => <Chip key={k} bg={SKIN[i % SKIN.length]}>{k}</Chip>)}{c.kids.length > 14 && <Chip strong>+{c.kids.length - 14} more</Chip>}</div>
            <div className="mt-4 flex items-center gap-3"><span className="text-[13px] font-bold" style={{ color: Q }}>Right on first try</span><Meter pct={c.pct} color={skillColor(c.pct)} /><b>{c.pct}%</b></div>
            <div className="mt-4 flex gap-2"><Btn small main>Open class<ArrowRight weight="bold" size={14} /></Btn><Btn small><Printer weight="bold" size={14} />Progress report</Btn></div>
          </Card>
        ))}
        <div className="rounded-[18px] grid place-items-center text-center p-6 gap-2" style={{ border: `2.5px dashed ${Q}`, minHeight: 250 }}>
          <span className="w-12 h-12 rounded-full grid place-items-center" style={{ background: PP.paper, border: `2px solid ${I}` }}><Plus weight="bold" size={22} /></span>
          <b>Add a class</b><span className="text-[14px] font-semibold" style={{ color: Q }}>Paste names from a spreadsheet, one per line.</span>
        </div>
      </div>
    </Shell>
  );
}
function ClassView() {
  const rows = NAMES.slice(0, 11);
  const sup = ['Read aloud', '3 tries', '', 'Read aloud', '', '', 'Calm', '', '', '2 tries', ''];
  const pct = [94, 90, 86, 83, 80, 78, 75, 47, 71, 69, 66];
  return (
    <Shell active="classes" crumb="Classes" title="Room 12, Grade 2" actions={<><Btn><Printer weight="bold" size={18} />Progress report</Btn><Btn main><Plus weight="bold" size={18} />Create an Activity</Btn></>}>
      <div className="h-full flex flex-col gap-3">
        <div className="flex gap-1.5">{['Students', 'Groups', 'Report', 'Assigned sets', 'Ways to play'].map((t, i) => <span key={t} className="h-10 px-4 rounded-full font-bold text-[14px] inline-flex items-center" style={i === 0 ? { background: PP.gamify, border: `2px solid ${I}` } : { background: PP.paper }}>{t}</span>)}</div>
        <div className="flex-1 min-h-0 grid grid-cols-[1fr_350px] gap-4">
          <Card title="24 students" tip="Students sign in by tapping their picture, then a 4 digit PIN. No email, no last names needed." right={<Btn small><Plus weight="bold" size={14} />Add students</Btn>} pad={16}>
            <table className="w-full text-[14px] border-collapse">
              <thead><tr className="text-left text-[13px]" style={{ color: Q }}>{['Student', 'PIN', 'Supports', 'Last played', 'Right on first try', 'Trend', ''].map((h) => <th key={h} className="font-bold pb-1.5">{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((n, i) => (
                  <tr key={n} style={{ borderTop: '1px solid rgba(29,26,51,0.08)' }}>
                    <td className="py-[7px]"><span className="inline-flex items-center gap-2.5 font-bold"><Avatar name={n} i={i} />{n}</span></td>
                    <td className="font-bold tracking-widest" style={{ color: Q }}>....</td>
                    <td>{sup[i] && <Chip bg={PP.blueCrystal}>{sup[i]}</Chip>}</td>
                    <td className="font-semibold">{i === 7 ? 'Nov 14' : i % 3 ? 'Today' : 'Fri'}</td>
                    <td><span className="inline-flex items-center gap-2"><Meter pct={pct[i]} color={skillColor(pct[i])} w={80} /><b>{pct[i]}%</b></span></td>
                    <td>{i === 7 ? <TrendDown weight="bold" size={18} color="#9b2c2c" /> : <TrendUp weight="bold" size={18} color="#15703a" />}</td>
                    <td className="text-right"><span className="font-bold text-[14px]" style={{ color: PP.grapeDeep }}>Open</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <span className="mt-auto pt-2 text-[13px] font-bold" style={{ color: Q }}>Showing 11 of 24, sorted by name</span>
          </Card>
          <div className="grid gap-3 content-start">
            <div className="rounded-[18px] p-4 grid gap-2" style={{ border: `2.5px dashed ${Q}` }}>
              <b className="text-[15px] flex items-center gap-2"><Lightbulb weight="bold" size={18} />Suggested from reports</b>
              <span className="text-[14px] font-semibold leading-snug">Omar, Hugo, Rosa and Theo are under 50% on apostrophes (L.2.2c).</span>
              <span className="flex gap-2"><Btn small main><UsersThree weight="bold" size={14} />Make this group</Btn><Btn small>Not now</Btn></span>
            </div>
            <Card title="Groups" tip="Groups are yours to name. Students never see group names." right={<Btn small><Plus weight="bold" size={14} />New group</Btn>}>
              <div className="grid gap-2">
                {[['Commas practice', ['Hugo', 'Omar', 'Rosa', 'Theo'], PP.blush], ['Reading support', ['Lena', 'Milo', 'Vic'], PP.blueCrystal], ['Ready for a challenge', ['Ava', 'Ben', 'Carmen', 'Dev', 'Elle'], PP.mint]].map(([g, kids, bg]) => (
                  <div key={g as string} className="rounded-[12px] p-3 grid gap-2" style={{ background: bg as string }}>
                    <div className="flex items-center"><b className="text-[15px]">{g as string}</b><span className="ml-auto text-[13px] font-bold">{(kids as string[]).length} students</span></div>
                    <div className="flex gap-1">{(kids as string[]).map((k, i) => <Avatar key={k} name={k} i={i + 3} size={28} />)}</div>
                    <div className="flex gap-2"><Btn small>Assign a set</Btn><Btn small>Group report</Btn></div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Shell>
  );
}

// ---------- 4. Create an Activity ----------
function CreateActivity() {
  const STEPS = ['Who', 'How', 'Game', 'Questions', 'Start'];
  return (
    <Shell active="activities" crumb="Activities" title="Create an Activity">
      <div className="h-full grid grid-cols-[300px_1fr] gap-4">
        <Card title="Your choices">
          <ol className="list-none m-0 p-0 grid gap-2">
            {[['Who', 'Room 12, Commas practice group (4)'], ['How', 'Live: big screen plus their own devices'], ['Game', 'Game Show'], ['Questions', 'Commas in a list, 6 questions']].map(([k, v]) => (
              <li key={k} className="rounded-[12px] p-3 grid gap-0.5" style={{ background: PP.cream }}>
                <span className="flex items-center gap-2 text-[13px] font-bold" style={{ color: Q }}><span className="w-5 h-5 rounded-full grid place-items-center" style={{ background: PP.kelly }}><Check weight="bold" size={12} /></span>{k}<span className="ml-auto" style={{ color: PP.grapeDeep }}>Change</span></span>
                <b className="text-[15px] leading-snug">{v}</b>
              </li>
            ))}
          </ol>
          <div className="mt-4 grid gap-2"><b className="text-[13px]" style={{ color: Q }}>Who plays</b><div className="flex flex-wrap gap-2">{['Hugo', 'Omar', 'Rosa', 'Theo'].map((k, i) => <span key={k} className="h-9 pl-1 pr-3 rounded-full inline-flex items-center gap-2 font-bold text-[14px]" style={{ background: PP.cream }}><Avatar name={k} i={i + 3} size={28} />{k}</span>)}</div></div>
          <div className="mt-auto rounded-[12px] p-3 text-[13px] font-semibold leading-snug" style={{ background: PP.blueCrystal }}>Supports carry over: Omar hears every question read aloud, Hugo gets 3 tries.</div>
        </Card>
        <div className="flex flex-col gap-4 min-h-0">
          <ol aria-label="Steps" className="list-none m-0 p-0 grid grid-cols-5 gap-2">
            {STEPS.map((s, i) => (
              <li key={s} aria-current={i === 4 ? 'step' : undefined} className="h-12 rounded-full inline-flex items-center justify-center gap-2 font-bold text-[15px]" style={i === 4 ? { background: PP.lemon, border: `2px solid ${I}` } : { background: PP.paper }}>
                {i < 4 ? <span className="w-6 h-6 rounded-full grid place-items-center" style={{ background: PP.kelly }}><Check weight="bold" size={14} /></span> : <span className="w-6 h-6 rounded-full grid place-items-center text-[13px]" style={{ background: PP.paper, border: `2px solid ${I}` }}>5</span>}{s}
              </li>
            ))}
          </ol>
          <Card pad={26} className="flex-1">
            <h2 className="m-0 text-[30px] text-center" style={GY}>Ready to start</h2>
            <p className="m-0 mt-2 text-center text-[15px] font-semibold" style={{ color: Q }}>Pick one. You can stop, pause or switch questions any time from the Live class view.</p>
            <div className="grid grid-cols-3 gap-4 mt-6">
              {[
                [Broadcast, 'Start now', 'Opens the big screen and your private Live class view.', <Btn key="a" main><Broadcast weight="bold" size={18} />Start live</Btn>, true],
                [LinkSimple, 'Share a code', 'Students type it on their own device. The code works for 24 hours.', <span key="b" className="text-[36px] tracking-[0.18em] font-heading font-bold">482 913</span>, false],
                [CalendarBlank, 'Send as homework', 'A link that stays open until the date you pick.', <span key="c" className="h-11 px-4 rounded-[10px] inline-flex items-center gap-2 font-bold" style={{ background: PP.cream, border: `2px solid ${I}` }}><CalendarBlank weight="bold" size={18} />Due Wed Nov 25</span>, false],
              ].map(([Ic, t, d, ctl, pick]) => {
                const C = Ic as typeof House;
                return (
                  <div key={t as string} className="rounded-[18px] p-5 grid justify-items-center text-center gap-2.5 content-start" style={{ background: pick ? PP.gamify : PP.cream, boxShadow: pick ? `0 0 0 3px ${PP.paper}, 0 0 0 6px ${I}` : undefined }}>
                    <span className="w-14 h-14 rounded-full grid place-items-center" style={{ background: PP.paper, border: `2px solid ${I}` }}><C weight="bold" size={26} /></span>
                    <b className="text-[19px]">{t as string}</b>
                    <span className="text-[14px] font-semibold leading-snug min-h-[40px]">{d as string}</span>
                    {ctl as ReactNode}
                  </div>
                );
              })}
            </div>
            <div className="mt-6 rounded-[14px] p-4 grid gap-2.5" style={{ background: PP.cream }}>
              <span className="flex items-center gap-2"><b className="text-[15px]">Game options</b><Tip text="Set in the How and Game steps. Change any of them here before you start." /><span className="ml-auto text-[14px] font-bold" style={{ color: PP.grapeDeep }}>Change</span></span>
              <div className="flex flex-wrap gap-2">{['10 rounds', '2 tries per question', 'Timer off', '4 power-ups on', 'Classic theme', 'Teach card first', 'Shuffle answers'].map((o) => <Chip key={o} bg={PP.paper} strong>{o}</Chip>)}</div>
            </div>
            <div className="mt-auto flex items-center justify-center gap-6 text-[14px] font-semibold" style={{ color: Q }}>
              <span className="inline-flex items-center gap-2"><Check weight="bold" size={16} />Projector set to Extend, not Mirror <Tip text="Mirror shows your private class view to the room. Extend keeps it on your laptop only." /></span>
              <span className="inline-flex items-center gap-2"><Check weight="bold" size={16} />Sound on</span>
              <span className="inline-flex items-center gap-2"><Check weight="bold" size={16} />Ends when you press End</span>
            </div>
          </Card>
        </div>
      </div>
    </Shell>
  );
}

// ---------- 5. Live class view ----------
function LiveView() {
  type S = { n: string; done: number; right: number; state: 'ok' | 'stuck' | 'guess' | 'done' | 'away'; sec?: number };
  const st: S[] = NAMES.slice(0, 22).map((n, i) => ({
    n, done: [6, 5, 4, 3, 6, 5, 4, 2, 5, 4, 3, 6, 5, 4, 1, 5, 4, 2, 6, 3, 5, 4][i], right: [6, 5, 4, 3, 5, 4, 4, 1, 4, 3, 3, 6, 5, 3, 0, 4, 3, 2, 6, 1, 5, 4][i],
    state: i === 7 ? 'stuck' : i === 14 ? 'stuck' : i === 19 ? 'guess' : i === 17 ? 'away' : [0, 4, 11, 18].includes(i) ? 'done' : 'ok', sec: i === 7 ? 74 : i === 14 ? 52 : undefined,
  }));
  const order = { stuck: 0, guess: 1, away: 2, ok: 3, done: 4 };
  const sorted = [...st].sort((a, b) => order[a.state] - order[b.state]);
  const LOOK = { stuck: [PP.peach, 'Stuck'], guess: [PP.blush, 'Guessing'], away: [PP.cream, 'Left the game'], ok: [PP.paper, 'Playing'], done: [PP.mint, 'Finished'] } as const;
  return (
    <Shell active="activities" live crumb="Live now: Commas and capitals, Game Show" title="Live class view">
      <div className="h-full flex flex-col gap-3">
        <div className="flex items-center gap-3 rounded-[14px] px-4 py-2.5" style={{ background: PP.lavender }}>
          <EyeSlash weight="bold" size={20} /><b className="text-[14px]">Private to this laptop.</b><span className="text-[14px] font-semibold">The big screen shows the class goal only, never names or scores.</span>
          <span className="flex-1" /><Btn small><EyeSlash weight="bold" size={14} />Hide names (H)</Btn>
        </div>
        <div className="flex items-center gap-3">
          <Btn main><Pause weight="bold" size={18} />Pause everyone</Btn><Btn><Snowflake weight="bold" size={18} />Freeze one screen</Btn><Btn><ChatCircleText weight="bold" size={18} />Send a message</Btn><Btn><Stack weight="bold" size={18} />Switch a student&apos;s set</Btn>
          <span className="flex-1" />
          <span className="h-11 px-4 rounded-full inline-flex items-center gap-2 font-heading font-bold text-[20px] tabular-nums" style={{ background: PP.paper }}><Clock weight="bold" size={18} />8:42 left</span>
          <Btn><Stop weight="bold" size={18} />End</Btn>
        </div>
        <div className="flex-1 min-h-0 grid grid-cols-[1fr_300px] gap-4">
          <Card title="22 of 24 playing" tip="Sorted so the students who need you are first. Stuck means on one question for over 45 seconds; Guessing means under half right after 4 answers." right={<span className="text-[13px] font-bold" style={{ color: Q }}>Sort: needs me first</span>} pad={14}>
            <ul className="list-none m-0 p-0 grid grid-cols-4 gap-2">
              {sorted.map((s, i) => {
                const [bg, label] = LOOK[s.state];
                const warn = s.state === 'stuck' || s.state === 'guess';
                return (
                  <li key={s.n} className="rounded-[12px] px-2.5 py-2 grid gap-1" style={{ background: bg, border: warn ? `2px solid ${I}` : '2px solid rgba(29,26,51,0.08)' }}>
                    <span className="flex items-center gap-2"><Avatar name={s.n} i={i} size={26} /><b className="text-[14px] flex-1 truncate">{s.n}</b>{warn ? <Warning weight="bold" size={16} /> : s.state === 'done' ? <CheckCircle weight="bold" size={16} /> : null}</span>
                    <span className="flex items-center gap-1">{Array.from({ length: 6 }, (_, k) => <span key={k} className="h-2 flex-1 rounded-full" style={{ background: k < s.right ? PP.kelly : k < s.done ? PP.pink : 'rgba(29,26,51,0.12)' }} />)}</span>
                    <span className="text-[12px] font-bold" style={{ color: warn ? I : Q }}>{s.state === 'stuck' ? `Stuck on Q${s.done + 1}, ${s.sec}s` : label}{s.state === 'ok' || s.state === 'done' ? `, ${s.right} of ${s.done} right` : ''}</span>
                  </li>
                );
              })}
            </ul>
          </Card>
          <div className="grid gap-3 content-start">
            <Card title="On the big screen now" pad={14}>
              <div className="rounded-[12px] h-[118px] grid place-items-center text-center gap-1" style={{ background: PP.blueCrystal }}>
                <span className="text-[26px]" style={GY}>Class goal</span>
                <span className="w-[200px] h-4 rounded-full overflow-hidden" style={{ background: PP.paper, border: `2px solid ${I}` }}><span className="block h-full" style={{ width: '68%', background: PP.lemon }} /></span>
                <b className="text-[14px]">68 of 100 stars</b>
              </div>
            </Card>
            <Card title="Hardest question right now" pad={14}>
              <p className="m-0 text-[14px] font-bold leading-snug">Q4: Which sentence uses commas in a list?</p>
              <p className="m-0 mt-1 text-[13px] font-semibold" style={{ color: Q }}>9 picked &quot;apples bananas, and grapes&quot;</p>
              <div className="mt-2.5"><Takeaway stack text="Pause and teach it now?" action="Show teach card" /></div>
            </Card>
            <Card title="Hugo, stuck 74s" pad={14}>
              <div className="flex flex-wrap gap-2"><Btn small><ChatCircleText weight="bold" size={14} />You&apos;ve got this</Btn><Btn small><Lightbulb weight="bold" size={14} />Send a hint</Btn><Btn small><Snowflake weight="bold" size={14} />Freeze, I&apos;m coming</Btn></div>
            </Card>
          </div>
        </div>
      </div>
    </Shell>
  );
}

// ---------- 6. Question sets and the set editor ----------
function Sets() {
  const SETS = [
    ['Commas and capitals', 'ELA', 'Gr 1 to 2', ['L.1.2a', 'L.1.2c'], 10, 0, 58, PP.blush],
    ['Past tense verbs', 'ELA', 'Gr 2', ['L.2.1d'], 12, 0, 74, PP.butter],
    ['Apostrophes in contractions', 'ELA', 'Gr 2', ['L.2.2c'], 8, 2, 63, PP.aqua],
    ['Addition within 20', 'Math', 'Gr 1 to 2', ['2.OA.B.2'], 20, 0, 86, PP.blueCrystal],
    ['Plants and animals', 'Science', 'Gr 2', ['No standard'], 9, 1, 0, PP.mint],
  ] as const;
  return (
    <Shell active="sets" title="Question sets" actions={<><Btn><DownloadSimple weight="bold" size={18} />Import a spreadsheet</Btn><Btn main><Plus weight="bold" size={18} />New set</Btn></>}>
      <div className="h-full grid grid-cols-[220px_1fr] gap-4">
        <Card title="Filter">
          {[['Subject', ['ELA', 'Math', 'Science']], ['Grade', ['K', '1', '2', '3']], ['Standard', ['L.1.2', 'L.2.1', 'L.2.2', '2.OA']]].map(([h, opts]) => (
            <div key={h as string} className="grid gap-1.5 mb-4"><b className="text-[13px]" style={{ color: Q }}>{h as string}</b><div className="flex flex-wrap gap-1.5">{(opts as string[]).map((o, i) => <span key={o} className="h-8 px-3 rounded-full text-[13px] font-bold inline-flex items-center gap-1" style={i === 0 ? { background: PP.mint, border: `2px solid ${I}` } : { background: PP.cream }}>{i === 0 && <Check weight="bold" size={12} />}{o}</span>)}</div></div>
          ))}
        </Card>
        <div className="flex flex-col gap-3 min-h-0">
          <div className="flex gap-1.5">{['My sets (5)', 'Public sets'].map((t, i) => <span key={t} className="h-10 px-4 rounded-full font-bold text-[14px] inline-flex items-center" style={i === 0 ? { background: PP.gamify, border: `2px solid ${I}` } : { background: PP.paper }}>{t}</span>)}</div>
          <Card pad={8}>
            {SETS.map(([name, subj, gr, stds, n, work, pct, bg]) => (
              <div key={name} className="grid grid-cols-[56px_1fr_210px_150px_auto] items-center gap-4 px-3 py-3" style={{ borderTop: name === SETS[0][0] ? undefined : '1px solid rgba(29,26,51,0.08)' }}>
                <span className="w-14 h-14 rounded-[12px] grid place-items-center text-[22px]" style={{ ...GY, background: bg }}>{name[0]}</span>
                <span className="grid gap-1"><b className="text-[16px]">{name}</b><span className="flex gap-1.5 items-center text-[13px] font-semibold" style={{ color: Q }}>{subj}, {gr}, {n} questions{work > 0 && <Chip bg={PP.peach} strong><Warning weight="bold" size={12} />{work} need work</Chip>}</span></span>
                <span className="flex flex-wrap gap-1">{stds.map((s) => <Chip key={s} bg={PP.lavender} strong>{s}</Chip>)}</span>
                <span className="grid gap-1 text-[13px] font-bold">{pct ? <><span style={{ color: Q }}>Class right on first try</span><span className="inline-flex items-center gap-2"><Meter pct={pct} color={skillColor(pct)} w={70} />{pct}%</span></> : <span style={{ color: Q }}>Not played yet</span>}</span>
                <span className="flex gap-2"><Btn small><PencilSimple weight="bold" size={14} />Edit</Btn><Btn small main>Use<ArrowRight weight="bold" size={14} /></Btn></span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </Shell>
  );
}
function SetEditor() {
  const QLIST = ['Which word needs a capital letter?', 'Pick the sentence with the right punctuation.', 'Which name is written the right way?', 'Which sentence uses commas in a list?', 'Where does the period go?', 'Pick the question.', 'Which day needs a capital letter?', 'Find the sentence that ends right.', 'Which name is written the right way?', 'Pick the list with the right commas.'];
  return (
    <Shell active="sets" crumb="Question sets" title="Commas and capitals" sub="Saved" actions={<><Btn><DownloadSimple weight="bold" size={18} />CSV</Btn><Btn main>Use in an Activity<ArrowRight weight="bold" size={18} /></Btn></>}>
      <div className="h-full grid grid-cols-[290px_1fr_290px] gap-4">
        <Card title="10 questions" tip="The colored bar is how your classes did. It fills in after a game." pad={12}>
          <ol className="list-none m-0 p-0 grid gap-1">
            {QLIST.map((q, i) => (
              <li key={i} className="rounded-[10px] px-2 py-1.5 grid grid-cols-[20px_1fr_46px] items-center gap-2" style={i === 3 ? { background: PP.gamify, boxShadow: `inset 4px 0 0 ${PP.grape}` } : { background: PP.cream }}>
                <b className="text-[14px]">{i + 1}</b>
                <span className="text-[13px] font-bold leading-snug">{q}</span>
                <span className="h-6 rounded-full text-[12px] font-bold grid place-items-center" style={{ background: skillColor(QS[i].pct) }}>{QS[i].pct}%</span>
              </li>
            ))}
          </ol>
          <span className="mt-2"><Btn small><Plus weight="bold" size={14} />Add a question</Btn></span>
        </Card>
        <Card pad={22}>
          <div className="flex items-center gap-2"><b className="text-[13px] uppercase tracking-wider" style={{ color: Q }}>Question 4</b><span className="flex-1" /><Btn small><Microphone weight="bold" size={14} />Record the question</Btn><Btn small><Copy weight="bold" size={14} />Copy</Btn></div>
          <div className="mt-3 rounded-[12px] px-4 py-3 text-[20px] font-bold" style={{ background: PP.cream, border: `2px solid ${I}` }}>Which sentence uses commas in a list?</div>
          <div className="grid gap-2.5 mt-4">
            {[['A', 'I like apples, bananas, and grapes.', true], ['B', 'I like apples bananas, and grapes.', false], ['C', 'I like, apples bananas and grapes.', false], ['D', 'I like apples, bananas and, grapes.', false]].map(([l, a, ok]) => (
              <div key={l as string} className="h-14 rounded-[12px] px-3 flex items-center gap-3" style={{ background: ok ? PP.mint : PP.paper, border: `2px solid ${ok ? I : 'rgba(29,26,51,0.2)'}` }}>
                <span className="w-9 h-9 rounded-full grid place-items-center font-bold" style={{ background: PP.paper, border: `2px solid ${I}` }}>{l as string}</span>
                <span className="flex-1 font-semibold text-[16px]">{a as string}</span>
                {ok ? <Chip bg={PP.kelly} strong><Check weight="bold" size={12} />Right answer</Chip> : <span className="text-[13px] font-bold" style={{ color: Q }}>Mark right</span>}
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-[12px] p-3 grid gap-1" style={{ background: PP.butter }}>
            <b className="text-[14px] flex items-center gap-2"><Lightbulb weight="bold" size={16} />How it played: 41% right on first try</b>
            <span className="text-[14px] font-semibold">Most picked wrong answer: B (9 students). B and the right answer differ by one comma, so this question tests looking closely as much as the rule.</span>
          </div>
          <div className="mt-auto flex gap-2"><Btn small><Plus weight="bold" size={14} />Add a picture</Btn><Btn small><Plus weight="bold" size={14} />Teach card</Btn><Btn small>True or false</Btn></div>
        </Card>
        <Card title="Set details" tip="All details are needed before a set can be shared in Public sets.">
          {[['Subject', 'English language arts'], ['Grades', '1 to 2'], ['Standards', 'L.1.2a, L.1.2c'], ['Tags', 'punctuation, capital letter']].map(([k, v]) => (
            <div key={k} className="grid gap-1 mb-3"><b className="text-[13px]" style={{ color: Q }}>{k}</b><span className="h-10 rounded-[10px] px-3 flex items-center font-semibold text-[14px]" style={{ background: PP.cream, border: '2px solid rgba(29,26,51,0.2)' }}>{v}</span></div>
          ))}
          <div className="rounded-[12px] p-3 grid gap-1 text-[13px] font-semibold" style={{ background: PP.blueCrystal }}><b className="text-[14px]">Teach card</b>&quot;Put a comma after each thing in a list, except the last one.&quot;</div>
          <span className="mt-auto text-[13px] font-bold inline-flex items-center gap-1.5" style={{ color: '#15703a' }}><CheckCircle weight="bold" size={16} />10 of 10 questions ready to play</span>
        </Card>
      </div>
    </Shell>
  );
}

// ---------- 7. Reports ----------
function ReportTop({ tabs = 0 }: { tabs?: number }) {
  return (
    <div className="flex items-center gap-2">
      {['Class overview', 'Activities', 'Students', 'Small groups'].map((t, i) => <span key={t} className="h-10 px-4 rounded-full font-bold text-[14px] inline-flex items-center" style={i === tabs ? { background: PP.gamify, border: `2px solid ${I}` } : { background: PP.paper }}>{t}</span>)}
      <span className="flex-1" />
      {['Room 12', 'Last 5 weeks', 'All games', 'All sets'].map((f) => <span key={f} className="h-10 px-3.5 rounded-full font-bold text-[14px] inline-flex items-center gap-1.5" style={{ background: PP.paper, border: '2px solid rgba(29,26,51,0.18)' }}>{f}</span>)}
    </div>
  );
}
function ClassReport() {
  return (
    <Shell active="reports" title="Reports" actions={<><Btn><DownloadSimple weight="bold" size={18} />CSV</Btn><Btn main><Printer weight="bold" size={18} />Print or PDF</Btn></>}>
      <div className="h-full flex flex-col gap-3">
        <ReportTop />
        <div className="grid grid-cols-5 gap-3">
          <Stat label="Questions answered" value="2,418" delta="+312" />
          <Stat label="Right" value="79%" delta="+18" />
          <Stat label="Right on first try" value="72%" delta="+24" tip="Right with the first answer, no retries." />
          <Stat label="Remembered a week later" value="81%" tip="Right, then right again 7 or more days later." />
          <Stat label="Played at least 3 days" value="21 of 24" />
        </div>
        <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-2 gap-3">
          <Card title="Accuracy over time" tip="Each point is one week. Right includes answers that were right on a retry." pad={14}>
            <ChartContainer label="Right and right on first try, weekly, both rising" height={136} config={{ right: { label: 'Right', color: PP.sky }, first: { label: 'Right on first try', color: PP.grape } }}>
              <LineChart data={WEEKS} margin={{ top: 6, right: 14, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="rgba(29,26,51,0.08)" /><XAxis dataKey="w" {...AXIS} /><YAxis domain={[40, 90]} ticks={[40, 60, 80]} {...AXIS} />
                <Line dataKey="right" stroke="var(--color-right)" strokeWidth={3} dot={{ r: 3.5 }} isAnimationActive={false} />
                <Line dataKey="first" stroke="var(--color-first)" strokeWidth={3} strokeDasharray="6 4" dot={{ r: 3.5 }} isAnimationActive={false} />
              </LineChart>
            </ChartContainer>
            <div className="flex gap-4 text-[13px] font-bold mb-1.5"><span className="inline-flex items-center gap-1.5"><span className="w-5 h-[3px]" style={{ background: PP.sky }} />Right</span><span className="inline-flex items-center gap-1.5"><span className="w-5 border-t-[3px] border-dashed" style={{ borderColor: PP.grape }} />Right on first try</span></div>
            <Takeaway text="First-try answers grew 24 points in 5 weeks. Keep the weekly game routine." action="Repeat Friday's Activity" />
          </Card>
          <Card title="By skill (Common Core)" tip="Right on first try for every question tagged with that standard." pad={14}>
            <div className="grid gap-2 mb-2">
              {SKILLS.map((s) => (
                <div key={s.code} className="grid grid-cols-[64px_190px_1fr_44px] items-center gap-2 text-[14px]">
                  <Chip bg={PP.lavender} strong>{s.code}</Chip><span className="font-semibold truncate">{s.name}</span>
                  <span className="h-4 rounded-full overflow-hidden" style={{ background: PP.cream }}><span className="block h-full rounded-full" style={{ width: `${s.pct}%`, background: skillColor(s.pct) }} /></span><b className="text-right">{s.pct}%</b>
                </div>
              ))}
            </div>
            <Takeaway text="Commas in a list is the only skill under 50%." action="Reteach commas" icon={<ArrowCounterClockwise weight="bold" size={16} />} />
          </Card>
          <Card title="By question: most missed" tip="Commas and capitals set, right on first try per question. The pink bar is the most missed." pad={14}>
            <ChartContainer label="Right on first try per question; question 4 lowest at 41 percent" height={140} config={{ pct: { label: 'Right on first try', color: PP.periwinkle } }}>
              <BarChart data={QS} margin={{ top: 6, right: 8, left: -22, bottom: 0 }}>
                <XAxis dataKey="q" {...AXIS} /><YAxis domain={[0, 100]} ticks={[0, 50, 100]} {...AXIS} />
                <ReferenceLine y={80} stroke={I} strokeDasharray="4 4" />
                <Bar dataKey="pct" stroke={I} strokeWidth={1.5} radius={[6, 6, 0, 0]} isAnimationActive={false}>{QS.map((d) => <Cell key={d.q} fill={d.pct < 50 ? PP.pink : d.pct < 80 ? PP.lemon : PP.kelly} />)}</Bar>
              </BarChart>
            </ChartContainer>
            <Takeaway text="Most of the class missed question 4: commas in a list." action="See question 4" />
          </Card>
          <Card title="Time on task and who played" tip="Minutes are time on questions only, not menus or celebrations." pad={14}>
            <div className="grid grid-cols-[1fr_250px] gap-4 items-start">
              <ChartContainer label="Minutes played per day; Thursday none" height={126} config={{ m: { label: 'Minutes', color: PP.teal } }}>
                <BarChart data={DAYS} margin={{ top: 6, right: 4, left: -24, bottom: 0 }}>
                  <XAxis dataKey="d" {...AXIS} /><YAxis {...AXIS} ticks={[0, 30, 60]} />
                  <Bar dataKey="m" fill="var(--color-m)" stroke={I} strokeWidth={1.5} radius={[6, 6, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ChartContainer>
              <div className="grid gap-1.5">
                <span className="text-[13px] font-bold" style={{ color: Q }}>Days played this week, each dot a student</span>
                <div className="grid grid-cols-12 gap-1.5">{NAMES.map((n, i) => { const d = [5, 5, 4, 4, 5, 3, 4, 2, 4, 3, 5, 4, 3, 4, 1, 4, 0, 3, 5, 2, 4, 3, 4, 5][i]; return <span key={n} title={`${n}: ${d} days`} className="w-[16px] h-[16px] rounded-full" style={{ background: d >= 3 ? PP.kelly : d >= 1 ? PP.lemon : PP.paper, border: `1.5px solid ${I}` }} />; })}</div>
                <span className="text-[12px] font-semibold" style={{ color: Q }}>Green 3 or more days, yellow 1 or 2, white none</span>
              </div>
            </div>
            <Takeaway text="Quinn has not played this week; Omar and Hugo played once." action="Send them a code" icon={<LinkSimple weight="bold" size={16} />} />
          </Card>
        </div>
      </div>
    </Shell>
  );
}
function ActivityReport() {
  const RET = QS.slice(0, 8).map((d, i) => ({ q: d.q, first: d.pct, retry: Math.min(100, d.pct + [6, 9, 10, 31, 8, 14, 18, 4][i]) }));
  return (
    <Shell active="reports" crumb="Reports, Activities" title="Commas and capitals" sub="Game Show, Live, Fri Nov 20, 22 players" actions={<><Btn><ArrowCounterClockwise weight="bold" size={18} />Play again</Btn><Btn main><Printer weight="bold" size={18} />Print or PDF</Btn></>}>
      <div className="h-full grid grid-cols-[1fr_360px] gap-3">
        <div className="grid gap-3 min-h-0" style={{ gridTemplateRows: '1fr 1fr' }}>
          <Card title="Per question" tip="First try: right with the first answer. After retry: right by the last try." pad={14}>
            <table className="w-full text-[14px] border-collapse">
              <thead><tr className="text-left text-[13px]" style={{ color: Q }}>{['#', 'Question', 'First try', 'After retry', 'Most common wrong answer', 'Avg time'].map((h) => <th key={h} className="font-bold pb-1">{h}</th>)}</tr></thead>
              <tbody>
                {[['Q4', 'Which sentence uses commas in a list?', 41, 72, 'apples bananas, and grapes (9)', '14s'], ['Q9', 'Which name is written the right way?', 58, 70, 'jamal (5)', '11s'], ['Q7', 'Where does the period go?', 64, 82, 'after "the" (4)', '9s'], ['Q6', 'Pick the question.', 70, 84, 'no question mark (5)', '8s'], ['Q2', 'Pick the sentence with the right punctuation.', 82, 91, 'no period (2)', '7s']].map(([q, p, f, r, w, t]) => (
                  <tr key={q as string} style={{ borderTop: '1px solid rgba(29,26,51,0.08)', background: q === 'Q4' ? PP.blush : undefined }}>
                    <td className="py-1.5 pl-1.5 pr-3 font-bold">{q}</td><td className="font-semibold pr-3">{p}</td>
                    <td className="pr-3"><span className="inline-flex items-center gap-1.5"><Meter pct={f as number} color={skillColor(f as number)} w={56} /><b>{f}%</b></span></td>
                    <td className="font-bold pr-3">{r}%</td><td className="font-semibold pr-3">{w}</td><td className="font-semibold">{t}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Takeaway text="Q4 was the hardest; 9 students chose the answer missing the first comma." action="Reteach set from Q4 and Q9" icon={<ArrowCounterClockwise weight="bold" size={16} />} />
          </Card>
          <Card title="Retry growth" tip="How many more were right after a second or third try. Big jumps mean the feedback taught something." pad={14}>
            <ChartContainer label="First try versus after retry for each question; question 4 grew most, 41 to 72 percent" height={205} config={{ first: { label: 'First try', color: PP.periwinkle }, retry: { label: 'After retry', color: PP.kelly } }}>
              <BarChart data={RET} margin={{ top: 4, right: 8, left: -22, bottom: 0 }} barGap={2}>
                <XAxis dataKey="q" {...AXIS} /><YAxis domain={[0, 100]} ticks={[0, 50, 100]} {...AXIS} />
                <Bar dataKey="first" fill="var(--color-first)" stroke={I} strokeWidth={1.5} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="retry" fill="var(--color-retry)" stroke={I} strokeWidth={1.5} radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ChartContainer>
            <div className="flex gap-4 text-[13px] font-bold -mt-1 mb-1.5"><span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: PP.periwinkle, border: `1.5px solid ${I}` }} />First try</span><span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: PP.kelly, border: `1.5px solid ${I}` }} />After retry</span></div>
            <Takeaway text="On Q4, 7 more students got it after a retry: the feedback is working." action="Keep 2 tries on" />
          </Card>
        </div>
        <Card title="Per student" tip="Sorted by need. Only you see this; nothing is ranked on a student screen." pad={14}>
          <ul className="list-none m-0 p-0 grid gap-1">
            {[['Omar', 3, 10, -1], ['Hugo', 4, 10, 1], ['Theo', 5, 10, 2], ['Rosa', 5, 10, 1], ['Quinn', 0, 0, 0], ['Milo', 6, 10, 2], ['Lena', 7, 10, 1], ['Kai', 7, 10, 3], ['Isla', 8, 10, 1], ['Grace', 9, 10, 0], ['Ava', 10, 10, 0]].map(([n, r, of, g], i) => (
              <li key={n as string} className="grid grid-cols-[28px_1fr_92px_56px] items-center gap-2 py-[7px] text-[14px]" style={{ borderTop: i ? '1px solid rgba(29,26,51,0.06)' : undefined }}>
                <Avatar name={n as string} i={i} size={26} /><b>{n as string}</b>
                {of ? <span className="inline-flex items-center gap-1.5"><Meter pct={((r as number) / (of as number)) * 100} color={skillColor(((r as number) / (of as number)) * 100)} w={50} /><b>{r}/{of}</b></span> : <span className="font-bold" style={{ color: Q }}>Absent</span>}
                <span className="text-[13px] font-bold inline-flex items-center gap-0.5" style={{ color: (g as number) > 0 ? '#15703a' : (g as number) < 0 ? '#9b2c2c' : Q }}>{(g as number) > 0 ? <><ArrowCounterClockwise weight="bold" size={13} />+{g}</> : (g as number) < 0 ? 'No retry' : ''}</span>
              </li>
            ))}
          </ul>
          <Takeaway stack text="Omar, Hugo, Theo and Rosa got 5 or fewer right." action="Group these 4" icon={<UsersThree weight="bold" size={16} />} />
        </Card>
      </div>
    </Shell>
  );
}
function StudentReport() {
  const growth = [{ w: 'Oct 26', p: 38 }, { w: 'Nov 2', p: 42 }, { w: 'Nov 9', p: 40 }, { w: 'Nov 16', p: 51 }, { w: 'Nov 23', p: 57 }];
  return (
    <Shell active="reports" crumb="Reports, Students" title="Omar" sub="Room 12, Grade 2. Supports: read aloud, 3 tries" actions={<><Btn><PencilSimple weight="bold" size={18} />Add a note</Btn><Btn main><Printer weight="bold" size={18} />Family report</Btn></>}>
      <div className="h-full grid grid-cols-[1fr_380px] gap-3">
        <div className="grid gap-3 min-h-0" style={{ gridTemplateRows: '1fr 230px' }}>
          <Card title="Growth over time" tip="Right on first try each week. Compared with Omar's own start, never with classmates." pad={16}>
            <ChartContainer label="Omar right on first try rose from 38 to 57 percent over five weeks" height={300} config={{ p: { label: 'Right on first try', color: PP.grape } }}>
              <LineChart data={growth} margin={{ top: 10, right: 16, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="rgba(29,26,51,0.08)" /><XAxis dataKey="w" {...AXIS} /><YAxis domain={[20, 80]} ticks={[20, 50, 80]} {...AXIS} />
                <ReferenceLine y={38} stroke={Q} strokeDasharray="4 4" label={{ value: 'His start', position: 'insideBottomRight', fill: Q, fontSize: 12, fontWeight: 700 }} />
                <Line dataKey="p" stroke="var(--color-p)" strokeWidth={3.5} dot={{ r: 5, fill: PP.paper, strokeWidth: 3 }} isAnimationActive={false} />
              </LineChart>
            </ChartContainer>
            <Takeaway text="Omar is up 19 points since October, most of it since read aloud was turned on (Nov 12)." action="Keep read aloud on" />
          </Card>
          <Card title="Skills" tip="Mastered: 80% or more on first try over at least 10 questions. Practicing: 50 to 79%. Not yet: under 50%." pad={16}>
            <div className="grid grid-cols-3 gap-3">
              {[['Mastered', PP.mint, ['L.1.2a Capital letters for names']], ['Practicing', PP.butter, ['L.1.2b End punctuation', 'L.2.1d Past tense verbs']], ['Not yet', PP.blush, ['L.1.2c Commas in a list', 'L.2.2c Apostrophes']]].map(([h, bg, items]) => (
                <div key={h as string} className="rounded-[12px] p-3 grid gap-1.5 content-start" style={{ background: bg as string }}><b className="text-[14px]">{h as string}</b>{(items as string[]).map((x) => <span key={x} className="text-[13px] font-semibold leading-snug">{x}</span>)}</div>
              ))}
            </div>
            <Takeaway text="Two skills are not yet started well. Start with commas in a list: it is the class focus too." action="Assign comma practice" />
          </Card>
        </div>
        <div className="grid gap-3 min-h-0" style={{ gridTemplateRows: 'auto 1fr' }}>
          <Card title="Stickers earned" tip="Stickers come from playing and trying, never from scores, so every student can earn them." pad={16}>
            <div className="grid grid-cols-4 gap-2 justify-items-center">{STARTER.filter((s) => ['first', 'plays', 'days', 'homework'].includes(s.id)).map((s) => <StickerArt key={s.id} s={s} size={70} />)}</div>
            <span className="text-[13px] font-bold mt-2" style={{ color: Q }}>Placeholders: student stickers are not designed yet (class Starter art shown)</span>
          </Card>
          <Card title="Recent play" pad={16}>
            <ul className="list-none m-0 p-0 grid gap-2 text-[14px]">
              {[['Fri Nov 20', 'Commas and capitals', 'Game Show', '3 of 10', '12 min'], ['Thu Nov 19', 'Past tense verbs', 'Bowling, homework', '7 of 12', '9 min'], ['Mon Nov 16', 'Apostrophes', 'Board Game', '3 of 8', '11 min'], ['Fri Nov 13', 'Commas and capitals', 'Bubble Pop, code', '4 of 10', '10 min'], ['Wed Nov 11', 'Past tense verbs', 'Match Three', '6 of 12', '8 min']].map(([d, s, g, r, m]) => (
                <li key={d} className="rounded-[10px] p-2.5 grid gap-0.5" style={{ background: PP.cream }}><span className="flex"><b>{s}</b><span className="ml-auto font-bold">{r}</span></span><span className="text-[13px] font-semibold" style={{ color: Q }}>{d}, {g}, {m}</span></li>
              ))}
            </ul>
            <div className="mt-auto rounded-[12px] p-3 text-[13px] font-semibold leading-snug" style={{ background: PP.lavender }}><b>Your note, Nov 12:</b> Turned on read aloud. Reads the answers out loud to himself.</div>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
function SmallGroup() {
  const KIDS = [['Omar', [30, 38, 44, 52, 57]], ['Hugo', [40, 42, 50, 55, 62]], ['Rosa', [35, 45, 48, 60, 68]], ['Theo', [42, 40, 47, 49, 51]]] as const;
  return (
    <Shell active="reports" crumb="Reports, Small groups" title="Commas practice" sub="4 students, 3 sessions a week, 15 minutes" actions={<><Btn><PencilSimple weight="bold" size={18} />Session note</Btn><Btn main><GameController weight="bold" size={18} />Start a group session</Btn></>}>
      <div className="h-full flex flex-col gap-3">
        <div className="flex items-center gap-3 rounded-[14px] px-4 py-3" style={{ background: PP.gamify }}>
          <Target weight="bold" size={22} className="shrink-0" /><b className="text-[15px] min-w-0">Goal: 80% right on first try on L.1.2c commas in a list by Fri Dec 18</b><Tip text="Your goal, written the way you track it (for example an IEP or intervention plan). Gamify only shows progress toward it." />
          <span className="flex-1" /><span className="text-[14px] font-bold whitespace-nowrap">5 of 9 sessions done</span>
        </div>
        <div className="flex-1 min-h-0 grid grid-cols-4 gap-3 items-start">
          {KIDS.map(([n, pts], i) => {
            const data = [...pts, null, null, null, null].map((p, k) => ({ s: `S${k + 1}`, p, aim: Math.round(pts[0] + ((80 - pts[0]) * k) / 8) }));
            const last = pts[pts.length - 1];
            const on = last >= 60;
            return (
              <Card key={n} pad={14}>
                <div className="flex items-center gap-2.5 mb-1"><Avatar name={n} i={i + 2} size={36} /><b className="text-[18px]">{n}</b><span className="ml-auto"><Chip bg={on ? PP.mint : PP.peach} strong>{on ? 'On track' : 'Below aim line'}</Chip></span></div>
                <ChartContainer label={`${n}, right on first try per session, now ${last} percent`} height={405} config={{ p: { label: 'Right on first try', color: PP.grape } }}>
                  <LineChart data={data} margin={{ top: 10, right: 8, left: -26, bottom: 0 }}>
                    <XAxis dataKey="s" {...AXIS} /><YAxis domain={[20, 100]} ticks={[20, 50, 80]} {...AXIS} />
                    <ReferenceLine y={80} stroke={PP.kelly} strokeWidth={2} strokeDasharray="5 4" />
                    <Line dataKey="aim" stroke={Q} strokeWidth={1.5} strokeDasharray="2 4" dot={false} isAnimationActive={false} />
                    <Line dataKey="p" stroke="var(--color-p)" strokeWidth={3} dot={{ r: 4, fill: PP.paper, strokeWidth: 2.5 }} isAnimationActive={false} />
                  </LineChart>
                </ChartContainer>
                <div className="flex gap-3 text-[12px] font-bold" style={{ color: Q }}><span>Green dashes: goal 80%</span><span>Dots: aim line</span></div>
                <div className="grid gap-1 text-[13px] font-semibold mt-2">
                  <span className="flex"><span style={{ color: Q }}>Now</span><b className="ml-auto">{last}%</b></span>
                  <span className="flex"><span style={{ color: Q }}>Minutes this week</span><b className="ml-auto">{[38, 41, 44, 29][i]}</b></span>
                  <span className="flex"><span style={{ color: Q }}>Most common slip</span><b className="ml-auto">{['No first comma', 'Comma before and', 'No first comma', 'Extra commas'][i]}</b></span>
                </div>
                <div className="pt-3"><Btn small>{on ? 'Keep the plan' : 'Try a 1:1 session'}<ArrowRight weight="bold" size={14} /></Btn></div>
              </Card>
            );
          })}
        </div>
        <Takeaway text="Rosa and Hugo are on track. Theo is flat for 3 sessions: try a 1:1 with the teach card first." action="Plan Theo's 1:1" icon={<Student weight="bold" size={16} />} />
      </div>
    </Shell>
  );
}
function PrintReport() {
  return (
    <div className="w-full h-full grid place-items-center relative" style={{ background: '#d9d5e3' }}>
      <div className="absolute top-4 inset-x-0 flex justify-center gap-3"><Btn main><Printer weight="bold" size={18} />Print</Btn><Btn><DownloadSimple weight="bold" size={18} />Save as PDF</Btn><Btn>Letter</Btn><Btn>Class, Nov 1 to 23</Btn></div>
      <article className="w-[580px] h-[750px] mt-12 px-10 py-8 flex flex-col gap-3 text-[11.5px]" style={{ background: '#fff', boxShadow: '0 10px 30px rgba(29,26,51,0.25)', fontFamily: 'var(--font-heading)' }}>
        <header className="flex items-end pb-2.5" style={{ borderBottom: `3px solid ${PP.periwinkle}` }}>
          <div className="grid gap-0.5"><img src="/brand/gamify-wordmark.png" alt="Gamify" className="h-8 w-auto self-start mb-1" draggable="false" /><b className="text-[15px]">Class progress report: Room 12, Grade 2</b><span className="font-semibold" style={{ color: Q }}>November 1 to 23, 2026. 24 students, 11 Activities</span></div>
        </header>
        <section className="grid grid-cols-4 gap-2">{[['Right', '79%'], ['First try', '72%'], ['Kept a week', '81%'], ['Minutes', '612']].map(([k, v]) => <div key={k} className="rounded-[8px] p-2" style={{ background: PP.cream }}><span className="font-bold" style={{ color: Q }}>{k}</span><b className="block text-[18px]">{v}</b></div>)}</section>
        <section><b className="text-[13px]">At a glance</b><p className="m-0 mt-1 leading-snug font-semibold">The class answered 2,418 questions. Right on first try rose from 48% to 72%. Capital letters for names and end punctuation are mastered. Commas in a list (L.1.2c) is the focus for December.</p></section>
        <section>
          <b className="text-[13px]">Skills</b>
          <div className="grid gap-1 mt-1">{SKILLS.map((s) => <div key={s.code} className="grid grid-cols-[52px_170px_1fr_34px] items-center gap-2"><b>{s.code}</b><span className="font-semibold">{s.name}</span><span className="h-2.5 rounded-full" style={{ background: PP.cream }}><span className="block h-full rounded-full" style={{ width: `${s.pct}%`, background: skillColor(s.pct) }} /></span><b className="text-right">{s.pct}%</b></div>)}</div>
        </section>
        <section className="flex-1 min-h-0 overflow-hidden">
          <b className="text-[13px]">Students</b>
          <table className="w-full mt-1 border-collapse"><thead><tr className="text-left" style={{ color: Q }}>{['Student', 'Questions', 'First try', 'Trend', 'Focus'].map((h) => <th key={h} className="font-bold pb-0.5">{h}</th>)}</tr></thead>
            <tbody>{NAMES.slice(0, 4).map((n, i) => <tr key={n} style={{ borderTop: '1px solid #eee' }}><td className="py-[3px] font-bold">{n}</td><td>{[118, 104, 99, 96, 120, 88, 92, 61, 101, 97, 90, 86][i]}</td><td>{[94, 90, 86, 83, 80, 78, 75, 47, 71, 69, 66, 64][i]}%</td><td>{i === 7 ? 'Down' : 'Up'}</td><td className="font-semibold">{i < 4 ? 'Challenge set' : 'Commas in a list'}</td></tr>)}</tbody></table>
          <p className="m-0 mt-1 font-bold" style={{ color: Q }}>20 more students on page 2</p>
        </section>
        <section><b className="text-[13px]">Questions to practice</b><p className="m-0 mt-1 font-semibold">Q4 commas in a list (41%), Q9 names (58%), Q7 period place (64%).</p></section>
        <footer className="pt-2 font-semibold leading-snug" style={{ borderTop: '1px solid #ddd', color: Q }}><b>How it is measured.</b> Right on first try counts a question right only when the first answer was right. Kept a week: right, then right again 7 or more days later. Students are never ranked. Page 1 of 2.</footer>
      </article>
    </div>
  );
}

// ---------- 8. Achievements ----------
function Achievements() {
  const earned = new Set(['first', 'plays', 'days', 'students', 'set', 'homework', 'live']);
  return (
    <Shell active="achievements" title="Achievements" sub="Stickers your class has earned together" actions={<Btn main><Broadcast weight="bold" size={18} />Show on the big screen</Btn>}>
      <div className="h-full flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {['Starter collection', 'Winter challenge'].map((t, i) => <span key={t} className="h-10 px-4 rounded-full font-bold text-[14px] inline-flex items-center gap-1.5" style={i === 0 ? { background: PP.gamify, border: `2px solid ${I}` } : { background: PP.paper }}>{i === 1 && <LockSimple weight="bold" size={14} />}{t}{i === 1 && <span className="font-semibold" style={{ color: Q }}>opens Dec 1</span>}</span>)}
          <span className="flex-1" /><b className="text-[15px]">7 of 12 earned</b><Meter pct={58} color={PP.lemon} w={180} />
        </div>
        <Card className="flex-1" pad={22}>
          <div className="grid grid-cols-6 gap-x-4 gap-y-5">
            {STARTER.map((s) => {
              const got = earned.has(s.id);
              return (
                <div key={s.id} className="grid justify-items-center text-center gap-1.5">
                  <StickerArt s={s} size={140} locked={!got} />
                  <span className="text-[13px] font-bold leading-snug">{s.earn}</span>
                  <Chip bg={got ? PP.mint : PP.cream} strong>{got ? <><Check weight="bold" size={12} />Earned</> : 'Not yet'}</Chip>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </Shell>
  );
}

// ---------- 9. First run and empty states ----------
function FirstRun() {
  return (
    <Shell active="home" title="Welcome to Gamify" sub="Three steps to your first game">
      <div className="h-full grid grid-cols-[1fr_380px] gap-4">
        <Card pad={28} className="items-center text-center">
          <span className="text-[13px] font-bold uppercase tracking-wider" style={{ color: Q }}>Get started, 1 of 3 done</span>
          <span className="w-[320px] h-3 rounded-full overflow-hidden mt-2" style={{ background: PP.cream }}><span className="block h-full rounded-full" style={{ width: '33%', background: PP.periwinkle }} /></span>
          <div className="flex-1 grid place-items-center"><ol className="list-none m-0 p-0 grid gap-3 w-[640px] text-left">
            {[['Add your class', 'Paste names, one per line. No student emails.', true], ['Pick a question set', 'Write your own, import a spreadsheet, or use a Public set.', false], ['Start your first Activity', 'Play on the big screen, share a code, or send homework.', false]].map(([t, d, done], i) => (
              <li key={t as string} className="rounded-[16px] p-4 flex items-center gap-4" style={{ background: done ? PP.mint : i === 1 ? PP.gamify : PP.cream, boxShadow: i === 1 ? `0 0 0 3px ${PP.paper}, 0 0 0 6px ${I}` : undefined }}>
                <span className="w-11 h-11 rounded-full grid place-items-center font-bold text-[18px] shrink-0" style={{ background: done ? PP.kelly : PP.paper, border: `2px solid ${I}` }}>{done ? <Check weight="bold" size={20} /> : i + 1}</span>
                <span className="grid gap-0.5 flex-1"><b className="text-[17px]">{t as string}</b><span className="text-[14px] font-semibold" style={{ color: Q }}>{d as string}</span></span>
                {i === 1 && <Btn main>Pick a set<ArrowRight weight="bold" size={16} /></Btn>}
              </li>
            ))}
          </ol></div>
          <div className="flex items-center gap-3"><span className="text-[14px] font-semibold" style={{ color: Q }}>Want to see what reports look like first?</span><Btn><ChartBar weight="bold" size={18} />Open the example report</Btn></div>
        </Card>
        <div className="grid gap-4 content-start">
          {[[ChartBar, 'Reports fill in after your first game', 'Every question your class answers shows up here: what they got, what they missed, and what to teach next.'], [Warning, 'Needs attention is empty', 'When a student is stuck or a question trips up the class, it shows here, privately.'], [StickerIcon, 'No stickers yet', 'Your class earns the first one, First game!, the first time they play.']].map(([Ic, t, d]) => {
            const C = Ic as typeof House;
            return (
              <div key={t as string} className="rounded-[18px] p-5 grid justify-items-center text-center gap-2" style={{ border: `2.5px dashed ${Q}` }}>
                <span className="w-12 h-12 rounded-full grid place-items-center" style={{ background: PP.paper, border: `2px solid ${I}` }}><C weight="bold" size={22} /></span>
                <b className="text-[16px]">{t as string}</b><span className="text-[14px] font-semibold leading-snug" style={{ color: Q }}>{d as string}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}

// ---------- the tab ----------
const VIEWS: { n: string; name: string; view: ReactNode; why: string; changed: string }[] = [
  { n: '1', name: 'Dashboard home', view: <Home />,
    why: 'Overview first, details on demand (Shneiderman). Few: a dashboard is one screen read at a glance, so 4 numbers, 1 trend and 1 list, not 20 tiles. The top card is formative assessment in action (Black and Wiliam): the evidence becomes the next teaching step. Needs attention is private, so no student is shamed (self-determination theory, relatedness).',
    changed: 'Today there is no home: teachers land on Classes. New: one next step with a ready reteach button, a 4 number snapshot with a takeaway, a private needs-attention list where each row has its own action, quick start and recent Activities.' },
  { n: '2', name: 'Navigation: a left rail', view: <Navigation />,
    why: 'Recognition over recall and visible navigation (NN/g heuristics, from memory): 8 labeled places always showing. Laptops are wide and short, so a rail costs width, not the height reports need. Jakob\'s law: teacher tools (Google Classroom, LMSs) use left rails. Create an Activity on top follows Fitts\'s law for the most-used task.',
    changed: 'Today: a thin top bar of 5 pills (Classes, Question sets, Reports, Themes, Account). New: Home, Activities and Achievements join, Create an Activity is always on top, the class switcher answers "which class?" on every page.' },
  { n: '3a', name: 'Classes', view: <Classes />,
    why: 'Her rule: student names right under the class name (2026-11-16). Recognition: a name chip finds a class faster than a count. One meter per class keeps comparison at a glance (preattentive length).',
    changed: 'Each class card gains a color edge, its student names, one first-try meter and a Progress report button one click away.' },
  { n: '3b', name: 'Class page: roster and groups', view: <ClassView />,
    why: 'Minimum data: first names, a picture and a hidden PIN; supports (read aloud, tries, Calm) show as chips so accommodations are visible, never paywalled (UDL). Flexible small groups are standard response-to-intervention practice; group names stay teacher-only.',
    changed: 'New Groups tab and panel (groups do not exist in the data today: a new field on Classroom). The roster becomes a scannable table with last played, first-try meter and trend.' },
  { n: '4', name: 'Create an Activity: Start', view: <CreateActivity />,
    why: 'A stepper with your choices kept visible lowers working memory load (cognitive load theory). Three start choices side by side, one picked, matches her who, how, game, questions, start flow. The Extend, not Mirror check prevents the most common way private data reaches the projector.',
    changed: 'Today: numbered pills and a summary list. New: done steps show green checks, a "Your choices" column with Change links, the code shown big in two groups of three, carried-over supports and a pre-flight check.' },
  { n: '5', name: 'Live class view (teacher laptop)', view: <LiveView />,
    why: 'Timely, private feedback beats public comparison (Hattie, feedback; mastery-goal research, from memory). Sort by need puts the 2 or 3 students who need you first (Few: put the most important at the top left). Status uses an icon and words as well as color (WCAG 1.4.1).',
    changed: 'Today the monitor is a small pop-up list and the big screen shows a top-10 leaderboard by name. New: a full private view, tiles sorted by need with per-question dots, one-click help (message, hint, freeze), pause and end in reach, and the big screen preview showing the class goal only.' },
  { n: '6a', name: 'Question sets', view: <Sets />,
    why: 'Information scent (NN/g, from memory): standards chips and how the class did tell a teacher which set to use before opening it. Faceted filters (subject, grade, standard) beat one long list.',
    changed: 'Rows gain standard chips, a "need work" badge and the class first-try meter, plus a Use button that starts Create an Activity with the set filled in.' },
  { n: '6b', name: 'Set editor', view: <SetEditor />,
    why: 'Closing the loop: the editor shows how each question played, so a teacher can fix a misleading item (item analysis, distractor analysis). Question, answers and details in three columns, one job each.',
    changed: 'The question list shows per-question results; the selected question shows its most picked wrong answer; set details (subject, grades, standards, tags) sit beside it instead of a separate panel.' },
  { n: '7a', name: 'Reports: class overview', view: <ClassReport />,
    why: 'Each chart answers one question and ends with a takeaway and a next step: data turns into a decision (formative assessment, Black and Wiliam; Few). Length on a common scale is read most accurately (Cleveland and McGill, from memory). Color plus a dashed 80% line, never color alone.',
    changed: 'Today: 5 number tiles and a sortable table grouped by student, question, set, game, day or team. New: accuracy over time, by Common Core skill, most missed questions, time on task and days played, each with a takeaway and button. The table stays one tab deeper.' },
  { n: '7b', name: 'Reports: one Activity', view: <ActivityReport />,
    why: 'Retry growth makes feedback visible: if many students fix an answer on the second try, the feedback taught (Hattie: feedback is among the largest effects). The most common wrong answer is a misconception to reteach, not just a miss.',
    changed: 'New page. Uses the fields reports.ts already has (first try, right, topWrong, avgSeconds, tries) per question and per student, sorted by need.' },
  { n: '7c', name: 'Reports: one student', view: <StudentReport />,
    why: 'Self-referenced growth (compared with his own start, never classmates) supports competence without social comparison (self-determination theory). Skills as Mastered, Practicing, Not yet uses mastery language, not grades.',
    changed: 'Today the student page lists assigned sets and a report. New: growth line with his starting point, skills in three bands, stickers earned, recent play and the teacher\'s own notes; Family report prints it.' },
  { n: '7d', name: 'Small group and 1:1 (interventionists)', view: <SmallGroup />,
    why: 'Progress monitoring with a goal line and an aim line is standard practice in intervention (curriculum-based measurement, from memory). Decision rule shown in words: on track, or below the aim line, with the next step.',
    changed: 'New. A goal the teacher writes, one small chart per student with the 80% goal and aim line, minutes, the most common slip and a next-step button for each.' },
  { n: '7e', name: 'Print or PDF report', view: <PrintReport />,
    why: 'Her rule (2026-11-16): letterhead, at a glance, students with trend, questions to practice, how it is measured. A plain sentence summary first serves families and principals who will not read a table (plain language).',
    changed: 'Same sections as today\'s print page, tightened onto a letter page with a skills strip, a focus column per student and the measurement notes at the foot.' },
  { n: '8', name: 'Achievements', view: <Achievements />,
    why: 'Stickers reward playing and trying, never scores, so every child can earn them and intrinsic motivation is protected (overjustification effect). A visible collection with how-to-earn captions gives a goal that builds (goal-gradient effect).',
    changed: 'New page, using the Starter collection: earned in full color, locked in gray with the how-to-earn caption in full-strength words, a progress bar and Show on the big screen.' },
  { n: '9', name: 'First run and empty states', view: <FirstRun />,
    why: 'Endowed progress (1 of 3 already done because the class is added) and one highlighted next step lower the start cost. Empty states explain what will appear and why, instead of a blank card (NN/g empty states, from memory).',
    changed: 'Today GetStarted is a checklist elsewhere. New: the first home is the checklist, the example report is one click away, and every empty card says what will fill it.' },
];

export default function TeacherPortal() {
  return (
    <section className="grid gap-6">
      <div className="grid gap-1 justify-items-center text-center">
        <h2 className="font-heading text-2xl">Teacher portal <Proposal /></h2>
        <p className="text-sm font-semibold text-muted max-w-prose">A redesign of the real teacher pages, laptop first at 1440 x 900: a left rail, a home with one next step, and reports where every chart ends in a plain takeaway and a button. Students are never ranked; private views say so. Example data. Preview only: no live page changes until you approve.</p>
      </div>
      <div className="grid gap-12">
        {VIEWS.map((v) => (
          <figure key={v.n} id={`tp-${v.n}`} className="m-0 grid gap-3 content-start">
            <figcaption className="font-heading text-lg">{v.n}. {v.name}</figcaption>
            <Laptop w={1440}>{v.view}</Laptop>
            <p className="text-sm font-semibold max-w-[70rem]"><b>Why:</b> {v.why}</p>
            <p className="text-sm font-semibold text-muted -mt-1 max-w-[70rem]"><b>What changed vs today:</b> {v.changed}</p>
          </figure>
        ))}
      </div>
    </section>
  );
}
