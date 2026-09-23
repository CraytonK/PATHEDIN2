import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Page, useUnread } from '../components/chrome';
import { PathPulse, type PulseStop } from '../components/PathPulse';
import { PathStrip } from '../components/path/PathStrip';
import { Post } from '../components/Post';
import { RailCommunities, RailFooter, RailPeople } from '../components/Rail';
import { DecisionFork, PersonTile, RequestButton, SegmentArt } from '../components/content';
import { Avatar, AvatarStack, IconButton, PersonName, SectionHeader, TextTabs, formatCount } from '../components/ui';
import { IconBell, IconChevronRight, IconMessage } from '../components/icons';
import { people, me, ME } from '../data/people';
import { stories } from '../data/stories';
import { questions, questionList } from '../data/questions';
import { decisions } from '../data/decisions';
import { threads, communities } from '../data/communities';
import { destinations } from '../data/destinations';
import { wp } from '../data/waypoints';
import type { Thread } from '../data/types';
import { relationTo, type RelationKind } from '../lib/relations';
import { useIsMobile } from '../lib/motion';
import { useApp } from '../lib/store';
import './home.css';

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

/** What's actually on your plate: the next call you've booked, and requests waiting on you. */
function UpNext({ variant = 'cards' }: { variant?: 'cards' | 'list' }) {
  const requests = useApp((s) => s.requests);
  const call = requests.find((r) => r.from === ME && r.status === 'accepted' && r.proposed);
  const incoming = requests.filter((r) => r.to === ME && r.status === 'pending');
  if (!call && !incoming.length) return null;
  const day = nextWeekday(4);
  const inDays = Math.round((day.getTime() - new Date().setHours(0, 0, 0, 0)) / 86_400_000);
  const dayLabel = inDays === 0 ? 'Today' : inDays === 1 ? 'Tomorrow' : day.toLocaleDateString('en-CA', { weekday: 'long' });
  const time = call?.proposed?.split(', ')[1];
  return (
    <div className={`upnext upnext--${variant}`}>
      {call && (
        <Link to={call.thread ? `/messages/${call.thread}` : '/requests'} className="upnext__item">
          <span className="upnext__date" aria-hidden="true">
            <span className="upnext__dow">{day.toLocaleDateString('en-CA', { weekday: 'short' }).replace('.', '')}</span>
            <span className="upnext__day">{day.getDate()}</span>
          </span>
          <span className="upnext__text">
            <span className="upnext__title truncate">Call with {people[call.to].name}</span>
            <span className="upnext__sub truncate">
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
            <AvatarStack ids={incoming.map((r) => r.from)} size={variant === 'list' ? 24 : 28} max={3} />
          </span>
          <span className="upnext__text">
            <span className="upnext__title truncate">
              {incoming.length} Path {incoming.length === 1 ? 'Request' : 'Requests'}
            </span>
            <span className="upnext__sub truncate">From {joinNames(incoming.map((r) => r.from))}</span>
          </span>
          <IconChevronRight size={16} className="c-3" />
        </Link>
      )}
    </div>
  );
}

/* ── For you: every post says why it's here ─────────────────── */

function threadPost(t: Thread, why: { kind: RelationKind; text: string }, i: number) {
  const c = communities[t.community];
  return (
    <Post
      key={t.id}
      i={i}
      author={t.author}
      where={<Link to={`/c/${c.id}`}>{c.title}</Link>}
      ago={t.ago}
      to={`/c/${c.id}#${t.id}`}
      title={t.title}
      subtitle={t.body}
      why={why}
      stats={<span>{t.replyCount} replies</span>}
      saveKey={`thread:${t.id}`}
    />
  );
}

