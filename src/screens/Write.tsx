import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { Sheet, Wordmark } from '../components/chrome';
import { Avatar, Button, Segmented } from '../components/ui';
import { IconChevronLeft, IconChevronRight, IconClose, IconEllipsis, IconImage, IconLink, IconPath, IconPlus } from '../components/icons';
import { communities } from '../data/communities';
import { me, ME } from '../data/people';
import { wp } from '../data/waypoints';
import { compactSteps, stepsWithFuture } from '../lib/relations';
import { haptic, springs, useIsMobile } from '../lib/motion';
import { useApp } from '../lib/store';
import { useUI } from '../lib/ui';
import { sanitize, useWriting, type MyPostKind } from '../lib/writing';
import './write.css';

/*
  Write — Medium's editor, for PathedIn.
  A quiet page with two placeholders. Tools appear only when you need them:
  - start a new line and ⊕ appears in the margin: add a photo, a stretch of your Path, or a new section;
  - select text and a dark toolbar appears: bold, italic, link, two heading sizes, quote;
  - Publish asks what it is (a Story, a Question, a community post) and which stretch of your Path
    it's about, so the people on that stretch see it first.
*/

const EMPTY_BLOCK = '<p><br></p>';

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

/** Your Path as an embeddable block: the brand's nodes drawn in CSS, so it survives as plain HTML. */
function pathEmbedHtml() {
  const steps = stepsWithFuture(me);
  const parts = steps.map((s, i) => {
    const kind = s.status === 'present' ? 'is-present' : s.status === 'future' ? (i === steps.length - 1 ? 'is-dest' : 'is-future') : 'is-past';
    const link = i > 0 ? `<span class="pe-link${s.status === 'future' ? ' is-dashed' : ''}"></span>` : '';
    return `${link}<span class="pe-stop ${kind}">${esc(wp(s.wp).short)}</span>`;
  });
  return `<figure class="path-embed" contenteditable="false" data-person="${ME}"><span class="path-embed__label">${esc(me.first)}’s Path</span><span class="path-embed__line">${parts.join('')}</span></figure>`;
}

/** Shrinks a photo to at most 1400px wide as a JPEG, so drafts stay small enough to keep. */
function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Not an image'));
      img.onload = () => {
        const scale = Math.min(1, 1400 / img.naturalWidth);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.84));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/** The block (direct child of the editor) that holds the caret. */
function blockAtCaret(root: HTMLElement): HTMLElement | null {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return null;
  let n: Node | null = sel.anchorNode;
  if (!n || !root.contains(n)) return null;
  while (n && n.parentNode !== root) n = n.parentNode;
  return n instanceof HTMLElement ? n : null;
}

function isEmptyBlock(el: HTMLElement) {
  return el.tagName === 'P' && !el.textContent?.trim() && !el.querySelector('img');
}

function placeCaret(el: HTMLElement) {
  const r = document.createRange();
  r.selectNodeContents(el);
  r.collapse(true);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(r);
}

/** After loading saved HTML, make figures behave as single blocks with editable captions. */
function prepare(root: HTMLElement) {
  root.querySelectorAll('figure').forEach((f) => f.setAttribute('contenteditable', 'false'));
  root.querySelectorAll('figure.write-image figcaption').forEach((c) => c.setAttribute('contenteditable', 'true'));
}

