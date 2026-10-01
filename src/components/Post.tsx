import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { people, ME } from '../data/people';
import { springs } from '../lib/motion';
import { useApp } from '../lib/store';
import type { RelationKind } from '../lib/relations';
import { useUI } from '../lib/ui';
import { IconAlign, IconCommunity, IconDoc, IconEllipsis, IconFlag, IconMilestone, IconPath, IconQuestion, IconSend, IconSignpost } from './icons';
import { Avatar, PersonName, RelationGlyph, SaveToggle } from './ui';
import './post.css';

/** What a post is. Each kind carries the same icon wherever it appears: its page, the feed filter and the profile card. */
export type PostKind = 'story' | 'question' | 'community' | 'guide' | 'decision' | 'route' | 'milestone';

export const postKinds: Record<
  PostKind,
  {
    label: string;
    plural: string;
    icon: (p: { size?: number; strokeWidth?: number }) => ReactNode;
  }
> = {
  story: { label: 'Story', plural: 'Stories', icon: IconDoc },
  question: { label: 'Question', plural: 'Questions', icon: IconQuestion },
  community: { label: 'Community', plural: 'Communities', icon: IconCommunity },
  guide: { label: 'Path Guide', plural: 'Path Guides', icon: IconSignpost },
  decision: { label: 'Decision Point', plural: 'Decisions', icon: IconFlag },
  route: { label: 'Route', plural: 'Routes', icon: IconPath },
  milestone: { label: 'Milestone', plural: 'Milestones', icon: IconMilestone },
};

/** The context line that opens every feed post: the kind's icon over the portrait, the kind, and its context ("4 answers", the community). */
export function KindLabel({ kind, note }: { kind: PostKind; note?: ReactNode }) {
  const k = postKinds[kind];
  const Icon = k.icon;
  return (
    <p className={`post__kind post__kind--${kind}`}>
      <span className="post__kind-label">
        <Icon size={14} strokeWidth={1.9} />
        {k.label}
      </span>
      {note && <span className="post__kind-note">{note}</span>}
    </p>
  );
}

export interface PostProps {
  /** Who it's from, and optionally where ("in Chemistry → Pharma R&D"). */
  author: string;
  where?: ReactNode;
  /** A short note after the name, e.g. their relation to you. */
  note?: ReactNode;
  ago?: string;
  to: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Why this is in your feed — PathedIn always says. */
  why?: { kind: RelationKind; text: ReactNode };
  stats?: ReactNode;
  thumb?: ReactNode;
  thumbKind?: 'art' | 'photo' | 'count' | 'mosaic' | 'portrait';
  /** Extra line under the subtitle, e.g. the author's Path. */
  extra?: ReactNode;
  saveKey?: string;
  i?: number;
  /** Stories are content, so their titles are set in Charter. */
  variant?: 'story';
  /** What kind of post this is, shown as a label above the byline in mixed feeds. */
  kind?: PostKind;
  kindNote?: ReactNode;
}

/**
 * A post as a dashboard card: who it's from across the top with the "…" menu, what kind of post it is,
 * the title and the post's own body, and a footer that says why it's here, with its numbers and Save.
 */
export function Post({ author, where, note, ago, to, title, subtitle, why, stats, thumb, thumbKind = 'art', extra, saveKey, i = 0, variant, kind, kindNote }: PostProps) {
  const key = saveKey ?? to;
  const reported = useApp((s) => s.reported[key]);
  const blocked = useApp((s) => !!s.blocked[author]);
  if (reported || blocked) return <PostHidden postKey={key} author={author} blocked={blocked} />;
  return (
    <motion.article
      className={`post ${variant ? `post--${variant}` : ''} ${kind ? `post--is-${kind}` : ''} ${thumb ? 'has-thumb' : ''}`}
      data-morph-card={to}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ ...springs.smooth, delay: Math.min(i, 3) * 0.05 }}
    >
      <div className="post__in">
        {kind && <KindLabel kind={kind} note={kindNote} />}
        <PostByline author={author} note={note} where={where} ago={ago} postKey={key} />
        <div className="post__main">
          <Link to={to} className="post__link">
            <h2 className="post__title" data-morph="title">
              {title}
            </h2>
            {subtitle && <p className="post__sub">{subtitle}</p>}
          </Link>
          {extra && <div className="post__extra">{extra}</div>}
        </div>
        {thumb && (
          <Link to={to} className={`post__thumb post__thumb--${thumbKind}`} tabIndex={-1} aria-hidden="true" data-morph="art">
            {thumb}
          </Link>
        )}
        <PostFoot why={why} stats={stats} saveKey={saveKey} />
      </div>
    </motion.article>
  );
}

