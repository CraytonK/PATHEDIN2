import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';

/*
  What you write: the draft in progress, and the posts you've published.
  Kept apart from the main app state because photos make it large. If the browser runs out of
  room, writing still works for the session and the rest of PathedIn keeps saving normally.
*/

export type MyPostKind = 'story' | 'question' | 'community';

export interface MyPost {
  id: string;
  kind: MyPostKind;
  title: string;
  subtitle?: string;
  /** Sanitised HTML from the editor. */
  html: string;
  /** The first photo in the post, used as its thumbnail. */
  image?: string;
  segment?: [string, string];
  community?: string;
  at: number;
}

interface Draft {
  title: string;
  html: string;
  updated: number;
}

interface WritingState {
  draft: Draft;
  posts: MyPost[];
  /** False when the browser refused to keep the latest save. */
  stored: boolean;
  saveDraft: (d: Omit<Draft, 'updated'>) => void;
  clearDraft: () => void;
  publish: (p: Omit<MyPost, 'id' | 'at'>) => MyPost;
  remove: (id: string) => void;
}

let lastWriteOk = true;
const storage: StateStorage = {
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
      lastWriteOk = true;
    } catch {
      lastWriteOk = false;
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

const empty: Draft = { title: '', html: '', updated: 0 };

export const useWriting = create<WritingState>()(
  persist(
    (set, get) => ({
      draft: empty,
      posts: [],
      stored: true,
      saveDraft: (d) => {
        set({ draft: { ...d, updated: Date.now() } });
        queueMicrotask(() => set({ stored: lastWriteOk }));
      },
      clearDraft: () => set({ draft: empty }),
      publish: (p) => {
        const post: MyPost = { ...p, id: `p-${Date.now().toString(36)}`, at: Date.now() };
        set({ posts: [post, ...get().posts], draft: empty });
        return post;
      },
      remove: (id) => set({ posts: get().posts.filter((p) => p.id !== id) }),
    }),
    {
      name: 'pathedin:writing',
      storage: createJSONStorage(() => storage),
      version: 1,
      partialize: (s) => ({ draft: s.draft, posts: s.posts }),
    },
  ),
);

/** "Just now", "5m", "3h", "2d", then a date. */
export function agoLabel(at: number): string {
  const s = Math.max(0, (Date.now() - at) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d`;
  return new Date(at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

/* ── Keeping stored HTML safe ────────────────────────────────── */

const blockTags = new Set(['P', 'H2', 'H3', 'BLOCKQUOTE', 'HR', 'FIGURE']);
const inlineTags = new Set(['B', 'STRONG', 'I', 'EM', 'A', 'BR', 'SPAN', 'IMG', 'FIGCAPTION']);
const allowedClasses = /^(write-image|path-embed|path-embed__label|path-embed__line|pe-stop|is-past|is-present|is-future|is-dest|pe-link|is-dashed)$/;

/**
 * Rebuilds editor HTML from an allow-list: paragraphs, two heading levels, quotes, dividers,
 * bold, italic, links, photos (inline data only) and Path embeds. Everything else is dropped.
 */
export function sanitize(html: string): string {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const out = document.createElement('div');
  const copy = (node: Node, into: HTMLElement) => {
    node.childNodes.forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE) {
        into.appendChild(document.createTextNode(n.textContent ?? ''));
        return;
      }
      if (n.nodeType !== Node.ELEMENT_NODE) return;
      const el = n as HTMLElement;
      let tag = el.tagName;
      if (tag === 'DIV') tag = 'P';
      if (!blockTags.has(tag) && !inlineTags.has(tag)) {
        copy(el, into); // keep the text, drop the wrapper
        return;
      }
      const clean = document.createElement(tag.toLowerCase());
      const cls = (el.getAttribute('class') ?? '').split(/\s+/).filter((c) => allowedClasses.test(c));
      if (cls.length) clean.setAttribute('class', cls.join(' '));
      if (tag === 'A') {
        const href = el.getAttribute('href') ?? '';
        if (/^(https?:|mailto:)/i.test(href)) {
          clean.setAttribute('href', href);
          clean.setAttribute('target', '_blank');
          clean.setAttribute('rel', 'noopener noreferrer');
        }
      }
      if (tag === 'IMG') {
        const src = el.getAttribute('src') ?? '';
        if (!/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(src)) return;
        clean.setAttribute('src', src);
        clean.setAttribute('alt', el.getAttribute('alt') ?? '');
      }
      if (tag === 'FIGURE' || tag === 'SPAN') {
        for (const a of Array.from(el.attributes)) if (a.name.startsWith('data-')) clean.setAttribute(a.name, a.value);
      }
      into.appendChild(clean);
      if (tag !== 'IMG' && tag !== 'BR' && tag !== 'HR') copy(el, clean);
    });
  };
  copy(doc.body.firstChild as Node, out);
  return out.innerHTML;
}
