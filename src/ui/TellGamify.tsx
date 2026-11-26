import { useEffect, useState } from 'react';
import { supabase } from '../data/supabase';
import { Bug, ChatCircleText, Check, CheckCircle, Lifebuoy, Lightbulb, PlusCircle } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { useReducedMotion } from './useReducedMotion';
import type { StringKey } from '../i18n/en';
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
// Each type has its own pastel so it reads by color and icon before words
// (owner 2026-11-26: "improve the feedback menus").
type TypeDef = { id: ReportType; kind: FeedbackReport['kind']; icon: typeof Bug; label: () => string; tag: string; bg: string };
const TYPES: TypeDef[] = [
  { id: 'error', kind: 'bug', icon: Bug, label: () => t('report.error'), tag: 'Error', bg: 'bg-blush' },
  { id: 'recommendation', kind: 'idea', icon: Lightbulb, label: () => t('report.recommendation'), tag: 'Recommendation', bg: 'bg-butter' },
  { id: 'request', kind: 'idea', icon: PlusCircle, label: () => t('report.request'), tag: 'Request', bg: 'bg-mint' },
  { id: 'feedback', kind: 'problem', icon: ChatCircleText, label: () => t('report.feedback'), tag: 'Feedback', bg: 'bg-blue-crystal' },
];
// Teachers can also ask for help; it lands in the owner's inbox.
const HELP: TypeDef = { id: 'help', kind: 'help', icon: Lifebuoy, label: () => t('tell.help'), tag: 'Help', bg: 'bg-lavender' };

// "Tell Gamify" / Report: from any game or page, for every plan and everyone.
// Big picture choices first so young students can use it without reading;
// then a short title and a short description, both optional for students.
export function TellGamify({ context, role = 'student', bare = false }: { context?: string; role?: FeedbackReport['role']; bare?: boolean }) {
  const [type, setType] = useState<ReportType | null>(null);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [sent, setSent] = useState(false);
  const reduce = useReducedMotion();
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

  const again = () => { setSent(false); setType(null); setTitle(''); setDetails(''); };
  return (
    <section className={bare ? 'grid gap-4' : 'grid gap-4 rounded-panel border-std border-border p-4 sm:p-5 bg-white'}>
      {!bare && <h3 className="font-display text-xl font-bold"><Title text={t('tell.title')} /></h3>}
      {sent ? (
        <motion.div initial={reduce ? false : { scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 18 }}
          className="grid justify-items-center gap-3 py-4 text-center" role="status">
          <span className="w-16 h-16 rounded-full bg-mint border-bold border-border flex items-center justify-center" style={{ boxShadow: 'var(--shadow-sticker)' }}><CheckCircle weight="bold" size={38} aria-hidden="true" /></span>
          <p className="font-bold text-lg">{t('tell.sent')}</p>
          <Button variant="secondary" onClick={again}>{t('tell.another')}</Button>
        </motion.div>
      ) : (
        <>
          <p className="font-bold">{t('report.subtitle')}</p>
          <div role="radiogroup" aria-label={t('report.type')} className={`grid gap-2.5 grid-cols-2 ${role === 'teacher' ? 'sm:grid-cols-5' : 'sm:grid-cols-4'}`}>
            {list.map(({ id, icon: Icon, label, bg }) => {
              const on = type === id;
              return (
                <motion.button key={id} type="button" role="radio" aria-checked={on} onClick={() => setType(id)}
                  whileHover={reduce ? undefined : { y: -3 }} whileTap={reduce ? undefined : { scale: 0.95 }}
                  className={`relative h-32 rounded-panel ${bg} flex flex-col items-center justify-center gap-2 p-2 font-bold text-sm leading-tight text-center text-text
                              border-std border-border ${on ? 'ring-[3px] ring-inset ring-border' : ''}`}
                  style={on ? { boxShadow: 'var(--shadow-sticker)' } : undefined}>
                  {on && <span className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-accent border-std border-border flex items-center justify-center" aria-hidden="true"><Check weight="bold" size={16} /></span>}
                  <span className="w-12 h-12 rounded-full bg-white border-std border-border flex items-center justify-center"><Icon weight="bold" size={28} aria-hidden="true" /></span>
                  {label()}
                </motion.button>
              );
            })}
          </div>
          {chosen && (
            <div key={chosen.id} className="grid gap-3">
              <label className="grid gap-1 font-bold">
                <span>{t('report.titleField')}</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder={t(`report.ph.${chosen.id}` as StringKey)} className={fieldClasses()} />
              </label>
              <label className="grid gap-1 font-bold">
                <span>{t('report.describe')}</span>
                <textarea id="tell-details" value={details} onChange={(e) => setDetails(e.target.value)} rows={3} maxLength={1000} placeholder={t(`report.phMore.${chosen.id}` as StringKey)}
                  className="px-3 py-2 rounded-input border-std border-border bg-surface font-semibold placeholder:text-muted" />
              </label>
              {role === 'student' && <p className="text-sm font-bold text-muted">{t('tell.noNames')}</p>}
              {type === 'help' && <p className="text-sm font-bold text-muted">{t('tell.helpNote')}</p>}
              {/* Either box can be left empty, but not both (Design Chair 2026-11-26). */}
              <Button variant="main" className="justify-self-start" disabled={!title.trim() && !details.trim()} onClick={send}>{t('tell.send')}</Button>
            </div>
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
