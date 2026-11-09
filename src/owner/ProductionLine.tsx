import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, CheckCircle, Circle, Factory } from '@phosphor-icons/react';
import { data } from '../data';
import { t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';
import { PRICES_USD_PER_YEAR } from '../config';
import { useOwnerStats } from './DevCards';
import { forecast, mrrOf, SCENARIOS, type PlanCounts } from './forecast';
import { RELEASE, type ReleaseState } from './release';

// The owner's production line (teacher, 2026-11-09): one page from sign-up
// to income. Grayscale, simple and calm (teacher, 2026-11-09: "more
// grayscale, simplify and improve the design flow, never cut off text").
// Left: the line, the income forecast, plans and sign-ups. Right: the road
// to release and the Stripe connection. Laptop first; every word shows.

const G = { ink: '#1f1f1f', mid: '#5c5c5c', soft: '#8d8d8d', faint: '#c9c9c6', line: '#e2e2df', panel: '#ffffff', ground: '#f3f3f1' };
const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
const monthName = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

interface StripeStatus { secretKey: boolean; live: boolean; webhook: boolean; reachable: boolean; chargesEnabled: boolean; prices: number }

export default function ProductionLine() {
  const { stats, problem } = useOwnerStats();
  const still = useSettings().settings.motion === 'still';
  const real: PlanCounts & { free: number } = {
    free: stats?.tiers.free ?? 0, plus: stats?.tiers.plus ?? 0, pro: stats?.tiers.pro ?? 0,
    homeschool: stats?.tiers.homeschool ?? 0, schoolSeats: stats?.tiers.school ?? 0,
  };
  const paidReal = real.plus + real.pro + real.homeschool + real.schoolSeats;
  const [plan, setPlan] = useState({ plus: 20, pro: 5, homeschool: 5, schoolSeats: 0, growth: 8, churn: 2 });
  const [stripe, setStripe] = useState<StripeStatus | null>(null);
  const [stripeProblem, setStripeProblem] = useState(false);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [releaseDate, setReleaseDate] = useState('');
  useEffect(() => {
    void fetch('/api/stripe-status').then((r) => (r.ok ? r.json() : Promise.reject())).then(setStripe).catch(() => setStripeProblem(true));
    void data.getSetting<Record<string, boolean>>('release-checks').then((v) => v && setChecks(v));
    void data.getSetting<string>('release-date').then((v) => v && setReleaseDate(v));
  }, []);
  // Until real paid accounts exist, the forecast runs on planning numbers.
  const start: PlanCounts = paidReal > 0 ? real : plan;
  const lines = useMemo(() => SCENARIOS.map((s) => ({ ...s, points: forecast(start, (plan.growth / 100) * s.factor, plan.churn / 100, 12) })), [start.plus, start.pro, start.homeschool, start.schoolSeats, plan.growth, plan.churn]); // eslint-disable-line react-hooks/exhaustive-deps
  const expected = lines[1].points;

  const isDone = (id: string, s: ReleaseState) => checks[id] ?? s === 'done';
  const all = RELEASE.flatMap((st) => st.items);
  const doneCount = all.filter((i) => isDone(i.id, i.state)).length;
  const pct = Math.round((doneCount / all.length) * 100);
  const daysLeft = releaseDate ? Math.ceil((new Date(releaseDate).getTime() - Date.now()) / 86400000) : null;
  function toggle(id: string, s: ReleaseState) {
    const next = { ...checks, [id]: !isDone(id, s) };
    setChecks(next); void data.setSetting('release-checks', next);
  }

  const stations = [
    { label: t('line.signups'), value: String(stats?.teachers ?? 0), on: !!stats },
    { label: t('line.free'), value: String(real.free), on: real.free > 0 },
    { label: t('line.paid'), value: String(paidReal), on: paidReal > 0 },
    { label: t('line.mrr'), value: money(mrrOf(real)), on: paidReal > 0 },
    { label: t('line.stripe'), value: stripe?.chargesEnabled ? t('line.on') : t('line.off'), on: !!stripe?.chargesEnabled },
  ];
  const stripeSteps = [
    { label: t('line.s.account'), ok: !!stripe?.reachable },
    { label: t('line.s.secret'), hint: 'STRIPE_SECRET_KEY', ok: !!stripe?.secretKey },
    { label: t('line.s.publishable'), hint: 'VITE_STRIPE_PUBLISHABLE_KEY', ok: !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY },
    { label: t('line.s.prices', { n: stripe?.prices ?? 0 }), ok: (stripe?.prices ?? 0) >= 3 },
    { label: t('line.s.webhook'), hint: 'STRIPE_WEBHOOK_SECRET', ok: !!stripe?.webhook },
    { label: t('line.s.charges'), ok: !!stripe?.chargesEnabled },
    { label: t('line.s.live'), ok: !!stripe?.live },
  ];
  const stripeOk = stripeSteps.filter((s) => s.ok).length;

  return (
    <div className="min-h-[calc(100dvh-4rem)]" style={{ background: G.ground, color: G.ink }}>
    <main className="w-full max-w-[1600px] mx-auto px-4 lg:px-6 py-3 grid gap-3">
      <header className="flex items-center gap-3 flex-wrap">
        <Link to="/owner" className="min-h-10 px-3 rounded-input border inline-flex items-center gap-1.5 font-semibold no-underline text-sm" style={{ borderColor: G.faint, background: G.panel, color: G.ink }}><ArrowLeft weight="bold" size={16} />{t('line.back')}</Link>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2"><Factory weight="duotone" size={28} />{t('line.title')}</h1>
        {problem && <p className="ml-auto text-sm" style={{ color: G.mid }}>{problem}</p>}
      </header>

      {/* The line: five stations left to right, a belt underneath. */}
      <Card label={t('line.belt')} tight>
        <ol className="grid grid-cols-[repeat(5,minmax(0,1fr))] gap-2 list-none m-0 p-0">
          {stations.map((s, i) => (
            <li key={s.label} className="relative grid gap-0.5 rounded-input border px-3 py-1.5" style={{ borderColor: G.line }}>
              <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: G.mid }}>
                <span className="w-2.5 h-2.5 rounded-full shrink-0 border" style={{ background: s.on ? G.ink : 'transparent', borderColor: G.ink }} aria-label={s.on ? t('line.running') : t('line.waiting')} />
                {i + 1}. {s.label}
              </span>
              <span className="text-xl font-bold tabular-nums leading-tight">{s.value}</span>
              {i < stations.length - 1 && <ArrowRight weight="bold" size={14} className="absolute -right-[13px] top-1/2 -translate-y-1/2 z-10 rounded-full" style={{ color: G.soft, background: G.panel }} aria-hidden="true" />}
            </li>
          ))}
        </ol>
        <div aria-hidden="true" className={`h-1.5 rounded-pill ${still ? '' : 'belt-move'}`} style={{ backgroundImage: `repeating-linear-gradient(90deg, ${G.faint} 0 10px, ${G.line} 10px 20px)` }} />
      </Card>

      <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-3 items-start">
        <div className="grid gap-3 min-w-0">
          <Card label={t('line.forecast')} title={t('line.forecast')} note={paidReal > 0 ? t('line.fromReal') : t('line.fromPlan')}>
            <ForecastChart lines={lines} still={still} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[[t('line.now'), mrrOf(start), t('line.perMonthShort')], [monthName(expected[2].date), expected[2].total, t('line.collected')], [monthName(expected[5].date), expected[5].total, t('line.collected')], [monthName(expected[11].date), expected[11].total, t('line.collected')]].map(([l, v, sub]) => (
                <div key={String(l)} className="rounded-input border px-3 py-1" style={{ borderColor: G.line }} title={String(sub)}>
                  <p className="text-xs font-semibold" style={{ color: G.mid }}>{l}</p>
                  <p className="text-lg font-bold tabular-nums leading-tight">{money(Number(v))}</p>
                </div>
              ))}
            </div>
            <p className="text-xs -mt-1" style={{ color: G.soft }}>{t('line.totalsNote')}</p>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 pt-2 border-t" style={{ borderColor: G.line }}>
              {paidReal === 0 && (['plus', 'pro', 'homeschool', 'schoolSeats'] as const).map((k) => (
                <Slide key={k} label={t(`line.in.${k}` as 'line.in.plus')} value={plan[k]} max={k === 'schoolSeats' ? 1000 : 500} onChange={(v) => setPlan({ ...plan, [k]: v })} />
              ))}
              <Slide label={t('line.in.growth')} value={plan.growth} max={30} show={(v) => `${v}%`} onChange={(v) => setPlan({ ...plan, growth: v })} />
              <Slide label={t('line.in.churn')} value={plan.churn} max={15} show={(v) => `${v}%`} onChange={(v) => setPlan({ ...plan, churn: v })} />
            </div>
            <p className="text-xs" style={{ color: G.mid }}>{t('line.prices', { plus: PRICES_USD_PER_YEAR.plus, pro: PRICES_USD_PER_YEAR.pro, home: PRICES_USD_PER_YEAR.homeschool })}</p>
          </Card>
          <div className="grid sm:grid-cols-2 gap-3">
            <Card label={t('line.plans')} title={t('line.plans')}><PlanBars counts={real} /></Card>
            <Card label={t('line.weekly')} title={t('line.weekly')}><WeekBars weeks={stats?.signups ?? []} /></Card>
          </div>
        </div>

        <div className="grid gap-3 min-w-0">
          <Card label={t('line.release')} title={t('line.release')} note={daysLeft === null ? t('line.noDate') : daysLeft >= 0 ? t('line.daysLeft', { n: daysLeft }) : t('line.pastDate')}>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-32 h-2.5 rounded-pill overflow-hidden" style={{ background: G.line }} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t('line.release')}>
                <motion.div className="h-full rounded-pill" style={{ background: G.ink }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: still ? 0 : 0.8 }} />
              </div>
              <span className="text-lg font-bold tabular-nums">{pct}%</span>
              <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: G.mid }}>{t('line.target')}
                <input type="date" value={releaseDate} onChange={(e) => { setReleaseDate(e.target.value); void data.setSetting('release-date', e.target.value); }} className="border rounded-input px-1.5 py-0.5 text-sm" style={{ borderColor: G.faint, color: G.ink, background: G.panel }} />
              </label>
            </div>
            <p className="text-xs flex gap-3" style={{ color: G.mid }}><span><b>{t('line.you')}</b> {t('line.youMeans')}</span><span><b>{t('line.build')}</b> {t('line.buildMeans')}</span></p>
            <div className="grid sm:grid-cols-2 gap-x-5 gap-y-3">
              {RELEASE.map((st) => {
                const n = st.items.filter((i) => isDone(i.id, i.state)).length;
                return (
                  <section key={st.id} className="grid gap-1 content-start" aria-label={st.title}>
                    <h3 className="text-xs font-bold uppercase tracking-wide flex justify-between border-b pb-0.5" style={{ borderColor: G.line }}><span>{st.title}</span><span className="tabular-nums" style={{ color: G.soft }}>{n}/{st.items.length}</span></h3>
                    {st.items.map((it) => {
                      const done = isDone(it.id, it.state);
                      return (
                        <label key={it.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-1.5 text-[13px] leading-snug cursor-pointer">
                          <input type="checkbox" checked={done} onChange={() => toggle(it.id, it.state)} className="mt-[3px]" style={{ accentColor: G.ink }} />
                          <span style={{ color: done ? G.soft : G.ink, textDecoration: done ? 'line-through' : undefined }}>{it.text}</span>
                          {!done && <span className="text-[11px] font-semibold rounded-pill border px-1.5 whitespace-nowrap" style={{ borderColor: it.state === 'you' ? G.ink : G.faint, color: it.state === 'you' ? G.ink : G.mid }}>{it.state === 'you' ? t('line.you') : t('line.build')}</span>}
                        </label>
                      );
                    })}
                  </section>
                );
              })}
            </div>
          </Card>
          <Card label={t('line.stripeTitle')} title={t('line.stripeTitle')} note={stripeProblem ? t('line.stripeUnreachable') : t('line.stripeCount', { n: stripeOk, total: stripeSteps.length })}>
            <ol className="grid sm:grid-cols-2 gap-x-4 gap-y-1 list-none m-0 p-0">
              {stripeSteps.map((s) => (
                <li key={s.label} title={s.hint} className="flex items-start gap-1.5 text-[13px] leading-snug">
                  {s.ok ? <CheckCircle weight="fill" size={17} className="shrink-0 mt-px" style={{ color: G.ink }} aria-label={t('line.ready')} /> : <Circle weight="regular" size={17} className="shrink-0 mt-px" style={{ color: G.soft }} aria-label={t('line.notYet')} />}
                  <span style={{ color: s.ok ? G.ink : G.mid }}>{s.label}</span>
                </li>
              ))}
            </ol>
            {!stripe?.secretKey && <p className="text-xs" style={{ color: G.mid }}>{t('line.stripeHow')}</p>}
          </Card>
        </div>
      </div>
    </main>
    </div>
  );
}