export function WriteScreen() {
  const draft = useWriting((s) => s.draft);
  const saveDraft = useWriting((s) => s.saveDraft);
  const stored = useWriting((s) => s.stored);
  const [title, setTitle] = useState(draft.title);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>(draft.updated ? 'saved' : 'idle');
  const [hasBody, setHasBody] = useState(false);
  const [inserter, setInserter] = useState<{ top: number; block: HTMLElement } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [picked, setPicked] = useState<HTMLElement | null>(null);
  const body = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isMobile = useIsMobile();
  const toast = useUI((s) => s.showToast);

  // Load the draft once.
  useLayoutEffect(() => {
    const el = body.current;
    if (!el) return;
    el.innerHTML = draft.html ? sanitize(draft.html) || EMPTY_BLOCK : EMPTY_BLOCK;
    prepare(el);
    setHasBody(!!el.textContent?.trim() || !!el.querySelector('figure, hr'));
    try {
      document.execCommand('defaultParagraphSeparator', false, 'p');
    } catch {
      /* ignore */
    }
    if (!draft.title) titleRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Grow the title with its text.
  useLayoutEffect(() => {
    const t = titleRef.current;
    if (!t) return;
    t.style.height = 'auto';
    t.style.height = `${t.scrollHeight}px`;
  }, [title]);

  const save = useCallback(
    (nextTitle = title) => {
      const el = body.current;
      if (!el) return;
      setStatus('saving');
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveDraft({ title: nextTitle, html: sanitize(el.innerHTML) });
        setStatus('saved');
      }, 500);
    },
    [saveDraft, title],
  );
  useEffect(() => () => clearTimeout(saveTimer.current), []);

  const refresh = useCallback(() => {
    const el = body.current;
    if (!el) return;
    if (!el.firstElementChild) {
      el.innerHTML = EMPTY_BLOCK;
      placeCaret(el.querySelector('p')!);
    }
    setHasBody(!!el.textContent?.trim() || !!el.querySelector('figure, hr'));
    const block = blockAtCaret(el);
    if (!menuOpen) setInserter(block && isEmptyBlock(block) ? { top: block.offsetTop, block } : null);
  }, [menuOpen]);

  useEffect(() => {
    const on = () => refresh();
    document.addEventListener('selectionchange', on);
    return () => document.removeEventListener('selectionchange', on);
  }, [refresh]);

  /** Where a new block goes: the empty line the ⊕ is on, else the line with the caret, else the end. */
  const pendingTarget = useRef<HTMLElement | null>(null);
  const currentTarget = () => {
    const el = body.current;
    if (!el) return null;
    if (inserter?.block && el.contains(inserter.block)) return inserter.block;
    return blockAtCaret(el) ?? (el.lastElementChild as HTMLElement | null);
  };

  /** Put a block in place of an empty line (or after a written one), and continue on a fresh line. */
  const insertBlock = (html: string, at?: HTMLElement | null) => {
    const el = body.current;
    const target = at && el?.contains(at) ? at : currentTarget();
    if (!el || !target) return;
    const tmp = document.createElement('div');
    tmp.innerHTML = html + EMPTY_BLOCK;
    const nodes = Array.from(tmp.childNodes);
    if (isEmptyBlock(target)) {
      nodes.forEach((n) => el.insertBefore(n, target));
      target.remove();
    } else {
      target.after(...nodes);
    }
    const next = nodes[nodes.length - 1] as HTMLElement;
    placeCaret(next);
    setMenuOpen(false);
    haptic(8);
    refresh();
    save();
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    try {
      const src = await readImage(file);
      insertBlock(`<figure class="write-image" contenteditable="false"><img src="${src}" alt=""><figcaption contenteditable="true"></figcaption></figure>`, pendingTarget.current);
    } catch {
      toast('That file couldn’t be added as a photo');
    }
  };

  const addPhoto = () => {
    // Remember the line now: the file picker takes focus away from the editor.
    pendingTarget.current = currentTarget();
    fileInput.current?.click();
  };

  // Clicking anywhere else puts the ⊕ menu away.
  useEffect(() => {
    if (!menuOpen) return;
    const on = (e: PointerEvent) => !(e.target as HTMLElement).closest?.('.inserter') && setMenuOpen(false);
    window.addEventListener('pointerdown', on);
    return () => window.removeEventListener('pointerdown', on);
  }, [menuOpen]);
  const addPath = () => insertBlock(pathEmbedHtml());
  const addDivider = () => insertBlock('<hr>');

  // Show which photo is picked.
  useEffect(() => {
    if (!picked) return;
    picked.classList.add('is-picked');
    const off = (e: PointerEvent) => !(e.target as HTMLElement).closest?.('.photo-tools') && !picked.contains(e.target as Node) && setPicked(null);
    window.addEventListener('pointerdown', off);
    return () => {
      picked.classList.remove('is-picked');
      window.removeEventListener('pointerdown', off);
    };
  }, [picked]);

  const canPublish = !!title.trim() && hasBody;

  return (
    <div className="write">
      <header className="write__bar">
        <div className="write__bar-left">
          {isMobile ? (
            <Link to="/" className="write__back" aria-label="Close">
              <IconChevronLeft size={22} />
            </Link>
          ) : (
            <Link to="/" className="wordmark" aria-label="PathedIn home">
              <Wordmark size={24} />
            </Link>
          )}
          <span className="write__status">
            Draft
            {status === 'saving' && <span className="write__saved"> · Saving…</span>}
            {status === 'saved' && <span className="write__saved"> · {stored ? 'Saved' : 'Saved for this visit'}</span>}
          </span>
        </div>
        <div className="write__bar-right">
          <button className={`write__publish ${canPublish ? 'is-ready' : ''}`} disabled={!canPublish} onClick={() => setPublishing(true)}>
            Publish
          </button>
          <MoreMenu
            onDiscard={() => {
              if (body.current) body.current.innerHTML = EMPTY_BLOCK;
              setTitle('');
              useWriting.getState().clearDraft();
              setStatus('idle');
              setHasBody(false);
              titleRef.current?.focus();
            }}
          />
          {!isMobile && <Avatar id={ME} size={32} peek={false} />}
        </div>
      </header>

      <main className="write__page">
        <textarea
          ref={titleRef}
          className="write__title"
          rows={1}
          placeholder="Title"
          value={title}
          aria-label="Title"
          onChange={(e) => {
            setTitle(e.target.value);
            save(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const first = body.current?.firstElementChild as HTMLElement | null;
              body.current?.focus();
              if (first) placeCaret(first);
            }
          }}
        />
        <div className="write__canvas">
          <div
            ref={body}
            className={`write__body prose ${hasBody ? '' : 'is-empty'}`}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-label="Tell your story"
            data-placeholder="Tell your story…"
            onInput={() => {
              refresh();
              save();
            }}
            onPaste={(e) => {
              // Paste as plain text so foreign formatting never gets in.
              e.preventDefault();
              document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
            }}
            onClick={(e) => {
              const fig = (e.target as HTMLElement).closest('figure.write-image') as HTMLElement | null;
              setPicked(fig && (e.target as HTMLElement).tagName === 'IMG' ? fig : null);
            }}
            onKeyUp={refresh}
          />
          {!isMobile && inserter && (
            <Inserter top={inserter.top} open={menuOpen} onToggle={() => setMenuOpen((o) => !o)} onPhoto={addPhoto} onPath={addPath} onDivider={addDivider} />
          )}
          {picked && (
            <PhotoTools
              figure={picked}
              onRemove={() => {
                picked.remove();
                setPicked(null);
                if (!body.current?.firstElementChild && body.current) body.current.innerHTML = EMPTY_BLOCK;
                refresh();
                save();
              }}
            />
          )}
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            onFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </main>

      {isMobile && (
        <div className="write__dock" role="toolbar" aria-label="Add to your post">
          <button onMouseDown={(e) => e.preventDefault()} onClick={addPhoto}>
            <IconImage size={20} /> Photo
          </button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={addPath}>
            <IconPath size={20} /> Your Path
          </button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={addDivider}>
            <span className="write__dots" aria-hidden="true">···</span> Section
          </button>
        </div>
      )}

      <FormatBar root={body} onChange={() => save()} />
      <TipsDrawer />
      <PublishSheet
        open={publishing}
        onClose={() => setPublishing(false)}
        title={title}
        getBody={() => (body.current ? sanitize(body.current.innerHTML) : '')}
      />
    </div>
  );
}

