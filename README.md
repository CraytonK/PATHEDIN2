# PathedIn

**Where you've been, where you are, where you want to go — and who you should know to get there.**

PathedIn is a professional network built around one object: the **Path**. A Path is a journey (Past → Present → Possible futures), drawn as a transit line. Stations are steps, drawn with the brand's three nodes. The walked track is solid Deep Slate Navy, and the future is a dashed Executive Navy line. An undecided next step is an interchange that opens into the real routes people took. Everything in the product hangs off the Path: the people you should know, the communities you belong to, and the questions, stories and decisions worth your time.

This repository is a working front-end prototype. It's a React + TypeScript single-page app, built mobile-first.
- **Behaviour** follows Apple's [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines).
- **Look:** Soft Cream paper with Midnight Navy ink. Where the product shows itself (the intro, a Path cover, your week), it opens a Midnight Navy panel lit by route silk, with solid cards on it; the silk never runs behind words. Midnight is the dark appearance. See [DESIGN.md](DESIGN.md).
- **Type:** Space Grotesk for the interface, headings and wordmark (large, light headings), and Charter for stories.
- **Layout:** an intro page, then a dashboard: a white top bar with the sections as icons in the middle (the rest of the app in a drawer), and every screen's content on white cards. Home is three columns: your profile card, People worth knowing in rings above the For you feed, and your week as a calendar and schedule beside Your Path, Office Hours and your communities.
- **Signature pieces:** the ⌘K palette ("Go anywhere on your Path"), Path Guide office hours you can book (with a real calendar file), and a route band that draws each person's Path on their card.

