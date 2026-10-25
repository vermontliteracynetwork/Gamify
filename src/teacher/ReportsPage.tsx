import { useMemo, useState } from 'react';
import { DownloadSimple, SortAscending, SortDescending } from '@phosphor-icons/react';
import { TIERS } from '../config';
import { data } from '../data';
import { useAsync, useMySets, useTier } from '../data/hooks';
import { LIBRARY } from '../data/library';
import type { Student } from '../data/types';
import { GAMES } from '../games/registry';
import { t } from '../i18n';
import { PageHeader, Panel, Tabs } from '../ui/kit';
import TeacherNav from '../ui/TeacherNav';
import { filterLog, groupLog, percent, toCsv, type GroupBy, type ReportFilter, type ReportRow, retention } from './reports';
import { UpgradeButton } from '../billing/Upgrade';

// Teacher reports over the question log (development plan Stage 4): group
// by student, question, set, game, day or team; filter, sort, search, see
// totals and the most common wrong answer; download a CSV.
type SortKey = 'label' | 'asked' | 'pct' | 'firstTry' | 'avgSeconds';

export default function ReportsPage() {
  const tier = useTier();
  const { value: classes = [] } = useAsync(() => data.listClassrooms());
  const [classId, setClassId] = useState('');
  const { value: log = [] } = useAsync(() => data.listQuestionLog(classId ? { classroomId: classId } : undefined), [classId]);
  const { value: students = [] } = useAsync<Student[]>(async () => (classId ? data.listStudents(classId) : (await Promise.all((await data.listClassrooms()).map((c) => data.listStudents(c.id)))).flat()), [classId]);
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const [by, setBy] = useState<GroupBy>('student');
  const [filter, setFilter] = useState<ReportFilter>({});
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'asked', desc: true });

  const days = TIERS[tier].reportHistoryDays;
  const since = Number.isFinite(days) ? new Date(Date.now() - days * 86400000).toISOString().slice(0, 10) : undefined;
  const names = {
    student: (id?: string) => students.find((s) => s.id === id)?.name ?? t('reports.noStudent'),
    set: (id?: string) => sets.find((s) => s.id === id)?.name ?? t('reports.noSet'),
    game: (id: string) => GAMES.find((g) => g.id === id)?.name ?? id,
  };
  const rows = useMemo(() => {
    const kept = filterLog(log, { ...filter, from: [filter.from, since].filter(Boolean).sort().pop() });
    const grouped = groupLog(kept, by, names);
    const val = (r: ReportRow) => (sort.key === 'pct' ? percent(r.right, r.asked) : r[sort.key]);
    return { kept, grouped: grouped.sort((a, b) => { const x = val(a), y = val(b); const c = typeof x === 'string' ? x.localeCompare(String(y)) : (x as number) - (y as number); return sort.desc ? -c : c; }) };
  }, [log, filter, by, sort, students, sets, since]); // eslint-disable-line react-hooks/exhaustive-deps

  const total = rows.grouped.reduce((a, r) => ({ asked: a.asked + r.asked, right: a.right + r.right, firstTry: a.firstTry + r.firstTry }), { asked: 0, right: 0, firstTry: 0 });
  const kept = useMemo(() => retention(rows.kept), [rows.kept]);
  const field = 'min-h-11 px-3 rounded-input border-[2px] border-border bg-surface font-bold';
  const groupLabel = t(`reports.by.${by}`);

  function download() {
    const blob = new Blob([toCsv(rows.grouped, groupLabel)], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `gamify-report-${by}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  const Head = ({ k, children }: { k: SortKey; children: string }) => (
    <th scope="col" className="p-2.5 text-left">
      <button type="button" onClick={() => setSort({ key: k, desc: sort.key === k ? !sort.desc : true })} className="font-bold inline-flex items-center gap-1 min-h-9" aria-label={t('reports.sortBy', { col: children })}>
        {children}{sort.key === k && (sort.desc ? <SortDescending weight="bold" size={16} /> : <SortAscending weight="bold" size={16} />)}
      </button>
    </th>
  );

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-24">
      <TeacherNav />
      <PageHeader title={t('reports.title')} subtitle={Number.isFinite(days) ? t('reports.historyNote', { days }) : t('reports.subtitle')}
        actions={<>{Number.isFinite(days) && <UpgradeButton suggest="pro" label={t('upgrade.history')} className="min-h-11 px-4" />}<button type="button" onClick={download} disabled={rows.grouped.length === 0} className="min-h-11 px-4 rounded-pill border-[2px] border-border bg-accent font-bold inline-flex items-center gap-2 disabled:opacity-50"><DownloadSimple weight="bold" size={18} />{t('reports.csv')}</button></>} />
      <Tabs label={t('reports.groupBy')} value={by} onChange={setBy} options={(['student', 'question', 'set', 'game', 'day', 'team'] as GroupBy[]).map((g) => ({ id: g, label: t(`reports.by.${g}`) }))} />
      <Panel className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6 mb-4">
        <select aria-label={t('reports.class')} value={classId} onChange={(e) => { setClassId(e.target.value); setFilter({ ...filter, studentId: undefined }); }} className={field}>
          <option value="">{t('reports.allClasses')}</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select aria-label={t('reports.student')} value={filter.studentId ?? ''} onChange={(e) => setFilter({ ...filter, studentId: e.target.value || undefined })} className={field}>
          <option value="">{t('reports.allStudents')}</option>
          {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select aria-label={t('reports.game')} value={filter.gameId ?? ''} onChange={(e) => setFilter({ ...filter, gameId: e.target.value || undefined })} className={field}>
          <option value="">{t('reports.allGames')}</option>
          {GAMES.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <input type="date" aria-label={t('reports.from')} value={filter.from ?? ''} onChange={(e) => setFilter({ ...filter, from: e.target.value || undefined })} className={field} />
        <input type="date" aria-label={t('reports.to')} value={filter.to ?? ''} onChange={(e) => setFilter({ ...filter, to: e.target.value || undefined })} className={field} />
        <input type="search" aria-label={t('reports.search')} placeholder={t('reports.search')} value={filter.search ?? ''} onChange={(e) => setFilter({ ...filter, search: e.target.value })} className={field} />
      </Panel>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        {[[t('reports.questions'), total.asked], [t('reports.right'), `${percent(total.right, total.asked)}%`], [t('reports.firstTry'), `${percent(total.firstTry, total.asked)}%`], [t('reports.kept'), kept.checked ? `${percent(kept.kept, kept.checked)}%` : '-'], [t('reports.rows'), rows.grouped.length]].map(([label, v]) => (
          <Panel key={String(label)} className="!p-4"><p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p><p className="font-display text-3xl">{v}</p></Panel>
        ))}
      </div>
      {rows.grouped.length === 0 ? <Panel><p className="font-bold">{t('reports.empty')}</p></Panel> : (
        <div className="overflow-x-auto bg-surface border-[2.5px] border-border rounded-panel">
          <table className="w-full min-w-[720px]">
            <caption className="sr-only">{t('reports.title')}</caption>
            <thead className="border-b-[2px] border-border"><tr>
              <Head k="label">{groupLabel}</Head><Head k="asked">{t('reports.questions')}</Head><Head k="pct">{t('reports.right')}</Head>
              <Head k="firstTry">{t('reports.firstTryCount')}</Head><Head k="avgSeconds">{t('reports.avg')}</Head>
              <th scope="col" className="p-2.5 text-left font-bold">{t('reports.topWrong')}</th>
            </tr></thead>
            <tbody>
              {rows.grouped.map((r) => {
                const pct = percent(r.right, r.asked);
                return (
                  <tr key={r.key} className="border-b border-border-soft last:border-0">
                    <th scope="row" className="p-2.5 text-left font-bold max-w-80">{r.label}</th>
                    <td className="p-2.5 font-semibold tabular-nums">{r.asked}{r.left > 0 && <span className="text-muted text-sm"> ({t('reports.left', { n: r.left })})</span>}</td>
                    <td className="p-2.5">
                      <span className="inline-flex items-center gap-2 font-bold tabular-nums">
                        <span className="w-20 h-3 rounded-pill border border-border bg-surface-2 overflow-hidden" aria-hidden="true"><span className="block h-full" style={{ width: `${pct}%`, background: pct >= 80 ? '#9fe7a0' : pct >= 50 ? '#fdfd94' : '#ed9d75' }} /></span>{pct}%
                      </span>
                    </td>
                    <td className="p-2.5 font-semibold tabular-nums">{r.firstTry}</td>
                    <td className="p-2.5 font-semibold tabular-nums">{r.avgSeconds}s</td>
                    <td className="p-2.5 font-semibold">{r.topWrong ?? ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
