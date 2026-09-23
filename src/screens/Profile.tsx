import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Page } from '../components/chrome';
import { TransitMap } from '../components/path/TransitMap';
import { AlignMap, compareSummary } from '../components/path/Compare';
import { ConnectButton, CredibilityLabel, DecisionItem, RequestButton, StoryItem } from '../components/content';
import { RailFooter, RailPills, RailSection } from '../components/Rail';
import { Button, GroupedList, PathChips, RelationTag, SaveToggle, TextTabs } from '../components/ui';
import { IconAlign, IconBell, IconBookmark, IconCalendar, IconClock, IconMoon, IconPeople, IconPin, IconSend, IconSun, IconUser } from '../components/icons';
import { people, ME } from '../data/people';
import { wp } from '../data/waypoints';
import { storyList } from '../data/stories';
import { questionList } from '../data/questions';
import { decisionList } from '../data/decisions';
import { communities } from '../data/communities';
import { compactSteps, current, primaryDestination, relationTo, stepTitle } from '../lib/relations';
import { springs, useIsMobile } from '../lib/motion';
import { useApp } from '../lib/store';
import { useUI } from '../lib/ui';
import { NotFound } from './NotFound';
import './profile.css';

function YourSpace() {
  const requests = useApp((s) => s.requests);
  const connections = useApp((s) => s.connections);
  const saved = useApp((s) => s.saved);
  const theme = useApp((s) => s.theme);
  const setTheme = useApp((s) => s.setTheme);
  const signOut = useApp((s) => s.signOut);
  const incoming = requests.filter((r) => r.to === ME && r.status === 'pending').length;
  const next = { system: 'light', light: 'dark', dark: 'system' } as const;
  return (
    <section>
      <GroupedList
        rows={[
          { icon: <IconSend />, title: 'Path Requests', detail: incoming ? `${incoming} waiting for you` : undefined, value: incoming || undefined, to: '/requests' },
          { icon: <IconPeople />, title: 'Connections', value: Object.values(connections).filter((c) => c === 'connected').length, to: '/connections' },
          { icon: <IconBookmark />, title: 'Saved', value: Object.values(saved).filter(Boolean).length, to: '/saved' },
          { icon: <IconBell />, title: 'Notifications', to: '/notifications' },
          {
            icon: theme === 'dark' ? <IconMoon /> : <IconSun />,
            title: 'Appearance',
            value: theme === 'system' ? 'Automatic' : theme === 'dark' ? 'Dark' : 'Light',
            onClick: () => setTheme(next[theme]),
          },
          { icon: <IconUser />, title: 'Sign out', onClick: signOut },
        ]}
      />
    </section>
  );
}

