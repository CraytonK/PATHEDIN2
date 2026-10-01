import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Page } from '../components/chrome';
import { DefaultRail } from '../components/Rail';
import { IconCalendar, IconClock, IconMessage, IconStar } from '../components/icons';
import { Avatar, Button, TextTabs } from '../components/ui';
import { conversationList } from '../data/social';
import { people } from '../data/people';
import { pastSessions } from '../data/sessions';
import { dayLabel, downloadIcs, fmtDay, fmtTime } from '../lib/booking';
import { bookingTitle, fmtMoney, serviceKinds } from '../lib/guides';
import { rise } from '../lib/motion';
import { useApp, type Booking } from '../lib/store';
import { useUI } from '../lib/ui';
import './sessions.css';

/*
  Your sessions: everything you've booked with a Guide, coming up and past. Each upcoming session can be added to a
  calendar, moved to another time, talked about with the Guide, or cancelled; each past one can be reviewed, and
  your review joins the Guide's on their profile. Paid sessions show what was paid; the prototype takes no payment.
*/

type Tab = 'upcoming' | 'past';

const endOf = (b: Booking) => new Date(b.at).getTime() + b.minutes * 60_000;

function useSessions() {
  const bookings = useApp((s) => s.bookings);
  const now = Date.now();
  const upcoming = bookings.filter((b) => endOf(b) > now).sort((a, b) => +new Date(a.at) - +new Date(b.at));
  const past = [...bookings.filter((b) => endOf(b) <= now), ...pastSessions].sort((a, b) => +new Date(b.at) - +new Date(a.at));
  return { upcoming, past };
}

export function Sessions() {
  const { upcoming, past } = useSessions();
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get('tab') === 'past' ? 'past' : 'upcoming';
  const setTab = (t: Tab) => setParams(t === 'upcoming' ? {} : { tab: t }, { replace: true });
  const reviews = useApp((s) => s.reviews);
  const toReview = past.filter((b) => !reviews[b.id]).length;
  return (
    <Page title="Your sessions" subtitle="Office Hours and sessions you’ve booked with Path Guides." back="Home" rail={<DefaultRail people={['amara', 'grace', 'priya']} />}>
      <div className="sessions">
        <TextTabs
          value={tab}
          onChange={setTab}
          options={[
            { value: 'upcoming', label: 'Coming up', count: upcoming.length },
            { value: 'past', label: toReview ? `Past · ${toReview} to review` : 'Past', count: toReview ? undefined : past.length },
          ]}
        />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={tab} className="card-stack" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}>
            {tab === 'upcoming' ? (
              upcoming.length ? (
                upcoming.map((b, i) => <SessionCard key={b.id} b={b} i={i} />)
              ) : (
                <div className="sessions__empty">
                  <IconCalendar size={28} />
                  <p className="t-headline">Nothing booked yet</p>
                  <p className="t-subhead c-2">Office Hours are free, and Guides list their paid sessions with prices up front.</p>
                  <Link to="/guides" className="btn btn--filled btn--medium">
                    Find a Path Guide
                  </Link>
                </div>
              )
            ) : (
              past.map((b, i) => <SessionCard key={b.id} b={b} i={i} past />)
            )}
          </motion.div>
        </AnimatePresence>
        <p className="sessions__fine">Paid sessions show what you’d pay. This prototype takes no payment and stores your sessions on this device.</p>
      </div>
    </Page>
  );
}

