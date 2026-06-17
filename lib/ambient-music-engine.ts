/**
 * Ambient Music Engine v2 — Brain.fm-class generative audio
 *
 * Two pillars of "richness" that v1 lacked:
 *
 *  1. NEURAL PHASE-LOCKING (the Brain.fm secret sauce)
 *     Brain.fm doesn't rely on binaural beats — it modulates the AMPLITUDE of
 *     the music itself at the target brainwave frequency (beta ~16 Hz focus,
 *     alpha ~10 Hz relax, delta ~2-3 Hz sleep, theta ~6 Hz meditation),
 *     applied to both channels. We add a Tremolo (sine AM, spread 0 = identical
 *     L/R) at the entrainment rate.
 *
 *     IMPORTANT: the AM is applied ONLY to the moving "rhythm bus" (arp / melody
 *     / bass / sub). The sustained pad + air bed runs through a separate, fully
 *     UNmodulated "smooth bus", so there is always continuous sound filling the
 *     troughs of the pulse. This keeps the music smooth and the beat subtle
 *     while the entrainment still rides on the rhythmic content.
 *
 *  2. LAYERING + EVOLUTION
 *     v1 had 4 thin voices that looped identically forever. v2 adds:
 *       - sub-bass octave under the bass for fullness
 *       - chorus + stereo widening on pads for a lush, wide bed
 *       - a high "air/shimmer" layer that swells on each chord
 *       - a slow filter LFO so the pad timbre breathes over time
 *       - master compressor + limiter for glue and consistent loudness
 *
 * Signal chains:
 *   Pad    → filter (slow LFO) → chorus → padReverb ─┐
 *   Air    → ───────────────────────────→ padReverb ─┴→ smoothBus ──────────────┐
 *                                                                                │
 *   Arp    → delay → arpReverb ─┐                                                │
 *   Melody → melReverb ─────────┼→ ammedBus → NEURAL AM (Tremolo @ entrainHz) ───┤
 *   Bass   → ───────────────────┤                                                │
 *   Sub    → ───────────────────┘                                                │
 *                                                                                ▼
 *                          masterVol → stereoWidener → compressor → limiter → out
 */

import type { MentalState } from '@/types';

// ─── Profile types ────────────────────────────────────────────────────────────

/** One chord in a progression */
export interface ChordDef {
  voicing:  string[];  // pad notes   e.g. ["D3","F3","A3","C4"]
  bass:     string;    // bass note   e.g. "D2"
  arpNotes: string[];  // arpeggio note pool (higher register)
}

export interface MusicProfile {
  bpm:              number;
  chords:           ChordDef[];
  barsPerChord:     number;     // bars before chord change
  arpeggioSubdiv:   string;     // Tone.js subdivision "8n" | "16n" | "4n"
  arpeggioEnabled:  boolean;
  bassEnabled:      boolean;    // pulse bass on beats 1 & 3
  melodyScale:      string[];   // Tone.js note names for melody
  melodyPhraseBars: number;     // bars between melody phrases (0 = disabled)
  melodyEnabled:    boolean;
  padAttack:        number;     // seconds (keep ≤ 2 so chord is audible)
  padRelease:       number;
  reverbDecay:      number;
  masterVolume:     number;     // dB target at user volume = 1
  // ── Neural phase-locking ──
  entrainmentHz:    number;     // amplitude-modulation rate (target brainwave)
  amDepth:          number;     // 0–1 modulation depth (keep subtle: 0.2–0.35)
  description:      string;
}

// ─── Per-state profiles ───────────────────────────────────────────────────────

