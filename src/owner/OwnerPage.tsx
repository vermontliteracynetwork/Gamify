import DashEmpty from './DashEmpty';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import ProductionLine from './ProductionLine';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckSquare, FileText, Siren, ListChecks, ChartLineUp, ChatCircleDots, CreditCard, Crown, CurrencyDollar, Eye, Factory, GameController, Handshake, Megaphone, MoonStars, Notebook, PaintBrush, SquaresFour, Robot, Star, Ticket, UsersThree } from '@phosphor-icons/react';
import { data } from '../data';
import { useAsync } from '../data/hooks';
import type { FeedbackReport } from '../data/types';
import { GAMES } from '../games/registry';
import { t } from '../i18n';
import { creditLine } from '../theme/credit';
import { SPECIAL_DAYS, challengeEntries, closeDate, tagLabel, winnerDate } from '../theme/tags';
import { loadVotes, saveWinner, tally, topTen, useWinners, type VoteStore } from '../theme/votes';
import PinGate from '../settings/PinGate';
import { Slider } from '../ui/fields';
import { Button } from '../ui/kit';
import type { StringKey } from '../i18n/en';
import { saveMadeTheme, useMadeThemes } from '../theme/made';
import ThemePreview from '../theme/builder/ThemePreview';
import { GALLERY_REASONS, type GalleryReason, type GameTheme } from '../theme/types';
import { monthlyRevenue, project, type Subs } from './income';
import { listCheckIns, listSurveys, recommendScore } from '../beta/surveys';
import { useTier } from '../data/hooks';
import { growthTips } from './growth';
import { WAITING } from './waiting';
import HomeCards from './HomeCards';
import { HOME } from './homeCopy';

import OwnerGate from './OwnerGate';
import { ChecklistsCard, DoFirstCard, DoFirstStrip, DoLinks, DraftsCard, UrgentPopup } from './FocusCards';
import TeamCard from './TeamCard';
import { GrowthChartCard } from './GrowthChart';
import { supabase } from '../data/supabase';
import { quoteDetails, quotePdf, type QuoteRequest } from '../lib/quotePdf';
import MarketingCard from './marketing/MarketingCard';
import CeoCard from './CeoCard';
import AstroCard from './AstroCard';
import AstroHomeCard from './AstroHomeCard';
import AffiliatesCard from './AffiliatesCard';
import BetaSpec from './BetaSpec';
import BooksCard from './books/BooksCard';
import { AccessCard, PlanPreviewCard, SubsCard, useOwnerStats } from './DevCards';

export const OWNER_PIN_KEY = 'owner-pin-hash';

// The owner's developer view (development plan Stage 7B). Until
// accounts exist (Stage 5) it opens with its own 4-digit owner PIN. Cards
// that need Stripe or cloud data say so until those connect.
type Status = 'new' | 'looking' | 'fixed' | 'shipped';
interface FeedbackMeta { status: Status; social: boolean }

export default function OwnerPage(_props: { view?: 'line' } = {}) {
  const [open, setOpen] = useState(false);
  // With cloud accounts on: the owner account plus an authenticator code.
  const inner = <Desktop />;
  if (supabase) return <OwnerGate>{inner}</OwnerGate>;
  if (!open) {
    return (
      <main className="max-w-md mx-auto px-4 pt-10 pb-24">
        <div className="bg-surface border-bold border-border rounded-panel p-5"><p className="font-display text-2xl text-center mb-2">{t('owner.title')}</p><PinGate pinKey={OWNER_PIN_KEY} createLabel={t('owner.pinCreate')} onUnlock={() => setOpen(true)} /></div>
      </main>
    );
  }
  return inner;
}

