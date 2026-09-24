import { motion } from 'framer-motion';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { communities, alongMyRoute, threads } from '../data/communities';
import { decisionList } from '../data/decisions';
import { destinations } from '../data/destinations';
import { people, peopleList, me, ME } from '../data/people';
import { questionList } from '../data/questions';
import { conversationList } from '../data/social';
import { storyList } from '../data/stories';
import type { Answer, Decision, DestinationRoute, Question, Story, Thread } from '../data/types';
import { wp } from '../data/waypoints';
import { compactSteps, current, futureWaypoints, pathMatch, relationTo, walked, type RelationKind } from '../lib/relations';
import { springs } from '../lib/motion';
import { useApp } from '../lib/store';
import { DecisionFork, RequestButton, SegmentArt } from './content';
import { RouteLine } from './Ecosystem';
import { IconCalendar, IconCheck, IconChevronLeft, IconChevronRight, IconPlus } from './icons';
import { PathHint } from './path/PathHint';
import { KindLabel, Post, PostMore, postKinds, type PostKind } from './Post';
import { Avatar, AvatarStack, Button, RelationGlyph, SaveToggle, formatCount } from './ui';
import './feed.css';

/*
  The For you feed mixes seven kinds of post. Each one opens with the same small label as its
  section in the sidebar, and each has a shape of its own, so you can tell them apart at a glance:
  - Story: a serif title and the Path art of the stretch it covers.
  - Question: the best answer so far, quoted, with who it's from.
  - Community: the latest reply as a speech bubble, with the faces in the conversation.
  - Path Guide: a card on a quiet panel, with the move they made and this week's Office Hours.
  - Decision Point: the fork, and an invitation to weigh in.
  - Route: the route drawn as a line, with Add to my Path.
  - Milestone: someone arriving, in their own words.
*/

type Why = { kind: RelationKind; text: string };

function relationNote(id: string) {
  const rel = relationTo(id);
  return rel.kind !== 'self' && rel.kind !== 'other' ? rel.label : undefined;
}

const short = (w: string) => wp(w).short;
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/* ── Stories ─────────────────────────────────────────────────── */

export function StoryPost({ s, why, i }: { s: Story; why: Why; i?: number }) {
  return (
    <Post
      i={i}
      kind="story"
      kindNote={`${short(s.segment[0])} → ${short(s.segment[1])}`}
      author={s.author}
      note={relationNote(s.author)}
      ago={s.published}
      to={`/stories/${s.id}`}
      title={s.title}
      subtitle={s.dek}
      why={why}
      stats={
        <>
          <span>{s.minutes} min read</span>
          <span>{formatCount(s.reads)} reads</span>
        </>
      }
      thumb={<SegmentArt story={s} height={120} labels={false} />}
      saveKey={`story:${s.id}`}
      variant="story"
    />
  );
}

/* ── Questions ───────────────────────────────────────────────── */

function TopAnswer({ a, to, more }: { a: Answer; to: string; more: number }) {
  return (
    <Link to={to} className="qa">
      <span className="qa__who">
        <Avatar id={a.author} size={22} peek={false} />
        <strong>{people[a.author].first}</strong>
        <span className="qa__cred">{lower(a.credibilityText)}</span>
      </span>
      <span className="qa__body">{a.body}</span>
      {more > 0 && (
        <span className="qa__more">
          {more} more {more === 1 ? 'answer' : 'answers'}
          <IconChevronRight size={13} strokeWidth={2.4} />
        </span>
      )}
    </Link>
  );
}

export function QuestionPost({ q, why, i }: { q: Question; why: Why; i?: number }) {
  const top = q.answers[0];
  const c = communities[q.community];
  const to = `/questions/${q.id}`;
  return (
    <Post
      i={i}
      kind="question"
      kindNote={top ? `${q.answers.length} ${q.answers.length === 1 ? 'answer' : 'answers'}` : 'Not answered yet'}
      author={q.asker}
      note={q.asker === ME ? 'You asked' : relationNote(q.asker)}
      where={c ? <Link to={`/c/${c.id}`}>{c.title}</Link> : undefined}
      ago={q.ago}
      to={to}
      title={q.title}
      subtitle={top ? undefined : q.body}
      extra={top ? <TopAnswer a={top} to={to} more={q.answers.length - 1} /> : undefined}
      why={why}
      stats={<span>{q.followers} following</span>}
      saveKey={`question:${q.id}`}
    />
  );
}

