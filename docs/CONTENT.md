# Photographs, stories, and shared memories

Edit `src/content/museumContent.ts`. Vite updates the local page as you work. Rebuild and upload a new version to update a published site.

The museum is an English-language memorial to the late **Puja Anand**, honouring what would have been her 50th birthday. Keep personal messages consistent with that purpose. Do not add biographical dates or stories unless the family supplies them.

## The main portrait

```ts
mother: {
  name: 'Puja Anand',
  commemorativeBirthday: 50,
  portrait: 'images/mother/puja-anand.jpg',
  portraitIsPlaceholder: false,
  welcome: 'In loving memory of Puja Anand. Add your family’s introduction here.',
  tributeHeading: 'The Heart of Our Family',
  tribute: 'Add your family’s memories and words of gratitude here.',
  ending: 'Always loved. Forever remembered.',
}
```

The same portrait is displayed in three rooms. `commemorativeBirthday` means the birthday being commemorated, not her age when she died. The English copy also refers explicitly to her 50th birthday; update those sentences if the occasion changes.

## A photograph

Edit the existing `makePhoto(...)` examples, or replace them with entries in the `photographs` array:

```ts
{
  id: 'family-photograph',          // Must be unique
  image: 'images/family/together.jpg',
  title: 'Your photograph title',
  description: 'Your memory.\nBegin a new paragraph here.',
  room: 'family',
  year: 'Optional year',
  placeholder: false,
  featured: false,
  placement: {
    position: [29.72, 3.3, -7],
    rotation: -Math.PI / 2,
    width: 3.4,
    height: 2.6,
  },
  // video: 'videos/a-shared-memory.mp4',
}
```

Paths are relative to `public/`; do not include `public/` in the `image` value. Lowercase filenames with hyphens are convenient. Hosting services distinguish uppercase and lowercase even if Windows does not.

Descriptions are plain text; HTML is not executed. `year`, `video`, `featured`, and `placeholder` are optional. `featured` identifies central works in the content model, including the three existing portraits. `placement` controls their dimensions and location.

## Rooms and placement

All measurements are in metres. Eye height is 1.7 m. `position` is `[x, height, z]`, and `rotation` is the angle around the vertical axis in radians. Replacing existing photographs is the easiest way to keep correct placement.

| `room`        | Visitor-facing name     | Bounds               |
| ------------- | ----------------------- | -------------------- |
| `entrance`    | A Place to Remember     | x −10…10, z 12…28    |
| `atrium`      | The Seahorse Hall       | x −10…10, z −12…12   |
| `childhood`   | The First Chapters      | x −30…−10, z −12…12  |
| `family`      | The Life We Shared      | x 10…30, z −12…12    |
| `sanctuary`   | The Heart of Our Family | x −30…−10, z −30…−12 |
| `celebration` | Forever Remembered      | x −10…30, z −30…−12  |

| Wall / direction faced by the photograph | `rotation`     |
| ---------------------------------------- | -------------- |
| North wall, facing +z                    | `0`            |
| West wall, facing +x                     | `Math.PI / 2`  |
| East wall, facing −x                     | `-Math.PI / 2` |
| South wall, facing −z                    | `Math.PI`      |

Stone panels on the outer east and west walls are centred near z −21, −7, 0, and 7. The gaps are windows. Avoid placing photographs in windows or doorways. Frames project slightly from the walls; the existing x ±29.72 and z −29.72 positions account for wall thickness.

Photographs retain their entire image, with a light border when proportions differ from the frame. Choose similar image and frame proportions to reduce that border. JPG and WebP suit photographs; PNG supports transparency. Images around 1600–2400 pixels on their longest side and under 1 MB are practical. The viewer loads the original file while the GPU texture is smaller. Convert HEIC images to JPG or WebP first.

## Videos

Place videos in `public/videos/`. Set `museumContent.celebrationVideo` for a shared remembrance video; **Watch shared memories** then appears in the final room. Set `video` on an individual photograph to associate a video with that memory. MP4 using H.264 video and AAC audio has broad support. Visitors choose when to play a video; there is no autoplay.

Compress videos before uploading. Cloudflare Pages documents a 25 MiB limit per file, so use short clips below that limit when choosing this host. See [Cloudflare's documented limits](https://developers.cloudflare.com/pages/platform/limits/).

## The tribute room

This is a Sikh-inspired family memorial space for remembering Puja Anand with love and gratitude. It is not a reconstruction of a Gurdwara. Ik Onkar is elevated on the wall, separate from the portrait and walking surfaces. The sacred symbol is preserved; the surrounding prose is English. There are no invented scriptures or religious quotations. Personal words can be edited directly in the content configuration.
