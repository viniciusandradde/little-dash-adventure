import { WORLDS } from "../config.js";

export const LEVELS = WORLDS.flatMap((world, worldIndex) =>
  world.levels.map((name, levelIndex) => {
    const progressionIndex = worldIndex * world.levels.length + levelIndex;
    return {
      id: `${world.id}-${levelIndex}`,
      worldId: world.id,
      worldIndex,
      levelIndex,
      progressionIndex,
      name,
      duration: 38 + levelIndex * 2,
      obstacleCount: 4 + levelIndex,
      starCount: 5,
      // A gentle, predictable curve across all 12 adventures.
      obstacleSpacing: Math.round(620 - progressionIndex * (140 / 11)),
      firstObstacle: 460,
      starLead: Math.round(190 - progressionIndex * (45 / 11)),
      cueDistance: 220
    };
  })
);

export function getLevel(id) {
  return LEVELS.find((level) => level.id === id) ?? LEVELS[0];
}
