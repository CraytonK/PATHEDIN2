import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Wordmark } from '../components/chrome';
import { IconClose, IconChevronLeft } from '../components/icons';
import { springs } from '../lib/motion';
import { useApp } from '../lib/store';
import { me, people } from '../data/people';
import { sessionsFor } from '../lib/booking';
import './landing.css';

type AuthMode = 'join' | 'signin';

/**
 * The signed-out intro page: a quiet masthead, one enormous line, a sentence of explanation, one action,
 * and the product itself layered off the right edge.
 */
export function Landing({ onAuthed }: { onAuthed: () => void }) {
  const [auth, setAuth] = useState<AuthMode | null>(null);
  useEffect(() => {
    document.title = 'PathedIn — Your path & who’s walked it';
    return () => {
      document.title = 'PathedIn';
    };
  }, []);
  return (
    <div className="landing">
      <header className="landing__bar">
        <div className="landing__bar-inner">
          <a href="#top" className="wordmark landing__logo" aria-label="PathedIn" onClick={(e) => e.preventDefault()}>
            <Wordmark size={30} />
          </a>
          <nav className="landing__nav" aria-label="PathedIn">
            <a href="#how" className="landing__link landing__link--wide">
              How it works
            </a>
            <a href="#guides" className="landing__link landing__link--wide">
              Path Guides
            </a>
            <button className="landing__link" onClick={() => setAuth('signin')}>
              Sign in
            </button>
            <button className="landing__pill" onClick={() => setAuth('join')}>
              Get started
            </button>
          </nav>
        </div>
      </header>

      <main className="landing__hero" id="top">
        <div className="landing__copy">
          <h1 className="landing__title">
            Your path <span className="landing__amp">&amp;</span> who’s walked it
          </h1>
          <p className="landing__sub">A place to map your career, see where it can go, and meet the people already there.</p>
          <button className="landing__cta" onClick={() => setAuth('join')}>
            Start your path
          </button>
        </div>
        <HeroArt />
      </main>

      <section className="landing__how" id="how" aria-label="How PathedIn works">
        <div className="landing__how-inner">
          <div>
            <span className="landing__node landing__node--been" aria-hidden="true" />
            <h2>Where you’ve been</h2>
            <p>Your steps so far, drawn as a line — study, first jobs, the turns you took.</p>
          </div>
          <div>
            <span className="landing__node landing__node--now" aria-hidden="true" />
            <h2>Where you are</h2>
            <p>Find the people standing at the same step, deciding the same things.</p>
          </div>
          <div id="guides">
            <span className="landing__node landing__node--going" aria-hidden="true" />
            <h2>Where you want to go</h2>
            <p>See the real routes there, and ask the Path Guides who already made the move.</p>
          </div>
        </div>
      </section>

      <footer className="landing__foot">
        <nav aria-label="Footer">
          {['Help', 'About', 'How it works', 'Path Guides', 'Communities', 'Privacy', 'Terms'].map((l) => (
            <a key={l} href="#top" onClick={(e) => e.preventDefault()}>
              {l}
            </a>
          ))}
        </nav>
      </footer>

      <AuthModal mode={auth} onMode={setAuth} onClose={() => setAuth(null)} onAuthed={onAuthed} />
    </div>
  );
}

