import { useEffect, useState } from 'react';

/*
  Springs expressed the way SwiftUI describes them (response / damping fraction),
  converted to stiffness/damping so motion matches iOS system animations.
*/
function spring(response: number, dampingFraction: number, mass = 1) {
  const stiffness = Math.pow((2 * Math.PI) / response, 2) * mass;
  const damping = (4 * Math.PI * dampingFraction * mass) / response;
  return { type: 'spring' as const, stiffness, damping, mass };
}

/** Medium's drawer curve: a fast start and a long, soft landing (cubic-bezier(.23, 1, .32, 1), 0.6s). */
export const easings = {
  drawer: { type: 'tween' as const, duration: 0.6, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] },
};

export const springs = {
  /** iOS default: response 0.55, damping 0.825 */
  smooth: spring(0.55, 0.9),
  /** Buttons, toggles, selection indicators */
  snappy: spring(0.32, 0.86),
  /** Things that land and settle: path stations, avatars appearing along a route */
  settle: spring(0.6, 0.72),
  /** Sheets and large surfaces */
  sheet: spring(0.42, 0.92),
  /** Press feedback */
  press: spring(0.16, 0.9),
};

export const ease = {
  out: [0.22, 1, 0.36, 1] as [number, number, number, number],
  inOut: [0.65, 0, 0.35, 1] as [number, number, number, number],
};

export function useMediaQuery(query: string): boolean {
  const get = () => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatches(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return matches;
}

export const useIsMobile = () => useMediaQuery('(max-width: 767px)');
export const useIsWide = () => useMediaQuery('(min-width: 1100px)');

/** A light tap where the platform supports it. iOS Safari ignores this gracefully. */
export function haptic(pattern: number | number[] = 8) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* ignore */
  }
}

/**
 * Which way the reader is scrolling. Reading chrome hides on the way down and returns
 * on the first flick up, and always shows near the top and the end of the page.
 */
export function useScrollDirection(threshold = 6): 'up' | 'down' {
  const [dir, setDir] = useState<'up' | 'down'>('up');
  useEffect(() => {
    let last = window.scrollY;
    const on = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < threshold) return;
      const edge = y < 80 || y + window.innerHeight > document.documentElement.scrollHeight - 120;
      setDir(edge || y < last ? 'up' : 'down');
      last = y;
    };
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, [threshold]);
  return dir;
}
