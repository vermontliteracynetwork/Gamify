import type { QuestionLogEntry, Student } from '../data/types';
import { DEFAULT_SETTINGS } from '../settings/settings';
import { t } from '../i18n';
import { groupLog, percent, retention, type ReportRow } from './reports';

// The printable progress report (teacher, 2026-11-16: "make sure reports are
// comprehensive and professional", easy to print or save as a PDF). One
// document for a whole class or for one student: a letterhead, the numbers
// at a glance, how each student, set and game went, activity by day, the
// questions to practice and the ones mastered, and a note on how it is
// measured. The same document shows on screen and prints on letter paper.

export interface ReportNames { student: (id?: string) => string; set: (id?: string) => string; game: (id: string) => string }

export interface ReportInput {
  log: QuestionLogEntry[];
  students: Student[];
  names: ReportNames;
  className: string;
  student?: Student;
  teacher?: string;
  from?: string;
  to?: string;
}

// The supports a teacher set for a student, in a few words.
export function supportsText(s?: Student): string {
  const a = s?.accommodations;
  if (!a) return '';
  const parts: string[] = [];
  if (a.readFirstSeconds !== undefined && a.readFirstSeconds !== DEFAULT_SETTINGS.readFirstSeconds) parts.push(t('reports.sup.read', { n: a.readFirstSeconds }));
  if (a.triesPerQuestion !== undefined && a.triesPerQuestion !== DEFAULT_SETTINGS.triesPerQuestion) parts.push(t('reports.sup.tries', { n: a.triesPerQuestion }));
  if (a.shuffleAnswers === false) parts.push(t('reports.sup.noShuffle'));
  const tools = Object.entries(a.tools ?? {}).filter(([, on]) => on).map(([k]) => t(`tool.${k as 'listen'}`));
  if (tools.length) parts.push(tools.join(', '));
  return parts.join('; ');
}

// Earlier half against later half of a student's answers: up, down or steady.
export function trend(entries: QuestionLogEntry[]): 'up' | 'down' | 'steady' | 'new' {
  const done = entries.filter((e) => e.outcome !== 'left').sort((a, b) => a.at.localeCompare(b.at));
  if (done.length < 6) return 'new';
  const half = Math.floor(done.length / 2);
  const pct = (xs: QuestionLogEntry[]) => percent(xs.filter((e) => e.outcome === 'right').length, xs.length);
  const d = pct(done.slice(half)) - pct(done.slice(0, half));
  return d >= 8 ? 'up' : d <= -8 ? 'down' : 'steady';
}

export function reportData({ log, names }: Pick<ReportInput, 'log' | 'names'>) {
  const done = log.filter((e) => e.outcome !== 'left');
  const right = done.filter((e) => e.outcome === 'right').length;
  const firstTry = done.filter((e) => e.outcome === 'right' && e.tries.length <= 1).length;
  const kept = retention(log);
  const days = [...new Set(log.map((e) => e.at.slice(0, 10)))].sort();
  const questions = groupLog(log, 'question', names);
  const answerOf = new Map(log.map((e) => [e.prompt, e.answer]));
  const practice = questions.filter((q) => q.asked - q.left >= 1 && percent(q.right, q.asked - q.left) < 80)
    .sort((a, b) => percent(a.right, a.asked - a.left) - percent(b.right, b.asked - b.left) || b.asked - a.asked).slice(0, 10);
  const mastered = questions.filter((q) => q.asked - q.left >= 2 && percent(q.right, q.asked - q.left) >= 90)
    .sort((a, b) => b.asked - a.asked).slice(0, 8);
  return {
    answered: done.length,
    rightPct: percent(right, done.length),
    firstTryPct: percent(firstTry, done.length),
    kept,
    minutes: Math.round(log.reduce((s, e) => s + e.ms, 0) / 60000),
    days,
    studentsPlayed: new Set(log.map((e) => e.studentId).filter(Boolean)).size,
    byStudent: groupLog(log.filter((e) => e.studentId), 'student', names).sort((a, b) => a.label.localeCompare(b.label)),
    bySet: groupLog(log, 'set', names).sort((a, b) => b.asked - a.asked),
    byGame: groupLog(log, 'game', names).sort((a, b) => b.asked - a.asked),
    byDay: groupLog(log, 'day', names).sort((a, b) => a.key.localeCompare(b.key)),
    practice, mastered, answerOf,
  };
}

const fmtDay = (d: string) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '');
const shortDay = (d: string) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '');
const pctOf = (r: ReportRow) => percent(r.right, r.asked - r.left);
const band = (p: number) => (p >= 80 ? '#9fe7a0' : p >= 50 ? '#fdfd94' : '#ed9d75');