type SectionId = 'focus' | 'checklists' | 'drafts' | 'overview' | 'ceo' | 'team' | 'release' | 'forecast' | 'stripe' | 'waiting' | 'feedback' | 'subs' | 'growth' | 'usage' | 'income' | 'books' | 'access' | 'preview' | 'gallery' | 'beta' | 'marketing' | 'astro' | 'affiliates';
const SECTIONS: { id: SectionId; label: StringKey; icon: typeof Star; group: NavGroup }[] = [
  { id: 'overview', label: 'owner.dashboard', icon: SquaresFour, group: 'home' },
  { id: 'focus', label: 'owner.focus', icon: Siren, group: 'today' },
  { id: 'checklists', label: 'owner.checklists', icon: CheckSquare, group: 'today' },
  { id: 'waiting', label: 'owner.waiting', icon: ListChecks, group: 'today' },
  { id: 'feedback', label: 'owner.feedback', icon: ChatCircleDots, group: 'today' },
  { id: 'release', label: 'owner.release', icon: Factory, group: 'today' },
  { id: 'subs', label: 'owner.subs', icon: CreditCard, group: 'money' },
  { id: 'forecast', label: 'owner.forecast', icon: CurrencyDollar, group: 'money' },
  { id: 'stripe', label: 'owner.stripe', icon: CreditCard, group: 'money' },
  { id: 'growth', label: 'owner.chart', icon: ChartLineUp, group: 'money' },
  { id: 'usage', label: 'owner.usage', icon: GameController, group: 'money' },
  { id: 'books', label: 'owner.books', icon: Notebook, group: 'money' },
  { id: 'ceo', label: 'owner.ceo', icon: Crown, group: 'team' },
  { id: 'team', label: 'owner.team', icon: Robot, group: 'team' },
  { id: 'marketing', label: 'owner.marketing', icon: Megaphone, group: 'team' },
  { id: 'affiliates', label: 'owner.affiliates', icon: Handshake, group: 'team' },
  { id: 'gallery', label: 'owner.gallery', icon: PaintBrush, group: 'team' },
  { id: 'beta', label: 'owner.beta', icon: UsersThree, group: 'team' },
  { id: 'access', label: 'owner.access', icon: Ticket, group: 'tools' },
  { id: 'preview', label: 'owner.preview', icon: Eye, group: 'tools' },
  { id: 'drafts', label: 'owner.drafts', icon: FileText, group: 'tools' },
  { id: 'astro', label: 'owner.astro', icon: MoonStars, group: 'tools' },
];
// The side menu in the same four groups as the home cards (chunking: a
// short labelled list is found faster than one long one).
type NavGroup = 'home' | 'today' | 'money' | 'team' | 'tools';
const NAV_GROUPS: { id: NavGroup; title: string }[] = [
  { id: 'home', title: '' }, { id: 'today', title: HOME.groupNow }, { id: 'money', title: HOME.groupMoney }, { id: 'team', title: HOME.groupPeople }, { id: 'tools', title: HOME.groupTools },
];

