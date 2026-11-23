import { useEffect, useRef, useState } from 'react';
import { useSettings } from '../settings/SettingsContext';

// Every GIF on Gamify goes through this (teacher, 2026-11-23): it plays, or
// shows its first frame as a still picture when the GIFs setting (or Calm
// mode) says still. \`still\` can be a separate still image when the source
// has one (GIF services give a still version); otherwise the first frame is
// drawn from the GIF itself.
export default function Gif({ src, still, alt, className = '' }: { src: string; still?: string; alt: string; className?: string }) {
  const { settings } = useSettings();
  const paused = settings.gifs === 'still';
  const [frame, setFrame] = useState<string | null>(null);
  const tried = useRef('');
  useEffect(() => {
    if (!paused || still || tried.current === src) return;
    tried.current = src;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext('2d')?.drawImage(img, 0, 0);
        setFrame(c.toDataURL('image/png'));
      } catch { setFrame(null); }
    };
    img.src = src;
  }, [paused, src, still]);
  if (paused && (still || frame)) return <img src={still ?? frame!} alt={alt} className={className} />;
  // Still wanted but no still picture yet: show nothing moving, just a soft box.
  if (paused) return <span role="img" aria-label={alt} className={`inline-block bg-surface-2 ${className}`} />;
  return <img src={src} alt={alt} className={className} />;
}
