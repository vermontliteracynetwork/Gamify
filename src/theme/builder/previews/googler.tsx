import { backdropStyle, pieceFill, pieceImage } from '../../library';
import type { GameTheme } from '../../types';
import { CrayonBlock, INK, StillEye } from '../../../games/googler/art';
import { SHAPES } from '../../../games/googler/googler';

// Googler's play screen, still, as it plays now (2026-11-26): the eye bar
// with XP on top, every shape's block in the stack (each themed on its own),
// googly eyes alone in their cells with no block behind them.
const STACK = ['........', '........', '..2.....', '.222..5.', '0e003355', '1166.3e5', '144e6654'];

export default function GooglerPreview({ theme }: { theme: GameTheme }) {
  return (
    <div className="relative rounded-panel border-bold border-border overflow-hidden aspect-[4/3] flex flex-col items-center justify-center gap-[3%] p-[3%]" style={backdropStyle(theme, false)} role="img" aria-label={`Preview of ${theme.name || 'this theme'}`}>
      <div className="h-[12%] w-[62%] rounded-full bg-[#fffaf0] flex items-center gap-[3%] px-[4%]" style={{ border: `3px solid ${INK}`, boxShadow: `0 3px 0 ${INK}` }}>
        {[0, 1, 2, 3, 4, 5].map((i) => <span key={i} className="h-[62%] aspect-square rounded-full grid place-items-center" style={{ border: `2px ${i < 2 ? 'solid' : 'dashed'} ${i < 2 ? INK : 'rgba(29,26,51,0.4)'}`, background: i < 2 ? '#fff1b8' : 'transparent' }}>{i < 2 && <StillEye className="w-[94%]" />}</span>)}
        <span className="ml-auto font-display text-2xl leading-none" style={{ color: INK }}>70<span className="text-xs font-bold">XP</span></span>
      </div>
      <div className="relative flex-1 min-h-0 aspect-[8/7] rounded-input" style={{ ...pieceFill(theme, 'board', '#fffaf0'), border: `3px solid ${INK}`, boxShadow: `0 4px 0 ${INK}` }}>
        {STACK.flatMap((row, r) => row.split('').map((ch, c) => {
          if (ch === '.') return null;
          const box = { left: `${c * 12.5}%`, top: `${(r / 7) * 100}%`, width: '12.5%', height: `${100 / 7}%` };
          if (ch === 'e') return <span key={`${r}-${c}`} className="absolute grid place-items-center" style={box}><StillEye look={[0.5, -0.4]} className="w-[84%]" /></span>;
          const k = Number(ch);
          const art = pieceImage(theme, `block-${SHAPES[k].id}`);
          return <span key={`${r}-${c}`} className="absolute" style={box}>{art ? <img src={art} alt="" className="w-full h-full object-cover" /> : <CrayonBlock shape={k} seed={r + c} className="w-full h-full" />}</span>;
        }))}
      </div>
    </div>
  );
}
