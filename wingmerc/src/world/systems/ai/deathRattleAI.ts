import { Entity, MovementCommand, world } from "../../world"

export function deathRattleAI(entity: Entity, dt: number) {
  let movementCommand = {
    pitch: 0,
    yaw: 0,
    roll: 0,
    deltaSpeed: 100,
    // afterburner: 1,
    // brake: brake,
    brake: 0,
    drift: 0,
  } as MovementCommand
  world.update(entity, "movementCommand", movementCommand)
}