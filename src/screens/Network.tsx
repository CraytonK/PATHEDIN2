import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Page, useUnread } from '../components/chrome';
import { PathLens } from '../components/path/PathLens';
import { ConnectButton, PersonTile, RequestButton } from '../components/content';
import { BookButton } from '../components/Booking';
import { PathHint } from '../components/path/PathHint';
import { PathStrip } from '../components/path/PathStrip';
import { people, ME } from '../data/people';
import { wp } from '../data/waypoints';
import { economyOf, fromPrice, priceLabel, topStanding } from '../lib/guides';
import { useApp } from '../lib/store';
import { useUI } from '../lib/ui';
import { Avatar, Button, PersonName, RelationGlyph, RelationTag, TextTabs } from '../components/ui';
import { IconAlign, IconPeople, IconSend, IconStar } from '../components/icons';
import { compactSteps, current, pathMatch, peopleByRelation, relationCopy, relationTo, stepTitle, type RelationKind } from '../lib/relations';
import { edgeClass, rise, springs, useIsMobile, useScrollEdges } from '../lib/motion';
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

/* Each kind of relation has its own card, so the page reads as groups of people, not one long list. */

/** A Path Twin: your two Paths, one above the other, and how closely they match. */
function TwinCard({ id, i }: { id: string; i: number }) {
  const p = people[id];
  const rel = relationTo(id);
  const openCompare = useUI((s) => s.openCompare);
  return (
    <motion.article className="nw-twin" {...rise(i, 12)}>
      <Link to={`/p/${id}`} className="nw-twin__photo" data-portrait={id}>
        <img src={p.photo} alt="" loading="lazy" />
      </Link>
      <div className="nw-twin__body">
        <div className="nw-twin__top">
          <div>
            <PersonName id={id} className="nw-twin__name" />
            <p className="nw-twin__head">{p.headline}</p>
          </div>
          <span className="nw-twin__match">
            <strong>{pathMatch(id)}%</strong>
            <span>Path match</span>
          </span>
        </div>
        <div className="nw-twin__paths">
          <span className="nw-twin__who">You</span>
          <PathStrip id={ME} highlight="shared" wrap />
          <span className="nw-twin__who">{p.first}</span>
          <PathStrip id={id} highlight="shared" wrap />
        </div>
        <p className="nw-twin__why">{rel.why}</p>
        <div className="nw-twin__act">
          <Button variant="filled" size="small" icon={<IconAlign size={16} />} onClick={() => openCompare(id)}>
            Align Paths
          </Button>
          <ConnectButton id={id} />
        </div>
      </div>
    </motion.article>
  );
}

/** A Path Peer: someone at your step right now, as a tile. */
function PeerTile({ id, i }: { id: string; i: number }) {
  const p = people[id];
  const now = current(p);
  const dests = p.futures.map((f) => wp(f.destination).short);
  return (
    <motion.article className="nw-peer" {...rise(i, 12)}>
      <Link to={`/p/${id}`} className="nw-peer__photo" data-portrait={id}>
        <img src={p.photo} alt="" loading="lazy" />
      </Link>
      <PersonName id={id} className="nw-peer__name" />
      <p className="nw-peer__head">{p.headline}</p>
      <p className="nw-peer__at">
        <span className="nw-peer__dot" aria-hidden="true" />
        At {wp(now.wp).short} with you since {now.start}
      </p>
      {dests.length > 0 && <p className="nw-peer__weigh">Weighing {dests.join(' or ')}</p>}
      <ConnectButton id={id} />
    </motion.article>
  );
}

/** Someone ahead: how far ahead, and where they are now. */
function AheadCard({ id, i }: { id: string; i: number }) {
  const p = people[id];
  const rel = relationTo(id);
  const n = rel.stepsAhead ?? 1;
  return (
    <motion.article className="nw-ahead" {...rise(i, 12)}>
      <span className="nw-ahead__n" aria-hidden="true">
        <strong>{rel.reached || p.hiring ? '' : `+${n}`}</strong>
        <span>{rel.reached ? 'arrived' : p.hiring ? 'hires' : n === 1 ? 'step' : 'steps'}</span>
      </span>
      <Avatar id={id} size={48} />
      <div className="nw-ahead__body">
        <div className="nw-ahead__top">
          <PersonName id={id} className="nw-ahead__name" />
          <RelationTag kind={rel.kind} label={rel.label} />
        </div>
        <p className="nw-ahead__now">Now {stepTitle(current(p))}{current(p).org ? ` · ${current(p).org}` : ''}</p>
        <PathHint id={id} className="nw-ahead__path" />
      </div>
      <ConnectButton id={id} />
    </motion.article>
  );
}