/* ── ⊕ in the margin ─────────────────────────────────────────── */

function Inserter({ top, open, onToggle, onPhoto, onPath, onDivider }: { top: number; open: boolean; onToggle: () => void; onPhoto: () => void; onPath: () => void; onDivider: () => void }) {
  const items: { key: string; label: string; icon: ReactNode; run: () => void }[] = [
    { key: 'photo', label: 'Add a photo', icon: <IconImage size={18} />, run: onPhoto },
    { key: 'path', label: 'Add your Path', icon: <IconPath size={18} />, run: onPath },
    { key: 'divider', label: 'New section', icon: <span className="write__dots">···</span>, run: onDivider },
  ];
  return (
    <div className="inserter" style={{ top }} onMouseDown={(e) => e.preventDefault()}>
      <motion.button type="button" className="inserter__toggle" aria-label={open ? 'Close' : 'Add a photo, your Path or a new section'} aria-expanded={open} animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }} onClick={onToggle}>
        <IconPlus size={18} strokeWidth={1.6} />
      </motion.button>
      <AnimatePresence>
        {open &&
          items.map((it, i) => (
            <motion.button
              key={it.key}
              type="button"
              className="inserter__item"
              aria-label={it.label}
              data-tip={it.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4, transition: { duration: 0.1 } }}
              transition={{ duration: 0.2, delay: i * 0.03, ease: [0.23, 1, 0.32, 1] }}
              onClick={it.run}
            >
              {it.icon}
            </motion.button>
          ))}
      </AnimatePresence>
    </div>
  );
}

