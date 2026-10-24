import { Cake, Cat, Cookie, Dog, Fish, Rocket, Sun, Crown, Heart, IceCream, Microphone, Pizza, Popcorn, Sparkle, Star, Trophy, type Icon } from '@phosphor-icons/react';
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
        <div className={base} style={{ containerType: 'inline-size', background: 'repeating-conic-gradient(from 0deg at 50% 110%, #ffcf5c 0deg 10deg, #ff9f68 10deg 20deg)' }} aria-hidden="true">
          <div className="absolute inset-x-[14%] bottom-[10%] top-[18%] grid grid-cols-3 gap-[4%]">
            {['100', '200', '300', '★', '?', '+50'].map((v, i) => (
              <span key={i} className="rounded-xl border-[3px] border-border bg-white flex items-center justify-center font-display text-[clamp(9px,8cqw,30px)]"
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
    case 'cast-catch':
      return (
        <div className={base} style={{ background: 'linear-gradient(180deg, #cfe9ff 0 30%, #5aa9d6 30% 100%)' }} aria-hidden="true">
          <span className="absolute left-0 bottom-0 w-[26%] h-[40%] border-t-[3px] border-r-[3px] border-border rounded-tr-xl" style={{ background: '#b98552' }} />
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 62" preserveAspectRatio="none"><line x1="14" y1="40" x2="30" y2="10" stroke="#000" strokeWidth="1.4" /><path d="M30 10 Q55 8 66 34" stroke="#000" strokeWidth="0.5" fill="none" /></svg>
          <span className="absolute w-[9%] aspect-square rounded-full border-[2.5px] border-border" style={{ left: '62%', top: '50%', background: '#e5635f' }} />
          {[[30, 66, '#f2d16b', '#e07a3a', 1], [72, 72, '#3f6fd6', '#f2d14b', -1], [48, 82, '#f3803a', '#ffffff', 1]].map(([x, y, body, fin, dir], i) => (
            <svg key={i} className="absolute w-[22%] h-auto" style={{ left: `${x}%`, top: `${y}%`, transform: `scaleX(${dir})` }} viewBox="0 0 100 60">
              <path d="M78 30 L98 12 L94 30 L98 48 Z" fill={fin as string} stroke="#000" strokeWidth="3" /><ellipse cx="44" cy="30" rx="38" ry="22" fill={body as string} stroke="#000" strokeWidth="3" /><circle cx="20" cy="25" r="4" fill="#000" />
            </svg>
          ))}
        </div>
      );
    case 'memory-match':
      return (
        <div className={base} style={{ containerType: 'inline-size', background: 'linear-gradient(160deg, #ddfcc6, #b4c4fb)' }} aria-hidden="true">
          <div className="absolute inset-[10%] grid grid-cols-4 gap-[4%]">
            {['?', '', 'cat', '', '', '2+2', '', '4'].map((v, i) => (
              <span key={i} className="rounded-lg border-[2.5px] border-border flex items-center justify-center font-display text-[clamp(8px,4cqw,22px)]" style={{ background: v ? (i % 2 ? '#fdfd94' : '#fbfcf8') : '#b4c4fb', transform: `rotate(${(i % 3) - 1}deg)` }}>{v}</span>
            ))}
          </div>
        </div>
      );
    case 'flashcards':
      return (
        <div className={base} style={{ containerType: 'inline-size', background: 'linear-gradient(160deg, #fdfd94, #ed9d75)' }} aria-hidden="true">
          {[[18, 22, -8, '#fbfcf8', ''], [28, 18, 4, '#fbfcf8', ''], [36, 24, -2, '#fbfcf8', '2 + 3 = ?']].map(([x, y, r, bg, txt], i) => (
            <span key={i} className="absolute w-[50%] aspect-[8/5] rounded-xl border-[3px] border-border flex items-center justify-center font-display text-[clamp(10px,7cqw,34px)]" style={{ left: `${x}%`, top: `${y}%`, transform: `rotate(${r}deg)`, background: bg as string }}>{txt}</span>
          ))}
        </div>
      );
    case 'match-up':
      return (
        <div className={base} style={{ containerType: 'inline-size', background: 'linear-gradient(160deg, #b4c4fb, #ddfcc6)' }} aria-hidden="true">
          <div className="absolute inset-[10%] grid grid-cols-2 gap-x-[18%] gap-y-[6%]">
            {['3 + 4', '7', 'cat', 'animal', 'red', 'color'].map((v, i) => (
              <span key={i} className="rounded-lg border-[2.5px] border-border flex items-center justify-center font-display text-[clamp(8px,5cqw,24px)]" style={{ background: i % 2 ? '#fdfd94' : '#fbfcf8' }}>{v}</span>
            ))}
          </div>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 62" preserveAspectRatio="none"><path d="M42 14 L58 14 M42 31 L58 31 M42 48 L58 48" stroke="#000" strokeWidth="1.5" strokeDasharray="3 2" /></svg>
        </div>
      );
    case 'bubble-pop':
      return (
        <div className={base} style={{ background: 'linear-gradient(180deg, #314677, #22336e)' }} aria-hidden="true">
          {[[6, 4, '#fdfd94', Star], [24, 4, '#e5635f', Heart], [42, 4, '#e5635f', Heart], [60, 4, '#8fe3a0', Sparkle], [78, 4, '#8ec5ff', Fish], [15, 30, '#fdfd94', Star], [33, 30, '#8ec5ff', Fish], [51, 30, '#8fe3a0', Sparkle], [69, 30, '#f6a5c0', Heart]].map(([x, y, c, I], i) => {
            const S = I as Icon;
            return <span key={i} className="absolute w-[17%] aspect-square rounded-full border-[3px] border-border flex items-center justify-center" style={{ left: `${x}%`, top: `${y}%`, background: c as string }}><S weight="fill" className="w-3/5 h-3/5" color="#241c3d" /></span>;
          })}
          <span className="absolute w-[17%] aspect-square rounded-full border-[3px] border-border flex items-center justify-center" style={{ left: '41.5%', bottom: '6%', background: '#8fe3a0' }}><Sparkle weight="fill" className="w-3/5 h-3/5" color="#241c3d" /></span>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M50 84 L58 50" stroke="#fff" strokeWidth="2" strokeDasharray="1 4" strokeLinecap="round" /></svg>
        </div>
      );
    case 'peg-drop':
      return (
        <div className={base} style={{ background: 'linear-gradient(180deg, #314677, #22336e)' }} aria-hidden="true">
          {Array.from({ length: 4 }, (_, r) => Array.from({ length: r % 2 ? 6 : 5 }, (_, k) => (
            <span key={`${r}-${k}`} className="absolute w-[5%] aspect-square rounded-full bg-[#fbfcf8] border-2 border-border" style={{ left: `${(r % 2 ? k : k + 0.5) * 16 + 6}%`, top: `${14 + r * 16}%` }} />
          )))}
          <span className="absolute w-[10%] aspect-square rounded-full border-[3px] border-border" style={{ left: '44%', top: '4%', background: '#fdfd94' }} />
          <div className="absolute inset-x-0 bottom-0 h-[20%] grid grid-cols-5">
            {['50', '10', '100', '10', '50'].map((v, i) => <span key={i} className="border-t-[3px] border-x border-border flex items-center justify-center font-display text-[clamp(8px,3vw,20px)]" style={{ background: v === '100' ? '#ed9d75' : v === '50' ? '#ddfcc6' : '#fbfcf8' }}>{v}</span>)}
          </div>
        </div>
      );
    case 'sign-in':
      return <div className={base} style={{ background: 'linear-gradient(160deg, #ddfcc6, #b4c4fb)' }} aria-hidden="true"><Scatter icons={[Cat, Dog, Fish, Sun, Rocket, Heart]} colors={['#fdfd94', '#ed9d75', '#b4c4fb', '#ffd166', '#cdd7fb', '#e5635f']} /></div>;
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
