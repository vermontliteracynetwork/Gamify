import { useEffect, useRef, type DependencyList, type RefObject } from 'react';
import { useSettings } from '../../settings/SettingsContext';
import type { Motion } from '../../settings/settings';

// anime.js (animejs.com) for the moves Motion is not built for: timelines of
// many steps, SVG line drawing and morphing, staggered grids, text split into
// letters. Everything is scoped to `root` and reverted on unmount, so nothing
// leaks between screens. On Still the setup never runs: write animations as
// "from" moves (`{ opacity: { from: 0 } }`) so the resting CSS is the final
// look. On Gentle, `level` lets the setup shrink distances or skip bounces.
// The library loads on first use, so pages without it stay light.
export type AnimeModule = typeof import('animejs');
export type AnimeSetup = (anime: AnimeModule, level: Exclude<Motion, 'still'>) => void | (() => void);

export function useAnime<T extends HTMLElement | SVGElement = HTMLDivElement>(setup: AnimeSetup, deps: DependencyList = []): RefObject<T> {
  const root = useRef<T>(null);
  const level = useSettings().settings.motion;
  useEffect(() => {
    if (level === 'still' || !root.current) return;
    let cancelled = false;
    let revert: (() => void) | undefined;
    void import('animejs').then((anime) => {
      if (cancelled || !root.current) return;
      const scope = anime.createScope({ root: root.current as unknown as HTMLElement }).add(() => setup(anime, level));
      revert = () => scope.revert();
    });
    return () => { cancelled = true; revert?.(); };
  }, [level, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
  return root;
}
