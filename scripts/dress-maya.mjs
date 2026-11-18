// Offline garment fitting: reuse the licensed, textured MakeHuman suit already
// bundled for Harper. Maya keeps her own face, hair, skeleton and animation clips.
import { copyToDocument, prune } from '@gltf-transform/functions';
import { Matrix4, Vector3 } from 'three';

export async function dressMaya(document, donor) {
  const root = document.getRoot();
  const oldClothes = root.listNodes().find((n) => n.getName() === 'female_casualsuit01');
  if (!oldClothes) throw new Error('Expected Maya’s original outfit before fitting');
  const skin = oldClothes.getSkin();
  const suit = donor
    .getRoot()
    .listNodes()
    .find((n) => n.getName() === 'male_elegantsuit01');
  const donorSkin = suit.getSkin();
  const joints = skin.listJoints();
  const remap = donorSkin.listJoints().map((joint) => {
    const index = joints.findIndex((target) => target.getName() === joint.getName());
    if (index < 0) throw new Error(`Missing garment joint: ${joint.getName()}`);
    return index;
  });
  const transforms = remap.map((target, i) =>
    new Matrix4()
      .fromArray(skin.getInverseBindMatrices().getElement(target, []))
      .invert()
      .multiply(new Matrix4().fromArray(donorSkin.getInverseBindMatrices().getElement(i, []))),
  );
  const copied = copyToDocument(document, donor, [suit.getMesh()]);
  const mesh = copied.get(suit.getMesh()).setName('Maya tailored jacket and trousers');
  for (const primitive of mesh.listPrimitives()) {
    const positions = primitive.getAttribute('POSITION');
    const normals = primitive.getAttribute('NORMAL');
    const jointIndices = primitive.getAttribute('JOINTS_0');
    const weights = primitive.getAttribute('WEIGHTS_0');
    for (let v = 0; v < positions.getCount(); v++) {
      const indices = jointIndices.getElement(v, []);
      const influence = weights.getElement(v, []);
      const source = new Vector3().fromArray(positions.getElement(v, []));
      const sourceNormal = new Vector3().fromArray(normals.getElement(v, []));
      const fitted = new Vector3();
      const normal = new Vector3();
      for (let k = 0; k < 4; k++) {
        if (!influence[k]) continue;
        fitted.addScaledVector(source.clone().applyMatrix4(transforms[indices[k]]), influence[k]);
        normal.addScaledVector(
          sourceNormal.clone().transformDirection(transforms[indices[k]]),
          influence[k],
        );
      }
      positions.setElement(v, fitted.toArray());
      normals.setElement(v, normal.normalize().toArray());
      jointIndices.setElement(
        v,
        indices.map((i) => remap[i]),
      );
    }
    primitive
      .getMaterial()
      .setName('Maya | tailored charcoal suit and collared shirt')
      .setRoughnessFactor(0.93)
      .setMetallicFactor(0);
  }
  const dressed = document.createNode('Maya tailored suit').setMesh(mesh).setSkin(skin);
  oldClothes.getParentNode().addChild(dressed);
  oldClothes.dispose();

  // Remove covered skin so elbows and the torso cannot poke through the fitted
  // jacket during a walk. Keep the original neck/head and fully articulated hands.
  const body = root.listNodes().find((n) => n.getName() === 'Maya | anatomical body');
  for (const primitive of body.getMesh().listPrimitives()) {
    const positions = primitive.getAttribute('POSITION');
    const jointIndices = primitive.getAttribute('JOINTS_0');
    const weights = primitive.getAttribute('WEIGHTS_0');
    const visible = (v) => {
      const [x, y] = positions.getElement(v, []);
      if (y > 1.455 || (y > 1.36 && Math.abs(x) < 0.075)) return true;
      const indices = jointIndices.getElement(v, []);
      const influence = weights.getElement(v, []);
      return (
        indices.reduce(
          (sum, i, k) =>
            sum +
            (/hand|thumb|index|middle|ring|pinky/.test(joints[i].getName()) ? influence[k] : 0),
          0,
        ) > 0.4
      );
    };
    const original = primitive.getIndices();
    const kept = [];
    for (let i = 0; i < original.getCount(); i += 3) {
      const triangle = [0, 1, 2].map((k) => original.getScalar(i + k));
      if (triangle.some(visible)) kept.push(...triangle);
    }
    primitive.setIndices(
      document
        .createAccessor('Visible face and hands')
        .setType('SCALAR')
        .setArray(new Uint32Array(kept))
        .setBuffer(positions.getBuffer()),
    );
  }
  const buffer = root.listBuffers()[0];
  for (const accessor of root.listAccessors()) accessor.setBuffer(buffer);
  await document.transform(prune());
}