export function Profile() {
  const { id = ME } = useParams();
  const p = people[id];
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const openCompare = useUI((s) => s.openCompare);
  const openRequest = useUI((s) => s.openRequest);
  const following = useApp((s) => !!s.following[id]);
  const toggleFollow = useApp((s) => s.toggleFollow);
  const [tab, setTab] = useState<'path' | 'stories' | 'answers' | 'decisions'>('path');
  if (!p) return <NotFound />;
  const self = id === ME;
  const rel = relationTo(id);
  const now = current(p);
  const dest = primaryDestination(p);
  const steps = compactSteps(p.path);
  const stories = storyList.filter((s) => s.author === id);
  const answers = questionList.flatMap((q) => q.answers.filter((a) => a.author === id).map((a) => ({ q, a })));
  const decisions = decisionList.filter((d) => d.owner === id);
  const summary = self ? null : compareSummary(id);

  const actions = self ? (
    <div className="profile__actions">
      <Button variant="filled" size="medium" onClick={() => navigate('/path')}>
        Open My Path
      </Button>
      <Button variant="outline" size="medium">
        Edit profile
      </Button>
    </div>
  ) : (
    <div className="profile__actions">
      <RequestButton id={id} size="medium" label="Send a Path Request" />
      <ConnectButton id={id} size="medium" />
      <Button variant={following ? 'gray' : 'outline'} size="medium" onClick={() => toggleFollow(id)}>
        {following ? 'Following' : 'Follow'}
      </Button>
      <button className="profile__icon-btn" aria-label={`Align Paths with ${p.first}`} title="Align Paths" onClick={() => openCompare(id)}>
        <IconAlign size={20} />
      </button>
      <SaveToggle saveKey={`person:${id}`} compact />
    </div>
  );

  /* Medium's profile column: photo, name, a short bio, the buttons. */
  const identity = (
    <motion.section className="profile__card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={springs.smooth}>
      <img className="profile__photo" src={p.photo} alt={p.name} />
      <p className="profile__card-name">{p.name}</p>
      {!self && rel.kind !== 'other' && <RelationTag kind={rel.kind} label={rel.label} className="profile__rel" />}
      <p className="profile__meta">
        {p.pronouns && <span>{p.pronouns}</span>}
        <span className="profile__loc">
          <IconPin size={13} /> {p.location}
        </span>
      </p>
      <p className="profile__bio">{p.bio}</p>
      {!self && <PathChips id={id} className="profile__chips" />}
      {actions}
    </motion.section>
  );

  const facts = (
    <dl className="profile__facts">
      <div>
        <dt>Now</dt>
        <dd>
          {stepTitle(now)}
          {now.org ? `, ${now.org}` : ''}
        </dd>
      </div>
      {dest && (
        <div>
          <dt>Heading</dt>
          <dd>{wp(dest).label}</dd>
        </div>
      )}
      {p.hiring && (
        <div>
          <dt>Hiring</dt>
          <dd>{p.hiring}</dd>
        </div>
      )}
    </dl>
  );

  const rest = (
    <>
      {facts}
      {self && <YourSpace />}
      {p.guide && (
        <RailSection title="Path Guide" card>
          <p className="profile__guide-move">
            Has made the move {p.guide.transitions.map(([a, b]) => `${wp(a).short} → ${wp(b).short}`).join(' and ')}.
          </p>
          <ul className="guide-card__helps">
            {p.guide.helpsWith.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
          <p className="profile__guide-line">
            <IconCalendar size={15} /> {p.guide.officeHours.when} · {p.guide.officeHours.open} of {p.guide.officeHours.total} spots open
          </p>
          <p className="profile__guide-line">
            <IconClock size={15} /> {p.guide.replies} · has helped {p.guide.helped} people
          </p>
          {!self && (
            <div className="profile__guide-cta">
              <RequestButton id={id} size="small" variant="ink" label="Book a spot" />
            </div>
          )}
        </RailSection>
      )}
      {!self && summary && (
        <RailSection title="Where your Paths meet">
          <div className="profile__meet-map">
            <AlignMap otherId={id} />
          </div>
          {summary.lines.slice(0, 2).map((l) => (
            <p key={l} className="profile__meet-line">
              {l}
            </p>
          ))}
          <button className="rail-more rail-more--below" onClick={() => openCompare(id)}>
            Align your Paths
          </button>
        </RailSection>
      )}
      <RailSection title="Communities">
        <RailPills items={p.communities.filter((c) => communities[c]).map((c) => ({ to: `/c/${c}`, label: communities[c].title }))} />
      </RailSection>
      <RailFooter />
    </>
  );

  const tabs = [
    { value: 'path' as const, label: 'Path' },
    ...(stories.length ? [{ value: 'stories' as const, label: 'Stories', count: stories.length }] : []),
    ...(answers.length ? [{ value: 'answers' as const, label: 'Answers', count: answers.length }] : []),
    ...(decisions.length ? [{ value: 'decisions' as const, label: 'Decisions', count: decisions.length }] : []),
  ];
  // Moving between profiles keeps the tab only if this person has something in it.
  const active = tabs.some((t) => t.value === tab) ? tab : 'path';

  return (
    <Page title={p.name} large={false} back rail={isMobile ? rest : <>{identity}{rest}</>}>
      {isMobile ? (
        identity
      ) : (
        <header className="profile__head">
          <h1 className="profile__name">{p.name}</h1>
          {!self && <p className="profile__why">{rel.why}</p>}
        </header>
      )}
      <div className="list-tabs profile__tabs">
        <TextTabs value={active} onChange={setTab} options={tabs} />
      </div>
      {active === 'path' && (
        <section className="profile__path">
          <TransitMap
            personId={id}
            shareWith={self ? undefined : ME}
            renderExtra={(n) =>
              !self && n.step && steps.indexOf(n.step) > 0 ? (
                <button
                  className="profile__ask t-footnote"
                  onClick={(e) => {
                    e.stopPropagation();
                    const i = steps.indexOf(n.step!);
                    openRequest(id, [steps[i - 1].wp, steps[i].wp]);
                  }}
                >
                  Ask {p.first} about this step
                </button>
              ) : null
            }
          />
        </section>
      )}
      {active === 'stories' && (
        <div className="post-list">
          {stories.map((s, i) => (
            <StoryItem key={s.id} story={s} i={i} />
          ))}
        </div>
      )}
      {active === 'decisions' && (
        <div className="post-list">
          {decisions.map((d, i) => (
            <DecisionItem key={d.id} d={d} i={i} />
          ))}
        </div>
      )}
      {active === 'answers' && (
        <div className="post-list">
          {answers.map(({ q, a }) => (
            <Link key={a.id} to={`/questions/${q.id}`} className="profile__answer">
              <p className="profile__answer-q">{q.title}</p>
              <p className="profile__answer-a">{a.body}</p>
              <CredibilityLabel kind={a.credibility} text={a.credibilityText} />
            </Link>
          ))}
        </div>
      )}
    </Page>
  );
}
