import { createClient } from '@supabase/supabase-js';

// Gamify's own Supabase project (cloud accounts, Stage 5). Both values are
// public by design (publishable key + row level security). Without them, as
// in tests and local builds, the app keeps everything on the device.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase = url && key ? createClient(url, key) : null;

// Supabase ids are uuids; the app's ids are `prefix_<uuid>`. A uuid inside an
// id is used as is; any other id becomes the same made-up uuid every time,
// so things that point at it stay linked.
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function toUuid(id: string): string {
  const m = id.match(UUID);
  if (m) return m[0].toLowerCase();
  let h = [0x811c9dc5, 0x01000193, 0x12345678, 0x9e3779b9];
  for (let i = 0; i < id.length; i++) h = h.map((x, k) => Math.imul(x ^ id.charCodeAt(i), 16777619 + k * 2) >>> 0);
  const hex = h.map((x) => x.toString(16).padStart(8, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}
// For text columns: a uuid-bearing id is stored as its uuid, anything else
// (built-in library sets, guests) as it is.
export const normId = (id: string) => id.match(UUID)?.[0].toLowerCase() ?? id;
