import { createRng } from "../game/levels.js";
import { MUSIC_TRACKS } from "../config.js";

/**
 * Procedural soundtrack and sound effects, fully generated with the Web Audio
 * API. Nothing is downloaded, so the game stays offline-first and private.
 *
 * Each world has its own musical identity (tempo, scale, instruments and
 * groove); each level derives a melody from a seed so it always sounds the
 * same, while the drums and bass lock to the level's beat grid.
 */
const NOTE = (semitone) => 440 * Math.pow(2, (semitone - 69) / 12);

const WORLD_MUSIC = {
  candy: { bpm: 120, root: 72, scale: [0, 2, 4, 7, 9], chords: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [9, 12, 16]], lead: "square", pad: "triangle", bass: "triangle", cutoff: 2200, swing: 0.08, mood: "bright" },
  dino: { bpm: 112, root: 67, scale: [0, 2, 3, 5, 7, 9, 10], chords: [[0, 3, 7], [5, 8, 12], [10, 14, 17], [7, 10, 14]], lead: "sawtooth", pad: "triangle", bass: "square", cutoff: 1600, swing: 0.14, mood: "groove" },
  ocean: { bpm: 100, root: 69, scale: [0, 2, 4, 7, 9, 11], chords: [[0, 4, 7, 11], [9, 12, 16], [5, 9, 12, 16], [7, 11, 14]], lead: "sine", pad: "sine", bass: "triangle", cutoff: 1200, swing: 0.05, mood: "dreamy" },
  space: { bpm: 128, root: 64, scale: [0, 2, 3, 7, 8], chords: [[0, 3, 7], [8, 12, 15], [10, 14, 17], [7, 10, 14]], lead: "sawtooth", pad: "sawtooth", bass: "sawtooth", cutoff: 2600, swing: 0, mood: "energy" },
  menu: { bpm: 96, root: 72, scale: [0, 2, 4, 7, 9], chords: [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]], lead: "triangle", pad: "sine", bass: "sine", cutoff: 1400, swing: 0.1, mood: "soft" }
};

function buildMelody(theme, seed) {
  const rng = createRng(seed);
  const steps = 128; // 8 bars of 16ths
  const notes = new Array(steps).fill(null);
  let degree = 2;
  for (let i = 0; i < steps; i++) {
    const bar = Math.floor(i / 16);
    const inBar = i % 16;
    const density = theme.mood === "dreamy" || theme.mood === "soft" ? 0.38 : theme.mood === "energy" ? 0.66 : 0.52;
    const onBeat = inBar % 4 === 0;
    if (!(onBeat || rng() < density)) continue;
    const move = rng();
    degree += move < 0.25 ? -2 : move < 0.5 ? -1 : move < 0.75 ? 1 : 2;
    degree = Math.max(0, Math.min(theme.scale.length * 2 - 1, degree));
    const octave = Math.floor(degree / theme.scale.length);
    const semitone = theme.root + theme.scale[degree % theme.scale.length] + octave * 12;
    const length = onBeat && rng() < 0.3 ? 2 : 1;
    notes[i] = { semitone, length: inBar === 15 && bar % 4 === 3 ? 4 : length };
  }
  return notes;
}

export class AudioEngine {
  constructor({ sound = true, music = true } = {}) {
    this.soundEnabled = sound;
    this.musicEnabled = music;
    this.ctx = null;
    this.noiseBuffer = null;
    this.current = null;
    this.timer = null;
    this.beatStart = 0;
    this.bpm = 120;
    this.tracks = new Map();
    this.track = null;
    this.trackWorld = null;
  }

  unlock() {
    if (this.ctx) { if (this.ctx.state === "suspended") this.ctx.resume(); return true; }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return false;
    try {
      this.ctx = new Ctx();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = this.musicEnabled ? 0.34 : 0; this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = this.soundEnabled ? 0.7 : 0; this.sfxGain.connect(this.master);
      const length = this.ctx.sampleRate;
      this.noiseBuffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
      return true;
    } catch { return false; }
  }

  setSound(enabled) { this.soundEnabled = enabled; if (this.sfxGain) this.sfxGain.gain.setTargetAtTime(enabled ? 0.7 : 0, this.ctx.currentTime, 0.02); }
  setMusic(enabled) {
    this.musicEnabled = enabled;
    if (this.musicGain) this.musicGain.gain.setTargetAtTime(enabled ? 0.34 : 0, this.ctx.currentTime, 0.05);
    if (enabled && this.current && !this.timer) this.startScheduler();
    if (enabled && this.track) this.track.play().catch(() => {});
    if (!enabled && this.track) this.track.pause();
  }

  /** 0..1 phase inside the current beat, used by the renderer to pulse the scene. */
  beatPhase() {
    if (!this.ctx) return 0;
    const beat = 60 / this.bpm;
    if (this.track && !this.track.paused) return (this.track.currentTime % beat) / beat;
    if (!this.current) return 0;
    return ((this.ctx.currentTime - this.beatStart) % beat) / beat;
  }