function ForYou() {
  const elena = stories['elena-cro'];
  const tomas = stories['tomas-phd-math'];
  const cro = questions['q-cro-trap'];
  const msc = questions['q-msc-enough'];
  const jonah = decisions['d-jonah-offers'];
  const route = destinations['pharma-rnd'].routes.find((r) => r.id === 'via-intern')!;
  const amara = people.amara;
  const find = (id: string) => threads.find((t) => t.id === id)!;
  let i = 0;
  return (
    <div className="feed">
      <Post
        i={i++}
        author="elena"
        ago="3w"
        to="/p/elena"
        title={`${people.elena.first} reached ${wp('pharma-rnd').mid}`}
        subtitle="“Three weeks in. If you’re at the CRO step, set yourself a date and tell someone ahead of you what it is.”"
        extra={<PathStrip id="elena" wrap />}
        why={{ kind: 'guide', text: 'Reached your destination' }}
        thumb={<img src={people.elena.photo} alt="" loading="lazy" />}
        thumbKind="photo"
        saveKey="person:elena"
      />
      {threadPost(find('t-cro-interview'), { kind: 'ahead', text: 'About your next step' }, i++)}
      <Post
        i={i++}
        author={cro.asker}
        where={<Link to={`/c/${cro.community}`}>{communities[cro.community].title}</Link>}
        ago={cro.ago}
        to={`/questions/${cro.id}`}
        title={cro.title}
        subtitle={
          <>
            <strong>{people[cro.answers[0].author].first}:</strong> {cro.answers[0].body}
          </>
        }
        why={{ kind: 'peer', text: `Your question · ${cro.answers.length} answers from people ahead of you` }}
        stats={<span>{cro.followers} following</span>}
        saveKey={`question:${cro.id}`}
      />
      <Post
        i={i++}
        author="amara"
        where={<Link to="/guides">Path Guides</Link>}
        to="/p/amara"
        title={`${amara.name}, ${amara.headline}`}
        subtitle={relationTo('amara').why}
        extra={
          <div className="feed-guide">
            <PathStrip id="amara" />
            <p className="feed-guide__hours">
              {amara.guide!.officeHours.when} · {amara.guide!.officeHours.open} of {amara.guide!.officeHours.total} spots open
              <RequestButton id="amara" variant="tinted" label="Ask" />
            </p>
          </div>
        }
        why={{ kind: 'guide', text: 'A Guide for the route you’re leaning towards' }}
        thumb={<img src={amara.photo} alt="" loading="lazy" />}
        thumbKind="photo"
        saveKey="person:amara"
      />
      <Post
        i={i++}
        author={elena.author}
        ago={elena.published}
        to={`/stories/${elena.id}`}
        title={elena.title}
        subtitle={elena.dek}
        why={{ kind: 'ahead', text: 'A story from the route you’re considering' }}
        stats={
          <>
            <span>{elena.minutes} min read</span>
            <span>{formatCount(elena.reads)} reads</span>
          </>
        }
        thumb={<SegmentArt story={elena} height={120} labels={false} />}
        saveKey={`story:${elena.id}`}
      />
      <Post
        i={i++}
        author={jonah.owner}
        ago={jonah.ago}
        to={`/decisions/${jonah.id}`}
        title={jonah.title}
        subtitle={jonah.context}
        why={{ kind: 'twin', text: `${people[jonah.owner].first} is facing your exact decision` }}
        stats={<span>{jonah.weighIns.length} weighed in</span>}
        thumb={<DecisionFork d={jonah} />}
        saveKey={`decision:${jonah.id}`}
      />
      <Post
        i={i++}
        author="rafael"
        where={<Link to="/discover?to=pharma-rnd">Routes to {wp('pharma-rnd').mid}</Link>}
        to="/discover?to=pharma-rnd&route=via-intern"
        title={`Another way to ${wp('pharma-rnd').mid}: ${route.label}`}
        subtitle={route.note}
        extra={
          <p className="feed-route">
            {route.via.map((w) => wp(w).short).join(' → ')} → {wp('pharma-rnd').short}
          </p>
        }
        why={{ kind: 'explorer', text: 'A route to your destination you haven’t added' }}
        stats={
          <>
            <span>{formatCount(route.people)} people</span>
            <span>~{route.medianYears} years</span>
          </>
        }
        saveKey="route:via-intern"
      />
      {threadPost(find('t-three-weeks'), { kind: 'ahead', text: 'From someone who just crossed' }, i++)}
      <Post
        i={i++}
        author={tomas.author}
        ago={tomas.published}
        to={`/stories/${tomas.id}`}
        title={tomas.title}
        subtitle={tomas.dek}
        why={{ kind: 'explorer', text: 'On the PhD branch you’re weighing' }}
        stats={<span>{tomas.minutes} min read</span>}
        thumb={<SegmentArt story={tomas} height={120} labels={false} />}
        saveKey={`story:${tomas.id}`}
      />
      <Post
        i={i++}
        author={msc.asker}
        where={<Link to={`/c/${msc.community}`}>{communities[msc.community].title}</Link>}
        ago={msc.ago}
        to={`/questions/${msc.id}`}
        title={msc.title}
        subtitle={msc.body}
        why={{ kind: 'twin', text: 'Asked by your Path Twin' }}
        stats={<span>{msc.answers.length} answers</span>}
        saveKey={`question:${msc.id}`}
      />
      {threadPost(find('t-internships'), { kind: 'peer', text: 'In a community you’re in' }, i++)}
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
      {inJoined.map((t, i) => threadPost(t, { kind: 'peer', text: `New in ${communities[t.community].title}` }, i))}
      {asked.map((q, i) => (
        <Post
          key={q.id}
          i={inJoined.length + i}
          author={q.asker}
          where={<Link to={`/c/${q.community}`}>{communities[q.community].title}</Link>}
          ago={q.ago}
          to={`/questions/${q.id}`}
          title={q.title}
          subtitle={q.body}
          why={{ kind: 'peer', text: `Asked in ${communities[q.community].title}` }}
          stats={<span>{q.answers.length} answers</span>}
          saveKey={`question:${q.id}`}
        />
      ))}
    </div>
  );
}

