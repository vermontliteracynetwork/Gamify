import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ListChecks, ArrowLeft, ArrowRight, ArrowsInLineHorizontal, ArrowsOutLineHorizontal, CaretDown, CaretUp, ChartLineUp, ChatCircleDots, CreditCard, Eye, Lightbulb, Notebook, PaintBrush, Star, Ticket, UsersThree } from '@phosphor-icons/react';
import { data } from '../data';
import { useAsync } from '../data/hooks';
import type { FeedbackReport } from '../data/types';
import { GAMES } from '../games/registry';
import { t } from '../i18n';
import { creditLine } from '../theme/credit';
import PinGate from '../settings/PinGate';
import { Slider } from '../ui/fields';
import { Button, PageHeader } from '../ui/kit';
import type { StringKey } from '../i18n/en';
import { saveMadeTheme, useMadeThemes } from '../theme/made';
import ThemePreview from '../theme/builder/ThemePreview';
import { GALLERY_REASONS, type GalleryReason, type GameTheme } from '../theme/types';
import Title from '../ui/Title';
import { monthlyRevenue, project, type Subs } from './income';
import { listCheckIns, listSurveys, recommendScore } from '../beta/surveys';
import { useTier } from '../data/hooks';
import { growthTips } from './growth';
import { WAITING } from './waiting';
import { quoteDetails, quotePdf, type QuoteRequest } from '../lib/quotePdf';
import { GrowthChartCard, LedgerCard, PlanPreviewCard, SubsCard, useOwnerStats } from './DevCards';

export const OWNER_PIN_KEY = 'owner-pin-hash';

// The owner's developer view (development plan Stage 7B): a desktop of
// cards you can reorder, widen and fold, saved on this device. Until
// accounts exist (Stage 5) it opens with its own 4-digit owner PIN. Cards
// that need Stripe or cloud data say so until those connect.
type CardId = 'waiting' | 'feedback' | 'subs' | 'chart' | 'books' | 'preview' | 'gallery' | 'usage' | 'growth' | 'income' | 'themes' | 'inbox' | 'beta';
const DEFAULT_ORDER: CardId[] = ['waiting', 'feedback', 'subs', 'chart', 'books', 'preview', 'gallery', 'usage', 'growth', 'income', 'themes', 'inbox', 'beta'];
interface Layout { order: CardId[]; folded: CardId[]; wide: CardId[] }
type Status = 'new' | 'looking' | 'fixed' | 'shipped';
interface FeedbackMeta { status: Status; social: boolean }

export default function OwnerPage() {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <main className="max-w-md mx-auto px-4 pt-10 pb-24">
        <div className="bg-surface border-[2.5px] border-border rounded-panel p-5"><p className="font-display text-2xl text-center mb-2">{t('owner.title')}</p><PinGate pinKey={OWNER_PIN_KEY} createLabel={t('owner.pinCreate')} onUnlock={() => setOpen(true)} /></div>
      </main>
    );
  }
  return <Desktop />;
}

