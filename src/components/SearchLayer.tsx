import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { people } from '../data/people';
import { communities } from '../data/communities';
import { search, suggestions, type Result } from '../lib/search';
import { springs } from '../lib/motion';
import { useUI } from '../lib/ui';
import { IconArrowUpRight, IconBook, IconClose, IconFlag, IconQuestion, IconSearch } from './icons';
import { AvatarStack } from './ui';
import './search.css';

const groupTitle: Record<Result['type'], string> = {
  destination: 'Destinations',
  person: 'People',
  community: 'Path Communities',
  question: 'Questions',
  story: 'Stories',
};

export function SearchField({
  value,
  onChange,
  autoFocus,
  placeholder = 'Where could you go?',
  onCancel,
}: {
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
  placeholder?: string;
  onCancel?: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) setTimeout(() => ref.current?.focus(), 60);
  }, [autoFocus]);
  return (
    <div className="search-field">
      <label className="search-field__box">
        <IconSearch size={18} />
        <input
          ref={ref}
          type="search"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Search"
          enterKeyHint="search"
        />
        {value && (
          <button className="search-field__clear" onClick={() => onChange('')} aria-label="Clear">
            <IconClose size={11} strokeWidth={3} />
          </button>
        )}
      </label>
      {onCancel && (
        <button className="search-field__cancel" onClick={onCancel}>
          Cancel
        </button>
      )}
    </div>
  );
}

export function SearchResults({ q, onPick, onSuggest }: { q: string; onPick: (href: string) => void; onSuggest: (s: string) => void }) {
  const results = useMemo(() => search(q), [q]);
  const groups = useMemo(() => {
    const m = new Map<Result['type'], Result[]>();
    results.forEach((r) => m.set(r.type, [...(m.get(r.type) ?? []), r]));
    return [...m.entries()];
  }, [results]);

  if (!q.trim())
    return (
      <div className="search-empty">
        <p className="t-footnote search-empty__h">Try a destination</p>
        <ul>
          {suggestions.map((s) => (
            <li key={s}>
              <button className="search-suggest" onClick={() => onSuggest(s)}>
                <IconFlag size={18} />
                <span className="t-body">{s}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );

  if (!results.length)
    return (
      <div className="search-none">
        <p className="t-headline">No Paths lead there yet</p>
        <p className="t-subhead c-2">Try a role, a field, or a person’s name.</p>
      </div>
    );

  return (
    <div className="search-results">
      {groups.map(([type, items]) => (
        <section key={type}>
          <h3 className="search-results__h t-footnote">{groupTitle[type]}</h3>
          <ul>
            {items.slice(0, type === 'person' ? 6 : 4).map((r) => (
              <li key={`${r.type}-${r.id}`}>
                <button className="search-hit" onClick={() => onPick(r.href)}>
                  <span className="search-hit__lead">
                    {r.type === 'person' ? (
                      <img src={people[r.id].photo} alt="" />
                    ) : r.type === 'destination' ? (
                      <IconFlag size={20} />
                    ) : r.type === 'community' ? (
                      <AvatarStack ids={communities[r.id].memberIds.slice(0, 2)} size={20} max={2} />
                    ) : r.type === 'question' ? (
                      <IconQuestion size={20} />
                    ) : (
                      <IconBook size={20} />
                    )}
                  </span>
                  <span className="search-hit__text">
                    <span className="t-body">{r.title}</span>
                    <span className="t-footnote c-2 truncate">{r.sub}</span>
                  </span>
                  {r.type === 'destination' && <IconArrowUpRight size={16} className="c-3" />}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function SearchLayer() {
  const open = useUI((s) => s.search);
  const setOpen = useUI((s) => s.setSearch);
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  useEffect(() => {
    if (!open) return;
    setQ('');
    const on = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [open, setOpen]);
  const pick = (href: string) => {
    setOpen(false);
    navigate(href);
  };
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="search-layer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} onClick={() => setOpen(false)}>
          <motion.div
            className="search-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.99, transition: { duration: 0.12 } }}
            transition={springs.snappy}
          >
            <SearchField value={q} onChange={setQ} autoFocus placeholder="Search destinations, people, communities…" />
            <div className="search-panel__body">
              <SearchResults q={q} onPick={pick} onSuggest={(s) => pick(`/discover?to=${search(s)[0]?.id ?? 'pharma-rnd'}`)} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
