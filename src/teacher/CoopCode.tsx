import { useEffect, useState } from 'react';
import { UsersThree } from '@phosphor-icons/react';
import { coopPrice, PRICES_USD_PER_YEAR } from '../config';
import { supabase } from '../data/supabase';
import { t } from '../i18n';
import { Button, Panel } from '../ui/kit';

// A family in a homeschool co-op enters its co-op's code for 25% off
// (teacher, 2026-11-20, option B). Each family keeps its own account.
export default function CoopCode() {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [mine, setMine] = useState<{ coop?: string; percent?: number } | null>(null);
  useEffect(() => {
    if (!supabase) return;
    void supabase.rpc('my_coop').then(({ data }) => setMine((data as { coop?: string; percent?: number } | null) ?? {}));
  }, []);
  async function join() {
    if (!supabase) { setMsg(t('code.cloud')); return; }
    setBusy(true);
    const { data: res, error } = await supabase.rpc('join_coop', { c: code.trim() });
    setBusy(false);
    if (error) { setMsg(t('coop.problem.setup')); return; }
    const r = res as { problem?: string; coop?: string; percent?: number };
    if (r.problem) { setMsg(t(r.problem === 'signin' ? 'coop.problem.signin' : 'coop.problem.unknown')); return; }
    setMine({ coop: r.coop, percent: r.percent });
    setMsg('');
  }
  const pct = mine?.percent ?? 25;
  const price = (plan: 'homeschool' | 'plus') => (coopPrice(PRICES_USD_PER_YEAR[plan], pct) / 12).toFixed(2).replace(/\.00$/, '');
  return (
    <Panel className="grid gap-2">
      <h2 className="font-display text-2xl flex items-center gap-2"><UsersThree weight="fill" size={26} aria-hidden="true" />{t('coop.title')}</h2>
      {mine?.coop ? (
        <p className="font-bold" role="status">{t('coop.in', { coop: mine.coop, pct, home: price('homeschool'), plus: price('plus') })}</p>
      ) : <>
        <p className="font-semibold">{t('coop.hint', { pct })}</p>
        <div className="flex flex-wrap items-center gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} maxLength={20} aria-label={t('coop.label')} placeholder={t('coop.label')}
            className="min-h-12 px-3 rounded-input border-std border-border font-bold tracking-[0.15em] w-56" />
          <Button variant="primary" disabled={busy || code.length < 4} onClick={() => void join()}>{t('coop.join')}</Button>
        </div>
      </>}
      {msg && <p className="font-bold" role="alert">{msg}</p>}
    </Panel>
  );
}
