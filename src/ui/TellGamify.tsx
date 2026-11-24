import { useEffect, useState } from 'react';
import { supabase } from '../data/supabase';
import { Bug, ChatCircleText, Lifebuoy, Lightbulb, PlusCircle } from '@phosphor-icons/react';
import { data, newId } from '../data';
import type { FeedbackReport } from '../data/types';
import { t } from '../i18n';
import { Button, fieldClasses } from './kit';
import Title from './Title';

// The four report types (owner, 2026-11-24: "errors, recommendations,
// requests, feedback in general"). Each saves as one of the inbox kinds the
// database already allows, with its type named at the start of the message,
// so no new database step is needed.
type ReportType = 'error' | 'recommendation' | 'request' | 'feedback' | 'help';
const TYPES: { id: ReportType; kind: FeedbackReport['kind']; icon: typeof Bug; label: () => string; tag: string }[] = [
  { id: 'error', kind: 'bug', icon: Bug, label: () => t('report.error'), tag: 'Error' },
  { id: 'recommendation', kind: 'idea', icon: Lightbulb, label: () => t('report.recommendation'), tag: 'Recommendation' },
  { id: 'request', kind: 'idea', icon: PlusCircle, label: () => t('report.request'), tag: 'Request' },
  { id: 'feedback', kind: 'problem', icon: ChatCircleText, label: () => t('report.feedback'), tag: 'Feedback' },
];
// Teachers can also ask for help; it lands in the owner's inbox.
const HELP = { id: 'help' as const, kind: 'help' as const, icon: Lifebuoy, label: () => t('tell.help'), tag: 'Help' };

// "Tell Gamify" / Report: from any game or page, for every plan and everyone.
// Big picture choices first so young students can use it without reading;
// then a short title and a short description, both optional for students.
export function TellGamify({ context, role = 'student', bare = false }: { context?: string; role?: FeedbackReport['role']; bare?: boolean }) {
  const [type, setType] = useState<ReportType | null>(null);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [sent, setSent] = useState(false);
  const list = role === 'teacher' ? [...TYPES, HELP] : TYPES;
  const chosen = list.find((x) => x.id === type);

  async function send() {
    if (!chosen) return;
    const text = [title.trim(), details.trim()].filter(Boolean).join('\n\n');
    await data.sendFeedback({
      id: newId('fb'), at: new Date().toISOString(), kind: chosen.kind, details: `[${chosen.tag}] ${text}`.trim(),
      where: context ?? window.location.pathname, role, device: navigator.userAgent,
    });
    setSent(true);
  }

  return (
    <section className={bare ? 'grid gap-3' : 'grid gap-3 rounded-input border-std border-border-soft p-4 bg-surface-2'}>
      {!bare && <h3 className="font-display text-xl font-bold"><Title text={t('tell.title')} /></h3>}
      {sent ? (
        <p className="font-bold" role="status">{t('tell.sent')}</p>
      ) : (
        <>
          <p className="font-bold text-sm">{t('report.subtitle')}</p>
          <div role="radiogroup" aria-label={t('report.type')} className={`grid gap-2 grid-cols-2 ${role === 'teacher' ? 'sm:grid-cols-5' : 'sm:grid-cols-4'}`}>
            {list.map(({ id, icon: Icon, label }) => (
              <button key={id} type="button" role="radio" aria-checked={type === id} onClick={() => setType(id)}
                className={`min-h-24 rounded-input border-std flex flex-col items-center justify-center gap-1 p-2 font-bold text-sm text-center
                            ${type === id ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}>
                <Icon weight="bold" size={34} aria-hidden="true" />
                {label()}
              </button>
            ))}
          </div>
          {type && (
            <>
              <label className="grid gap-1 font-bold text-sm">
                {t('report.titleField')}
                <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} className={fieldClasses()} />
              </label>
              <label className="grid gap-1 font-bold text-sm">
                {t('report.describe')}
                <textarea id="tell-details" value={details} onChange={(e) => setDetails(e.target.value)} rows={3} maxLength={1000}
                  className="px-3 py-2 rounded-input border-std border-border bg-surface font-bold" />
              </label>
              {role === 'student' && <p className="text-sm font-bold">{t('tell.noNames')}</p>}
              {type === 'help' && <p className="text-sm font-bold">{t('tell.helpNote')}</p>}
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
          <li key={r.id} className="rounded-input border-std border-border bg-surface p-2 grid gap-1">
            {r.details && <p className="text-sm font-semibold text-muted">{t('tell.you', { text: r.details })}</p>}
            <p className="font-bold">{r.reply}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
