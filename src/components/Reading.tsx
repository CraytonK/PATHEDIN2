import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { communities } from '../data/communities';
import { people, ME } from '../data/people';
import type { Story, StoryResponse } from '../data/types';
import { pathMatch, relationTo } from '../lib/relations';
import { haptic, springs } from '../lib/motion';
import { useApp } from '../lib/store';
import { useUI } from '../lib/ui';
import { Sheet } from './chrome';
import { PathHint } from './path/PathHint';
import { Avatar, Button, Helpful, PersonName, RelationTag } from './ui';
import { IconCheck, IconChevronDown, IconClose, IconMessage, IconPlus } from './icons';
import './reading.css';

/*
  Reading a story, the way Medium makes it feel:
  - the passage readers on this route marked most is washed in navy, with a count in the margin;
  - selecting text raises a dark pill: Highlight · Respond · Ask the author · Share;
  - responses open in a drawer that slides in on a long, soft curve;
  - topic pills above the title, each with a + to join.
*/

/* ── Topic pills ─────────────────────────────────────────────── */

export function TopicPills({ ids }: { ids: string[] }) {
  const joined = useApp((s) => s.joined);
  const toggle = useApp((s) => s.toggleJoin);
  return (
    <div className="topics">
      {ids.map((id) => {
        const c = communities[id];
        if (!c) return null;
        const on = !!joined[id];
        return (
          <span key={id} className={`topic ${on ? 'is-on' : ''}`}>
            <Link to={`/c/${id}`} className="topic__name">
              {c.title}
            </Link>
            <button
              type="button"
              className="topic__join"
              aria-pressed={on}
              aria-label={on ? `Joined ${c.title}` : `Join ${c.title}`}
              data-tip={on ? 'Joined' : 'Join this community'}
              onClick={() => {
                haptic(6);
                toggle(id);
              }}
            >
              {on ? <IconCheck size={13} strokeWidth={2.6} /> : <IconPlus size={14} strokeWidth={2.2} />}
            </button>
          </span>
        );
      })}
    </div>
  );
}

/* ── The story text, with highlights ─────────────────────────── */

type Span = { start: number; end: number; kind: 'top' | 'mine' };

function spansFor(p: string, top: Story['topHighlight'], mine: string[]): Span[] {
  const ours: Span[] = [];
  for (const t of mine) {
    const i = p.indexOf(t);
    if (i >= 0) ours.push({ start: i, end: i + t.length, kind: 'mine' });
  }
  ours.sort((a, b) => a.start - b.start);
  const kept: Span[] = [];
  let end = -1;
  for (const s of ours) {
    if (s.start < end) continue;
    kept.push(s);
    end = s.end;
  }
  if (top) {
    const i = p.indexOf(top.text);
    const t: Span = { start: i, end: i + top.text.length, kind: 'top' };
    // Your own highlight wins where the two overlap.
    if (i >= 0 && !kept.some((s) => s.start < t.end && t.start < s.end)) kept.push(t);
  }
  return kept.sort((a, b) => a.start - b.start);
}

