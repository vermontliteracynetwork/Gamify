import { useEffect, useState } from 'react';
import { MagnifyingGlass, X } from '@phosphor-icons/react';
import type { MediaItem } from '../../api/media';
import Gif from './Gif';
import { Button, Tabs } from './kit';

// GIF and photo search for teachers (teacher, 2026-11-23): GIPHY GIFs and
// Unsplash photos, family-safe only, with the credit each service asks for.
// Used where a teacher adds a picture (question sets, themes); students only
// ever see the picture a teacher picked.
export interface PickedMedia { url: string; alt: string; credit?: string; still?: string }

export default function MediaSearch({ onPick, onClose }: { onPick: (m: PickedMedia) => void; onClose: () => void }) {
  const [kind, setKind] = useState<'gif' | 'photo'>('gif');
  const [q, setQ] = useState('');
  const [sent, setSent] = useState('');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [state, setState] = useState<'idle' | 'loading' | 'setup' | 'error'>('idle');
  useEffect(() => {
    if (kind === 'photo' && !sent) { setItems([]); setState('idle'); return; }
    let live = true;
    setState('loading');
    fetch(`/api/media?kind=${kind}&q=${encodeURIComponent(sent)}`)
      .then(async (r) => {
        if (!live) return;
        if (r.status === 503) { setState('setup'); setItems([]); return; }
        if (!r.ok) { setState('error'); return; }
        const body = (await r.json()) as { items: MediaItem[] };
        setItems(body.items); setState('idle');
      })
      .catch(() => { if (live) setState('error'); });
    return () => { live = false; };
  }, [kind, sent]);
  function pick(m: MediaItem) {
    if (m.download) void fetch(`/api/media?kind=track&loc=${encodeURIComponent(m.download)}`).catch(() => undefined);
    onPick({ url: m.url, alt: m.alt, still: m.still, credit: m.credit ? `Photo by ${m.credit.name} on Unsplash` : m.source === 'giphy' ? 'GIF via GIPHY' : undefined });
  }
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/35 p-4" role="dialog" aria-modal="true" aria-label="Find a GIF or photo">
      <div className="w-full max-w-4xl max-h-[calc(100dvh-2rem)] bg-surface border-heavy border-border rounded-panel grid grid-rows-[auto_auto_1fr_auto] gap-3 p-5" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
        <div className="flex items-center gap-3">
          <h2 className="font-heading font-bold text-xl flex-1">Find a GIF or photo</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="w-11 h-11 rounded-full border-std border-border bg-white flex items-center justify-center"><X weight="bold" size={18} /></button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Tabs label="What to find" value={kind} onChange={setKind} className="mb-0" options={[{ id: 'gif', label: 'GIFs' }, { id: 'photo', label: 'Photos' }]} />
          <form className="flex-1 min-w-[14rem] flex gap-2" onSubmit={(e) => { e.preventDefault(); setSent(q.trim()); }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={kind === 'gif' ? 'Search GIFs (family safe)' : 'Search photos (family safe)'} aria-label="Search words"
              className="flex-1 min-h-11 px-3 rounded-input border-std border-border bg-surface font-semibold" />
            <Button type="submit" variant="main"><MagnifyingGlass weight="bold" size={18} />Search</Button>
          </form>
        </div>
        <div className="min-h-[12rem] overflow-y-auto">
          {state === 'setup' && <p className="font-semibold text-muted p-4">{kind === 'gif' ? 'GIF search is not switched on yet (it needs the GIPHY key in Vercel).' : 'Photo search is not switched on yet (it needs the Unsplash key in Vercel).'}</p>}
          {state === 'error' && <p className="font-semibold text-muted p-4">Search is not working right now. Try again in a moment.</p>}
          {state === 'loading' && <p className="font-semibold text-muted p-4">Looking...</p>}
          {state === 'idle' && kind === 'photo' && !sent && <p className="font-semibold text-muted p-4">Type a word and tap Search.</p>}
          {state === 'idle' && sent && items.length === 0 && <p className="font-semibold text-muted p-4">Nothing found. Try another word.</p>}
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-2 list-none m-0 p-0">
            {items.map((m) => (
              <li key={m.id}>
                <button type="button" onClick={() => pick(m)} className="w-full rounded-input border-std border-border-soft overflow-hidden bg-surface-2 motion-safe:hover:scale-[1.03] motion-safe:transition-transform" title={m.alt}>
                  {m.source === 'giphy' ? <Gif src={m.preview} still={m.still} alt={m.alt} className="w-full h-28 object-cover" /> : <img src={m.preview} alt={m.alt} className="w-full h-28 object-cover" loading="lazy" />}
                </button>
                {m.credit && <a href={m.credit.link} target="_blank" rel="noreferrer" className="block text-[11px] font-semibold text-muted truncate px-0.5">Photo by {m.credit.name}</a>}
              </li>
            ))}
          </ul>
        </div>
        {/* The credit each service requires, always shown where search is used. */}
        <p className="text-xs font-bold text-muted text-right">
          {kind === 'gif' ? 'Powered by GIPHY' : <>Photos from <a href="https://unsplash.com/?utm_source=gamify&utm_medium=referral" target="_blank" rel="noreferrer">Unsplash</a></>}
        </p>
      </div>
    </div>
  );
}