/* ── Community conversations ─────────────────────────────────── */

export function ThreadPost({ t, why, i }: { t: Thread; why: Why; i?: number }) {
  const c = communities[t.community];
  const last = t.replies[t.replies.length - 1];
  const repliers = [...new Set(t.replies.map((r) => r.author))];
  const to = `/c/${c.id}#${t.id}`;
  return (
    <Post
      i={i}
      kind="community"
      kindNote={<Link to={`/c/${c.id}`}>{c.title}</Link>}
      author={t.author}
      note={`at ${short(current(people[t.author]).wp)}`}
      ago={t.pinned ? `${t.ago} · Pinned` : t.ago}
      to={to}
      title={t.title}
      subtitle={t.body}
      extra={
        last ? (
          <Link to={to} className="thread-peek">
            <AvatarStack ids={repliers} size={22} max={3} />
            <span className="thread-peek__bubble">
              <strong>{people[last.author].first}</strong> {last.body}
            </span>
          </Link>
        ) : undefined
      }
      why={why}
      stats={<span>{t.replyCount} replies</span>}
      saveKey={`thread:${t.id}`}
    />
  );
}

/* ── Path Guides ─────────────────────────────────────────────── */

function MoveGlyph() {
  return (
    <svg width="30" height="10" viewBox="0 0 30 10" aria-hidden="true" className="move-glyph">
      <path d="M8 5h14" stroke="var(--tint)" strokeWidth="2" strokeLinecap="round" strokeDasharray="2.5 3.5" />
      <circle cx="4.5" cy="5" r="3.2" fill="var(--ink)" />
      <circle cx="25.5" cy="5" r="3" fill="none" stroke="var(--tint)" strokeWidth="1.8" />
    </svg>
  );
}

/** A person, not a piece of writing, so a Guide sits on its own quiet panel. */
export function GuidePost({ id, move, why, i = 0 }: { id: string; move?: [string, string]; why: Why; i?: number }) {
  const g = people[id];
  const guide = g.guide;
  if (!guide) return null;
  const [from, to] = move ?? guide.transitions[0];
  const step = compactSteps(g.path).find((s) => s.wp === to);
  const hours = guide.officeHours;
  return (
    <motion.article
      className="post post--guide post--is-guide"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ ...springs.smooth, delay: Math.min(i, 3) * 0.04 }}
    >
      <div className="fguide">
        <KindLabel kind="guide" note={hours.open > 0 ? 'Office Hours this week' : undefined} />
        <div className="fguide__top">
          <Link to={`/p/${id}`} className="fguide__photo" tabIndex={-1} aria-hidden="true">
            <img src={g.photo} alt="" loading="lazy" />
          </Link>
          <div className="fguide__who">
            <Link to={`/p/${id}`} className="fguide__name">
              {g.name}
            </Link>
            <p className="fguide__headline">{g.headline}</p>
            <p className="fguide__move">
              <MoveGlyph />
              <span>
                Made the move <strong>{short(from)} → {short(to)}</strong>
                {step?.start ? ` in ${step.start}` : ''}
              </span>
            </p>
          </div>
        </div>
        <p className="fguide__helps">Helps with {lower(guide.helpsWith[0])}, and {lower(guide.helpsWith[1] ?? guide.helpsWith[0])}.</p>
        <div className="fguide__hours">
          <span className="fguide__slot">
            <IconCalendar size={15} />
            <span>
              {hours.when} · <strong>{hours.open} of {hours.total} spots open</strong>
            </span>
          </span>
          <RequestButton id={id} segment={[from, to]} label={`Ask ${g.first}`} variant="filled" />
        </div>
        <div className="post__meta">
          <span className="post__why">
            <RelationGlyph kind={why.kind} size={15} />
            <span>{why.text}</span>
          </span>
          <span className="post__stats">
            <span>Helped {guide.helped}</span>
          </span>
          <span className="post__actions">
            <SaveToggle saveKey={`person:${id}`} compact />
            <PostMore person={id} />
          </span>
        </div>
      </div>
    </motion.article>
  );
}

/* ── Decision Points ─────────────────────────────────────────── */

