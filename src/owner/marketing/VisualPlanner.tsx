import { useMemo, useState, type DragEvent } from 'react';
import { ArrowSquareOut, CaretLeft, CaretRight, CheckCircle, Clock, LinkBreak, PaintBrush, PaperPlaneTilt, Prohibit, Hand } from '@phosphor-icons/react';
import { t } from '../../i18n';
import type { StringKey } from '../../i18n/en';
import { Button } from '../../ui/kit';
import { AUTO_PLATFORMS, CONNECTIONS, aspectFor, publishState, withMoves, type Moves, type PublishState } from './autopost';
import { PLATFORMS, POSTS, type Decision, type Post } from './plan';

// The visual content planner (owner, 2026-11-24: "add a visual content
// planner that will be hooked up to auto post and such. we can use canva").
// Four weeks at a glance, each post shown as its picture in the platform's own
// shape (the Canva design once it exists, a brand preview of its hook until
// then), with where it stands on the way to posting. Drag a post to another
// day to move it (or use Move in the post); moves save with her settings.
const platform = (id: Post['platform']) => PLATFORMS.find((p) => p.id === id)!;
const ymd = (d: Date) => d.toLocaleDateString('en-CA');

const STATE_ICON: Record<PublishState, typeof Clock> = {
  'needs-ok': Hand, 'not-approved': Prohibit, 'needs-design': PaintBrush, 'needs-connection': LinkBreak,
  'ads-manual': Hand, queued: Clock, due: PaperPlaneTilt, posted: CheckCircle,
};

export function StateTag({ state }: { state: PublishState }) {
  const Ic = STATE_ICON[state];
  return <span className={`dash-tag inline-flex items-center gap-1 ${state === 'queued' || state === 'posted' ? 'dash-tag-good' : ''}`}><Ic size={13} weight="bold" aria-hidden="true" />{t(`mkt.pub.${state}` as StringKey)}</span>;
}

function Preview({ post }: { post: Post }) {
  const pf = platform(post.platform);
  if (post.design?.thumb) return <img src={post.design.thumb} alt={post.alt ?? ''} className="w-full h-full object-cover" draggable="false" />;
  // A brand preview until the Canva design exists: the hook on the platform's color.
  return (
    <span className="w-full h-full grid content-between p-2" style={{ background: pf.color }}>
      <span className="text-[0.6rem] font-bold uppercase tracking-wide opacity-70">{t(`mkt.format.${post.format}` as StringKey)}</span>
      <span className="font-bold leading-tight text-[0.72rem] line-clamp-5">{post.hook}</span>
      <span className="text-[0.6rem] font-bold opacity-70">{post.design ? t('mkt.plan.canvaReady') : t('mkt.plan.canvaToMake')}</span>
    </span>
  );
}

