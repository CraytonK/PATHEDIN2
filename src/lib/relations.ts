import { people, peopleList, ME } from '../data/people';
import { wp } from '../data/waypoints';
import type { Person, Step } from '../data/types';

export type RelationKind = 'twin' | 'peer' | 'ahead' | 'guide' | 'explorer' | 'behind' | 'other' | 'self';

export interface Relation {
  kind: RelationKind;
  label: string;
  why: string;
  shared: string[];
  stepsAhead?: number;
  reached?: boolean;
}

/** Merge consecutive steps at the same waypoint (e.g. a promotion within Regulatory Affairs). */
export function compactSteps(steps: Step[]): Step[] {
  const out: Step[] = [];
  for (const s of steps) {
    const last = out[out.length - 1];
    if (last && last.wp === s.wp) {
      out[out.length - 1] = { ...s, start: last.start, note: s.note ?? last.note, storyId: s.storyId ?? last.storyId };
    } else out.push(s);
  }
  return out;
}

export function walked(p: Person): string[] {
  return compactSteps(p.path).map((s) => s.wp);
}

export function current(p: Person): Step {
  return p.path.find((s) => s.status === 'present') ?? p.path[p.path.length - 1];
}

export function stepTitle(s: Step): string {
  return s.title ?? wp(s.wp).label;
}

export function destinationsOf(p: Person): string[] {
  return p.futures.map((f) => f.destination);
}

export function primaryDestination(p: Person): string | undefined {
  return (p.futures.find((f) => f.certainty === 'set') ?? p.futures[0])?.destination;
}

export function futureWaypoints(p: Person): Set<string> {
  const set = new Set<string>();
  for (const f of p.futures) {
    set.add(f.destination);
    for (const r of f.routes ?? []) r.steps.forEach((s) => set.add(s));
  }
  return set;
}

/** Longest common subsequence of two waypoint sequences. */
export function lcs(a: string[], b: string[]): string[] {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: string[] = [];
  let i = 0,
    j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push(a[i]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return out;
}

export interface AlignRow {
  kind: 'shared' | 'a' | 'b';
  wp: string;
  a?: Step;
  b?: Step;
}

/** Interleave two Paths so shared waypoints line up — the basis of "Align". */
export function alignSteps(aSteps: Step[], bSteps: Step[]): AlignRow[] {
  const a = aSteps.map((s) => s.wp);
  const b = bSteps.map((s) => s.wp);
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const rows: AlignRow[] = [];
  let i = 0,
    j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      rows.push({ kind: 'shared', wp: a[i], a: aSteps[i], b: bSteps[j] });
      i++;
      j++;
    } else if (j >= b.length || (i < a.length && dp[i + 1][j] >= dp[i][j + 1])) {
      rows.push({ kind: 'a', wp: a[i], a: aSteps[i] });
      i++;
    } else {
      rows.push({ kind: 'b', wp: b[j], b: bSteps[j] });
      j++;
    }
  }
  return rows;
}

/** A person's Path including where they're heading, as steps. */
export function stepsWithFuture(p: Person, opts: { route?: string[] } = {}): Step[] {
  const steps = compactSteps(p.path);
  const dest = primaryDestination(p);
  const extra: Step[] = [];
  for (const r of opts.route ?? []) extra.push({ wp: r, status: 'future' });
  if (dest && !steps.some((s) => s.wp === dest)) extra.push({ wp: dest, status: 'future' });
  return [...steps, ...extra];
}

const plural = (n: number) => ['No steps', 'One step', 'Two steps', 'Three steps', 'Four steps', 'Five steps'][n] ?? `${n} steps`;

const cache = new Map<string, Relation>();

