import { useMemo, useState } from 'react';
import { CaretLeft, CaretRight, Check, Copy, PencilSimple, X } from '@phosphor-icons/react';
import { data, newId } from '../../data';
import { useAsync } from '../../data/hooks';
import { t } from '../../i18n';
import type { StringKey } from '../../i18n/en';
import Dialog from '../../ui/Dialog';
import { Button, Tabs, fieldClasses } from '../../ui/kit';
import { ACTIVITY, CAMPAIGNS, PLATFORMS, POSTS, shownStatus, teamExport, type Decision, type OwnerIdea, type Post } from './plan';
import { publishState, withMoves, type Moves } from './autopost';
import VisualPlanner, { Publishing, StateTag } from './VisualPlanner';

// The content planner on the developer dashboard (owner's rule, 2026-11-24):
// everything the marketing team does, in one place, and only the owner says
// yes. Her decisions and ideas save with her settings (the cloud when signed
// in); "Copy for the team" hands them to the next marketing session.
type View = 'ok' | 'planner' | 'publishing' | 'calendar' | 'campaigns' | 'activity' | 'ideas';
const DECISIONS_KEY = 'marketing-decisions';
const IDEAS_KEY = 'marketing-ideas';
const MOVES_KEY = 'marketing-moves';
// Written by the server publisher once an account is connected (docs/marketing-autopost.md).
const CONNECTED_KEY = 'marketing-connections';

const platform = (id: Post['platform']) => PLATFORMS.find((p) => p.id === id)!;

