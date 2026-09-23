import { Link } from 'react-router-dom';
import { people, ME } from '../data/people';
import { wp } from '../data/waypoints';
import { destinations } from '../data/destinations';
import { communityList } from '../data/communities';
import { questionList } from '../data/questions';
import { storyList } from '../data/stories';
import { decisionList } from '../data/decisions';
import type { DestinationRoute } from '../data/types';
import { guidesInto, peopleAt, peopleHeading, peopleThrough } from '../lib/relations';
import { Avatar, AvatarStack, SaveToggle, formatCount } from './ui';
import { CommunityRow, DecisionItem, PersonRow, QuestionItem, StoryItem } from './content';
import { IconChevronRight } from './icons';
import './ecosystem.css';

/* Everything that lives around a destination: the routes people took, and the people on them. */

export function RouteLine({ route, dest, compact }: { route: DestinationRoute; dest: string; compact?: boolean }) {
  const stops = [...route.via, dest];
  return (
    <ol className={`route-line ${compact ? 'route-line--compact' : ''}`} aria-label={`${route.label}: ${stops.map((s) => wp(s).label).join(' to ')}`}>
      {stops.map((s, i) => (
        <li key={s} className={`route-line__stop ${i === stops.length - 1 ? 'is-dest' : ''}`}>
          <span className="route-line__dot" />
          <span className="route-line__label">{wp(s).short}</span>
        </li>
      ))}
    </ol>
  );
}

export function RouteItem({ route, dest, to }: { route: DestinationRoute; dest: string; to?: string }) {
  const travellers = route.travellers.length ? route.travellers : route.onRoute;
  const body = (
    <>
      <div className="route-item__top">
        <span className="t-headline">{route.label}</span>
        <span className="t-footnote c-2 t-num">{formatCount(route.people)} people</span>
      </div>
      <RouteLine route={route} dest={dest} compact />
      <div className="route-item__who t-footnote c-2">
        {travellers.length > 0 && <AvatarStack ids={travellers} size={20} max={3} />}
        <span>
          {route.travellers.length
            ? `${route.travellers.map((t) => people[t].first).slice(0, 2).join(' and ')}${route.travellers.length > 2 ? ` +${route.travellers.length - 2}` : ''} took it`
            : route.onRoute.length
              ? `${route.onRoute.map((t) => people[t].first).join(' and ')} ${route.onRoute.length > 1 ? 'are' : 'is'} on it now`
              : 'No one you know yet'}{' '}
          · ~{route.medianYears} yrs
        </span>
      </div>
    </>
  );
  return to ? (
    <Link to={to} className="route-item">
      {body}
      <IconChevronRight size={14} className="route-item__chev c-3" />
    </Link>
  ) : (
    <div className="route-item">{body}</div>
  );
}

export function Ecosystem({ dest, compact, bare }: { dest: string; compact?: boolean; bare?: boolean }) {
  const d = destinations[dest];
  const w = wp(dest);
  const guides = guidesInto(dest).filter((p) => p.id !== ME);
  const there = [...peopleAt(dest), ...peopleThrough(dest)].filter((p) => !p.guide && p.id !== ME);
  const heading = peopleHeading(dest).filter((p) => p.id !== ME);
  const comms = communityList.filter((c) => c.stages.some((s) => s.wp === dest)).slice(0, 3);
  const qs = questionList.filter((q) => q.about[1] === dest || q.about[0] === dest).slice(0, 2);
  const ss = storyList.filter((s) => s.segment[1] === dest || s.segment[0] === dest).slice(0, 2);
  const ds = decisionList.filter((x) => x.options.some((o) => o.wp === dest)).slice(0, 1);

  return (
    <div className={`eco ${compact ? 'eco--compact' : ''} ${bare ? 'eco--bare' : ''}`}>
      {!bare && (
      <div className="eco__head">
        <p className="eco__kicker t-eyebrow">{people[ME].futures.some((f) => f.destination === dest) ? 'Your destination' : 'Destination'}</p>
        <div className="eco__title-row">
          <h2 className="t-title1">{w.label}</h2>
          <SaveToggle saveKey={`destination:${dest}`} compact />
        </div>
        {d && <p className="t-callout c-2">{d.blurb}</p>}
        {d && (
          <p className="eco__stat t-footnote c-2">
            <strong className="t-num">{formatCount(d.people)}</strong> people are here now · <strong>{d.routes.length}</strong> routes in
          </p>
        )}
      </div>
      )}

      {d && !bare && (
        <section className="eco__section">
          <h3 className="eco__h">How people got here</h3>
          <div className="eco__routes">
            {d.routes.map((r) => (
              <RouteItem key={r.id} route={r} dest={dest} to={`/discover?to=${dest}&route=${r.id}`} />
            ))}
          </div>
        </section>
      )}

      {guides.length > 0 && !bare && (
        <section className="eco__section">
          <h3 className="eco__h">Guides who made it</h3>
          {guides.slice(0, compact ? 3 : 4).map((p) => (
            <PersonRow key={p.id} id={p.id} action="request" compact />
          ))}
        </section>
      )}

      {there.length > 0 && (
        <section className="eco__section">
          <h3 className="eco__h">Already there</h3>
          <div className="eco__faces">
            {there.slice(0, 8).map((p) => (
              <Link key={p.id} to={`/p/${p.id}`} className="eco__face">
                <Avatar id={p.id} size={48} />
                <span className="t-caption1 truncate">{p.first}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {heading.length > 0 && (
        <section className="eco__section">
          <h3 className="eco__h">Heading there with you</h3>
          {heading.slice(0, 3).map((p) => (
            <PersonRow key={p.id} id={p.id} compact />
          ))}
        </section>
      )}

      {comms.length > 0 && (
        <section className="eco__section">
          <h3 className="eco__h">Communities on the way</h3>
          {comms.map((c) => (
            <CommunityRow key={c.id} c={c} />
          ))}
        </section>
      )}

      {ds.length > 0 && (
        <section className="eco__section">
          <h3 className="eco__h">Decisions people faced</h3>
          {ds.map((x) => (
            <DecisionItem key={x.id} d={x} />
          ))}
        </section>
      )}

      {qs.length > 0 && (
        <section className="eco__section">
          <h3 className="eco__h">Questions about getting here</h3>
          {qs.map((q) => (
            <QuestionItem key={q.id} q={q} />
          ))}
        </section>
      )}

      {ss.length > 0 && (
        <section className="eco__section">
          <h3 className="eco__h">Stories from the road</h3>
          <div className="eco__stories">
            {ss.map((s) => (
              <StoryItem key={s.id} story={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
