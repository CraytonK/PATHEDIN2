import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { people, peopleList, ME } from '../../data/people';
import { relationTo, type RelationKind } from '../../lib/relations';
import { springs, useIsMobile } from '../../lib/motion';
import { usePeek } from '../Peek';
import { flyFrom } from '../../lib/flight';
import './lens.css';

/*
  Path Lens — your network, placed on your Path.
  Twins ride beside you, peers stand at your station, people ahead wait at your next step,
  Guides are already at your destination, explorers arrive from elsewhere.
*/

type Kind = Exclude<RelationKind, 'self' | 'other'>;

const stations = [
  { key: 'bsc', label: 'BSc Chemistry', x: 0.05 },
  { key: 'ra', label: 'Research', x: 0.21 },
  { key: 'msc', label: 'MSc Chemistry', x: 0.42, you: true },
  { key: 'next', label: 'Next step', x: 0.64, unknown: true },
  { key: 'dest', label: 'Pharmaceutical R&D', x: 0.88, dest: true },
];

function Face({ id, x, y, size, dim, delay }: { id: string; x: number; y: number; size: number; dim: boolean; delay: number }) {
  const handlers = usePeek(id);
  const navigate = useNavigate();
  // People arrive in sequence the first time; later filter changes respond immediately.
  const first = useRef(true);
  useEffect(() => {
    const t = setTimeout(() => (first.current = false), 1800);
    return () => clearTimeout(t);
  }, []);
  return (
    <motion.button
      className={`lens__face ${dim ? 'is-dim' : ''}`}
      style={{ left: x, top: y, width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }}
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: dim ? 0.18 : 1, scale: dim ? 0.86 : 1 }}
      whileHover={{ scale: 1.12, zIndex: 5 }}
      transition={{ ...springs.settle, delay: first.current ? delay : 0 }}
      data-portrait={id}
      onClick={(e) => {
        flyFrom(id, e.currentTarget);
        navigate(`/p/${id}`);
      }}
      aria-label={`${people[id].name}, ${relationTo(id).label}`}
      {...handlers}
    >
      <img src={people[id].photo} alt="" draggable={false} />
    </motion.button>
  );
}

