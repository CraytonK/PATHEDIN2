import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { people, ME } from '../data/people';
import { wp } from '../data/waypoints';
import { communities } from '../data/communities';
import { conversationList } from '../data/social';
import type { Community, Credibility, Decision, Question, Story, Thread } from '../data/types';
import { compactSteps, current, relationTo, stepTitle } from '../lib/relations';
import { useApp } from '../lib/store';
import { useUI } from '../lib/ui';
import { springs, haptic } from '../lib/motion';
import { PathStrip } from './path/PathStrip';
import { Avatar, AvatarStack, Button, PathChips, PersonName, RelationGlyph, RelationTag, SaveToggle, formatCount } from './ui';
import { IconCheck, IconChevronRight, IconFlag, IconMessage, IconPersonAdd, IconSend } from './icons';
import { usePeek } from './Peek';
import { Post } from './Post';
import './content.css';

/* ── Connect ────────────────────────────────────────────────── */

export function ConnectButton({ id, size = 'small' }: { id: string; size?: 'small' | 'medium' }) {
  const state = useApp((s) => s.connections[id]);
  const connect = useApp((s) => s.connect);
  const toast = useUI((s) => s.showToast);
  const navigate = useNavigate();
  const p = people[id];
  if (state === 'connected') {
    const convo = conversationList.find((c) => c.with === id);
    return (
      <Button variant="gray" size={size} icon={<IconMessage size={17} />} onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(convo ? `/messages/${convo.id}` : `/messages?to=${id}`); }}>
        Message
      </Button>
    );
  }
  return (
    <Button
      variant={state === 'pending' ? 'gray' : 'tinted'}
      size={size}
      icon={state === 'pending' ? <IconCheck size={16} /> : <IconPersonAdd size={17} />}
      aria-pressed={state === 'pending'}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!state) toast(`Connection request sent to ${p.first}`);
        connect(id);
      }}
    >
      {state === 'pending' ? 'Requested' : 'Connect'}
    </Button>
  );
}

export function RequestButton({ id, segment, size = 'small', variant = 'filled', label = 'Request' }: { id: string; segment?: [string, string]; size?: 'small' | 'medium' | 'large'; variant?: 'filled' | 'tinted' | 'gray' | 'ink'; label?: string }) {
  const open = useUI((s) => s.openRequest);
  return (
    <Button
      variant={variant}
      size={size}
      icon={<IconSend size={16} />}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        open(id, segment);
      }}
    >
      {label}
    </Button>
  );
}

/* ── People ─────────────────────────────────────────────────── */

export function PersonRow({ id, why, action = 'connect', compact }: { id: string; why?: string; action?: 'connect' | 'request' | 'none'; compact?: boolean }) {
  const p = people[id];
  const rel = relationTo(id);
  const navigate = useNavigate();
  return (
    <article className={`person-row ${compact ? 'person-row--compact' : ''}`} onClick={() => navigate(`/p/${id}`)}>
      <Avatar id={id} size={compact ? 44 : 52} />
      <div className="person-row__body">
        <div className="person-row__top">
          <div className="person-row__who">
            <PersonName id={id} className="t-headline" />
            {rel.kind !== 'self' && rel.kind !== 'other' && <RelationTag kind={rel.kind} label={rel.label} />}
          </div>
          {action !== 'none' && (
            <div className="person-row__action">{action === 'request' ? <RequestButton id={id} /> : <ConnectButton id={id} />}</div>
          )}
        </div>
        <p className="person-row__headline t-subhead c-2">{p.headline}</p>
        {!compact && <p className="person-row__why t-callout">{why ?? rel.why}</p>}
        <PathStrip id={id} />
      </div>
    </article>
  );
}

export function PersonTile({ id, why }: { id: string; why?: string }) {
  const p = people[id];
  const rel = relationTo(id);
  const handlers = usePeek(id);
  return (
    <Link to={`/p/${id}`} className="person-tile" {...handlers}>
      <motion.div className="person-tile__photo" whileHover={{ scale: 1.015 }} transition={springs.smooth}>
        <img src={p.photo} alt="" loading="lazy" draggable={false} />
      </motion.div>
      <RelationTag kind={rel.kind} label={rel.label} className="person-tile__rel" />
      <h3 className="t-headline person-tile__name">{p.name}</h3>
      <p className="t-footnote c-2 truncate">{p.headline}</p>
      <PathChips id={id} className="person-tile__chips" matchOnly />
      <p className="t-subhead person-tile__why clamp-3">{why ?? rel.why}</p>
      <PathStrip id={id} />
      <div className="person-tile__actions">
        <ConnectButton id={id} />
      </div>
    </Link>
  );
}

/* ── Credibility (why this answer is worth reading) ─────────── */

