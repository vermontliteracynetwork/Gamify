import { Bar, BarChart, XAxis } from 'recharts';
import { t } from '../i18n';
import { AXIS, BAR, ChartContainer, ChartTooltip, ChartTooltipContent, useChartAnimate, type ChartConfig } from '../ui/chart';
import type { OwnerStats } from './DevCards';

// The owner's growth chart (teacher, 2026-10-25), on the shared chart kit.
// Its own file so Recharts stays out of the main bundle (App imports
// DevCards for the preview banner).
export function GrowthChartCard({ stats, problem, height = 150 }: { stats: OwnerStats | null; problem: string; height?: number }) {
  if (!stats) return <p className="font-semibold">{problem || t('owner.loading')}</p>;
  return (
    <div className="grid gap-4">
      <WeekBars title={t('owner.chartSignups')} rows={stats.signups} color="var(--chart-1)" height={height} />
      <WeekBars title={t('owner.chartAnswers')} rows={stats.answersByWeek} color="var(--chart-2)" height={height} />
    </div>
  );
}

function weeksBack(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); // Monday, like date_trunc('week')
  for (let i = n - 1; i >= 0; i--) out.push(new Date(d.getTime() - i * 7 * 86400000).toISOString().slice(0, 10));
  return out;
}

function WeekBars({ title, rows, color, height }: { title: string; rows: { week: string; n: number }[]; color: string; height: number }) {
  const weeks = weeksBack(26);
  const byWeek = new Map(rows.map((r) => [r.week.slice(0, 10), r.n]));
  const data = weeks.map((w) => ({ week: w, n: byWeek.get(w) ?? 0 }));
  const total = data.reduce((a, d) => a + d.n, 0);
  const animate = useChartAnimate();
  const config = { n: { label: title, color } } satisfies ChartConfig;
  return (
    <figure className="grid gap-1 m-0">
      <figcaption className="flex items-baseline gap-2"><span className="font-bold">{title}</span><span className="text-sm font-semibold text-muted">{t('owner.chartTotal', { n: total })}</span></figcaption>
      <ChartContainer config={config} height={height} label={t('owner.chartLabel', { title, n: total, last: data.at(-1)?.n ?? 0 })}>
        <BarChart data={data} margin={{ top: 8, right: 18, left: 18, bottom: 0 }}>
          <XAxis dataKey="week" {...AXIS} tickFormatter={(w: string) => w.slice(5)} interval="preserveStartEnd" minTickGap={24} />
          <ChartTooltip cursor={{ fill: 'var(--surface-2)' }} content={<ChartTooltipContent labelFormatter={(w) => t('owner.chartWeekOf', { week: String(w) })} />} />
          <Bar dataKey="n" fill="var(--color-n)" {...BAR} isAnimationActive={animate} />
        </BarChart>
      </ChartContainer>
    </figure>
  );
}

