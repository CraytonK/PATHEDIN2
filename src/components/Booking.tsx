import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { people } from '../data/people';
import { wp } from '../data/waypoints';
import { dayLabel, downloadIcs, fmtDay, fmtTime, parseHours, sessionsFor, spotLength, useUpcomingBooking, type Slot } from '../lib/booking';
import { haptic, springs, useIsMobile } from '../lib/motion';
import { useApp, type Booking } from '../lib/store';
import { useUI } from '../lib/ui';
import { Sheet } from './chrome';
import { IconCalendar, IconCheck, IconClock, IconPeople } from './icons';
import { Button } from './ui';
import './booking.css';

/*
  Booking a Path Guide's office hours: pick one of their next three sessions, pick a spot, say which part
  of their Path you want to talk about, and leave a note. It confirms on a ticket you can drop into your
  calendar, and the booking waits at the top of Coming up on Home.
*/

export function BookButton({
  id,
  size = 'small',
  variant = 'filled',
  label = 'Book',
  topic,
}: {
  id: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'filled' | 'tinted' | 'gray' | 'ink' | 'outline';
  label?: string;
  topic?: string;
}) {
  const open = useUI((s) => s.openBooking);
  const held = useUpcomingBooking(id);
  if (held) {
    const at = new Date(held.at);
    return (
      <Button
        variant="tinted"
        size={size}
        icon={<IconCheck size={15} strokeWidth={2.4} />}
        aria-label={`Booked with ${people[id].first}, ${fmtDay(at)} at ${fmtTime(at)}. Open booking`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          open(id, { booking: held.id });
        }}
      >
        Booked · {at.toLocaleDateString('en-US', { weekday: 'short' })}
      </Button>
    );
  }
  return (
    <Button
      variant={variant}
      size={size}
      icon={<IconCalendar size={15} />}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        open(id, { topic });
      }}
    >
      {label}
    </Button>
  );
}

function MoveLine({ from, to }: { from: string; to: string }) {
  return (
    <span className="bk-move">
      <span>{wp(from).short}</span>
      <svg width="30" height="10" viewBox="0 0 30 10" aria-hidden="true">
        <path d="M8 5h14" stroke="var(--tint)" strokeWidth="2" strokeLinecap="round" strokeDasharray="2.5 3.5" />
        <circle cx="4.5" cy="5" r="3.2" fill="var(--ink)" />
        <circle cx="25.5" cy="5" r="3" fill="none" stroke="var(--tint)" strokeWidth="1.8" />
      </svg>
      <strong>{wp(to).short}</strong>
    </span>
  );
}

function GuidePanel({ id }: { id: string }) {
  const g = people[id];
  const guide = g.guide!;
  return (
    <aside className="bk__guide">
      <Link to={`/p/${id}`} className="bk__who">
        <img src={g.photo} alt="" />
        <span>
          <span className="bk__name">{g.name}</span>
          <span className="bk__headline">{g.headline}</span>
        </span>
      </Link>
      <div className="bk__moves">
        {guide.transitions.map(([a, b]) => (
          <MoveLine key={`${a}-${b}`} from={a} to={b} />
        ))}
      </div>
      <ul className="bk__facts">
        <li>
          <IconCalendar size={15} /> {guide.officeHours.when}
        </li>
        <li>
          <IconClock size={15} /> {guide.replies}
        </li>
        <li>
          <IconPeople size={15} /> Has helped {guide.helped} people
        </li>
      </ul>
      <p className="bk__free">Guides are never paid, ranked or rated. {g.first} gives this time because someone once did the same.</p>
    </aside>
  );
}

/** A check that draws itself in a navy ring. */
function DoneMark() {
  return (
    <svg className="bk-done__mark" width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
      <motion.circle cx="32" cy="32" r="29" fill="none" stroke="var(--tint)" strokeWidth="2.5" initial={{ pathLength: 0, rotate: -90 }} animate={{ pathLength: 1 }} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }} style={{ originX: '50%', originY: '50%' }} />
      <motion.path d="M21 33l7.5 7.5L44 25" fill="none" stroke="var(--tint)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35, delay: 0.4, ease: [0.16, 1, 0.3, 1] }} />
    </svg>
  );
}

