import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Page, useUnread } from '../components/chrome';
import { PathPulse, type PulseStop } from '../components/PathPulse';
import { PathStrip } from '../components/path/PathStrip';
import {
  CommunityRow,
  DecisionItem,
  PersonRow,
  PersonTile,
  QuestionItem,
  RequestButton,
  StoryItem,
  StoryLead,
  ThreadItem,
} from '../components/content';
import { RouteItem } from '../components/Ecosystem';
import { Avatar, AvatarStack, Button, IconButton, PersonName, RelationGlyph, RelationTag, SectionHeader } from '../components/ui';
import { IconAlign, IconBell, IconCalendar, IconChevronRight, IconMessage } from '../components/icons';
import { people, me, ME } from '../data/people';
import { stories } from '../data/stories';
import { questions } from '../data/questions';
import { decisions } from '../data/decisions';
import { threads, communities } from '../data/communities';
import { destinations } from '../data/destinations';
import { relationTo } from '../lib/relations';
import { useIsMobile, useIsWide, springs } from '../lib/motion';
import { useUI } from '../lib/ui';
import { useApp } from '../lib/store';
import './home.css';

const pulseStops: PulseStop[] = [
  { key: 'bsc', label: 'BSc Chemistry', kind: 'past', href: '/path', activity: { ids: ['lucas'], text: 'Lucas asked you about this step' } },
  { key: 'ra', label: 'Research', kind: 'past', href: '/path', activity: { ids: ['julian'], text: 'Julian is here now, one step behind you' } },
  { key: 'msc', label: 'MSc Chemistry', kind: 'present', href: '/path', activity: { ids: ['sarah', 'wei', 'jonah'], text: 'Three peers are deciding too' } },
  { key: 'next', label: 'Next step', kind: 'unknown', href: '/path', activity: { ids: ['daniel', 'priya', 'nikhil'], text: 'Daniel, Priya and Nikhil are one step ahead' } },
  { key: 'dest', label: 'Pharma R&D', kind: 'destination', href: '/path?focus=pharma-rnd', activity: { ids: ['elena'], text: 'Elena arrived this month' } },
];

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

/** What's actually on your plate: the next call you've booked, and requests waiting on you. */
function UpNext() {
  const requests = useApp((s) => s.requests);
  const call = requests.find((r) => r.from === ME && r.status === 'accepted' && r.proposed);
  const incoming = requests.filter((r) => r.to === ME && r.status === 'pending');
  if (!call && !incoming.length) return null;
  const day = nextWeekday(4);
  const inDays = Math.round((day.getTime() - new Date().setHours(0, 0, 0, 0)) / 86_400_000);
  const dayLabel = inDays === 0 ? 'Today' : inDays === 1 ? 'Tomorrow' : day.toLocaleDateString('en-CA', { weekday: 'long' });
  const time = call?.proposed?.split(', ')[1];
  return (
    <div className="upnext">
      {call && (
        <Link to={call.thread ? `/messages/${call.thread}` : '/requests'} className="upnext__item">
          <span className="upnext__date" aria-hidden="true">
            <span className="upnext__dow">{day.toLocaleDateString('en-CA', { weekday: 'short' }).replace('.', '')}</span>
            <span className="upnext__day">{day.getDate()}</span>
          </span>
          <span className="upnext__text">
            <span className="t-headline truncate">Call with {people[call.to].name}</span>
            <span className="t-subhead c-2 truncate">
              {dayLabel}
              {time && ` · ${time}`}
            </span>
          </span>
          <IconChevronRight size={16} className="c-3" />
        </Link>
      )}
      {incoming.length > 0 && (
        <Link to="/requests" className="upnext__item">
          <span className="upnext__faces">
            <AvatarStack ids={incoming.map((r) => r.from)} size={28} max={3} />
          </span>
          <span className="upnext__text">
            <span className="t-headline truncate">
              {incoming.length} Path {incoming.length === 1 ? 'Request' : 'Requests'}
            </span>
            <span className="t-subhead c-2 truncate">From {joinNames(incoming.map((r) => r.from))}</span>
          </span>
          <IconChevronRight size={16} className="c-3" />
        </Link>
      )}
    </div>
  );
}

