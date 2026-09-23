import { AnimatePresence, animate, motion, useMotionValue, useTransform, useMotionValueEvent } from 'framer-motion';
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { people, ME } from '../../data/people';
import { wp } from '../../data/waypoints';
import { stories } from '../../data/stories';
import type { Step, FutureRoute } from '../../data/types';
import { compactSteps, current, peopleAt, peopleThrough, walked, yearsLabel, stepTitle } from '../../lib/relations';
import { springs, haptic, useIsMobile } from '../../lib/motion';
import { AvatarStack } from '../ui';
import './transit.css';

/*
  The Transit Map — PathedIn's signature view of a Path.
  Stations are steps. Walked track is solid Deep Slate Navy; the future is dashed Celestial Blue.
  An undecided next step is an interchange ("?") that opens into parallel routes,
  which run side by side and rejoin at the destination terminus.
*/

export type NodeKind = 'past' | 'present' | 'junction' | 'route' | 'destination' | 'explore';

export interface MapNode {
  key: string;
  kind: NodeKind;
  wp: string;
  lane: number;
  span?: [number, number];
  step?: Step;
  route?: FutureRoute;
  title: string;
  sub?: string;
  note?: string;
  origin?: string; // node this one grows out of when it appears
}

interface Edge {
  from: string;
  to: string;
  style: 'walked' | 'future' | 'explore';
  route?: string;
  fromLane?: number;
  toLane?: number;
}

interface Props {
  personId: string;
  interactive?: boolean; // futures, routes, walking (the viewer's own map)
  expanded?: boolean;
  onToggleExpanded?: () => void;
  selected?: string | null;
  onSelect?: (n: MapNode) => void;
  focusRoute?: string | null;
  onFocusRoute?: (id: string | null) => void;
  walkable?: boolean;
  onWalk?: (n: MapNode | null) => void;
  shareWith?: string; // highlight stations shared with this person (usually the viewer)
  highlight?: [string, string];
  showNotes?: boolean;
  showPeople?: boolean;
  renderExtra?: (n: MapNode) => ReactNode;
  extraRoutes?: FutureRoute[];
}

