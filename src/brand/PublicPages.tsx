import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowRight, BookOpen, Broadcast, Buildings, ChalkboardTeacher, Check, Heart, House, PaintBrush, Play, ShieldCheck, Stack, Television, User, UsersThree } from '@phosphor-icons/react';
import { PP } from './PaletteProposal';
import { CrayonPowerUp, Doodle } from './CrayonKit';
import { GAME_COVERS } from './GameMockups';
import { GO_YELLOW, PURPLE_GROUND, WAYS_STYLE } from './mockKit';
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
// Solo). Each page shows on a laptop (1280) and a phone (390); Home and Join
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
  return <h1 style={{ ...GY, fontSize: isPhone(w) ? 44 : w < 1000 ? 64 : 80, lineHeight: 0.95 }}>{children}</h1>;
}
function H2({ children, w, center }: W & { children: ReactNode; center?: boolean }) {
  return <h2 className={center ? 'text-center' : ''} style={{ ...GY, fontSize: isPhone(w) ? 32 : 46, lineHeight: 1 }}>{children}</h2>;
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
function IconDot({ children, bg }: { children: ReactNode; bg: string }) {
  return <span className="w-12 h-12 shrink-0 rounded-full grid place-items-center" style={{ background: bg, border: `2.5px solid ${I}` }}>{children}</span>;
}

// ---------- nav and footer ----------
// The white top bar (the real wordmark, never a pill). Student front doors
// (Join) show only the logo and a teacher log in: no Pricing link, no price or
// buy words on a page students use.
const LINKS = ['Home', 'Features', 'Pricing', 'Research', 'Themes', 'Blog'];
export function SiteNav({ w, student, on }: W & { student?: boolean; on?: string }) {
  const ph = isPhone(w);
  return (
    <header className="flex items-center gap-4" style={{ height: ph ? 60 : 76, padding: `0 ${pad(w)}px`, background: '#fbfcf8', borderBottom: `3px solid #000` }}>
      <img src="/brand/gamify-wordmark.png" alt="Gamify" className="w-auto" style={{ height: ph ? 28 : 38 }} draggable={false} />
      {student ? <span className="ml-auto font-bold" style={{ fontSize: ph ? 16 : 18 }}>Teachers: <u>Log in</u></span>
        : ph || w < 1000
          ? <span className="ml-auto flex items-center gap-2"><Pill bg="#fdfd94" w={w}>Log in</Pill><span aria-label="Menu" className="w-11 h-11 rounded-full grid place-items-center font-bold text-xl" style={{ border: '2px solid #000', background: '#fff' }}>☰</span></span>
          : <nav className="ml-auto flex items-center gap-1">
              {LINKS.map((l) => <span key={l} className="px-3 py-2 rounded-full font-bold text-[18px]" style={on === l ? { background: PP.butter, border: `2px solid ${I}` } : { border: '2px solid transparent' }}>{l}</span>)}
              <span className="ml-2 flex gap-2"><Pill bg="#e4eafe" w={w}>Join</Pill><Pill bg="#fdfd94" w={w}>Log in</Pill></span>
            </nav>}
    </header>
  );
}
function Pill({ children, bg, w }: W & { children: ReactNode; bg: string }) {
  return <span className="rounded-full font-bold whitespace-nowrap inline-flex items-center" style={{ minHeight: 44, padding: '0 18px', fontSize: isPhone(w) ? 16 : 18, background: bg, border: '2.5px solid #000' }}>{children}</span>;
}
export function SiteFooter({ w, student }: W & { student?: boolean }) {
  const ph = isPhone(w);
  const cols: [string, string[]][] = student
    ? [['Help', ['How to play', 'Help Center', 'Student data promise']]]
    : [['Gamify', ['Features', 'Pricing', 'Research', 'Themes', 'Blog']], ['For you', ['Teachers', 'Schools and districts', 'Homeschool', 'Join the beta test']], ['Trust', ['Student data promise', 'Accessibility', 'Privacy', 'Terms', 'Help Center']]];
  return (
    <footer className="mt-16 grid gap-6" style={{ padding: `${ph ? 32 : 48}px ${pad(w)}px ${ph ? 36 : 48}px`, background: '#fbfcf8', borderTop: '3px solid #000' }}>
      <div className={`grid gap-8 ${ph ? '' : 'grid-cols-[1.3fr_repeat(3,1fr)]'}`}>
        <div className="grid gap-3 content-start">
          <img src="/brand/gamify-wordmark.png" alt="Gamify" className="w-auto" style={{ height: 34, width: 'auto', justifySelf: 'start' }} draggable={false} />
          <P w={w}>Every question becomes a game. No ads, no trackers, no student emails.</P>
        </div>
        {cols.map(([h, ls]) => <div key={h} className="grid gap-2 content-start"><b className="font-heading text-[18px]">{h}</b>{ls.map((l) => <span key={l} className="font-semibold text-[17px]">{l}</span>)}</div>)}
      </div>
      <span className="font-semibold text-[15px]" style={{ color: PP.quiet }}>Made in Vermont by the Vermont Literacy Network.</span>
    </footer>
  );
}
function Page({ w, children, on, student }: W & { children: ReactNode; on?: string; student?: boolean }) {
  return <div style={{ width: w, ...PURPLE_GROUND, backgroundSize: '100% auto', backgroundRepeat: 'repeat-y', color: I }}><SiteNav w={w} on={on} student={student} />{children}<SiteFooter w={w} student={student} /></div>;
}

// A cover as a flat die-cut photo sticker: white edge, ink outline, never tilted.
function CoverSticker({ g, w: cw }: { g: (typeof COVERS)[number]; w: number }) {
  return (
    <span aria-hidden="true" className="block rounded-[22px] p-[6px] bg-white" style={{ border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}` }}>
      <span className="block relative overflow-hidden rounded-[16px]" style={{ width: cw, height: cw * 0.9 }}>
        <span className="absolute top-0 left-0 origin-top-left" style={{ width: 720, height: 648, transform: `scale(${cw / 720})` }}>{g.cover}</span>
      </span>
    </span>
  );
}

// ================= Home =================
function Home({ w }: W) {
  const ph = isPhone(w), tab = !ph && w < 1000;
  const cw = ph ? (w - 2 * pad(w) - 14) / 2 - 18 : tab ? (w - 2 * pad(w) - 28) / 3 - 18 : 196;
  const ways = (['Live', 'Share', 'Solo'] as const).map((id) => ({ id, ...WAYS_STYLE[id] }));
  return (
    <Page w={w} on="Home">
      {/* hero */}
      <section className={`grid gap-8 ${ph || tab ? 'grid-cols-[minmax(0,1fr)]' : 'grid-cols-[1fr_auto] items-center'}`} style={{ padding: `${ph ? 36 : 64}px ${pad(w)}px 0` }}>
        <div className="grid gap-5">
          <H1 w={w}>Every Question Becomes a Game</H1>
          <P w={w} big>Gamify turns your own question sets into classroom games: together on one big screen, live on every student device, or on your own.</P>
          <div className={`flex gap-3 ${ph ? 'flex-col' : 'flex-wrap'}`}><Go w={w} wide={ph}><ChalkboardTeacher weight="bold" size={22} />Start free</Go><Plain w={w} wide={ph}>Join with a code<ArrowRight weight="bold" size={20} /></Plain></div>
          <span className="font-bold" style={{ fontSize: ph ? 16 : 17, color: PP.quiet }}>Free forever for one class of 30. No card needed.</span>
        </div>
        <div className="grid gap-[14px] justify-center" style={{ gridTemplateColumns: `repeat(${ph ? 2 : 3}, ${cw + 18}px)` }}>
          {COVERS.slice(0, ph ? 4 : 6).map((g) => <CoverSticker key={g.id} g={g} w={cw} />)}
        </div>
      </section>
      {/* ways to play */}
      <Section w={w}>
        <H2 w={w} center>Three Ways to Play</H2>
        <div className={`grid gap-5 ${ph ? '' : 'grid-cols-3'}`}>
          {ways.map((x) => { const Ic = x.icon; return (
            <div key={x.id} className="grid gap-3 p-6 content-start" style={{ ...CARD, background: x.soft }}>
              <span className="w-14 h-14 rounded-full grid place-items-center" style={{ background: x.bright, border: `2.5px solid ${I}` }}><Ic weight="bold" size={28} /></span>
              <b style={{ ...GY, fontSize: 34 }}>{x.id}</b>
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
              <span className="flex items-center gap-3"><IconDot bg={bg}><Ic weight="bold" size={24} /></IconDot><b style={{ ...GY, fontSize: 30 }}>{i + 1}</b></span>
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
        <div className="grid gap-5 justify-items-center text-center relative overflow-hidden" style={{ ...CARD, background: PP.periwinkle, padding: ph ? 28 : 48 }}>
          <span className="absolute left-6 top-5" aria-hidden="true"><Doodle kind="sparkle" color={PP.lemon} size={40} /></span>
          <span className="absolute right-8 bottom-6" aria-hidden="true"><Doodle kind="star" color={PP.pink} size={34} /></span>
          <H2 w={w} center>Ready for Game Day?</H2>
          <div className={`flex gap-3 ${ph ? 'flex-col w-full' : ''}`}><Go w={w} wide={ph}>Start free</Go><Plain w={w} wide={ph}>See every feature</Plain></div>
        </div>
      </Section>
    </Page>
  );
}

// ================= Features =================
const PILLARS: { id: string; h: string; short: string; t: string; icon: typeof Stack; bg: string; items: string[] }[] = [
  { id: 'learn', short: 'Gamified learning', h: 'Every Question Becomes Practice That Sticks', t: 'Gamify runs on the question sets you write or import, so every minute of play is your lesson, not ours.', icon: Stack, bg: PP.butter, items: ['Driven by your question sets: type them, upload a spreadsheet or use the library', 'Tagged with Common Core standards you can find again by code', 'Missed questions come back in later games and in Review', 'Read-aloud, a read-first pause, extra tries and tools, set per student, free'] },
  { id: 'themes', short: 'Theme creation', h: 'Students Design the Game', t: 'The Theme Builder lets your class make the look of any game: card backs, team icons, backgrounds, colors and sounds.', icon: PaintBrush, bg: PP.blush, items: ['Student choice and ownership: a class theme makes the game theirs', 'Scaffolded by age, pre-K to adult learners', 'Paper or digital: print templates and draw by hand, photos are cut out for you'] },
  { id: 'play', short: 'Game play', h: 'Three Ways to Play, One Set of Questions', t: 'Pick how the class plays each time. The same question set works in every game and every way to play.', icon: Play, bg: PP.mint, items: ['Live: every student on their own device while you watch progress on the class screen', 'Share: play together on one big screen, up to 10 teams or against the computer', 'Solo: practice on your own with a code or a homework link'] },
];
function Features({ w }: W) {
  const ph = isPhone(w);
  return (
    <Page w={w} on="Features">
      <Section w={w}>
        <div className="grid gap-4 justify-items-center text-center"><H1 w={w}>Features</H1><P w={w} big>Three things make Gamify different: your questions become real practice, your class designs how the games look, and the games fit any way you teach.</P></div>
        <div className={`flex gap-3 justify-center ${ph ? 'flex-col' : ''}`}>{PILLARS.map((p) => { const Ic = p.icon; return <span key={p.id} className="inline-flex items-center justify-center gap-2 rounded-full px-5 font-bold" style={{ minHeight: 48, fontSize: ph ? 16 : 18, background: p.bg, border: `2.5px solid ${I}` }}><Ic weight="bold" size={20} />{p.short}</span>; })}</div>
      </Section>
      {PILLARS.map((p, n) => { const Ic = p.icon; return (
        <Section key={p.id} w={w}>
          <div className={`grid gap-8 items-center ${ph ? '' : n % 2 ? 'grid-cols-[1fr_1.1fr]' : 'grid-cols-[1.1fr_1fr]'}`} style={{ ...CARD, padding: ph ? 24 : 40 }}>
            <div className={`grid gap-4 ${!ph && n % 2 ? 'order-2' : ''}`}>
              <IconDot bg={p.bg}><Ic weight="bold" size={24} /></IconDot>
              <H2 w={w}>{p.h}</H2><P w={w} big>{p.t}</P>
              <ul className="m-0 p-0 list-none grid gap-2.5">{p.items.map((x) => <li key={x} className="flex gap-3 items-start font-semibold leading-snug" style={{ fontSize: ph ? 17 : 18 }}><span className="mt-0.5 w-7 h-7 shrink-0 rounded-full grid place-items-center" style={{ background: PP.kelly, border: `2px solid ${I}` }}><Check weight="bold" size={15} /></span>{x}</li>)}</ul>
            </div>
            <div className="rounded-[20px] overflow-hidden justify-self-center" style={{ border: `3px solid ${I}`, width: ph ? '100%' : 440, aspectRatio: '720 / 648', position: 'relative', background: p.bg }}>
              <div className="absolute inset-0 grid place-items-center">{p.id === 'learn' ? <CrayonPowerUp id="double-points" size={160} /> : p.id === 'themes' ? <PaintBrush weight="duotone" size={160} color={PP.pink} /> : <div className="flex gap-4">{[Broadcast, Television, User].map((X, i) => <span key={i} className="w-24 h-24 rounded-full grid place-items-center" style={{ background: [PP.sky, PP.lemon, PP.kelly][i], border: `3px solid ${I}` }}><X weight="bold" size={46} /></span>)}</div>}</div>
            </div>
          </div>
        </Section>); })}
      <Section w={w}><div className="grid gap-4 justify-items-center text-center"><H2 w={w} center>Try It With Your Class</H2><P w={w}>Join and play for free. One class of 30 and every accessibility feature, free forever.</P><Go w={w}>Start free</Go></div></Section>
    </Page>
  );
}

// ================= Pricing (value first) =================
const PLANS = [
  { id: 'Free', who: 'Everything you need to see your class light up.', gets: ['The free games', 'One class of up to 30 students', '3 question sets of your own plus the whole library', 'Design a Game Show theme with your class'], price: '$0', note: 'Free forever. No card needed.', bg: PP.paper, go: 'Start free' },
  { id: 'Plus', who: 'The teacher favorite: every game, and your class designs how each one looks.', gets: ['Every game', 'Classes to group your students', 'Unlimited question sets', 'Your class\'s own theme for every game'], price: `$${Math.round(PRICES_USD_PER_YEAR.plus / 12)}`, note: `a month, billed yearly at $${PRICES_USD_PER_YEAR.plus}`, bg: PP.butter, go: 'Start with Plus', best: true },
  { id: 'Pro', who: 'Everything, with no limits, for classrooms that play every day.', gets: ['Everything in Plus', 'Unlimited classes and themes', 'A game for each group, one set', 'Early access to new games'], price: `$${Math.round(PRICES_USD_PER_YEAR.pro / 12)}`, note: `a month, billed yearly at $${PRICES_USD_PER_YEAR.pro}`, bg: PP.blueCrystal, go: 'Start with Pro' },
];
function Pricing({ w }: W) {
  const ph = isPhone(w);
  return (
    <Page w={w} on="Pricing">
      <Section w={w}>
        <div className="grid gap-4 justify-items-center text-center"><H1 w={w}>Plans</H1><P w={w} big>Every plan turns your questions into games your class asks for. Start free today; unlock every game and your class&apos;s own designs whenever you are ready.</P></div>
        <div className={`grid gap-5 items-stretch ${ph ? '' : 'grid-cols-3'}`}>
          {PLANS.map((p) => (
            <div key={p.id} className="grid gap-4 content-start p-6 relative" style={{ ...CARD, background: p.bg }}>
              {p.best && <span className="absolute -top-4 left-6 px-4 py-1 rounded-full font-bold text-[16px]" style={{ background: PP.pink, color: I, border: `2.5px solid ${I}` }}>Teacher favorite</span>}
              <b style={{ ...GY, fontSize: 40 }}>{p.id}</b>
              <P w={w}>{p.who}</P>
              {/* value before price: what the class gets, then the cost */}
              <ul className="m-0 p-0 list-none grid gap-2">{p.gets.map((x) => <li key={x} className="flex gap-2.5 items-start font-semibold leading-snug text-[17px]"><Check weight="bold" size={20} className="mt-0.5 shrink-0" color={PP.kelly} />{x}</li>)}</ul>
              <div className="grid gap-1 pt-3" style={{ borderTop: `2px dashed ${I}` }}><b className="tabular-nums" style={{ ...GY, fontSize: 48 }}>{p.price}</b><span className="font-semibold text-[16px]">{p.note}</span></div>
              <Go w={w} wide>{p.go}</Go>
            </div>
          ))}
        </div>
        <div className={`flex gap-3 justify-center ${ph ? 'flex-col' : 'flex-wrap'}`}>{['No card needed to start', 'Cancel any time', 'Nothing is ever deleted', 'Accessibility free on every plan'].map((x) => <span key={x} className="inline-flex items-center justify-center gap-2 rounded-full px-5 font-bold text-[17px]" style={{ minHeight: 48, background: '#fff', border: `2.5px solid ${I}` }}><Heart weight="bold" size={18} />{x}</span>)}</div>
      </Section>
      <Section w={w}>
        <div className={`grid gap-6 ${ph ? '' : 'grid-cols-2'}`}>
          <div className="grid gap-3 p-6 content-start" style={CARD}><H3 w={w}>Free on Every Plan, Always</H3>{['Read-aloud for every question and answer', 'Calm mode, less motion and sound controls', 'Bigger text, high contrast and color-safe colors', 'No ads, ever, for students or teachers'].map((x) => <span key={x} className="flex gap-2.5 font-semibold text-[17px]"><Check weight="bold" size={20} color={PP.kelly} className="shrink-0 mt-0.5" />{x}</span>)}</div>
          <div className="grid gap-3 p-6 content-start" style={{ ...CARD, background: PP.mint }}><H3 w={w}>Schools and Districts</H3><P w={w}>Every teacher gets Pro on one yearly invoice, paid by purchase order or card, with your privacy agreement signed on request. Get your quote by email, no sales call.</P><Plain w={w}>Get a quote</Plain></div>
        </div>
      </Section>
      <Section w={w}>
        <H2 w={w} center>Questions</H2>
        {([['What does the Free plan include?', 'One class of up to 30 students, the free games and every accessibility feature, free forever with no card.'], ['What happens to my work if my plan changes?', 'Nothing is deleted. The account moves to Free and everything stays safe.']] as const).map(([q, a]) => <div key={q} className="grid gap-2 p-5" style={CARD}><H3 w={w}>{q}</H3><P w={w}>{a}</P></div>)}
      </Section>
    </Page>
  );
}

// ================= Research =================
function Research({ w }: W) {
  const ph = isPhone(w);
  return (
    <Page w={w} on="Research">
      <Section w={w}><div className="grid gap-4 justify-items-center text-center"><H1 w={w}>Research</H1><P w={w} big>What studies found about practice questions and gamified learning, with the honest caveats. These are not studies of Gamify itself.</P></div></Section>
      <Section w={w} tight>
        <div className={`grid gap-5 ${ph ? '' : 'grid-cols-2'}`}>
          {FINDINGS.slice(0, 4).map((f, i) => (
            <article key={f.id} className="grid gap-3 p-6 content-start" style={CARD}>
              <span className="flex items-center gap-3"><IconDot bg={[PP.butter, PP.blush, PP.aqua, PP.lavender][i % 4]}><BookOpen weight="bold" size={24} /></IconDot><H3 w={w}>{f.title}</H3></span>
              <div className="grid gap-1"><b className="text-[16px]">Studies found</b><P w={w}>{f.found}</P></div>
              <div className="grid gap-1 rounded-[16px] p-3" style={{ background: PP.cream }}><b className="text-[16px]">To be fair</b><P w={w}>{f.fair}</P></div>
              <div className="grid gap-1"><b className="text-[16px]">In Gamify</b><P w={w}>{f.inGamify}</P></div>
              <span className="font-semibold text-[15px]" style={{ color: PP.quiet }}>{f.sources[0].cite}</span>
            </article>
          ))}
        </div>
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
      <Section w={w}><div className="grid gap-4 justify-items-center text-center"><H1 w={w}>Blog</H1><P w={w} big>Ideas for game day, theme guides and how to play every game.</P></div>
        <div className={`flex gap-2.5 justify-center ${ph ? 'flex-wrap' : ''}`}>{['All', 'Classroom ideas', 'Themes', 'How to play', 'Homeschool'].map((x, i) => <span key={x} className="inline-flex items-center rounded-full px-5 font-bold text-[17px]" style={{ minHeight: 46, background: i === 0 ? PP.butter : '#fff', border: `2.5px solid ${I}` }}>{x}</span>)}</div>
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
            <div key={h} className="grid gap-2"><h2 className="font-heading font-bold flex items-center gap-3" style={{ fontSize: ph ? 23 : 28 }}><span className="w-10 h-10 rounded-full grid place-items-center shrink-0" style={{ ...GY, fontSize: 22, background: PP.butter, border: `2.5px solid ${I}` }}>{i + 1}</span>{h}</h2><p className="font-medium leading-relaxed" style={{ fontSize: ph ? 18 : 20 }}>{t}</p></div>
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
      <Section w={w}><div className="grid gap-4 justify-items-center text-center"><H1 w={w}>Themes</H1><P w={w} big>Looks for every game, designed by classes and teachers. Heart the ones you love, then offer them to your students when you assign a set.</P></div>
        <div className="grid gap-4 p-6" style={{ ...CARD, background: PP.butter }}><H3 w={w}>Your class could be featured here</H3><P w={w}>The Theme Building Challenge winner gets this spot, seen by every teacher.</P></div>
        <div className={`flex gap-2.5 ${ph ? 'flex-wrap' : 'justify-center'}`}>{['Game: All games', 'Ages: All ages', 'Sort: Trending'].map((x) => <span key={x} className="inline-flex items-center rounded-full px-5 font-bold text-[17px]" style={{ minHeight: 46, background: '#fff', border: `2.5px solid ${I}` }}>{x} ▾</span>)}</div>
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
            {['4', '7', '2', '', '', ''].map((d, i) => <span key={i} className="grid place-items-center tabular-nums" style={{ ...GY, width: box, height: box * 1.15, fontSize: box * 0.62, borderRadius: 16, background: i === 3 ? PP.butter : '#fff', border: `3px solid ${I}`, boxShadow: i === 3 ? `0 0 0 4px ${PP.lemon}` : undefined }}>{d}</span>)}
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
          <h1 className="text-center" style={{ ...GY, fontSize: ph ? 38 : 50 }}>{signup ? 'Start Free' : 'Teacher Log In'}</h1>
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
  { id: 'home', name: 'Home', ipad: true, render: (w) => <Home w={w} />, changed: 'The tagline leads in Grow Year capitals on the purple ground; covers become flat die-cut stickers in a calm grid (no tilt); four ways become three (Live, Share, Solo) in their palette pairs; a new How it works row; research lines sit on cards with the honest caveat; trust pills and one CTA band.', why: 'Visitors decide in seconds and read in an F pattern, so the promise and two doors (Start free, Join with a code) come first (NN/g first-impression and F-pattern research, from memory); concrete social and research proof near the CTA lowers risk (trust signals); fewer choices up top speeds the decision (Hick\'s law).' },
  { id: 'features', name: 'Features', render: (w) => <Features w={w} />, changed: 'Three pillars in big alternating cards with one picture each and check lists, a jump row of pastel pills, three ways to play instead of four.', why: 'Chunking a long feature list into three named groups lowers cognitive load (Miller, chunking) and the alternating zig-zag keeps a scanning rhythm (Gestalt proximity and common region).' },
  { id: 'pricing', name: 'Pricing', render: (w) => <Pricing w={w} />, changed: 'Value first: each plan opens with who it is for and what the class gets, then the monthly number with the yearly total under it; one favorite tag; trust pills; Free on every plan and Schools side by side; a short FAQ.', why: 'Leading with outcomes frames price as an investment (anchoring and framing effects); a single highlighted plan uses the center-stage and decoy effects honestly, with no fake urgency; risk reducers (no card, cancel any time, nothing deleted) answer loss aversion.' },
  { id: 'research', name: 'Research', render: (w) => <Research w={w} />, changed: 'Each finding is one card: Studies found, a cream To be fair box, In Gamify and the source; the real findings from research.ts.', why: 'Showing the caveat beside the claim builds credibility with teachers (two-sided messages persuade skeptical, informed audiences better; persuasion research, from memory), and a fixed card structure makes cards comparable at a glance (consistency).' },
  { id: 'blog', name: 'Blog index', render: (w) => <Blog w={w} />, changed: 'Topic pills, three-column post cards with a pastel doodle header, the real post titles and summaries.', why: 'A predictable card grid with filters supports scanning and information scent (information foraging theory); one accent color per card helps memory for location (dual coding).' },
  { id: 'post', name: 'Blog post', render: (w) => <Post w={w} />, changed: 'A 760px reading column, Inclusive Sans headings in sentence case, numbered steps and a mint Why it works card.', why: 'Lines of about 60 to 75 characters and 20px body text read fastest and with least fatigue (typography readability research, from memory); numbered steps match how teachers plan a lesson (procedural chunking).' },
  { id: 'themes', name: 'Themes gallery', render: (w) => <Themes w={w} />, changed: 'A featured-class card on Butter, three filter pills, theme cards with a heart button (44px) and a credit line.', why: 'Showcasing class-made work is social proof and identity (people adopt what peers like them make); the heart is a low-cost commitment that brings teachers back (endowment effect).' },
  { id: 'join', name: 'Join with a code (student page)', ipad: true, render: (w) => <Join w={w} />, changed: 'One card, six big code boxes, the yellow Go; the top bar shows only the logo and a teacher log in, and the footer only help links: no Pricing link, no price or buy words on a page students use.', why: 'One task per screen for young users (cognitive load, Apple Kids guidelines from memory); boxes per digit show progress and the next spot (feedforward, goal-gradient); 72px boxes and a 60px button pass touch-target sizes for small fingers (WCAG 2.5.5).' },
  { id: 'login', name: 'Teacher log in', render: (w) => <SignIn w={w} />, changed: 'One centered card with a Log in / Sign up switch, labels above fields, 54px fields and one yellow button; "Students never need an account" stays.', why: 'Labels above fields and a single column are the fastest form layout (form usability research, from memory); one primary action avoids choice paralysis (Hick\'s law).' },
  { id: 'signup', name: 'Teacher sign up', render: (w) => <SignIn w={w} signup />, changed: 'Same card, email added, the username rule shown as a hint before it is typed.', why: 'Showing the rule before the error prevents mistakes (error prevention, NN/g heuristic 5).' },
];
function NavSheet() {
  return (
    <div className="grid gap-4">
      {[1280, 820, 390].map((w) => <PageFrame key={w} w={w} label={`Top bar at ${w}px`}><SiteNav w={w} on="Home" /></PageFrame>)}
      <PageFrame w={390} label="Student top bar (Join)"><SiteNav w={390} student /></PageFrame>
      <div className="grid gap-4 lg:grid-cols-[3fr_1fr]"><PageFrame w={1280} label="Footer, laptop"><SiteFooter w={1280} /></PageFrame><PageFrame w={390} label="Footer, phone"><SiteFooter w={390} /></PageFrame></div>
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
        <p className="text-sm font-semibold"><b>What changed:</b> the white top bar keeps the real wordmark and adds Research, Themes and Blog; the current page wears Butter; phones fold links into one 44px menu button beside Log in; student pages show only the logo and a teacher log in. The footer groups links in three columns with the no ads line. <b>Why:</b> a persistent, predictable nav lowers wayfinding effort (Jakob&apos;s law: people expect sites to work like the ones they know), and the current-page mark answers &quot;where am I?&quot; (NN/g visibility of status).</p>
        <NavSheet />
      </article>
      {PAGES.map((p) => (
        <article key={p.id} id={`pp-${p.id}`} className="grid gap-3 scroll-mt-24 pt-6 border-t-2 border-black/20">
          <h3 className="font-heading text-xl">{p.name}</h3>
          <p className="text-sm font-semibold"><b>What changed:</b> {p.changed}</p>
          <p className="text-sm font-semibold"><b>Why (research):</b> {p.why}</p>
          <div className="flex gap-4 items-start">
            <div style={{ flex: '3 1 0' }} className="min-w-0"><PageFrame w={1280} label="Laptop 1280">{p.render(1280)}</PageFrame></div>
            {p.ipad && <div style={{ flex: '1.4 1 0' }} className="min-w-0"><PageFrame w={820} label="iPad portrait 820">{p.render(820)}</PageFrame></div>}
            <div style={{ flex: '1 1 0' }} className="min-w-0"><PageFrame w={390} label="Phone 390">{p.render(390)}</PageFrame></div>
          </div>
        </article>
      ))}
    </section>
  );
}
