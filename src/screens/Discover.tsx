import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Page } from '../components/chrome';
import { Confluence } from '../components/path/Confluence';
import { Ecosystem, RouteLine } from '../components/Ecosystem';
import { CommunityRow, PersonRow } from '../components/content';
import { SearchField, SearchResults } from '../components/SearchLayer';
import { AvatarStack, Button, GroupedList, SaveToggle, formatCount } from '../components/ui';
import { IconBook, IconCheck, IconPeople, IconPlus, IconQuestion, IconSignpost } from '../components/icons';
import { storyList } from '../data/stories';
import { questionList } from '../data/questions';
import { decisionList } from '../data/decisions';
import { destinations, nearMe, otherJourneys } from '../data/destinations';
import { communities } from '../data/communities';
import { people, me, ME } from '../data/people';
import { wp } from '../data/waypoints';
import { peopleAt, peopleThrough } from '../lib/relations';
import { springs } from '../lib/motion';
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

export function Discover() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const to = params.get('to');
  const dest = to ? destinations[to] : undefined;
  const route = params.get('route') ?? dest?.routes[0]?.id ?? null;

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
    <Page title="Discover" subtitle="Where could you go? Start from a destination and see how real people got there." wide>
      <div className="discover__search">
        <SearchField value={q} onChange={setQ} placeholder="Try “Pharmaceutical R&D” or “UX Research”" />
      </div>
      {q ? (
        <div className="discover__results">
          <SearchResults q={q} onPick={(href) => navigate(href)} onSuggest={setQ} />
        </div>
      ) : (
        <>
          <section className="discover__section">
            <div className="discover__section-head">
              <h2 className="t-title2">Futures near your Path</h2>
              <p className="t-subhead c-2">Destinations people reached from an MSc in Chemistry.</p>
            </div>
            <div className="doors">
              {nearMe.map((id, i) => (
                <DestinationDoor key={id} id={id} i={i} />
              ))}
            </div>
          </section>
          <section className="discover__section discover__ways">
            <div className="discover__section-head">
              <h2 className="t-title2">Other ways to explore</h2>
              <p className="t-subhead c-2">Learn from the people who already made the move.</p>
            </div>
            <GroupedList
              rows={[
                { icon: <IconPeople />, title: 'Path Guides', detail: 'People who’ve been where you’re going', to: '/guides' },
                { icon: <IconBook />, title: 'Stories', detail: 'The moves people made, in their words', value: storyList.length, to: '/stories' },
                { icon: <IconQuestion />, title: 'Questions', detail: 'Answered by people ahead of you', value: questionList.length, to: '/questions' },
                { icon: <IconSignpost />, title: 'Decision Points', detail: 'Forks in people’s Paths, and where they led', value: decisionList.length, to: '/decisions' },
              ]}
            />
          </section>
          <section className="discover__section">
            <div className="discover__section-head">
              <h2 className="t-title2">Other journeys on PathedIn</h2>
              <p className="t-subhead c-2">Far from your Path — but people make these moves every week.</p>
            </div>
            <div className="doors">
              {otherJourneys.map((id, i) => (
                <DestinationDoor key={id} id={id} i={i} />
              ))}
            </div>
          </section>
        </>
      )}
    </Page>
  );
}
