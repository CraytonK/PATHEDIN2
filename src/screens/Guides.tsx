import { motion, useScroll, useSpring } from 'framer-motion';
import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Page } from '../components/chrome';
import { RailFooter, RailPosts, RailSection } from '../components/Rail';
import { PathHint } from '../components/path/PathHint';
import { RequestButton } from '../components/content';
import { openSpots, useOpenSpots } from '../lib/booking';
import { useApp } from '../lib/store';
import { Avatar, PersonName, Segmented } from '../components/ui';
import { IconStar } from '../components/icons';
import { RouteSilk } from '../components/path/RouteSilk';
import { communities } from '../data/communities';
import type { ServiceKind } from '../data/types';
import { communityGuides, economyOf, priceLabel, serviceKinds, servicesOf, topStanding } from '../lib/guides';
import { useUI } from '../lib/ui';
import { peopleList, people, ME } from '../data/people';
import { wp } from '../data/waypoints';
import { compactSteps, relationTo } from '../lib/relations';
import { rise, useIsMobile } from '../lib/motion';
import { usePeek } from '../components/Peek';
import './guides.css';

const transitions: { from: string; to: string; title: string; dest: 'pharma-rnd' | 'reg-affairs' | 'all'; note: string }[] = [
  { from: 'msc-chem', to: 'cro-analytical', title: 'Into a CRO after your MSc', dest: 'pharma-rnd', note: 'The first half of the most common route to your destination.' },
  { from: 'cro-analytical', to: 'pharma-rnd', title: 'From a CRO into pharma R&D', dest: 'pharma-rnd', note: 'The crossing most people ask about.' },
  { from: 'msc-chem', to: 'process-chem', title: 'Straight into process chemistry', dest: 'pharma-rnd', note: 'Skipping the PhD, going straight to industry.' },
  { from: 'msc-chem', to: 'phd-chem', title: 'Choosing the PhD', dest: 'pharma-rnd', note: 'The long route, from people who’d tell you not to.' },
  { from: 'industry-intern', to: 'pharma-rnd', title: 'Turning an internship into a role', dest: 'pharma-rnd', note: 'A route you haven’t added yet.' },
  { from: 'qc-chemist', to: 'pharma-rnd', title: 'From QC into R&D', dest: 'pharma-rnd', note: 'The route without a graduate degree.' },
  { from: 'qc-chemist', to: 'reg-affairs', title: 'From the bench into Regulatory Affairs', dest: 'reg-affairs', note: 'The branch you’re exploring.' },
  { from: 'pharma-rnd', to: 'rnd-lead', title: 'The long view', dest: 'pharma-rnd', note: 'What happens after you arrive.' },
];

