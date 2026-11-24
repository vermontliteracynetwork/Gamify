import type { ReactNode } from 'react';
import {
  ArrowCounterClockwise, ArrowLeft, ArrowRight, Broadcast, Chalkboard, ChalkboardTeacher, ChartBar, Check, CheckCircle, CornersIn, CornersOut,
  Copy, DownloadSimple, GameController, GearSix, House, Info, Lightbulb, Lightning, LinkSimple, List, LockSimple, LockSimpleOpen,
  MagnifyingGlass, Moon, Palette, Pause, PencilSimple, PersonArmsSpread, Play, Plus, Printer, Question, ShareNetwork, SignIn, SignOut,
  SpeakerHigh, SpeakerSlash, Stack, Star, Sticker, Student, Television, Timer, Toolbox, Trash, Trophy, UploadSimple, User, UsersThree,
  WarningCircle, X, type Icon,
} from '@phosphor-icons/react';
import { PP } from './PaletteProposal';
import { CrayonDie, CrayonPowerUp } from './CrayonKit';

// Icons (PROPOSAL, teacher 2026-11-23: "add consistent icons to the brand
// kit"). One library (Phosphor Icons, MIT, already in the ledger), one icon
// per job, one weight (bold), four sizes, ink color, inside a round button
// with a 2px ink edge. The doodle crayon kit stays separate: in-game art only.
// Preview only: no live screen changes until she approves.

const I = PP.ink;
type Job = { name: string; icon: Icon; use: string; not?: string };
const GROUPS: { title: string; jobs: Job[] }[] = [
  { title: 'Every screen', jobs: [
    { name: 'Settings', icon: GearSix, use: 'Open settings', not: 'SlidersHorizontal' },
    { name: 'Full screen', icon: CornersOut, use: 'Go full screen', not: 'ArrowsOutSimple' },
    { name: 'Leave full screen', icon: CornersIn, use: 'Exit full screen' },
    { name: 'Accessibility', icon: PersonArmsSpread, use: 'Reading and motion help' },
    { name: 'Close', icon: X, use: 'Close a box, leave a game', not: 'XCircle' },
    { name: 'Back', icon: ArrowLeft, use: 'Back a step', not: 'CaretLeft, ArrowFatLeft' },
    { name: 'Next', icon: ArrowRight, use: 'Next step, Go', not: 'CaretRight, ArrowFatRight' },
    { name: 'Home', icon: House, use: 'Home page', not: 'HouseSimple' },
    { name: 'Menu', icon: List, use: 'Open the main menu' },
    { name: 'Help', icon: Question, use: 'How it works' },
    { name: 'Info', icon: Info, use: 'Hover tip on a field' },
    { name: 'Search', icon: MagnifyingGlass, use: 'Find a set, game or theme' },
  ] },
  { title: 'Play and sound', jobs: [
    { name: 'Play', icon: Play, use: 'Start, Play, Play again' },
    { name: 'Pause', icon: Pause, use: 'Pause a game' },
    { name: 'Replay', icon: ArrowCounterClockwise, use: 'Play again, undo', not: 'ArrowsClockwise, ArrowClockwise' },
    { name: 'Listen', icon: SpeakerHigh, use: 'Read aloud' },
    { name: 'Mute', icon: SpeakerSlash, use: 'Stop reading, sound off' },
    { name: 'Timer', icon: Timer, use: 'Time limits, the clock', not: 'Clock, HourglassMedium' },
    { name: 'Power-up', icon: Lightning, use: 'Power-up settings (art is the crayon kit)' },
    { name: 'Hint', icon: Lightbulb, use: 'Hint' },
    { name: 'Tools', icon: Toolbox, use: 'Calculator, scratchpad' },
    { name: 'Calm', icon: Moon, use: 'Calm mode' },
  ] },
  { title: 'Making and sharing', jobs: [
    { name: 'Add', icon: Plus, use: 'New set, add a player' },
    { name: 'Edit', icon: PencilSimple, use: 'Edit a set or name', not: 'Pencil, PencilSimpleLine' },
    { name: 'Delete', icon: Trash, use: 'Delete (always asks first)' },
    { name: 'Share', icon: ShareNetwork, use: 'Share an Activity', not: 'PaperPlaneTilt' },
    { name: 'Copy', icon: Copy, use: 'Copy a code or link', not: 'CopySimple' },
    { name: 'Link', icon: LinkSimple, use: 'Homework link' },
    { name: 'Download', icon: DownloadSimple, use: 'Templates, reports', not: 'ArrowLineDown' },
    { name: 'Upload', icon: UploadSimple, use: 'Import a set, upload art' },
    { name: 'Print', icon: Printer, use: 'Print a sheet' },
    { name: 'Locked', icon: LockSimple, use: 'Locked game cover, PIN', not: 'Lock, LockKey' },
    { name: 'Unlocked', icon: LockSimpleOpen, use: 'Unlocked' },
    { name: 'Sign in', icon: SignIn, use: 'Sign in, join' },
    { name: 'Sign out', icon: SignOut, use: 'Sign out' },
  ] },
  { title: 'People and ways to play', jobs: [
    { name: 'Teams', icon: UsersThree, use: 'Teams, players', not: 'Users' },
    { name: 'Student', icon: Student, use: 'One student' },
    { name: 'Teacher', icon: ChalkboardTeacher, use: 'Teacher pages', not: 'GraduationCap' },
    { name: 'Class', icon: Chalkboard, use: 'A class list' },
    { name: 'Share mode', icon: Television, use: 'One screen up front' },
    { name: 'Live mode', icon: Broadcast, use: 'Every student on a device' },
    { name: 'Solo mode', icon: User, use: 'One player', not: 'UserCircle' },
  ] },
  { title: 'Games and results', jobs: [
    { name: 'Game', icon: GameController, use: 'Games, the Arcade' },
    { name: 'Theme', icon: Palette, use: 'Themes, the studio' },
    { name: 'Question set', icon: Stack, use: 'Question sets' },
    { name: 'Results', icon: ChartBar, use: 'Reports and results' },
    { name: 'Winner', icon: Trophy, use: 'Winner, top score', not: 'Crown, Medal' },
    { name: 'Stickers', icon: Sticker, use: 'Stickers earned' },
    { name: 'Points', icon: Star, use: 'Points, Rate' },
    { name: 'Done', icon: Check, use: 'Picked, on, saved' },
    { name: 'Right', icon: CheckCircle, use: 'Right answer, all good' },
    { name: 'Warning', icon: WarningCircle, use: 'Something needs a look', not: 'Warning' },
  ] },
];

