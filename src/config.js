const BASE_URL = import.meta.env?.BASE_URL ?? "/";

/**
 * Logical physics space. The canvas is always scaled so that the visible
 * height equals `viewHeight`; every constant below lives in that space and
 * never depends on the real pixel size of the device.
 */
export const PHYSICS = Object.freeze({
  viewHeight: 360,
  groundY: 288,
  ceilingY: 34,
  unit: 34,
  playerSize: 34,
  gravity: 2200,
  jumpVelocity: -760,
  padVelocity: -960,
  orbVelocity: -700,
  bounceVelocity: -660,
  speeds: Object.freeze({ slow: 215, normal: 270, fast: 335 }),
  flyGravity: 1100,
  flyLift: -2000,
  flyMaxVelocity: 430,
  inputBuffer: 0.16,
  coyoteTime: 0.1,
  invulnerableTime: 1.1,
  fixedStep: 1 / 120,
  maxStepsPerFrame: 10,
  cameraAnchor: 0.3
});

export const CHARACTERS = [
  { id: "cubinho", name: "Cubinho", color: "#4fb0ff", accent: "#2a7fd6", tagline: "Curioso e corajoso" },
  { id: "dino", name: "Dino", color: "#5fcc74", accent: "#3a9a52", tagline: "Explorador divertido" },
  { id: "estrelinha", name: "Estrelinha", color: "#ffd24d", accent: "#f0a21c", tagline: "Cheia de energia" },
  { id: "foguetinho", name: "Foguetinho", color: "#ff7f74", accent: "#d9483f", tagline: "Sonhador espacial" }
];

export const WORLDS = [
  {
    id: "candy",
    name: "Reino dos Doces",
    emoji: "🍭",
    color: "#ff8fc4",
    background: `${BASE_URL}assets/worlds/candy-kingdom.webp`,
    levels: ["Nuvens de Algodão", "Ponte de Chocolate", "Castelo de Pirulitos"],
    stickers: ["🧁", "🍫", "🍭"]
  },
  {
    id: "dino",
    name: "Ilha dos Dinossauros",
    emoji: "🦕",
    color: "#7fd28f",
    background: `${BASE_URL}assets/worlds/dinosaur-island.webp`,
    levels: ["Vale dos Ovinhos", "Floresta Amiga", "Vulcão de Sorvete"],
    stickers: ["🥚", "🌴", "🌋"]
  },
  {
    id: "ocean",
    name: "Fundo do Mar",
    emoji: "🐠",
    color: "#63cbe8",
    background: `${BASE_URL}assets/worlds/underwater.webp`,
    levels: ["Bolhas Mágicas", "Jardim de Coral", "Tesouro da Tartaruga"],
    stickers: ["🫧", "🪸", "🐢"]
  },
  {
    id: "space",
    name: "Aventura Espacial",
    emoji: "🚀",
    color: "#9d8dff",
    background: `${BASE_URL}assets/worlds/space-adventure.webp`,
    levels: ["Lua de Queijo", "Anéis de Saturno", "Estação das Estrelas"],
    stickers: ["🌙", "🪐", "🛰️"]
  }
];

/** Visual palette used by the renderer for each world. */
export const THEMES = {
  candy: {
    groundTop: "#ffd9ec", groundBody: "#b56a3c", groundDark: "#8a4a2a", groundLine: "#ffffff",
    hazard: "#ff5fa2", hazardDark: "#c8306f", block: "#f7b2d0", blockDark: "#d97aa6", blockLight: "#ffe3f1",
    platform: "#ffd166", platformDark: "#e0a62f", decor: ["#ff9ecb", "#ffd166", "#8ad3ff", "#c3f0a5"],
    sky: "#ffe9f5", glow: "#fff2a8", pit: "#5c2f1b", particle: "#ffffff"
  },
  dino: {
    groundTop: "#9bdc7a", groundBody: "#8a5a3c", groundDark: "#60402a", groundLine: "#d5f5bc",
    hazard: "#4fae5c", hazardDark: "#2d7d3a", block: "#b8b2a2", blockDark: "#857f6f", blockLight: "#e3ded0",
    platform: "#a86f3f", platformDark: "#7e4f2a", decor: ["#6fcf7a", "#f5d47a", "#f08a5d", "#bde6a5"],
    sky: "#e8f8df", glow: "#fff2a8", pit: "#3d2a1b", particle: "#f5f0d4"
  },
  ocean: {
    groundTop: "#ffe9b8", groundBody: "#e5c58c", groundDark: "#b89a64", groundLine: "#fff8e5",
    hazard: "#7c5cff", hazardDark: "#5236c9", block: "#ff9d85", blockDark: "#d9695a", blockLight: "#ffc9b8",
    platform: "#f5f0ff", platformDark: "#c8bde6", decor: ["#59d4b3", "#ff9d85", "#ffd166", "#7fd4ff"],
    sky: "#cdefff", glow: "#d7fff6", pit: "#1b4e7a", particle: "#dff8ff"
  },
  space: {
    groundTop: "#cbbfff", groundBody: "#5b4a8f", groundDark: "#3c2f63", groundLine: "#efe9ff",
    hazard: "#59e3ff", hazardDark: "#2b9ec4", block: "#8f87b3", blockDark: "#5d567c", blockLight: "#c6c0e6",
    platform: "#ffb86b", platformDark: "#d98634", decor: ["#ff8fd0", "#59e3ff", "#ffd166", "#bba6ff"],
    sky: "#1d1446", glow: "#ffe9a3", pit: "#140c2e", particle: "#ffffff"
  }
};

/**
 * Recorded soundtracks (generated for this project, bundled locally so the game
 * stays offline). Any world without an entry falls back to the procedural
 * sequencer in services/audio.js.
 */
export const MUSIC_TRACKS = {
  candy: `${BASE_URL}assets/music/candy.mp3`,
  dino: `${BASE_URL}assets/music/dino.mp3`,
  ocean: `${BASE_URL}assets/music/ocean.mp3`,
  space: `${BASE_URL}assets/music/space.mp3`
};

export const RATING = Object.freeze({
  twoStarsRatio: 0.45,
  threeStarsRatio: 0.75
});
