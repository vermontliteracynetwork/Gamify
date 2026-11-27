import { useEffect, useState } from 'react';
import { ArrowRight, ArrowSquareOut, CheckCircle, Circle, DownloadSimple, Siren, Trash, X } from '@phosphor-icons/react';
import { data } from '../data';
import { Link } from 'react-router-dom';
import { WAITING, doLinks, type WaitingItem } from './waiting';
import { FOCUS_KEY, FOCUS_LISTS } from './focus';
import photoRelease from '../../docs/photo-release.md?raw';

// Executive functioning support on the developer portal (owner, 2026-11-27):
// the Chief of Staff's urgent three as a pop-up when the portal opens, the
// Do first view (urgent items, big and colored), the saved checklists, and
// drafts to keep (the photo release).
const DONE_KEY = 'owner-waiting-done';

export function useUrgent() {
  const [done, setDone] = useState<string[] | null>(null);
  useEffect(() => { void data.getSetting<string[]>(DONE_KEY).then((v) => setDone(v ?? [])); }, []);
  const urgent = done ? WAITING.filter((w) => w.urgent && !done.includes(w.id)) : [];
  const tick = (id: string) => { const next = [...(done ?? []), id]; setDone(next); void data.setSetting(DONE_KEY, next); };
  return { urgent, tick, ready: done !== null };
}

// Where to go: buttons for each item (GitHub for SQL and files, the service's
// dashboard, or the portal view).
export function DoLinks({ w, small = false }: { w: WaitingItem; small?: boolean }) {
  const links = doLinks(w);
  if (!links.length) return null;
  const cls = `${small ? 'min-h-9 px-3 text-sm' : 'min-h-11 px-4'} rounded-full border-2 border-[#1d1a33] bg-white font-bold inline-flex items-center gap-1.5 no-underline text-[#1d1a33] hover:bg-[#ede9fe]`;
  return (
    <span className="flex flex-wrap gap-2">
      {links.map((l) => l.external
        ? <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className={cls}>{l.label}<ArrowSquareOut weight="bold" size={14} aria-hidden="true" /></a>
        : <Link key={l.href} to={l.href} className={cls}>{l.label}<ArrowRight weight="bold" size={14} aria-hidden="true" /></Link>)}
    </span>
  );
}

// Opens every time the portal opens (each login) while any urgent item is
// neither done nor removed from the pop-up (owner, 2026-11-27: "pop up with
// messages like this on login until all completed or closed out/deleted").
const GONE_KEY = 'owner-urgent-dismissed';
export function UrgentPopup({ onOpen }: { onOpen: () => void }) {
  const { urgent, tick, ready } = useUrgent();
  const [gone, setGone] = useState<string[] | null>(null);
  const [closed, setClosed] = useState(false);
  useEffect(() => { void data.getSetting<string[]>(GONE_KEY).then((v) => setGone(v ?? [])); }, []);
  const left = urgent.filter((w) => !(gone ?? []).includes(w.id));
  // Browser tests drive the portal with no person to close it; they opt in with gamify:test-popup.
  const automated = typeof navigator !== 'undefined' && navigator.webdriver && !(() => { try { return localStorage.getItem('gamify:test-popup'); } catch { return null; } })();
  if (!ready || gone === null || closed || !left.length || automated) return null;
  const remove = (id: string) => { const next = [...gone, id]; setGone(next); void data.setSetting(GONE_KEY, next); };
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="urgent-title" className="fixed inset-0 z-50 grid place-items-center bg-[rgba(29,26,51,0.45)] p-4 overflow-auto">
      <div className="w-full max-w-xl bg-white rounded-[1.5rem] border-[3px] border-[#1d1a33] p-6 grid gap-4" style={{ boxShadow: '0 8px 0 #1d1a33' }}>
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-full bg-[#f055a5] text-white grid place-items-center shrink-0"><Siren weight="fill" size={26} aria-hidden="true" /></span>
          <h2 id="urgent-title" className="text-2xl font-bold flex-1 m-0">Do these first</h2>
          <button type="button" onClick={() => setClosed(true)} aria-label="Close for now" className="w-11 h-11 rounded-full border-2 border-[#1d1a33] grid place-items-center"><X weight="bold" size={18} /></button>
        </div>
        <ol className="grid gap-2 list-none p-0 m-0">{left.map((w, i) => (
          <li key={w.id} className="grid gap-2 rounded-[1rem] bg-[#fff1b8] border-2 border-[#1d1a33] px-4 py-3">
            <span className="flex items-center gap-3 font-bold"><span className="w-8 h-8 rounded-full bg-white border-2 border-[#1d1a33] grid place-items-center shrink-0">{i + 1}</span><span className="flex-1">{w.title}</span>
              <button type="button" onClick={() => tick(w.id)} aria-label={`Done: ${w.title}`} title="Done" className="w-10 h-10 rounded-full bg-white border-2 border-[#1d1a33] grid place-items-center"><CheckCircle weight="bold" size={18} /></button>
              <button type="button" onClick={() => remove(w.id)} aria-label={`Remove from the pop-up: ${w.title}`} title="Remove from the pop-up" className="w-10 h-10 rounded-full bg-white border-2 border-[#1d1a33] grid place-items-center"><Trash weight="bold" size={18} /></button>
            </span>
            <DoLinks w={w} small />
          </li>
        ))}</ol>
        <button type="button" onClick={() => { setClosed(true); onOpen(); }} className="min-h-14 rounded-full bg-[#6a45f0] text-white font-bold text-lg">Open Do first</button>
      </div>
    </div>
  );
}

