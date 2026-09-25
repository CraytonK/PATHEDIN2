import { create } from 'zustand';

/*
  The portrait flight. When you open someone from a card, their photo lifts from where you tapped and lands on
  the "now" station of their Path on the profile, so you can see where they were placed. The profile's station
  waits, hidden, until the portrait arrives.
*/

export interface Flight {
  id: string;
  src: string;
  from: { top: number; left: number; width: number; height: number; radius: string };
  key: number;
}

interface FlightState {
  flight: Flight | null;
  /** The target has taken over from the travelling portrait. */
  landed: boolean;
  launch: (f: Omit<Flight, 'key'>) => void;
  land: () => void;
  clear: () => void;
}

export const useFlight = create<FlightState>()((set) => ({
  flight: null,
  landed: false,
  launch: (f) => set({ flight: { ...f, key: Date.now() }, landed: false }),
  land: () => set({ landed: true }),
  clear: () => set({ flight: null, landed: false }),
}));

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** The portrait for this person nearest to where you clicked: the element itself, then up to six ancestors. */
function portraitNear(id: string, from: Element): HTMLImageElement | null {
  const sel = `[data-portrait="${CSS.escape(id)}"] img, img[data-portrait="${CSS.escape(id)}"]`;
  let node: Element | null = from;
  for (let i = 0; node && i < 7; i++, node = node.parentElement) {
    if (node.matches?.(sel)) return node as HTMLImageElement;
    const hit = node.querySelector<HTMLImageElement>(sel);
    if (hit) return hit;
  }
  return null;
}

/**
 * Launch from the portrait nearest `from`. Call it in the click handler that opens the profile. Does nothing
 * when motion is reduced or no portrait of this person is on screen.
 */
export function flyFrom(id: string, from: Element | null | undefined) {
  if (!from || reduced()) return;
  const img = portraitNear(id, from);
  if (!img) return;
  const r = img.getBoundingClientRect();
  if (r.width < 8 || r.bottom < 0 || r.top > window.innerHeight) return;
  const radius = getComputedStyle(img).borderRadius || '50%';
  useFlight.getState().launch({ id, src: img.currentSrc || img.src, from: { top: r.top, left: r.left, width: r.width, height: r.height, radius } });
}

/**
 * Any plain click on a link to a profile launches the flight, so names, avatars and rows all do it without
 * each one opting in. Clicks on controls inside the link (a Path hint, a button) don't navigate, so they don't fly.
 */
export function installProfileFlights() {
  const onClick = (e: MouseEvent) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const target = e.target as Element | null;
    const link = target?.closest?.('a[href]');
    if (!link || target?.closest('button')) return;
    const m = link.getAttribute('href')?.match(/(?:^|[#/])p\/([a-z0-9-]+)\/?$/);
    if (m) flyFrom(m[1], link);
  };
  document.addEventListener('click', onClick, true);
  return () => document.removeEventListener('click', onClick, true);
}
