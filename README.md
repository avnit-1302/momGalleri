# Mamma · 50 år med kjærlighet

Et ferdig, statisk 3D-museum til en levende mammas 50-årsdag. Seks sammenhengende rom i en skog, en original sjøhestskulptur i bronse, interaktive bilder og et sikh-inspirert rom for kjærlighet og takknemlighet.

Ingen database, API-nøkler, abonnementer eller eksterne innholdstjenester. Bilder, skrifter, geometri og lyd er lokale eller generert i nettleseren. Eksempelbildene er originale naturillustrasjoner og et tydelig merket portrettfelt. Ingen familiemedlemmer eller familiehistorier er oppdiktet.

## Start på din maskin

Installer Node.js 22.12 eller nyere. Kjør i prosjektmappen:

```sh
npm ci
npm run dev
```

Åpne adressen Vite skriver ut, vanligvis `http://127.0.0.1:5173`. Den første installasjonen trenger internett. Deretter fungerer museet uten eksterne nettverksforespørsler.

For å prøve på en telefon i samme nettverk:

```sh
npm run dev -- --host 0.0.0.0
```

Åpne nettverksadressen fra Vite på telefonen. Tillat om nødvendig Node på det private nettverket i Windows-brannmuren.

## Gjør gaven personlig

Alt innhold ligger i [`src/content/museumContent.ts`](src/content/museumContent.ts). Du trenger ikke endre 3D-koden.

1. Legg et portrett i `public/images/mother/mamma.jpg`.
2. Endre `mother.portrait` til `images/mother/mamma.jpg` og `portraitIsPlaceholder` til `false`. Portrettet oppdateres automatisk i inngangshallen, familietributten og bursdagsrommet.
3. Bytt eksempelbildenes `image`, `title` og `description`. Sett `placeholder: false` når du legger til et eget bilde.
4. Tilpass `welcome`, `tributeHeading`, `tribute` og `ending`.
5. Legg eventuelt en lokal MP4-fil i `public/videos/`, og sett `celebrationVideo` til `videos/bursdagshilsen.mp4`.

Full veiledning og plasseringseksempler finnes i [docs/CONTENT.md](docs/CONTENT.md).

## Besøket

| På datamaskin                           | Handling                                            |
| --------------------------------------- | --------------------------------------------------- |
| WASD / piltaster                        | Gå                                                  |
| Shift                                   | Gå raskere                                          |
| Dra med musen                           | Se deg rundt                                        |
| «Fri musebevegelse»                     | Lås musepekeren for fri kamerabevegelse             |
| Esc                                     | Frigjør musepekeren / lukk et bilde eller en dialog |
| Klikk på et bilde / E når du ser på det | Se bildet og historien                              |
| M / H                                   | Åpne kart / hjelp                                   |

Mobil og nettbrett har en styrespak for bevegelse og berøring for å snu kameraet og åpne bilder. Kartet gir direkte tilgang til alle seks rom. Omvisningen følger seks kuraterte stopp som du går videre fra selv. Lyd er alltid av ved oppstart. Menyen har lavere bildekvalitet og tilbakestilling til inngangen.

«Se alle bildene» er også tilgjengelig uten WebGL. Dialogene har fokusstyring, tastaturnavigasjon og støtte for Esc. Bevegelse stopper mens en dialog er åpen eller nettleseren mister fokus.

## Bygg og kontroller

```sh
npm test
npm run build
npm run preview
```

Bygget ligger i `dist/`. Det kan lastes opp direkte til en statisk vert. Åpne det gjennom en webserver, ikke ved å dobbeltklikke `index.html`.

Nettlesertestene bruker Playwright med en lokalt installert Google Chrome. Start utviklingsserveren i en terminal, og kjør i en annen:

```sh
npm run test:browser
```

Testene dekker desktopbevegelse, kart, bilder, omvisning, mobilberøring, manglende bilder og WebGL-fallback. Resultater og skjermbilder lagres i den Git-ignorerte mappen `artifacts/`. `MUSEUM_URL` kan settes for å teste et annet lokalt endepunkt. Mobiltesten emulerer berøring i Chrome; en siste gjennomgang på familiens faktiske telefoner anbefales før deling.

## Publiser gratis

Se [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Cloudflare Pages, Netlify og Vercel, inkludert hvordan museet fjernes etter feiringen. Ingen publisering eller push til GitHub er utført automatisk.

## Prosjektstruktur

```text
src/
  content/museumContent.ts      Portrett, fotografier og personlige tekster
  world/layout.ts              Rom, vegger, kartposisjoner og kollisjoner
  world/Museum.tsx             Canvas, dagslys og kvalitetsnivåer
  world/Architecture.tsx       Gulv, vegger, glass, interiør og skilt
  world/Seahorse.tsx           Original parametrisk 3D-skulptur
  world/Nature.tsx             Instansierte trær, busker og planter
  world/GalleryFrame.tsx       Bilder, rammer, lys og teksturlasting
  world/VisitorControls.tsx    Kamera, WASD, berøring og interaksjon
  ui/                         Kart, dialoger, berøring og naturlyd
public/images/                Lokale bildearkiver
public/videos/                Valgfrie videohilsener
tests/                        Tester for innhold og navigasjon
```

Vegetasjonen gjenbruker geometri gjennom instanser. Bilder lastes når besøkeren nærmer seg, og GPU-teksturene begrenses til 1024 piksler. Bildevisningen bruker originalfilen. Skygger bruker ett hovedlys; automatisk kvalitet slår dem av på berøringsenheter. Pixel ratio begrenses til 1–1,5. Ingen tunge etterbehandlingseffekter eller eksterne 3D-modeller er nødvendig.

Se [docs/ASSETS.md](docs/ASSETS.md) for opphav, fonter og utskifting av skulpturen.