function UrgentRow({ w, n, onTick }: { w: WaitingItem; n: number; onTick: () => void }) {
  return (
    <li className="grid sm:grid-cols-[auto_1fr_auto] gap-4 items-center rounded-[1.25rem] border-[3px] border-[#1d1a33] bg-[#fff1b8] p-4 sm:p-5" style={{ boxShadow: '0 5px 0 #1d1a33' }}>
      <span className="w-12 h-12 rounded-full bg-[#f055a5] text-white grid place-items-center font-bold text-xl">{n}</span>
      <div className="grid gap-1 min-w-0">
        <p className="font-bold text-xl leading-tight m-0">{w.title}</p>
        <DoLinks w={w} />
        <details><summary className="cursor-pointer font-bold text-sm">What to do</summary><p className="text-sm font-semibold mt-1 mb-0">{w.how}</p><p className="text-sm text-[#57506e] mt-1 mb-0">{w.why}</p></details>
      </div>
      <button type="button" onClick={onTick} className="min-h-12 px-5 rounded-full bg-white border-2 border-[#1d1a33] font-bold inline-flex items-center gap-2"><CheckCircle weight="bold" size={20} />Done</button>
    </li>
  );
}

export function DoFirstCard({ go }: { go: (id: string) => void }) {
  const { urgent, tick, ready } = useUrgent();
  return (
    <div className="grid gap-8">
      <section aria-labelledby="urgent-h" className="grid gap-3">
        <h2 id="urgent-h" className="text-xl font-bold flex items-center gap-2"><Siren weight="fill" size={22} color="#f055a5" aria-hidden="true" />Urgent</h2>
        {ready && !urgent.length && <p className="font-bold text-lg">Nothing urgent. Nice.</p>}
        <ol className="grid gap-3 list-none p-0 m-0">{urgent.map((w, i) => <UrgentRow key={w.id} w={w} n={i + 1} onTick={() => tick(w.id)} />)}</ol>
        <button type="button" onClick={() => go('waiting')} className="justify-self-start font-bold underline underline-offset-4">Everything waiting on you</button>
      </section>
      <ChecklistsCard compact />
    </div>
  );
}

