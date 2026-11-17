# Asset origins and credits

## Original assets

- The seahorse is an original parametric 3D sculpture in `src/world/Seahorse.tsx`; it uses no downloaded commercial model.
- Architecture, vegetation, forest, material textures and icons were created directly in this project. Museum audio uses locally bundled CC0 field recordings and ambient piano music.
- JPEGs under `public/images/mother`, `family`, `nature`, and `theOneness` were supplied by the user. They are used intact, with their original borders, signatures and captions. Their ownership remains with their respective rights holders.
- The original SVG placeholders have been removed from the exhibition. `scripts/create-placeholders.mjs` remains as a development utility; it should not be rerun against the current photo collection because it recreates the old example files.
- The sunflower floor inlay is original procedural geometry in `src/world/SunflowerFloor.tsx`: layered stone petals, brass edging and instanced spiral seeds. No downloaded artwork or external asset service is used. The vaulted gallery and oak-plank texture in `src/world/MainGallery.tsx` are also original project assets.
- Family photographs and videos you add retain their own authorship and rights.
- The broad-leaf ficus plants in `IndoorPlants.tsx`, their vein texture, and the architecture in `GalleryDetails.tsx` are original code-generated assets.

## Rigged visitors and recorded ambience

The three textured, rigged humans are Innerscene's CC0 MakeHuman-based Harper,
Jordan and Maya models. Each has an idle clip and relaxed walking clip. Geometry
is simplified to about 31,000 triangles per visitor; embedded WebP textures are
at most 1024px. Their GLBs total approximately 8.9 MB and require no runtime decoder download.

Birds, wind and river recordings are Thimras's CC0 *Park ambiences*. The occasional
leaf sound is Augmentality / Brandon Morris's CC0 recording. Loops were trimmed,
filtered, crossfaded, level-matched and encoded as compact Vorbis files (about 2.2 MB total).
See [full source links and licences](../public/licenses/museum-visitors-and-nature.md).
Background music is **Lifewave 2k** by **The Cynic Project**, CC0. It is streamed
from a local 2.1 MB Vorbis file prepared by `scripts/prepare-music.py` with a soft
loop transition and reduced level. Nature layers are quieter, birds occur only
occasionally, and the separate leaf effect is no longer played.
Offline preparation scripts are `scripts/prepare-visitors.mjs` and
`scripts/prepare-ambience.py`; original downloads stay in ignored `artifacts/source-assets`.

## Fonts and libraries

**Cormorant Garamond**, **DM Sans**, and **Noto Sans Gurmukhi** are bundled locally through Fontsource under the SIL Open Font License 1.1. Copies of the licences are in `public/licenses/` and are included in the static build. The Gurmukhi font loads before the symbol texture is drawn so Ik Onkar is rendered correctly.

React, Vite, TypeScript, Three.js, React Three Fiber, and Drei are open-source libraries. Exact installed versions are recorded in `package-lock.json`; their own licence files accompany the installed npm packages. The app uses no external font service, HDRI service, models, or image API at runtime.

## Replacing the seahorse later

The included sculpture is complete and requires no replacement. If the family chooses another model later, replace the `Seahorse` component with a locally loaded GLB using Drei's `useGLTF`. Keep its placement in `Architecture.tsx` and adjust its scale to fit the pedestal and reflecting pool. Use a model with a licence permitting publication and satisfy any attribution requirements. Store it under `public/models/`; no paid service is needed.