function SessionCard({ b, i, past }: { b: Booking; i: number; past?: boolean }) {
  const g = people[b.guide];
  const at = new Date(b.at);
  const async = b.minutes === 0;
  const openBooking = useUI((s) => s.openBooking);
  const cancel = useApp((s) => s.cancelBooking);
  const toast = useUI((s) => s.showToast);
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const convo = conversationList.find((c) => c.with === b.guide);
  const movable = !async && (!b.service || (serviceKinds[b.service].timed && b.service !== 'group' && b.service !== 'workshop'));
  const when = async ? `Notes back by ${fmtDay(at)}` : `${dayLabel(at)} · ${fmtTime(at)} – ${fmtTime(new Date(endOf(b)))}`;
  return (
    <motion.article className={`session ${past ? 'is-past' : ''}`} {...rise(i, 8)}>
      <div className="session__top">
        <span className="session__date" aria-hidden="true">
          <span>{at.toLocaleDateString('en-US', { weekday: 'short' })}</span>
          <strong>{at.getDate()}</strong>
          <span>{at.toLocaleDateString('en-US', { month: 'short' })}</span>
        </span>
        <div className="session__text">
          <h2 className="session__title">{bookingTitle(b)}</h2>
          <p className="session__when">
            {when}
            {!async && <span className="c-3"> · {b.minutes} min</span>}
          </p>
          <p className="session__about">{b.topic}</p>
        </div>
        <Link to={`/p/${g.id}`} className="session__guide" aria-label={`${g.name}'s profile`}>
          <Avatar id={g.id} size={40} peek={false} />
        </Link>
      </div>
      <p className="session__price">{b.price ? `${fmtMoney(b.price)} CAD${past ? ' · paid' : ''}` : 'Free'}</p>

      {past ? (
        <Review b={b} />
      ) : confirm ? (
        <div className="session__confirm" role="group" aria-label="Cancel this session?">
          <p>
            Cancel {bookingTitle(b).toLowerCase().startsWith('office') ? 'your Office Hours' : 'this session'} with {g.first}? {b.price ? 'You wouldn’t be charged.' : 'The spot opens for someone else.'}
          </p>
          <div className="session__actions">
            <Button
              variant="filled"
              size="small"
              className="btn--danger"
              onClick={() => {
                cancel(b.id);
                toast(`Session with ${g.first} cancelled`);
              }}
            >
              Cancel session
            </Button>
            <Button variant="plain" size="small" onClick={() => setConfirm(false)}>
              Keep it
            </Button>
          </div>
        </div>
      ) : (
        <div className="session__actions">
          {!async && (
            <Button variant="outline" size="small" icon={<IconCalendar size={15} />} onClick={() => downloadIcs(b)}>
              Add to calendar
            </Button>
          )}
          {movable && (
            <Button variant="gray" size="small" icon={<IconClock size={15} />} onClick={() => openBooking(b.guide, { booking: b.id, reschedule: true })}>
              Change time
            </Button>
          )}
          <Button variant="gray" size="small" icon={<IconMessage size={15} />} onClick={() => navigate(convo ? `/messages/${convo.id}` : `/messages?to=${g.id}`)}>
            Message {g.first}
          </Button>
          <button type="button" className="session__cancel" onClick={() => setConfirm(true)}>
            Cancel
          </button>
        </div>
      )}
    </motion.article>
  );
}

/** A review of a past session: five stars and a line, then it shows as yours. */
function Review({ b }: { b: Booking }) {
  const mine = useApp((s) => s.reviews[b.id]);
  const save = useApp((s) => s.reviewBooking);
  const toast = useUI((s) => s.showToast);
  const g = people[b.guide];
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState('');
  const [open, setOpen] = useState(false);
  if (mine) {
    return (
      <div className="session__review is-done">
        <span className="session__stars" role="img" aria-label={`You rated it ${mine.stars} out of 5`}>
          {Array.from({ length: 5 }, (_, k) => (
            <IconStar key={k} size={15} filled={k < mine.stars} />
          ))}
        </span>
        {mine.body && <p className="session__review-body">“{mine.body}”</p>}
        <p className="session__review-note">Your review is on {g.first}’s Guide profile.</p>
      </div>
    );
  }
  if (!open) {
    return (
      <div className="session__actions">
        <Button variant="tinted" size="small" icon={<IconStar size={15} />} onClick={() => setOpen(true)}>
          Review this session
        </Button>
        <Link to={`/p/${g.id}`} className="session__link">
          Book {g.first} again
        </Link>
      </div>
    );
  }
  const shown = hover || stars;
  return (
    <form
      className="session__review"
      onSubmit={(e) => {
        e.preventDefault();
        if (!stars) return;
        save(b.id, { stars, body: body.trim() });
        toast(`Thanks. Your review is on ${g.first}’s profile`);
      }}
    >
      <fieldset className="session__rate" onMouseLeave={() => setHover(0)}>
        <legend>How was it?</legend>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" aria-label={`${n} star${n > 1 ? 's' : ''}`} aria-pressed={stars === n} className={n <= shown ? 'is-on' : ''} onMouseEnter={() => setHover(n)} onClick={() => setStars(n)}>
            <IconStar size={22} filled={n <= shown} />
          </button>
        ))}
      </fieldset>
      <label className="session__review-field">
        <span>What helped, for someone thinking of booking {g.first}?</span>
        <textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} maxLength={400} placeholder="One or two sentences is plenty." />
      </label>
      <div className="session__actions">
        <Button variant="filled" size="small" disabled={!stars} type="submit">
          Post review
        </Button>
        <Button variant="plain" size="small" onClick={() => setOpen(false)}>
          Not now
        </Button>
      </div>
    </form>
  );
}
