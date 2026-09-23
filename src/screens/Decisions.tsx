import { Page } from '../components/chrome';
import { DecisionItem } from '../components/content';
import { RailFooter, RailPeople, RailPills, RailSection } from '../components/Rail';
import { decisionList } from '../data/decisions';
import { communities } from '../data/communities';
import { ME } from '../data/people';
import './decisions.css';

export function Decisions() {
  const mine = decisionList.filter((d) => d.owner === ME);
  const near = decisionList.filter((d) => d.owner !== ME && d.community !== 'swe-pm');
  const far = decisionList.filter((d) => d.community === 'swe-pm');
  const places = [...new Set(decisionList.map((d) => d.community))].filter((c) => communities[c]);
  return (
    <Page
      title="Decision Points"
      subtitle="The forks in people’s Paths — and where each road actually led."
      rail={
        <>
          <RailSection title="Deciding the same thing" more={{ to: '/network', label: 'See more suggestions' }}>
            <RailPeople ids={['sarah', 'jonah', 'wei']} />
          </RailSection>
          <RailSection title="Where these forks come up">
            <RailPills items={places.map((c) => ({ to: `/c/${c}`, label: communities[c].title }))} />
          </RailSection>
          <RailFooter />
        </>
      }
    >
      <h2 className="list-h list-h--first">The fork in front of you</h2>
      <div className="post-list">
        {mine.map((d, i) => (
          <DecisionItem key={d.id} d={d} i={i} />
        ))}
      </div>
      <h2 className="list-h">Near your Path</h2>
      <p className="list-sub">Decisions people on your route are facing, or have made.</p>
      <div className="post-list">
        {near.map((d, i) => (
          <DecisionItem key={d.id} d={d} i={i} />
        ))}
      </div>
      <h2 className="list-h">On other journeys</h2>
      <div className="post-list">
        {far.map((d, i) => (
          <DecisionItem key={d.id} d={d} i={i} />
        ))}
      </div>
    </Page>
  );
}