function FeedItem({ context, glyph = 'ahead', children, i = 0 }: { context: ReactNode; glyph?: Parameters<typeof RelationGlyph>[0]['kind']; children: ReactNode; i?: number }) {
  return (
    <motion.article
      className="feed-item"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ ...springs.smooth, delay: Math.min(i, 3) * 0.04 }}
    >
      <p className="feed-item__context t-footnote">
        <span className="feed-item__glyph">
          <RelationGlyph kind={glyph} size={15} />
        </span>
        {context}
      </p>
      {children}
    </motion.article>
  );
}

function Milestone() {
  const openCompare = useUI((s) => s.openCompare);
  const navigate = useNavigate();
  const e = people.elena;
  return (
    <div className="milestone">
      <div className="milestone__who">
        <Avatar id="elena" size={56} />
        <div>
          <p className="t-body">
            <PersonName id="elena" /> reached <strong>Pharmaceutical R&D</strong>.
          </p>
          <p className="t-subhead c-2">Scientist I at Northfield Pharmaceuticals · after five years at a CRO</p>
        </div>
      </div>
      <div className="milestone__path">
        <PathStrip id="elena" size="md" animate wrap />
      </div>
      <p className="milestone__note t-serif">“Three weeks in. If you’re at the CRO step, set yourself a date and tell someone ahead of you what it is.”</p>
      <div className="milestone__actions">
        <Button variant="tinted" size="small" icon={<IconAlign size={16} />} onClick={() => openCompare('elena')}>
          Align Paths
        </Button>
        <Button variant="gray" size="small" icon={<IconMessage size={16} />} onClick={() => navigate('/messages/c-elena')}>
          Congratulate {e.first}
        </Button>
      </div>
    </div>
  );
}