/** A Guide: rating, standing, price, and a way to book. */
function GuideTile({ id, i }: { id: string; i: number }) {
  const p = people[id];
  const econ = economyOf(id);
  const from = fromPrice(id);
  const top = topStanding(id);
  return (
    <motion.article className="nw-guide" {...rise(i, 12)}>
      <div className="nw-guide__band immersive" aria-hidden="true">
        <span className="nw-guide__badge">Path Guide</span>
      </div>
      <Link to={`/p/${id}`} className="nw-guide__photo" data-portrait={id}>
        <img src={p.photo} alt="" loading="lazy" />
      </Link>
      <PersonName id={id} className="nw-guide__name" />
      <p className="nw-guide__head">{p.headline}</p>
      {econ && (
        <p className="nw-guide__rating">
          <IconStar size={13} filled /> <strong>{econ.rating.toFixed(1)}</strong> · {econ.reviewCount} reviews · helped {p.guide?.helped}
        </p>
      )}
      {top && <p className="nw-guide__top">{top}</p>}
      <p className="nw-guide__price">Free Office Hours{from ? ` · from ${priceLabel(from)}` : ''}</p>
      <div className="nw-guide__act">
        <BookButton id={id} label="Book" />
        <RequestButton id={id} variant="gray" label="Ask" />
      </div>
    </motion.article>
  );
}

/** Someone behind you: where they are, when you were there, and how you could help. */
function BehindRow({ id, i }: { id: string; i: number }) {
  const p = people[id];
  const now = current(p);
  const mine = compactSteps(people[ME].path).find((s) => s.wp === now.wp);
  const requests = useApp((s) => s.requests);
  const myGuide = useApp((s) => s.myGuide);
  const asked = requests.find((r) => r.from === id && r.to === ME && r.status === 'pending');
  return (
    <motion.article className="nw-behind" {...rise(i, 12)}>
      <Avatar id={id} size={44} />
      <div className="nw-behind__body">
        <PersonName id={id} className="nw-behind__name" />
        <p>
          At {wp(now.wp).short}
          {mine ? `, where you were in ${mine.start}` : ''}
        </p>
        {asked && <p className="nw-behind__asked">Asked you about {wp(asked.segment[0]).short} → {wp(asked.segment[1]).short}</p>}
      </div>
      {asked ? (
        <Link to="/requests" className="nw-behind__cta">
          Reply
        </Link>
      ) : (
        <Link to={myGuide?.live ? `/p/${ME}` : '/guide/setup'} className="nw-behind__cta nw-behind__cta--quiet">
          {myGuide?.live ? 'You guide this move' : 'Guide this move'}
        </Link>
      )}
    </motion.article>
  );
}

function Group({ kind, ids }: { kind: Kind; ids: string[] }) {
  if (kind === 'twin') return <div className="nw-list">{ids.map((id, i) => <TwinCard key={id} id={id} i={i} />)}</div>;
  if (kind === 'peer') return <div className="nw-grid">{ids.map((id, i) => <PeerTile key={id} id={id} i={i} />)}</div>;
  if (kind === 'ahead') return <div className="nw-list">{ids.map((id, i) => <AheadCard key={id} id={id} i={i} />)}</div>;
  if (kind === 'guide') return <div className="nw-grid nw-grid--3">{ids.map((id, i) => <GuideTile key={id} id={id} i={i} />)}</div>;
  if (kind === 'explorer')
    return (
      <div className="carousel nw-carousel">
        {ids.map((id) => (
          <PersonTile key={id} id={id} />
        ))}
      </div>
    );
  return <div className="nw-list">{ids.map((id, i) => <BehindRow key={id} id={id} i={i} />)}</div>;
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
