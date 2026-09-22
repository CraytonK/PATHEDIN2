import { motion } from 'framer-motion';
import { people, ME } from '../data/people';
import { wp } from '../data/waypoints';
import type { Community } from '../data/types';
import { current, walked } from '../lib/relations';
import { springs } from '../lib/motion';
import { Avatar, formatCount } from './ui';
import './community-route.css';

/* The journey a community is built around, with its members standing where they are. */

export function membersAt(c: Community, stageWp: string) {
  return c.memberIds.filter((id) => current(people[id]).wp === stageWp);
}

export function CommunityRoute({ c, active, onPick }: { c: Community; active?: string | null; onPick?: (wp: string | null) => void }) {
  const myStage = c.stages.find((s) => s.wp === current(people[ME]).wp)?.wp;
  const myWalked = new Set(walked(people[ME]));
  const max = Math.max(...c.stages.map((s) => s.count));
  return (
    <ol className="croute" aria-label={`Where members of ${c.title} are`}>
      {c.stages.map((s, i) => {
        const here = membersAt(c, s.wp).filter((id) => id !== ME);
        const isMine = s.wp === myStage;
        const passed = myWalked.has(s.wp) && !isMine;
        const on = !active || active === s.wp;
        const size = 14 + (s.count / max) * 12;
        return (
          <li key={s.wp} className={`croute__stop ${isMine ? 'is-mine' : ''} ${passed ? 'is-passed' : ''} ${on ? '' : 'is-dim'} ${i === c.stages.length - 1 ? 'is-last' : ''}`}>
            <button className="croute__btn" onClick={() => onPick?.(active === s.wp ? null : s.wp)} aria-pressed={active === s.wp}>
              <div className="croute__faces">
                {here.slice(0, 3).map((id, k) => (
                  <motion.span key={id} className="croute__face" style={{ marginLeft: k ? -8 : 0 }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springs.settle, delay: 0.3 + i * 0.07 + k * 0.04 }}>
                    <Avatar id={id} size={26} peek={false} />
                  </motion.span>
                ))}
                {isMine && (
                  <span className="croute__me">
                    <img src={people[ME].photo} alt="" />
                  </span>
                )}
              </div>
              <div className="croute__track">
                <motion.span className="croute__dot" style={{ width: size, height: size }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...springs.settle, delay: 0.1 + i * 0.07 }} />
              </div>
              <span className="croute__label t-footnote">{wp(s.wp).short}</span>
              <span className="croute__count t-caption1 t-num">{isMine ? 'You + ' : ''}{formatCount(s.count)}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
