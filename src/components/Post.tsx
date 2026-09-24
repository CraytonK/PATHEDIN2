import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { people } from '../data/people';
import { springs } from '../lib/motion';
import type { RelationKind } from '../lib/relations';
import { useUI } from '../lib/ui';
import { IconAlign, IconCommunity, IconDoc, IconEllipsis, IconFlag, IconMilestone, IconPath, IconQuestion, IconSend, IconSignpost } from './icons';
import { Avatar, PersonName, RelationGlyph, SaveToggle } from './ui';
import './post.css';

/** What a post is. Each kind carries the same icon as its section in the sidebar. */
export type PostKind = 'story' | 'question' | 'community' | 'guide' | 'decision' | 'route' | 'milestone';

export const postKinds: Record<PostKind, { label: string; plural: string; icon: (p: { size?: number; strokeWidth?: number }) => ReactNode }> = {
  story: { label: 'Story', plural: 'Stories', icon: IconDoc },
  question: { label: 'Question', plural: 'Questions', icon: IconQuestion },
  community: { label: 'Community', plural: 'Communities', icon: IconCommunity },
  guide: { label: 'Path Guide', plural: 'Path Guides', icon: IconSignpost },
  decision: { label: 'Decision Point', plural: 'Decisions', icon: IconFlag },
  route: { label: 'Route', plural: 'Routes', icon: IconPath },
  milestone: { label: 'Milestone', plural: 'Milestones', icon: IconMilestone },
};

/** The small label that opens every feed post: icon, kind, and a note ("4 answers", the community). */
export function KindLabel({ kind, note }: { kind: PostKind; note?: ReactNode }) {
  const k = postKinds[kind];
  const Icon = k.icon;
  return (
    <p className={`post__kind post__kind--${kind}`}>
      <Icon size={15} strokeWidth={1.9} />
      <span className="post__kind-label">{k.label}</span>
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
  thumbKind?: 'art' | 'photo';
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
 * A feed row laid out like a Medium story preview: byline, bold title, grey subtitle,
 * a quiet meta row, and a thumbnail on the right.
 */
export function Post({ author, where, note, ago, to, title, subtitle, why, stats, thumb, thumbKind = 'art', extra, saveKey, i = 0, variant, kind, kindNote }: PostProps) {
  return (
    <motion.article
      className={`post ${variant ? `post--${variant}` : ''} ${kind ? `post--is-${kind}` : ''}`}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ ...springs.smooth, delay: Math.min(i, 3) * 0.04 }}
    >
      <div className="post__in">
      {kind && <KindLabel kind={kind} note={kindNote} />}
      <p className="post__by">
        <Avatar id={author} size={20} />
        <PersonName id={author} className="post__author" />
        {note && <span className="post__note">· {note}</span>}
        {where && <span className="post__where">in {where}</span>}
        {ago && <span className="post__ago">· {ago}</span>}
      </p>
      <div className="post__main">
        <Link to={to} className="post__link">
          <h2 className="post__title">{title}</h2>
          {subtitle && <p className="post__sub">{subtitle}</p>}
        </Link>
        {extra && <div className="post__extra">{extra}</div>}
        <div className="post__meta">
          {why && (
            <span className="post__why">
              <RelationGlyph kind={why.kind} size={15} />
              <span>{why.text}</span>
            </span>
          )}
          {stats && <span className="post__stats">{stats}</span>}
          <span className="post__actions">
            {saveKey && <SaveToggle saveKey={saveKey} compact />}
            <PostMore person={author} />
          </span>
        </div>
      </div>
      {thumb && (
        <Link to={to} className={`post__thumb post__thumb--${thumbKind}`} tabIndex={-1} aria-hidden="true">
          {thumb}
        </Link>
      )}
      </div>
    </motion.article>
  );
}

/** Medium's "…" menu, with PathedIn's actions on the author. */
export function PostMore({ person }: { person: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const openCompare = useUI((s) => s.openCompare);
  const openRequest = useUI((s) => s.openRequest);
  const toast = useUI((s) => s.showToast);
  const p = people[person];
  useEffect(() => {
    if (!open) return;
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
            {p.id !== 'maya' && (
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
