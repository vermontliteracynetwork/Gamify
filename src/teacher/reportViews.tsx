import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowCounterClockwise, ArrowRight, CheckCircle, Info, LinkSimple, Lightbulb, Printer, Target, TrendDown, TrendUp, UsersThree, Warning } from '@phosphor-icons/react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts';
import type { QuestionLogEntry, QuestionSet, Student } from '../data/types';
import { useStandardText } from '../data/standardText';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { AXIS, ChartContainer, ChartTooltip, ChartTooltipContent, useChartAnimate } from '../ui/chart';
import { buttonClasses, fieldClasses } from '../ui/kit';
import {
  accuracyOverTime, activityRuns, bySkill, dayOf, firstTryPct, playWeek, progressSessions, progressStatus, questionStats, retention, rightPct, studentStats,
  percent, type ActivityRun,
} from './reports';
import type { ReportNames } from './reportDoc';

// The report views from the approved /brand Teacher portal (7a Class
// overview, 7b One Activity, 7d Small group and 1:1; teacher 2026-11-25:
// "apply the new mockups that are in the brand page to the main site"). Each
// card answers one question and ends with a plain takeaway and one next step
// (formative assessment: the evidence becomes the next teaching move, Black
// and Wiliam). Color always comes with a second cue: the number, an icon or
// a dashed 80% line (WCAG 1.4.1). Only real answers from the question log;
// a card with nothing to show says so plainly.

export interface ViewInput {
  log: QuestionLogEntry[];
  students: Student[];
  names: ReportNames;
  sets: QuestionSet[];
  classId: string;
  example: boolean;
}

export const BAND = { high: '#22b04a', mid: '#fabe37', low: '#f055a5' } as const;
export const bandColor = (p: number) => (p >= 80 ? BAND.high : p >= 50 ? BAND.mid : BAND.low);
const GRAPE = '#6a45f0', SKY = '#4ba3e8', TEAL = '#1fb5a8', INK = '#1d1a33';
const SKIN = ['#ddd6ff', '#bfdff3', '#ffd3e6', '#fff1b8', '#c8f0dc', '#ffd9b3'];

export const fmtShort = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const fmtWeekday = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' });
const fmtLong = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
const cut = (s: string, n = 26) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
const listNames = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const activityLink = (classId: string, setId?: string) => `/teacher/activity?${new URLSearchParams(Object.entries({ class: classId, set: setId ?? '' }).filter(([, v]) => v)).toString()}`;

// ---------- shared parts ----------
type Action = { label: string; icon?: ReactNode; to?: string; onClick?: () => void };
function ActionButton({ a, main = true }: { a: Action; main?: boolean }) {
  const inner = <>{a.icon ?? <ArrowRight weight="bold" size={16} />}{a.label}</>;
  const cls = buttonClasses(main ? 'primary' : 'secondary', 'shrink-0', 'sm');
  return a.to ? <Link to={a.to} className={cls}>{inner}</Link> : <button type="button" onClick={a.onClick} className={cls}>{inner}</button>;
}

/** The plain-language takeaway plus one next step, under every chart. */
export function Takeaway({ text, action }: { text: string; action?: Action }) {
  return (
    <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 rounded-input bg-butter px-3 py-2">
      <Lightbulb weight="bold" size={18} className="shrink-0" aria-hidden="true" />
      <p className="m-0 flex-1 min-w-[12rem] text-sm font-bold leading-snug">{text}</p>
      {action && <ActionButton a={action} />}
    </div>
  );
}

function Tip({ text }: { text: string }) {
  return <span title={text} aria-label={text} role="img" className="inline-grid place-items-center text-muted"><Info weight="bold" size={15} /></span>;
}

export function ReportCard({ title, tip, right, children, className = '' }: { title: string; tip?: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`bg-surface border-bold border-border rounded-panel p-4 flex flex-col gap-3 min-w-0 ${className}`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
      <header className="flex flex-wrap items-center gap-2">
        <h2 className="font-heading font-bold text-base m-0">{title}</h2>{tip && <Tip text={tip} />}<span className="flex-1" />{right}
      </header>
      {children}
    </section>
  );
}

/** A chart or list with nothing to show yet: what will fill it, in plain words. */
function Empty({ text, action }: { text: string; action?: Action }) {
  return (
    <div className="flex-1 rounded-input border-[2.5px] border-dashed border-muted bg-surface/60 p-4 grid justify-items-center content-center text-center gap-2 min-h-[8rem]">
      <p className="m-0 text-sm font-bold text-muted max-w-[28rem]">{text}</p>
      {action && <ActionButton a={action} main={false} />}
    </div>
  );
}

function BandIcon({ pct }: { pct: number }) {
  return pct >= 80 ? <CheckCircle weight="fill" size={16} className="text-success-ink shrink-0" aria-hidden="true" /> : pct < 50 ? <Warning weight="fill" size={16} className="text-error shrink-0" aria-hidden="true" /> : <span className="w-4 shrink-0" aria-hidden="true" />;
}

