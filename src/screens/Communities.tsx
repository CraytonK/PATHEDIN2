import { Page } from '../components/chrome';
import { CommunityRow, ThreadItem } from '../components/content';
import { SectionHeader } from '../components/ui';
import { communities, communityList, threads } from '../data/communities';
import { useApp } from '../lib/store';
import { useIsMobile } from '../lib/motion';
import './communities.css';

const onRoute: { id: string; reason: string }[] = [
  { id: 'bench-regulatory', reason: 'On the branch you’re exploring' },
  { id: 'lab-data', reason: 'Where Wei and Isabel are heading' },
  { id: 'newcomers-science', reason: 'Where Amara hosts, and Chloé and Grace help' },
];
const elsewhere = ['swe-pm', 'teach-ux', 'nursing-healthtech'];

export function Communities() {
  const joined = useApp((s) => s.joined);
  const isMobile = useIsMobile();
  const mine = communityList.filter((c) => joined[c.id]);
  const live = threads.filter((t) => joined[t.community]).slice(0, 5);
  return (
    <Page title="Communities" subtitle="Built around journeys, not industries. Find the people making the same move as you." wide>
      <div className="cms">
        <div className="cms__main">
          <section className="cms__section">
            <SectionHeader title="Your journeys" subtitle="Communities on your Path" size="title2" />
            {mine.map((c) => (
              <CommunityRow key={c.id} c={c} />
            ))}
          </section>
          <section className="cms__section">
            <SectionHeader title="Along your route" subtitle="Journeys that cross yours" size="title2" />
            {onRoute
              .filter((r) => !joined[r.id])
              .map((r) => (
                <CommunityRow key={r.id} c={communities[r.id]} reason={r.reason} />
              ))}
          </section>
          <section className="cms__section">
            <SectionHeader title="Other journeys" subtitle="Far from your Path, just as alive" size="title2" />
            {elsewhere.map((id) => (
              <CommunityRow key={id} c={communities[id]} />
            ))}
          </section>
        </div>
        {!isMobile && (
          <aside className="cms__rail">
            <SectionHeader title="Happening now" subtitle="In your journeys" size="headline" />
            {live.map((t) => (
              <ThreadItem key={t.id} t={t} showCommunity />
            ))}
          </aside>
        )}
      </div>
    </Page>
  );
}
