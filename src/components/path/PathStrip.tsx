import { motion } from 'framer-motion';
import { people, ME } from '../../data/people';
import { wp } from '../../data/waypoints';
import { compactSteps, primaryDestination, walked } from '../../lib/relations';
import { springs } from '../../lib/motion';
import type { Step } from '../../data/types';
import './path.css';

/*
  The compact, typographic form of a Path — reads like a sentence:
  BSc Chem — Research — MSc Chem ┈ ? ┈ Pharma R&D
  Steps you share with the viewer are inked in the tint, so overlap is visible everywhere.
*/

interface Props {
  id: string;
  highlight?: 'shared' | 'none' | [string, string];
  future?: boolean;
  animate?: boolean;
  wrap?: boolean;
  size?: 'sm' | 'md';
  unknownNext?: boolean; // show a "?" between present and destination
  long?: boolean; // use full labels
  className?: string;
}

export function PathStrip({
  id,
  highlight = 'shared',
  future = true,
  animate = false,
  wrap = false,
  size = 'sm',
  unknownNext,
  long = false,
  className = '',
}: Props) {
  const p = people[id];
  if (!p) return null;
  const steps: Step[] = compactSteps(p.path);
  const dest = primaryDestination(p);
  const items: (Step & { unknown?: boolean })[] = [...steps];
  const showUnknown = unknownNext ?? (id === ME);
  if (future && dest && !steps.some((s) => s.wp === dest)) {
    if (showUnknown) items.push({ wp: 'unknown', status: 'future', unknown: true });
    items.push({ wp: dest, status: 'future' });
  }

  const mine = new Set(walked(people[ME]));
  const myDest = new Set(people[ME].futures.map((f) => f.destination));
  const inSegment = (w: string, i: number) => {
    if (!Array.isArray(highlight)) return false;
    const a = items.findIndex((s) => s.wp === highlight[0]);
    const b = items.findIndex((s) => s.wp === highlight[1]);
    return a >= 0 && b >= 0 && i >= a && i <= b && !!w;
  };
  const isLit = (s: Step, i: number) => {
    if (highlight === 'none') return false;
    if (Array.isArray(highlight)) return inSegment(s.wp, i);
    if (id === ME) return s.status !== 'future';
    return mine.has(s.wp) || (myDest.has(s.wp) && s.status !== 'future');
  };

  return (
    <ol className={`strip strip--${size} ${wrap ? 'strip--wrap' : ''} ${className}`} aria-label={`${p.first}’s Path`}>
      {items.map((s, i) => {
        const lit = isLit(s, i);
        const prevLit = i > 0 && isLit(items[i - 1], i - 1);
        const w = wp(s.wp);
        const label = s.unknown ? '?' : long ? (w.mid ?? w.label) : w.short;
        return (
          <li key={`${s.wp}-${i}`} className={`strip__item is-${s.status} ${lit ? 'is-lit' : ''} ${s.unknown ? 'is-unknown' : ''}`}>
            {i > 0 && (
              <motion.span
                className={`strip__link ${s.status === 'future' ? 'is-future' : ''} ${lit && prevLit ? 'is-lit' : ''}`}
                initial={animate ? { scaleX: 0 } : false}
                animate={{ scaleX: 1 }}
                transition={{ delay: animate ? 0.08 + i * 0.09 : 0, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
            <motion.span
              className="strip__dot"
              initial={animate ? { scale: 0 } : false}
              animate={{ scale: 1 }}
              transition={{ ...springs.settle, delay: animate ? 0.12 + i * 0.09 : 0 }}
            />
            <span className="strip__label">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