function PhotoTools({ figure, onRemove }: { figure: HTMLElement; onRemove: () => void }) {
  return (
    <div className="photo-tools" style={{ top: figure.offsetTop + 12 }} onMouseDown={(e) => e.preventDefault()}>
      <button type="button" onClick={onRemove}>
        <IconClose size={14} strokeWidth={2.2} /> Remove photo
      </button>
    </div>
  );
}

/* ── The selection toolbar ───────────────────────────────────── */

type Fmt = { bold: boolean; italic: boolean; link: boolean; block: string };

function FormatBar({ root, onChange }: { root: React.RefObject<HTMLDivElement | null>; onChange: () => void }) {
  const [pos, setPos] = useState<{ x: number; y: number; below: boolean } | null>(null);
  const [fmt, setFmt] = useState<Fmt>({ bold: false, italic: false, link: false, block: 'P' });
  const [linking, setLinking] = useState(false);
  const [url, setUrl] = useState('');
  const saved = useRef<Range | null>(null);

  useEffect(() => {
    let down = false;
    const read = () => {
      if (linking) return;
      const sel = window.getSelection();
      const el = root.current;
      if (!sel || !el || sel.isCollapsed || !sel.rangeCount) return setPos(null);
      const range = sel.getRangeAt(0);
      if (!el.contains(range.commonAncestorContainer)) return setPos(null);
      if ((range.commonAncestorContainer as HTMLElement).closest?.('figure') || range.commonAncestorContainer.parentElement?.closest('figure')) return setPos(null);
      const r = range.getBoundingClientRect();
      const below = window.matchMedia('(pointer: coarse)').matches;
      const block = blockAtCaret(el);
      setFmt({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        link: !!range.commonAncestorContainer.parentElement?.closest('a'),
        block: block?.tagName ?? 'P',
      });
      setPos({ x: r.left + r.width / 2 + window.scrollX, y: (below ? r.bottom + 12 : r.top - 12) + window.scrollY, below });
    };
    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest?.('.fmtbar')) return;
      down = true;
      setLinking(false);
      setPos(null);
    };
    const onUp = () => {
      down = false;
      setTimeout(read, 10);
    };
    const onSel = () => {
      if (!down) setTimeout(read, 60);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('selectionchange', onSel);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('selectionchange', onSel);
    };
  }, [root, linking]);

  const cmd = (name: string, value?: string) => {
    document.execCommand(name, false, value);
    onChange();
    // Re-read state so the pressed buttons update at once.
    setFmt((f) => ({ ...f, bold: document.queryCommandState('bold'), italic: document.queryCommandState('italic'), block: root.current ? (blockAtCaret(root.current)?.tagName ?? 'P') : f.block }));
  };
  const block = (tag: string) => cmd('formatBlock', fmt.block === tag ? '<p>' : `<${tag.toLowerCase()}>`);

  const startLink = () => {
    if (fmt.link) return cmd('unlink');
    const sel = window.getSelection();
    saved.current = sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
    setUrl('');
    setLinking(true);
  };
  const applyLink = () => {
    const sel = window.getSelection();
    if (saved.current && sel) {
      sel.removeAllRanges();
      sel.addRange(saved.current);
    }
    const href = /^(https?:|mailto:)/i.test(url) ? url : `https://${url}`;
    if (url.trim()) cmd('createLink', href);
    setLinking(false);
    setPos(null);
  };

  return createPortal(
    <AnimatePresence>
      {pos && (
        <motion.div
          key="fmt"
          className={`fmtbar ${pos.below ? 'is-below' : ''}`}
          // Centre above (or below) the selection. Set through Motion so its scale animation doesn't wipe it.
          style={{ left: pos.x, top: pos.y, x: '-50%', y: pos.below ? 0 : '-100%' }}
          role="toolbar"
          aria-label="Format text"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.1 } }}
          transition={springs.snappy}
          onMouseDown={(e) => {
            if ((e.target as HTMLElement).tagName !== 'INPUT') e.preventDefault();
          }}
        >
          {linking ? (
            <form
              className="fmtbar__link"
              onSubmit={(e) => {
                e.preventDefault();
                applyLink();
              }}
            >
              <input autoFocus value={url} placeholder="Paste or type a link…" onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Escape' && setLinking(false)} />
              <button type="button" aria-label="Cancel" onClick={() => setLinking(false)}>
                <IconClose size={14} strokeWidth={2.2} />
              </button>
            </form>
          ) : (
            <>
              <FmtBtn on={fmt.bold} label="Bold" onClick={() => cmd('bold')}>
                <b className="fmtbar__serif">B</b>
              </FmtBtn>
              <FmtBtn on={fmt.italic} label="Italic" onClick={() => cmd('italic')}>
                <i className="fmtbar__serif">i</i>
              </FmtBtn>
              <FmtBtn on={fmt.link} label={fmt.link ? 'Remove link' : 'Link'} onClick={startLink}>
                <IconLink size={18} strokeWidth={2} />
              </FmtBtn>
              <span className="fmtbar__sep" />
              <FmtBtn on={fmt.block === 'H2'} label="Big heading" onClick={() => block('H2')}>
                <span className="fmtbar__serif fmtbar__t-lg">T</span>
              </FmtBtn>
              <FmtBtn on={fmt.block === 'H3'} label="Small heading" onClick={() => block('H3')}>
                <span className="fmtbar__serif fmtbar__t-sm">T</span>
              </FmtBtn>
              <FmtBtn on={fmt.block === 'BLOCKQUOTE'} label="Quote" onClick={() => block('BLOCKQUOTE')}>
                <span className="fmtbar__serif fmtbar__quote">“</span>
              </FmtBtn>
            </>
          )}
          <span className="fmtbar__caret" aria-hidden="true" />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function FmtBtn({ on, label, onClick, children }: { on: boolean; label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className={`fmtbar__btn ${on ? 'is-on' : ''}`} aria-label={label} aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  );
}

