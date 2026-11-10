# Asset origins and credits

## Original assets

- The seahorse is an original parametric 3D sculpture in `src/world/Seahorse.tsx`; it uses no downloaded commercial model.
- Architecture, vegetation, forest, material textures, icons, and nature sounds were created directly in this project. The ambient sound is synthesised filtered noise, not a field recording or religious soundtrack.
- JPEGs under `public/images/mother`, `family`, `nature`, and `theOneness` were supplied by the user. They are used intact, with their original borders, signatures and captions. Their ownership remains with their respective rights holders.
- The original SVG placeholders have been removed from the exhibition. `scripts/create-placeholders.mjs` remains as a development utility; it should not be rerun against the current photo collection because it recreates the old example files.
- The sunflower floor inlay is original procedural geometry in `src/world/SunflowerFloor.tsx`: layered stone petals, brass edging and instanced spiral seeds. No downloaded artwork or external asset service is used. The vaulted gallery and oak-plank texture in `src/world/MainGallery.tsx` are also original project assets.
- Family photographs and videos you add retain their own authorship and rights.

## Fonts and libraries

**Cormorant Garamond**, **DM Sans**, and **Noto Sans Gurmukhi** are bundled locally through Fontsource under the SIL Open Font License 1.1. Copies of the licences are in `public/licenses/` and are included in the static build. The Gurmukhi font loads before the symbol texture is drawn so Ik Onkar is rendered correctly.

React, Vite, TypeScript, Three.js, React Three Fiber, and Drei are open-source libraries. Exact installed versions are recorded in `package-lock.json`; their own licence files accompany the installed npm packages. The app uses no external font service, HDRI service, models, or image API at runtime.

## Replacing the seahorse later

The included sculpture is complete and requires no replacement. If the family chooses another model later, replace the `Seahorse` component with a locally loaded GLB using Drei's `useGLTF`. Keep its placement in `Architecture.tsx` and adjust its scale to fit the pedestal and reflecting pool. Use a model with a licence permitting publication and satisfy any attribution requirements. Store it under `public/models/`; no paid service is needed.
