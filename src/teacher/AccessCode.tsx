import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket } from '@phosphor-icons/react';
import { data } from '../data';
import { useAsync } from '../data/hooks';
import { supabase } from '../data/supabase';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { Button, Panel } from '../ui/kit';

const longDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

// When a plan from a code or a beta invitation ends (Stage 7).
export function PlanUntil() {
  const { value } = useAsync(() => data.getSetting<{ tier?: string; until: string | null; note: string | null }>('plan-info'));
  if (!value?.until) return null;
  return <p className="font-bold">{t('account.until', { date: longDate(value.until) })}</p>;
}

// An access code (like the Vermont Literacy Network code) or a beta code
// gives a Free teacher a plan for some months (0011_access_codes.sql).
export default function AccessCode() {
  const [code, setCode] = useState('');
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  async function redeem() {
    if (!supabase) { setMsg(t('code.cloud')); return; }
    setBusy(true);
    const { data: res, error } = await supabase.rpc('redeem_code', { c: code.trim(), agree });
    setBusy(false);
    if (error) { setMsg(t('code.problem.setup')); return; }
    const r = res as { problem?: string; tier?: string; until?: string };
    if (r.problem) { setMsg(t(`code.problem.${r.problem}` as StringKey)); return; }
    setMsg(t('code.done', { plan: t(`pricing.${r.tier}` as StringKey), date: longDate(r.until!) }));
    window.dispatchEvent(new Event('gamify-tier'));
  }
  return (
    <Panel className="grid gap-2">
      <h2 className="font-display text-2xl flex items-center gap-2"><Ticket weight="fill" size={26} aria-hidden="true" />{t('code.title')}</h2>
      <p className="font-semibold">{t('code.hint')}</p>
      <div className="flex flex-wrap items-center gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} maxLength={20} aria-label={t('code.label')} placeholder={t('code.label')}
          className="min-h-12 px-3 rounded-input border-[2px] border-border font-bold tracking-[0.15em] w-56" />
        <Button variant="primary" disabled={busy || code.length < 4} onClick={() => void redeem()}>{t('code.use')}</Button>
      </div>
      <label className="inline-flex items-start gap-2 font-semibold text-sm">
        <input type="checkbox" className="w-5 h-5 mt-0.5" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>{t('code.agree')} <Link to="/beta">{t('code.agreeLink')}</Link></span>
      </label>
      {msg && <p className="font-bold" role="status">{msg}</p>}
    </Panel>
  );
}
