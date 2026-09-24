import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sheet } from '../components/chrome';
import { MyPostItem } from '../components/FeedItems';
import { Avatar, Button, Segmented } from '../components/ui';
import {
  IconBold,
  IconBreak,
  IconCheck,
  IconChevronDown,
  IconClose,
  IconEllipsis,
  IconHeading,
  IconImage,
  IconItalic,
  IconLink,
  IconPath,
  IconPeople,
  IconQuote,
} from '../components/icons';
import { communities } from '../data/communities';
import { me, ME } from '../data/people';
import { wp } from '../data/waypoints';
import { compactSteps, stepsWithFuture } from '../lib/relations';
import { haptic, springs, useIsMobile } from '../lib/motion';
import { useApp } from '../lib/store';
import { useUI } from '../lib/ui';
import { sanitize, useWriting, type MyPost, type MyPostKind } from '../lib/writing';
import './write.css';

/*
  Write — a page for telling the people one step behind you what a stretch of your Path was like.
  - The top line frames every post: "Writing a Story about MSc Chem → Pharma R&D". Both are choices,
    and the page's prompts follow the kind you pick.
  - A headline, a one-line summary and the body, set as they'll be read.
  - One bar at the bottom holds every tool: bold, italic, link, heading, quote, then photo, your Path
    and a section break. It stays put, so nothing pops up over your words.
  - Review shows the post as it will sit in For you, then shares it with the people on that stretch.
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

/* ── What you can write, and how the page prompts for each ───── */

const kindCopy: Record<MyPostKind, { label: string; title: string; body: string; note: string; action: string }> = {
  story: {
    label: 'Story',
    title: 'Headline',
    body: 'What was it really like? Write it for someone one step behind you.',
    note: 'A move you made or are making, in your own words. It sits on your Path and reaches people on this stretch first.',
    action: 'Share story',
  },
  question: {
    label: 'Question',
    title: 'Your question',
    body: 'Give the people ahead of you what they need to answer: where you are, what you’re weighing, what you’ve tried.',
    note: 'Goes first to people who have already made this move. They answer with their Path.',
    action: 'Ask question',
  },
  community: {
    label: 'Community post',
    title: 'Start a conversation',
    body: 'What would you like to talk through with people on this journey?',
    note: 'A conversation in one of your communities. Members see it in Following.',
    action: 'Post to community',
  },
};
const kinds = Object.keys(kindCopy) as MyPostKind[];

/** The stretches you can write about: from now to each place you're heading, then each step you've taken, latest first. */
function mySegments(): [string, string][] {
  const steps = compactSteps(me.path);
  const out: [string, string][] = [];
  const now = steps.find((s) => s.status === 'present') ?? steps[steps.length - 1];
  for (const f of me.futures) out.push([now.wp, f.destination]);
  for (let i = steps.length - 1; i > 0; i--) out.push([steps[i - 1].wp, steps[i].wp]);
  return out;
}
const segKey = (s: [string, string] | null) => (s ? `${s[0]}|${s[1]}` : 'none');
const segLabel = (s: [string, string]) => `${wp(s[0]).short} → ${wp(s[1]).short}`;