export function DecisionPost({ d, why, i }: { d: Decision; why: Why; i?: number }) {
  const mine = useApp((s) => !!s.weighIns[d.id]);
  const to = `/decisions/${d.id}`;
  return (
    <Post
      i={i}
      kind="decision"
      kindNote={d.status === 'open' ? `Deciding now at ${short(d.at)}` : `Decided at ${short(d.at)}`}
      author={d.owner}
      note={d.owner === ME ? 'Your decision' : relationNote(d.owner)}
      ago={d.ago}
      to={to}
      title={d.title}
      subtitle={d.context}
      extra={
        <Link to={to} className="fweigh">
          {d.weighIns.length > 0 && <AvatarStack ids={d.weighIns.map((w) => w.person)} size={22} max={3} />}
          <span className="fweigh__text">
            {d.options.map((o) => o.label).join(' or ')}
            <span className="fweigh__sub">
              {d.weighIns.length} weighed in with their Path
            </span>
          </span>
          {d.status === 'open' && d.owner !== ME && <span className="fweigh__cta">{mine ? 'You weighed in' : 'Weigh in'}</span>}
        </Link>
      }
      why={why}
      thumb={<DecisionFork d={d} />}
      saveKey={`decision:${d.id}`}
    />
  );
}

/* ── Routes ──────────────────────────────────────────────────── */

function AddRoute({ id, dest }: { id: string; dest: string }) {
  const added = useApp((s) => !!s.addedRoutes[id]);
  const toggle = useApp((s) => s.toggleRoute);
  const primary = me.futures[0];
  if (dest !== primary.destination) return null;
  if (primary.routes?.some((r) => r.id === id)) return <span className="route-post__on">On your Path</span>;
  return (
    <Button
      variant={added ? 'gray' : 'tinted'}
      size="small"
      icon={added ? <IconCheck size={15} /> : <IconPlus size={15} />}
      onClick={(e) => {
        e.preventDefault();
        toggle(id);
      }}
    >
      {added ? 'On your Path' : 'Add to my Path'}
    </Button>
  );
}

export function RoutePost({ dest, route, why, i }: { dest: string; route: DestinationRoute; why: Why; i?: number }) {
  const author = route.guides[0] ?? route.travellers[0] ?? route.onRoute[0];
  const to = `/discover?to=${dest}&route=${route.id}`;
  return (
    <Post
      i={i}
      kind="route"
      kindNote={`To ${wp(dest).mid ?? wp(dest).label}`}
      author={author}
      note={route.onRoute.includes(author) ? 'on this route now' : 'took this route'}
      to={to}
      title={`${route.label} to ${wp(dest).mid ?? wp(dest).label}`}
      subtitle={route.note}
      extra={
        <div className="route-post">
          <RouteLine route={route} dest={dest} />
          <div className="route-post__foot">
            <span>
              {formatCount(route.people)} people · about {route.medianYears} {route.medianYears === 1 ? 'year' : 'years'}
            </span>
            <AddRoute id={route.id} dest={dest} />
          </div>
        </div>
      }
      why={why}
      saveKey={`route:${dest}/${route.id}`}
    />
  );
}

/* ── Milestones ──────────────────────────────────────────────── */

export function MilestonePost({ id, reached, words, ago, why, i, coach }: { id: string; reached: string; words: string; ago?: string; why: Why; i?: number; coach?: boolean }) {
  const p = people[id];
  const convo = conversationList.find((c) => c.with === id);
  const steps = compactSteps(p.path);
  const from = steps[steps.findIndex((st) => st.wp === reached) - 1];
  return (
    <Post
      i={i}
      kind="milestone"
      kindNote={from ? `${short(from.wp)} → ${short(reached)}` : undefined}
      author={id}
      note={relationNote(id)}
      ago={ago}
      to={`/p/${id}`}
      title={`${p.first} reached ${wp(reached).mid ?? wp(reached).label}`}
      subtitle={<span className="milestone-words">“{words}”</span>}
      extra={
        <div className="milestone-foot">
          <PathHint id={id} coach={coach ? 'path-hint' : undefined} />
          <Link to={convo ? `/messages/${convo.id}` : `/messages?to=${id}`} className="milestone-foot__cta">
            Congratulate {p.first}
          </Link>
        </div>
      }
      why={why}
      thumb={<img src={p.photo} alt="" loading="lazy" />}
      thumbKind="photo"
      saveKey={`person:${id}`}
    />
  );
}

/* ── One For you per kind ────────────────────────────────────── */

const mineWalked = new Set(walked(me));
const myFutures = futureWaypoints(me);
/** How close a stretch of road is to Maya's own Path. */
const touches = (a: string, b: string) => (mineWalked.has(a) ? 1 : 0) + (myFutures.has(b) ? 2 : 0) + (mineWalked.has(b) ? 0.5 : 0);

