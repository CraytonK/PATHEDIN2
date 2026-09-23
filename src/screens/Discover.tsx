import { AnimatePresence, motion } from 'framer-motion';
import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Page } from '../components/chrome';
import { Confluence } from '../components/path/Confluence';
import { PathHint } from '../components/path/PathHint';
import { Ecosystem, RouteLine } from '../components/Ecosystem';
import { CommunityRow, CommunityTitle, ConnectButton, JoinButton, PersonRow, RequestButton } from '../components/content';
import { SearchField, SearchResults } from '../components/SearchLayer';
import { Avatar, AvatarStack, Button, RelationGlyph, RelationTag, SaveToggle, TextTabs, formatCount } from '../components/ui';
import { IconCalendar, IconCheck, IconPlus } from '../components/icons';
import { storyList } from '../data/stories';
import { questionList } from '../data/questions';
import { decisionList } from '../data/decisions';
import { destinations, nearMe, otherJourneys } from '../data/destinations';
import { alongMyRoute, communities, communityList, elsewhereCommunities } from '../data/communities';
import { people, peopleList, me, ME } from '../data/people';
import { wp } from '../data/waypoints';
import type { Community } from '../data/types';
import { peopleAt, peopleThrough, relationCopy, relationTo, type RelationKind } from '../lib/relations';
import { springs, useIsMobile } from '../lib/motion';
import { useApp } from '../lib/store';
import './discover.css';

function RouteFan({ n }: { n: number }) {
  const H = 44;
  const W = 72;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className="fan">
      {Array.from({ length: n }).map((_, i) => {
        const y = n === 1 ? H / 2 : 6 + (i * (H - 12)) / (n - 1);
        return <path key={i} d={`M 2 ${y} L 26 ${y} C 42 ${y} 46 ${H / 2} 62 ${H / 2}`} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" opacity={0.35 + 0.65 * ((n - i) / n)} />;
      })}
      <circle cx={64} cy={H / 2} r={5} fill="var(--tint)" />
    </svg>
  );
}

function DestinationDoor({ id, i }: { id: string; i: number }) {
  const d = destinations[id];
  const w = wp(id);
  const there = [...peopleAt(id), ...peopleThrough(id)].map((p) => p.id).filter((x) => x !== ME);
  const fromYou = d.routes.filter((r) => r.via.includes(me.path.at(-1)!.wp)).length;
  const mine = me.futures.some((f) => f.destination === id);
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springs.smooth, delay: i * 0.04 }}>
      <Link to={`/discover?to=${id}`} className={`door ${mine ? 'is-mine' : ''}`}>
        <div className="door__top">
          <RouteFan n={d.routes.length} />
          {mine && <span className="door__mine t-caption1">On your Path</span>}
        </div>
        <h3 className="door__title">{w.label}</h3>
        <p className="t-subhead c-2 clamp-2">{d.blurb}</p>
        <div className="door__meta t-footnote c-2">
          {there.length > 0 && <AvatarStack ids={there} size={22} max={3} />}
          <span>
            {formatCount(d.people)} here · {d.routes.length} {d.routes.length === 1 ? 'route' : 'routes'}
            {fromYou > 0 && (
              <>
                {' '}
                · <span className="door__from">{fromYou} from where you are</span>
              </>
            )}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

