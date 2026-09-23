import { useState } from 'react';
import { Page } from '../components/chrome';
import { StoryItem, StoryLead } from '../components/content';
import { RailFooter, RailPeople, RailPosts, RailSection } from '../components/Rail';
import { TextTabs } from '../components/ui';
import { storyList, stories } from '../data/stories';
import { people, ME } from '../data/people';
import { futureWaypoints, walked } from '../lib/relations';
import './stories.css';

const mine = new Set([...walked(people[ME]), ...futureWaypoints(people[ME])]);
const forYou = storyList.filter((s) => mine.has(s.segment[0]) || mine.has(s.segment[1]));
const mostRead = [...forYou].sort((a, b) => b.reads - a.reads).slice(0, 3);
const writers = [...new Set(forYou.map((s) => s.author))].filter((a) => a !== ME).slice(0, 3);

export function Stories() {
  const [scope, setScope] = useState<'you' | 'all'>('you');
  const list = scope === 'you' ? forYou : storyList;
  const lead = scope === 'you' ? stories['elena-cro'] : stories['claire-classroom'];
  return (
    <Page
      title="Stories"
      subtitle="The moves people made, told by the people who made them. Each one sits on a stretch of someone’s Path."
      rail={
        <>
          <RailSection title="Most read on your route">
            <RailPosts items={mostRead.map((s) => ({ author: s.author, title: s.title, to: `/stories/${s.id}`, meta: `${s.published} · ${s.minutes} min read` }))} />
          </RailSection>
          <RailSection title="Writers ahead of you" more={{ to: '/network', label: 'See more suggestions' }}>
            <RailPeople ids={writers} />
          </RailSection>
          <RailFooter />
        </>
      }
    >
      <div className="list-tabs">
        <TextTabs
          value={scope}
          onChange={setScope}
          options={[
            { value: 'you', label: 'Along your Path' },
            { value: 'all', label: 'Every journey' },
          ]}
        />
      </div>
      <StoryLead story={lead} />
      <div className="post-list">
        {list
          .filter((s) => s.id !== lead.id)
          .map((s, i) => (
            <StoryItem key={s.id} story={s} i={i} />
          ))}
      </div>
    </Page>
  );
}
