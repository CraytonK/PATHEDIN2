import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useId, useLayoutEffect, useRef, useState, type MouseEvent as RMouseEvent, type PointerEvent as RPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { people, ME } from '../../data/people';
import { wp } from '../../data/waypoints';
import type { Step } from '../../data/types';
import { compactSteps, primaryDestination, stepTitle, walked, yearsLabel } from '../../lib/relations';
import { springs } from '../../lib/motion';
import { useApp } from '../../lib/store';
import { useUI } from '../../lib/ui';
import { IconAlign, IconChevronRight, IconPath } from '../icons';
import './pathhint.css';

/*
  PathHint: a person's Path in one quiet line ("MSc Chem → Pharma R&D").
  Hover it, tap it or press Enter, and the whole Path opens beside it, drawn top to bottom.
  Feeds stay calm, and the full Path is always one gesture away.
*/

type Segment = [string, string];

const HOVER_OPEN_MS = 260;
const HOVER_CLOSE_MS = 160;

/** Only one Path card is open at a time. */
let closeOpenCard: (() => void) | null = null;

/** The two ends of the line: where they are now and where they're heading (or where they came from). */
function ends(id: string): string[] {
  const p = people[id];
  const steps = compactSteps(p.path);
  const nowIdx = Math.max(0, steps.findIndex((s) => s.status === 'present'));
  const now = steps[nowIdx] ?? steps[steps.length - 1];
  const dest = primaryDestination(p);
  if (dest && !steps.some((s) => s.wp === dest)) return [wp(now.wp).short, wp(dest).short];
  const prev = steps[nowIdx - 1];
  return prev ? [wp(prev.wp).short, wp(now.wp).short] : [wp(now.wp).short];
}

interface Props {
  id: string;
  /** Light up one stretch in the card, e.g. the step a question or request is about. */
  segment?: Segment;
  /** Render the line only, with no card, for use inside links. */
  plain?: boolean;
  /** Show a one-time coachmark under this hint, keyed by this id. */
  coach?: string;
  className?: string;
}

