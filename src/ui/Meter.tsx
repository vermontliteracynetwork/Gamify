// THE meter (Brand Kit, teacher 2026-11-24: "more modern and theme aligned"),
// the live copy of the /brand Game components meter: one rounded track with a
// soft inner shadow and an ink edge; segments are gentle gaps inside it; done
// segments are Kelly, the current one Lemon with a small glowing marker at its
// edge, later ones stay track. Used by the solo top strip, the team round
// meter and goal bars.
export const METER_H = 22;
const fill = (c: string) => `linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 55%), ${c}`;

export default function Meter({ segments = 1, done = 0, part = 1, width = '100%', label, height = METER_H }: { segments?: number; done?: number; part?: number; width?: number | string; label: string; height?: number }) {
  return (
    <span role="img" aria-label={label} className="inline-flex items-stretch gap-[4px] rounded-full p-[3px] shrink-0 min-w-0"
      style={{ width, height, background: '#eeeaf8', border: '2.5px solid var(--color-border)', boxShadow: 'inset 0 2px 4px rgba(29,26,51,0.22)', boxSizing: 'border-box' }}>
      {Array.from({ length: Math.max(1, segments) }, (_, i) => {
        const cur = i === done && done < segments;
        return (
          <span key={i} className="flex-1 relative rounded-full" style={{ background: i < done ? fill('var(--kelly)') : 'rgba(29,26,51,0.06)' }}>
            {cur && part > 0 && (
              <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.max(part, 0.12) * 100}%`, background: fill('var(--lemon)') }}>
                <span className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 rounded-full" style={{ width: height - 4, height: height - 4, background: 'var(--paper)', border: '2.5px solid var(--color-border)', boxShadow: '0 0 0 3px rgba(250,190,55,0.55), 0 0 10px 3px rgba(250,190,55,0.6)' }} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
