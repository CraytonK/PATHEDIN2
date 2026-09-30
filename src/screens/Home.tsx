import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useRef, useState, type CSSProperties } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Page, useUnread } from '../components/chrome';
import { PathPulse, type PulseStop } from '../components/PathPulse';
import { type PostKind } from '../components/Post';
import { DecisionPost, GuidePost, KindFeed, KindFilter, MilestonePost, MyPostItem, QuestionPost, RoutePost, StoryPost, ThreadPost, feedKinds } from '../components/FeedItems';
import { useWriting } from '../lib/writing';
import { RouteSilk } from '../components/path/RouteSilk';
import { dayLabel, fmtTime, useOpenSpots } from '../lib/booking';
import { bookingTitle } from '../lib/guides';
import { RailFooter } from '../components/Rail';
import { PersonTile } from '../components/content';
import { Avatar, AvatarStack, CountUp, IconButton, PersonName, Rolling, SectionHeader, TextTabs } from '../components/ui';
import { IconArrowRight, IconBell, IconCheck, IconChevronLeft, IconChevronRight, IconCompose, IconDoc, IconFlag, IconMessage, IconPlus, IconQuestion, IconSend, IconSignpost, IconSparkle } from '../components/icons';
import { people, me, ME } from '../data/people';
import { stories } from '../data/stories';
import { questions, questionList } from '../data/questions';
import { decisions } from '../data/decisions';
import { threads, communities } from '../data/communities';
import { destinations } from '../data/destinations';
import { edgeClass, rise, springs, useIsMobile, useMediaQuery, useScrollEdges } from '../lib/motion';
import { relationTo } from '../lib/relations';
import { usePeek } from '../components/Peek';
import { conversationList } from '../data/social';
import { useApp } from '../lib/store';
import { useUI } from '../lib/ui';
import './home.css';

const MotionLink = motion.create(Link);

const pulseStops: PulseStop[] = [
  { key: 'bsc', label: 'BSc Chemistry', kind: 'past', href: '/path', activity: { ids: ['lucas'], text: 'Lucas asked you about this step' } },
  { key: 'ra', label: 'Research', kind: 'past', href: '/path', activity: { ids: ['julian'], text: 'Julian is here now, one step behind you' } },
  { key: 'msc', label: 'MSc Chemistry', kind: 'present', href: '/path', activity: { ids: ['sarah', 'wei', 'jonah'], text: 'Three peers are deciding too' } },
  { key: 'next', label: 'Next step', kind: 'unknown', href: '/path', activity: { ids: ['daniel', 'priya', 'nikhil'], text: 'Daniel, Priya and Nikhil are one step ahead' } },
  { key: 'dest', label: 'Pharma R&D', kind: 'destination', href: '/path?focus=pharma-rnd', activity: { ids: ['elena'], text: 'Elena arrived this month' } },
];

const worth = ['sarah', 'amara', 'daniel', 'elena', 'rafael', 'jonah'];

/** The next date that falls on `weekday` (0 = Sunday), counting today. */
function nextWeekday(weekday: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + ((weekday - d.getDay() + 7) % 7));
  return d;
}

function joinNames(ids: string[]) {
  const names = ids.map((id) => people[id].first);
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0];
}

const dayKey = (d: Date) => d.toDateString();

/** What's on your plate, with the day each thing falls on (requests wait on you, so they have none). */
function usePlate() {
  const requests = useApp((s) => s.requests);
  const bookings = useApp((s) => s.bookings);
  const call = requests.find((r) => r.from === ME && r.status === 'accepted' && r.proposed);
  const incoming = requests.filter((r) => r.to === ME && r.status === 'pending');
  const ahead = bookings.filter((b) => new Date(b.at).getTime() + b.minutes * 60_000 > Date.now()).sort((a, b) => +new Date(a.at) - +new Date(b.at));
  const callDay = nextWeekday(4);
  const days = new Set([...ahead.map((b) => dayKey(new Date(b.at))), ...(call ? [dayKey(callDay)] : [])]);
  return { call, incoming, ahead, callDay, days };
}

