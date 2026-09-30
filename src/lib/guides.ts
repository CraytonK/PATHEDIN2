import type { ReactNode } from 'react';
import { people, ME } from '../data/people';
import { guideEconomy } from '../data/guides';
import { communities, threads } from '../data/communities';
import { questionList } from '../data/questions';
import { storyList } from '../data/stories';
import type { GuideEconomy, GuideProfile, GuideService, ServiceKind } from '../data/types';
import { wp } from '../data/waypoints';
import { IconBook, IconCalendar, IconDoc, IconImage, IconPeople, IconPlus, IconSignpost, IconTarget, IconVideo } from '../components/icons';
import { spotLength, type Session, type Slot } from './booking';
import { useApp, type Booking, type MyGuide } from './store';

/*
  Path Guides as a creator economy. Office Hours stay free, and so does answering in a community; on top of
  that a Guide can offer paid calls, mentorship, reviews and sessions. PathedIn keeps a share of each paid
  booking and the Guide keeps the rest. Guides earn standing inside the Path Communities they help in.
*/

/** PathedIn's share of every paid booking. A placeholder until pricing is decided. */
export const PLATFORM_FEE = 0.15;

type Icon = (p: { size?: number; strokeWidth?: number }) => ReactNode;

export const serviceKinds: Record<ServiceKind, { label: string; plural: string; icon: Icon; timed: boolean; minutes?: number; per: GuideService['per']; suggested: number }> = {
  'office-hours': { label: 'Office Hours', plural: 'Office Hours', icon: IconCalendar, timed: true, per: 'session', suggested: 0 },
  call: { label: '1:1 call', plural: '1:1 calls', icon: IconVideo, timed: true, minutes: 45, per: 'session', suggested: 60 },
  mentorship: { label: 'Mentorship', plural: 'Mentorship', icon: IconSignpost, timed: true, minutes: 45, per: 'month', suggested: 180 },
  resume: { label: 'Résumé review', plural: 'Résumé reviews', icon: IconDoc, timed: false, per: 'review', suggested: 45 },
  interview: { label: 'Interview prep', plural: 'Interview prep', icon: IconTarget, timed: true, minutes: 60, per: 'session', suggested: 90 },
  portfolio: { label: 'Portfolio review', plural: 'Portfolio reviews', icon: IconImage, timed: false, per: 'review', suggested: 60 },
  group: { label: 'Small-group session', plural: 'Small groups', icon: IconPeople, timed: true, minutes: 60, per: 'seat', suggested: 25 },
  workshop: { label: 'Workshop', plural: 'Workshops', icon: IconBook, timed: true, minutes: 90, per: 'seat', suggested: 35 },
  other: { label: 'Something else', plural: 'Other help', icon: IconPlus, timed: true, minutes: 45, per: 'session', suggested: 50 },
};

/** The kinds a Guide can offer for money, in the order the setup lists them. */
export const paidKinds: ServiceKind[] = ['call', 'mentorship', 'resume', 'interview', 'portfolio', 'group', 'workshop', 'other'];

export function priceLabel(s: Pick<GuideService, 'price' | 'per'>) {
  if (s.price === 0) return 'Free';
  const unit = s.per === 'month' ? '/month' : s.per === 'seat' ? '/seat' : '';
  return `$${s.price}${unit}`;
}

