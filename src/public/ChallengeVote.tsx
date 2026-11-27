import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Heart } from '@phosphor-icons/react';
import { t } from '../i18n';
import { data } from '../data';
import type { Classroom } from '../data/types';
import { GAMES } from '../games/registry';
import { useTeacher } from '../auth/session';
import { creditLine } from '../theme/credit';
import ThemePreview from '../theme/builder/ThemePreview';
import { useMadeThemes } from '../theme/made';
import { SPECIAL_DAYS, challengeEntries, closeDate, isOpen, nextOpenDay, winnerAt, winnerDate } from '../theme/tags';
import { MAX_PICKS, castVote, tally, topTen, useVotes, useWinners, votedToday } from '../theme/votes';
import { Crown } from '@phosphor-icons/react';
import { Button, Tabs, buttonClasses } from '../ui/kit';
import PillSelect from '../ui/PillSelect';
import Title from '../ui/Title';

type Sort = 'votes' | 'newest' | 'name';
const day = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const month = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });

// The ongoing public vote (owner, 2026-11-26): one tab per special day, its
// ideas and tags, and every approved entry for that month, sortable and
// filterable by tag. Visitors pick a top 3 a day; teachers can add a class vote.
// One month's page (owner, 2026-11-27): /challenge/:tag shows every entry for
// that month, easy to look at and easy to vote: no tags shown, big Vote
// buttons, and the send bar stuck to the bottom while picks are made.
export default function ChallengeVote({ tag }: { tag?: string }) {
  const [tab, setTab] = useState(tag ?? nextOpenDay().tag);
  useEffect(() => { if (tag) setTab(tag); }, [tag]);
  const d = SPECIAL_DAYS.find((x) => x.tag === tab) ?? SPECIAL_DAYS[0];
  const { themes } = useMadeThemes();
  const { store, setStore } = useVotes();
  const { winners } = useWinners();
  const teacher = useTeacher();
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [classId, setClassId] = useState('');
  const [picks, setPicks] = useState<string[]>([]);
  const [sort, setSort] = useState<Sort>('votes');
  useEffect(() => { if (teacher) void data.listClassrooms().then(setClasses).catch(() => setClasses([])); }, [teacher]);
  useEffect(() => { setPicks([]); }, [tab]);

  const open = isOpen(d);
  const counts = tally(store, d.tag);
  const entries = challengeEntries(themes, d).filter((th) => th.gallery?.status === 'approved')
    .sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : sort === 'newest' ? (b.gallery?.at ?? '').localeCompare(a.gallery?.at ?? '') : (counts[b.id] ?? 0) - (counts[a.id] ?? 0)));
  // After 12:00 am Eastern on the day: the winner, then the rest of the top 10.
  const all = challengeEntries(themes, d).filter((th) => th.gallery?.status === 'approved');
  const winner = Date.now() >= winnerAt(d).getTime() ? all.find((th) => th.id === winners[d.tag]) : undefined;
  const rest = winner ? topTen(all, counts).filter((th) => th.id !== winner.id).slice(0, 9) : [];
  const voted = votedToday(store, d.tag);
  const classVoted = !!classId && votedToday(store, d.tag, classId);
  const pick = (id: string) => setPicks((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= MAX_PICKS ? cur : [...cur, id]));
  const gameName = (id: string) => GAMES.find((g) => g.id === id)?.name ?? id;
  const card = 'bg-surface border-bold border-border rounded-panel p-5 grid gap-3 content-start';

  return (
    <section aria-labelledby="vote" className="grid gap-4">
      <h2 id="vote" className="title-bubble text-4xl"><Title text={t('vote.title')} /></h2>
      <p className="text-lg font-semibold max-w-3xl">{t('vote.sub')}</p>
      {!tag && <Tabs label={t('vote.months')} value={tab} onChange={setTab} size="sm" className="mb-0" panelIds
        options={SPECIAL_DAYS.map((x) => ({ id: x.tag, label: month(x.date) }))} />}

      <div id={`panel-${d.tag}`} role="tabpanel" aria-labelledby={`tab-${d.tag}`} className="grid gap-4">
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-4">
          <article className={`${card} !bg-butter`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
            <h3 className="font-display text-3xl leading-tight">{d.name}</h3>
            <p className="font-bold">{day(d.date)}</p>
            <p className="font-semibold">{d.theme}</p>
            <p className="font-bold">{t('vote.ideas')}</p>
            <ul className="grid gap-1 pl-6 m-0 list-disc font-semibold">{d.ideas.map((x) => <li key={x}>{x}</li>)}</ul>
          </article>
          <article className={card} style={{ boxShadow: 'var(--shadow-sticker)' }}>
            <ul className="grid gap-2 list-none p-0 m-0 font-bold">
              <li>{t('vote.closes', { date: day(closeDate(d)) })}</li>
              <li>{t('vote.winner', { date: day(winnerDate(d)) })}</li>
            </ul>
            <Link to="/teacher/themes" className={buttonClasses('main', 'justify-self-start min-h-12 px-5 hover-pop')}>{t('vote.enter')}</Link>
          </article>
        </div>

        {winner && (
          <div className="grid lg:grid-cols-[1fr_1fr] gap-4">
            <article className={`${card} !bg-butter`} style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
              <h3 className="font-display text-3xl flex items-center gap-2"><Crown weight="fill" size={32} color="var(--lemon)" aria-hidden="true" />{t('vote.winnerIs', { name: winner.name })}</h3>
              <ThemePreview theme={winner} gameName={gameName(winner.gameId)} />
              <p className="font-semibold">{gameName(winner.gameId)} · {creditLine(winner)} · {t('vote.points', { count: counts[winner.id] ?? 0 })}</p>
            </article>
            {rest.length > 0 && (
              <article className={card} style={{ boxShadow: 'var(--shadow-sticker)' }}>
                <h3 className="font-display text-2xl">{t('vote.topTen')}</h3>
                <ol className="grid gap-1 pl-6 m-0 font-semibold" start={2}>
                  {rest.map((th) => <li key={th.id}>{th.name} · {creditLine(th)} · {t('vote.points', { count: counts[th.id] ?? 0 })}</li>)}
                </ol>
              </article>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2.5">
          <PillSelect label={t('themes.sort')} value={sort} onChange={(v) => setSort(v as Sort)}>
            {(['votes', 'newest', 'name'] as Sort[]).map((x) => <option key={x} value={x}>{t(`vote.sort.${x}`)}</option>)}
          </PillSelect>
          <span className="font-bold text-sm" role="status">{t('vote.count', { count: entries.length })}</span>
        </div>

        {entries.length === 0 ? (
          <p className="font-bold">{t('vote.none', { name: d.name })}</p>
        ) : (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 list-none p-0 m-0">
            {entries.map((th) => {
              const on = picks.includes(th.id);
              return (
                <li key={th.id} className="hover-lift bg-surface border-bold border-border rounded-panel p-3 grid gap-2 content-start" style={{ boxShadow: 'var(--shadow-sticker)' }}>
                  <ThemePreview theme={th} gameName={gameName(th.gameId)} />
                  <div className="grid gap-0.5 px-1">
                    <h4 className="font-heading font-bold text-xl leading-tight">{th.name}</h4>
                    <p className="text-sm font-semibold text-muted">{gameName(th.gameId)} · {creditLine(th)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{t('vote.points', { count: counts[th.id] ?? 0 })}</span>
                    <span className="flex-1" />
                    {open && (
                      <button type="button" aria-pressed={on} onClick={() => pick(th.id)} disabled={!on && picks.length >= MAX_PICKS}
                        className={`min-h-12 px-5 rounded-pill border-std border-border font-bold inline-flex items-center gap-2 hover-pop disabled:opacity-40 ${on ? 'bg-pink text-white' : 'bg-surface'}`} style={{ boxShadow: '0 3px 0 var(--ink)' }}>
                        <Heart weight={on ? 'fill' : 'bold'} size={22} aria-hidden="true" />{on ? `${picks.indexOf(th.id) + 1}` : t('vote.pick')}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {open ? (
          <div className={`${card} sm:grid-cols-[1fr_auto] items-center sticky bottom-3 z-20 !bg-butter`} style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
            <p className="font-bold" role="status">{voted ? t('vote.thanks') : t('vote.picks', { count: picks.length, max: MAX_PICKS })}</p>
            <Button variant="primary" disabled={voted || !picks.length} onClick={async () => { setStore(await castVote(d.tag, picks)); setPicks([]); }}>
              <CheckCircle weight="bold" size={20} />{t('vote.cast')}
            </Button>
            {teacher && classes.length > 0 && (
              <div className="sm:col-span-2 flex flex-wrap items-center gap-2 border-t-[2px] border-border-soft pt-3">
                <label className="font-bold text-sm flex items-center gap-2">{t('vote.class')}
                  <select value={classId} onChange={(e) => setClassId(e.target.value)} className="min-h-11 px-2 rounded-input border-std border-border font-bold">
                    <option value="">{t('vote.pickClass')}</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
                <Button disabled={!classId || classVoted || !picks.length} onClick={async () => { setStore(await castVote(d.tag, picks, classId)); setPicks([]); }}>{classVoted ? t('vote.classDone') : t('vote.castClass')}</Button>
              </div>
            )}
          </div>
        ) : <p className="font-bold" role="status">{t('vote.closed', { date: day(closeDate(d)) })}</p>}
        <p className="text-sm font-semibold text-muted">{t('vote.note')}</p>
      </div>
    </section>
  );
}