/*
  The product itself, layered: your Path as a transit line in a window, a Path Twin who shares your steps,
  and a Guide's office hours you could book tonight. Real people from the prototype, drawn from the same
  vocabulary as the app. It assembles once, in order: the window, the line, you, then the people.
*/
function HeroArt() {
  const reduce = useReducedMotion();
  const rise = (delay: number) => ({ initial: reduce ? false : { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { ...springs.smooth, delay } });
  const draw = (delay: number, duration = 0.8) => ({ initial: reduce ? false : { pathLength: 0 }, animate: { pathLength: 1 }, transition: { delay, duration, ease: [0.16, 1, 0.3, 1] as const } });
  const pop = (delay: number) => ({ initial: reduce ? false : { scale: 0.4, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { type: 'spring' as const, stiffness: 420, damping: 24, delay } });
  const next = sessionsFor('amara', [], 1)[0];
  const open = next?.slots.filter((x) => !x.taken) ?? [];
  const at = open[0]?.start ?? new Date();
  const stops = [
    { x: 96, label: 'BSc Chemistry', sub: '2017' },
    { x: 214, label: 'Research', sub: '2021' },
    { x: 340, label: 'MSc Chemistry', sub: 'Now' },
    { x: 470, label: 'Next step', sub: '3 routes' },
    { x: 604, label: 'Pharma R&D', sub: 'Destination' },
  ];
  const Y = 214;
  const branch = `M${stops[3].x} ${Y} C ${stops[3].x + 36} ${Y}, ${stops[3].x + 50} ${Y - 52}, ${stops[4].x - 42} ${Y - 52}`;
  return (
    <div className="landing__art" aria-hidden="true">
      <svg viewBox="0 0 680 620" preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id="hero-dots" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.2" fill="var(--separator-strong)" />
          </pattern>
          <radialGradient id="hero-fade" cx="55%" cy="45%" r="60%">
            <stop offset="0" stopColor="#fff" stopOpacity="1" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <mask id="hero-dots-mask">
            <rect width="680" height="620" fill="url(#hero-fade)" />
          </mask>
          <clipPath id="hero-me">
            <circle cx={stops[2].x} cy={Y} r="24" />
          </clipPath>
          <clipPath id="hero-twin">
            <circle cx="48" cy="394" r="22" />
          </clipPath>
          <clipPath id="hero-guide">
            <circle cx="604" cy="561" r="16" />
          </clipPath>
          {/* The future draws on through a mask, so it keeps its dashes. */}
          <mask id="hero-future" maskUnits="userSpaceOnUse">
            <motion.path d={`M${stops[2].x} ${Y} H${stops[4].x}`} stroke="#fff" strokeWidth="14" strokeLinecap="round" fill="none" {...draw(0.95, 0.8)} />
          </mask>
          <mask id="hero-branch" maskUnits="userSpaceOnUse">
            <motion.path d={branch} stroke="#fff" strokeWidth="12" strokeLinecap="round" fill="none" {...draw(1.3, 0.6)} />
          </mask>
          {['daniel', 'wei', 'jonah'].map((id, i) => (
            <clipPath key={id} id={`hero-p-${id}`}>
              <circle cx={452 + i * 17} cy={Y + 92} r="10" />
            </clipPath>
          ))}
        </defs>
        <rect width="680" height="620" fill="url(#hero-dots)" mask="url(#hero-dots-mask)" />

        {/* The window: My Path */}
        <motion.g className="hero-float" {...rise(0.05)}>
          <rect x="40" y="56" width="700" height="330" rx="16" fill="var(--bg-grouped)" stroke="var(--border)" />
          <text x="72" y="96" className="hero-t hero-t--title">
            My Path
          </text>
          <text x="148" y="96" className="hero-t hero-t--muted">
            Where you’ve been, and where you’re heading
          </text>
          <line x1="40" x2="740" y1="122" y2="122" stroke="var(--separator)" />

          {/* The Path: walked in ink, the future dashed in navy. */}
          <motion.path d={`M${stops[0].x} ${Y} H${stops[2].x}`} stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" fill="none" {...draw(0.35, 0.7)} />
          <path d={`M${stops[2].x} ${Y} H${stops[4].x}`} stroke="var(--tint)" strokeWidth="4" strokeLinecap="round" strokeDasharray="0.5 10" fill="none" mask="url(#hero-future)" />
          {/* Another route branches at the next step */}
          <path d={branch} stroke="var(--future-soft)" strokeWidth="3" strokeLinecap="round" strokeDasharray="0.5 8" fill="none" mask="url(#hero-branch)" />
          <motion.circle cx={stops[4].x - 34} cy={Y - 52} r="7" fill="var(--bg-grouped)" stroke="var(--future-soft)" strokeWidth="3" {...pop(1.8)} />

          {stops.map((s, i) => (
            <g key={s.label}>
              {i < 2 && <motion.circle cx={s.x} cy={Y} r="8" fill="var(--ink)" stroke="var(--bg-grouped)" strokeWidth="4" {...pop(0.3 + i * 0.12)} />}
              {i === 3 && (
                <motion.g {...pop(1.15)}>
                  <circle cx={s.x} cy={Y} r="13" fill="var(--bg-grouped)" stroke="var(--tint)" strokeWidth="2.5" strokeDasharray="3 3" />
                  <text x={s.x} y={Y + 5} textAnchor="middle" className="hero-t hero-t--q">
                    ?
                  </text>
                </motion.g>
              )}
              {i === 4 && <motion.circle cx={s.x} cy={Y} r="12" fill="var(--bg-grouped)" stroke="var(--tint)" strokeWidth="4" {...pop(1.5)} />}
              <text x={s.x} y={Y + 52} textAnchor="middle" className={`hero-t ${i === 2 ? 'hero-t--strong' : i === 4 ? 'hero-t--tint' : 'hero-t--label'}`}>
                {s.label}
              </text>
              <text x={s.x} y={Y + 70} textAnchor="middle" className="hero-t hero-t--muted">
                {s.sub}
              </text>
            </g>
          ))}

          {/* You are here */}
          <motion.g {...pop(0.8)}>
            <circle cx={stops[2].x} cy={Y} r="30" fill="var(--bg-grouped)" />
            <circle cx={stops[2].x} cy={Y} r="27" fill="none" stroke="var(--ink)" strokeWidth="3" />
            <image href={me.photo} x={stops[2].x - 24} y={Y - 24} width="48" height="48" clipPath="url(#hero-me)" preserveAspectRatio="xMidYMid slice" />
            <rect x={stops[2].x - 44} y={Y - 64} width="88" height="24" rx="6" fill="var(--primary)" />
            <text x={stops[2].x} y={Y - 48} textAnchor="middle" className="hero-t hero-t--chip">
              You are here
            </text>
          </motion.g>

          {/* People one step ahead */}
          <motion.g {...rise(1.4)}>
            {['daniel', 'wei', 'jonah'].map((id, i) => (
              <g key={id}>
                <circle cx={452 + i * 17} cy={Y + 92} r="12" fill="var(--bg-grouped)" />
                <image href={people[id].photo} x={442 + i * 17} y={Y + 82} width="20" height="20" clipPath={`url(#hero-p-${id})`} preserveAspectRatio="xMidYMid slice" />
              </g>
            ))}
            <text x="510" y={Y + 97} className="hero-t hero-t--muted">
              are one step ahead
            </text>
          </motion.g>
        </motion.g>

        {/* A Path Twin */}
        <motion.g className="hero-float hero-float--lift" {...rise(1.1)}>
          <rect x="0" y="346" width="316" height="96" rx="14" fill="var(--bg-elevated)" stroke="var(--border)" />
          <circle cx="48" cy="394" r="25" fill="var(--bg-elevated)" stroke="var(--border)" />
          <image href={people.sarah.photo} x="26" y="372" width="44" height="44" clipPath="url(#hero-twin)" preserveAspectRatio="xMidYMid slice" />
          <text x="86" y="384" className="hero-t hero-t--strong">
            {people.sarah.name}
          </text>
          <text x="86" y="404" className="hero-t hero-t--tint">
            Path Twin
          </text>
          <text x="86" y="424" className="hero-t hero-t--muted">
            Same 3 steps, same destination
          </text>
        </motion.g>

        {/* A Guide's office hours, bookable */}
        <motion.g className="hero-float hero-float--lift" {...rise(1.35)}>
          <rect x="262" y="468" width="384" height="124" rx="14" fill="var(--bg-elevated)" stroke="var(--border)" />
          <path d="M276 468.5 H340 V591.5 H276 A13.5 13.5 0 0 1 262.5 578 V482 A13.5 13.5 0 0 1 276 468.5 Z" fill="var(--tint-softer)" />
          <line x1="340" x2="340" y1="476" y2="584" stroke="var(--tint-border)" strokeWidth="1.5" strokeDasharray="4 4" />
          <text x="301" y="512" textAnchor="middle" className="hero-t hero-t--dow">
            {at.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
          </text>
          <text x="301" y="546" textAnchor="middle" className="hero-t hero-t--day">
            {at.getDate()}
          </text>
          <text x="301" y="566" textAnchor="middle" className="hero-t hero-t--dow">
            {at.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
          </text>
          <text x="360" y="506" className="hero-t hero-t--strong">
            Office hours with Amara
          </text>
          <text x="360" y="526" className="hero-t hero-t--muted">
            {at.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} · 15 minutes · {open.length} spots open
          </text>
          <rect x="360" y="546" width="108" height="30" rx="8" fill="var(--primary)" />
          <text x="414" y="566" textAnchor="middle" className="hero-t hero-t--btn">
            Book a spot
          </text>
          <circle cx="604" cy="561" r="18" fill="var(--bg-elevated)" stroke="var(--border)" />
          <image href={people.amara.photo} x="588" y="545" width="32" height="32" clipPath="url(#hero-guide)" preserveAspectRatio="xMidYMid slice" />
        </motion.g>
      </svg>
    </div>
  );
}

function GoogleMark() {
  return (
    <span className="auth__mark" aria-hidden="true">
      G
    </span>
  );
}

function MailMark() {
  return (
    <svg className="auth__icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" />
      <path d="m4 6.5 8 6 8-6" />
    </svg>
  );
}

/** "Join PathedIn." / "Welcome back." — Medium's centred sign-in card, with pill buttons. */
function AuthModal({ mode, onMode, onClose, onAuthed }: { mode: AuthMode | null; onMode: (m: AuthMode) => void; onClose: () => void; onAuthed: () => void }) {
  const [email, setEmail] = useState(false);
  const [value, setValue] = useState('');
  const [others, setOthers] = useState(false);
  const returning = useApp((s) => s.returning);
  const forget = useApp((s) => s.forgetAccount);
  const input = useRef<HTMLInputElement>(null);
  const join = mode === 'join';
  // A device that has signed in before is greeted with its account, as on Medium.
  const remembered = !join && returning && !others;
  useEffect(() => {
    if (!mode) return;
    setEmail(false);
    setOthers(false);
    setValue('');
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, onClose]);
  useEffect(() => {
    if (email) input.current?.focus();
  }, [email]);
  const verb = join ? 'Sign up' : 'Sign in';
  const valid = /\S+@\S+\.\S+/.test(value);

  return createPortal(
    <AnimatePresence>
      {mode && (
        <motion.div className="auth-root" role="dialog" aria-modal="true" aria-labelledby="auth-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <div className="auth-scrim" onClick={onClose} />
          <motion.div className="auth" initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }} transition={springs.sheet}>
            <button className="auth__close" onClick={onClose} aria-label="Close">
              <IconClose size={22} strokeWidth={1.5} />
            </button>
            <AnimatePresence mode="wait" initial={false}>
              {remembered && !email ? (
                <motion.div key="remembered" className="auth__body" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <h2 id="auth-title" className="auth__title">
                    Welcome back.
                  </h2>
                  <div className="auth__account">
                    <img src={me.photo} alt="" width={64} height={64} />
                    <strong>{me.name}</strong>
                    <span>ma•••••@mail.utoronto.ca</span>
                  </div>
                  <div className="auth__options">
                    <button className="auth__option auth__option--primary" onClick={onAuthed}>
                      Continue as {me.first}
                    </button>
                  </div>
                  <button className="auth__forget" onClick={forget}>
                    Forget this account
                  </button>
                  <p className="auth__switch">
                    Not your account? <button onClick={() => setOthers(true)}>More sign-in options</button>
                  </p>
                </motion.div>
              ) : !email ? (
                <motion.div key={`${mode}-options`} className="auth__body" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <h2 id="auth-title" className="auth__title">
                    {join ? 'Join PathedIn.' : 'Welcome back.'}
                  </h2>
                  <div className="auth__options">
                    <button className="auth__option" onClick={onAuthed}>
                      <GoogleMark />
                      {verb} with Google
                    </button>
                    <button className="auth__option" onClick={() => setEmail(true)}>
                      <MailMark />
                      {verb} with email
                    </button>
                  </div>
                  <p className="auth__switch">
                    {join ? 'Already have an account?' : 'No account?'}{' '}
                    <button onClick={() => onMode(join ? 'signin' : 'join')}>{join ? 'Sign in' : 'Create one'}</button>
                  </p>
                  <p className="auth__legal">
                    Click “{verb}” to agree to PathedIn’s Terms of Service and acknowledge that PathedIn’s Privacy Policy applies to you.
                  </p>
                </motion.div>
              ) : (
                <motion.form
                  key={`${mode}-email`}
                  className="auth__body"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (valid) onAuthed();
                  }}
                >
                  <h2 id="auth-title" className="auth__title">
                    {verb} with email
                  </h2>
                  <p className="auth__lede">{join ? 'Enter your email address to create an account.' : 'Enter the email address associated with your account.'}</p>
                  <label className="auth__field">
                    <span>Your email</span>
                    <input ref={input} type="email" autoComplete="email" value={value} onChange={(e) => setValue(e.target.value)} />
                  </label>
                  <button type="submit" className="auth__submit" disabled={!valid}>
                    Continue
                  </button>
                  <button type="button" className="auth__back" onClick={() => setEmail(false)}>
                    <IconChevronLeft size={16} strokeWidth={2} /> All {join ? 'sign up' : 'sign in'} options
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
