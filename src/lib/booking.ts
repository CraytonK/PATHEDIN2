import { people } from '../data/people';
import { useApp, type Booking } from './store';

/*
  Path Office Hours, as bookable time. A Guide's hours are written the way a person would say them
  ("Tuesdays, 6–7 PM", "First Monday of the month", "Sundays, 4–5 PM PT"); this turns that sentence into
  their next three sessions, each split into the number of spots they offer.
*/

export interface Slot {
  start: Date;
  end: Date;
  taken: boolean;
  /** Your own booking holds this spot. */
  mine?: string;
}
export interface Session {
  key: string;
  start: Date;
  end: Date;
  slots: Slot[];
}

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

interface Rule {
  kind: 'weekly' | 'biweekly' | 'monthly-first' | 'request';
  weekday: number;
  start: [number, number];
  end: [number, number];
  zone?: string;
}

function to24(h: number, mer: string) {
  return mer === 'PM' ? (h % 12) + 12 : h % 12;
}

export function parseHours(when: string): Rule {
  const lower = when.toLowerCase();
  const weekday = DAYS.findIndex((d) => lower.includes(d));
  const kind: Rule['kind'] = lower.includes('by request') ? 'request' : lower.includes('first') ? 'monthly-first' : lower.includes('every other') ? 'biweekly' : 'weekly';
  const weekend = weekday === 0 || weekday === 6;
  let start: [number, number] = weekend ? [10, 0] : [18, 0];
  let end: [number, number] = weekend ? [11, 0] : [19, 0];
  if (kind === 'request') {
    start = [12, 0];
    end = [13, 0];
  }
  const m = when.match(/(\d{1,2})(?::(\d\d))?\s*(AM|PM)?\s*[–-]\s*(\d{1,2})(?::(\d\d))?\s*(AM|PM)/i);
  if (m) {
    const endMer = m[6].toUpperCase();
    const eh = to24(+m[4], endMer);
    let sh = to24(+m[1], (m[3] ?? endMer).toUpperCase());
    if (!m[3] && sh > eh) sh -= 12;
    start = [sh, +(m[2] ?? 0)];
    end = [eh, +(m[5] ?? 0)];
  }
  const zone = /\bPT\b/.test(when) ? 'America/Los_Angeles' : /\bET\b/.test(when) ? 'America/Toronto' : undefined;
  return { kind, weekday: weekday < 0 ? 2 : weekday, start, end, zone };
}

/** The instant at which the wall clock in `zone` reads y-m-d h:min. */
function zoned(y: number, mo: number, d: number, h: number, min: number, zone?: string) {
  if (!zone) return new Date(y, mo, d, h, min);
  const guess = Date.UTC(y, mo, d, h, min);
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' }).formatToParts(new Date(guess));
  const get = (t: string) => +(parts.find((p) => p.type === t)?.value ?? 0);
  const asZone = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'));
  return new Date(guess - (asZone - guess));
}

