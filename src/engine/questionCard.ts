// THE question card (Universal views 10, approved /brand 2026-11-25), shared
// by the solo question screen and the Share question: A to D tiles in
// Lavender, Blue crystal, Blush and Butter, each with its letter on a filled
// badge (Grape with white text, Sky, Pink, Lemon), so the letter as well as
// the color tells them apart.
export const LETTERS = ['A', 'B', 'C', 'D'];
export const TILE_COLORS = ['bg-lavender', 'bg-blue-crystal', 'bg-blush', 'bg-butter'];
export const BADGE_COLORS = ['bg-grape text-white', 'bg-sky', 'bg-pink', 'bg-lemon'];
// Sizes come from the mockup's own drawing (1280 x 800 laptop, 820 x 1180
// iPad portrait, 390 x 844 phone), scaled to the screen by --u (src/index.css
// .q-card); text also follows the Text size setting.
export const qpx = (v: string) => `calc(var(${v}) * var(--u))`;
export const qfpx = (v: string, k = 1) => `calc(var(${v}) * var(--u) * var(--text-scale, 1) * ${k})`;
// The question steps down as it gets longer; the block around it never moves.
export const qStep = (n: number) => (n <= 60 ? '--q-fs1' : n <= 110 ? '--q-fs2' : n <= 180 ? '--q-fs3' : '--q-fs4');
// Every tile keeps one size (teacher, 2026-11-24); long answers step their text down together.
export const answerScale = (choices: string[]) => { const n = Math.max(...choices.map((c) => c.length)); return n <= 22 ? 1 : n <= 45 ? 0.8 : 0.66; };
