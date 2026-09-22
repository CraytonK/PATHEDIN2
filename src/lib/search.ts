import { peopleList, ME } from '../data/people';
import { communityList } from '../data/communities';
import { questionList } from '../data/questions';
import { storyList } from '../data/stories';
import { destinationList } from '../data/destinations';
import { wp } from '../data/waypoints';

export type Result =
  | { type: 'destination'; id: string; title: string; sub: string; href: string }
  | { type: 'person'; id: string; title: string; sub: string; href: string }
  | { type: 'community'; id: string; title: string; sub: string; href: string }
  | { type: 'question'; id: string; title: string; sub: string; href: string }
  | { type: 'story'; id: string; title: string; sub: string; href: string };

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

const aliases: Record<string, string[]> = {
  'pharma-rnd': ['pharma', 'drug discovery', 'r&d', 'rnd', 'pharmaceutical'],
  pm: ['product', 'product manager', 'pm'],
  'ux-research': ['ux', 'user research', 'design research'],
  'data-sci': ['data', 'machine learning', 'ml', 'python'],
  'reg-affairs': ['regulatory', 'ra', 'submissions'],
  'health-pm': ['health tech', 'healthcare', 'digital health'],
  'process-chem': ['process', 'scale-up', 'kilo lab'],
  medchem: ['medicinal', 'med chem', 'discovery chemistry'],
};

export function search(q: string): Result[] {
  const n = norm(q.trim());
  if (!n) return [];
  const has = (s: string) => norm(s).includes(n);
  const out: Result[] = [];
  for (const d of destinationList) {
    const w = wp(d.wp);
    if (has(w.label) || (aliases[d.wp] ?? []).some((a) => norm(a).includes(n) || n.includes(norm(a))))
      out.push({ type: 'destination', id: d.wp, title: w.label, sub: `${d.routes.length} ${d.routes.length === 1 ? 'route' : 'routes'} · ${d.people.toLocaleString('en-CA')} people there`, href: `/discover?to=${d.wp}` });
  }
  for (const p of peopleList)
    if (p.id !== ME && (has(p.name) || has(p.headline) || p.path.some((s) => has(s.org ?? ''))))
      out.push({ type: 'person', id: p.id, title: p.name, sub: p.headline, href: `/p/${p.id}` });
  for (const c of communityList)
    if (has(c.title) || has(c.description)) out.push({ type: 'community', id: c.id, title: c.title, sub: `${c.members.toLocaleString('en-CA')} on this journey`, href: `/c/${c.id}` });
  for (const qn of questionList) if (has(qn.title)) out.push({ type: 'question', id: qn.id, title: qn.title, sub: `${qn.answers.length} answers from people who’ve been there`, href: `/questions/${qn.id}` });
  for (const s of storyList) if (has(s.title) || has(s.dek)) out.push({ type: 'story', id: s.id, title: s.title, sub: `Story · ${s.minutes} min`, href: `/stories/${s.id}` });
  return out;
}

export const suggestions = ['Pharmaceutical R&D', 'Regulatory Affairs', 'Product Management', 'UX Research', 'Data Science'];
