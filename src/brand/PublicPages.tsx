import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowRight, BookOpen, Broadcast, Buildings, ChalkboardTeacher, Check, Heart, House, PaintBrush, Play, ShieldCheck, Stack, UsersThree } from '@phosphor-icons/react';
import { PP } from './PaletteProposal';
import { Doodle } from './CrayonKit';
import { GAME_COVERS } from './GameMockups';
import { GO_YELLOW, PURPLE_GROUND, QuestionCard, WAYS_STYLE, GText } from './mockKit';
import { FINDINGS } from '../public/research';
import { POSTS } from '../public/posts';
import { PRICES_USD_PER_YEAR } from '../config';

// Public pages (PROPOSAL, teacher 2026-11-24: "in the brand tab show mockups
// for the public facing pages with the new design directives"). Real content
// from src/public/* and src/i18n/en.ts, redesigned in the new direction: the
// site's purple ground, one flat paper card per block (no tape, no stacked
// sheets, nothing tilted), the real wordmark in the white top bar, Grow Year in
// capitals for big titles only, Inclusive Sans for everything else, yellow go
// buttons with ink text, palette pairs only, three ways to play (Live, Share,
// Solo). Each page shows on a laptop (1440) and a phone (390); Home and Join
// also on an iPad portrait (820). Pages scroll on the web, so each frame shows
// the whole page at its real width. Preview only: no live page changes until
// she approves.

const I = PP.ink;
const GY: CSSProperties = { fontFamily: 'var(--font-display)', fontWeight: 400, lineHeight: 1, textTransform: 'uppercase' };
const CARD: CSSProperties = { background: PP.paper, border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}`, borderRadius: 28 };
type W = { w: number };
const isPhone = (w: number) => w < 600;
const pad = (w: number) => (isPhone(w) ? 20 : w < 1000 ? 40 : 64);
const COVERS = GAME_COVERS.filter((g) => g.id !== 'territory').slice(0, 6);

// ---------- buttons and type ----------
function Go({ children, w, wide }: W & { children: ReactNode; wide?: boolean }) {
  const ph = isPhone(w);
  return <span className={`${wide ? 'w-full' : ''} inline-flex items-center justify-center gap-2 rounded-full font-bold whitespace-nowrap`} style={{ minHeight: ph ? 52 : 60, padding: `0 ${ph ? 22 : 30}px`, fontSize: ph ? 19 : 22, background: GO_YELLOW, color: I, border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}` }}>{children}</span>;
}
function Plain({ children, w, wide }: W & { children: ReactNode; wide?: boolean }) {
  const ph = isPhone(w);
  return <span className={`${wide ? 'w-full' : ''} inline-flex items-center justify-center gap-2 rounded-full font-bold whitespace-nowrap`} style={{ minHeight: ph ? 52 : 60, padding: `0 ${ph ? 22 : 28}px`, fontSize: ph ? 19 : 21, background: '#fff', color: I, border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}` }}>{children}</span>;
}
function H1({ children, w }: W & { children: ReactNode }) {
  return <h1 style={{ ...GY, fontSize: isPhone(w) ? 44 : w < 1000 ? 64 : 80, lineHeight: 0.95 }}><GText>{children}</GText></h1>;
}
function H2({ children, w, center }: W & { children: ReactNode; center?: boolean }) {
  return <h2 className={center ? 'text-center' : ''} style={{ ...GY, fontSize: isPhone(w) ? 32 : 46, lineHeight: 1 }}><GText>{children}</GText></h2>;
}
function H3({ children, w }: W & { children: ReactNode }) {
  return <h3 className="font-heading font-bold leading-tight" style={{ fontSize: isPhone(w) ? 21 : 24 }}>{children}</h3>;
}
function P({ children, w, big }: W & { children: ReactNode; big?: boolean }) {
  return <p className="font-semibold leading-snug" style={{ fontSize: isPhone(w) ? (big ? 19 : 17) : big ? 22 : 18 }}>{children}</p>;
}
function Section({ children, w, tight }: W & { children: ReactNode; tight?: boolean }) {
  return <section className="grid gap-6" style={{ padding: `${tight ? 24 : isPhone(w) ? 40 : 64}px ${pad(w)}px 0` }}>{children}</section>;
}
// Page title (teacher, 2026-11-24): the title says exactly what the page is,
// left aligned with its subtext under it; never a pill, kicker or extra header
// above it ("its an AI tell").
function PageHead({ w, title, sub, children }: W & { title: string; sub?: string; children?: ReactNode }) {
  return <div className="grid gap-4 justify-items-start text-left"><H1 w={w}>{title}</H1>{sub && <P w={w} big>{sub}</P>}{children}</div>;
}
// A plain in-site link (teacher, 2026-11-24: "add lots of buttons and links to other pages").
function SiteLink({ children }: { children: ReactNode }) {
  return <span className="font-bold text-[17px] inline-flex items-center gap-1.5 underline underline-offset-4">{children}<ArrowRight weight="bold" size={16} /></span>;
}
function IconDot({ children, bg }: { children: ReactNode; bg: string }) {
  return <span className="w-12 h-12 shrink-0 rounded-full grid place-items-center" style={{ background: bg, border: `2.5px solid ${I}` }}>{children}</span>;
}

// ---------- nav and footer ----------
// The white top bar (the real wordmark, never a pill). Student pages (Join and
// every page a student can reach) show ONLY the logo (teacher, 2026-11-24:
// "remove login entirely from student pages"): no log in, no teacher links, no
// Pricing, no price or buy words.
const LINKS = ['Home', 'Features', 'Pricing', 'Research', 'Themes', 'Blog'];
export function SiteNav({ w, student, on }: W & { student?: boolean; on?: string }) {
  const ph = isPhone(w);
  return (
    <header className="flex items-center gap-4" style={{ height: ph ? 60 : 76, padding: `0 ${pad(w)}px`, background: '#fbfcf8', borderBottom: `3px solid #000` }}>
      <img src="/brand/gamify-wordmark.png" alt="Gamify" className="w-auto" style={{ height: ph ? 28 : 38 }} draggable={false} />
      {student ? null
        : ph || w < 1000
          ? <span className="ml-auto flex items-center gap-2"><Pill bg="#fdfd94" w={w}>Log in</Pill><span aria-label="Menu" className="w-11 h-11 rounded-full grid place-items-center font-bold text-xl" style={{ border: '2px solid #000', background: '#fff' }}>☰</span></span>
          : <nav className="ml-auto flex items-center gap-1">
              {LINKS.map((l) => <span key={l} className="px-3 py-2 rounded-full font-bold text-[18px]" style={on === l ? { background: PP.butter, border: `2px solid ${I}` } : { border: '2px solid transparent' }}>{l}</span>)}
              <span className="ml-2 flex gap-2"><Pill bg={PP.lavender} w={w}>Join</Pill><Pill bg="#fdfd94" w={w}>Log in</Pill></span>
            </nav>}
    </header>
  );
}
function Pill({ children, bg, w }: W & { children: ReactNode; bg: string }) {
  return <span className="rounded-full font-bold whitespace-nowrap inline-flex items-center" style={{ minHeight: 44, padding: '0 18px', fontSize: isPhone(w) ? 16 : 18, background: bg, border: '2.5px solid #000' }}>{children}</span>;
}
// The footer tag line is changing (teacher, 2026-11-24); her new words are not
// in yet, so a marked slot shows the current line until she sends them.
const FOOTER_TAG = 'Made in Vermont by the Vermont Literacy Network.';
function FooterTagSlot() {
  return (
    <span className="inline-flex flex-wrap items-center gap-2 justify-self-start rounded-[12px] px-3 py-1.5" style={{ border: `2px dashed ${I}`, background: 'rgba(253,253,148,0.45)' }}>
      <b className="text-[13px] uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: PP.butter, border: `1.5px solid ${I}` }}>Placeholder: new line coming</b>
      <span className="font-semibold text-[15px]" style={{ color: PP.quiet }}>{FOOTER_TAG}</span>
    </span>
  );
}
export function SiteFooter({ w, student }: W & { student?: boolean }) {
  const ph = isPhone(w);
  const cols: [string, string[]][] = student
    ? [['Help', ['How to play', 'Help Center', 'Student data promise']]]
    : [['Gamify', ['Features', 'Pricing', 'Research', 'Themes', 'Blog']], ['For you', ['Teachers', 'Schools and districts', 'Homeschool', 'Join the beta test']], ['Trust', ['Student data promise', 'Accessibility', 'Privacy', 'Terms', 'Help Center']]];
  return (
    <footer className="mt-16 grid gap-6" style={{ padding: `${ph ? 32 : 48}px ${pad(w)}px ${ph ? 36 : 48}px`, background: '#fbfcf8', borderTop: '3px solid #000' }}>
      <div className={`grid gap-8 ${ph ? '' : student ? 'grid-cols-[1.3fr_1fr]' : 'grid-cols-[1.3fr_repeat(3,1fr)]'}`}>
        <div className="grid gap-3 content-start">
          <img src="/brand/gamify-wordmark.png" alt="Gamify" className="w-auto" style={{ height: 34, width: 'auto', justifySelf: 'start' }} draggable={false} />
          <P w={w}>Every question becomes a game. No ads, no trackers, no student emails.</P>
        </div>
        {cols.map(([h, ls]) => <div key={h} className="grid gap-2 content-start"><b className="font-heading text-[18px]">{h}</b>{ls.map((l) => <span key={l} className="font-semibold text-[17px]">{l}</span>)}</div>)}
      </div>
      <FooterTagSlot />
    </footer>
  );
}
function Page({ w, children, on, student }: W & { children: ReactNode; on?: string; student?: boolean }) {
  return <div style={{ width: w, ...PURPLE_GROUND, backgroundSize: '100% auto', backgroundRepeat: 'repeat-y', color: I }}><SiteNav w={w} on={on} student={student} />{children}<SiteFooter w={w} student={student} /></div>;
}

