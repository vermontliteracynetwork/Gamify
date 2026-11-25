import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowSquareOut, Crown, PaperPlaneRight } from '@phosphor-icons/react';
import { supabase } from '../data/supabase';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { Button, fieldClasses } from '../ui/kit';
import { VT_ADVISOR_UPDATED, VT_REMINDERS } from './vermont';

// The CEO Agent (owner, 2026-11-24: "built into my development portal").
// Talks to api/ceo.ts, which runs the vendored CEO Agent engine on the
// server so no AI key ever reaches the browser. Tap a department to ask its
// head directly ("@marketing ..."); anything else goes to the CEO.
interface Dept { department: string; agents: { id: string; name: string; title: string; reportsTo: string }[] }
interface Status { configured: boolean; agentName?: string; costMode?: string; paidKey?: boolean; departments?: Dept[] }
interface Turn { role: 'user' | 'assistant'; content: string; who?: string }
type View = { k: 'loading' } | { k: 'offline' } | { k: 'owner' } | { k: 'ready'; s: Status };

const SAVE_KEY = 'gamify-ceo-chat';
const DEPTS = ['executive', 'finance', 'operations', 'technology', 'marketing', 'people', 'legal'];

async function token(): Promise<string | null> {
  if (!supabase) return null;
  return (await supabase.auth.getSession()).data.session?.access_token ?? null;
}

function loadTurns(): Turn[] {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY) ?? '[]') as Turn[]; } catch { return []; }
}