function Card({ label, title, note, tight = false, children }: { label: string; title?: string; note?: string; tight?: boolean; children: ReactNode }) {
  return (
    <section aria-label={label} className={`rounded-panel border grid content-start min-w-0 ${tight ? 'px-3 py-2.5 gap-2' : 'p-4 gap-3'}`} style={{ background: G.panel, borderColor: G.line, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
      {title && (
        <div className="flex items-baseline justify-between gap-x-3 gap-y-0.5 flex-wrap">
          <h2 className="font-heading text-base font-bold">{title}</h2>
          {note && <span className="text-xs" style={{ color: G.mid }}>{note}</span>}
        </div>
      )}
      {children}
    </section>
  );
}

function Slide({ label, value, max, onChange, show = String }: { label: string; value: number; max: number; onChange: (v: number) => void; show?: (v: number) => string }) {
  return (
    <label className="grid grid-cols-[minmax(7rem,auto)_minmax(4rem,1fr)_3rem] items-center gap-2 text-xs font-semibold" style={{ color: G.mid }}>
      <span>{label}</span>
      <input type="range" min={0} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ accentColor: G.ink }} />
      <span className="tabular-nums text-right" style={{ color: G.ink }}>{show(value)}</span>
    </label>
  );
}

// Accounts by plan: one gray bar each, labeled, darker for paid plans.
function PlanBars({ counts }: { counts: PlanCounts & { free: number } }) {
  const rows = [
    { id: 'free', label: t('line.p.free'), n: counts.free, color: G.faint },
    { id: 'plus', label: t('line.p.plus'), n: counts.plus, color: G.ink },
    { id: 'pro', label: t('line.p.pro'), n: counts.pro, color: G.ink },
    { id: 'homeschool', label: t('line.p.homeschool'), n: counts.homeschool, color: G.ink },
    { id: 'school', label: t('line.p.school'), n: counts.schoolSeats, color: G.ink },
  ];
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <table className="w-full text-[13px]">
      <caption className="sr-only">{t('line.plans')}</caption>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            <th scope="row" className="text-left font-semibold py-1 pr-3 whitespace-nowrap">{r.label}</th>
            <td className="w-full py-1"><div className="h-2.5 rounded-r-[4px] min-w-[2px]" style={{ width: `${(r.n / max) * 100}%`, background: r.color }} /></td>
            <td className="pl-3 font-bold tabular-nums text-right">{r.n}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function WeekBars({ weeks }: { weeks: { week: string; n: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  if (!weeks.length) return <p className="text-[13px]" style={{ color: G.mid }}>{t('line.noWeeks')}</p>;
  const list = weeks.slice(-12);
  const max = Math.max(1, ...list.map((w) => w.n));
  const W = 300, H = 110;
  const bw = W / list.length;
  return (
    <div className="grid gap-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={t('line.weekly')} onMouseLeave={() => setHover(null)}>
        <line x1={0} y1={H - 1} x2={W} y2={H - 1} stroke={G.line} />
        {list.map((w, i) => {
          const h = (w.n / max) * (H - 8);
          return (
            <g key={w.week} onMouseEnter={() => setHover(i)}>
              <rect x={i * bw} y={0} width={bw} height={H} fill="transparent" />
              <rect x={i * bw + 2} y={H - 1 - h} width={bw - 4} height={Math.max(0, h)} rx={3} fill={hover === i ? G.ink : G.mid} />
            </g>
          );
        })}
      </svg>
      <p className="text-xs flex justify-between" style={{ color: G.mid }}>
        <span>{list[0].week}</span>
        <span style={{ color: G.ink }}>{hover !== null ? t('line.weekTip', { week: list[hover].week, n: list[hover].n }) : ''}</span>
        <span>{list[list.length - 1].week}</span>
      </p>
    </div>
  );
}

// Income forecast: three gray lines (solid expected, dashed slower and
// faster), dates below, values in a readout row that never covers the chart.
function ForecastChart({ lines, still }: { lines: { id: string; points: { date: Date; mrr: number }[] }[]; still: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  // Drawn at the real width, so labels stay a readable 12px on any screen.
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(640);
  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    const fit = () => setW(Math.max(280, Math.round(el.clientWidth)));
    fit(); const ro = new ResizeObserver(fit); ro.observe(el); return () => ro.disconnect();
  }, []);
  const H = 170, L = 56, R = 10;
  const pts = lines[0].points;
  const max = Math.max(1, ...lines.flatMap((l) => l.points.map((p) => p.mrr)));
  const x = (i: number) => L + (i / (pts.length - 1)) * (W - L - R);
  const y = (v: number) => H - 4 - (v / max) * (H - 16);
  const stroke: Record<string, { c: string; dash?: string; w: number }> = { slow: { c: G.soft, dash: '4 5', w: 2 }, expected: { c: G.ink, w: 3 }, fast: { c: G.mid, dash: '10 5', w: 2 } };
  const at = hover ?? pts.length - 1;
  return (
    <div ref={box} className="grid gap-1.5">
      <svg viewBox={`0 0 ${W} ${H + 22}`} width={W} height={H + 22} className="w-full" role="img" aria-label={t('line.forecast')}
        onMouseMove={(e) => { const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect(); const px = ((e.clientX - r.left) / r.width) * W; setHover(Math.max(0, Math.min(pts.length - 1, Math.round(((px - L) / (W - L - R)) * (pts.length - 1))))); }}
        onMouseLeave={() => setHover(null)}>
        {[0, 0.5, 1].map((f) => <g key={f}><line x1={L} y1={y(max * f)} x2={W - R} y2={y(max * f)} stroke={G.line} /><text x={L - 8} y={y(max * f) + 5} textAnchor="end" fontSize="12" fill={G.mid}>{money(max * f)}</text></g>)}
        {lines.map((l) => (
          <motion.polyline key={l.id} fill="none" stroke={stroke[l.id].c} strokeWidth={stroke[l.id].w} strokeDasharray={stroke[l.id].dash} strokeLinejoin="round" strokeLinecap="round"
            points={l.points.map((p, i) => `${x(i)},${y(p.mrr)}`).join(' ')} initial={still ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />
        ))}
        {pts.map((p, i) => (i % 2 === 0 || i === pts.length - 1) && <text key={i} x={x(i)} y={H + 17} textAnchor={i === 0 ? 'start' : i === pts.length - 1 ? 'end' : 'middle'} fontSize="12" fill={G.mid}>{p.date.toLocaleDateString('en-US', { month: 'short' })}</text>)}
        <line x1={x(at)} y1={6} x2={x(at)} y2={H - 4} stroke={G.faint} strokeWidth={1} />
        {lines.map((l) => <circle key={l.id} cx={x(at)} cy={y(l.points[at].mrr)} r={5} fill={stroke[l.id].c} stroke="#fff" strokeWidth={2} />)}
      </svg>
      {/* The readout: the month under the cursor (or the last month). */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs" style={{ color: G.mid }} aria-live="polite">
        <span className="font-bold" style={{ color: G.ink }}>{pts[at].date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
        {lines.map((l) => (
          <span key={l.id} className="inline-flex items-center gap-1.5">
            <svg width="20" height="6" aria-hidden="true"><line x1="0" y1="3" x2="20" y2="3" stroke={stroke[l.id].c} strokeWidth={stroke[l.id].w} strokeDasharray={stroke[l.id].dash} /></svg>
            {t(`line.sc.${l.id}` as 'line.sc.slow')} <b style={{ color: G.ink }}>{money(l.points[at].mrr)}</b>
          </span>
        ))}
        <span className="ml-auto">{t('line.perMonth')}</span>
      </div>
    </div>
  );
}
