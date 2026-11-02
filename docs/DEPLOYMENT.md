# Publiser museet uten eget domene

Museet består bare av statiske filer. Du trenger ingen server, database, betalt API eller betalingskort for selve applikasjonen. Bruk vertens gratisnivå; ikke aktiver betalte tillegg. Vertstjenesten krever en konto. Planvilkår og grenser kan endre seg; lenkene nedenfor peker til leverandørenes dokumentasjon.

## Cloudflare Pages: last opp ferdig museum

1. Kjør `npm ci`, `npm test` og `npm run build` på din maskin.
2. Logg inn i Cloudflare og gå til **Workers & Pages**.
3. Opprett et Pages-prosjekt med **Direct Upload / Drag and drop**.
4. Last opp `dist`-mappen, slik at dens `index.html` ligger øverst i de publiserte filene. Ikke last opp prosjektets kildekode eller `node_modules`.
5. Velg prosjektnavn og publiser. Du får en adresse på `pages.dev` som kan deles med familien.
6. Etter bildeendringer: bygg på nytt og last opp den nye `dist`-mappen som en ny produksjonsversjon i samme prosjekt.

Cloudflare dokumenterer både [direkte opplasting](https://developers.cloudflare.com/pages/get-started/direct-upload/) og [grensene for gratisnivået](https://developers.cloudflare.com/pages/platform/limits/). Enkeltfiler må være under 25 MiB; dette gjelder også videohilsener. Direct Upload er et eget prosjektvalg og kan ikke senere byttes til Git-integrasjon i samme Pages-prosjekt.

## Vercel: publiser fra GitHub

1. Legg den ferdige kildekoden i ditt GitHub-repository. `node_modules`, `dist` og testbilder er allerede ignorert av Git.
2. Opprett et prosjekt på Vercels **Hobby**-plan og importer repositoryet.
3. Velg **Vite**, byggkommando `npm run build`, installasjon `npm ci`, og utmappe `dist`.
4. Bruk Node.js 22 eller nyere i prosjektinnstillingene. Ingen miljøvariabler trengs.
5. Publiser og bruk den tildelte `vercel.app`-adressen.

[Vercels Hobby-plan](https://vercel.com/docs/plans/hobby) er beregnet på personlige prosjekter og har et gratis bruksnivå. Se [Vite på Vercel](https://vercel.com/docs/frameworks/frontend/vite) for leverandørens konfigurasjon.

## Netlify: publiser `dist` eller koble GitHub

Kjør `npm run build`, og bruk Netlifys manuelle opplasting til å slippe inn `dist`-mappen. Du kan også importere repositoryet og bruke `npm run build` med `dist` som publiseringsmappe. `netlify.toml` i prosjektet angir disse innstillingene. Bruk gratisplanen og den inkluderte `netlify.app`-adressen.

Se Netlifys [veiledning for opprettelse av deploys](https://docs.netlify.com/deploy/create-deploys/) og [gjeldende planer](https://www.netlify.com/pricing/). Museet trenger ingen Netlify Functions, skjemaer, database eller andre tillegg.

## Etter to uker

Museet har ingen innebygd utløpsdato og blir tilgjengelig til du tar det ned. Behold en lokal kopi av kildekoden og familiebildene. Åpne det aktuelle prosjektet hos verten og bruk prosjektinnstillingene til å slette eller avpublisere det. Ved sletting: kontroller prosjektnavnet slik at bare bursdagsmuseet fjernes. Slett også eventuelle separate forhåndsvisningsversjoner dersom verten beholder disse. Den lokale mappen trenger ikke slettes.

En vanlig statisk publisering er tilgjengelig for alle som har nettadressen; applikasjonen har ikke innlogging. Velg bildene familien ønsker å dele. Et privat GitHub-repository gjør ikke automatisk den publiserte nettsiden privat.

## Sjekk før deling

- Portrettet og alle ønskede bilder er erstattet; `placeholder` er satt til `false` for ekte bilder.
- Tekster og årstall er deres egne, og alle seks rom er gjennomgått.
- Museet er prøvd på en datamaskin og en telefon.
- Eventuelle videoer åpner og kan spilles på telefonen.
- Den delte adressen er den publiserte adressen, ikke `localhost`.

Ingen kjøp av domene er nødvendig, og ingen av de tre metodene krever endringer i 3D-koden.
