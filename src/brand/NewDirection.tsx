import { useState, type CSSProperties, type ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight, Broadcast, ChartBar, Check, GameController, GearSix, Heart, House, Lightbulb, Lightning, MagnifyingGlass, Palette as PaletteIcon, Play,
  Printer, SpeakerHigh, Stack, Star, Trophy, UploadSimple, UsersThree, X,
} from '@phosphor-icons/react';
import { useSettings } from '../settings/SettingsContext';
import { BlobPatch, CrayonDie, CrayonPowerUp, Doodle, UNIVERSAL_POWERS, type PowerId } from './CrayonKit';
import { DieWiggle, GameTools, GO_YELLOW, IconBadge, MenuBack, MenuGo, PURPLE_GROUND, SiteBarSmall, WayRow, GText } from './mockKit';
import { PP } from './PaletteProposal';
import { PATTERNS, PatternCard } from './PatternProposal';
import { STARTER, StickerArt } from './Stickers';

// "New direction" (PROPOSAL, rewritten 2026-11-24: "the new direction ... so
// when i request a push and have everything be redesigned, i would have seen
// and approved everything already"). This tab shows ONLY the current
// direction: each block is one rule in one line, then the real parts. The
// early mockups (washi tape, tilted and stacked paper cards, heavy crayon
// grain, the playful mixed-media sunburst and kind-word cards, buddies, the
// cream ground, the old four ways to play) were removed. Palette, newest
// (teacher, 2026-11-24): "remove the gamify purples and replace with the grape
// and lavender": Grape #6A45F0 (white text) and Lavender #DDD6FF lead.

const I = PP.ink;
const Q = PP.quiet;
const GY: CSSProperties = { fontFamily: 'var(--font-display)', fontWeight: 400, lineHeight: 1, textTransform: 'uppercase' };
const CARD: CSSProperties = { background: PP.paper, border: `2px solid ${I}`, borderRadius: 22, boxShadow: `0 3px 0 ${I}` };

