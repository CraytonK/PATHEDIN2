/*
  Pointer-only details, installed once. Nothing here runs on touch screens.

  Tooltip warm-up: the first tooltip waits a beat so the page doesn't flicker as you cross it; once one is
  showing, its neighbours answer at once, as they do in native apps.
*/

export function installPointerDetails() {
  if (typeof window === 'undefined' || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return () => {};
  const root = document.documentElement;

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

  document.addEventListener('pointerover', onOver, { passive: true });
  document.addEventListener('pointerout', onOut, { passive: true });
  return () => {
    clearTimeout(warmTimer);
    clearTimeout(coolTimer);
    document.removeEventListener('pointerover', onOver);
    document.removeEventListener('pointerout', onOut);
  };
}
