import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { people, ME } from '../../data/people';
import { wp } from '../../data/waypoints';
import type { Destination } from '../../data/types';
import { current } from '../../lib/relations';
import { springs, useIsMobile, haptic } from '../../lib/motion';
import { Avatar } from '../ui';
import './confluence.css';

/*
  Route Confluence — every route people really took into a destination,
  running as parallel lines into one terminus. Where routes share a station,
  it becomes an interchange. If you're standing on one, you'll see yourself there.
*/

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

export function Confluence({ dest, selected, onSelect }: { dest: Destination; selected: string | null; onSelect: (id: string) => void }) {
  const isMobile = useIsMobile();
  const [ref, W] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<string | null>(null);
  const routes = dest.routes;
  const n = routes.length;
  const D = Math.max(...routes.map((r) => r.via.length));
  const myWp = current(people[ME]).wp;

  const padL = isMobile ? 4 : 8;
  const destX = W - (isMobile ? 12 : 28);
  const colW = isMobile ? (destX - 150) / D : Math.min(380, (destX - 250) / (D + 0.25));
  const xAt = (depth: number) => destX - depth * colW;
  const top = isMobile ? 70 : 76;
  const gap = isMobile ? 62 : 70;
  const yAt = (i: number) => top + i * gap;
  const H = top + (n - 1) * gap + (isMobile ? 46 : 40);

  // Interchanges: consecutive lanes sharing the same waypoint at the same depth.
  type Cap = { wp: string; depth: number; from: number; to: number };
  const caps: Cap[] = [];
  for (let d = 1; d <= D; d++) {
    let run: Cap | null = null;
    routes.forEach((r, i) => {
      const w = r.via[r.via.length - d];
      if (w && run && run.wp === w && run.to === i - 1) run.to = i;
      else {
        if (run && run.to > run.from) caps.push(run);
        run = w ? { wp: w, depth: d, from: i, to: i } : null;
      }
    });
    if (run && (run as Cap).to > (run as Cap).from) caps.push(run);
  }
  const inCap = (i: number, d: number) => caps.find((c) => c.depth === d && i >= c.from && i <= c.to);

  const active = hover;
  const ready = W > 0;

  return (
    <div className="confluence" ref={ref} style={{ height: H }}>
      {ready && (
        <svg width={W} height={H} className="confluence__svg" aria-hidden="true">
          <defs>
            <linearGradient id="cf-fade" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="currentColor" stopOpacity="0" />
              <stop offset="1" stopColor="currentColor" stopOpacity="1" />
            </linearGradient>
          </defs>

          {routes.map((r, i) => {
            const y = yAt(i);
            const on = !active || active === r.id;
            const isSel = selected === r.id;
            const firstX = xAt(r.via.length);
            const color = isSel ? 'var(--tint)' : 'var(--ink)';
            return (
              <g
                key={r.id}
                className={`confluence__lane ${on ? '' : 'is-dim'}`}
                style={{ color }}
                onPointerEnter={() => !isMobile && setHover(r.id)}
                onPointerLeave={() => setHover(null)}
                onClick={() => {
                  haptic(6);
                  onSelect(r.id);
                }}
              >
                <rect x={0} y={y - gap / 2} width={W} height={gap} fill="transparent" />
                <motion.line
                  x1={padL}
                  y1={y}
                  x2={firstX}
                  y2={y}
                  stroke="url(#cf-fade)"
                  strokeWidth={isSel ? 4.5 : 3.5}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4, delay: 0.05 * i }}
                />
                <motion.line
                  x1={firstX}
                  y1={y}
                  x2={destX}
                  y2={y}
                  stroke={color}
                  strokeWidth={isSel ? 4.5 : 3.5}
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.7, delay: 0.25 + 0.07 * i, ease: [0.45, 0, 0.2, 1] }}
                />
                {r.via.map((w, k) => {
                  const d = r.via.length - k;
                  if (inCap(i, d)) return null;
                  const x = xAt(d);
                  return (
                    <motion.circle
                      key={w}
                      cx={x}
                      cy={y}
                      r={7}
                      fill={color}
                      stroke="var(--bg-grouped)"
                      strokeWidth={3}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ ...springs.settle, delay: 0.45 + 0.07 * i + 0.1 * k }}
                    />
                  );
                })}
                <text x={padL} y={isMobile ? y + 20 : y - 14} className={`confluence__route ${isSel ? 'is-sel' : ''}`}>
                  {r.label}
                  {!isMobile && <tspan className="confluence__count"> · {r.people}</tspan>}
                </text>
                {r.via.map((w, k) => {
                  const d = r.via.length - k;
                  if (inCap(i, d)) return null;
                  return (
                    <text key={`t-${w}`} x={xAt(d)} y={y - 15} textAnchor="middle" className="confluence__stop">
                      {wp(w).short}
                    </text>
                  );
                })}
              </g>
            );
          })}

          {caps.map((c) => {
            const x = xAt(c.depth);
            const y1 = yAt(c.from);
            const y2 = yAt(c.to);
            const mine = c.wp === myWp;
            return (
              <g key={`${c.wp}-${c.depth}`}>
                <motion.rect
                  x={x - 10}
                  y={y1 - 10}
                  width={20}
                  height={y2 - y1 + 20}
                  rx={10}
                  fill="var(--bg)"
                  stroke="var(--ink)"
                  strokeWidth={3}
                  initial={{ opacity: 0, scaleY: 0.3 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  transition={{ ...springs.settle, delay: 0.5 }}
                  style={{ transformOrigin: `${x}px ${y1}px` }}
                />
                {!mine && (
                  <text x={x} y={y1 - 22} textAnchor="middle" className="confluence__stop is-cap">
                    {wp(c.wp).short}
                  </text>
                )}
              </g>
            );
          })}

          <motion.rect
            x={destX - 9}
            y={yAt(0) - 16}
            width={18}
            height={(n - 1) * gap + 32}
            rx={9}
            fill="var(--bg)"
            stroke="var(--tint)"
            strokeWidth={3.5}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.3 }}
          />
        </svg>
      )}

      {/* People riding the routes */}
      {ready &&
        routes.map((r, i) => {
          const y = yAt(i);
          const riders = r.onRoute.slice(0, 3);
          const arrived = r.travellers.slice(0, isMobile ? 2 : 3);
          const stationX = xAt(1);
          return (
            <div key={r.id} className={`confluence__people ${!active || active === r.id ? '' : 'is-dim'}`}>
              {riders.map((id, k) => (
                <motion.span
                  key={id}
                  className="confluence__rider"
                  style={{ left: stationX + 16 + k * 16, top: y }}
                  initial={{ opacity: 0, scale: 0.4, x: -20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ ...springs.settle, delay: 1.1 + i * 0.08 + k * 0.05 }}
                >
                  <Avatar id={id} size={isMobile ? 22 : 26} />
                </motion.span>
              ))}
              {arrived.map((id, k) => (
                <motion.span
                  key={id}
                  className="confluence__rider is-arrived"
                  style={{ left: destX - 26 - k * 16, top: y }}
                  initial={{ opacity: 0, scale: 0.4, x: -30 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ ...springs.settle, delay: 1.3 + i * 0.08 + k * 0.05 }}
                >
                  <Avatar id={id} size={isMobile ? 22 : 26} />
                </motion.span>
              ))}
            </div>
          );
        })}

      {ready &&
        caps
          .filter((c) => c.wp === myWp)
          .map((c) => (
            <motion.div
              key="me"
              className="confluence__me"
              style={{ left: xAt(c.depth), top: yAt(c.from) - 58 }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.settle, delay: 1.4 }}
            >
              <span className="t-caption1">You · {wp(c.wp).short}</span>
              <img src={people[ME].photo} alt="" />
            </motion.div>
          ))}
    </div>
  );
}
