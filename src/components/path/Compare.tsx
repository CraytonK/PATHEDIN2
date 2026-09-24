import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { people, ME } from '../../data/people';
import { wp } from '../../data/waypoints';
import { conversationList } from '../../data/social';
import { alignSteps, futureWaypoints, relationTo, stepsWithFuture, yearsLabel, type AlignRow } from '../../lib/relations';
import { springs, useIsMobile } from '../../lib/motion';
import { useUI } from '../../lib/ui';
import { Sheet } from '../chrome';
import { Button, PathChips, RelationTag } from '../ui';
import { IconMessage, IconSend } from '../icons';
import './compare.css';

/*
  Align — lay two Paths side by side, then let them find each other.
  They start apart; shared stations slide together and run as one shared track,
  lit in the tint. Divergences peel away at 45°.
*/

const ROW = 66;
const TOP = 18;

function points(rows: AlignRow[], who: 'a' | 'b', aligned: boolean, x: { a: number; b: number; sa: number; sb: number }) {
  const pts: { x: number; y: number; row: number; kind: AlignRow['kind'] }[] = [];
  rows.forEach((r, i) => {
    if (r.kind !== 'shared' && r.kind !== who) return;
    const px = r.kind === 'shared' ? (aligned ? (who === 'a' ? x.sa : x.sb) : who === 'a' ? x.a : x.b) : who === 'a' ? x.a : x.b;
    pts.push({ x: px, y: TOP + i * ROW, row: i, kind: r.kind });
  });
  return pts;
}

/** Always emits the same command structure so `d` can be interpolated between states. */
function trackPath(pts: { x: number; y: number }[]): string {
  if (!pts.length) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const dx = b.x - a.x;
    const midY1 = a.y + (b.y - a.y) * 0.28;
    const midY2 = b.y - (b.y - a.y) * 0.28;
    d += ` L ${a.x} ${midY1} C ${a.x} ${midY1 + 14} ${a.x + dx} ${midY2 - 14} ${b.x} ${midY2} L ${b.x} ${b.y}`;
  }
  return d;
}

function segments(pts: { x: number; y: number; row: number }[], statusOf: (row: number) => 'past' | 'future') {
  // Split a track into walked (solid) and future (dotted) runs.
  const solid: typeof pts = [];
  const dotted: typeof pts = [];
  pts.forEach((p, i) => {
    if (statusOf(p.row) !== 'future') solid.push(p);
    else {
      if (dotted.length === 0 && i > 0) dotted.push(pts[i - 1]);
      dotted.push(p);
    }
  });
  return { solid, dotted };
}

