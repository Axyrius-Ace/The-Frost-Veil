/**
 * Fully procedural Web Audio soundscape. Nothing is sampled: wind is filtered noise with slow
 * LFOs and gust envelopes, footsteps are shaped noise grains, bells are inharmonic additive
 * partials, and the piano is a small physical-ish synth fed by a phrase scheduler that
 * deliberately leaves long silences between phrases.
 */
type Phrase = [number, number, number, number?][]; // midi, beat, length(beats), velocity

const PHRASES: Phrase[] = [
  [[45, 0, 6, 0.5], [52, 0.5, 5.5, 0.35], [76, 0, 1.5], [72, 1.5, 1], [71, 2.5, 0.5], [69, 3, 3],
   [41, 6, 6, 0.5], [48, 6.5, 5.5, 0.35], [69, 6, 1.5], [67, 7.5, 0.5], [65, 8, 1], [64, 9, 4]],
  [[50, 0, 4, 0.45], [53, 0.5, 3.5, 0.3], [69, 0, 1], [74, 1, 1], [72, 2, 1], [69, 3, 2],
   [40, 4, 6, 0.5], [47, 4.5, 5.5, 0.3], [68, 4, 1], [71, 5, 1], [64, 6, 5]],
  [[57, 0, 3, 0.4], [60, 1, 3, 0.35], [64, 2, 3, 0.35], [69, 3, 6, 0.45],
   [55, 6, 3, 0.35], [59, 7, 3, 0.3], [64, 8, 6, 0.4]],
  [[45, 0, 8, 0.45], [64, 0, 2, 0.4], [65, 2, 1, 0.35], [64, 3, 1, 0.35], [62, 4, 2, 0.35], [60, 6, 1, 0.3], [59, 7, 1, 0.3], [57, 8, 6, 0.4], [33, 8, 6, 0.4]],
];

class AudioSystem {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private music!: GainNode;
  private sfx!: GainNode;
  private amb!: GainNode;
  private ambFilter!: BiquadFilterNode;
  private windGain!: GainNode;
  private reverb!: ConvolverNode;
  private noise!: AudioBuffer;
  private started = false;
  private timers: number[] = [];
  private settings = { master: 0.8, music: 0.7 };

