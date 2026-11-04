import { naturePhotographs } from './natureCollection';
import { MAIN_GALLERY } from '../world/galleryLayout';

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
    portrait: 'images/mother/portrait.jpeg',
    portraitIsPlaceholder: false,
    welcome:
      'In loving memory of Puja Anand. This museum honours her life and the love she shared, on what would have been her 50th birthday. A quiet place to remember her, together.',
    tributeHeading: 'THE ONENESS',
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
  rotation: number,
  sourceWidth: number,
  sourceHeight: number,
  description: string,
): Photograph => {
  const fit = Math.min(3.4 / sourceWidth, 3.5 / sourceHeight);
  return {
    id,
    room,
    title,
    image,
    description,
    placeholder: false,
    placement: { position, rotation, width: sourceWidth * fit, height: sourceHeight * fit },
  };
};
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
  placement: { position, rotation, width: (3.5 * 1529) / 2030, height: 3.5 },
  featured: true,
  placeholder: museumContent.mother.portraitIsPlaceholder,
});

export const photographs: Photograph[] = [
  portrait('welcome-portrait', 'entrance', [9.72, 3.5, 21], -Math.PI / 2),
  portrait('childhood-portrait', 'childhood', [-29.72, 3.3, 0], Math.PI / 2),
  makePhoto(
    'childhood-1',
    'childhood',
    'A Quiet Moment',
    'images/mother/image00005.jpeg',
    [-29.72, 3.3, -7],
    Math.PI / 2,
    1406,
    2015,
    'A photograph of Puja Anand, remembered with love.',
  ),
  makePhoto(
    'family-1',
    'family',
    'Together',
    'images/family/family.jpeg',
    [29.72, 3.3, -7],
    -Math.PI / 2,
    1080,
    1290,
    'A family photograph, held close in memory.',
  ),
  makePhoto(
    'family-2',
    'family',
    'Everyday Joy',
    'images/family/meAndMom.jpeg',
    [29.72, 3.3, 0],
    -Math.PI / 2,
    680,
    1011,
    'A shared moment with Puja Anand.',
  ),
  makePhoto(
    'family-3',
    'family',
    'A Day Together',
    'images/family/momAndBro.jpeg',
    [29.72, 3.3, 7],
    -Math.PI / 2,
    1600,
    1066,
    'A moment together in the snow.',
  ),
  makePhoto(
    'family-4',
    'family',
    'With Family',
    'images/family/momAndSisters.jpeg',
    [14, 3.3, -11.72],
    0,
    768,
    1024,
    'Family, closeness and a moment to remember.',
  ),
  makePhoto(
    'family-5',
    'family',
    'A Family Memory',
    'images/family/momBroMe.jpeg',
    [26, 3.3, -11.72],
    0,
    750,
    1334,
    'A treasured family photograph of Puja Anand with her loved ones.',
  ),
  // Available in the collection; the main tribute wall remains the unframed Ik Onkar.
  portrait('tribute-portrait', 'sanctuary', [-20, 3.55, -29.63], 0),
  makePhoto(
    'gratitude-1',
    'sanctuary',
    'Harmandir Sahib',
    'images/theOneness/harmandirSahib.jpeg',
    [-29.72, 3.3, -21],
    Math.PI / 2,
    1088,
    1600,
    'Puja Anand at Harmandir Sahib.',
  ),
  portrait('remembrance-portrait', 'celebration', MAIN_GALLERY.portrait, 0),
  ...naturePhotographs,
];
export function assetUrl(path: string) {
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}
