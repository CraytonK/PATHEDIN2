# PathedIn design notes

PathedIn takes its **structure and behaviour** from Apple's [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines): navigation, controls, presentation, motion and accessibility. Its **look** comes from the PathedIn **brand identity kit**: typography, palette, the three-node Path symbol and its components. On top of both sits one product-specific visual language: **the Path as a transit line**.

## Brand identity kit

### The mark
The logo is the Path itself, on a 45° axis:
- **Node 1, where you've been:** a solid Deep Slate Navy dot.
- **Node 2, where you are now:** a navy ring with a Celestial Blue dot at its centre.
- **Node 3, where you want to go:** an open Celestial Blue circle.

The past is a solid navy line. The future is a dashed celestial line. The wordmark "PathedIn" is set in the display serif. The same symbol is the favicon and the My Path tab icon.

### Typography
| Role | Brand face | What ships | Used for |
| --- | --- | --- | --- |
| Display | Noe Display, Medium 500 | Playfair Display | Large titles, profile names, story, decision and question titles, community headers, "you are here" and destination stations |
| Interface | Marat Sans: Light 300, Regular 400, Demibold 600, Bold 700 | Plus Jakarta Sans | All UI. Light for subtitles and secondary text, Demibold for headers and buttons, Bold for data chips |
| Editorial | Charter: Regular, Bold, Bold Italic | Charter where installed (Apple devices), else Source Serif 4 | Story bodies and card titles (Bold), pull quotes (Bold Italic), bios and reflections |

Noe Display and Marat Sans are commercial typefaces. The stacks name them first, so they take over automatically once licensed files are added. Until then the kit's own suggested alternatives are self-hosted as WOFF2 in `src/assets/fonts`. Display text uses −0.025em tracking. **Eyebrows** (small uppercase kickers) are 11px Demibold with 0.1em tracking, in the deep sky blue.

The size ramp keeps the HIG's roles, tuned to the brand's 16px body: Large Title 34/40, Title 1 28/34, Title 2 22/28, Title 3 19/25, Headline 16/22, Body 16/24, Callout 15/22, Subhead 14/20, Footnote 13/18, Caption 12/16 and 11/13.

### Color: the Minimal Blue Principle
About 90% of any screen is neutral, and Celestial Blue is kept for about 10%: the future, "you", links and focus.

| Token | Light | Role |
| --- | --- | --- |
| Gallery White | `#FFFFFF` | Page background |
| Warm Porcelain | `#F8FAFC` | Panels and grouped backgrounds |
| Deep Slate Navy | `#0F172A` | Text, primary buttons, the walked path, past nodes |
| Mineral Slate | `#64748B` | Secondary text |
| Hairline | `#E2E8F0` | 1px separators and panel borders |
| Celestial Blue | `#38BDF8` | The future: dashed lines, open nodes, the "you" dot |
| Deep Sky | `#0284C7` / `#0369A1` | Icons, links, eyebrows and badges (readable on white) |
| Sky wash | `#F0F9FF` / `#BAE6FD` | Secondary buttons, chips, possible routes |

Dark mode is derived from the same palette. It follows the system unless the viewer overrides it:
- **Surfaces:** a navy-black canvas `#0B1120`, with `#0F172A` and `#111A2E` for grouped and elevated surfaces.
- **Text:** porcelain `#F8FAFC`, with slate for secondary text.
- **Accents:** the same celestial blue, with a lighter sky `#7DD3FC` for text.
- **Primary buttons** flip to porcelain with navy text.

### Components
- **Buttons:**
  - **Primary** is solid navy, 8px corners.
  - **Secondary** is a celestial wash with a sky hairline and deep-sky text.
  - **Gray** and **outline** remain for quieter actions.
- **Data chips:** small uppercase Bold labels.
  - **Navy** chips carry facts ("2 steps ahead").
  - **Sky** chips carry the match ("89% path match").
  - They appear on profiles, person tiles, Peek and Align.
- **Path match:** how closely someone's steps and destination follow yours, from the longest sequence of steps you share (`pathMatch` in `lib/relations.ts`).
- **Cards and panels:** porcelain, a 1px hairline border and 16px corners, with at most a whisper of shadow. Full-bleed panels on phones keep only their top and bottom hairlines.
- **Numbered tags:** navy squares with white numerals, used for the steps in Path Guides.
- **Text fields:** white with a 1px hairline. On focus the hairline turns celestial and gains a soft wash ring.
- **Message bubbles:** yours are navy, theirs are a neutral fill. The send button is navy.

### Voice
The brand tenet runs through the product: *"Don't just ask who you know. Ask who you should know to get where you want to go."* It is the Network page's subtitle. My Path carries the kit's name for it, **The Living Career Path**.

## Following the Human Interface Guidelines