export function AlignMap({ otherId, autoAlign = true }: { otherId: string; autoAlign?: boolean }) {
  const isMobile = useIsMobile();
  const me = people[ME];
  const other = people[otherId];
  const myRoute = me.futures[0]?.routes?.[0]?.steps ?? [];
  const rows = useMemo(() => {
    const theirs = stepsWithFuture(other);
    // Use the route that best matches their Path for the viewer's future.
    const fut = futureWaypoints(me);
    const match = theirs.find((s) => fut.has(s.wp) && s.wp !== me.futures[0]?.destination);
    return alignSteps(stepsWithFuture(me, { route: match ? [match.wp] : myRoute.slice(0, 0) }), theirs);
  }, [me, other, myRoute]);
  const [aligned, setAligned] = useState(!autoAlign);

  useEffect(() => {
    if (!autoAlign) return;
    setAligned(false);
    const t = setTimeout(() => setAligned(true), 650);
    return () => clearTimeout(t);
  }, [otherId, autoAlign]);

  const x = isMobile ? { a: 18, b: 66, sa: 38, sb: 46 } : { a: 22, b: 78, sa: 45, sb: 55 };
  const labelX = x.b + (isMobile ? 26 : 34);
  const height = TOP + (rows.length - 1) * ROW + 30;

  const aPts = points(rows, 'a', aligned, x);
  const bPts = points(rows, 'b', aligned, x);
  const statusA = (row: number) => (rows[row].a?.status === 'future' ? 'future' : 'past');
  const statusB = (row: number) => (rows[row].b?.status === 'future' ? 'future' : 'past');
  const aSeg = segments(aPts, statusA);
  const bSeg = segments(bPts, statusB);

  // Contiguous runs of shared rows get the illuminated band.
  const runs: [number, number][] = [];
  rows.forEach((r, i) => {
    if (r.kind !== 'shared') return;
    const last = runs[runs.length - 1];
    if (last && last[1] === i - 1) last[1] = i;
    else runs.push([i, i]);
  });

  return (
    <div className="align" style={{ height }}>
      <svg className="align__svg" width={labelX} height={height} aria-hidden="true">
        {runs.map(([s, e], k) => (
          <motion.rect
            key={`band-${k}`}
            x={(x.sa + x.sb) / 2 - 15}
            y={TOP + s * ROW - 15}
            width={30}
            rx={15}
            fill="var(--tint-soft)"
            initial={{ height: 0, opacity: 0 }}
            animate={aligned ? { height: (e - s) * ROW + 30, opacity: 1 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: aligned ? 0.25 + k * 0.1 : 0 }}
          />
        ))}
        <TrackPair seg={bSeg} color="var(--path-them)" future="var(--path-them)" />
        <TrackPair seg={aSeg} color="var(--ink)" future="var(--tint)" />
        {rows.map((r, i) => {
          const y = TOP + i * ROW;
          if (r.kind === 'shared')
            return (
              <motion.rect
                key={`st-${i}`}
                height={18}
                rx={9}
                y={y - 9}
                fill="var(--bg)"
                stroke="var(--ink)"
                strokeWidth={2.5}
                initial={false}
                animate={aligned ? { x: x.sa - 9, width: x.sb - x.sa + 18 } : { x: x.a - 8, width: x.b - x.a + 16 }}
                transition={{ ...springs.settle, delay: aligned ? 0.05 * i : 0 }}
                opacity={aligned ? 1 : 0}
                style={{ transition: 'opacity .25s' }}
              />
            );
          return null;
        })}
        {rows.map((r, i) => {
          const y = TOP + i * ROW;
          const els = [];
          if (r.kind === 'a' || (r.kind === 'shared' && !aligned))
            els.push(<Station key={`a${i}`} x={x.a} y={y} color="var(--ink)" future={r.a?.status === 'future'} present={r.a?.status === 'present'} />);
          if (r.kind === 'b' || (r.kind === 'shared' && !aligned))
            els.push(<Station key={`b${i}`} x={x.b} y={y} color="var(--path-them)" future={r.b?.status === 'future'} present={r.b?.status === 'present'} />);
          return els;
        })}
      </svg>

      <ol className="align__rows" style={{ paddingLeft: labelX }}>
        {rows.map((r, i) => (
          <motion.li
            key={i}
            className={`align__row is-${r.kind}`}
            style={{ height: ROW }}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i, ...springs.smooth }}
          >
            <div className="align__title">
              <span className="align__name">{wp(r.wp).label}</span>
              {r.kind === 'shared' && aligned && (
                <motion.span className="align__both t-caption1" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.06 }}>
                  {r.a?.status === 'future' && r.b?.status !== 'future' ? 'Your future' : 'Both'}
                </motion.span>
              )}
            </div>
            <div className="align__sub t-footnote">
              {r.kind === 'shared' ? (
                <>
                  <span className="align__you">You</span> {describe(r.a)} <span className="align__sep">·</span> <span className="align__them">{other.first}</span> {describe(r.b)}
                </>
              ) : r.kind === 'a' ? (
                <>
                  <span className="align__you">You</span> {describe(r.a)}
                </>
              ) : (
                <>
                  <span className="align__them">{other.first}</span> {describe(r.b)}
                </>
              )}
            </div>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}

function describe(s?: { org?: string; status: string; start?: number; end?: number | null }) {
  if (!s) return '';
  if (s.status === 'future') return 'considering';
  const yrs = yearsLabel(s as never);
  return [s.org, yrs].filter(Boolean).join(', ');
}

function TrackPair({ seg, color, future }: { seg: ReturnType<typeof segments>; color: string; future: string }) {
  return (
    <>
      {seg.solid.length > 1 && (
        <motion.path
          d={trackPath(seg.solid)}
          fill="none"
          stroke={color}
          strokeWidth={3.5}
          strokeLinecap="round"
          initial={{ pathLength: 0, d: trackPath(seg.solid) }}
          animate={{ pathLength: 1, d: trackPath(seg.solid) }}
          transition={{ pathLength: { duration: 0.8, ease: [0.45, 0, 0.2, 1] }, d: springs.settle }}
        />
      )}
      {seg.dotted.length > 1 && (
        <motion.path
          d={trackPath(seg.dotted)}
          fill="none"
          stroke={future}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeDasharray="5 8"
          initial={{ opacity: 0, d: trackPath(seg.dotted) }}
          animate={{ opacity: 1, d: trackPath(seg.dotted) }}
          transition={{ opacity: { delay: 0.6, duration: 0.3 }, d: springs.settle }}
        />
      )}
    </>
  );
}