export const MUSIC_PROFILES: Record<MentalState, MusicProfile> = {
  focus: {
    bpm: 72,
    chords: [
      { voicing:["D3","F3","A3","C4"], bass:"D2", arpNotes:["D4","F4","A4","C5","D5"] },
      { voicing:["A2","C3","E3","G3"], bass:"A2", arpNotes:["A3","C4","E4","G4","A4"] },
      { voicing:["C3","E3","G3","B3"], bass:"C3", arpNotes:["C4","E4","G4","B4","C5"] },
      { voicing:["G2","B2","D3","F3"], bass:"G2", arpNotes:["G3","B3","D4","F4","G4"] },
    ],
    barsPerChord: 4, arpeggioSubdiv:"8n", arpeggioEnabled:true, bassEnabled:true,
    melodyScale:["D4","E4","F4","G4","A4","C5","D5","E5"],
    melodyPhraseBars:8, melodyEnabled:true,
    padAttack:1.5, padRelease:4, reverbDecay:4, masterVolume:-5,
    entrainmentHz:16, amDepth:0.16,
    description:"D Dorian — arpeggio-driven focus flow, 16 Hz beta entrainment",
  },

  learning: {
    bpm: 66,
    chords: [
      { voicing:["F3","A3","C4","E4"], bass:"F2", arpNotes:["F4","A4","C5","E5","F5"] },
      { voicing:["C3","E3","G3","B3"], bass:"C3", arpNotes:["C4","E4","G4","B4","C5"] },
      { voicing:["G3","B3","D4","F4"], bass:"G2", arpNotes:["G3","B3","D4","F4","G4"] },
      { voicing:["A2","C3","E3","G3"], bass:"A2", arpNotes:["A3","C4","E4","G4","A4"] },
    ],
    barsPerChord: 4, arpeggioSubdiv:"8n", arpeggioEnabled:true, bassEnabled:true,
    melodyScale:["F4","G4","A4","Bb4","C5","D5","F5"],
    melodyPhraseBars:6, melodyEnabled:true,
    padAttack:1.2, padRelease:3.5, reverbDecay:4, masterVolume:-5,
    entrainmentHz:14, amDepth:0.16,
    description:"F major — warm and open, 14 Hz beta supports memory",
  },

  relaxation: {
    bpm: 56,
    chords: [
      { voicing:["G3","B3","D4","F4"],  bass:"G2", arpNotes:["G4","B4","D5","F5","G5"] },
      { voicing:["D3","F3","A3","C4"],  bass:"D3", arpNotes:["D4","F4","A4","C5","D5"] },
      { voicing:["E3","G3","B3","D4"],  bass:"E3", arpNotes:["E4","G4","B4","D5","E5"] },
      { voicing:["C3","E3","G3","B3"],  bass:"C3", arpNotes:["C4","E4","G4","B4","C5"] },
    ],
    barsPerChord: 6, arpeggioSubdiv:"8n", arpeggioEnabled:true, bassEnabled:false,
    melodyScale:["G4","A4","B4","D5","E5","G5"],
    melodyPhraseBars:10, melodyEnabled:true,
    padAttack:2, padRelease:5, reverbDecay:7, masterVolume:-6,
    entrainmentHz:10, amDepth:0.14,
    description:"G major — gentle arpeggio, 10 Hz alpha calm",
  },

  sleep: {
    bpm: 44,
    chords: [
      { voicing:["C3","E3","G3","B3"], bass:"C2", arpNotes:["C4","E4","G4","B4"] },
      { voicing:["F3","A3","C4","E4"], bass:"F2", arpNotes:["F4","A4","C5","E5"] },
      { voicing:["A2","C3","E3","G3"], bass:"A2", arpNotes:["A3","C4","E4","G4"] },
      { voicing:["G2","B2","D3","F3"], bass:"G2", arpNotes:["G3","B3","D4","F4"] },
    ],
    barsPerChord: 8, arpeggioSubdiv:"4n", arpeggioEnabled:true, bassEnabled:false,
    melodyScale:[], melodyPhraseBars:0, melodyEnabled:false,
    padAttack:4, padRelease:8, reverbDecay:10, masterVolume:-8,
    entrainmentHz:2.5, amDepth:0.16,
    description:"C major — slow dreamlike drift, 2.5 Hz delta",
  },

  'mood-boost': {
    bpm: 95,
    chords: [
      { voicing:["E3","G#3","B3","D#4"],  bass:"E2",  arpNotes:["E4","G#4","B4","D#5","E5"] },
      { voicing:["A3","C#4","E4","G#4"],  bass:"A2",  arpNotes:["A4","C#5","E5","G#5"]      },
      { voicing:["B3","D#4","F#4","A4"],  bass:"B2",  arpNotes:["B4","D#5","F#5","A5"]      },
      { voicing:["C#3","E3","G#3","B3"],  bass:"C#3", arpNotes:["C#5","E5","G#5","B5"]      },
    ],
    barsPerChord: 3, arpeggioSubdiv:"16n", arpeggioEnabled:true, bassEnabled:true,
    melodyScale:["E4","F#4","G#4","A4","B4","C#5","D#5","E5"],
    melodyPhraseBars:4, melodyEnabled:true,
    padAttack:0.8, padRelease:2, reverbDecay:3, masterVolume:-4,
    entrainmentHz:12, amDepth:0.18,
    description:"E major — energetic 16th arpeggio, 12 Hz uplift",
  },

  meditation: {
    bpm: 50,
    chords: [
      { voicing:["A2","E3","A3","C4"], bass:"A1", arpNotes:["A3","C4","E4","A4"] },
      { voicing:["D3","F3","A3","C4"], bass:"D2", arpNotes:["D4","F4","A4","C5"] },
      { voicing:["E3","G3","B3","D4"], bass:"E2", arpNotes:["E4","G4","B4","D5"] },
      { voicing:["A2","C3","E3","G3"], bass:"A2", arpNotes:["A3","C4","E4","G4"] },
    ],
    barsPerChord: 8, arpeggioSubdiv:"4n", arpeggioEnabled:true, bassEnabled:false,
    melodyScale:["A4","C5","D5","E5","G5","A5"],
    melodyPhraseBars:12, melodyEnabled:true,
    padAttack:3, padRelease:7, reverbDecay:10, masterVolume:-7,
    entrainmentHz:6, amDepth:0.14,
    description:"A minor — deep resonance, 6 Hz theta",
  },

  'anxiety-relief': {
    bpm: 54,
    chords: [
      { voicing:["F3","A3","C4","E4"], bass:"F2", arpNotes:["F4","A4","C5","E5","F5"] },
      { voicing:["C3","E3","G3","B3"], bass:"C3", arpNotes:["C4","E4","G4","B4","C5"] },
      { voicing:["A2","C3","E3","G3"], bass:"A2", arpNotes:["A3","C4","E4","G4","A4"] },
      { voicing:["G2","B2","D3","F3"], bass:"G2", arpNotes:["G3","B3","D4","F4","G4"] },
    ],
    barsPerChord: 6, arpeggioSubdiv:"8n", arpeggioEnabled:true, bassEnabled:false,
    melodyScale:["F4","G4","A4","C5","D5","F5"],
    melodyPhraseBars:10, melodyEnabled:true,
    padAttack:2.5, padRelease:6, reverbDecay:8, masterVolume:-6,
    entrainmentHz:10, amDepth:0.13,
    description:"F major — steady, predictable, 10 Hz alpha soothes anxiety",
  },
};