function storyWhy(s: Story): Why {
  const rel = relationTo(s.author);
  if (myFutures.has(s.segment[1])) return { kind: 'ahead', text: `On the way to ${short(s.segment[1])}, where you’re heading` };
  if (mineWalked.has(s.segment[0])) return { kind: 'explorer', text: `Starts at ${short(s.segment[0])}, a step you took` };
  return { kind: rel.kind === 'self' ? 'other' : rel.kind, text: rel.kind === 'other' ? 'A journey far from yours' : `From your ${rel.label}` };
}

function questionWhy(q: Question): Why {
  if (q.asker === ME) return { kind: 'peer', text: `Your question · ${q.answers.length} answers from people ahead of you` };
  const rel = relationTo(q.asker);
  if (rel.kind === 'twin' || rel.kind === 'peer') return { kind: rel.kind, text: `Asked by your ${rel.label}` };
  if (myFutures.has(q.about[1])) return { kind: 'ahead', text: `About ${short(q.about[1])}, where you’re heading` };
  return { kind: 'explorer', text: `About ${short(q.about[0])} → ${short(q.about[1])}` };
}

function decisionWhy(d: Decision): Why {
  const rel = relationTo(d.owner);
  if (d.owner === ME) return { kind: 'peer', text: 'Your decision' };
  if (mineWalked.has(d.at) && d.status === 'open') return { kind: rel.kind === 'twin' ? 'twin' : 'peer', text: `${people[d.owner].first} is facing your exact decision` };
  if (d.status === 'decided') return { kind: 'ahead', text: `Decided at ${short(d.at)}, and where it led` };
  return { kind: 'explorer', text: `A fork at ${short(d.at)}` };
}

function guideWhy(id: string, move: [string, string]): Why {
  if (myFutures.has(move[1])) return { kind: 'guide', text: `Made the move you’re weighing, into ${short(move[1])}` };
  if (mineWalked.has(move[0])) return { kind: 'guide', text: `Started where you are, at ${short(move[0])}` };
  return { kind: relationTo(id).kind === 'other' ? 'other' : 'guide', text: `A Guide for ${short(move[0])} → ${short(move[1])}` };
}

/** The Guide's move that matters most to Maya. */
function bestMove(id: string): [string, string] {
  const t = people[id].guide!.transitions;
  return [...t].sort((a, b) => touches(b[0], b[1]) - touches(a[0], a[1]))[0];
}

const intro: Record<PostKind, { text: string; to: string; link: string }> = {
  story: { text: 'Stories from the stretches of road around yours, told by the people who walked them.', to: '/stories', link: 'All stories' },
  question: { text: 'Questions about the steps on your Path, answered by people who took them.', to: '/questions', link: 'All questions' },
  community: { text: 'Conversations in your communities, and in the ones along your route.', to: '/communities', link: 'All communities' },
  guide: { text: 'People who made the moves you’re weighing, with Office Hours this week.', to: '/guides', link: 'All Path Guides' },
  decision: { text: 'Forks people near your Path are facing, and where each road led.', to: '/decisions', link: 'All Decision Points' },
  route: { text: 'Every way people reached where you’re heading, drawn as a line.', to: '/discover?to=pharma-rnd', link: 'Explore destinations' },
  milestone: { text: 'People on and around your Path arriving somewhere new.', to: '/network', link: 'Your network' },
};

