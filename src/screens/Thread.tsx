import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DockTitle, Page } from '../components/chrome';
import { PathHint } from '../components/path/PathHint';
import { CommunityTitle, JoinButton } from '../components/content';
import { membersAt } from '../components/CommunityRoute';
import { RailFooter, RailPeople, RailSection } from '../components/Rail';
import { Avatar, Button, PersonName, RelationTag, SaveToggle } from '../components/ui';
import { communities, threads } from '../data/communities';
import { people, ME } from '../data/people';
import { wp } from '../data/waypoints';
import { springs } from '../lib/motion';
import { current, relationTo } from '../lib/relations';
import { useApp } from '../lib/store';
import { useUI } from '../lib/ui';
import { NotFound } from './NotFound';
import './thread.css';

/*
  A community conversation on its own page: what was asked, by whom and from which stop on the route, then every
  reply with where that person is standing, and a reply box for members. Conversations you start, and your replies,
  are kept on this device like the rest of the prototype.
*/
export function ThreadScreen() {
  const { id = '', tid = '' } = useParams();
  const mine = useApp((s) => s.myThreads);
  const extra = useApp((s) => s.threadReplies[tid]);
  const reply = useApp((s) => s.replyToThread);
  const joined = useApp((s) => !!s.joined[id]);
  const toast = useUI((s) => s.showToast);
  const [draft, setDraft] = useState('');
  const c = communities[id];
  const t = [...mine, ...threads].find((x) => x.id === tid && x.community === id);
  if (!c || !t) return <NotFound />;

  const at = current(people[t.author]).wp;
  const rel = relationTo(t.author);
  const replies = [...t.replies, ...(extra ?? []).map((r) => ({ author: ME, body: r.body, ago: r.ago }))];
  const total = t.replyCount + (extra?.length ?? 0);
  const alsoHere = membersAt(c, at)
    .filter((m) => m !== ME && m !== t.author)
    .slice(0, 4);
  const stamp = wp(current(people[ME]).wp).short;

  return (
    <Page
      title={t.title}
      large={false}
      back={`/c/${c.id}`}
      rail={
        <>
          <RailSection title="The community">
            <div className="td-cm">
              <Link to={`/c/${c.id}`} className="td-cm__title">
                <CommunityTitle c={c} />
              </Link>
              <p className="td-cm__meta">
                {c.members.toLocaleString('en-CA')} on this journey · {c.activeNow} here now
              </p>
              <JoinButton id={c.id} />
            </div>
          </RailSection>
          {alsoHere.length > 0 && (
            <RailSection title={`Also at ${wp(at).short}`}>
              <RailPeople ids={alsoHere} />
            </RailSection>
          )}
          <RailFooter />
        </>
      }
    >
      <DockTitle title={t.title}>{!joined && <JoinButton id={c.id} />}</DockTitle>
      <div className="td">
        <article className="td__main">
          <p className="td__where t-subhead">
            In <Link to={`/c/${c.id}`}>{c.title}</Link>
            <span className="c-2">
              {' '}
              · {t.pinned ? 'Pinned · ' : ''}
              {t.ago === 'now' ? 'just now' : t.ago}
            </span>
          </p>
          <h1 className="td__title" data-morph-to="title">
            {t.title}
          </h1>
          <div className="td__by">
            <Avatar id={t.author} size={40} />
            <div>
              <p className="t-subhead">
                {t.author === ME ? <strong>You</strong> : <PersonName id={t.author} />}
                {rel.kind !== 'other' && rel.kind !== 'self' && (
                  <>
                    {' '}
                    <RelationTag kind={rel.kind} label={rel.label} />
                  </>
                )}
                <span className="c-2"> · writing from {wp(at).label}</span>
              </p>
              <PathHint id={t.author} />
            </div>
            <SaveToggle saveKey={`thread:${t.id}`} compact />
          </div>
          {t.body && <p className="td__body t-body">{t.body}</p>}

          <h2 className="td__h">
            {total} {total === 1 ? 'reply' : 'replies'} <span className="c-2">· each shows where the person is on the route</span>
          </h2>
          {replies.length > 0 ? (
            <div className="td__replies">
              {replies.map((r, i) => (
                <motion.div key={`${r.author}-${i}`} className="td-reply" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springs.smooth, delay: 0.05 * Math.min(i, 6) }}>
                  <Avatar id={r.author} size={36} />
                  <div className="td-reply__in">
                    <p className="td-reply__by">
                      {r.author === ME ? <strong>You</strong> : <PersonName id={r.author} />}
                      <span className="c-2">
                        {' '}
                        · at {wp(current(people[r.author]).wp).short} · {r.ago === 'now' ? 'just now' : r.ago}
                      </span>
                    </p>
                    <p className="td-reply__body">{r.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="td__empty t-subhead c-2">No replies yet. People at {wp(at).short} and a step ahead see it first.</p>
          )}
          {total > replies.length && <p className="td__more t-footnote c-2">Showing the latest {replies.length} of {total}.</p>}

          {joined ? (
            <div className="td__reply">
              <h3 className="t-headline">Reply from where you are</h3>
              <p className="t-footnote c-2">People will see you’re at {stamp}.</p>
              <textarea rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add to the conversation…" aria-label="Your reply" />
              <Button
                variant="filled"
                size="small"
                disabled={!draft.trim()}
                onClick={() => {
                  reply(t.id, draft.trim());
                  setDraft('');
                  toast('Reply posted');
                }}
              >
                Post reply
              </Button>
            </div>
          ) : (
            <div className="td__reply td__reply--join">
              <p className="t-subhead">Join {c.title} to reply. Everything you post shows where you are on the route.</p>
              <JoinButton id={c.id} size="medium" />
            </div>
          )}
        </article>
      </div>
    </Page>
  );
}