export default function VisualPlanner({ decisions, moves, onMove, onOpen, connected }: {
  decisions: Record<string, Decision>; moves: Moves; onMove: (id: string, date: string) => void; onOpen: (p: Post) => void; connected: Partial<Record<string, boolean>>;
}) {
  const posts = useMemo(() => withMoves(POSTS, moves), [moves]);
  const [start, setStart] = useState(() => {
    const first = posts.map((p) => p.date).sort().find((d) => d >= ymd(new Date())) ?? ymd(new Date());
    const d = new Date(`${first}T12:00:00`); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; // the Monday of that week
  });
  const [over, setOver] = useState<string | null>(null);
  const days = Array.from({ length: 28 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  const shift = (weeks: number) => { const d = new Date(start); d.setDate(d.getDate() + weeks * 7); setStart(d); };
  const today = ymd(new Date());
  const drop = (e: DragEvent, date: string) => { e.preventDefault(); setOver(null); const id = e.dataTransfer.getData('text/plain'); if (id) onMove(id, date); };
  const weekdays = days.slice(0, 7).map((d) => d.toLocaleDateString(undefined, { weekday: 'short' }));
  const end = days[27];

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => shift(-4)} aria-label={t('mkt.plan.prev')}><CaretLeft size={16} aria-hidden="true" /></Button>
        <p className="font-bold min-w-52 text-center">{start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} to {end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
        <Button size="sm" onClick={() => shift(4)} aria-label={t('mkt.plan.next')}><CaretRight size={16} aria-hidden="true" /></Button>
        <p className="text-sm font-semibold text-muted ml-auto">{t('mkt.plan.drag')}</p>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[52rem] grid gap-1.5">
          <div className="grid grid-cols-7 gap-1.5 text-xs font-bold text-muted" aria-hidden="true">{weekdays.map((w) => <span key={w} className="px-1">{w}</span>)}</div>
          <ol className="grid grid-cols-7 gap-1.5 list-none p-0 m-0" aria-label={t('mkt.plan.label')}>
            {days.map((d) => {
              const key = ymd(d);
              const dayPosts = posts.filter((p) => p.date === key).sort((a, b) => a.time.localeCompare(b.time));
              return (
                <li key={key} onDragOver={(e) => { e.preventDefault(); setOver(key); }} onDragLeave={() => setOver((o) => (o === key ? null : o))} onDrop={(e) => drop(e, key)}
                  className={`min-h-36 rounded-input border p-1.5 grid content-start gap-1.5 ${over === key ? 'border-[var(--dash-purple)] bg-[var(--dash-purple-soft)]' : key === today ? 'border-[var(--dash-purple)] bg-surface' : 'border-border-soft bg-surface'}`}>
                  <span className={`text-xs font-bold ${key === today ? 'text-[var(--dash-purple)]' : 'text-muted'}`}>{d.getDate() === 1 || d === days[0] ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : d.getDate()}</span>
                  {dayPosts.map((p) => {
                    const state = publishState(p, decisions, connected);
                    return (
                      <button key={p.id} type="button" draggable onDragStart={(e) => { e.dataTransfer.setData('text/plain', p.id); e.dataTransfer.effectAllowed = 'move'; }} onClick={() => onOpen(p)}
                        aria-label={`${platform(p.platform).label}, ${p.time}, ${p.hook}. ${t(`mkt.pub.${state}` as StringKey)}`}
                        className="text-left rounded-input border border-border bg-surface overflow-hidden grid cursor-grab active:cursor-grabbing hover:border-[var(--dash-purple)]">
                        <span className="block w-full overflow-hidden border-b border-border-soft" style={{ aspectRatio: aspectFor(p), maxHeight: '9rem' }}><Preview post={p} /></span>
                        <span className="p-1.5 grid gap-1">
                          <span className="flex items-center gap-1 text-[0.68rem] font-bold"><span className="w-2.5 h-2.5 rounded-full border border-border shrink-0" style={{ background: platform(p.platform).color }} aria-hidden="true" />{platform(p.platform).label}<span className="ml-auto text-muted">{p.time}</span></span>
                          <StateTag state={state} />
                        </span>
                      </button>
                    );
                  })}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}

// Publishing: the accounts the publisher posts through, and the queue of
// approved posts with exactly what each one still waits for.
export function Publishing({ decisions, moves, connected, onOpen }: { decisions: Record<string, Decision>; moves: Moves; connected: Partial<Record<string, boolean>>; onOpen: (p: Post) => void }) {
  const posts = withMoves(POSTS, moves).slice().sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  return (
    <div className="grid gap-5">
      <p className="text-sm font-semibold">{t('mkt.pub.rule')}</p>
      <section aria-labelledby="pub-acc" className="grid gap-2">
        <h3 id="pub-acc" className="font-bold">{t('mkt.pub.accounts')}</h3>
        <ul className="grid sm:grid-cols-2 gap-2 list-none p-0 m-0">
          {CONNECTIONS.map((c) => (
            <li key={c.platform} className="rounded-input border border-border-soft p-3 grid gap-1 bg-surface">
              <span className="flex items-center gap-2 font-bold">{c.label}<span className={`dash-tag ml-auto ${connected[c.platform] ? 'dash-tag-good' : ''}`}>{connected[c.platform] ? t('mkt.pub.connected') : t('mkt.pub.notConnected')}</span></span>
              <span className="text-xs font-semibold text-muted">{c.api}</span>
              {!connected[c.platform] && <span className="text-sm font-semibold">{c.needs}</span>}
            </li>
          ))}
        </ul>
        <p className="text-xs font-semibold text-muted">{t('mkt.pub.ads')}</p>
      </section>
      <section aria-labelledby="pub-q" className="grid gap-2">
        <h3 id="pub-q" className="font-bold">{t('mkt.pub.queue')}</h3>
        <ul className="grid gap-1.5 list-none p-0 m-0">
          {posts.map((p) => {
            const state = publishState(p, decisions, connected);
            return (
              <li key={p.id}>
                <button type="button" onClick={() => onOpen(p)} className="w-full text-left rounded-input border border-border-soft bg-surface p-2 flex flex-wrap items-center gap-2 hover:border-[var(--dash-purple)]">
                  <span className="w-2.5 h-2.5 rounded-full border border-border" style={{ background: platform(p.platform).color }} aria-hidden="true" />
                  <span className="font-bold text-sm w-28">{new Date(`${p.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} {p.time}</span>
                  <span className="text-sm font-semibold flex-1 min-w-48 truncate">{p.hook}</span>
                  {p.design?.url && <a href={p.design.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="dash-link"><ArrowSquareOut size={14} aria-hidden="true" />{t('mkt.plan.openCanva')}</a>}
                  <StateTag state={state} />
                </button>
              </li>
            );
          })}
        </ul>
        <p className="text-xs font-semibold text-muted">{t('mkt.pub.platforms', { list: AUTO_PLATFORMS.map((x) => platform(x).label).join(', ') })}</p>
      </section>
    </div>
  );
}
