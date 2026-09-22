# PathedIn

**Where you've been, where you are, where you want to go — and who you should know to get there.**

PathedIn is a professional network built around one object: the **Path**. A Path is a journey (Past → Present → Possible futures), drawn as a transit line. Stations are steps. The walked track is solid, and the future is dotted. An undecided next step is an interchange that opens into the real routes people took. Everything in the product hangs off the Path: the people you should know, the communities you belong to, and the questions, stories and decisions worth your time.

This repository is a working front-end prototype. It's a React + TypeScript single-page app, designed to Apple's [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines) and built mobile-first. It ships with a believable, interconnected sample network centred on Maya Okafor, an MSc chemistry student heading for pharmaceutical R&D.

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

Everything is stateful in the browser: connecting, saving, joining, requests, weighing in, messages and added routes all persist to `localStorage` (and fail safely if storage is unavailable). Light and dark appearance follow the system, and you can override it from the account menu or your profile.

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
    chrome.tsx   tab bar, top bar, navigation bars with large titles, sheets with detents
    Peek.tsx     press-and-hold / hover previews
    …            content building blocks (people, stories, questions, decisions, communities)
  screens/       one file per area of the product
  styles/        design tokens (HIG type ramp, semantic colors, dark mode) and base styles
```

## Notes

- **Portraits** are AI-generated faces of people who don't exist, from the public [100k-faces](https://github.com/ozgrozer/100k-faces) set (originally from [generated.photos](https://generated.photos)). They are placeholders: replace them with licensed photography before any real use.
- **Names, companies and people are fictional.** Universities are real places, used only as settings.
- See [DESIGN.md](./DESIGN.md) for how the interface follows the Human Interface Guidelines, and for PathedIn's own visual language.
