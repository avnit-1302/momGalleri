import type { Photograph } from './museumContent';
import { natureSlots } from '../world/galleryLayout';

// Original files are kept intact, including signatures, borders and the shared post.
const works = [
  [
    'image00011.jpeg',
    'A Flower in Sunlight',
    720,
    960,
    'A small white flower catches the sunlight.',
  ],
  [
    'image00012.jpeg',
    'Ice and Light',
    960,
    539,
    'Light shines through the intricate surface of ice.',
  ],
  ['image00013.jpeg', 'Winter Sun', 960, 720, 'The winter sun above a snow-covered landscape.'],
  [
    'image00014.jpeg',
    'A Bridge in Monochrome',
    960,
    720,
    'A bridge and its reflections, photographed in black and white.',
  ],
  [
    'image00015.jpeg',
    'A Bridge at Blue Hour',
    960,
    720,
    'Warm lights trace a bridge against a deep blue sky.',
  ],
  [
    'image00016.jpeg',
    'Winter Stillness',
    960,
    720,
    'Bare branches and a quiet, snow-covered scene.',
  ],
  [
    'image00017.jpeg',
    'Sculpted by Ice',
    960,
    720,
    'A delicate formation of ice against winter blue.',
  ],
  [
    'image00018.jpeg',
    'A Tree in the Mist',
    960,
    720,
    'A solitary evergreen in a misty winter landscape.',
  ],
  [
    'image00019.jpeg',
    'Tracks into the Light',
    960,
    720,
    'Tracks in the snow lead towards the low sun.',
  ],
  [
    'image00020.jpeg',
    'Clouds in Motion',
    1170,
    762,
    'Sweeping clouds above the forest in black and white.',
  ],
  [
    'image00021.jpeg',
    'A Day in the Snow',
    720,
    960,
    'A skiing photograph from the nature collection.',
  ],
  [
    'image00022.jpeg',
    'Autumn Light',
    914,
    960,
    'Sunlight shines through a richly coloured autumn leaf.',
  ],
  [
    'image00023.jpeg',
    'A Quiet Shore',
    1170,
    870,
    'A peaceful shoreline softened by mist and golden light.',
  ],
  [
    'image00024.jpeg',
    'Evening Sky',
    1170,
    660,
    'Warm evening colours above a snow-covered forest.',
  ],
  [
    'image00025.jpeg',
    'A Drop of Light',
    1170,
    1458,
    'A shared photograph of a water droplet, preserved with its original caption.',
  ],
  [
    'sunlight.svg',
    'Sunlit Landscape',
    1200,
    900,
    'The original nature illustration, retained from the museum’s first collection.',
  ],
] as const;

export const naturePhotographs: Photograph[] = works.map(([file, title, w, h, description], i) => {
  const fit = Math.min(3.4 / w, 3.3 / h);
  return {
    id: `nature-${file.split('.')[0]}`,
    image: `images/nature/${file}`,
    title,
    description,
    room: 'celebration',
    placeholder: file.endsWith('.svg'),
    placement: { ...natureSlots[i], width: w * fit, height: h * fit },
  };
});
