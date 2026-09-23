import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Page } from '../components/chrome';
import { DefaultRail } from '../components/Rail';
import { DecisionItem, PersonRow, QuestionItem, StoryItem } from '../components/content';
import { RouteItem } from '../components/Ecosystem';
import { TextTabs } from '../components/ui';
import { IconBookmark } from '../components/icons';
import { useApp } from '../lib/store';
import { people } from '../data/people';
import { stories } from '../data/stories';
import { questions } from '../data/questions';
import { decisions } from '../data/decisions';
import { destinations } from '../data/destinations';
import { wp } from '../data/waypoints';
import './lists.css';

type Kind = 'person' | 'route' | 'destination' | 'story' | 'question' | 'decision';
const labels: Record<Kind, string> = { person: 'People', route: 'Routes', destination: 'Destinations', story: 'Stories', question: 'Questions', decision: 'Decisions' };

export function Saved() {
  const saved = useApp((s) => s.saved);
  const keys = Object.keys(saved).filter((k) => saved[k]);
  const of = (k: Kind) => keys.filter((x) => x.startsWith(`${k}:`)).map((x) => x.slice(k.length + 1));
  const kinds = (Object.keys(labels) as Kind[]).filter((k) => of(k).length);
  const [tab, setTab] = useState<Kind>(kinds[0] ?? 'person');
  const items = of(tab);
  return (
    <Page title="Saved" subtitle="People, routes and stories you want to come back to." back="Home" rail={<DefaultRail />}>
      <div className="list-page">
        {kinds.length === 0 ? (
          <div className="empty">
            <IconBookmark size={32} />
            <p className="t-headline">Nothing saved yet</p>
            <p className="t-subhead c-2">Save a route in Discover or a story you want to reread.</p>
          </div>
        ) : (
          <>
            <TextTabs value={tab} onChange={setTab} options={kinds.map((k) => ({ value: k, label: labels[k], count: of(k).length }))} />
            <div className="saved">
              {tab === 'person' && items.filter((id) => people[id]).map((id) => <PersonRow key={id} id={id} />)}
              {tab === 'story' && items.filter((id) => stories[id]).map((id) => <StoryItem key={id} story={stories[id]} />)}
              {tab === 'question' && items.filter((id) => questions[id]).map((id) => <QuestionItem key={id} q={questions[id]} />)}
              {tab === 'decision' && items.filter((id) => decisions[id]).map((id) => <DecisionItem key={id} d={decisions[id]} />)}
              {tab === 'route' &&
                items.map((k) => {
                  const [dest, rid] = k.split('/');
                  const r = destinations[dest]?.routes.find((x) => x.id === rid);
                  return r ? (
                    <div key={k}>
                      <p className="t-footnote c-2 saved__route-to">To {wp(dest).label}</p>
                      <RouteItem route={r} dest={dest} to={`/discover?to=${dest}&route=${rid}`} />
                    </div>
                  ) : null;
                })}
              {tab === 'destination' &&
                items.map((d) => (
                  <Link key={d} to={`/discover?to=${d}`} className="saved__dest">
                    <span className="t-title3">{wp(d).label}</span>
                    <span className="t-footnote c-2">{destinations[d]?.routes.length ?? 0} routes in</span>
                  </Link>
                ))}
            </div>
          </>
        )}
      </div>
    </Page>
  );
}