function RoutePanel({ destId, routeId }: { destId: string; routeId: string }) {
  const d = destinations[destId];
  const r = d.routes.find((x) => x.id === routeId) ?? d.routes[0];
  const saved = useApp((s) => !!s.saved[`route:${destId}/${r.id}`]);
  const toggleSave = useApp((s) => s.toggleSave);
  const added = useApp((s) => !!s.addedRoutes[r.id]);
  const toggleRoute = useApp((s) => s.toggleRoute);
  const onMyPath = destId === me.futures[0].destination && (me.futures[0].routes?.some((x) => x.id === r.id) || added);
  const canAdd = destId === me.futures[0].destination && !me.futures[0].routes?.some((x) => x.id === r.id);
  const c = r.community ? communities[r.community] : undefined;
  const guides = r.guides.map((g) => people[g]);
  const walkers = [...r.travellers.filter((t) => !r.guides.includes(t)), ...r.onRoute];
  return (
    <motion.div key={r.id} className="route-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={springs.smooth}>
      <div className="route-panel__head">
        <div>
          <p className="route-panel__kicker t-eyebrow">Route · {formatCount(r.people)} people · ~{r.medianYears} years</p>
          <h2 className="t-title2">{r.label}</h2>
        </div>
        <div className="route-panel__actions">
          {canAdd && (
            <Button variant={added ? 'gray' : 'tinted'} size="small" icon={added ? <IconCheck size={15} /> : <IconPlus size={15} />} onClick={() => toggleRoute(r.id)}>
              {added ? 'On your Path' : 'Add to my Path'}
            </Button>
          )}
          {onMyPath && !canAdd && <span className="route-panel__on t-footnote">On your Path</span>}
          <Button variant={saved ? 'gray' : 'outline'} size="small" onClick={() => toggleSave(`route:${destId}/${r.id}`)}>
            {saved ? 'Following route' : 'Follow route'}
          </Button>
        </div>
      </div>
      <div className="route-panel__line">
        <RouteLine route={r} dest={destId} />
      </div>
      <p className="route-panel__note t-body">{r.note}</p>

      <div className="route-panel__grid">
        {guides.length > 0 && (
          <section>
            <h3 className="eco__h">Guides who walked it</h3>
            {guides.map((g) => (
              <PersonRow key={g.id} id={g.id} action="request" compact />
            ))}
          </section>
        )}
        {walkers.length > 0 && (
          <section>
            <h3 className="eco__h">{r.onRoute.length ? 'On it now, and people who finished' : 'People who took it'}</h3>
            {walkers.slice(0, 4).map((id) => (
              <PersonRow key={id} id={id} compact />
            ))}
          </section>
        )}
        {c && (
          <section>
            <h3 className="eco__h">The community for this route</h3>
            <CommunityRow c={c} />
          </section>
        )}
      </div>
    </motion.div>
  );
}

type Tab = 'for-you' | 'people' | 'guides' | 'communities' | 'destinations';

const tabs: { value: Tab; label: string }[] = [
  { value: 'for-you', label: 'For you' },
  { value: 'people', label: 'People' },
  { value: 'guides', label: 'Path Guides' },
  { value: 'communities', label: 'Communities' },
  { value: 'destinations', label: 'Destinations' },
];

