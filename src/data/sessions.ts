import type { Booking } from '../lib/store';

/*
  Sessions Maya had before this device (sample data, like the rest of the network), so Your sessions has a past
  to review from the start. Dates are relative to today so they always read as recent.
*/
function daysAgo(days: number, hour: number, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const pastSessions: Booking[] = [
  {
    id: 'past-amara-oh',
    guide: 'amara',
    at: daysAgo(12, 19, 30),
    minutes: 15,
    topic: 'Getting through a CRO interview',
    note: 'I have a first interview at a CRO next month. What should I ask them?',
  },
  {
    id: 'past-grace-call',
    guide: 'grace',
    at: daysAgo(26, 18, 0),
    minutes: 45,
    topic: 'Moving from QC into R&D',
    note: 'Is QC a reasonable first step if I want discovery chemistry in the end?',
    service: 'call',
    title: '1:1 call',
    price: 55,
  },
];
