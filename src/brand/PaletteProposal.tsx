import { Play, Snowflake, Star, Timer } from '@phosphor-icons/react';
import { CrayonPowerUp, type PowerId } from './CrayonKit';

// Palette update (PROPOSAL, teacher 2026-11-23: "lets improve the color
// pallete, i want the main color to still be purple and add a light blue").
// Preview only on the Brand page. Nothing in src/index.css or any live screen
// uses these until she approves. Contrast ratios are WCAG 2.1, computed.

export const PP = {
  grape: '#6a45f0', grapeDeep: '#4b2fc9', periwinkle: '#7a88fe',
  blueCrystal: '#bfdff3', sky: '#4ba3e8', skyDeep: '#1f6fb8',
  pink: '#f055a5', lemon: '#fabe37', orange: '#ff9b28', kelly: '#22b04a', lime: '#ccd537',
  lavender: '#ddd6ff', blush: '#ffd3e6', butter: '#fff1b8', aqua: '#c9f1ee', sage: '#e8f0b4',
  ink: '#1d1a33', cream: '#f6f0e4', paper: '#fffaf0', quiet: '#57506e',
};

type Swatch = { name: string; hex: string; role: string; text: string; ratio: string };
const GROUPS: { title: string; items: Swatch[] }[] = [
  { title: 'Main purple', items: [
    { name: 'Grape', hex: PP.grape, role: 'Main brand color: main button, logo block, selected', text: '#ffffff', ratio: 'White 5.6:1 (AA)' },
    { name: 'Grape deep', hex: PP.grapeDeep, role: 'Button shadow, purple text on cream', text: '#ffffff', ratio: 'White 8.2:1, 7.3:1 on cream' },
    { name: 'Periwinkle', hex: PP.periwinkle, role: 'Second purple, links today\'s site ground', text: PP.ink, ratio: 'Ink 5.4:1' },
  ] },
  { title: 'Light blue (new)', items: [
    { name: 'Blue crystal', hex: PP.blueCrystal, role: 'Light blue: panels, question card header, calm ground', text: PP.ink, ratio: 'Ink 12.1:1' },
    { name: 'Sky', hex: PP.sky, role: 'Solid light blue accent: info, freeze', text: PP.ink, ratio: 'Ink 6.2:1 (never white text)' },
  ] },
  { title: 'Bright accents', items: [
    { name: 'Pink punch', hex: PP.pink, role: 'Lead block, celebrations', text: PP.ink, ratio: 'Ink 5.3:1' },
    { name: 'Lemon drop', hex: PP.lemon, role: 'Stars, rewards, points', text: PP.ink, ratio: 'Ink 10.0:1' },
    { name: 'Orange paloma', hex: PP.orange, role: 'Timers, warm accent', text: PP.ink, ratio: 'Ink 8.0:1' },
    { name: 'Kelly green', hex: PP.kelly, role: 'Right, done, go', text: PP.ink, ratio: 'Ink 5.9:1' },
    { name: 'Lime wedge', hex: PP.lime, role: 'Small accent only', text: PP.ink, ratio: 'Ink 10.5:1' },
  ] },
  { title: 'Pastel tints (crayon blob patches behind art)', items: [
    { name: 'Lavender', hex: PP.lavender, role: 'Patch behind purple art', text: PP.ink, ratio: 'Ink 12.1:1' },
    { name: 'Blush', hex: PP.blush, role: 'Patch behind pink art', text: PP.ink, ratio: 'Ink 12.6:1' },
    { name: 'Butter', hex: PP.butter, role: 'Patch behind yellow art', text: PP.ink, ratio: 'Ink 14.9:1' },
    { name: 'Aqua', hex: PP.aqua, role: 'Patch behind blue and green art', text: PP.ink, ratio: 'Ink 13.9:1' },
    { name: 'Sage', hex: PP.sage, role: 'Patch behind lime art', text: PP.ink, ratio: 'Ink 14.1:1' },
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
    <section className="grid gap-4 rounded-[2rem] p-5 sm:p-6" style={{ background: PP.paper, border: `3px dashed ${PP.grape}` }} aria-labelledby="pp-title">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full px-3 py-1 text-sm font-bold" style={{ background: PP.lemon, color: PP.ink, border: `2px solid ${PP.ink}` }}>Proposal, not live</span>
        <h2 id="pp-title" className="font-heading text-xl" style={{ color: PP.ink }}>Palette update (proposal)</h2>
      </div>
      <p className="text-sm font-semibold max-w-prose" style={{ color: PP.quiet }}>
        Your request of 2026-11-23: purple stays the main color and a light blue joins it. Built from your three references (Violet Syrup, Blue Crystal, the bright crayon and kidcore palettes). Solid and punchy, ink text on every light color, white text only on Grape and Ink. Nothing on the site uses this until you approve.
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
            <button type="button" className="rounded-full px-6 min-h-14 text-xl font-bold inline-flex items-center gap-2" style={{ background: PP.grape, color: '#fff', border: `2px solid ${PP.ink}`, boxShadow: `0 4px 0 ${PP.grapeDeep}` }}>
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
              {[['monday', PP.grape, '#fff'], ['apple', PP.pink, PP.ink], ['run', PP.sky, PP.ink], ['blue', PP.kelly, PP.ink]].map(([t, bg, fg]) => (
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
