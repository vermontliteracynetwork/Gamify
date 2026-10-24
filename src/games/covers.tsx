import { Cake, Cookie, Crown, Heart, IceCream, Microphone, Pizza, Popcorn, Sparkle, Star, Trophy, type Icon } from '@phosphor-icons/react';
import { TEAM_COLORS } from '../engine/turns';

// Cover art for each game, drawn in code (no bought art), so every game card
// and welcome screen has a picture a pre-reader recognizes. Class-made and
// library covers can replace these through the Theme Builder.

function Scatter({ icons, colors }: { icons: Icon[]; colors: string[] }) {
  const spots = [[8, 14, -12], [70, 8, 10], [40, 52, -6], [78, 58, 14], [14, 62, 8], [52, 6, -16]];
  return (
    <>
      {spots.map(([x, y, r], i) => {
        const I = icons[i % icons.length];
        return (
          <span key={i} className="absolute rounded-full border-[3px] border-border flex items-center justify-center"
            style={{ left: `${x}%`, top: `${y}%`, width: '22%', aspectRatio: '1', transform: `rotate(${r}deg)`, background: colors[i % colors.length] }}>
            <I weight="fill" className="w-3/5 h-3/5" color="#241c3d" />
          </span>
        );
      })}
    </>
  );
}

export function GameCover({ gameId, className = '' }: { gameId: string; className?: string }) {
  const base = `relative overflow-hidden ${className}`;
  switch (gameId) {
    case 'game-show':
      return (
        <div className={base} style={{ background: 'repeating-conic-gradient(from 0deg at 50% 110%, #ffcf5c 0deg 10deg, #ff9f68 10deg 20deg)' }} aria-hidden="true">
          <div className="absolute inset-x-[14%] bottom-[10%] top-[18%] grid grid-cols-3 gap-[4%]">
            {['100', '200', '300', '★', '?', '+50'].map((v, i) => (
              <span key={i} className="rounded-xl border-[3px] border-border bg-white flex items-center justify-center font-display font-bold text-[clamp(14px,3vw,30px)]"
                style={{ background: i % 2 ? '#fff4c2' : '#ffffff' }}>{v}</span>
            ))}
          </div>
          <Microphone weight="fill" className="absolute right-[4%] top-[6%] w-[18%] h-auto drop-shadow" color="#241c3d" />
          <Trophy weight="fill" className="absolute left-[4%] top-[6%] w-[14%] h-auto" color="#241c3d" />
        </div>
      );
    case 'bakery-match':
      return <div className={base} style={{ background: 'linear-gradient(160deg, #ffe3c2, #f6a5c0)' }} aria-hidden="true"><Scatter icons={[Cookie, Cake, IceCream, Pizza, Popcorn]} colors={['#f2c27b', '#f6a5c0', '#9fd8f0', '#f7b267', '#fbe38a']} /></div>;
    case 'four-in-a-row':
      return (
        <div className={base} style={{ background: 'linear-gradient(160deg, #a8d8f0, #6aa9e9)' }} aria-hidden="true">
          <div className="absolute inset-[10%] rounded-2xl border-[3px] border-border grid grid-cols-5 gap-[4%] p-[4%]" style={{ background: '#4f8fd6' }}>
            {Array.from({ length: 15 }, (_, i) => {
              const diag = [2, 6, 10, 14].includes(i) ? 1 : [5, 11, 12].includes(i) ? 2 : 0;
              return <span key={i} className="rounded-full border-[2.5px] border-border flex items-center justify-center"
                style={{ background: diag === 1 ? TEAM_COLORS[0] : diag === 2 ? TEAM_COLORS[1] : '#ffffff' }}>
                {diag === 1 && <Star weight="fill" className="w-1/2 h-1/2" color="#241c3d" />}
                {diag === 2 && <Heart weight="fill" className="w-1/2 h-1/2" color="#241c3d" />}
              </span>;
            })}
          </div>
          <Crown weight="fill" className="absolute right-[3%] top-[2%] w-[14%] h-auto" color="#241c3d" />
        </div>
      );
    case 'star-quiz':
    default:
      return (
        <div className={base} style={{ background: 'radial-gradient(circle at 30% 20%, #3b3a8f, #15143a)' }} aria-hidden="true">
          {[[12, 20, 14], [60, 12, 20], [80, 50, 12], [30, 60, 24], [52, 40, 10], [8, 72, 10]].map(([x, y, s], i) => (
            <Star key={i} weight="fill" className="absolute" style={{ left: `${x}%`, top: `${y}%`, width: `${s}%`, height: 'auto' }} color="#ffd166" />
          ))}
          <Sparkle weight="fill" className="absolute right-[8%] bottom-[10%] w-[12%] h-auto" color="#ffffff" />
        </div>
      );
  }
}
