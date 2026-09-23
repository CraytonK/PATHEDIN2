import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { me } from '../data/people';
import { wp } from '../data/waypoints';
import { current, primaryDestination, walked } from '../lib/relations';
import './splash.css';

/** Reveals `text` one character at a time from `start` ms, like someone typing it. */
function useTyped(text: string, start: number, perChar: number, skip: boolean) {
  const [n, setN] = useState(skip ? text.length : 0);
  useEffect(() => {
    if (skip) {
      setN(text.length);
      return;
    }
    let i = 0;
    let tick: ReturnType<typeof setTimeout>;
    const step = () => {
      i += 1;
      setN(i);
      if (i < text.length) tick = setTimeout(step, perChar);
    };
    tick = setTimeout(step, start);
    return () => clearTimeout(tick);
  }, [text, start, perChar, skip]);
  return { shown: text.slice(0, n), typing: n > 0 && n < text.length, done: n >= text.length, started: n > 0 };
}

function Typed({ text, start, perChar = 30, skip, className }: { text: string; start: number; perChar?: number; skip: boolean; className?: string }) {
  const t = useTyped(text, start, perChar, skip);
  return (
    <span className={className} aria-hidden="true">
      {t.shown}
      {t.started && !t.done && <span className="splash__caret" />}
    </span>
  );
}

/* Stage geometry: the brand's three nodes on a 45° rise, bottom-left to top-right. */
const N1 = { x: 56, y: 292 };
const N2 = { x: 176, y: 172 };
const N3 = { x: 296, y: 52 };

/**
 * After signing in, your Path draws itself — the way a writing app types its first line.
 * Where you've been, where you are, where you're going, then a welcome.
 */
export function PathSplash({ onCovered, onDone }: { onCovered: () => void; onDone: () => void }) {
  const reduce = !!useReducedMotion();
  const [leaving, setLeaving] = useState(false);
  const steps = walked(me);
  const been = wp(steps[0]).label;
  const now = wp(current(me).wp).label;
  const going = wp(primaryDestination(me) ?? steps[steps.length - 1]);
  const goingLabel = going.mid ?? going.label;
  const welcome = `Welcome, ${me.first}.`;
  const total = reduce ? 900 : 3300;

  useEffect(() => {
    // The page underneath switches to the app as soon as the splash covers it.
    const c = setTimeout(onCovered, 60);
    const l = setTimeout(() => setLeaving(true), total);
    return () => {
      clearTimeout(c);
      clearTimeout(l);
    };
  }, [onCovered, total]);

  const pop = (delay: number) => ({
    initial: reduce ? false : ({ scale: 0, opacity: 0 } as const),
    animate: { scale: 1, opacity: 1 },
    transition: { type: 'spring' as const, stiffness: 520, damping: 26, delay: delay / 1000 },
  });
  const draw = (delay: number, ms: number) => ({
    initial: reduce ? false : ({ pathLength: 0 } as const),
    animate: { pathLength: 1 },
    transition: { duration: ms / 1000, delay: delay / 1000, ease: [0.45, 0, 0.2, 1] as const },
  });

  return createPortal(
    <motion.div
      className="splash"
      role="status"
      aria-live="polite"
      aria-label={`Drawing your Path: ${been}, ${now}, ${goingLabel}. ${welcome}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: leaving ? 0.45 : 0.2 }}
      onAnimationComplete={() => leaving && onDone()}
      onClick={() => setLeaving(true)}
    >
      <button className="splash__skip" onClick={() => setLeaving(true)}>
        Skip
      </button>
      <div className="splash__stage">
        <svg className="splash__svg" viewBox="0 0 560 340" aria-hidden="true">
          <defs>
            <mask id="splash-future" maskUnits="userSpaceOnUse">
              <motion.line x1={N2.x} y1={N2.y} x2={N3.x} y2={N3.y} stroke="#fff" strokeWidth="14" strokeLinecap="round" {...draw(1180, 380)} />
            </mask>
          </defs>
          <motion.line x1={N1.x} y1={N1.y} x2={N2.x} y2={N2.y} stroke="var(--ink)" strokeWidth="7" strokeLinecap="round" {...draw(460, 380)} />
          <line x1={N2.x} y1={N2.y} x2={N3.x} y2={N3.y} stroke="var(--tint)" strokeWidth="7" strokeLinecap="round" strokeDasharray="7 12" mask="url(#splash-future)" />
          <motion.circle cx={N1.x} cy={N1.y} r="13" fill="var(--ink)" style={{ transformOrigin: `${N1.x}px ${N1.y}px` }} {...pop(80)} />
          <motion.g style={{ transformOrigin: `${N2.x}px ${N2.y}px` }} {...pop(820)}>
            <circle cx={N2.x} cy={N2.y} r="14" fill="var(--bg-intro)" stroke="var(--ink)" strokeWidth="5.5" />
            <circle cx={N2.x} cy={N2.y} r="5" fill="var(--tint)" />
          </motion.g>
          <motion.circle cx={N3.x} cy={N3.y} r="14" fill="var(--bg-intro)" stroke="var(--tint)" strokeWidth="5.5" style={{ transformOrigin: `${N3.x}px ${N3.y}px` }} {...pop(1540)} />
        </svg>
        <div className="splash__label" style={{ left: `${((N1.x + 30) / 560) * 100}%`, top: `${(N1.y / 340) * 100}%` }}>
          <Typed text={been} start={160} skip={reduce} className="splash__text" />
        </div>
        <div className="splash__label" style={{ left: `${((N2.x + 30) / 560) * 100}%`, top: `${(N2.y / 340) * 100}%` }}>
          <Typed text={now} start={900} skip={reduce} className="splash__text splash__text--now" />
          <motion.span className="splash__here" initial={reduce ? false : { opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}>
            You are here
          </motion.span>
        </div>
        <div className="splash__label" style={{ left: `${((N3.x + 30) / 560) * 100}%`, top: `${(N3.y / 340) * 100}%` }}>
          <Typed text={goingLabel} start={1620} perChar={28} skip={reduce} className="splash__text splash__text--going" />
        </div>
      </div>
      <Typed text={welcome} start={2180} perChar={42} skip={reduce} className="splash__welcome" />
    </motion.div>,
    document.body,
  );
}