function kindItems(kind: PostKind, joined: Record<string, boolean>): ReactNode[] {
  let i = 0;
  switch (kind) {
    case 'story':
      return [...storyList]
        .sort((a, b) => touches(b.segment[0], b.segment[1]) - touches(a.segment[0], a.segment[1]) || pathMatch(b.author) - pathMatch(a.author))
        .map((s) => <StoryPost key={s.id} s={s} why={storyWhy(s)} i={i++} />);
    case 'question':
      return [...questionList]
        .sort((a, b) => Number(b.asker === ME) - Number(a.asker === ME) || touches(b.about[0], b.about[1]) - touches(a.about[0], a.about[1]) || pathMatch(b.asker) - pathMatch(a.asker))
        .map((q) => <QuestionPost key={q.id} q={q} why={questionWhy(q)} i={i++} />);
    case 'community': {
      const along = new Map(alongMyRoute.map((r) => [r.id, r.reason]));
      return threads
        .filter((t) => joined[t.community] || along.has(t.community))
        .sort((a, b) => Number(!!joined[b.community]) - Number(!!joined[a.community]))
        .map((t) => (
          <ThreadPost
            key={t.id}
            t={t}
            why={joined[t.community] ? { kind: 'peer', text: 'In a community you’re in' } : { kind: 'explorer', text: along.get(t.community) ?? 'Along your route' }}
            i={i++}
          />
        ));
    }
    case 'guide':
      return peopleList
        .filter((p) => p.id !== ME && p.guide)
        .map((p) => ({ id: p.id, move: bestMove(p.id) }))
        .sort((a, b) => touches(b.move[0], b.move[1]) - touches(a.move[0], a.move[1]) || pathMatch(b.id) - pathMatch(a.id))
        .map((g) => <GuidePost key={g.id} id={g.id} move={g.move} why={guideWhy(g.id, g.move)} i={i++} />);
    case 'decision':
      return [...decisionList]
        .sort((a, b) => Number(mineWalked.has(b.at)) - Number(mineWalked.has(a.at)) || pathMatch(b.owner) - pathMatch(a.owner))
        .map((d) => <DecisionPost key={d.id} d={d} why={decisionWhy(d)} i={i++} />);
    case 'route':
      return me.futures.flatMap((f) =>
        (destinations[f.destination]?.routes ?? []).map((r) => {
          const onPath = f.routes?.some((x) => x.id === r.id);
          return (
            <RoutePost
              key={`${f.destination}-${r.id}`}
              dest={f.destination}
              route={r}
              why={onPath ? { kind: 'peer', text: 'A route already on your Path' } : { kind: 'explorer', text: f.certainty === 'set' ? 'A route to your destination you haven’t added' : `A way into ${short(f.destination)}, which you’re exploring` }}
              i={i++}
            />
          );
        }),
      );
    case 'milestone':
      return [];
  }
}

/** For you, narrowed to one kind of post. */
export function KindFeed({ kind }: { kind: PostKind }) {
  const joined = useApp((s) => s.joined);
  const items = kindItems(kind, joined);
  const k = intro[kind];
  return (
    <div className="feed">
      <p className="kind-intro">
        {k.text}{' '}
        <Link to={k.to}>
          {k.link}
          <IconChevronRight size={13} strokeWidth={2.4} />
        </Link>
      </p>
      {items}
    </div>
  );
}

/* ── The filter row ──────────────────────────────────────────── */

export const feedKinds: PostKind[] = ['story', 'question', 'community', 'guide', 'decision', 'route'];

export function KindFilter({ value, onChange }: { value: PostKind | 'all'; onChange: (v: PostKind | 'all') => void }) {
  const row = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  // Like Medium's topic bar: when the pills run past the column, arrows fade in at the edges.
  useLayoutEffect(() => {
    const el = row.current;
    if (!el) return;
    const update = () => setEdges({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, []);
  useEffect(() => {
    const el = row.current;
    const on = el?.querySelector<HTMLElement>('.is-on');
    if (!el || !on) return;
    if (on.offsetLeft < el.scrollLeft || on.offsetLeft + on.offsetWidth > el.scrollLeft + el.clientWidth) el.scrollTo({ left: on.offsetLeft - 48, behavior: 'smooth' });
  }, [value]);
  const nudge = (dir: 1 | -1) => row.current?.scrollBy({ left: dir * 240, behavior: 'smooth' });
  return (
    <div className="kind-filter-wrap">
      {edges.left && (
        <button type="button" className="kind-filter__arrow is-left" aria-label="Show earlier filters" onClick={() => nudge(-1)}>
          <IconChevronLeft size={18} strokeWidth={2} />
        </button>
      )}
      <div className="kind-filter" ref={row} role="tablist" aria-label="Show in For you">
        {(['all', ...feedKinds] as const).map((k) => {
          const on = value === k;
          const Icon = k === 'all' ? null : postKinds[k].icon;
          return (
            <button key={k} role="tab" aria-selected={on} className={`kind-filter__pill ${on ? 'is-on' : ''}`} onClick={() => onChange(k)}>
              {Icon && <Icon size={15} strokeWidth={1.9} />}
              {k === 'all' ? 'All' : postKinds[k].plural}
            </button>
          );
        })}
      </div>
      {edges.right && (
        <button type="button" className="kind-filter__arrow is-right" aria-label="Show more filters" onClick={() => nudge(1)}>
          <IconChevronRight size={18} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
