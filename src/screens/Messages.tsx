import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Page } from '../components/chrome';
import { PathStrip } from '../components/path/PathStrip';
import { PathHint } from '../components/path/PathHint';
import { Avatar, Button, PersonName, RelationTag } from '../components/ui';
import { IconAlign, IconArrowUp, IconPlus, IconChevronLeft } from '../components/icons';
import { conversationList } from '../data/social';
import { people, ME } from '../data/people';
import { wp } from '../data/waypoints';
import type { Conversation, Message } from '../data/types';
import { relationTo } from '../lib/relations';
import { conversationMessages, useApp } from '../lib/store';
import { springs, useIsMobile, haptic } from '../lib/motion';
import { useUI } from '../lib/ui';
import { bestSegment } from '../components/RequestComposer';
import './messages.css';

function useConversation(id?: string, to?: string | null): Conversation | undefined {
  return useMemo(() => {
    if (id) return conversationList.find((c) => c.id === id) ?? (id.startsWith('new-') ? draft(id.slice(4)) : undefined);
    if (to) return conversationList.find((c) => c.with === to) ?? draft(to);
    return undefined;
  }, [id, to]);
}

function draft(personId: string): Conversation | undefined {
  if (!people[personId]) return undefined;
  const seg = bestSegment(personId) ?? ['msc-chem', 'pharma-rnd'];
  return { id: `new-${personId}`, with: personId, about: seg, aboutPerson: personId, messages: [], unread: 0 };
}

function ThreadRow({ c, active }: { c: Conversation; active: boolean }) {
  const extra = useApp((s) => s.extraMessages);
  const read = useApp((s) => !!s.readThreads[c.id]);
  const msgs = conversationMessages(c.id, extra);
  const last = msgs[msgs.length - 1];
  const p = people[c.with];
  const unread = read ? 0 : c.unread;
  return (
    <Link to={`/messages/${c.id}`} className={`thread-row ${active ? 'is-active' : ''} ${unread ? 'is-unread' : ''}`}>
      <Avatar id={c.with} size={52} />
      <div className="thread-row__body">
        <div className="thread-row__top">
          <span className="t-headline truncate">{p.name}</span>
          <span className="t-footnote c-2 thread-row__time">{last?.at.replace(/^Today /, '')}</span>
        </div>
        <p className="thread-row__about t-caption1">
          {wp(c.about[0]).short} → {wp(c.about[1]).short}
        </p>
        <p className="t-subhead c-2 clamp-2">
          {last?.from === ME ? 'You: ' : ''}
          {last?.body}
        </p>
      </div>
      {unread > 0 && <span className="thread-row__dot" aria-label={`${unread} unread`} />}
    </Link>
  );
}

function SegmentCard({ seg, mine }: { seg: NonNullable<Message['segment']>; mine: boolean }) {
  const p = people[seg.person];
  return (
    <Link to={`/p/${seg.person}`} className={`seg-card ${mine ? 'is-mine' : ''}`}>
      <p className="t-subhead w-600">
        {wp(seg.from).label} → {wp(seg.to).label}
      </p>
      <p className="seg-card__whose t-caption1">A step from {seg.person === ME ? 'your' : `${p.first}’s`} Path</p>
      <PathStrip id={seg.person} highlight={[seg.from, seg.to]} wrap />
    </Link>
  );
}