export function PathLens({ filter, width }: { filter: Kind | 'all'; width: number }) {
  const isMobile = useIsMobile();
  const W = Math.max(width, isMobile ? 640 : 0);
  const size = isMobile ? 34 : 42;
  const gapX = size * 0.92;
  const gapY = size * 0.96;
  const lineY = isMobile ? 138 : 150;
  const downStart = lineY + (isMobile ? 58 : 64);
  const exploreY = downStart + gapY * 2 + (isMobile ? 26 : 30);
  const H = exploreY + (isMobile ? 48 : 52);

  const placed = useMemo(() => {
    const groups: Record<string, { kind: Kind; ids: string[] }> = {};
    const push = (slot: string, kind: Kind, id: string) => {
      groups[slot] ??= { kind, ids: [] };
      groups[slot].ids.push(id);
    };
    peopleList.forEach((p) => {
      if (p.id === ME) return;
      const r = relationTo(p.id);
      if (r.kind === 'twin') push('msc-up', 'twin', p.id);
      else if (r.kind === 'peer') push('msc-down', 'peer', p.id);
      else if (r.kind === 'ahead') push(r.label.startsWith('One') ? 'next-up' : 'dest-down', 'ahead', p.id);
      else if (r.kind === 'guide') push('dest-up', 'guide', p.id);
      else if (r.kind === 'explorer') push('explore', 'explorer', p.id);
      else if (r.kind === 'behind') push('ra-down', 'behind', p.id);
    });
    const out: { id: string; x: number; y: number; kind: Kind; order: number }[] = [];
    const captions: { x: number; y: number; text: string; kind: Kind }[] = [];
    const sx = (key: string) => stations.find((s) => s.key === key)!.x * W;
    const names: Record<Kind, string> = { twin: 'Path Twin', peer: 'Path Peers', ahead: 'People Ahead', guide: 'Path Guides', explorer: 'Path Explorers', behind: 'Following you' };
    Object.entries(groups).forEach(([slot, g]) => {
      const [st, dir] = slot.split('-');
      if (slot === 'explore') {
        g.ids.forEach((id, i) => out.push({ id, x: W * (0.1 + i * 0.1), y: exploreY, kind: g.kind, order: 6 + i }));
        captions.push({ x: W * 0.1 - size / 2, y: exploreY + size / 2 + 18, text: `${names.explorer} · arriving from other starting points`, kind: g.kind });
        return;
      }
      const cols = st === 'dest' ? 4 : 3;
      const cx = sx(st);
      const rows = Math.ceil(g.ids.length / cols);
      g.ids.forEach((id, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const rowCount = Math.min(cols, g.ids.length - row * cols);
        const x = cx + (col - (rowCount - 1) / 2) * gapX;
        const y = dir === 'up' ? lineY - 44 - row * gapY : downStart + row * gapY;
        out.push({ id, x, y, kind: g.kind, order: stations.findIndex((s) => s.key === st) });
      });
      const slotNames: Record<string, string> = {
        'msc-up': g.ids.length > 1 ? 'Path Twins' : 'Path Twin',
        'msc-down': 'Path Peers',
        'next-up': 'One step ahead',
        'dest-up': 'Path Guides',
        'dest-down': 'Already there',
        'ra-down': 'Following you',
      };
      captions.push({
        x: cx,
        y: dir === 'up' ? lineY - 44 - (rows - 1) * gapY - size / 2 - 10 : downStart + (rows - 1) * gapY + size / 2 + 18,
        text: slotNames[slot] ?? names[g.kind],
        kind: g.kind,
      });
    });
    return { out, captions };
  }, [W, lineY, downStart, exploreY, size, gapX, gapY]);

  const sx = (key: string) => stations.find((s) => s.key === key)!.x * W;
  const you = sx('msc');
  const dest = sx('dest');

  return (
    <div className="lens" style={{ width: W, height: H }}>
      <svg className="lens__svg" width={W} height={H} aria-hidden="true">
        <motion.line x1={sx('bsc')} y1={lineY} x2={you} y2={lineY} stroke="var(--ink)" strokeWidth={3.5} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease: [0.45, 0, 0.2, 1] }} />
        <motion.line x1={you} y1={lineY} x2={dest} y2={lineY} stroke="var(--tint)" strokeWidth={3.5} strokeLinecap="round" strokeDasharray="5 8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.4 }} />
        <motion.path
          d={`M 0 ${exploreY} L ${W * 0.62} ${exploreY} C ${W * 0.76} ${exploreY} ${dest - 40} ${lineY + 30} ${dest} ${lineY}`}
          fill="none"
          stroke="var(--future-soft)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray="3 7"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        />
        {placed.captions.map((c) => (
          <motion.text
            key={c.text}
            x={c.x}
            y={c.y}
            textAnchor={c.kind === 'explorer' ? 'start' : 'middle'}
            className="lens__caption"
            initial={{ opacity: 0 }}
            animate={{ opacity: filter === 'all' || filter === c.kind ? 1 : 0.25 }}
            transition={{ duration: 0.25 }}
          >
            {c.text}
          </motion.text>
        ))}
        {stations.map((s, i) => {
          const x = s.x * W;
          return (
            <g key={s.key}>
              <motion.circle
                cx={x}
                cy={lineY}
                r={s.you ? 11 : s.dest ? 11 : 7.5}
                fill={s.you || s.dest || s.unknown ? 'var(--bg)' : 'var(--ink)'}
                stroke={s.dest || s.unknown ? 'var(--tint)' : s.you ? 'var(--ink)' : 'var(--bg-grouped)'}
                strokeWidth={s.you || s.dest ? 3.5 : 3}
                strokeDasharray={s.unknown ? '3 3' : undefined}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ ...springs.settle, delay: 0.1 + i * 0.1 }}
              />
              {s.you && <circle cx={x} cy={lineY} r={4} fill="var(--tint)" />}
              <text x={x} y={lineY + (s.key === 'ra' || s.key === 'next' ? -16 : 30)} textAnchor="middle" className={`lens__label ${s.you ? 'is-you' : ''}`} opacity={s.key === 'ra' || s.key === 'next' ? 0 : 1}>
                {s.you ? 'You · MSc Chemistry' : s.label}
              </text>
            </g>
          );
        })}
        <text x={sx('ra')} y={lineY + 30} textAnchor="middle" className="lens__label">
          Research
        </text>
        <text x={sx('next')} y={lineY + 30} textAnchor="middle" className="lens__label">
          Your next step
        </text>
      </svg>
      {placed.out.map((p) => (
        <Face key={p.id} id={p.id} x={p.x} y={p.y} size={size} dim={filter !== 'all' && filter !== p.kind} delay={0.5 + p.order * 0.12 + (p.id.charCodeAt(0) % 5) * 0.03} />
      ))}
    </div>
  );
}
