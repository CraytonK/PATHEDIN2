import type { GuideEconomy } from './types';

/*
  What each Path Guide offers beyond their free Office Hours: paid calls, mentorship, reviews and sessions,
  priced in Canadian dollars, with what people who booked them said. Everyone here is fictional, like the
  rest of the sample network. Office Hours stay free and are built from each Guide's profile in people.ts.
*/

const svc = (guide: string, list: Omit<GuideEconomy['services'][number], 'id'>[]) => list.map((x) => ({ ...x, id: `${guide}-${x.kind}` }));
const rev = (guide: string, list: Omit<GuideEconomy['reviews'][number], 'id'>[]) => list.map((x, i) => ({ ...x, id: `${guide}-r${i}` }));

export const guideEconomy: Record<string, GuideEconomy> = {
  amara: {
    since: 2021,
    experience: 'Thirteen years in pharma: three at a CRO, ten in formulation R&D. Leads a team of six at Meridian.',
    expertise: ['CRO to pharma moves', 'Formulation R&D', 'Analytical chemistry', 'R&D interviews', 'Newcomer careers in Canada'],
    services: svc('amara', [
      { kind: 'call', title: '1:1 call', blurb: 'Talk through your move with someone who made it, CRO and all.', minutes: 45, price: 85, per: 'session' },
      { kind: 'resume', title: 'Résumé review for R&D roles', blurb: 'Line-by-line notes that turn CRO bullet points into an R&D story.', price: 60, per: 'review', delivery: 'Written notes within 3 days' },
      { kind: 'interview', title: 'R&D interview prep', blurb: 'A mock interview with the questions pharma R&D teams actually ask, and honest feedback.', minutes: 60, price: 110, per: 'session' },
      { kind: 'group', title: 'Small group: CRO to pharma', blurb: 'Eight people at the CRO step, one hour, every question answered.', minutes: 60, price: 25, per: 'seat', seats: 8 },
    ]),
    rating: 4.9,
    reviewCount: 48,
    followers: 1240,
    reviews: rev('amara', [
      { author: 'elena', rating: 5, service: 'resume', ago: '3 weeks ago', body: 'Amara’s notes turned my CRO bullet points into the R&D story I couldn’t tell. I had two interviews within a month.' },
      { author: 'daniel', rating: 5, service: 'call', ago: '2 months ago', body: 'She told me exactly when to start looking from the CRO, and why eighteen months was the right time for me.' },
      { author: 'fatima', rating: 5, service: 'group', ago: '1 month ago', body: 'The most honest hour I’ve had about CRO work. Everyone left with a date to start looking.' },
      { author: 'yusuf', rating: 4, service: 'interview', ago: '5 weeks ago', body: 'A tough mock interview, which was the point. I’d have liked a little more time on the case question.' },
    ]),
    standing: [
      { community: 'chem-pharma', rank: 1 },
      { community: 'cro-rnd', rank: 1 },
      { community: 'newcomers-science', rank: 2 },
    ],
    paid: { days: [2, 4], hours: [18, 19, 20], label: 'Tuesday and Thursday evenings' },
  },
  tomas: {
    since: 2020,
    experience: 'Eighteen years: an MSc, a PhD, a postdoc and ten years in medicinal chemistry. Hires for Kestrel’s discovery team.',
    expertise: ['The PhD decision', 'Choosing a PhD lab', 'Medicinal chemistry', 'Postdoc or industry', 'The principal scientist track'],
    services: svc('tomas', [
      { kind: 'call', title: '1:1 call', blurb: 'The PhD question, weighed with someone who took the long road.', minutes: 45, price: 95, per: 'session' },
      { kind: 'mentorship', title: 'Mentorship through the PhD decision', blurb: 'Two calls a month and messages in between, until you’ve decided.', minutes: 45, price: 240, per: 'month' },
      { kind: 'interview', title: 'Medicinal chemistry interview prep', blurb: 'Synthesis problems and a mock panel, the way Kestrel runs them.', minutes: 60, price: 120, per: 'session' },
      { kind: 'workshop', title: 'Workshop: Is the PhD worth it for pharma?', blurb: 'Five years of stipend against salary, side by side, and what the numbers leave out.', minutes: 90, price: 35, per: 'seat', seats: 30 },
    ]),
    rating: 4.8,
    reviewCount: 71,
    followers: 2310,
    reviews: rev('tomas', [
      { author: 'jonah', rating: 5, service: 'mentorship', ago: '2 weeks ago', body: 'Tomás didn’t tell me what to do. He showed me what each road cost him and let me do the maths.' },
      { author: 'nikhil', rating: 5, service: 'workshop', ago: '1 month ago', body: 'His spreadsheet of stipend versus salary is now pinned above my desk.' },
      { author: 'paul', rating: 4, service: 'call', ago: '3 months ago', body: 'Direct and generous. I wish I’d booked before accepting my lab, not after.' },
    ]),
    standing: [
      { community: 'phd-question', rank: 1 },
      { community: 'chem-pharma', rank: 2 },
    ],
    paid: { days: [1, 3], hours: [19, 20], label: 'Monday and Wednesday evenings' },
  },
  mei: {
    since: 2022,
    experience: 'Leads discovery chemistry at Meridian and has hired more than forty scientists.',
    expertise: ['Hiring in discovery chemistry', 'Reading job postings', 'Your first 90 days', 'MSc or PhD hiring', 'Offer negotiation'],
    services: svc('mei', [
      { kind: 'resume', title: 'Résumé review from a hiring manager', blurb: 'What I’d circle, what I’d skip, and what would get you a call.', price: 75, per: 'review', delivery: 'Written notes within 5 days' },
      { kind: 'interview', title: 'Mock interview with a hiring manager', blurb: 'The questions I ask, asked the way I ask them, with a debrief.', minutes: 60, price: 130, per: 'session' },
      { kind: 'call', title: '1:1 call', blurb: 'Hiring, offers and your first ninety days, from the other side of the table.', minutes: 30, price: 90, per: 'session' },
      { kind: 'workshop', title: 'Workshop: What hiring managers read first', blurb: 'Real (anonymised) résumés, read live, with the six seconds explained.', minutes: 90, price: 40, per: 'seat', seats: 30 },
    ]),
    rating: 4.9,
    reviewCount: 58,
    followers: 3120,
    reviews: rev('mei', [
      { author: 'aisha', rating: 5, service: 'interview', ago: '1 month ago', body: 'Mei asked the question I’d been dreading and then taught me how to answer it. I got the offer.' },
      { author: 'ethan', rating: 5, service: 'resume', ago: '2 weeks ago', body: 'Reading my résumé through a hiring manager’s eyes was humbling and incredibly useful.' },
      { author: 'leila', rating: 4, service: 'workshop', ago: '5 weeks ago', body: 'Dense and practical. It ran over, which I didn’t mind.' },
    ]),
    standing: [
      { community: 'msc-industry', rank: 1 },
      { community: 'chem-pharma', rank: 3 },
      { community: 'phd-question', rank: 3 },
    ],
    paid: { days: [3, 5], hours: [12, 13], label: 'Wednesday and Friday lunchtimes' },
  },
  priya: {
    since: 2023,
    experience: 'Went straight from an MSc into process chemistry four years ago, after an undergraduate internship.',
    expertise: ['MSc to industry', 'Process chemistry', 'Scale-up', 'Safety interviews', 'Internships'],
    services: svc('priya', [
      { kind: 'call', title: '1:1 call', blurb: 'Whether process chemistry is for you, from someone who skipped the PhD.', minutes: 30, price: 45, per: 'session' },
      { kind: 'resume', title: 'Résumé review', blurb: 'One page, industry-ready, with nothing that matters cut.', price: 40, per: 'review', delivery: 'Written notes within 2 days' },
      { kind: 'interview', title: 'Scale-up and safety interview prep', blurb: 'The process safety questions that catch MSc graduates out.', minutes: 45, price: 70, per: 'session' },
    ]),
    rating: 4.9,
    reviewCount: 19,
    followers: 540,
    reviews: rev('priya', [
      { author: 'sarah', rating: 5, service: 'call', ago: '1 week ago', body: 'Priya made process chemistry sound like a real option instead of a fallback. It’s now my first choice.' },
      { author: 'wei', rating: 5, service: 'resume', ago: '6 weeks ago', body: 'Fast, specific notes. She cut my résumé to one page without losing anything that mattered.' },
    ]),
    standing: [
      { community: 'msc-industry', rank: 2 },
      { community: 'chem-pharma', rank: 6 },
      { community: 'phd-question', rank: 2 },
    ],
    paid: { days: [2], hours: [19, 20], label: 'Tuesday evenings' },
  },
  grace: {
    since: 2022,
    experience: 'Three years in QC, then an internal move into analytical R&D without a graduate degree.',
    expertise: ['QC to R&D', 'R&D without a graduate degree', 'Internal moves', 'Analytical R&D', 'Newcomers in science'],
    services: svc('grace', [
      { kind: 'call', title: '1:1 call', blurb: 'Getting from QC into R&D, and getting noticed on the way.', minutes: 45, price: 55, per: 'session' },
      { kind: 'resume', title: 'Résumé review', blurb: 'How to write QC work so an R&D manager reads it as R&D.', price: 45, per: 'review', delivery: 'Written notes within 3 days' },
      { kind: 'group', title: 'Small group: From QC into R&D', blurb: 'Ten people, one hour, the internal move explained step by step.', minutes: 60, price: 20, per: 'seat', seats: 10 },
    ]),
    rating: 5.0,
    reviewCount: 33,
    followers: 860,
    reviews: rev('grace', [
      { author: 'analucia', rating: 5, service: 'call', ago: '2 weeks ago', body: 'Grace understood the newcomer part without me explaining it. That alone was worth the call.' },
      { author: 'chloe', rating: 5, service: 'resume', ago: '1 month ago', body: 'She showed me how to write QC work so an R&D manager reads it as R&D.' },
      { author: 'isabel', rating: 5, service: 'group', ago: '3 weeks ago', body: 'Ten of us, one hour, and every question answered. I’ve booked the next one.' },
    ]),
    standing: [
      { community: 'newcomers-science', rank: 1 },
      { community: 'chem-pharma', rank: 4 },
    ],
    paid: { days: [0, 6], hours: [10, 11, 13], label: 'Weekends' },
  },
  rafael: {
    since: 2023,
    experience: 'Turned a four-month internship into a Scientist II role at Kestrel.',
    expertise: ['Industry internships', 'Associate Scientist interviews', 'Your first offer', 'MSc to industry'],
    services: svc('rafael', [
      { kind: 'call', title: '1:1 call', blurb: 'Landing the internship, and turning it into the job.', minutes: 45, price: 50, per: 'session' },
      { kind: 'interview', title: 'Associate Scientist interview prep', blurb: 'The interview I had at Kestrel, run for you, with notes after.', minutes: 45, price: 65, per: 'session' },
      { kind: 'resume', title: 'Internship application review', blurb: 'Your résumé and cover note, read for an internship panel.', price: 35, per: 'review', delivery: 'Written notes within 3 days' },
    ]),
    rating: 4.8,
    reviewCount: 24,
    followers: 610,
    reviews: rev('rafael', [
      { author: 'ethan', rating: 5, service: 'interview', ago: '4 weeks ago', body: 'The mock interview was nearly word for word what I was asked a week later.' },
      { author: 'olivia', rating: 4, service: 'call', ago: '2 months ago', body: 'Great on internships. Less on the PhD question, which he said up front.' },
    ]),
    standing: [
      { community: 'msc-industry', rank: 3 },
      { community: 'chem-pharma', rank: 5 },
    ],
    paid: { days: [0, 6], hours: [11, 12], label: 'Weekends' },
  },
  hannah: {
    since: 2021,
    experience: 'Five years in regulatory affairs after three in QC. Manages a team of four at Halden.',
    expertise: ['Bench to Regulatory Affairs', 'The RAC certification', 'Regulatory writing', 'QC to RA'],
    services: svc('hannah', [
      { kind: 'call', title: '1:1 call', blurb: 'Whether regulatory affairs is for you, and how to get in from the bench.', minutes: 45, price: 70, per: 'session' },
      { kind: 'mentorship', title: 'Mentorship into regulatory affairs', blurb: 'Two calls a month while you make the switch, and edits on your applications.', minutes: 45, price: 180, per: 'month' },
      { kind: 'resume', title: 'RA résumé review', blurb: 'Reframing bench work as regulatory experience.', price: 50, per: 'review', delivery: 'Written notes within 4 days' },
      { kind: 'workshop', title: 'Workshop: A day in regulatory affairs', blurb: 'A real submission, walked through hour by hour.', minutes: 60, price: 30, per: 'seat', seats: 25 },
    ]),
    rating: 4.9,
    reviewCount: 29,
    followers: 720,
    reviews: rev('hannah', [
      { author: 'leila', rating: 5, service: 'mentorship', ago: '2 months ago', body: 'Three months of Hannah and I had an RA offer. She knew exactly which gaps mattered.' },
      { author: 'hana', rating: 5, service: 'call', ago: '3 weeks ago', body: 'She was honest that RA isn’t for everyone, and then helped me see it was for me.' },
      { author: 'lucas', rating: 5, service: 'workshop', ago: '1 week ago', body: 'I didn’t really know what RA was before the workshop. Now I have a plan for it.' },
    ]),
    standing: [
      { community: 'bench-regulatory', rank: 1 },
      { community: 'chem-pharma', rank: 8 },
    ],
    paid: { days: [1, 4], hours: [17, 18], label: 'Monday and Thursday after work' },
  },
  ruth: {
    since: 2020,
    experience: 'Forty years in pharma R&D, the last twenty-four leading it. Now advises young companies.',
    expertise: ['Whole R&D careers', 'Changing course mid-career', 'Leading in R&D', 'Which choices matter later'],
    services: svc('ruth', [
      { kind: 'call', title: 'A career conversation', blurb: 'An hour on the whole arc, and where your next choice sits in it.', minutes: 60, price: 150, per: 'session' },
      { kind: 'mentorship', title: 'Mentorship', blurb: 'A monthly hour and messages between, for people stepping into leadership.', minutes: 60, price: 300, per: 'month' },
    ]),
    rating: 5.0,
    reviewCount: 22,
    followers: 1890,
    reviews: rev('ruth', [
      { author: 'paul', rating: 5, service: 'call', ago: '1 month ago', body: 'One hour with Ruth reframed the next ten years for me.' },
      { author: 'henrik', rating: 5, service: 'mentorship', ago: '3 months ago', body: 'Ruth has seen every version of the decision I’m making. It shows.' },
    ]),
    standing: [
      { community: 'chem-pharma', rank: 7 },
      { community: 'phd-question', rank: 4 },
    ],
    paid: { days: [2, 3, 4], hours: [10, 14], label: 'Weekdays, by arrangement' },
  },
  karim: {
    since: 2022,
    experience: 'A chemist turned ML lead: two years as a data analyst, four in data science for drug discovery.',
    expertise: ['Python for chemists', 'Bench to data science', 'Building a portfolio', 'ML in drug discovery'],
    services: svc('karim', [
      { kind: 'portfolio', title: 'Portfolio review', blurb: 'Your notebooks and projects, reviewed for data roles in pharma.', price: 65, per: 'review', delivery: 'A recorded walkthrough within 5 days' },
      { kind: 'call', title: '1:1 call', blurb: 'How much Python you really need, and what to build first.', minutes: 45, price: 75, per: 'session' },
      { kind: 'mentorship', title: 'Mentorship from bench to data', blurb: 'A project a month, reviewed, with two calls.', minutes: 45, price: 220, per: 'month' },
      { kind: 'workshop', title: 'Workshop: Python for bench chemists', blurb: 'Your own plate-reader data, cleaned and plotted in two hours.', minutes: 120, price: 45, per: 'seat', seats: 20 },
    ]),
    rating: 4.8,
    reviewCount: 37,
    followers: 1450,
    reviews: rev('karim', [
      { author: 'wei', rating: 5, service: 'portfolio', ago: '2 weeks ago', body: 'His walkthrough of my notebooks told me exactly what to cut and what to build next.' },
      { author: 'isabel', rating: 5, service: 'workshop', ago: '1 month ago', body: 'The first Python lesson that started from a lab notebook instead of a textbook.' },
      { author: 'owen', rating: 4, service: 'call', ago: '6 weeks ago', body: 'Useful and specific. Book the portfolio review first if you already have projects.' },
    ]),
    standing: [
      { community: 'lab-data', rank: 1 },
      { community: 'chem-pharma', rank: 9 },
    ],
    paid: { days: [5], hours: [12, 13, 17], label: 'Fridays' },
  },
  marcus: {
    since: 2021,
    experience: 'Seven years as an engineer and tech lead, then an internal move into product. Now a group PM.',
    expertise: ['Engineering to PM', 'Internal transfers', 'PM interviews', 'Your first PM review'],
    services: svc('marcus', [
      { kind: 'call', title: '1:1 call', blurb: 'Making the internal switch without starting over.', minutes: 45, price: 90, per: 'session' },
      { kind: 'interview', title: 'PM interview prep', blurb: 'Product sense and execution, mocked hard, debriefed kindly.', minutes: 60, price: 120, per: 'session' },
      { kind: 'resume', title: 'Résumé review for PM roles', blurb: 'Turning shipped code into product outcomes.', price: 55, per: 'review', delivery: 'Written notes within 3 days' },
      { kind: 'group', title: 'Small group: Engineers moving into PM', blurb: 'Eight engineers, one hour, four plans made concrete.', minutes: 60, price: 30, per: 'seat', seats: 8 },
    ]),
    rating: 4.7,
    reviewCount: 64,
    followers: 2780,
    reviews: rev('marcus', [
      { author: 'joon', rating: 5, service: 'interview', ago: '3 weeks ago', body: 'His product-sense mock was harder than the real one. That’s a compliment.' },
      { author: 'mai', rating: 4, service: 'call', ago: '1 month ago', body: 'Clear advice on the internal switch. We ran out of time for my résumé.' },
      { author: 'sam', rating: 5, service: 'group', ago: '2 weeks ago', body: 'Hearing three other engineers’ plans made mine feel doable.' },
    ]),
    standing: [{ community: 'swe-pm', rank: 1 }],
    paid: { days: [1, 3], hours: [8, 18], label: 'Monday and Wednesday, mornings or evenings' },
  },
  claire: {
    since: 2022,
    experience: 'Seven years teaching grade six, then a certificate and three years in UX research.',
    expertise: ['Teaching to UX research', 'Research portfolios', 'Whether you need a certificate', 'Your first research role'],
    services: svc('claire', [
      { kind: 'portfolio', title: 'Research portfolio review', blurb: 'Finding the research in your teaching, and showing it.', price: 60, per: 'review', delivery: 'Written notes and a call-out list within 4 days' },
      { kind: 'call', title: '1:1 call', blurb: 'Leaving the classroom for research, honestly.', minutes: 45, price: 55, per: 'session' },
      { kind: 'workshop', title: 'Workshop: Your classroom is a research lab', blurb: 'Lesson plans rewritten as research studies, live.', minutes: 90, price: 25, per: 'seat', seats: 30 },
    ]),
    rating: 4.9,
    reviewCount: 41,
    followers: 1320,
    reviews: rev('claire', [
      { author: 'jamal', rating: 5, service: 'portfolio', ago: '1 week ago', body: 'Claire found three research projects in my teaching I’d never have called research.' },
      { author: 'sofia', rating: 5, service: 'workshop', ago: '1 month ago', body: 'Practical, kind, and very specific about what hiring teams want.' },
    ]),
    standing: [{ community: 'teach-ux', rank: 1 }],
    paid: { days: [2, 4], hours: [19, 20], label: 'Tuesday and Thursday evenings' },
  },
  rosa: {
    since: 2021,
    experience: 'Eight years as an ICU nurse, three in clinical informatics, and now a product manager in health tech.',
    expertise: ['Nursing to health tech', 'Clinical informatics', 'Working with engineers', 'Health tech PM interviews'],
    services: svc('rosa', [
      { kind: 'call', title: '1:1 call', blurb: 'Leaving the bedside without leaving care.', minutes: 45, price: 60, per: 'session' },
      { kind: 'mentorship', title: 'Mentorship into health tech', blurb: 'Two calls a month through the informatics bridge.', minutes: 45, price: 160, per: 'month' },
      { kind: 'interview', title: 'Health tech PM interview prep', blurb: 'Clinical experience, told in product language.', minutes: 45, price: 80, per: 'session' },
    ]),
    rating: 4.9,
    reviewCount: 26,
    followers: 940,
    reviews: rev('rosa', [{ author: 'arjun', rating: 5, service: 'call', ago: '2 weeks ago', body: 'Rosa translated my ICU experience into product language in forty-five minutes.' }]),
    standing: [{ community: 'nursing-healthtech', rank: 1 }],
    paid: { days: [6], hours: [11, 12, 13], label: 'Saturdays' },
  },
};
