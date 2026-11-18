import { FoodFace, foodBg, GuestArt, OrderBubble } from '../../../games/lunch-rush/art';
import { FOODS, PATIENCE, SEATS, type Food } from '../../../games/lunch-rush/lunch';
import { backdropStyle, pieceColor, pieceFill, pieceImage } from '../../library';
import type { GameTheme } from '../../types';

// Lunch Rush as play draws it (teacher, 2026-11-16): the wall and its
// awning, three guests at the counter with their orders, and the four food
// buttons under it. Built from the game's own art, so blanks look Classic.
const GUESTS: { food: Food; patience: number; look: number }[] = [
  { food: 'pizza', patience: PATIENCE, look: 0 },
  { food: 'icecream', patience: 3, look: 3 },
  { food: 'burger', patience: 2, look: 1 },
];

export default function LunchRushPreview({ theme }: { theme: GameTheme }) {
  const wall = pieceImage(theme, 'background');
  const guestPics = [1, 2, 3].map((n) => pieceImage(theme, `guest-${n}`)).filter((x): x is string => !!x);
  return (
    <div className="relative rounded-panel border-bold border-border overflow-hidden aspect-[4/3] p-[3%] grid grid-rows-[1fr_auto] gap-[3%] [container-type:size]" style={backdropStyle(theme, false)}
      role="img" aria-label={`Preview of ${theme.name || 'this theme'}`}>
      <div className="relative min-h-0 h-full mx-auto aspect-[1.5] max-w-full rounded-[14px] border-bold border-border overflow-hidden" style={pieceFill(theme, 'background', '#fde2c4')}>
        {!wall && <div className="absolute inset-x-0 top-0 h-[14%] border-b-[2.5px] border-border" style={{ background: 'repeating-linear-gradient(90deg, #e5635f 0 8%, #fbfcf8 8% 16%)' }} />}
        <div className="absolute inset-x-0 bottom-0 h-[26%] border-t-[2.5px] border-border" style={{ background: pieceColor(theme, 'counter', '#ed9d75') }} />
        {GUESTS.map((g, i) => (
          <div key={i} className="absolute bottom-[18%] h-[72%] flex flex-col items-center justify-end gap-[5%] [&_.rounded-panel]:!rounded-[10px] [&_.rounded-panel]:!border-thin [&_.rounded-panel>span:first-child]:!border-thin"
            style={{ left: `${(i / SEATS) * 100 + 2}%`, width: `${100 / SEATS - 4}%` }}>
            <OrderBubble theme={theme} food={g.food} patience={g.patience} served={false} />
            {guestPics.length ? <img src={guestPics[g.look % guestPics.length]} alt="" className="w-[78%] h-auto block object-contain" /> : <GuestArt look={g.look} happy={false} worried={g.patience <= 2} />}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-[2%] mx-auto w-full" style={{ maxWidth: 'calc((100cqh - 6cqh) * 0.82 * 1.5)' }}>
        {FOODS.map((f) => (
          <span key={f} className="h-[13cqh] rounded-[10px] border-std border-border grid place-items-center" style={{ ...foodBg(theme, f), boxShadow: '0 3px 0 #000' }}>
            <span className="h-[80%] aspect-square grid place-items-center"><FoodFace theme={theme} food={f} /></span>
          </span>
        ))}
      </div>
    </div>
  );
}
