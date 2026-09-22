import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Page } from '../components/chrome';
import { QuestionItem } from '../components/content';
import { AvatarStack, Button, TextTabs } from '../components/ui';
import { questionList } from '../data/questions';
import { people, ME } from '../data/people';
import { wp } from '../data/waypoints';
import { futureWaypoints, peopleAt, peopleThrough, walked } from '../lib/relations';
import { springs } from '../lib/motion';
import { useUI } from '../lib/ui';
import './questions.css';

const mine = new Set([...walked(people[ME]), ...futureWaypoints(people[ME])]);
const segments: [string, string][] = [
  ['msc-chem', 'cro-analytical'],
  ['cro-analytical', 'pharma-rnd'],
  ['msc-chem', 'process-chem'],
  ['msc-chem', 'phd-chem'],
  ['msc-chem', 'reg-affairs'],
];

function AskBox() {
  const [seg, setSeg] = useState(0);
  const [q, setQ] = useState('');
  const toast = useUI((s) => s.showToast);
  const [a, b] = segments[seg];
  const answerers = [...peopleThrough(a), ...peopleAt(b), ...peopleThrough(b)].filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i && p.id !== ME && p.path.some((s) => s.wp === b));
  return (
    <div className="ask">
      <h2 className="t-title3">Ask the people ahead of you</h2>
      <p className="t-subhead c-2">Choose the step you’re asking about. Your question goes first to people who made that move.</p>
      <div className="ask__segs" role="radiogroup" aria-label="Step you're asking about">
        {segments.map(([x, y], i) => (
          <button key={i} role="radio" aria-checked={seg === i} className={`ask__seg ${seg === i ? 'is-on' : ''}`} onClick={() => setSeg(i)}>
            {wp(x).short} → {wp(y).short}
          </button>
        ))}
      </div>
      <textarea className="ask__input" rows={2} placeholder={`What do you want to know about ${wp(a).label} → ${wp(b).label}?`} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="ask__foot">
        <span className="t-footnote c-2 ask__who">
          {answerers.length > 0 && <AvatarStack ids={answerers.map((p) => p.id)} size={22} max={4} />}
          {answerers.length ? `${answerers.map((p) => p.first).slice(0, 2).join(', ')}${answerers.length > 2 ? ` and ${answerers.length - 2} more` : ''} made this move` : 'People who made this move will see it first'}
        </span>
        <Button
          variant="filled"
          size="small"
          disabled={!q.trim()}
          onClick={() => {
            setQ('');
            toast('Question sent to people who made this move');
          }}
        >
          Ask
        </Button>
      </div>
    </div>
  );
}

export function Questions() {
  const [tab, setTab] = useState<'path' | 'mine' | 'all'>('path');
  const list = questionList.filter((q) => (tab === 'all' ? true : tab === 'mine' ? q.asker === ME : mine.has(q.about[0]) && mine.has(q.about[1])));
  return (
    <Page title="Questions" subtitle="Answered by people who’ve been there — and every answer tells you why it’s worth your time." wide>
      <div className="qs">
        <div className="qs__main">
          <TextTabs
            value={tab}
            onChange={setTab}
            options={[
              { value: 'path', label: 'About your Path' },
              { value: 'mine', label: 'Your questions', count: questionList.filter((q) => q.asker === ME).length },
              { value: 'all', label: 'Every journey' },
            ]}
          />
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} transition={springs.smooth}>
              {list.map((q) => (
                <QuestionItem key={q.id} q={q} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
        <aside className="qs__side">
          <AskBox />
        </aside>
      </div>
    </Page>
  );
}
