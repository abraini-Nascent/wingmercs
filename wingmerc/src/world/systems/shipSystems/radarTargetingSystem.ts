import { EntityForId, EntityUUID, SetComponent } from "./../../world"
import { queries } from "../../world"
import { AngleBetweenVectors, ToDegree, Vector3FromObj } from "../../../utils/math"
import { random } from "../../../utils/random"

// const TARGET_LOCK_SPEED = 120 // degrees per second
export function radarTargetingSystem(dt: number) {
  for (const entity of queries.targeting) {
    const { direction, position, targeting } = entity
    if (targeting == undefined) {
      continue
    }
    if (targeting.locked) {
      if (EntityForId(targeting.target) == undefined) {
        targeting.locked = false
        targeting.target = ""
        SetComponent(entity, "targeting", targeting)
        continue
      } else {
        if (entity.inHazard && entity.inHazard.nebula) {
          if (random() < 0.1 * (dt / 1000)) {
            // 10% chance per second of loosing a lock in a nebula
            targeting.locked = false
            targeting.target = ""
            SetComponent(entity, "targeting", targeting)
          }
        }
        continue
      }
    }
    // FOR NOW: assuming a target sparse environment, we will just check locking against every enemy
    const entityId = entity.id

    const entityDirection = Vector3FromObj(direction)
    const entityPosition = Vector3FromObj(position)
    let smallestDistance = Number.MAX_SAFE_INTEGER
    let closestTarget: EntityUUID = ""
    let holdTarget: boolean = false
    for (const target of queries.targets.entities) {
      const targetId = target.id
      const targetPosition = Vector3FromObj(target.position)
      if (entityId == targetId) {
        continue
      }
      if (target.isTargetable == "nav") {
        // don't auto target nav beacons
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
      targeting.timeToLock = -1
    }
    if (!holdTarget) {
      // console.log("[RadarTargeting] target", closestTarget)
      targeting.target = closestTarget
      SetComponent(entity, "targeting", targeting)
    }
  }
}