// WCAG 2.1 contrast, computed (never typed by hand).
function lum(hex: string) {
  const c = hex.replace('#', '').match(/../g)!.map((h) => parseInt(h, 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const textOn = (bg: string) => (ratio(bg, '#ffffff') > ratio(bg, I) ? '#ffffff' : I);

function Block({ id, n, title, rule, children }: { id: string; n: number; title: string; rule: string; children: ReactNode }) {
  return (
    <section id={`nd-${id}`} className="grid gap-3 scroll-mt-24" aria-labelledby={`nd-${id}-h`}>
      <div className="grid gap-1">
        <h2 id={`nd-${id}-h`} className="text-[1.6rem]" style={GY}><GText>{n}. {title}</GText></h2>
        <p className="m-0 font-bold text-[1.02rem] leading-snug"><span className="px-2 py-0.5 rounded-full mr-2 text-sm" style={{ background: PP.butter, border: `2px solid ${I}` }}>Rule</span>{rule}</p>
      </div>
      {children}
    </section>
  );
}

// ---------- 1. Palette pairs ----------
type Pair = { bright: [string, string]; pastel: [string, string]; job: string };
const PAIRS: Pair[] = [
  { bright: ['Grape', PP.grape], pastel: ['Lavender', PP.lavender], job: 'Main brand pair: Grape buttons with white text, Lavender page ground' },
  { bright: ['Sky', PP.sky], pastel: ['Blue crystal', PP.blueCrystal], job: 'Live, info, freeze' },
  { bright: ['Pink punch', PP.pink], pastel: ['Blush', PP.blush], job: 'Competitive, celebrations' },
  { bright: ['Lemon drop', PP.lemon], pastel: ['Butter', PP.butter], job: 'Share, stars, the active player shade' },
  { bright: ['Orange paloma', PP.orange], pastel: ['Peach', PP.peach], job: 'Timers, warm accent' },
  { bright: ['Kelly green', PP.kelly], pastel: ['Mint', PP.mint], job: 'Solo, Cooperative, right, done' },
  { bright: ['Teal', PP.teal], pastel: ['Aqua', PP.aqua], job: 'Water, cool accent' },
  { bright: ['Lime wedge', PP.lime], pastel: ['Sage', PP.sage], job: 'Small accent only' },
];
// Nature tones (approved by her, 2026-11-24):
// colors taken from the Territory build so one named set replaces one-offs.
const NATURE: Pair[] = [
  { bright: ['Wood', '#c47a45'], pastel: ['Sand', '#f1d9bf'], job: 'Doors, floors, furniture' },
  { bright: ['Mouse brown', '#8f7258'], pastel: ['Fawn', '#e2d2c0'], job: 'Animals, earth' },
  { bright: ['Gray', '#8c8a9a'], pastel: ['Cloud', '#e3e2ea'], job: 'Animals, stone, metal' },
];
function Swatch({ name, hex }: { name: string; hex: string }) {
  const fg = textOn(hex);
  return (
    <div className="grid content-between rounded-[16px] px-3 py-2.5 min-h-[5.5rem]" style={{ background: hex, color: fg, border: `2px solid ${I}` }}>
      <b className="text-[1rem] leading-tight">{name}</b>
      <span className="grid text-[0.85rem] font-bold leading-snug"><span>{hex.toUpperCase()}</span><span>{fg === '#ffffff' ? 'White' : 'Ink'} text {ratio(hex, fg).toFixed(1)}:1{ratio(hex, fg) < 4.5 ? ', big text only' : ''}</span></span>
    </div>
  );
}
function PairCard({ p, pending }: { p: Pair; pending?: boolean }) {
  return (
    <div className="grid gap-2 p-3" style={{ ...CARD, borderStyle: pending ? 'dashed' : 'solid' }}>
      <div className="grid grid-cols-2 gap-2"><Swatch name={p.bright[0]} hex={p.bright[1]} /><Swatch name={p.pastel[0]} hex={p.pastel[1]} /></div>
      <span className="text-[0.9rem] font-semibold leading-snug" style={{ color: Q }}>{p.job}</span>
    </div>
  );
}
function Palette() {
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(17rem,1fr))]">{PAIRS.map((p) => <PairCard key={p.bright[0]} p={p} />)}</div>
      <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]">
        {([['Ink', I, 'All text, outlines, icon lines'], ['Paper', PP.paper, 'Cards, question card, panels'], ['White', '#ffffff', 'Back buttons, top bar, sticker edge']] as const).map(([n, h, j]) => (
          <div key={n} className="grid gap-1.5 p-3" style={CARD}><Swatch name={n} hex={h} /><span className="text-[0.9rem] font-semibold" style={{ color: Q }}>{j}</span></div>
        ))}
      </div>
      <div className="grid gap-2 rounded-[22px] p-4" style={{ border: `3px dashed ${I}`, background: PP.paper }}>
        <p className="m-0 font-bold"><span className="px-2 py-0.5 rounded-full mr-2 text-sm" style={{ background: PP.mint, border: `2px solid ${I}` }}>Approved 2026-11-24</span>Nature tones: three more pairs so brown and gray animals, doors and floors come from the kit, not one-off colors.</p>
        <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(17rem,1fr))]">{NATURE.map((p) => <PairCard key={p.bright[0]} p={p} />)}</div>
      </div>
    </div>
  );
}

// ---------- 2. Smooth hand-drawn style ----------
const STYLE_SET: [PowerId, string][] = [['magnet', PP.blush], ['shield', PP.lavender], ['freeze', PP.aqua], ['treasure-chest', PP.peach]];
function SmoothStyle() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="flex flex-wrap items-end justify-center gap-6 p-5" style={CARD}>
        {STYLE_SET.map(([id, tint], i) => (
          <span key={id} className="relative grid place-items-center" style={{ width: 124, height: 124 }}>
            <BlobPatch color={tint} variant={i} size={124} />
            <span className="relative"><CrayonPowerUp id={id} size={94} /></span>
            <Doodle kind={(['sparkle', 'star', 'dot', 'heart'] as const)[i]} color={[PP.lemon, PP.pink, PP.sky, PP.kelly][i]} size={16} className="absolute" style={{ top: 6, right: 8 }} />
          </span>
        ))}
        <span className="basis-full flex justify-center"><span className="inline-flex items-center gap-3 rounded-full px-4 py-2" style={{ background: PP.lavender }}>{STYLE_SET.map(([id]) => <CrayonPowerUp key={id} id={id} size={48} />)}<b className="text-sm">at 48px</b></span></span>
      </div>
      <div className="grid gap-2 p-5 content-start" style={CARD}>
        {[['Do', 'Smooth flat solid fills in palette brights'], ['Do', 'One dark ink outline (#1D1A33) with a slight wobble and round ends'], ['Do', 'A soft pastel blob patch behind, tiny doodle confetti around'], ['Never', 'Grain, paper tooth or visible pencil strokes'], ['Never', 'Gradients, gloss, 3D, faces or characters'], ['Never', 'See-through or faded color']].map(([k, t], i) => (
          <span key={i} className="flex items-start gap-2 font-semibold leading-snug"><span className="shrink-0 mt-0.5 w-6 h-6 rounded-full grid place-items-center" style={{ background: k === 'Do' ? PP.mint : PP.blush, border: `2px solid ${I}` }}>{k === 'Do' ? <Check weight="bold" size={13} /> : <X weight="bold" size={13} />}</span>{t}</span>
        ))}
      </div>
    </div>
  );
}

