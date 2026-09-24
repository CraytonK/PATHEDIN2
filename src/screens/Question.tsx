import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Page } from '../components/chrome';
import { PathHint } from '../components/path/PathHint';
import { CredibilityLabel, RequestButton } from '../components/content';
import { Avatar, AvatarStack, Button, Helpful, PersonName, RelationTag } from '../components/ui';
import { questions } from '../data/questions';
import { communities } from '../data/communities';
import { people, ME } from '../data/people';
import { wp } from '../data/waypoints';
import { peopleThrough, relationTo } from '../lib/relations';
import { springs } from '../lib/motion';
import { useUI } from '../lib/ui';
import { RailFooter, RailPeople, RailSection } from '../components/Rail';
import { NotFound } from './NotFound';
import './questions.css';

export function QuestionScreen() {
  const { id = '' } = useParams();
  const q = questions[id];
  const toast = useUI((s) => s.showToast);
  const [draft, setDraft] = useState('');
  const [mine, setMine] = useState<string[]>([]);
  if (!q) return <NotFound />;
  const asker = people[q.asker];
  const c = communities[q.community];
  const made = peopleThrough(q.about[0]).filter((p) => p.path.some((s) => s.wp === q.about[1]));
  const canAnswer = q.asker !== ME;

  return (
    <Page
      title={q.title}
      large={false}
      back="Questions"
      rail={
        <>
          <RailSection title="People who made this move">
            <RailPeople ids={made.slice(0, 4).map((p) => p.id)} action="request" />
          </RailSection>
          <p className="qd__asker-note">
            {q.asker === ME ? 'You' : asker.first} asked from {wp(asker.path.at(-1)!.wp).label}.
          </p>
          <RailFooter />
        </>
      }
    >
      <div className="qd">
        <article className="qd__main">
          <p className="qd__about t-subhead">
            About {wp(q.about[0]).label} → {wp(q.about[1]).label} · in <Link to={`/c/${c.id}`}>{c.title}</Link>
          </p>
          <h1 className="qd__title">{q.title}</h1>
          <p className="qd__body t-body">{q.body}</p>
          <div className="qd__asker">
            <Avatar id={q.asker} size={36} />
            <div>
              <p className="t-subhead">
                {q.asker === ME ? <strong>You</strong> : <PersonName id={q.asker} />} asked {q.ago} ago
              </p>
              <PathHint id={q.asker} segment={q.about} />
            </div>
          </div>

          <div className="qd__reach">
            <AvatarStack ids={made.map((p) => p.id)} size={24} max={6} />
            <p className="t-footnote c-2">
              Sent first to {made.length} people who made this exact move. {q.followers} following.
            </p>
          </div>

          <h2 className="qd__h">
            {q.answers.length} answers <span className="c-2">· ordered by how close each person is to this step</span>
          </h2>

          {q.answers.map((a, i) => {
            const rel = relationTo(a.author);
            return (
              <motion.div key={a.id} className="answer" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springs.smooth, delay: 0.05 * i }}>
                <CredibilityLabel kind={a.credibility} text={a.credibilityText} />
                <div className="answer__who">
                  <Avatar id={a.author} size={44} />
                  <div>
                    <div className="answer__name">
                      <PersonName id={a.author} className="t-headline" />
                      {rel.kind !== 'other' && rel.kind !== 'self' && <RelationTag kind={rel.kind} label={rel.label} />}
                    </div>
                    <p className="t-footnote c-2">{people[a.author].headline}</p>
                  </div>
                </div>
                <p className="answer__body t-body">{a.body}</p>
                <div className="answer__path">
                  <PathHint id={a.author} segment={q.about} />
                </div>
                <div className="answer__actions">
                  <Helpful helpKey={a.id} count={a.helpful} />
                  <span className="t-footnote c-3">{a.ago}</span>
                  <RequestButton id={a.author} segment={q.about} variant="tinted" label="Follow up" />
                </div>
              </motion.div>
            );
          })}

          {mine.map((body, i) => (
            <div key={i} className="answer">
              <CredibilityLabel kind="same-stage" text="Your answer · shown with your Path" />
              <div className="answer__who">
                <Avatar id={ME} size={44} />
                <p className="t-headline">You</p>
              </div>
              <p className="answer__body t-body">{body}</p>
            </div>
          ))}

          {canAnswer && (
            <div className="qd__answer">
              <h3 className="t-headline">Answer from where you are</h3>
              <p className="t-footnote c-2">Your answer will show your Path, so people know what you’re speaking from.</p>
              <PathHint id={ME} />
              <textarea rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Share what you’ve seen from your step…" />
              <Button
                variant="filled"
                size="small"
                disabled={!draft.trim()}
                onClick={() => {
                  setMine((m) => [...m, draft]);
                  setDraft('');
                  toast('Answer posted');
                }}
              >
                Post answer
              </Button>
            </div>
          )}
        </article>

      </div>
    </Page>
  );
}
