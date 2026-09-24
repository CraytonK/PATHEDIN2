import { useNavigate, useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { Page } from '../components/chrome';
import { KindLabel } from '../components/Post';
import { Avatar } from '../components/ui';
import { IconShare } from '../components/icons';
import { communities } from '../data/communities';
import { me } from '../data/people';
import { wp } from '../data/waypoints';
import { useUI } from '../lib/ui';
import { agoLabel, sanitize, useWriting } from '../lib/writing';
import { NotFound } from './NotFound';
import './stories.css';
import './write.css';

/** A post you published from Write, set like a story. */
export function MyPostScreen() {
  const { id = '' } = useParams();
  const post = useWriting((s) => s.posts.find((p) => p.id === id));
  const remove = useWriting((s) => s.remove);
  const toast = useUI((s) => s.showToast);
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  if (!post) return <NotFound />;
  const words = post.html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 230));
  const c = post.community ? communities[post.community] : undefined;
  const kind = post.kind === 'community' ? 'community' : post.kind;
  return (
    <Page title={post.title} large={false} back="Home" className="page--article">
      <article className="story">
        <header className="story__head">
          <KindLabel
            kind={kind}
            note={
              post.kind === 'community' && c ? (
                <Link to={`/c/${c.id}`}>{c.title}</Link>
              ) : post.segment ? (
                `${wp(post.segment[0]).short} → ${wp(post.segment[1]).short}`
              ) : undefined
            }
          />
          <h1 className="story__title">{post.title}</h1>
          {post.subtitle && <p className="story__dek">{post.subtitle}</p>}
          <div className="story__byline">
            <Avatar id={me.id} size={44} peek={false} />
            <div>
              <p className="story__who">
                <strong>{me.name}</strong>
              </p>
              <p className="story__when">
                {minutes} min read · {agoLabel(post.at)}
                {c && post.kind !== 'community' && (
                  <>
                    {' '}
                    · in <Link to={`/c/${c.id}`}>{c.title}</Link>
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="story__bar">
            <span className="my-post__reach">
              {post.kind === 'question' ? 'Sent first to people who made this move' : post.segment ? `Shown first to people on ${wp(post.segment[0]).short} → ${wp(post.segment[1]).short}` : 'On your profile and in For you'}
            </span>
            <div className="story__tools">
              <button
                className="story__tool"
                aria-label="Share"
                data-tip="Share"
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
        <div className="prose my-post__body" dangerouslySetInnerHTML={{ __html: sanitize(post.html) }} />
        <footer className="my-post__end">
          <Link to="/write" className="my-post__write">
            Write another
          </Link>
          <button
            type="button"
            className="my-post__delete"
            onClick={() => {
              if (!confirm) return setConfirm(true);
              remove(post.id);
              toast('Post deleted');
              navigate('/');
            }}
          >
            {confirm ? 'Tap again to delete' : 'Delete post'}
          </button>
        </footer>
      </article>
    </Page>
  );
}