/** A bar on a 0 to 100 scale, its band color, the number and an icon for high or low, and a tick at 80%. */
export function PctBar({ pct, w = '5rem' }: { pct: number; w?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-bold tabular-nums whitespace-nowrap">
      <span className="relative h-3 rounded-pill border border-border bg-surface-2 overflow-hidden shrink-0" style={{ width: w }} aria-hidden="true">
        <span className="block h-full" style={{ width: `${pct}%`, background: bandColor(pct) }} />
        <span className="absolute top-0 bottom-0 border-l-[1.5px] border-dashed border-border" style={{ left: '80%' }} />
      </span>
      <BandIcon pct={pct} />{pct}%
    </span>
  );
}

function Initial({ name, i }: { name: string; i: number }) {
  return <span className="w-8 h-8 rounded-full grid place-items-center font-bold text-sm shrink-0 border-thin border-border" style={{ background: SKIN[i % SKIN.length] }} aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>;
}

function Stat({ label, value, delta, tip }: { label: string; value: string; delta?: number; tip?: string }) {
  return (
    <div className="bg-surface border-std border-border rounded-input px-4 py-3 grid gap-0.5 content-start">
      <span className="text-sm font-bold text-muted flex items-center gap-1">{label}{tip && <Tip text={tip} />}</span>
      <span className="flex flex-wrap items-baseline gap-x-2">
        <b className="font-heading text-[1.75rem] leading-tight tabular-nums">{value}</b>
        {delta !== undefined && delta !== 0 && (
          <span className={`text-sm font-bold inline-flex items-center gap-0.5 ${delta > 0 ? 'text-success-ink' : 'text-error'}`}>
            {delta > 0 ? <TrendUp weight="bold" size={14} aria-hidden="true" /> : <TrendDown weight="bold" size={14} aria-hidden="true" />}
            {delta > 0 ? '+' : ''}{delta}<span className="sr-only"> {t('rx.points')}</span>
          </span>
        )}
      </span>
    </div>
  );
}

/** A line key: solid or dashed, so the two lines differ by more than color. */
function LineKey({ items }: { items: { label: string; color: string; dash?: boolean; dots?: boolean }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[0.8125rem] font-bold" aria-hidden="true">
      {items.map((k) => <span key={k.label} className="inline-flex items-center gap-1.5"><span className={`w-6 ${k.dots ? 'border-t-[3px] border-dotted' : k.dash ? 'border-t-[3px] border-dashed' : 'border-t-[3px]'}`} style={{ borderColor: k.color }} />{k.label}</span>)}
    </div>
  );
}

const standardsFor = (sets: QuestionSet[]) => { const m = new Map(sets.map((s) => [s.id, s.standards])); return (id?: string) => (id ? m.get(id) : undefined); };

