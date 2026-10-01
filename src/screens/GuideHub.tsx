import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Page } from '../components/chrome';
import { IconCalendar, IconMessage } from '../components/icons';
import { Avatar, Button, Rolling, Switch } from '../components/ui';
import { conversationList } from '../data/social';
import { people, ME } from '../data/people';
import { wp } from '../data/waypoints';
import { dayLabel, fmtTime } from '../lib/booking';
import { DAY_NAMES, PARTS, PLATFORM_FEE, fmtMoney, payout, priceLabel, serviceKinds } from '../lib/guides';
import { rise } from '../lib/motion';
import { compactSteps, current } from '../lib/relations';
import { motion } from 'framer-motion';
import { useApp, type MyGuide } from '../lib/store';
import { useUI } from '../lib/ui';
import './guide-hub.css';

/*
  Your Guide hub: what being a Path Guide looks like from your side. Whether you're live, who's booked you and
  when, what you'd keep this month after PathedIn's share, the requests waiting on you, your services and hours,
  and how payouts work. The people booking you here are sample bookings from the people who already asked you
  about your Path; nothing is charged or paid in the prototype.
*/

interface Incoming {
  id: string;
  who: string;
  kind: MyGuide['services'][number]['kind'] | 'office-hours';
  title: string;
  at: Date;
  minutes: number;
  price: number;
  about: string;
}

function nextAt(daysAhead: number, hour: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hour, 0, 0, 0);
  return d;
}

/** Sample bookings from people one or two steps behind you, using the services you've switched on. */
function useIncoming(g: MyGuide): Incoming[] {
  const paid = g.services.filter((s) => s.on);
  const askers = ['lucas', 'julian', 'wei'].filter((id) => people[id]);
  const out: Incoming[] = [];
  if (g.free.officeHours) {
    out.push({ id: 'in-oh', who: askers[0], kind: 'office-hours', title: 'Office Hours', at: nextAt(((g.officeHours.day - new Date().getDay() + 7) % 7) || 7, g.officeHours.hour), minutes: Math.round(60 / g.officeHours.spots), price: 0, about: 'Getting into a research lab after a BSc' });
  }
  paid.slice(0, 2).forEach((s, i) => {
    const who = askers[(i + 1) % askers.length];
    out.push({ id: `in-${s.kind}`, who, kind: s.kind, title: serviceKinds[s.kind].label, at: nextAt(3 + i * 4, 18 + i), minutes: serviceKinds[s.kind].timed ? (s.minutes ?? serviceKinds[s.kind].minutes ?? 45) : 0, price: s.price, about: i === 0 ? 'Choosing between an RA job and applying straight to an MSc' : 'Lab skills that read well on an MSc application' });
  });
  return out.sort((a, b) => +a.at - +b.at);
}