/** What's actually on your plate: the next call you've booked, and requests waiting on you. */
function UpNext({ variant = 'cards', hot, onHot }: { variant?: 'cards' | 'list' | 'schedule'; hot?: string | null; onHot?: (day: string | null) => void }) {
  const openBooking = useUI((s) => s.openBooking);
  const { call, incoming, ahead, callDay: day } = usePlate();
  if (!call && !incoming.length && !ahead.length) return null;
  const time = call?.proposed?.split(', ')[1];
  const schedule = variant === 'schedule';
  const tile = (d: Date) =>
    schedule ? null : (
      <span className="upnext__date" aria-hidden="true">
        <span className="upnext__dow">{d.toLocaleDateString('en-CA', { weekday: 'short' }).replace('.', '')}</span>
        <span className="upnext__day">{d.getDate()}</span>
      </span>
    );
  // On the dashboard, pointing at an item lights its day in the week above, and the other way round.
  const link = (d?: Date) =>
    schedule
      ? {
          'data-day': d ? dayKey(d) : undefined,
          onPointerEnter: () => onHot?.(d ? dayKey(d) : null),
          onPointerLeave: () => onHot?.(null),
        }
      : {};
  const state = (d?: Date) => (schedule && hot ? (d && dayKey(d) === hot ? 'is-hot' : 'is-cool') : '');
  return (
    <div className={`upnext upnext--${variant}`}>
      {ahead.map((b, i) => {
        const at = new Date(b.at);
        return (
          <motion.button
            key={b.id}
            type="button"
            className={`upnext__item upnext__item--hours ${state(at)}`}
            onClick={() => openBooking(b.guide, { booking: b.id })}
            {...link(at)}
            {...(schedule ? rise(i, 10) : {})}
          >
            {tile(at)}
            {schedule && <span className="upnext__bar" aria-hidden="true" />}
            <span className="upnext__text">
              <span className="upnext__title truncate">{bookingTitle(b)}</span>
              <span className="upnext__sub truncate">{b.minutes ? `${dayLabel(at)} · ${fmtTime(at)} · ${b.minutes} min` : `Notes back ${dayLabel(at).toLowerCase() === 'today' ? 'today' : `by ${dayLabel(at)}`}`}</span>
            </span>
            {schedule ? <Avatar id={b.guide} size={28} peek={false} /> : <IconChevronRight size={16} className="c-3" />}
          </motion.button>
        );
      })}
      {call && (
        <MotionLink
          to={call.thread ? `/messages/${call.thread}` : '/requests'}
          className={`upnext__item upnext__item--call ${state(day)}`}
          {...link(day)}
          {...(schedule ? rise(ahead.length, 10) : {})}
        >
          {tile(day)}
          {schedule && <span className="upnext__bar" aria-hidden="true" />}
          <span className="upnext__text">
            <span className="upnext__title truncate">Call with {people[call.to].name}</span>
            <span className="upnext__sub truncate">
              {dayLabel(day)}
              {time && ` · ${time}`}
            </span>
          </span>
          {schedule ? <Avatar id={call.to} size={28} peek={false} /> : <IconChevronRight size={16} className="c-3" />}
        </MotionLink>
      )}
      {incoming.length > 0 && (
        <MotionLink to="/requests" className={`upnext__item upnext__item--requests ${state()}`} {...link()} {...(schedule ? rise(ahead.length + 1, 10) : {})}>
          {schedule ? (
            <span className="upnext__bar" aria-hidden="true" />
          ) : (
            <span className="upnext__faces">
              <AvatarStack ids={incoming.map((r) => r.from)} size={variant === 'list' ? 24 : 28} max={3} />
            </span>
          )}
          <span className="upnext__text">
            <span className="upnext__title truncate">
              {incoming.length} Path {incoming.length === 1 ? 'Request' : 'Requests'}
            </span>
            <span className="upnext__sub truncate">From {joinNames(incoming.map((r) => r.from))}</span>
          </span>
          {schedule ? <AvatarStack ids={incoming.map((r) => r.from)} size={24} max={3} /> : <IconChevronRight size={16} className="c-3" />}
        </MotionLink>
      )}
    </div>
  );
}

