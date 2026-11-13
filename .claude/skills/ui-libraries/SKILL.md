---
name: ui-libraries
description: Gamify's animation and chart system. Use before adding or changing any animation, transition, power-up effect, SVG drawing, text effect, or chart/graph in Gamify, to pick between Motion (motion/react), anime.js (useAnime) and the shadcn-style Recharts chart kit, and to follow the shared presets, Motion setting and bundle rules.
---

# Gamify UI libraries

1. Read `docs/ui-libraries.md` (which library, presets, rules).
2. UI motion: Motion with presets from `src/ui/motion`. Timelines, SVG
   drawing/morphing, letter or grid staggers: `useAnime` from `src/ui/motion`.
   Charts: `src/ui/chart` (`ChartContainer`, `ChartTooltipContent`,
   `ChartLegendContent`, `AXIS`, `BAR`, `useChartAnimate`).
3. Honor the Motion setting (Full / Gentle / Still) and game pace.
4. Charts load only from lazy pages; every chart has a `label` summary.
5. Games still pass the golden-rule skill; libraries never replace the
   teacher's assets or references.
6. New library or version: add it to `docs/asset-ledger.md` first.
7. Reference sites: motion.dev/docs/react, animejs.com/documentation,
   ui.shadcn.com/docs/components/chart (allow these hosts in the cloud
   environment's network settings to read them from a session).
