import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { communities } from '../data/communities';
import { people } from '../data/people';
import { springs } from '../lib/motion';
import { relationTo } from '../lib/relations';
import { search, type Result } from '../lib/search';
import { useApp } from '../lib/store';
import { switchTheme } from '../lib/theme';
import { useUI } from '../lib/ui';
import { IconAlign, IconArrowUpRight, IconBook, IconCalendar, IconCompass, IconCompose, IconFlag, IconMoon, IconPath, IconPeople, IconQuestion, IconSearch, IconSend, IconSun } from './icons';
import { AvatarStack } from './ui';
import './palette.css';

/*
  ⌘K — go anywhere on your Path. One field reaches every person, story, question, community and destination,
  and runs the things you do most. Keyboard first: ↑↓ to move, ↵ to open, esc to close. The highlighted row
  is a surface that slides between results.
*/

type Item = {
  key: string;
  group: string;
  title: string;
  sub?: string;
  lead: ReactNode;
  hint?: string;
  run: () => void;
};

const groupTitle: Record<Result['type'], string> = {
  person: 'People',
  story: 'Stories',
  question: 'Questions',
  community: 'Communities',
  destination: 'Destinations',
};
const groupOrder: Result['type'][] = ['person', 'destination', 'community', 'story', 'question'];

