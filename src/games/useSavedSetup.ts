import { useEffect, useState } from 'react';
import { data } from '../data';

// A game's setup choices (board, sets, options, theme...) remembered per
// game on this device, so a teacher sets a game up once.
export function useSavedSetup<T extends object>(gameId: string, defaults: T): [T, (patch: Partial<T>) => void] {
  const [value, setValue] = useState<T>(defaults);
  useEffect(() => {
    let live = true;
    data.getSetting<Partial<T>>(`setup:${gameId}`).then((v) => { if (live && v) setValue((cur) => ({ ...cur, ...v })); });
    return () => { live = false; };
  }, [gameId]);
  function update(patch: Partial<T>) {
    setValue((cur) => {
      const next = { ...cur, ...patch };
      void data.setSetting(`setup:${gameId}`, next);
      return next;
    });
  }
  return [value, update];
}
