# PathedIn design notes

PathedIn is built in four layers:
- **Behaviour** comes from Apple's [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines): navigation, controls, presentation, motion and accessibility.
- **Look and layout** follow Medium's reading experience: its intro page, its sign-in card, its top bar and sidebar, and its feed with a right-hand column.
- **Brand** — colour and type — comes from the PathedIn **brand identity kit (v2)**: the three-node Path mark, slate neutrals with Executive Navy as the one accent, and Noe Display / Marat Sans / Charter.
- **PathedIn's own language** sits on top: **the Path drawn as a transit line**.

## Medium as the reference

### What Medium does
This analysis is based on the signed-in screenshot supplied with the brief and on Medium's publicly known design. Our cloud environment's network policy blocks medium.com, so the live site couldn't be inspected.

- **The intro page (signed out)**
  - The page sits on a warm cream ground (`#F7F4ED`).
  - A masthead holds the wordmark on the left, with small text links, "Sign in" and a black **Get started** pill on the right. A single 1px black rule sits beneath it.
  - The hero is one enormous line in a high-contrast display serif, then one sentence in the sans, then one black pill button. A flat, colourful illustration bleeds off the right edge.
  - Small grey footer links sit above another black rule.
  - The whole page explains the product in about ten words.
- **Sign-in:** a centred white card over a translucent white veil.
  - The serif title reads "Join Medium." and becomes "Welcome back." for returning members.
  - Below it are stacked outline pill buttons, one per sign-in method.
  - A single "Already have an account? Sign in" line switches between the two modes.
  - Grey fine print sits at the bottom.
- **The signed-in app:**
  - **Top bar:** slim, white, with a whisper-light hairline. It holds a menu button, the wordmark and a grey pill search on the left, and "Write", the bell and your photo on the right.
  - **Left sidebar:** outline icons with grey labels. The active item turns near-black with a filled icon. Hairline dividers separate groups, and a **Following** section ends with "Find writers and publications to follow. See suggestions".
  - **Reading column:** about 680px wide, with underlined text tabs ("For you", "Featured").
  - **Each story preview:**
    - a 20px avatar byline ("In publication by author · date")
    - a bold, tightly tracked title
    - a two-line grey subtitle
    - a quiet row of stats, with save and "…" on the right
    - a small, square-cornered 160×107 thumbnail
  - **Right column:** separated by a full-height hairline. It holds a soft card, *Staff Picks*, grey topic pills, *Who to follow* and footer links.
- **Type:**
  - one tight neo-grotesk (Söhne) does all the interface work, through size and weight alone
  - a display serif (GT Super) is used only for marketing moments
  - a book serif is used for reading
- **Colour:**
  - near-black text `#242424`
  - grey secondary text `#6B6B6B`
  - `#F2F2F2` hairlines and `#F9F9F9` fills
  - black pills
  - one brand accent
- **Why it feels premium:** restraint.
  - lots of white space
  - hairlines instead of boxes
  - no shadows or gradients in the reading surface
  - black pills as the only solid shapes
  - nearly every word in one typeface

