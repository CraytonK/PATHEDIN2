import { useApp } from '../lib/store';
import { ME, people } from '../data/people';
import type { Banner, BannerPreset } from '../data/types';
import { RouteSilk, silkPath } from './path/RouteSilk';
import './banner.css';

/*
  The background behind someone's photo, like a LinkedIn banner. Anyone can upload a photo of their own
  and frame it, or pick one of PathedIn's four, each drawn from the Path itself: the route silk, a line map
  of walked and future steps, the silk on paper, and the rings of a destination at first light.
*/

export const bannerPresets: { id: BannerPreset; label: string }[] = [
  { id: 'silk', label: 'Route silk' },
  { id: 'lines', label: 'Line map' },
  { id: 'paper', label: 'Paper' },
  { id: 'dawn', label: 'First light' },
];

export const defaultBanner: Banner = { kind: 'preset', id: 'silk' };

/** Someone's banner: yours as you've set it on this device, anyone else's as they chose it, or none. */
export function useBanner(id: string): Banner | null {
  const mine = useApp((s) => s.banner);
  if (id === ME) return mine ?? defaultBanner;
  const preset = people[id]?.banner;
  return preset ? { kind: 'preset', id: preset } : null;
}

export function BannerArt({ banner, className = '', still = false }: { banner: Banner; className?: string; still?: boolean }) {
  if (banner.kind === 'photo') {
    return (
      <div className={`banner banner--photo ${className}`}>
        <img
          src={banner.src}
          alt=""
          draggable={false}
          style={{
            objectPosition: `${banner.x}% ${banner.y}%`,
            transform: `scale(${banner.zoom})`,
            transformOrigin: `${banner.x}% ${banner.y}%`,
          }}
        />
      </div>
    );
  }
  const id = banner.id;
  return (
    <div className={`banner banner--${id} ${id === 'paper' ? '' : 'immersive'} ${className}`}>
      {id === 'silk' && (still ? <SilkStill /> : <RouteSilk lines={14} delay={0.1} />)}
      {id === 'lines' && <LineMap />}
      {id === 'paper' && <PaperSilk />}
      {id === 'dawn' && <FirstLight />}
    </div>
  );
}

/** The silk without its entrance, for small previews that shouldn't all draw at once. */
function SilkStill() {
  return (
    <svg className="banner__art" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      {Array.from({ length: 12 }, (_, i) => (
        <path key={i} d={silkPath(i, 12)} fill="none" stroke="#8fa8ff" strokeOpacity={i === 7 ? 0.9 : 0.35} strokeWidth={i === 7 ? 1.8 : 0.8} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

/** Four lines across the map: one walked to a ringed present and dashed on to an open destination, three quieter. */
function LineMap() {
  const quiet = [
    { d: 'M-20 70 H250 L310 110 H560 L620 70 H920', y: [70, 110, 110, 70], x: [120, 380, 500, 780] },
    { d: 'M-20 250 H180 L240 205 H470 L530 250 H920', y: [250, 205, 205, 250], x: [90, 300, 420, 700] },
    { d: 'M-20 190 H120 L170 150 H920', y: [190, 150, 150, 150], x: [60, 330, 610, 860] },
  ];
  return (
    <svg className="banner__art" viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      {quiet.map((l, i) => (
        <g key={i} opacity="0.3">
          <path d={l.d} fill="none" stroke="#fff7ed" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {l.x.map((x, j) => (
            <circle key={j} cx={x} cy={l.y[j]} r="5" fill="#fff7ed" />
          ))}
        </g>
      ))}
      <path d="M-20 130 H330 L380 95 H520" fill="none" stroke="#fff7ed" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M520 95 H700 L750 130 H830" fill="none" stroke="#8fa8ff" strokeWidth="4" strokeLinecap="round" strokeDasharray="0.5 11" />
      <circle cx="150" cy="130" r="7" fill="#fff7ed" />
      <circle cx="300" cy="130" r="7" fill="#fff7ed" />
      <circle cx="520" cy="95" r="11" fill="#0f172a" stroke="#fff7ed" strokeWidth="3.5" />
      <circle cx="520" cy="95" r="4.5" fill="#8fa8ff" />
      <circle cx="830" cy="130" r="11" fill="#0f172a" stroke="#8fa8ff" strokeWidth="4" />
    </svg>
  );
}

/** The silk drawn in ink on the page's own paper: the one light banner. */
function PaperSilk() {
  return (
    <svg className="banner__art" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      {Array.from({ length: 20 }, (_, i) => (
        <path key={i} d={silkPath(i, 20)} fill="none" stroke="currentColor" strokeOpacity={i === 12 ? 0.6 : 0.2} strokeWidth={i === 12 ? 1.8 : 1} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

/** A destination's open rings, lit from the right, with one dashed route arriving. */
function FirstLight() {
  return (
    <svg className="banner__art" viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      {[34, 80, 132, 190, 254, 324].map((r, i) => (
        <circle key={r} cx="760" cy="150" r={r} fill="none" stroke="#8fa8ff" strokeOpacity={0.5 - i * 0.07} strokeWidth={i === 0 ? 4 : 1.5} />
      ))}
      <path d="M-20 210 C 240 210, 420 150, 726 150" fill="none" stroke="#fff7ed" strokeOpacity="0.7" strokeWidth="3" strokeLinecap="round" strokeDasharray="0.5 10" />
    </svg>
  );
}