export function CommandPalette() {
  const open = useUI((s) => s.search);
  const setOpen = useUI((s) => s.setSearch);
  const openCompare = useUI((s) => s.openCompare);
  const openBooking = useUI((s) => s.openBooking);
  const theme = useApp((s) => s.theme);
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);

  const go = (href: string) => () => {
    setOpen(false);
    navigate(href);
  };

  const actions: Item[] = useMemo(() => {
    const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    return [
      { key: 'write', group: 'Actions', title: 'Write a story', sub: 'About a stretch of your Path', lead: <IconCompose size={17} />, run: go('/write') },
      { key: 'path', group: 'Actions', title: 'Open My Path', sub: 'Where you’ve been and where you’re heading', lead: <IconPath size={17} />, run: go('/path') },
      {
        key: 'book',
        group: 'Actions',
        title: `Book office hours with ${people.amara.name}`,
        sub: `Made your next move · ${people.amara.guide!.officeHours.when}`,
        lead: <IconCalendar size={17} />,
        run: () => {
          setOpen(false);
          openBooking('amara');
        },
      },
      {
        key: 'align',
        group: 'Actions',
        title: 'Align Paths with Sarah Lindqvist',
        sub: 'Your Path Twin',
        lead: <IconAlign size={17} />,
        run: () => {
          setOpen(false);
          openCompare('sarah');
        },
      },
      { key: 'discover', group: 'Actions', title: 'Discover people on your route', lead: <IconCompass size={17} />, run: go('/discover?tab=people') },
      { key: 'guides', group: 'Actions', title: 'Browse Path Guides', sub: 'Office hours with people who made your moves', lead: <IconSend size={17} />, run: go('/guides') },
      {
        key: 'theme',
        group: 'Actions',
        title: dark ? 'Switch to light appearance' : 'Switch to dark appearance',
        lead: dark ? <IconSun size={17} /> : <IconMoon size={17} />,
        run: () => {
          const from = document.querySelector('.cmdk__item.is-active');
          setOpen(false);
          switchTheme(dark ? 'light' : 'dark', from);
        },
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  const items: Item[] = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) {
      const suggested = ['sarah', 'amara', 'elena', 'daniel'].map((id) => {
        const p = people[id];
        return {
          key: `p-${id}`,
          group: 'People on your Path',
          title: p.name,
          sub: relationTo(id).label,
          lead: <img src={p.photo} alt="" />,
          run: go(`/p/${id}`),
        };
      });
      return [...actions.slice(0, 4), ...suggested];
    }
    const fromActions = actions.filter((a) => a.title.toLowerCase().includes(n) || a.sub?.toLowerCase().includes(n));
    const results = search(q);
    const found: Item[] = [];
    for (const type of groupOrder) {
      results
        .filter((r) => r.type === type)
        .slice(0, type === 'person' ? 5 : 3)
        .forEach((r) =>
          found.push({
            key: `${r.type}-${r.id}`,
            group: groupTitle[type],
            title: r.title,
            sub: r.sub,
            lead:
              r.type === 'person' ? (
                <img src={people[r.id].photo} alt="" />
              ) : r.type === 'destination' ? (
                <IconFlag size={17} />
              ) : r.type === 'community' ? (
                <AvatarStack ids={communities[r.id].memberIds.slice(0, 2)} size={16} max={2} />
              ) : r.type === 'question' ? (
                <IconQuestion size={17} />
              ) : (
                <IconBook size={17} />
              ),
            hint: r.type === 'destination' ? '↗' : undefined,
            run: go(r.href),
          }),
        );
    }
    return [...found, ...fromActions];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, actions]);

  useEffect(() => {
    if (!open) return;
    setQ('');
    setActive(0);
    setTimeout(() => input.current?.focus(), 30);
  }, [open]);
  useEffect(() => setActive(0), [q]);

  // Keep the highlighted row in view as the arrows move it.
  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(items.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      items[active]?.run();
    }
  };

  let lastGroup = '';
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="cmdk-layer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={{ duration: 0.16 }} onClick={() => setOpen(false)}>
          <motion.div
            className="cmdk"
            role="dialog"
            aria-modal="true"
            aria-label="Go anywhere"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={onKey}
            initial={{ opacity: 0, scale: 0.98, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.1 } }}
            transition={springs.snappy}
          >
            <label className="cmdk__field">
              <IconSearch size={17} strokeWidth={1.8} />
              <input
                ref={input}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search people, stories, communities, or run an action…"
                aria-label="Search or run an action"
                aria-controls="cmdk-list"
                aria-activedescendant={items[active] ? `cmdk-${items[active].key}` : undefined}
                role="combobox"
                aria-expanded="true"
                spellCheck={false}
              />
              <kbd className="kbd">esc</kbd>
            </label>
            <div className="cmdk__list" id="cmdk-list" role="listbox" ref={list}>
              {items.length === 0 && (
                <div className="cmdk__empty">
                  <IconPeople size={20} />
                  <p>No Paths lead there yet.</p>
                  <p className="c-3">Try a role, a field, a person’s name, or “write”.</p>
                </div>
              )}
              {items.map((it, i) => {
                const head = it.group !== lastGroup;
                lastGroup = it.group;
                return (
                  <div key={it.key}>
                    {head && <p className="cmdk__group">{it.group}</p>}
                    <button
                      type="button"
                      id={`cmdk-${it.key}`}
                      role="option"
                      aria-selected={i === active}
                      data-index={i}
                      className={`cmdk__item ${i === active ? 'is-active' : ''}`}
                      onMouseMove={() => i !== active && setActive(i)}
                      onClick={it.run}
                    >
                      {i === active && <motion.span layoutId="cmdk-active" className="cmdk__active" transition={springs.snappy} />}
                      <span className="cmdk__lead">{it.lead}</span>
                      <span className="cmdk__text">
                        <span className="cmdk__title">{it.title}</span>
                        {it.sub && <span className="cmdk__sub">{it.sub}</span>}
                      </span>
                      {it.hint === '↗' ? <IconArrowUpRight size={15} className="cmdk__arrow" /> : it.hint ? <kbd className="kbd">{it.hint}</kbd> : null}
                    </button>
                  </div>
                );
              })}
            </div>
            <footer className="cmdk__foot">
              <span>
                <kbd className="kbd">↑</kbd>
                <kbd className="kbd">↓</kbd> to move
              </span>
              <span>
                <kbd className="kbd">↵</kbd> to open
              </span>
              <span className="cmdk__brand">
                <IconPath size={14} /> PathedIn
              </span>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

