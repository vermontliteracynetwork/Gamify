import { useState } from 'react';
import { Bug, Lightbulb, SmileySad } from '@phosphor-icons/react';
import { data, newId } from '../data';
import type { FeedbackReport } from '../data/types';
import { t } from '../i18n';
import { Button } from './kit';

const KINDS: { id: FeedbackReport['kind']; icon: typeof Bug; label: () => string }[] = [
  { id: 'bug', icon: Bug, label: () => t('tell.bug') },
  { id: 'problem', icon: SmileySad, label: () => t('tell.problem') },
  { id: 'idea', icon: Lightbulb, label: () => t('tell.idea') },
];

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
      <h3 className="font-display text-xl font-bold">{t('tell.title')}</h3>
      {sent ? (
        <p className="font-bold" role="status">{t('tell.sent')}</p>
      ) : (
        <>
          <p className="font-bold text-sm">{t('tell.subtitle')}</p>
          <div role="radiogroup" aria-label={t('tell.title')} className="grid grid-cols-3 gap-2">
            {KINDS.map(({ id, icon: Icon, label }) => (
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
              <Button variant="primary" className="justify-self-start" onClick={send}>{t('tell.send')}</Button>
            </>
          )}
        </>
      )}
    </section>
  );
}
