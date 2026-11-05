import { GAME_CONFIG, WORLDS } from "../config.js";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export class GameEngine {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.callbacks = callbacks;
    this.running = false;
    this.frameId = 0;
    this.lastTime = 0;
    this.elapsed = 0;
    this.distance = 0;
    this.playerY = 0;
    this.velocityY = 0;
    this.stars = 0;
    this.jumpQueued = false;
    this.paused = false;
    this.level = null;
    this.character = null;
    this.resize = this.resize.bind(this);
    window.addEventListener("resize", this.resize);
    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.max(320, rect.width);
    this.height = Math.max(220, rect.height);
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.groundY = this.height * 0.78;
    if (!this.running) this.playerY = this.groundY - GAME_CONFIG.playerSize;
  }

  start(level, character) {
    this.stop();
    this.level = level;
    this.character = character;
    this.elapsed = 0;
    this.distance = 0;
    this.stars = 0;
    this.velocityY = 0;
    this.playerY = this.groundY - GAME_CONFIG.playerSize;
    this.running = true;
    this.paused = false;
    this.lastTime = 0;
    this.frameId = requestAnimationFrame((time) => this.loop(time));
  }

  stop() {
    this.running = false;
    if (this.frameId) cancelAnimationFrame(this.frameId);
    this.frameId = 0;
  }

  pause() { this.paused = true; }
  resume() { this.paused = false; this.lastTime = 0; }
  jump() {
    if (!this.running || this.paused) return;
    this.jumpQueued = true;
  }

  loop(time) {
    if (!this.running) return;
    const dt = this.lastTime ? Math.min((time - this.lastTime) / 1000, 0.04) : 0;
    this.lastTime = time;
    if (!this.paused) this.update(dt);
    this.render();
    this.frameId = requestAnimationFrame((next) => this.loop(next));
  }

  update(dt) {
    this.elapsed += dt;
    this.distance += GAME_CONFIG.baseSpeed * dt;
    const floor = this.groundY - GAME_CONFIG.playerSize;
    if (this.jumpQueued && this.playerY >= floor - 1) {
      this.velocityY = GAME_CONFIG.jumpVelocity;
    }
    this.jumpQueued = false;
    this.velocityY += GAME_CONFIG.gravity * dt;
    this.playerY += this.velocityY * dt;
    if (this.playerY >= floor) {
      this.playerY = floor;
      this.velocityY = 0;
    }

    // Gentle auto-assist: a small hop is offered when an obstacle is near.
    const obstacleEvery = 330;
    const phase = this.distance % obstacleEvery;
    if (phase > obstacleEvery - GAME_CONFIG.assistDistance && phase < obstacleEvery - GAME_CONFIG.assistDistance + 8 && this.playerY >= floor - 1) {
      this.velocityY = GAME_CONFIG.jumpVelocity * 0.72;
    }

    const starEvery = 245;
    if (Math.floor((this.distance + GAME_CONFIG.baseSpeed * dt) / starEvery) > Math.floor(this.distance / starEvery)) {
      this.stars += 1;
      this.callbacks.onStar?.(this.stars);
    }
    if (this.elapsed >= (this.level?.duration ?? GAME_CONFIG.durationSeconds)) {
      this.stop();
      this.callbacks.onComplete?.({ stars: this.stars, level: this.level });
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.width, h = this.height;
    const world = WORLDS.find((item) => item.id === this.level?.worldId) ?? WORLDS[0];
    ctx.clearRect(0, 0, w, h);
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#fff8fc");
    sky.addColorStop(1, world.color);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Soft background scenery.
    for (let i = 0; i < 7; i++) {
      const x = ((i * 175 - (this.distance * 0.18) % 175) + w + 175) % w;
      ctx.fillStyle = "rgba(255,255,255,.42)";
      ctx.beginPath();
      ctx.arc(x, h * 0.27 + (i % 2) * 24, 22 + (i % 3) * 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(255,255,255,.7)";
    ctx.fillRect(0, this.groundY, w, h - this.groundY);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, this.groundY, w, 7);

    // Friendly, non-lethal obstacle shapes.
    for (let i = 0; i < 4; i++) {
      const x = ((i * 255 + 170 - this.distance) % (w + 300) + (w + 300)) % (w + 300);
      ctx.fillStyle = "#f7a46c";
      ctx.beginPath();
      ctx.arc(x, this.groundY - 12, 15, Math.PI, 0);
      ctx.fill();
    }

    const size = GAME_CONFIG.playerSize;
    ctx.font = `${size}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.character?.emoji ?? "🟦", w * 0.22, this.playerY + size / 2);

    ctx.fillStyle = "#4c3a91";
    ctx.font = "bold 16px system-ui";
    ctx.textAlign = "left";
    ctx.fillText(this.level?.name ?? "Aventura", 18, 28);
    ctx.fillStyle = "rgba(76,58,145,.18)";
    ctx.fillRect(18, 42, w - 36, 9);
    ctx.fillStyle = "#6c55d9";
    ctx.fillRect(18, 42, (w - 36) * clamp(this.elapsed / (this.level?.duration ?? 40), 0, 1), 9);
    ctx.fillStyle = "#4c3a91";
    ctx.textAlign = "right";
    ctx.fillText(`⭐ ${this.stars}`, w - 18, 28);
  }

  destroy() {
    this.stop();
    window.removeEventListener("resize", this.resize);
  }
}
