import { useEffect, useState } from 'react';
import { APP_DOMAIN } from '../config';
import { makeGameCode } from '../data/gameCodes';
import { t } from '../i18n';
import { Button } from '../ui/kit';

// Share a join code (Universal views 3, approved 2026-11-25): the code big on
// one paper card. It is made as the step opens, with the question set picked
// on the step before, and shows that it is working (owner, 2026-11-26: "make a
// join code doesnt work on click").
export default function JoinCodeCard({ gameId, setId }: { gameId: string; setId?: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [tries, setTries] = useState(0);
  useEffect(() => {
    if (!setId) return;
    let on = true;
    setFailed(false);
    makeGameCode(gameId, setId, 'play').then((c) => { if (on) setCode(c.code); }, (e) => { console.warn('join code not made', e); if (on) setFailed(true); });
    return () => { on = false; };
  }, [gameId, setId, tries]);
  return (
    <div className="grid justify-items-center gap-4 text-center">
      <div className="min-w-[min(36rem,90vw)] px-10 py-6 rounded-panel border-bold border-border bg-paper" style={{ boxShadow: '0 6px 0 var(--ink)' }} role="status" aria-live="polite">
        {!setId ? <p className="font-bold text-xl m-0">{t('share.pickFirst')}</p>
          : code ? <p className="m-0 font-score leading-none tracking-[0.12em] text-[clamp(3.5rem,9vw,7.5rem)]" aria-label={t('share.codeIs', { code: code.split('').join(' ') })}>{code}</p>
          : failed ? <p className="font-bold text-xl m-0">{t('share.failed')}</p>
          : <p className="font-bold text-xl m-0 motion-safe:animate-pulse">{t('share.making')}</p>}
      </div>
      {code && <p className="font-bold text-lg m-0">{t('share.where', { site: `${APP_DOMAIN}/join` })}</p>}
      {failed && <Button variant="main" onClick={() => setTries((n) => n + 1)}>{t('share.retry')}</Button>}
    </div>
  );
}
