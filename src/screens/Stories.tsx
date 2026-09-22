import { useState } from 'react';
import { Page } from '../components/chrome';
import { StoryItem, StoryLead } from '../components/content';
import { Segmented } from '../components/ui';
import { storyList, stories } from '../data/stories';
import { people, ME } from '../data/people';
import { futureWaypoints, walked } from '../lib/relations';
import './stories.css';

const mine = new Set([...walked(people[ME]), ...futureWaypoints(people[ME])]);
const forYou = storyList.filter((s) => mine.has(s.segment[0]) || mine.has(s.segment[1]));

export function Stories() {
  const [scope, setScope] = useState<'you' | 'all'>('you');
  const list = scope === 'you' ? forYou : storyList;
  const lead = scope === 'you' ? stories['elena-cro'] : stories['claire-classroom'];
  return (
    <Page title="Stories" subtitle="The moves people made, told by the people who made them. Each one sits on a stretch of someone’s Path." wide>
      <div className="stories__filter">
        <Segmented
          value={scope}
          onChange={setScope}
          ariaLabel="Stories"
          options={[
            { value: 'you', label: 'Along your Path' },
            { value: 'all', label: 'Every journey' },
          ]}
        />
      </div>
      <div className="stories__lead">
        <StoryLead story={lead} />
      </div>
      <div className="stories__grid">
        {list
          .filter((s) => s.id !== lead.id)
          .map((s) => (
            <StoryItem key={s.id} story={s} />
          ))}
      </div>
    </Page>
  );
}