export function PathHint({ id, segment, plain, coach, className = '' }: Props) {
  const p = people[id];
  const [mode, setMode] = useState<null | 'hover' | 'pinned'>(null);
  const tipSeen = useApp((s) => (coach ? !!s.tips[coach] : true));
  const dismissTip = useApp((s) => s.dismissTip);
  const trigger = useRef<HTMLButtonElement>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const focusCard = useRef(false);
  const cardId = useId();
  if (!p) return null;

  const parts = ends(id);
  const line = (
    <>
      <IconPath size={14} strokeWidth={1.9} />
      <span className="phint__text">
        {parts.map((t, i) => (
          <span key={i}>
            {i > 0 && <span className="phint__arrow"> → </span>}
            <span className={i === parts.length - 1 ? 'phint__to' : 'phint__from'}>{t}</span>
          </span>
        ))}
      </span>
    </>
  );
  if (plain) return <span className={`phint phint--plain ${className}`}>{line}</span>;

  const clearTimers = () => {
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);
  };
  const close = () => {
    clearTimers();
    setMode(null);
  };
  const open = (m: 'hover' | 'pinned') => {
    clearTimers();
    if (coach && !tipSeen) dismissTip(coach);
    if (closeOpenCard && closeOpenCard !== close) closeOpenCard();
    closeOpenCard = close;
    setMode(m);
  };

  const onPointerEnter = (e: RPointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    clearTimeout(closeTimer.current);
    if (!mode) openTimer.current = setTimeout(() => open('hover'), HOVER_OPEN_MS);
  };
  const onPointerLeave = (e: RPointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    clearTimeout(openTimer.current);
    if (mode === 'hover') closeTimer.current = setTimeout(close, HOVER_CLOSE_MS);
  };
  const onClick = (e: RMouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // A click while hovering keeps the card open; a second click puts it away.
    if (mode === 'pinned') return close();
    focusCard.current = e.detail === 0;
    open('pinned');
  };

  const showCoach = !!coach && !tipSeen;
  const hint = (
    <button
      ref={trigger}
      type="button"
      className={`phint ${mode ? 'is-open' : ''} ${className}`}
      aria-expanded={!!mode}
      aria-controls={mode ? cardId : undefined}
      aria-label={`${parts.join(' to ')}. Show ${id === ME ? 'your' : `${p.first}’s`} whole Path`}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onClick={onClick}
    >
      {line}
    </button>
  );
  return (
    <>
      {showCoach ? (
        // A one-time coachmark hangs just under the line it explains.
        <span className="phint-anchor">
          {hint}
          <span className="phint-coach" role="note">
            {window.matchMedia('(hover: hover)').matches ? 'Hover over a Path to see the whole journey.' : 'Tap a Path to see the whole journey.'}
            <button type="button" onClick={() => dismissTip(coach!)}>
              Okay, got it.
            </button>
          </span>
        </span>
      ) : (
        hint
      )}
      {createPortal(
        <AnimatePresence>
          {mode && (
            <PathCard
              key="card"
              domId={cardId}
              id={id}
              segment={segment}
              anchor={trigger}
              pinned={mode === 'pinned'}
              focus={focusCard}
              onClose={(refocus) => {
                close();
                if (refocus) trigger.current?.focus();
              }}
              onEnter={() => clearTimeout(closeTimer.current)}
              onLeave={() => {
                if (mode === 'hover') closeTimer.current = setTimeout(close, HOVER_CLOSE_MS);
              }}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

interface CardProps {
  domId: string;
  id: string;
  segment?: Segment;
  anchor: React.RefObject<HTMLButtonElement | null>;
  pinned: boolean;
  focus: React.MutableRefObject<boolean>;
  onClose: (refocus?: boolean) => void;
  onEnter: () => void;
  onLeave: () => void;
}

function PathCard({ domId, id, segment, anchor, pinned, focus, onClose, onEnter, onLeave }: CardProps) {
  const p = people[id];
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; below: boolean }>(() => place(anchor.current, 320));
  const navigate = useNavigate();
  const openCompare = useUI((s) => s.openCompare);

  // Measure the card, then settle it below the line, or above it when there isn't room.
  useLayoutEffect(() => {
    if (ref.current) setPos(place(anchor.current, ref.current.offsetHeight));
  }, [anchor]);

  useEffect(() => {
    if (focus.current) {
      ref.current?.focus();
      focus.current = false;
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose(true);
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!ref.current?.contains(t) && !anchor.current?.contains(t)) onClose();
    };
    const onScroll = () => onClose();
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    // Capture, so scrolling inside a drawer or sheet closes it too.
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onScroll);
    };
  }, [anchor, focus, onClose]);

  const steps: (Step & { dest?: boolean })[] = compactSteps(p.path);
  const dest = primaryDestination(p);
  if (dest && !steps.some((s) => s.wp === dest)) steps.push({ wp: dest, status: 'future', dest: true });
  const mine = new Set(id === ME ? [] : walked(people[ME]));
  const a = segment ? steps.findIndex((s) => s.wp === segment[0]) : -1;
  const b = segment ? steps.findIndex((s) => s.wp === segment[1]) : -1;
  const lit = (i: number) => a >= 0 && b >= 0 && i >= a && i <= b;
  const shared = steps.filter((s) => s.status !== 'future' && mine.has(s.wp)).length;

  return (
    <motion.div
      ref={ref}
      id={domId}
      className={`pcard ${pinned ? 'is-pinned' : ''}`}
      style={{ top: pos.top, left: pos.left, width: pos.width, transformOrigin: pos.below ? 'top left' : 'bottom left' }}
      role="dialog"
      aria-label={id === ME ? 'Your Path' : `${p.first}’s Path`}
      tabIndex={-1}
      initial={{ opacity: 0, y: pos.below ? -4 : 4, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }}
      transition={springs.snappy}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="pcard__head">
        <span className="pcard__title">{id === ME ? 'Your Path' : `${p.first}’s Path`}</span>
        {shared > 0 && (
          <span className="pcard__shared">
            {shared} {shared === 1 ? 'step' : 'steps'} like yours
          </span>
        )}
      </div>
      <ol className={`pcard__steps ${segment ? 'has-segment' : ''}`}>
        {steps.map((s, i) => {
          const w = wp(s.wp);
          const kind = s.status === 'present' ? 'present' : s.status === 'future' ? (s.dest || i === steps.length - 1 ? 'destination' : 'future') : 'past';
          const isShared = s.status !== 'future' && mine.has(s.wp);
          const years = s.status === 'future' ? '' : yearsLabel(s);
          return (
            <li
              key={`${s.wp}-${i}`}
              className={`pcard__step is-${kind} ${lit(i) ? 'is-lit' : ''} ${steps[i + 1]?.status === 'future' ? 'to-future' : ''} ${lit(i) && lit(i + 1) ? 'to-lit' : ''}`}
            >
              <span className="pcard__node" aria-hidden="true" />
              <span className="pcard__text">
                <span className="pcard__label">{s.status === 'future' ? (w.mid ?? w.label) : stepTitle(s)}</span>
                <span className="pcard__meta">
                  {s.status === 'future' ? (
                    kind === 'destination' ? 'Heading here' : 'Next'
                  ) : (
                    <>
                      {s.org}
                      {s.org && years && ' · '}
                      {years && <span className="nowrap">{years}</span>}
                    </>
                  )}
                </span>
              </span>
              {isShared && <span className="pcard__you">You too</span>}
            </li>
          );
        })}
      </ol>
      <div className="pcard__actions">
        {id !== ME && (
          <button
            type="button"
            className="pcard__btn"
            onClick={() => {
              onClose();
              openCompare(id);
            }}
          >
            <IconAlign size={16} /> Align Paths
          </button>
        )}
        <button
          type="button"
          className="pcard__btn pcard__btn--quiet"
          onClick={() => {
            onClose();
            navigate(id === ME ? '/path' : `/p/${id}`);
          }}
        >
          {id === ME ? 'Open My Path' : 'View profile'} <IconChevronRight size={14} />
        </button>
      </div>
    </motion.div>
  );
}

function place(el: HTMLElement | null, h: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(340, vw - 32);
  if (!el) return { top: 80, left: 16, width, below: true };
  const r = el.getBoundingClientRect();
  const below = r.bottom + 8 + h <= vh - 12 || r.top - 8 - h < 12;
  const top = below ? r.bottom + 8 : r.top - 8 - h;
  const left = Math.min(Math.max(16, r.left - 6), vw - width - 16);
  return { top, left, width, below };
}
