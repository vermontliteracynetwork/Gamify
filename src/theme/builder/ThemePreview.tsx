import { Star } from '@phosphor-icons/react';
import { backdropStyle, pieceFill, pieceImage } from '../library';
import { PICTURES } from '../../student/pictures';
import PictureBadge from '../../student/PictureBadge';
import { TeamBadge, TeamArt } from '../../engine/TeamBadge';
import type { GameTheme } from '../types';

const TILE_COLORS = ['#f2c27b', '#f6a5c0', '#9fd8f0', '#f7b267', '#fbe38a', '#c9a27e'];

// A small live copy of the game screen wearing the theme being built.
export default function ThemePreview({ theme, gameName }: { theme: GameTheme; gameName: string }) {
  const c = theme.colors;
  return (
    <div className="rounded-panel border-[2.5px] border-border overflow-hidden aspect-[4/3] p-3 grid grid-rows-[auto_1fr] gap-2" style={backdropStyle(theme, false)} aria-label={`Preview of ${theme.name || 'this theme'}`} role="img">
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-xl font-extrabold truncate" style={{ color: c.backgroundText }}>{gameName}</span>
        <span className="px-3 py-1 rounded-pill border-[2px] border-border font-bold text-xs" style={{ background: c.accent, color: c.accentText }}>Play</span>
      </div>
      <div className="min-h-0 flex items-center justify-center">{board(theme)}</div>
    </div>
  );
}

function board(theme: GameTheme) {
  switch (theme.gameId) {
    case 'bakery-match':
      return (
        <div className="grid grid-cols-5 gap-1 p-2 rounded-input border-[2px] border-border h-full aspect-square" style={pieceFill(theme, 'board', '#ffffff')}>
          {Array.from({ length: 25 }, (_, i) => <span key={i} className="rounded-md border-[1.5px] border-border-soft" style={pieceFill(theme, `tile-${(i * 7) % 6}`, TILE_COLORS[(i * 7) % 6])} />)}
        </div>
      );
    case 'four-in-a-row':
      return (
        <div className="grid grid-cols-7 gap-1 p-2 rounded-input border-[2px] border-border h-full aspect-[7/6]" style={pieceFill(theme, 'board', '#a8d8f0')}>
          {Array.from({ length: 42 }, (_, i) => {
            const who = [38, 31, 24, 39].includes(i) ? 1 : [37, 40, 32].includes(i) ? 2 : 0;
            return <span key={i} className="rounded-full border-[1.5px] border-border bg-white overflow-hidden">{who > 0 && <span className="block w-full h-full rounded-full" style={pieceFill(theme, `piece-${who}`, who === 1 ? '#f6a5c0' : '#9fd8f0')} />}</span>;
          })}
        </div>
      );
    case 'sign-in':
      return <div className="grid grid-cols-4 gap-2">{PICTURES.map((p) => <PictureBadge key={p.id} id={p.id} theme={theme} size={44} />)}</div>;
    case 'game-show':
      return (
        <div className="grid grid-cols-4 gap-1.5 w-full">
          <TeamArt.Provider value={Array.from({ length: 10 }, (_, k) => theme.pieces[`team-${k + 1}`]?.image)}>
            <span className="col-span-4 flex gap-1.5 justify-center">{[0, 1, 2, 3].map((k) => <TeamBadge key={k} colorIndex={k} size={30} />)}</span>
          </TeamArt.Provider>
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i} className="aspect-[4/3] rounded-md border-[2px] border-border flex items-center justify-center font-display font-bold" style={pieceFill(theme, i < 4 ? 'card-back' : 'square', '#fdfd94')}>
              {!pieceImage(theme, i < 4 ? 'card-back' : 'square') && (i < 4 ? i + 1 : (i - 3) * 100)}
            </span>
          ))}
          {pieceImage(theme, 'trophy') && <img src={pieceImage(theme, 'trophy')} alt="" className="col-span-4 h-12 justify-self-center object-contain" />}
        </div>
      );
    default:
      return (
        <div className="flex flex-wrap gap-2 justify-center">
          {Array.from({ length: 6 }, (_, i) => pieceImage(theme, 'star')
            ? <img key={i} src={pieceImage(theme, 'star')} alt="" className="w-12 h-12 object-contain" />
            : <Star key={i} weight="fill" size={48} color={theme.pieces.star?.color ?? '#f6c544'} />)}
        </div>
      );
  }
}
