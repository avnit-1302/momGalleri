# Museum visitors and nature recordings

These assets are redistributed under CC0 1.0 Universal:
https://creativecommons.org/publicdomain/zero/1.0/

## Rigged visitors

Source: Innerscene's 3D Parts library, MakeHuman-based human characters.
The source pages explicitly mark the models and animations CC0.
Library terms: https://www.innerscene.com/tools/library/terms

- Harper: https://www.innerscene.com/tools/library/3d-parts/locomotion-collection-harper-3d-person-animated-797e1e2a
- Jordan: https://www.innerscene.com/tools/library/3d-parts/locomotion-collection-jordan-3d-person-animated-911f1584
- Maya: https://www.innerscene.com/tools/library/3d-parts/locomotion-collection-maya-3d-person-animated-1499b2fd

Local files: models/visitors/harper.glb, jordan.glb, maya.glb.
Modifications: simplified geometry; textures resized to at most 1024px and encoded
as WebP; only Idle_Standing and Walk_Relaxed retained; carry props and unused data removed.
These are authored skeletal animations, not motion capture.
Maya's professional outfit reuses Harper's CC0 textured tailored suit, fitted
offline to Maya's bind pose with joint weights remapped to her existing skeleton.
Covered body triangles are removed to prevent skin clipping through the jacket.
Her original face, ponytail, shoes and animation clips are retained. Clothing uses
matte fabric materials and introduces no runtime fitting or cloth simulation.
The repeatable fitting step is in `scripts/dress-maya.mjs`.
The original relaxed walk was authored for 1.3 m/s. The museum version has been
rebaked offline with shorter steps, narrower stance, lower foot clearance,
reduced hip bounce and arm swing, and a two-bone leg solve. Its planted-foot
travel is 0.78 m/s; playback follows the visitor's actual speed. No runtime IK is used.

## Nature field recordings

Birds, wind and flowing water: **Park ambiences**, by **Thimras**, CC0.
https://opengameart.org/content/park-ambiences

Original files:
https://opengameart.org/sites/default/files/park_ambience_birds.wav
https://opengameart.org/sites/default/files/park_ambience_wind.wav
https://opengameart.org/sites/default/files/park_ambience_river.wav

Local files: audio/birds.ogg, wind.ogg, river.ogg.
Modifications: trimmed to 73, 61 and 53 seconds respectively; filtered; five-second
crossfade at each loop seam; resampled to 32 kHz and compressed with Vorbis.
River is mono for positional playback. Offline gain of +26 dB (birds), +23 dB
(wind) and +17 dB (river) corrects the very quiet source levels while retaining
peak headroom. The recordings include distant wildlife.

Leaves: **Random Sounds / Samples**, by **Augmentality (Brandon Morris)**,
submitted by HaelDB. Used under the offered CC0 licence (not the alternative OGA-BY licence).
https://opengameart.org/content/random-sounds-samples
https://opengameart.org/sites/default/files/moving%20leaves%20stereo.ogg
Local file: audio/leaves.ogg. The original recording is unchanged; the application
no longer plays the separate leaf effect in the quieter museum mix.

## Background music

**Lifewave 2k (Calm Ambient 3)** by **The Cynic Project / cynicmusic**, CC0.
Source and licence: https://opengameart.org/content/calm-ambient-3-lifewave-2k
Original: https://opengameart.org/sites/default/files/006_lifeWave2k_0.mp3
Artist: https://cynicmusic.com/ — project: https://pixelsphere.org/
Local file: audio/music.ogg. Prepared as a 182-second stereo Vorbis loop at 32 kHz,
with a five-second tail/head crossfade and -4 dB gain. No changes to the composition.
Served through an HTML audio element for streaming, rather than a full PCM decode.

The quieter mix uses low wind and positional water, with 4–6 seconds of birdsong
only after an initial 35–60 second pause and then every 65–95 seconds. The music
and nature layers share the explicit sound toggle and volume control.

All runtime assets are served locally. No third-party model or audio service is
contacted by museum visitors. Audio is off by default and fetched only after opt-in.
