import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

// A PIN or number code typed with the device's own keyboard (teacher,
// 2026-11-24: "prompt the mobile keyboard or regular typing to appear instead
// of having a code/keyboard on screen at all"). One real input sits over the
// boxes: on a phone or iPad it opens the number keyboard, on a laptop it just
// takes typing; paste and Backspace work, and tapping a box focuses it.
// `letters` (the join page's game codes, 5 letters): the letter keyboard and
// capitals. `xl`: the join page's big boxes (Universal views 17), the next box
// Butter with a Lemon ring and a blinking caret while it waits for typing.
export default function CodeBoxes({ length = 4, value, onChange, label, masked = true, shake = false, autoFocus = true, size = 'md', letters = false, onEnter }: {
  length?: number; value: string; onChange: (v: string) => void; label: string;
  masked?: boolean; shake?: boolean; autoFocus?: boolean; size?: 'md' | 'lg' | 'xl'; letters?: boolean; onEnter?: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  // Refocus after a wrong try clears the boxes, so the keyboard stays up.
  useEffect(() => { if (autoFocus && value === '') ref.current?.focus({ preventScroll: true }); }, [autoFocus, value]);
  const xl = size === 'xl';
  const box = xl ? 'w-[clamp(3.5rem,15vw,6rem)] h-[clamp(4.5rem,19vw,7.5rem)] text-[clamp(2.25rem,9vw,4.25rem)] rounded-[1.1rem] border-heavy' : size === 'lg' ? 'w-16 h-20 text-4xl rounded-input border-bold' : 'w-14 h-16 text-3xl rounded-input border-bold';
  return (
    <motion.div className={`relative inline-flex ${xl ? 'gap-[clamp(0.4rem,2vw,0.75rem)]' : 'gap-3'}`} animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : undefined}>
      {Array.from({ length }, (_, i) => {
        const on = focused && i === Math.min(value.length, length - 1);
        const caret = xl && on && i >= value.length;
        return (
          <span key={i} aria-hidden="true"
            className={`${box} relative border-border flex items-center justify-center font-display ${xl ? 'uppercase' : 'font-bold'} ${on && xl ? 'bg-butter' : 'bg-surface'} ${on && !xl ? 'outline-[3px] outline-offset-2 outline-text outline' : ''}`}
            style={{ boxShadow: on && xl ? '0 0 0 0.3rem var(--color-lemon)' : 'var(--shadow-sticker)' }}>
            {i < value.length ? (masked ? <span className="w-4 h-4 rounded-full bg-border" /> : value[i]) : ''}
            {caret && <span className="code-caret absolute w-1 h-[55%] rounded-full bg-border" />}
          </span>
        );
      })}
      <input ref={ref} value={value} aria-label={label} autoFocus={autoFocus}
        type={masked ? 'password' : 'text'} inputMode={letters ? 'text' : 'numeric'} pattern={letters ? '[A-Za-z]*' : '[0-9]*'} autoComplete={letters ? 'off' : 'one-time-code'} enterKeyHint="go" maxLength={length}
        autoCapitalize={letters ? 'characters' : undefined} autoCorrect="off" spellCheck={false}
        onKeyDown={(e) => { if (e.key === 'Enter') onEnter?.(); }}
        onChange={(e) => onChange((letters ? e.target.value.replace(/[^a-z]/gi, '').toUpperCase() : e.target.value.replace(/\D/g, '')).slice(0, length))}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-text text-[16px]" />
    </motion.div>
  );
}
