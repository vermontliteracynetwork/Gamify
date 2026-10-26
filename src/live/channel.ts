import { supabase } from '../data/supabase';

// One message channel for live games, Versus and Share Mirror: tabs on the
// same device hear each other through BroadcastChannel, and with cloud
// accounts on, other devices hear the same messages through Supabase
// Realtime (no tables, nothing stored). A message heard both ways is used once.
export interface Channel<T> { send(msg: T): void; listen(fn: (msg: T) => void): () => void; close(): void }

type Wrapped<T> = { id: string; m: T };
const newMsgId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

export function openChannel<T>(name: string): Channel<T> {
  const fns = new Set<(m: T) => void>();
  const seen = new Set<string>();
  const deliver = (w: Wrapped<T>) => {
    if (!w || seen.has(w.id)) return;
    seen.add(w.id);
    if (seen.size > 500) seen.delete(seen.values().next().value as string);
    fns.forEach((fn) => fn(w.m));
  };
  const local = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(`gamify-${name}`) : null;
  if (local) local.onmessage = (e) => deliver(e.data as Wrapped<T>);

  // Cloud: messages wait until the channel is open, then go out in order.
  let ready = false;
  const queue: Wrapped<T>[] = [];
  const cloud = supabase?.channel(`gamify-${name}`, { config: { broadcast: { self: false } } });
  cloud?.on('broadcast', { event: 'm' }, ({ payload }) => deliver(payload as Wrapped<T>))
    .subscribe((status) => {
      if (status !== 'SUBSCRIBED') return;
      ready = true;
      for (const w of queue.splice(0)) void cloud.send({ type: 'broadcast', event: 'm', payload: w });
    });

  return {
    send(m) {
      const w = { id: newMsgId(), m };
      seen.add(w.id);
      local?.postMessage(w);
      if (cloud) { if (ready) void cloud.send({ type: 'broadcast', event: 'm', payload: w }); else queue.push(w); }
    },
    listen(fn) { fns.add(fn); return () => fns.delete(fn); },
    close() { local?.close(); if (cloud) void supabase!.removeChannel(cloud); },
  };
}