// A game cover card for the Home hero: the game's own screen from the Game
// mockups miniatures, cropped to fill the card (no mat, no tilt, no tape), with
// its name on a small paper tag so a teacher can read which game it is.
// The cover art is 720 x 648; its game screen sits at (27, 113), 666 x 414.
function CoverCard({ g, cw, ch }: { g: (typeof COVERS)[number]; cw: number; ch: number }) {
  const s = Math.max(cw / 666, ch / 414);
  return (
    <span aria-hidden="true" className="block relative overflow-hidden rounded-[22px]" style={{ width: cw, height: ch, border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}`, background: PP.paper }}>
      <span className="absolute top-0 left-0 origin-top-left" style={{ width: 720, height: 648, transform: `translate(${cw / 2 - 360 * s - 3}px, ${ch / 2 - 320 * s - 3}px) scale(${s})` }}>{g.cover}</span>
      <span className="absolute left-3 bottom-3 rounded-full px-3 font-bold whitespace-nowrap inline-flex items-center" style={{ minHeight: cw < 220 ? 26 : 32, fontSize: cw < 220 ? 13 : 16, background: PP.paper, border: `2px solid ${I}` }}>{g.name}</span>
    </span>
  );
}

// ================= Home =================
// The hero follows the live home's layout (teacher, 2026-11-24: "more closely
// match this design layout"): on a laptop a big two-line title on the left
// (about 45%), vertically centered, the description, two buttons side by side
// and a small line; on the right a 2 x 3 grid of large covers filling the
// first screen from under the bar to the bottom (a 1440 x 900 window).
const HERO_GAP = 20;
function HomeHero({ w }: W) {
  const ph = isPhone(w), tab = !ph && w < 1000;
  const text = (
    <div className="grid gap-6 content-center">
      <h1 style={{ ...GY, fontSize: ph ? 46 : tab ? 72 : w >= 1400 ? 70 : 62, lineHeight: 1, whiteSpace: ph ? undefined : 'nowrap' }}><GText>Every Question<br />Becomes a Game</GText></h1>
      <P w={w} big>Gamify turns your own question sets into classroom games: together on one big screen, live on every student device, or on your own.</P>
      <div className={`flex gap-3 ${ph ? 'flex-col' : ''}`}><Go w={w} wide={ph}><ChalkboardTeacher weight="bold" size={22} />Start free</Go><Plain w={w} wide={ph}>Join with a code<ArrowRight weight="bold" size={20} /></Plain></div>
      <span className="font-bold" style={{ fontSize: ph ? 16 : 17, color: PP.quiet }}>Free forever for one class of 30. No card needed.</span>
    </div>
  );
  if (ph || tab) {
    // Phone and iPad portrait: the words first, then the covers in a grid the
    // full width of the page (2 x 3 on a phone, 3 x 2 on an iPad).
    const cols = ph ? 2 : 3, gap = ph ? 12 : 16;
    const cw = (w - 2 * pad(w) - (cols - 1) * gap) / cols, ch = cw * 0.75;
    return (
      <section className="grid gap-8" style={{ padding: `${ph ? 32 : 56}px ${pad(w)}px 0` }}>
        {text}
        <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, ${cw}px)`, gap }}>{COVERS.map((g) => <CoverCard key={g.id} g={g} cw={cw} ch={ch} />)}</div>
      </section>
    );
  }
  const heroH = 900 - 76, padY = [24, 30], colGap = 56;
  const right = (w - 2 * pad(w) - colGap) * 0.54;
  const cw = (right - HERO_GAP) / 2, ch = (heroH - padY[0] - padY[1] - 2 * HERO_GAP) / 3;
  return (
    <section className="grid items-center" style={{ height: heroH, padding: `${padY[0]}px ${pad(w)}px ${padY[1]}px`, gridTemplateColumns: '46fr 54fr', columnGap: colGap }}>
      {text}
      <div className="grid justify-end" style={{ gridTemplateColumns: `repeat(2, ${cw}px)`, gridTemplateRows: `repeat(3, ${ch}px)`, gap: HERO_GAP }}>{COVERS.map((g) => <CoverCard key={g.id} g={g} cw={cw} ch={ch} />)}</div>
    </section>
  );
}
function Home({ w }: W) {
  const ph = isPhone(w);
  const ways = (['Live', 'Share', 'Solo'] as const).map((id) => ({ id, ...WAYS_STYLE[id] }));
  return (
    <Page w={w} on="Home">
      <HomeHero w={w} />
      {/* ways to play */}
      <Section w={w}>
        <H2 w={w} center>Three Ways to Play</H2>
        <div className={`grid gap-5 ${ph ? '' : 'grid-cols-3'}`}>
          {ways.map((x) => { const Ic = x.icon; return (
            <div key={x.id} className="grid gap-3 p-6 content-start" style={{ ...CARD, background: x.soft }}>
              <span className="w-14 h-14 rounded-full grid place-items-center" style={{ background: x.bright, border: `2.5px solid ${I}` }}><Ic weight="bold" size={28} /></span>
              <b style={{ ...GY, fontSize: 34 }}><GText>{x.id}</GText></b>
              <P w={w}>{x.hint}.</P>
            </div>); })}
        </div>
      </Section>
      {/* how it works */}
      <Section w={w}>
        <H2 w={w} center>How It Works</H2>
        <div className={`grid gap-5 ${ph ? '' : 'grid-cols-3'}`}>
          {([[Stack, PP.butter, 'Pick your questions', 'Type them, import a spreadsheet or start from the ready-made library.'], [Play, PP.mint, 'Pick a game', 'The same set works in every game and every way to play.'], [UsersThree, PP.blueCrystal, 'Play together', 'Share a code; students tap their name and play. Missed questions come back in Review.']] as const).map(([Ic, bg, h, t], i) => (
            <div key={h} className="grid gap-3 p-6 content-start" style={CARD}>
              <span className="flex items-center gap-3"><IconDot bg={bg}><Ic weight="bold" size={24} /></IconDot><b style={{ ...GY, fontSize: 30 }}><GText>{i + 1}</GText></b></span>
              <H3 w={w}>{h}</H3><P w={w}>{t}</P>
            </div>
          ))}
        </div>
      </Section>
      {/* trust and research */}
      <Section w={w}>
        <H2 w={w} center>Why It Works</H2>
        <div className={`grid gap-5 ${ph ? '' : 'grid-cols-2'}`}>
          {([['Every move is a practice question', 'A review of 222 classroom studies found that answering practice questions helps students remember more.'], ['Mistakes are free here', 'A wrong answer never costs a point, a life or a turn, so trying is safe.'], ['Compete, team up, or play as one class', 'Studies found gamified learning helped whether or not students competed.'], ['Designed for every learner', 'Read-aloud, calm mode, bigger text and extra tries are free on every plan.']] as const).map(([h, t]) => (
            <div key={h} className="flex gap-4 p-6" style={CARD}><IconDot bg={PP.lavender}><Check weight="bold" size={24} /></IconDot><span className="grid gap-1.5"><H3 w={w}>{h}</H3><P w={w}>{t}</P></span></div>
          ))}
        </div>
        <div className={`flex gap-3 justify-center ${ph ? 'flex-col' : 'flex-wrap'}`}>
          {['No ads, ever', 'No trackers', 'No student emails', 'Accessibility free on every plan'].map((x) => <span key={x} className="inline-flex items-center justify-center gap-2 rounded-full px-5 font-bold" style={{ minHeight: 48, fontSize: ph ? 16 : 18, background: '#fff', border: `2.5px solid ${I}` }}><ShieldCheck weight="bold" size={20} />{x}</span>)}
        </div>
        <span className="text-center font-semibold" style={{ fontSize: ph ? 15 : 16, color: PP.quiet }}>These findings are about practice questions and gamified learning in general, not a study of Gamify itself.</span>
      </Section>
      {/* who it is for */}
      <Section w={w}>
        <H2 w={w} center>Made for Every Kind of Classroom</H2>
        <div className={`grid gap-5 ${ph ? '' : 'grid-cols-3'}`}>
          {([[ChalkboardTeacher, PP.blush, 'Teachers', 'Your questions become games your class asks to play. Free to start.'], [Buildings, PP.aqua, 'Schools and districts', 'Pro for every teacher on one invoice and a signed privacy agreement.'], [House, PP.peach, 'Homeschool families', 'Your family is the class: every age, your curriculum.']] as const).map(([Ic, bg, h, t]) => (
            <div key={h} className="grid gap-3 p-6 content-start" style={CARD}><IconDot bg={bg}><Ic weight="bold" size={24} /></IconDot><H3 w={w}>{h}</H3><P w={w}>{t}</P></div>
          ))}
        </div>
      </Section>
      {/* CTA */}
      <Section w={w}>
        <div className="grid gap-5 justify-items-center text-center relative overflow-hidden" style={{ ...CARD, background: PP.lavender, padding: ph ? 28 : 48 }}>
          <span className="absolute left-6 top-5" aria-hidden="true"><Doodle kind="sparkle" color={PP.lemon} size={40} /></span>
          <span className="absolute right-8 bottom-6" aria-hidden="true"><Doodle kind="star" color={PP.pink} size={34} /></span>
          <H2 w={w} center>Ready for Game Day?</H2>
          <div className={`flex gap-3 ${ph ? 'flex-col w-full' : ''}`}><Go w={w} wide={ph}>Start free</Go><Plain w={w} wide={ph}>See every feature</Plain></div>
        </div>
      </Section>
    </Page>
  );
}