function GuideCard({ id, from, to, i = 0, kind }: { id: string; from: string; to: string; i?: number; kind: ServiceKind | 'all' }) {
  const g = people[id];
  const rel = relationTo(id);
  const handlers = usePeek(id);
  const step = compactSteps(g.path).find((s) => s.wp === to);
  const spots = useOpenSpots(id);
  const openBooking = useUI((s) => s.openBooking);
  const econ = economyOf(id);
  const top = topStanding(id);
  const services = servicesOf(id);
  const shown = kind === 'all' ? services.slice(0, 4) : services.filter((s) => s.kind === kind || s.kind === 'office-hours');
  return (
    <motion.article className="gcard" {...rise(i)}>
      <Link to={`/p/${id}`} className="gcard__photo" data-portrait={id} {...handlers}>
        <img src={g.photo} alt="" loading="lazy" />
      </Link>
      <div className="gcard__body">
        <div className="gcard__top">
          <div>
            <PersonName id={id} className="t-headline" />
            <p className="t-subhead c-2">{g.headline}</p>
          </div>
          <RequestButton id={id} segment={[from, to]} label="Ask" variant="gray" />
        </div>
        <p className="gcard__rep">
          {econ && (
            <span className="gcard__stars">
              <IconStar size={13} filled /> <strong>{econ.rating.toFixed(1)}</strong> ({econ.reviewCount})
            </span>
          )}
          {top && <span className="gcard__top-badge">{top}</span>}
        </p>
        <p className="gcard__made t-footnote">
          Made this move {step?.start ? `in ${step.start}` : ''}
          {rel.kind !== 'other' && rel.kind !== 'guide' ? ` · ${rel.label}` : ''}
          {g.guide ? ` · Helped ${g.guide.helped}` : ''}
        </p>
        <PathHint id={id} segment={[from, to]} className="gcard__path" />
        <ul className="gcard__svcs">
          {shown.map((sv) => {
            const Icon = serviceKinds[sv.kind].icon;
            return (
              <li key={sv.id}>
                <button type="button" className={`gcard__svc ${sv.price === 0 ? 'is-free' : ''}`} onClick={() => openBooking(id, { service: sv.id })}>
                  <Icon size={14} strokeWidth={1.9} />
                  <span>{sv.kind === 'office-hours' ? `Office Hours · ${spots.open ? `${spots.open} open` : 'full'}` : sv.title}</span>
                  <strong>{priceLabel(sv)}</strong>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </motion.article>
  );
}

/** The Guides who've earned the most standing in each of your communities. */
function Leaderboard() {
  const joined = useApp((s) => s.joined);
  const list = Object.keys(joined).filter((k) => joined[k] && communities[k]);
  return (
    <div className="lboard">
      {list.slice(0, 3).map((c) => (
        <div key={c} className="lboard__group">
          <Link to={`/c/${c}`} className="lboard__community">
            {communities[c].title}
          </Link>
          <ol className="lboard__list">
            {communityGuides(c)
              .slice(0, 3)
              .map((x) => {
                const e = economyOf(x.id)!;
                return (
                  <li key={x.id}>
                    <span className={`lboard__rank ${x.rank === 1 ? 'is-top' : ''}`}>{x.rank}</span>
                    <Avatar id={x.id} size={28} />
                    <span className="lboard__who">
                      <PersonName id={x.id} className="lboard__name" />
                      <span>
                        <IconStar size={11} filled /> {e.rating.toFixed(1)} · {people[x.id].guide?.helped} helped
                      </span>
                    </span>
                  </li>
                );
              })}
          </ol>
        </div>
      ))}
    </div>
  );
}

/** An invitation to guide: the product asking you to give back what you've learned. */
function BecomeGuide() {
  const mine = useApp((s) => s.myGuide);
  return (
    <section className="become immersive">
      <RouteSilk lines={12} />
      <h2 className="become__h">{mine?.live ? 'You’re a Path Guide' : 'You’ve made moves others are weighing'}</h2>
      <p className="become__p">{mine?.live ? 'Your Guide profile is live. Keep it current as your Path grows.' : 'Lucas already asked you about BSc Chem → Research. Guide the moves you’ve made, for free or for a fee.'}</p>
      <Link to="/guide/setup" className="become__cta">
        {mine?.live ? 'Edit your Guide profile' : 'Become a Path Guide'}
      </Link>
    </section>
  );
}

/**
 * The moves hang off one route. As you read down the page the route fills in solid behind you, from where you
 * are toward where you're heading, the way a Path is walked.
 */
function RouteWalk({ count, children }: { count: number; children: React.ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [span, setSpan] = useState<{ top: number; height: number } | null>(null);
  const { scrollYProgress } = useScroll({ target: wrap, offset: ['start 65%', 'end 55%'] });
  const walked = useSpring(scrollYProgress, { stiffness: 140, damping: 28 });
  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const measure = () => {
      const stops = el.querySelectorAll<HTMLElement>('.guides__stop');
      if (stops.length < 2) return setSpan(null);
      const first = stops[0].getBoundingClientRect();
      const last = stops[stops.length - 1].getBoundingClientRect();
      const box = el.getBoundingClientRect();
      setSpan({ top: first.top - box.top + first.height / 2, height: last.top - first.top });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [count]);
  return (
    <div className="guides__route" ref={wrap}>
      {span && <motion.span className="guides__walked" aria-hidden="true" style={{ top: span.top, height: span.height, scaleY: walked }} />}
      {children}
    </div>
  );
}

const kinds: (ServiceKind | 'all')[] = ['all', 'office-hours', 'call', 'mentorship', 'resume', 'interview', 'portfolio', 'group', 'workshop'];

export function Guides() {
  const [dest, setDest] = useState<'pharma-rnd' | 'reg-affairs'>('pharma-rnd');
  const [kind, setKind] = useState<ServiceKind | 'all'>('all');
  const bookings = useApp((s) => s.bookings);
  const isMobile = useIsMobile();
  const sections = transitions
    .filter((t) => t.dest === dest || t.dest === 'all')
    .map((t) => ({
      ...t,
      guides: peopleList.filter((p) => p.id !== ME && p.guide && (p.guide.transitions.some(([a, b]) => a === t.from && b === t.to) || (compactSteps(p.path).some((s, i, arr) => i > 0 && arr[i - 1].wp === t.from && s.wp === t.to) && p.guide))),
    }))
    .map((t) => ({ ...t, guides: t.guides.filter((g) => kind === 'all' || servicesOf(g.id).some((sv) => sv.kind === kind)) }))
    .filter((t) => t.guides.length);

  return (
    <Page
      title="Path Guides"
      subtitle="People who’ve already made the moves you’re weighing — and said they’d help."
      back="Network"
      rail={
        <>
          <BecomeGuide />
          <RailSection title="Free Office Hours this week">
            <RailPosts
              items={['amara', 'tomas', 'priya', 'rafael'].map((g) => ({
                author: g,
                title: people[g].guide!.officeHours.when,
                to: `/p/${g}`,
                meta: `${openSpots(g, bookings).open} of ${people[g].guide!.officeHours.total} spots open · ${people[g].guide!.replies}`,
              }))}
            />
          </RailSection>
          <RailSection title="Top Guides in your communities">
            <Leaderboard />
          </RailSection>
          <RailFooter />
        </>
      }
    >
      <div className="guides__picker">
        <span className="t-subhead c-2">{isMobile ? 'Heading to' : 'Guides for the moves between you and'}</span>
        <Segmented
          value={dest}
          onChange={setDest}
          ariaLabel="Destination"
          options={[
            { value: 'pharma-rnd', label: 'Pharma R&D' },
            { value: 'reg-affairs', label: 'Regulatory Affairs' },
          ]}
        />
        <Link to="/discover" className="t-subhead c-tint">
          Somewhere else?
        </Link>
      </div>

      <div className="guides__kinds" role="tablist" aria-label="Type of help">
        {kinds.map((k) => {
          const on = k === kind;
          const Icon = k === 'all' ? null : serviceKinds[k].icon;
          return (
            <button key={k} type="button" role="tab" aria-selected={on} className={`kind-filter__pill ${on ? 'is-on' : ''}`} onClick={() => setKind(k)}>
              {Icon && <Icon size={15} strokeWidth={1.9} />}
              {k === 'all' ? 'Any kind of help' : k === 'office-hours' ? 'Free Office Hours' : serviceKinds[k].plural}
            </button>
          );
        })}
      </div>

      <RouteWalk count={sections.length}>
        {sections.map((s, i) => (
          <section key={`${s.from}-${s.to}`} className="guides__section">
            <header className="guides__head">
              <span className={`guides__stop ${i === 0 ? 'is-now' : ''}`}>
                <span className="visually-hidden">
                  Move {i + 1} of {sections.length}
                </span>
              </span>
              <div>
                <h2 className="guides__title">{s.title}</h2>
                <p className="guides__move t-subhead">
                  <span>{wp(s.from).label}</span>
                  <svg width="36" height="12" viewBox="0 0 36 12" aria-hidden="true">
                    <path d="M9 6h17" stroke="var(--tint)" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 4" />
                    <circle cx="5" cy="6" r="3.5" fill="var(--ink)" />
                    <circle cx="30.5" cy="6" r="3.5" fill="none" stroke="var(--tint)" strokeWidth="2" />
                  </svg>
                  <strong>{wp(s.to).label}</strong>
                </p>
                <p className="t-footnote c-2">{s.note}</p>
              </div>
            </header>
            <div className="guides__cards">
              {s.guides.map((g, gi) => (
                <GuideCard key={g.id} id={g.id} from={s.from} to={s.to} i={gi} kind={kind} />
              ))}
            </div>
          </section>
        ))}
      </RouteWalk>
    </Page>
  );
}
