import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Page, Sheet } from '../components/chrome';
import { TransitMap, stationPeople, type MapNode } from '../components/path/TransitMap';
import { PathStrip } from '../components/path/PathStrip';
import { Ecosystem, RouteItem } from '../components/Ecosystem';
import { CommunityRow, DecisionItem, PersonRow, QuestionItem, RequestButton, StoryItem } from '../components/content';
import { AvatarStack, Button } from '../components/ui';
import { IconCheck, IconPlus } from '../components/icons';
import { people, me, ME } from '../data/people';
import { wp } from '../data/waypoints';
import { destinations } from '../data/destinations';
import { decisions } from '../data/decisions';
import { communities } from '../data/communities';
import { questionList } from '../data/questions';
import { storyList } from '../data/stories';
import type { FutureRoute } from '../data/types';
import { guidesInto, peopleAt, peopleThrough, relationTo } from '../lib/relations';
import { useIsMobile, springs } from '../lib/motion';
import { useApp } from '../lib/store';
import './mypath.css';

const main = me.futures[0];
const mineIds = new Set(main.routes?.map((r) => r.id));
const suggestedRoutes = destinations[main.destination].routes.filter((r) => !mineIds.has(r.id));

function useExtraRoutes(): FutureRoute[] {
  const added = useApp((s) => s.addedRoutes);
  return useMemo(
    () =>
      suggestedRoutes
        .filter((r) => added[r.id])
        .map((r) => ({ id: r.id, label: r.label, steps: [r.via[r.via.length - 1]], share: r.people / 1240, people: r.people })),
    [added],
  );
}

export function MyPath() {
  const isMobile = useIsMobile();
  const [params] = useSearchParams();
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<string | null>(params.get('focus') ? `dest-${params.get('focus')}` : 'present');
  const [focusRoute, setFocusRoute] = useState<string | null>(null);
  const [walking, setWalking] = useState<MapNode | null>(null);
  const [sheetNode, setSheetNode] = useState<MapNode | null>(null);
  const [nodeCache, setNodeCache] = useState<Record<string, MapNode>>({});
  const extraRoutes = useExtraRoutes();

  // The routes open on their own the first time, so the Path is seen settling into place.
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem('pathedin:opened-routes') === '1';
      sessionStorage.setItem('pathedin:opened-routes', '1');
    } catch {
      /* ignore */
    }
    const t = setTimeout(() => setExpanded(true), seen ? 0 : 1500);
    return () => clearTimeout(t);
  }, []);

  const onSelect = (n: MapNode) => {
    setNodeCache((c) => ({ ...c, [n.key]: n }));
    setSelected(n.key);
    if (isMobile) setSheetNode(n);
  };

  const active = walking ?? (selected ? nodeCache[selected] : null);

  return (
    <Page
      title="My Path"
      subtitle="Where you’ve been, where you are, and where you’re heading."
      wide
      trailing={
        !isMobile && (
          <Link to="/p/maya">
            <Button variant="gray" size="medium">
              View as others see it
            </Button>
          </Link>
        )
      }
    >
      <div className="mypath">
        <div className="mypath__map">
          <div className="mypath__sentence">
            <PathStrip id={ME} size="md" wrap long />
          </div>
          <TransitMap
            personId={ME}
            interactive
            expanded={expanded}
            onToggleExpanded={() => setExpanded((e) => !e)}
            selected={selected}
            onSelect={onSelect}
            focusRoute={focusRoute}
            onFocusRoute={setFocusRoute}
            walkable
            onWalk={setWalking}
            extraRoutes={extraRoutes}
          />
          <AddRoutes />
        </div>

        {!isMobile && (
          <aside className="mypath__inspector">
            <AnimatePresence mode="wait">
              <motion.div
                key={active?.key ?? 'present'}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                transition={springs.smooth}
              >
                <Inspector node={active} walking={!!walking} />
              </motion.div>
            </AnimatePresence>
          </aside>
        )}
      </div>

      {isMobile && (
        <>
          <AnimatePresence>
            {walking && (
              <motion.div className="walk-card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={springs.snappy}>
                <WalkCard node={walking} />
              </motion.div>
            )}
          </AnimatePresence>
          <section className="mypath__around">
            <Inspector node={null} walking={false} />
          </section>
          <Sheet open={!!sheetNode} onClose={() => setSheetNode(null)} detent="medium" title={sheetNode?.title} label={sheetNode?.title}>
            <div className="mypath__sheet">{sheetNode && <Inspector node={sheetNode} walking={false} hideTitle />}</div>
          </Sheet>
        </>
      )}
    </Page>
  );
}

