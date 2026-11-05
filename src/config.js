export const GAME_CONFIG = Object.freeze({
  version: 1,
  durationSeconds: 42,
  baseSpeed: 150,
  jumpVelocity: -470,
  gravity: 1050,
  assistDistance: 185,
  playerSize: 42,
  targetFps: 60
});

export const CHARACTERS = [
  { id: "cubinho", name: "Cubinho", emoji: "🟦", color: "#54b7ff" },
  { id: "dino", name: "Dino", emoji: "🦖", color: "#65c978" },
  { id: "estrelinha", name: "Estrelinha", emoji: "⭐", color: "#ffd45e" },
  { id: "foguetinho", name: "Foguetinho", emoji: "🚀", color: "#ff8e85" }
];

export const WORLDS = [
  { id: "candy", name: "Reino dos Doces", emoji: "🍭", color: "#ff9ecb", levels: ["Nuvens de Algodão", "Ponte de Chocolate", "Castelo de Pirulitos"] },
  { id: "dino", name: "Ilha dos Dinossauros", emoji: "🦕", color: "#8edc9b", levels: ["Vale dos Ovinhos", "Floresta Amiga", "Vulcão de Sorvete"] },
  { id: "ocean", name: "Fundo do Mar", emoji: "🐠", color: "#75d5ed", levels: ["Bolhas Mágicas", "Jardim de Coral", "Tesouro da Tartaruga"] },
  { id: "space", name: "Aventura Espacial", emoji: "🚀", color: "#a99aff", levels: ["Lua de Queijo", "Anéis de Saturno", "Estação das Estrelas"] }
];
