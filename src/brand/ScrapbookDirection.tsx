import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowRight, BookOpen, Broadcast, Buildings, ChalkboardTeacher, Check, CornersOut, GearSix, GraduationCap, Heart, House, Lifebuoy, MagnifyingGlass, Minus, PaintBrush, Play, Question, Rocket, ShieldCheck, SpeakerHigh, Stack, Star, Trophy, UsersThree, Wrench, CaretDown, Clock, ChartBar, HandTap, Lightning, Television, User } from '@phosphor-icons/react';
import { PP } from './PaletteProposal';
import { GAME_COVERS, BoardLaptop, BowlingLaptop, BubbleLaptop, ClassScreen, FourLaptop, GameShowLaptop, MatchThreeLaptop, TerritoryCoop } from './GameMockups';
import { GO_YELLOW, GText, Laptop, QuestionCard } from './mockKit';
import { BookStack, Bit, HandWord, Paper, PhotoCorner, PowerSticker, SchoolSticker, Sprinkle, StrengthProvider, Sunburst, Tape, TextCard, PAPER_NAMES, paperCss, useStrength, type PaperId, type Strength } from './ScrapbookKit';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { POSTS } from '../public/posts';
import { FAQS } from '../public/faq';
import { compareGroups } from '../public/CompareChart';
import { BILLINGS, LAUNCH_OFFER, PRICES_USD, billingSavings } from '../config';

// The Scrapbook tab (MOCKUPS ONLY, owner 2026-11-26): "there was a style for
// the public facing pages a while ago that was more colorful, scrapbook style
// and i want that to be the main art direction for public pages and the
// classic themes", then, asked which strength: "give me mockups again for
// everything and ill decide". Every public page she named and every live
// game's Classic theme (welcome cover and one in-play view), each in three
// strengths, A, B and C, side by side or one at a time. Real page words from
// src/i18n/en.ts, posts.ts, faq.ts and the real comparison chart rows. No live
// page or game changes: nothing outside src/brand reads this file.

const I = PP.ink;
const GY: CSSProperties = { fontFamily: 'var(--font-display)', fontWeight: 400, lineHeight: 1, textTransform: 'uppercase' };
const CARD: CSSProperties = { background: '#ffffff', border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}`, borderRadius: 26 };
type W = { w: number };
const isPh = (w: number) => w < 600;
// Same width and margins on every page (owner 2026-11-25: max-w-6xl, 1152px).
const gut = (w: number) => (isPh(w) ? 20 : w < 1000 ? 40 : Math.max(64, (w - 1152) / 2));
const roomy = (w: number) => w >= 1300; // room in the side margins for edge pieces

// ---------------------------------------------------------------- page parts
function Go({ children, w, wide, off }: W & { children: ReactNode; wide?: boolean; off?: boolean }) {
  const p = isPh(w);
  return <span className={`${wide ? 'w-full' : ''} inline-flex items-center justify-center gap-2 rounded-full font-bold whitespace-nowrap`} style={{ minHeight: p ? 52 : 58, padding: `0 ${p ? 22 : 28}px`, fontSize: p ? 19 : 21, background: off ? '#e9e6ef' : GO_YELLOW, color: off ? '#6b6680' : I, border: `3px solid ${off ? '#9a96aa' : I}`, boxShadow: off ? 'none' : `0 5px 0 ${I}` }}>{children}</span>;
}
function Grape({ children, w, wide }: W & { children: ReactNode; wide?: boolean }) {
  const p = isPh(w);
  return <span className={`${wide ? 'w-full' : ''} inline-flex items-center justify-center gap-2 rounded-full font-bold whitespace-nowrap`} style={{ minHeight: p ? 52 : 58, padding: `0 ${p ? 22 : 28}px`, fontSize: p ? 19 : 21, background: PP.grape, color: '#ffffff', border: `3px solid ${I}`, boxShadow: `0 5px 0 ${PP.grapeDeep}` }}>{children}</span>;
}
function Plain({ children, w, wide }: W & { children: ReactNode; wide?: boolean }) {
  const p = isPh(w);
  return <span className={`${wide ? 'w-full' : ''} inline-flex items-center justify-center gap-2 rounded-full font-bold whitespace-nowrap`} style={{ minHeight: p ? 52 : 58, padding: `0 ${p ? 22 : 26}px`, fontSize: p ? 19 : 20, background: '#ffffff', color: I, border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}` }}>{children}</span>;
}
// Never break a word across two lines (owner 2026-11-24): each word stays whole,
// the logo G included.
function Words({ text }: { text: string }) {
  return <>{text.split(' ').map((x, i) => <span key={i}>{i ? ' ' : ''}<span className="whitespace-nowrap"><GText>{x}</GText></span></span>)}</>;
}
function H1({ children, w, size }: W & { children: string; size?: number }) {
  return <h1 style={{ ...GY, fontSize: size ?? (isPh(w) ? 42 : w < 1000 ? 58 : 70), lineHeight: 0.98 }}>{children.split('\n').map((l, i) => <span key={i} className="block"><Words text={l} /></span>)}</h1>;
}
function H2({ children, w }: W & { children: string }) {
  return <h2 style={{ ...GY, fontSize: isPh(w) ? 30 : 42, lineHeight: 1 }}><Words text={children} /></h2>;
}
function H3({ children, w }: W & { children: ReactNode }) {
  return <h3 className="font-heading font-bold leading-tight" style={{ fontSize: isPh(w) ? 20 : 23 }}>{children}</h3>;
}
function P({ children, w, big, quiet }: W & { children: ReactNode; big?: boolean; quiet?: boolean }) {
  return <p className="font-semibold leading-snug" style={{ fontSize: isPh(w) ? (big ? 19 : 17) : big ? 22 : 18, color: quiet ? PP.quiet : undefined }}>{children}</p>;
}
function Link_({ children }: { children: ReactNode }) {
  return <span className="font-bold text-[17px] inline-flex items-center gap-1.5 underline underline-offset-4">{children}<ArrowRight weight="bold" size={16} /></span>;
}
function Dot({ children, bg, size = 48 }: { children: ReactNode; bg: string; size?: number }) {
  return <span className="shrink-0 rounded-full grid place-items-center" style={{ width: size, height: size, background: bg, border: `2.5px solid ${I}` }}>{children}</span>;
}
// A section: the content keeps the page width; edge pieces sit in the side
// margins (deco), never under words or buttons.
function Sec({ w, children, deco, top }: W & { children: ReactNode; deco?: ReactNode; top?: number }) {
  return (
    <section className="relative" style={{ padding: `${top ?? (isPh(w) ? 40 : 60)}px ${gut(w)}px 0` }}>
      {deco && <div aria-hidden="true" className="absolute inset-0 pointer-events-none">{deco}</div>}
      <div className="relative grid gap-6">{children}</div>
    </section>
  );
}
// The page title (owner 2026-11-24: says what the page is, left aligned, the
// subtext full width under it, no kicker above it).
function Head({ w, title, sub, children }: W & { title: string; sub?: string; children?: ReactNode }) {
  return <div className="grid gap-4 justify-items-start text-left">{<H1 w={w}>{title}</H1>}{sub && <P w={w} big>{sub}</P>}{children}</div>;
}
const grid = (w: number, n: number, ph = 1) => ({ display: 'grid', gap: isPh(w) ? 16 : 22, gridTemplateColumns: `repeat(${isPh(w) ? ph : w < 1000 ? Math.min(n, 2) : n}, minmax(0, 1fr))` }) as CSSProperties;

// The one hand-lettered word, in the left margin by the title (or under the
// title row on a phone, at the right).
function WordSpot({ w, word, top = 240 }: W & { word: string; top?: number }) {
  const size = Math.min(44, Math.round(118 / (word.length * 0.62 + 0.84)));
  if (!roomy(w)) return isPh(w) ? null : <Bit style={{ right: 12, top: 8 }} tilt={-6}><HandWord text={word} size={30} /></Bit>;
  return <Bit style={{ left: Math.max(6, (gut(w) - size * (word.length * 0.62 + 0.84)) / 2), top }} tilt={-7}><HandWord text={word} size={size} /></Bit>;
}
// Edge-piece positions in the side margins.
const L = (w: number, x = 0): CSSProperties => ({ left: Math.max(4, (gut(w) - 120) / 2 + x) });
const R = (w: number, x = 0): CSSProperties => ({ right: Math.max(4, (gut(w) - 120) / 2 + x) });
function Margin({ w, children }: W & { children: ReactNode }) { return roomy(w) ? <>{children}</> : null; }

