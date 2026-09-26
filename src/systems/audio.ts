/**
 * Fully procedural audio engine (Web Audio API). No sound files required.
 * Wind, snow footsteps, ice cracks, distant church bells and a sparse melancholic piano,
 * with deliberate long silences between musical phrases.
 */
type Surface = 'snow' | 'ice' | 'wood';

class AudioEngine {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private amb!: GainNode;
  private music!: GainNode;
  private sfx!: GainNode;
  private reverbIn!: GainNode;
  private indoorLP!: GainNode & { f?: BiquadFilterNode };
  private windLP!: BiquadFilterNode;
  private noise!: AudioBuffer;
  private timers: number[] = [];
  private volume = 0.8;
  private muted = false;

  init() {
    if (this.ctx) { void this.ctx.resume(); return; }
    const C: typeof AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!C) return;
    const ctx = new C();
    this.ctx = ctx;
    this.master = ctx.createGain(); this.master.gain.value = this.muted ? 0 : this.volume;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3;
    this.master.connect(comp).connect(ctx.destination);
    this.amb = ctx.createGain(); this.amb.gain.value = 1; this.amb.connect(this.master);
    this.music = ctx.createGain(); this.music.gain.value = 0.55; this.music.connect(this.master);
    this.sfx = ctx.createGain(); this.sfx.gain.value = 0.8; this.sfx.connect(this.master);
    const conv = ctx.createConvolver(); conv.buffer = this.impulse(3.8, 2.6);
    this.reverbIn = ctx.createGain(); this.reverbIn.gain.value = 0.9;
    const wet = ctx.createGain(); wet.gain.value = 0.55;
    this.reverbIn.connect(conv).connect(wet).connect(this.master);
    this.noise = this.makeNoise(3);
    this.startWind();
    this.scheduleBells(18000);
    this.schedulePiano(7000);
  }

  private makeNoise(sec: number) {
    const ctx = this.ctx!; const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate);
    const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  private impulse(sec: number, decay: number) {
    const ctx = this.ctx!; const len = ctx.sampleRate * sec; const b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return b;
  }

  private startWind() {
    const ctx = this.ctx!;
    this.windLP = ctx.createBiquadFilter(); this.windLP.type = 'lowpass'; this.windLP.frequency.value = 9000;
    this.windLP.connect(this.amb);
    // Howl: band-passed noise with a slowly wandering centre frequency.
    const src = ctx.createBufferSource(); src.buffer = this.noise; src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 480; bp.Q.value = 2.2;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.045; const lfoG = ctx.createGain(); lfoG.gain.value = 260;
    lfo.connect(lfoG).connect(bp.frequency);
    const g = ctx.createGain(); g.gain.value = 0.22;
    const gust = ctx.createOscillator(); gust.frequency.value = 0.09; const gustG = ctx.createGain(); gustG.gain.value = 0.14;
    gust.connect(gustG).connect(g.gain);
    src.connect(bp).connect(g).connect(this.windLP);
    // Second, whistling howl
    const bp2 = ctx.createBiquadFilter(); bp2.type = 'bandpass'; bp2.frequency.value = 900; bp2.Q.value = 9;
    const lfo2 = ctx.createOscillator(); lfo2.frequency.value = 0.07; const lfo2G = ctx.createGain(); lfo2G.gain.value = 380;
    lfo2.connect(lfo2G).connect(bp2.frequency);
    const g2 = ctx.createGain(); g2.gain.value = 0.05; src.connect(bp2).connect(g2).connect(this.windLP);
    // Snow hiss and low rumble
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3200;
    const g3 = ctx.createGain(); g3.gain.value = 0.025; src.connect(hp).connect(g3).connect(this.windLP);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 140;
    const g4 = ctx.createGain(); g4.gain.value = 0.35; src.connect(lp).connect(g4).connect(this.windLP);
    [src, lfo, gust, lfo2].forEach((n) => n.start());
  }

  setIndoor(indoor: boolean) {
    if (!this.ctx) return; const t = this.ctx.currentTime;
    this.windLP.frequency.setTargetAtTime(indoor ? 420 : 9000, t, 0.35);
    this.amb.gain.setTargetAtTime(indoor ? 0.45 : 1, t, 0.35);
  }

  setMuted(m: boolean) { this.muted = m; if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : this.volume, this.ctx.currentTime, 0.05); }
  setVolume(v: number) { this.volume = v; if (this.ctx && !this.muted) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05); }
  getVolume() { return this.volume; }

  private burst(opts: { type: BiquadFilterType; freq: number; q?: number; dur: number; gain: number; when?: number; dest?: AudioNode; attack?: number }) {
    const ctx = this.ctx!; const t = opts.when ?? ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = this.noise;
    const f = ctx.createBiquadFilter(); f.type = opts.type; f.frequency.value = opts.freq; f.Q.value = opts.q ?? 1;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(opts.gain, t + (opts.attack ?? 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, t + opts.dur);
    s.connect(f).connect(g).connect(opts.dest ?? this.sfx);
    s.start(t, Math.random() * 2, opts.dur + 0.05);
  }
  private tone(freq: number, dur: number, gain: number, type: OscillatorType = 'sine', when?: number, dest?: AudioNode, endFreq?: number) {
    const ctx = this.ctx!; const t = when ?? ctx.currentTime;
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest ?? this.sfx); o.start(t); o.stop(t + dur + 0.05);
    return g;
  }

  footstep(surface: Surface) {
    if (!this.ctx) return;
    const v = 0.85 + Math.random() * 0.3;
    if (surface === 'snow') {
      this.burst({ type: 'bandpass', freq: 900 + Math.random() * 500, q: 0.9, dur: 0.14, gain: 0.16 * v });
      this.burst({ type: 'highpass', freq: 3500, dur: 0.07, gain: 0.05 * v, when: this.ctx.currentTime + 0.02 });
    } else if (surface === 'ice') {
      this.burst({ type: 'highpass', freq: 2600, dur: 0.05, gain: 0.08 * v });
      this.tone(2200 + Math.random() * 800, 0.04, 0.015, 'triangle');
    } else {
      this.burst({ type: 'lowpass', freq: 380, dur: 0.12, gain: 0.22 * v });
      this.tone(85 + Math.random() * 20, 0.09, 0.08);
    }
  }

  iceCrack() {
    if (!this.ctx) return; const t = this.ctx.currentTime; const n = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) {
      const w = t + i * (0.02 + Math.random() * 0.06);
      this.burst({ type: 'bandpass', freq: 1800 + Math.random() * 3500, q: 6, dur: 0.05, gain: 0.07, when: w, dest: this.reverbIn });
    }
    this.tone(1900, 0.25, 0.02, 'sine', t, this.reverbIn, 500);
  }

  bell(when?: number) {
    if (!this.ctx) return; const ctx = this.ctx; const t = when ?? ctx.currentTime;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1600;
    const g = ctx.createGain(); g.gain.value = 0.16; lp.connect(g); g.connect(this.reverbIn); g.connect(this.amb);
    const f0 = 146.8; // D3, distant
    const partials = [[0.5, 0.5, 7], [1, 1, 6], [1.19, 0.6, 4], [1.5, 0.45, 3.5], [2, 0.5, 3], [2.52, 0.3, 2.2], [3.01, 0.22, 1.6], [4.17, 0.12, 1.2]];
    for (const [r, a, d] of partials) this.tone(f0 * r, d, a * 0.5, 'sine', t, lp);
  }

  private scheduleBells(delay: number) {
    const id = window.setTimeout(() => {
      if (this.ctx) { const t = this.ctx.currentTime; const n = 3 + Math.floor(Math.random() * 3); for (let i = 0; i < n; i++) this.bell(t + i * 3.4); }
      this.scheduleBells(80000 + Math.random() * 70000);
    }, delay);
    this.timers.push(id);
  }

  private pianoNote(midi: number, when: number, vel: number, len = 3.6) {
    const ctx = this.ctx!; const f = 440 * Math.pow(2, (midi - 69) / 12);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(2600, when); lp.frequency.exponentialRampToValueAtTime(700, when + len);
    const g = ctx.createGain(); g.gain.value = 1; lp.connect(g); g.connect(this.music); g.connect(this.reverbIn);
    this.tone(f, len, 0.12 * vel, 'triangle', when, lp);
    this.tone(f * 2, len * 0.6, 0.035 * vel, 'sine', when, lp);
    this.tone(f * 0.5, len * 0.8, 0.03 * vel, 'sine', when, lp);
  }

  private phrases: number[][] = [
    [69, 72, 76, 74, 72, 71, 69],
    [64, 67, 69, -1, 72, 71],
    [76, 74, 72, -1, 69, 71, 67],
    [57, 64, 69, 72, 71, -1, 64],
    [72, 71, 69, 67, 69, -1, -1, 64],
  ];
  private basses = [45, 41, 48, 43];

  private schedulePiano(delay: number) {
    const id = window.setTimeout(() => {
      if (this.ctx) {
        const t = this.ctx.currentTime + 0.1; const ph = this.phrases[Math.floor(Math.random() * this.phrases.length)];
        const step = 0.85 + Math.random() * 0.3;
        this.pianoNote(this.basses[Math.floor(Math.random() * this.basses.length)], t, 0.8, 6);
        ph.forEach((m, i) => { if (m > 0) this.pianoNote(m, t + i * step + Math.random() * 0.05, 0.55 + Math.random() * 0.35); });
      }
      // Long, deliberate silences between phrases.
      this.schedulePiano(26000 + Math.random() * 42000);
    }, delay);
    this.timers.push(id);
  }

  click() { if (!this.ctx) return; this.tone(660, 0.05, 0.03, 'square'); }
  page() { if (!this.ctx) return; this.burst({ type: 'bandpass', freq: 2400, q: 0.6, dur: 0.18, gain: 0.06, attack: 0.04 }); }
  flashlight(on: boolean) { if (!this.ctx) return; this.burst({ type: 'highpass', freq: on ? 3000 : 2200, dur: 0.03, gain: 0.12 }); this.tone(on ? 1400 : 900, 0.03, 0.02, 'square'); }
  battery() { if (!this.ctx) return; const t = this.ctx.currentTime; [523, 659, 784].forEach((f, i) => this.tone(f, 0.25, 0.04, 'triangle', t + i * 0.07)); }
  clue() {
    if (!this.ctx) return; const t = this.ctx.currentTime;
    this.tone(880, 1.4, 0.06, 'sine', t, this.reverbIn); this.tone(1318.5, 1.6, 0.04, 'sine', t + 0.12, this.reverbIn);
    this.tone(880, 0.6, 0.03, 'sine', t); this.tone(1318.5, 0.8, 0.02, 'sine', t + 0.12);
  }
  deduction() {
    if (!this.ctx) return; const t = this.ctx.currentTime;
    [57, 64, 69, 71, 76].forEach((m, i) => this.pianoNote(m, t + i * 0.09, 0.7, 3));
  }
  fail() { if (!this.ctx) return; this.tone(180, 0.3, 0.05, 'sawtooth', undefined, undefined, 120); }
  door() {
    if (!this.ctx) return; const ctx = this.ctx; const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(140, t); o.frequency.linearRampToValueAtTime(95, t + 0.5);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 6;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.03, t + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    o.connect(bp).connect(g).connect(this.sfx); o.start(t); o.stop(t + 0.65);
    this.burst({ type: 'lowpass', freq: 250, dur: 0.25, gain: 0.25, when: t + 0.55 });
  }
  sting(tone: 'true' | 'dark') {
    if (!this.ctx) return; const t = this.ctx.currentTime + 0.2;
    const notes = tone === 'true' ? [57, 64, 69, 73, 76] : [57, 60, 63, 66];
    notes.forEach((m, i) => this.pianoNote(m, t + i * 0.6, 0.8, 6));
  }
}

export const audio = new AudioEngine();
