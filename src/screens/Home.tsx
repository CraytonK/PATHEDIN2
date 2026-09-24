import { useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Page, useUnread } from '../components/chrome';
import { PathPulse, type PulseStop } from '../components/PathPulse';
import { type PostKind } from '../components/Post';
import { DecisionPost, GuidePost, KindFeed, KindFilter, MilestonePost, MyPostItem, QuestionPost, RoutePost, StoryPost, ThreadPost, feedKinds } from '../components/FeedItems';
import { useWriting } from '../lib/writing';
import { RailCommunities, RailFooter, RailPeople } from '../components/Rail';
import { PersonTile } from '../components/content';
import { Avatar, AvatarStack, IconButton, PersonName, SectionHeader, TextTabs } from '../components/ui';
import { IconBell, IconChevronRight, IconCompose, IconMessage } from '../components/icons';
import { people, me, ME } from '../data/people';
import { stories } from '../data/stories';
import { questions, questionList } from '../data/questions';
import { decisions } from '../data/decisions';
import { threads, communities } from '../data/communities';
import { destinations } from '../data/destinations';
import { edgeClass, useIsMobile, useScrollEdges } from '../lib/motion';
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
        {!isMobile && <Rail />}
      </div>
    </Page>
  );
}