// The developer dashboard (teacher, 2026-11-13: "simple, clean lines,
// grayscale with purple accents ... a one screen view that is well spaced
// out, simple and responsive"). A side menu picks one section; Overview
// fits on one screen. Styled by .dev-dash in index.css, not the sticker look.
function Desktop() {
  const [params, setParams] = useSearchParams();
  const section = (SECTIONS.find((x) => x.id === params.get('s'))?.id ?? 'overview') as SectionId;
  const go = (id: SectionId) => setParams(id === 'overview' ? {} : { s: id }, { replace: true });
  const owner = useOwnerStats();
  const current = SECTIONS.find((x) => x.id === section)!;
  const body: Record<SectionId, ReactNode> = {
    focus: <DoFirstCard go={(x) => go(x as SectionId)} />,
    checklists: <ChecklistsCard />,
    drafts: <DraftsCard />,
    overview: <div className="grid gap-8"><DoFirstStrip go={(x) => go(x as SectionId)} /><AstroHomeCard onMore={() => go('astro')} /><HomeCards owner={owner} go={(x) => go(x as SectionId)} /></div>,
    ceo: <CeoCard />,
    team: <TeamCard />,
    release: <ProductionLine section="release" />,
    forecast: <ProductionLine section="forecast" />,
    stripe: <ProductionLine section="stripe" />,
    waiting: <WaitingCard />,
    feedback: <FeedbackCard />,
    subs: <SubsCard {...owner} />,
    growth: <div className="grid gap-10"><GrowthChartCard {...owner} /><section aria-labelledby="tips-h" className="grid gap-3"><h2 id="tips-h" className="font-bold text-lg">{t('owner.growthTips')}</h2><GrowthCard /></section></div>,
    usage: <UsageCard />,
    income: <IncomeCard />,
    books: <BooksCard />,
    access: <AccessCard />,
    preview: <PlanPreviewCard />,
    gallery: <GalleryCard />,
    beta: <div className="grid gap-6"><BetaSpec /><BetaCard /></div>,
    marketing: <MarketingCard />,
    astro: <AstroCard />,
    affiliates: <AffiliatesCard />,
  };
  const linkCls = 'dash-nav-item no-underline';
  return (
    <main className="dev-dash">
      <UrgentPopup onOpen={() => go('focus')} />
      <nav aria-label={t('owner.sections')} className="dash-side">
        <p className="dash-brand">{t('owner.title')}</p>
        {NAV_GROUPS.map((g) => (
          <div key={g.id} className="dash-nav-group" role={g.title ? 'group' : undefined} aria-label={g.title || undefined}>
            {g.title && <p className="dash-nav-title" aria-hidden="true">{g.title}</p>}
            <ul className="dash-nav">
              {SECTIONS.filter((x) => x.group === g.id).map(({ id, label, icon: Icon }) => (
                <li key={id}>
                  <button type="button" aria-current={section === id ? 'page' : undefined} onClick={() => go(id)} className="dash-nav-item">
                    <Icon size={18} aria-hidden="true" /><span>{t(label)}</span>
                  </button>
                </li>
              ))}
              {g.id === 'tools' && <li><Link to="/owner/themes" className={linkCls}><PaintBrush size={18} aria-hidden="true" /><span>{t('owner.themes')}</span></Link></li>}
            </ul>
          </div>
        ))}
      </nav>
      <section className="dash-main" aria-labelledby="dash-title">
        <header className="dash-head">
          <h1 id="dash-title" className="dash-title">{t(current.label)}</h1>
          <p className="dash-sub">{section === 'overview' ? t('owner.subtitle') : new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </header>
        <div className={section === 'overview' || section === 'release' || section === 'forecast' || section === 'stripe' ? 'dash-body' : 'dash-body dash-panel'}>{body[section]}</div>
      </section>
    </main>
  );
}

// Every Tell Gamify report: filter by kind, set a status, star the ones
// that would make a good social post.
function FeedbackCard() {
  const { value: reports = [], reload: reload2 } = useAsync(() => data.listFeedback());
  const { value: savedMeta, reload } = useAsync(() => data.getSetting<Record<string, FeedbackMeta>>('feedback-meta'));
  const meta = savedMeta ?? {};
  const [kind, setKind] = useState<FeedbackReport['kind'] | 'all'>('all');
  const shown = reports.filter((r) => kind === 'all' || r.kind === kind).slice().reverse();
  async function set(id: string, patch: Partial<FeedbackMeta>) {
    await data.setSetting('feedback-meta', { ...meta, [id]: { ...(meta[id] ?? { status: 'new' as Status, social: false }), ...patch } });
    reload();
  }
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t('owner.kind')}>
        {(['all', 'help', 'quote', 'beta', 'affiliate', 'bug', 'problem', 'idea'] as const).map((k) => (
          <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)} className={`min-h-10 px-3 rounded-pill border-std font-bold text-sm ${kind === k ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}>
            {t(`owner.kind.${k}`)} ({k === 'all' ? reports.length : reports.filter((r) => r.kind === k).length})
          </button>
        ))}
      </div>
      {shown.length === 0 && <DashEmpty text={t('owner.noFeedback')} icon={ChatCircleDots} />}
      <ul className="grid gap-2 list-none p-0 m-0 max-h-96 overflow-y-auto">
        {shown.map((r) => {
          const m = meta[r.id] ?? { status: 'new', social: false };
          return (
            <li key={r.id} className="rounded-input border-std border-border-soft p-2.5 grid gap-1.5">
              <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
                <span className="px-2 py-0.5 rounded-pill bg-surface-2 border border-border">{t(`owner.kind.${r.kind}`)}</span>
                <span>{t(`owner.role.${r.role}`)}</span>
                <span className="text-muted">{r.where} · {new Date(r.at).toLocaleDateString()}</span>
                <button type="button" aria-pressed={m.social} aria-label={t('owner.social')} onClick={() => void set(r.id, { social: !m.social })} className="ml-auto w-9 h-9 rounded-full border-std border-border flex items-center justify-center" style={{ background: m.social ? '#fdfd94' : undefined }}><Star weight={m.social ? 'fill' : 'bold'} size={16} /></button>
                <select aria-label={t('owner.status')} value={m.status} onChange={(e) => void set(r.id, { status: e.target.value as Status })} className="min-h-9 px-2 rounded-input border-std border-border font-bold">
                  {(['new', 'looking', 'fixed', 'shipped'] as const).map((s) => <option key={s} value={s}>{t(`owner.status.${s}`)}</option>)}
                </select>
              </div>
              <p className="font-semibold whitespace-pre-line">{r.details || t('owner.noDetails')}</p>
              {r.kind === 'quote' && quoteFrom(r.details) && <Button className="justify-self-start" onClick={() => downloadQuote(quoteFrom(r.details)!)}>{t('owner.quotePdf')}</Button>}
              {r.role === 'teacher' && <ReplyBox report={r} onSent={reload2} />}
            </li>
          );
        })}
      </ul>
      <p className="text-xs font-bold text-muted">{t('owner.feedbackNote')}</p>
    </div>
  );
}

// Games played and answers on this device (no student tracking).
// Beta surveys and class check-ins (development plan Stage 7B, Beta card).
function BetaCard() {
  const { value: surveys = [] } = useAsync(() => listSurveys());
  const { value: checkins = [] } = useAsync(() => listCheckIns());
  const going = surveys.length ? (surveys.reduce((n, a) => n + a.going, 0) / surveys.length).toFixed(1) : '-';
  const rec = recommendScore(surveys.map((a) => a.recommend));
  const feel = checkins.reduce((tl, c) => tl.map((n, i) => n + c.feel[i]), [0, 0, 0]);
  const kids = feel.reduce((a, b) => a + b, 0);
  const comments = surveys.filter((a) => a.better).slice(-3).reverse();
  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-3 gap-2">
        {[[t('owner.surveys'), surveys.length], [t('owner.going'), `${going} / 5`], [t('owner.recommend'), rec === null ? '-' : rec]].map(([l, v]) => (
          <div key={String(l)} className="rounded-input border-std border-border-soft p-2"><p className="text-xs font-bold uppercase text-muted">{l}</p><p className="font-display text-2xl">{v}</p></div>
        ))}
      </div>
      <p className="font-bold text-sm">{t('owner.checkins')}: {kids ? `${Math.round((feel[0] / kids) * 100)}% ${t('checkin.feel.0')}, ${Math.round((feel[1] / kids) * 100)}% ${t('checkin.feel.1')}, ${Math.round((feel[2] / kids) * 100)}% ${t('checkin.feel.2')} (${t('checkin.count', { count: kids })})` : '-'}</p>
      {comments.length > 0 && (
        <div className="grid gap-1"><p className="text-xs font-bold uppercase text-muted">{t('owner.comments')}</p>
          {comments.map((c) => <p key={c.at} className="text-sm font-semibold rounded-input bg-surface-2 p-2">{c.better}</p>)}</div>
      )}
      <p className="text-xs font-bold text-muted">{t('owner.surveyNote')} {t('owner.betaPlan')}</p>
    </div>
  );
}

function GrowthCard() {
  const tier = useTier();
  const { value } = useAsync(async () => {
    const [log, classes, sets, surveys] = await Promise.all([data.listQuestionLog(), data.listClassrooms(), data.listQuestionSets(), listSurveys()]);
    const now = Date.now(), week = 7 * 86400000;
    const inWeek = (k: number) => log.filter((e) => { const age = now - new Date(e.at).getTime(); return age >= k * week && age < (k + 1) * week; }).length;
    return { classes: classes.length, sets: sets.length, answersThisWeek: inWeek(0), answersLastWeek: inWeek(1), surveyAverage: surveys.length ? surveys.reduce((n, a) => n + a.going, 0) / surveys.length : null };
  });
  if (!value) return null;
  const tips = growthTips({ tier, ...value });
  return (
    <div className="grid gap-2">
      {tips.length ? <ul className="grid gap-1.5 list-none p-0 m-0">{tips.map((tip) => <li key={tip.id} className="font-semibold text-sm rounded-input bg-surface-2 p-2">{tip.text}</li>)}</ul>
        : <p className="font-semibold">{t('owner.growthNone')}</p>}
      <p className="text-xs font-bold text-muted">{t('owner.growthNote')}</p>
    </div>
  );
}

function UsageCard() {
  const { value: log = [] } = useAsync(() => data.listQuestionLog());
  const { value: classes = [] } = useAsync(() => data.listClassrooms());
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const byGame = useMemo(() => GAMES.map((g) => ({ g, n: log.filter((e) => e.gameId === g.id).length })).sort((a, b) => b.n - a.n), [log]);
  const max = Math.max(1, ...byGame.map((x) => x.n));
  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-3 gap-2">
        {[[t('owner.answers'), log.length], [t('owner.thisWeek'), log.filter((e) => e.at >= weekAgo).length], [t('owner.classes'), classes.length]].map(([l, v]) => (
          <div key={String(l)} className="rounded-input border-std border-border-soft p-2"><p className="text-xs font-bold uppercase text-muted">{l}</p><p className="font-display text-2xl">{v}</p></div>
        ))}
      </div>
      <ul className="grid gap-1 list-none p-0 m-0">
        {byGame.map(({ g, n }) => (
          <li key={g.id} className="grid grid-cols-[8rem_1fr_3rem] items-center gap-2 text-sm font-bold">
            <span className="truncate">{g.name}</span>
            <span className="h-3 rounded-pill bg-surface-2 border border-border overflow-hidden"><span className="block h-full" style={{ width: `${(n / max) * 100}%`, background: '#ddd6ff' }} /></span>
            <span className="tabular-nums text-right">{n}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs font-bold text-muted">{t('owner.usageNote')}</p>
    </div>
  );
}

// What-if income from plan counts (real Stripe numbers replace this in 7).
function IncomeCard() {
  const [s, setS] = useState<Subs & { growth: number }>({ plus: 20, pro: 5, schoolSeats: 0, growth: 5 });
  const subs = { plus: s.plus, pro: s.pro, schoolSeats: s.schoolSeats };
  const money = (n: number) => `$${n.toLocaleString()}`;
  return (
    <div className="grid gap-3">
      <Slider label={t('owner.plusTeachers')} min={0} max={500} value={s.plus} onChange={(v) => setS({ ...s, plus: v })} />
      <Slider label={t('owner.proTeachers')} min={0} max={500} value={s.pro} onChange={(v) => setS({ ...s, pro: v })} />
      <Slider label={t('owner.schoolSeats')} min={0} max={500} value={s.schoolSeats} onChange={(v) => setS({ ...s, schoolSeats: v })} />
      <Slider label={t('owner.growth')} min={0} max={30} value={s.growth} show={(v) => `${v}%`} onChange={(v) => setS({ ...s, growth: v })} />
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[[t('owner.mrr'), monthlyRevenue(subs)], ...[1, 3, 6, 12].map((m) => [t('owner.nextMonths', { count: m }), project(subs, s.growth / 100, m)])].map(([l, v]) => (
          <div key={String(l)} className="rounded-input border-std border-border-soft p-2"><p className="text-xs font-bold uppercase text-muted">{l}</p><p className="font-display text-xl tabular-nums">{money(Number(v))}</p></div>
        ))}
      </div>
      <p className="text-xs font-bold text-muted">{t('owner.incomeNote')}</p>
    </div>
  );
}

// Themes teachers sent to the public gallery, waiting for a look before any
// other teacher sees them (Stage 7B reports card, themes part).
function GalleryCard() {
  const { themes, reload } = useMadeThemes();
  const pending = themes.filter((th) => th.gallery?.status === 'pending');
  const [why, setWhy] = useState<Record<string, GalleryReason>>({});
  const [viewing, setViewing] = useState<GameTheme | null>(null);
  async function decide(th: GameTheme, status: 'approved' | 'declined' | 'revise', note?: string) {
    await saveMadeTheme({ ...th, gallery: { status, at: new Date().toISOString(), reason: status === 'declined' ? why[th.id] ?? 'other' : undefined, note: note?.trim() || undefined, by: 'owner' }, challenge: status === 'declined' ? false : th.challenge });
    setViewing(null);
    reload();
  }
  const [dayTag, setDayTag] = useState(SPECIAL_DAYS[0].tag);
  const day = SPECIAL_DAYS.find((d) => d.tag === dayTag) ?? SPECIAL_DAYS[0];
  const entries = challengeEntries(themes, day);
  // Pick the winner from the top 10 by votes (owner, 2026-11-26).
  const { winners, setWinners } = useWinners();
  const [votes, setVotes] = useState<VoteStore>({ ballots: [] });
  useEffect(() => { void loadVotes().then(setVotes); }, []);
  const counts = tally(votes, day.tag);
  const top = topTen(entries.filter((th) => th.gallery?.status === 'approved'), counts);
  // Each special day pulls its entries by tag (owner, 2026-11-26).
  const dayPanel = (
    <div className="grid gap-2 rounded-input border-std border-border-soft p-3">
      <label className="grid gap-1 font-bold max-w-sm">{t('owner.challengeDay')}
        <select value={dayTag} onChange={(e) => setDayTag(e.target.value)} className="min-h-11 px-2 rounded-input border-std border-border font-bold">
          {SPECIAL_DAYS.map((d) => <option key={d.tag} value={d.tag}>{d.name} ({d.date})</option>)}
        </select>
      </label>
      <p className="text-sm font-semibold text-muted">{t('owner.challengeDates', { close: closeDate(day), winner: winnerDate(day) })}</p>
      {entries.length
        ? <ul className="grid gap-1 list-disc pl-5 m-0 font-semibold">{entries.map((th) => <li key={th.id}>{th.name} · {creditLine(th)} · {(th.tags ?? []).map(tagLabel).join(', ')}{th.gallery?.status === 'pending' ? ` (${t('owner.galleryPendingShort')})` : ''}</li>)}</ul>
        : <p className="text-sm font-bold">{t('owner.challengeNone')}</p>}
      {top.length > 0 && (
        <div className="grid gap-1">
          <p className="font-bold">{t('owner.challengeTop')}</p>
          <ol className="grid gap-1 pl-5 m-0 font-semibold">
            {top.map((th) => (
              <li key={th.id} className="flex flex-wrap items-center gap-2">
                <span>{th.name} · {t('vote.points', { count: counts[th.id] ?? 0 })}</span>
                {winners[day.tag] === th.id
                  ? <Button size="sm" onClick={async () => setWinners(await saveWinner(day.tag, null))}>{t('owner.challengeUnpick')}</Button>
                  : <Button size="sm" variant="primary" onClick={async () => setWinners(await saveWinner(day.tag, th.id))}>{t('owner.challengePick')}</Button>}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
  if (!pending.length) return <div className="grid gap-3">{dayPanel}<DashEmpty text={t('owner.galleryNone')} icon={PaintBrush} /></div>;
  return (
    <div className="grid gap-3">{dayPanel}
    <ul className="grid gap-3 list-none p-0 m-0">
      {pending.map((th) => (
        <li key={th.id} className="grid sm:grid-cols-[10rem_1fr] gap-3 rounded-input border-std border-border-soft p-2">
          {/* Tap the picture or the name for the full review screen (owner, 2026-11-27). */}
          <button type="button" onClick={() => setViewing(th)} aria-label={t('owner.reviewOpen', { name: th.name })} className="block text-left cursor-zoom-in"><ThemePreview theme={th} gameName={GAMES.find((g) => g.id === th.gameId)?.name ?? th.gameId} /></button>
          <div className="grid gap-2 content-start">
            <button type="button" onClick={() => setViewing(th)} className="font-display text-xl text-left underline underline-offset-4 decoration-2 justify-self-start">{th.name}</button>
            <p className="text-sm font-semibold text-muted">{creditLine(th)}{th.challenge ? ` · ${t('owner.galleryEntry')}` : ''}</p>
            {(th.tags ?? []).length > 0 && <p className="text-sm font-semibold">{t('owner.galleryTags', { tags: (th.tags ?? []).map(tagLabel).join(', ') })}</p>}
            <div className="flex flex-wrap gap-2 items-center">
              <Button variant="primary" onClick={() => void decide(th, 'approved')}>{t('owner.approve')}</Button>
              <select aria-label={t('owner.declineWhy')} value={why[th.id] ?? 'other'} onChange={(e) => setWhy({ ...why, [th.id]: e.target.value as GalleryReason })} className="min-h-11 px-2 rounded-input border-std border-border font-bold text-sm">
                {GALLERY_REASONS.map((r) => <option key={r} value={r}>{t(`gallery.reason.${r}` as StringKey)}</option>)}
              </select>
              <Button variant="danger" onClick={() => void decide(th, 'declined')}>{t('owner.decline')}</Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
    {viewing && <ThemeReview th={viewing} onClose={() => setViewing(null)} onDecide={(status, note) => void decide(viewing, status, note)} why={why[viewing.id] ?? 'other'} setWhy={(r) => setWhy({ ...why, [viewing.id]: r })} />}
    </div>
  );
}

// The full theme review screen (owner, 2026-11-27: "click the name and/or
// image to view in a full theme preview screen. this is where i will be able
// to give specific feedback and send for revisions or approve for public").
// The big preview, every piece the teacher made, notes, and three choices.
function ThemeReview({ th, onClose, onDecide, why, setWhy }: { th: GameTheme; onClose: () => void; onDecide: (s: 'approved' | 'declined' | 'revise', note?: string) => void; why: GalleryReason; setWhy: (r: GalleryReason) => void }) {
  const [note, setNote] = useState('');
  const game = GAMES.find((g) => g.id === th.gameId)?.name ?? th.gameId;
  const pieces = Object.entries(th.pieces ?? {}).filter(([, p]) => p.image || p.color);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="review-title" className="fixed inset-0 z-50 bg-[rgba(29,26,51,0.55)] p-3 sm:p-6 overflow-auto">
      <div className="max-w-6xl mx-auto bg-white rounded-[1.5rem] border-[3px] border-[#1d1a33] p-5 sm:p-7 grid gap-5" style={{ boxShadow: '0 8px 0 #1d1a33' }}>
        <div className="flex items-start gap-3">
          <div className="flex-1 grid gap-1">
            <h2 id="review-title" className="text-3xl font-bold m-0">{th.name}</h2>
            <p className="font-semibold text-[#57506e] m-0">{game}{creditLine(th) ? ` · ${creditLine(th)}` : ''}{th.challenge ? ` · ${t('owner.galleryEntry')}` : ''}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t('owner.reviewClose')} className="w-12 h-12 rounded-full border-2 border-[#1d1a33] grid place-items-center font-bold text-xl">×</button>
        </div>
        <div className="grid lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-6 items-start">
          <div className="grid gap-4 min-w-0">
            <ThemePreview theme={th} gameName={game} />
            {pieces.length > 0 && (
              <details open>
                <summary className="cursor-pointer font-bold">{t('owner.reviewPieces', { count: pieces.length })}</summary>
                <ul className="grid grid-cols-3 sm:grid-cols-5 gap-2 list-none p-0 mt-3 mb-0">
                  {pieces.map(([id, p]) => (
                    <li key={id} className="grid gap-1 text-center">
                      <span className="aspect-square rounded-[0.8rem] border-2 border-[#d6cff0] grid place-items-center overflow-hidden" style={{ background: p.image ? '#f6f0e4' : p.color }}>{p.image && <img src={p.image} alt={p.alt ?? id} className="max-w-full max-h-full object-contain" />}</span>
                      <span className="text-xs font-bold break-words">{id}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
          <div className="grid gap-4 content-start lg:sticky lg:top-4">
            <label className="grid gap-1.5 font-bold">{t('owner.reviewNotes')}
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={6} maxLength={1000} placeholder={t('owner.reviewNotesHint')} className="rounded-[0.9rem] border-2 border-[#1d1a33] p-3 font-semibold" />
            </label>
            <button type="button" onClick={() => onDecide('approved', note)} className="min-h-14 rounded-full bg-[#22b04a] text-white font-bold text-lg border-2 border-[#1d1a33]">{t('owner.reviewApprove')}</button>
            <button type="button" onClick={() => onDecide('revise', note)} disabled={!note.trim()} className="min-h-14 rounded-full bg-[#fabe37] font-bold text-lg border-2 border-[#1d1a33] disabled:opacity-40">{t('owner.reviewRevise')}</button>
            <div className="grid gap-2 border-t-2 border-[#d6cff0] pt-4">
              <select aria-label={t('owner.declineWhy')} value={why} onChange={(e) => setWhy(e.target.value as GalleryReason)} className="min-h-11 px-2 rounded-[0.8rem] border-2 border-[#1d1a33] font-bold text-sm">
                {GALLERY_REASONS.map((r) => <option key={r} value={r}>{t(`gallery.reason.${r}` as StringKey)}</option>)}
              </select>
              <button type="button" onClick={() => onDecide('declined', note)} className="min-h-12 rounded-full bg-white font-bold border-2 border-[#1d1a33]">{t('owner.decline')}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Everything only the owner can do, first on the desktop every time it opens.
// Waiting on you as a scannable card board (owner, 2026-11-27: "visual and
// simple views for all pages in my developer portal"): a filter by kind,
// urgent items first, each card a colored kind chip, the title, the Go
// buttons and a Done tick; the why and how sit under a caret.
const KIND_COLOR: Record<string, string> = { setup: '#bfdff3', money: '#c8f0dc', legal: '#ffd3e6', people: '#fff1b8', decide: '#ddd6ff' };
function WaitingCard() {
  const [done, setDone] = useState<string[]>([]);
  const [kind, setKind] = useState<string>('');
  useEffect(() => { void data.getSetting<string[]>('owner-waiting-done').then((v) => setDone(v ?? [])); }, []);
  function toggle(id: string) {
    const next = done.includes(id) ? done.filter((x) => x !== id) : [...done, id];
    setDone(next);
    void data.setSetting('owner-waiting-done', next);
  }
  const inKind = WAITING.filter((w) => !kind || w.kind === kind);
  const open = inKind.filter((w) => !done.includes(w.id)).sort((x, y) => Number(!!y.urgent) - Number(!!x.urgent));
  const closed = inKind.filter((w) => done.includes(w.id));
  const kinds = [...new Set(WAITING.map((w) => w.kind))];
  const card = (w: (typeof WAITING)[number]) => {
    const ticked = done.includes(w.id);
    return (
      <li key={w.id} className={`rounded-[1rem] border p-4 grid gap-2.5 content-start ${ticked ? 'opacity-55 bg-[#fafafa]' : 'bg-white'} ${w.urgent && !ticked ? 'border-[#f055a5] border-2' : 'border-[#e4e4e7]'}`}>
        <div className="flex items-center gap-2">
          <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: KIND_COLOR[w.kind] }}>{t(`owner.waitingKind.${w.kind}` as StringKey)}</span>
          {w.urgent && !ticked && <span className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white" style={{ background: '#f055a5' }}>Urgent</span>}
          <span className="flex-1" />
          <button type="button" role="checkbox" aria-checked={ticked} onClick={() => toggle(w.id)} aria-label={t('owner.waitingDone', { title: w.title })} className={`w-9 h-9 rounded-full border-2 grid place-items-center ${ticked ? 'bg-[#22b04a] border-[#22b04a] text-white' : 'border-[#d4d4d8]'}`}><CheckSquare weight="bold" size={18} /></button>
        </div>
        <p className={`font-bold text-base leading-snug m-0 ${ticked ? 'line-through' : ''}`}>{w.title}</p>
        {!ticked && <DoLinks w={w} small />}
        <details><summary className="cursor-pointer text-sm font-bold text-[#52525b]">What and why</summary>
          <p className="text-sm m-0 mt-1.5">{w.how}</p>
          <p className="text-sm text-[#71717a] m-0 mt-1.5">{w.why}</p>
          <p className="text-xs font-bold text-[#71717a] m-0 mt-1.5">{t('owner.waitingAdded', { date: w.added })}</p>
        </details>
      </li>
    );
  };
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <b className="text-2xl mr-2">{open.length}<span className="text-base font-semibold text-[#52525b]"> open</span></b>
        <button type="button" aria-pressed={!kind} onClick={() => setKind('')} className={`min-h-9 px-3 rounded-full border text-sm font-bold ${!kind ? 'bg-[#ede9fe] border-[#6a45f0] text-[#6a45f0]' : 'border-[#e4e4e7]'}`}>All</button>
        {kinds.map((k) => <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={`min-h-9 px-3 rounded-full border text-sm font-bold ${kind === k ? 'border-[#1d1a33]' : 'border-[#e4e4e7]'}`} style={{ background: kind === k ? KIND_COLOR[k] : undefined }}>{t(`owner.waitingKind.${k}` as StringKey)}</button>)}
      </div>
      <ul className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 list-none p-0 m-0 items-start">{open.map(card)}</ul>
      {closed.length > 0 && (
        <details><summary className="cursor-pointer font-bold">Done ({closed.length})</summary>
          <ul className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 list-none p-0 mt-3 mb-0 items-start">{closed.map(card)}</ul>
        </details>
      )}
    </div>
  );
}

// A quote request parsed back from its Tell Gamify line, so the owner can
// make the same PDF the email sends (if the email service was off).
function quoteFrom(details: string): QuoteRequest | null {
  const m = details.match(/^Quote request: (.+?) <(.+?)>, (.+), (\d+) teachers\.\s*(.*)$/s);
  return m ? { name: m[1], email: m[2], school: m[3], seats: Number(m[4]), notes: m[5] } : null;
}
function downloadQuote(req: QuoteRequest) {
  const q = quoteDetails(req);
  if (!q) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([quotePdf(req, q)], { type: 'application/pdf' }));
  a.download = `Gamify-quote-${q.number}.pdf`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// Answer a teacher's message; they see it in Tell Gamify (0012).
function ReplyBox({ report, onSent }: { report: FeedbackReport; onSent: () => void }) {
  const [text, setText] = useState('');
  const [problem, setProblem] = useState('');
  if (report.reply) return <p className="text-sm font-semibold rounded-input bg-surface-2 p-2">{t('owner.replied', { text: report.reply })}</p>;
  async function send() {
    if (!supabase) { setProblem(t('owner.replyCloud')); return; }
    const { error } = await supabase.rpc('owner_reply', { fid: report.id, body: text.trim() });
    if (error) { setProblem(t('owner.replyCloud')); return; }
    setText(''); onSent();
  }
  return (
    <details>
      <summary className="font-bold text-sm cursor-pointer">{t('owner.reply')}</summary>
      <div className="grid gap-1.5 pt-1.5">
        <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} rows={3} aria-label={t('owner.replyLabel')} className="px-2 py-1.5 rounded-input border-std border-border font-semibold" />
        <Button className="justify-self-start" disabled={!text.trim()} onClick={() => void send()}>{t('owner.replySend')}</Button>
        {problem && <p className="text-sm font-bold" role="status">{problem}</p>}
      </div>
    </details>
  );
}