  init(settings?: { master: number; music: number }) {
    if (settings) this.settings = settings;
    if (this.ctx) { if (this.ctx.state === 'suspended') void this.ctx.resume(); return; }
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    this.ctx = ctx;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 3;
    comp.connect(ctx.destination);
    this.master = ctx.createGain(); this.master.connect(comp);
    this.music = ctx.createGain(); this.music.connect(this.master);
    this.sfx = ctx.createGain(); this.sfx.gain.value = 0.9; this.sfx.connect(this.master);
    this.ambFilter = ctx.createBiquadFilter(); this.ambFilter.type = 'lowpass'; this.ambFilter.frequency.value = 18000;
    this.ambFilter.connect(this.master);
    this.amb = ctx.createGain(); this.amb.gain.value = 0; this.amb.connect(this.ambFilter);
    this.reverb = ctx.createConvolver(); this.reverb.buffer = this.impulse(4.2, 2.6);
    const rv = ctx.createGain(); rv.gain.value = 0.55; this.reverb.connect(rv); rv.connect(this.master);
    const len = ctx.sampleRate * 4;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0526;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2;
    }
    this.applySettings(this.settings);
  }

  applySettings(s: { master: number; music: number }) {
    this.settings = s;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(s.master, t, 0.05);
    this.music.gain.setTargetAtTime(s.music * 0.8, t, 0.05);
  }

  private impulse(seconds: number, decay: number) {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  private out(node: AudioNode, dry: AudioNode, wet: number) {
    node.connect(dry);
    if (wet > 0) { const g = this.ctx!.createGain(); g.gain.value = wet; node.connect(g); g.connect(this.reverb); }
  }

  private later(fn: () => void, ms: number) { this.timers.push(window.setTimeout(fn, ms)); }

  start() {
    if (!this.ctx || this.started) return;
    this.started = true;
    const ctx = this.ctx, t = ctx.currentTime;
    this.amb.gain.setValueAtTime(0, t); this.amb.gain.linearRampToValueAtTime(1, t + 5);

    // low howl
    const src = ctx.createBufferSource(); src.buffer = this.noise; src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 380; bp.Q.value = 0.8;
    this.windGain = ctx.createGain(); this.windGain.gain.value = 0.55;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.06; const lfoG = ctx.createGain(); lfoG.gain.value = 220; lfo.connect(lfoG); lfoG.connect(bp.frequency);
    const lfo2 = ctx.createOscillator(); lfo2.frequency.value = 0.11; const lfo2G = ctx.createGain(); lfo2G.gain.value = 0.2; lfo2.connect(lfo2G); lfo2G.connect(this.windGain.gain);
    src.connect(bp); bp.connect(this.windGain); this.windGain.connect(this.amb);
    // high whistle
    const src2 = ctx.createBufferSource(); src2.buffer = this.noise; src2.loop = true; src2.playbackRate.value = 1.3;
    const bp2 = ctx.createBiquadFilter(); bp2.type = 'bandpass'; bp2.frequency.value = 1300; bp2.Q.value = 10;
    const g2 = ctx.createGain(); g2.gain.value = 0.12;
    const lfo3 = ctx.createOscillator(); lfo3.frequency.value = 0.045; const lfo3G = ctx.createGain(); lfo3G.gain.value = 520; lfo3.connect(lfo3G); lfo3G.connect(bp2.frequency);
    const lfo4 = ctx.createOscillator(); lfo4.frequency.value = 0.17; const lfo4G = ctx.createGain(); lfo4G.gain.value = 0.1; lfo4.connect(lfo4G); lfo4G.connect(g2.gain);
    src2.connect(bp2); bp2.connect(g2); g2.connect(this.amb);
    [src, src2, lfo, lfo2, lfo3, lfo4].forEach(n => n.start());

    const gust = () => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime, peak = 0.9 + Math.random() * 0.6;
      this.windGain.gain.setTargetAtTime(peak, now, 1.2);
      this.windGain.gain.setTargetAtTime(0.5, now + 2.5 + Math.random() * 2, 2);
      this.later(gust, 7000 + Math.random() * 11000);
    };
    this.later(gust, 5000);
    const bells = () => { this.toll(3 + Math.floor(Math.random() * 3)); this.later(bells, 95000 + Math.random() * 90000); };
    this.later(bells, 45000);
    const piano = () => { this.playPhrase(PHRASES[Math.floor(Math.random() * PHRASES.length)]); this.later(piano, 40000 + Math.random() * 55000); };
    this.later(piano, 12000);
    const creak = () => { if (Math.random() < 0.5) this.iceCrack(0.35); this.later(creak, 20000 + Math.random() * 40000); };
    this.later(creak, 25000);
  }

  setInterior(inside: boolean) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.ambFilter.frequency.setTargetAtTime(inside ? 420 : 18000, t, 0.35);
    this.amb.gain.setTargetAtTime(inside ? 0.55 : 1, t, 0.35);
  }

  // ---------------------------------------------------------------- sfx
  private burst(t: number, dur: number, type: BiquadFilterType, freq: number, gain: number, wet = 0.1, rate = 1) {
    const ctx = this.ctx!;
    const s = ctx.createBufferSource(); s.buffer = this.noise; s.playbackRate.value = rate;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); this.out(g, this.sfx, wet);
    s.start(t, Math.random() * 3, dur + 0.05);
  }

  footstep(icy: boolean) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    if (icy) {
      this.burst(t, 0.06, 'highpass', 2400, 0.16, 0.05, 1.2);
      this.burst(t, 0.08, 'lowpass', 500, 0.12, 0, 0.8);
    } else {
      this.burst(t, 0.14, 'lowpass', 700 + Math.random() * 300, 0.32, 0.03, 0.7 + Math.random() * 0.3);
      for (let i = 0; i < 4; i++) this.burst(t + 0.01 + i * 0.018 + Math.random() * 0.01, 0.02, 'bandpass', 2600 + Math.random() * 1600, 0.09, 0);
    }
  }

  iceCrack(vol = 1) {
    if (!this.ctx) return;
    const ctx = this.ctx; let t = ctx.currentTime + 0.02;
    const n = 4 + Math.floor(Math.random() * 5);
    for (let i = 0; i < n; i++) { this.burst(t, 0.02 + Math.random() * 0.03, 'highpass', 2000 + Math.random() * 3000, 0.25 * vol * Math.random(), 0.5); t += 0.01 + Math.random() * 0.07; }
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(900, ctx.currentTime); o.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.35);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.06 * vol, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    o.connect(g); this.out(g, this.sfx, 0.6); o.start(); o.stop(ctx.currentTime + 0.45);
  }

  bell(when: number, base = 174) {
    const ctx = this.ctx!;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1600;
    const bus = ctx.createGain(); bus.gain.value = 0.07; lp.connect(bus); this.out(bus, this.music, 1.1);
    const ratios = [0.5, 1, 1.19, 1.5, 2, 2.51, 2.66, 3.01, 4.16];
    const amps = [0.6, 1, 0.55, 0.4, 0.45, 0.25, 0.2, 0.15, 0.08];
    const decays = [9, 7, 5, 4, 3.5, 2.8, 2.4, 2, 1.4];
    ratios.forEach((r, i) => {
      const o = ctx.createOscillator(); o.frequency.value = base * r * (1 + (Math.random() - 0.5) * 0.002);
      const g = ctx.createGain(); g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(amps[i], when + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, when + decays[i]);
      o.connect(g); g.connect(lp); o.start(when); o.stop(when + decays[i] + 0.1);
    });
  }

  toll(times: number) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + 0.1;
    for (let i = 0; i < times; i++) this.bell(t + i * 3.2, 164 + Math.random() * 4);
  }

  private note(midi: number, t: number, dur: number, vel: number) {
    const ctx = this.ctx!;
    const f = 440 * Math.pow(2, (midi - 69) / 12);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(Math.min(5000, f * 8), t); lp.frequency.exponentialRampToValueAtTime(Math.max(300, f * 1.5), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel * 0.22, t + 0.006);
    g.gain.setTargetAtTime(vel * 0.1, t + 0.01, 0.25); g.gain.setTargetAtTime(0, t + dur, 0.6);
    const partials: [OscillatorType, number, number][] = [['triangle', 1, 1], ['sine', 2, 0.35], ['sine', 3, 0.12], ['sine', 1.002, 0.5]];
    for (const [type, mul, amp] of partials) {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = f * mul;
      const og = ctx.createGain(); og.gain.value = amp;
      o.connect(og); og.connect(lp); o.start(t); o.stop(t + dur + 4);
    }
    lp.connect(g); this.out(g, this.music, 0.55);
  }

  playPhrase(p: Phrase, beat = 0.95) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + 0.1;
    for (const [m, b, l, v] of p) this.note(m, t0 + b * beat + (Math.random() - 0.5) * 0.02, l * beat, v ?? 0.45);
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, wet = 0.2, when = 0) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime + when;
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); this.out(g, this.sfx, wet); o.start(t); o.stop(t + dur + 0.05);
  }

  click() { this.tone(1400, 0.03, 'square', 0.03, 0); }
  flashlight(on: boolean) { if (!this.ctx) return; this.tone(on ? 1800 : 1200, 0.025, 'square', 0.05, 0); this.burst(this.ctx.currentTime, 0.03, 'highpass', 3000, 0.1, 0); }
  pickup() { this.tone(880, 0.25, 'sine', 0.12, 0.4); this.tone(1320, 0.4, 'sine', 0.08, 0.5, 0.08); }
  shimmer() { this.tone(2637, 0.6, 'sine', 0.03, 0.8); this.tone(3136, 0.8, 'sine', 0.02, 0.8, 0.1); }
  discover() { if (!this.ctx) return; this.note(52, this.ctx.currentTime + 0.05, 2.5, 0.5); this.note(59, this.ctx.currentTime + 0.05, 2.5, 0.4); this.note(76, this.ctx.currentTime + 0.3, 2, 0.3); }
  connect() { if (!this.ctx) return; const t = this.ctx.currentTime + 0.05; [57, 64, 69, 72].forEach((m, i) => this.note(m, t + i * 0.09, 2.5, 0.35)); }
  fail() { if (!this.ctx) return; this.tone(90, 0.3, 'sine', 0.2, 0.2); this.burst(this.ctx.currentTime, 0.15, 'lowpass', 300, 0.2, 0.1); }
  door() { if (!this.ctx) return; this.tone(70, 0.35, 'sine', 0.25, 0.3); this.burst(this.ctx.currentTime, 0.25, 'lowpass', 500, 0.25, 0.4); }
  ending(good: boolean) {
    if (!this.ctx) return;
    this.toll(good ? 5 : 2);
    this.later(() => this.playPhrase(good ? PHRASES[2] : PHRASES[3], 1.1), 1500);
  }
}

export const audio = new AudioSystem();
