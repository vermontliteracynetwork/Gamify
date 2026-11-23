import { useState, type CSSProperties, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Check } from '@phosphor-icons/react';
import { CrayonSparkle, ND, Paper, Washi } from './buddies';
import { CrayonPawn, CrayonPowerUp } from './CrayonKit';

// "Clean core, handmade edges" (proposal, teacher 2026-11-23): one mock game
// screen worn two ways. The core (score board, board play zone, question card,
// answer tiles, main button) is identical in both; only the edges change.
// Left: Classic, made by hand in cut paper. Right: an example kid theme drawn
// in crayon with clay pieces. All drawn in code; no images.

const GY = { fontFamily: "'Grow Year', 'Segoe UI', system-ui, sans-serif" };
const ZONE: CSSProperties = { outline: `3px dashed ${ND.cobalt}`, outlineOffset: 4 };
const press = (c: string) => ({ [ND.cobalt]: ND.cobaltDeep, [ND.pink]: ND.pinkDeep, [ND.green]: ND.greenDeep, [ND.yellow]: '#d9a900', [ND.mint]: '#2aa58f' } as Record<string, string>)[c] ?? '#d9cfbd';
const edge = (c: string): CSSProperties => ({ background: c, border: `2px solid ${ND.ink}`, boxShadow: `0 4px 0 ${press(c)}` });

type Skin = { tokenA: ReactNode; tokenB: ReactNode; iconA: ReactNode; iconB: ReactNode };

