/*
  Pointer-only details, installed once. Nothing here runs on touch screens.

  Lit edges: cards that open something catch the light along their 1px edge where the cursor is, the way
  the world's panels are lit from above. One listener for the whole app, at most one style write per frame,
  and only on the card under the pointer.

  Tooltip warm-up: the first tooltip waits a beat so the page doesn't flicker as you cross it; once one is
  showing, its neighbours answer at once, as they do in native apps.
*/

export const LIT = '.dcard, .gcard, .fguide, .door, .route-post';

export function installPointerDetails() {
  if (typeof window === 'undefined' || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return () => {};
  const root = document.documentElement;
  let raf = 0;
  let card: HTMLElement | null = null;
  let x = 0;
  let y = 0;

  const onMove = (e: PointerEvent) => {
    const el = (e.target as Element | null)?.closest?.<HTMLElement>(LIT) ?? null;
    if (!el) return;
    card = el;
    x = e.clientX;
    y = e.clientY;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${x - r.left}px`);
      card.style.setProperty('--my', `${y - r.top}px`);
    });
  };

  let warmTimer: ReturnType<typeof setTimeout> | undefined;
  let coolTimer: ReturnType<typeof setTimeout> | undefined;
  const onOver = (e: PointerEvent) => {
    if (!(e.target as Element | null)?.closest?.('[data-tip]')) return;
    clearTimeout(coolTimer);
    if (root.dataset.tipsWarm === undefined) warmTimer = setTimeout(() => (root.dataset.tipsWarm = ''), 420);
  };
  const onOut = (e: PointerEvent) => {
    if (!(e.target as Element | null)?.closest?.('[data-tip]')) return;
    clearTimeout(warmTimer);
    clearTimeout(coolTimer);
    coolTimer = setTimeout(() => delete root.dataset.tipsWarm, 700);
  };

  document.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerover', onOver, { passive: true });
  document.addEventListener('pointerout', onOut, { passive: true });
  return () => {
    cancelAnimationFrame(raf);
    clearTimeout(warmTimer);
    clearTimeout(coolTimer);
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerover', onOver);
    document.removeEventListener('pointerout', onOut);
  };
}
