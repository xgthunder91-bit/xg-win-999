import React, { useEffect, useRef, useState } from 'react';

interface Props {
  value: number;
  duration?: number;
  format?: (n: number) => string;
}

/**
 * Smoothly animates a number from its previous value to the new one.
 * Keeps the admin dashboard feeling alive without any layout shift.
 */
export const CountUp: React.FC<Props> = ({ value, duration = 750, format }) => {
  const safe = Number(value) || 0;
  const [display, setDisplay] = useState(safe);
  const prevRef = useRef(safe);
  const rafRef = useRef(0);

  useEffect(() => {
    const from = prevRef.current;
    const to = safe;
    prevRef.current = to;

    if (from === to || typeof window === 'undefined') {
      setDisplay(to);
      return;
    }

    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
      else setDisplay(to);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [safe, duration]);

  return <>{format ? format(display) : Math.round(display).toLocaleString('en-IN')}</>;
};
