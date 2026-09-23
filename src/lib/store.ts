import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { requestList, conversationList } from '../data/social';
import type { Message, PathRequest } from '../data/types';
import { ME } from '../data/people';

export type ConnectionState = 'pending' | 'connected';
export type Theme = 'system' | 'light' | 'dark';

interface AppState {
  connections: Record<string, ConnectionState>;
  following: Record<string, boolean>;
  saved: Record<string, boolean>;
  joined: Record<string, boolean>;
  helpful: Record<string, boolean>;
  readNotifications: Record<string, boolean>;
  requests: PathRequest[];
  extraMessages: Record<string, Message[]>;
  readThreads: Record<string, boolean>;
  weighIns: Record<string, { option: string; body: string }>;
  addedRoutes: Record<string, boolean>;
  theme: Theme;
  /** Prototype auth: signed-out visitors see the intro page. */
  signedIn: boolean;
  /** Desktop sidebar, remembered like Medium's. */
  sidebar: boolean;

  connect: (id: string) => void;
  toggleFollow: (id: string) => void;
  toggleSave: (key: string) => void;
  toggleJoin: (id: string) => void;
  toggleHelpful: (id: string) => void;
  markNotificationsRead: () => void;
  markThreadRead: (id: string) => void;
  sendRequest: (r: Omit<PathRequest, 'id' | 'status' | 'ago' | 'from'>) => void;
  respondRequest: (id: string, status: PathRequest['status']) => void;
  sendMessage: (conversation: string, body: string, segment?: Message['segment']) => void;
  weighIn: (decision: string, option: string, body: string) => void;
  setTheme: (t: Theme) => void;
  toggleRoute: (id: string) => void;
  signIn: () => void;
  signOut: () => void;
  toggleSidebar: () => void;
}

/** localStorage can throw (private mode, blocked storage). Never let that break the app. */
const safeStorage: StateStorage = {
  getItem: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* ignore */
    }
  },
  removeItem: (k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
};

const now = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      connections: {
        sarah: 'connected',
        daniel: 'connected',
        wei: 'connected',
        jonah: 'connected',
        chloe: 'connected',
        elena: 'connected',
        isabel: 'connected',
        leila: 'connected',
        amara: 'connected',
      },
      following: { amara: true, tomas: true, mei: true, priya: true, grace: true },
      saved: {
        'story:elena-cro': true,
        'story:tomas-phd-math': true,
        'route:pharma-rnd/via-cro': true,
        'question:q-msc-enough': true,
        'person:rafael': true,
        'decision:d-jonah-offers': true,
      },
      joined: { 'chem-pharma': true, 'msc-industry': true, 'phd-question': true, 'cro-rnd': true },
      helpful: {},
      readNotifications: {},
      requests: requestList,
      extraMessages: {},
      readThreads: {},
      weighIns: {},
      addedRoutes: {},
      // Light by default, like Medium on the web; dark is something you choose.
      theme: 'light',
      signedIn: false,
      sidebar: true,

      connect: (id) =>
        set((s) => {
          const next = { ...s.connections };
          if (next[id]) delete next[id];
          else next[id] = 'pending';
          return { connections: next };
        }),
      toggleFollow: (id) => set((s) => ({ following: { ...s.following, [id]: !s.following[id] } })),
      toggleSave: (key) => set((s) => ({ saved: { ...s.saved, [key]: !s.saved[key] } })),
      toggleJoin: (id) => set((s) => ({ joined: { ...s.joined, [id]: !s.joined[id] } })),
      toggleHelpful: (id) => set((s) => ({ helpful: { ...s.helpful, [id]: !s.helpful[id] } })),
      markNotificationsRead: () => set({ readNotifications: { all: true } }),
      markThreadRead: (id) => set((s) => ({ readThreads: { ...s.readThreads, [id]: true } })),
      sendRequest: (r) =>
        set((s) => ({
          requests: [{ ...r, id: `r-${Date.now()}`, from: ME, status: 'pending', ago: 'Just now' }, ...s.requests],
        })),
      respondRequest: (id, status) => set((s) => ({ requests: s.requests.map((r) => (r.id === id ? { ...r, status } : r)) })),
      sendMessage: (conversation, body, segment) =>
        set((s) => ({
          extraMessages: {
            ...s.extraMessages,
            [conversation]: [...(s.extraMessages[conversation] ?? []), { id: `x-${Date.now()}`, from: ME, body, at: now(), segment }],
          },
        })),
      weighIn: (decision, option, body) => set((s) => ({ weighIns: { ...s.weighIns, [decision]: { option, body } } })),
      setTheme: (theme) => set({ theme }),
      toggleRoute: (id) => set((s) => ({ addedRoutes: { ...s.addedRoutes, [id]: !s.addedRoutes[id] } })),
      signIn: () => set({ signedIn: true }),
      signOut: () => set({ signedIn: false }),
      toggleSidebar: () => set((s) => ({ sidebar: !s.sidebar })),
    }),
    {
      name: 'pathedin:v1',
      storage: createJSONStorage(() => safeStorage),
      // v1: appearance used to follow the system by default; start everyone on light again.
      version: 1,
      migrate: (persisted, version) => {
        const s = (persisted ?? {}) as Partial<AppState>;
        if (version < 1 && (!s.theme || s.theme === 'system')) s.theme = 'light';
        return s as AppState;
      },
      partialize: (s) => ({
        connections: s.connections,
        following: s.following,
        saved: s.saved,
        joined: s.joined,
        helpful: s.helpful,
        readNotifications: s.readNotifications,
        requests: s.requests,
        extraMessages: s.extraMessages,
        readThreads: s.readThreads,
        weighIns: s.weighIns,
        addedRoutes: s.addedRoutes,
        theme: s.theme,
        signedIn: s.signedIn,
        sidebar: s.sidebar,
      }),
    },
  ),
);

export function conversationMessages(id: string, extra: Record<string, Message[]>): Message[] {
  const base = conversationList.find((c) => c.id === id)?.messages ?? [];
  return [...base, ...(extra[id] ?? [])];
}
