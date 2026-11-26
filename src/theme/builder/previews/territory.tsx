import { CatArt, MouseArt, PoofArt, RoomArt } from '../../../games/territory/art';
import { pieceImage } from '../../library';
import { pieceFor } from '../../../games/territory/looks';
import type { GameTheme } from '../../types';

// Territory's room as the game draws it, wearing the theme: its room picture
// and entrance, its three defenders and three invaders, one invader caught in
// the poof. With no defenders or invaders uploaded, Classic's three cats and
// mice; with one or two uploaded, only those, repeated, never mixed with
// Classic's (teacher, 2026-11-24: "if only one of each is uploaded, just have
// those only"), as the game picks them (pieceFor). The door and room keep
// Classic's when empty (the same places as the Classic cover in src/games/covers.tsx).
const DEFENDERS = [[30, 84, 20], [48, 90, 22], [16, 92, 21]] as const;
const INVADERS = [[72, 74], [86, 84], [62, 88]] as const;

export default function TerritoryPreview({ theme }: { theme: GameTheme }) {
  const piece = 'absolute -translate-x-1/2 -translate-y-full';
  return (
    <div className="relative rounded-panel border-bold border-border overflow-hidden aspect-[4/3]" role="img" aria-label={`Preview of ${theme.name || 'this theme'}`}>
      <RoomArt background={pieceImage(theme, 'background')} entrance={pieceImage(theme, 'entrance')} className="absolute inset-0">
        {DEFENDERS.map(([x, y, h], k) => {
          const own = pieceFor(theme, 'defender', k);
          const at = { left: `${x}%`, top: `${y}%`, height: `${h}%` };
          return own.img ? <img key={k} src={own.img} alt="" className={`${piece} w-auto object-contain`} style={at} draggable="false" /> : <CatArt key={k} look={[0, 1, 2][own.look]} className={piece} style={{ ...at, width: 'auto' }} />;
        })}
        {INVADERS.map(([x, y], k) => {
          const own = pieceFor(theme, 'invader', k);
          const at = { left: `${x}%`, top: `${y}%`, height: '16%' };
          return own.img ? <img key={k} src={own.img} alt="" className={`${piece} w-auto object-contain`} style={at} draggable="false" /> : <MouseArt key={k} look={own.look} className={piece} style={{ ...at, width: 'auto' }} />;
        })}
        <PoofArt className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: '60%', top: '70%', height: '18%', width: 'auto' }} />
      </RoomArt>
    </div>
  );
}
