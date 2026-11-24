// Smile emoji faces (teacher, 2026-11-24: "class check in (but updated with
// smile emoji faces instead)"): round yellow faces drawn in code (no emoji
// font to license), big grin, a flat mouth (teacher, 2026-11-24), little frown.
export default function EmojiFace({ mood, size = 64 }: { mood: 0 | 1 | 2; size?: number | string }) {
  const mouth = mood === 0 ? 'M30 58 Q50 80 70 58 Q50 70 30 58 Z' : mood === 1 ? 'M34 64 L66 64' : 'M33 68 Q50 56 67 68';
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <circle cx="50" cy="50" r="44" fill="#fabe37" stroke="#1d1a33" strokeWidth="5" />
      <ellipse cx="36" cy="40" rx="5" ry="7" fill="#1d1a33" /><ellipse cx="64" cy="40" rx="5" ry="7" fill="#1d1a33" />
      <path d={mouth} fill={mood === 0 ? '#1d1a33' : 'none'} stroke="#1d1a33" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      {mood === 0 && <><circle cx="26" cy="56" r="5" fill="#ffd3e6" /><circle cx="74" cy="56" r="5" fill="#ffd3e6" /></>}
    </svg>
  );
}
export const FaceGreat = ({ size }: { size?: number | string }) => <EmojiFace mood={0} size={size} />;
export const FaceOkay = ({ size }: { size?: number | string }) => <EmojiFace mood={1} size={size} />;
export const FaceNotGreat = ({ size }: { size?: number | string }) => <EmojiFace mood={2} size={size} />;
