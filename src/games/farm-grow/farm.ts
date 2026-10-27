// Farm Grow (roster Stage 9), rebuilt from the Dashboard's Farm Grow logic
// with code-drawn art: right answers earn farm jobs; tap plots to plant,
// water and harvest; watered crops grow one stage overnight.

export const CROPS = ['corn', 'pumpkin', 'sunflower', 'tomato'] as const;
export type Crop = (typeof CROPS)[number];
export const PLOTS = 9;
export interface Plot { crop: Crop | null; stage: 0 | 1 | 2 | 3; watered: boolean }
export const emptyField = (): Plot[] => Array.from({ length: PLOTS }, () => ({ crop: null, stage: 0, watered: false }));

// What a tap on a plot does next.
export type Job = 'plant' | 'water' | 'harvest' | 'wait';
export function jobFor(p: Plot): Job {
  if (!p.crop) return 'plant';
  if (p.stage === 3) return 'harvest';
  return p.watered ? 'wait' : 'water';
}

export function doJob(field: Plot[], i: number, crop: Crop): { field: Plot[]; job: Job; harvested?: Crop } {
  const p = field[i], job = jobFor(p);
  if (job === 'wait') return { field, job };
  const next = field.slice();
  if (job === 'plant') next[i] = { crop, stage: 0, watered: false };
  if (job === 'water') next[i] = { ...p, watered: true };
  if (job === 'harvest') { next[i] = { crop: null, stage: 0, watered: false }; return { field: next, job, harvested: p.crop! }; }
  return { field: next, job };
}

// Night: every watered crop grows one stage. Rain waters every planted plot first.
export function overnight(field: Plot[], rain = false): Plot[] {
  return field.map((p) => {
    if (!p.crop) return p;
    const watered = p.watered || rain;
    return watered && p.stage < 3 ? { crop: p.crop, stage: (p.stage + 1) as 1 | 2 | 3, watered: false } : { ...p, watered: false };
  });
}

export const FACTS: Record<Crop, string> = {
  corn: 'One ear of corn has about 800 kernels in rows.',
  pumpkin: 'Pumpkins grow on long vines that creep along the ground.',
  sunflower: 'Young sunflowers turn to follow the sun across the sky.',
  tomato: 'A tomato is really a fruit because it has seeds inside.',
};
