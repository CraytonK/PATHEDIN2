import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Wordmark } from '../components/chrome';
import { IconClose, IconChevronLeft } from '../components/icons';
import { springs } from '../lib/motion';
import './landing.css';

type AuthMode = 'join' | 'signin';

/**
 * The signed-out intro page, laid out like Medium's: a ruled masthead, one enormous serif line,
 * a single sentence of explanation, one black pill — and an illustration bleeding off the edge.
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

/* A bold, flat composition of the brand's Path: been → now → going, with routes branching off. */
function HeroArt() {
  const reduce = useReducedMotion();
  const d = (delay: number, dur = 0.9) => ({ initial: reduce ? false : { pathLength: 0 }, animate: { pathLength: 1 }, transition: { delay, duration: dur, ease: [0.45, 0, 0.2, 1] as const } });
  const pop = (delay: number) => ({ initial: reduce ? false : { scale: 0 }, animate: { scale: 1 }, transition: { type: 'spring' as const, stiffness: 420, damping: 22, delay } });
  return (
    <div className="landing__art" aria-hidden="true">
      <svg viewBox="0 0 640 720" preserveAspectRatio="xMidYMid slice">
        <defs>
          <mask id="hero-future" maskUnits="userSpaceOnUse">
            <motion.path d="M330 400 L520 210" stroke="#fff" strokeWidth="40" strokeLinecap="round" fill="none" {...d(1.1, 0.7)} />
          </mask>
        </defs>
        {/* Ground shapes */}
        <circle cx="420" cy="360" r="300" fill="var(--landing-sky)" />
        <rect x="470" y="470" width="240" height="240" fill="var(--landing-celestial)" transform="rotate(45 590 590)" />
        <circle cx="560" cy="90" r="120" fill="var(--landing-sky-2)" />
        {/* Routes not taken */}
        <path d="M330 400 C 430 440, 470 520, 560 560" fill="none" stroke="var(--landing-route)" strokeWidth="10" strokeLinecap="round" strokeDasharray="2 20" />
        <path d="M330 400 C 300 300, 260 250, 200 170" fill="none" stroke="var(--landing-route)" strokeWidth="10" strokeLinecap="round" strokeDasharray="2 20" />
        <circle cx="560" cy="560" r="16" fill="var(--landing-bg)" stroke="var(--landing-route)" strokeWidth="8" />
        <circle cx="200" cy="170" r="16" fill="var(--landing-bg)" stroke="var(--landing-route)" strokeWidth="8" />
        {/* The Path */}
        <motion.path d="M140 590 L330 400" stroke="var(--ink)" strokeWidth="26" strokeLinecap="round" fill="none" {...d(0.3, 0.7)} />
        <path d="M330 400 L520 210" stroke="var(--landing-future)" strokeWidth="26" strokeLinecap="round" strokeDasharray="1 44" fill="none" mask="url(#hero-future)" />
        <motion.circle cx="140" cy="590" r="44" fill="var(--ink)" style={{ transformOrigin: '140px 590px' }} {...pop(0.15)} />
        <motion.g style={{ transformOrigin: '330px 400px' }} {...pop(0.95)}>
          <circle cx="330" cy="400" r="50" fill="var(--landing-bg)" stroke="var(--ink)" strokeWidth="18" />
          <circle cx="330" cy="400" r="17" fill="var(--landing-future)" />
        </motion.g>
        <motion.circle cx="520" cy="210" r="50" fill="var(--landing-bg)" stroke="var(--landing-future)" strokeWidth="18" style={{ transformOrigin: '520px 210px' }} {...pop(1.7)} />
        {/* People along the way */}
        <g fill="var(--ink)">
          <circle cx="206" cy="470" r="9" />
          <circle cx="232" cy="494" r="9" />
          <circle cx="598" cy="236" r="9" />
          <circle cx="612" cy="262" r="9" />
        </g>
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
  const input = useRef<HTMLInputElement>(null);
  const join = mode === 'join';
  useEffect(() => {
    if (!mode) return;
    setEmail(false);
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
              {!email ? (
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