function Ticket({ b, onCancel, onDone, fresh }: { b: Booking; onCancel: () => void; onDone: () => void; fresh: boolean }) {
  const g = people[b.guide];
  const start = new Date(b.at);
  const end = new Date(start.getTime() + b.minutes * 60_000);
  return (
    <motion.div className="bk-done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={springs.smooth}>
      <DoneMark />
      <h2 className="bk-done__title">{fresh ? `You’re booked with ${g.first}` : `Office hours with ${g.first}`}</h2>
      <p className="bk-done__sub">{g.first} will see your Path and your note before you meet.</p>
      <div className="bk-ticket">
        <div className="bk-ticket__stub" aria-hidden="true">
          <span className="bk-ticket__dow">{start.toLocaleDateString('en-US', { weekday: 'short' })}</span>
          <span className="bk-ticket__day">{start.getDate()}</span>
          <span className="bk-ticket__month">{start.toLocaleDateString('en-US', { month: 'short' })}</span>
        </div>
        <dl className="bk-ticket__body">
          <div>
            <dt>When</dt>
            <dd>
              {fmtDay(start)}
              <span className="bk-ticket__time">
                {fmtTime(start)} – {fmtTime(end)} · {b.minutes} minutes
              </span>
            </dd>
          </div>
          <div>
            <dt>With</dt>
            <dd className="bk-ticket__with">
              <img src={g.photo} alt="" /> {g.name}
            </dd>
          </div>
          <div>
            <dt>About</dt>
            <dd>{b.topic}</dd>
          </div>
          {b.note && (
            <div>
              <dt>Your note</dt>
              <dd className="bk-ticket__note">{b.note}</dd>
            </div>
          )}
        </dl>
      </div>
      <div className="bk-done__actions">
        <Button variant="outline" size="medium" icon={<IconCalendar size={16} />} onClick={() => downloadIcs(b)}>
          Add to calendar
        </Button>
        <Button variant="filled" size="medium" onClick={onDone}>
          Done
        </Button>
      </div>
      <button type="button" className="bk-done__cancel" onClick={onCancel}>
        Cancel this booking
      </button>
    </motion.div>
  );
}

function SlotButton({ s, on, onPick }: { s: Slot; on: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      disabled={s.taken}
      className={`bk-slot ${on ? 'is-on' : ''} ${s.mine ? 'is-mine' : s.taken ? 'is-taken' : ''}`}
      onClick={onPick}
    >
      {on && <motion.span layoutId="bk-slot" className="bk-slot__fill" transition={springs.snappy} />}
      <span className="bk-slot__time">{fmtTime(s.start)}</span>
      {s.taken && <span className="bk-slot__state">{s.mine ? 'Yours' : 'Taken'}</span>}
    </button>
  );
}