export default function MarketingCard() {
  const { value: saved, reload } = useAsync(() => data.getSetting<Record<string, Decision>>(DECISIONS_KEY));
  const { value: savedIdeas, reload: reloadIdeas } = useAsync(() => data.getSetting<OwnerIdea[]>(IDEAS_KEY));
  const { value: savedMoves, reload: reloadMoves } = useAsync(() => data.getSetting<Moves>(MOVES_KEY));
  const { value: savedConnected } = useAsync(() => data.getSetting<Record<string, boolean>>(CONNECTED_KEY));
  const moves = savedMoves ?? {};
  const connected = savedConnected ?? {};
  const decisions = saved ?? {};
  const ideas = savedIdeas ?? [];
  const [view, setView] = useState<View>('ok');
  const [open, setOpen] = useState<Post | null>(null);
  const [copied, setCopied] = useState(false);
  const waiting = POSTS.filter((p) => shownStatus(p, decisions) === 'needs-ok');

  async function decide(id: string, decision: Decision['decision'], note: string) {
    await data.setSetting(DECISIONS_KEY, { ...decisions, [id]: { decision, note: note.trim(), at: new Date().toISOString() } });
    reload();
  }
  async function move(id: string, date: string) {
    const orig = POSTS.find((p) => p.id === id);
    const next = { ...moves };
    if (orig && orig.date === date) delete next[id]; else next[id] = { date };
    await data.setSetting(MOVES_KEY, next);
    reloadMoves();
  }
  async function copy() {
    const moved = Object.entries(moves).map(([id, m]) => `- ${id}: moved to ${m.date}${m.time ? ` ${m.time}` : ''}`);
    try { await navigator.clipboard.writeText(teamExport(decisions, ideas) + (moved.length ? `\n\nMOVED ON THE PLANNER\n${moved.join('\n')}` : '')); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { setCopied(false); }
  }

  const views: { id: View; label: string }[] = [
    { id: 'ok', label: `${t('mkt.tab.ok')} (${waiting.length})` },
    { id: 'planner', label: t('mkt.tab.planner') },
    { id: 'publishing', label: t('mkt.tab.publishing') },
    { id: 'calendar', label: t('mkt.tab.calendar') },
    { id: 'campaigns', label: t('mkt.tab.campaigns') },
    { id: 'activity', label: t('mkt.tab.activity') },
    { id: 'ideas', label: t('mkt.tab.ideas') },
  ];

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <Tabs value={view} options={views} onChange={setView} label={t('owner.marketing')} className="" />
        <Button onClick={() => void copy()}><Copy size={16} aria-hidden="true" /> {copied ? t('mkt.copied') : t('mkt.copy')}</Button>
      </div>
      <p className="text-sm font-semibold text-muted">{t('mkt.intro')}</p>
      {view === 'ok' && (waiting.length === 0 ? <p className="font-semibold">{t('mkt.okNone')}</p> : (
        // Short cards in a grid; tap one to read it all and decide (portal pass, 2026-11-27).
        <ul className="grid gap-3 list-none p-0 m-0 grid-cols-[repeat(auto-fill,minmax(17rem,1fr))]">{waiting.map((p) => {
          const pf = platform(p.platform);
          return (
            <li key={p.id}>
              <button type="button" onClick={() => setOpen(p)} className="w-full h-full text-left rounded-[12px] border border-[var(--dash-line)] bg-white p-3 grid content-start gap-2 hover:border-[var(--dash-purple)] motion-safe:transition-colors" style={{ borderTop: `4px solid ${pf.color}` }}>
                <span className="flex flex-wrap items-center gap-2 text-xs font-bold">
                  <span className="px-2 py-0.5 rounded-pill border border-border" style={{ background: pf.color }}>{pf.label}</span>
                  <span className="text-muted">{new Date(`${p.date}T${p.time}`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · {t(`mkt.format.${p.format}` as StringKey)}</span>
                </span>
                <span className="font-bold leading-snug">{p.hook}</span>
                {p.caption && <span className="text-sm text-muted line-clamp-2">{p.caption}</span>}
                <span className="dash-link !px-0">{t('mkt.review')}</span>
              </button>
            </li>
          );
        })}</ul>
      ))}
      {view === 'planner' && <VisualPlanner decisions={decisions} moves={moves} connected={connected} onMove={(id, d) => void move(id, d)} onOpen={setOpen} />}
      {view === 'publishing' && <Publishing decisions={decisions} moves={moves} connected={connected} onOpen={setOpen} />}
      {view === 'calendar' && <Calendar decisions={decisions} onOpen={setOpen} />}
      {view === 'campaigns' && <Campaigns decisions={decisions} />}
      {view === 'activity' && <ActivityLog decisions={decisions} />}
      {view === 'ideas' && <Ideas ideas={ideas} onSave={async (next) => { await data.setSetting(IDEAS_KEY, next); reloadIdeas(); }} />}
      {open && (
        <Dialog title={`${open.id} · ${platform(open.platform).label}`} onClose={() => setOpen(null)} closeLabel={t('mkt.close')} size="lg">
          <PostDetail post={withMoves([open], moves)[0]} decision={decisions[open.id]} onDecide={async (...a) => { await decide(...a); setOpen(null); }}
            onMove={(d) => void move(open.id, d)} state={publishState(withMoves([open], moves)[0], decisions, connected)} />
        </Dialog>
      )}
    </div>
  );
}

function StatusTag({ post, decisions }: { post: Post; decisions: Record<string, Decision> }) {
  const s = shownStatus(post, decisions);
  return <span className="dash-tag">{t(`mkt.status.${s}` as StringKey)}</span>;
}

function PostDetail({ post, decision, onDecide, onMove, state }: { post: Post; decision?: Decision; onDecide: (id: string, d: Decision['decision'], note: string) => Promise<void>; onMove?: (date: string) => void; state?: ReturnType<typeof publishState> }) {
  const [note, setNote] = useState('');
  const [problem, setProblem] = useState('');
  const pf = platform(post.platform);
  const campaign = CAMPAIGNS.find((c) => c.id === post.campaign);
  function send(d: Decision['decision']) {
    if (d !== 'approved' && !note.trim()) { setProblem(t('mkt.noteNeeded')); return; }
    setProblem(''); void onDecide(post.id, d, note); setNote('');
  }
  const row = (label: StringKey, value?: string) => value ? <div className="grid sm:grid-cols-[9rem_1fr] gap-1"><dt className="text-xs font-bold uppercase text-muted">{t(label)}</dt><dd className="m-0 text-sm font-semibold whitespace-pre-wrap">{value}</dd></div> : null;
  return (
    <article className="rounded-input border-std border-border-soft p-3 grid gap-3 bg-surface">
      <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
        <span className="px-2 py-0.5 rounded-pill border border-border" style={{ background: pf.color }}>{pf.label}</span>
        <span>{post.id}</span>
        <span className="text-muted">{new Date(`${post.date}T${post.time}`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · {post.time} · {t(`mkt.format.${post.format}` as StringKey)}</span>
        <span className="ml-auto"><StatusTag post={post} decisions={decision ? { [post.id]: decision } : {}} /></span>
      </div>
      <p className="font-bold text-lg leading-snug">{post.hook}</p>
      {(onMove || state || post.design) && (
        <div className="flex flex-wrap items-center gap-3 text-sm font-bold">
          {state && <StateTag state={state} />}
          {post.design?.url ? <a href={post.design.url} target="_blank" rel="noreferrer" className="dash-link">{t('mkt.plan.openCanva')}</a> : <span className="text-muted">{t('mkt.plan.canvaToMake')}</span>}
          {onMove && <label className="flex items-center gap-2 ml-auto">{t('mkt.plan.move')}<input type="date" value={post.date} onChange={(e) => e.target.value && onMove(e.target.value)} className={fieldClasses('sm')} /></label>}
        </div>
      )}
      <dl className="grid gap-2 m-0">
        {row('mkt.f.caption', post.caption)}
        {row('mkt.f.onScreen', post.onScreen?.join('\n'))}
        {row('mkt.f.hooksTried', post.hooksTried?.join('\n'))}
        {row('mkt.f.canva', post.canva)}
        {row('mkt.f.sound', post.sound)}
        {row('mkt.f.tags', post.tags?.join('  '))}
        {row('mkt.f.alt', post.alt)}
        {row('mkt.f.campaign', campaign?.name)}
        {row('mkt.f.who', `${t(`mkt.buyer.${post.buyer}` as StringKey)} · ${t(`mkt.funnel.${post.funnel}` as StringKey)} · ${t(`mkt.pillar.${post.pillar}` as StringKey)}`)}
        {row('mkt.f.principle', post.principle)}
        {row('mkt.f.lesson', post.lesson)}
        {row('mkt.f.link', post.link)}
      </dl>
      <details>
        <summary className="font-bold text-sm cursor-pointer">{t('mkt.history', { count: post.history.length })}</summary>
        <ul className="grid gap-1 list-none p-0 m-0 pt-2 text-sm">
          {post.history.map((h, i) => <li key={i} className="font-semibold"><span className="text-muted">{h.at.slice(0, 10)} · {h.by}: </span>{h.note}</li>)}
        </ul>
      </details>
      {decision && <p className="text-sm font-bold rounded-input bg-surface-2 p-2">{t('mkt.yourCall', { decision: t(`mkt.status.${decision.decision}` as StringKey), date: decision.at.slice(0, 10) })}{decision.note ? ` "${decision.note}"` : ''}</p>}
      <div className="grid gap-2">
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={1000} aria-label={t('mkt.noteLabel')} placeholder={t('mkt.notePlaceholder')} className={fieldClasses('md')} />
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => send('approved')}><Check size={16} aria-hidden="true" /> {t('mkt.approve')}</Button>
          <Button onClick={() => send('changes')}><PencilSimple size={16} aria-hidden="true" /> {t('mkt.changes')}</Button>
          <Button variant="danger" onClick={() => send('no')}><X size={16} aria-hidden="true" /> {t('mkt.no')}</Button>
        </div>
        {problem && <p className="text-sm font-bold" role="status">{problem}</p>}
      </div>
    </article>
  );
}

function monthOf(posts: Post[]): Date {
  const now = new Date();
  const next = posts.map((p) => p.date).sort().find((d) => d >= now.toLocaleDateString('en-CA'));
  const d = next ? new Date(`${next}T12:00:00`) : now;
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function Calendar({ decisions, onOpen }: { decisions: Record<string, Decision>; onOpen: (p: Post) => void }) {
  const [month, setMonth] = useState(() => monthOf(POSTS));
  const [only, setOnly] = useState<Post['platform'] | 'all'>('all');
  const days = useMemo(() => {
    const first = new Date(month);
    const start = new Date(first); start.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }, [month]);
  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));
  const shown = POSTS.filter((p) => only === 'all' || p.platform === only);
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2026, 10, 22 + i).toLocaleDateString(undefined, { weekday: 'short' }));
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => shift(-1)} aria-label={t('mkt.prevMonth')}><CaretLeft size={16} aria-hidden="true" /></Button>
        <p className="font-bold min-w-40 text-center">{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
        <Button size="sm" onClick={() => shift(1)} aria-label={t('mkt.nextMonth')}><CaretRight size={16} aria-hidden="true" /></Button>
        <select aria-label={t('mkt.platform')} value={only} onChange={(e) => setOnly(e.target.value as typeof only)} className={fieldClasses('sm', 'ml-auto')}>
          <option value="all">{t('mkt.allPlatforms')}</option>
          {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs font-bold text-muted" aria-hidden="true">{weekdays.map((w) => <span key={w} className="px-1">{w}</span>)}</div>
      <ol className="grid grid-cols-7 gap-1 list-none p-0 m-0">
        {days.map((d) => {
          const key = d.toLocaleDateString('en-CA');
          const posts = shown.filter((p) => p.date === key);
          const inMonth = d.getMonth() === month.getMonth();
          return (
            <li key={key} className={`min-h-20 rounded-input border p-1 grid content-start gap-1 ${inMonth ? 'border-border-soft bg-surface' : 'border-transparent opacity-50'}`}>
              <span className="text-xs font-bold text-muted">{d.getDate()}</span>
              {posts.map((p) => (
                <button key={p.id} type="button" onClick={() => onOpen(p)} className="text-left text-xs font-bold rounded px-1 py-0.5 border border-border truncate" style={{ background: platform(p.platform).color }} title={p.hook}>
                  {shownStatus(p, decisions) === 'needs-ok' ? '● ' : ''}{p.time} {p.hook}
                </button>
              ))}
            </li>
          );
        })}
      </ol>
      <ul className="flex flex-wrap gap-2 list-none p-0 m-0 text-xs font-bold">
        {PLATFORMS.map((p) => <li key={p.id} className="flex items-center gap-1"><span className="w-3 h-3 rounded-full border border-border" style={{ background: p.color }} aria-hidden="true" />{p.label}</li>)}
        <li>● {t('mkt.status.needs-ok')}</li>
      </ul>
    </div>
  );
}