/** The top of every post card: the author's face and name, what they are to you, and the "…" menu. */
export function PostByline({ author, note, where, ago, postKey }: { author: string; note?: ReactNode; where?: ReactNode; ago?: string; postKey?: string }) {
  return (
    <div className="post__by">
      <Avatar id={author} size={40} />
      <p className="post__byline">
        <PersonName id={author} className="post__author" />
        {(note || where || ago) && (
          <span className="post__byline-sub">
            {note && <span className="post__note">{note}</span>}
            {where && <span className="post__where">in {where}</span>}
            {ago && <span className="post__ago">{ago}</span>}
          </span>
        )}
      </p>
      <PostMore person={author} postKey={postKey} />
    </div>
  );
}

/** What's left of a post you reported, or of anything by someone you blocked: one quiet line with the way back. */
function PostHidden({ postKey, author, blocked }: { postKey: string; author: string; blocked: boolean }) {
  const unreport = useApp((s) => s.unreport);
  const toggleBlock = useApp((s) => s.toggleBlock);
  const p = people[author];
  return (
    <motion.div className="post-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={springs.smooth}>
      <p>{blocked ? `You blocked ${p.first}. Their posts are hidden.` : 'You reported this post. It’s hidden from your feed.'}</p>
      <button className="post-hidden__undo" onClick={() => (blocked ? toggleBlock(author) : unreport(postKey))}>
        {blocked ? `Unblock ${p.first}` : 'Undo'}
      </button>
    </motion.div>
  );
}

const reportReasons = ['Spam or selling something', 'Misrepresents their Path', 'Harassment or hate', 'Something else'];

/** The footer of every post card: why it's in your feed, its numbers, and Save. */
export function PostFoot({ why, stats, saveKey }: { why?: PostProps['why']; stats?: ReactNode; saveKey?: string }) {
  return (
    <div className="post__meta">
      {why && (
        <span className="post__why">
          <RelationGlyph kind={why.kind} size={15} />
          <span>{why.text}</span>
        </span>
      )}
      {stats && <span className="post__stats">{stats}</span>}
      {saveKey && (
        <span className="post__actions">
          <SaveToggle saveKey={saveKey} compact />
        </span>
      )}
    </div>
  );
}

/** Medium's "…" menu, with PathedIn's actions on the author. */
export function PostMore({ person, postKey }: { person: string; postKey?: string }) {
  const [open, setOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const report = useApp((s) => s.report);
  const toggleBlock = useApp((s) => s.toggleBlock);
  const ref = useRef<HTMLDivElement>(null);
  const openCompare = useUI((s) => s.openCompare);
  const openRequest = useUI((s) => s.openRequest);
  const toast = useUI((s) => s.showToast);
  const p = people[person];
  useEffect(() => {
    if (!open) return setReporting(false);
    const on = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('pointerdown', on);
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('pointerdown', on);
      window.removeEventListener('keydown', key);
    };
  }, [open]);
  const act = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };
  return (
    <div className="post-more" ref={ref}>
      <button className="post-more__btn" aria-label="More" data-tip="More" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <IconEllipsis size={22} strokeWidth={1.6} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="post-more__menu"
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            transition={springs.snappy}
          >
            {reporting && postKey ? (
              <>
                <p className="post-more__h">Why are you reporting this?</p>
                {reportReasons.map((r) => (
                  <button
                    key={r}
                    role="menuitem"
                    onClick={act(() => {
                      report(postKey, r);
                      toast('Thanks. It’s hidden, and PathedIn will look at it');
                    })}
                  >
                    {r}
                  </button>
                ))}
              </>
            ) : (
              <>
                {person !== ME && (
                  <>
                    <button role="menuitem" onClick={act(() => openCompare(person))}>
                      <IconAlign size={18} /> Align Paths with {p.first}
                    </button>
                    <button role="menuitem" onClick={act(() => openRequest(person))}>
                      <IconSend size={18} /> Send {p.first} a Path Request
                    </button>
                  </>
                )}
                <button role="menuitem" className="is-quiet" onClick={act(() => toast('You’ll see fewer posts like this'))}>
                  Show fewer like this
                </button>
                {person !== ME && (
                  <>
                    {postKey && (
                      <button role="menuitem" className="is-quiet" onClick={() => setReporting(true)}>
                        Report this post
                      </button>
                    )}
                    <button
                      role="menuitem"
                      className="is-quiet"
                      onClick={act(() => {
                        toggleBlock(person);
                        toast(`${p.first} is blocked`);
                      })}
                    >
                      Block {p.first}
                    </button>
                  </>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
