import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Page, useUnread } from '../components/chrome';
import { PathLens } from '../components/path/PathLens';
import { PersonRow } from '../components/content';
import { BookButton } from '../components/Booking';
import { people, ME } from '../data/people';
import { wp } from '../data/waypoints';
import { economyOf, fromPrice, priceLabel } from '../lib/guides';
import { useApp } from '../lib/store';
import { useUI } from '../lib/ui';
import { Button, RelationGlyph, TextTabs } from '../components/ui';
import { IconAlign, IconPeople, IconSend, IconStar } from '../components/icons';
import { compactSteps, current, pathMatch, peopleByRelation, relationCopy, relationTo, type RelationKind } from '../lib/relations';
import { edgeClass, springs, useIsMobile, useScrollEdges } from '../lib/motion';
import './network.css';

type Kind = Exclude<RelationKind, 'self' | 'other'>;
const order: Kind[] = ['twin', 'peer', 'ahead', 'guide', 'explorer', 'behind'];

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/*
  Every group uses the same person card. What differs is one line under the headline, in the same place on
  every card (a match, a step, a rating, a request), and the action that fits the relation.
*/

function Signal({ children }: { children: ReactNode }) {
  return <span className="nw-signal">{children}</span>;
}

function AlignButton({ id }: { id: string }) {
  const openCompare = useUI((s) => s.openCompare);
  return (
    <Button variant="tinted" size="small" icon={<IconAlign size={16} />} onClick={() => openCompare(id)}>
      Align Paths
    </Button>
  );
}

function BehindAction({ id }: { id: string }) {
  const requests = useApp((s) => s.requests);
  const myGuide = useApp((s) => s.myGuide);
  const asked = requests.find((r) => r.from === id && r.to === ME && r.status === 'pending');
  if (asked)
    return (
      <Link to="/requests">
        <Button variant="filled" size="small">
          Reply
        </Button>
      </Link>
    );
  return (
    <Link to={myGuide?.live ? `/p/${ME}` : '/guide/setup'}>
      <Button variant="gray" size="small">
        {myGuide?.live ? 'You guide this move' : 'Guide this move'}
      </Button>
    </Link>
  );
}

function BehindSignal({ id }: { id: string }) {
  const requests = useApp((s) => s.requests);
  const asked = requests.find((r) => r.from === id && r.to === ME && r.status === 'pending');
  const now = current(people[id]);
  const mine = compactSteps(people[ME].path).find((s) => s.wp === now.wp);
  return (
    <Signal>
      {asked ? `Asked you about ${wp(asked.segment[0]).short} → ${wp(asked.segment[1]).short}` : `At ${wp(now.wp).short}${mine ? `, where you were in ${mine.start}` : ''}`}
    </Signal>
  );
}

function signalFor(kind: Kind, id: string): ReactNode {
  const p = people[id];
  const now = current(p);
  switch (kind) {
    case 'twin':
      return <Signal>{pathMatch(id)}% Path match · the same {relationTo(id).shared.length} steps as you</Signal>;
    case 'peer':
      return <Signal>At {wp(now.wp).short} with you since {now.start}</Signal>;
    case 'ahead': {
      if (p.hiring) return <Signal>{p.hiring}</Signal>;
      const theirs = compactSteps(p.path);
      const at = theirs.findIndex((st) => st.wp === current(people[ME]).wp);
      const next = at >= 0 ? theirs[at + 1] : undefined;
      return <Signal>{next ? `Went ${wp(theirs[at].wp).short} → ${wp(next.wp).short}, now ${wp(now.wp).short}` : `Reached ${wp(now.wp).short}`}</Signal>;
    }
    case 'guide': {
      const e = economyOf(id);
      const from = fromPrice(id);
      return (
        <Signal>
          {e && (
            <>
              <IconStar size={12} filled /> {e.rating.toFixed(1)} · {e.reviewCount} reviews ·{' '}
            </>
          )}
          Free Office Hours{from ? `, paid from ${priceLabel(from)}` : ''}
        </Signal>
      );
    }
    case 'explorer':
      return <Signal>Exploring {p.futures.map((f) => wp(f.destination).short).join(' and ')} from {wp(now.wp).short}</Signal>;
    case 'behind':
      return <BehindSignal id={id} />;
  }
}

