import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Page } from '../components/chrome';
import { DefaultRail } from '../components/Rail';
import { PathHint } from '../components/path/PathHint';
import { Avatar, Button, PersonName, RelationTag, TextTabs } from '../components/ui';
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

/** The next few evenings and a weekend morning, as times to offer. */
function suggestedTimes() {
  const out: string[] = [];
  const d = new Date();
  for (let i = 1; out.length < 4 && i < 10; i++) {
    const day = new Date(d);
    day.setDate(d.getDate() + i);
    const dow = day.getDay();
    const label = day.toLocaleDateString('en-US', { weekday: 'long' });
    if (dow === 6) out.push(`${label}, 10:00 AM`);
    else if (dow !== 0) out.push(`${label}, ${out.length % 2 ? '7:30' : '6:00'} PM`);
  }
  return out;
}

function RequestCard({ r, incoming }: { r: PathRequest; incoming: boolean }) {
  const other = incoming ? r.from : r.to;
  const p = people[other];
  const rel = relationTo(other);
  const respond = useApp((s) => s.respondRequest);
  const toast = useUI((s) => s.showToast);
  const pathOwner = incoming ? ME : r.to;
  const [picking, setPicking] = useState(false);
  const [time, setTime] = useState<string | null>(null);
  const times = suggestedTimes();
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
        <PathHint id={pathOwner} segment={r.segment} />
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
          <Button variant="gray" size="medium" aria-expanded={picking} onClick={() => setPicking((v) => !v)}>
            Suggest a time
          </Button>
          <Button variant="plain" size="medium" onClick={() => respond(r.id, 'declined')}>
            Not now
          </Button>
        </div>
      )}
      <AnimatePresence initial={false}>
        {incoming && r.status === 'pending' && picking && (
          <motion.div className="req-times" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={springs.smooth}>
            <p className="req-times__h">When suits you? {p.first} gets a 20-minute call invite for the time you pick.</p>
            <div className="req-times__opts" role="radiogroup" aria-label="Times to suggest">
              {times.map((t) => (
                <button key={t} type="button" role="radio" aria-checked={time === t} className={`req-time ${time === t ? 'is-on' : ''}`} onClick={() => setTime(t)}>
                  {time === t && <IconCheck size={13} strokeWidth={2.6} />}
                  {t}
                </button>
              ))}
            </div>
            <div className="req-times__foot">
              <Button
                variant="filled"
                size="small"
                disabled={!time}
                onClick={() => {
                  if (!time) return;
                  respond(r.id, 'accepted', time);
                  setPicking(false);
                  toast(`Suggested ${time} to ${p.first}`);
                }}
              >
                Send this time
              </Button>
              <Button variant="plain" size="small" onClick={() => setPicking(false)}>
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
  const blocked = useApp((s) => s.blocked);
  const [tab, setTab] = useState<'in' | 'out'>('in');
  const incoming = requests.filter((r) => r.to === ME && !blocked[r.from]);
  const outgoing = requests.filter((r) => r.from === ME);
  const list = tab === 'in' ? incoming : outgoing;
  return (
    <Page title="Path Requests" subtitle="Requests arrive with the part of the Path they’re about, so you know exactly what you’re being asked." back="Network" rail={<DefaultRail people={['amara', 'elena', 'daniel']} />}>
      <div className="list-page">
        <div className="list-tabs">
          <TextTabs
            value={tab}
            onChange={setTab}
            options={[
              { value: 'in', label: 'Received', count: incoming.filter((r) => r.status === 'pending').length },
              { value: 'out', label: 'Sent', count: outgoing.length },
            ]}
          />
        </div>
        <AnimatePresence mode="popLayout">
          {list.map((r) => (
            <RequestCard key={r.id} r={r} incoming={tab === 'in'} />
          ))}
        </AnimatePresence>
      </div>
    </Page>
  );
}
