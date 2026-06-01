/**
 * BrainWave Audio Engine
 * ──────────────────────
 * Generates scientifically precise binaural beats using the Web Audio API
 * via Tone.js, mixed with looping ambient background audio via Howler.js.
 *
 * Binaural beat principle:
 *   Left ear  → base frequency (e.g. 200 Hz)
 *   Right ear → base + beat frequency (e.g. 200 + 40 = 240 Hz)
 *   Brain perceives → 40 Hz Gamma oscillation
 *
 * Usage:
 *   const engine = new BrainWaveEngine();
 *   await engine.init();
 *   engine.setBinauralBeat(40, 200);   // 40 Hz beat, 200 Hz carrier
 *   engine.setAmbient('https://...');
 *   engine.play();
 *   engine.setBinauralVolume(0.3);
 *   engine.setAmbientVolume(0.7);
 *   engine.dispose();
 */

export interface EngineState {
  isPlaying: boolean;
  binauralVolume: number; // 0–1
  ambientVolume: number;  // 0–1
  beatFrequency: number;  // Hz (the perceived beat)
  carrierFrequency: number; // Hz (base tone)
}

export class BrainWaveEngine {
  private ctx: AudioContext | null = null;

  // Binaural oscillators
  private leftOsc: OscillatorNode | null = null;
  private rightOsc: OscillatorNode | null = null;
  private leftGain: GainNode | null = null;
  private rightGain: GainNode | null = null;
  private binauralGain: GainNode | null = null;

  // Stereo panner nodes (hard-pan L/R)
  private leftPan: StereoPannerNode | null = null;
  private rightPan: StereoPannerNode | null = null;

  // Ambient (Howler)
  private howl: any = null;
  private ambientGainLevel = 0.7;
  private ambientUrl = '';

  private _isPlaying = false;
  private _binauralVol = 0.3;
  private _beatFreq = 10;
  private _carrierFreq = 200;

  async init(): Promise<void> {
    this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    this._buildBinauralGraph();
  }

  private _buildBinauralGraph() {
    if (!this.ctx) return;

    // Master binaural gain
    this.binauralGain = this.ctx.createGain();
    this.binauralGain.gain.value = this._binauralVol;
    this.binauralGain.connect(this.ctx.destination);

    // Left channel
    this.leftPan = this.ctx.createStereoPanner();
    this.leftPan.pan.value = -1;
    this.leftPan.connect(this.binauralGain);

    this.leftGain = this.ctx.createGain();
    this.leftGain.gain.value = 0.5;
    this.leftGain.connect(this.leftPan);

    this.leftOsc = this.ctx.createOscillator();
    this.leftOsc.type = 'sine';
    this.leftOsc.frequency.value = this._carrierFreq;
    this.leftOsc.connect(this.leftGain);

    // Right channel (carrier + beat frequency)
    this.rightPan = this.ctx.createStereoPanner();
    this.rightPan.pan.value = 1;
    this.rightPan.connect(this.binauralGain);

    this.rightGain = this.ctx.createGain();
    this.rightGain.gain.value = 0.5;
    this.rightGain.connect(this.rightPan);

    this.rightOsc = this.ctx.createOscillator();
    this.rightOsc.type = 'sine';
    this.rightOsc.frequency.value = this._carrierFreq + this._beatFreq;
    this.rightOsc.connect(this.rightGain);
  }

  /** Set the binaural beat and carrier frequencies */
  setBinauralBeat(beatHz: number, carrierHz = 200) {
    this._beatFreq = beatHz;
    this._carrierFreq = carrierHz;
    if (this.leftOsc) this.leftOsc.frequency.value = carrierHz;
    if (this.rightOsc) this.rightOsc.frequency.value = carrierHz + beatHz;
  }

  /** Smoothly ramp the binaural beat frequency (useful for guided transitions) */
  rampBeat(targetHz: number, durationSec = 10) {
    if (!this.ctx || !this.rightOsc) return;
    this._beatFreq = targetHz;
    this.rightOsc.frequency.linearRampToValueAtTime(
      this._carrierFreq + targetHz,
      this.ctx.currentTime + durationSec
    );
  }

  /** Set ambient background track URL and load it */
  async setAmbient(url: string): Promise<void> {
    if (url === this.ambientUrl) return;
    this.ambientUrl = url;
    this._unloadHowl();

    const { Howl } = await import('howler');
    this.howl = new Howl({
      src: [url],
      html5: true,
      loop: true,
      volume: this.ambientGainLevel,
    });
    if (this._isPlaying) this.howl.play();
  }

  /** Set binaural beat volume (0–1) */
  setBinauralVolume(v: number) {
    this._binauralVol = v;
    if (this.binauralGain && this.ctx) {
      this.binauralGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
    }
  }

  /** Set ambient track volume (0–1) */
  setAmbientVolume(v: number) {
    this.ambientGainLevel = v;
    this.howl?.volume(v);
  }

  /** Start playback */
  play() {
    if (this._isPlaying || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.leftOsc?.start();
    this.rightOsc?.start();
    this.howl?.play();
    this._isPlaying = true;
  }

  /** Pause all audio */
  pause() {
    if (!this._isPlaying) return;
    // Oscillators can't be paused — mute them instead
    if (this.binauralGain && this.ctx) {
      this.binauralGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
    }
    this.howl?.pause();
    this._isPlaying = false;
  }

  /** Resume from pause */
  resume() {
    if (this._isPlaying || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (this.binauralGain) {
      this.binauralGain.gain.setTargetAtTime(this._binauralVol, this.ctx.currentTime, 0.1);
    }
    this.howl?.play();
    this._isPlaying = true;
  }

  get isPlaying() { return this._isPlaying; }
  get beatFrequency() { return this._beatFreq; }
  get carrierFrequency() { return this._carrierFreq; }
  get binauralVolume() { return this._binauralVol; }
  get ambientVolume() { return this.ambientGainLevel; }

  private _unloadHowl() {
    if (this.howl) {
      this.howl.stop();
      this.howl.unload();
      this.howl = null;
    }
  }

  /** Clean up all resources */
  dispose() {
    this.pause();
    this._unloadHowl();
    try {
      this.leftOsc?.stop();
      this.rightOsc?.stop();
    } catch { /* already stopped */ }
    this.ctx?.close();
    this.ctx = null;
  }
}