// ---------------------------------------------------------------- top bar and footer
const LINKS: StringKey[] = ['public.nav.home', 'public.nav.features', 'public.nav.pricing', 'public.nav.research', 'public.nav.themes', 'public.nav.ideas'];
function TopBar({ w, on, student, join }: W & { on?: StringKey; student?: boolean; join?: boolean }) {
  const p = isPh(w);
  const pill = (bg: string, txt: string) => <span className="rounded-full font-bold whitespace-nowrap inline-flex items-center gap-1.5" style={{ height: 40, padding: '0 16px', fontSize: p ? 16 : 17, background: bg, border: `2.5px solid ${I}` }}>{txt === t('public.nav.login') && <ChalkboardTeacher weight="bold" size={17} />}{txt}</span>;
  const round = (ic: ReactNode, l: string) => <span aria-label={l} className="w-11 h-11 rounded-full grid place-items-center bg-white" style={{ border: `2.5px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}>{ic}</span>;
  return (
    // The top bar is pure white (owner 2026-11-24); no scrapbook on the bar itself.
    <header className="relative z-10 flex items-center gap-4" style={{ height: p ? 60 : 68, padding: `0 ${p ? 16 : gut(w)}px`, background: '#ffffff', borderBottom: `3px solid ${I}` }}>
      <img src="/brand/gamify-wordmark.png" alt="Gamify" className="w-auto" style={{ height: p ? 28 : 34 }} draggable={false} />
      {student
        // Student pages show the logo only; on Join, Listen and Settings sit together top right (owner 2026-11-26).
        ? join && <span className="ml-auto flex gap-2.5">{round(<SpeakerHigh weight="bold" size={20} />, t('q.listen'))}{round(<GearSix weight="bold" size={20} />, t('settings.open'))}</span>
        : w < 1000
          ? <span className="ml-auto flex items-center gap-2">{pill(GO_YELLOW, t('public.nav.login'))}<span aria-label={t('public.nav.menu')} className="w-11 h-11 rounded-full grid place-items-center bg-white" style={{ border: `2.5px solid ${I}` }}><span className="grid gap-[4px]">{[0, 1, 2].map((k) => <span key={k} className="block w-5 h-[3px] rounded-full" style={{ background: I }} />)}</span></span></span>
          : <nav className="ml-auto flex items-center gap-1">
              {LINKS.map((l) => <span key={l} className="px-3 rounded-full font-bold text-[17px] inline-flex items-center" style={{ height: 40, ...(on === l ? { background: PP.butter, border: `2px solid ${I}` } : { border: '2px solid transparent' }) }}>{t(l)}</span>)}
              <span className="ml-2 flex gap-2">{pill(PP.lavender, t('public.nav.join'))}{pill(GO_YELLOW, t('public.nav.login'))}</span>
            </nav>}
    </header>
  );
}
// A row of paper swatches above the footer: a scrapbook edge for every page.
const BAND: PaperId[] = ['gingham', 'stripes', 'polka', 'stars', 'checker', 'plaid', 'gingham-pink', 'flowers', 'pinstripe', 'gingham-mint', 'dots', 'blocks'];
function PaperBand({ w }: W) {
  const n = isPh(w) ? 5 : 10, sw = w / n;
  return (
    <div aria-hidden="true" className="relative mt-16" style={{ height: isPh(w) ? 34 : 44 }}>
      {Array.from({ length: n }, (_, i) => <Paper key={i} id={BAND[i % BAND.length]} seed={i + 30} tilt={[-3, 2, -1.5, 3, -2.5][i % 5]} tape={i % 4 === 1 ? { tone: i, at: 'top', w: 56 } : undefined} style={{ left: i * sw - 6, top: [6, 0, 10, 2, 8][i % 5], width: sw + 14, height: isPh(w) ? 30 : 40 }} />)}
    </div>
  );
}
type Col = [StringKey, StringKey[]];
const COLS: Col[] = [
  ['footer.col.gamify', ['public.nav.features', 'public.nav.pricing', 'research.title', 'public.nav.themes', 'public.nav.ideas', 'footer.status']],
  ['footer.col.you', ['footer.teachers', 'footer.schools', 'public.nav.homeschool', 'public.nav.it', 'public.nav.beta', 'footer.affiliates']],
  ['footer.col.trust', ['public.nav.studentData', 'legal.a11y', 'footer.vpat', 'legal.privacy', 'legal.terms', 'legal.credits', 'public.nav.faq']],
];
function Footer({ w, student }: W & { student?: boolean }) {
  const p = isPh(w);
  const cols: Col[] = student ? [['public.nav.help', ['public.nav.faq', 'public.nav.studentData', 'public.nav.check']]] : COLS;
  return (
    <footer className="relative z-[1] grid gap-6" style={{ padding: `${p ? 28 : 40}px ${gut(w)}px ${p ? 32 : 40}px`, background: '#ffffff', borderTop: `3px solid ${I}` }}>
      <div className="grid gap-8" style={{ gridTemplateColumns: p ? '1fr 1fr' : student ? '1.3fr 1fr' : '1.3fr repeat(3, 1fr)' }}>
        <div className="grid gap-3 content-start" style={p ? { gridColumn: '1 / -1' } : undefined}>
          <img src="/brand/gamify-wordmark.png" alt="Gamify" className="w-auto justify-self-start" style={{ height: 32 }} draggable={false} />
          <P w={w} quiet>{t('footer.tagline')}</P>
        </div>
        {cols.map(([h, ls]) => <div key={h} className="grid gap-1.5 content-start"><b className="font-heading text-[18px]">{t(h)}</b>{ls.map((l) => <span key={l} className="font-semibold text-[16px]">{t(l)}</span>)}</div>)}
      </div>
      <span className="text-sm font-bold" style={{ color: PP.quiet }}>{t('legal.copyright', { year: 2026 })}</span>
    </footer>
  );
}
function Page({ w, on, student, join, children }: W & { on?: StringKey; student?: boolean; join?: boolean; children: ReactNode }) {
  return <div className="relative overflow-hidden" style={{ width: w, background: PP.cream, color: I }}><TopBar w={w} on={on} student={student} join={join} />{children}<PaperBand w={w} /><Footer w={w} student={student} /></div>;
}

// A game cover as a photo (the Classic cover art, never redrawn), on a white mat.
const COVER = (id: string) => GAME_COVERS.find((g) => g.id === id)!;
function CoverPhoto({ id, cw, mat = 7 }: { id: string; cw: number; mat?: number }) {
  const ch = cw * 0.9, k = (cw - 2 * mat) / 720;
  return (
    <span className="block relative" style={{ width: cw, height: ch, background: '#ffffff', padding: mat, borderRadius: 14, boxShadow: '0 4px 0 rgba(29,26,51,0.2)', border: `2.5px solid ${I}` }}>
      <span className="block relative overflow-hidden rounded-[8px]" style={{ width: cw - 2 * mat - 5, height: ch - 2 * mat - 5 }}>
        <span className="absolute top-0 left-0 origin-top-left" style={{ width: 720, height: 648, transform: `scale(${k})` }}>{COVER(id).cover}</span>
      </span>
    </span>
  );
}

// ================================================================ Home
const HOME_COVERS = ['game-show', 'castle-quest', 'match-three', 'four-in-a-row', 'bubble-pop', 'bowling'];
function HomeCollage({ w, colW }: W & { colW: number }) {
  const p = isPh(w);
  const cols = p ? 3 : 2, gap = p ? 10 : 16;
  const gw = colW * (p ? 0.9 : 0.8), cw = (gw - (cols - 1) * gap) / cols, ch = cw * 0.9;
  const rows = 6 / cols, gh = rows * ch + (rows - 1) * gap;
  const boxH = gh / (p ? 0.78 : 0.86);
  const tilts = [-3, 2, -1.5, 2.5, -2, 1.5];
  return (
    <div aria-hidden="true" className="relative justify-self-center" style={{ width: colW, height: boxH }}>
      <Paper id="gingham" seed={2} tilt={-4} tape={{ tone: 0, at: 'tl' }} style={{ left: '0%', top: '2%', width: '60%', height: '48%' }} />
      <Paper id="stripes" seed={3} tilt={3} tape={{ tone: 2, at: 'tr' }} style={{ right: '0%', top: '12%', width: '54%', height: '46%' }} />
      <Paper id="stars" seed={4} tilt={-2} tape={{ tone: 3, at: 'top' }} style={{ left: '12%', bottom: '0%', width: '66%', height: '40%' }} />
      <div className="absolute grid" style={{ left: (colW - gw) / 2, top: (boxH - gh) / 2, gridTemplateColumns: `repeat(${cols}, ${cw}px)`, gap }}>
        {HOME_COVERS.map((id, i) => <span key={id} className="relative block"><Bit style={{ position: 'relative', left: 0, top: 0 }} tilt={tilts[i]} tape={i === 0 || i === 3 ? { tone: i + 1, w: cw * 0.38 } : undefined}><CoverPhoto id={id} cw={cw} mat={p ? 4 : 7} /></Bit></span>)}
      </div>
      <Bit style={{ left: '-3%', top: '-3%' }} tilt={-8}><PowerSticker id="double-points" size={p ? 64 : 104} /></Bit>
      <Bit style={{ right: '-3%', top: '40%' }} tilt={7}><PowerSticker id="spin-wheel" size={p ? 56 : 92} /></Bit>
      <Bit style={{ right: '4%', bottom: '-2%' }} tilt={-5}><SchoolSticker kind="bus" size={p ? 60 : 96} /></Bit>
      <Bit style={{ left: '-2%', bottom: '2%' }} tilt={-6}><HandWord text="Play!" size={p ? 30 : 46} /></Bit>
      <Sprinkle spots={[[colW * 0.46, -10, 26, PP.lemon], [colW * 0.94, boxH * 0.1, 20, PP.pink], [colW * 0.02, boxH * 0.55, 22, PP.sky], [colW * 0.55, boxH - 18, 18, PP.kelly, 'dot'], [colW * 0.86, boxH * 0.82, 22, PP.lemon]]} />
    </div>
  );
}
const WAYS: [string, Icon, string, string, StringKey][] = [
  ['Live', Broadcast, PP.sky, PP.blueCrystal, 'public.mode.live'], ['Share', Television, PP.lemon, PP.butter, 'public.mode.share'], ['Solo', User, PP.kelly, PP.mint, 'public.mode.solo'],
];
type Icon = typeof Play;
function Home({ w }: W) {
  const p = isPh(w), tab = !p && w < 1000;
  const inner = w - 2 * gut(w);
  const colW = p || tab ? inner : (inner - 56) * 0.52;
  const text = (
    <div className="grid gap-6 content-center">
      <H1 w={w} size={p ? 42 : tab ? 60 : 64}>{p || tab ? 'Every Question Becomes a Game' : 'Every Question\nBecomes a Game'}</H1>
      <P w={w} big>{t('public.heroSub')}</P>
      <div className={`flex gap-3 ${p ? 'flex-col' : 'flex-wrap'}`}><Go w={w} wide={p}><ChalkboardTeacher weight="bold" size={22} />{t('public.startFree')}</Go><Plain w={w} wide={p}>{t('public.joinCode')}<ArrowRight weight="bold" size={20} /></Plain></div>
      <span className="font-bold" style={{ fontSize: p ? 16 : 17, color: PP.quiet }}>{t('public.freeNote')}</span>
    </div>
  );
  const why: [Icon, StringKey, StringKey, string][] = [[Lightning, 'public.why.practice', 'public.why.practice.text', PP.butter], [Rocket, 'public.why.support', 'public.why.support.text', PP.blush], [Heart, 'public.why.mistakes', 'public.why.mistakes.text', PP.mint], [UsersThree, 'public.why.together', 'public.why.together.text', PP.blueCrystal], [ShieldCheck, 'public.why.udl', 'public.why.udl.text', PP.lavender]];
  const who: [Icon, StringKey, StringKey, StringKey, string][] = [[ChalkboardTeacher, 'public.who.teachers', 'public.who.teachers.text', 'public.who.teachers.go', PP.butter], [Buildings, 'public.who.schools', 'public.who.schools.text', 'public.who.schools.go', PP.mint], [House, 'public.who.homeschool', 'public.who.homeschool.text', 'public.who.homeschool.go', PP.blush]];
  return (
    <Page w={w} on="public.nav.home">
      <Sec w={w} top={p ? 28 : 44} deco={<Margin w={w}><Bit style={{ ...L(w), top: 360 }} tilt={-5}><SchoolSticker kind="pencil" size={92} /></Bit><Sprinkle spots={[[30, 560, 24, PP.lemon], [96, 640, 18, PP.pink]]} /></Margin>}>
        <div className="grid items-center" style={{ gridTemplateColumns: p || tab ? '1fr' : '0.48fr 0.52fr', gap: p ? 28 : 56 }}>{text}<HomeCollage w={w} colW={colW} /></div>
      </Sec>
      <Sec w={w} deco={<Margin w={w}><Paper id="polka" seed={7} tilt={-3} tape={{ tone: 1, at: 'top', w: 64 }} style={{ ...L(w), top: 120, width: 120, height: 150 }}><span className="absolute inset-0 grid place-items-center"><PowerSticker id="magnet" size={84} /></span></Paper><Bit style={{ ...R(w), top: 200 }} tilt={6}><SchoolSticker kind="notebook" size={96} /></Bit></Margin>}>
        <H2 w={w}>{t('public.modesTitle')}</H2>
        <div style={grid(w, 3)}>
          {WAYS.map(([n, Ic, bright, soft, k], i) => (
            <TextCard key={n} tilt={[-1.4, 1.2, -0.8][i]} tone={i + 2} className="overflow-hidden" style={{ ...CARD }}>
              <div className="h-28 grid place-items-center" style={{ background: soft, borderBottom: `3px solid ${I}` }}><Dot bg={bright} size={68}><Ic weight="bold" size={34} /></Dot></div>
              <div className="grid gap-2 p-5"><b style={{ ...GY, fontSize: 32 }}>{n}</b><P w={w}>{t(k)}</P></div>
            </TextCard>
          ))}
        </div>
      </Sec>
      <Sec w={w} deco={<Margin w={w}><Bit style={{ ...R(w), top: 90 }} tilt={4} tape={{ tone: 4, w: 64 }}><Sunburst size={124} /></Bit><Sprinkle spots={[[40, 120, 22, PP.pink], [70, 240, 18, PP.sky, 'dot']]} /></Margin>}>
        <H2 w={w}>{t('public.howTitle')}</H2>
        <div style={grid(w, 3)}>
          {[1, 2, 3].map((n) => (
            <TextCard key={n} tilt={[1, -1.3, 0.9][n - 1]} tone={n} className="grid gap-2 p-6 content-start" style={CARD}>
              <span className="justify-self-start px-3 py-1 rounded-full font-bold text-[16px]" style={{ background: [PP.butter, PP.blush, PP.mint][n - 1], border: `2px solid ${I}` }}>{t('public.howStep', { n })}</span>
              <H3 w={w}>{t(`public.how.${n}` as StringKey)}</H3><P w={w}>{t(`public.how.${n}.text` as StringKey)}</P>
            </TextCard>
          ))}
        </div>
      </Sec>
      <Sec w={w} deco={<Margin w={w}><Bit style={{ ...L(w, -6), top: 150 }}><BookStack width={124} /></Bit><Bit style={{ ...R(w), top: 120 }} tilt={-6}><SchoolSticker kind="apple" size={90} /></Bit><Bit style={{ ...R(w), top: 330 }} tilt={5}><SchoolSticker kind="ruler" size={96} /></Bit></Margin>}>
        <H2 w={w}>{t('public.whyTitle')}</H2>
        <div style={grid(w, 3)}>
          {why.map(([Ic, h, b, bg], i) => (
            <TextCard key={h} tilt={[-1, 1.2, -1.4, 0.8, -0.9][i]} tone={i} className="grid gap-3 p-6 content-start" style={CARD}>
              <span className="flex items-center gap-3"><Dot bg={bg}><Ic weight="bold" size={24} /></Dot><H3 w={w}>{t(h)}</H3></span>
              {i === 0 && <span className="flex items-baseline gap-2"><b style={{ ...GY, fontSize: 56 }}>{t('public.why.practice.stat')}</b><b className="text-[18px]">{t('public.why.practice.statLabel')}</b></span>}
              <P w={w}>{t(b)}</P>
            </TextCard>
          ))}
        </div>
        <P w={w} quiet>{t('public.whyNote')}</P>
      </Sec>
      <Sec w={w} deco={<Margin w={w}><Paper id="stripes" seed={9} tilt={3} tape={{ tone: 5, at: 'tr', w: 60 }} style={{ ...L(w), top: 110, width: 118, height: 170 }}><span className="absolute inset-0 grid place-items-center"><PowerSticker id="double-dice" size={80} /></span></Paper></Margin>}>
        <H2 w={w}>{t('public.whoTitle')}</H2>
        <div style={grid(w, 3)}>
          {who.map(([Ic, h, b, go, bg], i) => (
            <TextCard key={h} tilt={[1.2, -1, 1.4][i]} tone={i + 3} className="grid gap-3 p-6 content-start" style={CARD}>
              <Dot bg={bg}><Ic weight="bold" size={24} /></Dot><H3 w={w}>{t(h)}</H3><P w={w}>{t(b)}</P><Link_>{t(go)}</Link_>
            </TextCard>
          ))}
        </div>
      </Sec>
      <Sec w={w} deco={<Margin w={w}><Bit style={{ ...R(w), top: 70 }} tilt={-7}><PowerSticker id="treasure-chest" size={96} /></Bit><Sprinkle spots={[[gut(w) * 0.3, 90, 26, PP.lemon], [gut(w) * 0.6, 170, 18, PP.pink, 'heart']]} /></Margin>}>
        <TextCard tilt={-0.8} tone={1} className="grid gap-4 justify-items-start" style={{ ...CARD, padding: p ? 24 : 40 }}>
          <H2 w={w}>{t('public.ctaTitle')}</H2>
          <div className={`flex gap-3 ${p ? 'flex-col w-full' : ''}`}><Go w={w} wide={p}>{t('public.startFree')}</Go><Plain w={w} wide={p}>{t('public.seePlans')}</Plain></div>
        </TextCard>
      </Sec>
    </Page>
  );
}

// ================================================================ Pricing
const money = (n: number) => (n % 1 ? n.toFixed(2) : String(n));
function Pricing({ w }: W) {
  const p = isPh(w);
  const tiers = ['free', 'plus', 'pro'] as const;
  const groups = compareGroups('year').slice(0, 2);
  const Val = ({ v }: { v: boolean | string }) => (v === true ? <Check weight="bold" size={22} color={PP.kelly} aria-label={t('pricing.yes')} /> : v === false ? <Minus weight="bold" size={20} color={PP.quiet} aria-label={t('pricing.no')} /> : <span className="font-semibold">{v}</span>);
  return (
    <Page w={w} on="public.nav.pricing">
      <Sec w={w} top={p ? 32 : 52} deco={<Margin w={w}><WordSpot w={w} word="Free!" /><Bit style={{ ...R(w), top: 60 }} tilt={5} tape={{ tone: 2, w: 60 }}><Sunburst size={118} /></Bit><Bit style={{ ...L(w), top: 520 }} tilt={-6}><PowerSticker id="mystery-box" size={92} /></Bit><Bit style={{ ...R(w), top: 640 }} tilt={6}><SchoolSticker kind="crayon" size={92} /></Bit><Sprinkle spots={[[30, 300, 22, PP.pink], [100, 420, 18, PP.lemon, 'dot'], [w - 80, 300, 24, PP.lemon]]} /></Margin>}>
        <Head w={w} title={t('pricing.title')} sub={t('pricing.sub')} />
        <TextCard tilt={0.8} tone={0} className="px-5 py-4 font-bold text-[18px]" style={{ background: PP.butter, border: `3px solid ${I}`, borderRadius: 20 }}>{t('pricing.founding', { name: LAUNCH_OFFER.name, off: Math.round(LAUNCH_OFFER.discount * 100) })}</TextCard>
        <div className="flex flex-wrap gap-2 p-1.5 rounded-full justify-self-start" role="tablist" style={{ background: '#ffffff', border: `2.5px solid ${I}` }}>
          {BILLINGS.map((b) => <span key={b.id} role="tab" aria-selected={b.id === 'year'} className="px-4 rounded-full font-bold inline-flex items-center" style={{ minHeight: 42, fontSize: p ? 15 : 17, ...(b.id === 'year' ? { background: PP.butter, border: `2px solid ${I}` } : {}) }}>{b.id === 'month' ? t('pricing.billing.month') : t(`pricing.billing.${b.id}` as StringKey, { off: billingSavings('plus', b.id) })}</span>)}
        </div>
        <div className={`flex gap-3 ${p ? 'flex-col' : 'flex-wrap'}`}>{(['pricing.trust.card', 'pricing.trust.cancel', 'pricing.trust.keep', 'pricing.trust.access'] as StringKey[]).map((k) => <span key={k} className="inline-flex items-center gap-2 font-bold text-[17px] px-4 py-2 rounded-full bg-white" style={{ border: `2px solid ${I}` }}><Check weight="bold" size={18} color={PP.kelly} />{t(k)}</span>)}</div>
        <div style={{ ...grid(w, 3), alignItems: 'stretch', paddingTop: 8 }}>
          {tiers.map((x, i) => {
            const best = x === 'plus';
            return (
              <TextCard key={x} tilt={[-1.2, 0.9, 1.3][i]} tone={i + 1} tapeAt={best ? 'tr' : 'top'} className="grid gap-4 content-start p-6" style={{ ...CARD, background: best ? PP.butter : '#ffffff', border: `${best ? 3.5 : 3}px solid ${I}`, boxShadow: `0 ${best ? 8 : 5}px 0 ${I}`, marginTop: best && !p ? -14 : 0 }}>
                {best && <span className="absolute -top-5 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full font-bold text-[17px] whitespace-nowrap" style={{ background: GO_YELLOW, border: `2.5px solid ${I}` }}>{t('pricing.recommended')}</span>}
                <b style={{ ...GY, fontSize: 40 }}><GText>{t(`pricing.${x}` as StringKey)}</GText></b>
                <P w={w}>{t(`pricing.${x}.who` as StringKey)}</P>
                <ul className="m-0 p-0 list-none grid gap-2">{[1, 2, 3, 4].map((n) => <li key={n} className="flex gap-2.5 items-start font-semibold leading-snug text-[17px]"><Check weight="bold" size={20} className="mt-0.5 shrink-0" color={PP.kelly} />{t((x === 'free' ? `pricing.free.${n}` : `upgrade.${x}.${n}`) as StringKey)}</li>)}</ul>
                <span className="font-bold text-[16px] underline underline-offset-4">{t('pricing.compareAll')}</span>
                <div className="grid gap-1 pt-3" style={{ borderTop: `2px dashed ${I}` }}>
                  {x === 'free'
                    ? <><b style={{ ...GY, fontSize: 52 }}>{t('pricing.free.price')}</b><span className="font-semibold text-[16px]">{t('pricing.free.note')}</span></>
                    : <><span className="flex items-baseline gap-2"><b className="tabular-nums" style={{ ...GY, fontSize: best ? 60 : 52 }}>{t('pricing.price', { m: money(PRICES_USD[x].year / 12) })}</b><b className="text-[18px]">{t('upgrade.perMonth')}</b></span><span className="font-semibold text-[16px]">{t('pricing.renews.year', { n: money(PRICES_USD[x].year) })}</span></>}
                </div>
                {x === 'free' ? <Go w={w} wide>{t('public.startFree')}</Go> : best ? <Go w={w} wide>{t('pricing.startWith', { plan: t('pricing.plus') })}</Go> : <Plain w={w} wide>{t('pricing.startWith', { plan: t('pricing.pro') })}</Plain>}
              </TextCard>
            );
          })}
        </div>
        <span className="font-bold text-[17px] underline underline-offset-4">{t('pricing.homeschoolLink')}</span>
      </Sec>
      <Sec w={w} deco={<Margin w={w}><Paper id="plaid" seed={11} tilt={-3} tape={{ tone: 4, at: 'top', w: 60 }} style={{ ...L(w), top: 140, width: 118, height: 160 }}><span className="absolute inset-0 grid place-items-center"><PowerSticker id="shield" size={78} /></span></Paper><Bit style={{ ...R(w), top: 260 }} tilt={4}><SchoolSticker kind="notebook" size={90} /></Bit></Margin>}>
        <H2 w={w}>{t('pricing.compareAll')}</H2>
        {/* The chart is the clean core of this page: never taped or tilted. */}
        <div className="overflow-hidden" style={{ ...CARD, borderRadius: 22 }}>
          <div className="grid" style={{ gridTemplateColumns: p ? '1.4fr repeat(3, 1fr)' : '2.4fr repeat(3, 1fr)' }}>
            {['', 'free', 'plus', 'pro'].map((h, i) => <span key={h + i} className="p-3" style={{ ...GY, fontSize: p ? 18 : 26, background: h === 'plus' ? PP.butter : '#ffffff', borderBottom: `2.5px solid ${I}` }}>{h && <GText>{t(`pricing.${h}` as StringKey)}</GText>}</span>)}
            {groups.map((g) => [
              <span key={g.id} className="px-3 py-2 font-heading font-bold" style={{ gridColumn: '1 / -1', fontSize: p ? 16 : 19, background: PP.lavender, borderBottom: `2px solid ${I}` }}>{g.title}</span>,
              ...g.rows.flatMap((r) => [
                <span key={g.id + r.label} className="px-3 py-2.5 grid gap-0.5" style={{ borderBottom: '1.5px solid rgba(29,26,51,0.18)' }}><b className="text-[17px] leading-tight">{r.label}</b>{!p && <span className="text-[15px] font-semibold" style={{ color: PP.quiet }}>{r.what}</span>}</span>,
                ...tiers.map((x) => <span key={g.id + r.label + x} className="px-3 py-2.5 flex items-center text-[16px]" style={{ background: x === 'plus' ? 'rgba(255,241,184,0.65)' : undefined, borderBottom: '1.5px solid rgba(29,26,51,0.18)' }}><Val v={r.value(x)} /></span>),
              ]),
            ])}
          </div>
        </div>
      </Sec>
    </Page>
  );
}

// ================================================================ Features
function Features({ w }: W) {
  const p = isPh(w);
  const pill = (k: string): [Icon, StringKey, StringKey, string] => k === 'learning' ? [GraduationCap, 'features.p.learning', 'features.p.learning.short', PP.butter] : k === 'themes' ? [PaintBrush, 'features.p.themes', 'features.p.themes.short', PP.blush] : [Play, 'features.p.play', 'features.p.play.short', PP.mint];
  const modes: [string, Icon, string, StringKey, StringKey][] = [['Live', Broadcast, PP.blueCrystal, 'features.mode.live', 'features.mode.live.best'], ['Share', Television, PP.butter, 'features.mode.share', 'features.mode.share.best'], ['Solo', User, PP.mint, 'features.mode.solo', 'features.mode.solo.best']];
  return (
    <Page w={w} on="public.nav.features">
      <Sec w={w} top={p ? 32 : 52} deco={<Margin w={w}><WordSpot w={w} word="Wow!" /><Bit style={{ ...R(w), top: 50 }} tilt={6}><PowerSticker id="lightning" size={96} /></Bit><Bit style={{ ...L(w), top: 330 }} tilt={-5}><SchoolSticker kind="pencil" size={92} /></Bit></Margin>}>
        <Head w={w} title={t('features.title')} sub={t('features.sub')} />
        <div style={grid(w, 3)}>{['learning', 'themes', 'play'].map((k, i) => { const [Ic, h, s, bg] = pill(k); return <TextCard key={k} tilt={[-1, 1.1, -0.9][i]} tone={i} className="flex gap-3 items-start p-5" style={CARD}><Dot bg={bg}><Ic weight="bold" size={24} /></Dot><span className="grid gap-1"><H3 w={w}>{t(h)}</H3><P w={w}>{t(s)}</P></span></TextCard>; })}</div>
      </Sec>
      <Sec w={w} deco={<Margin w={w}><Paper id="gingham" seed={13} tilt={3} tape={{ tone: 3, at: 'tl', w: 60 }} style={{ ...R(w), top: 120, width: 118, height: 170 }}><span className="absolute inset-0 grid place-items-center"><PowerSticker id="hint" size={80} /></span></Paper><Sprinkle spots={[[40, 160, 24, PP.lemon], [80, 300, 18, PP.sky, 'dot']]} /></Margin>}>
        <H2 w={w}>{t('features.learn.title')}</H2><P w={w} big>{t('features.learn.text')}</P>
        <div style={grid(w, 2)}>{[1, 2, 3, 4].map((n) => <TextCard key={n} tilt={[1, -1.2, 0.8, -1][n - 1]} tone={n} className="grid gap-2 p-6" style={CARD}><H3 w={w}>{t(`features.learn.${n}` as StringKey)}</H3><P w={w}>{t(`features.learn.${n}.text` as StringKey)}</P></TextCard>)}</div>
      </Sec>
      <Sec w={w} deco={<Margin w={w}><Bit style={{ ...L(w), top: 100 }} tilt={-4} tape={{ tone: 0, w: 60 }}><Sunburst size={120} /></Bit><Bit style={{ ...R(w), top: 300 }} tilt={5}><SchoolSticker kind="crayon" size={96} /></Bit></Margin>}>
        <H2 w={w}>{t('features.theme.title')}</H2><P w={w} big>{t('features.theme.text')}</P>
        <div style={grid(w, 2)}>{[1, 2, 3, 4].map((n) => <TextCard key={n} tilt={[-1.1, 1, -0.8, 1.2][n - 1]} tone={n + 1} className="grid gap-2 p-6" style={CARD}><H3 w={w}>{t(`features.theme.${n}` as StringKey)}</H3><P w={w}>{t(`features.theme.${n}.text` as StringKey)}</P></TextCard>)}</div>
        <div className={`flex gap-3 items-center ${p ? 'flex-col items-stretch' : ''}`}><Go w={w} wide={p}>{t('features.theme.cta')}</Go><P w={w} quiet>{t('features.theme.challenge')}</P></div>
      </Sec>
      <Sec w={w} deco={<Margin w={w}><Paper id="polka" seed={15} tilt={-2} tape={{ tone: 2, at: 'top', w: 60 }} style={{ ...L(w), top: 140, width: 118, height: 160 }}><span className="absolute inset-0 grid place-items-center"><PowerSticker id="freeze" size={80} /></span></Paper></Margin>}>
        <H2 w={w}>{t('features.play.title')}</H2><P w={w} big>{t('features.play.text')}</P>
        <div style={grid(w, 3)}>{modes.map(([n, Ic, bg, k, best], i) => <TextCard key={n} tilt={[1.2, -1, 1][i]} tone={i + 3} className="grid gap-3 p-6 content-start" style={CARD}><span className="flex items-center gap-3"><Dot bg={bg}><Ic weight="bold" size={24} /></Dot><b style={{ ...GY, fontSize: 30 }}>{n}</b></span><P w={w}>{t(k)}</P><P w={w} quiet>{t(best)}</P></TextCard>)}</div>
      </Sec>
      <Sec w={w} deco={<Margin w={w}><Bit style={{ ...R(w), top: 120 }} tilt={-6}><SchoolSticker kind="apple" size={92} /></Bit><Bit style={{ ...L(w, -6), top: 200 }}><BookStack width={124} /></Bit></Margin>}>
        <H2 w={w}>{t('features.fair.title')}</H2><P w={w} big>{t('features.fair.text')}</P>
        <div style={grid(w, 3)}>{[1, 2, 3, 4, 5, 6].map((n) => <TextCard key={n} tilt={[-1, 1, -1.2, 0.9, -0.8, 1.1][n - 1]} tone={n} className="grid gap-2 p-5" style={CARD}><span className="flex items-center gap-2.5"><Dot bg={PP.mint} size={40}><Check weight="bold" size={20} /></Dot><H3 w={w}>{t(`features.fair.${n}` as StringKey)}</H3></span><P w={w}>{t(`features.fair.${n}.why` as StringKey)}</P></TextCard>)}</div>
      </Sec>
    </Page>
  );
}

// ================================================================ Blog
const BLOG_BG = [PP.butter, PP.blush, PP.mint, PP.blueCrystal, PP.peach, PP.lavender];
const BLOG_ART: ['double-points' | 'magnet' | 'spin-wheel' | 'hint' | 'shield' | 'treasure-chest'][] = [['double-points'], ['magnet'], ['spin-wheel'], ['hint'], ['shield'], ['treasure-chest']];
function Blog({ w }: W) {
  const p = isPh(w);
  const posts = POSTS.slice(0, 6);
  return (
    <Page w={w} on="public.nav.ideas">
      <Sec w={w} top={p ? 32 : 52} deco={<Margin w={w}><WordSpot w={w} word="Ideas!" /><Bit style={{ ...R(w), top: 40 }} tilt={5}><SchoolSticker kind="notebook" size={96} /></Bit><Paper id="stripes" seed={17} tilt={-3} tape={{ tone: 1, at: 'top', w: 60 }} style={{ ...L(w), top: 380, width: 118, height: 170 }}><span className="absolute inset-0 grid place-items-center"><PowerSticker id="potion" size={80} /></span></Paper><Bit style={{ ...R(w), top: 620 }} tilt={-5}><Sunburst size={116} /></Bit></Margin>}>
        <Head w={w} title={t('ways.title')} sub={t('ways.sub')} />
        <div className="flex flex-wrap gap-2.5">{(['ways.topic.all', 'ways.topic.classroom', 'ways.topic.themes', 'ways.topic.howto', 'ways.topic.homeschool'] as StringKey[]).map((k, i) => <span key={k} className="px-4 rounded-full font-bold text-[17px] inline-flex items-center" style={{ minHeight: 44, background: i === 0 ? PP.butter : '#ffffff', border: `2.5px solid ${I}` }}>{t(k)}</span>)}<span className="px-4 rounded-full font-bold text-[17px] inline-flex items-center gap-2 bg-white" style={{ minHeight: 44, border: `2.5px solid ${I}` }}>{t('ways.gradesLabel')}: {t('ways.band.all')}<CaretDown weight="bold" size={16} /></span></div>
        <div style={grid(w, 3)}>
          {posts.map((x, i) => (
            <TextCard key={x.slug} tilt={[-1.2, 1, -0.9, 1.3, -1, 0.8][i]} tone={i} as="article" className="overflow-hidden grid content-start" style={CARD}>
              {/* The card header is art (a pastel band with a power-up), never under the words. */}
              <div className="relative h-36 grid place-items-center overflow-hidden" style={{ background: BLOG_BG[i], borderBottom: `3px solid ${I}` }} aria-hidden="true">
                <PowerSticker id={BLOG_ART[i][0]} size={84} />
                <Sprinkle spots={[[18, 14, 20, PP.lemon], [p ? 260 : 300, 22, 18, PP.pink, 'heart'], [40, 100, 14, PP.sky, 'dot'], [p ? 280 : 320, 96, 20, PP.kelly]]} />
              </div>
              <div className="grid gap-2 p-5"><H3 w={w}>{x.title}</H3><P w={w}>{x.summary}</P>
                <span className="flex flex-wrap gap-3 text-[15px] font-bold" style={{ color: PP.quiet }}><span className="inline-flex items-center gap-1"><GraduationCap weight="bold" size={16} />{t('ways.grades', { grades: x.grades })}</span><span className="inline-flex items-center gap-1"><Clock weight="bold" size={16} />{t('ways.minutes', { minutes: x.minutes })}</span></span>
                <Link_>{t('ways.read')}</Link_></div>
            </TextCard>
          ))}
        </div>
      </Sec>
    </Page>
  );
}
function Post({ w }: W) {
  const p = isPh(w);
  const x = POSTS.find((q) => q.slug === 'bubble-pop-bell-ringer') ?? POSTS[0];
  const col = Math.min(760, w - 2 * gut(w));
  const side = (w - col) / 2;
  return (
    <Page w={w} on="public.nav.ideas">
      <section className="relative" style={{ padding: `${p ? 28 : 48}px ${gut(w)}px 0` }}>
        {/* The reading column stays plain; the scrapbook sits in the wide margins beside it. */}
        {!p && <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          <Bit style={{ left: side - 230, top: 40 }} tilt={-7}><HandWord text="Try it!" size={40} /></Bit>
          <Paper id="gingham-pink" seed={19} tilt={-3} tape={{ tone: 0, at: 'top', w: 70 }} style={{ left: side - 230, top: 170, width: 170, height: 210 }}><span className="absolute inset-0 grid place-items-center"><PowerSticker id="lightning" size={100} /></span></Paper>
          <Bit style={{ left: side - 200, top: 470 }}><BookStack width={150} /></Bit>
          <Paper id="stars" seed={21} tilt={3} tape={{ tone: 3, at: 'tr', w: 70 }} style={{ left: side + col + 60, top: 120, width: 170, height: 200 }}><span className="absolute inset-0 grid place-items-center"><SchoolSticker kind="bus" size={110} /></span></Paper>
          <Bit style={{ left: side + col + 70, top: 400 }} tilt={4}><Sunburst size={140} /></Bit>
          <Bit style={{ left: side + col + 80, top: 620 }} tilt={-5}><SchoolSticker kind="apple" size={100} /></Bit>
          <Sprinkle spots={[[side - 120, 420, 24, PP.lemon], [side + col + 200, 360, 22, PP.pink], [side + col + 40, 580, 18, PP.sky, 'dot']]} />
        </div>}
        <article className="relative mx-auto grid gap-5" style={{ maxWidth: col }}>
          <span className="font-bold text-[16px]" style={{ color: PP.quiet }}>{t('ways.title')} / {t('ways.topic.classroom')}</span>
          <H1 w={w}>{x.title}</H1>
          <P w={w} big>{x.summary}</P>
          <span className="flex flex-wrap gap-3 text-[16px] font-bold" style={{ color: PP.quiet }}><span className="inline-flex items-center gap-1"><GraduationCap weight="bold" size={17} />{t('ways.grades', { grades: x.grades })}</span><span className="inline-flex items-center gap-1"><Clock weight="bold" size={17} />{t('ways.minutes', { minutes: x.minutes })}</span></span>
          <div aria-hidden="true" className="relative overflow-hidden rounded-[22px] grid place-items-center" style={{ height: p ? 170 : 260, border: `3px solid ${I}`, ...paperCss('stripes') }}><span className="rounded-[18px] p-3 bg-white" style={{ border: `3px solid ${I}` }}><CoverPhoto id={x.cover} cw={p ? 170 : 250} /></span></div>
          {x.body.map((b, i) => <p key={i} className="leading-relaxed" style={{ fontSize: p ? 18 : 20 }}>{b}</p>)}
          <TextCard tilt={-1} tone={2} className="grid gap-3 p-6" style={{ ...CARD, background: PP.mint }}>
            <h2 className="font-heading font-bold" style={{ fontSize: p ? 24 : 30 }}>{t('ways.tryIt')}</h2>
            <ol className="m-0 pl-6 grid gap-1.5 font-semibold text-[18px] list-decimal">{x.tryIt.map((s) => <li key={s}>{s}</li>)}</ol>
            <P w={w}>{t('ways.tryItSub')}</P>
            <span><Grape w={w}>{t('ways.start')}<ArrowRight weight="bold" size={20} /></Grape></span>
          </TextCard>
        </article>
      </section>
    </Page>
  );
}

// ================================================================ Schools and Homeschool
function Schools({ w }: W) {
  const p = isPh(w);
  const why: [Icon, string][] = [[BookOpen, PP.butter], [Heart, PP.blush], [ShieldCheck, PP.mint], [Rocket, PP.blueCrystal]];
  const com: [Icon, string][] = [[ShieldCheck, 'privacy'], [Stack, 'dpa'], [HandTap, 'a11y'], [Wrench, 'it'], [ChartBar, 'research'], [Buildings, 'price']];
  return (
    <Page w={w}>
      <Sec w={w} top={p ? 32 : 52} deco={<Margin w={w}><WordSpot w={w} word="Ready!" /><Bit style={{ ...R(w), top: 50 }} tilt={5}><SchoolSticker kind="bus" size={100} /></Bit><Paper id="checker" seed={23} tilt={-3} tape={{ tone: 2, at: 'top', w: 60 }} style={{ ...L(w), top: 340, width: 118, height: 160 }}><span className="absolute inset-0 grid place-items-center"><PowerSticker id="shield" size={80} /></span></Paper></Margin>}>
        <Head w={w} title={t('schools.title')} sub={t('schools.sub')}>
          <div className={`flex gap-3 ${p ? 'flex-col w-full' : ''}`}><Grape w={w} wide={p}>{t('schools.quote')}</Grape><Plain w={w} wide={p}>{t('schools.pilot')}</Plain></div>
        </Head>
      </Sec>
      <Sec w={w} deco={<Margin w={w}><Bit style={{ ...R(w), top: 120 }} tilt={-4} tape={{ tone: 4, w: 60 }}><Sunburst size={118} /></Bit></Margin>}>
        <H2 w={w}>{t('schools.whyTitle')}</H2>
        <div style={grid(w, 2)}>{why.map(([Ic, bg], i) => <TextCard key={i} tilt={[-1, 1.1, -1.2, 0.9][i]} tone={i} className="grid gap-2 p-6" style={CARD}><span className="flex items-center gap-3"><Dot bg={bg}><Ic weight="bold" size={24} /></Dot><H3 w={w}>{t(`schools.p${i + 1}` as StringKey)}</H3></span><P w={w}>{t(`schools.p${i + 1}.text` as StringKey)}</P></TextCard>)}</div>
      </Sec>
      <Sec w={w} deco={<Margin w={w}><Bit style={{ ...L(w), top: 140 }} tilt={-6}><SchoolSticker kind="ruler" size={100} /></Bit><Bit style={{ ...R(w), top: 300 }} tilt={6}><PowerSticker id="treasure-chest" size={90} /></Bit></Margin>}>
        <H2 w={w}>{t('schools.committeeTitle')}</H2><P w={w} big>{t('schools.committeeSub')}</P>
        <div style={grid(w, 3)}>{com.map(([Ic, k], i) => <TextCard key={k} tilt={[1, -1, 1.2, -0.8, 1, -1.2][i]} tone={i + 1} className="grid gap-2 p-5 content-start" style={CARD}><span className="flex items-center gap-3"><Dot bg={[PP.butter, PP.blush, PP.mint, PP.blueCrystal, PP.lavender, PP.peach][i]} size={42}><Ic weight="bold" size={22} /></Dot><H3 w={w}>{t(`schools.c.${k}` as StringKey)}</H3></span><P w={w}>{t(`schools.c.${k}.text` as StringKey)}</P><Link_>{t(`schools.c.${k}` as StringKey)}</Link_></TextCard>)}</div>
      </Sec>
      <Sec w={w} deco={<Margin w={w}><Paper id="gingham-mint" seed={25} tilt={3} tape={{ tone: 1, at: 'tr', w: 60 }} style={{ ...L(w), top: 120, width: 118, height: 160 }}><span className="absolute inset-0 grid place-items-center"><PowerSticker id="one-more" size={80} /></span></Paper></Margin>}>
        <H2 w={w}>{t('schools.rolloutTitle')}</H2>
        <div style={grid(w, 4)}>{[1, 2, 3, 4].map((n) => <TextCard key={n} tilt={[-1.2, 1, -0.9, 1.1][n - 1]} tone={n} className="grid gap-2 p-5 content-start" style={CARD}><span className="justify-self-start px-3 py-1 rounded-full font-bold text-[16px]" style={{ background: PP.butter, border: `2px solid ${I}` }}>{t('help.steps', { n })}</span><H3 w={w}>{t(`schools.step.${n}` as StringKey)}</H3><P w={w}>{t(`schools.step.${n}.text` as StringKey)}</P></TextCard>)}</div>
        <TextCard tilt={0.8} tone={3} className="grid gap-3 justify-items-start p-8" style={{ ...CARD, background: PP.mint }}>
          <H2 w={w}>{t('schools.endTitle')}</H2><P w={w} big>{t('schools.endText')}</P>
          <div className={`flex gap-3 ${p ? 'flex-col w-full' : ''}`}><Grape w={w} wide={p}>{t('schools.quote')}</Grape><Go w={w} wide={p}>{t('public.startFree')}</Go></div>
        </TextCard>
      </Sec>
    </Page>
  );
}
function Homeschool({ w }: W) {
  const p = isPh(w);
  const plans: [StringKey, number, StringKey, boolean][] = [['hs.plan.free', 3, 'hs.plan.free.price', false], ['hs.plan.homeschool', 6, 'hs.plan.homeschool.price', true], ['hs.plan.plus', 3, 'hs.plan.plus.price', false], ['hs.plan.coop', 3, 'hs.plan.coop.price', false]];
  const price = (k: StringKey) => k === 'hs.plan.homeschool.price' ? t(k, { m: money(PRICES_USD.homeschool.year / 12) }) : k === 'hs.plan.plus.price' ? t(k, { m: money(PRICES_USD.plus.month) }) : t(k);
  return (
    <Page w={w}>
      <Sec w={w} top={p ? 32 : 52} deco={<Margin w={w}><WordSpot w={w} word="Home!" /><Bit style={{ ...R(w), top: 50 }} tilt={-5}><SchoolSticker kind="apple" size={100} /></Bit><Bit style={{ ...L(w, -6), top: 330 }}><BookStack width={124} /></Bit></Margin>}>
        <Head w={w} title={t('hs.title')} sub={t('hs.sub')}>
          <div className={`flex gap-3 ${p ? 'flex-col w-full' : ''}`}><Go w={w} wide={p}>{t('hs.start')}</Go><Plain w={w} wide={p}>{t('hs.questions')}</Plain></div>
        </Head>
      </Sec>
      <Sec w={w} deco={<Margin w={w}><Paper id="flowers" seed={27} tilt={-3} tape={{ tone: 5, at: 'top', w: 60 }} style={{ ...R(w), top: 120, width: 118, height: 160 }}><span className="absolute inset-0 grid place-items-center"><PowerSticker id="double-dice" size={80} /></span></Paper></Margin>}>
        <H2 w={w}>{t('hs.fitTitle')}</H2>
        <div style={grid(w, 2)}>{[1, 2, 3, 4].map((n) => <TextCard key={n} tilt={[1, -1.1, 1.2, -0.9][n - 1]} tone={n} className="grid gap-2 p-6" style={CARD}><H3 w={w}>{t(`hs.p${n}` as StringKey)}</H3><P w={w}>{t(`hs.p${n}.text` as StringKey)}</P></TextCard>)}</div>
      </Sec>
      <Sec w={w} deco={<Margin w={w}><Bit style={{ ...L(w), top: 110 }} tilt={4} tape={{ tone: 0, w: 60 }}><Sunburst size={118} /></Bit><Sprinkle spots={[[w - 100, 160, 24, PP.lemon], [w - 60, 260, 18, PP.pink, 'heart']]} /></Margin>}>
        <H2 w={w}>{t('hs.weekTitle')}</H2><P w={w} big>{t('hs.weekSub')}</P>
        <div style={grid(w, 5)}>{[1, 2, 3, 4, 5].map((n) => <TextCard key={n} tilt={[-1.3, 1, -0.8, 1.2, -1][n - 1]} tone={n} className="grid gap-2 p-5 content-start" style={{ ...CARD, background: [PP.butter, PP.blush, PP.mint, PP.blueCrystal, PP.peach][n - 1] }}><b style={{ ...GY, fontSize: 26 }}>{t(`hs.day.${n}` as StringKey)}</b><P w={w}>{t(`hs.day.${n}.text` as StringKey)}</P></TextCard>)}</div>
      </Sec>
      <Sec w={w} deco={<Margin w={w}><Bit style={{ ...R(w), top: 200 }} tilt={6}><SchoolSticker kind="crayon" size={96} /></Bit></Margin>}>
        <H2 w={w}>{t('hs.plansTitle')}</H2>
        <div style={{ ...grid(w, 4), alignItems: 'stretch' }}>{plans.map(([k, n, pr, best], i) => (
          <TextCard key={k} tilt={[-1, 1.2, -1.1, 0.9][i]} tone={i + 2} className="grid gap-3 p-5 content-start" style={{ ...CARD, background: best ? PP.butter : '#ffffff' }}>
            <b style={{ ...GY, fontSize: 30 }}><GText>{t(k)}</GText></b>
            <ul className="m-0 p-0 list-none grid gap-1.5">{Array.from({ length: n }, (_, j) => <li key={j} className="flex gap-2 items-start font-semibold text-[16px] leading-snug"><Check weight="bold" size={18} className="mt-0.5 shrink-0" color={PP.kelly} />{t(`${k}.${j + 1}` as StringKey)}</li>)}</ul>
            <b className="text-[18px]">{price(pr)}</b>
          </TextCard>
        ))}</div>
        <TextCard tilt={1} tone={4} className="grid gap-3 p-6" style={CARD}><H3 w={w}>{t('hs.neverTitle')}</H3><div style={grid(w, 4)}>{[1, 2, 3, 4].map((n) => <span key={n} className="flex gap-2 items-center font-bold text-[17px]"><Minus weight="bold" size={18} />{t(`hs.never.${n}` as StringKey)}</span>)}</div></TextCard>
      </Sec>
    </Page>
  );
}

// ================================================================ FAQ (Help Center) and Help (How-to Guides)
function Faq({ w }: W) {
  const p = isPh(w);
  const qs = FAQS.teachers.slice(0, 7);
  return (
    <Page w={w}>
      <Sec w={w} top={p ? 32 : 52} deco={<Margin w={w}><WordSpot w={w} word="Ask!" /><Bit style={{ ...R(w), top: 40 }} tilt={6}><PowerSticker id="hint" size={96} /></Bit><Paper id="pinstripe" seed={29} tilt={-3} tape={{ tone: 1, at: 'top', w: 60 }} style={{ ...L(w), top: 360, width: 118, height: 160 }}><span className="absolute inset-0 grid place-items-center"><SchoolSticker kind="notebook" size={86} /></span></Paper><Bit style={{ ...R(w), top: 520 }} tilt={-4}><Sunburst size={116} /></Bit></Margin>}>
        <Head w={w} title={t('faq.title')} sub={t('faq.sub')} />
        <span className="flex items-center gap-3 rounded-full px-5 bg-white font-semibold text-[18px]" style={{ minHeight: 56, border: `2.5px solid ${I}`, color: PP.quiet }}><MagnifyingGlass weight="bold" size={22} color={I} />{t('faq.search')}</span>
        <div className="flex flex-wrap gap-2.5" role="tablist">{(['faq.group.teachers', 'faq.group.schools', 'faq.group.homeschool', 'faq.group.students'] as StringKey[]).map((k, i) => <span key={k} role="tab" aria-selected={i === 0} className="px-4 rounded-full font-bold text-[17px] inline-flex items-center" style={{ minHeight: 44, background: i === 0 ? PP.butter : '#ffffff', border: `2.5px solid ${I}` }}>{t(k)}</span>)}</div>
        {/* The answers are reading: one plain flat list, never taped or tilted. */}
        <div className="grid" style={{ ...CARD, borderRadius: 22, overflow: 'hidden' }}>
          {qs.map((q, i) => (
            <div key={q.q} className="grid gap-2 px-5 py-4" style={{ borderTop: i ? '2px solid rgba(29,26,51,0.16)' : undefined }}>
              <span className="flex items-center gap-3 font-heading font-bold" style={{ fontSize: p ? 18 : 20 }}><span className="flex-1">{q.q}</span><CaretDown weight="bold" size={20} style={{ transform: i === 0 ? 'rotate(180deg)' : undefined }} /></span>
              {i === 0 && <P w={w}>{q.a}</P>}
            </div>
          ))}
        </div>
        <TextCard tilt={-1} tone={2} className="grid gap-2 p-6" style={{ ...CARD, background: PP.mint }}><H3 w={w}>{t('faq.moreTitle')}</H3><P w={w}>{t('faq.more')}</P></TextCard>
      </Sec>
    </Page>
  );
}
function Help({ w }: W) {
  const p = isPh(w);
  const topics: [string, Icon, string][] = [['start', Rocket, PP.butter], ['students', UsersThree, PP.blush], ['sets', Stack, PP.mint], ['playing', Play, PP.blueCrystal], ['themes', PaintBrush, PP.lavender], ['reports', ChartBar, PP.peach], ['supports', HandTap, PP.aqua], ['plans', Star, PP.sage], ['home', House, PP.butter], ['trouble', Lifebuoy, PP.blush]];
  return (
    <Page w={w}>
      <Sec w={w} top={p ? 32 : 52} deco={<Margin w={w}><WordSpot w={w} word="Help!" /><Bit style={{ ...R(w), top: 40 }} tilt={-6}><SchoolSticker kind="pencil" size={100} /></Bit><Paper id="gingham-blue" seed={31} tilt={3} tape={{ tone: 3, at: 'tl', w: 60 }} style={{ ...L(w), top: 360, width: 118, height: 160 }}><span className="absolute inset-0 grid place-items-center"><PowerSticker id="second-chance" size={80} /></span></Paper><Bit style={{ ...R(w), top: 560 }} tilt={5}><PowerSticker id="extra-time" size={92} /></Bit></Margin>}>
        <Head w={w} title={t('help.title')} sub={t('help.sub')} />
        <span className="flex items-center gap-3 rounded-full px-5 bg-white font-semibold text-[18px]" style={{ minHeight: 56, border: `2.5px solid ${I}`, color: PP.quiet }}><MagnifyingGlass weight="bold" size={22} color={I} />{t('help.search')}</span>
        <H2 w={w}>{t('help.topics')}</H2>
        <div style={grid(w, 3)}>{topics.map(([k, Ic, bg], i) => <TextCard key={k} tilt={[-1, 1.1, -1.2, 0.9, -0.8, 1.2, -1, 1, -1.1, 0.8][i]} tone={i} className="flex gap-3 items-start p-5" style={CARD}><Dot bg={bg}><Ic weight="bold" size={24} /></Dot><span className="grid gap-1"><H3 w={w}>{t(`help.${k}` as StringKey)}</H3><P w={w}>{t(`help.${k}.desc` as StringKey)}</P></span></TextCard>)}</div>
        <TextCard tilt={1} tone={4} className="grid gap-2 p-6" style={{ ...CARD, background: PP.butter }}><H3 w={w}>{t('help.stillStuck')}</H3><P w={w}>{t('help.stillText')}</P></TextCard>
      </Sec>
    </Page>
  );
}

// ================================================================ Themes, Log in, Join
const THEME_CARDS = [['Dino Dig', 'Game Show', 'features.band.k2', 'gingham-mint'], ['Space Race', 'Board Game', 'features.band.35', 'stars'], ['Soft Pastels', 'Match Three', 'features.band.all', 'gingham-pink'], ['Court Side', 'Bowling', 'features.band.68', 'plaid'], ['Ocean Pop', 'Bubble Pop', 'features.band.k2', 'polka'], ['Night Sky', 'Question Tracker', 'features.band.all', 'pinstripe']] as const;
const THEME_ART = ['double-points', 'double-dice', 'spin-wheel', 'magnet', 'freeze', 'lightning'] as const;
function Themes({ w }: W) {
  const p = isPh(w);
  return (
    <Page w={w} on="public.nav.themes">
      <Sec w={w} top={p ? 32 : 52} deco={<Margin w={w}><WordSpot w={w} word="Make!" /><Bit style={{ ...R(w), top: 40 }} tilt={5}><SchoolSticker kind="crayon" size={100} /></Bit><Bit style={{ ...L(w), top: 380 }} tilt={-4} tape={{ tone: 2, w: 60 }}><Sunburst size={118} /></Bit><Bit style={{ ...R(w), top: 600 }} tilt={-6}><PowerSticker id="mystery-box" size={92} /></Bit></Margin>}>
        <Head w={w} title={t('themes.title')} sub={t('themes.sub')}><div className="flex flex-wrap gap-5"><Link_>{t('themes.linkBuilder')}</Link_><Link_>{t('themes.linkGuides')}</Link_></div></Head>
        <TextCard tilt={-0.9} tone={0} className={`flex gap-5 items-center p-6 ${p ? 'flex-col items-start' : ''}`} style={{ ...CARD, background: PP.butter }}>
          <Dot bg={PP.lemon} size={60}><Trophy weight="bold" size={30} /></Dot>
          <span className="grid gap-1 flex-1"><b style={{ ...GY, fontSize: 28 }}><Words text={t("themes.featuredTitle")} /></b><P w={w}>{t('themes.featuredText')}</P></span>
          <Plain w={w}>{t('themes.challengeLink')}<ArrowRight weight="bold" size={18} /></Plain>
        </TextCard>
        <div className="flex flex-wrap gap-2.5">{([`${t('themes.game')}: ${t('themes.allGames')}`, `${t('themes.band')}: ${t('themes.allBands')}`, `${t('themes.sort')}: ${t('themes.sort.trending')}`, t('themes.favorites', { count: 1 })]).map((x, i) => <span key={x} className="px-4 rounded-full font-bold text-[17px] inline-flex items-center gap-2 bg-white" style={{ minHeight: 44, border: `2.5px solid ${I}` }}>{x}{i < 3 && <CaretDown weight="bold" size={16} />}</span>)}</div>
        <div style={grid(w, 3)}>
          {THEME_CARDS.map(([n, g, band, pid], i) => (
            <TextCard key={n} tilt={[1.1, -1, 1.3, -1.2, 0.9, -0.8][i]} tone={i} as="article" className="overflow-hidden" style={CARD}>
              <div className="relative h-40 grid place-items-center" style={{ ...paperCss(pid as PaperId), borderBottom: `3px solid ${I}` }}>
                <span aria-hidden="true"><PowerSticker id={THEME_ART[i]} size={92} /></span>
                <span aria-label={t('themes.favorite', { name: n })} className="absolute top-3 right-3 w-11 h-11 rounded-full grid place-items-center bg-white" style={{ border: `2.5px solid ${I}` }}><Heart weight={i === 0 ? 'fill' : 'bold'} size={22} color={i === 0 ? PP.pink : I} /></span>
              </div>
              <div className="grid gap-1 p-5"><H3 w={w}>{n}</H3><span className="font-semibold text-[16px]">{g} · {t(band as StringKey)}</span><span className="font-semibold text-[15px]" style={{ color: PP.quiet }}>{t('themes.starter')} · {t('themes.byGamify')}</span></div>
            </TextCard>
          ))}
        </div>
      </Sec>
    </Page>
  );
}
function Field({ label, value, w, hint }: W & { label: string; value: string; hint?: string }) {
  return (
    <label className="grid gap-1.5 text-left">
      <b className="text-[17px]">{label}</b>
      <span className="flex items-center rounded-[16px] px-4 font-semibold bg-white" style={{ minHeight: 54, fontSize: isPh(w) ? 17 : 18, border: `2.5px solid ${I}` }}>{value}</span>
      {hint && <span className="font-semibold text-[15px]" style={{ color: PP.quiet }}>{hint}</span>}
    </label>
  );
}
// Log in and Join: one centered card. The scrapbook frames the card from
// outside (A and B); only in C does the card itself tilt and wear tape.
function CenterDeco({ w, word, top = 40, h = 560, half = 270 }: W & { word: string; top?: number; h?: number; half?: number }) {
  const p = isPh(w), cx = w / 2, lx = cx - half - 280, rx = cx + half + 50;
  if (p) return (
    <>
      <Sprinkle spots={[[8, 10, 20, PP.lemon], [w - 34, h + 60, 18, PP.pink]]} />
    </>
  );
  return (
    <>
      <Paper id="gingham" seed={33} tilt={-4} tape={{ tone: 0, at: 'tl' }} style={{ left: lx, top: top + 30, width: 240, height: 200 }}><span className="absolute inset-0 grid place-items-center"><PowerSticker id="double-points" size={110} /></span></Paper>
      <Paper id="stripes" seed={34} tilt={3} tape={{ tone: 2, at: 'tr' }} style={{ left: rx, top: top + 10, width: 220, height: 220 }}><span className="absolute inset-0 grid place-items-center"><SchoolSticker kind="bus" size={130} /></span></Paper>
      <Paper id="stars" seed={35} tilt={2} tape={{ tone: 3, at: 'top' }} style={{ left: lx + 20, top: top + 320, width: 210, height: 190 }}><span className="absolute inset-0 grid place-items-center"><SchoolSticker kind="apple" size={110} /></span></Paper>
      <Bit style={{ left: rx + 20, top: top + 300 }} tilt={4}><Sunburst size={160} /></Bit>
      <Bit style={{ left: lx + 20, top: top - 30 }} tilt={-7}><HandWord text={word} size={44} /></Bit>
      <Sprinkle spots={[[lx + 250, top + 10, 26, PP.lemon], [rx - 10, top + h - 40, 22, PP.pink], [lx + 240, top + h - 20, 20, PP.sky, 'dot'], [rx + 230, top + 250, 22, PP.kelly]]} />
    </>
  );
}
function Login({ w }: W) {
  const p = isPh(w);
  return (
    <Page w={w}>
      <section className="relative grid justify-items-center" style={{ padding: `${p ? 40 : 64}px ${gut(w)}px 0` }}>
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none"><CenterDeco w={w} word="Hello!" /></div>
        <TextCard tilt={-1.2} tone={1} className="grid gap-5 w-full" style={{ ...CARD, maxWidth: 540, padding: p ? 24 : 40 }}>
          <h1 className="text-center" style={{ ...GY, fontSize: p ? 36 : 48 }}><Words text={t("login.title")} /></h1>
          <div className="grid grid-cols-2 p-1.5 rounded-full" style={{ background: PP.cream, border: `2.5px solid ${I}` }} role="tablist">{(['login.tab.login', 'login.tab.signup'] as StringKey[]).map((k, i) => <span key={k} role="tab" aria-selected={i === 0} className="grid place-items-center rounded-full font-bold text-[18px]" style={{ minHeight: 46, ...(i === 0 ? { background: PP.butter, border: `2px solid ${I}` } : {}) }}>{t(k)}</span>)}</div>
          <P w={w}>{t('login.forTeachers')}</P>
          <Field w={w} label={t('login.usernameOrEmail')} value="ms.rivera" />
          <Field w={w} label={t('login.password')} value="••••••••" />
          <Go w={w} wide>{t('login.tab.login')}</Go>
          <span className="text-center font-bold text-[17px] underline underline-offset-4">{t('login.noAccount')}</span>
          <span className="text-center font-semibold text-[16px]" style={{ color: PP.quiet }}>{t('login.students')}</span>
        </TextCard>
      </section>
    </Page>
  );
}
function Join({ w }: W) {
  const p = isPh(w);
  const box = p ? 54 : 84;
  return (
    <Page w={w} student join>
      <section className="relative grid justify-items-center" style={{ padding: `${p ? 40 : 80}px ${gut(w)}px 0` }}>
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none"><CenterDeco w={w} word="Hi!" top={60} half={340} /></div>
        <TextCard tilt={1} tone={3} className="grid gap-6 justify-items-center text-center w-full" style={{ ...CARD, maxWidth: 680, padding: p ? 24 : 44 }}>
          <h1 style={{ ...GY, fontSize: p ? 42 : 66 }}><Words text={t("join.title")} /></h1>
          <P w={w} big>{t('join.sub')}</P>
          {/* The code boxes, Hear my code and Go are the clean core: never taped or tilted. */}
          <div className="flex gap-2" role="img" aria-label={`${t('join.code')}: B, Q`}>
            {['B', 'Q', '', '', ''].map((d, i) => <span key={i} className="grid place-items-center" style={{ ...GY, width: box, height: box * 1.15, fontSize: box * 0.6, borderRadius: 16, background: i === 2 ? PP.butter : '#ffffff', border: `3px solid ${I}`, boxShadow: i === 2 ? `0 0 0 4px ${PP.lemon}` : `0 4px 0 ${I}` }}>{d}</span>)}
          </div>
          <div className={`flex gap-3 ${p ? 'flex-col w-full' : ''}`}><Plain w={w} wide={p}><SpeakerHigh weight="bold" size={22} />{t('join.hearCode')}</Plain><Go w={w} wide={p} off>{t('join.go')}<ArrowRight weight="bold" size={22} /></Go></div>
        </TextCard>
      </section>
    </Page>
  );
}
function Bars({ w }: W) {
  return <div style={{ width: w, background: PP.cream, color: I }}><TopBar w={w} on="public.nav.home" /><div style={{ height: 40 }} /><PaperBand w={w} /><Footer w={w} /></div>;
}

// ---------------------------------------------------------------- frames
function useNear<T extends HTMLElement>() {
  const ref = useRef<T>(null); const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setOn(true); io.disconnect(); } }, { rootMargin: '900px' });
    io.observe(el); return () => io.disconnect();
  }, []);
  return [ref, on] as const;
}
// A page at its real width, scaled to its column (pages scroll on the web, so
// the frame shows the whole page).
function PageFrame({ w, children, label }: { w: number; children: ReactNode; label: string }) {
  const [near, on] = useNear<HTMLDivElement>();
  const box = useRef<HTMLDivElement>(null); const inner = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0.3); const [h, setH] = useState(360);
  useLayoutEffect(() => {
    const b = box.current, c = inner.current; if (!b || !c) return;
    const fit = () => { const kk = b.clientWidth / w; setK(kk); setH(c.offsetHeight * kk); };
    const ro = new ResizeObserver(fit); ro.observe(b); ro.observe(c); fit();
    return () => ro.disconnect();
  }, [w, on]);
  const ph = w < 600;
  return (
    <figure ref={near} className="m-0 grid gap-1 min-w-0 content-start">
      <div className={ph ? 'rounded-[1.1rem] p-[5%]' : 'rounded-[0.8rem] p-[1.6%]'} style={{ background: '#2a2740', border: `2px solid ${I}` }}>
        <div ref={box} data-device={`${ph ? 'phone' : 'laptop'}:${w}`} className="relative overflow-hidden rounded-[0.4rem]" style={{ height: on ? h : 360, background: PP.cream }}>
          {on && <div ref={inner} className="absolute top-0 left-0 origin-top-left" style={{ width: w, transform: `scale(${k})` }}>{children}</div>}
        </div>
      </div>
      <figcaption className="text-xs font-bold text-muted text-center">{label}</figcaption>
    </figure>
  );
}
function Lazy({ children, ratio }: { children: ReactNode; ratio: number }) {
  const [ref, on] = useNear<HTMLDivElement>();
  return <div ref={ref} style={on ? undefined : { aspectRatio: `${ratio}` }}>{on ? children : null}</div>;
}

// ================================================================ Classic games
// The welcome (a start menu, the standard Gamify look) with the theme's cover,
// and one in-play view. Only the theme parts (cover, stage ground, edges) wear
// the scrapbook; the score board, question card, answer tiles and main button
// are the clean core and stay plain in every strength.
type Game = { id: string; name: string; word: string; ground: PaperId; papers: [PaperId, PaperId]; stickers: [Parameters<typeof PowerSticker>[0]['id'], Parameters<typeof SchoolSticker>[0]['kind']]; steps: [Icon, Icon, Icon]; play: (s: Strength) => ReactNode; own?: boolean };
function ScrapCover({ g }: { g: Game }) {
  const s = useStrength();
  const mw = 540, mh = 492, ml = 90, mt = 52;
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ ...paperCss(g.ground) }}>
      <Paper id={g.papers[0]} seed={41} tilt={-4} tape={{ tone: 1, at: 'tl', w: 90 }} style={{ left: -24, top: 280, width: 230, height: 300 }} />
      <Paper id={g.papers[1]} seed={42} tilt={3} tape={{ tone: 3, at: 'br', w: 90 }} style={{ right: -20, top: -20, width: 250, height: 260 }} />
      <Bit style={{ left: 18, top: 16 }} tilt={-4}><Sunburst size={150} /></Bit>
      {/* The Classic cover art, mounted like a photo (never redrawn). */}
      <div className="absolute" style={{ left: ml, top: mt, width: mw, height: mh, transform: s === 'A' ? undefined : 'rotate(-2deg)' }}>
        <div className="absolute inset-0 bg-white rounded-[18px]" style={{ border: `3px solid ${I}`, boxShadow: '0 6px 0 rgba(29,26,51,0.25)' }} />
        <div className="absolute overflow-hidden rounded-[10px]" style={{ left: 14, top: 14, width: mw - 28, height: mh - 28, border: `2.5px solid ${I}` }}>
          <div className="absolute top-0 left-0 origin-top-left" style={{ width: 720, height: 648, transform: `scale(${(mw - 28) / 720})` }}>{COVER(g.id).cover}</div>
        </div>
        {s === 'A' ? <><PhotoCorner at="tl" /><PhotoCorner at="tr" /><PhotoCorner at="bl" /><PhotoCorner at="br" /></> : <><Tape tone={0} w={110} rot={-30} style={{ left: -36, top: 8 }} /><Tape tone={4} w={110} rot={32} style={{ right: -36, top: 8 }} /></>}
      </div>
      <Bit style={{ left: 30, bottom: 30 }} tilt={-8}><PowerSticker id={g.stickers[0]} size={110} /></Bit>
      <Bit style={{ right: 26, top: 250 }} tilt={7}><SchoolSticker kind={g.stickers[1]} size={100} /></Bit>
      <Bit style={{ right: 40, bottom: 24 }} tilt={-5}><HandWord text={g.word} size={58} /></Bit>
      <Sprinkle spots={[[660, 120, 28, PP.lemon], [40, 220, 22, PP.pink], [620, 470, 22, PP.sky, 'dot'], [300, 600, 26, PP.lemon], [180, 590, 18, PP.pink, 'heart']]} />
    </div>
  );
}
function Welcome({ g }: { g: Game }) {
  const c = COVER(g.id);
  const rnd = (ic: ReactNode, l: string) => <span aria-label={l} className="w-[52px] h-[52px] rounded-full grid place-items-center bg-white" style={{ border: `2.5px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}>{ic}</span>;
  return (
    <div className="relative overflow-hidden" style={{ width: 1280, height: 800, background: PP.cream, color: I }}>
      <div className="absolute inset-x-0 top-0 z-10 flex items-center" style={{ height: 68, padding: '0 40px', background: '#ffffff', borderBottom: `3px solid ${I}` }}>
        <img src="/brand/gamify-wordmark.png" alt="Gamify" className="w-auto" style={{ height: 34 }} draggable={false} />
        <span className="ml-auto flex items-center gap-5">{LINKS.slice(0, 5).map((l) => <b key={l} className="text-[17px]">{t(l)}</b>)}</span>
      </div>
      <Sprinkle spots={[[10, 300, 22, PP.lemon], [1250, 110, 20, PP.pink], [1248, 760, 20, PP.sky, 'dot'], [770, 770, 18, PP.lemon]]} />
      <div className="absolute left-10 right-10 top-[100px] bottom-[44px] flex gap-10">
        <div aria-hidden="true" className="w-[720px] h-full rounded-[30px] overflow-hidden relative shrink-0" style={{ border: `3px solid ${I}`, boxShadow: `0 6px 0 ${I}` }}><ScrapCover g={g} /></div>
        <div className="flex-1 min-w-0 h-full flex flex-col justify-between">
          <div className="flex justify-end gap-3">{rnd(<CornersOut weight="bold" size={24} />, 'Full screen')}{rnd(<GearSix weight="bold" size={24} />, t('settings.open'))}</div>
          <div className="grid gap-3"><h1 style={{ ...GY, fontSize: g.name.length > 12 ? 52 : 64, lineHeight: 0.95 }}><Words text={g.name} /></h1><p className="font-semibold text-[24px] leading-snug">{c.desc}</p></div>
          <div className="flex flex-wrap gap-2.5">{c.modes.map((m) => <span key={m} className="px-5 h-[43px] inline-flex items-center rounded-full font-bold text-[18px]" style={{ background: m === 'Live' ? PP.blueCrystal : m === 'Share' ? PP.butter : PP.mint, border: `2.5px solid ${I}` }}>{m}</span>)}</div>
          <TextCard tilt={-1.2} tone={2} className="rounded-[26px] px-6 py-4 grid gap-3" style={{ background: '#ffffff', border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}` }}>
            <h2 style={{ ...GY, fontSize: 26 }}>How to play</h2>
            {c.steps.map((st, i) => { const Ic = g.steps[i]; return <div key={st} className="flex items-center gap-4 font-bold text-[22px] leading-tight"><Dot bg={[PP.butter, PP.blush, PP.aqua][i]} size={40}><Ic weight="bold" size={20} /></Dot>{st}</div>; })}
          </TextCard>
          {/* The start button is the clean core: never taped or tilted. */}
          <span className="w-full rounded-full font-display font-bold inline-flex items-center justify-center gap-3" style={{ height: 72, fontSize: 30, background: GO_YELLOW, border: `3px solid ${I}`, boxShadow: `0 6px 0 ${I}` }}><Play weight="fill" size={32} />Set up and play</span>
        </div>
      </div>
    </div>
  );
}
// Stage grounds for the in-play views (1000 x 625), drawn under the game's own
// board, score board and buttons (the clean core, unchanged).
const cream = <div className="absolute inset-0" style={{ background: PP.cream }} />;
function GameShowBack() {
  return (<div className="absolute inset-0">{cream}
    <Paper id="pinstripe" seed={51} style={{ left: 60, top: 26, width: 880, height: 548 }} />
    <Paper id="gingham-pink" seed={52} tilt={-2} tape={{ tone: 0, at: 'tl', w: 70 }} style={{ left: -14, top: -16, width: 96, height: 660 }} />
    <Paper id="gingham-pink" seed={53} tilt={2} tape={{ tone: 0, at: 'tr', w: 70 }} style={{ right: -14, top: 70, width: 92, height: 600 }} />
    <Paper id="stars" seed={54} tilt={-1} style={{ left: 50, bottom: -18, width: 900, height: 76 }} />
    <Bit style={{ left: 4, bottom: 8 }} tilt={-6}><PowerSticker id="treasure-chest" size={70} /></Bit>
    <Bit style={{ right: 8, bottom: 6 }} tilt={5}><SchoolSticker kind="apple" size={64} /></Bit>
    <Sprinkle spots={[[30, 120, 20, PP.lemon], [26, 300, 16, PP.paper], [960, 460, 18, PP.lemon]]} />
  </div>);
}
function BoardBack() {
  return (<div className="absolute inset-0">{cream}
    <Paper id="gingham-blue" seed={55} style={{ left: -10, top: -10, width: 1020, height: 330 }} />
    <Paper id="gingham-mint" seed={56} style={{ left: -10, top: 300, width: 1020, height: 340 }} />
    <Paper id="flowers" seed={57} tilt={3} tape={{ tone: 5, at: 'tr', w: 70 }} style={{ right: 6, bottom: -14, width: 260, height: 110 }} />
    <Bit style={{ left: 8, top: 6 }} tilt={-6}><SchoolSticker kind="pencil" size={64} /></Bit>
    <Bit style={{ left: 480, top: 2 }} tilt={4} tape={{ tone: 1, w: 50 }}><Sunburst size={62} /></Bit>
    <Sprinkle spots={[[200, 16, 20, PP.lemon], [330, 30, 16, PP.pink, 'heart'], [600, 22, 18, PP.paper]]} />
  </div>);
}
function MatchBack() {
  return (<div className="absolute inset-0">{cream}
    <Paper id="gingham" seed={58} style={{ left: -10, top: -10, width: 1020, height: 645 }} />
    <Paper id="polka" seed={59} tilt={3} tape={{ tone: 0, at: 'tr', w: 70 }} style={{ left: 640, top: 430, width: 330, height: 170 }} />
    <Paper id="checker" seed={60} tilt={-2} tape={{ tone: 3, at: 'tl', w: 60 }} style={{ left: 560, top: 70, width: 70, height: 300 }} />
    <Bit style={{ left: 690, top: 470 }} tilt={-6}><PowerSticker id="tornado" size={96} /></Bit>
    <Bit style={{ left: 820, top: 480 }} tilt={5}><SchoolSticker kind="crayon" size={90} /></Bit>
    <Sprinkle spots={[[16, 40, 20, PP.pink], [20, 560, 22, PP.lemon], [600, 590, 18, PP.sky, 'dot']]} />
  </div>);
}
function FourBack() {
  return (<div className="absolute inset-0">{cream}
    <Paper id="windowpane" seed={61} style={{ left: -10, top: -10, width: 1020, height: 645 }} />
    <Paper id="plaid" seed={62} tilt={-3} tape={{ tone: 2, at: 'tl', w: 70 }} style={{ left: 20, top: 400, width: 200, height: 200 }} />
    <Paper id="stripes" seed={63} tilt={3} tape={{ tone: 4, at: 'tr', w: 70 }} style={{ right: 20, top: 400, width: 200, height: 200 }} />
    <Bit style={{ left: 70, top: 440 }} tilt={-5}><PowerSticker id="double-dice" size={100} /></Bit>
    <Bit style={{ right: 66, top: 446 }} tilt={6}><SchoolSticker kind="ruler" size={100} /></Bit>
    <Sprinkle spots={[[30, 40, 22, PP.lemon], [220, 60, 18, PP.pink, 'heart'], [760, 60, 18, PP.sky]]} />
  </div>);
}
function BubbleBack() {
  return (<div className="absolute inset-0">{cream}
    <Paper id="dots" seed={64} style={{ left: -10, top: -10, width: 1020, height: 645 }} />
    <Paper id="stripes" seed={65} tilt={-3} tape={{ tone: 1, at: 'top', w: 80 }} style={{ left: 30, top: 110, width: 230, height: 470 }}><span className="absolute inset-0 grid content-center justify-items-center gap-6"><Sunburst size={150} /><PowerSticker id="lightning" size={110} /></span></Paper>
    <Paper id="stars" seed={66} tilt={3} tape={{ tone: 5, at: 'tr', w: 70 }} style={{ left: 740, top: 360, width: 230, height: 230 }}><span className="absolute inset-0 grid place-items-center"><SchoolSticker kind="notebook" size={110} /></span></Paper>
  </div>);
}
function BowlBack() {
  // Only the wall band above the lane (the lane, pins and rail stay the game's own).
  return (<div className="absolute left-0 right-0 top-0 overflow-hidden" style={{ height: 138 }}>
    <div className="absolute inset-0" style={{ background: PP.cream }} />
    <Paper id="gingham-pink" seed={67} tilt={-2} style={{ left: -10, top: -6, width: 360, height: 150 }} />
    <Paper id="checker" seed={68} tilt={1} style={{ left: 330, top: -8, width: 340, height: 150 }} />
    <Paper id="stars" seed={69} tilt={2} style={{ left: 650, top: -6, width: 370, height: 150 }} />
    <Bit style={{ left: 300, top: 70 }} tilt={-5}><SchoolSticker kind="pencil" size={58} /></Bit>
    <Bit style={{ left: 640, top: 66 }} tilt={5}><PowerSticker id="magnet" size={62} /></Bit>
  </div>);
}
// Her own art (Question Tracker night sky, Territory room) is never redrawn: the
// scrapbook only mounts it, with photo corners (A) or tape (B and C) at the corners.
function Mount({ children, stickers }: { children: ReactNode; stickers?: ReactNode }) {
  const s = useStrength();
  return (
    <div className="relative w-full h-full">
      {children}
      <div aria-hidden="true" className="absolute inset-0 z-30 pointer-events-none">
        {s === 'A'
          ? <><PhotoCorner at="tl" size={36} color={PP.pink} /><PhotoCorner at="tr" size={36} color={PP.pink} /><PhotoCorner at="bl" size={48} color={PP.pink} /><PhotoCorner at="br" size={48} color={PP.pink} /></>
          // Tape only at the bottom corners: the code and the tool buttons sit in the top corners.
          : <><PhotoCorner at="tl" size={36} color={PP.pink} /><PhotoCorner at="tr" size={36} color={PP.pink} /><Tape tone={1} w={120} rot={35} style={{ left: -34, bottom: 12 }} /><Tape tone={5} w={120} rot={-35} style={{ right: -34, bottom: 12 }} /></>}
        {stickers}
      </div>
    </div>
  );
}
const GAMES: Game[] = [
  { id: 'castle-quest', name: 'Board Game', word: 'Roll!', ground: 'gingham-mint', papers: ['stripes', 'flowers'], stickers: ['double-dice', 'pencil'], steps: [Question, Star, Trophy], play: () => <BoardLaptop back={<BoardBack />} /> },
  { id: 'game-show', name: 'Game Show', word: 'Pick!', ground: 'pinstripe', papers: ['gingham-pink', 'stars'], stickers: ['treasure-chest', 'apple'], steps: [Question, HandTap, Trophy], play: () => <GameShowLaptop back={<GameShowBack />} /> },
  { id: 'match-three', name: 'Match Three', word: 'Match!', ground: 'gingham', papers: ['polka', 'checker'], stickers: ['tornado', 'crayon'], steps: [HandTap, Star, Question], play: () => <MatchThreeLaptop back={<MatchBack />} /> },
  { id: 'four-in-a-row', name: 'Four in a Row', word: 'Drop!', ground: 'windowpane', papers: ['plaid', 'stripes'], stickers: ['double-dice', 'ruler'], steps: [Question, HandTap, Trophy], play: () => <FourLaptop back={<FourBack />} /> },
  { id: 'bubble-pop', name: 'Bubble Pop', word: 'Pop!', ground: 'dots', papers: ['stripes', 'stars'], stickers: ['lightning', 'notebook'], steps: [Question, HandTap, Star], play: () => <BubbleLaptop back={<BubbleBack />} /> },
  { id: 'bowling', name: 'Bowling', word: 'Strike!', ground: 'gingham-pink', papers: ['checker', 'stars'], stickers: ['magnet', 'pencil'], steps: [Question, HandTap, Trophy], play: () => <BowlingLaptop back={<BowlBack />} /> },
  { id: 'star-quiz', name: 'Question Tracker', word: 'Stars!', ground: 'pinstripe', papers: ['stars', 'gingham-blue'], stickers: ['double-points', 'notebook'], steps: [Question, Star, Trophy], own: true,
    play: () => <Mount stickers={<><Bit style={{ right: 40, bottom: 26 }} tilt={-6}><SchoolSticker kind="apple" size={70} /></Bit><Bit style={{ right: 130, bottom: 20 }} tilt={5}><PowerSticker id="double-points" size={66} /></Bit></>}><ClassScreen /></Mount> },
  { id: 'territory', name: 'Territory', word: 'Catch!', ground: 'gingham-blue', papers: ['plaid', 'gingham'], stickers: ['shield', 'bus'], steps: [Question, HandTap, Trophy], own: true, play: () => <Mount><TerritoryCoop /></Mount> },
];
// The question card over a scrapbook stage: the clean core, plain in every strength.
function QuestionStage() {
  return (
    <div className="relative overflow-hidden" style={{ width: 1280, height: 800, background: PP.cream, color: I }}>
      <Paper id="gingham-pink" seed={71} tilt={-3} tape={{ tone: 1, at: 'tl' }} style={{ left: -30, top: -20, width: 260, height: 220 }} />
      <Paper id="stripes" seed={72} tilt={3} tape={{ tone: 3, at: 'tr' }} style={{ right: -30, top: -24, width: 240, height: 200 }} />
      <Paper id="stars" seed={73} tilt={2} tape={{ tone: 5, at: 'bl' }} style={{ left: -24, bottom: -30, width: 250, height: 190 }} />
      <Paper id="polka" seed={74} tilt={-2} tape={{ tone: 0, at: 'br' }} style={{ right: -24, bottom: -30, width: 250, height: 180 }} />
      <Bit style={{ left: 20, top: 360 }} tilt={-6}><PowerSticker id="hint" size={74} /></Bit>
      <Bit style={{ right: 18, top: 370 }} tilt={6}><SchoolSticker kind="pencil" size={74} /></Bit>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"><QuestionCard /></div>
    </div>
  );
}

// ================================================================ the tab
type Mode = Strength | 'all';
const STRENGTHS: [Strength, string, string][] = [
  ['A', 'Scrapbook, clean', 'Papers, crayon stickers, the sunburst and one hand-lettered word, all at the edges. No washi tape, nothing tilted. Words and buttons flat on cream or white.'],
  ['B', 'Scrapbook, as mocked', 'A, plus washi tape and small tilts (4 degrees at most) on the edge pieces only, never over words or buttons. Closest to the 2026-11-23 mockup.'],
  ['C', 'Full scrapbook', 'B, plus tape and a small tilt on cards that hold words (plan cards, feature cards, the log in card). The clean core still stays plain.'],
];
function Tag({ s }: { s: Strength }) {
  const [, name] = STRENGTHS.find((x) => x[0] === s)!;
  return <span className="justify-self-start inline-flex items-center gap-2 font-bold text-sm"><span className="w-8 h-8 rounded-full grid place-items-center font-display text-lg" style={{ background: s === 'A' ? PP.mint : s === 'B' ? PP.butter : PP.blush, border: `2px solid ${I}` }}>{s}</span>{name}</span>;
}
function ByStrength({ mode, children, cols = true }: { mode: Mode; children: (s: Strength) => ReactNode; cols?: boolean }) {
  const list: Strength[] = mode === 'all' ? ['A', 'B', 'C'] : [mode];
  return (
    <div className={`grid gap-5 ${mode === 'all' && cols ? 'lg:grid-cols-3' : ''}`}>
      {list.map((s) => <div key={s} data-strength={s} className="min-w-0 grid gap-2 content-start"><Tag s={s} /><StrengthProvider value={s}>{children(s)}</StrengthProvider></div>)}
    </div>
  );
}
type Def = { id: string; name: string; render: (w: number) => ReactNode; phone?: boolean };
const PAGES: Def[] = [
  { id: 'home', name: 'Home', phone: true, render: (w) => <Home w={w} /> },
  { id: 'pricing', name: 'Pricing (plan cards and the top of the comparison chart)', render: (w) => <Pricing w={w} /> },
  { id: 'features', name: 'Features', render: (w) => <Features w={w} /> },
  { id: 'blog', name: 'Blog index', render: (w) => <Blog w={w} /> },
  { id: 'post', name: 'Blog post', render: (w) => <Post w={w} /> },
  { id: 'schools', name: 'Schools', render: (w) => <Schools w={w} /> },
  { id: 'homeschool', name: 'Homeschool', render: (w) => <Homeschool w={w} /> },
  { id: 'faq', name: 'FAQ (Help Center)', render: (w) => <Faq w={w} /> },
  { id: 'help', name: 'Help (How-to Guides)', render: (w) => <Help w={w} /> },
  { id: 'themes', name: 'Themes', render: (w) => <Themes w={w} /> },
  { id: 'login', name: 'Log in', render: (w) => <Login w={w} /> },
  { id: 'join', name: 'Join (student page)', phone: true, render: (w) => <Join w={w} /> },
  { id: 'bars', name: 'Top bar and footer', render: (w) => <Bars w={w} /> },
];
function Kit() {
  return (
    <StrengthProvider value="B">
      <div className="grid gap-5 rounded-[1.5rem] p-5" style={{ background: PP.cream, border: `2px solid ${I}` }}>
        <div className="grid gap-2"><h4 className="font-heading font-bold">Papers (palette pairs, from the pattern bank and redrawn)</h4>
          <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 lg:grid-cols-6">{PAPER_NAMES.map(([id, n], i) => <figure key={id} className="m-0 grid gap-1"><div className="relative h-24"><Paper id={id} seed={80 + i} style={{ inset: 0 }} /></div><figcaption className="text-xs font-bold text-center">{n}</figcaption></figure>)}</div></div>
        <div className="flex flex-wrap items-end gap-6">
          <figure className="m-0 grid gap-1 justify-items-center"><div className="flex flex-wrap justify-center gap-2"><PowerSticker id="double-points" size={84} /><PowerSticker id="magnet" size={84} /><PowerSticker id="spin-wheel" size={84} /></div><figcaption className="text-xs font-bold">Crayon power-up stickers</figcaption></figure>
          <figure className="m-0 grid gap-1 justify-items-center"><div className="flex flex-wrap justify-center gap-2"><SchoolSticker kind="bus" size={80} /><SchoolSticker kind="apple" size={80} /><SchoolSticker kind="pencil" size={80} /><SchoolSticker kind="notebook" size={80} /><SchoolSticker kind="crayon" size={80} /><SchoolSticker kind="ruler" size={80} /></div><figcaption className="text-xs font-bold">School stickers, paper edge</figcaption></figure>
          <figure className="m-0 grid gap-1 justify-items-center"><Sunburst size={120} /><figcaption className="text-xs font-bold">Sunburst card</figcaption></figure>
          <figure className="m-0 grid gap-1 justify-items-center"><BookStack width={190} /><figcaption className="text-xs font-bold">Kind-word books</figcaption></figure>
          <figure className="m-0 grid gap-1 justify-items-center"><span className="flex flex-wrap justify-center gap-3 items-center"><HandWord text="Good job!" size={44} /><HandWord text="Yay!" size={44} /></span><figcaption className="text-xs font-bold">Hand-lettered word (one per screen)</figcaption></figure>
          <figure className="m-0 grid gap-1 justify-items-center"><span className="relative block w-56 h-20">{[0, 1, 2, 3, 4, 5].map((k) => <Tape key={k} tone={k} w={84} rot={[-6, 5, -3, 7, -4, 3][k]} style={{ left: (k % 3) * 70, top: k < 3 ? 6 : 46 }} />)}</span><figcaption className="text-xs font-bold">Washi tape (B and C only)</figcaption></figure>
          <figure className="m-0 grid gap-1 justify-items-center"><span className="relative block w-24 h-20 bg-white rounded-lg" style={{ border: `2px solid ${I}` }}><PhotoCorner at="tl" size={26} /><PhotoCorner at="tr" size={26} /><PhotoCorner at="bl" size={26} /><PhotoCorner at="br" size={26} /></span><figcaption className="text-xs font-bold">Photo corners (A mounts art)</figcaption></figure>
          <figure className="m-0 grid gap-1 justify-items-center"><span className="relative block w-28 h-16"><Sprinkle spots={[[4, 8, 26, PP.lemon], [40, 30, 20, PP.pink], [76, 4, 24, PP.sky], [84, 40, 16, PP.kelly, 'dot']]} /></span><figcaption className="text-xs font-bold">Little crayon stars</figcaption></figure>
        </div>
      </div>
    </StrengthProvider>
  );
}

export default function ScrapbookDirection() {
  const [mode, setMode] = useState<Mode>(() => { const m = new URLSearchParams(window.location.search).get('sb'); return m === 'A' || m === 'B' || m === 'C' ? m : 'all'; });
  return (
    <section className="grid gap-8">
      <div className="grid gap-3">
        <h2 className="font-heading text-2xl">Scrapbook direction <span className="text-base align-middle px-2 py-0.5 rounded-full border-2 border-black" style={{ background: PP.blush }}>Mockups: pick A, B or C</span></h2>
        <div className="grid gap-2 rounded-[1.25rem] p-4 text-sm font-semibold max-w-[70rem]" style={{ background: '#ffffff', border: `2px solid ${I}` }}>
          <p><b>Your request (2026-11-26):</b> "there was a style for the public facing pages a while ago that was more colorful, scrapbook style and i want that to be the main art direction for public pages and the classic themes." Then: "give me mockups again for everything and ill decide".</p>
          <p><b>What changed since 2026-11-24:</b> your rule then was no washi tape, no stacked or tilted cards and no characters (2026-11-23: "remove the washi tape"; "the attatched tape, multilayer card ... need immediately removed"; 2026-11-25: no tilted cards), and /brand showed only the flat direction, so the scrapbook mockups were taken down on 2026-11-24. This tab brings the old style back (cream page, fabric-swatch papers, crayon stickers, the sunburst, hand-lettered praise, kind-word books, school stickers, crayon stars) in today's palette, patterns and crayon kit. Strength A keeps your tape and tilt rule; B and C bring tape and tilt back for you to judge. No characters in any strength, and nothing live changes until you pick.</p>
          <p><b>Why the clean core stays plain in all three:</b> what a child reads and taps (question card, answer tiles, score board, main button) never sits on a pattern, under tape or on a tilt. Kindergartners in a heavily decorated classroom spent more time off task and learned less than in a sparse one (Fisher, Godwin and Seltman, 2014, Psychological Science); people learn better when decoration that does not carry the lesson is kept away from it (Mayer's coherence principle); and words need a plain ground for 4.5:1 contrast (WCAG 2.1, 1.4.3). These are cited from memory; the pages were not opened in this session.</p>
          <p><b>The one weak spot to test:</b> C puts tape and tilt on cards that hold words, the place early readers look first. Try B on a projector with a K-2 class before choosing C.</p>
        </div>
        <div className="grid gap-2 lg:grid-cols-3 max-w-[70rem]">{STRENGTHS.map(([s, n, d]) => <div key={s} className="rounded-[1rem] p-3 text-sm font-semibold grid gap-1" style={{ background: '#ffffff', border: `2px solid ${I}` }}><Tag s={s} /><span>{d}</span><span className="sr-only">{n}</span></div>)}</div>
        <div role="radiogroup" aria-label="Strength" className="flex flex-wrap gap-2 sticky top-2 z-30">
          {(['all', 'A', 'B', 'C'] as Mode[]).map((m) => (
            <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)} className="min-h-11 px-4 rounded-full font-bold border-2 border-black" style={{ background: mode === m ? PP.butter : '#fffaf0', boxShadow: '0 3px 0 #1d1a33' }}>
              {m === 'all' ? 'All three side by side' : `${m}: ${STRENGTHS.find((x) => x[0] === m)![1]}`}
            </button>
          ))}
        </div>
      </div>

      <article className="grid gap-3"><h3 className="font-heading text-xl">The scrapbook kit, restored</h3><p className="text-sm font-semibold max-w-prose">Every piece from the old mockups, redrawn in today's palette pairs and the smooth crayon style (flat fills, one wobbly ink outline, no grain, no faces). Shown with tape on (B).</p><Kit /></article>

      <h3 className="font-heading text-2xl pt-4 border-t-2 border-black/20">1. Public pages</h3>
      <nav aria-label="Jump to a page" className="flex flex-wrap gap-2 -mt-4">{[...PAGES.map((p) => [p.id, p.name.split(' (')[0]]), ['games', 'Classic themes']].map(([id, n]) => <a key={id} href={`#sb-${id}`} className="px-3 py-1.5 rounded-full font-bold text-sm border-2 border-black bg-[#fffaf0] hover:bg-[#fdfd94]">{n}</a>)}</nav>
      {PAGES.map((p) => (
        <article key={p.id} id={`sb-${p.id}`} className="grid gap-3 scroll-mt-24 pt-5 border-t-2 border-black/10">
          <h4 className="font-heading text-xl">{p.name}</h4>
          <ByStrength mode={mode}>
            {(s) => p.phone && mode !== 'all'
              ? <div className="flex gap-4 items-start"><div className="min-w-0" style={{ flex: '3 1 0' }}><PageFrame w={1440} label={`${s}: laptop 1440`}>{p.render(1440)}</PageFrame></div><div className="min-w-0" style={{ flex: '1 1 0' }}><PageFrame w={390} label={`${s}: phone 390`}>{p.render(390)}</PageFrame></div></div>
              : <PageFrame w={1440} label={`${s}: laptop 1440`}>{p.render(1440)}</PageFrame>}
          </ByStrength>
        </article>
      ))}

      <h3 id="sb-games" className="font-heading text-2xl pt-4 border-t-2 border-black/20 scroll-mt-24">2. Classic themes, every live game</h3>
      <p className="text-sm font-semibold max-w-prose -mt-4">Each game: the welcome (the standard start menu, with the theme's scrapbook cover) and one in-play view. The board, pieces, score board, power-up cards and buttons are the approved Classic mockups, unchanged; only the stage ground and edges wear the scrapbook. Question Tracker and Territory use your own uploaded art, so the scrapbook only mounts it (photo corners in A, tape in B and C).</p>
      <article id="sb-question" className="grid gap-3 scroll-mt-24">
        <h4 className="font-heading text-xl">The clean core on a scrapbook stage</h4>
        <ByStrength mode={mode}>{() => <Laptop w={1280}><QuestionStage /></Laptop>}</ByStrength>
      </article>
      {GAMES.map((g) => (
        <article key={g.id} id={`sb-${g.id}`} className="grid gap-3 scroll-mt-24 pt-5 border-t-2 border-black/10">
          <h4 className="font-heading text-xl">{g.name}{g.own ? ' (your own art, mounted)' : ''}</h4>
          <ByStrength mode={mode} cols={false}>
            {(s) => (
              <div className="grid gap-4 md:grid-cols-2">
                <figure className="m-0 grid gap-1"><Lazy ratio={1.6}><Laptop w={1280}><Welcome g={g} /></Laptop></Lazy><figcaption className="text-xs font-bold text-muted text-center">{s}: welcome and cover</figcaption></figure>
                <figure className="m-0 grid gap-1"><Lazy ratio={1.6}><Laptop w={1000}>{g.play(s)}</Laptop></Lazy><figcaption className="text-xs font-bold text-muted text-center">{s}: in play</figcaption></figure>
              </div>
            )}
          </ByStrength>
        </article>
      ))}
    </section>
  );
}