function Campaigns({ decisions }: { decisions: Record<string, Decision> }) {
  return (
    <ul className="grid gap-3 list-none p-0 m-0">
      {CAMPAIGNS.map((c) => {
        const posts = POSTS.filter((p) => p.campaign === c.id);
        return (
          <li key={c.id} className="rounded-input border-std border-border-soft p-3 grid gap-1.5">
            <div className="flex flex-wrap items-center gap-2"><p className="font-bold text-lg">{c.name}</p><span className="dash-tag">{t(`mkt.cstatus.${c.status}` as StringKey)}</span><span className="text-sm font-semibold text-muted ml-auto">{c.start} → {c.end}</span></div>
            <p className="text-sm font-semibold"><span className="font-bold">{t('mkt.c.goal')} </span>{c.goal}</p>
            <p className="text-sm font-semibold"><span className="font-bold">{t('mkt.c.message')} </span>{c.message}</p>
            <p className="text-sm font-semibold"><span className="font-bold">{t('mkt.c.offer')} </span>{c.offer}</p>
            <p className="text-sm font-semibold"><span className="font-bold">{t('mkt.c.budget')} </span>{c.budget}</p>
            <p className="text-sm font-semibold text-muted">{t(`mkt.buyer.${c.buyer}` as StringKey)} · {c.channels.map((x) => platform(x).label).join(', ')} · {t('mkt.c.posts', { count: posts.length })}, {posts.filter((p) => shownStatus(p, decisions) === 'approved').length} {t('mkt.status.approved').toLowerCase()}</p>
          </li>
        );
      })}
    </ul>
  );
}