const credGlyph: Record<Credibility, Parameters<typeof RelationGlyph>[0]['kind']> = {
  'reached-destination': 'guide',
  'took-route': 'ahead',
  'steps-ahead': 'ahead',
  hires: 'peer',
  guide: 'guide',
  'same-stage': 'peer',
  twin: 'twin',
};

export function CredibilityLabel({ kind, text }: { kind: Credibility; text: string }) {
  return (
    <span className="cred t-footnote">
      <span className="cred__glyph">{kind === 'hires' ? <IconFlag size={14} strokeWidth={2} /> : <RelationGlyph kind={credGlyph[kind]} size={15} />}</span>
      {text}
    </span>
  );
}

/* ── Stories ────────────────────────────────────────────────── */

/** Generated cover art: the author's Path, with the stretch the story is about drawn in the tint. */
export function SegmentArt({ story, height = 150, labels = true }: { story: Story; height?: number; labels?: boolean }) {
  const author = people[story.author];
  const steps = compactSteps(author.path);
  const W = 400;
  const H = height;
  const n = steps.length;
  const pad = 46;
  const xs = steps.map((_, i) => pad + (i * (W - pad * 2)) / Math.max(1, n - 1));
  const y = H * 0.56;
  const a = steps.findIndex((s) => s.wp === story.segment[0]);
  const b = steps.findIndex((s) => s.wp === story.segment[1]);
  const clip = `seg-${story.id}`;
  const from = steps[a]?.end ?? steps[a]?.start;
  const to = steps[b]?.start;
  return (
    <svg className="seg-art" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`${author.first}’s Path, ${wp(story.segment[0]).label} to ${wp(story.segment[1]).label}`}>
      <defs>
        <clipPath id={clip}>
          <circle cx={xs[b]} cy={y} r={15} />
        </clipPath>
      </defs>
      <line x1={xs[0]} y1={y} x2={xs[n - 1]} y2={y} stroke="var(--label-4)" strokeWidth={4} strokeLinecap="round" />
      {a >= 0 && b >= 0 && <line x1={xs[a]} y1={y} x2={xs[b]} y2={y} stroke="var(--tint)" strokeWidth={6} strokeLinecap="round" />}
      {a >= 0 && b >= 0 && from && to && (
        <text x={(xs[a] + xs[b]) / 2} y={y - 22} textAnchor="middle" className="seg-art__years">
          {from === to ? `${to}` : `${from} → ${to}`}
        </text>
      )}
      {steps.map((s, i) => {
        const on = i >= a && i <= b;
        if (i === b)
          return (
            <g key={i}>
              <circle cx={xs[i]} cy={y} r={18} fill="var(--tint)" />
              <image href={author.photo} x={xs[i] - 15} y={y - 15} width={30} height={30} clipPath={`url(#${clip})`} preserveAspectRatio="xMidYMid slice" />
              {labels && (
                <text x={xs[i]} y={y + 36} textAnchor="middle" className="seg-art__label is-on">
                  {wp(s.wp).short}
                </text>
              )}
            </g>
          );
        return (
          <g key={i}>
            <circle cx={xs[i]} cy={y} r={on ? 9 : 6} fill={on ? 'var(--ink)' : 'var(--label-3)'} stroke={on ? 'var(--tint)' : 'var(--bg-sunken)'} strokeWidth={on ? 3 : 2.5} />
            {labels && (
              <text x={xs[i]} y={y + 32} textAnchor="middle" className={`seg-art__label ${on ? 'is-on' : ''}`}>
                {wp(s.wp).short}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** A featured story, like the lead on a Medium topic page: the Path art large, then the preview. */
export function StoryLead({ story }: { story: Story }) {
  return (
    <Link to={`/stories/${story.id}`} className="story-lead">
      <div className="story-lead__art">
        <SegmentArt story={story} height={170} />
      </div>
      <div className="story-lead__text">
        <p className="story-lead__by">
          <Avatar id={story.author} size={20} peek={false} />
          <span>{people[story.author].name}</span>
          <span className="c-2">· {story.published}</span>
        </p>
        <h3 className="story-lead__title">{story.title}</h3>
        <p className="story-lead__dek">{story.dek}</p>
        <p className="story-lead__meta">
          {wp(story.segment[0]).short} → {wp(story.segment[1]).short} · {story.minutes} min read
        </p>
      </div>
    </Link>
  );
}

export function StoryByline({ story }: { story: Story }) {
  const rel = relationTo(story.author);
  return (
    <div className="story-byline">
      <Avatar id={story.author} size={28} />
      <span className="t-footnote">
        <PersonName id={story.author} link={false} className="w-600" />
        <span className="c-2">
          {' '}
          · {rel.kind !== 'self' && rel.kind !== 'other' ? rel.label : people[story.author].headline.split(' at ')[0]} · {story.minutes} min
        </span>
      </span>
    </div>
  );
}

/** Relation label for a byline ("Path Twin"), or nothing for yourself and strangers. */
function relationNote(id: string) {
  const rel = relationTo(id);
  return rel.kind !== 'self' && rel.kind !== 'other' ? rel.label : undefined;
}

export function StoryItem({ story, withArt = true, i }: { story: Story; withArt?: boolean; i?: number }) {
  return (
    <Post
      i={i}
      author={story.author}
      note={relationNote(story.author)}
      ago={story.published}
      to={`/stories/${story.id}`}
      title={story.title}
      subtitle={story.dek}
      why={{ kind: 'ahead', text: `${wp(story.segment[0]).short} → ${wp(story.segment[1]).short}` }}
      stats={
        <>
          <span>{story.minutes} min read</span>
          <span>{formatCount(story.reads)} reads</span>
        </>
      }
      thumb={withArt ? <SegmentArt story={story} height={120} labels={false} /> : undefined}
      saveKey={`story:${story.id}`}
    />
  );
}

/* ── Questions ──────────────────────────────────────────────── */

export function QuestionItem({ q, showAnswer = true, i }: { q: Question; showAnswer?: boolean; i?: number }) {
  const top = q.answers[0];
  const c = communities[q.community];
  return (
    <Post
      i={i}
      author={q.asker}
      note={q.asker === ME ? 'You asked' : relationNote(q.asker)}
      where={c ? <Link to={`/c/${c.id}`}>{c.title}</Link> : undefined}
      ago={q.ago}
      to={`/questions/${q.id}`}
      title={q.title}
      subtitle={
        showAnswer && top ? (
          <>
            <strong>{people[top.author].first}:</strong> {top.body}
          </>
        ) : (
          q.body
        )
      }
      why={
        top
          ? { kind: credGlyph[top.credibility], text: `Answered by someone who ${top.credibilityText.charAt(0).toLowerCase()}${top.credibilityText.slice(1)}` }
          : { kind: 'ahead', text: `About ${wp(q.about[0]).short} → ${wp(q.about[1]).short}` }
      }
      stats={
        <>
          <span>{q.answers.length} answers</span>
          <span>{q.followers} following</span>
        </>
      }
      saveKey={`question:${q.id}`}
    />
  );
}

/* ── Decision Points ────────────────────────────────────────── */

export function DecisionFork({ d, width = 280, height = 116 }: { d: Decision; width?: number; height?: number }) {
  const [a, b] = d.options;
  const x0 = 18;
  const y0 = height / 2;
  const split = width * 0.3;
  const ya = height * 0.2;
  const yb = height * 0.8;
  const end = width - 16;
  const chosen = d.status === 'decided' ? d.chosen : undefined;
  const path = (y: number) => `M ${x0} ${y0} L ${split - 14} ${y0} Q ${split} ${y0} ${split + 8} ${y0 + (y - y0) * 0.35} L ${split + 34} ${y} L ${end} ${y}`;
  return (
    <svg className="fork" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${a.label} or ${b.label}`}>
      {[a, b].map((o, i) => {
        const y = i === 0 ? ya : yb;
        const on = chosen ? chosen === o.id : true;
        return (
          <g key={o.id}>
            {/* A road taken is walked (navy); roads still open are the dashed celestial future. */}
            <path d={path(y)} fill="none" stroke={chosen === o.id ? 'var(--ink)' : on ? 'var(--tint)' : 'var(--label-4)'} strokeWidth={3.5} strokeLinecap="round" strokeDasharray={chosen === o.id ? undefined : '5 8'} />
            {chosen === o.id ? (
              <circle cx={end} cy={y} r={6.5} fill="var(--ink)" />
            ) : (
              <circle cx={end} cy={y} r={6} fill="var(--bg-elevated)" stroke={on ? 'var(--tint)' : 'var(--label-3)'} strokeWidth={2.5} />
            )}
            <text x={split + 40} y={y - 9} className="fork__label">
              {o.label}
            </text>
            <text x={end - 12} y={y + 18} textAnchor="end" className="fork__count">
              {o.chose.length} took this way
            </text>
          </g>
        );
      })}
      <circle cx={x0} cy={y0} r={9.5} fill="var(--bg-elevated)" stroke="var(--ink)" strokeWidth={3} />
      <circle cx={x0} cy={y0} r={3.5} fill="var(--tint)" />
    </svg>
  );
}

export function DecisionItem({ d, i }: { d: Decision; i?: number }) {
  return (
    <Post
      i={i}
      author={d.owner}
      note={d.owner === ME ? 'Your decision' : relationNote(d.owner)}
      ago={d.ago}
      to={`/decisions/${d.id}`}
      title={d.title}
      subtitle={d.context}
      why={{ kind: d.status === 'open' ? 'peer' : 'ahead', text: `${d.status === 'open' ? 'Deciding now' : 'Decided'} at ${wp(d.at).short}` }}
      stats={<span>{d.weighIns.length} weighed in</span>}
      thumb={<DecisionFork d={d} />}
      saveKey={`decision:${d.id}`}
    />
  );
}

/* ── Community conversations ────────────────────────────────── */

export function RouteStamp({ id }: { id: string }) {
  const now = current(people[id]);
  return <span className="route-stamp t-caption1">at {wp(now.wp).short}</span>;
}

export function ThreadItem({ t, showCommunity, i }: { t: Thread; showCommunity?: boolean; i?: number }) {
  const c = communities[t.community];
  const repliers = [...new Set(t.replies.map((r) => r.author))];
  const now = current(people[t.author]);
  return (
    <Post
      i={i}
      author={t.author}
      note={`at ${wp(now.wp).short}`}
      where={showCommunity ? <Link to={`/c/${c.id}`}>{c.title}</Link> : undefined}
      ago={t.pinned ? `${t.ago} · Pinned` : t.ago}
      to={`/c/${c.id}#${t.id}`}
      title={t.title}
      subtitle={t.body}
      why={t.replies[0] ? { kind: 'peer', text: `${people[t.replies[0].author].first} replied from ${wp(current(people[t.replies[0].author]).wp).short}` } : undefined}
      stats={
        <span>
          <AvatarStack ids={repliers} size={18} max={3} /> {t.replyCount} replies
        </span>
      }
      saveKey={`thread:${t.id}`}
    />
  );
}

/* ── Communities ────────────────────────────────────────────── */

export function CommunityTitle({ c, size = 'md' }: { c: Community; size?: 'md' | 'lg' }) {
  if (c.kind !== 'transition')
    return <span className={`community-title community-title--${size}`}>{c.title}</span>;
  return (
    <span className={`community-title community-title--${size}`}>
      <span className="community-title__from">{c.from}</span>
      <span className="community-title__arrow" aria-label="to">
        <svg width="26" height="12" viewBox="0 0 26 12" aria-hidden="true">
          <path d="M1 6h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="0 5" />
          <circle cx="22" cy="6" r="3.5" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </span>
      <span className="community-title__to">{c.to}</span>
    </span>
  );
}

export function StageLine({ c, compact }: { c: Community; compact?: boolean }) {
  const max = Math.max(...c.stages.map((s) => s.count));
  return (
    <ol className={`stage-line ${compact ? 'stage-line--compact' : ''}`} aria-label="Where members are on this journey">
      {c.stages.map((s, i) => (
        <li key={s.wp} className="stage-line__stop" data-i={i}>
          <span className="stage-line__dotwrap">
            <span className="stage-line__dot" style={{ width: 6 + (s.count / max) * 10, height: 6 + (s.count / max) * 10 }} />
          </span>
          <span className="stage-line__label">
            {wp(s.wp).short}
            {!compact && <span className="stage-line__n t-num">{formatCount(s.count)}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function JoinButton({ id, size = 'small' }: { id: string; size?: 'small' | 'medium' | 'large' }) {
  const joined = useApp((s) => !!s.joined[id]);
  const toggle = useApp((s) => s.toggleJoin);
  return (
    <Button
      variant={joined ? 'gray' : 'filled'}
      size={size}
      icon={joined ? <IconCheck size={16} /> : undefined}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        haptic(8);
        toggle(id);
      }}
    >
      {joined ? 'Joined' : 'Join'}
    </Button>
  );
}

export function CommunityRow({ c, reason }: { c: Community; reason?: string }) {
  return (
    <Link to={`/c/${c.id}`} className="community-row">
      <div className="community-row__main">
        {reason && <p className="community-row__reason t-caption1">{reason}</p>}
        <h3 className="community-row__title">
          <CommunityTitle c={c} />
        </h3>
        <p className="t-subhead c-2 clamp-2">{c.description}</p>
        <StageLine c={c} compact />
        <div className="community-row__meta t-footnote c-2">
          <AvatarStack ids={c.memberIds.filter((m) => m !== ME)} size={22} max={4} />
          {formatCount(c.members)} on this journey · {c.guides} Guides · <span className="community-row__live">{c.activeNow} here now</span>
        </div>
      </div>
      <div className="community-row__action">
        <JoinButton id={c.id} />
      </div>
    </Link>
  );
}

/* ── Misc ───────────────────────────────────────────────────── */

export function MoreLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="more-link t-subhead">
      {children}
      <IconChevronRight size={14} strokeWidth={2.4} />
    </Link>
  );
}

export function NowLine({ id }: { id: string }) {
  const s = current(people[id]);
  return (
    <span>
      {stepTitle(s)}
      {s.org ? ` · ${s.org}` : ''}
    </span>
  );
}

export { SaveToggle };
