import { Play, Snowflake, Star, Timer } from '@phosphor-icons/react';
import { CrayonPowerUp, type PowerId } from './CrayonKit';

// Palette update (PROPOSAL, teacher 2026-11-23: "lets improve the color
// pallete, i want the main color to still be purple and add a light blue").
// Preview only on the Brand page. Nothing in src/index.css or any live screen
// uses these until she approves. Contrast ratios are WCAG 2.1, computed.

export const PP = {
  // Teacher, 2026-11-24 (newest): "remove the gamify purples and replace with the
  // grape and lavender". The old keys stay as aliases so every part follows:
  // periwinkle is now Grape and gamify is now Lavender.
  grape: '#6a45f0', grapeDeep: '#4b2fc9', periwinkle: '#6a45f0',
  blueCrystal: '#bfdff3', sky: '#4ba3e8', skyDeep: '#1f6fb8',
  pink: '#f055a5', lemon: '#fabe37', orange: '#ff9b28', kelly: '#22b04a', lime: '#ccd537',
  lavender: '#ddd6ff', blush: '#ffd3e6', butter: '#fff1b8', aqua: '#c9f1ee', sage: '#e8f0b4',
  gamify: '#ddd6ff', peach: '#ffd9b3', mint: '#c8f0dc', teal: '#1fb5a8',
  ink: '#1d1a33', cream: '#f6f0e4', paper: '#fffaf0', quiet: '#57506e',
};

type Swatch = { name: string; hex: string; role: string; text: string; ratio: string };
// Every bright color has its pastel (teacher, 2026-11-23). The main purple is
// Grape with its pastel Lavender (teacher, 2026-11-24).
const GROUPS: { title: string; items: Swatch[] }[] = [
  { title: 'Main purple (teacher, 2026-11-24: Grape and Lavender replace the Gamify purples)', items: [
    { name: 'Grape', hex: PP.grape, role: 'Main brand color: Team Purple, answer A, meters, links; white text only', text: '#ffffff', ratio: 'White 5.6:1 (ink fails)' },
    { name: 'Grape deep', hex: PP.grapeDeep, role: 'Shadows under Grape, purple text on paper', text: '#ffffff', ratio: 'White 8.3:1' },
    { name: 'Lavender', hex: PP.lavender, role: 'Pastel of Grape: the page ground, menu chips, team pastel', text: PP.ink, ratio: 'Ink 13.9:1' },
  ] },
  { title: 'Light blue (new)', items: [
    { name: 'Sky', hex: PP.sky, role: 'Bright light blue: info, freeze', text: PP.ink, ratio: 'Ink 6.2:1 (never white text)' },
    { name: 'Blue crystal', hex: PP.blueCrystal, role: 'Pastel of Sky: panels, question card header', text: PP.ink, ratio: 'Ink 12.1:1' },
  ] },
  { title: 'Bright accents, each beside its pastel', items: [
    { name: 'Pink punch', hex: PP.pink, role: 'Lead block, celebrations', text: PP.ink, ratio: 'Ink 5.3:1' },
    { name: 'Blush', hex: PP.blush, role: 'Pastel of Pink punch', text: PP.ink, ratio: 'Ink 12.6:1' },
    { name: 'Lemon drop', hex: PP.lemon, role: 'Stars, rewards, points', text: PP.ink, ratio: 'Ink 10.0:1' },
    { name: 'Butter', hex: PP.butter, role: 'Pastel of Lemon drop', text: PP.ink, ratio: 'Ink 14.9:1' },
    { name: 'Orange paloma', hex: PP.orange, role: 'Timers, warm accent', text: PP.ink, ratio: 'Ink 8.0:1' },
    { name: 'Peach', hex: PP.peach, role: 'Pastel of Orange paloma', text: PP.ink, ratio: 'Ink 13.5:1' },
    { name: 'Kelly green', hex: PP.kelly, role: 'Right, done, go', text: PP.ink, ratio: 'Ink 5.9:1' },
    { name: 'Mint', hex: PP.mint, role: 'Pastel of Kelly green', text: PP.ink, ratio: 'Ink 13.6:1' },
    { name: 'Teal', hex: PP.teal, role: 'Water, cool accent', text: PP.ink, ratio: 'Ink 6.6:1' },
    { name: 'Aqua', hex: PP.aqua, role: 'Pastel of Teal', text: PP.ink, ratio: 'Ink 13.9:1' },
    { name: 'Lime wedge', hex: PP.lime, role: 'Small accent only', text: PP.ink, ratio: 'Ink 10.5:1' },
    { name: 'Sage', hex: PP.sage, role: 'Pastel of Lime wedge', text: PP.ink, ratio: 'Ink 14.1:1' },
  ] },
  // Art Director request (2026-11-24): natural colors for wood, fur and floors in Classic art. Approved by her 2026-11-24.
  { title: 'Nature tones (approved 2026-11-24)', items: [
    { name: 'Wood', hex: '#c47a45', role: 'Wood floors, frames, furniture', text: PP.ink, ratio: 'Ink 5.0:1' },
    { name: 'Wood deep', hex: '#8a4f2a', role: 'Pair of Wood: grain, shadow side', text: '#ffffff', ratio: 'White 6.5:1 (ink fails)' },
    { name: 'Mouse brown', hex: '#c9ac90', role: 'Brown mice, fur', text: PP.ink, ratio: 'Ink 7.8:1' },
    { name: 'Mouse brown deep', hex: '#8f7258', role: 'Pair of Mouse brown: ears, shadow', text: '#ffffff', ratio: 'White 4.5:1 (art only, not for small text)' },
    { name: 'Gray', hex: '#aaa6bb', role: 'Gray mice and cats, stone', text: PP.ink, ratio: 'Ink 7.1:1' },
    { name: 'Gray deep', hex: '#5f5a76', role: 'Pair of Gray: shadow side', text: '#ffffff', ratio: 'White 6.5:1 (ink fails)' },
    { name: 'Tan', hex: '#ecd9bd', role: 'The tan gingham pattern', text: PP.ink, ratio: 'Ink 12.2:1' },
  ] },
  { title: 'Ink and paper', items: [
    { name: 'Ink', hex: PP.ink, role: 'All text, faces, control edge', text: '#ffffff', ratio: 'White 16.8:1' },
    { name: 'Cream', hex: PP.cream, role: 'Page ground', text: PP.ink, ratio: 'Ink 14.8:1' },
    { name: 'Paper', hex: PP.paper, role: 'Cards, question box', text: PP.ink, ratio: 'Ink 16.2:1' },
  ] },
];

