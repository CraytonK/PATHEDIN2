import type { SVGProps } from 'react';

/*
  A small, deliberate icon set drawn in the spirit of SF Symbols (regular weight, rounded caps).
  On the web we can't ship SF Symbols themselves, so each glyph is hand-drawn on a 24pt grid.
*/

type P = SVGProps<SVGSVGElement> & { size?: number };

// `filled` is consumed by glyphs that have a filled variant; never let it reach the DOM.
function Svg({ size = 24, children, strokeWidth = 1.75, filled: _filled, ...rest }: P & { filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconHome = ({ filled, ...p }: P & { filled?: boolean }) => (
  <Svg {...p}>
    <path d="M4 10.4 12 4l8 6.4V19a1.5 1.5 0 0 1-1.5 1.5H15v-5.5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5.5H5.5A1.5 1.5 0 0 1 4 19z" fill={filled ? 'currentColor' : 'none'} />
  </Svg>
);

/** The PathedIn symbol as a monochrome glyph: been (solid), now (ring with dot), going (open, dashed). */
export const IconPath = ({ filled, ...p }: P & { filled?: boolean }) => (
  <Svg {...p}>
    <path d="M6.2 17.8 12 12" />
    <path d="M12 12l5.8-5.8" strokeDasharray="1.6 2.6" />
    <circle cx="5.2" cy="18.8" r="2.3" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="2.6" fill="var(--bg, #fff)" />
    <circle cx="12" cy="12" r={filled ? 1.1 : 0.9} fill="currentColor" stroke="none" />
    <circle cx="18.8" cy="5.2" r="2.3" fill="var(--bg, #fff)" />
  </Svg>
);

export const IconCompass = ({ filled, ...p }: P & { filled?: boolean }) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" fill={filled ? 'currentColor' : 'none'} />
    <path d="m15.2 8.8-2 4.4-4.4 2 2-4.4z" fill={filled ? 'var(--bg, #fff)' : 'currentColor'} stroke={filled ? 'var(--bg, #fff)' : 'currentColor'} strokeWidth={1.2} />
  </Svg>
);

export const IconPeople = ({ filled, ...p }: P & { filled?: boolean }) => (
  <Svg {...p}>
    <circle cx="9" cy="8.5" r="3.2" fill={filled ? 'currentColor' : 'none'} />
    <path d="M3.5 19c.4-3.2 2.7-5 5.5-5s5.1 1.8 5.5 5" fill={filled ? 'currentColor' : 'none'} />
    <path d="M15.5 5.6a3 3 0 0 1 0 5.8" />
    <path d="M17 14.2c2 .5 3.3 2.1 3.5 4.8" />
  </Svg>
);

export const IconCommunity = ({ filled, ...p }: P & { filled?: boolean }) => (
  <Svg {...p}>
    <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h7A2.5 2.5 0 0 1 16 6.5v4a2.5 2.5 0 0 1-2.5 2.5H9l-3.2 2.6V13h.2A2 2 0 0 1 4 11z" fill={filled ? 'currentColor' : 'none'} />
    <path d="M18.5 8.5A1.5 1.5 0 0 1 20 10v4.5a2 2 0 0 1-2 2v2.6L14.8 16.5H11" />
  </Svg>
);

export const IconMessage = ({ filled, ...p }: P & { filled?: boolean }) => (
  <Svg {...p}>
    <path d="M12 4c4.7 0 8.5 3.2 8.5 7.2S16.7 18.4 12 18.4c-.9 0-1.8-.1-2.6-.3L5 20l1.1-3.6C4.4 15.1 3.5 13.2 3.5 11.2 3.5 7.2 7.3 4 12 4z" fill={filled ? 'currentColor' : 'none'} />
  </Svg>
);

export const IconBell = ({ filled, ...p }: P & { filled?: boolean }) => (
  <Svg {...p}>
    <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.8H4.5z" fill={filled ? 'currentColor' : 'none'} />
    <path d="M10 20.2a2.2 2.2 0 0 0 4 0" />
  </Svg>
);

export const IconSearch = (p: P) => (
  <Svg {...p}>
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="m15 15 5 5" />
  </Svg>
);

export const IconBookmark = ({ filled, ...p }: P & { filled?: boolean }) => (
  <Svg {...p}>
    <path d="M7 4.5h10a1 1 0 0 1 1 1V20l-6-4-6 4V5.5a1 1 0 0 1 1-1z" fill={filled ? 'currentColor' : 'none'} />
  </Svg>
);

export const IconChevronLeft = (p: P) => (
  <Svg {...p} strokeWidth={p.strokeWidth ?? 2.2}>
    <path d="M15 4.5 7.5 12l7.5 7.5" />
  </Svg>
);
export const IconChevronRight = (p: P) => (
  <Svg data-dir="forward" {...p} strokeWidth={p.strokeWidth ?? 2}>
    <path d="m9 5 7 7-7 7" />
  </Svg>
);
export const IconChevronDown = (p: P) => (
  <Svg {...p} strokeWidth={p.strokeWidth ?? 2}>
    <path d="m5 9 7 7 7-7" />
  </Svg>
);

export const IconClose = (p: P) => (
  <Svg {...p} strokeWidth={p.strokeWidth ?? 2}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const IconPlus = (p: P) => (
  <Svg {...p} strokeWidth={p.strokeWidth ?? 2}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const IconCheck = (p: P) => (
  <Svg {...p} strokeWidth={p.strokeWidth ?? 2.2}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
);

export const IconEllipsis = (p: P) => (
  <Svg {...p}>
    <circle cx="6" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="18" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconArrowUpRight = (p: P) => (
  <Svg data-dir="out" {...p}>
    <path d="M7 17 17 7M9 7h8v8" />
  </Svg>
);

export const IconArrowRight = (p: P) => (
  <Svg data-dir="forward" {...p}>
    <path d="M4.5 12h15M13.5 6l6 6-6 6" />
  </Svg>
);

export const IconArrowUp = (p: P) => (
  <Svg {...p} strokeWidth={p.strokeWidth ?? 2.2}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </Svg>
);

export const IconShare = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.5v11M8 7.5l4-4 4 4" />
    <path d="M8.5 10.5H7A1.5 1.5 0 0 0 5.5 12v7A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5h-1.5" />
  </Svg>
);

export const IconCalendar = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="5.5" width="16" height="14.5" rx="2.5" />
    <path d="M4 10h16M8.5 3.5v3.5M15.5 3.5v3.5" />
  </Svg>
);

export const IconFlag = ({ filled, ...p }: P & { filled?: boolean }) => (
  <Svg {...p}>
    <path d="M6 21V4" />
    <path d="M6 4.5c4-2 6.5 2 11 0v8.5c-4.5 2-7-2-11 0" fill={filled ? 'currentColor' : 'none'} />
  </Svg>
);

export const IconSignpost = (p: P) => (
  <Svg {...p}>
    <path d="M12 3v18" />
    <path d="M12 5h6l2.5 2.5L18 10h-6z" />
    <path d="M12 12H6l-2.5 2.5L6 17h6z" />
  </Svg>
);

export const IconQuestion = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.8c4.7 0 8.5 3.2 8.5 7.2s-3.8 7.2-8.5 7.2c-.9 0-1.8-.1-2.6-.3L5 19.8l1.1-3.6C4.4 14.9 3.5 13 3.5 11c0-4 3.8-7.2 8.5-7.2z" />
    <path d="M10 9.3a2.1 2.1 0 1 1 3 1.9c-.6.3-1 .8-1 1.4v.4" />
    <circle cx="12" cy="15" r=".6" fill="currentColor" />
  </Svg>
);

export const IconBook = (p: P) => (
  <Svg {...p}>
    <path d="M12 6.5c-1.8-1.3-4.3-2-7.5-2v13c3.2 0 5.7.7 7.5 2 1.8-1.3 4.3-2 7.5-2v-13c-3.2 0-5.7.7-7.5 2z" />
    <path d="M12 6.5v13" />
  </Svg>
);

export const IconPin = (p: P) => (
  <Svg {...p}>
    <path d="M12 21s6.5-5.8 6.5-11A6.5 6.5 0 0 0 5.5 10c0 5.2 6.5 11 6.5 11z" />
    <circle cx="12" cy="10" r="2.3" />
  </Svg>
);

export const IconSend = (p: P) => (
  <Svg {...p}>
    <path d="M20.5 3.5 10 14M20.5 3.5 14 20.5l-4-6.5-6.5-4z" />
  </Svg>
);

/** Two walked Paths (solid nodes) meeting at a shared "now" node: used for "Align Paths". */
export const IconAlign = (p: P) => (
  <Svg {...p}>
    <path d="M6.3 6H9c3 0 3.6 6 6.4 6" />
    <path d="M6.3 18H9c3 0 3.6-6 6.4-6" />
    <circle cx="4.3" cy="6" r="2" fill="currentColor" stroke="none" />
    <circle cx="4.3" cy="18" r="2" fill="currentColor" stroke="none" />
    <circle cx="18.3" cy="12" r="2.7" />
    <circle cx="18.3" cy="12" r="0.9" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconPersonAdd = (p: P) => (
  <Svg {...p}>
    <circle cx="10" cy="8" r="3.5" />
    <path d="M3.5 19.5c.5-3.5 3.2-5.5 6.5-5.5 1.3 0 2.5.3 3.5.9" />
    <path d="M18 13.5v6M15 16.5h6" />
  </Svg>
);

export const IconClock = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);

export const IconMoon = (p: P) => (
  <Svg {...p}>
    <path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z" />
  </Svg>
);

export const IconSun = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3.8" />
    <path d="M12 3v1.8M12 19.2V21M3 12h1.8M19.2 12H21M5.6 5.6l1.3 1.3M17.1 17.1l1.3 1.3M5.6 18.4l1.3-1.3M17.1 6.9l1.3-1.3" />
  </Svg>
);

