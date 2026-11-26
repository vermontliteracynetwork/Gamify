import { PP } from '../../brand/PaletteProposal';
import { Bit, HandWord, Paper, PowerSticker, SchoolSticker, Sprinkle } from '../../brand/ScrapbookKit';
import { t } from '../../i18n';

// The Home hero's scrapbook pieces (owner, 2026-11-26: Home in strength B,
// hero "keep entirely"; stickers only in the hero). Drawn exactly as the /brand
// Scrapbook Home mockup (HomeCollage in src/brand/ScrapbookDirection.tsx): three
// taped papers behind the covers, two crayon power-up stickers, the school bus,
// the one hand-lettered word and a few crayon stars. Loaded after the covers,
// so the page's first paint is the real game covers. All decorative.

export type CollageBox = { bw: number; boxH: number; phone: boolean; k: number };

/** The papers behind the covers. */
export function CollagePapers() {
  return (
    <>
      <Paper id="gingham" seed={2} tilt={-4} tape={{ tone: 0, at: 'tl' }} style={{ left: '0%', top: '2%', width: '60%', height: '48%' }} />
      <Paper id="stripes" seed={3} tilt={3} tape={{ tone: 2, at: 'tr' }} style={{ right: '0%', top: '12%', width: '54%', height: '46%' }} />
      <Paper id="stars" seed={4} tilt={-2} tape={{ tone: 3, at: 'top' }} style={{ left: '12%', bottom: '0%', width: '66%', height: '40%' }} />
    </>
  );
}

/** The stickers, the hand-lettered word and the stars over the covers' edges. */
export function CollageStickers({ bw, boxH, phone, k }: CollageBox) {
  const s = (ph: number, desk: number) => Math.round((phone ? ph : desk) * k);
  return (
    <>
      <Bit style={{ left: '-3%', top: '-3%' }} tilt={-8}><PowerSticker id="double-points" size={s(64, 104)} /></Bit>
      <Bit style={{ right: '-3%', top: '40%' }} tilt={7}><PowerSticker id="magnet" size={s(56, 92)} /></Bit>
      <Bit style={{ right: '4%', bottom: '-2%' }} tilt={-5}><SchoolSticker kind="bus" size={s(60, 96)} /></Bit>
      <Bit style={{ left: '-2%', bottom: '2%' }} tilt={-6}><HandWord text={t('public.hero.word')} size={s(30, 46)} /></Bit>
      <Sprinkle spots={[[bw * 0.46, -10, s(18, 26), PP.lemon], [bw * 0.94, boxH * 0.1, s(14, 20), PP.pink], [bw * 0.02, boxH * 0.55, s(15, 22), PP.sky], [bw * 0.55, boxH - 18, s(13, 18), PP.kelly, 'dot'], [bw * 0.86, boxH * 0.82, s(15, 22), PP.lemon]]} />
    </>
  );
}

/** The pencil and two stars in the page's left margin, on wide screens only (1300px and up). */
export function HeroMargin() {
  return (
    <div aria-hidden="true" className="hidden min-[1300px]:block absolute top-0 bottom-0 pointer-events-none" style={{ left: 'calc(50% - 50vw)', width: '100vw' }}>
      <Bit style={{ left: 'max(0.25rem, calc((50vw - 36rem - 7.5rem) / 2))', top: 360 }} tilt={-5}><SchoolSticker kind="pencil" size={92} /></Bit>
      <Sprinkle spots={[[30, 560, 24, PP.lemon], [96, 640, 18, PP.pink]]} />
    </div>
  );
}