/* ── For you: every post says what it is and why it's here ───── */

function ForYou() {
  const elena = stories['elena-cro'];
  const tomas = stories['tomas-phd-math'];
  const cro = questions['q-cro-trap'];
  const msc = questions['q-msc-enough'];
  const jonah = decisions['d-jonah-offers'];
  const route = destinations['pharma-rnd'].routes.find((r) => r.id === 'via-intern')!;
  const find = (id: string) => threads.find((t) => t.id === id)!;
  const posts = useWriting((s) => s.posts);
  let i = 0;
  return (
    <div className="feed">
      {posts.map((p) => (
        <MyPostItem key={p.id} post={p} i={i++} />
      ))}
      <MilestonePost
        i={i++}
        id="elena"
        reached="pharma-rnd"
        ago="3w"
        words="Three weeks in. If you’re at the CRO step, set yourself a date and tell someone ahead of you what it is."
        why={{ kind: 'guide', text: 'Reached your destination' }}
        coach
      />
      <ThreadPost i={i++} t={find('t-cro-interview')} why={{ kind: 'ahead', text: 'About your next step' }} />
      <QuestionPost i={i++} q={cro} why={{ kind: 'peer', text: `Your question · ${cro.answers.length} answers from people ahead of you` }} />
      <GuidePost i={i++} id="amara" move={['cro-analytical', 'pharma-rnd']} why={{ kind: 'guide', text: 'A Guide for the route you’re leaning towards' }} />
      <StoryPost i={i++} s={elena} why={{ kind: 'ahead', text: 'A story from the route you’re considering' }} />
      <DecisionPost i={i++} d={jonah} why={{ kind: 'twin', text: `${people[jonah.owner].first} is facing your exact decision` }} />
      <RoutePost i={i++} dest="pharma-rnd" route={route} why={{ kind: 'explorer', text: 'A route to your destination you haven’t added' }} />
      <ThreadPost i={i++} t={find('t-three-weeks')} why={{ kind: 'ahead', text: 'From someone who just crossed' }} />
      <StoryPost i={i++} s={tomas} why={{ kind: 'explorer', text: 'On the PhD branch you’re weighing' }} />
      <QuestionPost i={i++} q={msc} why={{ kind: 'twin', text: 'Asked by your Path Twin' }} />
      <ThreadPost i={i++} t={find('t-internships')} why={{ kind: 'peer', text: 'In a community you’re in' }} />
    </div>
  );
}

/** Following: what's new in the communities you've joined. */
function Following() {
  const joined = useApp((s) => s.joined);
  const inJoined = threads.filter((t) => joined[t.community]);
  const asked = questionList.filter((q) => joined[q.community] && q.asker !== ME).slice(0, 3);
  if (!inJoined.length && !asked.length) {
    return (
      <p className="feed-empty t-subhead c-2">
        Join a community on your Path to see its conversations here. <Link to="/communities">Find communities</Link>
      </p>
    );
  }
  return (
    <div className="feed">
      {inJoined.map((t, i) => (
        <ThreadPost key={t.id} i={i} t={t} why={{ kind: 'peer', text: `New in ${communities[t.community].title}` }} />
      ))}
      {asked.map((q, i) => (
        <QuestionPost key={q.id} i={inJoined.length + i} q={q} why={{ kind: 'peer', text: `Asked in ${communities[q.community].title}` }} />
      ))}
    </div>
  );
}

/* ── The dashboard, after the reference: you on the left, the feed in the middle, your week on the right ── */

