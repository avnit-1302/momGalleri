// Offline preparation. Original CC0 downloads belong in artifacts/source-assets (not the website).
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, weld, simplify, prune, resample, textureCompress } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import { mkdirSync, writeFileSync, statSync } from 'node:fs';
import { relaxVisitorGait } from './relax-visitor-gait.mjs';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
await MeshoptSimplifier.ready;
mkdirSync('public/models/visitors', { recursive: true });
const report = [];
for (const name of ['harper', 'jordan', 'maya']) {
  const document = await io.read(`artifacts/source-assets/${name}.glb`);
  // Carry props belong to the discarded carry/phone poses, not a relaxed gallery walk.
  for (const node of document.getRoot().listNodes()) {
    if (['Briefcase', 'Phone'].includes(node.getName())) node.dispose();
  }
  for (const animation of document.getRoot().listAnimations()) {
    if (!['Idle_Standing', 'Walk_Relaxed'].includes(animation.getName())) animation.dispose();
  }
  relaxVisitorGait(document);
  await document.transform(
    dedup(),
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio: 0.28, error: 0.004 }),
    resample(),
    prune(),
    textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 85 }),
  );
  document
    .getRoot()
    .setExtras({
      source: 'Innerscene / MakeHuman',
      license: 'CC0-1.0',
      preparation: 'Mesh simplification, 1024px WebP textures, idle and relaxed walk retained',
    });
  const output = `public/models/visitors/${name}.glb`;
  await io.write(output, document);
  const triangles = document
    .getRoot()
    .listMeshes()
    .reduce(
      (sum, mesh) =>
        sum + mesh.listPrimitives().reduce((n, p) => n + p.getIndices().getCount() / 3, 0),
      0,
    );
  const entry = {
    name,
    bytes: statSync(output).size,
    triangles,
    clips: document
      .getRoot()
      .listAnimations()
      .map((a) => a.getName()),
  };
  report.push(entry);
  console.log(entry);
}
writeFileSync('public/models/visitors/manifest.json', JSON.stringify(report, null, 2));
