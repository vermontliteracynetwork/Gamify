import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { ArrowLeft, Check, Copy, Keyboard, QrCode, SpeakerHigh } from '@phosphor-icons/react';
import { t } from '../i18n';
import { speak } from '../engine/feedback';
import { useSettings } from '../settings/SettingsContext';
import { ThemedPage, useGameTheme } from '../theme/useGameTheme';
import { findGameCode } from '../data/gameCodes';

// The projector code screen (share screens pass, 2026-11-20): two ways in,
// side by side on one white card so it reads from the back of the room.
// Left: type the code at the join page (the code huge, read aloud letter by
// letter on tap). Right: scan the QR code, which opens the join link with
// the code already in it, so nothing is typed. The link shows under it for
// the teacher to copy into a class page.
export default function CodeScreen() {
  const { code = '' } = useParams();
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);
  const { settings } = useSettings();
  const link = `${window.location.origin}/join/${code}`;
  // The game's own look behind the card, the same as its live screen.
  const [gameId, setGameId] = useState('star-quiz');
  useEffect(() => { void findGameCode(code).then((g) => g?.gameId && setGameId(g.gameId)); }, [code]);
  const { theme } = useGameTheme(gameId);
  useEffect(() => { void QRCode.toDataURL(link, { margin: 1, width: 560, color: { dark: '#000000', light: '#ffffff' } }).then(setQr); }, [link]);
  const host = window.location.host;
  return (
    <ThemedPage theme={theme}>
    <main className="min-h-[calc(100dvh-4rem)] px-4 py-6 grid content-center justify-items-center gap-4">
      <div className="w-full max-w-6xl bg-surface border-heavy border-border rounded-panel p-[clamp(1rem,3vh,2.5rem)] grid md:grid-cols-[1.3fr_auto_1fr] gap-[clamp(1rem,3vw,2.5rem)] items-center text-text" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
        <section className="grid gap-[clamp(0.5rem,2vh,1.25rem)] justify-items-center text-center" aria-label={t('show.typeIt')}>
          <p className="inline-flex items-center gap-2 font-bold text-muted uppercase tracking-wider text-sm"><Keyboard weight="bold" size={20} aria-hidden="true" />{t('show.typeIt')}</p>
          <p className="font-display text-[clamp(1.5rem,4vh,2.75rem)] leading-tight">{t('show.goTo', { host })}</p>
          <button type="button" onClick={() => speak(code.split('').join(', '), settings)} aria-label={t('show.readAloud', { code: code.split('').join(' ') })}
            className="relative font-display text-[clamp(4rem,min(11vw,20vh),11rem)] leading-none tracking-[0.12em] bg-accent border-heavy border-border rounded-panel px-[0.35em] py-[0.15em] motion-safe:hover:scale-[1.02] motion-safe:transition-transform" style={{ boxShadow: '0 6px 0 #000' }}>
            {code}
            <SpeakerHigh weight="bold" size={22} className="absolute right-2 top-2 opacity-60" aria-hidden="true" />
          </button>
        </section>
        <span className="hidden md:block w-[3px] self-stretch rounded-pill bg-border-soft" aria-hidden="true" />
        <section className="grid gap-[clamp(0.5rem,2vh,1rem)] justify-items-center text-center" aria-label={t('show.scanIt')}>
          <p className="inline-flex items-center gap-2 font-bold text-muted uppercase tracking-wider text-sm"><QrCode weight="bold" size={20} aria-hidden="true" />{t('show.scanIt')}</p>
          {qr && <img src={qr} alt={t('show.qr')} className="w-[min(20rem,38vh)] h-auto rounded-input border-heavy border-border" />}
          <p className="font-bold">{t('show.scanNoCode')}</p>
        </section>
      </div>
      <div className="no-print flex flex-wrap items-center justify-center gap-2">
        <Link to="/teacher" className="min-h-11 px-4 rounded-pill border-std border-border bg-surface font-bold inline-flex items-center gap-2 no-underline text-text"><ArrowLeft weight="bold" size={18} />{t('show.back')}</Link>
        <button type="button" onClick={() => { void navigator.clipboard?.writeText(link).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1600); }); }}
          className="min-h-11 px-4 rounded-pill border-std border-border bg-surface font-bold inline-flex items-center gap-2 text-text">
          {copied ? <Check weight="bold" size={18} /> : <Copy weight="bold" size={18} />}<span className="font-mono">{link.replace(/^https?:\/\//, '')}</span>
        </button>
      </div>
    </main>
    </ThemedPage>
  );
}
