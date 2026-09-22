import { motion, useScroll, useSpring } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { Page } from '../components/chrome';
import { TransitMap } from '../components/path/TransitMap';
import { RequestButton, SegmentArt, StoryItem } from '../components/content';
import { Avatar, Button, PersonName, RelationTag, SaveToggle } from '../components/ui';
import { IconAlign, IconShare } from '../components/icons';
import { stories, storyList } from '../data/stories';
import { people, ME } from '../data/people';
import { wp } from '../data/waypoints';
import { compactSteps, relationTo } from '../lib/relations';
import { useIsMobile } from '../lib/motion';
import { useUI } from '../lib/ui';
import { NotFound } from './NotFound';
import './stories.css';

export function StoryScreen() {
  const { id = '' } = useParams();
  const s = stories[id];
  const isMobile = useIsMobile();
  const openCompare = useUI((u) => u.openCompare);
  const toast = useUI((u) => u.showToast);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  if (!s) return <NotFound />;
  const a = people[s.author];
  const rel = relationTo(s.author);
  const arrived = compactSteps(a.path).find((x) => x.wp === s.segment[1]);
  const more = storyList.filter((x) => x.id !== s.id && (x.segment.includes(s.segment[0]) || x.segment.includes(s.segment[1]) || x.communities.some((c) => s.communities.includes(c)))).slice(0, 3);

  return (
    <Page title={s.title} large={false} back="Stories" wide>
      <motion.div className="story__progress" style={{ scaleX: progress }} />
      <article className="story">
        <header className="story__head">
          <p className="story-kicker t-subhead">
            {wp(s.segment[0]).label} → {wp(s.segment[1]).label}
          </p>
          <h1 className="story__title t-serif">{s.title}</h1>
          <p className="story__dek">{s.dek}</p>
          <div className="story__byline">
            <Avatar id={s.author} size={44} />
            <div>
              <PersonName id={s.author} className="t-subhead" />
              <p className="t-footnote c-2">
                {rel.kind !== 'self' && rel.kind !== 'other' ? `${rel.label} · ` : ''}
                {s.published} · {s.minutes} min read · {s.reads.toLocaleString('en-CA')} reads
              </p>
            </div>
            <div className="story__tools">
              <SaveToggle saveKey={`story:${s.id}`} compact />
              <button
                className="story__share"
                aria-label="Share"
                onClick={() => {
                  try {
                    navigator.clipboard?.writeText(window.location.href);
                  } catch {
                    /* ignore */
                  }
                  toast('Link copied');
                }}
              >
                <IconShare size={20} />
              </button>
            </div>
          </div>
        </header>

        <figure className="story__art">
          <SegmentArt story={s} height={140} />
          <figcaption className="t-footnote c-2">
            {a.first}’s Path. This story happens on the stretch in orange.
          </figcaption>
        </figure>

        <div className="story__layout">
          <div className="story__body">
            {s.body.map((p, i) =>
              p.startsWith('> ') ? (
                <blockquote key={i} className="story__pull t-serif">
                  {p.slice(2)}
                </blockquote>
              ) : (
                <p key={i} className="story__p t-serif">
                  {p}
                </p>
              ),
            )}

            <footer className="story__end">
              <div className="story__end-who">
                <Avatar id={s.author} size={56} />
                <div>
                  <RelationTag kind={rel.kind === 'self' ? 'peer' : rel.kind} label={rel.label} />
                  <p className="t-headline">{a.name}</p>
                  <p className="t-subhead c-2">
                    Went from {wp(s.segment[0]).label} to {wp(s.segment[1]).label}
                    {arrived?.start ? ` in ${arrived.start}` : ''}.
                  </p>
                </div>
              </div>
              {s.author !== ME && (
                <div className="story__end-actions">
                  <RequestButton id={s.author} segment={s.segment} size="medium" label={`Ask ${a.first} about this step`} />
                  <Button variant="tinted" size="medium" icon={<IconAlign size={17} />} onClick={() => openCompare(s.author)}>
                    Align Paths
                  </Button>
                </div>
              )}
            </footer>
          </div>

          {!isMobile && (
            <aside className="story__rail">
              <p className="story__rail-h t-footnote">The Path behind this story</p>
              <TransitMap personId={s.author} highlight={s.segment} showNotes={false} showPeople={false} shareWith={ME} />
            </aside>
          )}
        </div>
      </article>

      {more.length > 0 && (
        <section className="story__more">
          <h2 className="t-title2">More from this stretch of the road</h2>
          <div className="stories__grid">
            {more.map((m) => (
              <StoryItem key={m.id} story={m} />
            ))}
          </div>
        </section>
      )}
    </Page>
  );
}