function Desktop() {
  const [layout, setLayout] = useState<Layout>({ order: DEFAULT_ORDER, folded: [], wide: ['waiting', 'feedback', 'chart', 'books'] });
  useEffect(() => { void data.getSetting<Layout>('owner-layout').then((l) => { if (l) setLayout({ ...l, folded: l.folded.filter((x) => x !== 'waiting'), wide: [...new Set([...l.wide, 'waiting' as CardId])], order: ['waiting', ...l.order.filter((x) => x !== 'waiting' && DEFAULT_ORDER.includes(x)), ...DEFAULT_ORDER.filter((x) => x !== 'waiting' && !l.order.includes(x))] }); }); }, []);
  function save(next: Layout) { setLayout(next); void data.setSetting('owner-layout', next); }
  function move(id: CardId, by: -1 | 1) {
    const o = [...layout.order]; const i = o.indexOf(id); const j = i + by;
    if (j < 0 || j >= o.length) return;
    [o[i], o[j]] = [o[j], o[i]];
    save({ ...layout, order: o });
  }
  const owner = useOwnerStats();
  const toggle = (key: 'folded' | 'wide', id: CardId) => save({ ...layout, [key]: layout[key].includes(id) ? layout[key].filter((x) => x !== id) : [...layout[key], id] });

  const cards: Record<CardId, { title: string; icon: typeof Star; body: ReactNode }> = {
    feedback: { title: t('owner.feedback'), icon: ChatCircleDots, body: <FeedbackCard /> },
    waiting: { title: t('owner.waiting'), icon: ListChecks, body: <WaitingCard /> },
    gallery: { title: t('owner.gallery'), icon: PaintBrush, body: <GalleryCard /> },
    usage: { title: t('owner.usage'), icon: ChartLineUp, body: <UsageCard /> },
    growth: { title: t('owner.growthTips'), icon: Lightbulb, body: <GrowthCard /> },
    income: { title: t('owner.income'), icon: ChartLineUp, body: <IncomeCard /> },
    themes: { title: t('owner.themes'), icon: PaintBrush, body: <div className="grid gap-2"><p className="font-semibold">{t('owner.themesHint')}</p><Link to="/owner/themes" className="justify-self-start min-h-11 px-4 rounded-pill border-[2px] border-border bg-accent font-bold inline-flex items-center no-underline text-text">{t('owner.openThemes')}</Link></div> },
    subs: { title: t('owner.subs'), icon: CreditCard, body: <SubsCard {...owner} /> },
    chart: { title: t('owner.chart'), icon: ChartLineUp, body: <GrowthChartCard {...owner} /> },
    books: { title: t('owner.books'), icon: Notebook, body: <LedgerCard /> },
    preview: { title: t('owner.preview'), icon: Eye, body: <PlanPreviewCard /> },
    inbox: { title: t('owner.inbox'), icon: UsersThree, body: <p className="font-semibold">{t('owner.needsCloud')}</p> },
    beta: { title: t('owner.beta'), icon: Ticket, body: <BetaCard /> },
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-24">
      <PageHeader title={t('owner.title')} subtitle={t('owner.subtitle')} />
      <div className="grid md:grid-cols-2 gap-4 items-start">
        {layout.order.map((id, i) => {
          const c = cards[id]; const Icon = c.icon;
          const folded = layout.folded.includes(id);
          return (
            <section key={id} aria-label={c.title} className={`bg-surface border-[2.5px] border-border rounded-panel p-4 grid gap-3 ${layout.wide.includes(id) ? 'md:col-span-2' : ''}`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
              <div className="flex items-center gap-2">
                <Icon weight="bold" size={24} aria-hidden="true" />
                <h2 className="font-display text-2xl flex-1"><Title text={c.title} /></h2>
                <IconBtn label={t('owner.moveEarlier', { card: c.title })} disabled={i === 0} onClick={() => move(id, -1)}><ArrowLeft weight="bold" size={16} /></IconBtn>
                <IconBtn label={t('owner.moveLater', { card: c.title })} disabled={i === layout.order.length - 1} onClick={() => move(id, 1)}><ArrowRight weight="bold" size={16} /></IconBtn>
                <IconBtn label={t('owner.widen', { card: c.title })} onClick={() => toggle('wide', id)}>{layout.wide.includes(id) ? <ArrowsInLineHorizontal weight="bold" size={16} /> : <ArrowsOutLineHorizontal weight="bold" size={16} />}</IconBtn>
                <IconBtn label={folded ? t('owner.unfold', { card: c.title }) : t('owner.fold', { card: c.title })} onClick={() => toggle('folded', id)}>{folded ? <CaretDown weight="bold" size={16} /> : <CaretUp weight="bold" size={16} />}</IconBtn>
              </div>
              {!folded && c.body}
            </section>
          );
        })}
      </div>
    </main>
  );
}

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled} className="w-11 h-11 rounded-full border-[2px] border-border bg-surface-2 flex items-center justify-center disabled:opacity-30">{children}</button>;
}

