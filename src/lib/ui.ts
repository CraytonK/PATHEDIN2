import { create } from 'zustand';

export interface PeekState {
  id: string;
  mode: 'touch' | 'hover';
  rect?: { top: number; left: number; bottom: number; right: number; width: number; height: number };
}

interface UIState {
  peek: PeekState | null;
  compare: string | null;
  request: { to: string; segment?: [string, string] } | null;
  search: boolean;
  toast: { text: string; id: number } | null;
  openPeek: (p: PeekState) => void;
  closePeek: () => void;
  openCompare: (id: string) => void;
  closeCompare: () => void;
  openRequest: (to: string, segment?: [string, string]) => void;
  closeRequest: () => void;
  setSearch: (open: boolean) => void;
  showToast: (text: string) => void;
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const useUI = create<UIState>()((set) => ({
  peek: null,
  compare: null,
  request: null,
  search: false,
  toast: null,
  openPeek: (peek) => set({ peek }),
  closePeek: () => set({ peek: null }),
  openCompare: (compare) => set({ compare, peek: null }),
  closeCompare: () => set({ compare: null }),
  openRequest: (to, segment) => set({ request: { to, segment }, peek: null }),
  closeRequest: () => set({ request: null }),
  setSearch: (search) => set({ search }),
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
