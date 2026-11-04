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
    name: 'Puja Anand',
    commemorativeBirthday: 50,
    portrait: 'images/mother/portrait.svg',
    portraitIsPlaceholder: true,
    welcome:
      'In loving memory of Puja Anand. This museum honours her life and the love she shared, on what would have been her 50th birthday. A quiet place to remember her, together.',
    tributeHeading: 'The Heart of Our Family',
    tribute:
      'We remember Puja Anand with love and gratitude: for the care she gave, the warmth she shared, and the moments we hold close. Her memory remains in the hearts of those who loved her.',
    ending:
      'On what would have been her 50th birthday, we remember Puja Anand with love. We treasure the time we shared and carry her memory with us. Always loved. Forever remembered.',
  },
  exhibitionTitle: 'In Loving Memory of Puja Anand',
  celebrationTitle: 'Forever Remembered',
  // Optional local MP4/WebM, e.g. 'videos/remembering-puja.mp4'. No third-party embeds.
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
    'A place for your own photograph and a personal memory of Puja Anand. This nature illustration is a placeholder, not a family photograph.',
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
    'The First Chapters',
    'images/childhood/meadow.svg',
    [-29.72, 3.2, -7],
    Math.PI / 2,
  ),
  makePhoto(
    'childhood-2',
    'childhood',
    'Little Moments',
    'images/childhood/forest.svg',
    [-29.72, 3.2, 0],
    Math.PI / 2,
    2.7,
    3.3,
  ),
  makePhoto(
    'childhood-3',
    'childhood',
    'A World to Discover',
    'images/childhood/meadow.svg',
    [-29.72, 3.2, 7],
    Math.PI / 2,
  ),
  makePhoto(
    'childhood-4',
    'childhood',
    'A Memory to Treasure',
    'images/family/coast.svg',
    [-14, 3.2, -11.72],
    0,
    3,
    2.3,
  ),
  makePhoto(
    'family-1',
    'family',
    'Together',
    'images/family/coast.svg',
    [29.72, 3.3, -7],
    -Math.PI / 2,
    3.4,
    2.6,
  ),
  makePhoto(
    'family-2',
    'family',
    'Everyday Joy',
    'images/childhood/forest.svg',
    [29.72, 3.3, 0],
    -Math.PI / 2,
  ),
  makePhoto(
    'family-3',
    'family',
    'Those We Hold Dear',
    'images/childhood/meadow.svg',
    [29.72, 3.3, 7],
    -Math.PI / 2,
    2.4,
    3,
  ),
  makePhoto(
    'family-4',
    'family',
    'A Place to Belong',
    'images/celebration/sunlight.svg',
    [14, 3.2, -11.72],
    0,
  ),
  portrait('tribute-portrait', 'sanctuary', [-20, 3.55, -29.63], 0),
  makePhoto(
    'gratitude-1',
    'sanctuary',
    'With Gratitude',
    'images/childhood/meadow.svg',
    [-29.72, 3.2, -21],
    Math.PI / 2,
    2.4,
    2.4,
  ),
  portrait('remembrance-portrait', 'celebration', [10, 3.5, -29.63], 0),
  makePhoto(
    'celebration-1',
    'celebration',
    'Treasured Moments',
    'images/celebration/sunlight.svg',
    [2, 3.2, -29.72],
    0,
    3.2,
    2.4,
  ),
  makePhoto(
    'celebration-2',
    'celebration',
    'The Love She Left With Us',
    'images/family/coast.svg',
    [18, 3.2, -29.72],
    0,
    3.2,
    2.4,
  ),
  makePhoto(
    'celebration-3',
    'celebration',
    'Remembering Puja Anand',
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
