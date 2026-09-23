import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Page } from '../components/chrome';
import { PathStrip } from '../components/path/PathStrip';
import { RequestButton } from '../components/content';
import { PersonName, RelationTag, Segmented } from '../components/ui';
import { IconCalendar } from '../components/icons';
import { peopleList, people, ME } from '../data/people';
import { wp } from '../data/waypoints';
import { compactSteps, relationTo } from '../lib/relations';
import { springs, useIsMobile } from '../lib/motion';
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

function GuideCard({ id, from, to }: { id: string; from: string; to: string }) {
  const g = people[id];
  const rel = relationTo(id);
  const handlers = usePeek(id);
  const step = compactSteps(g.path).find((s) => s.wp === to);
  return (
    <motion.article className="gcard" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={springs.smooth}>
      <Link to={`/p/${id}`} className="gcard__photo" {...handlers}>
        <img src={g.photo} alt="" loading="lazy" />
      </Link>
      <div className="gcard__body">
        <div className="gcard__top">
          <div>
            <PersonName id={id} className="t-headline" />
            <p className="t-subhead c-2">{g.headline}</p>
          </div>
          <RequestButton id={id} segment={[from, to]} label="Ask" />
        </div>
        <p className="gcard__made t-footnote">
          Made this move {step?.start ? `in ${step.start}` : ''}
          {rel.kind !== 'other' && rel.kind !== 'guide' ? ` · ${rel.label}` : ''}
        </p>
        <PathStrip id={id} highlight={[from, to]} />
        {g.guide && (
          <>
            <p className="gcard__helps t-subhead">{g.guide.helpsWith.slice(0, 2).join(' · ')}</p>
            <p className="gcard__hours t-footnote c-2">
              <IconCalendar size={14} /> {g.guide.officeHours.when} · <span className="gcard__open">{g.guide.officeHours.open} of {g.guide.officeHours.total} open</span> · helped {g.guide.helped}
            </p>
          </>
        )}
      </div>
    </motion.article>
  );
}

export function Guides() {
  const [dest, setDest] = useState<'pharma-rnd' | 'reg-affairs'>('pharma-rnd');
  const isMobile = useIsMobile();
  const sections = transitions
    .filter((t) => t.dest === dest || t.dest === 'all')
    .map((t) => ({
      ...t,
      guides: peopleList.filter((p) => p.id !== ME && p.guide && (p.guide.transitions.some(([a, b]) => a === t.from && b === t.to) || (compactSteps(p.path).some((s, i, arr) => i > 0 && arr[i - 1].wp === t.from && s.wp === t.to) && p.guide))),
    }))
    .filter((t) => t.guides.length);

  return (
    <Page title="Path Guides" subtitle="People who’ve already made the moves you’re weighing — and said they’d help." back="Network" wide>
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

      {sections.map((s, i) => (
        <section key={`${s.from}-${s.to}`} className="guides__section">
          <header className="guides__head">
            <span className="guides__num num-tag">{String(i + 1).padStart(2, '0')}</span>
            <div>
              <h2 className="t-title2">{s.title}</h2>
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
            {s.guides.map((g) => (
              <GuideCard key={g.id} id={g.id} from={s.from} to={s.to} />
            ))}
          </div>
        </section>
      ))}
      <RelationTag kind="guide" label="Guides are never paid, ranked or rated. They’re people who were once where you are." className="guides__foot" />
    </Page>
  );
}
