import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { requestList, conversationList } from '../data/social';
import type { Message, PathRequest, ServiceKind } from '../data/types';
import { ME } from '../data/people';

export type ConnectionState = 'pending' | 'connected';
export interface MyResponse {
  body: string;
  /** The passage it responds to, when it started from a selection. */
  quote?: string;
  at: number;
}
export type Theme = 'system' | 'light' | 'dark';
/** A spot in a Path Guide's office hours. */
export interface Booking {
  id: string;
  guide: string;
  /** ISO start time. */
  at: string;
  minutes: number;
  topic: string;
  note: string;
  /** What was booked, when it isn't free Office Hours. */
  service?: ServiceKind;
  title?: string;
  /** Canadian dollars paid (in this prototype no payment is taken). */
  price?: number;
}

/** Your own Guide profile, once you set one up. */
export interface MyGuide {
  /** The moves on your own Path you'll guide. */
  transitions: [string, string][];
  pitch: string;
  experience: string;
  expertise: string[];
  /** Free guidance: answering questions in your communities, and Office Hours. */
  free: { answers: boolean; officeHours: boolean };
  officeHours: { day: number; hour: number; spots: number };
  services: { kind: ServiceKind; on: boolean; price: number; minutes?: number; seats?: number }[];
  /** When you're open for paid sessions, as "day-part" keys (e.g. "2-evening"). */
  availability: string[];
  live: boolean;
  since: number;
}

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
  /** Passages you highlighted, by story. */
  highlights: Record<string, string[]>;
  /** Your responses, by story. */
  myResponses: Record<string, MyResponse[]>;
  /** One-time coachmarks you've dismissed. */
  tips: Record<string, boolean>;
  /** This device has signed in before, so sign-in says "Welcome back." with the account. */
  returning: boolean;
  bookings: Booking[];
  myGuide: MyGuide | null;

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
  toggleHighlight: (story: string, text: string) => void;
  addResponse: (story: string, r: Omit<MyResponse, 'at'>) => void;
  dismissTip: (id: string) => void;
  forgetAccount: () => void;
  book: (b: Omit<Booking, 'id'>) => string;
  cancelBooking: (id: string) => void;
  saveGuide: (g: MyGuide) => void;
  setGuideLive: (live: boolean) => void;
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
      bookings: [],
      myGuide: null,
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
      // Soft Cream by default; Midnight and Automatic are a choice away in Settings and ⌘K.
      theme: 'light',
      signedIn: false,
      sidebar: true,
      highlights: {},
      myResponses: {},
      tips: {},
      returning: false,

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
      signIn: () => set({ signedIn: true, returning: true }),
      signOut: () => set({ signedIn: false, returning: true }),
      toggleSidebar: () => set((s) => ({ sidebar: !s.sidebar })),
      toggleHighlight: (story, text) =>
        set((s) => {
          const list = s.highlights[story] ?? [];
          const next = list.includes(text) ? list.filter((t) => t !== text) : [...list, text];
          return { highlights: { ...s.highlights, [story]: next } };
        }),
      addResponse: (story, r) =>
        set((s) => ({ myResponses: { ...s.myResponses, [story]: [{ ...r, at: Date.now() }, ...(s.myResponses[story] ?? [])] } })),
      dismissTip: (id) => set((s) => ({ tips: { ...s.tips, [id]: true } })),
      forgetAccount: () => set({ returning: false }),
      book: (b) => {
        const id = `b-${Date.now()}`;
        set((s) => ({ bookings: [...s.bookings, { ...b, id }] }));
        return id;
      },
      cancelBooking: (id) => set((s) => ({ bookings: s.bookings.filter((b) => b.id !== id) })),
      saveGuide: (myGuide) => set({ myGuide }),
      setGuideLive: (live) => set((s) => (s.myGuide ? { myGuide: { ...s.myGuide, live } } : {})),
    }),
    {
      name: 'pathedin:v1',
      storage: createJSONStorage(() => safeStorage),
      // v3: the Cream and Midnight redesign opens in cream for everyone once; Midnight stays a choice away.
      version: 3,
      migrate: (persisted, version) => {
        const s = (persisted ?? {}) as Partial<AppState>;
        if (version < 3) s.theme = 'light';
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
        highlights: s.highlights,
        myResponses: s.myResponses,
        tips: s.tips,
        returning: s.returning,
        bookings: s.bookings,
        myGuide: s.myGuide,
      }),
    },
  ),
);

export function conversationMessages(id: string, extra: Record<string, Message[]>): Message[] {
  const base = conversationList.find((c) => c.id === id)?.messages ?? [];
  return [...base, ...(extra[id] ?? [])];
}