It ships with a believable, interconnected sample network centred on Maya Okafor, an MSc chemistry student heading for pharmaceutical R&D.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check + production build into dist/
npm run build:static # same, with relative paths + hash routing (works from any static host or sub-folder)
npm run preview      # serve the production build
```

Requires Node 20+.

## What to try

| Interaction | Where |
| --- | --- |
| **The intro page.** One line and one sentence explain PathedIn, beside the product itself: your Path, a Path Twin and a Guide's office hours, assembling in order. *Get started* or *Sign in* opens the "Join PathedIn." card. | First visit, or after signing out |
| **The intro tour.** Scroll down the intro and you walk a Path: a line fills down the page and each feature is a station on it. Home tilts up into view; your Path draws itself as you scroll, then branches into the real routes to your destination; chips filter the people on your Path; pick someone to align Paths with; tabs play through each kind of post; and a Guide's prices sit beside sliders that work out what a Guide keeps. It ends at the destination: *Start your path*. | Scroll the intro page |
| **Your Path draws itself.** After you sign in, your steps pop in one by one, each name types out, the future dashes on to your destination, and "Welcome, Maya." is written. Tap to skip. | Sign in |
| **Home.** The For you feed, where every post says why it's there, next to a right-hand column. The column shows Coming up (your call with Amara and your Path Requests), Your Path this week, People worth knowing, Office Hours and your communities. | Home |
| **Sidebar.** The menu button docks or hides it on wide screens and slides it over the content on narrower ones. The active row's surface slides between items. | Desktop and iPad |
| **⌘K.** Press ⌘K (Ctrl+K) or the search field to go anywhere: people, destinations, communities, stories and questions, plus actions such as Write, Book office hours and switching appearance. ↑ ↓ to move, ↵ to open. | Anywhere |
| **Book a Path Guide.** *Book a spot* on any Guide opens their next three sessions. Pick one, pick a time, say what it's about and leave a note. The confirmation ticket downloads a real calendar file, and the booking leads Coming up on Home. | Path Guides, Discover, a Guide's profile, Home, ⌘K |
| **The Transit Map.** Your Path draws itself station by station. The "?" interchange opens into three parallel routes that rejoin at your destination terminus. Tap any station to see who is there. | My Path |
| **Walk ahead.** Drag your photo down your future, or tap *take the walk*. At each station the inspector shows who is there right now. | My Path |
| **Destination ecosystem.** Select the destination to see the routes people took, the Guides who made it, who's heading there, and the communities, questions, stories and decisions around it. | My Path → Pharmaceutical R&D |
| **Route Confluence.** Every real route into a destination runs as its own line into one terminus. Where routes share a station you'll see an interchange, and if you're standing on it, you'll see yourself there. Tap a route to follow it into people and its community. | Discover → Pharmaceutical R&D |
| **Path Lens.** Your network placed *on* your Path: Twins beside you, Peers at your station, People Ahead on your next step, Guides at your destination, Explorers arriving from elsewhere. | Network |
| **Write.** Choose what you're writing and which stretch of your Path it's about ("Writing a Story about MSc Chem → Pharma R&D"), then write under a headline and summary. The bar at the bottom formats text and adds a photo, your Path or a section break. **Review** shows the post as it will appear in For you, then shares it. | Write (top bar), or the pencil on iPhone Home |
| **Tell posts apart.** Every post is the same card, and each kind is marked in the same three places: a context line above the author with the kind's icon and name (Story, Question, Community, Path Guide, Decision Point, Route, Milestone), its thumbnail (the Path it covers, the answer count, the members, the Guide's photo and rating, the fork, how many took the route, the arrival) and its detail strip (the best answer, the latest reply, the Guide's prices, the roads, the route line, Congratulate). Use the pills under For you to see one kind at a time. | Home |
| **Path Guides.** A Guide's profile opens on the Path they walked with the moves they guide drawn heavier, then their rating, people helped, followers and standing in each community, their expertise, services and prices, availability, reviews and contributions. Book free Office Hours, a paid call, mentorship, a résumé or portfolio review, interview prep, or a seat in a small group or workshop, with the price and PathedIn's share shown (no payment is taken in the prototype). | Any Guide's profile, Guides, the feed |
| **Become a Path Guide.** Choose the moves on your own Path you'll guide, say what you know, set free help and paid services with your own prices (and what you keep after PathedIn's 15%), mark when you're around, preview your card and go live. | Your profile, Home, the drawer, ⌘K |
| **Network, by relation.** Every person is the same card; a blue line under their headline says what they are to you (your match, the step you share, the step they took, a Guide's rating and prices, a request), and the button fits the relation (Align Paths, Book, Reply). | Network |
| **Path hints.** Posts and people show a Path in one line ("CRO → Pharma R&D"). Hover it, or tap it on a phone, to see the whole Path drawn top to bottom, with the steps you share marked. | Home, Network, Discover, Questions |
| **Discover.** Tabs for People, Path Guides, Communities and Destinations, with a For you mix of each. Each person's card carries their Path across the top, with the steps you share lit in navy. | Discover |
| **Read and respond.** Select any passage to Highlight it, Respond with it quoted, *Ask* the author about it as a Path Request, or Share it. The passage readers on this route marked most is washed in navy with a count in the margin. Tap the hand to mark a story Helpful (+1), or the bubble to open Responses, sorted by who's closest to your Path. On iPhone, the reading dock hides while you read down and returns when you scroll up. | Any story |
| **Peek.** Press and hold anyone (or hover on desktop, or right-click) to preview their Path and relationship to you without leaving the page. | Anywhere |
| **Align Paths.** Two Paths start apart, then slide together so shared stations merge into one lit track. | Any profile, Peek, or conversation |
| **Path Requests.** Ask about a specific stretch of someone's Path; every request arrives with its context. | Profile → *Send a Path Request* |
| **Decision Points.** A decision drawn as a fork, showing who took each road and where it led them. People weigh in with their own Path. | Home, Decisions |
| **Stories on a Path.** Each story's cover is generated from the author's Path, with the stretch it covers highlighted. | Stories |

Everything is stateful in the browser: connecting, saving, joining, requests, weighing in, messages and added routes all persist to `localStorage` (and fail safely if storage is unavailable). The app opens in Soft Cream. Midnight (dark) and Automatic can be chosen from the account menu, your profile or ⌘K. **Sign out** (account menu, or the bottom of your own profile) returns you to the intro page.

## Project structure

```
src/
  data/          interconnected sample network: people & Paths, waypoints, communities,
                 stories, questions, decisions, destinations, requests, messages, notifications
  lib/
    relations.ts the relation engine — Twins, Peers, People Ahead, Guides, Explorers —
                 derived from the Paths themselves, plus Path alignment (LCS)
    motion.ts    springs expressed as iOS response/damping, media-query hooks, haptics
    store.ts     persisted app state (zustand)
    ui.ts        overlay state: Peek, Align, Path Request, booking, the command palette, toasts
    booking.ts   office hours as bookable time: sessions and spots from a Guide's hours, and the calendar file
    writing.ts   your draft and published posts, kept apart from the main state, and the HTML allow-list
  components/
    path/        TransitMap, PathStrip, PathHint (one-line Path + hover card), Align (Compare), Confluence, PathLens,
                 PathCover (profile cover), RouteBand (the Path across a person's card)
    chrome.tsx   top bar with the section icons, ⌘K launcher and account chip, the drawer, the floating iPhone tab bar, navigation bars with large titles, sheets
    CommandPalette.tsx  ⌘K: go anywhere on your Path
    Booking.tsx  booking a Guide's office hours, and the confirmation ticket
    Post.tsx     the feed row (kind label, byline, title, subtitle, why it's here, thumbnail)
    FeedItems.tsx  one post shape per kind, the per-kind For you feeds and their filter row
    PathSplash.tsx  the Path that draws itself after sign-in
    Reading.tsx  story reading: highlights, the selection toolbar, topic pills, the responses drawer
    Peek.tsx     press-and-hold / hover previews
    …            content building blocks (people, stories, questions, decisions, communities)
  screens/       one file per area of the product (Landing.tsx is the signed-out intro page and sign-in card;
                 Write.tsx is the editor and MyPost.tsx a published post)
  styles/        tokens (type ramp, palette, dark mode), self-hosted fonts, base styles, and cards.css (the dashboard card language every screen shares)
  assets/fonts/  WOFF2 fonts: Space Grotesk (with its arrows), Charis SIL, and a small symbols subset
```

## Notes

- **Portraits** are AI-generated faces of people who don't exist, from the public [100k-faces](https://github.com/ozgrozer/100k-faces) set (originally from [generated.photos](https://generated.photos)). They are placeholders: replace them with licensed photography before any real use.
- **Names, companies and people are fictional.** Universities are real places, used only as settings.
- **Fonts** (all SIL Open Font License):
  - **Space Grotesk** for the interface, headings and wordmark
  - **Charis SIL**, SIL's open edition of Charter, for reading; Apple devices use their own Charter
  - each leads a [Modern Font Stacks](https://github.com/system-fonts/modern-font-stacks) stack, with measured stand-in faces so nothing jumps while fonts load
- **Sign-in** is a prototype: no passwords are requested and nothing leaves the browser.
- See [DESIGN.md](./DESIGN.md) for:
  - the visual world ("Navy Ink on Cream Paper"): colour, type, layout, depth and shapes
  - components, including the ⌘K palette, the route band and office-hours booking
  - the do's and don'ts that keep new screens in the world
- See [PRODUCT.md](./PRODUCT.md) for who PathedIn is for, its terminology and its principles.