### How PathedIn maps it
| Medium | PathedIn |
| --- | --- |
| Intro page, "Human stories & ideas" | **"Your path & who’s walked it."** It uses the same ruled masthead, pills and footer, on the brand's Warm Porcelain ground. The illustration is the Path mark drawn big and flat: been → now → going, with routes branching off. Below the fold, a three-node row explains the idea: where you’ve been, where you are, where you want to go. |
| "Join Medium." card | **"Join PathedIn." / "Welcome back."** Outline pills offer Google or email, with the same switch line and fine print. It's a prototype, so no passwords are asked for and nothing is sent anywhere. |
| The typing moment on sign-in | **The Path draws itself.** Your first step pops in and its name types out with a caret, then the line draws to "You are here". The dashed future runs on to your destination, and the serif writes "Welcome, Maya." It takes about three seconds and can be skipped with a tap. With Reduce Motion it shows the finished Path briefly instead. |
| Top bar | A menu button (docks or undocks the sidebar), the wordmark, a pill **Search** (⌘K), then **Ask** (opens the question composer), Messages, Notifications and your photo. |
| Left sidebar | **Primary:** Home, My Path, Discover, Network, Communities. **Yours:** Saved, Profile, Path Requests (with a count). **Explore:** Path Guides, Stories, Questions, Decision Points. **Following:** your communities, then "Find people and communities on your Path. See suggestions". |
| For you / Featured | **For you / Following.** Following shows new conversations and questions in communities you've joined. |
| Story preview | **Post rows**, one component for every kind of content (`components/Post.tsx`). The thumbnail is PathedIn's own art: the story's Path segment, a decision's fork, or a Guide's portrait. The meta row always starts with **why it's here** ("About your next step", "Jonah is facing your exact decision"), then its stats, save and a "…" menu (Align Paths, Send a Path Request, Show fewer like this). |
| Right column | **Coming up** (your booked call, with a calendar tile, and the Path Requests waiting on you), **Your Path this week** (your Path drawn down the column, with who's at each step), **People worth knowing** (Medium's *Who to follow*), **Path Office Hours**, and **Your communities** as topic pills, then footer links. |

On iPhone, PathedIn keeps the HIG tab bar and large titles, as Medium's own apps do. Home opens with the **Up next** cards, the horizontal *Your Path this week*, a *People worth knowing* carousel, then the same For you / Following tabs and post rows.

### Every page, the same way
All pages share Medium's page shape.

**The page itself**
- A bold page title, and underlined text tabs where a page has views.
- Hairline-separated rows in a reading column about 728px wide.
- A right-hand column behind a full-height hairline.
- Any page can pass `rail` to `Page`. On iPhone that column follows the page content.
- The column is built from the shared pieces in `components/Rail.tsx`:
  - section heads
  - *Who to follow*-style people rows
  - *Staff Picks*-style post lists
  - topic pills
  - footer links

**Lists**
- Stories, questions, decisions and community conversations all render as the same **post row** (`Post`), wherever they appear.
- Each row carries a byline, bold title, grey summary, "why it's here" line, stats, save, "…" menu and Path-art thumbnail.
- Rows adapt to their width with a container query, so they also fit side columns.

| Page | Medium pattern |
| --- | --- |
| Stories | A topic page: text tabs, a featured story, then post rows. Right column: *Most read on your route* and *Writers ahead of you*. |
| A story | An article: one centred column, byline, an action bar between hairlines (reads, Align, save, share), the Path art as the lead image with a caption, and the body in the reading serif. *The Path behind this story*, the author box and *More from this stretch* follow. |
| Questions | Post rows under tabs. The *Ask the people ahead of you* composer sits at the top of the right column, like Medium's "start writing" card. |
| Question / Decision | The reading column holds the question or fork. The right column holds the people who made the move, the ones to ask, and similar forks. |
| Decision Points | Your fork, then the ones near your Path, as post rows with fork thumbnails. |
| Communities / a community | A publication: title, description, members and Join, then tabs and post rows. The right column holds the community's Guides and journeys that cross this one. |
| Profile | Medium's profile. The reading column holds the name as a large title, then Path / Stories / Answers / Decisions tabs. The right column holds the person (photo, bio, buttons), what they're doing now, the Path Guide card, *Where your Paths meet* and communities. On iPhone the person card leads. |
| Discover | A topic grid: a quiet image area with the route art, then title, summary and counts, with no card boxes. Other ways to explore appear as topic pills. |
| Network, Guides, Connections, Requests, Notifications, Saved, Search | Hairline lists with text tabs. Notifications drop the blue unread panels for a small dot. Each page has a right column (people worth knowing, your communities, or office hours). |

## Typography
Type follows the brand identity kit (v2): three faces, three tiers.

| Tier | Brand face | What ships | Used for |
| --- | --- | --- | --- |
| Brand | **Noe Display Medium** | Playfair Display 500 | The wordmark, page titles and other hero headings (profile names, question, decision and community titles, the intro page, sign-in, the welcome in the Path splash), and milestone moments ("you are here" and destination stations) |
| UI | **Marat Sans**: Light, Regular, Demibold, Bold | Plus Jakarta Sans | Light for subtitles, captions and secondary labels. Regular for UI and inputs. Demibold for buttons, card headers and feed titles. Bold for metrics and data chips. Light Italic for reflections in someone's own words. |
| Content | **Charter**: Regular, Italic, Bold, Bold Italic | Charter where installed (Apple devices), else Source Serif 4 | Story text; story titles in Bold; quotes in Italic; pull quotes in Bold Italic; bios |

