import { motion, useScroll, useSpring } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { Page } from '../components/chrome';
import { TransitMap } from '../components/path/TransitMap';
import { RequestButton, SegmentArt, StoryItem } from '../components/content';
import { Avatar, Button, PersonName, SaveToggle } from '../components/ui';
import { IconAlign, IconShare } from '../components/icons';
import { stories, storyList } from '../data/stories';
import { people, ME } from '../data/people';
import { wp } from '../data/waypoints';
import { compactSteps, relationTo } from '../lib/relations';
import { useUI } from '../lib/ui';
import { NotFound } from './NotFound';
import './stories.css';

export function StoryScreen() {
  const { id = '' } = useParams();
  const s = stories[id];
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
    <Page title={s.title} large={false} back="Stories" className="page--article">
      <motion.div className="story__progress" style={{ scaleX: progress }} />
      <article className="story">
        <header className="story__head">
          <h1 className="story__title">{s.title}</h1>
          <p className="story__dek">{s.dek}</p>
          <div className="story__byline">
            <Avatar id={s.author} size={44} />
            <div>
              <p className="story__who">
                <PersonName id={s.author} />
                {rel.kind !== 'self' && rel.kind !== 'other' && <span className="c-2"> · {rel.label}</span>}
              </p>
              <p className="story__when">
                {s.minutes} min read · {s.published}
              </p>
            </div>
          </div>
          {/* Medium's action bar, between two hairlines. */}
          <div className="story__bar">
            <span className="story__stat">{s.reads.toLocaleString('en-CA')} reads</span>
            <span className="story__stat">
              {wp(s.segment[0]).short} → {wp(s.segment[1]).short}
            </span>
            <div className="story__tools">
              {s.author !== ME && (
                <button className="story__tool" aria-label={`Align Paths with ${a.first}`} title="Align Paths" onClick={() => openCompare(s.author)}>
                  <IconAlign size={20} />
                </button>
              )}
              <SaveToggle saveKey={`story:${s.id}`} compact />
              <button
                className="story__tool"
                aria-label="Share"
                title="Share"
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
          <figcaption>{a.first}’s Path. This story happens on the stretch in navy.</figcaption>
        </figure>

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
        </div>

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
    </Page>
  );
}
