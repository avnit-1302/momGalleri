# Opphav og eiendeler

## Originale eiendeler

- Sjøhesten er en original parametrisk 3D-skulptur skrevet i `src/world/Seahorse.tsx`. Den bruker ikke nedlastede kommersielle modeller.
- Arkitektur, planter, skog, materialtekstur, ikoner og naturlyd er laget direkte i prosjektet. Naturlyden er syntetisert, filtrert støy, ikke et feltopptak eller et religiøst lydspor.
- Bildene under `public/images` er originale SVG-illustrasjoner laget med `scripts/create-placeholders.mjs`. De er tydelige erstatningsfelt, ikke fotografier av familien. Ikke kjør generatoren etter å ha redigert disse SVG-filene med eget innhold; den overskriver eksempelbanene.
- Familiebilder og videohilsener du legger til, beholder sitt eget opphav og sine egne rettigheter.

## Skrifter og biblioteker

Skriftene **Cormorant Garamond**, **DM Sans** og **Noto Sans Gurmukhi** leveres lokalt via Fontsource. De bruker SIL Open Font License 1.1. Kopier av lisensene ligger i `public/licenses/`, og følger dermed det statiske bygget. Gurmukhi-fonten lastes før symbolteksturen tegnes for å sikre riktig gjengivelse av Ik Onkar.

React, Vite, TypeScript, Three.js, React Three Fiber og Drei er åpen kildekode. Versjonene som faktisk brukes er låst i `package-lock.json`; deres egne lisensfiler følger de installerte npm-pakkene. Applikasjonen bruker ikke eksterne skrifttjenester, HDRI-tjenester, modeller eller bilde-API-er ved kjøring.

## Bytt ut sjøhesten senere

Den medfølgende modellen er komplett og trenger ingen utskifting. Hvis familien senere ønsker en annen modell, kan `Seahorse`-komponenten erstattes med en lokalt lastet GLB via Dreis `useGLTF`. Behold komponentens plassering i `Architecture.tsx`, og tilpass modellens skala slik at den står på sokkelen og holder seg innenfor vannbassenget. Kontroller at modellen har en lisens som tillater publisering og at eventuelle opphavskrav oppfylles. Oppbevar den lokalt under `public/models/`; ingen betalt tjeneste er nødvendig.