Noe Display and Marat Sans are commercial typefaces. The font stacks name them first, so adding licensed files is enough to switch.

The ramp keeps the HIG's roles:

| Role | Size / line height |
| --- | --- |
| Page title | 44/50 Noe Display on desktop, 34/40 on iPhone |
| Title 1 | 28/34 |
| Title 2 | 22/28 |
| Title 3 | 19/25 |
| Headline | 16/22 demibold |
| Body | 16/24 |
| Callout | 15/22 |
| Subhead | 14/20 |
| Footnote | 13/18 |
| Caption | 12/16 and 11/13 |

**Feed and section headings**
- Feed titles are 21/27 demibold; stories use Charter Bold.
- Subtitles are 16/24 light grey.
- Section heads are 16px demibold; list headings are 20px demibold.

**Eyebrows** follow the kit's *category eyebrow*: 11px demibold, uppercase, 0.1em tracking, in Executive Navy. Examples are "THE LIVING CAREER PATH", "YOU ARE HERE" and "PATH COMMUNITY".

**Data chips** follow *metrics & data chips*: 11px bold, uppercase ("99% PATH MATCH").

## Color
The kit's **Minimal Navy Principle**: about 90% gallery neutrals, and about 10% purposeful deep navy.

| Token | Light | Role |
| --- | --- | --- |
| Gallery White | `#FFFFFF` | The app canvas (≈60%) |
| Warm Porcelain | `#F8FAFC` | Soft cards, the right column's card, the intro page and the Path splash (≈25%) |
| Deep Slate Navy | `#0F172A` | Text, primary buttons, your message bubbles, the walked Path and past nodes (≈10%) |
| Mineral Slate | `#64748B` | Secondary text; `#94A3B8` for the quietest labels |
| Hairline | `#E2E8F0` | 1px dividers, the sidebar and right-column edges, field borders |
| Executive Navy | `#1E3A8A` | The one accent: the dashed future, the "you" dot, open destination nodes, links, eyebrows, badges, the secondary button |
| Navy washes | `#EFF6FF` / `#DBEAFE` / `#BFDBFE` | Chip and selection backgrounds, chip borders, routes you're considering |

**Light is the default**, as Medium is on the web.
- The app doesn't follow the device's dark setting, and it holds its light background even when embedded somewhere dark.
- The saved appearance is applied before first paint, so there's no dark flash.

**Dark is opt-in**, set from the account menu or Appearance on your profile.
- It's a warm charcoal, never pure black or navy: canvas `#1F1E1C`, surfaces `#262522` / `#292825`, paper-white text `#EDE9E2`.
- Executive Navy is too deep to read on charcoal, so the accent lifts to a soft periwinkle from the same family (`#8FA7EE`).

## Components
- **Buttons** keep Medium's pill shape in the kit's colours, with Demibold labels.
  - **Filled** is Deep Slate Navy.
  - **Secondary** (tinted) is porcelain with an Executive Navy line and label, as in the kit's "Compare Waypoint".
  - **Outline** is a 1px ink line.
  - **Gray** is a soft slate fill.
- **Text tabs** are grey labels; the active tab is ink with a 1px underline.
- **Cards** are used sparingly: porcelain panels with 8px corners. Everything else is separated by hairlines.
- **Data chips**:
  - **Navy** chips carry facts ("2 steps ahead").
  - **Wash** chips carry the match ("99% path match") on `#EFF6FF` with a `#BFDBFE` border.
- **Segmented controls** are pills: a slate fill with a white sliding thumb.
- **Text fields and the search pill** are white with a hairline. On focus they gain a navy line and a soft wash ring.

## Brand identity kit

