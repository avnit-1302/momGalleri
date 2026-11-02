export type RoomId = 'entrance' | 'atrium' | 'childhood' | 'family' | 'sanctuary' | 'celebration';
export type Vec3 = [number, number, number];
export interface Photograph {
  id: string;
  image: string;
  title: string;
  description: string;
  room: RoomId;
  placement: { position: Vec3; rotation: number; width: number; height: number };
  year?: string;
  video?: string;
  featured?: boolean;
  placeholder?: boolean;
}

// All paths are relative to public/. One portrait is reused in three rooms.
// Replace the placeholder paths, then set placeholder: false on your photographs.
export const museumContent = {
  mother: {
    name: 'Mamma',
    age: 50,
    portrait: 'images/mother/portrait.svg',
    portraitIsPlaceholder: true,
    welcome:
      'Et sted for alt du er, og alt vi er takknemlige for. Velkommen til din helt egen bursdagsutstilling.',
    tributeHeading: 'Hjertet i familien vår',
    tribute:
      'For omsorgen du gir. For varmen du deler. For alle de små øyeblikkene som betyr så mye. Dette rommet er til deg, med kjærlighet og takknemlighet.',
    ending:
      'Takk for alt du er. Vi gleder oss til alle minnene vi ennå skal skape sammen. Gratulerer med 50-årsdagen, mamma.',
  },
  exhibitionTitle: '50 Years of Love & Memories',
  celebrationTitle: 'Happy 50th Birthday',
  // Optional local MP4/WebM, e.g. 'videos/bursdagshilsen.mp4'. No third-party embeds.
  celebrationVideo: '',
};

const makePhoto = (
  id: string,
  room: RoomId,
  title: string,
  image: string,
  position: Vec3,
  rotation = 0,
  width = 2.5,
  height = 2,
): Photograph => ({
  id,
  room,
  title,
  image,
  placement: { position, rotation, width, height },
  placeholder: true,
  description:
    'Her er det plass til deres eget fotografi og en personlig historie. Dette naturmotivet er et eksempelbilde, ikke et familieminne.',
});
const portrait = (id: string, room: RoomId, position: Vec3, rotation: number): Photograph => ({
  id,
  room,
  image: museumContent.mother.portrait,
  title: museumContent.mother.name,
  description:
    room === 'sanctuary'
      ? museumContent.mother.tribute
      : room === 'celebration'
        ? museumContent.mother.ending
        : museumContent.mother.welcome,
  placement: { position, rotation, width: 2.6, height: 3.5 },
  featured: true,
  placeholder: museumContent.mother.portraitIsPlaceholder,
});

export const photographs: Photograph[] = [
  portrait('welcome-portrait', 'entrance', [9.72, 3.5, 21], -Math.PI / 2),
  makePhoto(
    'childhood-1',
    'childhood',
    'De første kapitlene',
    'images/childhood/meadow.svg',
    [-29.72, 3.2, -7],
    Math.PI / 2,
  ),
  makePhoto(
    'childhood-2',
    'childhood',
    'Små øyeblikk',
    'images/childhood/forest.svg',
    [-29.72, 3.2, 0],
    Math.PI / 2,
    2.7,
    3.3,
  ),
  makePhoto(
    'childhood-3',
    'childhood',
    'En verden å oppdage',
    'images/childhood/meadow.svg',
    [-29.72, 3.2, 7],
    Math.PI / 2,
  ),
  makePhoto(
    'childhood-4',
    'childhood',
    'Et minne å ta vare på',
    'images/family/coast.svg',
    [-14, 3.2, -11.72],
    0,
    3,
    2.3,
  ),
  makePhoto(
    'family-1',
    'family',
    'Sammen',
    'images/family/coast.svg',
    [29.72, 3.3, -7],
    -Math.PI / 2,
    3.4,
    2.6,
  ),
  makePhoto(
    'family-2',
    'family',
    'Hverdagslykke',
    'images/childhood/forest.svg',
    [29.72, 3.3, 0],
    -Math.PI / 2,
  ),
  makePhoto(
    'family-3',
    'family',
    'Nære og kjære',
    'images/childhood/meadow.svg',
    [29.72, 3.3, 7],
    -Math.PI / 2,
    2.4,
    3,
  ),
  makePhoto(
    'family-4',
    'family',
    'Et sted å høre til',
    'images/celebration/sunlight.svg',
    [14, 3.2, -11.72],
    0,
  ),
  portrait('tribute-portrait', 'sanctuary', [-20, 3.55, -29.63], 0),
  makePhoto(
    'gratitude-1',
    'sanctuary',
    'Med takknemlighet',
    'images/childhood/meadow.svg',
    [-29.72, 3.2, -21],
    Math.PI / 2,
    2.4,
    2.4,
  ),
  portrait('birthday-portrait', 'celebration', [10, 3.5, -29.63], 0),
  makePhoto(
    'celebration-1',
    'celebration',
    'Flere gode øyeblikk',
    'images/celebration/sunlight.svg',
    [2, 3.2, -29.72],
    0,
    3.2,
    2.4,
  ),
  makePhoto(
    'celebration-2',
    'celebration',
    'Alt vi har foran oss',
    'images/family/coast.svg',
    [18, 3.2, -29.72],
    0,
    3.2,
    2.4,
  ),
  makePhoto(
    'celebration-3',
    'celebration',
    'En hilsen til deg',
    'images/celebration/sunlight.svg',
    [29.72, 3.3, -22],
    -Math.PI / 2,
    3,
    2.25,
  ),
];

export function assetUrl(path: string) {
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}