export function WriteScreen() {
  const draft = useWriting((s) => s.draft);
  const saveDraft = useWriting((s) => s.saveDraft);
  const stored = useWriting((s) => s.stored);
  const segments = useMemo(mySegments, []);
  const [title, setTitle] = useState(draft.title);
  const [dek, setDek] = useState(draft.dek ?? '');
  const [kind, setKindState] = useState<MyPostKind>(draft.kind ?? 'story');
  const [segment, setSegmentState] = useState<[string, string] | null>(draft.segment === undefined ? (segments[0] ?? null) : draft.segment);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>(draft.updated ? 'saved' : 'idle');
  const [hasBody, setHasBody] = useState(false);
  const [editing, setEditing] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [picked, setPicked] = useState<HTMLElement | null>(null);
  const body = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const dekRef = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latest = useRef({ title, dek });
  latest.current = { title, dek };
  const isMobile = useIsMobile();
  const toast = useUI((s) => s.showToast);
  const copy = kindCopy[kind];

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

  // Headline and summary grow with their text.
  useLayoutEffect(() => {
    for (const t of [titleRef.current, dekRef.current]) {
      if (!t) continue;
      t.style.height = 'auto';
      t.style.height = `${t.scrollHeight}px`;
    }
  }, [title, dek, kind, isMobile]);

  /** Keep the words a moment after the last keystroke. */
  const save = useCallback(() => {
    setStatus('saving');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const el = body.current;
      if (!el) return;
      saveDraft({ ...latest.current, html: sanitize(el.innerHTML) });
      setStatus('saved');
    }, 500);
  }, [saveDraft]);
  useEffect(() => () => clearTimeout(saveTimer.current), []);

  const setKind = (k: MyPostKind) => {
    setKindState(k);
    saveDraft({ kind: k });
  };
  const setSegment = (s: [string, string] | null) => {
    setSegmentState(s);
    saveDraft({ segment: s });
  };

  const refresh = useCallback(() => {
    const el = body.current;
    if (!el) return;
    if (!el.firstElementChild) {
      el.innerHTML = EMPTY_BLOCK;
      placeCaret(el.querySelector('p')!);
    }
    setHasBody(!!el.textContent?.trim() || !!el.querySelector('figure, hr'));
  }, []);

  /** Where a new block goes: the line with the caret, else the end. */
  const pendingTarget = useRef<HTMLElement | null>(null);
  const currentTarget = () => {
    const el = body.current;
    if (!el) return null;
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
    el.focus({ preventScroll: true });
    placeCaret(next);
    next.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
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
  const addPath = () => insertBlock(pathEmbedHtml());
  const addBreak = () => insertBlock('<hr>');

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

  const canReview = !!title.trim() && hasBody;
  const framing = <Framing kind={kind} onKind={setKind} segment={segment} onSegment={setSegment} segments={segments} />;

  return (
    <div className="write">
      <header className="write__bar">
        <div className="write__side">
          <Link to="/" className="write__close" aria-label="Close" data-tip={isMobile ? undefined : 'Your draft is kept'} data-tip-pos="below">
            <IconClose size={18} strokeWidth={1.9} />
            {!isMobile && <span>Close</span>}
          </Link>
        </div>
        {!isMobile && framing}
        <div className="write__side is-end">
          <span className="write__saved" aria-live="polite">
            {status === 'saving' && 'Saving…'}
            {status === 'saved' && (
              <>
                <IconCheck size={13} strokeWidth={2.4} /> {stored ? 'Saved' : 'Saved for this visit'}
              </>
            )}
          </span>
          <MoreMenu
            onTips={() => setTipsOpen(true)}
            onDiscard={() => {
              if (body.current) body.current.innerHTML = EMPTY_BLOCK;
              setTitle('');
              setDek('');
              useWriting.getState().clearDraft();
              setStatus('idle');
              setHasBody(false);
              titleRef.current?.focus();
            }}
          />
          <Button variant="filled" size="small" disabled={!canReview} onClick={() => setReviewing(true)}>
            Review
          </Button>
        </div>
      </header>
      {isMobile && <div className="write__framing-row">{framing}</div>}

      <main className="write__page">
        <textarea
          ref={titleRef}
          className="write__title"
          rows={1}
          placeholder={copy.title}
          value={title}
          aria-label={copy.title}
          onChange={(e) => {
            setTitle(e.target.value);
            save();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              dekRef.current?.focus();
            }
          }}
        />
        <textarea
          ref={dekRef}
          className="write__dek"
          rows={1}
          placeholder="Add a one-line summary (optional)"
          value={dek}
          aria-label="Summary"
          onChange={(e) => {
            setDek(e.target.value.replace(/\n/g, ' '));
            save();
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
            aria-label="Your post"
            data-placeholder={copy.body}
            onFocus={() => setEditing(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setEditing(false);
            }}
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
          />
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

      <ComposeBar root={body} editing={editing} onChange={save} onPhoto={addPhoto} onPath={addPath} onBreak={addBreak} />

      <TipsSheet open={tipsOpen} onClose={() => setTipsOpen(false)} />
      <ReviewSheet
        open={reviewing}
        onClose={() => setReviewing(false)}
        title={title}
        dek={dek}
        getBody={() => (body.current ? sanitize(body.current.innerHTML) : '')}
        kind={kind}
        onKind={setKind}
        segment={segment}
        onSegment={setSegment}
        segments={segments}
      />
    </div>
  );
}

/* ── "Writing a Story about MSc Chem → Pharma R&D" ───────────── */

function Framing({
  kind,
  onKind,
  segment,
  onSegment,
  segments,
}: {
  kind: MyPostKind;
  onKind: (k: MyPostKind) => void;
  segment: [string, string] | null;
  onSegment: (s: [string, string] | null) => void;
  segments: [string, string][];
}) {
  const now = segments[0]?.[0];
  return (
    <div className="framing">
      <span className="framing__word">Writing a</span>
      <Picker
        ariaLabel="Kind of post"
        value={kind}
        label={kindCopy[kind].label}
        options={kinds.map((k) => ({ value: k, label: kindCopy[k].label }))}
        onChange={(v) => onKind(v as MyPostKind)}
      />
      <span className="framing__word">about</span>
      <Picker
        ariaLabel="Stretch of your Path"
        value={segKey(segment)}
        icon={<IconPath size={15} />}
        label={segment ? segLabel(segment) : 'your Path in general'}
        options={[
          ...segments.map((s) => ({ value: segKey(s), label: segLabel(s), hint: s[0] === now ? 'Where you’re heading' : 'A step you’ve taken' })),
          { value: 'none', label: 'Your Path in general', hint: 'Not about one stretch' },
        ]}
        onChange={(v) => onSegment(v === 'none' ? null : (segments.find((s) => segKey(s) === v) ?? null))}
      />
    </div>
  );
}

function Picker({
  ariaLabel,
  value,
  label,
  icon,
  options,
  onChange,
}: {
  ariaLabel: string;
  value: string;
  label: string;
  icon?: ReactNode;
  options: { value: string; label: string; hint?: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const off = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('pointerdown', off);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('pointerdown', off);
      window.removeEventListener('keydown', esc);
    };
  }, [open]);
  return (
    <div className="pick" ref={ref}>
      <button type="button" className="pick__btn" aria-haspopup="listbox" aria-expanded={open} aria-label={`${ariaLabel}: ${label}`} onClick={() => setOpen((o) => !o)}>
        {icon}
        <span className="pick__value">{label}</span>
        <IconChevronDown size={13} strokeWidth={2.2} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="pick__menu"
            role="listbox"
            aria-label={ariaLabel}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            transition={springs.snappy}
          >
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={o.value === value}
                className={o.value === value ? 'is-on' : ''}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
              >
                <span className="pick__text">
                  <span>{o.label}</span>
                  {o.hint && <span className="pick__hint">{o.hint}</span>}
                </span>
                {o.value === value && <IconCheck size={15} />}
              </button>
            ))}
          </motion.div>
        )}
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

