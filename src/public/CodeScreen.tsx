import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { ArrowLeft } from '@phosphor-icons/react';
import { t } from '../i18n';
import { speak } from '../engine/feedback';
import { useSettings } from '../settings/SettingsContext';
import { ThemedPage, useGameTheme } from '../theme/useGameTheme';
import { pieceImage } from '../theme/library';

// The projector code screen: the code huge, spelled out, a QR code of the
// join link, and the join address. Read aloud letter by letter on tap.
export default function CodeScreen() {
  const { code = '' } = useParams();
  const [qr, setQr] = useState('');
  const { settings } = useSettings();
  const link = `${window.location.origin}/join/${code}`;
  // Wears the teacher's Big screen look (Theme Builder).
  const { theme } = useGameTheme('big-screen');
  useEffect(() => { void QRCode.toDataURL(link, { margin: 1, width: 480, color: { dark: '#000000', light: '#fbfcf8' } }).then(setQr); }, [link]);
  return (
    <ThemedPage theme={theme}>
    <main className="stage-text min-h-[calc(100dvh-4rem)] px-4 py-4 grid content-center justify-items-center gap-4 text-center">
      <p className="font-display text-3xl sm:text-4xl">{t('show.goTo', { host: window.location.host })}</p>
      <button type="button" onClick={() => speak(code.split('').join(', '), settings)} aria-label={t('show.readAloud', { code: code.split('').join(' ') })}
        className="font-display text-[clamp(56px,min(14vw,18vh),200px)] leading-none tracking-[0.15em] bg-surface border-[3px] border-border rounded-panel px-8 py-4" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
        {code}
      </button>
      <div className="flex items-center justify-center gap-4">
        {pieceImage(theme, 'mascot') && <img src={pieceImage(theme, 'mascot')} alt="" className="w-[min(24vh,240px)] h-auto object-contain" />}
        {qr && <img src={qr} alt={t('show.qr')} className="w-[min(30vh,320px)] h-auto rounded-input border-[3px] border-border" />}
      </div>
      <p className="font-bold text-lg">{t('show.scan')}</p>
      <Link to="/teacher" className="no-print min-h-11 px-4 rounded-pill border-[2px] border-border bg-surface-2 font-bold inline-flex items-center gap-2 no-underline text-text"><ArrowLeft weight="bold" size={18} />{t('show.back')}</Link>
    </main>
    </ThemedPage>
  );
}