function buildMap(personId: string, interactive: boolean, expanded: boolean, extraRoutes: FutureRoute[] = []) {
  const p = people[personId];
  const steps = compactSteps(p.path);
  const nodes: MapNode[] = [];
  const edges: Edge[] = [];

  steps.forEach((s, i) => {
    const key = s.status === 'present' ? 'present' : `step-${i}`;
    nodes.push({
      key,
      kind: s.status === 'present' ? 'present' : 'past',
      wp: s.wp,
      lane: 0,
      step: s,
      title: stepTitle(s),
      sub: [s.org, yearsLabel(s)].filter(Boolean).join(' · '),
      note: s.note,
    });
    if (i > 0) edges.push({ from: nodes[i - 1].key, to: key, style: 'walked' });
  });

  const last = nodes[nodes.length - 1];
  const main = p.futures.find((f) => f.certainty === 'set') ?? p.futures.find((f) => f.certainty !== 'exploring');
  const explore = p.futures.filter((f) => f !== main && !walked(p).includes(f.destination));
  if (!main || walked(p).includes(main.destination)) {
    // Someone who has arrived: show where they're heading next, if anywhere.
    explore.forEach((f, i) => {
      const key = `explore-${f.destination}`;
      nodes.push({ key, kind: 'explore', wp: f.destination, lane: 0, title: wp(f.destination).label, sub: f.certainty === 'set' ? 'Heading here next' : 'Considering', origin: last.key });
      edges.push({ from: i === 0 ? last.key : nodes[nodes.length - 2].key, to: key, style: 'future' });
    });
    return { nodes, edges, lanes: 1 };
  }

  const routes = interactive ? [...(main.routes ?? []), ...extraRoutes] : [];
  const exploreLane = expanded && routes.length ? routes.length : 1;

  if (routes.length) {
    nodes.push({
      key: 'junction',
      kind: 'junction',
      wp: 'unknown',
      lane: 0,
      span: expanded ? [0, exploreLane - (explore.length ? 0 : 1)] : undefined,
      title: expanded ? 'Your next step is open' : 'What comes next?',
      sub: expanded ? `${routes.length} routes people like you took from here` : `${routes.length} routes people like you took · tap to open`,
      origin: last.key,
    });
    edges.push({ from: last.key, to: 'junction', style: 'future' });
    if (expanded) {
      routes.forEach((r, i) => {
        const key = `route-${r.id}`;
        nodes.push({
          key,
          kind: 'route',
          wp: r.steps[0],
          lane: i,
          route: r,
          title: wp(r.steps[0]).label,
          sub: `${r.label} · ${Math.round(r.share * 100)}% of people like you`,
          origin: 'junction',
        });
        edges.push({ from: 'junction', to: key, style: 'future', route: r.id, fromLane: i });
      });
    }
  }

  const destKey = `dest-${main.destination}`;
  nodes.push({
    key: destKey,
    kind: 'destination',
    wp: main.destination,
    lane: 0,
    span: expanded && routes.length > 1 ? [0, routes.length - 1] : undefined,
    title: wp(main.destination).label,
    sub: personId === ME ? 'Your destination' : 'Where they’re heading',
    note: main.note,
    origin: routes.length ? 'junction' : last.key,
  });
  if (routes.length && expanded) {
    routes.forEach((r, i) => edges.push({ from: `route-${r.id}`, to: destKey, style: 'future', route: r.id, toLane: i }));
  } else edges.push({ from: routes.length ? 'junction' : last.key, to: destKey, style: 'future' });

  explore.forEach((f) => {
    const key = `explore-${f.destination}`;
    nodes.push({
      key,
      kind: 'explore',
      wp: f.destination,
      lane: exploreLane,
      title: wp(f.destination).label,
      sub: f.certainty === 'exploring' ? 'Also exploring' : 'Also considering',
      note: f.note,
      origin: routes.length ? 'junction' : last.key,
    });
    edges.push({ from: routes.length ? 'junction' : last.key, to: key, style: 'explore', fromLane: expanded ? exploreLane : undefined });
  });

  const lanes = Math.max(1, ...nodes.map((n) => (n.span ? n.span[1] : n.lane) + 1));
  return { nodes, edges, lanes };
}

/* Rounded polyline → SVG path */
function roundedPath(pts: [number, number][], r = 9): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const l1 = Math.hypot(x1 - x0, y1 - y0);
    const l2 = Math.hypot(x2 - x1, y2 - y1);
    const rr = Math.min(r, l1 / 2, l2 / 2);
    const ax = x1 - ((x1 - x0) / l1) * rr;
    const ay = y1 - ((y1 - y0) / l1) * rr;
    const bx = x1 + ((x2 - x1) / l2) * rr;
    const by = y1 + ((y2 - y1) / l2) * rr;
    d += ` L ${ax} ${ay} Q ${x1} ${y1} ${bx} ${by}`;
  }
  const [xn, yn] = pts[pts.length - 1];
  return d + ` L ${xn} ${yn}`;
}

function edgePoints(ax: number, ay: number, bx: number, by: number): [number, number][] {
  if (Math.abs(ax - bx) < 0.5) return [[ax, ay], [bx, by]];
  const dx = Math.abs(bx - ax);
  const lead = Math.min(16, Math.max(4, (by - ay - dx) / 2));
  return [
    [ax, ay],
    [ax, ay + lead],
    [bx, ay + lead + dx],
    [bx, by],
  ];
}

