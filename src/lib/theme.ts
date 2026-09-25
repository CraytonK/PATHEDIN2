import { flushSync } from 'react-dom';
import { useApp, type Theme } from './store';

/*
  Switching appearance reveals the new theme in a circle that opens from where you switched, so the change
  has a source instead of a flash. Uses the View Transitions API; without it, or with Reduce Motion, the
  switch is immediate.
*/

type VTDocument = Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };

export function switchTheme(next: Theme, origin?: { clientX: number; clientY: number } | Element | null) {
  const setTheme = useApp.getState().setTheme;
  const doc = document as VTDocument;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!doc.startViewTransition || reduced) {
    setTheme(next);
    return;
  }
  let x = window.innerWidth / 2;
  let y = 0;
  if (origin && 'clientX' in origin && (origin.clientX || origin.clientY)) {
    x = origin.clientX;
    y = origin.clientY;
  } else if (origin instanceof Element) {
    const r = origin.getBoundingClientRect();
    x = r.left + r.width / 2;
    y = r.top + r.height / 2;
  }
  const root = document.documentElement;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  root.style.setProperty('--vt-x', `${x}px`);
  root.style.setProperty('--vt-y', `${y}px`);
  root.style.setProperty('--vt-r', `${radius}px`);
  root.dataset.vt = 'theme';
  const t = doc.startViewTransition(() => {
    flushSync(() => setTheme(next));
    if (next === 'system') delete root.dataset.theme;
    else root.dataset.theme = next;
  });
  t.finished.finally(() => delete root.dataset.vt);
}