// Found in the live code (fix later, not now). file:line from a grep, 2026-11-23.
const AUDIT: [string, string][] = [
  ['Weights mixed: 433 bold, 423 fill, 2 regular, plus conditional fill/regular', 'src/owner/ProductionLine.tsx:141, src/owner/ProductionLine.tsx:215, src/beta/TeacherSurvey.tsx:34'],
  ['Close: X and XCircle', 'src/public/DeviceCheckPage.tsx:41'],
  ['Back and next: Arrow, Caret and ArrowFat', 'src/engine/ResultsModal.tsx:140, src/ui/Breadcrumbs.tsx:68, src/lab/games/prize-crane/Game.tsx:289'],
  ['Home: House and HouseSimple', 'src/ui/Breadcrumbs.tsx:70, src/ui/NavBar.tsx:57'],
  ['Copy: Copy and CopySimple', 'src/teacher/QuestionSetsPage.tsx:132, src/teacher/SetEditorPage.tsx:102'],
  ['Lock: LockSimple, Lock and LockKey', 'src/public/SignInGate.tsx:60, src/public/AudiencePages.tsx:191'],
  ['Timer: Timer, Clock and HourglassMedium', 'src/engine/playClock.tsx:55, src/public/StatusPage.tsx:35, src/live/LiveStudent.tsx:35'],
  ['Teams: UsersThree and Users; Solo: User and UserCircle', 'src/games/FourWays.tsx:135, src/ui/TeacherNav.tsx:37, src/public/JoinPage.tsx:107'],
  ['Teacher: ChalkboardTeacher and GraduationCap', 'src/ui/NavBar.tsx:34, src/public/WaysPage.tsx:76'],
  ['Replay: ArrowCounterClockwise, ArrowsClockwise and ArrowClockwise', 'src/engine/ResultsModal.tsx:182, src/lab/games/unscramble/Game.tsx:413, src/theme/builder/DrawStudio.tsx:474'],
  ['Full screen: CornersOut and ArrowsOutSimple', 'src/theme/builder/DrawStudio.tsx:536'],
  ['Winner: Trophy, Crown and Medal', 'src/public/ChallengePage.tsx:22, src/engine/ScoreBoard.tsx:61, src/public/ChallengePage.tsx:36'],
  ['Settings: GearSix and SlidersHorizontal', 'src/public/HowToPlayPage.tsx:72, src/live/LiveHost.tsx:268'],
  ['Warning: WarningCircle and Warning', 'src/public/BetaKitPage.tsx:35'],
  ['Share: PaperPlaneTilt as a send/share icon', 'src/student/DesignPage.tsx:129'],
];

function IconBtn({ icon: Ic, size = 24, label }: { icon: Icon; size?: number; label: string }) {
  const box = Math.max(44, Math.round(size * 2));
  return <span aria-label={label} className="rounded-full grid place-items-center shrink-0" style={{ width: box, height: box, background: PP.paper, border: `2px solid ${I}`, boxShadow: `0 2px 0 ${I}`, color: I }}><Ic weight="bold" size={size} /></span>;
}
function Panel({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 justify-items-center text-center rounded-[1.5rem] p-6" style={{ background: PP.paper, border: `2px solid ${I}` }}>
      <div><h3 className="font-heading text-xl">{title}</h3>{note && <p className="text-sm font-semibold" style={{ color: PP.quiet }}>{note}</p>}</div>
      {children}
    </section>
  );
}
function Rule({ ok, title, children }: { ok: boolean; title: string; children: ReactNode }) {
  return (
    <div className="grid gap-3 justify-items-center text-center rounded-[1.25rem] p-4" style={{ background: ok ? PP.mint : PP.blush, border: `2px solid ${I}` }}>
      <span className="inline-flex items-center gap-2 font-bold">{ok ? <Check weight="bold" size={20} /> : <X weight="bold" size={20} />}{ok ? 'Do' : 'Don’t'}: {title}</span>
      <div className="flex gap-3 items-center justify-center min-h-14">{children}</div>
    </div>
  );
}

