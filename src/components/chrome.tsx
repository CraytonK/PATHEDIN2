import { AnimatePresence, motion, useDragControls, type PanInfo } from 'framer-motion';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { me } from '../data/people';
import { communities } from '../data/communities';
import { notificationList, conversationList } from '../data/social';
import { easings, springs, useIsMobile, useMediaQuery, useScrolled, haptic } from '../lib/motion';
import { useApp } from '../lib/store';
import { useUI } from '../lib/ui';
import { switchTheme } from '../lib/theme';
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
  IconMenu,
  IconUser,
  IconCompose,
  IconDoc,
  IconSignpost,
  IconQuestion,
  IconFlag,
  IconPlus,
} from './icons';
import { IconButton, Rolling } from './ui';
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

/* ── Desktop: Medium-style top bar and left sidebar ─────────── */

/** The sidebar sits beside the content when there's room for both; otherwise it slides over it. */
export const useSidebarDocked = () => useMediaQuery('(min-width: 1320px)');

export function useSidebarVisible() {
  const docked = useSidebarDocked();
  const sidebar = useApp((s) => s.sidebar);
  return docked && sidebar;
}

export function TopBar() {
  const { pathname } = useLocation();
  const unread = useUnread();
  const setSearch = useUI((s) => s.setSearch);
  const navigate = useNavigate();
  const docked = useSidebarDocked();
  const sidebar = useApp((s) => s.sidebar);
  const toggleSidebar = useApp((s) => s.toggleSidebar);
  const drawer = useUI((s) => s.drawer);
  const setDrawer = useUI((s) => s.setDrawer);
  const open = docked ? sidebar : drawer;
  const scrolled = useScrolled();
  return (
    <header className={`mbar ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="mbar__left">
        <button
          className="mbar__menu"
          aria-label={open ? 'Hide sidebar' : 'Show sidebar'}
          aria-expanded={open}
          aria-controls="sidebar"
          onClick={() => (docked ? toggleSidebar() : setDrawer(!drawer))}
        >
          <IconMenu size={20} strokeWidth={1.6} />
        </button>
        <Link to="/" className="wordmark" aria-label="PathedIn home">
          <Wordmark />
        </Link>
        <button className="mbar__search" onClick={() => setSearch(true)} aria-keyshortcuts="Meta+K Control+K">
          <IconSearch size={15} strokeWidth={1.8} />
          <span>Search or jump to…</span>
          <kbd className="kbd">⌘K</kbd>
        </button>
      </div>
      <div className="mbar__right">
        <Link to="/write" className="mbar__write">
          <IconCompose size={16} strokeWidth={1.8} />
          <span>Write</span>
        </Link>
        <IconButton label="Messages" tipPos="below" badge={unread.messages} onClick={() => navigate('/messages')} active={pathname.startsWith('/messages')}>
          <IconMessage size={19} strokeWidth={1.6} filled={pathname.startsWith('/messages')} />
        </IconButton>
        <IconButton label="Notifications" tipPos="below" badge={unread.notifications} onClick={() => navigate('/notifications')} active={pathname.startsWith('/notifications')}>
          <IconBell size={19} strokeWidth={1.6} filled={pathname.startsWith('/notifications')} />
        </IconButton>
        <AccountMenu />
      </div>
    </header>
  );
}

type SideItem = { to: string; label: string; icon: (p: { size?: number; filled?: boolean; strokeWidth?: number }) => ReactNode; match: (p: string) => boolean; badge?: number };

export function Sidebar() {
  const { pathname } = useLocation();
  const unread = useUnread();
  const docked = useSidebarDocked();
  const sidebar = useApp((s) => s.sidebar);
  const joined = useApp((s) => s.joined);
  const drawer = useUI((s) => s.drawer);
  const setDrawer = useUI((s) => s.setDrawer);
  const open = docked ? sidebar : drawer;

  useEffect(() => {
    setDrawer(false);
  }, [pathname, setDrawer]);
  useEffect(() => {
    if (docked || !drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [docked, drawer, setDrawer]);

  const groups: SideItem[][] = [
    [
      { to: '/', label: 'Home', icon: IconHome, match: (p) => p === '/' },
      { to: '/path', label: 'My Path', icon: IconPath, match: (p) => p.startsWith('/path') },
      { to: '/discover', label: 'Discover', icon: IconCompass, match: (p) => p.startsWith('/discover') },
      { to: '/network', label: 'Network', icon: IconPeople, match: (p) => p.startsWith('/network') || p.startsWith('/connections') },
      { to: '/communities', label: 'Communities', icon: IconCommunity, match: (p) => p.startsWith('/communities') },
    ],
    [
      { to: '/saved', label: 'Saved', icon: IconBookmark, match: (p) => p.startsWith('/saved') },
      { to: `/p/${me.id}`, label: 'Profile', icon: IconUser, match: (p) => p === `/p/${me.id}` },
      { to: '/requests', label: 'Path Requests', icon: IconSend, match: (p) => p.startsWith('/requests'), badge: unread.incoming },
    ],
    [
      { to: '/guides', label: 'Path Guides', icon: IconSignpost, match: (p) => p.startsWith('/guides') },
      { to: '/stories', label: 'Stories', icon: IconDoc, match: (p) => p.startsWith('/stories') },
      { to: '/questions', label: 'Questions', icon: IconQuestion, match: (p) => p.startsWith('/questions') },
      { to: '/decisions', label: 'Decision Points', icon: IconFlag, match: (p) => p.startsWith('/decisions') },
    ],
  ];
  const mine = Object.keys(joined)
    .filter((k) => joined[k] && communities[k])
    .map((k) => communities[k]);

  return (
    <>
      <AnimatePresence>
        {!docked && drawer && (
          <motion.div className="sidebar-scrim" onClick={() => setDrawer(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
        )}
      </AnimatePresence>
      <nav id="sidebar" className={`sidebar ${open ? 'is-open' : ''} ${docked ? 'is-docked' : 'is-overlay'}`} aria-label="Primary" aria-hidden={!open} inert={!open}>
        {groups.map((g, i) => (
          <ul key={i} className="sidebar__group">
            {g.map((item) => {
              const active = item.match(pathname);
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink to={item.to} className={`sidebar__item ${active ? 'is-active' : ''}`} aria-current={active ? 'page' : undefined}>
                    {active && <motion.span layoutId="sidebar-active" className="sidebar__active" transition={springs.snappy} />}
                    <span className="sidebar__icon">
                      <Icon size={18} filled={active} strokeWidth={1.7} />
                    </span>
                    <span className="sidebar__label">{item.label}</span>
                    {!!item.badge && <span className="sidebar__badge"><Rolling value={item.badge} /></span>}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        ))}
        <div className="sidebar__group sidebar__following">
          <Link to="/communities" className="sidebar__item">
            <span className="sidebar__icon">
              <IconCommunity size={24} strokeWidth={1.5} />
            </span>
            <span className="sidebar__label">Following</span>
          </Link>
          <ul className="sidebar__mine">
            {mine.map((c) => (
              <li key={c.id}>
                <NavLink to={`/c/${c.id}`} className={`sidebar__community ${pathname === `/c/${c.id}` ? 'is-active' : ''}`}>
                  <span className="sidebar__dot" aria-hidden="true" />
                  <span className="truncate">{c.title}</span>
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="sidebar__suggest">
            <IconPlus size={20} strokeWidth={1.5} />
            <p>
              Find people and communities on your Path.
              <Link to="/network">See suggestions</Link>
            </p>
          </div>
        </div>
      </nav>
    </>
  );
}

function AccountMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const theme = useApp((s) => s.theme);
  const signOut = useApp((s) => s.signOut);
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
              <button className="menu__item" onClick={(e) => switchTheme(isDark ? 'light' : 'dark', e)}>
                {isDark ? <IconSun size={19} /> : <IconMoon size={19} />} {isDark ? 'Light appearance' : 'Dark appearance'}
              </button>
            </div>
            <div className="menu__group">
              <button
                className="menu__item menu__item--quiet"
                onClick={() => {
                  setOpen(false);
                  signOut();
                  navigate('/');
                }}
              >
                Sign out
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
  // No pop on first paint; only when you change tabs.
  const settled = useRef(false);
  useEffect(() => {
    settled.current = true;
  }, []);
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
              {/* The chosen tab's icon fills and settles into place, like a tab bar on iPhone. */}
              <motion.span
                key={active ? 'on' : 'off'}
                className="tabbar__glyph"
                initial={active && settled.current ? { scale: 0.78 } : false}
                animate={{ scale: 1 }}
                transition={springs.settle}
              >
                <Icon size={27} filled={active} strokeWidth={active ? 1.9 : 1.6} />
              </motion.span>
              {badge > 0 && <span className="badge t-caption2"><Rolling value={badge} /></span>}
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
  rail,
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
  /** Medium's right-hand column. On iPhone it follows the page content. */
  rail?: ReactNode;
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

  const withRail = !!rail && !isMobile;
  return (
    <div className={`page ${wide ? 'page--wide' : ''} ${withRail ? 'page--rail' : ''} ${className}`}>
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
      <PageColumns rail={withRail ? rail : undefined}>
      <div className={`page__header ${hideHeaderOnDesktop ? 'page__header--mobile-only' : ''} ${!large ? 'page__header--bare' : ''} ${!large && isMobile ? 'visually-hidden' : ''}`}>
        {!isMobile && back && (
          <button className="page__back t-subhead" onClick={goBack}>
            <IconChevronLeft size={16} strokeWidth={2.4} />
            {backLabel}
          </button>
        )}
        <div className={`page__title-row ${!large ? 'visually-hidden' : ''}`}>
          <div className="page__title-block">
            <h1 className="t-large-title page__title">{title}</h1>
          </div>
          {(largeTrailing || (!isMobile && trailing)) && <div className="page__trailing">{largeTrailing ?? trailing}</div>}
        </div>
        {/* The subtitle runs the full width, so a button beside the title never squeezes it. */}
        {subtitle && <p className={`page__subtitle t-callout c-2 ${!large ? 'visually-hidden' : ''}`}>{subtitle}</p>}
      </div>
      <div ref={sentinel} className="page__sentinel" />
      <div className="page__body">{children}</div>
      {rail && isMobile && <div className="page__rail-mobile">{rail}</div>}
      </PageColumns>
    </div>
  );
}

/** Medium's two columns: the reading column, and a quiet right-hand column behind a full-height hairline. */
function PageColumns({ rail, children }: { rail?: ReactNode; children: ReactNode }) {
  if (!rail) return <>{children}</>;
  return (
    <div className="page__cols">
      <div className="page__main">{children}</div>
      <aside className="page__rail">{rail}</aside>
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
              exit={{ x: width + 40, transition: { duration: 0.3, ease: [0.4, 0, 1, 1] } }}
              transition={easings.drawer}
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
                initial={{ opacity: 0, scale: 0.98, y: 12 }}
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
