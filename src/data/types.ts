export type StepKind = 'study' | 'work' | 'research' | 'transition' | 'unknown';
export type StepStatus = 'past' | 'present' | 'future';

/** A canonical point on professional journeys. Paths are compared by waypoint. */
export interface Waypoint {
  id: string;
  label: string;
  short: string;
  mid?: string; // label for sentence-length Paths
  kind: StepKind;
  field: 'chem' | 'software' | 'teaching' | 'health' | 'policy' | 'data' | 'writing' | 'general';
  destination?: boolean;
}

export interface Step {
  wp: string;
  title?: string; // overrides waypoint label
  org?: string;
  start?: number;
  end?: number | null; // null = present
  status: StepStatus;
  note?: string;
  storyId?: string;
}

/** A possible route from the present to a destination. */
export interface FutureRoute {
  id: string;
  label: string; // "Via a CRO"
  steps: string[]; // waypoint ids between present and destination
  share: number; // fraction of people with a similar background who took it
  people: number; // how many people on PathedIn took this route
}

export interface Future {
  destination: string; // waypoint id
  certainty: 'set' | 'considering' | 'exploring';
  routes?: FutureRoute[];
  note?: string;
}

export interface GuideProfile {
  transitions: [string, string][]; // waypoint pairs they have made
  helpsWith: string[];
  officeHours: { when: string; open: number; total: number };
  helped: number;
  replies: string; // "Usually replies within a day"
}

export interface Person {
  id: string;
  name: string;
  first: string;
  pronouns?: string;
  photo: string;
  location: string;
  headline: string;
  bio: string;
  path: Step[];
  futures: Future[];
  guide?: GuideProfile;
  hiring?: string; // "Hires MSc chemists into Discovery Chemistry"
  communities: string[];
  why?: string; // hand-written reason this person matters to the viewer
  mutuals?: number;
}

export interface Community {
  id: string;
  from: string; // label, e.g. "Chemistry"
  to: string; // label, e.g. "Pharmaceutical R&D"
  title: string; // how the community reads as a name
  kind: 'transition' | 'decision' | 'circumstance';
  description: string;
  members: number;
  guides: number;
  stages: { wp: string; count: number }[];
  host: string; // person id
  memberIds: string[];
  guideIds: string[];
  activeNow: number;
}

export interface Thread {
  id: string;
  community: string;
  author: string;
  title: string;
  body: string;
  replies: { author: string; body: string; ago: string }[];
  replyCount: number;
  ago: string;
  pinned?: boolean;
}

export interface Story {
  id: string;
  author: string;
  title: string;
  dek: string;
  segment: [string, string]; // waypoints the story happens between
  minutes: number;
  published: string;
  body: string[]; // paragraphs; lines starting with "> " are pull quotes
  communities: string[];
  reads: number;
  /** The passage readers on this route highlighted most. */
  topHighlight?: { text: string; count: number };
  responses?: StoryResponse[];
}

export interface StoryResponse {
  id: string;
  author: string;
  body: string;
  ago: string;
  /** A passage from the story the response is about. */
  quote?: string;
  helpful: number;
}

export type Credibility =
  | 'reached-destination'
  | 'took-route'
  | 'steps-ahead'
  | 'hires'
  | 'guide'
  | 'same-stage'
  | 'twin';

export interface Answer {
  id: string;
  author: string;
  body: string;
  helpful: number;
  ago: string;
  credibility: Credibility;
  credibilityText: string;
}

export interface Question {
  id: string;
  asker: string;
  title: string;
  body: string;
  about: [string, string]; // segment being asked about
  community: string;
  ago: string;
  answers: Answer[];
  followers: number;
}

export interface DecisionOption {
  id: string;
  label: string;
  detail: string;
  wp: string;
  chose: { person: string; outcome: string }[];
}

export interface Decision {
  id: string;
  owner: string;
  title: string;
  context: string;
  at: string; // waypoint where the decision happens
  status: 'open' | 'decided';
  chosen?: string;
  reflection?: string;
  options: DecisionOption[];
  weighIns: { person: string; option: string; body: string; ago: string }[];
  community: string;
  ago: string;
}

export interface PathRequest {
  id: string;
  from: string;
  to: string;
  segment: [string, string];
  ask: 'chat' | 'question' | 'review';
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  proposed?: string;
  ago: string;
  thread?: string;
}

export interface Message {
  id: string;
  from: string;
  body: string;
  at: string;
  segment?: { person: string; from: string; to: string };
}

export interface Conversation {
  id: string;
  with: string;
  about: [string, string];
  aboutPerson: string; // whose path the conversation is anchored to
  messages: Message[];
  unread: number;
}

export type NotificationKind =
  | 'answer'
  | 'request'
  | 'accepted'
  | 'milestone'
  | 'route'
  | 'mention'
  | 'officehours'
  | 'viewed'
  | 'decision'
  | 'branch';

export interface Notification {
  id: string;
  kind: NotificationKind;
  actor?: string;
  text: string; // may contain **bold** spans
  context?: string;
  href: string;
  ago: string;
  group: 'Today' | 'This week' | 'Earlier';
  unread?: boolean;
}

export interface DestinationRoute {
  id: string;
  label: string;
  via: string[]; // waypoint ids in order, ending before destination
  people: number;
  medianYears: number;
  guides: string[];
  travellers: string[]; // people who took it (reached)
  onRoute: string[]; // people currently on it
  community?: string;
  note: string;
}

export interface Destination {
  wp: string;
  blurb: string;
  people: number;
  routes: DestinationRoute[];
  heading: string[]; // people heading there
}
