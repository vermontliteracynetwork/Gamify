import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

// A PIN or number code typed with the device's own keyboard (teacher,
// 2026-11-24: "prompt the mobile keyboard or regular typing to appear instead
// of having a code/keyboard on screen at all"). One real input sits over the
// boxes: on a phone or iPad it opens the number keyboard, on a laptop it just
// takes typing; paste and Backspace work, and tapping a box focuses it.
export default function CodeBoxes({ length = 4, value, onChange, label, masked = true, shake = false, autoFocus = true, size = 'md' }: {
  length?: number; value: string; onChange: (v: string) => void; label: string;
  masked?: boolean; shake?: boolean; autoFocus?: boolean; size?: 'md' | 'lg';
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  // Refocus after a wrong try clears the boxes, so the keyboard stays up.
  useEffect(() => { if (autoFocus && value === '') ref.current?.focus({ preventScroll: true }); }, [autoFocus, value]);
  const box = size === 'lg' ? 'w-16 h-20 text-4xl' : 'w-14 h-16 text-3xl';
  return (
    <motion.div className="relative inline-flex gap-3" animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : undefined}>
      {Array.from({ length }, (_, i) => {
        const on = focused && i === Math.min(value.length, length - 1);
        return (
          <span key={i} aria-hidden="true"
            className={`${box} rounded-input border-bold border-border bg-surface flex items-center justify-center font-display font-bold ${on ? 'outline-[3px] outline-offset-2 outline-text outline' : ''}`}
            style={{ boxShadow: 'var(--shadow-sticker)' }}>
            {i < value.length ? (masked ? <span className="w-4 h-4 rounded-full bg-border" /> : value[i]) : ''}
          </span>
        );
      })}
      <input ref={ref} value={value} aria-label={label} autoFocus={autoFocus}
        type={masked ? 'password' : 'text'} inputMode="numeric" pattern="[0-9]*" autoComplete="one-time-code" enterKeyHint="go" maxLength={length}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, length))}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-text text-[16px]" />
    </motion.div>
  );
}
