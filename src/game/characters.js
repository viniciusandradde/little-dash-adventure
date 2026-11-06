const TAU = Math.PI * 2;

function rounded(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function face(ctx, { eyeY = -2, eyeGap = 7, eyeR = 4.2, mouth = "smile", scale = 1, color = "#2d2a55" }) {
  ctx.save();
  ctx.scale(scale, scale);
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(-eyeGap, eyeY, eyeR, 0, TAU); ctx.arc(eyeGap, eyeY, eyeR, 0, TAU); ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(-eyeGap + 1, eyeY + 0.6, eyeR * 0.52, 0, TAU); ctx.arc(eyeGap + 1, eyeY + 0.6, eyeR * 0.52, 0, TAU); ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(-eyeGap + 2.2, eyeY - 1, eyeR * 0.22, 0, TAU); ctx.arc(eyeGap + 2.2, eyeY - 1, eyeR * 0.22, 0, TAU); ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineCap = "round";
  ctx.beginPath();
  if (mouth === "open") { ctx.fillStyle = color; ctx.ellipse(0, eyeY + 9, 3.4, 4.2, 0, 0, TAU); ctx.fill(); }
  else if (mouth === "wow") { ctx.arc(0, eyeY + 9, 3, 0, TAU); ctx.stroke(); }
  else { ctx.arc(0, eyeY + 4, 6, 0.25, Math.PI - 0.25); ctx.stroke(); }
  ctx.fillStyle = "rgba(255,120,150,.35)";
  ctx.beginPath(); ctx.arc(-eyeGap - 5, eyeY + 6, 2.6, 0, TAU); ctx.arc(eyeGap + 5, eyeY + 6, 2.6, 0, TAU); ctx.fill();
  ctx.restore();
}

/**
 * Draws a character centred on (0,0) in a 48 unit box. The caller handles
 * translation, rotation and squash. `pose` is one of run | jump | fly | happy.
 */
export function drawCharacter(ctx, id, { pose = "run", t = 0, vy = 0, flame = false } = {}) {
  const airborne = pose === "jump" || pose === "fly";
  const mouth = pose === "fly" ? "wow" : airborne ? "open" : "smile";
  const stride = pose === "run" ? Math.sin(t * 18) * 4 : 0;
  switch (id) {
    case "dino": {
      ctx.fillStyle = "#3f9a52";
      ctx.beginPath(); ctx.moveTo(-22, 16); ctx.lineTo(-25, -10); ctx.lineTo(-13, -4); ctx.lineTo(-6, -22); ctx.lineTo(3, -7); ctx.lineTo(13, -18); ctx.lineTo(22, 16); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#5fcc74"; rounded(ctx, -21, -16, 42, 38, 15); ctx.fill();
      ctx.fillStyle = "#b8f0a3"; rounded(ctx, -11, -2, 22, 22, 9); ctx.fill();
      ctx.fillStyle = "#3f9a52";
      ctx.beginPath(); ctx.moveTo(-21, 6); ctx.quadraticCurveTo(-34, 2, -30, 16); ctx.lineTo(-19, 14); ctx.fill();
      ctx.fillStyle = "#2f7d41";
      rounded(ctx, -16, 16 + stride, 11, 8, 4); ctx.fill();
      rounded(ctx, 5, 16 - stride, 11, 8, 4); ctx.fill();
      face(ctx, { eyeY: -5, eyeGap: 7, eyeR: 4.6, mouth, color: "#204a2b" });
      break;
    }
    case "estrelinha": {
      ctx.fillStyle = "#ffd24d"; ctx.strokeStyle = "#f0a21c"; ctx.lineWidth = 3; ctx.lineJoin = "round";
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5;
        const r = i % 2 ? 12 : 25;
        const px = Math.cos(a) * r, py = Math.sin(a) * r;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.45)";
      ctx.beginPath(); ctx.arc(-7, -9, 4, 0, TAU); ctx.fill();
      face(ctx, { eyeY: -1, eyeGap: 6, eyeR: 3.8, mouth, color: "#7a4d12" });
      break;
    }
    case "foguetinho": {
      ctx.fillStyle = "#ffd166";
      ctx.beginPath(); ctx.moveTo(-10, 8); ctx.lineTo(-24, 24); ctx.lineTo(-14, 0); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(10, 8); ctx.lineTo(24, 24); ctx.lineTo(14, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#ff7f74";
      ctx.beginPath(); ctx.moveTo(0, -27); ctx.quadraticCurveTo(22, -12, 16, 16); ctx.lineTo(-16, 16); ctx.quadraticCurveTo(-22, -12, 0, -27); ctx.fill();
      ctx.fillStyle = "#ffe0dc"; ctx.beginPath(); ctx.moveTo(0, -27); ctx.quadraticCurveTo(-13, -16, -11, -2); ctx.quadraticCurveTo(-4, -16, 0, -27); ctx.fill();
      ctx.fillStyle = "#d9483f"; rounded(ctx, -16, 12, 32, 6, 3); ctx.fill();
      ctx.fillStyle = "#bde8ff"; ctx.beginPath(); ctx.arc(0, -4, 9.5, 0, TAU); ctx.fill();
      ctx.strokeStyle = "#5f7ea8"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, -4, 9.5, 0, TAU); ctx.stroke();
      const flameSize = flame || airborne ? 1.4 : 0.9;
      ctx.fillStyle = "#ffb347";
      ctx.beginPath(); ctx.moveTo(-8, 18); ctx.quadraticCurveTo(0, 18 + 18 * flameSize + Math.sin(t * 40) * 3, 8, 18); ctx.fill();
      ctx.fillStyle = "#fff0a8";
      ctx.beginPath(); ctx.moveTo(-4, 18); ctx.quadraticCurveTo(0, 18 + 9 * flameSize, 4, 18); ctx.fill();
      face(ctx, { eyeY: -5, eyeGap: 3.4, eyeR: 2.4, mouth, scale: 1, color: "#2d2a55" });
      break;
    }
    default: {
      const grad = ctx.createLinearGradient(-24, -24, 24, 24);
      grad.addColorStop(0, "#7fd0ff"); grad.addColorStop(1, "#2f8fe6");
      ctx.fillStyle = grad; rounded(ctx, -24, -24, 48, 48, 12); ctx.fill();
      ctx.strokeStyle = "#1d5fa6"; ctx.lineWidth = 3; rounded(ctx, -24, -24, 48, 48, 12); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 2.5; rounded(ctx, -17, -17, 34, 34, 8); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.35)"; rounded(ctx, -19, -19, 16, 8, 4); ctx.fill();
      face(ctx, { eyeY: -2, eyeGap: 8, eyeR: 5, mouth });
    }
  }
}

/** Rotation strategy per character, so a dino does not spin like a cube. */
export function characterRotation(id, { rot, vy, mode }) {
  if (mode === "fly") return Math.max(-0.5, Math.min(0.5, vy / 900));
  if (id === "cubinho" || id === "estrelinha") return rot;
  return Math.max(-0.45, Math.min(0.45, vy / 1300));
}
