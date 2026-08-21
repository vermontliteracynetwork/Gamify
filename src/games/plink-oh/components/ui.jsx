import React from 'react';
import { motion } from 'motion/react';
import { Check } from '@phosphor-icons/react';

export function Panel({ children, className = '', ...props }) {
  return (
    <div className={`rounded-panel bg-surface border border-border-soft p-5 sm:p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

const VARIANTS = {
  primary: 'bg-accent text-accent-ink hover:bg-accent-hover',
  ghost: 'bg-bg-elevated text-text border border-border-soft hover:bg-surface-hover',
  success: 'bg-success text-accent-ink hover:brightness-110',
  danger: 'bg-danger text-white hover:brightness-110',
};

export function Button({ variant = 'ghost', children, className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-pill px-5 py-2.5 font-bold text-sm
                  transition-colors active:scale-95 motion-safe:transition-transform disabled:opacity-40 disabled:pointer-events-none
                  ${VARIANTS[variant]} ${className}`}
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
        className={`relative w-12 h-7 rounded-pill shrink-0 transition-colors active:scale-95 motion-safe:transition-transform
                    ${value ? 'bg-success' : 'bg-border'}`}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          className="absolute top-1 left-1 w-5 h-5 rounded-full bg-white flex items-center justify-center"
          style={{ x: value ? 20 : 0 }}
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
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                          ${i === activeIndex ? 'bg-accent text-accent-ink' : i < activeIndex ? 'bg-success text-accent-ink' : 'bg-border text-muted'}`}
            >
              {i < activeIndex ? <Check weight="bold" size={12} /> : i + 1}
            </div>
            <span className={`text-sm font-bold hidden sm:inline ${i === activeIndex ? 'text-text' : 'text-muted'}`}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && <div className="flex-1 h-px bg-border-soft" />}
        </React.Fragment>
      ))}
    </div>
  );
}
