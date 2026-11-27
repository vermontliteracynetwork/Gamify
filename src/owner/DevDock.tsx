import { useEffect, useRef, useState } from 'react';
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
// Double-click (or double-tap) the button to open; the X collapses it.
const MAGENTA = '#f055a5';
const PLANS: Tier[] = ['free', 'plus', 'pro', 'homeschool'];
const POS = 'gamify:devdock-pos';

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
  const [side, setSide] = useState<'left' | 'right'>(() => { try { return (localStorage.getItem(POS) as 'left' | 'right') || 'left'; } catch { return 'left'; } });
  useEffect(() => { const f = () => setPlan(previewTier()); window.addEventListener('gamify-tier', f); return () => window.removeEventListener('gamify-tier', f); }, []);
  useEffect(() => () => running?.stop(), [running]);
  if (!owner) return null;
  const pick = (t: Tier | null) => { setPreviewTier(t); setPlan(t); };
  const tap = () => { const now = Date.now(); if (now - lastTap.current < 400) setOpen(true); lastTap.current = now; };
  const flip = () => { const s = side === 'left' ? 'right' : 'left'; setSide(s); try { localStorage.setItem(POS, s); } catch { /* fine */ } };
  const place = side === 'left' ? 'left-4' : 'right-20';
  if (!open) {
    return (
      <button type="button" onClick={tap} onKeyDown={(e) => { if (e.key === 'Enter') setOpen(true); }} aria-label="Developer menu (double-click to open)" title="Developer menu: double-click"
        className={`no-print fixed bottom-4 ${place} z-[80] w-14 h-14 rounded-full border-[3px] border-[#1d1a33] grid place-items-center text-white`} style={{ background: MAGENTA, boxShadow: '0 4px 0 #1d1a33' }}>
        <Code weight="bold" size={26} />
        {plan && <span className="absolute -top-2 -right-2 rounded-full bg-[#fdfd94] text-[#1d1a33] border-2 border-[#1d1a33] px-1.5 text-[0.65rem] font-bold uppercase">{plan}</span>}
      </button>
    );
  }
  const btn = (on: boolean) => `min-h-10 px-3 rounded-full border-2 border-[#1d1a33] font-bold text-sm ${on ? 'bg-[#1d1a33] text-white' : 'bg-white'}`;
  return (
    <div role="dialog" aria-label="Developer menu" className={`no-print fixed bottom-4 ${place} z-[80] w-[min(22rem,calc(100vw-2rem))] rounded-[1.25rem] border-[3px] border-[#1d1a33] bg-white overflow-hidden`} style={{ boxShadow: '0 6px 0 #1d1a33' }}>
      <div className="flex items-center gap-2 px-4 py-3 text-white" style={{ background: MAGENTA }}>
        <Code weight="bold" size={20} aria-hidden="true" /><b className="flex-1">Developer menu</b>
        <button type="button" onClick={flip} className="text-xs font-bold underline">Move {side === 'left' ? 'right' : 'left'}</button>
        <button type="button" onClick={() => setOpen(false)} aria-label="Collapse" className="w-9 h-9 rounded-full bg-white text-[#1d1a33] grid place-items-center"><X weight="bold" size={16} /></button>
      </div>
      <div className="p-4 grid gap-4 max-h-[70vh] overflow-auto">
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
  );
}
