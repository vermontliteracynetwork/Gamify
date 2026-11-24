import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  ArrowCounterClockwise, ArrowLeft, ArrowRight, ArrowsClockwise, CaretDown, CaretLeft, CaretRight, ChartBar, Check, CheckCircle, CornersOut, DownloadSimple, Eraser,
  FileCsv, GameController, GearSix, House, Info, Lightbulb, LockSimple, MagicWand, MagnifyingGlass, PaintBrush, Palette, PencilSimple, Plus, Printer,
  Question, SpeakerHigh, Stack, Star, Sticker as StickerIcon, Trash, UploadSimple, UserCircle, UsersThree, WarningCircle, WifiHigh, X,
} from '@phosphor-icons/react';
import { LAB_GAMES, LAB_MODES, FAMILIES } from '../lab/registry';
import { WAITING } from '../owner/waiting';
import { BlobPatch, CrayonDie, CrayonPowerUp, Doodle, type PowerId } from './CrayonKit';
import { GAME_COVERS } from './GameMockups';
import { Badge, type Team, Fit, GameTools, GO_YELLOW, IconBadge, Laptop, Meter, PhoneTools, PURPLE_GROUND, TEAMS, TURN_SHADE, DeviceSet, useFrame, WAYS_STYLE, GText } from './mockKit';
import { PP } from './PaletteProposal';
import { PATTERNS } from './PatternProposal';
import { SiteFooter, SiteNav } from './PublicPages';

// More screens (PROPOSAL, teacher 2026-11-24: "have the design team update the
// /brand page ... so when i request a push and have everything be redesigned,
// i would have seen and approved everything already"). Every live screen the
// other tabs did not show yet, redesigned in the New direction: teacher pages
// laptop first (the Teacher portal tab's rail and cards), student screens iPad
// first with a phone layout, public pages on a laptop and a phone. Example data
// only; nothing here is wired to a live page. Palette, newest (2026-11-24):
// Grape with white text and Lavender lead; no Gamify periwinkle.

const I = PP.ink;
const Q = PP.quiet;
const GY: CSSProperties = { fontFamily: 'var(--font-display)', fontWeight: 400, lineHeight: 1, textTransform: 'uppercase' };
const CARD: CSSProperties = { background: PP.paper, borderRadius: 18, border: `2px solid ${I}`, boxShadow: `0 3px 0 ${I}` };
const quiet = PATTERNS.find((p) => p.id === 'quiet')!.make(false);
const pastelGround = PATTERNS.find((p) => p.id === 'cutpaper-pastel')!.make(false);