export function relationTo(otherId: string, viewerId = ME): Relation {
  const key = `${viewerId}:${otherId}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const r = computeRelation(people[viewerId], people[otherId]);
  cache.set(key, r);
  return r;
}

function computeRelation(v: Person, o: Person): Relation {
  if (v.id === o.id) return { kind: 'self', label: 'You', why: '', shared: walked(v) };
  const V = walked(v);
  const O = walked(o);
  const vCur = current(v).wp;
  const oCur = current(o).wp;
  const vDest = new Set(destinationsOf(v));
  const vFut = futureWaypoints(v);
  const oDest = destinationsOf(o);
  const shared = lcs(V, O);
  const reached = O.some((w) => vDest.has(w));
  const custom = o.why;

  const make = (kind: RelationKind, label: string, why: string, extra: Partial<Relation> = {}): Relation => ({
    kind,
    label,
    why: custom ?? why,
    shared,
    reached,
    ...extra,
  });

  if (o.guide && (reached || o.hiring || o.guide.transitions.some(([, to]) => vFut.has(to) || vDest.has(to)))) {
    const [from, to] = o.guide.transitions[o.guide.transitions.length - 1];
    return make('guide', 'Path Guide', `Made the move from ${wp(from).label} to ${wp(to).label}.`);
  }

  if (oCur === vCur) {
    const sameFuture = oDest.some((d) => vDest.has(d));
    if (shared.length >= 3 && sameFuture) return make('twin', 'Path Twin', `The same ${shared.length} steps as you, heading to ${wp(oDest[0]).label}.`);
    return make('peer', 'Path Peer', `Also at ${wp(vCur).label} right now.`);
  }

  const vIdx = O.indexOf(vCur);
  const oIdx = O.indexOf(oCur);
  if (vIdx >= 0 && oIdx > vIdx && (vFut.has(oCur) || O.slice(vIdx + 1).some((w) => vFut.has(w)))) {
    const n = oIdx - vIdx;
    return make('ahead', reached && n > 1 ? 'Reached your destination' : `${plural(n)} ahead`, `${plural(n)} ahead on your Path — now ${wp(oCur).label}.`, {
      stepsAhead: n,
    });
  }

  if (reached || o.hiring) {
    return make('ahead', o.hiring ? 'Hires for your destination' : 'Reached your destination', `Reached ${wp([...vDest][0]).label}.`, {
      stepsAhead: 3,
    });
  }

  const vCurIdx = V.indexOf(oCur);
  if (vCurIdx >= 0 && vCurIdx < V.length - 1) {
    const n = V.length - 1 - vCurIdx;
    return make('behind', 'Following your Path', `${plural(n)} behind you on the same Path.`);
  }

  if (oDest.some((d) => vDest.has(d) || vFut.has(d))) {
    const d = oDest.find((x) => vDest.has(x) || vFut.has(x))!;
    return make('explorer', 'Path Explorer', `Also exploring ${wp(d).label}, from ${wp(oCur).label}.`);
  }

  return make('other', 'Different Path', `${o.first} went from ${wp(O[0]).label} to ${wp(oCur).label}.`);
}

/**
 * Path match: how closely someone's journey (walked steps plus where they're heading)
 * follows yours, as a percentage. Built from the longest shared sequence of steps.
 */
export function pathMatch(otherId: string, viewerId = ME): number {
  const seq = (p: Person) => {
    const w = walked(p);
    const d = primaryDestination(p);
    return d && !w.includes(d) ? [...w, d] : w;
  };
  const a = seq(people[viewerId]);
  const b = seq(people[otherId]);
  const shared = lcs(a, b).length;
  return Math.min(99, Math.round(40 + 59 * ((2 * shared) / (a.length + b.length))));
}

export const relationOrder: RelationKind[] =['twin', 'peer', 'ahead', 'guide', 'explorer', 'behind', 'other'];

export const relationCopy: Record<Exclude<RelationKind, 'self' | 'other'>, { title: string; plural: string; blurb: string }> = {
  twin: { title: 'Path Twin', plural: 'Path Twins', blurb: 'Journeys that closely mirror yours, heading the same way.' },
  peer: { title: 'Path Peer', plural: 'Path Peers', blurb: 'At the same point as you, right now.' },
  ahead: { title: 'Ahead of you', plural: 'People Ahead', blurb: 'Already living the steps you’re considering.' },
  guide: { title: 'Path Guide', plural: 'Path Guides', blurb: 'Made the transitions you’re weighing, and open to helping.' },
  explorer: { title: 'Path Explorer', plural: 'Path Explorers', blurb: 'Considering the same futures from different starting points.' },
  behind: { title: 'Following your Path', plural: 'Following your Path', blurb: 'A step or two behind you. You could help.' },
};

export function peopleByRelation(kind: RelationKind): Person[] {
  return peopleList.filter((p) => p.id !== ME && relationTo(p.id).kind === kind);
}

/** People currently at a waypoint. */
export function peopleAt(w: string): Person[] {
  return peopleList.filter((p) => p.id !== ME && current(p).wp === w);
}

/** People who have passed through a waypoint (not currently there). */
export function peopleThrough(w: string): Person[] {
  return peopleList.filter((p) => p.id !== ME && walked(p).includes(w) && current(p).wp !== w);
}

/** People heading to a destination (not yet there). */
export function peopleHeading(w: string): Person[] {
  return peopleList.filter((p) => p.id !== ME && destinationsOf(p).includes(w) && !walked(p).includes(w));
}

/** Path Guides who made a transition into the given waypoint. */
export function guidesInto(w: string): Person[] {
  return peopleList.filter((p) => p.guide && (p.guide.transitions.some(([, to]) => to === w) || walked(p).includes(w)));
}

export function yearsLabel(s: Step): string {
  if (s.status === 'future') return '';
  if (s.end === null) return `${s.start} – now`;
  if (s.start === s.end) return `${s.start}`;
  return `${s.start} – ${s.end}`;
}
