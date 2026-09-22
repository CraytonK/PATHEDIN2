import { motion, type HTMLMotionProps } from 'framer-motion';
import { forwardRef, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { springs, haptic } from '../lib/motion';
import { people } from '../data/people';
import type { RelationKind } from '../lib/relations';
import { IconBookmark, IconChevronRight } from './icons';
import { usePeek } from './Peek';
import { useApp } from '../lib/store';
import './ui.css';

/* ── Avatar ─────────────────────────────────────────────────── */

export function Avatar({
  id,
  size = 40,
  ring,
  peek = true,
  className = '',
}: {
  id: string;
  size?: number;
  ring?: boolean;
  peek?: boolean;
  className?: string;
}) {
  const p = people[id];
  const handlers = usePeek(peek ? id : undefined);
  const [loaded, setLoaded] = useState(false);
  if (!p) return null;
  return (
    <span className={`avatar ${ring ? 'avatar--ring' : ''} ${className}`} style={{ width: size, height: size }} {...handlers}>
      <img
        src={p.photo}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        draggable={false}
        className={loaded ? 'is-loaded' : ''}
        onLoad={() => setLoaded(true)}
        ref={(el) => {
          if (el?.complete && el.naturalWidth && !loaded) setLoaded(true);
        }}
      />
    </span>
  );
}

export function AvatarStack({ ids, size = 24, max = 4, label }: { ids: string[]; size?: number; max?: number; label?: string }) {
  const shown = ids.slice(0, max);
  const rest = ids.length - shown.length;
  return (
    <span className="avatar-stack" aria-label={label}>
      <span className="avatar-stack__faces" style={{ height: size }}>
        {shown.map((id, i) => (
          <span key={id} className="avatar-stack__item" style={{ zIndex: shown.length - i, marginLeft: i === 0 ? 0 : -size * 0.3 }}>
            <Avatar id={id} size={size} peek={false} />
          </span>
        ))}
        {rest > 0 && (
          <span className="avatar-stack__more t-caption2" style={{ width: size, height: size, marginLeft: -size * 0.3 }}>
            +{rest}
          </span>
        )}
      </span>
    </span>
  );
}

/* ── Person name that can be peeked ─────────────────────────── */

export function PersonName({ id, className = '', link = true }: { id: string; className?: string; link?: boolean }) {
  const handlers = usePeek(id);
  const p = people[id];
  if (!p) return null;
  if (!link) return <span className={className}>{p.name}</span>;
  return (
    <Link to={`/p/${id}`} className={`person-name ${className}`} {...handlers}>
      {p.name}
    </Link>
  );
}

/* ── Buttons ────────────────────────────────────────────────── */

type Variant = 'filled' | 'tinted' | 'gray' | 'plain' | 'ink' | 'outline';
type Size = 'small' | 'medium' | 'large';

type ButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> & {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  children?: ReactNode;
  block?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'filled', size = 'medium', icon, children, block, className = '', onClick, ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      className={`btn btn--${variant} btn--${size} ${block ? 'btn--block' : ''} ${className}`}
      whileTap={{ scale: 0.965 }}
      transition={springs.press}
      onClick={(e) => {
        haptic(6);
        onClick?.(e);
      }}
      {...rest}
    >
      {icon && <span className="btn__icon">{icon}</span>}
      {children && <span className="btn__label">{children}</span>}
    </motion.button>
  );
});

export function IconButton({
  label,
  children,
  onClick,
  className = '',
  badge,
  active,
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  badge?: number;
  active?: boolean;
}) {
  return (
    <motion.button
      className={`icon-btn ${active ? 'is-active' : ''} ${className}`}
      aria-label={label}
      title={label}
      whileTap={{ scale: 0.9 }}
      transition={springs.press}
      onClick={() => {
        haptic(6);
        onClick?.();
      }}
    >
      {children}
      {!!badge && <span className="badge t-caption2">{badge}</span>}
    </motion.button>
  );
}

/* ── Save (bookmark) toggle ─────────────────────────────────── */

export function SaveToggle({ saveKey, label = 'Save', compact }: { saveKey: string; label?: string; compact?: boolean }) {
  const saved = useApp((s) => !!s.saved[saveKey]);
  const toggle = useApp((s) => s.toggleSave);
  return (
    <motion.button
      className={`save-toggle ${saved ? 'is-on' : ''} ${compact ? 'save-toggle--compact' : ''}`}
      aria-pressed={saved}
      aria-label={saved ? 'Saved' : label}
      title={saved ? 'Saved' : label}
      whileTap={{ scale: 0.86 }}
      transition={springs.press}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        haptic(8);
        toggle(saveKey);
      }}
    >
      <motion.span key={String(saved)} initial={{ scale: saved ? 0.6 : 1 }} animate={{ scale: 1 }} transition={springs.settle}>
        <IconBookmark size={20} filled={saved} />
      </motion.span>
      {!compact && <span className="t-footnote">{saved ? 'Saved' : label}</span>}
    </motion.button>
  );
}