// ─── Engine ───────────────────────────────────────────────────────────────────

export class AmbientMusicEngine {
  private Tone: any = null;

  // Instruments
  private arpeggioSynth: any = null;
  private padSynth:      any = null;
  private airSynth:      any = null;   // high shimmer layer
  private melodySynth:   any = null;
  private bassSynth:     any = null;
  private subSynth:      any = null;   // octave-below sub bass

  // Transport-synchronized patterns / loops
  private arpeggioPattern: any = null;   // Tone.Pattern → upDown arpeggio
  private chordLoop:       any = null;   // Tone.Loop  → chord change every bar
  private melodyLoop:      any = null;   // Tone.Loop  → melody phrase every N bars
  private bassLoop:        any = null;   // Tone.Loop  → bass pulse every beat

  // Effects / master chain
  private arpDelay:    any = null;
  private arpReverb:   any = null;
  private padFilter:   any = null;
  private padFilterLFO:any = null;   // slow movement on pad timbre
  private padChorus:   any = null;
  private padReverb:   any = null;
  private melReverb:   any = null;
  private smoothBus:   any = null;   // pads + air → unmodulated (always continuous)
  private ammedBus:    any = null;   // arp + melody + bass + sub → AM applied here
  private masterVol:   any = null;
  private widener:     any = null;
  private tremolo:     any = null;   // ── neural phase-locking AM ──
  private comp:        any = null;
  private limiter:     any = null;

  private profile:   MusicProfile | null = null;
  private chordIdx = 0;
  private barCount = 0;
  private _isPlaying = false;
  private _volume    = 0.7;

  // ── Public API ──────────────────────────────────────────────────────────────

