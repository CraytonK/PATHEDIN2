import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BrowserRouter, HashRouter, Route, Routes, useLocation, useNavigationType } from 'react-router-dom';
import { Sidebar, TabBar, TopBar, ToastLayer, useSidebarVisible } from './components/chrome';
import { PeekLayer } from './components/Peek';
import { PathSplash } from './components/PathSplash';
import { CompareLayer } from './components/path/Compare';
import { RequestLayer } from './components/RequestComposer';
import { SearchLayer } from './components/SearchLayer';
import { useIsMobile } from './lib/motion';
import { useApp } from './lib/store';
import { useUI } from './lib/ui';
import { Home } from './screens/Home';
import { MyPath } from './screens/MyPath';
import { Discover } from './screens/Discover';
import { Network } from './screens/Network';
import { Guides } from './screens/Guides';
import { Communities } from './screens/Communities';
import { CommunityScreen } from './screens/Community';
import { Profile } from './screens/Profile';
import { Stories } from './screens/Stories';
import { StoryScreen } from './screens/Story';
import { Questions } from './screens/Questions';
import { QuestionScreen } from './screens/Question';
import { Decisions } from './screens/Decisions';
import { DecisionScreen } from './screens/Decision';
import { Requests } from './screens/Requests';
import { Connections } from './screens/Connections';
import { Messages } from './screens/Messages';
import { Notifications } from './screens/Notifications';
import { SearchScreen } from './screens/Search';
import { Saved } from './screens/Saved';
import { NotFound } from './screens/NotFound';
import { Landing } from './screens/Landing';

const Router = __HASH_ROUTER__ ? HashRouter : BrowserRouter;

export function App() {
  return (
    <Router>
      <MotionConfig reducedMotion="user">
        <Shell />
      </MotionConfig>
    </Router>
  );
}

/** Only touch data-theme when the viewer picks an appearance, so a theme stamped by an embedding host survives. */
let themeSetByApp = false;
function useTheme() {
  const theme = useApp((s) => s.theme);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      if (themeSetByApp) delete root.dataset.theme;
      themeSetByApp = false;
      return;
    }
    root.dataset.theme = theme;
    themeSetByApp = true;
    // An explicit choice (light by default) wins over a theme stamped later by an embedding host.
    const mo = new MutationObserver(() => {
      if (root.dataset.theme !== theme) root.dataset.theme = theme;
    });
    mo.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, [theme]);
}

/** Restore scroll on back, start at the top on push — like a navigation stack. */
function useScrollMemory() {
  const location = useLocation();
  const type = useNavigationType();
  const positions = useRef(new Map<string, number>());
  const lastKey = useRef(location.key);
  useLayoutEffect(() => {
    positions.current.set(lastKey.current, window.scrollY);
    lastKey.current = location.key;
  });
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  }, []);
  return { type, restore: () => window.scrollTo(0, type === 'POP' ? (positions.current.get(location.key) ?? 0) : 0) };
}

function Shell() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const { type, restore } = useScrollMemory();
  const setSearch = useUI((s) => s.setSearch);
  const sidebar = useSidebarVisible();
  const signedIn = useApp((s) => s.signedIn);
  const signIn = useApp((s) => s.signIn);
  const [splash, setSplash] = useState(false);
  const endSplash = useCallback(() => setSplash(false), []);
  useTheme();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearch(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setSearch]);

  const back = type === 'POP';
  // Like iOS Messages, a conversation takes the whole screen and hides the tab bar.
  const inThread = isMobile && (/^\/messages\/.+/.test(location.pathname) || (location.pathname === '/messages' && location.search.includes('to=')));
  // Messages keeps its own split view on desktop, so thread changes shouldn't animate the whole page.
  const routeKey = location.pathname.startsWith('/messages') && !isMobile ? '/messages' : location.pathname;

  // Signing in plays the Path splash; the app appears underneath it once it has covered the page.
  const splashLayer = splash && <PathSplash onCovered={signIn} onDone={endSplash} />;
  // Both branches keep the splash in the same slot, so it keeps playing across the switch.
  if (!signedIn) {
    return (
      <>
        <Landing onAuthed={() => setSplash(true)} />
        {splashLayer}
      </>
    );
  }

  return (
    <>
      <div className={`app ${isMobile ? (inThread ? 'app--thread' : 'app--mobile') : 'app--desktop'} ${!isMobile && sidebar ? 'app--sidebar' : ''}`}>
        {!isMobile && <TopBar />}
        {!isMobile && <Sidebar />}
        <AnimatePresence mode="wait" initial={false} onExitComplete={restore}>
          <motion.main
            key={routeKey}
            initial={isMobile ? { opacity: 0, x: back ? -28 : 36 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.09 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 40, mass: 0.8 }}
          >
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/path" element={<MyPath />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/network" element={<Network />} />
              <Route path="/guides" element={<Guides />} />
              <Route path="/communities" element={<Communities />} />
              <Route path="/c/:id" element={<CommunityScreen />} />
              <Route path="/p/:id" element={<Profile />} />
              <Route path="/stories" element={<Stories />} />
              <Route path="/stories/:id" element={<StoryScreen />} />
              <Route path="/questions" element={<Questions />} />
              <Route path="/questions/:id" element={<QuestionScreen />} />
              <Route path="/decisions" element={<Decisions />} />
              <Route path="/decisions/:id" element={<DecisionScreen />} />
              <Route path="/requests" element={<Requests />} />
              <Route path="/connections" element={<Connections />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/messages/:id" element={<Messages />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/search" element={<SearchScreen />} />
              <Route path="/saved" element={<Saved />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </motion.main>
        </AnimatePresence>
        {isMobile && !inThread && <TabBar />}
        <PeekLayer />
        <CompareLayer />
        <RequestLayer />
        <SearchLayer />
        <ToastLayer />
      </div>
      {splashLayer}
    </>
  );
}
