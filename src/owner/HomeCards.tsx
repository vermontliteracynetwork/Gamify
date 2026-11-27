import { useEffect, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ChartLineUp, ChatCircleDots, CreditCard, Crown, CurrencyDollar, Eye, Stack, Handshake, ListChecks, Megaphone, MoonStars, Notebook, PaintBrush, RocketLaunch, Robot, Ticket, UsersThree, type Icon } from '@phosphor-icons/react';
import { data } from '../data';
import { useAsync } from '../data/hooks';
import { useSettings } from '../settings/SettingsContext';
import { useMadeThemes } from '../theme/made';
import { listSurveys } from '../beta/surveys';
import { t } from '../i18n';
import { WAITING } from './waiting';
import { TEAM } from './agents';
import { RELEASE } from './release';
import { mrrOf } from './forecast';
import { POSTS, shownStatus, type Decision } from './marketing/plan';
import type { useOwnerStats } from './DevCards';
import { HOME } from './homeCopy';
import { supabase } from '../data/supabase';
import type { GameTheme } from '../theme/types';

type Range = 'day' | 'week' | 'month' | 'ytd' | 'all';
const RANGES: Range[] = ['day', 'week', 'month', 'ytd', 'all'];
const RANGE_LABEL: Record<Range, string> = { day: 'today', week: 'this week', month: 'this month', ytd: 'this year', all: 'all time' };
const RANGE_SHORT: Record<Range, string> = { day: 'Day', week: 'Week', month: 'Month', ytd: 'YTD', all: 'All' };
// A small segmented control inside a card; taps never open the card.
function RangePick({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  return (
    <span className="flex flex-wrap gap-1" role="group" aria-label="Time range" onClick={(e) => e.stopPropagation()}>
      {RANGES.map((r) => <span key={r} role="button" tabIndex={0} aria-pressed={r === value} onClick={() => onChange(r)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onChange(r); } }}
        className={`min-h-8 px-2.5 rounded-full border text-xs font-bold inline-flex items-center cursor-pointer ${r === value ? 'bg-[#ede9fe] border-[#6a45f0] text-[#6a45f0]' : 'border-[#e4e4e7]'}`}>{RANGE_SHORT[r]}</span>)}
    </span>
  );
}
// Where shared themes are in review, as one bar (owner, 2026-11-27: "a visual
// progression ... auto ai approved, ... held for review, ... auto strike down").
function ThemeFlow({ themes }: { themes: GameTheme[] }) {
  const g = themes.filter((th) => th.gallery);
  const parts: [string, number, string][] = [
    ['AI approved', g.filter((th) => th.gallery!.status === 'approved' && th.gallery!.by === 'ai').length, '#22b04a'],
    ['You approved', g.filter((th) => th.gallery!.status === 'approved' && th.gallery!.by !== 'ai').length, '#4ba3e8'],
    ['Held for review', g.filter((th) => th.gallery!.status === 'pending' || th.gallery!.status === 'revise').length, '#fabe37'],
    ['Auto struck', g.filter((th) => th.gallery!.status === 'declined' && th.gallery!.by === 'ai').length, '#f055a5'],
  ];
  const total = Math.max(1, parts.reduce((n, p) => n + p[1], 0));
  return (
    <span className="grid gap-1.5 w-full">
      <span className="flex h-3 rounded-full overflow-hidden bg-[#f4f4f5]" role="img" aria-label={parts.map(([l, n]) => `${l} ${n}`).join(', ')}>
        {parts.map(([l, n, c]) => n > 0 && <span key={l} style={{ width: `${(n / total) * 100}%`, background: c }} />)}
      </span>
      <span className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs font-semibold text-[#52525b]">{parts.map(([l, n, c]) => <span key={l} className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: c }} />{l} {n}</span>)}</span>
    </span>
  );
}

// The public launch target (teacher, 2026-11-23: Monday 2026-11-30).
export const LAUNCH_DAY = '2026-11-30';

// The Developer Portal home (owner, 2026-11-26: "spaced out simpler, card
// style dashboard ... more visual ... simple, adhd friendly"). Every card is
// one thing: an icon, one big number or status chip, one short line and one
// action that opens the full section (progressive disclosure, two levels
// only). Cards sit in four named groups so the eye has a short path
// (chunking), the same order every day (predictable layout), and only the
// cards that need her wear the purple (preattentive color, one signal).

type Tone = 'hero' | 'needs' | 'calm' | 'done';
type Go = (id: string) => void;
interface CardSpec { id: string; icon: Icon; value: ReactNode; label: string; action: string; to: string; tone: Tone; chip?: string; extra?: ReactNode; wide?: boolean }

export default function HomeCards({ owner, go }: { owner: ReturnType<typeof useOwnerStats>; go: Go }) {
  const still = useSettings().settings.motion === 'still';
  const { value: done = [] } = useAsync(() => data.getSetting<string[]>('owner-waiting-done').then((v) => v ?? []));
  const { value: reports = [] } = useAsync(() => data.listFeedback());
  const { value: meta = {} } = useAsync(() => data.getSetting<Record<string, { status: string }>>('feedback-meta').then((v) => v ?? {}));
  const { value: checks = {} } = useAsync(() => data.getSetting<Record<string, boolean>>('release-checks').then((v) => v ?? {}));
  const { value: decisions = {} } = useAsync(() => data.getSetting<Record<string, Decision>>('marketing-decisions').then((v) => v ?? {}));
  const { value: surveys = [] } = useAsync(() => listSurveys());
  const { themes } = useMadeThemes();
  const [stripe, setStripe] = useState<{ ok: number; total: number } | null>(null);
  useEffect(() => {
    void fetch('/api/stripe-status').then((r) => (r.ok ? r.json() : Promise.reject())).then((s: Record<string, unknown>) => {
      const steps = [s.reachable, s.secretKey, !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY, Number(s.prices ?? 0) >= 3, s.webhook, s.chargesEnabled, s.live];
      setStripe({ ok: steps.filter(Boolean).length, total: steps.length });
    }).catch(() => setStripe({ ok: 0, total: 7 }));
  }, []);

  const open = WAITING.filter((w) => !done.includes(w.id));
  const fresh = reports.filter((r) => (meta[r.id]?.status ?? 'new') === 'new').length;
  const days = Math.max(0, Math.ceil((new Date(`${LAUNCH_DAY}T00:00:00`).getTime() - Date.now()) / 86400000));
  const items = RELEASE.flatMap((s) => s.items);
  const pct = Math.round((items.filter((i) => checks[i.id] ?? i.state === 'done').length / items.length) * 100);
  const stats = owner.stats;
  const tiers = stats?.tiers ?? {};
  const paid = (tiers.plus ?? 0) + (tiers.pro ?? 0) + (tiers.homeschool ?? 0) + (tiers.school ?? 0);
  const mrr = mrrOf({ plus: tiers.plus ?? 0, pro: tiers.pro ?? 0, homeschool: tiers.homeschool ?? 0, schoolSeats: tiers.school ?? 0 });
  const asks = TEAM.reduce((n, m) => n + m.needsYou.length, 0);
  const working = TEAM.filter((m) => m.status === 'working').length;
  const okPosts = POSTS.filter((p) => shownStatus(p, decisions) === 'needs-ok').length;
  const pending = themes.filter((th) => th.gallery?.status === 'pending').length;
  const [range, setRange] = useState<Range>('week');
  const [setCounts, setSetCounts] = useState<Record<Range, number> | null>(null);
  useEffect(() => { if (supabase) void supabase.rpc('owner_set_counts').then(({ data: d }) => { if (d) setSetCounts(d as Record<Range, number>); }); }, []);

  const groups: { id: string; title: string; cards: CardSpec[] }[] = [
    { id: 'now', title: HOME.groupNow, cards: [
      { id: 'waiting', icon: ListChecks, value: open.length, label: open.length === 1 ? HOME.waitingOne : HOME.waiting, action: HOME.openList, to: 'waiting', tone: open.length ? 'hero' : 'done', wide: true,
        extra: open.length > 0 && <span className="dash-next">{open.slice(0, 3).map((w) => <span key={w.id}>{w.title}</span>)}</span> },
      { id: 'reports', icon: ChatCircleDots, value: fresh, label: HOME.reports, action: HOME.read, to: 'feedback', tone: fresh ? 'needs' : 'calm' },
      { id: 'launch', icon: RocketLaunch, value: days, label: days === 1 ? HOME.launchOne : HOME.launch, action: HOME.checklist, to: 'release', tone: 'calm', chip: HOME.ready(pct),
        extra: <Bar pct={pct} still={still} label={HOME.ready(pct)} /> },
    ] },
    { id: 'money', title: HOME.groupMoney, cards: [
      { id: 'teachers', icon: UsersThree, value: stats ? stats.teachers : '–', label: HOME.teachers, action: HOME.open, to: 'subs', tone: 'calm', chip: stats ? HOME.freePaid(tiers.free ?? 0, paid) : HOME.noCloud },
      { id: 'mrr', icon: CurrencyDollar, value: stats ? `$${Math.round(mrr).toLocaleString()}` : '–', label: HOME.mrr, action: HOME.forecast, to: 'forecast', tone: 'calm', chip: stats ? HOME.paying(paid) : HOME.noCloud },
      { id: 'stripe', icon: CreditCard, value: stripe ? `${stripe.ok}/${stripe.total}` : '…', label: HOME.stripe, action: HOME.steps, to: 'stripe', tone: stripe && stripe.ok === stripe.total ? 'done' : 'calm', chip: stripe && stripe.ok === stripe.total ? HOME.on : HOME.off },
      // Question sets teachers made (not hers), by range (owner, 2026-11-27).
      { id: 'sets', icon: Stack, value: setCounts ? setCounts[range] : '–', label: `question sets by teachers, ${RANGE_LABEL[range]}`, action: HOME.usage, to: 'usage', tone: 'calm', extra: <RangePick value={range} onChange={setRange} /> },
    ] },
    { id: 'people', title: HOME.groupPeople, cards: [
      { id: 'team', icon: Robot, value: working, label: HOME.agents, action: HOME.meet, to: 'team', tone: asks ? 'needs' : 'calm', chip: asks ? HOME.asks(asks) : undefined },
      { id: 'posts', icon: Megaphone, value: okPosts, label: HOME.posts, action: HOME.review, to: 'marketing', tone: okPosts ? 'needs' : 'calm' },
      { id: 'gallery', icon: PaintBrush, value: pending, label: HOME.gallery, action: HOME.review, to: 'gallery', tone: pending ? 'needs' : 'calm', extra: <ThemeFlow themes={themes} /> },
      { id: 'beta', icon: UsersThree, value: surveys.length, label: HOME.surveys, action: HOME.open, to: 'beta', tone: 'calm' },
    ] },
  ];
  const tools: { icon: Icon; label: string; to: string }[] = [
    { icon: Crown, label: t('owner.ceo'), to: 'ceo' },
    { icon: ChartLineUp, label: t('owner.chart'), to: 'growth' },
    { icon: Notebook, label: t('owner.books'), to: 'books' },
    { icon: Handshake, label: t('owner.affiliates'), to: 'affiliates' },
    { icon: Ticket, label: HOME.access, to: 'access' },
    { icon: Eye, label: t('owner.preview'), to: 'preview' },
    { icon: MoonStars, label: t('owner.astro'), to: 'astro' },
  ];

  return (
    <div className="dash-home">
      {owner.problem && <p className="dash-note">{owner.problem}</p>}
      {groups.map((g) => (
        <section key={g.id} className="dash-group" aria-labelledby={`home-${g.id}`}>
          <h2 id={`home-${g.id}`} className="dash-group-title">{g.title}</h2>
          <ul className="dash-cards">
            {g.cards.map((c) => <li key={c.id} className={c.wide ? 'dash-wide' : undefined}><HomeCard c={c} go={go} still={still} /></li>)}
          </ul>
        </section>
      ))}
      <section className="dash-group" aria-labelledby="home-tools">
        <h2 id="home-tools" className="dash-group-title">{HOME.groupTools}</h2>
        <ul className="dash-tools">
          {tools.map(({ icon: I, label, to }) => (
            <li key={to}><button type="button" className="dash-tool" onClick={() => go(to)}><span className="dash-icon dash-icon-sm" aria-hidden="true"><I size={20} weight="duotone" /></span><span>{label}</span></button></li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function HomeCard({ c, go, still }: { c: CardSpec; go: Go; still: boolean }) {
  const I = c.icon;
  return (
    <motion.button type="button" data-tone={c.tone} className="dash-tile" onClick={() => go(c.to)}
      whileHover={still ? undefined : { y: -3 }} whileTap={still ? undefined : { scale: 0.98 }} transition={{ type: 'spring', stiffness: 420, damping: 28 }}>
      <span className="dash-tile-top">
        <span className="dash-icon" aria-hidden="true"><I size={24} weight="duotone" /></span>
        {c.chip && <span className="dash-chip">{c.chip}</span>}
      </span>
      <span className="dash-tile-value">{c.value}</span>
      <span className="dash-tile-label">{c.label}</span>
      {c.extra}
      <span className="dash-tile-action">{c.action}<ArrowRight size={16} weight="bold" aria-hidden="true" /></span>
    </motion.button>
  );
}

function Bar({ pct, still, label }: { pct: number; still: boolean; label: string }) {
  return (
    <span className="dash-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <motion.span className="dash-bar-fill" initial={{ width: still ? `${pct}%` : 0 }} animate={{ width: `${pct}%` }} transition={{ duration: still ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] }} />
    </span>
  );
}
