import { useEffect, useState } from 'react';
import { LockSimple } from '@phosphor-icons/react';
import CodeBoxes from '../ui/CodeBoxes';
import { data } from '../data';
import { t } from '../i18n';
import { hashPin, PIN_KEY } from './pin';

// Asks (with the device's own number keyboard, no on-screen pad: teacher,
// 2026-11-24) for the teacher's 4-digit PIN. The first time, the
// teacher chooses one (typed twice). Unlocks until the settings close.
export default function PinGate({ onUnlock, pinKey = PIN_KEY, createLabel }: { onUnlock: () => void; pinKey?: string; createLabel?: string }) {
  const [saved, setSaved] = useState<string | null | undefined>(undefined);
  const [stage, setStage] = useState<'enter' | 'create' | 'confirm'>('enter');
  const [first, setFirst] = useState('');
  const [digits, setDigits] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    data.getSetting<string>(pinKey).then((h) => { setSaved(h ?? null); setStage(h ? 'enter' : 'create'); });
  }, [pinKey]);

  async function complete(pin: string) {
    if (stage === 'create') { setFirst(pin); setDigits(''); setStage('confirm'); setError(''); return; }
    if (stage === 'confirm') {
      if (pin !== first) { setError(t('pin.mismatch')); setDigits(''); setStage('create'); return; }
      const h = await hashPin(pin);
      await data.setSetting(pinKey, h);
      setSaved(h);
      onUnlock();
      return;
    }
    if ((await hashPin(pin)) === saved) onUnlock();
    else { setError(t('pin.wrong')); setDigits(''); }
  }

  function type(next: string) {
    setDigits(next);
    setError('');
    if (next.length === 4) window.setTimeout(() => void complete(next), 120);
  }

  if (saved === undefined) return null;
  const title = stage === 'create' ? createLabel ?? t('pin.create') : stage === 'confirm' ? t('pin.confirm') : t('pin.enter');

  return (
    <div className="grid gap-4 justify-items-center py-2">
      <LockSimple weight="fill" size={40} aria-hidden="true" />
      <p className="font-display text-xl font-bold text-center">{title}</p>
      {stage === 'create' && !createLabel && <p className="text-sm font-bold text-center max-w-xs">{t('pin.createNote')}</p>}
      <CodeBoxes key={stage} value={digits} onChange={type} label={title} shake={!!error} />
      <p className="min-h-6 font-bold text-sm" role="status" aria-live="polite">{error}</p>
    </div>
  );
}