function ActivityLog({ decisions }: { decisions: Record<string, Decision> }) {
  const lines = [
    ...ACTIVITY.map((a) => ({ at: a.at, by: a.by, what: a.what })),
    ...POSTS.flatMap((p) => p.history.map((h) => ({ at: h.at, by: h.by, what: `${p.id}: ${h.note}` }))),
    ...Object.entries(decisions).map(([id, d]) => ({ at: d.at, by: 'Owner', what: `${id}: ${t(`mkt.status.${d.decision}` as StringKey)}${d.note ? ` "${d.note}"` : ''}` })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  return (
    <ul className="dash-list">
      {lines.map((l, i) => <li key={i}><span className="dash-dot" aria-hidden="true" /><span><span className="font-bold">{l.by}</span> <span className="text-muted">{l.at.slice(0, 10)}</span> · {l.what}</span></li>)}
    </ul>
  );
}

function Ideas({ ideas, onSave }: { ideas: OwnerIdea[]; onSave: (next: OwnerIdea[]) => Promise<void> }) {
  const [text, setText] = useState('');
  return (
    <div className="grid gap-3">
      <p className="text-sm font-semibold">{t('mkt.ideasIntro')}</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={2000} aria-label={t('mkt.ideaLabel')} className={fieldClasses('md')} />
      <Button className="justify-self-start" variant="primary" disabled={!text.trim()} onClick={() => { void onSave([...ideas, { id: newId('idea'), text: text.trim(), at: new Date().toISOString() }]); setText(''); }}>{t('mkt.addIdea')}</Button>
      {ideas.length === 0 ? <p className="dash-empty">{t('mkt.ideasNone')}</p> : (
        <ul className="grid gap-2 list-none p-0 m-0">
          {ideas.slice().reverse().map((i) => (
            <li key={i.id} className="rounded-input border-std border-border-soft p-2 flex gap-2 items-start">
              <p className="flex-1 text-sm font-semibold whitespace-pre-wrap"><span className="text-muted">{i.at.slice(0, 10)} · </span>{i.text}</p>
              <button type="button" aria-label={t('mkt.removeIdea')} onClick={() => void onSave(ideas.filter((x) => x.id !== i.id))} className="w-9 h-9 rounded-full border-std border-border flex items-center justify-center"><X size={14} aria-hidden="true" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