/** You, as the dashboard's left-hand card: your Path's colours on the cover, your numbers, where you're going. */
function MeCard() {
  const connections = useApp((s) => s.connections);
  const joined = useApp((s) => s.joined);
  const saved = useApp((s) => s.saved);
  const myGuide = useApp((s) => s.myGuide);
  const unread = useUnread();
  const stats = [
    { to: '/connections', value: Object.values(connections).filter((c) => c === 'connected').length, label: 'Connections' },
    { to: '/communities', value: Object.keys(joined).filter((k) => joined[k] && communities[k]).length, label: 'Communities' },
    { to: '/saved', value: Object.values(saved).filter(Boolean).length, label: 'Saved' },
  ];
  const shortcuts = [
    { to: '/requests', label: 'Path Requests', icon: IconSend, badge: unread.incoming },
    { to: '/guides', label: 'Path Guides', icon: IconSignpost },
    { to: '/stories', label: 'Stories', icon: IconDoc },
    { to: '/questions', label: 'Questions', icon: IconQuestion },
    { to: '/decisions', label: 'Decision Points', icon: IconFlag },
    myGuide?.live ? { to: `/p/${ME}`, label: 'Your Guide profile', icon: IconSparkle } : { to: '/guide/setup', label: 'Become a Path Guide', icon: IconSparkle },
  ];
  return (
    <section className="me-card" aria-label="Your profile">
      <div className="me-card__cover immersive" aria-hidden="true">
        <RouteSilk lines={14} delay={0.15} />
      </div>
      <motion.div className="me-card__who" {...rise(1, 10)}>
        <Link to={`/p/${ME}`} className="me-card__photo" data-portrait={ME} tabIndex={-1} aria-hidden="true">
          <img src={me.photo} alt="" />
        </Link>
        <Link to={`/p/${ME}`} className="me-card__name">
          {me.name}
        </Link>
        <p className="me-card__headline">{me.headline}</p>
      </motion.div>
      <ul className="me-card__stats">
        {stats.map((st) => (
          <li key={st.to}>
            <Link to={st.to}>
              <span className="me-card__num">
                <CountUp value={st.value} />
              </span>
              <span className="me-card__label">{st.label}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="me-card__block">
        <div className="me-card__head">
          <h2 className="me-card__h">Your Path</h2>
          <Link to="/path" className="me-card__more">
            Open My Path
          </Link>
        </div>
        <ul className="me-card__steps">
          {pulseStops
            .filter((st) => st.kind !== 'unknown')
            .map((st, i) => (
              <motion.li key={st.key} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...springs.smooth, delay: 0.35 + i * 0.07 }}>
                <Link to={st.href} className={`me-step is-${st.kind}`}>
                  {st.kind === 'destination' && <IconArrowRight size={13} strokeWidth={2.2} />}
                  {st.label}
                  {st.kind === 'present' && <span className="me-step__you">You</span>}
                </Link>
              </motion.li>
            ))}
        </ul>
      </div>
      <ul className="me-card__links">
        {shortcuts.map((sc) => {
          const Icon = sc.icon;
          return (
            <li key={sc.to}>
              <Link to={sc.to} className="me-card__link">
                <span className="me-card__icon">
                  <Icon size={17} strokeWidth={1.7} />
                </span>
                <span className="me-card__link-label">{sc.label}</span>
                {!!sc.badge && (
                  <span className="me-card__badge">
                    <Rolling value={sc.badge} />
                  </span>
                )}
                <IconChevronRight size={15} className="me-card__chev" data-dir="forward" />
              </Link>
            </li>
          );
        })}
      </ul>
      <Link to="/write" className="me-card__write">
        <IconCompose size={16} strokeWidth={1.8} />
        Write
      </Link>
    </section>
  );
}

/** People worth knowing, as a row of faces ringed in your Path's colours. Each ring draws itself in turn. */
function WorthFace({ id, i }: { id: string; i: number }) {
  const p = people[id];
  const rel = relationTo(id);
  const state = useApp((s) => s.connections[id]);
  const connect = useApp((s) => s.connect);
  const toast = useUI((s) => s.showToast);
  const navigate = useNavigate();
  const handlers = usePeek(id);
  const reduce = useReducedMotion();
  const gid = `worth-${id}`;
  const convo = conversationList.find((c) => c.with === id);
  return (
    <motion.li className="worth__face" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springs.smooth, delay: 0.08 + i * 0.06 }}>
      <Link to={`/p/${id}`} className="worth__link" {...handlers}>
        <span className="worth__ring">
          <svg viewBox="0 0 80 80" aria-hidden="true" className="worth__arc">
            <defs>
              <linearGradient id={gid} x1="0" y1="1" x2="1" y2="0">
                <stop offset="0" style={{ stopColor: 'var(--ink)' }} />
                <stop offset="1" style={{ stopColor: 'var(--tint)' }} />
              </linearGradient>
            </defs>
            <motion.circle
              cx="40"
              cy="40"
              r="38"
              fill="none"
              stroke={`url(#${gid})`}
              strokeWidth="2.5"
              strokeLinecap="round"
              transform="rotate(-90 40 40)"
              initial={reduce ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.9, delay: 0.2 + i * 0.09, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>
          <span className="worth__photo" data-portrait={id}>
            <img src={p.photo} alt="" loading="lazy" draggable={false} />
          </span>
        </span>
        <span className="worth__name">{p.first}</span>
        <span className="worth__rel">{rel.kind === 'other' ? '' : rel.label}</span>
      </Link>
      <button
        type="button"
        className={`worth__add ${state ? `is-${state}` : ''}`}
        aria-label={state === 'connected' ? `Message ${p.first}` : state === 'pending' ? `Connection requested with ${p.first}` : `Connect with ${p.first}`}
        aria-pressed={state === 'pending' ? true : undefined}
        data-tip={state === 'connected' ? 'Message' : state === 'pending' ? 'Requested' : 'Connect'}
        data-tip-pos="below"
        onClick={() => {
          if (state === 'connected') return navigate(convo ? `/messages/${convo.id}` : `/messages?to=${id}`);
          if (!state) toast(`Connection request sent to ${p.first}`);
          connect(id);
        }}
      >
        {state === 'connected' ? <IconMessage size={13} strokeWidth={2} /> : state === 'pending' ? <IconCheck size={13} strokeWidth={2.4} /> : <IconPlus size={13} strokeWidth={2.4} />}
      </button>
    </motion.li>
  );
}

