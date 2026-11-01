import { useEffect, useRef, useState } from 'react';
import { Microphone, Play, Stop, Trash, UploadSimple } from '@phosphor-icons/react';
import { t } from '../i18n';
import { Button } from '../ui/kit';

const MAX_SECONDS = 30;
const MAX_BYTES = 1_500_000;

const toDataUrl = (blob: Blob) => new Promise<string>((ok, fail) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = () => fail(r.error); r.readAsDataURL(blob); });

// The teacher reads a question in their own voice (market gaps, 2026-11-01):
// record it here (up to 30 seconds) or add a sound file. Students hear it in
// place of the reading voice, then the answers are read as usual.
export default function QuestionVoice({ n, audioUrl, onChange }: { n: number; audioUrl?: string; onChange: (url: string | undefined) => void }) {
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const [secs, setSecs] = useState(0);
  const [problem, setProblem] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => () => { rec?.stream.getTracks().forEach((tr) => tr.stop()); audio.current?.pause(); }, [rec]);
  useEffect(() => {
    if (!rec) return;
    const id = window.setInterval(() => setSecs((s) => { if (s + 1 >= MAX_SECONDS) rec.stop(); return s + 1; }), 1000);
    return () => window.clearInterval(id);
  }, [rec]);

  async function start() {
    setProblem('');
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { setProblem(t('editor.voice.noMic')); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      const parts: Blob[] = [];
      r.ondataavailable = (e) => { if (e.data.size) parts.push(e.data); };
      r.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        setRec(null);
        const blob = new Blob(parts, { type: r.mimeType || 'audio/webm' });
        if (blob.size) onChange(await toDataUrl(blob));
      };
      r.start();
      setSecs(0);
      setRec(r);
    } catch { setProblem(t('editor.voice.noMic')); }
  }
  async function upload(file: File | undefined) {
    setProblem('');
    if (!file) return;
    if (!file.type.startsWith('audio/')) { setProblem(t('editor.voice.notAudio')); return; }
    if (file.size > MAX_BYTES) { setProblem(t('editor.voice.tooBig')); return; }
    onChange(await toDataUrl(file));
  }
  function play() {
    if (!audioUrl) return;
    audio.current?.pause();
    audio.current = new Audio(audioUrl);
    void audio.current.play();
  }

  return (
    <>
      {rec ? (
        <Button variant="primary" onClick={() => rec.stop()} aria-label={t('editor.voice.stop', { n })}>
          <Stop weight="fill" size={16} />{t('editor.voice.stopShort', { secs: MAX_SECONDS - secs })}
        </Button>
      ) : audioUrl ? (
        <span className="inline-flex items-center gap-1 rounded-pill border-[2px] border-border bg-[#c8f0dc] pl-1 pr-1">
          <button type="button" onClick={play} aria-label={t('editor.voice.play', { n })} className="min-h-10 px-3 inline-flex items-center gap-1.5 font-bold text-sm"><Play weight="fill" size={16} />{t('editor.voice.yours')}</button>
          <button type="button" onClick={() => onChange(undefined)} aria-label={t('editor.voice.remove', { n })} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface"><Trash weight="bold" size={16} /></button>
        </span>
      ) : (
        <>
          <Button variant="ghost" onClick={() => void start()} aria-label={t('editor.voice.record', { n })}><Microphone weight="bold" size={16} />{t('editor.voice.recordShort')}</Button>
          <Button variant="ghost" onClick={() => fileRef.current?.click()} aria-label={t('editor.voice.upload', { n })}><UploadSimple weight="bold" size={16} />{t('editor.voice.uploadShort')}</Button>
          <input ref={fileRef} type="file" accept="audio/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; void upload(f); }} />
        </>
      )}
      {problem && <span className="font-bold text-sm" role="status">{problem}</span>}
    </>
  );
}
