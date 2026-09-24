import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Page } from '../components/chrome';
import { PathHint } from '../components/path/PathHint';
import { RequestButton } from '../components/content';
import { Avatar, Button, PersonName, RelationTag, SaveToggle } from '../components/ui';
import { decisions, decisionList } from '../data/decisions';
import { people, ME } from '../data/people';
import { wp } from '../data/waypoints';
import type { Decision } from '../data/types';
import { relationTo } from '../lib/relations';
import { springs, useIsMobile, haptic } from '../lib/motion';
import { useApp } from '../lib/store';
import { useUI } from '../lib/ui';
import { RailFooter, RailPosts, RailSection } from '../components/Rail';
import { NotFound } from './NotFound';
import './decisions.css';

const ITEM = 58;

function ForkMap({ d, focus, setFocus }: { d: Decision; focus: string | null; setFocus: (id: string | null) => void }) {
  const isMobile = useIsMobile();
  const rows = d.options.map((o) => Math.max(120, o.chose.length * ITEM + 64));
  const H = rows[0] + rows[1] + 24;
  const W = isMobile ? 64 : 180;
  const y0 = H / 2;
  const ys = [rows[0] / 2, rows[0] + 24 + rows[1] / 2];
  const chosen = d.status === 'decided' ? d.chosen : undefined;
  return (
    <div className="forkmap" style={{ height: H, gridTemplateColumns: `${W}px 1fr` }}>
      <svg width={W} height={H} className="forkmap__svg" aria-hidden="true">
        {d.options.map((o, i) => {
          const y = ys[i];
          const lit = chosen ? chosen === o.id : focus ? focus === o.id : true;
          // Brand vocabulary: a road taken is solid navy; roads still open are dashed celestial.
          const taken = chosen === o.id;
          const stroke = taken ? 'var(--ink)' : chosen ? 'var(--label-4)' : 'var(--tint)';
          return taken ? (
            <motion.path
              key={o.id}
              d={`M 20 ${y0} L ${W * 0.3} ${y0} C ${W * 0.6} ${y0} ${W * 0.55} ${y} ${W * 0.85} ${y} L ${W} ${y}`}
              fill="none"
              stroke={stroke}
              strokeWidth={3.5}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.7, delay: 0.2 + i * 0.1, ease: [0.45, 0, 0.2, 1] }}
            />
          ) : (
            <motion.path
              key={o.id}
              d={`M 20 ${y0} L ${W * 0.3} ${y0} C ${W * 0.6} ${y0} ${W * 0.55} ${y} ${W * 0.85} ${y} L ${W} ${y}`}
              fill="none"
              stroke={stroke}
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeDasharray="5 8"
              initial={{ opacity: 0 }}
              animate={{ opacity: lit ? 1 : 0.3 }}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
              style={{ transition: 'stroke .2s' }}
            />
          );
        })}
      </svg>
      <motion.div className="forkmap__owner" style={{ top: y0 }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={springs.settle}>
        <img src={people[d.owner].photo} alt="" />
      </motion.div>
      <div className="forkmap__rows">
        {d.options.map((o, i) => {
          const dim = (chosen && chosen !== o.id) || (focus && focus !== o.id);
          return (
            <div
              key={o.id}
              className={`forkmap__row ${dim ? 'is-dim' : ''} ${chosen === o.id ? 'is-chosen' : ''}`}
              style={{ height: rows[i], marginTop: i ? 24 : 0 }}
              onPointerEnter={() => !isMobile && setFocus(o.id)}
              onPointerLeave={() => !isMobile && setFocus(null)}
              onClick={() => isMobile && setFocus(focus === o.id ? null : o.id)}
            >
              <div className="forkmap__opt">
                <h3 className="t-title3">{o.label}</h3>
                <p className="t-footnote c-2">
                  {o.detail} {chosen === o.id && <strong className="c-tint"> · Chosen</strong>}
                </p>
              </div>
              <ul className="forkmap__people">
                {o.chose.map((c, k) => (
                  <motion.li key={c.person} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ ...springs.settle, delay: 0.6 + i * 0.15 + k * 0.06 }}>
                    <Avatar id={c.person} size={34} />
                    <div>
                      <PersonName id={c.person} className="t-subhead" />
                      <p className="t-footnote c-2">{c.outcome}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DecisionScreen() {
  const { id = '' } = useParams();
  const d = decisions[id];
  const [focus, setFocus] = useState<string | null>(null);
  const my = useApp((s) => s.weighIns[id]);
  const weighIn = useApp((s) => s.weighIn);
  const toast = useUI((s) => s.showToast);
  const [option, setOption] = useState<string | null>(null);
  const [body, setBody] = useState('');
  if (!d) return <NotFound />;
  const owner = people[d.owner];
  const rel = relationTo(d.owner);
  const mine = d.owner === ME;
  const optLabel = (oid: string) => d.options.find((o) => o.id === oid)?.label ?? 'Deciding too';
  const similar = decisionList.filter((x) => x.id !== d.id && (x.at === d.at || x.community === d.community)).slice(0, 2);
  const people0 = d.options[0].chose[0]?.person;
  const people1 = d.options[1].chose[0]?.person;

  return (
    <Page
      title={d.title}
      large={false}
      back="Decisions"
      rail={
        <>
          {mine ? (
            <section>
              <h2 className="rail-h">Talk to someone on each road</h2>
              <p className="t-subhead c-2 dd__side-p">One conversation on each side is worth more than any spreadsheet.</p>
              {[people0, people1].filter(Boolean).map((pid, i) => (
                <div key={pid} className="dd__ask">
                  <Avatar id={pid!} size={40} />
                  <div>
                    <PersonName id={pid!} className="t-subhead" />
                    <p className="t-footnote c-2">Took “{d.options[i].label}”</p>
                  </div>
                  <RequestButton id={pid!} segment={[d.at, d.options[i].wp]} variant="tinted" label="Ask" />
                </div>
              ))}
            </section>
          ) : (
            <section>
              <h2 className="rail-h">Facing this too?</h2>
              <p className="t-subhead c-2 dd__side-p">
                Add it to your Path as a Decision Point and the people who took each road will see it.
              </p>
              <Link to="/decisions/d-maya-phd">
                <Button variant="gray" size="small">
                  See your decision
                </Button>
              </Link>
            </section>
          )}
          {similar.length > 0 && (
            <RailSection title="Similar forks">
              <RailPosts items={similar.map((x) => ({ author: x.owner, title: x.title, to: `/decisions/${x.id}`, meta: `${x.status === 'open' ? 'Deciding now' : 'Decided'} · ${x.weighIns.length} weighed in` }))} />
            </RailSection>
          )}
          <RailFooter />
        </>
      }
    >
      <div className="dd">
        <div className="dd__main">
          <h1 className="dd__title">{d.title}</h1>
          <div className="dd__owner">
            <Avatar id={d.owner} size={40} />
            <div>
              <p className="t-subhead">
                {mine ? <strong>Your decision</strong> : <PersonName id={d.owner} />}
                {!mine && rel.kind !== 'other' && (
                  <>
                    {' '}
                    <RelationTag kind={rel.kind} label={rel.label} />
                  </>
                )}
                <span className="c-2">
                  {' '}
                  · {d.status === 'open' ? 'Deciding now' : 'Decided'} at {wp(d.at).label}
                </span>
              </p>
              <PathHint id={d.owner} />
            </div>
            <SaveToggle saveKey={`decision:${d.id}`} compact />
          </div>
          <p className="dd__context t-body">{d.context}</p>

          <section className="dd__fork">
            <p className="dd__fork-h t-footnote">Where each road led the people who took it</p>
            <ForkMap d={d} focus={focus} setFocus={setFocus} />
          </section>

          {d.reflection && (
            <blockquote className="dd__reflection t-serif">
              “{d.reflection}”<footer className="t-footnote c-2">— {owner.first}, looking back</footer>
            </blockquote>
          )}

          <section className="dd__weigh">
            <h2 className="t-title3">{d.weighIns.length + (my ? 1 : 0)} people weighed in with their Paths</h2>
            {d.weighIns.map((w) => {
              const r = relationTo(w.person);
              return (
                <div key={w.person} className="weigh">
                  <Avatar id={w.person} size={40} />
                  <div className="weigh__body">
                    <p className="weigh__who">
                      <PersonName id={w.person} className="t-subhead" />
                      {r.kind !== 'other' && r.kind !== 'self' && <RelationTag kind={r.kind} label={r.label} />}
                    </p>
                    <p className="weigh__took t-footnote">
                      <span className={`weigh__branch ${w.option === d.options[0].id ? 'is-a' : 'is-b'}`} /> Took “{optLabel(w.option)}”
                    </p>
                    <p className="t-callout">{w.body}</p>
                  </div>
                </div>
              );
            })}
            {my && (
              <div className="weigh">
                <Avatar id={ME} size={40} peek={false} />
                <div className="weigh__body">
                  <p className="t-subhead w-600">You</p>
                  <p className="weigh__took t-footnote">
                    <span className="weigh__branch" /> {my.option === 'deciding' ? 'Deciding too' : `Took “${optLabel(my.option)}”`}
                  </p>
                  <p className="t-callout">{my.body}</p>
                </div>
              </div>
            )}
            {!mine && !my && (
              <div className="dd__compose">
                <p className="t-headline">Weigh in from your Path</p>
                <div className="dd__choices">
                  {[...d.options.map((o) => ({ id: o.id, label: `I took “${o.label}”` })), { id: 'deciding', label: 'I’m deciding too' }].map((o) => (
                    <button
                      key={o.id}
                      className={`dd__choice ${option === o.id ? 'is-on' : ''}`}
                      onClick={() => {
                        haptic(4);
                        setOption(o.id);
                      }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                <AnimatePresence>
                  {option && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                      <textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="What would you tell them, from where you are?" />
                      <Button
                        variant="filled"
                        size="small"
                        disabled={!body.trim()}
                        onClick={() => {
                          weighIn(d.id, option, body);
                          toast(`${owner.first} will see this with your Path`);
                        }}
                      >
                        Weigh in
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </section>
        </div>

      </div>
    </Page>
  );
}
