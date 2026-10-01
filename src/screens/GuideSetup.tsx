import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Page } from '../components/chrome';
import { Button, Rolling } from '../components/ui';
import { IconCheck, IconMinus, IconPlus, IconGuidePlus } from '../components/icons';
import { people, peopleList, me, ME } from '../data/people';
import { wp } from '../data/waypoints';
import type { ServiceKind } from '../data/types';
import { DAY_NAMES, PARTS, PLATFORM_FEE, fmtMoney, paidKinds, payout, priceLabel, serviceKinds } from '../lib/guides';
import { compactSteps, current } from '../lib/relations';
import { haptic, springs, useIsMobile } from '../lib/motion';
import { useApp, type MyGuide } from '../lib/store';
import { useUI } from '../lib/ui';
import './guide-setup.css';

/*
  Becoming a Path Guide. You can only guide moves you've made yourself, so the setup starts from your own
  Path. Then what you know, how you'll help (free, paid, or both), when you're around, and a last look at
  your profile as others will see it. PathedIn keeps a share of paid sessions; free guidance stays free.
*/

const STEPS = ['Your moves', 'Experience', 'How you’ll help', 'Availability', 'Go live'] as const;

function movesOf(): [string, string][] {
  const steps = compactSteps(me.path);
  return steps.slice(1).map((s, i) => [steps[i].wp, s.wp]);
}

/** People at the start of a move right now: the ones you'd be guiding. */
function behind(from: string) {
  return peopleList.filter((p) => p.id !== ME && current(p).wp === from);
}

function freshDraft(): MyGuide {
  const moves = movesOf();
  return {
    transitions: moves.slice(0, 1),
    pitch: 'I’ll help you get into a research lab after your BSc, and make the most of it.',
    experience: 'Three years as a research assistant in an organic synthesis lab at McGill, now finishing an MSc at U of T.',
    expertise: ['Research assistant jobs', 'Lab skills that transfer', 'Applying to MSc programs'],
    free: { answers: true, officeHours: true },
    officeHours: { day: 3, hour: 18, spots: 3 },
    services: paidKinds.map((kind) => ({
      kind,
      on: kind === 'call' || kind === 'resume',
      price: kind === 'call' ? 40 : kind === 'resume' ? 30 : serviceKinds[kind].suggested,
      minutes: serviceKinds[kind].minutes,
      seats: kind === 'group' ? 8 : kind === 'workshop' ? 20 : undefined,
    })),
    availability: ['2-evening', '4-evening'],
    live: false,
    since: new Date().getFullYear(),
  };
}

const SUGGESTED = ['Research assistant jobs', 'Lab skills that transfer', 'Applying to MSc programs', 'Organic synthesis', 'Choosing a supervisor', 'NMR and chromatography', 'Moving provinces for grad school'];

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={`gs-switch ${on ? 'is-on' : ''}`} onClick={() => onChange(!on)}>
      <motion.span className="gs-switch__knob" layout transition={springs.snappy} />
    </button>
  );
}

function PriceStepper({ value, onChange, step = 5, label }: { value: number; onChange: (v: number) => void; step?: number; label: string }) {
  return (
    <div className="gs-price" role="group" aria-label={label}>
      <button type="button" aria-label={`Lower ${label}`} onClick={() => onChange(Math.max(5, value - step))}>
        <IconMinus size={14} strokeWidth={2.2} />
      </button>
      <span className="gs-price__val">
        <Rolling value={value} format={(n) => `$${n}`} />
      </span>
      <button type="button" aria-label={`Raise ${label}`} onClick={() => onChange(Math.min(1000, value + step))}>
        <IconPlus size={14} strokeWidth={2.2} />
      </button>
    </div>
  );
}

/** What you keep from a paid service: it rolls up from $0 a beat after the service is switched on, then follows the price. */
function Keep({ price }: { price: number }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setArmed(true), 180);
    return () => clearTimeout(t);
  }, []);
  return <Rolling value={armed ? payout(price) : 0} format={fmtMoney} />;
}

