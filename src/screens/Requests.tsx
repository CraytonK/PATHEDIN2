import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Page } from '../components/chrome';
import { PathStrip } from '../components/path/PathStrip';
import { Avatar, Button, PersonName, RelationTag, Segmented } from '../components/ui';
import { IconCheck } from '../components/icons';
import { people, ME } from '../data/people';
import { wp } from '../data/waypoints';
import type { PathRequest } from '../data/types';
import { relationTo } from '../lib/relations';
import { useApp } from '../lib/store';
import { useUI } from '../lib/ui';
import { springs } from '../lib/motion';
import './lists.css';

const askLabel = { chat: 'A conversation', question: 'One question', review: 'Feedback' };

function RequestCard({ r, incoming }: { r: PathRequest; incoming: boolean }) {
  const other = incoming ? r.from : r.to;
  const p = people[other];
  const rel = relationTo(other);
  const respond = useApp((s) => s.respondRequest);
  const toast = useUI((s) => s.showToast);
  const pathOwner = incoming ? ME : r.to;
  return (
    <motion.article layout className="req-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={springs.smooth}>
      <div className="req-card__who">
        <Avatar id={other} size={48} />
        <div>
          <PersonName id={other} className="t-headline" />
          {rel.kind !== 'other' && <RelationTag kind={rel.kind} label={rel.label} />}
        </div>
        <span className="t-caption1 c-3 req-card__ago">{r.ago}</span>
      </div>
      <div className="req-card__about">
        <p className="t-footnote">
          <strong>{askLabel[r.ask]}</strong> about {incoming ? 'your' : `${p.first}’s`} step{' '}
          <strong className="c-tint">
            {wp(r.segment[0]).short} → {wp(r.segment[1]).short}
          </strong>
        </p>
        <PathStrip id={pathOwner} highlight={r.segment} />
      </div>
      <p className="req-card__msg t-callout">“{r.message}”</p>
      {incoming && r.status === 'pending' && (
        <div className="req-card__actions">
          <Button
            variant="filled"
            size="medium"
            icon={<IconCheck size={16} />}
            onClick={() => {
              respond(r.id, 'accepted');
              toast(`You said yes to ${p.first}`);
            }}
          >
            Accept
          </Button>
          <Button variant="gray" size="medium" onClick={() => toast('Suggested Thursday, 6:00 PM')}>
            Suggest a time
          </Button>
          <Button variant="plain" size="medium" onClick={() => respond(r.id, 'declined')}>
            Not now
          </Button>
        </div>
      )}
      {(r.status !== 'pending' || !incoming) && (
        <p className={`req-card__status t-footnote is-${r.status}`}>
          {r.status === 'accepted' ? `Accepted${r.proposed ? ` · ${r.proposed}` : ''}` : r.status === 'declined' ? 'Not now' : `Waiting for ${p.first}`}
          {r.thread && (
            <>
              {' · '}
              <Link to={`/messages/${r.thread}`} className="c-tint">
                Open conversation
              </Link>
            </>
          )}
        </p>
      )}
    </motion.article>
  );
}

export function Requests() {
  const requests = useApp((s) => s.requests);
  const [tab, setTab] = useState<'in' | 'out'>('in');
  const incoming = requests.filter((r) => r.to === ME);
  const outgoing = requests.filter((r) => r.from === ME);
  const list = tab === 'in' ? incoming : outgoing;
  return (
    <Page title="Path Requests" subtitle="Requests arrive with the part of the Path they’re about — so you know exactly what you’re being asked." back="Network">
      <div className="list-page">
        <Segmented
          value={tab}
          onChange={setTab}
          ariaLabel="Requests"
          size="large"
          options={[
            { value: 'in', label: `Received · ${incoming.filter((r) => r.status === 'pending').length}` },
            { value: 'out', label: `Sent · ${outgoing.length}` },
          ]}
        />
        <AnimatePresence mode="popLayout">
          {list.map((r) => (
            <RequestCard key={r.id} r={r} incoming={tab === 'in'} />
          ))}
        </AnimatePresence>
      </div>
    </Page>
  );
}
