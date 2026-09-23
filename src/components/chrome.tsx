import { AnimatePresence, motion, useDragControls, type PanInfo } from 'framer-motion';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { me } from '../data/people';
import { notificationList, conversationList } from '../data/social';
import { springs, useIsMobile, haptic } from '../lib/motion';
import { useApp } from '../lib/store';
import { useUI } from '../lib/ui';
import {
  IconBell,
  IconChevronLeft,
  IconCommunity,
  IconCompass,
  IconHome,
  IconMessage,
  IconPath,
  IconPeople,
  IconSearch,
  IconClose,
  IconBookmark,
  IconSend,
  IconMoon,
  IconSun,
} from './icons';
import { IconButton } from './ui';
import './chrome.css';

/* ── Primary sections ───────────────────────────────────────── */

const sections = [
  { to: '/', label: 'Home', icon: IconHome, match: (p: string) => p === '/' },
  { to: '/discover', label: 'Discover', icon: IconCompass, match: (p: string) => p.startsWith('/discover') },
  { to: '/path', label: 'My Path', icon: IconPath, match: (p: string) => p.startsWith('/path') },
  {
    to: '/network',
    label: 'Network',
    icon: IconPeople,
    match: (p: string) => ['/network', '/guides', '/connections', '/requests'].some((x) => p.startsWith(x)),
  },
  { to: '/communities', label: 'Communities', icon: IconCommunity, match: (p: string) => p.startsWith('/communities') || p.startsWith('/c/') },
];
const desktopOrder = ['/', '/path', '/discover', '/network', '/communities'];

/* Screens pushed from a section belong to it; anything else keeps the last section active, like a tab's navigation stack. */
const owners: [RegExp, string][] = [
  [/^\/(stories|questions|decisions)/, '/discover'],
  [/^\/(messages|notifications|saved|search)/, '/'],
];
let lastSection = '/';
function useActiveSection(pathname: string): string {
  const direct = sections.find((s) => s.match(pathname))?.to ?? owners.find(([re]) => re.test(pathname))?.[1];
  if (direct) lastSection = direct;
  return direct ?? lastSection;
}

export function useUnread() {
  const read = useApp((s) => s.readNotifications);
  const readThreads = useApp((s) => s.readThreads);
  const requests = useApp((s) => s.requests);
  const notifications = read.all ? 0 : notificationList.filter((n) => n.unread).length;
  const messages = conversationList.reduce((n, c) => n + (readThreads[c.id] ? 0 : c.unread), 0);
  const incoming = requests.filter((r) => r.to === me.id && r.status === 'pending').length;
  return { notifications, messages, incoming };
}

/* ── Desktop top bar ────────────────────────────────────────── */

export function TopBar() {
  const { pathname } = useLocation();
  const unread = useUnread();
  const setSearch = useUI((s) => s.setSearch);
  const navigate = useNavigate();
  const ordered = desktopOrder.map((to) => sections.find((s) => s.to === to)!);
  const current = useActiveSection(pathname);
  return (
    <header className="topbar">
      <div className="topbar__inner">
        <Link to="/" className="wordmark" aria-label="PathedIn home">
          <Wordmark />
        </Link>
        <nav className="topbar__nav" aria-label="Primary">
          {ordered.map((s) => {
            const active = s.to === current;
            return (
              <NavLink key={s.to} to={s.to} className={`topbar__link ${active ? 'is-active' : ''}`} aria-current={active ? 'page' : undefined}>
                {s.label}
                {active && <motion.span layoutId="topbar-indicator" className="topbar__indicator" transition={springs.snappy} />}
              </NavLink>
            );
          })}
        </nav>
        <div className="topbar__actions">
          <button className="topbar__search" onClick={() => setSearch(true)}>
            <IconSearch size={17} />
            <span>Search destinations, people…</span>
            <kbd>⌘K</kbd>
          </button>
          <IconButton label="Messages" badge={unread.messages} onClick={() => navigate('/messages')} active={pathname.startsWith('/messages')}>
            <IconMessage size={22} filled={pathname.startsWith('/messages')} />
          </IconButton>
          <IconButton label="Notifications" badge={unread.notifications} onClick={() => navigate('/notifications')} active={pathname.startsWith('/notifications')}>
            <IconBell size={22} filled={pathname.startsWith('/notifications')} />
          </IconButton>
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}

function AccountMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const theme = useApp((s) => s.theme);
  const setTheme = useApp((s) => s.setTheme);
  const unread = useUnread();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const on = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener('pointerdown', on);
    return () => window.removeEventListener('pointerdown', on);
  }, [open]);
  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  return (
    <div className="account" ref={ref}>
      <motion.button className="account__btn" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} whileTap={{ scale: 0.92 }} transition={springs.press}>
        <img src={me.photo} alt="Your profile" width={30} height={30} />
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="menu"
            role="menu"
            initial={{ opacity: 0, scale: 0.94, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.12 } }}
            transition={springs.snappy}
          >
            <button className="menu__profile" onClick={() => go(`/p/${me.id}`)}>
              <img src={me.photo} alt="" width={40} height={40} />
              <span>
                <span className="t-headline">{me.name}</span>
                <span className="t-footnote c-2">View your profile</span>
              </span>
            </button>
            <div className="menu__group">
              <button className="menu__item" onClick={() => go('/requests')}>
                <IconSend size={19} /> Path Requests {unread.incoming > 0 && <span className="menu__count">{unread.incoming}</span>}
              </button>
              <button className="menu__item" onClick={() => go('/connections')}>
                <IconPeople size={19} /> Connections
              </button>
              <button className="menu__item" onClick={() => go('/saved')}>
                <IconBookmark size={19} /> Saved
              </button>
            </div>
            <div className="menu__group">
              <button className="menu__item" onClick={() => setTheme(isDark ? 'light' : 'dark')}>
                {isDark ? <IconSun size={19} /> : <IconMoon size={19} />} {isDark ? 'Light appearance' : 'Dark appearance'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** The PathedIn symbol from the brand kit: three nodes on a 45° vector — been, now, going. */
export function BrandMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="16 16 68 68" aria-hidden="true" className="brandmark">
      <line x1="30" y1="70" x2="50" y2="50" stroke="var(--ink)" strokeWidth="5" strokeLinecap="round" />
      <line x1="50" y1="50" x2="70" y2="30" stroke="var(--tint)" strokeWidth="5" strokeLinecap="round" strokeDasharray="4 7" />
      <circle cx="30" cy="70" r="8.5" fill="var(--ink)" />
      <circle cx="50" cy="50" r="8.5" fill="var(--bg)" stroke="var(--ink)" strokeWidth="3.5" />
      <circle cx="50" cy="50" r="3.2" fill="var(--tint)" />
      <circle cx="70" cy="30" r="8.5" fill="var(--bg)" stroke="var(--tint)" strokeWidth="3.5" />
    </svg>
  );
}

