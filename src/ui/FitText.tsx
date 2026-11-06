import { useLayoutEffect, useRef, type InputHTMLAttributes } from 'react';

// Names and labels always fit their box (teacher, 2026-11-06): the text
// shrinks a step at a time until it fits, down to a readable floor.
function fit(el: HTMLElement, max: number, min: number) {
  let size = max;
  el.style.fontSize = `${size}px`;
  while (size > min && el.scrollWidth > el.clientWidth + 1) { size -= 1; el.style.fontSize = `${size}px`; }
}

function useFit<T extends HTMLElement>(text: string, max: number, min: number) {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const run = () => fit(el, max, min);
    run();
    const ro = new ResizeObserver(run);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, max, min]);
  return ref;
}

export function FitText({ text, max = 16, min = 10, className = '' }: { text: string; max?: number; min?: number; className?: string }) {
  const ref = useFit<HTMLSpanElement>(text, max, min);
  return <span ref={ref} className={`block min-w-0 whitespace-nowrap overflow-hidden text-ellipsis ${className}`}>{text}</span>;
}

export function FitInput({ max = 16, min = 10, ...props }: InputHTMLAttributes<HTMLInputElement> & { value: string; max?: number; min?: number }) {
  const ref = useFit<HTMLInputElement>(props.value, max, min);
  return <input ref={ref} {...props} />;
}