// ================= shared parts =================
function Btn({ children, main, go, small, wide }: { children: ReactNode; main?: boolean; go?: boolean; small?: boolean; wide?: boolean }) {
  const look: CSSProperties = go ? { background: GO_YELLOW, color: I, boxShadow: `0 3px 0 ${I}` } : main ? { background: PP.grape, color: '#ffffff', boxShadow: `0 3px 0 ${PP.grapeDeep}` } : { background: '#ffffff', color: I, boxShadow: `0 3px 0 ${I}` };
  return <span className={`${small ? 'h-9 px-3.5 text-[14px]' : 'h-11 px-5 text-[15px]'} ${wide ? 'w-full justify-center' : ''} rounded-full font-bold inline-flex items-center gap-2 whitespace-nowrap shrink-0`} style={{ ...look, border: `2px solid ${I}` }}>{children}</span>;
}
function Chip({ children, bg = PP.lavender }: { children: ReactNode; bg?: string }) {
  return <span className="h-7 px-2.5 rounded-full text-[13px] font-bold inline-flex items-center gap-1.5 whitespace-nowrap" style={{ background: bg }}>{children}</span>;
}
function Toggle({ on }: { on?: boolean }) {
  return <span aria-hidden="true" className="relative inline-block shrink-0 rounded-full" style={{ width: 52, height: 30, background: on ? PP.kelly : '#e3e2ea', border: `2px solid ${I}` }}><span className="absolute top-[3px] rounded-full" style={{ width: 20, height: 20, left: on ? 26 : 4, background: '#ffffff', border: `2px solid ${I}` }} /></span>;
}
function Round({ children, label, size = 44 }: { children: ReactNode; label: string; size?: number }) {
  return <span aria-label={label} className="rounded-full grid place-items-center shrink-0" style={{ width: size, height: size, background: '#ffffff', border: `2px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}>{children}</span>;
}
function Field({ label, value, hint, w }: { label: string; value?: string; hint?: string; w?: number | string }) {
  return (
    <label className="grid gap-1.5" style={{ width: w }}>
      <span className="font-bold text-[15px]">{label}</span>
      <span className="h-12 rounded-[12px] px-3.5 flex items-center text-[16px] font-semibold" style={{ background: '#ffffff', border: `2px solid ${I}`, color: value ? I : Q }}>{value ?? 'Type here'}</span>
      {hint && <span className="text-[14px] font-semibold" style={{ color: Q }}>{hint}</span>}
    </label>
  );
}

// ---------- the teacher shell (same rail as the Teacher portal tab) ----------
type NavId = 'home' | 'classes' | 'activities' | 'sets' | 'reports' | 'achievements' | 'themes' | 'account';
const NAV: { id: NavId; label: string; icon: typeof House }[] = [
  { id: 'home', label: 'Home', icon: House }, { id: 'classes', label: 'Classes', icon: UsersThree }, { id: 'activities', label: 'Activities', icon: GameController },
  { id: 'sets', label: 'Question sets', icon: Stack }, { id: 'reports', label: 'Reports', icon: ChartBar }, { id: 'achievements', label: 'Achievements', icon: StickerIcon },
  { id: 'themes', label: 'Themes', icon: Palette }, { id: 'account', label: 'Account', icon: UserCircle },
];
function Shell({ active, title, crumb, actions, children }: { active: NavId; title: string; crumb?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="w-full h-full flex text-[15px]" style={{ ...quiet, color: I }}>
      <nav aria-label="Teacher pages" className="w-[232px] shrink-0 h-full flex flex-col gap-1.5 px-4 py-5" style={{ background: PP.paper, borderRight: `2px solid ${I}` }}>
        <img src="/brand/gamify-wordmark.png" alt="Gamify" className="h-10 w-auto self-start mb-3" draggable={false} />
        <span className="h-12 rounded-full font-bold inline-flex items-center justify-center gap-2 text-[15px] mb-3" style={{ background: PP.grape, color: '#ffffff', border: `2px solid ${I}`, boxShadow: `0 3px 0 ${PP.grapeDeep}` }}><Plus weight="bold" size={18} />Create an Activity</span>
        {NAV.map((n) => { const Ic = n.icon; const on = n.id === active; return (
          <span key={n.id} aria-current={on ? 'page' : undefined} className="h-11 px-3 rounded-[12px] inline-flex items-center gap-3 font-bold" style={on ? { background: PP.lavender, boxShadow: `inset 4px 0 0 ${PP.grape}` } : undefined}><Ic weight="bold" size={20} />{n.label}</span>
        ); })}
      </nav>
      <main className="flex-1 min-w-0 h-full flex flex-col gap-4 px-8 py-5">
        <header className="flex items-center gap-4 min-h-[60px] shrink-0">
          <div className="grid gap-1 min-w-0 flex-1">{crumb && <span className="text-[13px] font-bold" style={{ color: Q }}>{crumb}</span>}<h1 className="m-0 text-[32px]" style={GY}><GText>{title}</GText></h1></div>
          {actions}
        </header>
        <div className="flex-1 min-h-0">{children}</div>
      </main>
    </div>
  );
}
function Card({ title, right, children, className = '', style }: { title?: ReactNode; right?: ReactNode; children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <section className={`flex flex-col min-h-0 ${className}`} style={{ ...CARD, padding: 18, ...style }}>
      {title && <header className="flex items-center gap-2 mb-3"><h3 className="font-heading font-bold text-[16px] m-0">{title}</h3><span className="flex-1" />{right}</header>}
      {children}
    </section>
  );
}

// ================= teacher pages (laptop 1440 x 900) =================
const CSV_ROWS: [string, string, string, string, string, string, boolean][] = [
  ['1', 'Which word needs a capital letter?', 'monday', 'apple', 'run', '1', true],
  ['2', 'Pick the sentence with punctuation at the end.', 'I like cats.', 'I like cats', 'i like cats', '1', true],
  ['3', 'Which is a past tense verb?', 'jumped', 'jump', 'jumping', '', false],
  ['4', 'What goes at the end of a question?', 'question mark', 'period', 'comma', '1', true],
  ['5', 'Which name needs a capital letter?', 'sam', 'dog', 'tree', '1', true],
  ['6', 'Pick the word that shows the past.', 'walked', 'walk', 'walks', '1', true],
  ['7', 'Which is a list with commas?', 'red, blue, green', 'red blue green', 'red. blue. green', '1', true],
  ['8', 'Which sentence is a question?', 'Can you run?', 'I can run.', 'Run fast!', '1', true],
];
function ImportView() {
  return (
    <Shell active="sets" crumb="Question sets" title="Import a spreadsheet" actions={<Btn><DownloadSimple weight="bold" size={18} />Download a sample file</Btn>}>
      <div className="h-full grid grid-cols-[380px_1fr] gap-5">
        <div className="grid gap-4 content-start">
          <Card title="1. Choose your file">
            <div className="grid justify-items-center gap-3 rounded-[14px] p-6 text-center" style={{ border: `2.5px dashed ${I}`, background: PP.lavender }}>
              <IconBadge size={64} bg={PP.paper} ring><FileCsv weight="bold" size={30} /></IconBadge>
              <b className="text-[17px]">Drop a CSV file here</b>
              <Btn main><UploadSimple weight="bold" size={18} />Choose a CSV file</Btn>
            </div>
            <p className="m-0 mt-3 text-[14px] font-semibold leading-snug" style={{ color: Q }}>Columns: Question #, Question Text, Answer 1 to 4, Correct Answer #.</p>
          </Card>
          <Card title="2. Name it"><Field label="Name for this set" value="Capitals and punctuation" /></Card>
        </div>
        <Card title="3. Check what we found" right={<Chip bg={PP.mint}><CheckCircle weight="bold" size={14} />7 questions ready</Chip>}>
          <div className="rounded-[12px] overflow-hidden" style={{ border: `2px solid ${I}` }}>
            <div className="grid grid-cols-[44px_2fr_1.15fr_1.05fr_1.05fr_100px] gap-x-3 font-bold text-[14px] px-3 py-2" style={{ background: PP.lavender }}>{['#', 'Question', 'Answer 1', 'Answer 2', 'Answer 3', 'Right'].map((h) => <span key={h}>{h}</span>)}</div>
            {CSV_ROWS.map(([n, q, a, b, c, r, ok]) => (
              <div key={n} className="grid grid-cols-[44px_2fr_1.15fr_1.05fr_1.05fr_100px] gap-x-3 items-center px-3 py-2.5 text-[15px] font-semibold" style={{ borderTop: `1px solid rgba(29,26,51,0.15)`, background: ok ? PP.paper : PP.blush }}>
                <span>{n}</span><span className="pr-3 leading-snug">{q}</span><span>{a}</span><span>{b}</span><span>{c}</span>
                <span className="font-bold">{ok ? `Answer ${r}` : <span className="inline-flex items-center gap-1"><WarningCircle weight="bold" size={16} />Missing</span>}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-[12px] px-4 py-3" style={{ background: PP.butter }}>
            <Lightbulb weight="bold" size={20} />
            <p className="m-0 flex-1 font-bold text-[15px] leading-snug">Row 3 has no right answer. Fix it in the spreadsheet and import again, or save the good rows now.</p>
          </div>
          <div className="mt-auto pt-4 flex justify-end gap-3"><Btn>Cancel</Btn><Btn go><Check weight="bold" size={18} />Save 7 questions</Btn></div>
        </Card>
      </div>
    </Shell>
  );
}

function AccountView() {
  return (
    <Shell active="account" title="Account">
      <div className="h-full grid grid-cols-[1.2fr_1fr] gap-5">
        <div className="grid gap-4 content-start">
          <Card title="You">
            <div className="grid grid-cols-2 gap-4"><Field label="Name" value="Ms. Rivera" /><Field label="Email" value="rivera@school.org" /><Field label="Username" value="msrivera" hint="Students never see this." /><Field label="Teacher PIN" value="••••" hint="Guards student supports and settings." /></div>
          </Card>
          <Card title="Your plan: Plus" right={<Chip bg={PP.butter}>Until June 30, 2027</Chip>}>
            <p className="m-0 font-semibold leading-snug">Up to 3 classes and unlimited saved question sets. Your classes have answered 4,812 questions in Gamify so far, with 24 students and 9 question sets of your own.</p>
            <p className="m-0 mt-2 text-[14px] font-semibold leading-snug" style={{ color: Q }}>If your plan gets smaller, nothing is deleted.</p>
            <div className="mt-3 flex gap-3"><Btn main>See plans</Btn><Btn>Billing and receipts</Btn></div>
          </Card>
        </div>
        <div className="grid gap-4 content-start">
          <Card title="Download everything"><p className="m-0 font-semibold leading-snug">One file with your question sets, classes, students, assignments and every answer.</p><div className="mt-3"><Btn><DownloadSimple weight="bold" size={18} />Download my data</Btn></div></Card>
          <Card title="Delete everything" style={{ background: PP.blush }}>
            <p className="m-0 font-semibold leading-snug">Deletes all your classes, students, sets and reports on this device and logs you out. This cannot be undone.</p>
            <div className="mt-3 grid gap-3"><Field label="Type DELETE to confirm" /><span><Btn><Trash weight="bold" size={18} />Delete all my data</Btn></span></div>
          </Card>
          <Card title="Log out"><Btn>Log out of Gamify</Btn></Card>
        </div>
      </div>
    </Shell>
  );
}

// Theme Builder (her rules 2026-11-16 to 2026-11-19): one bar on top (name,
// Save, tabs), upload cards in two columns (title only, size in hover text),
// color circles with names, the real game preview big with page-turn arrows
// and the board size under it. No title piece (2026-11-24).
const PIECES = ['Background', 'Card back', 'Grid square', 'Team 1 icon', 'Team 2 icon', 'Team 3 icon', 'Team 4 icon', 'Cover'];
function ThemeBuilderView() {
  const cover = GAME_COVERS.find((c) => c.id === 'game-show');
  return (
    <div className="w-full h-full flex flex-col" style={{ ...quiet, color: I }}>
      <div className="flex items-center gap-4 px-6 h-[64px] shrink-0" style={{ background: '#fbfcf8', borderBottom: `3px solid ${I}` }}>
        <img src="/brand/gamify-wordmark.png" alt="Gamify" className="h-8 w-auto" draggable={false} />
        <span className="h-11 px-4 rounded-[12px] inline-flex items-center gap-2 font-bold text-[17px]" style={{ background: '#ffffff', border: `2px solid ${I}` }}>Snow Day<PencilSimple weight="bold" size={16} /></span>
        <span className="flex gap-1">{['Pieces', 'Power-ups', 'Colors', 'Sounds'].map((t, i) => <span key={t} className="h-10 px-4 rounded-full inline-flex items-center font-bold" style={i === 0 ? { background: PP.lavender, border: `2px solid ${I}` } : { border: '2px solid transparent' }}>{t}</span>)}</span>
        <span className="ml-auto flex gap-3"><Btn>Preview as a student</Btn><Btn go><Check weight="bold" size={18} />Save</Btn></span>
      </div>
      <div className="flex-1 min-h-0 grid grid-cols-[440px_1fr] gap-6 p-6">
        <div className="grid gap-3 content-start">
          <div className="grid grid-cols-2 gap-3">
            {PIECES.map((p, i) => (
              <div key={p} className="grid gap-2 p-3" style={CARD} title="Size and what it is in hover text">
                <b className="text-[15px] leading-tight">{p}</b>
                <span className="h-[70px] rounded-[10px] grid place-items-center" style={i < 2 ? { background: i ? PP.blueCrystal : PP.aqua, border: `2px solid ${I}` } : { border: `2px dashed ${I}`, background: '#ffffff' }}>{i < 2 ? <Check weight="bold" size={22} /> : <UploadSimple weight="bold" size={22} />}</span>
                <span className="flex items-center justify-between"><Round label="Draw" size={34}><PaintBrush weight="bold" size={15} /></Round><Toggle on={i > 1} /><Round label="Remove" size={34}><Trash weight="bold" size={15} /></Round></span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 p-3" style={CARD}>{([['Board', PP.sky], ['Cards', PP.paper], ['Text', I], ['Glow', PP.lemon]] as const).map(([n, c]) => <span key={n} className="grid justify-items-center gap-1 text-[13px] font-bold"><span className="w-10 h-10 rounded-full" style={{ background: c, border: `2px solid ${I}` }} />{n}</span>)}</div>
        </div>
        <div className="grid grid-rows-[1fr_auto] gap-3 min-h-0">
          <div className="relative rounded-[22px] overflow-hidden" style={{ border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}` }}>{cover && <Fit w={720} h={648}><div className="relative w-full h-full">{cover.cover}</div></Fit>}
            <span className="absolute left-3 top-1/2 -translate-y-1/2"><Round label="Previous screen" size={48}><CaretLeft weight="bold" size={22} /></Round></span>
            <span className="absolute right-3 top-1/2 -translate-y-1/2"><Round label="Next screen" size={48}><CaretRight weight="bold" size={22} /></Round></span>
          </div>
          <div className="flex justify-center gap-2">{['Board, 4 x 4', 'Board, 5 x 5', 'Power-up card', 'Results'].map((t, i) => <Chip key={t} bg={i === 0 ? PP.butter : PP.paper}>{t}</Chip>)}</div>
        </div>
      </div>
    </div>
  );
}

