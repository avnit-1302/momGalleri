# Bilder, historier og personlige hilsener

Rediger `src/content/museumContent.ts`. Vite oppdaterer siden mens du arbeider. Etter endringer må en publisert versjon bygges og lastes opp på nytt.

## Portrettet

```ts
mother: {
  name: 'Mamma',
  age: 50,
  portrait: 'images/mother/mamma.jpg',
  portraitIsPlaceholder: false,
  welcome: 'Skriv deres egen velkomst her.',
  tributeHeading: 'Hjertet i familien vår',
  tribute: 'Skriv deres personlige takk og hilsen her.',
  ending: 'Skriv deres avsluttende bursdagshilsen her.',
}
```

Portrettet gjenbrukes i tre rom. Det oppgitte tallet 50 er også en del av utstillingstitlene og grensesnittet. Hvis prosjektet senere brukes til en annen bursdag, søk gjennom prosjektet etter `50` og tilpass disse tekstene.

## Et fotografi

Du kan redigere de eksisterende `makePhoto(...)`-eksemplene eller erstatte dem med objekter i `photographs`-listen:

```ts
{
  id: 'mitt-familiebilde',          // Må være unikt
  image: 'images/family/sammen.jpg',
  title: 'Din egen tittel',
  description: 'Din historie.\nEt nytt avsnitt kan begynne her.',
  room: 'family',
  year: 'Valgfritt årstall',
  placeholder: false,
  featured: false,
  placement: {
    position: [29.72, 3.3, -7],
    rotation: -Math.PI / 2,
    width: 3.4,
    height: 2.6,
  },
  // video: 'videos/en-hilsen.mp4',
}
```

Filstien er relativ til `public/`: ikke ta med `public/` i `image`. Bruk helst små bokstaver og bindestreker i filnavn. Stier skiller mellom store og små bokstaver hos vertstjenesten selv om Windows ikke gjør det.

`description` viser ren tekst. HTML kjøres ikke. `year`, `video`, `featured` og `placeholder` er valgfrie. `featured` markerer sentrale verk i innholdsmodellen; de tre eksisterende portrettene bruker dette feltet. Utseendet og størrelsen styres av `placement`.

## Rom og plassering

Alle mål er i meter. Kameraets øyehøyde er 1,7 m. `position` angir `[x, høyde, z]`, og `rotation` er vinkelen rundt den loddrette aksen i radianer. Start med å erstatte eksisterende bilder: da er plasseringen allerede riktig.

| `room`        | Rom                 | Plassering           |
| ------------- | ------------------- | -------------------- |
| `entrance`    | Velkommen hjem      | x −10…10, z 12…28    |
| `atrium`      | Sjøhestens sal      | x −10…10, z −12…12   |
| `childhood`   | De første kapitlene | x −30…−10, z −12…12  |
| `family`      | Livet vi deler      | x 10…30, z −12…12    |
| `sanctuary`   | Hjertet i familien  | x −30…−10, z −30…−12 |
| `celebration` | Til deg, mamma      | x −10…30, z −30…−12  |

| Vegg / retning bildet vender | `rotation`     |
| ---------------------------- | -------------- |
| Nordvegg, vender mot +z      | `0`            |
| Vestvegg, vender mot +x      | `Math.PI / 2`  |
| Østvegg, vender mot −x       | `-Math.PI / 2` |
| Sørvegg, vender mot −z       | `Math.PI`      |

På de ytre øst- og vestveggene ligger steinpanelene ved z −21, −7, 0 og 7. Mellomrommene er vinduer. Ikke heng nye bilder midt i et vindu eller en døråpning. Rammer bygger noen centimeter ut fra veggen. Bildeplasseringene på x ±29.72 og z −29.72 er allerede tilpasset veggtykkelsen.

Fotografier vises med hele motivet bevart og en lys bakgrunn ved ulikt sideforhold. Velg en ramme som ligner bildets proporsjoner for mindre kant. JPG og WebP passer til fotografier, PNG til transparens. Eksporter gjerne 1600–2400 piksler langs lengste side, ofte under 1 MB per bilde. Originalfilen lastes i bildevisningen; GPU-teksturen er mindre. Eksporter HEIC til JPG/WebP før bruk.

## Video

Legg filer i `public/videos/`. Sett `museumContent.celebrationVideo` for en felles bursdagshilsen. Da vises «Se bursdagshilsen» i det siste rommet. Bruk `video` på et fotografi for en hilsen knyttet til akkurat det bildet. MP4 med H.264 og AAC har bred støtte. Filene spilles først når besøkeren velger å gjøre det; det finnes ingen automatisk avspilling.

Komprimer videoer før opplasting. Cloudflare Pages har en grense på 25 MiB per enkeltfil; bruk korte klipp under denne grensen hvis du velger denne verten. Se [Cloudflares dokumenterte grenser](https://developers.cloudflare.com/pages/platform/limits/).

## Tributtrommet

Rommet er laget for en levende mors bursdag, kjærlighet og takknemlighet. Det er ikke en rekonstruksjon av en Gurdwara. Ik Onkar står høyt på veggen, separat fra portrettet. Ingen hellige symboler er på gulvet. Teksten inneholder ingen oppdiktede skriftsteder eller religiøse sitater. Familien kan tilpasse de personlige ordene direkte i innholdskonfigurasjonen.