// ================= shared bits for Features and Pricing =================
// A real screen at its natural size, scaled to a box (show, don't tell).
function Shot({ nat, w: bw, children, bg = PP.paper }: { nat: [number, number]; w: number; children: ReactNode; bg?: string }) {
  const k = bw / nat[0];
  return (
    <span aria-hidden="true" className="block relative overflow-hidden rounded-[20px]" style={{ width: bw, height: nat[1] * k, border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}`, background: bg }}>
      <span className="absolute top-0 left-0 origin-top-left" style={{ width: nat[0], height: nat[1], transform: `scale(${k})` }}>{children}</span>
    </span>
  );
}
// A cover's game screen only (1000 x 625 inside the 720 x 648 cover).
function Screen({ id, w: bw }: { id: string; w: number }) {
  const g = GAME_COVERS.find((x) => x.id === id) ?? GAME_COVERS[0];
  return <CoverCard g={g} cw={bw} ch={bw * 0.62} />;
}
// Proof sits beside the claim it backs (social proof near claims). Before
// launch there are no teacher quotes, so the quote slot is marked, never faked.
function Proof({ w, kind, children, cite }: W & { kind: 'research' | 'quote'; children: ReactNode; cite: string }) {
  const q = kind === 'quote';
  return (
    <div className="flex gap-3 items-start rounded-[18px] p-4" style={q ? { border: `2px dashed ${I}`, background: 'rgba(253,253,148,0.45)' } : { background: PP.cream, border: `2px solid ${I}` }}>
      <IconDot bg={q ? PP.butter : PP.lavender}>{q ? <UsersThree weight="bold" size={22} /> : <BookOpen weight="bold" size={22} />}</IconDot>
      <span className="grid gap-1">
        {q && <b className="text-[13px] uppercase tracking-wider">Placeholder: a beta teacher&apos;s words, with permission</b>}
        <span className="font-semibold leading-snug" style={{ fontSize: isPhone(w) ? 16 : 17 }}>{children}</span>
        <span className="font-semibold text-[14px]" style={{ color: PP.quiet }}>{cite}</span>
      </span>
    </div>
  );
}
function Checks({ items, w }: W & { items: string[] }) {
  return <ul className="m-0 p-0 list-none grid gap-2.5">{items.map((x) => <li key={x} className="flex gap-3 items-start font-semibold leading-snug" style={{ fontSize: isPhone(w) ? 17 : 18 }}><span className="mt-0.5 w-7 h-7 shrink-0 rounded-full grid place-items-center" style={{ background: PP.kelly, border: `2px solid ${I}` }}><Check weight="bold" size={15} /></span>{x}</li>)}</ul>;
}
function TextLink({ children }: { children: ReactNode }) {
  return <span className="font-bold text-[18px] inline-flex items-center gap-1.5 underline underline-offset-4">{children}<ArrowRight weight="bold" size={18} /></span>;
}

// ================= Features (jobs to be done) =================
// Teacher, 2026-11-24: "features and pricing pages need to be improved. use
// different references and apply psychology". Each block is a job the teacher
// gets done (jobs-to-be-done), three points at most (chunking), a real screen
// (show, don't tell), proof next to the claim, and one yellow button on the
// page (one primary call to action). Everything else folds away below
// (progressive disclosure). Words come from FeaturesPage and en.ts.
type Job = { id: string; tag: string; h: string; t: string; icon: typeof Stack; bg: string; points: string[]; screen: (bw: number) => ReactNode; proof: { kind: 'research' | 'quote'; text: string; cite: string } };
const JOBS: Job[] = [
  { id: 'review', tag: 'Plan less', icon: Stack, bg: PP.butter, h: 'Turn Tomorrow\'s Review Into a Game', t: 'Type your questions, upload a spreadsheet or start from the ready-made library. The same set works in every game.',
    points: ['Your question sets drive every game, pictures welcome', 'Tagged with Common Core standards you can find again by code', 'A starter library from kindergarten to college: play in the first five minutes'],
    screen: (bw) => <div className="grid grid-cols-3 gap-3" style={{ width: bw }}>{['game-show', 'castle-quest', 'four-in-a-row'].map((id) => <Screen key={id} id={id} w={(bw - 24) / 3} />)}</div>,
    proof: { kind: 'quote', text: '"I typed my spelling list once and we played it three different ways that week."', cite: 'Sample words only. A real beta teacher quote replaces this.' } },
  { id: 'every', tag: 'Reach every learner', icon: Heart, bg: PP.blush, h: 'Reach Every Learner, No Extra Prep', t: 'Supports are set per student behind your teacher PIN, and they are free on every plan.',
    points: ['Read-aloud with natural voices and a read-first pause', 'One to four tries per question, calm mode, text and contrast controls', 'Calculator, scratchpad, highlighter and times table tools'],
    screen: (bw) => <Shot nat={[1140, 580]} w={bw} bg={PP.cream}><div style={{ padding: 26 }}><QuestionCard /></div></Shot>,
    proof: { kind: 'research', text: 'Read-aloud, picture sign-in, big tap targets and a read-first pause mean students who cannot read yet still play.', cite: 'From the Gamify Free plan: accessibility is never paywalled.' } },
  { id: 'excite', tag: 'Get them excited', icon: PaintBrush, bg: PP.mint, h: 'Get Your Class Asking to Practice', t: 'With the Theme Builder your class designs how a game looks: card backs, team icons, backgrounds, colors and sounds.',
    points: ['Student choice and ownership: a class theme makes review their game', 'Scaffolded by age, from pre-K to adult learners', 'Paper or digital: print the templates and draw, photos are cut out for you'],
    screen: (bw) => <div className="grid grid-cols-2 gap-3" style={{ width: bw }}>{['match-three', 'bubble-pop'].map((id) => <Screen key={id} id={id} w={(bw - 12) / 2} />)}</div>,
    proof: { kind: 'research', text: FINDINGS[1]?.found ?? '', cite: 'Gamified learning in general, not a study of Gamify itself.' } },
  { id: 'live', tag: 'Know who needs help', icon: Broadcast, bg: PP.blueCrystal, h: 'Run It Live and See Who Needs Help', t: 'Live on every device, Share on one big screen, or Solo with a code. You see every answer as it happens.',
    points: ['Question-by-question results after every game, free', 'Missed questions come back in later games and in Review', 'Live monitor and Lock on Plus and Pro'],
    screen: (bw) => <Screen id="star-quiz" w={bw} />,
    proof: { kind: 'research', text: FINDINGS[0]?.found ?? '', cite: FINDINGS[0]?.sources[0]?.cite ?? '' } },
];
const MORE_GROUPS: [string, string[]][] = [
  ['Question sets', ['Write sets in a simple table, or import a CSV', 'Every set has a subject, grades, tags and Common Core standards', 'Filter by subject, grade, tag or standard in every game', 'Pictures in questions, with descriptions for screen readers']],
  ['Classes and students', ['Paste a student list; each student gets a picture and a 4-digit PIN', 'Assign sets to everyone or to chosen students, with dates', 'Choose which ways to play your students see']],
  ['Supports', ['Read-aloud with natural voices', 'A read-first pause from 0 to 10 seconds', 'Per-student settings behind your 4-digit teacher PIN']],
  ['Safety and privacy', ['No ads, no trackers, ever', 'No student email accounts', 'No prices or buying on student screens', 'Deleting a class deletes its data']],
];
function Features({ w }: W) {
  const ph = isPhone(w);
  const shotW = ph ? w - 2 * pad(w) - 48 : 600;
  return (
    <Page w={w} on="Features">
      <Section w={w}>
        <PageHead w={w} title="Features" sub="Your questions become real practice, your class designs how the games look, and the games fit any way you teach.">
          <div className={`flex gap-4 items-center ${ph ? 'flex-col items-start' : ''}`}><Go w={w} wide={ph}><ChalkboardTeacher weight="bold" size={22} />Start free</Go><SiteLink>See plans and pricing</SiteLink><SiteLink>How to play every game</SiteLink></div>
          <span className="font-bold" style={{ fontSize: ph ? 16 : 17, color: PP.quiet }}>Free forever for one class of 30. No card needed.</span>
        </PageHead>
        {/* the four jobs at a glance: four chunks, each a jump link */}
        <div className={`grid gap-4 ${ph ? 'grid-cols-2' : 'grid-cols-4'}`}>
          {JOBS.map((j) => { const Ic = j.icon; return (
            <span key={j.id} className="grid gap-2 p-4 content-start" style={{ ...CARD, borderRadius: 22, background: j.bg }}>
              <IconDot bg={PP.paper}><Ic weight="bold" size={22} /></IconDot>
              <b className="font-heading leading-tight" style={{ fontSize: ph ? 17 : 20 }}>{j.tag}</b>
            </span>); })}
        </div>
      </Section>
      {JOBS.map((j, n) => { const Ic = j.icon; const flip = !ph && n % 2 === 1; return (
        <Section key={j.id} w={w}>
          <div className={`grid gap-8 items-center ${ph ? '' : flip ? 'grid-cols-[600px_1fr]' : 'grid-cols-[1fr_600px]'}`} style={{ ...CARD, padding: ph ? 24 : 40 }}>
            <div className={`grid gap-4 content-start ${flip ? 'order-2' : ''}`}>
              <span className="flex items-center gap-3"><IconDot bg={j.bg}><Ic weight="bold" size={24} /></IconDot><H2 w={w}>{j.h}</H2></span>
              <P w={w} big>{j.t}</P>
              <Checks w={w} items={j.points} />
            </div>
            <div className="grid gap-4 content-start">
              {j.screen(shotW)}
              <Proof w={w} kind={j.proof.kind} cite={j.proof.cite}>{j.proof.text}</Proof>
            </div>
          </div>
        </Section>); })}
      {/* everything else, folded: one open as the example */}
      <Section w={w}>
        <H2 w={w} center>Everything Else</H2>
        <div className={`grid gap-4 items-start ${ph ? '' : 'grid-cols-2'}`}>
          {MORE_GROUPS.map(([h, items], i) => (
            <div key={h} className="grid gap-3 p-5" style={{ ...CARD, borderRadius: 22 }}>
              <span className="flex items-center justify-between gap-3"><H3 w={w}>{h}</H3><span className="w-11 h-11 shrink-0 rounded-full grid place-items-center font-bold text-2xl" style={{ background: i === 0 ? PP.butter : '#fff', border: `2.5px solid ${I}` }}>{i === 0 ? '−' : '+'}</span></span>
              {i === 0 && <Checks w={w} items={items} />}
            </div>
          ))}
        </div>
      </Section>
      <Section w={w}>
        <div className="grid gap-4 justify-items-center text-center" style={{ ...CARD, background: PP.lavender, padding: ph ? 28 : 48 }}>
          <H2 w={w} center>Try It With Your Class Today</H2>
          <P w={w}>One class of 30 and every accessibility feature, free forever.</P>
          <Go w={w} wide={ph}>Start free</Go>
          <TextLink>See plans</TextLink>
        </div>
      </Section>
      {/* Fair play, built in (teacher, 2026-11-24): the edge list on the page, the
          weak spots the research found elsewhere, answered (never naming anyone). */}
      <Section w={w}>
        <div className="grid gap-4 p-6" style={CARD}>
          <H2 w={w}>Fair Play, Built In</H2>
          <P w={w}>Games should build kids up, not set them against each other. The right answer decides what happens next.</P>
          <div className={`grid gap-3 ${isPhone(w) ? '' : 'grid-cols-2'}`}>
            {[['No stealing, ever', 'No power-up takes points, cards or places from another team.'], ['Every timer can be turned off', 'Students who need more time play the same game.'], ['Right answers decide the game', 'Power-ups add to your own goal, never take from someone else.'], ['Names from your class list', 'No unkind nicknames to manage.'], ['No ads, no trackers, no student emails', 'Nothing on a student screen sells anything.'], ['Accessibility is never a paid upgrade', 'Every setting is free on every plan.']].map(([h, d]) => (
              <span key={h} className="flex gap-3 items-start rounded-[18px] p-4" style={{ background: '#fff', border: `2.5px solid ${I}` }}><Check weight="bold" size={22} className="shrink-0 mt-0.5" /><span className="grid gap-0.5"><b className="text-[18px]">{h}</b><span className="font-semibold text-[16px]" style={{ color: PP.quiet }}>{d}</span></span></span>
            ))}
          </div>
        </div>
      </Section>
    </Page>
  );
}

// ================= Pricing (value first, honest) =================
// Good, better, best with one recommended plan (center stage and compromise
// effect), value before price, the Free plan shown in full with its limits,
// yearly billing framed per month and per school day, risk reversal under the
// prices, the school path and an FAQ built from the Sales doc's counter
// arguments. Every number comes from src/config.ts and the live en.ts lines.
const perMonth = (y: number) => Math.round(y / 12);
const perDay = (y: number) => Math.round((y / 180) * 100);
const PLANS = [
  { id: 'Free', who: 'Everything you need to see your class light up.', gets: ['Play the free games with your class today', 'Up to 30 students, each signing in with a picture and PIN', '3 question sets of your own, plus the whole ready-made library', 'Design your own Game Show theme with your class'], price: '$0', note: 'Free forever. No card needed.', day: '', more: 0, go: 'Start free' },
  { id: 'Plus', who: 'Every game, and your class designs how each one looks.', gets: ['Every game, unlocked the moment you upgrade', 'Your class designs a theme for every game', '3 classes of up to 60 students, with live monitoring', 'Unlimited question sets and reports you keep forever'], price: `$${perMonth(PRICES_USD_PER_YEAR.plus)}`, note: `a month, billed once a year ($${PRICES_USD_PER_YEAR.plus})`, day: `About ${perDay(PRICES_USD_PER_YEAR.plus)} cents a school day`, more: 8, go: 'Start with Plus', best: true },
  { id: 'Pro', who: 'Everything, with no limits, for classrooms that play every day.', gets: ['Every game, and new games before anyone else', 'As many themes for every game as your class can dream up', 'Unlimited classes and students', 'Every report kept, all year and beyond'], price: `$${perMonth(PRICES_USD_PER_YEAR.pro)}`, note: `a month, billed once a year ($${PRICES_USD_PER_YEAR.pro})`, day: `About $${(PRICES_USD_PER_YEAR.pro / 180).toFixed(2)} a school day`, more: 6, go: 'Start with Pro' },
];
const COMPARE: [string, string, string, string][] = [
  ['Games', 'Free games', 'All games', 'All games, plus early access'],
  ['Classes', '1', '3', 'Unlimited'],
  ['Students', '30', '60 per class', 'Unlimited'],
  ['Saved question sets', '3', 'Unlimited', 'Unlimited'],
  ['Theme Builder designs', 'Try it on Game Show', 'One per game', 'Unlimited'],
  ['Every accessibility feature', 'Included', 'Included', 'Included'],
];
const FAQ: [string, string][] = [
  ['I already use a free game site.', 'Gamify\'s Free plan is free forever with every accessibility feature, and your students never see an ad or an upgrade button.'],
  ['I don\'t have time to learn a new tool.', 'Five steps from sign-up to students playing; a ready-made library means you can play in the first five minutes.'],
  ['My students can\'t read yet.', 'Read-aloud on every question, picture sign-in, big tap targets and a read-first pause.'],
  ['My students are in high school; game sites feel babyish.', 'Themes for any age, and students can design the look themselves.'],
  ['I\'d be paying out of my own pocket.', `Plus is $${perMonth(PRICES_USD_PER_YEAR.plus)} a month, billed yearly, and a one-minute quote you can forward to your principal so the school pays.`],
  ['What if it breaks in front of 25 kids?', 'Every game is tested on iPads, laptops and smart boards, and fits the screen with no scrolling.'],
  ['What happens to my work if my plan changes?', 'Nothing is deleted. The account moves to Free; anything past the Free limits stays readable and comes back in full with an upgrade.'],
  ['Can a school, district or PTO pay?', 'Yes. Request a quote here and it arrives by email as a PDF. Purchase orders (yearly, prepaid, net 30) and cards are accepted.'],
];
function Pricing({ w }: W) {
  const ph = isPhone(w);
  return (
    <Page w={w} on="Pricing">
      <Section w={w}>
        <PageHead w={w} title="Plans and Pricing" sub="Start free and grow when your class does. Every plan turns your questions into games your class asks for; unlock every game and your class's own designs whenever you are ready." />
        {/* risk reversal, before the numbers */}
        <div className={`flex gap-3 justify-start ${ph ? 'flex-col' : 'flex-wrap'}`}>{['No card needed to start', 'Cancel any time', 'Nothing is ever deleted', 'Accessibility free on every plan'].map((x) => <span key={x} className="inline-flex items-center justify-center gap-2 rounded-full px-5 font-bold text-[17px]" style={{ minHeight: 48, background: '#fff', border: `2.5px solid ${I}` }}><ShieldCheck weight="bold" size={18} />{x}</span>)}</div>
        <span className="text-left font-semibold" style={{ fontSize: ph ? 16 : 17 }}>Paid plans bill once a year, so there is no monthly charge to track. Prices are shown per month.</span>
        <div className={`grid gap-5 ${ph ? '' : 'grid-cols-3 items-end'}`}>
          {PLANS.map((p) => (
            <div key={p.id} className="grid gap-4 content-start relative" style={{ ...CARD, padding: p.best ? (ph ? 24 : 30) : 24, background: p.best ? PP.butter : PP.paper, border: `${p.best ? 4 : 3}px solid ${I}`, boxShadow: `0 ${p.best ? 8 : 5}px 0 ${I}`, marginTop: p.best && !ph ? 0 : undefined }}>
              {p.best && <span className="absolute -top-5 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full font-bold text-[17px] whitespace-nowrap" style={{ background: GO_YELLOW, color: I, border: `2.5px solid ${I}` }}>Recommended</span>}
              <b style={{ ...GY, fontSize: 40 }}><GText>{p.id}</GText></b>
              <P w={w}>{p.who}</P>
              <ul className="m-0 p-0 list-none grid gap-2">{p.gets.map((x) => <li key={x} className="flex gap-2.5 items-start font-semibold leading-snug text-[17px]"><Check weight="bold" size={20} className="mt-0.5 shrink-0" color={PP.kelly} />{x}</li>)}</ul>
              {p.more > 0 && <span className="font-bold text-[16px] underline underline-offset-4">See all {p.more} more in {p.id}</span>}
              <div className="grid gap-1 pt-3" style={{ borderTop: `2px dashed ${I}` }}>
                <b className="tabular-nums" style={{ ...GY, fontSize: p.best ? 60 : 50 }}><GText>{p.price}</GText></b>
                <span className="font-semibold text-[16px]">{p.note}</span>
                {p.day && <span className="font-semibold text-[15px]" style={{ color: PP.quiet }}>{p.day} (180 days)</span>}
              </div>
              {p.best ? <Go w={w} wide>{p.go}</Go> : <Plain w={w} wide>{p.go}</Plain>}
            </div>
          ))}
        </div>
        <span className="text-center font-bold text-[17px]">Homeschooling? The Homeschool plan has every game for up to 10 students.</span>
      </Section>
      {/* compare: the six most useful rows, the rest one tap away */}
      <Section w={w}>
        <H2 w={w} center>Compare Plans</H2>
        <div className="overflow-hidden" style={{ ...CARD, borderRadius: 22 }}>
          <div className="grid font-bold" style={{ gridTemplateColumns: ph ? '1.2fr 1fr 1fr 1.1fr' : '2fr 1fr 1fr 1fr', fontSize: ph ? 12 : 17 }}>
            {['', 'Free', 'Plus', 'Pro'].map((h, i) => <span key={h + i} className="p-3" style={{ ...GY, fontSize: ph ? 18 : 24, background: i === 2 ? PP.butter : undefined, borderBottom: `2.5px solid ${I}` }}><GText>{h}</GText></span>)}
            {COMPARE.map((r) => r.map((c, i) => <span key={r[0] + i} className={`${ph ? 'p-2' : 'p-3'} min-w-0 ${i ? 'font-semibold' : ''}`} style={{ background: i === 2 ? 'rgba(253,240,180,0.7)' : undefined, borderBottom: `1.5px solid rgba(29,26,51,0.15)` }}>{c}</span>))}
          </div>
          <span className="block text-center p-3 font-bold text-[17px] underline underline-offset-4">Show all 18 rows</span>
        </div>
      </Section>
      {/* the school path */}
      <Section w={w}>
        <div className={`grid gap-6 ${ph ? '' : 'grid-cols-[1.2fr_1fr]'}`} style={{ ...CARD, background: PP.mint, padding: ph ? 24 : 40 }}>
          <div className="grid gap-3 content-start">
            <IconDot bg={PP.paper}><Buildings weight="bold" size={24} /></IconDot>
            <H2 w={w}>Schools and Districts</H2>
            <P w={w} big>Pro for every teacher in your building, with one invoice and no sales calls.</P>
            <Checks w={w} items={['One yearly invoice, paid by purchase order or card', 'Your student data privacy agreement, signed on request', 'School savings start at 5 teachers; the more teachers, the bigger the savings']} />
          </div>
          <div className="grid gap-3 content-start p-5 rounded-[22px]" style={{ background: PP.paper, border: `3px solid ${I}` }}>
            <H3 w={w}>Get your quote, no sales call</H3>
            <ol className="m-0 pl-6 grid gap-1.5 font-semibold text-[17px] list-decimal"><li>Tell us your school or district and how many teachers.</li><li>Your quote arrives by email as a PDF, ready for your business office.</li><li>Reply or send a purchase order to go ahead.</li></ol>
            <Plain w={w} wide>Email me my quote</Plain>
            <span className="font-bold text-[16px] underline underline-offset-4">Send a note to your principal</span>
          </div>
        </div>
      </Section>
      <Section w={w}>
        <div className="grid gap-3 p-6" style={CARD}>
          <H3 w={w}>Free on Every Plan, Always</H3>
          <div className={`grid gap-2.5 ${ph ? '' : 'grid-cols-2'}`}>{['Read-aloud for every question and answer', 'Calm mode, less motion and sound controls', 'Bigger text, high contrast and color-safe colors', 'Extra tries, slower game speed and no timers', 'No ads, ever, for students or teachers', 'No student emails or accounts to make', 'Question-by-question results after every game', 'Every How to Play guide and theme guide'].map((x) => <span key={x} className="flex gap-2.5 font-semibold text-[17px]"><Check weight="bold" size={20} color={PP.kelly} className="shrink-0 mt-0.5" />{x}</span>)}</div>
        </div>
      </Section>
      <Section w={w}>
        <div className="flex flex-wrap items-end justify-between gap-3"><H2 w={w}>Good to Know</H2><SiteLink>More answers in the Help Center</SiteLink></div>
        <div className={`grid gap-4 items-start ${ph ? '' : 'grid-cols-2'}`}>
          {FAQ.map(([q, a]) => <div key={q} className="grid gap-2 p-5" style={{ ...CARD, borderRadius: 22 }}><H3 w={w}>{q}</H3><P w={w}>{a}</P></div>)}
        </div>
        <div className="grid justify-items-center gap-3 pt-2"><Go w={w} wide={ph}>Start free</Go><span className="font-bold" style={{ fontSize: 17, color: PP.quiet }}>No card needed. Upgrade any time from inside Gamify.</span></div>
      </Section>
    </Page>
  );
}

// ================= Research =================
// Not approved yet (teacher, 2026-11-24): "needs serious updates to make it look
// more professional research focus, whilke simply highlighting why it works.
// collapsable text. list views." A plain research brief: a short summary of why
// it works, then a numbered list of findings; each row shows the finding in
// one line and opens to the evidence, the honest limits, how Gamify uses it
// and the full citations with links.
function Research({ w }: W) {
  const ph = isPhone(w);
  const why = ['Every move is a practice question, and practice questions help students remember.', 'Game structure (goals, quick feedback, small wins) keeps students practicing longer.', 'Right answers power the game, so the learning is the fun part, not a break from it.'];
  return (
    <Page w={w} on="Research">
      <Section w={w}>
        <PageHead w={w} title="Research" sub="Why Gamify works, from published studies of practice questions and gamified learning. These are not studies of Gamify itself." />
        <div className={`grid gap-6 ${ph ? '' : 'grid-cols-[1.1fr_1fr]'}`}>
          <div className="grid gap-3 p-6 content-start" style={CARD}>
            <H3 w={w}>Why It Works, in Short</H3>
            <ol className="m-0 pl-6 grid gap-2 list-decimal font-semibold" style={{ fontSize: ph ? 17 : 19 }}>{why.map((x) => <li key={x}>{x}</li>)}</ol>
          </div>
          <div className="grid gap-2 p-6 content-start" style={{ ...CARD, background: PP.cream }}>
            <H3 w={w}>How to Read This Page</H3>
            <P w={w}>Each finding says what the studies found, where the evidence is limited, and how Gamify uses it. Open a finding to see the sources.</P>
            <div className="flex flex-wrap gap-4 pt-1"><SiteLink>Features</SiteLink><SiteLink>Student data promise</SiteLink></div>
          </div>
        </div>
      </Section>
      <Section w={w} tight>
        <ol className="m-0 p-0 list-none grid" style={{ ...CARD, borderRadius: 22, overflow: 'hidden' }}>
          {FINDINGS.map((f, i) => {
            const open = i === 0;
            return (
              <li key={f.id} style={{ borderTop: i ? `2px solid ${I}` : undefined }}>
                <div className="flex items-center gap-4" style={{ padding: ph ? '16px 18px' : '20px 28px', background: open ? PP.cream : undefined }}>
                  <span className="w-10 h-10 shrink-0 rounded-full grid place-items-center tabular-nums" style={{ ...GY, fontSize: 20, background: PP.paper, border: `2.5px solid ${I}` }}><GText>{i + 1}</GText></span>
                  <span className="grid gap-0.5 flex-1 min-w-0"><b className="font-heading leading-snug" style={{ fontSize: ph ? 18 : 21 }}>{f.title}</b>{!ph && <span className="font-semibold text-[15px]" style={{ color: PP.quiet }}>{f.sources.length} {f.sources.length === 1 ? 'source' : 'sources'}</span>}</span>
                  <span aria-hidden="true" className="w-10 h-10 shrink-0 rounded-full grid place-items-center font-bold text-xl" style={{ border: `2.5px solid ${I}`, background: '#fff' }}>{open ? '–' : '+'}</span>
                </div>
                {open && (
                  <div className={`grid gap-4 ${ph ? '' : 'grid-cols-3'}`} style={{ padding: ph ? '0 18px 18px' : '0 28px 24px', background: PP.cream }}>
                    <div className="grid gap-1 content-start"><b className="text-[16px]">What studies found</b><P w={w}>{f.found}</P></div>
                    <div className="grid gap-1 content-start"><b className="text-[16px]">Limits</b><P w={w}>{f.fair}</P></div>
                    <div className="grid gap-1 content-start"><b className="text-[16px]">In Gamify</b><P w={w}>{f.inGamify}</P></div>
                    <ul className={`m-0 pl-5 grid gap-1 ${ph ? '' : 'col-span-3'}`}>{f.sources.map((src) => <li key={src.url} className="font-semibold text-[15px]" style={{ color: PP.quiet }}>{src.cite} <span className="underline">{src.url.replace('https://', '')}</span></li>)}</ul>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </Section>
    </Page>
  );
}

// ================= Blog index and one post =================
const POST_BG = [PP.butter, PP.blush, PP.mint, PP.blueCrystal, PP.peach, PP.lavender];
function Blog({ w }: W) {
  const ph = isPhone(w);
  return (
    <Page w={w} on="Blog">
      <Section w={w}><PageHead w={w} title="Blog" sub="Ideas for game day, theme guides and how to play every game." />
        <div className={`flex gap-2.5 justify-start ${ph ? 'flex-wrap' : ''}`}>{['All', 'Classroom ideas', 'Themes', 'How to play', 'Homeschool'].map((x, i) => <span key={x} className="inline-flex items-center rounded-full px-5 font-bold text-[17px]" style={{ minHeight: 46, background: i === 0 ? PP.butter : '#fff', border: `2.5px solid ${I}` }}>{x}</span>)}</div>
      </Section>
      <Section w={w} tight>
        <div className={`grid gap-5 ${ph ? '' : 'grid-cols-3'}`}>
          {POSTS.slice(0, 6).map((p, i) => (
            <article key={p.slug} className="grid content-start overflow-hidden" style={CARD}>
              <div className="h-[150px] grid place-items-center relative" style={{ background: POST_BG[i % 6], borderBottom: `3px solid ${I}` }}><Doodle kind={(['sparkle', 'star', 'heart'] as const)[i % 3]} color={[PP.lemon, PP.pink, PP.sky][i % 3]} size={70} /></div>
              <div className="grid gap-2 p-5"><H3 w={w}>{p.title}</H3><P w={w}>{p.summary}</P><span className="font-bold text-[16px] inline-flex items-center gap-1.5">Read it<ArrowRight weight="bold" size={16} /></span></div>
            </article>
          ))}
        </div>
      </Section>
    </Page>
  );
}
function Post({ w }: W) {
  const ph = isPhone(w);
  const p = POSTS.find((x) => x.slug === 'design-a-theme-as-a-class') ?? POSTS[0];
  return (
    <Page w={w} on="Blog">
      <Section w={w}>
        <div className="grid gap-5 mx-auto w-full" style={{ maxWidth: 760 }}>
          <span className="font-bold text-[16px]" style={{ color: PP.quiet }}>Blog / Classroom ideas</span>
          <h1 className="font-heading font-bold leading-tight" style={{ fontSize: ph ? 34 : 48 }}>{p.title}</h1>
          <P w={w} big>{p.summary}</P>
          <div className="rounded-[24px] h-[260px] grid place-items-center" style={{ ...CARD, background: PP.blush }}><PaintBrush weight="duotone" size={120} color={PP.pink} /></div>
          {[['Give every student one piece', 'Print the blank templates from the game\'s theme guide. Each student draws one piece: a card back, a team icon or the background.'], ['Snap and drop in', 'Photograph the pages; each piece is cut out and lands in the Theme Builder at the right size.'], ['Play it the same day', 'Pick a fractions set and play. The class sees its own art in the game.']].map(([h, t], i) => (
            <div key={h} className="grid gap-2"><h2 className="font-heading font-bold flex items-center gap-3" style={{ fontSize: ph ? 23 : 28 }}><span className="w-10 h-10 rounded-full grid place-items-center shrink-0" style={{ ...GY, fontSize: 22, background: PP.butter, border: `2.5px solid ${I}` }}><GText>{i + 1}</GText></span>{h}</h2><p className="font-medium leading-relaxed" style={{ fontSize: ph ? 18 : 20 }}>{t}</p></div>
          ))}
          <div className="grid gap-3 p-6" style={{ ...CARD, background: PP.mint }}><H3 w={w}>Why it works</H3><P w={w}>When students help make the game, it becomes theirs: choice and ownership build motivation (self-determination theory).</P></div>
        </div>
      </Section>
    </Page>
  );
}

// ================= Themes gallery =================
const THEME_CARDS = [['Dino Dig', 'Game Show', 'Pre-K to 2', PP.mint], ['Space Race', 'Board Game', 'Grades 3 to 5', PP.lavender], ['Soft Pastels', 'Match Three', 'Every grade', PP.blush], ['Court Side', 'Bowling', 'Grades 6 to 12', PP.peach], ['Ocean Pop', 'Bubble Pop', 'Pre-K to 2', PP.aqua], ['Night Sky', 'Question Tracker', 'Every grade', PP.blueCrystal]] as const;
function Themes({ w }: W) {
  const ph = isPhone(w);
  return (
    <Page w={w} on="Themes">
      <Section w={w}><PageHead w={w} title="Themes" sub="Looks for every game, designed by classes and teachers. Heart the ones you love, then offer them to your students when you assign a set."><div className="flex flex-wrap gap-4"><SiteLink>Make your own in the Theme Builder</SiteLink><SiteLink>Theme guides</SiteLink></div></PageHead>
        <div className="grid gap-4 p-6" style={{ ...CARD, background: PP.butter }}><H3 w={w}>Your class could be featured here</H3><P w={w}>The Theme Building Challenge winner gets this spot, seen by every teacher.</P></div>
        <div className="flex flex-wrap gap-2.5 justify-start">{['Game: All games', 'Ages: All ages', 'Sort: Trending'].map((x) => <span key={x} className="inline-flex items-center rounded-full px-5 font-bold text-[17px]" style={{ minHeight: 46, background: '#fff', border: `2.5px solid ${I}` }}>{x} ▾</span>)}</div>
      </Section>
      <Section w={w} tight>
        <div className={`grid gap-5 ${ph ? '' : 'grid-cols-3'}`}>
          {THEME_CARDS.map(([n, g, band, bg], i) => (
            <article key={n} className="grid content-start overflow-hidden" style={CARD}>
              <div className="h-[170px] relative" style={{ background: bg, borderBottom: `3px solid ${I}` }}>
                {[0, 1, 2].map((k) => <span key={k} className="absolute" style={{ left: `${15 + k * 30}%`, top: `${25 + ((k + i) % 2) * 25}%` }}><Doodle kind={(['star', 'sparkle', 'heart', 'dot'] as const)[(i + k) % 4]} color={[PP.lemon, PP.pink, PP.sky, PP.kelly][(i + k) % 4]} size={46} /></span>)}
                <span aria-label={`Add ${n} to my favorites`} className="absolute top-3 right-3 w-11 h-11 rounded-full grid place-items-center bg-white" style={{ border: `2.5px solid ${I}` }}><Heart weight={i === 0 ? 'fill' : 'bold'} size={22} color={i === 0 ? PP.pink : I} /></span>
              </div>
              <div className="grid gap-1 p-5"><H3 w={w}>{n}</H3><span className="font-semibold text-[16px]">{g} · {band}</span><span className="font-semibold text-[15px]" style={{ color: PP.quiet }}>Starter theme by Gamify</span></div>
            </article>
          ))}
        </div>
      </Section>
    </Page>
  );
}

// ================= Join with a code (a student page) =================
function Join({ w }: W) {
  const ph = isPhone(w);
  const box = ph ? 46 : 72;
  return (
    <Page w={w} student>
      <section className="grid justify-items-center" style={{ padding: `${ph ? 40 : 80}px ${pad(w)}px 0` }}>
        <div className="grid gap-6 justify-items-center text-center w-full" style={{ ...CARD, maxWidth: 720, padding: ph ? 24 : 48 }}>
          <H1 w={w}>Join the Game</H1>
          <P w={w} big>Type the game code your teacher gave you.</P>
          <div className="flex gap-2" role="img" aria-label="Game code, 6 numbers">
            {['4', '7', '2', '', '', ''].map((d, i) => <span key={i} className="grid place-items-center tabular-nums" style={{ ...GY, width: box, height: box * 1.15, fontSize: box * 0.62, borderRadius: 16, background: i === 3 ? PP.butter : '#fff', border: `3px solid ${I}`, boxShadow: i === 3 ? `0 0 0 4px ${PP.lemon}` : undefined }}><GText>{d}</GText></span>)}
          </div>
          <Go w={w} wide={ph}>Go<ArrowRight weight="bold" size={22} /></Go>
          <span className="font-semibold" style={{ fontSize: ph ? 16 : 18, color: PP.quiet }}>Your teacher&apos;s screen shows the code. No account or email needed.</span>
        </div>
      </section>
    </Page>
  );
}

// ================= Teacher sign in / sign up =================
function Field({ label, value, w, hint }: W & { label: string; value: string; hint?: string }) {
  return (
    <label className="grid gap-1.5 text-left">
      <b className="text-[17px]">{label}</b>
      <span className="flex items-center rounded-[16px] px-4 font-semibold" style={{ minHeight: 54, fontSize: isPhone(w) ? 17 : 18, background: '#fff', border: `2.5px solid ${I}` }}>{value}</span>
      {hint && <span className="font-semibold text-[15px]" style={{ color: PP.quiet }}>{hint}</span>}
    </label>
  );
}
function SignIn({ w, signup }: W & { signup?: boolean }) {
  const ph = isPhone(w);
  return (
    <Page w={w}>
      <section className="grid justify-items-center" style={{ padding: `${ph ? 36 : 64}px ${pad(w)}px 0` }}>
        <div className="grid gap-5 w-full" style={{ ...CARD, maxWidth: 560, padding: ph ? 24 : 40 }}>
          <h1 className="text-center" style={{ ...GY, fontSize: ph ? 38 : 50 }}><GText>{signup ? 'Start Free' : 'Teacher Log In'}</GText></h1>
          <div className="grid grid-cols-2 p-1.5 rounded-full" style={{ background: PP.cream, border: `2.5px solid ${I}` }} role="tablist">
            {['Log in', 'Sign up'].map((x, i) => <span key={x} role="tab" aria-selected={(i === 1) === !!signup} className="grid place-items-center rounded-full font-bold text-[18px]" style={{ minHeight: 46, ...((i === 1) === !!signup ? { background: PP.butter, border: `2px solid ${I}` } : {}) }}>{x}</span>)}
          </div>
          <P w={w}>For teachers. Students never need an account.</P>
          {signup && <Field w={w} label="Email" value="name@school.org" />}
          <Field w={w} label="Username" value="ms.rivera" hint={signup ? '3 to 20 letters, numbers, periods or underscores. Your themes are credited to it.' : undefined} />
          <Field w={w} label="Password" value="••••••••" />
          <Go w={w} wide>{signup ? 'Create my free account' : 'Log in'}</Go>
          <span className="text-center font-bold text-[17px]">{signup ? 'Have an account? Log in' : 'New here? Create a free account'}</span>
        </div>
      </section>
    </Page>
  );
}

// ---------- the frame: a page at its real width, scaled to the column ----------
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
      <div className={`${ph ? 'rounded-[1.1rem] p-[5%]' : 'rounded-[0.8rem] p-[1.6%]'}`} style={{ background: '#2a2740', border: `2px solid ${I}` }}>
        <div ref={box} data-device={`${ph ? 'phone' : w < 1000 ? 'ipadP' : 'laptop'}:${w}`} className="relative overflow-hidden rounded-[0.4rem]" style={{ height: h }}>
          <div ref={inner} className="absolute top-0 left-0 origin-top-left" style={{ width: w, transform: `scale(${k})` }}>{children}</div>
        </div>
      </div>
      <figcaption className="text-xs font-bold text-muted text-center">{label}</figcaption>
    </figure>
  );
}
type Def = { id: string; name: string; changed: string; why: string; render: (w: number) => ReactNode; ipad?: boolean };
const PAGES: Def[] = [
  { id: 'home', name: 'Home', ipad: true, render: (w) => <Home w={w} />, changed: 'The hero now follows the live home\'s layout and proportions (2026-11-24): on a 1440 x 900 laptop the two-line Grow Year title sits on the left (about 45%), vertically centered, with the description, Start free and Join with a code side by side and the small free line; the right half is a 2 x 3 grid of large cards showing each game\'s real screen from the Game mockups miniatures, filling the first screen from under the bar to the bottom, each with a small name tag. No tilt, no tape. On a phone the words come first and the six cards sit in a 2 x 3 grid; on an iPad portrait in a 3 x 2 grid. The rest of the page is unchanged from the last round.', why: 'Big, readable game screens are the proof: people form a first impression of a page in about 50 milliseconds (Lindgaard 2006, from memory), and showing the product beats describing it (picture superiority effect). The F-pattern puts the promise and the two doors top left, where teachers start reading (NN/g eye tracking, from memory). Two buttons side by side, one yellow, keep the choice to two and make Start free the clear first step (Hick\'s law, visual hierarchy). Name tags give information scent so a teacher knows which game is which (information foraging).' },
  { id: 'features', name: 'Features', render: (w) => <Features w={w} />, changed: 'Rebuilt around four jobs a teacher gets done (Plan less, Reach every learner, Get them excited, Know who needs help) instead of three product pillars: a four-chunk summary row under the title, then one card per job with three points at most, a real screen (game screens from the miniatures, the real question card) and its proof right beside it (a research finding with its caveat, or a marked slot for a beta teacher quote). The long feature list folds into four groups under Everything Else. One yellow Start free at the top and bottom; See plans is a text link.', why: 'Teachers buy the outcome, not the feature: "what will this get done for me?" (jobs-to-be-done, Christensen, from memory). Four jobs of three points each stay inside working memory (chunking, Miller; Cowan puts the limit near four, from memory). Real screens beat claims (show, don\'t tell; picture superiority) and proof next to the claim answers doubt where it rises (social proof, Cialdini, from memory). Details on demand keep the page short for skimmers and complete for checkers (progressive disclosure, NN/g, from memory). One primary button removes the choice of where to click (Hick\'s law). The quote slot is marked, never faked: a made-up teacher quote would be a dark pattern and a legal risk.' },
  { id: 'pricing', name: 'Pricing', render: (w) => <Pricing w={w} />, changed: 'Value first and honest: the risk reducers (no card, cancel any time, nothing deleted, accessibility free) sit above the prices; Free, Plus and Pro read good, better, best with Plus raised on Butter, a thicker outline and a Recommended tag (not "Teacher favorite", which claims a popularity we cannot show before launch); Plus carries the only yellow button; each plan shows its live four lines, then the month price, the yearly bill and the cost a school day; a six-row compare table with the rest one tap away; the school path with its three quote steps and the principal note; Free on Every Plan; and an FAQ built from the Sales doc\'s six counter arguments plus two live answers. Prices are the live config ($96 and $180 a year).', why: 'Value before price frames the cost as what it buys (framing effect, Tversky and Kahneman, from memory). Three plans with a marked middle use the compromise effect: most buyers avoid the extremes, and Pro at $15 anchors Plus at $8 as the sensible choice (anchoring; Simonson 1989, from memory); Pro is a real plan, not a fake decoy. Showing the yearly bill as a month price and about 53 cents a school day shrinks a lump sum to its daily size (pennies-a-day framing, Gourville 1998, from memory). Risk reversal answers loss aversion before the price is seen. The FAQ answers the exact objections teachers raise, in their words (objection handling). The Free plan shows its real limits, with no countdowns or pre-checked upgrades (no dark patterns).' },
  { id: 'research', name: 'Research', render: (w) => <Research w={w} />, changed: 'Each finding is one card: Studies found, a cream To be fair box, In Gamify and the source; the real findings from research.ts.', why: 'Showing the caveat beside the claim builds credibility with teachers (two-sided messages persuade skeptical, informed audiences better; persuasion research, from memory), and a fixed card structure makes cards comparable at a glance (consistency).' },
  { id: 'blog', name: 'Blog index', render: (w) => <Blog w={w} />, changed: 'Topic pills, three-column post cards with a pastel doodle header, the real post titles and summaries.', why: 'A predictable card grid with filters supports scanning and information scent (information foraging theory); one accent color per card helps memory for location (dual coding).' },
  { id: 'post', name: 'Blog post', render: (w) => <Post w={w} />, changed: 'A 760px reading column, Inclusive Sans headings in sentence case, numbered steps and a mint Why it works card.', why: 'Lines of about 60 to 75 characters and 20px body text read fastest and with least fatigue (typography readability research, from memory); numbered steps match how teachers plan a lesson (procedural chunking).' },
  { id: 'themes', name: 'Themes gallery', render: (w) => <Themes w={w} />, changed: 'A featured-class card on Butter, three filter pills, theme cards with a heart button (44px) and a credit line.', why: 'Showcasing class-made work is social proof and identity (people adopt what peers like them make); the heart is a low-cost commitment that brings teachers back (endowment effect).' },
  { id: 'join', name: 'Join with a code (student page)', ipad: true, render: (w) => <Join w={w} />, changed: 'One card, six big code boxes, the yellow Go; the top bar shows only the logo (teacher, 2026-11-24: \"remove login entirely from student pages\"), and the footer only help links: no log in, no teacher links, no Pricing, no price or buy words on a page students use.', why: 'One task per screen for young users (cognitive load, Apple Kids guidelines from memory); boxes per digit show progress and the next spot (feedforward, goal-gradient); 72px boxes and a 60px button pass touch-target sizes for small fingers (WCAG 2.5.5).' },
  { id: 'login', name: 'Teacher log in', render: (w) => <SignIn w={w} />, changed: 'One centered card with a Log in / Sign up switch, labels above fields, 54px fields and one yellow button; "Students never need an account" stays.', why: 'Labels above fields and a single column are the fastest form layout (form usability research, from memory); one primary action avoids choice paralysis (Hick\'s law).' },
  { id: 'signup', name: 'Teacher sign up', render: (w) => <SignIn w={w} signup />, changed: 'Same card, email added, the username rule shown as a hint before it is typed.', why: 'Showing the rule before the error prevents mistakes (error prevention, NN/g heuristic 5).' },
];
function NavSheet() {
  return (
    <div className="grid gap-4">
      {[1440, 820, 390].map((w) => <PageFrame key={w} w={w} label={`Top bar at ${w}px`}><SiteNav w={w} on="Home" /></PageFrame>)}
      <PageFrame w={390} label="Student top bar (Join)"><SiteNav w={390} student /></PageFrame>
      <div className="grid gap-4 lg:grid-cols-[3fr_1fr]"><PageFrame w={1440} label="Footer, laptop"><SiteFooter w={1440} /></PageFrame><PageFrame w={390} label="Footer, phone"><SiteFooter w={390} /></PageFrame></div>
    </div>
  );
}

export default function PublicPages() {
  return (
    <section className="grid gap-8">
      <div className="grid gap-1">
        <h2 className="font-heading text-2xl">Public pages <span className="text-base align-middle px-2 py-0.5 rounded-full border-2 border-black bg-[#fdfd94]">Proposal</span></h2>
        <p className="text-sm font-semibold text-muted max-w-prose">Home, Features, Pricing, Research, Blog, Themes, Join and teacher sign in, redesigned in the new direction with the real words from the live pages. Each page shows on a laptop and a phone (Home and Join on an iPad portrait too) at its real width, the whole page top to bottom. Preview only: no live page changes until you approve.</p>
      </div>
      <nav aria-label="Jump to a page" className="flex flex-wrap gap-2">{[...PAGES.map((p) => [p.id, p.name]), ['nav', 'Top bar and footer']].map(([id, n]) => <a key={id} href={`#pp-${id}`} className="px-3 py-1.5 rounded-full font-bold text-sm border-2 border-black bg-[#fffaf0] hover:bg-[#fdfd94]">{n}</a>)}</nav>
      <article id="pp-nav" className="grid gap-3 scroll-mt-24 pt-6 border-t-2 border-black/20">
        <h3 className="font-heading text-xl">Top bar and footer</h3>
        <p className="text-sm font-semibold"><b>What changed:</b> the white top bar keeps the real wordmark and adds Research, Themes and Blog; the current page wears Butter; phones fold links into one 44px menu button beside Log in; student pages show only the logo, with no log in or teacher links. The footer groups links in three columns with the no ads line; the Vermont tag line sits in a marked placeholder slot until the new words arrive. <b>Why:</b> a persistent, predictable nav lowers wayfinding effort (Jakob&apos;s law: people expect sites to work like the ones they know), and the current-page mark answers &quot;where am I?&quot; (NN/g visibility of status).</p>
        <NavSheet />
      </article>
      {PAGES.map((p) => (
        <article key={p.id} id={`pp-${p.id}`} className="grid gap-3 scroll-mt-24 pt-6 border-t-2 border-black/20">
          <h3 className="font-heading text-xl">{p.name}</h3>
          <p className="text-sm font-semibold"><b>What changed:</b> {p.changed}</p>
          <p className="text-sm font-semibold"><b>Why (research):</b> {p.why}</p>
          <div className="flex gap-4 items-start">
            <div style={{ flex: '3 1 0' }} className="min-w-0"><PageFrame w={1440} label="Laptop 1440">{p.render(1440)}</PageFrame></div>
            {p.ipad && <div style={{ flex: '1.4 1 0' }} className="min-w-0"><PageFrame w={820} label="iPad portrait 820">{p.render(820)}</PageFrame></div>}
            <div style={{ flex: '1 1 0' }} className="min-w-0"><PageFrame w={390} label="Phone 390">{p.render(390)}</PageFrame></div>
          </div>
        </article>
      ))}
    </section>
  );
}
