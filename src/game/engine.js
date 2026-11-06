import { GAME_CONFIG, WORLDS } from "../config.js";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const backgroundImages = new Map();

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function drawMascot(ctx, character, x, y, size, elapsed, airborne) {
  const id = character?.id ?? "cubinho";
  const bob = airborne ? 0 : Math.sin(elapsed * 13) * 2.2;
  const stride = airborne ? 0 : Math.sin(elapsed * 17) * 4;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.rotate(airborne ? -0.12 : Math.sin(elapsed * 8) * 0.025);
  ctx.scale(size / 48, size / 48);
  ctx.fillStyle = "rgba(45,35,90,.18)";
  ctx.beginPath(); ctx.ellipse(0, 25, 18, 5, 0, 0, Math.PI * 2); ctx.fill();

  if (id === "estrelinha") {
    ctx.fillStyle = "#ffd45e";
    ctx.strokeStyle = "#f0a92c"; ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const r = i % 2 ? 12 : 23;
      const px = Math.cos(a) * r, py = Math.sin(a) * r;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (id === "foguetinho") {
    ctx.fillStyle = "#ff8e85";
    ctx.beginPath(); ctx.moveTo(0,-25); ctx.quadraticCurveTo(20,-12,15,13); ctx.lineTo(-15,13); ctx.quadraticCurveTo(-20,-12,0,-25); ctx.fill();
    ctx.fillStyle = "#ffcf68";
    ctx.beginPath(); ctx.moveTo(-8,10); ctx.lineTo(-21,22); ctx.lineTo(-13,0); ctx.fill();
    ctx.beginPath(); ctx.moveTo(8,10); ctx.lineTo(21,22); ctx.lineTo(13,0); ctx.fill();
    ctx.fillStyle = "#bcecff"; ctx.beginPath(); ctx.arc(0,-5,7,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = airborne ? "#ffcf68" : "#ffb65e";
    ctx.beginPath(); ctx.moveTo(-6,15); ctx.lineTo(0,28 + Math.sin(elapsed*22)*3); ctx.lineTo(6,15); ctx.fill();
  } else {
    ctx.fillStyle = id === "dino" ? "#65c978" : "#54b7ff";
    if (id === "dino") {
      ctx.beginPath(); ctx.moveTo(-17,18); ctx.lineTo(-20,-9); ctx.lineTo(-10,-4); ctx.lineTo(-4,-19); ctx.lineTo(3,-5); ctx.lineTo(12,-14); ctx.lineTo(18,18); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#a6ed9d"; roundedRect(ctx,-13,-5,26,27,9);
    } else {
      roundedRect(ctx,-19,-19,38,38,10);
    }
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(-7,-4,5,0,Math.PI*2); ctx.arc(7,-4,5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = "#493b80";
    ctx.beginPath(); ctx.arc(-6,-3,2.2,0,Math.PI*2); ctx.arc(8,-3,2.2,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = "#493b80"; ctx.lineWidth = 2; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(0,4,5,0.15,Math.PI-0.15); ctx.stroke();
    if (id === "dino") {
      ctx.fillStyle = "#4ba95d";
      ctx.beginPath(); ctx.moveTo(-15,18); ctx.lineTo(-13,25); ctx.lineTo(-5,18); ctx.fill();
      ctx.beginPath(); ctx.moveTo(15,18); ctx.lineTo(13,25); ctx.lineTo(5,18); ctx.fill();
    }
  }

  if (id === "estrelinha" || id === "foguetinho") {
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(-6,-3,4,0,Math.PI*2); ctx.arc(6,-3,4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = "#493b80";
    ctx.beginPath(); ctx.arc(-5,-2,1.8,0,Math.PI*2); ctx.arc(7,-2,1.8,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = "#493b80"; ctx.lineWidth = 1.8; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(0,4,4,0.15,Math.PI-0.15); ctx.stroke();
  }

  if (id !== "estrelinha" && id !== "foguetinho") {
    ctx.fillStyle = "#493b80";
    roundedRect(ctx,-13,15 + stride,10,8,4);
    roundedRect(ctx,4,15 - stride,10,8,4);
  }
  ctx.restore();
}


function getBackground(src) {
  if (!src) return null;
  if (!backgroundImages.has(src)) {
    const image = new Image();
    image.decoding = "async";
    image.src = src;
    backgroundImages.set(src, image);
  }
  const image = backgroundImages.get(src);
  return image.complete && image.naturalWidth > 0 ? image : null;
}

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
    if (this.jumpQueued && this.playerY >= floor - 1) this.velocityY = GAME_CONFIG.jumpVelocity;
    this.jumpQueued = false;
    this.velocityY += GAME_CONFIG.gravity * dt;
    this.playerY += this.velocityY * dt;
    if (this.playerY >= floor) { this.playerY = floor; this.velocityY = 0; }

    const obstacleEvery = 330;
    const phase = this.distance % obstacleEvery;
    if (phase > obstacleEvery - GAME_CONFIG.assistDistance && phase < obstacleEvery - GAME_CONFIG.assistDistance + 8 && this.playerY >= floor - 1) this.velocityY = GAME_CONFIG.jumpVelocity * 0.72;

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
    const background = getBackground(world.background);
    if (background) {
      const scale = Math.max(w / background.naturalWidth, h / background.naturalHeight);
      const cropW = w / scale, cropH = h / scale;
      const drift = (this.distance * 0.025) % Math.max(1, background.naturalWidth - cropW);
      ctx.drawImage(background, Math.min(background.naturalWidth - cropW, drift), (background.naturalHeight - cropH) / 2, cropW, cropH, 0, 0, w, h);
      ctx.fillStyle = "rgba(255,255,255,.16)";
      ctx.fillRect(0, 0, w, h);
    } else {
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, "#fff8fc"); sky.addColorStop(1, world.color);
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 7; i++) {
        const x = ((i * 175 - (this.distance * 0.18) % 175) + w + 175) % w;
        ctx.fillStyle = "rgba(255,255,255,.42)"; ctx.beginPath();
        ctx.arc(x, h * 0.27 + (i % 2) * 24, 22 + (i % 3) * 8, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.fillStyle = "rgba(255,255,255,.78)";
    ctx.fillRect(0, this.groundY, w, h - this.groundY);
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, this.groundY, w, 7);

    for (let i = 0; i < 4; i++) {
      const x = ((i * 255 + 170 - this.distance) % (w + 300) + (w + 300)) % (w + 300);
      ctx.fillStyle = "#f7a46c"; ctx.beginPath(); ctx.arc(x, this.groundY - 12, 15, Math.PI, 0); ctx.fill();
    }
    const size = GAME_CONFIG.playerSize;
    drawMascot(ctx, this.character, w * 0.22, this.playerY + size / 2, size, this.elapsed, this.playerY < this.groundY - size - 2);
    ctx.fillStyle = "#4c3a91"; ctx.font = "bold 16px system-ui"; ctx.textAlign = "left";
    ctx.fillText(this.level?.name ?? "Aventura", 18, 28);
    ctx.fillStyle = "rgba(76,58,145,.18)"; ctx.fillRect(18, 42, w - 36, 9);
    ctx.fillStyle = "#6c55d9"; ctx.fillRect(18, 42, (w - 36) * clamp(this.elapsed / (this.level?.duration ?? 40), 0, 1), 9);
    ctx.fillStyle = "#4c3a91"; ctx.textAlign = "right"; ctx.fillText(`⭐ ${this.stars}`, w - 18, 28);
  }

  destroy() { this.stop(); window.removeEventListener("resize", this.resize); }
}
