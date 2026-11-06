const MUSIC_URL = "https://d8j0ntlcm91z4.cloudfront.net/user_3JEBvIBbBxFXhwnFWwMOJeZAkLe/hf_20261105_230020_4a33d642-caba-48bb-8a94-b3eb0f2818ba.mp3";

export class GameAudio {
  constructor(enabled = true) {
    this.enabled = enabled;
    this.music = new Audio(MUSIC_URL);
    this.music.loop = true;
    this.music.preload = "none";
    this.music.volume = 0.24;
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