function AddRoutes() {
  const added = useApp((s) => s.addedRoutes);
  const toggle = useApp((s) => s.toggleRoute);
  if (!suggestedRoutes.length) return null;
  return (
    <div className="add-routes">
      <p className="add-routes__h t-footnote">Routes to {wp(main.destination).short} you haven’t considered</p>
      {suggestedRoutes.map((r) => (
        <div key={r.id} className="add-routes__item">
          <div>
            <p className="t-subhead w-600">{r.label}</p>
            <p className="t-footnote c-2">
              {r.people} people · {r.travellers.map((t) => people[t].first).join(' and ')} took it
            </p>
          </div>
          <Button
            variant={added[r.id] ? 'gray' : 'tinted'}
            size="small"
            icon={added[r.id] ? <IconCheck size={15} /> : <IconPlus size={15} />}
            onClick={() => toggle(r.id)}
          >
            {added[r.id] ? 'On your Path' : 'Add'}
          </Button>
        </div>
      ))}
    </div>
  );
}

function WalkCard({ node }: { node: MapNode }) {
  const ppl = stationPeople(ME, node);
  return (
    <div className="walk-card__inner">
      <p className="walk-card__kicker t-caption1">Walking ahead</p>
      <p className="t-headline">{node.title}</p>
      {ppl ? (
        <div className="walk-card__people">
          <AvatarStack ids={ppl.ids} size={26} max={5} />
          <span className="t-footnote c-2">{ppl.text}</span>
        </div>
      ) : (
        <p className="t-footnote c-2">{node.sub}</p>
      )}
    </div>
  );
}

function Inspector({ node, walking, hideTitle }: { node: MapNode | null; walking: boolean; hideTitle?: boolean }) {
  const kind = node?.kind ?? 'present';
  if (kind === 'destination' || kind === 'explore') return <Ecosystem dest={node!.wp} compact />;
  if (kind === 'junction') return <JunctionInspector />;
  if (kind === 'route') return <StationInspector node={node!} walking={walking} hideTitle={hideTitle} />;
  if (kind === 'past') return <PastInspector node={node!} hideTitle={hideTitle} />;
  return <PresentInspector hideTitle={hideTitle} />;
}

function PresentInspector({ hideTitle }: { hideTitle?: boolean }) {
  const d = decisions['d-maya-phd'];
  const peers = peopleAt('msc-chem').filter((p) => p.id !== ME);
  return (
    <div className="insp">
      {!hideTitle && (
        <header className="insp__head">
          <p className="insp__kicker t-footnote">You are here</p>
          <h2 className="t-title2">MSc Chemistry</h2>
          <p className="t-subhead c-2">University of Toronto · defending in December</p>
        </header>
      )}
      <section className="insp__section">
        <h3 className="insp__h">The decision in front of you</h3>
        <DecisionItem d={d} />
      </section>
      <section className="insp__section">
        <h3 className="insp__h">Here with you now</h3>
        {peers.map((p) => (
          <PersonRow key={p.id} id={p.id} compact />
        ))}
      </section>
      <section className="insp__section">
        <h3 className="insp__h">Your community for this step</h3>
        <CommunityRow c={communities['msc-industry']} />
      </section>
    </div>
  );
}