/* ── Segmented control (HIG) ────────────────────────────────── */

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  size = 'regular',
  ariaLabel,
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  size?: 'regular' | 'large';
  ariaLabel?: string;
}) {
  const [ref, box] = useActiveBox(value);
  return (
    <div ref={ref} className={`segmented segmented--${size}`} role="tablist" aria-label={ariaLabel}>
      {box && <motion.span className="segmented__thumb" initial={false} animate={{ x: box.left, width: box.width }} transition={springs.snappy} />}
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            data-value={o.value}
            className={`segmented__item ${active ? 'is-active' : ''}`}
            onClick={() => {
              if (!active) haptic(4);
              onChange(o.value);
            }}
          >
            <span className="segmented__label">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Position of the active item, measured with offsetLeft/offsetWidth so the indicator
 * isn't thrown off by transforms on ancestors (page transitions, sheets).
 */
function useActiveBox(value: string) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ left: number; width: number } | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const active = el.querySelector<HTMLElement>(`[data-value="${CSS.escape(value)}"]`);
      if (active) setBox({ left: active.offsetLeft, width: active.offsetWidth });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [value]);
  return [ref, box] as const;
}

/* ── Text tabs with a sliding underline (for longer filter sets) ─ */

export function TextTabs<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; count?: number }[];
  onChange: (v: T) => void;
}) {
  const [ref, box] = useActiveBox(value);
  return (
    <div ref={ref} className="text-tabs" role="tablist">
      {box && <motion.span className="text-tabs__bar" initial={false} animate={{ x: box.left, width: box.width }} transition={springs.snappy} />}
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            data-value={o.value}
            className={`text-tabs__item ${active ? 'is-active' : ''}`}
            onClick={() => {
              if (!active) haptic(4);
              onChange(o.value);
            }}
          >
            {o.label}
            {o.count !== undefined && <span className="text-tabs__count t-num">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ── Section header ─────────────────────────────────────────── */

export function SectionHeader({
  title,
  subtitle,
  to,
  action = 'See all',
  size = 'title3',
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  to?: string;
  action?: string;
  size?: 'title2' | 'title3' | 'headline';
}) {
  return (
    <div className="section-header">
      <div>
        <h2 className={`t-${size}`}>{title}</h2>
        {subtitle && <p className="t-subhead c-2 section-header__sub">{subtitle}</p>}
      </div>
      {to && (
        <Link to={to} className="section-header__link t-subhead">
          {action}
          <IconChevronRight size={14} strokeWidth={2.4} />
        </Link>
      )}
    </div>
  );
}

/* ── Relation glyphs: small, meaningful marks for how someone relates to your Path ── */

export function RelationGlyph({ kind, size = 16 }: { kind: RelationKind; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, 'aria-hidden': true };
  switch (kind) {
    case 'twin':
      return (
        <svg {...common}>
          <path d="M2 5.5h12M2 10.5h12" />
          <circle cx="10.5" cy="5.5" r="1.8" fill="currentColor" stroke="none" />
          <circle cx="10.5" cy="10.5" r="1.8" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'peer':
      return (
        <svg {...common}>
          <path d="M2 8h12" />
          <circle cx="6" cy="8" r="2" fill="currentColor" stroke="none" />
          <circle cx="10.5" cy="8" r="2" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'ahead':
      return (
        <svg {...common}>
          <path d="M2 8h12" />
          <circle cx="4.5" cy="8" r="2" fill="var(--bg)" />
          <circle cx="12" cy="8" r="2" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'guide':
      return (
        <svg {...common}>
          <path d="M2 8h7" />
          <circle cx="11.5" cy="8" r="3" />
          <circle cx="11.5" cy="8" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'explorer':
      return (
        <svg {...common}>
          <path d="M2 8h4.5l3.5-4H14M6.5 8l3.5 4H14" strokeDasharray="0 0" />
          <circle cx="13.2" cy="4" r="1.3" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'behind':
      return (
        <svg {...common}>
          <path d="M2 8h12" />
          <circle cx="4.5" cy="8" r="2" fill="currentColor" stroke="none" />
          <circle cx="12" cy="8" r="2" fill="var(--bg)" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M2 8h12" />
        </svg>
      );
  }
}

export function RelationTag({ kind, label, className = '' }: { kind: RelationKind; label: string; className?: string }) {
  return (
    <span className={`relation-tag t-footnote ${className}`}>
      <span className="relation-tag__glyph">
        <RelationGlyph kind={kind} size={15} />
      </span>
      {label}
    </span>
  );
}

/* ── Inset grouped list (HIG) ───────────────────────────────── */

export interface ListRow {
  icon: ReactNode;
  title: string;
  detail?: string;
  value?: ReactNode;
  to?: string;
  onClick?: () => void;
}

export function GroupedList({ rows, header }: { rows: ListRow[]; header?: string }) {
  return (
    <div className="glist">
      {header && <p className="glist__header t-footnote">{header}</p>}
      <ul className="glist__rows">
        {rows.map((r) => {
          const inner = (
            <>
              <span className="glist__icon">{r.icon}</span>
              <span className="glist__text">
                <span className="t-body">{r.title}</span>
                {r.detail && <span className="t-footnote c-2">{r.detail}</span>}
              </span>
              {r.value !== undefined && <span className="glist__value t-callout">{r.value}</span>}
              {r.to && <IconChevronRight size={14} strokeWidth={2.6} className="glist__chev" />}
            </>
          );
          return (
            <li key={r.title}>
              {r.to ? (
                <Link to={r.to} className="glist__row">
                  {inner}
                </Link>
              ) : (
                <button className="glist__row" onClick={r.onClick}>
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ── Misc ───────────────────────────────────────────────────── */

export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => (p.startsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>))}
    </>
  );
}

export function Dot() {
  return <span className="dot-sep" aria-hidden="true">·</span>;
}

export function formatCount(n: number): string {
  return n >= 10000 ? `${(n / 1000).toFixed(0)}k` : n.toLocaleString('en-CA');
}
