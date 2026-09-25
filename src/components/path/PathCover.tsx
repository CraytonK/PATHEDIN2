import { motion } from 'framer-motion';
import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { people, ME } from '../../data/people';
import { wp } from '../../data/waypoints';
import { edgeClass, springs, useScrollEdges } from '../../lib/motion';
import { futureWaypoints, relationTo, stepsWithFuture, yearsLabel } from '../../lib/relations';
import { useUI } from '../../lib/ui';
import './pcover.css';

/*
  A profile opens on its Path the way a social profile opens on a cover photo: the route drawn across
  the top in the brand's line language. Walked steps are solid ink, the present carries their portrait,
  and the future runs dashed in navy to where they're heading.
  Seen by someone else, it also says where the two Paths touch: your own face sits on every step you
  both took, and steps on your own way ahead are marked "On your route".
*/

type Kind = 'past' | 'present' | 'future' | 'dest';

export function PathCover({ id }: { id: string }) {
  const p = people[id];
  const self = id === ME;
  const steps = stepsWithFuture(p);
  const rel = relationTo(id);
  const shared = new Set(self ? [] : rel.shared);
  const ahead = self ? new Set<string>() : futureWaypoints(people[ME]);
  const openCompare = useUI((s) => s.openCompare);
  const scroller = useRef<HTMLOListElement>(null);
  const edges = useScrollEdges(scroller);
  const common = steps.filter((s) => shared.has(s.wp)).length;

  // When the line is wider than the screen, open on where they are now rather than where they started.
  useLayoutEffect(() => {
    const el = scroller.current;
    const now = el?.querySelector<HTMLElement>('.is-present');
    if (el && now && el.scrollWidth > el.clientWidth) el.scrollLeft = now.offsetLeft - (el.clientWidth - now.clientWidth) / 2;
  }, [id]);

  return (
    <figure className="pcover" aria-label={`${self ? 'Your' : `${p.first}’s`} Path`}>
      <ol className={`pcover__line ${edgeClass(edges)}`} ref={scroller}>
        {steps.map((s, i) => {
          const kind: Kind = s.status === 'present' ? 'present' : s.status === 'future' ? (i === steps.length - 1 ? 'dest' : 'future') : 'past';
          const both = shared.has(s.wp);
          const yours = !both && s.status !== 'present' && ahead.has(s.wp);
          const years = yearsLabel(s);
          return (
            <li key={`${s.wp}-${i}`} className={`pcover__stop is-${kind} ${both ? 'is-shared' : ''}`}>
              <div className="pcover__track">
                {i > 0 && (
                  <motion.span
                    className="pcover__link"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.4, delay: 0.05 + i * 0.1, ease: [0.45, 0, 0.2, 1] }}
                  />
                )}
                {kind === 'present' ? (
                  <motion.img
                    className="pcover__face"
                    src={p.photo}
                    alt=""
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ ...springs.settle, delay: 0.15 + i * 0.1 }}
                  />
                ) : (
                  <motion.span className="pcover__node" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...springs.settle, delay: 0.15 + i * 0.1 }} />
                )}
                {both && (
                  <span className="pcover__you" data-tip="You were here too">
                    <img src={people[ME].photo} alt="" />
                    <span className="visually-hidden">You were here too.</span>
                  </span>
                )}
              </div>
              <p className="pcover__name">{wp(s.wp).short}</p>
              <p className="pcover__when">{kind === 'present' ? (self ? 'You are here' : 'Now') : kind === 'dest' ? 'Heading' : kind === 'future' ? 'Next' : years}</p>
              {yours && <p className="pcover__mark">On your route</p>}
            </li>
          );
        })}
      </ol>
      <figcaption className="pcover__caption">
        <span>{self ? 'Your Path' : `${p.first}’s Path`}</span>
        {self ? (
          <Link to="/path" className="pcover__action">
            Open My Path
          </Link>
        ) : (
          <button type="button" className="pcover__action" onClick={() => openCompare(id)}>
            {common ? `${common === 1 ? 'One step' : `${common} steps`} in common · Align Paths` : 'Align Paths'}
          </button>
        )}
      </figcaption>
    </figure>
  );
}
