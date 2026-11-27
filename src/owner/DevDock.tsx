import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { Code, Eye, PaintBrush, Robot, Siren, SquaresFour, X } from '@phosphor-icons/react';
import { previewTier, setPreviewTier } from '../data';
import type { Tier } from '../config';
import { useIsOwner } from './useIsOwner';
import { startBots, type BotRun } from './botClass';

// The owner's floating developer menu (owner, 2026-11-27: "in the magenta
// color of the developer portal button, i want a floating menu that i can
// collapse into a single button (open into a menu on double click) ... change
// my view to the different plans (free, plus, pro, homeschool) in all the
// pages and also have other tools that can help me simulate X number of
// students (all computer) for live games"). Only her account ever sees it.
// Double-click (or double-tap) the button to open; the X collapses it; drag it anywhere.
const MAGENTA = '#f055a5';
const PLANS: Tier[] = ['free', 'plus', 'pro', 'homeschool'];
// v2: the old saved spots could leave it stuck off screen (owner, 2026-11-27); everyone starts bottom right again.
const POS = 'gamify:devdock-pos-v2';
// Its home is the bottom-right corner; it always comes back inside the screen.
const HOME = () => ({ x: window.innerWidth - 76, y: window.innerHeight - 76 });

export default function DevDock() {
  const owner = useIsOwner();
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<string | null>(previewTier());
  const [code, setCode] = useState('');
  const [count, setCount] = useState(12);
  const [acc, setAcc] = useState(75);
  const [running, setRunning] = useState<BotRun | null>(null);
  const [phase, setPhase] = useState('');
  const lastTap = useRef(0);
  // Drag it anywhere (owner, 2026-11-27: "allow me to move developer button around on drag"); the spot is remembered.
  const [pos, setPos] = useState<{ x: number; y: number }>(() => { try { const v = JSON.parse(localStorage.getItem(POS) ?? 'null'); if (v && typeof v.x === 'number') return v; } catch { /* first time */ } return HOME(); });
  const drag = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);
  const clamp = (p: { x: number; y: number }) => ({ x: Math.max(4, Math.min(window.innerWidth - 60, p.x)), y: Math.max(4, Math.min(window.innerHeight - 60, p.y)) });
  useEffect(() => { const f = () => setPlan(previewTier()); window.addEventListener('gamify-tier', f); return () => window.removeEventListener('gamify-tier', f); }, []);
  useEffect(() => () => running?.stop(), [running]);
  useEffect(() => { const f = () => setPos((p) => clamp(p)); f(); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!owner) return null;
  const pick = (t: Tier | null) => { setPreviewTier(t); setPlan(t); };
  // Closed: a double-click opens it. Open: one click on the button closes it.
  const tap = () => { if (open) { setOpen(false); return; } const now = Date.now(); if (now - lastTap.current < 400) setOpen(true); lastTap.current = now; };
  const down = (e: RPointerEvent) => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y, moved: false }; };
  const move = (e: RPointerEvent) => { const d = drag.current; if (!d) return; const next = clamp({ x: e.clientX - d.dx, y: e.clientY - d.dy }); if (Math.abs(next.x - pos.x) + Math.abs(next.y - pos.y) > 3) d.moved = true; if (d.moved) setPos(next); };
  const up = (fromHeader = false) => { const d = drag.current; drag.current = null; if (!d) return; if (d.moved) { try { localStorage.setItem(POS, JSON.stringify(pos)); } catch { /* fine */ } } else if (!fromHeader) tap(); };
  // The button always sits where it was put (owner, 2026-11-27: "i want the
  // circle developer button icon to stay on the bottom right of the menu even
  // when it is opened so i can click to close and use it to move. also allow me
  // to move the card itself"). The open menu hangs above and to the left of it.
  const button = (
    // No text or label on it, ever (owner, 2026-11-27); the name is for screen readers only.
    <button type="button" onPointerDown={down} onPointerMove={move} onPointerUp={() => up()} onKeyDown={(e) => { if (e.key === 'Enter') setOpen(!open); }} aria-label="Developer menu" aria-expanded={open}
      className="no-print fixed z-[81] w-14 h-14 rounded-full border-[3px] border-[#1d1a33] grid place-items-center text-white touch-none cursor-grab active:cursor-grabbing" style={{ left: pos.x, top: pos.y, background: MAGENTA, boxShadow: '0 4px 0 #1d1a33' }}>
      {open ? <X weight="bold" size={24} aria-hidden="true" /> : <Code weight="bold" size={26} aria-hidden="true" />}
    </button>
  );
  if (!open) return button;
  const W = Math.min(352, window.innerWidth - 32);
  const menuLeft = Math.max(8, Math.min(window.innerWidth - W - 8, pos.x + 56 - W + 20));
  const menuBottom = Math.max(8, window.innerHeight - pos.y - 36);
  const menuMaxH = window.innerHeight - menuBottom - 16;
  const btn = (on: boolean) => `min-h-10 px-3 rounded-full border-2 border-[#1d1a33] font-bold text-sm ${on ? 'bg-[#1d1a33] text-white' : 'bg-white'}`;
  return (
    <>
    <div role="dialog" aria-label="Developer menu" className="no-print fixed z-[80] rounded-[1.25rem] border-[3px] border-[#1d1a33] bg-white overflow-hidden flex flex-col" style={{ left: menuLeft, bottom: menuBottom, width: W, maxHeight: menuMaxH, boxShadow: '0 6px 0 #1d1a33' }}>
      {/* Drag the card by its top bar. */}
      <div className="flex items-center gap-2 px-4 py-3 text-white cursor-grab active:cursor-grabbing touch-none select-none shrink-0" style={{ background: MAGENTA }}
        onPointerDown={(e) => { if ((e.target as HTMLElement).closest('button')) return; down(e); }} onPointerMove={move} onPointerUp={() => up(true)}>
        <Code weight="bold" size={20} aria-hidden="true" /><b className="flex-1">Developer menu</b>
        <button type="button" onClick={() => { const h = HOME(); setPos(h); try { localStorage.setItem(POS, JSON.stringify(h)); } catch { /* fine */ } }} className="text-xs font-bold underline">Back to corner</button>
      </div>
      <div className="p-4 grid gap-4 overflow-auto min-h-0">
        <section className="grid gap-2">
          <b className="text-sm flex items-center gap-1.5"><Eye weight="bold" size={16} aria-hidden="true" />See every page as</b>
          <div className="flex flex-wrap gap-1.5">
            {PLANS.map((p) => <button key={p} type="button" aria-pressed={plan === p} onClick={() => pick(p)} className={btn(plan === p)}>{p[0].toUpperCase() + p.slice(1)}</button>)}
            <button type="button" aria-pressed={!plan} onClick={() => pick(null)} className={btn(!plan)}>My plan</button>
          </div>
        </section>
        <section className="grid gap-2">
          <b className="text-sm flex items-center gap-1.5"><Robot weight="bold" size={16} aria-hidden="true" />Pretend students for a live game</b>
          <label className="grid gap-1 text-sm font-bold">Live code<input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code on the host screen" className="min-h-11 px-3 rounded-[0.8rem] border-2 border-[#1d1a33] font-bold uppercase tracking-widest" /></label>
          <label className="grid gap-1 text-sm font-bold">Students: {count}<input type="range" min={1} max={40} value={count} onChange={(e) => setCount(Number(e.target.value))} /></label>
          <label className="grid gap-1 text-sm font-bold">Right answers: {acc}%<input type="range" min={10} max={100} step={5} value={acc} onChange={(e) => setAcc(Number(e.target.value))} /></label>
          {running
            ? <button type="button" onClick={() => { running.stop(); setRunning(null); setPhase(''); }} className="min-h-12 rounded-full bg-[#1d1a33] text-white font-bold">Stop the {count} students</button>
            : <button type="button" disabled={code.trim().length < 3} onClick={() => setRunning(startBots(code, count, acc / 100, (s) => setPhase(s.phase)))} className="min-h-12 rounded-full text-white font-bold disabled:opacity-40" style={{ background: '#6a45f0' }}>Send {count} students in</button>}
          {running && <p className="m-0 text-xs font-semibold text-[#52525b]" role="status">{phase ? `The game is ${phase}. Students answer once it starts.` : 'Joining... let them in from the host screen if the room asks.'}</p>}
        </section>
        <section className="grid gap-1.5">
          <b className="text-sm">Go to</b>
          <div className="flex flex-wrap gap-1.5">
            <Link to="/owner" className={`${btn(false)} inline-flex items-center gap-1 no-underline text-[#1d1a33]`}><SquaresFour size={16} />Portal</Link>
            <Link to="/owner?s=focus" className={`${btn(false)} inline-flex items-center gap-1 no-underline text-[#1d1a33]`}><Siren size={16} />Do first</Link>
            <Link to="/owner?s=gallery" className={`${btn(false)} inline-flex items-center gap-1 no-underline text-[#1d1a33]`}><PaintBrush size={16} />Review themes</Link>
            <Link to="/teacher/activity" className={`${btn(false)} inline-flex items-center gap-1 no-underline text-[#1d1a33]`}>Start a live game</Link>
          </div>
        </section>
      </div>
    </div>
    {button}
    </>
  );
}
