import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Page } from '../components/chrome';
import { TransitMap } from '../components/path/TransitMap';
import { RequestButton, SegmentArt, StoryItem } from '../components/content';
import { RespondButton, ResponsesSheet, StoryText, TopicPills, responseCount } from '../components/Reading';
import { Avatar, Button, Helpful, PersonName, SaveToggle } from '../components/ui';
import { IconAlign, IconShare } from '../components/icons';
import { stories, storyList } from '../data/stories';
import { people, ME } from '../data/people';
import { wp } from '../data/waypoints';
import type { Story } from '../data/types';
import { compactSteps, relationTo } from '../lib/relations';
import { useIsMobile, useScrollDirection } from '../lib/motion';
import { useApp } from '../lib/store';
import { useUI } from '../lib/ui';
import { NotFound } from './NotFound';
import './stories.css';

/** How many readers said a story helped: a stand-in for real counts in this prototype. */
const helpedCount = (s: Story) => Math.round(s.reads / 12);

export function StoryScreen() {
  const { id = '' } = useParams();
  const s = stories[id];
  const openCompare = useUI((u) => u.openCompare);
  const toast = useUI((u) => u.showToast);
  const mine = useApp((st) => (s ? st.myResponses[s.id] : undefined)) ?? [];
  const isMobile = useIsMobile();
  const dir = useScrollDirection();
  const [responses, setResponses] = useState(false);
  const [quote, setQuote] = useState<string | undefined>();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  const walker = useTransform(progress, (v) => `${v * 100}%`);
  const walkerShown = useTransform(progress, [0, 0.015], [0, 1]);
  if (!s) return <NotFound />;
  const a = people[s.author];
  const rel = relationTo(s.author);
  const arrived = compactSteps(a.path).find((x) => x.wp === s.segment[1]);
  const more = storyList.filter((x) => x.id !== s.id && (x.segment.includes(s.segment[0]) || x.segment.includes(s.segment[1]) || x.communities.some((c) => s.communities.includes(c)))).slice(0, 3);
  const count = responseCount(s, mine.length);
  const reading = isMobile && dir === 'down' && !responses;

  const share = () => {
    try {
      navigator.clipboard?.writeText(window.location.href);
    } catch {
      /* ignore */
    }
    toast('Link copied');
  };
  const openResponses = (q?: string) => {
    setQuote(q);
    setResponses(true);
  };

  // Medium's action bar: the reader's own actions on the left, tools on the right.
  const bar = (
    <div className="story__bar">
      <Helpful helpKey={`story:${s.id}`} count={helpedCount(s)} compact />
      <RespondButton count={count} onClick={() => openResponses()} />
      <div className="story__tools">
        {s.author !== ME && (
          <button className="story__tool" aria-label={`Align Paths with ${a.first}`} data-tip="Align Paths" onClick={() => openCompare(s.author)}>
            <IconAlign size={20} />
          </button>
        )}
        <SaveToggle saveKey={`story:${s.id}`} compact />
        <button className="story__tool" aria-label="Share" data-tip="Share" onClick={share}>
          <IconShare size={20} />
        </button>
      </div>
    </div>
  );

  return (
    <Page title={s.title} large={false} back="Stories" className={`page--article ${reading ? 'is-reading' : ''}`}>
      <div className="story__progress" aria-hidden="true">
        <motion.span className="story__progress-walked" style={{ scaleX: progress }} />
        <motion.span className="story__progress-walker" style={{ x: walker, opacity: walkerShown }} />
      </div>
      <article className="story">
        <header className="story__head">
          <TopicPills ids={s.communities} />
          <h1 className="story__title">{s.title}</h1>
          <p className="story__dek">{s.dek}</p>
          <div className="story__byline">
            <Avatar id={s.author} size={44} />
            <div>
              <p className="story__who">
                <PersonName id={s.author} />
                {rel.kind !== 'self' && rel.kind !== 'other' && (
                  <span className="story__rel c-2">
                    <span className="story__rel-dot"> · </span>
                    {rel.label}
                  </span>
                )}
              </p>
              <p className="story__when">
                {s.minutes} min read · {s.published} · {s.reads.toLocaleString('en-CA')} reads
              </p>
            </div>
          </div>
          {bar}
        </header>

        <figure className="story__art">
          <SegmentArt story={s} height={140} />
          <figcaption>{a.first}’s Path. This story happens on the stretch in navy.</figcaption>
        </figure>

        <StoryText story={s} onRespond={(q) => openResponses(q)} />

        {/* The bar again at the end, as on Medium, so the reaction is right where the reading stops. */}
        <div className="story__bar-end">{bar}</div>

        <section className="story__path">
          <h2 className="story__section-h">The Path behind this story</h2>
          <TransitMap personId={s.author} highlight={s.segment} showNotes={false} showPeople={false} shareWith={ME} />
        </section>

        <footer className="story__end">
          <div className="story__end-who">
            <Avatar id={s.author} size={64} />
            <div>
              <p className="story__end-name">Written by {a.name}</p>
              <p className="story__end-sub">
                {rel.kind !== 'self' && rel.kind !== 'other' ? `${rel.label} · ` : ''}Went from {wp(s.segment[0]).label} to {wp(s.segment[1]).label}
                {arrived?.start ? ` in ${arrived.start}` : ''}.
              </p>
            </div>
          </div>
          {s.author !== ME && (
            <div className="story__end-actions">
              <RequestButton id={s.author} segment={s.segment} size="medium" label={`Ask ${a.first} about this step`} />
              <Button variant="outline" size="medium" icon={<IconAlign size={17} />} onClick={() => openCompare(s.author)}>
                Align Paths
              </Button>
            </div>
          )}
        </footer>

        {more.length > 0 && (
          <section className="story__more">
            <h2 className="story__section-h">More from this stretch of the road</h2>
            <div className="post-list">
              {more.map((m, i) => (
                <StoryItem key={m.id} story={m} i={i} />
              ))}
            </div>
          </section>
        )}
      </article>

      {/* iPhone: the reading dock takes the tab bar's place, and gets out of the way while you read. */}
      {isMobile && (
        <motion.div className="story-dock" initial={false} animate={{ y: reading ? '110%' : '0%' }} transition={{ type: 'tween', duration: 0.28, ease: [0.23, 1, 0.32, 1] }}>
            <Helpful helpKey={`story:${s.id}`} count={helpedCount(s)} compact />
            <RespondButton count={count} onClick={() => openResponses()} />
            <SaveToggle saveKey={`story:${s.id}`} compact />
            <button className="story__tool" aria-label="Share" onClick={share}>
              <IconShare size={20} />
            </button>
        </motion.div>
      )}

      <ResponsesSheet story={s} open={responses} onClose={() => setResponses(false)} quote={quote} onClearQuote={() => setQuote(undefined)} />
    </Page>
  );
}