export function GuideHub() {
  const g = useApp((s) => s.myGuide);
  const setLive = useApp((s) => s.setGuideLive);
  const requests = useApp((s) => s.requests);
  const toast = useUI((s) => s.showToast);
  const navigate = useNavigate();
  const incoming = useIncoming(g ?? ({ services: [], free: { answers: false, officeHours: false }, officeHours: { day: 3, hour: 18, spots: 3 } } as unknown as MyGuide));
  if (!g) return <Navigate to="/guide/setup" replace />;

  const waiting = requests.filter((r) => r.to === ME && r.status === 'pending').length;
  const gross = incoming.reduce((n, x) => n + x.price, 0);
  const keep = incoming.reduce((n, x) => n + payout(x.price), 0);
  const on = g.services.filter((s) => s.on);
  const days = [...new Set(g.availability.map((k) => +k.split('-')[0]))].sort();
  const parts = new Set(g.availability.map((k) => k.split('-')[1]));
  const hoursLabel = days.length ? `${days.map((d) => DAY_NAMES[d]).join(', ')}, ${PARTS.filter((p) => parts.has(p.key)).map((p) => p.label.toLowerCase()).join(' and ')}` : 'Not set yet';
  const steps = compactSteps(people[ME].path);

  return (
    <Page title="Your Guide hub" subtitle="Who’s booked you, what you’d keep, and everything you offer." back="Home">
      <div className="ghub">
        <section className={`ghub-status ${g.live ? 'is-live immersive' : ''}`} aria-labelledby="ghub-status">
          <div className="ghub-status__text">
            <h2 id="ghub-status" className="ghub-status__h">
              {g.live ? 'You’re live as a Path Guide' : 'Your Guide profile is paused'}
            </h2>
            <p className="ghub-status__sub">
              {g.live ? `People heading for ${g.transitions.map(([, b]) => wp(b).short).join(' and ')} can find you and book you.` : 'Nobody can book you right now. Your profile and reviews are kept.'}
            </p>
          </div>
          <Switch
            label={g.live ? 'Pause your Guide profile' : 'Go live'}
            on={g.live}
            onChange={(v) => {
              setLive(v);
              toast(v ? 'You’re live again' : 'Guide profile paused');
            }}
          />
          <div className="ghub-status__links">
            <Link to={`/p/${ME}`}>See your profile as others do</Link>
            <Link to="/guide/setup">Edit services and hours</Link>
          </div>
        </section>

        <section className="ghub-stats" aria-label="This month">
          <div>
            <strong>
              <Rolling value={incoming.length} />
            </strong>
            <span>sessions booked</span>
          </div>
          <div>
            <strong>
              <Rolling value={keep} format={fmtMoney} />
            </strong>
            <span>you’d keep, of {fmtMoney(gross)}</span>
          </div>
          <div>
            <strong>
              <Rolling value={waiting} />
            </strong>
            <span>
              <Link to="/requests">{waiting === 1 ? 'request waiting' : 'requests waiting'}</Link>
            </span>
          </div>
        </section>

        <section className="ghub-sec" aria-labelledby="ghub-next">
          <header className="ghub-sec__head">
            <h2 id="ghub-next" className="ghub-sec__h">
              Coming up
            </h2>
            <p className="ghub-sec__sub">Sample bookings from people who asked you about your Path.</p>
          </header>
          <div className="card-stack">
            {incoming.map((x, i) => {
              const p = people[x.who];
              const convo = conversationList.find((c) => c.with === x.who);
              return (
                <motion.article key={x.id} className="ghub-booking" {...rise(i, 6)}>
                  <span className="ghub-booking__date" aria-hidden="true">
                    <span>{x.at.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    <strong>{x.at.getDate()}</strong>
                  </span>
                  <Avatar id={x.who} size={40} />
                  <div className="ghub-booking__text">
                    <p className="ghub-booking__title">
                      {x.title} with {p.first}
                    </p>
                    <p className="ghub-booking__meta">
                      {x.minutes ? `${dayLabel(x.at)} · ${fmtTime(x.at)} · ${x.minutes} min` : `Notes due ${dayLabel(x.at)}`} · at {wp(current(p).wp).short}
                    </p>
                    <p className="ghub-booking__about">“{x.about}”</p>
                  </div>
                  <div className="ghub-booking__end">
                    <span className="ghub-booking__price">{x.price ? `${fmtMoney(payout(x.price))} to you` : 'Free'}</span>
                    <Button variant="gray" size="small" icon={<IconMessage size={15} />} onClick={() => navigate(convo ? `/messages/${convo.id}` : `/messages?to=${x.who}`)}>
                      Message
                    </Button>
                  </div>
                </motion.article>
              );
            })}
            {!incoming.length && <p className="ghub-empty">Switch on Office Hours or a paid service and bookings show up here.</p>}
          </div>
        </section>

        <section className="ghub-sec" aria-labelledby="ghub-offer">
          <header className="ghub-sec__head">
            <h2 id="ghub-offer" className="ghub-sec__h">
              What you offer
            </h2>
            <Link to="/guide/setup" className="ghub-sec__more">
              Edit
            </Link>
          </header>
          <ul className="ghub-list">
            <li>
              <span>Moves you guide</span>
              <strong>{g.transitions.map(([a, b]) => `${wp(a).short} → ${wp(b).short}`).join(', ') || steps.map((s) => wp(s.wp).short).join(' → ')}</strong>
            </li>
            <li>
              <span>Office Hours</span>
              <strong>{g.free.officeHours ? `${DAY_NAMES[g.officeHours.day]}s at ${g.officeHours.hour % 12 || 12} ${g.officeHours.hour < 12 ? 'AM' : 'PM'} · ${g.officeHours.spots} spots · free` : 'Off'}</strong>
            </li>
            {on.map((s) => (
              <li key={s.kind}>
                <span>{serviceKinds[s.kind].label}</span>
                <strong>
                  {priceLabel({ price: s.price, per: serviceKinds[s.kind].per })} · you keep {fmtMoney(payout(s.price))}
                </strong>
              </li>
            ))}
            <li>
              <span>Paid sessions</span>
              <strong>{hoursLabel}</strong>
            </li>
          </ul>
        </section>

        <section className="ghub-sec" aria-labelledby="ghub-pay">
          <header className="ghub-sec__head">
            <h2 id="ghub-pay" className="ghub-sec__h">
              Payouts
            </h2>
          </header>
          <div className="ghub-pay">
            <IconCalendar size={20} />
            <p>
              PathedIn keeps {Math.round(PLATFORM_FEE * 100)}% of each paid session and pays you the rest on the first of the month. Free Office Hours and answers are never charged. <strong>This prototype moves no money</strong>, so there’s no bank account to add.
            </p>
          </div>
        </section>

        <section className="ghub-sec" aria-labelledby="ghub-rev">
          <header className="ghub-sec__head">
            <h2 id="ghub-rev" className="ghub-sec__h">
              Reviews
            </h2>
          </header>
          <p className="ghub-empty">No reviews yet. After a session, the person you helped can review it, and reviews build your standing in each community.</p>
        </section>
      </div>
    </Page>
  );
}