// Pick a game (/play, the teacher's game list): the three ways are filter
// circles, cards are big covers with small mode dots, no intro line.
function PickGameView() {
  return (
    <div className="w-full h-full flex flex-col" style={{ ...PURPLE_GROUND, color: I }}>
      <SiteNav w={1440} on="Home" />
      <div className="flex-1 min-h-0 px-16 py-6 grid grid-rows-[auto_1fr] gap-5">
        <div className="flex items-center gap-4">
          <h1 className="m-0 text-[40px]" style={GY}><GText>Pick a game</GText></h1>
          <span className="ml-auto flex gap-3">{(['Share', 'Live', 'Solo'] as const).map((w) => { const s = WAYS_STYLE[w]; const Ic = s.icon; return <span key={w} title={w} className="w-12 h-12 rounded-full grid place-items-center" style={{ background: s.bright, border: `2px solid ${I}` }}><Ic weight="bold" size={22} /></span>; })}</span>
        </div>
        <div className="grid grid-cols-4 gap-5 content-start">
          {GAME_COVERS.map((g) => (
            <div key={g.id} className="grid gap-2 p-2.5" style={CARD}>
              <div className="rounded-[12px] overflow-hidden" style={{ border: `2px solid ${I}` }}><Fit w={720} h={648}><div className="relative w-full h-full">{g.cover}</div></Fit></div>
              <div className="flex items-center gap-2 px-1"><b className="text-[22px] flex-1" style={GY}><GText>{g.name}</GText></b>{g.modes.map((m) => { const s = WAYS_STYLE[m as keyof typeof WAYS_STYLE]; if (!s) return null; const Ic = s.icon; return <span key={m} title={m} className="w-8 h-8 rounded-full grid place-items-center" style={{ background: s.bright, border: `2px solid ${I}` }}><Ic weight="bold" size={15} /></span>; })}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// The owner desktop stays plain (her rule 2026-11-13): grayscale, purple accents, one screen, Waiting on you first.
const G = { bg: '#f4f4f6', line: '#d4d4da', text: '#26262c', soft: '#6b6b75' };
function OwnerView() {
  const sections = ['Dashboard', 'Waiting on you', 'Agent team', 'Road to release', 'Income forecast', 'Subscriptions', 'Usage', 'Tell Gamify reports', 'Gallery review', 'Beta and surveys', 'Access codes and beta plans', 'Bookkeeping'];
  return (
    <div className="w-full h-full flex text-[15px]" style={{ background: G.bg, color: G.text, fontFamily: 'var(--font-heading)' }}>
      <nav className="w-[250px] shrink-0 h-full px-4 py-5 grid content-start gap-1" style={{ background: '#ffffff', borderRight: `1px solid ${G.line}` }}>
        <b className="text-[18px] mb-3 px-3">Developer view</b>
        {sections.map((s, i) => <span key={s} className="h-10 px-3 rounded-[8px] flex items-center font-semibold" style={i === 0 ? { background: '#ece8ff', color: PP.grapeDeep, fontWeight: 700 } : undefined}>{s}</span>)}
      </nav>
      <main className="flex-1 min-w-0 p-7 grid grid-rows-[auto_auto_1fr] gap-5">
        <h1 className="m-0 text-[26px] font-bold">Dashboard</h1>
        <div className="grid grid-cols-4 gap-4">{[['Teachers', '128'], ['Students playing this week', '1,904'], ['Paid plans', '17'], ['Days to launch', '6']].map(([l, v]) => <div key={l} className="rounded-[10px] px-4 py-3 bg-white" style={{ border: `1px solid ${G.line}` }}><span className="text-[13px] font-semibold" style={{ color: G.soft }}>{l}</span><b className="block text-[28px]">{v}</b></div>)}</div>
        <div className="grid grid-cols-[1.4fr_1fr] gap-4 min-h-0">
          <section className="rounded-[10px] bg-white p-4 min-h-0 overflow-hidden" style={{ border: `1px solid ${G.line}` }}>
            <h2 className="m-0 mb-3 text-[17px] font-bold flex items-center gap-2">Waiting on you<span className="text-[13px] px-2 rounded-full" style={{ background: PP.grape, color: '#fff' }}>{WAITING.length}</span></h2>
            {WAITING.slice(0, 6).map((w) => <div key={w.id} className="py-2.5 grid gap-0.5" style={{ borderTop: `1px solid ${G.line}` }}><b className="text-[15px] leading-snug">{w.title}</b><span className="text-[13px] font-semibold" style={{ color: G.soft }}>{w.kind} · added {w.added}</span></div>)}
          </section>
          <section className="rounded-[10px] bg-white p-4" style={{ border: `1px solid ${G.line}` }}>
            <h2 className="m-0 mb-3 text-[17px] font-bold">Agent team</h2>
            {[['Design Chair', 'Brand page approval list'], ['Classic Art Director', 'Reviewing Territory art'], ['Claudia', 'Game reviews'], ['Beth', 'Sales research']].map(([a, t]) => <div key={a} className="py-2.5 flex items-center gap-3" style={{ borderTop: `1px solid ${G.line}` }}><span className="w-2.5 h-2.5 rounded-full" style={{ background: PP.grape }} /><b className="w-[170px]">{a}</b><span className="font-semibold" style={{ color: G.soft }}>{t}</span></div>)}
          </section>
        </div>
      </main>
    </div>
  );
}


// ================= student screens (every device) =================
function useK() {
  const f = useFrame();
  const phone = f.w < 600, portrait = f.h > f.w;
  const k = phone ? 0.82 : portrait ? f.w / 880 : Math.min(f.w / 1280, f.h / 800);
  return { ...f, phone, portrait, k, px: (n: number) => Math.round(n * k) };
}
function StuBar({ tools = true }: { tools?: boolean }) {
  const { phone, px } = useK();
  return (
    <div className="flex items-center shrink-0" style={{ height: phone ? 56 : px(68), padding: `0 ${phone ? 14 : px(40)}px`, background: '#fbfcf8', borderBottom: '3px solid #000' }}>
      <img src="/brand/gamify-wordmark.png" alt="Gamify" className="w-auto" style={{ height: phone ? 24 : px(34) }} draggable={false} />
      {tools && <span className="ml-auto flex gap-2"><Round label="Settings" size={44}><GearSix weight="bold" size={20} /></Round><Round label="Full screen" size={44}><CornersOut weight="bold" size={20} /></Round></span>}
    </div>
  );
}
function Stu({ children, tools, ground = PURPLE_GROUND }: { children: ReactNode; tools?: boolean; ground?: CSSProperties }) {
  const { phone, px } = useK();
  return (
    <div className="w-full h-full flex flex-col" style={{ ...ground, color: I }}>
      <StuBar tools={tools} />
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center" style={{ padding: phone ? 16 : px(32), gap: phone ? 14 : px(22) }}>{children}</div>
    </div>
  );
}
function H({ children, size = 56 }: { children: ReactNode; size?: number }) {
  const { phone, px } = useK();
  return <h1 className="m-0" style={{ ...GY, fontSize: phone ? Math.round(size * 0.62) : px(size) }}><GText>{children}</GText></h1>;
}
function Txt({ children, size = 22 }: { children: ReactNode; size?: number }) {
  const { phone, px } = useK();
  return <p className="m-0 font-semibold leading-snug max-w-[40rem]" style={{ fontSize: phone ? Math.max(16, Math.round(size * 0.78)) : px(size) }}>{children}</p>;
}
function Go({ children }: { children: ReactNode }) {
  const { phone, px } = useK();
  return <span className="rounded-full font-display font-bold inline-flex items-center justify-center gap-3 whitespace-nowrap" style={{ minHeight: phone ? 56 : px(64), padding: `0 ${phone ? 28 : px(40)}px`, fontSize: phone ? 22 : px(26), background: GO_YELLOW, border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}` }}>{children}</span>;
}
function Back({ children = 'Back' }: { children?: ReactNode }) {
  const { phone, px } = useK();
  return <span className="rounded-full font-bold inline-flex items-center gap-2 whitespace-nowrap" style={{ minHeight: phone ? 52 : px(56), padding: `0 ${phone ? 22 : px(26)}px`, fontSize: phone ? 18 : px(20), background: '#ffffff', border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}` }}><ArrowLeft weight="bold" size={18} />{children}</span>;
}

// Settings, the whole panel (accessibility merged in, her rule 2026-11-24).
const TABS = ['Quick', 'Sound', 'Calm', 'Accessibility', 'Reading', 'Play', 'Teacher'];
const ACCESS: [string, ReactNode][] = [
  ['Text size', <span key="t" className="flex gap-1.5">{['A', 'A', 'A'].map((a, i) => <span key={i} className="w-11 h-11 rounded-[10px] grid place-items-center font-bold" style={{ fontSize: 14 + i * 5, background: i === 1 ? PP.lavender : '#ffffff', border: `2px solid ${I}` }}>{a}</span>)}</span>],
  ['High contrast', <Toggle key="h" />], ['Color-blind friendly colors', <Toggle key="c" on />], ['Extra space between letters and lines', <Toggle key="e" />],
  ['Tap only (no dragging or holding)', <Toggle key="tp" on />], ['Left-handed layout', <Toggle key="l" />],
  ['Time to read before answering', <span key="r" className="flex items-center gap-2"><span className="relative w-28 h-3 rounded-full" style={{ background: '#e3e2ea', border: `2px solid ${I}` }}><span className="absolute inset-y-0 left-0 w-1/2 rounded-full" style={{ background: PP.grape }} /><span className="absolute -top-2 left-[calc(50%-10px)] w-5 h-5 rounded-full bg-white" style={{ border: `2px solid ${I}` }} /></span><b className="text-[15px]">3 s</b></span>],
];
function SettingsView() {
  const { phone, portrait, px } = useK();
  const stack = phone || portrait;
  return (
    <div className="w-full h-full relative" style={PURPLE_GROUND}>
      <div className="absolute inset-0" style={{ background: 'rgba(29,26,51,0.45)' }} />
      <div className="absolute inset-0 grid place-items-center" style={{ padding: phone ? 12 : px(32) }}>
        <div className="w-full flex flex-col" style={{ ...CARD, borderRadius: 26, maxWidth: phone ? 366 : px(940), padding: phone ? 16 : px(26), color: I }}>
          <div className="relative flex items-center justify-center mb-4 min-h-[44px]"><h2 className="m-0" style={{ ...GY, fontSize: phone ? 34 : px(46) }}><GText>Settings</GText></h2><span className="absolute right-0"><Round label="Close"><X weight="bold" size={20} /></Round></span></div>
          <div className={stack ? 'grid gap-3' : 'grid grid-cols-[210px_1fr] gap-6'}>
            <div className={phone ? 'grid grid-cols-3 gap-1.5' : portrait ? 'grid grid-cols-4 gap-2' : 'grid gap-1.5 content-start'}>
              {TABS.map((t) => <span key={t} className="rounded-[14px] grid place-items-center font-bold text-center leading-tight" style={{ minHeight: phone ? 44 : 48, fontSize: phone ? 13 : px(18), padding: '0 4px', background: t === 'Accessibility' ? PP.lavender : '#ffffff', border: `2px solid ${I}` }}>{t}</span>)}
            </div>
            <div className="grid gap-2">
              {ACCESS.map(([l, c]) => <div key={l} className="flex items-center justify-between gap-3 rounded-[14px] px-4 text-left font-bold" style={{ minHeight: phone ? 52 : px(58), fontSize: phone ? 16 : px(19), background: PP.paper, border: `2px solid ${I}` }}><span className="leading-tight">{l}</span>{c}</div>)}
              <p className="m-0 text-left font-semibold leading-snug" style={{ fontSize: phone ? 14 : px(15), color: Q }}>Supports a teacher set for this student come first and stay locked behind the teacher PIN.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Draw studio (/arcade/design): a student draws or photographs each piece.
function DrawView() {
  const { phone, portrait, px } = useK();
  const colors = [I, PP.grape, PP.sky, PP.pink, PP.lemon, PP.orange, PP.kelly, PP.teal];
  const tools: [ReactNode, string][] = [[<PencilSimple key="p" weight="bold" size={20} />, 'Pen'], [<Eraser key="e" weight="bold" size={20} />, 'Eraser'], [<MagicWand key="m" weight="bold" size={20} />, 'Restore'], [<ArrowCounterClockwise key="u" weight="bold" size={20} />, 'Undo'], [<UploadSimple key="up" weight="bold" size={20} />, 'Photo'], [<ArrowsClockwise key="s" weight="bold" size={20} />, 'Start over']];
  const canvas = (
    <div className="relative rounded-[22px] grid place-items-center" style={{ background: '#ffffff', border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}`, width: phone ? 300 : portrait ? px(620) : px(520), aspectRatio: '1 / 1' }}>
      <span className="absolute rounded-full" style={{ inset: '9%', border: `3px dashed ${PP.grape}` }} aria-label="Safe area" />
      <span className="relative"><CrayonPowerUp id="double-points" size={phone ? 150 : px(240)} /></span>
      <span className="absolute left-3 top-3"><Chip bg={PP.butter}>Team 1 icon · 256 x 256</Chip></span>
    </div>
  );
  const toolRow = <div className={phone || portrait ? 'flex flex-wrap justify-center gap-2' : 'grid grid-cols-3 gap-x-3 gap-y-2 justify-items-center'}>{tools.map(([ic, l], i) => <span key={l} className="grid justify-items-center gap-1 font-bold" style={{ fontSize: phone ? 13 : px(15) }}><span className="w-12 h-12 rounded-full grid place-items-center" style={{ background: i === 0 ? PP.lavender : '#ffffff', border: `2px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}>{ic}</span>{l}</span>)}</div>;
  const colorRow = <div className="flex flex-wrap justify-center gap-2">{colors.map((c, i) => <span key={c} className="w-10 h-10 rounded-full" style={{ background: c, border: `3px solid ${i === 1 ? I : '#ffffff'}`, boxShadow: i === 1 ? `0 0 0 3px ${PP.lemon}` : `0 0 0 2px ${I}` }} />)}</div>;
  const pieces = ['Card back', 'Team 1 icon', 'Team 2 icon', 'Background'];
  return (
    <Stu>
      <H size={44}>Draw your pieces</H>
      {phone || portrait ? (
        <>
          <div className="flex flex-wrap justify-center gap-2">{pieces.map((p, i) => <Chip key={p} bg={i === 1 ? PP.butter : PP.paper}>{p}</Chip>)}</div>
          {canvas}{toolRow}{colorRow}
          <div className="flex gap-3"><Back /><Go>Send to my teacher</Go></div>
        </>
      ) : (
        <div className="flex items-center gap-8">
          <div className="grid gap-2 w-[200px]">{pieces.map((p, i) => <span key={p} className="h-12 rounded-[14px] px-4 flex items-center font-bold" style={{ background: i === 1 ? PP.butter : PP.paper, border: `2px solid ${I}` }}>{p}</span>)}</div>
          {canvas}
          <div className="grid gap-4 w-[240px] justify-items-center">{toolRow}{colorRow}<Go>Send to my teacher</Go><Back /></div>
        </div>
      )}
    </Stu>
  );
}

// Choice board (/choose, Pro): the teacher's picked games as big covers.
function ChooseView() {
  const { phone, portrait, px } = useK();
  const picks = GAME_COVERS.filter((g) => ['game-show', 'castle-quest', 'bubble-pop'].includes(g.id));
  const w = phone ? 160 : portrait ? px(360) : px(330);
  return (
    <Stu tools={false}>
      <H>Pick a game</H>
      <div className={`grid gap-4 ${phone ? 'grid-cols-2' : portrait ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {picks.map((g) => (
          <div key={g.id} className="grid gap-2 p-2" style={{ ...CARD, width: w }}>
            <div className="rounded-[12px] overflow-hidden" style={{ border: `2px solid ${I}` }}><Fit w={720} h={648}><div className="relative w-full h-full">{g.cover}</div></Fit></div>
            <b style={{ ...GY, fontSize: phone ? 18 : px(26) }}><GText>{g.name}</GText></b>
          </div>
        ))}
      </div>
    </Stu>
  );
}

// Look up here (/look-up): nothing to tap, so every student looks up.
function LookUpView() {
  const { phone, px } = useK();
  const s = phone ? 200 : px(300);
  return (
    <Stu tools={false}>
      <span className="relative grid place-items-center" style={{ width: s, height: s }}>
        <BlobPatch color={PP.butter} variant={2} size={s} />
        <motion.span className="relative" animate={{ y: [0, -10, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}><Star weight="fill" size={s * 0.5} color={PP.lemon} style={{ stroke: I, strokeWidth: 8 }} /></motion.span>
        <Doodle kind="sparkle" color={PP.pink} size={28} className="absolute" style={{ top: 10, right: 16 }} /><Doodle kind="dot" color={PP.sky} size={14} className="absolute" style={{ bottom: 22, left: 14 }} />
      </span>
      <H size={72}>Eyes up here</H>
      <Txt size={26}>Time is up. Your teacher will start the next game.</Txt>
    </Stu>
  );
}

// Share mirror (/mirror/:code): the big screen's question close up, view only.
function MirrorView() {
  const { phone, px } = useK();
  const tiles = ['Monday', 'apple', 'blue', 'run'];
  const tint = [PP.blush, PP.butter, PP.mint, PP.blueCrystal];
  return (
    <Stu tools={false} ground={pastelGround}>
      <div className="w-full grid gap-4 text-left" style={{ ...CARD, borderRadius: 26, maxWidth: phone ? 360 : px(900), padding: phone ? 16 : px(28) }}>
        <div className="flex items-center gap-3"><Chip bg={PP.lavender}>Watch the big screen</Chip><span className="ml-auto flex gap-2"><Round label="Settings"><GearSix weight="bold" size={20} /></Round><Round label="Listen"><SpeakerHigh weight="bold" size={20} /></Round></span></div>
        <p className="m-0 font-heading font-bold leading-tight" style={{ fontSize: phone ? 24 : px(40) }}>Which word starts with a capital letter?</p>
        <div className={`grid gap-3 ${phone ? '' : 'grid-cols-2'}`}>{tiles.map((t, i) => <span key={t} className="flex items-center gap-3 rounded-[16px] px-4 font-bold" style={{ minHeight: phone ? 54 : px(72), fontSize: phone ? 20 : px(28), background: tint[i], border: `2px solid ${I}` }}><span className="w-10 h-10 rounded-full grid place-items-center text-[18px] shrink-0" style={{ background: PP.paper, border: `2px solid ${I}` }}>{'ABCD'[i]}</span>{t}</span>)}</div>
      </div>
      <Txt size={20}>Your text size, contrast and read-aloud follow your own settings.</Txt>
    </Stu>
  );
}

// Loading: the die tumbles (a quiet fade in Still motion).
function LoadingView() {
  const { phone, px } = useK();
  const [face, setFace] = useState(1);
  useLayoutEffect(() => { const t = window.setInterval(() => setFace((f) => (f % 6) + 1), 700); return () => window.clearInterval(t); }, []);
  return (
    <Stu tools={false}>
      <motion.span animate={{ rotate: [0, -10, 8, 0], y: [0, -14, 0, 0] }} transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}><CrayonDie value={face} size={phone ? 110 : px(150)} title="Loading" /></motion.span>
      <H size={52}>Getting ready</H>
      <span className="w-[min(20rem,80%)]"><Meter segments={1} done={0} part={0.6} width="100%" label="Loading" /></span>
    </Stu>
  );
}

// Not found and something went wrong: one calm card, one way out.
function OopsView({ error }: { error?: boolean }) {
  const { phone, px } = useK();
  const s = phone ? 160 : px(220);
  return (
    <Stu tools={false}>
      <span className="relative grid place-items-center" style={{ width: s, height: s }}>
        <BlobPatch color={error ? PP.peach : PP.lavender} variant={error ? 3 : 1} size={s} />
        <span className="relative">{error ? <CrayonPowerUp id="tornado" size={s * 0.62} /> : <Question weight="bold" size={s * 0.5} />}</span>
        <Doodle kind="sparkle" color={PP.lemon} size={26} className="absolute" style={{ top: 6, right: 10 }} />
      </span>
      <H size={60}>{error ? 'Something went wrong' : 'This page is not here'}</H>
      <Txt>{error ? 'Your game is saved. Try again, and if it keeps happening, tell your teacher.' : 'The link may be old. Check the code with your teacher.'}</Txt>
      <div className={`flex gap-3 ${phone ? 'flex-col items-center' : ''}`}>{error ? <><Go><ArrowsClockwise weight="bold" size={22} />Try again</Go><Back>Home</Back></> : <Go>Join with a code<ArrowRight weight="bold" size={22} /></Go>}</div>
    </Stu>
  );
}

// Class check-in (beta surveys): each student walks up and taps a face.
// Smile emoji faces (teacher, 2026-11-24: "class check in (but updated with
// smile emoji faces instead)"): round yellow faces drawn in code, big grin,
// small smile, little frown.
function EmojiFace({ mood, size }: { mood: 0 | 1 | 2; size: number }) {
  const mouth = mood === 0 ? 'M30 58 Q50 80 70 58 Q50 70 30 58 Z' : mood === 1 ? 'M34 64 L66 64' : 'M33 68 Q50 56 67 68';
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <circle cx="50" cy="50" r="44" fill={PP.lemon} stroke={I} strokeWidth="5" />
      <ellipse cx="36" cy="40" rx="5" ry="7" fill={I} /><ellipse cx="64" cy="40" rx="5" ry="7" fill={I} />
      <path d={mouth} fill={mood === 0 ? I : 'none'} stroke={I} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      {mood === 0 && <><circle cx="26" cy="56" r="5" fill={PP.blush} /><circle cx="74" cy="56" r="5" fill={PP.blush} /></>}
    </svg>
  );
}
function CheckInView() {
  const { phone, px } = useK();
  const opts: [0 | 1 | 2, string, string][] = [[0, 'Loved it', PP.butter], [1, 'It was OK', PP.blueCrystal], [2, 'Not for me', PP.blush]];
  const w = phone ? 104 : px(230);
  return (
    <Stu>
      <H>How was this game?</H>
      <div className="flex gap-3 justify-center">{opts.map(([m, l, c]) => <span key={l} className="grid justify-items-center gap-2 p-3" style={{ ...CARD, width: w, background: c }}><EmojiFace mood={m} size={phone ? 64 : px(130)} /><b style={{ fontSize: phone ? 15 : px(24) }}>{l}</b></span>)}</div>
      <Txt size={20}>No names are kept. Only how many tapped each face.</Txt>
    </Stu>
  );
}

// ================= Game Lab =================
const FAMILY_ART: Record<string, [PowerId, string]> = {
  'Quiz boards': ['mystery-box', PP.lavender], 'Word games': ['hint', PP.butter], 'Arcade answers': ['lightning', PP.blush],
  'Team shows': ['spin-wheel', PP.blueCrystal], 'Classic arcade': ['double-points', PP.mint], 'Quest and build': ['treasure-chest', PP.peach],
};
const MODE_WAY: Record<string, keyof typeof WAYS_STYLE> = { share: 'Share', solo: 'Solo', live: 'Live' };
function LabIndexPage({ w }: { w: number }) {
  const ph = w < 600, pad = ph ? 20 : 64;
  return (
    <div style={{ width: w, ...PURPLE_GROUND, backgroundSize: '100% auto', backgroundRepeat: 'repeat-y', color: I }}>
      <SiteNav w={w} />
      <main className="grid gap-6" style={{ padding: `${ph ? 24 : 40}px ${pad}px 56px` }}>
        <header className={`flex gap-4 ${ph ? 'flex-col items-center text-center' : 'items-center'}`}>
          <h1 className="m-0" style={{ ...GY, fontSize: ph ? 40 : 56 }}><GText>Game Lab</GText></h1>
          <span className={`flex gap-2 ${ph ? '' : 'ml-auto'}`}>{(['Share', 'Solo'] as const).map((m) => { const s = WAYS_STYLE[m]; const Ic = s.icon; return <span key={m} className="min-h-11 px-4 rounded-full inline-flex items-center gap-2 font-bold text-[16px]" style={{ background: s.soft, border: `2px solid ${I}` }}><Ic weight="bold" size={18} />{m}</span>; })}</span>
        </header>
        {FAMILIES.map((f) => {
          const list = LAB_GAMES.filter((g) => g.family === f);
          if (!list.length) return null;
          const [art, tint] = FAMILY_ART[f] ?? ['mystery-box', PP.lavender];
          return (
            <section key={f} className="grid gap-3">
              <h2 className="m-0 font-heading font-bold" style={{ fontSize: ph ? 20 : 24 }}>{f}</h2>
              <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${ph ? 2 : 5}, minmax(0, 1fr))` }}>
                {list.map((g) => (
                  <div key={g.id} className="grid gap-1.5 content-start p-3" style={CARD}>
                    <span className="h-[64px] rounded-[12px] grid place-items-center" style={{ background: tint }}><CrayonPowerUp id={art} size={48} /></span>
                    <b className="leading-tight" style={{ ...GY, fontSize: ph ? 17 : 20 }}><GText>{g.name}</GText></b>
                    {!ph && <span className="text-[14px] font-semibold leading-snug" style={{ color: Q }}>{g.blurb}</span>}
                    <span className="flex gap-1.5">{(LAB_MODES[g.id] ?? []).map((m) => { const s = WAYS_STYLE[MODE_WAY[m] ?? 'Solo']; const Ic = s.icon; return <span key={m} title={MODE_WAY[m]} className="w-7 h-7 rounded-full grid place-items-center" style={{ background: s.bright, border: `2px solid ${I}` }}><Ic weight="bold" size={13} /></span>; })}</span>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}

// One sample Lab game in Classic (Tic Tac Toe): the pattern all Lab games
// follow: the top strip (name left, meter centered, tools right), the board
// in the middle on its themed ground, the scoreboard beside it with no panel.
const BOARD = ['sky', '', 'pink', '', 'sky', '', 'pink', '', ''];
function LabGameView() {
  const { phone, portrait, px } = useK();
  const sky = TEAMS[1], pink = TEAMS[2];
  const cell = phone ? 96 : portrait ? px(200) : px(170);
  const board = (
    <div className="grid grid-cols-3 gap-2.5 p-3 rounded-[24px]" style={{ background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}` }}>
      {BOARD.map((c, i) => <span key={i} className="rounded-[16px] grid place-items-center" style={{ width: cell, height: cell, background: i % 2 ? PP.lavender : PP.blueCrystal, border: `2.5px solid ${I}` }}>{c && <Badge t={c === 'sky' ? sky : pink} size={cell * 0.66} />}</span>)}
    </div>
  );
  const row = (t: Team, score: number, now: boolean) => (
    <div className="flex items-center gap-3 rounded-[16px] px-3" style={{ minHeight: phone ? 52 : px(64), background: now ? TURN_SHADE : 'transparent' }}>
      <Badge t={t} size={phone ? 34 : px(44)} /><b className="flex-1 text-left" style={{ fontSize: phone ? 17 : px(22) }}>{t.name}</b><span style={{ ...GY, fontSize: phone ? 28 : px(40) }}><GText>{score}</GText></span>
    </div>
  );
  const scores = <div className="grid gap-2" style={{ width: phone ? 300 : px(300) }}>{row(sky, 2, true)}{row(pink, 1, false)}</div>;
  return (
    <div className="w-full h-full flex flex-col" style={{ ...pastelGround, color: I }}>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 shrink-0" style={{ padding: phone ? '10px 12px' : `${px(14)}px ${px(28)}px`, background: 'rgba(255,250,240,0.92)', borderBottom: `3px solid ${I}` }}>
        <b className="text-left" style={{ fontSize: phone ? 16 : px(22) }}>{sky.name}</b>
        <Meter segments={5} done={2} part={0.5} width={phone ? 110 : px(260)} label="Round 3 of 5" />
        <span className="justify-self-end">{phone ? <PhoneTools /> : <GameTools size={44} />}</span>
      </div>
      <div className={`flex-1 min-h-0 flex items-center justify-center ${phone || portrait ? 'flex-col' : ''}`} style={{ gap: phone ? 16 : px(40), padding: phone ? 12 : px(24) }}>
        {board}{scores}
      </div>
    </div>
  );
}

// ================= public pages (laptop and phone, whole page) =================
function PageFrame({ w, children, label }: { w: number; children: ReactNode; label: string }) {
  const box = useRef<HTMLDivElement>(null); const inner = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0.3); const [h, setH] = useState(400);
  useLayoutEffect(() => {
    const b = box.current, c = inner.current; if (!b || !c) return;
    const fit = () => { const kk = b.clientWidth / w; setK(kk); setH(c.offsetHeight * kk); };
    const ro = new ResizeObserver(fit); ro.observe(b); ro.observe(c); fit();
    return () => ro.disconnect();
  }, [w]);
  const ph = w < 600;
  return (
    <figure className="m-0 grid gap-1 min-w-0 content-start">
      <div className={ph ? 'rounded-[1.1rem] p-[5%]' : 'rounded-[0.8rem] p-[1.6%]'} style={{ background: '#2a2740', border: `2px solid ${I}` }}>
        <div ref={box} data-device={`${ph ? 'phone' : 'laptop'}:${w}`} className="relative overflow-hidden rounded-[0.4rem]" style={{ height: h }}>
          <div ref={inner} className="absolute top-0 left-0 origin-top-left" style={{ width: w, transform: `scale(${k})` }}>{children}</div>
        </div>
      </div>
      <figcaption className="text-xs font-bold text-muted text-center">{label}</figcaption>
    </figure>
  );
}
function Pub({ w, children, student }: { w: number; children: ReactNode; student?: boolean }) {
  const ph = w < 600;
  return <div style={{ width: w, ...PURPLE_GROUND, backgroundSize: '100% auto', backgroundRepeat: 'repeat-y', color: I }}><SiteNav w={w} student={student} /><main style={{ padding: `${ph ? 28 : 48}px ${ph ? 20 : 96}px 0` }}>{children}</main><SiteFooter w={w} student={student} /></div>;
}
const pH1 = (w: number): CSSProperties => ({ ...GY, fontSize: w < 600 ? 40 : 60, margin: 0 });
const pBody = (w: number) => (w < 600 ? 'text-[16px]' : 'text-[18px]');

const TOPICS: [string, string, typeof House][] = [
  ['Getting started', 'Log in, take the Get Started steps and play your first game.', Star], ['Students joining', 'Game codes, links, names and PINs: how students get into a game.', UsersThree],
  ['Question sets', 'Make, import and organize your own question sets.', Stack], ['Playing a game', 'Ways to play, setup pages, teams and running a game live.', GameController],
  ['Themes', 'Pick a theme, or design your own with your class.', Palette], ['Reports', 'Class and student progress reports, ready to print or save as a PDF.', ChartBar],
  ['Supports', 'Read-aloud, extra tries and other supports for each student.', Info], ['Plans and billing', 'Free, Plus and Pro, school quotes and billing.', LockSimple],
];
function HelpCenter({ w }: { w: number }) {
  const ph = w < 600;
  return (
    <Pub w={w}>
      <div className="grid gap-5 justify-items-center text-center">
        <h1 style={pH1(w)}>How can we help?</h1>
        <span className="w-full max-w-[44rem] h-14 rounded-full px-5 flex items-center gap-3 font-semibold text-[18px]" style={{ background: '#ffffff', border: `3px solid ${I}`, color: Q }}><MagnifyingGlass weight="bold" size={22} />Search the Help Center</span>
      </div>
      <div className="grid gap-4 mt-10" style={{ gridTemplateColumns: `repeat(${ph ? 1 : 4}, minmax(0,1fr))` }}>
        {TOPICS.map(([t, d, Ic], i) => (
          <div key={t} className={`p-5 grid gap-2 ${ph ? 'grid-cols-[auto_1fr] items-center text-left' : 'justify-items-center text-center content-start'}`} style={CARD}>
            <IconBadge size={56} bg={[PP.lavender, PP.butter, PP.mint, PP.blueCrystal, PP.blush, PP.aqua, PP.peach, PP.sage][i]} ring><Ic weight="bold" size={26} /></IconBadge>
            <div className="grid gap-1"><b className="font-heading text-[19px]">{t}</b>{!ph && <span className="font-semibold text-[16px] leading-snug" style={{ color: Q }}>{d}</span>}</div>
          </div>
        ))}
      </div>
    </Pub>
  );
}
function HelpArticle({ w }: { w: number }) {
  const ph = w < 600;
  const steps = ['Open Create an Activity from the left rail.', 'Pick who plays and how: Share, Live or Solo.', 'Pick a game, then a question set.', 'Press Start. Students join with the code on the big screen.'];
  return (
    <Pub w={w}>
      <div className={`grid gap-8 ${ph ? '' : 'grid-cols-[1fr_280px]'}`}>
        <article className="grid gap-4 max-w-[760px]">
          <span className="font-bold text-[15px]" style={{ color: Q }}>Help Center · Playing a game</span>
          <h1 className="m-0 font-heading font-bold" style={{ fontSize: ph ? 30 : 40 }}>Run your first game live</h1>
          <span className="font-semibold text-[15px]" style={{ color: Q }}>Updated November 2026</span>
          {steps.map((s, i) => <div key={s} className="flex items-start gap-4 p-4" style={CARD}><span className="w-10 h-10 rounded-full grid place-items-center shrink-0 font-bold" style={{ background: PP.grape, color: '#fff', border: `2px solid ${I}` }}>{i + 1}</span><p className={`m-0 font-semibold leading-snug ${pBody(w)}`}>{s}</p></div>)}
          <div className="flex flex-wrap items-center gap-3 p-4" style={{ ...CARD, background: PP.lavender }}><b className={pBody(w)}>Was this article helpful?</b><Btn>Yes</Btn><Btn>No</Btn></div>
        </article>
        <aside className="grid gap-3 content-start">
          <b className="font-heading text-[18px]">Related articles</b>
          {['Share a join code', 'Put students on teams', 'Pause or end a Live game'].map((r) => <span key={r} className="font-bold underline text-[17px]">{r}</span>)}
          <div className="p-4 grid gap-2 mt-2" style={{ ...CARD, background: PP.butter }}><b>Still need help?</b><span className="font-semibold leading-snug">Tap Tell Gamify at the top of any page and we will get back to you.</span></div>
        </aside>
      </div>
    </Pub>
  );
}

function LegalPage({ w }: { w: number }) {
  const ph = w < 600;
  const parts = ['What we collect', 'What we never collect', 'How long we keep it', 'Your choices', 'Contact us'];
  return (
    <Pub w={w}>
      <div className={`grid gap-8 ${ph ? '' : 'grid-cols-[260px_1fr]'}`}>
        <nav className="grid gap-2 content-start p-4" style={CARD}><b className="font-heading">On this page</b>{parts.map((p) => <span key={p} className="font-semibold text-[16px]">{p}</span>)}</nav>
        <article className="grid gap-5 max-w-[760px]">
          <h1 style={pH1(w)}>Privacy</h1>
          <span className="font-semibold" style={{ color: Q }}>Updated November 2026 · Plain words first, the full policy under each part.</span>
          {parts.slice(0, 3).map((p, i) => <section key={p} className="grid gap-2"><h2 className="m-0 font-heading font-bold text-[24px]">{p}</h2><p className={`m-0 leading-relaxed ${pBody(w)}`}>{['A teacher account email and the question sets, classes and answers you make. Students give only a nickname or tap their name.', 'No student emails, no ads, no trackers, no selling of any data.', 'Until you delete it. Download everything or delete everything from Account at any time.'][i]}</p></section>)}
        </article>
      </div>
    </Pub>
  );
}

function InfoPage({ w }: { w: number }) {
  const qs = ['Do students need an account?', 'Does it work on iPads and Chromebooks?', 'Can I use my own questions?', 'Is accessibility free?'];
  return (
    <Pub w={w}>
      <div className="grid gap-5 max-w-[860px] mx-auto">
        <h1 style={pH1(w)}>Quick Answers</h1>
        <p className={`m-0 font-semibold leading-snug ${pBody(w)}`}>Short answers first. Tap one for the details, or <span className="underline font-bold">search the Help Center</span>.</p>
        {qs.map((q, i) => (
          <div key={q} className="p-5 grid gap-2" style={CARD}>
            <div className="flex items-center gap-3"><b className={`flex-1 font-heading ${w < 600 ? 'text-[18px]' : 'text-[21px]'}`}>{q}</b><CaretDown weight="bold" size={20} style={{ transform: i === 0 ? 'rotate(180deg)' : undefined }} /></div>
            {i === 0 && <p className={`m-0 font-semibold leading-snug ${pBody(w)}`} style={{ color: Q }}>No. Students join with a code from their teacher and tap their name. No student emails, ever.</p>}
          </div>
        ))}
      </div>
    </Pub>
  );
}

function FormPage({ w }: { w: number }) {
  const ph = w < 600;
  return (
    <Pub w={w}>
      <div className="grid gap-5 max-w-[760px] mx-auto">
        <h1 style={pH1(w)}>Pay with a purchase order</h1>
        <p className={`m-0 font-semibold leading-snug ${pBody(w)}`}>Three steps: send this form, get a quote the same school day, then your school pays by purchase order. Nothing is locked while you wait.</p>
        <div className="p-6 grid gap-4" style={CARD}>
          <div className={`grid gap-4 ${ph ? '' : 'grid-cols-2'}`}><Field label="Your name" /><Field label="School email" /><Field label="School or district" /><Field label="How many teachers?" value="12" /></div>
          <Field label="Anything else? (optional)" />
          <span className={ph ? 'grid' : 'justify-self-start'}><Btn go wide={ph}>Send for a quote<ArrowRight weight="bold" size={18} /></Btn></span>
        </div>
      </div>
    </Pub>
  );
}

// A theme guide (/blog/themes/:gameId): the Classic example on screen only,
// marked Example, beside each piece's size and tips; downloads are blank templates.
const GS_PIECES: [string, string, string][] = [['Background', '1920 x 1080', 'Behind the whole board'], ['Card back', '300 x 220', 'The front of each surprise card before it flips'], ['Grid square', '300 x 180', 'One square of the category grid'], ['Team icon', '256 x 256', 'The round badge for each team'], ['Cover', '600 x 600', 'The picture on the game card']];
function GuidePage({ w }: { w: number }) {
  const ph = w < 600;
  const cover = GAME_COVERS.find((c) => c.id === 'game-show');
  return (
    <Pub w={w}>
      <div className="grid gap-6">
        <h1 style={pH1(w)}>Game Show theme guide</h1>
        <div className={`grid gap-6 ${ph ? '' : 'grid-cols-[1.1fr_1fr]'}`}>
          <div className="relative rounded-[22px] overflow-hidden" style={{ border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}` }}>
            {cover && <Fit w={720} h={648}><div className="relative w-full h-full">{cover.cover}</div></Fit>}
            <span className="absolute left-3 top-3 px-3 py-1 rounded-full font-bold text-[15px]" style={{ background: PP.butter, border: `2px solid ${I}` }}>Example: Classic, on screen only</span>
          </div>
          <div className="grid gap-2 content-start">
            {GS_PIECES.map(([n, s, t]) => <div key={n} className="p-3 grid grid-cols-[1fr_auto] gap-x-3 items-center" style={CARD}><b className="text-[17px]">{n}</b><Chip>{s}</Chip><span className="col-span-2 font-semibold text-[15px] leading-snug" style={{ color: Q }}>{t}</span></div>)}
            <div className={`flex gap-3 mt-2 ${ph ? 'flex-col' : ''}`}><Btn go wide={ph}><Printer weight="bold" size={18} />Print blank templates</Btn><Btn wide={ph}><DownloadSimple weight="bold" size={18} />Canva files</Btn></div>
          </div>
        </div>
      </div>
    </Pub>
  );
}

// The printable template sheet: blank outlines at exact sizes, corner squares
// so the cut-out can tell a template photo from digital art.
function TemplateSheet({ w }: { w: number }) {
  const ph = w < 600;
  const corner = (pos: CSSProperties) => <span className="absolute w-5 h-5" style={{ background: I, ...pos }} />;
  return (
    <div style={{ width: w, background: '#e9e7ef', color: I, padding: ph ? 16 : 40 }}>
      <div className="flex items-center gap-3 mb-4"><b className="flex-1 font-heading text-[20px]">Game Show · Card back</b><Btn go small><Printer weight="bold" size={16} />Print</Btn></div>
      <div className="relative mx-auto bg-white" style={{ maxWidth: 820, aspectRatio: '8.5 / 11', border: `1px solid ${G.line}`, padding: ph ? 20 : 48 }}>
        {corner({ left: 12, top: 12 })}{corner({ right: 12, top: 12 })}{corner({ left: 12, bottom: 12 })}{corner({ right: 12, bottom: 12 })}
        <div className="grid grid-cols-2 gap-6 h-full content-center">
          {[0, 1, 2, 3].map((i) => <div key={i} className="grid gap-1"><span className="rounded-[14px]" style={{ aspectRatio: '300 / 220', border: `3px dashed ${I}` }} /><span className="text-[13px] font-bold" style={{ color: Q }}>Card back · 300 x 220 · stay inside the line</span></div>)}
        </div>
      </div>
    </div>
  );
}

function DeviceCheck({ w }: { w: number }) {
  const rows: [ReactNode, string, string, boolean][] = [[<SpeakerHigh key="s" weight="bold" size={24} />, 'Sound', 'You heard the test chime.', true], [<CornersOut key="c" weight="bold" size={24} />, 'Screen size', 'This screen fits every game.', true], [<WifiHigh key="w" weight="bold" size={24} />, 'Internet', 'Fast enough for Live games.', true], [<SpeakerHigh key="r" weight="bold" size={24} />, 'Read-aloud voice', 'Tap to hear a sample voice.', false]];
  return (
    <Pub w={w}>
      <div className="grid gap-4 max-w-[760px] mx-auto">
        <h1 style={pH1(w)}>Check this device</h1>
        {rows.map(([ic, t, d, ok]) => <div key={t} className="flex items-center gap-4 p-4" style={CARD}><IconBadge size={52} bg={ok ? PP.mint : PP.butter} ring>{ic}</IconBadge><div className="flex-1 grid"><b className="text-[19px]">{t}</b><span className="font-semibold" style={{ color: Q }}>{d}</span></div>{ok ? <CheckCircle weight="fill" size={30} color="#15703a" /> : <Btn small>Play sample</Btn>}</div>)}
      </div>
    </Pub>
  );
}

// ================= the list =================
export type MoreScreen = { id: string; area: string; name: string; kind: 'laptop' | 'devices' | 'page'; render: (w?: number) => ReactNode; why: string; art?: boolean };
export const MORE: MoreScreen[] = [
  { id: 'settings', area: 'Every game', name: 'Settings panel, every tab (Accessibility merged in)', kind: 'devices', render: () => <SettingsView />, why: 'One Settings button holds every support, so nothing hides behind a second icon (her rule; recognition over recall, NN/g). Toggles are 52px wide and rows 52 to 58px tall for small fingers (WCAG 2.5.5). Teacher-set supports stay locked behind the PIN, so a child cannot turn off a support by accident.' },
  { id: 'draw', area: 'Student', name: 'Draw studio (student theme design)', kind: 'devices', render: () => <DrawView />, why: 'The piece and its exact size and safe area are always in view, so a kid draws to the template the first time (feedforward). Restore and Start over make mistakes safe, which keeps creative risk-taking up (psychological safety; self-determination: autonomy and competence).' },
  { id: 'choose', area: 'Student', name: 'Choice board', kind: 'devices', render: () => <ChooseView />, why: 'Two or three real covers and nothing else: a bounded choice gives autonomy without overload (choice overload, Iyengar and Lepper, from memory).' },
  { id: 'lookup', area: 'Student', name: 'Eyes up here (time is up)', kind: 'devices', render: () => <LookUpView />, why: 'Nothing to tap and one big gentle loop pulls every head up at once, a visual cue the teacher does not have to say (attention capture, classroom management practice).' },
  { id: 'mirror', area: 'Student', name: 'Share mirror (view only)', kind: 'devices', render: () => <MirrorView />, why: 'The big screen\'s question close up with the child\'s own text size and read-aloud: the same content, their own access (UDL: multiple means of representation). Tiles have no press shade so they read as view only.' },
  { id: 'checkin', area: 'Student', name: 'Class check-in', kind: 'devices', render: () => <CheckInView />, why: 'Pictures, not words, so K-3 can answer (dual coding); no names kept, so answers are honest (social desirability bias).' },
  { id: 'loading', area: 'Every screen', name: 'Loading', kind: 'devices', render: () => <LoadingView />, why: 'A moving brand object and a progress line make a wait feel shorter than a blank screen (perceived performance; NN/g response-time limits, from memory).' },
  { id: '404', area: 'Every screen', name: 'Page not found', kind: 'devices', render: () => <OopsView />, why: 'One plain sentence and one way out; no blame words (error recovery, NN/g heuristic 9). A student page offers Join, never a log in.' },
  { id: 'error', area: 'Every screen', name: 'Something went wrong', kind: 'devices', render: () => <OopsView error />, why: '"Your game is saved" first lowers worry before the fix (loss aversion); Try again is the yellow go button.' },
  { id: 'labgame', area: 'Game Lab', name: 'Sample Lab game in Classic (Tic Tac Toe)', kind: 'devices', art: true, render: () => <LabGameView />, why: 'The pattern all 33 Lab games follow: top strip (name left, meter centered, tools right), the board as the hero, the scoreboard beside it with Butter shading on the active row. One layout across games means kids learn it once (consistency, Jakob\'s law).' },
  { id: 'lab', area: 'Game Lab', name: 'Game Lab index', kind: 'page', render: (w) => <LabIndexPage w={w ?? 1440} />, why: 'Grouped by family with mode dots, so a teacher scans by kind of game first (information scent); all 33 real names and blurbs.' },
  { id: 'import', area: 'Teacher', name: 'Import a spreadsheet', kind: 'laptop', render: () => <ImportView />, why: 'Choose, name, check, save in four visible steps; the bad row is shown in place with the exact fix, and the good rows can still be saved (error prevention and recovery, NN/g heuristics 5 and 9).' },
  { id: 'account', area: 'Teacher', name: 'Account', kind: 'laptop', render: () => <AccountView />, why: 'Value first (what your class has done) before plan limits (framing); delete needs typed DELETE (a deliberate speed bump for an action that cannot be undone).' },
  { id: 'themebuilder', area: 'Teacher', name: 'Theme Builder', kind: 'laptop', render: () => <ThemeBuilderView />, why: 'Her layout rules: one bar on top, two columns of upload cards with the title only, color circles, and the real game preview big with page-turn arrows. Seeing the change live on the real game is direct manipulation (Shneiderman, from memory).' },
  { id: 'pick', area: 'Teacher', name: 'Pick a game', kind: 'laptop', render: () => <PickGameView />, why: 'Real covers carry the choice (picture superiority); the three way circles filter, no intro line (her rule 2026-11-06).' },
  { id: 'owner', area: 'Owner', name: 'Owner desktop (Developer view)', kind: 'laptop', render: () => <OwnerView />, why: 'Kept plain on purpose (her rule 2026-11-13): grayscale with Grape accents, Waiting on you first, one screen, no sticker look. Real Waiting on you items.' },
  { id: 'help', area: 'Public', name: 'Help Center', kind: 'page', render: (w) => <HelpCenter w={w ?? 1440} />, why: 'One big search and a tile per topic, the help-guide pattern teachers already know (Jakob\'s law; her rule 2026-11-16).' },
  { id: 'helparticle', area: 'Public', name: 'Help article', kind: 'page', render: (w) => <HelpArticle w={w ?? 1440} />, why: 'Numbered steps, related articles, Was this helpful, Still need help (procedural chunking; her rule 2026-11-16).' },
  { id: 'legal', area: 'Public', name: 'Legal pages (Privacy, Terms, Accessibility, Student data, Credits)', kind: 'page', render: (w) => <LegalPage w={w ?? 1440} />, why: 'Plain words first, the full text under each part, an On this page list: legal text people can actually read builds trust with schools (plain language guidelines).' },
  { id: 'info', area: 'Public', name: 'Info page template (FAQ, Schools, Homeschool, IT, Status, Beta, Challenge)', kind: 'page', render: (w) => <InfoPage w={w ?? 1440} />, why: 'One reading column with short answers first and details on tap (progressive disclosure); every small info page uses this one template.' },
  { id: 'form', area: 'Public', name: 'Form page template (Purchase order, Permission slip)', kind: 'page', render: (w) => <FormPage w={w ?? 1440} />, why: 'Labels above 48px fields, one column on phones, one yellow button, the steps said up front (form usability research, from memory).' },
  { id: 'guide', area: 'Public', name: 'Theme guide (Blog)', kind: 'page', render: (w) => <GuidePage w={w ?? 1440} />, why: 'The Classic example is on screen only and marked Example; downloads are blank templates (her standing rule). Each piece shows its exact size beside its job.' },
  { id: 'template', area: 'Public', name: 'Printable template sheet', kind: 'page', render: (w) => <TemplateSheet w={w ?? 1440} />, why: 'Corner squares let the upload tell a template photo from digital art (her rule 2026-11-01); dashed safe lines at the exact piece shape.' },
  { id: 'check', area: 'Public', name: 'Device check', kind: 'page', render: (w) => <DeviceCheck w={w ?? 1440} />, why: 'Four checks with a clear pass mark so a teacher trusts the room before class (visibility of system status).' },
];

export default function MoreScreens() {
  return (
    <section className="grid gap-8">
      <div className="grid gap-1 justify-items-center text-center">
        <h2 className="font-heading text-2xl">More screens <span className="text-base align-middle px-2 py-0.5 rounded-full border-2 border-black bg-[#fdfd94]">Proposal</span></h2>
        <p className="text-sm font-semibold text-muted max-w-prose">Every live screen the other tabs did not show yet, in the New direction: student screens on every device, teacher pages laptop first, public pages on a laptop and a phone. Example data. Preview only: no live page changes until you approve.</p>
      </div>
      <nav aria-label="Jump to a screen" className="flex flex-wrap justify-center gap-2">{MORE.map((m) => <a key={m.id} href={`#ms-${m.id}`} className="px-3 py-1.5 rounded-full font-bold text-sm border-2 border-black bg-[#fffaf0] hover:bg-[#fdfd94]">{m.name.split(' (')[0]}</a>)}</nav>
      {MORE.map((m) => (
        <article key={m.id} id={`ms-${m.id}`} className="grid gap-3 scroll-mt-24 pt-6 border-t-2 border-black/20">
          <h3 className="font-heading text-xl">{m.area}: {m.name}</h3>
          <p className="text-sm font-semibold max-w-[70rem]"><b>Why (research):</b> {m.why}</p>
          {m.art && <p className="text-sm font-bold max-w-[70rem]"><LockSimple weight="bold" size={14} className="inline mr-1" />Classic art: waiting for the Classic Art Director&apos;s PASS before it is called done.</p>}
          {m.kind === 'laptop' && <Laptop w={1440}>{m.render()}</Laptop>}
          {m.kind === 'devices' && <DeviceSet adaptive land={m.render()} />}
          {m.kind === 'page' && (
            <div className="flex gap-4 items-start">
              <div style={{ flex: '3 1 0' }} className="min-w-0"><PageFrame w={1440} label="Laptop 1440">{m.render(1440)}</PageFrame></div>
              <div style={{ flex: '1 1 0' }} className="min-w-0"><PageFrame w={390} label="Phone 390">{m.render(390)}</PageFrame></div>
            </div>
          )}
        </article>
      ))}
    </section>
  );
}
