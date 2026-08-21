import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'motion/react';

// Scores used to just jump instantly on every drop -- no feedback that
// points were actually earned. A quick count-up tween gives that feedback
// without being distracting on repeat turns.
export default function ScoreCount({ value, className = '' }) {
  const reduce = useReducedMotion();
  const motionValue = useMotionValue(value);
  const rounded = useTransform(motionValue, (v) => Math.round(v));
  const prev = useRef(value);

  useEffect(() => {
    if (reduce) {
      motionValue.set(value);
      prev.current = value;
      return;
    }
    const controls = animate(motionValue, value, { duration: 0.5, ease: [0.16, 1, 0.3, 1] });
    prev.current = value;
    return () => controls.stop();
  }, [value, reduce, motionValue]);

  return <motion.span className={className}>{rounded}</motion.span>;
}
