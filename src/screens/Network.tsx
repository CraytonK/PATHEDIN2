import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Page, useUnread } from '../components/chrome';
import { PathLens } from '../components/path/PathLens';
import { PersonRow } from '../components/content';
import { Button, RelationGlyph, TextTabs } from '../components/ui';
import { IconPeople, IconSend } from '../components/icons';
import { peopleByRelation, relationCopy, type RelationKind } from '../lib/relations';
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
    <Page title="Network" eyebrow="Who should you know?"
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
              <div className="network__list">
                {g.people.map((p) => (
                  <PersonRow key={p.id} id={p.id} action={g.kind === 'guide' ? 'request' : 'connect'} />
                ))}
              </div>
            </section>
          ))}
        </motion.div>
      </AnimatePresence>
    </Page>
  );
}