### Navigation
- **iPhone:** a bottom **tab bar** with five top-level sections (Home, Discover, My Path, Network, Communities).
  - It uses the translucent chrome material, a hairline top separator, and navy labels for the selected item.
  - Tapping the current tab scrolls to top.
  - Messages and notifications live in Home's navigation bar, the way many iOS apps place secondary destinations.
- **Navigation bars** use **large titles** that collapse into a centred inline title as you scroll.
  - The back button carries the previous screen's title and falls back to "Back" when space is tight, as `UINavigationBar` does.
  - Detail screens use the inline style.
- **Pushes** slide in from the trailing edge, and pops return from the leading edge.
  - Scroll position is restored, like a navigation stack.
  - A conversation takes the full screen and hides the tab bar, as in Messages.
- **iPad / Mac widths:** a slim top bar replaces the tab bar. Wide screens use split views and inspectors (My Path's inspector, Messages' list + thread) rather than stretched phone layouts.

### Structure of type and color
- Type keeps the HIG's semantic roles (Large Title through Caption) so hierarchy reads the same way, with the brand faces and sizes above.
- Colors are semantic tokens (`label`, `label-2`, fills, separators, grouped backgrounds, `tint`, `primary`), each redefined for dark mode. Components use only tokens, never raw values.
- Hierarchy comes from type, spacing and alignment. Boxes are used only where the brand calls for a card.

### Controls and presentation
- **Buttons** follow the HIG's filled / tinted / gray / plain roles, drawn in brand colors: filled is navy and tinted is the celestial wash. They come in small, medium and large, and every hit area is at least 44pt.
- **Segmented controls** keep the system behaviour: a sliding thumb on a fill track.
- **Sheets** on iPhone have a grabber and **medium/large detents**. You can drag between them or swipe down to dismiss. On larger screens they appear as centred sheets.
- **Context menu previews:** press and hold a person to get a lifted preview with an action menu below it and the background dimmed. On desktop this becomes a hover card, and secondary-click opens the same preview.
- **Inset grouped lists** (icon tile, title, value, chevron) are used for settings-like navigation, drawn as brand cards.
- **Search:** the field is brand-styled, and ⌘K opens it anywhere on desktop. Badges are deep sky, used only for counts that need attention.

### Motion, haptics and accessibility
- Springs are defined the way SwiftUI defines them, as **response and damping fraction**, then converted to stiffness and damping.
  - Motion can be interrupted, and it shows what changed.
  - Things settle into place, lines draw toward where they lead, and people arrive at stations.
- **Reduced Motion** is respected through `MotionConfig reducedMotion="user"` and a CSS fallback.
- **Haptics** fire on selection changes, long-press and send, where the platform supports it.
- **Accessibility:**
  - Controls are real buttons and links with labels, and focus is visible.
  - Decorative graphics are hidden from assistive tech, and each Path has a text equivalent.
  - Celestial Blue is used for lines and shapes. Text and icons use the deeper sky tones, which read clearly on white.

## PathedIn's own language

### The transit metaphor
A career is drawn like a transit line. Stations are steps, and 45° bends and rounded joins give the lines their shape. The brand's three nodes are the station vocabulary everywhere:
- **Walked track and past stations:** solid navy line, solid navy nodes.
- **Present:** the navy ring with a celestial dot, with a slow celestial pulse. On My Path your photo sits on it, ringed in celestial, and you can drag it along your future.
- **Future:** dashed celestial line. **Other possibilities:** fainter dashed sky.
- **Undecided:** a dashed celestial interchange with a "?" that opens into parallel routes.
- **Destination:** an open celestial circle, or an open capsule when routes converge.
- **Shared steps:** where two Paths share a station, they run together on a celestial wash. In Align, your Path is navy and theirs is mineral slate.
- **Decisions:** the road taken is solid navy, and roads still open are dashed celestial.

The same vocabulary appears at every scale:
- the one-line **Path strip** on every person
- the **Transit Map**
- the **Confluence** of routes into a destination
- **Align**
- the **Path Lens**
- the community route
- Decision forks
- Path Request segments
- story covers

### Relevance is always explained
Every person is shown with *why* they matter, such as "Path Twin", "One step ahead", "Reached your destination via a CRO" or "Hires for the role you want". The Path match chip puts a number to it.

The same holds elsewhere:
- Answers lead with credibility ("Took the exact route you're asking about").
- Community posts are stamped with where the author is on the route.
- Requests arrive attached to the segment of the Path they're about.

### What we deliberately avoided
- No KPI cards, charts, "profile strength" meters or endorsements.
- No giant sidebars or cards nested in cards.
- No gradients, glows, sparkles or glassmorphism beyond the system bar material.
- Guides are never paid, ranked or rated.
