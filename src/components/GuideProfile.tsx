import { motion } from 'framer-motion';
import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { people, ME } from '../data/people';
import { communities } from '../data/communities';
import { wp } from '../data/waypoints';
import type { GuideEconomy, GuideService } from '../data/types';
import { compactSteps, current, stepTitle } from '../lib/relations';
import { PLATFORM_FEE, communityGuides, contributions, economyOf, fmtMoney, fromPrice, payout, priceLabel, serviceKinds, servicesOf, standingOf, useGuide } from '../lib/guides';
import { dayLabel, fmtTime, sessionsFor } from '../lib/booking';
import { rise } from '../lib/motion';
import { useApp } from '../lib/store';
import { useUI } from '../lib/ui';
import { BookButton, Stars } from './Booking';
import { pastSessions } from '../data/sessions';
import { RequestButton } from './content';
import { Avatar, CountUp } from './ui';
import { IconCalendar, IconChevronRight, IconSignpost, IconStar } from './icons';
import './guide-profile.css';

/*
  A Guide's profile answers four questions in order: why should I trust them (the Path they actually walked,
  with the moves they guide marked on it), what are they known for (standing, reviews, contributions), what can
  I get (services and prices), and when (availability).
*/

/** Their walked Path as a line, with the moves they guide drawn heavier and named. */
export function GuidePath({ id, moves }: { id: string; moves: [string, string][] }) {
  const steps = compactSteps(people[id].path);
  const guided = (i: number) => i > 0 && moves.some(([a, b]) => steps[i - 1].wp === a && steps[i].wp === b);
  return (
    <ol className="gpath" aria-label={`${people[id].first}’s Path, with the moves they guide`}>
      {steps.map((s, i) => (
        <Fragment key={`${s.wp}-${i}`}>
          {i > 0 && (
            <li className={`gpath__link ${guided(i) ? 'is-guided' : ''}`} aria-hidden={!guided(i)}>
              <motion.span className="gpath__bar" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 + i * 0.12, ease: [0.16, 1, 0.3, 1] }} />
              {guided(i) && <span className="gpath__tag">Guides</span>}
            </li>
          )}
          <li className={`gpath__stop ${i === steps.length - 1 ? 'is-now' : ''}`}>
            <span className="gpath__node" aria-hidden="true" />
            <span className="gpath__label">{wp(s.wp).short}</span>
            <span className="gpath__years">{s.end ? `${s.start}–${s.end}` : `${s.start} – now`}</span>
          </li>
        </Fragment>
      ))}
    </ol>
  );
}

function ServiceCard({ id, s, i, bookable }: { id: string; s: GuideService; i: number; bookable: boolean }) {
  const Icon = serviceKinds[s.kind].icon;
  const meta = [s.minutes ? `${s.minutes} min` : s.delivery, s.per === 'month' ? 'monthly' : s.per === 'seat' && s.seats ? `${s.seats} seats` : undefined].filter(Boolean).join(' · ');
  return (
    <motion.li className={`gsvc ${s.price === 0 ? 'is-free' : ''}`} {...rise(i, 10)}>
      <span className="gsvc__icon">
        <Icon size={18} strokeWidth={1.8} />
      </span>
      <div className="gsvc__text">
        <p className="gsvc__title">{s.title}</p>
        <p className="gsvc__blurb">{s.blurb}</p>
        <p className="gsvc__meta">{meta}</p>
      </div>
      <div className="gsvc__buy">
        <span className="gsvc__price">{priceLabel(s)}</span>
        {bookable && <BookButton id={id} service={s.id} size="small" variant={s.price === 0 ? 'tinted' : 'filled'} label={s.kind === 'group' || s.kind === 'workshop' ? 'Reserve' : s.kind === 'resume' || s.kind === 'portfolio' ? 'Request' : 'Book'} />}
      </div>
    </motion.li>
  );
}