  // ---- music ------------------------------------------------------------
  playMusic(worldId, seed = 1) {
    if (!this.unlock()) return;
    const theme = WORLD_MUSIC[worldId] ?? WORLD_MUSIC.menu;
    if (this.trackWorld === worldId && this.track) { this.resumeMusic(); return; }
    if (this.current?.worldId === worldId && this.current?.seed === seed) { this.resumeMusic(); return; }
    this.stopMusic();
    this.bpm = theme.bpm;
    if (MUSIC_TRACKS[worldId] && this.playTrack(worldId)) return;
    this.startSequencer(worldId, seed, theme);
  }

  startSequencer(worldId, seed, theme) {
    this.current = { worldId, seed, theme, melody: buildMelody(theme, seed), step: 0, nextTime: this.ctx.currentTime + 0.08, intensity: 0.65 };
    this.beatStart = this.current.nextTime;
    this.startScheduler();
  }

  /** Plays a bundled soundtrack through the music bus; returns false when unavailable. */
  playTrack(worldId) {
    try {
      let element = this.tracks.get(worldId);
      if (!element) {
        element = new Audio(MUSIC_TRACKS[worldId]);
        element.loop = true;
        element.preload = "auto";
        element.crossOrigin = "anonymous";
        const source = this.ctx.createMediaElementSource(element);
        source.connect(this.musicGain);
        element.addEventListener("error", () => {
          // Fall back to the procedural soundtrack if the file cannot be played.
          if (this.trackWorld === worldId) {
            this.track = null; this.trackWorld = null;
            this.startSequencer(worldId, 1, WORLD_MUSIC[worldId] ?? WORLD_MUSIC.menu);
          }
        });
        this.tracks.set(worldId, element);
      }
      this.track = element;
      this.trackWorld = worldId;
      element.currentTime = 0;
      if (this.musicEnabled) element.play().catch(() => {});
      return true;
    } catch {
      return false;
    }
  }

  setIntensity(value) {
    const intensity = Math.max(0.3, Math.min(1, value));
    if (this.current) this.current.intensity = intensity;
    if (this.track && this.musicGain && this.musicEnabled) this.musicGain.gain.setTargetAtTime(0.26 + intensity * 0.1, this.ctx.currentTime, 0.3);
  }

  startScheduler() {
    if (this.timer) return;
    this.timer = window.setInterval(() => this.schedule(), 30);
  }