function actionFor(kind: Kind, id: string): ReactNode | undefined {
  if (kind === 'twin') return <AlignButton id={id} />;
  if (kind === 'guide') return <BookButton id={id} label="Book" />;
  if (kind === 'behind') return <BehindAction id={id} />;
  return undefined;
}

function Group({ kind, ids }: { kind: Kind; ids: string[] }) {
  return (
    <div className="nw-list">
      {ids.map((id, i) => (
        <PersonRow key={id} id={id} i={i} signal={signalFor(kind, id)} actionNode={actionFor(kind, id)} />
      ))}
    </div>
  );
}

export function Network() {
  const [params, setParams] = useSearchParams();
  const lens = (params.get('lens') as Kind | 'all' | null) ?? 'all';
  const isMobile = useIsMobile();
  const unread = useUnread();
  const [ref, width] = useWidth();
  const lensEdges = useScrollEdges(ref);

  const groups = order.map((k) => ({ kind: k, people: peopleByRelation(k) })).filter((g) => g.people.length);
  const shown = lens === 'all' ? groups : groups.filter((g) => g.kind === lens);

  const actions = (
    <div className="network__links">
      <Link to="/guides">
        <Button variant="tinted" size={isMobile ? 'small' : 'medium'} icon={<RelationGlyph kind="guide" size={16} />}>
          Path Guides
        </Button>
      </Link>
      <Link to="/requests">
        <Button variant="gray" size={isMobile ? 'small' : 'medium'} icon={<IconSend size={16} />}>
          Requests{unread.incoming ? ` · ${unread.incoming}` : ''}
        </Button>
      </Link>
      <Link to="/connections">
        <Button variant="gray" size={isMobile ? 'small' : 'medium'} icon={<IconPeople size={17} />}>
          Connections
        </Button>
      </Link>
    </div>
  );

  return (
    <Page
      title="Network"
      subtitle="Don’t just ask who you know. Ask who you should know to get where you want to go." wide trailing={!isMobile ? actions : undefined}>
      {isMobile && <div className="network__mobile-links">{actions}</div>}
      <section className="network__lens">
        <div className="network__lens-head">
          <h2 className="t-headline">Your network, on your Path</h2>
          <p className="t-footnote c-2">Press and hold anyone to preview their Path.</p>
        </div>
        <div className={`network__lens-scroll ${edgeClass(lensEdges)}`} ref={ref}>
          {width > 0 && <PathLens filter={lens} width={width} />}
        </div>
      </section>

      <div className="network__tabs">
        <TextTabs
          value={lens}
          onChange={(v) => setParams(v === 'all' ? {} : { lens: v }, { replace: true })}
          options={[
            { value: 'all', label: 'Everyone' },
            ...groups.map((g) => ({ value: g.kind, label: relationCopy[g.kind].plural, count: g.people.length })),
          ]}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={lens} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} transition={springs.smooth}>
          {shown.map((g) => (
            <section key={g.kind} className="network__group">
              <header className="network__group-head">
                <span className="network__glyph">
                  <RelationGlyph kind={g.kind} size={20} />
                </span>
                <div>
                  <h2 className="t-title3">{relationCopy[g.kind].plural}</h2>
                  <p className="t-subhead c-2">{relationCopy[g.kind].blurb}</p>
                </div>
              </header>
              <Group kind={g.kind} ids={g.people.map((p) => p.id)} />
            </section>
          ))}
        </motion.div>
      </AnimatePresence>
    </Page>
  );
}