/* ── Right rail, after Medium's ─────────────────────────────── */

function RailPath() {
  return (
    <ol className="rail-path">
      {pulseStops.map((s) => (
        <li key={s.key} className={`rail-path__stop is-${s.kind}`}>
          <span className="rail-path__node" aria-hidden="true">
            {s.kind === 'unknown' ? '?' : null}
          </span>
          <div className="rail-path__text">
            <Link to={s.href} className="rail-path__label">
              {s.label}
              {s.kind === 'present' && <span className="rail-path__you">You</span>}
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

function RailHours() {
  return (
    <ul className="rail-hours">
      {['amara', 'tomas', 'priya'].map((id) => {
        const h = people[id].guide!.officeHours;
        return (
          <li key={id}>
            <Avatar id={id} size={24} />
            <span className="rail-hours__text">
              <PersonName id={id} className="rail-hours__name" />
              <span>
                {h.when} · {h.open} of {h.total} open
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function Rail() {
  return (
    <aside className="home__rail" aria-label="Your Path at a glance">
      <section className="rail-card">
        <h2 className="rail-h">Coming up</h2>
        <UpNext variant="list" />
      </section>
      <section>
        <div className="rail-head">
          <h2 className="rail-h">Your Path this week</h2>
          <Link to="/path" className="rail-more">
            Open My Path
          </Link>
        </div>
        <RailPath />
      </section>
      <section>
        <h2 className="rail-h">People worth knowing</h2>
        <RailPeople ids={worth.slice(0, 3)} />
        <Link to="/network" className="rail-more rail-more--below">
          See more suggestions
        </Link>
      </section>
      <section>
        <h2 className="rail-h">Path Office Hours this week</h2>
        <RailHours />
        <Link to="/guides" className="rail-more rail-more--below">
          See all Path Guides
        </Link>
      </section>
      <section>
        <h2 className="rail-h">Your communities</h2>
        <RailCommunities />
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
  const unread = useUnread();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'for-you' | 'following'>('for-you');

  return (
    <Page
      title="Home"
      wide
      hideHeaderOnDesktop
      className="page--home"
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
          <Link to={`/p/${ME}`} aria-label="Your profile" className="home__me">
            <img src={me.photo} alt="" />
          </Link>
        ) : undefined
      }
    >
      <div className="home">
        <div className="home__main">
          {isMobile && (
            <>
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
          <div className="home__tabs">
            <TextTabs
              value={tab}
              onChange={setTab}
              options={[
                { value: 'for-you', label: 'For you' },
                { value: 'following', label: 'Following' },
              ]}
            />
          </div>
          {tab === 'for-you' ? <ForYou /> : <Following />}
        </div>
        {!isMobile && <Rail />}
      </div>
    </Page>
  );
}
