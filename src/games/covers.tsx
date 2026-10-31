import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { houseFor } from '../theme/house';
import type { GameTheme } from '../theme/types';
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
      // A match happening (teacher, 2026-10-31: "more match 3 game related"):
      // three hearts in a row glow and burst, a gem swaps in with an arrow,
      // and points pop up.
      return (
        <div className={base} style={{ background: 'radial-gradient(circle at 50% 40%, #9b7be0, #4b2f8f 75%)' }} aria-hidden="true">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice">
            <g transform="rotate(-8 50 31)">
              <rect x="14" y="2" width="72" height="58" rx="5" fill="#ffffff" stroke="#000" strokeWidth="1.2" />
              {[[0, 2, 4, 3, 5], [3, 1, 1, 1, 0], [5, 4, 2, 0, 3], [2, 0, 5, 4, 1]].map((row, r) => row.map((k, c) => {
                const x = 17 + c * 13.5, y = 5 + r * 13.6;
                const lit = r === 1 && c >= 1 && c <= 3;
                return (
                  <g key={`${r}-${c}`}>
                    <rect x={x} y={y} width="12.5" height="12.5" rx="2.5" fill={lit ? '#fdfd94' : ['#d6e8ff', '#ffd9dc', '#d4f5dc', '#fff4c2', '#eadcff', '#ffe2c7'][k]} stroke={lit ? '#000' : '#c9d3ee'} strokeWidth={lit ? 0.9 : 0.5} />
                    <image href={`/classic/match-three/gem-${k}.webp`} x={x + 1.5} y={y + 1.5} width="9.5" height="9.5" />
                  </g>
                );
              }))}
              {/* The swap: an arrow from the gem that just moved in. */}
              <path d="M 37 47 Q 42 40 44 33" fill="none" stroke="#000" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M 37 47 Q 42 40 44 33" fill="none" stroke="#fdfd94" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M 41.5 34.5 L 44.5 31.5 L 46 35.5 Z" fill="#fdfd94" stroke="#000" strokeWidth="0.6" />
            </g>
            {/* Sparkles bursting from the match, and the points. */}
            {[[30, 12, 4], [66, 10, 3.4], [76, 24, 2.6], [24, 26, 2.4], [50, 6, 3]].map(([x, y, r], i) => (
              <path key={i} d={`M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3} Z`} fill="#fdfd94" stroke="#000" strokeWidth="0.5" />
            ))}
            <text x="82" y="16" textAnchor="middle" fontSize="9" fontWeight="900" fill="#fdfd94" stroke="#000" strokeWidth="1.4" paintOrder="stroke" transform="rotate(10 82 16)">+30</text>
          </svg>
        </div>
      );
    case 'four-in-a-row':
      // Drawn in one SVG so the holes stay perfect circles at any card shape (teacher, 2026-10-31).
      return (
        <div className={base} style={{ background: 'linear-gradient(160deg, #a8d8f0, #6aa9e9)' }} aria-hidden="true">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 62">
            <rect x="18" y="6" width="64" height="44" rx="5" fill="#4f8fd6" stroke="#000" strokeWidth="1.2" />
            {Array.from({ length: 15 }, (_, i) => {
              const diag = [2, 6, 10, 14].includes(i) ? 1 : [5, 11, 12].includes(i) ? 2 : 0;
              const cx = 26 + (i % 5) * 12, cy = 15 + Math.floor(i / 5) * 13;
              return (
                <g key={i}>
                  <circle cx={cx} cy={cy} r="5" fill={diag === 1 ? TEAM_COLORS[0] : diag === 2 ? TEAM_COLORS[1] : '#ffffff'} stroke="#000" strokeWidth="1" />
                  {diag === 1 && <path d={`M${cx} ${cy - 2.6} L${cx + 0.8} ${cy - 0.8} L${cx + 2.6} ${cy - 0.6} L${cx + 1.2} ${cy + 0.7} L${cx + 1.6} ${cy + 2.6} L${cx} ${cy + 1.6} L${cx - 1.6} ${cy + 2.6} L${cx - 1.2} ${cy + 0.7} L${cx - 2.6} ${cy - 0.6} L${cx - 0.8} ${cy - 0.8} Z`} fill="#241c3d" />}
                  {diag === 2 && <path d={`M${cx} ${cy + 2.2} C${cx - 3.4} ${cy - 0.4} ${cx - 1.8} ${cy - 3.2} ${cx} ${cy - 1.2} C${cx + 1.8} ${cy - 3.2} ${cx + 3.4} ${cy - 0.4} ${cx} ${cy + 2.2} Z`} fill="#241c3d" />}
                </g>
              );
            })}
          </svg>
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
    case 'castle-quest':
      // Castle Quest: the forest path, a bridge and the castle at the end.
      return (
        <div className={base} style={{ background: 'radial-gradient(circle at 30% 20%, #6fbf73, #2f7d4b 70%)' }} aria-hidden="true">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice">
            {[[8, 46, 'tileGrass'], [20, 46, 'tileAutumn'], [32, 46, 'tileGrass'], [44, 46, 'tileDirt'], [56, 46, 'tileGrass'], [62, 37, 'tileAutumn'], [50, 37, 'tileGrass'], [38, 37, 'tileMagic'], [26, 37, 'tileGrass']].map(([x, y, n], i) => (
              <image key={i} href={`/classic/castle-quest/${n}.png`} x={x as number} y={y as number} width={13} height={17.8} />
            ))}
            <line x1="26.5" y1="53" x2="44" y2="43" stroke="#5b3a1e" strokeWidth="4" strokeLinecap="round" /><line x1="26.5" y1="53" x2="44" y2="43" stroke="#c58a4f" strokeWidth="3" strokeDasharray="1.2 0.8" />
            <image href="/classic/castle-quest/medieval_largeCastle.png" x="66" y="4" width="30" height="35" />
            {[[4, 10], [12, 6], [20, 12], [50, 8], [58, 12]].map(([x, y], i) => <image key={i} href="/classic/castle-quest/pineGreen_high.png" x={x} y={y} width="6" height="22" />)}
            <image href="/classic/castle-quest/heroes/blue_knight.webp" x="30" y="30" width="11" height="11" />
            <image href="/classic/castle-quest/powerups/chest.webp" x="51" y="31" width="9" height="9" />
          </svg>
        </div>
      );
    case 'pinball':
      // Pinball (teacher design, 2026-10-31): pockets of points, five zones, the ball at the launcher.
      return (
        <div className={base} style={{ background: 'linear-gradient(180deg, #314677, #22336e)' }} aria-hidden="true">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice">
            {[[22, 12, 30], [50, 9, 100], [78, 14, 60], [36, 24, 10], [66, 25, 40]].map(([x, y, v]) => (
              <g key={x}><circle cx={x} cy={y} r="6.4" fill="#fdfd94" stroke="#000" strokeWidth="0.6" /><circle cx={x} cy={y} r="5" fill="#1b2550" /><text x={x} y={y + 1.6} textAnchor="middle" fontSize="4.4" fontWeight="800" fill="#fff">{v}</text></g>
            ))}
            {['#c9a3f5', '#8ec5ff', '#8fe3a0', '#fdfd94', '#f6a5c0'].map((c, i) => (
              <g key={c}><rect x={8 + i * 18} y="35" width="12" height="6" rx="3" fill={c} stroke="#000" strokeWidth="0.7" /><text x={14 + i * 18} y="39.8" textAnchor="middle" fontSize="4.4" fontWeight="800" fill="#241c3d">{i + 1}</text></g>
            ))}
            <path d="M50 55 L62 41" stroke="#fff" strokeWidth="1" strokeDasharray="0.1 2.2" strokeLinecap="round" />
            <path d="M33 54 L45 57 L45 58 L33 56 Z M67 54 L55 57 L55 58 L67 56 Z" fill="#fdfd94" stroke="#000" strokeWidth="0.6" />
            <circle cx="50" cy="55" r="3.2" fill="#e7ecf5" stroke="#000" strokeWidth="0.6" /><circle cx="49" cy="54" r="1" fill="#fff" />
            <circle cx="12" cy="50" r="4" fill="#f2735f" stroke="#000" strokeWidth="0.6" /><circle cx="88" cy="50" r="4" fill="#f2735f" stroke="#000" strokeWidth="0.6" />
          </svg>
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

// Covers for Gamify's designed themes (teacher, 2026-10-31): each shows the
// theme's own art in a small scene of its game.
export function ThemeCover({ theme, className = '' }: { theme: GameTheme; className?: string }) {
  const base = `relative overflow-hidden ${className}`;
  const bg = theme.colors.background;
  if (theme.discs?.length) {
    // Four in a Row pieces: a board with the theme's pieces dropped in.
    const d = theme.discs;
    return (
      <div className={base} style={{ background: bg }} aria-hidden="true">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 62">
          <rect x="18" y="6" width="64" height="44" rx="5" fill={theme.pieces.board?.color ?? '#4f8fd6'} stroke="#000" strokeWidth="1.2" />
          {Array.from({ length: 15 }, (_, i) => {
            const cx = 26 + (i % 5) * 12, cy = 15 + Math.floor(i / 5) * 13;
            const pick = [2, 6, 10, 14].includes(i) ? 0 : [5, 11, 12, 7].includes(i) ? 1 : -1;
            return pick < 0 ? <circle key={i} cx={cx} cy={cy} r="5" fill="#fff" stroke="#000" strokeWidth="1" /> : <image key={i} href={d[(pick * 3) % d.length].image} x={cx - 5.5} y={cy - 5.5} width="11" height="11" />;
          })}
        </svg>
      </div>
    );
  }
  if (theme.itemImages?.length && theme.pieces.background?.image) {
    // A room theme (Question Tracker Pet Room): the room with a few pets in it.
    return (
      <div className={base} style={{ background: `${bg} center / cover url("${theme.pieces.background.image}")` }} aria-hidden="true">
        {theme.itemImages.slice(0, 4).map((src, i) => (
          <img key={src} src={src} alt="" className="absolute w-[17%] object-contain" style={{ left: `${12 + i * 21}%`, bottom: `${8 + (i % 2) * 10}%`, imageRendering: theme.pixelArt ? 'pixelated' : undefined }} />
        ))}
      </div>
    );
  }
  const tiles = [0, 1, 2, 3, 4, 5].map((k) => theme.pieces[`tile-${k}`]).filter((p) => p?.image);
  if (tiles.length) {
    // Match Three pieces: a board of the theme's pieces with a match lit up.
    return (
      <div className={base} style={{ background: bg }} aria-hidden="true">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice">
          <g transform="rotate(-6 50 31)">
            <rect x="16" y="3" width="68" height="56" rx="5" fill={theme.pieces.board?.color ?? '#fff'} stroke="#000" strokeWidth="1.2" />
            {[[0, 2, 4, 3, 5], [3, 1, 1, 1, 0], [5, 4, 2, 0, 3], [2, 0, 5, 4, 1]].map((row, r) => row.map((k, c) => {
              const x = 19 + c * 12.8, y = 6 + r * 13, lit = r === 1 && c >= 1 && c <= 3;
              const p = tiles[k % tiles.length]!;
              return <g key={`${r}-${c}`}><rect x={x} y={y} width="11.8" height="11.8" rx="2.4" fill={lit ? '#fdfd94' : p.color ?? '#eee'} stroke={lit ? '#000' : 'none'} strokeWidth="0.8" /><image href={p.image} x={x} y={y} width="11.8" height="11.8" /></g>;
            }))}
          </g>
        </svg>
      </div>
    );
  }
  const cover = theme.pieces.cover?.image;
  return <div className={base} style={{ background: cover ? `${bg} center / contain no-repeat url("${cover}")` : bg }} aria-hidden="true" />;
}

// A game card's cover: a game with Gamify's designed themes shows them
// (teacher, 2026-10-31: "show them instead of the default"), and hovering
// for 3 seconds moves to the next one, cycling through, then Classic.
export function CyclingCover({ gameId, className = '' }: { gameId: string; className?: string }) {
  const looks = houseFor(gameId);
  const [i, setI] = useState(0);
  const timer = useRef<number | null>(null);
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const count = looks.length + 1; // the designed themes, then Classic
  // Hovering anywhere on the card (or focusing it) starts the cycle.
  useEffect(() => {
    if (!looks.length) return;
    const card = box.current?.closest('a, li, article, [data-card]') ?? box.current;
    if (!card) return;
    const start = () => { if (!timer.current) timer.current = window.setInterval(() => setI((n) => (n + 1) % count), 3000); };
    const stop = () => { if (timer.current) { window.clearInterval(timer.current); timer.current = null; } };
    card.addEventListener('mouseenter', start); card.addEventListener('mouseleave', stop);
    card.addEventListener('focusin', start); card.addEventListener('focusout', stop);
    return () => { stop(); card.removeEventListener('mouseenter', start); card.removeEventListener('mouseleave', stop); card.removeEventListener('focusin', start); card.removeEventListener('focusout', stop); };
  }, [looks.length, count]);
  if (!looks.length) return <GameCover gameId={gameId} className={className} />;
  return (
    <div ref={box} className={`relative overflow-hidden ${className}`}>
      <AnimatePresence initial={false}>
        <motion.div key={i} className="absolute inset-0" initial={reduce ? { opacity: 0 } : { opacity: 0, x: '12%' }} animate={{ opacity: 1, x: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, x: '-12%' }} transition={{ duration: 0.45 }}>
          {i < looks.length ? <ThemeCover theme={looks[i]} className="w-full h-full" /> : <GameCover gameId={gameId} className="w-full h-full" />}
        </motion.div>
      </AnimatePresence>
      <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1" aria-hidden="true">
        {Array.from({ length: count }, (_, k) => <span key={k} className={`w-2 h-2 rounded-full border border-border ${k === i ? 'bg-accent' : 'bg-surface/80'}`} />)}
      </span>
    </div>
  );
}
