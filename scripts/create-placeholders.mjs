import { mkdirSync, writeFileSync } from 'node:fs';
const motifs = {
  'childhood/meadow': ['#dce0ce', '#e2cba6', '#798768', '#586d56'],
  'childhood/forest': ['#d5d9c6', '#c0c6a5', '#7d9174', '#3e5d4b'],
  'family/coast': ['#e4dfcf', '#d1d0b7', '#91a5a0', '#697f79'],
  'celebration/sunlight': ['#ead9b8', '#cdbb91', '#919d72', '#627558'],
};
for (const [name, c] of Object.entries(motifs)) {
  const trees = Array.from({ length: 15 }, (_, i) => {
    const x = (i * 173 + 45) % 1200,
      y = 350 + ((i * 59) % 170),
      s = 20 + ((i * 13) % 34);
    return `<path d="M${x} 730v-${y - 140}" stroke="${c[3]}" stroke-width="${s / 6}"/><ellipse cx="${x}" cy="${y}" rx="${s}" ry="${s * 2.7}" fill="${c[3]}" opacity=".65"/>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900"><defs><linearGradient id="s" x2="0" y2="1"><stop stop-color="${c[0]}"/><stop offset="1" stop-color="${c[1]}"/></linearGradient><filter id="g"><feTurbulence baseFrequency=".65" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".055"/></feComponentTransfer><feBlend in="SourceGraphic" mode="multiply"/></filter></defs><g filter="url(#g)"><path fill="url(#s)" d="M0 0h1200v900H0z"/><circle cx="850" cy="235" r="88" fill="#fff7dd" opacity=".7"/><path d="M0 490Q220 320 500 470T1200 420V900H0" fill="${c[2]}" opacity=".5"/><path d="M0 630Q320 400 650 610T1200 500V900H0" fill="${c[2]}"/>${trees}<path d="M0 800Q350 630 700 790T1200 740V900H0" fill="${c[3]}" opacity=".8"/><path d="M490 900Q720 780 600 680Q540 620 610 570" fill="none" stroke="${c[0]}" stroke-width="45" opacity=".35"/></g></svg>`;
  mkdirSync(`public/images/${name.split('/')[0]}`, { recursive: true });
  writeFileSync(`public/images/${name}.svg`, svg);
}
mkdirSync('public/images/mother', { recursive: true });
writeFileSync(
  'public/images/mother/portrait.jpg',
  `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200"><defs><radialGradient id="b"><stop stop-color="#ede5d3"/><stop offset="1" stop-color="#d4c8b0"/></radialGradient></defs><path fill="url(#b)" d="M0 0h900v1200H0z"/><rect x="70" y="70" width="760" height="1060" rx="360" fill="none" stroke="#a1906d" stroke-opacity=".4"/><g fill="none" stroke="#899276" stroke-width="4" opacity=".65"><path d="M200 930Q100 600 300 260M700 930Q800 600 600 260"/><path d="M191 830q-100-60-70-150 90 30 70 150m-7-210q-80-80-20-150 70 50 20 150m56-200q-50-90 20-130 50 60-20 130M709 830q100-60 70-150-90 30-70 150m7-210q80-80 20-150-70 50-20 150m-56-200q50-90-20-130-50 60 20 130"/></g><text x="450" y="570" text-anchor="middle" fill="#796b50" font-family="Georgia,serif" font-size="78">Puja Anand</text><text x="450" y="640" text-anchor="middle" fill="#8b7e66" font-family="Arial,sans-serif" font-size="19" letter-spacing="5">PORTRAIT PLACEHOLDER</text><path d="M410 704h80" stroke="#a1906d"/><text x="450" y="780" text-anchor="middle" fill="#796b50" font-family="Georgia,serif" font-size="28" letter-spacing="3">IN LOVING MEMORY</text></svg>`,
);
