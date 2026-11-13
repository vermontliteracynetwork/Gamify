# UI libraries: Motion, anime.js and charts

How Gamify uses its three presentation libraries, so every screen moves and
charts the same way. Set up 2026-11-13 from motion.dev, animejs.com and
ui.shadcn.com/docs/components/chart. The skill
`.claude/skills/ui-libraries/SKILL.md` points future work here.

| Need | Use | Import |
|---|---|---|
| A React element enters, leaves, moves, reorders, reacts to hover/tap | **Motion** (motion.dev) | `motion/react` + presets from `src/ui/motion` |
| A many-step sequence, SVG line drawing or morphing, a staggered grid, letters of a title, a game-piece path | **anime.js** v4 (animejs.com) | `useAnime` from `src/ui/motion` (loads the library on first use) |
| A chart of numbers (reports, owner desk, marketing pages) | **Chart kit** = shadcn/ui chart pattern over Recharts | `src/ui/chart` + `recharts` |
| Plain CSS transitions (hover colors, focus rings) | Tailwind / CSS | `motion-safe:` variant |

Pick one per element. Don't animate the same property with two libraries.

## Motion (default for UI motion)

- Start from `SPRING`, `EASE`, `DURATION`, `PRESS`, `fadeUp`, `popIn` and
  `staggerList` in `src/ui/motion/presets.ts`; add a preset there rather than
  a one-off number. `SPRING.pop` is the existing `POP_IN` (teacher,
  2026-11-01: slow enough to follow).
- Game stages multiply durations by `pace(settings)` (`src/engine/pace.ts`).
- Prefer `transform` and `opacity` (GPU) over width/height/top/left. Use
  `layout` / `layoutId` for reorders and shared-element moves.
- `AnimatePresence` for anything that leaves (results box, toasts, cards).
- The Motion setting: `MotionRoot` (in `App.tsx`) sets
  `MotionConfig reducedMotion="always"` on **Still**, so movement stops
  everywhere even if a component forgets. Components still check
  `useReducedMotion()` (`src/ui/useReducedMotion.ts`) to skip `initial`
  states and to soften on **Gentle**.

## anime.js (timelines, SVG, text, staggers)

```tsx
const ref = useAnime((a, level) => {
  a.animate('.tile', { scale: { from: 0 }, delay: a.stagger(60), ease: level === 'gentle' ? 'out(3)' : 'outElastic(1, .6)' });
});
return <div ref={ref}>…</div>;
```

- Everything runs inside `createScope({ root })` and is reverted on unmount.
- On **Still** the setup never runs, so write "from" moves: the resting CSS is
  the final look. On **Gentle** use `level` to drop bounces and distance.
- Good fits: `createTimeline` for a power-up's multi-step reveal,
  `svg.createDrawable` to draw a path or trophy outline, `svg.morphTo`,
  `text.split` for a title that pops letter by letter, `stagger` from the
  center of a grid, `createDraggable` with spring snap-back.
- Selectors are scoped to the root ref; never target `document`.

## Charts (shadcn/ui pattern, Recharts)

```tsx
const config = { right: { label: 'Right' }, missed: { label: 'Missed' } } satisfies ChartConfig;
<ChartContainer config={config} label="Right and missed by day: 120 right, 18 missed" height={200}>
  <BarChart data={rows}>
    <XAxis dataKey="day" {...AXIS} />
    <ChartTooltip content={<ChartTooltipContent />} />
    <ChartLegend content={<ChartLegendContent />} />
    <Bar dataKey="right" fill="var(--color-right)" {...BAR} isAnimationActive={useChartAnimate()} />
    <Bar dataKey="missed" fill="var(--color-missed)" {...BAR} isAnimationActive={useChartAnimate()} />
  </BarChart>
</ChartContainer>
```

- Colors: series default to `--chart-1`…`--chart-6` in `src/index.css`
  (brand periwinkle, green, salmon, navy, coral, yellow), exposed as
  `--color-<key>`. Every mark keeps the black sticker outline (`BAR`).
- Accessibility: `label` is required (screen-reader summary with the totals);
  a legend or labels name every series; color is never the only cue. Keep
  the data table or CSV download beside a chart on teacher pages.
- Bundle: Recharts is ~350 kB raw. Import the chart kit **only from
  lazy-loaded pages** (`lazyPage` in `App.tsx`), never from a module the app
  shell imports. The owner growth chart lives in `src/owner/GrowthChart.tsx`
  for this reason.
- Student screens: no charts of rankings or comparisons between children.

## Checks before calling motion or a chart done

- Frame-check motion (`docs/testing-standards.md`) at laptop and iPad.
- Try Motion on Full, Gentle and Still.
- No console errors or warnings; main bundle size unchanged unless intended.