// Every Tell Gamify report: filter by kind, set a status, star the ones
// that would make a good social post.
function FeedbackCard() {
  const { value: reports = [] } = useAsync(() => data.listFeedback());
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
        {(['all', 'help', 'quote', 'beta', 'bug', 'problem', 'idea'] as const).map((k) => (
          <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)} className={`min-h-10 px-3 rounded-pill border-[2px] font-bold text-sm ${kind === k ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}>
            {t(`owner.kind.${k}`)} ({k === 'all' ? reports.length : reports.filter((r) => r.kind === k).length})
          </button>
        ))}
      </div>
      {shown.length === 0 && <p className="font-semibold">{t('owner.noFeedback')}</p>}
      <ul className="grid gap-2 list-none p-0 m-0 max-h-96 overflow-y-auto">
        {shown.map((r) => {
          const m = meta[r.id] ?? { status: 'new', social: false };
          return (
            <li key={r.id} className="rounded-input border-[2px] border-border-soft p-2.5 grid gap-1.5">
              <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
                <span className="px-2 py-0.5 rounded-pill bg-surface-2 border border-border">{t(`owner.kind.${r.kind}`)}</span>
                <span>{t(`owner.role.${r.role}`)}</span>
                <span className="text-muted">{r.where} · {new Date(r.at).toLocaleDateString()}</span>
                <button type="button" aria-pressed={m.social} aria-label={t('owner.social')} onClick={() => void set(r.id, { social: !m.social })} className="ml-auto w-9 h-9 rounded-full border-[2px] border-border flex items-center justify-center" style={{ background: m.social ? '#fdfd94' : undefined }}><Star weight={m.social ? 'fill' : 'bold'} size={16} /></button>
                <select aria-label={t('owner.status')} value={m.status} onChange={(e) => void set(r.id, { status: e.target.value as Status })} className="min-h-9 px-2 rounded-input border-[2px] border-border font-bold">
                  {(['new', 'looking', 'fixed', 'shipped'] as const).map((s) => <option key={s} value={s}>{t(`owner.status.${s}`)}</option>)}
                </select>
              </div>
              <p className="font-semibold">{r.details || t('owner.noDetails')}</p>
              {r.kind === 'quote' && quoteFrom(r.details) && <Button className="justify-self-start" onClick={() => downloadQuote(quoteFrom(r.details)!)}>{t('owner.quotePdf')}</Button>}
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
          <div key={String(l)} className="rounded-input border-[2px] border-border-soft p-2"><p className="text-xs font-bold uppercase text-muted">{l}</p><p className="font-display text-2xl">{v}</p></div>
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
          <div key={String(l)} className="rounded-input border-[2px] border-border-soft p-2"><p className="text-xs font-bold uppercase text-muted">{l}</p><p className="font-display text-2xl">{v}</p></div>
        ))}
      </div>
      <ul className="grid gap-1 list-none p-0 m-0">
        {byGame.map(({ g, n }) => (
          <li key={g.id} className="grid grid-cols-[8rem_1fr_3rem] items-center gap-2 text-sm font-bold">
            <span className="truncate">{g.name}</span>
            <span className="h-3 rounded-pill bg-surface-2 border border-border overflow-hidden"><span className="block h-full" style={{ width: `${(n / max) * 100}%`, background: '#b4c4fb' }} /></span>
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
          <div key={String(l)} className="rounded-input border-[2px] border-border-soft p-2"><p className="text-xs font-bold uppercase text-muted">{l}</p><p className="font-display text-xl tabular-nums">{money(Number(v))}</p></div>
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
  async function decide(th: GameTheme, status: 'approved' | 'declined') {
    await saveMadeTheme({ ...th, gallery: { status, at: new Date().toISOString(), reason: status === 'declined' ? why[th.id] ?? 'other' : undefined }, challenge: status === 'declined' ? false : th.challenge });
    reload();
  }
  if (!pending.length) return <p className="font-semibold">{t('owner.galleryNone')}</p>;
  return (
    <ul className="grid gap-3 list-none p-0 m-0">
      {pending.map((th) => (
        <li key={th.id} className="grid sm:grid-cols-[10rem_1fr] gap-3 rounded-input border-[2px] border-border-soft p-2">
          <ThemePreview theme={th} gameName={GAMES.find((g) => g.id === th.gameId)?.name ?? th.gameId} />
          <div className="grid gap-2 content-start">
            <p className="font-display text-xl">{th.name}</p>
            <p className="text-sm font-semibold text-muted">{creditLine(th)}{th.challenge ? ` · ${t('owner.galleryEntry')}` : ''}</p>
            <div className="flex flex-wrap gap-2 items-center">
              <Button variant="primary" onClick={() => void decide(th, 'approved')}>{t('owner.approve')}</Button>
              <select aria-label={t('owner.declineWhy')} value={why[th.id] ?? 'other'} onChange={(e) => setWhy({ ...why, [th.id]: e.target.value as GalleryReason })} className="min-h-11 px-2 rounded-input border-[2px] border-border font-bold text-sm">
                {GALLERY_REASONS.map((r) => <option key={r} value={r}>{t(`gallery.reason.${r}` as StringKey)}</option>)}
              </select>
              <Button variant="danger" onClick={() => void decide(th, 'declined')}>{t('owner.decline')}</Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

// Everything only the owner can do, first on the desktop every time it opens.
function WaitingCard() {
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => { void data.getSetting<string[]>('owner-waiting-done').then((v) => setDone(v ?? [])); }, []);
  function toggle(id: string) {
    const next = done.includes(id) ? done.filter((x) => x !== id) : [...done, id];
    setDone(next);
    void data.setSetting('owner-waiting-done', next);
  }
  const open = WAITING.filter((w) => !done.includes(w.id));
  return (
    <div className="grid gap-2">
      <p className="font-bold">{open.length ? t('owner.waitingCount', { count: open.length }) : t('owner.waitingNone')}</p>
      <ul className="grid gap-2 list-none p-0 m-0">
        {[...open, ...WAITING.filter((w) => done.includes(w.id))].map((w) => {
          const ticked = done.includes(w.id);
          return (
            <li key={w.id} className={`rounded-input border-[2px] p-3 grid grid-cols-[auto_1fr] gap-3 ${ticked ? 'border-border-soft opacity-60' : 'border-border bg-surface'}`}>
              <input type="checkbox" checked={ticked} onChange={() => toggle(w.id)} aria-label={t('owner.waitingDone', { title: w.title })} className="w-6 h-6 mt-1" />
              <div className="grid gap-1">
                <p className={`font-display text-lg leading-tight ${ticked ? 'line-through' : ''}`}>{w.title}</p>
                <p className="text-sm font-semibold">{w.why}</p>
                <p className="text-sm font-semibold text-muted"><span className="font-bold">{t('owner.waitingHow')} </span>{w.how}</p>
                <p className="text-xs font-bold text-muted">{t(`owner.waitingKind.${w.kind}` as StringKey)} · {t('owner.waitingAdded', { date: w.added })}</p>
              </div>
            </li>
          );
        })}
      </ul>
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
