import { Page } from '../components/chrome';
import { CommunityRow } from '../components/content';
import { RailFooter, RailPeople, RailPosts, RailSection } from '../components/Rail';
import { alongMyRoute, communities, communityList, elsewhereCommunities, threads } from '../data/communities';
import { useApp } from '../lib/store';
import './communities.css';

export function Communities() {
  const joined = useApp((s) => s.joined);
  const mine = communityList.filter((c) => joined[c.id]);
  const live = threads.filter((t) => joined[t.community]).slice(0, 4);
  return (
    <Page
      title="Communities"
      subtitle="Built around journeys, not industries. Find the people making the same move as you."
      rail={
        <>
          <RailSection title="Happening now">
            <RailPosts items={live.map((t) => ({ author: t.author, where: communities[t.community].title, title: t.title, to: `/c/${t.community}#${t.id}`, meta: `${t.ago} · ${t.replyCount} replies` }))} />
          </RailSection>
          <RailSection title="Hosts on your route" more={{ to: '/guides', label: 'See all Path Guides' }}>
            <RailPeople ids={['amara', 'tomas', 'priya']} action="request" />
          </RailSection>
          <RailFooter />
        </>
      }
    >
      <h2 className="list-h list-h--first">Your journeys</h2>
      <p className="list-sub">Communities on your Path</p>
      <div className="cms__list">
        {mine.map((c) => (
          <CommunityRow key={c.id} c={c} />
        ))}
      </div>
      <h2 className="list-h">Along your route</h2>
      <p className="list-sub">Journeys that cross yours</p>
      <div className="cms__list">
        {alongMyRoute
          .filter((r) => !joined[r.id])
          .map((r) => (
            <CommunityRow key={r.id} c={communities[r.id]} reason={r.reason} />
          ))}
      </div>
      <h2 className="list-h">Other journeys</h2>
      <p className="list-sub">Far from your Path, just as alive</p>
      <div className="cms__list">
        {elsewhereCommunities.map((id) => (
          <CommunityRow key={id} c={communities[id]} />
        ))}
      </div>
    </Page>
  );
}