  pauseMusic() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.track?.pause();
  }
  resumeMusic() {
    if (!this.ctx) return;
    if (this.track) { if (this.musicEnabled) this.track.play().catch(() => {}); return; }
    if (!this.current) return;
    this.current.nextTime = Math.max(this.current.nextTime, this.ctx.currentTime + 0.05);
    this.startScheduler();
  }
  stopMusic() {
    this.pauseMusic();
    this.current = null;
    if (this.track) { this.track.currentTime = 0; }
    this.track = null;
    this.trackWorld = null;
  }

  schedule() {
    const song = this.current;
    if (!song || !this.musicEnabled) return;
    const stepDuration = 60 / song.theme.bpm / 4;
    while (song.nextTime < this.ctx.currentTime + 0.14) {
      const swing = song.step % 2 === 1 ? stepDuration * song.theme.swing : 0;
      this.playStep(song, song.nextTime + swing, stepDuration);
      song.nextTime += stepDuration;
      song.step += 1;
    }
  }

  playStep(song, time, stepDuration) {
    const { theme, melody, intensity } = song;
    const step = song.step;
    const inBar = step % 16;
    const bar = Math.floor(step / 16);
    const chord = theme.chords[bar % theme.chords.length];
    const beat = 60 / theme.bpm;
    if (inBar === 0) this.beatStart = time;

    // Drums.
    const kick = inBar % 8 === 0 || (theme.mood !== "dreamy" && theme.mood !== "soft" && inBar === 10) || (theme.mood === "energy" && inBar === 6);
    if (kick) this.kick(time, 0.5 * intensity);
    if (inBar === 4 || inBar === 12) this.snare(time, (theme.mood === "soft" ? 0.12 : 0.28) * intensity);
    if (inBar % 2 === 0 && theme.mood !== "soft") this.hat(time, (inBar % 4 === 2 ? 0.08 : 0.14) * intensity, 0.04);
    else if (theme.mood === "energy" && inBar % 2 === 1) this.hat(time, 0.05 * intensity, 0.02);

    // Bass.
    if (inBar % 2 === 0) {
      const octave = inBar % 8 === 6 ? 12 : 0;
      this.voice(theme.bass, NOTE(theme.root - 24 + chord[0] + octave), time, stepDuration * 1.8, 0.22 * intensity, { cutoff: 500, attack: 0.01 });
    }

    // Pad chords on every beat.
    if (inBar % 4 === 0) {
      for (const interval of chord) {
        this.voice(theme.pad, NOTE(theme.root - 12 + interval), time, beat * 0.95, 0.045 * intensity, { cutoff: theme.cutoff * 0.6, attack: 0.05 });
      }
    }

    // Lead melody.
    const note = melody[step % melody.length];
    if (note) {
      const detune = theme.mood === "energy" ? 6 : 0;
      this.voice(theme.lead, NOTE(note.semitone), time, stepDuration * note.length * 0.9, 0.09 * intensity, { cutoff: theme.cutoff, attack: 0.008, detune });
      if (theme.mood === "dreamy") this.voice("sine", NOTE(note.semitone + 12), time + 0.01, stepDuration * note.length * 0.6, 0.025 * intensity, { cutoff: 3000, attack: 0.02 });
    }
  }

  // ---- synth primitives --------------------------------------------------
  voice(type, frequency, time, duration, volume, { cutoff = 3000, attack = 0.01, detune = 0, release = 0.08, destination = this.musicGain, slideTo = null } = {}) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, time);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, time + duration);
    if (detune) osc.detune.setValueAtTime(detune, time);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(cutoff, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(volume, time + attack);
    gain.gain.setValueAtTime(volume, time + Math.max(attack, duration - release));
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration + release);
    osc.connect(filter); filter.connect(gain); gain.connect(destination);
    osc.start(time);
    osc.stop(time + duration + release + 0.02);
  }

  noise(time, duration, volume, { highpass = 1000, destination = this.musicGain } = {}) {
    if (!this.ctx) return;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass"; filter.frequency.value = highpass;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    source.connect(filter); filter.connect(gain); gain.connect(destination);
    source.start(time); source.stop(time + duration + 0.01);
  }

  kick(time, volume) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.12);
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
    osc.connect(gain); gain.connect(this.musicGain);
    osc.start(time); osc.stop(time + 0.25);
  }
  snare(time, volume) { this.noise(time, 0.16, volume, { highpass: 1800 }); this.voice("triangle", 190, time, 0.08, volume * 0.5, { attack: 0.002 }); }
  hat(time, volume, duration) { this.noise(time, duration, volume, { highpass: 6000 }); }

  // ---- sound effects -----------------------------------------------------
  now() { return this.ctx ? this.ctx.currentTime : 0; }
  sfx(type, frequency, duration, volume, options = {}) {
    if (!this.soundEnabled || !this.unlock()) return;
    this.voice(type, frequency, this.now(), duration, volume, { destination: this.sfxGain, cutoff: 4000, ...options });
  }
  jump() { this.sfx("triangle", 380, 0.1, 0.25, { slideTo: 720, attack: 0.005 }); }
  land() { this.sfx("sine", 150, 0.06, 0.12, { attack: 0.003 }); }
  star(streak = 1) {
    const scale = [0, 2, 4, 7, 9, 12, 14, 16];
    const semitone = 84 + scale[Math.min(scale.length - 1, Math.floor((streak - 1) / 2) % scale.length)];
    this.sfx("sine", NOTE(semitone), 0.12, 0.22, { attack: 0.004 });
    this.sfx("sine", NOTE(semitone + 7), 0.16, 0.14, { attack: 0.03 });
  }
  coin() { [0, 4, 7, 12].forEach((interval, i) => this.voice("square", NOTE(88 + interval), this.now() + i * 0.07, 0.12, 0.14, { destination: this.sfxGain, cutoff: 3200, attack: 0.004 })); }
  pad() { this.sfx("sawtooth", 180, 0.28, 0.2, { slideTo: 900, cutoff: 1800, attack: 0.005 }); }
  orb() { this.sfx("sine", 1050, 0.14, 0.2, { slideTo: 1500 }); this.noise(this.now(), 0.08, 0.08, { highpass: 5000, destination: this.sfxGain }); }
  bump() { this.sfx("triangle", 320, 0.26, 0.2, { slideTo: 170, cutoff: 1200, attack: 0.01 }); }
  bubble() { this.sfx("sine", 300, 0.22, 0.22, { slideTo: 760, attack: 0.01 }); }
  checkpoint() { this.sfx("triangle", NOTE(84), 0.1, 0.18); this.voice("triangle", NOTE(91), this.now() + 0.1, 0.16, 0.18, { destination: this.sfxGain, attack: 0.005 }); }
  speed() { this.noise(this.now(), 0.32, 0.18, { highpass: 900, destination: this.sfxGain }); }
  mode() { [0, 5, 9, 14].forEach((interval, i) => this.voice("sine", NOTE(80 + interval), this.now() + i * 0.05, 0.2, 0.12, { destination: this.sfxGain, attack: 0.01 })); }
  finish() {
    [0, 4, 7, 12, 16].forEach((interval, i) => this.voice("square", NOTE(76 + interval), this.now() + i * 0.11, 0.26, 0.16, { destination: this.sfxGain, cutoff: 2800, attack: 0.005 }));
    for (let i = 0; i < 6; i++) this.noise(this.now() + i * 0.05, 0.06, 0.06, { highpass: 4000, destination: this.sfxGain });
  }
  ui() { this.sfx("sine", 620, 0.07, 0.12, { attack: 0.003 }); }
}
