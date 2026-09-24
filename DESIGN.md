# PathedIn design notes

PathedIn is built in four layers:
- **Behaviour** comes from Apple's [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines): navigation, controls, presentation, motion and accessibility.
- **Look and layout** follow Medium's reading experience: its intro page, its sign-in card, its top bar and sidebar, and its feed with a right-hand column.
- **Brand** comes from the PathedIn **brand identity kit (v2)**: the three-node Path mark, Executive Navy as the one accent, Noe Display for brand moments and Charter for stories. Two things follow Medium instead: the **warm paper ground** and the **interface face** (Inter, a plain grotesk in the spirit of Medium's sohne).
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
| Intro page, "Human stories & ideas" | **"Your path & who’s walked it."** It uses the same ruled masthead, pills and footer, on Medium's cream ground (`#F7F4ED`). The illustration is the Path mark drawn big and flat: been → now → going, with routes branching off. Below the fold, a three-node row explains the idea: where you’ve been, where you are, where you want to go. |
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
| Discover | Text tabs for **For you, People, Path Guides, Communities and Destinations**. For you mixes a row of each (people worth knowing, Guides for your next move, communities along your route, futures near your Path), each with a "See all" link to its tab. People, Guides and communities are a quiet three-column grid with a hairline above each card and no boxes; on a phone the For you rows scroll sideways. Destinations keep the topic grid: a quiet image area with the route art, then title, summary and counts. |
| Network, Guides, Connections, Requests, Notifications, Saved, Search | Hairline lists with text tabs. Notifications drop the blue unread panels for a small dot. Each page has a right column (people worth knowing, your communities, or office hours). |

### Touch and feel, from a live teardown of Medium (September 2026)
A surface-by-surface teardown of medium.com (computed styles and observed interactions) listed fifteen details that make Medium feel quiet and expensive. Here is what PathedIn took, how it translates, and what it left.

**Already true of PathedIn**
- Serif for reading and sans for everything else. Stories are set at 20/32 in the reading serif, in a 680px column.
- Negative tracking that grows with size: body text barely tightened, large titles tightened more.
- Hairlines instead of cards for feed rows and action bars; boxes only for things that float.
- Pills for everything pressable.
- Save fills instantly, with no spinner and no toast.
- A name underlines as soon as you hover it, and its hover card follows after a short pause.

**Adopted**

| Medium | In PathedIn |
| --- | --- |
| One soft shadow for every popover: a 4px ambient glow plus a short drop, with no border. Popovers have 4px corners. | `--shadow-popover` and `--r-popover`, used by the account menu, "…" menus, hover cards, the Path card and the sort menu. Menus now use full-width rows that darken on hover instead of rounded highlights. The iPhone press-and-hold preview keeps its larger iOS corners. |
| Dark tooltips with a centred caret on icon-only buttons (Save, "…", member-only). | `data-tip` tooltips on every icon-only button (Save, More, Align, Share, Responses, Helpful, messages, notifications) after a 350ms hover, on pointer devices only. They replace the browser's `title` tooltips. |
| The responses drawer slides in over 0.6s on `cubic-bezier(.23,1,.32,1)` while the page fades to 60% white. | `easings.drawer` and `--ease-drawer`. Side drawers use this curve and the soft white scrim (warm charcoal in dark). The sidebar drawer uses the same curve. |
| The most-highlighted passage gets a mint wash and a count in the margin. | The passage readers *on this route* marked most gets a navy wash, with a highlighter count in the right margin, level with the line ("Top highlight · 64 on this route marked it"). Narrower screens put the count after the passage. |
| Selecting text raises a dark pill: Highlight · Respond · Share. | The same pill, with PathedIn's own action added: **Highlight · Respond · Ask {author} · Share**. *Ask* opens a Path Request about the story's stretch with the passage quoted. Your highlights are saved and drawn in a stronger wash. On touch screens the pill sits below the selection, clear of the system menu. |
| The clap: tap for one, hold for up to 50, with a floating +N. | **Helpful**, with the same physical feel but one per reader: the hand fills and a small +1 floats up and fades. PathedIn is built on trust, so counts shouldn't be inflatable. It's used on stories, answers and responses. |
| Responses drawer: composer on top, "MOST RELEVANT ▾" sort in green caps, responses quoting highlighted passages. | A 414px responses drawer (a sheet on iPhone). The composer reads "What are your thoughts?", notes that your response is *shown with your Path*, and keeps Respond disabled until you type. The sort, in navy caps, is **Closest to your Path** or **Most recent**. Each response shows the person's relation to you and their Path hint, and quoted passages sit in a highlight box. Respond from a selection and the quote comes with you. |
| Topic pills above the article title, each with a + to follow (Medium says this increased reads). | Community pills above a story's title, each with a + to join, which turns into ✓. |
| The action bar is repeated after the story. | The Helpful, Responses, Align, Save and Share bar appears under the byline and again where the reading stops. |
| On phones the header and action strip hide while you read down and return on the first flick up. | On iPhone a story swaps the tab bar for a four-action **reading dock**. The dock and the navigation bar slide away as you read down and return on the first scroll up, and near the top and the end. The progress line rides the top edge. |
| The current left-rail item gets a short black bar at the rail's edge. | Same, in ink. |
| Coachmarks with "Okay, got it." | A one-time coachmark over the first Path hint on Home: "Hover over a Path to see the whole journey. **Okay, got it.**" |
| A returning device is greeted "Welcome back." with the remembered account. | After you sign out, Sign in shows your photo, name and masked email, **Continue as Maya**, *Forget this account*, and *More sign-in options*. |

**Left out, on purpose**
- **Green (here, navy) only for live states.** The brand kit uses Executive Navy for eyebrows, relation tags and each post's "why it's here" line. Relevance is PathedIn's core idea, so the navy stays on it.
- **Two text colours.** PathedIn keeps a third, lighter grey for captions and arrows, but hierarchy still comes mainly from size and weight.
- **Skeletons, never spinners.** Everything here is local, so nothing has to load. Showing fake loading would be worse than showing none.
- **Paywall, member-only stars, the promo bar and "Get app".** None of these apply to PathedIn.

## Typography
Three faces, three tiers.

| Tier | Face | What ships | Used for |
| --- | --- | --- | --- |
| Brand | **Noe Display Medium** | Playfair Display 500 | The wordmark, page titles and other hero headings (profile names, question, decision and community titles, the intro page, sign-in, the welcome in the Path splash), and milestone moments ("you are here" and destination stations) |
| UI | **Inter**: Regular, Semibold, Bold | Inter (variable, with optical sizes) | Everything in the interface. It was chosen to match the plain, professional feel of Medium's sidebar (sohne). Regular for UI, inputs, captions and grey subtitles. Semibold for buttons, card headers and feed titles. Bold for metrics and data chips. Italic for reflections in someone's own words. The sidebar is 16px regular in grey, ink when current, as on Medium. |
| Content | **Charter**: Regular, Italic, Bold, Bold Italic | Charter where installed (Apple devices), else Source Serif 4 | Story text; story titles in Bold; quotes in Italic; pull quotes in Bold Italic; bios; the Write editor |

Noe Display is a commercial typeface. The font stack names it first, so adding licensed files is enough to switch. Inter's optical sizes tighten large text the way a display cut does.

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
- Subtitles are 16/24 regular grey.
- Section heads are 16px demibold; list headings are 20px demibold.

**Eyebrows** follow the kit's *category eyebrow*: 11px demibold, uppercase, 0.1em tracking, in Executive Navy. Examples are "THE LIVING CAREER PATH", "YOU ARE HERE" and "PATH COMMUNITY".

**Data chips** follow *metrics & data chips*: 11px bold, uppercase ("99% PATH MATCH").

## Color
The kit's **Minimal Navy Principle**: about 90% neutrals and about 10% purposeful deep navy. The neutrals sit on a **warm paper ground**, like Medium's: the page is never pure white, and only things that float are white.

| Token | Light | Role |
| --- | --- | --- |
| Paper | `#F8F6F1` | The app canvas, bars and sidebar (≈60%) |
| Cream | `#F7F4ED` | Medium's cream: the intro page and the Path splash |
| Panel | `#F1EEE7` | Panels a shade deeper than the page: the right column's card, Guide cards, route panels, *Who's here* |
| White | `#FFFFFF` | Only what floats or takes input: menus, sheets, hover cards, the search field, text boxes |
| Warm hairline | `#E4DFD4` | 1px dividers, the sidebar and right-column edges, field borders (`#D3CCBE` stronger) |
| Deep Slate Navy | `#0F172A` | Text, primary buttons, your message bubbles, the walked Path and past nodes (≈10%) |
| Mineral Slate | `#64748B` | Secondary text; `#94A3B8` for the quietest labels |
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
- **Cards** are used sparingly: panels a shade deeper than the paper, with 8px corners. Everything else is separated by hairlines.
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
- the Path hint and its Path card
- the Path strip (My Path, Peek and shared step cards in messages)
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

### Paths on posts: one line, the rest on hover
A full Path on every post and person row was too much to read. In feeds, lists and cards a Path is now a **Path hint**: the brand mark and one quiet line, where someone is now and where they're heading ("CRO → Pharma R&D"), with a dotted underline to show there's more (`components/path/PathHint.tsx`).
- **Hover** it on a desktop, or **tap** it or press **Enter**, and the **Path card** opens beside it. The card draws the whole Path top to bottom with the brand nodes, each step with its organisation and years, and marks the steps you share ("You too").
- When a post is about one stretch (a question, a request, a Guide's move), that stretch is lit in navy and the rest steps back.
- The card ends with **Align Paths** and **View profile**. It closes when you move away, click outside, scroll or press Escape.
- The full horizontal strip stays where the Path *is* the content: My Path, Peek, and a step shared in a message.

### Align icon
Align Paths uses its own glyph: two walked Paths (solid nodes) curving together into one shared "now" node, the brand's present node. It reads as *where your Paths meet*.

### Seven kinds of post, each recognisable at a glance
In a mixed feed, questions, community posts, Guides and stories all looked alike. Every feed post now opens with a **kind label**: the same icon as its section in the sidebar, the kind in small capitals, and a short note. Each kind also has a shape of its own (`components/FeedItems.tsx`):

| Kind | Label note | What makes it look different |
| --- | --- | --- |
| Story | the stretch it covers ("CRO → Pharma R&D") | Serif title and the Path art of that stretch. |
| Question | "4 answers" | The best answer so far, quoted beside a rule, with who it's from and why they're credible ("took the exact route you're asking about"). |
| Community | the community's name | The latest reply as a speech bubble, beside the faces in the conversation. |
| Path Guide | "Office Hours this week" | A person, not writing, so it sits on its own quiet panel: portrait, the move they made drawn with brand nodes, what they help with, this week's slot and **Ask**. |
| Decision Point | "Deciding now at MSc Chem" | The fork art and a **Weigh in** row with the people who already have. On a phone the fork is too small to read, so the row carries it. |
| Route | "To Pharmaceutical R&D" | The route drawn as a line on a panel, with its numbers and **Add to my Path**. |
| Milestone | the move ("CRO → Pharma R&D") | Their own words in serif italic, their Path hint and **Congratulate**. |

**For you, one kind at a time.** A row of pills under For you (All · Stories · Questions · Communities · Path Guides · Decisions · Routes) narrows the feed to one kind. Each filtered feed is ranked by how close each post is to your Path, still says why each post is there, and opens with a line explaining the list and a link to the full section. The choice lives in the URL (`/?show=question`), so Back returns to it. When the pills run past the column, arrows fade in at the edges, as on Medium's topic bar.

### Spacing rules
- **Inside a post** the rhythm is: kind label, 12px, byline, 12px, title, 8px, subtitle, 16px, the post's own block, 16px, the meta row.
- **Thumbnails** sit to the right of the title and are top-aligned with it, however tall the text column grows. A post without a thumbnail uses the whole row, so every row ends on the same edge.
- **Boxes** (Guide panels, the weigh-in row, route panels, answer quotes) always pad their contents; nothing inside touches a drawn edge.
- **Buttons in a narrow column** use an even grid rather than wrapping. On a profile, **Send a Path Request** takes the full width, with Message, Follow, Align Paths and Save in a two-by-two grid below.
- **Sideways-scrolling rows** (the community's *Who's here*, *Your Path this week*, the Path Lens, the For you filters) fade out at an edge that has more to show, instead of cutting text off.
- **A page's subtitle** runs the full width under the title, so a button beside the title never squeezes it.
- **In a narrow column** a Decision's fork is too small to read, so it's hidden and the text carries the decision.
- **Class names are unique per component.** A generic name in one stylesheet can silently restyle another component; `.weigh` and `.guide-card` did, and are now `.fweigh` and `.fguide`.
- An automated check loads every page at phone, tablet and desktop widths. It flags anything that spills out of its container, and text sitting against the edge of a bordered or shaded box.

### Write, after Medium's editor
**Write** (top bar, or the pencil on iPhone Home) opens a page of its own, with no sidebar or tab bar (`screens/Write.tsx`).
- **The page:** a quiet header ("Draft · Saved", a navy **Publish** pill that stays washed out until there's a title and some text, "…", your photo), then a serif **Title** and **Tell your story…**. Drafts save as you type.
- **⊕ in the margin:** start a new line and it appears. Click it and it turns into ×, and three circles slide out 30ms apart:
  - **Add a photo.** Photos are resized in the browser and get an optional caption. Click one to remove it.
  - **Add your Path.** Your Path is embedded with the brand's nodes.
  - **New section:** a "···" break.
- **iPhone:** the same three actions sit in a dock at the bottom.
- **Select text** and a dark toolbar appears: **B**, *i*, link | big heading, small heading, quote. Buttons that are on are highlighted, and a link opens an inline field for the address.
- **First visit:** a tips drawer walks through the three ideas with ‹ › and ×, as Medium's does.
- **Publish** opens a sheet:
  - On the left, a preview with the first photo, an editable title and a subtitle.
  - On the right, **what it is** (Story, Question or Community post), **which stretch of your Path it's about** (so people on that stretch see it first), and a community to share it in.
- **After publishing,** the post opens as a story and sits at the top of For you, and in its kind's filter, labelled as yours. Posts and drafts are kept in their own store, so photos never crowd out the rest of the saved state. Pasting always comes in as plain text, and saved HTML is rebuilt from an allow-list.

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