// ---------- 7a. Class overview ----------
export function ClassOverview({ log, students, names, sets, classId, example, onSeeQuestion }: ViewInput & { onSeeQuestion: (prompt: string) => void }) {
  const animate = useChartAnimate();
  const stdText = useStandardText();
  const time = useMemo(() => accuracyOverTime(log), [log]);
  const skills = useMemo(() => bySkill(log, standardsFor(sets)), [log, sets]);
  const missed = useMemo(() => questionStats(log), [log]);
  const lastDay = useMemo(() => log.reduce((d, e) => (dayOf(e) > d ? dayOf(e) : d), ''), [log]);
  const week = useMemo(() => (lastDay ? playWeek(log, lastDay) : undefined), [log, lastDay]);
  const kept = useMemo(() => retention(log), [log]);
  const allDays = useMemo(() => { const m = new Map<string, Set<string>>(); for (const e of log) if (e.studentId) m.set(e.studentId, new Set([...(m.get(e.studentId) ?? []), dayOf(e)])); return m; }, [log]);
  const answered = log.filter((e) => e.outcome !== 'left').length;
  const roster = students.length ? students : [...allDays.keys()].map((id) => ({ id, name: names.student(id) }));
  const threePlus = roster.filter((s) => (allDays.get(s.id)?.size ?? 0) >= 3).length;
  const pts = time.points;
  const first = pts[0], last = pts[pts.length - 1];
  const delta = (k: 'right' | 'first') => (pts.length >= 2 ? last[k] - first[k] : undefined);
  const when = (key: string) => (time.by === 'week' ? t('rx.weekOf', { day: fmtShort(key) }) : fmtShort(key));
  const setWith = (code: string) => {
    const counts = new Map<string, number>();
    for (const e of log) if (e.setId && sets.find((s) => s.id === e.setId)?.standards?.includes(code)) counts.set(e.setId, (counts.get(e.setId) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
  };
  const realClass = example ? '' : classId;

  if (!log.length) return <ReportCard title={t('rx.overview')}><p className="font-bold m-0">{t('reports.empty')}</p></ReportCard>;

  // Takeaways, each from the numbers on its own card.
  const accText = pts.length >= 2
    ? t(last.first >= first.first ? 'rx.acc.up' : 'rx.acc.down', { from: first.first, to: last.first, since: time.by === 'week' ? t('rx.weekOfLower', { day: fmtShort(first.key) }) : fmtShort(first.key) })
    : t('rx.acc.one', { pct: last.first });
  const weakest = skills[skills.length - 1];
  const skillText = !weakest ? '' : weakest.first >= 80 ? t('rx.skill.allGood') : t(weakest.first < 50 ? 'rx.skill.under50' : 'rx.skill.lowest', { code: weakest.code, pct: weakest.first });
  const top = missed[0];
  const missText = top && (top.topWrong ? t('rx.miss.text', { q: cut(top.prompt, 48), pct: top.first, wrong: top.topWrong, n: top.topWrongCount }) : t('rx.miss.textNoWrong', { q: cut(top.prompt, 48), pct: top.first }));
  const none = week ? roster.filter((s) => !week.daysPlayed.get(s.id)) : [];
  const once = week ? roster.filter((s) => week.daysPlayed.get(s.id) === 1) : [];
  const playText = !week ? '' : none.length || once.length
    ? [none.length ? t('rx.play.none', { names: listNames(none.slice(0, 4).map((s) => s.name)) + (none.length > 4 ? t('rx.more', { n: none.length - 4 }) : '') }) : '', once.length ? t('rx.play.once', { names: listNames(once.slice(0, 4).map((s) => s.name)) + (once.length > 4 ? t('rx.more', { n: once.length - 4 }) : '') }) : ''].filter(Boolean).join(' ')
    : t('rx.play.all');
  const missData = missed.slice(0, 6).map((q) => ({ q: cut(q.prompt, 22), full: q.prompt, first: q.first }));
  const dayData = week ? week.days.map((d, i) => ({ d: fmtWeekday(d), day: d, m: week.minutes[i] })) : [];

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <Stat label={t('rp.answered')} value={answered.toLocaleString()} />
        <Stat label={t('reports.right')} value={`${rightPct(log)}%`} delta={delta('right')} tip={t('rx.tip.right')} />
        <Stat label={t('reports.firstTry')} value={`${firstTryPct(log)}%`} delta={delta('first')} tip={t('rx.tip.first')} />
        <Stat label={t('reports.kept')} value={kept.checked ? `${percent(kept.kept, kept.checked)}%` : t('rp.notYet')} tip={t('rx.tip.kept')} />
        <Stat label={t('rx.threeDays')} value={t('rx.ofN', { n: threePlus, of: roster.length })} />
      </div>
      <div className="grid lg:grid-cols-2 gap-3 items-start">
        <ReportCard title={t('rx.accuracy')} tip={t(time.by === 'week' ? 'rx.accuracyTipWeek' : 'rx.accuracyTipDay')}>
          {pts.length < 2 ? <Empty text={t('rx.accuracyOne', { pct: last.first, right: last.right })} /> : <>
            <ChartContainer label={t('rx.accuracyLabel', { from: first.first, to: last.first, n: pts.length })} height={170} config={{ right: { label: t('reports.right'), color: SKY }, first: { label: t('reports.firstTry'), color: GRAPE } }}>
              <LineChart data={pts} margin={{ top: 8, right: 14, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="rgba(29,26,51,0.08)" />
                <XAxis dataKey="key" tickFormatter={(k: string) => fmtShort(k)} {...AXIS} />
                <YAxis domain={[0, 100]} ticks={[0, 50, 80, 100]} {...AXIS} />
                <ReferenceLine y={80} stroke={INK} strokeDasharray="4 4" />
                <ChartTooltip content={<ChartTooltipContent labelFormatter={(k) => when(String(k))} />} />
                <Line dataKey="right" stroke="var(--color-right)" strokeWidth={3} dot={{ r: 3.5 }} isAnimationActive={animate} />
                <Line dataKey="first" stroke="var(--color-first)" strokeWidth={3} strokeDasharray="6 4" dot={{ r: 3.5 }} isAnimationActive={animate} />
              </LineChart>
            </ChartContainer>
            <LineKey items={[{ label: t('reports.right'), color: SKY }, { label: t('reports.firstTry'), color: GRAPE, dash: true }, { label: t('rx.goal80'), color: INK, dots: true }]} />
          </>}
          <Takeaway text={accText} action={{ label: t('rx.acc.action'), to: activityLink(realClass) }} />
        </ReportCard>

        <ReportCard title={t('rx.skills')} tip={t('rx.skillsTip')}>
          {skills.length === 0 ? <Empty text={t('rx.skillsEmpty')} action={{ label: t('rx.skillsEmptyAction'), to: '/teacher/sets' }} /> : <>
            <ul className="list-none m-0 p-0 grid gap-2">
              {skills.slice(0, 6).map((s) => (
                <li key={s.code} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2.5 text-sm">
                  <span className="h-7 px-2.5 rounded-pill bg-lavender font-bold inline-flex items-center whitespace-nowrap" title={stdText(s.code)}>{s.code}</span>
                  <span className="font-semibold truncate" title={stdText(s.code)}>{stdText(s.code) ?? t('rx.answeredN', { n: s.answered })}</span>
                  <PctBar pct={s.first} w="6rem" />
                </li>
              ))}
            </ul>
            {skills.length > 6 && <p className="m-0 text-xs font-bold text-muted">{t('rx.skillsMore', { n: skills.length - 6 })}</p>}
            <Takeaway text={skillText} action={weakest.first >= 80 ? { label: t('rx.skill.challenge'), to: '/teacher/sets' } : { label: t('rx.skill.reteach', { code: weakest.code }), icon: <ArrowCounterClockwise weight="bold" size={16} />, to: activityLink(realClass, setWith(weakest.code)) }} />
          </>}
        </ReportCard>

        <ReportCard title={t('rx.missed')} tip={t('rx.missedTip')}>
          <ChartContainer label={t('rx.missedLabel', { q: top.prompt, pct: top.first })} height={missData.length * 34 + 34} config={{ first: { label: t('reports.firstTry'), color: GRAPE } }}>
            <BarChart data={missData} layout="vertical" margin={{ top: 4, right: 40, left: 4, bottom: 0 }}>
              <XAxis type="number" domain={[0, 100]} ticks={[0, 50, 80, 100]} {...AXIS} />
              <YAxis type="category" dataKey="q" width={150} {...AXIS} />
              <ReferenceLine x={80} stroke={INK} strokeDasharray="4 4" />
              <ChartTooltip cursor={{ fill: 'rgba(29,26,51,0.06)' }} content={<ChartTooltipContent labelFormatter={(l) => String(l)} />} />
              <Bar dataKey="first" stroke={INK} strokeWidth={1.5} radius={[0, 6, 6, 0]} barSize={20} isAnimationActive={animate}>
                {missData.map((d) => <Cell key={d.full} fill={bandColor(d.first)} />)}
                <LabelList dataKey="first" position="right" formatter={(v: unknown) => `${v}%`} style={{ fontSize: 12, fontWeight: 700, fill: INK }} />
              </Bar>
            </BarChart>
          </ChartContainer>
          <Takeaway text={missText} action={{ label: t('rx.miss.action'), onClick: () => onSeeQuestion(top.prompt) }} />
        </ReportCard>

        <ReportCard title={t('rx.time')} tip={t('rx.timeTip')}>
          <div className="grid gap-3">
            <ChartContainer label={t('rx.timeLabel', { n: dayData.reduce((s, d) => s + d.m, 0), days: dayData.filter((d) => d.m > 0).length })} height={150} config={{ m: { label: t('rx.minutes'), color: TEAL } }}>
              <BarChart data={dayData} margin={{ top: 16, right: 4, left: -24, bottom: 0 }}>
                <XAxis dataKey="d" interval={0} {...AXIS} /><YAxis allowDecimals={false} {...AXIS} />
                <Bar dataKey="m" fill="var(--color-m)" stroke={INK} strokeWidth={1.5} radius={[6, 6, 0, 0]} isAnimationActive={animate}>
                  <LabelList dataKey="m" position="top" style={{ fontSize: 12, fontWeight: 700, fill: INK }} />
                </Bar>
              </BarChart>
            </ChartContainer>
            {roster.length > 0 && week && (
              <div className="grid gap-1.5">
                <span className="text-[0.8125rem] font-bold text-muted">{t('rx.dots')}</span>
                <ul className="list-none m-0 p-0 flex flex-wrap gap-1.5">
                  {roster.map((s) => {
                    const n = week.daysPlayed.get(s.id) ?? 0;
                    return (
                      <li key={s.id} title={t('rx.dotTitle', { name: s.name, n })} className="w-6 h-6 rounded-full grid place-items-center text-[0.6875rem] font-bold border-[1.5px] border-border" style={{ background: n >= 3 ? BAND.high : n >= 1 ? BAND.mid : 'var(--color-surface)' }}>
                        <span aria-hidden="true">{n}</span><span className="sr-only">{t('rx.dotTitle', { name: s.name, n })}</span>
                      </li>
                    );
                  })}
                </ul>
                <span className="text-xs font-semibold text-muted">{t('rx.dotsKey')}</span>
              </div>
            )}
          </div>
          <Takeaway text={playText} action={none.length || once.length ? { label: t('rx.play.action'), icon: <LinkSimple weight="bold" size={16} />, to: activityLink(realClass) } : undefined} />
        </ReportCard>
      </div>
    </div>
  );
}

// ---------- 7b. One Activity ----------
export function ActivityView({ log, students, names, sets, classId, example, onGroup }: ViewInput & { onGroup: (ids: string[], setId?: string) => void }) {
  const animate = useChartAnimate();
  const runs = useMemo(() => activityRuns(log), [log]);
  const [key, setKey] = useState('');
  const run: ActivityRun | undefined = runs.find((r) => r.key === key) ?? runs[0];
  const qs = useMemo(() => (run ? questionStats(run.log) : []), [run]);
  const kids = useMemo(() => (run ? studentStats(run.log) : []), [run]);
  if (!run) return <ReportCard title={t('rx.activities')}><p className="font-bold m-0">{t('reports.empty')}</p></ReportCard>;

  // Question numbers follow the set's own order, then the order played.
  const set = sets.find((s) => s.id === run.setId);
  const inSet = new Map((set?.questions ?? []).map((q, i) => [q.prompt, i]));
  const played = [...new Set([...run.log].sort((a, b) => a.at.localeCompare(b.at)).map((e) => e.prompt))];
  const order = new Map([...played].sort((a, b) => (inSet.get(a) ?? 1e6 + played.indexOf(a)) - (inSet.get(b) ?? 1e6 + played.indexOf(b))).map((p, i) => [p, i + 1]));
  const num = (p: string) => `Q${order.get(p)}`;
  const hardest = qs[0];
  const growth = [...qs].sort((a, b) => (order.get(a.prompt) ?? 0) - (order.get(b.prompt) ?? 0)).slice(0, 20).map((q) => ({ q: num(q.prompt), first: q.first, retry: q.right }));
  const best = [...qs].sort((a, b) => (b.right - b.first) * b.answered - (a.right - a.first) * a.answered)[0];
  const bestGain = best ? Math.round(((best.right - best.first) * best.answered) / 100) : 0;
  const runClass = run.log.find((e) => e.classroomId)?.classroomId;
  const absent = students.filter((s) => (!runClass || s.classroomId === runClass) && !kids.some((k) => k.id === s.id));
  const need = kids.filter((k) => k.first < 50);
  const setName = names.set(run.setId);
  const realClass = example ? '' : classId || runClass || '';
  const label = (r: ActivityRun) => `${names.set(r.setId)} · ${names.game(r.gameId)} · ${t(`mode.${r.mode}` as StringKey)} · ${fmtLong(r.day)}`;

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className="font-bold" htmlFor="rx-activity">{t('rx.pickActivity')}</label>
        <select id="rx-activity" value={run.key} onChange={(e) => setKey(e.target.value)} className={fieldClasses('md', 'min-w-0 max-w-full flex-1 sm:flex-none')}>
          {runs.map((r) => <option key={r.key} value={r.key}>{label(r)}</option>)}
        </select>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-0.5 min-w-0 flex-1">
          <h2 className="font-heading font-bold text-xl m-0">{setName}</h2>
          <p className="m-0 font-semibold text-muted">{t('rx.runSub', { game: names.game(run.gameId), mode: t(`mode.${run.mode}` as StringKey), day: fmtLong(run.day), n: run.players })}</p>
        </div>
        {run.setId && <ActionButton a={{ label: t('rx.playAgain'), icon: <ArrowCounterClockwise weight="bold" size={16} />, to: activityLink(realClass, run.setId) }} main={false} />}
      </div>
      <div className="grid xl:grid-cols-[minmax(0,1fr)_22rem] gap-3 items-start">
        <div className="grid gap-3 min-w-0">
          <ReportCard title={t('rx.perQuestion')} tip={t('rx.perQuestionTip')}>
            <div className="overflow-x-auto -mx-1 px-1">
              <table className="w-full text-sm border-collapse min-w-[30rem]">
                <caption className="sr-only">{t('rx.perQuestion')}</caption>
                <thead><tr className="text-left text-[0.8125rem] text-muted">{['#', t('rp.question'), t('reports.firstTryCount'), t('rx.afterRetry'), t('reports.topWrong'), t('rp.avg')].map((h) => <th key={h} scope="col" className="font-bold pb-1 pr-3 align-bottom">{h}</th>)}</tr></thead>
                <tbody>
                  {qs.map((q) => (
                    <tr key={q.prompt} className={`border-t border-border-soft ${q === hardest && q.first < 80 ? 'bg-blush' : ''}`}>
                      <td className="py-1.5 pl-1.5 pr-3 font-bold whitespace-nowrap">{num(q.prompt)}</td>
                      <th scope="row" className="py-1.5 pr-3 text-left font-semibold">{q.prompt}{q === hardest && q.first < 80 && <span className="ml-2 text-xs font-bold whitespace-nowrap">({t('rx.hardest')})</span>}</th>
                      <td className="pr-3"><PctBar pct={q.first} w="3.5rem" /></td>
                      <td className="pr-3 font-bold tabular-nums">{q.right}%</td>
                      <td className="pr-3 font-semibold">{q.topWrong ? `${q.topWrong} (${q.topWrongCount})` : '-'}</td>
                      <td className="font-semibold tabular-nums whitespace-nowrap">{q.avgSeconds}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Takeaway text={hardest.first >= 80 ? t('rx.q.allGood') : hardest.topWrong ? t('rx.q.text', { q: num(hardest.prompt), pct: hardest.first, n: hardest.topWrongCount, wrong: hardest.topWrong }) : t('rx.q.textNoWrong', { q: num(hardest.prompt), pct: hardest.first })}
              action={run.setId ? { label: t('rx.q.action'), icon: <ArrowCounterClockwise weight="bold" size={16} />, to: activityLink(realClass, run.setId) } : undefined} />
          </ReportCard>
          <ReportCard title={t('rx.growth')} tip={t('rx.growthTip')}>
            <ChartContainer label={t('rx.growthLabel', { q: best ? num(best.prompt) : '', from: best?.first ?? 0, to: best?.right ?? 0 })} height={190} config={{ first: { label: t('reports.firstTryCount'), color: GRAPE }, retry: { label: t('rx.afterRetry'), color: BAND.high } }}>
              <BarChart data={growth} margin={{ top: 6, right: 8, left: -22, bottom: 0 }} barGap={2}>
                <defs>
                  <pattern id="rx-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="6" height="6" fill={BAND.high} /><line x1="0" y1="0" x2="0" y2="6" stroke={INK} strokeWidth="1.5" />
                  </pattern>
                </defs>
                <XAxis dataKey="q" {...AXIS} /><YAxis domain={[0, 100]} ticks={[0, 50, 100]} {...AXIS} />
                <ChartTooltip cursor={{ fill: 'rgba(29,26,51,0.06)' }} content={<ChartTooltipContent />} />
                <Bar dataKey="first" fill="var(--color-first)" stroke={INK} strokeWidth={1.5} radius={[4, 4, 0, 0]} isAnimationActive={animate} />
                <Bar dataKey="retry" fill="url(#rx-hatch)" stroke={INK} strokeWidth={1.5} radius={[4, 4, 0, 0]} isAnimationActive={animate} />
              </BarChart>
            </ChartContainer>
            <div className="flex flex-wrap gap-4 text-[0.8125rem] font-bold" aria-hidden="true">
              <span className="inline-flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-sm border-[1.5px] border-border" style={{ background: GRAPE }} />{t('reports.firstTryCount')}</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-sm border-[1.5px] border-border" style={{ background: `repeating-linear-gradient(45deg, ${BAND.high} 0 3px, ${INK} 3px 4.5px)` }} />{t('rx.afterRetry')}</span>
            </div>
            <Takeaway text={bestGain > 0 ? t('rx.g.text', { q: num(best.prompt), n: bestGain }) : t('rx.g.none')} />
          </ReportCard>
        </div>
        <ReportCard title={t('rx.perStudent')} tip={t('rx.perStudentTip')}>
          {kids.length === 0 ? <Empty text={t('rx.noStudents')} /> : (
            <ul className="list-none m-0 p-0 grid">
              {kids.map((k, i) => (
                <li key={k.id} className={`grid grid-cols-[2rem_minmax(0,1fr)_auto_3.5rem] items-center gap-2 py-1.5 text-sm ${i ? 'border-t border-border-soft' : ''}`}>
                  <Initial name={names.student(k.id)} i={i} /><b className="truncate">{names.student(k.id)}</b>
                  <span className="inline-flex items-center gap-1.5 font-bold tabular-nums"><BandIcon pct={k.first} />{t('rx.rightOf', { n: k.firstCount, of: k.answered })}</span>
                  <span className={`text-[0.8125rem] font-bold inline-flex items-center gap-0.5 ${k.retryGain > 0 ? 'text-success-ink' : 'text-muted'}`}>{k.retryGain > 0 && <><ArrowCounterClockwise weight="bold" size={13} aria-hidden="true" />+{k.retryGain}<span className="sr-only"> {t('rx.afterRetry')}</span></>}</span>
                </li>
              ))}
              {absent.length > 0 && (
                <li className="py-2 text-sm border-t border-border-soft"><b>{t('rx.didNotPlay')}: </b><span className="font-semibold">{absent.map((s) => s.name).join(', ')}</span></li>
              )}
            </ul>
          )}
          <p className="m-0 text-xs font-bold text-muted">{t('rx.firstTryKey')}</p>
          {kids.length > 0 && <Takeaway text={need.length ? t('rx.s.text', { names: listNames(need.slice(0, 5).map((k) => names.student(k.id))) + (need.length > 5 ? t('rx.more', { n: need.length - 5 }) : '') }) : t('rx.s.allGood')}
            action={need.length ? { label: t('rx.s.action', { count: need.length }), icon: <UsersThree weight="bold" size={16} />, onClick: () => onGroup(need.map((k) => k.id), run.setId) } : undefined} />}
        </ReportCard>
      </div>
    </div>
  );
}

// ---------- 7d. Small group and 1:1 ----------
export interface GroupPlan { ids: string[]; goal: number; by: string; setId?: string }
const groupKey = (classId: string) => `gamify:report-group:${classId || 'all'}`;
const inDays = (n: number) => new Date(Date.now() + n * 86400000).toLocaleDateString('en-CA');
export function loadGroup(classId: string): GroupPlan {
  try { const g = JSON.parse(localStorage.getItem(groupKey(classId)) ?? 'null') as GroupPlan | null; if (g && Array.isArray(g.ids)) return g; } catch { /* private window: start fresh */ }
  return { ids: [], goal: 80, by: inDays(28) };
}
function saveGroup(classId: string, g: GroupPlan) { try { localStorage.setItem(groupKey(classId), JSON.stringify(g)); } catch { /* not saved; still works this visit */ } }

export function SmallGroupView({ log, students, names, classId, example, preset }: ViewInput & { preset?: { ids: string[]; setId?: string; at: number } }) {
  const animate = useChartAnimate();
  const [plan, setPlanState] = useState<GroupPlan>(() => loadGroup(example ? 'example' : classId));
  const storeKey = example ? 'example' : classId;
  useEffect(() => { setPlanState(loadGroup(storeKey)); }, [storeKey]);
  const setPlan = (g: GroupPlan) => { setPlanState(g); saveGroup(storeKey, g); };
  // "Group these students" on an Activity report fills the group in.
  useEffect(() => { if (preset) { const g = { ...loadGroup(storeKey), ids: preset.ids, setId: preset.setId }; setPlanState(g); saveGroup(storeKey, g); } }, [preset]); // eslint-disable-line react-hooks/exhaustive-deps
  const scoped = useMemo(() => (plan.setId ? log.filter((e) => e.setId === plan.setId) : log), [log, plan.setId]);
  const playedSets = useMemo(() => [...new Set(log.map((e) => e.setId).filter(Boolean) as string[])], [log]);
  const pool = students.length ? students : [...new Set(log.map((e) => e.studentId).filter(Boolean) as string[])].map((id) => ({ id, name: names.student(id) }));
  const ranked = useMemo(() => studentStats(scoped), [scoped]);
  const lastDay = log.reduce((d, e) => (dayOf(e) > d ? dayOf(e) : d), '');
  const week = lastDay ? playWeek(scoped, lastDay) : undefined;
  const members = plan.ids.map((id) => pool.find((s) => s.id === id)).filter(Boolean) as { id: string; name: string }[];
  const cards = members.map((s) => {
    const mine = scoped.filter((e) => e.studentId === s.id);
    const points = progressSessions(mine, plan.goal, plan.by);
    const stat = studentStats(mine)[0];
    const mins = week ? Math.round(mine.filter((e) => week.days.includes(dayOf(e))).reduce((a, e) => a + e.ms, 0) / 60000) : 0;
    return { s, points, status: progressStatus(points), stat, mins };
  });
  const sessions = Math.max(0, ...cards.map((c) => c.points.length));
  const on = cards.filter((c) => c.status === 'on'), below = cards.filter((c) => c.status === 'below');
  const field = fieldClasses('md');
  const realClass = example ? '' : classId;
  const toggle = (id: string) => setPlan({ ...plan, ids: plan.ids.includes(id) ? plan.ids.filter((x) => x !== id) : [...plan.ids, id] });
  const suggest = () => setPlan({ ...plan, ids: ranked.slice(0, 4).map((r) => r.id) });

  return (
    <div className="grid gap-3">
      <ReportCard title={t('rx.group.pick')} tip={t('rx.group.pickTip')}>
        {pool.length === 0 ? <p className="m-0 font-bold">{t('reports.empty')}</p> : <>
          <ul className="list-none m-0 p-0 flex flex-wrap gap-1.5" aria-label={t('rx.group.students')}>
            {pool.map((s) => {
              const inIt = plan.ids.includes(s.id);
              return <li key={s.id}><button type="button" aria-pressed={inIt} onClick={() => toggle(s.id)} className={`min-h-10 px-3 rounded-pill border-std font-bold text-sm inline-flex items-center gap-1.5 ${inIt ? 'bg-gamify border-border' : 'bg-surface border-border-soft'}`}>{inIt && <CheckCircle weight="fill" size={16} aria-hidden="true" />}{s.name}</button></li>;
            })}
          </ul>
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1 text-sm font-bold">{t('rx.group.goal')}<input type="number" min={50} max={100} step={5} value={plan.goal} onChange={(e) => setPlan({ ...plan, goal: Math.min(100, Math.max(1, Number(e.target.value) || 80)) })} className={`${field} w-24`} /></label>
            <label className="grid gap-1 text-sm font-bold">{t('rx.group.by')}<input type="date" value={plan.by} onChange={(e) => e.target.value && setPlan({ ...plan, by: e.target.value })} className={field} /></label>
            <label className="grid gap-1 text-sm font-bold min-w-0">{t('rx.group.set')}
              <select value={plan.setId ?? ''} onChange={(e) => setPlan({ ...plan, setId: e.target.value || undefined })} className={`${field} max-w-full`}>
                <option value="">{t('rx.group.allSets')}</option>
                {playedSets.map((id) => <option key={id} value={id}>{names.set(id)}</option>)}
              </select>
            </label>
            <span className="flex-1" />
            <button type="button" onClick={suggest} className={buttonClasses('secondary')}><UsersThree weight="bold" size={18} />{t('rx.group.suggest')}</button>
          </div>
        </>}
      </ReportCard>

      {members.length === 0 ? <Empty text={t('rx.group.empty')} /> : <>
        <div className="flex flex-wrap items-center gap-3 rounded-input bg-gamify border-std border-border px-4 py-3">
          <Target weight="bold" size={22} className="shrink-0" aria-hidden="true" />
          <b className="min-w-0 flex-1">{t('rx.group.goalLine', { pct: plan.goal, set: plan.setId ? names.set(plan.setId) : t('rx.group.allSetsLower'), day: fmtLong(plan.by) })}</b>
          <span className="text-sm font-bold whitespace-nowrap">{t('rx.group.sessions', { count: sessions })}</span>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 items-stretch">
          {cards.map(({ s, points, status, stat, mins }, i) => {
            const now = points[points.length - 1]?.first;
            return (
              <section key={s.id} className="bg-surface border-bold border-border rounded-panel p-4 flex flex-col gap-2 min-w-0" style={{ boxShadow: 'var(--shadow-sticker)' }}>
                <header className="grid gap-1.5 justify-items-start">
                  <span className="flex items-center gap-2 min-w-0 max-w-full"><Initial name={s.name} i={i + 2} /><h3 className="font-heading font-bold text-lg m-0 truncate">{s.name}</h3></span>
                  <span className={`h-7 px-2.5 rounded-pill text-[0.8125rem] font-bold inline-flex items-center gap-1 whitespace-nowrap ${status === 'on' ? 'bg-mint-soft' : status === 'below' ? 'bg-secondary' : 'bg-surface-2'}`}>
                    {status === 'on' ? <CheckCircle weight="fill" size={14} aria-hidden="true" /> : status === 'below' ? <Warning weight="fill" size={14} aria-hidden="true" /> : null}{t(`rx.status.${status}` as StringKey)}
                  </span>
                </header>
                {points.length === 0 ? <Empty text={t('rx.group.noPlay', { name: s.name })} /> : <>
                  <ChartContainer label={t('rx.group.chartLabel', { name: s.name, n: points.length, now: now ?? 0, goal: plan.goal })} height={190} config={{ first: { label: t('reports.firstTry'), color: GRAPE }, aim: { label: t('rx.aim'), color: '#57506e' } }}>
                    <LineChart data={points.map((p, k) => ({ ...p, s: `S${k + 1}` }))} margin={{ top: 10, right: 8, left: -26, bottom: 0 }}>
                      <XAxis dataKey="s" {...AXIS} /><YAxis domain={[0, 100]} ticks={[0, 50, 80, 100]} {...AXIS} />
                      <ReferenceLine y={plan.goal} stroke={BAND.high} strokeWidth={2} strokeDasharray="6 4" />
                      <ChartTooltip content={<ChartTooltipContent labelFormatter={(l) => String(l)} />} />
                      <Line dataKey="aim" stroke="var(--color-aim)" strokeWidth={1.5} strokeDasharray="2 4" dot={false} isAnimationActive={animate} />
                      <Line dataKey="first" stroke="var(--color-first)" strokeWidth={3} dot={{ r: 4, fill: 'var(--color-surface)', strokeWidth: 2.5 }} isAnimationActive={animate} />
                    </LineChart>
                  </ChartContainer>
                  <LineKey items={[{ label: t('rx.firstShort'), color: GRAPE }, { label: t('rx.goalN', { pct: plan.goal }), color: BAND.high, dash: true }, { label: t('rx.aim'), color: '#57506e', dots: true }]} />
                </>}
                <dl className="grid gap-1 text-sm font-semibold m-0">
                  <div className="flex items-baseline gap-2"><dt className="text-muted">{t('rx.now')}</dt><dd className="m-0 ml-auto font-bold tabular-nums">{now !== undefined ? `${now}%` : '-'}</dd></div>
                  <div className="flex items-baseline gap-2"><dt className="text-muted">{t('rx.minutesWeek')}</dt><dd className="m-0 ml-auto font-bold tabular-nums">{mins}</dd></div>
                  <div className="grid gap-0.5"><dt className="text-muted">{t('rx.slip')}</dt><dd className="m-0 font-bold break-words" title={stat?.slip ? `${stat.slip.prompt}: ${stat.slip.answer}` : undefined}>{stat?.slip ? `“${cut(stat.slip.answer, 34)}”` : '-'}</dd></div>
                </dl>
                <div className="mt-auto pt-1">
                  {status === 'below' ? <ActionButton a={{ label: t('rx.next.below'), to: activityLink(realClass, plan.setId) }} main={false} />
                    : status === 'on' ? <ActionButton a={{ label: t('rx.next.on'), icon: <Printer weight="bold" size={16} />, to: `/teacher/reports/print?${new URLSearchParams(Object.entries({ class: example ? 'example-class' : classId, student: s.id }).filter(([, v]) => v)).toString()}` }} main={false} />
                      : <ActionButton a={{ label: t('rx.next.early'), to: activityLink(realClass, plan.setId) }} main={false} />}
                </div>
              </section>
            );
          })}
        </div>
        <Takeaway text={[on.length ? t('rx.group.onText', { names: listNames(on.map((c) => c.s.name)) }) : '', below.length ? t('rx.group.belowText', { names: listNames(below.map((c) => c.s.name)) }) : '', !on.length && !below.length ? t('rx.group.earlyText') : ''].filter(Boolean).join(' ')}
          action={below.length ? { label: t('rx.group.belowAction', { name: below[0].s.name }), to: activityLink(realClass, plan.setId) } : undefined} />
      </>}
    </div>
  );
}

