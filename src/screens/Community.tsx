import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Page } from '../components/chrome';
import { CommunityRoute, membersAt } from '../components/CommunityRoute';
import { CommunityTitle, DecisionItem, JoinButton, PersonRow, QuestionItem, StoryItem, ThreadItem } from '../components/content';
import { Avatar, Button, PersonName, TextTabs, formatCount } from '../components/ui';
import { communities, communityList, threads as allThreads } from '../data/communities';
import { questionList } from '../data/questions';
import { decisionList } from '../data/decisions';
import { storyList } from '../data/stories';
import { people, ME } from '../data/people';
import { wp } from '../data/waypoints';
import type { Thread } from '../data/types';
import { current } from '../lib/relations';
import { springs } from '../lib/motion';
import { useApp } from '../lib/store';
import { useUI } from '../lib/ui';
import { RailFooter, RailPeople, RailPills, RailSection } from '../components/Rail';
import { NotFound } from './NotFound';
import './community.css';

type Tab = 'conversations' | 'questions' | 'decisions' | 'stories' | 'people';

function Composer({ communityId, onPost }: { communityId: string; onPost: (t: Thread) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const toast = useUI((s) => s.showToast);
  const stamp = wp(current(people[ME]).wp).short;
  return (
    <div className={`composer ${open ? 'is-open' : ''}`}>
      <div className="composer__row">
        <Avatar id={ME} size={36} peek={false} />
        <input
          className="composer__title"
          placeholder="Start a conversation…"
          value={title}
          onFocus={() => setOpen(true)}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={springs.smooth} style={{ overflow: 'hidden' }}>
            <textarea className="composer__body" rows={3} placeholder="Say more. People will see where you are on the route." value={body} onChange={(e) => setBody(e.target.value)} />
            <div className="composer__foot">
              <span className="route-stamp t-caption1">Posting as someone at {stamp}</span>
              <div className="composer__btns">
                <Button variant="plain" size="small" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="filled"
                  size="small"
                  disabled={!title.trim()}
                  onClick={() => {
                    onPost({ id: `local-${Date.now()}`, community: communityId, author: ME, title, body, replies: [], replyCount: 0, ago: 'now' });
                    setTitle('');
                    setBody('');
                    setOpen(false);
                    toast('Posted to the community');
                  }}
                >
                  Post
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CommunityScreen() {
  const { id = '' } = useParams();
  const c = communities[id];
  const { hash } = useLocation();
  const joined = useApp((s) => !!s.joined[id]);
  const [tab, setTab] = useState<Tab>('conversations');
  const [stage, setStage] = useState<string | null>(null);
  const [posted, setPosted] = useState<Thread[]>([]);

  useEffect(() => {
    if (hash) setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 400);
  }, [hash]);

  if (!c) return <NotFound />;
  const threads = [...posted, ...allThreads.filter((t) => t.community === id)];
  const qs = questionList.filter((q) => q.community === id);
  const ds = decisionList.filter((d) => d.community === id);
  const ss = storyList.filter((s) => s.communities.includes(id));
  const members = (stage ? membersAt(c, stage) : c.memberIds).filter((m) => m !== ME);
  const related = communityList.filter((x) => x.id !== id && x.stages.some((s) => c.stages.some((cs) => cs.wp === s.wp))).slice(0, 3);
  const threadStage = (t: Thread) => current(people[t.author]).wp;
  const shownThreads = stage ? threads.filter((t) => threadStage(t) === stage) : threads;

  const tabs = [
    { value: 'conversations' as Tab, label: 'Conversations', count: threads.length },
    { value: 'questions' as Tab, label: 'Questions', count: qs.length },
    { value: 'decisions' as Tab, label: 'Decisions', count: ds.length },
    { value: 'stories' as Tab, label: 'Stories', count: ss.length },
    { value: 'people' as Tab, label: 'People', count: c.memberIds.length - 1 },
  ].filter((t) => t.count > 0 || t.value === 'conversations');

  return (
    <Page
      title={c.title}
      large={false}
      back="Communities"
      rail={
        <>
          <RailSection title="Guides in this community" more={{ to: '/guides', label: 'See all Path Guides' }}>
            <RailPeople ids={c.guideIds} action="request" />
          </RailSection>
          {related.length > 0 && (
            <RailSection title="Journeys that cross this one">
              <RailPills items={related.map((r) => ({ to: `/c/${r.id}`, label: r.title }))} />
            </RailSection>
          )}
          <p className="cm__rules">
            Path Communities are for people on this journey. Be specific about where you are, generous about where you’ve been.
          </p>
          <RailFooter />
        </>
      }
    >
      <header className="cm__head">
        <h1 className="cm__title">
          <CommunityTitle c={c} size="lg" />
        </h1>
        <p className="cm__desc t-body c-2">{c.description}</p>
        <div className="cm__meta">
          <span className="t-subhead">
            <strong className="t-num">{formatCount(c.members)}</strong> on this journey · <strong>{c.guides}</strong> Path Guides ·{' '}
            <span className="cm__live">{c.activeNow} here now</span>
          </span>
          <span className="cm__host t-subhead c-2">
            <Avatar id={c.host} size={24} /> Hosted by <PersonName id={c.host} />
          </span>
          <JoinButton id={c.id} size="medium" />
        </div>
      </header>

      <section className="cm__route">
        <div className="cm__route-head">
          <h2 className="t-headline">Who’s here, and where they are</h2>
          {stage ? (
            <button className="t-subhead c-tint" onClick={() => setStage(null)}>
              Show everyone
            </button>
          ) : (
            <span className="t-footnote c-2">Tap a stop to see who’s there</span>
          )}
        </div>
        <CommunityRoute c={c} active={stage} onPick={setStage} />
      </section>

      <div className="cm__main">
          <div className="cm__tabs list-tabs">
            <TextTabs value={tab} onChange={setTab} options={tabs} />
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={tab + (stage ?? '')} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} transition={springs.smooth}>
              {tab === 'conversations' && (
                <>
                  {joined ? (
                    <Composer communityId={c.id} onPost={(t) => setPosted((p) => [t, ...p])} />
                  ) : (
                    <p className="cm__join-note t-subhead c-2">Join to start conversations. Everything you post shows where you are on the route.</p>
                  )}
                  {stage && <p className="cm__filter t-footnote">Conversations from people at {wp(stage).label}</p>}
                  {shownThreads.map((t) => (
                    <div id={t.id} key={t.id}>
                      <ThreadItem t={t} />
                    </div>
                  ))}
                  {!shownThreads.length && <p className="cm__empty t-subhead c-2">No conversations from this stop yet.</p>}
                </>
              )}
              {tab === 'questions' && qs.map((q) => <QuestionItem key={q.id} q={q} />)}
              {tab === 'decisions' && (
                <div className="post-list">
                  {ds.map((d) => (
                    <DecisionItem key={d.id} d={d} />
                  ))}
                </div>
              )}
              {tab === 'stories' && (
                <div className="post-list">
                  {ss.map((s) => (
                    <StoryItem key={s.id} story={s} />
                  ))}
                </div>
              )}
              {tab === 'people' && (
                <>
                  {stage && <p className="cm__filter t-footnote">People at {wp(stage).label}</p>}
                  {members.map((m) => (
                    <PersonRow key={m} id={m} compact />
                  ))}
                </>
              )}
            </motion.div>
          </AnimatePresence>
      </div>
    </Page>
  );
}