export function ChecklistsCard({ compact = false }: { compact?: boolean }) {
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => { void data.getSetting<string[]>(FOCUS_KEY).then((v) => setDone(v ?? [])); }, []);
  const toggle = (id: string) => { const next = done.includes(id) ? done.filter((x) => x !== id) : [...done, id]; setDone(next); void data.setSetting(FOCUS_KEY, next); };
  return (
    <section aria-label="Checklists" className="grid gap-4">
      {compact && <h2 className="text-xl font-bold">Checklists</h2>}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
        {FOCUS_LISTS.map((l) => {
          const n = l.items.filter((x) => done.includes(x.id)).length;
          const pct = Math.round((n / l.items.length) * 100);
          return (
            <details key={l.id} className="group rounded-[1.25rem] border-[3px] border-[#1d1a33] bg-white p-4" style={{ boxShadow: '0 4px 0 #1d1a33' }} open={!compact}>
              <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden grid gap-2">
                <span className="flex items-center gap-2"><b className="text-lg flex-1">{l.title}</b><span className="font-bold tabular-nums">{n}/{l.items.length}</span></span>
                <span className="block h-3 rounded-full bg-[#f6f0e4] overflow-hidden" aria-hidden="true"><span className="block h-full rounded-full bg-[#22b04a]" style={{ width: `${pct}%` }} /></span>
                <span className="text-sm text-[#57506e] font-semibold">{l.why}</span>
              </summary>
              <ul className="grid gap-1.5 list-none p-0 mt-3 mb-0">
                {l.items.map((x) => {
                  const on = done.includes(x.id);
                  return (
                    <li key={x.id} className="flex items-center gap-1.5"><button type="button" role="checkbox" aria-checked={on} onClick={() => toggle(x.id)} className={`flex-1 min-h-11 rounded-[0.8rem] border-2 px-3 flex items-center gap-2 text-left font-semibold ${on ? 'border-transparent bg-[#c8f0dc]' : 'border-[#d6cff0] bg-white'}`}>
                      {on ? <CheckCircle weight="fill" size={22} color="#22b04a" aria-hidden="true" /> : <Circle weight="bold" size={22} aria-hidden="true" />}<span className={on ? 'line-through' : ''}>{x.label}</span>
                    </button>{x.to && <Link to={x.to} aria-label={`Go to: ${x.label}`} title="Go there" className="w-11 h-11 shrink-0 rounded-full border-2 border-[#1d1a33] grid place-items-center text-[#1d1a33]"><ArrowRight weight="bold" size={16} /></Link>}</li>
                  );
                })}
              </ul>
            </details>
          );
        })}
      </div>
    </section>
  );
}

export function DraftsCard() {
  const download = () => {
    const url = URL.createObjectURL(new Blob([photoRelease], { type: 'text/markdown' }));
    const a = document.createElement('a'); a.href = url; a.download = 'gamify-photo-release-draft.md'; a.click(); URL.revokeObjectURL(url);
  };
  return (
    <div className="grid gap-4">
      <details open className="rounded-[1.25rem] border-[3px] border-[#1d1a33] bg-white p-5" style={{ boxShadow: '0 4px 0 #1d1a33' }}>
        <summary className="cursor-pointer font-bold text-lg">Photo and video release (draft for the attorney)</summary>
        <div className="flex flex-wrap gap-2 my-3">
          <button type="button" onClick={download} className="min-h-11 px-4 rounded-full border-2 border-[#1d1a33] font-bold inline-flex items-center gap-2"><DownloadSimple weight="bold" size={18} />Download</button>
          <button type="button" onClick={() => void navigator.clipboard.writeText(photoRelease)} className="min-h-11 px-4 rounded-full border-2 border-[#1d1a33] font-bold">Copy text</button>
        </div>
        <pre className="whitespace-pre-wrap font-[inherit] text-sm leading-relaxed m-0 max-h-[60vh] overflow-auto">{photoRelease}</pre>
      </details>
    </div>
  );
}

// The top of the portal home: the urgent count as one big colored bar (a quick
// scan in five seconds); it opens Do first.
export function DoFirstStrip({ go }: { go: (id: string) => void }) {
  const { urgent, ready } = useUrgent();
  if (!ready) return null;
  return (
    <button type="button" onClick={() => go('focus')} className={`w-full text-left rounded-[1.5rem] border-[3px] border-[#1d1a33] p-5 sm:p-6 grid sm:grid-cols-[auto_1fr_auto] gap-4 items-center ${urgent.length ? 'bg-[#f055a5] text-white' : 'bg-[#c8f0dc]'}`} style={{ boxShadow: '0 6px 0 #1d1a33' }}>
      <span className="w-14 h-14 rounded-full bg-white text-[#1d1a33] grid place-items-center text-2xl font-bold">{urgent.length}</span>
      <span className="grid gap-1"><b className="text-2xl">{urgent.length ? 'Urgent: do these first' : 'Nothing urgent'}</b>{urgent[0] && <span className="font-semibold">{urgent.map((w) => w.title).join(' · ')}</span>}</span>
      <span className="font-bold underline underline-offset-4">Do first</span>
    </button>
  );
}
