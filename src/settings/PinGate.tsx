import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Backspace, LockSimple } from '@phosphor-icons/react';
import { data } from '../data';
import { t } from '../i18n';
import { hashPin, PIN_KEY } from './pin';

// Number pad that asks for the teacher's 4-digit PIN. The first time, the
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

  function press(d: string) {
    if (digits.length >= 4) return;
    const next = digits + d;
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
      <motion.div className="flex gap-3" animate={error ? { x: [0, -8, 8, -5, 5, 0] } : undefined} aria-label={t('pin.entered', { count: digits.length })} role="img">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`w-5 h-5 rounded-full border-[2.5px] border-border ${i < digits.length ? 'bg-border' : 'bg-surface'}`} />
        ))}
      </motion.div>
      <p className="min-h-6 font-bold text-sm" role="status" aria-live="polite">{error}</p>
      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} type="button" onClick={() => press(d)} className="w-16 h-16 rounded-full border-[2.5px] border-border bg-surface-2 font-display text-2xl font-bold active:scale-95">{d}</button>
        ))}
        <span />
        <button type="button" onClick={() => press('0')} className="w-16 h-16 rounded-full border-[2.5px] border-border bg-surface-2 font-display text-2xl font-bold active:scale-95">0</button>
        <button type="button" onClick={() => setDigits((x) => x.slice(0, -1))} aria-label={t('pin.delete')} className="w-16 h-16 rounded-full flex items-center justify-center active:scale-95">
          <Backspace weight="bold" size={28} />
        </button>
      </div>
    </div>
  );
}
