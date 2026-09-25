import { create } from 'zustand';

export interface PeekState {
  id: string;
  mode: 'touch' | 'hover';
  rect?: { top: number; left: number; bottom: number; right: number; width: number; height: number };
}

interface UIState {
  peek: PeekState | null;
  compare: string | null;
  request: { to: string; segment?: [string, string]; quote?: string } | null;
  search: boolean;
  /** Booking a Guide's office hours; `booking` reopens one you already hold. */
  book: { guide: string; booking?: string; topic?: string } | null;
  /** The sidebar drawer on desktop widths too narrow to dock it. */
  drawer: boolean;
  toast: { text: string; id: number } | null;
  openPeek: (p: PeekState) => void;
  closePeek: () => void;
  openCompare: (id: string) => void;
  closeCompare: () => void;
  /** A quote pre-fills the message with the passage you're asking about. */
  openRequest: (to: string, segment?: [string, string], quote?: string) => void;
  closeRequest: () => void;
  setSearch: (open: boolean) => void;
  openBooking: (guide: string, opts?: { booking?: string; topic?: string }) => void;
  closeBooking: () => void;
  setDrawer: (open: boolean) => void;
  showToast: (text: string) => void;
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const useUI = create<UIState>()((set) => ({
  peek: null,
  compare: null,
  request: null,
  search: false,
  book: null,
  drawer: false,
  toast: null,
  openPeek: (peek) => set({ peek }),
  closePeek: () => set({ peek: null }),
  openCompare: (compare) => set({ compare, peek: null }),
  closeCompare: () => set({ compare: null }),
  openRequest: (to, segment, quote) => set({ request: { to, segment, quote }, peek: null }),
  closeRequest: () => set({ request: null }),
  setSearch: (search) => set({ search }),
  openBooking: (guide, opts) => set({ book: { guide, ...opts }, peek: null, search: false, request: null }),
  closeBooking: () => set({ book: null }),
  setDrawer: (drawer) => set({ drawer }),
  showToast: (text) => {
    clearTimeout(toastTimer);
    set({ toast: { text, id: Date.now() } });
    toastTimer = setTimeout(() => set({ toast: null }), 2600);
  },
}));

/* Hover-card close scheduling, shared between trigger and card. */
let closeTimer: ReturnType<typeof setTimeout> | undefined;
export function scheduleClosePeek(delay = 180) {
  clearTimeout(closeTimer);
  closeTimer = setTimeout(() => {
    const p = useUI.getState().peek;
    if (p?.mode === 'hover') useUI.getState().closePeek();
  }, delay);
}
export function cancelClosePeek() {
  clearTimeout(closeTimer);
}
