import { WORLDS } from "../config.js";

export const LEVELS = WORLDS.flatMap((world, worldIndex) =>
  world.levels.map((name, levelIndex) => ({
    id: `${world.id}-${levelIndex}`,
    worldId: world.id,
    worldIndex,
    levelIndex,
    name,
    duration: 38 + levelIndex * 2,
    obstacleCount: 4 + levelIndex,
    starCount: 5
  }))
);

export function getLevel(id) {
  return LEVELS.find((level) => level.id === id) ?? LEVELS[0];
}
