import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight } from '@phosphor-icons/react';
import { data } from '../data';
import { t } from '../i18n';
import Title from '../ui/Title';

// The one join page (product plan): students type their class code (letters
// only) and go to their class sign-in. Live game codes join here in Stage 6.
export default function JoinPage() {
  const [code, setCode] = useState('');
  const [wrong, setWrong] = useState(false);
  const navigate = useNavigate();
  async function join() {
    const c = code.trim().toUpperCase();
    const found = (await data.listClassrooms()).find((x) => x.joinCode === c);
    if (found) navigate(`/arcade/${found.id}`);
    else { setWrong(true); window.setTimeout(() => setWrong(false), 900); }
  }
  return (
    <main className="max-w-lg mx-auto px-4 pt-14 pb-16 grid gap-5 justify-items-center text-center">
      <h1 className="title-bubble text-5xl"><Title text={t('join.title')} /></h1>
      <p className="font-bold text-lg">{t('join.sub')}</p>
      <motion.input animate={wrong ? { x: [0, -10, 10, -6, 6, 0] } : undefined} value={code} maxLength={5} autoCapitalize="characters" autoComplete="off" spellCheck={false}
        onChange={(e) => setCode(e.target.value.replace(/[^a-z]/gi, '').toUpperCase())} onKeyDown={(e) => { if (e.key === 'Enter' && code.length === 5) void join(); }}
        aria-label={t('join.code')} placeholder="BKDFT"
        className="w-full max-w-xs text-center font-display text-5xl tracking-[0.3em] min-h-20 rounded-panel border-[3px] border-border bg-surface uppercase" />
      <p className="min-h-6 font-bold" role="status" aria-live="polite">{wrong ? t('join.wrong') : ''}</p>
      <button type="button" disabled={code.length !== 5} onClick={() => void join()}
        className="min-h-16 px-10 rounded-pill border-[2.5px] border-border bg-accent font-display text-2xl inline-flex items-center gap-2 disabled:opacity-50" style={{ boxShadow: 'var(--shadow-sticker)' }}>
        {t('join.go')}<ArrowRight weight="bold" size={26} />
      </button>
    </main>
  );
}
