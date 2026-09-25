import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useFlight } from '../lib/flight';
import './flight.css';

/*
  Carries a portrait from the card you tapped to the "now" station on that person's Path. The target is read
  every frame, so the portrait lands true even while the new screen is still settling into place. It lifts
  before it leaves, travels on a shallow arc, and hands over to the station, which answers with one ripple.
*/

const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);
const px = (radius: string, width: number) => (radius.trim().endsWith('%') ? (parseFloat(radius) / 100) * width : parseFloat(radius) || width / 2);

export function FlightLayer() {
  const flight = useFlight((s) => s.flight);
  const land = useFlight((s) => s.land);
  const clear = useFlight((s) => s.clear);
  const node = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = node.current;
    if (!flight || !el) return;
    const from = flight.from;
    const fromR = px(from.radius, from.width);
    const t0 = performance.now();
    let start = 0;
    let duration = 520;
    let lift = 0;
    let target: HTMLElement | null = null;
    let raf = 0;
    let done: ReturnType<typeof setTimeout> | undefined;

    const place = (x: number, y: number, w: number, h: number, r: number, arc: number) => {
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      el.style.borderRadius = `${r}px`;
      el.style.setProperty('--arc', String(arc));
    };
    place(from.left, from.top, from.width, from.height, fromR, 0);

    const giveUp = () => {
      el.dataset.state = 'lost';
      done = setTimeout(clear, 200);
    };

    const step = (now: number) => {
      if (!target) {
        target = document.querySelector<HTMLElement>(`[data-flight-target="${CSS.escape(flight.id)}"]`);
        if (!target) {
          if (now - t0 > 500) return giveUp();
          raf = requestAnimationFrame(step);
          return;
        }
        const r = target.getBoundingClientRect();
        const dist = Math.hypot(r.left - from.left, r.top - from.top);
        duration = Math.min(680, 420 + dist * 0.22);
        lift = Math.min(56, dist * 0.12);
        start = now;
        el.dataset.state = 'flying';
      }
      const t = Math.min(1, (now - start) / duration);
      const e = easeOut(t);
      const r = target.getBoundingClientRect();
      const arc = Math.sin(Math.PI * e);
      place(
        from.left + (r.left - from.left) * e,
        from.top + (r.top - from.top) * e - arc * lift,
        from.width + (r.width - from.width) * e,
        from.height + (r.height - from.height) * e,
        fromR + (r.width / 2 - fromR) * e,
        arc,
      );
      if (t < 1) {
        raf = requestAnimationFrame(step);
        return;
      }
      land();
      el.dataset.state = 'landed';
      done = setTimeout(clear, 180);
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(done);
    };
  }, [flight, land, clear]);

  if (!flight) return null;
  return createPortal(
    <div ref={node} key={flight.key} className="flight" data-state="waiting" aria-hidden="true">
      <img src={flight.src} alt="" draggable={false} />
    </div>,
    document.body,
  );
}