export default function IconSet() {
  return (
    <section className="grid gap-6">
      <div className="grid gap-1 justify-items-center text-center">
        <h2 className="font-heading text-2xl">Icons <span className="text-base align-middle px-2 py-0.5 rounded-full border-2 border-black bg-[#fdfd94]">Proposal</span></h2>
        <p className="text-sm font-semibold text-muted max-w-prose">One library (Phosphor Icons, MIT), one icon for each job, always bold, in ink, inside a round button with a 2px ink edge. The doodle crayon kit is for art inside games, never for buttons.</p>
      </div>

      <Panel title="Sizes" note="16 in text and chips, 20 in buttons with words, 24 in round icon buttons, 32 on big student targets. Round buttons are never under 44px.">
        <div className="flex flex-wrap gap-8 items-end justify-center">
          {[16, 20, 24, 32].map((s) => <div key={s} className="grid justify-items-center gap-2"><IconBtn icon={GearSix} size={s} label={`Settings, ${s}px`} /><span className="text-sm font-bold">{s}px</span></div>)}
        </div>
      </Panel>

      {GROUPS.map((g) => (
        <Panel key={g.title} title={g.title}>
          <div className="w-full grid gap-3 justify-center" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 10rem))' }}>
            {g.jobs.map((j) => (
              <div key={j.name} className="grid justify-items-center content-start gap-1.5 p-3 rounded-[1rem] text-center" style={{ background: PP.cream, border: `2px solid ${I}` }}>
                <IconBtn icon={j.icon} label={j.name} />
                <b className="leading-tight">{j.name}</b>
                <span className="text-xs font-semibold leading-snug" style={{ color: PP.quiet }}>{j.use}</span>
                {j.not && <span className="text-[11px] font-bold leading-snug" style={{ color: '#9b2c2c' }}>Not: {j.not}</span>}
              </div>
            ))}
          </div>
        </Panel>
      ))}

      <Panel title="Do and don't">
        <div className="w-full grid gap-3 sm:grid-cols-2">
          <Rule ok title="one weight, bold"><IconBtn icon={X} label="Close" /><IconBtn icon={Play} label="Play" /><IconBtn icon={SpeakerHigh} label="Listen" /></Rule>
          <Rule ok={false} title="mixed weights"><span className="w-12 h-12 grid place-items-center"><X weight="thin" size={26} /></span><span className="w-12 h-12 grid place-items-center"><Play weight="fill" size={26} /></span><span className="w-12 h-12 grid place-items-center"><SpeakerHigh weight="duotone" size={26} /></span></Rule>
          <Rule ok={false} title="emoji as icons"><span className="px-3 py-2 rounded-lg font-bold text-sm" style={{ border: `2px dashed ${I}` }}>No emoji on buttons, labels or headings</span></Rule>
          <Rule ok={false} title="a second icon library"><span className="px-3 py-2 rounded-lg font-bold text-sm" style={{ border: `2px dashed ${I}` }}>Phosphor only: no other icon packs</span></Rule>
          <Rule ok title="one icon per job"><IconBtn icon={ArrowLeft} label="Back" /><IconBtn icon={ArrowRight} label="Next" /></Rule>
          <Rule ok={false} title="three arrows for one job"><span className="flex gap-2"><ArrowLeft weight="bold" size={26} /><span className="text-xl font-bold">&lsaquo;</span><span className="text-xl font-bold">&#8678;</span></span></Rule>
        </div>
      </Panel>

      <Panel title="In-game art stays separate" note="The doodle crayon kit draws power-ups, dice and pieces inside games. It is never used as a button icon, and icons are never used as game art.">
        <div className="flex gap-6 items-center justify-center">
          <CrayonPowerUp id="double-points" size={72} /><CrayonPowerUp id="shield" size={72} /><CrayonPowerUp id="freeze" size={72} /><CrayonDie value={4} size={72} />
        </div>
      </Panel>

      <Panel title="Found in the live code (fix later)" note="From a grep of 171 files that import Phosphor, 2026-11-23. Nothing is changed yet.">
        <table className="w-full text-sm text-left">
          <thead><tr><th className="p-2">What</th><th className="p-2">Where (file:line)</th></tr></thead>
          <tbody>{AUDIT.map(([w, f]) => <tr key={w} style={{ borderTop: `1px solid ${PP.quiet}` }}><td className="p-2 font-bold align-top">{w}</td><td className="p-2 font-mono text-xs align-top break-all">{f}</td></tr>)}</tbody>
        </table>
      </Panel>
    </section>
  );
}
