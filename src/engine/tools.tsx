import { useRef, useState } from 'react';
import { t } from '../i18n';
import { evaluate } from './arithmetic';

// Question screen tools: a simple calculator and a finger-drawing scratchpad.

export function CalculatorTool() {
  const [expr, setExpr] = useState('');
  const keys = ['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '−', '0', '.', '=', '+'];
  function press(k: string) {
    if (k === '=') {
      const value = evaluate(expr);
      setExpr(value === null ? '' : String(value));
      return;
    }
    setExpr((e) => e + k);
  }
  return (
    <div className="grid gap-2 max-w-xs">
      <div className="min-h-12 px-3 flex items-center justify-end rounded-input border-[2px] border-border bg-surface font-display text-2xl font-bold" aria-live="polite">{expr || '0'}</div>
      <div className="grid grid-cols-4 gap-1.5">
        {keys.map((k) => (
          <button key={k} type="button" onClick={() => press(k)} className="min-h-11 rounded-input border-[2px] border-border bg-surface-2 font-display text-xl font-bold">{k}</button>
        ))}
      </div>
      <button type="button" onClick={() => setExpr('')} className="min-h-11 rounded-pill border-[2px] border-border bg-surface font-bold">{t('q.clear')}</button>
    </div>
  );
}

export function Scratchpad() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const c = canvas.current!;
    const r = c.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * c.width, ((e.clientY - r.top) / r.height) * c.height] as const;
  }
  return (
    <div className="grid gap-2">
      <canvas
        ref={canvas}
        width={800}
        height={300}
        aria-label={t('q.scratchpad')}
        className="w-full h-40 rounded-input border-[2px] border-border bg-surface touch-none"
        onPointerDown={(e) => {
          drawing.current = true;
          const ctx = canvas.current!.getContext('2d')!;
          ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.strokeStyle = '#241c3d';
          ctx.beginPath(); ctx.moveTo(...point(e));
          canvas.current!.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => { if (drawing.current) { const ctx = canvas.current!.getContext('2d')!; ctx.lineTo(...point(e)); ctx.stroke(); } }}
        onPointerUp={() => { drawing.current = false; }}
      />
      <button type="button" className="justify-self-start min-h-11 px-4 rounded-pill border-[2px] border-border bg-surface font-bold"
        onClick={() => { const c = canvas.current!; c.getContext('2d')!.clearRect(0, 0, c.width, c.height); }}>{t('q.clear')}</button>
    </div>
  );
}

// Times table (a teacher-allowed tool): tap a number to light up its row
// and column.
export function TimesTable() {
  const [pick, setPick] = useState<{ r: number; c: number } | null>(null);
  const n = Array.from({ length: 12 }, (_, i) => i + 1);
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-sm font-bold tabular-nums" aria-label={t('q.timesTable')}>
        <thead>
          <tr><th className="w-9 h-9" aria-hidden="true">×</th>{n.map((c) => <th key={c} className={`w-9 h-9 ${pick?.c === c ? 'bg-accent' : 'bg-surface-2'} border border-border-soft`}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {n.map((r) => (
            <tr key={r}>
              <th className={`w-9 h-9 ${pick?.r === r ? 'bg-accent' : 'bg-surface-2'} border border-border-soft`}>{r}</th>
              {n.map((c) => (
                <td key={c} className="p-0 border border-border-soft">
                  <button type="button" onClick={() => setPick({ r, c })} aria-label={`${r} × ${c} = ${r * c}`}
                    className={`w-9 h-9 ${pick && (pick.r === r || pick.c === c) ? (pick.r === r && pick.c === c ? 'bg-accent' : 'bg-accent/30') : 'bg-surface'}`}>
                    {r * c}
                  </button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
