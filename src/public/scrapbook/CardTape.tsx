import { PP } from '../../brand/PaletteProposal';

// One strip of washi tape across the top of a card (owner, 2026-11-26: "keep
// tape" on Home, but "dont put tape on all cards so its more of a pop
// accent"): about one card in three wears it. Same look as the /brand kit Tape.
const ZIG = 'polygon(0% 0%, 100% 0%, 96% 17%, 100% 33%, 96% 50%, 100% 67%, 96% 83%, 100% 100%, 0% 100%, 4% 83%, 0% 67%, 4% 50%, 0% 33%, 4% 17%)';
const TAPES: [string, string][] = [[PP.blush, PP.pink], [PP.butter, PP.lemon], [PP.mint, PP.kelly], [PP.blueCrystal, PP.sky], [PP.lavender, PP.grape], [PP.peach, PP.orange]];
export default function CardTape({ tone = 0, rot = -4 }: { tone?: number; rot?: number }) {
  const [a, b] = TAPES[tone % TAPES.length];
  return (
    <span aria-hidden="true" className="absolute block pointer-events-none z-[3] left-1/2 -top-[15px] w-24 h-[27px] -ml-12" style={{ transform: `rotate(${rot}deg)`, filter: 'drop-shadow(0 2px 0 rgba(29,26,51,0.14))' }}>
      <span className="absolute inset-0" style={{ clipPath: ZIG, background: `repeating-linear-gradient(135deg, ${a} 0 9px, ${b} 9px 12px)` }} />
    </span>
  );
}
