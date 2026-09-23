import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { people } from '../data/people';
import { communities } from '../data/communities';
import { relationTo } from '../lib/relations';
import { useApp } from '../lib/store';
import { ConnectButton, RequestButton } from './content';
import { Avatar, PersonName } from './ui';
import './rail.css';

/* The pieces of Medium's right-hand column, shared by every page that has one. */

export function RailSection({ title, more, card, children }: { title: ReactNode; more?: { to: string; label: string }; card?: boolean; children: ReactNode }) {
  return (
    <section className={card ? 'rail-card' : undefined}>
      <div className="rail-head">
        <h2 className="rail-h">{title}</h2>
      </div>
      {children}
      {more && (
        <Link to={more.to} className="rail-more rail-more--below">
          {more.label}
        </Link>
      )}
    </section>
  );
}

/** Medium's "Who to follow", with PathedIn's reason for each person. */
export function RailPeople({ ids, action = 'connect' }: { ids: string[]; action?: 'connect' | 'request' }) {
  return (
    <ul className="rail-people">
      {ids.map((id) => {
        const rel = relationTo(id);
        return (
          <li key={id} className="rail-people__row">
            <Avatar id={id} size={32} />
            <div className="rail-people__text">
              <PersonName id={id} className="rail-people__name" />
              <p className="rail-people__why clamp-2">
                {rel.kind !== 'self' && rel.kind !== 'other' && <span className="rail-people__rel">{rel.label}. </span>}
                {rel.kind === 'other' ? people[id].headline : rel.why}
              </p>
            </div>
            {action === 'request' ? <RequestButton id={id} variant="tinted" label="Ask" /> : <ConnectButton id={id} />}
          </li>
        );
      })}
    </ul>
  );
}

/** Medium's "Staff Picks": a byline, a bold title, a quiet date. */
export function RailPosts({ items }: { items: { author: string; where?: string; title: string; to: string; meta?: string }[] }) {
  return (
    <ul className="rail-posts">
      {items.map((it) => (
        <li key={it.to}>
          <p className="rail-posts__by">
            <Avatar id={it.author} size={20} />
            <span>
              {it.where && (
                <>
                  In <span className="rail-posts__strong">{it.where}</span> by{' '}
                </>
              )}
              <span className="rail-posts__strong">{people[it.author].name}</span>
            </span>
          </p>
          <Link to={it.to} className="rail-posts__title">
            {it.title}
          </Link>
          {it.meta && <p className="rail-posts__meta">{it.meta}</p>}
        </li>
      ))}
    </ul>
  );
}

/** Topic pills, as on Medium's "Recommended topics". */
export function RailPills({ items }: { items: { to: string; label: string }[] }) {
  return (
    <div className="rail-pills">
      {items.map((it) => (
        <Link key={it.to} to={it.to} className="rail-pill">
          {it.label}
        </Link>
      ))}
    </div>
  );
}

export function RailFooter() {
  return (
    <footer className="rail-foot">
      {['Help', 'About', 'Path Guides', 'Communities', 'Privacy', 'Terms'].map((l) => (
        <span key={l}>{l}</span>
      ))}
    </footer>
  );
}

/** The communities you've joined, as pills. */
export function RailCommunities() {
  const joined = useApp((s) => s.joined);
  const list = Object.keys(joined).filter((k) => joined[k] && communities[k]);
  return <RailPills items={list.map((k) => ({ to: `/c/${k}`, label: communities[k].title }))} />;
}

/** A sensible right-hand column for list pages: people worth knowing, your communities, the footer. */
export function DefaultRail({ people: ids = ['sarah', 'amara', 'daniel'] }: { people?: string[] }) {
  return (
    <>
      <RailSection title="People worth knowing" more={{ to: '/network', label: 'See more suggestions' }}>
        <RailPeople ids={ids} />
      </RailSection>
      <RailSection title="Your communities" more={{ to: '/communities', label: 'See more communities' }}>
        <RailCommunities />
      </RailSection>
      <RailFooter />
    </>
  );
}
