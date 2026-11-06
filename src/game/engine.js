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
    this.collectedStars = new Set();
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
    this.collectedStars = new Set();
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

    // Obstacles are visual landmarks only: the helper jump avoids frustration.
    const obstacleEvery = 520;
    const firstObstacle = 430;
    const obstacleIndex = Math.max(0, Math.floor((this.distance - firstObstacle) / obstacleEvery));
    const nextObstacle = firstObstacle + obstacleIndex * obstacleEvery;
    const obstaclePhase = nextObstacle - this.distance;
    if (obstaclePhase <= GAME_CONFIG.assistDistance && obstaclePhase > GAME_CONFIG.assistDistance - GAME_CONFIG.baseSpeed * dt && this.playerY >= floor - 1) {
      this.velocityY = GAME_CONFIG.jumpVelocity * 0.82;
    }

    // Stars are placed in the jump arc and collected on contact, with a generous
    // pickup radius so small screens and young players are not penalized.
    const starEvery = 520;
    const firstStar = 285;
    const starIndex = Math.max(0, Math.floor((this.distance - firstStar) / starEvery));
    for (let i = Math.max(0, starIndex - 1); i <= starIndex + 1; i++) {
      const starDistance = firstStar + i * starEvery;
      if (this.collectedStars.has(i)) continue;
      const horizontalGap = Math.abs(starDistance - this.distance);
      const starY = this.groundY - 105;
      const playerCenterY = this.playerY + GAME_CONFIG.playerSize / 2;
      if (horizontalGap < 48 && Math.abs(playerCenterY - starY) < 78) {
        this.collectedStars.add(i);
        this.stars += 1;
        this.callbacks.onStar?.(this.stars);
      }
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
    const playerX = w * 0.22;
    const obstacleEvery = 520;
    const firstObstacle = 430;
    const firstVisible = Math.max(0, Math.floor((this.distance - firstObstacle - 180) / obstacleEvery));
    for (let i = firstVisible; i < firstVisible + 3; i++) {
      const obstacleDistance = firstObstacle + i * obstacleEvery;
      const x = playerX + obstacleDistance - this.distance;
      if (x < -55 || x > w + 55) continue;
      const baseY = this.groundY;
      ctx.save();
      if (world.id === "dino") {
        ctx.fillStyle = "#8a9b78"; ctx.beginPath(); ctx.ellipse(x, baseY - 17, 25, 18, -0.12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#b8c99b"; ctx.beginPath(); ctx.arc(x - 7, baseY - 24, 6, 0, Math.PI * 2); ctx.fill();
      } else if (world.id === "ocean") {
        ctx.fillStyle = "#ff9b85"; ctx.beginPath(); ctx.arc(x, baseY - 16, 22, Math.PI, 0); ctx.lineTo(x + 22, baseY); ctx.lineTo(x - 22, baseY); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#ffd4a3"; ctx.beginPath(); ctx.arc(x - 8, baseY - 17, 4, 0, Math.PI * 2); ctx.arc(x + 8, baseY - 17, 4, 0, Math.PI * 2); ctx.fill();
      } else if (world.id === "space") {
        ctx.fillStyle = "#9a91b8"; ctx.beginPath(); ctx.arc(x, baseY - 17, 23, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.beginPath(); ctx.arc(x - 8, baseY - 25, 6, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = "#c77b9e"; roundedRect(ctx, x - 20, baseY - 35, 40, 35, 12);
        ctx.fillStyle = "#ffe08a"; ctx.beginPath(); ctx.arc(x, baseY - 35, 12, Math.PI, 0); ctx.fill();
      }
      ctx.restore();
    }

    const starEvery = 520;
    const firstStar = 285;
    const firstStarVisible = Math.max(0, Math.floor((this.distance - firstStar - 100) / starEvery));
    for (let i = firstStarVisible; i < firstStarVisible + 3; i++) {
      if (this.collectedStars.has(i)) continue;
      const x = playerX + firstStar + i * starEvery - this.distance;
      if (x < -30 || x > w + 30) continue;
      const y = this.groundY - 105 + Math.sin(this.elapsed * 4 + i) * 5;
      ctx.save(); ctx.translate(x, y); ctx.rotate(this.elapsed * 1.4);
      ctx.fillStyle = "#ffd45e"; ctx.strokeStyle = "#fff5bd"; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5; const r = k % 2 ? 7 : 16; const px = Math.cos(a) * r, py = Math.sin(a) * r; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    }

    drawMascot(ctx, this.character, playerX, this.playerY + size / 2, size, this.elapsed, this.playerY < this.groundY - size - 2);
    ctx.fillStyle = "#4c3a91"; ctx.font = "bold 16px system-ui"; ctx.textAlign = "left";
    ctx.fillText(this.level?.name ?? "Aventura", 18, 28);
    ctx.fillStyle = "rgba(76,58,145,.18)"; ctx.fillRect(18, 42, w - 36, 9);
    ctx.fillStyle = "#6c55d9"; ctx.fillRect(18, 42, (w - 36) * clamp(this.elapsed / (this.level?.duration ?? 40), 0, 1), 9);
    ctx.fillStyle = "#4c3a91"; ctx.textAlign = "right"; ctx.fillText(`⭐ ${this.stars}`, w - 18, 28);
  }

  destroy() { this.stop(); window.removeEventListener("resize", this.resize); }
}
