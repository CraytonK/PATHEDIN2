import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Page } from '../components/chrome';
import { TransitMap } from '../components/path/TransitMap';
import { AlignMap, compareSummary } from '../components/path/Compare';
import { CommunityRow, ConnectButton, CredibilityLabel, DecisionItem, RequestButton, StoryItem } from '../components/content';
import { Button, RelationTag, SaveToggle } from '../components/ui';
import { IconAlign, IconCalendar, IconClock, IconPin } from '../components/icons';
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

export function Profile() {
  const { id = ME } = useParams();
  const p = people[id];
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const openCompare = useUI((s) => s.openCompare);
  const openRequest = useUI((s) => s.openRequest);
  const following = useApp((s) => !!s.following[id]);
  const toggleFollow = useApp((s) => s.toggleFollow);
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
      <Button variant="gray" size="medium">
        Edit profile
      </Button>
    </div>
  ) : (
    <div className="profile__actions">
      <RequestButton id={id} size="medium" label="Send a Path Request" />
      <ConnectButton id={id} size="medium" />
      <Button variant="tinted" size="medium" icon={<IconAlign size={18} />} onClick={() => openCompare(id)}>
        Align Paths
      </Button>
      <Button variant={following ? 'gray' : 'outline'} size="medium" onClick={() => toggleFollow(id)}>
        {following ? 'Following' : 'Follow'}
      </Button>
      <SaveToggle saveKey={`person:${id}`} compact />
    </div>
  );

  return (
    <Page title={p.name} large={false} back wide>
      <motion.header className="profile__head" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={springs.smooth}>
        <div className="profile__photo">
          <img src={p.photo} alt={p.name} />
        </div>
        <div className="profile__id">
          {!self && rel.kind !== 'other' && <RelationTag kind={rel.kind} label={rel.label} className="profile__rel" />}
          <h1 className="profile__name">{p.name}</h1>
          <p className="profile__meta t-subhead c-2">
            {p.pronouns && <span>{p.pronouns}</span>}
            <span className="profile__loc">
              <IconPin size={14} /> {p.location}
            </span>
          </p>
          <p className="profile__bio t-serif">{p.bio}</p>
          <dl className="profile__facts">
            <div>
              <dt className="t-caption1">Now</dt>
              <dd className="t-subhead">
                {stepTitle(now)}
                {now.org ? `, ${now.org}` : ''}
              </dd>
            </div>
            {dest && (
              <div>
                <dt className="t-caption1">Heading</dt>
                <dd className="t-subhead">{wp(dest).label}</dd>
              </div>
            )}
            {p.hiring && (
              <div>
                <dt className="t-caption1">Hiring</dt>
                <dd className="t-subhead">{p.hiring}</dd>
              </div>
            )}
          </dl>
          {!self && <p className="profile__why t-callout">{rel.why}</p>}
          {actions}
        </div>
      </motion.header>

      {p.guide && (
        <section className="guide-card">
          <div className="guide-card__main">
            <p className="guide-card__kicker t-footnote">Path Guide</p>
            <h2 className="t-title3">
              Has made the move {p.guide.transitions.map(([a, b]) => `${wp(a).short} → ${wp(b).short}`).join(' and ')}
            </h2>
            <ul className="guide-card__helps t-subhead">
              {p.guide.helpsWith.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>
          <div className="guide-card__side t-footnote">
            <p>
              <IconCalendar size={16} /> <span><strong>Path Office Hours</strong> · {p.guide.officeHours.when}<br />{p.guide.officeHours.open} of {p.guide.officeHours.total} spots open this month</span>
            </p>
            <p>
              <IconClock size={16} /> <span>{p.guide.replies} · has helped {p.guide.helped} people</span>
            </p>
            {!self && <RequestButton id={id} size="medium" variant="ink" label="Book a spot" />}
          </div>
        </section>
      )}

      <div className="profile__grid">
        <section className="profile__path">
          <h2 className="profile__h">{self ? 'Your Path' : `${p.first}’s Path`}</h2>
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

        <aside className="profile__side">
          {!self && summary && (
            <section className="profile__meet">
              <div className="profile__meet-head">
                <h2 className="profile__h">Where your Paths meet</h2>
                <button className="t-subhead c-tint" onClick={() => openCompare(id)}>
                  Align
                </button>
              </div>
              <div className="profile__meet-map">
                <AlignMap otherId={id} />
              </div>
              {summary.lines.slice(0, 2).map((l) => (
                <p key={l} className="t-subhead profile__meet-line">
                  {l}
                </p>
              ))}
            </section>
          )}

          {decisions.length > 0 && (
            <section>
              <h2 className="profile__h">Decisions {self ? 'you’re' : `${p.first}’s`} {decisions.some((d) => d.status === 'open') ? 'facing' : 'made'}</h2>
              <div className="profile__stack">
                {decisions.map((d) => (
                  <DecisionItem key={d.id} d={d} />
                ))}
              </div>
            </section>
          )}

          {stories.length > 0 && (
            <section>
              <h2 className="profile__h">Stories</h2>
              <div className="profile__stack">
                {stories.map((s) => (
                  <StoryItem key={s.id} story={s} />
                ))}
              </div>
            </section>
          )}

          {answers.length > 0 && (
            <section>
              <h2 className="profile__h">Answers</h2>
              {answers.map(({ q, a }) => (
                <Link key={a.id} to={`/questions/${q.id}`} className="profile__answer">
                  <p className="t-headline">{q.title}</p>
                  <p className="t-subhead c-2 clamp-3">{a.body}</p>
                  <CredibilityLabel kind={a.credibility} text={a.credibilityText} />
                </Link>
              ))}
            </section>
          )}

          <section>
            <h2 className="profile__h">Communities</h2>
            {p.communities.map((c) => (
              <CommunityRow key={c} c={communities[c]} />
            ))}
          </section>
        </aside>
      </div>
      {isMobile && <div style={{ height: 12 }} />}
    </Page>
  );
}
