import { CatArt, MouseArt, PoofArt, RoomArt } from '../../../games/territory/art';
import { pieceImage } from '../../library';
import type { GameTheme } from '../../types';

// Territory's room as the game draws it, wearing the theme: its room picture
// and entrance, its three defenders and three invaders, one invader caught in
// the poof. Empty pieces keep Classic's cats, mice, door and room (the same
// places as the Classic cover in src/games/covers.tsx).
const DEFENDERS = [[30, 84, 20], [48, 90, 22], [16, 92, 21]] as const;
const INVADERS = [[72, 74], [86, 84], [62, 88]] as const;

export default function TerritoryPreview({ theme }: { theme: GameTheme }) {
  const piece = 'absolute -translate-x-1/2 -translate-y-full';
  return (
    <div className="relative rounded-panel border-bold border-border overflow-hidden aspect-[4/3]" role="img" aria-label={`Preview of ${theme.name || 'this theme'}`}>
      <RoomArt background={pieceImage(theme, 'background')} entrance={pieceImage(theme, 'entrance')} className="absolute inset-0">
        {DEFENDERS.map(([x, y, h], k) => {
          const own = pieceImage(theme, `defender-${k + 1}`);
          const at = { left: `${x}%`, top: `${y}%`, height: `${h}%` };
          return own ? <img key={k} src={own} alt="" className={`${piece} w-auto object-contain`} style={at} draggable="false" /> : <CatArt key={k} look={[0, 3, 5][k]} className={piece} style={{ ...at, width: 'auto' }} />;
        })}
        {INVADERS.map(([x, y], k) => {
          const own = pieceImage(theme, `invader-${k + 1}`);
          const at = { left: `${x}%`, top: `${y}%`, height: '16%' };
          return own ? <img key={k} src={own} alt="" className={`${piece} w-auto object-contain`} style={at} draggable="false" /> : <MouseArt key={k} look={k} className={piece} style={{ ...at, width: 'auto' }} />;
        })}
        <PoofArt className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: '60%', top: '70%', height: '18%', width: 'auto' }} />
      </RoomArt>
    </div>
  );
}
