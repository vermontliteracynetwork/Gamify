import { Printer } from '@phosphor-icons/react';
import { t } from '../i18n';
import { Button } from '../ui/kit';
import Title from '../ui/Title';
import { CRITERIA, METHODS, REPORT_DATE, type Level } from './conformance';

const TINT: Record<Level, string> = { Supports: '#e5f4e4', 'Partially supports': '#f9eeda', 'Does not support': '#fbebeb', 'Not applicable': '#f0efec' };

// The accessibility conformance report schools ask for (Stage 8), in the
// VPAT 2.5 WCAG layout; prints or saves as a PDF. Draft until the attorney
// and the beta screen reader testing are done.
export default function ConformanceReport() {
  const count = (l: Level) => CRITERIA.filter((c) => c.result === l).length;
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-16 grid gap-5">
      <div className="no-print flex flex-wrap items-center gap-3">
        <Button variant="primary" onClick={() => window.print()}><Printer weight="bold" size={18} />{t('vpat.print')}</Button>
      </div>
      <article className="bg-surface border-[2.5px] border-border rounded-panel p-5 sm:p-8 grid gap-4 print:border-0 print:p-0">
        <h1 className="font-display text-3xl sm:text-4xl"><Title text={t('vpat.title')} /></h1>
        <p className="font-semibold">{t('vpat.intro', { date: REPORT_DATE })}</p>
        <p className="font-bold">{t('vpat.summary', { s: count('Supports'), p: count('Partially supports'), n: count('Not applicable'), d: count('Does not support') })}</p>
        <h2 className="font-display text-2xl">{t('vpat.methods')}</h2>
        <ul className="grid gap-1.5 pl-6 m-0 list-disc font-semibold">{METHODS.map((m) => <li key={m}>{m}</li>)}</ul>
        {(['A', 'AA'] as const).map((lv) => (
          <section key={lv} className="grid gap-2">
            <h2 className="font-display text-2xl">{t('vpat.table', { level: lv })}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead><tr className="text-left"><th className="p-2 border-[1.5px] border-border">{t('vpat.criterion')}</th><th className="p-2 border-[1.5px] border-border">{t('vpat.result')}</th><th className="p-2 border-[1.5px] border-border">{t('vpat.remarks')}</th></tr></thead>
                <tbody>
                  {CRITERIA.filter((c) => c.level === lv).map((c) => (
                    <tr key={c.id}>
                      <td className="p-2 border-[1.5px] border-border font-bold align-top whitespace-nowrap">{c.id} {c.name}</td>
                      <td className="p-2 border-[1.5px] border-border font-bold align-top whitespace-nowrap" style={{ background: TINT[c.result] }}>{c.result}</td>
                      <td className="p-2 border-[1.5px] border-border align-top">{c.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
        <p className="text-sm font-semibold text-muted">{t('vpat.footer')}</p>
      </article>
    </main>
  );
}