export default function CeoCard() {
  const [view, setView] = useState<View>({ k: 'loading' });
  const [turns, setTurns] = useState<Turn[]>(loadTurns);
  const [params] = useSearchParams();
  // The Astrology page's Ask button opens here with @astrology_advisor ready.
  const [draft, setDraft] = useState(() => (params.get('ask') === 'astrology_advisor' ? '@astrology_advisor ' : ''));
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void (async () => {
      const tok = await token();
      if (!tok) { setView({ k: supabase ? 'owner' : 'offline' }); return; }
      try {
        const res = await fetch('/api/ceo', { headers: { Authorization: `Bearer ${tok}` } });
        if (res.status === 401) { setView({ k: 'owner' }); return; }
        if (!res.ok || !res.headers.get('content-type')?.includes('json')) { setView({ k: 'offline' }); return; }
        setView({ k: 'ready', s: (await res.json()) as Status });
      } catch { setView({ k: 'offline' }); }
    })();
  }, []);

  useEffect(() => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(turns.slice(-40))); } catch { /* private window */ }
    end.current?.scrollIntoView({ block: 'nearest' });
  }, [turns]);

  async function send() {
    const message = draft.trim();
    if (!message || busy) return;
    const history = turns.map(({ role, content }) => ({ role, content }));
    setTurns((x) => [...x, { role: 'user', content: message }]);
    setDraft('');
    setBusy(true);
    try {
      const res = await fetch('/api/ceo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${(await token()) ?? ''}` },
        body: JSON.stringify({ message, history }),
      });
      const out = (await res.json().catch(() => ({}))) as { status?: string; text?: string; agentName?: string; userMessage?: string };
      setTurns((x) => [...x, out.status === 'ok' && out.text
        ? { role: 'assistant', content: out.text, who: out.agentName }
        : { role: 'assistant', content: out.userMessage ?? t('ceo.failed'), who: t('ceo.system') }]);
    } catch {
      setTurns((x) => [...x, { role: 'assistant', content: t('ceo.failed'), who: t('ceo.system') }]);
    } finally {
      setBusy(false);
      box.current?.focus();
    }
  }

  function ask(dept: string) {
    setDraft((d) => `@${dept} ${d.replace(/^@\S+\s*/, '')}`);
    box.current?.focus();
  }

  if (view.k !== 'ready') {
    const msg: Record<string, StringKey> = { loading: 'owner.loading', offline: 'ceo.offline', owner: 'ceo.ownerOnly' };
    return <section className="dash-card"><p className="dash-empty">{t(msg[view.k])}</p></section>;
  }
  const s = view.s;
  if (!s.configured) return <section className="dash-card"><p className="dash-empty">{t('ceo.notConfigured')}</p></section>;
  const live = new Set((s.departments ?? []).map((d) => d.department));
  const count = (s.departments ?? []).reduce((n, d) => n + d.agents.length, 0);

  return (
    <div className="grid gap-6">
      <section className="dash-card" aria-labelledby="ceo-team">
        <div className="dash-card-head">
          <h2 id="ceo-team" className="font-bold text-lg flex items-center gap-2 m-0"><Crown weight="fill" size={22} aria-hidden="true" />{s.agentName}</h2>
          <span className="dash-tag">{s.paidKey ? t('ceo.paid', { mode: s.costMode ?? '' }) : t('ceo.free')}</span>
        </div>
        <p className="dash-sub m-0">{t('ceo.team', { count })}</p>
        {!s.paidKey && <p className="text-sm font-semibold m-0">{t('ceo.addKey')}</p>}
        <ul className="flex flex-wrap gap-2 list-none p-0 m-0" aria-label={t('ceo.askDept')}>
          {DEPTS.filter((d) => live.has(d)).map((d) => (
            <li key={d}><Button size="sm" onClick={() => ask(d === 'executive' ? 'ceo_agent' : d)}>{t(`ceo.dept.${d}` as StringKey)}</Button></li>
          ))}
          <li><Button size="sm" onClick={() => ask('vermont_business_advisor')}>{t('ceo.vermontAsk')}</Button></li>
          <li><Button size="sm" onClick={() => ask('astrology_advisor')}>{t('ceo.astroAsk')}</Button></li>
        </ul>
      </section>

      <section className="dash-card" aria-labelledby="ceo-chat">
        <div className="dash-card-head">
          <h2 id="ceo-chat" className="font-bold text-lg m-0">{t('ceo.chat')}</h2>
          {turns.length > 0 && <button type="button" className="dash-link" onClick={() => setTurns([])}>{t('ceo.clear')}</button>}
        </div>
        <div className="grid gap-3 max-h-[50vh] overflow-y-auto" aria-live="polite">
          {turns.length === 0 && <p className="dash-empty m-0">{t('ceo.empty')}</p>}
          {turns.map((m, i) => (
            <div key={i} className={`rounded-input border-std p-3 ${m.role === 'user' ? 'bg-surface border-border-soft justify-self-end max-w-[85%]' : 'border-border max-w-[95%]'}`}>
              {m.role === 'assistant' && <p className="dash-tag m-0 mb-1">{m.who}</p>}
              <p className="whitespace-pre-wrap text-sm font-medium m-0">{m.content}</p>
            </div>
          ))}
          {busy && <p className="dash-empty m-0">{t('ceo.thinking')}</p>}
          <div ref={end} />
        </div>
        <form className="flex gap-2 items-end" onSubmit={(e) => { e.preventDefault(); void send(); }}>
          <textarea ref={box} value={draft} rows={2} maxLength={8000} aria-label={t('ceo.message')} placeholder={t('ceo.placeholder')}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }}
            className={fieldClasses('md', 'flex-1 resize-none')} />
          <Button variant="primary" type="submit" disabled={busy || !draft.trim()} aria-label={t('ceo.send')}><PaperPlaneRight size={20} aria-hidden="true" /></Button>
        </form>
      </section>

      <section className="dash-card" aria-labelledby="ceo-vt">
        <div className="dash-card-head">
          <h2 id="ceo-vt" className="font-bold text-lg m-0">{t('ceo.vermont')}</h2>
          <span className="dash-tag">{t('ceo.vermontUpdated', { date: VT_ADVISOR_UPDATED })}</span>
        </div>
        <p className="dash-sub m-0">{t('ceo.vermontNote')}</p>
        <ul className="grid gap-3 list-none p-0 m-0">
          {VT_REMINDERS.map((r) => (
            <li key={r.id} className="rounded-input border-std border-border p-3 grid gap-1">
              <p className="dash-tag m-0">{r.when}</p>
              <p className="font-bold m-0">{r.title}</p>
              <p className="text-sm font-medium m-0">{r.detail}</p>
              <p className="text-sm font-semibold text-muted m-0"><span className="font-bold">{t('ceo.vermontCheck')} </span>{r.check}</p>
              <a href={r.source} target="_blank" rel="noreferrer" className="dash-link justify-self-start">{t('ceo.vermontSource')}<ArrowSquareOut size={14} aria-hidden="true" /></a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
