import { Page } from '../components/chrome';
import { DecisionItem } from '../components/content';
import { SectionHeader } from '../components/ui';
import { decisionList } from '../data/decisions';
import { ME } from '../data/people';
import './decisions.css';

export function Decisions() {
  const mine = decisionList.filter((d) => d.owner === ME);
  const near = decisionList.filter((d) => d.owner !== ME && d.community !== 'swe-pm');
  const far = decisionList.filter((d) => d.community === 'swe-pm');
  return (
    <Page title="Decision Points" subtitle="The forks in people’s Paths — and where each road actually led." wide>
      <section className="ds__mine">
        <SectionHeader title="The fork in front of you" size="title2" />
        {mine.map((d) => (
          <DecisionItem key={d.id} d={d} />
        ))}
      </section>
      <section className="ds__section">
        <SectionHeader title="Near your Path" subtitle="Decisions people on your route are facing, or have made" size="title2" />
        <div className="ds__grid">
          {near.map((d) => (
            <DecisionItem key={d.id} d={d} />
          ))}
        </div>
      </section>
      <section className="ds__section">
        <SectionHeader title="On other journeys" size="title2" />
        <div className="ds__grid">
          {far.map((d) => (
            <DecisionItem key={d.id} d={d} />
          ))}
        </div>
      </section>
    </Page>
  );
}
