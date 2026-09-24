import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { springs } from '../lib/motion';
import { AvatarStack } from './ui';
import './pulse.css';

/*
  "Your Path this week" — your Path laid out as a single line, with what's happening
  around each station pinned above it. The line draws, then people arrive.
*/

export interface PulseStop {
  key: string;
  label: string;
  kind: 'past' | 'present' | 'unknown' | 'destination';
  href: string;
  activity?: { ids: string[]; text: string };
}

export function PathPulse({ stops }: { stops: PulseStop[] }) {
  return (
    <div className="pulse" role="list" aria-label="Activity along your Path this week">
      {stops.map((s, i) => (
        <Link key={s.key} to={s.href} className={`pulse__stop is-${s.kind}`} role="listitem">
          <div className="pulse__activity">
            {s.activity && (
              <motion.div
                className="pulse__bubble"
                initial={{ opacity: 0, y: 10, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ ...springs.settle, delay: 0.7 + i * 0.12 }}
              >
                <AvatarStack ids={s.activity.ids} size={24} max={3} />
                <span className="t-caption1">{s.activity.text}</span>
              </motion.div>
            )}
          </div>
          <div className="pulse__track">
            {i > 0 && (
              <motion.span
                className={`pulse__line ${s.kind === 'unknown' || s.kind === 'destination' ? 'is-future' : ''}`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.35, delay: 0.1 + i * 0.12, ease: [0.45, 0, 0.2, 1] }}
              />
            )}
            <motion.span
              className="pulse__dot"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...springs.settle, delay: 0.2 + i * 0.12 }}
            >
              {s.kind === 'unknown' && '?'}
            </motion.span>
            {s.kind === 'present' && <span className="pulse__ring" />}
          </div>
          <div className="pulse__label">
            <span className="pulse__name">
              {s.label}
              {s.kind === 'present' && <span className="here-tag">You</span>}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
