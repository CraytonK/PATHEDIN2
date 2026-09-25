import { people, ME } from '../../data/people';
import { stepsWithFuture, walked } from '../../lib/relations';
import './routeband.css';

/*
  A person's Path as a band across the top of their card: walked steps solid, the present ringed, the future
  dashed toward an open destination. Steps you've also walked are lit in navy, so the overlap reads before
  the words do. Decorative; the card says the same thing in text.
*/

export function RouteBand({ id, segment }: { id: string; segment?: [string, string] }) {
  const p = people[id];
  const steps = stepsWithFuture(p);
  const mine = new Set(walked(people[ME]));
  const n = steps.length;
  const x = (i: number) => (n === 1 ? 50 : 8 + (i * 84) / (n - 1));
  const segA = segment ? steps.findIndex((s) => s.wp === segment[0]) : -1;
  const segB = segment ? steps.findIndex((s) => s.wp === segment[1]) : -1;
  const lit = (i: number) => (segment ? segA >= 0 && segB >= 0 && i >= segA && i <= segB : steps[i].status !== 'future' && mine.has(steps[i].wp));
  return (
    <div className="rband" aria-hidden="true">
      {steps.slice(1).map((s, j) => {
        const i = j + 1;
        const future = s.status === 'future';
        return (
          <span
            key={`l-${i}`}
            className={`rband__link ${future ? 'is-future' : ''} ${lit(i) && lit(i - 1) ? 'is-lit' : ''}`}
            style={{ left: `${x(i - 1)}%`, width: `${x(i) - x(i - 1)}%` }}
          />
        );
      })}
      {steps.map((s, i) => (
        <span key={`n-${s.wp}-${i}`} className={`rband__node is-${s.status} ${lit(i) ? 'is-lit' : ''} ${i === n - 1 && s.status === 'future' ? 'is-dest' : ''}`} style={{ left: `${x(i)}%` }} />
      ))}
    </div>
  );
}
