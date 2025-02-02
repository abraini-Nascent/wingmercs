import { Entity, MovementCommand, SetComponent } from "../../world"

export function deathRattleAI(entity: Entity, dt: number) {
  let movementCommand = {
    pitch: 1,
    yaw: 0,
    roll: 1,
    deltaSpeed: 100,
    // afterburner: 1,
    // brake: brake,
    brake: 0,
    drift: 0,
  } as MovementCommand
  SetComponent(entity, "movementCommand", movementCommand)
}