function Bar({ pct }: { pct: number }) {
  return (
    <span className="inline-flex items-center gap-2 font-bold tabular-nums whitespace-nowrap">
      <span className="w-16 h-2.5 rounded-pill border border-border bg-surface-2 overflow-hidden print:border-[#999]" aria-hidden="true"><span className="block h-full" style={{ width: `${pct}%`, background: band(pct) }} /></span>{pct}%
    </span>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="report-section grid gap-2 content-start">
      <h2 className="report-h2">{title}</h2>
      {note && <p className="report-note">{note}</p>}
      {children}
    </section>
  );
}

function Table({ head, rows, caption }: { head: string[]; rows: React.ReactNode[][]; caption: string }) {
  return (
    <table className="w-full text-sm border-collapse">
      <caption className="sr-only">{caption}</caption>
      <thead><tr>{head.map((h) => <th key={h} scope="col" className="report-th">{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i} className="report-tr break-inside-avoid">{r.map((c, j) => j === 0 ? <th key={j} scope="row" className="report-td text-left font-bold align-top">{c}</th> : <td key={j} className="report-td tabular-nums align-top">{c}</td>)}</tr>)}</tbody>
    </table>
  );
}

// Questions answered each day, colored by how many were right.
function DayChart({ rows }: { rows: ReportRow[] }) {
  const shown = rows.slice(-21);
  const max = Math.max(1, ...shown.map((r) => r.asked));
  const W = Math.max(360, shown.length * 44), H = 150, gap = 8, bw = Math.min(56, (W - gap * (shown.length - 1)) / shown.length);
  return (
    <figure className="m-0 grid gap-1">
      <svg viewBox={`0 0 ${W} ${H + 34}`} preserveAspectRatio="xMinYMid meet" className="w-full" style={{ height: 190 }} role="img" aria-label={t('rp.dayChart')}>
        <line x1="0" y1={H} x2={W} y2={H} stroke="#000" strokeWidth="1.5" />
        {shown.map((r, i) => {
          const h = Math.max(2, (r.asked / max) * (H - 18)), x = i * (bw + gap), p = pctOf(r);
          return (
            <g key={r.key}>
              <rect x={x} y={H - h} width={bw} height={h} rx="3" fill={band(p)} stroke="#000" strokeWidth="1" />
              <text x={x + bw / 2} y={H - h - 4} textAnchor="middle" fontSize="11" fontWeight="700">{r.asked}</text>
              {(shown.length <= 10 || i % Math.ceil(shown.length / 10) === 0) && <text x={x + bw / 2} y={H + 16} textAnchor="middle" fontSize="11" fontWeight="600">{new Date(`${r.key}T12:00:00`).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}</text>}
            </g>
          );
        })}
      </svg>
      <figcaption className="text-xs font-semibold text-muted flex flex-wrap gap-3">
        {[['#9fe7a0', t('rp.key80')], ['#fdfd94', t('rp.key50')], ['#ed9d75', t('rp.keyLow')]].map(([c, l]) => <span key={l} className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm border border-border" style={{ background: c }} />{l}</span>)}
      </figcaption>
    </figure>
  );
}

export default function ReportDoc(input: ReportInput) {
  const { log, students, names, className, student, teacher, from, to } = input;
  const d = reportData({ log, names });
  const range = from || to ? `${fmtDay(from ?? d.days[0] ?? '')} to ${fmtDay(to ?? d.days[d.days.length - 1] ?? '')}` : d.days.length ? `${fmtDay(d.days[0])} to ${fmtDay(d.days[d.days.length - 1])}` : t('rp.noDates');
  const title = student ? t('rp.studentTitle') : t('rp.classTitle');
  const stat = [
    [t('rp.answered'), d.answered],
    [t('rp.right'), `${d.rightPct}%`],
    [t('rp.firstTry'), `${d.firstTryPct}%`],
    [t('rp.kept'), d.kept.checked ? `${percent(d.kept.kept, d.kept.checked)}%` : t('rp.notYet')],
    [t('rp.minutes'), d.minutes],
    [t('rp.days'), d.days.length],
    ...(student ? [] : [[t('rp.studentsPlayed'), `${d.studentsPlayed} / ${students.length}`]]),
  ] as [string, string | number][];
  const sup = student ? supportsText(student) : '';
  const byId = new Map(students.map((s) => [s.id, s]));

  return (
    // A traditional, formal report (teacher, 2026-11-20): a letter-size white
    // page with real margins, a serif body, thin rules and small-caps headings,
    // shown on screen exactly as it prints.
    <article className="report-doc report-formal" aria-label={title}>
      {/* Letterhead */}
      {/* A div, not a header: the site hides every header when printing. */}
      <div className="report-letterhead">
        <div className="flex items-end justify-between gap-4">
          <img src="/brand/gamify-wordmark.png" alt="Gamify" className="h-8 w-auto" />
          <p className="report-kicker">{t('rp.confidential')}</p>
        </div>
        <h1 className="report-h1">{title}</h1>
        <dl className="report-meta">
          <div><dt>{student ? t('rp.student') : t('rp.class')}</dt><dd>{student ? `${student.name}, ${className}` : className}</dd></div>
          <div><dt>{t('rp.period')}</dt><dd>{range}</dd></div>
          {teacher && <div><dt>{t('rp.teacher')}</dt><dd>{teacher}</dd></div>}
          <div><dt>{t('rp.made')}</dt><dd>{fmtDay(new Date().toISOString().slice(0, 10))}</dd></div>
          {!student && <div><dt>{t('rp.roster')}</dt><dd>{t('rp.rosterCount', { count: students.length })}</dd></div>}
        </dl>
      </div>

      {log.length === 0 ? <p className="report-p">{t('rp.empty')}</p> : <>
        {/* At a glance */}
        <Section title={t('rp.glance')}>
          <div className="report-stats">
            {stat.map(([l, v]) => (
              <div key={l} className="break-inside-avoid">
                <p className="report-stat-label">{l}</p>
                <p className="report-stat-value tabular-nums">{v}</p>
              </div>
            ))}
          </div>
          <p className="report-p">{student
            ? t('rp.summaryStudent', { name: student.name, n: d.answered, pct: d.rightPct, days: d.days.length })
            : t('rp.summaryClass', { n: d.answered, pct: d.rightPct, played: d.studentsPlayed, total: students.length })}</p>
          {student && sup && <p className="report-p"><span className="font-bold">{t('rp.supports')}: </span>{sup}</p>}
        </Section>

        {/* Students (class report) */}
        {!student && d.byStudent.length > 0 && (
          <Section title={t('rp.byStudent')} note={t('rp.byStudentNote')}>
            <Table caption={t('rp.byStudent')} head={[t('rp.student'), t('rp.answeredShort'), t('rp.right'), t('rp.firstTry'), t('rp.avg'), t('rp.minutes'), t('rp.trend'), t('rp.last'), t('rp.supports')]}
              rows={d.byStudent.map((r) => {
                const tr = trend(log.filter((e) => e.studentId === r.key));
                return [r.label, r.asked - r.left, <Bar key="b" pct={pctOf(r)} />, `${percent(r.firstTry, r.asked - r.left)}%`, `${r.avgSeconds}s`, r.minutes, t(`rp.trend.${tr}`), shortDay(r.lastDay), supportsText(byId.get(r.key)) || '-'];
              })} />
            {students.length > d.studentsPlayed && <p className="report-p"><span className="font-bold">{t('rp.notPlayed')}: </span>{students.filter((s) => !d.byStudent.some((r) => r.key === s.id)).map((s) => s.name).join(', ')}</p>}
          </Section>
        )}

        <div className="grid lg:grid-cols-2 print:grid-cols-2 gap-7 print:gap-5">
          <Section title={t('rp.bySet')}>
            <Table caption={t('rp.bySet')} head={[t('rp.set'), t('rp.answeredShort'), t('rp.right')]} rows={d.bySet.map((r) => [r.label, r.asked - r.left, <Bar key="b" pct={pctOf(r)} />])} />
          </Section>
          <Section title={t('rp.byGame')}>
            <Table caption={t('rp.byGame')} head={[t('rp.game'), t('rp.answeredShort'), t('rp.right')]} rows={d.byGame.map((r) => [r.label, r.asked - r.left, <Bar key="b" pct={pctOf(r)} />])} />
          </Section>
        </div>

        {d.byDay.length > 1 && (
          <Section title={t('rp.byDay')} note={t('rp.byDayNote')}>
            <DayChart rows={d.byDay} />
          </Section>
        )}

        <Section title={t('rp.practice')} note={t('rp.practiceNote')}>
          {d.practice.length === 0 ? <p className="report-p">{t('rp.practiceNone')}</p> : (
            <Table caption={t('rp.practice')} head={[t('rp.question'), t('rp.answer'), t('rp.right'), t('rp.topWrong')]}
              rows={d.practice.map((q) => [q.label, d.answerOf.get(q.key) ?? '', <Bar key="b" pct={pctOf(q)} />, q.topWrong ?? '-'])} />
          )}
        </Section>

        {d.mastered.length > 0 && (
          <Section title={t('rp.mastered')} note={t('rp.masteredNote')}>
            <ul className="report-p grid sm:grid-cols-2 print:grid-cols-2 gap-x-6 gap-y-1 list-disc pl-5 m-0">
              {d.mastered.map((q) => <li key={q.key}>{q.label} <span className="text-[#555]">({pctOf(q)}%)</span></li>)}
            </ul>
          </Section>
        )}
      </>}

      <footer className="report-foot">
        <p>{t('rp.howMeasured')}</p>
        <p>{t('rp.privacy')}</p>
      </footer>
    </article>
  );
}
