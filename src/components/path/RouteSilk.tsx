import { motion, useReducedMotion } from 'framer-motion';
import { useId, useMemo } from 'react';
import './silk.css';

/*
  The light on an immersive panel: many routes flowing toward one destination, like the silk in the reference
  but drawn from what PathedIn is about. One of them is yours, brighter than the rest. They draw themselves
  in once when the panel arrives, and then hold still.
*/

/** One route of the silk: the i-th of n curves, all flowing toward the same destination on the right. */
export function silkPath(i: number, n: number) {
  const t = i / (n - 1);
  const y0 = 90 + t * 620;
  const c1x = 240 + t * 120;
  const c1y = y0 - 70 - t * 90;
  const c2x = 640 - t * 160;
  const c2y = 150 + t * 250;
  const y3 = 120 + t * 90;
  return `M -60 ${y0.toFixed(1)} C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, 1060 ${y3.toFixed(1)}`;
}

export function RouteSilk({ lines = 26, className = '', delay = 0 }: { lines?: number; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  const id = useId().replace(/:/g, '');
  const paths = useMemo(() => Array.from({ length: lines }, (_, i) => silkPath(i, lines)), [lines]);
  const yours = Math.round(lines * 0.62);
  return (
    <svg className={`silk ${className}`} viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`silk-${id}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#8fa8ff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#8fa8ff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#fff7ed" stopOpacity="0.28" />
        </linearGradient>
        <linearGradient id={`silk-you-${id}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#8fa8ff" stopOpacity="0" />
          <stop offset="0.45" stopColor="#8fa8ff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff7ed" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      {paths.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          fill="none"
          stroke={`url(#${i === yours ? `silk-you-${id}` : `silk-${id}`})`}
          strokeWidth={i === yours ? 1.8 : i % 4 === 0 ? 1.1 : 0.7}
          strokeLinecap="round"
          initial={reduce ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: i === yours ? 1.8 : 1.4, delay: delay + (i === yours ? 0.5 : i * 0.03), ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </svg>
  );
}
