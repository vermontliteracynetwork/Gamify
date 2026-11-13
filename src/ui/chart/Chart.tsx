import { createContext, useContext, useId, type ComponentType, type CSSProperties, type ReactNode } from 'react';
import { Legend, ResponsiveContainer, Tooltip } from 'recharts';
import { useSettings } from '../../settings/SettingsContext';
import type { LegendPayload, TooltipContentProps } from 'recharts';

// Gamify's chart kit: the shadcn/ui chart pattern (ui.shadcn.com, MIT),
// rebuilt in the sticker look over Recharts (MIT). A ChartConfig names each
// series once (label, color, icon); ChartContainer turns the colors into CSS
// variables (--color-<key>) so marks use fill="var(--color-answers)". See
// docs/ui-libraries.md for when to chart and the accessibility rules.

export type ChartConfig = Record<string, { label: ReactNode; color?: string; icon?: ComponentType<{ size?: number }> }>;

const ChartContext = createContext<ChartConfig | null>(null);
export function useChart(): ChartConfig {
  const c = useContext(ChartContext);
  if (!c) throw new Error('useChart needs <ChartContainer>');
  return c;
}

/** Wraps one Recharts chart. `label` is the screen-reader summary (required). */
export function ChartContainer({ config, label, height = 180, className = '', children }: {
  config: ChartConfig; label: string; height?: number; className?: string; children: ReactNode;
}) {
  const id = useId();
  const vars = Object.fromEntries(Object.entries(config).map(([k, v], i) => [`--color-${k}`, v.color ?? `var(--chart-${(i % 6) + 1})`])) as CSSProperties;
  return (
    <ChartContext.Provider value={config}>
      <div data-chart={id} role="img" aria-label={label} className={`gamify-chart w-full ${className}`} style={{ ...vars, height }}>
        <ResponsiveContainer width="100%" height="100%">{children as React.ReactElement}</ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

/** Shared axis props: brand text, no clutter. Spread onto XAxis / YAxis. */
export const AXIS = { tickLine: false, axisLine: { stroke: 'var(--border)', strokeWidth: 1.5 }, tick: { fill: 'var(--text-muted)', fontSize: 12, fontWeight: 600 } } as const;
/** Shared bar props: sticker outline and rounded tops. */
export const BAR = { stroke: 'var(--border)', strokeWidth: 1.5, radius: [6, 6, 0, 0] as [number, number, number, number] } as const;

/** Recharts' grow-in follows the Motion setting: pass to isAnimationActive. */
export function useChartAnimate(): boolean {
  return useSettings().settings.motion !== 'still';
}

export const ChartTooltip = Tooltip;
export const ChartLegend = Legend;

/** Tooltip body: a small sticker card. `labelFormatter` shapes the heading. */
export function ChartTooltipContent({ active, payload, label, labelFormatter, hideLabel }: Partial<TooltipContentProps<number | string, string>> & { labelFormatter?: (label: unknown) => ReactNode; hideLabel?: boolean }) {
  const config = useChart();
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-input border-[2.5px] border-border bg-surface px-3 py-2 shadow-[0_4px_0_var(--border)] text-sm grid gap-1 min-w-32">
      {!hideLabel && <div className="font-bold">{labelFormatter ? labelFormatter(label) : String(label ?? '')}</div>}
      {payload.map((p) => {
        const key = String(p.dataKey ?? p.name ?? '');
        const item = config[key];
        return (
          <div key={key} className="flex items-center gap-2">
            <span className="inline-block size-3 rounded-[4px] border-[1.5px] border-border" style={{ background: `var(--color-${key})` }} />
            <span className="font-semibold text-muted flex-1">{item?.label ?? p.name}</span>
            <span className="font-bold tabular-nums">{typeof p.value === 'number' ? p.value.toLocaleString() : String(p.value ?? '')}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Legend body: color chip + label (+ icon), never color alone. */
export function ChartLegendContent({ payload }: { payload?: readonly LegendPayload[] }) {
  const config = useChart();
  if (!payload?.length) return null;
  return (
    <ul className="flex flex-wrap justify-center gap-3 m-0 p-0 list-none text-sm font-semibold">
      {payload.map((p) => {
        const key = String(p.dataKey ?? p.value ?? '');
        const item = config[key];
        const Icon = item?.icon;
        return (
          <li key={key} className="inline-flex items-center gap-1.5">
            {Icon ? <Icon size={14} /> : <span className="inline-block size-3 rounded-[4px] border-[1.5px] border-border" style={{ background: `var(--color-${key})` }} />}
            {item?.label ?? p.value}
          </li>
        );
      })}
    </ul>
  );
}