/* Brand nodes: been = solid, now = ring with a celestial dot, going = open circle. */
function Station({ x, y, color, future, present }: { x: number; y: number; color: string; future?: boolean; present?: boolean }) {
  return (
    <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={springs.settle}>
      <motion.circle
        initial={{ cx: x, cy: y }}
        animate={{ cx: x, cy: y }}
        transition={springs.settle}
        r={present ? 8.5 : 7}
        fill={future || present ? 'var(--bg)' : color}
        stroke={future ? (color === 'var(--ink)' ? 'var(--tint)' : color) : present ? color : 'var(--bg)'}
        strokeWidth={present ? 3 : future ? 2.5 : 2}
      />
      {present && <motion.circle initial={{ cx: x, cy: y }} animate={{ cx: x, cy: y }} transition={springs.settle} r={3} fill="var(--tint)" />}
    </motion.g>
  );
}

export function compareSummary(otherId: string) {
  const me = people[ME];
  const o = people[otherId];
  const rows = alignSteps(stepsWithFuture(me), stepsWithFuture(o));
  const shared = rows.filter((r) => r.kind === 'shared' && r.a?.status !== 'future' && r.b?.status !== 'future');
  const fut = futureWaypoints(me);
  const theirFuture = o.path.filter((s) => fut.has(s.wp));
  const dest = me.futures[0]?.destination;
  const reached = o.path.find((s) => s.wp === dest);
  const lines: string[] = [];
  lines.push(
    shared.length
      ? `You share ${shared.length === 1 ? 'one step' : `${shared.length} steps`}: ${shared.map((r) => wp(r.wp).short).join(', ')}.`
      : `Your Paths haven’t crossed yet — but ${o.first} knows somewhere you’re heading.`,
  );
  const next = theirFuture.find((s) => s.wp !== dest);
  if (next) lines.push(`${o.first} has already been at ${wp(next.wp).label} — one of your possible next steps.`);
  if (reached) lines.push(`${o.first} reached ${wp(dest!).label} in ${reached.start}.`);
  const divergeAt = rows.findIndex((r) => r.kind !== 'shared');
  const lastShared = divergeAt > 0 ? rows[divergeAt - 1] : undefined;
  const theirTurn = rows.slice(divergeAt).find((r) => r.kind === 'b');
  const segment: [string, string] | undefined = lastShared && theirTurn ? [lastShared.wp, theirTurn.wp] : undefined;
  return { lines, segment, sharedCount: shared.length };
}

export function CompareLayer() {
  const id = useUI((s) => s.compare);
  const close = useUI((s) => s.closeCompare);
  const openRequest = useUI((s) => s.openRequest);
  const navigate = useNavigate();
  const [shown, setShown] = useState<string | null>(null);
  useEffect(() => {
    if (id) setShown(id);
  }, [id]);
  const o = shown ? people[shown] : null;
  const rel = shown ? relationTo(shown) : null;
  const summary = shown ? compareSummary(shown) : null;
  const convo = shown ? conversationList.find((c) => c.with === shown) : undefined;

  return (
    <Sheet open={!!id} onClose={close} title="Align Paths" width={720} label="Align Paths">
      {o && rel && summary && (
        <div className="compare">
          <div className="compare__head">
            <div className="compare__faces">
              <img src={people[ME].photo} alt="" className="compare__face compare__face--you" />
              <img src={o.photo} alt="" className="compare__face" />
            </div>
            <div>
              <h2 className="t-title2">You & {o.first}</h2>
              <div className="compare__tags">
                <RelationTag kind={rel.kind} label={rel.label} />
                <PathChips id={o.id} matchOnly />
              </div>
            </div>
          </div>
          <p className="compare__lede t-body">{rel.why}</p>
          <div className="compare__legend t-footnote">
            <span>
              <i className="compare__key compare__key--you" /> Your Path
            </span>
            <span>
              <i className="compare__key" /> {o.first}’s Path
            </span>
            <span>
              <i className="compare__key compare__key--shared" /> Shared track
            </span>
          </div>
          <AlignMap otherId={o.id} />
          <div className="compare__summary">
            {summary.lines.map((l) => (
              <p key={l} className="t-callout">
                {l}
              </p>
            ))}
          </div>
          <div className="compare__actions">
            {summary.segment && (
              <Button
                variant="filled"
                size="large"
                icon={<IconSend size={19} />}
                onClick={() => {
                  close();
                  openRequest(o.id, summary.segment);
                }}
              >
                Ask about {wp(summary.segment[0]).short} → {wp(summary.segment[1]).short}
              </Button>
            )}
            <Button
              variant="gray"
              size="large"
              icon={<IconMessage size={19} />}
              onClick={() => {
                close();
                navigate(convo ? `/messages/${convo.id}` : `/messages?to=${o.id}`);
              }}
            >
              Message
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
