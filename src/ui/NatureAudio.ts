import { assetUrl } from '../content/museumContent';

export type SoundPose = (
  x: number,
  y: number,
  z: number,
  dx: number,
  dy: number,
  dz: number,
) => void;

/** A small native Web Audio graph. No audio worklet, convolution or per-frame allocations. */
export class NatureAudio {
  readonly context = new AudioContext();
  private master = this.context.createGain();
  private woodland = this.context.createGain();
  private filter = this.context.createBiquadFilter();
  private limiter = this.context.createDynamicsCompressor();
  private music = new Audio(assetUrl('audio/music.ogg'));
  private sources = new Set<AudioBufferSourceNode>();
  private abort = new AbortController();
  private loading?: Promise<void>;
  private ready = false;
  private wanted = false;
  private disposed = false;
  private level = 0.35;
  private birds?: AudioBuffer;
  private bird?: AudioBufferSourceNode;
  private birdTimer?: ReturnType<typeof setTimeout>;
  private suspendTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.master.gain.value = 0;
    this.woodland.gain.value = 0.6;
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 3500;
    this.woodland.connect(this.filter).connect(this.master);
    // Only catches occasional coincident peaks at high volume; no heavy effects.
    this.limiter.threshold.value = -6;
    this.limiter.knee.value = 6;
    this.limiter.ratio.value = 12;
    this.limiter.attack.value = 0.003;
    this.limiter.release.value = 0.15;
    this.master.connect(this.limiter).connect(this.context.destination);
    // Stream the three-minute track instead of decoding it into a large PCM buffer.
    this.music.preload = 'none';
    this.music.loop = true;
    const musicGain = this.context.createGain();
    musicGain.gain.value = 0.65;
    this.context.createMediaElementSource(this.music).connect(musicGain).connect(this.master);
  }

  private async load() {
    const buffers = await Promise.all(
      ['birds', 'wind', 'river'].map(async (name) => {
        const response = await fetch(assetUrl(`audio/${name}.ogg`), { signal: this.abort.signal });
        if (!response.ok) throw new Error(`Could not load ${name}`);
        return this.context.decodeAudioData(await response.arrayBuffer());
      }),
    );
    if (this.disposed) return;
    const loop = (buffer: AudioBuffer, volume: number, destination: AudioNode) => {
      const source = this.context.createBufferSource(),
        gain = this.context.createGain();
      source.buffer = buffer;
      source.loop = true;
      gain.gain.value = volume;
      source.connect(gain).connect(destination);
      source.start(0, Math.random() * buffer.duration);
      this.sources.add(source);
    };
    this.birds = buffers[0];
    loop(buffers[1], 0.22, this.woodland);
    // Equal-power panning is much cheaper than HRTF; both water sources share one decoded buffer.
    for (const [x, z, volume] of [
      [0, 0, 0.18],
      [33, -22, 0.12],
    ]) {
      const panner = this.context.createPanner();
      panner.panningModel = 'equalpower';
      panner.distanceModel = 'inverse';
      panner.refDistance = 4;
      panner.rolloffFactor = 1.5;
      panner.maxDistance = 70;
      panner.positionX.value = x;
      panner.positionY.value = 0.3;
      panner.positionZ.value = z;
      panner.connect(this.master);
      loop(buffers[2], volume, panner);
    }
    this.ready = true;
  }

  private scheduleBirds(first = false) {
    clearTimeout(this.birdTimer);
    this.birdTimer = setTimeout(
      () => {
        if (this.disposed || !this.wanted || document.hidden) return;
        if (this.birds && this.context.state === 'running') {
          const source = this.context.createBufferSource(),
            gain = this.context.createGain();
          const pan = this.context.createStereoPanner(),
            now = this.context.currentTime;
          source.buffer = this.birds;
          const duration = 4 + Math.random() * 2;
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.18, now + 1.2);
          gain.gain.setValueAtTime(0.18, now + duration - 1.5);
          gain.gain.linearRampToValueAtTime(0, now + duration - 0.05);
          pan.pan.value = Math.random() * 1.2 - 0.6;
          source.connect(gain).connect(pan).connect(this.woodland);
          this.sources.add(source);
          this.bird = source;
          source.onended = () => {
            this.sources.delete(source);
            if (this.bird === source) this.bird = undefined;
            source.disconnect();
            gain.disconnect();
            pan.disconnect();
          };
          source.start(now, Math.random() * (this.birds.duration - duration), duration);
        }
        this.scheduleBirds();
      },
      first ? 35000 + Math.random() * 25000 : 65000 + Math.random() * 30000,
    );
  }

  async enable(value: boolean) {
    this.wanted = value;
    clearTimeout(this.suspendTimer);
    if (!value) {
      clearTimeout(this.birdTimer);
      this.master.gain.setTargetAtTime(0, this.context.currentTime, 0.05);
      this.suspendTimer = setTimeout(() => {
        if (!this.wanted && !this.disposed) {
          this.music.pause();
          this.bird?.stop();
          void this.context.suspend();
        }
      }, 250);
      return;
    }
    // Called directly from the click handler, before fetching or awaiting anything.
    await Promise.all([this.context.resume(), this.music.play()]);
    if (!this.ready) {
      this.loading ??= this.load().catch((error) => {
        this.loading = undefined;
        throw error;
      });
      await this.loading;
    }
    if (this.wanted && !this.disposed && !document.hidden) {
      this.master.gain.setTargetAtTime(this.level, this.context.currentTime, 0.8);
      this.scheduleBirds(true);
    } else if (!this.disposed) {
      this.music.pause();
      await this.context.suspend();
    }
  }

  setVolume(value: number) {
    this.level = Math.max(0, Math.min(1, value));
    if (this.wanted) this.master.gain.setTargetAtTime(this.level, this.context.currentTime, 0.15);
  }

  updateListener: SoundPose = (x, y, z, dx, dy, dz) => {
    if (!this.wanted || this.disposed) return;
    const listener = this.context.listener,
      now = this.context.currentTime;
    if (listener.positionX) {
      [
        listener.positionX,
        listener.positionY,
        listener.positionZ,
        listener.forwardX,
        listener.forwardY,
        listener.forwardZ,
      ].forEach((param, i) => param.setTargetAtTime([x, y, z, dx, dy, dz][i], now, 0.1));
    } else {
      listener.setPosition(x, y, z);
      listener.setOrientation(dx, dy, dz, 0, 1, 0);
    }
    // Near glazed exterior walls, the surrounding woodland is clearer. Interior transitions are gradual.
    const edge = z > 12 ? Math.min(10 - Math.abs(x), 28 - z) : Math.min(30 - Math.abs(x), 12 - z);
    const openness = Math.max(0, Math.min(1, (8 - edge) / 8));
    this.woodland.gain.setTargetAtTime(0.6 + openness * 0.15, now, 0.7);
    this.filter.frequency.setTargetAtTime(2800 + openness * 4200, now, 0.7);
  };

  visibility() {
    if (document.hidden) {
      clearTimeout(this.birdTimer);
      this.bird?.stop();
      this.music.pause();
      void this.context.suspend();
    } else if (this.wanted) {
      void Promise.all([this.context.resume(), this.music.play()]).catch(() => undefined);
      if (this.ready) this.scheduleBirds(true);
    }
  }

  dispose() {
    this.disposed = true;
    this.wanted = false;
    this.abort.abort();
    clearTimeout(this.birdTimer);
    clearTimeout(this.suspendTimer);
    for (const source of this.sources) {
      source.stop();
      source.disconnect();
    }
    this.sources.clear();
    this.music.pause();
    this.music.removeAttribute('src');
    this.music.load();
    void this.context.close();
  }
}
