import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useReducedMotion } from '../ui/useReducedMotion';
import { houseFor } from '../theme/house';
import type { GameTheme } from '../theme/types';
import { Hamburger, Cat, Dog, Fish, Rocket, Sun, Crown, Heart, IceCream, Pizza, Sparkle, Star, Trophy, type Icon } from '@phosphor-icons/react';

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
      // Mirrors the game (teacher, 2026-11-01): the red Classic stage, the
      // marquee-light frame and horizontal numbered cards, one turned over.
      return (
        <div className={base} style={{ background: 'radial-gradient(circle at 50% 30%, #f05a4f, #b8232b 75%)' }} aria-hidden="true">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice">
            <rect x="9" y="6" width="82" height="50" rx="4" fill="#241c3d" stroke="#000" strokeWidth="1" />
            {Array.from({ length: 26 }, (_, k) => <circle key={`t${k}`} cx={11.5 + k * 3.1} cy="8" r="0.8" fill="#fff6b0" />)}
            {Array.from({ length: 26 }, (_, k) => <circle key={`b${k}`} cx={11.5 + k * 3.1} cy="54" r="0.8" fill="#fff6b0" />)}
            {Array.from({ length: 14 }, (_, k) => <circle key={`l${k}`} cx="11" cy={11 + k * 3.1} r="0.8" fill="#fff6b0" />)}
            {Array.from({ length: 14 }, (_, k) => <circle key={`r${k}`} cx="89" cy={11 + k * 3.1} r="0.8" fill="#fff6b0" />)}
            {Array.from({ length: 9 }, (_, k) => {
              const c = k % 3, r = Math.floor(k / 3), x = 15 + c * 24, y = 12 + r * 13.6;
              const open = k === 4;
              return (
                <g key={k}>
                  <rect x={x} y={y} width="22" height="12" rx="1.8" fill={open ? '#ffffff' : '#fdfd94'} stroke="#000" strokeWidth="0.7" />
                  <text x={x + 11} y={y + 8.4} textAnchor="middle" fontSize="7" fontWeight="900" fill="#241c3d">{open ? '+30' : k + 1}</text>
                </g>
              );
            })}
            <rect x="38.6" y="25.2" width="22.8" height="12.8" rx="2" fill="none" stroke="#fdfd94" strokeWidth="1.2" opacity="0.9" />
          </svg>
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
    case 'four-in-a-row': {
      // A real four-in-a-row board (teacher, 2026-11-06): a standing 7 by 6
      // frame, pieces stacked from the bottom, one dropping in, and a
      // glowing line through four in a row.
      const stacks = ['a', 'bab', 'ba', 'bbaa', 'ba', 'a', ''];
      const cx = (c: number) => 26.6 + c * 7.8, cy = (r: number) => 51 - r * 7.3; // r 0 = bottom row
      return (
        <div className={base} style={{ background: 'linear-gradient(160deg, #a8d8f0, #6aa9e9)' }} aria-hidden="true">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 62">
            <path d="M24 55 L19 61 M76 55 L81 61" stroke="#000" strokeWidth="2.4" strokeLinecap="round" />
            <rect x="21.5" y="9.5" width="57" height="46" rx="3.5" fill="#4f8fe0" stroke="#000" strokeWidth="1.2" />
            {Array.from({ length: 42 }, (_, i) => {
              const c = i % 7, r = Math.floor(i / 7), piece = stacks[c][r];
              return (
                <g key={i}>
                  <circle cx={cx(c)} cy={cy(r)} r="3.2" fill="#e8eef9" stroke="#2c3e66" strokeWidth="0.5" />
                  {piece && <image href={`/classic/four-in-a-row/${piece === 'a' ? '8-billiard-ball' : 'basket-ball'}.webp`} x={cx(c) - 3.2} y={cy(r) - 3.2} width="6.4" height="6.4" />}
                </g>
              );
            })}
            <line x1={cx(1)} y1={cy(0)} x2={cx(4)} y2={cy(0)} stroke="#fdfd94" strokeWidth="1.8" strokeLinecap="round" opacity="0.9" />
            <image href="/classic/four-in-a-row/8-billiard-ball.webp" x={cx(6) - 3.2} y="1.2" width="6.4" height="6.4" />
            <path d={`M${cx(6)} 8.2 l0 1`} stroke="#000" strokeWidth="0.6" />
          </svg>
        </div>
      );
    }
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
      // Mirrors the game: the retro carpet, the wooden lane, pins and a Classic ball.
      return (
        <div className={base} style={{ background: '#0b0b12 url(/classic/bowling/carpet.svg) center / 60% repeat' }} aria-hidden="true">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <rect x="32" y="8" width="36" height="10" rx="2" fill="#241c3d" stroke="#ff4fa3" strokeWidth="1.2" />
            {[0, 1, 2, 3, 4, 5, 6].map((k) => <circle key={k} cx={37 + k * 4.4} cy="13" r="0.9" fill={['#fdfd94', '#6aa9e9', '#ff4fa3'][k % 3]} />)}
            <polygon points="12,100 88,100 66,22 34,22" fill="#7f8aa3" stroke="#000" strokeWidth="1" />
            <polygon points="18,100 82,100 64,22 36,22" fill="#e9c08f" stroke="#000" strokeWidth="1" />
            {[30, 40, 50, 60, 70].map((x) => <line key={x} x1={x} y1="100" x2={50 + (x - 50) * 0.42} y2="22" stroke="#8a5a2b" strokeOpacity="0.3" strokeWidth="0.6" />)}
            {[[50, 40], [45, 34], [55, 34], [40, 29], [50, 29], [60, 29]].map(([x, y], i) => (
              <g key={i} transform={`translate(${x} ${y}) scale(0.75)`}><path d="M0,-11 C1.6,-11 2,-9.6 1.6,-8.2 C1.3,-7.2 1,-6.6 1.7,-5.4 C2.9,-3.6 3.2,-1.8 2.6,-0.4 C2.3,0.2 1.6,0.3 0,0.3 C-1.6,0.3 -2.3,0.2 -2.6,-0.4 C-3.2,-1.8 -2.9,-3.6 -1.7,-5.4 C-1,-6.6 -1.3,-7.2 -1.6,-8.2 C-2,-9.6 -1.6,-11 0,-11 Z" fill="#fbfcf8" stroke="#000" strokeWidth="0.6" /><rect x="-1.25" y="-7.6" width="2.5" height="0.7" fill="#e5635f" /><rect x="-1.4" y="-6.5" width="2.8" height="0.7" fill="#e5635f" /></g>
            ))}
            <path d="M50 84 L50 46" stroke="#241c3d" strokeWidth="1" strokeDasharray="0.1 2.4" strokeLinecap="round" />
            <image href="/classic/bowling/ball-3.webp" x="40" y="74" width="20" height="20" />
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
    case 'castle-quest': {
      // Board Game (redesign 2026-11-08): the flat classic board of squares,
      // two round pieces, a die and the finish flag, in the vision board colors.
      const cols = ['#BCD9E2', '#F9CC14', '#D35252', '#9AB582'];
      const sq: [number, number][] = [];
      for (let k = 0; k < 7; k++) sq.push([k, 0]); sq.push([6, 1]);
      for (let k = 6; k >= 0; k--) sq.push([k, 2]); sq.push([0, 3]);
      for (let k = 0; k < 7; k++) sq.push([k, 4]);
      return (
        <div className={base} style={{ backgroundColor: '#F1DFBB', backgroundImage: 'radial-gradient(#FAE9DF 18%, transparent 19%)', backgroundSize: '14px 14px' }} aria-hidden="true">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 62" preserveAspectRatio="xMidYMid meet">
            <rect x="9" y="3" width="82" height="56" rx="5" fill="#FAE9DF" stroke="#474241" strokeWidth="1.4" />
            {sq.map(([x, y], i) => <rect key={i} x={12 + x * 11} y={5 + y * 10.4} width="9.4" height="9.4" rx="1.6" fill={i === 0 ? '#9AB582' : i === sq.length - 1 ? '#F9CC14' : i === 9 ? '#474241' : cols[i % 4]} stroke="#474241" strokeWidth="0.9" transform={`rotate(${((i * 37) % 7) - 3} ${16.7 + x * 11} ${9.7 + y * 10.4})`} />)}
            <g transform="translate(81.5 47.5)"><rect x="-1" y="-3" width="1" height="7" fill="#474241" /><path d="M0 -3 H5 V0.5 H0 Z" fill="#fff" stroke="#474241" strokeWidth="0.5" /><rect x="0" y="-3" width="1.7" height="1.7" fill="#474241" /><rect x="3.4" y="-3" width="1.6" height="1.7" fill="#474241" /><rect x="1.7" y="-1.3" width="1.7" height="1.8" fill="#474241" /></g>
            <circle cx={16.7 + 3 * 11} cy={9.7 + 2 * 10.4} r="3.6" fill="#f6c544" stroke="#241c3d" strokeWidth="0.9" />
            <circle cx={16.7 + 5 * 11} cy={9.7 + 0} r="3.6" fill="#6aa9e9" stroke="#241c3d" strokeWidth="0.9" />
            <g transform="translate(40 36) rotate(-12)"><rect x="0" y="0" width="13" height="13" rx="2.6" fill="#fffdf6" stroke="#474241" strokeWidth="1" /><circle cx="3.5" cy="3.5" r="1.2" fill="#474241" /><circle cx="6.5" cy="6.5" r="1.2" fill="#474241" /><circle cx="9.5" cy="9.5" r="1.2" fill="#474241" /></g>
          </svg>
        </div>
      );
    }
    case 'pinball':
      // Mirrors the game: pockets in a line across the top, bonus lights,
      // three pop bumpers, the numbered lanes, rails, flippers and the ball.
      return (
        <div className={base} style={{ background: 'linear-gradient(180deg, #3a528c, #22336e)' }} aria-hidden="true">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice">
            {[['#ff9b54', 60], ['#fbc94a', 100], ['#f2735f', 30], ['#8fe3a0', 80]].map(([c, v], i) => (
              <g key={i}><rect x={12 + i * 19} y="2" width="19" height="10" fill={c as string} stroke="#000" strokeWidth="0.6" /><text x={21.5 + i * 19} y="9.6" textAnchor="middle" fontSize="5" fontWeight="900" fill="#fff" stroke="#000" strokeWidth="0.6" paintOrder="stroke">{v}</text></g>
            ))}
            <rect x="16" y="13.5" width="68" height="3.6" rx="1.8" fill="#000" opacity="0.4" />
            {[0, 1, 2, 3, 4, 5].map((k) => <circle key={k} cx={21 + k * 9} cy="15.3" r="1.3" fill={k < 3 ? '#fdfd94' : '#1d2440'} stroke={k < 3 ? '#000' : '#fff'} strokeWidth="0.3" />)}
            {[[30, 24], [50, 30], [70, 24]].map(([x, y]) => (
              <g key={x}><circle cx={x} cy={y} r="4.4" fill="#fff" stroke="#000" strokeWidth="0.4" /><circle cx={x} cy={y} r="3.6" fill="#f2735f" stroke="#000" strokeWidth="0.4" /><circle cx={x} cy={y} r="1.5" fill="#fff" /></g>
            ))}
            {['#f6c544', '#9b7be0', '#ef5d7a', '#4fb6d8', '#f39ac0'].map((c, i) => (
              <g key={c}><rect x={16 + i * 13.6} y="37" width="13.6" height="6.4" fill={c} stroke="#000" strokeWidth="0.5" /><text x={22.8 + i * 13.6} y="42.3" textAnchor="middle" fontSize="4.6" fontWeight="900" fill="#fff" stroke="#000" strokeWidth="0.6" paintOrder="stroke">{i + 1}</text></g>
            ))}
            <path d="M14 46 L30 58 M86 46 L70 58" stroke="#c9d3ea" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M33 56 L45 59 L45 60 L33 58 Z M67 56 L55 59 L55 60 L67 58 Z" fill="#fdfd94" stroke="#000" strokeWidth="0.5" />
            <circle cx="50" cy="56" r="2.6" fill="#e7ecf5" stroke="#000" strokeWidth="0.5" /><circle cx="49.2" cy="55.2" r="0.8" fill="#fff" />
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
