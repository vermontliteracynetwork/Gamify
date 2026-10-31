import { Hamburger, Cat, Dog, Fish, Rocket, Sun, Crown, Heart, IceCream, Microphone, Pizza, Sparkle, Star, Trophy, type Icon } from '@phosphor-icons/react';
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
    case 'match-three':
      // The Classic gems (Puzzle Games Graphics Pack, cleared 2026-10-31).
      return (
        <div className={base} style={{ background: 'linear-gradient(160deg, #cdd7fb, #9fb3f5)' }} aria-hidden="true">
          <div className="absolute inset-[8%] rounded-2xl border-[3px] border-border bg-white grid grid-cols-5 grid-rows-3 gap-[3%] p-[3%]">
            {[0, 1, 2, 3, 4, 5, 0, 5, 3, 1, 2, 1, 4, 0, 3].map((k, i) => (
              <span key={i} className="rounded-lg border-2 border-border-soft flex items-center justify-center" style={{ background: ['#d6e8ff', '#ffd9dc', '#d4f5dc', '#fff4c2', '#eadcff', '#ffe2c7'][k] }}>
                <img src={`/classic/match-three/gem-${k}.webp`} alt="" className="w-4/5 h-4/5 object-contain" draggable="false" />
              </span>
            ))}
          </div>
        </div>
      );
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
      // The Classic lake: wooden boat at the top left, Kenney fish and floor.
      return (
        <div className={base} style={{ background: 'linear-gradient(180deg, #cfe9ff 0 22%, #6cc0e5 22% 60%, #3f8fc4 100%)' }} aria-hidden="true">
          <svg className="absolute" style={{ left: '-8%', top: '2%', width: '42%' }} viewBox="0 -60 320 180">
            <path d="M10 40 L300 40 Q290 90 240 112 L60 112 Q20 90 10 40 Z" fill="#a0683a" stroke="#000" strokeWidth="6" strokeLinejoin="round" />
            <path d="M6 34 L304 34 L300 44 L10 44 Z" fill="#7a4a24" stroke="#000" strokeWidth="6" strokeLinejoin="round" />
            <line x1="250" y1="36" x2="330" y2="-50" stroke="#5b3a1e" strokeWidth="8" strokeLinecap="round" />
          </svg>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 62" preserveAspectRatio="none"><path d="M30 6 Q52 4 62 30" stroke="#000" strokeWidth="0.5" fill="none" /></svg>
          <span className="absolute w-[8%] aspect-square rounded-full border-[2.5px] border-border" style={{ left: '58%', top: '44%', background: '#e5635f' }} />
          {[['seaweed-green-a', 4, 22], ['rock-a', 22, 16], ['seaweed-pink-a', 74, 20], ['rock-b', 86, 14], ['seaweed-orange-a', 56, 18]].map(([n, x, w]) => (
            <img key={n as string} src={`/classic/cast-catch/${n}.svg`} alt="" className="absolute bottom-0 h-auto" style={{ left: `${x}%`, width: `${w}%` }} draggable="false" />
          ))}
          {[['fish-orange', 12, 58, 22, 1], ['fish-blue', 64, 62, 20, -1], ['fish-pink', 38, 74, 18, 1]].map(([n, x, y, w, d]) => (
            <img key={n as string} src={`/classic/cast-catch/${n}.svg`} alt="" className="absolute h-auto" style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, transform: `scaleX(${d})` }} draggable="false" />
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
    case 'bowling':
      // A bowling alley with a real bowling ball (no space look, teacher 2026-10-31).
      return (
        <div className={base} style={{ background: 'linear-gradient(180deg, #f3d9b1, #ed9d75)' }} aria-hidden="true">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <rect x="30" y="22" width="40" height="14" rx="2" fill="#241c3d" stroke="#000" strokeWidth="1" />
            <polygon points="14,100 86,100 64,36 36,36" fill="#9aa3b5" stroke="#000" strokeWidth="1" />
            <polygon points="20,100 80,100 61,36 39,36" fill="#e2b07a" stroke="#000" strokeWidth="1" />
            {[30, 40, 50, 60, 70].map((x) => <line key={x} x1={x} y1="100" x2={50 + (x - 50) * 0.42} y2="36" stroke="#8a5a2b" strokeOpacity="0.3" strokeWidth="0.6" />)}
            {[[50, 50], [45, 44], [55, 44], [40, 39], [50, 39], [60, 39]].map(([x, y], i) => (
              <g key={i} transform={`translate(${x} ${y}) scale(0.7)`}><path d="M0,-11 C1.6,-11 2,-9.6 1.6,-8.2 C1.3,-7.2 1,-6.6 1.7,-5.4 C2.9,-3.6 3.2,-1.8 2.6,-0.4 C2.3,0.2 1.6,0.3 0,0.3 C-1.6,0.3 -2.3,0.2 -2.6,-0.4 C-3.2,-1.8 -2.9,-3.6 -1.7,-5.4 C-1,-6.6 -1.3,-7.2 -1.6,-8.2 C-2,-9.6 -1.6,-11 0,-11 Z" fill="#fbfcf8" stroke="#000" strokeWidth="0.6" /><rect x="-1.25" y="-7.6" width="2.5" height="0.7" fill="#e5635f" /><rect x="-1.4" y="-6.5" width="2.8" height="0.7" fill="#e5635f" /></g>
            ))}
            <image href="/classic/bowling/ball-3.webp" x="40" y="72" width="20" height="20" />
            {[[47, 77, 1.4], [51, 76, 1.4], [49.5, 80.5, 1.7]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#241c3d" opacity="0.85" />)}
          </svg>
        </div>
      );
    case 'road-hop':
      return (
        <div className={base} style={{ background: '#8fe3a0' }} aria-hidden="true">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <rect x="0" y="18" width="100" height="26" fill="#4a4f6a" /><rect x="0" y="56" width="100" height="26" fill="#4a4f6a" />
            <path d="M0 31 H100 M0 69 H100" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.5" strokeDasharray="6 5" />
            {[[8, 21, '#e5635f'], [62, 21, '#6aa9e9'], [30, 59, '#f6c544'], [80, 59, '#c58ce8']].map(([x, y, c], i) => (
              <g key={i} transform={`translate(${x} ${y})`}><rect x="0" y="4" width="18" height="8" rx="3" fill={c as string} stroke="#000" strokeWidth="1" /><circle cx="4" cy="13" r="2.4" fill="#241c3d" /><circle cx="14" cy="13" r="2.4" fill="#241c3d" /></g>
            ))}
            <g transform="translate(50 92) scale(1.1)"><ellipse cx="0" cy="0" rx="9" ry="6.5" fill="#9bd35a" stroke="#000" strokeWidth="1" /><circle cx="-4.5" cy="-6.5" r="3.6" fill="#9bd35a" stroke="#000" strokeWidth="1" /><circle cx="4.5" cy="-6.5" r="3.6" fill="#9bd35a" stroke="#000" strokeWidth="1" /><circle cx="-4.5" cy="-6.5" r="1.9" fill="#fff" /><circle cx="4.5" cy="-6.5" r="1.9" fill="#fff" /><circle cx="-4.2" cy="-6.8" r="1" fill="#241c3d" /><circle cx="4.8" cy="-6.8" r="1" fill="#241c3d" /></g>
            <path d="M50 80 L50 50" stroke="#fdfd94" strokeWidth="2.5" strokeDasharray="2 4" strokeLinecap="round" />
          </svg>
        </div>
      );
    case 'farm-grow':
      return (
        <div className={base} style={{ background: '#bfe6a0' }} aria-hidden="true">
          <div className="absolute inset-x-0 top-0 h-[28%] bg-[#bfe8ff] border-b-[3px] border-border" />
          <svg viewBox="0 0 100 62" className="absolute inset-0 w-full h-full">
            <circle cx="14" cy="9" r="6" fill="#ffd84d" stroke="#000" strokeWidth="1" />
            <path d="M70 18 L82 9 L94 18 V34 H70 Z" fill="#e5635f" stroke="#000" strokeWidth="1.2" strokeLinejoin="round" /><rect x="78" y="24" width="8" height="10" fill="#fbfcf8" stroke="#000" strokeWidth="1" />
            {[[8, 24], [30, 24], [52, 24], [8, 43], [30, 43], [52, 43]].map(([x, y], i) => <rect key={i} x={x} y={y} width="19" height="16" rx="2" fill="#b98a5e" stroke="#000" strokeWidth="1.2" />)}
            {[[17, 36, '#f6c544'], [39, 36, '#e5635f'], [61, 55, '#f39a6b'], [17, 55, '#ffd84d']].map(([x, y, c], i) => <g key={i}><path d={`M${x} ${y} V${(y as number) - 8}`} stroke="#2f7d32" strokeWidth="1.5" /><circle cx={x as number} cy={(y as number) - 9} r="3.4" fill={c as string} stroke="#000" strokeWidth="1" /></g>)}
            <path d="M41 52 Q37 48 36 51 M41 52 Q45 48 46 51" fill="#7cc66a" stroke="#000" strokeWidth="0.8" />
          </svg>
        </div>
      );
    case 'lunch-rush':
      return (
        <div className={base} style={{ background: '#fde2c4' }} aria-hidden="true">
          <div className="absolute inset-x-0 top-0 h-[16%] border-b-[3px] border-border" style={{ background: 'repeating-linear-gradient(90deg, #e5635f 0 10%, #fbfcf8 10% 20%)' }} />
          <div className="absolute inset-x-0 bottom-0 h-[30%] border-t-[3px] border-border" style={{ background: '#ed9d75' }} />
          {[[8, Pizza, '#f6c544'], [38, IceCream, '#f6a5c0'], [68, Hamburger, '#f39a6b']].map(([x, I, c], i) => {
            const S = I as Icon;
            return <span key={i} className="absolute w-[24%] aspect-square rounded-full border-[3px] border-border flex items-center justify-center" style={{ left: `${x}%`, top: '28%', background: c as string }}><S weight="fill" className="w-3/5 h-3/5" color="#241c3d" /></span>;
          })}
          <Heart weight="fill" className="absolute right-[6%] bottom-[8%] w-[14%] h-auto" color="#e5635f" />
        </div>
      );
    case 'bubble-pop':
      // The Classic bubbles (Puzzle Games Graphics Pack, cleared 2026-10-31).
      return (
        <div className={base} style={{ background: 'linear-gradient(180deg, #314677, #22336e)' }} aria-hidden="true">
          {[[6, 4, 0], [24, 4, 1], [42, 4, 1], [60, 4, 2], [78, 4, 3], [15, 30, 0], [33, 30, 3], [51, 30, 2], [69, 30, 4]].map(([x, y, k], i) => (
            <img key={i} src={`/classic/bubble-pop/ball-${k}.webp`} alt="" className="absolute w-[17%] aspect-square object-contain" style={{ left: `${x}%`, top: `${y}%` }} draggable="false" />
          ))}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M50 84 L58 50" stroke="#fff" strokeWidth="2" strokeDasharray="1 4" strokeLinecap="round" /></svg>
          <img src="/classic/bubble-pop/ball-2.webp" alt="" className="absolute w-[17%] aspect-square object-contain" style={{ left: '41.5%', bottom: '6%' }} draggable="false" />
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
    case 'big-screen':
      return <div className={base} style={{ background: 'linear-gradient(160deg, #fdfd94, #ff9a8b)' }} aria-hidden="true"><Scatter icons={[Trophy, Star, Crown, Sparkle, Star, Trophy]} colors={['#fdfd94', '#ffd166', '#fbfcf8', '#b4c4fb', '#ffffff', '#fdfd94']} /></div>;
    case 'sign-in':
      return <div className={base} style={{ background: 'linear-gradient(160deg, #ddfcc6, #b4c4fb)' }} aria-hidden="true"><Scatter icons={[Cat, Dog, Fish, Sun, Rocket, Heart]} colors={['#fdfd94', '#ed9d75', '#b4c4fb', '#ffd166', '#cdd7fb', '#e5635f']} /></div>;
    case 'star-quiz':
    default:
      // The teacher's Classic sky for the Question Tracker (2026-10-31).
      return (
        <div className={base} style={{ background: '#2b3a7a url(/classic/star-quiz/background.webp) center / cover' }} aria-hidden="true">
          {[[8, 14, 22, -12, 1], [62, 8, 26, 10, 2], [80, 52, 16, 18, 3], [30, 50, 30, -6, 4], [52, 34, 14, 24, 5], [6, 66, 18, 8, 6]].map(([x, y, w, r, k], i) => (
            <img key={i} src={`/classic/star-quiz/item-${k}.webp`} alt="" className="absolute h-auto" style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, transform: `rotate(${r}deg)` }} draggable="false" />
          ))}
        </div>
      );
  }
}
