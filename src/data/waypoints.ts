import type { Waypoint } from './types';

const list: Waypoint[] = [
  // Chemistry → pharma
  { id: 'bsc-chem', label: 'BSc Chemistry', short: 'BSc Chem', kind: 'study', field: 'chem' },
  { id: 'bsc-biochem', label: 'BSc Biochemistry', short: 'BSc Biochem', kind: 'study', field: 'chem' },
  { id: 'bsc-pharmacology', label: 'BSc Pharmacology', short: 'BSc Pharm', kind: 'study', field: 'chem' },
  { id: 'research-asst', mid: 'Research', label: 'Research Assistant', short: 'Research', kind: 'research', field: 'chem' },
  { id: 'lab-tech', mid: 'Lab Technician', label: 'Lab Technician', short: 'Lab Tech', kind: 'work', field: 'chem' },
  { id: 'msc-chem', label: 'MSc Chemistry', short: 'MSc Chem', kind: 'study', field: 'chem' },
  { id: 'msc-comp-chem', label: 'MSc Computational Chemistry', short: 'MSc Comp Chem', kind: 'study', field: 'chem' },
  { id: 'phd-chem', label: 'PhD Chemistry', short: 'PhD', kind: 'study', field: 'chem', destination: true },
  { id: 'postdoc', mid: 'Postdoc', label: 'Postdoctoral Fellow', short: 'Postdoc', kind: 'research', field: 'chem' },
  { id: 'industry-intern', mid: 'Industry Internship', label: 'Industry Research Internship', short: 'Internship', kind: 'work', field: 'chem' },
  { id: 'cro-analytical', mid: 'CRO Analytical Chemist', label: 'Analytical Chemist, CRO', short: 'CRO', kind: 'work', field: 'chem', destination: true },
  { id: 'qc-chemist', label: 'QC Chemist', short: 'QC', kind: 'work', field: 'chem', destination: true },
  { id: 'process-chem', label: 'Process Chemist', short: 'Process Chem', kind: 'work', field: 'chem', destination: true },
  { id: 'medchem', label: 'Medicinal Chemist', short: 'Med Chem', kind: 'work', field: 'chem', destination: true },
  { id: 'pharma-rnd', mid: 'Pharmaceutical R&D', label: 'Pharmaceutical R&D Scientist', short: 'Pharma R&D', kind: 'work', field: 'chem', destination: true },
  { id: 'senior-scientist', mid: 'Senior Scientist', label: 'Senior Scientist, R&D', short: 'Senior Scientist', kind: 'work', field: 'chem' },
  { id: 'principal-scientist', mid: 'Principal Scientist', label: 'Principal Scientist', short: 'Principal', kind: 'work', field: 'chem' },
  { id: 'rnd-lead', label: 'R&D Group Lead', short: 'Group Lead', kind: 'work', field: 'chem', destination: true },
  { id: 'reg-affairs', label: 'Regulatory Affairs', short: 'Regulatory', kind: 'work', field: 'policy', destination: true },
  { id: 'sci-policy', label: 'Science Policy', short: 'Policy', kind: 'work', field: 'policy', destination: true },
  { id: 'sci-writing', label: 'Science Writing', short: 'Writing', kind: 'work', field: 'writing', destination: true },
  { id: 'data-analyst', label: 'Data Analyst', short: 'Analyst', kind: 'work', field: 'data' },
  { id: 'data-sci', label: 'Data Scientist', short: 'Data Science', kind: 'work', field: 'data', destination: true },
  { id: 'bed', label: 'Bachelor of Education', short: 'BEd', kind: 'study', field: 'teaching' },
  { id: 'teacher', label: 'Teacher', short: 'Teaching', kind: 'work', field: 'teaching' },
  { id: 'ba', label: 'BA Psychology', short: 'BA Psych', kind: 'study', field: 'general' },
  // Software → product
  { id: 'bsc-cs', label: 'BSc Computer Science', short: 'BSc CS', kind: 'study', field: 'software' },
  { id: 'bootcamp', label: 'Coding Bootcamp', short: 'Bootcamp', kind: 'study', field: 'software' },
  { id: 'swe', label: 'Software Engineer', short: 'Engineer', kind: 'work', field: 'software' },
  { id: 'senior-swe', label: 'Senior Software Engineer', short: 'Senior Eng', kind: 'work', field: 'software' },
  { id: 'tech-lead', label: 'Tech Lead', short: 'Tech Lead', kind: 'work', field: 'software' },
  { id: 'apm', label: 'Associate Product Manager', short: 'APM', kind: 'work', field: 'software' },
  { id: 'pm', label: 'Product Manager', short: 'PM', kind: 'work', field: 'software', destination: true },
  { id: 'gpm', label: 'Group Product Manager', short: 'Group PM', kind: 'work', field: 'software' },
  // Teaching → UX research
  { id: 'ux-cert', label: 'UX Research Certificate', short: 'UX Cert', kind: 'study', field: 'teaching' },
  { id: 'ux-research', label: 'UX Researcher', short: 'UX Research', kind: 'work', field: 'teaching', destination: true },
  // Nursing → health tech
  { id: 'bscn', label: 'BSc Nursing', short: 'BScN', kind: 'study', field: 'health' },
  { id: 'rn', label: 'Registered Nurse', short: 'RN', kind: 'work', field: 'health' },
  { id: 'clin-informatics', label: 'Clinical Informatics', short: 'Informatics', kind: 'work', field: 'health' },
  { id: 'health-pm', label: 'Product Manager, Health Tech', short: 'Health PM', kind: 'work', field: 'health', destination: true },
  { id: 'advisor', label: 'Independent Advisor', short: 'Advisor', kind: 'work', field: 'general' },
  { id: 'unknown', label: 'Not decided yet', short: '?', kind: 'unknown', field: 'general' },
];

export const waypoints: Record<string, Waypoint> = Object.fromEntries(list.map((w) => [w.id, w]));

export function wp(id: string): Waypoint {
  return waypoints[id] ?? { id, label: id, short: id, kind: 'work', field: 'general' };
}
