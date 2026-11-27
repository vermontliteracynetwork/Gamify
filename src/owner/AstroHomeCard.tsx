import { useState } from 'react';
import { CaretLeft, CaretRight, MoonStars } from '@phosphor-icons/react';
import { CONSTELLATIONS, MOON_DAY, MOON_STORY, WINDOWS, WINDOW_DATES, moonLongitude, phaseOf, phaseStory, signOf, sunLongitude, type SIGNS } from './astro';

// Her astrology on the dashboard home, as an advisor talking (owner,
// 2026-11-27: "more narrative/interpretive (short text, sentences) ... show
// line art visuals of constelations"). Day: the Moon's sign and phase read
// for her chart. Week: the Moon's path, day by day. Month and year: her
// timing windows, told as advice. A line-art constellation for the sign in
// focus sits beside the words.
type View = 'day' | 'week' | 'month' | 'year';
const VIEWS: View[] = ['day', 'week', 'month', 'year'];
const LABEL: Record<View, string> = { day: 'Today', week: 'This week', month: 'This month', year: 'This year' };
const iso = (d: Date) => d.toISOString().slice(0, 10);
type Sign = (typeof SIGNS)[number];

function Constellation({ sign }: { sign: Sign }) {
  const c = CONSTELLATIONS[sign];
  return (
    <figure className="m-0 grid justify-items-center gap-1 shrink-0" aria-hidden="true">
      <svg viewBox="0 0 100 100" className="w-32 h-32 sm:w-40 sm:h-40 rounded-[1.25rem]" style={{ background: 'radial-gradient(circle at 30% 20%, #3b2a8f, #1d1a33 70%)' }}>
        {[[8, 10], [92, 18], [80, 92], [6, 88], [50, 6], [94, 64], [18, 52]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={0.8} fill="#ddd6ff" opacity={0.6} />)}
        {c.lines.map(([a, b], i) => <line key={i} x1={c.stars[a][0]} y1={c.stars[a][1]} x2={c.stars[b][0]} y2={c.stars[b][1]} stroke="#fdfd94" strokeWidth={1.2} strokeLinecap="round" opacity={0.85} />)}
        {c.stars.map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r={3.6} fill="#fabe37" opacity={0.25} /><circle cx={x} cy={y} r={1.9} fill="#fff" /></g>)}
      </svg>
      <figcaption className="text-xs font-bold tracking-wide uppercase text-[#57506e]">{sign}</figcaption>
    </figure>
  );
}

function windowsBetween(a: Date, b: Date) {
  return WINDOWS.filter((w) => { const r = WINDOW_DATES[w.id]; return r && r[0] <= iso(b) && r[1] >= iso(a); });
}
const sentence = (s: string) => (s.trim().endsWith('.') ? s.trim() : `${s.trim()}.`);

export default function AstroHomeCard({ onMore }: { onMore: () => void }) {
  const [v, setV] = useState(0);
  const view = VIEWS[v];
  const now = new Date();
  const go = (d: number) => setV((x) => (x + d + VIEWS.length) % VIEWS.length);
  const moon = signOf(moonLongitude(now));
  const sun = signOf(sunLongitude(now));
  let sign: Sign = moon;
  let body;
  if (view === 'day') {
    body = <>
      <p className="m-0 text-lg leading-relaxed">{MOON_STORY[moon]}</p>
      <p className="m-0 leading-relaxed text-[#57506e]">{phaseStory(phaseOf(now))}</p>
    </>;
  } else if (view === 'week') {
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(now); d.setDate(now.getDate() + i); return { d, s: signOf(moonLongitude(d)) }; });
    const path = days.map((x) => x.s).filter((s, i, a) => a.indexOf(s) === i);
    const best = days.find((x) => x.s === 'Scorpio' || x.s === 'Capricorn');
    body = <>
      <p className="m-0 text-lg leading-relaxed">This week the Moon travels {path.length > 1 ? `from ${path[0]} through ${path.slice(1).join(' and ')}` : `through ${path[0]}`}. {best ? `Save ${best.d.toLocaleDateString(undefined, { weekday: 'long' })} for your biggest decision; the sky lines up with your chart that day.` : 'No day stands out, so keep a steady rhythm and protect your build blocks.'}</p>
      <ul className="flex flex-wrap gap-1.5 list-none p-0 m-0">{days.map((x) => <li key={iso(x.d)} title={MOON_DAY[x.s].focus} className="rounded-full border border-[#d6cff0] px-2.5 py-1 text-xs font-bold">{x.d.toLocaleDateString(undefined, { weekday: 'short' })} · {x.s}</li>)}</ul>
    </>;
  } else {
    sign = sun;
    const end = new Date(now); if (view === 'month') end.setMonth(now.getMonth() + 1); else end.setFullYear(now.getFullYear() + 1);
    const list = windowsBetween(now, end);
    body = list.length ? (
      <div className="grid gap-3">
        {list.slice(0, view === 'month' ? 3 : 5).map((w) => (
          <p key={w.id} className="m-0 leading-relaxed"><b>{w.when}.</b> {sentence(w.advice)} {sentence(w.step)}</p>
        ))}
      </div>
    ) : <p className="m-0 text-lg leading-relaxed">A quiet sky. Nothing big pulls on your chart, which is its own gift: steady work compounds.</p>;
  }
  return (
    <section className="dash-card" aria-labelledby="astro-home">
      <div className="flex items-center gap-2">
        <MoonStars size={22} aria-hidden="true" />
        <h2 id="astro-home" className="font-bold text-lg m-0 flex-1">Your stars: {LABEL[view]}</h2>
        <button type="button" onClick={() => go(-1)} aria-label="Previous view" className="w-10 h-10 rounded-full border-2 border-[#1d1a33] grid place-items-center"><CaretLeft weight="bold" size={18} /></button>
        <button type="button" onClick={() => go(1)} aria-label="Next view" className="w-10 h-10 rounded-full border-2 border-[#1d1a33] grid place-items-center"><CaretRight weight="bold" size={18} /></button>
      </div>
      <div className="flex gap-1.5 flex-wrap" role="group" aria-label="Forecast range">
        {VIEWS.map((x, i) => <button key={x} type="button" aria-pressed={i === v} onClick={() => setV(i)} className={`min-h-9 px-3 rounded-full border-2 text-sm font-bold ${i === v ? 'border-[#1d1a33] bg-[#ddd6ff]' : 'border-[#d6cff0]'}`}>{LABEL[x]}</button>)}
      </div>
      <div className="flex flex-col sm:flex-row gap-5 items-start" aria-live="polite">
        <Constellation sign={sign} />
        <div className="grid gap-3 flex-1 min-w-0 max-w-3xl">{body}</div>
      </div>
      <button type="button" onClick={onMore} className="justify-self-start self-start font-bold underline underline-offset-4 text-sm">Full chart and timing</button>
    </section>
  );
}