### The mark
The logo is the Path itself, on a 45° axis:
- **Node 1, where you've been:** a solid dot.
- **Node 2, where you are now:** a Deep Slate Navy ring with an Executive Navy dot at its centre.
- **Node 3, where you want to go:** an open Executive Navy circle.

The past is a solid Deep Slate Navy line. The future is a dashed Executive Navy line. The wordmark is set in Noe Display Medium. The mark is also the favicon and the My Path icon.

### Voice
The brand tenet runs through the product: *"Don't just ask who you know. Ask who you should know to get where you want to go."* It is the Network page's subtitle. My Path carries the kit's name for it, **The Living Career Path**.

## Following the Human Interface Guidelines

### Navigation
- **iPhone:** a bottom **tab bar** with five sections (Home, Discover, My Path, Network, Communities).
  - Tapping the current tab scrolls to the top.
  - Messages and notifications live in Home's navigation bar.
- **Navigation bars** on iPhone use **large titles** that collapse into a centred inline title as you scroll.
  - Back buttons carry the previous title.
  - Pushes slide in from the trailing edge.
- **iPad and Mac widths:** the Medium-style top bar and sidebar.
  - The sidebar docks beside the content when the window is wide enough (1320px and up). The menu button hides or shows it, and the choice is remembered.
  - On narrower windows the sidebar slides over the content and closes when you choose a destination or press Escape.
  - Wide screens use split views and side panels (My Path's side panel, Messages' list and thread) rather than stretched phone layouts.

### Controls and presentation
- **Sheets** on iPhone have a grabber and **medium/large detents**. On larger screens they appear centred.
- **Context menu previews:** press and hold a person to preview their Path.
  - On desktop this is a hover card, and secondary-click opens the same preview.
- **Inset grouped lists** are used for settings-like rows.
  - Your own profile's list includes Appearance and Sign out.
- **Minimum hit area:** every control can be tapped across at least 44pt.

### Motion, haptics and accessibility
- Springs are defined as SwiftUI defines them, by **response and damping fraction**.
- **Reduce Motion** is respected everywhere, including the intro illustration and the Path splash.
- **Haptics** fire on selection changes, long-press and send, where the platform supports it.
- **Accessibility:**
  - Controls are real buttons and links with labels, and focus is visible.
  - Decorative graphics are hidden from assistive tech, and each Path has a text equivalent.
  - The splash announces the Path it draws.
- **Contrast:** Executive Navy reads clearly on white for text, icons and lines alike.

## PathedIn's own language

### The transit metaphor
A career is drawn like a transit line. Stations are steps, and 45° bends and rounded joins give the lines their shape. The brand's three nodes are the station vocabulary everywhere:
- **Walked track and past stations:** solid ink line, solid ink nodes.
- **Present:** the ink ring with a navy dot, with a slow navy pulse. On My Path your photo sits on it, and you can drag it along your future.
- **Future:** dashed Executive Navy line. **Other possibilities:** fainter dashed navy wash.
- **Undecided:** a dashed navy interchange with a "?" that opens into parallel routes.
- **Destination:** an open navy circle, or an open capsule when routes converge.
- **Shared steps:** where two Paths share a station, they run together on a navy wash. In Align, your Path is ink and theirs is grey.
- **Decisions:** the road taken is solid, and roads still open are dashed navy.

The same vocabulary appears at every scale:
- the Path strip
- the Transit Map
- the Confluence of routes
- Align
- the Path Lens
- community routes
- decision forks
- request segments
- story art
- the right column's *Your Path this week*
- the intro illustration
- the sign-in splash

### Relevance is always explained
Every person and every post says *why* it is in front of you. People carry a relation ("Path Twin", "One step ahead", "Reached your destination"), and posts carry a "why it's here" line. The Path match chip puts a number to it.

Relevance shows up in the content too:
- Answers lead with credibility.
- Community posts are stamped with where the author is on the route.
- Requests arrive attached to the segment of the Path they're about.

### What we deliberately avoided
- No KPI cards, charts, "profile strength" meters or endorsements.
- No cards nested in cards.
- No gradients, glows or glassmorphism in the reading surface.
- Guides are never paid, ranked or rated.
