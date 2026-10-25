import { useRef, useState } from 'react';
import { t } from '../i18n';

// A picture in the set editor. Double-click it (double-tap on iPad, or Enter
// from the keyboard) to type its description, which screen readers read and
// shows under the picture (teacher, 2026-10-25).
export default function CaptionedImage({ src, alt, onAlt, readOnly, className = '', required = false }: {
  src: string; alt: string; onAlt: (alt: string) => void; readOnly?: boolean; className?: string; required?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const lastTap = useRef(0);
  const open = () => { if (!readOnly) setEditing(true); };
  return (
    <figure className="m-0 grid gap-1 justify-items-start">
      <img
        src={src}
        alt={alt}
        tabIndex={readOnly ? undefined : 0}
        title={readOnly ? undefined : t('editor.captionHint')}
        onDoubleClick={open}
        onPointerUp={(e) => { if (e.pointerType !== 'touch') return; const now = Date.now(); if (now - lastTap.current < 350) open(); lastTap.current = now; }}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); open(); } }}
        className={`rounded-input border-[2px] border-border-soft ${readOnly ? '' : 'cursor-pointer'} ${className}`}
      />
      {editing ? (
        <input
          autoFocus
          value={alt}
          maxLength={200}
          onChange={(e) => onAlt(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditing(false); }}
          placeholder={t('editor.pictureAlt')}
          aria-label={t('editor.pictureAlt')}
          className="min-h-11 w-full min-w-48 px-3 rounded-input border-[2px] border-border font-bold text-sm"
        />
      ) : alt ? (
        <figcaption className="text-sm font-semibold text-muted max-w-xs">{alt}</figcaption>
      ) : !readOnly && (
        <figcaption className={`text-xs font-bold ${required ? 'text-text' : 'text-muted'}`}>{t('editor.captionHint')}</figcaption>
      )}
    </figure>
  );
}