// ---------- 3. Patterns ----------
function Patterns() {
  const [calm, setCalm] = useState(false);
  return (
    <div className="grid gap-3">
      <button type="button" aria-pressed={calm} onClick={() => setCalm((v) => !v)} className="justify-self-start rounded-full px-5 min-h-11 font-bold" style={{ background: calm ? PP.blueCrystal : '#ffffff', border: `2px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}>{calm ? 'Calm versions on' : 'Show the Calm versions'}</button>
      <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(14rem,1fr))]">
        {PATTERNS.map((p) => <PatternCard key={p.id} p={p} calm={calm} />)}
      </div>
    </div>
  );
}

// ---------- 4. Power-ups ----------
const PASTELS = [PP.butter, PP.blush, PP.lavender, PP.peach, PP.aqua, PP.mint, PP.blueCrystal, PP.sage];
function PowerUps() {
  return (
    <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))]">
      {UNIVERSAL_POWERS.map((p, i) => (
        <div key={p.id} className="grid justify-items-center content-start gap-1 p-3 text-center" style={CARD}>
          <span className="relative grid place-items-center" style={{ width: 112, height: 112 }}><BlobPatch color={PASTELS[i % PASTELS.length]} variant={i} size={112} /><span className="relative"><CrayonPowerUp id={p.id} size={84} title={p.name} /></span></span>
          <b className="text-[1.05rem] leading-tight">{p.name}</b>
          <span className="text-[0.9rem] font-semibold leading-snug">{p.job}</span>
          {p.optional && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: PP.butter, border: `1.5px solid ${I}` }}>Optional, off by default</span>}
        </div>
      ))}
    </div>
  );
}

// ---------- 5. The die ----------
// The roll is just the die (teacher, 2026-11-24): tap it to roll; no Roll button,
// no total written. It tumbles through faces, then waits on the new face.
function RollDie({ start, still, size }: { start: number; still: boolean; size: number }) {
  const [v, setV] = useState(start); const [spin, setSpin] = useState(0);
  const roll = () => {
    if (still) { setV(1 + Math.floor(Math.random() * 6)); return; }
    let n = 0; const t = window.setInterval(() => { setV(1 + Math.floor(Math.random() * 6)); n += 1; if (n > 6) window.clearInterval(t); }, 110);
    setSpin((k) => k + 1);
  };
  return (
    <button type="button" onClick={roll} aria-label={`Die showing ${v}. Tap to roll`} className="rounded-[20px]">
      <DieWiggle still={still}><motion.span key={spin} className="inline-grid" initial={still || !spin ? false : { rotate: -200, y: -30 }} animate={{ rotate: 0, y: 0 }} transition={{ type: 'spring', stiffness: 180, damping: 11 }}><CrayonDie value={v} size={size} /></motion.span></DieWiggle>
    </button>
  );
}
function Dice({ still }: { still: boolean }) {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-center gap-4 p-4" style={CARD}>
        {[1, 2, 3, 4, 5, 6].map((n) => <DieWiggle key={n} still={still}><CrayonDie value={n} size={84} title={`Die face ${n}`} /></DieWiggle>)}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-3 p-5 justify-items-center content-center" style={{ ...CARD, background: PP.mint }}><b>One die: tap it to roll</b><RollDie start={4} still={still} size={140} /></div>
        <div className="grid gap-3 p-5 justify-items-center content-center" style={{ ...CARD, background: PP.lavender }}><b>Double dice, side by side</b><span className="flex gap-5"><RollDie start={5} still={still} size={120} /><RollDie start={2} still={still} size={120} /></span></div>
      </div>
    </div>
  );
}

// ---------- 8. Icons ----------
const ICON_ROW: [typeof GearSix, string, string][] = [
  [House, 'Home', PP.lavender], [GearSix, 'Settings', PP.paper], [Lightbulb, 'Hint', PP.butter], [SpeakerHigh, 'Listen', PP.blueCrystal], [Play, 'Play', GO_YELLOW],
  [MagnifyingGlass, 'Search', PP.paper], [Stack, 'Question sets', PP.mint], [ChartBar, 'Reports', PP.aqua], [PaletteIcon, 'Themes', PP.blush], [UploadSimple, 'Upload', PP.peach],
  [Printer, 'Print', PP.paper], [Trophy, 'Results', PP.butter], [GameController, 'Games', PP.lavender], [Star, 'Stars', PP.butter],
];

// ---------- 11. Class modes ----------
function ClassMode({ kind }: { kind: 'Cooperative' | 'Competitive' }) {
  const co = kind === 'Cooperative';
  const bright = co ? PP.kelly : PP.pink, soft = co ? PP.mint : PP.blush;
  const Mark = co ? Heart : Lightning;
  return (
    <div className="grid justify-items-center gap-2 p-5 text-center" style={{ ...CARD, background: soft }}>
      <span className="relative inline-grid place-items-center w-24 h-24 rounded-full" style={{ background: bright, border: `3px solid ${I}` }}>
        <UsersThree weight="bold" size={50} aria-hidden="true" />
        <span className="absolute -right-1 -top-1 w-10 h-10 rounded-full grid place-items-center" style={{ background: PP.paper, border: `3px solid ${I}` }}><Mark weight="fill" size={20} color={co ? PP.pink : I} aria-hidden="true" /></span>
      </span>
      <b className="text-[1.3rem]" style={GY}><GText>{kind}</GText></b>
      <span className="font-semibold leading-snug">{co ? 'People with a heart. The class plays toward one goal.' : 'People with a versus spark. Teams race each other.'}</span>
    </div>
  );
}

const NEVER = [
  'Washi tape, or a second sheet stacked behind a card', 'Tilted menus, cards or teams', 'Characters, buddies, faces on objects, mascots',
  'Heavy crayon grain or pencil strokes', 'Outlined headlines with an offset drop shadow', 'A yellow ground with purple pill buttons as the main pairing',
  'A purple pill with Gamify typed in it (the real wordmark only)', 'Versus as its own way to play; "Step X of Y" text; teach cards',
];

export default function NewDirection() {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  return (
    <div className="rounded-[2rem] p-5 sm:p-8 grid gap-12" style={{ ...PURPLE_GROUND, color: I }}>
      <header className="grid gap-2 justify-items-center text-center">
        <h1 className="text-[2.6rem]" style={GY}><GText>New direction</GText></h1>
        <p className="m-0 max-w-[46rem] font-semibold text-[1.05rem]">The current direction only, one rule per block. Every Universal view, game mockup, teacher page and public page on /brand is built from these parts. Approving this tab and the Approval list means the live rebuild matches what you saw here.</p>
        <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ background: PP.butter, border: `2px solid ${I}` }}>Proposal: nothing on the live site changes until you approve</span>
      </header>

      <Block id="palette" n={1} title="Palette pairs" rule="Grape and Lavender are the main pair; every bright has its named pastel; white text only on Grape and Ink, ink text everywhere else (WCAG 4.5:1, computed below).">
        <Palette />
      </Block>

      <Block id="style" n={2} title="Smooth hand-drawn style" rule="Smooth flat solid fills with one wobbly dark ink outline; no grain, no pencil strokes, no faces; a pastel blob patch and tiny doodles around the art.">
        <SmoothStyle />
      </Block>

      <Block id="patterns" n={3} title="Patterns" rule="Only the Quiet doodle ground sits behind words; every busier pattern stays at the edges, 24px clear of text; each has a Calm version.">
        <Patterns />
      </Block>

      <Block id="powerups" n={4} title="Crayon power-ups" rule="One shared set with the same name and job in every game; a game picks from it and only adds its own when none fits; the bonus box is the Prize Chest everywhere.">
        <PowerUps />
      </Block>

      <Block id="die" n={5} title="The simple themable die" rule="One plain face (rounded square, ink outline, round pips; no base, shine or texture) so a theme can swap the face color, the pip color or the whole face; it wiggles on hover and rolls on tap.">
        <Dice still={still} />
      </Block>

      <Block id="stickers" n={6} title="Stickers" rule="One solid bright circle, a thick white border, one big picture and the earn rule in capitals hugging the top of the picture; locked ones are gray with how to earn them.">
        <div className="flex flex-wrap items-center justify-center gap-5 p-5" style={CARD}>
          {STARTER.slice(0, 7).map((s) => <StickerArt key={s.id} s={s} size={112} />)}
          <span className="grid justify-items-center gap-1"><StickerArt s={STARTER[8]} size={112} locked /><span className="text-xs font-bold" style={{ color: Q }}>Locked</span></span>
        </div>
      </Block>

      <Block id="icons" n={7} title="Icons" rule="Phosphor bold only, one icon per job, ink on a round pastel badge, centered by pixel and by eye; the full list is on the Icons tab.">
        <div className="grid grid-cols-4 sm:grid-cols-7 justify-items-center gap-4 p-5" style={CARD}>
          {ICON_ROW.map(([Ic, l, bg]) => <span key={l} className="grid justify-items-center gap-1 w-20 text-center"><IconBadge size={56} bg={bg} ring optical={l === 'Play' ? 'play' : l === 'Hint' ? 'bulb' : l === 'Stars' ? 'star' : 'none'}><Ic weight="bold" size={26} /></IconBadge><span className="text-[0.85rem] font-bold leading-tight">{l}</span></span>)}
        </div>
      </Block>

      <Block id="type" n={8} title="Type" rule="Two fonts only: Grow Year in ALL CAPITALS for titles, scores and the tagline; Inclusive Sans (bold for headings and buttons, regular for body) in sentence case.">
        <div className="grid gap-4 p-6" style={CARD}>
          <p className="m-0 text-[clamp(2rem,4.5vw,3.6rem)]" style={{ ...GY, color: PP.grape }}><GText>Every question becomes a game</GText></p>
          <p className="m-0 font-heading font-bold text-[1.6rem]">Pick your question set</p>
          <p className="m-0 text-[1.15rem] max-w-prose">Answer the question, then tap the board to make your move. Right answers can bring a surprise power-up.</p>
          <span className="text-[3rem] tabular-nums" style={GY}><GText>1,250</GText></span>
        </div>
      </Block>

      <Block id="buttons" n={9} title="Buttons" rule="Yellow #FDFD94 with ink text is go (Start, Next, Play); Grape with white text is every other main action; white is Back and secondary; round tools are 44px; Next stays off until a card is picked.">
        <div className="grid gap-4 p-5" style={CARD}>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <MenuGo>Next<ArrowRight weight="bold" size={24} /></MenuGo>
            <MenuGo disabled>Next<ArrowRight weight="bold" size={24} /></MenuGo>
            <MenuBack />
            <span className="min-h-[56px] px-7 rounded-full font-bold text-[20px] inline-flex items-center gap-2" style={{ background: PP.grape, color: '#ffffff', border: `3px solid ${I}`, boxShadow: `0 4px 0 ${PP.grapeDeep}` }}><Play weight="fill" size={20} />Create an Activity</span>
            <span className="min-h-[56px] px-6 rounded-full font-bold text-[20px] inline-flex items-center gap-2" style={{ background: '#ffffff', border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}` }}>Cancel</span>
          </div>
          <div className="flex justify-center"><GameTools /></div>
        </div>
      </Block>

      <Block id="topbar" n={10} title="The white site top bar" rule="Every public page, welcome and start menu has the white top bar with the real GAMIFY wordmark; phones fold the links into one 44px menu; student pages show the logo only.">
        <div className="grid gap-3">
          <div className="overflow-hidden rounded-[16px]" style={{ border: `2px solid ${I}` }}><SiteBarSmall phone={false} /></div>
          <div className="overflow-hidden rounded-[16px] max-w-[390px]" style={{ border: `2px solid ${I}` }}><SiteBarSmall phone /></div>
        </div>
      </Block>

      <Block id="classmodes" n={11} title="Cooperative and Competitive" rule="The Live class choice is Cooperative (people with a heart, Kelly and Mint) or Competitive (people with a versus spark, Pink and Blush), in the ways-to-play icon family.">
        <div className="grid gap-4 sm:grid-cols-2 max-w-[44rem]"><ClassMode kind="Cooperative" /><ClassMode kind="Competitive" /></div>
      </Block>

      <Block id="ways" n={12} title="Ways to play" rule="Three ways only, each with its own pair: Share (Lemon, Butter), Live (Sky, Blue crystal), Solo (Kelly, Mint); a game shows only the ways it really plays.">
        <div className="grid gap-2 max-w-[38rem]"><WayRow way="Share" /><WayRow way="Live" /><WayRow way="Solo" /></div>
        <p className="m-0 text-sm font-semibold flex items-center gap-2" style={{ color: Q }}><Broadcast weight="bold" size={16} />Live always means a class screen plus each student&apos;s own device.</p>
      </Block>

      <Block id="never" n={13} title="Never" rule="If a screen has any of these, it is not done (your rules, and clear distance from the competitor look).">
        <ul className="grid gap-2 sm:grid-cols-2 m-0 p-0 list-none">
          {NEVER.map((t) => <li key={t} className="flex items-start gap-2 p-3 font-semibold leading-snug" style={CARD}><span className="shrink-0 w-6 h-6 rounded-full grid place-items-center" style={{ background: PP.blush, border: `2px solid ${I}` }}><X weight="bold" size={13} /></span>{t}</li>)}
        </ul>
      </Block>
    </div>
  );
}
