# PathedIn design notes

PathedIn follows Apple's [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines) for structure, typography, color, controls and motion. It then adds one strong, product-specific visual language on top: **the Path as a transit line**.

## Following the Human Interface Guidelines

### Navigation
- **iPhone:** a bottom **tab bar** with five top-level sections (Home, Discover, My Path, Network, Communities). It uses the translucent chrome material, a hairline top separator, 10pt labels and a tint for the selected item. Tapping the current tab scrolls to top. Messages and notifications live in Home's navigation bar, the way many iOS apps place secondary destinations.
- **Navigation bars** use **large titles** that collapse into a centred inline title as you scroll. The back button carries the previous screen's title and falls back to "Back" when space is tight, as `UINavigationBar` does. Detail screens use the inline style.
- **Pushes** slide in from the trailing edge and pops return from the leading edge, with scroll position restored like a navigation stack. A conversation takes the full screen and hides the tab bar, as in Messages.
- **iPad / Mac widths:** a slim top bar replaces the tab bar. Wide screens use split views and inspectors (My Path's inspector, Messages' list + thread) rather than stretched phone layouts.

### Typography
- The type ramp is the iOS **Dynamic Type "Large"** scale: Large Title 34/41, Title 1 28/34, Title 2 22/28, Title 3 20/25, Headline 17/22 semibold, Body 17, Callout 16, Subhead 15, Footnote 13, Caption 12/11.
- Stacks resolve to **SF Pro** (`-apple-system`) and **New York** (`ui-serif`) on Apple platforms. Elsewhere, self-hosted Inter and Newsreader stand in, with tracking tuned to approximate SF's optical sizes.
- New York is reserved for editorial moments: stories, personal notes on a Path, pull quotes and reflections. Everything else is SF.

### Color
- Colors are semantic: `label`, `secondaryLabel`, `tertiaryLabel`, fills, separators, grouped backgrounds. Each is redefined for **dark mode** and follows the system unless the viewer overrides it.
- There is **one app tint**, a warm trail-marker vermilion, used for "you", the present, your future, and interactive elements. Everyone else's Path is drawn in ink (the label color). Status colors (green, red) keep their system meanings.
- Separators are 0.5pt hairlines. Hierarchy comes from type, spacing and alignment, not boxes.

### Controls and presentation
- **Buttons** use the HIG styles: filled, tinted, gray, plain, plus an outline variant for secondary toggles. Sizes are small, medium and large, and every hit area is at least 44pt.
- **Segmented controls** have the system look: a sliding thumb on a fill track, with separators hidden next to the selection.
- **Sheets** on iPhone have a grabber and **medium/large detents**; you can drag between them or swipe down to dismiss. On larger screens they present as centred sheets.
- **Context menu previews:** press and hold a person to get a lifted preview with an action menu below it and the background dimmed. On desktop this becomes a hover card, and secondary-click opens the same preview.
- **Inset grouped lists** (icon tile, title, value, chevron) are used for settings-like navigation.
- Search uses the system **search field**, and ⌘K opens it anywhere on desktop. Badges are system red, used only for counts that need attention.

### Motion, haptics and accessibility
- Springs are defined the way SwiftUI defines them, as **response and damping fraction**, then converted to stiffness and damping. Motion is interruptible and communicates change: things settle into place, lines draw toward where they lead, and people arrive at stations.
- **Reduced Motion** is respected through `MotionConfig reducedMotion="user"` and a CSS fallback.
- **Haptics** fire on selection changes, long-press and send, where the platform supports it.
- Controls are real buttons and links with labels. Focus is visible. Decorative graphics are hidden from assistive tech, and each Path has a text equivalent.

## PathedIn's own language

### The transit metaphor
A career is drawn like a transit line: stations are steps, and 45° bends and rounded joins give the lines their shape.
- **Walked track:** solid ink. **Your future:** dotted tint. **Other possibilities:** dotted gray.
- **Present:** a filled tint station that slowly breathes.
- **Undecided:** a dashed interchange with a "?" that opens into parallel routes.
- **Destination:** a terminus (a target, or a capsule when routes converge).
- **Shared steps:** where two Paths share a station, they run as one shared track.

The same vocabulary appears at every scale: the one-line **Path strip** on every person, the **Transit Map**, the **Confluence** of routes into a destination, **Align**, and the **Path Lens**.

### Relevance is always explained
Every person is shown with *why* they matter: "Path Twin", "One step ahead", "Reached your destination via a CRO", "Hires for the role you want". Answers lead with credibility ("Took the exact route you're asking about"). Community posts are stamped with where the author is on the route. Requests arrive attached to the segment of the Path they're about.

### What we deliberately avoided
No KPI cards, charts, "profile strength" meters or endorsements. No giant sidebars or cards nested in cards. No gradients, glows, sparkles or glassmorphism beyond the system bar material. Guides are never paid, ranked or rated.
