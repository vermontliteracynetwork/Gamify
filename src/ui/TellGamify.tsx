import { useEffect, useState } from 'react';
import { supabase } from '../data/supabase';
import { Bug, Lifebuoy, Lightbulb, SmileySad } from '@phosphor-icons/react';
import { data, newId } from '../data';
import type { FeedbackReport } from '../data/types';
import { t } from '../i18n';
import { Button } from './kit';
import Title from './Title';

const KINDS: { id: FeedbackReport['kind']; icon: typeof Bug; label: () => string }[] = [
  { id: 'bug', icon: Bug, label: () => t('tell.bug') },
  { id: 'problem', icon: SmileySad, label: () => t('tell.problem') },
  { id: 'idea', icon: Lightbulb, label: () => t('tell.idea') },
];
// Teachers can also ask for help; it lands in the owner's inbox.
const HELP = { id: 'help' as const, icon: Lifebuoy, label: () => t('tell.help') };

// "Tell Gamify": report a bug, a game problem or an idea to the developer,
// from any game or page. Big picture choices first so young students can
// use it without reading; typing is optional.
export function TellGamify({ context, role = 'student' }: { context?: string; role?: FeedbackReport['role'] }) {
  const [kind, setKind] = useState<FeedbackReport['kind'] | null>(null);
  const [details, setDetails] = useState('');
  const [sent, setSent] = useState(false);

  async function send() {
    if (!kind) return;
    await data.sendFeedback({
      id: newId('fb'), at: new Date().toISOString(), kind, details: details.trim(),
      where: context ?? window.location.pathname, role, device: navigator.userAgent,
    });
    setSent(true);
  }

  return (
    <section className="grid gap-3 rounded-input border-[2px] border-border-soft p-4 bg-surface-2">
      <h3 className="font-display text-xl font-bold"><Title text={t('tell.title')} /></h3>
      {sent ? (
        <p className="font-bold" role="status">{t('tell.sent')}</p>
      ) : (
        <>
          <p className="font-bold text-sm">{t('tell.subtitle')}</p>
          <div role="radiogroup" aria-label={t('tell.title')} className={`grid gap-2 ${role === 'teacher' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
            {(role === 'teacher' ? [HELP, ...KINDS] : KINDS).map(({ id, icon: Icon, label }) => (
              <button key={id} type="button" role="radio" aria-checked={kind === id} onClick={() => setKind(id)}
                className={`min-h-24 rounded-input border-[2px] flex flex-col items-center justify-center gap-1 p-2 font-bold text-sm text-center
                            ${kind === id ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}>
                <Icon weight="bold" size={34} aria-hidden="true" />
                {label()}
              </button>
            ))}
          </div>
          {kind && (
            <>
              <label className="grid gap-1 font-bold text-sm">
                {t('tell.details')}
                <textarea id="tell-details" value={details} onChange={(e) => setDetails(e.target.value)} rows={3} maxLength={1000}
                  className="px-3 py-2 rounded-input border-[2px] border-border bg-surface font-bold" />
              </label>
              {role === 'student' && <p className="text-sm font-bold">{t('tell.noNames')}</p>}
              {kind === 'help' && <p className="text-sm font-bold">{t('tell.helpNote')}</p>}
              <Button variant="primary" className="justify-self-start" onClick={send}>{t('tell.send')}</Button>
            </>
          )}
        </>
      )}
      {role === 'teacher' && <Replies />}
    </section>
  );
}

// The owner's answers to this teacher's messages (0012), newest first.
function Replies() {
  const [list, setList] = useState<{ id: string; details: string; reply: string }[]>([]);
  useEffect(() => {
    if (!supabase) return;
    void (async () => {
      if (!(await supabase.auth.getSession()).data.session) return;
      const { data: rows } = await supabase.from('feedback_reports').select('*').order('at', { ascending: false }).limit(20);
      setList(((rows ?? []) as { id: string; details: string; reply?: string | null }[]).filter((r) => r.reply).map((r) => ({ id: r.id, details: r.details, reply: r.reply! })));
    })();
  }, []);
  if (!list.length) return null;
  return (
    <div className="grid gap-2">
      <h4 className="font-bold">{t('tell.replies')}</h4>
      <ul className="grid gap-2 list-none p-0 m-0">
        {list.map((r) => (
          <li key={r.id} className="rounded-input border-[2px] border-border bg-surface p-2 grid gap-1">
            {r.details && <p className="text-sm font-semibold text-muted">{t('tell.you', { text: r.details })}</p>}
            <p className="font-bold">{r.reply}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