/** A small, stable hash so the same Guide always has the same spots taken. */
function seed(s: string) {
  let h = 7;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

export function sessionsFor(id: string, bookings: Booking[], count = 3, from = new Date()): Session[] {
  const guide = people[id]?.guide;
  if (!guide) return [];
  const rule = parseHours(guide.officeHours.when);
  const total = Math.max(1, guide.officeHours.total);
  const days: Date[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  let anchor: Date | undefined;
  for (let i = 0; i < 160 && days.length < count; i++) {
    const d = new Date(cursor);
    d.setDate(cursor.getDate() + i);
    const dow = d.getDay();
    let hit = false;
    if (rule.kind === 'request') hit = i > 0 && dow > 0 && dow < 6 && (days.length === 0 || d.getTime() - days[days.length - 1].getTime() >= 2 * 86_400_000);
    else if (rule.kind === 'monthly-first') hit = dow === rule.weekday && d.getDate() <= 7;
    else if (dow === rule.weekday) {
      if (rule.kind === 'weekly') hit = true;
      else {
        anchor ??= d;
        hit = Math.round((d.getTime() - anchor.getTime()) / 86_400_000) % 14 === 0;
      }
    }
    if (!hit) continue;
    const start = zoned(d.getFullYear(), d.getMonth(), d.getDate(), rule.start[0], rule.start[1], rule.zone);
    if (start.getTime() < from.getTime() + 60 * 60_000) continue; // too soon to book
    days.push(d);
  }

  return days.map((d, n) => {
    const start = zoned(d.getFullYear(), d.getMonth(), d.getDate(), rule.start[0], rule.start[1], rule.zone);
    const end = zoned(d.getFullYear(), d.getMonth(), d.getDate(), rule.end[0], rule.end[1], rule.zone);
    const len = (end.getTime() - start.getTime()) / total;
    // The nearest session is as full as the Guide's card says; later ones have more room.
    const takenCount = n === 0 ? total - guide.officeHours.open : n === 1 ? Math.min(1, total - 1) : 0;
    const order = Array.from({ length: total }, (_, i) => i).sort((a, b) => ((seed(id + a) % 97) - (seed(id + b) % 97)));
    const taken = new Set(order.slice(0, takenCount));
    const slots: Slot[] = Array.from({ length: total }, (_, i) => {
      const s = new Date(start.getTime() + i * len);
      const mine = bookings.find((b) => b.guide === id && Math.abs(new Date(b.at).getTime() - s.getTime()) < 60_000);
      return { start: s, end: new Date(s.getTime() + len), taken: taken.has(i) || !!mine, mine: mine?.id };
    });
    return { key: d.toDateString(), start, end, slots };
  });
}

/** Spots still open in a Guide's next session, counting your own bookings. */
export function openSpots(id: string, bookings: Booking[]) {
  const g = people[id]?.guide;
  if (!g) return { open: 0, total: 0, when: '' };
  const next = sessionsFor(id, bookings, 1)[0];
  const open = next ? next.slots.filter((s) => !s.taken).length : g.officeHours.open;
  return { open, total: g.officeHours.total, when: g.officeHours.when };
}

export function useOpenSpots(id: string) {
  const bookings = useApp((s) => s.bookings);
  return openSpots(id, bookings);
}

/** Your next booking with this Guide, if one is still ahead. */
export function useUpcomingBooking(id?: string) {
  const bookings = useApp((s) => s.bookings);
  const now = Date.now();
  return bookings
    .filter((b) => (!id || b.guide === id) && new Date(b.at).getTime() + b.minutes * 60_000 > now)
    .sort((a, b) => +new Date(a.at) - +new Date(b.at))[0];
}

export const fmtTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
export const fmtDay = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
export const fmtShortDay = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

export function dayLabel(d: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const that = new Date(d);
  that.setHours(0, 0, 0, 0);
  const n = Math.round((that.getTime() - today.getTime()) / 86_400_000);
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n < 7) return d.toLocaleDateString('en-US', { weekday: 'long' });
  return fmtShortDay(d);
}

/** How long the Guide's spots are, said plainly. */
export function spotLength(id: string) {
  const g = people[id].guide;
  if (!g) return 0;
  const rule = parseHours(g.officeHours.when);
  const mins = rule.end[0] * 60 + rule.end[1] - (rule.start[0] * 60 + rule.start[1]);
  return Math.round(mins / Math.max(1, g.officeHours.total));
}

/* ── A real calendar file, so the booking lands where you keep your week ── */

const icsDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const icsText = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** RFC 5545 lines are folded at 75 octets, never inside a character. */
function fold(line: string) {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    if (bytes + n > (out.length ? 74 : 75)) {
      out.push(cur);
      cur = '';
      bytes = 0;
    }
    cur += ch;
    bytes += n;
  }
  out.push(cur);
  return out.join('\r\n ');
}

export function downloadIcs(b: Booking) {
  const g = people[b.guide];
  const start = new Date(b.at);
  const end = new Date(start.getTime() + b.minutes * 60_000);
  const description = [`Path Office Hours with ${g.name}.`, `About: ${b.topic}`, b.note ? `Your note: ${b.note}` : ''].filter(Boolean).join('\n');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PathedIn//Path Office Hours//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${b.id}@pathedin`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsText(`Office hours with ${g.name}`)}`,
    `DESCRIPTION:${icsText(description)}`,
    'LOCATION:PathedIn video call',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Office hours in 15 minutes',
    'TRIGGER:-PT15M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].map(fold);
  const blob = new Blob([lines.join('\r\n') + '\r\n'], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `office-hours-${g.first.toLowerCase()}-${start.toISOString().slice(0, 10)}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