function TopMark({ children, count }: { children: ReactNode; count: number }) {
  const mark = useRef<HTMLElement>(null);
  const [top, setTop] = useState(0);
  useLayoutEffect(() => {
    const el = mark.current;
    const p = el?.parentElement;
    if (!el || !p) return;
    const measure = () => setTop(el.offsetTop);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(p);
    return () => ro.disconnect();
  }, []);
  return (
    <>
      <mark ref={mark} className="hl hl--top">
        {children}
      </mark>
      <span className="hl__count" style={{ top }} data-tip={`Top highlight · ${count} on this route marked it`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m9 15 7.5-7.5a2.1 2.1 0 0 0-3-3L6 12l-1 4z" />
          <path d="M4 20h7" />
        </svg>
        <span className="visually-hidden">Top highlight: {count} people on this route marked this passage.</span>
        <span aria-hidden="true">{count}</span>
      </span>
    </>
  );
}

function Marked({ text, spans, count }: { text: string; spans: Span[]; count?: number }) {
  const out: ReactNode[] = [];
  let i = 0;
  spans.forEach((s, k) => {
    if (s.start > i) out.push(text.slice(i, s.start));
    const inner = text.slice(s.start, s.end);
    out.push(
      s.kind === 'top' ? (
        <TopMark key={k} count={count ?? 0}>
          {inner}
        </TopMark>
      ) : (
        <mark key={k} className="hl hl--mine">
          {inner}
        </mark>
      ),
    );
    i = s.end;
  });
  out.push(text.slice(i));
  return <>{out}</>;
}

export function StoryText({ story, onRespond }: { story: Story; onRespond: (quote: string) => void }) {
  const body = useRef<HTMLDivElement>(null);
  const mine = useApp((s) => s.highlights[story.id]) ?? [];
  return (
    <>
      <div className="story__body" ref={body}>
        {story.body.map((p, i) => {
          const pull = p.startsWith('> ');
          const text = pull ? p.slice(2) : p;
          const spans = spansFor(text, story.topHighlight, mine);
          const hasTop = spans.some((s) => s.kind === 'top');
          const content = <Marked text={text} spans={spans} count={story.topHighlight?.count} />;
          return pull ? (
            <blockquote key={i} className={`story__pull t-serif ${hasTop ? 'has-top' : ''}`}>
              {content}
            </blockquote>
          ) : (
            <p key={i} className={`story__p t-serif ${hasTop ? 'has-top' : ''}`}>
              {content}
            </p>
          );
        })}
      </div>
      <SelectionToolbar scope={body} story={story} onRespond={onRespond} />
    </>
  );
}

/* ── Selection toolbar ───────────────────────────────────────── */

interface Sel {
  text: string;
  x: number;
  y: number;
  below: boolean;
}

function SelectionToolbar({ scope, story, onRespond }: { scope: React.RefObject<HTMLDivElement | null>; story: Story; onRespond: (quote: string) => void }) {
  const [sel, setSel] = useState<Sel | null>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [shift, setShift] = useState(0);
  const mine = useApp((s) => s.highlights[story.id]) ?? [];
  const toggleHighlight = useApp((s) => s.toggleHighlight);
  const openRequest = useUI((s) => s.openRequest);
  const toast = useUI((s) => s.showToast);
  const author = people[story.author];

  useEffect(() => {
    let down = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const read = () => {
      const s = window.getSelection();
      if (!s || s.isCollapsed || !s.rangeCount) return setSel(null);
      const range = s.getRangeAt(0);
      if (!scope.current?.contains(range.commonAncestorContainer)) return setSel(null);
      const text = s.toString().replace(/[ \t]+/g, ' ').trim();
      if (text.length < 3) return setSel(null);
      const r = range.getBoundingClientRect();
      // On touch screens the system menu sits above a selection, so ours goes below it.
      const below = window.matchMedia('(pointer: coarse)').matches;
      setSel({ text, x: r.left + r.width / 2 + window.scrollX, y: (below ? r.bottom + 12 : r.top - 12) + window.scrollY, below });
    };
    const onDown = (e: PointerEvent) => {
      if (bar.current?.contains(e.target as Node)) return;
      down = true;
      setSel(null);
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      clearTimeout(timer);
      timer = setTimeout(read, 10);
    };
    const onChange = () => {
      if (down) return;
      clearTimeout(timer);
      timer = setTimeout(read, 220);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSel(null);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('selectionchange', onChange);
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('selectionchange', onChange);
      document.removeEventListener('keydown', onKey);
    };
  }, [scope]);

  // Keep the pill on screen when the selection runs to an edge.
  useLayoutEffect(() => {
    if (!sel || !bar.current) return setShift(0);
    const w = bar.current.offsetWidth;
    const left = sel.x - window.scrollX - w / 2;
    const right = left + w;
    setShift(left < 12 ? 12 - left : right > window.innerWidth - 12 ? window.innerWidth - 12 - right : 0);
  }, [sel]);

  const done = () => {
    window.getSelection()?.removeAllRanges();
    setSel(null);
  };
  const pieces = (t: string) =>
    t
      .split(/\n+/)
      .map((x) => x.trim())
      .filter((x) => x.length > 2);
  const already = sel ? pieces(sel.text).every((t) => mine.includes(t)) : false;

  const actions: { key: string; label: string; run: () => void }[] = sel
    ? [
        {
          key: 'highlight',
          label: already ? 'Remove highlight' : 'Highlight',
          run: () => {
            haptic(8);
            for (const t of pieces(sel.text)) if (already || !mine.includes(t)) toggleHighlight(story.id, t);
            done();
          },
        },
        {
          key: 'respond',
          label: 'Respond',
          run: () => {
            onRespond(sel.text);
            done();
          },
        },
        ...(story.author !== ME
          ? [
              {
                key: 'ask',
                label: `Ask ${author.first}`,
                run: () => {
                  openRequest(story.author, story.segment, sel.text);
                  done();
                },
              },
            ]
          : []),
        {
          key: 'share',
          label: 'Share',
          run: () => {
            try {
              navigator.clipboard?.writeText(`“${sel.text}” — ${author.name}, on PathedIn\n${window.location.href}`);
            } catch {
              /* ignore */
            }
            toast('Quote copied');
            done();
          },
        },
      ]
    : [];

  return createPortal(
    <AnimatePresence>
      {sel && (
        <motion.div
          ref={bar}
          key="selbar"
          className={`selbar ${sel.below ? 'is-below' : ''}`}
          style={{ left: sel.x + shift, top: sel.y }}
          role="toolbar"
          aria-label="Selected text"
          initial={{ opacity: 0, scale: 0.92, y: sel.below ? -4 : 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.1 } }}
          transition={springs.snappy}
          // Keep the selection alive while pressing a button.
          onPointerDown={(e) => e.preventDefault()}
        >
          {actions.map((a) => (
            <button key={a.key} type="button" className="selbar__btn" onClick={a.run}>
              {a.label}
            </button>
          ))}
          <span className="selbar__caret" style={{ marginLeft: -shift }} aria-hidden="true" />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ── Responses ───────────────────────────────────────────────── */

type Sort = 'closest' | 'recent';

function agoDays(ago: string): number {
  const m = /(\d+)\s*(mo|m|h|d|w|y)/.exec(ago);
  if (!m) return 0;
  const n = +m[1];
  return { h: n / 24, m: n / 1440, d: n, w: n * 7, mo: n * 30, y: n * 365 }[m[2] as 'h'] ?? n;
}

export function responseCount(story: Story, mineCount: number) {
  return (story.responses?.length ?? 0) + mineCount;
}

export function ResponsesSheet({ story, open, onClose, quote, onClearQuote }: { story: Story; open: boolean; onClose: () => void; quote?: string; onClearQuote: () => void }) {
  const mine = useApp((s) => s.myResponses[story.id]) ?? [];
  const add = useApp((s) => s.addResponse);
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const [sort, setSort] = useState<Sort>('closest');
  const [menu, setMenu] = useState(false);
  const field = useRef<HTMLTextAreaElement>(null);
  const total = responseCount(story, mine.length);

  useEffect(() => {
    if (open && quote) setTimeout(() => field.current?.focus(), 350);
  }, [open, quote]);

  const list = useMemo(() => {
    const r = [...(story.responses ?? [])];
    return sort === 'closest' ? r.sort((a, b) => pathMatch(b.author) - pathMatch(a.author)) : r.sort((a, b) => agoDays(a.ago) - agoDays(b.ago));
  }, [story.responses, sort]);

  const expanded = focused || !!text || !!quote;
  const submit = () => {
    if (!text.trim()) return;
    haptic([8, 30, 8]);
    add(story.id, { body: text.trim(), quote });
    setText('');
    onClearQuote();
    field.current?.blur();
  };

  return (
    <Sheet open={open} onClose={onClose} desktop="side" width={414} title={`Responses (${total})`} label="Responses">
      <div className="resp">
        <div className={`resp__composer ${expanded ? 'is-open' : ''}`}>
          <div className="resp__me">
            <Avatar id={ME} size={32} peek={false} />
            <span>{people[ME].name}</span>
          </div>
          {quote && (
            <blockquote className="resp__quote">
              <span>{quote}</span>
              <button type="button" className="resp__quote-x" aria-label="Remove quote" onClick={onClearQuote}>
                <IconClose size={12} strokeWidth={2.4} />
              </button>
            </blockquote>
          )}
          <textarea
            ref={field}
            className="resp__field"
            rows={expanded ? 4 : 1}
            placeholder="What are your thoughts?"
            value={text}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
            }}
          />
          {expanded && (
            <div className="resp__composer-foot">
              <span className="resp__note">Shown with your Path</span>
              <button
                type="button"
                className="resp__cancel"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setText('');
                  onClearQuote();
                  field.current?.blur();
                }}
              >
                Cancel
              </button>
              <Button variant="filled" size="small" disabled={!text.trim()} onMouseDown={(e) => e.preventDefault()} onClick={submit}>
                Respond
              </Button>
            </div>
          )}
        </div>

        {total > 0 && (
          <div className="resp__sort">
            <button type="button" className="resp__sort-btn" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
              {sort === 'closest' ? 'Closest to your Path' : 'Most recent'}
              <IconChevronDown size={13} strokeWidth={2.6} />
            </button>
            <AnimatePresence>
              {menu && (
                <motion.div
                  className="resp__sort-menu"
                  role="menu"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  transition={springs.snappy}
                >
                  {(['closest', 'recent'] as Sort[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      role="menuitemradio"
                      aria-checked={sort === k}
                      onClick={() => {
                        setSort(k);
                        setMenu(false);
                      }}
                    >
                      <span className="resp__tick">{sort === k && <IconCheck size={14} strokeWidth={2.6} />}</span>
                      {k === 'closest' ? 'Closest to your Path' : 'Most recent'}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {total === 0 && <p className="resp__empty">No responses yet. People on this route will see yours first.</p>}

        <ol className="resp__list">
          {mine.map((r) => (
            <li key={r.at} className="resp__item is-mine">
              <div className="resp__who">
                <Avatar id={ME} size={32} peek={false} />
                <div>
                  <p className="resp__name">
                    <strong>You</strong> <span className="c-2">· Just now</span>
                  </p>
                  <PathHint id={ME} />
                </div>
              </div>
              {r.quote && <blockquote className="resp__quote">{r.quote}</blockquote>}
              <p className="resp__body">{r.body}</p>
            </li>
          ))}
          {list.map((r) => (
            <ResponseItem key={r.id} r={r} story={story} />
          ))}
        </ol>
      </div>
    </Sheet>
  );
}

function ResponseItem({ r, story }: { r: StoryResponse; story: Story }) {
  const rel = relationTo(r.author);
  return (
    <li className="resp__item">
      <div className="resp__who">
        <Avatar id={r.author} size={32} />
        <div>
          <p className="resp__name">
            <PersonName id={r.author} /> <span className="c-2">· {r.ago}</span>
          </p>
          <div className="resp__meta">
            {rel.kind !== 'other' && rel.kind !== 'self' && <RelationTag kind={rel.kind} label={rel.label} />}
            <PathHint id={r.author} segment={story.segment} />
          </div>
        </div>
      </div>
      {r.quote && <blockquote className="resp__quote">{r.quote}</blockquote>}
      <p className="resp__body">{r.body}</p>
      <div className="resp__actions">
        <Helpful helpKey={`response:${r.id}`} count={r.helpful} compact />
      </div>
    </li>
  );
}

/* ── The action bar, and its phone dock ──────────────────────── */

export function RespondButton({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button type="button" className="respond-btn" aria-label={`Responses, ${count}`} data-tip="Responses" onClick={onClick}>
      <IconMessage size={22} strokeWidth={1.5} />
      <span className="t-num">{count}</span>
    </button>
  );
}
