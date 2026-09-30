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
import { agoLabel, useWriting, type MyPost } from '../lib/writing';
import { RequestButton, SegmentArt } from './content';
import { RouteLine } from './Ecosystem';
import { IconCalendar, IconCheck, IconChevronLeft, IconChevronRight, IconPlus, IconStar } from './icons';
import { economyOf, priceLabel, serviceKinds, servicesOf, topStanding } from '../lib/guides';
import { useUI } from '../lib/ui';
import { PathHint } from './path/PathHint';
import { BookButton } from './Booking';
import { useOpenSpots } from '../lib/booking';
import { KindLabel, Post, PostByline, PostFoot, PostMore, postKinds, type PostKind } from './Post';
import { Avatar, AvatarStack, Button, PersonName, formatCount } from './ui';
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

/* A card in the feed. Every kind shares the card, the entrance and the footer; each has its own anatomy. */
function FeedCard({ kind, i = 0, className = '', children }: { kind: PostKind; i?: number; className?: string; children: ReactNode }) {
  return (
    <motion.article
      className={`post fc fc--${kind} post--is-${kind} ${className}`}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ ...springs.smooth, delay: Math.min(i, 3) * 0.05 }}
    >
      {children}
    </motion.article>
  );
}

/* ── Stories: an editorial card, led by the stretch of road it covers ── */

export function StoryPost({ s, why, i }: { s: Story; why: Why; i?: number }) {
  const to = `/stories/${s.id}`;
  const note = relationNote(s.author);
  return (
    <FeedCard kind="story" i={i}>
      <Link to={to} className="fc-story__cover" tabIndex={-1} aria-hidden="true">
        <SegmentArt story={s} height={132} labels />
      </Link>
      <div className="fc-story__head">
        <KindLabel kind="story" note={`${short(s.segment[0])} → ${short(s.segment[1])}`} />
        <PostMore person={s.author} />
      </div>
      <Link to={to} className="fc-story__link">
        <h2 className="fc-story__title">{s.title}</h2>
        <p className="fc-story__dek">{s.dek}</p>
      </Link>
      <div className="fc-story__by">
        <Avatar id={s.author} size={28} />
        <span className="fc-story__who">
          <PersonName id={s.author} className="fc-story__name" />
          <span>
            {note ? `${note} · ` : ''}
            {s.published}
          </span>
        </span>
        <span className="fc-story__read">
          {s.minutes} min read · {formatCount(s.reads)} reads
        </span>
      </div>
      <PostFoot why={why} saveKey={`story:${s.id}`} />
    </FeedCard>
  );
}

/* ── Questions: the question large, the best answer quoted, and a way to answer ── */