/* ── "…" menu ────────────────────────────────────────────────── */

function MoreMenu({ onDiscard }: { onDiscard: () => void }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const dismissTip = useApp((s) => s.dismissTip);
  const tips = useApp((s) => s.tips);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const on = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && (setOpen(false), setConfirm(false));
    window.addEventListener('pointerdown', on);
    return () => window.removeEventListener('pointerdown', on);
  }, [open]);
  return (
    <div className="post-more" ref={ref}>
      <button className="post-more__btn" aria-label="More" data-tip="More" data-tip-pos="below" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <IconEllipsis size={22} strokeWidth={1.6} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="post-more__menu" role="menu" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} transition={springs.snappy}>
            {tips['write-intro'] && (
              <button
                role="menuitem"
                onClick={() => {
                  useApp.setState((s) => ({ tips: { ...s.tips, 'write-intro': false } }));
                  setOpen(false);
                }}
              >
                Writing tips
              </button>
            )}
            <button
              role="menuitem"
              className="is-danger"
              onClick={() => {
                if (!confirm) return setConfirm(true);
                onDiscard();
                dismissTip('write-intro');
                setOpen(false);
                setConfirm(false);
              }}
            >
              {confirm ? 'Tap again to discard this draft' : 'Discard draft'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Tips drawer, as in Medium's first visit ─────────────────── */

const tips: { text: string; demo: ReactNode }[] = [
  {
    text: 'Select text to change formatting, add headings, or create links.',
    demo: (
      <div className="tipdemo">
        <div className="tipdemo__bar" aria-hidden="true">
          <b className="fmtbar__serif">B</b>
          <i className="fmtbar__serif">i</i>
          <IconLink size={16} strokeWidth={2} />
          <span className="fmtbar__sep" />
          <span className="fmtbar__serif fmtbar__t-lg">T</span>
          <span className="fmtbar__serif fmtbar__t-sm">T</span>
          <span className="fmtbar__serif fmtbar__quote">“</span>
        </div>
        <span className="tipdemo__sel">Writing on PathedIn</span>
      </div>
    ),
  },
  {
    text: 'Start a new line and click ⊕ to add a photo, your Path, or a new section.',
    demo: (
      <div className="tipdemo tipdemo--row" aria-hidden="true">
        <span className="tipdemo__plus">
          <IconPlus size={16} strokeWidth={1.6} />
        </span>
        <span className="tipdemo__circle">
          <IconImage size={16} />
        </span>
        <span className="tipdemo__circle">
          <IconPath size={16} />
        </span>
        <span className="tipdemo__circle">···</span>
      </div>
    ),
  },
  {
    text: 'When you publish, choose a Story, a Question or a community post, and the stretch of your Path it’s about. People on that stretch see it first.',
    demo: (
      <div className="tipdemo tipdemo--row" aria-hidden="true">
        <span className="tipdemo__chip is-on">Story</span>
        <span className="tipdemo__chip">Question</span>
        <span className="tipdemo__chip">Community post</span>
      </div>
    ),
  },
];

function TipsDrawer() {
  const seen = useApp((s) => !!s.tips['write-intro']);
  const dismiss = useApp((s) => s.dismissTip);
  const [i, setI] = useState(0);
  return (
    <AnimatePresence>
      {!seen && (
        <motion.aside
          className="tips"
          aria-label="Writing tips"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'tween', duration: 0.6, ease: [0.23, 1, 0.32, 1], delay: 0.4 }}
        >
          <button className="tips__close" aria-label="Close tips" onClick={() => dismiss('write-intro')}>
            <IconClose size={18} strokeWidth={1.8} />
          </button>
          <button className="tips__nav is-prev" aria-label="Previous tip" disabled={i === 0} onClick={() => setI((n) => n - 1)}>
            <IconChevronLeft size={22} strokeWidth={1.6} />
          </button>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={i} className="tips__slide" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
              <p className="tips__text">{tips[i].text}</p>
              {tips[i].demo}
            </motion.div>
          </AnimatePresence>
          <button
            className="tips__nav is-next"
            aria-label={i === tips.length - 1 ? 'Done' : 'Next tip'}
            onClick={() => (i === tips.length - 1 ? dismiss('write-intro') : setI((n) => n + 1))}
          >
            <IconChevronRight size={22} strokeWidth={1.6} />
          </button>
          <div className="tips__dots" aria-hidden="true">
            {tips.map((_, k) => (
              <span key={k} className={k === i ? 'is-on' : ''} />
            ))}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

/* ── Publish ─────────────────────────────────────────────────── */

function mySegments(): [string, string][] {
  const steps = compactSteps(me.path);
  const out: [string, string][] = [];
  const now = steps.find((s) => s.status === 'present') ?? steps[steps.length - 1];
  for (const f of me.futures) out.push([now.wp, f.destination]);
  for (let i = steps.length - 1; i > 0; i--) out.push([steps[i - 1].wp, steps[i].wp]);
  return out;
}

const kindCopy: Record<MyPostKind, { label: string; note: string }> = {
  story: { label: 'Story', note: 'A move you made or are making, told in your own words. It appears on your profile and in For you for people on this stretch.' },
  question: { label: 'Question', note: 'Your question goes first to people who have already made this move, and they answer with their Path.' },
  community: { label: 'Community post', note: 'A conversation in one of your communities. Members see it in Following.' },
};

function PublishSheet({ open, onClose, title, getBody }: { open: boolean; onClose: () => void; title: string; getBody: () => string }) {
  const joined = useApp((s) => s.joined);
  const publish = useWriting((s) => s.publish);
  const toast = useUI((s) => s.showToast);
  const navigate = useNavigate();
  const segments = mySegments();
  const mine = Object.keys(joined).filter((k) => joined[k] && communities[k]);
  const [kind, setKind] = useState<MyPostKind>('story');
  const [seg, setSeg] = useState<number>(0);
  const [community, setCommunity] = useState<string>('');
  const [previewTitle, setPreviewTitle] = useState(title);
  const [subtitle, setSubtitle] = useState('');
  const [html, setHtml] = useState('');

  useEffect(() => {
    if (!open) return;
    const h = getBody();
    setHtml(h);
    setPreviewTitle(title);
    const tmp = document.createElement('div');
    tmp.innerHTML = h;
    const firstText = Array.from(tmp.querySelectorAll('p')).map((p) => p.textContent?.trim()).find(Boolean) ?? '';
    setSubtitle(firstText.length > 140 ? `${firstText.slice(0, 137).trimEnd()}…` : firstText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (kind === 'community' && !community) setCommunity(mine[0] ?? '');
  }, [kind, community, mine]);

  const image = (() => {
    const m = /<img[^>]+src="([^"]+)"/.exec(html);
    return m?.[1];
  })();

  const submit = () => {
    const s = seg >= 0 ? segments[seg] : undefined;
    const post = publish({
      kind,
      title: previewTitle.trim() || title.trim(),
      subtitle: subtitle.trim() || undefined,
      html,
      image,
      segment: s,
      community: community || undefined,
    });
    haptic([10, 40, 12]);
    onClose();
    toast(kind === 'question' ? 'Question posted' : 'Published');
    navigate(`/posts/${post.id}`);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Publish" width={820} label="Publish">
      <div className="pub">
        <section className="pub__preview">
          <h3 className="pub__h">Preview</h3>
          <div className={`pub__image ${image ? '' : 'is-empty'}`}>
            {image ? <img src={image} alt="" /> : <span>Add a photo to your post to make it more inviting to readers.</span>}
          </div>
          <input className="pub__title" value={previewTitle} onChange={(e) => setPreviewTitle(e.target.value)} placeholder="Write a preview title" aria-label="Preview title" />
          <input className="pub__subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Write a preview subtitle…" aria-label="Preview subtitle" />
          <p className="pub__note">This changes how your post appears in For you and on your profile, not the post itself.</p>
        </section>
        <section className="pub__options">
          <p className="pub__as">
            Publishing as <strong>{me.name}</strong>
          </p>
          <h3 className="pub__h">What is it?</h3>
          <Segmented
            value={kind}
            onChange={setKind}
            ariaLabel="Kind of post"
            options={(Object.keys(kindCopy) as MyPostKind[]).map((k) => ({ value: k, label: kindCopy[k].label }))}
          />
          <p className="pub__kind-note">{kindCopy[kind].note}</p>

          <h3 className="pub__h">Which stretch of your Path is it about?</h3>
          <div className="pub__segs">
            {segments.map(([a, b], i) => (
              <button key={`${a}-${b}`} type="button" className={`pub__seg ${seg === i ? 'is-on' : ''}`} aria-pressed={seg === i} onClick={() => setSeg(i)}>
                {wp(a).short} → {wp(b).short}
              </button>
            ))}
            <button type="button" className={`pub__seg ${seg === -1 ? 'is-on' : ''}`} aria-pressed={seg === -1} onClick={() => setSeg(-1)}>
              None
            </button>
          </div>

          <h3 className="pub__h">{kind === 'community' ? 'Post in' : 'Also share in a community'}</h3>
          <select className="pub__select" value={community} onChange={(e) => setCommunity(e.target.value)} aria-label="Community">
            {kind !== 'community' && <option value="">Just your profile and For you</option>}
            {mine.map((id) => (
              <option key={id} value={id}>
                {communities[id].title}
              </option>
            ))}
          </select>

          <div className="pub__actions">
            <Button variant="filled" size="medium" disabled={!previewTitle.trim() || (kind === 'community' && !community)} onClick={submit}>
              {kind === 'question' ? 'Post question' : 'Publish now'}
            </Button>
            <button type="button" className="pub__cancel" onClick={onClose}>
              Keep editing
            </button>
          </div>
        </section>
      </div>
    </Sheet>
  );
}
