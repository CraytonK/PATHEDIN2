# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Early-career professionals at a crossroads, in the prototype's case scientists moving from chemistry study toward pharmaceutical R&D. The persona is Maya Okafor, finishing an MSc and weighing a PhD against industry. They come to see where their career can go and to reach the specific people who have already made the move they're considering. They use it on a laptop and on an iPhone. *(Inferred from the brief and the prototype's data; the audience beyond this persona is undecided.)*

## Product Purpose
A professional network organised around career Paths rather than résumés. Every person's history and plans are a Path, meaning where they've been, where they are and where they're heading. The network answers "who should I know to get where I want to go?" Success means a person finds someone one step ahead, asks them something specific, and makes a better decision.

## Positioning
The Path is the unit of everything. People are placed on your Path (Path Twins, Peers, people Ahead, Path Guides, Explorers). Posts are tied to a stretch of a Path. Requests arrive quoting the step they're about. Communities are built around a move, not an industry. A neighbouring network can copy a feed. It can't copy a graph where every relationship is explained by where two Paths touch.

## Operating Context
- Browsing For you and Following.
- Exploring My Path and the routes ahead.
- Aligning two Paths.
- Sending and answering Path Requests.
- Booking a Path Guide's office hours.
- Reading and writing stories, questions and decision points.
- Messaging.
- Joining communities built around a transition.

## Capabilities and Constraints
- It's a front-end prototype: React, TypeScript and Vite, with state saved in the browser, no back end and no real sign-in. Everything a visitor does stays on their device.
- It's published as a static page (HashRouter) and developed locally with Vite.
- **Terminology** (keep these exact terms): Path, step, stretch, Path Request, Path Guide, Path Twin, Path Peer, Path Explorer, Align Paths, Decision Point, office hours, For you.

## Brand Commitments
- The name PathedIn.
- The three-node Path mark, and the PathedIn wordmark set in the interface face (the user asked for it to match).
- **Palette the user chose (September 29, 2026):** Soft Cream (#FFF7ED) as the ground and Midnight Navy (#0F172A) as the main accent. The dark appearance is the same pair turned over.
- **Type the user pointed to:** Space Grotesk, the face of the reference site they supplied, with its large, light headings.
- **The Path drawn as a transit line:** walked steps solid, the present marked, the future dashed toward an open destination ring, and "you are here".
- **The user's references:**
  - The look follows a fintech site the user shared: immersive navy panels with cards on them, big numerals with coloured units, and generous white space. The user asked (September 30, 2026) for the cards on navy to be solid so the lines behind never come through the text, everywhere.
  - The motion follows Linear, Arc and Raycast, and the intro's own assembling motion, which the user asked to see more of.
  - The layout and feel follow a social dashboard the user shared (September 29, 2026): a white top bar with the sections as icons in the middle, a profile card on the left, a row of faces in rings over a feed of white cards, and a calendar with an upcoming schedule and a communities list on the right. The user asked that every piece of content, action and feature stay the same, and that the whole app take this look.
  - The intro page follows the feature-tour sites the user described (September 30, 2026): visitors scroll down through interactive, moving demos of the real product (key features and what it looks like) before they sign in.
  - The user shared an article on how to stop a frontend looking AI-generated (September 30, 2026) and asked to change as much as possible so PathedIn doesn't read as AI-built. Kept from it: flat surfaces with a fine grain instead of glows and gradients, no sparkle icons, no italics, no em dashes or Title Case, every size on the type ramp, varied grids rather than rows of three, no infinite loops, a Pause on anything that plays by itself, a skip link and one `main` and `h1` per screen, and sample data labelled as sample. Kept by the user's earlier choices despite the article: the navy and cream palette with a blue accent, content on cards (from their reference dashboard), the centred profile card on Home, and Space Grotesk.
- **Replaced by the user's choice:** the graphite world, Schibsted Grotesk and the Playfair wordmark.
- The user rejects anything that reads as generic or AI-built.

## Evidence on Hand
- **People:** fictional people, companies and Paths in `src/data/`. The portraits are AI-generated faces of people who don't exist (100k-faces), placeholders to replace with licensed photography.
- **Places:** universities are real places, used only as settings.
- **What doesn't exist and must not be invented:** real users, customers, testimonials, metrics, press or partnerships.

## Product Principles
- Every relationship is explained. The app always says why someone or something is shown, in terms of Paths.
- Specific over general. Requests, posts and bookings point at a step or a stretch, not at a person in the abstract.
- **Path Guides are a creator economy built on credibility** (the user's direction, September 29, 2026). Anyone can become a Guide for moves on their own Path, and their profile leads with that Path so people see at once why they're credible. Guides offer free community guidance (answers and Office Hours) and can charge for 1:1 calls, mentorship, résumé and portfolio reviews, interview prep, small-group sessions and workshops. PathedIn keeps a share of each paid booking (15% in this prototype, a placeholder until pricing is decided). Reviews, answers and people helped build a Guide's standing inside each Path Community. The prototype takes no payment and collects no card details.
- Calm, fast, precise. The tool gets out of the way of a big decision.

## Accessibility & Inclusion
- Keep keyboard paths and visible focus, with Skip to content as the first Tab stop on every screen.
- One `main` and one `h1` per screen, with headings in order beneath it.
- Anything that moves by itself for more than five seconds can be paused; nothing loops forever.
- Respect Reduce Motion.
- Keep contrast legible in both light and dark.
- On iPhone, follow HIG touch targets and conventions.