// ---------- The clean core: never themed ----------
function Core({ skin, zone }: { skin: Skin; zone: boolean }) {
  const z = zone ? ZONE : undefined;
  const cells: (0 | 1 | 2)[] = [1, 0, 2, 0, 1, 2, 0, 0, 0];
  return (
    <div className="relative grid gap-3 px-4 sm:px-5 pt-3 pb-5">
      <div className="flex justify-end">
        <div className="flex items-center gap-3 rounded-full pl-3 pr-4 py-1.5 font-bold" style={{ background: '#ffffff', color: ND.ink, ...z }}>
          <span className="text-sm" style={{ color: ND.quiet }}>Rounds 3/8</span>
          <span className="flex items-center gap-1">{skin.iconA}<span className="text-xl tabular-nums" style={GY}>12</span></span>
          <span className="flex items-center gap-1">{skin.iconB}<span className="text-xl tabular-nums" style={GY}>9</span></span>
        </div>
      </div>
      <div className="grid grid-cols-[1fr_1.15fr] gap-4 items-start">
        <div className="aspect-square rounded-[1.25rem] p-2 grid grid-cols-3 grid-rows-3 gap-1.5" style={{ background: '#ffffff', ...z }} aria-label="Board play zone">
          {cells.map((c, i) => (
            <button key={i} type="button" tabIndex={-1} aria-label={c ? 'Taken' : 'Open space'} className="rounded-[0.8rem] grid place-items-center" style={c ? { background: ND.cream } : edge('#fffaf0')}>
              {c === 1 ? skin.tokenA : c === 2 ? skin.tokenB : null}
            </button>
          ))}
        </div>
        <div className="grid gap-2.5">
          <div className="rounded-[1.25rem] px-4 py-4 text-left font-heading font-bold text-[1.05rem] leading-snug" style={{ background: '#ffffff', color: ND.ink, ...z }}>
            Which word needs a capital letter?
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-[1rem]" style={z}>
            {([[ND.pink, 'monday'], [ND.yellow, 'apple'], [ND.green, 'blue'], [ND.mint, 'run']] as [string, string][]).map(([bg, w], i) => (
              <button key={w} type="button" tabIndex={-1} className="min-h-12 rounded-[1rem] px-2 font-bold text-lg text-left flex items-center gap-2" style={{ ...edge(bg), color: ND.ink }}>
                <span className="w-7 h-7 shrink-0 rounded-full grid place-items-center text-sm" style={{ background: ND.paper }}>{'ABCD'[i]}</span>{w}
              </button>
            ))}
          </div>
          <button type="button" tabIndex={-1} className="min-h-12 rounded-full font-bold text-lg inline-flex items-center justify-center gap-2" style={{ ...edge(ND.cobalt), color: '#ffffff', ...z }}>
            <Check weight="bold" size={20} />Check
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Classic: made by hand in cut paper ----------
function ClassicEdges({ still }: { still: boolean }) {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Paper color={ND.pink} lift={false} rx={30} className="absolute inset-1" />
      <Paper color={ND.yellow} rx={999} className="absolute -right-10 -top-12 w-40 h-40" />
      <Paper color={ND.green} lift rx={14} tilt={-2} className="absolute -left-4 -right-4 -bottom-3 h-[18%]" />
      <svg className="absolute left-2 top-14 w-16 h-40" viewBox="0 0 60 150" filter="url(#nd-crayon)">
        <CrayonSparkle x={20} y={20} s={0.9} c={ND.paper} />
        <path d="M30 60 a12 12 0 1 1 -2 18 a7 7 0 1 1 8 -8" stroke={ND.yellow} strokeWidth="5" fill="none" strokeLinecap="round" />
        <circle cx="16" cy="120" r="5" fill={ND.cobalt} /><circle cx="40" cy="134" r="3.5" fill={ND.paper} />
      </svg>
      <motion.span className="absolute -left-2 -bottom-4" animate={still ? undefined : { y: [0, -6, 0], rotate: [-8, -4, -8] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} style={{ rotate: -8 }}>
        <CrayonPowerUp id="double-points" size={84} />
      </motion.span>
      <span className="absolute right-3 -bottom-2"><CrayonPowerUp id="shield" size={62} /></span>
      <div className="absolute left-4 top-3">
        <Paper color={ND.paper} rx={8} tilt={-3} className="px-4 py-1.5">
          <span className="text-xl leading-none" style={{ ...GY, color: ND.ink }}>Three in a Row</span>
        </Paper>
        <Washi className="-top-3 -left-5" rotate={-28} w="3.5rem" color={ND.mint} />
      </div>
    </div>
  );
}
const classicSkin: Skin = {
  tokenA: <CrayonPawn color={ND.cobalt} size={40} />,
  tokenB: <CrayonPawn color={ND.pink} size={40} />,
  iconA: <CrayonPawn color={ND.cobalt} size={26} />,
  iconB: <CrayonPawn color={ND.pink} size={26} />,
};

// ---------- Example kid theme: crayon drawing with clay pieces (no faces) ----------
function Clay({ color, size = 40 }: { color: string; size?: number }) {
  return (
    <svg viewBox="0 0 60 60" width={size} height={size} aria-hidden="true" overflow="visible">
      <ellipse cx="30" cy="32" rx="21" ry="19" fill={color} filter="url(#nd-clay)" />
      <ellipse cx="22" cy="23" rx="7" ry="4.5" fill="#ffffff" opacity="0.4" transform="rotate(-25 22 23)" />
    </svg>
  );
}
function hatch(w: number, h: number, gap: number) {
  let d = '';
  for (let x = -h; x < w; x += gap) d += `M${x} ${h} L${x + h * 0.6} 0 `;
  return d;
}
function KidEdges({ still }: { still: boolean }) {
  return (
    <div className="absolute inset-0" aria-hidden="true" style={{ background: '#fffdf6' }}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 640 420" preserveAspectRatio="xMidYMid slice">
        <g filter="url(#nd-crayon)">
          <path d={hatch(640, 300, 9)} stroke="#8fc3ff" strokeWidth="5" opacity="0.9" />
          {[[ND.coral, 210], [ND.yellow, 186], [ND.green, 162], [ND.cobalt, 138]].map(([c, r]) => (
            <path key={r as number} d={`M${-60} 330 a${r} ${r} 0 0 1 ${(r as number) * 2} 0`} stroke={c as string} strokeWidth="18" fill="none" transform="translate(40 0)" />
          ))}
          <circle cx="585" cy="50" r="36" fill={ND.yellow} />
          {Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2; return <path key={i} d={`M${585 + 46 * Math.cos(a)} ${50 + 46 * Math.sin(a)} L${585 + 66 * Math.cos(a)} ${50 + 66 * Math.sin(a)}`} stroke={ND.tangerine} strokeWidth="7" strokeLinecap="round" />; })}
          <path d={`M0 420 V372 ${Array.from({ length: 33 }, (_, i) => `L${i * 20 + 10} ${i % 2 ? 372 : 352}`).join(' ')} L640 372 V420 Z`} fill={ND.green} />
          {[[40, 340, ND.pink], [600, 346, ND.violet], [560, 360, ND.coral]].map(([x, y, c]) => (
            <g key={x as number}>
              <path d={`M${x} ${y} V${(y as number) + 40}`} stroke={ND.greenDeep} strokeWidth="5" />
              {[0, 72, 144, 216, 288].map((d) => <circle key={d} cx={(x as number) + 12 * Math.cos((d * Math.PI) / 180)} cy={(y as number) + 12 * Math.sin((d * Math.PI) / 180)} r="9" fill={c as string} />)}
              <circle cx={x as number} cy={y as number} r="6" fill={ND.yellow} />
            </g>
          ))}
        </g>
      </svg>
      <motion.span className="absolute right-6 bottom-6" animate={still ? undefined : { y: [0, -8, 0], scaleY: [1, 1.05, 0.95, 1] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.6 }}>
        <Clay color={ND.tangerine} size={56} />
      </motion.span>
      <div className="absolute left-4 top-3">
        <svg viewBox="0 0 200 50" className="absolute inset-0 w-full h-full" preserveAspectRatio="none" filter="url(#nd-crayon)">
          <path d={Array.from({ length: 24 }, (_, i) => `${i ? 'L' : 'M'}${6 + i * 8} ${i % 2 ? 44 : 6}`).join(' ')} stroke={ND.yellow} strokeWidth="10" fill="none" strokeLinejoin="round" />
        </svg>
        <span className="relative block px-4 py-1.5 text-xl leading-none" style={{ ...GY, color: ND.ink }}>Rainbow Garden</span>
      </div>
    </div>
  );
}
const kidSkin: Skin = {
  tokenA: <Clay color={ND.violet} />,
  tokenB: <Clay color={ND.tangerine} />,
  iconA: <Clay color={ND.violet} size={26} />,
  iconB: <Clay color={ND.tangerine} size={26} />,
};