export function stationPeople(personId: string, n: MapNode): { ids: string[]; text: string } | null {
  const me = people[personId];
  const exclude = (ids: string[]) => ids.filter((id) => id !== personId && id !== ME);
  if (n.kind === 'past' && n.step) {
    const s = n.step;
    const same = peopleThrough(n.wp)
      .concat(peopleAt(n.wp))
      .filter((p) => {
        const o = compactSteps(p.path).find((x) => x.wp === n.wp);
        return o && o.org === s.org && (o.start ?? 0) <= (s.end ?? 9999) && (o.end ?? 9999) >= (s.start ?? 0);
      })
      .map((p) => p.id);
    const ids = exclude(same);
    if (ids.length) return { ids, text: `${names(ids)} ${ids.length === 1 ? 'was' : 'were'} here with ${personId === ME ? 'you' : me.first}` };
    const through = exclude(peopleThrough(n.wp).map((p) => p.id)).slice(0, 5);
    if (through.length) return { ids: through, text: `${list(through, 2)} took this step too` };
    return null;
  }
  if (n.kind === 'present') {
    const ids = exclude(peopleAt(n.wp).map((p) => p.id));
    if (!ids.length) return null;
    return { ids, text: `${names(ids)} ${ids.length > 1 ? 'are' : 'is'} here now` };
  }
  if (n.kind === 'route') {
    const at = exclude(peopleAt(n.wp).map((p) => p.id));
    const through = exclude(peopleThrough(n.wp).map((p) => p.id));
    const ids = [...at, ...through];
    if (!ids.length) return null;
    return { ids, text: at.length ? `${names(at.slice(0, 2))} ${at.length > 1 ? 'are' : 'is'} here now · ${n.route?.people ?? ''} took this route` : `${list(through, 2)} came through here` };
  }
  if (n.kind === 'destination' || n.kind === 'explore') {
    const reached = exclude([...peopleAt(n.wp), ...peopleThrough(n.wp)].map((p) => p.id));
    if (!reached.length) return null;
    const others = Math.max(reached.length - 2, 0) + (n.kind === 'destination' ? 1200 : 60);
    return { ids: reached, text: `${reached.slice(0, 2).map((id) => people[id].first).join(', ')} and ${others.toLocaleString('en-CA')} others are already here` };
  }
  return null;
}

function list(ids: string[], max: number): string {
  if (ids.length <= max) return names(ids);
  return `${ids.slice(0, max).map((id) => people[id].first).join(', ')} and ${ids.length - max} ${ids.length - max === 1 ? 'other' : 'others'}`;
}

function names(ids: string[]): string {
  const f = ids.map((id) => people[id].first);
  if (f.length <= 1) return f[0] ?? '';
  return `${f.slice(0, -1).join(', ')} and ${f[f.length - 1]}`;
}