export function BookingLayer() {
  const req = useUI((s) => s.book);
  const close = useUI((s) => s.closeBooking);
  const toast = useUI((s) => s.showToast);
  const bookings = useApp((s) => s.bookings);
  const book = useApp((s) => s.book);
  const cancel = useApp((s) => s.cancelBooking);
  const isMobile = useIsMobile();
  const [shown, setShown] = useState(req);
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState<number | null>(null);
  const [topic, setTopic] = useState('');
  const [note, setNote] = useState('');
  const [done, setDone] = useState<{ id: string; fresh: boolean } | null>(null);

  useEffect(() => {
    if (!req) return;
    setShown(req);
    setDay(0);
    setSlot(null);
    setNote('');
    setDone(req.booking ? { id: req.booking, fresh: false } : null);
    const g = people[req.guide].guide;
    setTopic(req.topic ?? g?.helpsWith[0] ?? '');
    // Only when a different request opens; the booking list changing underneath shouldn't reset the form.
  }, [req]);

  const sessions = useMemo(() => (shown ? sessionsFor(shown.guide, bookings) : []), [shown, bookings]);

  // Start on the first session with room.
  useEffect(() => {
    if (!shown || done) return;
    const first = sessions.findIndex((s) => s.slots.some((x) => !x.taken));
    setDay(first < 0 ? 0 : first);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);

  if (!shown) return null;
  const g = people[shown.guide];
  const guide = g.guide;
  if (!guide) return null;
  const session = sessions[day];
  const picked = session && slot !== null ? session.slots[slot] : undefined;
  const minutes = spotLength(g.id);
  const zoned = parseHours(guide.officeHours.when).zone;
  const held = done ? bookings.find((b) => b.id === done.id) : undefined;
  const topics = [...guide.helpsWith, 'Something else'];
  const openLeft = session ? session.slots.filter((x) => !x.taken).length : 0;
  const when = session ? dayLabel(session.start) : '';
  const onWhen = when === 'Today' || when === 'Tomorrow' ? when.toLowerCase() : `on ${when}`;

  const submit = () => {
    if (!picked) return;
    haptic([10, 40, 12]);
    const id = book({ guide: g.id, at: picked.start.toISOString(), minutes, topic, note: note.trim() });
    setDone({ id, fresh: true });
  };

  return (
    <Sheet open={!!req} onClose={close} title={held && !done?.fresh ? 'Your booking' : 'Book office hours'} width={shown.booking ? 560 : 780} label={`Book office hours with ${g.name}`}>
      <AnimatePresence mode="wait" initial={false}>
        {held ? (
          <Ticket
            key="done"
            b={held}
            fresh={!!done?.fresh}
            onDone={close}
            onCancel={() => {
              cancel(held.id);
              close();
              toast(`Booking with ${g.first} cancelled`);
            }}
          />
        ) : (
          <motion.div key="form" className="bk" exit={{ opacity: 0, transition: { duration: 0.12 } }}>
            {isMobile ? (
              <Link to={`/p/${g.id}`} className="bk__who bk__who--compact" onClick={close}>
                <img src={g.photo} alt="" />
                <span>
                  <span className="bk__name">{g.name}</span>
                  <span className="bk__headline">
                    {guide.officeHours.when} · {guide.replies}
                  </span>
                </span>
              </Link>
            ) : (
              <GuidePanel id={g.id} />
            )}

            <div className="bk__main">
              <section className="bk__step">
                <header className="bk__head">
                  <h3>Choose a session</h3>
                  <span>{zoned ? 'Converted to your time zone' : 'In your time zone'}</span>
                </header>
                <div className="bk-days" role="radiogroup" aria-label="Session">
                  {sessions.map((s, i) => {
                    const open = s.slots.filter((x) => !x.taken).length;
                    const on = i === day;
                    return (
                      <button
                        key={s.key}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        className={`bk-day ${on ? 'is-on' : ''} ${open === 0 ? 'is-full' : ''}`}
                        onClick={() => {
                          haptic(4);
                          setDay(i);
                          setSlot(null);
                        }}
                      >
                        {on && <motion.span layoutId="bk-day" className="bk-day__fill" transition={springs.snappy} />}
                        <span className="bk-day__dow">{s.start.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                        <span className="bk-day__num">{s.start.getDate()}</span>
                        <span className="bk-day__month">{s.start.toLocaleDateString('en-US', { month: 'short' })}</span>
                        <span className="bk-day__open">{open === 0 ? 'Full' : `${open} open`}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {session && (
                <section className="bk__step">
                  <header className="bk__head">
                    <h3>Pick a spot</h3>
                    <span>
                      {dayLabel(session.start)}, {fmtTime(session.start)} – {fmtTime(session.end)} · {minutes} minutes each
                    </span>
                  </header>
                  <div className={`bk-slots bk-slots--${session.slots.length}`} role="radiogroup" aria-label="Time">
                    {session.slots.map((s, i) => (
                      <SlotButton
                        key={s.start.toISOString()}
                        s={s}
                        on={slot === i}
                        onPick={() => {
                          haptic(4);
                          setSlot(i);
                        }}
                      />
                    ))}
                  </div>
                </section>
              )}

              <section className="bk__step">
                <header className="bk__head">
                  <h3>What do you want to talk about?</h3>
                </header>
                <div className="bk-topics" role="radiogroup" aria-label="Topic">
                  {topics.map((t) => (
                    <button key={t} type="button" role="radio" aria-checked={topic === t} className={`bk-topic ${topic === t ? 'is-on' : ''}`} onClick={() => setTopic(t)}>
                      {topic === t && <IconCheck size={13} strokeWidth={2.6} />}
                      {t}
                    </button>
                  ))}
                </div>
                <label className="bk-note">
                  <span className="visually-hidden">A note for {g.first}</span>
                  <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder={`Anything ${g.first} should read first? Where you are on your Path, or the question you most want answered.`} />
                </label>
              </section>

              <footer className="bk__foot">
                <div className="bk__summary" aria-live="polite">
                  {picked ? (
                    <>
                      <strong>
                        {dayLabel(picked.start)}, {fmtTime(picked.start)} – {fmtTime(picked.end)}
                      </strong>
                      <span>
                        {minutes} minutes with {g.first}
                      </span>
                    </>
                  ) : (
                    <>
                      <strong>Pick a spot</strong>
                      <span>{session && (openLeft ? `${openLeft} open ${onWhen}` : `Full ${onWhen}. Try another session.`)}</span>
                    </>
                  )}
                </div>
                <Button variant="filled" size="medium" disabled={!picked} onClick={submit}>
                  Book {minutes} minutes
                </Button>
              </footer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  );
}
