import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState, type PointerEvent as RPointerEvent, type MouseEvent as RMouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { people } from '../data/people';
import { current, relationTo, stepTitle } from '../lib/relations';
import { springs, haptic } from '../lib/motion';
import { useUI, scheduleClosePeek, cancelClosePeek } from '../lib/ui';
import { useApp } from '../lib/store';
import { PathStrip } from './path/PathStrip';
import { IconAlign, IconBookmark, IconMessage, IconSend, IconChevronRight } from './icons';
import { Avatar, PathChips, RelationTag } from './ui';
import { conversationList } from '../data/social';
import './peek.css';

/*
  Peek — preview anyone's Path without leaving where you are.
  Touch: press and hold (HIG context-menu preview). Pointer: hover intent, or secondary click.
*/

const LONG_PRESS_MS = 420;
const HOVER_MS = 520;

export function usePeek(id?: string) {
  const open = useUI((s) => s.openPeek);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const start = useRef<{ x: number; y: number } | null>(null);
  const suppress = useRef(false);

  const clear = () => {
    clearTimeout(timer.current);
    start.current = null;
  };

  const onPointerDown = useCallback(
    (e: RPointerEvent<HTMLElement>) => {
      if (!id || e.pointerType === 'mouse') return;
      start.current = { x: e.clientX, y: e.clientY };
      const el = e.currentTarget;
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        suppress.current = true;
        haptic(14);
        const r = el.getBoundingClientRect();
        open({ id, mode: 'touch', rect: { top: r.top, left: r.left, bottom: r.bottom, right: r.right, width: r.width, height: r.height } });
      }, LONG_PRESS_MS);
    },
    [id, open],
  );

  const onPointerMove = useCallback((e: RPointerEvent<HTMLElement>) => {
    if (!start.current) return;
    if (Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 10) clear();
  }, []);

  const onPointerEnter = useCallback(
    (e: RPointerEvent<HTMLElement>) => {
      if (!id || e.pointerType !== 'mouse') return;
      cancelClosePeek();
      const el = e.currentTarget;
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const r = el.getBoundingClientRect();
        open({ id, mode: 'hover', rect: { top: r.top, left: r.left, bottom: r.bottom, right: r.right, width: r.width, height: r.height } });
      }, HOVER_MS);
    },
    [id, open],
  );

  const onPointerLeave = useCallback((e: RPointerEvent<HTMLElement>) => {
    clear();
    if (e.pointerType === 'mouse') scheduleClosePeek();
  }, []);

  const onContextMenu = useCallback(
    (e: RMouseEvent<HTMLElement>) => {
      if (!id) return;
      e.preventDefault();
      const r = e.currentTarget.getBoundingClientRect();
      open({ id, mode: 'touch', rect: { top: r.top, left: r.left, bottom: r.bottom, right: r.right, width: r.width, height: r.height } });
    },
    [id, open],
  );

  const onClickCapture = useCallback((e: RMouseEvent<HTMLElement>) => {
    clear();
    if (suppress.current) {
      suppress.current = false;
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  if (!id) return {};
  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: clear,
    onPointerCancel: clear,
    onPointerEnter,
    onPointerLeave,
    onContextMenu,
    onClickCapture,
  };
}

function PeekBody({ id, onDone }: { id: string; onDone: () => void }) {
  const p = people[id];
  const rel = relationTo(id);
  const navigate = useNavigate();
  const now = current(p);
  return (
    <>
      <button
        className="peek__head"
        onClick={() => {
          onDone();
          navigate(`/p/${id}`);
        }}
      >
        <Avatar id={id} size={52} peek={false} className="peek__avatar" />
        <span className="peek__who">
          <span className="t-headline">{p.name}</span>
          <span className="t-footnote c-2 clamp-2">{p.headline}</span>
        </span>
        <IconChevronRight size={16} className="c-3" />
      </button>
      {rel.kind !== 'self' && <RelationTag kind={rel.kind} label={rel.label} className="peek__rel" />}
      {rel.kind !== 'self' && <p className="t-subhead peek__why">{rel.why}</p>}
      <PathChips id={id} className="peek__chips" />
      <div className="peek__path">
        <PathStrip id={id} animate wrap />
      </div>
      <p className="t-caption1 c-2 peek__now">
        Now · {stepTitle(now)}
        {now.org ? `, ${now.org}` : ''}
      </p>
    </>
  );
}

function Actions({ id, onDone, layout }: { id: string; onDone: () => void; layout: 'menu' | 'row' }) {
  const ui = useUI();
  const navigate = useNavigate();
  const saved = useApp((s) => !!s.saved[`person:${id}`]);
  const toggleSave = useApp((s) => s.toggleSave);
  const convo = conversationList.find((c) => c.with === id);
  const p = people[id];
  const items = [
    { key: 'align', label: 'Align Paths', icon: <IconAlign size={20} />, run: () => ui.openCompare(id) },
    { key: 'request', label: 'Send a Path Request', icon: <IconSend size={20} />, run: () => ui.openRequest(id) },
    {
      key: 'message',
      label: convo ? 'Message' : `Message ${p.first}`,
      icon: <IconMessage size={20} />,
      run: () => {
        onDone();
        navigate(convo ? `/messages/${convo.id}` : `/messages?to=${id}`);
      },
    },
    {
      key: 'save',
      label: saved ? 'Saved' : 'Save',
      icon: <IconBookmark size={20} filled={saved} />,
      run: () => {
        toggleSave(`person:${id}`);
        haptic(8);
      },
    },
  ];
  if (layout === 'row') {
    return (
      <div className="peek__row">
        {items.map((it) => (
          <button key={it.key} className={`peek__chip ${it.key === 'save' && saved ? 'is-on' : ''}`} onClick={it.run}>
            {it.icon}
            <span className="t-caption1">{it.key === 'request' ? 'Request' : it.key === 'align' ? 'Align' : it.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>
    );
  }
  return (
    <motion.ul
      className="peek__menu"
      initial={{ opacity: 0, scale: 0.92, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ ...springs.snappy, delay: 0.04 }}
    >
      {items.map((it) => (
        <li key={it.key}>
          <button className={`peek__menu-item ${it.key === 'save' && saved ? 'is-on' : ''}`} onClick={it.run}>
            <span className="t-body">{it.label}</span>
            {it.icon}
          </button>
        </li>
      ))}
    </motion.ul>
  );
}

export function PeekLayer() {
  const peek = useUI((s) => s.peek);
  const close = useUI((s) => s.closePeek);
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const on = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);

  useEffect(() => {
    if (!peek) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    const onScroll = () => peek.mode === 'hover' && close();
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll);
    };
  }, [peek, close]);

  let hoverPos: { top: number; left: number; origin: string } | null = null;
  if (peek?.mode === 'hover' && peek.rect) {
    const W = 340;
    const H = 300;
    const below = peek.rect.bottom + 10 + H < size.h;
    const left = Math.min(Math.max(12, peek.rect.left - 8), size.w - W - 12);
    hoverPos = { top: below ? peek.rect.bottom + 8 : Math.max(12, peek.rect.top - H - 8), left, origin: below ? 'top left' : 'bottom left' };
  }

  return createPortal(
    <AnimatePresence>
      {peek && peek.mode === 'touch' && (
        <motion.div
          key="peek-touch"
          className="peek-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={`Preview of ${people[peek.id]?.name}`}
        >
          <div className="peek-overlay__stack" onClick={(e) => e.stopPropagation()}>
            <motion.div
              className="peek peek--touch"
              initial={{ opacity: 0, scale: 0.86, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 6 }}
              transition={springs.settle}
            >
              <PeekBody id={peek.id} onDone={close} />
            </motion.div>
            <Actions id={peek.id} onDone={close} layout="menu" />
          </div>
        </motion.div>
      )}
      {peek && peek.mode === 'hover' && hoverPos && (
        <motion.div
          key={`peek-hover-${peek.id}`}
          className="peek peek--hover"
          style={{ top: hoverPos.top, left: hoverPos.left, transformOrigin: hoverPos.origin }}
          initial={{ opacity: 0, scale: 0.96, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }}
          transition={springs.snappy}
          onPointerEnter={cancelClosePeek}
          onPointerLeave={() => scheduleClosePeek(120)}
          role="dialog"
          aria-label={`Preview of ${people[peek.id]?.name}`}
        >
          <PeekBody id={peek.id} onDone={close} />
          <Actions id={peek.id} onDone={close} layout="row" />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