/** Reviews you wrote for this Guide, from Your sessions: they lead the list, marked as yours. */
function useMyReviews(guide: string) {
  const reviews = useApp((s) => s.reviews);
  const bookings = useApp((s) => s.bookings);
  return [...bookings, ...pastSessions]
    .filter((b) => b.guide === guide && reviews[b.id])
    .map((b) => ({ id: `mine-${b.id}`, rating: reviews[b.id].stars, body: reviews[b.id].body, label: b.title ?? 'Office Hours', at: reviews[b.id].at }));
}

function Reviews({ econ, guide }: { econ: GuideEconomy; guide: string }) {
  const mine = useMyReviews(guide);
  if (!econ.reviews.length && !mine.length) return <p className="gp__empty">No reviews yet. They appear here after someone’s first paid session.</p>;
  return (
    <>
      <div className="grev__sum">
        <span className="grev__big">{econ.rating.toFixed(1)}</span>
        <span className="grev__of">
          <Stars value={econ.rating} size={15} />
          <span>{econ.reviewCount} reviews</span>
        </span>
      </div>
      <ul className="grev">
        {mine.map((r) => (
          <li key={r.id} className="grev__item grev__item--mine">
            <div className="grev__who">
              <Avatar id={ME} size={32} />
              <span className="grev__name">
                <Link to={`/p/${ME}`}>You</Link>
                <span>Your review · just now</span>
              </span>
              <Stars value={r.rating} />
            </div>
            {r.body && <p className="grev__body">{r.body}</p>}
            <span className="grev__svc">{r.label}</span>
          </li>
        ))}
        {econ.reviews.map((r, i) => (
          <motion.li key={r.id} className="grev__item" {...rise(i, 10)}>
            <div className="grev__who">
              <Avatar id={r.author} size={32} />
              <span className="grev__name">
                <Link to={`/p/${r.author}`}>{people[r.author].name}</Link>
                <span>
                  at {stepTitle(current(people[r.author]))} · {r.ago}
                </span>
              </span>
              <Stars value={r.rating} />
            </div>
            <p className="grev__body">{r.body}</p>
            <span className="grev__svc">{serviceKinds[r.service].label}</span>
          </motion.li>
        ))}
      </ul>
    </>
  );
}