function WorthRow() {
  return (
    <section className="worth dash-card" aria-labelledby="worth-h">
      <div className="dash-card__head">
        <h2 className="dash-card__h" id="worth-h">
          People worth knowing
        </h2>
        <Link to="/network" className="dash-card__more">
          See more suggestions
          <IconChevronRight size={14} strokeWidth={2.2} data-dir="forward" />
        </Link>
      </div>
      <ul className="worth__row">
        {worth.map((id, i) => (
          <WorthFace key={id} id={id} i={i} />
        ))}
      </ul>
    </section>
  );
}

/** Coming up, as a week: today in navy, a dot on the days something's booked, then the list itself. */
function WeekCard() {
  const { days: busy } = usePlate();
  const [offset, setOffset] = useState(0);
  const [dir, setDir] = useState(1);
  const [hot, setHot] = useState<string | null>(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) + offset * 7);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
  const month = (d: Date) => d.toLocaleDateString('en-CA', { month: 'long' });
  const range = month(days[0]) === month(days[6]) ? `${month(days[0])} ${days[0].getFullYear()}` : `${days[0].toLocaleDateString('en-CA', { month: 'short' })} – ${days[6].toLocaleDateString('en-CA', { month: 'short' })} ${days[6].getFullYear()}`;
  const go = (step: number) => {
    setDir(step);
    setOffset((o) => o + step);
  };
  return (
    <section className="rail-card week" aria-labelledby="week-h">
      <div className="rail-head">
        <h2 className="rail-h" id="week-h">
          Coming up
        </h2>
        <div className="week__nav">
          <span className="week__month">{range}</span>
          <button type="button" className="week__step" aria-label="Previous week" disabled={offset <= 0} onClick={() => go(-1)}>
            <IconChevronLeft size={15} strokeWidth={2.2} />
          </button>
          <button type="button" className="week__step" aria-label="Next week" disabled={offset >= 3} onClick={() => go(1)}>
            <IconChevronRight size={15} strokeWidth={2.2} />
          </button>
        </div>
      </div>
      <div className="week__strip">
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.ol
            key={offset}
            className="week__days"
            custom={dir}
            initial={{ opacity: 0, x: dir * 36 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -36, transition: { duration: 0.16 } }}
            transition={springs.smooth}
          >
            {days.map((d) => {
              const key = dayKey(d);
              const isToday = key === dayKey(today);
              const has = busy.has(key);
              return (
                <li
                  key={key}
                  className={`week__day ${isToday ? 'is-today' : ''} ${has ? 'has-items' : ''} ${hot === key ? 'is-hot' : ''} ${d < today ? 'is-past' : ''}`}
                  onPointerEnter={() => has && setHot(key)}
                  onPointerLeave={() => has && setHot(null)}
                  aria-current={isToday ? 'date' : undefined}
                >
                  <span className="week__dow">{d.toLocaleDateString('en-CA', { weekday: 'short' }).replace('.', '')}</span>
                  <span className="week__num">{d.getDate()}</span>
                  <span className="week__dot" aria-hidden="true" />
                </li>
              );
            })}
          </motion.ol>
        </AnimatePresence>
      </div>
      <UpNext variant="schedule" hot={hot} onHot={setHot} />
    </section>
  );
}

