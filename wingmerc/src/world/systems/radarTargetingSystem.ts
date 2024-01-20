import * as Guns from '../../data/guns';
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core"
import { queries, world } from "../world"
import { AngleBetweenVectors, ToDegree, Vector3FromObj, firstOrderIntercept } from "../../utils/math"
import { Gun } from '../../data/guns/gun';


// const TARGET_LOCK_SPEED = 120 // degrees per second
export function radarTargetingSystem(dt: number) {
  for (const entity of queries.targeting) {
    const { direction, position, targeting } = entity
    if (targeting == undefined) {
      continue
    }
    if (targeting.locked) {
      if (world.entity(targeting.target) == undefined) {
        targeting.locked = false
        targeting.target = -1
        world.update(entity, "targeting", targeting)
        continue
      } else {
        continue
      }
    }
    // FOR NOW: assuming a target sparse environment, we will just check locking against every enemy
    const entityId = world.id(entity)
    
    const entityDirection = Vector3FromObj(direction)
    const entityPosition = Vector3FromObj(position)
    let smallestDistance = Number.MAX_SAFE_INTEGER
    let closestTarget: number = -1
    let holdTarget: boolean = false
    for (const target of queries.targets.entities) {
      const targetId = world.id(target)
      const targetPosition = Vector3FromObj(target.position)
      if (entityId == targetId) {
        continue
      }
      const directionToTarget = targetPosition.subtract(entityPosition).normalize()
      const delta = AngleBetweenVectors(entityDirection, directionToTarget)
      if (ToDegree(delta) > 45) {
        // this isn't a valid target
        continue
      }
      if (delta < smallestDistance) {
        smallestDistance = delta
        closestTarget = targetId
      }
      if (targeting.target == targetId) {
        holdTarget = true
      }
    }
    if (targeting.target != closestTarget && !holdTarget) {
      // reset target time when target changes
      targeting.targetingTime = 0
    }
    if (!holdTarget) {
      console.log("[RadarTargeting] target", closestTarget)
      targeting.target = closestTarget
      world.update(entity, "targeting", targeting)
    }
  }
}
