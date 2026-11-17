import { Object3D, Quaternion, Vector3 } from 'three';

const point = (node) => node.getWorldPosition(new Vector3());
const rotation = (node) => node.getWorldQuaternion(new Quaternion());
const STRIDE_SCALE = 0.6;

// Bake once, offline. The browser only plays keyframes; no runtime IK solver.
export function relaxVisitorGait(document) {
  const animation = document
    .getRoot()
    .listAnimations()
    .find((a) => a.getName() === 'Walk_Relaxed');
  const nodes = new Map();
  for (const node of document.getRoot().listNodes()) {
    const object = new Object3D();
    object.name = node.getName();
    object.position.fromArray(node.getTranslation());
    object.quaternion.fromArray(node.getRotation());
    object.scale.fromArray(node.getScale());
    nodes.set(node, object);
  }
  for (const [node, object] of nodes)
    for (const child of node.listChildren()) object.add(nodes.get(child));
  const root = new Object3D();
  for (const node of document.getRoot().listScenes()[0].listChildren()) root.add(nodes.get(node));
  const channels = animation.listChannels();
  function sample(time) {
    for (const channel of channels) {
      const sampler = channel.getSampler(),
        times = sampler.getInput().getArray(),
        output = sampler.getOutput();
      let i = 0;
      while (i < times.length - 2 && times[i + 1] < time) i++;
      const dt = times[i + 1] - times[i],
        u = Math.max(0, Math.min(1, (time - times[i]) / dt));
      let value;
      if (sampler.getInterpolation() === 'CUBICSPLINE') {
        const a = output.getElement(i * 3 + 1, []),
          out = output.getElement(i * 3 + 2, []);
        const b = output.getElement((i + 1) * 3 + 1, []),
          into = output.getElement((i + 1) * 3, []);
        value = a.map(
          (v, j) =>
            (2 * u ** 3 - 3 * u * u + 1) * v +
            (u ** 3 - 2 * u * u + u) * dt * out[j] +
            (-2 * u ** 3 + 3 * u * u) * b[j] +
            (u ** 3 - u * u) * dt * into[j],
        );
      } else {
        const a = output.getElement(i, []),
          b = output.getElement(i + 1, []);
        value = a.map((v, j) => v + (b[j] - v) * u);
      }
      const object = nodes.get(channel.getTargetNode());
      if (channel.getTargetPath() === 'rotation') object.quaternion.fromArray(value).normalize();
      else
        object[channel.getTargetPath() === 'translation' ? 'position' : 'scale'].fromArray(value);
    }
    root.updateMatrixWorld(true);
  }
  sample(0);
  const pelvis = root.getObjectByName('pelvis');
  const legs = ['l', 'r'].map((side) => {
    const hip = root.getObjectByName(`thigh_${side}`),
      knee = root.getObjectByName(`calf_${side}`);
    const foot = root.getObjectByName(`foot_${side}`);
    return {
      hip,
      knee,
      foot,
      upper: point(hip).distanceTo(point(knee)),
      lower: point(knee).distanceTo(point(foot)),
      ground: point(foot).y,
    };
  });
  const times = Float32Array.from({ length: 121 }, (_, i) => i / 60);
  const values = channels.map(() => []);
  for (const time of times) {
    sample(time);
    const oldPelvis = point(pelvis);
    // Half a cycle planted, half in swing. Matching endpoint velocities prevents
    // the original backward kick; the planted foot travels at exactly -0.78 m/s.
    const targets = legs.map(({ foot, ground }, i) => {
      const target = point(foot);
      const phase = (time + (i === 0 ? 0.5 : 0)) % 1;
      const u = (phase - 0.5) / 0.5;
      target.x *= 0.72;
      const speed = 1.3 * STRIDE_SCALE,
        halfStep = speed * 0.25;
      target.z =
        oldPelvis.z +
        (phase <= 0.5
          ? halfStep - speed * phase
          : -halfStep +
            2 * halfStep * (3 * u * u - 2 * u ** 3) -
            speed * 0.5 * (2 * u ** 3 - 3 * u * u + u));
      target.y = ground + (phase > 0.5 ? 0.045 * Math.sin(Math.PI * u) ** 2 : 0);
      if (phase > 0.5) {
        const footWorld = rotation(foot).premultiply(
          new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), 0.14 * Math.sin(2 * Math.PI * u)),
        );
        foot.quaternion.copy(rotation(foot.parent).invert().multiply(footWorld));
      }
      return target;
    });
    // Keep the supporting leg almost extended, instead of the original deep bob/crouch.
    const pelvisY = Math.min(
      ...legs.map((leg, i) => {
        const hip = point(leg.hip),
          target = targets[i];
        const reach = (leg.upper + leg.lower) * 0.985;
        const horizontal = (hip.x - target.x) ** 2 + (hip.z - target.z) ** 2;
        return (
          target.y + Math.sqrt(Math.max(0, reach * reach - horizontal)) - (hip.y - oldPelvis.y)
        );
      }),
    );
    pelvis.position.copy(
      pelvis.parent.worldToLocal(new Vector3(oldPelvis.x * 0.55, pelvisY, oldPelvis.z)),
    );
    root.updateMatrixWorld(true);
    legs.forEach((leg, i) => {
      const target = targets[i],
        hip = point(leg.hip),
        oldKnee = point(leg.knee);
      const direction = target.clone().sub(hip),
        distance = direction.length();
      direction.normalize();
      const along = (leg.upper ** 2 - leg.lower ** 2 + distance ** 2) / (2 * distance);
      const bend = new Vector3(0, 0, 1).addScaledVector(direction, -direction.z).normalize();
      const knee = hip
        .clone()
        .addScaledVector(direction, along)
        .addScaledVector(bend, Math.sqrt(Math.max(0, leg.upper ** 2 - along ** 2)));
      const worldHip = rotation(leg.hip).premultiply(
        new Quaternion().setFromUnitVectors(
          oldKnee.sub(hip).normalize(),
          knee.clone().sub(hip).normalize(),
        ),
      );
      leg.hip.quaternion.copy(rotation(leg.hip.parent).invert().multiply(worldHip));
      root.updateMatrixWorld(true);
      const worldCalf = rotation(leg.knee);
      const axis = new Vector3(0, 1, 0).applyQuaternion(worldCalf);
      worldCalf.premultiply(
        new Quaternion().setFromUnitVectors(axis, target.clone().sub(knee).normalize()),
      );
      leg.knee.quaternion.copy(rotation(leg.knee.parent).invert().multiply(worldCalf));
      leg.foot.position.copy(leg.foot.parent.worldToLocal(target.clone()));
    });
    // Reduce the large counter-swing, while preserving wrist, elbow and shoulder animation.
    for (const name of ['upperarm_l', 'upperarm_r', 'spine_01', 'spine_02', 'spine_03']) {
      const node = [...nodes.keys()].find((node) => node.getName() === name);
      const object = nodes.get(node);
      // Average the walk's opposite phases for its relaxed centre, never the A-pose.
      const channel = channels.find(
        (c) => c.getTargetNode() === node && c.getTargetPath() === 'rotation',
      );
      const sampler = channel.getSampler(),
        out = sampler.getOutput();
      const cubic = sampler.getInterpolation() === 'CUBICSPLINE';
      const mid = Math.round((sampler.getInput().getCount() - 1) / 4);
      const centre = new Quaternion().fromArray(out.getElement(cubic ? 1 : 0, []));
      centre.slerp(new Quaternion().fromArray(out.getElement(cubic ? mid * 3 + 1 : mid, [])), 0.5);
      object.quaternion.slerp(centre, name.startsWith('upperarm') ? 0.32 : 0.45);
    }
    channels.forEach((channel, i) => {
      const object = nodes.get(channel.getTargetNode());
      const property = { translation: 'position', rotation: 'quaternion', scale: 'scale' }[
        channel.getTargetPath()
      ];
      values[i].push(...object[property].toArray());
    });
  }
  const buffer = document.getRoot().listBuffers()[0];
  const previousSamplers = animation.listSamplers();
  const input = document
    .createAccessor('Gallery walk times')
    .setType('SCALAR')
    .setArray(times)
    .setBuffer(buffer);
  channels.forEach((channel, i) => {
    const type = channel.getTargetPath() === 'rotation' ? 'VEC4' : 'VEC3';
    const output = document
      .createAccessor('Gallery walk poses')
      .setType(type)
      .setArray(new Float32Array(values[i]))
      .setBuffer(buffer);
    const sampler = document
      .createAnimationSampler()
      .setInput(input)
      .setOutput(output)
      .setInterpolation('LINEAR');
    animation.addSampler(sampler);
    channel.setSampler(sampler);
  });
  previousSamplers.forEach((sampler) => {
    animation.removeSampler(sampler);
    sampler.dispose();
  });
  animation.setExtras({
    metresPerSecond: 1.3 * STRIDE_SCALE,
    strideScale: STRIDE_SCALE,
    preparation: 'Shortened stride with baked two-bone leg solve, reduced hip bounce and arm swing',
  });
}
