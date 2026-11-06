const MUSIC_URL = "https://d8j0ntlcm91z4.cloudfront.net/user_3JEBvIBbBxFXhwnFWwMOJeZAkLe/hf_20261105_230020_4a33d642-caba-48bb-8a94-b3eb0f2818ba.mp3";

export class GameAudio {
  constructor(enabled = true) {
    this.enabled = enabled;
    this.music = new Audio(MUSIC_URL);
    this.music.loop = true;
    this.music.preload = "none";
    this.music.volume = 0.24;
    this.context = null;
  }

  tone(frequency, duration = 0.12, type = "sine", volume = 0.12) {
    if (!this.enabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.context ??= new AudioContext();
      if (this.context.state === "suspended") this.context.resume();
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
      gain.gain.setValueAtTime(volume, this.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(this.context.destination);
      oscillator.start();
      oscillator.stop(this.context.currentTime + duration);
    } catch { /* Audio effects are optional on unsupported devices. */ }
  }

  jump() { this.tone(520, 0.11, "triangle", 0.08); }
  collect() {
    this.tone(880, 0.09, "sine", 0.10);
    window.setTimeout(() => this.tone(1320, 0.12, "sine", 0.08), 65);
  }
  celebrate() {
    [660, 880, 1100, 1320].forEach((frequency, index) => {
      window.setTimeout(() => this.tone(frequency, 0.22, "triangle", 0.09), index * 100);
    });
  }

  async play() {
    if (!this.enabled) return;
    try {
      if (this.music.paused) await this.music.play();
    } catch {
      // Browsers may block playback until a user gesture is received.
    }
  }

  pause() {
    this.music.pause();
  }

  stop() {
    this.music.pause();
    this.music.currentTime = 0;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (enabled) this.play();
    else this.pause();
  }
}
