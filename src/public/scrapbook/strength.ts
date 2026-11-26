import { createContext, useContext } from 'react';

// How strong the scrapbook is on a page (owner, 2026-11-26, picked on /brand
// Scrapbook): A clean (papers and stickers at the edges, nothing tilted or
// taped), B with washi tape and small tilts at the edges, C with tape and
// tilt on text cards too. Kept in its own tiny file so a page can set it
// without loading the kit's papers and stickers.
export type Strength = 'A' | 'B' | 'C';
const Ctx = createContext<Strength>('A');
export const StrengthProvider = Ctx.Provider;
export const useStrength = () => useContext(Ctx);
