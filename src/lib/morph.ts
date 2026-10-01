/*
  The card becomes the page. Opening a story, question, decision or community from its card carries the parts
  you were looking at into the page: the title grows into the page title and the picture (a story's stretch of
  Path, a decision's fork) grows into the page's figure, while the page you left falls back and fades and the
  new one assembles beneath them. Uses the View Transitions API; without it, or with Reduce Motion, the page
  changes the ordinary way.

  A card opts in with `data-morph-card="<the path it opens>"` and marks its parts with `data-morph="title"` or
  `data-morph="art"`. The page marks where they land with `data-morph-to="title"` and `data-morph-to="art"`.
  Names are handed out only for the length of one transition, so a card that appears twice never clashes.
*/

type VTDocument = Document & {
  startViewTransition?: (cb: () => Promise<void> | void) => { finished: Promise<void>; ready: Promise<void> };
};

/**
 * Read by the shell while a morph swaps the page, so the page skips its own entrance and the swap is instant.
 * `fromY` is where the page you left was scrolled, kept for Back, since the new page starts at the top.
 */
export const morphState: { active: boolean; fromY: number | null } = { active: false, fromY: null };

let go: ((to: string) => void) | null = null;
export function setMorphNavigator(fn: (to: string) => void) {
  go = fn;
}

// A story, question, decision, community, or a conversation inside a community.
const ROUTE = /^#?(\/(?:stories|questions|decisions)\/[^/?#]+|\/c\/[^/?#]+(?:\/t\/[^/?#]+)?)/;
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function inView(el: Element) {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
}

/** The first visible element for each part in the card: [element, part]. */
function partsOf(card: Element, link: Element): [HTMLElement, string][] {
  const found = new Map<string, HTMLElement>();
  const all = [link, ...card.querySelectorAll<HTMLElement>('[data-morph]')];
  for (const el of all) {
    const part = (el as HTMLElement).dataset?.morph;
    if (part && !found.has(part) && inView(el)) found.set(part, el as HTMLElement);
  }
  return [...found.entries()].map(([part, el]) => [el, part]);
}

/** Resolves once the shell shows `path`, or after a short wait so a slow page never holds the transition. */
function shown(path: string) {
  return new Promise<void>((resolve) => {
    const t0 = performance.now();
    const check = () => {
      const main = document.getElementById('main');
      if (main?.dataset.path === path || performance.now() - t0 > 600) resolve();
      // Timers, not animation frames: frames are held while the browser keeps the old page on screen.
      else setTimeout(check, 8);
    };
    check();
  });
}

function morphTo(path: string, parts: [HTMLElement, string][]) {
  const doc = document as VTDocument;
  const root = document.documentElement;
  for (const [el, part] of parts) el.style.setProperty('view-transition-name', `morph-${part}`);
  root.dataset.vt = 'morph';
  const t = doc.startViewTransition!(async () => {
    for (const [el] of parts) el.style.removeProperty('view-transition-name');
    // The landing places take their names only now, after the old page has been captured.
    root.classList.add('vt-landing');
    morphState.active = true;
    // Start the new page at the top before it renders, so everything that measures itself (the sliding pill in
    // the top bar) measures before and after at the same scroll.
    morphState.fromY = window.scrollY;
    window.scrollTo(0, 0);
    go!(path);
    await shown(path);
  });
  t.finished.finally(() => {
    morphState.active = false;
    morphState.fromY = null;
    root.classList.remove('vt-landing');
    delete root.dataset.vt;
  });
}

/**
 * Any plain click on a link a card opens with, to a story, question, decision or community, morphs the card
 * into the page. Links elsewhere in the card (the author, a community named in a post) navigate as usual.
 */
export function installMorphs() {
  const onClick = (e: MouseEvent) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.defaultPrevented) return;
    if (!go || reduced() || !(document as VTDocument).startViewTransition || document.documentElement.dataset.vt) return;
    const target = e.target as Element | null;
    const link = target?.closest?.('a[href]');
    if (!link || target?.closest('button')) return;
    const href = link.getAttribute('href') ?? '';
    const m = href.match(ROUTE);
    if (!m) return;
    const path = m[1];
    const card = link.closest(`[data-morph-card]`);
    if (!card || card.getAttribute('data-morph-card') !== path) return;
    const parts = partsOf(card, link);
    if (!parts.length) return;
    e.preventDefault();
    e.stopPropagation();
    morphTo(path, parts);
  };
  document.addEventListener('click', onClick, true);
  return () => document.removeEventListener('click', onClick, true);
}
