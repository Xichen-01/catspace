import type { SVGProps } from 'react';

export type Glyph = 'orbit' | 'grid' | 'enter' | 'spark' | 'close' | 'arrow' | 'external' | 'back' | 'menu' | 'signal' | 'archive' | 'lab' | 'stars';
const paths: Record<Glyph, React.ReactNode> = {
  orbit: <><circle cx="12" cy="12" r="6.4" /><ellipse cx="12" cy="12" rx="11" ry="3.9" transform="rotate(-33 12 12)" /><circle cx="19" cy="5.5" r="1.15" fill="currentColor" stroke="none" /></>,
  grid: <><rect x="4" y="4" width="6" height="6" rx=".9" /><rect x="14" y="4" width="6" height="6" rx=".9" /><rect x="4" y="14" width="6" height="6" rx=".9" /><rect x="14" y="14" width="6" height="6" rx=".9" /></>,
  enter: <><path d="M9 4H5a1 1 0 0 0-1 1v4m11-5h4a1 1 0 0 1 1 1v4m0 6v4a1 1 0 0 1-1 1h-4m-6 0H5a1 1 0 0 1-1-1v-4" /><circle cx="12" cy="12" r="3" /></>,
  spark: <path d="M12 2.5c.8 6.1 3.4 8.7 9.5 9.5-6.1.8-8.7 3.4-9.5 9.5-.8-6.1-3.4-8.7-9.5-9.5 6.1-.8 8.7-3.4 9.5-9.5Z" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
  external: <path d="M6 18 18 6M8 6h10v10" />,
  back: <path d="M20 12H5m6-6-6 6 6 6" />,
  menu: <path d="M4 8h16M4 16h16" />,
  signal: <><circle cx="12" cy="12" r="2" /><path d="M7.7 7.7a6.1 6.1 0 0 0 0 8.6m8.6-8.6a6.1 6.1 0 0 1 0 8.6M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14" /></>,
  archive: <><rect x="3.5" y="6" width="17" height="13" rx="1.5" /><path d="M7 6V4h10v2M10 11h4" /></>,
  lab: <path d="M9 3h6m-5 0v7l-5 7a2 2 0 0 0 1.6 3h10.8a2 2 0 0 0 1.6-3l-5-7V3M8 14h8" />,
  stars: <><path d="m4 16 5-9 6 4 5-6M9 7l4 12 7-14" /><circle cx="4" cy="16" r="1" /><circle cx="9" cy="7" r="1" /><circle cx="15" cy="11" r="1" /><circle cx="20" cy="5" r="1" /><circle cx="13" cy="19" r="1" /></>
};

export default function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: Glyph }) {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
