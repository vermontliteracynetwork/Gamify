import { lazy, Suspense, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { CyclingCover } from '../../games/covers';
import { useReducedMotion } from '../../ui/useReducedMotion';
import { useStrength } from './strength';

// The Home hero collage (owner, 2026-11-26: Home in scrapbook strength B, the
// hero "keep entirely"), built to the /brand Scrapbook Home mockup: six real
// game covers (Classic first, no name tags, owner 2026-11-25) on white photo
// mats, a little tilted, two of them taped, over three taped papers, with the
// stickers and the one hand-lettered word at the edges. In strength A nothing
// tilts and nothing is taped. Laptops: two across, three down. Tablets and
// phones: three across, two down, so the hero never leaves a tall empty
// stretch. On a short laptop window the collage shrinks to the screen height.
const COVERS = ['game-show', 'castle-quest', 'match-three', 'four-in-a-row', 'bubble-pop', 'bowling'];
const TILTS = [-3, 2, -1.5, 2.5, -2, 1.5];
const TAPED = [0, 3];
const INK = '#1d1a33';

const art = () => import('./HomeHeroArt');
const Papers = lazy(() => art().then((m) => ({ default: m.CollagePapers })));
const Stickers = lazy(() => art().then((m) => ({ default: m.CollageStickers })));
const Tape = lazy(() => import('../../brand/ScrapbookKit').then((m) => ({ default: m.Tape })));

type Geo = { colW: number; vw: number; vh: number };
function layout({ colW, vw, vh }: Geo) {
  const wide = vw >= 1024, phone = vw < 640;
  // Spaced out (owner 2026-11-26: "space out the hero section (right images and stickers)"):
  // wider gaps between covers and more room around them for the stickers.
  const cols = wide ? 2 : 3, rows = 6 / cols, gap = phone ? 14 : wide ? 30 : 22, frac = wide ? 0.74 : 0.84, fill = wide ? 0.78 : 0.72;
  let gw = colW * frac;
  let cw = (gw - (cols - 1) * gap) / cols, ch = cw * 0.9;
  let gh = rows * ch + (rows - 1) * gap, boxH = gh / fill, bw = colW;
  // Short laptop windows (1190 x 540): fit the screen height.
  const maxH = Math.max(420, vh - 110);
  if (wide && boxH > maxH) {
    boxH = maxH; gh = boxH * fill; ch = (gh - (rows - 1) * gap) / rows; cw = ch / 0.9;
    gw = cols * cw + (cols - 1) * gap; bw = gw / frac;
  }
  // Sticker sizes follow the collage (the mockup's sizes at a 570px laptop column, a 350px phone).
  const k = phone ? Math.min(1.4, bw / 350) : Math.max(0.62, Math.min(1.05, bw / 570));
  return { cols, gap, cw, ch, gw, gh, boxH, bw, k, phone, tablet: !wide && !phone, mat: phone ? 4 : 7 };
}

export default function HomeCollage() {
  const ref = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<Geo | null>(null);
  const strength = useStrength();
  const reduce = useReducedMotion();
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const fit = () => setGeo({ colW: el.clientWidth, vw: window.innerWidth, vh: window.innerHeight });
    fit();
    const ro = new ResizeObserver(fit); ro.observe(el);
    window.addEventListener('resize', fit);
    return () => { ro.disconnect(); window.removeEventListener('resize', fit); };
  }, []);
  const g = geo && geo.colW > 0 ? layout(geo) : null;
  const tilted = strength !== 'A';
  return (
    <div ref={ref} aria-hidden="true" className="w-full min-w-0">
      {g && (
        <div className="relative mx-auto" style={{ width: g.bw, height: g.boxH }}>
          <Suspense fallback={null}><Papers phone={g.phone} /></Suspense>
          <div className="absolute grid" style={{ left: (g.bw - g.gw) / 2, top: (g.boxH - g.gh) / 2, gridTemplateColumns: `repeat(${g.cols}, ${g.cw}px)`, gap: g.gap }}>
            {COVERS.map((id, i) => {
              const rot = tilted ? TILTS[i] : 0;
              return (
                <motion.div key={id} data-card className="relative bg-white box-border" style={{ width: g.cw, height: g.ch, padding: g.mat, borderRadius: 14, border: `2.5px solid ${INK}`, boxShadow: '0 4px 0 rgba(29,26,51,0.2)' }}
                  initial={reduce ? false : { opacity: 0, y: 20, rotate: rot }} animate={{ opacity: 1, y: 0, rotate: rot }} transition={{ delay: reduce ? 0 : 0.08 * i }}
                  whileHover={reduce ? undefined : { y: -8, scale: 1.04, rotate: 0, transition: { type: 'spring', stiffness: 400, damping: 14 } }}>
                  <CyclingCover gameId={id} className="w-full h-full rounded-[8px]" />
                  {tilted && TAPED.includes(i) && <Suspense fallback={null}><Tape tone={i + 1} w={g.cw * 0.38} rot={-5} style={{ left: '50%', top: -10, marginLeft: -(g.cw * 0.38) / 2 }} /></Suspense>}
                </motion.div>
              );
            })}
          </div>
          <Suspense fallback={null}><Stickers bw={g.bw} boxH={g.boxH} phone={g.phone} tablet={g.tablet} k={g.k} /></Suspense>
        </div>
      )}
    </div>
  );
}
