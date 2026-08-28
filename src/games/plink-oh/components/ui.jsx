import React from 'react';
import { motion } from 'motion/react';
import { Check } from '@phosphor-icons/react';

export function Panel({ children, className = '', ...props }) {
  return (
    <div
      className={`rounded-panel bg-surface border-[2.5px] border-border p-5 sm:p-6 ${className}`}
      style={{ boxShadow: 'var(--shadow-sticker-lg)' }}
      {...props}
    >
      {children}
    </div>
  );
}

const VARIANTS = {
  primary: 'bg-accent text-accent-ink hover:bg-accent-hover',
  secondary: 'bg-secondary text-accent-ink hover:bg-secondary-hover',
  ghost: 'bg-surface text-text hover:bg-surface-hover',
  success: 'bg-success text-accent-ink hover:brightness-105',
  danger: 'bg-danger text-white hover:brightness-105',
};

export function Button({ variant = 'ghost', children, className = '', style, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-pill px-5 py-2.5 font-bold text-sm border-[2.5px] border-border
                  active:scale-95 active:shadow-none motion-safe:transition-transform disabled:opacity-40 disabled:pointer-events-none
                  ${VARIANTS[variant]} ${className}`}
      style={{ boxShadow: 'var(--shadow-sticker)', ...style }}
      {...props}
    >
      {children}
    </button>
  );
}

export function Toggle({ label, sub, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div>
        <div className="font-bold text-sm text-text">{label}</div>
        {sub && <div className="text-xs text-muted mt-0.5">{sub}</div>}
      </div>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative w-12 h-7 rounded-pill shrink-0 border-[2.5px] border-border active:scale-95 motion-safe:transition-transform
                    ${value ? 'bg-success' : 'bg-surface-2'}`}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white border-[1.5px] border-border flex items-center justify-center"
          style={{ x: value ? 18 : 0 }}
        >
          {value && <Check weight="bold" size={11} className="text-success" />}
        </motion.span>
      </button>
    </div>
  );
}

export function StepHeader({ steps, activeIndex }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((label, i) => (
        <React.Fragment key={label}>
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border-[2.5px] border-border
                          ${i === activeIndex ? 'bg-accent text-accent-ink' : i < activeIndex ? 'bg-success text-accent-ink' : 'bg-surface text-muted'}`}
            >
              {i < activeIndex ? <Check weight="bold" size={12} /> : i + 1}
            </div>
            <span className={`text-sm font-bold hidden sm:inline ${i === activeIndex ? 'text-text' : 'text-muted'}`}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && <div className="flex-1 h-[2.5px] bg-surface-2 rounded-full" />}
        </React.Fragment>
      ))}
    </div>
  );
}