  async init(mentalState: MentalState): Promise<void> {
    this.Tone   = await import('tone');
    const T     = this.Tone;
    this.profile = MUSIC_PROFILES[mentalState];
    const p      = this.profile;

    await T.start();
    T.getTransport().bpm.value = p.bpm;

    // ── Master output chain ──────────────────────────────────────────────────
    //   smoothBus (pads) ─────────────────────────┐
    //   ammedBus (rhythm) → tremolo(AM) ──────────┴→ masterVol → widener → comp → limiter → out
    this.limiter = new T.Limiter(-1);
    this.limiter.toDestination();

    this.comp = new T.Compressor({ threshold: -18, ratio: 3, attack: 0.05, release: 0.25 });
    this.comp.connect(this.limiter);

    this.widener = new T.StereoWidener(0.6);
    this.widener.connect(this.comp);

    this.masterVol = new T.Volume(-60); // start silent; play() fades in
    this.masterVol.connect(this.widener);

    // smoothBus: continuous, UNmodulated pad/air bed → fills the AM troughs
    this.smoothBus = new T.Gain(1);
    this.smoothBus.connect(this.masterVol);

    // Neural phase-locking: amplitude modulation at the target brainwave rate,
    // applied ONLY to the rhythm bus. spread:0 → identical L/R (true AM, both channels).
    this.tremolo = new T.Tremolo({
      frequency: p.entrainmentHz,
      depth: p.amDepth,
      spread: 0,
      type: 'sine',
    }).start();
    this.tremolo.connect(this.masterVol);

    // ammedBus: arp + melody + bass + sub feed the modulated path
    this.ammedBus = new T.Gain(1);
    this.ammedBus.connect(this.tremolo);

    // ── Pad effects: filter (slow LFO) → chorus → reverb → smooth bus ────────
    this.padReverb = new T.Reverb({ decay: p.reverbDecay, wet: 0.55, preDelay: 0.02 });
    await this.padReverb.ready;
    this.padReverb.connect(this.smoothBus);

    this.padChorus = new T.Chorus({ frequency: 0.6, delayTime: 3.5, depth: 0.7, wet: 0.4 }).start();
    this.padChorus.connect(this.padReverb);

    this.padFilter = new T.Filter({ frequency: 1600, type: 'lowpass', rolloff: -24 });
    this.padFilter.connect(this.padChorus);

    // Slow LFO breathes the filter cutoff so the pad timbre evolves over ~30 s
    this.padFilterLFO = new T.LFO({ frequency: 0.035, min: 750, max: 2100, type: 'sine' }).start();
    this.padFilterLFO.connect(this.padFilter.frequency);

    // ── Arpeggio effects: delay → reverb ────────────────────────────────────
    this.arpReverb = new T.Reverb({ decay: p.reverbDecay * 0.6, wet: 0.45 });
    await this.arpReverb.ready;
    this.arpReverb.connect(this.ammedBus);

    this.arpDelay = new T.FeedbackDelay({ delayTime: '8n', feedback: 0.3, wet: 0.25 });
    this.arpDelay.connect(this.arpReverb);

    // ── Melody reverb ────────────────────────────────────────────────────────
    this.melReverb = new T.Reverb({ decay: p.reverbDecay * 0.5, wet: 0.5 });
    await this.melReverb.ready;
    this.melReverb.connect(this.ammedBus);

    // ── Pad synth — fatsawtooth for rich, lush chords ───────────────────────
    this.padSynth = new T.PolySynth(T.Synth, {
      oscillator: { type: 'fatsawtooth', count: 2, spread: 18 },
      envelope: { attack: p.padAttack, decay: 1.2, sustain: 0.85, release: p.padRelease },
      volume: -10,
    });
    this.padSynth.connect(this.padFilter);

    // ── Air synth — high shimmer that swells on each chord ──────────────────
    this.airSynth = new T.PolySynth(T.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: Math.max(2, p.padAttack), decay: 2, sustain: 0.6, release: Math.max(4, p.padRelease) },
      volume: -24,
    });
    this.airSynth.connect(this.padReverb);

    // ── Arpeggio synth — triangle, clean, melodic ───────────────────────────
    if (p.arpeggioEnabled) {
      this.arpeggioSynth = new T.PolySynth(T.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.02, decay: 0.15, sustain: 0.25, release: 2.5 },
        volume: -8,   // arpeggio is the main melody vehicle — keep it present
      });
      this.arpeggioSynth.connect(this.arpDelay);
    }

    // ── Bass + sub — sine, deep, subtle ─────────────────────────────────────
    if (p.bassEnabled) {
      this.bassSynth = new T.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.05, decay: 0.25, sustain: 0.5, release: 0.4 },
        volume: -14,
      });
      this.bassSynth.connect(this.ammedBus);

      this.subSynth = new T.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.08, decay: 0.3, sustain: 0.6, release: 0.5 },
        volume: -18,
      });
      this.subSynth.connect(this.ammedBus);
    }

    // ── Melody synth — triangle, expressive ─────────────────────────────────
    if (p.melodyEnabled && p.melodyScale.length > 0) {
      this.melodySynth = new T.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.25, decay: 0.6, sustain: 0.45, release: 2.2 },
        volume: -12,
      });
      this.melodySynth.connect(this.melReverb);
    }

    // ── Build Transport-synchronized patterns ───────────────────────────────
    this._buildPatterns();
  }

  play(): void {
    if (this._isPlaying || !this.profile || !this.Tone) return;
    this._isPlaying = true;

    // Fade in master volume
    this.masterVol?.volume.rampTo(this._dbAtVolume(), 2);

    // Trigger initial pad chord immediately
    this._triggerPadChord(this.profile.chords[0], this.Tone.now() + 0.1);

    // Start Transport — this drives ALL Tone.Pattern / Tone.Loop instances
    const T = this.Tone;
    T.getTransport().start('+0.05');

    // Start patterns at Transport position 0
    this.arpeggioPattern?.start(0);
    this.chordLoop?.start(0);
    this.bassLoop?.start(0);

    // Delay first melody phrase so the chord/arp establish themselves first
    if (this.melodyLoop && this.profile.melodyEnabled) {
      const delayBars = Math.max(4, this.profile.melodyPhraseBars);
      this.melodyLoop.start(`${delayBars}m`);
    }
  }

  pause(): void {
    if (!this._isPlaying) return;
    this._isPlaying = false;
    // Mute without stopping Transport — chord position is preserved for resume
    this.masterVol?.volume.rampTo(-60, 1.5);
  }

  resume(): void {
    if (this._isPlaying || !this.profile) return;
    this._isPlaying = true;
    this.masterVol?.volume.rampTo(this._dbAtVolume(), 1.5);
  }

  /** volume 0–1 */
  setVolume(v: number): void {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.masterVol && this.profile && this._isPlaying) {
      this.masterVol.volume.rampTo(this._dbAtVolume(), 0.4);
    }
  }

  get isPlaying() { return this._isPlaying; }
  get volume()    { return this._volume; }

  dispose(): void {
    this._isPlaying = false;
    try { this.Tone?.getTransport().stop(); } catch { /* ignore */ }

    this.arpeggioPattern?.stop(0);
    this.chordLoop?.stop(0);
    this.bassLoop?.stop(0);
    this.melodyLoop?.stop(0);

    setTimeout(() => {
      try {
        this.arpeggioPattern?.dispose();
        this.chordLoop?.dispose();
        this.bassLoop?.dispose();
        this.melodyLoop?.dispose();
        this.arpeggioSynth?.dispose();
        this.padSynth?.dispose();
        this.airSynth?.dispose();
        this.melodySynth?.dispose();
        this.bassSynth?.dispose();
        this.subSynth?.dispose();
        this.arpDelay?.dispose();
        this.arpReverb?.dispose();
        this.padFilterLFO?.dispose();
        this.padFilter?.dispose();
        this.padChorus?.dispose();
        this.padReverb?.dispose();
        this.melReverb?.dispose();
        this.smoothBus?.dispose();
        this.ammedBus?.dispose();
        this.masterVol?.dispose();
        this.widener?.dispose();
        this.tremolo?.dispose();
        this.comp?.dispose();
        this.limiter?.dispose();
      } catch { /* ignore */ }
    }, 500);
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  private _buildPatterns(): void {
    if (!this.profile || !this.Tone) return;
    const T = this.Tone;
    const p = this.profile;

    // ── Arpeggio: Tone.Pattern "upDown" — the main melodic engine ────────────
    if (p.arpeggioEnabled && this.arpeggioSynth) {
      this.arpeggioPattern = new T.Pattern(
        (time: number, note: string) => {
          if (!this._isPlaying) return;
          this.arpeggioSynth.triggerAttackRelease(note, p.arpeggioSubdiv, time);
        },
        [...p.chords[0].arpNotes],
        'upDown'
      );
      this.arpeggioPattern.interval = p.arpeggioSubdiv;
    }

    // ── Chord change loop — fires every bar, rotates chord every N bars ──────
    this.barCount = 0;
    this.chordIdx = 0;
    this.chordLoop = new T.Loop((time: number) => {
      this.barCount++;
      if (this.barCount % p.barsPerChord === 0) {
        this.chordIdx = (this.chordIdx + 1) % p.chords.length;
        const chord = p.chords[this.chordIdx];

        // Update arpeggio note pool so it tracks the new chord
        if (this.arpeggioPattern) {
          this.arpeggioPattern.values = [...chord.arpNotes];
        }

        // Trigger new pad voicing (+ air shimmer)
        this._triggerPadChord(chord, time);

        // Bass + sub hit on chord change
        if (this.bassSynth) {
          this.bassSynth.triggerAttackRelease(chord.bass, '4n', time);
          this._triggerSub(chord.bass, '4n', time);
        }
      }
    }, '1m'); // fires every 1 measure

    // ── Bass loop — pulse on beats 1 & 3 for rhythmic grounding ──────────────
    if (p.bassEnabled && this.bassSynth) {
      let beat = 0;
      this.bassLoop = new T.Loop((time: number) => {
        if (!this._isPlaying) return;
        if (beat % 2 === 0) { // beats 1 and 3 of a 4-beat bar
          const chord = p.chords[this.chordIdx];
          this.bassSynth.triggerAttackRelease(chord.bass, '8n', time);
          this._triggerSub(chord.bass, '8n', time);
        }
        beat++;
      }, '4n'); // fires every quarter note
    }

    // ── Melody loop — plays a 4–6 note stepwise phrase every N bars ──────────
    if (p.melodyEnabled && this.melodySynth && p.melodyScale.length > 0) {
      this.melodyLoop = new T.Loop((time: number) => {
        if (!this._isPlaying) return;
        this._playMelodyPhrase(time);
      }, `${p.melodyPhraseBars}m`);
    }
  }

  /** Trigger a pad chord voicing with slight note stagger + high air shimmer */
  private _triggerPadChord(chord: ChordDef, contextTime: number): void {
    if (this.padSynth) {
      this.padSynth.releaseAll();
      chord.voicing.forEach((note, i) => {
        const t = contextTime + i * 0.09;
        try { this.padSynth.triggerAttack(note, t); } catch { /* disposed */ }
      });
    }
    // Air shimmer: top two voices an octave up, very quiet, long swell
    if (this.airSynth) {
      this.airSynth.releaseAll();
      const top = chord.voicing.slice(-2).map((n) => this._octaveUp(n)).filter(Boolean);
      top.forEach((note) => {
        try { this.airSynth.triggerAttack(note, contextTime); } catch { /* disposed */ }
      });
    }
  }

  /** Trigger the sub-bass an octave below the given bass note */
  private _triggerSub(bassNote: string, dur: string, time: number): void {
    if (!this.subSynth) return;
    const sub = this._octaveDown(bassNote);
    if (!sub) return;
    try { this.subSynth.triggerAttackRelease(sub, dur, time); } catch { /* disposed */ }
  }

  private _octaveUp(note: string): string {
    try { return this.Tone.Frequency(note).transpose(12).toNote(); } catch { return note; }
  }

  private _octaveDown(note: string): string {
    try { return this.Tone.Frequency(note).transpose(-12).toNote(); } catch { return note; }
  }

  /** Generate a stepwise 4–6 note melodic phrase */
  private _playMelodyPhrase(startTime: number): void {
    if (!this.profile || !this.melodySynth) return;
    const scale = this.profile.melodyScale;
    if (!scale.length) return;

    const qn  = 60 / this.profile.bpm;  // quarter-note duration in seconds
    const num = 4 + Math.floor(Math.random() * 3); // 4–6 notes

    // Start near the center of the scale
    let idx = Math.floor(scale.length / 2) + Math.floor(Math.random() * 2) - 1;
    idx     = Math.max(0, Math.min(scale.length - 1, idx));

    let elapsed = 0;
    for (let i = 0; i < num; i++) {
      const noteTime = startTime + elapsed * qn;
      const dur      = Math.random() < 0.35 ? '8n' : '4n'; // mix of 8th and quarter notes
      const durSec   = dur === '8n' ? qn * 0.5 : qn;

      try {
        this.melodySynth.triggerAttackRelease(scale[idx], dur, noteTime);
      } catch { /* disposed */ }

      elapsed += durSec / qn; // advance time

      // Stepwise motion with occasional small leap
      if (i < num - 1) {
        const r = Math.random();
        const step = r < 0.55 ? (Math.random() < 0.5 ? 1 : -1)   // step ±1
                   : r < 0.85 ? (Math.random() < 0.5 ? 2 : -2)   // leap ±2
                   :             0;                                 // repeat
        idx = Math.max(0, Math.min(scale.length - 1, idx + step));
      }
    }
  }

  private _dbAtVolume(): number {
    if (!this.profile || this._volume <= 0) return -60;
    // Linear: v=1 → profile.masterVolume, v=0 → -60
    return -60 + this._volume * (this.profile.masterVolume + 60);
  }
}
