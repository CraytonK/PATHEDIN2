import { AnimatePresence, motion, useInView, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { TabBar, TopBar } from '../components/chrome';
import { Home } from './Home';
import { PathLens } from '../components/path/PathLens';
import { AlignMap, compareSummary } from '../components/path/Compare';
import { RouteSilk } from '../components/path/RouteSilk';
import { DecisionPost, GuidePost, MilestonePost, QuestionPost, RoutePost, StoryPost, ThreadPost } from '../components/FeedItems';
import { postKinds, type PostKind } from '../components/Post';
import { Stars } from '../components/Booking';
import { IconArrowRight, IconCheck } from '../components/icons';
import { Rolling } from '../components/ui';
import { people, me } from '../data/people';
import { wp } from '../data/waypoints';
import { stories } from '../data/stories';
import { questions } from '../data/questions';
import { decisions } from '../data/decisions';
import { threads } from '../data/communities';
import { destinations } from '../data/destinations';
import { compactSteps, relationCopy, relationTo, type RelationKind } from '../lib/relations';
import { PLATFORM_FEE, economyOf, fmtMoney, payout, priceLabel, serviceKinds, servicesOf, topStanding } from '../lib/guides';
import { springs, useIsMobile } from '../lib/motion';
import './landing-tour.css';

/*
  The tour under the intro. Scrolling the page is walking a Path: one line runs down the page and draws
  itself as you read, and each part of PathedIn is a station on it that lights as you reach it. Every
  station shows the real product, built from the app's own components and the sample network, and most
  of them answer to your hand. The line ends where the page does, at a destination: the invitation to start.
*/

const ease = [0.16, 1, 0.3, 1] as const;

/* ── The line, and its stations ──────────────────────────────── */

type NodeKind = 'walked' | 'now' | 'dest';

function Station({ kind = 'walked', title, children, id }: { kind?: NodeKind; title: string; children?: ReactNode; id?: string }) {
  const ref = useRef<HTMLElement>(null);
  const reached = useInView(ref, { once: true, margin: '0px 0px -40% 0px' });
  const reduce = useReducedMotion();
  const words = title.split(' ');
  return (
    <header ref={ref} id={id} className={`tstation ${reached ? 'is-reached' : ''}`}>
      <span className={`tstation__node is-${kind}`} aria-hidden="true">
        <span className="tstation__core" />
      </span>
      <h2 className="tstation__title" aria-label={title}>
        {words.map((w, i) => (
          <motion.span
            key={`${w}-${i}`}
            className="tstation__word"
            aria-hidden="true"
            initial={reduce ? false : { opacity: 0, y: 18, filter: 'blur(6px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
            viewport={{ once: true, margin: '-12% 0px' }}
            transition={{ duration: 0.7, delay: Math.min(i, 8) * 0.05, ease }}
          >
            {w}
          </motion.span>
        ))}
      </h2>
      {children && (
        <motion.p
          className="tstation__sub"
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-12% 0px' }}
          transition={{ duration: 0.7, delay: 0.25, ease }}
        >
          {children}
        </motion.p>
      )}
    </header>
  );
}

/* ── 1. What it looks like: the app itself, rising out of a tilt ── */

function useBox<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

function Preview() {
  const isMobile = useIsMobile();
  const reduce = useReducedMotion();
  const [wrap, width] = useBox<HTMLDivElement>();
  const near = useInView(wrap, { once: true, margin: '500px 0px' });
  const { scrollYProgress } = useScroll({ target: wrap, offset: ['start end', 'start 20%'] });
  const p = useSpring(scrollYProgress, { stiffness: 110, damping: 26 });
  const rotateX = useTransform(p, [0, 1], [22, 0]);
  const scale = useTransform(p, [0, 1], [0.88, 1]);
  const y = useTransform(p, [0, 1], [70, 0]);
  const glow = useTransform(p, [0, 1], [0, 1]);
  // The app is laid out at a real screen size, then scaled to fit, so it looks exactly as it does in use.
  const virtual = isMobile ? { w: 390, h: 760 } : { w: 1440, h: 880 };
  const k = width ? Math.min(1, width / virtual.w) : 0;
  return (
    <section className="tour__sec tour__sec--preview" aria-labelledby="tour-home">
      <Station title="Everything on your Path, in one place" id="tour-home">
        Your week, your Path, the people worth knowing, and a feed that says why each post is there.
      </Station>
      <div className="tour-frame-wrap" ref={wrap} style={{ height: k ? virtual.h * k + (isMobile ? 0 : 34) : undefined }}>
        <motion.div className={`tour-frame ${isMobile ? 'is-phone' : ''}`} style={reduce ? undefined : { rotateX, scale, y }}>
          <motion.span className="tour-frame__glow" aria-hidden="true" style={{ opacity: reduce ? 1 : glow }} />
          {!isMobile && (
            <div className="tour-frame__bar" aria-hidden="true">
              <i />
              <i />
              <i />
              <span>pathedin.app</span>
            </div>
          )}
          <div className="tour-frame__clip" style={{ height: k ? virtual.h * k : undefined }}>
            {/* A picture of the product: it can't be focused or clicked, and screen readers skip it. */}
            <div className="tour-frame__view" aria-hidden="true" inert style={{ width: virtual.w, height: virtual.h, transform: `scale(${k})` }}>
              {near && k > 0 && (
                <div className={`app ${isMobile ? 'app--mobile' : 'app--desktop'}`}>
                  {!isMobile && <TopBar />}
                  <Home />
                  {isMobile && <TabBar />}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ── 2. Your Path, drawn as you scroll ─────────────────────────── */

const routeY = [-1, 0, 1];

function useRange(p: MotionValue<number>, a: number, b: number) {
  return useTransform(p, [a, b], [0, 1], { clamp: true });
}

function PathStory() {
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  const box = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: box, offset: ['start start', 'end end'] });
  const p = useSpring(scrollYProgress, { stiffness: 140, damping: 30 });
  const [phase, setPhase] = useState<0 | 1 | 2>(reduce ? 2 : 0);
  useMotionValueEvent(p, 'change', (v) => setPhase(v < 0.36 ? 0 : v < 0.56 ? 1 : 2));

  const steps = compactSteps(me.path);
  const future = me.futures[0];
  const routes = future.routes ?? [];
  // Across on a wide screen; top to bottom on a phone, so every label stays readable.
  const v = isMobile;
  const W = v ? 400 : 1000;
  const H = v ? 860 : 520;
  const fs = v ? 20 : 21;
  const st = v ? [60, 170, 280].map((y) => ({ x: 200, y })) : [60, 215, 370].map((x) => ({ x, y: 260 }));
  const inter = v ? { x: 200, y: 390 } : { x: 500, y: 260 };
  const dest = v ? { x: 200, y: 780 } : { x: 930, y: 260 };
  const lane = (i: number) => (v ? { x: [66, 200, 334][i], y: 590 } : { x: 710, y: 260 + routeY[i] * 135 });
  const lanePath = (i: number) => {
    const l = lane(i);
    return v
      ? `M ${inter.x} ${inter.y} C ${inter.x} ${inter.y + 60}, ${l.x} ${inter.y + 50}, ${l.x} ${inter.y + 110} L ${l.x} ${l.y + 70} C ${l.x} ${l.y + 140}, ${dest.x} ${dest.y - 90}, ${dest.x} ${dest.y}`
      : `M ${inter.x} ${inter.y} C ${inter.x + 90} ${inter.y}, ${inter.x + 60} ${l.y}, ${inter.x + 150} ${l.y} L ${l.x + 60} ${l.y} C ${l.x + 140} ${l.y}, ${dest.x - 110} ${dest.y}, ${dest.x} ${dest.y}`;
  };
  const shortRoute: Record<string, string> = { 'via-cro': 'Via a CRO', 'via-process': 'Into industry', 'via-phd': 'PhD first' };
  const youAt = v ? { x: st[2].x - 78, y: st[2].y } : { x: st[2].x, y: st[2].y - 56 };
  const walk = useRange(p, 0.04, 0.34);
  const stop = [useRange(p, 0.03, 0.08), useRange(p, 0.18, 0.23), useRange(p, 0.33, 0.38)];
  const you = useRange(p, 0.36, 0.44);
  const ask = useRange(p, 0.44, 0.5);
  const lanes = [useRange(p, 0.5, 0.72), useRange(p, 0.55, 0.77), useRange(p, 0.6, 0.82)];
  const arrive = useRange(p, 0.82, 0.9);
  const full = useTransform(p, () => 1);
  const pick = (m: MotionValue<number>) => (reduce ? full : m);

  const captions = [
    { h: 'Where you’ve been', t: `Every step so far, drawn as a line: ${steps.map((s) => wp(s.wp).label).join(', then ')}.` },
    { h: 'Where you are', t: 'You, at the step you’re on now, with everyone else standing there beside you.' },
    { h: 'Where you could go', t: `Not a guess. The routes people actually took to ${wp(future.destination).label}, and how many took each.` },
  ];

  return (
    <section className="tour__sec" aria-labelledby="tour-path">
      <Station title="Your career, drawn as a line" id="tour-path">
        Where you’ve been, where you are, and every real route to where you want to go.
      </Station>
      <div className={`pstory ${reduce ? 'is-static' : ''}`} ref={box}>
        <div className="pstory__stage">
          <div className="pstory__caption" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={phase} initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -10, transition: { duration: 0.15 } }} transition={{ duration: 0.45, ease }}>
                <p className="pstory__h">{captions[phase].h}</p>
                <p className="pstory__t">{captions[phase].t}</p>
              </motion.div>
            </AnimatePresence>
            <ol className="pstory__dots" aria-hidden="true">
              {captions.map((c, i) => (
                <li key={c.h} className={i <= phase ? 'is-on' : ''} />
              ))}
            </ol>
          </div>
          <svg className="pstory__svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Maya’s Path: ${steps.map((s) => wp(s.wp).label).join(', ')}, then three routes to ${wp(future.destination).label}`}>
            <defs>
              <clipPath id="pstory-you">
                <circle cx={youAt.x} cy={youAt.y} r={27} />
              </clipPath>
            </defs>
            {/* The track still to walk, faint; the walked part inks in over it. */}
            <line x1={st[0].x} y1={st[0].y} x2={inter.x} y2={inter.y} stroke="var(--label-4)" strokeWidth={3} strokeLinecap="round" />
            <motion.line x1={st[0].x} y1={st[0].y} x2={st[2].x} y2={st[2].y} stroke="var(--ink)" strokeWidth={7} strokeLinecap="round" style={{ pathLength: pick(walk) }} />
            <motion.line x1={st[2].x} y1={st[2].y} x2={inter.x} y2={inter.y} stroke="var(--tint)" strokeWidth={3} strokeDasharray="3 7" strokeLinecap="round" style={{ opacity: pick(ask) }} />
            {/* Routes out of the interchange, each to the same destination. */}
            {routes.map((r, i) => {
              const l = lane(i);
              return (
                <g key={r.id}>
                  {/* The route is dashed, as the future always is; a mask draws it in without losing the dashes. */}
                  <mask id={`pstory-lane-${i}`} maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
                    <motion.path d={lanePath(i)} fill="none" stroke="#fff" strokeWidth={12} strokeLinecap="butt" style={{ pathLength: pick(lanes[i]) }} />
                  </mask>
                  <path d={lanePath(i)} fill="none" stroke="var(--tint)" strokeWidth={3} strokeDasharray="4 7" strokeLinecap="round" mask={`url(#pstory-lane-${i})`} />
                  <motion.g style={{ opacity: pick(lanes[i]) }}>
                    <circle cx={l.x} cy={l.y} r={9} fill="var(--bg)" stroke="var(--tint)" strokeWidth={3.5} />
                    <text x={l.x} y={l.y - 22} textAnchor="middle" className="pstory__lbl pstory__halo" fontSize={fs * 0.9}>
                      {v ? (shortRoute[r.id] ?? r.label) : r.label}
                    </text>
                    <text x={l.x} y={l.y + 36} textAnchor="middle" className="pstory__share pstory__halo" fontSize={fs * 0.9}>
                      {Math.round(r.share * 100)}%{v ? '' : ` · ${r.people} people`}
                    </text>
                  </motion.g>
                </g>
              );
            })}
            {/* The interchange: the undecided next step. */}
            <motion.g style={{ opacity: pick(ask), scale: pick(ask), transformOrigin: `${inter.x}px ${inter.y}px` }}>
              <circle cx={inter.x} cy={inter.y} r={18} fill="var(--bg)" stroke="var(--tint)" strokeWidth={3.5} strokeDasharray="4 4" />
              <text x={inter.x} y={inter.y + fs * 0.36} textAnchor="middle" className="pstory__q" fontSize={fs}>
                ?
              </text>
            </motion.g>
            {/* Walked stations. */}
            {steps.map((s, i) => (
              <motion.g key={s.wp} style={{ opacity: pick(stop[i]), scale: pick(stop[i]), transformOrigin: `${st[i].x}px ${st[i].y}px` }}>
                {i < 2 ? <circle cx={st[i].x} cy={st[i].y} r={12} fill="var(--ink)" /> : <circle cx={st[i].x} cy={st[i].y} r={15} fill="var(--bg)" stroke="var(--ink)" strokeWidth={5} />}
                <text x={v ? st[i].x + 34 : st[i].x} y={v ? st[i].y + 2 : st[i].y + 48} textAnchor={v ? 'start' : 'middle'} className="pstory__lbl is-strong" fontSize={fs}>
                  {wp(s.wp).short}
                </text>
                <text x={v ? st[i].x + 34 : st[i].x} y={v ? st[i].y + 26 : st[i].y + 72} textAnchor={v ? 'start' : 'middle'} className="pstory__yr" fontSize={fs * 0.82}>
                  {s.end ? `${s.start}–${s.end}` : `${s.start} – now`}
                </text>
              </motion.g>
            ))}
            {/* You. */}
            <motion.g style={{ opacity: pick(you), scale: pick(you), transformOrigin: `${youAt.x}px ${youAt.y}px` }}>
              <circle cx={youAt.x} cy={youAt.y} r={31} fill="var(--tint)" />
              <image href={me.photo} x={youAt.x - 27} y={youAt.y - 27} width={54} height={54} clipPath="url(#pstory-you)" preserveAspectRatio="xMidYMid slice" />
              <text x={youAt.x} y={youAt.y - 42} textAnchor="middle" className="pstory__you" fontSize={fs * 0.82}>
                You are here
              </text>
            </motion.g>
            {/* The destination. */}
            <motion.g style={{ opacity: pick(arrive), scale: pick(arrive), transformOrigin: `${dest.x}px ${dest.y}px` }}>
              <circle cx={dest.x} cy={dest.y} r={18} fill="var(--bg)" stroke="var(--tint)" strokeWidth={5} />
              <text x={dest.x} y={dest.y + 50} textAnchor="middle" className="pstory__lbl is-dest" fontSize={fs}>
                {wp(future.destination).short}
              </text>
            </motion.g>
          </svg>
        </div>
      </div>
    </section>
  );
}

/* ── 3. The people on it ──────────────────────────────────────── */

type LensKind = Exclude<RelationKind, 'self' | 'other' | 'behind'>;
const lensKinds: LensKind[] = ['twin', 'peer', 'ahead', 'guide', 'explorer'];

function People({ onJoin }: { onJoin: () => void }) {
  const [box, width] = useBox<HTMLDivElement>();
  const shown = useInView(box, { once: true, margin: '-15% 0px' });
  const [filter, setFilter] = useState<LensKind | 'all'>('all');
  // On a narrow screen the lens scrolls sideways; start it with you in view.
  useEffect(() => {
    const el = box.current;
    if (!shown || !el) return;
    const t = setTimeout(() => {
      if (el.scrollWidth > el.clientWidth) el.scrollLeft = (el.scrollWidth - el.clientWidth) * 0.38;
    }, 60);
    return () => clearTimeout(t);
  }, [shown, box]);
  return (
    <section className="tour__sec" aria-labelledby="tour-people">
      <Station title="Meet the people who’ve walked it" id="tour-people">
        Path Twins beside you, Peers at your step, people a step ahead, and Guides who already reached where you’re going.
      </Station>
      <div className="tour-card tour-people">
        <div className="tour-chips" role="tablist" aria-label="Who to show">
          {(['all', ...lensKinds] as const).map((k) => (
            <button key={k} type="button" role="tab" aria-selected={filter === k} className={`tour-chip ${filter === k ? 'is-on' : ''}`} onMouseEnter={() => setFilter(k)} onFocus={() => setFilter(k)} onClick={() => setFilter(k)}>
              {filter === k && <motion.span layoutId="tour-chip" className="tour-chip__fill" transition={springs.snappy} />}
              <span>{k === 'all' ? 'Everyone' : relationCopy[k].plural}</span>
            </button>
          ))}
        </div>
        <p className="tour-people__blurb">{filter === 'all' ? 'Everyone on your Path, placed where they stand on it. Choose a face to meet them.' : relationCopy[filter].blurb}</p>
        {/* Choosing a face asks you to join, rather than opening a profile you can't see yet. */}
        <div
          className="tour-people__lens"
          ref={box}
          onClickCapture={(e) => {
            if ((e.target as Element).closest('.lens__face')) {
              e.preventDefault();
              e.stopPropagation();
              onJoin();
            }
          }}
        >
          {shown && width > 0 && <PathLens filter={filter} width={width} />}
        </div>
      </div>
    </section>
  );
}

/* ── 4. Align Paths ────────────────────────────────────────────── */

const alignWith = ['sarah', 'jonah', 'daniel', 'amara'];

function Align() {
  const box = useRef<HTMLDivElement>(null);
  const shown = useInView(box, { once: true, margin: '-20% 0px' });
  const [who, setWho] = useState(alignWith[0]);
  const summary = compareSummary(who);
  return (
    <section className="tour__sec" aria-labelledby="tour-align">
      <Station title="See exactly where your Paths meet" id="tour-align">
        Align your Path with anyone’s. They slide together, and the steps you share become one line.
      </Station>
      <div className="tour-card tour-align" ref={box}>
        <div className="tour-align__side">
          <div className="tour-align__who" role="radiogroup" aria-label="Align with">
            {alignWith.map((id) => (
              <button key={id} type="button" role="radio" aria-checked={who === id} className={`tour-person ${who === id ? 'is-on' : ''}`} onClick={() => setWho(id)}>
                <img src={people[id].photo} alt="" />
                <span>
                  <strong>{people[id].first}</strong>
                  <span>{relationTo(id).label}</span>
                </span>
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={who} className="tour-align__lines" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={{ duration: 0.4, ease }}>
              {summary.lines.slice(0, 2).map((l) => (
                <p key={l}>{l}</p>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="tour-align__map">{shown && <AlignMap key={who} otherId={who} />}</div>
      </div>
    </section>
  );
}

/* ── 5. The feed: every post says what it is and why it's there ── */

const tourKinds: PostKind[] = ['milestone', 'question', 'community', 'guide', 'story', 'decision', 'route'];

function TourPost({ kind }: { kind: PostKind }) {
  switch (kind) {
    case 'story':
      return <StoryPost s={stories['elena-cro']} why={{ kind: 'ahead', text: 'A story from the route you’re considering' }} />;
    case 'question':
      return <QuestionPost q={questions['q-cro-trap']} why={{ kind: 'peer', text: 'Your question · answered by people ahead of you' }} />;
    case 'community':
      return <ThreadPost t={threads.find((t) => t.id === 't-cro-interview')!} why={{ kind: 'ahead', text: 'About your next step' }} />;
    case 'guide':
      return <GuidePost id="amara" move={['cro-analytical', 'pharma-rnd']} why={{ kind: 'guide', text: 'A Guide for the route you’re leaning towards' }} />;
    case 'decision':
      return <DecisionPost d={decisions['d-jonah-offers']} why={{ kind: 'twin', text: 'Jonah is facing your exact decision' }} />;
    case 'route':
      return <RoutePost dest="pharma-rnd" route={destinations['pharma-rnd'].routes.find((r) => r.id === 'via-intern')!} why={{ kind: 'explorer', text: 'A route to your destination you haven’t added' }} />;
    default:
      return <MilestonePost id="elena" reached="pharma-rnd" ago="3w" words="Three weeks in. If you’re at the CRO step, set yourself a date and tell someone ahead of you what it is." why={{ kind: 'guide', text: 'Reached your destination' }} />;
  }
}

function Feed() {
  const box = useRef<HTMLDivElement>(null);
  const visible = useInView(box, { margin: '-25% 0px' });
  const reduce = useReducedMotion();
  const [k, setK] = useState(0);
  const [held, setHeld] = useState(false);
  const [paused, setPaused] = useState(false);
  const playing = visible && !held && !paused && !reduce;
  // It turns through the kinds on its own while you watch, waits while you point at it or tab through it,
  // and stops for good once you choose one.
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setK((x) => (x + 1) % tourKinds.length), 4200);
    return () => clearInterval(t);
  }, [playing]);
  const kind = tourKinds[k];
  return (
    <section className="tour__sec" aria-labelledby="tour-feed">
      <Station title="Every post says why it’s in your feed" id="tour-feed">
        Stories, questions, conversations and decisions from people on and around your Path, each marked with what it is.
      </Station>
      <div
        className="tour-feed"
        ref={box}
        onPointerEnter={(e) => e.pointerType === 'mouse' && setPaused(true)}
        onPointerLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setPaused(false)}
      >
        <div className="tour-feed__kinds" role="tablist" aria-label="Kinds of post">
          {tourKinds.map((kd, i) => {
            const K = postKinds[kd];
            const Icon = K.icon;
            return (
              <button
                key={kd}
                type="button"
                role="tab"
                aria-selected={i === k}
                className={`tour-kind ${i === k ? 'is-on' : ''}`}
                onClick={() => {
                  setHeld(true);
                  setK(i);
                }}
              >
                {i === k && <motion.span layoutId="tour-kind" className="tour-kind__fill" transition={springs.snappy} />}
                <Icon size={16} strokeWidth={1.9} />
                <span>{K.label}</span>
                {i === k && playing && <motion.i className="tour-kind__timer" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 4.2, ease: 'linear' }} />}
              </button>
            );
          })}
        </div>
        <div className="tour-feed__stage">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={kind}
              className="tour-feed__post"
              inert
              initial={{ opacity: 0, y: 24, scale: 0.97, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
              exit={{ opacity: 0, y: -16, scale: 0.98, transition: { duration: 0.18 } }}
              transition={{ duration: 0.55, ease }}
            >
              <TourPost kind={kind} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ── 6. Path Guides: book one, or become one ──────────────────── */

function Guides({ onJoin }: { onJoin: () => void }) {
  const guide = 'amara';
  const g = people[guide];
  const econ = economyOf(guide)!;
  const services = servicesOf(guide);
  const [svc, setSvc] = useState(services[1]?.id ?? services[0].id);
  const chosen = services.find((s) => s.id === svc)!;
  const [price, setPrice] = useState(60);
  const [count, setCount] = useState(8);
  const gross = price * count;
  const keep = Math.round(payout(gross));
  const next = new Date();
  next.setDate(next.getDate() + ((4 - next.getDay() + 7) % 7 || 7));
  return (
    <section className="tour__sec" aria-labelledby="tour-guides" id="guides">
      <Station title="Learn from people who made the move" id="tour-guides">
        Path Guides help with the moves on their own Path. Office Hours are free; calls, reviews and mentorship are priced by each Guide.
      </Station>
      <div className="tour-guides">
        <div className="tour-card tour-book">
          <div className="tour-book__who">
            <img src={g.photo} alt="" />
            <span>
              <strong>{g.name}</strong>
              <span>{g.headline}</span>
              <span className="tour-book__rep">
                <Stars value={econ.rating} /> {econ.rating.toFixed(1)} · {econ.reviewCount} reviews
              </span>
            </span>
          </div>
          <p className="tour-book__top">{topStanding(guide)}</p>
          <ul className="tour-book__svcs" role="radiogroup" aria-label={`What ${g.first} offers`}>
            {services.map((s) => {
              const Icon = serviceKinds[s.kind].icon;
              const on = s.id === svc;
              return (
                <li key={s.id}>
                  <button type="button" role="radio" aria-checked={on} className={`tour-svc ${on ? 'is-on' : ''}`} onClick={() => setSvc(s.id)}>
                    {on && <motion.span layoutId="tour-svc" className="tour-svc__fill" transition={springs.snappy} />}
                    <Icon size={16} strokeWidth={1.8} />
                    <span className="tour-svc__t">{s.title}</span>
                    <strong>{priceLabel(s)}</strong>
                  </button>
                </li>
              );
            })}
          </ul>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={svc} className="tour-ticket" initial={{ opacity: 0, y: 16, rotateX: -18 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} exit={{ opacity: 0, y: -8, transition: { duration: 0.14 } }} transition={{ duration: 0.5, ease }}>
              <span className="tour-ticket__stub">
                <span>{next.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                <strong>{next.getDate()}</strong>
                <span>{next.toLocaleDateString('en-US', { month: 'short' })}</span>
              </span>
              <span className="tour-ticket__body">
                <strong>
                  {chosen.title} with {g.first}
                </strong>
                <span>{chosen.minutes ? `${chosen.minutes} minutes` : chosen.delivery} · {priceLabel(chosen)}</span>
              </span>
              <button type="button" className="tour-ticket__cta" onClick={onJoin}>
                Book
              </button>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="tour-earn immersive">
          <h3 className="tour-earn__h">Or guide the moves you’ve made</h3>
          <p className="tour-earn__p">Answer for free, hold free Office Hours, and charge for the rest. PathedIn keeps {Math.round(PLATFORM_FEE * 100)}%.</p>
          <label className="tour-range">
            <span>
              Price per session <strong>${price}</strong>
            </span>
            <input type="range" min={20} max={200} step={5} value={price} onChange={(e) => setPrice(+e.target.value)} style={{ '--p': `${((price - 20) / 180) * 100}%` } as CSSProperties} />
          </label>
          <label className="tour-range">
            <span>
              Sessions a month <strong>{count}</strong>
            </span>
            <input type="range" min={1} max={30} step={1} value={count} onChange={(e) => setCount(+e.target.value)} style={{ '--p': `${((count - 1) / 29) * 100}%` } as CSSProperties} />
          </label>
          <div className="tour-earn__out" aria-live="polite">
            <span>You’d keep</span>
            <strong>
              <Rolling value={keep} format={(n) => `$${n.toLocaleString('en-CA')}`} />
            </strong>
            <span>a month, after PathedIn’s {fmtMoney(Math.round(gross * PLATFORM_FEE))}</span>
          </div>
          <button type="button" className="tour-earn__cta" onClick={onJoin}>
            Become a Path Guide
            <IconArrowRight size={16} strokeWidth={2} data-dir="forward" />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ── 7. The destination ─────────────────────────────────────────── */

function Destination({ onJoin, onSignIn }: { onJoin: () => void; onSignIn: () => void }) {
  return (
    <section className="tour__sec tour__sec--dest" aria-labelledby="tour-dest">
      <Station kind="dest" title="Your path is waiting" id="tour-dest" />
      <div className="tour-dest immersive">
        <RouteSilk lines={26} />
        <p className="tour-dest__p">Map where you’ve been, see where it can go, and meet the people already there.</p>
        <ul className="tour-dest__list">
          {['Your Path, drawn for you', 'People on it, and why they matter', 'Guides who made your moves'].map((t) => (
            <li key={t}>
              <IconCheck size={15} strokeWidth={2.4} />
              {t}
            </li>
          ))}
        </ul>
        <div className="tour-dest__cta">
          <button type="button" className="tour-dest__go" onClick={onJoin}>
            Start your path
          </button>
          <button type="button" className="tour-dest__in" onClick={onSignIn}>
            Sign in
          </button>
        </div>
      </div>
    </section>
  );
}

/* ── The tour ───────────────────────────────────────────────────── */

export function Tour({ onJoin, onSignIn }: { onJoin: () => void; onSignIn: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  // The line runs from the first station to the destination, through the centre of every node.
  useLayoutEffect(() => {
    const root = ref.current;
    const inner = rail.current;
    if (!root || !inner) return;
    const measure = () => {
      const nodes = root.querySelectorAll<HTMLElement>('.tstation__node');
      if (nodes.length < 2) return;
      const box = inner.getBoundingClientRect();
      const a = nodes[0].getBoundingClientRect();
      const z = nodes[nodes.length - 1].getBoundingClientRect();
      inner.style.setProperty('--rail-left', `${a.left + a.width / 2 - box.left - 1.5}px`);
      inner.style.setProperty('--rail-top', `${a.top + a.height / 2 - box.top}px`);
      inner.style.setProperty('--rail-h', `${z.top + z.height / 2 - (a.top + a.height / 2)}px`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
  }, []);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 55%', 'end 85%'] });
  const walked = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  return (
    <div className="tour" ref={ref} id="tour">
      <div className="tour__rail" aria-hidden="true">
        <div className="tour__rail-in" ref={rail}>
          <motion.span className="tour__walked" style={{ scaleY: reduce ? 1 : walked }} />
        </div>
      </div>
      <Preview />
      <PathStory />
      <People onJoin={onJoin} />
      <Align />
      <Feed />
      <Guides onJoin={onJoin} />
      <Destination onJoin={onJoin} onSignIn={onSignIn} />
    </div>
  );
}