function Availability({ id, econ, when }: { id: string; econ: GuideEconomy; when: string }) {
  const bookings = useApp((s) => s.bookings);
  const sessions = people[id].guide && id !== ME ? sessionsFor(id, bookings, 3) : [];
  return (
    <div className="gavail">
      <div className="gavail__row">
        <span className="gavail__kind">Free Office Hours</span>
        <span className="gavail__when">{when}</span>
      </div>
      {sessions.length > 0 && (
        <ul className="gavail__days">
          {sessions.map((s) => {
            const open = s.slots.filter((x) => !x.taken).length;
            return (
              <li key={s.key} className={open ? '' : 'is-full'}>
                <strong>{dayLabel(s.start)}</strong>
                <span>
                  {fmtTime(s.start)} · {open ? `${open} of ${s.slots.length} open` : 'Full'}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <div className="gavail__row">
        <span className="gavail__kind">Paid sessions</span>
        <span className="gavail__when">{econ.paid.label}</span>
      </div>
    </div>
  );
}

/** The Guide tab on a profile. */
export function GuideTab({ id }: { id: string }) {
  const guide = useGuide(id);
  const openRequest = useUI((s) => s.openRequest);
  if (!guide) return null;
  const { profile, econ } = guide;
  const self = id === ME;
  const p = people[id];
  const services = self ? econ.services : servicesOf(id);
  const c = contributions(id);
  const standing = standingOf(id);
  return (
    <div className="gp">
      <section className="gp__section">
        <header className="gp__head">
          <h2 className="gp__h">Why {self ? 'people can trust you' : `${p.first} knows this road`}</h2>
          <p className="gp__sub">{econ.experience}</p>
        </header>
        <GuidePath id={id} moves={profile.transitions} />
        <p className="gpath__legend">The heavy lines are the moves {self ? 'you guide' : `${p.first} guides`}, on the Path {self ? 'you' : 'they'} actually walked.</p>
      </section>

      <section className="gp__stats" aria-label="Standing">
        <div className="gp__stat">
          <span className="gp__num">
            {econ.rating ? econ.rating.toFixed(1) : 'New'}
            {econ.rating > 0 && <IconStar size={18} filled className="gp__star" />}
          </span>
          <span className="gp__label">{econ.reviewCount} reviews</span>
        </div>
        <div className="gp__stat">
          <span className="gp__num">
            <CountUp value={profile.helped} />
          </span>
          <span className="gp__label">people helped</span>
        </div>
        <div className="gp__stat">
          <span className="gp__num">
            <CountUp value={econ.followers} />
          </span>
          <span className="gp__label">followers</span>
        </div>
        <div className="gp__stat">
          <span className="gp__num">{econ.since}</span>
          <span className="gp__label">Guide since</span>
        </div>
      </section>

      {standing.length > 0 && (
        <section className="gp__section">
          <header className="gp__head">
            <h2 className="gp__h">Known in</h2>
          </header>
          <ul className="gstand">
            {standing.map((s, i) => (
              <motion.li key={s.community} {...rise(i, 8)}>
                <Link to={`/c/${s.community}`} className={`gstand__item ${s.rank === 1 ? 'is-top' : ''}`}>
                  <span className="gstand__rank">{`No. ${s.rank}`}</span>
                  <span className="gstand__text">
                    <strong>{s.label}</strong>
                    <span>{s.title}</span>
                  </span>
                  <IconChevronRight size={15} className="gstand__chev" data-dir="forward" />
                </Link>
              </motion.li>
            ))}
          </ul>
        </section>
      )}

      <section className="gp__section">
        <header className="gp__head">
          <h2 className="gp__h">Expertise</h2>
        </header>
        <ul className="gexp">
          {econ.expertise.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </section>

      <section className="gp__section">
        <header className="gp__head">
          <h2 className="gp__h">{self ? 'What you offer' : `How ${p.first} can help`}</h2>
          <p className="gp__sub">{self ? `PathedIn keeps ${Math.round(PLATFORM_FEE * 100)}% of paid sessions. Free guidance stays free.` : 'Prices in Canadian dollars. Office Hours are always free.'}</p>
        </header>
        <ul className="gsvcs">
          {services.map((s, i) => (
            <ServiceCard key={s.id} id={id} s={s} i={i} bookable={!self} />
          ))}
        </ul>
        {self && services.some((s) => s.price > 0) && (
          <p className="gp__earn">
            You keep {services.filter((s) => s.price > 0).map((s) => `${fmtMoney(payout(s.price))} of ${fmtMoney(s.price)}`).join(', ')}.
          </p>
        )}
      </section>

      <section className="gp__section">
        <header className="gp__head">
          <h2 className="gp__h">Availability</h2>
        </header>
        <Availability id={id} econ={econ} when={profile.officeHours.when} />
      </section>

      <section className="gp__section">
        <header className="gp__head">
          <h2 className="gp__h">Reviews</h2>
        </header>
        <Reviews econ={econ} guide={id} />
      </section>

      <section className="gp__section">
        <header className="gp__head">
          <h2 className="gp__h">Contributions</h2>
          <p className="gp__sub">Free guidance in the communities, on the record.</p>
        </header>
        <ul className="gcontrib">
          <li>
            <strong>{c.answers.length}</strong> answers
          </li>
          <li>
            <strong>{c.stories.length}</strong> {c.stories.length === 1 ? 'story' : 'stories'}
          </li>
          <li>
            <strong>{c.threads.length + c.replies.length}</strong> conversations
          </li>
        </ul>
        {c.answers.slice(0, 2).map(({ q, a }) => (
          <Link key={a.id} to={`/questions/${q.id}`} className="gcontrib__answer">
            <span className="gcontrib__q">{q.title}</span>
            <span className="gcontrib__a">{a.body}</span>
          </Link>
        ))}
        {!self && (
          <button type="button" className="gp__ask" onClick={() => openRequest(id, profile.transitions[0])}>
            Ask {p.first} something for free
          </button>
        )}
      </section>
    </div>
  );
}

/** The Guide card in a profile's side column: the numbers, the price, and the way to book. */
export function GuideRailCard({ id }: { id: string }) {
  const guide = useGuide(id);
  const following = useApp((s) => !!s.following[id]);
  if (!guide) return null;
  const { profile, econ } = guide;
  const self = id === ME;
  const paid = econ.services.filter((s) => s.price > 0);
  const from = paid.length ? paid.reduce((a, b) => (b.price < a.price ? b : a)) : undefined;
  const top = standingOf(id)[0];
  return (
    <section className="grail immersive">
      <div className="grail__head">
        <span className="grail__badge">
          <IconSignpost size={15} strokeWidth={1.9} />
          Path Guide
        </span>
        {econ.rating > 0 && (
          <span className="grail__rating">
            <IconStar size={14} filled /> {econ.rating.toFixed(1)} <span>({econ.reviewCount})</span>
          </span>
        )}
      </div>
      {top && <p className="grail__top">{`${top.label} in ${top.title}`}</p>}
      <dl className="grail__nums">
        <div>
          <dt>Helped</dt>
          <dd>{profile.helped}</dd>
        </div>
        <div>
          <dt>Followers</dt>
          <dd>{(econ.followers + (following ? 1 : 0)).toLocaleString('en-CA')}</dd>
        </div>
        <div>
          <dt>From</dt>
          <dd>{from ? priceLabel(from) : 'Free'}</dd>
        </div>
      </dl>
      <p className="grail__line">
        <IconCalendar size={15} /> Free Office Hours · {profile.officeHours.when}
      </p>
      {!self && (
        <div className="grail__cta">
          <BookButton id={id} label="Book" size="medium" />
          <RequestButton id={id} size="medium" variant="gray" label="Ask" />
        </div>
      )}
      {self && (
        <Link to="/guide/setup" className="grail__edit">
          Edit your Guide profile
        </Link>
      )}
    </section>
  );
}

/** A small line under a name: "★ 4.9 · Top Guide in CRO → Pharma R&D". */
export function GuideByline({ id }: { id: string }) {
  const econ = useGuide(id)?.econ;
  const top = standingOf(id)[0];
  if (!econ) return null;
  return (
    <span className="gbyline">
      {econ.rating > 0 && (
        <>
          <IconStar size={12} filled /> {econ.rating.toFixed(1)}
        </>
      )}
      {top && <span className="gbyline__top">{`${top.label} · ${communities[top.community].title}`}</span>}
    </span>
  );
}

/** A Path Community's Guides, ranked by the standing they've earned there. */
export function RankedGuides({ community, ids }: { community: string; ids: string[] }) {
  const ranked = communityGuides(community);
  const rest = ids.filter((id) => !ranked.some((r) => r.id === id) && people[id]?.guide);
  const rows = [...ranked, ...rest.map((id) => ({ id, rank: 0 }))];
  return (
    <ol className="rguides">
      {rows.map((r, i) => {
        const econ = economyOf(r.id);
        const from = fromPrice(r.id);
        return (
          <motion.li key={r.id} {...rise(i, 8)}>
            <span className={`rguides__rank ${r.rank === 1 ? 'is-top' : ''}`}>{r.rank || '·'}</span>
            <Avatar id={r.id} size={36} />
            <span className="rguides__who">
              <Link to={`/p/${r.id}`} className="rguides__name">
                {people[r.id].name}
              </Link>
              <span>
                {econ && (
                  <>
                    <IconStar size={11} filled /> {econ.rating.toFixed(1)} ·{' '}
                  </>
                )}
                {people[r.id].guide?.helped} helped{from ? ` · from ${priceLabel(from)}` : ''}
              </span>
            </span>
            <BookButton id={r.id} label="Book" size="small" variant="gray" />
          </motion.li>
        );
      })}
    </ol>
  );
}
