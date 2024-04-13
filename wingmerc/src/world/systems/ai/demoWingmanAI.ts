import { Vector3 } from "@babylonjs/core";
import { Entity, MovementCommand, queries, world } from "../../world";
import { SteeringBehaviours, SteeringHardTurnClamp } from "./steeringBehaviours";

export function demoWingmanAI(entity: Entity, dt: number) {
  const { ai, position, rotationQuaternion} = entity;
  const { blackboard } = ai
  let movementCommand = {
    pitch: 0,
    yaw: 0,
    roll: 0,
    deltaSpeed: 0,
    afterburner: 0,
    brake: 0,
    drift: 0,
  } as MovementCommand

  if (blackboard.leader == undefined) {
    // find a leader
    let leader = queries.ai.entities.filter((other) => { 
      return other != entity
    }).shift()
    if (leader != undefined) {
      blackboard.leader = leader
      blackboard.offset = new Vector3(50, -50, 50)
    }
  }
  let steering = SteeringBehaviours.offsetPursuit(dt, entity, blackboard.leader as Entity, blackboard.offset as Vector3, SteeringHardTurnClamp)
  
  console.log(`[AI wingman] steering:`, steering)
  movementCommand.pitch = steering.pitch
  movementCommand.yaw = steering.yaw
  movementCommand.roll = steering.roll
  movementCommand.deltaSpeed = steering.throttle ?? 0
  movementCommand.afterburner = steering.boost ? 1 : 0
  world.update(entity, "movementCommand", movementCommand)
}