/** What the Guide keeps, after PathedIn's share. */
export const payout = (price: number) => Math.round(price * (1 - PLATFORM_FEE) * 100) / 100;
export const fmtMoney = (n: number) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`);

/* ── Your own Guide profile, from the setup ── */

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const PARTS = [
  { key: 'morning', label: 'Mornings', hours: [9, 10] },
  { key: 'afternoon', label: 'Afternoons', hours: [13, 14] },
  { key: 'evening', label: 'Evenings', hours: [18, 19, 20] },
] as const;

function availabilityOf(g: MyGuide): GuideEconomy['paid'] {
  const days = [...new Set(g.availability.map((k) => +k.split('-')[0]))].sort();
  const parts = new Set(g.availability.map((k) => k.split('-')[1]));
  const hours = PARTS.filter((p) => parts.has(p.key)).flatMap((p) => [...p.hours]);
  const label = days.length ? `${days.map((d) => DAY_NAMES[d].slice(0, 3)).join(', ')} · ${PARTS.filter((p) => parts.has(p.key)).map((p) => p.label.toLowerCase()).join(', ')}` : 'Not set yet';
  return { days, hours: hours.length ? hours : [18], label };
}

function myEconomy(g: MyGuide): GuideEconomy {
  return {
    since: g.since,
    experience: g.experience,
    expertise: g.expertise,
    services: g.services
      .filter((x) => x.on)
      .map((x) => ({
        id: `${ME}-${x.kind}`,
        kind: x.kind,
        title: serviceKinds[x.kind].label,
        blurb: g.pitch,
        minutes: serviceKinds[x.kind].timed ? (x.minutes ?? serviceKinds[x.kind].minutes) : undefined,
        price: x.price,
        per: serviceKinds[x.kind].per,
        seats: x.seats,
        delivery: serviceKinds[x.kind].timed ? undefined : 'Written notes within 3 days',
      })),
    rating: 0,
    reviewCount: 0,
    followers: 0,
    reviews: [],
    standing: [],
    paid: availabilityOf(g),
  };
}

function myProfile(g: MyGuide): GuideProfile {
  const when = `${DAY_NAMES[g.officeHours.day]}s, ${fmtHour(g.officeHours.hour)}–${fmtHour(g.officeHours.hour + 1)}`;
  return {
    transitions: g.transitions,
    helpsWith: g.expertise.slice(0, 3),
    officeHours: { when, open: g.officeHours.spots, total: g.officeHours.spots },
    helped: 0,
    replies: 'New Guide',
  };
}

const fmtHour = (h: number) => `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`;

/** A Guide's profile and economy; your own comes from the setup, once it's live. */
export function useGuide(id: string): { profile: GuideProfile; econ: GuideEconomy } | null {
  const mine = useApp((s) => s.myGuide);
  if (id === ME) return mine?.live ? { profile: myProfile(mine), econ: myEconomy(mine) } : null;
  const profile = people[id]?.guide;
  const econ = guideEconomy[id];
  return profile && econ ? { profile, econ } : null;
}

export function economyOf(id: string): GuideEconomy | undefined {
  return guideEconomy[id];
}

/** Free Office Hours, as a service like the others. */
export function officeHoursService(id: string): GuideService | undefined {
  const g = people[id]?.guide;
  if (!g) return undefined;
  return {
    id: `${id}-office-hours`,
    kind: 'office-hours',
    title: 'Office Hours',
    blurb: `A short, free spot in ${people[id].first}’s ${g.officeHours.when.toLowerCase().startsWith('by') ? 'hours' : 'weekly hours'}. Bring one question.`,
    minutes: spotLength(id),
    price: 0,
    per: 'session',
  };
}

/** Everything a Guide offers: free Office Hours first, then what they charge for. */
export function servicesOf(id: string): GuideService[] {
  const oh = officeHoursService(id);
  return [...(oh ? [oh] : []), ...(guideEconomy[id]?.services ?? [])];
}

export function serviceById(id: string, serviceId?: string) {
  const all = servicesOf(id);
  return all.find((s) => s.id === serviceId) ?? all[0];
}

/** The lowest price among a Guide's paid services. */
export function fromPrice(id: string) {
  const paid = (guideEconomy[id]?.services ?? []).filter((s) => s.price > 0);
  return paid.length ? paid.reduce((a, b) => (b.price < a.price ? b : a)) : undefined;
}

/* ── Standing and contributions ── */

export function standingOf(id: string) {
  return (guideEconomy[id]?.standing ?? [])
    .filter((s) => communities[s.community])
    .sort((a, b) => a.rank - b.rank)
    .map((s) => ({ ...s, title: communities[s.community].title, label: s.rank === 1 ? 'Top Guide' : `No. ${s.rank} Guide` }));
}

/** Their best standing, said as a badge: "Top Guide in CRO → Pharma R&D". */
export function topStanding(id: string) {
  const s = standingOf(id)[0];
  return s ? `${s.label} in ${s.title}` : undefined;
}

/** A community's Guides, by standing. */
export function communityGuides(community: string) {
  return Object.entries(guideEconomy)
    .map(([id, e]) => ({ id, rank: e.standing.find((s) => s.community === community)?.rank }))
    .filter((x): x is { id: string; rank: number } => x.rank !== undefined)
    .sort((a, b) => a.rank - b.rank);
}

export function contributions(id: string) {
  const answers = questionList.flatMap((q) => q.answers.filter((a) => a.author === id).map((a) => ({ q, a })));
  const stories = storyList.filter((s) => s.author === id);
  const started = threads.filter((t) => t.author === id);
  const replies = threads.filter((t) => t.replies.some((r) => r.author === id));
  return { answers, stories, threads: started, replies };
}

export function moveLabel([a, b]: [string, string]) {
  return `${wp(a).short} → ${wp(b).short}`;
}

/* ── Bookable times for paid sessions ── */

function seed(s: string) {
  let h = 11;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/** The next few days a Guide is open for paid sessions, with a slot at each of their start hours. */
export function paidSessionsFor(id: string, service: GuideService, bookings: Booking[], count = 3, from = new Date()): Session[] {
  const econ = guideEconomy[id];
  if (!econ) return [];
  const minutes = service.minutes ?? 45;
  const out: Session[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  for (let i = 1; i < 60 && out.length < count; i++) {
    const d = new Date(cursor);
    d.setDate(cursor.getDate() + i);
    if (!econ.paid.days.includes(d.getDay())) continue;
    const slots: Slot[] = econ.paid.hours.map((h, j) => {
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, 0);
      const mine = bookings.find((b) => b.guide === id && Math.abs(new Date(b.at).getTime() - start.getTime()) < 60_000);
      // The nearest day is busiest, the way a real calendar fills up.
      const busy = out.length === 0 ? seed(`${id}${j}${service.kind}`) % 2 === 0 : seed(`${id}${i}${j}`) % 4 === 0;
      return { start, end: new Date(start.getTime() + minutes * 60_000), taken: busy || !!mine, mine: mine?.id };
    });
    out.push({ key: d.toDateString(), start: slots[0].start, end: slots[slots.length - 1].end, slots });
  }
  return out;
}

/** Group sessions and workshops run on a date: the Guide's first open day two weeks out. */
export function cohortFor(id: string, service: GuideService, bookings: Booking[], from = new Date()) {
  const econ = guideEconomy[id];
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 12);
  while (econ && !econ.paid.days.includes(d.getDay())) d.setDate(d.getDate() + 1);
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), econ?.paid.hours[econ.paid.hours.length - 1] ?? 19, 0);
  const seats = service.seats ?? 8;
  const taken = Math.min(seats - 1, Math.round(seats * (0.4 + (seed(service.id) % 40) / 100)));
  const mine = bookings.find((b) => b.guide === id && b.service === service.kind && Math.abs(new Date(b.at).getTime() - start.getTime()) < 60_000);
  return { start, end: new Date(start.getTime() + (service.minutes ?? 60) * 60_000), seats, left: seats - taken - (mine ? 1 : 0), mine: mine?.id };
}

/** When a written review is due back. */
export function dueFor(service: GuideService, from = new Date()) {
  const days = Number(service.delivery?.match(/(\d+) days?/)?.[1] ?? 3);
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  d.setHours(17, 0, 0, 0);
  return d;
}

/** "Office hours with Amara", "Résumé review with Amara". */
export function bookingTitle(b: Booking) {
  return `${b.title ?? 'Office hours'} with ${people[b.guide].first}`;
}