/* ── The compose bar: every tool, always in the same place ───── */

type Fmt = { bold: boolean; italic: boolean; link: boolean; block: string };
const NO_FMT: Fmt = { bold: false, italic: false, link: false, block: 'P' };

function ComposeBar({
  root,
  editing,
  onChange,
  onPhoto,
  onPath,
  onBreak,
}: {
  root: React.RefObject<HTMLDivElement | null>;
  editing: boolean;
  onChange: () => void;
  onPhoto: () => void;
  onPath: () => void;
  onBreak: () => void;
}) {
  const [fmt, setFmt] = useState<Fmt>(NO_FMT);
  const [hasSel, setHasSel] = useState(false);
  const [linking, setLinking] = useState(false);
  const [url, setUrl] = useState('');
  const saved = useRef<Range | null>(null);

  // Follow the selection in your text, so the tools show what's applied where you are.
  const read = useCallback(() => {
    const el = root.current;
    const sel = window.getSelection();
    if (!el || !sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    if (!el.contains(range.commonAncestorContainer)) return;
    saved.current = range.cloneRange();
    const node = range.commonAncestorContainer;
    const at = node instanceof HTMLElement ? node : node.parentElement;
    setHasSel(!sel.isCollapsed);
    setFmt({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      link: !!at?.closest('a'),
      block: blockAtCaret(el)?.tagName ?? 'P',
    });
  }, [root]);
  useEffect(() => {
    document.addEventListener('selectionchange', read);
    return () => document.removeEventListener('selectionchange', read);
  }, [read]);

  /** Put the selection back in your text if a tap moved it (the link field, a touch screen). */
  const restore = () => {
    const el = root.current;
    const sel = window.getSelection();
    if (!el || !sel || !saved.current) return;
    if (sel.rangeCount && el.contains(sel.getRangeAt(0).commonAncestorContainer)) return;
    el.focus({ preventScroll: true });
    sel.removeAllRanges();
    sel.addRange(saved.current);
  };
  const cmd = (name: string, value?: string) => {
    restore();
    document.execCommand(name, false, value);
    onChange();
    read();
  };
  const block = (tag: string) => cmd('formatBlock', fmt.block === tag ? '<p>' : `<${tag.toLowerCase()}>`);
  const startLink = () => {
    if (fmt.link) return cmd('unlink');
    setUrl('');
    setLinking(true);
  };
  const applyLink = () => {
    const href = /^(https?:|mailto:)/i.test(url) ? url : `https://${url}`;
    if (url.trim()) cmd('createLink', href);
    setLinking(false);
  };

  const off = !editing;
  return (
    <div
      className="compose"
      role="toolbar"
      aria-label="Format and add to your post"
      // Keep the caret in your text while you use the tools.
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).tagName !== 'INPUT') e.preventDefault();
      }}
    >
      {linking ? (
        <form
          className="compose__link"
          onSubmit={(e) => {
            e.preventDefault();
            applyLink();
          }}
        >
          <IconLink size={18} />
          <input autoFocus value={url} placeholder="Paste a link" aria-label="Link address" onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Escape' && setLinking(false)} />
          <button type="submit" className="compose__apply" disabled={!url.trim()}>
            Add link
          </button>
          <button type="button" className="compose__tool" aria-label="Cancel" onClick={() => setLinking(false)}>
            <IconClose size={16} />
          </button>
        </form>
      ) : (
        <>
          <Tool label="Bold" on={fmt.bold} off={off} onClick={() => cmd('bold')}>
            <IconBold size={19} />
          </Tool>
          <Tool label="Italic" on={fmt.italic} off={off} onClick={() => cmd('italic')}>
            <IconItalic size={19} />
          </Tool>
          <Tool label={fmt.link ? 'Remove link' : hasSel ? 'Link' : 'Select words to link'} on={fmt.link} off={off || (!hasSel && !fmt.link)} onClick={startLink}>
            <IconLink size={19} />
          </Tool>
          <span className="compose__sep" aria-hidden="true" />
          <Tool label="Heading" on={fmt.block === 'H2'} off={off} onClick={() => block('H2')}>
            <IconHeading size={19} />
          </Tool>
          <Tool label="Quote" on={fmt.block === 'BLOCKQUOTE'} off={off} onClick={() => block('BLOCKQUOTE')}>
            <IconQuote size={19} />
          </Tool>
          <span className="compose__sep" aria-hidden="true" />
          <Tool label="Add a photo" onClick={onPhoto}>
            <IconImage size={19} />
          </Tool>
          <Tool label="Add your Path" onClick={onPath}>
            <IconPath size={19} />
          </Tool>
          <Tool label="Section break" onClick={onBreak}>
            <IconBreak size={19} />
          </Tool>
        </>
      )}
    </div>
  );
}

