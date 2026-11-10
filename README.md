# Puja Anand · In Loving Memory

A static 3D memorial museum honouring the late Puja Anand on what would have been her 50th birthday. Six connected rooms in a forest, an original bronze seahorse sculpture, interactive photographs, and a Sikh-inspired space for remembrance and gratitude.

The experience is entirely in English. Its wording remembers her life and the love she shared; it does not present her as still living or imply that she lived to 50. No family history, dates of birth or death, or personal stories have been invented.

No database, API keys, subscriptions, or external content services are required. Photographs, fonts, geometry, and sound are local or generated in the browser. The example images are original nature illustrations and a clearly marked portrait placeholder.

## Run locally

Install Node.js 22.12 or later. From the project folder:

```sh
npm ci
npm run dev
```

Open the address printed by Vite, normally `http://127.0.0.1:5173`. The first installation requires an internet connection. The museum itself makes no external content requests.

To try it on a phone connected to the same network:

```sh
npm run dev -- --host 0.0.0.0
```

Open Vite's network address on the phone. If needed, allow Node on your private network in Windows Firewall.

## Personalise the memorial

Edit [`src/content/museumContent.ts`](src/content/museumContent.ts). No changes to the 3D rendering code are needed.

1. Place a portrait at `public/images/mother/puja-anand.jpg`.
2. Set `mother.portrait` to `images/mother/puja-anand.jpg` and `portraitIsPlaceholder` to `false`. It is reused in the entrance, family tribute, and remembrance gallery.
3. Replace the example photographs' `image`, `title`, and `description`. Set `placeholder: false` for each real photograph.
4. Personalise `welcome`, `tributeHeading`, `tribute`, and `ending` with your family's memories.
5. Optionally place a video in `public/videos/` and set `celebrationVideo` to `videos/remembering-puja.mp4`.

The internal `celebration` room ID and related configuration fields are retained for compatibility; this room is presented to visitors as **Forever Remembered**. `commemorativeBirthday` identifies the birthday being remembered, not her age at death.

See [the content guide](docs/CONTENT.md) for examples and placement instructions.

## Visitor controls

| Computer control                           | Action                                             |
| ------------------------------------------ | -------------------------------------------------- |
| WASD / arrow keys                          | Walk                                               |
| Shift                                      | Walk faster                                        |
| Drag the mouse                             | Look around                                        |
| Free mouse look                            | Lock the pointer for free camera movement          |
| Esc                                        | Release the pointer / close a photograph or dialog |
| Click a photograph / E while looking at it | View the photograph and its story                  |
| M / H                                      | Open the map / help                                |

Phones and tablets have a movement joystick and touch controls for looking around and opening photographs. The map provides direct access to every room. The guided tour follows six stops, with visitors choosing when to move on. Sound is off at startup. The menu includes a lower visual quality setting and a return-to-entrance option.

The photograph collection also works without WebGL. Dialogs support focus management, keyboard navigation, and Escape. Movement pauses while a dialog is open or the browser loses focus.

## Build and verify

```sh
npm test
npm run build
npm run preview
```

The static build is written to `dist/`. Serve it through a web server rather than double-clicking `index.html`.

Browser checks use Playwright and a locally installed Google Chrome. Start the development server in one terminal, then run:

```sh
npm run test:browser
```

The checks cover desktop movement, room navigation, photographs, the guided tour, touch controls, missing images, and the WebGL fallback. Results and screenshots are saved in the Git-ignored `artifacts/` folder. Pass a different server address as an argument, or set `MUSEUM_URL`, to test a production preview. Mobile checks emulate touch in Chrome; also review the experience on the family's actual devices before sharing.

With the production preview running on port 4173, run `npm run test:performance`. This checks that artwork is prepared before entry, room changes do not request more images or compile more shaders, artwork targeting skips forest instances, and other galleries do not trigger reflection or environment captures. Pass another preview URL as an argument if needed. Timing results in `artifacts/performance-results.json` are diagnostic, not a hardware performance guarantee.

## Deployment

See [the deployment guide](docs/DEPLOYMENT.md) for Cloudflare Pages, Netlify, and Vercel, including removing the site afterwards. Publishing is a separate step; editing this local project does not publish it or push it to GitHub.

## Project structure

```text
src/
  content/museumContent.ts      Portrait, photographs, and personal memories
  world/layout.ts              Rooms, walls, map coordinates, and collisions
  world/Museum.tsx             Canvas, daylight, and quality settings
  world/Architecture.tsx       Floors, walls, glass, interiors, and signs
  world/Seahorse.tsx           Original parametric 3D sculpture
  world/Nature.tsx             Instanced trees, bushes, rocks, and plants
  world/GalleryFrame.tsx       Photographs, frames, lighting, and textures
  world/VisitorControls.tsx    Camera, keyboard, touch, and interaction
  ui/                         Map, dialogs, touch controls, and nature sounds
public/images/                Local photographs and placeholders
public/videos/                Optional videos of shared memories
tests/                        Navigation and content checks
```

Vegetation reuses geometry through instancing. Before entry, artwork is loaded with bounded concurrency, resized to at most 1024 pixels, and uploaded to the GPU; shaders and room views are also prepared. The photograph viewer loads the original file. Static shadows and environment lighting are cached, and four reusable picture lights keep the shader light count stable. The pool updates its reflection only when visible, nearby, and the viewpoint changes, at most 20 times per second. Artwork targeting tests photographs and walls instead of the forest. Automatic desktop resolution can adapt between 0.7 and 1.5 device pixels per CSS pixel; the touch-device default disables shadows and planar reflections.

See [asset credits](docs/ASSETS.md) for origins, font licences, and replacing the sculpture.
