import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { people, ME } from '../data/people';
import { wp } from '../data/waypoints';
import { compactSteps, futureWaypoints, relationTo, walked, yearsLabel } from '../lib/relations';
import { springs, haptic } from '../lib/motion';
import { useApp } from '../lib/store';
import { useUI } from '../lib/ui';
import { Sheet } from './chrome';
import { Button, RelationTag, Segmented } from './ui';
import { IconCalendar, IconCheck, IconClock } from './icons';
import './request.css';

/*
  A Path Request asks about a specific stretch of someone's Path.
  You choose the segment, so every request arrives with its context attached.
*/

type Ask = 'chat' | 'question' | 'review';

function segmentsOf(id: string): [string, string, string][] {
  const steps = compactSteps(people[id].path);
  const out: [string, string, string][] = [];
  for (let i = 1; i < steps.length; i++) out.push([steps[i - 1].wp, steps[i].wp, yearsLabel(steps[i]).split(' – ')[0]]);
  return out;
}

export function bestSegment(id: string): [string, string] | undefined {
  const segs = segmentsOf(id);
  const mine = new Set(walked(people[ME]));
  const fut = futureWaypoints(people[ME]);
  const hit = segs.find(([a, b]) => mine.has(a) && fut.has(b)) ?? segs.find(([, b]) => fut.has(b)) ?? segs[segs.length - 1];
  return hit ? [hit[0], hit[1]] : undefined;
}

function suggestion(to: string, seg: [string, string] | undefined, ask: Ask) {
  const p = people[to];
  const me = people[ME];
  const now = walked(me).at(-1)!;
  if (!seg) return `Hi ${p.first} — I’d love to learn from your Path.`;
  const [a, b] = seg.map((w) => wp(w).label);
  if (ask === 'question') return `Hi ${p.first} — I’m at ${wp(now).label} and considering ${b}. What do you wish you’d known before you moved from ${a} to ${b}?`;
  if (ask === 'review') return `Hi ${p.first} — I’m applying for my first ${b} roles. Would you be open to looking over how I describe my ${wp(now).label} work?`;
  return `Hi ${p.first} — I’m at ${wp(now).label}, defending in December, and weighing a move to ${b}. Would you have 20 minutes to talk about how you went from ${a} to ${b}?`;
}

function draft(to: string, seg: [string, string] | undefined, ask: Ask, quote?: string) {
  const text = suggestion(to, seg, ask);
  return quote ? `You wrote: “${quote}”\n\n${text}` : text;
}

export function RequestLayer() {
  const req = useUI((s) => s.request);
  const close = useUI((s) => s.closeRequest);
  const openBooking = useUI((s) => s.openBooking);
  const toast = useUI((s) => s.showToast);
  const send = useApp((s) => s.sendRequest);
  const [shown, setShown] = useState(req);
  const [seg, setSeg] = useState<[string, string] | undefined>();
  const [ask, setAsk] = useState<Ask>('chat');
  const [message, setMessage] = useState('');
  const [edited, setEdited] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!req) return;
    setShown(req);
    const s = req.segment ?? bestSegment(req.to);
    setSeg(s);
    const first: Ask = req.quote ? 'question' : 'chat';
    setAsk(first);
    setEdited(false);
    setSent(false);
    setMessage(draft(req.to, s, first, req.quote));
  }, [req]);

  useEffect(() => {
    if (shown && !edited) setMessage(draft(shown.to, seg, ask, shown.quote));
  }, [seg, ask, shown, edited]);

  const segs = useMemo(() => (shown ? segmentsOf(shown.to) : []), [shown]);
  if (!shown) return null;
  const p = people[shown.to];
  const rel = relationTo(p.id);

  const submit = () => {
    if (!seg) return;
    haptic([10, 40, 12]);
    setSent(true);
    send({ to: p.id, segment: seg, ask, message });
    setTimeout(() => {
      close();
      toast(`Path Request sent to ${p.first}`);
    }, 650);
  };

  return (
    <Sheet open={!!req} onClose={close} title="Path Request" width={600} label={`Path Request to ${p.name}`}>
      <div className="req">
        <div className="req__to">
          <img src={p.photo} alt="" />
          <div>
            <div className="t-headline">{p.name}</div>
            <RelationTag kind={rel.kind} label={rel.label} />
          </div>
        </div>

        <h3 className="req__h t-footnote">Ask about a part of {p.first}’s Path</h3>
        <ol className="req__segs" role="radiogroup" aria-label="Segment">
          {segs.map(([a, b, year]) => {
            const on = seg && seg[0] === a && seg[1] === b;
            return (
              <li key={`${a}-${b}`}>
                <button
                  role="radio"
                  aria-checked={!!on}
                  className={`req__seg ${on ? 'is-on' : ''}`}
                  onClick={() => {
                    haptic(4);
                    setSeg([a, b]);
                  }}
                >
                  <span className="req__track" aria-hidden="true">
                    <span className="req__dot" />
                    <span className="req__line" />
                    <span className="req__dot req__dot--end" />
                  </span>
                  <span className="req__seg-text">
                    <span className="t-subhead">
                      {wp(a).label} <span className="c-3">→</span> <strong>{wp(b).label}</strong>
                    </span>
                    <span className="t-caption1 c-2">{year}</span>
                  </span>
                  {on && (
                    <motion.span className="req__check" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={springs.snappy}>
                      <IconCheck size={14} strokeWidth={3} />
                    </motion.span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>

        <h3 className="req__h t-footnote">What are you asking for?</h3>
        <Segmented
          value={ask}
          onChange={setAsk}
          ariaLabel="Request type"
          options={[
            { value: 'chat', label: 'A conversation' },
            { value: 'question', label: 'One question' },
            { value: 'review', label: 'Feedback' },
          ]}
        />

        <label className="req__msg">
          <span className="visually-hidden">Message</span>
          <textarea
            rows={4}
            value={message}
            onChange={(e) => {
              setEdited(true);
              setMessage(e.target.value);
            }}
          />
        </label>

        {p.guide && (
          <div className="req__meta t-footnote c-2">
            <span>
              <IconCalendar size={15} /> Office hours · {p.guide.officeHours.when}
              <button type="button" className="req__book" onClick={() => openBooking(p.id, { topic: undefined })}>
                Book a spot instead
              </button>
            </span>
            <span>
              <IconClock size={15} /> {p.guide.replies}
            </span>
          </div>
        )}

        <Button variant="filled" size="large" block onClick={submit} disabled={!seg || sent} icon={sent ? <IconCheck size={19} /> : undefined}>
          {sent ? 'Sent' : `Send to ${p.first}`}
        </Button>
        <p className="req__foot t-caption1 c-2">
          {p.first} will see your Path alongside this request, with the steps you share highlighted.
        </p>
      </div>
    </Sheet>
  );
}
