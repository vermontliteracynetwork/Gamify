import { useContext, useEffect, useState } from 'react';
import { ChoiceRow } from '../ui/fields';
import { t } from '../i18n';
import { ShareChoice } from './SetupWizard';

// After Share is picked (teacher, 2026-11-23): play on this same device, or
// share a join code so the game opens on another shared device with the same
// question set. The question sits on its own paper card (Universal views 2b);
// "Share a join code" adds the Share a join code step, after the questions.
export default function ShareHow() {
  const ctx = useContext(ShareChoice);
  const [how, setHow] = useState<'here' | 'code'>(ctx?.want ? 'code' : 'here');
  useEffect(() => { ctx?.setWant(how === 'code'); }, [how]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="justify-self-center grid gap-2 justify-items-center text-center px-6 py-4 [&_[role=radiogroup]]:justify-self-center rounded-panel border-std border-border bg-paper" style={{ boxShadow: '0 4px 0 var(--ink)' }}>
      <ChoiceRow label={t('share.how')} value={how} onChange={setHow} options={[{ value: 'here', label: t('share.here') }, { value: 'code', label: t('share.code') }]} />
      {how === 'code' && <p className="m-0 text-sm font-semibold text-muted">{t('share.after')}</p>}
    </div>
  );
}