export function Wordmark({ size = 26 }: { size?: number }) {
  return (
    <span className="wordmark__inner">
      <BrandMark size={size} />
      <span className="wordmark__text">PathedIn</span>
    </span>
  );
}

/* ── Mobile tab bar ─────────────────────────────────────────── */

export function TabBar() {
  const { pathname } = useLocation();
  const unread = useUnread();
  const current = useActiveSection(pathname);
  return (
    <nav className="tabbar" aria-label="Primary">
      {sections.map((s) => {
        const active = s.to === current;
        const Icon = s.icon;
        const badge = s.to === '/network' ? unread.incoming : 0;
        return (
          <NavLink
            key={s.to}
            to={s.to}
            className={`tabbar__item ${active ? 'is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
            onClick={() => {
              haptic(5);
              if (active) window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <motion.span className="tabbar__icon" whileTap={{ scale: 0.86 }} transition={springs.press}>
              <Icon size={27} filled={active} strokeWidth={active ? 1.9 : 1.6} />
              {badge > 0 && <span className="badge t-caption2">{badge}</span>}
            </motion.span>
            <span className="tabbar__label">{s.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

/* ── Page with an iOS navigation bar and large title ────────── */

export function Page({
  title,
  large = true,
  subtitle,
  back,
  trailing,
  largeTrailing,
  children,
  className = '',
  wide,
  hideHeaderOnDesktop,
  eyebrow,
}: {
  title: string;
  large?: boolean;
  subtitle?: ReactNode;
  back?: string | boolean;
  trailing?: ReactNode;
  largeTrailing?: ReactNode;
  children: ReactNode;
  className?: string;
  wide?: boolean;
  hideHeaderOnDesktop?: boolean;
  eyebrow?: ReactNode;
}) {
  const sentinel = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting), { rootMargin: '-52px 0px 0px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const goBack = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate(typeof back === 'string' && back.startsWith('/') ? back : '/');
  };
  const backLabel = typeof back === 'string' && !back.startsWith('/') ? back : 'Back';

  return (
    <div className={`page ${wide ? 'page--wide' : ''} ${className}`}>
      {isMobile && (
        <header className={`navbar ${scrolled || !large ? 'is-scrolled' : ''}`}>
          <div className="navbar__side">
            {back && (
              <button className="navbar__back" onClick={goBack}>
                <IconChevronLeft size={22} />
                {/* Like UINavigationBar, a long previous title collapses to "Back" when the inline title needs the room. */}
                <span>{!large && backLabel.length > 8 ? 'Back' : backLabel}</span>
              </button>
            )}
          </div>
          <motion.h1
            className="navbar__title t-headline"
            initial={false}
            animate={{ opacity: scrolled || !large ? 1 : 0, y: scrolled || !large ? 0 : 4 }}
            transition={{ duration: 0.18 }}
            aria-hidden={large}
          >
            {title}
          </motion.h1>
          <div className="navbar__side navbar__side--end">{trailing}</div>
        </header>
      )}
      <div className={`page__header ${hideHeaderOnDesktop ? 'page__header--mobile-only' : ''} ${!large ? 'page__header--bare' : ''} ${!large && isMobile ? 'visually-hidden' : ''}`}>
        {!isMobile && back && (
          <button className="page__back t-subhead" onClick={goBack}>
            <IconChevronLeft size={16} strokeWidth={2.4} />
            {backLabel}
          </button>
        )}
        <div className={`page__title-row ${!large ? 'visually-hidden' : ''}`}>
          <div className="page__title-block">
            {eyebrow && <div className="page__eyebrow t-eyebrow">{eyebrow}</div>}
            <h1 className="t-large-title page__title">{title}</h1>
            {subtitle && <p className="page__subtitle t-callout c-2">{subtitle}</p>}
          </div>
          {(largeTrailing || (!isMobile && trailing)) && <div className="page__trailing">{largeTrailing ?? trailing}</div>}
        </div>
      </div>
      <div ref={sentinel} className="page__sentinel" />
      <div className="page__body">{children}</div>
    </div>
  );
}

/* ── Sheet: bottom sheet with detents on iPhone, sheet or inspector on larger screens ── */

export function Sheet({
  open,
  onClose,
  children,
  title,
  detent = 'large',
  desktop = 'modal',
  width = 560,
  label,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: ReactNode;
  detent?: 'medium' | 'large';
  desktop?: 'modal' | 'side';
  width?: number;
  label?: string;
}) {
  const isMobile = useIsMobile();
  const controls = useDragControls();
  const [at, setAt] = useState<'medium' | 'large'>(detent);
  const [vh, setVh] = useState(window.innerHeight);

  useLayoutEffect(() => {
    if (open) setAt(detent);
  }, [open, detent]);
  useEffect(() => {
    const on = () => setVh(window.innerHeight);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const sheetH = vh - 54;
  const mediumY = sheetH * 0.46;
  const y = at === 'large' ? 0 : mediumY;

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const endY = y + info.offset.y + info.velocity.y * 0.2;
    if (endY > sheetH * 0.72 || info.velocity.y > 900) {
      if (at === 'large' && detent === 'medium' && endY < sheetH * 0.8 && info.velocity.y < 1600) setAt('medium');
      else onClose();
    } else if (endY > mediumY * 0.55) setAt('medium');
    else setAt('large');
    haptic(5);
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div key="sheet" className={`sheet-root ${isMobile ? 'is-mobile' : `is-${desktop}`}`} role="dialog" aria-modal="true" aria-label={label}>
          <motion.div className="sheet-scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} />
          {isMobile ? (
            <motion.div
              className="sheet sheet--mobile"
              style={{ height: sheetH }}
              initial={{ y: sheetH }}
              animate={{ y }}
              exit={{ y: sheetH }}
              transition={springs.sheet}
              drag="y"
              dragControls={controls}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: sheetH }}
              dragElastic={{ top: 0.04, bottom: 0.4 }}
              onDragEnd={onDragEnd}
            >
              <div className="sheet__grab" onPointerDown={(e) => controls.start(e)}>
                <span className="sheet__grabber" />
                {title && (
                  <div className="sheet__titlebar">
                    <div className="sheet__title t-headline">{title}</div>
                    <button className="sheet__close" onClick={onClose} aria-label="Close">
                      <IconClose size={15} strokeWidth={2.6} />
                    </button>
                  </div>
                )}
              </div>
              <div className="sheet__content" style={{ paddingBottom: at === 'medium' ? mediumY + 24 : undefined }}>
                {children}
              </div>
            </motion.div>
          ) : desktop === 'side' ? (
            <motion.div
              className="sheet sheet--side"
              style={{ width }}
              initial={{ x: width + 40 }}
              animate={{ x: 0 }}
              exit={{ x: width + 40 }}
              transition={springs.sheet}
            >
              {title && (
                <div className="sheet__titlebar sheet__titlebar--desktop">
                  <div className="sheet__title t-headline">{title}</div>
                  <button className="sheet__close" onClick={onClose} aria-label="Close">
                    <IconClose size={15} strokeWidth={2.6} />
                  </button>
                </div>
              )}
              <div className="sheet__content">{children}</div>
            </motion.div>
          ) : (
            <div className="sheet-center">
              <motion.div
                className="sheet sheet--modal"
                style={{ width: `min(${width}px, calc(100vw - 48px))` }}
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.16 } }}
                transition={springs.sheet}
              >
                {title && (
                  <div className="sheet__titlebar sheet__titlebar--desktop">
                    <div className="sheet__title t-headline">{title}</div>
                    <button className="sheet__close" onClick={onClose} aria-label="Close">
                      <IconClose size={15} strokeWidth={2.6} />
                    </button>
                  </div>
                )}
                <div className="sheet__content">{children}</div>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ── Toast (HUD-style confirmation) ─────────────────────────── */

export function ToastLayer() {
  const toast = useUI((s) => s.toast);
  return createPortal(
    <div className="toast-wrap" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            className="toast t-subhead"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.15 } }}
            transition={springs.snappy}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