/** Your Guide card as people will see it, updating as you go. */
function Preview({ d }: { d: MyGuide }) {
  const on = d.services.filter((s) => s.on);
  return (
    <section className="gs-preview immersive" aria-label="Preview of your Guide profile">
      <span className="gs-preview__badge">Preview</span>
      <div className="gs-preview__who">
        <img src={me.photo} alt="" />
        <span>
          <strong>{me.name}</strong>
          <span>Path Guide · new</span>
        </span>
      </div>
      <p className="gs-preview__pitch">{d.pitch || 'Your one line goes here.'}</p>
      <ul className="gs-preview__moves">
        {d.transitions.map(([a, b]) => (
          <li key={`${a}-${b}`}>
            {wp(a).short} → <strong>{wp(b).short}</strong>
          </li>
        ))}
      </ul>
      <ul className="gs-preview__svcs">
        {d.free.officeHours && (
          <li>
            <span>Office Hours</span>
            <strong>Free</strong>
          </li>
        )}
        {on.map((s) => (
          <li key={s.kind}>
            <span>{serviceKinds[s.kind].label}</span>
            <strong>
              <Rolling value={s.price} format={(n) => priceLabel({ price: n, per: serviceKinds[s.kind].per })} />
            </strong>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function GuideSetup() {
  const saved = useApp((s) => s.myGuide);
  const requests = useApp((s) => s.requests);
  const saveGuide = useApp((s) => s.saveGuide);
  const setGuideLive = useApp((s) => s.setGuideLive);
  const toast = useUI((s) => s.showToast);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [d, setD] = useState<MyGuide>(() => saved ?? freshDraft());
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [custom, setCustom] = useState('');
  const [done, setDone] = useState(false);
  const moves = movesOf();
  const patch = (p: Partial<MyGuide>) => setD((x) => ({ ...x, ...p }));
  const setService = (kind: ServiceKind, p: Partial<MyGuide['services'][number]>) => patch({ services: d.services.map((s) => (s.kind === kind ? { ...s, ...p } : s)) });

  const canNext = step === 0 ? d.transitions.length > 0 : step === 1 ? d.pitch.trim().length > 8 && d.expertise.length > 0 : step === 2 ? d.free.answers || d.free.officeHours || d.services.some((s) => s.on) : step === 3 ? d.availability.length > 0 || !d.services.some((s) => s.on) : true;
  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
    saveGuide({ ...d, live: saved?.live ?? false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const goLive = () => {
    haptic([10, 40, 12]);
    saveGuide({ ...d, live: true });
    setGuideLive(true);
    setDone(true);
    window.scrollTo({ top: 0 });
  };

  if (done) {
    return (
      <Page title="You’re a Path Guide" back="/" large={false}>
        <motion.div className="gs-done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={springs.smooth}>
          <svg className="gs-done__mark" width="72" height="72" viewBox="0 0 64 64" aria-hidden="true">
            <motion.circle cx="32" cy="32" r="29" fill="none" stroke="var(--tint)" strokeWidth="2.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }} />
            <motion.path d="M21 33l7.5 7.5L44 25" fill="none" stroke="var(--tint)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35, delay: 0.4, ease: [0.16, 1, 0.3, 1] }} />
          </svg>
          <h1 className="gs-done__title">You’re a Path Guide</h1>
          <p className="gs-done__sub">
            People at {d.transitions.map(([a]) => wp(a).short).join(' and ')} will see you when they’re weighing {d.transitions.length === 1 ? 'the move' : 'the moves'} you made. {behind(d.transitions[0][0]).length > 0 && `${behind(d.transitions[0][0]).map((p) => p.first).join(', ')} ${behind(d.transitions[0][0]).length === 1 ? 'is' : 'are'} there right now.`}
          </p>
          <div className="gs-done__actions">
            <Button variant="filled" size="large" onClick={() => navigate(`/p/${ME}`)}>
              See your Guide profile
            </Button>
            <Button variant="outline" size="large" onClick={() => navigate('/guide')}>
              Open your Guide hub
            </Button>
          </div>
        </motion.div>
      </Page>
    );
  }

  const body = (
    <AnimatePresence mode="wait" initial={false} custom={dir}>
      <motion.section
        key={step}
        className="gs-step"
        initial={{ opacity: 0, x: dir * 28 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: dir * -20, transition: { duration: 0.14 } }}
        transition={springs.smooth}
      >
        {step === 0 && (
          <>
            <h2 className="gs-h">Which moves will you guide?</h2>
            <p className="gs-sub">You can only guide moves you’ve made yourself. That’s what makes a Guide worth asking.</p>
            <ul className="gs-moves">
              {moves.map(([a, b]) => {
                const on = d.transitions.some(([x, y]) => x === a && y === b);
                const here = behind(a);
                const asked = requests.filter((r) => r.to === ME && r.segment?.[0] === a && r.segment?.[1] === b).map((r) => people[r.from].first);
                const made = compactSteps(me.path).find((s) => s.wp === b);
                return (
                  <li key={`${a}-${b}`}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      className={`gs-move ${on ? 'is-on' : ''}`}
                      onClick={() => patch({ transitions: on ? d.transitions.filter(([x, y]) => !(x === a && y === b)) : [...d.transitions, [a, b]] })}
                    >
                      <span className="gs-check" aria-hidden="true">
                        {on && <IconCheck size={14} strokeWidth={2.6} />}
                      </span>
                      <span className="gs-move__line" aria-hidden="true">
                        <i className="is-from" />
                        <b />
                        <i className="is-to" />
                      </span>
                      <span className="gs-move__text">
                        <strong>
                          {wp(a).label} → {wp(b).label}
                        </strong>
                        <span>
                          You made this move in {made?.start}
                          {asked.length > 0 && ` · ${asked.join(' and ')} asked you about it`}
                          {here.length > 0 && ` · ${here.map((p) => p.first).join(', ')} ${here.length === 1 ? 'is' : 'are'} at ${wp(a).short} now`}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="gs-h">What do you know?</h2>
            <p className="gs-sub">Your Path shows where you’ve been. This says what you learned there.</p>
            <label className="gs-field">
              <span>Your one line</span>
              <input value={d.pitch} maxLength={120} onChange={(e) => patch({ pitch: e.target.value })} />
            </label>
            <label className="gs-field">
              <span>Your experience</span>
              <textarea rows={3} value={d.experience} onChange={(e) => patch({ experience: e.target.value })} />
            </label>
            <div className="gs-field">
              <span>Areas of expertise</span>
              <div className="gs-tags">
                {[...new Set([...SUGGESTED, ...d.expertise])].map((t) => {
                  const on = d.expertise.includes(t);
                  return (
                    <button key={t} type="button" aria-pressed={on} className={`gs-tag ${on ? 'is-on' : ''}`} onClick={() => patch({ expertise: on ? d.expertise.filter((x) => x !== t) : [...d.expertise, t] })}>
                      {on && <IconCheck size={13} strokeWidth={2.6} />}
                      {t}
                    </button>
                  );
                })}
                <form
                  className="gs-tag gs-tag--add"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const t = custom.trim();
                    if (t && !d.expertise.includes(t)) patch({ expertise: [...d.expertise, t] });
                    setCustom('');
                  }}
                >
                  <IconPlus size={13} strokeWidth={2.4} />
                  <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Add your own" aria-label="Add an area of expertise" />
                </form>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="gs-h">How will you help?</h2>
            <p className="gs-sub">Free, paid, or both. PathedIn keeps {Math.round(PLATFORM_FEE * 100)}% of paid sessions and you keep the rest. Free guidance is always free.</p>
            <h3 className="gs-h3">Free</h3>
            <ul className="gs-list">
              <li className="gs-row">
                <span className="gs-row__text">
                  <strong>Answer questions in your communities</strong>
                  <span>Your answers count toward your standing as a Guide.</span>
                </span>
                <Toggle label="Answer questions for free" on={d.free.answers} onChange={(v) => patch({ free: { ...d.free, answers: v } })} />
              </li>
              <li className="gs-row">
                <span className="gs-row__text">
                  <strong>Office Hours</strong>
                  <span>
                    <select aria-label="Office Hours day" value={d.officeHours.day} onChange={(e) => patch({ officeHours: { ...d.officeHours, day: +e.target.value } })}>
                      {DAY_NAMES.map((n, i) => (
                        <option key={n} value={i}>
                          {n}s
                        </option>
                      ))}
                    </select>{' '}
                    at{' '}
                    <select aria-label="Office Hours time" value={d.officeHours.hour} onChange={(e) => patch({ officeHours: { ...d.officeHours, hour: +e.target.value } })}>
                      {[8, 9, 12, 17, 18, 19, 20].map((h) => (
                        <option key={h} value={h}>
                          {h % 12 || 12} {h < 12 ? 'AM' : 'PM'}
                        </option>
                      ))}
                    </select>{' '}
                    ·{' '}
                    <select aria-label="Office Hours spots" value={d.officeHours.spots} onChange={(e) => patch({ officeHours: { ...d.officeHours, spots: +e.target.value } })}>
                      {[2, 3, 4, 6].map((n) => (
                        <option key={n} value={n}>
                          {n} spots of {Math.round(60 / n)} min
                        </option>
                      ))}
                    </select>
                  </span>
                </span>
                <Toggle label="Free Office Hours" on={d.free.officeHours} onChange={(v) => patch({ free: { ...d.free, officeHours: v } })} />
              </li>
            </ul>
            <h3 className="gs-h3">Paid</h3>
            <ul className="gs-list">
              {d.services.map((s) => {
                const k = serviceKinds[s.kind];
                const Icon = k.icon;
                return (
                  <li key={s.kind} className={`gs-row gs-row--svc ${s.on ? 'is-on' : ''}`}>
                    <span className="gs-row__icon">
                      <Icon size={17} strokeWidth={1.8} />
                    </span>
                    <span className="gs-row__text">
                      <strong>{k.label}</strong>
                      <span>
                        {k.timed ? `${s.minutes ?? k.minutes} min` : 'Written notes'}
                        {k.per === 'month' ? ' · monthly' : k.per === 'seat' ? ` · ${s.seats} seats` : ''}
                        <AnimatePresence initial={false}>
                          {s.on && (
                            <motion.span key="keep" className="gs-keep" initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={{ duration: 0.3, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>
                              {' · you keep '}
                              <Keep price={s.price} />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </span>
                    </span>
                    {/* Switching a service on is a cascade, like a thermostat waking: the switch, then its price, then what you keep. */}
                    <AnimatePresence initial={false}>
                      {s.on && (
                        <motion.div
                          key="price"
                          className="gs-price-wrap"
                          initial={{ opacity: 0, x: 10, filter: 'blur(3px)' }}
                          animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                          exit={{ opacity: 0, x: 6, filter: 'blur(2px)', transition: { duration: 0.14 } }}
                          transition={{ duration: 0.34, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <PriceStepper label={`${k.label} price`} value={s.price} step={k.per === 'month' ? 20 : 5} onChange={(v) => setService(s.kind, { price: v })} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <Toggle label={`Offer ${k.label}`} on={s.on} onChange={(v) => setService(s.kind, { on: v })} />
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="gs-h">When are you around for paid sessions?</h2>
            <p className="gs-sub">People book into these times. You’ll confirm each booking before it’s final.</p>
            <div className="gs-grid" role="group" aria-label="Availability">
              <span />
              {PARTS.map((p) => (
                <span key={p.key} className="gs-grid__part">
                  {p.label}
                </span>
              ))}
              {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                <div key={day} className="gs-grid__row">
                  <span className="gs-grid__day">{isMobile ? DAY_NAMES[day].slice(0, 3) : DAY_NAMES[day]}</span>
                  {PARTS.map((p) => {
                    const key = `${day}-${p.key}`;
                    const on = d.availability.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        aria-pressed={on}
                        aria-label={`${DAY_NAMES[day]} ${p.label.toLowerCase()}`}
                        className={`gs-cell ${on ? 'is-on' : ''}`}
                        onClick={() => {
                          haptic(4);
                          patch({ availability: on ? d.availability.filter((x) => x !== key) : [...d.availability, key] });
                        }}
                      >
                        {on && (
                          <motion.span className="gs-cell__fill" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={springs.snappy}>
                            <IconCheck size={14} strokeWidth={2.6} />
                          </motion.span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="gs-h">One last look</h2>
            <p className="gs-sub">This is your Guide profile. Your Path sits above it, so people can see why you’re worth asking.</p>
            <dl className="gs-review">
              <div>
                <dt>Moves</dt>
                <dd>{d.transitions.map(([a, b]) => `${wp(a).short} → ${wp(b).short}`).join(', ')}</dd>
              </div>
              <div>
                <dt>Expertise</dt>
                <dd>{d.expertise.join(', ')}</dd>
              </div>
              <div>
                <dt>Free</dt>
                <dd>{[d.free.answers && 'Answers in your communities', d.free.officeHours && `Office Hours, ${DAY_NAMES[d.officeHours.day]}s`].filter(Boolean).join(' · ') || 'None'}</dd>
              </div>
              <div>
                <dt>Paid</dt>
                <dd>
                  {d.services
                    .filter((s) => s.on)
                    .map((s) => `${serviceKinds[s.kind].label} ${priceLabel({ price: s.price, per: serviceKinds[s.kind].per })}`)
                    .join(' · ') || 'None'}
                </dd>
              </div>
              <div>
                <dt>You keep</dt>
                <dd>{Math.round((1 - PLATFORM_FEE) * 100)}% of every paid session, paid out monthly</dd>
              </div>
            </dl>
            <p className="gs-terms">By going live you agree to guide honestly, only on moves you’ve made. You can pause your Guide profile at any time. This prototype takes no payments.</p>
          </>
        )}
      </motion.section>
    </AnimatePresence>
  );

  return (
    <Page
      title={saved?.live ? 'Your Guide profile' : 'Become a Path Guide'}
      subtitle="Help the people a step or two behind you on your Path, for free or for a fee."
      back
      rail={
        <>
          <Preview d={d} />
          <section>
            <h2 className="rail-h">How it works</h2>
            <ul className="gs-how">
              <li>You guide only moves on your own Path, and people see that Path first.</li>
              <li>Office Hours and answers are free. Paid sessions are yours to price.</li>
              <li>PathedIn keeps {Math.round(PLATFORM_FEE * 100)}% of paid sessions. You’re paid monthly.</li>
              <li>Reviews and answers build your standing in each Path Community.</li>
            </ul>
          </section>
        </>
      }
    >
      <ol className="gs-steps" aria-label="Steps">
        {STEPS.map((t, i) => (
          <li key={t} className={`${i === step ? 'is-now' : ''} ${i < step ? 'is-done' : ''}`} aria-current={i === step ? 'step' : undefined}>
            <button type="button" disabled={i > step} onClick={() => go(i)}>
              <span className="gs-steps__dot">{i < step ? <IconCheck size={12} strokeWidth={3} /> : i + 1}</span>
              <span className="gs-steps__label">{t}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="gs-card">
        {body}
        <footer className="gs-foot">
          {step > 0 ? (
            <Button variant="outline" size="medium" onClick={() => go(step - 1)}>
              Back
            </Button>
          ) : (
            <Link to={`/p/${ME}`} className="gs-foot__quiet">
              Not now
            </Link>
          )}
          {step < STEPS.length - 1 ? (
            <Button variant="filled" size="medium" disabled={!canNext} onClick={() => go(step + 1)}>
              Continue
            </Button>
          ) : (
            <Button
              variant="filled"
              size="medium"
              icon={<IconGuidePlus size={16} />}
              onClick={() => {
                goLive();
                if (saved?.live) toast('Guide profile updated');
              }}
            >
              {saved?.live ? 'Save changes' : 'Go live as a Guide'}
            </Button>
          )}
        </footer>
      </div>
      {saved?.live && (
        <button
          type="button"
          className="gs-pause"
          onClick={() => {
            setGuideLive(false);
            toast('Guide profile paused');
            navigate(`/p/${ME}`);
          }}
        >
          Pause your Guide profile
        </button>
      )}
    </Page>
  );
}