function TopAnswer({ a, to, more }: { a: Answer; to: string; more: number }) {
  return (
    <Link to={to} className="qa">
      <span className="qa__who">
        <Avatar id={a.author} size={24} peek={false} />
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
  const mine = q.asker === ME;
  return (
    <FeedCard kind="question" i={i}>
      <div className="fc-q__head">
        <KindLabel kind="question" note={c ? <Link to={`/c/${c.id}`}>{c.title}</Link> : undefined} />
        <PostMore person={q.asker} />
      </div>
      <div className="fc-q__main">
        <Link to={to} className="fc-q__count" aria-label={`${q.answers.length} answers`}>
          <strong>{q.answers.length}</strong>
          <span>{q.answers.length === 1 ? 'answer' : 'answers'}</span>
        </Link>
        <div className="fc-q__text">
          <Link to={to} className="fc-q__title">
            {q.title}
          </Link>
          <p className="fc-q__asker">
            <Avatar id={q.asker} size={20} />
            <span>
              {mine ? 'You asked' : `Asked by ${people[q.asker].first}`}
              {!mine && relationNote(q.asker) ? `, your ${lower(relationNote(q.asker)!)}` : ''} · {q.ago}
            </span>
          </p>
        </div>
      </div>
      {top ? <TopAnswer a={top} to={to} more={q.answers.length - 1} /> : <p className="fc-q__body">{q.body}</p>}
      <div className="fc-q__act">
        <Link to={to} className="fc-q__answer">
          {mine ? 'Read the answers' : top ? 'Add your answer' : 'Be the first to answer'}
        </Link>
        <span className="fc-q__follow">{q.followers} following</span>
      </div>
      <PostFoot why={why} saveKey={`question:${q.id}`} />
    </FeedCard>
  );
}

/* ── Community: a live conversation, led by the community, with a place to reply ── */

export function ThreadPost({ t, why, i }: { t: Thread; why: Why; i?: number }) {
  const c = communities[t.community];
  const to = `/c/${c.id}#${t.id}`;
  const recent = t.replies.slice(-2);
  const faces = c.memberIds.filter((m) => m !== ME).slice(0, 4);
  return (
    <FeedCard kind="community" i={i}>
      <div className="fc-t__head">
        <Link to={`/c/${c.id}`} className="fc-t__community">
          <span className="fc-t__mosaic" aria-hidden="true">
            {faces.map((m) => (
              <img key={m} src={people[m].photo} alt="" loading="lazy" />
            ))}
          </span>
          <span className="fc-t__ctext">
            <strong>{c.title}</strong>
            <span>
              <span className="fc-t__live" aria-hidden="true" />
              {c.activeNow} here now · {formatCount(c.members)} members
            </span>
          </span>
        </Link>
        <PostMore person={t.author} />
      </div>
      <p className="fc-t__by">
        <Avatar id={t.author} size={22} />
        <PersonName id={t.author} className="fc-t__author" />
        <span>
          at {short(current(people[t.author]).wp)} · {t.pinned ? `${t.ago} · Pinned` : t.ago}
        </span>
      </p>
      <Link to={to} className="fc-t__link">
        <h2 className="fc-t__title">{t.title}</h2>
        <p className="fc-t__body">{t.body}</p>
      </Link>
      {recent.length > 0 && (
        <Link to={to} className="fc-t__chat" aria-label={`${t.replyCount} replies`}>
          {recent.map((r, j) => (
            <span key={j} className="fc-t__msg">
              <Avatar id={r.author} size={24} peek={false} />
              <span className="fc-t__bubble">
                <strong>{people[r.author].first}</strong> {r.body}
              </span>
            </span>
          ))}
          <span className="fc-t__more">
            {t.replyCount} replies
            <IconChevronRight size={13} strokeWidth={2.4} />
          </span>
        </Link>
      )}
      <Link to={to} className="fc-t__reply">
        <img src={me.photo} alt="" />
        <span>Reply in {c.title}…</span>
      </Link>
      <PostFoot why={why} saveKey={`thread:${t.id}`} />
    </FeedCard>
  );
}

/* ── Path Guides: a creator card — their Path on navy, their standing, their prices ── */

function BandPath({ id, move }: { id: string; move: [string, string] }) {
  const steps = compactSteps(people[id].path);
  const n = steps.length;
  const x = (k: number) => 24 + (k * (312 - 48)) / Math.max(1, n - 1);
  const a = steps.findIndex((st) => st.wp === move[0]);
  const b = steps.findIndex((st) => st.wp === move[1]);
  return (
    <svg className="fc-g__path" viewBox="0 0 312 40" preserveAspectRatio="xMaxYMid meet" aria-hidden="true">
      <line x1={x(0)} y1="20" x2={x(n - 1)} y2="20" stroke="rgba(255,247,237,0.3)" strokeWidth="2" strokeLinecap="round" />
      {a >= 0 && b > a && <line x1={x(a)} y1="20" x2={x(b)} y2="20" stroke="#8fa8ff" strokeWidth="4" strokeLinecap="round" />}
      {steps.map((st, k) => (
        <circle key={`${st.wp}-${k}`} cx={x(k)} cy="20" r={k === a || k === b ? 5.5 : 4} fill={k === b ? '#0f172a' : k === a ? '#8fa8ff' : '#fff7ed'} stroke={k === b ? '#8fa8ff' : 'none'} strokeWidth="2.5" />
      ))}
    </svg>
  );
}

export function GuidePost({ id, move, why, i = 0 }: { id: string; move?: [string, string]; why: Why; i?: number }) {
  const g = people[id];
  const guide = g.guide;
  const spots = useOpenSpots(id);
  const openBooking = useUI((s) => s.openBooking);
  const econ = economyOf(id);
  if (!guide) return null;
  const [from, to] = move ?? guide.transitions[0];
  const step = compactSteps(g.path).find((s) => s.wp === to);
  const top = topStanding(id);
  const services = servicesOf(id).slice(0, 4);
  return (
    <FeedCard kind="guide" i={i} className="post--guide">
      <div className="fc-g__band immersive">
        <span className="fc-g__badge">Path Guide</span>
        {econ && (
          <span className="fc-g__rating">
            <IconStar size={13} filled /> {econ.rating.toFixed(1)} <span>({econ.reviewCount})</span>
          </span>
        )}
        <BandPath id={id} move={[from, to]} />
      </div>
      <div className="fguide">
        <div className="fc-g__who">
          <Link to={`/p/${id}`} className="fc-g__photo" data-portrait={id} tabIndex={-1} aria-hidden="true">
            <img src={g.photo} alt="" loading="lazy" />
          </Link>
          <div className="fc-g__id">
            <Link to={`/p/${id}`} className="fguide__name">
              {g.name}
            </Link>
            <p className="fguide__headline">{g.headline}</p>
          </div>
          <PostMore person={id} />
        </div>
        {top && <p className="fc-g__top">{top}</p>}
        <p className="fguide__move">
          <MoveGlyph />
          <span>
            Made the move <strong>{short(from)} → {short(to)}</strong>
            {step?.start ? ` in ${step.start}` : ''} · helped {guide.helped}
          </span>
        </p>
        <ul className="fc-g__svcs">
          {services.map((sv) => {
            const Icon = serviceKinds[sv.kind].icon;
            return (
              <li key={sv.id}>
                <button type="button" className={`fc-g__svc ${sv.price === 0 ? 'is-free' : ''}`} onClick={() => openBooking(id, { service: sv.id })}>
                  <Icon size={15} strokeWidth={1.9} />
                  <span>{sv.kind === 'office-hours' ? 'Office Hours' : serviceKinds[sv.kind].label}</span>
                  <strong>{priceLabel(sv)}</strong>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="fguide__hours">
          <span className="fguide__slot">
            <IconCalendar size={15} />
            <span>
              {spots.when} · <strong>{spots.open ? `${spots.open} of ${spots.total} free spots open` : 'Full this time'}</strong>
            </span>
          </span>
          <span className="fguide__cta">
            <RequestButton id={id} segment={[from, to]} label="Ask" variant="gray" />
            <BookButton id={id} label="Book" />
          </span>
        </div>
        <PostFoot why={why} saveKey={`person:${id}`} />
      </div>
    </FeedCard>
  );
}

function MoveGlyph() {
  return (
    <svg width="30" height="10" viewBox="0 0 30 10" aria-hidden="true" className="move-glyph">
      <path d="M8 5h14" stroke="var(--tint)" strokeWidth="2" strokeLinecap="round" strokeDasharray="2.5 3.5" />
      <circle cx="4.5" cy="5" r="3.2" fill="var(--ink)" />
      <circle cx="25.5" cy="5" r="3" fill="none" stroke="var(--tint)" strokeWidth="1.8" />
    </svg>
  );
}

/* ── Decision Points: a poll of the roads, with who took each one ── */

export function DecisionPost({ d, why, i }: { d: Decision; why: Why; i?: number }) {
  const mine = useApp((s) => s.weighIns[d.id]);
  const to = `/decisions/${d.id}`;
  const counts = d.options.map((o) => o.chose.length + d.weighIns.filter((w) => w.option === o.id).length + (mine?.option === o.id ? 1 : 0));
  const total = Math.max(1, counts.reduce((x, y) => x + y, 0));
  return (
    <FeedCard kind="decision" i={i}>
      <PostByline author={d.owner} note={d.owner === ME ? 'Your decision' : relationNote(d.owner)} ago={d.ago} />
      <KindLabel kind="decision" note={d.status === 'open' ? `Deciding now at ${short(d.at)}` : `Decided at ${short(d.at)}`} />
      <Link to={to} className="fc-d__link">
        <h2 className="fc-d__title">{d.title}</h2>
        <p className="fc-d__ctx">{d.context}</p>
      </Link>
      <Link to={to} className="fc-d__poll" aria-label="See where each road led">
        {d.options.map((o, k) => {
          const faces = [...o.chose.map((c) => c.person), ...d.weighIns.filter((w) => w.option === o.id).map((w) => w.person)];
          const share = counts[k] / total;
          return (
            <span key={o.id} className={`fc-d__opt ${mine?.option === o.id ? 'is-mine' : ''} ${d.chosen === o.id ? 'is-chosen' : ''}`}>
              <motion.span className="fc-d__fill" initial={{ scaleX: 0 }} whileInView={{ scaleX: share }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.15 + k * 0.1, ease: [0.16, 1, 0.3, 1] }} />
              <span className="fc-d__label">
                <span className="fc-d__letter">{String.fromCharCode(65 + k)}</span>
                {o.label}
              </span>
              {faces.length > 0 && <AvatarStack ids={faces} size={20} max={3} />}
              <span className="fc-d__n">{counts[k]}</span>
            </span>
          );
        })}
      </Link>
      <div className="fc-d__act">
        <span className="fc-d__note">
          {d.options.reduce((n, o) => n + o.chose.length, 0)} took one of these roads · {d.weighIns.length} weighed in
        </span>
        {d.status === 'open' && d.owner !== ME && (
          <Link to={to} className={`fweigh__cta ${mine ? 'is-done' : ''}`}>
            {mine ? 'You weighed in' : 'Weigh in'}
          </Link>
        )}
      </div>
      <PostFoot why={why} saveKey={`decision:${d.id}`} />
    </FeedCard>
  );
}

/* ── Routes: a map — the line, and how many walked it ── */

function AddRoute({ id, dest }: { id: string; dest: string }) {
  const added = useApp((s) => !!s.addedRoutes[id]);
  const toggle = useApp((s) => s.toggleRoute);
  const primary = me.futures[0];
  if (dest !== primary.destination) return null;
  if (primary.routes?.some((r) => r.id === id)) return <span className="route-post__on">On your Path</span>;
  return (
    <Button
      variant={added ? 'gray' : 'filled'}
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
    <FeedCard kind="route" i={i}>
      <div className="fc-r__head">
        <KindLabel kind="route" note={`To ${wp(dest).mid ?? wp(dest).label}`} />
        <PostMore person={author} />
      </div>
      <Link to={to} className="fc-r__link">
        <h2 className="fc-r__title">
          {route.label} to {wp(dest).mid ?? wp(dest).label}
        </h2>
      </Link>
      <dl className="fc-r__stats">
        <div>
          <dt>people took it</dt>
          <dd>{formatCount(route.people)}</dd>
        </div>
        <div>
          <dt>{route.medianYears === 1 ? 'year, typically' : 'years, typically'}</dt>
          <dd>{route.medianYears}</dd>
        </div>
        <div>
          <dt>on it right now</dt>
          <dd>{route.onRoute.length}</dd>
        </div>
      </dl>
      <div className="route-post">
        <RouteLine route={route} dest={dest} />
      </div>
      {route.note && <p className="fc-r__note">{route.note}</p>}
      <div className="fc-r__act">
        <span className="fc-r__who">
          <AvatarStack ids={[...route.guides, ...route.travellers].slice(0, 4)} size={22} max={4} />
          {people[author].first} {route.onRoute.includes(author) ? 'is on this route now' : 'took this route'}
        </span>
        <AddRoute id={route.id} dest={dest} />
      </div>
      <PostFoot why={why} saveKey={`route:${dest}/${route.id}`} />
    </FeedCard>
  );
}

/* ── Milestones: someone arriving, celebrated ── */

export function MilestonePost({ id, reached, words, ago, why, i, coach }: { id: string; reached: string; words: string; ago?: string; why: Why; i?: number; coach?: boolean }) {
  const p = people[id];
  const convo = conversationList.find((c) => c.with === id);
  const steps = compactSteps(p.path);
  const from = steps[steps.findIndex((st) => st.wp === reached) - 1];
  const note = relationNote(id);
  return (
    <FeedCard kind="milestone" i={i}>
      <div className="fc-m__corner">
        <PostMore person={id} />
      </div>
      <div className="fc-m">
        <Link to={`/p/${id}`} className="fc-m__photo" data-portrait={id} tabIndex={-1} aria-hidden="true">
          <img src={p.photo} alt="" loading="lazy" />
          <span className="fc-m__arrived" aria-hidden="true">
            <IconCheck size={14} strokeWidth={3} />
          </span>
        </Link>
        <KindLabel kind="milestone" note={from ? `${short(from.wp)} → ${short(reached)}` : undefined} />
        <Link to={`/p/${id}`} className="fc-m__title">
          {p.first} reached {wp(reached).mid ?? wp(reached).label}
        </Link>
        <p className="fc-m__meta">
          {note ? `${note} · ` : ''}
          {ago} ago
        </p>
        <p className="fc-m__words">“{words}”</p>
        <PathHint id={id} coach={coach ? 'path-hint' : undefined} />
        <Link to={convo ? `/messages/${convo.id}` : `/messages?to=${id}`} className="fc-m__cta">
          Congratulate {p.first}
        </Link>
      </div>
      <PostFoot why={why} saveKey={`person:${id}`} />
    </FeedCard>
  );
}

/* ── What you published from Write ───────────────────────────── */

export function MyPostItem({ post, i }: { post: MyPost; i?: number }) {
  const c = post.community ? communities[post.community] : undefined;
  const seg = post.segment ? `${short(post.segment[0])} → ${short(post.segment[1])}` : undefined;
  const excerpt = post.subtitle ?? post.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
  return (
    <Post
      i={i}
      kind={post.kind}
      kindNote={post.kind === 'community' && c ? <Link to={`/c/${c.id}`}>{c.title}</Link> : seg}
      author={ME}
      note="You"
      where={post.kind !== 'community' && c ? <Link to={`/c/${c.id}`}>{c.title}</Link> : undefined}
      ago={agoLabel(post.at)}
      to={`/posts/${post.id}`}
      title={post.title}
      subtitle={excerpt}
      why={{ kind: 'peer', text: post.kind === 'question' ? 'Your question · sent first to people who made this move' : seg ? `You published this · shown first to people on ${seg}` : 'You published this' }}
      thumb={post.image ? <img src={post.image} alt="" /> : undefined}
      thumbKind="photo"
      variant={post.kind === 'story' ? 'story' : undefined}
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
  const posts = useWriting((s) => s.posts);
  const mine = posts.filter((p) => p.kind === kind).map((p, i) => <MyPostItem key={p.id} post={p} i={i} />);
  const items = [...mine, ...kindItems(kind, joined)];
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
