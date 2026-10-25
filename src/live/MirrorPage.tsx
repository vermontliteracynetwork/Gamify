import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, CircleHalf, MagnifyingGlassMinus, MagnifyingGlassPlus, SpeakerHigh, X } from '@phosphor-icons/react';
import { speak } from '../engine/feedback';
import { t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';
import Title from '../ui/Title';
import { listenMirror, type MirrorMsg } from './mirror';

const LETTERS = ['A', 'B', 'C', 'D'];
const SIZES = ['text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl'];

// The student's Share Mirror: the big screen's question, close up, view only,
// with their own text size, contrast and read-aloud.
export default function MirrorPage() {
  const { code = '' } = useParams();
  const { settings } = useSettings();
  const [q, setQ] = useState<Extract<MirrorMsg, { t: 'q' }> | null>(null);
  const [result, setResult] = useState<Extract<MirrorMsg, { t: 'result' }> | null>(null);
  const [size, setSize] = useState(1);
  const [contrast, setContrast] = useState(false);
  const [autoRead, setAutoRead] = useState(true);
  useEffect(() => listenMirror(code, (m) => {
    if (m.t === 'q') { setQ(m); setResult(null); }
    if (m.t === 'result') setResult(m);
    if (m.t === 'clear') { setQ(null); setResult(null); }
  }), [code]);
  const read = (m: typeof q) => m && speak(`${m.prompt}. ${m.choices.map((c, i) => `${LETTERS[i]}: ${c}`).join('. ')}`, settings);
  useEffect(() => { if (q && autoRead) read(q); }, [q]); // eslint-disable-line react-hooks/exhaustive-deps
  const ink = contrast ? 'bg-black text-white border-white' : 'bg-surface text-text border-border';
  const tool = `min-h-12 px-4 rounded-pill border-[2px] font-bold inline-flex items-center gap-2 ${contrast ? 'bg-black text-white border-white' : 'bg-surface-2 border-border'}`;
  return (
    <main className={`min-h-[calc(100dvh-4rem)] px-4 py-4 grid gap-4 content-start ${contrast ? 'bg-black' : ''}`}>
      <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label={t('mirror.tools')}>
        <span className={`font-display text-xl flex-1 ${contrast ? 'text-white' : ''}`}>{t('mirror.title')}</span>
        <button type="button" className={tool} disabled={size === 0} onClick={() => setSize(size - 1)} aria-label={t('mirror.smaller')}><MagnifyingGlassMinus weight="bold" size={22} /></button>
        <button type="button" className={tool} disabled={size === SIZES.length - 1} onClick={() => setSize(size + 1)} aria-label={t('mirror.bigger')}><MagnifyingGlassPlus weight="bold" size={22} /></button>
        <button type="button" className={tool} aria-pressed={contrast} onClick={() => setContrast(!contrast)}><CircleHalf weight="fill" size={22} />{t('mirror.contrast')}</button>
        <button type="button" className={tool} onClick={() => read(q)} disabled={!q}><SpeakerHigh weight="bold" size={22} />{t('q.listen')}</button>
        <label className={`inline-flex items-center gap-2 font-bold min-h-12 ${contrast ? 'text-white' : ''}`}><input type="checkbox" checked={autoRead} onChange={(e) => setAutoRead(e.target.checked)} className="w-5 h-5" />{t('mirror.autoRead')}</label>
      </div>
      {!q ? (
        <div className={`border-[3px] rounded-panel p-8 text-center ${ink}`} role="status"><h1 className="font-display text-3xl"><Title text={t('mirror.waiting')} /></h1><p className="font-bold">{t('mirror.waitingText')}</p></div>
      ) : (
        <section className={`border-[3px] rounded-panel p-5 grid gap-4 ${ink}`} aria-live="polite">
          <p className="font-bold text-lg">{t('share.whoseTurn', { name: q.player })}</p>
          {q.imageUrl && <img src={q.imageUrl} alt={q.imageAlt ?? ''} className="max-h-[30dvh] w-auto mx-auto rounded-input" />}
          <h1 className={`font-body font-bold leading-snug ${SIZES[size]}`}>{q.prompt}</h1>
          <ul className="grid gap-3 list-none p-0 m-0">
            {q.choices.map((c, i) => {
              const right = result && i === result.correct;
              const wrong = result && result.picked === i && !result.right;
              return (
                <li key={i} className={`flex items-center gap-3 rounded-input border-[3px] p-3 font-bold ${SIZES[Math.max(0, size - 1)]} ${right ? 'ring-[5px] ring-success' : ''} ${wrong ? 'ring-[5px] ring-danger' : ''} ${contrast ? 'border-white' : 'border-border bg-surface-2'}`}>
                  <span className={`w-12 h-12 shrink-0 rounded-full border-[2.5px] flex items-center justify-center font-display text-2xl ${contrast ? 'border-white' : 'border-border bg-surface'}`}>{right ? <Check weight="bold" size={26} aria-label={t('q.rightMark')} /> : wrong ? <X weight="bold" size={26} aria-label={t('q.notThisMark')} /> : LETTERS[i]}</span>
                  <span className="min-w-0 break-words">{c}</span>
                </li>
              );
            })}
          </ul>
          <p className="text-sm font-bold opacity-80">{t('mirror.viewOnly')}</p>
        </section>
      )}
    </main>
  );
}