function GuideSpotlight({ id }: { id: string }) {
  const g = people[id];
  const rel = relationTo(id);
  if (!g.guide) return null;
  return (
    <div className="spotlight">
      <Link to={`/p/${id}`} className="spotlight__photo">
        <img src={g.photo} alt="" loading="lazy" />
      </Link>
      <div className="spotlight__body">
        <RelationTag kind={rel.kind} label="Path Guide" />
        <h3 className="t-title3">
          <PersonName id={id} />
        </h3>
        <p className="t-subhead c-2">{g.headline}</p>
        <p className="t-callout spotlight__why">{rel.why}</p>
        <PathStrip id={id} />
        <ul className="spotlight__helps t-subhead">
          {g.guide.helpsWith.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
        <div className="spotlight__foot">
          <RequestButton id={id} size="medium" label="Send a Path Request" />
          <span className="t-footnote c-2 spotlight__hours">
            <IconCalendar size={15} /> {g.guide.officeHours.when} · {g.guide.officeHours.open} of {g.guide.officeHours.total} open
          </span>
        </div>
      </div>
    </div>
  );
}

function OfficeHours() {
  const ids = ['amara', 'tomas', 'priya', 'rafael'];
  return (
    <ul className="hours">
      {ids.map((id) => {
        const g = people[id];
        return (
          <li key={id} className="hours__row">
            <Avatar id={id} size={40} />
            <div className="hours__text">
              <PersonName id={id} className="t-subhead" />
              <span className="t-footnote c-2">{g.guide!.officeHours.when}</span>
              <span className="t-footnote hours__open">
                {g.guide!.officeHours.open} of {g.guide!.officeHours.total} spots open
              </span>
            </div>
            <RequestButton id={id} variant="tinted" label="Ask" />
          </li>
        );
      })}
    </ul>
  );
}

function MyCommunities() {
  const joined = useApp((s) => s.joined);
  const list = Object.keys(joined)
    .filter((k) => joined[k])
    .map((k) => communities[k])
    .filter(Boolean);
  return (
    <ul className="rail-communities">
      {list.map((c) => (
        <li key={c.id}>
          <Link to={`/c/${c.id}`} className="rail-community">
            <span className="rail-community__title t-subhead">{c.title}</span>
            <span className="t-footnote c-2">
              <span className="rail-community__live">{c.activeNow} here now</span> · {threads.filter((t) => t.community === c.id).length} new conversations
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Home() {
  const isMobile = useIsMobile();
  const isWide = useIsWide();
  const unread = useUnread();
  const navigate = useNavigate();
  const worth = ['sarah', 'amara', 'daniel', 'elena', 'rafael', 'jonah'];
  const cro = destinations['pharma-rnd'].routes.find((r) => r.id === 'via-intern')!;

  const feed = (
    <div className="feed">
      <FeedItem glyph="guide" context="At your destination · three weeks ago" i={0}>
        <Milestone />
      </FeedItem>

      <FeedItem glyph="ahead" context={<>In <Link to="/c/chem-pharma">Chemistry → Pharmaceutical R&D</Link> · about your next step</>} i={1}>
        <ThreadItem t={threads.find((t) => t.id === 't-cro-interview')!} />
      </FeedItem>

      <FeedItem glyph="peer" context="Your question · 4 answers from people ahead of you" i={2}>
        <QuestionItem q={questions['q-cro-trap']} />
      </FeedItem>

      <FeedItem glyph="guide" context="A Guide for the route you’re leaning towards" i={3}>
        <GuideSpotlight id="amara" />
      </FeedItem>

      <FeedItem glyph="ahead" context="A story from the route you’re considering" i={4}>
        <div className="feed-story">
          <StoryLead story={stories['elena-cro']} />
        </div>
      </FeedItem>

      <FeedItem glyph="twin" context="Jonah is facing your exact decision" i={5}>
        <DecisionItem d={decisions['d-jonah-offers']} />
      </FeedItem>

      <FeedItem glyph="explorer" context="A route to your destination you haven’t added" i={6}>
        <div className="feed-route">
          <RouteItem route={cro} dest="pharma-rnd" to="/discover?to=pharma-rnd&route=via-intern" />
          <PersonRow id="rafael" action="request" />
        </div>
      </FeedItem>

      <FeedItem glyph="ahead" context={<>In <Link to="/c/cro-rnd">CRO → Pharma R&D</Link> · from someone who just crossed</>} i={7}>
        <ThreadItem t={threads.find((t) => t.id === 't-three-weeks')!} />
      </FeedItem>

      <FeedItem glyph="explorer" context="On the PhD branch you’re weighing" i={8}>
        <StoryItem story={stories['tomas-phd-math']} />
      </FeedItem>

      <FeedItem glyph="twin" context="Sarah asked · your Path Twin" i={9}>
        <QuestionItem q={questions['q-msc-enough']} />
      </FeedItem>

      <FeedItem glyph="peer" context={<>In <Link to="/c/msc-industry">MSc → First Industry Role</Link></>} i={10}>
        <ThreadItem t={threads.find((t) => t.id === 't-internships')!} />
      </FeedItem>
    </div>
  );

  return (
    <Page
      title="Home"
      wide
      trailing={
        isMobile ? (
          <>
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
          <Link to="/p/maya" aria-label="Your profile" className="home__me">
            <img src={me.photo} alt="" />
          </Link>
        ) : (
          <span />
        )
      }
    >
      <UpNext />

      <section className="home__pulse">
        <div className="home__pulse-head">
          <h2 className="t-headline">Your Path this week</h2>
          <Link to="/path" className="t-subhead c-tint">
            Explore
          </Link>
        </div>
        <div className="home__pulse-scroll">
          <PathPulse stops={pulseStops} />
        </div>
      </section>

      {isMobile && (
        <section className="home__worth">
          <SectionHeader title="People worth knowing" subtitle="Chosen for where you are and where you’re going" to="/network" />
          <div className="carousel">
            {worth.map((id) => (
              <PersonTile key={id} id={id} />
            ))}
          </div>
        </section>
      )}

      <div className="home__grid">
        <div className="home__main">{feed}</div>
        {!isMobile && (
          <aside className="home__rail">
            <section>
              <SectionHeader title="People worth knowing" to="/network" size="headline" />
              {worth.slice(0, isWide ? 4 : 3).map((id) => (
                <PersonRow key={id} id={id} compact />
              ))}
            </section>
            <section>
              <SectionHeader title="Path Office Hours this week" to="/guides" size="headline" />
              <OfficeHours />
            </section>
            <section>
              <SectionHeader title="Your communities" to="/communities" size="headline" />
              <MyCommunities />
            </section>
            <section className="home__rail-saved">
              <SectionHeader title="Heading your way" size="headline" />
              <p className="t-subhead c-2">
                <AvatarStack ids={['lucas', 'analucia', 'olivia', 'julian']} size={22} /> Four people exploring Pharmaceutical R&D from other starting points.{' '}
                <Link to="/network?lens=explorer" className="c-tint">
                  Meet them
                </Link>
              </p>
            </section>
          </aside>
        )}
      </div>

      {isMobile && (
        <section className="home__mobile-extra">
          <SectionHeader title="Your communities" to="/communities" />
          <CommunityRow c={communities['chem-pharma']} reason="Most active on your route" />
        </section>
      )}
    </Page>
  );
}