function Mock({ label, edges, skin, zone, tag }: { label: string; edges: ReactNode; skin: Skin; zone: boolean; tag: string }) {
  return (
    <figure className="grid gap-2">
      <div className="relative rounded-[1.75rem] overflow-hidden pt-12" style={{ background: ND.cream }}>
        <div style={{ opacity: zone ? 0.35 : 1, transition: 'opacity 200ms' }}>{edges}</div>
        <Core skin={skin} zone={zone} />
        <span className="absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider" style={{ background: ND.ink, color: '#ffffff' }}>{tag}</span>
      </div>
      <figcaption className="text-sm font-semibold" style={{ color: ND.quiet }}>{label}</figcaption>
    </figure>
  );
}

export default function HandmadeMock({ still }: { still: boolean }) {
  const [zone, setZone] = useState(false);
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" aria-pressed={zone} onClick={() => setZone((v) => !v)} className="rounded-full font-bold px-5 min-h-12 text-lg"
          style={{ ...edge(zone ? ND.cobalt : '#fffaf0'), color: zone ? '#ffffff' : ND.ink }}>
          {zone ? 'Hide the clean core' : 'Show the clean core'}
        </button>
        <span className="text-sm font-semibold max-w-[40rem]" style={{ color: ND.quiet }}>
          The dashed parts are the clean core: the same in every theme, plain, high contrast, nothing taped or tilted over them. Everything else is a theme's to change.
        </span>
      </div>
      <div className="grid wide:grid-cols-2 gap-5">
        <Mock tag="Classic" edges={<ClassicEdges still={still} />} skin={classicSkin} zone={zone}
          label="Classic, made by hand: cut construction paper, tape, crayon doodles, crayon power-ups at the edges. The board zone and question stay plain." />
        <Mock tag="Example kid theme" edges={<KidEdges still={still} />} skin={kidSkin} zone={zone}
          label="Example kid theme (drawn in code): a crayon drawing with clay pieces. Same core, so every theme reads the same way." />
      </div>
    </div>
  );
}

