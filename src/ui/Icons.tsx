export type IconName =
  | 'arrow'
  | 'map'
  | 'close'
  | 'sound'
  | 'muted'
  | 'expand'
  | 'menu'
  | 'home'
  | 'help'
  | 'play'
  | 'pause'
  | 'chevron'
  | 'image'
  | 'sun'
  | 'mouse';
const paths: Record<IconName, string> = {
  arrow: 'M4 12h15m-6-6 6 6-6 6',
  map: 'm3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16',
  close: 'm6 6 12 12M6 18 18 6',
  sound: 'm11 5-6 4H2v6h3l6 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
  muted: 'm11 5-6 4H2v6h3l6 4V5Zm5 4 6 6m-6 0 6-6',
  expand: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',
  menu: 'M4 8h16M4 16h16',
  home: 'm3 10 9-7 9 7v10h-6v-7H9v7H3V10Z',
  help: 'M9.5 8a2.5 2.5 0 1 1 3.5 2.3c-1 .4-1 1.7-1 2.7m0 3v.1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  play: 'm8 4 12 8-12 8V4Z',
  pause: 'M8 5v14M16 5v14',
  chevron: 'm9 5 7 7-7 7',
  image: 'M3 3h18v18H3V3Zm0 13 6-6 5 5 3-3 4 4M16 7h.01',
  sun: 'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  mouse: 'M12 3a6 6 0 0 0-6 6v6a6 6 0 0 0 12 0V9a6 6 0 0 0-6-6Zm0 0v6',
};
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.45"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
export function SeahorseMark() {
  return (
    <svg
      width="31"
      height="43"
      viewBox="0 0 42 58"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M25 8C14 5 9 13 14 21l8 12c6 9 2 17-6 16-7-1-8-9-2-11 3-1 5 1 4 3M23 10l10 8-12-1M13 15l-5 6M17 27l-8 5" />
      <circle cx="22" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}
