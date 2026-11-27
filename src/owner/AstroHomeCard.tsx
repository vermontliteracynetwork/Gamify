import { useState } from 'react';
import { CaretLeft, CaretRight, MoonStars } from '@phosphor-icons/react';
import { MOON_DAY, WINDOWS, WINDOW_DATES, phaseName, phaseOf, moonLongitude, signOf, sunLongitude } from './astro';

// Her astrology on the dashboard home (owner, 2026-11-27: "in card form giving
// me advice on the day and give me arrows so i can sort through day, week,
// month, year forcast ... what i should do career and finance wise with
// Gamify"). Day and week read the Moon through her chart; month and year
// show her timing windows. Every reading is paired with a business step.
type View = 'day' | 'week' | 'month' | 'year';
const VIEWS: View[] = ['day', 'week', 'month', 'year'];
const LABEL: Record<View, string> = { day: 'Today', week: 'This week', month: 'This month', year: 'This year' };
const TONE = { build: '#c8f0dc', grow: '#fff1b8', care: '#ffd3e6' } as const;
const iso = (d: Date) => d.toISOString().slice(0, 10);

function windowsBetween(a: Date, b: Date) {
  return WINDOWS.filter((w) => { const r = WINDOW_DATES[w.id]; return r && r[0] <= iso(b) && r[1] >= iso(a); });
}

export default function AstroHomeCard({ onMore }: { onMore: () => void }) {
  const [v, setV] = useState(0);
  const view = VIEWS[v];
  const now = new Date();
  const go = (d: number) => setV((x) => (x + d + VIEWS.length) % VIEWS.length);
  let body;
  if (view === 'day') {
    const sign = signOf(moonLongitude(now));
    const r = MOON_DAY[sign];
    body = (
      <div className="grid gap-2">
        <p className="m-0 font-bold">Moon in {sign} · {phaseName(phaseOf(now))} · Sun in {signOf(sunLongitude(now))}</p>
        <p className="m-0"><b>Work: </b>{r.focus}</p>
        <p className="m-0"><b>Money: </b>{r.money}</p>
      </div>
    );
  } else if (view === 'week') {
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(now); d.setDate(now.getDate() + i); return d; });
    body = (
      <ul className="grid gap-1.5 list-none p-0 m-0">
        {days.map((d) => { const sign = signOf(moonLongitude(d)); return (
          <li key={iso(d)} className="grid grid-cols-[4.5rem_6.5rem_1fr] gap-2 text-sm"><b>{d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}</b><span className="font-semibold">{sign}</span><span>{MOON_DAY[sign].focus}</span></li>
        ); })}
      </ul>
    );
  } else {
    const end = new Date(now); if (view === 'month') end.setMonth(now.getMonth() + 1); else end.setFullYear(now.getFullYear() + 1);
    const list = windowsBetween(now, end);
    body = list.length ? (
      <ul className="grid gap-2 list-none p-0 m-0">
        {list.map((w) => (
          <li key={w.id} className="rounded-[0.9rem] p-3 grid gap-0.5" style={{ background: TONE[w.tone] }}>
            <span className="text-xs font-bold uppercase tracking-wide">{w.when}</span>
            <b>{w.advice}</b>
            <span className="text-sm"><b>Do: </b>{w.step}</span>
          </li>
        ))}
      </ul>
    ) : <p className="m-0 font-semibold">A quiet stretch: steady work, no big sky events.</p>;
  }
  return (
    <section className="dash-card" aria-labelledby="astro-home">
      <div className="flex items-center gap-2">
        <MoonStars size={22} aria-hidden="true" />
        <h2 id="astro-home" className="font-bold text-lg m-0 flex-1">Your stars: {LABEL[view]}</h2>
        <button type="button" onClick={() => go(-1)} aria-label="Previous view" className="w-10 h-10 rounded-full border-2 border-[#1d1a33] grid place-items-center"><CaretLeft weight="bold" size={18} /></button>
        <button type="button" onClick={() => go(1)} aria-label="Next view" className="w-10 h-10 rounded-full border-2 border-[#1d1a33] grid place-items-center"><CaretRight weight="bold" size={18} /></button>
      </div>
      <div className="flex gap-1.5" role="group" aria-label="Forecast range">
        {VIEWS.map((x, i) => <button key={x} type="button" aria-pressed={i === v} onClick={() => setV(i)} className={`min-h-9 px-3 rounded-full border-2 text-sm font-bold ${i === v ? 'border-[#1d1a33] bg-[#ddd6ff]' : 'border-[#d6cff0]'}`}>{LABEL[x]}</button>)}
      </div>
      <div aria-live="polite">{body}</div>
      <button type="button" onClick={onMore} className="justify-self-start font-bold underline underline-offset-4 text-sm">Full chart and timing</button>
    </section>
  );
}
