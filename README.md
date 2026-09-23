# PathedIn

**Where you've been, where you are, where you want to go — and who you should know to get there.**

PathedIn is a professional network built around one object: the **Path**. A Path is a journey (Past → Present → Possible futures), drawn as a transit line. Stations are steps, drawn with the brand's three nodes. The walked track is solid ink, and the future is a dashed celestial line. An undecided next step is an interchange that opens into the real routes people took. Everything in the product hangs off the Path: the people you should know, the communities you belong to, and the questions, stories and decisions worth your time.

This repository is a working front-end prototype. It's a React + TypeScript single-page app, built mobile-first.
- **Behaviour** follows Apple's [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines).
- **Look and layout** follow Medium's reading experience: a cream intro page, a "Join PathedIn." sign-in card, a slim top bar with a left sidebar, and a For you feed beside a quiet right-hand column.
- **Brand:** the PathedIn Path mark, with Celestial Blue as its one accent.

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
| **The intro page.** One serif line and one sentence explain PathedIn. *Get started* or *Sign in* opens the "Join PathedIn." card. | First visit, or after signing out |
| **Your Path draws itself.** After you sign in, your steps pop in one by one, each name types out, the future dashes on to your destination, and "Welcome, Maya." is written. Tap to skip. | Sign in |
| **Home.** The For you feed, where every post says why it's there, next to a right-hand column. The column shows Coming up (your call with Amara and your Path Requests), Your Path this week, People worth knowing, Office Hours and your communities. | Home |
| **Sidebar.** The menu button docks or hides it on wide screens and slides it over the content on narrower ones. | Desktop and iPad |
| **The Transit Map.** Your Path draws itself station by station. The "?" interchange opens into three parallel routes that rejoin at your destination terminus. Tap any station to see who is there. | My Path |
| **Walk ahead.** Drag your photo down your future, or tap *take the walk*. At each station the inspector shows who is there right now. | My Path |
| **Destination ecosystem.** Select the destination to see the routes people took, the Guides who made it, who's heading there, and the communities, questions, stories and decisions around it. | My Path → Pharmaceutical R&D |
| **Route Confluence.** Every real route into a destination runs as its own line into one terminus. Where routes share a station you'll see an interchange, and if you're standing on it, you'll see yourself there. Tap a route to follow it into people and its community. | Discover → Pharmaceutical R&D |
| **Path Lens.** Your network placed *on* your Path: Twins beside you, Peers at your station, People Ahead on your next step, Guides at your destination, Explorers arriving from elsewhere. | Network |
| **Peek.** Press and hold anyone (or hover on desktop, or right-click) to preview their Path and relationship to you without leaving the page. | Anywhere |
| **Align Paths.** Two Paths start apart, then slide together so shared stations merge into one lit track. | Any profile, Peek, or conversation |
| **Path Requests.** Ask about a specific stretch of someone's Path; every request arrives with its context. | Profile → *Send a Path Request* |
| **Decision Points.** A decision drawn as a fork, showing who took each road and where it led them. People weigh in with their own Path. | Home, Decisions |
| **Stories on a Path.** Each story's cover is generated from the author's Path, with the stretch it covers highlighted. | Stories |

Everything is stateful in the browser: connecting, saving, joining, requests, weighing in, messages and added routes all persist to `localStorage` (and fail safely if storage is unavailable). Light and dark appearance follow the system, and you can override it from the account menu or your profile. **Sign out** (account menu, or the bottom of your own profile) returns you to the intro page.

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
    ui.ts        overlay state: Peek, Align, Path Request, search, toasts
  components/
    path/        TransitMap, PathStrip, Align (Compare), Confluence, PathLens
    chrome.tsx   Medium-style top bar and sidebar, iPhone tab bar, navigation bars with large titles, sheets
    Post.tsx     the feed row (byline, title, subtitle, why it's here, thumbnail)
    PathSplash.tsx  the Path that draws itself after sign-in
    Peek.tsx     press-and-hold / hover previews
    …            content building blocks (people, stories, questions, decisions, communities)
  screens/       one file per area of the product (Landing.tsx is the signed-out intro page and sign-in card)
  styles/        tokens (type ramp, palette, dark mode), self-hosted fonts and base styles
  assets/fonts/  WOFF2 fonts: Inter, Playfair Display, Source Serif 4
```

## Notes

- **Portraits** are AI-generated faces of people who don't exist, from the public [100k-faces](https://github.com/ozgrozer/100k-faces) set (originally from [generated.photos](https://generated.photos)). They are placeholders: replace them with licensed photography before any real use.
- **Names, companies and people are fictional.** Universities are real places, used only as settings.
- **Fonts.** All shipped fonts are under the SIL Open Font License:
  - **Inter** is the interface font, standing in for Medium's Söhne.
  - **Playfair Display** is the display serif, for the brand's Noe Display.
  - **Source Serif 4** is the reading serif. Charter is used instead on Apple devices, which include it.
- **Sign-in** is a prototype: no passwords are requested and nothing leaves the browser.
- See [DESIGN.md](./DESIGN.md) for:
  - the analysis of Medium's layout and how PathedIn maps it
  - type, colour and components
  - how the interface follows the Human Interface Guidelines
  - PathedIn's own visual language