function Tool({ label, on, off, onClick, children }: { label: string; on?: boolean; off?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      className={`compose__tool ${on ? 'is-on' : ''}`}
      aria-label={label}
      aria-pressed={on === undefined ? undefined : on}
      aria-disabled={off || undefined}
      data-tip={label}
      onClick={() => !off && onClick()}
    >
      {children}
    </button>
  );
}

/* ── "…" menu ────────────────────────────────────────────────── */

function MoreMenu({ onTips, onDiscard }: { onTips: () => void; onDiscard: () => void }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
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
            <button
              role="menuitem"
              onClick={() => {
                onTips();
                setOpen(false);
              }}
            >
              Tips for writing here
            </button>
            <button
              role="menuitem"
              className="is-danger"
              onClick={() => {
                if (!confirm) return setConfirm(true);
                onDiscard();
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

/* ── Tips, when you ask for them ─────────────────────────────── */

const tipList: { icon: ReactNode; title: string; text: string }[] = [
  {
    icon: <IconPeople size={20} />,
    title: 'Write for someone one step behind you',
    text: 'What do you wish you’d known at their step? Specifics beat advice: how long it took, the question that changed things, what you’d skip.',
  },
  {
    icon: <IconPath size={20} />,
    title: 'Choose the stretch it’s about',
    text: 'Pick it at the top of the page. People on that stretch see your post first, and it shows on that part of your Path.',
  },
  {
    icon: <IconImage size={20} />,
    title: 'Show where you were',
    text: 'Add a photo, or drop in your Path so readers can see the route behind the story.',
  },
  {
    icon: <IconHeading size={20} />,
    title: 'Format as you go',
    text: 'Click into your text and use the bar at the bottom for bold, italic, links, headings and quotes. ⌘B and ⌘I work too.',
  },
];

function TipsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Tips for writing here" width={480} detent="medium" label="Tips for writing here">
      <ul className="wtips">
        {tipList.map((t) => (
          <li key={t.title} className="wtips__item">
            <span className="wtips__icon">{t.icon}</span>
            <div>
              <p className="wtips__title">{t.title}</p>
              <p className="wtips__text">{t.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

/* ── Review, then share ──────────────────────────────────────── */

function ReviewSheet({
  open,
  onClose,
  title,
  dek,
  getBody,
  kind,
  onKind,
  segment,
  onSegment,
  segments,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  dek: string;
  getBody: () => string;
  kind: MyPostKind;
  onKind: (k: MyPostKind) => void;
  segment: [string, string] | null;
  onSegment: (s: [string, string] | null) => void;
  segments: [string, string][];
}) {
  const joined = useApp((s) => s.joined);
  const publish = useWriting((s) => s.publish);
  const toast = useUI((s) => s.showToast);
  const navigate = useNavigate();
  const mine = Object.keys(joined).filter((k) => joined[k] && communities[k]);
  const [community, setCommunity] = useState<string>('');
  const [html, setHtml] = useState('');

  useEffect(() => {
    if (open) setHtml(getBody());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (kind === 'community' && !community) setCommunity(mine[0] ?? '');
  }, [kind, community, mine]);

  const image = /<img[^>]+src="([^"]+)"/.exec(html)?.[1];
  const firstText = (() => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const t = Array.from(tmp.querySelectorAll('p')).map((p) => p.textContent?.trim()).find(Boolean) ?? '';
    return t.length > 150 ? `${t.slice(0, 147).trimEnd()}…` : t;
  })();
  const post: Omit<MyPost, 'id' | 'at'> = {
    kind,
    title: title.trim(),
    subtitle: dek.trim() || firstText || undefined,
    html,
    image,
    segment: segment ?? undefined,
    community: community || undefined,
  };
  const copy = kindCopy[kind];

  const submit = () => {
    const made = publish(post);
    haptic([10, 40, 12]);
    onClose();
    toast(kind === 'question' ? 'Question sent to people ahead of you' : kind === 'community' && community ? `Posted in ${communities[community].title}` : 'Story shared');
    navigate(`/posts/${made.id}`);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Review" width={860} label="Review your post">
      <div className="pub">
        <section className="pub__preview">
          <h3 className="pub__h">How it appears in For you</h3>
          <div className="pub__card" inert>
            <MyPostItem post={{ ...post, id: 'preview', at: Date.now() }} />
          </div>
          <p className="pub__note">The headline and summary come from your page. {image ? 'Your first photo is the thumbnail.' : 'Add a photo and the first one becomes the thumbnail.'}</p>
        </section>
        <section className="pub__options">
          <p className="pub__as">
            <Avatar id={ME} size={24} peek={false} /> Sharing as <strong>{me.name}</strong>
          </p>
          <h3 className="pub__h">What is it?</h3>
          <Segmented value={kind} onChange={onKind} ariaLabel="Kind of post" options={kinds.map((k) => ({ value: k, label: kindCopy[k].label }))} />
          <p className="pub__kind-note">{copy.note}</p>

          <h3 className="pub__h">Which stretch of your Path?</h3>
          <div className="pub__segs">
            {segments.map((s) => (
              <button key={segKey(s)} type="button" className={`pub__seg ${segKey(segment) === segKey(s) ? 'is-on' : ''}`} aria-pressed={segKey(segment) === segKey(s)} onClick={() => onSegment(s)}>
                {segLabel(s)}
              </button>
            ))}
            <button type="button" className={`pub__seg ${segment === null ? 'is-on' : ''}`} aria-pressed={segment === null} onClick={() => onSegment(null)}>
              In general
            </button>
          </div>

          <h3 className="pub__h">{kind === 'community' ? 'Post in' : 'Also share in a community'}</h3>
          <select className="pub__select" value={community} onChange={(e) => setCommunity(e.target.value)} aria-label="Community">
            {kind !== 'community' && <option value="">Only your Path and For you</option>}
            {mine.map((id) => (
              <option key={id} value={id}>
                {communities[id].title}
              </option>
            ))}
          </select>

          <div className="pub__actions">
            <Button variant="filled" size="medium" disabled={!post.title || (kind === 'community' && !community)} onClick={submit}>
              {copy.action}
            </Button>
            <button type="button" className="pub__cancel" onClick={onClose}>
              Keep writing
            </button>
          </div>
        </section>
      </div>
    </Sheet>
  );
}
