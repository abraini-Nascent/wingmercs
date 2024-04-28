import { Vector3 } from "@babylonjs/core";
import { QuaternionFromObj, Vector3FromObj } from "../../../utils/math";
import { rand, randomItem } from "../../../utils/random";
import { Entity, FireCommand, queries, world } from "../../world";
import { SteeringHardTurnClamp, calculateSteering } from "./basicSteering";
import { AppContainer } from "../../../app.container";
import * as Ships from '../../../data/ships';

export function basicCombatAI(entity: Entity, dt: number) {
  const { ai, position, rotationQuaternion } = entity;

  // TODO: we should have another way to target what ship to track
  // get the player ship
  let targetEntity: Entity = AppContainer.instance.player?.playerEntity as Entity
  const { blackboard } = ai;
  if (targetEntity == undefined) {
    // pick a random other ai
    if (blackboard.target == undefined) {
      const possibleEnemies: Entity[] = []
      for (const ai of queries.ai) {
        if (ai != entity) {
          possibleEnemies.push(ai)
        }
      }
      if (possibleEnemies.length > 0) {
        const enemy = randomItem(possibleEnemies) as Entity
        blackboard.target = enemy
        targetEntity = enemy
      }
    } else {
      targetEntity = blackboard.target
    }
  }
  if (world.has(targetEntity) == false) {
    blackboard.target = undefined
    return
  }
  
  const vectorToTarget = Vector3FromObj(position).subtract(Vector3FromObj(targetEntity.position))
  const distanceToTarget = vectorToTarget.length()
  if (distanceToTarget < 250 && !blackboard["backoff"]) {
    blackboard["backoff"] = true
    console.log("[AI] Backing Off")
  }
  // TODO: this should be where the enemy would intercept the player with guns, not where the player is currently
  let targetPosition = Vector3FromObj(targetEntity.position)
  if (blackboard["backoff"] && blackboard["backoffTarget"]) {
    const backoffTarget = blackboard["backoffTarget"]
    const distanceToBackoff = Vector3FromObj(position).subtract(backoffTarget).length()
    if (distanceToBackoff < 200 || distanceToTarget > 1500) {
      blackboard["backoff"] = false
      blackboard["backoffTarget"] = undefined
      console.log("[AI] Making attack run")
    } else {
      targetPosition = backoffTarget
    }
  } else if (blackboard["backoff"] && blackboard["backoffTarget"] == undefined) {
    // too close break off to behind the player
    const forward = Vector3.Forward(true)
    forward.applyRotationQuaternionInPlace(QuaternionFromObj(targetEntity.rotationQuaternion))
    const playerDirection = forward.normalizeToNew()
    const behindPlayerDirection = playerDirection.multiplyByFloats(-1, -1, -1)
    const behindPlayerTarget = behindPlayerDirection.multiplyByFloats(1000, 1000, 1000)
    
    targetPosition = Vector3FromObj(behindPlayerTarget)
    blackboard["backoffTarget"] = targetPosition
  }
  // TODO: if we are being chased we should after burner away before trying to turn back towards the player
  // TODO: if we need to do large turns we should apply brakes while turning
  let input = calculateSteering(dt, Vector3FromObj(position), QuaternionFromObj(rotationQuaternion), targetPosition, SteeringHardTurnClamp) //SteeringHardNormalizeClamp)
  // console.log(`[AI] steering`, input)
  let cinamaticRoll = 0
  if (blackboard["backoff"] == false && Math.abs(input.pitch) < 0.1 && Math.abs(input.yaw) < 0.1) {
    let gun = 0
    let weapon = 0
    let lock = false
    if (entity.targeting.locked == false) {
      lock = true
    }
    if (distanceToTarget < 1600) {
      gun = 1
    }
    if (distanceToTarget > 2000) {
      if (entity.weapons.mounts[0].count > 0 && rand(0, 1) < (0.3 * (dt / 1000))) { // 30% per second
        weapon = 1
      }
    }
    if (gun || weapon || lock) {
      const command = {
        gun,
        weapon
      } as FireCommand
      if (lock) {
        command.lock = lock
      }
      world.update(entity, "fireCommand", command)
    }
  }
  const brake = Math.abs(input.pitch) > 0.9 || Math.abs(input.yaw) > 0.9 ? 1 : 0
  let afterburner = 0
  if (!brake && blackboard["backoff"] && distanceToTarget > 500) {
    afterburner = 1
  }
  const shipTemplateName = entity.planeTemplate
  const shipTemplate: { cruiseSpeed: number } = Ships[shipTemplateName] ?? Ships.EnemyLight01
  world.update(entity, "rotationalVelocity", input)
  world.update(entity, "setSpeed", entity.engine.cruiseSpeed)
  world.update(entity, "movementCommand", {
    pitch: input.pitch,
    yaw: input.yaw,
    roll: cinamaticRoll,
    deltaSpeed: 0,
    afterburner: afterburner,
    brake: brake,
    drift: 0,
  })
}