function JunctionInspector() {
  const routes = destinations[main.destination].routes;
  return (
    <div className="insp">
      <header className="insp__head">
        <p className="insp__kicker t-footnote">Your next step</p>
        <h2 className="t-title2">Still open — and that’s fine</h2>
        <p className="t-subhead c-2">Here’s how people with a BSc, bench research and an MSc in chemistry moved on. Tap a route on your Path to focus it.</p>
      </header>
      <section className="insp__section">
        <h3 className="insp__h">Routes into {wp(main.destination).label}</h3>
        {routes.map((r) => (
          <RouteItem key={r.id} route={r} dest={main.destination} to={`/discover?to=${main.destination}&route=${r.id}`} />
        ))}
      </section>
    </div>
  );
}

function StationInspector({ node, walking, hideTitle }: { node: MapNode; walking: boolean; hideTitle?: boolean }) {
  const at = peopleAt(node.wp).filter((p) => p.id !== ME);
  const through = peopleThrough(node.wp).filter((p) => p.id !== ME);
  const guides = guidesInto(node.wp).filter((p) => p.id !== ME);
  const q = questionList.find((x) => x.about[0] === node.wp || x.about[1] === node.wp);
  const s = storyList.find((x) => x.segment[0] === node.wp || x.segment[1] === node.wp);
  const bestGuide = guides[0] ?? through[0];
  return (
    <div className="insp">
      {!hideTitle && (
        <header className="insp__head">
          <p className="insp__kicker t-footnote">{walking ? 'Walking ahead' : node.route?.label}</p>
          <h2 className="t-title2">{node.title}</h2>
          <p className="t-subhead c-2">
            {node.route ? `${node.route.people} people from backgrounds like yours took this route · ${Math.round(node.route.share * 100)}%` : node.sub}
          </p>
        </header>
      )}
      {bestGuide && (
        <div className="insp__cta">
          <RequestButton id={bestGuide.id} segment={['msc-chem', node.wp]} size="medium" label={`Ask ${bestGuide.first} about this step`} />
        </div>
      )}
      {at.length > 0 && (
        <section className="insp__section">
          <h3 className="insp__h">Here now · a step ahead of you</h3>
          {at.map((p) => (
            <PersonRow key={p.id} id={p.id} compact />
          ))}
        </section>
      )}
      {(guides.length > 0 || through.length > 0) && (
        <section className="insp__section">
          <h3 className="insp__h">Came through here</h3>
          {[...new Set([...guides, ...through])].slice(0, 4).map((p) => (
            <PersonRow key={p.id} id={p.id} action="request" compact />
          ))}
        </section>
      )}
      {q && (
        <section className="insp__section">
          <h3 className="insp__h">Asked about this step</h3>
          <QuestionItem q={q} />
        </section>
      )}
      {s && (
        <section className="insp__section">
          <h3 className="insp__h">A story from here</h3>
          <StoryItem story={s} />
        </section>
      )}
    </div>
  );
}

function PastInspector({ node, hideTitle }: { node: MapNode; hideTitle?: boolean }) {
  const ppl = stationPeople(ME, node);
  const behind = peopleAt(node.wp).filter((p) => relationTo(p.id).kind === 'behind' || relationTo(p.id).kind === 'explorer');
  return (
    <div className="insp">
      {!hideTitle && (
        <header className="insp__head">
          <p className="insp__kicker t-footnote">Where you’ve been</p>
          <h2 className="t-title2">{node.title}</h2>
          <p className="t-subhead c-2">{node.sub}</p>
        </header>
      )}
      {node.note && <p className="insp__note t-serif">“{node.note}”</p>}
      {ppl && (
        <section className="insp__section">
          <h3 className="insp__h">On this step with you</h3>
          {ppl.ids.slice(0, 4).map((id) => (
            <PersonRow key={id} id={id} compact />
          ))}
        </section>
      )}
      {behind.length > 0 && (
        <section className="insp__section">
          <h3 className="insp__h">Here now — you could help</h3>
          {behind.map((p) => (
            <PersonRow key={p.id} id={p.id} compact />
          ))}
        </section>
      )}
    </div>
  );
}