export const IconHeart = ({ filled, ...p }: P & { filled?: boolean }) => (
  <Svg {...p}>
    <path d="M12 19.5s-7.5-4.4-7.5-10A4.2 4.2 0 0 1 12 7.1a4.2 4.2 0 0 1 7.5 2.4c0 5.6-7.5 10-7.5 10z" fill={filled ? 'currentColor' : 'none'} />
  </Svg>
);

export const IconHandRaise = ({ filled, ...p }: P & { filled?: boolean }) => (
  <Svg {...p}>
    <path d="M7 19.5 4.5 14c-.5-1 .4-2.1 1.5-1.8l2 .8V6.2a1.4 1.4 0 1 1 2.8 0v5V4.9a1.4 1.4 0 1 1 2.8 0v6.3-5a1.4 1.4 0 1 1 2.8 0v5.8-3.6a1.3 1.3 0 1 1 2.6 0V15c0 2.9-2.1 4.5-5 4.5z" fill={filled ? 'currentColor' : 'none'} />
  </Svg>
);

export const IconExpand = (p: P) => (
  <Svg {...p}>
    <path d="M12 4v5M12 9 7 14M12 9l5 5M7 14v6M17 14v6" />
  </Svg>
);

export const IconGear = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18 6l-1.6 1.6M7.6 16.4 6 18M18 18l-1.6-1.6M7.6 7.6 6 6" />
  </Svg>
);