function Section({ title, sub, more, onMore, children }: { title: string; sub?: string; more?: string; onMore?: () => void; children: ReactNode }) {
  return (
    <section className="discover__section">
      <div className="discover__section-head">
        <div>
          <h2 className="t-title2">{title}</h2>
          {sub && <p className="t-subhead c-2">{sub}</p>}
        </div>
        {more && onMore && (
          <button type="button" className="discover__more t-subhead" onClick={onMore}>
            {more}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

/** Someone worth knowing: who they are, why they're here, and their Path in one line. */
function PersonCard({ id, why }: { id: string; why?: string }) {
  const p = people[id];
  const rel = relationTo(id);
  return (
    <article className="dcard">
      <Link to={`/p/${id}`} className="dcard__who">
        <Avatar id={id} size={56} />
        <span className="dcard__name">{p.name}</span>
      </Link>
      {rel.kind !== 'other' && rel.kind !== 'self' && <RelationTag kind={rel.kind} label={rel.label} className="dcard__rel" />}
      <p className="dcard__headline">{p.headline}</p>
      <p className="dcard__why clamp-3">{why ?? rel.why}</p>
      <div className="dcard__foot">
        <PathHint id={id} />
        <ConnectButton id={id} />
      </div>
    </article>
  );
}

/** A Path Guide: the move they made, what they help with, and when they're free. */
function GuideCard({ id }: { id: string }) {
  const g = people[id];
  const guide = g.guide!;
  const move = guide.transitions[0];
  return (
    <article className="dcard dcard--guide">
      <Link to={`/p/${id}`} className="dcard__who">
        <Avatar id={id} size={56} />
        <span className="dcard__name">{g.name}</span>
      </Link>
      {move && (
        <p className="dcard__move">
          <RelationGlyph kind="guide" size={15} />
          <span>
            Made the move {wp(move[0]).short} → {wp(move[1]).short}
          </span>
        </p>
      )}
      <p className="dcard__headline">{g.headline}</p>
      <p className="dcard__why clamp-2">Helps with {guide.helpsWith[0][0].toLowerCase() + guide.helpsWith[0].slice(1)}</p>
      <p className="dcard__hours">
        <IconCalendar size={14} /> {guide.officeHours.when} · <strong>{guide.officeHours.open} of {guide.officeHours.total} open</strong>
      </p>
      <div className="dcard__foot">
        <PathHint id={id} segment={move} />
        <RequestButton id={id} segment={move} variant="tinted" label="Ask" />
      </div>
    </article>
  );
}

/** A community, as a journey: who's on it and how alive it is. */
function CommunityCard({ c, reason }: { c: Community; reason?: string }) {
  return (
    <Link to={`/c/${c.id}`} className="dcard dcard--community">
      {reason && <p className="dcard__reason">{reason}</p>}
      <h3 className="dcard__title">
        <CommunityTitle c={c} />
      </h3>
      <p className="dcard__why clamp-3">{c.description}</p>
      <div className="dcard__members">
        <AvatarStack ids={c.memberIds.filter((m) => m !== ME)} size={22} max={4} />
        <span>
          {formatCount(c.members)} on this journey · <span className="dcard__live">{c.activeNow} here now</span>
        </span>
      </div>
      <div className="dcard__foot">
        <span className="dcard__guides">
          {c.guides} Path {c.guides === 1 ? 'Guide' : 'Guides'}
        </span>
        <JoinButton id={c.id} />
      </div>
    </Link>
  );
}

function ForYou({ go }: { go: (t: Tab) => void }) {
  return (
    <>
      <Section title="People worth knowing" sub="Not in your network yet, and on or near your Path." more="See all people" onMore={() => go('people')}>
        <div className="dgrid dgrid--row">
          {['aisha', 'yusuf', 'olivia'].map((id) => (
            <PersonCard key={id} id={id} />
          ))}
        </div>
      </Section>
      <Section title="Path Guides for your next move" sub="They made the moves you’re weighing, and they’ve said they’d help." more="See all Guides" onMore={() => go('guides')}>
        <div className="dgrid dgrid--row">
          {['grace', 'priya', 'rafael'].map((id) => (
            <GuideCard key={id} id={id} />
          ))}
        </div>
      </Section>
      <Section title="Communities along your route" sub="Built around journeys, not industries." more="See all communities" onMore={() => go('communities')}>
        <div className="dgrid dgrid--row">
          {alongMyRoute.map((r) => (
            <CommunityCard key={r.id} c={communities[r.id]} reason={r.reason} />
          ))}
        </div>
      </Section>
      <Section title="Futures near your Path" sub="Destinations people reached from an MSc in Chemistry." more="See all destinations" onMore={() => go('destinations')}>
        <div className="doors">
          {nearMe.slice(0, 3).map((id, i) => (
            <DestinationDoor key={id} id={id} i={i} />
          ))}
        </div>
      </Section>
      <Section title="More to explore" sub="Learn from the people who already made the move.">
        <div className="rail-pills discover__pills">
          {[
            { to: '/stories', label: `Stories · ${storyList.length}` },
            { to: '/questions', label: `Questions · ${questionList.length}` },
            { to: '/decisions', label: `Decision Points · ${decisionList.length}` },
          ].map((x) => (
            <Link key={x.to} to={x.to} className="rail-pill">
              {x.label}
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}

const peopleGroups: { kinds: RelationKind[]; title: string; sub: string }[] = [
  { kinds: ['twin', 'peer'], title: 'At your step', sub: 'The same stage as you, facing the same question.' },
  { kinds: ['ahead'], title: 'A step or more ahead', sub: relationCopy.ahead.blurb },
  { kinds: ['explorer'], title: 'Arriving from other starting points', sub: 'Different beginnings, heading where you are.' },
  { kinds: ['behind'], title: 'A step behind you', sub: relationCopy.behind.blurb },
  { kinds: ['other'], title: 'On other journeys', sub: 'Far from your Path, and worth knowing anyway.' },
];

function PeopleTab() {
  const connections = useApp((s) => s.connections);
  // Discover is for people you don't know yet; your connections live in Network.
  const [known] = useState(() => new Set(Object.keys(connections).filter((k) => connections[k] === 'connected')));
  return (
    <>
      <p className="discover__lede t-subhead c-2">
        Everyone here is placed by their Path, relative to yours. Your connections are in <Link to="/network">Network</Link>.
      </p>
      {peopleGroups.map((g) => {
        const ids = peopleList.filter((p) => p.id !== ME && !p.guide && !known.has(p.id) && g.kinds.includes(relationTo(p.id).kind)).map((p) => p.id);
        if (!ids.length) return null;
        return (
          <Section key={g.title} title={g.title} sub={g.sub}>
            <div className="dgrid">
              {ids.map((id) => (
                <PersonCard key={id} id={id} />
              ))}
            </div>
          </Section>
        );
      })}
    </>
  );
}

function GuidesTab() {
  const guides = peopleList.filter((p) => p.id !== ME && p.guide);
  const mine = guides.filter((g) => relationTo(g.id).kind !== 'other');
  const others = guides.filter((g) => relationTo(g.id).kind === 'other');
  return (
    <>
      <p className="discover__lede t-subhead c-2">
        Path Guides are never paid, ranked or rated. They’re people who were once where you are.{' '}
        <Link to="/guides">Browse Guides by the move they made</Link>
      </p>
      <Section title="On your route" sub="Guides who made the moves between you and Pharmaceutical R&D.">
        <div className="dgrid">
          {mine.map((g) => (
            <GuideCard key={g.id} id={g.id} />
          ))}
        </div>
      </Section>
      {others.length > 0 && (
        <Section title="On other journeys" sub="If you’re curious about a different Path.">
          <div className="dgrid">
            {others.map((g) => (
              <GuideCard key={g.id} id={g.id} />
            ))}
          </div>
        </Section>
      )}
    </>
  );
}

function CommunitiesTab() {
  const joined = useApp((s) => s.joined);
  const mine = communityList.filter((c) => joined[c.id]);
  return (
    <>
      <Section title="Along your route" sub="Journeys that cross yours.">
        <div className="dgrid">
          {alongMyRoute.map((r) => (
            <CommunityCard key={r.id} c={communities[r.id]} reason={r.reason} />
          ))}
        </div>
      </Section>
      <Section title="Other journeys" sub="Far from your Path, just as alive.">
        <div className="dgrid">
          {elsewhereCommunities.map((id) => (
            <CommunityCard key={id} c={communities[id]} />
          ))}
        </div>
      </Section>
      {mine.length > 0 && (
        <Section title="Yours" sub="Communities you’ve joined.">
          <div className="dgrid">
            {mine.map((c) => (
              <CommunityCard key={c.id} c={c} />
            ))}
          </div>
        </Section>
      )}
    </>
  );
}

function DestinationsTab() {
  return (
    <>
      <Section title="Futures near your Path" sub="Destinations people reached from an MSc in Chemistry. Open one to see every route in.">
        <div className="doors">
          {nearMe.map((id, i) => (
            <DestinationDoor key={id} id={id} i={i} />
          ))}
        </div>
      </Section>
      <Section title="Other journeys on PathedIn" sub="Far from your Path, but people make these moves every week.">
        <div className="doors">
          {otherJourneys.map((id, i) => (
            <DestinationDoor key={id} id={id} i={i} />
          ))}
        </div>
      </Section>
    </>
  );
}

export function Discover() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const to = params.get('to');
  const dest = to ? destinations[to] : undefined;
  const route = params.get('route') ?? dest?.routes[0]?.id ?? null;
  const isMobile = useIsMobile();
  const tab = (tabs.some((t) => t.value === params.get('tab')) ? params.get('tab') : 'for-you') as Tab;
  const setTab = (t: Tab) => setParams(t === 'for-you' ? {} : { tab: t }, { replace: true });

  if (dest && to) {
    const w = wp(to);
    return (
      <Page
        title={w.label}
        eyebrow="Destination"
        back="Discover"
        subtitle={dest.blurb}
        wide
        largeTrailing={<SaveToggle saveKey={`destination:${to}`} label="Save destination" />}
      >
        <section className="discover__confluence">
          <div className="discover__confluence-head">
            <h2 className="t-title3">How {formatCount(dest.people)} people got here</h2>
            <p className="t-subhead c-2">Every line is a route real people took. Tap one to follow it.</p>
          </div>
          <Confluence dest={dest} selected={route} onSelect={(id) => setParams({ to, route: id }, { replace: true })} />
        </section>
        <AnimatePresence mode="wait">{route && <RoutePanel key={route} destId={to} routeId={route} />}</AnimatePresence>
        <div className="discover__eco">
          <Ecosystem dest={to} bare />
        </div>
      </Page>
    );
  }

  return (
    <Page title="Discover" subtitle="People, Path Guides, communities and destinations, all found through the Paths people have walked." wide>
      <div className="discover__search">
        <SearchField value={q} onChange={setQ} placeholder={isMobile ? 'Search people, Guides and more' : 'Search people, Guides, communities or destinations'} />
      </div>
      {q ? (
        <div className="discover__results">
          <SearchResults q={q} onPick={(href) => navigate(href)} onSuggest={setQ} />
        </div>
      ) : (
        <>
          <div className="discover__tabs">
            <TextTabs value={tab} onChange={setTab} options={tabs} />
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              {tab === 'for-you' && <ForYou go={setTab} />}
              {tab === 'people' && <PeopleTab />}
              {tab === 'guides' && <GuidesTab />}
              {tab === 'communities' && <CommunitiesTab />}
              {tab === 'destinations' && <DestinationsTab />}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </Page>
  );
}