function Chip({ s }: { s: Swatch }) {
  return (
    <div className="rounded-[1.25rem] overflow-hidden" style={{ background: PP.paper, border: `2px solid ${PP.ink}` }}>
      <div className="h-16 px-3 flex items-end pb-2 font-bold" style={{ background: s.hex, color: s.text }}>Aa {s.name}</div>
      <div className="px-3 py-2 grid gap-0.5 text-sm">
        <span className="font-bold">{s.hex.toUpperCase()}</span>
        <span className="font-semibold" style={{ color: PP.quiet }}>{s.role}</span>
        <span className="font-semibold">{s.ratio}</span>
      </div>
    </div>
  );
}

const ROW: [PowerId, string][] = [['double-points', PP.butter], ['freeze', PP.aqua], ['shield', PP.lavender], ['magnet', PP.blush], ['hint', PP.sage]];

export default function PaletteProposal() {
  return (
    <section className="grid gap-4 rounded-[2rem] p-5 sm:p-6" style={{ background: PP.paper, border: `3px dashed ${PP.periwinkle}` }} aria-labelledby="pp-title">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full px-3 py-1 text-sm font-bold" style={{ background: PP.lemon, color: PP.ink, border: `2px solid ${PP.ink}` }}>Proposal, not live</span>
        <h2 id="pp-title" className="font-heading text-xl" style={{ color: PP.ink }}>Palette update (proposal)</h2>
      </div>
      <p className="text-sm font-semibold max-w-prose" style={{ color: PP.quiet }}>
        Your requests of 2026-11-23: today's Gamify purple stays the main color, a light blue joins it, and every bright color has its pastel. Built from your three references (Violet Syrup, Blue Crystal, the bright crayon and kidcore palettes). Ink text on every color except Grape and Ink. Nothing on the site uses this until you approve.
      </p>
      {GROUPS.map((g) => (
        <div key={g.title} className="grid gap-2">
          <h3 className="font-heading font-bold">{g.title}</h3>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 wide:grid-cols-5">{g.items.map((s) => <Chip key={s.name} s={s} />)}</div>
        </div>
      ))}

      <div className="grid gap-2">
        <h3 className="font-heading font-bold">Mockup strip</h3>
        <div className="grid gap-4 wide:grid-cols-[auto_1fr_auto] items-center rounded-[1.5rem] p-4" style={{ background: PP.cream }}>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="rounded-full px-6 min-h-14 text-xl font-bold inline-flex items-center gap-2" style={{ background: PP.periwinkle, color: '#ffffff', border: `2px solid ${PP.ink}`, boxShadow: `0 4px 0 ${PP.grapeDeep}` }}>
              <Play weight="fill" aria-hidden="true" /> Play
            </button>
            <button type="button" className="rounded-full px-5 min-h-14 text-lg font-bold" style={{ background: PP.blueCrystal, color: PP.ink, border: `2px solid ${PP.ink}`, boxShadow: `0 4px 0 ${PP.sky}` }}>Settings</button>
          </div>
          <div className="rounded-[1.25rem] overflow-hidden" style={{ border: `2px solid ${PP.ink}`, background: PP.paper }}>
            <div className="flex items-center gap-2 px-4 py-2 font-bold" style={{ background: PP.blueCrystal, color: PP.ink }}>
              <span>Question 3 of 10</span>
              <span className="ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-0.5" style={{ background: PP.lemon }}><Star weight="fill" aria-hidden="true" /> 40</span>
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5" style={{ background: PP.orange }}><Timer weight="fill" aria-hidden="true" /> 0:12</span>
            </div>
            <div className="px-4 py-3 text-lg font-bold">Which word needs a capital letter?</div>
            <div className="grid grid-cols-2 gap-2 px-4 pb-3">
              {[['monday', PP.periwinkle, '#ffffff'], ['apple', PP.pink, PP.ink], ['run', PP.sky, PP.ink], ['blue', PP.kelly, PP.ink]].map(([t, bg, fg]) => (
                <span key={t} className="rounded-[0.9rem] px-3 py-2 font-bold text-center" style={{ background: bg, color: fg, border: `2px solid ${PP.ink}` }}>{t}</span>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-center" aria-label="Power-ups on pastel patches">
            {ROW.map(([id, tint]) => (
              <span key={id} className="grid place-items-center rounded-[40%_60%_55%_45%/50%_45%_55%_50%] w-16 h-16" style={{ background: tint }}><CrayonPowerUp id={id} size={46} /></span>
            ))}
            <span className="grid place-items-center w-16 h-16 rounded-full" style={{ background: PP.sky, color: PP.ink }} title="Freeze accent"><Snowflake size={30} weight="bold" aria-hidden="true" /></span>
          </div>
        </div>
      </div>
    </section>
  );
}