export function TransitMap({
  personId,
  interactive = false,
  expanded = false,
  onToggleExpanded,
  selected,
  onSelect,
  focusRoute,
  onFocusRoute,
  walkable,
  onWalk,
  shareWith,
  highlight,
  showNotes = true,
  showPeople = true,
  renderExtra,
  extraRoutes,
}: Props) {
  const uid = useId().replace(/:/g, '');
  const isMobile = useIsMobile();
  const { nodes, edges, lanes } = useMemo(() => buildMap(personId, interactive, expanded, extraRoutes), [personId, interactive, expanded, extraRoutes]);
  const containerRef = useRef<HTMLOListElement>(null);
  const rowRefs = useRef(new Map<string, HTMLLIElement>());
  const [ys, setYs] = useState<Record<string, number>>({});
  const [height, setHeight] = useState(0);
  const [walkNode, setWalkNode] = useState<string | null>(null);
  // Structural changes (opening routes) redraw the lines; the first paint draws the whole Path in sequence.
  const initialExpanded = useRef(expanded);
  const toggled = useRef(false);
  if (expanded !== initialExpanded.current) toggled.current = true;
  const version = toggled.current ? (expanded ? 1 : 2) : 0;

  const pad = isMobile ? 14 : 20;
  const gap = isMobile ? 20 : 30;
  const laneX = useCallback((l: number) => pad + l * gap, [pad, gap]);
  const labelX = laneX(lanes - 1) + (isMobile ? 24 : 32);

  const shared = useMemo(() => (shareWith && shareWith !== personId ? new Set(walked(people[shareWith])) : null), [shareWith, personId]);
  const inHighlight = useMemo(() => {
    if (!highlight) return null;
    const list = nodes.map((n) => n.wp);
    const a = list.indexOf(highlight[0]);
    const b = list.lastIndexOf(highlight[1]);
    return new Set(nodes.slice(a, b + 1).map((n) => n.key));
  }, [highlight, nodes]);

  const measure = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const next: Record<string, number> = {};
    rowRefs.current.forEach((row, key) => {
      // offsetTop ignores the FLIP transforms applied during layout animation, so stations target final positions.
      const t = row.querySelector<HTMLElement>('.tmap__title');
      next[key] = row.offsetTop + (t ? t.offsetTop : 0) + 11;
    });
    setYs((prev) => {
      const same = Object.keys(next).length === Object.keys(prev).length && Object.keys(next).every((k) => Math.abs(prev[k] - next[k]) < 0.5);
      return same ? prev : next;
    });
    setHeight(el.scrollHeight);
  }, []);

  useLayoutEffect(() => {
    measure();
  }, [measure, nodes, lanes, isMobile]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const pos = (key: string, lane?: number) => {
    const n = nodes.find((x) => x.key === key)!;
    return { x: laneX(lane ?? n.lane), y: ys[key] ?? 0 };
  };

  const has = (key: string) => ys[key] !== undefined;
  const ready = nodes.every((n) => has(n.key));
  const presentIndex = nodes.findIndex((n) => n.kind === 'present');

  /* ── Walk ahead: drag the "you" puck down your future ─────── */
  const walkPath = useMemo(() => {
    if (!walkable || !ready) return null;
    const route = focusRoute ?? (interactive ? nodes.find((n) => n.kind === 'route')?.route?.id : undefined);
    const chain = nodes.filter(
      (n) => n.kind === 'present' || n.kind === 'junction' || (n.kind === 'route' && n.route?.id === route) || n.kind === 'destination',
    );
    const pts = chain.map((n) => ({ key: n.key, x: laneX(n.kind === 'route' ? n.lane : n.kind === 'destination' && n.span ? (nodes.find((m) => m.route?.id === route)?.lane ?? 0) : n.lane), y: ys[n.key] }));
    return pts;
  }, [walkable, ready, focusRoute, interactive, nodes, laneX, ys]);

  const walkY = useMotionValue(0);
  const baseY = walkPath?.[0]?.y ?? 0;
  const inputYs = walkPath ? walkPath.map((p) => p.y - baseY) : [0, 1];
  const outputXs = walkPath ? walkPath.map((p) => p.x) : [0, 0];
  const walkX = useTransform(walkY, inputYs, outputXs);
  const lastWalk = useRef<string | null>(null);

  useMotionValueEvent(walkY, 'change', (v) => {
    if (!walkPath) return;
    const y = v + baseY;
    let best = walkPath[0];
    for (const p of walkPath) if (Math.abs(p.y - y) < Math.abs(best.y - y)) best = p;
    const key = Math.abs(best.y - y) < 26 && best.key !== walkPath[0].key ? best.key : null;
    if (key !== lastWalk.current) {
      lastWalk.current = key;
      if (key) haptic(6);
      setWalkNode(key);
      onWalk?.(key ? nodes.find((n) => n.key === key)! : null);
    }
  });

  const walkTo = async () => {
    if (!walkPath) return;
    for (const p of walkPath.slice(1)) {
      if (p.key === 'junction') continue;
      await animate(walkY, p.y - baseY, springs.smooth);
      await new Promise((r) => setTimeout(r, 1100));
    }
    animate(walkY, 0, springs.settle);
  };

  const stationClass = (n: MapNode) => {
    const classes = [`station`, `station--${n.kind}`];
    if (n.kind === 'route') classes.push(focusRoute === n.route?.id ? 'is-focus' : focusRoute ? 'is-dim' : '');
    if (shared?.has(n.wp) && n.kind !== 'destination') classes.push('is-shared');
    if (inHighlight?.has(n.key)) classes.push('is-highlight');
    if (walkNode === n.key || selected === n.key) classes.push('is-active');
    return classes.join(' ');
  };

  // Brand vocabulary: the walked Path is Deep Slate Navy; the future is dashed Celestial Blue.
  // Routes you're weighing but not focused on sit in a lighter celestial.
  const edgeColor = (e: Edge) => {
    if (e.style === 'walked') return inHighlight && inHighlight.has(e.from) && inHighlight.has(e.to) ? 'var(--tint)' : 'var(--ink)';
    if (e.style === 'explore') return 'var(--future-soft)';
    if (e.route) return focusRoute === e.route ? 'var(--tint)' : focusRoute ? 'var(--label-4)' : 'var(--future-soft)';
    return 'var(--tint)';
  };

  const nodeDelay = (i: number) => (version === 0 ? 0.15 + i * 0.12 : 0.18);

  return (
    <div className={`tmap ${interactive ? 'tmap--interactive' : ''}`} style={{ ['--label-x' as string]: `${labelX}px` }}>
      <svg className="tmap__lines" width={labelX} height={height} aria-hidden="true">
        <defs>
          {edges.map((e) =>
            e.style !== 'walked' && has(e.from) && has(e.to) ? (
              <mask id={`${uid}-m-${e.from}-${e.to}`} key={`m-${e.from}-${e.to}-${version}`} maskUnits="userSpaceOnUse">
                <motion.path
                  d={roundedPath(edgePoints(pos(e.from, e.fromLane).x, pos(e.from).y, pos(e.to, e.toLane).x, pos(e.to).y))}
                  stroke="#fff"
                  strokeWidth={12}
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.55, ease: [0.45, 0, 0.2, 1], delay: nodeDelay(nodes.findIndex((n) => n.key === e.to)) - 0.05 }}
                />
              </mask>
            ) : null,
          )}
        </defs>
        {edges
          .filter((e) => has(e.from) && has(e.to))
          .map((e) => {
            const a = pos(e.from, e.fromLane);
            const b = pos(e.to, e.toLane);
            const d = roundedPath(edgePoints(a.x, a.y, b.x, b.y));
            const toIndex = nodes.findIndex((n) => n.key === e.to);
            if (e.style === 'walked')
              return (
                <motion.path
                  key={`${e.from}-${e.to}-${version}`}
                  d={d}
                  fill="none"
                  stroke={edgeColor(e)}
                  strokeWidth={3.5}
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, ease: [0.45, 0, 0.2, 1], delay: nodeDelay(toIndex) - 0.1 }}
                />
              );
            return (
              <path
                key={`${e.from}-${e.to}-${version}`}
                d={d}
                fill="none"
                stroke={edgeColor(e)}
                strokeWidth={e.style === 'explore' ? 3 : 3.5}
                strokeLinecap="round"
                strokeDasharray={e.style === 'explore' ? '3 7' : '5 8'}
                mask={`url(#${uid}-m-${e.from}-${e.to})`}
                className="tmap__future"
              />
            );
          })}
      </svg>

      {/* Stations */}
      <div className="tmap__stations" aria-hidden="true">
        {nodes.map((n, i) => {
          if (!has(n.key)) return null;
          const p = pos(n.key);
          const origin = n.origin && has(n.origin) && version > 0 ? pos(n.origin) : null;
          const terminal = n.kind === 'junction' || n.kind === 'destination';
          const width = terminal ? (n.span ? laneX(n.span[1]) - laneX(n.span[0]) : 0) + 22 : undefined;
          return (
              <motion.div
                key={n.key}
                className={`${stationClass(n)} ${n.span ? 'is-capsule' : ''}`}
                initial={origin ? { x: origin.x, y: origin.y, scale: 0.4, opacity: 0 } : { x: p.x, y: p.y, scale: 0, opacity: 0 }}
                animate={{ x: n.span ? laneX(n.span[0]) : p.x, y: p.y, scale: 1, opacity: 1 }}
                transition={{ ...springs.settle, delay: nodeDelay(i), opacity: { duration: 0.2, delay: nodeDelay(i) } }}
              >
                <motion.span className="station__mark" initial={false} animate={terminal ? { width } : undefined} transition={springs.settle}>
                  {n.kind === 'junction' && <span className="station__q">?</span>}
                </motion.span>
                {n.kind === 'present' && <span className="station__pulse" />}
              </motion.div>
          );
        })}
      </div>

      {/* Walk puck */}
      {walkable && ready && walkPath && presentIndex >= 0 && (
        <motion.div
          className="walk-puck"
          style={{ x: walkX, y: walkY, top: baseY }}
          drag="y"
          dragConstraints={{ top: 0, bottom: (walkPath[walkPath.length - 1]?.y ?? baseY) - baseY }}
          dragElastic={0.08}
          dragMomentum={false}
          onDragEnd={() => animate(walkY, 0, springs.settle)}
          whileDrag={{ scale: 1.12 }}
          whileTap={{ scale: 1.08 }}
          role="slider"
          aria-label="Walk ahead along your Path"
          aria-valuetext={walkNode ? nodes.find((n) => n.key === walkNode)?.title : 'Where you are'}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' || e.key === 'Enter') walkTo();
          }}
        >
          <img src={people[personId].photo} alt="" draggable={false} />
        </motion.div>
      )}

      {/* Rows (labels) */}
      <ol ref={containerRef} className="tmap__rows">
        <AnimatePresence mode="popLayout">
          {nodes.map((n, i) => {
            const ppl = showPeople ? stationPeople(personId, n) : null;
            const story = n.step?.storyId ? stories[n.step.storyId] : undefined;
            const isSel = selected === n.key || walkNode === n.key;
            const dim = n.kind === 'route' && focusRoute && focusRoute !== n.route?.id;
            return (
              <motion.li
                key={n.key}
                layout="position"
                ref={(el) => {
                  if (el) rowRefs.current.set(n.key, el);
                  else rowRefs.current.delete(n.key);
                }}
                className={`tmap__row tmap__row--${n.kind} ${isSel ? 'is-selected' : ''} ${dim ? 'is-dim' : ''} ${inHighlight?.has(n.key) ? 'is-highlight' : ''}`}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: dim ? 0.45 : 1, x: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                transition={{ ...springs.smooth, delay: version === 0 ? nodeDelay(i) : 0.12 + (n.kind === 'route' ? 0.06 * n.lane : 0) }}
              >
                <div
                  className="tmap__hit"
                  role={onSelect || n.kind === 'junction' ? 'button' : undefined}
                  tabIndex={onSelect || n.kind === 'junction' ? 0 : undefined}
                  onClick={() => {
                    if (n.kind === 'junction' && onToggleExpanded) {
                      haptic(10);
                      onToggleExpanded();
                    } else if (n.kind === 'route' && onFocusRoute) {
                      onFocusRoute(focusRoute === n.route?.id ? null : n.route!.id);
                      onSelect?.(n);
                    } else onSelect?.(n);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      (e.currentTarget as HTMLElement).click();
                    }
                  }}
                  style={{ paddingLeft: labelX }}
                >
                  <div>
                    {n.kind === 'present' && <div className="tmap__here t-caption1">{personId === ME ? 'You are here' : 'Now'}</div>}
                    {n.kind === 'destination' && personId === ME && <div className="tmap__here tmap__here--dest t-caption1">Destination</div>}
                    <div className="tmap__title">{n.title}</div>
                    {n.sub && <div className="tmap__sub t-subhead">{n.sub}</div>}
                    {showNotes && n.note && <p className="tmap__note t-footnote">{n.note}</p>}
                    {shared?.has(n.wp) && n.kind !== 'destination' && n.kind !== 'explore' && (
                      <div className="tmap__shared t-footnote">
                        <span className="tmap__shared-dot" /> {shareWith === ME ? 'You took this step too' : `${people[shareWith!].first} took this step too`}
                      </div>
                    )}
                    {ppl && (
                      <div className="tmap__people">
                        <AvatarStack ids={ppl.ids} size={22} max={4} />
                        <span className="t-footnote c-2">{ppl.text}</span>
                      </div>
                    )}
                    {n.kind === 'junction' && onToggleExpanded && (
                      <span className="tmap__toggle t-subhead">{expanded ? 'Close routes' : 'Open the routes'}</span>
                    )}
                    {story && (
                      <Link to={`/stories/${story.id}`} className="tmap__story t-footnote" onClick={(e) => e.stopPropagation()}>
                        <span className="tmap__story-mark">Story</span> {story.title}
                      </Link>
                    )}
                    {renderExtra?.(n)}
                  </div>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>

      {walkable && ready && (
        <button className="tmap__walk t-footnote" onClick={walkTo}>
          <span className="tmap__walk-arrow">↓</span> Drag your photo down to walk ahead — or tap to take the walk
        </button>
      )}
    </div>
  );
}

export function currentKeyOf(personId: string) {
  return current(people[personId]).status === 'present' ? 'present' : undefined;
}