function Thread({ c, onBack }: { c: Conversation; onBack?: () => void }) {
  const extra = useApp((s) => s.extraMessages);
  const send = useApp((s) => s.sendMessage);
  const markRead = useApp((s) => s.markThreadRead);
  const openCompare = useUI((s) => s.openCompare);
  const [text, setText] = useState('');
  const [attach, setAttach] = useState(false);
  const [pending, setPending] = useState<Message['segment']>();
  const scroller = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const msgs = conversationMessages(c.id, extra);
  const p = people[c.with];
  const rel = relationTo(c.with);

  useEffect(() => {
    markRead(c.id);
  }, [c.id, markRead]);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
    if (isMobile) window.scrollTo(0, document.body.scrollHeight);
  }, [msgs.length, c.id, isMobile]);

  const submit = () => {
    if (!text.trim() && !pending) return;
    haptic(6);
    send(c.id, text.trim() || 'Sharing this step from my Path:', pending);
    setText('');
    setPending(undefined);
  };

  return (
    <div className="thread">
      <header className="thread__head">
        {onBack && (
          <button className="thread__back" onClick={onBack} aria-label="Back to messages">
            <IconChevronLeft size={22} />
          </button>
        )}
        <Avatar id={c.with} size={40} />
        <div className="thread__who">
          <PersonName id={c.with} className="t-headline" />
          {rel.kind !== 'other' && rel.kind !== 'self' && <RelationTag kind={rel.kind} label={rel.label} />}
        </div>
        <Button variant="tinted" size="small" icon={<IconAlign size={16} />} onClick={() => openCompare(c.with)}>
          {isMobile ? 'Align' : 'Align Paths'}
        </Button>
      </header>
      <div className="thread__context">
        <p className="t-footnote c-2">
          You’re talking about <strong>{wp(c.about[0]).label} → {wp(c.about[1]).label}</strong> on {c.aboutPerson === ME ? 'your' : `${people[c.aboutPerson].first}’s`} Path
        </p>
        <PathHint id={c.aboutPerson} segment={c.about} />
      </div>

      <div className="thread__scroll" ref={scroller}>
        {msgs.length === 0 && (
          <div className="thread__empty">
            <img src={p.photo} alt="" />
            <p className="t-headline">Start with the step, not the small talk</p>
            <p className="t-subhead c-2">{rel.why}</p>
          </div>
        )}
        <ol className="bubbles">
          {msgs.map((m, i) => {
            const mine = m.from === ME;
            const prev = msgs[i - 1];
            const next = msgs[i + 1];
            const firstOfGroup = !prev || prev.from !== m.from;
            const lastOfGroup = !next || next.from !== m.from;
            const showTime = !prev || prev.at.split(' ')[0] !== m.at.split(' ')[0];
            return (
              <motion.li
                key={m.id}
                className={`bubble-row ${mine ? 'is-mine' : ''} ${lastOfGroup ? 'is-last' : ''}`}
                initial={m.id.startsWith('x-') ? { opacity: 0, y: 12, scale: 0.96 } : false}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={springs.snappy}
              >
                {showTime && <p className="bubble-time t-caption1">{m.at}</p>}
                <div className="bubble-line">
                  {!mine && <span className="bubble-avatar">{lastOfGroup && <Avatar id={m.from} size={28} peek={false} />}</span>}
                  <div className={`bubble ${firstOfGroup ? 'is-first' : ''} ${lastOfGroup ? 'is-tail' : ''}`}>
                    {m.body && <p>{m.body}</p>}
                    {m.segment && <SegmentCard seg={m.segment} mine={mine} />}
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>

      <div className="composer-bar">
        <AnimatePresence>
          {attach && (
            <motion.div className="attach" initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6 }} transition={springs.snappy}>
              <p className="attach__h t-footnote">Share a step</p>
              <button
                className="attach__item"
                onClick={() => {
                  setPending({ person: ME, from: 'research-asst', to: 'msc-chem' });
                  setAttach(false);
                }}
              >
                <span className="t-subhead w-600">From your Path</span>
                <span className="t-footnote c-2">Research → MSc Chemistry</span>
              </button>
              <button
                className="attach__item"
                onClick={() => {
                  setPending({ person: c.aboutPerson, from: c.about[0], to: c.about[1] });
                  setAttach(false);
                }}
              >
                <span className="t-subhead w-600">From {c.aboutPerson === ME ? 'your' : `${people[c.aboutPerson].first}’s`} Path</span>
                <span className="t-footnote c-2">
                  {wp(c.about[0]).short} → {wp(c.about[1]).short}
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        {pending && (
          <div className="composer-bar__pending">
            <SegmentCard seg={pending} mine />
            <button className="t-footnote c-tint" onClick={() => setPending(undefined)}>
              Remove
            </button>
          </div>
        )}
        <div className="composer-bar__row">
          <motion.button className="composer-bar__plus" aria-label="Share a step from a Path" onClick={() => setAttach((a) => !a)} animate={{ rotate: attach ? 45 : 0 }} transition={springs.snappy}>
            <IconPlus size={20} />
          </motion.button>
          <label className="composer-bar__field">
            <span className="visually-hidden">Message</span>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder={`Message ${p.first}`}
              enterKeyHint="send"
            />
            <AnimatePresence>
              {(text.trim() || pending) && (
                <motion.button className="composer-bar__send" onClick={submit} aria-label="Send" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={springs.snappy}>
                  <IconArrowUp size={16} strokeWidth={2.6} />
                </motion.button>
              )}
            </AnimatePresence>
          </label>
        </div>
      </div>
    </div>
  );
}

export function Messages() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const c = useConversation(id, params.get('to'));

  if (isMobile && c) {
    return (
      <div className="messages-mobile">
        <Thread c={c} onBack={() => navigate('/messages')} />
      </div>
    );
  }

  const list = (
    <div className="threads">
      {conversationList.map((x) => (
        <ThreadRow key={x.id} c={x} active={c?.id === x.id} />
      ))}
    </div>
  );

  if (isMobile) return <Page title="Messages" back="Home">{list}</Page>;

  return (
    <Page title="Messages" subtitle="Every conversation starts from a step on someone’s Path." wide>
      <div className="messages">
        <aside className="messages__list">{list}</aside>
        <section className="messages__thread">
          {c ? (
            <Thread c={c} />
          ) : (
            <div className="messages__placeholder">
              <p className="t-title3">Pick up where you left off</p>
              <p className="t-subhead c-2">Elena replied about the CRO → R&D move yesterday.</p>
              <Link to="/messages/c-elena">
                <Button variant="tinted" size="medium">
                  Open Elena’s thread
                </Button>
              </Link>
            </div>
          )}
        </section>
      </div>
    </Page>
  );
}
