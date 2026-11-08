// Classic power-up art, drawn in code on a 100 x 100 grid (no files, no
// licenses). Every ability a game can do has a Classic item (teacher,
// 2026-10-26), shown in Classic mode, in the Classic example pack and as the
// example beside each "What it does" choice in the Theme Builder.
const INK = '#000';
const S = { stroke: INK, strokeWidth: 3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

export const CLASSIC_ITEM_ART: Record<string, () => JSX.Element> = {
  'rainbow-fish': () => (
    <g>
      <path d="M74 50 L96 30 L92 50 L96 70 Z" fill="#9b6cf0" {...S} />
      <ellipse cx="44" cy="50" rx="36" ry="24" fill="#f6a5c0" {...S} />
      <path d="M22 34 Q20 50 22 66" stroke="#f6c544" strokeWidth="7" fill="none" />
      <path d="M34 28 Q31 50 34 72" stroke="#9fe7a0" strokeWidth="7" fill="none" />
      <path d="M48 27 Q45 50 48 73" stroke="#8ec5ff" strokeWidth="7" fill="none" />
      <path d="M62 30 Q59 50 62 70" stroke="#c9a3f5" strokeWidth="7" fill="none" />
      <ellipse cx="44" cy="50" rx="36" ry="24" fill="none" {...S} />
      <circle cx="18" cy="45" r="5" fill="#fff" {...S} strokeWidth={2} /><circle cx="17" cy="45" r="2.2" fill={INK} />
    </g>
  ),
  boot: () => (
    <g>
      <path d="M30 12 H58 V56 L86 64 Q92 66 92 74 V84 H22 V70 L30 60 Z" fill="#9c6b45" {...S} />
      <path d="M22 84 H92" {...S} strokeWidth={6} />
      <path d="M34 22 H54 M34 32 H54 M34 42 H54" stroke="#e8d5b8" strokeWidth="3" />
      <circle cx="74" cy="30" r="4" fill="#8ec5ff" {...S} strokeWidth={2} /><circle cx="82" cy="18" r="3" fill="#8ec5ff" {...S} strokeWidth={2} />
    </g>
  ),
  watch: () => (
    <g>
      <rect x="44" y="6" width="12" height="10" rx="3" fill="#f6c544" {...S} />
      <circle cx="50" cy="56" r="36" fill="#f6c544" {...S} />
      <circle cx="50" cy="56" r="28" fill="#fff" {...S} />
      <path d="M50 56 V36 M50 56 L64 64" {...S} strokeWidth={4} />
    </g>
  ),
  'golden-hook': () => (
    <g>
      <path d="M50 8 V62 Q50 84 32 82 Q18 80 20 64 L28 70" fill="none" stroke="#c99a1c" strokeWidth="9" strokeLinecap="round" />
      <path d="M50 8 V62 Q50 84 32 82 Q18 80 20 64 L28 70" fill="none" stroke="#f6c544" strokeWidth="5" strokeLinecap="round" />
      <circle cx="50" cy="8" r="6" fill="#fff" {...S} />
      <path d="M72 24 l4 8 8 4 -8 4 -4 8 -4 -8 -8 -4 8 -4 Z" fill="#fdfd94" {...S} strokeWidth={2} />
    </g>
  ),
  bottle: () => (
    <g>
      <rect x="42" y="6" width="16" height="12" rx="3" fill="#b98552" {...S} />
      <path d="M40 18 H60 V30 Q76 38 76 56 V86 Q76 94 68 94 H32 Q24 94 24 86 V56 Q24 38 40 30 Z" fill="#9fe7a0" fillOpacity="0.8" {...S} />
      <rect x="36" y="52" width="28" height="26" rx="3" fill="#fbf3dc" {...S} strokeWidth={2} transform="rotate(-8 50 65)" />
      <text x="50" y="72" textAnchor="middle" fontSize="20" fontWeight="bold" fill={INK} transform="rotate(-8 50 65)">?</text>
    </g>
  ),
  'double-star': () => (
    <g>
      <path d="M50 6 L62 36 L94 38 L69 58 L78 90 L50 72 L22 90 L31 58 L6 38 L38 36 Z" fill="#f6c544" {...S} />
      <text x="50" y="64" textAnchor="middle" fontSize="26" fontWeight="bold" fill={INK}>x2</text>
    </g>
  ),
  'swap-arrows': () => (
    <g>
      <circle cx="50" cy="50" r="44" fill="#8ec5ff" {...S} />
      <path d="M24 40 H70 L60 28 M76 60 H30 L40 72" fill="none" {...S} strokeWidth={7} />
    </g>
  ),
  'golden-ball': () => (
    <g>
      <circle cx="50" cy="50" r="40" fill="#f6c544" {...S} />
      <circle cx="36" cy="36" r="9" fill="#fff6c8" />
      <text x="50" y="62" textAnchor="middle" fontSize="30" fontWeight="bold" fill={INK}>x2</text>
    </g>
  ),
  'extra-ball': () => (
    <g>
      <circle cx="38" cy="58" r="28" fill="#8ec5ff" {...S} />
      <circle cx="64" cy="40" r="28" fill="#fdfd94" {...S} />
      <path d="M64 28 V52 M52 40 H76" {...S} strokeWidth={6} />
    </g>
  ),
  'golden-pin': () => (
    <g>
      <path d="M50 6 C60 6 62 16 59 24 C57 30 56 33 60 40 C68 52 70 64 66 76 C63 86 58 92 50 92 C42 92 37 86 34 76 C30 64 32 52 40 40 C44 33 43 30 41 24 C38 16 40 6 50 6 Z" fill="#f6c544" {...S} />
      <rect x="40" y="32" width="20" height="6" fill="#e5635f" />
      <text x="50" y="72" textAnchor="middle" fontSize="20" fontWeight="bold" fill={INK}>x2</text>
    </g>
  ),
  'extra-bubble': () => (
    <g>
      <circle cx="50" cy="50" r="40" fill="#c9b6ff" {...S} />
      <circle cx="36" cy="34" r="8" fill="#ffffff" opacity="0.8" />
      <path d="M50 32 V68 M32 50 H68" {...S} strokeWidth={8} />
    </g>
  ),
  'extra-plate': () => (
    <g>
      <ellipse cx="50" cy="62" rx="42" ry="20" fill="#ffffff" {...S} />
      <ellipse cx="50" cy="60" rx="26" ry="11" fill="#f4f4f4" stroke={INK} strokeWidth={2} />
      <circle cx="74" cy="26" r="16" fill="#9fe7a0" {...S} />
      <path d="M74 17 V35 M65 26 H83" {...S} strokeWidth={5} />
    </g>
  ),
  'tip-jar': () => (
    <g>
      <path d="M26 30 H74 V84 Q74 92 66 92 H34 Q26 92 26 84 Z" fill="#bfe8ff" fillOpacity="0.85" {...S} />
      <rect x="22" y="22" width="56" height="10" rx="3" fill="#9c6b45" {...S} />
      <circle cx="42" cy="70" r="9" fill="#f6c544" {...S} strokeWidth={2} /><circle cx="58" cy="78" r="9" fill="#f6c544" {...S} strokeWidth={2} /><circle cx="54" cy="58" r="9" fill="#f6c544" {...S} strokeWidth={2} />
    </g>
  ),
  'gem-pouch': () => (
    <g>
      <path d="M30 34 Q16 54 18 76 Q20 92 50 92 Q80 92 82 76 Q84 54 70 34 Z" fill="#c9a27e" {...S} />
      <path d="M30 34 H70" {...S} strokeWidth={6} />
      <path d="M50 14 L64 26 L50 44 L36 26 Z" fill="#8ec5ff" {...S} />
      <path d="M34 54 L44 62 L34 74 L24 62 Z" fill="#c9b6ff" {...S} strokeWidth={2} /><path d="M66 54 L76 62 L66 74 L56 62 Z" fill="#9fe7a0" {...S} strokeWidth={2} />
    </g>
  ),
  'snow-globe': () => (
    <g>
      <rect x="22" y="76" width="56" height="16" rx="4" fill="#9c6b45" {...S} />
      <circle cx="50" cy="46" r="34" fill="#dff1ff" {...S} />
      <path d="M50 26 V66 M32 46 H68 M37 33 L63 59 M63 33 L37 59" stroke="#6aa9e9" strokeWidth="4" strokeLinecap="round" />
    </g>
  ),
  'super-shooter': () => (
    <g>
      <path d="M8 70 H40 M14 54 H40 M20 86 H44" stroke="#6aa9e9" strokeWidth="6" strokeLinecap="round" />
      <circle cx="64" cy="62" r="26" fill="#e7ecf5" {...S} />
      <circle cx="56" cy="54" r="7" fill="#fff" />
      <path d="M70 6 L56 34 H70 L60 54 L86 24 H72 L80 6 Z" fill="#f6c544" {...S} />
    </g>
  ),
  'prize-bag': () => (
    <g>
      <path d="M36 30 Q20 50 18 74 Q18 92 50 92 Q82 92 82 74 Q80 50 64 30 Z" fill="#9fe7a0" {...S} />
      <path d="M36 30 L30 12 L42 20 L50 8 L58 20 L70 12 L64 30 Z" fill="#9fe7a0" {...S} />
      <path d="M34 30 H66" {...S} strokeWidth={6} stroke="#f6c544" />
      <circle cx="50" cy="64" r="15" fill="#f6c544" {...S} />
      <text x="50" y="71" textAnchor="middle" fontSize="20" fontWeight="bold" fill={INK}>+</text>
    </g>
  ),
  'watering-can': () => (
    <g>
      <path d="M24 40 H66 V84 Q66 90 60 90 H30 Q24 90 24 84 Z" fill="#8ec5ff" {...S} />
      <path d="M66 50 L90 30 L94 36 L70 62" fill="#8ec5ff" {...S} />
      <path d="M30 40 Q45 14 60 40" fill="none" {...S} strokeWidth={5} />
      <path d="M92 44 V52 M86 50 V58 M98 50 V58" stroke="#6aa9e9" strokeWidth="4" strokeLinecap="round" />
    </g>
  ),
  'rain-cloud': () => (
    <g>
      <path d="M22 58 Q8 58 10 46 Q12 34 26 36 Q30 18 50 20 Q68 20 72 36 Q90 34 90 48 Q90 60 76 58 Z" fill="#ffffff" {...S} />
      <path d="M30 70 L26 82 M50 70 L46 86 M70 70 L66 82" stroke="#6aa9e9" strokeWidth="5" strokeLinecap="round" />
    </g>
  ),
  // Board Game (teacher, 2026-11-08): basic Classic power-ups.
  'two-dice': () => (
    <g>
      <rect x="8" y="30" width="46" height="46" rx="9" fill="#fffdf6" {...S} transform="rotate(-12 31 53)" />
      <rect x="46" y="22" width="46" height="46" rx="9" fill="#F9CC14" {...S} transform="rotate(10 69 45)" />
      <g transform="rotate(-12 31 53)" fill={INK}><circle cx="20" cy="42" r="4.5" /><circle cx="31" cy="53" r="4.5" /><circle cx="42" cy="64" r="4.5" /></g>
      <g transform="rotate(10 69 45)" fill={INK}><circle cx="58" cy="34" r="4.5" /><circle cx="80" cy="34" r="4.5" /><circle cx="58" cy="56" r="4.5" /><circle cx="80" cy="56" r="4.5" /></g>
    </g>
  ),
  'twister': () => (
    <g>
      <path d="M10 18 Q50 6 90 18 Q86 30 50 32 Q16 30 10 18 Z" fill="#BCD9E2" {...S} />
      <path d="M18 34 Q50 44 82 34 Q76 48 50 50 Q24 48 18 34 Z" fill="#BCD9E2" {...S} />
      <path d="M28 52 Q50 60 72 52 Q66 64 50 66 Q34 64 28 52 Z" fill="#BCD9E2" {...S} />
      <path d="M38 68 Q50 74 62 68 Q58 78 50 80 Q42 78 38 68 Z" fill="#BCD9E2" {...S} />
      <path d="M46 82 Q52 88 48 94" fill="none" {...S} />
    </g>
  ),
  'spin-wheel': () => (
    <g>
      <circle cx="50" cy="54" r="38" fill="#fffdf6" {...S} />
      <path d="M50 16 A38 38 0 0 1 50 92 Z" fill="#9AB582" {...S} />
      <path d="M50 16 A38 38 0 0 0 50 92 Z" fill="#D35252" {...S} />
      <path d="M62 54 L76 54 M70 48 L76 54 L70 60" fill="none" {...S} strokeWidth={4} />
      <path d="M38 54 L24 54 M30 48 L24 54 L30 60" fill="none" {...S} strokeWidth={4} />
      <circle cx="50" cy="54" r="6" fill="#F9CC14" {...S} />
      <path d="M42 4 H58 L50 18 Z" fill="#474241" {...S} />
    </g>
  ),
  'magic-potion': () => (
    <g>
      <rect x="40" y="8" width="20" height="12" rx="3" fill="#c9a46a" {...S} />
      <path d="M42 20 V36 Q16 46 16 66 Q16 92 50 92 Q84 92 84 66 Q84 46 58 36 V20 Z" fill="#fffdf6" {...S} />
      <path d="M20 64 Q34 56 50 64 Q66 72 80 64 Q82 90 50 90 Q18 90 20 64 Z" fill="#D35252" stroke="none" />
      <path d="M42 20 V36 Q16 46 16 66 Q16 92 50 92 Q84 92 84 66 Q84 46 58 36 V20 Z" fill="none" {...S} />
      <circle cx="40" cy="74" r="4" fill="#FAE9DF" /><circle cx="58" cy="80" r="3" fill="#FAE9DF" />
      <text x="50" y="58" textAnchor="middle" fontSize="18" fontWeight="bold" fill={INK}>x2</text>
    </g>
  ),
  'round-shield': () => (
    <g>
      <path d="M50 8 L86 20 V48 Q86 78 50 94 Q14 78 14 48 V20 Z" fill="#BCD9E2" {...S} />
      <path d="M50 20 L74 28 V48 Q74 70 50 82 Q26 70 26 48 V28 Z" fill="#F9CC14" {...S} />
      <path d="M50 34 L55 46 L68 47 L58 55 L61 68 L50 61 L39 68 L42 55 L32 47 L45 46 Z" fill="#fffdf6" {...S} strokeWidth={2.4} />
    </g>
  ),
  magnet: () => (
    <g>
      <path d="M20 14 H40 V54 Q40 66 50 66 Q60 66 60 54 V14 H80 V54 Q80 86 50 86 Q20 86 20 54 Z" fill="#f2735f" {...S} />
      <rect x="20" y="14" width="20" height="14" fill="#fbf3dc" {...S} /><rect x="60" y="14" width="20" height="14" fill="#fbf3dc" {...S} />
      <path d="M88 40 L96 34 M88 54 L98 54 M4 34 L12 40 M2 54 L12 54" {...S} />
    </g>
  ),
};

export function ClassicItemSvg({ art, size }: { art: string; size: number }) {
  const Art = CLASSIC_ITEM_ART[art];
  return <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">{Art ? <Art /> : <circle cx="50" cy="50" r="40" fill="#fdfd94" stroke={INK} strokeWidth="3" />}</svg>;
}
