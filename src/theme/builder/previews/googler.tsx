import { backdropStyle, pieceFill, pieceImage } from '../../library';
import type { GameTheme } from '../../types';
import { CrayonBlock, EYES, INK } from '../../../games/googler/art';
import { SHAPES } from '../../../games/googler/googler';

// Googler's play screen, still: every shape's block in the stack (each one
// themed on its own), googly eyes in a few, and the eye counter beside it.
const STACK = ['........', '........', '..2.....', '.222..5.', '00003355', '1166.355', '14466654'];
const EYED = new Set(['4-1', '5-6', '6-3']);

export default function GooglerPreview({ theme }: { theme: GameTheme }) {
  return (
    <div className="relative rounded-panel border-bold border-border overflow-hidden aspect-[4/3] flex items-center justify-center gap-[3%] p-[3%]" style={backdropStyle(theme, false)} role="img" aria-label={`Preview of ${theme.name || 'this theme'}`}>
      <div className="relative h-full aspect-[8/7] rounded-input" style={{ ...pieceFill(theme, 'board', '#fffaf0'), border: `3px solid ${INK}`, boxShadow: `0 4px 0 ${INK}` }}>
        {STACK.flatMap((row, r) => row.split('').map((ch, c) => {
          if (ch === '.') return null;
          const k = Number(ch);
          const art = pieceImage(theme, `block-${SHAPES[k].id}`);
          return (
            <span key={`${r}-${c}`} className="absolute" style={{ left: `${c * 12.5}%`, top: `${(r / 7) * 100}%`, width: '12.5%', height: `${100 / 7}%` }}>
              {art ? <img src={art} alt="" className="w-full h-full object-cover" /> : <CrayonBlock shape={k} seed={r + c} className="w-full h-full" />}
              {EYED.has(`${r}-${c}`) && <img src={EYES[(r + c) % 5]} alt="" className="absolute inset-[14%] w-[72%] h-[72%]" />}
            </span>
          );
        }))}
      </div>
      <div className="h-full w-[12%] rounded-input bg-[#fffaf0] grid content-evenly justify-items-center" style={{ border: `3px solid ${INK}` }}>
        {[0, 1, 2, 3, 4].map((i) => <span key={i} className="w-[70%] aspect-square rounded-full grid place-items-center" style={{ border: `2px ${i < 2 ? 'solid' : 'dashed'} ${INK}`, background: i < 2 ? '#fff1b8' : 'transparent' }}>{i < 2 && <img src={EYES[i]} alt="" className="w-[90%] h-[90%]" />}</span>)}
      </div>
    </div>
  );
}