function RailPath() {
  return (
    <ol className="rail-path">
      {pulseStops.map((s, i) => (
        <li key={s.key} className={`rail-path__stop is-${s.kind}`} style={{ '--i': i } as CSSProperties}>
          <span className="rail-path__node" aria-hidden="true">
            {s.kind === 'unknown' ? '?' : null}
          </span>
          <div className="rail-path__text">
            <Link to={s.href} className="rail-path__label">
              {s.label}
              {s.kind === 'present' && <span className="here-tag">You</span>}
            </Link>
            {s.activity && (
              <p className="rail-path__activity">
                <AvatarStack ids={s.activity.ids} size={18} max={3} />
                <span>{s.activity.text}</span>
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function RailHoursRow({ id }: { id: string }) {
  const spots = useOpenSpots(id);
  const openBooking = useUI((s) => s.openBooking);
  return (
    <li>
      <Avatar id={id} size={36} />
      <span className="rail-hours__text">
        <PersonName id={id} className="rail-hours__name" />
        <span>
          {spots.when} · {spots.open ? `${spots.open} of ${spots.total} open` : 'full'}
        </span>
      </span>
      <button type="button" className="rail-hours__book" onClick={() => openBooking(id)} aria-label={`Book office hours with ${people[id].name}`}>
        Book
      </button>
    </li>
  );
}

function RailHours() {
  return (
    <ul className="rail-hours">
      {['amara', 'tomas', 'priya'].map((id) => (
        <RailHoursRow key={id} id={id} />
      ))}
    </ul>
  );
}

/** Your communities, as the reference's list: a mosaic of members, the name, and who's here now. */
function RailCommunityList() {
  const joined = useApp((s) => s.joined);
  const list = Object.keys(joined)
    .filter((k) => joined[k] && communities[k])
    .map((k) => communities[k]);
  return (
    <ul className="cm-list">
      {list.map((c, i) => (
        <motion.li key={c.id} {...rise(i, 8)}>
          <Link to={`/c/${c.id}`} className="cm-list__row">
            <span className="cm-list__mosaic" aria-hidden="true">
              {c.memberIds
                .filter((m) => m !== ME)
                .slice(0, 4)
                .map((m) => (
                  <img key={m} src={people[m].photo} alt="" loading="lazy" />
                ))}
            </span>
            <span className="cm-list__text">
              <span className="cm-list__title">{c.title}</span>
              <span className="cm-list__live">
                <span className="cm-list__dot" aria-hidden="true" />
                {c.activeNow} here now
              </span>
            </span>
            <IconChevronRight size={15} className="cm-list__chev" data-dir="forward" />
          </Link>
        </motion.li>
      ))}
    </ul>
  );
}

function Rail({ withMe }: { withMe: boolean }) {
  return (
    <aside className="home__rail" aria-label="Your Path at a glance">
      <WeekCard />
      {withMe && <MeCard />}
      <section className="rail-card rail-card--path immersive">
        <div className="rail-head">
          <h2 className="rail-h">Your Path this week</h2>
          <Link to="/path" className="rail-more">
            Open My Path
          </Link>
        </div>
        <RailPath />
      </section>
      <section className="rail-card">
        <h2 className="rail-h">Path Office Hours this week</h2>
        <RailHours />
        <Link to="/guides" className="rail-more rail-more--below">
          See all Path Guides
        </Link>
      </section>
      <section className="rail-card">
        <h2 className="rail-h">Your communities</h2>
        <RailCommunityList />
        <Link to="/communities" className="rail-more rail-more--below">
          See more communities
        </Link>
      </section>
      <RailFooter />
    </aside>
  );
}

export function Home() {
  const isMobile = useIsMobile();
  const threeUp = useMediaQuery('(min-width: 1200px)');
  const unread = useUnread();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'for-you' | 'following'>('for-you');
  // For you can narrow to one kind of post; the choice lives in the URL so Back returns to it.
  const [params, setParams] = useSearchParams();
  const show = params.get('show');
  const kind: PostKind | 'all' = feedKinds.includes(show as PostKind) ? (show as PostKind) : 'all';
  const feedTop = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);
  const pulseEdges = useScrollEdges(pulseRef);
  const setKind = (k: PostKind | 'all') => {
    setParams(k === 'all' ? {} : { show: k }, { replace: true });
    // If you've scrolled into the feed, bring its top back into view for the new list.
    const el = feedTop.current;
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - (isMobile ? 52 : 64);
      if (window.scrollY > y) window.scrollTo({ top: y });
    }
  };

  return (
    <Page
      title="Home"
      wide
      hideHeaderOnDesktop
      className="page--home"
      trailing={
        isMobile ? (
          <>
            <IconButton label="Write" onClick={() => navigate('/write')}>
              <IconCompose size={22} strokeWidth={1.6} />
            </IconButton>
            <IconButton label="Messages" badge={unread.messages} onClick={() => navigate('/messages')}>
              <IconMessage size={23} />
            </IconButton>
            <IconButton label="Notifications" badge={unread.notifications} onClick={() => navigate('/notifications')}>
              <IconBell size={23} />
            </IconButton>
          </>
        ) : undefined
      }
      largeTrailing={
        isMobile ? (
          <Link to={`/p/${ME}`} aria-label="Your profile" className="home__me">
            <img src={me.photo} alt="" />
          </Link>
        ) : undefined
      }
    >
      <div className={`home ${threeUp ? 'home--three' : ''}`}>
        {!isMobile && threeUp && (
          <aside className="home__me" aria-label="You">
            <MeCard />
          </aside>
        )}
        <div className="home__main">
          {isMobile && (
            <>
              <UpNext />
              <section className="home__pulse immersive">
                <div className="home__pulse-head">
                  <h2 className="t-headline">Your Path this week</h2>
                  <Link to="/path" className="t-subhead c-tint">
                    Explore
                  </Link>
                </div>
                <div className={`home__pulse-scroll ${edgeClass(pulseEdges)}`} ref={pulseRef}>
                  <PathPulse stops={pulseStops} />
                </div>
              </section>
              <section className="home__worth">
                <SectionHeader title="People worth knowing" subtitle="Chosen for where you are and where you’re going" to="/network" />
                <div className="carousel">
                  {worth.map((id) => (
                    <PersonTile key={id} id={id} />
                  ))}
                </div>
              </section>
            </>
          )}
          {!isMobile && <WorthRow />}
          <div ref={feedTop} />
          <div className="home__tabs">
            <TextTabs
              value={tab}
              onChange={setTab}
              options={[
                { value: 'for-you', label: 'For you' },
                { value: 'following', label: 'Following' },
              ]}
            />
            {tab === 'for-you' && <KindFilter value={kind} onChange={setKind} />}
          </div>
          {tab === 'for-you' ? kind === 'all' ? <ForYou /> : <KindFeed key={kind} kind={kind} /> : <Following />}
        </div>
        {!isMobile && <Rail withMe={!threeUp} />}
      </div>
    </Page>
  );
}
