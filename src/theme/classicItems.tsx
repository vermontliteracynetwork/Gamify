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
};

export function ClassicItemSvg({ art, size }: { art: string; size: number }) {
  const Art = CLASSIC_ITEM_ART[art];
  return <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">{Art ? <Art /> : <circle cx="50" cy="50" r="40" fill="#fdfd94" stroke={INK} strokeWidth="3" />}</svg>;
}
