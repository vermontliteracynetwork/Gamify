import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle, CircleDashed, CreditCard, Factory, Gear, Hammer, Lightning, User, UsersThree } from '@phosphor-icons/react';
import { data } from '../data';
import { t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';
import { PRICES_USD_PER_YEAR } from '../config';
import { useOwnerStats } from './DevCards';
import { forecast, mrrOf, SCENARIOS, type PlanCounts } from './forecast';
import { RELEASE, type ReleaseState } from './release';

// The owner's production line (teacher, 2026-11-09: "a full one page
// dashboard that looks almost like a production line"): sign-ups ride a
// conveyor through free and paid plans to income and Stripe, with charts for
// every plan, an income forecast by date, the Stripe connection, and the
// checklist to release. Laptop first, one page, no scroll.

// Plan colors: the validated categorical order (dataviz palette slots 1-4).
const PLAN = [
  { id: 'plus', color: '#2a78d6' },
  { id: 'pro', color: '#eb6834' },
  { id: 'homeschool', color: '#1baf7a' },
  { id: 'school', color: '#eda100' },
] as const;
const FREE = '#a8a6a0';
const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
const monthName = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

interface StripeStatus { secretKey: boolean; live: boolean; webhook: boolean; reachable: boolean; chargesEnabled: boolean; prices: number }

export default function ProductionLine() {
  const { stats, problem } = useOwnerStats();
  const still = useSettings().settings.motion === 'still';
  const real: PlanCounts & { free: number } = {
    free: stats?.tiers.free ?? 0, plus: stats?.tiers.plus ?? 0, pro: stats?.tiers.pro ?? 0,
    homeschool: stats?.tiers.homeschool ?? 0, schoolSeats: stats?.tiers.school ?? 0,
  };
  const paidReal = real.plus + real.pro + real.homeschool + real.schoolSeats;
  // Until real paid accounts exist, the forecast runs on planning numbers.
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
  const start: PlanCounts = paidReal > 0 ? real : plan;
  const lines = useMemo(() => SCENARIOS.map((s) => ({ ...s, points: forecast(start, (plan.growth / 100) * s.factor, plan.churn / 100, 12) })), [start.plus, start.pro, start.homeschool, start.schoolSeats, plan.growth, plan.churn]); // eslint-disable-line react-hooks/exhaustive-deps
  const expected = lines[1].points;
  const mrrNow = mrrOf(start);

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
    { icon: UsersThree, label: t('line.signups'), value: String(stats?.teachers ?? 0), on: !!stats },
    { icon: User, label: t('line.free'), value: String(real.free), on: real.free > 0 },
    { icon: Lightning, label: t('line.paid'), value: String(paidReal), on: paidReal > 0 },
    { icon: Gear, label: t('line.mrr'), value: money(mrrOf(real)), on: paidReal > 0 },
    { icon: CreditCard, label: t('line.stripe'), value: stripe?.chargesEnabled ? t('line.on') : t('line.off'), on: !!stripe?.chargesEnabled },
  ];
  const stripeSteps: { label: string; ok: boolean; hint?: string }[] = [
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
    <main className="w-full max-w-[1600px] mx-auto px-4 lg:px-6 pt-3 pb-3 grid gap-3 lg:h-[calc(100dvh-4rem)] lg:grid-rows-[auto_auto_minmax(0,1fr)_minmax(0,1.15fr)]">
      <header className="flex items-center gap-3 flex-wrap">
        <Link to="/owner" className="min-h-10 px-3 rounded-pill border-[2px] border-border bg-surface inline-flex items-center gap-1.5 font-bold no-underline text-text"><ArrowLeft weight="bold" size={16} />{t('line.back')}</Link>
        <h1 className="title-bubble text-3xl flex items-center gap-2 flex-1" style={{ color: 'var(--text)' }}><Factory weight="fill" size={32} />{t('line.title')}</h1>
        {problem && <p className="text-sm font-bold text-muted max-w-md">{problem}</p>}
      </header>

      {/* The line: sign-ups ride the belt from station to station. */}
      <section aria-label={t('line.belt')} className="relative bg-surface border-[2.5px] border-border rounded-panel px-4 pt-3 pb-7" style={{ boxShadow: 'var(--shadow-sticker)' }}>
        <div className="grid grid-cols-5 gap-3 relative z-10">
          {stations.map((s, i) => (
            <motion.div key={s.label} className="rounded-input border-[2.5px] border-border bg-surface-2 px-3 py-2 grid gap-0.5 justify-items-center text-center" whileHover={still ? undefined : { y: -4 }}>
              <span className="flex items-center gap-2">
                <s.icon weight="fill" size={22} aria-hidden="true" />
                <span className={`w-3 h-3 rounded-full border-[1.5px] border-border ${s.on ? 'bg-success' : 'bg-surface'} ${s.on && !still ? 'animate-pulse' : ''}`} aria-label={s.on ? t('line.running') : t('line.waiting')} />
              </span>
              <span className="text-xs font-bold uppercase tracking-wide text-muted">{i + 1}. {s.label}</span>
              <span className="font-display text-2xl tabular-nums">{s.value}</span>
            </motion.div>
          ))}
        </div>
        <div aria-hidden="true" className={`absolute left-4 right-4 bottom-2 h-4 rounded-pill border-[2px] border-border ${still ? '' : 'belt-move'}`}
          style={{ backgroundImage: 'repeating-linear-gradient(90deg, #474241 0 10px, #6b6862 10px 20px)' }} />
        {!still && [0, 1, 2, 3].map((k) => (
          <motion.span key={k} aria-hidden="true" className="absolute bottom-[1.05rem] w-4 h-4 rounded-[4px] border-[2px] border-border z-20" style={{ background: PLAN[k].color }}
            initial={{ left: '2%' }} animate={{ left: ['2%', '96%'] }} transition={{ duration: 9, repeat: Infinity, ease: 'linear', delay: k * 2.25 }} />
        ))}
      </section>

      <div className="grid lg:grid-cols-4 gap-3 min-h-0">
        <Panel title={t('line.plans')}>
          <PlanBars counts={real} />
        </Panel>
        <Panel title={t('line.weekly')}>
          <WeekBars weeks={stats?.signups ?? []} />
        </Panel>
        <Panel wide title={t('line.forecast')} note={paidReal > 0 ? t('line.fromReal') : t('line.fromPlan')}>
          <ForecastChart lines={lines} still={still} />
          <div className="grid grid-cols-4 gap-2">
            {[[t('line.now'), mrrNow], [monthName(expected[2].date), expected[2].total], [monthName(expected[5].date), expected[5].total], [monthName(expected[11].date), expected[11].total]].map(([l, v]) => (
              <div key={String(l)} className="rounded-input border-[2px] border-border-soft px-2 py-0.5 flex items-baseline justify-between gap-1"><p className="text-[11px] font-bold uppercase text-muted">{l}</p><p className="font-display text-base tabular-nums">{money(Number(v))}</p></div>
            ))}
          </div>
          <p className="text-[11px] font-bold text-muted">{t('line.totalsNote')}</p>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-4 gap-3 min-h-0">
        <Panel title={t('line.inputs')}>
          {paidReal === 0 && (['plus', 'pro', 'homeschool', 'schoolSeats'] as const).map((k) => (
            <Slide key={k} label={t(`line.in.${k}` as 'line.in.plus')} value={plan[k]} max={k === 'schoolSeats' ? 1000 : 500} onChange={(v) => setPlan({ ...plan, [k]: v })} />
          ))}
          <Slide label={t('line.in.growth')} value={plan.growth} max={30} show={(v) => `${v}%`} onChange={(v) => setPlan({ ...plan, growth: v })} />
          <Slide label={t('line.in.churn')} value={plan.churn} max={15} show={(v) => `${v}%`} onChange={(v) => setPlan({ ...plan, churn: v })} />
          <p className="text-[11px] font-bold text-muted">{t('line.prices', { plus: PRICES_USD_PER_YEAR.plus, pro: PRICES_USD_PER_YEAR.pro, home: PRICES_USD_PER_YEAR.homeschool })}</p>
        </Panel>
        <Panel title={t('line.stripeTitle')} note={stripeProblem ? t('line.stripeUnreachable') : t('line.stripeCount', { n: stripeOk, total: stripeSteps.length })}>
          <ol className="grid gap-1 list-none m-0 p-0">
            {stripeSteps.map((s) => (
              <li key={s.label} title={s.hint} className="flex items-center gap-2 text-sm font-bold">
                {s.ok ? <CheckCircle weight="fill" size={20} className="text-[#1d7a52] shrink-0" aria-label={t('line.ready')} /> : <CircleDashed weight="bold" size={20} className="text-muted shrink-0" aria-label={t('line.notYet')} />}
                <span className={s.ok ? '' : 'text-muted'}>{s.label}</span>
              </li>
            ))}
          </ol>
          {!stripe?.secretKey && <p className="text-xs font-bold">{t('line.stripeHow')}</p>}
        </Panel>
        <Panel wide title={t('line.release')} note={daysLeft === null ? t('line.noDate') : daysLeft >= 0 ? t('line.daysLeft', { n: daysLeft }) : t('line.pastDate')}>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-4 rounded-pill border-[2px] border-border bg-surface-2 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t('line.release')}>
              <motion.div className="h-full bg-success" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: still ? 0 : 0.8 }} />
            </div>
            <span className="font-display text-xl tabular-nums">{pct}%</span>
            <label className="text-xs font-bold flex items-center gap-1">{t('line.target')}
              <input type="date" value={releaseDate} onChange={(e) => { setReleaseDate(e.target.value); void data.setSetting('release-date', e.target.value); }} className="border-[2px] border-border rounded-input px-1 py-0.5 bg-surface" />
            </label>
          </div>
          <div className="grid sm:grid-cols-3 gap-x-4 gap-y-2 min-h-0 overflow-y-auto pr-1">
            {RELEASE.map((st) => {
              const n = st.items.filter((i) => isDone(i.id, i.state)).length;
              return (
                <div key={st.id} className="grid gap-0.5 content-start">
                  <p className="text-xs font-bold uppercase tracking-wide flex justify-between"><span>{st.title}</span><span className="tabular-nums text-muted">{n}/{st.items.length}</span></p>
                  {st.items.map((it) => {
                    const done = isDone(it.id, it.state);
                    return (
                      <label key={it.id} className="flex items-start gap-1.5 text-xs leading-snug cursor-pointer" title={it.note}>
                        <input type="checkbox" checked={done} onChange={() => toggle(it.id, it.state)} className="mt-0.5 accent-[#1d7a52]" />
                        <span className={done ? 'line-through text-muted' : ''}>{it.text}</span>
                        {!done && <span className={`ml-auto shrink-0 rounded-pill px-1.5 text-[10px] font-bold border-[1.5px] border-border ${it.state === 'you' ? 'bg-accent' : 'bg-quiz-blue'}`}>{it.state === 'you' ? <><User weight="bold" size={10} className="inline" /> {t('line.you')}</> : <><Hammer weight="bold" size={10} className="inline" /> {t('line.build')}</>}</span>}
                      </label>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </main>
  );
}

function Panel({ title, note, wide = false, children }: { title: string; note?: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <section aria-label={title} className={`bg-surface border-[2.5px] border-border rounded-panel px-4 py-3 grid gap-2 content-start min-w-0 min-h-0 overflow-hidden ${wide ? 'lg:col-span-2' : ''}`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
      <div className="flex items-baseline justify-between gap-2"><h2 className="font-heading text-lg font-bold">{title}</h2>{note && <span className="text-xs font-bold text-muted text-right">{note}</span>}</div>
      {children}
    </section>
  );
}

function Slide({ label, value, max, onChange, show = String }: { label: string; value: number; max: number; onChange: (v: number) => void; show?: (v: number) => string }) {
  return (
    <label className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)_2.5rem] items-center gap-2 text-xs font-bold">
      <span>{label}</span>
      <input type="range" min={0} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="accent-[#2a78d6]" />
      <span className="tabular-nums text-right">{show(value)}</span>
    </label>
  );
}

// Accounts by plan: one bar per plan, labeled, with the free count beside.
function PlanBars({ counts }: { counts: PlanCounts & { free: number } }) {
  const rows = [
    { id: 'free', label: t('line.p.free'), n: counts.free, color: FREE },
    { id: 'plus', label: t('line.p.plus'), n: counts.plus, color: PLAN[0].color },
    { id: 'pro', label: t('line.p.pro'), n: counts.pro, color: PLAN[1].color },
    { id: 'homeschool', label: t('line.p.homeschool'), n: counts.homeschool, color: PLAN[2].color },
    { id: 'school', label: t('line.p.school'), n: counts.schoolSeats, color: PLAN[3].color },
  ];
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">{t('line.plans')}</caption>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} title={`${r.label}: ${r.n}`}>
            <th scope="row" className="text-left font-bold py-1 pr-2 w-28">{r.label}</th>
            <td className="w-full py-1">
              <div className="h-5 rounded-r-[4px] min-w-[3px]" style={{ width: `${(r.n / max) * 100}%`, background: r.color }} />
            </td>
            <td className="pl-2 font-display tabular-nums text-right">{r.n}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Sign-ups each week: thin bars, the latest labeled.
function WeekBars({ weeks }: { weeks: { week: string; n: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  if (!weeks.length) return <p className="text-sm font-bold text-muted">{t('line.noWeeks')}</p>;
  const list = weeks.slice(-12);
  const max = Math.max(1, ...list.map((w) => w.n));
  const W = 300, H = 120;
  const bw = W / list.length;
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H + 18}`} className="w-full" role="img" aria-label={t('line.weekly')} onMouseLeave={() => setHover(null)}>
        <line x1={0} y1={H} x2={W} y2={H} stroke="#d6d4cd" />
        {list.map((w, i) => {
          const h = (w.n / max) * (H - 16);
          return (
            <g key={w.week} onMouseEnter={() => setHover(i)}>
              <rect x={i * bw} y={0} width={bw} height={H} fill="transparent" />
              <rect x={i * bw + 2} y={H - h} width={bw - 4} height={Math.max(0, h)} rx={4} fill="#2a78d6" opacity={hover === null || hover === i ? 1 : 0.5} />
            </g>
          );
        })}
        <text x={W - 2} y={H + 14} textAnchor="end" fontSize="10" fill="currentColor">{list[list.length - 1].week}</text>
        <text x={2} y={H + 14} fontSize="10" fill="currentColor">{list[0].week}</text>
      </svg>
      {hover !== null && <p className="absolute top-0 right-0 text-xs font-bold bg-surface border-[1.5px] border-border rounded-input px-2 py-0.5">{t('line.weekTip', { week: list[hover].week, n: list[hover].n })}</p>}
    </div>
  );
}

// Income forecast: three lines over the next 12 months, with a crosshair.
function ForecastChart({ lines, still }: { lines: { id: string; points: { date: Date; mrr: number }[] }[]; still: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 560, H = 95, L = 40;
  const pts = lines[0].points;
  const max = Math.max(1, ...lines.flatMap((l) => l.points.map((p) => p.mrr)));
  const x = (i: number) => L + (i / (pts.length - 1)) * (W - L - 8);
  const y = (v: number) => H - (v / max) * (H - 12);
  const stroke: Record<string, { c: string; dash?: string }> = { slow: { c: '#7a7870', dash: '4 4' }, expected: { c: '#2a78d6' }, fast: { c: '#1baf7a', dash: '8 4' } };
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H + 18}`} className="w-full" role="img" aria-label={t('line.forecast')}
        onMouseMove={(e) => { const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect(); const px = ((e.clientX - r.left) / r.width) * W; setHover(Math.max(0, Math.min(pts.length - 1, Math.round(((px - L) / (W - L - 8)) * (pts.length - 1))))); }}
        onMouseLeave={() => setHover(null)}>
        {[0, 0.5, 1].map((f) => <g key={f}><line x1={L} y1={y(max * f)} x2={W - 8} y2={y(max * f)} stroke="#e6e4dd" /><text x={L - 4} y={y(max * f) + 3} textAnchor="end" fontSize="9" fill="currentColor">{money(max * f)}</text></g>)}
        {lines.map((l) => (
          <motion.polyline key={l.id} fill="none" stroke={stroke[l.id].c} strokeWidth={2} strokeDasharray={stroke[l.id].dash} strokeLinejoin="round"
            points={l.points.map((p, i) => `${x(i)},${y(p.mrr)}`).join(' ')} initial={still ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2 }} />
        ))}
        {[0, 5, 11].map((i) => <text key={i} x={x(i)} y={H + 14} textAnchor={i === 0 ? 'start' : i === 11 ? 'end' : 'middle'} fontSize="10" fill="currentColor">{monthName(pts[i].date)}</text>)}
        {hover !== null && <line x1={x(hover)} y1={0} x2={x(hover)} y2={H} stroke="#474241" strokeWidth={1} />}
        {hover !== null && lines.map((l) => <circle key={l.id} cx={x(hover)} cy={y(l.points[hover].mrr)} r={4} fill={stroke[l.id].c} stroke="#fff" strokeWidth={2} />)}
      </svg>
      <div className="flex gap-3 text-[11px] font-bold">
        {lines.map((l) => <span key={l.id} className="inline-flex items-center gap-1"><svg width="18" height="6"><line x1="0" y1="3" x2="18" y2="3" stroke={stroke[l.id].c} strokeWidth="2" strokeDasharray={stroke[l.id].dash} /></svg>{t(`line.sc.${l.id}` as 'line.sc.slow')}</span>)}
        <span className="ml-auto text-muted">{t('line.perMonth')}</span>
      </div>
      {hover !== null && (
        <div className="absolute top-0 right-0 text-xs font-bold bg-surface border-[1.5px] border-border rounded-input px-2 py-1 grid">
          <span>{pts[hover].date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          {lines.map((l) => <span key={l.id}>{t(`line.sc.${l.id}` as 'line.sc.slow')}: {money(l.points[hover].mrr)}</span>)}
        </div>
      )}
    </div>
  );
}