export const IconMenu = (p: P) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);

export const IconUser = ({ filled, ...p }: P & { filled?: boolean }) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="3.6" fill={filled ? 'currentColor' : 'none'} />
    <path d="M4.8 19.5c.9-3.4 3.6-5.3 7.2-5.3s6.3 1.9 7.2 5.3" fill={filled ? 'currentColor' : 'none'} />
  </Svg>
);

/** Compose: a square with a pencil, like a "Write" action. */
export const IconCompose = (p: P) => (
  <Svg {...p}>
    <path d="M11 4.5H6A1.5 1.5 0 0 0 4.5 6v12A1.5 1.5 0 0 0 6 19.5h12a1.5 1.5 0 0 0 1.5-1.5v-5" />
    <path d="M17.6 3.9a1.6 1.6 0 0 1 2.3 2.3L12 14.1l-3 .8.8-3z" />
  </Svg>
);

export const IconDoc = ({ filled, ...p }: P & { filled?: boolean }) => (
  <Svg {...p}>
    <path d="M6.5 3.5h8l4 4v12a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1z" fill={filled ? 'currentColor' : 'none'} />
    <path d="M9 11h6M9 14.5h6M9 18h4" stroke={filled ? 'var(--bg)' : 'currentColor'} />
  </Svg>
);

/** Arrived: the brand's destination node, filled in. Used for milestones. */
export const IconMilestone = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3.4" fill="currentColor" stroke="none" />
  </Svg>
);

/** A photo: a frame with a hill and the sun. */
export const IconImage = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="14" rx="2" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="m4 17 5-4.5 3.5 3 2.5-2 5 3.5" />
  </Svg>
);

export const IconLink = (p: P) => (
  <Svg {...p}>
    <path d="M10.5 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1" />
    <path d="M13.5 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1" />
  </Svg>
);

/* ── Text tools for Write ─────────────────────────────────── */

export const IconBold = (p: P) => (
  <Svg {...p} strokeWidth={p.strokeWidth ?? 2.1}>
    <path d="M7.5 5h5.25a3.5 3.5 0 0 1 0 7H7.5z" />
    <path d="M7.5 12h6.25a3.5 3.5 0 0 1 0 7H7.5z" />
  </Svg>
);

export const IconItalic = (p: P) => (
  <Svg {...p}>
    <path d="M10.5 5h7M6.5 19h7M14.5 5l-5 14" />
  </Svg>
);

export const IconHeading = (p: P) => (
  <Svg {...p}>
    <path d="M6.5 5v14M17.5 5v14M6.5 12h11" />
  </Svg>
);

export const IconQuote = (p: P) => (
  <Svg {...p}>
    <path d="M10 7.5c-2.6.8-4 2.9-4 5.8V17h4v-4H7.3" />
    <path d="M18 7.5c-2.6.8-4 2.9-4 5.8V17h4v-4h-2.7" />
  </Svg>
);

/** A section break: a rule between two shorter ones. */
export const IconBreak = (p: P) => (
  <Svg {...p}>
    <path d="M4 12h16" />
    <path d="M8 7.5h8M8 16.5h8" opacity=".45" />
  </Svg>
);
